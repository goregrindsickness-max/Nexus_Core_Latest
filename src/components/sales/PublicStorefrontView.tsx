import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, ChevronRight, Search, CreditCard, Tag, Disc, Check, Globe } from 'lucide-react';
import { ErrorBoundary } from '../ErrorBoundary';

interface PublicStorefrontViewProps {
  catalogReleases: any;
  catalogApparel: any;
  storefrontSyncRecord?: Record<string, boolean>;
  setStorefrontSyncRecord?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setCatalogReleases?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setCatalogApparel?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  labelName: string;
  onClose: () => void;
  triggerNotification: (msg: string) => void;
  isInline?: boolean;
}

export default function PublicStorefrontView({
  catalogReleases,
  catalogApparel,
  storefrontSyncRecord = {},
  setStorefrontSyncRecord,
  setCatalogReleases,
  setCatalogApparel,
  labelName,
  onClose,
  triggerNotification,
  isInline = false
}: PublicStorefrontViewProps) {
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  
  const [cart, setCart] = useState<Array<{ id: string; title: string; variantName: string; quantity: number, type: string, price: number }>>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<any | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('M');

  const MOCK_MERCH_IDS = new Set([
    "dfd0c9f8-b3d1-4aee-b248-26cf03e87870",
    "a40237bb-539c-4ea6-81d3-34e8979148d1",
    "f2f993f4-18ea-4672-91d1-6fc72e9fc988",
    "9a5ef28d-195c-443b-8fe9-a5c9b7482565",
    "c6e75924-be8c-4a1e-8e41-e94f8306df9a",
    "ecf0f2cf-bf0b-4df2-b5e0-b6f759e5bc53",
    "039e1ff1-460d-4581-9bfe-852438cb20d4"
  ]);

  // Filter items that are NOT explicitly toggled off
  const allItems = [
    ...(Object.values(catalogReleases || {}).flat() as any[]).map(r => ({ ...r, type: 'Release' })),
    ...(Object.values(catalogApparel || {}).flat() as any[]).map(a => ({ ...a, type: 'Apparel' }))
  ].filter(item => item && !MOCK_MERCH_IDS.has(item.id) && storefrontSyncRecord[item.id] !== false);

  const filteredItems = allItems.filter(item => {
    // Search filter
    const titleStr = (item.title || item?.name || '').toLowerCase();
    const descStr = (item.description || '').toLowerCase();
    const query = shopSearchQuery.toLowerCase();
    if (query && !titleStr.includes(query) && !descStr.includes(query)) return false;

    // Category filter
    if (shopCategory === 'all') return true;
    const typeLower = (item.type || '').toLowerCase();
    
    if (shopCategory === 't-shirts') {
      return typeLower.includes('t-shirt') || typeLower.includes('tee') || typeLower.includes('shirt');
    }
    if (shopCategory === 'longsleeve') {
      return typeLower.includes('longsleeve') || typeLower.includes('long sleeve');
    }
    if (shopCategory === 'hoodies') {
      return typeLower.includes('hoodie') || typeLower.includes('sweatshirt');
    }
    if (shopCategory === 'vinyl') {
      return item.type === 'Release' || typeLower.includes('vinyl');
    }
    if (shopCategory === 'cds') {
      return typeLower.includes('cd') || typeLower.includes('compact disc');
    }
    if (shopCategory === 'cassettes') {
      return typeLower.includes('cassette') || typeLower.includes('tape');
    }
    if (shopCategory === 'label') {
      return item.category === 'label' || typeLower.includes('accessory') || typeLower.includes('sticker') || typeLower.includes('cap');
    }
    return true;
  });

  const cartTotalItemCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);
  const cartTotalValue = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleAddToCart = (item: any, variant: string) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id && i.variantName === variant);
      if (exists) {
        return prev.map(i => i.id === item.id && i.variantName === variant ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { id: item.id, title: item.title || item?.name || 'Untitled', variantName: variant, quantity: 1, type: item.type, price: item.price || item.price || 25 }];
    });
    triggerNotification(`Added ${item.title || item?.name || 'item'} to your bag.`);
  };

  if (isInline) {
    const allItems = [
      ...(Object.values(catalogReleases || {}).flat() as any[]).map(r => ({ ...r, type: 'Release' })),
      ...(Object.values(catalogApparel || {}).flat() as any[]).map(a => ({ ...a, type: 'Apparel' }))
    ].filter(item => item && !MOCK_MERCH_IDS.has(item.id));

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-zinc-900">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-widest font-mono">BOH: Public Storefront Inventory</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Manage visibility and pricing for {labelName}'s public storefront</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] font-mono font-bold text-zinc-400">LIVE SYNC</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-900 bg-zinc-950/50">
                <th className="p-3 text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider">Item</th>
                <th className="p-3 text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider">Type</th>
                <th className="p-3 text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider w-24">Price</th>
                <th className="p-3 text-[9px] font-black uppercase text-zinc-500 font-mono tracking-wider w-28 text-center">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {allItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-xs font-mono text-zinc-500 uppercase tracking-wider">
                    No catalog items staged. Add releases or merch inventory to sync to the public storefront.
                  </td>
                </tr>
              ) : (
                allItems.map((item, itemIdx) => {
                  const isVisible = storefrontSyncRecord[item.id] !== false;
                  
                  return (
                    <tr key={item.id ? `store-item-${item.id}-${itemIdx}` : `store-item-${itemIdx}`} className="hover:bg-zinc-950/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                             <img src={item.image_url} alt="" className="w-8 h-8 object-cover rounded-md border border-zinc-800" />
                          ) : (
                             <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                               {item.type === 'Release' ? <Disc className="w-4 h-4" /> : <Tag className="w-4 h-4" />}
                             </div>
                          )}
                          <span className="text-xs font-bold text-white font-mono uppercase tracking-tight">{item.title || item?.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest bg-zinc-900 px-2 py-1 rounded">
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-2">
                          <span className="text-zinc-500 font-mono text-xs">$</span>
                          <input 
                            type="number"
                            value={item.price || 25}
                            onChange={(e) => {
                               const newPrice = Number(e.target.value);
                               if (item.type === 'Release' && setCatalogReleases) {
                                  setCatalogReleases(prev => {
                                    const next = { ...prev };
                                    for (const bandId in next) {
                                      next[bandId] = next[bandId].map(r => r.id === item.id ? { ...r, price: newPrice } : r);
                                    }
                                    return next;
                                  });
                               } else if (item.type === 'Apparel' && setCatalogApparel) {
                                  setCatalogApparel(prev => {
                                    const next = { ...prev };
                                    for (const bandId in next) {
                                      next[bandId] = next[bandId].map(a => a.id === item.id ? { ...a, price: newPrice } : a);
                                    }
                                    return next;
                                  });
                               }
                            }}
                            className="w-full bg-transparent text-xs font-mono text-white p-2 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            if (setStorefrontSyncRecord) {
                              setStorefrontSyncRecord(prev => ({ ...prev, [item.id]: !isVisible }));
                              triggerNotification(isVisible ? "Item hidden from public storefront." : "Item is now visible on storefront.");
                            }
                          }}
                          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-colors ${
                             isVisible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                          }`}
                        >
                          {isVisible ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div className={isInline ? "w-full bg-[#050505] flex flex-col rounded-2xl overflow-hidden border border-zinc-900 font-sans text-zinc-300 relative" : "fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col overflow-hidden font-sans text-zinc-300"}>
      
      {/* GLOBAL NAVBAR */}
      <div className="bg-[#000000] border-b border-zinc-900 px-4 py-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          {!isInline && (
            <button 
              onClick={onClose} 
              className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isInline && (
            <div className="p-2 bg-[#f43f5e]/10 rounded-lg border border-[#f43f5e]/20">
              <Globe className="w-4 h-4 text-[#f43f5e]" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-black tracking-widest text-[#f43f5e] uppercase flex items-center gap-2 font-mono">
              {!isInline && <ShoppingBag className="w-4 h-4 text-[#f43f5e]" />}
              {labelName.toUpperCase()} STOREFRONT
            </h1>
            <p className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase">Direct-to-Fan Retail Fulfillment</p>
          </div>
        </div>

        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative bg-zinc-950 hover:bg-zinc-900 p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 transition-colors cursor-pointer"
        >
          <ShoppingBag className="w-5 h-5 text-white" />
          {cartTotalItemCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#f43f5e] text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-black animate-pulse">
              {cartTotalItemCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto bg-black">
        <div className={`max-w-4xl mx-auto px-4 py-6 ${isInline ? 'pb-8' : 'pb-32'} animate-in fade-in duration-300`}>
          
          {/* Shop Header Banner matching UniversalSocialFeed */}
          <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="w-full bg-gradient-to-r from-rose-950/20 via-black to-zinc-950 border border-rose-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="text-[9px] font-black uppercase text-rose-400 tracking-widest bg-rose-950/60 border border-rose-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Official Band Storefront
                  </span>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                    In-App Exclusive
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mt-2 font-mono flex items-center justify-center sm:justify-start gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-500" />
                  {labelName.toUpperCase()} STORE
                </h2>
                <p className="text-xs text-zinc-400 mt-1 font-medium">Curated merch, exclusive physical print runs, and official media releases.</p>
              </div>
            </div>
          </div>

          {/* Search Bar matching UniversalSocialFeed */}
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest bg-rose-950/30 border border-rose-900/50 px-2.5 py-1 rounded-full">
                Direct Artist Support
              </span>
            </div>
            
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

          {/* Section Divider */}
          <div className="mb-4 flex items-center justify-between border-b border-rose-950/40 pb-2 mt-2">
            <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">🛍️ Band Merch & Physical Media</span>
          </div>

          {/* Category Filters matching UniversalSocialFeed */}
          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2 justify-start select-none scrollbar-thin scrollbar-thumb-zinc-800">
            {[
              { id: 'all', label: 'All Merch' },
              { id: 'label', label: 'Label Gear 🏷️' },
              { id: 't-shirts', label: 'T-Shirts' },
              { id: 'longsleeve', label: 'Longsleeves' },
              { id: 'hoodies', label: 'Hoodies' },
              { id: 'vinyl', label: 'Vinyl' },
              { id: 'cds', label: 'CDs' },
              { id: 'cassettes', label: 'Cassettes' }
            ].map((cat, catIdx) => (
              <button
                key={`cat-${cat.id}-${catIdx}`}
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

          {/* Product Grid strictly matching UniversalSocialFeed's compact 3-column matrix */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 items-stretch">
            {filteredItems.map((item, idx) => (
              <div 
                key={item.id ? `pub-grid-item-${item.id}-${idx}` : `pub-grid-item-${idx}`} 
                onClick={() => {
                  setSelectedShopItem(item);
                  setSelectedSize('M');
                }}
                className="bg-[#090a0d] border border-zinc-900/80 rounded-xl overflow-hidden hover:border-rose-950/80 transition-all duration-300 flex flex-col h-full cursor-pointer hover:-translate-y-0.5 shadow-lg group"
              >
                {/* Image Frame */}
                <div className="relative w-full pt-[100%] bg-zinc-950 overflow-hidden flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title || item?.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : item.type === 'Release' ? (
                      <div className="w-3/4 h-3/4 border border-zinc-850 shadow-2xl relative z-10 rounded flex items-center justify-center text-zinc-600" style={{ backgroundColor: item.coverColor || '#181a20' }}>
                        <Disc className="w-8 h-8 animate-spin-slow" />
                      </div>
                    ) : (
                      <Tag className="w-10 h-10 text-zinc-800 relative z-10" />
                    )}
                  </div>
                  <div className="absolute top-1.5 right-1.5 bg-black/85 backdrop-blur-md border border-zinc-900 px-1.5 py-0.5 rounded-md z-10">
                    <span className="text-[10px] font-black text-rose-400 font-mono">${(item.price || 25).toFixed(2)}</span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.2 rounded">
                        {item.type === 'Release' ? 'Media' : item.type || 'Apparel'}
                      </span>
                    </div>
                    <h3 className="text-[9px] font-black text-white mt-1.5 leading-snug line-clamp-2 group-hover:text-rose-400 transition-colors uppercase font-mono">
                      {item.title || item?.name || 'UNTITLED ITEM'}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty Search / Filter State matching UniversalSocialFeed */}
          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-zinc-950/20 border border-zinc-900/60 rounded-2xl mb-10">
              <p className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider">No official merch items match the current filters.</p>
            </div>
          )}

        </div>
      </div>

      {/* FLYOUT CART OVERLAY */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="bg-[#0e1015] border-l border-[#252830] w-full max-w-md h-full flex flex-col shadow-2xl relative text-zinc-200"
            >
              <div className="p-5 border-b border-[#252830] flex items-center justify-between bg-black">
                <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2 font-mono">
                  <ShoppingBag className="w-4 h-4 text-rose-500" /> YOUR BAG ({cartTotalItemCount})
                </h3>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <ShoppingBag className="w-12 h-12 text-zinc-800 mb-3" />
                    <p className="text-zinc-500 font-sans text-xs uppercase tracking-wider">Your shopping bag is empty.</p>
                  </div>
                ) : (
                  cart.map((c, i) => (
                    <div key={`tax-row-${i}`} className="flex items-center justify-between bg-[#13161d] p-3 rounded-xl border border-zinc-800/80">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="text-xs font-black text-white leading-tight uppercase line-clamp-2">{c.title}</span>
                        <span className="text-[10px] font-mono text-zinc-500 tracking-wider mt-1 block">VARIANT: {c.variantName}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-zinc-400">x{c.quantity}</span>
                          <span className="text-xs font-mono text-rose-400 font-black">${(c.price * c.quantity).toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => {
                            if (navigator.vibrate) navigator.vibrate(50);
                            setCart(prev => prev.filter(item => !(item.id === c.id && item.variantName === c.variantName)));
                          }}
                          className="text-zinc-650 hover:text-red-500 transition-colors p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-[#252830] bg-[#0A0A0A] space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-zinc-400 tracking-widest uppercase">SUBTOTAL</span>
                    <span className="text-lg font-black text-rose-400 font-mono">${cartTotalValue.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                      triggerNotification("Redirecting to secure terminal...");
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs tracking-widest px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    SECURE CHECKOUT <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHECKOUT SIMULATION OVERLAY */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0d12] border border-zinc-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <CreditCard className="w-12 h-12 text-rose-500 mx-auto animate-pulse" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 font-mono">Checkout Gateway</h3>
                <p className="text-zinc-400 font-sans text-xs">Processing secure Stripe & PayPal connection for <span className="text-rose-400 font-bold">${(cartTotalValue).toFixed(2)}</span>...</p>
              </div>
              <div className="space-y-3 pt-4">
                <button 
                  onClick={() => {
                    triggerNotification("SALE COMPLETED via TEST GATEWAY.");
                    setCart([]);
                    setIsCheckoutOpen(false);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors shadow-lg cursor-pointer"
                >
                  SIMULATE SUCCESS
                </button>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full text-zinc-500 hover:text-zinc-300 font-mono text-[10px] uppercase tracking-widest transition-colors py-2 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHOP DETAIL MODAL */}
      <AnimatePresence>
        {selectedShopItem && (
          <div className="fixed inset-0 bg-[#000000]/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#090a0d] border border-zinc-900 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedShopItem(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/85 border border-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Media frame */}
                <div className="relative aspect-square bg-zinc-950 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-zinc-900">
                  {selectedShopItem.image_url ? (
                    <img 
                      src={selectedShopItem.image_url} 
                      alt={selectedShopItem.title || selectedShopItem.name} 
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain" 
                    />
                  ) : selectedShopItem.type === 'Release' ? (
                    <div className="w-4/5 h-4/5 border border-zinc-800 shadow-2xl relative rounded flex items-center justify-center text-zinc-700 bg-[#15171e]">
                      <Disc className="w-12 h-12 animate-spin-slow" />
                    </div>
                  ) : (
                    <Tag className="w-16 h-16 text-zinc-800" />
                  )}
                </div>

                {/* Details column */}
                <div className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[9px] font-black tracking-widest uppercase text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded font-mono">
                      {selectedShopItem.type === 'Release' ? 'Media Release' : 'Official Merch'}
                    </span>
                    <h3 className="text-sm font-black text-white uppercase tracking-tight mt-3 mb-2 font-mono">
                      {selectedShopItem.title || selectedShopItem.name}
                    </h3>
                    <p className="text-xl font-mono font-black text-rose-400 mb-4">
                      ${(selectedShopItem.price || 25).toFixed(2)}
                    </p>

                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed mb-6">
                      {selectedShopItem.description || `Official, high-quality, authentic and limited-run issue release from the artist's official secure catalog. Shipped with standard mail tracking.`}
                    </p>

                    {selectedShopItem.type === 'Apparel' && (
                      <div className="space-y-2 mb-6 text-left">
                        <label className="text-[10px] font-black text-zinc-500 font-mono tracking-wider uppercase block">SELECT SIZE</label>
                        <div className="flex gap-1.5">
                          {['S', 'M', 'L', 'XL', '2XL'].map((size, sIdx) => (
                            <button 
                              key={`size-${size}-${sIdx}`}
                              onClick={() => setSelectedSize(size)}
                              className={`w-9 h-9 font-mono text-xs font-black rounded-lg border transition-all cursor-pointer ${
                                selectedSize === size 
                                  ? 'bg-rose-600 border-rose-500 text-white' 
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={() => {
                      handleAddToCart(selectedShopItem, selectedShopItem.type === 'Apparel' ? selectedSize : 'Standard');
                      setSelectedShopItem(null);
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)] active:scale-95 cursor-pointer"
                  >
                    ADD TO BAG
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
