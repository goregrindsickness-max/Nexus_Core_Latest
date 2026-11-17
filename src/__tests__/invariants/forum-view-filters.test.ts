import { describe, it, expect, beforeEach } from 'vitest';
import {
  filterAndSortForumThreads,
  getCategoryAccentClasses,
  getThreadActivityBadge,
  isSeededForumThread,
  isThreadHighlighted,
  SEEDED_FORUM_THRESHOLD,
} from '@/src/components/social/ForumView';
import {
  FORUM_CACHE_KEY,
  getCuratedForumHighlights,
  loadCachedForumThreads,
} from '@/src/services/forumHighlightService';

const SAMPLE_THREADS = [
  {
    id: 'real-1',
    title: 'Close to a World Below Album Art',
    content: 'Andreas Marschall painted an apocalyptic classic.',
    category: 'Album Art',
    genre: 'Death Metal',
    author: '@StarGazer',
    votes: 148,
    timeAgo: '2h ago',
    comments: [
      { id: 'c1', text: 'Classic art', timeAgo: '1h ago' },
      { id: 'c2', text: 'Agreed', timeAgo: '45m ago' },
      { id: 'c3', text: '10/10', timeAgo: '10m ago' },
    ],
  },
  {
    id: 'real-2',
    title: 'New Underground Split Drop',
    content: 'Just dropped this morning on cassette.',
    category: 'Album Reviews',
    genre: 'Black Metal',
    author: '@AstraVoid',
    votes: 24,
    timeAgo: '15m ago',
    createdAt: new Date(Date.now() - 15 * 60_000).toISOString(),
    comments: [{ id: 'c4', text: 'Spinning it now', timeAgo: 'Just now' }],
  },
  {
    id: 'real-3',
    title: 'Tour Rig Breakdown',
    content: 'Boss FZ-2 into vintage tube heads.',
    category: 'Gear & Rig',
    genre: 'Doom/Sludge',
    author: '@SludgeWorship',
    votes: 80,
    timeAgo: '1d ago',
    comments: [],
  },
];

