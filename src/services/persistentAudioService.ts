/**
 * Centralized Persistent Background Audio Service
 * Manages continuous audio streams, HTML5 Audio, Web Audio, MediaSession lock screen controls,
 * native Capacitor Android foreground service lifecycle, wake locks, and system audio interruptions.
 */

import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface PersistentTrackInfo {
  id?: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  artworkUrl?: string;
  audioUrl?: string;
  duration?: number;
  isLiveStream?: boolean;
}

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface AudioServiceCallbacks {
  onStateChange?: (state: PlaybackState) => void;
  onTrackChange?: (track: PersistentTrackInfo | null) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onNotification?: (message: string) => void;
}

// 60-byte PCM 44.1kHz mono silent WAV audio carrier (prevents OS sleep and keeps Android MediaSession/Foreground active)
export const SILENT_AUDIO_CARRIER = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAA';

export function getSilentAudioCarrier(): string {
  return SILENT_AUDIO_CARRIER;
}

class PersistentAudioService {
  private audioElement: HTMLAudioElement | null = null;
  private currentTrack: PersistentTrackInfo | null = null;
  private playbackState: PlaybackState = 'idle';
  private callbacks: AudioServiceCallbacks = {};
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private wakeLockSentinel: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: any = null;
  private timeUpdateInterval: any = null;
  private wasPlayingBeforeInterruption: boolean = false;
  private isInitialized: boolean = false;
  private isCarrierAudio: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * Initializes the audio element, event listeners, and native bridge hooks
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Create a persistent, non-garbage-collected HTMLAudioElement marked as Scene Radio
    this.audioElement = new Audio();
    this.audioElement.id = 'scene-radio-carrier';
    this.audioElement.setAttribute('data-scene-radio', 'true');
    this.audioElement.preload = 'auto';
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.loop = true;
    this.audioElement.volume = this.volume;

    // Attach core media event listeners
    this.audioElement.addEventListener('play', () => {
      this.setPlaybackState('playing');
      this.updateMediaSessionState('playing');
      this.acquireWakeLock();
      this.notifyNativeBridge('start');
    });

    this.audioElement.addEventListener('playing', () => {
      this.setPlaybackState('playing');
      this.reconnectAttempts = 0;
    });

    this.audioElement.addEventListener('pause', () => {
      // Don't update state to paused if we are just loading a new track or using carrier
      if (this.playbackState !== 'loading') {
        this.setPlaybackState('paused');
        this.updateMediaSessionState('paused');
        this.releaseWakeLock();
        this.notifyNativeBridge('pause');
      }
    });

    this.audioElement.addEventListener('ended', () => {
      // Carrier audio should loop continuously and never stop the native service
      if (this.isCarrierAudio) {
        if (this.playbackState === 'playing') {
          this.audioElement?.play().catch(() => {});
        }
        return;
      }
      this.setPlaybackState('idle');
      this.updateMediaSessionState('none');
      this.releaseWakeLock();
      this.notifyNativeBridge('stop');
      if (this.callbacks.onNext) {
        this.callbacks.onNext();
      }
    });

