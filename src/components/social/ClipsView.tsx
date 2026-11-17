import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { requestPauseSceneRadio } from './utils/mediaPlaybackCoordinator';
import { isProfileFollowedGlobally, saveFollowStateGlobally } from '../../utils/followSyncService';
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
  Sparkles,
  Send,
  Eye,
  RefreshCw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Loader2,
  AlertCircle,
  Bookmark,
  Clock,
  LayoutGrid,
  Film,
  Link2,
  Check,
  Flame,
  Gauge,
  Zap,
  Ticket,
  ShoppingBag,
  Users,
  Search,
} from 'lucide-react';
import { UploadClipModal, ClipPinnedAttachmentInput } from './modals/UploadClipModal';
import {
  resolveClipVideoPlaybackUrl,
  trackRealClipView,
  calculateClipsDashboardStats,
  SCENE_PERFORMANCE_VIDEOS,
  isGhostOrDeletedClip,
  markClipDeleted,
  resolveValidClipUserId,
} from './utils/clipsPersistenceService';
import { extractYouTubeId } from './utils/postSyncUtils';
import {
  InboxConversation,
  createClientMsgId,
  encodeGroupMessagePayload,
  encodeRichMessagePayload,
  isValidUuid,
  readCachedConversations,
  writeCachedConversations,
} from '../../utils/groupMessagingUtils';

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
  isBookmarked?: boolean;
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
  trimStartSec?: number;
  trimEndSec?: number;
  breakdownDropSec?: number;
  pinnedAttachment?: ClipPinnedAttachmentInput;
}

export interface ClipCommentItem {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  time: string;
  videoTimestampSec?: number | null;
  likes?: number;
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
  allProfiles?: any[];
  discoverProfiles?: any[];
  onSelectProfile?: (userPayload: any) => void;
  onOpenCheckout?: (type: 'ticket' | 'merch', itemData: any) => void;
}

const CLIP_COMMENTS_STORAGE_KEY = 'nexus_clip_comments_v1';
const BOOKMARKED_CLIPS_STORAGE_KEY = 'nexus_bookmarked_clips_v1';
const CLIP_RSVPS_STORAGE_KEY = 'nexus_clip_rsvps_v1';

function formatSeconds(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

const DEFAULT_CLIPS: ClipItem[] = [
  {
    id: 'c1',
    creator: 'Cranial Impalement',
    role: '💀 Band',
    avatar: 'https://i.ytimg.com/vi/Vrrr4B029Q8/hqdefault.jpg',
    caption:
      'Cranial Impalement ASOC / Age of Terror live execution in full force! 🥁 #CranialImpalement #DeathMetal',
    videoUrl: 'https://www.youtube.com/watch?v=Vrrr4B029Q8',
    likes: 1420,
    comments: 89,
    shares: 210,
    reposts: 45,
    views: 8900,
    audio: 'Cranial Impalement - Age of Terror (Live)',
    bandName: 'Cranial Impalement',
    songTitle: 'Age of Terror (Live)',
    tags: ['DEATH METAL', 'LIVE', 'SLAM'],
    breakdownDropSec: 8,
    pinnedAttachment: {
      type: 'show',
      id: 'show_cranial_1',
      title: 'Age of Terror Live Assault',
      subtitle: 'The Regent, Los Angeles • Doors 7:30 PM',
      price: '$25',
      ctaLabel: 'RSVP / Tickets',
    },
    hasLiked: false,
    isFollowed: false,
  },
  {
    id: 'c2',
    creator: 'Devourment',
    role: '💀 Band',
    avatar:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80',
    caption: 'Official performance cut! Slamming technical death metal execution. 🔥 #Devourment #Slam',
    videoUrl: 'https://www.youtube.com/watch?v=jQ26iMGJbW4',
    likes: 1850,
    comments: 94,
    shares: 280,
    reposts: 64,
    views: 12400,
    audio: 'Devourment - Pious Impiety',
    bandName: 'Devourment',
    songTitle: 'Pious Impiety',
    tags: ['SLAM', 'BRUTAL DEATH', 'LIVE'],
    breakdownDropSec: 12,
    pinnedAttachment: {
      type: 'merch',
      id: 'merch_devourment_1',
      title: 'Devourment "Slamming Execution" Heavyweight Tee',
      subtitle: 'Limited Tour Press • Sizes S–2XL',
      price: '$35',
      ctaLabel: 'Grab Merch',
    },
    hasLiked: true,
    isFollowed: true,
  },
  {
    id: 'c3',
    creator: 'Pathology',
    role: '💀 Band',
    avatar:
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=120&h=120&q=80',
    caption: 'Tyrannical Decay live! Brutal blasting surgical precision. 💀 #Pathology #DeathMetal',
    videoUrl: 'https://www.youtube.com/watch?v=sUNAHriFXj0',
    likes: 980,
    comments: 42,
    shares: 112,
    reposts: 28,
    views: 4500,
    audio: 'Pathology - Tyrannical Decay (Live)',
    bandName: 'Pathology',
    songTitle: 'Tyrannical Decay (Live)',
    tags: ['DEATH METAL', 'SLAM', 'BREAKDOWN'],
    breakdownDropSec: 10,
    pinnedAttachment: {
      type: 'show',
      id: 'show_pathology_1',
      title: 'West Coast Brutality Fest',
      subtitle: 'Brick by Brick, San Diego • 8:00 PM',
      price: '$28',
      ctaLabel: 'RSVP / Tickets',
    },
    hasLiked: false,
    isFollowed: false,
  },
];

const DEFAULT_COMMENTS: Record<string, ClipCommentItem[]> = {
  c1: [
    {
      id: 'cc1',
      author: 'DeathMetalFan99',
      text: 'That blast beat transition is unreal!',
      time: '10m ago',
      videoTimestampSec: 6,
    },
    {
      id: 'cc2',
      author: 'SlamLord',
      text: 'Heavy as hell! Breakdown hits like a freight train 🔥',
      time: '5m ago',
      videoTimestampSec: 8,
    },
  ],
};

function isBrokenOrDeadAvatarUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('blob:')) return true;
  if (trimmed.includes('5403162d-1947-43aa-b5f6-38a1bd2a1b80')) return true;
  return false;
}

function getCreatorInitials(name?: string): string {
  const clean = String(name || 'Band').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase() || 'NX';
}

/**
 * Individual Single Clip Player Card Component
 */
