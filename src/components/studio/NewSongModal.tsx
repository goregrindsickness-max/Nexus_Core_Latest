import React, { useState } from 'react';
import { X, Disc, Radio, Activity, Sparkles } from 'lucide-react';
import { ProjectStatus } from '../../types/studio';

interface NewSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    title: string;
    bpm: number;
    musical_key: string;
    status: ProjectStatus;
    description?: string;
  }) => void;
}

export const NewSongModal: React.FC<NewSongModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [title, setTitle] = useState('');
  const [bpm, setBpm] = useState(128);
  const [musicalKey, setMusicalKey] = useState('D Minor');
  const [status, setStatus] = useState<ProjectStatus>('IN_PROGRESS');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    onCreate({
      title: title.trim(),
      bpm: Number(bpm) || 120,
      musical_key: musicalKey.trim() || 'C Major',
      status,
      description: description.trim()
    });
    setSubmitting(false);
    setTitle('');
    setDescription('');
    onClose();
  };

  const STATUS_OPTIONS: ProjectStatus[] = [
    'DRAFT',
    'IN_PROGRESS',
    'MIXING',
    'MASTERING',
    'COMPLETED'
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-md bg-[#0c0812] border border-violet-900/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />

        <div className="flex items-center justify-between pb-4 border-b border-violet-900/40 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Disc className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white font-mono">
                New Song Transmission
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                Initialize asynchronous multi-track studio project
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-violet-950 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Song / Track Title</span>
              <span className="text-[10px] text-violet-400">REQUIRED</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cybernetic Horizon"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-violet-900/50 focus:border-violet-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 outline-none font-mono"
            />
          </div>

          {/* BPM & Key */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tempo (BPM)</span>
              </label>
              <input
                type="number"
                min="40"
                max="280"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-violet-900/50 focus:border-cyan-400 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>Musical Key</span>
              </label>
              <input
                type="text"
                placeholder="e.g. D Minor, F# Major"
                value={musicalKey}
                onChange={(e) => setMusicalKey(e.target.value)}
                className="w-full bg-zinc-950 border border-violet-900/50 focus:border-fuchsia-400 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Production Phase Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full bg-zinc-950 border border-violet-900/50 focus:border-violet-400 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
            >
              {STATUS_OPTIONS.map((st, stIdx) => (
                <option key={`status-opt-${st}-${stIdx}`} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
              Project Description & Vibe Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Dystopian Industrial Metal with heavy analog synths..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-violet-900/50 focus:border-violet-400 rounded-xl p-3 text-xs text-white placeholder-zinc-600 outline-none font-sans"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-violet-900/30 flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
