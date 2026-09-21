import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Tag, Flame, Clock, Shirt } from 'lucide-react';
import { compressImageInSocialFeed } from '../../../utils/socialFeedUtils';

interface MerchDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchDropName: string;
  setMerchDropName: (val: string) => void;
  merchDropPrice: string;
  setMerchDropPrice: (val: string) => void;
  merchDropIsTimed: boolean;
  setMerchDropIsTimed: (val: boolean) => void;
  merchDropTimerHours: string;
  setMerchDropTimerHours: (val: string) => void;
  merchDropTimerMinutes: string;
  setMerchDropTimerMinutes: (val: string) => void;
  merchDropThumbnail: string;
  setMerchDropThumbnail: (val: string) => void;
  triggerNotification?: (msg: string) => void;
}

export const MerchDropModal: React.FC<MerchDropModalProps> = ({
  isOpen,
  onClose,
  merchDropName,
  setMerchDropName,
  merchDropPrice,
  setMerchDropPrice,
  merchDropIsTimed,
  setMerchDropIsTimed,
  merchDropTimerHours,
  setMerchDropTimerHours,
  merchDropTimerMinutes,
  setMerchDropTimerMinutes,
  merchDropThumbnail,
  setMerchDropThumbnail,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0c0d10] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest font-display">Create Merch Drop Flash Card</h3>
            </div>

            <div className="space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Item Name</label>
                <input 
                  type="text"
                  value={merchDropName}
                  onChange={(e) => setMerchDropName(e.target.value)}
                  placeholder="e.g., Exclusive Tour Shirt"
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-rose-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Price ($USD)</label>
                <input 
                  type="text"
                  value={merchDropPrice}
                  onChange={(e) => setMerchDropPrice(e.target.value)}
                  placeholder="e.g., 25"
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-rose-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              {/* Drop Type Selection: Regular vs Timed */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Drop Type</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setMerchDropIsTimed(false)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !merchDropIsTimed 
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5 text-emerald-400" /> Regular Drop
                  </button>
                  <button
                    type="button"
                    onClick={() => setMerchDropIsTimed(true)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      merchDropIsTimed 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" /> Timed Drop
                  </button>
                </div>
              </div>

              {/* Custom Timer Options */}
              {merchDropIsTimed && (
                <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3.5 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-400" /> Custom Timer Duration
                    </label>
                    <span className="text-[9px] font-mono text-zinc-400">
                      Total: {merchDropTimerHours || 0}h {merchDropTimerMinutes || 0}m
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1 font-mono">Presets</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '1 Hour', h: '1', m: '0' },
                        { label: '6 Hours', h: '6', m: '0' },
                        { label: '12 Hours', h: '12', m: '0' },
                        { label: '24 Hours', h: '24', m: '0' },
                        { label: '48 Hours', h: '48', m: '0' },
                        { label: '72 Hours', h: '72', m: '0' }
                      ].map((preset, prIdx) => (
                        <button
                          key={`drop-preset-${preset.label}-${prIdx}`}
                          type="button"
                          onClick={() => {
                            setMerchDropTimerHours(preset.h);
                            setMerchDropTimerMinutes(preset.m);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                            merchDropTimerHours === preset.h && merchDropTimerMinutes === preset.m
                              ? 'bg-amber-500 text-black border-amber-400 font-black'
                              : 'bg-black/60 text-zinc-400 border-zinc-800 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-900/30">
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-zinc-400 font-mono mb-1">Hours</label>
                      <input 
                        type="number"
                        min="0"
                        max="168"
                        value={merchDropTimerHours}
                        onChange={(e) => setMerchDropTimerHours(e.target.value)}
                        placeholder="24"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase text-zinc-400 font-mono mb-1">Minutes</label>
                      <input 
                        type="number"
                        min="0"
                        max="59"
                        value={merchDropTimerMinutes}
                        onChange={(e) => setMerchDropTimerMinutes(e.target.value)}
                        placeholder="0"
                        className="w-full bg-black/80 border border-zinc-800 focus:border-amber-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Merch Item Image Device Uploader */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Merch Photo (Device Upload)</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-950 border border-rose-900/40 flex items-center justify-center shrink-0 shadow-inner">
                      {merchDropThumbnail ? (
                        <img src={merchDropThumbnail} className="w-full h-full object-cover" alt="Merch Preview" referrerPolicy="no-referrer" />
                      ) : (
                        <Shirt className="w-7 h-7 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="inline-block bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg border border-zinc-800 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all">
                        Browse Device...
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                triggerNotification?.("⚠️ Merch photo exceeds 10MB payload limit.");
                                return;
                              }
                              triggerNotification?.("⏳ Loading and compressing photo...");
                              const reader = new FileReader();
                              reader.onload = async () => {
                                try {
                                  const base64 = reader.result as string;
                                  const compressed = await compressImageInSocialFeed(base64, 800, 800, 0.75);
                                  setMerchDropThumbnail(compressed);
                                  triggerNotification?.("✅ Merch image updated from device.");
                                } catch (error) {
                                  console.error("Merch image compression failed:", error);
                                  triggerNotification?.("⚠️ Image loading failed.");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <p className="text-[9px] text-zinc-500 font-mono">PNG, JPG, WEBP or GIF. Max 10MB payload limit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-900 hover:bg-[#1a1c24] text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!merchDropName.trim()) {
                    triggerNotification?.("Please enter a merch item name.");
                    return;
                  }
                  onClose();
                  triggerNotification?.("Merch Drop draft saved. Click Post to publish.");
                }}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg shadow-lg shadow-rose-900/20 transition-colors"
              >
                Attach Merch
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
