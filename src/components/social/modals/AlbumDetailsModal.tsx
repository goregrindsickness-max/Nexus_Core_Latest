import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Disc, X, PlayCircle, PauseCircle, Music, Download } from 'lucide-react';
import { universalAudioPlayer } from '../../../utils/audioEngine';

export interface AlbumDetailsModalProps {
  selectedAlbum: any | null;
  setSelectedAlbum: (val: any | null) => void;
  triggerNotification?: (msg: string) => void;
  openCheckout?: (type: string, item: any) => void;
}

export const AlbumDetailsModal: React.FC<AlbumDetailsModalProps> = ({
  selectedAlbum,
  setSelectedAlbum,
  triggerNotification,
  openCheckout,
}) => {
  const [playingTrackIdx, setPlayingTrackIdx] = useState<number | null>(null);

  const handleTrackClick = (track: any, trackIdx: number) => {
    if (playingTrackIdx === trackIdx && universalAudioPlayer.getIsPlaying()) {
      universalAudioPlayer.pause();
      setPlayingTrackIdx(null);
    } else {
      setPlayingTrackIdx(trackIdx);
      universalAudioPlayer.play(
        {
          id: track.id || `track_${trackIdx}`,
          title: track.title,
          artist: selectedAlbum.band,
          album: selectedAlbum.albumName,
          audioUrl: track.audioUrl || track.url,
          duration: track.duration
        },
        {
          onEnded: () => setPlayingTrackIdx(null),
          onStateChange: (isPlaying) => {
            if (!isPlaying) setPlayingTrackIdx(null);
          }
        }
      );
      triggerNotification?.(`Playing "${track.title}" by ${selectedAlbum.band}...`);
    }
  };

  return (
    <AnimatePresence>
      {selectedAlbum && (
        <motion.div
          key="album-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[1000005] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0b0c0e] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
              <span className="text-xs font-black uppercase text-rose-500 tracking-wider flex items-center gap-1.5 font-display">
                <Music className="w-4 h-4 text-rose-500" /> OFFICIAL RELEASE & MERCH
              </span>
              <button
                onClick={() => {
                  universalAudioPlayer.stop();
                  setSelectedAlbum(null);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 no-scrollbar">
              {/* Header: Official Album Cover & Info */}
              <div className="flex items-start gap-4">
                {/* Official Cover Art Showcase */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 select-none group/cover rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl">
                  {selectedAlbum.coverUrl ? (
                    <img
                      src={selectedAlbum.coverUrl}
                      alt={selectedAlbum.albumName}
                      className="w-full h-full object-cover group-hover/cover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-2 text-center bg-zinc-950">
                      <Music className="w-8 h-8 text-rose-500 mb-1" />
                      <span className="text-[8px] font-mono text-zinc-400 uppercase">OFFICIAL ART</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent flex items-end p-2 pointer-events-none">
                    <span className="text-[8px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded tracking-widest uppercase font-mono shadow-sm">
                      ALBUM
                    </span>
                  </div>
                </div>
                {/* Album Info */}
                <div className="min-w-0 flex-1 pt-1">
                  <h4 className="text-base font-black text-white hover:text-rose-400 transition-colors truncate leading-tight">
                    {selectedAlbum.albumName}
                  </h4>
                  <p className="text-xs text-rose-500 font-bold tracking-widest uppercase truncate mt-1">
                    {selectedAlbum.band}
                  </p>
                  <p className="text-xs text-zinc-400 font-mono mt-1">
                    Released: {selectedAlbum.releaseYear || '2026'}
                  </p>
                </div>
              </div>

              {/* Tracklist */}
              <div className="bg-[#050507] border border-zinc-900 rounded-xl p-3 font-mono">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 px-1 flex items-center justify-between">
                  <span>TRACKLIST</span>
                  <span className="text-[8px] text-zinc-500">CLICK TO PLAY</span>
                </div>
                <div className="space-y-1">
                  {selectedAlbum.tracks?.map((track: any, trackIdx: number) => {
                    const isCurrent = playingTrackIdx === trackIdx;
                    return (
                      <div
                        key={`track-${track.id || track.title || trackIdx}-${trackIdx}`}
                        onClick={() => handleTrackClick(track, trackIdx)}
                        className={`flex items-center justify-between py-2 px-2.5 rounded-lg cursor-pointer group/track transition-all ${
                          isCurrent
                            ? 'bg-rose-500/15 border border-rose-500/30 text-white'
                            : 'hover:bg-zinc-900/60 text-zinc-300 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-xs w-4 text-right font-bold ${isCurrent ? 'text-rose-400' : 'text-rose-500'}`}>
                            {String(trackIdx + 1).padStart(2, '0')}
                          </span>
                          {isCurrent ? (
                            <PauseCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-rose-500 group-hover/track:text-rose-400 transition-colors shrink-0" />
                          )}
                          <span className={`text-xs transition-colors truncate ${isCurrent ? 'text-rose-300 font-bold' : 'group-hover/track:text-white'}`}>
                            {track.title}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 group-hover/track:text-zinc-400 transition-colors font-mono">
                          {track.duration}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Section */}
              <div className="border-t border-zinc-900/60 pt-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2.5 font-mono">
                  ORDER PHYSICAL & DIGITAL FORMATS
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {selectedAlbum.purchaseLinks?.map((link: any, idx: number) => (
                    <button
                      key={`format-${link.format || idx}`}
                      onClick={() => {
                        openCheckout?.('merch', {
                          name: `${selectedAlbum.band} - ${selectedAlbum.albumName} (${link.format})`,
                          price: parseFloat(String(link.price).replace('$', '')),
                          thumbnail: selectedAlbum.coverUrl,
                          sizes: [],
                          bandName: selectedAlbum.band,
                        });
                        setSelectedAlbum(null); // Auto close modal on checkout
                        triggerNotification?.(
                          `Adding ${selectedAlbum.band} - ${selectedAlbum.albumName} (${link.format}) to order...`
                        );
                      }}
                      className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-1 p-2 rounded-xl border border-zinc-900 hover:border-rose-600/40 bg-zinc-950/80 hover:bg-rose-950/15 text-center text-zinc-400 hover:text-rose-400 transition-all duration-200 group/btn cursor-pointer min-w-0 overflow-hidden"
                    >
                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 min-w-0 truncate">
                        {link.format === 'Vinyl' ? (
                          <Disc className="w-3.5 h-3.5 text-rose-500/80 shrink-0" />
                        ) : link.format === 'CD' ? (
                          <Music className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-cyan-500/80 shrink-0" />
                        )}
                        <span className="truncate">{link.format}</span>
                      </span>
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400 group-hover/btn:text-white shrink-0">
                        {link.price}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

