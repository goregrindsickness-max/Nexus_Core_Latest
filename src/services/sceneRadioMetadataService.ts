/**
 * Scene Radio Metadata Service
 * 
 * Provides resilient, multi-tier song & playlist metadata resolution that works
 * across Web Preview, Production Cloud, and Standalone Mobile APK (Android/iOS WebView/Capacitor).
 * 
 * Strategy:
 * 1. Persistent client storage (localStorage / memory cache)
 * 2. Direct Supabase database cache (nexus_notifications / playlist_cache_*)
 * 3. Direct client-side oEmbed / noembed resolver (CORS-friendly, no Node backend required)
 * 4. Local fallback catalog (FRONTEND_FALLBACK_PLAYLISTS)
 */

import { FRONTEND_FALLBACK_PLAYLISTS } from '../data/socialFeedMockData';
import { getRawSupabase } from './clientService';

export interface RadioTrackMeta {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'nexus_radio_cache_';
const MEMORY_CACHE = new Map<string, RadioTrackMeta>();

// Load initial in-memory cache from localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_KEY_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: RadioTrackMeta[] = JSON.parse(raw);
            if (Array.isArray(list)) {
              list.forEach(t => {
                if (t.videoId && t.title && !t.title.startsWith('Track ')) {
                  MEMORY_CACHE.set(t.videoId, t);
                }
              });
            }
          }
        } catch {
          // ignore parsing error
        }
      }
    }
  }
} catch {
  // ignore storage errors
}

// Clean and normalize song titles from YouTube video titles
export function parseArtistAndTitle(rawTitle: string, defaultAuthor: string = 'Scene Artist'): { title: string; author: string } {
  if (!rawTitle) return { title: 'Scene Track', author: defaultAuthor };

  let title = rawTitle.trim();
  let author = defaultAuthor;

  // Remove common YouTube noise suffixes
  title = title.replace(/\s*[\(\[]\s*(official\s*(music\s*)?video|audio|lyric\s*video|stream|full\s*album|hd|4k|visualizer|hq)\s*[\)\]]/gi, '').trim();

  // If formatted as "Artist - Title" or "Artist — Title" or "Artist : Title"
  const splitMatch = title.match(/^([^-—:–]+)\s*[-—:–]\s*(.+)$/);
  if (splitMatch) {
    author = splitMatch[1].trim();
    title = splitMatch[2].trim();
  }

  return { title, author };
}

// Direct client-side oEmbed fetch (works in Android WebView & APK)
export async function fetchDirectVideoOEmbed(videoId: string): Promise<RadioTrackMeta | null> {
  if (!videoId) return null;

  // Check memory cache first
  const cached = MEMORY_CACHE.get(videoId);
  if (cached && cached.title && !cached.title.startsWith('Track ') && cached.author !== 'Unknown Artist') {
    return cached;
  }

  // 1. Try YouTube official oEmbed
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        const { title, author } = parseArtistAndTitle(data.title, data.author_name || 'Scene Artist');
        const track: RadioTrackMeta = {
          videoId,
          title: title || data.title,
          author: author || data.author_name || 'Scene Artist',
          thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
        MEMORY_CACHE.set(videoId, track);
        return track;
      }
    }
  } catch {
    // try fallback
  }

  // 2. Try noembed.com fallback (CORS enabled proxy)
  try {
    const url = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        const { title, author } = parseArtistAndTitle(data.title, data.author_name || 'Scene Artist');
        const track: RadioTrackMeta = {
          videoId,
          title: title || data.title,
          author: author || data.author_name || 'Scene Artist',
          thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        };
        MEMORY_CACHE.set(videoId, track);
        return track;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

// Fetch entire playlist tracks using multi-tier fallback
export async function getPlaylistTracksResilient(playlistId: string): Promise<RadioTrackMeta[]> {
  if (!playlistId) return [];

  // Tier 1: Check LocalStorage / Cached Tracks for this playlist
  let localList: RadioTrackMeta[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + playlistId);
    if (raw) {
      localList = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  if (localList.length >= 10 && localList.some(t => t.title && !t.title.startsWith('Track '))) {
    localList.forEach(t => {
      if (t.videoId) MEMORY_CACHE.set(t.videoId, t);
    });
    return localList;
  }

  // Tier 2: Query direct Supabase database cache (nexus_notifications table)
  try {
    const supabase = getRawSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('nexus_notifications')
        .select('data')
        .eq('id', `playlist_cache_${playlistId}`)
        .maybeSingle();

      if (!error && data && Array.isArray(data.data) && data.data.length > 0) {
        const dbTracks: RadioTrackMeta[] = data.data;
        // Save to local cache
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + playlistId, JSON.stringify(dbTracks));
        } catch {}
        dbTracks.forEach(t => {
          if (t.videoId) MEMORY_CACHE.set(t.videoId, t);
        });
        return dbTracks;
      }
    }
  } catch (dbErr) {
    console.warn('[RADIO METADATA SERVICE] Supabase direct cache lookup note:', dbErr);
  }

  // Tier 3: Try local backend route /api/playlist/:playlistId (if running on web preview / Cloud Run)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout so APK does not hang

    const response = await fetch(`/api/playlist/${playlistId}`, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.videos) && json.videos.length > 0) {
        const serverTracks: RadioTrackMeta[] = json.videos;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + playlistId, JSON.stringify(serverTracks));
        } catch {}
        serverTracks.forEach(t => {
          if (t.videoId) MEMORY_CACHE.set(t.videoId, t);
        });
        return serverTracks;
      }
    }
  } catch {
    // On APK, /api/playlist/... fails immediately, perfectly fine
  }

  // Tier 4: Fallback to seed catalog
  const fallbackList: RadioTrackMeta[] = FRONTEND_FALLBACK_PLAYLISTS[playlistId] || [
    { videoId: 's7oZ4xV_f_k', title: 'Metal Scene Radio', author: 'Scene Radio', thumbnailUrl: 'https://img.youtube.com/vi/s7oZ4xV_f_k/hqdefault.jpg' }
  ];

  return fallbackList;
}

