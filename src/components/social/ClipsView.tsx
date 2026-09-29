import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { requestPauseSceneRadio } from './utils/mediaPlaybackCoordinator';
import {
  ArrowRight,
  PlayCircle,
  User,
  Music,
  Heart,
  MessageSquare,
  Repeat,
  Share2,
  Trash2,
  Disc,
  Plus,
  Activity,
  X,
  PlaySquare,
  Upload,
  Sparkles,
  Info,
  Send,
  Eye,
  RefreshCw,
  TrendingUp,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { uploadClipVideoFile } from '../../supabase';
import { UploadClipModal } from './modals/UploadClipModal';
import {
  saveClipMediaBlob,
  generateVideoThumbnail,
  resolveClipVideoPlaybackUrl,
  trackRealClipView,
  calculateClipsDashboardStats,
  SCENE_PERFORMANCE_VIDEOS
} from './utils/clipsPersistenceService';
import { extractYouTubeId } from './utils/postSyncUtils';

export interface ClipItem {
  id: any;
  creator: string;
  role: string;
  avatar: string;
  caption: string;
  title?: string;
  videoUrl: string;
  video_url?: string;
  likes: number;
  likes_count?: number;
  comments: number;
  comments_count?: number;
  shares: number;
  shares_count?: number;
  reposts: number;
  views: number;
  views_count?: number;
  audio: string;
  hasLiked: boolean;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  created_at?: string;
  user_id?: string;
  profile_id?: string;
  isFollowed?: boolean;
  bandName?: string;
  band_name?: string;
  songTitle?: string;
  song_title?: string;
  tags?: string[];
}

interface ClipsViewProps {
  userProfile?: any;
  clips?: ClipItem[];
  setClips?: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  triggerNotification?: (msg: string) => void;
  setActiveTab?: (tab: any) => void;
  portalRole?: string;
  deleteClip?: (id: any) => Promise<void>;
  getSupabase?: () => any;
  onSelectProfile?: (userPayload: any) => void;
}

const DEFAULT_CLIPS: ClipItem[] = [
  {
    id: 'c1',
    creator: 'Virulent Excision',
    role: '💀 Band',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100',
    caption: 'Live breakdown in Texas! Technical slam riffs in full force. 🔥 #VirulentExcision #DeathMetal',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    likes: 1420,
    comments: 89,
    shares: 210,
    reposts: 45,
    views: 8900,
    audio: 'Virulent Excision - Grotesque Impalement (Live)',
    hasLiked: false,
    isFollowed: false,
  },
  {
    id: 'c2',
    creator: 'Goregrind_Official',
    role: '💀 Band',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    caption: 'New drum playthrough teaser! Pitch shifted vocal gargles and gravity blasts. 🥁',
    videoUrl: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
    likes: 980,
    comments: 42,
    shares: 112,
    reposts: 28,
    views: 4500,
    audio: 'Goregrind - Masticated Tissue (Teaser)',
    hasLiked: true,
    isFollowed: true,
  },
];

/**
 * Individual Single Clip Player Card Component
 * Handles video lifecycle, playback state, tap-to-play/pause, sound toggle, progress bar, and error self-healing.
 */
const SingleClipPlayerCard: React.FC<{
  clip: ClipItem;
  index: number;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  userProfile?: any;
  onSelectProfile?: (userPayload: any) => void;
  handleLikeClip: (clipId: any) => void;
  setActiveClipComments: (clipId: any) => void;
  setActiveClipShare: (clipId: any) => void;
  setActiveClipMetrics: (clipId: any) => void;
  deleteClip?: (id: any) => Promise<void>;
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  triggerNotification?: (msg: string) => void;
  setShowSongModal: (show: boolean) => void;
}> = ({
  clip,
  index,
  isActive,
  isMuted,
  onToggleMute,
  userProfile,
  onSelectProfile,
  handleLikeClip,
  setActiveClipComments,
  setActiveClipShare,
  setActiveClipMetrics,
  deleteClip,
  setClips,
  triggerNotification,
  setShowSongModal,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string>(clip.videoUrl || (clip as any).video_url || '');
  const [progress, setProgress] = useState<number>(0);
  const [playPauseAnim, setPlayPauseAnim] = useState<'play' | 'pause' | null>(null);
  const animTimeoutRef = useRef<any>(null);

  // Sync currentSrc when clip prop updates
  useEffect(() => {
    const rawUrl = clip.videoUrl || (clip as any).video_url || '';
    if (rawUrl) {
      setCurrentSrc(rawUrl);
      setHasError(false);
    }
  }, [clip.videoUrl, (clip as any).video_url]);

  // Autoplay / Pause management based on viewport intersection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
            setHasError(false);
            requestPauseSceneRadio('clips_video_play');
            trackRealClipView(clip.id, clip.views, (newViews) => {
              setClips((prev) => prev.map((c) => (c.id === clip.id ? { ...c, views: newViews, views_count: newViews } : c)));
            });
          })
          .catch((err) => {
            console.warn(`[ClipPlayer] Autoplay prevented for clip "${clip.id}":`, err?.message || err);
            // If unmuted autoplay was blocked by browser, try muted autoplay as fallback
            if (!video.muted) {
              video.muted = true;
              video.play().then(() => {
                setIsPlaying(true);
              }).catch(() => {
                setIsPlaying(false);
              });
            } else {
              setIsPlaying(false);
            }
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted, currentSrc, clip.id]);

  // Update muted property on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle tap on screen to toggle Play / Pause
  const handleTogglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (video.paused) {
      video.muted = isMuted;
      video.play().then(() => {
        setIsPlaying(true);
        setPlayPauseAnim('play');
        requestPauseSceneRadio('clips_video_play');
        animTimeoutRef.current = setTimeout(() => setPlayPauseAnim(null), 700);
      }).catch((err) => {
        console.warn("[ClipPlayer] Play error:", err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setPlayPauseAnim('pause');
      animTimeoutRef.current = setTimeout(() => setPlayPauseAnim(null), 700);
    }
  };

  // Self-heal when video element errors
  const handleVideoError = async () => {
    console.warn(`[ClipPlayer] Video playback error for clip "${clip.id}" (src: ${currentSrc}). Attempting self-healing...`);
    setIsBuffering(false);
    
    try {
      const fallback = await resolveClipVideoPlaybackUrl(clip.id, currentSrc);
      if (fallback && fallback !== currentSrc) {
        console.log(`[ClipPlayer] Applying fallback video URL for clip "${clip.id}" -> ${fallback}`);
        setCurrentSrc(fallback);
        setHasError(false);
        if (videoRef.current) {
          videoRef.current.src = fallback;
          videoRef.current.load();
          if (isActive) {
            videoRef.current.play().catch(() => {});
          }
        }
        return;
      }
    } catch (e) {
      console.warn("[ClipPlayer] Fallback error:", e);
    }

    // Secondary fallback to standard rock performance clip
    const secondary = SCENE_PERFORMANCE_VIDEOS[0];
    if (currentSrc !== secondary) {
      setCurrentSrc(secondary);
      setHasError(false);
      if (videoRef.current) {
        videoRef.current.src = secondary;
        videoRef.current.load();
        if (isActive) {
          videoRef.current.play().catch(() => {});
        }
      }
    } else {
      setHasError(true);
    }
  };

  const ytId = extractYouTubeId(currentSrc);

  return (
    <div
      className="h-full w-full shrink-0 snap-start snap-always relative flex items-center justify-center bg-zinc-950/90 border-b border-zinc-900 group select-none overflow-hidden"
      data-clip-index={index}
    >
      {/* Video Content Container */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden cursor-pointer"
        onClick={handleTogglePlayPause}
      >
        {ytId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&controls=1&modestbranding=1&rel=0`}
            className="w-full h-full object-cover"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={clip.title || clip.caption || 'Clip'}
          />
        ) : currentSrc && !currentSrc.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
          <>
            <video
              ref={videoRef}
              src={currentSrc}
              poster={clip.thumbnailUrl || (clip as any).thumbnail_url || undefined}
              className="w-full h-full object-cover"
              loop
              playsInline
              crossOrigin="anonymous"
              preload="auto"
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
                setHasError(false);
              }}
              onTimeUpdate={() => {
                const v = videoRef.current;
                if (v && v.duration > 0) {
                  setProgress((v.currentTime / v.duration) * 100);
                }
              }}
              onError={handleVideoError}
            />

            {/* Poster fallback image behind video if video is loading */}
            {(clip.thumbnailUrl || (clip as any).thumbnail_url) && !isPlaying && (
              <div
                className="absolute inset-0 bg-cover bg-center -z-10"
                style={{ backgroundImage: `url('${clip.thumbnailUrl || (clip as any).thumbnail_url}')` }}
              />
            )}
          </>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
              style={{ backgroundImage: `url('${currentSrc || clip.thumbnailUrl || (clip as any).thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'}')` }}
            />
            <PlayCircle className="w-20 h-20 text-rose-500/80 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
          </div>
        )}

        {/* Buffering Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <Loader2 className="w-12 h-12 text-rose-500 animate-spin drop-shadow-md" />
          </div>
        )}

        {/* Play / Pause Tap Feedback Icon Animation */}
        <AnimatePresence>
          {playPauseAnim && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                {playPauseAnim === 'play' ? (
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                ) : (
                  <Pause className="w-10 h-10 text-white fill-white" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Error Overlay / Self-Healing Trigger */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-4 text-center z-20 space-y-3">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-xs text-zinc-300 max-w-[260px]">
              Stream connection interrupted.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVideoError();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Clip</span>
            </button>
          </div>
        )}

        {/* Floating Sound Toggle Button (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white transition-all hover:scale-105 shadow-lg flex items-center gap-1.5"
          title={isMuted ? "Unmute Sound" : "Mute Sound"}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-mono font-bold text-rose-300 pr-1">Muted</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-emerald-300 pr-1">Sound On</span>
            </>
          )}
        </button>
      </div>

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-between pointer-events-none z-20">
        <div className="flex-1 max-w-[80%] pr-4 pointer-events-auto">
          <div
            className="flex items-center gap-3 mb-2.5 cursor-pointer group/prof"
            onClick={() => {
              const profilePayload = {
                id: (clip as any).creator_id || clip.user_id || (clip as any).profile_id,
                name: clip.creator,
                avatar: clip?.avatar,
                role: clip?.role || "Member",
                isYou: clip.creator === userProfile?.name,
              };
              if (onSelectProfile) {
                onSelectProfile(profilePayload);
              } else {
                window.dispatchEvent(
                  new CustomEvent('openPublicProfile', {
                    detail: profilePayload,
                  })
                );
              }
            }}
          >
            <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-rose-500 overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.5)] shrink-0 group-hover/prof:scale-105 transition-transform">
              {clip?.avatar ? (
                <img src={clip?.avatar} className="w-full h-full object-cover" alt="" />
              ) : (
                <User className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-white drop-shadow-md group-hover/prof:underline truncate">{clip.creator}</span>
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider truncate">{clip?.role || "Member"}</span>
            </div>
            <button
              className={`text-[10px] border px-3 py-1 rounded-full font-bold uppercase transition-all ml-1.5 shrink-0 ${
                clip.isFollowed ? 'bg-white text-black border-white' : 'border-white/40 hover:bg-white hover:text-black text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!clip.isFollowed) {
                  triggerNotification?.(`Followed ${clip.creator}`);
                  setClips((prev) =>
                    prev.map((c) => (c.id === clip.id ? { ...c, isFollowed: true } : c))
                  );
                }
              }}
            >
              {clip.isFollowed ? 'Followed' : 'Follow'}
            </button>
          </div>

          <p className="text-sm text-zinc-100 drop-shadow-md leading-snug line-clamp-3">
            {clip.caption ? clip.caption.replace(/#\w+/g, '').trim() : (clip.title || 'Live Clip')}
          </p>

          {/* View Metrics / Reactions Link */}
          <div
            className="mt-2 text-[10px] font-bold text-zinc-300 flex items-center gap-2 cursor-pointer hover:text-white group/metrics"
            onClick={() => setActiveClipMetrics(clip.id)}
          >
            <Eye className="w-3.5 h-3.5 text-zinc-400" />
            <span className="group-hover/metrics:underline decoration-white/50 underline-offset-2">
              {(clip.views || (clip as any).views_count || 0).toLocaleString()} views • See details
            </span>
          </div>

          <div className="mt-2.5 text-xs text-zinc-300 flex items-center gap-2 font-mono bg-black/60 inline-flex px-3 py-1.5 rounded-full border border-white/15 max-w-full">
            <Music className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
            <span className="truncate">{clip.audio || `${clip.creator} - Original Audio`}</span>
          </div>
        </div>

        {/* Actions Column */}
        <div className="flex flex-col items-center gap-3.5 pb-2 pointer-events-auto">
          {/* Like Button */}
          <button
            onClick={() => handleLikeClip(clip.id)}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center border backdrop-blur-md group-hover/btn:scale-110 transition-all ${
                clip.hasLiked ? 'bg-rose-500/25 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-black/50 border-zinc-700 hover:border-zinc-500'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  clip.hasLiked ? 'text-rose-500 fill-rose-500' : 'text-white group-hover/btn:text-rose-500'
                }`}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {(clip.likes || (clip as any).likes_count || 0).toLocaleString()}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setActiveClipComments(clip.id)}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center border border-zinc-700 backdrop-blur-md group-hover/btn:border-cyan-400 group-hover/btn:bg-zinc-800 transition-all group-hover/btn:scale-110">
              <MessageSquare className="w-5 h-5 text-white group-hover/btn:text-cyan-400 transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {(clip.comments || (clip as any).comments_count || 0).toLocaleString()}
            </span>
          </button>

          {/* Repost Button */}
          <button
            onClick={() => {
              setClips((prev) =>
                prev.map((c) => (c.id === clip.id ? { ...c, reposts: (c.reposts || 0) + 1 } : c))
              );
              triggerNotification?.("Reposted to your feed!");
            }}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center border border-zinc-700 backdrop-blur-md group-hover/btn:border-emerald-400 group-hover/btn:bg-zinc-800 transition-all group-hover/btn:scale-110">
              <Repeat className="w-5 h-5 text-white group-hover/btn:text-emerald-400 transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {clip.reposts?.toLocaleString() || '0'}
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => setActiveClipShare(clip.id)}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <div className="w-11 h-11 rounded-full bg-black/50 flex items-center justify-center border border-zinc-700 backdrop-blur-md group-hover/btn:border-cyan-400 group-hover/btn:bg-zinc-800 transition-all group-hover/btn:scale-110">
              <Share2 className="w-5 h-5 text-white group-hover/btn:text-cyan-400 transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {(clip.shares || (clip as any).shares_count || 0).toLocaleString()}
            </span>
          </button>

          {/* Delete Button for Creator */}
          {((clip.user_id && userProfile?.id && clip.user_id === userProfile.id) ||
            ((clip as any).profile_id && userProfile?.id && (clip as any).profile_id === userProfile.id) ||
            (clip.creator && userProfile?.name && clip.creator === userProfile.name)) && (
            <button
              onClick={async () => {
                if (window.confirm("Are you sure you want to permanently delete this clip?")) {
                  if (deleteClip) {
                    await deleteClip(clip.id);
                  } else {
                    setClips((prev) => prev.filter((c) => c.id !== clip.id));
                  }
                }
              }}
              className="flex flex-col items-center gap-1 group/btn mt-1 text-rose-500 hover:text-rose-400 cursor-pointer"
              title="Delete clip"
            >
              <div className="w-11 h-11 rounded-full bg-rose-950/40 hover:bg-rose-900 border border-rose-900 flex items-center justify-center backdrop-blur-md group-hover/btn:scale-110 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <Trash2 className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-[10px] font-bold drop-shadow-md text-rose-400">Delete</span>
            </button>
          )}

          {/* Audio Disc Spinner */}
          <button
            onClick={() => setShowSongModal(true)}
            className="flex flex-col items-center gap-1 mt-1.5 cursor-pointer group/disc"
            title="Use this audio"
          >
            <div className={`w-11 h-11 rounded-lg bg-zinc-900 border-2 border-rose-500/50 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''} group-hover/disc:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] group-hover/disc:shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center justify-center overflow-hidden transition-all`}>
              <Disc className="w-6 h-6 text-rose-400 group-hover/disc:text-white transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* Glowing Bottom Video Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/60 z-30 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 transition-all duration-100 shadow-[0_0_8px_#f43f5e]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ClipsView: React.FC<ClipsViewProps> = ({
  userProfile,
  clips: propClips,
  setClips: propSetClips,
  triggerNotification,
  setActiveTab,
  portalRole,
  deleteClip,
  getSupabase,
  onSelectProfile,
}) => {
  const [internalClips, setInternalClips] = useState<ClipItem[]>(DEFAULT_CLIPS);
  const clips = propClips && propClips.length > 0 ? propClips : internalClips;
  const setClips = propSetClips || setInternalClips;

  // Active clip index in viewport and global mute state
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Modals & Drawers inside Clips view
  const [showUploadClipModal, setShowUploadClipModal] = useState(false);
  const [showClipsAnalyticsModal, setShowClipsAnalyticsModal] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);
  const [activeClipComments, setActiveClipComments] = useState<any | null>(null);
  const [activeClipShare, setActiveClipShare] = useState<any | null>(null);
  const [activeClipMetrics, setActiveClipMetrics] = useState<any | null>(null);

  // New clip form states
  const [newClipVideoUrl, setNewClipVideoUrl] = useState('');
  const [selectedClipFile, setSelectedClipFile] = useState<File | null>(null);
  const [newClipCaption, setNewClipCaption] = useState('');
  const [newClipSong, setNewClipSong] = useState('Original Audio');

  // Comment input
  const [commentInput, setCommentInput] = useState('');
  const [clipCommentsList, setClipCommentsList] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>({
    c1: [
      { id: 'cc1', author: 'DeathMetalFan99', text: 'That blast beat section was unbelievable!', time: '10m ago' },
      { id: 'cc2', author: 'SlamLord', text: 'Heavy as hell! 🔥', time: '5m ago' }
    ]
  });

  // Track viewport intersection to update active clip
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const children = Array.from(container.children) as HTMLElement[];
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const centerPos = containerTop + containerHeight / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      children.forEach((child, idx) => {
        const childTop = child.offsetTop;
        const childCenter = childTop + child.clientHeight / 2;
        const distance = Math.abs(centerPos - childCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = idx;
        }
      });

      if (closestIndex !== activeClipIndex) {
        setActiveClipIndex(closestIndex);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeClipIndex]);

  const handleLikeClip = (clipId: any) => {
    setClips((prev) => {
      const updated = prev.map((c) => {
        if (c.id === clipId) {
          const nextHasLiked = !c.hasLiked;
          const nextLikesCount = nextHasLiked ? (c.likes || 0) + 1 : Math.max(0, (c.likes || 1) - 1);
          if (!c.hasLiked) triggerNotification?.("Liked clip!");
          return { ...c, hasLiked: nextHasLiked, likes: nextLikesCount, likes_count: nextLikesCount };
        }
        return c;
      });
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const client = getSupabase ? getSupabase() : null;
    if (client && typeof clipId === 'string') {
      try {
        client.from('clips').select('likes_count').eq('id', clipId).maybeSingle().then(({ data }: any) => {
          if (data) {
            client.from('clips').update({ likes_count: (data.likes_count || 0) + 1 }).eq('id', clipId).then();
          }
        });
      } catch (_) {}
    }
  };

  const handleAddComment = (clipId: any) => {
    if (!commentInput.trim()) return;
    const newComm = {
      id: `cc_${Date.now()}`,
      author: userProfile?.name || 'Fan',
      text: commentInput,
      time: 'Just now'
    };
    setClipCommentsList(prev => ({
      ...prev,
      [clipId]: [...(prev[clipId] || []), newComm]
    }));
    setClips(prev => {
      const updated = prev.map(c => c.id === clipId ? { ...c, comments: (c.comments || 0) + 1, comments_count: ((c as any).comments_count || 0) + 1 } : c);
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const client = getSupabase ? getSupabase() : null;
    if (client && typeof clipId === 'string') {
      try {
        client.from('clips').select('comments_count').eq('id', clipId).maybeSingle().then(({ data }: any) => {
          if (data) {
            client.from('clips').update({ comments_count: (data.comments_count || 0) + 1 }).eq('id', clipId).then();
          }
        });
      } catch (_) {}
    }

    setCommentInput('');
    triggerNotification?.("Comment added to clip!");
  };

  return (
    <div className="w-full bg-[#030303] flex flex-col items-center animate-in fade-in duration-300">
      {/* Top Bar Action Controls for Reels */}
      <div className="w-full max-w-[480px] flex items-center justify-between px-3 py-2 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-3 shadow-lg">
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab('feed');
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0"
          title="Back to Feed"
        >
          <ArrowRight className="w-4 h-4 text-zinc-400 rotate-180" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadClipModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 hover:text-rose-300 rounded-xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-rose-500" />
            <span>Add Clip</span>
          </button>
          <button
            onClick={() => setShowClipsAnalyticsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Reels Container */}
      <div
        ref={containerRef}
        className="w-full max-w-[480px] h-[calc(100vh-140px)] max-h-[900px] relative bg-black sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col snap-y snap-mandatory overflow-y-scroll no-scrollbar mb-8 border border-zinc-900"
      >
        {clips.map((clip, cIdx) => (
          <SingleClipPlayerCard
            key={clip.id ? `clip-${clip.id}-${cIdx}` : `clip-${cIdx}`}
            clip={clip}
            index={cIdx}
            isActive={cIdx === activeClipIndex}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted((prev) => !prev)}
            userProfile={userProfile}
            onSelectProfile={onSelectProfile}
            handleLikeClip={handleLikeClip}
            setActiveClipComments={setActiveClipComments}
            setActiveClipShare={setActiveClipShare}
            setActiveClipMetrics={setActiveClipMetrics}
            deleteClip={deleteClip}
            setClips={setClips}
            triggerNotification={triggerNotification}
            setShowSongModal={setShowSongModal}
          />
        ))}
      </div>

      {/* UPLOAD CLIP MODAL */}
      <UploadClipModal
        showUploadClipModal={showUploadClipModal}
        setShowUploadClipModal={setShowUploadClipModal}
        newClipVideoUrl={newClipVideoUrl}
        setNewClipVideoUrl={setNewClipVideoUrl}
        selectedClipFile={selectedClipFile}
        setSelectedClipFile={setSelectedClipFile}
        newClipCaption={newClipCaption}
        setNewClipCaption={setNewClipCaption}
        newClipSongTitle={newClipSong}
        setNewClipSongTitle={setNewClipSong}
        newClipBandName={userProfile?.band_name || userProfile?.name || ''}
        setNewClipBandName={() => {}}
        newClipTags="SLAM, LIVE, DEATHCORE"
        setNewClipTags={() => {}}
        setClips={setClips}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
      />

      {/* CLIPS COMMENTS DRAWER */}
      <AnimatePresence>
        {activeClipComments && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-end md:items-center p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Clip Comments
                </span>
                <button onClick={() => setActiveClipComments(null)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {(clipCommentsList[activeClipComments] || []).map((comm, commIdx) => (
                  <div key={comm.id ? `comm-${comm.id}-${commIdx}` : `comm-${commIdx}`} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-rose-400">{comm.author}</span>
                      <span className="text-zinc-600 font-mono">{comm.time}</span>
                    </div>
                    <p className="text-xs text-zinc-200">{comm.text}</p>
                  </div>
                ))}
                {(!clipCommentsList[activeClipComments] || clipCommentsList[activeClipComments].length === 0) && (
                  <p className="text-center text-xs text-zinc-600 py-6">No comments yet. Be the first to reply!</p>
                )}
              </div>

              <div className="p-3 border-t border-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(activeClipComments); }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={() => handleAddComment(activeClipComments)}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIPS ANALYTICS DASHBOARD MODAL */}
      <AnimatePresence>
        {showClipsAnalyticsModal && (() => {
          const stats = calculateClipsDashboardStats(clips as any, userProfile?.id, userProfile);
          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#121214] border border-emerald-900/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-[0_0_40px_rgba(52,211,153,0.1)]"
              >
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Clips Performance & Engagement
                  </span>
                  <button onClick={() => setShowClipsAnalyticsModal(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Total Reel Views</span>
                    <p className="text-xl font-black text-white mt-1">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Avg Engagement Rate</span>
                    <p className="text-xl font-black text-emerald-400 mt-1">{stats.avgEngagementRate}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Total Likes</span>
                    <p className="text-xl font-black text-rose-400 mt-1">{stats.totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Shares & Reposts</span>
                    <p className="text-xl font-black text-cyan-400 mt-1">{stats.totalShares.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowClipsAnalyticsModal(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Close Dashboard
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ATTACH SONG / AUDIO SELECTION MODAL */}
      <AnimatePresence>
        {showSongModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40">
                <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 font-display">
                  <Music className="w-4 h-4 text-rose-400" /> Select Scene Audio For Reel
                </span>
                <button
                  onClick={() => setShowSongModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-400 font-sans">
                  Select a trending scene track or original audio stem to attach to your Clip reel:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {[
                    { id: '1', title: 'Voracious Cleansing', band: 'Infestment', duration: '3:45' },
                    { id: '2', title: 'Hammer Smashed Face', band: 'Cannibal Corpse', duration: '4:02' },
                    { id: '3', title: 'Scourge of Iron', band: 'Cannibal Corpse', duration: '4:44' },
                    { id: '4', title: 'Close to a World Below', band: 'Immolation', duration: '5:12' },
                    { id: '5', title: 'Grotesque Impalement', band: 'Dying Fetus', duration: '4:26' },
                  ].map((track, trkIdx) => (
                    <div
                      key={track.id ? `trk-${track.id}-${trkIdx}` : `trk-${trkIdx}`}
                      onClick={() => {
                        triggerNotification?.(`Audio "${track.title}" attached to Clip reel!`);
                        setShowSongModal(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          ♫
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">{track.title}</h5>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide truncate">{track.band}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{track.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClipsView;
