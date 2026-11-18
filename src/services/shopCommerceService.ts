import { getSupabase } from './clientService';
import { inventoryStore } from '../utils/indexedDB';

export const FREE_SHIPPING_THRESHOLD_PER_BAND = 75;
export const FLAT_SHIPPING_PER_BAND = 5;

const STOCK_OVERRIDES_KEY = 'nexus_shop_stock_overrides_v1';
const WISHLIST_KEY = 'nexus_shop_wishlist_v1';
const LISTING_STATUS_KEY = 'nexus_listing_status_v1';
const LISTING_OFFERS_KEY = 'nexus_listing_offers_v1';
const COLLECTIONS_KEY = 'nexus_my_collections_v1';
const CART_STORAGE_KEY = 'nexus_shop_cart_v1';

export type FulfillmentMode = 'ship' | 'booth_pickup';

export interface FulfillmentChoice {
  mode: FulfillmentMode;
  showId?: string;
  showTitle?: string;
  venue?: string;
  date?: string;
}

export type CartFulfillmentMap = Record<string, FulfillmentChoice>;

export interface StockOverrideEntry {
  totalStock?: number;
  variantStocks?: Record<string, number>;
  updatedAt: string;
}

export interface ListingOfferRecord {
  id: string;
  itemId: string;
  itemName: string;
  sellerName: string;
  buyerName: string;
  amount: number;
  tradeNote?: string;
  fulfillmentPreference?: 'local_meetup' | 'escrow_shipping';
  status: 'submitted' | 'counter' | 'accepted' | 'declined';
  counterAmount?: number;
  createdAt: string;
}

export function normalizeBandKey(name?: string): string {
  return String(name || 'Nexus Merchant').trim().toLowerCase() || 'nexus merchant';
}

