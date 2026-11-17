import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  X,
  Search,
  Check,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  ShieldCheck,
  Truck,
  Upload,
  MessageSquare,
  Zap,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Music,
  Clock,
  MapPin,
  ArrowUpDown,
  Repeat,
  Tag,
} from 'lucide-react';
import { mockShopItems } from '../../data/shopMockData';
import { syncPostToSupabase } from './utils/postSyncUtils';
import { fetchShopMerchItems } from '../../supabase';
import {
  getItemAvailableStock,
  getVariantStockMap,
  findUpcomingShowsForBand,
  getWishlistIds,
  toggleWishlistItem,
  getListingStatus,
  setListingStatus,
  getListingOffersMap,
  submitListingOffer,
  isPhysicalMediaItem,
  resolveItemTracks,
  FREE_SHIPPING_THRESHOLD_PER_BAND,
  type ListingOfferRecord,
} from '../../services/shopCommerceService';

type ChatType = any;

interface StorefrontViewProps {
  activeTab: string;
  shopBrandFilter: string | null;
  setShopBrandFilter: (val: string | null) => void;
  portalRole?: string;
  shopSearchQuery?: string;
  setShopSearchQuery?: (val: string) => void;
  shopCategory?: string;
  setShopCategory?: (val: string) => void;
  shopItems?: any[];
  setShopItems?: React.Dispatch<React.SetStateAction<any[]>>;
  selectedMerch?: any;
  setSelectedMerch?: (item: any) => void;
  selectedMerchSize?: string;
  setSelectedMerchSize?: (val: string) => void;
  selectedMerchQty?: number;
  setSelectedMerchQty?: (val: number) => void;
  isCheckoutModalOpen?: boolean;
  setIsCheckoutModalOpen?: (val: boolean) => void;
  checkoutSuccess?: boolean;
  setCheckoutSuccess?: (val: boolean) => void;
  userProfile?: any;
  triggerNotification?: (msg: string) => void;
  getSupabase?: () => any;
  liveEvents?: any[];
  inAppSongsList?: any[];
  bands?: any[];
  feed?: any[];
  [key: string]: any;
}

export const getShopCategoryFallback = (item: any): string => {
  if (item?.fallbackThumbnail && !item.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo')) {
    return item.fallbackThumbnail;
  }
  const cat = (item?.category || item?.subcategory || '').toLowerCase();
  const name = (item?.name || '').toLowerCase();

  if (cat.includes('gear') || name.includes('amp') || name.includes('guitar') || name.includes('pedal') || name.includes('head')) {
    return 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('vinyl') || cat.includes('media') || name.includes('lp') || name.includes('album') || name.includes('split')) {
    return 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('hoodie') || name.includes('hoodie') || name.includes('sweatshirt') || name.includes('sweatpants')) {
    return 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('apparel') || cat.includes('t-shirt') || name.includes('tee') || name.includes('shirt') || name.includes('longsleeve')) {
    return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600';
  }
  if (cat.includes('classifieds')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600';
  }
  return 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600';
};

