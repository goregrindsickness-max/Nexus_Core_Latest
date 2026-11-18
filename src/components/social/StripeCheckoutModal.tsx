import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  MapPin,
  CreditCard,
  Truck,
  Check,
  ShieldCheck,
  Lock,
  Ticket,
  ShoppingBag,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Crown,
  Flame,
  Plus,
  Minus,
  Fingerprint,
  Settings2,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import {
  enrichTicketData,
  getExternalTicketUrl,
  getExternalTicketProviderName,
  getShowTicketTiers,
  parseSingleAdmissionPrice
} from '../../utils/socialFeedUtils';
import { getStoredWallets, processWalletPayment, selectWalletCard, UserWalletsState, WalletCard } from '../../services/digitalWalletService';
import { WalletOAuthModal } from './modals/WalletOAuthModal';
import { supabase } from '../../lib/supabaseClient';
import { pushManager } from '../../lib/pushNotifications';
import { authFetch } from '../../utils/apiConfig';
import {
  decrementPurchasedInventory,
  commitShopPurchaseToCollections,
  findUpcomingShowsForBand,
  getItemAvailableStock,
  FREE_SHIPPING_THRESHOLD_PER_BAND,
  FLAT_SHIPPING_PER_BAND,
  normalizeBandKey,
  isPhysicalMediaItem,
  type FulfillmentMode,
} from '../../services/shopCommerceService';
import {
  resolvePayoutRouteForItem,
  recordOrderPayoutSettlements,
} from '../../services/payoutRoutingService';

const stripePublicKey = (import.meta.env.VITE_STRIPE_PUBLIC_KEY || '').trim();
const isRealStripeKey = typeof stripePublicKey === 'string' && stripePublicKey.startsWith('pk_') && !stripePublicKey.includes('placeholder');
const stripePromise = isRealStripeKey ? loadStripe(stripePublicKey) : null;

export interface StripeCheckoutModalProps {
  post?: any;
  checkoutItem?: any;
  itemType?: 'merch' | 'ticket' | 'music' | 'cart';
  rawItem?: any;
  size?: string;
  price?: number;
  isNegotiated?: boolean;
  userProfile?: any;
  triggerNotification?: (title: string, message?: string, icon?: string) => void;
  setMyCollections?: React.Dispatch<React.SetStateAction<any[]>>;
  setViewingReceipt?: (receipt: any) => void;
  liveEvents?: any[];
  shopItems?: any[];
  inAppSongsList?: any[];
  bands?: any[];
  onClose: () => void;
}

