import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  MapPin,
  CreditCard,
  Truck,
  Check,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Fingerprint,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStoredWallets, processWalletPayment, selectWalletCard, UserWalletsState, WalletCard } from '../../../services/digitalWalletService';
import { WalletOAuthModal } from './WalletOAuthModal';
import { supabase } from '../../../lib/supabaseClient';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51TfwzZA5e7qgTyokirZWVa11YM5Rvu1Ed0X4wPF0oMIch7dK99IP7Fqi5ETt1WgSs69y2P27Djo5tHim9ZWlWpn200HjmhACTR';
const isRealStripeKey = typeof stripePublicKey === 'string' && stripePublicKey.startsWith('pk_') && !stripePublicKey.includes('placeholder');
const stripePromise = isRealStripeKey ? loadStripe(stripePublicKey) : null;

export interface StripeCartCheckoutModalProps {
  cartItems: any[];
  onClose: () => void;
  onClearCart?: () => void;
  userProfile?: any;
}

export function StripeCartCheckoutModal({
  cartItems = [],
  onClose,
  onClearCart,
  userProfile
}: StripeCartCheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'confirm' | 'success'>('confirm');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<'GOOGLE_WALLET' | 'APPLE_PAY' | 'PAYPAL' | 'STRIPE' | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
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
  }, [userProfile]);

  // Shipping Configuration
  const [useWalletAddress, setUseWalletAddress] = useState<boolean>(true);
  const [shippingName, setShippingName] = useState<string>(userProfile?.full_name || userProfile?.username || '');
  const [shippingStreet, setShippingStreet] = useState<string>('');
  const [shippingCity, setShippingCity] = useState<string>('');
  const [shippingState, setShippingState] = useState<string>('');
  const [shippingZip, setShippingZip] = useState<string>('');
  const [shippingPhone, setShippingPhone] = useState<string>('');
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  const totalAmount = (cartItems || []).reduce(
    (acc: number, item: any) => acc + ((item.price || 0) * (item.quantity || 1)),
    0
  );

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
    if (useWalletAddress) return true;
    const errors: Record<string, string> = {};
    if (!shippingName.trim()) errors.name = 'Full name is required';
    if (!shippingStreet.trim()) errors.street = 'Street address is required';
    if (!shippingCity.trim()) errors.city = 'City is required';
    if (!shippingState.trim()) errors.state = 'State is required';
    if (!shippingZip.trim()) errors.zip = 'ZIP code is required';

    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePay = async (method: 'GOOGLE_WALLET' | 'APPLE_PAY' | 'PAYPAL' | 'STRIPE') => {
    if (!validateCustomAddress()) return;

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
      const paymentResult = await processWalletPayment(method, totalAmount, userProfile);
      const generatedOrderId = paymentResult.orderId;
      setConfirmedOrderId(generatedOrderId);

      // Add purchases to local storage
      try {
        const newPurchases = cartItems.map((item: any, idx: number) => ({
          id: `col_${Date.now()}_${idx}`,
          orderId: generatedOrderId,
          transactionId: paymentResult.transactionId,
          type: 'merch' as const,
          data: {
            id: item.productId || item.id,
            name: item.name,
            thumbnail: item.image || item.thumbnail,
            price: item.price,
            band: item.bandName,
            sizes: item.size ? [item.size] : [],
            shippingAddress: {
              type: useWalletAddress ? 'Wallet Saved Address' : 'Custom Shipping Address',
              name: useWalletAddress ? (userProfile?.full_name || 'Wallet User') : shippingName,
              street: useWalletAddress ? 'Wallet Default Address on File' : shippingStreet,
              city: useWalletAddress ? 'Wallet City' : shippingCity,
              state: useWalletAddress ? 'CA' : shippingState,
              zip: useWalletAddress ? '90026' : shippingZip,
              phone: shippingPhone || 'N/A'
            }
          },
          quantity: item.quantity || 1,
          paymentMethod: paymentResult.paymentMethod,
          date: new Date()
        }));

        const existing = JSON.parse(localStorage.getItem('nexus_my_collections_v1') || '[]');
        localStorage.setItem('nexus_my_collections_v1', JSON.stringify([...newPurchases, ...existing]));
      } catch (e) {
        console.warn('Failed to save to collections', e);
      }

      if (onClearCart) onClearCart();
      setCheckoutStep('success');
    } catch (err: any) {
      console.error('Checkout error', err);
    } finally {
      setIsProcessing(false);
      setProcessingMethod(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0e1014] border border-rose-500/40 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-[0_0_60px_rgba(244,63,94,0.25)] space-y-4 relative overflow-hidden my-auto text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-mono font-black text-xs uppercase tracking-wide">
                EXPRESS CART CHECKOUT
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">1-Click Fast Checkout • Instant Escrow</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {checkoutStep === 'confirm' ? (
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
            {/* Cart Items List */}
            <div className="flex flex-col gap-2 bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/90 max-h-44 overflow-y-auto">
              {cartItems.map((item: any, idx: number) => (
                <div key={item.id ? `cart-item-${item.id}-${idx}` : `cart-item-${idx}`} className="flex gap-3 items-center p-1.5 bg-zinc-900/40 rounded-xl border border-zinc-800/50">
                  <img
                    src={item.image || item.thumbnail || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300'}
                    alt={item.name}
                    className="w-12 h-12 object-contain bg-zinc-900 rounded-lg p-1 shrink-0 border border-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-mono font-bold text-xs truncate">
                      {item.name}
                    </h4>
                    <p className="text-zinc-400 font-mono text-[9px] uppercase mt-0.5">
                      BY {item.bandName || 'Official Band'} {item.size ? `• SIZE: ${item.size}` : ''} • QTY: {item.quantity || 1}
                    </p>
                  </div>
                  <div className="text-rose-400 font-mono font-black text-xs shrink-0">
                    ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="flex justify-between items-center py-2 px-3 bg-zinc-950 rounded-xl border border-zinc-800/80 font-mono">
              <span className="text-zinc-400 text-xs uppercase font-bold">Total Amount</span>
              <span className="text-rose-500 text-base font-black">${totalAmount.toFixed(2)}</span>
            </div>

            {/* Shipping & Address Capture Section */}
            <div className="p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-white">
                  <Truck className="w-3.5 h-3.5 text-sky-400" />
                  <span>Shipping & Address</span>
                </div>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Priority Express
                </span>
              </div>

              {/* Option 1: Wallet Saved Address (Default) */}
              <div
                onClick={() => setUseWalletAddress(true)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
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
                    <span>Wallet Saved Address</span>
                    <span className="text-[9px] font-mono text-sky-400 font-bold">Default</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Saved shipping address from Google Wallet / Apple Pay will be used.
                  </p>
                </div>
              </div>

              {/* Option 2: Ship to a Different Address */}
              <div
                onClick={() => setUseWalletAddress(false)}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
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
                    Provide a custom destination address for this delivery.
                  </p>
                </div>
              </div>

              {/* Address Capture Form */}
              {!useWalletAddress && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/80 animate-in fade-in">
                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Recipient Full Name *
                    </label>
                    <input
                      type="text"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      placeholder="Full Name"
                      className={`w-full bg-zinc-900 border rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none ${
                        addressErrors.name ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={shippingStreet}
                      onChange={(e) => setShippingStreet(e.target.value)}
                      placeholder="1234 Street Name, Apt 4"
                      className={`w-full bg-zinc-900 border rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none ${
                        addressErrors.street ? 'border-red-500' : 'border-zinc-800 focus:border-rose-500'
                      }`}
                    />
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
                        placeholder="City"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
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
                        placeholder="State"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
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
                        placeholder="ZIP"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Provider Buttons Hierarchy */}
            <div className="space-y-3 pt-1">
              {/* GOOGLE WALLET */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handlePay('GOOGLE_WALLET')}
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
                        <span className="font-black text-rose-400">${totalAmount.toFixed(2)}</span>
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
                                key={card.id ? `cart-gcard-${card.id}-${cardIdx}` : `cart-gcard-${cardIdx}`}
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
                  onClick={() => handlePay('APPLE_PAY')}
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
                        <span className="text-zinc-300 font-bold">${totalAmount.toFixed(2)}</span>
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
                                key={card.id ? `cart-acard-${card.id}-${cardIdx}` : `cart-acard-${cardIdx}`}
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
                  onClick={() => handlePay('PAYPAL')}
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
                        <span className="text-sky-300 font-bold">${totalAmount.toFixed(2)}</span>
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
                                key={card.id ? `cart-pcard-${card.id}-${cardIdx}` : `cart-pcard-${cardIdx}`}
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
                onClick={() => handlePay('STRIPE')}
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
                    <span className="text-indigo-300 font-bold">${totalAmount.toFixed(2)}</span>
                  </>
                )}
              </button>
            </div>

            {/* Security Badges */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-900">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit SSL Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-400" /> Escrow Protected
              </span>
            </div>
          </div>
        ) : (
          /* SUCCESS VIEW */
          <div className="text-center py-4 space-y-3 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-white font-mono font-black text-base uppercase tracking-wider">
              ORDER CONFIRMED #{confirmedOrderId || 'SLM-777'}!
            </h3>
            <p className="text-zinc-400 font-mono text-xs max-w-xs mx-auto">
              Your cart has been authorized via Wallet! Receipts and tracking updates have been synchronized to your collections.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
            >
              CLOSE
            </button>
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
          onSuccess={() => {
            const updated = getStoredWallets(userProfile);
            setWalletsState(updated);
            setActiveOAuthProvider(null);
          }}
        />
      )}
    </div>
  );
}

export default StripeCartCheckoutModal;
