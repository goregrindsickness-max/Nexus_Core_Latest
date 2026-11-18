import { getStoredWallets, UserWalletsState, WalletCard } from './digitalWalletService';
import { supabase } from '../lib/supabaseClient';

export type PayoutMethodType =
  | 'stripe'
  | 'paypal'
  | 'google_wallet'
  | 'apple_wallet'
  | 'bank_card';

export interface SellerPayoutRoute {
  entityKey: string; // e.g., "band:virulent excision" or "profile:bdmceo"
  entityId?: string;
  entityName: string;
  entityType: 'band' | 'profile';
  preferredMethod: PayoutMethodType;
  stripeAccountId?: string;
  paypalEmail?: string;
  walletProvider?: 'google' | 'apple' | 'paypal';
  walletCardId?: string;
  destinationLabel: string;
  cardBrand?: string;
  cardLast4?: string;
  fundingType?: 'credit' | 'debit' | 'balance' | 'bank';
  bankName?: string;
  routingLast4?: string;
  accountHolderName?: string;
  updatedAt: string;
}

export interface PayoutSettlementRecord {
  id: string;
  orderId: string;
  transactionId: string;
  recipientName: string;
  recipientId?: string;
  recipientType: 'band' | 'seller';
  payoutMethod: PayoutMethodType;
  destinationLabel: string;
  stripeAccountId?: string;
  grossAmount: number;
  platformFee: number;
  shippingCredit: number;
  netPayout: number;
  buyerPaymentMethod: string;
  status: 'settled_instant' | 'stripe_transfer_queued' | 'wallet_disbursed';
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    selectedSize?: string;
  }>;
  createdAt: string;
}

export const PAYOUT_ROUTES_STORAGE_KEY = 'nexus_payout_routes_v1';
export const PAYOUT_LEDGER_STORAGE_KEY = 'nexus_payout_ledger_v1';

export function normalizeEntityToken(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function buildEntityKey(
  entityType: 'band' | 'profile',
  nameOrId?: string | null
): string {
  const token = normalizeEntityToken(nameOrId) || 'default';
  return `${entityType}:${token}`;
}

export function getPayoutMethodDisplayLabel(method: PayoutMethodType): string {
  switch (method) {
    case 'stripe':
      return 'Stripe Connect';
    case 'paypal':
      return 'PayPal Payouts';
    case 'google_wallet':
      return 'Google Wallet';
    case 'apple_wallet':
      return 'Apple Wallet';
    case 'bank_card':
      return 'Direct Bank / Debit Card';
    default:
      return 'Stripe Connect';
  }
}

export function getPayoutRoutesMap(): Record<string, SellerPayoutRoute> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PAYOUT_ROUTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, SellerPayoutRoute>;
    }
  } catch {
    // Ignore parse errors
  }
  return {};
}

