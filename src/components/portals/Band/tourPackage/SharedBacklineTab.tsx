import React, { useState } from 'react';
import { Layers, Save, CheckCircle2, RefreshCw, Edit3, X, Drum, Volume2, Truck, Music, Radio, Check } from 'lucide-react';
import { TourPackageBand, SharedBacklineConfig } from '../../../../lib/tourPackageManager';

interface SharedBacklineTabProps {
  bands: TourPackageBand[];
  clientBandName: string;
  backlineConfig?: SharedBacklineConfig;
  onUpdateBacklineConfig?: (newConfig: SharedBacklineConfig) => void;
  onUpdateBandGearNotes?: (bandId: string, notes: string) => void;
  onSaveProgress?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
}

export const SharedBacklineTab: React.FC<SharedBacklineTabProps> = ({
  bands,
  clientBandName,
  backlineConfig,
  onUpdateBacklineConfig,
  onUpdateBandGearNotes,
  onSaveProgress,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt
}) => {
  const headliner = bands.find(b => b.role === 'headliner' || b.name.toLowerCase() === clientBandName.toLowerCase()) || bands[0];

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBandGearId, setEditingBandGearId] = useState<string | null>(null);
  const [tempBandGearNotes, setTempBandGearNotes] = useState('');

  // Local Backline Form State
  const [drumKitNotes, setDrumKitNotes] = useState(
    backlineConfig?.drumKitNotes ||
    'Pearl Reference Drum Kit provided by Headliner (22" Kick, 10"/12"/14" Toms, heavy rack). Support acts supply snare, cymbals, kick pedal, and throne.'
  );
  const [drumSupportRules, setDrumSupportRules] = useState(
    backlineConfig?.drumSupportRules ||
    'No adjustments to memory locks without stage tech permission. 15-minute turnaround between sets.'
  );
  const [bassRigNotes, setBassRigNotes] = useState(
    backlineConfig?.bassRigNotes ||
    'Ampeg SVT-CL 8x10 Stage Rig provided. All touring bassists use direct pedalboard/DI outputs to FOH with stage monitor split.'
  );
  const [bassSupportRules, setBassSupportRules] = useState(
    backlineConfig?.bassSupportRules || 'Line out from Darkglass/SansAmp pedal required.'
  );
  const [trailerNotes, setTrailerNotes] = useState(
    backlineConfig?.trailerNotes ||
    '6x12 Cargo trailer: Row 1 = Headliner fly-rigs & cabs; Row 2 = Support guitar cabs; Row 3 = Merch bins & personal luggage.'
  );
  const [guitarCabNotes, setGuitarCabNotes] = useState(
    backlineConfig?.guitarCabNotes ||
    'Headliner and Direct Support share 2x 4x12 Marshall/Mesa stage cabs. Openers bring compact heads or modelers.'
  );
  const [paMonitorsNotes, setPaMonitorsNotes] = useState(
    backlineConfig?.paMonitorsNotes ||
    'In-Ear Monitor transmitters racked in Stage Left rack. Wireless channels coordinated per city RF sweep.'
  );

  const openBacklineModal = () => {
    if (backlineConfig) {
      setDrumKitNotes(backlineConfig.drumKitNotes || '');
      setDrumSupportRules(backlineConfig.drumSupportRules || '');
      setBassRigNotes(backlineConfig.bassRigNotes || '');
      setBassSupportRules(backlineConfig.bassSupportRules || '');
      setTrailerNotes(backlineConfig.trailerNotes || '');
      setGuitarCabNotes(backlineConfig.guitarCabNotes || '');
      setPaMonitorsNotes(backlineConfig.paMonitorsNotes || '');
    }
    setIsEditModalOpen(true);
  };

  const handleSaveBackline = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SharedBacklineConfig = {
      drumKitNotes: drumKitNotes.trim(),
      drumSupportRules: drumSupportRules.trim(),
      bassRigNotes: bassRigNotes.trim(),
      bassSupportRules: bassSupportRules.trim(),
      trailerNotes: trailerNotes.trim(),
      guitarCabNotes: guitarCabNotes.trim(),
      paMonitorsNotes: paMonitorsNotes.trim()
    };
    onUpdateBacklineConfig?.(updated);
    setIsEditModalOpen(false);
  };

  const openBandGearModal = (b: TourPackageBand) => {
    setEditingBandGearId(b.id);
    setTempBandGearNotes(b.sharedGearNotes || '');
  };

  const handleSaveBandGear = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBandGearId) {
      onUpdateBandGearNotes?.(editingBandGearId, tempBandGearNotes.trim());
      setEditingBandGearId(null);
    }
  };

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
          <div className="flex items-center gap-2 flex-wrap">
            {lastSavedAt && (
              <span className="text-[9.5px] font-mono text-zinc-500">
                Saved: {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              type="button"
              onClick={openBacklineModal}
              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30"
            >
              <Edit3 className="w-3 h-3" /> Edit Backline Setup
            </button>
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

        {/* Core 3 Matrix Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-left relative group">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase block">
                🥁 Drum Rig Shared Kit
              </span>
              <button
                type="button"
                onClick={openBacklineModal}
                className="text-[8px] font-mono text-zinc-500 hover:text-emerald-400 uppercase opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                Edit
              </button>
            </div>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
              {backlineConfig?.drumKitNotes || drumKitNotes}
            </p>
            {backlineConfig?.drumSupportRules && (
              <p className="text-[9.5px] text-zinc-400 border-t border-zinc-900 pt-1 font-mono">
                <strong className="text-zinc-300">Rules:</strong> {backlineConfig.drumSupportRules}
              </p>
            )}
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-left relative group">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-amber-400 font-bold uppercase block">
                🔊 Bass Stage Rig
              </span>
              <button
                type="button"
                onClick={openBacklineModal}
                className="text-[8px] font-mono text-zinc-500 hover:text-amber-400 uppercase opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                Edit
              </button>
            </div>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
              {backlineConfig?.bassRigNotes || bassRigNotes}
            </p>
            {backlineConfig?.bassSupportRules && (
              <p className="text-[9.5px] text-zinc-400 border-t border-zinc-900 pt-1 font-mono">
                <strong className="text-zinc-300">Direct In:</strong> {backlineConfig.bassSupportRules}
              </p>
            )}
          </div>

          <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-900 space-y-2 text-left relative group">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-purple-400 font-bold uppercase block">
                🚐 Cargo Trailer Tetris
              </span>
              <button
                type="button"
                onClick={openBacklineModal}
                className="text-[8px] font-mono text-zinc-500 hover:text-purple-400 uppercase opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                Edit
              </button>
            </div>
            <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">
              {backlineConfig?.trailerNotes || trailerNotes}
            </p>
          </div>
        </div>

        {/* Additional Backline Gear Info */}
        {(backlineConfig?.guitarCabNotes || backlineConfig?.paMonitorsNotes) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-left">
            {backlineConfig.guitarCabNotes && (
              <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-900 space-y-1">
                <span className="text-[8.5px] font-mono text-cyan-400 uppercase font-bold block">
                  🎸 Guitar Cabs &amp; Stage Plot
                </span>
                <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                  {backlineConfig.guitarCabNotes}
                </p>
              </div>
            )}
            {backlineConfig.paMonitorsNotes && (
              <div className="bg-zinc-950/70 p-2.5 rounded-lg border border-zinc-900 space-y-1">
                <span className="text-[8.5px] font-mono text-rose-400 uppercase font-bold block">
                  📻 Wireless RF &amp; IEM Transmitters
                </span>
                <p className="text-[10px] text-zinc-300 font-sans leading-relaxed">
                  {backlineConfig.paMonitorsNotes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Detailed Per-Band Equipment Breakdown */}
        <div className="space-y-2 pt-2 border-t border-zinc-850 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">
              Lineup Gear Agreements:
            </span>
            <span className="text-[8.5px] font-mono text-zinc-500">
              Click any band to edit their gear agreement
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bands.map((b) => (
              <div
                key={b.id}
                onClick={() => openBandGearModal(b)}
                className="p-2.5 rounded bg-zinc-950/80 hover:bg-zinc-900/60 border border-zinc-900 hover:border-amber-500/40 space-y-1 cursor-pointer transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white uppercase">{b.name}</span>
                    <span className="text-[8.5px] font-mono text-amber-400 uppercase">({b.role.replace('_', ' ')})</span>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-500 group-hover:text-amber-300 uppercase flex items-center gap-0.5">
                    <Edit3 className="w-2.5 h-2.5" /> Edit
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                  {b.sharedGearNotes || 'Standard tour setup'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Shared Backline Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121a] border border-amber-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Edit Shared Backline &amp; Trailer Matrix
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBackline} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto text-left">
              <div>
                <label className="text-[9px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                  🥁 Shared Drum Kit Notes
                </label>
                <textarea
                  rows={2}
                  value={drumKitNotes}
                  onChange={(e) => setDrumKitNotes(e.target.value)}
                  placeholder="e.g. Headliner provides shells & hardware rack. Support bands supply snare, cymbals, kick pedal."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-emerald-400/80 uppercase font-bold block mb-1">
                  Drum Support Turnaround &amp; Memory Lock Rules
                </label>
                <input
                  type="text"
                  value={drumSupportRules}
                  onChange={(e) => setDrumSupportRules(e.target.value)}
                  placeholder="e.g. 15-minute turnaround between sets. No moving master clamps."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-amber-400 uppercase font-bold block mb-1">
                  🔊 Bass Stage Rig Setup
                </label>
                <textarea
                  rows={2}
                  value={bassRigNotes}
                  onChange={(e) => setBassRigNotes(e.target.value)}
                  placeholder="e.g. Ampeg SVT-CL 8x10 provided. Bassists use direct DI to FOH."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-purple-400 uppercase font-bold block mb-1">
                  🚐 Cargo Trailer Tetris &amp; Packing Order
                </label>
                <textarea
                  rows={2}
                  value={trailerNotes}
                  onChange={(e) => setTrailerNotes(e.target.value)}
                  placeholder="e.g. Row 1 = Headliner fly-rigs; Row 2 = Support guitar cabs; Row 3 = Merch bins."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                  🎸 Guitar Cabs &amp; Stage Plot
                </label>
                <input
                  type="text"
                  value={guitarCabNotes}
                  onChange={(e) => setGuitarCabNotes(e.target.value)}
                  placeholder="e.g. Dual 4x12 cabs on stage left and right."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-mono text-rose-400 uppercase font-bold block mb-1">
                  📻 Wireless RF &amp; IEM Notes
                </label>
                <input
                  type="text"
                  value={paMonitorsNotes}
                  onChange={(e) => setPaMonitorsNotes(e.target.value)}
                  placeholder="e.g. In-Ear Monitor rack in Trailer Rack A. Coordinated wireless channels."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Save Backline Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Single Band Gear Modal */}
      {editingBandGearId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121a] border border-amber-500/40 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Edit Gear Contribution: {bands.find(b => b.id === editingBandGearId)?.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBandGearId(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBandGear} className="p-4 space-y-3 text-left">
              <div>
                <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                  Gear Provided / Shared Setup Agreement
                </label>
                <textarea
                  rows={4}
                  required
                  value={tempBandGearNotes}
                  onChange={(e) => setTempBandGearNotes(e.target.value)}
                  placeholder="e.g. Provides complete 8x10 Bass Cab & Pearl Drum shell kit. IEM rack in Trailer Rack A."
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingBandGearId(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Save Gear Notes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
