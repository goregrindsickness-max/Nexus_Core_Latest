import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, ShoppingCart, Trash2, Reply } from 'lucide-react';

export interface FanPitWallDrawerProps {
  activePitWallShow: any | null;
  setActivePitWallShow: (val: any | null) => void;
  userProfile?: any;
  triggerNotification?: (msg: string) => void;
  setIsCartOpen?: (val: boolean) => void;
  cartItems?: any[];
}

export const FanPitWallDrawer: React.FC<FanPitWallDrawerProps> = ({
  activePitWallShow,
  setActivePitWallShow,
  userProfile,
  triggerNotification,
  setIsCartOpen,
  cartItems = [],
}) => {
  const [newPitWallMessage, setNewPitWallMessage] = useState('');
  const [pitWallMessages, setPitWallMessages] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const eventKey = useMemo(() => {
    if (!activePitWallShow) return 'default_event';
    return String(
      activePitWallShow.id ||
        `${activePitWallShow.band || activePitWallShow.headliner || 'show'}_${activePitWallShow.city || ''}`
    ).trim();
  }, [activePitWallShow]);

  useEffect(() => {
    if (!activePitWallShow) return;
    setReplyingTo(null);
    let cancelled = false;
    fetch(`/api/shows/${encodeURIComponent(eventKey)}/pitwall`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data.messages)) {
          setPitWallMessages(data.messages);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activePitWallShow, eventKey]);

  useEffect(() => {
    if (activePitWallShow) {
      const t = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [activePitWallShow, pitWallMessages.length]);

  const handleSendPitWallMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = newPitWallMessage.trim();
    if (!text || !activePitWallShow) return;

    const senderId = userProfile?.id || 'guest_fan';
    const senderName =
      userProfile?.bandName ||
      userProfile?.username ||
      userProfile?.name ||
      userProfile?.full_name ||
      'Scene Attendee';
    const senderAvatar =
      userProfile?.avatar_url || userProfile?.avatar || userProfile?.profileAvatarUrl || '';

    const payload = {
      id: `pit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      eventId: eventKey,
      user_id: senderId,
      username: senderName,
      avatar_url: senderAvatar,
      text,
      replyTo: replyingTo
        ? { id: replyingTo.id, username: replyingTo.username, text: replyingTo.text }
        : null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString(),
    };

    setPitWallMessages((prev) => [...prev, payload]);
    setNewPitWallMessage('');
    setReplyingTo(null);

    try {
      await fetch(`/api/shows/${encodeURIComponent(eventKey)}/pitwall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (_) {}

    triggerNotification?.('✨ Posted to Venue Pit Wall!');
  };

  const handleDeleteMessage = async (messageId: string) => {
    setPitWallMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await fetch(
        `/api/shows/${encodeURIComponent(eventKey)}/pitwall/${encodeURIComponent(messageId)}`,
        { method: 'DELETE' }
      );
    } catch (_) {}
  };

  return (
    <AnimatePresence>
      {activePitWallShow !== null && (
        <motion.div
          key="fan-pit-wall-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[10075]"
          onClick={() => setActivePitWallShow(null)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="h-[100dvh] w-full sm:w-[420px] bg-[#0c0f12] border-l border-rose-900/40 z-[10080] flex flex-col justify-between ml-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-white font-display">
                    Venue Pit Wall
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Live Show Chat • {activePitWallShow?.venue || activePitWallShow?.band || 'Live Event'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {setIsCartOpen && (
                  <button
                    onClick={() => {
                      setActivePitWallShow(null);
                      setIsCartOpen(true);
                    }}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 transition-colors relative cursor-pointer"
                    title="Open Cart"
                  >
                    <ShoppingCart className="w-4 h-4 text-rose-400" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                        {cartItems.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0)}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => setActivePitWallShow(null)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* System Notice */}
            <div className="px-4 py-2 bg-rose-950/20 border-b border-rose-900/30 text-[10px] text-rose-300 font-mono flex items-center justify-between">
              <span>📍 Real-Time Attendee & Fan Channel</span>
              <span className="text-emerald-400 font-bold">LIVE</span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 custom-scrollbar">
              {pitWallMessages.length === 0 ? (
                <div className="text-center py-12 px-3 space-y-2">
                  <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-300">Start the Pit Wall conversation</p>
                  <p className="text-[11px] text-zinc-500">
                    Ask about set times, merch availability, or connect with other fans heading to {activePitWallShow?.venue || 'the show'}.
                  </p>
                </div>
              ) : (
                pitWallMessages.map((msg, mIdx) => {
                  const authorName = msg.username || msg.author || 'Attendee';
                  const avatarUrl = msg.avatar_url || msg.avatar || '';
                  const bodyText = msg.text || msg.content || '';
                  const timeLabel = msg.timestamp || msg.time || '';
                  const isMe =
                    (userProfile?.id && msg.user_id === userProfile.id) ||
                    (userProfile?.name && authorName === userProfile.name);

                  return (
                    <div key={msg.id ? `pit-msg-${msg.id}-${mIdx}` : `pit-msg-${mIdx}`} className="flex gap-3 group">
                      <div className="w-8 h-8 rounded-full border border-rose-900/40 bg-zinc-800 flex items-center justify-center text-xs font-bold text-white overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          authorName[0]?.toUpperCase() || 'F'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="text-xs font-bold text-white truncate">{authorName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono shrink-0">{timeLabel}</span>
                        </div>
                        <div className="p-3 bg-zinc-900/90 border border-zinc-800/80 rounded-xl rounded-tl-none text-xs text-zinc-200 leading-relaxed space-y-1.5">
                          {msg.replyTo && msg.replyTo.text && (
                            <div className="px-2 py-1 rounded bg-black/40 border-l-2 border-rose-500 text-[10px] text-zinc-400">
                              <span className="font-mono font-bold text-rose-300 block">↩ @{msg.replyTo.username}</span>
                              <span className="line-clamp-1">{msg.replyTo.text}</span>
                            </div>
                          )}
                          <p className="break-words">{bodyText}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({ id: msg.id, username: authorName, text: bodyText });
                              inputRef.current?.focus();
                            }}
                            className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                          {isMe && msg.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendPitWallMessage}
              className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-800 bg-zinc-950 space-y-2"
            >
              {replyingTo && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-rose-500/40 text-[11px] font-mono text-zinc-300">
                  <span className="truncate">
                    Replying to <strong className="text-rose-400">@{replyingTo.username}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newPitWallMessage}
                  onChange={(e) => setNewPitWallMessage(e.target.value)}
                  placeholder="Message the Venue Pit Wall..."
                  className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!newPitWallMessage.trim()}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
