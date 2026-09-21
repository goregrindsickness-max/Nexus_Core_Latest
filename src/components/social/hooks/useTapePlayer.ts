import { useState, useRef, useEffect } from 'react';
import { uploadFeedMedia } from '../../../lib/storage';
import { isAudioUrl } from '../../../utils/socialFeedUtils';
import { getAudioFileDuration } from '../../../utils/audioEngine';
import type { FeedItem } from '../../../data/socialFeedMockData';
import { requestPauseSceneRadio } from '../utils/mediaPlaybackCoordinator';

interface UseTapePlayerOptions {
  feed: FeedItem[];
  userProfile?: any;
  triggerNotification?: (msg: string) => void;
  tapeFileInputRef?: React.RefObject<HTMLInputElement | null>;
  setTapeAudioUrl: (url: string) => void;
  setTapeTitle: React.Dispatch<React.SetStateAction<string>>;
  setTapeBand: React.Dispatch<React.SetStateAction<string>>;
  setTapeDuration: (dur: string) => void;
  setIsUploadingTapeAudio: (val: boolean) => void;
  setTapeAudioFileName: (name: string) => void;
  tapeTitle: string;
  tapeBand: string;
}

export function useTapePlayer({
  feed,
  userProfile,
  triggerNotification,
  tapeFileInputRef,
  setTapeAudioUrl,
  setTapeTitle,
  setTapeBand,
  setTapeDuration,
  setIsUploadingTapeAudio,
  setTapeAudioFileName,
  tapeTitle,
  tapeBand
}: UseTapePlayerOptions) {
  const [playingTapeId, setPlayingTapeId] = useState<string | null>(null);
  const [tapeProgress, setTapeProgress] = useState<Record<string, number>>({});
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleTapeAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTapeAudio(true);
    setTapeAudioFileName(file.name);

    // Calculate duration immediately from raw file buffer
    try {
      const durResult = await getAudioFileDuration(file);
      if (durResult && durResult.duration) {
        setTapeDuration(durResult.duration);
      }
    } catch (e) {
      console.warn('[TapePlayer] Duration extraction preview warning:', e);
    }

    try {
      const publicUrl = await uploadFeedMedia(file);
      if (publicUrl) {
        setTapeAudioUrl(publicUrl);
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        if (!tapeTitle.trim()) {
          setTapeTitle(cleanName);
        }
        if (!tapeBand.trim() && userProfile?.name) {
          setTapeBand(userProfile.name);
        }
        if (typeof triggerNotification === 'function') {
          triggerNotification("Audio tape attached: " + cleanName);
        }
      } else {
        // Data URL fallback if storage bucket is unreachable
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            setTapeAudioUrl(dataUrl);
            const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
            if (!tapeTitle.trim()) setTapeTitle(cleanName);
            if (!tapeBand.trim() && userProfile?.name) setTapeBand(userProfile.name);
            if (typeof triggerNotification === 'function') triggerNotification("Audio tape attached locally!");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("[TapeAudioUpload Error]:", err);
      // Fallback on catch
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setTapeAudioUrl(dataUrl);
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          if (!tapeTitle.trim()) setTapeTitle(cleanName);
          if (!tapeBand.trim() && userProfile?.name) setTapeBand(userProfile.name);
          if (typeof triggerNotification === 'function') triggerNotification("Audio tape attached locally!");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingTapeAudio(false);
      if (tapeFileInputRef?.current) tapeFileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!playingTapeId) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      return;
    }

    const post = feed.find(p => p.id === playingTapeId);
    const audioUrl = post?.tapeData?.audioUrl || 
      post?.tapeData?.audio_url || 
      post?.tapeData?.audio || 
      ((post as any)?.media_url && isAudioUrl((post as any).media_url) ? (post as any).media_url : (post?.image && isAudioUrl(post.image) ? post.image : undefined));

    if (audioUrl) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      const currentPct = tapeProgress[playingTapeId] || 0;

      const onLoadedMetadata = () => {
        if (audio.duration && currentPct > 0) {
          audio.currentTime = (currentPct / 100) * audio.duration;
        }
      };

      const onTimeUpdate = () => {
        if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
          const pct = (audio.currentTime / audio.duration) * 100;
          setTapeProgress(prev => ({
            ...prev,
            [playingTapeId]: Math.min(100, Math.max(0, pct))
          }));
        }
      };

      const onEnded = () => {
        setPlayingTapeId(null);
        setTapeProgress(prev => ({ ...prev, [playingTapeId]: 0 }));
      };

      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      requestPauseSceneRadio('tape_audio_playback');
      audio.play().catch(e => console.warn('[TapePlayer] Audio playback warning:', e));

      return () => {
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
        audio.pause();
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null;
        }
      };
    } else {
      const interval = setInterval(() => {
        setTapeProgress(prev => {
          const current = prev[playingTapeId] || 0;
          if (current >= 100) {
            setPlayingTapeId(null);
            return { ...prev, [playingTapeId]: 0 };
          }
          return { ...prev, [playingTapeId]: current + 0.5 };
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [playingTapeId, feed]);

  const handleSeekTape = (tapeId: string, progressPct: number) => {
    setTapeProgress(prev => ({ ...prev, [tapeId]: progressPct }));
    if (activeAudioRef.current && playingTapeId === tapeId && activeAudioRef.current.duration) {
      activeAudioRef.current.currentTime = (progressPct / 100) * activeAudioRef.current.duration;
    }
  };

  const handleStopTape = (tapeId: string) => {
    if (activeAudioRef.current && playingTapeId === tapeId) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    setPlayingTapeId(null);
    setTapeProgress(prev => ({ ...prev, [tapeId]: 0 }));
  };

  const formatProgress = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    playingTapeId,
    setPlayingTapeId,
    tapeProgress,
    setTapeProgress,
    handleTapeAudioUpload,
    handleSeekTape,
    handleStopTape,
    formatProgress
  };
}
