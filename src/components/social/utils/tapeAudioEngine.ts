import { requestPauseSceneRadio } from './mediaPlaybackCoordinator';

export interface TapeAudioState {
  playingTapeId: string | null;
  isPlaying: boolean;
  progress: number; // 0 - 100
  currentTime: number; // in seconds
  duration: number; // in seconds
}

type Listener = (state: TapeAudioState) => void;

class TapeAudioEngine {
  private audio: HTMLAudioElement | null = null;
  private currentTapeId: string | null = null;
  private currentAudioUrl: string | null = null;
  private isPlaying: boolean = false;
  private progress: number = 0;
  private currentTime: number = 0;
  private duration: number = 0;
  private listeners: Set<Listener> = new Set();
  private simulatedInterval: any = null;
  private lastProgressEmitTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
        this.duration = this.audio.duration;
        this.notify();
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio && this.audio.duration && !isNaN(this.audio.duration) && this.audio.duration > 0) {
        this.currentTime = this.audio.currentTime;
        this.duration = this.audio.duration;
        this.progress = Math.min(100, Math.max(0, (this.audio.currentTime / this.audio.duration) * 100));
        
        // Throttle rapid re-renders to ~15-20fps for silky smooth CPU & audio performance
        const now = Date.now();
        if (now - this.lastProgressEmitTime > 60) {
          this.lastProgressEmitTime = now;
          this.notify();
        }
      }
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.progress = 0;
      this.currentTime = 0;
      this.currentTapeId = null;
      this.notify();
    });

    this.audio.addEventListener('pause', () => {
      if (this.isPlaying && !this.audio?.ended) {
        this.isPlaying = false;
        this.notify();
      }
    });

    this.audio.addEventListener('play', () => {
      if (!this.isPlaying) {
        this.isPlaying = true;
        this.notify();
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[TapeAudioEngine] Audio source error:', e);
      // Fallback to simulated smooth reel timer if URL cannot be streamed directly
      if (this.isPlaying && this.currentTapeId) {
        this.startSimulatedPlayback();
      }
    });
  }

  private startSimulatedPlayback() {
    this.clearSimulatedPlayback();
    this.duration = this.duration || 180;
    this.simulatedInterval = setInterval(() => {
      if (!this.isPlaying || !this.currentTapeId) {
        this.clearSimulatedPlayback();
        return;
      }
      this.currentTime += 0.2;
      this.progress = Math.min(100, (this.currentTime / this.duration) * 100);
      if (this.progress >= 100) {
        this.stop();
      } else {
        this.notify();
      }
    }, 200);
  }

  private clearSimulatedPlayback() {
    if (this.simulatedInterval) {
      clearInterval(this.simulatedInterval);
      this.simulatedInterval = null;
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        console.warn('[TapeAudioEngine] Listener notification error:', err);
      }
    });
  }

  public getState(): TapeAudioState {
    return {
      playingTapeId: this.currentTapeId,
      isPlaying: this.isPlaying,
      progress: this.progress,
      currentTime: this.currentTime,
      duration: this.duration,
    };
  }

  public play(tapeId: string, audioUrl?: string) {
    this.initAudio();
    this.clearSimulatedPlayback();

    requestPauseSceneRadio('tape_audio_playback');

    if (this.currentTapeId === tapeId && this.audio && this.audio.src) {
      // Resume current track
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.notify();
      }).catch((err) => {
        console.warn('[TapeAudioEngine] Play error:', err);
        this.startSimulatedPlayback();
      });
      return;
    }

    this.currentTapeId = tapeId;
    this.progress = 0;
    this.currentTime = 0;

    if (audioUrl) {
      this.currentAudioUrl = audioUrl;
      if (this.audio) {
        this.audio.src = audioUrl;
        this.audio.currentTime = 0;
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.notify();
        }).catch((err) => {
          console.warn('[TapeAudioEngine] Stream play fallback:', err);
          this.isPlaying = true;
          this.startSimulatedPlayback();
        });
      }
    } else {
      this.currentAudioUrl = null;
      this.isPlaying = true;
      this.startSimulatedPlayback();
      this.notify();
    }
  }

  public pause() {
    this.clearSimulatedPlayback();
    if (this.audio) {
      this.audio.pause();
    }
    this.isPlaying = false;
    this.notify();
  }

  public togglePlay(tapeId: string, audioUrl?: string) {
    if (this.currentTapeId === tapeId && this.isPlaying) {
      this.pause();
    } else {
      this.play(tapeId, audioUrl);
    }
  }

  public seek(progressPercentage: number) {
    this.progress = Math.min(100, Math.max(0, progressPercentage));
    if (this.audio && this.audio.duration && !isNaN(this.audio.duration)) {
      this.audio.currentTime = (this.progress / 100) * this.audio.duration;
      this.currentTime = this.audio.currentTime;
    } else if (this.duration) {
      this.currentTime = (this.progress / 100) * this.duration;
    }
    this.notify();
  }

  public stop(tapeId?: string) {
    if (tapeId && this.currentTapeId !== tapeId) return;
    this.clearSimulatedPlayback();
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.currentTapeId = null;
    this.isPlaying = false;
    this.progress = 0;
    this.currentTime = 0;
    this.notify();
  }
}

export const tapeAudioEngine = new TapeAudioEngine();
