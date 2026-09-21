import React from 'react';

interface AlbumArtProps {
  type: 'green' | 'red' | 'dark' | 'purple';
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function AlbumArt({ type, size = 'sm' }: AlbumArtProps) {
  const pixelSize = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24';

  if (type === 'green') {
    // Toxic Green Splatter/Skull theme - "Symbiotic Voracity"
    return (
      <div className={`${pixelSize} relative rounded bg-gradient-to-br from-lime-900 to-black border border-lime-500/30 overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-lime-400 via-transparent to-transparent animate-pulse" />
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-lime-400 drop-shadow-[0_0_4px_rgba(163,230,53,0.5)]">
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M50,15 L50,85 M15,50 L85,50" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M35,35 L65,65 M35,65 L65,35" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span className="absolute bottom-0 right-0 text-[6px] font-mono bg-black/80 px-0.5 text-lime-300">VORACITY</span>
      </div>
    );
  }

  if (type === 'red') {
    // Psycho Red Gore theme - "Drug-induced Psychosis"
    return (
      <div className={`${pixelSize} relative rounded bg-gradient-to-br from-red-950 to-black border border-red-500/30 overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent" />
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-red-500">
          <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="3" />
          <path d="M25,25 L75,75 M75,25 L25,75" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="12" fill="currentColor" className="animate-pulse" />
        </svg>
        <span className="absolute bottom-0 right-0 text-[6px] font-mono bg-black/80 px-0.5 text-red-400 font-bold">PSYCHOSIS</span>
      </div>
    );
  }

  if (type === 'purple') {
    // Deep Synth Purple/Cyber theme - "Recent Activity"
    return (
      <div className={`${pixelSize} relative rounded bg-gradient-to-br from-purple-950 to-[#2e1065] border border-purple-500/40 overflow-hidden flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-transparent to-transparent" />
        <svg viewBox="0 0 100 100" className="w-8 h-8 text-purple-400">
          <polygon points="50,15 85,75 15,75" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="55" r="8" fill="currentColor" />
        </svg>
        <span className="absolute bottom-0 right-0 text-[6px] font-mono bg-black/80 px-0.5 text-purple-300">LIVE</span>
      </div>
    );
  }

  // Dark Industrial Grey theme - "Xenomorph Head"
  return (
    <div className={`${pixelSize} relative rounded bg-gradient-to-br from-zinc-800 to-black border border-zinc-500/30 overflow-hidden flex items-center justify-center`}>
      <div className="absolute inset-0 opacity-30 bg-radial from-zinc-400 to-transparent" />
      <svg viewBox="0 0 100 100" className="w-8 h-8 text-zinc-300">
        <path d="M30,30 L70,30 L70,70 L30,70 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
        <circle cx="30" cy="30" r="4" fill="currentColor" />
        <circle cx="70" cy="30" r="4" fill="currentColor" />
        <circle cx="30" cy="70" r="4" fill="currentColor" />
        <circle cx="70" cy="70" r="4" fill="currentColor" />
      </svg>
      <span className="absolute bottom-0 right-0 text-[6px] font-mono bg-black/80 px-0.5 text-zinc-400">XENO</span>
    </div>
  );
}
