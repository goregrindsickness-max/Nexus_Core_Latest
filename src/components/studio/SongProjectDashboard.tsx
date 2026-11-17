import React, { useState } from 'react';
import { 
  Plus, Disc, Users, Radio, Activity, Clock, Sliders, ChevronRight, Sparkles, Layers, Music
} from 'lucide-react';
import { SongProject, ProjectStatus, CollaboratorRole } from '../../types/studio';
import { NewSongModal } from './NewSongModal';

interface SongProjectDashboardProps {
  projects: SongProject[];
  loading: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (data: {
    title: string;
    bpm: number;
    musical_key: string;
    status: ProjectStatus;
    description?: string;
  }) => void;
}

export const SongProjectDashboard: React.FC<SongProjectDashboardProps> = ({
  projects,
  loading,
  onSelectProject,
  onCreateProject
}) => {
  const [newSongModalOpen, setNewSongModalOpen] = useState(false);

  const getStatusBadge = (status?: ProjectStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'border-violet-500/50 text-violet-400 bg-violet-950/60 shadow-[0_0_10px_rgba(139,92,246,0.2)]';
      case 'MIXING':
        return 'border-cyan-500/50 text-cyan-400 bg-cyan-950/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]';
      case 'MASTERING':
        return 'border-amber-500/50 text-amber-400 bg-amber-950/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'COMPLETED':
        return 'border-emerald-500/50 text-emerald-400 bg-emerald-950/60';
      default:
        return 'border-zinc-700 text-zinc-400 bg-zinc-900/60';
    }
  };

  return (
    <div className="w-full bg-[#07040a] text-zinc-100 min-h-screen p-4 sm:p-6 space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[#0f0b1a] border border-violet-900/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Background Neon Accent Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-violet-400 font-mono text-xs uppercase tracking-widest mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Studio Engine • Multi-Stem Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white uppercase">
              Asynchronous Song Collaboration
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans mt-1 max-w-2xl">
              Connect song projects with remote bandmates, session artists, and mix engineers. Upload multi-track stems, preview versions, and drop timestamped audio feedback.
            </p>
          </div>

          <button
            onClick={() => setNewSongModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-950/80 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Song Transmission</span>
          </button>
        </div>
      </div>

      {/* Projects Overview Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-violet-900/30">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">
              Active Song Projects ({projects?.length || 0})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            Click project card to enter multi-track workspace
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n, nIdx) => (
              <div key={`song-proj-skel-${n}-${nIdx}`} className="h-48 rounded-2xl bg-zinc-900/50 border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (!projects || projects.length === 0) ? (
          <div className="bg-[#0d0915] border-2 border-dashed border-violet-900/40 rounded-2xl p-12 text-center space-y-4">
            <Disc className="w-16 h-16 text-violet-500 mx-auto opacity-50" />
            <div>
              <h3 className="text-base font-mono font-bold text-white uppercase">No Song Transmissions Found</h3>
              <p className="text-xs text-zinc-400 font-sans max-w-sm mx-auto mt-1">
                Initialize your first song project to begin stems collaboration with band members and session artists.
              </p>
            </div>
            <button
              onClick={() => setNewSongModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj, pIdx) => {
              const stemCount = proj.stems?.length || 0;
              const collabCount = proj.collaborators?.length || 0;

              return (
                <div
                  key={proj.id ? `proj-${proj.id}-${pIdx}` : `proj-${pIdx}`}
                  onClick={() => onSelectProject(proj.id)}
                  className="bg-[#0e0a16] hover:bg-[#120d1f] border border-violet-900/40 hover:border-violet-500/60 rounded-2xl p-5 shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  {/* Subtle Top Border Glow */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header Row: Title & Status Badge */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black font-mono text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                        {proj?.title || 'Untitled Project'}
                      </h3>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${getStatusBadge(proj?.status)}`}>
                        {proj?.status || 'IN_PROGRESS'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 font-sans line-clamp-2 min-h-[32px]">
                      {proj?.description || 'Asynchronous song session with multi-stem tracks and feedback.'}
                    </p>
                  </div>

                  {/* Meta Specs: BPM & Key */}
                  <div className="grid grid-cols-2 gap-2 bg-zinc-950/80 border border-violet-900/30 rounded-xl p-2.5 font-mono text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span><strong className="text-white">{proj?.bpm ?? 120}</strong> BPM</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span className="truncate"><strong className="text-white">{proj?.musical_key || 'C Major'}</strong></span>
                    </div>
                  </div>

                  {/* Bottom Footer Row: Collaborators, Stems count & Arrow */}
                  <div className="pt-3 border-t border-violet-900/30 flex items-center justify-between text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-3">
                      {/* Avatars */}
                      <div className="flex items-center -space-x-2">
                        {collabCount === 0 ? (
                          <span className="text-[10px] text-zinc-600 italic">No collabs yet</span>
                        ) : (
                          (proj?.collaborators || []).slice(0, 3).map((collab, cIdx) => (
                            <div
                              key={collab.id ? `collab-${collab.id}-${cIdx}` : `collab-${cIdx}`}
                              className="w-7 h-7 rounded-full border-2 border-[#0e0a16] bg-violet-950 flex items-center justify-center text-[9px] font-bold text-violet-300 overflow-hidden"
                            >
                              {collab.avatar_url ? (
                                <img src={collab.avatar_url} alt={collab.name} className="w-full h-full object-cover" />
                              ) : (
                                (collab.name || 'C').substring(0, 2).toUpperCase()
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Stem count badge */}
                      <div className="flex items-center gap-1 text-zinc-400 text-[11px]">
                        <Layers className="w-3.5 h-3.5 text-violet-400" />
                        <span>{stemCount} stems</span>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-violet-950/80 group-hover:bg-violet-600 text-violet-400 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* New Song Modal */}
      <NewSongModal
        isOpen={newSongModalOpen}
        onClose={() => setNewSongModalOpen(false)}
        onCreate={onCreateProject}
      />
    </div>
  );
};