// Client-side batch enricher for any list of video IDs (from YouTube getPlaylist())
export async function enrichTrackBatchDirect(
  playlistId: string,
  videoIds: string[],
  currentTracks: RadioTrackMeta[],
  onUpdate?: (updated: RadioTrackMeta[]) => void
): Promise<RadioTrackMeta[]> {
  if (!videoIds || videoIds.length === 0) return currentTracks;

  // Build a map of existing tracks
  const trackMap = new Map<string, RadioTrackMeta>();
  currentTracks.forEach(t => {
    if (t.videoId) trackMap.set(t.videoId, t);
  });

  // Check which video IDs need enrichment
  const missingIds: string[] = [];
  videoIds.forEach((id, index) => {
    const existing = trackMap.get(id);
    const cached = MEMORY_CACHE.get(id);

    if (cached && cached.title && !cached.title.startsWith('Track ') && cached.author !== 'Unknown Artist') {
      trackMap.set(id, cached);
    } else if (!existing || !existing.title || existing.title.startsWith('Track ') || existing.author === 'Unknown Artist') {
      missingIds.push(id);
      if (!existing) {
        trackMap.set(id, {
          videoId: id,
          title: `Track ${index + 1}`,
          author: 'Unknown Artist',
          thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        });
      }
    }
  });

  // If there are missing IDs, resolve them in batches using client-side oEmbed
  if (missingIds.length > 0) {
    const batchSize = 6;
    const processIds = missingIds.slice(0, 36); // Enrich top tracks in queue

    // Run in parallel chunks of 4
    for (let i = 0; i < processIds.length; i += batchSize) {
      const chunk = processIds.slice(i, i + batchSize);
      const results = await Promise.allSettled(chunk.map(id => fetchDirectVideoOEmbed(id)));

      let anyUpdated = false;
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled' && res.value) {
          const track = res.value;
          trackMap.set(track.videoId, track);
          MEMORY_CACHE.set(track.videoId, track);
          anyUpdated = true;
        }
      });

      if (anyUpdated && onUpdate) {
        // Re-construct array in original playlist order
        const currentList = videoIds.map((id, idx) => trackMap.get(id) || {
          videoId: id,
          title: `Track ${idx + 1}`,
          author: 'Unknown Artist',
          thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
        });
        onUpdate(currentList);

        // Save progress to localStorage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + playlistId, JSON.stringify(currentList));
        } catch {}
      }
    }
  }

  // Final list in order of videoIds
  const finalList = videoIds.map((id, idx) => trackMap.get(id) || {
    videoId: id,
    title: `Track ${idx + 1}`,
    author: 'Unknown Artist',
    thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  });

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + playlistId, JSON.stringify(finalList));
  } catch {}

  // Asynchronously save to Supabase cache if authenticated or anon
  try {
    const supabase = getRawSupabase();
    if (supabase && finalList.some(t => t.title && !t.title.startsWith('Track '))) {
      Promise.resolve(
        supabase
          .from('nexus_notifications')
          .upsert({
            id: `playlist_cache_${playlistId}`,
            data: finalList,
            created_at: new Date().toISOString()
          })
      ).catch(() => {});
    }
  } catch {}

  return finalList;
}

// Save single track metadata update
export function persistSingleTrackMeta(playlistId: string, track: RadioTrackMeta): void {
  if (!track || !track.videoId || !track.title || track.title.startsWith('Track ')) return;

  MEMORY_CACHE.set(track.videoId, track);

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PREFIX + playlistId);
    let list: RadioTrackMeta[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(t => t.videoId === track.videoId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...track };
    } else {
      list.push(track);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_PREFIX + playlistId, JSON.stringify(list));
  } catch {}
}
