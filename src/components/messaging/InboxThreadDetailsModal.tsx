import React, { useMemo, useState } from 'react';
import {
  Check,
  ExternalLink,
  Info,
  LogOut,
  Palette,
  Pin,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  UserX,
  VolumeX,
  X,
} from 'lucide-react';
import { presenceManager, formatPresenceStatus } from '../../lib/presence';
import { GroupMember, InboxConversation } from '../../utils/groupMessagingUtils';
import type { ComposerContact } from './InboxComposerModal';
import { THREAD_THEMES, getThreadTheme } from './threadThemes';

interface InboxThreadDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: InboxConversation | null;
  currentUserId: string | null;
  presenceFormatted: any;
  nickname: string;
  onNicknameChange: (value: string) => void;
  themeId?: string;
  onThemeChange?: (themeId: string) => void;
  isMuted: boolean;
  isPinned: boolean;
  isBlocked: boolean;
  isRestricted: boolean;
  onToggleMute: () => void;
  onTogglePin: () => void;
  onToggleRestrict: () => void;
  onToggleBlock: () => void;
  onClearHistory: () => void;
  onViewProfile: (profileId: string) => void;
  availableContacts: ComposerContact[];
  onRenameGroup?: (newName: string) => void;
  onAddGroupMembers?: (newMembers: GroupMember[]) => void;
  onLeaveGroup?: () => void;
}

