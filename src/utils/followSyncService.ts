// Universal Global Follow State Synchronization Service for Nexus Core Network

import { pushManager } from '../lib/pushNotifications';

export const FOLLOW_CACHE_KEY = 'nexus_local_follows_v2';
export const FOLLOW_EVENT_NAME = 'nexus_follow_updated';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const PREFIX_REGEX = /^(?:db-band-|db-p-band-|db-p-c-|db-p-|db-c-|db-l-|db-pr-|real-b-|real-p-band-|real-p-c-|real-p-|p-band-|band-|user-|creative-|label-|promoter-|venue-|target-|profile-)/i;

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

export function getActiveFollowUserIds(explicitUserId?: string): string[] {
  const ids = new Set<string>();
  const addId = (val: any) => {
    if (!val || typeof val !== 'string') return;
    const clean = val.trim().toLowerCase();
    if (!clean || clean === 'guest') return;
    ids.add(clean);
    const uuidMatch = clean.match(UUID_REGEX);
    if (uuidMatch && uuidMatch[0]) {
      ids.add(uuidMatch[0].toLowerCase());
    }
  };

  if (explicitUserId) {
    addId(explicitUserId);
  }

  try {
    if (typeof window !== 'undefined') {
      const rawProfile = localStorage.getItem('nexus_core_user_profile');
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        addId(parsed?.id);
        addId(parsed?.user_id);
        addId(parsed?.raw_id);
        addId(parsed?.email);
      }
    }
  } catch (_) {}

  return Array.from(ids);
}

export function resolveActiveFollowScope(explicitUserId?: string): string {
  if (explicitUserId && typeof explicitUserId === 'string') {
    const uuidMatch = explicitUserId.trim().toLowerCase().match(UUID_REGEX);
    if (uuidMatch?.[0]) return uuidMatch[0];
    const clean = explicitUserId.trim().toLowerCase();
    if (clean) return clean;
  }

  try {
    if (typeof window !== 'undefined') {
      const rawProfile = localStorage.getItem('nexus_core_user_profile');
      if (rawProfile) {
        const parsed = JSON.parse(rawProfile);
        const rawId = parsed?.id || parsed?.user_id || parsed?.raw_id || parsed?.email;
        if (rawId && typeof rawId === 'string') {
          const uuidMatch = rawId.trim().toLowerCase().match(UUID_REGEX);
          if (uuidMatch?.[0]) return uuidMatch[0];
          return rawId.trim().toLowerCase();
        }
      }
    }
  } catch (_) {}

  return 'guest';
}

export function getScopedFollowsMap(explicitUserId?: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const scope = resolveActiveFollowScope(explicitUserId);
    const raw = localStorage.getItem(FOLLOW_CACHE_KEY);
    if (!raw) return {};
    const store = JSON.parse(raw);
    if (store && typeof store === 'object' && store[scope] && typeof store[scope] === 'object') {
      return store[scope];
    }
  } catch (_) {}
  return {};
}

export function syncScopedFollowsFromServer(followedTargetIds: string[], explicitUserId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const scope = resolveActiveFollowScope(explicitUserId);
    if (!scope || scope === 'guest') return;
    const raw = localStorage.getItem(FOLLOW_CACHE_KEY);
    const store: Record<string, Record<string, boolean>> = raw ? JSON.parse(raw) : {};
    const nextMap: Record<string, boolean> = {};
    (followedTargetIds || []).forEach(id => {
      if (!id || typeof id !== 'string') return;
      const keys = new Set<string>();
      addKeyWithPermutations(keys, id);
      keys.forEach(k => {
        nextMap[k] = true;
      });
    });
    store[scope] = nextMap;
    localStorage.setItem(FOLLOW_CACHE_KEY, JSON.stringify(store));
  } catch (_) {}
}

export function isEntityTargetObject(target: any): boolean {
  if (!target || typeof target !== 'object') return false;
  const typeStr = String(target.type || target.category || target.portalRole || target.account_type || target.target_type || '').toLowerCase().trim();
  const idStr = String(target.id || '').toLowerCase().trim();
  return Boolean(
    target.isBandProfile === true ||
    target.isBand === true ||
    target.isRealBand === true ||
    target.is_community === true ||
    target.isCommunityArchive === true ||
    target.is_community_archive === true ||
    target.isPromoterProfile === true ||
    target.is_promoter === true ||
    target.isLabelProfile === true ||
    target.isCreativeProfile === true ||
    target.band_id ||
    target.bandId ||
    target.label_id ||
    target.promoter_id ||
    target.creative_id ||
    ['band', 'bands', 'label', 'labels', 'promoter', 'promoters', 'venue', 'venues', 'creative', 'creatives', 'archive'].includes(typeStr) ||
    idStr.startsWith('db-band-') ||
    idStr.startsWith('real-b-') ||
    idStr.startsWith('comm-') ||
    idStr.startsWith('db-l-') ||
    idStr.startsWith('db-pr-') ||
    idStr.startsWith('promoter-') ||
    idStr.startsWith('artist-')
  );
}

