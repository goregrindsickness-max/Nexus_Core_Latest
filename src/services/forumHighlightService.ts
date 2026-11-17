import { initialForumThreads } from '../data/forumMockData';
import { getSupabase } from './clientService';

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

// Pre-seeded mock templates (retired non-extreme posts are purged; active extreme metal seeds stay in ForumsView until 10 real posts exist, never in Timeline Highlight Section)
export const LEGACY_MOCK_THREAD_IDS = new Set([
  't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8',
  't9', 't10', 't11', 't12', 't13', 't14',
]);

export const RETIRED_NON_EXTREME_TITLES = new Set([
  'bell witch live is a colossal, crushing, slow-motion experience',
  'knocked loose & gel tour is absolutely unhinged live',
  'd-beat drum patterns: favorite crust punk bands keeping it raw?',
  'the ultimate shoegaze guitar: jazzmaster vs. jaguar for tremolo arm glide',
  'this will destroy you - self titled: 15 year anniversary appreciation',
  'mortiis dungeon synth - classic medieval ambient masterpieces',
  'dark ambient starter pack: where to begin after lustmord?',
]);

export const LEGACY_MOCK_TITLES = new Set([
  "close to a world below's album art is a masterpiece. who is the artist?",
  'immolation - close to a world below: decades later',
  'maryland deathfest 2026 predictions and wishlist',
  'what gear did cryptopsy use on none so vile for that extreme speed?',
  "cosmic black metal: paysage d'hiver vs. alcest vs. darkspace",
  'the vintage 4-track raw tape sound of early norwegian black metal',
  'is electric wizard\'s "dopethrone" the heaviest record ever recorded?',
  'suffocation tearing through effigy of the forgotten live — unmatched tight picking',
  'last night in the basement pit — zero barricade grindcore & death metal chaos',
  "napalm death's scum vs. terrorizer's world downfall: purest grindcore blast blueprint",
  'basement rig check: peavey 5150 into a beat-up 4x12 + boss hm-2 chainsaw grind',
  'first-press black metal vinyl & xeroxed cassette demos on the table tonight',
  "carcass 'symphonies of sickness' vs. repulsion 'horrified': filthiest goregrind essential?",
  'raw 2nd-wave black metal tremolos: darkthrone, gorgoroth & bathory essentials',
  ...RETIRED_NON_EXTREME_TITLES,
]);

// Known IDs for all hardcoded pre-seeded templates & fallback BDM highlights
export const MOCK_THREAD_IDS = new Set([
  ...LEGACY_MOCK_THREAD_IDS,
  'bdm-h1',
  'bdm-h2',
]);

export const MAX_CURATED_HIGHLIGHTS = 3;
export const MAX_OTHER_HIGHLIGHTS = 2;

export const BRUTAL_DEATH_METAL_HIGHLIGHTS: ForumHighlightThread[] = [
  {
    id: 'bdm-h1',
    title: "Suffocation — Pierced From Within snare ping vs. Effigy's raw cavern mix",
    content:
      "Nothing touches that mid-90s Long Island / Morrisound brutality. Between Doug Cerrito's surgical dissonant sweeps and Mike Smith's blistering blasts, which mix crushes heavier in a live basement pit?",
    category: 'Gear & Rig',
    genre: 'Brutal Death Metal',
    primaryGenre: 'Extreme Metal',
    author: '@SlamVault',
    timeAgo: '3h ago',
    votes: 134,
    userVote: null,
    comments: [
      {
        id: 'bdm-c1',
        author: '@GraveRiff',
        text: 'That brass snare crack on Pierced cuts straight through drop-G mud every single time.',
        timeAgo: '1h ago',
        replies: [],
      },
    ],
  },
  {
    id: 'bdm-h2',
    title: 'Defeated Sanity & Devourment: guttural slam riff architecture breakdown',
    content:
      "From Molesting the Decapitated's sub-bass slam drops to Lille Gruber's unhinged time signatures—drop your heaviest brutal death metal pressings, snare-ping tones, or underground pit clips.",
    category: 'Album Reviews',
    genre: 'Brutal Death Metal',
    primaryGenre: 'Extreme Metal',
    author: '@GutturalPit',
    timeAgo: '5h ago',
    votes: 118,
    userVote: null,
    comments: [
      {
        id: 'bdm-c2',
        author: '@SubterraneanBlast',
        text: 'The tempo drop on Babykiller still caves in concrete. Pure primal slam weight.',
        timeAgo: '2h ago',
        replies: [],
      },
    ],
  },
];

export function isRetiredNonExtremeMock(thread: any): boolean {
  if (!thread || thread.isUserCreated === true) return false;
  const title = String(thread.title || '').trim().toLowerCase();
  if (RETIRED_NON_EXTREME_TITLES.has(title)) return true;
  // Also catch stale cached copies of old t8-t14 IDs when their title isn't one of the new extreme metal titles
  const id = String(thread.id || '');
  if (['t8', 't9', 't10', 't11', 't12', 't13', 't14'].includes(id)) {
    const newSeed = initialForumThreads.find((s) => String(s.id) === id);
    if (newSeed && String(newSeed.title || '').trim().toLowerCase() !== title) {
      return true;
    }
  }
  return false;
}

export function isLegacyNonBdmMock(thread: any): boolean {
  if (!thread) return false;
  if (thread.isUserCreated === true) return false;
  const id = String(thread.id || '');
  if (LEGACY_MOCK_THREAD_IDS.has(id)) return true;
  const title = String(thread.title || '').trim().toLowerCase();
  if (LEGACY_MOCK_TITLES.has(title)) return true;
  return false;
}

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
      'bdmceo',
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
  if (!MOCK_THREAD_IDS.has(String(thread.id)) && !isLegacyNonBdmMock(thread) && thread.userVote === 'up') {
    return true;
  }

  return false;
}

