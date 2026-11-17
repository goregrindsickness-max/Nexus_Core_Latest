import React, { useState } from 'react';
import { X, UserPlus, Shield, Music, Mail, AtSign, Sparkles } from 'lucide-react';
import { CollaboratorRole } from '../../types/studio';

interface InviteCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (data: { handle_or_email: string; access_level: CollaboratorRole; track_role: string }) => void;
  songTitle?: string;
}

export const InviteCollaboratorModal: React.FC<InviteCollaboratorModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  songTitle
}) => {
  const [handleOrEmail, setHandleOrEmail] = useState('');
  const [accessLevel, setAccessLevel] = useState<CollaboratorRole>('SESSION_ARTIST');
  const [trackRole, setTrackRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handleOrEmail.trim()) return;

    setSubmitting(true);
    onInvite({
      handle_or_email: handleOrEmail.trim(),
      access_level: accessLevel,
      track_role: trackRole.trim() || 'Collaborator'
    });
    setSubmitting(false);
    setHandleOrEmail('');
    setTrackRole('');
    onClose();
  };

  const ACCESS_ROLES: { level: CollaboratorRole; label: string; desc: string; badgeColor: string }[] = [
    {
      level: 'BAND_MEMBER',
      label: 'Band Member',
      desc: 'Full project editing privileges & stem deletion permissions.',
      badgeColor: 'border-violet-500/50 text-violet-400 bg-violet-950/40'
    },
    {
      level: 'SESSION_ARTIST',
      label: 'Session Artist',
      desc: 'Can upload stem tracks, record versions & add comments.',
      badgeColor: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/40'
    },
    {
      level: 'ENGINEER',
      label: 'Engineer / Producer',
      desc: 'Mix feedback, volume leveling, stem replacement & audio comments.',
      badgeColor: 'border-amber-500/50 text-amber-400 bg-amber-950/40'
    },
    {
      level: 'GUEST_FEATURE',
      label: 'Guest Feature',
      desc: 'Scoped access to record specific track roles or solos.',
      badgeColor: 'border-rose-500/50 text-rose-400 bg-rose-950/40'
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-[#0c0812] border border-violet-900/60 rounded-2xl p-6 shadow-2xl shadow-violet-950/50 relative overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Neon Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />

        <div className="flex items-center justify-between pb-4 border-b border-violet-900/40 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white font-mono flex items-center gap-2">
                Invite Collaborator
              </h3>
              <p className="text-xs text-zinc-400 font-sans truncate max-w-[280px]">
                {songTitle ? `Project: ${songTitle}` : 'Asynchronous Studio Transmission'}
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
          {/* Handle or Email Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>Collaborator Handle / Email</span>
              <span className="text-[10px] text-violet-400 font-normal">REQUIRED</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                {handleOrEmail.includes('@') ? <Mail className="w-4 h-4" /> : <AtSign className="w-4 h-4" />}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. @vance_drums or collaborator@nexus.io"
                value={handleOrEmail}
                onChange={(e) => setHandleOrEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-violet-900/50 focus:border-violet-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all shadow-inner font-mono"
              />
            </div>
          </div>

          {/* Access Level Selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span>Access Level & Permissions</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACCESS_ROLES.map((role, rIdx) => {
                const isSelected = accessLevel === role.level;
                return (
                  <button
                    key={`role-${role.level}-${rIdx}`}
                    type="button"
                    onClick={() => setAccessLevel(role.level)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isSelected
                        ? `${role.badgeColor} border-2 shadow-[0_0_12px_rgba(139,92,246,0.2)]`
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-white">{role.label}</span>
                      {isSelected && <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-tight">{role.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identifier / Track Role Text Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-cyan-400" />
              <span>Identifier / Track Role</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Session Drums, Guest Solo, Mix Engineer"
              value={trackRole}
              onChange={(e) => setTrackRole(e.target.value)}
              className="w-full bg-zinc-950 border border-violet-900/50 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-all font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-violet-900/30 flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !handleOrEmail.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-violet-950/80 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Send Studio Invite</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
