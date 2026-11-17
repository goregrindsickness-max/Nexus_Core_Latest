import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { AudioCardPayload, deriveAudioPeaks } from '../../utils/groupMessagingUtils';
import { requestPauseSceneRadio } from '../social/utils/mediaPlaybackCoordinator';

interface InlineAudioWaveformCardProps {
  card: AudioCardPayload;
  isSentByMe: boolean;
}

function formatSec(sec: number): string {
  const safe = Math.max(0, Math.floor(sec || 0));
  const mins = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${mins}:${String(rem).padStart(2, '0')}`;
}

export const InlineAudioWaveformCard: React.FC<InlineAudioWaveformCardProps> = ({
  card,
  isSentByMe,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [totalSec, setTotalSec] = useState(Math.max(1, card.durationSec || 120));

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const peaks = useMemo(
    () =>
      card.peaks && card.peaks.length >= 16
        ? card.peaks.slice(0, 36)
        : deriveAudioPeaks(card.id || card.title, 36),
    [card.id, card.peaks, card.title]
  );

  // Sync real HTMLAudioElement when audioUrl exists
  useEffect(() => {
    if (!card.audioUrl) return;
    const audio = new Audio(card.audioUrl);
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setTotalSec(Math.round(audio.duration));
      }
    };
    const onTimeUpdate = () => {
      setCurrentSec(audio.currentTime || 0);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentSec(0);
    };
    const onPause = () => {
      setIsPlaying(false);
    };
    const onError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [card.audioUrl]);

  // Listen for global pause signal when another thread audio starts
  useEffect(() => {
    const handleOtherPlay = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.cardId && detail.cardId !== card.id) {
        if (audioRef.current) audioRef.current.pause();
        if (fallbackTimerRef.current) {
          clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        setIsPlaying(false);
      }
    };
    window.addEventListener('nexus_inbox_audio_play', handleOtherPlay);
    return () => {
      window.removeEventListener('nexus_inbox_audio_play', handleOtherPlay);
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, [card.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const startTimerPreview = () => {
    if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
    setIsPlaying(true);
    fallbackTimerRef.current = setInterval(() => {
      setCurrentSec((prev) => {
        if (prev + 0.25 >= totalSec) {
          if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
          setIsPlaying(false);
          return 0;
        }
        return prev + 0.25;
      });
    }, 250);
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    requestPauseSceneRadio('inbox_waveform_player');
    window.dispatchEvent(
      new CustomEvent('nexus_inbox_audio_play', { detail: { cardId: card.id } })
    );

    if (audioRef.current && card.audioUrl) {
      try {
        audioRef.current.muted = isMuted;
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        startTimerPreview();
      }
    } else {
      startTimerPreview();
    }
  };

  const handleSeek = (ratio: number) => {
    const clamped = Math.max(0, Math.min(1, ratio));
    const targetSec = clamped * totalSec;
    setCurrentSec(targetSec);
    if (audioRef.current && isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
      audioRef.current.currentTime = clamped * audioRef.current.duration;
    }
  };

  const progressPct = totalSec > 0 ? Math.min(100, (currentSec / totalSec) * 100) : 0;
  const isVoice = card.kind === 'voice';

  return (
    <div
      className={`w-full min-w-[230px] sm:min-w-[270px] rounded-xl p-2.5 border transition-colors ${
        isSentByMe
          ? 'bg-black/35 border-rose-500/25'
          : 'bg-[#0b0d12] border-white/[0.08]'
      }`}
    >
      {/* Clean unboxed top row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={handleTogglePlay}
            className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md"
            aria-label={isPlaying ? `Pause ${card.title}` : `Play ${card.title}`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{card.title}</p>
            <p className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
              {isVoice ? (
                <Mic className="w-3 h-3 text-rose-400 shrink-0" />
              ) : (
                <Music className="w-3 h-3 text-rose-400 shrink-0" />
              )}
              <span>
                {isVoice ? 'Voice note' : card.artist || 'Unreleased demo'}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMuted((m) => !m)}
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Interactive Scrubbable Waveform */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          if (rect.width > 0) {
            handleSeek((e.clientX - rect.left) / rect.width);
          }
        }}
        role="slider"
        aria-label="Audio waveform seek"
        aria-valuemin={0}
        aria-valuemax={totalSec}
        aria-valuenow={Math.round(currentSec)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') handleSeek(Math.min(1, (currentSec + 5) / totalSec));
          if (e.key === 'ArrowLeft') handleSeek(Math.max(0, (currentSec - 5) / totalSec));
        }}
        className="h-9 flex items-center gap-[2px] px-1.5 py-1 rounded-lg bg-black/40 border border-white/[0.05] cursor-pointer select-none"
      >
        {peaks.map((peak, idx) => {
          const barPct = ((idx + 0.5) / peaks.length) * 100;
          const active = barPct <= progressPct;
          const barHeightPx = Math.max(5, Math.round(peak * 24));
          return (
            <span
              key={idx}
              style={{ height: `${barHeightPx}px` }}
              className={`flex-1 rounded-full transition-colors duration-100 ${
                active ? 'bg-rose-500' : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          );
        })}
      </div>

      {/* Bottom Timing Strip */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1.5 tabular-nums">
        <span>{isVoice ? 'Audio clip' : card.audioUrl ? 'Master stream' : 'Track preview'}</span>
        <span>
          {formatSec(currentSec)} / {formatSec(totalSec)}
        </span>
      </div>
    </div>
  );
};

export default InlineAudioWaveformCard;
