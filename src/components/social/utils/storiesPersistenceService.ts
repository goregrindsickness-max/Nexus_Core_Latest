import { getSupabase } from '../../../supabase';
import { uploadStoryMediaToStorage } from '../../../services/storageService';
import { mockStories } from '../../../data/socialFeedMockData';

export interface StoryItem {
  id: string;
  name?: string;
  user?: string;
  username?: string;
  avatar?: string;
  media_url?: string;
  mediaUrl?: string;
  image?: string | null;
  video?: string | null;
  caption?: string | null;
  music?: string | null;
  textOverlay?: string | null;
  textoverlay?: string | null;
  textStyle?: string;
  textstyle?: string;
  textColorHex?: string;
  textcolorhex?: string;
  textSize?: number;
  textsize?: number;
  textX?: number;
  textx?: number;
  textY?: number;
  texty?: number;
  border?: string;
  stickers?: any[];
  stickerScale?: number;
  stickerscale?: number;
  stickerX?: number;
  stickerx?: number;
  stickerY?: number;
  stickery?: number;
  timestamp?: string;
  created_at?: string;
  profile_id?: string;
  user_id?: string;
  interactiveData?: {
    tag?: string;
    feeling?: string;
    filter?: string;
    link?: string;
    showTimestamp?: boolean;
    poll?: {
      question: string;
      option1: string;
      option2: string;
    };
  };
  [key: string]: any;
}

const MANIFEST_URL = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/photo-pit/stories/stories_manifest.json';
const STORAGE_BUCKET = 'photo-pit';
const MANIFEST_PATH = 'stories/stories_manifest.json';

/**
 * Standardize and clean any raw story object from DB, Storage, or LocalStorage
 */
export function normalizeStory(raw: any, idx = 0): StoryItem {
  const mockMatch = mockStories[idx % mockStories.length];
  const id = raw.id || `story_${Date.now()}_${idx}`;
  const authorName = raw.name || raw.user || raw.username || raw.author || mockMatch?.name || 'Band Story';

  const rawImage = raw.media_url || raw.mediaUrl || raw.image || raw.video || raw.video_url;
  const isVideo =
    !!raw.video ||
    !!raw.video_url ||
    (typeof rawImage === 'string' &&
      (/\.(mp4|webm|mov|mkv|m4v)(\?.*)?$/i.test(rawImage) || rawImage.includes('video/mp4') || rawImage.startsWith('data:video/')));

  const rawAvatar = raw.avatar || raw.user_avatar || raw.avatar_url;
  const avatar =
    rawAvatar && (rawAvatar.startsWith('http') || rawAvatar.startsWith('data:'))
      ? rawAvatar
      : mockMatch?.avatar || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=150';

  const video = isVideo ? (raw.video || raw.video_url || rawImage) : null;
  const image = isVideo ? null : (raw.image || raw.media_url || raw.mediaUrl || (rawImage && !isVideo ? rawImage : mockMatch?.image));
  const mediaUrl = video || image || raw.media_url || raw.mediaUrl || mockMatch?.image;

  return {
    ...raw,
    id,
    name: authorName,
    user: authorName,
    username: authorName,
    avatar,
    media_url: mediaUrl,
    mediaUrl,
    image,
    video,
    caption: raw.caption || raw.description || null,
    music: raw.music || raw.musicTrack || null,
    textOverlay: raw.textOverlay || raw.textoverlay || null,
    textoverlay: raw.textOverlay || raw.textoverlay || null,
    textStyle: raw.textStyle || raw.textstyle || 'metal',
    textstyle: raw.textStyle || raw.textstyle || 'metal',
    textColorHex: raw.textColorHex || raw.textcolorhex || raw.textColor || raw.textcolor || '#ffffff',
    textcolorhex: raw.textColorHex || raw.textcolorhex || raw.textColor || raw.textcolor || '#ffffff',
    textSize: raw.textSize ?? raw.textsize ?? 16,
    textsize: raw.textSize ?? raw.textsize ?? 16,
    textX: raw.textX ?? raw.textx ?? 50,
    textx: raw.textX ?? raw.textx ?? 50,
    textY: raw.textY ?? raw.texty ?? 50,
    texty: raw.textY ?? raw.texty ?? 50,
    border: raw.border || 'none',
    stickers: Array.isArray(raw.stickers) ? raw.stickers : [],
    stickerScale: raw.stickerScale ?? raw.stickerscale ?? 1.0,
    stickerscale: raw.stickerScale ?? raw.stickerscale ?? 1.0,
    stickerX: raw.stickerX ?? raw.stickerx ?? 50,
    stickerx: raw.stickerX ?? raw.stickerx ?? 50,
    stickerY: raw.stickerY ?? raw.stickery ?? 30,
    stickery: raw.stickerY ?? raw.stickery ?? 30,
    timestamp: raw.timestamp || raw.created_at || new Date().toISOString(),
    created_at: raw.created_at || raw.timestamp || new Date().toISOString(),
    profile_id: raw.profile_id || raw.user_id || undefined,
  };
}

