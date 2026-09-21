import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Upload, Trash2, ShoppingBag } from 'lucide-react';
import { compressImageInSocialFeed } from '../../../utils/socialFeedUtils';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCategory: string;
  setItemCategory: (val: string) => void;
  itemTitle: string;
  setItemTitle: (val: string) => void;
  itemDescription: string;
  setItemDescription: (val: string) => void;
  itemPrice: string;
  setItemPrice: (val: string) => void;
  itemLocation: string;
  setItemLocation: (val: string) => void;
  itemImages: string[];
  setItemImages: React.Dispatch<React.SetStateAction<string[]>>;
  onSave: () => void;
  triggerNotification?: (msg: string) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  itemCategory,
  setItemCategory,
  itemTitle,
  setItemTitle,
  itemDescription,
  setItemDescription,
  itemPrice,
  setItemPrice,
  itemLocation,
  setItemLocation,
  itemImages,
  setItemImages,
  onSave,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0c0d10] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 relative my-auto"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest font-display">Create Marketplace Listing</h3>
            </div>

            <div className="space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Category *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gear', label: 'Music Gear' },
                    { id: 'merch', label: 'Band Merch' },
                    { id: 'tickets', label: 'Gig Ticket' },
                    { id: 'vinyl', label: 'Vinyl / Tapes' },
                    { id: 'apparel', label: 'Apparel' },
                    { id: 'other', label: 'Other' },
                  ].map((cat, catIdx) => (
                    <button
                      key={`add-item-cat-${cat.id}-${catIdx}`}
                      type="button"
                      onClick={() => setItemCategory(cat.id)}
                      className={`p-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        itemCategory === cat.id
                          ? 'bg-amber-950/40 border-amber-500/70 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-400'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Price */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Item Title *</label>
                  <input 
                    type="text"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="e.g. 1984 Marshall JCM800 Head"
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-amber-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Price ($) *</label>
                  <input 
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="1200"
                    className="w-full bg-zinc-950 border border-zinc-900 focus:border-amber-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Location / City</label>
                <input 
                  type="text"
                  value={itemLocation}
                  onChange={(e) => setItemLocation(e.target.value)}
                  placeholder="e.g. Chicago, IL (or Ships Worldwide)"
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-amber-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Description & Condition</label>
                <textarea 
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Describe the condition, specs, or shipping requirements..."
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-amber-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Device Image Uploader */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1.5">Photos (Device Upload)</label>
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {itemImages.map((img, idx) => (
                      <div key={`item-img-${idx}`} className="relative aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group">
                        <img src={img} className="w-full h-full object-cover" alt="" />
                        <button
                          onClick={() => setItemImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 bg-black/80 hover:bg-rose-600 p-1 rounded-full text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {itemImages.length < 4 && (
                      <label className="aspect-square rounded-xl border border-dashed border-zinc-800 hover:border-amber-500/50 bg-zinc-950 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-amber-500/5">
                        <Upload className="w-5 h-5 text-zinc-600 mb-1" />
                        <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">Upload</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple 
                          className="hidden" 
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              files.forEach(async (file) => {
                                if (file.size > 10 * 1024 * 1024) {
                                  triggerNotification?.("⚠️ Image exceeds 10MB payload limit.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  try {
                                    const base64 = reader.result as string;
                                    const compressed = await compressImageInSocialFeed(base64, 800, 800, 0.75);
                                    setItemImages(prev => [...prev, compressed].slice(0, 4));
                                  } catch (err) {
                                    console.error("Image upload failed:", err);
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-900 hover:bg-[#1a1c24] text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!itemTitle.trim() || !itemPrice.trim()) {
                    triggerNotification?.("Please provide both title and price.");
                    return;
                  }
                  onSave();
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest py-2.5 rounded-lg shadow-lg shadow-amber-900/20 transition-colors cursor-pointer"
              >
                Publish Listing
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
