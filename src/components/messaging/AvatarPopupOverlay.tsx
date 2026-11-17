import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, Send, Clock, Sparkles, Image as ImageIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { OPEN_AVATAR_POPUP_EVENT, OpenAvatarPopupPayload } from '../../utils/avatarPopupEvents';
import { getSupabase } from '../../supabase';
import { usePinchZoom } from '../../hooks/usePinchZoom';
import { resolveCommentAvatar, DEFAULT_PERSONAL_AVATAR, MIGUEL_DEFAULT_AVATAR } from '../../utils/bandProfileUtils';
import { authFetch, getSupabaseAccessToken } from '../../utils/apiConfig';

interface Reaction {
  userId: string;
  username: string;
  avatarUrl: string | null;
  emoji: string;
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  createdAt: string;
}

const EMOJIS = ['🔥', '🤘', '❤️', '💀', '👏', '😮', '🌟', '⚡'] as const;

const EMOJI_TO_KEY: Record<string, string> = {
  '🔥': 'fire',
  '🤘': 'horns',
  '❤️': 'heart',
  '💀': 'skull',
  '👏': 'clap',
  '😮': 'wow',
  '🌟': 'star',
  '⚡': 'bolt',
};

const KEY_TO_EMOJI: Record<string, string> = {
  fire: '🔥',
  horns: '🤘',
  heart: '❤️',
  likes: '❤️',
  skull: '💀',
  clap: '👏',
  wow: '😮',
  star: '🌟',
  bolt: '⚡',
};

const normalizeEmojiKey = (rawKey: string): string => {
  return KEY_TO_EMOJI[rawKey] || rawKey;
};

export interface NormalizedReactionState {
  counts: Record<string, number>;
  userActive: Record<string, boolean>;
}

/**
 * Safely normalizes reactions whether they arrive as:
 * - backend count map: { horns: 2, fire: 1, skull: 0, heart: 0 } + userReactions
 * - legacy/optimistic array: [{ userId, username, avatarUrl, emoji }, ...]
 * - null, undefined, or malformed localStorage data
 */
export const normalizeReactionState = (
  rawReactions: unknown,
  rawUserReactions?: unknown,
  currentUserId?: string | null
): NormalizedReactionState => {
  const counts: Record<string, number> = {};
  const userActive: Record<string, boolean> = {};

  if (Array.isArray(rawReactions)) {
    for (const item of rawReactions) {
      if (!item || typeof item !== 'object') continue;
      const emojiRaw = (item as any).emoji || (item as any).reactionType;
      if (!emojiRaw || typeof emojiRaw !== 'string') continue;
      const emoji = normalizeEmojiKey(emojiRaw);
      counts[emoji] = (counts[emoji] || 0) + 1;
      if (currentUserId && (item as any).userId === currentUserId) {
        userActive[emoji] = true;
      }
    }
  } else if (rawReactions && typeof rawReactions === 'object') {
    for (const [key, val] of Object.entries(rawReactions as Record<string, unknown>)) {
      const numeric = Number(val);
      if (!Number.isFinite(numeric) || numeric <= 0) continue;
      const emoji = normalizeEmojiKey(key);
      counts[emoji] = (counts[emoji] || 0) + numeric;
    }
  }

  if (rawUserReactions && typeof rawUserReactions === 'object' && !Array.isArray(rawUserReactions)) {
    const mapObj = rawUserReactions as Record<string, unknown>;
    const userBucket =
      currentUserId && mapObj[currentUserId] && typeof mapObj[currentUserId] === 'object'
        ? (mapObj[currentUserId] as Record<string, unknown>)
        : null;

    if (userBucket) {
      for (const [key, active] of Object.entries(userBucket)) {
        if (active) {
          userActive[normalizeEmojiKey(key)] = true;
        }
      }
    } else {
      // Handle flat { [emojiOrKey]: boolean } cached shape
      for (const [key, active] of Object.entries(mapObj)) {
        if (typeof active === 'boolean' && active) {
          userActive[normalizeEmojiKey(key)] = true;
        }
      }
    }
  }

  return { counts, userActive };
};

export const getTotalReactionCount = (counts: Record<string, number> | null | undefined): number => {
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)) return 0;
  return Object.values(counts).reduce((sum, val) => {
    const num = Number(val);
    return Number.isFinite(num) && num > 0 ? sum + num : sum;
  }, 0);
};