export function savePayoutRoute(
  routeInput: Omit<SellerPayoutRoute, 'entityKey' | 'updatedAt'> & {
    entityKey?: string;
    updatedAt?: string;
  },
  options?: { syncBackend?: boolean }
): SellerPayoutRoute {
  const normalizedName = normalizeEntityToken(routeInput.entityName);
  const normalizedId = normalizeEntityToken(routeInput.entityId);
  const primaryKey =
    routeInput.entityKey ||
    buildEntityKey(routeInput.entityType, normalizedName || normalizedId);

  const savedRoute: SellerPayoutRoute = {
    ...routeInput,
    entityKey: primaryKey,
    updatedAt: routeInput.updatedAt || new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const current = getPayoutRoutesMap();
      current[primaryKey] = savedRoute;
      if (normalizedName) {
        current[buildEntityKey(routeInput.entityType, normalizedName)] = savedRoute;
      }
      if (normalizedId) {
        current[buildEntityKey(routeInput.entityType, normalizedId)] = savedRoute;
      }
      localStorage.setItem(PAYOUT_ROUTES_STORAGE_KEY, JSON.stringify(current));

      // Also keep nexus_bands_v1 in sync if this is a band route
      if (routeInput.entityType === 'band') {
        try {
          const rawBands = localStorage.getItem('nexus_bands_v1');
          if (rawBands) {
            const parsedBands = JSON.parse(rawBands);
            if (Array.isArray(parsedBands)) {
              let updated = false;
              const nextBands = parsedBands.map((b: any) => {
                const bId = normalizeEntityToken(b?.id);
                const bName = normalizeEntityToken(b?.name || b?.band_name);
                if (
                  (normalizedId && bId === normalizedId) ||
                  (normalizedName && bName === normalizedName)
                ) {
                  updated = true;
                  return {
                    ...b,
                    payout_method: savedRoute.preferredMethod,
                    payout_destination: savedRoute.destinationLabel,
                    stripe_account_id:
                      savedRoute.stripeAccountId || b.stripe_account_id,
                    paypal_email: savedRoute.paypalEmail || b.paypal_email,
                    payout_route: savedRoute,
                  };
                }
                return b;
              });
              if (updated) {
                localStorage.setItem('nexus_bands_v1', JSON.stringify(nextBands));
              }
            }
          }
        } catch {
          // Ignore local band sync error
        }
      }

      window.dispatchEvent(
        new CustomEvent('nexus_payout_routes_updated', { detail: savedRoute })
      );
    } catch {
      // Ignore storage quota issues
    }
  }

  if (options?.syncBackend !== false && supabase) {
    if (routeInput.entityType === 'band' && routeInput.entityId) {
      Promise.resolve(
        supabase
          .from('bands')
          .update({
            stripe_account_id: savedRoute.stripeAccountId || null,
          })
          .eq('id', routeInput.entityId)
      ).catch(() => {});
    } else if (routeInput.entityType === 'profile' && routeInput.entityId) {
      Promise.resolve(
        supabase
          .from('profiles')
          .update({
            stripe_account_id: savedRoute.stripeAccountId || null,
          })
          .eq('id', routeInput.entityId)
      ).catch(() => {});
    }
  }

  return savedRoute;
}

