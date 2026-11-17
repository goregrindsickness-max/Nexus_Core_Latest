import React, { useMemo, useState } from 'react';
import { Check, Search, Send, Users, User, X } from 'lucide-react';
import { presenceManager, formatPresenceStatus } from '../../lib/presence';
import { formatDefaultGroupName, GroupMember } from '../../utils/groupMessagingUtils';

export interface ComposerContact {
  id: string;
  name: string;
  handle?: string;
  email?: string;
  avatar?: string;
  role?: string;
  subtext?: string;
  raw?: any;
}

interface InboxComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ComposerContact[];
  onStartDirectMessage: (contact: ComposerContact) => void;
  onStartCustomDirectMessage: (customName: string) => void;
  onCreateGroupChat: (members: GroupMember[], groupName: string) => void;
}

export const InboxComposerModal: React.FC<InboxComposerModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onStartDirectMessage,
  onStartCustomDirectMessage,
  onCreateGroupChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupNameInput, setGroupNameInput] = useState('');

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.handle?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q) ||
        c.subtext?.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const selectedContacts = useMemo(() => {
    const map = new Map(contacts.map((c) => [String(c.id), c]));
    return selectedIds.map((id) => map.get(String(id))).filter(Boolean) as ComposerContact[];
  }, [contacts, selectedIds]);

  const isGroupSelection = selectedContacts.length >= 2;

  const autoGroupName = useMemo(() => {
    if (!isGroupSelection) return '';
    return formatDefaultGroupName(
      selectedContacts.map((c) => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.avatar,
        handle: c.handle,
        role: c.role,
        email: c.email,
      }))
    );
  }, [isGroupSelection, selectedContacts]);

  if (!isOpen) return null;

  const toggleContact = (contactId: string) => {
    setSelectedIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const resetAndClose = () => {
    setSearchQuery('');
    setSelectedIds([]);
    setGroupNameInput('');
    onClose();
  };

  const handleConfirm = () => {
    if (selectedContacts.length === 1) {
      const target = selectedContacts[0];
      resetAndClose();
      onStartDirectMessage(target);
      return;
    }

    if (selectedContacts.length >= 2) {
      const members: GroupMember[] = selectedContacts.map((c) => ({
        id: c.id,
        name: c.name,
        avatarUrl: c.avatar,
        handle: c.handle,
        role: c.role,
        email: c.email,
      }));
      const finalName = groupNameInput.trim() || autoGroupName;
      resetAndClose();
      onCreateGroupChat(members, finalName);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={resetAndClose}
    >
      <div
        className="bg-[#0c0e13] border border-white/[0.08] rounded-t-2xl sm:rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90dvh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/[0.07] flex items-center justify-between bg-[#090b0f]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400">
              {isGroupSelection ? <Users className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">
                {isGroupSelection ? 'New Group Thread' : 'New Message'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isGroupSelection
                  ? `${selectedContacts.length} people selected · Private group chat`
                  : 'Pick 1 person for a DM or multiple for a group'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="w-11 h-11 -mr-1.5 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close composer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Chips + Search Bar */}
        <div className="p-3 border-b border-white/[0.07] bg-[#0a0c10] space-y-2.5">
          {selectedContacts.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto no-scrollbar">
              <span className="text-[11px] font-medium text-zinc-500 mr-1">To:</span>
              {selectedContacts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleContact(c.id)}
                  className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-white/[0.08] hover:bg-rose-500/20 border border-white/[0.08] hover:border-rose-500/40 text-xs text-zinc-100 transition-colors cursor-pointer"
                >
                  <span className="w-4 h-4 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center text-[9px] font-semibold text-zinc-300 shrink-0">
                    {c.avatar ? (
                      <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <span className="truncate max-w-[110px] font-medium">{c.name}</span>
                  <X className="w-3 h-3 text-zinc-400" />
                </button>
              ))}
            </div>
          )}

          {isGroupSelection && (
            <div>
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value.slice(0, 64))}
                placeholder={`Group name (optional · e.g. ${autoGroupName})`}
                className="w-full bg-[#141720] border border-white/[0.08] focus:border-rose-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  if (selectedContacts.length > 0) {
                    handleConfirm();
                  } else if (filteredContacts.length > 0) {
                    const first = filteredContacts[0];
                    resetAndClose();
                    onStartDirectMessage(first);
                  } else {
                    const custom = searchQuery.trim().replace(/^@/, '');
                    resetAndClose();
                    onStartCustomDirectMessage(custom);
                  }
                }
              }}
              placeholder="Search people, bands, promoters, @handles..."
              className="w-full bg-[#141720] border border-white/[0.08] focus:border-rose-500/60 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-zinc-500 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contact Picker List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar min-h-[240px]">
          <div className="px-2.5 py-1.5 flex items-center justify-between text-[11px] font-medium text-zinc-500">
            <span>{searchQuery.trim() ? 'Matching profiles' : 'Suggested contacts'}</span>
            <span className="tabular-nums">{filteredContacts.length} available</span>
          </div>

          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.05] flex items-center justify-center text-zinc-500">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-zinc-300 font-medium">
                  No matching profile for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Start a direct message thread anyway
                </p>
              </div>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const custom = searchQuery.trim().replace(/^@/, '');
                    resetAndClose();
                    onStartCustomDirectMessage(custom);
                  }}
                  className="mt-1 px-4 min-h-[44px] bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Message &ldquo;{searchQuery.trim()}&rdquo;</span>
                </button>
              )}
            </div>
          ) : (
            filteredContacts.map((contact, idx) => {
              const isSelected = selectedIds.includes(contact.id);
              const presence = presenceManager.getPresence(contact);
              const formatted = formatPresenceStatus(presence);

              return (
                <div
                  key={contact.id ? `recip-${contact.id}-${idx}` : `recip-${idx}`}
                  onClick={() => toggleContact(contact.id)}
                  className={`min-h-[54px] px-3 py-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-rose-500/10 border border-rose-500/30'
                      : 'hover:bg-white/[0.04] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/[0.08] flex items-center justify-center overflow-hidden">
                        {contact.avatar ? (
                          <img
                            src={contact.avatar}
                            alt={contact.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-zinc-300">
                            {contact.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full border-2 border-[#0c0e13] absolute -bottom-0.5 -right-0.5 ${formatted.dotClass}`}
                        title={formatted.text}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[13px] font-semibold text-white truncate">
                          {contact.name}
                        </span>
                        {contact.role && (
                          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide shrink-0">
                            · {contact.role}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {contact.handle ? `${contact.handle} · ` : ''}
                        <span className={presence.isOnline ? 'text-emerald-400' : 'text-zinc-500'}>
                          {formatted.text}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedIds.length === 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetAndClose();
                          onStartDirectMessage(contact);
                        }}
                        className="px-3 min-h-[34px] rounded-lg bg-white/[0.06] hover:bg-rose-600 text-zinc-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Chat
                      </button>
                    )}
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'border-zinc-700 bg-transparent text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/[0.07] bg-[#090b0f] flex items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-400 tabular-nums">
            {selectedContacts.length === 0
              ? 'Tap contacts to select'
              : selectedContacts.length === 1
              ? '1 recipient selected'
              : `${selectedContacts.length} recipients selected`}
          </span>

          <button
            type="button"
            disabled={selectedContacts.length === 0}
            onClick={handleConfirm}
            className={`px-4 min-h-[44px] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              selectedContacts.length > 0
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                : 'bg-white/[0.06] text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isGroupSelection ? (
              <>
                <Users className="w-4 h-4" />
                <span>Create Group ({selectedContacts.length})</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Start Chat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
