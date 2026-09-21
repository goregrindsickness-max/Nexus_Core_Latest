import React from 'react';
import { FeedPost } from '../TimelineFeed';

export interface TapeEmbedCardProps {
  post: FeedPost;
  isPlaying: boolean;
  progress: number;
  onTogglePlay: () => void;
  onSeek: (progress: number) => void;
  onStop: () => void;
}

export const TapeEmbedCard: React.FC<TapeEmbedCardProps> = ({
  post,
  isPlaying,
  progress,
  onTogglePlay,
  onSeek,
  onStop,
}) => {
  if (!post.tapeData) return null;

  // Helper to format MM:SS based on percentage of duration
  const getFormattedTime = () => {
    if (!post.tapeData) return '00:00';
    const durStr = post.tapeData.duration || '42:15';
    const parts = durStr.split(':').map(Number);
    let totalSeconds = 0;
    if (parts.length === 2) {
      totalSeconds = (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
      totalSeconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    } else {
      totalSeconds = parts[0] * 60;
    }

    const currentSeconds = (progress / 100) * totalSeconds;
    const curMin = Math.floor(currentSeconds / 60);
    const curSec = Math.floor(currentSeconds % 60);
    return `${curMin.toString().padStart(2, '0')}:${curSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#050505] rounded-xl p-4 my-3 border border-zinc-900 shadow-inner overflow-hidden relative group select-none">
      {/* Ambient glowing effect */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-amber-500/20 blur-xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}></div>

      <div className="flex flex-col gap-5 relative z-10">
        {/* Realistic Cassette Tape UI */}
        <div className="relative mx-auto w-full max-w-[340px] aspect-[1.58] bg-[#1a1a1a] rounded-lg shadow-2xl border border-[#0a0a0a] overflow-hidden flex flex-col p-1.5 ring-1 ring-white/10">
          {/* Texture overlay for the plastic shell */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>

          {/* 4 Corner Screws */}
          <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-700 rotate-45"></div>
          </div>
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-700 -rotate-45"></div>
          </div>
          <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-700 rotate-90"></div>
          </div>
          <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-700"></div>
          </div>

          {/* Main Label / Sticker Area */}
          <div className="relative z-10 mx-2 mt-2 h-[68%] bg-[#1c1c1c] rounded-sm shadow-[0_0_2px_rgba(0,0,0,1)] border border-white/5 flex flex-col items-center justify-between p-1.5">

            {/* Label Text Top Header */}
            <div className="w-full px-1 z-20">
              <div className="w-full bg-[#050505] border border-white/10 px-2.5 py-1 flex justify-between items-center shadow-sm rounded-sm gap-2">
                {/* Band Name with Marquee if long */}
                <div className="max-w-[130px] overflow-hidden flex items-center">
                  {post.tapeData.band.length > 12 ? (
                    <div className="animate-marquee-smooth gap-3 shrink-0 flex items-center">
                      <span className="text-xs font-mono font-extrabold text-zinc-200 uppercase tracking-wide whitespace-nowrap">{post.tapeData.band}</span>
                      <span className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-wide">•</span>
                      <span className="text-xs font-mono font-extrabold text-zinc-200 uppercase tracking-wide whitespace-nowrap">{post.tapeData.band}</span>
                      <span className="text-xs font-mono font-extrabold text-zinc-400 uppercase tracking-wide">•</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-extrabold text-zinc-200 uppercase truncate tracking-wide">{post.tapeData.band}</span>
                  )}
                </div>

                {/* Title with Marquee if long */}
                <div className="max-w-[130px] overflow-hidden flex items-center">
                  {post.tapeData.title.length > 12 ? (
                    <div className="animate-marquee-smooth gap-3 shrink-0 flex items-center">
                      <span className="text-xs font-mono font-black text-red-500 uppercase tracking-wide whitespace-nowrap">{post.tapeData.title}</span>
                      <span className="text-xs font-mono font-black text-red-400 uppercase tracking-wide">•</span>
                      <span className="text-xs font-mono font-black text-red-500 uppercase tracking-wide whitespace-nowrap">{post.tapeData.title}</span>
                      <span className="text-xs font-mono font-black text-red-400 uppercase tracking-wide">•</span>
                    </div>
                  ) : (
                    <span className="text-xs font-mono font-black text-red-500 uppercase truncate tracking-wide">{post.tapeData.title}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Enlarged Clear Acrylic Window Area (Expanded to show full reels) */}
            <div className="w-[88%] bg-[#080808] rounded-sm flex items-center justify-between px-2 relative overflow-hidden border-2 border-[#18181b] shadow-[inset_0_0_12px_rgba(0,0,0,0.9)] my-0.5" style={{ height: '125.87px', marginTop: '18px' }}>

              {/* Tape gauge ruler markings in center window */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-between h-[85%] z-10 opacity-70 pointer-events-none">
                <span className="text-[7px] font-mono font-bold text-zinc-500">100</span>
                <div className="w-5 h-px bg-zinc-600"></div>
                <div className="w-3 h-px bg-zinc-700"></div>
                <div className="w-5 h-px bg-zinc-600"></div>
                <div className="w-3 h-px bg-zinc-700"></div>
                <div className="w-5 h-px bg-zinc-600"></div>
                <span className="text-[7px] font-mono font-bold text-zinc-500">0</span>
              </div>

              {/* Left Reel (Expands & winds down as played) */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#111] flex items-center justify-center relative -ml-3 shrink-0 z-0 border border-zinc-800/80 shadow-md">
                {/* Dark brown magnetic tape pack */}
                <div 
                  className="absolute rounded-full bg-gradient-to-br from-[#3b2113] to-[#1e1008] border border-[#522d1b]" 
                  style={{ 
                    inset: `${2 + (progress / 100) * 12}px`, 
                    borderWidth: `${12 - (progress / 100) * 11}px` 
                  }}
                />
                {/* White Reel Hub & Sprocket */}
                <div className={`w-8 h-8 bg-[#e4e4e7] rounded-full flex items-center justify-center z-10 shadow-md ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}>
                  <div className="w-2 h-2 bg-[#111] absolute top-0.5 rounded-xs" />
                  <div className="w-2 h-2 bg-[#111] absolute bottom-0.5 rounded-xs" />
                  <div className="w-2 h-2 bg-[#111] absolute left-0.5 rounded-xs" />
                  <div className="w-2 h-2 bg-[#111] absolute right-0.5 rounded-xs" />
                  <div className="w-3 h-3 rounded-full bg-[#111] border border-zinc-700" />
                </div>
              </div>

              {/* Right Reel (Expands & winds up as played) */}
              <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#111] flex items-center justify-center relative -mr-3 shrink-0 z-0 border border-zinc-800/80 shadow-md">
                {/* Dark brown magnetic tape pack */}
                <div 
                  className="absolute rounded-full bg-gradient-to-br from-[#3b2113] to-[#1e1008] border border-[#522d1b]"
                  style={{ 
                    inset: `${14 - (progress / 100) * 12}px`, 
                    borderWidth: `${1 + (progress / 100) * 11}px` 
                  }}
                />
                {/* White Reel Hub & Sprocket */}
                <div className={`w-8 h-8 bg-[#e4e4e7] rounded-full flex items-center justify-center z-10 shadow-md ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}>
                  <div className="w-2 h-2 bg-[#111] absolute top-0.5 rounded-xs" />
                  <div className="w-2 h-2 bg-[#111] absolute bottom-0.5 rounded-xs" />
                  <div className="w-2 h-2 bg-[#111] absolute left-0.5 rounded-xs" />
                  <div className="w-2 h-2 bg-[#111] absolute right-0.5 rounded-xs" />
                  <div className="w-3 h-3 rounded-full bg-[#111] border border-zinc-700" />
                </div>
              </div>

              {/* Glass reflection highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/60 pointer-events-none z-20" />
            </div>

            {/* Label Text Bottom Footer */}
            <div className="w-full px-2 flex justify-between items-center z-20">
              <span className="text-[8px] font-bold font-mono text-zinc-400 uppercase tracking-widest">NEXUS CHROMIUM HIGH-BIAS</span>
              <span className="text-[8px] font-bold font-mono text-zinc-500 uppercase">90 MIN</span>
            </div>
          </div>

          {/* Bottom Tape Head Trapezoid Guard with Top Line & Diagonal Sides (As in Diagram) */}
          <div className="relative z-10 mx-auto w-full h-11 mt-auto flex items-end justify-center px-2 pb-0.5">
            <svg className="w-full text-zinc-300" style={{ width: '321.33px', paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', paddingRight: '0px', marginTop: '0px', marginBottom: '-6px' }} viewBox="0 0 240 44" fill="none">
              {/* Outer Trapezoid Head Guard Housing Base */}
              <polygon 
                points="30,4 210,4 236,42 4,42" 
                fill="#1c1c1c" 
                stroke="#3f3f46" 
                strokeWidth="1.5" 
              />

              {/* Top Horizontal Line above Tape Head & Diagonal Sides coming down */}
              <path 
                d="M 32 8 L 208 8 M 32 8 L 12 40 M 208 8 L 228 40" 
                stroke="#a1a1aa" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
              />
              {/* Inner Accent Parallel Line */}
              <path 
                d="M 36 12 L 204 12" 
                stroke="#52525b" 
                strokeWidth="1" 
                strokeDasharray="2 2" 
              />

              {/* Center Tape Playback / Recording Head Cutout */}
              <rect x="98" y="16" width="44" height="20" rx="3" fill="#09090b" stroke="#52525b" strokeWidth="1.2" />
              <rect x="106" y="20" width="28" height="12" rx="1.5" fill="#18181b" stroke="#71717a" strokeWidth="0.8" />

              {/* Left Pinch Roller / Capstan Notch */}
              <rect x="68" y="20" width="18" height="15" rx="2" fill="#09090b" stroke="#52525b" strokeWidth="1.2" />

              {/* Right Pinch Roller / Capstan Notch */}
              <rect x="154" y="20" width="18" height="15" rx="2" fill="#09090b" stroke="#52525b" strokeWidth="1.2" />

              {/* Left Guide Pin Hole */}
              <circle cx="48" cy="27" r="5" fill="#09090b" stroke="#52525b" strokeWidth="1.2" />
              <circle cx="48" cy="27" r="2" fill="#27272a" />

              {/* Right Guide Pin Hole */}
              <circle cx="192" cy="27" r="5" fill="#09090b" stroke="#52525b" strokeWidth="1.2" />
              <circle cx="192" cy="27" r="2" fill="#27272a" />

              {/* Corner Screws / Metallic Washers */}
              <circle cx="20" cy="28" r="4.5" fill="#27272a" stroke="#a1a1aa" strokeWidth="1" />
              <line x1="17.5" y1="28" x2="22.5" y2="28" stroke="#d4d4d8" strokeWidth="1" />

              <circle cx="220" cy="28" r="4.5" fill="#27272a" stroke="#a1a1aa" strokeWidth="1" />
              <line x1="217.5" y1="28" x2="222.5" y2="28" stroke="#d4d4d8" strokeWidth="1" />
            </svg>
          </div>
        </div>

        {/* Seek Bar Area */}
        <div className="flex flex-col gap-2 px-2 mt-2">
          <div 
            className="h-1.5 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden relative shadow-inner cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = ((e.clientX - rect.left) / rect.width) * 100;
              onSeek(Math.max(0, Math.min(100, percent)));
            }}
          >
            <div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-red-950 to-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)] transition-all duration-100" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-600 tracking-wider">
            <span>00:00</span>
            <span className={`${isPlaying ? 'text-red-500' : 'text-red-900/80'} tracking-widest transition-colors`}>
              {getFormattedTime()} / {post.tapeData.duration}
            </span>
            <span>{post.tapeData.duration}</span>
          </div>
        </div>

        {/* Controls Area */}
        <div className="flex items-center justify-between px-2 pt-1">
          <div className="text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-widest border border-zinc-900 px-2 py-1 rounded bg-zinc-900/30">
            DATE: {post.tapeData.date || 'UNKNOWN'}
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              type="button"
              onClick={() => onSeek(Math.max(0, progress - 10))}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Skip back 10%"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
            </button>

            <button 
              type="button"
              onClick={() => {
                if (!isPlaying) {
                  window.dispatchEvent(new CustomEvent('pause-scene-radio'));
                }
                onTogglePlay();
              }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-red-900/50 hover:border-red-500 flex items-center justify-center text-white transition-colors group relative shadow-[0_0_15px_rgba(239,68,68,0.15)] mx-1 cursor-pointer"
              title={isPlaying ? 'Pause tape' : 'Play tape'}
            >
              {!isPlaying ? (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5 group-hover:text-red-400 transition-colors" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              ) : (
                <svg className="w-4 h-4 sm:w-5 sm:h-5 fill-current group-hover:text-red-400 transition-colors" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              )}
              {isPlaying && <div className="absolute inset-0 rounded-full border border-red-500/20 scale-110 animate-ping opacity-20"></div>}
            </button>

            <button 
              type="button"
              onClick={onStop}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Stop & Reset"
            >
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-current"></div>
            </button>

            <button 
              type="button"
              onClick={() => onSeek(Math.min(100, progress + 10))}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
              title="Skip forward 10%"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
            </button>
          </div>

          <div className={`flex items-center gap-1.5 text-[9px] font-mono font-bold px-2 py-1 rounded transition-colors ${isPlaying ? 'text-red-500 border border-red-500/30 bg-red-950/20' : 'text-red-900 border border-red-950/30 bg-red-950/10'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`}></div>
            {isPlaying ? 'PLAYING' : 'READY'}
          </div>
        </div>
      </div>
    </div>
  );
};
