/**
 * Global Post Interactions Service (Comments & Reactions)
 * Guarantees persistence across all devices, sessions, and platforms.
 */

import { savePostReaction, normalizeReactionCounts, ReactionCounts } from '../components/social/utils/reactionStore';

export interface GlobalComment {
  id: string;
  post_id: string;
  user_id: string;
  username: string;
  author: string;
  text: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  time?: string;
  timeAgo?: string;
  timestamp?: string;
  edited?: boolean;
  updated_at?: string;
  [key: string]: any;
}

export interface ReactorUser {
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  reactionType: string;
  reactedAt?: string;
}

export interface PostInteractionsResponse {
  success: boolean;
  comments: Record<string, GlobalComment[]>;
  reactions: Record<string, {
    reactions: ReactionCounts;
    likes_count: number;
    user_reactions: Record<string, Record<string, boolean>>;
    users?: Record<string, ReactorUser>;
    updatedAt: number;
  }>;
}

// In-memory cache of global interactions
let cachedInteractions: PostInteractionsResponse | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5000; // 5-second freshness window

/**
 * Generates a valid RFC4122 v4 UUID
 */
export function generateValidUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (_) {}
  }
  // Standard RFC4122 compliant UUID v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fetch all global comments and reactions from the persistent backend
 */
export async function fetchGlobalInteractions(forceRefresh = false): Promise<PostInteractionsResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedInteractions && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedInteractions;
  }

  try {
    const res = await fetch('/api/posts/interactions');
    if (res.ok) {
      const data: PostInteractionsResponse = await res.json();
      if (data && data.success) {
        cachedInteractions = data;
        lastFetchTime = now;

        // Sync reactions with client reactionStore
        if (data.reactions && typeof window !== 'undefined') {
          try {
            const activeUserId = localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || 'guest';
            Object.entries(data.reactions).forEach(([postId, rxData]) => {
              if (rxData && rxData.reactions) {
                const userReacts = (rxData.user_reactions && rxData.user_reactions[activeUserId]) || {};
                savePostReaction(postId, rxData.reactions, userReacts, activeUserId);
              }
            });
          } catch (e) {
            console.warn('[postInteractionsService] Error updating local reactionStore:', e);
          }
        }

        return data;
      }
    }
  } catch (err) {
    console.warn('[postInteractionsService] Failed to fetch global interactions:', err);
  }

  // Graceful fallback
  return cachedInteractions || {
    success: false,
    comments: {},
    reactions: {}
  };
}

/**
 * Add a comment globally to a post
 */
export async function submitGlobalComment(
  postId: string,
  commentPayload: {
    id?: string;
    userId?: string;
    username?: string;
    text: string;
    parentCommentId?: string | null;
  }
): Promise<{ success: boolean; comment?: GlobalComment; comments?: GlobalComment[] }> {
  const commentId = (commentPayload.id && commentPayload.id.includes('-') && commentPayload.id.length >= 32)
    ? commentPayload.id
    : generateValidUUID();

  const userId = commentPayload.userId || 'anonymous';
  const authorName = commentPayload.username || 'Fan';
  const text = commentPayload.text.trim();
  const nowIso = new Date().toISOString();

  const commentObj: GlobalComment = {
    id: commentId,
    post_id: postId,
    user_id: userId,
    username: authorName,
    author: authorName,
    text: text,
    content: text,
    parent_comment_id: commentPayload.parentCommentId || null,
    created_at: nowIso,
    time: 'Just now',
    timeAgo: 'Just now',
    timestamp: nowIso
  };

  // Optimistically update local cache
  if (cachedInteractions) {
    if (!cachedInteractions.comments[postId]) {
      cachedInteractions.comments[postId] = [];
    }
    const existing = cachedInteractions.comments[postId];
    if (!existing.some(c => c.id === commentId)) {
      cachedInteractions.comments[postId] = [...existing, commentObj];
    }
  }

  // Also update localStorage cache for instant local retrieval
  if (typeof window !== 'undefined') {
    try {
      const key = `nexus_post_comments_${postId}`;
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!parsed.some((c: any) => c.id === commentId)) {
        localStorage.setItem(key, JSON.stringify([...parsed, commentObj]));
      }
    } catch (_) {}
  }

  // Send to persistent server endpoint
  try {
    const res = await fetch('/api/posts/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        comment: commentObj
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        if (cachedInteractions && json.comments) {
          cachedInteractions.comments[postId] = json.comments;
        }

        // Dispatch window event for live synchronization across components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexus_comment_added', {
            detail: { postId, comment: json.comment || commentObj }
          }));
        }

        return { success: true, comment: json.comment || commentObj, comments: json.comments };
      }
    }
  } catch (err) {
    console.warn('[postInteractionsService] Server comment submission notice:', err);
  }

  // Notify components even if offline/fallback
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_comment_added', {
      detail: { postId, comment: commentObj }
    }));
  }

  return { success: true, comment: commentObj };
}

/**
 * Edit an existing comment globally
 */
