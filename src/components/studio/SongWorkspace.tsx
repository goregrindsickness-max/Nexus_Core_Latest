import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, Volume2, VolumeX, Plus, UserPlus, ArrowLeft, 
  Disc, Sliders, Shield, Users, Radio, Activity, Clock
} from 'lucide-react';
import { SongProject, StemTrack, CollaboratorRole } from '../../types/studio';
import { StemTrackRow } from './StemTrackRow';
import { InviteCollaboratorModal } from './InviteCollaboratorModal';
import { StemUploadModal } from './StemUploadModal';

interface SongWorkspaceProps {
  project: SongProject;
  onBack: () => void;
  onInviteCollaborator: (projectId: string, collaborator: { handle_or_email: string; access_level: CollaboratorRole; track_role: string }) => void;
  onUploadStem: (projectId: string, stemData: { title: string; track_role?: string; file: File | string; notes?: string }) => void;
  onAddStemVersion: (projectId: string, stemId: string, file: File | string, notes?: string) => void;
  onUpdateStemTrack: (projectId: string, stemId: string, updates: Partial<StemTrack>) => void;
  onAddTimestampComment: (projectId: string, stemId: string, timestamp_sec: number, comment: string) => void;
}

export const SongWorkspace: React.FC<SongWorkspaceProps> = ({
  project,
  onBack,
  onInviteCollaborator,
  onUploadStem,
  onAddStemVersion,
  onUpdateStemTrack,
  onAddTimestampComment
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalTime, setGlobalTime] = useState(0); // in seconds
  const [masterVolume, setMasterVolume] = useState(90); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [duration] = useState(180); // Default 3 min song duration

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [stemUploadModalOpen, setStemUploadModalOpen] = useState(false);
  const [targetStemForVersion, setTargetStemForVersion] = useState<{ id: string; title: string } | null>(null);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Synchronized Global Playhead animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const updatePlayhead = (now: number) => {
      if (lastTimeRef.current !== null) {
        const delta = (now - lastTimeRef.current) / 1000;
        setGlobalTime((prev) => {
          const nextTime = prev + delta;
          if (nextTime >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return nextTime;
        });
      }
      lastTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    };

    animationFrameRef.current = requestAnimationFrame(updatePlayhead);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    setGlobalTime(0);
  };

  const handleSeek = (newTimeSec: number) => {
    setGlobalTime(Math.max(0, Math.min(duration, newTimeSec)));
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const anySoloActive = (project?.stems || []).some((s) => s.solo);

  return (
    <div className="flex flex-col h-full bg-[#07040a] text-zinc-100 font-sans min-h-screen">
      {/* Workspace Header Bar */}
      <header className="bg-[#0b0713] border-b border-violet-900/40 px-4 py-3 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Title, BPM, Key & Back navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-zinc-900/90 hover:bg-violet-950 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black font-mono text-white tracking-wide uppercase">
                  {project?.title || 'Untitled Song Transmission'}
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-violet-500/50 text-violet-400 bg-violet-950/60">
                  {project?.status || 'IN_PROGRESS'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <strong className="text-white">{project?.bpm ?? 120}</strong> BPM
                </span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
                  KEY: <strong className="text-white">{project?.musical_key || 'C Major'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Header Controls & Collaborator List */}
          <div className="flex items-center gap-3">
            {/* Collaborator Avatars */}
            <div className="hidden sm:flex items-center -space-x-2 mr-2">
              {(project?.collaborators || []).map((collab, cIdx) => (
                <div
                  key={collab.id ? `topcollab-${collab.id}-${cIdx}` : `topcollab-${cIdx}`}
                  className="w-8 h-8 rounded-full border-2 border-[#0b0713] bg-violet-950 flex items-center justify-center text-[10px] font-mono font-bold text-violet-300 overflow-hidden shadow-md"
                  title={`${collab.name || collab.handle} (${collab.track_role || collab.access_level})`}
                >
                  {collab.avatar_url ? (
                    <img src={collab.avatar_url} alt={collab.name} className="w-full h-full object-cover" />
                  ) : (
                    (collab.name || 'C').substring(0, 2).toUpperCase()
                  )}
                </div>
              ))}
            </div>

            {/* Invite Collaborator Button */}
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-violet-950/80 hover:bg-violet-900 border border-violet-500/50 text-violet-300 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-violet-400" />
              <span>Invite Collaborator</span>
            </button>

            {/* Add New Stem Button */}
            <button
              onClick={() => {
                setTargetStemForVersion(null);
                setStemUploadModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stem</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Body Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Global Playback & Transport Controls Bar */}
        <section className="bg-[#0f0b1a] border border-violet-900/50 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Main Transport Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-105 cursor-pointer"
              title={isPlaying ? 'Pause Workspace' : 'Play Workspace'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>

            <button
              onClick={stopPlayback}
              className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Stop & Reset Timehead"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Global Digital Clock */}
            <div className="bg-zinc-950 border border-violet-900/40 rounded-xl px-4 py-2 text-center font-mono">
              <div className="text-[9px] font-bold uppercase tracking-widest text-violet-400">Timecode</div>
              <div className="text-lg font-black text-white tracking-widest">
                {formatTime(globalTime)} <span className="text-zinc-600 text-xs">/ {formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Interactive Global Timehead Scrubber */}
          <div className="flex-1 w-full max-w-md px-2">
            <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
              <span>0:00</span>
              <span className="text-violet-400 font-bold">Global Master Timeline</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={globalTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full h-2 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-fuchsia-500"
            />
          </div>

          {/* Master Volume Controls */}
          <div className="flex items-center gap-2 bg-zinc-950 border border-violet-900/40 rounded-xl px-3 py-2 w-full sm:w-auto">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-zinc-400 hover:text-white"
            >
              {isMuted || masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-violet-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => {
                setIsMuted(false);
                setMasterVolume(Number(e.target.value));
              }}
              className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
            />
            <span className="text-xs font-mono font-bold text-zinc-300 w-8 text-right">
              {isMuted ? 0 : masterVolume}%
            </span>
          </div>
        </section>

        {/* Multi-Track Timeline (Stacked Audio Stem Lanes) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-violet-900/30">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
                Multi-Track Audio Stems ({(project?.stems || []).length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              {anySoloActive ? '⚡ SOLO MODE ACTIVE' : 'All unmuted stems synced to global transport'}
            </span>
          </div>

          {(!project?.stems || project.stems.length === 0) ? (
            <div className="bg-[#0d0915] border-2 border-dashed border-violet-900/40 rounded-2xl p-10 text-center space-y-3">
              <Disc className="w-12 h-12 text-violet-500 mx-auto opacity-50 animate-spin" />
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">No Stems Transmitted Yet</h3>
                <p className="text-xs text-zinc-400 font-sans max-w-sm mx-auto mt-1">
                  Upload multi-track stems (guitars, drums, vocals, bass) to begin asynchronous collaboration.
                </p>
              </div>
              <button
                onClick={() => {
                  setTargetStemForVersion(null);
                  setStemUploadModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload First Stem</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {project.stems.map((stem, sIdx) => (
                <StemTrackRow
                  key={stem.id ? `stem-${stem.id}-${sIdx}` : `stem-${sIdx}`}
                  stem={stem}
                  projectId={project.id}
                  isPlaying={isPlaying}
                  globalTime={globalTime}
                  masterVolume={isMuted ? 0 : masterVolume}
                  duration={duration}
                  anySoloActive={anySoloActive}
                  onUpdateStem={(stemId, updates) => onUpdateStemTrack(project.id, stemId, updates)}
                  onAddComment={(stemId, sec, comment) => onAddTimestampComment(project.id, stemId, sec, comment)}
                  onAddVersion={(stemId) => {
                    setTargetStemForVersion({ id: stemId, title: stem.title });
                    setStemUploadModalOpen(true);
                  }}
                  onSeek={handleSeek}
                />
              ))}
            </div>
          )}
        </section>

        {/* Project Collaborators Summary Bar */}
        <section className="bg-[#0b0713] border border-violet-900/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Project Collaborators & Track Roles
              </h3>
            </div>
            <button
              onClick={() => setInviteModalOpen(true)}
              className="text-xs font-mono text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(project?.collaborators || []).map((collab, cIdx) => (
              <div
                key={collab.id ? `botcollab-${collab.id}-${cIdx}` : `botcollab-${cIdx}`}
                className="bg-zinc-950/80 border border-violet-900/30 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-violet-950 border border-violet-500/40 flex items-center justify-center text-xs font-mono font-bold text-violet-300 overflow-hidden shrink-0">
                  {collab.avatar_url ? (
                    <img src={collab.avatar_url} alt={collab.name} className="w-full h-full object-cover" />
                  ) : (
                    (collab.name || 'C').substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden space-y-0.5">
                  <div className="text-xs font-bold text-white truncate">{collab.name || collab.handle}</div>
                  <div className="text-[10px] font-mono text-cyan-400 truncate">{collab.track_role}</div>
                  <span className="inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 bg-violet-950/80 text-violet-300 border border-violet-800 rounded">
                    {collab.access_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Invite Collaborator Modal */}
      <InviteCollaboratorModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        songTitle={project?.title}
        onInvite={(data) => onInviteCollaborator(project.id, data)}
      />

      {/* Stem Track & Version Upload Modal */}
      <StemUploadModal
        isOpen={stemUploadModalOpen}
        onClose={() => setStemUploadModalOpen(false)}
        targetStemId={targetStemForVersion?.id}
        targetStemTitle={targetStemForVersion?.title}
        onUpload={(data) => {
          if (targetStemForVersion?.id) {
            onAddStemVersion(project.id, targetStemForVersion.id, data.file, data.notes);
          } else {
            onUploadStem(project.id, data);
          }
        }}
      />
    </div>
  );
};
