// Universal Global Follow State Synchronization Service for Nexus Core Network

import { pushManager } from '../lib/pushNotifications';

export const FOLLOW_CACHE_KEY = 'nexus_local_follows_v1';
export const FOLLOW_EVENT_NAME = 'nexus_follow_updated';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const PREFIX_REGEX = /^(?:db-band-|db-p-band-|db-p-c-|db-p-|db-c-|real-b-|real-p-band-|real-p-c-|real-p-|p-band-|band-|user-|creative-|label-|promoter-|venue-|target-|profile-)/i;

const NOISE_KEYS = new Set([
  '',
  'user',
  'member',
  'target',
  'band',
  'artist',
  'fan',
  'fan listener',
  'listener',
  'profile',
  'new user',
  'official band',
  'archive band',
  'community archive',
  'community archive profile',
  'band profile',
  'creative',
  'creative pro',
  'label',
  'record label',
  'promoter',
  'pro promoter',
  'venue',
  'undefined',
  'null',
  'anonymous',
  'anonymous user',
  'my account',
  'your profile'
]);

function addKeyWithPermutations(keys: Set<string>, rawVal: any) {
  if (!rawVal || typeof rawVal !== 'string') return;
  const str = rawVal.trim().toLowerCase();
  if (!str || NOISE_KEYS.has(str)) return;

  // Add verbatim clean key
  keys.add(str);

  // If there's an embedded UUID, add the bare UUID
  const uuidMatch = str.match(UUID_REGEX);
  if (uuidMatch && uuidMatch[0]) {
    keys.add(uuidMatch[0].toLowerCase());
  }

  // Strip known prefix if present
  if (PREFIX_REGEX.test(str)) {
    const stripped = str.replace(PREFIX_REGEX, '').trim();
    if (stripped && !NOISE_KEYS.has(stripped)) {
      keys.add(stripped);
      const strippedUuid = stripped.match(UUID_REGEX);
      if (strippedUuid && strippedUuid[0]) {
        keys.add(strippedUuid[0].toLowerCase());
      }
    }
  }

  // Strip leading @ if present
  if (str.startsWith('@')) {
    const strippedAt = str.replace(/^@+/, '').trim();
    if (strippedAt && !NOISE_KEYS.has(strippedAt)) {
      keys.add(strippedAt);
    }
  }

  // Handle parenthesized strings like "Name (Handle)" or "Handle (Name)"
  const parenMatch = str.match(/^(.+?)\s*\((.+?)\)$/);
  if (parenMatch) {
    const p1 = parenMatch[1].trim();
    const p2 = parenMatch[2].trim();
    if (p1 && !NOISE_KEYS.has(p1)) keys.add(p1);
    if (p2 && !NOISE_KEYS.has(p2)) keys.add(p2);
  }
}

/**
 * Normalizes input target into all candidate search keys (UUIDs, names, handles, prefixes)
 */
export function getTargetFollowKeys(target: any): string[] {
  if (!target) return [];
  const keys = new Set<string>();

  if (typeof target === 'string') {
    addKeyWithPermutations(keys, target);
  } else if (typeof target === 'object') {
    // 1. Candidate IDs
    const candidateIds = [
      target.id,
      target.raw_id,
      target.rawId,
      target.band_id,
      target.bandId,
      target.artist_id,
      target.artistId,
      target.followed_id,
      target.followedId,
      target.user_id,
      target.userId,
      target.creator_id,
      target.creatorId,
      target.profile_id,
      target.profileId,
      target.owner_id,
      target.author_id,
      target.authorId
    ];

    candidateIds.forEach(id => {
      if (id && typeof id === 'string') {
        addKeyWithPermutations(keys, id);
      }
    });

    // 2. Candidate Names and Handles (never include generic titles or roles)
    const candidateNames = [
      target.name,
      target.full_name,
      target.fullName,
      target.band_name,
      target.bandName,
      target.target_name,
      target.artist_name,
      target.headliner,
      target.label_company_name,
      target.business_name,
      target.creative_name,
      target.agency_name,
      target.promoter_name,
      target.console_handle,
      target.handle,
      target.username
    ];

    candidateNames.forEach(name => {
      if (name && typeof name === 'string') {
        addKeyWithPermutations(keys, name);
      }
    });
  }

  return Array.from(keys);
}

/**
 * Checks if a profile/band/creator is currently followed in localStorage or provided follows list
 */
