import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Search, Plus, Minus, Check, ArrowRight, Package } from 'lucide-react';
import { InventoryItem } from '../../../types';
import { resolveInventoryImageUrl } from '../../../supabase';

interface VanToTableTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  commitInventoryMutation?: (itemsData: InventoryItem | InventoryItem[]) => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  preselectedItemId?: string | null;
}

export default function VanToTableTransferModal({
  isOpen,
  onClose,
  inventory,
  setInventory,
  commitInventoryMutation,
  triggerNotification,
  addLog,
  preselectedItemId
}: VanToTableTransferModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<{ name: string; table: number; van: number } | null>(null);
  const [showQtyScreen, setShowQtyScreen] = useState(false);
  const [transferQty, setTransferQty] = useState<number>(5);

  // Reset local states on modal close/open change
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedItem(null);
      setSelectedVariant(null);
      setShowQtyScreen(false);
      setTransferQty(1);
    } else if (isOpen && preselectedItemId) {
      const found = inventory.find(item => item.id === preselectedItemId);
      if (found) {
        // Automatically select this item
        const variants = getVariants(found);
        setSelectedItem(found);
        if (variants.length > 0) {
          setSelectedVariant(null);
          setShowQtyScreen(false);
        } else {
          setSelectedVariant(null);
          setTransferQty(Math.min(5, found.van_stock > 0 ? found.van_stock : 1));
          setShowQtyScreen(true);
        }
      }
    }
  }, [isOpen, preselectedItemId, inventory]);

  // Derived variants for an item
  const getVariants = (item: InventoryItem) => {
    if (item.variants && item.variants.length > 0) {
      return item.variants.map(v => ({
        name: v.size || 'Base',
        table: 0,
        van: parseInt(v.stock) || 0
      }));
    }

    // Determine variants if it is apparel or specified as Multiple
    const nameLower = item?.name.toLowerCase();
    const isApparel = nameLower.includes('tee') || 
                      nameLower.includes('shirt') || 
                      nameLower.includes('hoodie') ||
                      nameLower.includes('head') ||
                      nameLower.includes('longsleeve') || 
                      item.item_type === 'Multiple';
                      
    const isAccessory = nameLower.includes('patch') || nameLower.includes('hat');

    if (isApparel) {
      const vSplit = Math.floor(item.van_stock / 4);
      const tSplit = Math.floor(item.table_stock / 4);
      return [
        { name: 'Small', table: tSplit, van: vSplit },
        { name: 'Medium', table: tSplit + (item.table_stock % 4), van: vSplit + (item.van_stock % 4) },
        { name: 'Large', table: tSplit, van: vSplit },
        { name: 'XL', table: tSplit, van: vSplit },
      ];
    } else if (isAccessory) {
      const vSplit = Math.floor(item.van_stock / 2);
      const tSplit = Math.floor(item.table_stock / 2);
      return [
        { name: 'Col A', table: tSplit, van: vSplit },
        { name: 'Col B', table: tSplit + (item.table_stock % 2), van: vSplit + (item.van_stock % 2) },
      ];
    }
    return []; // No variants
  };

  const handleItemSelect = (item: InventoryItem) => {
    const variants = getVariants(item);
    setSelectedItem(item);
    if (variants.length > 0) {
      // Show variant selection view first
      setSelectedVariant(null);
      setShowQtyScreen(false);
    } else {
      // Directly go to quantity input screen for no-variant products
      setSelectedVariant(null);
      setTransferQty(Math.min(5, item.van_stock > 0 ? item.van_stock : 1));
      setShowQtyScreen(true);
    }
  };

  const handleVariantSelect = (variant: { name: string; table: number; van: number }) => {
    setSelectedVariant(variant);
    setTransferQty(Math.min(5, variant.van > 0 ? variant.van : 1));
    setShowQtyScreen(true);
  };

  const handleConfirmTransfer = () => {
    if (!selectedItem) return;
    const maxAllowed = selectedVariant ? selectedVariant.van : selectedItem.van_stock;

    if (transferQty <= 0) {
      triggerNotification('Please specify a positive quantity to transfer.');
      return;
    }

    if (maxAllowed < transferQty) {
      triggerNotification(`Not enough stock in van! Only ${maxAllowed} units available.`);
      return;
    }

    // Apply the update to the parent inventory item
    if (commitInventoryMutation) {
      const nextTable = selectedItem.table_stock + transferQty;
      const nextVan = selectedItem.van_stock - transferQty;
      let nextStatus: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
      if (nextTable <= 18) {
        nextStatus = 'Critical';
      } else if (nextTable <= 25) {
        nextStatus = 'Warning';
      }

      commitInventoryMutation([{
        ...selectedItem,
        table_stock: nextTable,
        van_stock: nextVan,
        status: nextStatus
      }]);
    } else {
      setInventory(prev => prev.map(inv => {
        if (inv.id === selectedItem.id) {
          const newTable = inv.table_stock + transferQty;
          const newVan = inv.van_stock - transferQty;
          // recalculate item security status alerts
          let newStatus: 'Critical' | 'Warning' | 'Healthy' = 'Healthy';
          if (newTable <= 18) {
            newStatus = 'Critical';
          } else if (newTable <= 25) {
            newStatus = 'Warning';
          }

          return {
            ...inv,
            table_stock: newTable,
            van_stock: newVan,
            status: newStatus
          };
        }
        return inv;
      }));
    }

    const friendlyName = selectedVariant 
      ? `${selectedItem.name} (${selectedVariant.name})` 
      : selectedItem.name;

    triggerNotification(`Successfully transferred ${transferQty}x ${friendlyName} to Merch Table!`);
    addLog(`Transferred ${transferQty} units of ${friendlyName} from backup Van cargo to the Merch Table.`);
    
    // Smooth reset
    setSelectedItem(null);
    setSelectedVariant(null);
    setShowQtyScreen(false);
    onClose();
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.item_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  // Read current limit variables
  const maxLimit = selectedVariant ? selectedVariant.van : (selectedItem ? selectedItem.van_stock : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="absolute inset-0 bg-black/85 backdrop-blur-sm shadow-inner"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-sm bg-[#0e1014] rounded-2xl overflow-hidden shadow-2xl border border-zinc-900 flex flex-col h-[75vh]"
        id="van-transfer-modal-container"
      >
        {/* MODAL HEADER */}
        <div className="flex-none p-4 pb-2 border-b border-zinc-900 bg-[#07080a]/80">
          <div className="flex items-center justify-between">
            {showQtyScreen ? (
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (selectedItem && getVariants(selectedItem).length > 0) {
                      setShowQtyScreen(false);
                      setSelectedVariant(null);
                    } else {
                      if (preselectedItemId) {
                        onClose();
                      } else {
                        setSelectedItem(null);
                        setShowQtyScreen(false);
                      }
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-white font-black text-sm uppercase tracking-wider">Set Quantity</h2>
              </div>
            ) : selectedItem ? (
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    if (preselectedItemId) {
                      onClose();
                    } else {
                      setSelectedItem(null);
                    }
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 hover:text-white transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-white font-black text-sm uppercase tracking-wider">Select Variant</h2>
              </div>
            ) : (
              <h2 className="text-white font-black text-sm uppercase tracking-wider">Van to Table Transfer</h2>
            )}
            
            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!selectedItem && (
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search items to transfer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161922] border border-zinc-850 focus:border-[#00ffcc] text-white rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none transition-colors font-mono"
              />
            </div>
          )}
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="flex-grow overflow-y-auto p-4 space-y-3" id="van-transfer-scroller">
          {showQtyScreen && selectedItem ? (
            /* SCREEN 3: INTERACTIVE QUANTITY ADJUSTER */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-zinc-950/50 rounded-xl border border-zinc-900">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900 flex-none">
                  {resolveInventoryImageUrl(selectedItem) ? (
                    <img src={resolveInventoryImageUrl(selectedItem)} alt={selectedItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600"><Package className="w-6 h-6" /></div>
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <span className="text-white font-black text-sm tracking-tight block truncate uppercase">{selectedItem.name}</span>
                  <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider font-mono">
                    {selectedVariant ? `Size: ${selectedVariant.name}` : `Type: ${selectedItem.item_type}`}
                  </span>
                </div>
              </div>

              {/* LIVE ANALYTICS DRIFT LABELS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 text-center">
                  <span className="text-[9px] font-mono font-bold text-zinc-550 block uppercase tracking-wider">Van Backlog</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-zinc-500 font-mono text-sm line-through">{maxLimit}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-amber-500 font-mono font-black text-base">{Math.max(0, maxLimit - transferQty)}</span>
                  </div>
                </div>

                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-900 text-center">
                  <span className="text-[9px] font-mono font-bold text-zinc-550 block uppercase tracking-wider">Merch Table</span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-zinc-500 font-mono text-sm line-through">
                      {selectedVariant ? selectedVariant.table : selectedItem.table_stock}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-650" />
                    <span className="text-[#00ffcc] font-mono font-black text-base">
                      {(selectedVariant ? selectedVariant.table : selectedItem.table_stock) + transferQty}
                    </span>
                  </div>
                </div>
              </div>

              {/* STEPPING CONTROLLER CONTAINER */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 flex flex-col items-center justify-center gap-4 text-center mt-3">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Adjust Allocation Units</span>
                
                <div className="flex items-center gap-6 justify-center">
                  <button
                    type="button"
                    onClick={() => setTransferQty(prev => Math.max(1, prev - 1))}
                    disabled={transferQty <= 1}
                    className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:text-[#00ffcc] hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md select-none"
                  >
                    <Minus className="w-5 h-5 font-bold" />
                  </button>

                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      value={transferQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setTransferQty(Math.min(maxLimit, Math.max(1, val)));
                        } else {
                          setTransferQty(1);
                        }
                      }}
                      className="w-20 bg-transparent text-center text-4xl font-mono font-black text-white outline-none border-b border-zinc-800 focus:border-[#00ffcc]"
                    />
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wide font-mono mt-1">Units (Max: {maxLimit})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTransferQty(prev => Math.min(maxLimit, prev + 1))}
                    disabled={transferQty >= maxLimit}
                    className="w-12 h-12 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:text-[#00ffcc] hover:border-[#00ffcc]/30 hover:bg-[#00ffcc]/5 flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md select-none"
                  >
                    <Plus className="w-5 h-5 font-bold" />
                  </button>
                </div>

                {/* SLIDER RANGE CONTROL ACCENT */}
                <input 
                  type="range"
                  min="1"
                  max={maxLimit || 1}
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#00ffcc] focus:outline-none transition-all mt-3"
                />

                {/* SPEED QUICK CONFIGS */}
                <div className="flex justify-center gap-2 mt-2 w-full">
                  {[1, 5, 10, 25].map((preset, idx) => (
                    <button
                      key={`${preset}-${idx}`}
                      type="button"
                      disabled={preset > maxLimit}
                      onClick={() => setTransferQty(Math.min(maxLimit, preset))}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-black border border-zinc-850 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-[#00ffcc] hover:bg-[#00ffcc]/5 transition-all cursor-pointer disabled:opacity-35 disabled:pointer-events-none"
                    >
                      +{preset}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTransferQty(maxLimit)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-mono font-black border border-[#00ffcc]/20 hover:border-[#00ffcc]/60 bg-[#00ffcc]/5 text-[#00ffcc] hover:bg-[#00ffcc]/10 transition-all cursor-pointer"
                  >
                    MAX
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmTransfer}
                className="w-full mt-4 bg-[#00ffcc] text-black font-black uppercase text-xs py-3.5 rounded-xl hover:scale-[1.01] active:scale-[0.99] font-sans tracking-wide transition-all shadow-lg shadow-[#00ffcc]/15 flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                <Check className="w-4 h-4 text-black font-black stroke-[3.5]" />
                <span>Confirm Live Transfer</span>
              </button>
            </div>
          ) : selectedItem ? (
            /* SCREEN 2: CHOOSE VARIANT SIZE */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2 bg-zinc-950/30 rounded-xl border border-zinc-900/40 mb-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-850 bg-zinc-900 flex-none">
                  {resolveInventoryImageUrl(selectedItem) ? (
                    <img src={resolveInventoryImageUrl(selectedItem)} alt={selectedItem.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-650"><Package className="w-5 h-5" /></div>
                  )}
                </div>
                <div className="min-w-0 flex-grow">
                  <span className="text-white font-bold text-xs block truncate uppercase">{selectedItem.name}</span>
                  <span className="text-[9px] text-zinc-550 font-mono uppercase block mt-0.5">Choose which size to transfer</span>
                </div>
              </div>

              <div className="space-y-2">
                {getVariants(selectedItem).map((v, vIdx) => (
                  <div 
                    key={`${v.name}-${vIdx}`}
                    onClick={() => handleVariantSelect(v)}
                    className="bg-[#181a21]/80 hover:bg-[#1a1d26] border border-zinc-850 hover:border-[#00ffcc]/40 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-colors group select-none"
                  >
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-xs group-hover:text-[#00ffcc] transition-colors">{v.name}</span>
                      <div className="text-[10px] text-zinc-500 font-mono mt-1 flex items-center gap-1.5">
                        <span>On Table: <span className="text-white font-bold">{v.table}</span></span>
                        <span>•</span>
                        <span>Van Cargo: <span className="text-[#00ffcc] font-bold">{v.van}</span></span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-550 group-hover:text-white transition-all transform group-hover:translate-x-0.5" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SCREEN 1: LIST RELEVANT PRODUCTS WITH PLUS FAST TRIGGER */
            <div className="space-y-2">
              {filteredInventory.length === 0 ? (
                <div className="text-center py-10 font-mono text-zinc-550 text-xs">
                  No matching items found in tour catalog.
                </div>
              ) : (
                filteredInventory.map((item, idx) => {
                  const variants = getVariants(item);
                  const hasVariants = variants.length > 0;
                  const itemVanStock = item.van_stock;
                  
                  return (
                    <div 
                      key={`${item.id}-${idx}`}
                      onClick={() => handleItemSelect(item)}
                      className="bg-[#181a21]/90 hover:bg-[#1d212b]/80 border border-zinc-850 hover:border-zinc-700 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all group relative select-none"
                    >
                      <div className="w-11 h-11 bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 flex-none group-hover:border-zinc-650 transition-colors">
                        {resolveInventoryImageUrl(item) ? (
                          <img src={resolveInventoryImageUrl(item)} alt={item?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-750"><Package className="w-5 h-5" /></div>
                        )}
                      </div>
                      
                      <div className="flex flex-col flex-grow min-w-0 pr-10">
                        <span className="text-white font-bold text-xs truncate group-hover:text-zinc-200 uppercase">{item?.name}</span>
                        <div className="text-[10px] text-zinc-450 mt-1 font-mono flex items-center gap-1.5">
                          <span>Van Cargo: <span className={itemVanStock <= 10 ? "text-amber-500 font-bold" : "text-[#00ffcc] font-bold"}>{itemVanStock}</span></span>
                          {hasVariants && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-550 font-bold">Multiple variants</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Chevron indicator / Quick Action button */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {hasVariants ? (
                          <div className="w-7 h-7 rounded-xl border border-zinc-800 bg-zinc-900 group-hover:bg-[#00ffcc]/5 group-hover:border-[#00ffcc]/20 flex items-center justify-center transition-all">
                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemSelect(item);
                            }}
                            className="w-7 h-7 rounded-xl bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black flex items-center justify-center font-bold transition-transform hover:scale-105 active:scale-95 shadow-md shadow-[#00ffcc]/10"
                          >
                            <Plus className="w-4 h-4 font-black text-black stroke-[3.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
