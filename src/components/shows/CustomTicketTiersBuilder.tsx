import React from 'react';
import { Plus, Trash2, Ticket, AlertTriangle, PackageCheck } from 'lucide-react';
import type { TicketTier } from '../../types';

export interface CustomTicketTiersBuilderProps {
  tiers: TicketTier[];
  onChange: (nextTiers: TicketTier[]) => void;
  hasExternalUrl?: boolean;
  accentColor?: 'emerald' | 'teal';
}

export const CustomTicketTiersBuilder: React.FC<CustomTicketTiersBuilderProps> = ({
  tiers,
  onChange,
  hasExternalUrl = false,
  accentColor = 'emerald',
}) => {
  const accentBorderFocus =
    accentColor === 'teal' ? 'focus:border-[#00ffcc]' : 'focus:border-emerald-400';
  const accentText = accentColor === 'teal' ? 'text-[#00ffcc]' : 'text-emerald-400';
  const accentButton =
    accentColor === 'teal'
      ? 'bg-[#14292b] hover:bg-[#1a3d3f] text-[#00ffcc] border-[#00ffcc]/35 hover:border-[#00ffcc]'
      : 'bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/40 hover:border-emerald-400';

  const handleAddTier = () => {
    const newTier: TicketTier = {
      id: `tier_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      price: 0,
      capacity: 0,
      sold: 0,
      description: '',
      includesMerch: false,
    };
    onChange([...tiers, newTier]);
  };

  const handleUpdateTier = (idx: number, patch: Partial<TicketTier>) => {
    onChange(tiers.map((tier, i) => (i === idx ? { ...tier, ...patch } : tier)));
  };

  const handleRemoveTier = (idx: number) => {
    onChange(tiers.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2.5 pt-2.5 border-t border-zinc-800/80">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <label className="text-[11px] font-mono font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket className={`w-3.5 h-3.5 ${accentText}`} />
            <span>Custom Ticket Tiers (Optional)</span>
          </label>
          <p className="text-[10px] font-mono text-zinc-400 mt-0.5 leading-snug">
            Only tiers you add here will appear in the Box Office. Leave empty for a single standard pass at your listed price — no VIP tiers are auto-generated.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddTier}
          className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${accentButton}`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Ticket Tier</span>
        </button>
      </div>

      {hasExternalUrl && (
        <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 flex items-start gap-2 text-[10px] font-mono text-amber-200/90 leading-relaxed">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <span>
            External ticket link is active: fans will be directed off-platform to purchase. Nexus Core cannot verify external purchases or issue scannable QR entry passes for third-party checkouts.
          </span>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="space-y-2.5">
          {tiers.map((tier, idx) => (
            <div
              key={tier.id || `custom-tier-${idx}`}
              className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Tier #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTier(idx)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                  title="Remove tier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">
                    Tier Name *
                  </label>
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => handleUpdateTier(idx, { name: e.target.value })}
                    placeholder="e.g. Early Bird, GA Pit, VIP Balcony"
                    className={`w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${accentBorderFocus}`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={Number.isFinite(tier.price) ? tier.price : 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleUpdateTier(idx, { price: Number.isFinite(val) && val >= 0 ? val : 0 });
                    }}
                    placeholder="25"
                    className={`w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${accentBorderFocus}`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">
                    Limit (Opt.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={tier.capacity && tier.capacity > 0 ? tier.capacity : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleUpdateTier(idx, { capacity: Number.isFinite(val) && val > 0 ? val : 0 });
                    }}
                    placeholder="Unlimited"
                    className={`w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${accentBorderFocus}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-8">
                  <label className="block text-[9px] font-mono text-zinc-400 uppercase mb-1">
                    Perks / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={tier.description || ''}
                    onChange={(e) => handleUpdateTier(idx, { description: e.target.value })}
                    placeholder="e.g. Balcony seating, early door entry, or commemorative laminate"
                    className={`w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${accentBorderFocus}`}
                  />
                </div>

                <div className="sm:col-span-4 pt-3 sm:pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none px-2.5 py-1.5 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700">
                    <input
                      type="checkbox"
                      checked={Boolean(tier.includesMerch)}
                      onChange={(e) => handleUpdateTier(idx, { includesMerch: e.target.checked })}
                      className="rounded bg-black border-zinc-700 text-emerald-400 focus:ring-0 cursor-pointer"
                    />
                    <PackageCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[10px] font-mono text-zinc-300">Includes Merch</span>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomTicketTiersBuilder;
