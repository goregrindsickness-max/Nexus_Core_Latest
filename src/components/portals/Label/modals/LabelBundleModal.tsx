import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X, Check } from 'lucide-react';

interface LabelBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalogReleases: any;
  catalogApparel: any;
  bundleItems: any[];
  setBundleItems: React.Dispatch<React.SetStateAction<any[]>>;
  bundlePrice: string;
  setBundlePrice: (price: string) => void;
  setPosCart: React.Dispatch<React.SetStateAction<any[]>>;
  showLocalToast: (msg: string) => void;
}

export const LabelBundleModal: React.FC<LabelBundleModalProps> = ({
  isOpen,
  onClose,
  catalogReleases,
  catalogApparel,
  bundleItems,
  setBundleItems,
  bundlePrice,
  setBundlePrice,
  setPosCart,
  showLocalToast
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            className="bg-[#0e1015] border border-[#252830] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative"
          >
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500" />
            
            <button 
              onClick={onClose}
              className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-white transition-colors z-20 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-5 flex flex-col min-h-[400px] justify-between relative z-10">
              <div>
                <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black block flex items-center gap-1.5"><Package className="w-3 h-3" /> Bundle Creator</span>
                <h3 className="text-xs font-bold font-sans text-white uppercase tracking-wider mt-0.5 pr-8">
                  Select Items For Promotion
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto my-4 space-y-2 max-h-[300px] pr-2">
                {([...(Object.values(catalogReleases).flat() as any[]), ...(Object.values(catalogApparel).flat() as any[])]).map((item) => {
                  const variants = item.type === 'Apparel' ? ['S', 'M', 'L', 'XL'] : ['Standard'];
                  return variants.map((variant, idx) => {
                    const isSelected = (bundleItems || []).some(bi => bi.id === item.id && bi.variantName === variant);
                    return (
                      <div 
                        key={`${item.id || 'item'}-${variant}-${idx}`}
                        onClick={() => {
                          if (navigator.vibrate) navigator.vibrate(50);
                          setBundleItems(prev => {
                            if (isSelected) return prev.filter(p => !(p.id === item.id && p.variantName === variant));
                            return [...prev, { id: item.id, title: item.title, variantName: variant, quantity: 1, type: item.type, price: item.price }];
                          });
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected ? 'bg-purple-500/10 border-purple-500 text-purple-100' : 'bg-[#111319] border-zinc-800 text-zinc-400 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold uppercase font-sans leading-tight">{item.title}</span>
                          <span className="text-[9px] font-mono opacity-60">{variant}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                      </div>
                    );
                  });
                })}
              </div>

              {bundleItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 overflow-hidden">
                    <span className="text-zinc-500 font-mono text-sm mr-2">$</span>
                    <input
                      type="number"
                      value={bundlePrice}
                      onChange={(e) => setBundlePrice(e.target.value)}
                      placeholder="Bundle total price..."
                      className="bg-transparent border-none text-base font-mono text-white focus:outline-none w-full placeholder:text-zinc-700"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(50);
                      const finalPrice = parseFloat(bundlePrice);
                      if (bundleItems.length < 2) {
                        showLocalToast("A bundle needs at least 2 items.");
                        return;
                      }
                      if (isNaN(finalPrice) || finalPrice < 0) {
                        showLocalToast("Please enter a valid bundle price.");
                        return;
                      }
                      const totalItems = bundleItems.reduce((acc, curr) => acc + curr.quantity, 0);
                      const pricePerItem = finalPrice / totalItems;
                      
                      const newCartItems = bundleItems.map(bi => ({
                        id: bi.id,
                        title: `${bi.title} (Bundle)`,
                        variant: bi.variantName,
                        quantity: bi.quantity,
                        qty: bi.quantity,
                        price: pricePerItem,
                        type: bi.type || 'Bundle'
                      }));
                      
                      setPosCart(prev => [...prev, ...newCartItems]);
                      onClose();
                      setBundleItems([]);
                      setBundlePrice('');
                      showLocalToast(`Added bundle for $${finalPrice} to basket.`);
                    }}
                    className="w-full py-3.5 bg-gradient-to-tr from-purple-500 to-indigo-500 hover:brightness-110 text-white font-sans font-bold uppercase text-xs tracking-widest rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all outline-none cursor-pointer"
                  >
                    Add Bundle To Cart
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
