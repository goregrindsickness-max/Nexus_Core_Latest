import { socialFeedStore, profileStore } from '../../../utils/indexedDB';
import { FeedItem } from '../../../data/socialFeedMockData';

export function resolveWorkspaceEntityId(portalRole?: string, activeBand?: any, activeBandId?: string, userProfile?: any): string {
  const normRole = (portalRole || userProfile?.active_workspace || 'industry_pro').toLowerCase();
  if (normRole === 'band' || normRole.includes('artist')) {
    const rawBandId = activeBandId || activeBand?.id || activeBand?.name || (userProfile?.bands?.[0]?.id) || 'band_primary';
    return `band_${String(rawBandId).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  if (normRole === 'label') {
    const rawLabel = userProfile?.label_id || userProfile?.label_company_name || 'label_primary';
    return `label_${String(rawLabel).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  if (normRole === 'promoter') {
    const rawPromoter = userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_name || 'promoter_primary';
    return `promoter_${String(rawPromoter).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  if (normRole === 'creative') {
    const rawCreative = userProfile?.creative_metadata?.business_name || userProfile?.creative_name || 'creative_primary';
    return `creative_${String(rawCreative).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }
  if (normRole === 'fan_only' || normRole === 'fan') {
    return 'fan';
  }
  return 'industry_pro';
}

export const getFeedCacheKey = (portalRole: string, userId?: string, workspaceEntityId?: string) => {
  const entityPart = workspaceEntityId ? `_${workspaceEntityId}` : '';
  return `feed_posts_${portalRole}${entityPart}_${userId || 'guest'}`;
};

export const getProfileCacheKey = (portalRole: string, userId?: string) =>
  `nexus_${portalRole}_profile_v1_${userId || 'guest'}`;

export const getActiveProfileCacheKey = (portalRole: string, userId?: string) =>
  `active_${portalRole}_${userId || 'guest'}`;

export const getDiscoverProfilesCacheKey = (userId?: string) =>
  `discoverProfiles_${userId || 'guest'}`;

/**
 * Helper to identify broken, defunct, or deleted avatar upload posts / orphaned posts
 */
export function isBrokenOrDeletedPost(post: any): boolean {
  if (!post) return true;
  const authorName = String(
    post.author?.name || 
    post.authorName || 
    post.author?.full_name || 
    post.profiles?.full_name || 
    post.profiles?.console_handle || 
    ''
  ).toLowerCase().trim();
  
  const content = String(post.content || post.text || post.message || '').toLowerCase().trim();
  
  // Specific broken profile avatar uploads / orphaned records requested for removal
  if (authorName.includes('kasper') && (content.includes('im here now') || content.includes('here now') || content.length < 30)) {
    return true;
  }
  if (
    authorName.includes('christopher wirstrom') || 
    (authorName.includes('wirstrom') && content.includes('updated profile picture'))
  ) {
    return true;
  }
  if (content === 'im here now' && (authorName === 'kasper' || authorName === '' || authorName === 'anonymous' || authorName.includes('fan'))) {
    return true;
  }
  if (content.includes('updated profile picture! check out the new look.') && (authorName.includes('christopher') || authorName.includes('wirstrom') || authorName === 'anonymous' || authorName === '')) {
    return true;
  }
  
  return false;
}

/**
 * Load cached feed items from IndexedDB
 */
export async function loadFeedCache(portalRole: string, userId?: string, workspaceEntityId?: string): Promise<FeedItem[] | null> {
  try {
    const key = getFeedCacheKey(portalRole, userId, workspaceEntityId);
    const stored = await socialFeedStore.getItem<FeedItem[]>(key);
    if (stored && Array.isArray(stored)) {
      const deletedPosts = getDeletedPostIdsLocal();
      const cleaned = stored.filter(p => p && !deletedPosts.includes(p.id) && !isBrokenOrDeletedPost(p));
      if (cleaned.length !== stored.length) {
        // Immediately persist cleaned cache back to IndexedDB
        await socialFeedStore.setItem(key, cleaned);
      }
      return cleaned;
    }
    return stored || null;
  } catch (e) {
    console.warn('Failed to load feed from IndexedDB:', e);
    return null;
  }
}

/**
 * Save feed items to IndexedDB
 */
export async function saveFeedCache(portalRole: string, feed: FeedItem[], userId?: string, workspaceEntityId?: string): Promise<void> {
  if (!feed || feed.length === 0) return;
  try {
    const key = getFeedCacheKey(portalRole, userId, workspaceEntityId);
    await socialFeedStore.setItem(key, feed);
  } catch (e) {
    console.warn('Failed to save feed to IndexedDB:', e);
  }
}

/**
 * Get locally deleted post IDs from localStorage
 */
export function getDeletedPostIdsLocal(): string[] {
  try {
    const saved = localStorage.getItem('nexus_deleted_posts');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('Error reading nexus_deleted_posts from localStorage:', e);
  }
  return [];
}

/**
 * Mark a post as deleted in localStorage
 */
export function addDeletedPostIdLocal(postId: string): void {
  try {
    const existing = getDeletedPostIdsLocal();
    if (!existing.includes(postId)) {
      const updated = [...existing, postId];
      localStorage.setItem('nexus_deleted_posts', JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Error saving nexus_deleted_posts to localStorage:', e);
  }
}

/**
 * Load discover profiles from IndexedDB
 */
export async function loadDiscoverProfilesCache(userId?: string): Promise<any[] | null> {
  try {
    const key = getDiscoverProfilesCacheKey(userId);
    const data = await profileStore.getItem<any[]>(key);
    if (Array.isArray(data)) {
      return data.filter(p => {
        if (!p) return false;
        const name = String(p.name || p.full_name || '').toLowerCase().trim();
        const email = String(p.email || '').toLowerCase().trim();
        if (email.includes('test_probe') || email.includes('@example.com')) return false;
        if ((name === 'new user' || name === 'user' || name === 'nexus user') && !p.console_handle && !p.avatar && !p.avatar_url && !p.bio) {
          return false;
        }
        return true;
      });
    }
    return data || null;
  } catch (e) {
    console.warn('Failed to load discover profiles cache:', e);
    return null;
  }
}

/**
 * Automatically sweeps and purges any broken/deleted post references across all IndexedDB keys
 */
export async function cleanBrokenPostsFromAllStores(): Promise<void> {
  try {
    const keys = await socialFeedStore.keys();
    for (const key of keys) {
      if (key.startsWith('feed_posts_')) {
        const stored = await socialFeedStore.getItem<FeedItem[]>(key);
        if (stored && Array.isArray(stored)) {
          const deletedPosts = getDeletedPostIdsLocal();
          const cleaned = stored.filter(p => p && !deletedPosts.includes(p.id) && !isBrokenOrDeletedPost(p));
          if (cleaned.length !== stored.length) {
            await socialFeedStore.setItem(key, cleaned);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Error during sweep of broken posts in IndexedDB:', e);
  }
}

/**
 * Save discover profiles to IndexedDB
 */
export async function saveDiscoverProfilesCache(profiles: any[], userId?: string): Promise<void> {
  try {
    const key = getDiscoverProfilesCacheKey(userId);
    await profileStore.setItem(key, profiles);
  } catch (e) {
    console.warn('Failed to save discover profiles cache:', e);
  }
}

/**
 * Load active profile data from IndexedDB
 */
export async function loadProfileIndexedDBCache(portalRole: string, userId?: string): Promise<any | null> {
  try {
    const key = getActiveProfileCacheKey(portalRole, userId);
    const data = await profileStore.getItem(key);
    return data || null;
  } catch (e) {
    console.warn('Failed to load active profile from IndexedDB:', e);
    return null;
  }
}

/**
 * Load profile data from localStorage
 */
export function loadProfileLocalStorageCache(portalRole: string, userId?: string): any | null {
  try {
    const key = getProfileCacheKey(portalRole, userId);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn('Error loading offline profile cache from localStorage:', e);
    return null;
  }
}
