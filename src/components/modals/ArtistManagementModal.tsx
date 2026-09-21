import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Edit2, Upload, Check, ShieldCheck, ShieldAlert, Trash2, Plus, Briefcase, DollarSign, User } from 'lucide-react';
import { Band, UserProfile } from '../../types';

interface ArtistManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBand: Band | null;
  setEditingBand: (band: Band | null) => void;
  editName: string;
  setEditName: (val: string) => void;
  editGenre: string;
  setEditGenre: (val: string) => void;
  editLogoUrl: string;
  setEditLogoUrl: (val: string) => void;
  editLogoPresetIdx: number;
  setEditLogoPresetIdx: (val: number) => void;
  handleUpdateBand: (e: React.FormEvent) => void;
  dragActive: boolean;
  setDragActive: (val: boolean) => void;
  handleLogoUpload: (file: File, isEdit: boolean) => void;
  editRosterFileInputRef: React.RefObject<HTMLInputElement | null>;
  rosterFileInputRef: React.RefObject<HTMLInputElement | null>;
  logoPresets: string[];
  bandLogoUrl: string;
  activeBand: Band | null;
  bands: Band[];
  activeBandId: string;
  setActiveBandId: (id: string) => void;
  addLog: (msg: string) => void;
  triggerNotification: (msg: string) => void;
  deletingBandId: string | null;
  setDeletingBandId: (id: string | null) => void;
  handleDeleteBand: (id: string, name: string) => void;
  newBandForm: any;
  setNewBandForm: React.Dispatch<React.SetStateAction<any>>;
  handleCreateBand: (e: React.FormEvent) => void;
  customLogoPreset: number;
  setCustomLogoPreset: (val: number) => void;

  // Tour Manager / Client Agency Extensions
  editIsManagedClient?: boolean;
  setEditIsManagedClient?: (val: boolean) => void;
  editManagementRole?: 'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner';
  setEditManagementRole?: (val: 'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner') => void;
  editCommissionPct?: number;
  setEditCommissionPct?: (val: number) => void;
  editDayRate?: number;
  setEditDayRate?: (val: number) => void;
  editExecutiveContactName?: string;
  setEditExecutiveContactName?: (val: string) => void;
  editExecutiveContactEmail?: string;
  setEditExecutiveContactEmail?: (val: string) => void;
  editExecutiveContactPhone?: string;
  setEditExecutiveContactPhone?: (val: string) => void;
  editClientRosterNotes?: string;
  setEditClientRosterNotes?: (val: string) => void;
  userProfile?: UserProfile | null;
}

