import React from 'react';
import { DollarSign } from 'lucide-react';
import { TourPackageBand, TourPackageStop } from '../TourManagerPackageModule';

interface SettlementTabProps {
  bands: TourPackageBand[];
  stops: TourPackageStop[];
  totalPackageGuarantees: number;
  totalGrossPotential: number;
}

export const SettlementTab: React.FC<SettlementTabProps> = ({
  bands,
  stops,
  totalPackageGuarantees,
  totalGrossPotential
}) => {
  return (
    <div className="space-y-3">
      <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase font-mono">
              Nightly Settlement &amp; Deal Split Projections
            </h4>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            Total Potential: ${totalGrossPotential.toLocaleString()}
          </span>
        </div>

        {/* Guarantees Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
          {bands.map(b => (
            <div key={b.id} className="bg-zinc-950 p-2.5 rounded border border-zinc-900 space-y-1">
              <span className="text-[9px] font-mono text-zinc-400 uppercase block">{b.name}</span>
              <div className="text-sm font-mono font-bold text-white">
                ${b.guarantee.toLocaleString()} <span className="text-[10px] text-emerald-400 font-normal">({b.percentageSplit}% deal)</span>
              </div>
              <span className="text-[8px] font-mono text-zinc-500 uppercase">
                Per-Show Base Guarantee
              </span>
            </div>
          ))}
        </div>

        {/* Per-Stop Payout Table */}
        <div className="overflow-x-auto text-left">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="pb-1.5 font-bold uppercase">Tour Date &amp; City</th>
                <th className="pb-1.5 font-bold uppercase">Gross Deal</th>
                <th className="pb-1.5 font-bold uppercase text-amber-400">Headliner (50%)</th>
                <th className="pb-1.5 font-bold uppercase text-purple-400">Support #1 (30%)</th>
                <th className="pb-1.5 font-bold uppercase text-rose-400">Support #2 (20%)</th>
                <th className="pb-1.5 font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {stops.map(s => {
                const gross = s.grossDeal || 0;
                const hCut = gross * 0.50;
                const s1Cut = gross * 0.30;
                const s2Cut = gross * 0.20;
                return (
                  <tr key={s.id} className="text-zinc-300 hover:bg-zinc-900/40">
                    <td className="py-2 font-bold text-white">{s.date} - {s.venueName} ({s.city})</td>
                    <td className="py-2 text-emerald-400 font-bold">${gross.toLocaleString()}</td>
                    <td className="py-2 text-amber-300">${hCut.toLocaleString()}</td>
                    <td className="py-2 text-purple-300">${s1Cut.toLocaleString()}</td>
                    <td className="py-2 text-rose-300">${s2Cut.toLocaleString()}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] uppercase font-bold ${
                        s.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
