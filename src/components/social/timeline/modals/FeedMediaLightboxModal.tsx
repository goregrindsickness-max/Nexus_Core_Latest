import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Camera, 
  Sliders, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Info,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { usePinchZoom } from '../../../../hooks/usePinchZoom';

interface FeedMediaLightboxModalProps {
  lightbox: { images: string[]; index: number };
  onClose: () => void;
  onSetIndex: (index: number) => void;
}

// Stage live filter styles
const STAGE_FILTERS = [
  { id: 'raw', name: 'Raw Pit', filter: 'none', icon: '📸' },
  { id: 'trix', name: 'Tri-X B&W Grit', filter: 'grayscale(100%) contrast(140%) brightness(95%)', icon: '🎞️' },
  { id: 'infrared', name: 'Infrared Fire', filter: 'sepia(80%) hue-rotate(315deg) saturate(220%) contrast(125%)', icon: '🔥' },
  { id: 'cyber', name: 'Cyber Neon', filter: 'contrast(120%) saturate(150%) hue-rotate(15deg)', icon: '🌆' }
];

export const FeedMediaLightboxModal: React.FC<FeedMediaLightboxModalProps> = ({
  lightbox,
  onClose,
  onSetIndex,
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
  const [commentInput, setCommentInput] = useState<string>('');
  const [comments, setComments] = useState<Array<{ user: string; avatarChar: string; roleColor: string; time: string; text: string }>>([
    { user: 'metalhead99', avatarChar: 'M', roleColor: 'text-rose-500', time: '2h ago', text: 'This pit lighting and framing is insane!' },
    { user: 'shutter_pit', avatarChar: 'S', roleColor: 'text-purple-400', time: '1h ago', text: 'Shot on Sony A7 IV + 24-70 GM. Shutter speed kept at 1/500s to freeze the circle pit.' },
    { user: 'slam_fiend', avatarChar: 'F', roleColor: 'text-emerald-400', time: '25m ago', text: 'Stage presence captured perfectly.' }
  ]);

  // Reset zoom on index or modal change
  useEffect(() => {
    reset();
  }, [lightbox.index, reset]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && lightbox.index > 0 && scale <= 1.05) {
        onSetIndex(lightbox.index - 1);
      } else if (e.key === 'ArrowRight' && lightbox.index < lightbox.images.length - 1 && scale <= 1.05) {
        onSetIndex(lightbox.index + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox.index, lightbox.images.length, scale, onClose, onSetIndex]);

  const currentImageUrl = lightbox.images[lightbox.index] || '';

  const activeFilterStyle = STAGE_FILTERS.find(f => f.id === activeFilterId)?.filter || 'none';

  const handleCopyLink = () => {
    if (!currentImageUrl) return;
    navigator.clipboard?.writeText(currentImageUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownload = () => {
    if (!currentImageUrl) return;
    const a = document.createElement('a');
    a.href = currentImageUrl;
    a.download = `nexus-photo-pit-master-${lightbox.index + 1}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments(prev => [
      ...prev,
      { user: 'You', avatarChar: 'Y', roleColor: 'text-rose-400', time: 'Just now', text: commentInput.trim() }
    ]);
    setCommentInput('');
  };

  return (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-2 sm:p-6 select-none overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full h-full max-w-7xl flex items-center justify-center pointer-events-none">
        {/* Top Control Bar with Close, Filter Selector, EXIF button & Zoom Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-auto gap-2 flex-wrap">
          {/* Zoom Controls Bar */}
          <div className="flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl">
            <button 
              onClick={() => zoomOut(0.5)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono font-bold text-zinc-300 px-1 min-w-[34px] text-center select-none">
              {Math.round(scale * 100)}%
            </span>
            <button 
              onClick={() => zoomIn(0.5)}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale > 1.05 && (
              <button 
                onClick={reset}
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pit Filter Presets Bar */}
          <div className="hidden sm:flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl">
            {STAGE_FILTERS.map((f, fIdx) => (
              <button
                key={`stage-filter-${f.id}-${fIdx}`}
                onClick={() => setActiveFilterId(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  activeFilterId === f.id
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={`Apply ${f.name} filter`}
              >
                <span>{f.icon}</span>
                <span>{f.name}</span>
              </button>
            ))}
          </div>

          {/* Right utility buttons: EXIF Specs, Copy Link, Download, Close */}
          <div className="flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl">
            <button
              onClick={() => setShowExifDrawer(prev => !prev)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-colors flex items-center gap-1.5 cursor-pointer ${
                showExifDrawer ? 'bg-purple-900/80 text-purple-200 border border-purple-500/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
              title="Camera Specs & EXIF Data"
            >
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">EXIF Specs</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Copy Image URL"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Download Master Resolution"
            >
              <Download className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-zinc-800 mx-0.5" />

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950/80 text-white transition-colors cursor-pointer"
              title="Close Lightbox"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Previous Button */}
        {lightbox.index > 0 && scale <= 1.1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSetIndex(lightbox.index - 1); }}
            className="absolute left-3 sm:left-6 z-40 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors border border-white/10 shadow-2xl pointer-events-auto cursor-pointer"
            title="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button */}
        {lightbox.index < lightbox.images.length - 1 && scale <= 1.1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSetIndex(lightbox.index + 1); }}
            className="absolute right-3 sm:right-6 z-40 p-3 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors border border-white/10 shadow-2xl pointer-events-auto cursor-pointer"
            title="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Image Stage Container */}
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden pointer-events-auto"
          {...containerProps}
        >
          <img 
            src={currentImageUrl} 
            alt={`Photo ${lightbox.index + 1}`} 
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.src = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20live%20music%20concert%201.png';
            }}
            className={`max-w-full max-h-[82vh] object-contain rounded-md shadow-2xl select-none transition-all duration-300 ${
              scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
            }`}
            style={{
              ...imageStyle,
              filter: activeFilterStyle
            }}
            draggable={false}
          />
          
          {/* Bottom Indicators & Thumbnails Bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-white font-mono text-xs tracking-wider shadow-2xl pointer-events-auto">
            <span className="text-zinc-400 text-[11px] font-bold">
              {lightbox.index + 1} / {lightbox.images.length}
            </span>
          </div>
        </div>

        {/* Floating EXIF Camera Specs Drawer */}
        {showExifDrawer && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute left-4 top-20 w-72 bg-[#090b10]/95 backdrop-blur-xl border border-purple-900/60 rounded-2xl p-4 shadow-2xl z-50 pointer-events-auto space-y-3 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-black uppercase">
                <Camera className="w-4 h-4 text-purple-400" />
                <span>Photo Pit EXIF Metadata</span>
              </div>
              <button 
                onClick={() => setShowExifDrawer(false)}
                className="text-zinc-500 hover:text-white p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                <span className="text-zinc-500 uppercase">Camera Body</span>
                <span className="text-white font-bold">Sony A7 IV Mirrorless</span>
              </div>
              <div className="flex justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-900">
                <span className="text-zinc-500 uppercase">Lens Attached</span>
                <span className="text-purple-300 font-bold">FE 24-70mm f/2.8 GM II</span>
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
                <span className="text-zinc-500 uppercase">Master Format</span>
                <span className="text-emerald-400 font-bold">Uncompressed RAW (4K)</span>
              </div>
            </div>
          </div>
        )}

        {/* Discourse / Comments Panel */}
        <div className="hidden xl:flex absolute right-0 top-16 bottom-16 w-80 bg-[#090b10]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex-col overflow-hidden pointer-events-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-white/10 bg-zinc-900/40 flex items-center justify-between">
            <h3 className="text-white font-mono font-black uppercase tracking-widest text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Photo Pit Discourse
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">{comments.length} Notes</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {comments.map((c, i) => (
              <div key={`lightbox-comm-${c.user}-${i}`} className="flex gap-2.5">
                <div className={`w-7 h-7 rounded-full bg-zinc-900 shrink-0 border border-white/10 flex items-center justify-center font-bold text-xs ${c.roleColor}`}>
                  {c.avatarChar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-bold">{c.user}</span>
                    <span className="text-zinc-500 text-[10px] font-mono">{c.time}</span>
                  </div>
                  <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed font-sans">{c.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="p-3 border-t border-white/10 bg-zinc-900/40">
            <div className="flex items-center gap-2 bg-black/70 rounded-xl border border-white/10 p-1.5 focus-within:border-rose-500/60 transition-colors">
              <input 
                type="text" 
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Comment on framing or lighting..." 
                className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder-zinc-500 px-2 font-sans" 
              />
              <button 
                type="submit" 
                className="text-rose-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                title="Post Comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
