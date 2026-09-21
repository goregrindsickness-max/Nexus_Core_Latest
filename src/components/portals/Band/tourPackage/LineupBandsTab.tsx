import React from 'react';
import { Crown, Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { TourPackageBand } from '../TourManagerPackageModule';

interface LineupBandsTabProps {
  bands: TourPackageBand[];
  clientBandName: string;
  onOpenSelectClientModal: () => void;
  onOpenAddBandModal: () => void;
  onMoveBand: (fromIdx: number, toIdx: number) => void;
  onRemoveBand: (id: string, name: string) => void;
  onPromoteToHeadliner: (id: string) => void;
}

export const LineupBandsTab: React.FC<LineupBandsTabProps> = ({
  bands,
  clientBandName,
  onOpenSelectClientModal,
  onOpenAddBandModal,
  onMoveBand,
  onRemoveBand,
  onPromoteToHeadliner
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <p className="text-[11px] text-zinc-400">
            Billing lineup for this tour package. Reorder slots, set guarantees, designate the headliner/client, and manage gear sharing.
          </p>
          <div className="text-[9.5px] font-mono text-amber-400/90 pt-0.5">
            Current Client / Headliner: <strong className="text-amber-300 font-bold">{clientBandName}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSelectClientModal}
            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
          >
            <Crown className="w-3 h-3 text-amber-400" /> Switch Client
          </button>
          <button
            type="button"
            onClick={onOpenAddBandModal}
            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Band
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {bands.map((band, idx) => {
          const isHeadliner = band.role === 'headliner' || band.name.toLowerCase() === clientBandName.toLowerCase();
          return (
            <div
              key={band.id}
              className={`border rounded-xl p-3.5 space-y-3 relative overflow-hidden flex flex-col justify-between transition-all ${
                isHeadliner
                  ? 'bg-[#121008] border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.08)] ring-1 ring-amber-500/30'
                  : 'bg-[#0e1117] border-zinc-850 hover:border-zinc-700'
              }`}
            >
              {/* Header with bill rank badge & reordering */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${band.avatarColor} flex items-center justify-center text-white font-mono font-black text-xs shrink-0 shadow-md`}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-white uppercase tracking-tight">{band.name}</h4>
                        {isHeadliner && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-amber-500 text-black font-mono font-black text-[8px] uppercase tracking-wider shadow-sm">
                            <Crown className="w-2.5 h-2.5 fill-black" /> Client
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                          isHeadliner
                            ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                            : band.role === 'direct_support'
                            ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        }`}>
                          {band.role.replace('_', ' ')} • {band.setMinutes} min set
                        </span>
                        {band.city && (
                          <span className="text-[8px] font-mono text-zinc-400">
                            {band.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Slot Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMoveBand(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 transition cursor-pointer"
                      title="Move up in billing"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveBand(idx, idx + 1)}
                      disabled={idx === bands.length - 1}
                      className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 transition cursor-pointer"
                      title="Move down in billing"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveBand(band.id, band.name)}
                      className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer ml-1"
                      title="Remove from package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Promote to headliner action if not currently headliner */}
                {!isHeadliner && (
                  <button
                    type="button"
                    onClick={() => onPromoteToHeadliner(band.id)}
                    className="w-full py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[8.5px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Crown className="w-2.5 h-2.5" /> Set as Headliner & Client
                  </button>
                )}

                {/* Details */}
                <div className="space-y-1.5 pt-1 text-[10px] text-zinc-300 font-mono">
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-500">Nightly Guarantee:</span>
                    <span className="text-emerald-400 font-bold">${band.guarantee.toLocaleString()} ({band.percentageSplit}% deal)</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-500">Contact / TM:</span>
                    <span className="text-white truncate max-w-[140px]">{band.contactName}</span>
                  </div>
                  {band.contactPhone && (
                    <div className="flex justify-between border-b border-zinc-900 pb-1">
                      <span className="text-zinc-500">Phone:</span>
                      <span className="text-zinc-400">{band.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Gear sharing notes */}
                <div className="bg-zinc-950 p-2 rounded border border-zinc-900 space-y-0.5 text-left">
                  <span className="text-[7.5px] font-mono text-amber-400 uppercase font-bold block">Backline / Shared Gear:</span>
                  <p className="text-[9.5px] text-zinc-400 font-sans leading-normal">
                    {band.sharedGearNotes || 'Standard gear agreement.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <span>Traveling Party: {band.membersCount} PAX</span>
                <span className={isHeadliner ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                  {isHeadliner ? '👑 TOP OF BILL' : `Slot #${idx + 1}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
