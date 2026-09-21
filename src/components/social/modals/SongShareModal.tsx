import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music } from 'lucide-react';

interface SongShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  songTitle: string;
  setSongTitle: (val: string) => void;
  songArtist: string;
  setSongArtist: (val: string) => void;
  songAlbum: string;
  setSongAlbum: (val: string) => void;
  songSpotifyUrl: string;
  setSongSpotifyUrl: (val: string) => void;
  songCoverUrl: string;
  setSongCoverUrl: (val: string) => void;
  triggerNotification?: (msg: string) => void;
}

export const SongShareModal: React.FC<SongShareModalProps> = ({
  isOpen,
  onClose,
  songTitle,
  setSongTitle,
  songArtist,
  setSongArtist,
  songAlbum,
  setSongAlbum,
  songSpotifyUrl,
  setSongSpotifyUrl,
  songCoverUrl,
  setSongCoverUrl,
  triggerNotification,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#0c0d10] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white p-1.5 rounded-full border border-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Music className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-display">Attach Spotify / Song Flash Card</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1">Song / Track Name *</label>
                <input 
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g., Altar of Sacrifice"
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1">Artist Name *</label>
                <input 
                  type="text"
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="e.g., Slayer"
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1">Album Name (Optional)</label>
                <input 
                  type="text"
                  value={songAlbum}
                  onChange={(e) => setSongAlbum(e.target.value)}
                  placeholder="e.g., Reign in Blood"
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1">Spotify Track URL or URI *</label>
                <input 
                  type="text"
                  value={songSpotifyUrl}
                  onChange={(e) => setSongSpotifyUrl(e.target.value)}
                  placeholder="e.g., https://open.spotify.com/track/..."
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-wide mb-1">Album Cover Image URL (Optional)</label>
                <input 
                  type="text"
                  value={songCoverUrl}
                  onChange={(e) => setSongCoverUrl(e.target.value)}
                  placeholder="e.g., https://..."
                  className="w-full bg-zinc-950 border border-zinc-900 focus:border-emerald-900/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={onClose}
                className="flex-1 bg-zinc-900 hover:bg-[#1a1c24] text-zinc-400 hover:text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg border border-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!songTitle.trim() || !songArtist.trim()) {
                    triggerNotification?.("Please provide both song title and artist name.");
                    return;
                  }
                  onClose();
                  triggerNotification?.("Song attached to draft. Click Post to publish.");
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest py-2.5 rounded-lg shadow-lg shadow-emerald-900/20 transition-colors"
              >
                Attach Song
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
