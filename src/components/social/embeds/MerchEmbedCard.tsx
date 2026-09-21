import React, { useState, useEffect } from 'react';
import { Flame, Zap, ZoomIn, Handshake, X, ShoppingCart, Timer, ShieldAlert, Sparkles } from 'lucide-react';
import { FeedPost, formatFullSizeName } from '../TimelineFeed';

export const MerchCountdownTimer: React.FC<{ expiresAt?: string; durationHours?: number }> = ({ expiresAt, durationHours }) => {
  const targetTime = React.useMemo(() => {
    if (expiresAt) {
      const parsed = new Date(expiresAt).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) return parsed;
    }
    const hrs = durationHours || 18;
    return Date.now() + hrs * 3600000;
  }, [expiresAt, durationHours]);

  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.floor((targetTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/90 border border-red-500/50 rounded-lg text-red-400 font-mono text-[11px] font-black tracking-wide shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.25)]">
      <Timer className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
      <span className="text-zinc-400 text-[10px] uppercase font-bold hidden sm:inline">DROP CLOSES IN:</span>
      <span className="text-red-300 font-extrabold tracking-widest">{pad(hours)}h {pad(minutes)}m {pad(seconds)}s</span>
    </div>
  );
};

interface MerchEmbedCardProps {
  post: FeedPost;
  unlockedVipPosts: Record<string, boolean>;
  selectedSizesMap: Record<string, string>;
  setSelectedSizesMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  offerStatusMap: Record<string, { status: 'submitted' | 'counter' | 'accepted'; amount: number; counterAmount?: number; message: string }>;
  setOfferStatusMap: React.Dispatch<React.SetStateAction<Record<string, { status: 'submitted' | 'counter' | 'accepted'; amount: number; counterAmount?: number; message: string }>>>;
  activeNegotiationPostId: string | null;
  setActiveNegotiationPostId: (id: string | null) => void;
  offerValues: Record<string, string>;
  setOfferValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  openMerchLightbox: (post: FeedPost) => void;
  onCheckout: (post: FeedPost, size: string, price: number, isNegotiated?: boolean) => void;
  onAddToCart?: (item: { title: string; bandName: string; price: number; format: string }) => void;
  setCartNotice: (notice: string | null) => void;
}

