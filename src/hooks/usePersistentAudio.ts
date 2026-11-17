import { useState, useEffect, useCallback } from 'react';
import {
  persistentAudioService,
  PersistentTrackInfo,
  PlaybackState,
  AudioServiceCallbacks
} from '../services/persistentAudioService';

export interface UsePersistentAudioProps {
  onNext?: () => void;
  onPrevious?: () => void;
  triggerNotification?: (msg: string) => void;
}

export function usePersistentAudio(props?: UsePersistentAudioProps) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    persistentAudioService.getPlaybackState()
  );
  const [currentTrack, setCurrentTrack] = useState<PersistentTrackInfo | null>(
    persistentAudioService.getCurrentTrack()
  );
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(persistentAudioService.getVolume());
  const [isMuted, setIsMuted] = useState<boolean>(persistentAudioService.isAudioMuted());

  useEffect(() => {
    const callbacks: AudioServiceCallbacks = {
      onStateChange: (state) => setPlaybackState(state),
      onTrackChange: (track) => {
        setCurrentTrack(track);
        setCurrentTime(0);
        setDuration(track?.duration || 0);
      },
      onProgress: (cur, dur) => {
        setCurrentTime(cur);
        if (dur > 0) setDuration(dur);
      },
      onNext: props?.onNext,
      onPrevious: props?.onPrevious,
      onNotification: props?.triggerNotification
    };

    persistentAudioService.setCallbacks(callbacks);
  }, [props?.onNext, props?.onPrevious, props?.triggerNotification]);

  const play = useCallback((track: PersistentTrackInfo) => {
    return persistentAudioService.play(track);
  }, []);

  const pause = useCallback(() => {
    persistentAudioService.pause();
  }, []);

  const resume = useCallback(() => {
    persistentAudioService.resume();
  }, []);

  const togglePlay = useCallback((fallbackTrack?: PersistentTrackInfo) => {
    if (playbackState === 'playing') {
      persistentAudioService.pause();
    } else if (playbackState === 'paused') {
      persistentAudioService.resume();
    } else if (fallbackTrack) {
      persistentAudioService.play(fallbackTrack);
    }
  }, [playbackState]);

  const stop = useCallback(() => {
    persistentAudioService.stop();
  }, []);

  const seek = useCallback((seconds: number) => {
    persistentAudioService.seek(seconds);
  }, []);

  const setVolume = useCallback((val: number) => {
    persistentAudioService.setVolume(val);
    setVolumeState(val);
  }, []);

  const toggleMute = useCallback(() => {
    const muted = persistentAudioService.toggleMute();
    setIsMuted(muted);
  }, []);

  const requestBatteryExemption = useCallback(() => {
    persistentAudioService.requestBatteryExemption();
  }, []);

  return {
    playbackState,
    isPlaying: playbackState === 'playing',
    isLoading: playbackState === 'loading',
    currentTrack,
    currentTime,
    duration,
    volume,
    isMuted,
    play,
    pause,
    resume,
    togglePlay,
    stop,
    seek,
    setVolume,
    toggleMute,
    requestBatteryExemption,
    audioElement: persistentAudioService.getAudioElement()
  };
}
