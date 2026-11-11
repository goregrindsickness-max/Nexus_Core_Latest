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
  fallbackStreamUrl?: string;
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

// Fallback base64 WAV header if Blob URL creation is unavailable
export const SILENT_AUDIO_CARRIER = 'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAA';

let cachedLongCarrierBlobUrl: string | null = null;

/**
 * Generates a 30-second 8kHz 16-bit mono WAV Blob URL with a sub-audible 1-LSB signal (-90dB).
 * Chromium's MediaSessionImpl requires media duration >= 5.0 seconds (kMinimumDurationForMediaSession)
 * to register persistent AudioFocus and activate the native OS Lock Screen / Quick Settings Media Player.
 */
export function getSilentAudioCarrier(): string {
  if (cachedLongCarrierBlobUrl) {
    return cachedLongCarrierBlobUrl;
  }
  if (typeof window === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined') {
    return SILENT_AUDIO_CARRIER;
  }

  try {
    const sampleRate = 8000;
    const durationSeconds = 30;
    const numSamples = sampleRate * durationSeconds;
    const dataSize = numSamples * 2; // 16-bit mono = 2 bytes per sample
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF WAVE header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true);  // AudioFormat = 1 (PCM)
    view.setUint16(22, 1, true);  // NumChannels = 1 (Mono)
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true);  // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Fill with 1-LSB alternating values (+1 / -1) so mobile hardware DACs do not gate digital zero silence
    for (let i = 0; i < numSamples; i++) {
      view.setInt16(44 + i * 2, (i & 1) === 0 ? 1 : -1, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    cachedLongCarrierBlobUrl = URL.createObjectURL(blob);
    return cachedLongCarrierBlobUrl;
  } catch {
    return SILENT_AUDIO_CARRIER;
  }
}

