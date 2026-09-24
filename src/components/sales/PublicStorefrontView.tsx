import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  X,
  Search,
  Check,
  Sparkles,
  Plus,
  Minus,
  ShoppingCart,
  ShieldCheck,
  Truck,
  CreditCard,
  Zap,
  Tag,
  ChevronRight,
  Trash2,
  Lock,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { mockShopItems } from '../../data/shopMockData';
import { getShopCategoryFallback } from '../social/StorefrontView';
import { isItemBelongingToBandOrSplit } from '../../services/discographySyncService';

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
}

interface CartItem {
  id: string;
  name: string;
  size?: string;
  quantity: number;
  price: number;
  thumbnail?: string;
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
  isInline = false
}) => {
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [shopSearchQuery, setShopSearchQuery] = useState<string>('');
  const [selectedShopItem, setSelectedShopItem] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'review' | 'payment' | 'success'>('review');
  const [buyerEmail, setBuyerEmail] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const resolvedBandName = labelName || activeBand?.band_name || activeBand?.name || 'Official Store';
  const resolvedBandId = activeBandId || activeBand?.id || '';

  // Compile all available shop items
  const allShopItems = useMemo(() => {
    // 1. Gather all releases from catalog props
    const releasesList = (Object.values(catalogReleases || {}).flat() as any[]).map(r => ({
      ...r,
      id: r.id || `rel_${r.title}`,
      name: r.title || r.name,
      price: r.price !== undefined ? Number(r.price) : 25,
      category: 'media',
      subcategory: r.format ? String(r.format).toLowerCase() : 'vinyl',
      description: r.description || `Official physical release on ${r.format || 'Heavyweight Vinyl / CD'}. Includes digital download code.`,
      thumbnail: r.cover_url || r.artwork_url || r.image || r.thumbnail,
      fallbackThumbnail: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600',
      sizes: ['Vinyl LP', 'CD Digipak', 'Cassette Tape'],
      isLimited: true,
      stock: r.stock || 35,
      brand: r.artist || r.band || resolvedBandName,
      artist: r.artist || r.band || resolvedBandName,
      band_id: r.band_id || resolvedBandId
    }));

    // 2. Gather all apparel from catalog props
    const apparelList = (Object.values(catalogApparel || {}).flat() as any[]).map(a => ({
      ...a,
      id: a.id || `app_${a.name}`,
      name: a.name || a.title,
      price: a.price !== undefined ? Number(a.price) : 30,
      category: 'apparel',
      subcategory: (a.subcategory || a.item_type || 't-shirt').toLowerCase(),
      description: a.description || `Heavyweight, 100% premium ringspun cotton official merchandise. Discharge printed.`,
      thumbnail: a.image || a.image_url || a.thumbnail,
      fallbackThumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
      sizes: a.variants && a.variants.length > 0 ? a.variants.map((v: any) => v.size) : ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      isLimited: Boolean(a.isLimited || a.is_exclusive),
      stock: a.van_stock || a.table_stock || 25,
      brand: a.brand || resolvedBandName,
      artist: a.artist || resolvedBandName,
      band_id: a.band_id || resolvedBandId
    }));

    // 3. Check local master inventory
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
          category: (inv.item_type || '').toLowerCase().includes('cd') || (inv.item_type || '').toLowerCase().includes('vinyl') || (inv.item_type || '').toLowerCase().includes('music') ? 'media' : 'apparel',
          subcategory: (inv.item_type || 't-shirt').toLowerCase(),
          description: inv.description || `Official ${inv.name} direct from ${resolvedBandName}. Shipped with tracked delivery.`,
          thumbnail: inv.image || inv.coverUrl || inv.artwork_url || inv.thumbnail,
          fallbackThumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
          sizes: inv.variants && inv.variants.length > 0 ? inv.variants.map((v: any) => v.size) : ['S', 'M', 'L', 'XL', '2XL'],
          stock: inv.van_stock || inv.table_stock || 20,
          brand: inv.artist || inv.band || resolvedBandName,
          artist: inv.artist || inv.band || resolvedBandName,
          band_id: inv.band_id || resolvedBandId
        }));
      }
    } catch (_) {}

    // 4. Also gather mock shop items filtered by this band/brand
    const mockList = (mockShopItems || []).map(m => ({
      ...m,
      id: m.id,
      name: m.name,
      price: m.price,
      category: m.category,
      subcategory: m.subcategory,
      description: m.description,
      thumbnail: m.thumbnail,
      fallbackThumbnail: m.fallbackThumbnail,
      sizes: m.sizes && m.sizes.length > 0 ? m.sizes : ['S', 'M', 'L', 'XL', '2XL'],
      brand: (m as any).brand || (m as any).seller || '',
      artist: (m as any).artist || (m as any).brand || ''
    }));

    const combined = [...releasesList, ...apparelList, ...localInventoryList, ...mockList];

    // Filter items specifically belonging to this band or split releases
    const matching = combined.filter(item => isItemBelongingToBandOrSplit(item, resolvedBandId, resolvedBandName));
    if (matching.length > 0) return matching;

    // Default authentic artist merchandise fallback if no explicit items exist
    return [
      {
        id: `store_${resolvedBandId || 'band'}_lp`,
        name: `${resolvedBandName} - Debut Album (180g Splatter Vinyl LP)`,
        price: 28,
        category: 'media',
        subcategory: 'vinyl',
        description: `Deluxe 180-gram heavyweight splatter vinyl pressing with gatefold sleeve and lyric insert. Direct from ${resolvedBandName}.`,
        thumbnail: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Heinous%20Interstellar%20Malformations%20Split.png',
        fallbackThumbnail: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600',
        sizes: ['Vinyl LP', 'Limited Colored Wax', 'CD Digipak'],
        isLimited: true,
        stock: 12,
        brand: resolvedBandName,
        artist: resolvedBandName
      },
      {
        id: `store_${resolvedBandId || 'band'}_tee`,
        name: `${resolvedBandName} Tour Crest Heavyweight Tee`,
        price: 30,
        category: 'apparel',
        subcategory: 't-shirts',
        description: `Official heavyweight 100% combed cotton tour tee with discharge print front and back tour dates.`,
        thumbnail: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/TDF%201%20Drawstring%20Bag.png',
        fallbackThumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600',
        sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
        isLimited: false,
        stock: 45,
        brand: resolvedBandName,
        artist: resolvedBandName
      },
      {
        id: `store_${resolvedBandId || 'band'}_hoodie`,
        name: `${resolvedBandName} Embroidered Pullover Hoodie`,
        price: 55,
        category: 'apparel',
        subcategory: 'hoodies',
        description: `Premium 450gsm heavyweight fleece pullover hoodie with chest embroidery and sleeve artwork.`,
        thumbnail: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600',
        fallbackThumbnail: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=600',
        sizes: ['S', 'M', 'L', 'XL', '2XL'],
        isLimited: true,
        stock: 8,
        brand: resolvedBandName,
        artist: resolvedBandName
      },
      {
        id: `store_${resolvedBandId || 'band'}_cd`,
        name: `${resolvedBandName} - Digipak CD Edition`,
        price: 15,
        category: 'media',
        subcategory: 'cds',
        description: `6-panel matte digipak with 12-page booklet and high-resolution master audio.`,
        thumbnail: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600',
        fallbackThumbnail: 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600',
        sizes: ['CD Digipak'],
        isLimited: false,
        stock: 65,
        brand: resolvedBandName,
        artist: resolvedBandName
      },
      {
        id: `store_${resolvedBandId || 'band'}_patch`,
        name: `${resolvedBandName} Woven Logo Patch`,
        price: 8,
        category: 'apparel',
        subcategory: 'label',
        description: `High-density woven logo patch with merrowed border. Perfect for battle jackets and vests.`,
        thumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
        fallbackThumbnail: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
        sizes: ['Standard'],
        isLimited: false,
        stock: 90,
        brand: resolvedBandName,
        artist: resolvedBandName
      }
    ];
  }, [catalogReleases, catalogApparel, resolvedBandId, resolvedBandName]);

  // Filter items visible on the storefront
  const filteredMerchItems = useMemo(() => {
    return allShopItems.filter(item => {
      if ((item as any).hidden) return false;
      if (storefrontSyncRecord[item.id] === false) return false;

      // Search Filter
      const searchTarget = `${item.name || ''} ${item.description || ''} ${item.subcategory || ''} ${item.category || ''}`.toLowerCase();
      if (shopSearchQuery && !searchTarget.includes(shopSearchQuery.toLowerCase())) {
        return false;
      }

      // Category Filter (matching StorefrontView)
      if (shopCategory === 'all') return true;
      const sub = (item.subcategory || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const name = (item.name || '').toLowerCase();

      if (shopCategory === 'limited') {
        return Boolean(item.isLimited || (item.stock && item.stock <= 15) || cat === 'vinyl' || sub === 'vinyl');
      }
      if (shopCategory === 'label') {
        return cat === 'label' || sub === 'label' || sub.includes('access') || sub.includes('patch') || sub.includes('bag');
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

  const cartTotalCount = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const cartTotalPrice = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  }, [cartItems]);

  const handleAddToCart = (item: any, size?: string) => {
    const chosenSize = size || (item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'Standard');
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id && i.size === chosenSize);
      if (existing) {
        return prev.map(i => i.id === item.id && i.size === chosenSize ? { ...i, quantity: i.quantity + selectedQty } : i);
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          size: chosenSize,
          quantity: selectedQty,
          price: item.price || 25,
          thumbnail: item.thumbnail || item.fallbackThumbnail,
          fallbackThumbnail: item.fallbackThumbnail,
          category: item.category,
          subcategory: item.subcategory
        }
      ];
    });
    triggerNotification?.(`🛒 Added "${item.name}" (${chosenSize}) to cart`);
    setSelectedQty(1);
  };

  const handleInstantCheckout = (item: any, size?: string) => {
    handleAddToCart(item, size);
    setSelectedShopItem(null);
    setIsCartOpen(true);
    setIsCheckingOut(true);
    setCheckoutStep('review');
  };

  const handleProcessOrder = () => {
    if (!buyerEmail) {
      triggerNotification?.("Please enter a valid shipping / contact email address.");
      return;
    }
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setCheckoutStep('success');
      triggerNotification?.(`💳 Payment verified! Order receipt sent to ${buyerEmail}.`);
    }, 1500);
  };

  return (
    <div className={isInline ? "w-full bg-[#07080a] flex flex-col rounded-2xl overflow-hidden border border-zinc-900 font-sans text-zinc-300 relative" : "fixed inset-0 z-[10000000] bg-[#07080a] flex flex-col overflow-hidden font-sans text-zinc-300 pointer-events-auto"}>

      {/* TOP HEADER NAVBAR */}
      <div className="bg-[#0b0d12] border-b border-zinc-900/90 px-4 py-3.5 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xl backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          {!isInline && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white cursor-pointer shadow-sm"
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
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-black tracking-widest text-white uppercase font-mono">
                  {resolvedBandName.toUpperCase()} STORE
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.2 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  OFFICIAL STOREFRONT
                </span>
              </div>
              <p className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase">Direct-to-Fan Physical Media & Merch</p>
            </div>
          </div>
        </div>

        {/* Right Header: Cart Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="relative bg-zinc-900 hover:bg-zinc-800 px-3 py-2 rounded-xl border border-zinc-800 hover:border-rose-900/50 transition-all cursor-pointer flex items-center gap-2 shadow-md"
          >
            <ShoppingCart className="w-4 h-4 text-zinc-300" />
            <span className="text-xs font-mono font-bold text-zinc-200">Cart</span>
            {cartTotalCount > 0 && (
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border border-black animate-pulse font-mono">
                {cartTotalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT BODY (DESIGNED EXACTLY LIKE SOCIAL FEED SHOP) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 max-w-5xl mx-auto w-full">
        
        {/* Brand Banner Card (Exact style as Social Feed Shop) */}
        <div className="w-full bg-gradient-to-r from-orange-950/40 via-black to-zinc-950 border border-orange-500/30 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="text-[9px] font-black uppercase text-orange-400 tracking-widest bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                Artist Storefront Active
              </span>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Direct Artist Support
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mt-2 font-mono flex items-center justify-center sm:justify-start gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-500" />
              {resolvedBandName.toUpperCase()} STORE
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-medium">Curated merch, exclusive physical print runs, and official media releases.</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search merch..."
              value={shopSearchQuery}
              onChange={(e) => setShopSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-900 focus:border-rose-900/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all font-mono"
            />
            {shopSearchQuery && (
              <button
                type="button"
                onClick={() => setShopSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Section Header */}
        <div className="mb-4 flex items-center justify-between border-b border-rose-950/40 pb-2 mt-2">
          <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider font-mono">🛍️ Official Merch & Physical Media</span>
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            {filteredMerchItems.length} ITEMS AVAILABLE
          </span>
        </div>

        {/* Refined Category Filters (Exact chips from Social Feed Shop) */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 justify-start select-none scrollbar-thin scrollbar-thumb-zinc-800">
          {[
            { id: 'all', label: 'All Merch' },
            { id: 'limited', label: '⚡ Limited Drops' },
            { id: 'label', label: 'Label Gear 🏷️' },
            { id: 't-shirts', label: 'T-Shirts' },
            { id: 'longsleeve', label: 'Longsleeves' },
            { id: 'hoodies', label: 'Hoodies' },
            { id: 'shorts', label: 'Shorts' },
            { id: 'vinyl', label: 'Vinyl' },
            { id: 'cds', label: 'CDs' },
            { id: 'cassettes', label: 'Cassettes' }
          ].map((cat) => (
            <button
              type="button"
              key={`cat-pill-${cat.id}`}
              onClick={() => setShopCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase border tracking-wider transition-all duration-200 shrink-0 cursor-pointer ${
                shopCategory === cat.id
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/20'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Merch Grid - 3-column Layout (Exact design from Social Feed Shop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-8 items-stretch">
          {filteredMerchItems.map((item, itmIdx) => (
            <div
              key={item.id ? `shop-item-${item.id}-${itmIdx}` : `shop-item-${itmIdx}`}
              onClick={() => {
                setSelectedShopItem(item);
                if (item.sizes && item.sizes.length > 0) {
                  setSelectedSize(item.sizes[0]);
                }
              }}
              className="bg-[#090a0d] border border-zinc-900/80 rounded-xl overflow-hidden hover:border-rose-950/80 transition-all duration-300 flex flex-col h-full cursor-pointer hover:-translate-y-0.5 shadow-lg group"
            >
              {/* Image Frame */}
              <div className="relative w-full pt-[100%] bg-zinc-950 overflow-hidden flex-shrink-0">
                {(item.isLimited || item.stock || item.category === 'vinyl' || item.subcategory === 'vinyl') && (
                  <div className="absolute bottom-1.5 left-1.5 bg-red-950/90 backdrop-blur-md border border-red-500/50 px-1.5 py-0.5 rounded z-10 flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[8px] font-black text-red-300 font-mono uppercase">
                      {item.stock ? `ONLY ${item.stock} LEFT` : 'LTD PRESSING'}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <img
                    src={item.thumbnail || item.fallbackThumbnail}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = (item.fallbackThumbnail && !item.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo'))
                        ? item.fallbackThumbnail
                        : getShopCategoryFallback(item);
                    }}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="absolute top-1.5 right-1.5 bg-black/85 backdrop-blur-md border border-zinc-900 px-1.5 py-0.5 rounded-md z-10">
                  <span className="text-[10px] font-black text-rose-400 font-mono">${item.price}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-2.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.2 rounded font-mono">
                      {item.subcategory || item.category}
                    </span>
                  </div>
                  <h3 className="text-[10px] sm:text-xs font-black text-white mt-1.5 leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors">
                    {item.name}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredMerchItems.length === 0 && (
          <div className="text-center py-16 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3 mb-8">
            <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto" />
            <p className="text-sm font-black text-zinc-400 uppercase font-mono tracking-wider">No matching merch items found</p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">Try selecting another category or clear your search query to explore the catalog.</p>
            <button
              type="button"
              onClick={() => { setShopCategory('all'); setShopSearchQuery(''); }}
              className="mt-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-bold uppercase font-mono tracking-wider transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Storefront Footer Trust Badges (Exact design) */}
        <div className="pt-8 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl">
            <ShieldCheck className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-white uppercase font-mono">Direct Artist Support</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">100% of merchandise proceeds go directly to {resolvedBandName}.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl">
            <Truck className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-white uppercase font-mono">Global Tracked Dispatch</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Securely packaged with international tracking on all orders.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-950/60 border border-zinc-900 p-3.5 rounded-xl">
            <CreditCard className="w-6 h-6 text-rose-500 shrink-0" />
            <div>
              <h4 className="text-xs font-black text-white uppercase font-mono">Encrypted Checkout</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Protected with 256-bit Stripe and PayPal SSL security encryption.</p>
            </div>
          </div>
        </div>

      </div>

      {/* ITEM DETAIL MODAL (EXACT DESIGN FROM SOCIAL FEED SHOP) */}
      <AnimatePresence>
        {selectedShopItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[10000005] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0d10] border border-zinc-850 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedShopItem(null)}
                className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-zinc-900 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto flex-1 p-5 space-y-5">
                {/* Media Image Frame */}
                <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-900">
                  <img
                    src={selectedShopItem.thumbnail || selectedShopItem.fallbackThumbnail}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = (selectedShopItem.fallbackThumbnail && !selectedShopItem.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo'))
                        ? selectedShopItem.fallbackThumbnail
                        : getShopCategoryFallback(selectedShopItem);
                    }}
                    alt={selectedShopItem.name}
                    className="max-h-full max-w-full object-contain p-4"
                  />
                  <div className="absolute top-3 left-3 bg-rose-600 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                    ${selectedShopItem.price}
                  </div>
                </div>

                {/* Details */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-rose-400 font-bold px-2 py-0.5 rounded">
                      {selectedShopItem.subcategory || selectedShopItem.category}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">
                      Official Release / Merch
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    {selectedShopItem.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-2 font-medium leading-relaxed">
                    {selectedShopItem.description}
                  </p>
                </div>

                {/* Size Selector */}
                {selectedShopItem.sizes && selectedShopItem.sizes.length > 0 && (
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-2 font-mono">
                      Select Size / Format:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedShopItem.sizes.map((s: string) => (
                        <button
                          type="button"
                          key={`size-opt-${s}`}
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                            selectedSize === s
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-500'
                              : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Stepper */}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-black uppercase text-zinc-400 font-mono tracking-wider">Quantity:</span>
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-white">{selectedQty}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedQty(selectedQty + 1)}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Action Buttons (Exact 1-Tap Stripe + Add to Cart) */}
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantCheckout(selectedShopItem, selectedSize)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/45 cursor-pointer font-mono"
                  >
                    <Zap className="w-4 h-4 fill-white" /> 1-Tap Stripe Checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(selectedShopItem, selectedSize);
                      setSelectedShopItem(null);
                    }}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-800 cursor-pointer font-mono"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INTEGRATED SLIDE-OVER CART & CHECKOUT DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[10000010] flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-[#0c0e12] border-l border-zinc-800 h-full flex flex-col shadow-2xl relative"
            >
              {/* Cart Drawer Header */}
              <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-rose-500" />
                  <h3 className="text-sm font-black text-white uppercase font-mono tracking-wider">
                    Your Shopping Bag ({cartTotalCount})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsCartOpen(false); setIsCheckingOut(false); setCheckoutStep('review'); }}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white border border-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Cart Drawer Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {checkoutStep === 'success' ? (
                  <div className="py-12 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-white uppercase font-mono">Order Confirmed!</h3>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                      Thank you for supporting {resolvedBandName}! A confirmation receipt with tracking details has been sent to <strong className="text-white">{buyerEmail || 'your email'}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCartItems([]);
                        setIsCartOpen(false);
                        setIsCheckingOut(false);
                        setCheckoutStep('review');
                      }}
                      className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl font-mono shadow-md"
                    >
                      Continue Browsing
                    </button>
                  </div>
                ) : isCheckingOut ? (
                  /* Stripe Simulated Checkout Flow */
                  <div className="space-y-4">
                    <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="text-zinc-400">Subtotal:</span>
                        <span className="text-white font-bold">${cartTotalPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-400">Tracked Shipping:</span>
                        <span className="text-emerald-400 font-bold">FREE</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-1 font-mono">
                          Contact / Shipping Email
                        </label>
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="fan@bandnexus.com"
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-600 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black uppercase text-zinc-400 tracking-wider mb-1 font-mono">
                          Shipping Street Address
                        </label>
                        <textarea
                          rows={2}
                          value={buyerAddress}
                          onChange={(e) => setBuyerAddress(e.target.value)}
                          placeholder="123 Metalhead Blvd, Apt 4B, City, State, ZIP"
                          className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-600 font-mono"
                        />
                      </div>

                      <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" /> 256-Bit Encrypted Stripe Payment
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500">
                          Card: •••• •••• •••• 4242 (Instant Simulated Stripe Processing)
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isProcessingPayment}
                        onClick={handleProcessOrder}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 font-mono cursor-pointer"
                      >
                        {isProcessingPayment ? (
                          <span>Processing Encrypted Order...</span>
                        ) : (
                          <span>Pay ${cartTotalPrice} & Complete Order</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsCheckingOut(false)}
                        className="w-full py-2 bg-transparent text-zinc-500 hover:text-zinc-300 text-[10px] font-mono uppercase tracking-wider text-center"
                      >
                        ← Back to Cart Review
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Cart List */
                  cartItems.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto" />
                      <p className="text-xs font-mono uppercase text-zinc-500">Your cart is empty</p>
                      <p className="text-[10px] text-zinc-600 max-w-xs mx-auto">Select merch or vinyl releases from the official catalog to add to your order.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cartItems.map((c, cIdx) => (
                        <div key={`cart-row-${c.id}-${c.size}-${cIdx}`} className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-black border border-zinc-850 overflow-hidden shrink-0 flex items-center justify-center p-1">
                              <img src={c.thumbnail || c.fallbackThumbnail} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate font-mono">{c.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 mt-0.5">
                                <span>Size: {c.size}</span>
                                <span>•</span>
                                <span className="text-rose-400">${c.price} ea</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (c.quantity <= 1) {
                                    setCartItems(prev => prev.filter((_, idx) => idx !== cIdx));
                                  } else {
                                    setCartItems(prev => prev.map((item, idx) => idx === cIdx ? { ...item, quantity: item.quantity - 1 } : item));
                                  }
                                }}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-mono text-white font-bold">{c.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCartItems(prev => prev.map((item, idx) => idx === cIdx ? { ...item, quantity: item.quantity + 1 } : item));
                                }}
                                className="p-1 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => setCartItems(prev => prev.filter((_, idx) => idx !== cIdx))}
                              className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Cart Drawer Footer */}
              {!isCheckingOut && cartItems.length > 0 && (
                <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">Total:</span>
                    <span className="text-base font-black text-rose-400">${cartTotalPrice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 font-mono cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" /> Proceed to Checkout (${cartTotalPrice})
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
