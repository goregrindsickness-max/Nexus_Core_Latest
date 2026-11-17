import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, ExternalLink, Disc, Music, Sparkles, Volume2, Radio, Check, Loader2 } from 'lucide-react';
import { requestPauseSceneRadio } from '../social/utils/mediaPlaybackCoordinator';

export interface BandcampStickerProps {
  id?: string;
  trackTitle?: string;
  artistName?: string;
  coverArtUrl?: string;
  audioUrl?: string;
  bandcampUrl?: string;
  variant?: 'merch_badge' | 'vinyl_sleeve' | 'cassette_jcard';
  scale?: number;
  interactive?: boolean;
  onRemove?: () => void;
  className?: string;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const StickerPlayer: React.FC<BandcampStickerProps> = ({
  id,
  trackTitle = 'Bandcamp Track',
  artistName = 'Artist Name',
  coverArtUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80',
  audioUrl,
  bandcampUrl = 'https://bandcamp.com',
  variant = 'merch_badge',
  scale = 1.0,
  interactive = true,
  onRemove,
  className = '',
  onPlayStateChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudioError, setHasAudioError] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset state if audio URL changes
    setIsPlaying(false);
    setCurrentTime(0);
    setHasAudioError(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!interactive) return;

    if (!audioUrl || hasAudioError) {
      // If no valid audio preview, open the Bandcamp page directly
      if (bandcampUrl) {
        window.open(bandcampUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayStateChange?.(false);
    } else {
      requestPauseSceneRadio('story_bandcamp_sticker');
      setIsLoadingAudio(true);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
          onPlayStateChange?.(true);
        })
        .catch((err) => {
          console.warn('[StickerPlayer] Audio play failed:', err);
          setIsPlaying(false);
          setIsLoadingAudio(false);
          setHasAudioError(true);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoadingAudio(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayStateChange?.(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Safe image fallback
  const fallbackArt = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
  const displayArt = coverArtUrl && coverArtUrl.trim() !== '' ? coverArtUrl : fallbackArt;

  return (
    <div
      className={`relative select-none group/sticker transition-all duration-200 ${className}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hidden HTML5 Audio Element */}
      {audioUrl && !hasAudioError && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={() => {
            setHasAudioError(true);
            setIsPlaying(false);
            setIsLoadingAudio(false);
          }}
        />
      )}

      {/* VARIANT 1: MERCH BADGE (Sleek physical enamel/holographic badge) */}
      {variant === 'merch_badge' && (
        <div className="relative flex items-center gap-2.5 p-2 pr-3 rounded-2xl bg-zinc-950/90 backdrop-blur-md border border-cyan-500/50 shadow-[0_8px_32px_rgba(0,0,0,0.85),0_0_15px_rgba(6,182,212,0.2)] overflow-hidden max-w-[280px]">
          {/* Subtle cyan glow backdrop */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-transparent to-cyan-500/10 blur-sm pointer-events-none" />

          {/* Left: Album Cover with Play/Pause Button */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-cyan-500/40 bg-black group/art shadow">
            <img
              src={displayArt}
              alt={trackTitle}
              className={`w-full h-full object-cover transition-transform duration-500 ${isPlaying ? 'scale-105' : ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackArt;
              }}
            />

            {/* Play/Pause Overlay Button */}
            <button
              type="button"
              onClick={togglePlay}
              title={isPlaying ? 'Pause Preview' : 'Play Preview'}
              className="absolute inset-0 bg-black/50 hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
            >
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              ) : isPlaying ? (
                <div className="relative">
                  <span className="absolute -inset-1 rounded-full bg-cyan-400/40 animate-ping" />
                  <Pause className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] fill-cyan-300" />
                </div>
              ) : (
                <Play className="w-5 h-5 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] fill-cyan-300 ml-0.5" />
              )}
            </button>

            {/* Mini Progress Bar Under Cover */}
            {isPlaying && (
              <div className="absolute bottom-0 inset-x-0 h-1 bg-black/60">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Middle: Info & Bandcamp Tag */}
          <div className="min-w-0 flex-1 relative z-10">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="px-1.5 py-0.2 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[8px] font-mono font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                <Disc className={`w-2.5 h-2.5 text-cyan-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
                BANDCAMP
              </span>
              {isPlaying && (
                <span className="flex items-center gap-0.5 h-2">
                  <span className="w-0.5 h-full bg-cyan-400 animate-pulse" />
                  <span className="w-0.5 h-2/3 bg-cyan-300 animate-pulse delay-75" />
                  <span className="w-0.5 h-4/5 bg-cyan-400 animate-pulse delay-150" />
                </span>
              )}
            </div>

            <p className="text-[11px] font-bold text-white truncate leading-tight drop-shadow">
              {trackTitle}
            </p>
            <p className="text-[9px] font-medium text-cyan-300/80 truncate leading-tight">
              {artistName}
            </p>
          </div>

          {/* Right: External Link to Bandcamp */}
          {bandcampUrl && (
            <a
              href={bandcampUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-7 h-7 rounded-xl bg-cyan-950/60 hover:bg-cyan-500 hover:text-black text-cyan-300 border border-cyan-500/40 flex items-center justify-center transition-all duration-200 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              title="Open on Bandcamp"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* VARIANT 2: VINYL SLEEVE (Spun record partially sliding out) */}
      {variant === 'vinyl_sleeve' && (
        <div className="relative flex items-center p-2 rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-cyan-500/40 shadow-[0_8px_32px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.15)] max-w-[300px]">
          {/* Vinyl Disc Sticking Out */}
          <div className="relative w-14 h-14 rounded-full bg-black border border-zinc-700 shadow-xl flex items-center justify-center shrink-0 overflow-hidden mr-1">
            <div className={`w-full h-full rounded-full border-4 border-zinc-800 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
              {/* Vinyl Grooves */}
              <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center">
                <img
                  src={displayArt}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover border border-cyan-400"
                />
              </div>
            </div>
            {/* Play/Pause Center Button */}
            <button
              type="button"
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-cyan-300 fill-cyan-300 drop-shadow" />
              ) : (
                <Play className="w-4 h-4 text-cyan-300 fill-cyan-300 ml-0.5 drop-shadow" />
              )}
            </button>
          </div>

          {/* Sleeve Jacket Info */}
          <div className="min-w-0 flex-1 px-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[8px] font-mono font-black uppercase text-cyan-400 tracking-wider">
                VINYL EXCLUSIVE
              </span>
            </div>
            <p className="text-[11px] font-black text-white truncate leading-tight">
              {trackTitle}
            </p>
            <p className="text-[9px] text-zinc-300 truncate">
              {artistName}
            </p>
          </div>

          {/* External Link */}
          {bandcampUrl && (
            <a
              href={bandcampUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-7 h-7 rounded-xl bg-zinc-900 hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/30 flex items-center justify-center transition-all shrink-0 ml-1"
              title="Get Vinyl on Bandcamp"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}

      {/* VARIANT 3: CASSETTE J-CARD (Vintage physical tape card badge) */}
      {variant === 'cassette_jcard' && (
        <div className="relative flex flex-col p-2.5 rounded-2xl bg-[#090b0e]/95 backdrop-blur-md border-2 border-cyan-500/60 shadow-[0_8px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(6,182,212,0.25)] min-w-[220px] max-w-[260px]">
          {/* Top Tape Header Bar */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-cyan-500/30">
            <span className="text-[8px] font-mono font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-cyan-400" /> BANDCAMP CASSETTE
            </span>
            <span className="text-[7px] font-mono font-bold px-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50">
              SIDE A
            </span>
          </div>

          {/* Middle: Cover + Title + Play */}
          <div className="flex items-center gap-2">
            <div className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-cyan-500/40 bg-black">
              <img src={displayArt} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 bg-black/50 hover:bg-black/30 flex items-center justify-center transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-cyan-300 fill-cyan-300" />
                ) : (
                  <Play className="w-4 h-4 text-cyan-300 fill-cyan-300 ml-0.5" />
                )}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white truncate leading-tight font-mono">
                {trackTitle}
              </p>
              <p className="text-[9px] text-cyan-300/80 truncate font-mono">
                {artistName}
              </p>
            </div>
          </div>

          {/* Bottom Action Bar */}
          {bandcampUrl && (
            <div className="mt-2 pt-1.5 border-t border-cyan-500/20 flex items-center justify-between">
              <span className="text-[8px] font-mono text-zinc-400">TAP TO STREAM FULL</span>
              <a
                href={bandcampUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[8px] font-mono font-black uppercase text-cyan-300 hover:text-white flex items-center gap-1"
              >
                <span>BANDCAMP</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
