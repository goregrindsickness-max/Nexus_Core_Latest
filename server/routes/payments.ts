import express from 'express';
import path from 'path';
import fs from 'fs';
import Stripe from 'stripe';
import {
  getSupabaseService,
  getVaultSecret,
  getUserOwnedEntityIds,
  assertBandOrEntityOwner,
  hasAnyOwnershipMatch,
} from '../lib/supabaseAdmin';
import {
  getStripeAsync,
  uploadsDir,
} from '../lib/clients';
import {
  requireAuth,
} from '../middleware/auth';
import {
  resolveSafeAppOrigin,
  resolveSafeRedirectUrl,
  paymentLimiter,
  apiMutationLimiter,
} from '../middleware/security';

export const paymentsRouter = express.Router();

const processedWebhookEventIds = new Set<string>();

export function resetProcessedWebhookEvents(): void {
  processedWebhookEventIds.clear();
}

// ============================================================
// STRIPE WEBHOOK LISTENER (RAW BUFFER REQUIRED)
// ============================================================
paymentsRouter.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret =
      (await getVaultSecret('stripe_webhook_secret')) || process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = await getStripeAsync();

    if (!stripe) {
      return res.status(400).send('Stripe not configured.');
    }
    if (!webhookSecret) {
      console.error('[STRIPE WEBHOOK REJECTED]: STRIPE_WEBHOOK_SECRET is not configured.');
      return res.status(503).json({
        error: 'Webhook signature verification secret is not configured on this server.',
      });
    }
    if (!sig || typeof sig !== 'string') {
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Idempotency guard: prevent duplicate webhook events from crediting orders or escrow twice
    if (event.id && processedWebhookEventIds.has(event.id)) {
      return res.json({ received: true, duplicate: true });
    }

    const supabase = getSupabaseService();

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId || session.client_reference_id;
          const tier = session.metadata?.tier || 'pro';
          const customerId = session.customer as string;
          const subscriptionId = session.subscription as string;
          const orderId = session.metadata?.orderId;
          const escrowId = session.metadata?.escrowId || session.metadata?.contractId;
          const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : 0;

          console.log(`[STRIPE WEBHOOK] Checkout completed for user: ${userId}, Tier: ${tier}`);

          if (supabase && userId) {
            await supabase
              .from('profiles')
              .update({
                subscription_tier: tier,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                subscription_status: 'active',
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId);
          }

          if (supabase && orderId) {
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .maybeSingle();

            if (existingOrder && existingOrder.status !== 'paid' && existingOrder.status !== 'completed') {
              await supabase
                .from('orders')
                .update({
                  status: 'paid',
                  credited_amount: (Number(existingOrder.credited_amount) || 0) + amountTotal,
                  stripe_session_id: session.id,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);
            }
          }

          if (supabase && escrowId) {
            const { data: existingEscrow } = await supabase
              .from('creative_contracts_v1')
              .select('*')
              .eq('id', escrowId)
              .maybeSingle();

            if (
              existingEscrow &&
              existingEscrow.status !== 'escrow_funded' &&
              existingEscrow.status !== 'released'
            ) {
              await supabase
                .from('creative_contracts_v1')
                .update({
                  status: 'escrow_funded',
                  escrow_credited_amount:
                    (Number(existingEscrow.escrow_credited_amount) || 0) + amountTotal,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', escrowId);
            }
          }
          break;
        }
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          const status = subscription.status;

          console.log(`[STRIPE WEBHOOK] Subscription ${subscription.id} updated to status: ${status}`);

          if (supabase && customerId) {
            await supabase
              .from('profiles')
              .update({
                subscription_status: status,
                subscription_tier:
                  status === 'active' || status === 'trialing' ? undefined : 'free',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', customerId);
          }
          break;
        }
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata?.orderId;
          const escrowId = paymentIntent.metadata?.escrowId || paymentIntent.metadata?.contractId;
          const amount = typeof paymentIntent.amount === 'number' ? paymentIntent.amount : 0;

          console.log(`[STRIPE WEBHOOK] PaymentIntent succeeded: ${paymentIntent.id}`);

          if (supabase && orderId) {
            const { data: existingOrder } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .maybeSingle();

            if (existingOrder && existingOrder.status !== 'paid' && existingOrder.status !== 'completed') {
              await supabase
                .from('orders')
                .update({
                  status: 'paid',
                  credited_amount: (Number(existingOrder.credited_amount) || 0) + amount,
                  payment_intent_id: paymentIntent.id,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', orderId);
            }
          }

          if (supabase && escrowId) {
            const { data: existingEscrow } = await supabase
              .from('creative_contracts_v1')
              .select('*')
              .eq('id', escrowId)
              .maybeSingle();

            if (
              existingEscrow &&
              existingEscrow.status !== 'escrow_funded' &&
              existingEscrow.status !== 'released'
            ) {
              await supabase
                .from('creative_contracts_v1')
                .update({
                  status: 'escrow_funded',
                  escrow_credited_amount:
                    (Number(existingEscrow.escrow_credited_amount) || 0) + amount,
                  payment_intent_id: paymentIntent.id,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', escrowId);
            }
          }
          break;
        }
        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const orderId = paymentIntent.metadata?.orderId;
          if (supabase && orderId) {
            await supabase
              .from('orders')
              .update({
                status: 'failed',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          }
          break;
        }
        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session;
          const orderId = session.metadata?.orderId;
          if (supabase && orderId) {
            await supabase
              .from('orders')
              .update({
                status: 'expired',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);
          }
          break;
        }
        default:
          console.log(`[STRIPE WEBHOOK] Unhandled event type ${event.type}`);
      }

      if (event.id) {
        processedWebhookEventIds.add(event.id);
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error(`[STRIPE WEBHOOK] Error processing event: ${err.message}`);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }
);

// ============================================================
// STRIPE ESCROW, CONNECT & PAYMENT INTENTS
// ============================================================
paymentsRouter.post(
  '/api/payments/create-escrow-intent',
  requireAuth,
  paymentLimiter,
  async (req, res) => {
    try {
      const { amount, currency = 'usd', connectAccountId } = req.body;
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500000) {
        return res.status(400).json({ error: 'Invalid escrow amount.' });
      }
      if (
        connectAccountId &&
        (typeof connectAccountId !== 'string' || !/^acct_[a-zA-Z0-9_]+$/.test(connectAccountId))
      ) {
        return res.status(400).json({ error: 'Invalid Stripe Connect account format.' });
      }

      const stripe = await getStripeAsync();
      if (!stripe) {
        return res.status(500).json({ error: 'Stripe is not configured on the server.' });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.max(50, Math.round(numericAmount * 100)),
        currency: String(currency || 'usd').toLowerCase(),
        capture_method: 'manual',
        metadata: {
          userId: req.authUser!.id,
          connectAccountId: connectAccountId ? String(connectAccountId) : '',
          type: 'escrow',
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);

paymentsRouter.post(
  '/api/payments/create-connect-account',
  requireAuth,
  paymentLimiter,
  async (req, res) => {
    try {
      const stripe = await getStripeAsync();
      if (!stripe) {
        return res.status(500).json({ error: 'Stripe is not configured.' });
      }

      const safeOrigin = resolveSafeAppOrigin(req);
      const account = await stripe.accounts.create({
        type: 'express',
        metadata: {
          userId: req.authUser!.id,
          email: req.authUser!.email || '',
        },
      });

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${safeOrigin}/dev/dashboard?connect_fail=1`,
        return_url: `${safeOrigin}/dev/dashboard?connect_success=1`,
        type: 'account_onboarding',
      });

      res.json({ url: accountLink.url, accountId: account.id });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);

paymentsRouter.post(
  '/api/payments/release-escrow',
  requireAuth,
  paymentLimiter,
  async (req, res) => {
    try {
      const { amount, connectAccountId, contractId } = req.body;
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500000) {
        return res.status(400).json({ error: 'Invalid release amount.' });
      }

      if (
        !connectAccountId ||
        typeof connectAccountId !== 'string' ||
        !/^acct_[a-zA-Z0-9_]+$/.test(connectAccountId)
      ) {
        return res.status(400).json({
          error: 'Missing or invalid connectAccountId. The creative must have a linked Stripe Connect account.',
        });
      }

      if (contractId && !req.authUser!.isAdmin) {
        const sb = getSupabaseService();
        if (sb) {
          const { data: contract } = await sb
            .from('creative_contracts_v1')
            .select('id, band_id, client_id, creative_id, payer_id, created_by')
            .eq('id', String(contractId))
            .maybeSingle();

          if (contract) {
            const ownedIds = await getUserOwnedEntityIds(sb, req.authUser!);
            const isParty = hasAnyOwnershipMatch(req.authUser!, ownedIds, [
              contract.band_id,
              contract.client_id,
              contract.creative_id,
              contract.payer_id,
              contract.created_by,
            ]);
            if (!isParty) {
              return res.status(403).json({
                error: 'Forbidden: You are not an authorized party to this escrow contract.',
              });
            }
          }
        }
      }

      const stripe = await getStripeAsync();
      if (!stripe) {
        return res.status(500).json({ error: 'Stripe is not configured on the server.' });
      }

      const amountInCents = Math.max(50, Math.round(numericAmount * 100));
      const feeInCents = Math.round(amountInCents * 0.0777);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method: 'pm_card_visa',
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        transfer_data: {
          destination: connectAccountId,
        },
        application_fee_amount: feeInCents,
        description: 'Escrow Release from Platform Client',
        metadata: {
          releasedByUserId: req.authUser!.id,
          contractId: contractId ? String(contractId) : '',
        },
      });

      res.json({ success: true, transferId: paymentIntent.id });
    } catch (e: any) {
      console.error('Escrow Release Error:', e);
      res.status(500).json({ error: e.message });
    }
  }
);

paymentsRouter.post(
  '/api/payments/create-payment-intent',
  requireAuth,
  paymentLimiter,
  async (req, res) => {
    try {
      const { amount, currency = 'usd', metadata = {} } = req.body;
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500000) {
        return res.status(400).json({ error: 'Invalid payment amount.' });
      }

      const stripe = await getStripeAsync();
      if (!stripe) {
        return res.status(503).json({ error: 'Stripe is not configured on the server.' });
      }

      const amountInCents = Math.max(50, Math.round(numericAmount * 100));
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: String(currency || 'usd').toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
          userId: req.authUser!.id,
          app: 'Nexus-Core',
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (e: any) {
      console.error('[STRIPE PAYMENT INTENT ERROR]:', e);
      res.status(500).json({ error: e.message || 'Failed to create payment intent.' });
    }
  }
);

paymentsRouter.post(
  '/api/payments/create-cart-checkout',
  requireAuth,
  paymentLimiter,
  async (req, res) => {
    try {
      const {
        cartItems = [],
        customerEmail,
        stripeCustomerId,
        orderType = 'cart',
        shippingCost = 0,
        taxAmount = 0,
        successUrl,
        cancelUrl,
      } = req.body;

      const userId = req.authUser!.id;

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty.' });
      }

      const stripe = await getStripeAsync();
      const safeOrigin = resolveSafeAppOrigin(req);

      if (!stripe) {
        return res.status(503).json({ error: 'Stripe is not configured on the server.' });
      }

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems
        .slice(0, 50)
        .map((item: any) => {
          const itemPrice = Math.min(50000, Math.max(0.5, Number(item.price) || 15));
          const unitAmountCents = Math.max(50, Math.round(itemPrice * 100));
          const qty = Math.min(100, Math.max(1, Number(item.quantity) || 1));
          const itemTitle = String(item.title || item.name || 'Nexus Core Item').slice(0, 120);
          const itemSubtitle = [
            item.bandName || item.band,
            item.selectedSize ? `Size: ${item.selectedSize}` : null,
            item.type === 'ticket' ? 'Digital Event Pass' : 'Official Merch',
          ]
            .filter(Boolean)
            .join(' • ');

          const validImages =
            item.image && typeof item.image === 'string' && item.image.startsWith('https://')
              ? [item.image]
              : undefined;

          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: itemTitle,
                description: itemSubtitle || 'Nexus Core Official Order',
                images: validImages,
              },
              unit_amount: unitAmountCents,
            },
            quantity: qty,
          };
        });

      const cleanShipping = Math.min(500, Math.max(0, Number(shippingCost) || 0));
      if (cleanShipping > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Standard Shipping & Handling',
              description: 'Tracked Merchandise Fulfillment',
            },
            unit_amount: Math.round(cleanShipping * 100),
          },
          quantity: 1,
        });
      }

      const cleanTax = Math.min(5000, Math.max(0, Number(taxAmount) || 0));
      if (cleanTax > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Estimated Taxes & Service Fees',
              description: 'Platform Processing & Local Tax',
            },
            unit_amount: Math.round(cleanTax * 100),
          },
          quantity: 1,
        });
      }

      const hasPhysicalMerch = cartItems.some((item: any) => item.type !== 'ticket');

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        line_items: lineItems,
        mode: 'payment',
        client_reference_id: userId || undefined,
        metadata: {
          userId: userId || '',
          orderType,
          itemCount: String(cartItems.length),
          app: 'Nexus-Core',
        },
        success_url: resolveSafeRedirectUrl(
          successUrl,
          safeOrigin,
          `/?checkout_success=1&order_type=${encodeURIComponent(String(orderType))}&session_id={CHECKOUT_SESSION_ID}`
        ),
        cancel_url: resolveSafeRedirectUrl(cancelUrl, safeOrigin, `/?checkout_canceled=1`),
      };

      if (hasPhysicalMerch) {
        sessionParams.shipping_address_collection = {
          allowed_countries: ['US', 'CA', 'GB', 'DE', 'AU', 'MX', 'FR', 'JP'],
        };
      }

      const verifiedEmail = req.authUser!.email || customerEmail;
      if (stripeCustomerId && typeof stripeCustomerId === 'string' && stripeCustomerId.startsWith('cus_')) {
        sessionParams.customer = stripeCustomerId;
      } else if (verifiedEmail) {
        sessionParams.customer_email = verifiedEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url, sessionId: session.id });
    } catch (e: any) {
      console.error('[STRIPE CART CHECKOUT ERROR]:', e);
      res.status(500).json({ error: e.message || 'Failed to create cart checkout session.' });
    }
  }
);

paymentsRouter.post(
  '/api/payments/create-billing-checkout',
  requireAuth,
  paymentLimiter,
  async (req, res) => {
    try {
      const {
        price = 0,
        tierName = 'Nexus Core Membership',
        tier = 'pro',
        interval = 'month',
        mode = 'subscription',
        customerEmail,
        stripeCustomerId,
        priceId,
        metadata = {},
        successUrl,
        cancelUrl,
      } = req.body;

      const userId = req.authUser!.id;
      const stripe = await getStripeAsync();
      const safeOrigin = resolveSafeAppOrigin(req);

      if (!stripe) {
        console.warn('[STRIPE BILLING]: STRIPE_SECRET_KEY not set. Using simulated checkout redirect.');
        return res.json({
          simulated: true,
          url: `${safeOrigin}/?billing_success=1&tier=${encodeURIComponent(tier)}&price=${encodeURIComponent(price)}&simulated=true`,
          sessionId: `sim_cs_${Date.now()}`,
        });
      }

      const amountInCents = Math.max(50, Math.round(Number(price) * 100));
      const isSubscription = mode === 'subscription';

      let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

      if (priceId && typeof priceId === 'string' && priceId.startsWith('price_')) {
        lineItem = {
          price: priceId,
          quantity: 1,
        };
      } else {
        lineItem = {
          price_data: {
            currency: 'usd',
            product_data: {
              name: String(tierName).slice(0, 120),
              description: isSubscription
                ? `Nexus Core // ${tierName} (${interval === 'year' ? 'Annual' : 'Monthly'} Subscription)`
                : `Nexus Core // ${tierName}`,
            },
            unit_amount: amountInCents,
            ...(isSubscription
              ? {
                  recurring: {
                    interval: interval === 'year' ? 'year' : 'month',
                  },
                }
              : {}),
          },
          quantity: 1,
        };
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: [lineItem],
        mode: isSubscription ? 'subscription' : 'payment',
        client_reference_id: userId || undefined,
        metadata: {
          userId: userId || '',
          tier: String(tier || 'pro'),
          tierName: String(tierName || ''),
          interval: String(interval || 'month'),
          app: 'Nexus-Core',
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
        },
        success_url: resolveSafeRedirectUrl(
          successUrl,
          safeOrigin,
          `/?billing_success=1&tier=${encodeURIComponent(String(tier))}&session_id={CHECKOUT_SESSION_ID}`
        ),
        cancel_url: resolveSafeRedirectUrl(
          cancelUrl,
          safeOrigin,
          `/?billing_canceled=1&tier=${encodeURIComponent(String(tier))}`
        ),
      };

      const verifiedEmail = req.authUser!.email || customerEmail;
      if (stripeCustomerId && typeof stripeCustomerId === 'string' && stripeCustomerId.startsWith('cus_')) {
        sessionParams.customer = stripeCustomerId;
      } else if (verifiedEmail) {
        sessionParams.customer_email = verifiedEmail;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url, sessionId: session.id });
    } catch (e: any) {
      console.error('[STRIPE BILLING CHECKOUT ERROR]:', e);
      res.status(500).json({ error: e.message });
    }
  }
);

paymentsRouter.post('/api/checkout/create-intent', requireAuth, paymentLimiter, async (req, res) => {
  try {
    const {
      amount,
      currency = 'usd',
      bandName,
      itemsCount,
      shippingDetails,
      stripeAccountId,
    } = req.body;
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 500000) {
      return res.status(400).json({ error: 'Invalid payment amount.' });
    }
    if (
      stripeAccountId &&
      (typeof stripeAccountId !== 'string' || !/^acct_[a-zA-Z0-9_]+$/.test(stripeAccountId))
    ) {
      return res.status(400).json({ error: 'Invalid destination Stripe account format.' });
    }

    const stripe = await getStripeAsync();
    if (!stripe) {
      return res.json({
        simulated: true,
        clientSecret: `pi_simulated_secret_${Date.now()}`,
        message: 'Running in simulated payment mode (No STRIPE_SECRET_KEY configured).',
      });
    }

    const amountInCents = Math.max(50, Math.round(numericAmount * 100));
    const platformFeeInCents = Math.round(amountInCents * 0.05);

    const intentConfig: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: String(currency || 'usd').toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      description: `Nexus Core Merch Store // ${String(bandName || 'Artist').slice(0, 80)} (${Number(itemsCount) || 1} items)`,
      metadata: {
        userId: req.authUser!.id,
        bandName: String(bandName || 'Unknown').slice(0, 80),
        customerEmail: req.authUser!.email || shippingDetails?.email || 'N/A',
        platform: 'Nexus Core Music OS',
      },
    };

    if (stripeAccountId && stripeAccountId.startsWith('acct_')) {
      intentConfig.application_fee_amount = platformFeeInCents;
      intentConfig.transfer_data = {
        destination: stripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(intentConfig);

    res.json({
      simulated: false,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (e: any) {
    console.error('[MERCH CHECKOUT ERROR]:', e);
    res.status(500).json({ error: e.message || 'Failed to initialize payment intent.' });
  }
});

// ============================================================
// INVENTORY & MERCH PERSISTENCE & CROSS-DEVICE SYNC APIS
// ============================================================
const inventoryCacheFile = path.join(uploadsDir, 'inventory_cache.json');

function generateServerUuid(): string {
  const chars = '0123456789abcdef';
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return chars[v];
  });
}

async function loadCachedInventory(): Promise<any[]> {
  try {
    if (fs.existsSync(inventoryCacheFile)) {
      const content = await fs.promises.readFile(inventoryCacheFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch (e) {
    console.warn('[SERVER INVENTORY] Cache read warning:', e);
  }
  return [];
}

async function saveCachedInventory(itemsList: any[]): Promise<void> {
  try {
    const existing = await loadCachedInventory();
    const map = new Map<string, any>();
    existing.forEach((item: any) => {
      if (item && item.id) map.set(item.id, item);
    });
    itemsList.forEach((item: any) => {
      if (item && item.id) {
        map.set(item.id, { ...(map.get(item.id) || {}), ...item, updated_at: new Date().toISOString() });
      }
    });
    await fs.promises.writeFile(
      inventoryCacheFile,
      JSON.stringify(Array.from(map.values()), null, 2),
      'utf8'
    );
  } catch (e) {
    console.warn('[SERVER INVENTORY] Cache write warning:', e);
  }
}

paymentsRouter.get('/api/inventory', async (req: express.Request, res: express.Response) => {
  try {
    const bandId = req.query.band_id as string;
    const cached = await loadCachedInventory();
    let dbItems: any[] = [];
    const supabase = getSupabaseService();
    if (supabase) {
      try {
        let q = supabase.from('inventory').select('*');
        if (bandId) q = q.eq('band_id', bandId);
        const { data, error } = await q;
        if (!error && data) dbItems = data;
      } catch (_) {}
    }

    const map = new Map<string, any>();
    cached.forEach((i) => {
      if (i && i.id) map.set(i.id, i);
    });
    dbItems.forEach((i) => {
      if (i && i.id) map.set(i.id, { ...(map.get(i.id) || {}), ...i });
    });

    let list = Array.from(map.values());
    if (bandId) {
      list = list.filter((i) => !i.band_id || i.band_id === bandId);
    }
    res.json({ success: true, items: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load inventory' });
  }
});

paymentsRouter.post(
  '/api/inventory',
  requireAuth,
  apiMutationLimiter,
  express.json({ limit: '25mb' }),
  async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body?.item || req.body?.items || req.body;
      const itemsToSave = Array.isArray(payload) ? payload : [payload];
      if (itemsToSave.length === 0) {
        return res.status(400).json({ error: 'Valid inventory item is required' });
      }

      const user = req.authUser!;
      const supabase = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(supabase, user);
      const existingCache = await loadCachedInventory();
      const existingMap = new Map(existingCache.map((i: any) => [i.id, i]));

      const processedItems: any[] = [];

      for (const rawItem of itemsToSave) {
        if (!rawItem) continue;
        let item = { ...rawItem };
        if (!item.id || item.id.startsWith('temp_')) {
          item.id = generateServerUuid();
        }

        const existingItem = existingMap.get(item.id);
        if (existingItem) {
          const isOwner = hasAnyOwnershipMatch(user, ownedIds, [
            existingItem.owner_id,
            existingItem.band_id,
          ]);
          if (!isOwner) {
            return res.status(403).json({ error: 'Forbidden: You do not own this inventory item.' });
          }
        }
        if (item.band_id) {
          const ownsBand = await assertBandOrEntityOwner(supabase, user, String(item.band_id));
          if (!ownsBand) {
            return res.status(403).json({
              error: 'Forbidden: You cannot modify inventory for an entity you do not own.',
            });
          }
        }
        item.owner_id = existingItem?.owner_id || user.id;

        if (
          item.image_url &&
          (item.image_url.startsWith('data:') || item.image_url.startsWith('blob:'))
        ) {
          try {
            const matches = item.image_url.match(/^data:([^;]+);base64,([\s\S]+)$/);
            if (matches && matches.length === 3) {
              const contentType = matches[1];
              const buffer = Buffer.from(matches[2].replace(/\s+/g, ''), 'base64');
              const fileExt = contentType.split('/')[1] || 'webp';
              const cleanId = String(item.id).replace(/[^a-zA-Z0-9_-]/g, '_');
              const storagePath = `items/${cleanId}_${Date.now()}.${fileExt}`;

              let uploadedPublicUrl = null;

              if (supabase) {
                try {
                  const { data: buckets } = await supabase.storage.listBuckets();
                  if (buckets && !buckets.some((b: any) => b.name === 'inventory-items')) {
                    await supabase.storage.createBucket('inventory-items', { public: true });
                  }
                  const { error: upErr } = await supabase.storage
                    .from('inventory-items')
                    .upload(storagePath, buffer, {
                      contentType,
                      upsert: true,
                    });
                  if (!upErr) {
                    const { data: pubData } = supabase.storage
                      .from('inventory-items')
                      .getPublicUrl(storagePath);
                    if (pubData?.publicUrl) uploadedPublicUrl = pubData.publicUrl;
                  }
                } catch (stErr) {
                  console.warn('[SERVER INVENTORY STORAGE EXCEPTION]', stErr);
                }
              }

              if (!uploadedPublicUrl) {
                const fileName = `${cleanId}_${Date.now()}.${fileExt}`;
                const localPath = path.join(uploadsDir, fileName);
                await fs.promises.writeFile(localPath, buffer);
                uploadedPublicUrl = `/uploads/${fileName}`;
              }

              item.image_url = uploadedPublicUrl;
              item.image_path = storagePath;
            }
          } catch (imgErr) {
            console.warn('[SERVER INVENTORY IMAGE PROC WARN]', imgErr);
          }
        }

        if (supabase) {
          try {
            const cleanDbItem = {
              id: item.id,
              name: item.name || 'Merchandise Item',
              table_stock: item.table_stock || 0,
              van_stock: item.van_stock || 0,
              low_threshold: item.low_threshold || 10,
              initial_batch_size: item.initial_batch_size || 100,
              status: item.status || 'Healthy',
              item_type: item.item_type || 'APPAREL',
              price: item.price || 0,
              image_url: item.image_url || null,
              image_path: item.image_path || null,
              border_color: item.border_color || '#00ffcc',
              band_id: item.band_id || null,
              cost: item.cost || 0,
              sku: item.sku || null,
              barcode: item.barcode || null,
              variants: item.variants || null,
            };
            const { data: savedDbData, error: dbErr } = await supabase
              .from('inventory')
              .upsert([cleanDbItem], { onConflict: 'id' })
              .select()
              .single();
            if (!dbErr && savedDbData) {
              item = { ...item, ...savedDbData };
            }
          } catch (dbErr) {
            console.warn('[SERVER INVENTORY DB UPSERT EXCEPTION]', dbErr);
          }
        }

        processedItems.push(item);
      }

      await saveCachedInventory(processedItems);
      res.json({ success: true, count: processedItems.length, items: processedItems });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to save inventory item' });
    }
  }
);

paymentsRouter.delete(
  '/api/inventory/:id',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const itemId = req.params.id;
      const existing = await loadCachedInventory();
      const target = existing.find((i: any) => i.id === itemId);

      const user = req.authUser!;
      const supabase = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(supabase, user);

      if (target) {
        const isOwner = hasAnyOwnershipMatch(user, ownedIds, [target.owner_id, target.band_id]);
        if (!isOwner) {
          return res.status(403).json({ error: 'Forbidden: You do not own this inventory item.' });
        }
      } else if (supabase && !user.isAdmin) {
        const { data: dbItem } = await supabase
          .from('inventory')
          .select('band_id')
          .eq('id', itemId)
          .maybeSingle();
        if (dbItem && dbItem.band_id && !hasAnyOwnershipMatch(user, ownedIds, [dbItem.band_id])) {
          return res.status(403).json({ error: 'Forbidden: You do not own this inventory item.' });
        }
      }

      const filtered = existing.filter((i: any) => i.id !== itemId);
      await fs.promises.writeFile(inventoryCacheFile, JSON.stringify(filtered, null, 2), 'utf8');

      if (supabase) {
        try {
          await supabase.from('inventory').delete().eq('id', itemId);
        } catch (_) {}
      }

      res.json({ success: true, itemId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete inventory item' });
    }
  }
);