function normalizeStoreToken(val?: any): string {
  return String(val || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function resolveCategoryGroup(item: any): string {
  const cat = normalizeStoreToken(item?.category);
  const sub = normalizeStoreToken(item?.subcategory || item?.rawCategory || item?.item_type);
  if (cat === 'gear' || sub === 'gear') return 'gear';
  if (cat === 'classifieds' || sub === 'classifieds') return 'classifieds';
  if (
    cat === 'media' ||
    cat === 'vinyl' ||
    sub.includes('vinyl') ||
    sub.includes('cd') ||
    sub.includes('cassette') ||
    sub.includes('tape')
  ) {
    return 'media';
  }
  if (cat === 'label') return 'label';
  return 'apparel';
}

function isPlaceholderImage(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  return trimmed.length === 0;
}

/**
 * Deduplicates storefront items across Supabase `shop_merch`, `nexus_shop_items`,
 * Band Inventory (`nexus_master_inventory`), feed `merch_drop` posts, and props/mock items.
 * Collapses duplicate entries sharing an ID, linked `dropId`/`inventoryId`, or identical
 * `(name, seller/artist, price, categoryGroup)` signature while merging richer metadata.
 */
export function deduplicateStorefrontItems<T extends Record<string, any>>(items: T[]): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const result: T[] = [];
  const seenKeys = new Map<string, number>();

  const registerKey = (key: string, idx: number) => {
    if (key) seenKeys.set(key, idx);
  };

  const getCandidateKeys = (item: any): string[] => {
    const keys: string[] = [];
    const id = String(item?.id || '').trim();
    const dropId = String(item?.dropId || item?.merchData?.dropId || '').trim();
    const invId = String(item?.inventoryId || item?.inventory_id || '').trim();
    const listingId = String(item?.listingId || '').trim();

    if (id) keys.push(`id:${id}`);
    if (dropId) keys.push(`id:${dropId}`);
    if (invId) {
      keys.push(`id:${invId}`);
      keys.push(`inv:${invId}`);
    }
    if (listingId) keys.push(`id:${listingId}`);

    const normName = normalizeStoreToken(item?.name || item?.title);
    const normSeller = normalizeStoreToken(
      item?.seller || item?.artist || item?.bandName || item?.band || item?.brand || item?.poster
    );
    const priceNum = Number(item?.price);
    const priceKey = Number.isFinite(priceNum) ? priceNum.toFixed(2) : '0.00';
    const catGroup = resolveCategoryGroup(item);

    if (normName && normSeller) {
      keys.push(`sig:${normName}::${normSeller}::${priceKey}::${catGroup}`);
    } else if (normName) {
      keys.push(`sig:${normName}::::${priceKey}::${catGroup}`);
    }

    // If item carries an explicit band attribution in addition to seller (e.g. posted by pro for a band),
    // also match against band-owned catalog rows of the same name + price + category.
    const normBand = normalizeStoreToken(item?.bandName || item?.band_name || item?.band);
    if (normName && normBand && normBand !== normSeller) {
      keys.push(`sig:${normName}::${normBand}::${priceKey}::${catGroup}`);
    }

    return keys;
  };

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const keys = getCandidateKeys(rawItem);
    let existingIdx: number | undefined;
    for (const k of keys) {
      if (seenKeys.has(k)) {
        existingIdx = seenKeys.get(k);
        break;
      }
    }

    if (existingIdx !== undefined) {
      const target: any = result[existingIdx];
      // Merge richer fields into the first-seen primary record without creating a duplicate card
      if (isPlaceholderImage(target.thumbnail) && !isPlaceholderImage(rawItem.thumbnail)) {
        target.thumbnail = rawItem.thumbnail;
      }
      if ((!Array.isArray(target.images) || target.images.length === 0) && Array.isArray(rawItem.images) && rawItem.images.length > 0) {
        target.images = rawItem.images;
      }
      if ((!Array.isArray(target.sizes) || target.sizes.length === 0) && Array.isArray(rawItem.sizes) && rawItem.sizes.length > 0) {
        target.sizes = rawItem.sizes;
      }
      if (!target.variantStocks && rawItem.variantStocks) {
        target.variantStocks = rawItem.variantStocks;
      }
      if ((!Array.isArray(target.variants) || target.variants.length === 0) && Array.isArray(rawItem.variants) && rawItem.variants.length > 0) {
        target.variants = rawItem.variants;
      }
      if ((target.stock === undefined || target.stock === null) && rawItem.stock !== undefined && rawItem.stock !== null) {
        target.stock = rawItem.stock;
      }
      if (!target.description && rawItem.description) {
        target.description = rawItem.description;
      }
      if (!target.band_id && (rawItem.band_id || rawItem.bandId)) {
        target.band_id = rawItem.band_id || rawItem.bandId;
      }
      if (!target.bandName && (rawItem.bandName || rawItem.band_name)) {
        target.bandName = rawItem.bandName || rawItem.band_name;
      }
      if (!target.inventory_id && (rawItem.inventory_id || rawItem.inventoryId)) {
        target.inventory_id = rawItem.inventory_id || rawItem.inventoryId;
      }
      if (!target.dropId && rawItem.dropId) {
        target.dropId = rawItem.dropId;
      }
      if (!target.seller_id && rawItem.seller_id) {
        target.seller_id = rawItem.seller_id;
      }
      if (!target.is_timed && rawItem.is_timed) {
        target.is_timed = rawItem.is_timed;
        target.expires_at = target.expires_at || rawItem.expires_at;
        target.duration_hours = target.duration_hours || rawItem.duration_hours;
      }
      if ((!Array.isArray(target.tracks) || target.tracks.length === 0) && Array.isArray(rawItem.tracks) && rawItem.tracks.length > 0) {
        target.tracks = rawItem.tracks;
      }
      if (!target.is_real_account && rawItem.is_real_account) {
        target.is_real_account = true;
      }
      keys.forEach((k) => registerKey(k, existingIdx!));
      continue;
    }

    const cloned = { ...rawItem };
    const newIdx = result.length;
    result.push(cloned);
    keys.forEach((k) => registerKey(k, newIdx));
  }

  return result;
}

export function readStoredCart(): any[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeStoredCart(items: any[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items || []));
  } catch {
    // ignore storage quota errors
  }
}

