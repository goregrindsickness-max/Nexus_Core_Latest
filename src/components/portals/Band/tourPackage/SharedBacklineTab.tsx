import React from 'react';
import { Layers } from 'lucide-react';
import { TourPackageBand } from '../TourManagerPackageModule';

interface SharedBacklineTabProps {
  bands: TourPackageBand[];
  clientBandName: string;
}

export const SharedBacklineTab: React.FC<SharedBacklineTabProps> = ({
  bands,
  clientBandName
}) => {
  const headliner = bands.find(b => b.role === 'headliner' || b.name.toLowerCase() === clientBandName.toLowerCase()) || bands[0];
  const supportBands = bands.filter(b => b.id !== headliner?.id);

  return (
    <div className="space-y-3">
      <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-850">
          <Layers className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-bold text-white uppercase font-mono">
            Tour Package Backline &amp; Trailer Sharing Matrix
          </h4>
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
