import React from 'react';

export const CrtTvFrame: React.FC<{ children: React.ReactNode; className?: string; style?: React.CSSProperties }> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <div
      className={`p-1.5 sm:p-2 bg-[#1a1a1a] rounded-xl sm:rounded-2xl border-2 border-[#2a2a2a] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_5px_15px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col justify-between mx-auto my-0 ${className}`}
      style={{
        width: '325.017px',
        maxWidth: '100%',
        height: '233.535px',
        ...style,
      }}
    >
      <div className="relative rounded-lg sm:rounded-xl overflow-hidden border-2 border-[#0a0a0a] bg-black shadow-[0_0_15px_rgba(0,0,0,1)] flex-1 min-h-0">
        {/* TV Screen Wrapper */}
        <div className="relative w-full h-full min-h-0">
          <div className="absolute inset-0 z-10 w-full h-full">
            {children}
          </div>
          {/* Scanline / CRT overlay */}
          <div className="absolute inset-0 pointer-events-none z-20 opacity-10 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
          <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]"></div>
        </div>
      </div>
      
      {/* TV Controls/Buttons */}
      <div className="mt-2 shrink-0 flex items-center justify-between px-2">
         <div className="flex gap-4">
            {/* Dials */}
            <div className="w-7 h-7 rounded-full bg-[#111] border-b-2 border-r-2 border-white/5 border-t-2 border-l-2 border-black flex items-center justify-center shadow-[inset_0_0_4px_rgba(0,0,0,1)]">
              <div className="w-4 h-4 rounded-full bg-[#222] border border-[#050505] flex items-center justify-center transform rotate-45">
                <div className="w-1 h-2 bg-zinc-500 rounded-sm -mt-2"></div>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#111] border-b-2 border-r-2 border-white/5 border-t-2 border-l-2 border-black flex items-center justify-center shadow-[inset_0_0_4px_rgba(0,0,0,1)]">
              <div className="w-4 h-4 rounded-full bg-[#222] border border-[#050505] flex items-center justify-center transform -rotate-12">
                <div className="w-1 h-2 bg-zinc-500 rounded-sm -mt-2"></div>
              </div>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
               <div className="w-10 h-1.5 bg-[#0a0a0a] rounded-full border border-white/5 shadow-inner"></div>
               <div className="w-10 h-1.5 bg-[#0a0a0a] rounded-full border border-white/5 shadow-inner"></div>
               <div className="w-10 h-1.5 bg-[#0a0a0a] rounded-full border border-white/5 shadow-inner"></div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-red-900 shadow-[0_0_5px_rgba(255,0,0,0.2)]"></div>
         </div>
      </div>
    </div>
  );
};
