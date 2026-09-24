import { initialForumThreads } from '../data/forumMockData';
import { getSupabase } from '../supabase';

export interface ForumComment {
  id: string;
  author: string;
  authorAvatar?: string;
  text: string;
  timeAgo: string;
  replies?: any[];
}

export interface ForumHighlightThread {
  id: string;
  title: string;
  content: string;
  category: string;
  genre: string;
  primaryGenre?: string;
  author: string;
  authorAvatar?: string;
  userId?: string;
  user_id?: string;
  isUserCreated?: boolean;
  image?: string;
  youtubeId?: string;
  timeAgo: string;
  created_at?: string;
  votes: number;
  userVote?: 'up' | 'down' | null;
  comments: ForumComment[];
}

export const FORUM_CACHE_KEY = 'nexus_forum_threads_cache';

// Known IDs for hardcoded mock discussion templates
export const MOCK_THREAD_IDS = new Set(['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']);

/**
 * Checks if a forum thread was created by the active user
 */
export function isUserForumThread(
  thread: ForumHighlightThread | any,
  userProfile?: any,
  currentUserName?: string,
  currentUserId?: string
): boolean {
  if (!thread) return false;

  // 1. Explicit user-created flag
  if (thread.isUserCreated === true) return true;

  // 2. Direct user ID match
  const activeUid = currentUserId || userProfile?.id;
  if (activeUid && (thread.userId === activeUid || thread.user_id === activeUid)) {
    return true;
  }

  // 3. User handle & name comparison
  const rawAuthor = (thread.author || '').toLowerCase().replace(/^@+/, '').trim();
  if (rawAuthor) {
    const candidates: (string | undefined)[] = [
      currentUserName,
      userProfile?.name,
      userProfile?.full_name,
      userProfile?.handle,
      userProfile?.console_handle,
      userProfile?.email ? userProfile.email.split('@')[0] : undefined,
      'goregrind',
      'goregrinder',
      'goregrindsickness',
      'miguel',
      'you',
      'fan', // Default fallback user handle assigned when posting in ForumView without a custom handle
    ];

    for (const c of candidates) {
      if (!c) continue;
      const cleanCandidate = c.toLowerCase().replace(/^@+/, '').trim();
      if (cleanCandidate && (rawAuthor === cleanCandidate || rawAuthor.includes(cleanCandidate) || cleanCandidate.includes(rawAuthor))) {
        return true;
      }
    }
  }

  // 4. Any newly created thread (UUID format, not in mock set) where user voted up initially
  if (!MOCK_THREAD_IDS.has(String(thread.id)) && thread.userVote === 'up') {
    return true;
  }

  return false;
}

/**
 * Checks if a thread is a genuine forum post (not a static mock template)
 */
export function isRealForumThread(thread: ForumHighlightThread | any): boolean {
  if (!thread || !thread.id) return false;
  return !MOCK_THREAD_IDS.has(String(thread.id));
}

// Load forum threads from localStorage or fallback to initial mock data
export function loadCachedForumThreads(): ForumHighlightThread[] {
  if (typeof window === 'undefined') return initialForumThreads as ForumHighlightThread[];
  try {
    const saved = localStorage.getItem(FORUM_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[forumHighlightService] Failed to parse cached threads:', err);
  }
  return initialForumThreads as ForumHighlightThread[];
}

// Save threads to localStorage and dispatch update event
export function saveForumThreadsToCache(threads: ForumHighlightThread[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FORUM_CACHE_KEY, JSON.stringify(threads));
    window.dispatchEvent(new CustomEvent('nexus_forum_cache_updated', { detail: { count: threads.length } }));
  } catch (err) {
    console.warn('[forumHighlightService] Failed to save threads to cache:', err);
  }
}

/**
 * Asynchronously syncs forum threads from Supabase into local cache if connected
 */
export async function syncForumHighlightsFromSupabase(): Promise<ForumHighlightThread[]> {
  try {
    const supabase = getSupabase();
    if (!supabase) return loadCachedForumThreads();

    const [threadsRes, commentsRes] = await Promise.all([
      supabase.from('forum_threads').select('*').order('created_at', { ascending: false }).limit(30),
      supabase.from('forum_comments').select('*').order('created_at', { ascending: true }),
    ]);

    const threadsData = threadsRes.data;
    const commentsData = commentsRes.data;

    if (threadsData && threadsData.length > 0) {
      const commentsByThread: Record<string, ForumComment[]> = {};
      if (commentsData && commentsData.length > 0) {
        commentsData.forEach((c: any) => {
          const tid = c.thread_id;
          if (!tid) return;
          if (!commentsByThread[tid]) commentsByThread[tid] = [];
          commentsByThread[tid].push({
            id: c.id,
            author: c.author_name || c.author || 'Fan',
            authorAvatar: c.author_avatar,
            text: c.text || c.comment || c.content || '',
            timeAgo: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recently',
            replies: [],
          });
        });
      }

      const cached = loadCachedForumThreads();
      const cachedMap = new Map<string, ForumHighlightThread>();
      cached.forEach((t) => cachedMap.set(String(t.id), t));

      threadsData.forEach((t: any) => {
        const idStr = String(t.id);
        const existing = cachedMap.get(idStr);
        const threadComments = commentsByThread[t.id] || (Array.isArray(t.comments) ? t.comments : []) || [];

        cachedMap.set(idStr, {
          id: idStr,
          title: t.title,
          content: t.content,
          category: t.category || 'General',
          genre: t.genre || 'Metal',
          primaryGenre: t.primary_genre,
          author: t.author_name || t.author || 'Fan',
          authorAvatar: t.author_avatar || t.author_avatar_url,
          userId: t.user_id,
          user_id: t.user_id,
          image: t.image_url || t.image || t.media_url,
          youtubeId: t.youtube_id,
          votes: t.votes ?? 1,
          timeAgo: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recently',
          created_at: t.created_at,
          comments: threadComments.length > 0 ? threadComments : (existing?.comments || []),
          userVote: existing?.userVote || null,
          isUserCreated: existing?.isUserCreated || (!MOCK_THREAD_IDS.has(idStr)),
        });
      });

      const updatedList = Array.from(cachedMap.values());
      saveForumThreadsToCache(updatedList);
      return updatedList;
    }
  } catch (err) {
    console.warn('[forumHighlightService] Supabase sync error:', err);
  }
  return loadCachedForumThreads();
}