export const MerchEmbedCard: React.FC<MerchEmbedCardProps> = ({
  post,
  unlockedVipPosts,
  selectedSizesMap,
  setSelectedSizesMap,
  offerStatusMap,
  setOfferStatusMap,
  activeNegotiationPostId,
  setActiveNegotiationPostId,
  offerValues,
  setOfferValues,
  openMerchLightbox,
  onCheckout,
  onAddToCart,
  setCartNotice,
}) => {
  if (!post.merchData) return null;

  // Real-time limited drop stock calculations
  const totalLimit = post.merchData.totalStock || (post.merchData.stock ? Math.max(post.merchData.stock + 15, 25) : 30);
  const currentStock = post.merchData.stock ?? 4;
  const claimedPercent = Math.min(100, Math.max(10, Math.round(((totalLimit - currentStock) / totalLimit) * 100)));
  const isCriticalStock = currentStock <= 5;

  return (
    <div className="bg-[#0f0d11] rounded-2xl border border-orange-500/50 overflow-hidden mb-3.5 shadow-[0_0_25px_rgba(249,115,22,0.15)] transition-all">
      {/* Top Banner: Limited Drop Live Urgency Bar */}
      <div className={`px-3 py-1.5 border-b flex items-center justify-between gap-2 text-xs font-mono font-black uppercase ${
        isCriticalStock
          ? 'bg-gradient-to-r from-red-950 via-red-900/60 to-black border-red-500/50 text-red-300'
          : 'bg-gradient-to-r from-amber-950 via-orange-950/60 to-black border-orange-500/40 text-amber-300'
      }`}>
        <div className="flex items-center gap-1.5">
          <Zap className={`w-3.5 h-3.5 ${isCriticalStock ? 'text-red-400 animate-bounce' : 'text-amber-400 animate-pulse'}`} />
          <span>{isCriticalStock ? '⚡ CRITICAL LOW STOCK' : '⚡ LIMITED PRESSING DROP'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 font-bold hidden sm:inline">{claimedPercent}% CLAIMED</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
            isCriticalStock ? 'bg-red-500 text-black shadow-sm' : 'bg-amber-500 text-black'
          }`}>
            {currentStock} / {totalLimit} LEFT
          </span>
        </div>
      </div>

      {/* Progress Bar for Stock Depletion */}
      <div className="w-full bg-zinc-950 h-1.5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-700 ${
            isCriticalStock 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
              : 'bg-gradient-to-r from-amber-500 to-orange-500'
          }`}
          style={{ width: `${claimedPercent}%` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row">
        {/* Left Side - Image & Badges (Fills container & clickable for Lightbox) */}
        <div 
          onClick={() => openMerchLightbox(post)}
          className="relative w-full sm:w-2/5 bg-zinc-950 min-h-[190px] sm:min-h-[210px] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-zinc-800/80 overflow-hidden cursor-pointer group/merch-img"
        >
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            <div className="bg-orange-500 text-black text-[9px] font-bold font-mono px-2 py-1 rounded shadow-md flex items-center gap-1">
              <Flame className="w-3 h-3 fill-black" /> {post.merchData.category || 'MARKETPLACE DROP'}
            </div>
            {isCriticalStock && (
              <div className="bg-red-950/90 text-red-400 border border-red-500/40 text-[9px] font-bold font-mono px-2 py-0.5 rounded shadow-md flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-red-400" /> ONLY {currentStock} LEFT
              </div>
            )}
          </div>

          <img
            src={post.merchData.thumbnail}
            alt={post.merchData.name}
            className="w-full h-full min-h-[190px] sm:min-h-[210px] object-cover transition-transform duration-500 group-hover/merch-img:scale-105"
          />

          {/* Click/Hover to inspect design badge overlay */}
          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-md text-orange-400 border border-orange-500/40 text-[9px] font-mono font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-lg opacity-90 group-hover/merch-img:opacity-100 transition-all">
            <ZoomIn className="w-3.5 h-3.5" /> INSPECT / ZOOM DESIGN
          </div>
        </div>

        {/* Right Side - Item Details & Interactive Actions */}
        <div className="w-full sm:w-3/5 p-3.5 sm:p-4.5 flex flex-col justify-between space-y-2">
          <div>
            {/* Category & Condition */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                {post.merchData.condition || 'Official Band Item'}
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                BY @{post.authorName}
              </span>
            </div>

            <h4 className="text-white font-mono font-bold text-sm sm:text-base leading-snug mb-1.5">
              {post.merchData.name}
            </h4>

            {/* Price, VIP Discount & Countdown Timer Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-baseline gap-2">
                {(post.isVipExclusive || unlockedVipPosts[post.id]) ? (
                  <>
                    <span className="text-amber-400 font-mono font-black text-xl sm:text-2xl">
                      ${(post.merchData.price * 0.8).toFixed(2)}
                    </span>
                    <span className="text-zinc-500 font-mono line-through text-xs sm:text-sm">
                      ${post.merchData.price.toFixed(2)}
                    </span>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                      VIP -20%
                    </span>
                  </>
                ) : (
                  <span className="text-orange-500 font-mono font-black text-xl sm:text-2xl">
                    ${post.merchData.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Active Countdown Timer for Timed Exclusive Releases */}
              {(post.merchData.isTimed || post.merchData.expiresAt || true) && (
                <MerchCountdownTimer expiresAt={post.merchData.expiresAt} durationHours={post.merchData.durationHours} />
              )}
            </div>

            {/* Size / Format Selection Row */}
            {post.merchData.sizes && post.merchData.sizes.length > 0 && (
              <div className="mb-2 p-2 bg-black/60 rounded-xl border border-zinc-800/80 flex items-center justify-between gap-2.5">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider shrink-0">
                  SIZE / FORMAT:
                </span>
                <select
                  value={selectedSizesMap[post.id] || post.merchData.sizes[0]}
                  onChange={(e) => setSelectedSizesMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                  className="bg-zinc-900 text-orange-400 border border-orange-500/40 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-orange-500 cursor-pointer min-w-[130px] flex-1 sm:flex-none"
                >
                  {post.merchData.sizes.map((sz, szIdx) => (
                    <option key={`merch-sz-${sz}-${szIdx}`} value={sz} className="bg-zinc-950 text-white font-mono">
                      {formatFullSizeName(sz)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Negotiation Status Panel if an offer was submitted */}
            {offerStatusMap[post.id] && (
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/40 text-xs font-mono mb-3 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-purple-300 font-bold flex items-center gap-1">
                    <Handshake className="w-3.5 h-3.5 text-purple-400" /> OFFER STATUS
                  </span>
                  <span className="text-[10px] text-purple-400 uppercase font-black">
                    ${offerStatusMap[post.id].amount.toFixed(2)} SUBMITTED
                  </span>
                </div>
                <p className="text-zinc-300 text-[11px]">{offerStatusMap[post.id].message}</p>

                {offerStatusMap[post.id].status === 'counter' && offerStatusMap[post.id].counterAmount && (
                  <div className="flex items-center justify-between pt-1 border-t border-purple-900/50">
                    <span className="text-emerald-400 font-bold text-[11px]">
                      COUNTER OFFER: ${offerStatusMap[post.id].counterAmount?.toFixed(2)}
                    </span>
                    <button
                      onClick={() => {
                        const finalPrice = offerStatusMap[post.id].counterAmount!;
                        const sz = selectedSizesMap[post.id] || post.merchData?.sizes[0] || 'Standard';
                        onCheckout(post, sz, finalPrice, true);
                      }}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[10px] uppercase rounded shadow-md transition-colors cursor-pointer"
                    >
                      ACCEPT &amp; CHECKOUT
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Inline Offer Entry Form */}
            {activeNegotiationPostId === post.id && !offerStatusMap[post.id] && (
              <div className="p-3 rounded-xl bg-zinc-950 border border-orange-500/40 space-y-2 mb-3">
                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-orange-400 uppercase">
                  <span>SUBMIT CUSTOM OFFER</span>
                  <span>LIST PRICE: ${post.merchData.price}</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-xs">$</span>
                    <input
                      type="number"
                      placeholder={(post.merchData.price * 0.85).toFixed(0)}
                      value={offerValues[post.id] || ''}
                      onChange={(e) => setOfferValues(prev => ({ ...prev, [post.id]: e.target.value }))}
                      className="w-full pl-6 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const amt = parseFloat(offerValues[post.id]);
                      if (!amt || amt <= 0) return;
                      
                      const listP = post.merchData?.price || 50;
                      if (amt >= listP * 0.9) {
                        setOfferStatusMap(prev => ({
                          ...prev,
                          [post.id]: {
                            status: 'accepted',
                            amount: amt,
                            message: `🎉 Offer of $${amt.toFixed(2)} accepted by ${post.authorName}! Ready for instant checkout.`
                          }
                        }));
                      } else {
                        const counterP = Math.round(listP * 0.92);
                        setOfferStatusMap(prev => ({
                          ...prev,
                          [post.id]: {
                            status: 'counter',
                            amount: amt,
                            counterAmount: counterP,
                            message: `⌛ Vendor reviewed your $${amt.toFixed(2)} offer and countered with $${counterP.toFixed(2)}.`
                          }
                        }));
                      }
                      setActiveNegotiationPostId(null);
                    }}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-mono font-bold text-xs uppercase rounded transition-colors cursor-pointer"
                  >
                    SEND OFFER
                  </button>
                  <button
                    onClick={() => setActiveNegotiationPostId(null)}
                    className="px-2 py-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const baseP = (post.isVipExclusive || unlockedVipPosts[post.id]) 
                  ? post.merchData!.price * 0.8 
                  : post.merchData!.price;
                const sz = selectedSizesMap[post.id] || post.merchData?.sizes[0] || 'Standard';
                onCheckout(post, sz, baseP);
              }}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all cursor-pointer transform hover:scale-[1.01]"
            >
              <Zap className="w-3.5 h-3.5 fill-black" /> 1-CLICK STRIPE CHECKOUT
            </button>

            {post.merchData.allowNegotiation !== false && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNegotiationPostId(activeNegotiationPostId === post.id ? null : post.id);
                }}
                className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-purple-400 border border-purple-500/30 hover:border-purple-500/60 font-mono font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Negotiate Price"
              >
                <Handshake className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">OFFER</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToCart && post.merchData) {
                  const finalP = (post.isVipExclusive || unlockedVipPosts[post.id]) ? post.merchData.price * 0.8 : post.merchData.price;
                  onAddToCart({
                    title: post.merchData.name,
                    bandName: post.authorName,
                    price: finalP,
                    format: selectedSizesMap[post.id] || post.merchData.sizes[0] || 'Standard'
                  });
                  setCartNotice(`Added "${post.merchData.name}" to cart!`);
                  setTimeout(() => setCartNotice(null), 2000);
                }
              }}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors cursor-pointer"
              title="Add to standard cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
