import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radio,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Video,
  Music,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  X,
  Shuffle,
  Heart,
  Share2,
  ExternalLink,
  Disc,
  Sparkles,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
  Battery,
  UserPlus,
  Check,
  User
} from 'lucide-react';
import { isProfileFollowedGlobally, saveFollowStateGlobally, FOLLOW_EVENT_NAME } from '../../../utils/followSyncService';
import { getSupabase } from '../../../supabase';
import { RADIO_PLAYLISTS, FRONTEND_FALLBACK_PLAYLISTS } from '../../../data/socialFeedMockData';
import { FirstTimeTooltip } from '../../common/FirstTimeTooltip';
import {
  getPlaylistTracksResilient,
  enrichTrackBatchDirect,
  persistSingleTrackMeta,
  resolveNativeAudioStreamUrl
} from '../../../services/sceneRadioMetadataService';
import {
  initGlobalMediaInterceptors,
  SCENE_RADIO_PAUSE_EVENT,
  LEGACY_RADIO_PAUSE_EVENT,
  markSceneRadioUserActive,
  isSceneRadioImmune
} from '../utils/mediaPlaybackCoordinator';
import { persistentAudioService, getSilentAudioCarrier } from '../../../services/persistentAudioService';

export interface SceneRadioPlayerProps {
  showSceneRadio?: boolean;
  setShowSceneRadio?: (val: boolean) => void;
  activeTab?: string;
  selectedChatId?: string | null;
  traysHiddenOnMobile?: boolean;
  triggerNotification?: (msg: string) => void;
  portalRole?: string;
  userProfile?: any;
}

// Helper to parse actual Band Name from video title (ignoring record label uploaders & uploader channels)
export const extractBandNameFromTrack = (track: any): string => {
  if (!track) return 'Unknown Band';
  let rawTitle = String(track.title || '').trim();
  let rawAuthor = String(track.author || '').trim();

  // Decode common HTML entities (e.g. &quot;, &#39;, &amp;)
  rawTitle = rawTitle
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  rawAuthor = rawAuthor
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  // Clean title from common YouTube brackets like (Official Video), [HD], [Official Audio], etc.
  const cleanedTitle = rawTitle
    .replace(/\[(OFFICIAL|AUDIO|MUSIC VIDEO|LYRIC VIDEO|HD|4K|VISUALIZER|FULL ALBUM|TOP TRACKS|REMASTERED).*?\]/gi, '')
    .replace(/\((OFFICIAL|AUDIO|MUSIC VIDEO|LYRIC VIDEO|HD|4K|VISUALIZER|FULL ALBUM|TOP TRACKS|REMASTERED).*?\)/gi, '')
    .trim();

  // Look for standard music video title separators: "Band - Song Title", "Band : Song Title", "Band | Song Title", etc.
  const separators = [' - ', ' – ', ' — ', ' : ', ' | '];
  for (const sep of separators) {
    if (cleanedTitle.includes(sep)) {
      const parts = cleanedTitle.split(sep).map(p => p.trim()).filter(Boolean);
      if (parts[0] && parts[0].length >= 2) {
        return parts[0];
      }
    }
  }

  // Check if author is a known record label or aggregator channel
  const knownLabels = [
    'nuclear blast', 'metal blade', 'unique leader', 'century media', 'napalm records',
    'relapse records', 'season of mist', 'profound lore', 'dark descent', 'debemur morti',
    'indie recordings', 'goregrind', 'slam worldwide', 'death metal promotion', 'hardcore worldwide',
    'vevo', 'official', 'records', 'entertainment', 'music'
  ];

  const authorLower = rawAuthor.toLowerCase();
  const isKnownLabel = knownLabels.some(lbl => authorLower.includes(lbl));

  // If author is NOT a known label, use author if author exists and title didn't have separators
  if (rawAuthor && !isKnownLabel && rawAuthor.length >= 2) {
    return rawAuthor.replace(/\s*-\s*Topic$/i, '').replace(/VEVO$/i, '').trim();
  }

  // Otherwise return cleaned title before separator or full cleaned title
  return cleanedTitle || rawAuthor || 'Unknown Band';
};

// Dynamic Theme Accent Color Helper based on active portal role or profile workspace
export const getRoleAccentTheme = (portalRole?: string, activeWorkspace?: string) => {
  const role = (activeWorkspace || portalRole || 'band').toLowerCase();

  // Label = Neon Orange
  if (role.includes('label')) {
    return {
      name: 'orange',
      primaryBg: 'bg-orange-500 hover:bg-orange-400 text-black font-black shadow-orange-950/80',
      activeBadge: 'bg-orange-950/90 text-orange-300 border-orange-500/60',
      subtleBg: 'bg-orange-950/40 border-orange-500/40 text-orange-300',
      text: 'text-orange-400',
      textBright: 'text-orange-300',
      border: 'border-orange-500/40',
      ring: 'ring-orange-500/60',
      glow: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',
      progressFromTo: 'from-orange-500 via-amber-400 to-orange-400',
      playButton: 'bg-orange-500 hover:bg-orange-400 text-black font-black shadow-lg shadow-orange-950/80',
      playIcon: 'fill-black text-black',
      accentHex: '#ff5500'
    };
  }

  // Creative = Magenta
  if (role.includes('creative')) {
    return {
      name: 'magenta',
      primaryBg: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black shadow-fuchsia-950/80',
      activeBadge: 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-500/60',
      subtleBg: 'bg-fuchsia-950/40 border-fuchsia-500/40 text-fuchsia-300',
      text: 'text-fuchsia-400',
      textBright: 'text-fuchsia-300',
      border: 'border-fuchsia-500/40',
      ring: 'ring-fuchsia-500/60',
      glow: 'shadow-[0_0_20px_rgba(217,70,239,0.4)]',
      progressFromTo: 'from-fuchsia-500 via-pink-500 to-rose-400',
      playButton: 'bg-fuchsia-500 hover:bg-fuchsia-400 text-white shadow-lg shadow-fuchsia-950/80',
      playIcon: 'fill-white text-white',
      accentHex: '#ff007f'
    };
  }

  // Industry Pro = Darker Purple
  if (role.includes('industry') || role.includes('pro')) {
    return {
      name: 'purple',
      primaryBg: 'bg-purple-800 hover:bg-purple-700 text-white shadow-purple-950/80',
      activeBadge: 'bg-purple-950/90 text-purple-300 border-purple-600/60',
      subtleBg: 'bg-purple-950/60 border-purple-600/40 text-purple-300',
      text: 'text-purple-400',
      textBright: 'text-purple-300',
      border: 'border-purple-600/50',
      ring: 'ring-purple-600/60',
      glow: 'shadow-[0_0_20px_rgba(147,51,234,0.4)]',
      progressFromTo: 'from-purple-800 via-purple-700 to-indigo-900',
      playButton: 'bg-purple-800 hover:bg-purple-700 text-white shadow-lg shadow-purple-950/90',
      playIcon: 'fill-white text-white',
      accentHex: '#7e22ce'
    };
  }

  // Promoter = Yellow
  if (role.includes('promoter')) {
    return {
      name: 'yellow',
      primaryBg: 'bg-yellow-400 hover:bg-yellow-300 text-black font-black shadow-yellow-950/80',
      activeBadge: 'bg-yellow-950/90 text-yellow-300 border-yellow-500/60',
      subtleBg: 'bg-yellow-950/40 border-yellow-500/40 text-yellow-300',
      text: 'text-yellow-400',
      textBright: 'text-yellow-300',
      border: 'border-yellow-500/40',
      ring: 'ring-yellow-500/60',
      glow: 'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
      progressFromTo: 'from-yellow-500 via-amber-400 to-yellow-300',
      playButton: 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-950/80',
      playIcon: 'fill-black text-black',
      accentHex: '#eab308'
    };
  }

  // Fan = Cyan
  if (role.includes('fan')) {
    return {
      name: 'cyan',
      primaryBg: 'bg-cyan-400 hover:bg-cyan-300 text-black font-black shadow-cyan-950/80',
      activeBadge: 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60',
      subtleBg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300',
      text: 'text-cyan-400',
      textBright: 'text-cyan-300',
      border: 'border-cyan-500/40',
      ring: 'ring-cyan-500/60',
      glow: 'shadow-[0_0_20px_rgba(34,211,238,0.4)]',
      progressFromTo: 'from-cyan-500 via-sky-400 to-blue-400',
      playButton: 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-950/80',
      playIcon: 'fill-black text-black',
      accentHex: '#00e5ff'
    };
  }

  // Band = Neon Green (#39ff14)
  return {
    name: 'green',
    primaryBg: 'bg-[#39ff14] hover:bg-[#28d00d] text-black font-black shadow-emerald-950/80',
    activeBadge: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60',
    subtleBg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300',
    text: 'text-[#39ff14]',
    textBright: 'text-emerald-300',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/60',
    glow: 'shadow-[0_0_20px_rgba(57,255,20,0.4)]',
    progressFromTo: 'from-[#39ff14] via-[#00ffcc] to-emerald-400',
    playButton: 'bg-[#39ff14] hover:bg-[#28d00d] text-black shadow-lg shadow-[#39ff14]/30',
    playIcon: 'fill-black text-black',
    accentHex: '#39ff14'
  };
};

// Helper to choose a completely random genre on initial mount
const getRandomRadioGenre = (): keyof typeof RADIO_PLAYLISTS => {
  const genreKeys = Object.keys(RADIO_PLAYLISTS) as Array<keyof typeof RADIO_PLAYLISTS>;
  const randomIndex = Math.floor(Math.random() * genreKeys.length);
  return genreKeys[randomIndex] || 'brutal';
};

// Helper to get a random track index within range
const getRandomTrackIndex = (max: number, excludeIndex?: number): number => {
  if (max <= 1) return 0;
  let randIdx = Math.floor(Math.random() * max);
  if (excludeIndex !== undefined && randIdx === excludeIndex && max > 1) {
    randIdx = (randIdx + 1) % max;
  }
  return randIdx;
};

