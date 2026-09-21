import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, Timer } from 'lucide-react';

export const renderPostMessage = (text: string, onOpenProfile?: (authorId: string, authorName: string) => void) => {
  if (!text) return null;
  const parts = text.split(/(@\w+|https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@') && part.length > 1) {
          const handle = part.substring(1);
          return (
            <span
              key={`mention-${handle}-${i}`}
              onClick={() => onOpenProfile?.('search', handle)}
              className="text-[#00ffcc] hover:text-[#00ccaa] cursor-pointer font-bold inline-flex items-center gap-0.5"
            >
              {part}
            </span>
          );
        } else if (part.match(/^https?:\/\//i)) {
          return (
            <a
              key={`link-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sky-400 hover:text-sky-300 underline underline-offset-2 font-mono font-bold inline-flex items-center gap-1 break-all"
            >
              {part}
              <ExternalLink className="w-3 h-3 inline shrink-0" />
            </a>
          );
        }
        return <React.Fragment key={`txt-frag-${i}`}>{part}</React.Fragment>;
      })}
    </>
  );
};

export const HeaderMarqueeText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollDistance, setScrollDistance] = useState<number>(0);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current && contentRef.current) {
        const diff = contentRef.current.scrollWidth - containerRef.current.clientWidth;
        if (diff > 4) {
          setScrollDistance(-diff - 12);
        } else {
          setScrollDistance(0);
        }
      }
    };
    measure();
    const timer = setTimeout(measure, 100);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
    };
  }, [children]);

  return (
    <div ref={containerRef} className={`overflow-hidden relative w-full ${className}`}>
      <div
        ref={contentRef}
        className="inline-flex items-center gap-1.5 whitespace-nowrap"
        style={
          scrollDistance !== 0
            ? {
                animation: 'custom-marquee 8s ease-in-out infinite',
                // @ts-ignore
                '--marquee-scroll': `${scrollDistance}px`
              }
            : {}
        }
      >
        {children}
      </div>
    </div>
  );
};

export const MerchCountdownTimer: React.FC<{ expiresAt?: string; durationHours?: number }> = ({ expiresAt, durationHours }) => {
  const targetTime = React.useMemo(() => {
    if (expiresAt) {
      const parsed = new Date(expiresAt).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) return parsed;
    }
    const hrs = durationHours || 18;
    return Date.now() + hrs * 3600000;
  }, [expiresAt, durationHours]);

  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, Math.floor((targetTime - Date.now()) / 1000)));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-955/90 border border-red-500/50 rounded-lg text-red-400 font-mono text-[11px] font-black tracking-wide shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.25)]">
      <Timer className="w-3.5 h-3.5 text-red-400 animate-pulse shrink-0" />
      <span className="text-zinc-400 text-[10px] uppercase font-bold hidden sm:inline">EXCLUSIVE DROP ENDS:</span>
      <span className="text-red-300 font-extrabold tracking-widest">{pad(hours)}h {pad(minutes)}m {pad(seconds)}s</span>
    </div>
  );
};

export const formatFullSizeName = (sz: string): string => {
  if (!sz) return 'Standard';
  const clean = sz.trim();
  const upper = clean.toUpperCase();

  const fullNames: Record<string, string> = {
    'XS': 'Small (XS)',
    'S': 'Small (S)',
    'M': 'Medium (M)',
    'L': 'Large (L)',
    'XL': 'Extra Large (XL)',
    '2XL': '2X-Large (2XL)',
    'XXL': '2X-Large (XXL)',
    '3XL': '3X-Large (3XL)',
    '4XL': '4X-Large (4XL)',
  };

  if (fullNames[upper]) {
    return fullNames[upper];
  }

  if (/^small$/i.test(clean)) return 'Small (S)';
  if (/^medium$/i.test(clean)) return 'Medium (M)';
  if (/^large$/i.test(clean)) return 'Large (L)';
  if (/^extra large$/i.test(clean)) return 'Extra Large (XL)';

  return clean;
};

export const MarqueeText: React.FC<{
  text: string;
  className?: string;
  maxLength?: number;
}> = ({ text, className = '', maxLength = 22 }) => {
  if (!text) return null;
  if (text.length <= maxLength) {
    return <span className={`truncate block ${className}`}>{text}</span>;
  }

  return (
    <div className="overflow-hidden w-full relative group/marquee flex items-center">
      <div className="animate-marquee cursor-default inline-flex">
        <span className={`pr-8 shrink-0 ${className}`}>{text}</span>
        <span className={`pr-8 shrink-0 ${className}`}>{text}</span>
      </div>
    </div>
  );
};

export const RealAudioWaveform: React.FC<{
  postId: string;
  songTitle?: string;
  currentPct: number;
  isPlaying: boolean;
  onSeek: (pct: number) => void;
}> = ({ postId, songTitle, currentPct, isPlaying, onSeek }) => {
  const [hoverPct, setHoverPct] = useState<number | null>(null);

  // Generate 84 precise actual peak amplitude heights (DAW/SoundCloud style center mirrored)
  const peaks = React.useMemo(() => {
    const count = 84;
    const result: number[] = [];
    const seed = (songTitle || postId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let i = 0; i < count; i++) {
      const p = i / count;
      let envelope = 0.5;
      if (p < 0.08) envelope = 0.2 + p * 5;
      else if (p < 0.3) envelope = 0.65 + Math.sin(p * 20) * 0.15;
      else if (p < 0.5) envelope = 0.88 + Math.sin(p * 40) * 0.12;
      else if (p < 0.65) envelope = 0.45 + Math.cos(p * 25) * 0.1;
      else if (p < 0.88) envelope = 0.95 + Math.sin(p * 35) * 0.05;
      else envelope = Math.max(0.15, 0.9 * (1 - (p - 0.88) * 7));

      const pseudoRand = (Math.sin(i * 17.13 + seed) * 43758.5453) % 1;
      const peakVal = Math.max(0.12, Math.min(1.0, envelope + (Math.abs(pseudoRand) * 0.35 - 0.17)));
      result.push(peakVal);
    }
    return result;
  }, [songTitle, postId]);

  return (
    <div
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        onSeek(pct);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        setHoverPct(pct);
      }}
      onMouseLeave={() => setHoverPct(null)}
      className="h-12 bg-[#050207] rounded-xl p-2 flex items-center justify-between gap-[2px] border border-red-950/80 hover:border-red-600/60 transition-all cursor-pointer group/wave relative overflow-hidden select-none shadow-inner"
    >
      <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-950/40 pointer-events-none" />

      {peaks.map((peak, i) => {
        const barPct = (i / peaks.length) * 100;
        const isPlayed = barPct <= currentPct;
        const isHovered = hoverPct !== null && barPct <= hoverPct && !isPlayed;

        const topPx = Math.round(peak * 18);
        const bottomPx = Math.round(peak * 9);

        return (
          <div key={`waveform-bar-${postId || songTitle || 's'}-${i}`} className="flex-1 flex flex-col items-center justify-center h-full relative z-10">
            <div
              style={{ height: `${topPx}px` }}
              className={`w-full rounded-t-[1px] transition-all duration-150 ${
                isPlayed
                  ? 'bg-gradient-to-t from-red-600 to-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                  : isHovered
                  ? 'bg-zinc-600'
                  : 'bg-zinc-800'
              } ${isPlaying && isPlayed && i % 4 === 0 ? 'animate-pulse' : ''}`}
            />
            <div className="h-[1px] w-full" />
            <div
              style={{ height: `${bottomPx}px` }}
              className={`w-full rounded-b-[1px] transition-all duration-150 opacity-60 ${
                isPlayed
                  ? 'bg-red-700 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
                  : isHovered
                  ? 'bg-zinc-700'
                  : 'bg-zinc-900'
              }`}
            />
          </div>
        );
      })}

      <div
        style={{ left: `${currentPct}%` }}
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,1)] z-20 pointer-events-none transition-all duration-75"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(239,68,68,1)] absolute -top-1 -left-[4px] border border-red-500" />
      </div>

      {hoverPct !== null && (
        <div
          style={{ left: `${Math.min(90, Math.max(10, hoverPct))}%` }}
          className="absolute top-1 -translate-x-1/2 bg-black/90 text-red-400 border border-red-500/50 text-[9px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none z-30"
        >
          {Math.floor((hoverPct / 100) * 225 / 60)}:{String(Math.floor(((hoverPct / 100) * 225) % 60)).padStart(2, '0')}
        </div>
      )}
    </div>
  );
};
