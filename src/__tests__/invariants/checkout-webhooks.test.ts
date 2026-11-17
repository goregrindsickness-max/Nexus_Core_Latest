import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  mockSupabaseClient,
  seedSupabaseTable,
  getSupabaseTableRows,
  mockStripeClient,
  createMockStripeSignature,
  TEST_STRIPE_WEBHOOK_SECRET,
} from '@/src/__tests__/mocks';

vi.mock('@/server/lib/supabaseAdmin', () => ({
  getSupabaseService: vi.fn(() => mockSupabaseClient),
  getVaultSecret: vi.fn(async (name: string) => {
    if (name === 'stripe_webhook_secret') return TEST_STRIPE_WEBHOOK_SECRET;
    return null;
  }),
  getUserOwnedEntityIds: vi.fn(async () => new Set<string>()),
  assertBandOrEntityOwner: vi.fn(async () => true),
  hasAnyOwnershipMatch: vi.fn(() => true),
}));

vi.mock('@/server/lib/clients', () => ({
  getStripeAsync: vi.fn(async () => mockStripeClient),
  uploadsDir: '/tmp/nexus-test-uploads',
}));

import {
  paymentsRouter,
  resetProcessedWebhookEvents,
} from '@/server/routes/payments';

describe('Invariant 5: Checkout Webhooks Signature Verification, Idempotency & Order Transitions', () => {
  const app = express();
  app.use(paymentsRouter);

  const USER_ID = '88888888-9999-4000-8111-222222222222';
  const ORDER_ID = 'order_merch_001';
  const ESCROW_ID = 'contract_escrow_001';

  beforeEach(() => {
    resetProcessedWebhookEvents();
  });

  it('rejects missing or invalid Stripe webhook signatures with 400 and makes zero database mutations', async () => {
    seedSupabaseTable('orders', [
      { id: ORDER_ID, user_id: USER_ID, status: 'pending', credited_amount: 0 },
    ]);

    const rawBody = JSON.stringify({
      id: 'evt_tampered_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_tampered_001',
          amount_total: 5500,
          metadata: { userId: USER_ID, orderId: ORDER_ID },
        },
      },
    });

    // 1. Missing stripe-signature header
    const missingSigRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .send(rawBody);

    expect(missingSigRes.status).toBe(400);

    // 2. Tampered / invalid stripe-signature header
    const invalidSigRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1770000000,v1=deadbeef0000invalid')
      .send(rawBody);

    expect(invalidSigRes.status).toBe(400);
    expect(invalidSigRes.text).toContain('Webhook Error:');

    // Order must remain untouched in 'pending' state with 0 credited_amount
    const orders = getSupabaseTableRows('orders');
    expect(orders[0].status).toBe('pending');
    expect(orders[0].credited_amount).toBe(0);
  });

  it('transitions order and escrow records cleanly on valid signature and handles duplicate webhook deliveries idempotently without double-crediting', async () => {
    seedSupabaseTable('profiles', [
      {
        id: USER_ID,
        email: 'buyer@nexuscore.app',
        subscription_tier: 'free',
        subscription_status: 'inactive',
      },
    ]);
    seedSupabaseTable('orders', [
      {
        id: ORDER_ID,
        user_id: USER_ID,
        status: 'pending',
        credited_amount: 0,
      },
    ]);
    seedSupabaseTable('creative_contracts_v1', [
      {
        id: ESCROW_ID,
        client_id: USER_ID,
        status: 'pending',
        escrow_credited_amount: 0,
      },
    ]);

    const eventPayload = JSON.stringify({
      id: 'evt_valid_checkout_001',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_live_001',
          customer: 'cus_live_001',
          subscription: 'sub_live_001',
          amount_total: 7500,
          metadata: {
            userId: USER_ID,
            tier: 'band_pro',
            orderId: ORDER_ID,
            escrowId: ESCROW_ID,
          },
        },
      },
    });

    const validSignature = createMockStripeSignature(
      eventPayload,
      TEST_STRIPE_WEBHOOK_SECRET
    );

    // First delivery: processes normally
    const firstRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', validSignature)
      .send(eventPayload);

    expect(firstRes.status).toBe(200);
    expect(firstRes.body).toEqual({ received: true });

    // Verify order, escrow, and profile transitioned properly
    expect(getSupabaseTableRows('orders')[0]).toMatchObject({
      id: ORDER_ID,
      status: 'paid',
      credited_amount: 7500,
    });
    expect(getSupabaseTableRows('creative_contracts_v1')[0]).toMatchObject({
      id: ESCROW_ID,
      status: 'escrow_funded',
      escrow_credited_amount: 7500,
    });
    expect(getSupabaseTableRows('profiles')[0]).toMatchObject({
      id: USER_ID,
      subscription_tier: 'band_pro',
      subscription_status: 'active',
    });

    // Second delivery of the exact same event ID: idempotently acknowledged without crediting twice
    const duplicateEventRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', validSignature)
      .send(eventPayload);

    expect(duplicateEventRes.status).toBe(200);
    expect(duplicateEventRes.body).toEqual({ received: true, duplicate: true });

    // Third delivery with a different event ID (e.g. payment_intent.succeeded for the same orderId & escrowId):
    // Record-level status guard prevents double-crediting an already-paid order or already-funded escrow
    const secondEventPayload = JSON.stringify({
      id: 'evt_payment_intent_for_same_order_002',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_live_001',
          amount: 7500,
          metadata: {
            orderId: ORDER_ID,
            escrowId: ESCROW_ID,
          },
        },
      },
    });
    const secondSig = createMockStripeSignature(
      secondEventPayload,
      TEST_STRIPE_WEBHOOK_SECRET
    );

    const retryOrderRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', secondSig)
      .send(secondEventPayload);

    expect(retryOrderRes.status).toBe(200);
    // Credited amounts remain strictly 7500 (never 15000)
    expect(getSupabaseTableRows('orders')[0].credited_amount).toBe(7500);
    expect(
      getSupabaseTableRows('creative_contracts_v1')[0].escrow_credited_amount
    ).toBe(7500);
  });

  it('transitions orders and subscriptions accurately on payment failure, session expiration, and subscription cancellation', async () => {
    seedSupabaseTable('orders', [
      { id: 'order_fail_01', status: 'pending', credited_amount: 0 },
      { id: 'order_exp_01', status: 'pending', credited_amount: 0 },
    ]);
    seedSupabaseTable('profiles', [
      {
        id: USER_ID,
        stripe_customer_id: 'cus_cancel_01',
        subscription_tier: 'pro',
        subscription_status: 'active',
      },
    ]);

    // 1. payment_intent.payment_failed -> order status becomes 'failed'
    const failPayload = JSON.stringify({
      id: 'evt_fail_01',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_fail_01',
          metadata: { orderId: 'order_fail_01' },
        },
      },
    });
    await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set(
        'stripe-signature',
        createMockStripeSignature(failPayload, TEST_STRIPE_WEBHOOK_SECRET)
      )
      .send(failPayload)
      .expect(200);

    // 2. checkout.session.expired -> order status becomes 'expired'
    const expirePayload = JSON.stringify({
      id: 'evt_exp_01',
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_exp_01',
          metadata: { orderId: 'order_exp_01' },
        },
      },
    });
    await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set(
        'stripe-signature',
        createMockStripeSignature(expirePayload, TEST_STRIPE_WEBHOOK_SECRET)
      )
      .send(expirePayload)
      .expect(200);

    // 3. customer.subscription.deleted -> profile downgrades to 'free' & 'canceled'
    const cancelSubPayload = JSON.stringify({
      id: 'evt_sub_del_01',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_del_01',
          customer: 'cus_cancel_01',
          status: 'canceled',
        },
      },
    });
    await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set(
        'stripe-signature',
        createMockStripeSignature(cancelSubPayload, TEST_STRIPE_WEBHOOK_SECRET)
      )
      .send(cancelSubPayload)
      .expect(200);

    const orders = getSupabaseTableRows('orders');
    expect(orders.find((o) => o.id === 'order_fail_01')?.status).toBe('failed');
    expect(orders.find((o) => o.id === 'order_exp_01')?.status).toBe('expired');

    const profile = getSupabaseTableRows('profiles')[0];
    expect(profile.subscription_status).toBe('canceled');
    expect(profile.subscription_tier).toBe('free');
  });
});
