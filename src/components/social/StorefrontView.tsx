import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag, X, Search, Filter, Tag, Check, ArrowRight, Sparkles, Plus,
  Minus, ShoppingCart, Heart, ShieldCheck, Truck, RefreshCw, Star, Flame, Package, Upload, MessageSquare,
  Zap, CreditCard
} from 'lucide-react';
import { mockShopItems } from '../../data/shopMockData';

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
    selectedMerch,
    setSelectedMerch = () => {},
    selectedMerchSize = 'M',
    setSelectedMerchSize = () => {},
    selectedMerchQty = 1,
    setSelectedMerchQty = () => {},
    isCheckoutModalOpen = false,
    setIsCheckoutModalOpen = () => {},
    checkoutSuccess = false,
    setCheckoutSuccess = () => {},
    userProfile,
    triggerNotification,
    getSupabase,
    addToCart = () => {},
    openCheckout = () => {},
    chats = [],
    setChats = () => {},
    allProfiles = []
  } = props;

  const [selectedShopItem, setSelectedShopItem] = React.useState<any>(null);
  const [selectedSize, setSelectedSize] = React.useState<string>('');
  const [shopPage, setShopPage] = React.useState<number>(1);
  const [isPostListingOpen, setIsPostListingOpen] = React.useState<boolean>(false);

  const [newListingType, setNewListingType] = React.useState<string>('gear');
  const [newListingTitle, setNewListingTitle] = React.useState<string>('');
  const [newListingPrice, setNewListingPrice] = React.useState<string>('');
  const [newListingCategory, setNewListingCategory] = React.useState<string>('guitar');
  const [newListingCondition, setNewListingCondition] = React.useState<string>('Excellent');
  const [newListingBrand, setNewListingBrand] = React.useState<string>('');
  const [newListingYear, setNewListingYear] = React.useState<string>('');
  const [newListingLocation, setNewListingLocation] = React.useState<string>('');
  const [newListingImagePreset, setNewListingImagePreset] = React.useState<string>('');
  const [newListingCustomImage, setNewListingCustomImage] = React.useState<string>('');
  const [newListingDescription, setNewListingDescription] = React.useState<string>('');
  const [communityCategory, setCommunityCategory] = React.useState<string>('all');
  const [shopItemsList, setShopItemsList] = React.useState<any[]>([]);
  const [isDemoMode, setIsDemoMode] = React.useState<boolean>(true);

  // Compute effective items: fallback to shopItems prop, shopItemsList, or mockShopItems
  const effectiveShopItems = (shopItems && shopItems.length > 0)
    ? shopItems
    : (shopItemsList && shopItemsList.length > 0 ? shopItemsList : mockShopItems);

  const realAccountItems = effectiveShopItems.filter(item => item.is_real_account === true || item.id?.startsWith('real_'));
  const demoItems = effectiveShopItems.filter(item => !item.is_real_account && !item.id?.startsWith('real_'));

  const activeStoreItems = isDemoMode ? demoItems : realAccountItems;

  const compressImageInSocialFeed = (fileOrBase64: any, ..._rest: any[]): Promise<string> => {
    if (typeof fileOrBase64 === 'string') return Promise.resolve(fileOrBase64);
    if (!fileOrBase64) return Promise.resolve('');
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || '');
      reader.readAsDataURL(fileOrBase64);
    });
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListingTitle.trim()) {
      triggerNotification?.("Please enter a title for your listing.");
      return;
    }

    const newItem = {
      id: 'real_' + Date.now(),
      name: newListingTitle,
      price: Number(newListingPrice) || 0,
      category: newListingType,
      subcategory: newListingType,
      description: newListingDescription || 'Listing posted by user account.',
      thumbnail: newListingCustomImage || (newListingImagePreset === 'amp' ? 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=600' : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600'),
      fallbackThumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600',
      condition: newListingCondition,
      year: newListingYear || '2026',
      brand: newListingBrand || 'Custom',
      seller: userProfile?.full_name || userProfile?.console_handle || userProfile?.name || 'Verified Account',
      poster: userProfile?.full_name || userProfile?.console_handle || userProfile?.name || 'Verified Account',
      location: newListingLocation || 'Local',
      is_real_account: true,
      created_at: new Date().toISOString()
    };

    try {
      const sb = getSupabase?.();
      if (sb) {
        await sb.from('nexus_shop_items').insert([{
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
          created_at: newItem.created_at
        }]);
      }
    } catch (err) {
      console.warn("Could not insert shop item into Supabase:", err);
    }

    setShopItemsList(prev => [newItem, ...prev]);
    if (setShopItems) {
      setShopItems(prev => [newItem, ...prev]);
    }

    triggerNotification?.("🚀 Listing published to Live Accounts!");
    setIsPostListingOpen(false);
    setIsDemoMode(false); // Automatically switch to live view to showcase the published item

    setNewListingTitle('');
    setNewListingPrice('');
    setNewListingDescription('');
    setNewListingCustomImage('');
    setNewListingBrand('');
    setNewListingYear('');
    setNewListingLocation('');
  };

  if (activeTab !== 'shop') return null;

  return (
    <>
<div className="max-w-4xl mx-auto px-4 py-6 pb-20 animate-in fade-in duration-300">
          {/* Storefront Mode Banner & Selector */}
          <div className="bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-zinc-850 rounded-2xl p-3.5 sm:p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {isDemoMode ? (
                  <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-950/60 border border-rose-900/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    DEMO SHOWCASE VERSION
                  </span>
                ) : (
                  <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/60 border border-emerald-900/50 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    LIVE SELLER ACCOUNTS ({realAccountItems.length})
                  </span>
                )}
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                  {isDemoMode ? 'Preview Catalog' : 'Live Storefront'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium leading-tight">
                {isDemoMode 
                  ? "Displaying showcase demo catalog until real items are listed and sold by active user accounts." 
                  : "Displaying real items and merchandise posted directly by active user accounts."}
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0 select-none w-full sm:w-auto justify-stretch">
              <button
                type="button"
                onClick={() => setIsDemoMode(true)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono ${
                  isDemoMode 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-200" /> Demo Catalog
              </button>
              <button
                type="button"
                onClick={() => setIsDemoMode(false)}
                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer font-mono ${
                  !isDemoMode 
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" /> Live Accounts ({realAccountItems.length})
              </button>
            </div>
          </div>

          {/* Shop Header */}
          <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            {shopBrandFilter ? (
              <div className="w-full bg-gradient-to-r from-orange-950/40 via-black to-zinc-950 border border-orange-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="text-[9px] font-black uppercase text-orange-400 tracking-widest bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      Label Storefront Active
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                      In-App Exclusive
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mt-2 font-mono flex items-center justify-center sm:justify-start gap-2">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                    {shopBrandFilter.toUpperCase()} STORE
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">Curated merch, exclusive physical print runs, and official media releases.</p>
                </div>
                {portalRole !== 'label' && (
                  <button
                    onClick={() => setShopBrandFilter(null)}
                    className="self-center sm:self-auto px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 font-mono cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-500" /> View Global Store
                  </button>
                )}
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest bg-rose-950/30 border border-rose-900/50 px-2.5 py-1 rounded-full">
                  Official Band Merch
                </span>
                <h2 className="text-2xl font-black uppercase tracking-wider text-white mt-3">Apparel & Media Store</h2>
                <p className="text-xs text-zinc-400 mt-1 font-medium">Direct support for artists. High quality prints, vintage washes, and exclusive physical media.</p>
              </div>
            )}

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search merch..."
                value={shopSearchQuery}
                onChange={(e) => setShopSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 focus:border-rose-900/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
              />
              {shopSearchQuery && (
                <button
                  onClick={() => setShopSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* EMPTY STATE FOR LIVE ACCOUNTS MODE WHEN 0 REAL ITEMS ARE LISTED */}
          {!isDemoMode && realAccountItems.length === 0 ? (
            <div className="text-center py-16 px-6 bg-[#090a0d] border border-zinc-850 rounded-2xl my-6 max-w-xl mx-auto shadow-2xl animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-900/60 flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-lg shadow-rose-950/30">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest bg-rose-950/50 border border-rose-900/60 px-3 py-1 rounded-full inline-block mb-3 font-mono">
                Live Marketplace (0 Real Items)
              </span>
              <h3 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                No Active Items Sold From Real Accounts
              </h3>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed font-medium">
                There are currently no items listed for sale from active user accounts on Nexus. You can post a real listing from your account, or switch back to the Demo Showcase Catalog to explore the preview version.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDemoMode(true)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Sparkles className="w-4 h-4 text-rose-200" /> View Demo Showcase Catalog
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPostListingOpen(true);
                    setNewListingType('gear');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
                >
                  <Plus className="w-4 h-4 text-purple-400" /> Post Real Listing
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Section 1: Band Merch & Physical Media Header */}
              <div className="mb-4 flex items-center justify-between border-b border-rose-950/40 pb-2 mt-2">
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">🛍️ Band Merch & Physical Media</span>
                {isDemoMode && (
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    DEMO PREVIEW
                  </span>
                )}
              </div>

              {/* Refined Category Filters - Apparel & Media */}
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
                ].map((cat, catIdx) => (
                  <button
                    key={`shop-cat-${cat.id}-${catIdx}`}
                    onClick={() => setShopCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase border tracking-wider transition-all duration-200 shrink-0 ${
                      shopCategory === cat.id
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/20'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Merch Grid - Compact 3-column Layout */}
              {(() => {
                const filteredMerchItems = activeStoreItems.filter(item => {
                  if ((item as any).hidden) return false;
                  if (item.category !== 'apparel' && item.category !== 'media' && item.category !== 'label') return false;
                  const matchesCategory = 
                    shopCategory === 'all' || 
                    (shopCategory === 'limited' ? (Boolean((item as any).isLimited || (item as any).stock || item.category === 'vinyl' || item.category === 'cassettes')) : (item.category === shopCategory || item.subcategory === shopCategory));
                  const matchesSearch = (item?.name || '').toLowerCase().includes(shopSearchQuery.toLowerCase()) || 
                                        item.description.toLowerCase().includes(shopSearchQuery.toLowerCase());
                  
                  let matchesBrand = true;
                  if (shopBrandFilter) {
                    const bf = shopBrandFilter.toLowerCase();
                    const itemName = (item?.name || '').toLowerCase();
                    const itemDesc = item.description.toLowerCase();
                    
                    if (bf.includes('torture') || bf.includes('tdf') || bf.includes('picture company')) {
                      matchesBrand = 
                        item.category === 'label' ||
                        itemName.includes('tdf') ||
                        itemName.includes('torture') ||
                        itemName.includes('virulent excision') ||
                        itemName.includes('heinous');
                    } else {
                      matchesBrand = itemName.includes(bf) || itemDesc.includes(bf);
                    }
                  }

                  return matchesCategory && matchesSearch && matchesBrand;
                });

                const itemsPerPage = 18;
                const totalPages = Math.ceil(filteredMerchItems.length / itemsPerPage);
                const startIndex = (shopPage - 1) * itemsPerPage;
                const paginatedItems = filteredMerchItems.slice(startIndex, startIndex + itemsPerPage);

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 items-stretch">
                      {paginatedItems.map((item, itmIdx) => (
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
                            {isDemoMode && (
                              <div className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-md border border-rose-900/60 px-1.5 py-0.5 rounded z-10">
                                <span className="text-[8px] font-black text-rose-400 font-mono uppercase">DEMO</span>
                              </div>
                            )}
                            {((item as any).isLimited || (item as any).stock || item.category === 'vinyl' || item.category === 'cassettes') && (
                              <div className="absolute bottom-1.5 left-1.5 bg-red-950/90 backdrop-blur-md border border-red-500/50 px-1.5 py-0.5 rounded z-10 flex items-center gap-1 shadow-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-[8px] font-black text-red-300 font-mono uppercase">
                                  {((item as any).stock) ? `ONLY ${(item as any).stock} LEFT` : 'LTD PRESSING'}
                                </span>
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center p-2">
                              <img 
                                src={item.thumbnail} 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = (item.fallbackThumbnail && !item.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo')) 
                                    ? item.fallbackThumbnail 
                                    : getShopCategoryFallback(item);
                                }}
                                alt={item?.name} 
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
                                <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.2 rounded">
                                  {item.subcategory || item.category}
                                </span>
                              </div>
                              <h3 className="text-[9px] font-black text-white mt-1.5 leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors">
                                {item?.name}
                              </h3>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Empty Search / Filter State for Apparel & Media */}
                    {filteredMerchItems.length === 0 && (
                      <div className="text-center py-10 bg-zinc-950/20 border border-zinc-900/60 rounded-2xl mb-10">
                        <p className="text-xs text-zinc-500 font-medium">No official merch items match the current filters.</p>
                      </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 0 && (
                      <div className="flex items-center justify-between mt-6 mb-10 bg-zinc-950/60 border border-zinc-900/50 rounded-xl p-3 select-none">
                        <button
                          disabled={shopPage === 1}
                          onClick={() => setShopPage(prev => Math.max(prev - 1, 1))}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-black uppercase text-zinc-300 disabled:text-zinc-600 rounded-lg transition-all tracking-wider"
                        >
                          Prev
                        </button>
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          Page <span className="text-rose-500 font-black">{shopPage}</span> of {totalPages}
                        </span>
                        <button
                          disabled={shopPage === totalPages}
                          onClick={() => setShopPage(prev => Math.min(prev + 1, totalPages))}
                          className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-black uppercase text-zinc-300 disabled:text-zinc-600 rounded-lg transition-all tracking-wider"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Section 2: Community Swap & Classifieds - Separate row */}
              {!shopBrandFilter && (
                <div className="border-t border-zinc-900 pt-8 mt-6">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-purple-950/40">
                  <div>
                    <h3 className="text-lg sm:text-2xl font-black uppercase text-purple-400 tracking-widest flex items-center gap-1.5 font-display">
                      🎸 Community Marketplace
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Fan-to-fan gear trade, drummer search, and local listings.</p>
                  </div>

                  {/* Action Buttons & Filters Row */}
                  <div className="flex items-center gap-2 select-none overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
                    <button
                      onClick={() => {
                        setIsPostListingOpen(true);
                        setNewListingType('gear');
                      }}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-lg shadow-purple-950/45 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Post Listing
                    </button>

                    {[
                      { id: 'all', label: 'All Community' },
                      { id: 'gear', label: 'Gear Swap 🎸' },
                      { id: 'classifieds', label: 'Classifieds 📋' }
                    ].map((cat, catIdx) => (
                      <button
                        key={`comm-cat-${cat.id}-${catIdx}`}
                        onClick={() => setCommunityCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border tracking-wider transition-all duration-200 shrink-0 ${
                          communityCategory === cat.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-850 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Community Marketplace - Grid of items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
                  {activeStoreItems
                    .filter(item => {
                      if (item.category !== 'gear' && item.category !== 'classifieds') return false;
                      const matchesCategory = communityCategory === 'all' || item.category === communityCategory;
                      const matchesSearch = (item?.name || '').toLowerCase().includes(shopSearchQuery.toLowerCase()) || 
                                            item.description.toLowerCase().includes(shopSearchQuery.toLowerCase());
                      return matchesCategory && matchesSearch;
                    })
                    .map((item, itmIdx) => (
                      <div 
                        key={item.id ? `merch-item-${item.id}-${itmIdx}` : `merch-item-${itmIdx}`}
                        onClick={() => {
                          setSelectedShopItem(item);
                          if (item.sizes && item.sizes.length > 0) {
                            setSelectedSize(item.sizes[0]);
                          }
                        }}
                        className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-3.5 flex h-full gap-4 hover:border-purple-900/50 hover:bg-zinc-950/80 transition-all cursor-pointer group relative"
                      >
                        {isDemoMode && (
                          <div className="absolute top-2 right-2 bg-black/85 border border-purple-900/60 px-1.5 py-0.5 rounded text-[8px] font-black text-purple-400 font-mono">
                            DEMO
                          </div>
                        )}
                        <div className="w-16 h-16 bg-zinc-950 rounded-lg overflow-hidden shrink-0 relative border border-zinc-900 flex items-center justify-center p-1">
                          <img 
                            src={item.thumbnail} 
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = (item.fallbackThumbnail && !item.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo')) 
                                ? item.fallbackThumbnail 
                                : getShopCategoryFallback(item);
                            }}
                            alt={item?.name} 
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
                            referrerPolicy="no-referrer" 
                          />
                          {item.price > 0 && (
                            <div className="absolute bottom-1 right-1 bg-black/85 border border-zinc-900 px-1 rounded text-[9px] font-black text-purple-400">
                              ${item.price}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider bg-purple-950/40 border border-purple-900/30 px-1.5 py-0.5 rounded">
                                {item.category === 'gear' ? 'Gear Swap' : 'Classified'}
                              </span>
                              {item.condition && (
                                <span className="text-[9px] text-zinc-500 font-mono font-bold">
                                  {item.condition}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-white mt-1 group-hover:text-purple-300 transition-colors line-clamp-1">
                              {item.name}
                            </h4>

                            <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/60 text-[9px] text-zinc-500 font-mono">
                            <span>{item.seller || item.poster || 'Community Member'}</span>
                            <span>{item.location || 'Local'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Empty Search / Filter State for Community Marketplace */}
                {activeStoreItems.filter(item => {
                  if (item.category !== 'gear' && item.category !== 'classifieds') return false;
                  const matchesCategory = communityCategory === 'all' || item.category === communityCategory;
                  const matchesSearch = (item?.name || '').toLowerCase().includes(shopSearchQuery.toLowerCase()) || 
                                        item.description.toLowerCase().includes(shopSearchQuery.toLowerCase());
                  return matchesCategory && matchesSearch;
                }).length === 0 && (
                  <div className="text-center py-6 bg-zinc-950/20 border border-zinc-900/60 rounded-2xl mt-4">
                    <p className="text-xs text-zinc-500 font-medium">No community marketplace listings match the current filters.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Expanded Merch Detail Modal */}
      <AnimatePresence>
        {selectedShopItem && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0d10] border border-zinc-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
              {/* Close button */}
              <button 
                onClick={() => setSelectedShopItem(null)}
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-zinc-900 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col sm:flex-row">
                {/* Large Image Panel */}
                <div className="w-full sm:w-1/2 aspect-square sm:aspect-auto sm:h-[320px] bg-zinc-950 relative flex items-center justify-center p-4">
                  <img 
                    src={selectedShopItem.thumbnail} 
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = (selectedShopItem.fallbackThumbnail && !selectedShopItem.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo')) 
                        ? selectedShopItem.fallbackThumbnail 
                        : getShopCategoryFallback(selectedShopItem);
                    }}
                    alt={selectedShopItem.name} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-rose-600 border border-rose-500 px-3 py-1 rounded-xl shadow-lg">
                    <span className="text-sm font-black text-white font-mono">${selectedShopItem.price}</span>
                  </div>
                </div>

                {/* Details Panel */}
                <div className="w-full sm:w-1/2 p-5 flex flex-col justify-between bg-zinc-950/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider bg-rose-950/20 border border-rose-900/30 px-2 py-0.5 rounded-full">
                        {selectedShopItem.category}
                      </span>
                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                        {selectedShopItem.subcategory}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white mt-2 leading-snug">
                      {selectedShopItem.name}
                    </h3>

                    <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                      {selectedShopItem.description}
                    </p>

                    {/* Sizes / Variants Selector */}
                    {selectedShopItem.sizes && selectedShopItem.sizes.length > 0 && (
                      <div className="mt-4">
                        <span className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Select Size</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedShopItem.sizes.map((size: string, szIdx: number) => (
                            <button
                              key={`size-${size}-${szIdx}`}
                              onClick={() => setSelectedSize(size)}
                              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                selectedSize === size
                                  ? 'bg-rose-600 border-rose-500 text-white shadow-md'
                                  : 'bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gear / Classifieds Fields */}
                    {(selectedShopItem.condition || selectedShopItem.year || selectedShopItem.brand || selectedShopItem.location || selectedShopItem.seller || selectedShopItem.poster) && (
                      <div className="mt-4 bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg grid grid-cols-2 gap-2 text-[10px]">
                        {selectedShopItem.condition && (
                          <div className="flex flex-col"><span className="text-zinc-500 uppercase font-black tracking-wider">Condition</span><span className="text-white font-medium">{selectedShopItem.condition}</span></div>
                        )}
                        {selectedShopItem.year && (
                          <div className="flex flex-col"><span className="text-zinc-500 uppercase font-black tracking-wider">Year</span><span className="text-white font-medium">{selectedShopItem.year}</span></div>
                        )}
                        {selectedShopItem.brand && (
                          <div className="flex flex-col"><span className="text-zinc-500 uppercase font-black tracking-wider">Brand</span><span className="text-white font-medium">{selectedShopItem.brand}</span></div>
                        )}
                        {selectedShopItem.location && (
                          <div className="flex flex-col"><span className="text-zinc-500 uppercase font-black tracking-wider">Location</span><span className="text-white font-medium">{selectedShopItem.location}</span></div>
                        )}
                        {selectedShopItem.seller && (
                          <div className="flex flex-col"><span className="text-zinc-500 uppercase font-black tracking-wider">Seller</span><span className="text-rose-400 font-medium">{selectedShopItem.seller}</span></div>
                        )}
                        {selectedShopItem.poster && (
                          <div className="flex flex-col"><span className="text-zinc-500 uppercase font-black tracking-wider">Poster</span><span className="text-rose-400 font-medium">{selectedShopItem.poster}</span></div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-zinc-900">
                    {selectedShopItem.category === 'classifieds' ? (
                      <button
                        onClick={() => {
                          const posterName = selectedShopItem.poster || 'Community Member';
                          const matchedProf = allProfiles.find(p => 
                            (p.full_name && p.full_name.toLowerCase() === posterName.toLowerCase()) || 
                            (p.console_handle && p.console_handle.toLowerCase() === posterName.toLowerCase()) ||
                            (p.email && p.email.toLowerCase().includes(posterName.toLowerCase()))
                          );
                          const posterId = matchedProf?.email ? matchedProf.email.toLowerCase().trim() : (selectedShopItem.poster || 'community_member').toLowerCase().replace(/\s+/g, '_');
                          
                          // Find or create chat
                          const existingChat = chats.find(c => c.id === posterId);
                          if (!existingChat) {
                            const newChat: ChatType = {
                              id: posterId,
                              name: posterName,
                              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                              role: 'Community Member',
                              roleBadge: 'POSTER',
                              roleColor: 'text-purple-400 bg-purple-955/10 border-purple-900/30',
                              online: true,
                              unread: 0,
                              messages: [
                                {
                                  id: `msg_${Date.now()}_init`,
                                  sender: 'them',
                                  text: `Hey there! I saw you are looking at my ${selectedShopItem.title}. What's up?`,
                                  time: 'Just now'
                                }
                              ]
                            };
                            setChats(prev => [newChat, ...prev]);
                            }
                          window.dispatchEvent(new CustomEvent('nexus_open_chat', { detail: { profile_id: posterId, name: posterName, username: posterName, avatar_url: matchedProf?.avatar_url } }));
                          window.dispatchEvent(new CustomEvent('nexus_open_chat_thread', { detail: { profile_id: posterId, name: posterName, username: posterName, avatar_url: matchedProf?.avatar_url } }));
                          setSelectedShopItem(null);

                        }}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/45"
                      >
                        <MessageSquare className="w-4 h-4" /> Contact Poster
                      </button>
                    ) : selectedShopItem.category === 'gear' ? (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            const itemToCheckout = {
                              ...selectedShopItem,
                              name: selectedShopItem.name,
                              price: selectedShopItem.price || 0,
                              thumbnail: selectedShopItem.thumbnail || selectedShopItem.image || (selectedShopItem.fallbackThumbnail && !selectedShopItem.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo') ? selectedShopItem.fallbackThumbnail : getShopCategoryFallback(selectedShopItem)),
                              bandName: selectedShopItem.seller || 'Gear Seller',
                              seller: selectedShopItem.seller || 'Gear Seller',
                              category: 'gear',
                              is_real_account: selectedShopItem.is_real_account
                            };
                            setSelectedShopItem(null);
                            openCheckout('merch', itemToCheckout);
                          }}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/45"
                        >
                          <Zap className="w-4 h-4 fill-white" /> Buy with Stripe Escrow
                        </button>
                        <button
                          onClick={() => {
                            const sellerName = selectedShopItem.seller || 'Seller';
                            const matchedProf = allProfiles.find(p => 
                              (p.full_name && p.full_name.toLowerCase() === sellerName.toLowerCase()) || 
                              (p.console_handle && p.console_handle.toLowerCase() === sellerName.toLowerCase()) ||
                              (p.email && p.email.toLowerCase().includes(sellerName.toLowerCase()))
                            );
                            const sellerId = matchedProf?.email ? matchedProf.email.toLowerCase().trim() : (selectedShopItem.seller || 'seller').toLowerCase().replace(/\s+/g, '_');
                            
                            // Find or create chat
                            const existingChat = chats.find(c => c.id === sellerId);
                            if (!existingChat) {
                              const newChat: ChatType = {
                                id: sellerId,
                                name: sellerName.toUpperCase(),
                                avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                                role: 'Gear Seller',
                                roleBadge: 'SELLER',
                                roleColor: 'text-amber-400 bg-amber-955/10 border-amber-900/30',
                                online: true,
                                unread: 0,
                                messages: [
                                  {
                                    id: `msg_${Date.now()}_init`,
                                    sender: 'them',
                                    text: `Hey! Thanks for your interest in my ${selectedShopItem.name}. It's still available! Do you have any questions or want to make an offer?`,
                                    time: 'Just now'
                                  }
                                ]
                              };
                              setChats(prev => [newChat, ...prev]);
                            }
                            window.dispatchEvent(new CustomEvent('nexus_open_chat', { detail: { profile_id: sellerId, name: sellerName, username: sellerName, avatar_url: matchedProf?.avatar_url } }));
                            window.dispatchEvent(new CustomEvent('nexus_open_chat_thread', { detail: { profile_id: sellerId, name: sellerName, username: sellerName, avatar_url: matchedProf?.avatar_url } }));
                            setSelectedShopItem(null);
                          }}
                          className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-700"
                        >
                          <MessageSquare className="w-4 h-4" /> Message Seller
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            if (selectedShopItem.sizes && selectedShopItem.sizes.length > 0 && !selectedSize) {
                              triggerNotification?.("Please select a size first.");
                              return;
                            }
                            const chosenSize = selectedSize || (selectedShopItem.sizes?.[0] || 'L');
                            const itemToCheckout = {
                              ...selectedShopItem,
                              size: chosenSize,
                              sizes: selectedShopItem.sizes || [chosenSize],
                              name: selectedShopItem.name,
                              price: selectedShopItem.price || 25,
                              thumbnail: selectedShopItem.thumbnail || selectedShopItem.image || (selectedShopItem.fallbackThumbnail && !selectedShopItem.fallbackThumbnail.includes('cyjnpuneruonskfzpmqo') ? selectedShopItem.fallbackThumbnail : getShopCategoryFallback(selectedShopItem)),
                              bandName: selectedShopItem.seller || selectedShopItem.brand || 'Artist / Label',
                              seller: selectedShopItem.seller || selectedShopItem.brand || 'Artist / Label'
                            };
                            setSelectedShopItem(null);
                            openCheckout('merch', itemToCheckout);
                          }}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-rose-950/45"
                        >
                          <Zap className="w-4 h-4 fill-white" /> 1-Tap Stripe Checkout
                        </button>
                        <button
                          onClick={() => {
                            if (selectedShopItem.sizes && selectedShopItem.sizes.length > 0 && !selectedSize) {
                              triggerNotification?.("Please select a size first.");
                              return;
                            }
                            const itemToCheckout = { ...selectedShopItem };
                            setSelectedShopItem(null);
                            addToCart(itemToCheckout, selectedSize || undefined);
                            setSelectedSize('');
                          }}
                          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 flex items-center justify-center gap-2 border border-zinc-800"
                        >
                          <ShoppingCart className="w-4 h-4" /> Add to Cart
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isPostListingOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0d10] border border-zinc-850 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {/* Close button */}
              <button 
                onClick={() => setIsPostListingOpen(false)}
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-zinc-900 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-5 border-b border-zinc-900 bg-zinc-950/40">
                <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Plus className="w-4 h-4 text-purple-400" /> Create Marketplace Listing
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">Post a new gear swap item or classified listing to the community feed.</p>
              </div>

              <form onSubmit={handleCreateListing} className="p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-850 text-left">
                {/* Category Switcher */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-2">Listing Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewListingType('gear')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                        newListingType === 'gear'
                          ? 'bg-purple-950/30 border-purple-600 text-purple-400 shadow-lg shadow-purple-950/20'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                      }`}
                    >
                      <span>🎸</span> Gear Swap
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewListingType('classifieds')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 ${
                        newListingType === 'classifieds'
                          ? 'bg-purple-950/30 border-purple-600 text-purple-400 shadow-lg shadow-purple-950/20'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'
                      }`}
                    >
                      <span>📋</span> Classifieds
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Listing Title</label>
                  <input
                    type="text"
                    required
                    value={newListingTitle}
                    onChange={(e) => setNewListingTitle(e.target.value)}
                    placeholder={newListingType === 'gear' ? 'e.g., Gibson Les Paul Standard (2018)' : 'e.g., Vocalist wanted for doom metal band'}
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all font-medium"
                  />
                </div>

                {newListingType === 'gear' && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Price */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Price ($)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={newListingPrice}
                        onChange={(e) => setNewListingPrice(e.target.value)}
                        placeholder="Price in USD"
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all font-mono"
                      />
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Condition</label>
                      <select
                        value={newListingCondition}
                        onChange={(e) => setNewListingCondition(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all"
                      >
                        <option value="New">New</option>
                        <option value="Like New">Like New</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </select>
                    </div>
                  </div>
                )}

                {newListingType === 'gear' && (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Brand */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Brand</label>
                      <input
                        type="text"
                        value={newListingBrand}
                        onChange={(e) => setNewListingBrand(e.target.value)}
                        placeholder="e.g., Marshall, Fender"
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all"
                      />
                    </div>

                    {/* Year */}
                    <div>
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Year</label>
                      <input
                        type="text"
                        value={newListingYear}
                        onChange={(e) => setNewListingYear(e.target.value)}
                        placeholder="e.g., 1995"
                        className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Location */}
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Location</label>
                    <input
                      type="text"
                      required
                      value={newListingLocation}
                      onChange={(e) => setNewListingLocation(e.target.value)}
                      placeholder="e.g., Portland, OR"
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all"
                    />
                  </div>

                  {/* Preset Image */}
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Listing Image Preset</label>
                    <select
                      value={newListingImagePreset}
                      onChange={(e) => setNewListingImagePreset(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all"
                    >
                      <option value="guitar">🎸 Vintage Guitar</option>
                      <option value="amp">🔊 Amp Stack</option>
                      <option value="drums">🥁 Drumkit / Studio</option>
                      <option value="audio">🎛️ Audio Mixer</option>
                    </select>
                  </div>
                </div>

                {/* Native Device Photo Uploader */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">Upload Item Photo</label>
                    {newListingCustomImage && (
                      <button
                        type="button"
                        onClick={() => setNewListingCustomImage('')}
                        className="text-[8px] text-red-500 font-mono hover:underline uppercase"
                      >
                        Clear Image
                      </button>
                    )}
                  </div>
                  
                  {newListingCustomImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-zinc-900 bg-zinc-950 flex items-center justify-center p-2 h-36">
                      <img
                        src={newListingCustomImage}
                        alt="Listing Preview"
                        className="max-h-full max-w-full object-contain rounded"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded transition-colors">
                          Replace Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = async (event) => {
                                  const rawBase64 = event.target?.result as string;
                                  const compressed = await compressImageInSocialFeed(rawBase64, 400, 400, 0.6);
                                  setNewListingCustomImage(compressed);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setNewListingCustomImage('')}
                          className="bg-zinc-800 hover:bg-red-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border border-dashed border-zinc-850 hover:border-purple-600/50 rounded-xl bg-zinc-950/40 p-4 cursor-pointer hover:bg-zinc-950/80 transition-all group h-36">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-purple-400 group-hover:bg-purple-950/20 transition-all">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-center">
                          Click to select a photo
                        </div>
                        <div className="text-[8px] text-zinc-600 font-mono text-center">
                          Supports PNG, JPG, GIF up to 5MB
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = async (event) => {
                              const rawBase64 = event.target?.result as string;
                              const compressed = await compressImageInSocialFeed(rawBase64, 400, 400, 0.6);
                              setNewListingCustomImage(compressed);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider mb-1.5">Description</label>
                  <textarea
                    required
                    rows={3}
                    value={newListingDescription}
                    onChange={(e) => setNewListingDescription(e.target.value)}
                    placeholder="Provide details about condition, trades, or contact preferences..."
                    className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30 transition-all leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-purple-950/45"
                  >
                    🚀 Submit Listing
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