export const InboxThreadDetailsModal: React.FC<InboxThreadDetailsModalProps> = ({
  isOpen,
  onClose,
  conversation,
  currentUserId,
  presenceFormatted,
  nickname,
  onNicknameChange,
  themeId,
  onThemeChange,
  isMuted,
  isPinned,
  isBlocked,
  isRestricted,
  onToggleMute,
  onTogglePin,
  onToggleRestrict,
  onToggleBlock,
  onClearHistory,
  onViewProfile,
  availableContacts,
  onRenameGroup,
  onAddGroupMembers,
  onLeaveGroup,
}) => {
  const activeTheme = getThreadTheme(themeId);
  const [groupTitleDraft, setGroupTitleDraft] = useState('');
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [addSearch, setAddSearch] = useState('');
  const [pendingNewIds, setPendingNewIds] = useState<string[]>([]);

  const isGroup = Boolean(conversation?.isGroup);
  const existingMemberIds = useMemo(() => {
    const set = new Set<string>();
    (conversation?.members || []).forEach((m) => {
      if (m?.id) set.add(String(m.id).toLowerCase());
    });
    if (currentUserId) set.add(String(currentUserId).toLowerCase());
    return set;
  }, [conversation?.members, currentUserId]);

  const addableContacts = useMemo(() => {
    const q = addSearch.toLowerCase().trim();
    return availableContacts.filter((c) => {
      if (!c.id || existingMemberIds.has(String(c.id).toLowerCase())) return false;
      if (!q) return true;
      return (
        c.name?.toLowerCase().includes(q) ||
        c.handle?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q)
      );
    });
  }, [availableContacts, existingMemberIds, addSearch]);

  if (!isOpen || !conversation) return null;

  const activeGroupName = groupTitleDraft || conversation.groupName || conversation.profileName;

  const handleSaveGroupName = () => {
    const trimmed = groupTitleDraft.trim();
    if (trimmed && onRenameGroup && trimmed !== conversation.groupName) {
      onRenameGroup(trimmed);
    }
    setGroupTitleDraft('');
  };

  const handleConfirmAddMembers = () => {
    if (pendingNewIds.length === 0 || !onAddGroupMembers) return;
    const contactMap = new Map(availableContacts.map((c) => [String(c.id), c]));
    const newMembers: GroupMember[] = pendingNewIds
      .map((id) => contactMap.get(id))
      .filter(Boolean)
      .map((c) => ({
        id: c!.id,
        name: c!.name,
        avatarUrl: c!.avatar,
        handle: c!.handle,
        role: c!.role,
        email: c!.email,
      }));
    if (newMembers.length > 0) {
      onAddGroupMembers(newMembers);
    }
    setPendingNewIds([]);
    setAddSearch('');
    setIsAddingMembers(false);
  };

  return (
    <div
      className="fixed inset-0 z-[170] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90dvh] bg-[#0c0e13] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/[0.07] bg-[#090b0f] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {isGroup ? (
              <Users className="w-4 h-4 text-rose-400" />
            ) : (
              <Info className="w-4 h-4 text-rose-400" />
            )}
            <h3 className="text-sm font-bold tracking-tight text-white">
              {isGroup ? 'Group Details & Members' : 'Thread Details'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 -mr-1.5 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Close thread details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Identity Summary */}
          <div className="bg-[#11141c] border border-white/[0.06] rounded-xl p-4 flex flex-col items-center text-center">
            {isGroup ? (
              <div className="relative w-16 h-16 mb-2.5 flex items-center justify-center">
                {(conversation.members || []).slice(0, 2).map((m, idx) => (
                  <div
                    key={m.id || idx}
                    className={`w-11 h-11 rounded-full bg-zinc-800 border-2 border-[#11141c] overflow-hidden flex items-center justify-center text-xs font-semibold text-zinc-200 ${
                      idx === 0 ? 'absolute top-0 left-0 z-10' : 'absolute bottom-0 right-0'
                    }`}
                  >
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      (m.name || 'M').slice(0, 2).toUpperCase()
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/[0.1] flex items-center justify-center text-lg font-bold text-zinc-200 overflow-hidden mb-2.5">
                {conversation.avatarUrl ? (
                  <img
                    src={conversation.avatarUrl}
                    alt={conversation.profileName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  conversation.profileName.slice(0, 2).toUpperCase()
                )}
              </div>
            )}

            <h4 className="text-base font-bold text-white tracking-tight">
              {nickname || conversation.profileName}
            </h4>

            <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center gap-1.5">
              {isGroup ? (
                <span className="tabular-nums">
                  Private Group · {(conversation.members || []).length} members
                </span>
              ) : (
                <>
                  {conversation.roleBadge && <span>{conversation.roleBadge} ·</span>}
                  <span className={`w-2 h-2 rounded-full ${presenceFormatted.dotClass}`} />
                  <span
                    className={
                      presenceFormatted.isOnline
                        ? 'text-emerald-400 font-medium'
                        : presenceFormatted.isRecentlyActive
                        ? 'text-amber-400'
                        : 'text-zinc-400'
                    }
                  >
                    {presenceFormatted.text}
                  </span>
                </>
              )}
            </p>

            {!isGroup && (
              <button
                type="button"
                onClick={() => onViewProfile(conversation.contactId)}
                className="mt-3.5 w-full min-h-[44px] bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                <span>View Full Profile</span>
              </button>
            )}
          </div>

          {/* Group Name Editor + Member Roster */}
          {isGroup ? (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">Group Name</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={conversation.groupName || conversation.profileName}
                    value={groupTitleDraft}
                    onChange={(e) => setGroupTitleDraft(e.target.value.slice(0, 64))}
                    className="flex-1 bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60"
                  />
                  <button
                    type="button"
                    disabled={!groupTitleDraft.trim() || activeGroupName === conversation.groupName}
                    onClick={handleSaveGroupName}
                    className="px-4 min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-white/[0.05] disabled:text-zinc-500 text-xs font-semibold text-white transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Group Members Roster + Add People */}
              <div className="bg-[#11141c] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-3.5 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200 tabular-nums">
                    Members ({(conversation.members || []).length})
                  </span>
                  {onAddGroupMembers && (
                    <button
                      type="button"
                      onClick={() => setIsAddingMembers((v) => !v)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>{isAddingMembers ? 'Done' : 'Add People'}</span>
                    </button>
                  )}
                </div>

                {isAddingMembers && (
                  <div className="p-3 border-b border-white/[0.06] bg-[#0a0c10] space-y-2.5">
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={addSearch}
                        onChange={(e) => setAddSearch(e.target.value)}
                        placeholder="Search people to add..."
                        className="w-full bg-[#141720] border border-white/[0.08] rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
                      {addableContacts.length === 0 ? (
                        <p className="text-[11px] text-zinc-500 text-center py-3">
                          No additional contacts available.
                        </p>
                      ) : (
                        addableContacts.slice(0, 20).map((c) => {
                          const checked = pendingNewIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                setPendingNewIds((prev) =>
                                  prev.includes(c.id)
                                    ? prev.filter((id) => id !== c.id)
                                    : [...prev, c.id]
                                )
                              }
                              className="w-full px-2.5 py-2 rounded-lg hover:bg-white/[0.05] flex items-center justify-between text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-[10px] font-semibold shrink-0">
                                  {c.avatar ? (
                                    <img
                                      src={c.avatar}
                                      alt={c.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    c.name.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span className="text-xs font-medium text-zinc-200 truncate">
                                  {c.name}
                                </span>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                  checked
                                    ? 'bg-rose-600 border-rose-500 text-white'
                                    : 'border-zinc-700 text-transparent'
                                }`}
                              >
                                <Check className="w-3 h-3" />
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                    {pendingNewIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleConfirmAddMembers}
                        className="w-full min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add {pendingNewIds.length} to Group</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="divide-y divide-white/[0.05] max-h-52 overflow-y-auto no-scrollbar">
                  {(conversation.members || []).map((m) => {
                    const isMe =
                      currentUserId && String(m.id).toLowerCase() === currentUserId.toLowerCase();
                    const mPresence = presenceManager.getPresence(m);
                    const mFormatted = formatPresenceStatus(mPresence);

                    return (
                      <div
                        key={m.id}
                        onClick={() => !isMe && onViewProfile(m.id)}
                        className={`px-3.5 py-2.5 flex items-center justify-between gap-2.5 ${
                          !isMe ? 'hover:bg-white/[0.04] cursor-pointer' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-[11px] font-semibold text-zinc-200">
                              {m.avatarUrl ? (
                                <img
                                  src={m.avatarUrl}
                                  alt={m.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (m.name || 'M').slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <span
                              className={`w-2 h-2 rounded-full border border-[#11141c] absolute -bottom-0.5 -right-0.5 ${mFormatted.dotClass}`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 truncate">
                              {m.name} {isMe && <span className="text-zinc-500 font-normal">(You)</span>}
                            </p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {m.role || 'Member'} · {mFormatted.shortText}
                            </p>
                          </div>
                        </div>
                        {!isMe && <ExternalLink className="w-3.5 h-3.5 text-zinc-600 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-zinc-400">Thread Alias</label>
              <input
                type="text"
                placeholder="Set custom nickname..."
                value={nickname}
                onChange={(e) => onNicknameChange(e.target.value)}
                className="w-full bg-[#141720] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/60"
              />
            </div>
          )}

          {/* Thread Theme & Color Picker */}
          {onThemeChange && (
            <div className="bg-[#11141c] border border-white/[0.06] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className={`w-4 h-4 ${activeTheme.accentIconClass}`} />
                  <div>
                    <h5 className="text-xs font-semibold text-white">Thread Theme &amp; Color</h5>
                    <p className="text-[11px] text-zinc-400">
                      Styles chat bubbles, atmosphere &amp; unread glow
                    </p>
                  </div>
                </div>
                <span className={`text-[11px] font-semibold ${activeTheme.accentIconClass}`}>
                  {activeTheme.name}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {THREAD_THEMES.map((theme) => {
                  const isSelected = activeTheme.id === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onThemeChange(theme.id)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'bg-white/[0.09] border-white/30 shadow-sm'
                          : 'bg-[#141720]/80 hover:bg-white/[0.05] border-white/[0.06]'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center border border-white/20 shadow-inner"
                        style={{ background: theme.swatchGradient }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white drop-shadow" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-white truncate leading-tight">
                          {theme.name.split(' ')[0]}
                        </p>
                        <p className="text-[9px] text-zinc-400 truncate leading-tight mt-0.5">
                          {theme.vibe}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onToggleMute}
              className="w-full min-h-[44px] px-3.5 bg-[#11141c] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs text-zinc-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <VolumeX className="w-4 h-4 text-zinc-400" />
                <span>Mute Notifications</span>
              </span>
              <span className={`text-[11px] font-semibold ${isMuted ? 'text-rose-400' : 'text-zinc-500'}`}>
                {isMuted ? 'Muted' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={onTogglePin}
              className="w-full min-h-[44px] px-3.5 bg-[#11141c] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs text-zinc-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Pin className="w-4 h-4 text-zinc-400" />
                <span>Pin Conversation</span>
              </span>
              <span className={`text-[11px] font-semibold ${isPinned ? 'text-rose-400' : 'text-zinc-500'}`}>
                {isPinned ? 'Pinned' : 'Off'}
              </span>
            </button>

            {!isGroup && (
              <>
                <button
                  type="button"
                  onClick={onToggleRestrict}
                  className="w-full min-h-[44px] px-3.5 bg-[#11141c] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs text-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Restrict Account</span>
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      isRestricted ? 'text-amber-400' : 'text-zinc-500'
                    }`}
                  >
                    {isRestricted ? 'Restricted' : 'Off'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onToggleBlock}
                  className="w-full min-h-[44px] px-3.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 rounded-xl flex items-center justify-between text-xs text-rose-300 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <UserX className="w-4 h-4 text-rose-400" />
                    <span>Block Contact</span>
                  </span>
                  <span className="text-[11px] font-semibold text-rose-400">
                    {isBlocked ? 'Blocked' : 'Block'}
                  </span>
                </button>
              </>
            )}

            {isGroup && onLeaveGroup && (
              <button
                type="button"
                onClick={onLeaveGroup}
                className="w-full min-h-[44px] px-3.5 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/25 rounded-xl flex items-center justify-between text-xs text-rose-300 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span>Leave Group</span>
                </span>
                <span className="text-[11px] font-semibold text-rose-400">Leave</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClearHistory}
              className="w-full min-h-[44px] px-3.5 bg-[#11141c] hover:bg-white/[0.05] border border-white/[0.06] rounded-xl flex items-center justify-between text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Clear Local Messages</span>
              </span>
              <span className="text-[11px] text-zinc-500">Clear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