export const SceneRadioPlayer: React.FC<SceneRadioPlayerProps> = ({
  showSceneRadio: externalShowSceneRadio,
  setShowSceneRadio: externalSetShowSceneRadio,
  activeTab = 'feed',
  selectedChatId = null,
  traysHiddenOnMobile = false,
  triggerNotification,
  portalRole = 'band',
  userProfile,
}) => {
  const isBandWorkspace = portalRole === 'band' || userProfile?.active_workspace === 'band';
  const theme = getRoleAccentTheme(portalRole, userProfile?.active_workspace);
  const [internalShowSceneRadio, setInternalShowSceneRadio] = useState(true);
  const showSceneRadio = externalShowSceneRadio !== undefined ? externalShowSceneRadio : internalShowSceneRadio;
  const setShowSceneRadio = externalSetShowSceneRadio || setInternalShowSceneRadio;

  const [sceneRadioPlaying, setSceneRadioPlaying] = useState(false);
  const [pauseToastMessage, setPauseToastMessage] = useState<string | null>(null);
  // Pick completely random genre on component mount
  const [selectedRadioGenre, setSelectedRadioGenre] = useState<keyof typeof RADIO_PLAYLISTS>(getRandomRadioGenre);
  const [isRadioExpanded, setIsRadioExpanded] = useState(false);

  // Random Radio vs. Specific User Track Selection State
  const [userSelectedTrack, setUserSelectedTrack] = useState<boolean>(false);
  const userSelectedTrackRef = useRef<boolean>(false);
  const currentVideoIndexRef = useRef<number>(0);
  const isShuffleRef = useRef<boolean>(true);
  const [isShuffle, setIsShuffle] = useState<boolean>(true);
  const wasPlayingWhenHiddenRef = useRef<boolean>(false);

  // Keep ref synchronized with state
  useEffect(() => {
    userSelectedTrackRef.current = userSelectedTrack;
  }, [userSelectedTrack]);

  useEffect(() => {
    isShuffleRef.current = isShuffle;
  }, [isShuffle]);

  // Live Scene Radio Advanced States
  const [playlistVideos, setPlaylistVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState<number>(0);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [radioPlayerError, setRadioPlayerError] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [searchPlaylistQuery, setSearchPlaylistQuery] = useState('');

  // Clip Video Overlay Controls Auto-Hide State
  const [showClipControls, setShowClipControls] = useState<boolean>(true);
  const clipControlsTimerRef = useRef<any>(null);

  const resetClipControlsTimer = () => {
    setShowClipControls(true);
    if (clipControlsTimerRef.current) {
      clearTimeout(clipControlsTimerRef.current);
    }
    if (sceneRadioPlaying) {
      clipControlsTimerRef.current = setTimeout(() => {
        setShowClipControls(false);
      }, 2200);
    }
  };

  useEffect(() => {
    if (showVideo && sceneRadioPlaying) {
      resetClipControlsTimer();
    } else if (!showVideo) {
      setShowClipControls(true);
      if (clipControlsTimerRef.current) {
        clearTimeout(clipControlsTimerRef.current);
      }
    }
  }, [showVideo, sceneRadioPlaying]);

  // Matched App Band Profile State
  const [matchedBandProfile, setMatchedBandProfile] = useState<any | null>(null);
  const [isFollowingMatched, setIsFollowingMatched] = useState<boolean>(false);
  const lastQueriedArtistRef = useRef<string>('');

  // Automatically query Supabase / profiles whenever currently playing track changes
  useEffect(() => {
    let active = true;
    const currentTrack = playlistVideos[currentVideoIndex];
    if (!currentTrack) {
      setMatchedBandProfile(null);
      lastQueriedArtistRef.current = '';
      return;
    }

    const searchArtistName = extractBandNameFromTrack(currentTrack);
    if (!searchArtistName || searchArtistName.trim().length < 2) {
      setMatchedBandProfile(null);
      lastQueriedArtistRef.current = '';
      return;
    }

    const cleanQuery = searchArtistName.trim().toLowerCase();
    if (lastQueriedArtistRef.current === cleanQuery && matchedBandProfile) {
      return;
    }
    lastQueriedArtistRef.current = cleanQuery;

    const resolveMatchedProfile = async () => {
      const client = getSupabase();
      if (!client) return;

      const cleanQuery = searchArtistName.trim().toLowerCase();

      try {
        // 1. Query bands table first
        const { data: bandData } = await client
          .from('bands')
          .select('*')
          .ilike('band_name', `%${cleanQuery}%`)
          .limit(1);

        if (active && bandData && bandData.length > 0) {
          const b = bandData[0];
          const prof = {
            id: `db-band-${b.id}`,
            raw_id: b.id,
            band_id: b.id,
            user_id: b.creator_id || b.user_id,
            name: b.band_name || b.name,
            role: 'Band',
            category: 'bands',
            genre: Array.isArray(b.micro_genres) ? b.micro_genres.join(' / ') : (b.micro_genres || 'Death Metal'),
            location: [b.city, b.state_province || b.state, b.country].filter(Boolean).join(', '),
            desc: b.bio || `${b.band_name} on Nexus Network`,
            avatar: b.logo_url || b.cover_url || b.avatar_url || '',
            image: b.logo_url || b.cover_url || b.avatar_url || '',
            banner: b.cover_url || '',
            isBandProfile: true,
            isRealBand: true
          };
          setMatchedBandProfile(prof);

            setIsFollowingMatched(isProfileFollowedGlobally(prof));
          return;
        }

        // 2. Query profiles table
        const { data: profData } = await client
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${cleanQuery}%,band_name.ilike.%${cleanQuery}%`)
          .limit(1);

        if (active && profData && profData.length > 0) {
          const p = profData[0];
          const profName = p.bandName || p.full_name || p.display_name || p.name;
          const prof = {
            id: `db-p-${p.id}`,
            raw_id: p.id,
            user_id: p.id,
            name: profName,
            role: p.role || 'Band',
            category: 'bands',
            desc: p.bio || 'Artist Profile on Nexus',
            avatar: p.avatar_url || p.avatar || '',
            image: p.avatar_url || p.avatar || '',
            banner: p.banner_url || ''
          };
          setMatchedBandProfile(prof);

            setIsFollowingMatched(isProfileFollowedGlobally(prof));
          return;
        }

        if (active) {
          const rawBandName = searchArtistName.trim();
          const fallbackProf = {
            id: `artist-${cleanQuery.replace(/[^a-z0-9]/g, '-')}`,
            raw_id: cleanQuery,
            name: rawBandName,
            role: 'Band',
            category: 'bands',
            genre: RADIO_PLAYLISTS[selectedRadioGenre]?.name || 'Scene Radio',
            desc: `${rawBandName} • Featured Artist on Nexus Core Scene Radio`,
            avatar: currentTrack.thumbnailUrl || (currentTrack.videoId ? `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg` : ''),
            image: currentTrack.thumbnailUrl || (currentTrack.videoId ? `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg` : ''),
            isSynthetic: true,
            isBandProfile: true
          };
          setMatchedBandProfile(fallbackProf);

            setIsFollowingMatched(isProfileFollowedGlobally(fallbackProf));
        }
      } catch (err) {
        if (active) {
          const rawBandName = searchArtistName.trim();
          const fallbackProf = {
            id: `artist-${cleanQuery.replace(/[^a-z0-9]/g, '-')}`,
            raw_id: cleanQuery,
            name: rawBandName,
            role: 'Band',
            category: 'bands',
            genre: RADIO_PLAYLISTS[selectedRadioGenre]?.name || 'Scene Radio',
            desc: `${rawBandName} • Featured Artist on Nexus Core Scene Radio`,
            avatar: currentTrack.thumbnailUrl || (currentTrack.videoId ? `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg` : ''),
            image: currentTrack.thumbnailUrl || (currentTrack.videoId ? `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg` : ''),
            isSynthetic: true,
            isBandProfile: true
          };
          setMatchedBandProfile(fallbackProf);
        }
      }
    };

    resolveMatchedProfile();

    return () => {
      active = false;
    };
  }, [currentVideoIndex, selectedRadioGenre]);

  const [showFollowBandPopup, setShowFollowBandPopup] = useState<boolean>(false);

  // Toggle follow handler for matched app band
  const handleToggleFollowMatched = () => {
    if (!matchedBandProfile) return;
    const nextState = !isFollowingMatched;
    setIsFollowingMatched(nextState);
    saveFollowStateGlobally(matchedBandProfile, nextState);

    triggerNotification?.(
      nextState
        ? `🔥 Now following ${matchedBandProfile.name} on Nexus Core!`
        : `Unfollowed ${matchedBandProfile.name}`
    );
  };

  // Re-sync follow state in real-time when global follow event fires
  useEffect(() => {
    const syncFollow = () => {
      if (matchedBandProfile) {
        setIsFollowingMatched(isProfileFollowedGlobally(matchedBandProfile));
      }
    };
    syncFollow();
    if (typeof window !== 'undefined') {
      window.addEventListener(FOLLOW_EVENT_NAME, syncFollow);
      window.addEventListener('storage', syncFollow);
      return () => {
        window.removeEventListener(FOLLOW_EVENT_NAME, syncFollow);
        window.removeEventListener('storage', syncFollow);
      };
    }
  }, [matchedBandProfile]);
  
  // Live Song Progress & Duration States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [radioVolume, setRadioVolume] = useState<number>(100);
  const [isTucked, setIsTucked] = useState<boolean>(false);

  const handleRadioVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRadioVolume(val);
    persistentAudioService.setVolume(val / 100);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(val);
      } catch (e) {}
    }
  };

  useEffect(() => {
    currentVideoIndexRef.current = currentVideoIndex;
  }, [currentVideoIndex]);

  // Liked / Favorited Tracks State
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_liked_radio_tracks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleLikeTrack = (videoId: string, trackTitle?: string) => {
    if (!videoId) return;
    setLikedTrackIds(prev => {
      const next = new Set(prev);
      const isLiked = next.has(videoId);
      if (isLiked) {
        next.delete(videoId);
        triggerNotification?.(`💔 Removed "${trackTitle || 'Track'}" from favorites`);
      } else {
        next.add(videoId);
        triggerNotification?.(`❤️ Liked "${trackTitle || 'Track'}"! Saved to favorites`);
      }
      try {
        localStorage.setItem('nexus_liked_radio_tracks', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.warn('Failed to store liked tracks in localStorage:', e);
      }
      return next;
    });
  };

  const handleShareTrackPost = (track: { videoId: string; title: string; author?: string; thumbnailUrl?: string }) => {
    if (!track || !track.videoId) return;
    const genreName = RADIO_PLAYLISTS[selectedRadioGenre]?.name || 'Scene Radio';
    
    // Dispatch event to UniversalSocialFeed to create post
    const customEvent = new CustomEvent('nexus_share_radio_track', {
      detail: {
        videoId: track.videoId,
        title: track.title,
        author: track.author,
        thumbnailUrl: track.thumbnailUrl,
        genreName
      }
    });
    window.dispatchEvent(customEvent);

    // Copy direct YouTube URL to clipboard with playlist context
    const playlistId = RADIO_PLAYLISTS[selectedRadioGenre]?.playlistId;
    const ytUrl = playlistId
      ? `https://www.youtube.com/watch?v=${track.videoId}&list=${playlistId}`
      : `https://www.youtube.com/watch?v=${track.videoId}`;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(ytUrl).catch(() => {});
    }

    triggerNotification?.(`🚀 Track "${track.title}" loaded into Post Creator! Edit & Post to publish.`);
  };

  const ytPlayerRef = useRef<any>(null);
  const hasUserInteractedWithRadio = useRef(false);
  const userInitiatedPauseRef = useRef<boolean>(false);
  const currentNativeStreamUrlRef = useRef<string | null>(null);

  // Poll current playback position & total duration from YouTube Iframe API or Native Fallback Stream
  useEffect(() => {
    let interval: any = null;
    if (sceneRadioPlaying) {
      interval = setInterval(() => {
        if (persistentAudioService.isPlayingNativeFallback()) {
          const cur = persistentAudioService.getCurrentTime() || 0;
          const dur = persistentAudioService.getDuration() || 0;
          if (!isScrubbing) {
            setCurrentTime(cur);
          }
          if (dur > 0) {
            setDuration(dur);
          }
          return;
        }
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (!isScrubbing) {
              setCurrentTime(cur);
            }
            if (dur > 0) {
              setDuration(dur);
              persistentAudioService.updateMediaSessionPosition(cur, dur);
            }
          } catch (e) {
            // ignore API timing glitches
          }
        }
      }, 400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sceneRadioPlaying, isScrubbing]);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (persistentAudioService.isPlayingNativeFallback()) {
      persistentAudioService.seek(seekTime);
    } else if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(seekTime, true);
    }
  };

  // Load YouTube Iframe API once
  useEffect(() => {
    const win = window as any;
    if (!win.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  }, []);

  // Sync sceneRadioPlaying and triggerNotification state to refs for global event listeners
  const sceneRadioPlayingRef = useRef(sceneRadioPlaying);
  useEffect(() => {
    sceneRadioPlayingRef.current = sceneRadioPlaying;
  }, [sceneRadioPlaying]);

  const triggerNotificationRef = useRef(triggerNotification);
  useEffect(() => {
    triggerNotificationRef.current = triggerNotification;
  }, [triggerNotification]);

  const lastPauseToastTimeRef = useRef<number>(0);

  // Global media listener & interceptor to auto-pause Scene Radio whenever any track or embedded media plays
  useEffect(() => {
    // 1. Initialize DOM capture & HTMLMediaElement interceptors across the application
    const cleanupInterceptors = initGlobalMediaInterceptors();

    // 2. Pause Scene Radio handler
    const pauseSceneRadio = (e?: any) => {
      // If user recently clicked play or interacted with radio, reject pause request
      if (isSceneRadioImmune()) {
        return;
      }

      // Check if Scene Radio is currently active or playing
      let isPlaying = sceneRadioPlayingRef.current;
      if (!isPlaying && ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
        try {
          // YT.PlayerState.PLAYING is 1, BUFFERING is 3
          const state = ytPlayerRef.current.getPlayerState();
          if (state === 1 || state === 3) {
            isPlaying = true;
          }
        } catch {
          // ignore
        }
      }

      if (isPlaying) {
        userInitiatedPauseRef.current = true;
        sceneRadioPlayingRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {
            // ignore
          }
        }
        persistentAudioService.pause();
        try {
          (window as any).NexusNativeAudio?.pauseForegroundAudio?.();
        } catch (_) {}
        setSceneRadioPlaying(false);

        // Toast notification: alert user that scene radio has been paused for media playback
        const now = Date.now();
        if (now - lastPauseToastTimeRef.current > 1200) {
          lastPauseToastTimeRef.current = now;
          triggerNotificationRef.current?.("📻 Scene Radio paused");
          setPauseToastMessage("📻 Scene Radio paused");
          setTimeout(() => setPauseToastMessage(null), 3200);
        }
      }
    };

    window.addEventListener(SCENE_RADIO_PAUSE_EVENT, pauseSceneRadio);
    window.addEventListener(LEGACY_RADIO_PAUSE_EVENT, pauseSceneRadio);
    document.addEventListener(SCENE_RADIO_PAUSE_EVENT, pauseSceneRadio);

    return () => {
      cleanupInterceptors();
      window.removeEventListener(SCENE_RADIO_PAUSE_EVENT, pauseSceneRadio);
      window.removeEventListener(LEGACY_RADIO_PAUSE_EVENT, pauseSceneRadio);
      document.removeEventListener(SCENE_RADIO_PAUSE_EVENT, pauseSceneRadio);
    };
  }, []);

  const enrichPlaylistBatch = async (playlistId: string, nativeIds: string[]) => {
    if (!playlistId || nativeIds.length === 0) return;
    
    // 1. Direct resilient client-side enricher (oEmbed / Supabase / localStorage)
    try {
      await enrichTrackBatchDirect(
        playlistId,
        nativeIds,
        playlistVideos,
        (updatedList) => {
          setPlaylistVideos(updatedList);
        }
      );
    } catch (e) {
      console.warn("[RADIO PLAYER] Direct batch enrichment note:", e);
    }

    // 2. Also attempt server-side batch route if running with active Node backend
    try {
      const resp = await fetch(`/api/playlist/${playlistId}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds: nativeIds })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.videos && data.videos.length > 0) {
          setPlaylistVideos(data.videos);
        }
      }
    } catch {
      // Expected in standalone APK where no local Node server is running
    }
  };

  const syncPlaylistData = (nativeIds: string[], currentIndex: number) => {
    if (nativeIds.length === 0) return;
    const currentPlaylistId = RADIO_PLAYLISTS[selectedRadioGenre].playlistId;

    setPlaylistVideos(prev => {
      const isStale = prev.length > 0 && !nativeIds.includes(prev[0].videoId);
      const baseList = isStale ? [] : prev;
      let merged = [...baseList];
      if (nativeIds.length > merged.length) {
        merged = nativeIds.map((id: string, i: number) => {
          const existing = baseList.find(v => v.videoId === id);
          if (existing) return existing;
          return {
            videoId: id,
            title: `Track ${i + 1}`,
            author: 'Unknown Artist',
            thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
          };
        });
      }

      if (ytPlayerRef.current && ytPlayerRef.current.getVideoData) {
         const videoData = ytPlayerRef.current.getVideoData();
         if (currentIndex >= 0 && videoData && videoData.title && merged[currentIndex]) {
           const updatedTrack = {
             ...merged[currentIndex],
             title: videoData.title,
             author: videoData.author || merged[currentIndex].author,
             videoId: videoData.video_id || merged[currentIndex].videoId
           };
           merged[currentIndex] = updatedTrack;

           // Persist retrieved track metadata directly to cache and Supabase
           if (videoData.title && !videoData.title.startsWith("Track ")) {
             persistSingleTrackMeta(currentPlaylistId, updatedTrack);
             fetch(`/api/playlist/${currentPlaylistId}/tracks`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ tracks: [updatedTrack] })
             }).catch(() => {});
           }
         }
      }
      return merged;
    });

    if (currentIndex >= 0) {
      setCurrentVideoIndex(currentIndex);
      currentVideoIndexRef.current = currentIndex;
    }
  };

  const initYoutubePlayer = (playlistId: string, startIndex?: number) => {
    const win = window as any;
    if (!win.YT || !win.YT.Player) {
      setTimeout(() => initYoutubePlayer(playlistId, startIndex), 500);
      return;
    }

    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      } catch (err) {
        console.warn("[RADIO PLAYER] Reusing player failed, destroying...", err);
      }
    }

    try {
      ytPlayerRef.current = new win.YT.Player('youtube-radio-player', {
        height: '100%',
        width: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          enablejsapi: 1,
          playsinline: 1,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          listType: 'playlist',
          list: playlistId,
        },
        events: {
          onReady: (event: any) => {
            console.log("[RADIO PLAYER] YT Player is Ready.");
            if (ytPlayerRef.current) {
              if (typeof ytPlayerRef.current.setVolume === 'function') {
                ytPlayerRef.current.setVolume(radioVolume);
              }
            }
            if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlaylist === 'function') {
                if (typeof ytPlayerRef.current.setShuffle === 'function') {
                  ytPlayerRef.current.setShuffle(isShuffleRef.current);
                }
                const ids = ytPlayerRef.current.getPlaylist() || [];
                if (ids.length > 0) {
                    let targetIndex = 0;
                    if (!userSelectedTrackRef.current) {
                      targetIndex = startIndex !== undefined && startIndex < ids.length
                        ? startIndex
                        : getRandomTrackIndex(ids.length);
                    }
                    syncPlaylistData(ids, targetIndex);
                    enrichPlaylistBatch(playlistId, ids);

                    if (sceneRadioPlayingRef.current) {
                       setTimeout(() => {
                          if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideoAt === 'function') {
                              ytPlayerRef.current.playVideoAt(targetIndex);
                          }
                       }, 500);
                    }
                }
            }
          },
          onStateChange: (event: any) => {
            if (event.data === 1) { // Playing
              userInitiatedPauseRef.current = false;
              sceneRadioPlayingRef.current = true;
              setSceneRadioPlaying(true);
              setRadioPlayerError(null);
              wasPlayingWhenHiddenRef.current = false;
              persistentAudioService.restoreCarrierMode();
            } else if (event.data === 2) { // Paused
              // If the user did NOT initiate pause, the OS / background visibility change auto-paused the iframe
              if (!userInitiatedPauseRef.current && sceneRadioPlayingRef.current && !showVideo) {
                console.log('[RADIO PLAYER] Background/OS auto-pause detected — maintaining continuous background playback...');
                wasPlayingWhenHiddenRef.current = true;
                try {
                  if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
                    ytPlayerRef.current.playVideo();
                  }
                } catch (_) {}

                setTimeout(() => {
                  if (!userInitiatedPauseRef.current && sceneRadioPlayingRef.current) {
                    let ytState = -1;
                    try {
                      ytState = ytPlayerRef.current?.getPlayerState?.() ?? -1;
                    } catch (_) {}
                    if (ytState !== 1) {
                      const curTrack = playlistVideosRef.current[currentVideoIndexRef.current];
                      const fallbackUrl = currentNativeStreamUrlRef.current || curTrack?.audioUrl;
                      if (fallbackUrl) {
                        persistentAudioService.activateNativeStreamFallback(fallbackUrl, radioVolume / 100);
                      } else if (curTrack) {
                        resolveNativeAudioStreamUrl(curTrack).then((url) => {
                          if (url && sceneRadioPlayingRef.current && !userInitiatedPauseRef.current) {
                            currentNativeStreamUrlRef.current = url;
                            persistentAudioService.activateNativeStreamFallback(url, radioVolume / 100);
                          }
                        }).catch(() => {});
                      }
                    }
                  }
                }, 350);
                return;
              }
              wasPlayingWhenHiddenRef.current = false;
              sceneRadioPlayingRef.current = false;
              setSceneRadioPlaying(false);
            } else if (event.data === 0) { // Track Ended
              // Continuous Random Radio: if user hasn't locked onto a specific track, pick another random track!
              if (!userSelectedTrackRef.current) {
                if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlaylist === 'function') {
                  const ids = ytPlayerRef.current.getPlaylist() || [];
                  if (ids.length > 1) {
                    const currentIdx = ytPlayerRef.current.getPlaylistIndex() ?? currentVideoIndexRef.current;
                    const nextRandIdx = getRandomTrackIndex(ids.length, currentIdx);
                    setTimeout(() => {
                      if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideoAt === 'function') {
                        ytPlayerRef.current.playVideoAt(nextRandIdx);
                      }
                    }, 300);
                  } else if (typeof ytPlayerRef.current.nextVideo === 'function') {
                    ytPlayerRef.current.nextVideo();
                  }
                }
              }
            }

            if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlaylist === 'function') {
                const nativeIds = ytPlayerRef.current.getPlaylist() || [];
                const nativeIndex = ytPlayerRef.current.getPlaylistIndex();
                if (nativeIds.length > 0) {
                    syncPlaylistData(nativeIds, nativeIndex);
                }
            }
          },
          onError: (event: any) => {
            const player = event.target;
            const videoData = player?.getVideoData ? player.getVideoData() : null;

            console.warn("[RADIO PLAYER] Non-fatal playback restriction on track, auto-advancing to random track:", {
              videoId: videoData?.video_id,
              title: videoData?.title,
              errorCode: event.data
            });

            let errorMsg = "Skipping restricted track...";
            if (event.data === 101 || event.data === 150) {
              errorMsg = "Embedding restricted by video owner. Skipping to next scene track...";
            } else if (event.data === 100) {
              errorMsg = "Track unavailable. Skipping...";
            } else if (event.data === 2 || event.data === 5) {
              errorMsg = "Player error. Skipping...";
            }
            setRadioPlayerError(errorMsg);

            // Fast auto-advance to next random track so radio stream does not stall
            setTimeout(() => {
              if (!userSelectedTrackRef.current && ytPlayerRef.current && typeof ytPlayerRef.current.getPlaylist === 'function') {
                const ids = ytPlayerRef.current.getPlaylist() || [];
                if (ids.length > 1 && typeof ytPlayerRef.current.playVideoAt === 'function') {
                  const curIdx = ytPlayerRef.current.getPlaylistIndex() ?? currentVideoIndexRef.current;
                  const nextRandIdx = getRandomTrackIndex(ids.length, curIdx);
                  ytPlayerRef.current.playVideoAt(nextRandIdx);
                } else if (typeof ytPlayerRef.current.nextVideo === 'function') {
                  ytPlayerRef.current.nextVideo();
                }
              } else if (ytPlayerRef.current && typeof ytPlayerRef.current.nextVideo === 'function') {
                ytPlayerRef.current.nextVideo();
              }
              setTimeout(() => setRadioPlayerError(null), 1200);
            }, 400);
          }
        }
      });
    } catch (e) {
      console.error("[RADIO PLAYER] Error initializing YT Player:", e);
    }
  };

  const togglePlayPause = () => {
    hasUserInteractedWithRadio.current = true;
    try {
      localStorage.setItem('ft_tip_scene_radio_play', 'true');
      localStorage.setItem('nexus_tooltip_dismissed_scene_radio_play', 'true');
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('nexus_tooltip_dismissed', { detail: { id: 'scene_radio_play' } }));
    if (!sceneRadioPlaying) {
      userInitiatedPauseRef.current = false;
      sceneRadioPlayingRef.current = true;
      markSceneRadioUserActive(3000);
    }
    if (!ytPlayerRef.current || typeof ytPlayerRef.current.playVideo !== 'function') {
      const playlistId = RADIO_PLAYLISTS[selectedRadioGenre].playlistId;
      userInitiatedPauseRef.current = false;
      sceneRadioPlayingRef.current = true;
      setSceneRadioPlaying(true);
      initYoutubePlayer(playlistId, currentVideoIndex);
      return;
    }

    try {
      if (sceneRadioPlaying) {
        userInitiatedPauseRef.current = true;
        sceneRadioPlayingRef.current = false;
        ytPlayerRef.current.pauseVideo();
        persistentAudioService.pause();
        try {
          (window as any).NexusNativeAudio?.pauseForegroundAudio?.();
        } catch (_) {}
        setSceneRadioPlaying(false);
      } else {
        userInitiatedPauseRef.current = false;
        sceneRadioPlayingRef.current = true;
        markSceneRadioUserActive(3000);
        ytPlayerRef.current.playVideo();
        setSceneRadioPlaying(true);
      }
    } catch (err) {
      console.error("[RADIO PLAYER] Error calling play/pause on YT player:", err);
    }
  };

  // Keep playlistVideos ref synchronized for background media controls and lockscreen callbacks
  const playlistVideosRef = useRef<any[]>([]);
  useEffect(() => {
    playlistVideosRef.current = playlistVideos;
  }, [playlistVideos]);

  const handleNextSong = () => {
    hasUserInteractedWithRadio.current = true;
    userInitiatedPauseRef.current = false;
    markSceneRadioUserActive(3000);
    const list = playlistVideosRef.current;
    // In continuous random radio mode, skip to a random track
    if (!userSelectedTrackRef.current && list.length > 1) {
      const nextIdx = getRandomTrackIndex(list.length, currentVideoIndexRef.current);
      setCurrentVideoIndex(nextIdx);
      currentVideoIndexRef.current = nextIdx;
      if (ytPlayerRef.current) {
        if (typeof ytPlayerRef.current.getPlaylist === 'function') {
          const ids = ytPlayerRef.current.getPlaylist() || [];
          const targetId = list[nextIdx]?.videoId;
          const idxInYt = ids.indexOf(targetId);
          if (idxInYt !== -1 && typeof ytPlayerRef.current.playVideoAt === 'function') {
            ytPlayerRef.current.playVideoAt(idxInYt);
            return;
          }
        }
        if (typeof ytPlayerRef.current.playVideoAt === 'function') {
          ytPlayerRef.current.playVideoAt(nextIdx);
          return;
        }
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.nextVideo === 'function') {
        ytPlayerRef.current.nextVideo();
      } else {
        setCurrentVideoIndex(prevIndex => (prevIndex + 1) % Math.max(list.length, 1));
      }
    }
  };

  const handlePrevSong = () => {
    hasUserInteractedWithRadio.current = true;
    userInitiatedPauseRef.current = false;
    markSceneRadioUserActive(3000);
    const list = playlistVideosRef.current;
    if (!userSelectedTrackRef.current && list.length > 1) {
      const prevIdx = getRandomTrackIndex(list.length, currentVideoIndexRef.current);
      setCurrentVideoIndex(prevIdx);
      currentVideoIndexRef.current = prevIdx;
      if (ytPlayerRef.current) {
        if (typeof ytPlayerRef.current.getPlaylist === 'function') {
          const ids = ytPlayerRef.current.getPlaylist() || [];
          const targetId = list[prevIdx]?.videoId;
          const idxInYt = ids.indexOf(targetId);
          if (idxInYt !== -1 && typeof ytPlayerRef.current.playVideoAt === 'function') {
            ytPlayerRef.current.playVideoAt(idxInYt);
            return;
          }
        }
        if (typeof ytPlayerRef.current.playVideoAt === 'function') {
          ytPlayerRef.current.playVideoAt(prevIdx);
          return;
        }
      }
    } else {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.previousVideo === 'function') {
        ytPlayerRef.current.previousVideo();
      } else {
        setCurrentVideoIndex(prevIndex => (prevIndex - 1 + list.length) % Math.max(list.length, 1));
      }
    }
  };

  // Pre-resolve native audio stream URL for current track so background fallback is instant
  useEffect(() => {
    let active = true;
    const curTrack = playlistVideos[currentVideoIndex];
    if (!curTrack) {
      currentNativeStreamUrlRef.current = null;
      return;
    }
    currentNativeStreamUrlRef.current = curTrack.audioUrl || null;
    resolveNativeAudioStreamUrl(curTrack).then((url) => {
      if (active && url) {
        currentNativeStreamUrlRef.current = url;
        // If already in background fallback mode (e.g. track advanced while app minimized), play new stream immediately
        if (sceneRadioPlayingRef.current && (persistentAudioService.isPlayingNativeFallback() || (typeof document !== 'undefined' && document.hidden))) {
          let ytState = -1;
          try {
            ytState = ytPlayerRef.current?.getPlayerState?.() ?? -1;
          } catch (_) {}
          if (ytState !== 1) {
            persistentAudioService.activateNativeStreamFallback(url, radioVolume / 100);
          }
        }
      }
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [currentVideoIndex, playlistVideos, selectedRadioGenre, radioVolume]);

  // Wire up native MediaSession API (Lock screen metadata, notification tray controls)
  useEffect(() => {
    const curTrack = playlistVideos[currentVideoIndex];
    const genreName = RADIO_PLAYLISTS[selectedRadioGenre]?.name || 'Scene Radio';

    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const title = curTrack?.title || `${genreName} Stream`;
        const artist = curTrack?.author || `Nexus ${genreName} Radio`;
        const artwork = curTrack?.thumbnailUrl || '/icon-512.png';

        navigator.mediaSession.metadata = new MediaMetadata({
          title,
          artist,
          album: 'Scene Radio',
          artwork: [
            { src: artwork, sizes: '96x96', type: 'image/png' },
            { src: artwork, sizes: '128x128', type: 'image/png' },
            { src: artwork, sizes: '256x256', type: 'image/png' },
            { src: artwork, sizes: '512x512', type: 'image/png' },
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => {
          if (!sceneRadioPlayingRef.current) togglePlayPause();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          if (sceneRadioPlayingRef.current) togglePlayPause();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          handleNextSong();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          handlePrevSong();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          if (sceneRadioPlayingRef.current) togglePlayPause();
        });
      } catch (err) {
        console.warn('[RADIO PLAYER] MediaSession registration note:', err);
      }
    }
  }, [currentVideoIndex, playlistVideos, selectedRadioGenre]);

  const prevPlayingRef = useRef<boolean>(false);
  const prevGenreRef = useRef<string>(selectedRadioGenre);

  // Synchronize playback state with persistentAudioService, MediaSession, and window.NexusNativeAudio
  useEffect(() => {
    const curTrack = playlistVideos[currentVideoIndex];
    const genreName = RADIO_PLAYLISTS[selectedRadioGenre]?.name || 'Scene Radio';
    const title = curTrack?.title || `${genreName} Radio Track`;
    const artist = curTrack?.author || `Nexus Radio (${genreName})`;
    const artwork = curTrack?.thumbnailUrl || '/icon-512.png';
    const nativeBridge = typeof window !== 'undefined' ? (window as any).NexusNativeAudio : null;

    if (sceneRadioPlaying) {
      const isStartingOrStationChange = !prevPlayingRef.current || prevGenreRef.current !== selectedRadioGenre;
      try {
        if (nativeBridge) {
          if (typeof nativeBridge.setAudioActive === 'function') {
            nativeBridge.setAudioActive(true);
          }
          if (isStartingOrStationChange && typeof nativeBridge.startForegroundAudio === 'function') {
            nativeBridge.startForegroundAudio(title, artist, genreName);
          } else if (typeof nativeBridge.updateMetadata === 'function') {
            nativeBridge.updateMetadata(title, artist);
          } else if (typeof nativeBridge.startForegroundAudio === 'function') {
            nativeBridge.startForegroundAudio(title, artist, genreName);
          }
        }
      } catch (_) {}

      persistentAudioService.play({
        id: curTrack?.videoId || `radio_${selectedRadioGenre}_${currentVideoIndex}`,
        title: title,
        artist: artist,
        album: 'Scene Radio',
        genre: genreName,
        artworkUrl: artwork,
        audioUrl: curTrack?.audioUrl || getSilentAudioCarrier(),
        fallbackStreamUrl: currentNativeStreamUrlRef.current || undefined,
        isLiveStream: true
      }, {
        onNext: () => handleNextSong(),
        onPrevious: () => handlePrevSong(),
        onPlay: () => {
          if (!sceneRadioPlayingRef.current) togglePlayPause();
        },
        onPause: () => {
          if (sceneRadioPlayingRef.current) togglePlayPause();
        }
      });
    } else if (prevPlayingRef.current) {
      persistentAudioService.pause();
      try {
        nativeBridge?.pauseForegroundAudio?.();
      } catch (_) {}
    }

    prevPlayingRef.current = sceneRadioPlaying;
    prevGenreRef.current = selectedRadioGenre;
  }, [sceneRadioPlaying, currentVideoIndex, playlistVideos, selectedRadioGenre]);

  // Stop foreground audio on component unmount
  useEffect(() => {
    return () => {
      try {
        (window as any).NexusNativeAudio?.stopForegroundAudio?.();
      } catch (_) {}
    };
  }, []);

  // Listen for native audio interruptions (e.g. phone call or headset unplugged or OS media notification control)
  useEffect(() => {
    const handleNativeInterruption = (e: any) => {
      const action = e.detail?.action;
      console.log('[RADIO PLAYER] Native audio event received:', action);

      if (action === 'pause' && sceneRadioPlayingRef.current) {
        if (isSceneRadioImmune()) {
          console.log('[RADIO PLAYER] Ignoring native pause during immunity window');
          return;
        }
        userInitiatedPauseRef.current = true;
        sceneRadioPlayingRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (_) {}
        }
        persistentAudioService.pause();
        try {
          (window as any).NexusNativeAudio?.pauseForegroundAudio?.();
        } catch (_) {}
        setSceneRadioPlaying(false);
        triggerNotification?.('🎧 Audio paused');
      } else if ((action === 'resume' || action === 'play') && !sceneRadioPlayingRef.current) {
        userInitiatedPauseRef.current = false;
        sceneRadioPlayingRef.current = true;
        markSceneRadioUserActive(3000);
        setSceneRadioPlaying(true);
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
          try {
            ytPlayerRef.current.playVideo();
          } catch (_) {}
        }
        if (typeof document !== 'undefined' && document.hidden && currentNativeStreamUrlRef.current) {
          persistentAudioService.activateNativeStreamFallback(currentNativeStreamUrlRef.current, radioVolume / 100);
        } else {
          persistentAudioService.resume();
        }
      } else if (action === 'next') {
        handleNextSong();
      } else if (action === 'previous') {
        handlePrevSong();
      } else if (action === 'stop') {
        userInitiatedPauseRef.current = true;
        sceneRadioPlayingRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (_) {}
        }
        persistentAudioService.stop();
        try {
          (window as any).NexusNativeAudio?.stopForegroundAudio?.();
        } catch (_) {}
        setSceneRadioPlaying(false);
      }
    };

    window.addEventListener('nexus_native_audio_interruption', handleNativeInterruption);

    // Also handle browser-level headset unplugging
    let handleDeviceChange: any = null;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      handleDeviceChange = () => {
        if (sceneRadioPlayingRef.current) {
          userInitiatedPauseRef.current = true;
          sceneRadioPlayingRef.current = false;
          if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
            try {
              ytPlayerRef.current.pauseVideo();
            } catch (_) {}
          }
          persistentAudioService.pause();
          setSceneRadioPlaying(false);
          triggerNotification?.('🎧 Headset disconnected — radio paused');
        }
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }

    return () => {
      window.removeEventListener('nexus_native_audio_interruption', handleNativeInterruption);
      if (handleDeviceChange && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [triggerNotification, radioVolume]);

  // Keep audio playback seamless across document visibility, backgrounding, and window focus transitions
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined') return;
      if (document.hidden && sceneRadioPlayingRef.current && !userInitiatedPauseRef.current) {
        // App was minimized or screen locked while playing
        try {
          (window as any).NexusNativeAudio?.setAudioActive?.(true);
          ytPlayerRef.current?.playVideo?.();
        } catch (_) {}

        setTimeout(() => {
          if (typeof document !== 'undefined' && document.hidden && sceneRadioPlayingRef.current && !userInitiatedPauseRef.current) {
            let ytState = -1;
            try {
              ytState = ytPlayerRef.current?.getPlayerState?.() ?? -1;
            } catch (_) {}
            if (ytState !== 1) {
              const curTrack = playlistVideosRef.current[currentVideoIndexRef.current];
              const fallbackUrl = currentNativeStreamUrlRef.current || curTrack?.audioUrl;
              if (fallbackUrl) {
                persistentAudioService.activateNativeStreamFallback(fallbackUrl, radioVolume / 100);
              } else if (curTrack) {
                resolveNativeAudioStreamUrl(curTrack).then((url) => {
                  if (url && sceneRadioPlayingRef.current && !userInitiatedPauseRef.current) {
                    currentNativeStreamUrlRef.current = url;
                    persistentAudioService.activateNativeStreamFallback(url, radioVolume / 100);
                  }
                }).catch(() => {});
              }
            }
          }
        }, 400);
      } else if (!document.hidden && (wasPlayingWhenHiddenRef.current || sceneRadioPlayingRef.current) && !userInitiatedPauseRef.current) {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
          const state = ytPlayerRef.current.getPlayerState();
          // If video was paused (2) or cued (5) while user intended playback, resume
          if (state !== 1 && typeof ytPlayerRef.current.playVideo === 'function') {
            try {
              ytPlayerRef.current.playVideo();
            } catch (_) {}
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);
    window.addEventListener('blur', handleVisibilityOrFocus);
    window.addEventListener('pagehide', handleVisibilityOrFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      window.removeEventListener('blur', handleVisibilityOrFocus);
      window.removeEventListener('pagehide', handleVisibilityOrFocus);
    };
  }, [radioVolume]);


  // Select a specific track from the playlist queue
  const handleSelectSpecificTrack = (video: any) => {
    hasUserInteractedWithRadio.current = true;
    markSceneRadioUserActive(3000);
    setUserSelectedTrack(true);
    userSelectedTrackRef.current = true;
    setSceneRadioPlaying(true);
    setCurrentVideoIndex(video.originalIndex);
    currentVideoIndexRef.current = video.originalIndex;

    if (ytPlayerRef.current) {
      if (typeof ytPlayerRef.current.getPlaylist === 'function') {
        const playlistIds = ytPlayerRef.current.getPlaylist() || [];
        const targetIndex = playlistIds.indexOf(video.videoId);
        if (targetIndex !== -1 && typeof ytPlayerRef.current.playVideoAt === 'function') {
          ytPlayerRef.current.playVideoAt(targetIndex);
          return;
        }
      }
      if (typeof ytPlayerRef.current.playVideoAt === 'function') {
        ytPlayerRef.current.playVideoAt(video.originalIndex);
      }
    }
    triggerNotification?.(`🎵 Now playing: "${video.title}"`);
  };

  // Toggle Shuffle / Random Mode
  const toggleShuffleMode = () => {
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    if (nextShuffle) {
      setUserSelectedTrack(false);
      userSelectedTrackRef.current = false;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.setShuffle === 'function') {
        ytPlayerRef.current.setShuffle(true);
      }
      triggerNotification?.("🎲 Endless Random Radio Mode Active!");
    } else {
      setUserSelectedTrack(true);
      userSelectedTrackRef.current = true;
      if (ytPlayerRef.current && typeof ytPlayerRef.current.setShuffle === 'function') {
        ytPlayerRef.current.setShuffle(false);
      }
      triggerNotification?.("🔁 Sequential Queue Mode Active");
    }
  };

  // Change Genre Channel
  const handleSelectGenre = (genreKey: keyof typeof RADIO_PLAYLISTS) => {
    if (selectedRadioGenre !== genreKey) {
      markSceneRadioUserActive(3000);
      setUserSelectedTrack(false);
      userSelectedTrackRef.current = false;
      setSelectedRadioGenre(genreKey);
      triggerNotification?.(`📻 Tuned into ${RADIO_PLAYLISTS[genreKey].name} Radio!`);
    }
  };

  // Auto-play random track within 3 seconds of the feed loading
  useEffect(() => {
    const isFeed = activeTab === 'feed' || activeTab === 'social';
    if (!isFeed) return;

    let isDisposed = false;
    console.log("[RADIO PLAYER] Feed loaded — scheduled Scene Radio autoplay within 3 seconds...");

    const executeAutoPlay = () => {
      if (isDisposed) return;
      if (!hasUserInteractedWithRadio.current && !sceneRadioPlayingRef.current) {
        console.log("[RADIO PLAYER] 3 seconds elapsed since feed loading — auto-playing Scene Radio...");
        markSceneRadioUserActive(5000);
        setSceneRadioPlaying(true);
        sceneRadioPlayingRef.current = true;

        const startAutoPlayback = () => {
          if (ytPlayerRef.current) {
            try {
              if (typeof ytPlayerRef.current.unMute === 'function') {
                ytPlayerRef.current.unMute();
              }
              if (typeof ytPlayerRef.current.setVolume === 'function') {
                ytPlayerRef.current.setVolume(radioVolume);
              }
              if (typeof ytPlayerRef.current.getPlaylist === 'function') {
                const ids = ytPlayerRef.current.getPlaylist() || [];
                if (ids.length > 0 && typeof ytPlayerRef.current.playVideoAt === 'function') {
                  const targetIdx = !userSelectedTrackRef.current
                    ? (currentVideoIndexRef.current >= 0 && currentVideoIndexRef.current < ids.length ? currentVideoIndexRef.current : getRandomTrackIndex(ids.length))
                    : 0;
                  ytPlayerRef.current.playVideoAt(targetIdx);
                  return;
                }
              }
              if (typeof ytPlayerRef.current.playVideo === 'function') {
                ytPlayerRef.current.playVideo();
                return;
              }
            } catch (e) {
              console.warn("[RADIO PLAYER] Auto-play call error:", e);
            }
          }

          // If YT player is still bootstrapping, initialize it with current playlist and random track
          const playlistId = RADIO_PLAYLISTS[selectedRadioGenre]?.playlistId;
          if (playlistId) {
            initYoutubePlayer(playlistId, currentVideoIndexRef.current);
          }
        };

        startAutoPlayback();

        // Browser Autoplay Resilience:
        // If unmuted playback is blocked before the user's first document gesture,
        // trigger playback on the very first gesture (touch, scroll, click, keydown)
        const handleFirstUserGesture = () => {
          if (sceneRadioPlayingRef.current && ytPlayerRef.current) {
            try {
              if (typeof ytPlayerRef.current.unMute === 'function') ytPlayerRef.current.unMute();
              if (typeof ytPlayerRef.current.playVideo === 'function') ytPlayerRef.current.playVideo();
            } catch (_) {}
          }
          cleanupGestureListeners();
        };

        const cleanupGestureListeners = () => {
          window.removeEventListener('pointerdown', handleFirstUserGesture);
          window.removeEventListener('keydown', handleFirstUserGesture);
          window.removeEventListener('touchstart', handleFirstUserGesture);
        };

        window.addEventListener('pointerdown', handleFirstUserGesture, { passive: true, once: true });
        window.addEventListener('keydown', handleFirstUserGesture, { passive: true, once: true });
        window.addEventListener('touchstart', handleFirstUserGesture, { passive: true, once: true });
      }
    };

    const autoPlayTimer = setTimeout(executeAutoPlay, 3000);

    const handleFeedLoaded = () => {
      // Fast-path if feed explicitly signals loaded
      if (!hasUserInteractedWithRadio.current && !sceneRadioPlayingRef.current) {
        clearTimeout(autoPlayTimer);
        setTimeout(executeAutoPlay, 3000);
      }
    };
    window.addEventListener('nexus_feed_loaded', handleFeedLoaded);

    return () => {
      isDisposed = true;
      clearTimeout(autoPlayTimer);
      window.removeEventListener('nexus_feed_loaded', handleFeedLoaded);
    };
  }, [activeTab, selectedRadioGenre]);

  useEffect(() => {
    let active = true;
    const playlistId = RADIO_PLAYLISTS[selectedRadioGenre].playlistId;

    setPlaylistVideos([]);

    // Initialize with a random track from fallback seed data on mount/genre change
    const seedVideos = FRONTEND_FALLBACK_PLAYLISTS[playlistId] || [
      { videoId: 's7oZ4xV_f_k', title: 'Metal Scene Radio Track 1', author: 'Metal Artist', thumbnailUrl: 'https://img.youtube.com/vi/s7oZ4xV_f_k/hqdefault.jpg' }
    ];
    const initialRandomIdx = !userSelectedTrackRef.current && seedVideos.length > 1
      ? getRandomTrackIndex(seedVideos.length)
      : 0;

    setCurrentVideoIndex(initialRandomIdx);
    currentVideoIndexRef.current = initialRandomIdx;
    setPlaylistVideos(seedVideos);

    initYoutubePlayer(playlistId, initialRandomIdx);

    const fetchPlaylistRSS = async () => {
      setIsLoadingPlaylist(true);
      setRadioPlayerError(null);

      try {
        const tracks = await getPlaylistTracksResilient(playlistId);

        if (active && tracks && tracks.length > 0) {
          setPlaylistVideos(tracks);
          if (!userSelectedTrackRef.current) {
            const randIdx = getRandomTrackIndex(tracks.length, currentVideoIndexRef.current);
            setCurrentVideoIndex(randIdx);
            currentVideoIndexRef.current = randIdx;
          }
        }
      } catch (err: any) {
        console.info("[RADIO PLAYER] Using cached fallback radio playlist:", err?.message || err);
      } finally {
        if (active) setIsLoadingPlaylist(false);
      }
    };

    fetchPlaylistRSS();

    return () => {
      active = false;
    };
  }, [selectedRadioGenre]);

  const isAutoTucked = isTucked || activeTab === 'reels' || (activeTab === 'messages' && Boolean(selectedChatId));

  return (
    <>
      {/* 
        PERMANENT ROOT YOUTUBE HOST ELEMENT
        Must NEVER be unmounted. Placed at the root level outside any AnimatePresence.
        When expanded & showVideo is true, display it floating above the footer controls.
        When collapsed or audio-only, position it offscreen with non-zero dimensions (w-[200px] h-[200px]) so YouTube never throttles playback due to 0x0 iframe bounds.
      */}
      <div
        data-scene-radio="true"
        aria-hidden={!(isRadioExpanded && showVideo)}
        onMouseMove={resetClipControlsTimer}
        onTouchStart={resetClipControlsTimer}
        onClick={() => setShowClipControls(prev => !prev)}
        className={`fixed z-[99999] transition-all duration-300 ${
          isRadioExpanded && showVideo
            ? 'bottom-[185px] sm:bottom-[210px] left-1/2 -translate-x-1/2 w-[94vw] max-w-4xl h-[210px] sm:h-[310px] bg-zinc-950/95 border border-rose-500/40 rounded-2xl overflow-hidden shadow-[0_10px_50px_rgba(225,29,72,0.35)] backdrop-blur-2xl pointer-events-auto group/clip'
            : 'left-[-9999px] top-[-9999px] w-[200px] h-[200px] opacity-0 pointer-events-none'
        }`}
      >
        <div id="youtube-radio-player" data-scene-radio="true" className="w-full h-full bg-black pointer-events-auto" />

        {/* Auto-Hiding Video Controls Overlay */}
        {isRadioExpanded && showVideo && (
          <div 
            className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 flex flex-col justify-between p-3 pointer-events-none transition-opacity duration-300 z-10 ${
              showClipControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top Clip Bar */}
            <div className="flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-rose-500/40 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[10px] font-mono font-bold text-white truncate max-w-[200px] sm:max-w-[340px]">
                  {playlistVideos[currentVideoIndex]?.title || 'Scene Radio Clip'}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVideo(false);
                }}
                className="w-8 h-8 rounded-full bg-black/80 hover:bg-rose-950 border border-zinc-700 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                title="Close Clip View"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Clip Bar */}
            <div className="flex items-center justify-between pointer-events-auto">
              <span className="text-[9px] font-mono text-zinc-300 bg-black/70 px-2.5 py-1 rounded-full backdrop-blur-sm border border-zinc-800">
                Tap clip to toggle controls
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10.5px] flex items-center gap-1.5 shadow-lg cursor-pointer transition-all active:scale-95"
              >
                {sceneRadioPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{sceneRadioPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification when Scene Radio automatically pauses */}
      <AnimatePresence>
        {pauseToastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none px-4 py-2 rounded-full bg-zinc-950/95 border border-red-500/80 text-white font-mono text-xs font-black shadow-[0_0_30px_rgba(239,68,68,0.55)] flex items-center gap-2.5 backdrop-blur-xl"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <Radio className="w-4 h-4 text-red-500 shrink-0" />
            <span className="tracking-wide uppercase text-red-200">{pauseToastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TUCKED MINI-PILL (Visible when user tucks radio or while on reels/chat to maintain smooth playback) */}
      <AnimatePresence>
        {showSceneRadio && isAutoTucked && (
          <motion.button
            key="scene-radio-tucked-pill"
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.9 }}
            onClick={() => setIsTucked(false)}
            className="fixed bottom-3 right-3 sm:right-6 z-[9995] px-3.5 py-1.5 rounded-full bg-zinc-950/95 border border-rose-500/60 shadow-[0_4px_25px_rgba(225,29,72,0.4)] flex items-center gap-2 backdrop-blur-xl hover:border-rose-400 transition-all cursor-pointer group active:scale-95 overflow-hidden"
            title="Restore Scene Radio Player"
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${sceneRadioPlaying ? 'bg-rose-500 animate-ping' : 'bg-zinc-500'}`} />
            <Radio className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <div className="w-[140px] sm:w-[220px] overflow-hidden whitespace-nowrap text-[11px] font-mono font-bold text-zinc-200 uppercase tracking-wide flex items-center">
              {(() => {
                const curTrack = playlistVideos[currentVideoIndex];
                const author = curTrack?.author || '';
                const title = curTrack?.title || 'Scene Radio';
                const displayText = author && !title.toLowerCase().includes(author.toLowerCase())
                  ? `${author} - ${title}`
                  : title;
                return (
                  <span className={`inline-block whitespace-nowrap ${sceneRadioPlaying ? 'animate-marquee-slow pr-8' : 'truncate'}`}>
                    {displayText} &nbsp;&nbsp;•&nbsp;&nbsp; {displayText}
                  </span>
                );
              })()}
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSceneRadio && !isAutoTucked && (
        <motion.div
          key="scene-radio-footer-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`fixed bottom-0 left-0 right-0 ${
            isRadioExpanded ? 'z-[9999]' : 'z-[9990]'
          } w-full bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-4px_30px_rgba(0,0,0,0.85)] flex flex-col group transition-all duration-300 ${
            traysHiddenOnMobile ? 'pointer-events-none opacity-0 translate-y-16' : 'opacity-100 translate-y-0'
          }`}
        >

          {/* EXPANDED INTERACTIVE PLAYER PANEL (Rises above footer when expanded) */}
          <AnimatePresence>
            {isRadioExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-5xl mx-auto border-b border-zinc-800/80 bg-zinc-950 flex flex-col overflow-hidden max-h-[460px] sm:max-h-[500px] shadow-2xl relative"
              >
                {/* Micro-genre Switcher Console */}
                <div className="bg-zinc-950/90 px-3 py-2.5 sm:py-3 border-b border-zinc-900 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono mr-1 shrink-0">CHANNELS:</span>
                  {(Object.keys(RADIO_PLAYLISTS) as Array<keyof typeof RADIO_PLAYLISTS>).map((genreKey, gIdx) => {
                    const isActive = selectedRadioGenre === genreKey;
                    return (
                      <button
                        key={`radio-genre-${genreKey}-${gIdx}`}
                        onClick={() => handleSelectGenre(genreKey)}
                        className={`px-3.5 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono shrink-0 transition-all border cursor-pointer min-h-[38px] sm:min-h-[42px] flex items-center justify-center gap-1.5 ${
                          isActive
                            ? `${theme.primaryBg} ${theme.glow} scale-[1.03] animate-pulse ring-2 ${theme.ring}`
                            : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 active:scale-95'
                        }`}
                      >
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                        )}
                        {RADIO_PLAYLISTS[genreKey].name.split(' ').map((word, wIdx) => (
                          <span key={`radio-word-${genreKey}-${wIdx}-${word}`} className={wIdx > 0 ? `${theme.textBright} ml-0.5` : ''}>{word} </span>
                        ))}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      persistentAudioService.requestBatteryExemption();
                      triggerNotification?.('🔋 Requested Unrestricted Battery access for background radio');
                    }}
                    title="Allow Background Audio playback in Android system settings"
                    className="ml-auto px-2.5 py-1.5 rounded-lg text-[9px] font-mono text-zinc-400 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 bg-zinc-900/60 hover:bg-emerald-950/20 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Battery className="w-3 h-3 text-emerald-400" />
                    <span className="hidden sm:inline">Background Keep-Alive</span>
                    <span className="sm:hidden">Keep-Alive</span>
                  </button>
                </div>

                {/* Active Track Control Panel */}
                <div className="p-3 sm:p-4 bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 flex flex-col gap-3 border-b border-zinc-900 shrink-0 relative">
                  {/* Title & Artist Display */}
                  <div className="flex items-center gap-3">
                    {/* Disc / Thumbnail */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-black overflow-hidden border border-zinc-800 shrink-0 shadow-md group-hover:border-zinc-700 transition-colors">
                      {playlistVideos[currentVideoIndex]?.thumbnailUrl ? (
                        <img
                          referrerPolicy="no-referrer"
                          src={playlistVideos[currentVideoIndex].thumbnailUrl}
                          alt="Album Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full bg-zinc-900 flex items-center justify-center ${theme.text}`}>
                          <Radio className="w-6 h-6 animate-pulse" />
                        </div>
                      )}
                      {sceneRadioPlaying && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                          <div className={`w-3.5 h-3.5 rounded-full animate-ping ${theme.primaryBg}`} />
                        </div>
                      )}
                    </div>

                    {/* Meta Text */}
                    <div className="flex-grow min-w-0 flex flex-col justify-center">
                      <div className="w-full overflow-hidden whitespace-nowrap text-xs sm:text-sm font-bold text-white tracking-tight font-mono">
                        {playlistVideos[currentVideoIndex]?.title ? (
                          (playlistVideos[currentVideoIndex].title.length > 32) ? (
                            <div className="inline-block animate-marquee-slow pr-8">
                              <span key={`track-title-${playlistVideos[currentVideoIndex]?.videoId || currentVideoIndex}`}>
                                {playlistVideos[currentVideoIndex].title}
                              </span>
                            </div>
                          ) : (
                            <div className="truncate">
                              {playlistVideos[currentVideoIndex].title}
                            </div>
                          )
                        ) : (
                          <div className="truncate text-zinc-500">Loading channel tracks...</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] sm:text-xs truncate font-mono ${theme.text}`}>
                          {playlistVideos[currentVideoIndex]?.author || 'Unknown Channel'}
                        </span>
                        {matchedBandProfile && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('nexus_open_public_profile', {
                                  detail: { profile: matchedBandProfile }
                                }));
                                triggerNotification?.(`👤 Opening ${matchedBandProfile.name}'s Profile...`);
                              }}
                              className={`px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors ${theme.subtleBg}`}
                              title={`Open ${matchedBandProfile.name}'s App Profile`}
                            >
                              <User className={`w-2.5 h-2.5 ${theme.text}`} />
                              <span className="truncate max-w-[90px]">{matchedBandProfile.name}</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFollowMatched();
                              }}
                              className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-black uppercase tracking-wider transition-all border flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm ${
                                isFollowingMatched
                                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60'
                                  : `${theme.primaryBg} animate-pulse`
                              }`}
                              title={isFollowingMatched ? `Following ${matchedBandProfile.name}` : `Follow ${matchedBandProfile.name} on Nexus`}
                            >
                              {isFollowingMatched ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Following</span>
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-2.5 h-2.5 text-white" />
                                  <span>+ Follow</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Share, Like / Favorite, Open YouTube & Close */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          const curTrack = playlistVideos[currentVideoIndex];
                          if (curTrack) {
                            handleShareTrackPost(curTrack);
                          }
                        }}
                        disabled={playlistVideos.length === 0}
                        className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                        title="Share Track to Community Feed"
                      >
                        <Share2 className={`w-4 h-4 ${theme.text}`} />
                      </button>
                      <button
                        onClick={() => {
                          const curTrack = playlistVideos[currentVideoIndex];
                          if (curTrack) {
                            toggleLikeTrack(curTrack.videoId, curTrack.title);
                          }
                        }}
                        disabled={playlistVideos.length === 0}
                        className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer ${
                          likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId)
                            ? `${theme.subtleBg} ${theme.text} scale-105 shadow-sm`
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? "Unlike Song" : "Favorite Song"}
                      >
                        <Heart className={`w-4 h-4 ${likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? `fill-current ${theme.text}` : ''}`} />
                      </button>
                      {playlistVideos[currentVideoIndex]?.videoId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex].videoId}&list=${RADIO_PLAYLISTS[selectedRadioGenre]?.playlistId || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                          title="Open directly on YouTube (Bypass Age Gate)"
                        >
                          <ExternalLink className={`w-4 h-4 ${theme.text}`} />
                        </a>
                      )}
                      <button
                        onClick={() => setIsRadioExpanded(false)}
                        className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
                        title="Collapse Queue"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive Playback Progress Bar & Time Counter */}
                  {radioPlayerError ? (
                    <div className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[10px] font-mono flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex items-center gap-1.5 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-bounce" />
                        <span className="truncate">{radioPlayerError}</span>
                      </div>
                      {playlistVideos[currentVideoIndex]?.videoId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex].videoId}&list=${RADIO_PLAYLISTS[selectedRadioGenre]?.playlistId || ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2.5 py-1 rounded font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all shadow-md cursor-pointer ${theme.primaryBg}`}
                          title="Bypass Age Limit - Play directly on YouTube"
                        >
                          <span>Open YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 w-full pt-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 px-0.5">
                        <span className={`${theme.text} font-bold`}>{formatTime(currentTime)}</span>
                        <span className="text-zinc-500 font-medium">{formatTime(duration)}</span>
                      </div>
                      <div className="relative w-full flex items-center h-3 group cursor-pointer">
                        <input
                          type="range"
                          min={0}
                          max={duration > 0 ? duration : 100}
                          step={0.1}
                          value={currentTime}
                          onMouseDown={() => setIsScrubbing(true)}
                          onMouseUp={() => setIsScrubbing(false)}
                          onTouchStart={() => setIsScrubbing(true)}
                          onTouchEnd={() => setIsScrubbing(false)}
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all hover:h-2"
                          style={{
                            background: `linear-gradient(to right, ${theme.accentHex} 0%, ${theme.accentHex} ${
                              duration > 0 ? (currentTime / duration) * 100 : 0
                            }%, #27272a ${
                              duration > 0 ? (currentTime / duration) * 100 : 0
                            }%, #27272a 100%)`
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Player Buttons Control Bar */}
                  <div className="flex items-center justify-between pt-1">
                    {/* Left Actions: Video Toggle */}
                    <button
                      onClick={() => setShowVideo(!showVideo)}
                      className={`p-1.5 px-2.5 rounded-lg border text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        showVideo
                          ? `${theme.subtleBg}`
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                      title="Toggle Video Embed View"
                    >
                      <Video className={`w-3.5 h-3.5 ${theme.text}`} />
                      <span>{showVideo ? 'Hide Clip' : 'View Clip'}</span>
                    </button>

                    {/* Central Controls: Shuffle, Prev, Play/Pause, Next */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={toggleShuffleMode}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          !userSelectedTrack && isShuffle ? `${theme.text} ${theme.subtleBg}` : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={!userSelectedTrack && isShuffle ? "Random Radio Active (Click for Sequential)" : "Sequential / Locked Track (Click for Random Radio)"}
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handlePrevSong}
                        disabled={playlistVideos.length === 0}
                        className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                        title="Previous Song"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>
                      <button
                        onClick={togglePlayPause}
                        disabled={playlistVideos.length === 0}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${theme.playButton}`}
                        title={sceneRadioPlaying ? "Pause" : "Play"}
                      >
                        {sceneRadioPlaying ? (
                          <Pause className={`w-4 h-4 ${theme.playIcon}`} />
                        ) : (
                          <Play className={`w-4 h-4 ml-0.5 ${theme.playIcon}`} />
                        )}
                      </button>
                      <button
                        onClick={handleNextSong}
                        disabled={playlistVideos.length === 0}
                        className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                        title="Next Song"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right Actions: Current track count */}
                    <div className="text-[9.5px] font-mono text-zinc-500 uppercase tracking-widest">
                      {playlistVideos.length > 0 ? `${currentVideoIndex + 1}/${playlistVideos.length}` : '0/0'}
                    </div>
                  </div>
                </div>

                {/* Playlist View Panel */}
                <div className="flex-grow flex flex-col overflow-hidden min-h-0 bg-zinc-950/90 backdrop-blur-sm">
                  {/* Playlist Search/Header */}
                  <div className="px-3 py-2 border-b border-zinc-900 flex items-center justify-between bg-zinc-950 shrink-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                      <Music className={`w-3.5 h-3.5 ${theme.text} shrink-0`} />
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-300 font-mono shrink-0">PLAYLIST QUEUE</span>
                      <a
                        href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex]?.videoId || 'JCN8qkWVu1w'}&list=${RADIO_PLAYLISTS[selectedRadioGenre]?.playlistId || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer shrink-0 ${theme.subtleBg}`}
                        title={`Open ${RADIO_PLAYLISTS[selectedRadioGenre].name} playlist on YouTube`}
                      >
                        <ExternalLink className={`w-2.5 h-2.5 ${theme.text}`} />
                        <span>OPEN ON YOUTUBE</span>
                      </a>
                      <button
                        onClick={toggleShuffleMode}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer shrink-0 ${
                          !userSelectedTrack && isShuffle
                            ? `${theme.subtleBg}`
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                        title={!userSelectedTrack && isShuffle ? "Endless Random Radio Mode Active. Click to switch to sequential mode." : "Track Locked. Click to switch to endless random mode."}
                      >
                        <Sparkles className={`w-2.5 h-2.5 ${theme.text}`} />
                        <span>{!userSelectedTrack && isShuffle ? 'RANDOM RADIO' : 'LOCKED TRACK'}</span>
                      </button>
                    </div>
                    {/* Search Field */}
                    <div className="relative w-1/2 max-w-xs">
                      <input
                        type="text"
                        placeholder="Search songs..."
                        value={searchPlaylistQuery}
                        onChange={(e) => setSearchPlaylistQuery(e.target.value)}
                        className={`w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[9.5px] text-zinc-300 focus:outline-none focus:${theme.border} font-mono`}
                      />
                    </div>
                  </div>

                  {/* Playlist Videos List */}
                  <div className="flex-grow overflow-y-auto min-h-0 p-2 space-y-1 custom-scrollbar max-h-[180px] sm:max-h-[220px]">
                    {isLoadingPlaylist ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-zinc-500 font-mono text-[9.5px]">
                        <RefreshCw className={`w-4 h-4 animate-spin ${theme.text}`} />
                        <span>Loading scene tracks...</span>
                      </div>
                    ) : playlistVideos.length === 0 ? (
                      <div className="text-center py-6 text-zinc-600 font-mono text-[9px]">
                        No tracks found.
                      </div>
                    ) : (
                      playlistVideos
                        .map((video, idx) => ({ ...video, originalIndex: idx }))
                        .filter(v => v.title.toLowerCase().includes(searchPlaylistQuery.toLowerCase()))
                        .map((video, vIdx) => {
                          const isCurrent = video.originalIndex === currentVideoIndex;
                          return (
                            <div
                              key={`video-item-${video.videoId || ''}-${video.originalIndex}-${vIdx}`}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelectSpecificTrack(video);
                                }
                              }}
                              onClick={() => {
                                handleSelectSpecificTrack(video);
                              }}
                              className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left transition-all cursor-pointer border ${
                                isCurrent
                                  ? `${theme.subtleBg}`
                                  : 'bg-zinc-900/30 hover:bg-zinc-900/80 border-transparent text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {/* Video Index / Miniature disc spinner */}
                              <div className="w-4 text-center shrink-0">
                                {isCurrent && sceneRadioPlaying ? (
                                  <span className="flex items-center justify-center gap-0.5">
                                    <span className={`w-0.5 h-2.5 ${theme.primaryBg} animate-[bounce_0.6s_infinite]`} />
                                    <span className={`w-0.5 h-3 ${theme.primaryBg} animate-[bounce_0.8s_infinite_0.1s]`} />
                                    <span className={`w-0.5 h-1.5 ${theme.primaryBg} animate-[bounce_0.5s_infinite_0.2s]`} />
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono font-bold text-zinc-600">
                                    {video.originalIndex + 1}
                                  </span>
                                )}
                              </div>

                              {/* Tiny art cover */}
                              <div className="relative w-7 h-7 rounded bg-black overflow-hidden border border-zinc-850 shrink-0">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={video.thumbnailUrl}
                                  alt="cover"
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>

                              {/* Titles */}
                              <div className="flex-grow min-w-0 flex flex-col">
                                <span className="text-[10px] font-bold truncate tracking-tight font-mono">
                                  {video.title}
                                </span>
                                <span className="text-[8.5px] text-zinc-500 truncate font-mono">
                                  {video.author}
                                </span>
                              </div>

                              {/* Share & Heart Action Buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShareTrackPost(video);
                                  }}
                                  className={`p-1 rounded text-zinc-600 hover:${theme.text} transition-colors`}
                                  title="Share track as post"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleLikeTrack(video.videoId, video.title);
                                  }}
                                  className={`p-1 rounded transition-colors ${
                                    likedTrackIds.has(video.videoId) ? `${theme.text} scale-110` : 'text-zinc-600 hover:text-zinc-400'
                                  }`}
                                  title={likedTrackIds.has(video.videoId) ? "Unlike song" : "Favorite song"}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${likedTrackIds.has(video.videoId) ? `fill-current ${theme.text}` : ''}`} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DOCKED BOTTOM FOOTER PLAYER BAR (Always visible at the bottom of the feed) */}
          <div className="relative w-full max-w-7xl mx-auto h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 select-none">
            {/* Live Progress Bar on Top Border of Docked Footer */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-900/90 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 bg-gradient-to-r ${theme.progressFromTo}`}
                style={{
                  width: duration > 0 ? `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` : (sceneRadioPlaying ? '100%' : '0%')
                }}
              />
            </div>

            {/* Left Section: Track Info & Vinyl */}
            <div
              onClick={() => setIsRadioExpanded(!isRadioExpanded)}
              className="flex items-center gap-2.5 min-w-0 max-w-[45%] sm:max-w-[40%] cursor-pointer group"
              title="Click to toggle Queue & Channels"
            >
              {/* Currently Playing Track Artwork Thumbnail */}
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:border-zinc-700 transition-colors">
                {(() => {
                  const currentTrack = playlistVideos[currentVideoIndex];
                  const thumb = currentTrack?.thumbnailUrl || (currentTrack?.videoId ? `https://i.ytimg.com/vi/${currentTrack.videoId}/hqdefault.jpg` : null);
                  if (thumb) {
                    return (
                      <img
                        referrerPolicy="no-referrer"
                        src={thumb}
                        alt={currentTrack?.title || 'Track Artwork'}
                        className="w-full h-full object-cover"
                      />
                    );
                  }
                  return (
                    <Disc className={`w-4 h-4 ${theme.text} ${sceneRadioPlaying ? 'animate-spin' : ''}`} />
                  );
                })()}
              </div>

              {/* Title & Channel Marquee */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping shrink-0 ${theme.text}`} />
                  <span className={`text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider font-mono truncate ${theme.text}`}>
                    SCENE RADIO • {RADIO_PLAYLISTS[selectedRadioGenre].name} {duration > 0 && `[${formatTime(currentTime)} / ${formatTime(duration)}]`}
                  </span>
                </div>
                <div className="w-full overflow-hidden whitespace-nowrap text-xs font-bold text-zinc-100 tracking-tight font-mono">
                  <span className={`inline-block ${sceneRadioPlaying && playlistVideos.length > 0 ? 'animate-marquee-slow' : 'truncate'}`}>
                    {playlistVideos.length > 0 ? (playlistVideos[currentVideoIndex]?.title || 'Loading...') : RADIO_PLAYLISTS[selectedRadioGenre].name}
                  </span>
                </div>
              </div>
            </div>

            {/* Center Section: Quick Channel Selector (Hidden on mobile, visible on lg+) */}
            <div className="hidden lg:flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 max-w-[35%]">
              {(Object.keys(RADIO_PLAYLISTS) as Array<keyof typeof RADIO_PLAYLISTS>).slice(0, 5).map((genreKey, gIdx) => {
                const isActive = selectedRadioGenre === genreKey;
                return (
                  <button
                    key={`radio-quick-genre-${genreKey}-${gIdx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectGenre(genreKey);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[8.5px] font-black uppercase tracking-wider font-mono shrink-0 transition-all border cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? `${theme.primaryBg} animate-pulse ring-1 ${theme.ring}`
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                    )}
                    {RADIO_PLAYLISTS[genreKey].name.split(' ')[0]}
                  </button>
                );
              })}
            </div>

            {/* Right Section: Playback Controls & Expand Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Prev Song */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevSong();
                }}
                disabled={playlistVideos.length === 0}
                className="p-1 sm:p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                title="Previous Track"
              >
                <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Play / Pause Button */}
              <FirstTimeTooltip
                id="scene_radio_play"
                title="Scene Radio"
                tip="Play heavy underground metal streams that continue in the background while you browse."
                position="top"
                accentColor="rose"
                autoShow={true}
                autoShowDelay={1800}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlayPause();
                  }}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${theme.playButton}`}
                  title={sceneRadioPlaying ? "Pause" : "Play"}
                >
                  {sceneRadioPlaying ? (
                    <Pause className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.playIcon}`} />
                  ) : (
                    <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 ${theme.playIcon}`} />
                  )}
                </button>
              </FirstTimeTooltip>

              {/* Next Song */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextSong();
                }}
                disabled={playlistVideos.length === 0}
                className="p-1 sm:p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                title="Next Track"
              >
                <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Share Track as Post Button (Visible when player expanded) */}
              {isRadioExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const curTrack = playlistVideos[currentVideoIndex];
                    if (curTrack) {
                      handleShareTrackPost(curTrack);
                    }
                  }}
                  disabled={playlistVideos.length === 0}
                  className={`p-1 sm:p-1.5 text-zinc-500 hover:${theme.text} disabled:opacity-30 cursor-pointer transition-colors`}
                  title="Share Track as Feed Post"
                >
                  <Share2 className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.text}`} />
                </button>
              )}

              {/* Heart Favorite / Like Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const curTrack = playlistVideos[currentVideoIndex];
                  if (curTrack) {
                    toggleLikeTrack(curTrack.videoId, curTrack.title);
                  }
                }}
                disabled={playlistVideos.length === 0}
                className={`p-1 sm:p-1.5 transition-colors cursor-pointer ${
                  likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId)
                    ? `${theme.text} scale-110`
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? "Unlike Track" : "Favorite Track"}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? `fill-current ${theme.text}` : ''}`} />
              </button>

              {/* Discreet Follow Band Button (Opens Follow Modal) */}
              {matchedBandProfile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFollowBandPopup(true);
                  }}
                  className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer ${
                    isFollowingMatched
                      ? 'text-emerald-400 hover:text-emerald-300'
                      : `text-zinc-500 hover:${theme.text}`
                  }`}
                  title={isFollowingMatched ? `Following ${matchedBandProfile.name} (Click for Band Profile)` : `Follow ${matchedBandProfile.name} on Nexus`}
                >
                  {isFollowingMatched ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  ) : (
                    <UserPlus className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.text}`} />
                  )}
                </button>
              )}

              {/* Volume Slider Control */}
              <div className="hidden sm:flex items-center gap-1.5 ml-1 pl-2 border-l border-zinc-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const newVol = radioVolume > 0 ? 0 : 100;
                    setRadioVolume(newVol);
                    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
                      ytPlayerRef.current.setVolume(newVol);
                    }
                  }}
                  className="text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  title={radioVolume > 0 ? "Mute Volume" : "Unmute Volume"}
                >
                  {radioVolume > 0 ? <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> : <VolumeX className={`w-3.5 h-3.5 ${theme.text}`} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={radioVolume}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleRadioVolumeChange(e);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: theme.accentHex }}
                  title={`Volume: ${radioVolume}%`}
                />
              </div>

              {/* Open directly on YouTube Button (Visible when player expanded) */}
              {isRadioExpanded && playlistVideos[currentVideoIndex]?.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex].videoId}&list=${RADIO_PLAYLISTS[selectedRadioGenre]?.playlistId || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`p-1 sm:p-1.5 text-zinc-500 hover:${theme.text} transition-colors flex items-center justify-center cursor-pointer`}
                  title="Open on YouTube (Bypass Age Gate)"
                >
                  <ExternalLink className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.text}`} />
                </a>
              )}

              {/* Video Clip Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isRadioExpanded) setIsRadioExpanded(true);
                  setShowVideo(!showVideo);
                }}
                className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold hidden sm:flex items-center gap-1 transition-all cursor-pointer ${
                  showVideo
                    ? theme.activeBadge
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Clip Video View"
              >
                <Video className={`w-3.5 h-3.5 ${theme.text}`} />
                <span className="hidden md:inline">{showVideo ? 'Hide Clip' : 'Clip'}</span>
              </button>

              {/* Tuck / Minimize Radio Bar Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTucked(true);
                  if (isRadioExpanded) setIsRadioExpanded(false);
                }}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Tuck Radio to Mini-Pill (Free up bottom screen)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>

              {/* Queue Expand/Collapse Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRadioExpanded(!isRadioExpanded);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                  isRadioExpanded
                    ? theme.activeBadge
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                }`}
                title={isRadioExpanded ? "Collapse Queue" : "Expand Queue & Channels"}
              >
                {isRadioExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>

              {/* Close/Tuck Scene Radio Footer (Visible when player expanded) */}
              {isRadioExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTucked(true);
                    setIsRadioExpanded(false);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white flex items-center justify-center border border-zinc-800 transition-colors cursor-pointer"
                  title="Tuck Scene Radio Player to Mini-Pill"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Follow Band Interactive Popup Modal */}
    <AnimatePresence>
      {showFollowBandPopup && matchedBandProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
          onClick={() => setShowFollowBandPopup(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md bg-zinc-950 border ${theme.border} rounded-2xl p-5 sm:p-6 ${theme.glow} flex flex-col gap-4 text-left relative overflow-hidden`}
          >
            {/* Ambient background glow */}
            <div
              className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl pointer-events-none opacity-30"
              style={{ backgroundColor: theme.accentHex }}
            />

            <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${theme.text} animate-pulse`} />
                <span className={`text-xs font-black font-mono uppercase tracking-widest ${theme.text}`}>
                  Follow Band on Nexus Core
                </span>
              </div>
              <button
                onClick={() => setShowFollowBandPopup(false)}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-3.5 pt-1">
              <img
                src={matchedBandProfile.avatar || matchedBandProfile.image}
                alt={matchedBandProfile.name}
                className={`w-16 h-16 rounded-xl object-cover border-2 ${theme.border} shrink-0 shadow-lg`}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-base sm:text-lg font-black text-white font-mono truncate tracking-tight">
                  {matchedBandProfile.name}
                </span>
                <span className={`text-xs ${theme.text} font-mono font-semibold`}>
                  {matchedBandProfile.genre || 'Scene Radio Featured Artist'}
                </span>
                <p className="text-[11px] text-zinc-400 font-mono line-clamp-2 mt-1 leading-relaxed">
                  {matchedBandProfile.desc || `Official band profile for ${matchedBandProfile.name} on the Nexus Core network.`}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-zinc-850">
              <button
                onClick={() => {
                  handleToggleFollowMatched();
                }}
                className={`w-full py-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg ${
                  isFollowingMatched
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-950/40'
                    : `${theme.primaryBg} border-transparent animate-pulse`
                }`}
              >
                {isFollowingMatched ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Following {matchedBandProfile.name} on Nexus</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>+ Follow {matchedBandProfile.name} on Nexus</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowFollowBandPopup(false);
                    window.dispatchEvent(new CustomEvent('nexus_open_public_profile', {
                      detail: { profile: matchedBandProfile }
                    }));
                    triggerNotification?.(`👤 Opening ${matchedBandProfile.name}'s Profile...`);
                  }}
                  className="py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <User className={`w-3.5 h-3.5 ${theme.text}`} />
                  <span>Public Profile</span>
                </button>
                <button
                  onClick={() => setShowFollowBandPopup(false)}
                  className="py-2.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-zinc-200 text-xs font-mono font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};
