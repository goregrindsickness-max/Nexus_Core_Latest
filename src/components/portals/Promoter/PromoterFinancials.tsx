import React from 'react';
import { Trash } from 'lucide-react';

interface CostItem {
  id: string;
  name: string;
  amount: string;
  category: string;
}

interface LineupItem {
  id: string;
  custom_name: string;
  guarantee?: string | number;
}

interface PromoterFinancialsProps {
  items?: CostItem[];
  plannerLineup?: LineupItem[];
  handleRemoveCost?: (id: string) => void;
}

export default function PromoterFinancials({
  items = [],
  plannerLineup = [],
  handleRemoveCost = () => {},
}: PromoterFinancialsProps) {
  return (
    <div className="bg-black/40 border border-zinc-800/50 rounded-lg p-3">
      <div className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-3 border-b border-zinc-800 pb-2">
        SETTLEMENT CHECKLIST
      </div>
      
      <div id="settlement-checklist" className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
        {/* Implicit Costs (Lineup) */}
        {plannerLineup && plannerLineup.length > 0 && plannerLineup.map((act, idx) => (
          <div key={`implicit-${act.id}-${idx}`} className="flex justify-between items-center bg-zinc-950 border border-zinc-800/50 p-2 rounded text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-zinc-600">🎸</span>
              <span className="text-zinc-400">{act.custom_name}</span>
            </div>
            <div className="text-zinc-500">${act.guarantee || 0}</div>
          </div>
        ))}

        {/* Standardized Empty State Check for Explicit Items */}
        {items.length === 0 ? (
          <div className="flex items-center justify-center p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-lg">
            <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider">
              No active ledger items for settlement check.
            </span>
          </div>
        ) : (
          items.map((cost, idx) => (
            <div
              key={`${cost.id}-${idx}`}
              className="flex justify-between items-center bg-zinc-950 border border-zinc-800 p-2 rounded text-[10px] font-mono group hover:border-yellow-900/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">📝</span>
                <span className="text-zinc-300">{cost.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-yellow-500/80">${cost.amount}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemoveCost(cost.id)}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
