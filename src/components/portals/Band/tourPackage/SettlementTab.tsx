import React, { useState } from 'react';
import { DollarSign, Save, CheckCircle2, RefreshCw, Edit3, X, AlertTriangle, Percent, ArrowUpDown, Check } from 'lucide-react';
import { TourPackageBand, TourPackageStop } from '../../../../lib/tourPackageManager';

interface SettlementTabProps {
  bands: TourPackageBand[];
  stops: TourPackageStop[];
  totalPackageGuarantees: number;
  totalGrossPotential: number;
  onUpdateBandSplits?: (updatedBands: TourPackageBand[]) => void;
  onUpdateStopDeal?: (stopId: string, grossDeal: number) => void;
  onSaveProgress?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
}

export const SettlementTab: React.FC<SettlementTabProps> = ({
  bands,
  stops,
  totalPackageGuarantees,
  totalGrossPotential,
  onUpdateBandSplits,
  onUpdateStopDeal,
  onSaveProgress,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt
}) => {
  const [isSplitsModalOpen, setIsSplitsModalOpen] = useState(false);
  const [editingStopDealId, setEditingStopDealId] = useState<string | null>(null);
  const [tempGrossDeal, setTempGrossDeal] = useState<number>(0);

  // Splits editing state
  const [bandSplits, setBandSplits] = useState<Array<{ id: string; name: string; guarantee: number; percentageSplit: number; guaranteeType: 'fixed' | 'percentage' }>>([]);

  const openSplitsModal = () => {
    setBandSplits(bands.map(b => ({
      id: b.id,
      name: b.name,
      guarantee: b.guarantee,
      percentageSplit: b.percentageSplit ?? 0,
      guaranteeType: b.guaranteeType || 'percentage'
    })));
    setIsSplitsModalOpen(true);
  };

  const handleSplitChange = (id: string, field: 'guarantee' | 'percentageSplit', val: number) => {
    setBandSplits(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const totalSplitPct = bandSplits.reduce((sum, b) => sum + (Number(b.percentageSplit) || 0), 0);
  const currentTotalSplitPct = bands.reduce((sum, b) => sum + (Number(b.percentageSplit) || 0), 0);

  const handleSaveSplits = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = bands.map(b => {
      const match = bandSplits.find(item => item.id === b.id);
      if (match) {
        return {
          ...b,
          guarantee: Number(match.guarantee) || 0,
          percentageSplit: Number(match.percentageSplit) || 0,
          guaranteeType: match.guaranteeType
        };
      }
      return b;
    });
    onUpdateBandSplits?.(updated);
    setIsSplitsModalOpen(false);
  };

  const handleSaveStopDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStopDealId) {
      onUpdateStopDeal?.(editingStopDealId, Number(tempGrossDeal) || 0);
      setEditingStopDealId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase font-mono">
              Nightly Settlement &amp; Deal Split Projections
            </h4>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">
              Total Gross: ${totalGrossPotential.toLocaleString()}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              currentTotalSplitPct === 100
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900'
                : 'bg-amber-950/40 text-amber-400 border-amber-900'
            }`}>
              Splits: {currentTotalSplitPct}% {currentTotalSplitPct === 100 ? '✓' : '(Not 100%)'}
            </span>
            <button
              type="button"
              onClick={openSplitsModal}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30"
            >
              <Edit3 className="w-3 h-3" /> Edit Splits &amp; Guarantees
            </button>
            {lastSavedAt && (
              <span className="text-[9.5px] font-mono text-zinc-500">
                Saved: {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {onSaveProgress && (
              <button
                type="button"
                onClick={onSaveProgress}
                disabled={isSaving}
                className={`px-3 py-1 rounded font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-sm ${
                  isSaving
                    ? 'bg-amber-600/50 text-white cursor-wait'
                    : hasUnsavedChanges
                    ? 'bg-amber-500 hover:bg-amber-400 text-black font-black ring-2 ring-amber-400/50 animate-pulse'
                    : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                }`}
                title="Save tour financial progress (Ctrl+S / Cmd+S)"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Save className="w-3 h-3" /> Save Financials *
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Financials Saved
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Guarantees & Splits Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-left">
          {bands.map((b) => (
            <div key={b.id} className="bg-zinc-950 p-2.5 rounded border border-zinc-900 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-zinc-400 uppercase truncate max-w-[120px]">{b.name}</span>
                <span className="text-[8px] font-mono text-amber-400 uppercase">{b.role.replace('_', ' ')}</span>
              </div>
              <div className="text-sm font-mono font-bold text-white flex items-center justify-between">
                <span>${b.guarantee.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  {b.percentageSplit}% split
                </span>
              </div>
              <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 pt-0.5 border-t border-zinc-900">
                <span>Per-Show Base</span>
                <button
                  type="button"
                  onClick={openSplitsModal}
                  className="text-amber-400 hover:underline cursor-pointer"
                >
                  Adjust
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Per-Stop Payout Table */}
        <div className="overflow-x-auto text-left">
          <table className="w-full text-[11px] font-mono">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="pb-1.5 font-bold uppercase">Tour Date &amp; City</th>
                <th className="pb-1.5 font-bold uppercase">Gross Deal</th>
                {bands.map((b, i) => (
                  <th key={b.id} className={`pb-1.5 font-bold uppercase ${
                    i === 0 ? 'text-amber-400' : i === 1 ? 'text-purple-400' : i === 2 ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    {b.name} ({b.percentageSplit || 0}%)
                  </th>
                ))}
                <th className="pb-1.5 font-bold uppercase">Status</th>
                <th className="pb-1.5 font-bold uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {stops.map((s) => {
                const gross = s.grossDeal || 0;
                return (
                  <tr key={s.id} className="text-zinc-300 hover:bg-zinc-900/40 transition-colors">
                    <td className="py-2 font-bold text-white">
                      {s.date} - {s.venueName} <span className="text-zinc-500 font-normal">({s.city})</span>
                    </td>
                    <td className="py-2 text-emerald-400 font-bold">
                      ${gross.toLocaleString()}
                    </td>
                    {bands.map((b, i) => {
                      const splitPct = b.percentageSplit ? b.percentageSplit / 100 : 0;
                      const calculatedCut = Math.round(gross * splitPct);
                      return (
                        <td key={b.id} className={`py-2 ${
                          i === 0 ? 'text-amber-300' : i === 1 ? 'text-purple-300' : i === 2 ? 'text-rose-300' : 'text-cyan-300'
                        }`}>
                          ${calculatedCut.toLocaleString()}
                        </td>
                      );
                    })}
                    <td className="py-2">
                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] uppercase font-bold ${
                        s.status === 'confirmed' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStopDealId(s.id);
                          setTempGrossDeal(s.grossDeal);
                        }}
                        className="text-[9px] font-mono text-zinc-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Edit Deal
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Splits & Guarantees Modal */}
      {isSplitsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121a] border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Adjust Splits &amp; Nightly Guarantees
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSplitsModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSplits} className="p-4 space-y-3.5 text-left max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-950 border border-zinc-850">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Total Percentage Allocation:</span>
                <span className={`text-xs font-mono font-black ${totalSplitPct === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {totalSplitPct}% {totalSplitPct === 100 ? '(Balanced 100%)' : `(Adjust ${100 - totalSplitPct}%)`}
                </span>
              </div>

              <div className="space-y-2.5">
                {bandSplits.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 space-y-2">
                    <span className="text-xs font-bold text-white uppercase font-mono block">
                      {item.name}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[8.5px] font-mono text-zinc-400 uppercase block mb-1">
                          Base Guarantee ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={item.guarantee}
                          onChange={(e) => handleSplitChange(item.id, 'guarantee', parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[8.5px] font-mono text-zinc-400 uppercase block mb-1">
                          Split Deal (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.percentageSplit}
                          onChange={(e) => handleSplitChange(item.id, 'percentageSplit', parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSplitsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Save Splits &amp; Guarantees
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Stop Gross Deal Quick Modal */}
      {editingStopDealId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121a] border border-emerald-500/40 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Adjust Stop Gross Deal
              </h3>
              <button
                type="button"
                onClick={() => setEditingStopDealId(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStopDeal} className="p-4 space-y-3 text-left">
              <div>
                <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Gross Guaranteed Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={tempGrossDeal}
                  onChange={(e) => setTempGrossDeal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingStopDealId(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Update Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
