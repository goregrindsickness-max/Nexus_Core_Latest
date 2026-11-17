import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  X,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  ShieldCheck,
  Truck,
  CreditCard,
  Zap,
  Trash2,
  Lock,
  CheckCircle2,
  Play,
  Pause,
  Music,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { mockShopItems } from '../../data/shopMockData';
import { getShopCategoryFallback } from '../social/StorefrontView';
import { isItemBelongingToBandOrSplit } from '../../services/discographySyncService';
import { communityBandManager } from '../../lib/communityBands';
import {
  getItemAvailableStock,
  decrementPurchasedInventory,
  commitShopPurchaseToCollections,
  isPhysicalMediaItem,
  resolveItemTracks,
  findUpcomingShowsForBand,
  FREE_SHIPPING_THRESHOLD_PER_BAND,
  FLAT_SHIPPING_PER_BAND,
  type FulfillmentMode,
} from '../../services/shopCommerceService';

export interface PublicStorefrontViewProps {
  catalogReleases?: any;
  catalogApparel?: any;
  storefrontSyncRecord?: Record<string, boolean>;
  setStorefrontSyncRecord?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setCatalogReleases?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setCatalogApparel?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  labelName: string;
  activeBandId?: string;
  activeBand?: any;
  onClose?: () => void;
  triggerNotification?: (msg: string) => void;
  isInline?: boolean;
  liveEvents?: any[];
}

interface CartItem {
  id: string;
  productId?: string;
  name: string;
  bandName?: string;
  size?: string;
  quantity: number;
  maxStock?: number | null;
  price: number;
  thumbnail?: string;
  image?: string;
  fallbackThumbnail?: string;
  category?: string;
  subcategory?: string;
}

