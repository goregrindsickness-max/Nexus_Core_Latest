import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { requestPauseSceneRadio } from '../utils/mediaPlaybackCoordinator';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  Send
} from 'lucide-react';

export interface StoryViewerItem {
  id: string;
  name?: string;
  username?: string;
  user?: string;
  avatar?: string;
  image?: string;
  video?: string;
  mediaUrl?: string;
  border?: string;
  textColor?: string;
  textColorHex?: string;
  caption?: string;
  musicTrack?: string;
  music?: string;
  textOverlay?: string;
  textStyle?: string;
  textSize?: number;
  textX?: number;
  textY?: number;
  stickers?: any[];
  stickerScale?: number;
  stickerX?: number;
  stickerY?: number;
  timestamp?: string | number;
  created_at?: string | number;
  [key: string]: any;
}

export interface StoryViewerModalProps {
  activeStory: StoryViewerItem | null;
  stories: StoryViewerItem[];
  progress?: number;
  isPaused?: boolean;
  setIsPaused?: (paused: boolean) => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  triggerNotification?: (msg: string) => void;
  userProfile?: any;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  activeStory,
  stories,
  progress: externalProgress,
  isPaused: externalIsPaused,
  setIsPaused: externalSetIsPaused,
  onClose,
  onNext,
  onPrev,
  triggerNotification,
  userProfile,
}) => {
  // Portal target hydration check
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [internalPaused, setInternalPaused] = useState(false);
  const isPaused = externalIsPaused !== undefined ? externalIsPaused : internalPaused;
  const setIsPaused = (val: boolean) => {
    setInternalPaused(val);
    externalSetIsPaused?.(val);
  };

  const [localProgress, setLocalProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeReactionBurst, setActiveReactionBurst] = useState<string | null>(null);
  const [isHolding, setIsHolding] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onNextRef = useRef(onNext);
  const onPrevRef = useRef(onPrev);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onNextRef.current = onNext;
    onPrevRef.current = onPrev;
    onCloseRef.current = onClose;
  });

  // Determine current active story index safely
  const currentIndex = useMemo(() => {
    if (!activeStory || !Array.isArray(stories) || stories.length === 0) return 0;
    const targetId = String(activeStory.id ?? '');
    const idIdx = stories.findIndex((s) => targetId && String(s.id ?? '') === targetId);
    if (idIdx !== -1) return idIdx;

    const matchIdx = stories.findIndex(
      (s) =>
        (s.name && s.name === activeStory.name) ||
        (s.image && s.image === activeStory.image) ||
        (s.video && s.video === activeStory.video)
    );
    return matchIdx !== -1 ? matchIdx : 0;
  }, [activeStory, stories]);

  // Derive media info
  const mediaSrc = useMemo(() => {
    if (!activeStory) return '';
    return (
      activeStory.video ||
      activeStory.image ||
      activeStory.mediaUrl ||
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200'
    );
  }, [activeStory]);

  const isVideo = useMemo(() => {
    if (!activeStory) return false;
    if (activeStory.video) return true;
    if (typeof mediaSrc === 'string') {
      const lower = mediaSrc.toLowerCase();
      return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.includes('video/mp4') || lower.includes('.mp4?');
    }
    return false;
  }, [activeStory, mediaSrc]);

  const authorName = useMemo(() => {
    if (!activeStory) return 'Artist Story';
    return activeStory.name || activeStory.username || activeStory.user || 'Artist Story';
  }, [activeStory]);

  const authorAvatar = useMemo(() => {
    if (!activeStory) return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150';
    return (
      activeStory.avatar ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150'
    );
  }, [activeStory]);

  // Safe time formatting
  const formattedTime = useMemo(() => {
    if (!activeStory) return 'Just now';
    const rawTime = activeStory.timestamp || activeStory.created_at;
    if (!rawTime) return 'Just now';

    if (typeof rawTime === 'string') {
      if (rawTime.includes('T') || rawTime.includes('-')) {
        const date = new Date(rawTime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      }
      return rawTime;
    }
    if (typeof rawTime === 'number') {
      const date = new Date(rawTime);
      if (!isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    return 'Just now';
  }, [activeStory]);

  // Reset progress and only pause Scene Radio if this story actually has sound (unmuted video or attached music track)
  useEffect(() => {
    if (activeStory && ((isVideo && !isMuted) || activeStory.music || activeStory.musicTrack)) {
      requestPauseSceneRadio('story_viewer_audio');
    }
    setLocalProgress(0);
    setIsHolding(false);
  }, [activeStory?.id, mediaSrc, isVideo, isMuted]);

  // Self-contained smooth playback timer for images
  useEffect(() => {
    if (!activeStory) return;
    if (isVideo) return; // Video progress is driven by video timeupdate
    if (isPaused || isHolding) return;

    // 5.5 seconds story duration (update every 40ms)
    const tickInterval = 40;
    const totalDuration = 5500;
    const increment = (tickInterval / totalDuration) * 100;

    const interval = setInterval(() => {
      setLocalProgress((prev) => {
        const nextVal = prev + increment;
        if (nextVal >= 100) {
          clearInterval(interval);
          // Defer onNext call outside of React state update cycle
          setTimeout(() => {
            onNextRef.current();
          }, 0);
          return 100;
        }
        return nextVal;
      });
    }, tickInterval);

    return () => clearInterval(interval);
  }, [activeStory?.id, isVideo, isPaused, isHolding]);

  // Video playback & timeupdate synchronization
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideo) return;

    if (isPaused || isHolding) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPaused, isHolding, isVideo, activeStory?.id]);

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    setLocalProgress(Math.min(100, pct));
  };

  const handleVideoEnded = () => {
    setTimeout(() => {
      onNextRef.current();
    }, 0);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!activeStory) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      } else if (e.key === 'ArrowRight') {
        onNextRef.current();
      } else if (e.key === 'ArrowLeft') {
        onPrevRef.current();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(!isPaused);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStory, isPaused]);

  // Touch / Pointer hold to pause
  const handlePointerDown = () => {
    setIsHolding(true);
  };

  const handlePointerUp = () => {
    setIsHolding(false);
  };

  const sendReaction = (emoji: string, label: string) => {
    setActiveReactionBurst(emoji);
    setTimeout(() => setActiveReactionBurst(null), 1200);
    triggerNotification?.(`Reacted with ${emoji} to ${authorName}'s story!`);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    triggerNotification?.(`Sent reply to ${authorName}: "${replyText}"`);
    setReplyText('');
    setIsPaused(false);
  };

  const currentFillPercent = externalProgress !== undefined && !isVideo ? externalProgress : localProgress;

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {activeStory && (
        <motion.div
          key="story-viewer-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-2xl flex items-center justify-center select-none overflow-hidden"
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
        >
          {/* Ambient Blurred Background (signature Facebook/Instagram aesthetic) */}
          {mediaSrc && (
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-25 scale-125 pointer-events-none transition-all duration-700"
              style={{ backgroundImage: `url(${mediaSrc})` }}
            />
          )}

          {/* Desktop Left / Right Story Navigation Arrows */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            disabled={currentIndex === 0}
            className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white disabled:opacity-20 disabled:hover:bg-zinc-900/80 items-center justify-center border border-zinc-700/60 shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Previous Story (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            disabled={currentIndex >= stories.length - 1}
            className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white disabled:opacity-20 disabled:hover:bg-zinc-900/80 items-center justify-center border border-zinc-700/60 shadow-2xl transition-all cursor-pointer hover:scale-110 active:scale-95"
            title="Next Story (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Main 9:16 Story Stage Card with Expand Animation */}
          <motion.div
            key={`story-stage-${activeStory.id || currentIndex}`}
            initial={{ scale: 0.92, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full h-full sm:h-[88vh] sm:max-h-[820px] sm:max-w-[430px] sm:rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col justify-between"
          >
            {/* Top Header Layer: Progress Bars + Author Profile + Controls */}
            <div className="absolute top-0 inset-x-0 z-30 pt-3 pb-8 px-3.5 bg-gradient-to-b from-black/95 via-black/60 to-transparent">
              {/* Segmented Progress Bars */}
              <div className="flex items-center gap-1.5 mb-2.5">
                {stories.map((story, idx) => {
                  let fillPercent = 0;
                  if (idx < currentIndex) {
                    fillPercent = 100;
                  } else if (idx === currentIndex) {
                    fillPercent = currentFillPercent;
                  }

                  return (
                    <div
                      key={`bar-${story.id || idx}`}
                      className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden backdrop-blur-xs"
                    >
                      <div
                        className="h-full bg-white transition-all duration-75 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Author Profile + Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full border-2 ${
                      activeStory.border || 'border-rose-500'
                    } overflow-hidden shadow-md shrink-0 bg-zinc-900`}
                  >
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150';
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white tracking-wide truncate max-w-[170px]">
                        {authorName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        • {formattedTime}
                      </span>
                    </div>
                    {(activeStory.music || activeStory.musicTrack) && (
                      <div className="flex items-center gap-1 text-[10px] text-rose-400 font-medium truncate max-w-[200px]">
                        <Music className="w-3 h-3 shrink-0 animate-pulse" />
                        <span className="truncate">{activeStory.music || activeStory.musicTrack}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Play/Pause, Mute/Unmute, Close */}
                <div className="flex items-center gap-1">
                  {isVideo && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPaused(!isPaused);
                    }}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 transition-colors cursor-pointer"
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="p-1.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 transition-colors cursor-pointer"
                    title="Close Story (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Media Presentation Stage */}
            <div
              className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
              onMouseDown={handlePointerDown}
              onTouchStart={handlePointerDown}
            >
              {isVideo ? (
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain sm:object-cover"
                />
              ) : (
                <img
                  src={mediaSrc}
                  alt={authorName}
                  className="w-full h-full object-contain sm:object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200';
                  }}
                />
              )}

              {/* Text Overlay (if configured) */}
              {activeStory.textOverlay && (
                <div
                  className="absolute z-20 pointer-events-none px-4 py-2 text-center"
                  style={{
                    top: `${activeStory.textY ?? 50}%`,
                    left: `${activeStory.textX ?? 50}%`,
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '85%',
                  }}
                >
                  <span
                    style={{
                      fontSize: `${activeStory.textSize || 20}px`,
                      color: activeStory.textColorHex || '#ffffff',
                    }}
                    className={`font-black drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)] leading-tight tracking-wide ${
                      activeStory.textStyle === 'metal'
                        ? 'font-serif uppercase tracking-widest'
                        : activeStory.textStyle === 'neon'
                        ? 'font-mono text-cyan-300 drop-shadow-[0_0_15px_rgba(0,255,255,0.9)]'
                        : activeStory.textStyle === 'cyber'
                        ? 'font-mono uppercase tracking-wider text-teal-400'
                        : 'font-sans'
                    }`}
                  >
                    {activeStory.textOverlay}
                  </span>
                </div>
              )}

              {/* Stickers (if configured) */}
              {Array.isArray(activeStory.stickers) &&
                activeStory.stickers.length > 0 &&
                activeStory.stickers.map((stk, sIndex) => (
                  <div
                    key={`stk-${sIndex}`}
                    className="absolute z-20 pointer-events-none drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] select-none"
                    style={{
                      top: `${activeStory.stickerY ?? 35}%`,
                      left: `${activeStory.stickerX ?? 50}%`,
                      transform: `translate(-50%, -50%) scale(${activeStory.stickerScale ?? 1.2})`,
                      fontSize: '48px',
                    }}
                  >
                    {typeof stk === 'string' ? stk : stk?.emoji || '🔥'}
                  </div>
                ))}

              {/* Reaction Burst Visual Animation */}
              <AnimatePresence>
                {activeReactionBurst && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0, y: 30 }}
                    animate={{ scale: 1.6, opacity: 1, y: -50 }}
                    exit={{ scale: 2, opacity: 0, y: -100 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute z-40 text-7xl pointer-events-none drop-shadow-[0_0_20px_rgba(255,255,255,0.9)] select-none"
                  >
                    {activeReactionBurst}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Left / Right Interactive Tap Zones (Facebook / Instagram style) */}
              <div
                className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                title="Previous Story"
              />
              <div
                className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                title="Next Story"
              />
            </div>

            {/* Bottom Interactive Bar: Quick Reactions + Reply Input (Facebook Style) */}
            <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black via-black/85 to-transparent space-y-2">
              {/* Caption (if present) */}
              {activeStory.caption && (
                <p className="text-xs text-white/95 drop-shadow line-clamp-2 px-1 font-medium">
                  {activeStory.caption}
                </p>
              )}

              {/* Quick Emoji Reactions Bar */}
              <div className="flex items-center justify-around py-1 px-2 rounded-full bg-zinc-900/70 backdrop-blur-md border border-zinc-800/80">
                {[
                  { emoji: '🔥', label: 'Fire' },
                  { emoji: '🤘', label: 'Heavy Metal' },
                  { emoji: '💀', label: 'Skull' },
                  { emoji: '⚡', label: 'Thunder' },
                  { emoji: '🩸', label: 'Blood' },
                  { emoji: '🖤', label: 'Black Heart' },
                ].map((rx) => (
                  <button
                    key={rx.emoji}
                    type="button"
                    onClick={() => sendReaction(rx.emoji, rx.label)}
                    className="text-lg hover:scale-130 transition-transform active:scale-90 p-1 cursor-pointer"
                    title={rx.label}
                  >
                    {rx.emoji}
                  </button>
                ))}
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => setIsPaused(false)}
                  placeholder={`Reply to ${authorName}...`}
                  className="flex-1 px-3.5 py-2 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md"
                  title="Send Reply"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
