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
  Settings2
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { enrichTicketData } from '../../utils/socialFeedUtils';
import { getStoredWallets, processWalletPayment, selectWalletCard, UserWalletsState, WalletCard } from '../../services/digitalWalletService';
import { WalletOAuthModal } from './modals/WalletOAuthModal';
import { supabase } from '../../lib/supabaseClient';

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

  // Base price computation
  const parsePrice = (p: any): number => {
    if (typeof p === 'number') return p;
    if (typeof p === 'string') {
      const cleaned = p.replace(/[^0-9.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 25 : parsed;
    }
    return 25;
  };

  const initialBasePrice = parsePrice(
    baseInitialPrice || rawItem?.price || rawItem?.ticketPrice || rawItem?.ticket_price || post?.price || 25
  );

  // Ticket Tiers
  type TicketTierKey = 'ga' | 'vip_pit' | 'vip_merch' | 'ultra_fan';
  const [selectedTier, setSelectedTier] = useState<TicketTierKey>('ga');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedMerchSize, setSelectedMerchSize] = useState<string>(initialSize);

  // Available Sizes for apparel
  const availableSizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

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

  // Pricing calculations per tier
  const tierPricing = {
    ga: {
      name: 'General Admission (GA)',
      price: initialBasePrice,
      desc: 'Instant QR Gate Pass • Standing Floor & Pit Access',
      icon: Ticket,
      includesMerch: false
    },
    vip_pit: {
      name: 'VIP Floor & Fast Track Pit',
      price: initialBasePrice + 20,
      desc: '30-Min Early Door Access • VIP Fast Track Pit Wristband',
      icon: Flame,
      includesMerch: false
    },
    vip_merch: {
      name: 'VIP + Merch Bundle (Includes Tour Tee)',
      price: initialBasePrice + 45,
      desc: 'VIP Pass + Official Tour T-Shirt + Commemorative Laminate',
      icon: Sparkles,
      includesMerch: true
    },
    ultra_fan: {
      name: 'Ultra Fan Meet & Greet VIP Pass',
      price: initialBasePrice + 90,
      desc: 'Soundcheck Entry + Photo Op + Signed Poster + Tour Hoodie',
      icon: Crown,
      includesMerch: true
    }
  };

  const activeTierConfig = tierPricing[selectedTier];
  const unitPrice = isTicket ? activeTierConfig.price : initialBasePrice;
  const subtotal = unitPrice * quantity;
  const processingFee = isTicket ? 2.50 : 0;
  const grandTotal = subtotal + processingFee;

  // Shipping Configuration
  const requiresShipping = isMerch || (isTicket && activeTierConfig.includesMerch);
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

          const response = await fetch('/api/payments/create-cart-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cartItems: [lineItem],
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
                tier: selectedTier,
                isTicket: String(isTicket),
                quantity: String(quantity),
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
                selectedTier,
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

      if (isTicket) {
        const enriched = enrichTicketData(rawItem);
        purchaseData = {
          ...enriched,
          ...rawItem,
          ticketType: activeTierConfig.name,
          tierCode: selectedTier,
          pricePerUnit: unitPrice,
          attendees: attendeeDetails.map((att, idx) => ({
            name: att.name.trim() || `Attendee ${idx + 1}`,
            tier: selectedTier,
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
      } else {
        purchaseData = {
          ...rawItem,
          name: itemName,
          price: unitPrice,
          size: selectedMerchSize,
          sizes: [selectedMerchSize],
          thumbnail: rawItem?.thumbnail || rawItem?.image || post?.merchData?.thumbnail,
          shippingAddress: {
            type: useWalletAddress ? 'Wallet Saved Address' : 'Custom Shipping Address',
            name: useWalletAddress ? (userProfile?.full_name || 'Wallet User') : shippingName,
            street: useWalletAddress ? 'Wallet Default Address on File' : shippingStreet,
            city: useWalletAddress ? 'Wallet City' : shippingCity,
            state: useWalletAddress ? 'CA' : shippingState,
            zip: useWalletAddress ? '90026' : shippingZip,
            phone: shippingPhone || 'N/A'
          }
        };
      }

      const newRecord = {
        id: `col_${Date.now()}`,
        orderId,
        transactionId: paymentResult.transactionId,
        type: isTicket ? 'ticket' : 'merch',
        data: purchaseData,
        quantity,
        totalAmount: grandTotal,
        paymentMethod: paymentResult.paymentMethod,
        date: new Date()
      };

      // Save to localStorage collections
      try {
        const existing = JSON.parse(localStorage.getItem('nexus_my_collections_v1') || '[]');
        const updated = [newRecord, ...existing];
        localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updated));
        if (setMyCollections) setMyCollections(updated);
      } catch (e) {
        console.warn('Failed to sync collection', e);
      }

      setConfirmedOrder(newRecord);
      setCheckoutStep('success');

      if (triggerNotification) {
        triggerNotification(
          'Payment Authorized',
          `Order #${orderId} paid via ${paymentResult.paymentMethod}! Pass & receipt saved.`,
          '⚡'
        );
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
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0e1014] border border-rose-500/40 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-[0_0_60px_rgba(244,63,94,0.25)] space-y-4 my-auto relative text-zinc-200">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow">
              {isTicket ? <Ticket className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>{isTicket ? 'Live Event Box Office' : '1-Click Express Checkout'}</span>
                <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                  ESCROW PROTECTED
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">Instant Gate Delivery • Verified Authenticity</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {checkoutStep === 'confirm' ? (
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

            {/* 1. TICKET TIERS SELECTOR (If Ticket) */}
            {isTicket && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Ticket className="w-3 h-3 text-rose-500" /> Choose Admission Tier / Package
                  </span>
                  <span className="text-[9px] font-mono text-rose-400 font-bold">4 Options Available</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(tierPricing) as TicketTierKey[]).map((key, keyIdx) => {
                    const tier = tierPricing[key];
                    const isSelected = selectedTier === key;
                    const IconComponent = tier.icon;
                    return (
                      <button
                        key={`tier-${key}-${keyIdx}`}
                        type="button"
                        onClick={() => setSelectedTier(key)}
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
                            <IconComponent className="w-3.5 h-3.5" />
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
                  onClick={() => setQuantity(prev => Math.min(8, prev + 1))}
                  disabled={quantity >= 8}
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

            {/* 4. STANDALONE MERCH SIZING (If Merch) */}
            {isMerch && (
              <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wide text-white">
                    Select Apparel Size
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400">Standard Unisex Fit</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {availableSizes.map((sz, szIdx) => (
                    <button
                      key={`sz-${sz}-${szIdx}`}
                      type="button"
                      onClick={() => setSelectedMerchSize(sz)}
                      className={`py-2 rounded-xl text-xs font-mono font-black transition-all cursor-pointer ${
                        selectedMerchSize === sz
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 border border-rose-400'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
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
            <div className="space-y-1.5 p-3.5 bg-zinc-950/90 rounded-2xl border border-zinc-900 text-xs font-mono">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal ({quantity}x {isTicket ? activeTierConfig.name : 'Item'})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {processingFee > 0 && (
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Gate Escrow & Processing Fee</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
              )}
              {requiresShipping && (
                <div className="flex justify-between text-zinc-500 text-[11px]">
                  <span>Priority Shipping</span>
                  <span className="text-emerald-400 font-bold">FREE INCLUDED</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800/80 font-bold">
                <span className="text-white uppercase">Grand Total</span>
                <span className="text-rose-500 text-base font-black">${grandTotal.toFixed(2)}</span>
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
