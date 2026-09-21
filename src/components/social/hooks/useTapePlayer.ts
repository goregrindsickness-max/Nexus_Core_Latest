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
        if (!tapeTitle.trim()) {
          const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
          setTapeTitle(cleanName);
        }
        if (!tapeBand.trim() && userProfile?.name) {
          setTapeBand(userProfile.name);
        }
        if (typeof triggerNotification === 'function') {
          triggerNotification("Audio tape file attached successfully!");
        }
      } else {
        alert("Failed to upload audio file.");
        setTapeAudioFileName('');
      }
    } catch (err) {
      console.error("[TapeAudioUpload Error]:", err);
      alert("Error uploading audio tape.");
      setTapeAudioFileName('');
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
    const audioUrl = post?.tapeData?.audioUrl || ((post as any)?.media_url && isAudioUrl((post as any).media_url) ? (post as any).media_url : (post?.image && isAudioUrl(post.image) ? post.image : undefined));

    if (audioUrl) {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      activeAudioRef.current = audio;

      const currentSec = tapeProgress[playingTapeId] || 0;
      audio.currentTime = currentSec;

      requestPauseSceneRadio('tape_audio_playback');
      audio.play().catch(e => console.warn('[TapePlayer] Audio playback warning:', e));

      const onTimeUpdate = () => {
        setTapeProgress(prev => ({
          ...prev,
          [playingTapeId]: Math.floor(audio.currentTime)
        }));
      };

      const onEnded = () => {
        setPlayingTapeId(null);
        setTapeProgress(prev => ({ ...prev, [playingTapeId]: 0 }));
      };

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      return () => {
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
          const p = feed.find(item => item.id === playingTapeId);
          if (!p || !p.tapeData) return prev;
          
          const parts = p.tapeData.duration.split(':');
          const totalSeconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : 42 * 60 + 15;
          
          if (current >= totalSeconds) {
            setPlayingTapeId(null);
            return { ...prev, [playingTapeId]: 0 };
          }
          return { ...prev, [playingTapeId]: current + 1 };
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [playingTapeId, feed]);

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
    formatProgress
  };
}