export function isProfileFollowedGlobally(target: any, additionalFollowsList?: any[]): boolean {
  if (!target) return false;

  const keys = getTargetFollowKeys(target);

  // 1. Read central localStorage registry first (highest user intent priority)
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(FOLLOW_CACHE_KEY);
      if (raw) {
        const localFollows: Record<string, boolean> = JSON.parse(raw);
        // Check for explicit false first across any key
        for (const k of keys) {
          if (localFollows[k] === false) return false;
        }
        // Then check for explicit true
        for (const k of keys) {
          if (localFollows[k] === true) return true;
        }
      }
    }
  } catch (_) {}

  // 2. Check additional follows list (e.g., Supabase follows array)
  if (Array.isArray(additionalFollowsList) && additionalFollowsList.length > 0) {
    for (const f of additionalFollowsList) {
      if (!f) continue;
      const fKeys = getTargetFollowKeys(f);
      if (keys.some(k => fKeys.includes(k) || f.artist_id === k || f.followed_id === k || (f.target_name && f.target_name.toLowerCase().trim() === k))) {
        return true;
      }
    }
  }

  // 3. Direct explicit boolean on object if present (only if no explicit boolean in cache)
  if (typeof target === 'object') {
    if (target.isFollowedByMe === true) return true;
    if (target.isFollowed === true || target.followed === true) return true;
  }

  if (keys.length === 0) return false;

  // 4. Check legacy secondary keys for cross-portal sync
  try {
    if (typeof window !== 'undefined') {
      const legacyCreative = localStorage.getItem('nexus_followed_creatives');
      if (legacyCreative) {
        const arr = JSON.parse(legacyCreative);
        if (Array.isArray(arr) && keys.some(k => arr.includes(k))) return true;
      }

      const legacyLabelBands = localStorage.getItem('label_followed_bands');
      if (legacyLabelBands) {
        const arr = JSON.parse(legacyLabelBands);
        if (Array.isArray(arr) && keys.some(k => arr.includes(k))) return true;
      }
    }
  } catch (_) {}

  return false;
}

/**
 * Persists a follow or unfollow state globally across localStorage and broadcasts sync event
 */
export function saveFollowStateGlobally(target: any, isFollowed: boolean, followerId?: string): void {
  if (!target || typeof window === 'undefined') return;

  const keys = getTargetFollowKeys(target);
  if (keys.length === 0) return;

  try {
    const raw = localStorage.getItem(FOLLOW_CACHE_KEY);
    const localFollows: Record<string, boolean> = raw ? JSON.parse(raw) : {};

    keys.forEach(k => {
      // Explicitly store true or false so unfollowed state is recorded and never falls back to stale caches
      localFollows[k] = isFollowed;
    });

    localStorage.setItem(FOLLOW_CACHE_KEY, JSON.stringify(localFollows));

    // Also sync secondary legacy keys
    try {
      const creativeRaw = localStorage.getItem('nexus_followed_creatives');
      let creativeArr: string[] = creativeRaw ? JSON.parse(creativeRaw) : [];
      if (isFollowed) {
        keys.forEach(k => { if (!creativeArr.includes(k)) creativeArr.push(k); });
      } else {
        creativeArr = creativeArr.filter(k => !keys.includes(k));
      }
      localStorage.setItem('nexus_followed_creatives', JSON.stringify(creativeArr));
    } catch (_) {}

    try {
      const labelRaw = localStorage.getItem('label_followed_bands');
      let labelArr: string[] = labelRaw ? JSON.parse(labelRaw) : [];
      if (isFollowed) {
        keys.forEach(k => { if (!labelArr.includes(k)) labelArr.push(k); });
      } else {
        labelArr = labelArr.filter(k => !keys.includes(k));
      }
      localStorage.setItem('label_followed_bands', JSON.stringify(labelArr));
    } catch (_) {}

    // Dispatch global window custom event for real-time app-wide updates
    window.dispatchEvent(new CustomEvent(FOLLOW_EVENT_NAME, {
      detail: {
        keys,
        target,
        isFollowed,
        followerId,
        timestamp: Date.now()
      }
    }));

    // Trigger push notification to target profile when followed
    if (isFollowed) {
      const targetId = typeof target === 'object' ? (target.id || target.user_id || target.author_id) : target;
      const targetName = typeof target === 'object' ? (target.name || target.band_name || target.title) : 'Artist';
      if (targetId) {
        pushManager.sendPushToServer({
          userId: String(targetId),
          title: '🤘 New Fan Alliance!',
          body: `A scene member started following ${targetName || 'your profile'} on Nexus Core!`,
          category: 'new_follower',
          targetTab: 'social',
          priority: 'P1'
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[followSyncService] Save follow state error:', err);
  }
}