function isFollowRowRecord(target: any): boolean {
  if (!target || typeof target !== 'object') return false;
  return Boolean(
    ('followed_id' in target || 'artist_id' in target) &&
    ('follower_id' in target || 'fan_profile_id' in target)
  );
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
    // Follow relationship row: ONLY extract the followed target keys, never follower_id or row id
    if (isFollowRowRecord(target)) {
      [target.followed_id, target.followedId, target.artist_id, target.artistId, target.target_name].forEach(val => {
        if (val && typeof val === 'string') addKeyWithPermutations(keys, val);
      });
      return Array.from(keys);
    }

    const isEntity = isEntityTargetObject(target);

    // 1. Candidate IDs
    // CRITICAL: Never treat creator_id, owner_id, author_id (or user_id/profile_id on entity cards)
    // as the follow key for a band/label/promoter/creative, otherwise following the creator marks
    // every entity they created/uploaded as followed.
    const candidateIds = isEntity
      ? [
          target.id,
          target.raw_id,
          target.rawId,
          target.band_id,
          target.bandId,
          target.artist_id,
          target.artistId,
          target.followed_id,
          target.followedId,
        ]
      : [
          target.id,
          target.raw_id,
          target.rawId,
          target.user_id,
          target.userId,
          target.profile_id,
          target.profileId,
          target.followed_id,
          target.followedId,
          target.artist_id,
          target.artistId,
          target.band_id,
          target.bandId,
        ];

    candidateIds.forEach(id => {
      if (id && typeof id === 'string') {
        addKeyWithPermutations(keys, id);
      }
    });

    // 2. Candidate Names and Handles (never include generic titles, and skip personal full_name on entity records)
    const candidateNames = isEntity
      ? [
          target.band_name,
          target.bandName,
          target.name,
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
          target.username,
        ]
      : [
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
          target.username,
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
 * Checks if a profile/band/creator is currently followed by the active user
 */
export function isProfileFollowedGlobally(
  target: any,
  additionalFollowsList?: any[],
  currentUserId?: string
): boolean {
  if (!target) return false;

  const keys = getTargetFollowKeys(target);
  if (keys.length === 0) return false;

  // 1. Read user-scoped localStorage registry first (highest user intent priority)
  try {
    if (typeof window !== 'undefined') {
      const localFollows = getScopedFollowsMap(currentUserId);
      // Check for explicit false first across any key
      for (const k of keys) {
        if (localFollows[k] === false) return false;
      }
      // Then check for explicit true
      for (const k of keys) {
        if (localFollows[k] === true) return true;
      }
    }
  } catch (_) {}

  // 2. Check additional follows list (e.g., Supabase follows array for the current user)
  if (Array.isArray(additionalFollowsList) && additionalFollowsList.length > 0) {
    const activeUserIds = getActiveFollowUserIds(currentUserId);
    for (const f of additionalFollowsList) {
      if (!f) continue;

      // Skip entries explicitly marked unfollowed (e.g. if a profile object list was passed)
      if (typeof f === 'object' && (f.followed === false || f.isFollowed === false || f.isFollowedByMe === false)) {
        continue;
      }

      // Enforce current-user ownership when the row carries a follower identifier
      const rowFollower = f.follower_id || f.fan_profile_id;
      if (rowFollower && activeUserIds.length > 0) {
        const cleanFollower = String(rowFollower).trim().toLowerCase();
        if (!activeUserIds.includes(cleanFollower)) {
          continue;
        }
      }

      const fKeys = getTargetFollowKeys(f);
      if (
        keys.some(
          k =>
            fKeys.includes(k) ||
            (typeof f.artist_id === 'string' && f.artist_id.toLowerCase().trim() === k) ||
            (typeof f.followed_id === 'string' && f.followed_id.toLowerCase().trim() === k) ||
            (typeof f.target_name === 'string' && f.target_name.toLowerCase().trim() === k)
        )
      ) {
        return true;
      }
    }
  }

  // 3. Fallback boolean on object ONLY when no authoritative follows list was provided
  if (additionalFollowsList === undefined && typeof target === 'object') {
    if (target.isFollowedByMe === true) return true;
    if (target.isFollowed === true || target.followed === true) return true;
  }

  return false;
}

/**
 * Persists a follow or unfollow state for the active user and broadcasts sync event
 */
export function saveFollowStateGlobally(target: any, isFollowed: boolean, followerId?: string): void {
  if (!target || typeof window === 'undefined') return;

  const keys = getTargetFollowKeys(target);
  if (keys.length === 0) return;

  try {
    const scope = resolveActiveFollowScope(followerId);
    const raw = localStorage.getItem(FOLLOW_CACHE_KEY);
    const store: Record<string, Record<string, boolean>> = raw ? JSON.parse(raw) : {};
    const localFollows: Record<string, boolean> =
      store[scope] && typeof store[scope] === 'object' ? { ...store[scope] } : {};

    keys.forEach(k => {
      // Explicitly store true or false so unfollowed state is recorded and never falls back to stale caches
      localFollows[k] = isFollowed;
    });

    store[scope] = localFollows;
    localStorage.setItem(FOLLOW_CACHE_KEY, JSON.stringify(store));

    // Only sync portal-specific secondary caches when target matches that portal entity type
    const targetType = typeof target === 'object'
      ? String(target.type || target.category || target.portalRole || target.account_type || '').toLowerCase()
      : '';
    if (targetType === 'creative' || targetType === 'creatives') {
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
    }

    if (targetType === 'band' || targetType === 'bands' || (typeof target === 'object' && target?.isBandProfile)) {
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
    }

    // Dispatch global window custom event for real-time app-wide updates
    window.dispatchEvent(new CustomEvent(FOLLOW_EVENT_NAME, {
      detail: {
        keys,
        target,
        isFollowed,
        followerId: followerId || scope,
        timestamp: Date.now()
      }
    }));

    // Trigger push notification to target profile when followed
    if (isFollowed) {
      const targetId = typeof target === 'object'
        ? (target.band_id || target.raw_id || target.id || target.user_id || target.author_id)
        : target;
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
