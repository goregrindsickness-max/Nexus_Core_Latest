import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, MessageSquare, ChevronDown, Plus, MessageCircle, Play, Pause, Disc } from 'lucide-react';
import { StemTrack, StemVersion } from '../../types/studio';

interface StemTrackRowProps {
  stem: StemTrack;
  projectId: string;
  isPlaying: boolean;
  globalTime: number; // in seconds
  masterVolume: number; // 0 to 100
  duration: number; // in seconds
  anySoloActive: boolean;
  onUpdateStem: (stemId: string, updates: Partial<StemTrack>) => void;
  onAddComment: (stemId: string, timestamp_sec: number, comment: string) => void;
  onAddVersion: (stemId: string) => void;
  onSeek: (time: number) => void;
}

export const StemTrackRow: React.FC<StemTrackRowProps> = ({
  stem,
  projectId,
  isPlaying,
  globalTime,
  masterVolume,
  duration,
  anySoloActive,
  onUpdateStem,
  onAddComment,
  onAddVersion,
  onSeek
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedVersion: StemVersion | undefined = 
    stem?.versions?.find(v => v.id === stem.selected_version_id) || stem?.versions?.[0];

  const currentFileUrl = selectedVersion?.file_url || 'https://cdn.freesound.org/previews/583/583348_11861866-lq.mp3';

  // Calculate actual volume considering mute, solo, and master volume
  const effectiveMute = stem?.muted || (anySoloActive && !stem?.solo);
  const effectiveVolume = effectiveMute ? 0 : ((stem?.volume ?? 80) / 100) * (masterVolume / 100);

  // Sync audio playback
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = Math.max(0, Math.min(1, effectiveVolume));
  }, [effectiveVolume]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (Math.abs(audioRef.current.currentTime - globalTime) > 0.3) {
      audioRef.current.currentTime = globalTime;
    }
  }, [globalTime]);

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    onAddComment(stem.id, globalTime, newCommentText.trim());
    setNewCommentText('');
  };

  const formatTimestamp = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Generate synthetic waveform bars for visual feedback
  const waveformBars = React.useMemo(() => {
    const bars = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random heights based on stem.id and index
      const seed = (stem.id.charCodeAt(i % stem.id.length) || 50) + i * 7;
      const height = Math.min(100, Math.max(15, (seed % 85) + 15));
      bars.push(height);
    }
    return bars;
  }, [stem.id]);

  return (
    <div className="bg-[#0e0a16] border border-violet-900/40 rounded-xl p-3 shadow-lg relative transition-all hover:border-violet-700/50">
      {/* Hidden Audio Element for synced multi-track audio playback */}
      <audio
        ref={audioRef}
        src={currentFileUrl}
        preload="auto"
        loop
      />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Track Control Panel (Left Side) */}
        <div className="w-full lg:w-72 shrink-0 bg-zinc-950/80 border border-violet-900/30 rounded-lg p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <Disc className={`w-4 h-4 text-violet-400 shrink-0 ${isPlaying ? 'animate-spin' : ''}`} />
              <span className="text-xs font-bold font-mono text-white truncate" title={stem?.title}>
                {stem?.title || 'Stem Track'}
              </span>
            </div>

            {/* Version Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                className="px-2 py-0.5 rounded bg-violet-950/80 hover:bg-violet-900 border border-violet-500/40 text-[10px] font-mono font-bold text-violet-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>v{selectedVersion?.version_number || 1}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showVersionDropdown && (
                <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-zinc-950 border border-violet-800 rounded-lg shadow-xl p-1 text-xs">
                  <div className="text-[9px] font-mono font-bold uppercase text-zinc-500 px-2 py-1">
                    Stem Versions ({stem?.versions?.length || 1})
                  </div>
                  {(stem?.versions || []).map((ver, vIdx) => (
                    <button
                      key={ver.id ? `ver-${ver.id}-${vIdx}` : `ver-${vIdx}`}
                      onClick={() => {
                        onUpdateStem(stem.id, { selected_version_id: ver.id });
                        setShowVersionDropdown(false);
                      }}
                      className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between text-[11px] font-mono ${
                        ver.id === stem.selected_version_id
                          ? 'bg-violet-900/60 text-white font-bold'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                      }`}
                    >
                      <span>v{ver.version_number}</span>
                      <span className="text-[9px] text-zinc-500 truncate max-w-[80px]">
                        {ver.notes || 'Stem file'}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setShowVersionDropdown(false);
                      onAddVersion(stem.id);
                    }}
                    className="w-full mt-1 pt-1 border-t border-zinc-800 text-left px-2 py-1 text-[10px] font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Upload New Version</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mute, Solo, Volume Slider Controls */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-900">
            {/* Solo Button ($S$) */}
            <button
              type="button"
              onClick={() => onUpdateStem(stem.id, { solo: !stem?.solo })}
              className={`w-7 h-7 rounded text-[11px] font-mono font-black border transition-all cursor-pointer flex items-center justify-center ${
                stem?.solo
                  ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-amber-400 hover:border-amber-500/50'
              }`}
              title="Solo Track"
            >
              S
            </button>

            {/* Mute Button ($M$) */}
            <button
              type="button"
              onClick={() => onUpdateStem(stem.id, { muted: !stem?.muted })}
              className={`w-7 h-7 rounded text-[11px] font-mono font-black border transition-all cursor-pointer flex items-center justify-center ${
                stem?.muted
                  ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/50'
              }`}
              title="Mute Track"
            >
              M
            </button>

            {/* Volume Icon & Slider */}
            <div className="flex items-center gap-1.5 flex-1 bg-zinc-900/60 border border-zinc-800 rounded px-2 py-1">
              <button
                type="button"
                onClick={() => onUpdateStem(stem.id, { muted: !stem?.muted })}
                className="text-zinc-400 hover:text-white"
              >
                {stem?.muted || effectiveMute ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={stem?.volume ?? 80}
                onChange={(e) => onUpdateStem(stem.id, { volume: Number(e.target.value) })}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
              <span className="text-[9px] font-mono text-zinc-400 w-6 text-right">
                {stem?.volume ?? 80}%
              </span>
            </div>

            {/* Comments Toggle */}
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className={`p-1.5 rounded border text-xs flex items-center gap-1 transition-all cursor-pointer relative ${
                showComments || (stem?.comments?.length || 0) > 0
                  ? 'bg-violet-950/80 border-violet-500/60 text-violet-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
              title="Timestamped Feedback Comments"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {(stem?.comments?.length || 0) > 0 && (
                <span className="text-[9px] font-bold font-mono px-1 bg-violet-600 text-white rounded-full">
                  {stem?.comments?.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Waveform Visualizer & Seek Timeline (Right Side) */}
        <div className="flex-1 bg-zinc-950/90 border border-violet-900/30 rounded-lg p-2.5 flex flex-col justify-between relative overflow-hidden min-h-[72px]">
          {/* Interactive Waveform Canvas */}
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(ratio * (duration || 180));
            }}
            className="w-full h-10 flex items-center justify-between gap-[2px] cursor-pointer group py-1 relative"
          >
            {waveformBars.map((barHeight, idx) => {
              const barTimeRatio = idx / waveformBars.length;
              const currentTimeRatio = globalTime / (duration || 180);
              const isPlayed = barTimeRatio <= currentTimeRatio;

              return (
                <div
                  key={`wave-bar-${idx}`}
                  style={{ height: `${barHeight}%` }}
                  className={`w-full rounded-sm transition-all duration-75 ${
                    isPlayed
                      ? 'bg-gradient-to-t from-violet-600 to-fuchsia-400 group-hover:from-violet-500 group-hover:to-fuchsia-300'
                      : 'bg-zinc-800 group-hover:bg-zinc-700'
                  } ${effectiveMute ? 'opacity-30' : 'opacity-100'}`}
                />
              );
            })}

            {/* Timestamped Comment Markers on Waveform */}
            {(stem?.comments || []).map((c, cIdx) => {
              const markerRatio = Math.max(0, Math.min(1, c.timestamp_sec / (duration || 180)));
              return (
                <div
                  key={c.id ? `marker-${c.id}-${cIdx}` : `marker-${cIdx}`}
                  style={{ left: `${markerRatio * 100}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(c.timestamp_sec);
                    setShowComments(true);
                  }}
                  className="absolute top-0 bottom-0 w-1 bg-amber-400/90 hover:bg-amber-300 z-10 cursor-pointer shadow-[0_0_8px_rgba(251,191,36,0.8)] group/marker"
                  title={`${c.user_name} @ ${formatTimestamp(c.timestamp_sec)}: ${c.comment}`}
                >
                  <div className="hidden group-hover/marker:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 p-1.5 bg-zinc-950 border border-amber-500/80 rounded text-[10px] text-amber-300 font-mono whitespace-nowrap z-30 shadow-xl">
                    {c.user_name}: {c.comment}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stem Meta & Add Comment Quick Row */}
          <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-500">
            <span className="truncate max-w-[200px]">
              {selectedVersion?.notes || 'Audio Stem Active'}
            </span>
            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Feedback @ {formatTimestamp(globalTime)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timestamped Feedback Comments Drawer */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-violet-900/40 bg-zinc-950/60 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-bold text-violet-300 uppercase tracking-wider">
            <span>Timestamped Studio Notes & Feedback</span>
            <span className="text-[10px] text-zinc-500 font-normal">
              Click marker on waveform to jump timestamp
            </span>
          </div>

          {/* Comment List */}
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {(!stem?.comments || stem.comments.length === 0) ? (
              <p className="text-xs text-zinc-500 italic py-1 font-mono">
                No timestamped comments yet. Add feedback at current playhead time ({formatTimestamp(globalTime)}).
              </p>
            ) : (
              stem.comments.map((c, cIdx) => (
                <div
                  key={c.id ? `comm-${c.id}-${cIdx}` : `comm-${cIdx}`}
                  className="bg-zinc-900/80 border border-violet-900/30 rounded-lg p-2 text-xs flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="font-bold text-violet-400">{c.user_name}</span>
                      <button
                        type="button"
                        onClick={() => onSeek(c.timestamp_sec)}
                        className="px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 rounded text-[9px] font-bold hover:bg-amber-900 transition-colors cursor-pointer"
                      >
                        @ {formatTimestamp(c.timestamp_sec)}
                      </button>
                    </div>
                    <p className="text-zinc-200 text-xs font-sans">{c.comment}</p>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 shrink-0">
                    {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* New Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder={`Add comment at ${formatTimestamp(globalTime)}...`}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 bg-zinc-900 border border-violet-900/50 focus:border-violet-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 outline-none font-mono"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim()}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