function buildFallbackRouteFromWallets(
  entityType: 'band' | 'profile',
  entityName: string,
  entityId: string | undefined,
  wallets: UserWalletsState,
  preferredHint?: PayoutMethodType,
  stripeAccountId?: string
): SellerPayoutRoute {
  const now = new Date().toISOString();
  const entityKey = buildEntityKey(entityType, entityName || entityId);

  const pickCardLabel = (
    providerLabel: string,
    cards: WalletCard[],
    selectedCardId?: string,
    fallbackEmail?: string
  ): {
    card?: WalletCard;
    label: string;
  } => {
    const defaultCard =
      cards.find((c) => c.id === selectedCardId) ||
      cards.find((c) => c.isDefault) ||
      cards.find((c) => c.fundingType === 'bank' || c.fundingType === 'debit') ||
      cards[0];
    if (defaultCard) {
      const fundingTag =
        defaultCard.fundingType === 'bank'
          ? 'Bank Account'
          : defaultCard.fundingType === 'balance'
          ? 'Wallet Balance'
          : defaultCard.fundingType === 'debit'
          ? 'Debit Card'
          : 'Connected Card';
      return {
        card: defaultCard,
        label: `${providerLabel} • ${defaultCard.brand} •••• ${defaultCard.last4} (${fundingTag})`,
      };
    }
    return {
      label: fallbackEmail
        ? `${providerLabel} (${fallbackEmail})`
        : `${providerLabel} Connected Account`,
    };
  };

  if (preferredHint === 'paypal' || (!preferredHint && !stripeAccountId && wallets.paypal?.linked)) {
    const { card, label } = pickCardLabel(
      'PayPal',
      wallets.paypal?.cards || [],
      wallets.paypal?.selectedCardId,
      wallets.paypal?.accountEmail
    );
    return {
      entityKey,
      entityId,
      entityName,
      entityType,
      preferredMethod: 'paypal',
      stripeAccountId,
      paypalEmail: wallets.paypal?.accountEmail,
      walletProvider: 'paypal',
      walletCardId: card?.id,
      destinationLabel: label,
      cardBrand: card?.brand,
      cardLast4: card?.last4,
      fundingType: card?.fundingType,
      updatedAt: now,
    };
  }

  if (preferredHint === 'google_wallet' || (!preferredHint && !stripeAccountId && wallets.google?.linked)) {
    const { card, label } = pickCardLabel(
      'Google Wallet',
      wallets.google?.cards || [],
      wallets.google?.selectedCardId,
      wallets.google?.accountEmail
    );
    return {
      entityKey,
      entityId,
      entityName,
      entityType,
      preferredMethod: 'google_wallet',
      stripeAccountId,
      walletProvider: 'google',
      walletCardId: card?.id,
      destinationLabel: label,
      cardBrand: card?.brand,
      cardLast4: card?.last4,
      fundingType: card?.fundingType,
      updatedAt: now,
    };
  }

  if (preferredHint === 'apple_wallet' || (!preferredHint && !stripeAccountId && wallets.apple?.linked)) {
    const { card, label } = pickCardLabel(
      'Apple Wallet',
      wallets.apple?.cards || [],
      wallets.apple?.selectedCardId,
      wallets.apple?.accountEmail
    );
    return {
      entityKey,
      entityId,
      entityName,
      entityType,
      preferredMethod: 'apple_wallet',
      stripeAccountId,
      walletProvider: 'apple',
      walletCardId: card?.id,
      destinationLabel: label,
      cardBrand: card?.brand,
      cardLast4: card?.last4,
      fundingType: card?.fundingType,
      updatedAt: now,
    };
  }

  if (stripeAccountId) {
    const shortAcct =
      stripeAccountId.length > 14
        ? `${stripeAccountId.slice(0, 9)}...${stripeAccountId.slice(-4)}`
        : stripeAccountId;
    return {
      entityKey,
      entityId,
      entityName,
      entityType,
      preferredMethod: 'stripe',
      stripeAccountId,
      destinationLabel: `Stripe Connect (${shortAcct})`,
      updatedAt: now,
    };
  }

  return {
    entityKey,
    entityId,
    entityName,
    entityType,
    preferredMethod: 'stripe',
    destinationLabel: `${entityName} Direct Artist Account (95% Payout Split)`,
    updatedAt: now,
  };
}

export interface ResolvePayoutContext {
  bandId?: string;
  bandName?: string;
  sellerId?: string;
  sellerName?: string;
  bands?: any[];
  allProfiles?: any[];
  userProfile?: any;
}