export const normalizeComments = (rawComments: unknown): Comment[] => {
  if (!Array.isArray(rawComments)) return [];
  return rawComments
    .filter((c): c is Record<string, any> => Boolean(c && typeof c === 'object'))
    .map((c, idx) => ({
      id: String(c.id || `comment_${idx}`),
      userId: String(c.userId || 'anon'),
      username: String(c.username || c.authorName || 'Scene Member'),
      avatarUrl: c.avatarUrl || c.authorAvatar || null,
      text: String(c.text || ''),
      createdAt: String(c.createdAt || new Date().toISOString()),
    }))
    .filter((c) => c.text.length > 0);
};

export const AvatarPopupOverlay: React.FC = () => {
  const [activePayload, setActivePayload] = useState<OpenAvatarPopupPayload | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const currentUserRef = useRef<any>(null);
  currentUserRef.current = currentUser;

  // Derive stable unique target ID for photo interactions
  const getTargetId = (payload: OpenAvatarPopupPayload | null): string => {
    if (!payload) return 'photo_default';
    if (payload.photoId) return payload.photoId;
    if (payload.profileId) return payload.profileId;
    const imgUrl = payload.imageUrl || payload.avatarUrl;
    if (imgUrl) {
      const cleanUrl = imgUrl.replace(/[^a-zA-Z0-9]/g, '_').slice(-35);
      return `img_${cleanUrl}`;
    }
    return 'photo_default';
  };

  // Load current active profile on initialization
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const stored = localStorage.getItem('nexus_core_user_profile');
        if (stored) {
          setCurrentUser(JSON.parse(stored));
          return;
        }

        const supabase = getSupabase();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (profile) {
              setCurrentUser(profile);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load current user for picture interactions:', err);
      }
    };
    fetchCurrentUser();
  }, [activePayload]);

  // Fetch reactions and comments with local fallback
  const fetchInteractions = async (targetId: string) => {
    try {
      setLoading(true);
      const userId = currentUserRef.current?.id || null;

      // Reset before loading next target so previous photo's state never leaks
      setReactionCounts({});
      setUserReactions({});
      setComments([]);

      // Load local cache first for instant UI response
      const localCacheKey = `picture_interactions_${targetId}`;
      const localSaved = localStorage.getItem(localCacheKey);
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          const norm = normalizeReactionState(parsed?.reactions, parsed?.userReactions, userId);
          setReactionCounts(norm.counts);
          setUserReactions(norm.userActive);
          setComments(normalizeComments(parsed?.comments));
        } catch (e) {}
      }

      const res = await authFetch(`/api/avatar-interactions/${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const data = await res.json();
        const activeUid = currentUserRef.current?.id || userId;
        const norm = normalizeReactionState(data?.reactions, data?.userReactions, activeUid);
        const normalizedComments = normalizeComments(data?.comments);

        setReactionCounts(norm.counts);
        setUserReactions(norm.userActive);
        setComments(normalizedComments);

        localStorage.setItem(localCacheKey, JSON.stringify({
          reactions: norm.counts,
          userReactions: norm.userActive,
          comments: normalizedComments,
        }));
      }
    } catch (err) {
      console.warn('Network sync for picture interactions deferred:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle global custom events to trigger this popup
  useEffect(() => {
    const handleOpenPopup = (event: Event) => {
      const customEvent = event as CustomEvent<OpenAvatarPopupPayload>;
      if (customEvent.detail) {
        setActivePayload(customEvent.detail);
        const targetId = getTargetId(customEvent.detail);
        fetchInteractions(targetId);
      }
    };

    window.addEventListener(OPEN_AVATAR_POPUP_EVENT, handleOpenPopup);
    return () => {
      window.removeEventListener(OPEN_AVATAR_POPUP_EVENT, handleOpenPopup);
    };
  }, []);

  // React to the photo
  const handleReact = async (emoji: string) => {
    if (!activePayload) return;
    const targetId = getTargetId(activePayload);

    const userObj = currentUser || {
      id: `anon_${Date.now()}`,
      name: 'Fan Node',
      username: 'fan_node',
      avatar_url: null
    };

    const wasActive = Boolean(userReactions[emoji]);
    const nextUserReactions: Record<string, boolean> = {
      ...userReactions,
      [emoji]: !wasActive,
    };
    const nextCounts: Record<string, number> = {
      ...reactionCounts,
      [emoji]: Math.max(0, (reactionCounts[emoji] || 0) + (wasActive ? -1 : 1)),
    };
    if (nextCounts[emoji] === 0) {
      delete nextCounts[emoji];
    }

    setUserReactions(nextUserReactions);
    setReactionCounts(nextCounts);

    localStorage.setItem(`picture_interactions_${targetId}`, JSON.stringify({
      reactions: nextCounts,
      userReactions: nextUserReactions,
      comments,
    }));

    try {
      const token = await getSupabaseAccessToken();
      if (!token) return;
      const reactionType = EMOJI_TO_KEY[emoji] || emoji;
      const res = await authFetch(`/api/avatar-interactions/${encodeURIComponent(targetId)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reactionType,
          emoji,
          userId: userObj.id,
          username: userObj.name || userObj.username || 'Fan Node',
          avatarUrl: userObj.avatar_url || userObj.creative_avatar || userObj.promoter_logo || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const norm = normalizeReactionState(data?.reactions, data?.userReactions, userObj.id);
        setReactionCounts(norm.counts);
        setUserReactions(norm.userActive);
        localStorage.setItem(`picture_interactions_${targetId}`, JSON.stringify({
          reactions: norm.counts,
          userReactions: norm.userActive,
          comments: data?.comments ? normalizeComments(data.comments) : comments,
        }));
      }
    } catch (err) {
      console.warn('Optimistic reaction saved locally:', err);
    }
  };

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayload || !newComment.trim()) return;

    const targetId = getTargetId(activePayload);
    const userObj = currentUser || {
      id: `anon_${Date.now()}`,
      name: 'Fan Node',
      username: 'fan_node',
      avatar_url: null
    };

    const commentText = newComment.trim();
    const authorName = userObj.name || userObj.username || 'Fan Node';
    const authorAvatar = userObj.avatar_url || userObj.creative_avatar || userObj.promoter_logo || null;

    const commentObj: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userObj.id || 'anon',
      username: authorName,
      avatarUrl: authorAvatar,
      text: commentText,
      createdAt: new Date().toISOString()
    };

    // Optimistic comment insertion
    setComments(prev => {
      const updated = [...prev, commentObj];
      localStorage.setItem(`picture_interactions_${targetId}`, JSON.stringify({
        reactions: reactionCounts,
        userReactions,
        comments: updated,
      }));
      return updated;
    });

    setNewComment('');

    setTimeout(() => {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      setSubmittingComment(true);
      const token = await getSupabaseAccessToken();
      if (!token) return;
      const res = await authFetch(`/api/avatar-interactions/${encodeURIComponent(targetId)}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: {
            id: commentObj.id,
            text: commentText,
            authorName,
            authorAvatar: authorAvatar || '',
            authorRole: userObj.role || 'Fan',
          },
          userId: userObj.id,
          username: authorName,
          avatarUrl: authorAvatar,
          text: commentText,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.comments) {
          const normalized = normalizeComments(data.comments);
          setComments(normalized);
          localStorage.setItem(`picture_interactions_${targetId}`, JSON.stringify({
            reactions: reactionCounts,
            userReactions,
            comments: normalized,
          }));
        }
      }
    } catch (err) {
      console.warn('Comment saved locally to cache:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Close popup on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePayload(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalReactions = getTotalReactionCount(reactionCounts);
  const activeReactionEntries = Object.entries(reactionCounts).filter(([, count]) => count > 0);

  const hasUserReacted = (emoji: string) => {
    return Boolean(userReactions[emoji]);
  };

  const displayImg = activePayload?.imageUrl || activePayload?.avatarUrl;
  const titleText = activePayload?.title || (activePayload?.username ? `@${activePayload.username}'s Photo` : 'Expanded Photo Viewer');

  const {
    scale,
    pan,
    isDragging,
    reset,
    zoomIn,
    zoomOut,
    containerProps,
    imageStyle,
  } = usePinchZoom({ minScale: 1, maxScale: 4 });

  // Reset zoom when switching active payload
  useEffect(() => {
    reset();
  }, [activePayload, reset]);

  return (
    <AnimatePresence>
      {activePayload && (
        <div id="picture-viewer-modal-portal" className="fixed inset-0 z-[9999999] flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop Blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActivePayload(null)}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-5xl h-[90vh] max-h-[780px] bg-zinc-950 border border-zinc-800/90 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
          >
            {/* Left Stage: Expanded Photo Viewer with Pinch-to-Zoom */}
            <div 
              className="flex-1 bg-black/95 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-zinc-800/80 h-1/2 md:h-full overflow-hidden select-none group"
              {...containerProps}
            >
              {/* Zoom Controls Overlay Toolbar */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-1 bg-black/70 backdrop-blur-md border border-zinc-800/80 rounded-xl p-1 shadow-lg pointer-events-auto">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); zoomOut(0.5); }}
                  className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out (-)"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-[10px] font-mono font-bold text-zinc-300 px-1 min-w-[34px] text-center select-none">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); zoomIn(0.5); }}
                  className="p-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In (+)"
                >
                  <ZoomIn size={15} />
                </button>
                {scale > 1.05 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); reset(); }}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={() => setActivePayload(null)}
                className="absolute top-3 right-3 md:hidden z-30 p-2 rounded-full bg-black/70 text-zinc-300 hover:text-white border border-zinc-800/80 transition"
              >
                <X size={18} />
              </button>

              {displayImg ? (
                <img
                  src={displayImg}
                  alt={activePayload.username || 'Photo'}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-contain select-none ${
                    scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                  }`}
                  style={imageStyle}
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 space-y-2">
                  <ImageIcon size={48} className="opacity-40" />
                  <p className="text-xs font-mono uppercase tracking-widest">Image unavailable</p>
                </div>
              )}

              {/* Photo Title & Caption Overlay (Hidden when heavily zoomed in so image is unobstructed) */}
              {scale <= 1.2 && (
                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1 z-10 pointer-events-none transition-opacity duration-200">
                  <div className="self-start bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                    <Sparkles size={13} className="text-purple-400" />
                    <span>{titleText}</span>
                  </div>
                  {activePayload.caption && (
                    <div className="bg-black/75 backdrop-blur-md border border-zinc-800/60 p-2.5 rounded-lg text-xs text-zinc-200 leading-relaxed shadow-lg max-h-24 overflow-y-auto">
                      {activePayload.caption}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Reactions, Interactions, Comments */}
            <div className="w-full md:w-[380px] lg:w-[420px] h-1/2 md:h-full flex flex-col bg-zinc-950">
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  {activePayload.avatarUrl ? (
                    <img
                      src={activePayload.avatarUrl}
                      alt={activePayload.username}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-zinc-700 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-600/40 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {(activePayload.username || 'U').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      @{activePayload.username || 'anonymous_node'}
                    </h3>
                    <p className="text-[10px] text-zinc-500 truncate">React & comment on this signal photo</p>
                  </div>
                </div>

                <button
                  onClick={() => setActivePayload(null)}
                  className="hidden md:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Quick Reactions Bar */}
              <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/20">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-2 flex items-center justify-between">
                  <span>EXPRESS SIGNAL REACTION</span>
                  {totalReactions > 0 && (
                    <span className="text-purple-400">{totalReactions} total</span>
                  )}
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {EMOJIS.map((emoji, idx) => (
                    <button
                      key={`${emoji}-${idx}`}
                      onClick={() => handleReact(emoji)}
                      title={`React ${emoji}`}
                      className={`text-base px-2.5 py-1.5 rounded-lg border transition-all ${
                        hasUserReacted(emoji)
                          ? 'bg-purple-950/60 border-purple-500 text-white scale-105 shadow-md shadow-purple-500/20 ring-1 ring-purple-500/50'
                          : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:scale-105 text-zinc-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Aggregated reactions count pills */}
                {activeReactionEntries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-zinc-800/50">
                    {activeReactionEntries.map(([emoji, count], idx) => (
                      <div
                        key={`${emoji}-${idx}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                      >
                        <span>{emoji}</span>
                        <span className="font-bold text-[10px] text-purple-400">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Comments Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 scrollbar-thin">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                  COMMENTS ({comments.length})
                </div>

                {loading && comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-2">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-zinc-500">Synchronizing comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-zinc-900 rounded-xl p-4">
                    <MessageSquare size={22} className="text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500 font-medium">No comments yet</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">Be the first to leave feedback on this photo!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment, idx) => (
                      <div key={`${comment.id}-${idx}`} className="flex gap-2.5 text-xs">
                        {/* Commenter Avatar */}
                        <div className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center overflow-hidden font-bold text-[10px] text-purple-400">
                          <img
                            src={resolveCommentAvatar({ ...comment, avatar: comment.avatarUrl })}
                            alt={comment.username}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).setAttribute('src', (comment.username || '').toLowerCase().includes('miguel') ? MIGUEL_DEFAULT_AVATAR : DEFAULT_PERSONAL_AVATAR);
                            }}
                          />
                        </div>

                        {/* Comment Content */}
                        <div className="flex-1 bg-zinc-900/50 border border-zinc-800/70 rounded-xl px-3 py-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-zinc-200">@{comment.username}</span>
                            <span className="text-[9px] text-zinc-500 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-zinc-300 break-words leading-relaxed text-xs">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                )}
              </div>

              {/* Submit Comment Form */}
              <form onSubmit={handleAddComment} className="p-3.5 border-t border-zinc-800 bg-zinc-950">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={submittingComment}
                    placeholder="Type a comment or response..."
                    maxLength={280}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-600 rounded-xl py-2 px-3.5 pr-10 text-xs text-white placeholder-zinc-500 outline-none transition disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="absolute right-2 p-1.5 rounded-lg text-purple-400 hover:text-white disabled:text-zinc-700 transition"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const PictureViewerModal = AvatarPopupOverlay;
export default AvatarPopupOverlay;
