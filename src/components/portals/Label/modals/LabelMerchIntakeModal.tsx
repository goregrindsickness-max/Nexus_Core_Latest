import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X } from 'lucide-react';

interface MerchIntakeForm {
  title: string;
  qty: number;
  cost: number;
}

interface LabelMerchIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchIntakeForm: MerchIntakeForm;
  setMerchIntakeForm: React.Dispatch<React.SetStateAction<MerchIntakeForm>>;
  showLocalToast: (msg: string) => void;
}

export const LabelMerchIntakeModal: React.FC<LabelMerchIntakeModalProps> = ({
  isOpen,
  onClose,
  merchIntakeForm,
  setMerchIntakeForm,
  showLocalToast
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
          >
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <div className="flex items-center gap-2 text-blue-400">
                <Package className="w-5 h-5" />
                <h3 className="font-mono font-black tracking-widest text-sm">MERCH PRODUCTION INTAKE</h3>
              </div>
              <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Item Name</label>
                <input
                  type="text"
                  value={merchIntakeForm.title}
                  onChange={e => setMerchIntakeForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white font-sans text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="e.g. Tour Hoodies Batch 2"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Quantity Received</label>
                  <input
                    type="number"
                    value={merchIntakeForm.qty || ''}
                    onChange={e => setMerchIntakeForm(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white font-sans text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1 block">Unit Cost ($)</label>
                  <input
                    type="number"
                    value={merchIntakeForm.cost || ''}
                    onChange={e => setMerchIntakeForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-white font-sans text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="pt-2 text-[10px] text-zinc-500 font-mono leading-relaxed bg-blue-950/20 p-3 rounded-lg border border-blue-900/30">
                Record new shipments of goods received by the label. These can then be distributed to the band, the public storefront, or kept by the label as promo/backstock.
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (!merchIntakeForm.title) return showLocalToast('Please enter an item name');
                  showLocalToast(`INTAKE SUCCESSFUL: ${merchIntakeForm.qty}x ${merchIntakeForm.title}`);
                  onClose();
                  setMerchIntakeForm({ title: '', qty: 0, cost: 0 });
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-black uppercase rounded-lg transition-all cursor-pointer"
              >
                RECORD INTAKE
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