/**
 * Fetch authoritative stories from Cloud:
 * 1. Express API (/api/stories)
 * 2. Supabase Storage manifest (photo-pit/stories/stories_manifest.json)
 * 3. Supabase nexus_stories table
 */
export async function fetchAuthoritativeStories(): Promise<StoryItem[]> {
  const storiesMap = new Map<string, StoryItem>();

  // 1. Try Express backend endpoint
  try {
    const res = await fetch(`/api/stories?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((s: any, idx: number) => {
          const norm = normalizeStory(s, idx);
          if (norm.id) storiesMap.set(norm.id, norm);
        });
      }
    }
  } catch (err) {
    console.warn('[StoriesService] Express /api/stories fetch error:', err);
  }

  // 2. Try Supabase CDN storage manifest directly
  try {
    const res = await fetch(`${MANIFEST_URL}?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((s: any, idx: number) => {
          const norm = normalizeStory(s, idx);
          if (norm.id && !storiesMap.has(norm.id)) {
            storiesMap.set(norm.id, norm);
          }
        });
      }
    }
  } catch (err) {
    console.warn('[StoriesService] Manifest CDN fetch error:', err);
  }

  // 3. Try Supabase Postgres table (nexus_stories)
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('nexus_stories')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        data.forEach((s: any, idx: number) => {
          const norm = normalizeStory(s, idx);
          if (norm.id && !storiesMap.has(norm.id)) {
            storiesMap.set(norm.id, norm);
          }
        });
      }
    } catch (err) {
      console.warn('[StoriesService] nexus_stories table fetch error:', err);
    }
  }

  return Array.from(storiesMap.values());
}

/**
 * Upload a media binary or base64 data to Supabase Storage photo-pit/stories
 */
export async function uploadMediaToCloudStorage(
  media: File | Blob | string,
  userId = 'artist',
  type: 'image' | 'video' = 'image'
): Promise<string> {
  if (!media) return '';
  if (typeof media === 'string' && (media.startsWith('http://') || media.startsWith('https://'))) {
    return media;
  }

  // 1. Try storageService dedicated helper
  try {
    const uploaded = await uploadStoryMediaToStorage(media, userId, type);
    if (uploaded && (uploaded.startsWith('http://') || uploaded.startsWith('https://'))) {
      return uploaded;
    }
  } catch (e) {
    console.warn('[StoriesService] uploadStoryMediaToStorage failed, trying direct upload:', e);
  }

  // 2. Try direct Supabase photo-pit upload
  const client = getSupabase();
  if (client) {
    try {
      const ext = type === 'video' ? 'mp4' : 'jpg';
      const fileName = `stories/${userId}_${Date.now()}.${ext}`;
      let binaryData: any = media;

      if (typeof media === 'string' && media.startsWith('data:')) {
        const parts = media.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || (type === 'video' ? 'video/mp4' : 'image/jpeg');
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        binaryData = new Blob([u8arr], { type: mime });
      }

      const { data, error } = await client.storage.from(STORAGE_BUCKET).upload(fileName, binaryData, {
        contentType: type === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: true,
      });

      if (!error && data) {
        const { data: pub } = client.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
        if (pub?.publicUrl) {
          return `${pub.publicUrl}?t=${Date.now()}`;
        }
      }
    } catch (e) {
      console.warn('[StoriesService] Direct photo-pit storage upload error:', e);
    }
  }

  // 3. Try /api/upload endpoint
  if (typeof media === 'string' && media.startsWith('data:')) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: media,
          bucket: 'photo-pit',
          userId,
          fileNameToken: `story_${type}`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.publicUrl) return json.publicUrl;
      }
    } catch (e) {
      console.warn('[StoriesService] /api/upload failed:', e);
    }
  }

  return typeof media === 'string' ? media : '';
}

