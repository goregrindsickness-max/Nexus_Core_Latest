import React from 'react';
import { X, Disc, Music, Play, ShoppingBag } from 'lucide-react';
import { AlbumEmbedData, SongEmbedData, ANALEPSY_QUIESCENCE_TRACKS } from '../types';
import { MarqueeText } from '../utils';
import { requestPauseSceneRadio } from '../../utils/mediaPlaybackCoordinator';

interface FullAlbumModalProps {
  album: AlbumEmbedData;
  onClose: () => void;
  onPlaySong?: (song: SongEmbedData) => void;
  onBuyFormat: (format: string, priceStr: string, bandName: string, albumName: string) => void;
}

export const FullAlbumModal: React.FC<FullAlbumModalProps> = ({
  album,
  onClose,
  onPlaySong,
  onBuyFormat,
}) => {
  return (
    <div className="fixed inset-0 z-[1000005] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-[#0c0507] border border-rose-500/60 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(244,63,94,0.45)] space-y-4 text-white relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Album Cover & Info Header */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.35)] shrink-0 bg-zinc-900 flex items-center justify-center">
            {album.coverUrl ? (
              <img src={album.coverUrl} alt={album.albumName} className="w-full h-full object-cover" />
            ) : (
              <Disc className="w-10 h-10 text-red-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-mono font-black text-white bg-red-950/90 px-2 py-0.5 rounded border border-red-500/40 uppercase tracking-widest inline-block mb-1">
              FULL ALBUM RELEASE
            </span>
            <MarqueeText
              text={album.albumName}
              className="text-base sm:text-lg font-mono font-black text-white uppercase tracking-wider"
              maxLength={22}
            />
            <MarqueeText
              text={album.band}
              className="text-xs font-mono font-extrabold text-red-500 uppercase tracking-wide"
              maxLength={24}
            />
            {album.releaseYear && (
              <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Released: {album.releaseYear}
              </p>
            )}
          </div>
        </div>

        {/* Tracklist Section */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <h4 className="text-[10px] font-mono font-extrabold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5" />
            <span>FULL TRACKLIST</span>
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {(album.tracks && album.tracks.length > 0
              ? album.tracks
              : ANALEPSY_QUIESCENCE_TRACKS
            ).map((track, idx) => (
              <div 
                key={`${track.title}-${idx}`}
                className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-zinc-950 border border-zinc-850 hover:border-red-500/40 text-xs font-mono text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-red-500 font-black text-[10px] w-4">0{idx + 1}</span>
                  <button 
                    onClick={() => {
                      requestPauseSceneRadio('album_track_preview');
                      onPlaySong?.({ band: album.band, title: track.title, album: album.albumName, duration: track.duration, coverArt: album.coverUrl });
                    }}
                    className="text-red-500 hover:text-red-400 cursor-pointer"
                    title="Preview Track"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                  <span className="truncate">{track.title}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono ml-2 shrink-0">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase Options (Digital, CD, Vinyl) Section */}
        <div className="space-y-2 pt-2 border-t border-zinc-800">
          <h4 className="text-[10px] font-mono font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>SELECT PURCHASE FORMAT</span>
          </h4>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {[
              { format: 'Digital', price: '$9.99', icon: '📥', color: 'hover:border-sky-500/60 hover:text-sky-300' },
              { format: 'CD', price: '$14.99', icon: '🎵', color: 'hover:border-emerald-500/60 hover:text-emerald-300' },
              { format: 'Vinyl', price: '$24.99', icon: '💿', color: 'hover:border-rose-500/60 hover:text-rose-300' }
            ].map((option, optIdx) => (
              <button
                key={`album-opt-${option.format}-${optIdx}`}
                onClick={() => {
                  onBuyFormat(option.format, option.price, album.band, album.albumName);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl transition-all cursor-pointer shadow group min-w-0 overflow-hidden ${option.color}`}
              >
                <span className="text-lg sm:text-xl mb-0.5">{option.icon}</span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-white group-hover:text-amber-300 uppercase truncate max-w-full">{option.format}</span>
                <span className="text-[10px] sm:text-xs font-mono font-black text-amber-400 mt-0.5 shrink-0">{option.price}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