class PersistentAudioService {
  private audioElement: HTMLAudioElement | null = null;
  private currentTrack: PersistentTrackInfo | null = null;
  private playbackState: PlaybackState = 'idle';
  private callbacks: AudioServiceCallbacks = {};
  private volume: number = 0.85;
  private isMuted: boolean = false;
  private wakeLockSentinel: any = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: any = null;
  private wasPlayingBeforeInterruption: boolean = false;
  private isInitialized: boolean = false;
  private isCarrierAudio: boolean = false;
  private isBackgroundFallbackActive: boolean = false;
  private lastStartedGenre: string = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * Initializes the persistent DOM-mounted audio element, event listeners, and native bridge hooks
   */
  public init(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Create or reuse a persistent DOM-mounted HTMLAudioElement marked as Scene Radio
    let existingEl = document.getElementById('scene-radio-carrier') as HTMLAudioElement | null;
    if (!existingEl) {
      existingEl = document.createElement('audio');
      existingEl.id = 'scene-radio-carrier';
      existingEl.setAttribute('data-scene-radio', 'true');
      existingEl.setAttribute('playsinline', 'true');
      existingEl.setAttribute('webkit-playsinline', 'true');
      existingEl.preload = 'auto';
      existingEl.style.display = 'none';
      if (document.body) {
        document.body.appendChild(existingEl);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          if (existingEl && !existingEl.parentNode && document.body) {
            document.body.appendChild(existingEl);
          }
        });
      }
    }

    this.audioElement = existingEl;
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
      this.updateMediaSessionState('playing');
      this.reconnectAttempts = 0;
    });

    this.audioElement.addEventListener('pause', () => {
      // If paused unexpectedly by OS while supposed to be playing in background, immediately resume carrier/stream
      if (this.playbackState === 'playing' && typeof document !== 'undefined' && document.hidden) {
        this.audioElement?.play().catch(() => {});
        return;
      }
      if (this.playbackState !== 'loading') {
        this.setPlaybackState('paused');
        this.updateMediaSessionState('paused');
        this.releaseWakeLock();
      }
    });

    this.audioElement.addEventListener('ended', () => {
      // Carrier audio loops continuously and never stops the native service
      if (this.isCarrierAudio && !this.isBackgroundFallbackActive) {
        if (this.playbackState === 'playing') {
          this.audioElement?.play().catch(() => {});
        }
        return;
      }
      // If playing a real native audio stream in background or direct mode, advance to next song automatically
      if (this.callbacks.onNext) {
        this.callbacks.onNext();
      } else {
        this.setPlaybackState('idle');
        this.updateMediaSessionState('none');
        this.releaseWakeLock();
        this.notifyNativeBridge('stop');
      }
    });

    this.audioElement.addEventListener('waiting', () => {
      if (this.playbackState === 'playing' && !this.isCarrierAudio) {
        this.setPlaybackState('loading');
      }
    });

    this.audioElement.addEventListener('error', (e) => {
      if (!this.isCarrierAudio) {
        console.warn('[PersistentAudioService] Audio playback error encountered, falling back to carrier:', e);
        this.isBackgroundFallbackActive = false;
        this.isCarrierAudio = true;
        if (this.audioElement && this.playbackState === 'playing') {
          this.audioElement.loop = true;
          this.audioElement.src = getSilentAudioCarrier();
          this.audioElement.volume = 0.05;
          this.audioElement.play().catch(() => {});
        }
      }
    });

    // Progress updates
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement && (!this.isCarrierAudio || this.isBackgroundFallbackActive)) {
        const cur = this.audioElement.currentTime || 0;
        const dur = this.audioElement.duration || (this.currentTrack?.duration || 0);
        this.callbacks.onProgress?.(cur, dur);
        this.updateMediaSessionPosition(cur, dur);
      }
    });

    // 2. Setup System Audio Interruption Listeners
    this.setupInterruptionListeners();

    // 3. Setup Capacitor App State Listeners
    this.setupAppLifecycleListeners();
  }

  /**
   * Register system audio interruption listeners
   */
  private setupInterruptionListeners(): void {
    if (typeof window === 'undefined') return;

    // Visibility change: Ensure audio keeps playing and wake lock stays active
    document.addEventListener('visibilitychange', () => {
      if (this.playbackState === 'playing') {
        if (!document.hidden) {
          this.acquireWakeLock();
        }
        if (this.audioElement && this.audioElement.paused) {
          this.audioElement.play().catch(() => {});
        }
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
            if (this.audioElement && this.audioElement.paused) {
              this.audioElement.play().catch(() => {});
            }
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
   * (window.NexusNativeAudio) to keep the Foreground Service, WakeLock, and Native MediaSession active.
   */
  public notifyNativeBridge(action: 'start' | 'update' | 'pause' | 'stop', trackOverride?: Partial<PersistentTrackInfo>): void {
    try {
      const nativeBridge = (window as any).NexusNativeAudio;
      if (!nativeBridge) return;

      const title = trackOverride?.title || this.currentTrack?.title || 'Scene Radio';
      const artist = trackOverride?.artist || this.currentTrack?.artist || 'Nexus Scene Radio';
      const genre = trackOverride?.genre || this.currentTrack?.genre || this.currentTrack?.album || 'Scene Radio';

      if (action === 'start') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(true);
        }
        if (typeof nativeBridge.startForegroundAudio === 'function') {
          nativeBridge.startForegroundAudio(title, artist, genre);
        }
        this.lastStartedGenre = genre;
      } else if (action === 'update') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(true);
        }
        if (this.lastStartedGenre !== genre && typeof nativeBridge.startForegroundAudio === 'function') {
          nativeBridge.startForegroundAudio(title, artist, genre);
          this.lastStartedGenre = genre;
        } else if (typeof nativeBridge.updateMetadata === 'function') {
          nativeBridge.updateMetadata(title, artist);
        } else if (typeof nativeBridge.startForegroundAudio === 'function') {
          nativeBridge.startForegroundAudio(title, artist, genre);
        }
      } else if (action === 'pause') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(false);
        }
        if (typeof nativeBridge.pauseForegroundAudio === 'function') {
          nativeBridge.pauseForegroundAudio();
        }
      } else if (action === 'stop') {
        if (typeof nativeBridge.setAudioActive === 'function') {
          nativeBridge.setAudioActive(false);
        }
        if (typeof nativeBridge.stopForegroundAudio === 'function') {
          nativeBridge.stopForegroundAudio();
        }
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
        }
      }
    } catch (_) {}
  }

  private releaseWakeLock(): void {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release().catch(() => {});
        this.wakeLockSentinel = null;
      }
    } catch (_) {}
  }

  /**
   * Configures native MediaSession API (Lock screen, dynamic island, notification controls)
   */
  public updateMediaSessionMetadata(track: PersistentTrackInfo): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      const title = track.title || 'Scene Radio Live Stream';
      const artist = track.artist || 'Underground Heavy Metal';
      const album = track.album || 'Scene Radio';
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
          window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'resume' } }));
        }
      }],
      ['pause', () => {
        if (this.callbacks.onPause) {
          this.callbacks.onPause();
        } else {
          this.pause();
          window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'pause' } }));
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
        } else {
          window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'previous' } }));
        }
      }],
      ['nexttrack', () => {
        if (this.callbacks.onNext) {
          this.callbacks.onNext();
        } else {
          window.dispatchEvent(new CustomEvent('nexus_native_audio_interruption', { detail: { action: 'next' } }));
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
      } catch (_) {}
    }
  }

  private updateMediaSessionState(state: 'playing' | 'paused' | 'none'): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (_) {}
  }

  public updateMediaSessionPosition(currentTime: number, duration: number): void {
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
   * Seamlessly switches the persistent HTML5 <audio> element to play a real native audio stream
   * when the app is minimized/hidden and the embedded video player is throttled by the OS.
   */
  public activateNativeStreamFallback(streamUrl: string, volumeNorm: number = 0.85): void {
    this.init();
    if (!this.audioElement || !streamUrl || !streamUrl.startsWith('http')) return;

    this.volume = Math.max(0.05, Math.min(1, volumeNorm));
    this.isBackgroundFallbackActive = true;
    this.isCarrierAudio = false;
    this.audioElement.loop = false;
    this.audioElement.volume = this.volume;

    if (this.audioElement.src !== streamUrl) {
      this.audioElement.src = streamUrl;
      this.audioElement.load();
    }

    this.audioElement.play().then(() => {
      this.setPlaybackState('playing');
      this.updateMediaSessionState('playing');
      this.notifyNativeBridge('update');
    }).catch((err) => {
      console.warn('[PersistentAudioService] Native fallback stream play notice:', err);
    });
  }

  /**
   * Restores the 30-second silent carrier on the <audio> element when the foreground YouTube player
   * is actively producing sound, preventing double-audio while keeping MediaSession & WakeLock alive.
   */
  public restoreCarrierMode(): void {
    if (!this.isBackgroundFallbackActive || !this.audioElement) return;
    this.isBackgroundFallbackActive = false;
    this.isCarrierAudio = true;
    const carrierUrl = getSilentAudioCarrier();
    this.audioElement.loop = true;
    this.audioElement.volume = 0.05;
    if (this.audioElement.src !== carrierUrl) {
      this.audioElement.src = carrierUrl;
      this.audioElement.load();
    }
    if (this.playbackState === 'playing') {
      this.audioElement.play().catch(() => {});
    }
  }

  public isPlayingNativeFallback(): boolean {
    return this.isBackgroundFallbackActive && !this.isCarrierAudio;
  }

  /**
   * Plays a track or live audio stream with lock screen metadata and continuous playback
   */
  public async play(track: PersistentTrackInfo, callbacks?: AudioServiceCallbacks): Promise<void> {
    this.init();
    if (callbacks) {
      this.setCallbacks(callbacks);
    }

    const wasIdleOrPaused = this.playbackState === 'idle' || this.playbackState === 'paused';
    const isGenreChanged = Boolean(track.genre && track.genre !== this.lastStartedGenre);

    this.currentTrack = track;
    this.callbacks.onTrackChange?.(track);
    this.updateMediaSessionMetadata(track);
    this.notifyNativeBridge(wasIdleOrPaused || isGenreChanged ? 'start' : 'update', track);

    const rawUrl = track.audioUrl?.trim();
    const carrierUrl = getSilentAudioCarrier();
    const isCarrier = !rawUrl || rawUrl === SILENT_AUDIO_CARRIER || rawUrl === carrierUrl || rawUrl.startsWith('data:audio') || rawUrl.startsWith('blob:');

    // If we are currently in background fallback mode and track has a fallbackStreamUrl, use it directly
    const useFallbackStream = Boolean(
      (this.isBackgroundFallbackActive || (typeof document !== 'undefined' && document.hidden)) &&
      track.fallbackStreamUrl &&
      track.fallbackStreamUrl.startsWith('http')
    );

    const streamUrl = useFallbackStream ? track.fallbackStreamUrl! : (rawUrl || carrierUrl);
    this.isCarrierAudio = !useFallbackStream && isCarrier;
    this.isBackgroundFallbackActive = useFallbackStream;

    if (!this.audioElement) {
      return;
    }

    try {
      clearTimeout(this.reconnectTimer);
      this.reconnectAttempts = 0;

      this.audioElement.setAttribute('data-scene-radio', 'true');
      this.audioElement.loop = this.isCarrierAudio;
      this.audioElement.volume = this.isCarrierAudio ? 0.05 : this.volume;

      if (this.audioElement.src !== streamUrl) {
        this.audioElement.src = streamUrl;
        this.audioElement.load();
      }

      if (this.audioElement.paused) {
        await this.audioElement.play();
      }
      this.setPlaybackState('playing');
      this.updateMediaSessionState('playing');
      this.acquireWakeLock();
    } catch (err: any) {
      // Keep state active for native bridge and MediaSession even if autoplay awaits first gesture
      this.setPlaybackState('playing');
      this.updateMediaSessionState('playing');
    }
  }

  public pause(): void {
    this.isBackgroundFallbackActive = false;
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
      }).catch(() => {
        this.setPlaybackState('playing');
        this.updateMediaSessionState('playing');
        this.notifyNativeBridge('start');
      });
    }
  }

  public stop(): void {
    this.isBackgroundFallbackActive = false;
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
    if (this.audioElement && !this.isCarrierAudio) {
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