/**
 * Checks if a thread is a genuine forum post (never true for t1-t14 or bdm-h1/h2 mock templates)
 */
export function isRealForumThread(thread: ForumHighlightThread | any): boolean {
  if (!thread || !thread.id) return false;
  if (isLegacyNonBdmMock(thread)) return false;
  return !MOCK_THREAD_IDS.has(String(thread.id));
}

// Load forum threads from localStorage or fallback to initial extreme metal mock data
export function loadCachedForumThreads(): ForumHighlightThread[] {
  if (typeof window === 'undefined') return initialForumThreads as ForumHighlightThread[];
  try {
    const saved = localStorage.getItem(FORUM_CACHE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter((t) => t && !isRetiredNonExtremeMock(t));
        if (cleaned.length > 0) return cleaned;
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
 * Get curated highlights strictly capped to the user's post(s) + max 2 Brutal Death Metal others (<= 3 total):
 * Tier 1: Real posts made by the active user (ALWAYS #1 Spotlight!)
 * Tier 2: Up to 2 other real community threads (prioritizing Death/Brutal Death Metal)
 * Tier 3: Up to 2 Brutal Death Metal highlights when total real threads < 10
 */
export function getCuratedForumHighlights(
  limit = MAX_CURATED_HIGHLIGHTS,
  userProfile?: any,
  currentUserName?: string,
  currentUserId?: string
): ForumHighlightThread[] {
  const effectiveLimit = Math.max(1, Math.min(limit, MAX_CURATED_HIGHLIGHTS));
  const threads = loadCachedForumThreads();
  if (!threads || threads.length === 0) {
    return BRUTAL_DEATH_METAL_HIGHLIGHTS.slice(0, Math.min(MAX_OTHER_HIGHLIGHTS, effectiveLimit));
  }

  // Filter out any invalid items
  const validThreads = threads.filter((t) => t && t.id && t.title);

  const userRealThreads: ForumHighlightThread[] = [];
  const otherRealThreads: ForumHighlightThread[] = [];

  validThreads.forEach((t) => {
    const isReal = isRealForumThread(t);
    if (!isReal) return;
    if (isUserForumThread(t, userProfile, currentUserName, currentUserId)) {
      userRealThreads.push(t);
    } else {
      otherRealThreads.push(t);
    }
  });

  // Sort user's real posts (newest first, then most votes)
  userRealThreads.sort((a, b) => {
    const timeA = (a as any).created_at ? new Date((a as any).created_at).getTime() : 0;
    const timeB = (b as any).created_at ? new Date((b as any).created_at).getTime() : 0;
    if (timeA && timeB) return timeB - timeA;
    return (b.votes || 0) - (a.votes || 0);
  });

  // Sort other real posts (prioritizing Death/Brutal Death Metal, then engagement)
  const isBdmOrDeath = (t: ForumHighlightThread) => {
    const g = `${t.genre || ''} ${t.title || ''}`.toLowerCase();
    return g.includes('brutal death') || g.includes('death metal') || g.includes('slam');
  };
  otherRealThreads.sort((a, b) => {
    const aBdm = isBdmOrDeath(a) ? 1 : 0;
    const bBdm = isBdmOrDeath(b) ? 1 : 0;
    if (bBdm !== aBdm) return bBdm - aBdm;
    const scoreA = (a.votes || 0) * 1.5 + (a.comments?.length || 0) * 4;
    const scoreB = (b.votes || 0) * 1.5 + (b.comments?.length || 0) * 4;
    return scoreB - scoreA;
  });

  const totalRealCount = userRealThreads.length + otherRealThreads.length;
  const userSlots = userRealThreads.slice(0, effectiveLimit);
  const maxOtherSlots = Math.min(MAX_OTHER_HIGHLIGHTS, Math.max(0, effectiveLimit - userSlots.length));

  const otherSlots: ForumHighlightThread[] = otherRealThreads.slice(0, maxOtherSlots);

  // Only pad with Brutal Death Metal highlights while total real posts < 10
  if (totalRealCount < 10 && otherSlots.length < maxOtherSlots) {
    const usedIds = new Set([...userSlots, ...otherSlots].map((t) => String(t.id)));
    for (const bdmThread of BRUTAL_DEATH_METAL_HIGHLIGHTS) {
      if (otherSlots.length >= maxOtherSlots) break;
      if (!usedIds.has(String(bdmThread.id))) {
        otherSlots.push(bdmThread);
        usedIds.add(String(bdmThread.id));
      }
    }
  }

  return [...userSlots, ...otherSlots].slice(0, effectiveLimit);
}

// Cast upvote/downvote directly from feed card
export function voteForumHighlight(
  threadId: string,
  targetVote: 'up' | 'down'
): { updatedVotes: number; newUserVote: 'up' | 'down' | null } | null {
  const threads = loadCachedForumThreads();
  let index = threads.findIndex((t) => String(t.id) === String(threadId));
  if (index === -1) {
    const fallbackBdm = BRUTAL_DEATH_METAL_HIGHLIGHTS.find((b) => String(b.id) === String(threadId));
    if (!fallbackBdm) return null;
    threads.push({ ...fallbackBdm });
    index = threads.length - 1;
  }

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
  let index = threads.findIndex((t) => String(t.id) === String(threadId));
  if (index === -1) {
    const fallbackBdm = BRUTAL_DEATH_METAL_HIGHLIGHTS.find((b) => String(b.id) === String(threadId));
    if (!fallbackBdm) return null;
    threads.push({ ...fallbackBdm });
    index = threads.length - 1;
  }

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
