import React from 'react';
import { Table, Truck, ArrowRight } from 'lucide-react';
import { V2ExpandableCard } from '../V2ExpandableCard';

interface LiveInventoryCardProps {
  totalTableStock: number;
  totalVanStock: number;
  isCritical: boolean;
  onOpenTransferModal: () => void;
}

export const LiveInventoryCard: React.FC<LiveInventoryCardProps> = ({
  totalTableStock,
  totalVanStock,
  isCritical,
  onOpenTransferModal,
}) => {
  const totalStock = (totalTableStock + totalVanStock) || 1;
  const tablePct = Math.round((totalTableStock / totalStock) * 100);
  const vanPct = Math.round((totalVanStock / totalStock) * 100);

  return (
    <V2ExpandableCard title="Live Inventory" defaultExpanded={false}>
      <div className="p-4 bg-black">
        <div 
          className="bg-[#13161d] border rounded-xl p-4 flex flex-col justify-between min-h-[200px] hover:border-purple-500/50 transition-colors w-full"
          style={{ borderWidth: '2px', borderColor: '#7d0398' }}
        >
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2 mb-2">
            <span className="text-[11px] font-mono uppercase text-zinc-300 tracking-wider flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#7d0398] animate-pulse"></span>
              LIVE INVENTORY METRICS & BALANCE
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3">
            {/* Table Stock */}
            <div className="space-y-1.5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
              <div className="flex justify-between text-xs items-start">
                <span className="text-zinc-300 font-sans flex items-center gap-2 font-semibold">
                  <Table className="w-4 h-4 text-purple-400" />
                  Table Stock (Active Merch Area)
                </span>
                <span className={`font-mono text-xs font-bold text-right flex flex-col items-end ${isCritical ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <span>{tablePct}%</span>
                  <span className="text-[8.5px] text-zinc-500 font-normal mt-0.5 leading-none">({totalTableStock} pcs)</span>
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-amber-500' : 'bg-[#00ffcc]'}`}
                  style={{ width: `${tablePct}%` }}
                ></div>
              </div>
              <p className="text-[8.5px] text-zinc-500 font-mono">Stock currently displayed on tables and ready for purchase.</p>
            </div>

            {/* Van Stock */}
            <div className="space-y-1.5 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900">
              <div className="flex justify-between text-xs items-start">
                <span className="text-zinc-300 font-sans flex items-center gap-2 font-semibold">
                  <Truck className="w-4 h-4 text-blue-400" />
                  Van Stock (Backup Reserve)
                </span>
                <span className="font-mono text-xs text-zinc-300 font-bold text-right flex flex-col items-end">
                  <span>{vanPct}%</span>
                  <span className="text-[8.5px] text-zinc-500 font-normal mt-0.5 leading-none">({totalVanStock} pcs)</span>
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${vanPct}%` }}
                ></div>
              </div>
              <p className="text-[8.5px] text-zinc-500 font-mono">Stock stored securely in vehicles or backstage cases.</p>
            </div>
          </div>

          {/* Restock Button & Action */}
          <div className="pt-3 border-t border-zinc-900 mt-2">
            <button 
              type="button"
              onClick={onOpenTransferModal}
              className="w-full text-xs font-mono font-bold uppercase py-2.5 bg-[#170a24] hover:bg-[#25103c] border border-purple-900/30 hover:border-purple-500/50 rounded-lg text-purple-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-sm"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCritical ? 'bg-red-400' : 'bg-purple-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isCritical ? 'bg-red-500' : 'bg-purple-500'}`}></span>
              </span>
              <span>Launch Restock & Transfer Manager</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#00ffcc]" />
            </button>
          </div>
        </div>
      </div>
    </V2ExpandableCard>
  );
};
