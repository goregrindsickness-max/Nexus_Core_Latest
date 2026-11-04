// Universal Global Follow State Synchronization Service for Nexus Core Network

export const FOLLOW_CACHE_KEY = 'nexus_local_follows_v1';
export const FOLLOW_EVENT_NAME = 'nexus_follow_updated';

/**
 * Normalizes input target into all candidate search keys (UUIDs, names, handles)
 */
export function getTargetFollowKeys(target: any): string[] {
  if (!target) return [];
  const keys = new Set<string>();

  if (typeof target === 'string') {
    const clean = target.trim().toLowerCase().replace(/^real-[pb]-/, '').replace(/^real-/, '').replace(/^@+/, '');
    if (clean) keys.add(clean);
  } else if (typeof target === 'object') {
    const candidateIds = [
      target.id,
      target.user_id,
      target.userId,
      target.band_id,
      target.bandId,
      target.creator_id,
      target.creatorId,
      target.raw_id,
      target.rawId,
      target.profile_id,
      target.profileId,
      target.owner_id,
      target.author_id,
    ];
    candidateIds.forEach(id => {
      if (id && typeof id === 'string') {
        const cleanId = id.trim().toLowerCase();
        if (cleanId) keys.add(cleanId);
      }
    });

    const candidateNames = [
      target.name,
      target.full_name,
      target.fullName,
      target.band_name,
      target.bandName,
      target.label_company_name,
      target.business_name,
      target.creative_name,
      target.agency_name,
      target.promoter_name,
      target.console_handle,
      target.handle,
      target.username,
      target.title,
    ];
    candidateNames.forEach(name => {
      if (name && typeof name === 'string') {
        const cleanName = name.trim().toLowerCase().replace(/^@+/, '');
        if (cleanName) keys.add(cleanName);
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
        for (const k of keys) {
          if (localFollows[k] === true) return true;
          if (localFollows[k] === false) return false;
        }
      }
    }
  } catch (_) {}

  // 2. Direct explicit boolean on object if present
  if (typeof target === 'object') {
    if (target.isFollowedByMe === true) return true;
    if (target.isFollowed === true || target.followed === true) return true;
  }

  if (keys.length === 0) return false;

  // 3. Check legacy secondary keys for cross-portal sync
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

  // 4. Check additional follows list (e.g., Supabase follows array)
  if (Array.isArray(additionalFollowsList) && additionalFollowsList.length > 0) {
    for (const f of additionalFollowsList) {
      if (!f) continue;
      const fKeys = getTargetFollowKeys(f);
      if (keys.some(k => fKeys.includes(k) || f.artist_id === k || f.followed_id === k || (f.target_name && f.target_name.toLowerCase().trim() === k))) {
        return true;
      }
    }
  }

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
      if (isFollowed) {
        localFollows[k] = true;
      } else {
        delete localFollows[k];
      }
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
  } catch (err) {
    console.warn('[followSyncService] Save follow state error:', err);
  }
}
