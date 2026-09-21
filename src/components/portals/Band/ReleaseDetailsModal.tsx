import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Disc,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Copy,
  Check,
  X,
  ExternalLink,
  Music,
  Calendar,
  Tag,
  Building2,
  Layers,
  FileText,
  Radio,
  Headphones,
  Share2,
  Sparkles
} from 'lucide-react';

export interface ReleaseTrack {
  id?: string;
  num?: string | number;
  number?: number;
  title: string;
  duration?: string;
  lyrics?: string;
  audioUrl?: string;
  stream_url?: string;
  url?: string;
  isrc?: string;
  fileSize?: string;
}

export interface ReleaseFormatDetails {
  warehouse_qty?: number;
  shelf_id?: string;
  variants?: any[];
  [key: string]: any;
}

export interface ReleaseFormats {
  vinyl?: ReleaseFormatDetails;
  cd?: ReleaseFormatDetails;
  cassette?: ReleaseFormatDetails;
  digital?: any[];
  [key: string]: any;
}

export interface ReleaseDetails {
  id?: string;
  title: string;
  artist?: string;
  band_name?: string;
  type?: string;
  year?: string | number;
  release_date?: string;
  releaseDate?: string;
  label?: string;
  record_label?: string;
  catalog_id?: string;
  catalogId?: string;
  genre?: string;
  subgenres?: string[];
  coverUrl?: string | null;
  coverImage?: string | null;
  cover_url?: string | null;
  cover_image?: string | null;
  image_url?: string | null;
  release_info?: string;
  description?: string;
  liner_notes?: string;
  notes?: string;
  tracks?: ReleaseTrack[];
  formats?: ReleaseFormats;
  digital?: Array<{
    platform?: string;
    url?: string;
    label?: string;
  }>;
  audio_vault_path?: string;
  status?: string;
  [key: string]: any;
}

interface ReleaseDetailsModalProps {
  release: ReleaseDetails | null;
  onClose: () => void;
  bandName?: string;
  onTrackPlay?: (track: ReleaseTrack) => void;
}