export function StripeCheckoutModal({
  post,
  checkoutItem,
  itemType: propItemType,
  rawItem: propRawItem,
  size: initialSize = 'L',
  price: baseInitialPrice,
  isNegotiated,
  userProfile,
  triggerNotification,
  setMyCollections,
  setViewingReceipt,
  liveEvents = [],
  shopItems = [],
  inAppSongsList = [],
  bands = [],
  onClose
}: StripeCheckoutModalProps) {
  // Determine item type and raw data
  const rawItem = propRawItem || checkoutItem?.data || post?.rawItem || post?.merchData || {};
  const isTicket = Boolean(
    propItemType === 'ticket' ||
    checkoutItem?.type === 'ticket' ||
    post?.type === 'ticket' ||
    rawItem?.headliner ||
    rawItem?.venue ||
    rawItem?.date ||
    rawItem?.isGig ||
    rawItem?.time
  );

  const isMusic = propItemType === 'music' || checkoutItem?.type === 'music';
  const isMerch = !isTicket && !isMusic;

  // Base price computation (non-ticket items)
  const parsePrice = (p: any): number => {
    if (typeof p === 'number') return Number.isFinite(p) ? p : 0;
    if (typeof p === 'string') {
      const cleaned = p.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const externalTicketUrl = isTicket ? getExternalTicketUrl(rawItem) : null;
  const externalProviderName = getExternalTicketProviderName(externalTicketUrl);
  const explicitTicketTiers = isTicket ? getShowTicketTiers(rawItem) : [];
  const parsedAdmission = isTicket
    ? parseSingleAdmissionPrice({
        ...rawItem,
        price: rawItem?.price ?? baseInitialPrice ?? post?.price,
      })
    : { hasNumericPrice: false, price: 0, label: '', isFreeOrDoorOnly: false };

  const ticketTierOptions = isTicket
    ? explicitTicketTiers.length > 0
      ? explicitTicketTiers.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          desc:
            t.description ||
            (t.capacity && t.capacity > 0
              ? `In-App QR Gate Pass • Limited to ${t.capacity}`
              : 'In-App QR Gate Pass • Standard Admission'),
          includesMerch: Boolean(t.includesMerch),
          capacity: t.capacity || 0,
        }))
      : parsedAdmission.hasNumericPrice
      ? [
          {
            id: 'standard_admission',
            name: rawItem?.presale_price ? 'Advance / Pre-Sale Admission' : 'General Admission',
            price: parsedAdmission.price,
            desc: 'Instant In-App QR Gate Pass • Standard Admission',
            includesMerch: false,
            capacity: 0,
          },
        ]
      : []
    : [];

  const [selectedTierId, setSelectedTierId] = useState<string>(
    () => ticketTierOptions[0]?.id || 'standard_admission'
  );

  useEffect(() => {
    if (ticketTierOptions.length > 0 && !ticketTierOptions.some((t) => t.id === selectedTierId)) {
      setSelectedTierId(ticketTierOptions[0].id);
    }
  }, [ticketTierOptions, selectedTierId]);

  const [quantity, setQuantity] = useState<number>(Math.max(1, Number(rawItem?.initialQty) || 1));
  const [selectedMerchSize, setSelectedMerchSize] = useState<string>(initialSize);

  // Available Sizes for merch/media (respect item's configured sizes/formats if provided)
  const availableSizes: string[] =
    Array.isArray(rawItem?.sizes) && rawItem.sizes.length > 0
      ? rawItem.sizes
      : ['S', 'M', 'L', 'XL', '2XL', '3XL'];

  // Ticket + Merch Bundle optional add-on (for in-app show tickets)
  const showBandName = String(
    rawItem?.headliner || rawItem?.bandName || rawItem?.band || rawItem?.artist || ''
  ).toLowerCase();
  const matchingShowBundleMerch = isTicket
    ? (shopItems || []).filter((m: any) => {
        if (!m || m.category === 'gear' || m.category === 'classifieds') return false;
        const mArtist = `${m.artist || ''} ${m.band || ''} ${m.brand || ''} ${m.seller || ''} ${m.name || ''}`.toLowerCase();
        return showBandName.length > 2 && mArtist.includes(showBandName);
      }).slice(0, 3)
    : [];
  const [bundleMerchId, setBundleMerchId] = useState<string>('');
  const [bundleMerchSize, setBundleMerchSize] = useState<string>('L');
  const selectedBundleItem = matchingShowBundleMerch.find((m: any) => m.id === bundleMerchId) || null;
  const bundleAddonPrice = selectedBundleItem ? Math.round((Number(selectedBundleItem.price) || 25) * 0.85 * 100) / 100 : 0;

  // Attendees list state for tickets (names & sizes)
  const defaultUserName = userProfile?.full_name || userProfile?.username || 'Attendee 1';
  const [attendeeDetails, setAttendeeDetails] = useState<Array<{ name: string; size: string }>>([
    { name: defaultUserName, size: 'L' }
  ]);

  // Adjust attendeeDetails array length when quantity changes
  useEffect(() => {
    setAttendeeDetails(prev => {
      const next = [...prev];
      while (next.length < quantity) {
        next.push({ name: `Attendee ${next.length + 1}`, size: 'L' });
      }
      return next.slice(0, quantity);
    });
  }, [quantity]);

  const activeTierConfig = ticketTierOptions.find((t) => t.id === selectedTierId) ||
    ticketTierOptions[0] || {
      id: 'standard_admission',
      name: parsedAdmission.label || 'Door Admission',
      price: 0,
      desc: 'Admission details managed at venue door',
      includesMerch: false,
      capacity: 0,
    };

  const merchFallbackPrice = parsePrice(
    baseInitialPrice ?? rawItem?.price ?? post?.price ?? 25
  ) || 25;
  const unitPrice = isTicket ? activeTierConfig.price : merchFallbackPrice;
  const isTicketPurchasableInApp = isTicket && !externalTicketUrl && ticketTierOptions.length > 0;

  // Merch Booth Pickup detection for merch items
  const sellerBandName =
    rawItem?.bandName || rawItem?.band || rawItem?.artist || rawItem?.seller || rawItem?.brand || post?.authorName || 'Official Artist';
  const resolvedPayoutRoute = resolvePayoutRouteForItem(
    {
      ...rawItem,
      bandName: rawItem?.bandName || rawItem?.band || post?.merchData?.bandName,
      bandId: rawItem?.bandId || rawItem?.band_id || post?.merchData?.bandId,
      sellerName: rawItem?.seller || post?.authorName,
      sellerId: rawItem?.sellerId || rawItem?.user_id || post?.authorId,
      name: rawItem?.name || rawItem?.title || post?.title,
    },
    { bands, userProfile }
  );
  const upcomingShowsForSeller = isMerch ? findUpcomingShowsForBand(sellerBandName, liveEvents) : [];
  const [merchFulfillmentMode, setMerchFulfillmentMode] = useState<FulfillmentMode>(
    rawItem?.fulfillment?.mode === 'booth_pickup' ? 'booth_pickup' : 'ship'
  );
  const [selectedPickupShowId, setSelectedPickupShowId] = useState<string>(
    rawItem?.fulfillment?.showId || upcomingShowsForSeller[0]?.id || ''
  );

  const stockInfo = isMerch ? getItemAvailableStock(rawItem, selectedMerchSize) : { isUnlimited: true, totalStock: null, variantStock: null, isSoldOut: false, isVariantSoldOut: false };
  const maxMerchQty = !isMerch || stockInfo.isUnlimited ? 8 : Math.max(1, Math.min(8, stockInfo.variantStock ?? stockInfo.totalStock ?? 8));

  const subtotal = unitPrice * quantity + bundleAddonPrice;
  const processingFee = isTicketPurchasableInApp && subtotal > 0 ? 2.5 : 0;
  const isBoothPickup = isMerch && merchFulfillmentMode === 'booth_pickup' && upcomingShowsForSeller.length > 0;
  const merchShippingCost =
    isMerch && !isBoothPickup && subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD_PER_BAND
      ? FLAT_SHIPPING_PER_BAND
      : 0;
  const grandTotal = subtotal + processingFee + merchShippingCost;

  // Shipping Configuration
  const requiresShipping = (isMerch && !isBoothPickup) || (isTicket && activeTierConfig.includesMerch);
  const [useWalletAddress, setUseWalletAddress] = useState<boolean>(true);
  const [shippingName, setShippingName] = useState<string>(userProfile?.full_name || userProfile?.username || '');
  const [shippingStreet, setShippingStreet] = useState<string>('');
  const [shippingCity, setShippingCity] = useState<string>('');
  const [shippingState, setShippingState] = useState<string>('');
  const [shippingZip, setShippingZip] = useState<string>('');
  const [shippingPhone, setShippingPhone] = useState<string>('');
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // Payment states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMethod, setProcessingMethod] = useState<'GOOGLE_WALLET' | 'APPLE_PAY' | 'PAYPAL' | 'STRIPE' | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'confirm' | 'success'>('confirm');
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [walletsState, setWalletsState] = useState<UserWalletsState>(() => getStoredWallets(userProfile));
  const [activeOAuthProvider, setActiveOAuthProvider] = useState<'google' | 'apple' | 'paypal' | null>(null);
  const [expandedCardSelector, setExpandedCardSelector] = useState<'google' | 'apple' | 'paypal' | null>(null);

  useEffect(() => {
    const handleWalletsUpdate = (e: any) => {
      if (e.detail) {
        setWalletsState(e.detail);
      } else {
        setWalletsState(getStoredWallets(userProfile));
      }
    };
    window.addEventListener('nexus-wallets-changed', handleWalletsUpdate);
    return () => window.removeEventListener('nexus-wallets-changed', handleWalletsUpdate);
  }, [userProfile?.id]);

  // Stripe Client Secret for Live Element if available
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const totalAmount = grandTotal;

  useEffect(() => {
    if (isRealStripeKey && totalAmount > 0) {
      setIsLoading(true);
      
      // Call the Supabase Edge Function directly
      supabase.functions.invoke('create-payment-intent', {
        body: { amount: totalAmount, currency: 'usd' }
      })
        .then(({ data, error }) => {
          if (error) throw error;
          if (data && data.clientSecret) {
            setClientSecret(data.clientSecret);
          }
        })
        .catch((err) => {
          console.error("Failed to create payment intent:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [totalAmount]);

  const validateCustomAddress = (): boolean => {
    if (!requiresShipping || useWalletAddress) return true;
    const errors: Record<string, string> = {};
    if (!shippingName.trim()) errors.name = 'Name is required';
    if (!shippingStreet.trim()) errors.street = 'Street address is required';
    if (!shippingCity.trim()) errors.city = 'City is required';
    if (!shippingState.trim()) errors.state = 'State is required';
    if (!shippingZip.trim()) errors.zip = 'ZIP code is required';

    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (triggerNotification) {
        triggerNotification('Address Incomplete', 'Please fill in all required shipping address fields.', '⚠️');
      }
      return false;
    }
    return true;
  };

  const handlePayment = async (method: 'GOOGLE_WALLET' | 'APPLE_PAY' | 'PAYPAL' | 'STRIPE') => {
    if (isTicket && externalTicketUrl) {
      if (triggerNotification) {
        triggerNotification('External Ticket Vendor', `Tickets are sold directly via ${externalProviderName}.`, '↗');
      }
      return;
    }
    if (isTicket && !isTicketPurchasableInApp) {
      return;
    }
    if (!validateCustomAddress()) return;

    // Check if wallet is linked; if not, trigger real OAuth authorization flow
    if (method === 'GOOGLE_WALLET' && !walletsState.google.linked) {
      setActiveOAuthProvider('google');
      return;
    }
    if (method === 'APPLE_PAY' && !walletsState.apple.linked) {
      setActiveOAuthProvider('apple');
      return;
    }
    if (method === 'PAYPAL' && !walletsState.paypal.linked) {
      setActiveOAuthProvider('paypal');
      return;
    }

    setIsProcessing(true);
    setProcessingMethod(method);

    try {
      // If paying via Stripe / Direct Card, attempt real hosted Stripe Checkout Session first
      if (method === 'STRIPE') {
        try {
          const lineItem = {
            name: isTicket
              ? `${rawItem?.headliner || rawItem?.name || 'Concert'} - ${activeTierConfig.name}`
              : (rawItem?.name || rawItem?.title || post?.title || 'Tour Merch'),
            description: isTicket
              ? `${rawItem?.venue || 'Venue'} • ${rawItem?.date || 'Tour Date'}`
              : (selectedMerchSize ? `Size: ${selectedMerchSize}` : undefined),
            price: unitPrice,
            quantity: quantity,
            image: rawItem?.thumbnail || rawItem?.image || post?.merchData?.thumbnail || post?.image_url,
          };

          const response = await authFetch('/api/payments/create-cart-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartItems: [lineItem],
              payoutRoute: resolvedPayoutRoute,
              stripeAccountId: resolvedPayoutRoute.stripeAccountId,
              bandId: resolvedPayoutRoute.entityType === 'band' ? resolvedPayoutRoute.entityId : undefined,
              bandName: resolvedPayoutRoute.entityType === 'band' ? resolvedPayoutRoute.entityName : sellerBandName,
              sellerId: resolvedPayoutRoute.entityType === 'profile' ? resolvedPayoutRoute.entityId : undefined,
              sellerName: resolvedPayoutRoute.entityName,
              shippingAddress: requiresShipping ? {
                name: shippingName,
                street: shippingStreet,
                city: shippingCity,
                state: shippingState,
                zip: shippingZip,
                phone: shippingPhone,
              } : undefined,
              customerEmail: userProfile?.email,
              orderType: isTicket ? 'ticket' : 'merch',
              metadata: {
                customerName: shippingName || userProfile?.full_name || 'Customer',
                customerEmail: userProfile?.email || '',
                tier: activeTierConfig.id,
                tierName: activeTierConfig.name,
                isTicket: String(isTicket),
                quantity: String(quantity),
                recipientName: resolvedPayoutRoute.entityName,
                payoutMethod: resolvedPayoutRoute.preferredMethod,
                payoutDestination: resolvedPayoutRoute.destinationLabel,
              }
            })
          });

          if (response.ok) {
            const checkoutData = await response.json();
            if (checkoutData.url && !checkoutData.simulated) {
              localStorage.setItem('nexus_pending_single_order', JSON.stringify({
                type: isTicket ? 'ticket' : 'merch',
                isTicket,
                rawItem,
                post,
                activeTierConfig,
                selectedTier: activeTierConfig.id,
                unitPrice,
                quantity,
                grandTotal,
                selectedMerchSize,
                attendeeDetails,
                shippingName,
                shippingStreet,
                shippingCity,
                shippingState,
                shippingZip,
                shippingPhone,
              }));
              window.location.href = checkoutData.url;
              return;
            }
          }
        } catch (stripeErr) {
          console.warn('[STRIPE MODAL NOTICE] Real checkout session unavailable, continuing with local handler:', stripeErr);
        }
      }

      // Execute through the real digital wallet service
      const paymentResult = await processWalletPayment(method, grandTotal, userProfile);
      
      const orderId = paymentResult.orderId;
      const itemName = rawItem?.headliner || rawItem?.name || rawItem?.title || post?.title || 'Tour Item';
      const venueName = rawItem?.venue || 'The Underground';

      let purchaseData: any = { ...rawItem };

      let newRecord: any;

      if (isTicket) {
        const enriched = enrichTicketData(rawItem);
        purchaseData = {
          ...enriched,
          ...rawItem,
          showId: rawItem?.id || rawItem?.show_id,
          ticketType: activeTierConfig.name,
          tierCode: activeTierConfig.id,
          pricePerUnit: unitPrice,
          attendees: attendeeDetails.map((att, idx) => ({
            name: att.name.trim() || `Attendee ${idx + 1}`,
            tier: activeTierConfig.id,
            tierName: activeTierConfig.name,
            size: activeTierConfig.includesMerch ? att.size : undefined,
            ticketCode: `TKT-${orderId.slice(-4)}-${idx + 1}`
          })),
          shippingAddress: requiresShipping ? {
            type: useWalletAddress ? 'Wallet Saved Address' : 'Custom Shipping Address',
            name: useWalletAddress ? (userProfile?.full_name || 'Wallet User') : shippingName,
            street: useWalletAddress ? 'Wallet Default Address on File' : shippingStreet,
            city: useWalletAddress ? 'Wallet City' : shippingCity,
            state: useWalletAddress ? 'CA' : shippingState,
            zip: useWalletAddress ? '90026' : shippingZip,
            phone: shippingPhone || 'N/A'
          } : undefined
        };

        newRecord = {
          id: `col_${Date.now()}`,
          orderId,
          transactionId: paymentResult.transactionId,
          type: 'ticket',
          data: purchaseData,
          quantity,
          totalAmount: grandTotal,
          paymentMethod: paymentResult.paymentMethod,
          date: new Date()
        };

        try {
          const existing = JSON.parse(localStorage.getItem('nexus_my_collections_v1') || '[]');
          let updated = [newRecord, ...existing];

          // Also include Show Merch Bundle add-on as a Venue Merch Booth Pickup item!
          if (selectedBundleItem) {
            await decrementPurchasedInventory([
              { id: selectedBundleItem.id, productId: selectedBundleItem.id, name: selectedBundleItem.name, size: bundleMerchSize, quantity: 1, stock: selectedBundleItem.stock },
            ]);
            const bundleCollections = commitShopPurchaseToCollections({
              items: [
                {
                  ...selectedBundleItem,
                  productId: selectedBundleItem.id,
                  price: bundleAddonPrice,
                  size: bundleMerchSize,
                  quantity: 1,
                  bandName: selectedBundleItem.artist || selectedBundleItem.band || displayAuthor,
                  fulfillment: {
                    mode: 'booth_pickup',
                    showId: rawItem?.id || rawItem?.show_id,
                    showTitle: displayTitle,
                    venue: venueName,
                    date: rawItem?.date || 'Show Night',
                  },
                },
              ],
              orderId,
              transactionId: paymentResult.transactionId,
              paymentMethod: paymentResult.paymentMethod,
              inAppSongsList,
              bands,
            });
            updated = bundleCollections;
          }

          localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent('nexus-collections-updated'));
          if (setMyCollections) setMyCollections(updated);
        } catch (e) {
          console.warn('Failed to sync ticket collection', e);
        }
      } else {
        const chosenPickupShow =
          upcomingShowsForSeller.find((s) => s.id === selectedPickupShowId) || upcomingShowsForSeller[0];
        const fulfillmentChoice = isBoothPickup && chosenPickupShow
          ? {
              mode: 'booth_pickup' as const,
              showId: chosenPickupShow.id,
              showTitle: chosenPickupShow.title,
              venue: chosenPickupShow.venue,
              date: chosenPickupShow.date,
            }
          : { mode: 'ship' as const };

        await decrementPurchasedInventory([
          {
            id: rawItem?.id || post?.id,
            productId: rawItem?.id || post?.id,
            inventoryId: rawItem?.inventory_id || rawItem?.inventoryId || post?.merchData?.inventoryId,
            bandId: rawItem?.band_id || rawItem?.bandId || post?.merchData?.bandId,
            name: itemName,
            size: selectedMerchSize,
            quantity,
            stock: rawItem?.stock,
          },
        ]);

        const updatedCollections = commitShopPurchaseToCollections({
          items: [
            {
              ...rawItem,
              productId: rawItem?.id || post?.id,
              name: itemName,
              price: unitPrice,
              size: selectedMerchSize,
              quantity,
              thumbnail: rawItem?.thumbnail || rawItem?.image || post?.merchData?.thumbnail,
              bandName: sellerBandName,
              fulfillment: fulfillmentChoice,
            },
          ],
          orderId,
          transactionId: paymentResult.transactionId,
          paymentMethod: paymentResult.paymentMethod,
          fulfillmentMap: { [normalizeBandKey(sellerBandName)]: fulfillmentChoice },
          shippingCost: merchShippingCost,
          inAppSongsList,
          bands,
          shippingAddress: requiresShipping
            ? {
                type: useWalletAddress ? 'Wallet Saved Address' : 'Custom Shipping Address',
                name: useWalletAddress ? (userProfile?.full_name || 'Wallet User') : shippingName,
                street: useWalletAddress ? 'Wallet Default Address on File' : shippingStreet,
                city: useWalletAddress ? 'Wallet City' : shippingCity,
                state: useWalletAddress ? 'CA' : shippingState,
                zip: useWalletAddress ? '90026' : shippingZip,
                phone: shippingPhone || 'N/A',
              }
            : undefined,
        });

        newRecord = updatedCollections[0];
        if (setMyCollections) setMyCollections(updatedCollections);
      }

      // Record itemized seller/band payout settlement into the persistent payout ledger
      const payoutSettlements = recordOrderPayoutSettlements({
        items: [
          {
            ...rawItem,
            id: rawItem?.id || post?.id,
            name: itemName,
            price: unitPrice,
            quantity,
            selectedSize: isMerch ? selectedMerchSize : undefined,
            bandName: resolvedPayoutRoute.entityName || sellerBandName,
            bandId: resolvedPayoutRoute.entityType === 'band' ? resolvedPayoutRoute.entityId : undefined,
            sellerName: rawItem?.seller || post?.authorName,
          },
          ...(selectedBundleItem
            ? [
                {
                  ...selectedBundleItem,
                  price: bundleAddonPrice,
                  quantity: 1,
                  selectedSize: bundleMerchSize,
                  bandName:
                    selectedBundleItem.artist ||
                    selectedBundleItem.band ||
                    resolvedPayoutRoute.entityName,
                },
              ]
            : []),
        ],
        orderId,
        transactionId: paymentResult.transactionId,
        buyerPaymentMethod: paymentResult.paymentMethod,
        shippingTotal: merchShippingCost,
        bands,
        userProfile,
      });

      if (newRecord) {
        newRecord = {
          ...newRecord,
          payoutRoute: resolvedPayoutRoute,
          payoutSettlements,
        };
      }

      setConfirmedOrder(newRecord);
      setCheckoutStep('success');

      if (triggerNotification) {
        triggerNotification(
          'Payment Authorized',
          `Order #${orderId} paid via ${paymentResult.paymentMethod}! Receipt saved to My Collections.`,
          '⚡'
        );
      }

      // Dispatch real-time push notification for Ticket Velocity or Merch Low Stock
      if (isTicket) {
        const simulatedPercentage = Math.min(100, Math.floor(82 + Math.random() * 16));
        const showIdVal = rawItem?.id || rawItem?.show_id || '';
        const recipientUid = rawItem?.creator_id || rawItem?.user_id || rawItem?.promoter_id;
        authFetch('/api/shows/ticket-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            showId: showIdVal ? String(showIdVal) : undefined,
            showTitle: rawItem?.headliner || itemName,
            venueName: rawItem?.venue || rawItem?.venue_name || '',
            city: rawItem?.city || '',
            percentage: simulatedPercentage,
            quantity,
            gateRevenue: grandTotal,
            recipientUserId: recipientUid,
            buyerUserId: userProfile?.id,
            alertType: 'ticket_velocity',
          }),
        }).then(async (res) => {
          if (!res.ok) {
            await pushManager.sendPushToServer({
              userId: recipientUid,
              title: `Ticket Velocity Alert: ${rawItem?.headliner || itemName}`,
              body: `Sell-out threshold reached! ${simulatedPercentage}% sold (${quantity} new pass(es) issued). Gate revenue: $${grandTotal.toFixed(2)}`,
              category: 'ticket_velocity',
              priority: 'P0',
              targetTab: 'sales',
              data: { showTitle: itemName, percentage: simulatedPercentage, type: 'ticket_velocity' }
            });
          }
        }).catch(() => {});
      } else {
        const afterStock = getItemAvailableStock(rawItem, selectedMerchSize);
        if (!afterStock.isUnlimited && afterStock.totalStock !== null && afterStock.totalStock <= 5) {
          pushManager.sendPushToServer({
            userId: rawItem?.creator_id || rawItem?.user_id || rawItem?.band_id,
            title: `Low Merch Stock Warning: ${itemName}`,
            body: `${selectedMerchSize ? selectedMerchSize + ' size ' : ''}inventory reached ${afterStock.totalStock} remaining. Restock recommended.`,
            category: 'inventory_stockout',
            priority: 'P1',
            targetTab: 'merch',
            data: { itemName, stockRemaining: afterStock.totalStock, type: 'inventory_stockout' }
          }).catch(() => {});
        }
      }
    } catch (error: any) {
      if (triggerNotification) {
        triggerNotification('Payment Error', error?.message || 'Could not process transaction', '❌');
      }
    } finally {
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  const handleUpdateAttendeeName = (index: number, name: string) => {
    setAttendeeDetails(prev => {
      const next = [...prev];
      if (next[index]) next[index].name = name;
      return next;
    });
  };

  const handleUpdateAttendeeSize = (index: number, size: string) => {
    setAttendeeDetails(prev => {
      const next = [...prev];
      if (next[index]) next[index].size = size;
      return next;
    });
  };

  const displayTitle = rawItem?.headliner || rawItem?.name || rawItem?.title || post?.title || 'Tour Item';
  const displayAuthor = rawItem?.bandName || rawItem?.band || rawItem?.artist || post?.authorName || 'Official Artist';
  const displayImage = rawItem?.flyer || rawItem?.thumbnail || rawItem?.image || rawItem?.coverUrl || post?.merchData?.thumbnail || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80';

  return (
    <div className="fixed inset-0 z-[10090] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0e1014] border border-rose-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_60px_rgba(244,63,94,0.25)] space-y-4 my-auto relative text-zinc-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow">
              {isTicket ? <Ticket className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                <span>{isTicket ? (externalTicketUrl ? 'External Box Office Redirect' : 'Live Event Box Office') : '1-Click Express Checkout'}</span>
                {externalTicketUrl ? (
                  <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-1.5 py-0.2 rounded">
                    3RD-PARTY VENDOR
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    ESCROW PROTECTED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                {externalTicketUrl
                  ? `Sold off-platform via ${externalProviderName} • No in-app QR pass`
                  : isTicket && !isTicketPurchasableInApp
                  ? 'Admission handled at door / venue box office'
                  : 'Instant Gate Delivery • Verified Authenticity'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isTicket && externalTicketUrl ? (
          <div className="space-y-4">
            {/* Item Card Summary */}
            <div className="flex gap-3 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/90 shadow-inner">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover bg-zinc-900 rounded-xl border border-zinc-800 shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-white font-black text-xs sm:text-sm uppercase tracking-wide truncate">
                    {displayTitle}
                  </h4>
                  {rawItem?.date && (
                    <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1.5 rounded">
                      {rawItem.date}
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 font-mono text-[10px] uppercase mt-0.5 truncate">
                  BY {displayAuthor} {rawItem?.venue ? `• ${rawItem.venue}` : ''}
                </p>
                {rawItem?.price && (
                  <div className="text-amber-300 font-mono font-bold text-xs mt-1">
                    Listed Price: {rawItem.price}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h5 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Tickets Sold Off-Platform ({externalProviderName})
                  </h5>
                  <p className="text-[11px] font-mono text-zinc-200 leading-relaxed">
                    Purchases through this external link take place directly on <strong className="text-white">{externalProviderName}</strong> — not inside Nexus Core.
                  </p>
                  <p className="text-[11px] font-mono text-amber-200/90 leading-relaxed">
                    Nexus Core cannot confirm external orders, track your purchase status, or issue a scannable QR code for venue entry. Keep your confirmation email or app pass from {externalProviderName} for admission at the door.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={externalTicketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to {externalProviderName}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        ) : isTicket && !isTicketPurchasableInApp ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2 text-center">
              <Ticket className="w-7 h-7 text-zinc-400 mx-auto" />
              <h5 className="text-xs font-black uppercase tracking-wider text-white">
                {parsedAdmission.label || 'Door / Free Admission'}
              </h5>
              <p className="text-[11px] font-mono text-zinc-400 leading-relaxed">
                Online pre-sale tiers have not been configured for this show. Check the venue details for door admission or cover policies.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-zinc-800"
            >
              Close
            </button>
          </div>
        ) : checkoutStep === 'confirm' ? (
          <div className="space-y-4 max-h-[78vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* Item Card Summary */}
            <div className="flex gap-3 bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/90 shadow-inner">
              <img
                src={displayImage}
                alt={displayTitle}
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover bg-zinc-900 rounded-xl border border-zinc-800 shrink-0"
              />
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-white font-black text-xs sm:text-sm uppercase tracking-wide truncate">
                    {displayTitle}
                  </h4>
                  {rawItem?.date && (
                    <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1.5 rounded">
                      {rawItem.date}
                    </span>
                  )}
                </div>
                <p className="text-zinc-400 font-mono text-[10px] uppercase mt-0.5 truncate">
                  BY {displayAuthor} {rawItem?.venue ? `• ${rawItem.venue}` : ''}
                </p>
                {rawItem?.time && (
                  <p className="text-zinc-500 font-mono text-[9px] mt-0.5">{rawItem.time}</p>
                )}
                <div className="text-emerald-400 font-mono font-black text-xs sm:text-sm mt-1">
                  ${unitPrice.toFixed(2)} {isTicket && <span className="text-zinc-400 text-[10px] font-normal">/ pass</span>}
                  {isNegotiated && (
                    <span className="text-[9px] text-purple-400 ml-2 font-mono">(NEGOTIATED RATE)</span>
                  )}
                </div>
              </div>
            </div>

            {/* 1. TICKET TIERS SELECTOR (Only creator-defined tiers or single real admission pass) */}
            {isTicket && ticketTierOptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Ticket className="w-3 h-3 text-rose-500" /> {ticketTierOptions.length > 1 ? 'Choose Admission Tier' : 'Admission Pass'}
                  </span>
                  <span className="text-[9px] font-mono text-rose-400 font-bold">
                    {ticketTierOptions.length === 1 ? '1 Option Available' : `${ticketTierOptions.length} Tiers Configured`}
                  </span>
                </div>

                <div className={`grid grid-cols-1 ${ticketTierOptions.length > 1 ? 'sm:grid-cols-2' : ''} gap-2`}>
                  {ticketTierOptions.map((tier, keyIdx) => {
                    const isSelected = activeTierConfig.id === tier.id;
                    return (
                      <button
                        key={`tier-${tier.id}-${keyIdx}`}
                        type="button"
                        onClick={() => setSelectedTierId(tier.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.25)] text-white'
                            : 'bg-zinc-950/60 hover:bg-zinc-900/80 border-zinc-800/80 text-zinc-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-900 text-zinc-500'}`}>
                            {tier.includesMerch ? <Sparkles className="w-3.5 h-3.5" /> : <Ticket className="w-3.5 h-3.5" />}
                          </div>
                          <div className="text-xs font-black uppercase tracking-wide truncate">
                            {tier.name}
                          </div>
                        </div>

                        <p className="text-[9px] text-zinc-400 font-mono line-clamp-2 leading-tight">
                          {tier.desc}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-zinc-900/60 mt-1">
                          <span className="text-[9px] font-mono text-zinc-500 uppercase">Per Ticket</span>
                          <span className={`text-xs font-mono font-black ${isSelected ? 'text-emerald-400' : 'text-zinc-200'}`}>
                            ${tier.price.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. QUANTITY SELECTOR */}
            <div className="flex items-center justify-between p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/90">
              <div>
                <div className="text-xs font-black uppercase tracking-wide text-white">
                  {isTicket ? 'Number of Tickets' : 'Quantity'}
                </div>
                <div className="text-[9.5px] font-mono text-zinc-400">
                  {isTicket ? 'Personalized name pass attached to each ticket' : 'Select quantity to purchase'}
                </div>
              </div>

              <div className="flex items-center gap-3 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono font-black text-sm text-white w-4 text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(prev => Math.min(isMerch ? maxMerchQty : 8, prev + 1))}
                  disabled={quantity >= (isMerch ? maxMerchQty : 8)}
                  className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 flex items-center justify-center text-white cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 3. ATTENDEE NAMES & MERCH SIZING FOR TICKETS */}
            {isTicket && (
              <div className="space-y-2.5 p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/90">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wide text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-500" />
                    <span>Attendee Pass Information ({quantity})</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-400">Gate ID Verified</span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {attendeeDetails.map((att, idx) => (
                    <div key={`cart-item-${idx}`} className="p-2.5 bg-zinc-900/70 border border-zinc-800/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[10px] font-mono font-bold text-rose-400 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={att.name}
                            onChange={(e) => handleUpdateAttendeeName(idx, e.target.value)}
                            placeholder={`Attendee #${idx + 1} Full Legal Name`}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Sizing per attendee if bundle includes merchandise */}
                      {activeTierConfig.includesMerch && (
                        <div className="pl-7 flex items-center justify-between gap-2">
                          <span className="text-[9.5px] font-mono text-amber-300 font-bold uppercase shrink-0">
                            Merch Size:
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {availableSizes.map((sz, szIdx) => (
                              <button
                                key={`size-att-${idx}-${sz}-${szIdx}`}
                                type="button"
                                onClick={() => handleUpdateAttendeeSize(idx, sz)}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono font-black transition-all cursor-pointer ${
                                  att.size === sz
                                    ? 'bg-amber-500 text-black font-bold shadow'
                                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                                }`}
                              >
                                {sz}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket + Merch Bundle Add-On (Show Checkout) */}
            {isTicket && matchingShowBundleMerch.length > 0 && (
              <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-white">
                    Add Show Merch Bundle (15% Off · Venue Booth Pickup)
                  </span>
                  {selectedBundleItem && (
                    <button
                      type="button"
                      onClick={() => setBundleMerchId('')}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {matchingShowBundleMerch.map((m: any) => {
                    const isPicked = bundleMerchId === m.id;
                    const discounted = Math.round((Number(m.price) || 25) * 0.85 * 100) / 100;
                    return (
                      <button
                        key={`bundle-${m.id}`}
                        type="button"
                        onClick={() => setBundleMerchId(isPicked ? '' : m.id)}
                        className={`p-2 rounded-xl border text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                          isPicked
                            ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={m.thumbnail || m.image}
                            alt={m.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover bg-zinc-900 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{m.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              Pick up at venue merch table
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 font-mono tabular-nums">
                          <div className="text-xs font-bold text-emerald-400">${discounted.toFixed(2)}</div>
                          <div className="text-[9px] text-zinc-500 line-through">${Number(m.price || 25).toFixed(2)}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedBundleItem && Array.isArray(selectedBundleItem.sizes) && selectedBundleItem.sizes.length > 0 && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/70">
                    <span className="text-[10px] font-mono text-zinc-400">Bundle Size:</span>
                    <div className="flex gap-1 flex-wrap">
                      {selectedBundleItem.sizes.map((sz: string) => (
                        <button
                          key={`bndl-sz-${sz}`}
                          type="button"
                          onClick={() => setBundleMerchSize(sz)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            bundleMerchSize === sz
                              ? 'bg-emerald-500 text-black'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. STANDALONE MERCH SIZING & PICKUP OPTION */}
            {isMerch && (
              <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-white">
                      Select Variant / Size
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400">
                      {!stockInfo.isUnlimited && stockInfo.variantStock !== null
                        ? `${stockInfo.variantStock} left in stock`
                        : isPhysicalMediaItem(rawItem)
                        ? 'Includes Digital Unlock'
                        : 'Standard Fit'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizes.map((sz, szIdx) => {
                      const varStock = getItemAvailableStock(rawItem, sz);
                      return (
                        <button
                          key={`sz-${sz}-${szIdx}`}
                          type="button"
                          disabled={varStock.isVariantSoldOut}
                          onClick={() => setSelectedMerchSize(sz)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-black transition-all cursor-pointer disabled:opacity-35 disabled:line-through disabled:cursor-not-allowed ${
                            selectedMerchSize === sz
                              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 border border-rose-400'
                              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {upcomingShowsForSeller.length > 0 && (
                  <div className="pt-2.5 border-t border-zinc-800/80 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      Fulfillment Method
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setMerchFulfillmentMode('ship')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          merchFulfillmentMode === 'ship'
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Ship ({subtotal >= FREE_SHIPPING_THRESHOLD_PER_BAND ? 'FREE' : `$${FLAT_SHIPPING_PER_BAND}`})
                      </button>
                      <button
                        type="button"
                        onClick={() => setMerchFulfillmentMode('booth_pickup')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          merchFulfillmentMode === 'booth_pickup'
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Pick Up at Show ($0)
                      </button>
                    </div>
                    {merchFulfillmentMode === 'booth_pickup' && (
                      <select
                        value={selectedPickupShowId || upcomingShowsForSeller[0]?.id}
                        onChange={(e) => setSelectedPickupShowId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                      >
                        {upcomingShowsForSeller.map((sh) => (
                          <option key={sh.id} value={sh.id}>
                            {sh.title} · {sh.venue} ({sh.date})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. SHIPPING & ADDRESS CAPTURE FORM (When Shipping is Required) */}
            {requiresShipping && (
              <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-white">
                    <Truck className="w-3.5 h-3.5 text-sky-400" />
                    <span>Shipping & Fulfillment</span>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    2-Day Priority Express
                  </span>
                </div>

                {/* Option A: Wallet Saved Address (Default) */}
                <div
                  onClick={() => setUseWalletAddress(true)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    useWalletAddress
                      ? 'bg-sky-950/30 border-sky-500/60 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <input
                    type="radio"
                    checked={useWalletAddress}
                    onChange={() => setUseWalletAddress(true)}
                    className="mt-0.5 text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-200 flex items-center justify-between">
                      <span>Use Wallet Saved Address</span>
                      <span className="text-[9px] font-mono text-sky-400 font-bold">Fastest</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-relaxed">
                      Default address from your Google Wallet or Apple Pay will be utilized automatically for shipment tracking.
                    </p>
                  </div>
                </div>

                {/* Option B: Ship to a Different Address */}
                <div
                  onClick={() => setUseWalletAddress(false)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    !useWalletAddress
                      ? 'bg-rose-950/30 border-rose-500/60 text-white'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900'
                  }`}
                >
                  <input
                    type="radio"
                    checked={!useWalletAddress}
                    onChange={() => setUseWalletAddress(false)}
                    className="mt-0.5 text-rose-500 focus:ring-rose-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-zinc-200">
                      Ship to a Different Address
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Specify an alternative delivery destination or gift recipient address.
                    </p>
                  </div>
                </div>

                {/* Expandable Address Capture Form */}
                {!useWalletAddress && (
                  <div className="space-y-2.5 pt-2 border-t border-zinc-800/80 animate-in fade-in">
                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Recipient Full Name *
                      </label>
                      <input
                        type="text"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="Full Legal Name"
                        className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                          addressErrors.name ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                        }`}
                      />
                      {addressErrors.name && <span className="text-[9px] text-red-400">{addressErrors.name}</span>}
                    </div>

                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Street Address (Apt, Suite, Unit) *
                      </label>
                      <input
                        type="text"
                        value={shippingStreet}
                        onChange={(e) => setShippingStreet(e.target.value)}
                        placeholder="1234 Heavy Metal Way, Apt 4B"
                        className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                          addressErrors.street ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                        }`}
                      />
                      {addressErrors.street && <span className="text-[9px] text-red-400">{addressErrors.street}</span>}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="Los Angeles"
                          className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                            addressErrors.city ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          value={shippingState}
                          onChange={(e) => setShippingState(e.target.value)}
                          placeholder="CA"
                          className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                            addressErrors.state ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                          ZIP *
                        </label>
                        <input
                          type="text"
                          value={shippingZip}
                          onChange={(e) => setShippingZip(e.target.value)}
                          placeholder="90026"
                          className={`w-full bg-zinc-900 border rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none ${
                            addressErrors.zip ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                        Phone (Optional for Delivery SMS)
                      </label>
                      <input
                        type="text"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. ORDER TOTAL BREAKDOWN */}
            <div className="space-y-1.5 p-3.5 bg-zinc-950/90 rounded-2xl border border-zinc-900 text-xs font-mono tabular-nums">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({quantity}x {isTicket ? activeTierConfig.name : 'Item'})</span>
                <span>${(unitPrice * quantity).toFixed(2)}</span>
              </div>
              {selectedBundleItem && (
                <div className="flex justify-between text-emerald-400 text-[11px]">
                  <span>Show Merch Add-on ({selectedBundleItem.name} · {bundleMerchSize})</span>
                  <span>+${bundleAddonPrice.toFixed(2)}</span>
                </div>
              )}
              {processingFee > 0 && (
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Gate Escrow & Processing Fee</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
              )}
              {isMerch && (
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>{isBoothPickup ? 'Merch Booth Pickup' : 'Tracked Shipping'}</span>
                  <span className={merchShippingCost === 0 ? 'text-emerald-400 font-bold' : ''}>
                    {merchShippingCost === 0 ? 'FREE' : `$${merchShippingCost.toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80 font-bold">
                <span className="text-white uppercase">Grand Total</span>
                <span className="text-rose-500 text-base font-black">${grandTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 mt-1 border-t border-zinc-800/70 flex items-center justify-between gap-2 text-[10px]">
                <span className="text-zinc-400">
                  Artist / Seller Payout (95%):{' '}
                  <strong className="text-emerald-400">{resolvedPayoutRoute.entityName}</strong>
                </span>
                <span className="text-zinc-300 truncate max-w-[190px]" title={resolvedPayoutRoute.destinationLabel}>
                  → {resolvedPayoutRoute.destinationLabel}
                </span>
              </div>
            </div>

            {/* 7. PAYMENT ACTIONS HIERARCHY */}
            {/* 1-TAP DIGITAL WALLETS & CARD CHECKOUT */}
            <div className="space-y-3 pt-1">
              
              {/* GOOGLE WALLET */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handlePayment('GOOGLE_WALLET')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-gradient-to-r from-zinc-900 via-black to-zinc-900 hover:from-zinc-850 hover:to-zinc-850 text-white font-mono font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-[#4285F4]/60 shadow-[0_0_25px_rgba(66,133,244,0.25)] flex items-center justify-between px-4 cursor-pointer group active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isProcessing && processingMethod === 'GOOGLE_WALLET' ? (
                    <div className="w-full flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AUTHORIZING GOOGLE WALLET...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg text-black font-sans font-black text-[11px] shadow shrink-0">
                          <span className="text-[#4285F4]">G</span>
                          <span className="text-[#EA4335]">o</span>
                          <span className="text-[#FBBC05]">o</span>
                          <span className="text-[#4285F4]">g</span>
                          <span className="text-[#34A853]">l</span>
                          <span className="text-[#EA4335]">e</span>
                          <span className="text-zinc-900 font-black ml-0.5">Pay</span>
                        </div>
                        <div className="text-left truncate">
                          <div className="font-bold text-xs truncate">
                            {walletsState?.google?.linked ? 'Pay with Google Pay' : 'Connect Google Pay'}
                          </div>
                          {walletsState?.google?.linked && (
                            <div className="text-[9px] text-zinc-400 font-mono flex items-center gap-1 font-normal truncate">
                              <span>Active Card:</span>
                              <span className="text-sky-300 font-bold">
                                {walletsState.google.cards?.find(c => c.id === walletsState.google.selectedCardId)?.nickname || 
                                 walletsState.google.cards?.[0]?.nickname || 'Visa •••• 4242'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {walletsState?.google?.linked ? (
                          <span className="text-[8.5px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            ⚡ 1-TAP
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> OAuth
                          </span>
                        )}
                        <span className="font-black text-rose-400">${grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </button>

                {/* Google Pay Multi-Card Selector */}
                {walletsState?.google?.linked && walletsState.google.cards && walletsState.google.cards.length > 0 && (
                  <div className="px-1">
                    <button
                      type="button"
                      onClick={() => setExpandedCardSelector(expandedCardSelector === 'google' ? null : 'google')}
                      className="text-[9px] font-mono text-zinc-400 hover:text-sky-300 transition-colors flex items-center gap-1.5 cursor-pointer py-0.5"
                    >
                      <Settings2 className="w-3 h-3 text-sky-400" />
                      <span>Choose Payment Card for this Purchase ({walletsState.google.cards.length} attached)</span>
                      {expandedCardSelector === 'google' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedCardSelector === 'google' && (
                      <div className="mt-1.5 p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-1.5 animate-in fade-in-50 duration-200">
                        <span className="text-[8.5px] font-mono uppercase text-zinc-400 block px-1">Select card for this checkout:</span>
                        <div className="grid grid-cols-1 gap-1">
                          {walletsState.google.cards.map((card, cardIdx) => {
                            const isSelected = (walletsState.google.selectedCardId || walletsState.google.cards[0]?.id) === card.id;
                            return (
                              <div
                                key={card.id ? `gcard-${card.id}-${cardIdx}` : `gcard-${cardIdx}`}
                                onClick={() => {
                                  selectWalletCard('google', card.id, userProfile);
                                  setWalletsState(getStoredWallets(userProfile));
                                }}
                                className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-sky-950/40 border-sky-500 text-white font-bold'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span className="truncate">{card.nickname || `${card.brand} •••• ${card.last4}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[8px] uppercase px-1 py-0.2 bg-zinc-800 rounded text-zinc-300">{card.brand}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* APPLE PAY */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handlePayment('APPLE_PAY')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-between px-4 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessing && processingMethod === 'APPLE_PAY' ? (
                    <div className="w-full flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>AUTHORIZING APPLE PAY...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-xs font-sans font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0">Pay</span>
                        <div className="text-left truncate">
                          <div className="font-bold text-xs truncate">
                            {walletsState?.apple?.linked ? 'Pay with Apple Pay' : 'Connect Apple Pay'}
                          </div>
                          {walletsState?.apple?.linked && (
                            <div className="text-[9px] text-zinc-400 font-mono flex items-center gap-1 font-normal truncate">
                              <span>Active Card:</span>
                              <span className="text-white font-bold">
                                {walletsState.apple.cards?.find(c => c.id === walletsState.apple.selectedCardId)?.nickname || 
                                 walletsState.apple.cards?.[0]?.nickname || 'Apple Card •••• 8899'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {walletsState?.apple?.linked ? (
                          <span className="text-[8.5px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            ⚡ 1-TAP
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Fingerprint className="w-2.5 h-2.5 text-zinc-300" /> Passkey
                          </span>
                        )}
                        <span className="text-zinc-300 font-bold">${grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </button>

                {/* Apple Pay Multi-Card Selector */}
                {walletsState?.apple?.linked && walletsState.apple.cards && walletsState.apple.cards.length > 0 && (
                  <div className="px-1">
                    <button
                      type="button"
                      onClick={() => setExpandedCardSelector(expandedCardSelector === 'apple' ? null : 'apple')}
                      className="text-[9px] font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer py-0.5"
                    >
                      <Settings2 className="w-3 h-3 text-zinc-400" />
                      <span>Choose Apple Wallet Card ({walletsState.apple.cards.length} attached)</span>
                      {expandedCardSelector === 'apple' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedCardSelector === 'apple' && (
                      <div className="mt-1.5 p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-1.5 animate-in fade-in-50 duration-200">
                        <span className="text-[8.5px] font-mono uppercase text-zinc-400 block px-1">Select card for this checkout:</span>
                        <div className="grid grid-cols-1 gap-1">
                          {walletsState.apple.cards.map((card, cardIdx) => {
                            const isSelected = (walletsState.apple.selectedCardId || walletsState.apple.cards[0]?.id) === card.id;
                            return (
                              <div
                                key={card.id ? `acard-${card.id}-${cardIdx}` : `acard-${cardIdx}`}
                                onClick={() => {
                                  selectWalletCard('apple', card.id, userProfile);
                                  setWalletsState(getStoredWallets(userProfile));
                                }}
                                className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-zinc-800 border-zinc-500 text-white font-bold'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <CreditCard className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
                                  <span className="truncate">{card.nickname || `${card.brand} •••• ${card.last4}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[8px] uppercase px-1 py-0.2 bg-zinc-800 rounded text-zinc-300">{card.brand}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PAYPAL WALLET */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handlePayment('PAYPAL')}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-[#003087]/15 hover:bg-[#003087]/25 border border-[#0079C1]/50 hover:border-[#0079C1] text-sky-200 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-between px-4 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isProcessing && processingMethod === 'PAYPAL' ? (
                    <div className="w-full flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      <span>AUTHORIZING PAYPAL WALLET...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.03 7.46c-.15-1.3-1.12-2.32-2.44-2.73-1-.31-2.43-.31-3.64-.31H9.08a1.05 1.05 0 00-1.03.88L5.34 22.06c-.05.3.17.58.48.58h4.15c.52 0 .97-.37 1.05-.88l1.04-6.52c.05-.3.3-.52.61-.52h1.62c3.42 0 6.02-1.4 6.7-5.6.3-1.85.14-3.53-.96-4.66zM17.4 10.3c-.45 2.76-2.4 2.76-4.7 2.76h-1.62c-.52 0-.97.37-1.05.88l-.7 4.41-1.13 7.07c-.02.13-.13.22-.26.22H5.06c-.18 0-.3-.18-.26-.35l2.67-16.74A1.05 1.05 0 018.5 7.74h4.15c1 0 2.2-.05 3.14.25.96.3 1.54.99 1.68 1.93.07.45.03.95-.07 1.38z" fill="#0079C1"/>
                          </svg>
                        </div>
                        <div className="text-left truncate">
                          <div className="font-bold text-xs truncate">
                            {walletsState?.paypal?.linked ? 'Pay with PayPal' : 'Connect PayPal'}
                          </div>
                          {walletsState?.paypal?.linked && (
                            <div className="text-[9px] text-sky-400 font-mono flex items-center gap-1 font-normal truncate">
                              <span>Funding Source:</span>
                              <span className="text-white font-bold">
                                {walletsState.paypal.cards?.find(c => c.id === walletsState.paypal.selectedCardId)?.nickname || 
                                 walletsState.paypal.cards?.[0]?.nickname || 'PayPal Balance'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {walletsState?.paypal?.linked ? (
                          <span className="text-[8.5px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                            ⚡ 1-TAP
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> OAuth
                          </span>
                        )}
                        <span className="text-sky-300 font-bold">${grandTotal.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </button>

                {/* PayPal Funding Sources Selector */}
                {walletsState?.paypal?.linked && walletsState.paypal.cards && walletsState.paypal.cards.length > 0 && (
                  <div className="px-1">
                    <button
                      type="button"
                      onClick={() => setExpandedCardSelector(expandedCardSelector === 'paypal' ? null : 'paypal')}
                      className="text-[9px] font-mono text-zinc-400 hover:text-sky-300 transition-colors flex items-center gap-1.5 cursor-pointer py-0.5"
                    >
                      <Settings2 className="w-3 h-3 text-sky-400" />
                      <span>Choose PayPal Funding Source ({walletsState.paypal.cards.length} attached)</span>
                      {expandedCardSelector === 'paypal' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {expandedCardSelector === 'paypal' && (
                      <div className="mt-1.5 p-2 bg-zinc-950/90 border border-zinc-800 rounded-xl space-y-1.5 animate-in fade-in-50 duration-200">
                        <span className="text-[8.5px] font-mono uppercase text-zinc-400 block px-1">Select funding source for this checkout:</span>
                        <div className="grid grid-cols-1 gap-1">
                          {walletsState.paypal.cards.map((card, cardIdx) => {
                            const isSelected = (walletsState.paypal.selectedCardId || walletsState.paypal.cards[0]?.id) === card.id;
                            return (
                              <div
                                key={card.id ? `pcard-${card.id}-${cardIdx}` : `pcard-${cardIdx}`}
                                onClick={() => {
                                  selectWalletCard('paypal', card.id, userProfile);
                                  setWalletsState(getStoredWallets(userProfile));
                                }}
                                className={`p-2 rounded-lg border text-[10px] font-mono flex items-center justify-between cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-sky-950/40 border-sky-500 text-white font-bold'
                                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                  <span className="truncate">{card.nickname || `${card.brand} •••• ${card.last4}`}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[8px] uppercase px-1 py-0.2 bg-zinc-800 rounded text-zinc-300">{card.brand}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECONDARY BUTTON 3: STRIPE / CARD */}
              <button
                type="button"
                onClick={() => handlePayment('STRIPE')}
                disabled={isProcessing}
                className="w-full py-3 bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/40 hover:border-indigo-500 text-indigo-200 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-between px-4 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isProcessing && processingMethod === 'STRIPE' ? (
                  <div className="w-full flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span>AUTHORIZING STRIPE CHECKOUT...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-400" />
                      <span>Pay with Stripe / Direct Card</span>
                    </div>
                    <span className="text-indigo-300 font-bold">${grandTotal.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

            {/* Security Trust Badges */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-900">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Instant Escrow Guarantee
              </span>
            </div>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION VIEW */
          <div className="py-4 space-y-4 text-center animate-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border-2 border-emerald-500/60 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                PAYMENT COMPLETED & ESCROW CLEARED
              </span>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">
                ORDER CONFIRMED #{confirmedOrder?.orderId || 'SLM-777'}!
              </h3>
              <p className="text-xs text-zinc-400 font-mono max-w-sm mx-auto">
                Authorized via {confirmedOrder?.paymentMethod || 'Google Wallet'}. Your verified passes and receipts have been stored directly to your Digital Escrow.
              </p>
            </div>

            {/* Summary Details */}
            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 text-left space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Item:</span>
                <span className="font-bold text-white uppercase">{displayTitle}</span>
              </div>
              {isTicket && (
                <div className="flex justify-between items-center text-zinc-300">
                  <span className="text-zinc-500">Admission Tier:</span>
                  <span className="text-rose-400 font-bold uppercase">{activeTierConfig.name}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Total Quantity:</span>
                <span className="font-bold text-white">{quantity}x</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Total Paid:</span>
                <span className="text-emerald-400 font-black">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Attendee Roster if Ticket */}
              {isTicket && confirmedOrder?.data?.attendees && (
                <div className="pt-2 border-t border-zinc-900 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Registered Attendees:</span>
                  {confirmedOrder.data.attendees.map((att: any, idx: number) => (
                    <div key={`order-summary-${idx}`} className="flex justify-between text-[11px] text-zinc-300">
                      <span>• {att.name}</span>
                      <span className="text-zinc-500 font-mono">{att.size ? `Size: ${att.size}` : 'Pass Confirmed'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              {isTicket && setViewingReceipt && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirmedOrder) {
                      setViewingReceipt(confirmedOrder);
                    }
                    onClose();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" /> VIEW TICKET IN DIGITAL ESCROW
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer border border-zinc-800"
              >
                DONE / BACK TO APP
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Digital Wallet OAuth Authentication Modal */}
      {activeOAuthProvider && (
        <WalletOAuthModal
          isOpen={true}
          provider={activeOAuthProvider}
          userProfile={userProfile}
          onClose={() => setActiveOAuthProvider(null)}
          onSuccess={(provider) => {
            const updated = getStoredWallets(userProfile);
            setWalletsState(updated);
            setActiveOAuthProvider(null);
            if (triggerNotification) {
              triggerNotification(
                'Wallet Connected',
                `Successfully authenticated and secured your ${provider.toUpperCase()} wallet!`,
                '🔐'
              );
            }
          }}
        />
      )}
    </div>
  );
}

export default StripeCheckoutModal;
