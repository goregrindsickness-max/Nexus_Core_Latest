import { socialFeedStore, creativeNodesStore, profileStore } from './indexedDB';
import { getDeletedPostIdsLocal, addDeletedPostIdLocal } from '../components/social/utils/feedCacheUtils';

/**
 * Normalizes an image URL for deduplication comparisons (removes query strings, trims, lowercases, decodes, standardizes protocol/formatting).
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  try {
    let dec = decodeURIComponent(url).trim().toLowerCase();
    dec = dec.split('?')[0];
    dec = dec.replace(/^https?:\/\//, '');
    dec = dec.replace(/\/+/g, '/');
    if (dec.endsWith('/')) dec = dec.slice(0, -1);
    return dec;
  } catch (_) {
    return url.split('?')[0].trim().toLowerCase();
  }
}

/**
 * Thoroughly removes a deleted photo or post from all IndexedDB stores and localStorage caches.
 */
export async function cleanDeletedPhotoFromStores(targetUrl: string, parentPostId?: string): Promise<void> {
  const normTarget = normalizeImageUrl(targetUrl);
  const deletedIds = new Set<string>();

  if (parentPostId) {
    addDeletedPostIdLocal(parentPostId);
    deletedIds.add(parentPostId);
  }

  // 1. Purge from IndexedDB socialFeedStore
  try {
    const feedKeys = await socialFeedStore.keys();
    for (const key of feedKeys) {
      const feed = await socialFeedStore.getItem<any[]>(key);
      if (Array.isArray(feed)) {
        let changed = false;
        const updatedFeed: any[] = [];

        for (const post of feed) {
          if (!post) continue;
          const pid = String(post.id || post.data?.id || '');
          if (parentPostId && (pid === parentPostId || deletedIds.has(pid))) {
            changed = true;
            continue;
          }

          const postImg = post.image || post.media_url || post.imageUrl || post.data?.image || post.data?.media_url;
          const postImages: string[] = Array.isArray(post.images) ? post.images : (Array.isArray(post.data?.images) ? post.data.images : []);

          const matchSingle = postImg && normalizeImageUrl(postImg) === normTarget;
          const matchArray = postImages.some((img: string) => normalizeImageUrl(img) === normTarget);

          if (matchSingle || matchArray) {
            changed = true;
            const remainingImages = postImages.filter((img: string) => normalizeImageUrl(img) !== normTarget);
            if (remainingImages.length === 0 && (!postImg || normalizeImageUrl(postImg) === normTarget)) {
              // Post had only this image -> remove whole post
              if (pid) deletedIds.add(pid);
              continue;
            } else {
              // Post had multiple images -> update post with remaining
              const nextMain = remainingImages[0] || '';
              updatedFeed.push({
                ...post,
                image: nextMain,
                media_url: nextMain,
                images: remainingImages,
                data: post.data ? {
                  ...post.data,
                  image: nextMain,
                  media_url: nextMain,
                  images: remainingImages,
                } : undefined,
              });
              continue;
            }
          }

          updatedFeed.push(post);
        }

        if (changed) {
          await socialFeedStore.setItem(key, updatedFeed);
        }
      }
    }
  } catch (e) {
    console.warn('[photoPitSyncUtils] Error cleaning socialFeedStore:', e);
  }

  // 2. Purge from IndexedDB creativeNodesStore
  try {
    const nodeKeys = await creativeNodesStore.keys();
    for (const nk of nodeKeys) {
      const node = await creativeNodesStore.getItem<any>(nk);
      if (node) {
        const nodeImg = node.imageUrl || node.url || node.image;
        if (
          (nodeImg && normalizeImageUrl(nodeImg) === normTarget) ||
          (parentPostId && (node.id === parentPostId || node.post_id === parentPostId))
        ) {
          await creativeNodesStore.removeItem(nk);
        }
      }
    }
  } catch (e) {
    console.warn('[photoPitSyncUtils] Error cleaning creativeNodesStore:', e);
  }

  // 3. Purge from localStorage caches
  try {
    const cacheKeys = [
      'nexus_feed',
      'nexus_feed_posts',
      'nexus_social_feed_cache',
      'nexus_social_feed_v2',
      'nexus_dbUserPosts',
    ];

    cacheKeys.forEach((ck) => {
      const raw = localStorage.getItem(ck);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((p: any) => {
              if (!p) return false;
              const pid = String(p.id || p.data?.id || '');
              if (parentPostId && (pid === parentPostId || deletedIds.has(pid))) return false;
              const pImg = p.image || p.media_url || p.imageUrl || p.data?.image || p.data?.media_url;
              if (pImg && normalizeImageUrl(pImg) === normTarget) return false;
              return true;
            });
            localStorage.setItem(ck, JSON.stringify(filtered));
          }
        } catch (_) {}
      }
    });

    // Also clean creative gallery keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('nexus_core_creative_gallery_')) {
        const rawGal = localStorage.getItem(key);
        if (rawGal) {
          try {
            const galParsed = JSON.parse(rawGal);
            if (Array.isArray(galParsed)) {
              const galFiltered = galParsed.filter((item: any) => {
                const itemImg = item?.imageUrl || item?.url || item?.image;
                return !itemImg || normalizeImageUrl(itemImg) !== normTarget;
              });
              localStorage.setItem(key, JSON.stringify(galFiltered));
            }
          } catch (_) {}
        }
      }
    }

    // Clean active userProfile fields in localStorage
    const cachedProfRaw = localStorage.getItem('nexus_core_user_profile');
    if (cachedProfRaw) {
      try {
        const prof = JSON.parse(cachedProfRaw);
        if (prof && typeof prof === 'object') {
          let profChanged = false;

          const avatarField = prof.avatar_url || prof.avatar;
          if (avatarField && normalizeImageUrl(avatarField) === normTarget) {
            profChanged = true;
            if (prof.avatar_url) prof.avatar_url = '';
            if (prof.avatar) prof.avatar = '';
          }

          const coverField = prof.banner_url || prof.cover_url || prof.creative_banner || prof.label_banner || prof.banner;
          if (coverField && normalizeImageUrl(coverField) === normTarget) {
            profChanged = true;
            if (prof.banner_url) prof.banner_url = '';
            if (prof.cover_url) prof.cover_url = '';
            if (prof.creative_banner) prof.creative_banner = '';
            if (prof.label_banner) prof.label_banner = '';
            if (prof.banner) prof.banner = '';
          }

          if (profChanged) {
            localStorage.setItem('nexus_core_user_profile', JSON.stringify(prof));
          }
        }
      } catch (_) {}
    }
  } catch (e) {
    console.warn('[photoPitSyncUtils] Error cleaning localStorage caches:', e);
  }

  // 4. Clean userProfile avatar/banner fields in profileStore if they match the deleted URL
  try {
    const profKeys = await profileStore.keys();
    for (const pk of profKeys) {
      const prof = await profileStore.getItem<any>(pk);
      if (prof && typeof prof === 'object') {
        let profChanged = false;

        const avatarField = prof.avatar_url || prof.avatar;
        if (avatarField && normalizeImageUrl(avatarField) === normTarget) {
          profChanged = true;
          if (prof.avatar_url) prof.avatar_url = '';
          if (prof.avatar) prof.avatar = '';
        }

        const coverField = prof.banner_url || prof.cover_url || prof.creative_banner || prof.label_banner || prof.banner;
        if (coverField && normalizeImageUrl(coverField) === normTarget) {
          profChanged = true;
          if (prof.banner_url) prof.banner_url = '';
          if (prof.cover_url) prof.cover_url = '';
          if (prof.creative_banner) prof.creative_banner = '';
          if (prof.label_banner) prof.label_banner = '';
          if (prof.banner) prof.banner = '';
        }

        if (profChanged) {
          await profileStore.setItem(pk, prof);
        }
      }
    }
  } catch (e) {
    console.warn('[photoPitSyncUtils] Error cleaning profileStore entries:', e);
  }
}

