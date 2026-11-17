import React from 'react';
import { Disc, Play } from 'lucide-react';
import { FeedPost, AlbumEmbedData, MarqueeText } from '../TimelineFeed';

export interface AlbumEmbedCardProps {
  post: FeedPost;
  onOpenAlbumModal: (album: AlbumEmbedData) => void;
  onBuyFormat: (format: string, price: string, band: string, album: string) => void;
}

export const AlbumEmbedCard: React.FC<AlbumEmbedCardProps> = ({
  post,
  onOpenAlbumModal,
  onBuyFormat,
}) => {
  if (!post.albumData) return null;
  const albumData = post.albumData;

  return (
    <div className="bg-[#0c0507] border border-red-900/60 hover:border-red-500/60 rounded-xl p-3.5 sm:p-4 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.45)] space-y-3.5 transition-all">
      {/* Header: Cover + Info */}
      <div className="flex gap-3.5 sm:gap-4 items-start">
        <div 
          onClick={() => onOpenAlbumModal(albumData)}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-red-500/40 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] relative shrink-0 bg-zinc-900 flex items-center justify-center cursor-pointer group"
        >
          {albumData.coverUrl ? (
            <img 
              src={albumData.coverUrl} 
              alt={albumData.albumName} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600';
              }}
            />
          ) : (
            <Disc className="w-10 h-10 text-red-500" />
          )}
          <span className="absolute bottom-1.5 left-1.5 bg-red-950/90 text-white border border-red-500/50 text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded shadow">
            ALBUM
          </span>
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <MarqueeText
            text={albumData.albumName}
            className="text-sm sm:text-base font-mono font-black text-white uppercase tracking-wider"
            maxLength={20}
          />
          <MarqueeText
            text={albumData.band}
            className="text-xs font-mono font-bold text-red-500 uppercase tracking-wide"
            maxLength={22}
          />
          {albumData.releaseYear && (
            <p className="text-[10px] font-mono text-zinc-500">
              Released: {albumData.releaseYear}
            </p>
          )}
          <button
            onClick={() => onOpenAlbumModal(albumData)}
            className="text-[10px] font-mono font-bold text-red-400 hover:text-white bg-red-950/90 hover:bg-red-900 border border-red-500/60 px-2.5 py-1 rounded-lg flex items-center gap-1.5 mt-2 uppercase tracking-wider cursor-pointer transition-all shadow"
          >
            <Disc className="w-3 h-3 text-red-500" /> VIEW ALBUM TRACKLIST & FORMATS
          </button>
        </div>
      </div>

      {/* Tracklist Preview Section */}
      {albumData.tracks && albumData.tracks.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-zinc-855/80">
          <span className="text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">
            TRACKLIST PREVIEW
          </span>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {albumData.tracks.map((track, idx) => (
              <div 
                key={`${track.title}-${idx}`}
                onClick={() => onOpenAlbumModal(albumData)}
                className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-zinc-950/80 border border-zinc-900/90 hover:border-red-500/50 hover:bg-zinc-900 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-red-500 font-bold text-[10px]">0{idx + 1}</span>
                  <Play className="w-3 h-3 text-red-500 group-hover:text-red-400 shrink-0" />
                  <span className="truncate group-hover:text-white">{track.title}</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono ml-2 shrink-0">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Physical & Digital Formats Order Row */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-855/80">
        <span className="text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest block">
          ORDER PHYSICAL & DIGITAL FORMATS
        </span>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { format: 'Digital', price: '$9.99', icon: '📥' },
            { format: 'CD', price: '$14.99', icon: '🎵' },
            { format: 'Vinyl', price: '$24.99', icon: '💿' }
          ].map((fmt, idx) => (
            <button
              key={`album-fmt-${fmt.format}-${idx}`}
              onClick={() => onBuyFormat(fmt.format, fmt.price, albumData.band, albumData.albumName)}
              className="flex flex-col sm:flex-row items-center justify-center sm:justify-between p-2 sm:px-2.5 sm:py-2 bg-zinc-950/90 hover:bg-red-950/80 border border-zinc-800/90 hover:border-red-500/60 rounded-xl text-xs font-mono font-bold text-zinc-300 hover:text-white transition-all cursor-pointer shadow-md group min-w-0 overflow-hidden"
            >
              <span className="flex items-center gap-1 min-w-0 truncate">
                <span className="text-xs sm:text-sm shrink-0">{fmt.icon}</span>
                <span className="uppercase text-[9px] sm:text-[10px] truncate group-hover:text-red-400">{fmt.format}</span>
              </span>
              <span className="text-[9px] sm:text-[10px] text-amber-400 group-hover:text-amber-300 font-mono font-black shrink-0 mt-0.5 sm:mt-0">{fmt.price}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