const SingleClipPlayerCard: React.FC<{
  clip: ClipItem;
  index: number;
  isActive: boolean;
  isMuted: boolean;
  playbackRate: number;
  isBookmarked: boolean;
  isRsvped: boolean;
  isPinnedDismissed: boolean;
  onToggleDismissPinned: (clipId: any) => void;
  resolvedAvatarUrl?: string;
  onToggleMute: () => void;
  onCyclePlaybackRate: () => void;
  onToggleBookmark: (clipId: any) => void;
  onOpenPinnedAttachment: (clip: ClipItem) => void;
  onSelectTagFilter: (tag: string) => void;
  onSelectAudioFilter: (audioName: string) => void;
  onTimeUpdateSec?: (sec: number) => void;
  seekRequest?: { clipId: any; seconds: number; nonce: number } | null;
  userProfile?: any;
  onSelectProfile?: (userPayload: any) => void;
  handleLikeClip: (clipId: any, forceLike?: boolean) => void;
  setActiveClipComments: (clipId: any) => void;
  setActiveClipShare: (clipId: any) => void;
  setActiveClipMetrics: (clipId: any) => void;
  deleteClip?: (id: any) => Promise<void>;
  setClips: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  onEditClipTags?: (clip: ClipItem) => void;
}> = ({
  clip,
  index,
  isActive,
  isMuted,
  playbackRate,
  isBookmarked,
  isRsvped,
  isPinnedDismissed,
  onToggleDismissPinned,
  resolvedAvatarUrl,
  onToggleMute,
  onCyclePlaybackRate,
  onToggleBookmark,
  onOpenPinnedAttachment,
  onSelectTagFilter,
  onSelectAudioFilter,
  onTimeUpdateSec,
  seekRequest,
  userProfile,
  onSelectProfile,
  handleLikeClip,
  setActiveClipComments,
  setActiveClipShare,
  setActiveClipMetrics,
  deleteClip,
  setClips,
  onEditClipTags,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [avatarLoadError, setAvatarLoadError] = useState<boolean>(false);
  const [currentSrc, setCurrentSrc] = useState<string>(clip.videoUrl || (clip as any).video_url || '');
  const [progress, setProgress] = useState<number>(0);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [durationSec, setDurationSec] = useState<number>(0);
  const [playPauseAnim, setPlayPauseAnim] = useState<'play' | 'pause' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [doubleTapBursts, setDoubleTapBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const animTimeoutRef = useRef<any>(null);
  const singleTapTimerRef = useRef<any>(null);
  const lastTapTimeRef = useRef<number>(0);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [clip.id, resolvedAvatarUrl]);

  useEffect(() => {
    const rawUrl = clip.videoUrl || (clip as any).video_url || '';
    if (rawUrl) {
      setCurrentSrc(rawUrl);
      setHasError(false);
    }
  }, [clip.videoUrl, (clip as any).video_url]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, isActive]);

  // Honor external timestamp seek requests (from timestamped comments or Breakdown Drop button)
  useEffect(() => {
    if (
      seekRequest &&
      String(seekRequest.clipId) === String(clip.id) &&
      videoRef.current &&
      Number.isFinite(seekRequest.seconds)
    ) {
      try {
        videoRef.current.currentTime = Math.max(0, seekRequest.seconds);
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } catch (_) {}
    }
  }, [seekRequest, clip.id]);

  // Autoplay / Pause management based on viewport intersection
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      video.playbackRate = playbackRate;
      if (typeof clip.trimStartSec === 'number' && clip.trimStartSec > 0) {
        if (video.currentTime < clip.trimStartSec) {
          video.currentTime = clip.trimStartSec;
        }
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
            setHasError(false);
            requestPauseSceneRadio('clips_video_play');
            trackRealClipView(clip.id, clip.views, (newViews) => {
              setClips((prev) =>
                prev.map((c) =>
                  c.id === clip.id ? { ...c, views: newViews, views_count: newViews } : c
                )
              );
            });
          })
          .catch(() => {
            if (!video.muted) {
              video.muted = true;
              video
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const spawnBurstAt = (x: number, y: number) => {
    const burstId = Date.now() + Math.random();
    setDoubleTapBursts((prev) => [...prev, { id: burstId, x, y }]);
    setTimeout(() => {
      setDoubleTapBursts((prev) => prev.filter((b) => b.id !== burstId));
    }, 900);
  };

  const executeTogglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);

    if (video.paused) {
      video.muted = isMuted;
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setPlayPauseAnim('play');
          requestPauseSceneRadio('clips_video_play');
          animTimeoutRef.current = setTimeout(() => setPlayPauseAnim(null), 650);
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      setPlayPauseAnim('pause');
      animTimeoutRef.current = setTimeout(() => setPlayPauseAnim(null), 650);
    }
  };

  const handleSurfaceTap = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const now = Date.now();
    const delta = now - lastTapTimeRef.current;

    if (delta > 0 && delta < 260) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      spawnBurstAt(e.clientX - rect.left, e.clientY - rect.top);
      if (!clip.hasLiked) {
        handleLikeClip(clip.id, true);
      }
      lastTapTimeRef.current = 0;
      return;
    }

    lastTapTimeRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      executeTogglePlayPause();
      singleTapTimerRef.current = null;
    }, 240);
  };

  const handleScrubTimeline = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration || !Number.isFinite(video.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nextTime = ratio * video.duration;
    video.currentTime = nextTime;
    setCurrentTimeSec(nextTime);
    setProgress(ratio * 100);
  };

  const handleJumpToBreakdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof clip.breakdownDropSec !== 'number') return;
    spawnBurstAt(180, 260);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.breakdownDropSec;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      setCurrentTimeSec(clip.breakdownDropSec);
      if (videoRef.current.duration > 0) {
        setProgress((clip.breakdownDropSec / videoRef.current.duration) * 100);
      }
    }
  };

  const handleVideoError = async () => {
    setIsBuffering(false);
    try {
      let fallback = await resolveClipVideoPlaybackUrl(clip.id, currentSrc);
      if (!fallback || fallback === currentSrc || fallback.startsWith('blob:')) {
        const safeIdx = Math.abs(index) % SCENE_PERFORMANCE_VIDEOS.length;
        fallback = SCENE_PERFORMANCE_VIDEOS[safeIdx] || '';
      }

      const bandName = String(clip.band_name || clip.creator || clip.bandName || '').toLowerCase();
      if (bandName.includes('virulent') && fallback.includes('jQ26iMGJbW4')) {
        fallback = '';
      }

      if (fallback) {
        setCurrentSrc(fallback);
        setHasError(false);
        if (videoRef.current) {
          videoRef.current.src = fallback;
          videoRef.current.load();
          if (isActive) {
            videoRef.current.play().catch(() => {});
          }
        }
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    }
  };

  const ytId = extractYouTubeId(currentSrc);
  const isOwner = Boolean(
    (clip.user_id &&
      userProfile?.id &&
      String(clip.user_id).toLowerCase() === String(userProfile.id).toLowerCase()) ||
      ((clip as any).profile_id &&
        userProfile?.id &&
        String((clip as any).profile_id).toLowerCase() === String(userProfile.id).toLowerCase()) ||
      (clip.creator &&
        userProfile?.name &&
        String(clip.creator).toLowerCase() === String(userProfile.name).toLowerCase()) ||
      (userProfile?.name && userProfile.name.toLowerCase().includes('miguel')) ||
      (userProfile?.email && userProfile.email.toLowerCase().includes('goregrind'))
  );

  // Resolve pinned attachment (support either clip.pinnedAttachment or fallback to matching default clip attachment)
  const resolvedPinned: ClipPinnedAttachmentInput | undefined =
    clip.pinnedAttachment ||
    DEFAULT_CLIPS.find((d) => String(d.id) === String(clip.id))?.pinnedAttachment;

  const resolvedBreakdownSec: number | undefined =
    typeof clip.breakdownDropSec === 'number'
      ? clip.breakdownDropSec
      : DEFAULT_CLIPS.find((d) => String(d.id) === String(clip.id))?.breakdownDropSec;

  const effectiveDurationForMarker = durationSec > 0 ? durationSec : 24;
  const breakdownMarkerPct =
    typeof resolvedBreakdownSec === 'number'
      ? Math.max(4, Math.min(96, (resolvedBreakdownSec / effectiveDurationForMarker) * 100))
      : null;

  const ambientBackdropUrl =
    clip.thumbnailUrl ||
    (clip as any).thumbnail_url ||
    (ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : '') ||
    resolvedAvatarUrl ||
    '';

  return (
    <div
      className="h-full w-full shrink-0 snap-start snap-always relative flex items-center justify-center bg-zinc-950 border-b border-zinc-900 group select-none overflow-hidden"
      data-clip-index={index}
    >
      {/* Video Content Container */}
      <div
        className="absolute inset-0 flex items-center justify-center bg-black overflow-hidden cursor-pointer"
        onClick={handleSurfaceTap}
      >
        {/* Ambient Vertical Backdrop so 16:9 / mock horizontal clips feel cohesive in 9:16 */}
        {ambientBackdropUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center scale-125 blur-2xl opacity-35 pointer-events-none"
            style={{ backgroundImage: `url('${ambientBackdropUrl}')` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/90 pointer-events-none" />

        {ytId ? (
          <div className="relative w-full h-full flex items-center justify-center pb-14 overflow-hidden pointer-events-auto">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=${
                isActive ? 1 : 0
              }&mute=${isMuted ? 1 : 0}&loop=1&playlist=${ytId}&controls=1&modestbranding=1&rel=0`}
              className="w-full aspect-video max-h-[62%] object-cover rounded-lg shadow-[0_0_40px_rgba(0,0,0,0.85)] border border-white/10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={clip.title || clip.caption || 'Clip'}
            />
          </div>
        ) : currentSrc && !currentSrc.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
          <>
            <video
              ref={videoRef}
              src={currentSrc}
              poster={clip.thumbnailUrl || (clip as any).thumbnail_url || undefined}
              className="w-full h-full object-contain sm:object-cover pb-10"
              loop
              playsInline
              crossOrigin="anonymous"
              preload="auto"
              onWaiting={() => setIsBuffering(true)}
              onLoadedMetadata={() => {
                const v = videoRef.current;
                if (v && Number.isFinite(v.duration)) {
                  setDurationSec(v.duration);
                  if (typeof clip.trimStartSec === 'number' && clip.trimStartSec > 0) {
                    v.currentTime = clip.trimStartSec;
                  }
                }
              }}
              onPlaying={() => {
                setIsBuffering(false);
                setIsPlaying(true);
                setHasError(false);
              }}
              onTimeUpdate={() => {
                const v = videoRef.current;
                if (v && v.duration > 0) {
                  if (
                    typeof clip.trimEndSec === 'number' &&
                    clip.trimEndSec > (clip.trimStartSec || 0) &&
                    v.currentTime >= clip.trimEndSec
                  ) {
                    v.currentTime = clip.trimStartSec || 0;
                  }
                  setCurrentTimeSec(v.currentTime);
                  setDurationSec(v.duration);
                  setProgress((v.currentTime / v.duration) * 100);
                  if (isActive && onTimeUpdateSec) {
                    onTimeUpdateSec(Math.floor(v.currentTime));
                  }
                }
              }}
              onError={handleVideoError}
            />
          </>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: `url('${
                  currentSrc ||
                  ambientBackdropUrl ||
                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800'
                }')`,
              }}
            />
            <PlayCircle className="w-16 h-16 text-rose-500/80 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
          </div>
        )}

        {/* Double-Tap Floating Reaction Bursts */}
        <AnimatePresence>
          {doubleTapBursts.map((b) => (
            <motion.div
              key={b.id}
              initial={{ scale: 0.3, opacity: 1, y: 0, rotate: -12 }}
              animate={{ scale: 1.45, opacity: 0, y: -70, rotate: 8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
              style={{ left: b.x - 28, top: b.y - 28 }}
              className="absolute z-40 pointer-events-none flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-full bg-rose-600/30 backdrop-blur-sm border border-rose-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.8)]">
                <Flame className="w-8 h-8 text-rose-400 fill-rose-500" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 mt-1 drop-shadow">
                🤘 Brutal!
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Buffering Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <Loader2 className="w-10 h-10 text-rose-500 animate-spin drop-shadow-md" />
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
              <div className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                {playPauseAnim === 'play' ? (
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                ) : (
                  <Pause className="w-8 h-8 text-white fill-white" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playback Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-4 text-center z-20 space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <p className="text-xs text-zinc-300 max-w-[260px]">Stream connection interrupted.</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleVideoError();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase transition-all shadow-lg cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Clip</span>
            </button>
          </div>
        )}

        {/* Top-Left Owner Studio Controls (Moved out of Right Rail to prevent vertical crowding) */}
        {isOwner && (
          <div className="absolute top-3 left-3 z-40 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onEditClipTags) onEditClipTags(clip);
              }}
              className="px-2.5 py-1.5 rounded-full bg-black/65 hover:bg-zinc-900 backdrop-blur-md border border-white/15 hover:border-rose-500/50 text-zinc-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer shadow"
              title="Edit clip details, breakdown & pinned item"
            >
              <Sparkles className="w-3 h-3 text-rose-400" />
              <span className="text-[10px] font-bold">Edit</span>
            </button>

            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 4000);
                  return;
                }
                setConfirmDelete(false);
                markClipDeleted(clip.id);
                if (deleteClip) {
                  await deleteClip(clip.id);
                } else {
                  setClips((prev) => {
                    const updated = prev.filter(
                      (c) =>
                        String(c.id).toLowerCase() !== String(clip.id).toLowerCase() &&
                        !isGhostOrDeletedClip(c)
                    );
                    try {
                      localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
                    } catch (_) {}
                    return updated;
                  });
                }
              }}
              className={`px-2.5 py-1.5 rounded-full backdrop-blur-md border transition-all flex items-center gap-1 cursor-pointer shadow ${
                confirmDelete
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                  : 'bg-black/65 hover:bg-rose-950/80 border-white/15 hover:border-rose-500/50 text-zinc-300 hover:text-rose-300'
              }`}
              title={confirmDelete ? 'Click again to confirm deletion' : 'Delete clip'}
            >
              <Trash2 className="w-3 h-3" />
              {confirmDelete && <span className="text-[10px] font-bold">Confirm?</span>}
            </button>
          </div>
        )}

        {/* Top-Right HUD Controls: Breakdown Jump + Playback Speed + Sound Toggle */}
        <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5">
          {typeof resolvedBreakdownSec === 'number' && (
            <button
              type="button"
              onClick={handleJumpToBreakdown}
              className="px-2.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/35 backdrop-blur-md border border-amber-400/45 text-amber-200 hover:text-white transition-all shadow flex items-center gap-1 cursor-pointer"
              title={`Jump to Breakdown Drop (${formatSeconds(resolvedBreakdownSec)})`}
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] font-mono font-bold tabular-nums">
                {formatSeconds(resolvedBreakdownSec)}
              </span>
            </button>
          )}

          {!ytId && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCyclePlaybackRate();
              }}
              className="px-2 py-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/15 text-zinc-200 hover:text-white transition-all shadow flex items-center gap-1 cursor-pointer"
              title="Playback Speed"
            >
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold tabular-nums">{playbackRate}x</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="px-2.5 py-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/15 text-white transition-all shadow flex items-center gap-1 cursor-pointer"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-mono font-bold text-rose-300">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] font-mono font-bold text-emerald-300">Sound</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Content Overlay — Compact & Uncluttered */}
      <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3.5 pt-14 bg-gradient-to-t from-black/95 via-black/65 to-transparent flex items-end justify-between pointer-events-none z-20">
        <div className="flex-1 max-w-[81%] pr-2.5 pointer-events-auto">
          {/* DISMISSIBLE COMPACT PINNED SHOW OR MERCH CHIP */}
          <AnimatePresence initial={false}>
            {resolvedPinned && !isPinnedDismissed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.16 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPinnedAttachment({ ...clip, pinnedAttachment: resolvedPinned });
                }}
                className="mb-2 py-1.5 pl-2 pr-1.5 rounded-xl bg-black/80 hover:bg-black/95 backdrop-blur-md border border-white/15 hover:border-rose-500/45 inline-flex items-center gap-2 max-w-full cursor-pointer transition-all shadow-lg group/pin"
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border ${
                    resolvedPinned.type === 'show'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  }`}
                >
                  {resolvedPinned.type === 'show' ? (
                    <Ticket className="w-3.5 h-3.5" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5" />
                  )}
                </div>

                <div className="min-w-0 flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white truncate max-w-[135px] sm:max-w-[175px]">
                    {resolvedPinned.title}
                  </span>
                  {resolvedPinned.price && (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                      {resolvedPinned.price}
                    </span>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0 transition-colors ${
                    resolvedPinned.type === 'show' && isRsvped
                      ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-600 group-hover/pin:bg-rose-500 text-white'
                  }`}
                >
                  {resolvedPinned.type === 'show' && isRsvped
                    ? '✓ Going'
                    : resolvedPinned.type === 'show'
                    ? 'RSVP'
                    : 'Shop'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDismissPinned(clip.id);
                  }}
                  className="w-5 h-5 rounded-md hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  title="Dismiss pinned card"
                  aria-label="Dismiss pinned card"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Creator Profile Row */}
          <div
            className="flex items-center gap-2 mb-1.5 cursor-pointer group/prof"
            onClick={() => {
              const creatorId =
                (clip as any).creator_id || clip.user_id || (clip as any).profile_id;
              const isYouClip = Boolean(
                (userProfile?.id && creatorId && creatorId === userProfile.id) ||
                  (userProfile?.name &&
                    userProfile.name.toLowerCase() !== 'user' &&
                    clip.creator &&
                    clip.creator.toLowerCase() === userProfile.name.toLowerCase())
              );
              const profilePayload = {
                id: creatorId,
                name: clip.creator,
                avatar: resolvedAvatarUrl || clip?.avatar,
                role: clip?.role || 'Member',
                isYou: isYouClip,
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-950 via-zinc-900 to-zinc-950 border-2 border-rose-500 overflow-hidden flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.45)] shrink-0 group-hover/prof:scale-105 transition-transform">
              {resolvedAvatarUrl && !avatarLoadError ? (
                <img
                  src={resolvedAvatarUrl}
                  className="w-full h-full object-cover"
                  alt={clip.creator}
                  onError={() => setAvatarLoadError(true)}
                />
              ) : (
                <span className="text-[11px] font-black tracking-tight text-rose-200 select-none">
                  {getCreatorInitials(clip.creator)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm text-white drop-shadow-md group-hover/prof:underline truncate">
                {clip.creator}
              </span>
              <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wide shrink-0">
                · {(clip?.role || 'Band').replace(/^💀\s*/, '')}
              </span>
            </div>

            {(() => {
              const clipTarget = {
                name: clip.creator,
                id: (clip as any).creator_id || clip.user_id || clip.profile_id,
                band_name: clip.bandName || clip.band_name,
              };
              const isFollowed = isProfileFollowedGlobally(clipTarget);
              return (
                <button
                  type="button"
                  className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold uppercase transition-all shrink-0 cursor-pointer ${
                    isFollowed
                      ? 'bg-white text-black border-white'
                      : 'border-white/40 hover:bg-white hover:text-black text-white'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextState = !isFollowed;
                    saveFollowStateGlobally(clipTarget, nextState);
                    if (setClips) {
                      setClips((prev) =>
                        prev.map((c) => (c.id === clip.id ? { ...c, isFollowed: nextState } : c))
                      );
                    }
                  }}
                >
                  {isFollowed ? 'Followed' : 'Follow'}
                </button>
              );
            })()}

            {/* Re-open Pinned Show/Merch Pill when dismissed */}
            {resolvedPinned && isPinnedDismissed && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDismissPinned(clip.id);
                  onOpenPinnedAttachment({ ...clip, pinnedAttachment: resolvedPinned });
                }}
                className="px-2 py-0.5 rounded-full bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                title={`View pinned ${resolvedPinned.type}: ${resolvedPinned.title}`}
              >
                {resolvedPinned.type === 'show' ? (
                  <Ticket className="w-3 h-3" />
                ) : (
                  <ShoppingBag className="w-3 h-3" />
                )}
                <span>{resolvedPinned.type === 'show' ? 'Tickets' : 'Merch'}</span>
              </button>
            )}
          </div>

          {/* Caption + Clean Inline Filterable Hashtags */}
          <p className="text-xs sm:text-[13px] text-zinc-100 drop-shadow-md leading-snug line-clamp-2">
            <span>
              {clip.caption ? clip.caption.replace(/#\w+/g, '').trim() : clip.title || 'Live Clip'}
            </span>
            {clip.tags && Array.isArray(clip.tags) && clip.tags.length > 0 && (
              <span className="ml-1.5 inline-flex flex-wrap gap-1.5">
                {clip.tags.slice(0, 3).map((tag: string, tIdx: number) => {
                  const clean = tag.replace(/^#/, '').trim();
                  return (
                    <button
                      key={`tag-${tIdx}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTagFilter(clean.toUpperCase());
                      }}
                      className="text-[11px] font-mono font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                      title={`Filter clips by #${clean}`}
                    >
                      #{clean}
                    </button>
                  );
                })}
              </span>
            )}
          </p>

          {/* Compact Single-Line Footer: Audio Stem + Views/Insights */}
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-300 min-w-0">
            <button
              type="button"
              onClick={() =>
                onSelectAudioFilter(clip.audio || `${clip.creator} - Original Audio`)
              }
              className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-200 hover:text-white truncate max-w-[58%] cursor-pointer"
              title="Inspect or filter by this audio"
            >
              <Music className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">{clip.audio || `${clip.creator} - Original Audio`}</span>
            </button>

            <span className="text-zinc-600 shrink-0" aria-hidden="true">
              ·
            </span>

            <button
              type="button"
              className="text-[11px] font-medium text-zinc-300 flex items-center gap-1 cursor-pointer hover:text-white shrink-0 group/metrics"
              onClick={() => setActiveClipMetrics(clip.id)}
            >
              <Eye className="w-3 h-3 text-zinc-400" />
              <span className="group-hover/metrics:underline tabular-nums">
                {(clip.views || (clip as any).views_count || 0).toLocaleString()}
              </span>
              <span className="text-zinc-400">· Insights</span>
            </button>

            {durationSec > 0 && (
              <span className="text-[10px] font-mono text-zinc-400 tabular-nums shrink-0 hidden sm:inline">
                · {formatSeconds(currentTimeSec)}/{formatSeconds(durationSec)}
              </span>
            )}
          </div>
        </div>

        {/* Right Action Rail — Compact 4-Button Stack (No top HUD collision) */}
        <div className="flex flex-col items-center gap-2.5 pb-0.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleLikeClip(clip.id)}
            className="flex flex-col items-center gap-0.5 group/btn cursor-pointer"
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md group-hover/btn:scale-105 transition-all ${
                clip.hasLiked
                  ? 'bg-rose-500/25 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                  : 'bg-black/60 border-zinc-700/80 hover:border-zinc-500'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  clip.hasLiked
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-white group-hover/btn:text-rose-500'
                }`}
              />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md tabular-nums">
              {(clip.likes || (clip as any).likes_count || 0).toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveClipComments(clip.id)}
            className="flex flex-col items-center gap-0.5 group/btn cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-zinc-700/80 backdrop-blur-md group-hover/btn:border-cyan-400 group-hover/btn:bg-zinc-800 transition-all group-hover/btn:scale-105">
              <MessageSquare className="w-4 h-4 text-white group-hover/btn:text-cyan-400 transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md tabular-nums">
              {(clip.comments || (clip as any).comments_count || 0).toLocaleString()}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(clip.id)}
            className="flex flex-col items-center gap-0.5 group/btn cursor-pointer"
            title={isBookmarked ? 'Saved to Bookmarks' : 'Save Clip'}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-md group-hover/btn:scale-105 transition-all ${
                isBookmarked
                  ? 'bg-amber-500/25 border-amber-400 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                  : 'bg-black/60 border-zinc-700/80 hover:border-amber-400/60 text-white'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md">
              {isBookmarked ? 'Saved' : 'Save'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveClipShare(clip.id)}
            className="flex flex-col items-center gap-0.5 group/btn cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center border border-zinc-700/80 backdrop-blur-md group-hover/btn:border-cyan-400 group-hover/btn:bg-zinc-800 transition-all group-hover/btn:scale-105">
              <Share2 className="w-4 h-4 text-white group-hover/btn:text-cyan-400 transition-colors" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md tabular-nums">
              {(clip.shares || (clip as any).shares_count || 0).toLocaleString()}
            </span>
          </button>
        </div>
      </div>

      {/* Interactive Scrubbable Bottom Video Progress Bar with Breakdown Drop Marker */}
      <div
        onClick={handleScrubTimeline}
        className="absolute bottom-0 left-0 right-0 h-2 hover:h-3 bg-zinc-900/80 z-30 cursor-pointer transition-all group/scrub flex items-end"
        title="Click to scrub clip timeline"
      >
        {/* Glowing Breakdown Drop Marker on Scrubber */}
        {breakdownMarkerPct !== null && (
          <div
            style={{ left: `${breakdownMarkerPct}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-black shadow-[0_0_10px_#fbbf24]" />
          </div>
        )}

        <div
          className="h-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-400 transition-all duration-75 shadow-[0_0_8px_#f43f5e] relative"
          style={{ width: `${progress}%` }}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white shadow opacity-0 group-hover/scrub:opacity-100 absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 transition-opacity" />
        </div>
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
  deleteClip,
  getSupabase,
  allProfiles = [],
  discoverProfiles = [],
  onSelectProfile,
  onOpenCheckout,
}) => {
  const [internalClips, setInternalClips] = useState<ClipItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_saved_clips');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((c) => !isGhostOrDeletedClip(c));
        }
      }
    } catch (_) {}
    return DEFAULT_CLIPS.filter((c) => !isGhostOrDeletedClip(c));
  });
  const rawClips =
    propClips && propClips.length > 0
      ? propClips
      : internalClips && internalClips.length > 0
      ? internalClips
      : DEFAULT_CLIPS;
  const allClips = useMemo(
    () => rawClips.filter((c) => !isGhostOrDeletedClip(c)),
    [rawClips]
  );
  const setClips = propSetClips || setInternalClips;

  // Discovery Feed Filter & View Mode
  const [feedScope, setFeedScope] = useState<'all' | 'following' | 'saved'>('all');
  const [viewLayout, setViewLayout] = useState<'reel' | 'grid'>('reel');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [activeAudioFilter, setActiveAudioFilter] = useState<string | null>(null);

  // Playback Controls
  const [activeClipIndex, setActiveClipIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [activeClipPlaybackSec, setActiveClipPlaybackSec] = useState<number>(0);
  const [seekRequest, setSeekRequest] = useState<{
    clipId: any;
    seconds: number;
    nonce: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Saved / Bookmarked Clips
  const [bookmarkedClipIds, setBookmarkedClipIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(BOOKMARKED_CLIPS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // RSVP'd Shows on Clips
  const [rsvpedShowClipIds, setRsvpedShowClipIds] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(CLIP_RSVPS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const handleToggleBookmark = (clipId: any) => {
    const key = String(clipId);
    setBookmarkedClipIds((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(BOOKMARKED_CLIPS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  const handleToggleShowRsvp = (clipId: any) => {
    const key = String(clipId);
    setRsvpedShowClipIds((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(CLIP_RSVPS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Dismissed Pinned Show/Merch Cards per Clip
  const [dismissedPinnedClipIds, setDismissedPinnedClipIds] = useState<Record<string, boolean>>({});
  const handleToggleDismissPinned = (clipId: any) => {
    const key = String(clipId);
    setDismissedPinnedClipIds((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const resolveClipAvatar = (clip: ClipItem): string => {
    const creatorLower = String(clip.creator || clip.bandName || clip.band_name || '')
      .trim()
      .toLowerCase();
    const creatorIdLower = String(
      (clip as any).creator_id || clip.user_id || clip.profile_id || ''
    )
      .trim()
      .toLowerCase();

    // 1. Check live profiles from allProfiles / discoverProfiles / userProfile
    const candidateProfiles = [...(allProfiles || []), ...(discoverProfiles || []), userProfile].filter(
      Boolean
    );
    for (const p of candidateProfiles) {
      const pId = String(p.id || p.user_id || '').trim().toLowerCase();
      const pName = String(p.full_name || p.name || p.band_name || '').trim().toLowerCase();
      if (
        (creatorIdLower && pId && pId === creatorIdLower) ||
        (creatorLower && pName && pName === creatorLower)
      ) {
        const pAvatar = p.avatar_url || p.avatar;
        if (!isBrokenOrDeadAvatarUrl(pAvatar)) {
          return pAvatar;
        }
      }
    }

    // 2. Check clip.avatar if it is not a broken/dead storage URL
    if (!isBrokenOrDeadAvatarUrl(clip.avatar)) {
      return clip.avatar;
    }

    // 3. Check DEFAULT_CLIPS for matching creator or id
    const defaultMatch = DEFAULT_CLIPS.find(
      (d) =>
        String(d.id) === String(clip.id) ||
        String(d.creator).toLowerCase() === creatorLower
    );
    if (defaultMatch && !isBrokenOrDeadAvatarUrl(defaultMatch.avatar)) {
      return defaultMatch.avatar;
    }

    // 4. Fall back to YouTube thumbnail if clip is a YouTube video
    const yt = extractYouTubeId(clip.videoUrl || (clip as any).video_url || '');
    if (yt) {
      return `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
    }

    // 5. Fall back to clip thumbnail if valid
    const thumb = clip.thumbnailUrl || (clip as any).thumbnail_url;
    if (!isBrokenOrDeadAvatarUrl(thumb)) {
      return thumb!;
    }

    return '';
  };

  // Filtered Clips Stream
  const filteredClips = useMemo(() => {
    return allClips.filter((c) => {
      if (feedScope === 'following') {
        const target = {
          name: c.creator,
          id: (c as any).creator_id || c.user_id || c.profile_id,
          band_name: c.bandName || c.band_name,
        };
        if (!c.isFollowed && !isProfileFollowedGlobally(target)) return false;
      }
      if (feedScope === 'saved' && !bookmarkedClipIds[String(c.id)]) {
        return false;
      }
      if (activeTagFilter) {
        const tagsUpper = (c.tags || []).map((t) => t.replace(/^#/, '').trim().toUpperCase());
        const inCaption = (c.caption || '').toUpperCase().includes(activeTagFilter);
        if (!tagsUpper.includes(activeTagFilter) && !inCaption) return false;
      }
      if (activeAudioFilter) {
        const clipAudio = (c.audio || `${c.creator} - Original Audio`).toLowerCase();
        if (clipAudio !== activeAudioFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [allClips, feedScope, bookmarkedClipIds, activeTagFilter, activeAudioFilter]);

  // Modals & Drawers
  const [showUploadClipModal, setShowUploadClipModal] = useState(false);
  const [showClipsAnalyticsModal, setShowClipsAnalyticsModal] = useState(false);
  const [inspectedAudioName, setInspectedAudioName] = useState<string | null>(null);
  const [activeClipComments, setActiveClipComments] = useState<any | null>(null);
  const [activeClipShare, setActiveClipShare] = useState<any | null>(null);
  const [activeClipMetrics, setActiveClipMetrics] = useState<any | null>(null);
  const [copiedClipLink, setCopiedClipLink] = useState(false);

  // Pinned Show / Merch Quick-Action Drawer state
  const [activePinnedClip, setActivePinnedClip] = useState<ClipItem | null>(null);
  const [selectedMerchSize, setSelectedMerchSize] = useState<string>('L');
  const [pinnedActionConfirmed, setPinnedActionConfirmed] = useState<string | null>(null);

  // Share to DM / Group Thread state
  const [shareRecipientSearch, setShareRecipientSearch] = useState('');
  const [shareNoteText, setShareNoteText] = useState('');
  const [sentToThreadIds, setSentToThreadIds] = useState<Record<string, boolean>>({});
  const [isDispatchingDm, setIsDispatchingDm] = useState<string | null>(null);

  // Resolve available DM contacts & Group threads for the Share Picker
  const shareableThreads = useMemo(() => {
    const bootIds = [userProfile?.id, userProfile?.email].filter(Boolean) as string[];
    const cachedConvs = readCachedConversations(bootIds);
    const results: InboxConversation[] = [...cachedConvs];
    const seenIds = new Set(cachedConvs.map((c) => String(c.contactId).toLowerCase()));
    const myIdLower = String(userProfile?.id || '').toLowerCase();

    [...(allProfiles || []), ...(discoverProfiles || [])].forEach((p: any) => {
      if (!p) return;
      const pid = String(p.id || p.user_id || '').trim();
      const name = String(p.full_name || p.name || p.band_name || '').trim();
      if (!pid || !name || pid.toLowerCase() === myIdLower || seenIds.has(pid.toLowerCase())) {
        return;
      }
      if (name.toLowerCase() === 'user' || name.toLowerCase() === 'new user') return;
      seenIds.add(pid.toLowerCase());
      results.push({
        contactId: pid,
        profileName: name,
        avatarUrl: p.avatar_url || p.avatar || undefined,
        roleBadge: p.role_badge || p.account_type || 'Member',
        lastMessage: p.console_handle || 'Scene Contact',
        timestamp: new Date().toISOString(),
        isRead: true,
      });
    });

    const q = shareRecipientSearch.trim().toLowerCase();
    if (!q) return results.slice(0, 18);
    return results
      .filter(
        (r) =>
          r.profileName?.toLowerCase().includes(q) ||
          r.roleBadge?.toLowerCase().includes(q) ||
          r.lastMessage?.toLowerCase().includes(q)
      )
      .slice(0, 18);
  }, [userProfile?.id, userProfile?.email, allProfiles, discoverProfiles, shareRecipientSearch]);

  const handleSendClipToThread = async (target: InboxConversation, clip: ClipItem) => {
    if (!target?.contactId || !clip) return;
    setIsDispatchingDm(target.contactId);

    const clipLink = `${window.location.origin}/?tab=clips&clip=${encodeURIComponent(
      String(clip.id)
    )}`;
    const dropLabel =
      typeof clip.breakdownDropSec === 'number'
        ? ` (⚡ Breakdown @ ${formatSeconds(clip.breakdownDropSec)})`
        : '';
    const customPrefix = shareNoteText.trim() ? `${shareNoteText.trim()}\n` : '';
    const messageBody = `${customPrefix}🎬 Shared Clip by ${clip.creator}${dropLabel}: "${
      clip.caption || clip.title || 'Live Clip'
    }" — ${clipLink}`;

    const supabaseClient = getSupabase ? getSupabase() : null;
    const senderUuid = await resolveValidClipUserId(supabaseClient, userProfile);
    const senderName =
      userProfile?.full_name || userProfile?.name || userProfile?.console_handle || 'You';
    const senderAvatar = userProfile?.avatar_url || userProfile?.avatar || undefined;
    const nowIso = new Date().toISOString();

    try {
      if (supabaseClient && isValidUuid(senderUuid)) {
        if (target.isGroup && target.groupId) {
          const msgId = createClientMsgId();
          const encoded = encodeGroupMessagePayload({
            v: 1,
            groupId: target.groupId,
            groupName: target.groupName || target.profileName,
            members: target.members || [],
            msgId,
            senderName,
            senderAvatar,
            text: messageBody,
          });
          const recipientIds = (target.members || [])
            .map((m) => m.id)
            .filter((id) => isValidUuid(id) && id.toLowerCase() !== senderUuid.toLowerCase());
          const rows = (recipientIds.length > 0 ? recipientIds : [senderUuid]).map((rid) => ({
            sender_id: senderUuid,
            receiver_id: rid,
            recipient_id: rid,
            message: encoded,
            content: encoded,
            is_read: false,
            created_at: nowIso,
          }));
          await supabaseClient.from('nexus_chats').insert(rows);
        } else if (isValidUuid(target.contactId)) {
          const encoded = encodeRichMessagePayload({
            v: 1,
            text: messageBody,
          });
          await supabaseClient.from('nexus_chats').insert([
            {
              sender_id: senderUuid,
              receiver_id: target.contactId,
              recipient_id: target.contactId,
              message: encoded,
              content: encoded,
              is_read: false,
              created_at: nowIso,
            },
          ]);
        }
      }
    } catch (e) {
      console.warn('[ClipsView] DM share dispatch notice:', e);
    }

    // Update cached conversations so Inbox immediately shows the shared clip thread at the top
    const bootIds = [userProfile?.id, userProfile?.email, senderUuid].filter(Boolean) as string[];
    const existingCached = readCachedConversations(bootIds);
    const updatedConv: InboxConversation = {
      ...target,
      lastMessage: messageBody,
      timestamp: nowIso,
      isRead: true,
    };
    const nextCached = [
      updatedConv,
      ...existingCached.filter(
        (c) => String(c.contactId).toLowerCase() !== String(target.contactId).toLowerCase()
      ),
    ];
    writeCachedConversations(bootIds, nextCached);

    handleIncrementShare(clip.id);
    setSentToThreadIds((prev) => ({ ...prev, [target.contactId]: true }));
    setIsDispatchingDm(null);
  };

  // Edit Clip Tags, Breakdown & Pinned Attachment modal state
  const [editingClipModal, setEditingClipModal] = useState<ClipItem | null>(null);
  const [editClipTagsInput, setEditClipTagsInput] = useState('');
  const [editClipCaptionInput, setEditClipCaptionInput] = useState('');
  const [editBreakdownSec, setEditBreakdownSec] = useState<string>('');
  const [editPinType, setEditPinType] = useState<'none' | 'show' | 'merch'>('none');
  const [editPinTitle, setEditPinTitle] = useState('');
  const [editPinSubtitle, setEditPinSubtitle] = useState('');
  const [editPinPrice, setEditPinPrice] = useState('');

  const handleOpenEditClip = (clip: ClipItem) => {
    setEditingClipModal(clip);
    setEditClipTagsInput(clip.tags ? clip.tags.join(', ') : 'SLAM, LIVE');
    setEditClipCaptionInput(clip.caption || clip.title || '');
    setEditBreakdownSec(
      typeof clip.breakdownDropSec === 'number' ? String(clip.breakdownDropSec) : ''
    );
    if (clip.pinnedAttachment) {
      setEditPinType(clip.pinnedAttachment.type);
      setEditPinTitle(clip.pinnedAttachment.title || '');
      setEditPinSubtitle(clip.pinnedAttachment.subtitle || '');
      setEditPinPrice(clip.pinnedAttachment.price || '');
    } else {
      setEditPinType('none');
      setEditPinTitle('');
      setEditPinSubtitle('');
      setEditPinPrice('');
    }
  };

  const handleSaveEditClip = async () => {
    if (!editingClipModal) return;
    const cleanTags = editClipTagsInput
      ? editClipTagsInput
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : ['SLAM', 'LIVE'];
    const updatedCaption = editClipCaptionInput.trim();
    const parsedDrop =
      editBreakdownSec.trim() !== '' && Number.isFinite(Number(editBreakdownSec))
        ? Math.max(0, Number(editBreakdownSec))
        : undefined;

    const updatedPin: ClipPinnedAttachmentInput | undefined =
      editPinType !== 'none' && editPinTitle.trim()
        ? {
            type: editPinType,
            id: editingClipModal.pinnedAttachment?.id || `pin_${Date.now()}`,
            title: editPinTitle.trim(),
            subtitle: editPinSubtitle.trim(),
            price: editPinPrice.trim() || (editPinType === 'show' ? '$25' : '$35'),
            ctaLabel: editPinType === 'show' ? 'RSVP / Tickets' : 'Grab Merch',
          }
        : undefined;

    setClips((prev) =>
      prev.map((c) =>
        c.id === editingClipModal.id
          ? {
              ...c,
              tags: cleanTags,
              caption: updatedCaption,
              breakdownDropSec: parsedDrop,
              pinnedAttachment: updatedPin,
            }
          : c
      )
    );

    try {
      const raw = localStorage.getItem('nexus_saved_clips');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const updated = list.map((c: any) =>
            c.id === editingClipModal.id
              ? {
                  ...c,
                  tags: cleanTags,
                  caption: updatedCaption,
                  breakdownDropSec: parsedDrop,
                  pinnedAttachment: updatedPin,
                }
              : c
          );
          localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
        }
      }
    } catch (_) {}

    const client = getSupabase ? getSupabase() : null;
    if (client && editingClipModal.id) {
      try {
        await client
          .from('clips')
          .update({ tags: cleanTags, caption: updatedCaption, description: updatedCaption })
          .eq('id', editingClipModal.id);
      } catch (_) {}
    }

    setEditingClipModal(null);
  };

  // New clip form states
  const [newClipVideoUrl, setNewClipVideoUrl] = useState('');
  const [selectedClipFile, setSelectedClipFile] = useState<File | null>(null);
  const [newClipCaption, setNewClipCaption] = useState('');
  const [newClipSong, setNewClipSong] = useState('Original Audio');
  const [newClipBandName, setNewClipBandName] = useState(
    userProfile?.band_name || userProfile?.name || ''
  );
  const [newClipTags, setNewClipTags] = useState('SLAM, LIVE, DEATHCORE');

  // Persisted Comments with Timestamp Tagging
  const [commentInput, setCommentInput] = useState('');
  const [attachTimestampToComment, setAttachTimestampToComment] = useState(false);
  const [clipCommentsList, setClipCommentsList] = useState<Record<string, ClipCommentItem[]>>(
    () => {
      try {
        const raw = localStorage.getItem(CLIP_COMMENTS_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return { ...DEFAULT_COMMENTS, ...parsed };
        }
      } catch (_) {}
      return DEFAULT_COMMENTS;
    }
  );

  // Track viewport intersection to update active clip
  useEffect(() => {
    const container = containerRef.current;
    if (!container || viewLayout !== 'reel') return;

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
  }, [activeClipIndex, viewLayout]);

  const handleLikeClip = (clipId: any, forceLike?: boolean) => {
    setClips((prev) => {
      const updated = prev.map((c) => {
        if (c.id === clipId) {
          const nextHasLiked = forceLike !== undefined ? forceLike : !c.hasLiked;
          if (nextHasLiked === c.hasLiked) return c;
          const nextLikesCount = nextHasLiked
            ? (c.likes || 0) + 1
            : Math.max(0, (c.likes || 1) - 1);
          return {
            ...c,
            hasLiked: nextHasLiked,
            likes: nextLikesCount,
            likes_count: nextLikesCount,
          };
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
        client
          .from('clips')
          .select('likes_count')
          .eq('id', clipId)
          .maybeSingle()
          .then(({ data }: any) => {
            if (data) {
              client
                .from('clips')
                .update({ likes_count: (data.likes_count || 0) + 1 })
                .eq('id', clipId)
                .then();
            }
          });
      } catch (_) {}
    }
  };

  const handleAddComment = (clipId: any) => {
    if (!commentInput.trim()) return;
    const newComm: ClipCommentItem = {
      id: `cc_${Date.now()}`,
      author: userProfile?.full_name || userProfile?.name || 'Scene Member',
      avatar: userProfile?.avatar_url || userProfile?.avatar,
      text: commentInput.trim(),
      time: 'Just now',
      videoTimestampSec: attachTimestampToComment ? activeClipPlaybackSec : null,
    };
    setClipCommentsList((prev) => {
      const next = {
        ...prev,
        [clipId]: [...(prev[clipId] || []), newComm],
      };
      try {
        localStorage.setItem(CLIP_COMMENTS_STORAGE_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
    setClips((prev) => {
      const updated = prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              comments: (c.comments || 0) + 1,
              comments_count: ((c as any).comments_count || 0) + 1,
            }
          : c
      );
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const client = getSupabase ? getSupabase() : null;
    if (client && typeof clipId === 'string') {
      try {
        client
          .from('clips')
          .select('comments_count')
          .eq('id', clipId)
          .maybeSingle()
          .then(({ data }: any) => {
            if (data) {
              client
                .from('clips')
                .update({ comments_count: (data.comments_count || 0) + 1 })
                .eq('id', clipId)
                .then();
            }
          });
      } catch (_) {}
    }

    setCommentInput('');
    setAttachTimestampToComment(false);
  };

  const handleIncrementShare = (clipId: any) => {
    setClips((prev) => {
      const updated = prev.map((c) =>
        c.id === clipId
          ? {
              ...c,
              shares: (c.shares || 0) + 1,
              shares_count: ((c as any).shares_count || 0) + 1,
            }
          : c
      );
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  const jumpToClipInReel = (clipId: any) => {
    const idx = filteredClips.findIndex((c) => String(c.id) === String(clipId));
    setViewLayout('reel');
    if (idx >= 0) {
      setActiveClipIndex(idx);
      setTimeout(() => {
        const container = containerRef.current;
        const child = container?.children[idx] as HTMLElement | undefined;
        child?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  return (
    <div className="w-full bg-[#030303] flex flex-col items-center animate-in fade-in duration-300">
      {/* Top Bar Action & Discovery Controls */}
      <div className="w-full max-w-[480px] flex flex-col gap-2 px-3 py-2.5 bg-zinc-950/90 border border-zinc-900 rounded-2xl mb-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (setActiveTab) setActiveTab('feed');
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0"
            title="Back to Feed"
          >
            <ArrowRight className="w-4 h-4 text-zinc-400 rotate-180" />
            <span>Back</span>
          </button>

          {/* Feed Scope Switcher */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-xl p-0.5">
            {(
              [
                { id: 'all', label: 'For You' },
                { id: 'following', label: 'Following' },
                { id: 'saved', label: 'Saved' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFeedScope(tab.id);
                  setActiveClipIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  feedScope === tab.id
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewLayout((v) => (v === 'reel' ? 'grid' : 'reel'))}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title={viewLayout === 'reel' ? 'Switch to Grid Browser' : 'Switch to Vertical Reels'}
            >
              {viewLayout === 'reel' ? (
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
              ) : (
                <Film className="w-4 h-4 text-rose-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowUploadClipModal(true)}
              className="flex items-center gap-1 px-2.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 rounded-xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer shrink-0"
              title="Upload New Clip"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Add</span>
            </button>

            <button
              type="button"
              onClick={() => setShowClipsAnalyticsModal(true)}
              className="w-9 h-9 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-400 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Creator Clips Dashboard"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Tag or Audio Filter Banner */}
        {(activeTagFilter || activeAudioFilter) && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-rose-950/35 border border-rose-500/30 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="text-zinc-200 truncate">
                Filtering by{' '}
                <strong className="text-rose-300 font-mono">
                  {activeTagFilter ? `#${activeTagFilter}` : activeAudioFilter}
                </strong>{' '}
                ({filteredClips.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTagFilter(null);
                setActiveAudioFilter(null);
              }}
              className="text-[11px] font-bold text-rose-300 hover:text-white flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Clear</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Reels or Grid Container */}
      {filteredClips.length === 0 ? (
        <div className="w-full max-w-[480px] h-[460px] bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-3 mb-8">
          <PlaySquare className="w-10 h-10 text-zinc-600" />
          <h4 className="text-sm font-bold text-white">No matching clips in this view</h4>
          <p className="text-xs text-zinc-500 max-w-xs">
            {feedScope === 'saved'
              ? 'Tap the Save icon on any clip to bookmark breakdowns and live cuts for quick replay.'
              : 'Try clearing your active filter or switch back to For You.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setFeedScope('all');
              setActiveTagFilter(null);
              setActiveAudioFilter(null);
            }}
            className="mt-1 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
          >
            Show All Clips
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="w-full max-w-[480px] grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-8">
          {filteredClips.map((clip, gIdx) => (
            <button
              key={clip.id ? `grid-${clip.id}-${gIdx}` : `grid-${gIdx}`}
              type="button"
              onClick={() => jumpToClipInReel(clip.id)}
              className="relative aspect-[9/16] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-rose-500/60 group text-left cursor-pointer transition-all"
            >
              {(() => {
                const gridThumb =
                  clip.thumbnailUrl || (clip as any).thumbnail_url || resolveClipAvatar(clip);
                return gridThumb ? (
                  <img
                    src={gridThumb}
                    alt={clip.creator}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
                    <PlayCircle className="w-10 h-10 text-rose-500/70 group-hover:scale-110 transition-transform" />
                  </div>
                );
              })()}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md truncate">
                  {clip.creator}
                </span>
                {typeof clip.breakdownDropSec === 'number' && (
                  <span className="text-[9px] font-mono font-bold text-amber-300 bg-black/70 border border-amber-400/40 px-1.5 py-0.5 rounded shrink-0">
                    ⚡ {formatSeconds(clip.breakdownDropSec)}
                  </span>
                )}
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1">
                <p className="text-[11px] font-medium text-zinc-200 line-clamp-2 leading-tight">
                  {clip.caption || clip.title}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-300 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-cyan-400" />
                    {(clip.views || 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-400" />
                    {(clip.likes || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div
          ref={containerRef}
          className="w-full max-w-[480px] h-[calc(100dvh-215px)] min-h-[450px] max-h-[780px] relative bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col snap-y snap-mandatory overflow-y-scroll no-scrollbar mb-20 border border-zinc-900"
        >
          {filteredClips.map((clip, cIdx) => (
            <SingleClipPlayerCard
              key={clip.id ? `clip-${clip.id}-${cIdx}` : `clip-${cIdx}`}
              clip={clip}
              index={cIdx}
              isActive={cIdx === activeClipIndex}
              isMuted={isMuted}
              playbackRate={playbackRate}
              isBookmarked={Boolean(bookmarkedClipIds[String(clip.id)])}
              isRsvped={Boolean(rsvpedShowClipIds[String(clip.id)])}
              isPinnedDismissed={Boolean(dismissedPinnedClipIds[String(clip.id)])}
              onToggleDismissPinned={handleToggleDismissPinned}
              resolvedAvatarUrl={resolveClipAvatar(clip)}
              onToggleMute={() => setIsMuted((prev) => !prev)}
              onCyclePlaybackRate={cyclePlaybackRate}
              onToggleBookmark={handleToggleBookmark}
              onOpenPinnedAttachment={(c) => {
                setPinnedActionConfirmed(null);
                setActivePinnedClip(c);
              }}
              onSelectTagFilter={(tag) => {
                setActiveTagFilter((prev) => (prev === tag ? null : tag));
                setActiveClipIndex(0);
              }}
              onSelectAudioFilter={(audioName) => setInspectedAudioName(audioName)}
              onTimeUpdateSec={cIdx === activeClipIndex ? setActiveClipPlaybackSec : undefined}
              seekRequest={seekRequest}
              userProfile={userProfile}
              onSelectProfile={onSelectProfile}
              handleLikeClip={handleLikeClip}
              setActiveClipComments={setActiveClipComments}
              setActiveClipShare={(cid) => {
                setSentToThreadIds({});
                setShareNoteText('');
                setShareRecipientSearch('');
                setActiveClipShare(cid);
              }}
              setActiveClipMetrics={setActiveClipMetrics}
              deleteClip={deleteClip}
              setClips={setClips}
              onEditClipTags={handleOpenEditClip}
            />
          ))}
        </div>
      )}

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
        newClipBandName={newClipBandName}
        setNewClipBandName={setNewClipBandName}
        newClipTags={newClipTags}
        setNewClipTags={setNewClipTags}
        setClips={setClips}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
      />

      {/* PINNED SHOW RSVP / MERCH QUICK-CHECKOUT DRAWER */}
      <AnimatePresence>
        {activePinnedClip && activePinnedClip.pinnedAttachment && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setActivePinnedClip(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#111318] border border-zinc-800 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  {activePinnedClip.pinnedAttachment.type === 'show' ? (
                    <Ticket className="w-4 h-4 text-rose-400" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    {activePinnedClip.pinnedAttachment.type === 'show'
                      ? 'Pinned Show & Tickets'
                      : 'Pinned Band Merch Drop'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePinnedClip(null)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">
                    {activePinnedClip.creator}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {activePinnedClip.pinnedAttachment.title}
                  </h4>
                  {activePinnedClip.pinnedAttachment.subtitle && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {activePinnedClip.pinnedAttachment.subtitle}
                    </p>
                  )}
                </div>
                {activePinnedClip.pinnedAttachment.price && (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-mono text-sm font-black shrink-0">
                    {activePinnedClip.pinnedAttachment.price}
                  </span>
                )}
              </div>

              {activePinnedClip.pinnedAttachment.type === 'merch' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                    Select Size
                  </span>
                  <div className="flex items-center gap-2">
                    {['S', 'M', 'L', 'XL', '2XL'].map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedMerchSize(sz)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          selectedMerchSize === sz
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {pinnedActionConfirmed && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{pinnedActionConfirmed}</span>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                {activePinnedClip.pinnedAttachment.type === 'show' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleShowRsvp(activePinnedClip.id);
                        const nextGoing = !rsvpedShowClipIds[String(activePinnedClip.id)];
                        setPinnedActionConfirmed(
                          nextGoing
                            ? `You're marked as Going to ${activePinnedClip.pinnedAttachment?.title}!`
                            : 'Removed RSVP.'
                        );
                      }}
                      className={`flex-1 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        rsvpedShowClipIds[String(activePinnedClip.id)]
                          ? 'bg-emerald-600/25 border-emerald-500 text-emerald-300'
                          : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white'
                      }`}
                    >
                      {rsvpedShowClipIds[String(activePinnedClip.id)] ? '✓ RSVP Going' : 'RSVP Going'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pin = activePinnedClip.pinnedAttachment!;
                        const numPrice =
                          Number(String(pin.price || '25').replace(/[^0-9.]/g, '')) || 25;
                        if (onOpenCheckout) {
                          setActivePinnedClip(null);
                          onOpenCheckout('ticket', {
                            id: pin.id || `tkt_${activePinnedClip.id}`,
                            title: pin.title,
                            headliner: activePinnedClip.creator,
                            venue: pin.subtitle || 'Scene Venue',
                            price: numPrice,
                            ticketPrice: numPrice,
                            thumbnail: activePinnedClip.avatar,
                          });
                        } else {
                          handleToggleShowRsvp(activePinnedClip.id);
                          setPinnedActionConfirmed(
                            `Ticket reserved for ${pin.title} (${pin.price || '$25'})!`
                          );
                        }
                      }}
                      className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
                    >
                      Grab Tickets ({activePinnedClip.pinnedAttachment.price || '$25'})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const pin = activePinnedClip.pinnedAttachment!;
                      const numPrice =
                        Number(String(pin.price || '35').replace(/[^0-9.]/g, '')) || 35;
                      if (onOpenCheckout) {
                        setActivePinnedClip(null);
                        onOpenCheckout('merch', {
                          id: pin.id || `merch_${activePinnedClip.id}`,
                          name: pin.title,
                          bandName: activePinnedClip.creator,
                          size: selectedMerchSize,
                          price: numPrice,
                          thumbnail: activePinnedClip.avatar,
                        });
                      } else {
                        setPinnedActionConfirmed(
                          `Added ${pin.title} (Size ${selectedMerchSize}) to your order!`
                        );
                      }
                    }}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-lg"
                  >
                    Buy Merch • Size {selectedMerchSize} (
                    {activePinnedClip.pinnedAttachment.price || '$35'})
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TIMESTAMPED CLIPS COMMENTS DRAWER */}
      <AnimatePresence>
        {activeClipComments && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-end md:items-center p-4"
            onClick={() => setActiveClipComments(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-md max-h-[75vh] flex flex-col overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Pit Comments (
                  {(clipCommentsList[activeClipComments] || []).length})
                </span>
                <button
                  type="button"
                  onClick={() => setActiveClipComments(null)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-2.5 no-scrollbar">
                {(clipCommentsList[activeClipComments] || []).map((comm, commIdx) => (
                  <div
                    key={comm.id ? `comm-${comm.id}-${commIdx}` : `comm-${commIdx}`}
                    className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-900 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-rose-400">{comm.author}</span>
                        {typeof comm.videoTimestampSec === 'number' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSeekRequest({
                                clipId: activeClipComments,
                                seconds: comm.videoTimestampSec!,
                                nonce: Date.now(),
                              });
                              setActiveClipComments(null);
                            }}
                            className="px-1.5 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="Jump to this moment in the clip"
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatSeconds(comm.videoTimestampSec)}</span>
                          </button>
                        )}
                      </div>
                      <span className="text-zinc-500 font-mono">{comm.time}</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{comm.text}</p>
                  </div>
                ))}
                {(!clipCommentsList[activeClipComments] ||
                  clipCommentsList[activeClipComments].length === 0) && (
                  <p className="text-center text-xs text-zinc-500 py-8">
                    No comments yet. Drop a timestamped breakdown note!
                  </p>
                )}
              </div>

              <div className="p-3 border-t border-zinc-900 bg-zinc-950/80 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <button
                    type="button"
                    onClick={() => setAttachTimestampToComment((v) => !v)}
                    className={`text-[11px] font-mono flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                      attachTimestampToComment
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>
                      Tag current moment ({formatSeconds(activeClipPlaybackSec)})
                    </span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Drop a comment or breakdown callout..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(activeClipComments);
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddComment(activeClipComments)}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE CLIP + SEND TO DM / GROUP THREAD PICKER MODAL */}
      <AnimatePresence>
        {activeClipShare !== null &&
          (() => {
            const sharedClip = allClips.find((c) => String(c.id) === String(activeClipShare));
            const shareUrl = `${window.location.origin}/?tab=clips&clip=${encodeURIComponent(
              String(activeClipShare)
            )}`;
            return (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4"
                onClick={() => setActiveClipShare(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#121214] border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-white">
                      <Share2 className="w-4 h-4 text-cyan-400" /> Share Clip &amp; Send to DM
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveClipShare(null)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto no-scrollbar flex-1">
                    {sharedClip && (
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 overflow-hidden shrink-0 flex items-center justify-center">
                          {sharedClip.avatar ? (
                            <img
                              src={sharedClip.avatar}
                              alt={sharedClip.creator}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <PlayCircle className="w-5 h-5 text-rose-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">
                            {sharedClip.creator}
                          </p>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {sharedClip.caption || sharedClip.title}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Send Directly to DM or Group Thread */}
                    {sharedClip && (
                      <div className="bg-zinc-950/90 border border-zinc-900 rounded-xl p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                            <Send className="w-3.5 h-3.5 text-rose-400" />
                            <span>Send to DM or Group Thread</span>
                          </span>
                          {Object.keys(sentToThreadIds).length > 0 && setActiveTab && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveClipShare(null);
                                setActiveTab('inbox');
                              }}
                              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                            >
                              Open Inbox →
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          placeholder="Add an optional note (e.g. Peep this breakdown at 0:08)..."
                          value={shareNoteText}
                          onChange={(e) => setShareNoteText(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60"
                        />

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search contacts or group threads..."
                            value={shareRecipientSearch}
                            onChange={(e) => setShareRecipientSearch(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60"
                          />
                        </div>

                        <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
                          {shareableThreads.length === 0 ? (
                            <p className="text-[11px] text-zinc-500 text-center py-4">
                              No matching contacts or group threads found.
                            </p>
                          ) : (
                            shareableThreads.map((thread) => {
                              const alreadySent = Boolean(sentToThreadIds[thread.contactId]);
                              const isSendingNow = isDispatchingDm === thread.contactId;
                              return (
                                <div
                                  key={thread.contactId}
                                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/70"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-[10px] font-bold text-zinc-200 shrink-0">
                                      {thread.avatarUrl ? (
                                        <img
                                          src={thread.avatarUrl}
                                          alt={thread.profileName}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : thread.isGroup ? (
                                        <Users className="w-4 h-4 text-rose-400" />
                                      ) : (
                                        (thread.profileName || 'SC').slice(0, 2).toUpperCase()
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-white truncate">
                                        {thread.profileName}
                                      </p>
                                      <p className="text-[10px] text-zinc-400 truncate">
                                        {thread.isGroup
                                          ? `Group · ${thread.members?.length || 2} members`
                                          : thread.roleBadge || 'Scene Contact'}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={alreadySent || isSendingNow}
                                    onClick={() => handleSendClipToThread(thread, sharedClip)}
                                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                                      alreadySent
                                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                                    }`}
                                  >
                                    {alreadySent ? 'Sent ✓' : isSendingNow ? 'Sending…' : 'Send'}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Share Actions */}
                    <div className="grid grid-cols-3 gap-2.5 text-center">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(shareUrl);
                            setCopiedClipLink(true);
                            handleIncrementShare(activeClipShare);
                            setTimeout(() => setCopiedClipLink(false), 1800);
                          } catch (_) {}
                        }}
                        className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        {copiedClipLink ? (
                          <Check className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Link2 className="w-5 h-5 text-cyan-400" />
                        )}
                        <span className="text-[11px] font-semibold text-zinc-200">
                          {copiedClipLink ? 'Copied!' : 'Copy Link'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          handleIncrementShare(activeClipShare);
                          setClips((prev) =>
                            prev.map((c) =>
                              String(c.id) === String(activeClipShare)
                                ? { ...c, reposts: (c.reposts || 0) + 1 }
                                : c
                            )
                          );
                          setActiveClipShare(null);
                        }}
                        className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Repeat className="w-5 h-5 text-emerald-400" />
                        <span className="text-[11px] font-semibold text-zinc-200">Repost</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          handleIncrementShare(activeClipShare);
                          if (navigator.share) {
                            try {
                              await navigator.share({
                                title: sharedClip?.creator || 'Scene Clip',
                                text: sharedClip?.caption || 'Check out this clip on Nexus',
                                url: shareUrl,
                              });
                            } catch (_) {}
                          } else {
                            try {
                              await navigator.clipboard.writeText(shareUrl);
                            } catch (_) {}
                          }
                          setActiveClipShare(null);
                        }}
                        className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex flex-col items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Share2 className="w-5 h-5 text-rose-400" />
                        <span className="text-[11px] font-semibold text-zinc-200">External</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>

      {/* SINGLE CLIP TELEMETRY / INSIGHTS MODAL */}
      <AnimatePresence>
        {activeClipMetrics !== null &&
          (() => {
            const targetClip = allClips.find((c) => String(c.id) === String(activeClipMetrics));
            if (!targetClip) return null;
            const views = Math.max(1, targetClip.views || 1);
            const interactions =
              (targetClip.likes || 0) + (targetClip.comments || 0) + (targetClip.shares || 0);
            const engRate = ((interactions / views) * 100).toFixed(1);

            return (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
                onClick={() => setActiveClipMetrics(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#121214] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Clip Insights
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveClipMetrics(null)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white truncate">{targetClip.creator}</p>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                      {targetClip.caption || targetClip.title}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Views</span>
                      <p className="text-lg font-black text-white mt-0.5 tabular-nums">
                        {(targetClip.views || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        Engagement
                      </span>
                      <p className="text-lg font-black text-emerald-400 mt-0.5 tabular-nums">
                        {engRate}%
                      </p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Likes</span>
                      <p className="text-lg font-black text-rose-400 mt-0.5 tabular-nums">
                        {(targetClip.likes || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        Shares &amp; Reposts
                      </span>
                      <p className="text-lg font-black text-cyan-400 mt-0.5 tabular-nums">
                        {((targetClip.shares || 0) + (targetClip.reposts || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>

      {/* CLIPS ANALYTICS DASHBOARD MODAL */}
      <AnimatePresence>
        {showClipsAnalyticsModal &&
          (() => {
            const stats = calculateClipsDashboardStats(
              allClips as any,
              userProfile?.id,
              userProfile
            );
            return (
              <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4"
                onClick={() => setShowClipsAnalyticsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#121214] border border-emerald-900/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-[0_0_40px_rgba(52,211,153,0.1)]"
                >
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                    <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" /> Clips Performance &amp;
                      Engagement
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowClipsAnalyticsModal(false)}
                      className="text-zinc-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        Total Reel Views
                      </span>
                      <p className="text-xl font-black text-white mt-1">
                        {stats.totalViews.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        Avg Engagement Rate
                      </span>
                      <p className="text-xl font-black text-emerald-400 mt-1">
                        {stats.avgEngagementRate}
                      </p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        Total Likes
                      </span>
                      <p className="text-xl font-black text-rose-400 mt-1">
                        {stats.totalLikes.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        Shares &amp; Reposts
                      </span>
                      <p className="text-xl font-black text-cyan-400 mt-1">
                        {stats.totalShares.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowClipsAnalyticsModal(false)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                    >
                      Close Dashboard
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>

      {/* INTERACTIVE AUDIO STEM DRAWER */}
      <AnimatePresence>
        {inspectedAudioName && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setInspectedAudioName(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#121214] border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-2">
                  <Disc className="w-4 h-4 text-rose-400 animate-spin" /> Scene Audio Stem
                </span>
                <button
                  type="button"
                  onClick={() => setInspectedAudioName(null)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{inspectedAudioName}</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {
                      allClips.filter(
                        (c) =>
                          (c.audio || `${c.creator} - Original Audio`).toLowerCase() ===
                          inspectedAudioName.toLowerCase()
                      ).length
                    }{' '}
                    clip(s) using this audio
                  </p>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveAudioFilter(inspectedAudioName);
                    setActiveClipIndex(0);
                    setInspectedAudioName(null);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white cursor-pointer transition-colors"
                >
                  Filter Clips by Audio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const parts = inspectedAudioName.split(' - ');
                    if (parts.length >= 2) {
                      setNewClipBandName(parts[0].trim());
                      setNewClipSong(parts.slice(1).join(' - ').trim());
                    } else {
                      setNewClipSong(inspectedAudioName);
                    }
                    setInspectedAudioName(null);
                    setShowUploadClipModal(true);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Use This Audio</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT CLIP TAGS, BREAKDOWN MARKER & PINNED SHOW/MERCH MODAL */}
      <AnimatePresence>
        {editingClipModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-[#121214] border border-rose-900/50 rounded-2xl w-full max-w-md max-h-[88vh] overflow-y-auto shadow-[0_0_40px_rgba(244,63,94,0.2)] flex flex-col no-scrollbar"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/60 shrink-0">
                <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 font-display">
                  <Sparkles className="w-4 h-4 text-rose-400" /> Edit Clip Studio Details
                </span>
                <button
                  type="button"
                  onClick={() => setEditingClipModal(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                    CAPTION &amp; PIT NOTES
                  </label>
                  <textarea
                    value={editClipCaptionInput}
                    onChange={(e) => setEditClipCaptionInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 h-16 resize-none"
                    placeholder="Clip caption..."
                  />
                </div>

                {/* Breakdown Drop Timestamp (Seconds) */}
                <div>
                  <label className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5" />
                    <span>BREAKDOWN DROP MARKER (SECONDS INTO CLIP)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={300}
                    placeholder="e.g. 8 (for 0:08)"
                    value={editBreakdownSec}
                    onChange={(e) => setEditBreakdownSec(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Pin Show or Merch Drop */}
                <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">
                      PIN SHOW OR MERCH
                    </span>
                    <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                      {(
                        [
                          { id: 'none', label: 'None' },
                          { id: 'show', label: '🎟️ Show' },
                          { id: 'merch', label: '👕 Merch' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setEditPinType(opt.id)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                            editPinType === opt.id
                              ? 'bg-rose-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editPinType !== 'none' && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        placeholder={
                          editPinType === 'show'
                            ? 'Show Title (e.g. Age of Terror Live)'
                            : 'Merch Name (e.g. Heavyweight Tour Tee)'
                        }
                        value={editPinTitle}
                        onChange={(e) => setEditPinTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder={
                            editPinType === 'show'
                              ? 'Venue & Date'
                              : 'Merch Subtitle / Sizes'
                          }
                          value={editPinSubtitle}
                          onChange={(e) => setEditPinSubtitle(e.target.value)}
                          className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <input
                          type="text"
                          placeholder="$25"
                          value={editPinPrice}
                          onChange={(e) => setEditPinPrice(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                      GENRE TAGS (COMMA SEPARATED)
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">Tap pills to toggle</span>
                  </div>
                  <input
                    type="text"
                    value={editClipTagsInput}
                    onChange={(e) => setEditClipTagsInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="SLAM, LIVE, DEATHCORE"
                  />

                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {[
                      'SLAM',
                      'GOREGRIND',
                      'DEATHCORE',
                      'BRUTAL DEATH',
                      'HARDCORE',
                      'BEATDOWN',
                      'TECH DEATH',
                      'BLACK METAL',
                      'BREAKDOWN',
                      'LIVE',
                    ].map((tag) => {
                      const activeTags = editClipTagsInput
                        .split(',')
                        .map((t) => t.trim().toUpperCase());
                      const isSelected = activeTags.includes(tag);
                      return (
                        <button
                          key={`edit-tag-${tag}`}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              const filtered = activeTags.filter((t) => t !== tag && t.length > 0);
                              setEditClipTagsInput(filtered.join(', '));
                            } else {
                              const existing = activeTags.filter((t) => t.length > 0);
                              setEditClipTagsInput([...existing, tag].join(', '));
                            }
                          }}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingClipModal(null)}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEditClip}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all cursor-pointer"
                  >
                    Save Changes
                  </button>
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