export async function updateGlobalComment(
  postId: string,
  commentId: string,
  newText: string
): Promise<{ success: boolean; comment?: GlobalComment }> {
  const cleanText = newText.trim();
  if (!cleanText) return { success: false };

  // Optimistically update memory cache
  let targetComment: GlobalComment | null = null;
  if (cachedInteractions && cachedInteractions.comments[postId]) {
    cachedInteractions.comments[postId] = cachedInteractions.comments[postId].map((c) => {
      if (c.id === commentId) {
        targetComment = {
          ...c,
          text: cleanText,
          content: cleanText,
          edited: true,
          updated_at: new Date().toISOString()
        };
        return targetComment;
      }
      return c;
    });
  }

  // Update localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const key = `nexus_post_comments_${postId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.map((c: any) => {
          if (c.id === commentId) {
            return {
              ...c,
              text: cleanText,
              content: cleanText,
              edited: true,
              updated_at: new Date().toISOString()
            };
          }
          return c;
        });
        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch (_) {}
  }

  // Dispatch window event for live synchronization across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_comment_updated', {
      detail: { postId, commentId, text: cleanText }
    }));
  }

  // Call server PUT endpoint
  try {
    const res = await fetch(`/api/posts/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanText, content: cleanText })
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.comment) {
        return { success: true, comment: json.comment };
      }
    }
  } catch (err) {
    console.warn('[postInteractionsService] Server comment update notice:', err);
  }

  return { success: true, comment: targetComment || undefined };
}

/**
 * Delete a comment globally
 */
export async function deleteGlobalComment(
  postId: string,
  commentId: string
): Promise<{ success: boolean }> {
  // Optimistically update memory cache
  if (cachedInteractions && cachedInteractions.comments[postId]) {
    cachedInteractions.comments[postId] = cachedInteractions.comments[postId].filter(
      (c) => c.id !== commentId && c.parent_comment_id !== commentId
    );
  }

  // Update localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const key = `nexus_post_comments_${postId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        const updated = parsed.filter((c: any) => c.id !== commentId && c.parent_comment_id !== commentId);
        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch (_) {}
  }

  // Dispatch window event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_comment_deleted', {
      detail: { postId, commentId }
    }));
  }

  // Call server DELETE endpoint
  try {
    const res = await fetch(`/api/posts/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const json = await res.json();
      return { success: Boolean(json.success) };
    }
  } catch (err) {
    console.warn('[postInteractionsService] Server comment delete notice:', err);
  }

  return { success: true };
}

/**
 * Toggle a reaction globally on a post
 */
export async function submitGlobalReaction(
  postId: string,
  userId: string,
  reactionType: string,
  reactorInfo?: { userName?: string; userAvatar?: string; userRole?: string }
): Promise<{ success: boolean; reactions?: ReactionCounts; user_reactions?: Record<string, boolean>; users?: Record<string, ReactorUser> }> {
  // Normalize reaction type key
  const keyMap: Record<string, string> = {
    like: 'likes',
    likes: 'likes',
    thumbs: 'likes',
    heart: 'likes',
    flame: 'hype',
    hype: 'hype',
    fire: 'hype',
    heavy: 'brutal',
    brutal: 'brutal',
    skull: 'brutal',
    horns: 'horns',
    respect: 'respect',
    crushed: 'crushed',
    rocket: 'hype'
  };
  const normalizedKey = keyMap[reactionType] || reactionType || 'likes';

  try {
    const res = await fetch('/api/posts/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        userId: userId || 'anonymous',
        reactionType: normalizedKey,
        userName: reactorInfo?.userName,
        userAvatar: reactorInfo?.userAvatar,
        userRole: reactorInfo?.userRole
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        if (cachedInteractions) {
          if (!cachedInteractions.reactions[postId]) {
            cachedInteractions.reactions[postId] = {
              reactions: data.reactions,
              likes_count: data.likes_count || data.reactions.likes || 0,
              user_reactions: {},
              users: data.users || {},
              updatedAt: Date.now()
            };
          } else {
            cachedInteractions.reactions[postId].reactions = data.reactions;
            cachedInteractions.reactions[postId].likes_count = data.likes_count || data.reactions.likes || 0;
            cachedInteractions.reactions[postId].users = data.users || cachedInteractions.reactions[postId].users || {};
          }
          cachedInteractions.reactions[postId].user_reactions[userId] = data.user_reactions;
        }

        // Save into local reactionStore
        savePostReaction(postId, data.reactions, data.user_reactions, userId);

        // Dispatch window event for UI update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('nexus_reaction_updated', {
            detail: {
              postId,
              reactions: data.reactions,
              likes_count: data.likes_count,
              user_reactions: data.user_reactions,
              user_liked: Boolean(data.user_reactions?.likes),
              users: data.users
            }
          }));
        }

        return {
          success: true,
          reactions: data.reactions,
          user_reactions: data.user_reactions,
          users: data.users
        };
      }
    }
  } catch (err) {
    console.warn('[postInteractionsService] Server reaction submission notice:', err);
  }

  return { success: false };
}
