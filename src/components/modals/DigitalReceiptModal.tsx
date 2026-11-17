import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Package } from 'lucide-react';
import AlbumArt from '../AlbumArt';
import { Sale } from '../../types';

interface DigitalReceiptModalProps {
  selectedSaleReceipt: Sale | null;
  onClose: () => void;
  triggerNotification: (msg: string) => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  selectedSaleReceipt,
  onClose,
  triggerNotification
}) => {
  return (
    <AnimatePresence>
      {selectedSaleReceipt && (
        <motion.div 
          key="receipt-modal-wrapper" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <motion.div 
            initial={{ scale: 0.94, opacity: 1, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 1, y: 20 }}
            className="bg-[#0e1015] w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl border border-zinc-800 shadow-teal-500/10 flex flex-col relative"
          >
            <div className="p-6 pb-4 border-b border-zinc-900 flex justify-between items-start">
              <div>
                <h3 className="font-display font-semibold text-lg text-white uppercase tracking-widest">
                  Digital Receipt
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  {new Date(selectedSaleReceipt.created_at).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="bg-zinc-900/50 hover:bg-zinc-800 p-2 rounded-full text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-barely-visible bg-[#0a0c10]">
              {/* Sale Overview Banner */}
              <div className="flex bg-[#13161d] p-3 rounded-xl border border-zinc-800/60 items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Transaction ID</span>
                  <span className="text-xs font-mono text-zinc-300">#{selectedSaleReceipt.id.toUpperCase()}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Payment</span>
                  <span className={`text-[11px] font-bold uppercase ${
                    selectedSaleReceipt.payment_method === 'CASH' ? 'text-emerald-400' : 'text-blue-400'
                  }`}>
                    {selectedSaleReceipt.payment_method}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] uppercase font-mono text-zinc-500 font-bold tracking-widest px-1 border-b border-zinc-800/60 pb-2">Purchased Items</h4>
                
                {selectedSaleReceipt.cart_items && selectedSaleReceipt.cart_items.length > 0 ? (
                  <div className="space-y-3">
                    {selectedSaleReceipt.cart_items.map((item, idx) => (
                      <div key={`receipt-item-${idx}`} className="flex justify-between items-start gap-3">
                        <div className="flex gap-3 overflow-hidden w-full">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item?.name} className="w-12 h-12 object-cover rounded-lg border border-zinc-800 bg-zinc-900 shrink-0" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center rounded-lg shrink-0">
                              <Package className="w-5 h-5 text-zinc-600" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-bold text-white truncate font-display">{item?.name}</span>
                            <span className="text-[10px] text-zinc-400 font-mono mt-0.5">{item.variantName}</span>
                            <span className="text-[10px] font-mono text-[#00ffcc] mt-1">x{item.quantity}</span>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-zinc-300 shrink-0 font-bold w-12 text-right">
                          ${((item.price ?? 0) * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback for older sales that don't have cart_items */
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-3 overflow-hidden w-full">
                      {selectedSaleReceipt.image_url ? (
                        <img src={selectedSaleReceipt.image_url} alt="" className="w-12 h-12 object-cover rounded-lg border border-zinc-800 bg-zinc-900 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center rounded-lg shrink-0">
                          <AlbumArt type="dark" size="sm" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="text-xs font-bold text-white leading-tight font-display">{selectedSaleReceipt.item_name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono mt-1">{selectedSaleReceipt.item_type}</span>
                        <span className="text-[10px] font-mono text-[#00ffcc] mt-1">x{selectedSaleReceipt.quantity}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800/80 mt-4 flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Total Paid</span>
                <span className="text-xl font-bold font-mono text-white">${(selectedSaleReceipt.amount ?? 0).toFixed(0)}</span>
              </div>
            </div>
            
            <div className="p-4 bg-[#0a0c10] border-t border-zinc-900 flex justify-center">
              <button
                onClick={() => {
                  triggerNotification("Refunds functionality locked in preview mode.");
                }}
                className="w-full py-2.5 text-[10px] font-bold font-mono uppercase tracking-widest text-zinc-500 hover:text-white border border-dashed border-zinc-700/50 hover:border-zinc-500 rounded-xl transition-all"
              >
                Issue Refund
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DigitalReceiptModal;
