import { socialFeedStore } from '../../../utils/indexedDB';

export interface ReactionCounts {
  likes: number;
  horns: number;
  hype: number;
  brutal: number;
  respect: number;
  crushed: number;
  [key: string]: number;
}

export interface UserReactionsState {
  user_reactions: Record<string, boolean>;
  user_liked: boolean;
  updatedAt?: number;
}

export interface StoredPostReactionData {
  reactions: ReactionCounts;
  likes_count: number;
  updatedAt: number;
}

const GLOBAL_REACTIONS_STORAGE_KEY = 'nexus_global_post_reactions_v1';
const USER_REACTIONS_STORAGE_PREFIX = 'nexus_user_reactions_v1_';

export const DEFAULT_REACTION_COUNTS: ReactionCounts = {
  likes: 0,
  horns: 0,
  hype: 0,
  brutal: 0,
  respect: 0,
  crushed: 0,
};

// In-memory cache for ultra-fast access
let globalReactionsCache: Record<string, StoredPostReactionData> | null = null;
const userReactionsCache: Record<string, Record<string, UserReactionsState>> = {};

/**
 * Normalizes any reactions input (array, object, or undefined) into uniform ReactionCounts
 */
export function normalizeReactionCounts(rx: any): ReactionCounts {
  if (!rx) return { ...DEFAULT_REACTION_COUNTS };

  if (Array.isArray(rx)) {
    const counts = { ...DEFAULT_REACTION_COUNTS };
    rx.forEach((r: any) => {
      if (!r || !r.type) return;
      const t = String(r.type).toLowerCase();
      const count = Number(r.count) || 0;
      if (t === 'likes' || t === 'like' || t === 'heart' || t === 'thumbs') counts.likes += count;
      else if (t === 'horns' || t === 'horn') counts.horns += count;
      else if (t === 'hype' || t === 'flame' || t === 'fire' || t === 'rocket') counts.hype += count;
      else if (t === 'brutal' || t === 'heavy' || t === 'skull' || t === 'grim' || t === 'hammer') counts.brutal += count;
      else if (t === 'respect' || t === 'fist') counts.respect += count;
      else if (t === 'crushed' || t === 'anchor') counts.crushed += count;
      else counts[t] = (counts[t] || 0) + count;
    });
    return counts;
  }

  if (typeof rx === 'object' && rx !== null) {
    return {
      likes: Number(rx.likes || rx.like || rx.heart || rx.thumbs || 0),
      horns: Number(rx.horns || rx.horn || 0),
      hype: Number(rx.hype || rx.flame || rx.fire || rx.rocket || 0),
      brutal: Number(rx.brutal || rx.heavy || rx.skull || rx.grim || rx.hammer || 0),
      respect: Number(rx.respect || rx.fist || 0),
      crushed: Number(rx.crushed || rx.anchor || 0),
    };
  }

  return { ...DEFAULT_REACTION_COUNTS };
}

/**
 * Reads all stored global post reactions
 */
export function getStoredGlobalReactions(): Record<string, StoredPostReactionData> {
  if (globalReactionsCache) return globalReactionsCache;
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(GLOBAL_REACTIONS_STORAGE_KEY);
      if (raw) {
        globalReactionsCache = JSON.parse(raw);
        return globalReactionsCache || {};
      }
    }
  } catch (e) {
    console.warn('[reactionStore] Error reading global reactions from localStorage:', e);
  }
  globalReactionsCache = {};
  return globalReactionsCache;
}

/**
 * Reads all stored user reactions for a given user profile ID
 */
export function getStoredUserReactions(userId?: string): Record<string, UserReactionsState> {
  const mergedMap: Record<string, UserReactionsState> = {};
  if (typeof window === 'undefined') return mergedMap;

  try {
    // 1. Scan all user reaction storage keys in localStorage to collect user reaction state across all personas/IDs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(USER_REACTIONS_STORAGE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              Object.entries(parsed).forEach(([pId, state]: [string, any]) => {
                if (state && (state.user_liked || (state.user_reactions && Object.values(state.user_reactions).some(Boolean)))) {
                  if (!mergedMap[pId] || (state.updatedAt || 0) >= (mergedMap[pId].updatedAt || 0)) {
                    mergedMap[pId] = state;
                  }
                }
              });
            }
          } catch (_) {}
        }
      }
    }
  } catch (e) {
    console.warn(`[reactionStore] Error scanning user reactions:`, e);
  }

  // Also check direct cache or specific userId key if specified
  const userKey = userId || 'current';
  if (userReactionsCache[userKey]) {
    Object.assign(mergedMap, userReactionsCache[userKey]);
  }

  return mergedMap;
}