export const ReleaseDetailsModal: React.FC<ReleaseDetailsModalProps> = ({
  release,
  onClose,
  bandName
}) => {
  const [playingTrackIndex, setPlayingTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [expandedLyricsTrackIndex, setExpandedLyricsTrackIndex] = useState<number | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle audio stop on unmount or modal close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const [coverLoadError, setCoverLoadError] = useState(false);

  useEffect(() => {
    setCoverLoadError(false);
  }, [release?.id, release?.title]);

  if (!release) return null;

  const rawCover = !coverLoadError ? (
    release.coverUrl ||
    release.coverImage ||
    release.cover_url ||
    release.cover_image ||
    release.image_url ||
    null
  ) : null;

  const displayArtist = release.artist || release.band_name || bandName || 'Artist';
  const displayTitle = release.title || 'Untitled Release';
  const displayType = (release.type || 'Album').toUpperCase();
  const displayYear = release.year || (release.release_date ? new Date(release.release_date).getFullYear() : '2026');
  const displayReleaseDate = release.release_date || release.releaseDate || (release.year ? `${release.year}` : null);
  const displayLabel = release.label || release.record_label || 'Self-Released / Independent';
  const displayCatalog = release.catalog_id || release.catalogId || null;
  const displayGenre = release.genre || (release.subgenres && release.subgenres.join(' • ')) || null;
  const displayDescription = release.release_info || release.description || release.liner_notes || release.notes || null;

  const tracks: ReleaseTrack[] = Array.isArray(release.tracks)
    ? release.tracks
    : typeof release.tracks === 'string'
    ? (() => {
        try {
          return JSON.parse(release.tracks);
        } catch {
          return [];
        }
      })()
    : [];

  const formats: ReleaseFormats = typeof release.formats === 'object' && release.formats !== null
    ? release.formats
    : typeof release.formats === 'string'
    ? (() => {
        try {
          return JSON.parse(release.formats);
        } catch {
          return {};
        }
      })()
    : {};

  const digitalLinks = Array.isArray(release.digital)
    ? release.digital
    : typeof release.digital === 'string'
    ? (() => {
        try {
          return JSON.parse(release.digital);
        } catch {
          return [];
        }
      })()
    : [];

  // Audio Playback Handler
  const handleTogglePlay = (idx: number, track: ReleaseTrack) => {
    const streamSrc = track.audioUrl || track.stream_url || track.url;
    if (!streamSrc) return;

    if (playingTrackIndex === idx) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(console.warn);
        setIsPlaying(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = streamSrc;
        audioRef.current.load();
        audioRef.current
          .play()
          .then(() => {
            setPlayingTrackIndex(idx);
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Audio playback error:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleCopyDetails = () => {
    const textToCopy = `${displayArtist} - ${displayTitle} (${displayYear}) [${displayType}]\nLabel: ${displayLabel}${displayCatalog ? ` • Cat #: ${displayCatalog}` : ''}\n\nTracklist:\n${tracks
      .map((t, i) => `${String(i + 1).padStart(2, '0')}. ${t.title} ${t.duration ? `(${t.duration})` : ''}`)
      .join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedNotification('Release details copied to clipboard!');
    setTimeout(() => setCopiedNotification(null), 2500);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activePlayingTrack = playingTrackIndex !== null ? tracks[playingTrackIndex] : null;

  return (
    <AnimatePresence>
      <div
        id="release-details-modal-overlay"
        className="fixed inset-0 bg-black/85 backdrop-blur-md z-[1000005] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          id="release-details-modal-card"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-zinc-950 border border-zinc-800/90 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Hidden HTML5 Audio Element */}
          <audio
            ref={audioRef}
            onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
            onEnded={() => {
              setIsPlaying(false);
              // Auto-advance to next playable track if exists
              if (playingTrackIndex !== null && playingTrackIndex + 1 < tracks.length) {
                const nextTrack = tracks[playingTrackIndex + 1];
                if (nextTrack.audioUrl || nextTrack.stream_url || nextTrack.url) {
                  handleTogglePlay(playingTrackIndex + 1, nextTrack);
                }
              }
            }}
          />

          {/* Header Banner & Artwork */}
          <div className="relative h-44 sm:h-52 bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-850 shrink-0">
            {/* Ambient Blurred Artwork Background */}
            {rawCover ? (
              <img
                src={rawCover}
                alt={displayTitle}
                className="w-full h-full object-cover blur-md opacity-35 absolute inset-0 scale-110"
                referrerPolicy="no-referrer"
                onError={() => setCoverLoadError(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950" />
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-black/40 z-10" />

            {/* Top Bar Actions */}
            <div className="absolute top-3 inset-x-3 z-30 flex items-center justify-between">
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 shadow-md">
                <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                Official Catalog Release
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="release-details-copy-btn"
                  onClick={handleCopyDetails}
                  title="Copy Release & Tracklist Info"
                  className="p-1.5 bg-black/70 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 transition-colors backdrop-blur-md cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  id="release-details-close-btn"
                  onClick={onClose}
                  title="Close (Esc)"
                  className="p-1.5 bg-black/70 hover:bg-rose-950/80 text-zinc-300 hover:text-rose-400 rounded-lg border border-zinc-800 hover:border-rose-500/30 transition-colors backdrop-blur-md cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Foreground Album Presentation */}
            <div className="relative z-20 flex items-end gap-4 px-4 sm:px-6 w-full max-w-full pb-2">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-zinc-950 border border-zinc-700/80 overflow-hidden shadow-2xl shrink-0 flex items-center justify-center group relative">
                {rawCover ? (
                  <img
                    src={rawCover}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setCoverLoadError(true)}
                  />
                ) : (
                  <Disc className="w-12 h-12 text-zinc-600" />
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-mono font-black uppercase tracking-wider">
                    {displayType}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-900/90 text-zinc-300 border border-zinc-800 text-[9px] font-mono">
                    {displayYear}
                  </span>
                  {displayGenre && (
                    <span className="px-2 py-0.5 rounded bg-zinc-900/80 text-zinc-400 border border-zinc-800 text-[9px] font-mono truncate max-w-[150px]">
                      {displayGenre}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-xl font-black text-white font-display uppercase tracking-tight truncate drop-shadow-md">
                  {displayTitle}
                </h2>
                <p className="text-xs font-mono text-zinc-300 truncate">
                  {displayArtist}
                </p>
              </div>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {copiedNotification && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-amber-300 text-xs font-mono font-bold animate-in fade-in">
              ⚡ {copiedNotification}
            </div>
          )}

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-2.5 text-left">
                <div className="flex items-center gap-1 text-[8px] font-mono uppercase text-zinc-500 tracking-wider">
                  <Building2 className="w-2.5 h-2.5 text-zinc-400" />
                  Record Label
                </div>
                <span className="text-[11px] font-mono font-bold text-zinc-200 truncate block mt-0.5">
                  {displayLabel}
                </span>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-2.5 text-left">
                <div className="flex items-center gap-1 text-[8px] font-mono uppercase text-zinc-500 tracking-wider">
                  <Tag className="w-2.5 h-2.5 text-zinc-400" />
                  Catalog Code
                </div>
                <span className="text-[11px] font-mono font-bold text-zinc-200 truncate block mt-0.5">
                  {displayCatalog || 'CAT-NEXUS'}
                </span>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-2.5 text-left">
                <div className="flex items-center gap-1 text-[8px] font-mono uppercase text-zinc-500 tracking-wider">
                  <Calendar className="w-2.5 h-2.5 text-zinc-400" />
                  Release Date
                </div>
                <span className="text-[11px] font-mono font-bold text-zinc-200 truncate block mt-0.5">
                  {displayReleaseDate || 'TBD'}
                </span>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-850 rounded-xl p-2.5 text-left">
                <div className="flex items-center gap-1 text-[8px] font-mono uppercase text-zinc-500 tracking-wider">
                  <Music className="w-2.5 h-2.5 text-zinc-400" />
                  Track Count
                </div>
                <span className="text-[11px] font-mono font-bold text-zinc-200 truncate block mt-0.5">
                  {tracks.length} {tracks.length === 1 ? 'Track' : 'Tracks'}
                </span>
              </div>
            </div>

            {/* Description / Liner Notes */}
            {displayDescription && (
              <div className="bg-zinc-900/40 border border-zinc-850/80 rounded-xl p-3.5 text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                  <FileText className="w-3 h-3" />
                  Liner Notes & Album Background
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {displayDescription}
                </p>
              </div>
            )}

            {/* Formats & Physical Inventory Specifications */}
            {(formats.vinyl || formats.cd || formats.cassette || formats.digital) && (
              <div className="space-y-2 text-left">
                <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  Available Physical Formats & Distro
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {formats.vinyl && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Disc className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-white block">12" Vinyl LP</span>
                          <span className="text-[8px] font-mono text-zinc-500">
                            {formats.vinyl.variants && formats.vinyl.variants.length > 0
                              ? `${formats.vinyl.variants.length} Variants`
                              : 'Standard Heavyweight'}
                          </span>
                        </div>
                      </div>
                      {typeof formats.vinyl.warehouse_qty === 'number' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                          Qty: {formats.vinyl.warehouse_qty}
                        </span>
                      )}
                    </div>
                  )}

                  {formats.cd && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-white block">Compact Disc</span>
                          <span className="text-[8px] font-mono text-zinc-500">Jewel Case / Digipak</span>
                        </div>
                      </div>
                      {typeof formats.cd.warehouse_qty === 'number' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                          Qty: {formats.cd.warehouse_qty}
                        </span>
                      )}
                    </div>
                  )}

                  {formats.cassette && (
                    <div className="p-2.5 rounded-xl bg-black/60 border border-zinc-850 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4 text-purple-400" />
                        <div>
                          <span className="text-[10px] font-mono font-bold text-white block">Cassette Tape</span>
                          <span className="text-[8px] font-mono text-zinc-500">Pro-Manufactured</span>
                        </div>
                      </div>
                      {typeof formats.cassette.warehouse_qty === 'number' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                          Qty: {formats.cassette.warehouse_qty}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Active Inline Audio Player Bar (when a track is playing) */}
            {activePlayingTrack && (
              <div className="p-3 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-amber-500/40 rounded-xl flex flex-col gap-2 shadow-xl animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="text-xs font-mono font-bold text-white truncate">
                      Now Playing: {activePlayingTrack.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-amber-400">
                      {formatSeconds(currentTime)} / {formatSeconds(duration)}
                    </span>
                    <button
                      onClick={() => {
                        if (audioRef.current) {
                          audioRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden cursor-pointer"
                  onClick={(e) => {
                    if (audioRef.current && duration > 0) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const ratio = (e.clientX - rect.left) / rect.width;
                      audioRef.current.currentTime = ratio * duration;
                    }
                  }}
                >
                  <div
                    className="bg-amber-400 h-full transition-all duration-100"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Official Tracklist */}
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Disc className="w-3.5 h-3.5 text-amber-400" />
                  Official Tracklist & Audio Streams ({tracks.length})
                </span>
                <span className="text-[9px] font-mono text-zinc-500">
                  {tracks.filter((t) => t.audioUrl || t.stream_url || t.url).length > 0 ? '🎵 Audio Preview Available' : ''}
                </span>
              </div>

              {tracks.length > 0 ? (
                <div className="rounded-xl bg-black/70 border border-zinc-900 divide-y divide-zinc-900/60 overflow-hidden shadow-inner">
                  {tracks.map((track, tIdx) => {
                    const hasAudio = !!(track.audioUrl || track.stream_url || track.url);
                    const isCurrentTrackPlaying = playingTrackIndex === tIdx && isPlaying;
                    const hasLyrics = !!track.lyrics;
                    const isLyricsExpanded = expandedLyricsTrackIndex === tIdx;

                    return (
                      <div
                        key={track.id ? `modal-trk-${track.id}-${tIdx}` : `modal-trk-${tIdx}`}
                        className={`p-2.5 transition-colors flex flex-col gap-1.5 ${
                          isCurrentTrackPlaying ? 'bg-amber-500/10' : 'hover:bg-zinc-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Play / Index Button */}
                            {hasAudio ? (
                              <button
                                onClick={() => handleTogglePlay(tIdx, track)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                  isCurrentTrackPlaying
                                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30'
                                    : 'bg-zinc-900 hover:bg-zinc-800 text-amber-400 border-zinc-800 hover:border-amber-500/50'
                                }`}
                                title={isCurrentTrackPlaying ? 'Pause' : 'Play Preview'}
                              >
                                {isCurrentTrackPlaying ? (
                                  <Pause className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                )}
                              </button>
                            ) : (
                              <span className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-center text-[10px] font-mono text-zinc-500 font-bold shrink-0">
                                {String(track.number || track.num || tIdx + 1).padStart(2, '0')}
                              </span>
                            )}

                            {/* Track Title */}
                            <div className="min-w-0">
                              <span className={`text-xs font-mono font-medium block truncate ${
                                isCurrentTrackPlaying ? 'text-amber-300 font-bold' : 'text-zinc-200'
                              }`}>
                                {track.title}
                              </span>
                              {track.isrc && (
                                <span className="text-[8px] font-mono text-zinc-500 uppercase">
                                  ISRC: {track.isrc}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Meta: Duration & Lyrics Toggle */}
                          <div className="flex items-center gap-2 shrink-0">
                            {hasLyrics && (
                              <button
                                onClick={() =>
                                  setExpandedLyricsTrackIndex(isLyricsExpanded ? null : tIdx)
                                }
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors cursor-pointer"
                              >
                                {isLyricsExpanded ? 'Hide Lyrics' : 'Lyrics'}
                              </button>
                            )}
                            <span className="text-xs font-mono text-zinc-400">
                              {track.duration || '--:--'}
                            </span>
                          </div>
                        </div>

                        {/* Lyrics Accordion */}
                        {isLyricsExpanded && track.lyrics && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-zinc-950 border border-zinc-850 rounded-lg p-3 text-[11px] font-sans text-zinc-400 whitespace-pre-wrap leading-relaxed mt-1"
                          >
                            {track.lyrics}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-zinc-900 rounded-xl bg-black/40 text-zinc-500 text-xs font-mono">
                  No individual tracks cataloged for this release yet.
                </div>
              )}
            </div>

            {/* Digital Platform Links */}
            {digitalLinks.length > 0 && (
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                  Streaming & Purchase Channels
                </span>
                <div className="flex flex-wrap gap-2">
                  {digitalLinks.map((link: any, lIdx: number) => (
                    <a
                      key={`release-link-${lIdx}`}
                      href={link.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>{link.platform || link.label || 'Stream Link'}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between shrink-0">
            <div className="text-[10px] font-mono text-zinc-500">
              ID: {release.id ? String(release.id).slice(0, 12) : 'STANDALONE'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyDetails}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Tracklist
              </button>
              <button
                id="release-details-modal-done-btn"
                onClick={onClose}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default ReleaseDetailsModal;