export function resolvePayoutRouteForSeller(
  ctx: ResolvePayoutContext
): SellerPayoutRoute {
  const routesMap = getPayoutRoutesMap();

  const cleanBandName = String(ctx.bandName || '').trim();
  const cleanSellerName = String(ctx.sellerName || '').trim();
  const normBandName = normalizeEntityToken(cleanBandName);
  const normBandId = normalizeEntityToken(ctx.bandId);
  const normSellerName = normalizeEntityToken(cleanSellerName);
  const normSellerId = normalizeEntityToken(ctx.sellerId);

  const genericNames = new Set([
    '',
    'independent artist',
    'official merch',
    'community seller',
    'artist',
    'band',
    'unknown',
  ]);

  const hasSpecificBand =
    Boolean(normBandId) || (Boolean(normBandName) && !genericNames.has(normBandName));

  // 1. Check explicit stored routes for the band first
  if (hasSpecificBand) {
    const byBandName = normBandName
      ? routesMap[buildEntityKey('band', normBandName)]
      : undefined;
    const byBandId = normBandId
      ? routesMap[buildEntityKey('band', normBandId)]
      : undefined;
    if (byBandName) return byBandName;
    if (byBandId) return byBandId;
  }

  // 2. Check explicit stored routes for the seller profile
  const bySellerName = normSellerName
    ? routesMap[buildEntityKey('profile', normSellerName)]
    : undefined;
  const bySellerId = normSellerId
    ? routesMap[buildEntityKey('profile', normSellerId)]
    : undefined;
  if (!hasSpecificBand && (bySellerName || bySellerId)) {
    return (bySellerName || bySellerId)!;
  }

  // 3. Look up band record from provided bands list or localStorage
  let matchedBand: any = null;
  const candidateBands: any[] = Array.isArray(ctx.bands) ? [...ctx.bands] : [];
  if (typeof window !== 'undefined' && candidateBands.length === 0) {
    try {
      const rawBands = localStorage.getItem('nexus_bands_v1');
      if (rawBands) {
        const parsed = JSON.parse(rawBands);
        if (Array.isArray(parsed)) candidateBands.push(...parsed);
      }
    } catch {
      // Ignore
    }
  }

  if (hasSpecificBand && candidateBands.length > 0) {
    matchedBand = candidateBands.find((b: any) => {
      const bId = normalizeEntityToken(b?.id);
      const bName = normalizeEntityToken(b?.name || b?.band_name);
      return (
        (normBandId && bId === normBandId) ||
        (normBandName && bName === normBandName)
      );
    });
  }

  if (matchedBand?.payout_route && typeof matchedBand.payout_route === 'object') {
    return matchedBand.payout_route as SellerPayoutRoute;
  }

  // 4. Look up seller profile from allProfiles or active userProfile
  let matchedProfile: any = null;
  const candidateProfiles: any[] = Array.isArray(ctx.allProfiles)
    ? [...ctx.allProfiles]
    : [];
  if (ctx.userProfile) {
    candidateProfiles.push(ctx.userProfile);
  }
  if (candidateProfiles.length > 0) {
    matchedProfile = candidateProfiles.find((p: any) => {
      const pId = normalizeEntityToken(p?.id);
      const pName = normalizeEntityToken(
        p?.name || p?.username || p?.handle || p?.displayName
      );
      return (
        (normSellerId && pId === normSellerId) ||
        (normSellerName && pName === normSellerName) ||
        (normBandName && pName === normBandName)
      );
    });
  }

  // Also check if seller profile has a configured route when band wasn't explicitly configured
  if (bySellerName || bySellerId) {
    const sellerRoute = (bySellerName || bySellerId)!;
    if (hasSpecificBand) {
      return {
        ...sellerRoute,
        entityType: 'band',
        entityName: cleanBandName || sellerRoute.entityName,
        entityId: ctx.bandId || sellerRoute.entityId,
      };
    }
    return sellerRoute;
  }

  const resolvedStripeAccountId =
    matchedBand?.stripe_account_id ||
    matchedBand?.stripeAccountId ||
    matchedProfile?.stripe_account_id ||
    matchedProfile?.stripeAccountId ||
    matchedProfile?.creative_metadata?.stripe_account_id ||
    matchedProfile?.promoter_metadata?.stripe_account_id ||
    undefined;

  const preferredMethodHint: PayoutMethodType | undefined =
    matchedBand?.payout_method ||
    matchedProfile?.payout_method ||
    matchedProfile?.creative_metadata?.payout_method ||
    matchedProfile?.promoter_metadata?.payout_method ||
    undefined;

  const wallets = getStoredWallets(matchedProfile || ctx.userProfile);
  const recipientType: 'band' | 'profile' = hasSpecificBand ? 'band' : 'profile';
  const recipientName =
    (hasSpecificBand ? cleanBandName : cleanSellerName) ||
    matchedBand?.name ||
    matchedProfile?.name ||
    matchedProfile?.username ||
    'Independent Artist';
  const recipientId = hasSpecificBand
    ? ctx.bandId || matchedBand?.id
    : ctx.sellerId || matchedProfile?.id;

  return buildFallbackRouteFromWallets(
    recipientType,
    recipientName,
    recipientId,
    wallets,
    preferredMethodHint,
    resolvedStripeAccountId
  );
}

