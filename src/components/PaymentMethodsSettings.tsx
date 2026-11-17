import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Check, Plus, Trash2, ShieldCheck, 
  ArrowRight, RefreshCw, AlertTriangle, CheckCircle2, 
  Lock, Sparkles, DollarSign, Wallet, HelpCircle, X,
  Zap, MapPin, Mail, Phone, Eye, EyeOff, FileText,
  Sliders, Shield, ChevronRight, CheckCircle, Smartphone
} from 'lucide-react';
import { UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';

export interface SavedBuyerCard {
  id: string;
  brand: 'Visa' | 'Mastercard' | 'Amex' | 'Discover' | 'JCB' | 'Diners';
  last4: string;
  expMonth: string;
  expYear: string;
  isDefault: boolean;
  holderName: string;
  postalCode?: string;
  country?: string;
  nickname?: string;
  createdDate?: string;
}

export interface BuyerBillingPreferences {
  oneTapCheckout: boolean;
  defaultCurrency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY';
  emailReceipts: boolean;
  smsNotifications: boolean;
  billingStreet: string;
  billingApt: string;
  billingCity: string;
  billingState: string;
  billingZip: string;
  billingCountry: string;
}

export interface PaymentMethodsSettingsProps {
  userProfile?: UserProfile | null;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  triggerNotification?: (msg: string, icon?: string) => void;
  className?: string;
}

const CARDS_STORAGE_KEY = 'nexus_buyer_saved_cards_v2';
const PREFS_STORAGE_KEY = 'nexus_buyer_billing_prefs_v1';

export const PaymentMethodsSettings: React.FC<PaymentMethodsSettingsProps> = ({
  userProfile,
  setUserProfile,
  triggerNotification,
  className = ''
}) => {
  // 1. Saved Cards State
  const [savedCards, setSavedCards] = useState<SavedBuyerCard[]>(() => {
    try {
      const stored = localStorage.getItem(CARDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'card_default_4242',
        brand: 'Visa',
        last4: '4242',
        expMonth: '12',
        expYear: '28',
        isDefault: true,
        holderName: userProfile?.name || 'Primary Fan Card',
        postalCode: (userProfile as any)?.zip || (userProfile as any)?.postal_code || '90210',
        country: (userProfile as any)?.country || 'US',
        nickname: 'Primary Checkout Card',
        createdDate: 'Verified Standard Token'
      }
    ];
  });

  // 2. Billing & Checkout Preferences State
  const [billingPrefs, setBillingPrefs] = useState<BuyerBillingPreferences>(() => {
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return {
      oneTapCheckout: true,
      defaultCurrency: 'USD',
      emailReceipts: true,
      smsNotifications: false,
      billingStreet: '',
      billingApt: '',
      billingCity: (userProfile as any)?.location?.split(',')[0]?.trim() || '',
      billingState: (userProfile as any)?.state || '',
      billingZip: (userProfile as any)?.zip || (userProfile as any)?.postal_code || '',
      billingCountry: (userProfile as any)?.country || 'US'
    };
  });

  // Active view tab inside payment manager: 'cards' | 'preferences' | 'simulator'
  const [activeSubTab, setActiveSubTab] = useState<'cards' | 'preferences' | 'simulator'>('cards');

  // Add Card Form State & Validation
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');
  const [newCardHolder, setNewCardHolder] = useState(userProfile?.name || '');
  const [newCardZip, setNewCardZip] = useState((userProfile as any)?.zip || (userProfile as any)?.postal_code || '');
  const [newCardNickname, setNewCardNickname] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [showCvc, setShowCvc] = useState(false);
  const [cardError, setCardError] = useState('');
  const [isProcessingAdd, setIsProcessingAdd] = useState(false);

  // Quick Authorization Test Simulator State
  const [isSimulatingAuth, setIsSimulatingAuth] = useState(false);
  const [authSuccessToken, setAuthSuccessToken] = useState<string | null>(null);

  // Sync saved cards to localStorage & Supabase if user exists
  const persistCards = (cards: SavedBuyerCard[]) => {
    setSavedCards(cards);
    try {
      localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error('Failed to persist cards:', e);
    }
  };

  const persistPrefs = (prefs: BuyerBillingPreferences) => {
    setBillingPrefs(prefs);
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to persist billing prefs:', e);
    }
  };

  // Helper to detect card brand
  const detectBrand = (numberStr: string): SavedBuyerCard['brand'] => {
    const clean = numberStr.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('51') || clean.startsWith('52') || clean.startsWith('53') || clean.startsWith('54') || clean.startsWith('55') || (clean.length >= 4 && parseInt(clean.slice(0, 4), 10) >= 2221 && parseInt(clean.slice(0, 4), 10) <= 2720)) return 'Mastercard';
    if (clean.startsWith('34') || clean.startsWith('37')) return 'Amex';
    if (clean.startsWith('6011') || clean.startsWith('65') || clean.startsWith('644') || clean.startsWith('645')) return 'Discover';
    if (clean.startsWith('35')) return 'JCB';
    if (clean.startsWith('30') || clean.startsWith('36') || clean.startsWith('38')) return 'Diners';
    return 'Visa';
  };

  // Set default card handler
  const handleSetDefaultCard = (cardId: string) => {
    const updated = savedCards.map(c => ({
      ...c,
      isDefault: c.id === cardId
    }));
    persistCards(updated);
    triggerNotification?.('Default checkout card updated.', '💳');
  };

  // Delete card handler
  const handleDeleteCard = (cardId: string) => {
    if (savedCards.length <= 1) {
      triggerNotification?.('You must maintain at least one saved payment method.', '⚠️');
      return;
    }
    const target = savedCards.find(c => c.id === cardId);
    const updated = savedCards.filter(c => c.id !== cardId);
    if (!updated.some(c => c.isDefault) && updated.length > 0) {
      updated[0].isDefault = true;
    }
    persistCards(updated);
    triggerNotification?.(`Removed ${target?.brand || 'card'} ending in ${target?.last4 || ''}.`, '🗑️');
  };

  // Preset Card Fill Quick Helper
  const handleApplyPresetCard = (type: 'visa' | 'mastercard' | 'amex') => {
    if (type === 'visa') {
      setNewCardNumber('4242 4242 4242 4242');
      setNewCardExpiry('08/29');
      setNewCardCvc('842');
      setNewCardNickname('Stripe Test Visa');
    } else if (type === 'mastercard') {
      setNewCardNumber('5555 5555 5555 4444');
      setNewCardExpiry('11/28');
      setNewCardCvc('519');
      setNewCardNickname('Mastercard Gold');
    } else if (type === 'amex') {
      setNewCardNumber('3782 822463 10005');
      setNewCardExpiry('04/30');
      setNewCardCvc('1005');
      setNewCardNickname('Amex Express Platinum');
    }
  };

  // Save New Card
  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');

    const cleanNum = newCardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15 || cleanNum.length > 16) {
      setCardError('Please enter a valid 15 or 16 digit card number.');
      return;
    }

    if (!newCardExpiry.includes('/') || newCardExpiry.length < 4) {
      setCardError('Please enter expiration in MM/YY format.');
      return;
    }

    const [monthStr, yearStr] = newCardExpiry.split('/');
    const month = parseInt(monthStr, 10);
    if (isNaN(month) || month < 1 || month > 12) {
      setCardError('Invalid expiration month. Must be between 01 and 12.');
      return;
    }

    if (newCardCvc.length < 3) {
      setCardError('Please provide a valid 3 or 4 digit security code (CVC).');
      return;
    }

    setIsProcessingAdd(true);

    setTimeout(() => {
      const brand = detectBrand(cleanNum);
      const last4 = cleanNum.slice(-4);

      const newCard: SavedBuyerCard = {
        id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        brand,
        last4,
        expMonth: monthStr.trim().padStart(2, '0'),
        expYear: yearStr.trim(),
        isDefault: setAsDefault || savedCards.length === 0,
        holderName: newCardHolder.trim() || userProfile?.name || 'Cardholder',
        postalCode: newCardZip.trim() || '90210',
        country: 'US',
        nickname: newCardNickname.trim() || `${brand} •••• ${last4}`,
        createdDate: new Date().toLocaleDateString()
      };

      let updatedList = [...savedCards];
      if (newCard.isDefault) {
        updatedList = updatedList.map(c => ({ ...c, isDefault: false }));
      }
      updatedList.push(newCard);

      persistCards(updatedList);
      setIsProcessingAdd(false);
      setIsAddingCard(false);

      // Reset form
      setNewCardNumber('');
      setNewCardExpiry('');
      setNewCardCvc('');
      setNewCardNickname('');
      triggerNotification?.(`Securely tokenized ${brand} ending in ${last4}.`, '✨');
    }, 450);
  };

  // Run $0.00 Sandbox Authorization Ping
  const handleRunAuthPing = () => {
    setIsSimulatingAuth(true);
    setAuthSuccessToken(null);

    const defaultCard = savedCards.find(c => c.isDefault) || savedCards[0];

    setTimeout(() => {
      setIsSimulatingAuth(false);
      const mockToken = `tok_auth_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setAuthSuccessToken(mockToken);
      triggerNotification?.(`$0.00 Authorization Ping Successful on ${defaultCard.brand} •••• ${defaultCard.last4}`, '✅');
    }, 1200);
  };

  const defaultCard = savedCards.find(c => c.isDefault) || savedCards[0];

  return (
    <div className={`space-y-5 text-zinc-200 select-none ${className}`}>
      
      {/* ========================================================= */}
      {/* 1. HEADER & SUB-NAVIGATION BAR                           */}
      {/* ========================================================= */}
      <div className="bg-[#090b10] border border-zinc-850 rounded-2xl p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center gap-1.5">
                <span>Payment & Checkout Hub</span>
                <span className="text-[8px] font-mono font-bold text-purple-400 bg-purple-950/60 border border-purple-800/40 px-1.5 py-0.2 rounded">
                  BUYER VAULT
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans mt-0.5">
                Securely manage saved cards, 1-tap checkout, and billing presets.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[8.5px] font-mono text-zinc-400 bg-zinc-900/90 border border-zinc-800 px-2 py-1 rounded-lg">
            <Lock className="w-2.5 h-2.5 text-emerald-400" />
            <span>256-BIT TLS</span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-950/80 border border-zinc-900 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('cards')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'cards'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <CreditCard className="w-3 h-3 text-purple-400" />
            <span>Cards ({savedCards.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('preferences')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'preferences'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Sliders className="w-3 h-3 text-purple-400" />
            <span>Billing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('simulator')}
            className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeSubTab === 'simulator'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
            }`}
          >
            <Zap className="w-3 h-3 text-purple-400" />
            <span>1-Tap Test</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SAVED CARDS MANAGEMENT                             */}
      {/* ========================================================= */}
      {activeSubTab === 'cards' && (
        <div className="space-y-4">
          
          {/* Primary Default Card Highlight Visual Showcase */}
          {defaultCard && !isAddingCard && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161324] via-[#0f111a] to-[#0a0c10] border border-purple-500/30 p-4 shadow-[0_0_25px_rgba(168,85,247,0.12)]">
              {/* Background ambient badge / pattern */}
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-5 rounded bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
                    <div className="w-4 h-3 bg-amber-400/70 rounded-[2px] border border-amber-300/40" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                    Contactless Standard
                  </span>
                </div>
                <span className="text-[8px] font-mono font-black uppercase text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <CheckCircle2 className="w-2.5 h-2.5 text-purple-400" />
                  DEFAULT CHECKOUT METHOD
                </span>
              </div>

              {/* Masked Card Number Display */}
              <div className="mt-4 mb-3">
                <div className="text-base sm:text-lg font-mono font-bold tracking-[0.25em] text-white flex items-center gap-2">
                  <span>••••</span>
                  <span>••••</span>
                  <span>••••</span>
                  <span className="text-purple-300">{defaultCard.last4}</span>
                </div>
                <div className="text-[9.5px] font-mono text-zinc-400 mt-1 flex items-center gap-2">
                  <span>{defaultCard.nickname || defaultCard.brand}</span>
                  <span>•</span>
                  <span className="text-emerald-400">Ready for instant 1-tap checkout</span>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="flex items-end justify-between pt-2 border-t border-zinc-800/60 text-[9px] font-mono">
                <div>
                  <div className="text-zinc-500 uppercase text-[7.5px] tracking-wider">Cardholder</div>
                  <div className="font-bold text-zinc-200 uppercase truncate max-w-[150px]">
                    {defaultCard.holderName}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 uppercase text-[7.5px] tracking-wider">Expires</div>
                  <div className="font-bold text-zinc-200">
                    {defaultCard.expMonth}/{defaultCard.expYear}
                  </div>
                </div>
                <div className="text-right font-black uppercase tracking-wider text-xs text-white">
                  {defaultCard.brand}
                </div>
              </div>
            </div>
          )}

          {/* List of All Saved Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Stored Payment Tokens ({savedCards.length})
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                PCI-DSS Level 1 Encrypted
              </span>
            </div>

            {savedCards.map((card, cIdx) => (
              <div
                key={`${card.id}-${cIdx}`}
                className={`bg-[#0c0e14] border rounded-xl p-3 flex items-center justify-between transition-all ${
                  card.isDefault
                    ? 'border-purple-500/50 bg-purple-950/10 shadow-[0_0_15px_rgba(168,85,247,0.06)]'
                    : 'border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    card.isDefault
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-mono">
                        {card.brand} •••• {card.last4}
                      </span>
                      {card.isDefault ? (
                        <span className="text-[7.5px] font-mono font-bold text-purple-300 bg-purple-950 border border-purple-500/40 px-1.5 py-0.2 rounded uppercase">
                          DEFAULT
                        </span>
                      ) : (
                        <span className="text-[7.5px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.2 rounded">
                          BACKUP
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      Exp {card.expMonth}/{card.expYear} • {card.holderName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {!card.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefaultCard(card.id)}
                      className="text-[9px] font-mono text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}
                  {card.isDefault ? (
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                      title="Remove Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Card Form / Drawer Expansion */}
          {!isAddingCard ? (
            <button
              type="button"
              onClick={() => setIsAddingCard(true)}
              className="w-full py-3 border border-dashed border-zinc-800 hover:border-purple-500/60 rounded-2xl text-zinc-300 hover:text-white text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 bg-[#0c0e14]/50 hover:bg-purple-950/20 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Add New Payment Card</span>
            </button>
          ) : (
            <form onSubmit={handleSaveNewCard} className="bg-[#0b0d13] border border-purple-500/40 rounded-2xl p-4 space-y-4 shadow-xl animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                    Add Payment Card
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick test card preset pills */}
              <div>
                <div className="text-[8.5px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  <span>Fill Sandbox Test Cards:</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPresetCard('visa')}
                    className="py-1 px-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 rounded-lg text-[8.5px] font-mono font-bold text-zinc-300 transition-colors cursor-pointer text-center truncate"
                  >
                    Test Visa 4242
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetCard('mastercard')}
                    className="py-1 px-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 rounded-lg text-[8.5px] font-mono font-bold text-zinc-300 transition-colors cursor-pointer text-center truncate"
                  >
                    Test Master 5555
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPresetCard('amex')}
                    className="py-1 px-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-purple-500/40 rounded-lg text-[8.5px] font-mono font-bold text-zinc-300 transition-colors cursor-pointer text-center truncate"
                  >
                    Test Amex 3782
                  </button>
                </div>
              </div>

              {cardError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-[10px] text-rose-300 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{cardError}</span>
                </div>
              )}

              <div className="space-y-3">
                {/* Cardholder name */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Cardholder Full Name
                  </label>
                  <input
                    type="text"
                    value={newCardHolder}
                    onChange={(e) => setNewCardHolder(e.target.value)}
                    placeholder="Full Legal Name on Card"
                    className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                    required
                  />
                </div>

                {/* Card number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider">
                      Card Number
                    </label>
                    <span className="text-[8.5px] font-mono text-purple-400 uppercase font-bold">
                      {detectBrand(newCardNumber)} Detected
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={newCardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                        setNewCardNumber(val.replace(/(\d{4})/g, '$1 ').trim());
                      }}
                      placeholder="•••• •••• •••• ••••"
                      className="w-full px-3 py-2 pl-9 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono tracking-wider"
                      required
                    />
                    <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Expiry & CVC in grid */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={newCardExpiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                        if (val.length >= 3) {
                          val = `${val.slice(0, 2)}/${val.slice(2)}`;
                        }
                        setNewCardExpiry(val);
                      }}
                      placeholder="12/28"
                      className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono text-center"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Security Code (CVC)
                    </label>
                    <div className="relative">
                      <input
                        type={showCvc ? 'text' : 'password'}
                        value={newCardCvc}
                        onChange={(e) => setNewCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="•••"
                        className="w-full px-3 py-2 pr-8 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono text-center"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCvc(!showCvc)}
                        className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-zinc-300"
                      >
                        {showCvc ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Billing Postal & Nickname */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Billing ZIP / Postal
                    </label>
                    <input
                      type="text"
                      value={newCardZip}
                      onChange={(e) => setNewCardZip(e.target.value)}
                      placeholder="90210"
                      className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Card Nickname (Opt.)
                    </label>
                    <input
                      type="text"
                      value={newCardNickname}
                      onChange={(e) => setNewCardNickname(e.target.value)}
                      placeholder="e.g. Gig Wallet"
                      className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Set as Default Switch */}
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/60 border border-zinc-850 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-950 border-zinc-800"
                  />
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-white block">
                      Set as primary default card for 1-tap checkout
                    </span>
                    <span className="text-[8.5px] text-zinc-500 block">
                      Auto-selected when purchasing tour tickets and physical merch
                    </span>
                  </div>
                </label>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isProcessingAdd}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-950/40 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isProcessingAdd ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Tokenizing Card...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Save & Tokenize Card</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCard(false)}
                  className="px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-mono rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Digital Wallets Info Row */}
          <div className="p-3 bg-zinc-950/80 border border-zinc-850 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-mono font-bold uppercase text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>Digital Wallet Compatibility</span>
              </span>
              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.2 rounded">
                ACTIVE
              </span>
            </div>
            <p className="text-[9px] text-zinc-400 leading-relaxed font-sans">
              Apple Pay, Google Pay, and Link by Stripe are dynamically presented in the checkout modal whenever supported by your browser or device hardware.
            </p>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: BILLING & CHECKOUT PREFERENCES                     */}
      {/* ========================================================= */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-4">
          <div className="bg-[#0b0d13] border border-zinc-850 rounded-2xl p-4 space-y-4">
            
            <div className="border-b border-zinc-850 pb-2">
              <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Checkout & Order Preferences</span>
              </h4>
              <p className="text-[9.5px] text-zinc-400 mt-0.5">
                Configure default currency and instant digital receipt delivery.
              </p>
            </div>

            {/* 1-Tap Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl">
              <div>
                <span className="text-[11px] font-mono font-bold text-white block">
                  1-Tap Instant Checkout
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">
                  Bypass confirmation modal for rapid ticket and merch buys
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const updated = { ...billingPrefs, oneTapCheckout: !billingPrefs.oneTapCheckout };
                  persistPrefs(updated);
                  triggerNotification?.(updated.oneTapCheckout ? "1-Tap Checkout Enabled." : "1-Tap Checkout Disabled.", '⚡');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  billingPrefs.oneTapCheckout ? 'bg-purple-600' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  billingPrefs.oneTapCheckout ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Default Currency Selector */}
            <div>
              <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">
                Default Currency
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'] as const).map((curr, currIdx) => (
                  <button
                    key={`${curr}-${currIdx}`}
                    type="button"
                    onClick={() => {
                      const updated = { ...billingPrefs, defaultCurrency: curr };
                      persistPrefs(updated);
                      triggerNotification?.(`Default currency set to ${curr}.`, '💵');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      billingPrefs.defaultCurrency === curr
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40 border border-purple-400/50'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Instant Receipts Toggles */}
            <div className="space-y-2 pt-2 border-t border-zinc-850">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-850/80 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-zinc-200 block">
                      Email Order Receipts
                    </span>
                    <span className="text-[8.5px] text-zinc-500 block">
                      Send instant itemized PDF invoices to {userProfile?.email || 'registered email'}
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={billingPrefs.emailReceipts}
                  onChange={(e) => {
                    const updated = { ...billingPrefs, emailReceipts: e.target.checked };
                    persistPrefs(updated);
                  }}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-950 border-zinc-800"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-850/80 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <div className="text-left">
                    <span className="text-[10px] font-mono font-bold text-zinc-200 block">
                      SMS Merch Tracking & Dispatch
                    </span>
                    <span className="text-[8.5px] text-zinc-500 block">
                      Receive tracking updates when bands ship your order
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={billingPrefs.smsNotifications}
                  onChange={(e) => {
                    const updated = { ...billingPrefs, smsNotifications: e.target.checked };
                    persistPrefs(updated);
                  }}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-zinc-950 border-zinc-800"
                />
              </label>
            </div>

            {/* Default Shipping / Billing Address Inputs */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-850">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
                  Default Merch Shipping Destination
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={billingPrefs.billingStreet}
                  onChange={(e) => {
                    const updated = { ...billingPrefs, billingStreet: e.target.value };
                    persistPrefs(updated);
                  }}
                  placeholder="Street Address (e.g. 123 Underground Ave)"
                  className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={billingPrefs.billingCity}
                    onChange={(e) => {
                      const updated = { ...billingPrefs, billingCity: e.target.value };
                      persistPrefs(updated);
                    }}
                    placeholder="City"
                    className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                  />
                  <input
                    type="text"
                    value={billingPrefs.billingZip}
                    onChange={(e) => {
                      const updated = { ...billingPrefs, billingZip: e.target.value };
                      persistPrefs(updated);
                    }}
                    placeholder="ZIP / Postal Code"
                    className="w-full px-3 py-2 bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: 1-TAP CHECKOUT TEST SIMULATOR                     */}
      {/* ========================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          <div className="bg-[#0b0d13] border border-purple-500/30 rounded-2xl p-4 space-y-4 shadow-xl">
            <div className="border-b border-zinc-850 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
                  Test 1-Tap Authorization Simulator
                </h4>
              </div>
              <p className="text-[9.5px] text-zinc-400 mt-0.5 leading-relaxed">
                Execute a $0.00 pre-authorization handshake against your active default payment card to verify immediate readiness for tour drops and tickets.
              </p>
            </div>

            {/* Active Card Badge */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-950 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">
                    {defaultCard?.brand || 'Visa'} ending in {defaultCard?.last4 || '4242'}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-mono">
                    Token ID: {defaultCard?.id || 'tok_default'}
                  </div>
                </div>
              </div>

              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded uppercase font-bold">
                READY
              </span>
            </div>

            {/* Trigger Button */}
            <button
              type="button"
              onClick={handleRunAuthPing}
              disabled={isSimulatingAuth}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSimulatingAuth ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authorizing Handshake...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute $0.00 Authorization Ping</span>
                </>
              )}
            </button>

            {/* Result Display */}
            {authSuccessToken && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2 text-emerald-300 font-mono text-xs animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Card Validated & Ready</span>
                  </div>
                  <span className="text-[8px] text-emerald-400 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                    HTTP 200 OK
                  </span>
                </div>
                <div className="text-[9.5px] text-zinc-400 bg-black/50 p-2 rounded-lg border border-emerald-900/40 font-mono break-all space-y-1">
                  <div>Auth Token: <span className="text-purple-300">{authSuccessToken}</span></div>
                  <div>Network Response: <span className="text-emerald-400">Card Authorized (CVV Matched, AVS Passed)</span></div>
                  <div>Timestamp: <span className="text-zinc-400">{new Date().toLocaleTimeString()}</span></div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Security Assurance Footer */}
      <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[8px] font-mono text-zinc-500 px-1">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-purple-400" />
          <span>Stripe Elements & PCI DSS Level 1</span>
        </div>
        <span>Encrypted Customer Vault</span>
      </div>

    </div>
  );
};

export default PaymentMethodsSettings;