/**
 * Publish a new story to all cloud targets (API, Storage manifest, and Postgres table)
 */
export async function publishStoryAuthoritative(
  newStory: StoryItem,
  mediaFileOrBlob?: File | Blob | null,
  userProfile?: any
): Promise<StoryItem> {
  const client = getSupabase();
  let mediaUrl = newStory.media_url || newStory.image || newStory.video || '';
  const isVideo =
    !!newStory.video ||
    (mediaFileOrBlob && mediaFileOrBlob.type.startsWith('video/')) ||
    (typeof mediaUrl === 'string' && (mediaUrl.endsWith('.mp4') || mediaUrl.includes('video/mp4')));

  // Ensure media is uploaded to cloud storage
  if (mediaFileOrBlob) {
    const uploaded = await uploadMediaToCloudStorage(
      mediaFileOrBlob,
      userProfile?.id || 'artist',
      isVideo ? 'video' : 'image'
    );
    if (uploaded) mediaUrl = uploaded;
  } else if (mediaUrl && mediaUrl.startsWith('data:')) {
    const uploaded = await uploadMediaToCloudStorage(
      mediaUrl,
      userProfile?.id || 'artist',
      isVideo ? 'video' : 'image'
    );
    if (uploaded) mediaUrl = uploaded;
  }

  const finalStory: StoryItem = {
    ...newStory,
    media_url: mediaUrl,
    mediaUrl,
    image: isVideo ? null : mediaUrl,
    video: isVideo ? mediaUrl : null,
    profile_id: userProfile?.id || newStory.profile_id,
  };

  // 1. Send to Express backend API
  try {
    await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalStory),
    });
  } catch (err) {
    console.warn('[StoriesService] Failed to post to /api/stories:', err);
  }

  // 2. Update Supabase Storage manifest directly
  if (client) {
    try {
      let currentManifest: StoryItem[] = [];
      try {
        const { data: manData } = await client.storage.from(STORAGE_BUCKET).download(MANIFEST_PATH);
        if (manData) {
          currentManifest = JSON.parse(await manData.text());
        }
      } catch (_) {}

      const updatedManifest = [
        finalStory,
        ...currentManifest.filter((s) => s.id !== finalStory.id),
      ];

      await client.storage.from(STORAGE_BUCKET).upload(
        MANIFEST_PATH,
        new Blob([JSON.stringify(updatedManifest, null, 2)], { type: 'application/json' }),
        { contentType: 'application/json', upsert: true }
      );
    } catch (manErr) {
      console.warn('[StoriesService] Failed to update storage manifest:', manErr);
    }
  }

  // 3. Insert into Supabase table nexus_stories
  if (client && finalStory.profile_id) {
    try {
      const payload: any = {
        id: finalStory.id.includes('-') ? finalStory.id : undefined,
        profile_id: finalStory.profile_id,
        media_url: finalStory.media_url,
        caption: finalStory.caption || null,
        username: finalStory.username || finalStory.name || null,
        avatar: finalStory.avatar || null,
        image: finalStory.image || null,
        video: finalStory.video || null,
        music: finalStory.music || null,
        textoverlay: finalStory.textOverlay || null,
        textstyle: finalStory.textStyle || 'metal',
        textcolorhex: finalStory.textColorHex || '#ffffff',
        textsize: finalStory.textSize || 16,
        textx: finalStory.textX || 50,
        texty: finalStory.textY || 50,
        border: finalStory.border || 'none',
        stickers: finalStory.stickers || [],
        stickerscale: finalStory.stickerScale || 1.0,
        stickerx: finalStory.stickerX || 50,
        stickery: finalStory.stickerY || 30,
        created_at: finalStory.created_at || new Date().toISOString(),
      };

      await client.from('nexus_stories').insert([payload]);
    } catch (tableErr) {
      console.warn('[StoriesService] nexus_stories insert warning:', tableErr);
    }
  }

  // 4. Update LocalStorage cache
  try {
    const raw = localStorage.getItem('nexus_pit_stories_v2');
    const existing: StoryItem[] = raw ? JSON.parse(raw) : [];
    const merged = [finalStory, ...existing.filter((s) => s.id !== finalStory.id)];
    localStorage.setItem('nexus_pit_stories_v2', JSON.stringify(merged));
  } catch (_) {}

  return finalStory;
}

