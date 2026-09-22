import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Tag, Flame, Clock, Shirt, Plus, Check, Layers, Package, Handshake, AlertCircle, Trash2, Image as ImageIcon, Star, Upload, Link as LinkIcon, Sparkles, Loader2 } from 'lucide-react';
import { compressImageInSocialFeed } from '../../../utils/socialFeedUtils';

export interface MerchDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchDropName: string;
  setMerchDropName: (val: string) => void;
  merchDropPrice: string;
  setMerchDropPrice: (val: string) => void;
  merchDropCategory?: string;
  setMerchDropCategory?: (val: string) => void;
  merchDropDescription?: string;
  setMerchDropDescription?: (val: string) => void;
  merchDropVariants?: string[];
  setMerchDropVariants?: (val: string[]) => void;
  merchDropStock?: string;
  setMerchDropStock?: (val: string) => void;
  merchDropIsUnlimited?: boolean;
  setMerchDropIsUnlimited?: (val: boolean) => void;
  merchDropAllowNegotiation?: boolean;
  setMerchDropAllowNegotiation?: (val: boolean) => void;
  merchDropIsTimed: boolean;
  setMerchDropIsTimed: (val: boolean) => void;
  merchDropTimerHours: string;
  setMerchDropTimerHours: (val: string) => void;
  merchDropTimerMinutes: string;
  setMerchDropTimerMinutes: (val: string) => void;
  merchDropThumbnail: string;
  setMerchDropThumbnail: (val: string) => void;
  merchDropImages?: string[];
  setMerchDropImages?: (val: string[]) => void;
  triggerNotification?: (msg: string) => void;
}