/**
 * Extracts band name from item fields or a title prefix like "Virulent Excision - Xenomorph TS"
 */
export function inferRecipientFromItem(item: any): {
  bandId?: string;
  bandName?: string;
  sellerId?: string;
  sellerName?: string;
} {
  if (!item) return {};
  const explicitBandId = item.bandId || item.band_id || undefined;
  let explicitBandName = String(
    item.band || item.bandName || item.band_name || item.artist || ''
  ).trim();
  const sellerId =
    item.sellerId || item.seller_id || item.authorId || item.user_id || undefined;
  const sellerName = String(
    item.sellerName || item.authorName || item.seller || ''
  ).trim();

  const genericNames = new Set([
    '',
    'independent artist',
    'official merch',
    'community seller',
  ]);

  // If explicitBandName matches sellerName or is generic, inspect title pattern "Band Name - Merch Title"
  const rawName = String(item.name || item.title || '').trim();
  if (
    (!explicitBandName ||
      genericNames.has(explicitBandName.toLowerCase()) ||
      (sellerName &&
        explicitBandName.toLowerCase() === sellerName.toLowerCase())) &&
    rawName.includes(' - ')
  ) {
    const prefix = rawName.split(' - ')[0].trim();
    if (prefix.length >= 2 && prefix.length <= 45) {
      explicitBandName = prefix;
    }
  }

  return {
    bandId: explicitBandId,
    bandName: explicitBandName || undefined,
    sellerId,
    sellerName: sellerName || undefined,
  };
}

export function resolvePayoutRouteForItem(
  item: any,
  options?: Omit<ResolvePayoutContext, 'bandId' | 'bandName' | 'sellerId' | 'sellerName'>
): SellerPayoutRoute {
  const inferred = inferRecipientFromItem(item);
  return resolvePayoutRouteForSeller({
    ...inferred,
    ...options,
  });
}

export function getPayoutLedger(filterEntityNameOrId?: string): PayoutSettlementRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PAYOUT_LEDGER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (!filterEntityNameOrId) return parsed;
    const normFilter = normalizeEntityToken(filterEntityNameOrId);
    if (!normFilter) return parsed;
    return parsed.filter(
      (rec: PayoutSettlementRecord) =>
        normalizeEntityToken(rec.recipientName) === normFilter ||
        normalizeEntityToken(rec.recipientId) === normFilter
    );
  } catch {
    return [];
  }
}

