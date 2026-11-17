import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Camera, 
  Download, 
  Copy, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { usePinchZoom } from '../../../hooks/usePinchZoom';

export interface PhotoLightboxModalProps {
  previewImage: string | null;
  setPreviewImage: (val: string | null) => void;
}

const STAGE_FILTERS = [
  { id: 'raw', name: 'Raw Pit', filter: 'none', icon: '📸' },
  { id: 'trix', name: 'Tri-X B&W', filter: 'grayscale(100%) contrast(140%) brightness(95%)', icon: '🎞️' },
  { id: 'infrared', name: 'Infrared Red', filter: 'sepia(80%) hue-rotate(315deg) saturate(220%) contrast(125%)', icon: '🔥' },
  { id: 'cyber', name: 'Cyber Neon', filter: 'contrast(120%) saturate(150%) hue-rotate(15deg)', icon: '🌆' }
];

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  previewImage,
  setPreviewImage,
}) => {
  const {
    scale,
    setScale,
    reset,
    zoomIn,
    zoomOut,
    containerProps,
    imageStyle,
  } = usePinchZoom({ minScale: 1, maxScale: 4 });

  const [activeFilterId, setActiveFilterId] = useState<string>('raw');
  const [showExifDrawer, setShowExifDrawer] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (previewImage) {
      reset();
    }
  }, [previewImage, reset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setPreviewImage]);

  const activeFilterStyle = STAGE_FILTERS.find(f => f.id === activeFilterId)?.filter || 'none';

  const handleCopyLink = () => {
    if (!previewImage) return;
    navigator.clipboard?.writeText(previewImage);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    if (!previewImage) return;
    const a = document.createElement('a');
    a.href = previewImage;
    a.download = `nexus-pit-photo-${Date.now()}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      {previewImage && (
        <motion.div
          key="photo-lightbox-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999999] bg-black/95 backdrop-blur-xl flex flex-col justify-between items-center py-4 px-4 select-none overflow-hidden"
        >
          {/* Top Toolbar */}
          <div className="w-full flex items-center justify-between max-w-5xl z-20 bg-zinc-950/85 backdrop-blur-md p-2.5 rounded-2xl border border-zinc-800/80 shadow-2xl gap-2 flex-wrap">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                Photo Pit High-Res Stage Inspection
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">Pinch / Scroll to zoom • Drag to pan • Aspect Ratio Locked</span>
            </div>

            {/* Filter Pills */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-900/90 rounded-xl p-1 border border-zinc-800">
              {STAGE_FILTERS.map((f, fIdx) => (
                <button
                  key={`photo-lightbox-filter-${f.id}-${fIdx}`}
                  onClick={() => setActiveFilterId(f.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    activeFilterId === f.id
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.name}</span>
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowExifDrawer(prev => !prev)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase border transition-colors flex items-center gap-1 cursor-pointer ${
                  showExifDrawer
                    ? 'bg-purple-900/80 text-purple-200 border-purple-500/50'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title="Camera Specs"
              >
                <Camera className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Specs</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Copy Image URL"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleDownload}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Download High-Res"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={reset}
                className="px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 text-xs font-bold uppercase rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-rose-950/80 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Close Photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Floating EXIF Camera Specs Drawer */}
          {showExifDrawer && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="absolute left-6 top-20 w-72 bg-[#090b10]/95 backdrop-blur-xl border border-purple-900/60 rounded-2xl p-4 shadow-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-black uppercase">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>Optics & EXIF Profile</span>
                </div>
                <button onClick={() => setShowExifDrawer(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-[11px] font-mono">
                <div className="flex justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                  <span className="text-zinc-500 uppercase">Camera</span>
                  <span className="text-white font-bold">Sony A7 IV Mirrorless</span>
                </div>
                <div className="flex justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                  <span className="text-zinc-500 uppercase">Lens Attached</span>
                  <span className="text-purple-300 font-bold">FE 24-70mm f/2.8 GM</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900 text-center">
                    <span className="text-zinc-500 block text-[9px] uppercase">Shutter</span>
                    <span className="text-white font-bold">1/500s</span>
                  </div>
                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900 text-center">
                    <span className="text-zinc-500 block text-[9px] uppercase">Aperture</span>
                    <span className="text-white font-bold">f/2.8</span>
                  </div>
                  <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-900 text-center">
                    <span className="text-zinc-500 block text-[9px] uppercase">ISO</span>
                    <span className="text-amber-400 font-bold">3200</span>
                  </div>
                </div>
                <div className="flex justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                  <span className="text-zinc-500 uppercase">Color Space</span>
                  <span className="text-emerald-400 font-bold">sRGB 4K Ultra-Res</span>
                </div>
              </div>
            </div>
          )}

          {/* Central Viewport for Image */}
          <div
            className="flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2 relative"
            {...containerProps}
          >
            <img
              src={previewImage}
              alt="Photo Pit High-Res Preview"
              referrerPolicy="no-referrer"
              className={`max-h-[75vh] max-w-[95vw] object-contain rounded-lg shadow-2xl select-none transition-all duration-200 ${
                scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
              }`}
              style={{
                ...imageStyle,
                filter: activeFilterStyle
              }}
              draggable={false}
            />
          </div>

          {/* Bottom Scale Slider controls */}
          <div className="w-full max-w-md z-20 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3 flex items-center gap-4 shadow-2xl">
            <button
              onClick={() => zoomOut(0.5)}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center font-black text-white hover:text-rose-400 transition-colors border border-zinc-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <div className="flex-1 flex flex-col gap-1 items-center">
              <div className="flex justify-between w-full text-[9px] font-mono text-zinc-400 uppercase font-bold">
                <span>PIT MAGNIFICATION</span>
                <span className="text-rose-400 font-black">{Math.round(scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="0.05"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full accent-rose-500 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => zoomIn(0.5)}
              className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center font-black text-white hover:text-rose-400 transition-colors border border-zinc-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
