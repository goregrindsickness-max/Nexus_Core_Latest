import React, { useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Zap, Timer, Flame, ShieldAlert } from 'lucide-react';
import { FeedPost } from '../types';
import { usePinchZoom } from '../../../../hooks/usePinchZoom';

interface MerchLightboxModalProps {
  activeMerchLightbox: {
    post: FeedPost;
    images: string[];
    activeIndex: number;
  };
  unlockedVipPosts: Record<string, boolean>;
  selectedSizesMap: Record<string, string>;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  onBuyNow: (post: FeedPost, size: string, price: number) => void;
}

export const MerchLightboxModal: React.FC<MerchLightboxModalProps> = ({
  activeMerchLightbox,
  unlockedVipPosts,
  selectedSizesMap,
  onClose,
  onSelectIndex,
  onBuyNow,
}) => {
  const {
    scale,
    reset,
    zoomIn,
    zoomOut,
    containerProps,
    imageStyle,
  } = usePinchZoom({ minScale: 1, maxScale: 4 });

  useEffect(() => {
    reset();
  }, [activeMerchLightbox.activeIndex, reset]);

  const merchData = activeMerchLightbox.post.merchData;
  const currentStock = merchData?.stock ?? 4;
  const totalLimit = merchData?.totalStock || (merchData?.stock ? Math.max(merchData.stock + 15, 25) : 30);
  const isCriticalStock = currentStock <= 5;

  return (
    <div 
      className="fixed inset-0 z-[9999999] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none overflow-hidden"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      tabIndex={0}
    >
      {/* Top Bar / Header Controls */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-800/80 pb-3 z-20">
        <div className="min-w-0 flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-widest block">
                {merchData?.category || 'MERCH DESIGN INSPECTION'}
              </span>
              <span className={`px-2 py-0.2 rounded text-[9px] font-mono font-black uppercase ${
                isCriticalStock ? 'bg-red-500 text-black shadow-sm' : 'bg-amber-500 text-black'
              }`}>
                ⚡ {currentStock} / {totalLimit} UNITS REMAINING
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-mono font-black text-white truncate">
              {merchData?.name}
            </h3>
          </div>
        </div>

        {/* Zoom Controls Bar */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => zoomOut(0.5)}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="text-xs font-mono font-extrabold text-orange-400 px-2 min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => zoomIn(0.5)}
            className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {scale > 1.05 && (
            <button
              onClick={reset}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-2 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-300 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Stage Canvas with Pinch/Touch Zoom & Pan */}
      <div 
        className="flex-1 relative flex items-center justify-center overflow-hidden my-4 group/canvas select-none"
        {...containerProps}
      >
        {/* Gallery Image Display */}
        <div className="relative max-w-full max-h-full flex items-center justify-center">
          <img
            src={activeMerchLightbox.images[activeMerchLightbox.activeIndex]}
            alt={merchData?.name}
            style={{
              ...imageStyle,
              maxHeight: 'calc(80vh - 120px)',
              maxWidth: '90vw'
            }}
            referrerPolicy="no-referrer"
            className={`object-contain rounded-xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] select-none ${
              scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
            draggable={false}
          />
        </div>

        {/* Previous / Next Angle Arrows if multiple images */}
        {activeMerchLightbox.images.length > 1 && scale <= 1.1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex((activeMerchLightbox.activeIndex - 1 + activeMerchLightbox.images.length) % activeMerchLightbox.images.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/80 hover:bg-orange-500 text-white hover:text-black border border-zinc-800 rounded-full transition-all cursor-pointer shadow-2xl z-30"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex((activeMerchLightbox.activeIndex + 1) % activeMerchLightbox.images.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/80 hover:bg-orange-500 text-white hover:text-black border border-zinc-800 rounded-full transition-all cursor-pointer shadow-2xl z-30"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Pinch/Zoom Instruction Hint overlay */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-zinc-400 border border-zinc-800 text-[10px] font-mono px-3 py-1 rounded-full pointer-events-none z-20 flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-orange-400" />
          <span>Scroll wheel, pinch or double-click to zoom in/out</span>
        </div>
      </div>

      {/* Bottom Bar: Thumbnails & Quick Buy Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-zinc-800/80 z-20">
        {/* Additional Angles / Images Thumbnails */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
          {activeMerchLightbox.images.map((imgUrl, idx) => (
            <button
              key={`thumb-${idx}-${imgUrl?.slice(-15) || ''}`}
              onClick={() => onSelectIndex(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                activeMerchLightbox.activeIndex === idx
                  ? 'border-orange-500 ring-2 ring-orange-500/50 scale-105'
                  : 'border-zinc-800 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Quick Checkout in Lightbox */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-zinc-400 block">TOTAL PRICE</span>
            <span className="text-lg font-mono font-black text-orange-400">
              ${(merchData?.price || 0).toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => {
              const p = activeMerchLightbox.post;
              const baseP = (p.isVipExclusive || unlockedVipPosts[p.id])
                ? p.merchData!.price * 0.8
                : p.merchData!.price;
              const sz = selectedSizesMap[p.id] || p.merchData?.sizes[0] || 'Standard';
              onBuyNow(p, sz, baseP);
            }}
            className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.4)] cursor-pointer transition-all transform hover:scale-105"
          >
            <Zap className="w-4 h-4 fill-black" /> 1-CLICK STRIPE CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};