export const ArtistManagementModal: React.FC<ArtistManagementModalProps> = ({
  isOpen,
  onClose,
  editingBand,
  setEditingBand,
  editName,
  setEditName,
  editGenre,
  setEditGenre,
  editLogoUrl,
  setEditLogoUrl,
  editLogoPresetIdx,
  setEditLogoPresetIdx,
  handleUpdateBand,
  dragActive,
  setDragActive,
  handleLogoUpload,
  editRosterFileInputRef,
  rosterFileInputRef,
  logoPresets,
  bandLogoUrl,
  activeBand,
  bands,
  activeBandId,
  setActiveBandId,
  addLog,
  triggerNotification,
  deletingBandId,
  setDeletingBandId,
  handleDeleteBand,
  newBandForm,
  setNewBandForm,
  handleCreateBand,
  customLogoPreset,
  setCustomLogoPreset,
  editIsManagedClient = false,
  setEditIsManagedClient = () => {},
  editManagementRole = 'tour_manager',
  setEditManagementRole = () => {},
  editCommissionPct = 15,
  setEditCommissionPct = () => {},
  editDayRate = 250,
  setEditDayRate = () => {},
  editExecutiveContactName = '',
  setEditExecutiveContactName = () => {},
  editExecutiveContactEmail = '',
  setEditExecutiveContactEmail = () => {},
  editExecutiveContactPhone = '',
  setEditExecutiveContactPhone = () => {},
  editClientRosterNotes = '',
  setEditClientRosterNotes = () => {},
  userProfile
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'owned' | 'managed'>('all');

  const filteredBands = bands.filter(b => {
    if (filterMode === 'owned') return !b.is_managed_client;
    if (filterMode === 'managed') return !!b.is_managed_client;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="band-modal-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.94, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 1 }}
            className="bg-[#0b0d13] border-2 border-[#1f2330] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            id="band-selection-manager-modal"
          >
            <div className="px-5 py-4 border-b border-[#252830] flex justify-between items-center bg-[#07080a]">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white font-display flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00ffcc]" /> 
                  EXECUTIVE ROSTER & TOUR MANAGER SUITE
                </h3>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Manage owned artist workspaces & client bands on tour</p>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  setEditingBand(null);
                }}
                className="p-1 hover:bg-zinc-800 rounded transition-colors text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {editingBand ? (
                /* EDITING DRILL DOWN MODE */
                <form onSubmit={handleUpdateBand} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                    <span className="text-[8.5px] font-mono text-[#00ffcc] uppercase tracking-wider font-extrabold flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> Edit Profile & Management Settings
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingBand(null)}
                      className="text-[8px] font-mono text-zinc-400 hover:text-white uppercase bg-zinc-800/80 hover:bg-zinc-750 px-2 py-0.5 rounded transition-transform cursor-pointer"
                    >
                      Return to List
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[8px] font-mono uppercase text-zinc-500 block mb-1">Artist / Band Name</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-emerald-500 text-xs px-2.5 py-1.5 rounded text-white font-mono uppercase tracking-wider"
                        required
                        placeholder="e.g. Spectral Decay"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono uppercase text-zinc-500 block mb-1">Genre</label>
                      <input 
                        type="text" 
                        value={editGenre}
                        onChange={(e) => setEditGenre(e.target.value)}
                        className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-emerald-500 text-xs px-2.5 py-1.5 rounded text-white font-mono uppercase tracking-wider"
                        placeholder="e.g. Sludge Metal"
                      />
                    </div>

                    {/* Operational Entity Type Toggle */}
                    <div className="bg-[#12151e] border border-zinc-800 rounded-xl p-3 space-y-3">
                      <label className="text-[8.5px] font-mono uppercase text-zinc-400 block font-bold">
                        Operational Entity Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditIsManagedClient(false)}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                            !editIsManagedClient
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-[9.5px] font-bold uppercase font-mono flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-400" /> Owned Band
                          </span>
                          <span className="text-[7.5px] text-zinc-400">Direct member / primary band</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditIsManagedClient(true)}
                          className={`p-2 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                            editIsManagedClient
                              ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-[9.5px] font-bold uppercase font-mono flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Managed Client
                          </span>
                          <span className="text-[7.5px] text-zinc-400">Tour manager / booking agent</span>
                        </button>
                      </div>

                      {/* Tour Manager fields when in client mode */}
                      {editIsManagedClient && (
                        <div className="space-y-2.5 pt-2 border-t border-zinc-800 animate-in fade-in duration-200">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[7.5px] font-mono uppercase text-zinc-400 block mb-1">Executive Role</label>
                              <select
                                value={editManagementRole}
                                onChange={(e: any) => setEditManagementRole(e.target.value)}
                                className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[10px] px-2 py-1.5 rounded text-white font-mono"
                              >
                                <option value="tour_manager">Tour Manager (TM)</option>
                                <option value="booking_agent">Booking Agent</option>
                                <option value="executive_producer">Executive Producer</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[7.5px] font-mono uppercase text-zinc-400 block mb-1">TM Commission (%)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editCommissionPct}
                                  onChange={(e) => setEditCommissionPct(parseFloat(e.target.value) || 0)}
                                  className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[10px] px-2 py-1.5 rounded text-white font-mono"
                                  placeholder="15"
                                />
                                <span className="absolute right-2 top-1.5 text-[10px] text-zinc-500 font-mono">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[7.5px] font-mono uppercase text-zinc-400 block mb-1">Executive Contact Name</label>
                              <input
                                type="text"
                                value={editExecutiveContactName}
                                onChange={(e) => setEditExecutiveContactName(e.target.value)}
                                className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[10px] px-2 py-1.5 rounded text-white font-mono"
                                placeholder="Miguel (@bdmCEO)"
                              />
                            </div>
                            <div>
                              <label className="text-[7.5px] font-mono uppercase text-zinc-400 block mb-1">Executive Email / Booking</label>
                              <input
                                type="email"
                                value={editExecutiveContactEmail}
                                onChange={(e) => setEditExecutiveContactEmail(e.target.value)}
                                className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[10px] px-2 py-1.5 rounded text-white font-mono"
                                placeholder="goregrindsickness@gmail.com"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[7.5px] font-mono uppercase text-zinc-400 block mb-1">Client Tour Notes & Directives</label>
                            <textarea
                              value={editClientRosterNotes}
                              onChange={(e) => setEditClientRosterNotes(e.target.value)}
                              className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[9.5px] px-2 py-1.5 rounded text-white font-mono resize-none h-14"
                              placeholder="e.g. Band requires 4-person hotel buyout, sound check priority, merch seller cut agreement."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[8px] font-mono uppercase text-[#00ffcc] block mb-1">Logo Artwork (Upload or Choose)</label>
                      
                      {/* Interactive Drag & Drop box */}
                      <div 
                        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActive(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleLogoUpload(e.dataTransfer.files[0], true);
                          }
                        }}
                        onClick={() => editRosterFileInputRef.current?.click()}
                        className={`cursor-pointer border-2 border-dashed rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          dragActive ? 'border-[#00ffcc] bg-[#142320]/60' : 'border-[#1b1f2b] hover:border-zinc-650 bg-[#12151d]'
                        }`}
                      >
                        <Upload className="w-4 h-4 text-zinc-500 hover:text-[#00ffcc] transition-colors" />
                        <span className="text-[8.5px] text-zinc-300 font-mono font-medium">Upload custom logo image file</span>
                        <span className="text-[7.5px] text-zinc-500 font-mono uppercase">Drag & Drop or Click (PNG/JPG under 2MB)</span>
                        <input 
                          type="file"
                          ref={editRosterFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => e.target.files && e.target.files[0] && handleLogoUpload(e.target.files[0], true)}
                        />
                      </div>

                      {/* Presets Row */}
                      <div className="mt-2.5">
                        <span className="text-[7.5px] font-mono uppercase text-zinc-500 block mb-1">Or Choose Aesthetic Preset</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {logoPresets.map((preset, idx) => (
                            <button
                              key={`edit-logo-preset-${idx}`}
                              type="button"
                              onClick={() => {
                                setEditLogoUrl(preset);
                                setEditLogoPresetIdx(idx);
                              }}
                              className={`w-8.5 h-8.5 rounded-lg overflow-hidden border-2 relative shrink-0 transition-all ${
                                (editLogoPresetIdx === idx || editLogoUrl === preset) ? 'border-[#00ffcc] scale-105' : 'border-zinc-800 hover:border-zinc-600'
                              }`}
                            >
                              <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              {(editLogoPresetIdx === idx || editLogoUrl === preset) && (
                                <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                  <Check className="w-3.5 h-3.5 text-[#00ffcc]" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setEditingBand(null)}
                      className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono font-bold uppercase text-[8.5px] tracking-wider rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-450 text-black font-mono font-bold uppercase text-[8.5px] tracking-wider rounded-lg shadow-lg transition-colors cursor-pointer"
                    >
                      Commit Changes
                    </button>
                  </div>
                </form>
              ) : (
                /* PROFILE LISTING & REGISTRATION LIST MODE */
                <>
                  {/* Active Artist Card */}
                  <div className="space-y-2">
                    <span className="text-[8.5px] font-mono uppercase text-zinc-500 tracking-wider">Current Active Focus</span>
                    <div className="bg-[#13161d] border border-[#00ffcc]/35 p-3 rounded-lg flex items-center justify-between shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#00ffcc] bg-zinc-800 shrink-0">
                          <img src={bandLogoUrl || activeBand?.logo_url} alt={activeBand?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold font-display text-white uppercase tracking-wider flex items-center gap-1.5">
                            {activeBand?.name}
                            {activeBand?.is_managed_client ? (
                              <span className="text-[7.5px] bg-amber-950/60 border border-amber-500/40 text-amber-400 font-mono px-1.5 py-0.5 rounded">
                                🎯 TM CLIENT ({activeBand.management_commission_pct || 15}%)
                              </span>
                            ) : (
                              <span className="text-[7.5px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                                👑 OWNED BAND
                              </span>
                            )}
                          </h4>
                          <span className="text-[8.5px] font-mono text-[#00ffcc] tracking-wide uppercase">
                            {activeBand?.genre} {activeBand?.is_managed_client && `• Executive TM: ${activeBand.executive_contact_name || '@bdmCEO'}`}
                          </span>
                        </div>
                      </div>
                      <span className="bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] text-[8px] font-mono font-bold px-2 py-0.5 rounded tracking-widest uppercase shrink-0">
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`flex-1 py-1 text-[8.5px] font-mono uppercase tracking-wider rounded transition-colors ${
                        filterMode === 'all' ? 'bg-[#181d26] text-[#00ffcc] font-bold border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      All ({bands.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('owned')}
                      className={`flex-1 py-1 text-[8.5px] font-mono uppercase tracking-wider rounded transition-colors ${
                        filterMode === 'owned' ? 'bg-[#181d26] text-emerald-400 font-bold border border-emerald-900/50' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      👑 Owned ({bands.filter(b => !b.is_managed_client).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('managed')}
                      className={`flex-1 py-1 text-[8.5px] font-mono uppercase tracking-wider rounded transition-colors ${
                        filterMode === 'managed' ? 'bg-[#181d26] text-amber-400 font-bold border border-amber-900/50' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      🎯 TM Clients ({bands.filter(b => !!b.is_managed_client).length})
                    </button>
                  </div>

                  {/* Switch Artist Section */}
                  <div className="space-y-2">
                    <span className="text-[8.5px] font-mono uppercase text-zinc-500 tracking-wider">Select Artist to Manage</span>
                    <div className="grid grid-cols-1 gap-2 max-h-[190px] overflow-y-auto pr-1">
                      {filteredBands.map((b, bIdx) => (
                        <div
                          key={`${b.id}-${bIdx}`}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                            b.id === activeBandId 
                              ? 'bg-[#181d26] border-[#00ffcc] text-white' 
                              : 'bg-[#111319]/80 border-zinc-900 text-zinc-400'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveBandId(b.id);
                              onClose();
                              addLog(`Switched management client focuses to: ${b?.name} (${b.is_managed_client ? 'TM Mode' : 'Owned Mode'})`);
                              triggerNotification(`Switched artist: ${b?.name} ${b.is_managed_client ? '(Tour Manager Mode)' : ''}`);
                            }}
                            className="flex items-center gap-3 text-left flex-grow min-w-0 cursor-pointer text-white hover:text-[#00ffcc] group"
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-zinc-800 bg-zinc-900 shrink-0">
                              <img src={b?.logo_url} alt={b?.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-center pr-1">
                                <h5 className="text-[11px] font-bold font-display truncate uppercase text-white group-hover:text-[#00ffcc] flex items-center gap-1.5">
                                  {b?.name}
                                  {b.is_managed_client ? (
                                    <span className="text-[7px] font-mono px-1 py-0.2 bg-amber-950/60 border border-amber-600/40 text-amber-400 rounded">
                                      🎯 TM CLIENT
                                    </span>
                                  ) : (
                                    <span className="text-[7px] font-mono px-1 py-0.2 bg-emerald-950/60 border border-emerald-600/40 text-emerald-400 rounded">
                                      👑 OWNED
                                    </span>
                                  )}
                                </h5>
                                {b.id === activeBandId && (
                                  <Check className="w-3.5 h-3.5 text-[#00ffcc] shrink-0" />
                                )}
                              </div>
                              <p className="text-[8px] font-mono text-zinc-500 truncate tracking-wide uppercase">
                                {b?.genre} {b.is_managed_client && `• ${b.management_commission_pct || 15}% TM Comm`}
                              </p>
                            </div>
                          </button>
                          {/* Options block */}
                          <div className="flex items-center gap-1 shrink-0 bg-zinc-950/30 p-0.5 rounded border border-zinc-900">
                            {deletingBandId === b.id ? (
                              <div className="flex items-center gap-1 bg-[#1a0f12] p-1 rounded border border-rose-900/50">
                                <span className="text-[7.5px] font-mono text-rose-500 uppercase">Sure?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBand(b.id, b?.name)}
                                  className="bg-rose-600 hover:bg-rose-500 text-white text-[8px] font-mono px-1.5 py-0.5 rounded uppercase"
                                >
                                  Yes
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingBandId(null)}
                                  className="text-[8px] font-mono text-zinc-400 hover:text-white px-1"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBand(b);
                                    setEditName(b?.name);
                                    setEditGenre(b?.genre || '');
                                    setEditLogoUrl(b?.logo_url);
                                    setEditLogoPresetIdx(logoPresets.indexOf(b?.logo_url));
                                    setEditIsManagedClient(!!b.is_managed_client);
                                    setEditManagementRole(b.management_role || 'tour_manager');
                                    setEditCommissionPct(b.management_commission_pct ?? 15);
                                    setEditDayRate(b.management_day_rate ?? 250);
                                    setEditExecutiveContactName(b.executive_contact_name || userProfile?.name || 'Miguel (@bdmCEO)');
                                    setEditExecutiveContactEmail(b.executive_contact_email || userProfile?.email || 'goregrindsickness@gmail.com');
                                    setEditExecutiveContactPhone(b.executive_contact_phone || '');
                                    setEditClientRosterNotes(b.client_roster_notes || '');
                                  }}
                                  className="p-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
                                  title="Edit artist specifications & TM settings"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingBandId(b.id)}
                                  className="p-1 rounded bg-rose-950/20 hover:bg-rose-950/75 text-rose-450 hover:text-rose-400 transition-all cursor-pointer"
                                  title="Delete artist profile"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add New Artist Form Section */}
                  <div className="border-t border-zinc-850 pt-4">
                    <form onSubmit={handleCreateBand} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8.5px] font-mono uppercase text-[#00ffcc] tracking-wider font-extrabold block">
                          + Register New Artist / Tour Client
                        </span>
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase">
                          Executive Booking Suite
                        </span>
                      </div>

                      {/* Client vs Personal Toggle */}
                      <div className="grid grid-cols-2 gap-2 bg-[#12151e] p-2 rounded-xl border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setNewBandForm((p: any) => ({ ...p, is_managed_client: false }))}
                          className={`p-1.5 rounded-lg border text-left text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            !newBandForm?.is_managed_client
                              ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <User className="w-3 h-3 text-emerald-400" /> Owned Band
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewBandForm((p: any) => ({ 
                            ...p, 
                            is_managed_client: true,
                            management_role: 'tour_manager',
                            management_commission_pct: 15,
                            executive_contact_name: userProfile?.name || 'Miguel (@bdmCEO)',
                            executive_contact_email: userProfile?.email || 'goregrindsickness@gmail.com'
                          }))}
                          className={`p-1.5 rounded-lg border text-left text-[9px] font-mono uppercase font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            newBandForm?.is_managed_client
                              ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                          }`}
                        >
                          <Briefcase className="w-3 h-3 text-amber-400" /> Managed TM Client
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[8px] font-mono uppercase text-zinc-500 block mb-1">Band / Artist Name</label>
                          <input 
                            type="text" 
                            placeholder={newBandForm?.is_managed_client ? "e.g. Sanguisugabogg / Snuffed on Sight" : "e.g. Spectral Decay"}
                            value={newBandForm?.name || ''}
                            onChange={(e) => setNewBandForm((p: any) => ({ ...p, name: e.target.value }))}
                            className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-emerald-500 text-xs px-2.5 py-1.5 rounded text-white font-mono uppercase tracking-wider"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[8px] font-mono uppercase text-zinc-500 block mb-1">Genre</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Brutal Death Metal / Hardcore" 
                            value={newBandForm?.genre || ''}
                            onChange={(e) => setNewBandForm((p: any) => ({ ...p, genre: e.target.value }))}
                            className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-emerald-500 text-xs px-2.5 py-1.5 rounded text-white font-mono uppercase tracking-wider"
                          />
                        </div>

                        {newBandForm?.is_managed_client && (
                          <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2 animate-in fade-in duration-200">
                            <span className="text-[8px] font-mono text-amber-400 uppercase font-black block">
                              Executive TM Booking Configuration
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[7px] font-mono uppercase text-zinc-400 block mb-0.5">TM Commission (%)</label>
                                <input
                                  type="number"
                                  value={newBandForm?.management_commission_pct ?? 15}
                                  onChange={(e) => setNewBandForm((p: any) => ({ ...p, management_commission_pct: parseFloat(e.target.value) || 0 }))}
                                  className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[9.5px] px-2 py-1 rounded text-white font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[7px] font-mono uppercase text-zinc-400 block mb-0.5">Executive Handle</label>
                                <input
                                  type="text"
                                  value={newBandForm?.executive_contact_name || 'Miguel (@bdmCEO)'}
                                  onChange={(e) => setNewBandForm((p: any) => ({ ...p, executive_contact_name: e.target.value }))}
                                  className="w-full bg-[#181b24] outline-none border border-zinc-800 focus:border-amber-500 text-[9.5px] px-2 py-1 rounded text-white font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="text-[8px] font-mono uppercase text-zinc-500 block mb-1">Logo / Artwork</label>
                          <div 
                            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragActive(false);
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                handleLogoUpload(e.dataTransfer.files[0], false);
                              }
                            }}
                            onClick={() => rosterFileInputRef.current?.click()}
                            className={`cursor-pointer border-2 border-dashed rounded-xl p-2.5 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              dragActive ? 'border-[#00ffcc] bg-[#142320]/60' : 'border-[#1b1f2b] hover:border-zinc-700 bg-[#12151d]'
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-[8px] text-zinc-300 font-mono">Upload logo image</span>
                            <input 
                              type="file"
                              ref={rosterFileInputRef}
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => e.target.files && e.target.files[0] && handleLogoUpload(e.target.files[0], false)}
                            />
                          </div>

                          {/* Preset Selectors row */}
                          <div className="mt-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {logoPresets.map((preset, idx) => (
                                <button
                                  key={`new-logo-preset-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setCustomLogoPreset(idx);
                                    setNewBandForm((p: any) => ({ ...p, logo_url: '' }));
                                  }}
                                  className={`w-7.5 h-7.5 rounded-lg overflow-hidden border-2 relative shrink-0 transition-all ${
                                    (customLogoPreset === idx && !newBandForm?.logo_url) ? 'border-[#00ffcc] scale-105' : 'border-zinc-800 hover:border-zinc-650'
                                  }`}
                                >
                                  <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  {(customLogoPreset === idx && !newBandForm?.logo_url) && (
                                    <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                                      <Check className="w-3 h-3 text-[#00ffcc]" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-2.5 font-mono font-bold uppercase text-[10px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow-lg transition-colors cursor-pointer mt-4 ${
                          newBandForm?.is_managed_client
                            ? 'bg-amber-500 hover:bg-amber-400 text-black'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {newBandForm?.is_managed_client ? 'Register Managed Tour Client' : 'Add Band to Roster'}
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ArtistManagementModal;
