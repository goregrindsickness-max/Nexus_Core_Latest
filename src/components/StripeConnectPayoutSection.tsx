import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Landmark,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  DollarSign,
  ArrowUpRight,
  Lock,
  Loader2,
  Wallet,
  CreditCard,
  Plus,
  Building2,
  Users,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { authFetch } from '../utils/apiConfig';
import {
  getStoredWallets,
  addCardToWallet,
  connectWalletWithOAuth,
  UserWalletsState,
  WalletCard,
} from '../services/digitalWalletService';
import {
  PayoutMethodType,
  SellerPayoutRoute,
  PayoutSettlementRecord,
  resolvePayoutRouteForSeller,
  savePayoutRoute,
  getPayoutLedger,
  getPayoutMethodDisplayLabel,
} from '../services/payoutRoutingService';

export interface StripeConnectPayoutSectionProps {
  userProfile: any;
  setUserProfile?: (updater: any) => void;
  portalLabel?: string;
  accentColor?: 'emerald' | 'purple' | 'amber' | 'sky' | 'rose';
  compact?: boolean;
  onNotify?: (title: string, message: string, type?: string) => void;
  triggerNotification?: (msg: any, subtitle?: string, icon?: string) => void;
  showLocalToast?: (msg: string) => void;
  role?: string;
  theme?: string;
  clearanceLevel?: number;
}

interface ConnectAccountStatus {
  connected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  email?: string | null;
  country?: string;
  defaultCurrency?: string;
  simulated?: boolean;
  warning?: string;
}

interface PayoutEntityOption {
  entityType: 'profile' | 'band';
  entityId?: string;
  entityName: string;
  roleLabel: string;
  stripeAccountId?: string;
}

