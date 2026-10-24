import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Smile, Film, X, Search, Check, Sparkles } from 'lucide-react';

interface CommentMediaPickerProps {
  attachedMedia: { url: string; type: 'image' | 'gif' } | null;
  onSelectMedia: (url: string, type: 'image' | 'gif') => void;
  onClearMedia: () => void;
  onInsertEmoji: (emoji: string) => void;
  disabled?: boolean;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Scene & Heavy',
    emojis: ['🤘', '🔥', '💀', '⚡', '🎸', '🥁', '🖤', '👑', '💥', '🗡️', '🩸', '☣️', '😈', '🔊', '🎚️', '📼', '💿', '🏟️', '🎟️', '📌']
  },
  {
    name: 'Reactions',
    emojis: ['❤️', '👍', '😂', '😮', '👏', '🙌', '💯', '🚀', '🏆', '🎯', '💫', '✨', '🍻', '🤯', '😍', '😎']
  },
  {
    name: 'Chaos & Metal',
    emojis: ['🎃', '👻', '👽', '☠️', '🦾', '🩻', '👾', '🌋', '💣', '🛡️', '⚔️', '⚰️', '🏴‍☠️']
  }
];

const PRESET_GIFS = [
  { id: 'g1', title: 'Headbanger Horns', category: 'metal', url: 'https://media.giphy.com/media/gui67YC5CH504/giphy.gif' },
  { id: 'g2', title: 'Mosh Pit Madness', category: 'mosh', url: 'https://media.giphy.com/media/xT39Cvc2v1HP3vM3UG/giphy.gif' },
  { id: 'g3', title: 'Heavy Guitar Solo', category: 'guitar', url: 'https://media.giphy.com/media/dM2xuxBJCg4Za/giphy.gif' },
  { id: 'g4', title: 'Crowd Stage Dive', category: 'mosh', url: 'https://media.giphy.com/media/l41lOdm2mP79BrmKY/giphy.gif' },
  { id: 'g5', title: 'Circle Pit Chaos', category: 'mosh', url: 'https://media.giphy.com/media/3o7TKrEzvLbsVAud8I/giphy.gif' },
  { id: 'g6', title: 'Mind Blown Riff', category: 'reaction', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
  { id: 'g7', title: 'Metal Salute Cheers', category: 'reaction', url: 'https://media.giphy.com/media/t2eNvUnjlN63C/giphy.gif' },
  { id: 'g8', title: 'Infernal Flames', category: 'fire', url: 'https://media.giphy.com/media/3oKIPwoeGErMmaI43S/giphy.gif' },
  { id: 'g9', title: 'Heavy Drum Solo', category: 'metal', url: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif' },
];

export const CommentMediaPicker: React.FC<CommentMediaPickerProps> = ({
  attachedMedia,
  onSelectMedia,
  onClearMedia,
  onInsertEmoji,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [customGifUrl, setCustomGifUrl] = useState('');

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        onSelectMedia(result, 'image');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const filteredGifs = PRESET_GIFS.filter(g => 
    !gifQuery || g.title.toLowerCase().includes(gifQuery.toLowerCase()) || g.category.toLowerCase().includes(gifQuery.toLowerCase())
  );

  return (
    <div className="relative inline-flex items-center gap-1">
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Upload Image Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => fileInputRef.current?.click()}
        className={`p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800/80 transition-colors cursor-pointer disabled:opacity-40 ${
          attachedMedia?.type === 'image' ? 'text-rose-400 bg-rose-950/40 border border-rose-800/50' : ''
        }`}
        title="Attach image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      {/* Emoji Picker Toggle */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setShowEmojiPicker(prev => !prev);
          setShowGifPicker(false);
        }}
        className={`p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 transition-colors cursor-pointer disabled:opacity-40 ${
          showEmojiPicker ? 'text-amber-400 bg-amber-950/40 border border-amber-800/50' : ''
        }`}
        title="Insert Emoji"
      >
        <Smile className="w-4 h-4" />
      </button>

      {/* GIF Picker Toggle */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setShowGifPicker(prev => !prev);
          setShowEmojiPicker(false);
        }}
        className={`p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-zinc-800/80 transition-colors cursor-pointer disabled:opacity-40 ${
          showGifPicker || attachedMedia?.type === 'gif' ? 'text-sky-400 bg-sky-950/40 border border-sky-800/50' : ''
        }`}
        title="Attach GIF"
      >
        <Film className="w-4 h-4" />
      </button>

      {/* Popover 1: Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-64 bg-[#14161d] border border-zinc-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
              <Smile className="w-3.5 h-3.5" /> Emojis
            </span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {EMOJI_CATEGORIES.map((cat, cIdx) => (
              <div key={cat.name || cIdx} className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block">
                  {cat.name}
                </span>
                <div className="grid grid-cols-6 gap-1">
                  {cat.emojis.map((emoji, eIdx) => (
                    <button
                      key={`${cat.name}-${emoji}-${eIdx}`}
                      type="button"
                      onClick={() => {
                        onInsertEmoji(emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 hover:bg-zinc-800 rounded-lg text-base text-center transition-transform active:scale-125 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popover 2: GIF Picker */}
      {showGifPicker && (
        <div className="absolute bottom-full mb-2 left-0 z-50 w-72 bg-[#14161d] border border-zinc-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
            <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1">
              <Film className="w-3.5 h-3.5" /> Metal GIFs
            </span>
            <button
              type="button"
              onClick={() => setShowGifPicker(false)}
              className="text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* GIF Search Filter */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search GIFs or paste URL..."
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/80 font-sans"
            />
          </div>

          {/* Preset GIFs Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
            {filteredGifs.map((gif) => (
              <div
                key={gif.id}
                onClick={() => {
                  onSelectMedia(gif.url, 'gif');
                  setShowGifPicker(false);
                }}
                className="group relative h-20 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-sky-500 cursor-pointer transition-all shadow-sm"
              >
                <img
                  src={gif.url}
                  alt={gif.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1">
                  <span className="text-[9px] font-mono text-zinc-300 truncate block">
                    {gif.title}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Optional Paste Custom GIF URL */}
          <div className="pt-2 mt-2 border-t border-zinc-800/80 flex gap-1.5">
            <input
              type="text"
              placeholder="Paste direct .gif URL..."
              value={customGifUrl}
              onChange={(e) => setCustomGifUrl(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-sky-500 font-sans"
            />
            <button
              type="button"
              disabled={!customGifUrl.trim()}
              onClick={() => {
                if (customGifUrl.trim()) {
                  onSelectMedia(customGifUrl.trim(), 'gif');
                  setCustomGifUrl('');
                  setShowGifPicker(false);
                }
              }}
              className="px-2 py-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[10px] font-mono font-bold rounded-lg transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
