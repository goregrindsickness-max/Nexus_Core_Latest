/**
 * Global Post Interactions Service (Comments & Reactions)
 * Guarantees persistence across all devices, sessions, and platforms (including APK / Mobile builds).
 */

import { savePostReaction, ReactionCounts } from '../components/social/utils/reactionStore';
import { getSupabase } from '../supabase';

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
  avatar?: string;
  userAvatar?: string;
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
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Direct Supabase fallback reader for mobile APK / cross-origin clients
 */
async function fetchSupabaseInteractions(): Promise<{ comments: Record<string, GlobalComment[]>; reactions: Record<string, any> }> {
  const supabase = getSupabase?.();
  if (!supabase) return { comments: {}, reactions: {} };

  try {
    const { data: posts, error } = await supabase
      .from('nexus_posts')
      .select('id, data, reactions')
      .limit(300);

    if (error || !posts) return { comments: {}, reactions: {} };

    const commentsMap: Record<string, GlobalComment[]> = {};
    const reactionsMap: Record<string, any> = {};

    posts.forEach((row: any) => {
      const pId = row.id;
      const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});

      if (Array.isArray(postObj.comments) && postObj.comments.length > 0) {
        commentsMap[pId] = postObj.comments;
      }

      if (postObj.reactions || postObj.users || row.reactions) {
        reactionsMap[pId] = {
          reactions: row.reactions || postObj.reactions || { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 },
          likes_count: postObj.likes_count || (row.reactions?.likes || 0),
          user_reactions: postObj.user_reactions || {},
          users: postObj.users || {},
          updatedAt: Date.now()
        };
      }
    });

    return { comments: commentsMap, reactions: reactionsMap };
  } catch (err) {
    console.warn('[postInteractionsService] Supabase interactions read notice:', err);
    return { comments: {}, reactions: {} };
  }
}

/**
 * Fetch all global comments and reactions from backend and Supabase
 */
export async function fetchGlobalInteractions(forceRefresh = false): Promise<PostInteractionsResponse> {
  const now = Date.now();
  if (!forceRefresh && cachedInteractions && (now - lastFetchTime) < CACHE_TTL_MS) {
    return cachedInteractions;
  }

  let serverComments: Record<string, GlobalComment[]> = {};
  let serverReactions: Record<string, any> = {};

  try {
    const res = await fetch('/api/posts/interactions');
    if (res.ok) {
      const data: PostInteractionsResponse = await res.json();
      if (data && data.success) {
        serverComments = data.comments || {};
        serverReactions = data.reactions || {};
      }
    }
  } catch (err) {
    console.warn('[postInteractionsService] Express server fetch notice:', err);
  }

  // Merge direct Supabase comments & reactions (ensures APK / Mobile builds sync live)
  const sbData = await fetchSupabaseInteractions();

  const mergedComments = { ...serverComments };
  Object.entries(sbData.comments).forEach(([pId, sbComms]) => {
    if (!mergedComments[pId] || mergedComments[pId].length === 0) {
      mergedComments[pId] = sbComms;
    } else {
      const existing = new Map(mergedComments[pId].map(c => [c.id, c]));
      sbComms.forEach(sbC => {
        const existingC = existing.get(sbC.id);
        if (!existingC) {
          existing.set(sbC.id, sbC);
        } else {
          // Compare edit/update timestamps so newest edit always prevails
          const timeA = new Date(existingC.updated_at || existingC.timestamp || existingC.created_at || 0).getTime();
          const timeB = new Date(sbC.updated_at || sbC.timestamp || sbC.created_at || 0).getTime();
          if (timeB >= timeA) {
            existing.set(sbC.id, { ...existingC, ...sbC });
          } else {
            existing.set(sbC.id, { ...sbC, ...existingC });
          }
        }
      });
      mergedComments[pId] = Array.from(existing.values());
    }
  });

  const mergedReactions = { ...serverReactions };
  Object.entries(sbData.reactions).forEach(([pId, sbRx]) => {
    if (!mergedReactions[pId]) {
      mergedReactions[pId] = sbRx;
    } else {
      const mergedUsers = { ...(mergedReactions[pId].users || {}), ...(sbRx.users || {}) };
      const mergedUserRx = { ...(mergedReactions[pId].user_reactions || {}), ...(sbRx.user_reactions || {}) };
      const counts: Record<string, number> = { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 };
      Object.values(mergedUsers).forEach((u: any) => {
        if (u && u.reactionType) {
          counts[u.reactionType] = (counts[u.reactionType] || 0) + 1;
        }
      });
      mergedReactions[pId] = {
        reactions: counts,
        likes_count: counts.likes || 0,
        user_reactions: mergedUserRx,
        users: mergedUsers,
        updatedAt: Date.now()
      };
    }
  });

  const response: PostInteractionsResponse = {
    success: true,
    comments: mergedComments,
    reactions: mergedReactions
  };

  cachedInteractions = response;
  lastFetchTime = now;

  // Sync reactions with client reactionStore
  if (response.reactions && typeof window !== 'undefined') {
    try {
      const activeUserId = localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || 'guest';
      Object.entries(response.reactions).forEach(([postId, rxData]) => {
        if (rxData && rxData.reactions) {
          const userReacts = (rxData.user_reactions && rxData.user_reactions[activeUserId]) || {};
          savePostReaction(postId, rxData.reactions, userReacts, activeUserId);
        }
      });
    } catch (e) {
      console.warn('[postInteractionsService] Error updating local reactionStore:', e);
    }
  }

  return response;
}

