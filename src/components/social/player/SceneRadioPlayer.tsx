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
  VolumeX
} from 'lucide-react';
import { RADIO_PLAYLISTS, FRONTEND_FALLBACK_PLAYLISTS } from '../../../data/socialFeedMockData';
import {
  initGlobalMediaInterceptors,
  SCENE_RADIO_PAUSE_EVENT,
  LEGACY_RADIO_PAUSE_EVENT,
  markSceneRadioUserActive,
  isSceneRadioImmune
} from '../utils/mediaPlaybackCoordinator';

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
  
  // Live Song Progress & Duration States
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [radioVolume, setRadioVolume] = useState<number>(100);

  const handleRadioVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setRadioVolume(val);
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

    // Copy direct YouTube URL to clipboard
    const ytUrl = `https://www.youtube.com/watch?v=${track.videoId}`;
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(ytUrl).catch(() => {});
    }

    triggerNotification?.(`🚀 Track "${track.title}" loaded into Post Creator! Edit & Post to publish.`);
  };

  const ytPlayerRef = useRef<any>(null);
  const hasUserInteractedWithRadio = useRef(false);

  // Poll current playback position & total duration from YouTube Iframe API
  useEffect(() => {
    let interval: any = null;
    if (sceneRadioPlaying) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            if (!isScrubbing) {
              setCurrentTime(cur);
            }
            if (dur > 0) {
              setDuration(dur);
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
    if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
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
        sceneRadioPlayingRef.current = false;
        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
          try {
            ytPlayerRef.current.pauseVideo();
          } catch (e) {
            // ignore
          }
        }
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
    } catch (e) {
      console.warn("[RADIO PLAYER] Failed to enrich playlist:", e);
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

           // Sync newly retrieved title back to server database cache asynchronously
           if (videoData.title && !videoData.title.startsWith("Track ")) {
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
              setSceneRadioPlaying(true);
              setRadioPlayerError(null);
            } else if (event.data === 2) { // Paused
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
    if (!sceneRadioPlaying) {
      markSceneRadioUserActive(3000);
    }
    if (!ytPlayerRef.current || typeof ytPlayerRef.current.playVideo !== 'function') {
      const playlistId = RADIO_PLAYLISTS[selectedRadioGenre].playlistId;
      setSceneRadioPlaying(true);
      initYoutubePlayer(playlistId, currentVideoIndex);
      return;
    }

    try {
      if (sceneRadioPlaying) {
        ytPlayerRef.current.pauseVideo();
        setSceneRadioPlaying(false);
      } else {
        markSceneRadioUserActive(3000);
        ytPlayerRef.current.playVideo();
        setSceneRadioPlaying(true);
      }
    } catch (err) {
      console.error("[RADIO PLAYER] Error calling play/pause on YT player:", err);
    }
  };

  const handleNextSong = () => {
    hasUserInteractedWithRadio.current = true;
    markSceneRadioUserActive(3000);
    // In continuous random radio mode, skip to a random track
    if (!userSelectedTrackRef.current && playlistVideos.length > 1) {
      const nextIdx = getRandomTrackIndex(playlistVideos.length, currentVideoIndex);
      setCurrentVideoIndex(nextIdx);
      currentVideoIndexRef.current = nextIdx;
      if (ytPlayerRef.current) {
        if (typeof ytPlayerRef.current.getPlaylist === 'function') {
          const ids = ytPlayerRef.current.getPlaylist() || [];
          const targetId = playlistVideos[nextIdx]?.videoId;
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
        setCurrentVideoIndex(prevIndex => (prevIndex + 1) % Math.max(playlistVideos.length, 1));
      }
    }
  };

  const handlePrevSong = () => {
    hasUserInteractedWithRadio.current = true;
    markSceneRadioUserActive(3000);
    if (!userSelectedTrackRef.current && playlistVideos.length > 1) {
      const prevIdx = getRandomTrackIndex(playlistVideos.length, currentVideoIndex);
      setCurrentVideoIndex(prevIdx);
      currentVideoIndexRef.current = prevIdx;
      if (ytPlayerRef.current) {
        if (typeof ytPlayerRef.current.getPlaylist === 'function') {
          const ids = ytPlayerRef.current.getPlaylist() || [];
          const targetId = playlistVideos[prevIdx]?.videoId;
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
        setCurrentVideoIndex(prevIndex => (prevIndex - 1 + playlistVideos.length) % Math.max(playlistVideos.length, 1));
      }
    }
  };

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

  // Auto-play random track 5 seconds after social feed / scene radio mounts
  useEffect(() => {
    const autoPlayTimer = setTimeout(() => {
      if (!hasUserInteractedWithRadio.current) {
        console.log("[RADIO PLAYER] Auto-playing random track after feed mount...");
        setSceneRadioPlaying(true);
        if (ytPlayerRef.current) {
          try {
            if (typeof ytPlayerRef.current.getPlaylist === 'function') {
              const ids = ytPlayerRef.current.getPlaylist() || [];
              if (ids.length > 0 && typeof ytPlayerRef.current.playVideoAt === 'function') {
                  const targetIdx = !userSelectedTrackRef.current
                    ? (currentVideoIndexRef.current >= 0 && currentVideoIndexRef.current < ids.length ? currentVideoIndexRef.current : getRandomTrackIndex(ids.length))
                    : 0;
                  ytPlayerRef.current.playVideoAt(targetIdx);
              } else if (typeof ytPlayerRef.current.playVideo === 'function') {
                  ytPlayerRef.current.playVideo();
              }
            } else if (typeof ytPlayerRef.current.playVideo === 'function') {
              ytPlayerRef.current.playVideo();
            }
          } catch (e) {
            console.warn("[RADIO PLAYER] Auto-play call error:", e);
          }
        }
      }
    }, 5000);

    return () => {
      clearTimeout(autoPlayTimer);
    };
  }, []);

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
        const response = await fetch(`/api/playlist/${playlistId}`);
        if (!response.ok) throw new Error("Could not fetch playlist feed");
        const data = await response.json();

        if (active && data && data.videos && data.videos.length > 0) {
          setPlaylistVideos(data.videos);
          if (!userSelectedTrackRef.current) {
            const randIdx = getRandomTrackIndex(data.videos.length, currentVideoIndexRef.current);
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

  return (
    <>
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

      <AnimatePresence>
        {showSceneRadio && activeTab !== 'reels' && !(activeTab === 'messages' && selectedChatId) && (
        <motion.div
          key="scene-radio-footer-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`fixed bottom-0 left-0 right-0 ${
            isRadioExpanded ? 'z-[9999]' : 'z-[9990]'
          } w-full bg-[#09090b]/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-[0_-4px_30px_rgba(0,0,0,0.85)] flex flex-col group transition-all duration-300 ${
            traysHiddenOnMobile ? 'pointer-events-none opacity-0 translate-y-12' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* PERSISTENT YOUTUBE PLAYER EMBED (Kept continuously mounted so audio never stops when minimizing) */}
          <div
            data-scene-radio="true"
            className={`w-full max-w-5xl mx-auto bg-black relative overflow-hidden transition-all duration-300 shrink-0 ${
              isRadioExpanded && showVideo
                ? 'h-[160px] opacity-100 border-b border-zinc-800'
                : 'h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div id="youtube-radio-player" data-scene-radio="true" className="absolute inset-0 bg-black w-full h-full" />
          </div>

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
                        className={`px-3.5 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider font-mono shrink-0 transition-all border cursor-pointer min-h-[38px] sm:min-h-[42px] flex items-center justify-center ${
                          isActive
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/60 scale-[1.02]'
                            : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 active:scale-95'
                        }`}
                      >
                        {RADIO_PLAYLISTS[genreKey].name.split(' ').map((word, wIdx) => (
                          <span key={`radio-word-${genreKey}-${wIdx}-${word}`} className={wIdx > 0 ? 'text-rose-300 ml-0.5' : ''}>{word} </span>
                        ))}
                      </button>
                    );
                  })}
                </div>

                {/* Active Track Control Panel */}
                <div className="p-3 sm:p-4 bg-gradient-to-b from-zinc-900/80 via-zinc-950 to-zinc-950 flex flex-col gap-3 border-b border-zinc-900 shrink-0 relative">
                  {/* Title & Artist Display */}
                  <div className="flex items-center gap-3">
                    {/* Disc / Thumbnail */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-black overflow-hidden border border-zinc-800 shrink-0 shadow-md group-hover:border-rose-500/40 transition-colors">
                      {playlistVideos[currentVideoIndex]?.thumbnailUrl ? (
                        <img
                          referrerPolicy="no-referrer"
                          src={playlistVideos[currentVideoIndex].thumbnailUrl}
                          alt="Album Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-rose-500">
                          <Radio className="w-6 h-6 animate-pulse" />
                        </div>
                      )}
                      {sceneRadioPlaying && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping" />
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
                      <span className="text-[10px] sm:text-xs text-rose-400/90 truncate font-mono mt-0.5">
                        {playlistVideos[currentVideoIndex]?.author || 'Unknown Channel'}
                      </span>
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
                        <Share2 className="w-4 h-4 text-rose-400" />
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
                            ? 'bg-rose-950/80 border-rose-500/50 text-rose-400 scale-105 shadow-sm shadow-rose-950'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                        title={likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? "Unlike Song" : "Favorite Song"}
                      >
                        <Heart className={`w-4 h-4 ${likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                      {playlistVideos[currentVideoIndex]?.videoId && (
                        <a
                          href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex].videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors flex items-center justify-center"
                          title="Open directly on YouTube (Bypass Age Gate)"
                        >
                          <ExternalLink className="w-4 h-4 text-rose-400" />
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
                          href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex].videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 shrink-0 transition-all shadow-md shadow-rose-950 cursor-pointer"
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
                        <span className="text-rose-400 font-bold">{formatTime(currentTime)}</span>
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
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none transition-all hover:h-2"
                          style={{
                            background: `linear-gradient(to right, #e11d48 0%, #e11d48 ${
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
                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                      title="Toggle Video Embed View"
                    >
                      <Video className="w-3.5 h-3.5 text-rose-400" />
                      <span>{showVideo ? 'Hide Clip' : 'View Clip'}</span>
                    </button>

                    {/* Central Controls: Shuffle, Prev, Play/Pause, Next */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={toggleShuffleMode}
                        className={`p-1.5 rounded transition-colors cursor-pointer ${
                          !userSelectedTrack && isShuffle ? 'text-rose-400 bg-rose-950/50 border border-rose-500/30' : 'text-zinc-500 hover:text-zinc-300'
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
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                          isBandWorkspace
                            ? 'bg-[#39ff14] hover:bg-[#28d00d] text-black shadow-lg shadow-[#39ff14]/30'
                            : portalRole === 'promoter'
                            ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-lg shadow-yellow-500/30'
                            : portalRole === 'fan_only'
                            ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-lg shadow-cyan-500/30'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60'
                        }`}
                        title={sceneRadioPlaying ? "Pause" : "Play"}
                      >
                        {sceneRadioPlaying ? (
                          <Pause className={`w-4 h-4 ${isBandWorkspace || portalRole === 'promoter' || portalRole === 'fan_only' ? 'fill-black text-black' : 'fill-white text-white'}`} />
                        ) : (
                          <Play className={`w-4 h-4 ml-0.5 ${isBandWorkspace || portalRole === 'promoter' || portalRole === 'fan_only' ? 'fill-black text-black' : 'fill-white text-white'}`} />
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
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Music className="w-3.5 h-3.5 text-rose-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-300 font-mono">PLAYLIST QUEUE</span>
                      <button
                        onClick={toggleShuffleMode}
                        className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                          !userSelectedTrack && isShuffle
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                        }`}
                        title={!userSelectedTrack && isShuffle ? "Endless Random Radio Mode Active. Click to switch to sequential mode." : "Track Locked. Click to switch to endless random mode."}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-rose-400" />
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
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[9.5px] text-zinc-300 focus:outline-none focus:border-rose-500/50 font-mono"
                      />
                    </div>
                  </div>

                  {/* Playlist Videos List */}
                  <div className="flex-grow overflow-y-auto min-h-0 p-2 space-y-1 custom-scrollbar max-h-[180px] sm:max-h-[220px]">
                    {isLoadingPlaylist ? (
                      <div className="flex flex-col items-center justify-center py-6 gap-2 text-zinc-500 font-mono text-[9.5px]">
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
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
                                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                                  : 'bg-zinc-900/30 hover:bg-zinc-900/80 border-transparent text-zinc-400 hover:text-zinc-200'
                              }`}
                            >
                              {/* Video Index / Miniature disc spinner */}
                              <div className="w-4 text-center shrink-0">
                                {isCurrent && sceneRadioPlaying ? (
                                  <span className="flex items-center justify-center gap-0.5">
                                    <span className="w-0.5 h-2.5 bg-rose-500 animate-[bounce_0.6s_infinite]" />
                                    <span className="w-0.5 h-3 bg-rose-400 animate-[bounce_0.8s_infinite_0.1s]" />
                                    <span className="w-0.5 h-1.5 bg-rose-500 animate-[bounce_0.5s_infinite_0.2s]" />
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
                                  className="p-1 rounded text-zinc-600 hover:text-rose-400 transition-colors"
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
                                    likedTrackIds.has(video.videoId) ? 'text-rose-500 scale-110' : 'text-zinc-600 hover:text-zinc-400'
                                  }`}
                                  title={likedTrackIds.has(video.videoId) ? "Unlike song" : "Favorite song"}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${likedTrackIds.has(video.videoId) ? 'fill-rose-500 text-rose-500' : ''}`} />
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
                className={`h-full transition-all duration-300 ${
                  isBandWorkspace
                    ? 'bg-gradient-to-r from-[#39ff14] via-[#00ffcc] to-emerald-400'
                    : portalRole === 'promoter'
                    ? 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-300'
                    : portalRole === 'fan_only'
                    ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-400'
                    : 'bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400'
                }`}
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
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden shadow-sm group-hover:border-rose-500/50 transition-colors">
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
                    <Disc className={`w-4 h-4 ${isBandWorkspace ? 'text-[#39ff14]' : portalRole === 'promoter' ? 'text-yellow-400' : portalRole === 'fan_only' ? 'text-cyan-400' : 'text-rose-500'} ${sceneRadioPlaying ? 'animate-spin' : ''}`} />
                  );
                })()}
              </div>

              {/* Title & Channel Marquee */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping shrink-0 ${
                    isBandWorkspace ? 'bg-[#39ff14]' : portalRole === 'promoter' ? 'bg-yellow-400' : portalRole === 'fan_only' ? 'bg-cyan-400' : 'bg-rose-500'
                  }`} />
                  <span className={`text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider font-mono truncate ${
                    isBandWorkspace ? 'text-[#39ff14]' : portalRole === 'promoter' ? 'text-yellow-400' : portalRole === 'fan_only' ? 'text-cyan-400' : 'text-rose-400'
                  }`}>
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

            {/* Center Section: Quick Channel Selector (Hidden on mobile, visible on md+) */}
            <div className="hidden lg:flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 max-w-[30%]">
              {(Object.keys(RADIO_PLAYLISTS) as Array<keyof typeof RADIO_PLAYLISTS>).slice(0, 4).map((genreKey, gIdx) => {
                const isActive = selectedRadioGenre === genreKey;
                return (
                  <button
                    key={`radio-quick-genre-${genreKey}-${gIdx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectGenre(genreKey);
                    }}
                    className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider font-mono shrink-0 transition-all border cursor-pointer ${
                      isActive
                        ? 'bg-rose-600/90 text-white border-rose-500'
                        : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                    }`}
                  >
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayPause();
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                  isBandWorkspace
                    ? 'bg-[#39ff14] hover:bg-[#28d00d] text-black shadow-md shadow-[#39ff14]/30'
                    : portalRole === 'promoter'
                    ? 'bg-yellow-400 hover:bg-yellow-300 text-black shadow-md shadow-yellow-500/30'
                    : portalRole === 'fan_only'
                    ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-md shadow-cyan-500/30'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/60'
                }`}
                title={sceneRadioPlaying ? "Pause" : "Play"}
              >
                {sceneRadioPlaying ? (
                  <Pause className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBandWorkspace || portalRole === 'promoter' || portalRole === 'fan_only' ? 'fill-black text-black' : 'fill-white text-white'}`} />
                ) : (
                  <Play className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5 ${isBandWorkspace || portalRole === 'promoter' || portalRole === 'fan_only' ? 'fill-black text-black' : 'fill-white text-white'}`} />
                )}
              </button>

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
                  className="p-1 sm:p-1.5 text-zinc-500 hover:text-rose-400 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Share Track as Feed Post"
                >
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
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
                    ? 'text-rose-500 scale-110'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? "Unlike Track" : "Favorite Track"}
              >
                <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${likedTrackIds.has(playlistVideos[currentVideoIndex]?.videoId) ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>

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
                  {radioVolume > 0 ? <Volume2 className="w-3.5 h-3.5 text-zinc-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
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
                  className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  title={`Volume: ${radioVolume}%`}
                />
              </div>

              {/* Open directly on YouTube Button (Visible when player expanded) */}
              {isRadioExpanded && playlistVideos[currentVideoIndex]?.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${playlistVideos[currentVideoIndex].videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 sm:p-1.5 text-zinc-500 hover:text-rose-400 transition-colors flex items-center justify-center cursor-pointer"
                  title="Open on YouTube (Bypass Age Gate)"
                >
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
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
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title="Toggle Clip Video View"
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">{showVideo ? 'Hide Clip' : 'Clip'}</span>
              </button>

              {/* Queue Expand/Collapse Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRadioExpanded(!isRadioExpanded);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                  isRadioExpanded
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
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

              {/* Close/Hide Scene Radio Footer (Visible when player expanded) */}
              {isRadioExpanded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSceneRadio(false);
                  }}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 hover:bg-rose-950/80 text-zinc-500 hover:text-rose-300 flex items-center justify-center border border-zinc-800 hover:border-rose-800/50 transition-colors cursor-pointer"
                  title="Hide Scene Radio Footer"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </>
  );
};