/**
 * Persists updated reaction counts globally and for the current user in both localStorage and IndexedDB
 */
export async function savePostReaction(
  postId: string,
  reactions: ReactionCounts,
  userReacts: Record<string, boolean>,
  userId?: string
): Promise<void> {
  if (!postId) return;
  const normReactions = normalizeReactionCounts(reactions);
  const totalLikes = normReactions.likes;
  const isLiked = Boolean(userReacts.likes || userReacts.like || userReacts.heart || userReacts.thumbs);
  const now = Date.now();

  // 1. Update Global Aggregate Store
  const global = getStoredGlobalReactions();
  global[postId] = {
    reactions: normReactions,
    likes_count: totalLikes,
    updatedAt: now,
  };
  globalReactionsCache = global;

  try {
    localStorage.setItem(GLOBAL_REACTIONS_STORAGE_KEY, JSON.stringify(global));
    socialFeedStore.setItem(GLOBAL_REACTIONS_STORAGE_KEY, global).catch(() => {});
  } catch (e) {
    console.warn('[reactionStore] Error persisting global reaction data:', e);
  }

  // 2. Update User-Specific Store (write to both specific userId and general 'current' key)
  const keysToUpdate = new Set<string>();
  if (userId) keysToUpdate.add(userId);
  keysToUpdate.add('current');
  const activeProfileId = typeof window !== 'undefined' ? (localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id')) : null;
  if (activeProfileId) keysToUpdate.add(activeProfileId);

  keysToUpdate.forEach(key => {
    const userMap = getStoredUserReactions(key);
    userMap[postId] = {
      user_reactions: { ...userReacts },
      user_liked: isLiked,
      updatedAt: now,
    };
    userReactionsCache[key] = userMap;

    try {
      const storageKey = `${USER_REACTIONS_STORAGE_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify(userMap));
      socialFeedStore.setItem(storageKey, userMap).catch(() => {});
    } catch (e) {
      console.warn(`[reactionStore] Error persisting user reaction data for ${key}:`, e);
    }
  });

  // 3. Dispatch window event for live synchronization across components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nexus_reaction_updated', {
        detail: {
          postId,
          reactions: normReactions,
          likes_count: totalLikes,
          user_reactions: userReacts,
          user_liked: isLiked,
          userId: userId || 'current',
        },
      })
    );
  }
}

/**
 * Ingests a post (from Supabase, cache, or mock data) and merges persisted reaction state
 * so that reactions survive page refreshes and never disappear.
 */
export function mergePostWithReactions(post: any, userId?: string): any {
  if (!post || typeof post !== 'object') return post;
  const postId = post.id;
  if (!postId) return post;

  const baseReactions = normalizeReactionCounts(post.reactions);
  const globalStore = getStoredGlobalReactions();
  const userStore = getStoredUserReactions(userId);

  const storedGlobal = globalStore[postId];
  const storedUser = userStore[postId];

  // Merge aggregate reaction counts
  let mergedReactions = { ...baseReactions };
  if (storedGlobal?.reactions) {
    mergedReactions = {
      likes: Math.max(baseReactions.likes, storedGlobal.reactions.likes || 0),
      horns: Math.max(baseReactions.horns, storedGlobal.reactions.horns || 0),
      hype: Math.max(baseReactions.hype, storedGlobal.reactions.hype || 0),
      brutal: Math.max(baseReactions.brutal, storedGlobal.reactions.brutal || 0),
      respect: Math.max(baseReactions.respect, storedGlobal.reactions.respect || 0),
      crushed: Math.max(baseReactions.crushed, storedGlobal.reactions.crushed || 0),
    };
  }

  // Merge user reaction state
  let finalUserReacts = post.user_reactions ? { ...post.user_reactions } : {};
  let finalUserLiked = Boolean(post.user_liked);

  if (storedUser) {
    finalUserReacts = { ...storedUser.user_reactions };
    finalUserLiked = Boolean(storedUser.user_liked);
  }

  // Ensure count is at least 1 for any reaction the user actively has selected
  Object.keys(finalUserReacts).forEach((k) => {
    if (finalUserReacts[k]) {
      const normKey = k as keyof ReactionCounts;
      if (mergedReactions[normKey] !== undefined && mergedReactions[normKey] < 1) {
        mergedReactions[normKey] = 1;
      }
    }
  });

  const likesCount = mergedReactions.likes || post.likes_count || 0;

  return {
    ...post,
    reactions: mergedReactions,
    likes_count: likesCount,
    user_liked: finalUserLiked,
    user_reactions: finalUserReacts,
  };
}
