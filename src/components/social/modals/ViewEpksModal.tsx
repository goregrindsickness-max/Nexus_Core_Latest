import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Music, ChevronDown, Link as LinkIcon, Play, Download, Check, Archive } from 'lucide-react';
import { playAmbientMetalDrone } from '../../../utils/socialFeedUtils';

interface ViewEpksModalProps {
  isOpen: boolean;
  onClose: () => void;
  epkFilterTab: string;
  setEpkFilterTab: (val: string) => void;
  epkSubmissions: any[];
  setEpkSubmissions: React.Dispatch<React.SetStateAction<any[]>>;
  userProfile: any;
  expandedEpkId: string | null;
  setExpandedEpkId: (val: string | null) => void;
  triggerNotification?: (msg: string) => void;
}

export const ViewEpksModal: React.FC<ViewEpksModalProps> = ({
  isOpen,
  onClose,
  epkFilterTab,
  setEpkFilterTab,
  epkSubmissions,
  setEpkSubmissions,
  userProfile,
  expandedEpkId,
  setExpandedEpkId,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#0b0c0f] border border-emerald-900/30 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in scale-in duration-300"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h2 className="text-white font-black uppercase text-sm tracking-widest font-mono">
                    EPK Reviews & Signings
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Review incoming talent submissions and manage label rosters
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  onClose();
                  setExpandedEpkId(null);
                }} 
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Subtabs for filtering EPKs */}
            <div className="flex border-b border-zinc-900 px-4 bg-zinc-950/20">
              <button
                onClick={() => { setEpkFilterTab('my_label'); setExpandedEpkId(null); }}
                className={`py-3 px-2 text-[10px] font-mono uppercase tracking-widest font-bold border-b-2 transition-all ${epkFilterTab === 'my_label' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                For Your Label ({epkSubmissions.filter(e => e.targetLabel.toLowerCase() === (userProfile?.label_company_name || 'Pro Label').toLowerCase()).length})
              </button>
              <button
                onClick={() => { setEpkFilterTab('all'); setExpandedEpkId(null); }}
                className={`py-3 px-2 text-[10px] font-mono uppercase tracking-widest font-bold border-b-2 transition-all ${epkFilterTab === 'all' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                All Platform Submissions ({epkSubmissions.length})
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3 no-scrollbar bg-black/20">
              {(() => {
                const activeLabelName = userProfile?.label_company_name || 'Pro Label';
                const filtered = epkSubmissions.filter(e => {
                  if (epkFilterTab === 'my_label') {
                    return e.targetLabel.toLowerCase() === activeLabelName.toLowerCase();
                  }
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="p-4 rounded-full bg-zinc-950 border border-zinc-900 text-zinc-600">
                        <Music className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-zinc-500 font-mono">No Electronic Press Kits submitted in this queue.</p>
                    </div>
                  );
                }

                return filtered.map((epk, epkIdx) => {
                  const isExpanded = expandedEpkId === epk.id;
                  const isPending = epk.status === 'pending';
                  const isAccepted = epk.status === 'accepted';
                  const isArchived = epk.status === 'archived';

                  return (
                    <div 
                      key={epk.id ? `epk-${epk.id}-${epkIdx}` : `epk-${epkIdx}`} 
                      className={`border rounded-xl transition-all duration-200 overflow-hidden ${isExpanded ? 'border-emerald-500/40 bg-zinc-950/80 shadow-lg' : 'border-zinc-900 bg-zinc-950/40 hover:bg-zinc-950/70 hover:border-zinc-850'}`}
                    >
                      {/* Summary Header Row */}
                      <div 
                        onClick={() => setExpandedEpkId(isExpanded ? null : epk.id)}
                        className="p-3.5 flex items-center justify-between cursor-pointer"
                      >
                        <div className="space-y-1 truncate pr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                              {epk.bandName}
                            </h3>
                            <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              isAccepted ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/40' :
                              isArchived ? 'bg-rose-950/50 text-rose-400 border border-rose-900/40' :
                              'bg-zinc-900 text-zinc-400 border border-zinc-800'
                            }`}>
                              {epk.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 font-mono">{epk.bio}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-[8px] text-zinc-600 font-mono uppercase">Submitted To</p>
                            <p className="text-[9px] text-zinc-400 font-mono font-bold truncate max-w-[120px]">{epk.targetLabel}</p>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
                        </div>
                      </div>

                      {/* Detailed Body Panel */}
                      {isExpanded && (
                        <div className="border-t border-zinc-900/60 p-4 bg-black/40 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="space-y-1">
                            <h4 className="text-[9px] uppercase font-mono font-black text-zinc-500 tracking-wider">Band Bio / Description</h4>
                            <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900/40">
                              {epk.bio}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-[9px] uppercase font-mono font-black text-zinc-500 tracking-wider">History & Plans</h4>
                            <p className="text-xs text-zinc-300 font-mono leading-relaxed bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900/40 whitespace-pre-wrap">
                              {epk.history}
                            </p>
                          </div>

                          {epk.members && (
                            <div className="space-y-1">
                              <h4 className="text-[9px] uppercase font-mono font-black text-zinc-500 tracking-wider">Roster Members</h4>
                              <div className="text-xs text-zinc-400 font-mono bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-900/40">
                                {epk.members}
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <h4 className="text-[9px] uppercase font-mono font-black text-zinc-500 tracking-wider">Links & Audio References</h4>
                            <div className="flex items-center gap-2">
                              <a 
                                href={epk.profileLink.startsWith('http') ? epk.profileLink : `https://${epk.profileLink}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-mono transition-colors"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                <span>View Bandcamp/Website Profile</span>
                              </a>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-[9px] uppercase font-mono font-black text-zinc-500 tracking-wider">Demo Tracks</h4>
                            <div className="space-y-2 max-w-md">
                              {epk.tracks.map((track: any, i: number) => (
                                <div key={`view-epk-track-${track.name}-${i}`} className="flex items-center justify-between bg-zinc-950/80 border border-zinc-900 rounded-lg p-2.5 text-[10px] font-mono">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <Music className="w-4 h-4 text-emerald-400 shrink-0" />
                                    <span className="text-zinc-200 truncate font-bold">{track.name}</span>
                                    <span className="text-zinc-600 text-[8px]">({track.size})</span>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                      type="button"
                                      onClick={() => {
                                        triggerNotification?.(`🔊 Simulating stream of demo track "${track.name}"`);
                                        playAmbientMetalDrone(track.name);
                                      }}
                                      className="p-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 rounded transition-colors"
                                      title="Play demo stream"
                                    >
                                      <Play className="w-3 h-3" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => triggerNotification?.(`📥 Downloading demo track: ${track.name} (${track.size})`)}
                                      className="p-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded transition-colors"
                                      title="Download track"
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                              <button
                                onClick={() => {
                                  setEpkSubmissions(prev => prev.map(e => e.id === epk.id ? { ...e, status: 'accepted' } : e));
                                  triggerNotification?.(`🎉 Signed ${epk.bandName} to your label roster!`);
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-mono uppercase font-black transition-colors flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" /> Sign Band to Roster
                              </button>
                              <button
                                onClick={() => {
                                  setEpkSubmissions(prev => prev.map(e => e.id === epk.id ? { ...e, status: 'archived' } : e));
                                  triggerNotification?.(`Archived EPK submission from ${epk.bandName}`);
                                }}
                                className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 hover:text-rose-300 rounded-lg text-[10px] font-mono uppercase font-black transition-colors flex items-center gap-1.5"
                              >
                                <Archive className="w-3.5 h-3.5" /> Decline / Archive
                              </button>
                            </div>
                          )}

                          {isAccepted && (
                            <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-lg p-3 text-xs text-emerald-400 font-mono flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              <span>Roster connection approved. Band is signed to the label catalogue.</span>
                            </div>
                          )}

                          {isArchived && (
                            <div className="bg-zinc-900/60 border border-zinc-850 rounded-lg p-3 text-xs text-zinc-500 font-mono flex items-center gap-2">
                              <Archive className="w-4 h-4" />
                              <span>EPK archived. Re-evaluation can be triggered by new submission requests.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-900 flex justify-end bg-black/40">
              <button
                onClick={() => {
                  onClose();
                  setExpandedEpkId(null);
                }}
                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 text-zinc-400 hover:text-white rounded-xl text-xs font-mono uppercase font-black transition-colors"
              >
                Close Reviews
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
