import React from 'react';
import { Layers, Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { TourPackageBand } from '../TourManagerPackageModule';

interface SharedBacklineTabProps {
  bands: TourPackageBand[];
  clientBandName: string;
  onSaveProgress?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
}

export const SharedBacklineTab: React.FC<SharedBacklineTabProps> = ({
  bands,
  clientBandName,
  onSaveProgress,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt
}) => {
  const headliner = bands.find(b => b.role === 'headliner' || b.name.toLowerCase() === clientBandName.toLowerCase()) || bands[0];

  return (
    <div className="space-y-3">
      <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase font-mono">
              Tour Package Backline &amp; Trailer Sharing Matrix
            </h4>
          </div>
          <div className="flex items-center gap-2">
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
                title="Save tour backline matrix progress (Ctrl+S / Cmd+S)"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <Save className="w-3 h-3" /> Save Backline *
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Backline Saved
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-left">
            <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">
              🥁 Drum Rig Shared Kit
            </span>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
              <strong>{headliner?.name || 'Headliner'}</strong> provides Pearl Reference shells (Kick, 3 Rack Toms, 1 Floor Tom) &amp; DW heavy-duty rack. Support bands provide their own snare, cymbals, kick pedal, and throne.
            </p>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-left">
            <span className="text-[9px] font-mono text-amber-400 font-bold uppercase block">
              🔊 Bass Stage Rig
            </span>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
              Ampeg SVT-CL 8x10 cabinet provided on stage. All bassists bring direct preamp pedals/Darkglass Microtubes.
            </p>
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-left">
            <span className="text-[9px] font-mono text-purple-400 font-bold uppercase block">
              🚐 Cargo Trailer Tetris
            </span>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
              6x12 Cargo trailer: Row 1 = Headliner fly-rigs &amp; cabs; Row 2 = Support guitar cabs; Row 3 = Merch bins &amp; personal gear.
            </p>
          </div>
        </div>

        {/* Detailed Per-Band Equipment Breakdown */}
        <div className="space-y-2 pt-2 border-t border-zinc-850 text-left">
          <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">
            Lineup Gear Agreements:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bands.map((b) => (
              <div key={b.id} className="p-2.5 rounded bg-zinc-950/80 border border-zinc-900 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase">{b.name}</span>
                  <span className="text-[8.5px] font-mono text-amber-400 uppercase">{b.role.replace('_', ' ')}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">
                  {b.sharedGearNotes || 'Standard tour setup'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
