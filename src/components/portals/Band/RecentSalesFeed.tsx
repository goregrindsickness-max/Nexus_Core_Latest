import React from 'react';
import { Sale, InventoryItem } from '../../../types';
import AlbumArt from '../../AlbumArt';

interface RecentSalesFeedProps {
  sales: Sale[];
  inventory: InventoryItem[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  addLog: (log: string) => void;
  setSelectedSaleReceipt: (sale: Sale) => void;
  setIsGlobalHoverPaused: (paused: boolean) => void;
}

export default function RecentSalesFeed({
  sales,
  inventory,
  setSales,
  addLog,
  setSelectedSaleReceipt,
  setIsGlobalHoverPaused = () => {}
}: RecentSalesFeedProps) {
  return (
    <div 
      onMouseEnter={() => setIsGlobalHoverPaused(true)}
      onMouseLeave={() => setIsGlobalHoverPaused(false)}
      className="px-5 py-4 space-y-3"
    >
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <h3 className="font-display font-semibold text-xs tracking-wider text-white uppercase">
          Recent Sales Feed
        </h3>
        <button 
          onClick={() => { setSales([]); addLog('Wiped recent transaction logs.'); }}
          className="text-[10px] font-mono text-zinc-500 hover:text-white cursor-pointer"
        >
          Clear Feed
        </button>
      </div>

      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        {sales.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-600 font-mono">
            No recent transactions recorded. Feed is empty.
          </div>
        ) : (
          sales.map((sale, idx) => {
            // Procedural dynamic color determination for custom heavy metal art thumbnail rendering
            let artType: 'green' | 'red' | 'dark' | 'purple' = 'dark';
            if (sale.item_name.includes('Voracity')) artType = 'green';
            if (sale.item_name.includes('Psychosis')) artType = 'red';
            if (sale.item_name.includes('Head')) artType = 'dark';

            // Parse the first item's name to resolve the correct image from inventory
            const firstName = sale.item_name.includes(' + ') 
              ? sale.item_name.split(' + ')[0] 
              : sale.item_name;
            
            const matchedInventoryItem = inventory.find(i => i.name === firstName);
            const displayImageUrl = sale.image_url || matchedInventoryItem?.image_url;

            return (
              <div 
                key={`${sale.id}-${idx}`} 
                onClick={() => setSelectedSaleReceipt(sale)}
                className="flex justify-between items-center bg-[#13161d]/40 hover:bg-[#1a1d26] p-2 rounded-lg border border-zinc-800/40 cursor-pointer transition-colors relative"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  {displayImageUrl ? (
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-950 border border-zinc-805 shrink-0">
                      <img src={displayImageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <AlbumArt type={artType} size="sm" />
                  )}
                  <div className="text-left overflow-hidden">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate pr-2">{sale.item_name}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {sale.item_type} • {sale.quantity} unit{sale.quantity > 1 ? 's' : ''}
                    </p>
                    {sale.is_synced === false ? (
                      <span className="text-[8.5px] font-mono font-bold text-amber-500 tracking-tight block mt-0.5 animate-pulse">[ ▰ OFFLINE CACHED ]</span>
                    ) : (
                      <span className="text-[8.5px] font-mono font-bold text-emerald-500/80 tracking-tight block mt-0.5 transition-all">[ ✓ SYNCED ]</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-teal-400">
                    ${(sale.amount ?? 0).toFixed(0)}
                  </span>
                  <p className="text-[8.5px] font-mono text-zinc-600 leading-none mt-1">
                    {sale.payment_method}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