export function getStockOverridesMap(): Record<string, StockOverrideEntry> {
  try {
    const raw = localStorage.getItem(STOCK_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveStockOverridesMap(map: Record<string, StockOverrideEntry>): void {
  try {
    localStorage.setItem(STOCK_OVERRIDES_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('nexus_shop_stock_updated', { detail: map }));
  } catch {
    // ignore
  }
}

export function getVariantStockMap(item: any): Record<string, number> {
  const overrides = getStockOverridesMap();
  const itemKey = String(item?.id || item?.productId || '');
  const overrideEntry = itemKey ? overrides[itemKey] : undefined;

  const map: Record<string, number> = {};

  if (item?.variantStocks && typeof item.variantStocks === 'object') {
    Object.entries(item.variantStocks).forEach(([k, v]) => {
      map[k] = Math.max(0, Number(v) || 0);
    });
  } else if (Array.isArray(item?.variants) && item.variants.length > 0) {
    item.variants.forEach((v: any) => {
      const sz = String(v?.size || v?.label || '').trim();
      if (sz) {
        map[sz] = Math.max(0, Number(v?.stock ?? item?.stock ?? 10) || 0);
      }
    });
  } else if (Array.isArray(item?.sizes) && item.sizes.length > 0 && typeof item?.stock === 'number' && item.stock >= 0) {
    // Allocate a sensible deterministic distribution across sizes when only aggregate stock exists
    const perSizeBase = Math.floor(item.stock / item.sizes.length);
    let remainder = item.stock % item.sizes.length;
    item.sizes.forEach((sz: string) => {
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder -= 1;
      map[sz] = Math.max(0, perSizeBase + extra);
    });
  }

  if (overrideEntry?.variantStocks) {
    Object.entries(overrideEntry.variantStocks).forEach(([k, v]) => {
      map[k] = Math.max(0, Number(v) || 0);
    });
  }

  return map;
}

export function getItemAvailableStock(item: any, size?: string): {
  isUnlimited: boolean;
  totalStock: number | null;
  variantStock: number | null;
  isSoldOut: boolean;
  isVariantSoldOut: boolean;
} {
  if (!item) {
    return {
      isUnlimited: false,
      totalStock: 0,
      variantStock: 0,
      isSoldOut: true,
      isVariantSoldOut: true,
    };
  }

  const listingStatus = getListingStatus(item.id);
  if (listingStatus === 'sold') {
    return {
      isUnlimited: false,
      totalStock: 0,
      variantStock: 0,
      isSoldOut: true,
      isVariantSoldOut: true,
    };
  }

  const overrides = getStockOverridesMap();
  const itemKey = String(item.id || item.productId || '');
  const override = itemKey ? overrides[itemKey] : undefined;

  const isExplicitUnlimited = Boolean(item.isUnlimited || item.is_unlimited);
  const rawBaseStock =
    override?.totalStock !== undefined
      ? override.totalStock
      : item.stock !== undefined && item.stock !== null
      ? Number(item.stock)
      : item.table_stock !== undefined || item.van_stock !== undefined
      ? Number(item.table_stock || 0) + Number(item.van_stock || 0)
      : null;

  const totalStock =
    isExplicitUnlimited && override?.totalStock === undefined
      ? null
      : rawBaseStock !== null && Number.isFinite(rawBaseStock)
      ? Math.max(0, rawBaseStock)
      : null;

  const variantMap = getVariantStockMap(item);
  const hasVariantMap = Object.keys(variantMap).length > 0;
  const variantStock =
    size && hasVariantMap && variantMap[size] !== undefined
      ? Math.max(0, variantMap[size])
      : totalStock;

  const isUnlimited = isExplicitUnlimited && totalStock === null;
  const isSoldOut =
    !isUnlimited &&
    ((totalStock !== null && totalStock <= 0) ||
      (hasVariantMap && Object.values(variantMap).every((n) => n <= 0)));

  const isVariantSoldOut =
    isSoldOut || (!isUnlimited && size !== undefined && variantStock !== null && variantStock <= 0);

  return {
    isUnlimited,
    totalStock,
    variantStock,
    isSoldOut,
    isVariantSoldOut,
  };
}

export async function decrementPurchasedInventory(
  purchasedItems: Array<{
    productId?: string;
    id?: string;
    inventoryId?: string;
    inventory_id?: string;
    bandId?: string;
    band_id?: string;
    name?: string;
    size?: string;
    quantity?: number;
    stock?: number;
  }>
): Promise<void> {
  if (!Array.isArray(purchasedItems) || purchasedItems.length === 0) return;

  const overrides = getStockOverridesMap();

  // 1. Update nexus_master_inventory in localStorage & IndexedDB if matching item exists
  let masterInventory: any[] = [];
  let masterChanged = false;
  const supabaseInvUpdates: any[] = [];
  try {
    const rawLocal = localStorage.getItem('nexus_master_inventory');
    if (rawLocal) {
      masterInventory = JSON.parse(rawLocal);
    } else {
      const idbRaw = await inventoryStore.getItem('nexus_master_inventory');
      if (typeof idbRaw === 'string') masterInventory = JSON.parse(idbRaw);
    }
  } catch {
    masterInventory = [];
  }

  for (const purchased of purchasedItems) {
    const targetId = String(purchased.productId || purchased.id || '').trim();
    const linkedInvId = String(purchased.inventoryId || purchased.inventory_id || '').trim();
    const linkedBandId = String(purchased.bandId || purchased.band_id || '').trim();
    const qty = Math.max(1, Number(purchased.quantity) || 1);
    const chosenSize = purchased.size;
    if (!targetId && !linkedInvId) continue;

    // Locate in master inventory (prioritize explicit inventoryId link, then productId, then name+band)
    const invIndex = Array.isArray(masterInventory)
      ? masterInventory.findIndex((inv: any) => {
          const invRowId = String(inv?.id || '');
          if (linkedInvId && invRowId === linkedInvId) return true;
          if (targetId && invRowId === targetId) return true;
          if (purchased.name && String(inv?.name || inv?.title || '').toLowerCase() === purchased.name.toLowerCase()) {
            if (!linkedBandId || !inv?.band_id) return true;
            return String(inv.band_id) === linkedBandId;
          }
          return false;
        })
      : -1;

    let currentTotal: number | undefined;
    let currentVariantMap: Record<string, number> = {};

    if (invIndex >= 0) {
      const inv = masterInventory[invIndex];
      const existingTotal =
        inv.stock !== undefined
          ? Number(inv.stock)
          : Number(inv.table_stock || 0) + Number(inv.van_stock || 0);
      currentTotal = Math.max(0, existingTotal - qty);

      if (Number(inv.table_stock || 0) >= qty) {
        inv.table_stock = Math.max(0, Number(inv.table_stock || 0) - qty);
      } else {
        const remainingToTake = qty - Number(inv.table_stock || 0);
        inv.table_stock = 0;
        inv.van_stock = Math.max(0, Number(inv.van_stock || 0) - remainingToTake);
      }
      inv.stock = currentTotal;

      if (Array.isArray(inv.variants) && chosenSize) {
        inv.variants = inv.variants.map((v: any) => {
          const vSize = String(v?.size || v?.label || '');
          const vStock = Math.max(0, Number(v?.stock || 0));
          currentVariantMap[vSize] = vSize === chosenSize ? Math.max(0, vStock - qty) : vStock;
          return vSize === chosenSize ? { ...v, stock: String(currentVariantMap[vSize]) } : v;
        });
      }

      inv.status = currentTotal <= 0 ? 'Sold Out' : currentTotal <= (inv.low_threshold || 5) ? 'Low Stock' : 'Healthy';
      masterInventory[invIndex] = inv;
      masterChanged = true;
      supabaseInvUpdates.push({
        id: inv.id,
        table_stock: inv.table_stock,
        van_stock: inv.van_stock,
        variants: inv.variants,
        status: inv.status,
      });
    }

    // Update stock override entry for non-master items (shop_merch, mock items, feed drops)
    const overrideKey = targetId || linkedInvId;
    const existingOverride = overrides[overrideKey] || { updatedAt: new Date().toISOString() };
    const knownStock =
      existingOverride.totalStock ??
      currentTotal ??
      (purchased.stock !== undefined ? Math.max(0, Number(purchased.stock) - qty) : undefined);

    if (chosenSize) {
      const nextChosenStock =
        currentVariantMap[chosenSize] !== undefined
          ? currentVariantMap[chosenSize]
          : Math.max(
              0,
              (existingOverride.variantStocks?.[chosenSize] ??
                (knownStock !== undefined ? Math.max(0, knownStock) : 5)) - qty
            );
      existingOverride.variantStocks = {
        ...(existingOverride.variantStocks || {}),
        ...currentVariantMap,
        [chosenSize]: nextChosenStock,
      };
    }

    if (knownStock !== undefined) {
      existingOverride.totalStock = currentTotal !== undefined ? currentTotal : Math.max(0, knownStock);
    }
    existingOverride.updatedAt = new Date().toISOString();
    overrides[overrideKey] = existingOverride;
    if (linkedInvId && linkedInvId !== overrideKey) {
      overrides[linkedInvId] = existingOverride;
    }

    // Best-effort Supabase decrement on shop_merch
    try {
      const sb = getSupabase();
      if (sb && targetId && !targetId.startsWith('mock_') && !targetId.startsWith('m_')) {
        const { data: row } = await sb.from('shop_merch').select('id, stock').eq('id', targetId).maybeSingle();
        if (row && typeof row.stock === 'number') {
          await sb
            .from('shop_merch')
            .update({ stock: Math.max(0, row.stock - qty) })
            .eq('id', targetId);
        }
      }
    } catch {
      // ignore if Supabase row doesn't exist
    }
  }

  // Persist linked Band Inventory updates to Supabase `inventory` table (best-effort)
  if (supabaseInvUpdates.length > 0) {
    try {
      const sb = getSupabase();
      if (sb) {
        for (const upd of supabaseInvUpdates) {
          if (!upd.id || String(upd.id).startsWith('inv_')) continue;
          await sb
            .from('inventory')
            .update({
              table_stock: upd.table_stock,
              van_stock: upd.van_stock,
              variants: upd.variants,
              status: upd.status,
            })
            .eq('id', upd.id);
        }
      }
    } catch {
      // ignore Supabase inventory sync failure for buyers without write access
    }
  }

  if (masterChanged) {
    try {
      localStorage.setItem('nexus_master_inventory', JSON.stringify(masterInventory));
      await inventoryStore.setItem('nexus_master_inventory', JSON.stringify(masterInventory));
      window.dispatchEvent(new CustomEvent('nexus_inventory_updated', { detail: masterInventory }));
    } catch {
      // ignore
    }
  }

  saveStockOverridesMap(overrides);
}

export interface BandCartGroupSummary {
  bandName: string;
  bandKey: string;
  items: any[];
  subtotal: number;
  fulfillment: FulfillmentChoice;
  shippingFee: number;
  amountToFreeShipping: number;
  freeShippingProgress: number;
}

export function calculateCartShippingBreakdown(
  cartItems: any[],
  fulfillmentMap: CartFulfillmentMap = {}
): {
  groups: BandCartGroupSummary[];
  subtotal: number;
  shippingTotal: number;
  grandTotal: number;
} {
  const map = new Map<string, { displayName: string; items: any[] }>();
  (cartItems || []).forEach((item) => {
    const displayName = String(item?.bandName || item?.seller || item?.brand || 'Nexus Merchant').trim();
    const key = normalizeBandKey(displayName);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, { displayName, items: [item] });
    }
  });

  const groups: BandCartGroupSummary[] = [];
  let subtotal = 0;
  let shippingTotal = 0;

  map.forEach((group, bandKey) => {
    const bandSubtotal = group.items.reduce(
      (acc, item) => acc + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
    const choice: FulfillmentChoice = fulfillmentMap[bandKey] || { mode: 'ship' };
    const qualifiesFreeShipping = bandSubtotal >= FREE_SHIPPING_THRESHOLD_PER_BAND;
    const shippingFee =
      choice.mode === 'booth_pickup'
        ? 0
        : qualifiesFreeShipping
        ? 0
        : bandSubtotal > 0
        ? FLAT_SHIPPING_PER_BAND
        : 0;
    const amountToFreeShipping =
      choice.mode === 'booth_pickup' ? 0 : Math.max(0, FREE_SHIPPING_THRESHOLD_PER_BAND - bandSubtotal);
    const freeShippingProgress =
      choice.mode === 'booth_pickup'
        ? 100
        : Math.min(100, Math.round((bandSubtotal / FREE_SHIPPING_THRESHOLD_PER_BAND) * 100));

    subtotal += bandSubtotal;
    shippingTotal += shippingFee;

    groups.push({
      bandName: group.displayName,
      bandKey,
      items: group.items,
      subtotal: bandSubtotal,
      fulfillment: choice,
      shippingFee,
      amountToFreeShipping,
      freeShippingProgress,
    });
  });

  return {
    groups,
    subtotal,
    shippingTotal,
    grandTotal: subtotal + shippingTotal,
  };
}

export function findUpcomingShowsForBand(
  bandName?: string,
  liveEvents: any[] = [],
  _sellerId?: string
): Array<{ id: string; title: string; venue: string; date: string; city?: string }> {
  const results: Array<{ id: string; title: string; venue: string; date: string; city?: string }> = [];
  const seen = new Set<string>();
  const target = (bandName || '').toLowerCase().trim();

  let communityShows: any[] = [];
  try {
    const raw = localStorage.getItem('nexus_community_shows_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) communityShows = parsed;
    }
  } catch {
    communityShows = [];
  }

  const combined = [...(Array.isArray(liveEvents) ? liveEvents : []), ...communityShows];
  combined.forEach((ev: any, idx: number) => {
    if (!ev) return;
    const id = String(ev.id || ev.show_id || `show_${idx}`);
    const title = String(ev.headliner || ev.title || ev.name || 'Live Show').trim();
    const venue = String(ev.venue || ev.venue_name || ev.location || 'Venue').trim();
    const date = String(ev.date || ev.show_date || 'Upcoming Date').trim();
    const lineupStr = Array.isArray(ev.lineup) ? ev.lineup.join(' ').toLowerCase() : String(ev.lineup || '').toLowerCase();
    const haystack = `${title} ${ev.band || ''} ${ev.artist || ''} ${ev.bandName || ''} ${lineupStr}`.toLowerCase();

    if (!target || haystack.includes(target) || target.includes(title.toLowerCase())) {
      const dedupeKey = `${title.toLowerCase()}_${venue.toLowerCase()}_${date.toLowerCase()}`;
      if (!seen.has(dedupeKey)) {
        seen.add(dedupeKey);
        results.push({ id, title, venue, date, city: ev.city });
      }
    }
  });

  return results;
}

export function getWishlistIds(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toggleWishlistItem(itemId: string): { ids: string[]; added: boolean } {
  const idStr = String(itemId || '').trim();
  const current = getWishlistIds();
  if (!idStr) return { ids: current, added: false };
  const exists = current.includes(idStr);
  const next = exists ? current.filter((x) => x !== idStr) : [idStr, ...current];
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('nexus_wishlist_updated', { detail: next }));
  } catch {
    // ignore
  }
  return { ids: next, added: !exists };
}

export function getListingStatusMap(): Record<string, 'available' | 'pending' | 'sold'> {
  try {
    const raw = localStorage.getItem(LISTING_STATUS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getListingStatus(itemId?: string): 'available' | 'pending' | 'sold' {
  if (!itemId) return 'available';
  const map = getListingStatusMap();
  return map[String(itemId)] || 'available';
}

export async function setListingStatus(
  itemId: string,
  status: 'available' | 'pending' | 'sold'
): Promise<Record<string, 'available' | 'pending' | 'sold'>> {
  const map = getListingStatusMap();
  map[String(itemId)] = status;
  try {
    localStorage.setItem(LISTING_STATUS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('nexus_listing_status_updated', { detail: map }));
  } catch {
    // ignore
  }

  try {
    const sb = getSupabase();
    if (sb && !itemId.startsWith('gear') && !itemId.startsWith('class')) {
      await sb.from('nexus_shop_items').update({ status }).eq('id', itemId);
    }
  } catch {
    // column may not exist in older schemas
  }

  return map;
}

export function getListingOffersMap(): Record<string, ListingOfferRecord[]> {
  try {
    const raw = localStorage.getItem(LISTING_OFFERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function submitListingOffer(params: {
  itemId: string;
  itemName: string;
  sellerName: string;
  buyerName: string;
  amount: number;
  tradeNote?: string;
  fulfillmentPreference?: 'local_meetup' | 'escrow_shipping';
}): ListingOfferRecord {
  const record: ListingOfferRecord = {
    id: `offer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemId: String(params.itemId),
    itemName: params.itemName,
    sellerName: params.sellerName,
    buyerName: params.buyerName,
    amount: Number(params.amount) || 0,
    tradeNote: params.tradeNote?.trim() || undefined,
    fulfillmentPreference: params.fulfillmentPreference || 'escrow_shipping',
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };

  const map = getListingOffersMap();
  const list = Array.isArray(map[record.itemId]) ? map[record.itemId] : [];
  map[record.itemId] = [record, ...list];
  try {
    localStorage.setItem(LISTING_OFFERS_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('nexus_listing_offers_updated', { detail: map }));
  } catch {
    // ignore
  }
  return record;
}

export function isPhysicalMediaItem(item: any): boolean {
  const cat = String(item?.category || '').toLowerCase();
  const sub = String(item?.subcategory || item?.format || item?.item_type || '').toLowerCase();
  const name = String(item?.name || item?.title || '').toLowerCase();
  return (
    cat === 'media' ||
    cat === 'vinyl' ||
    cat === 'physical media' ||
    sub.includes('vinyl') ||
    sub.includes('cd') ||
    sub.includes('cassette') ||
    sub.includes('tape') ||
    sub.includes('lp') ||
    sub.includes('ep') ||
    name.includes(' lp') ||
    name.includes('vinyl') ||
    name.includes('cassette') ||
    name.includes('digipak') ||
    Array.isArray(item?.tracks) && item.tracks.length > 0
  );
}

export function resolveItemTracks(
  item: any,
  inAppSongsList: any[] = [],
  bands: any[] = []
): Array<{ id: string; num: string; title: string; duration: string; audioUrl?: string; band?: string }> {
  if (Array.isArray(item?.tracks) && item.tracks.length > 0) {
    return item.tracks.map((t: any, i: number) => ({
      id: String(t.id || `trk_${i}`),
      num: String(t.num || i + 1),
      title: String(t.title || t.name || `Track ${i + 1}`),
      duration: String(t.duration || '3:15'),
      audioUrl: t.audioUrl || t.url || undefined,
      band: item.artist || item.band || item.brand,
    }));
  }

  const itemNameLower = String(item?.name || item?.title || '').toLowerCase();
  const artistLower = String(item?.artist || item?.band || item?.brand || item?.seller || '').toLowerCase();

  // Check bands discography in memory or local catalog
  for (const band of bands || []) {
    const bName = String(band?.band_name || band?.name || '').toLowerCase();
    if (!bName) continue;
    const matchesBand = artistLower ? bName.includes(artistLower) || artistLower.includes(bName) : itemNameLower.includes(bName);
    if (matchesBand && Array.isArray(band.discography)) {
      for (const rel of band.discography) {
        const rTitle = String(rel?.title || '').toLowerCase();
        if (rTitle && itemNameLower.includes(rTitle) && Array.isArray(rel.tracks) && rel.tracks.length > 0) {
          return rel.tracks.map((t: any, i: number) => ({
            id: String(t.id || `dtrk_${i}`),
            num: String(t.num || i + 1),
            title: String(t.title || `Track ${i + 1}`),
            duration: String(t.duration || '3:20'),
            audioUrl: t.audioUrl || t.url || undefined,
            band: band.band_name || band.name,
          }));
        }
      }
    }
  }

  // Fallback check against inAppSongsList
  const matchedSongs = (inAppSongsList || []).filter((s: any) => {
    const sBand = String(s?.band || s?.artist || '').toLowerCase();
    const sAlbum = String(s?.album || '').toLowerCase();
    return (
      (sAlbum && itemNameLower.includes(sAlbum)) ||
      (sBand && artistLower && (sBand.includes(artistLower) || artistLower.includes(sBand))) ||
      (sBand && itemNameLower.includes(sBand))
    );
  });

  if (matchedSongs.length > 0) {
    return matchedSongs.slice(0, 6).map((s: any, i: number) => ({
      id: String(s.id || `song_${i}`),
      num: String(i + 1),
      title: String(s.title || `Track ${i + 1}`),
      duration: String(s.duration || '3:30'),
      audioUrl: s.audioUrl || undefined,
      band: s.band || s.artist,
    }));
  }

  // Also check localStorage label_catalog_releases
  try {
    const rawRel = localStorage.getItem('label_catalog_releases');
    if (rawRel) {
      const parsed = JSON.parse(rawRel);
      const allRel = Object.values(parsed || {}).flat() as any[];
      const matchRel = allRel.find((r) => {
        const rt = String(r?.title || '').toLowerCase();
        return rt && itemNameLower.includes(rt) && Array.isArray(r.tracks) && r.tracks.length > 0;
      });
      if (matchRel) {
        return matchRel.tracks.map((t: any, i: number) => ({
          id: String(t.id || `lrel_${i}`),
          num: String(t.num || i + 1),
          title: String(t.title || `Track ${i + 1}`),
          duration: String(t.duration || '3:30'),
          audioUrl: t.audioUrl || t.url || undefined,
          band: matchRel.artist || matchRel.band,
        }));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export function commitShopPurchaseToCollections(params: {
  items: any[];
  orderId: string;
  transactionId?: string;
  paymentMethod?: string;
  fulfillmentMap?: CartFulfillmentMap;
  shippingAddress?: any;
  shippingCost?: number;
  inAppSongsList?: any[];
  bands?: any[];
}): any[] {
  const newRecords: any[] = [];
  const { items, orderId, transactionId, paymentMethod, fulfillmentMap, shippingAddress, shippingCost, inAppSongsList, bands } = params;

  (items || []).forEach((item, idx) => {
    const bandName = item.bandName || item.band || item.seller || item.brand || 'Official Artist';
    const fulfillment = fulfillmentMap?.[normalizeBandKey(bandName)] || item.fulfillment || { mode: 'ship' };
    const isBoothPickup = fulfillment.mode === 'booth_pickup';
    const pickupCode = isBoothPickup
      ? `BOOTH-${String(orderId || Date.now()).slice(-6).toUpperCase()}-${idx + 1}`
      : undefined;

    const merchRecord = {
      id: `col_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
      orderId,
      transactionId,
      type: 'merch' as const,
      data: {
        id: item.productId || item.id,
        name: item.name,
        thumbnail: item.image || item.thumbnail,
        price: Number(item.price) || 0,
        band: bandName,
        sizes: item.size ? [item.size] : item.sizes || [],
        fulfillmentType: isBoothPickup ? 'booth_pickup' : 'ship',
        pickupCode,
        pickupShow: isBoothPickup
          ? {
              showId: fulfillment.showId,
              title: fulfillment.showTitle,
              venue: fulfillment.venue,
              date: fulfillment.date,
            }
          : undefined,
        shippingCost: idx === 0 ? shippingCost : 0,
        shippingAddress: isBoothPickup ? undefined : shippingAddress,
        digitalUnlocked: isPhysicalMediaItem(item),
      },
      quantity: item.quantity || 1,
      paymentMethod,
      date: new Date(),
    };

    newRecords.push(merchRecord);

    // Unlock Digital Music copy in My Collections when buying Vinyl/CD/Cassette
    if (isPhysicalMediaItem(item)) {
      const tracks = resolveItemTracks(item, inAppSongsList, bands);
      const digitalRecord = {
        id: `col_dig_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
        orderId,
        type: 'music' as const,
        data: {
          id: `dig_${item.productId || item.id}`,
          title: item.name,
          name: item.name,
          band: bandName,
          artist: bandName,
          coverArt: item.image || item.thumbnail,
          thumbnail: item.image || item.thumbnail,
          format: 'Digital Master (Unlocked via Physical Purchase)',
          tracks:
            tracks.length > 0
              ? tracks
              : [
                  {
                    id: `dig_trk_${idx}_1`,
                    num: '1',
                    title: `${item.name} (Digital Download)`,
                    duration: '04:12',
                  },
                ],
        },
        quantity: 1,
        paymentMethod,
        date: new Date(),
      };
      newRecords.push(digitalRecord);
    }
  });

  try {
    const existing = JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]');
    const updated = [...newRecords, ...(Array.isArray(existing) ? existing : [])];
    localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexus-collections-updated'));
    return updated;
  } catch {
    return newRecords;
  }
}
