import { isMiguelNameOrProfile } from '../social/utils/profileUtils';

export function compressImageAtModuleLevel(base64Str: string, maxWidth = 1920, maxHeight = 1080, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement('img');
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width <= 0 || height <= 0) {
        resolve(base64Str);
        return;
      }
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str);
  });
}

export interface RegisteredWorkspaceRef {
  type: string;
  id: string;
  name?: string;
  role?: string;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeLoadedProfile(data: any): any {
  if (!data) return {};
  const isMiguel = isMiguelNameOrProfile(data);
  return {
    ...data,
    id: data.id,
    full_name: data.full_name || data.name || '',
    name: data.name || data.full_name || '',
    email: data.email || '',
    pin: data.pin || '0000',
    avatar_url: (data.avatar_url && !data.avatar_url.includes('Nexus%20Icon%20Circuits.png')) ? data.avatar_url : undefined,
    banner_url: data.banner_url || data.cover_url || '',
    account_type: data.account_type || 'fan',
    role: data.role || 'Fan Listener',
    console_handle: data.console_handle || data.screen_name || '',
    band_id: isMiguel ? 'cbddb810-259b-4230-9968-3d402dfdb872' : (data.band_id || undefined),
    band_name: isMiguel ? 'Virulent Excision' : (data.band_name || data.bandName || undefined),
    bandName: isMiguel ? 'Virulent Excision' : (data.bandName || data.band_name || undefined),
    allowed_workspaces: Array.isArray(data.allowed_workspaces) ? data.allowed_workspaces : [],
    registered_workspaces: Array.isArray(data.registered_workspaces) ? data.registered_workspaces : []
  };
}

export function normalizeRegisteredWorkspaces(existing: any = [], newRefs: any = []): string[] {
  const set = new Set<string>();

  const processItem = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('{"')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && (parsed.type || parsed.workspace_type || parsed.key)) {
            const t = String(parsed.type || parsed.workspace_type || parsed.key).toLowerCase().trim();
            if (t) set.add(t);
            return;
          }
        } catch (e) {}
      }
      const lower = trimmed.toLowerCase();
      if (lower) set.add(lower);
    } else if (typeof item === 'object') {
      const t = String(item.type || item.workspace_type || item.key || '').toLowerCase().trim();
      if (t) set.add(t);
    }
  };

  if (Array.isArray(existing)) {
    existing.forEach(processItem);
  } else if (existing) {
    processItem(existing);
  }

  if (Array.isArray(newRefs)) {
    newRefs.forEach(processItem);
  } else if (newRefs) {
    processItem(newRefs);
  }

  return Array.from(set);
}

import { uploadBase64ToStorage as uploadBase64ToStorageImpl } from '../../supabase';

export async function uploadBase64ToStorage(
  base64Data: string,
  bucket: string,
  userId: string,
  filenamePrefix: string
): Promise<string> {
  return uploadBase64ToStorageImpl(base64Data, bucket, userId, filenamePrefix);
}

export async function executeWithSchemaResilience<T>(
  fn: (payload: any) => Promise<{ data: T | null; error: any }>,
  payload: any
): Promise<{ data: T | null; error: any }> {
  let result = await fn(payload);
  if (result.error && typeof payload === 'object' && payload !== null) {
    const errMsg = result.error.message || JSON.stringify(result.error);
    const match = errMsg.match(/column "(.*?)" of relation/i) || errMsg.match(/has no column named "(.*?)"/i);
    if (match && match[1]) {
      const missingCol = match[1];
      console.warn(`[Schema Resilience] Omitting unknown column '${missingCol}' and retrying...`);
      const fallbackPayload = { ...payload };
      delete fallbackPayload[missingCol];
      return await executeWithSchemaResilience(fn, fallbackPayload);
    }
  }
  return result;
}

export const CREATIVE_CORE_SKILLS: Record<string, string[]> = {
  GRAPHIC_DESIGN: ['MERCH_DESIGN', 'ALBUM_ART', 'TOUR_POSTERS', 'BRAND_IDENTITY', 'SOCIAL_ASSETS'],
  PHOTOGRAPHY: ['LIVE_MUSIC_PHOTO', 'PRESS_SHOTS', 'TOUR_DOCUMENTARY', 'STUDIO_SESSIONS'],
  VIDEO_PRODUCTION: ['MUSIC_VIDEOS', 'TOUR_RECAPS', 'LIVE_VISUALS', 'DOCUMENTARY', 'SHORT_FORM_CONTENT'],
  AUDIO_ENGINEERING: ['FOH_ENGINEER', 'MONITOR_ENGINEER', 'STUDIO_MIXING', 'MASTERING', 'POST_PRODUCTION'],
  SESSION_MUSICIAN_TECHS: ['TOUR_MANAGEMENT', 'SESSION_MUSICIAN', 'LIGHTING_DIRECTOR', 'STAGE_DESIGN', 'BOOKING_AGENT']
};