const CATEGORY_PRESETS: { label: string; variants: string[] }[] = [
  { label: 'Apparel', variants: ['S', 'M', 'L', 'XL', '2XL'] },
  { label: 'Extended Apparel', variants: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'] },
  { label: 'Physical Media', variants: ['12" Vinyl LP', 'Cassette Tape', 'CD Digipak', 'Digital Album'] },
  { label: 'One Size / Accessory', variants: ['One Size'] },
  { label: 'Headwear', variants: ['Snapback Hat', 'Beanie', 'Dad Cap'] },
  { label: 'Art / Print', variants: ['11x17 Poster', '18x24 Screenprint', 'Signed Art Print'] },
];

export const MerchDropModal: React.FC<MerchDropModalProps> = ({
  isOpen,
  onClose,
  merchDropName,
  setMerchDropName,
  merchDropPrice,
  setMerchDropPrice,
  merchDropCategory = 'Apparel',
  setMerchDropCategory,
  merchDropDescription = '',
  setMerchDropDescription,
  merchDropVariants = ['S', 'M', 'L', 'XL', '2XL'],
  setMerchDropVariants,
  merchDropStock = '50',
  setMerchDropStock,
  merchDropIsUnlimited = false,
  setMerchDropIsUnlimited,
  merchDropAllowNegotiation = true,
  setMerchDropAllowNegotiation,
  merchDropIsTimed,
  setMerchDropIsTimed,
  merchDropTimerHours,
  setMerchDropTimerHours,
  merchDropTimerMinutes,
  setMerchDropTimerMinutes,
  merchDropThumbnail,
  setMerchDropThumbnail,
  merchDropImages,
  setMerchDropImages,
  triggerNotification,
}) => {
  const [newVariantInput, setNewVariantInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);

  // Active images list (strict max 3)
  const activeImages = (merchDropImages && merchDropImages.length > 0 
    ? merchDropImages 
    : (merchDropThumbnail ? [merchDropThumbnail] : [])
  ).filter(Boolean).slice(0, 3);

  const updateImages = (newImages: string[]) => {
    const capped = newImages.filter(Boolean).slice(0, 3);
    setMerchDropImages?.(capped);
    if (capped.length > 0) {
      setMerchDropThumbnail(capped[0]);
    }
  };

  const handleSetCover = (index: number) => {
    if (index <= 0 || index >= activeImages.length) return;
    const target = activeImages[index];
    const remaining = activeImages.filter((_, i) => i !== index);
    const reordered = [target, ...remaining];
    updateImages(reordered);
    triggerNotification?.(`Set photo #${index + 1} as primary cover.`);
  };

  const handleRemoveImage = (index: number) => {
    if (activeImages.length <= 1) {
      triggerNotification?.('Item must have at least one photo.');
      return;
    }
    const filtered = activeImages.filter((_, i) => i !== index);
    updateImages(filtered);
    triggerNotification?.('Photo removed.');
  };

  const handleProcessFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const availableSlots = 3 - activeImages.length;
    if (availableSlots <= 0) {
      triggerNotification?.('⚠️ Maximum 3 photos reached. Remove an existing photo to upload another.');
      return;
    }

    const toProcess = fileList.slice(0, availableSlots);
    if (fileList.length > availableSlots) {
      triggerNotification?.(`⚠️ Capped at 3 photos max. Adding first ${availableSlots} photo(s)...`);
    } else {
      triggerNotification?.(`⏳ Compressing ${toProcess.length} photo(s)...`);
    }

    setIsProcessingPhotos(true);
    try {
      const compressedList: string[] = [];
      for (const file of toProcess) {
        if (file.size > 10 * 1024 * 1024) {
          triggerNotification?.(`⚠️ ${file.name} exceeds 10MB limit and was skipped.`);
          continue;
        }
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const compressed = await compressImageInSocialFeed(base64, 900, 900, 0.78);
        compressedList.push(compressed);
      }

      if (compressedList.length > 0) {
        updateImages([...activeImages, ...compressedList]);
        triggerNotification?.(`✅ Added ${compressedList.length} photo(s).`);
      }
    } catch (err) {
      console.error('Error processing photos:', err);
      triggerNotification?.('⚠️ Photo processing encountered an error.');
    } finally {
      setIsProcessingPhotos(false);
    }
  };

  const handleAddUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (activeImages.length >= 3) {
      triggerNotification?.('⚠️ Maximum 3 photos allowed. Remove one to add another.');
      return;
    }
    updateImages([...activeImages, trimmed]);
    setImageUrlInput('');
    setShowUrlInput(false);
    triggerNotification?.('✅ Photo URL added.');
  };

  const handleAddVariant = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newVariantInput.trim();
    if (!trimmed) return;
    if (merchDropVariants.includes(trimmed)) {
      triggerNotification?.('Variant already exists.');
      return;
    }
    setMerchDropVariants?.([...merchDropVariants, trimmed]);
    setNewVariantInput('');
  };

  const handleRemoveVariant = (variantToRemove: string) => {
    if (merchDropVariants.length <= 1) {
      triggerNotification?.('Item must have at least one variant or size.');
      return;
    }
    setMerchDropVariants?.(merchDropVariants.filter((v) => v !== variantToRemove));
  };

  const handleApplyPreset = (presetVariants: string[]) => {
    setMerchDropVariants?.(presetVariants);
    triggerNotification?.(`Loaded ${presetVariants.length} variants.`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0c0d10] border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider font-display flex items-center gap-2">
                    Merch Drop Attachment
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-mono">
                    Configure pricing, stock inventory, variants & drop duration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Item Name & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wide mb-1 font-mono">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={merchDropName}
                    onChange={(e) => setMerchDropName(e.target.value)}
                    placeholder="e.g., Blood & Chrome Tour Tee, 12'' Vinyl LP"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wide mb-1 font-mono">
                    Price ($USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-mono text-zinc-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={merchDropPrice}
                      onChange={(e) => setMerchDropPrice(e.target.value)}
                      placeholder="25"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500/60 rounded-xl pl-6 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wide mb-1 font-mono">
                  Merch Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {['Apparel', 'Physical Media', 'Headwear', 'Prints & Art', 'Accessories', 'Collectibles'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setMerchDropCategory?.(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border text-left cursor-pointer truncate ${
                        merchDropCategory === cat
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants / Sizes / Formats Section */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5 font-mono">
                    <Layers className="w-3.5 h-3.5 text-orange-400" /> Sizes / Formats / Variants
                  </label>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {merchDropVariants.length} option{merchDropVariants.length === 1 ? '' : 's'} available
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 mr-1 flex items-center font-mono">
                    Presets:
                  </span>
                  {CATEGORY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyPreset(preset.variants)}
                      className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Current Active Variants Pills */}
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-black/60 rounded-lg border border-zinc-800/80">
                  {merchDropVariants.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-zinc-900 border border-zinc-700/80 text-orange-300 shadow-sm"
                    >
                      <span>{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v)}
                        className="text-zinc-500 hover:text-red-400 ml-0.5 cursor-pointer transition-colors"
                        title="Remove variant"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Custom Variant Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVariantInput}
                    onChange={(e) => setNewVariantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddVariant();
                      }
                    }}
                    placeholder="Add custom size or variant (e.g. 3XL, Blood Red Vinyl, Signed)..."
                    className="flex-1 bg-black border border-zinc-800 focus:border-orange-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddVariant()}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1 border border-zinc-700 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Stock & Quantity Control Section */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5 font-mono">
                    <Package className="w-3.5 h-3.5 text-emerald-400" /> Inventory Stock & Quantity
                  </label>
                  <span className="text-[9px] font-mono text-zinc-500">
                    {merchDropIsUnlimited ? 'Unlimited Run' : `${merchDropStock || 50} Total Units`}
                  </span>
                </div>

                {/* Stock Mode Switch */}
                <div className="grid grid-cols-2 gap-2 bg-black/60 p-1 rounded-xl border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setMerchDropIsUnlimited?.(false)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !merchDropIsUnlimited
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" /> Limited Pressing
                  </button>
                  <button
                    type="button"
                    onClick={() => setMerchDropIsUnlimited?.(true)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      merchDropIsUnlimited
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Unlimited / Open Run
                  </button>
                </div>

                {/* Limited Stock Quantity Input & Presets */}
                {!merchDropIsUnlimited && (
                  <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-400 font-mono">Total Units in Stock:</span>
                      <div className="flex gap-1">
                        {['15', '25', '50', '100', '250', '500'].map((presetQty) => (
                          <button
                            key={presetQty}
                            type="button"
                            onClick={() => setMerchDropStock?.(presetQty)}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                              merchDropStock === presetQty
                                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                                : 'bg-black/60 text-zinc-400 border-zinc-800 hover:text-white'
                            }`}
                          >
                            {presetQty}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={merchDropStock}
                      onChange={(e) => setMerchDropStock?.(e.target.value)}
                      placeholder="50"
                      className="w-full bg-black border border-zinc-800 focus:border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                    />
                    <p className="text-[9px] text-zinc-500 font-mono">
                      Displays a live remaining inventory indicator and claimed progress bar on the post.
                    </p>
                  </div>
                )}
                {merchDropIsUnlimited && (
                  <p className="text-[10px] text-zinc-400 font-mono bg-black/40 p-2 rounded-lg border border-zinc-800/60">
                    📦 Open Inventory: Post will show &ldquo;In Stock / Ready to Ship&rdquo; without sold-out countdowns or artificial limits.
                  </p>
                )}
              </div>

              {/* Drop Type Selection: Regular Drop vs Timed Drop */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Drop Expiration / Timer Mode
                  </label>
                  <span className={`text-[9px] font-mono font-bold ${merchDropIsTimed ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {merchDropIsTimed ? 'Timed Flash Release' : 'Regular Drop (No Timer)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-black/60 p-1 rounded-xl border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setMerchDropIsTimed(false)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      !merchDropIsTimed
                        ? 'bg-zinc-800 text-white border border-zinc-700 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Regular Drop</span>
                    </div>
                    <span className="text-[8px] font-mono text-zinc-400 font-normal">
                      Permanent • No timer attached
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMerchDropIsTimed(true)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      merchDropIsTimed
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Timed Drop</span>
                    </div>
                    <span className="text-[8px] font-mono text-amber-400/80 font-normal">
                      Flash release • Live countdown
                    </span>
                  </button>
                </div>

                {/* Custom Timer Options (ONLY active when Timed Drop is selected) */}
                {merchDropIsTimed && (
                  <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Flash Window Duration
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
                          { label: '72 Hours', h: '72', m: '0' },
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
              </div>

              {/* Item Description (Optional) */}
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wide mb-1 font-mono">
                  Description / Item Specs (Optional)
                </label>
                <textarea
                  rows={2}
                  value={merchDropDescription}
                  onChange={(e) => setMerchDropDescription?.(e.target.value)}
                  placeholder="e.g. Screenprinted on heavyweight 6.5oz black cotton. Limited one-time run."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all font-sans resize-none"
                />
              </div>

              {/* Allow Fan Offers / Negotiations Toggle */}
              <div className="flex items-center justify-between p-3 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="text-xs font-mono font-bold text-zinc-200 block">
                      Allow Fan Price Offers / Negotiations
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      Fans can submit binding counter-offers directly through the in-feed post
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={merchDropAllowNegotiation}
                  onChange={(e) => setMerchDropAllowNegotiation?.(e.target.checked)}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </div>

              {/* Merch Item Images Manager (Max 3 Photos) */}
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black uppercase text-zinc-300 tracking-wider flex items-center gap-1.5 font-mono">
                      <ImageIcon className="w-3.5 h-3.5 text-rose-400" /> Product Photos (Max 3)
                    </label>
                    <span className="text-[9px] text-zinc-500 font-mono block">
                      First photo is your primary cover. Upload up to 3 angles (front, back, details).
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors ${
                    activeImages.length >= 3
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}>
                    {activeImages.length} / 3 {activeImages.length >= 3 ? '(MAX)' : ''}
                  </span>
                </div>

                {/* 3-Slot Visual Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[0, 1, 2].map((slotIdx) => {
                    const imgUrl = activeImages[slotIdx];
                    const isCover = slotIdx === 0;

                    if (imgUrl) {
                      return (
                        <div
                          key={`slot-${slotIdx}-${imgUrl.slice(-10)}`}
                          className={`relative aspect-square rounded-xl overflow-hidden bg-black border group transition-all shadow-md ${
                            isCover 
                              ? 'border-rose-500/70 shadow-[0_0_10px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/50' 
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Angle #${slotIdx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />

                          {/* Top Tag & Delete Overlay */}
                          <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between pointer-events-none z-10">
                            {isCover ? (
                              <span className="bg-gradient-to-r from-rose-600 to-orange-600 text-white font-mono font-black text-[8px] px-1.5 py-0.5 rounded shadow flex items-center gap-0.5 pointer-events-auto">
                                <Star className="w-2.5 h-2.5 fill-white" /> COVER
                              </span>
                            ) : (
                              <span className="bg-black/80 backdrop-blur-sm text-zinc-300 font-mono text-[8px] px-1.5 py-0.5 rounded border border-zinc-700/80 pointer-events-auto">
                                ANGLE #{slotIdx + 1}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(slotIdx);
                              }}
                              className="p-1 rounded-full bg-black/80 hover:bg-rose-600 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-700/80 pointer-events-auto shadow"
                              title="Remove photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Bottom Action: Set as Cover (if not already cover) */}
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => handleSetCover(slotIdx)}
                              className="absolute bottom-0 inset-x-0 py-1 bg-black/85 hover:bg-rose-600 text-rose-300 hover:text-white font-mono text-[8px] font-bold tracking-wider uppercase border-t border-zinc-800 transition-colors flex items-center justify-center gap-1 cursor-pointer opacity-90 group-hover:opacity-100 z-10"
                            >
                              <Star className="w-2.5 h-2.5" /> Make Cover
                            </button>
                          )}
                        </div>
                      );
                    }

                    // Empty slot
                    return (
                      <label
                        key={`empty-slot-${slotIdx}`}
                        className={`aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center p-2 text-center transition-all ${
                          activeImages.length < 3
                            ? 'border-zinc-800 hover:border-rose-500/60 bg-black/30 hover:bg-black/60 cursor-pointer group'
                            : 'border-zinc-900 bg-black/20 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          disabled={activeImages.length >= 3}
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleProcessFiles(e.target.files);
                            }
                          }}
                        />
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-rose-400 group-hover:bg-zinc-800 transition-all mb-1">
                          <Plus className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-mono font-bold text-zinc-400 group-hover:text-zinc-200">
                          Slot #{slotIdx + 1}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-600">
                          {slotIdx === 0 ? 'Primary' : 'Extra Angle'}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Processing Spinner Indicator */}
                {isProcessingPhotos && (
                  <div className="flex items-center gap-2 p-2 bg-rose-950/20 border border-rose-900/40 rounded-lg text-rose-300 text-[10px] font-mono animate-pulse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                    <span>Compressing and optimizing photos for fast loading...</span>
                  </div>
                )}

                {/* Upload & URL Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <label
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                      activeImages.length >= 3
                        ? 'bg-zinc-900 text-zinc-600 border-zinc-800/80 cursor-not-allowed'
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800 cursor-pointer shadow-sm'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-rose-400" />
                    <span>Browse Photos (Max 3)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={activeImages.length >= 3}
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleProcessFiles(e.target.files);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    disabled={activeImages.length >= 3}
                    className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                      activeImages.length >= 3
                        ? 'opacity-40 cursor-not-allowed bg-black/40 text-zinc-600 border-zinc-900'
                        : showUrlInput
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-black/60 text-zinc-400 border-zinc-800 hover:text-white cursor-pointer'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Paste Image URL</span>
                  </button>

                  {/* Reset to standard preset button if needed */}
                  <button
                    type="button"
                    onClick={() => {
                      updateImages([
                        'https://images.unsplash.com/photo-1572913017567-02f06497f1f9?w=500',
                        'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Origin%20Destroyer%20T-Shirt%20copy.jpg',
                        'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Destroy%20the%20Opps.webp'
                      ]);
                      triggerNotification?.('Loaded 3 sample merch photos.');
                    }}
                    className="ml-auto text-[9px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer flex items-center gap-1"
                    title="Load sample 3 angles for testing"
                  >
                    <Sparkles className="w-3 h-3 text-orange-400" /> Sample 3-Pack
                  </button>
                </div>

                {/* Paste URL Input Row */}
                {showUrlInput && (
                  <form onSubmit={handleAddUrl} className="flex gap-2 pt-1 animate-in fade-in duration-150">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="Paste direct image URL (https://...)..."
                      className="flex-1 bg-black border border-zinc-800 focus:border-rose-500/60 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 font-mono focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!imageUrlInput.trim() || activeImages.length >= 3}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors shrink-0"
                    >
                      Add Photo
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-950/70 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl border border-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!merchDropName.trim()) {
                    triggerNotification?.('Please enter a merch item name.');
                    return;
                  }
                  if (merchDropVariants.length === 0) {
                    triggerNotification?.('Please include at least one size or format variant.');
                    return;
                  }
                  onClose();
                  triggerNotification?.('Merch Drop attachment configured. Click Post to publish.');
                }}
                className="flex-1 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-mono font-black text-xs uppercase tracking-wider py-2.5 rounded-xl shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
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

