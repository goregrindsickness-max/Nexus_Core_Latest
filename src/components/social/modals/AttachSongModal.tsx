import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, X, Search } from 'lucide-react';

export interface AttachSongModalProps {
  showSongModal: boolean;
  setShowSongModal: (val: boolean) => void;
  inAppSongsList: any[];
  setAttachedSong: (song: any) => void;
  triggerNotification?: (msg: string) => void;
}

export const AttachSongModal: React.FC<AttachSongModalProps> = ({
  showSongModal,
  setShowSongModal,
  inAppSongsList,
  setAttachedSong,
  triggerNotification,
}) => {
  const [songSearchQuery, setSongSearchQuery] = useState('');

  return (
    <AnimatePresence>
      {showSongModal && (
        <motion.div
          key="song-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#121214] border border-emerald-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40">
              <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-display">
                <Volume2 className="w-4 h-4 text-emerald-400" /> Attach Song From Scene Catalog
              </span>
              <button
                onClick={() => setShowSongModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={songSearchQuery}
                  onChange={(e) => setSongSearchQuery(e.target.value)}
                  placeholder="Search track title, band name, or album..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-colors"
                  autoFocus
                />
              </div>

              {/* Filtered Song List */}
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {inAppSongsList.filter((song) => {
                  const query = songSearchQuery.toLowerCase();
                  return (
                    song.title?.toLowerCase().includes(query) ||
                    song.band?.toLowerCase().includes(query) ||
                    song.album?.toLowerCase().includes(query)
                  );
                }).length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-6 font-mono">No matching in-app tracks found.</p>
                ) : (
                  inAppSongsList
                    .filter((song) => {
                      const query = songSearchQuery.toLowerCase();
                      return (
                        song.title?.toLowerCase().includes(query) ||
                        song.band?.toLowerCase().includes(query) ||
                        song.album?.toLowerCase().includes(query)
                      );
                    })
                    .map((song, sIdx) => (
                      <div
                        key={song.id ? `song-attach-${song.id}-${sIdx}` : `song-attach-${sIdx}`}
                        onClick={() => {
                          setAttachedSong(song);
                          setShowSongModal(false);
                          setSongSearchQuery('');
                          triggerNotification?.(`Attached song: "${song.title}"`);
                        }}
                        className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 hover:bg-emerald-950/20 border border-zinc-850 hover:border-emerald-900/30 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-center shrink-0 text-zinc-500 group-hover:text-emerald-400 font-bold text-xs animate-pulse">
                            ♫
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                              {song.title}
                            </h5>
                            <p className="text-[10px] text-zinc-500 truncate font-mono uppercase tracking-wide">
                              {song.band} • <span className="text-zinc-600">{song.album}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">{song.duration}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