export const PublicStorefrontView: React.FC<PublicStorefrontViewProps> = ({
  catalogReleases = {},
  catalogApparel = {},
  storefrontSyncRecord = {},
  labelName = 'Band Store',
  activeBandId,
  activeBand,
  onClose,
  triggerNotification,
  isInline = false,
  liveEvents = [],
}) => {
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [shopSearchQuery, setShopSearchQuery] = useState<string>('');
  const [selectedShopItem, setSelectedShopItem] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [pdpImageIdx, setPdpImageIdx] = useState<number>(0);

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment' | 'success'>('review');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('ship');
  const [pickupShowId, setPickupShowId] = useState<string>('');
  const [stockVersion, setStockVersion] = useState<number>(0);
  const [brokenImgMap, setBrokenImgMap] = useState<Record<string, boolean>>({});

  // Audio preview state
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [previewSecondsLeft, setPreviewSecondsLeft] = useState<number>(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);
  const synthTimerRef = useRef<number | null>(null);

  const resolvedBandName = labelName || activeBand?.band_name || activeBand?.name || 'Official Store';
  const resolvedBandId = activeBandId || activeBand?.id || '';

  const upcomingShows = useMemo(
    () => findUpcomingShowsForBand(resolvedBandName, liveEvents),
    [resolvedBandName, liveEvents]
  );

  useEffect(() => {
    if (upcomingShows.length > 0 && !pickupShowId) {
      setPickupShowId(upcomingShows[0].id);
    }
  }, [upcomingShows, pickupShowId]);

  useEffect(() => {
    const onStockUpdate = () => setStockVersion((v) => v + 1);
    window.addEventListener('nexus_shop_stock_updated', onStockUpdate);
    window.addEventListener('nexus_inventory_updated', onStockUpdate);
    return () => {
      window.removeEventListener('nexus_shop_stock_updated', onStockUpdate);
      window.removeEventListener('nexus_inventory_updated', onStockUpdate);
    };
  }, []);

  const stopPreview = () => {
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
  };

  useEffect(() => {
    if (!selectedShopItem) {
      stopPreview();
      setPdpImageIdx(0);
      setSelectedQty(1);
    }
  }, [selectedShopItem]);

  const handleTogglePreview = (trk: { id: string; title: string; audioUrl?: string }) => {
    if (previewTrackId === trk.id) {
      stopPreview();
      return;
    }
    stopPreview();
    setPreviewTrackId(trk.id);
    setPreviewSecondsLeft(30);

    if (trk.audioUrl) {
      const audio = new Audio(trk.audioUrl);
      audioRef.current = audio;
      audio.volume = 0.7;
      audio.play().catch(() => {});
    } else if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        synthCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
      } catch {
        // ignore audio context restrictions
      }
    }

    synthTimerRef.current = window.setInterval(() => {
      setPreviewSecondsLeft((prev) => {
        if (prev <= 1) {
          stopPreview();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Compile all available shop items
  const allShopItems = useMemo(() => {
    const releasesList = (Object.values(catalogReleases || {}).flat() as any[]).map((r) => ({
      ...r,
      id: r.id || `rel_${r.title}`,
      name: r.title || r.name,
      price: r.price !== undefined ? Number(r.price) : 25,
      category: 'media',
      subcategory: r.format ? String(r.format).toLowerCase() : 'vinyl',
      description:
        r.description ||
        `Official physical release on ${r.format || 'Heavyweight Vinyl / CD'}. Includes digital download unlock.`,
      thumbnail: r.cover_url || r.artwork_url || r.image || r.thumbnail,
      images: r.cover_url ? [r.cover_url] : [],
      fallbackThumbnail: getShopCategoryFallback({ category: 'media' }),
      sizes: ['Vinyl LP', 'CD Digipak', 'Cassette Tape'],
      isLimited: true,
      stock: r.stock !== undefined ? Number(r.stock) : 35,
      tracks: Array.isArray(r.tracks) ? r.tracks : undefined,
      brand: r.artist || r.band || resolvedBandName,
      artist: r.artist || r.band || resolvedBandName,
      band_id: r.band_id || resolvedBandId,
    }));

    const apparelList = (Object.values(catalogApparel || {}).flat() as any[]).map((a) => ({
      ...a,
      id: a.id || `app_${a.name}`,
      name: a.name || a.title,
      price: a.price !== undefined ? Number(a.price) : 30,
      category: 'apparel',
      subcategory: (a.subcategory || a.item_type || 't-shirt').toLowerCase(),
      description: a.description || 'Heavyweight ringspun cotton official artist merchandise.',
      thumbnail: a.image || a.image_url || a.thumbnail,
      images: Array.isArray(a.images) ? a.images : a.image ? [a.image] : [],
      fallbackThumbnail: getShopCategoryFallback({ category: 'apparel' }),
      sizes:
        a.variants && a.variants.length > 0
          ? a.variants.map((v: any) => v.size)
          : ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      isLimited: Boolean(a.isLimited || a.is_exclusive),
      stock: a.stock !== undefined ? Number(a.stock) : Number(a.van_stock || 0) + Number(a.table_stock || 0) || 25,
      brand: a.brand || resolvedBandName,
      artist: a.artist || resolvedBandName,
      band_id: a.band_id || resolvedBandId,
    }));

    let localInventoryList: any[] = [];
    try {
      const saved = localStorage.getItem('nexus_master_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        localInventoryList = (parsed || []).map((inv: any) => ({
          ...inv,
          id: inv.id || `inv_${inv.name}`,
          name: inv.name || inv.title,
          price: Number(inv.price) || 25,
          category:
            (inv.item_type || '').toLowerCase().includes('cd') ||
            (inv.item_type || '').toLowerCase().includes('vinyl') ||
            (inv.item_type || '').toLowerCase().includes('music')
              ? 'media'
              : 'apparel',
          subcategory: (inv.item_type || 't-shirt').toLowerCase(),
          description:
            inv.description || `Official ${inv.name} direct from ${resolvedBandName}. Tracked delivery included.`,
          thumbnail: inv.image || inv.coverUrl || inv.artwork_url || inv.thumbnail,
          images: inv.image ? [inv.image] : [],
          fallbackThumbnail: getShopCategoryFallback({ category: 'apparel' }),
          sizes:
            inv.variants && inv.variants.length > 0
              ? inv.variants.map((v: any) => v.size)
              : ['S', 'M', 'L', 'XL', '2XL'],
          stock:
            inv.stock !== undefined
              ? Number(inv.stock)
              : Number(inv.van_stock || 0) + Number(inv.table_stock || 0) || 20,
          brand: inv.artist || inv.band || resolvedBandName,
          artist: inv.artist || inv.band || resolvedBandName,
          band_id: inv.band_id || resolvedBandId,
        }));
      }
    } catch {
      // ignore
    }

    const mockList = (mockShopItems || []).map((m) => ({
      ...m,
      sizes: m.sizes && m.sizes.length > 0 ? m.sizes : ['S', 'M', 'L', 'XL', '2XL'],
      brand: (m as any).brand || (m as any).seller || '',
      artist: (m as any).artist || (m as any).brand || '',
    }));

    const combined = [...releasesList, ...apparelList, ...localInventoryList, ...mockList];
    const matching = combined.filter((item) => isItemBelongingToBandOrSplit(item, resolvedBandId, resolvedBandName));
    if (matching.length > 0) return matching;

    const commBand =
      (resolvedBandId ? communityBandManager.getById(resolvedBandId) : null) ||
      (resolvedBandName
        ? communityBandManager.findByName(resolvedBandName) || communityBandManager.findMatch(resolvedBandName)
        : null);

    if (commBand && Array.isArray(commBand.discography) && commBand.discography.length > 0) {
      const authenticMediaItems = commBand.discography
        .map((rel: any, idx: number) => {
          const cover = rel.image_url || rel.cover_url || rel.cover_image || rel.coverUrl || rel.coverImage || '';
          const formatName =
            (rel.type || 'album').toLowerCase() === 'ep'
              ? 'EP'
              : (rel.type || 'album').toLowerCase() === 'single'
              ? 'Single'
              : 'Vinyl LP / CD';
          return {
            id: rel.id || `comm_rel_${idx}`,
            name: `${resolvedBandName} - ${rel.title} (${formatName})`,
            price: (rel.type || '').toLowerCase() === 'single' ? 10 : 25,
            category: 'media',
            subcategory: (rel.type || '').toLowerCase().includes('vinyl') ? 'vinyl' : 'cds',
            description: `Authentic catalog release by ${resolvedBandName}. Released ${rel.year || ''} via ${rel.label || 'Direct'}.`,
            thumbnail: cover,
            images: cover ? [cover] : [],
            fallbackThumbnail: cover,
            sizes: ['Vinyl LP', 'CD Digipak', 'Digital Master'],
            isLimited: true,
            stock: 25,
            tracks: Array.isArray(rel.tracks) ? rel.tracks : undefined,
            brand: resolvedBandName,
            artist: resolvedBandName,
            band_id: commBand.id || resolvedBandId,
          };
        })
        .filter((item) => Boolean(item.thumbnail));

      if (authenticMediaItems.length > 0) return authenticMediaItems;
    }

    return [];
  }, [catalogReleases, catalogApparel, resolvedBandId, resolvedBandName, stockVersion]);

  const filteredMerchItems = useMemo(() => {
    return allShopItems.filter((item) => {
      if ((item as any).hidden) return false;
      if (storefrontSyncRecord[item.id] === false) return false;

      const searchTarget = `${item.name || ''} ${item.description || ''} ${item.subcategory || ''} ${item.category || ''}`.toLowerCase();
      if (shopSearchQuery && !searchTarget.includes(shopSearchQuery.toLowerCase())) {
        return false;
      }

      if (shopCategory === 'all') return true;
      const sub = (item.subcategory || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();

      if (shopCategory === 'limited') {
        return Boolean(item.isLimited || (item.stock && item.stock <= 15) || cat === 'vinyl' || sub === 'vinyl');
      }
      if (shopCategory === 'label') {
        return cat === 'label' || sub === 'label' || sub.includes('access') || sub.includes('patch');
      }
      if (shopCategory === 't-shirts') {
        return sub.includes('t-shirt') || sub.includes('tee') || name.includes('tee') || name.includes('shirt');
      }
      if (shopCategory === 'longsleeve') {
        return sub.includes('longsleeve') || name.includes('longsleeve');
      }
      if (shopCategory === 'hoodies') {
        return sub.includes('hoodie') || name.includes('hoodie') || name.includes('pullover');
      }
      if (shopCategory === 'shorts') {
        return sub.includes('short') || name.includes('short');
      }
      if (shopCategory === 'vinyl') {
        return sub.includes('vinyl') || name.includes('lp') || name.includes('vinyl') || cat === 'media';
      }
      if (shopCategory === 'cds') {
        return sub.includes('cd') || name.includes('cd') || name.includes('digipak');
      }
      if (shopCategory === 'cassettes') {
        return sub.includes('cassette') || sub.includes('tape') || name.includes('tape');
      }
      return true;
    });
  }, [allShopItems, storefrontSyncRecord, shopSearchQuery, shopCategory]);

  const cartTotalCount = useMemo(() => cartItems.reduce((acc, curr) => acc + curr.quantity, 0), [cartItems]);
  const cartTotalPrice = useMemo(
    () => cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0),
    [cartItems]
  );

  const shippingFee =
    fulfillmentMode === 'booth_pickup'
      ? 0
      : cartTotalPrice >= FREE_SHIPPING_THRESHOLD_PER_BAND || cartTotalPrice === 0
      ? 0
      : FLAT_SHIPPING_PER_BAND;
  const cartGrandTotal = cartTotalPrice + shippingFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_PER_BAND - cartTotalPrice);
  const freeShippingProgress = Math.min(100, Math.round((cartTotalPrice / FREE_SHIPPING_THRESHOLD_PER_BAND) * 100));

  const handleAddToCart = (item: any, size?: string) => {
    const chosenSize = size || (item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'Standard');
    const stockCheck = getItemAvailableStock(item, chosenSize);

    if (stockCheck.isVariantSoldOut) {
      triggerNotification?.(`"${item.name}" (${chosenSize}) is sold out.`);
      return;
    }

    const maxAllowed = !stockCheck.isUnlimited ? stockCheck.variantStock ?? stockCheck.totalStock : null;

    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.size === chosenSize);
      if (existing) {
        const nextQty = maxAllowed !== null ? Math.min(maxAllowed, existing.quantity + selectedQty) : existing.quantity + selectedQty;
        return prev.map((i) =>
          i.id === item.id && i.size === chosenSize ? { ...i, quantity: nextQty, maxStock: maxAllowed } : i
        );
      }
      const clampedQty = maxAllowed !== null ? Math.min(maxAllowed, selectedQty) : selectedQty;
      return [
        ...prev,
        {
          id: item.id,
          productId: item.id,
          name: item.name,
          bandName: resolvedBandName,
          size: chosenSize,
          quantity: clampedQty,
          maxStock: maxAllowed,
          price: item.price || 25,
          thumbnail: item.thumbnail || item.fallbackThumbnail,
          image: item.thumbnail || item.fallbackThumbnail,
          fallbackThumbnail: item.fallbackThumbnail,
          category: item.category,
          subcategory: item.subcategory,
        },
      ];
    });
    triggerNotification?.(`Added "${item.name}" (${chosenSize}) to cart`);
    setSelectedQty(1);
  };

  const handleInstantCheckout = (item: any, size?: string) => {
    const chosenSize = size || (item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'Standard');
    if (getItemAvailableStock(item, chosenSize).isVariantSoldOut) {
      triggerNotification?.(`"${item.name}" (${chosenSize}) is sold out.`);
      return;
    }
    handleAddToCart(item, chosenSize);
    setSelectedShopItem(null);
    setIsCartOpen(true);
    setIsCheckingOut(true);
    setCheckoutStep('review');
  };

  const handleProcessOrder = async () => {
    if (!buyerEmail.trim()) {
      triggerNotification?.('Please enter a valid contact email address.');
      return;
    }
    if (fulfillmentMode === 'ship' && !buyerAddress.trim()) {
      triggerNotification?.('Please enter a shipping address or choose Merch Booth Pickup.');
      return;
    }

    setIsProcessingPayment(true);
    const orderId = `ord_${Date.now().toString(36).toUpperCase()}`;

    await decrementPurchasedInventory(
      cartItems.map((c) => ({
        productId: c.productId || c.id,
        id: c.id,
        name: c.name,
        size: c.size,
        quantity: c.quantity,
      }))
    );

    const matchedShow = upcomingShows.find((s) => s.id === pickupShowId) || upcomingShows[0];
    commitShopPurchaseToCollections({
      items: cartItems.map((c) => ({
        ...c,
        bandName: resolvedBandName,
        fulfillment:
          fulfillmentMode === 'booth_pickup' && matchedShow
            ? {
                mode: 'booth_pickup' as const,
                showId: matchedShow.id,
                showTitle: matchedShow.title,
                venue: matchedShow.venue,
                date: matchedShow.date,
              }
            : { mode: 'ship' as const },
      })),
      orderId,
      paymentMethod: 'Card',
      shippingCost: shippingFee,
      shippingAddress: fulfillmentMode === 'ship' ? { street: buyerAddress, email: buyerEmail } : undefined,
      bands: activeBand ? [activeBand] : [],
    });

    setTimeout(() => {
      setIsProcessingPayment(false);
      setCheckoutStep('success');
      triggerNotification?.(`Order confirmed! Receipt saved to My Collections (${buyerEmail}).`);
    }, 900);
  };

  const pdpImages = selectedShopItem
    ? Array.from(
        new Set(
          [selectedShopItem.thumbnail, ...(Array.isArray(selectedShopItem.images) ? selectedShopItem.images : [])].filter(
            (u) => typeof u === 'string' && u.trim().length > 0
          )
        )
      )
    : [];
  const pdpActiveImg =
    pdpImages[pdpImageIdx] || (selectedShopItem ? getShopCategoryFallback(selectedShopItem) : '');
  const pdpStock = selectedShopItem
    ? getItemAvailableStock(selectedShopItem, selectedSize || undefined)
    : { isUnlimited: true, totalStock: null, variantStock: null, isSoldOut: false, isVariantSoldOut: false };
  const pdpTracks =
    selectedShopItem && isPhysicalMediaItem(selectedShopItem)
      ? resolveItemTracks(selectedShopItem, [], activeBand ? [activeBand] : [])
      : [];

  return (
    <div
      className={
        isInline
          ? 'w-full bg-[#07080a] flex flex-col rounded-2xl overflow-hidden border border-zinc-900 font-sans text-zinc-300 relative'
          : 'fixed inset-0 z-[10000000] bg-[#07080a] flex flex-col overflow-hidden font-sans text-zinc-300 pointer-events-auto'
      }
    >
      {/* Top Storefront Navbar */}
      <div className="bg-[#0b0d12] border-b border-zinc-900 px-4 py-3.5 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-3">
          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white cursor-pointer"
              title="Close Storefront"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/30 text-rose-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase font-mono">
                {resolvedBandName} Store
              </h1>
              <p className="text-[10px] font-mono text-zinc-500">
                Direct Artist Merch · Free Shipping at ${FREE_SHIPPING_THRESHOLD_PER_BAND}+
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-800 cursor-pointer flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-mono font-bold text-zinc-200">Cart</span>
          {cartTotalCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded font-mono tabular-nums">
              {cartTotalCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 max-w-5xl mx-auto w-full">
        {/* Clean Artist Storefront Banner */}
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-rose-400">
              Official Artist Storefront · Direct Support
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
              {resolvedBandName}
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Official merch, limited physical pressings with instant digital unlock, and tracked shipping.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search merch..."
              value={shopSearchQuery}
              onChange={(e) => setShopSearchQuery(e.target.value)}
              className="w-full bg-[#090a0d] border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none font-mono"
            />
            {shopSearchQuery && (
              <button
                type="button"
                onClick={() => setShopSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-2">
          <span className="text-xs font-mono uppercase text-zinc-400 tracking-wider">
            Official Catalog ({filteredMerchItems.length})
          </span>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 no-scrollbar">
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
              key={`cat-btn-${cat.id}`}
              onClick={() => setShopCategory(cat.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors shrink-0 cursor-pointer ${
                shopCategory === cat.id
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Merch Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8 items-stretch">
          {filteredMerchItems.map((item, itmIdx) => {
            const idKey = String(item.id || itmIdx);
            const itemStock = getItemAvailableStock(item);
            const hasFailed = Boolean(brokenImgMap[idKey]);
            const imgSrc = item.thumbnail || item.fallbackThumbnail || getShopCategoryFallback(item);

            return (
              <div
                key={`pub-item-${idKey}-${itmIdx}`}
                onClick={() => {
                  setSelectedShopItem(item);
                  if (Array.isArray(item.sizes) && item.sizes.length > 0) {
                    const firstAvail = item.sizes.find((s: string) => !getItemAvailableStock(item, s).isVariantSoldOut);
                    setSelectedSize(firstAvail || item.sizes[0]);
                  }
                }}
                className="bg-[#0b0c10] border border-zinc-900 hover:border-zinc-700 rounded-xl overflow-hidden transition-colors flex flex-col h-full cursor-pointer group"
              >
                <div className="relative aspect-square bg-zinc-950 overflow-hidden flex items-center justify-center">
                  {!hasFailed && imgSrc ? (
                    <img
                      src={imgSrc}
                      onError={() => setBrokenImgMap((prev) => ({ ...prev, [idKey]: true }))}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300 ${
                        itemStock.isSoldOut ? 'opacity-40 grayscale' : ''
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}

                  {itemStock.isSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                      <span className="px-3 py-1 bg-zinc-950 border border-zinc-700 text-xs font-mono font-bold uppercase text-zinc-200 rounded">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between gap-2 border-t border-zinc-900/80">
                  <div>
                    <div className="text-[11px] text-zinc-500 capitalize truncate">
                      {item.subcategory || item.category}
                      {isPhysicalMediaItem(item) ? ' · + Digital' : ''}
                    </div>
                    <h3 className="text-sm font-bold text-white mt-1 leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 font-mono tabular-nums">
                    <span className="text-sm font-black text-white">${Number(item.price || 0).toFixed(2)}</span>
                    {!itemStock.isUnlimited &&
                      itemStock.totalStock !== null &&
                      itemStock.totalStock > 0 &&
                      itemStock.totalStock <= 5 && (
                        <span className="text-[11px] text-rose-400">Only {itemStock.totalStock} left</span>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMerchItems.length === 0 && (
          <div className="text-center py-14 px-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-3 mb-8">
            <ShoppingBag className="w-8 h-8 text-zinc-600 mx-auto" />
            {allShopItems.length === 0 ? (
              <>
                <p className="text-sm font-bold text-zinc-200 uppercase font-mono">
                  This artist has not uploaded any items yet
                </p>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  {resolvedBandName} hasn&apos;t published merchandise or physical releases to this storefront yet.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-zinc-300 uppercase font-mono">No matching items found</p>
                <button
                  type="button"
                  onClick={() => {
                    setShopCategory('all');
                    setShopSearchQuery('');
                  }}
                  className="mt-2 px-4 py-2 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Reset Filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Storefront Footer */}
        <div className="pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">Direct Artist Support</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Proceeds go directly to {resolvedBandName}.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl">
            <Truck className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                Free Shipping at ${FREE_SHIPPING_THRESHOLD_PER_BAND}+
              </h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                ${FLAT_SHIPPING_PER_BAND} flat rate below ${FREE_SHIPPING_THRESHOLD_PER_BAND}, or $0 booth pickup.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl">
            <CreditCard className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase font-mono">Encrypted Checkout</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">256-bit SSL secured checkout & order receipts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedShopItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000005] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#0c0d10] border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <button
                type="button"
                onClick={() => setSelectedShopItem(null)}
                className="absolute top-4 right-4 z-20 bg-black/70 hover:bg-zinc-900 text-zinc-300 hover:text-white p-2 rounded-full border border-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">
                {/* Multi-Image Frame */}
                <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-900">
                  <img
                    src={pdpActiveImg}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getShopCategoryFallback(selectedShopItem);
                    }}
                    alt={selectedShopItem.name}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain p-4"
                  />
                  {pdpImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPdpImageIdx((i) => (i - 1 + pdpImages.length) % pdpImages.length)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/75 border border-zinc-800 text-white flex items-center justify-center cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdpImageIdx((i) => (i + 1) % pdpImages.length)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/75 border border-zinc-800 text-white flex items-center justify-center cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div>
                  <div className="text-xs text-zinc-400 font-mono">
                    {selectedShopItem.subcategory || selectedShopItem.category} · {resolvedBandName}
                  </div>
                  <div className="flex items-baseline justify-between gap-2 mt-1">
                    <h3 className="text-lg font-black text-white">{selectedShopItem.name}</h3>
                    <span className="text-lg font-black text-rose-400 font-mono tabular-nums">
                      ${Number(selectedShopItem.price || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{selectedShopItem.description}</p>
                </div>

                {/* 30s Audio Previews for Physical Releases */}
                {isPhysicalMediaItem(selectedShopItem) && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-rose-400" /> Track Previews (30s)
                      </span>
                      <span className="text-[11px] font-mono text-emerald-400">+ Digital Unlock</span>
                    </div>
                    {pdpTracks.length > 0 ? (
                      pdpTracks.slice(0, 4).map((trk) => {
                        const playing = previewTrackId === trk.id;
                        return (
                          <button
                            type="button"
                            key={trk.id}
                            onClick={() => handleTogglePreview(trk)}
                            className="w-full px-2.5 py-2 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-200 flex items-center justify-between cursor-pointer"
                          >
                            <span className="flex items-center gap-2 truncate">
                              {playing ? <Pause className="w-3.5 h-3.5 text-rose-400" /> : <Play className="w-3.5 h-3.5 text-zinc-400" />}
                              <span className="truncate">{trk.num}. {trk.title}</span>
                            </span>
                            <span className="font-mono text-[11px] text-zinc-400">{playing ? `${previewSecondsLeft}s` : trk.duration}</span>
                          </button>
                        );
                      })
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTogglePreview({ id: `pub_${selectedShopItem.id}`, title: selectedShopItem.name })}
                        className="w-full px-2.5 py-2 rounded-lg bg-zinc-900/70 border border-zinc-800 text-xs text-zinc-200 flex items-center justify-between cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          {previewTrackId === `pub_${selectedShopItem.id}` ? (
                            <Pause className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                          <span>Preview 30s Audio Sample</span>
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {previewTrackId === `pub_${selectedShopItem.id}` ? `${previewSecondsLeft}s` : '0:30'}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Size Selector with Live Variant Stock */}
                {Array.isArray(selectedShopItem.sizes) && selectedShopItem.sizes.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-mono uppercase text-zinc-400">Select Size / Format</label>
                      {!pdpStock.isUnlimited && pdpStock.variantStock !== null && (
                        <span className="text-[11px] font-mono text-zinc-400">{pdpStock.variantStock} left</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedShopItem.sizes.map((s: string) => {
                        const vStock = getItemAvailableStock(selectedShopItem, s);
                        return (
                          <button
                            type="button"
                            key={`size-opt-${s}`}
                            disabled={vStock.isVariantSoldOut}
                            onClick={() => setSelectedSize(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase cursor-pointer disabled:opacity-35 disabled:line-through ${
                              selectedSize === s
                                ? 'bg-rose-600 text-white border border-rose-500'
                                : 'bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                            }`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper capped at live stock */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs uppercase text-zinc-400 font-mono">Quantity:</span>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-white tabular-nums">{selectedQty}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cap = pdpStock.isUnlimited
                          ? 8
                          : Math.max(1, pdpStock.variantStock ?? pdpStock.totalStock ?? 8);
                        setSelectedQty(Math.min(cap, selectedQty + 1));
                      }}
                      className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={pdpStock.isVariantSoldOut}
                    onClick={() => handleInstantCheckout(selectedShopItem, selectedSize)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer font-mono"
                  >
                    <Zap className="w-4 h-4 fill-white" />{' '}
                    {pdpStock.isVariantSoldOut ? 'Sold Out' : '1-Tap Checkout'}
                  </button>
                  <button
                    type="button"
                    disabled={pdpStock.isVariantSoldOut}
                    onClick={() => {
                      handleAddToCart(selectedShopItem, selectedSize);
                      setSelectedShopItem(null);
                    }}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 border border-zinc-800 cursor-pointer font-mono"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Slide-Over Cart & Checkout Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[10000010] flex justify-end bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#0c0e12] border-l border-zinc-800 h-full flex flex-col shadow-2xl relative"
            >
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-black text-white uppercase font-mono tabular-nums">
                    Your Bag ({cartTotalCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckingOut(false);
                    setCheckoutStep('review');
                  }}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {checkoutStep === 'success' ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase font-mono">Order Confirmed</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Thank you for supporting {resolvedBandName}. Your receipt{fulfillmentMode === 'booth_pickup' ? ' and Booth Pickup barcode pass are' : ' is'} saved in My Collections & sent to <strong className="text-white">{buyerEmail}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCartItems([]);
                        setIsCartOpen(false);
                        setIsCheckingOut(false);
                        setCheckoutStep('review');
                      }}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase rounded-xl font-mono cursor-pointer"
                    >
                      Continue Browsing
                    </button>
                  </div>
                ) : isCheckingOut ? (
                  <div className="space-y-4">
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-1.5 text-xs font-mono tabular-nums">
                      <div className="flex justify-between text-zinc-400">
                        <span>Subtotal</span>
                        <span className="text-white">${cartTotalPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>{fulfillmentMode === 'booth_pickup' ? 'Merch Booth Pickup' : 'Shipping'}</span>
                        <span className={shippingFee === 0 ? 'text-emerald-400 font-bold' : 'text-white'}>
                          {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-zinc-800 text-sm font-black">
                        <span className="text-white">Total</span>
                        <span className="text-rose-400">${cartGrandTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                          Contact Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="fan@bandnexus.com"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                        />
                      </div>

                      {fulfillmentMode === 'ship' && (
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                            Shipping Street Address *
                          </label>
                          <textarea
                            rows={2}
                            value={buyerAddress}
                            onChange={(e) => setBuyerAddress(e.target.value)}
                            placeholder="123 Main St, Apt 4B, City, State, ZIP"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                      )}

                      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>256-Bit Encrypted Checkout</span>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={handleProcessOrder}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl font-mono cursor-pointer"
                      >
                        {isProcessingPayment
                          ? 'Processing Order...'
                          : `Pay $${cartGrandTotal.toFixed(2)} & Complete Order`}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="w-full py-2 text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
                      >
                        ← Back to Cart
                      </button>
                    </div>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
                    <p className="text-xs font-mono uppercase text-zinc-500">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Free Shipping Threshold Progress */}
                    {fulfillmentMode === 'ship' && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-zinc-300">
                            {amountToFreeShipping > 0
                              ? `Add $${amountToFreeShipping.toFixed(2)} for FREE shipping`
                              : 'Free shipping unlocked ($75+)'}
                          </span>
                          <span className="text-emerald-400 font-bold">{freeShippingProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              amountToFreeShipping === 0 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${freeShippingProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Optional Merch Booth Pickup Selector */}
                    {upcomingShows.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setFulfillmentMode('ship')}
                            className={`py-1.5 text-[11px] font-bold rounded cursor-pointer ${
                              fulfillmentMode === 'ship' ? 'bg-zinc-800 text-white' : 'text-zinc-400'
                            }`}
                          >
                            Ship ({cartTotalPrice >= FREE_SHIPPING_THRESHOLD_PER_BAND ? 'Free' : `$${FLAT_SHIPPING_PER_BAND}`})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFulfillmentMode('booth_pickup')}
                            className={`py-1.5 text-[11px] font-bold rounded cursor-pointer flex items-center justify-center gap-1 ${
                              fulfillmentMode === 'booth_pickup'
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                                : 'text-zinc-400'
                            }`}
                          >
                            <MapPin className="w-3 h-3" /> Show Pickup ($0)
                          </button>
                        </div>
                        {fulfillmentMode === 'booth_pickup' && (
                          <select
                            value={pickupShowId}
                            onChange={(e) => setPickupShowId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200"
                          >
                            {upcomingShows.map((sh) => (
                              <option key={sh.id} value={sh.id}>
                                {sh.title} · {sh.venue} ({sh.date})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {cartItems.map((c, cIdx) => (
                      <div
                        key={`cart-row-${c.id}-${c.size}-${cIdx}`}
                        className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-black border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center p-1">
                            <img
                              src={c.thumbnail || c.fallbackThumbnail}
                              alt={c.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 mt-0.5 tabular-nums">
                              <span>{c.size}</span>
                              <span>·</span>
                              <span className="text-rose-400">${c.price.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (c.quantity <= 1) {
                                  setCartItems((prev) => prev.filter((_, idx) => idx !== cIdx));
                                } else {
                                  setCartItems((prev) =>
                                    prev.map((item, idx) =>
                                      idx === cIdx ? { ...item, quantity: item.quantity - 1 } : item
                                    )
                                  );
                                }
                              }}
                              className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono text-white font-bold tabular-nums">
                              {c.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={c.maxStock !== undefined && c.maxStock !== null && c.quantity >= c.maxStock}
                              onClick={() =>
                                setCartItems((prev) =>
                                  prev.map((item, idx) =>
                                    idx === cIdx
                                      ? {
                                          ...item,
                                          quantity:
                                            item.maxStock !== undefined && item.maxStock !== null
                                              ? Math.min(item.maxStock, item.quantity + 1)
                                              : item.quantity + 1,
                                        }
                                      : item
                                  )
                                )
                              }
                              className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCartItems((prev) => prev.filter((_, idx) => idx !== cIdx))}
                            className="p-1.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isCheckingOut && cartItems.length > 0 && checkoutStep !== 'success' && (
                <div className="p-4 border-t border-zinc-900 bg-zinc-950/90 space-y-2.5 font-mono tabular-nums">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Subtotal</span>
                    <span>${cartTotalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>{fulfillmentMode === 'booth_pickup' ? 'Merch Booth Pickup' : 'Shipping'}</span>
                    <span className={shippingFee === 0 ? 'text-emerald-400 font-bold' : ''}>
                      {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black pt-1 border-t border-zinc-900">
                    <span className="text-white">Total</span>
                    <span className="text-rose-400">${cartGrandTotal.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" /> Proceed to Checkout (${cartGrandTotal.toFixed(2)})
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PublicStorefrontView;
