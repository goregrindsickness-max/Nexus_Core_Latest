import React from 'react';

interface YouTubeEmbedCardProps {
  youtubeId: string;
}

export const YouTubeEmbedCard: React.FC<YouTubeEmbedCardProps> = ({ youtubeId }) => {
  return (
    <div 
      className="p-1.5 sm:p-2.5 my-3 bg-[#18181b] rounded-xl sm:rounded-2xl border-2 border-[#27272a] shadow-[inset_0_0_20px_rgba(0,0,0,0.9),0_6px_20px_rgba(0,0,0,0.6)] group/tv"
    >
      {/* TV Screen Container */}
      <div className="relative rounded-lg sm:rounded-xl overflow-hidden border-2 border-[#09090b] bg-black shadow-[0_0_15px_rgba(0,0,0,1)]">
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&enablejsapi=1`}
            title="Video Feed"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0 relative z-10"
          />
          {/* CRT Scanline & Phosphor Overlay */}
          <div className="absolute inset-0 pointer-events-none z-20 opacity-15 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.02),rgba(0,0,255,0.04))] bg-[length:100%_4px,3px_100%]" />
          <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_25px_rgba(0,0,0,0.85)]" />
        </div>
      </div>

      {/* Retro TV Bottom Controls: Speaker Grill, Dials & Push Buttons */}
      <div className="mt-2.5 sm:mt-3 flex items-center justify-between px-2 pb-0.5">
        {/* Rotary Knobs / Dials */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#121214] border-b-2 border-r-2 border-white/10 border-t-2 border-l-2 border-black flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,1)]">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#202024] border border-[#0a0a0c] flex items-center justify-center transform rotate-45 shadow-sm">
              <div className="w-0.5 sm:w-1 h-2 bg-zinc-400 rounded-xs -mt-1.5" />
            </div>
          </div>
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#121214] border-b-2 border-r-2 border-white/10 border-t-2 border-l-2 border-black flex items-center justify-center shadow-[inset_0_0_5px_rgba(0,0,0,1)]">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#202024] border border-[#0a0a0c] flex items-center justify-center transform -rotate-12 shadow-sm">
              <div className="w-0.5 sm:w-1 h-2 bg-zinc-400 rounded-xs -mt-1.5" />
            </div>
          </div>
        </div>

        {/* Speaker Grill slats & Hardware Push Buttons + LED Indicator */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Speaker Slats */}
          <div className="flex flex-col gap-1 sm:gap-1.5">
            <div className="w-10 sm:w-14 h-1 sm:h-1.5 bg-[#09090b] rounded-full border border-white/5 shadow-inner" />
            <div className="w-10 sm:w-14 h-1 sm:h-1.5 bg-[#09090b] rounded-full border border-white/5 shadow-inner" />
            <div className="w-10 sm:w-14 h-1 sm:h-1.5 bg-[#09090b] rounded-full border border-white/5 shadow-inner" />
          </div>

          {/* Hardware Push Buttons */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-3 sm:w-3 sm:h-3.5 bg-[#27272a] rounded-[2px] border border-black shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
            <div className="w-2.5 h-3 sm:w-3 sm:h-3.5 bg-[#27272a] rounded-[2px] border border-black shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]" />
          </div>

          {/* Power LED Indicator */}
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.7)]" />
        </div>
      </div>
    </div>
  );
};