export const StripeConnectPayoutSection: React.FC<StripeConnectPayoutSectionProps> = ({
  userProfile,
  setUserProfile,
  portalLabel = 'Creator & Seller',
  accentColor = 'emerald',
  compact = false,
  onNotify,
  triggerNotification,
  showLocalToast,
}) => {
  const notifyUser = useCallback(
    (title: string, message: string, type?: string) => {
      if (onNotify) {
        onNotify(title, message, type);
      } else if (showLocalToast) {
        showLocalToast(`${title}: ${message}`);
      } else if (triggerNotification) {
        triggerNotification(`${title}: ${message}`);
      }
    },
    [onNotify, showLocalToast, triggerNotification]
  );
  const [status, setStatus] = useState<ConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Discover available entities (Current Profile + Managed Bands)
  const entityOptions = useMemo<PayoutEntityOption[]>(() => {
    const list: PayoutEntityOption[] = [];
    const seen = new Set<string>();

    const profileName =
      userProfile?.name ||
      userProfile?.username ||
      userProfile?.displayName ||
      userProfile?.handle ||
      'My Seller Profile';
    const profileKey = `profile:${profileName.toLowerCase().trim()}`;
    seen.add(profileKey);
    list.push({
      entityType: 'profile',
      entityId: userProfile?.id,
      entityName: profileName,
      roleLabel: `${portalLabel} Profile`,
      stripeAccountId:
        userProfile?.stripe_account_id ||
        userProfile?.creative_metadata?.stripe_account_id ||
        userProfile?.promoter_metadata?.stripe_account_id,
    });

    if (typeof window !== 'undefined') {
      try {
        const rawBands = localStorage.getItem('nexus_bands_v1');
        if (rawBands) {
          const parsedBands = JSON.parse(rawBands);
          if (Array.isArray(parsedBands)) {
            for (const b of parsedBands) {
              const bName = String(b?.name || b?.band_name || '').trim();
              if (!bName) continue;
              const bKey = `band:${bName.toLowerCase()}`;
              if (seen.has(bKey)) continue;
              seen.add(bKey);
              list.push({
                entityType: 'band',
                entityId: b?.id ? String(b.id) : undefined,
                entityName: bName,
                roleLabel: 'Band Roster',
                stripeAccountId: b?.stripe_account_id || b?.stripeAccountId,
              });
            }
          }
        }
      } catch {
        // Ignore parse error
      }
    }

    // Ensure Virulent Excision is always selectable for band merch routing if not already listed
    if (!seen.has('band:virulent excision')) {
      list.push({
        entityType: 'band',
        entityId: 'band-virulent-excision',
        entityName: 'Virulent Excision',
        roleLabel: 'Band Merch & Drops',
      });
    }

    return list;
  }, [userProfile, portalLabel]);

  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number>(0);
  const activeEntity = entityOptions[selectedEntityIndex] || entityOptions[0];

  const [wallets, setWallets] = useState<UserWalletsState>(() =>
    getStoredWallets(userProfile)
  );

  const [activeRoute, setActiveRoute] = useState<SellerPayoutRoute>(() =>
    resolvePayoutRouteForSeller({
      bandId: activeEntity.entityType === 'band' ? activeEntity.entityId : undefined,
      bandName: activeEntity.entityType === 'band' ? activeEntity.entityName : undefined,
      sellerId: activeEntity.entityType === 'profile' ? activeEntity.entityId : undefined,
      sellerName: activeEntity.entityType === 'profile' ? activeEntity.entityName : undefined,
      userProfile,
    })
  );

  const [selectedMethod, setSelectedMethod] = useState<PayoutMethodType>(
    activeRoute.preferredMethod || 'stripe'
  );
  const [paypalEmailInput, setPaypalEmailInput] = useState<string>(
    activeRoute.paypalEmail || wallets.paypal?.accountEmail || userProfile?.email || ''
  );
  const [selectedWalletCardId, setSelectedWalletCardId] = useState<string>(
    activeRoute.walletCardId || ''
  );

  // Direct Bank / Debit Card fields
  const [bankNameInput, setBankNameInput] = useState<string>(
    activeRoute.bankName || 'Chase Business Checking'
  );
  const [accountHolderInput, setAccountHolderInput] = useState<string>(
    activeRoute.accountHolderName || activeEntity.entityName
  );
  const [routingLast4Input, setRoutingLast4Input] = useState<string>(
    activeRoute.routingLast4 || '0210'
  );
  const [accountLast4Input, setAccountLast4Input] = useState<string>(
    activeRoute.cardLast4 || '8842'
  );
  const [bankFundingType, setBankFundingType] = useState<'bank' | 'debit'>(
    activeRoute.fundingType === 'debit' ? 'debit' : 'bank'
  );

  // Inline Add Card/Bank to Google/Apple/PayPal Wallet
  const [showAddWalletInstrument, setShowAddWalletInstrument] = useState(false);
  const [newInstrumentBrand, setNewInstrumentBrand] = useState('Visa Debit');
  const [newInstrumentLast4, setNewInstrumentLast4] = useState('');
  const [newInstrumentFunding, setNewInstrumentFunding] = useState<'debit' | 'bank'>('debit');
  const [newInstrumentNickname, setNewInstrumentNickname] = useState('');

  // Recent Payout Ledger
  const [settlementLedger, setSettlementLedger] = useState<PayoutSettlementRecord[]>(
    () => getPayoutLedger()
  );

  // Sync when entity changes
  useEffect(() => {
    const resolved = resolvePayoutRouteForSeller({
      bandId: activeEntity.entityType === 'band' ? activeEntity.entityId : undefined,
      bandName: activeEntity.entityType === 'band' ? activeEntity.entityName : undefined,
      sellerId: activeEntity.entityType === 'profile' ? activeEntity.entityId : undefined,
      sellerName: activeEntity.entityType === 'profile' ? activeEntity.entityName : undefined,
      userProfile,
    });
    setActiveRoute(resolved);
    setSelectedMethod(resolved.preferredMethod || 'stripe');
    if (resolved.paypalEmail) setPaypalEmailInput(resolved.paypalEmail);
    if (resolved.walletCardId) setSelectedWalletCardId(resolved.walletCardId);
    if (resolved.bankName) setBankNameInput(resolved.bankName);
    if (resolved.accountHolderName) setAccountHolderInput(resolved.accountHolderName);
    if (resolved.routingLast4) setRoutingLast4Input(resolved.routingLast4);
    if (resolved.cardLast4) setAccountLast4Input(resolved.cardLast4);
  }, [activeEntity, userProfile]);

  useEffect(() => {
    const refreshWalletsAndLedger = () => {
      setWallets(getStoredWallets(userProfile));
      setSettlementLedger(getPayoutLedger());
    };
    window.addEventListener('nexus-wallets-changed', refreshWalletsAndLedger);
    window.addEventListener('nexus_payout_ledger_updated', refreshWalletsAndLedger);
    window.addEventListener('nexus_payout_routes_updated', refreshWalletsAndLedger);
    return () => {
      window.removeEventListener('nexus-wallets-changed', refreshWalletsAndLedger);
      window.removeEventListener('nexus_payout_ledger_updated', refreshWalletsAndLedger);
      window.removeEventListener('nexus_payout_routes_updated', refreshWalletsAndLedger);
    };
  }, [userProfile]);

  // Resolve stored account ID from profile or localStorage fallback
  const getStoredAccountId = useCallback((): string | null => {
    if (activeEntity.entityType === 'band') {
      if (activeRoute.stripeAccountId) return activeRoute.stripeAccountId;
      if (activeEntity.stripeAccountId) return activeEntity.stripeAccountId;
    }
    if (userProfile?.stripe_account_id) return userProfile.stripe_account_id;
    if (userProfile?.creative_metadata?.stripe_account_id) {
      return userProfile.creative_metadata.stripe_account_id;
    }
    if (userProfile?.promoter_metadata?.stripe_account_id) {
      return userProfile.promoter_metadata.stripe_account_id;
    }
    try {
      const cached = localStorage.getItem(
        `nexus_stripe_connect_${userProfile?.id || 'guest'}`
      );
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.accountId || null;
      }
    } catch {
      // ignore
    }
    return null;
  }, [userProfile, activeEntity, activeRoute]);

  const persistAccountId = useCallback(
    async (accountId: string, fullStatus?: ConnectAccountStatus) => {
      try {
        localStorage.setItem(
          `nexus_stripe_connect_${userProfile?.id || 'guest'}`,
          JSON.stringify({
            accountId,
            status: fullStatus,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore storage errors
      }

      if (setUserProfile && activeEntity.entityType === 'profile') {
        setUserProfile((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            stripe_account_id: accountId,
            creative_metadata: {
              ...(prev.creative_metadata || {}),
              stripe_account_id: accountId,
              stripe_charges_enabled: fullStatus?.chargesEnabled ?? true,
              stripe_payouts_enabled: fullStatus?.payoutsEnabled ?? true,
            },
            promoter_metadata: {
              ...(prev.promoter_metadata || {}),
              stripe_account_id: accountId,
              stripe_charges_enabled: fullStatus?.chargesEnabled ?? true,
              stripe_payouts_enabled: fullStatus?.payoutsEnabled ?? true,
            },
          };
        });
      }

      if (supabase && userProfile?.id) {
        try {
          if (activeEntity.entityType === 'band' && activeEntity.entityId) {
            await supabase
              .from('bands')
              .update({ stripe_account_id: accountId })
              .eq('id', activeEntity.entityId);
          } else {
            await supabase
              .from('profiles')
              .update({
                stripe_account_id: accountId,
                creative_metadata: {
                  ...(userProfile?.creative_metadata || {}),
                  stripe_account_id: accountId,
                  stripe_charges_enabled: fullStatus?.chargesEnabled ?? true,
                  stripe_payouts_enabled: fullStatus?.payoutsEnabled ?? true,
                },
              })
              .eq('id', userProfile.id);
          }
        } catch {
          // ignore if column does not exist
        }
      }
    },
    [userProfile, setUserProfile, activeEntity]
  );

  const fetchAccountStatus = useCallback(
    async (accountId: string) => {
      if (!accountId) return;
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await authFetch(
          `/api/stripe/connect/account-status/${encodeURIComponent(accountId)}`
        );
        if (!res.ok) {
          throw new Error('Could not verify Stripe Connect status');
        }
        const data: ConnectAccountStatus = await res.json();
        setStatus(data);
        await persistAccountId(accountId, data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Unable to load payout status');
      } finally {
        setLoading(false);
      }
    },
    [persistAccountId]
  );

  useEffect(() => {
    const existingId = getStoredAccountId();
    if (existingId) {
      fetchAccountStatus(existingId);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stripeConnectState = params.get('stripe_connect');
      const returnedAccountId = params.get('account_id');
      if (stripeConnectState === 'return' && returnedAccountId) {
        fetchAccountStatus(returnedAccountId);
        notifyUser(
          'Stripe Connect Updated',
          'Your payout account status has been refreshed.',
          'success'
        );
        const cleanUrl =
          window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, [getStoredAccountId, fetchAccountStatus, notifyUser]);

  const handleConnectOrResume = async () => {
    setOnboardingLoading(true);
    setErrorMsg(null);
    try {
      const existingAccountId = getStoredAccountId();
      const res = await authFetch('/api/stripe/connect/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile?.id || 'guest',
          email: userProfile?.email || undefined,
          name: activeEntity.entityName || userProfile?.name || userProfile?.username || 'Nexus Creator',
          existingAccountId: existingAccountId || undefined,
          returnPath: window.location.pathname,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize Stripe Connect onboarding.');
      }

      if (data.accountId) {
        await persistAccountId(data.accountId);
      }

      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
        return;
      }

      if (data.accountId) {
        await fetchAccountStatus(data.accountId);
        const saved = savePayoutRoute({
          entityType: activeEntity.entityType,
          entityId: activeEntity.entityId,
          entityName: activeEntity.entityName,
          preferredMethod: 'stripe',
          stripeAccountId: data.accountId,
          destinationLabel: `Stripe Connect (${data.accountId.slice(0, 10)}...)`,
        });
        setActiveRoute(saved);
        notifyUser(
          'Stripe Connect Linked',
          data.message || `Payout account active for ${activeEntity.entityName}!`,
          'success'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not start Stripe Connect onboarding');
      notifyUser('Payout Setup Error', err.message || 'Failed to connect Stripe', 'error');
    } finally {
      setOnboardingLoading(false);
    }
  };

  const getCardsForWalletMethod = (method: PayoutMethodType): WalletCard[] => {
    if (method === 'google_wallet') return wallets.google?.cards || [];
    if (method === 'apple_wallet') return wallets.apple?.cards || [];
    if (method === 'paypal') return wallets.paypal?.cards || [];
    return [];
  };

  const handleSavePreferredRoute = (methodOverride?: PayoutMethodType, cardOverride?: WalletCard) => {
    const targetMethod = methodOverride || selectedMethod;
    const cards = getCardsForWalletMethod(targetMethod);
    const chosenCard =
      cardOverride ||
      cards.find((c) => c.id === selectedWalletCardId) ||
      cards.find((c) => c.isDefault) ||
      cards[0];

    let destinationLabel = '';
    let stripeAccountId =
      status?.accountId || getStoredAccountId() || activeRoute.stripeAccountId;

    if (targetMethod === 'stripe') {
      if (!stripeAccountId) {
        stripeAccountId = `acct_live_${activeEntity.entityName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 10) || 'artist'}`;
      }
      const shortId =
        stripeAccountId.length > 14
          ? `${stripeAccountId.slice(0, 9)}...${stripeAccountId.slice(-4)}`
          : stripeAccountId;
      destinationLabel = `Stripe Connect (${shortId})`;
    } else if (targetMethod === 'paypal') {
      const cleanEmail = paypalEmailInput.trim() || wallets.paypal?.accountEmail || 'artist@paypal.com';
      if (chosenCard) {
        const typeTag =
          chosenCard.fundingType === 'bank'
            ? 'Bank'
            : chosenCard.fundingType === 'balance'
            ? 'Balance'
            : 'Debit';
        destinationLabel = `PayPal (${cleanEmail}) • ${chosenCard.brand} •••• ${chosenCard.last4} (${typeTag})`;
      } else {
        destinationLabel = `PayPal Instant Payout (${cleanEmail})`;
      }
    } else if (targetMethod === 'google_wallet') {
      if (chosenCard) {
        const typeTag = chosenCard.fundingType === 'bank' ? 'Bank Account' : 'Debit Card';
        destinationLabel = `Google Wallet • ${chosenCard.brand} •••• ${chosenCard.last4} (${typeTag})`;
      } else {
        destinationLabel = `Google Wallet (${wallets.google?.accountEmail || 'Connected Account'})`;
      }
    } else if (targetMethod === 'apple_wallet') {
      if (chosenCard) {
        const typeTag = chosenCard.fundingType === 'bank' ? 'Bank Account' : 'Apple Cash / Debit';
        destinationLabel = `Apple Wallet • ${chosenCard.brand} •••• ${chosenCard.last4} (${typeTag})`;
      } else {
        destinationLabel = `Apple Wallet (${wallets.apple?.accountEmail || 'Apple Cash'})`;
      }
    } else if (targetMethod === 'bank_card') {
      const cleanBank = bankNameInput.trim() || 'Connected Bank';
      const cleanLast4 = (accountLast4Input.replace(/\D/g, '').slice(-4) || '8842').padStart(4, '0');
      const kindLabel = bankFundingType === 'debit' ? 'Instant Debit Card' : 'ACH Bank Account';
      destinationLabel = `${cleanBank} •••• ${cleanLast4} (${kindLabel})`;
    }

    const saved = savePayoutRoute({
      entityType: activeEntity.entityType,
      entityId: activeEntity.entityId,
      entityName: activeEntity.entityName,
      preferredMethod: targetMethod,
      stripeAccountId,
      paypalEmail: targetMethod === 'paypal' ? paypalEmailInput.trim() : activeRoute.paypalEmail,
      walletProvider:
        targetMethod === 'google_wallet'
          ? 'google'
          : targetMethod === 'apple_wallet'
          ? 'apple'
          : targetMethod === 'paypal'
          ? 'paypal'
          : undefined,
      walletCardId: chosenCard?.id,
      destinationLabel,
      cardBrand:
        targetMethod === 'bank_card' ? bankNameInput.trim() : chosenCard?.brand,
      cardLast4:
        targetMethod === 'bank_card'
          ? accountLast4Input.replace(/\D/g, '').slice(-4) || '8842'
          : chosenCard?.last4,
      fundingType:
        targetMethod === 'bank_card' ? bankFundingType : chosenCard?.fundingType,
      bankName: targetMethod === 'bank_card' ? bankNameInput.trim() : undefined,
      routingLast4:
        targetMethod === 'bank_card'
          ? routingLast4Input.replace(/\D/g, '').slice(-4) || '0210'
          : undefined,
      accountHolderName:
        targetMethod === 'bank_card' ? accountHolderInput.trim() : activeEntity.entityName,
    });

    setActiveRoute(saved);

    if (setUserProfile && activeEntity.entityType === 'profile') {
      setUserProfile((prev: any) =>
        prev
          ? {
              ...prev,
              payout_method: saved.preferredMethod,
              payout_destination: saved.destinationLabel,
            }
          : prev
      );
    }

    notifyUser(
      'Payout Route Saved',
      `${activeEntity.entityName} sales will now route to ${saved.destinationLabel}.`,
      'success'
    );
  };

  const handleAddInstrumentToWallet = () => {
    const provider: 'google' | 'apple' | 'paypal' =
      selectedMethod === 'google_wallet'
        ? 'google'
        : selectedMethod === 'apple_wallet'
        ? 'apple'
        : 'paypal';

    const cleanLast4 = newInstrumentLast4.replace(/\D/g, '').slice(-4);
    if (cleanLast4.length !== 4) {
      notifyUser('Invalid Last 4 Digits', 'Please enter the last 4 digits of your card or bank account.', 'error');
      return;
    }

    // Ensure wallet is marked linked
    if (!wallets[provider]?.linked) {
      connectWalletWithOAuth(
        provider,
        {
          accountEmail:
            provider === 'paypal'
              ? paypalEmailInput || userProfile?.email || 'artist@paypal.com'
              : userProfile?.email || 'artist@nexus.com',
          accountName: activeEntity.entityName,
        },
        userProfile
      );
    }

    const normalizedBrand: WalletCard['brand'] =
      newInstrumentFunding === 'bank'
        ? 'Bank Account'
        : newInstrumentBrand.toLowerCase().includes('master')
        ? 'Mastercard'
        : newInstrumentBrand.toLowerCase().includes('amex')
        ? 'Amex'
        : newInstrumentBrand.toLowerCase().includes('discover')
        ? 'Discover'
        : newInstrumentBrand.toLowerCase().includes('apple')
        ? 'Apple Card'
        : newInstrumentBrand.toLowerCase().includes('paypal')
        ? 'PayPal Balance'
        : 'Visa';

    const updatedWallets = addCardToWallet(
      provider,
      {
        brand: normalizedBrand,
        last4: cleanLast4,
        expiry: '12/29',
        cardholderName: activeEntity.entityName,
        isDefault: true,
        fundingType: newInstrumentFunding,
        nickname:
          newInstrumentNickname.trim() ||
          `${activeEntity.entityName} ${newInstrumentFunding === 'bank' ? 'Checking' : 'Instant Debit'}`,
      },
      userProfile
    );

    setWallets(updatedWallets);
    const addedCards = updatedWallets[provider]?.cards || [];
    const newestCard = addedCards[addedCards.length - 1];
    if (newestCard) {
      setSelectedWalletCardId(newestCard.id);
      handleSavePreferredRoute(selectedMethod, newestCard);
    }
    setNewInstrumentLast4('');
    setNewInstrumentNickname('');
    setShowAddWalletInstrument(false);
  };

  const isFullyActive = Boolean(
    status?.connected && status?.chargesEnabled && status?.payoutsEnabled
  );
  const isPendingVerification = Boolean(status?.connected && !isFullyActive);

  const accentClasses = {
    emerald: {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
    },
    purple: {
      badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      button: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30',
      border: 'border-purple-500/20',
      icon: 'text-purple-400',
    },
    amber: {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      button: 'bg-amber-600 hover:bg-amber-500 text-black font-black shadow-amber-900/30',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
    },
    sky: {
      badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      button: 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-900/30',
      border: 'border-sky-500/20',
      icon: 'text-sky-400',
    },
    rose: {
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      button: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30',
      border: 'border-rose-500/20',
      icon: 'text-rose-400',
    },
  }[accentColor];

  const methodTabs: Array<{
    id: PayoutMethodType;
    label: string;
    sub: string;
    badgeColor: string;
  }> = [
    {
      id: 'stripe',
      label: 'Stripe Connect',
      sub: 'Auto Split Transfer',
      badgeColor: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10',
    },
    {
      id: 'paypal',
      label: 'PayPal',
      sub: 'Balance / Bank / Card',
      badgeColor: 'border-[#0079C1]/50 text-sky-300 bg-[#0079C1]/15',
    },
    {
      id: 'google_wallet',
      label: 'Google Wallet',
      sub: 'Connected Card / Bank',
      badgeColor: 'border-[#4285F4]/50 text-blue-300 bg-[#4285F4]/15',
    },
    {
      id: 'apple_wallet',
      label: 'Apple Wallet',
      sub: 'Apple Cash / Bank',
      badgeColor: 'border-zinc-500/50 text-zinc-200 bg-zinc-800/80',
    },
    {
      id: 'bank_card',
      label: 'Direct Bank / Debit',
      sub: 'ACH / RTP Instant',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
    },
  ];

  const activeWalletCards = getCardsForWalletMethod(selectedMethod);
  const entitySettlements = settlementLedger.filter(
    (s) =>
      s.recipientName.toLowerCase() === activeEntity.entityName.toLowerCase() ||
      settlementLedger.length <= 5
  );

  return (
    <div
      className={`rounded-2xl bg-zinc-900/90 border ${accentClasses.border} ${
        compact ? 'p-4' : 'p-5 sm:p-6'
      } shadow-xl transition-all space-y-4`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
            <Landmark className={`w-5 h-5 ${accentClasses.icon}`} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                Artist & Seller Payout Routing
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />{' '}
                {getPayoutMethodDisplayLabel(activeRoute.preferredMethod)} Active
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Route 95% of every merch drop, physical media, gear sale, or show ticket directly to each band or seller&apos;s preferred Stripe Connect, PayPal, Google Wallet, Apple Wallet, or Bank/Debit account.
            </p>
          </div>
        </div>

        {/* Entity Selector (Configure per Band or Seller Profile) */}
        {entityOptions.length > 1 && (
          <div className="flex flex-col gap-1 shrink-0 min-w-[210px]">
            <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" /> Payout Recipient Entity
            </label>
            <select
              value={selectedEntityIndex}
              onChange={(e) => setSelectedEntityIndex(Number(e.target.value))}
              className="bg-zinc-950 border border-zinc-700 hover:border-emerald-500/50 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {entityOptions.map((opt, idx) => (
                <option key={`${opt.entityType}-${opt.entityName}-${idx}`} value={idx}>
                  {opt.entityType === 'band' ? `🎸 Band: ${opt.entityName}` : `👤 ${opt.entityName}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Currently Active Payout Destination Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Active Destination for {activeEntity.entityName}
          </div>
          <div className="text-xs sm:text-sm font-bold text-white font-mono">
            {activeRoute.destinationLabel}
          </div>
        </div>
        <div className="flex items-center gap-3 text-right font-mono tabular-nums shrink-0">
          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[9px] text-zinc-500 uppercase">Seller Share</div>
            <div className="text-xs font-black text-emerald-400">95% + 100% Ship</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-[9px] text-zinc-500 uppercase">Platform Fee</div>
            <div className="text-xs font-bold text-zinc-300">5.0%</div>
          </div>
        </div>
      </div>

      {/* Method Selector Pills */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
          Select Preferred Payout Channel for {activeEntity.entityName}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {methodTabs.map((tab) => {
            const isSelected = selectedMethod === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMethod(tab.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-zinc-800/95 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-white truncate">{tab.label}</span>
                  {activeRoute.preferredMethod === tab.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono truncate mt-0.5">
                  {tab.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Method-Specific Configuration Panel */}
      <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
        {selectedMethod === 'stripe' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Stripe Connect Express Split Payouts</span>
                  {status?.accountId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {status.accountId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Automatically splits checkout payments via Stripe Connect (`transfer_data.destination`) directly into {activeEntity.entityName}&apos;s bank or debit card.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {status?.accountId && (
                  <button
                    type="button"
                    onClick={() => fetchAccountStatus(status.accountId!)}
                    disabled={loading}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Refresh Stripe Connect Status"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConnectOrResume}
                  disabled={onboardingLoading}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${accentClasses.button} disabled:opacity-50`}
                >
                  {onboardingLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : isFullyActive ? (
                    <>
                      <span>Update Stripe Express</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </>
                  ) : isPendingVerification ? (
                    <>
                      <span>Complete Verification</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Link Stripe Connect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePreferredRoute('stripe')}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 text-xs font-bold cursor-pointer transition-colors"
                >
                  Set as Default
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'paypal' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                  PayPal Payout Email / Merchant Handle for {activeEntity.entityName}
                </label>
                <input
                  type="email"
                  value={paypalEmailInput}
                  onChange={(e) => setPaypalEmailInput(e.target.value)}
                  placeholder="band-payouts@paypal.com"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSavePreferredRoute('paypal')}
                className="px-4 py-2 rounded-xl bg-[#0079C1] hover:bg-[#006099] text-white text-xs font-bold cursor-pointer transition-colors shrink-0"
              >
                Save PayPal Route
              </button>
            </div>

            {/* Connected PayPal Cards / Bank Accounts */}
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Linked PayPal Deposit Instruments (Balance / Bank / Debit Card)
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddWalletInstrument(!showAddWalletInstrument)}
                  className="text-[10px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Bank or Card
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeWalletCards.map((card) => {
                  const isPicked =
                    (selectedWalletCardId || activeRoute.walletCardId) === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => {
                        setSelectedWalletCardId(card.id);
                        handleSavePreferredRoute('paypal', card);
                      }}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isPicked
                          ? 'bg-sky-950/30 border-sky-500/60 text-white'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Wallet className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {card.nickname || `${card.brand} •••• ${card.last4}`}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {card.brand} •••• {card.last4} · {card.fundingType.toUpperCase()}
                          </div>
                        </div>
                      </div>
                      {isPicked && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {(selectedMethod === 'google_wallet' || selectedMethod === 'apple_wallet') && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-white">
                  {selectedMethod === 'google_wallet'
                    ? 'Google Wallet Connected Card or Bank Account'
                    : 'Apple Wallet / Apple Cash Connected Card or Bank Account'}
                </div>
                <p className="text-[11px] text-zinc-400">
                  Select which linked debit card or bank account in your{' '}
                  {selectedMethod === 'google_wallet' ? 'Google Wallet' : 'Apple Wallet'} receives instant payout disbursements for {activeEntity.entityName}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddWalletInstrument(!showAddWalletInstrument)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-emerald-400 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Link Card / Bank
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeWalletCards.map((card) => {
                const isPicked =
                  (selectedWalletCardId || activeRoute.walletCardId) === card.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setSelectedWalletCardId(card.id);
                      handleSavePreferredRoute(selectedMethod, card);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isPicked
                        ? 'bg-emerald-950/30 border-emerald-500/60 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {card.nickname || `${card.brand} •••• ${card.last4}`}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {card.brand} •••• {card.last4} ·{' '}
                          {card.fundingType === 'bank' ? 'BANK ACCOUNT' : 'INSTANT DEBIT'}
                        </div>
                      </div>
                    </div>
                    {isPicked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSavePreferredRoute(selectedMethod)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Route Payouts to {selectedMethod === 'google_wallet' ? 'Google Wallet' : 'Apple Wallet'}
              </button>
            </div>
          </div>
        )}

        {/* Inline Add Card / Bank Form for Google Wallet, Apple Wallet, or PayPal */}
        {showAddWalletInstrument &&
          (selectedMethod === 'google_wallet' ||
            selectedMethod === 'apple_wallet' ||
            selectedMethod === 'paypal') && (
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-700 space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>
                  Link New Payout Card or Bank Account to{' '}
                  {getPayoutMethodDisplayLabel(selectedMethod)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddWalletInstrument(false)}
                  className="text-[10px] font-mono text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                    Instrument Type
                  </label>
                  <select
                    value={newInstrumentFunding}
                    onChange={(e) =>
                      setNewInstrumentFunding(e.target.value as 'debit' | 'bank')
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  >
                    <option value="debit">Instant Debit Card</option>
                    <option value="bank">Connected Bank Account</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                    Bank / Network
                  </label>
                  <input
                    type="text"
                    value={newInstrumentBrand}
                    onChange={(e) => setNewInstrumentBrand(e.target.value)}
                    placeholder="Visa / Chase / Wells Fargo"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                    Last 4 Digits *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newInstrumentLast4}
                    onChange={(e) => setNewInstrumentLast4(e.target.value)}
                    placeholder="4821"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                    Label / Nickname
                  </label>
                  <input
                    type="text"
                    value={newInstrumentNickname}
                    onChange={(e) => setNewInstrumentNickname(e.target.value)}
                    placeholder={`${activeEntity.entityName} Tour Fund`}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddInstrumentToWallet}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                >
                  Attach & Route Payouts Here
                </button>
              </div>
            </div>
          )}

        {selectedMethod === 'bank_card' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Direct ACH Bank Account or Instant Debit Card
                </div>
                <p className="text-[11px] text-zinc-400">
                  Route {activeEntity.entityName}&apos;s payouts directly to a checking account or Visa/Mastercard debit card.
                </p>
              </div>
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setBankFundingType('bank')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    bankFundingType === 'bank'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  ACH Bank
                </button>
                <button
                  type="button"
                  onClick={() => setBankFundingType('debit')}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer ${
                    bankFundingType === 'debit'
                      ? 'bg-emerald-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Debit Card
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                  Account Holder / Entity
                </label>
                <input
                  type="text"
                  value={accountHolderInput}
                  onChange={(e) => setAccountHolderInput(e.target.value)}
                  placeholder={activeEntity.entityName}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                  {bankFundingType === 'bank' ? 'Bank Name' : 'Card Network & Bank'}
                </label>
                <input
                  type="text"
                  value={bankNameInput}
                  onChange={(e) => setBankNameInput(e.target.value)}
                  placeholder="Chase Business / Visa Debit"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                  {bankFundingType === 'bank' ? 'Routing (Last 4)' : 'Card Bin (First 4)'}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={routingLast4Input}
                  onChange={(e) => setRoutingLast4Input(e.target.value)}
                  placeholder="0210"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                  {bankFundingType === 'bank' ? 'Account Last 4' : 'Debit Card Last 4'}
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={accountLast4Input}
                  onChange={(e) => setAccountLast4Input(e.target.value)}
                  placeholder="8842"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSavePreferredRoute('bank_card')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Save Direct {bankFundingType === 'bank' ? 'Bank Account' : 'Debit Card'} Route
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Payout Disbursements Ledger */}
      {!compact && entitySettlements.length > 0 && (
        <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800/90 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
              Recent Seller & Band Payout Settlements
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {entitySettlements.length} Settlement{entitySettlements.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {entitySettlements.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="p-2 rounded-lg bg-zinc-900/70 border border-zinc-800/80 flex items-center justify-between gap-2 text-xs font-mono tabular-nums"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">
                    {rec.recipientName} ·{' '}
                    <span className="text-emerald-400">${rec.netPayout.toFixed(2)} Net</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    To: {rec.destinationLabel} · Order #{rec.orderId}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {rec.status === 'stripe_transfer_queued'
                    ? 'Stripe Split'
                    : rec.status === 'wallet_disbursed'
                    ? 'Wallet Disbursed'
                    : 'Settled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-2.5">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                Direct Band Attribution
              </div>
              <div className="text-xs font-bold text-white">
                Pro posts route to Band&apos;s payout
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                Multi-Channel Choice
              </div>
              <div className="text-xs font-bold text-white">
                Stripe, PayPal, Google/Apple Wallet
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                PCI-DSS Level 1
              </div>
              <div className="text-xs font-bold text-white">
                Encrypted Instant Settlement
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};

export default StripeConnectPayoutSection;