describe('Invariant 9: ForumView Filtering, Sorting & Activity Indicators', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sorts Hot threads by engagement score and New threads by recency', () => {
    const hot = filterAndSortForumThreads(SAMPLE_THREADS, {
      category: 'All',
      sort: 'hot',
      primaryGenre: 'All',
      microGenre: 'All',
      subscribedSpaces: [],
      searchQuery: '',
    });
    expect(hot.map((t) => t.id)).toEqual(['real-1', 'real-3', 'real-2']);

    const newest = filterAndSortForumThreads(SAMPLE_THREADS, {
      category: 'All',
      sort: 'new',
      primaryGenre: 'All',
      microGenre: 'All',
      subscribedSpaces: [],
      searchQuery: '',
    });
    expect(newest.map((t) => t.id)).toEqual(['real-2', 'real-1', 'real-3']);
  });

  it('filters accurately by My Subscriptions, genre circle, category, and search query', () => {
    const subs = filterAndSortForumThreads(SAMPLE_THREADS, {
      category: 'My Subscriptions',
      sort: 'hot',
      primaryGenre: 'All',
      microGenre: 'All',
      subscribedSpaces: ['Black Metal', 'Gear & Rig'],
      searchQuery: '',
    });
    expect(subs.map((t) => t.id)).toEqual(['real-3', 'real-2']);

    const byGenreAndSearch = filterAndSortForumThreads(SAMPLE_THREADS, {
      category: 'All',
      sort: 'hot',
      primaryGenre: 'Extreme Metal',
      microGenre: 'Death Metal',
      subscribedSpaces: [],
      searchQuery: 'marschall',
    });
    expect(byGenreAndSearch.map((t) => t.id)).toEqual(['real-1']);
  });

  it('computes trending, new_replies badges and distinct category accent classes', () => {
    expect(getThreadActivityBadge(SAMPLE_THREADS[0])).toBe('trending');
    expect(getThreadActivityBadge(SAMPLE_THREADS[1])).toBe('new_replies');
    expect(getThreadActivityBadge(SAMPLE_THREADS[2])).toBeNull();

    expect(getCategoryAccentClasses('Album Art').text).not.toBe(
      getCategoryAccentClasses('Album Reviews').text
    );
    expect(getCategoryAccentClasses('Show & Fest').text).not.toBe(
      getCategoryAccentClasses('Gear & Rig').text
    );
  });

  it('elevates and highlights real posts above pre-seeded threads until 10 real posts exist, then retires pre-seeded posts', () => {
    const seeded = {
      id: 'bdm-h1',
      title: "Suffocation — Pierced From Within snare ping vs. Effigy's raw cavern mix",
      content: 'Seeded BDM post',
      category: 'Gear & Rig',
      genre: 'Brutal Death Metal',
      author: '@SlamVault',
      votes: 200,
      timeAgo: '1h ago',
      comments: [],
    };
    const oldestRealPost = {
      id: 'uuid-user-post-1',
      title: 'Welcome to the real scene board',
      content: 'My real post made days ago.',
      category: 'Album Reviews',
      genre: 'Death Metal',
      author: '@goregrindsickness',
      votes: 1,
      createdAt: '2026-11-01T12:00:00.000Z',
      timeAgo: '11/1/2026',
      comments: [],
    };

    const listWithOneReal = [seeded, oldestRealPost];
    expect(isSeededForumThread(seeded)).toBe(true);
    expect(isSeededForumThread(oldestRealPost)).toBe(false);
    expect(isThreadHighlighted(oldestRealPost, listWithOneReal)).toBe(true);
    expect(isThreadHighlighted(seeded, listWithOneReal)).toBe(false);

    const sortedHot = filterAndSortForumThreads(listWithOneReal, {
      category: 'All',
      sort: 'hot',
      primaryGenre: 'All',
      microGenre: 'All',
      subscribedSpaces: [],
      searchQuery: '',
    });
    expect(sortedHot.map((t) => t.id)).toEqual(['uuid-user-post-1', 'bdm-h1']);

    const sortedNew = filterAndSortForumThreads(listWithOneReal, {
      category: 'All',
      sort: 'new',
      primaryGenre: 'All',
      microGenre: 'All',
      subscribedSpaces: [],
      searchQuery: '',
    });
    expect(sortedNew.map((t) => t.id)).toEqual(['uuid-user-post-1', 'bdm-h1']);

    // Once at least 10 real posts exist, pre-seeded posts disappear automatically
    const tenRealPosts = Array.from({ length: SEEDED_FORUM_THRESHOLD }, (_, i) => ({
      ...oldestRealPost,
      id: `real-post-${i + 1}`,
      votes: i + 1,
    }));
    const listWithTenReal = [seeded, ...tenRealPosts];
    const filteredAfterThreshold = filterAndSortForumThreads(listWithTenReal, {
      category: 'All',
      sort: 'hot',
      primaryGenre: 'All',
      microGenre: 'All',
      subscribedSpaces: [],
      searchQuery: '',
    });
    expect(filteredAfterThreshold).toHaveLength(SEEDED_FORUM_THRESHOLD);
    expect(filteredAfterThreshold.some((t) => t.id === 'bdm-h1')).toBe(false);
    expect(isThreadHighlighted(tenRealPosts[0], listWithTenReal)).toBe(false);
  });

  it('caps curated highlight section to user post plus max 2 Brutal Death Metal highlights', () => {
    const userThread = {
      id: 'uuid-user-post-only',
      title: 'My Brutal Death Metal Discussion',
      content: 'Looking for heavy underground bands.',
      category: 'Recommendations',
      genre: 'Brutal Death Metal',
      author: '@goregrindsickness',
      isUserCreated: true,
      votes: 1,
      timeAgo: '3d ago',
      comments: [],
    };
    const mockPop = {
      id: 't11',
      title: 'Shoegaze Jazzmaster',
      content: 'Tremolo talk',
      category: 'Gear & Rig',
      genre: 'Post-Rock / Shoegaze',
      author: '@ReverbDrenched',
      votes: 999,
      timeAgo: '1h ago',
      comments: [],
    };

    localStorage.setItem(FORUM_CACHE_KEY, JSON.stringify([mockPop, userThread]));

    // Even if caller asks for 8, highlights strictly cap to max 3 (user post + 2 BDM others, no shoegaze filler)
    const curated = getCuratedForumHighlights(8, { name: 'Miguel', handle: 'goregrindsickness' }, 'goregrindsickness');
    expect(curated).toHaveLength(3);
    expect(curated[0].id).toBe('uuid-user-post-only');
    expect(curated[1].genre).toBe('Brutal Death Metal');
    expect(curated[2].genre).toBe('Brutal Death Metal');
    expect(curated.some((t) => t.id === 't11')).toBe(false);
  });

  it('purges replaced non-extreme mocks while keeping extreme metal seeded mocks (with photos/YouTube) in ForumsView below highlighted real posts', () => {
    const retiredKnockedLoose = {
      id: 't9',
      title: 'Knocked Loose & GEL tour is absolutely unhinged live',
      content: 'Old non-extreme mock.',
      category: 'Show & Fest',
      genre: 'Hardcore Punk',
      author: '@TwoStepChaos',
      votes: 79,
      timeAgo: '2d ago',
      comments: [],
    };
    const activeGrindPhotoSeed = {
      id: 't9',
      title: 'Last night in the basement pit — zero barricade grindcore & death metal chaos',
      content: 'Packed shoulder to shoulder under red stage lights.',
      category: 'Show & Fest',
      genre: 'Grindcore',
      author: '@GrindVault',
      image: '/assets/forum/underground_pit_show.jpg',
      votes: 84,
      timeAgo: '2d ago',
      comments: [],
    };
    const activeYoutubeSeed = {
      id: 't10',
      title: "Napalm Death's Scum vs. Terrorizer's World Downfall: purest grindcore blast blueprint",
      content: 'Spinning Scum front to back again.',
      category: 'Album Reviews',
      genre: 'Grindcore',
      author: '@BlastFurnace',
      youtubeId: 'T1guyOBl880',
      user_id: 'legacy-seed-uid',
      votes: 78,
      timeAgo: '2d ago',
      comments: [],
    };
    const userRealPost = {
      id: 'uuid-bdmceo-1',
      title: 'Jig-Ai "Jigoku" (2026)',
      content: 'Brutal Czech goregrind/BDM.',
      category: 'Recommendations',
      genre: 'Brutal Death Metal',
      author: '@bdmCEO',
      votes: 1,
      timeAgo: '8/20/2026',
      comments: [],
    };

    localStorage.setItem(
      FORUM_CACHE_KEY,
      JSON.stringify([retiredKnockedLoose, activeGrindPhotoSeed, activeYoutubeSeed, userRealPost])
    );

    // 1. Timeline Highlight Section strictly excludes all t1-t14 seeds & shows only user post + 2 BDM highlights
    const highlights = getCuratedForumHighlights(3, { name: 'Miguel', handle: 'bdmCEO' }, 'bdmCEO');
    expect(highlights).toHaveLength(3);
    expect(highlights[0].id).toBe('uuid-bdmceo-1');
    expect(highlights[1].genre).toBe('Brutal Death Metal');
    expect(highlights[2].genre).toBe('Brutal Death Metal');
    expect(highlights.some((t) => t.id === 't9' || t.id === 't10')).toBe(false);

    // 2. Cache evicts retired non-extreme posts while retaining extreme metal seeds + real posts
    const cached = loadCachedForumThreads();
    expect(cached.map((t) => t.title)).toEqual([
      activeGrindPhotoSeed.title,
      activeYoutubeSeed.title,
      userRealPost.title,
    ]);

    // 3. ForumsView retains active extreme metal seeded posts (sorted BELOW highlighted real post) and purges retired ones
    const filtered = filterAndSortForumThreads(
      [retiredKnockedLoose, activeGrindPhotoSeed, activeYoutubeSeed, userRealPost],
      {
        category: 'All',
        sort: 'hot',
        primaryGenre: 'All',
        microGenre: 'All',
        subscribedSpaces: [],
        searchQuery: '',
      }
    );
    expect(filtered.map((t) => t.title)).toEqual([
      userRealPost.title,
      activeGrindPhotoSeed.title,
      activeYoutubeSeed.title,
    ]);
    expect(isThreadHighlighted(userRealPost, filtered)).toBe(true);
    expect(isThreadHighlighted(activeGrindPhotoSeed, filtered)).toBe(false);
    expect(isThreadHighlighted(activeYoutubeSeed, filtered)).toBe(false);
  });
});
