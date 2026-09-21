import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileUp, Check, Upload, Music } from 'lucide-react';

interface SubmitEpkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserProfile: any;
  epkSubmissionSuccess: boolean;
  setEpkSubmissionSuccess: (val: boolean) => void;
  epkFormBandName: string;
  setEpkFormBandName: (val: string) => void;
  epkFormBio: string;
  setEpkFormBio: (val: string) => void;
  epkFormHistory: string;
  setEpkFormHistory: (val: string) => void;
  epkFormMembers: string;
  setEpkFormMembers: (val: string) => void;
  epkFormProfileLink: string;
  setEpkFormProfileLink: (val: string) => void;
  epkFormTracks: any[];
  setEpkFormTracks: React.Dispatch<React.SetStateAction<any[]>>;
  isDragOver: boolean;
  setIsDragOver: (val: boolean) => void;
  setEpkSubmissions: React.Dispatch<React.SetStateAction<any[]>>;
  triggerNotification?: (msg: string) => void;
}

export const SubmitEpkModal: React.FC<SubmitEpkModalProps> = ({
  isOpen,
  onClose,
  selectedUserProfile,
  epkSubmissionSuccess,
  setEpkSubmissionSuccess,
  epkFormBandName,
  setEpkFormBandName,
  epkFormBio,
  setEpkFormBio,
  epkFormHistory,
  setEpkFormHistory,
  epkFormMembers,
  setEpkFormMembers,
  epkFormProfileLink,
  setEpkFormProfileLink,
  epkFormTracks,
  setEpkFormTracks,
  isDragOver,
  setIsDragOver,
  setEpkSubmissions,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && selectedUserProfile && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#0b0c0f] border border-emerald-900/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col relative shadow-[0_0_50px_rgba(16,185,129,0.15)] no-scrollbar"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-black/40 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <FileUp className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <h2 className="text-white font-black uppercase text-sm tracking-widest font-mono">
                    EPK Pitch Deck
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Submit your band profile & demo files to <span className="text-emerald-400">{selectedUserProfile.name}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  setEpkSubmissionSuccess(false);
                }} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              {epkSubmissionSuccess ? (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <Check className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Submission Successful!</h4>
                    <p className="text-xs text-zinc-400 max-w-sm">
                      Your Electronic Press Kit has been synced and delivered securely to <strong className="text-emerald-400">{selectedUserProfile.name}</strong>'s inbox.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEpkSubmissionSuccess(false);
                      onClose();
                    }}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Close Terminal
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!epkFormBandName.trim()) {
                      triggerNotification?.("⚠️ Band Name is required");
                      return;
                    }
                    if (!epkFormBio.trim()) {
                      triggerNotification?.("⚠️ Band Bio/Description is required");
                      return;
                    }
                    if (!epkFormHistory.trim()) {
                      triggerNotification?.("⚠️ Band History is required");
                      return;
                    }
                    if (!epkFormProfileLink.trim()) {
                      triggerNotification?.("⚠️ Web link/profile is required");
                      return;
                    }

                    const newEpk = {
                      id: `epk_${Date.now()}`,
                      targetLabel: selectedUserProfile.name,
                      bandName: epkFormBandName,
                      bio: epkFormBio,
                      history: epkFormHistory,
                      members: epkFormMembers,
                      profileLink: epkFormProfileLink,
                      tracks: epkFormTracks.length > 0 ? epkFormTracks : [{ name: "demo_track.mp3", size: "3.5 MB" }],
                      timestamp: new Date().toLocaleString(),
                      status: 'pending'
                    };

                    setEpkSubmissions(prev => [newEpk, ...prev]);
                    setEpkSubmissionSuccess(true);
                    triggerNotification?.(`💿 EPK submitted successfully to ${selectedUserProfile.name}!`);
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Band Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider">Band / Project Name *</label>
                      <input
                        type="text"
                        required
                        value={epkFormBandName}
                        onChange={(e) => setEpkFormBandName(e.target.value)}
                        placeholder="e.g. SEWER GASKET"
                        className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 outline-none transition-colors"
                      />
                    </div>

                    {/* Profile Link */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider">Web / Music Profile Link *</label>
                      <input
                        type="url"
                        required
                        value={epkFormProfileLink}
                        onChange={(e) => setEpkFormProfileLink(e.target.value)}
                        placeholder="e.g. https://bandcamp.com/sewer-gasket"
                        className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Members List */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider">Band Members & Roles</label>
                    <input
                      type="text"
                      value={epkFormMembers}
                      onChange={(e) => setEpkFormMembers(e.target.value)}
                      placeholder="e.g. John (Vocals), Pete (Guitars), Dan (Drums)"
                      className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 outline-none transition-colors"
                    />
                  </div>

                  {/* Short Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider">Sound Description / Short Bio *</label>
                    <textarea
                      required
                      rows={2}
                      value={epkFormBio}
                      onChange={(e) => setEpkFormBio(e.target.value)}
                      placeholder="Describe your sonic characteristics (e.g., Sludge / Grindcore blending doom with fast blasts)"
                      className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Biography / History */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider">Band History & Achievements *</label>
                    <textarea
                      required
                      rows={3}
                      value={epkFormHistory}
                      onChange={(e) => setEpkFormHistory(e.target.value)}
                      placeholder="Provide detailed background, previous releases, shows played, and plans."
                      className="w-full bg-black/60 border border-zinc-800 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-zinc-700 outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* File Uploader */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono font-black text-zinc-400 tracking-wider">Upload Demo Tracks (.mp3, .wav) *</label>
                    
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files) {
                          const files = Array.from(e.dataTransfer.files);
                          const audioFiles = files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.wav'));
                          if (audioFiles.length > 0) {
                            setEpkFormTracks(prev => [
                              ...prev,
                              ...audioFiles.map(f => ({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` }))
                            ]);
                            triggerNotification?.(`Added ${audioFiles.length} demo audio file(s)`);
                          } else {
                            triggerNotification?.("⚠️ Please upload only .mp3 or .wav audio files");
                          }
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${isDragOver ? 'border-emerald-500 bg-emerald-950/20' : 'border-zinc-800 hover:border-zinc-700 bg-black/40'}`}
                      onClick={() => {
                        const input = document.getElementById('epk-modal-file-input');
                        if (input) input.click();
                      }}
                    >
                      <input
                        id="epk-modal-file-input"
                        type="file"
                        multiple
                        accept=".mp3,.wav"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            const audioFiles = files.filter(f => f.name.endsWith('.mp3') || f.name.endsWith('.wav'));
                            setEpkFormTracks(prev => [
                              ...prev,
                              ...audioFiles.map(f => ({ name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` }))
                            ]);
                            triggerNotification?.(`Added ${audioFiles.length} demo track(s)`);
                          }
                        }}
                      />
                      <Upload className="w-6 h-6 text-zinc-500 mx-auto mb-1.5" />
                      <p className="text-[11px] font-mono font-bold text-zinc-300">Drag & drop demo audio here or <span className="text-emerald-400 underline">click to browse</span></p>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">Supports WAV or MP3 files • Multi-file upload supported</p>
                    </div>

                    {/* Show uploaded tracks */}
                    {epkFormTracks.length > 0 && (
                      <div className="bg-black/80 rounded-xl border border-zinc-850 p-2.5 max-h-24 overflow-y-auto space-y-1.5 no-scrollbar">
                        {epkFormTracks.map((track, i) => (
                          <div key={`epk-track-${track.name}-${i}`} className="flex items-center justify-between bg-zinc-950/80 border border-zinc-900 rounded px-2 py-1 text-[10px] font-mono">
                            <div className="flex items-center gap-2 truncate">
                              <Music className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-zinc-300 truncate">{track.name}</span>
                              <span className="text-zinc-600 text-[8px]">({track.size})</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEpkFormTracks(prev => prev.filter((_, idx) => idx !== i));
                                triggerNotification?.("Removed demo track");
                              }}
                              className="text-zinc-500 hover:text-rose-500 px-1 font-black transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-mono uppercase font-black transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-mono uppercase font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      Submit EPK Pitch
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
