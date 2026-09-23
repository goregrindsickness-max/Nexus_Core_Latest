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

  const bandName = post.tapeData.band || 'UNKNOWN ARTIST';
  const tapeTitle = post.tapeData.title || 'UNRELEASED DEMO';
  const tapeDate = post.tapeData.date || '';

  return (
    <div className="bg-[#050505] rounded-xl p-3 sm:p-4 my-3 border border-zinc-900 shadow-inner overflow-hidden relative group select-none">
      {/* Ambient glowing effect */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-amber-500/20 blur-xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-30'}`}></div>

      <div className="flex flex-col gap-3 sm:gap-4 relative z-10">
        {/* Authentic Compact Cassette (Standard 1.58 aspect ratio) */}
        <div className="relative mx-auto w-full max-w-[360px] aspect-[1.58] bg-[#1a1a1a] rounded-lg shadow-2xl border border-[#0a0a0a] overflow-hidden flex flex-col p-1.5 ring-1 ring-white/10">
          {/* Texture overlay for the plastic shell */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '3px 3px' }}></div>

          {/* 4 Corner Screws */}
          <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-600 rotate-45"></div>
          </div>
          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-600 -rotate-45"></div>
          </div>
          <div className="absolute bottom-1 left-1 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-600 rotate-90"></div>
          </div>
          <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-black flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] z-20">
            <div className="w-1.5 h-0.5 bg-zinc-600"></div>
          </div>

          {/* Main Label / Sticker Area */}
          <div className="relative z-10 mx-1 mt-1 flex-1 bg-[#181818] rounded-sm shadow-[0_0_2px_rgba(0,0,0,1)] border border-white/5 flex flex-col items-center justify-between p-1 pb-0.5">

            {/* Label Text Top Header */}
            <div className="w-full px-0.5 z-20">
              <div className="w-full bg-[#09090b] border border-zinc-800/80 px-2 py-0.5 sm:py-1 flex flex-col gap-0.5 shadow-sm rounded-xs">
                {/* Line 1: Band / Artist Name */}
                <div className="flex items-center justify-between gap-1.5 overflow-hidden border-b border-zinc-800/60 pb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
                    <div className="overflow-hidden flex-1 flex items-center">
                      {bandName.length > 20 ? (
                        <div className="animate-marquee-smooth gap-4 shrink-0 flex items-center">
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-100 uppercase tracking-wider whitespace-nowrap">{bandName}</span>
                          <span className="text-[9px] sm:text-[10px] font-mono text-zinc-600">•</span>
                          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-100 uppercase tracking-wider whitespace-nowrap">{bandName}</span>
                          <span className="text-[9px] sm:text-[10px] font-mono text-zinc-600">•</span>
                        </div>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-zinc-100 uppercase truncate tracking-wider">{bandName}</span>
                      )}
                    </div>
                  </div>
                  {tapeDate && (
                    <span className="text-[7px] sm:text-[7.5px] font-mono font-medium text-zinc-400 uppercase shrink-0 px-1 py-0.2 bg-zinc-900/90 rounded border border-zinc-800/80">{tapeDate}</span>
                  )}
                </div>

                {/* Line 2: Track / Tape Title */}
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden pt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 shadow-[0_0_4px_rgba(244,63,94,0.6)]" />
                  <div className="overflow-hidden flex-1 flex items-center">
                    {tapeTitle.length > 20 ? (
                      <div className="animate-marquee-smooth gap-4 shrink-0 flex items-center">
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider whitespace-nowrap">{tapeTitle}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-rose-500/60">•</span>
                        <span className="text-[9px] sm:text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider whitespace-nowrap">{tapeTitle}</span>
                        <span className="text-[9px] sm:text-[10px] font-mono text-rose-500/60">•</span>
                      </div>
                    ) : (
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold text-rose-400 uppercase truncate tracking-wider">{tapeTitle}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Clear Acrylic Window Area with Spools */}
            <div className="w-[90%] flex-1 min-h-[48px] max-h-[64px] bg-[#09090b] rounded-xs flex items-center justify-between px-2 sm:px-3 relative overflow-hidden border border-zinc-700/60 shadow-[inset_0_0_12px_rgba(0,0,0,0.95)] my-0.5">

              {/* Tape gauge ruler markings in center window */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-0.5 h-[80%] z-10 opacity-80 pointer-events-none">
                <span className="text-[6px] font-mono font-bold text-zinc-400 leading-none">100</span>
                <div className="flex flex-col items-center gap-[1.5px] my-0.5">
                  <div className="w-4 sm:w-5 h-[1.5px] bg-zinc-500 rounded-full"></div>
                  <div className="w-2.5 sm:w-3 h-[1px] bg-zinc-600"></div>
                  <div className="w-4 sm:w-5 h-[1.5px] bg-zinc-500 rounded-full"></div>
                  <div className="w-2.5 sm:w-3 h-[1px] bg-zinc-600"></div>
                  <div className="w-4 sm:w-5 h-[1.5px] bg-zinc-500 rounded-full"></div>
                </div>
                <span className="text-[6px] font-mono font-bold text-zinc-400 leading-none">0</span>
              </div>

              {/* Left Reel (Expands & winds down as played) */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#141414] flex items-center justify-center relative shrink-0 z-0 border border-zinc-800 shadow-md">
                {/* Dark brown magnetic tape pack */}
                <div 
                  className="absolute rounded-full bg-gradient-to-br from-[#4d2c19] via-[#3d2011] to-[#1c0e07] border border-[#5a321c]" 
                  style={{ 
                    inset: `${2 + (progress / 100) * 6}px`, 
                    borderWidth: `${7 - (progress / 100) * 6}px` 
                  }}
                />
                {/* Ribbed notches on spool perimeter */}
                <div className="absolute inset-0 rounded-full border border-zinc-700/30 pointer-events-none" />
                {/* White Reel Hub & Sprocket */}
                <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-[#f4f4f5] rounded-full flex items-center justify-center z-10 shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}>
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute top-0.5 rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute bottom-0.5 rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute left-0.5 rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute right-0.5 rounded-xs" />
                  <div className="w-3 h-3 rounded-full bg-[#0d0d0d] border border-zinc-700 shadow-inner" />
                </div>
              </div>

              {/* Right Reel (Expands & winds up as played) */}
              <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#141414] flex items-center justify-center relative shrink-0 z-0 border border-zinc-800 shadow-md">
                {/* Dark brown magnetic tape pack */}
                <div 
                  className="absolute rounded-full bg-gradient-to-br from-[#4d2c19] via-[#3d2011] to-[#1c0e07] border border-[#5a321c]"
                  style={{ 
                    inset: `${8 - (progress / 100) * 6}px`, 
                    borderWidth: `${1 + (progress / 100) * 6}px` 
                  }}
                />
                {/* Ribbed notches on spool perimeter */}
                <div className="absolute inset-0 rounded-full border border-zinc-700/30 pointer-events-none" />
                {/* White Reel Hub & Sprocket */}
                <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-[#f4f4f5] rounded-full flex items-center justify-center z-10 shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '2.5s', animationTimingFunction: 'linear' }}>
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute top-0.5 rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute bottom-0.5 rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute left-0.5 rounded-xs" />
                  <div className="w-1.5 h-1.5 bg-[#141414] absolute right-0.5 rounded-xs" />
                  <div className="w-3 h-3 rounded-full bg-[#0d0d0d] border border-zinc-700 shadow-inner" />
                </div>
              </div>

              {/* Glass reflection highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/12 via-transparent to-black/60 pointer-events-none z-20" />
            </div>

            {/* Label Text Bottom Footer */}
            <div className="w-full px-2 flex justify-between items-center z-20">
              <span className="text-[7px] sm:text-[7.5px] font-bold font-mono text-zinc-500 uppercase tracking-wider sm:tracking-widest">NEXUS CHROMIUM HIGH-BIAS</span>
              <span className="text-[7px] sm:text-[7.5px] font-bold font-mono text-zinc-600 uppercase">90 MIN</span>
            </div>
          </div>

          {/* Bottom Tape Head Trapezoid Guard - Vector Scalable SVG */}
          <div className="relative z-10 mx-auto w-full px-1 pt-0.5">
            <svg 
              className="w-full h-auto text-zinc-300 block" 
              viewBox="0 0 240 38" 
              preserveAspectRatio="xMidYMid meet" 
              fill="none"
            >
              {/* Outer Trapezoid Head Guard Housing Base */}
              <polygon 
                points="28,2 212,2 236,36 4,36" 
                fill="#1c1c1c" 
                stroke="#3f3f46" 
                strokeWidth="1.2" 
              />

              {/* Top Horizontal Line above Tape Head & Diagonal Sides */}
              <path 
                d="M 30 5 L 210 5 M 30 5 L 10 34 M 210 5 L 230 34" 
                stroke="#a1a1aa" 
                strokeWidth="1.2" 
                strokeLinecap="round" 
              />
              {/* Inner Accent Parallel Line */}
              <path 
                d="M 34 8 L 206 8" 
                stroke="#52525b" 
                strokeWidth="0.8" 
                strokeDasharray="2 2" 
              />

              {/* Center Tape Playback / Recording Head Cutout */}
              <rect x="98" y="12" width="44" height="18" rx="2.5" fill="#09090b" stroke="#52525b" strokeWidth="1" />
              <rect x="106" y="15" width="28" height="11" rx="1.5" fill="#18181b" stroke="#71717a" strokeWidth="0.7" />

              {/* Left Pinch Roller / Capstan Notch */}
              <rect x="68" y="15" width="18" height="13" rx="2" fill="#09090b" stroke="#52525b" strokeWidth="1" />

              {/* Right Pinch Roller / Capstan Notch */}
              <rect x="154" y="15" width="18" height="13" rx="2" fill="#09090b" stroke="#52525b" strokeWidth="1" />

              {/* Left Guide Pin Hole */}
              <circle cx="48" cy="22" r="4.5" fill="#09090b" stroke="#52525b" strokeWidth="1" />
              <circle cx="48" cy="22" r="1.8" fill="#27272a" />

              {/* Right Guide Pin Hole */}
              <circle cx="192" cy="22" r="4.5" fill="#09090b" stroke="#52525b" strokeWidth="1" />
              <circle cx="192" cy="22" r="1.8" fill="#27272a" />

              {/* Corner Screws / Metallic Washers */}
              <circle cx="18" cy="24" r="3.8" fill="#27272a" stroke="#a1a1aa" strokeWidth="0.8" />
              <line x1="16" y1="24" x2="20" y2="24" stroke="#d4d4d8" strokeWidth="0.8" />

              <circle cx="222" cy="24" r="3.8" fill="#27272a" stroke="#a1a1aa" strokeWidth="0.8" />
              <line x1="220" y1="24" x2="224" y2="24" stroke="#d4d4d8" strokeWidth="0.8" />
            </svg>
          </div>
        </div>

        {/* Seek Bar Area */}
        <div className="flex flex-col gap-1.5 px-1 sm:px-2">
          <div 
            className="h-2 w-full bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden relative shadow-inner cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = ((e.clientX - rect.left) / rect.width) * 100;
              onSeek(Math.max(0, Math.min(100, percent)));
            }}
          >
            <div 
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-red-950 via-red-600 to-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all duration-100" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[8.5px] sm:text-[9px] font-mono font-bold text-zinc-600 tracking-wider">
            <span>00:00</span>
            <span className={`${isPlaying ? 'text-red-500' : 'text-red-900/80'} tracking-widest transition-colors font-mono`}>
              {getFormattedTime()} / {post.tapeData.duration}
            </span>
            <span>{post.tapeData.duration}</span>
          </div>
        </div>

        {/* Controls Area - Responsive Transport Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-1 sm:px-2 pt-0.5">
          <div className="text-[8px] sm:text-[9px] font-mono text-zinc-500 uppercase font-bold tracking-wider border border-zinc-900 px-2 py-1 rounded bg-zinc-900/40 shrink-0">
            DATE: {tapeDate || 'UNKNOWN'}
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 mx-auto sm:mx-0">
            <button 
              type="button"
              onClick={() => onSeek(Math.max(0, progress - 10))}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer active:scale-95 shadow-sm"
              title="Skip back 10%"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg>
            </button>

            <button 
              type="button"
              onClick={() => {
                if (!isPlaying) {
                  window.dispatchEvent(new CustomEvent('pause-scene-radio'));
                }
                onTogglePlay();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-900 border border-red-900/60 hover:border-red-500 flex items-center justify-center text-white transition-all group relative shadow-[0_0_15px_rgba(239,68,68,0.2)] mx-0.5 cursor-pointer active:scale-95"
              title={isPlaying ? 'Pause tape' : 'Play tape'}
            >
              {!isPlaying ? (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5 group-hover:text-red-400 transition-colors" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current group-hover:text-red-400 transition-colors" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              )}
              {isPlaying && <div className="absolute inset-0 rounded-full border border-red-500/30 scale-110 animate-ping opacity-25"></div>}
            </button>

            <button 
              type="button"
              onClick={onStop}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer active:scale-95 shadow-sm"
              title="Stop & Reset"
            >
              <div className="w-2.5 h-2.5 rounded-xs bg-current"></div>
            </button>

            <button 
              type="button"
              onClick={() => onSeek(Math.min(100, progress + 10))}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer active:scale-95 shadow-sm"
              title="Skip forward 10%"
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
            </button>
          </div>

          <div className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-mono font-bold px-2 py-1 rounded transition-colors shrink-0 ${isPlaying ? 'text-red-500 border border-red-500/30 bg-red-950/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]' : 'text-red-900 border border-red-950/30 bg-red-950/10'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`}></div>
            {isPlaying ? 'PLAYING' : 'READY'}
          </div>
        </div>
      </div>
    </div>
  );
};