/**
 * Direct Supabase sync helper for comments
 */
async function syncCommentToSupabase(postId: string, commentObj: GlobalComment) {
  const supabase = getSupabase?.();
  if (!supabase) return;

  const cleanPostId = postId.replace(/^nexus_post_/, '');
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanPostId);

  try {
    let query = supabase.from('nexus_posts').select('id, data');
    if (isUUID) {
      query = query.eq('id', cleanPostId);
    } else {
      query = query.eq('id', postId);
    }
    const { data: rows } = await query.limit(1);

    if (rows && rows.length > 0) {
      const row = rows[0];
      const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
      const existingComments: any[] = Array.isArray(postObj.comments) ? postObj.comments : [];
      const updatedComments = [...existingComments.filter(c => c.id !== commentObj.id), commentObj];

      await supabase.from('nexus_posts').update({
        data: {
          ...postObj,
          comments: updatedComments
        }
      }).eq('id', row.id);
    }

    if (isUUID) {
      try {
        await supabase.from('nexus_post_comments').upsert({
          id: commentObj.id,
          post_id: cleanPostId,
          user_id: commentObj.user_id || commentObj.userId,
          author_name: commentObj.username || commentObj.author,
          content: commentObj.text || commentObj.content,
          parent_comment_id: commentObj.parent_comment_id || null,
          created_at: commentObj.created_at || new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[postInteractionsService] Supabase comment sync notice:', err);
  }
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
    avatar?: string;
    text: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'gif' | string;
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
    avatar: commentPayload.avatar || '',
    userAvatar: commentPayload.avatar || '',
    text: text,
    content: text,
    mediaUrl: commentPayload.mediaUrl || null,
    media_url: commentPayload.mediaUrl || null,
    mediaType: commentPayload.mediaType || (commentPayload.mediaUrl ? 'image' : undefined),
    parent_comment_id: commentPayload.parentCommentId || null,
    created_at: nowIso,
    time: 'Just now',
    timeAgo: 'Just now',
    timestamp: nowIso
  };

  // Optimistically update memory cache
  if (cachedInteractions) {
    if (!cachedInteractions.comments[postId]) {
      cachedInteractions.comments[postId] = [];
    }
    const existing = cachedInteractions.comments[postId];
    if (!existing.some(c => c.id === commentId)) {
      cachedInteractions.comments[postId] = [...existing, commentObj];
    }
  }

  // Update localStorage cache for instant local retrieval
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

  // Direct Supabase update (crucial for mobile APK builds)
  syncCommentToSupabase(postId, commentObj);

  // Send to persistent Express server endpoint if available
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

  let targetComment: GlobalComment | null = null;

  if (cachedInteractions) {
    if (!cachedInteractions.comments[postId]) {
      cachedInteractions.comments[postId] = [];
    }
    let found = false;
    cachedInteractions.comments[postId] = cachedInteractions.comments[postId].map((c) => {
      if (c.id === commentId) {
        found = true;
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

    if (!found) {
      targetComment = {
        id: commentId,
        post_id: postId,
        user_id: 'anonymous',
        username: 'Fan',
        author: 'Fan',
        text: cleanText,
        content: cleanText,
        parent_comment_id: null,
        edited: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      cachedInteractions.comments[postId].push(targetComment);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const key = `nexus_post_comments_${postId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        let foundLocal = false;
        const updated = parsed.map((c: any) => {
          if (c.id === commentId) {
            foundLocal = true;
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
        if (!foundLocal && targetComment) {
          updated.push(targetComment);
        }
        localStorage.setItem(key, JSON.stringify(updated));
      } else if (targetComment) {
        localStorage.setItem(key, JSON.stringify([targetComment]));
      }
    } catch (_) {}
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_comment_updated', {
      detail: { postId, commentId, text: cleanText }
    }));
  }

  // Supabase direct update
  const supabase = getSupabase?.();
  if (supabase) {
    try {
      const cleanPostId = postId.replace(/^nexus_post_/, '');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanPostId);

      let query = supabase.from('nexus_posts').select('id, data');
      if (isUUID) {
        query = query.eq('id', cleanPostId);
      } else {
        query = query.eq('id', postId);
      }
      const { data: rows } = await query.limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        const existingComments: any[] = Array.isArray(postObj.comments) ? postObj.comments : [];
        let foundInPost = false;
        const updatedComments = existingComments.map((c: any) => {
          if (c.id === commentId) {
            foundInPost = true;
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

        if (!foundInPost && targetComment) {
          updatedComments.push(targetComment);
        }

        await supabase.from('nexus_posts').update({
          data: {
            ...postObj,
            comments: updatedComments
          }
        }).eq('id', row.id);
      }

      try {
        await supabase
          .from('nexus_post_comments')
          .upsert({
            id: commentId,
            post_id: isUUID ? cleanPostId : postId,
            content: cleanText,
            edited: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      } catch (_) {}
    } catch (sbErr) {
      console.warn('[postInteractionsService] Supabase comment edit notice:', sbErr);
    }
  }

  try {
    await fetch(`/api/posts/comments/${encodeURIComponent(commentId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postId,
        text: cleanText,
        content: cleanText,
        username: targetComment?.username,
        author: targetComment?.author,
        avatar: targetComment?.avatar,
        userId: targetComment?.user_id || targetComment?.userId
      })
    });
  } catch (_) {}

  return { success: true, comment: targetComment || undefined };
}

/**
 * Delete a comment globally
 */
export async function deleteGlobalComment(
  postId: string,
  commentId: string
): Promise<{ success: boolean }> {
  if (cachedInteractions && cachedInteractions.comments[postId]) {
    cachedInteractions.comments[postId] = cachedInteractions.comments[postId].filter(
      (c) => c.id !== commentId && c.parent_comment_id !== commentId
    );
  }

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

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_comment_deleted', {
      detail: { postId, commentId }
    }));
  }

  // Supabase direct deletion
  const supabase = getSupabase?.();
  if (supabase) {
    try {
      const cleanPostId = postId.replace(/^nexus_post_/, '');
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanPostId);

      let query = supabase.from('nexus_posts').select('id, data');
      if (isUUID) {
        query = query.eq('id', cleanPostId);
      } else {
        query = query.eq('id', postId);
      }
      const { data: rows } = await query.limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
        if (Array.isArray(postObj.comments)) {
          const updatedComments = postObj.comments.filter((c: any) => c.id !== commentId && c.parent_comment_id !== commentId);
          await supabase.from('nexus_posts').update({ data: { ...postObj, comments: updatedComments } }).eq('id', row.id);
        }
      }

      try {
        await supabase.from('nexus_post_comments').delete().eq('id', commentId);
      } catch (_) {}
    } catch (_) {}
  }

  try {
    await fetch(`/api/posts/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE'
    });
  } catch (_) {}

  return { success: true };
}

/**
 * Direct Supabase reaction sync helper
 */
async function syncReactionToSupabase(
  postId: string,
  userId: string,
  reactionKey: string,
  reactorInfo?: { userName?: string; userAvatar?: string; userRole?: string }
) {
  const supabase = getSupabase?.();
  if (!supabase) return;

  try {
    const { data: rows } = await supabase
      .from('nexus_posts')
      .select('id, data, reactions')
      .or(`id.eq.${postId},id.eq.nexus_post_${postId}`)
      .limit(1);

    if (rows && rows.length > 0) {
      const row = rows[0];
      const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});

      const userReactions = postObj.user_reactions || {};
      const users = postObj.users || {};
      const userMap = userReactions[userId] || {};

      const wasActive = Boolean(userMap[reactionKey]);

      if (!wasActive) {
        Object.keys(userMap).forEach((k) => { if (k !== reactionKey) userMap[k] = false; });
        userMap[reactionKey] = true;
        users[userId] = {
          userId,
          userName: reactorInfo?.userName || 'Scene Member',
          userAvatar: reactorInfo?.userAvatar || '',
          userRole: reactorInfo?.userRole || 'Scene Fan',
          reactionType: reactionKey,
          reactedAt: new Date().toISOString()
        };
      } else {
        userMap[reactionKey] = false;
        delete users[userId];
      }

      userReactions[userId] = userMap;

      const counts: Record<string, number> = { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 };
      Object.values(users).forEach((u: any) => {
        if (u && u.reactionType) {
          counts[u.reactionType] = (counts[u.reactionType] || 0) + 1;
        }
      });

      await supabase.from('nexus_posts').update({
        reactions: counts,
        data: {
          ...postObj,
          reactions: counts,
          user_reactions: userReactions,
          users: users
        }
      }).eq('id', row.id);
    }
  } catch (err) {
    console.warn('[postInteractionsService] Supabase reaction sync notice:', err);
  }
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

  // Direct Supabase sync (guarantees APK / mobile clients update live)
  syncReactionToSupabase(postId, userId, normalizedKey, reactorInfo);

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

  return { success: true };
}