function formatCountdownRemaining(expiresAt?: string, createdAt?: string, durationHours?: number): string | null {
  let targetMs: number | null = null;
  if (expiresAt) {
    const parsed = Date.parse(expiresAt);
    if (Number.isFinite(parsed)) targetMs = parsed;
  } else if (createdAt && durationHours) {
    const start = Date.parse(createdAt);
    if (Number.isFinite(start)) targetMs = start + durationHours * 3600 * 1000;
  }
  if (!targetMs) return null;
  const diff = targetMs - Date.now();
  if (diff <= 0) return 'Drop Ended';
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (hrs >= 24) {
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h left`;
  }
  return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

export const StorefrontView: React.FC<StorefrontViewProps> = (props) => {
  const {
    activeTab,
    shopBrandFilter,
    setShopBrandFilter,
    portalRole,
    shopSearchQuery = '',
    setShopSearchQuery = () => {},
    shopCategory = 'all',
    setShopCategory = () => {},
    shopItems = [],
    setShopItems = () => {},
    userProfile,
    triggerNotification,
    getSupabase,
    addToCart = () => {},
    openCheckout = () => {},
    chats = [],
    setChats = () => {},
    allProfiles = [],
    liveEvents = [],
    inAppSongsList = [],
    bands = [],
    feed = [],
  } = props;

  // Storefront core state
  const [selectedShopItem, setSelectedShopItem] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [pdpQty, setPdpQty] = useState<number>(1);
  const [pdpImageIdx, setPdpImageIdx] = useState<number>(0);
  const [isImageZoomed, setIsImageZoomed] = useState<boolean>(false);
  const [showMakeOfferPanel, setShowMakeOfferPanel] = useState<boolean>(false);
  const [offerAmountInput, setOfferAmountInput] = useState<string>('');
  const [offerTradeInput, setOfferTradeInput] = useState<string>('');
  const [offerFulfillmentPref, setOfferFulfillmentPref] = useState<'escrow_shipping' | 'local_meetup'>('escrow_shipping');

  // Filtering & sorting state
  const [shopPage, setShopPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price_asc' | 'price_desc' | 'urgency'>('featured');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getWishlistIds());

  // Live vs Demo Catalog state
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const userToggledDemoRef = useRef<boolean>(false);
  const [inventoryCatalogItems, setInventoryCatalogItems] = useState<any[]>([]);
  const [supabaseDropItems, setSupabaseDropItems] = useState<any[]>([]);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});
  const [storeVersion, setStoreVersion] = useState<number>(0);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  // Audio preview state for physical media
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  // Community marketplace state
  const [communityCategory, setCommunityCategory] = useState<string>('all');
  const [communityCityFilter, setCommunityCityFilter] = useState<string>('');
  const [communityDeliveryFilter, setCommunityDeliveryFilter] = useState<'all' | 'local' | 'shipping' | 'trades'>('all');
  const [listingOffersMap, setListingOffersMap] = useState<Record<string, ListingOfferRecord[]>>(() => getListingOffersMap());

  // Create Listing modal state
  const [isPostListingOpen, setIsPostListingOpen] = useState<boolean>(false);
  const [newListingType, setNewListingType] = useState<string>('gear');
  const [newListingTitle, setNewListingTitle] = useState<string>('');
  const [newListingPrice, setNewListingPrice] = useState<string>('');
  const [newListingCondition, setNewListingCondition] = useState<string>('Good');
  const [newListingBrand, setNewListingBrand] = useState<string>('');
  const [newListingYear, setNewListingYear] = useState<string>('');
  const [newListingLocation, setNewListingLocation] = useState<string>('');
  const [newListingPhotos, setNewListingPhotos] = useState<string[]>([]);
  const [newListingDescription, setNewListingDescription] = useState<string>('');
  const [newListingTradesWelcome, setNewListingTradesWelcome] = useState<boolean>(false);
  const [newListingDeliveryOption, setNewListingDeliveryOption] = useState<'both' | 'local_meetup' | 'escrow_shipping'>('both');

  // Helper to hydrate local inventory & catalog releases
  const loadLocalRealCatalog = React.useCallback(() => {
    const loaded: any[] = [];
    const seenIds = new Set<string>();

    // 1. nexus_master_inventory
    try {
      const invStr = localStorage.getItem('nexus_master_inventory');
      if (invStr) {
        const inv = JSON.parse(invStr);
        if (Array.isArray(inv)) {
          inv.forEach((item: any) => {
            if (!(item.name || item.title)) return;
            const itemTypeStr = String(item.item_type || item.subcategory || item.type || item.category || '').toLowerCase();
            const isPhysical =
              itemTypeStr.includes('vinyl') ||
              itemTypeStr.includes('cd') ||
              itemTypeStr.includes('cassette') ||
              itemTypeStr.includes('media') ||
              itemTypeStr.includes('lp');
            const totalStock =
              item.stock !== undefined
                ? Number(item.stock)
                : item.table_stock !== undefined || item.van_stock !== undefined
                ? Number(item.table_stock || 0) + Number(item.van_stock || 0)
                : 25;
            const variantsList = Array.isArray(item.variants) ? item.variants : [];
            const sizes =
              variantsList.length > 0
                ? variantsList.map((v: any) => String(v.size || v.label || '').trim()).filter(Boolean)
                : isPhysical
                ? ['Vinyl LP', 'CD', 'Cassette']
                : ['S', 'M', 'L', 'XL', '2XL'];
            const variantStocks: Record<string, number> = {};
            variantsList.forEach((v: any) => {
              const k = String(v.size || v.label || '').trim();
              if (k) variantStocks[k] = Math.max(0, Number(v.stock) || 0);
            });

            const id = String(item.id || `inv_${(item.name || item.title).replace(/\s+/g, '_')}`);
            if (seenIds.has(id)) return;
            seenIds.add(id);

            loaded.push({
              id,
              name: item.name || item.title,
              price: Number(item.price) || 25,
              category: isPhysical ? 'media' : 'apparel',
              subcategory: item.format || item.subcategory || item.item_type || (isPhysical ? 'vinyl' : 't-shirts'),
              description:
                item.description ||
                `Official ${item.format || item.item_type || 'merchandise'} direct from ${item.artist || item.band || 'Band'}.`,
              thumbnail: item.image || item.coverUrl || item.artwork_url || item.thumbnail || '',
              images: Array.isArray(item.images) && item.images.length > 0 ? item.images : item.image ? [item.image] : [],
              sizes,
              variants: variantsList,
              variantStocks: Object.keys(variantStocks).length > 0 ? variantStocks : undefined,
              stock: totalStock,
              isPreOrder: Boolean(item.isPreOrder || item.is_preorder),
              pressingInfo: item.pressingInfo || item.pressing_info || (isPhysical ? 'First Pressing · Includes Digital Download' : undefined),
              brand: item.artist || item.band || item.brand || 'Official Artist',
              artist: item.artist || item.band || '',
              seller: item.artist || item.band || 'Official Artist',
              band_id: item.band_id || item.bandId || '',
              is_real_account: true,
              created_at: item.created_at || item.updated_at || new Date().toISOString(),
            });
          });
        }
      }
    } catch {
      // ignore parse errors
    }

    // 2. label_catalog_releases
    try {
      const relStr = localStorage.getItem('label_catalog_releases');
      if (relStr) {
        const relMap = JSON.parse(relStr);
        const allRel = Object.values(relMap || {}).flat() as any[];
        allRel.forEach((rel, idx) => {
          const id = String(rel.id || `rel_cat_${idx}_${(rel.title || '').replace(/\s+/g, '_')}`);
          if (seenIds.has(id) || !(rel.title || rel.name)) return;
          seenIds.add(id);
          const fmt = String(rel.format || 'Vinyl LP').toLowerCase();
          loaded.push({
            id,
            name: rel.title || rel.name,
            price: Number(rel.price) || 24,
            category: 'media',
            subcategory: fmt.includes('cd') ? 'cds' : fmt.includes('cassette') ? 'cassettes' : 'vinyl',
            description: rel.description || `Official physical release by ${rel.artist || rel.band || 'Artist'}.`,
            thumbnail: rel.cover_url || rel.artwork_url || rel.coverUrl || rel.image || '',
            images: rel.cover_url ? [rel.cover_url] : [],
            sizes: [rel.format || 'Vinyl LP', 'CD Digipak'],
            stock: rel.stock !== undefined ? Number(rel.stock) : 30,
            tracks: Array.isArray(rel.tracks) ? rel.tracks : undefined,
            isPreOrder: Boolean(rel.isPreOrder),
            pressingInfo: rel.pressing || 'Official Catalog Pressing · Digital Download Included',
            brand: rel.artist || rel.band || 'Official Label',
            artist: rel.artist || rel.band || '',
            seller: rel.artist || rel.band || 'Official Label',
            band_id: rel.band_id || '',
            is_real_account: true,
            created_at: rel.release_date || new Date().toISOString(),
          });
        });
      }
    } catch {
      // ignore
    }

    // 3. Band discographies
    (bands || []).forEach((b: any) => {
      if (!Array.isArray(b?.discography)) return;
      b.discography.forEach((rel: any, idx: number) => {
        const id = String(rel.id || `band_rel_${b.id || b.band_name}_${idx}`);
        if (seenIds.has(id) || !rel.title) return;
        const cover = rel.cover_url || rel.image_url || rel.coverUrl || '';
        if (!cover) return;
        seenIds.add(id);
        const bandTitle = b.band_name || b.name || 'Artist';
        loaded.push({
          id,
          name: `${bandTitle} — ${rel.title}`,
          price: Number(rel.price) || 22,
          category: 'media',
          subcategory: String(rel.format || '').toLowerCase().includes('cd') ? 'cds' : 'vinyl',
          description: rel.description || `${rel.type || 'Release'} (${rel.year || 'Catalog'}) by ${bandTitle}. Includes instant digital unlock.`,
          thumbnail: cover,
          images: [cover],
          sizes: ['Vinyl LP', 'CD Digipak', 'Cassette'],
          stock: 25,
          tracks: Array.isArray(rel.tracks) ? rel.tracks : undefined,
          pressingInfo: `${rel.year || 'Official'} Catalog Edition · Includes Digital Copy`,
          brand: bandTitle,
          artist: bandTitle,
          seller: bandTitle,
          band_id: b.id || '',
          is_real_account: true,
        });
      });
    });

    setInventoryCatalogItems(loaded);
  }, [bands]);

  // Initial hydration + Supabase fallback + storage event listeners
  useEffect(() => {
    loadLocalRealCatalog();

    fetchShopMerchItems()
      .then((rows) => {
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map((m) => {
          const rawCat = String(m.category || '').toLowerCase();
          const nameLower = String(m.name || '').toLowerCase();
          const isPhysical =
            rawCat.includes('vinyl') ||
            rawCat.includes('cd') ||
            rawCat.includes('cassette') ||
            rawCat.includes('media') ||
            nameLower.includes('vinyl') ||
            nameLower.includes(' lp') ||
            nameLower.includes('cassette');
          return {
            id: String(m.id),
            name: m.name,
            price: Number(m.price) || 0,
            category: isPhysical ? 'media' : 'apparel',
            subcategory: isPhysical
              ? rawCat.includes('cd')
                ? 'cds'
                : rawCat.includes('cassette')
                ? 'cassettes'
                : 'vinyl'
              : rawCat.includes('hoodie')
              ? 'hoodies'
              : rawCat.includes('longsleeve')
              ? 'longsleeve'
              : 't-shirts',
            rawCategory: m.category,
            condition: m.condition || 'New',
            description: m.description || '',
            sizes: Array.isArray(m.sizes) && m.sizes.length > 0 ? m.sizes : ['S', 'M', 'L', 'XL', '2XL'],
            thumbnail: m.thumbnail,
            images: Array.isArray(m.images) && m.images.length > 0 ? m.images : m.thumbnail ? [m.thumbnail] : [],
            stock: m.stock !== undefined ? Number(m.stock) : 25,
            isLimited: Boolean(m.is_timed || (m.stock !== undefined && Number(m.stock) <= 25)),
            is_timed: Boolean(m.is_timed),
            expires_at: m.expires_at,
            duration_hours: m.duration_hours,
            seller_id: m.seller_id,
            seller: m.seller_name || 'Nexus Merchant',
            brand: m.seller_name || 'Nexus Merchant',
            artist: m.seller_name || 'Nexus Merchant',
            allow_negotiation: m.allow_negotiation !== false,
            is_real_account: true,
            created_at: m.created_at,
          };
        });
        setSupabaseDropItems(mapped);
      })
      .catch(() => {});

    const onInvUpdate = () => {
      loadLocalRealCatalog();
      setStoreVersion((v) => v + 1);
    };
    const onWishlistUpdate = (e: any) => {
      setWishlistIds(Array.isArray(e?.detail) ? e.detail : getWishlistIds());
    };
    const onListingStatusUpdate = () => setStoreVersion((v) => v + 1);
    const onOffersUpdate = (e: any) => {
      setListingOffersMap(e?.detail || getListingOffersMap());
    };

    window.addEventListener('nexus_inventory_updated', onInvUpdate);
    window.addEventListener('nexus_shop_stock_updated', onInvUpdate);
    window.addEventListener('nexus_wishlist_updated', onWishlistUpdate);
    window.addEventListener('nexus_listing_status_updated', onListingStatusUpdate);
    window.addEventListener('nexus_listing_offers_updated', onOffersUpdate);
    return () => {
      window.removeEventListener('nexus_inventory_updated', onInvUpdate);
      window.removeEventListener('nexus_shop_stock_updated', onInvUpdate);
      window.removeEventListener('nexus_wishlist_updated', onWishlistUpdate);
      window.removeEventListener('nexus_listing_status_updated', onListingStatusUpdate);
      window.removeEventListener('nexus_listing_offers_updated', onOffersUpdate);
    };
  }, [loadLocalRealCatalog]);

  // 1-second tick for live drop countdowns when viewing shop
  useEffect(() => {
    if (activeTab !== 'shop') return;
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  // Extract feed-based merch_drop / gear / classifieds items
  const feedShopItems = useMemo(() => {
    const items: any[] = [];
    (feed || []).forEach((post: any) => {
      if (!post) return;
      if (post.type === 'merch_drop' && post.merchData) {
        items.push({
          id: post.merchData.dropId || `drop_${post.id}`,
          name: post.merchData.name || post.title || 'Merch Drop',
          price: Number(post.merchData.price) || 25,
          category: isPhysicalMediaItem(post.merchData) ? 'media' : 'apparel',
          subcategory: post.merchData.category || 't-shirts',
          description: post.merchData.description || post.content || post.message || 'Official merch drop from timeline.',
          thumbnail: post.merchData.thumbnail || post.image || '',
          images: post.merchData.images || (post.merchData.thumbnail ? [post.merchData.thumbnail] : []),
          sizes: post.merchData.sizes || ['S', 'M', 'L', 'XL'],
          stock: post.merchData.stock,
          is_timed: Boolean(post.merchData.isTimed || post.merchData.expiresAt),
          expires_at: post.merchData.expiresAt,
          brand: post.authorName || 'Artist Drop',
          artist: post.authorName || 'Artist Drop',
          seller: post.authorName || 'Artist Drop',
          seller_id: post.authorId,
          allow_negotiation: post.merchData.allowNegotiation !== false,
          is_real_account: true,
          created_at: post.timestamp || post.created_at,
        });
      } else if ((post.type === 'gear' || post.type === 'classifieds') && post.classifiedData) {
        items.push({
          id: post.classifiedData.listingId || `cf_${post.id}`,
          name: post.classifiedData.title || 'Community Listing',
          price: Number(post.classifiedData.price) || 0,
          category: post.type,
          subcategory: post.type,
          condition: post.classifiedData.condition || 'Good',
          brand: post.classifiedData.brand || '',
          year: post.classifiedData.year || '',
          location: post.classifiedData.location || post.location || 'Local',
          description: post.classifiedData.description || post.content || post.message || '',
          thumbnail: post.classifiedData.image || post.image || '',
          images: post.images || (post.classifiedData.image ? [post.classifiedData.image] : []),
          seller: post.classifiedData.seller || post.authorName || 'Community Member',
          poster: post.classifiedData.seller || post.authorName || 'Community Member',
          seller_id: post.authorId,
          tradesWelcome: Boolean(post.classifiedData.tradesWelcome),
          deliveryOption: post.classifiedData.deliveryOption || 'both',
          is_real_account: true,
          created_at: post.timestamp || post.created_at,
        });
      }
    });
    return items;
  }, [feed]);

  // Unified Deduplicated Storefront Items
  const effectiveShopItems = useMemo(() => {
    const base = shopItems && shopItems.length > 0 ? shopItems : mockShopItems;
    const seen = new Set<string>();
    const combined = [...supabaseDropItems, ...inventoryCatalogItems, ...feedShopItems, ...base];
    return combined.filter((item) => {
      if (!item) return false;
      const idKey = String(item.id || `${item.name}_${item.seller || ''}`);
      if (seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
  }, [shopItems, supabaseDropItems, inventoryCatalogItems, feedShopItems]);

  const realAccountItems = useMemo(
    () =>
      effectiveShopItems.filter(
        (item) =>
          item.is_real_account === true ||
          String(item.id || '').startsWith('real_') ||
          String(item.id || '').startsWith('inv_') ||
          String(item.id || '').startsWith('comm_')
      ),
    [effectiveShopItems]
  );

  const demoItems = useMemo(
    () =>
      effectiveShopItems.filter(
        (item) =>
          !item.is_real_account &&
          !String(item.id || '').startsWith('real_') &&
          !String(item.id || '').startsWith('inv_') &&
          !String(item.id || '').startsWith('comm_')
      ),
    [effectiveShopItems]
  );

  // Automatically show Live Catalog when real items exist, fallback to Demo Catalog when 0 real items exist (unless user clicked switcher)
  useEffect(() => {
    if (userToggledDemoRef.current) return;
    if (realAccountItems.length > 0) {
      setIsDemoMode(false);
    } else {
      setIsDemoMode(true);
    }
  }, [realAccountItems.length]);

  const activeStoreItems = isDemoMode ? demoItems : realAccountItems;

  // Quick Artist/Label chips derived from active merch & media catalog
  const availableStoreArtists = useMemo(() => {
    const counts = new Map<string, number>();
    activeStoreItems.forEach((item) => {
      if (item.category === 'gear' || item.category === 'classifieds') return;
      const name = String(item.artist || item.band || item.brand || item.seller || '').trim();
      if (!name || name.toLowerCase() === 'generic' || name.toLowerCase() === 'nexus merchant') return;
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [activeStoreItems]);

  // Merch + Media filtered + sorted items
  const filteredMerchItems = useMemo(() => {
    const q = (shopSearchQuery || '').trim().toLowerCase();
    const list = activeStoreItems.filter((item) => {
      if (item.hidden) return false;
      if (item.category !== 'apparel' && item.category !== 'media' && item.category !== 'label') return false;

      if (showWishlistOnly && !wishlistIds.includes(String(item.id))) return false;

      const sub = String(item.subcategory || '').toLowerCase();
      const cat = String(item.category || '').toLowerCase();
      const nameLower = String(item.name || '').toLowerCase();

      const matchesCategory =
        shopCategory === 'all' ||
        (shopCategory === 'limited'
          ? Boolean(item.isLimited || item.is_timed || (typeof item.stock === 'number' && item.stock <= 25) || cat === 'media')
          : shopCategory === 't-shirts'
          ? sub.includes('shirt') || sub.includes('tee') || nameLower.includes('tee')
          : shopCategory === 'longsleeve'
          ? sub.includes('longsleeve') || nameLower.includes('longsleeve')
          : shopCategory === 'hoodies'
          ? sub.includes('hoodie') || nameLower.includes('hoodie')
          : shopCategory === 'shorts'
          ? sub.includes('short') || nameLower.includes('short')
          : shopCategory === 'vinyl'
          ? sub.includes('vinyl') || nameLower.includes('lp') || nameLower.includes('vinyl')
          : shopCategory === 'cds'
          ? sub.includes('cd') || nameLower.includes('cd') || nameLower.includes('digipak')
          : shopCategory === 'cassettes'
          ? sub.includes('cassette') || sub.includes('tape') || nameLower.includes('cassette')
          : cat === shopCategory || sub === shopCategory);

      if (!matchesCategory) return false;

      if (sizeFilter !== 'all') {
        const sizesArr: string[] = Array.isArray(item.sizes) ? item.sizes.map((s: any) => String(s).toLowerCase()) : [];
        const hasSize =
          sizesArr.some((s) => s === sizeFilter.toLowerCase() || s.includes(sizeFilter.toLowerCase())) ||
          sub.includes(sizeFilter.toLowerCase());
        if (!hasSize) return false;
      }

      if (q) {
        const hay = `${item.name || ''} ${item.description || ''} ${item.brand || ''} ${item.artist || ''} ${item.seller || ''} ${sub}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (shopBrandFilter) {
        const bf = shopBrandFilter.toLowerCase().trim();
        const itemArtist = `${item.artist || ''} ${item.band || ''} ${item.brand || ''} ${item.seller || ''}`.toLowerCase();
        const itemBandId = String(item.band_id || item.bandId || '').toLowerCase();
        if (bf.includes('torture') || bf.includes('tdf') || bf.includes('picture company')) {
          return (
            item.category === 'label' ||
            nameLower.includes('tdf') ||
            nameLower.includes('torture') ||
            itemArtist.includes('torture')
          );
        }
        return (
          itemArtist.includes(bf) ||
          nameLower.includes(bf) ||
          (Boolean(itemBandId) && itemBandId.includes(bf))
        );
      }

      return true;
    });

    const sorted = [...list];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => Date.parse(b.created_at || '') - Date.parse(a.created_at || ''));
    } else if (sortBy === 'urgency') {
      sorted.sort((a, b) => {
        const sa = getItemAvailableStock(a).totalStock ?? 999;
        const sb = getItemAvailableStock(b).totalStock ?? 999;
        return sa - sb;
      });
    }
    return sorted;
  }, [activeStoreItems, shopCategory, shopSearchQuery, shopBrandFilter, sizeFilter, sortBy, showWishlistOnly, wishlistIds, storeVersion]);

  // Reset page when filters change
  useEffect(() => {
    setShopPage(1);
  }, [shopCategory, shopSearchQuery, shopBrandFilter, sizeFilter, sortBy, showWishlistOnly, isDemoMode]);

  // Community Marketplace filtered items
  const filteredCommunityItems = useMemo(() => {
    const q = (shopSearchQuery || '').trim().toLowerCase();
    const cityQ = communityCityFilter.trim().toLowerCase();
    return activeStoreItems.filter((item) => {
      if (item.category !== 'gear' && item.category !== 'classifieds') return false;
      if (communityCategory !== 'all' && item.category !== communityCategory) return false;
      if (showWishlistOnly && !wishlistIds.includes(String(item.id))) return false;
      if (q) {
        const hay = `${item.name || ''} ${item.description || ''} ${item.brand || ''} ${item.seller || item.poster || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (cityQ) {
        const loc = String(item.location || '').toLowerCase();
        if (!loc.includes(cityQ)) return false;
      }
      if (communityDeliveryFilter === 'local') {
        const d = item.deliveryOption || 'both';
        if (d !== 'local_meetup' && d !== 'both') return false;
      } else if (communityDeliveryFilter === 'shipping') {
        const d = item.deliveryOption || 'both';
        if (d !== 'escrow_shipping' && d !== 'both') return false;
      } else if (communityDeliveryFilter === 'trades') {
        if (!item.tradesWelcome && !String(item.description || '').toLowerCase().includes('trade')) return false;
      }
      return true;
    });
  }, [activeStoreItems, communityCategory, shopSearchQuery, communityCityFilter, communityDeliveryFilter, showWishlistOnly, wishlistIds, storeVersion]);

  const stopAudioPreview = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synthCtxRef.current) {
      synthCtxRef.current.close().catch(() => {});
      synthCtxRef.current = null;
    }
    if (synthTimerRef.current) {
      window.clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
    setPreviewTrackId(null);
    setPreviewSecondsLeft(30);
  }, []);

  useEffect(() => {
    if (!selectedShopItem) {
      stopAudioPreview();
      setIsImageZoomed(false);
      setShowMakeOfferPanel(false);
      setPdpImageIdx(0);
      setPdpQty(1);
    }
  }, [selectedShopItem, stopAudioPreview]);

  const handleToggleTrackPreview = (track: { id: string; title: string; audioUrl?: string }) => {
    if (previewTrackId === track.id) {
      stopAudioPreview();
      return;
    }
    stopAudioPreview();
    setPreviewTrackId(track.id);
    setPreviewSecondsLeft(30);

    if (track.audioUrl) {
      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } else if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        synthCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(55, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(gain);
        subOsc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        subOsc.start();
      } catch {
        // autoplay blocked
      }
    }

    synthTimerRef.current = window.setInterval(() => {
      setPreviewSecondsLeft((prev) => {
        if (prev <= 1) {
          stopAudioPreview();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const compressImageInSocialFeed = (fileOrBase64: any): Promise<string> => {
    if (typeof fileOrBase64 === 'string') return Promise.resolve(fileOrBase64);
    if (!fileOrBase64) return Promise.resolve('');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.readAsDataURL(fileOrBase64);
    });
  };

  const openProductModal = (item: any) => {
    setSelectedShopItem(item);
    setPdpImageIdx(0);
    setIsImageZoomed(false);
    setShowMakeOfferPanel(false);
    setOfferAmountInput(item.price ? String(Math.max(1, Math.round(Number(item.price) * 0.85))) : '');
    setOfferTradeInput('');
    setPdpQty(1);
    if (Array.isArray(item.sizes) && item.sizes.length > 0) {
      const firstAvailable = item.sizes.find((sz: string) => !getItemAvailableStock(item, sz).isVariantSoldOut);
      setSelectedSize(firstAvailable || item.sizes[0]);
    } else {
      setSelectedSize('');
    }
  };

  const isSellerVerified = (sellerName?: string, sellerId?: string): boolean => {
    const cleanName = String(sellerName || '').toLowerCase().trim();
    if (!cleanName && !sellerId) return false;
    const inProfiles = (allProfiles || []).some(
      (p: any) =>
        (sellerId && p.id === sellerId) ||
        (cleanName &&
          (String(p.full_name || '').toLowerCase() === cleanName ||
            String(p.console_handle || '').toLowerCase() === cleanName ||
            String(p.username || '').toLowerCase() === cleanName))
    );
    const inBands = (bands || []).some(
      (b: any) =>
        (sellerId && b.id === sellerId) ||
        (cleanName && String(b.band_name || b.name || '').toLowerCase() === cleanName)
    );
    return inProfiles || inBands;
  };

  const openChatWithUser = (recipientName: string, roleLabel: string, initialMsg: string) => {
    const matchedProf = (allProfiles || []).find(
      (p: any) =>
        (p.full_name && p.full_name.toLowerCase() === recipientName.toLowerCase()) ||
        (p.console_handle && p.console_handle.toLowerCase() === recipientName.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(recipientName.toLowerCase()))
    );
    const recipientId = matchedProf?.email
      ? matchedProf.email.toLowerCase().trim()
      : recipientName.toLowerCase().replace(/\s+/g, '_');

    const existingChat = (chats || []).find((c: any) => c.id === recipientId);
    if (!existingChat) {
      const newChat: ChatType = {
        id: recipientId,
        name: recipientName,
        avatar: matchedProf?.avatar_url || '',
        role: roleLabel,
        roleBadge: roleLabel.toUpperCase(),
        roleColor: 'text-purple-400 bg-purple-950/20 border-purple-900/40',
        online: true,
        unread: 0,
        messages: [
          {
            id: `msg_${Date.now()}_init`,
            sender: 'them',
            text: initialMsg,
            time: 'Just now',
          },
        ],
      };
      setChats((prev: any[]) => [newChat, ...prev]);
    }
    window.dispatchEvent(
      new CustomEvent('nexus_open_chat', {
        detail: { profile_id: recipientId, name: recipientName, username: recipientName, avatar_url: matchedProf?.avatar_url },
      })
    );
    window.dispatchEvent(
      new CustomEvent('nexus_open_chat_thread', {
        detail: { profile_id: recipientId, name: recipientName, username: recipientName, avatar_url: matchedProf?.avatar_url },
      })
    );
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingTitle.trim()) {
      triggerNotification?.('Please enter a title for your listing.');
      return;
    }

    const sellerName =
      userProfile?.full_name || userProfile?.console_handle || userProfile?.name || 'Verified Account';
    const primaryThumb =
      newListingPhotos[0] ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600';

    const newItem = {
      id: 'real_' + Date.now(),
      name: newListingTitle.trim(),
      price: newListingType === 'gear' ? Number(newListingPrice) || 0 : 0,
      category: newListingType,
      subcategory: newListingType,
      description: newListingDescription.trim() || 'Listing posted by verified member.',
      thumbnail: primaryThumb,
      fallbackThumbnail: primaryThumb,
      images: newListingPhotos.length > 0 ? newListingPhotos : [primaryThumb],
      condition: newListingCondition,
      year: newListingYear || '2026',
      brand: newListingBrand || 'Custom',
      seller: sellerName,
      poster: sellerName,
      seller_id: userProfile?.id || 'current_user',
      location: newListingLocation.trim() || 'Local',
      tradesWelcome: newListingTradesWelcome,
      deliveryOption: newListingDeliveryOption,
      is_real_account: true,
      created_at: new Date().toISOString(),
    };

    try {
      const sb = getSupabase?.();
      if (sb) {
        await sb.from('nexus_shop_items').insert([
          {
            id: newItem.id,
            name: newItem.name,
            price: newItem.price,
            category: newItem.category,
            description: newItem.description,
            fallback_thumbnail: newItem.thumbnail,
            condition: newItem.condition,
            brand_name: newItem.brand,
            seller: newItem.seller,
            is_real_account: true,
            created_at: newItem.created_at,
          },
        ]);
      }
    } catch (err) {
      console.warn('Could not insert shop item into Supabase:', err);
    }

    if (setShopItems) {
      setShopItems((prev) => [newItem, ...prev]);
    }

    const isGearListing = newListingType === 'gear';
    const feedPostUuid =
      typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cf_${Date.now()}`;

    const classifiedFeedPost: any = {
      id: feedPostUuid,
      type: newListingType,
      category: newListingType,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      timeAgo: 'Just now',
      authorId: userProfile?.id || 'current_user',
      authorName: sellerName,
      authorAvatar: userProfile?.avatar || userProfile?.avatar_url || '',
      authorRole:
        portalRole === 'band'
          ? 'Band / Artist'
          : portalRole === 'label'
          ? 'Record Label'
          : portalRole === 'promoter'
          ? 'Promoter'
          : 'Community Member',
      location: newItem.location || 'Local Community',
      message: newItem.description,
      content: newItem.description,
      image: newItem.thumbnail,
      image_url: newItem.thumbnail,
      images: newItem.images,
      tag: isGearListing ? 'GEAR SWAP' : 'CLASSIFIED',
      classifiedData: {
        listingId: newItem.id,
        listingType: newListingType,
        title: newItem.name,
        price: newItem.price,
        condition: newItem.condition,
        brand: newItem.brand,
        year: newItem.year,
        location: newItem.location,
        description: newItem.description,
        image: newItem.thumbnail,
        seller: sellerName,
        tradesWelcome: newListingTradesWelcome,
        deliveryOption: newListingDeliveryOption,
      },
      reactions: { flame: 0, horns: 0 },
      comments: [],
    };

    try {
      await syncPostToSupabase(classifiedFeedPost, userProfile?.id);
    } catch {
      // ignore offline sync issue
    }

    if (props.onAddFeedPost) {
      props.onAddFeedPost(classifiedFeedPost);
    } else {
      props.setFeed?.((prev: any[]) => [classifiedFeedPost, ...prev]);
      props.setLabelPosts?.((prev: any[]) => [classifiedFeedPost, ...prev]);
    }

    triggerNotification?.('Listing published to Live Marketplace & Community Feed.');
    setIsPostListingOpen(false);
    userToggledDemoRef.current = true;
    setIsDemoMode(false);

    setNewListingTitle('');
    setNewListingPrice('');
    setNewListingDescription('');
    setNewListingPhotos([]);
    setNewListingBrand('');
    setNewListingYear('');
    setNewListingLocation('');
    setNewListingTradesWelcome(false);
    setNewListingDeliveryOption('both');
  };

  if (activeTab !== 'shop') return null;

  const itemsPerPage = 16;
  const totalPages = Math.max(1, Math.ceil(filteredMerchItems.length / itemsPerPage));
  const paginatedMerch = filteredMerchItems.slice((shopPage - 1) * itemsPerPage, shopPage * itemsPerPage);

  // Selected modal computations
  const modalGalleryImages = selectedShopItem
    ? Array.from(
        new Set(
          [
            selectedShopItem.thumbnail,
            selectedShopItem.image,
            ...(Array.isArray(selectedShopItem.images) ? selectedShopItem.images : []),
          ].filter((u) => typeof u === 'string' && u.trim().length > 0)
        )
      )
    : [];
  const activeModalImage =
    modalGalleryImages[pdpImageIdx] ||
    (selectedShopItem ? getShopCategoryFallback(selectedShopItem) : '');

  const modalStockInfo = selectedShopItem
    ? getItemAvailableStock(selectedShopItem, selectedSize || undefined)
    : { isUnlimited: true, totalStock: null, variantStock: null, isSoldOut: false, isVariantSoldOut: false };

  const modalUpcomingShows = selectedShopItem
    ? findUpcomingShowsForBand(
        selectedShopItem.artist || selectedShopItem.band || selectedShopItem.brand || selectedShopItem.seller,
        liveEvents
      )
    : [];

  const modalIsMedia = selectedShopItem ? isPhysicalMediaItem(selectedShopItem) : false;
  const modalTracks = selectedShopItem && modalIsMedia ? resolveItemTracks(selectedShopItem, inAppSongsList, bands) : [];
  const modalListingStatus = selectedShopItem ? getListingStatus(selectedShopItem.id) : 'available';
  const modalOffers = selectedShopItem ? listingOffersMap[String(selectedShopItem.id)] || [] : [];
  const currentUserHandle = String(
    userProfile?.full_name || userProfile?.console_handle || userProfile?.name || userProfile?.username || ''
  )
    .toLowerCase()
    .trim();
  const isModalOwner = Boolean(
    selectedShopItem &&
      ((userProfile?.id && selectedShopItem.seller_id === userProfile.id) ||
        (currentUserHandle &&
          (String(selectedShopItem.seller || '').toLowerCase().trim() === currentUserHandle ||
            String(selectedShopItem.poster || '').toLowerCase().trim() === currentUserHandle)))
  );

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Clean High-Contrast Storefront Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 mb-6 border-b border-zinc-900">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-500">
              Direct Artist Storefront & Gear Exchange
            </p>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-rose-500" />
              <span>NEXUS SHOP</span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Free shipping per artist at ${FREE_SHIPPING_THRESHOLD_PER_BAND}+ or $0 Merch Booth Pickup on tour dates.
            </p>
          </div>

          {/* Live / Demo Catalog Switcher + Saved Items Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  userToggledDemoRef.current = true;
                  setIsDemoMode(false);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer font-mono tabular-nums ${
                  !isDemoMode ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Live Catalog ({realAccountItems.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  userToggledDemoRef.current = true;
                  setIsDemoMode(true);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer font-mono tabular-nums ${
                  isDemoMode ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Demo Showcase ({demoItems.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowWishlistOnly((prev) => !prev)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer font-mono tabular-nums ${
                showWishlistOnly
                  ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${showWishlistOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>Saved ({wishlistIds.length})</span>
            </button>
          </div>
        </div>

        {/* Brand Storefront Banner when filtered to a specific artist/label */}
        {shopBrandFilter && (
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-rose-400">
                Dedicated Storefront Filter
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                {shopBrandFilter}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Curated official merch, physical vinyl/CD releases, and direct pre-orders.
              </p>
            </div>
            {portalRole !== 'label' && (
              <button
                type="button"
                onClick={() => setShopBrandFilter(null)}
                className="self-start sm:self-auto px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Show All Artists
              </button>
            )}
          </div>
        )}

        {/* Empty State for Live Mode when 0 items */}
        {!isDemoMode && realAccountItems.length === 0 ? (
          <div className="text-center py-16 px-6 bg-zinc-950 border border-zinc-900 rounded-2xl my-6 max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-rose-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">No Live Listings Yet</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Publish items from Merch Inventory, drop releases from your Catalog Manager, post a Merch Drop, or switch to the Demo Showcase to browse sample items.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  userToggledDemoRef.current = true;
                  setIsDemoMode(true);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Explore Demo Showcase
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPostListingOpen(true);
                  setNewListingType('gear');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Post Gear / Listing
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Unified Search, Sort, & Size Toolbar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-4">
              <div className="md:col-span-6 relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={shopSearchQuery}
                  onChange={(e) => setShopSearchQuery(e.target.value)}
                  placeholder="Search shirts, vinyl pressings, bands, or gear..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500/70 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
                />
                {shopSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setShopSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="md:col-span-3 flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3">
                <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-transparent py-2.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  aria-label="Sort products"
                >
                  <option value="featured" className="bg-zinc-950">Sort: Featured</option>
                  <option value="newest" className="bg-zinc-950">Sort: Newest</option>
                  <option value="price_asc" className="bg-zinc-950">Price: Low to High</option>
                  <option value="price_desc" className="bg-zinc-950">Price: High to Low</option>
                  <option value="urgency" className="bg-zinc-950">Low Stock First</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  aria-label="Filter by size or format"
                >
                  <option value="all" className="bg-zinc-950">All Sizes / Formats</option>
                  <option value="S" className="bg-zinc-950">Size S</option>
                  <option value="M" className="bg-zinc-950">Size M</option>
                  <option value="L" className="bg-zinc-950">Size L</option>
                  <option value="XL" className="bg-zinc-950">Size XL</option>
                  <option value="2XL" className="bg-zinc-950">Size 2XL</option>
                  <option value="Vinyl" className="bg-zinc-950">Vinyl LP</option>
                  <option value="CD" className="bg-zinc-950">CD Digipak</option>
                  <option value="Cassette" className="bg-zinc-950">Cassette</option>
                </select>
              </div>
            </div>

            {/* Category Filter Bar */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1.5 no-scrollbar">
              {[
                { id: 'all', label: 'All Merch' },
                { id: 'limited', label: 'Limited Drops' },
                { id: 'label', label: 'Label Gear' },
                { id: 't-shirts', label: 'T-Shirts' },
                { id: 'longsleeve', label: 'Longsleeves' },
                { id: 'hoodies', label: 'Hoodies' },
                { id: 'shorts', label: 'Shorts' },
                { id: 'vinyl', label: 'Vinyl' },
                { id: 'cds', label: 'CDs' },
                { id: 'cassettes', label: 'Cassettes' },
              ].map((cat) => (
                <button
                  type="button"
                  key={`shop-cat-${cat.id}`}
                  onClick={() => setShopCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                    shopCategory === cat.id
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Artist / Brand Filter Strip */}
            {availableStoreArtists.length > 0 && (
              <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1.5 no-scrollbar">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 shrink-0 mr-1">
                  Artists:
                </span>
                <button
                  type="button"
                  onClick={() => setShopBrandFilter(null)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border shrink-0 cursor-pointer transition-colors ${
                    !shopBrandFilter
                      ? 'bg-zinc-800 text-white border-zinc-700'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
                  }`}
                >
                  All
                </button>
                {availableStoreArtists.map((artistName) => (
                  <button
                    type="button"
                    key={`artist-filter-${artistName}`}
                    onClick={() =>
                      setShopBrandFilter(
                        shopBrandFilter?.toLowerCase() === artistName.toLowerCase() ? null : artistName
                      )
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border shrink-0 cursor-pointer transition-colors ${
                      shopBrandFilter?.toLowerCase() === artistName.toLowerCase()
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-white'
                    }`}
                  >
                    {artistName}
                  </button>
                ))}
              </div>
            )}

            {/* Section 1: Merch & Physical Media Grid */}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                Merchandise & Physical Releases ({filteredMerchItems.length})
              </h2>
              {(shopCategory !== 'all' || sizeFilter !== 'all' || shopSearchQuery || showWishlistOnly || shopBrandFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setShopCategory('all');
                    setSizeFilter('all');
                    setShopSearchQuery('');
                    setShowWishlistOnly(false);
                    setShopBrandFilter(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {paginatedMerch.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 items-stretch">
                {paginatedMerch.map((item, itmIdx) => {
                  const idStr = String(item.id || itmIdx);
                  const stockInfo = getItemAvailableStock(item);
                  const isSaved = wishlistIds.includes(idStr);
                  const countdown = item.is_timed
                    ? formatCountdownRemaining(item.expires_at, item.created_at, item.duration_hours)
                    : null;
                  const artistLabel = item.artist || item.band || item.brand || item.seller || 'Nexus';
                  const categoryLabel = item.subcategory || item.category || 'Merch';
                  const hasFailed = Boolean(brokenImageIds[idStr]);
                  const imgSrc = item.thumbnail || item.image || getShopCategoryFallback(item);

                  return (
                    <div
                      key={`shop-card-${idStr}-${itmIdx}`}
                      onClick={() => openProductModal(item)}
                      className="bg-[#0c0d11] border border-zinc-900 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors flex flex-col h-full cursor-pointer group"
                    >
                      {/* Clean Image-First Square Frame */}
                      <div className="relative aspect-square bg-zinc-950 overflow-hidden flex items-center justify-center">
                        {!hasFailed && imgSrc ? (
                          <img
                            src={imgSrc}
                            onError={() => setBrokenImageIds((prev) => ({ ...prev, [idStr]: true }))}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105 ${
                              stockInfo.isSoldOut ? 'opacity-40 grayscale' : ''
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-600">
                            <ShoppingBag className="w-8 h-8 mb-1.5" />
                            <span className="text-[10px] font-mono uppercase">{categoryLabel}</span>
                          </div>
                        )}

                        {/* Wishlist Heart Button */}
                        <button
                          type="button"
                          aria-label={isSaved ? 'Remove from saved' : 'Save item'}
                          onClick={(e) => {
                            e.stopPropagation();
                            const res = toggleWishlistItem(idStr);
                            setWishlistIds(res.ids);
                            triggerNotification?.(res.added ? `Saved "${item.name}"` : `Removed from Saved`);
                          }}
                          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg bg-black/75 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-rose-400 transition-colors cursor-pointer z-10"
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>

                        {stockInfo.isSoldOut && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/45 pointer-events-none">
                            <span className="px-3 py-1 bg-zinc-950 border border-zinc-700 text-xs font-mono font-bold uppercase tracking-wider text-zinc-200 rounded">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Unboxed Scannable Card Copy */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-2 border-t border-zinc-900/80">
                        <div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            <span className="capitalize">{categoryLabel}</span>
                            <span className="mx-1.5">·</span>
                            <span>{artistLabel}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white mt-1 leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors">
                            {item.name}
                          </h3>
                        </div>

                        <div className="flex items-baseline justify-between gap-2 pt-1 font-mono tabular-nums">
                          <span className="text-sm font-black text-white">${Number(item.price || 0).toFixed(2)}</span>
                          <span className="text-[11px] truncate">
                            {countdown ? (
                              <span className="text-amber-400">{countdown}</span>
                            ) : item.isPreOrder ? (
                              <span className="text-sky-400">Pre-Order</span>
                            ) : !stockInfo.isUnlimited && stockInfo.totalStock !== null && stockInfo.totalStock <= 5 && stockInfo.totalStock > 0 ? (
                              <span className="text-rose-400">Only {stockInfo.totalStock} left</span>
                            ) : isPhysicalMediaItem(item) ? (
                              <span className="text-zinc-500">+ Digital</span>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-zinc-950/60 border border-zinc-900 rounded-2xl mb-10">
                <p className="text-sm text-zinc-400">No official merch items match your active filters.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mb-10 bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono tabular-nums">
                <button
                  type="button"
                  disabled={shopPage === 1}
                  onClick={() => setShopPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-35 border border-zinc-800 text-xs font-bold text-zinc-200 rounded-lg cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-xs text-zinc-400">
                  Page <strong className="text-white">{shopPage}</strong> of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={shopPage === totalPages}
                  onClick={() => setShopPage((prev) => Math.min(prev + 1, totalPages))}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-35 border border-zinc-800 text-xs font-bold text-zinc-200 rounded-lg cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}

            {/* Section 2: Community Gear Swap & Classifieds */}
            {!shopBrandFilter && (
              <div className="border-t border-zinc-900 pt-8 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Community Gear Swap & Classifieds
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Escrow-protected gear sales, local meetups, trades, and band member searches.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPostListingOpen(true);
                      setNewListingType('gear');
                    }}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Post Listing
                  </button>
                </div>

                {/* Community Marketplace Filter Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 mb-5">
                  <div className="md:col-span-5 flex gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                      { id: 'all', label: 'All Listings' },
                      { id: 'gear', label: 'Gear Swap' },
                      { id: 'classifieds', label: 'Classifieds' },
                    ].map((cat) => (
                      <button
                        type="button"
                        key={`comm-cat-${cat.id}`}
                        onClick={() => setCommunityCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors shrink-0 cursor-pointer ${
                          communityCategory === cat.id
                            ? 'bg-purple-600 text-white border-purple-500'
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="md:col-span-4 relative">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={communityCityFilter}
                      onChange={(e) => setCommunityCityFilter(e.target.value)}
                      placeholder="Filter by city / region..."
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={communityDeliveryFilter}
                      onChange={(e) => setCommunityDeliveryFilter(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none cursor-pointer"
                    >
                      <option value="all" className="bg-zinc-950">All Delivery Types</option>
                      <option value="local" className="bg-zinc-950">Local Pickup</option>
                      <option value="shipping" className="bg-zinc-950">Insured Escrow Shipping</option>
                      <option value="trades" className="bg-zinc-950">Trades Welcome</option>
                    </select>
                  </div>
                </div>

                {/* Community Grid */}
                {filteredCommunityItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                    {filteredCommunityItems.map((item, itmIdx) => {
                      const idStr = String(item.id || itmIdx);
                      const status = getListingStatus(idStr);
                      const sellerLabel = item.seller || item.poster || 'Community Member';
                      const verified = isSellerVerified(sellerLabel, item.seller_id);
                      const hasFailed = Boolean(brokenImageIds[`comm_${idStr}`]);
                      const imgSrc = item.thumbnail || getShopCategoryFallback(item);
                      const offersCount = (listingOffersMap[idStr] || []).length;

                      return (
                        <div
                          key={`comm-item-${idStr}-${itmIdx}`}
                          onClick={() => openProductModal(item)}
                          className="bg-[#0c0d11] border border-zinc-900 hover:border-purple-500/50 rounded-xl p-4 flex gap-4 transition-colors cursor-pointer group"
                        >
                          <div className="w-24 h-24 bg-zinc-950 rounded-lg overflow-hidden shrink-0 border border-zinc-800/80 flex items-center justify-center relative">
                            {!hasFailed && imgSrc ? (
                              <img
                                src={imgSrc}
                                onError={() => setBrokenImageIds((prev) => ({ ...prev, [`comm_${idStr}`]: true }))}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain p-1.5"
                              />
                            ) : (
                              <Tag className="w-6 h-6 text-zinc-600" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-2 text-[11px]">
                                <span className="text-zinc-400 truncate">
                                  {item.category === 'gear' ? 'Gear Swap' : 'Classified'}
                                  {item.condition ? ` · ${item.condition}` : ''}
                                  {item.tradesWelcome ? ' · Trades Open' : ''}
                                </span>
                                {status !== 'available' && (
                                  <span
                                    className={`font-mono uppercase font-bold ${
                                      status === 'sold' ? 'text-red-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {status}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm font-bold text-white mt-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                                {item.name}
                              </h3>

                              <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-zinc-900 text-xs">
                              <div className="flex items-center gap-1.5 text-zinc-400 min-w-0 truncate">
                                <span className="truncate">{sellerLabel}</span>
                                {verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                                <span className="text-zinc-600">·</span>
                                <span className="truncate text-zinc-500">{item.location || 'Local'}</span>
                              </div>
                              <div className="font-mono font-bold tabular-nums shrink-0 flex items-center gap-2">
                                {offersCount > 0 && (
                                  <span className="text-[11px] text-purple-400">{offersCount} offer{offersCount > 1 ? 's' : ''}</span>
                                )}
                                {item.price > 0 && (
                                  <span className="text-purple-300">${Number(item.price).toFixed(0)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-zinc-950/60 border border-zinc-900 rounded-2xl">
                    <p className="text-xs text-zinc-500">No community marketplace listings match the active filters.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* UPGRADED PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {selectedShopItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#0c0d11] border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]"
            >
              <button
                type="button"
                onClick={() => setSelectedShopItem(null)}
                className="absolute top-4 right-4 z-20 w-9 h-9 bg-black/75 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-full border border-zinc-800 flex items-center justify-center cursor-pointer"
                aria-label="Close product modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2">
                {/* Multi-Image Gallery + Zoom Panel */}
                <div className="bg-zinc-950 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-zinc-900">
                  <div className="relative aspect-square rounded-xl bg-black/60 border border-zinc-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={activeModalImage}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getShopCategoryFallback(selectedShopItem);
                      }}
                      alt={selectedShopItem.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-contain transition-transform duration-300 p-3 ${
                        isImageZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
                      }`}
                      onClick={() => setIsImageZoomed((prev) => !prev)}
                    />

                    <button
                      type="button"
                      onClick={() => setIsImageZoomed((prev) => !prev)}
                      className="absolute bottom-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/80 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      {isImageZoomed ? <ZoomOut className="w-3.5 h-3.5" /> : <ZoomIn className="w-3.5 h-3.5" />}
                      <span>{isImageZoomed ? 'Reset' : 'Zoom'}</span>
                    </button>

                    {modalGalleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPdpImageIdx((prev) => (prev - 1 + modalGalleryImages.length) % modalGalleryImages.length)
                          }
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/75 border border-zinc-800 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPdpImageIdx((prev) => (prev + 1) % modalGalleryImages.length)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/75 border border-zinc-800 text-white flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Gallery Thumbnails */}
                  {modalGalleryImages.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {modalGalleryImages.map((imgUrl, idx) => (
                        <button
                          key={`thumb-${idx}`}
                          type="button"
                          onClick={() => setPdpImageIdx(idx)}
                          className={`w-14 h-14 rounded-lg overflow-hidden border shrink-0 bg-black cursor-pointer ${
                            pdpImageIdx === idx ? 'border-rose-500' : 'border-zinc-800 opacity-65 hover:opacity-100'
                          }`}
                        >
                          <img src={imgUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details, Audio Preview, Variants, & Checkout Panel */}
                <div className="p-5 sm:p-6 flex flex-col justify-between gap-5">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                        <span className="capitalize">
                          {selectedShopItem.subcategory || selectedShopItem.category} ·{' '}
                          {selectedShopItem.artist || selectedShopItem.band || selectedShopItem.seller || selectedShopItem.brand || 'Official'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const res = toggleWishlistItem(String(selectedShopItem.id));
                            setWishlistIds(res.ids);
                          }}
                          className="text-xs text-zinc-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              wishlistIds.includes(String(selectedShopItem.id)) ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span>{wishlistIds.includes(String(selectedShopItem.id)) ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>

                      <h3 className="text-xl font-black text-white mt-1.5 leading-snug">{selectedShopItem.name}</h3>

                      <div className="flex items-center gap-3 mt-2 font-mono tabular-nums">
                        <span className="text-2xl font-black text-rose-400">
                          ${Number(selectedShopItem.price || 0).toFixed(2)}
                        </span>
                        {!modalStockInfo.isUnlimited && modalStockInfo.variantStock !== null && (
                          <span className={`text-xs ${modalStockInfo.variantStock === 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                            {modalStockInfo.variantStock === 0
                              ? 'Sold out in selected variant'
                              : `${modalStockInfo.variantStock} remaining`}
                          </span>
                        )}
                      </div>

                      {/* Timed Drop Countdown / Pre-Order / Show Pickup Note */}
                      {selectedShopItem.is_timed && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs font-mono text-amber-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {formatCountdownRemaining(
                              selectedShopItem.expires_at,
                              selectedShopItem.created_at,
                              selectedShopItem.duration_hours
                            ) || 'Limited Timed Drop'}
                          </span>
                        </div>
                      )}
                      {selectedShopItem.pressingInfo && (
                        <div className="mt-2 text-xs text-sky-300 font-mono">{selectedShopItem.pressingInfo}</div>
                      )}
                      {modalUpcomingShows.length > 0 && selectedShopItem.category !== 'classifieds' && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>
                            Free $0 Merch Booth Pickup available at {modalUpcomingShows[0].venue} ({modalUpcomingShows[0].date})
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed">{selectedShopItem.description}</p>

                    {/* 30-Second Audio Track Preview Player for Physical Media */}
                    {modalIsMedia && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-rose-400" /> Track Previews (30s)
                          </span>
                          <span className="text-[11px] font-mono text-emerald-400">+ Digital Album Unlocked</span>
                        </div>
                        {modalTracks.length > 0 ? (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                            {modalTracks.slice(0, 5).map((trk) => {
                              const isPlaying = previewTrackId === trk.id;
                              return (
                                <button
                                  type="button"
                                  key={trk.id}
                                  onClick={() => handleToggleTrackPreview(trk)}
                                  className={`w-full px-2.5 py-2 rounded-lg border text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                                    isPlaying
                                      ? 'bg-rose-950/35 border-rose-500/50 text-white'
                                      : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isPlaying ? (
                                      <Pause className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    )}
                                    <span className="truncate font-medium">
                                      {trk.num}. {trk.title}
                                    </span>
                                  </div>
                                  <span className="font-mono tabular-nums text-[11px] text-zinc-400 shrink-0">
                                    {isPlaying ? `${previewSecondsLeft}s` : trk.duration}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleTrackPreview({ id: `sample_${selectedShopItem.id}`, title: selectedShopItem.name })
                            }
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 flex items-center justify-between cursor-pointer hover:border-zinc-700"
                          >
                            <span className="flex items-center gap-2">
                              {previewTrackId === `sample_${selectedShopItem.id}` ? (
                                <Pause className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-zinc-400" />
                              )}
                              <span>Preview 30s Audio Snippet</span>
                            </span>
                            <span className="font-mono text-[11px] text-zinc-400">
                              {previewTrackId === `sample_${selectedShopItem.id}` ? `${previewSecondsLeft}s` : '0:30'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Size / Format Selector with live variant stock check */}
                    {Array.isArray(selectedShopItem.sizes) && selectedShopItem.sizes.length > 0 && (
                      <div>
                        <span className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
                          Select Size / Variant
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedShopItem.sizes.map((size: string) => {
                            const vStock = getItemAvailableStock(selectedShopItem, size);
                            return (
                              <button
                                type="button"
                                key={`pdp-size-${size}`}
                                disabled={vStock.isVariantSoldOut}
                                onClick={() => setSelectedSize(size)}
                                className={`px-3.5 py-2 text-xs font-mono font-bold rounded-lg border transition-colors cursor-pointer disabled:opacity-35 disabled:line-through disabled:cursor-not-allowed ${
                                  selectedSize === size
                                    ? 'bg-rose-600 border-rose-500 text-white'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quantity Stepper for Merch */}
                    {selectedShopItem.category !== 'classifieds' && selectedShopItem.category !== 'gear' && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase text-zinc-400">Quantity</span>
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => setPdpQty((q) => Math.max(1, q - 1))}
                            className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 text-center text-xs font-mono font-bold text-white tabular-nums">
                            {pdpQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const cap = modalStockInfo.isUnlimited
                                ? 8
                                : Math.max(1, modalStockInfo.variantStock ?? modalStockInfo.totalStock ?? 8);
                              setPdpQty((q) => Math.min(cap, q + 1));
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-300 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Gear / Classifieds Trust Details + Seller Status Controls */}
                    {(selectedShopItem.category === 'gear' || selectedShopItem.category === 'classifieds') && (
                      <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          {selectedShopItem.condition && (
                            <div>
                              <span className="text-[10px] font-mono uppercase text-zinc-500 block">Condition</span>
                              <span className="text-zinc-200 font-medium">{selectedShopItem.condition}</span>
                            </div>
                          )}
                          {selectedShopItem.location && (
                            <div>
                              <span className="text-[10px] font-mono uppercase text-zinc-500 block">Location</span>
                              <span className="text-zinc-200 font-medium">{selectedShopItem.location}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Seller / Poster</span>
                            <span className="text-zinc-200 font-medium inline-flex items-center gap-1">
                              {selectedShopItem.seller || selectedShopItem.poster || 'Member'}
                              {isSellerVerified(selectedShopItem.seller || selectedShopItem.poster, selectedShopItem.seller_id) && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase text-zinc-500 block">Delivery & Trades</span>
                            <span className="text-zinc-200 font-medium">
                              {selectedShopItem.deliveryOption === 'local_meetup'
                                ? 'Local Pickup'
                                : selectedShopItem.deliveryOption === 'escrow_shipping'
                                ? 'Escrow Shipping'
                                : 'Pickup or Escrow Ship'}
                              {selectedShopItem.tradesWelcome ? ' · Trades OK' : ''}
                            </span>
                          </div>
                        </div>

                        {isModalOwner && (
                          <div className="pt-2.5 border-t border-zinc-800 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-zinc-400">Listing Status:</span>
                            <div className="flex gap-1">
                              {(['available', 'pending', 'sold'] as const).map((st) => (
                                <button
                                  type="button"
                                  key={st}
                                  onClick={async () => {
                                    await setListingStatus(String(selectedShopItem.id), st);
                                    setStoreVersion((v) => v + 1);
                                    triggerNotification?.(`Listing marked as ${st.toUpperCase()}`);
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold cursor-pointer border ${
                                    modalListingStatus === st
                                      ? 'bg-purple-600 border-purple-500 text-white'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inline Offer / Trade Negotiation Panel */}
                    {showMakeOfferPanel && (
                      <div className="p-3.5 rounded-xl bg-zinc-950 border border-purple-500/40 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Submit Offer / Trade Proposal</span>
                          <button
                            type="button"
                            onClick={() => setShowMakeOfferPanel(false)}
                            className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Offer Price ($)</label>
                            <input
                              type="number"
                              min="1"
                              value={offerAmountInput}
                              onChange={(e) => setOfferAmountInput(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Fulfillment</label>
                            <select
                              value={offerFulfillmentPref}
                              onChange={(e) => setOfferFulfillmentPref(e.target.value as any)}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="escrow_shipping">Escrow Shipping</option>
                              <option value="local_meetup">Local Meetup</option>
                            </select>
                          </div>
                        </div>
                        {selectedShopItem.category === 'gear' && (
                          <input
                            type="text"
                            value={offerTradeInput}
                            onChange={(e) => setOfferTradeInput(e.target.value)}
                            placeholder="Optional trade gear or meetup note..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const amt = Math.max(1, Number(offerAmountInput) || Number(selectedShopItem.price) || 1);
                            if (selectedShopItem.category === 'gear') {
                              const buyer =
                                userProfile?.full_name || userProfile?.console_handle || userProfile?.name || 'Member';
                              const seller = selectedShopItem.seller || 'Seller';
                              submitListingOffer({
                                itemId: String(selectedShopItem.id),
                                itemName: selectedShopItem.name,
                                sellerName: seller,
                                buyerName: buyer,
                                amount: amt,
                                tradeNote: offerTradeInput,
                                fulfillmentPreference: offerFulfillmentPref,
                              });
                              setListingOffersMap(getListingOffersMap());
                              triggerNotification?.(`Submitted $${amt} formal offer to ${seller}.`);
                              openChatWithUser(
                                seller,
                                'Gear Seller',
                                `Formal Offer: $${amt} for "${selectedShopItem.name}" (${
                                  offerFulfillmentPref === 'local_meetup' ? 'Local Pickup' : 'Escrow Shipping'
                                })${offerTradeInput ? ` — Note: ${offerTradeInput}` : ''}`
                              );
                              setSelectedShopItem(null);
                            } else {
                              const negotiatedItem = {
                                ...selectedShopItem,
                                size: selectedSize || selectedShopItem.sizes?.[0] || 'L',
                                price: amt,
                                isNegotiated: true,
                                bandName: selectedShopItem.artist || selectedShopItem.brand || selectedShopItem.seller || 'Artist',
                              };
                              setSelectedShopItem(null);
                              openCheckout('merch', negotiatedItem);
                            }
                          }}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          {selectedShopItem.category === 'gear'
                            ? 'Send Formal Offer & Open Seller DM'
                            : `Proceed at Offer Price ($${Number(offerAmountInput || selectedShopItem.price || 0).toFixed(2)})`}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Primary Action Footer */}
                  <div className="pt-4 border-t border-zinc-900 space-y-2">
                    {selectedShopItem.category === 'classifieds' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const posterName = selectedShopItem.poster || selectedShopItem.seller || 'Community Member';
                          openChatWithUser(
                            posterName,
                            'Community Member',
                            `Hey! Reaching out regarding your listing "${selectedShopItem.name}".`
                          );
                          setSelectedShopItem(null);
                        }}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4" /> Contact Poster
                      </button>
                    ) : selectedShopItem.category === 'gear' ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={modalListingStatus === 'sold'}
                          onClick={() => {
                            const itemToCheckout = {
                              ...selectedShopItem,
                              price: selectedShopItem.price || 0,
                              bandName: selectedShopItem.seller || 'Gear Seller',
                              is_real_account: selectedShopItem.is_real_account,
                            };
                            setSelectedShopItem(null);
                            openCheckout('merch', itemToCheckout);
                          }}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 fill-white" />{' '}
                          {modalListingStatus === 'sold' ? 'Sold Out' : 'Buy with Stripe Escrow'}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMakeOfferPanel((prev) => !prev)}
                            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Repeat className="w-3.5 h-3.5" /> Make Offer
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const sellerName = selectedShopItem.seller || 'Seller';
                              openChatWithUser(
                                sellerName,
                                'Gear Seller',
                                `Hi! Is "${selectedShopItem.name}" still available?`
                              );
                              setSelectedShopItem(null);
                            }}
                            className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Message Seller
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled={modalStockInfo.isVariantSoldOut}
                          onClick={() => {
                            const chosenSize = selectedSize || selectedShopItem.sizes?.[0] || 'L';
                            const itemToCheckout = {
                              ...selectedShopItem,
                              size: chosenSize,
                              quantity: pdpQty,
                              sizes: selectedShopItem.sizes || [chosenSize],
                              bandName: selectedShopItem.artist || selectedShopItem.brand || selectedShopItem.seller || 'Artist / Label',
                            };
                            setSelectedShopItem(null);
                            openCheckout('merch', itemToCheckout);
                          }}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Zap className="w-4 h-4 fill-white" />{' '}
                          {modalStockInfo.isVariantSoldOut ? 'Sold Out' : '1-Tap Checkout'}
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={modalStockInfo.isVariantSoldOut}
                            onClick={() => {
                              const itemCopy = { ...selectedShopItem };
                              setSelectedShopItem(null);
                              addToCart(itemCopy, selectedSize || undefined, pdpQty);
                              setSelectedSize('');
                            }}
                            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 border border-zinc-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ShoppingCart className="w-4 h-4" /> Add to Cart
                          </button>
                          {selectedShopItem.allow_negotiation !== false && (
                            <button
                              type="button"
                              onClick={() => setShowMakeOfferPanel((prev) => !prev)}
                              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-bold rounded-xl cursor-pointer"
                            >
                              Make Offer
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE MARKETPLACE LISTING MODAL (MULTI-PHOTO + TRADES + DELIVERY) */}
      <AnimatePresence>
        {isPostListingOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#0c0d11] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button
                type="button"
                onClick={() => setIsPostListingOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/70 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-full border border-zinc-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-5 border-b border-zinc-900 bg-zinc-950/60">
                <h3 className="text-base font-black text-white uppercase tracking-wider">Create Marketplace Listing</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Publish gear swap items or community classifieds to the shop and timeline feed.
                </p>
              </div>

              <form onSubmit={handleCreateListing} className="p-5 space-y-4 overflow-y-auto flex-1 text-left">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Listing Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewListingType('gear')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase cursor-pointer ${
                        newListingType === 'gear'
                          ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Gear Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewListingType('classifieds')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase cursor-pointer ${
                        newListingType === 'classifieds'
                          ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Classifieds
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Title *</label>
                  <input
                    type="text"
                    required
                    value={newListingTitle}
                    onChange={(e) => setNewListingTitle(e.target.value)}
                    placeholder={newListingType === 'gear' ? 'e.g., Mesa Boogie Dual Rectifier' : 'e.g., Drummer wanted for tour'}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {newListingType === 'gear' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newListingPrice}
                        onChange={(e) => setNewListingPrice(e.target.value)}
                        placeholder="450"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Condition</label>
                      <select
                        value={newListingCondition}
                        onChange={(e) => setNewListingCondition(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">City / Location *</label>
                    <input
                      type="text"
                      required
                      value={newListingLocation}
                      onChange={(e) => setNewListingLocation(e.target.value)}
                      placeholder="Portland, OR"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Delivery Option</label>
                    <select
                      value={newListingDeliveryOption}
                      onChange={(e) => setNewListingDeliveryOption(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="both">Pickup or Escrow Ship</option>
                      <option value="local_meetup">Local Pickup Only</option>
                      <option value="escrow_shipping">Escrow Shipping Only</option>
                    </select>
                  </div>
                </div>

                {newListingType === 'gear' && (
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newListingTradesWelcome}
                      onChange={(e) => setNewListingTradesWelcome(e.target.checked)}
                      className="accent-purple-500 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-200 font-medium">Open to Gear Trades / Partial Swaps</span>
                  </label>
                )}

                {/* Multi-Photo Upload (Up to 4 photos) */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                      Item Photos ({newListingPhotos.length}/4)
                    </label>
                    {newListingPhotos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewListingPhotos([])}
                        className="text-[11px] text-red-400 hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {newListingPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {newListingPhotos.map((src, idx) => (
                        <div key={`up-photo-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewListingPhotos((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {newListingPhotos.length < 4 && (
                    <label className="flex items-center justify-center gap-2 border border-dashed border-zinc-800 hover:border-purple-500/60 rounded-xl bg-zinc-950/60 py-4 cursor-pointer text-xs text-zinc-400 hover:text-white transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photos (up to 4)</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []).slice(0, 4 - newListingPhotos.length);
                          const uploaded: string[] = [];
                          for (const file of files) {
                            const dataUrl = await compressImageInSocialFeed(file);
                            if (dataUrl) uploaded.push(dataUrl);
                          }
                          if (uploaded.length > 0) {
                            setNewListingPhotos((prev) => [...prev, ...uploaded].slice(0, 4));
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1.5">Description *</label>
                  <textarea
                    required
                    rows={3}
                    value={newListingDescription}
                    onChange={(e) => setNewListingDescription(e.target.value)}
                    placeholder="Details on specs, condition, shipping, or trade interests..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Publish Listing
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