/**
 * Purges obsolete / stale IndexedDB cache records for a user, keeping only the authoritative fresh posts.
 */
export async function purgeStaleIndexedDBPhotos(
  userId: string,
  authoritativePostIds?: string[],
  authoritativeImageUrls?: string[]
): Promise<{ purgedCount: number }> {
  let purgedCount = 0;
  const deletedSet = new Set<string>(getDeletedPostIdsLocal());
  const validIds = authoritativePostIds ? new Set<string>(authoritativePostIds) : null;
  const validUrls = authoritativeImageUrls ? new Set<string>(authoritativeImageUrls.map(normalizeImageUrl)) : null;

  try {
    const feedKeys = await socialFeedStore.keys();
    for (const fk of feedKeys) {
      const feed = await socialFeedStore.getItem<any[]>(fk);
      if (Array.isArray(feed)) {
        let modified = false;
        const freshList = feed.filter((p: any) => {
          if (!p) return false;
          const pid = String(p.id || p.data?.id || '');

          // Check if marked deleted
          if (deletedSet.has(pid)) {
            modified = true;
            purgedCount++;
            return false;
          }

          // If checking user's posts against authoritative DB list
          const pProfId = p.profile_id || p.data?.profile_id || p.data?.postedBy || p.author?.id;
          const pUserId = p.user_id || p.data?.user_id;
          const isThisUser = (pProfId === userId || pUserId === userId || p.author?.isYou === true || p.isYou === true);

          if (isThisUser && validIds && validIds.size > 0 && !validIds.has(pid)) {
            // Post exists in IDB but is no longer in Supabase DB -> remove stale post
            modified = true;
            purgedCount++;
            return false;
          }

          return true;
        });

        if (modified) {
          await socialFeedStore.setItem(fk, freshList);
        }
      }
    }

    // Clean creative nodes store
    const nodeKeys = await creativeNodesStore.keys();
    for (const nk of nodeKeys) {
      const node = await creativeNodesStore.getItem<any>(nk);
      if (node) {
        const isNodeUser = node.creator_id === userId || !node.creator_id;
        const nodeImg = node.imageUrl || node.url || node.image;
        const normImg = nodeImg ? normalizeImageUrl(nodeImg) : '';

        if (isNodeUser && validUrls && validUrls.size > 0 && normImg && !validUrls.has(normImg)) {
          await creativeNodesStore.removeItem(nk);
          purgedCount++;
        }
      }
    }

    // Clean creative gallery localstorage keys
    const creativeGalKey = `nexus_core_creative_gallery_${userId}`;
    const rawGal = localStorage.getItem(creativeGalKey);
    if (rawGal) {
      try {
        const parsed = JSON.parse(rawGal);
        if (Array.isArray(parsed)) {
          const deduplicated: any[] = [];
          const seen = new Set<string>();

          for (const item of parsed) {
            const itemImg = item?.imageUrl || item?.url || item?.image;
            const norm = itemImg ? normalizeImageUrl(itemImg) : '';
            if (norm && !seen.has(norm)) {
              seen.add(norm);
              deduplicated.push(item);
            }
          }

          localStorage.setItem(creativeGalKey, JSON.stringify(deduplicated));
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[photoPitSyncUtils] purgeStaleIndexedDBPhotos notice:', err);
  }

  return { purgedCount };
}