/**
 * AUTOMATIC SYNC FOR MOBILE/LOCAL STORIES:
 * Looks at localStorage for any locally saved stories (like on the user's phone).
 * If any story is not yet in the cloud, it uploads its media and persists it app-wide!
 */
export async function syncLocalStoriesToCloud(): Promise<StoryItem[]> {
  let localStories: StoryItem[] = [];
  try {
    const raw = localStorage.getItem('nexus_pit_stories_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) localStories = parsed;
    }
  } catch (_) {
    return [];
  }

  if (localStories.length === 0) return [];

  // Filter for genuine user stories (not default mock templates)
  const userStories = localStories.filter(
    (s) =>
      s.id &&
      (s.id.startsWith('story_') || s.id.startsWith('s_') || (s.caption && !s.caption.includes('live on stage')))
  );

  if (userStories.length === 0) return [];

  console.log(`[StoriesService] Found ${userStories.length} local stories on this device. Checking cloud sync...`);

  // Fetch current cloud stories
  const cloudStories = await fetchAuthoritativeStories();
  const cloudIdSet = new Set(cloudStories.map((s) => s.id));

  const missingStories = userStories.filter((s) => !cloudIdSet.has(s.id));

  if (missingStories.length === 0) {
    console.log('[StoriesService] All local stories are already in sync with the cloud.');
    return cloudStories;
  }

  console.log(`[StoriesService] Syncing ${missingStories.length} local stories from phone to cloud...`);

  const client = getSupabase();
  const syncedStories: StoryItem[] = [];

  for (const story of missingStories) {
    try {
      let activeMediaUrl = story.media_url || story.image || story.video || '';
      // If media is a data URL or blob, upload to permanent storage
      if (activeMediaUrl.startsWith('data:') || activeMediaUrl.startsWith('blob:')) {
        const isVid = !!story.video || activeMediaUrl.includes('video');
        const uploaded = await uploadMediaToCloudStorage(
          activeMediaUrl,
          story.profile_id || 'phone_user',
          isVid ? 'video' : 'image'
        );
        if (uploaded) activeMediaUrl = uploaded;
      }

      const updatedStory = normalizeStory({
        ...story,
        media_url: activeMediaUrl,
        mediaUrl: activeMediaUrl,
        image: story.video ? null : activeMediaUrl,
        video: story.video ? activeMediaUrl : null,
      });

      // Post to /api/stories
      try {
        await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStory),
        });
      } catch (_) {}

      syncedStories.push(updatedStory);
    } catch (syncErr) {
      console.warn('[StoriesService] Error syncing story:', story.id, syncErr);
    }
  }

  // Update storage manifest with all newly synced stories
  if (client && syncedStories.length > 0) {
    try {
      const combined = [
        ...syncedStories,
        ...cloudStories.filter((c) => !syncedStories.some((s) => s.id === c.id)),
      ];
      await client.storage.from(STORAGE_BUCKET).upload(
        MANIFEST_PATH,
        new Blob([JSON.stringify(combined, null, 2)], { type: 'application/json' }),
        { contentType: 'application/json', upsert: true }
      );
    } catch (_) {}
  }

  // Update localStorage with permanent URLs
  try {
    const raw = localStorage.getItem('nexus_pit_stories_v2');
    if (raw) {
      const existing: StoryItem[] = JSON.parse(raw);
      const syncedMap = new Map(syncedStories.map((s) => [s.id, s]));
      const updatedLocal = existing.map((s) => syncedMap.get(s.id) || s);
      localStorage.setItem('nexus_pit_stories_v2', JSON.stringify(updatedLocal));
    }
  } catch (_) {}

  return await fetchAuthoritativeStories();
}