/**
 * Get curated highlights with STRICT PRIORITIZATION:
 * Tier 1: Real posts made by the active user (ALWAYS #1 Spotlight!)
 * Tier 2: Real community posts created in the forum
 * Tier 3: Curated mock templates
 */
export function getCuratedForumHighlights(
  limit = 8,
  userProfile?: any,
  currentUserName?: string,
  currentUserId?: string
): ForumHighlightThread[] {
  const threads = loadCachedForumThreads();
  if (!threads || threads.length === 0) return [];

  // Filter out any invalid items
  const validThreads = threads.filter((t) => t && t.id && t.title);

  const userRealThreads: ForumHighlightThread[] = [];
  const otherRealThreads: ForumHighlightThread[] = [];
  const mockThreads: ForumHighlightThread[] = [];

  validThreads.forEach((t) => {
    if (isUserForumThread(t, userProfile, currentUserName, currentUserId)) {
      userRealThreads.push(t);
    } else if (isRealForumThread(t)) {
      otherRealThreads.push(t);
    } else {
      mockThreads.push(t);
    }
  });

  // Sort user's real posts (newest first, then most votes)
  userRealThreads.sort((a, b) => {
    const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
    const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
    if (timeA && timeB) return timeB - timeA;
    return (b.votes || 0) - (a.votes || 0);
  });

  // Sort other real posts (newest / engagement)
  otherRealThreads.sort((a, b) => {
    const scoreA = (a.votes || 0) * 1.5 + (a.comments?.length || 0) * 4;
    const scoreB = (b.votes || 0) * 1.5 + (b.comments?.length || 0) * 4;
    return scoreB - scoreA;
  });

  // Sort mock templates by engagement
  mockThreads.sort((a, b) => {
    const scoreA = (a.votes || 0) * 1.5 + (a.comments?.length || 0) * 4;
    const scoreB = (b.votes || 0) * 1.5 + (b.comments?.length || 0) * 4;
    return scoreB - scoreA;
  });

  // Concatenate strictly: User's real post(s) first, then real community threads, then mock templates
  const curated = [...userRealThreads, ...otherRealThreads, ...mockThreads];
  return curated.slice(0, limit);
}

// Cast upvote/downvote directly from feed card
export function voteForumHighlight(
  threadId: string,
  targetVote: 'up' | 'down'
): { updatedVotes: number; newUserVote: 'up' | 'down' | null } | null {
  const threads = loadCachedForumThreads();
  const index = threads.findIndex((t) => String(t.id) === String(threadId));
  if (index === -1) return null;

  const currentThread = threads[index];
  const currentVote = currentThread.userVote;
  let newVote: 'up' | 'down' | null = targetVote;
  let voteDelta = 0;

  if (currentVote === targetVote) {
    // Undo current vote
    newVote = null;
    voteDelta = targetVote === 'up' ? -1 : 1;
  } else if (currentVote === 'up' && targetVote === 'down') {
    // Switch up to down
    newVote = 'down';
    voteDelta = -2;
  } else if (currentVote === 'down' && targetVote === 'up') {
    // Switch down to up
    newVote = 'up';
    voteDelta = 2;
  } else {
    // Brand new vote
    newVote = targetVote;
    voteDelta = targetVote === 'up' ? 1 : -1;
  }

  const updatedVotes = Math.max(0, (currentThread.votes || 0) + voteDelta);
  threads[index] = {
    ...currentThread,
    votes: updatedVotes,
    userVote: newVote,
  };

  saveForumThreadsToCache(threads);

  return { updatedVotes, newUserVote: newVote };
}

// Post a quick reply directly from the feed card
export function addQuickCommentToThread(
  threadId: string,
  commentText: string,
  authorName = 'You',
  authorAvatar = ''
): ForumComment | null {
  if (!commentText || !commentText.trim()) return null;

  const threads = loadCachedForumThreads();
  const index = threads.findIndex((t) => String(t.id) === String(threadId));
  if (index === -1) return null;

  const newComment: ForumComment = {
    id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    author: authorName.startsWith('@') ? authorName : `@${authorName.replace(/\s+/g, '_')}`,
    authorAvatar: authorAvatar || undefined,
    text: commentText.trim(),
    timeAgo: 'Just now',
    replies: [],
  };

  const currentComments = Array.isArray(threads[index].comments) ? threads[index].comments : [];
  threads[index] = {
    ...threads[index],
    comments: [newComment, ...currentComments],
  };

  saveForumThreadsToCache(threads);

  return newComment;
}