export function recordOrderPayoutSettlements(params: {
  items: any[];
  orderId: string;
  transactionId: string;
  buyerPaymentMethod: string;
  shippingTotal?: number;
  fulfillmentMap?: Record<string, 'ship' | 'pickup'>;
  shippingCostPerBand?: number;
  bands?: any[];
  allProfiles?: any[];
  userProfile?: any;
}): PayoutSettlementRecord[] {
  const {
    items,
    orderId,
    transactionId,
    buyerPaymentMethod,
    shippingTotal = 0,
    fulfillmentMap,
    shippingCostPerBand = 6.99,
    bands,
    allProfiles,
    userProfile,
  } = params;

  if (!Array.isArray(items) || items.length === 0) return [];

  // Group items by resolved recipient entityKey
  const groups = new Map<
    string,
    {
      route: SellerPayoutRoute;
      groupBandKey: string;
      items: Array<{
        id?: string;
        name: string;
        quantity: number;
        price: number;
        selectedSize?: string;
      }>;
      grossSubtotal: number;
    }
  >();

  for (const rawItem of items) {
    const route = resolvePayoutRouteForItem(rawItem, {
      bands,
      allProfiles,
      userProfile,
    });
    const key = route.entityKey;
    const price = Number(rawItem?.price) || 0;
    const quantity = Math.max(1, Number(rawItem?.quantity) || 1);
    const lineGross = Math.round(price * quantity * 100) / 100;
    const itemBandName = String(
      rawItem?.band || rawItem?.bandName || route.entityName || 'Independent Artist'
    );

    const existing = groups.get(key);
    if (existing) {
      existing.items.push({
        id: rawItem?.id != null ? String(rawItem.id) : undefined,
        name: String(rawItem?.name || rawItem?.title || 'Merch Item'),
        quantity,
        price,
        selectedSize: rawItem?.selectedSize,
      });
      existing.grossSubtotal =
        Math.round((existing.grossSubtotal + lineGross) * 100) / 100;
    } else {
      groups.set(key, {
        route,
        groupBandKey: itemBandName,
        items: [
          {
            id: rawItem?.id != null ? String(rawItem.id) : undefined,
            name: String(rawItem?.name || rawItem?.title || 'Merch Item'),
            quantity,
            price,
            selectedSize: rawItem?.selectedSize,
          },
        ],
        grossSubtotal: lineGross,
      });
    }
  }

  const now = new Date().toISOString();
  const groupCount = groups.size;
  const records: PayoutSettlementRecord[] = [];

  groups.forEach((group, idxKey) => {
    const { route, groupBandKey, items: groupItems, grossSubtotal } = group;
    const platformFee = Math.round(grossSubtotal * 0.05 * 100) / 100;

    let shippingCredit = 0;
    if (fulfillmentMap && groupBandKey in fulfillmentMap) {
      shippingCredit =
        fulfillmentMap[groupBandKey] === 'ship' ? shippingCostPerBand : 0;
    } else if (shippingTotal > 0 && groupCount > 0) {
      shippingCredit = Math.round((shippingTotal / groupCount) * 100) / 100;
    }

    const netPayout =
      Math.round((grossSubtotal - platformFee + shippingCredit) * 100) / 100;

    const status: PayoutSettlementRecord['status'] =
      route.preferredMethod === 'stripe' && route.stripeAccountId
        ? 'stripe_transfer_queued'
        : route.preferredMethod === 'paypal' ||
          route.preferredMethod === 'google_wallet' ||
          route.preferredMethod === 'apple_wallet'
        ? 'wallet_disbursed'
        : 'settled_instant';

    records.push({
      id: `PO-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}-${idxKey.slice(0, 4).toUpperCase()}`,
      orderId,
      transactionId,
      recipientName: route.entityName,
      recipientId: route.entityId,
      recipientType: route.entityType === 'band' ? 'band' : 'seller',
      payoutMethod: route.preferredMethod,
      destinationLabel: route.destinationLabel,
      stripeAccountId: route.stripeAccountId,
      grossAmount: grossSubtotal,
      platformFee,
      shippingCredit,
      netPayout,
      buyerPaymentMethod,
      status,
      items: groupItems,
      createdAt: now,
    });
  });

  if (typeof window !== 'undefined') {
    try {
      const existing = getPayoutLedger();
      const deduplicated = existing.filter(
        (r) =>
          !(
            r.orderId === orderId &&
            records.some((nr) => nr.recipientName === r.recipientName)
          )
      );
      const nextLedger = [...records, ...deduplicated].slice(0, 200);
      localStorage.setItem(PAYOUT_LEDGER_STORAGE_KEY, JSON.stringify(nextLedger));
      window.dispatchEvent(
        new CustomEvent('nexus_payout_ledger_updated', { detail: records })
      );
    } catch {
      // Ignore quota errors
    }

    // Best-effort sync to backend ledger endpoint
    try {
      fetch('/api/payments/payout-settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlements: records }),
      }).catch(() => {});
    } catch {
      // Ignore network errors
    }
  }

  return records;
}
