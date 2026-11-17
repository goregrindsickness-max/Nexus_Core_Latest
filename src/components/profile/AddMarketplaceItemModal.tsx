import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Package, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { getSupabase, uploadBase64ToStorage } from '../../supabase';

export function AddMarketplaceItemModal({ isOpen, onClose, onListingSuccess }: { isOpen: boolean, onClose: () => void, onListingSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Apparel');
  const [condition, setCondition] = useState('New / Sealed');
  const [description, setDescription] = useState('');
  const [shippingPrice, setShippingPrice] = useState('0.00');
  const [shippingScope, setShippingScope] = useState('Ships Worldwide');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg('');
    
    if (!title.trim() || !price || isNaN(Number(price))) {
      setErrorMsg("Title and valid price are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error("Supabase client not available");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("You must be logged in to list items.");

      let uploadedImageUrl = null;
      if (imagePreview) {
        uploadedImageUrl = await uploadBase64ToStorage(imagePreview, 'marketplace', 'listing-');
      }

      const { error } = await supabase
        .from('user_marketplace_items')
        .insert([{
          seller_id: session.user.id,
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          category: category,
          condition: condition,
          shipping_price: parseFloat(shippingPrice || '0'),
          shipping_scope: shippingScope,
          image_url: uploadedImageUrl,
          is_sold: false
        }]);

      if (error) throw error;

      // Reset form
      setTitle('');
      setPrice('');
      setCategory('Apparel');
      setCondition('New / Sealed');
      setDescription('');
      setShippingPrice('0.00');
      setShippingScope('Ships Worldwide');
      setImagePreview(null);
      
      onListingSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error listing item:', err);
      setErrorMsg(err.message || 'Failed to list item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#0b0c0e] border border-zinc-800/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800/60 bg-zinc-950/50 shrink-0">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">List New Item</h2>
            </div>
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto">
            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-400">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Item Photo (Optional)</label>
                <div className="relative w-full h-32 bg-black border-2 border-dashed border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors flex items-center justify-center overflow-hidden group">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-white bg-black/80 px-3 py-1 rounded">Change Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <Upload className="w-6 h-6" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Upload Photo</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Title & Price */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Item Title *</label>
                  <input 
                    type="text" 
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Vintage 1999 Tour Shirt"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
                <div className="w-1/3">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Price ($) *</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    required
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-emerald-400 font-black font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Category & Condition */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Category</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none"
                  >
                    <option value="Apparel">Apparel</option>
                    <option value="Physical Media (Vinyl/CD/Cassette)">Physical Media (Vinyl/CD/Cassette)</option>
                    <option value="Gear & Accessories">Gear & Accessories</option>
                    <option value="Collectibles">Collectibles</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Condition</label>
                  <select 
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none"
                  >
                    <option value="New / Sealed">New / Sealed</option>
                    <option value="Like New">Like New</option>
                    <option value="Used (Good)">Used (Good)</option>
                    <option value="Vintage / Rare">Vintage / Rare</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Description</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Size, measurements, wear details, or specific notes..."
                  rows={3}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 transition-colors resize-none"
                />
              </div>

              {/* Shipping */}
              <div className="flex gap-3 p-3 bg-zinc-950/50 rounded-xl border border-zinc-900">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Shipping Scope</label>
                  <select 
                    value={shippingScope}
                    onChange={e => setShippingScope(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-2 text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 appearance-none"
                  >
                    <option value="Ships Worldwide">Ships Worldwide</option>
                    <option value="Domestic Only">Domestic Only</option>
                    <option value="Local Pick-up Only">Local Pick-up Only</option>
                  </select>
                </div>
                <div className="w-1/3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Shipping Cost</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={shippingPrice}
                    onChange={e => setShippingPrice(e.target.value)}
                    placeholder="0.00"
                    disabled={shippingScope === 'Local Pick-up Only'}
                    className={`w-full bg-black border border-zinc-800 rounded-lg px-2 py-2 text-xs font-mono transition-colors focus:outline-none focus:border-zinc-700 ${shippingScope === 'Local Pick-up Only' ? 'text-zinc-600 opacity-50' : 'text-zinc-300'}`}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800/60 bg-zinc-950/80 flex items-center justify-end gap-3 shrink-0">
            <button 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              CANCEL
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-black text-xs font-black uppercase tracking-widest rounded transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  LISTING...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  LIST ITEM
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