export const GENRE_CLUSTERS = [
  {
    name: 'CLUSTER 01: EXTREME METAL',
    genres: ['DEATH METAL', 'SLAMMING BDM', 'BRUTAL DEATH METAL', 'BRUTAL DEATHCORE', 'TECHNICAL BDM', 'DEATH N\' ROLL', 'TECH DEATH', 'BLASTING BDM', 'GRINDCORE', 'DEATHGRIND', 'GOREGRIND/PORNOGRIND', 'THRASH METAL', 'DEATH THRASH', 'MELODIC DEATH', 'OSDM', 'DOOM', 'BLACK METAL', 'BLACKENED DEATH', 'SYMPHONIC BLACK', 'DEATHCORE', 'PROGRESSIVE DEATH']
  },
  {
    name: 'CLUSTER 02: ROCK/HEAVY METAL',
    genres: ['TRADITIONAL HEAVY METAL', 'DOOM METAL', 'STONER METAL', 'SLUDGE METAL', 'STONER ROCK', 'PROG METAL', 'POWER METAL', 'ALTERNATIVE ROCK', 'GOTHIC ROCK', 'HARD ROCK', 'NEW WAVE', 'FOLK METAL', 'AVANT-GARDE', 'DJENT', 'MATHCORE', 'MATH ROCK', 'SHOE GAZE', 'NOISE ROCK', 'INDIE ROCK', 'NU METAL']
  },
  {
    name: 'CLUSTER 03: HARDCORE',
    genres: ['TRADITIONAL HARDCORE', 'METALCORE', 'BEATDOWN', 'YOUTH CREW', 'FASTCORE', 'POST HARDCORE', 'MELODIC HARDCORE', 'SKRAMZ/SCREAMO', 'POWER VIOLENCE', 'MINCECORE']
  },
  {
    name: 'CLUSTER 04: PUNK/ALTERNATIVE',
    genres: ['PUNK ROCK', 'POP PUNK', 'MATH ROCK', 'MIDWEST EMO', 'SKATE PUNK', 'MELODIC PUNK', 'INDIE PUNK', 'POST PUNK', 'GRUNGE']
  },
  {
    name: 'CLUSTER 05: INDUSTRIAL/EDM',
    genres: ['EBM', 'SYNTHWAVE', 'DARKWAVE/COLD WAVE', 'AGGROTECH/TERROR EBM', 'TECHNO', 'INDUSTRIAL METAL', 'DUBSTEP', 'DRUM & BASS', 'GABBER/HARDSTYLE', 'BREAKCORE', 'HARSH NOISE WALL', 'WITCH HOUSE']
  },
  {
    name: 'CLUSTER 06: HIP HOP/RAP',
    genres: ['UNDERGROUND RAP', 'TRAP', 'BOOM BAP', 'PHONK', 'DRILL', 'CLOUD RAP', 'EXPERIMENTAL', 'GRIME']
  }
];

export async function ensureAutoFollowMiguel(supabase: any, newUserId: string) {
  if (!supabase || !newUserId) return;
  try {
    // Query profiles for Miguel / goregrindsickness / industry pro
    const { data: proProfiles, error } = await supabase
      .from('profiles')
      .select('id, email, name, account_type')
      .or('email.ilike.%goregrindsickness%,name.ilike.%miguel%,account_type.eq.industry pro');

    let targetId: string | null = null;
    if (proProfiles && proProfiles.length > 0) {
      const match = proProfiles.find((p: any) => p.email?.toLowerCase().includes('goregrindsickness') || p.name?.toLowerCase().includes('miguel')) || proProfiles[0];
      if (match?.id) {
        targetId = match.id;
      }
    }

    if (!targetId) {
      const { data: fallbackProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('account_type', 'industry pro')
        .limit(5);
      if (fallbackProfiles && fallbackProfiles.length > 0) {
        const validFallback = fallbackProfiles.find((p: any) => p.id !== newUserId);
        if (validFallback) targetId = validFallback.id;
      }
    }

    if (!targetId || targetId === newUserId) return;

    const followId = `follow-${newUserId}-${targetId}`;
    const payload = {
      id: followId,
      follower_id: newUserId,
      followed_id: targetId,
      target_type: 'user'
    };

    await supabase.from('follows').upsert([payload], { onConflict: 'follower_id,followed_id' });

    try {
      const localFollows = JSON.parse(localStorage.getItem('nexus_local_follows_v1') || '{}');
      if (!localFollows[newUserId]) localFollows[newUserId] = {};
      localFollows[newUserId][targetId] = true;
      localStorage.setItem('nexus_local_follows_v1', JSON.stringify(localFollows));
    } catch (e) {
      // ignore
    }

    console.log(`[Auto-Follow Active] User ${newUserId} successfully auto-followed industry pro profile ${targetId}`);
  } catch (err) {
    console.warn('ensureAutoFollowMiguel exception:', err);
  }
}