    this.audioElement.addEventListener('waiting', () => {
      if (this.playbackState === 'playing') {
        this.setPlaybackState('loading');
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      if (!this.isCarrierAudio) {
        console.warn('[PersistentAudioService] Audio playback error encountered:', e);
        this.handleStreamError();
      }
    });

    // Progress updates
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement && this.callbacks.onProgress && !this.isCarrierAudio) {
        const cur = this.audioElement.currentTime || 0;
        const dur = this.audioElement.duration || (this.currentTrack?.duration || 0);
        this.callbacks.onProgress(cur, dur);
        this.updateMediaSessionPosition(cur, dur);
      }
    });

    // 2. Setup System Audio Interruption Listeners
    this.setupInterruptionListeners();

    // 3. Setup Capacitor App State Listeners
    this.setupAppLifecycleListeners();
  }

  /**
   * Register system audio interruption listeners:
   * - Headphones unplugged ("Becoming Noisy")
   * - Audio focus lost (Phone call, alarm, assistant)
   * - Device change events
   */
  private setupInterruptionListeners(): void {
    if (typeof window === 'undefined') return;

    // A. Native Android Broadcast bridge event
    window.addEventListener('nexus_native_audio_interruption', ((e: CustomEvent) => {
      const action = e.detail?.action;
      console.log('[PersistentAudioService] Received native audio interruption:', action);

      if (action === 'pause') {
        if (this.playbackState === 'playing') {
          this.wasPlayingBeforeInterruption = true;
          this.pause();
          this.callbacks.onNotification?.('🎧 Audio paused due to system event (call/unplugged)');
        }
      } else if (action === 'resume') {
        this.wasPlayingBeforeInterruption = false;
        if (this.playbackState === 'paused' || this.playbackState === 'idle') {
          this.resume();
        }
      } else if (action === 'next') {
        if (this.callbacks.onNext) {
          this.callbacks.onNext();
        }
      } else if (action === 'previous') {
        if (this.callbacks.onPrevious) {
          this.callbacks.onPrevious();
        }
      } else if (action === 'stop') {
        this.stop();
      }
    }) as EventListener);

    // B. Web Media Devices change (headset disconnected)
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === 'function') {
      navigator.mediaDevices.addEventListener('devicechange', () => {
        console.log('[PersistentAudioService] Audio output device changed.');
        // If headphones unplugged while playing, gently pause to prevent blaring
        if (this.playbackState === 'playing') {
          this.wasPlayingBeforeInterruption = true;
          this.pause();
          this.callbacks.onNotification?.('🎧 Headset disconnected — audio paused');
        }
      });
    }

    // C. Visibility change: Ensure audio keeps playing and wake lock re-acquired on tab focus
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.playbackState === 'playing') {
        this.acquireWakeLock();
      }
    });
  }

  /**
   * Listen to Capacitor App lifecycle events to keep audio running smoothly in background
   */
  private setupAppLifecycleListeners(): void {
    if (!Capacitor.isNativePlatform()) return;

    try {
      App.addListener('appStateChange', (state) => {
        console.log('[PersistentAudioService] App state changed:', state.isActive ? 'active' : 'background');
        if (!state.isActive) {
          // App minimized or device locked
          if (this.playbackState === 'playing') {
            this.acquireWakeLock();
            this.notifyNativeBridge('update');
          }
        } else {
          // App returned to foreground
          if (this.playbackState === 'playing') {
            this.acquireWakeLock();
          }
        }
      });
    } catch (err) {
      console.warn('[PersistentAudioService] Could not register App state listener:', err);
    }
  }

  /**
   * Communicates with native Android BackgroundAudioService via MainActivity's JavascriptInterface
   */
  private notifyNativeBridge(action: 'start' | 'update' | 'pause' | 'stop'): void {
    try {
      const nativeBridge = (window as any).NexusNativeAudio;
      if (!nativeBridge) return;

      const title = this.currentTrack?.title || 'Scene Radio';
      const artist = this.currentTrack?.artist || 'Nexus Underground';
      const genre = this.currentTrack?.genre || 'Brutal Death';

      if (action === 'start') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(true);
        }
        nativeBridge.startForegroundAudio(title, artist, genre);
      } else if (action === 'update') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(true);
        }
        nativeBridge.updateMetadata(title, artist);
      } else if (action === 'pause') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(false);
        }
        nativeBridge.pauseForegroundAudio();
      } else if (action === 'stop') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(false);
        }
        nativeBridge.stopForegroundAudio();
      }
    } catch (e) {
      console.warn('[PersistentAudioService] Native audio bridge notification notice:', e);
    }
  }

  /**
   * Requests Screen / Partial Wake Lock to prevent OS from suspending CPU timers
   */
  private async acquireWakeLock(): Promise<void> {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        if (!this.wakeLockSentinel) {
          this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
          this.wakeLockSentinel.addEventListener('release', () => {
            this.wakeLockSentinel = null;
          });
          console.log('[PersistentAudioService] Screen WakeLock acquired.');
        }
      }
    } catch (e) {
      // Wake Lock may fail if tab is not focused or not supported, non-fatal
    }
  }

  private releaseWakeLock(): void {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release().catch(() => {});
        this.wakeLockSentinel = null;
        console.log('[PersistentAudioService] Screen WakeLock released.');
      }
    } catch (_) {}
  }

  /**
   * Configures native MediaSession API (Lock screen, dynamic island, notification controls)
   */
  private updateMediaSessionMetadata(track: PersistentTrackInfo): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const title = track.title || 'Scene Radio Live Stream';
      const artist = track.artist || 'Underground Heavy Metal';
      const album = track.album || track.genre || 'Nexus Radio Network';
      const artwork = track.artworkUrl || '/icon-512.png';

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: artwork, sizes: '96x96', type: 'image/png' },
          { src: artwork, sizes: '128x128', type: 'image/png' },
          { src: artwork, sizes: '256x256', type: 'image/png' },
          { src: artwork, sizes: '512x512', type: 'image/png' },
        ]
      });

      // Register system action handlers for lock-screen media controls
      this.setupMediaSessionActionHandlers();
    } catch (e) {
      console.warn('[PersistentAudioService] MediaSession metadata update error:', e);
    }
  }

  private setupMediaSessionActionHandlers(): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const actionHandlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ['play', () => {
        if (this.callbacks.onPlay) {
          this.callbacks.onPlay();
        } else {
          this.resume();
        }
      }],
      ['pause', () => {
        if (this.callbacks.onPause) {
          this.callbacks.onPause();
        } else {
          this.pause();
        }
      }],
      ['stop', () => {
        if (this.callbacks.onPause) {
          this.callbacks.onPause();
        }
        this.stop();
      }],
      ['previoustrack', () => {
        if (this.callbacks.onPrevious) {
          this.callbacks.onPrevious();
        }
      }],
      ['nexttrack', () => {
        if (this.callbacks.onNext) {
          this.callbacks.onNext();
        }
      }],
      ['seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seek(details.seekTime);
        }
      }],
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        // Some actions might not be supported on all browsers/platforms
      }
    }
  }

  private updateMediaSessionState(state: 'playing' | 'paused' | 'none'): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (_) {}
  }

  private updateMediaSessionPosition(currentTime: number, duration: number): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      if (
        'setPositionState' in navigator.mediaSession &&
        duration > 0 &&
        Number.isFinite(duration) &&
        Number.isFinite(currentTime)
      ) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1.0,
          position: Math.min(Math.max(0, currentTime), duration)
        });
      }
    } catch (_) {}
  }

  /**
   * Resilient stream reconnection with exponential backoff
   */
  private handleStreamError(): void {
    this.setPlaybackState('error');
    if (!this.currentTrack?.audioUrl) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
      console.log(`[PersistentAudioService] Stream stalled. Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.callbacks.onNotification?.(`🔄 Reconnecting audio stream (Attempt ${this.reconnectAttempts})...`);

      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (this.currentTrack && this.audioElement) {
          const freshUrl = this.appendCacheBusterIfNeeded(this.currentTrack.audioUrl!);
          this.audioElement.src = freshUrl;
          this.audioElement.load();
          this.audioElement.play().catch(() => {});
        }
      }, delay);
    } else {
      this.callbacks.onNotification?.('⚠️ Audio stream disconnected. Check internet connection.');
      this.setPlaybackState('idle');
    }
  }

  private appendCacheBusterIfNeeded(url: string): string {
    // For live radio streams that drop, cache-busting forces the gateway to deliver the latest audio chunk
    if (url.includes('stream') || url.includes('live') || url.includes('.m3u8')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}_t=${Date.now()}`;
    }
    return url;
  }

  private setPlaybackState(state: PlaybackState): void {
    this.playbackState = state;
    this.callbacks.onStateChange?.(state);
  }

  // ==========================================
  // Public Control API
  // ==========================================

  public setCallbacks(callbacks: AudioServiceCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Plays a track or live audio stream with lock screen metadata and continuous playback
   */
  public async play(track: PersistentTrackInfo, callbacks?: AudioServiceCallbacks): Promise<void> {
    this.init();
    if (callbacks) {
      this.setCallbacks(callbacks);
    }

    this.currentTrack = track;
    this.callbacks.onTrackChange?.(track);
    this.updateMediaSessionMetadata(track);
    this.notifyNativeBridge('update');

    const rawUrl = track.audioUrl?.trim();
    const streamUrl = rawUrl || SILENT_AUDIO_CARRIER;
    this.isCarrierAudio = !rawUrl || rawUrl.startsWith('data:audio');

    if (!this.audioElement) {
      console.warn('[PersistentAudioService] Audio element not initialized');
      return;
    }

    try {
      this.setPlaybackState('loading');
      clearTimeout(this.reconnectTimer);
      this.reconnectAttempts = 0;

      this.audioElement.setAttribute('data-scene-radio', 'true');
      this.audioElement.loop = this.isCarrierAudio;

      if (this.isCarrierAudio) {
        // Subtle carrier level keeping OS audio session and wake pipeline alive
        this.audioElement.volume = 0.05;
      } else {
        this.audioElement.volume = this.volume;
      }

      // Only set new source if it differs
      if (this.audioElement.src !== streamUrl) {
        this.audioElement.src = streamUrl;
        this.audioElement.load();
      }

      await this.audioElement.play();
      this.setPlaybackState('playing');
      this.updateMediaSessionState('playing');
      this.acquireWakeLock();
      this.notifyNativeBridge('start');
    } catch (err: any) {
      console.warn('[PersistentAudioService] Audio play error:', err?.message || err);
      if (!this.isCarrierAudio) {
        // Auto-reconnect or notify for actual remote stream URLs
        this.handleStreamError();
      } else {
        // For carrier audio, keep state active for native bridge
        this.setPlaybackState('playing');
        this.updateMediaSessionState('playing');
        this.notifyNativeBridge('start');
      }
    }
  }

  public pause(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
      } catch (_) {}
    }
    this.setPlaybackState('paused');
    this.updateMediaSessionState('paused');
    this.releaseWakeLock();
    this.notifyNativeBridge('pause');
  }

  public resume(): void {
    if (this.audioElement && this.currentTrack) {
      this.audioElement.play().then(() => {
        this.setPlaybackState('playing');
        this.updateMediaSessionState('playing');
        this.acquireWakeLock();
        this.notifyNativeBridge('start');
      }).catch((e) => {
        console.warn('[PersistentAudioService] Resume error:', e);
        this.handleStreamError();
      });
    }
  }

  public stop(): void {
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (_) {}
    }
    this.setPlaybackState('idle');
    this.updateMediaSessionState('none');
    this.releaseWakeLock();
    this.notifyNativeBridge('stop');
  }

  public seek(seconds: number): void {
    if (this.audioElement && Number.isFinite(seconds)) {
      try {
        this.audioElement.currentTime = Math.max(0, seconds);
      } catch (_) {}
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.audioElement) {
      this.audioElement.muted = this.isMuted;
    }
    return this.isMuted;
  }

  /**
   * Prompts the user on native Android to exclude Nexus Core from battery optimization
   * to guarantee zero background audio dropouts on OEM skins (MIUI, OneUI, EMUI, ColorOS)
   */
  public requestBatteryExemption(): void {
    try {
      const nativeBridge = (window as any).NexusNativeAudio;
      if (nativeBridge && typeof nativeBridge.requestBatteryExemption === 'function') {
        nativeBridge.requestBatteryExemption();
      }
    } catch (e) {
      console.warn('[PersistentAudioService] Battery exemption prompt notice:', e);
    }
  }

  // Getters
  public getPlaybackState(): PlaybackState {
    return this.playbackState;
  }

  public getCurrentTrack(): PersistentTrackInfo | null {
    return this.currentTrack;
  }

  public getCurrentTime(): number {
    return this.audioElement?.currentTime || 0;
  }

  public getDuration(): number {
    return this.audioElement?.duration || (this.currentTrack?.duration || 0);
  }

  public getVolume(): number {
    return this.volume;
  }

  public isAudioMuted(): boolean {
    return this.isMuted;
  }

  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
}

export const persistentAudioService = new PersistentAudioService();
