export interface YouTubeSearchResultItem {
  videoId: string;
  title: string;
  channelName: string;
  duration?: string;
  viewCountText?: string;
  publishedTime?: string;
  thumbnailUrl: string;
  url: string;
}

const YOUTUBE_ID_REGEX =
  /(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;

const VIDEO_ID_EXACT_REGEX = /^[\w-]{11}$/;

/**
 * Extracts an 11-character YouTube video ID from standard, shortened, embed, shorts, or live URLs.
 * Returns `null` when the string is not a recognized YouTube video URL.
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.trim().match(YOUTUBE_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Legacy-compatible helper returning the 11-character video ID when matched or the input string otherwise.
 */
export function getYouTubeId(url: string): string {
  return extractYouTubeVideoId(url) || url;
}

function readTextRuns(node: any): string {
  if (!node) return '';
  if (typeof node === 'string') return node.trim();
  if (typeof node.simpleText === 'string') return node.simpleText.trim();
  if (Array.isArray(node.runs)) {
    return node.runs
      .map((r: any) => (typeof r?.text === 'string' ? r.text : ''))
      .join('')
      .trim();
  }
  return '';
}

/**
 * Extracts and parses YouTube's embedded `ytInitialData` JSON object using balanced brace scanning.
 */
export function extractYtInitialDataJson(html: string): any | null {
  if (!html || typeof html !== 'string') return null;

  const markers = [
    'var ytInitialData = ',
    'window["ytInitialData"] = ',
    "window['ytInitialData'] = ",
    'ytInitialData = ',
  ];

  let startIdx = -1;
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx !== -1) {
      const braceIdx = html.indexOf('{', idx + marker.length);
      if (braceIdx !== -1) {
        startIdx = braceIdx;
        break;
      }
    }
  }

  if (startIdx === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIdx; i < html.length; i++) {
    const ch = html[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        const jsonSlice = html.slice(startIdx, i + 1);
        try {
          return JSON.parse(jsonSlice);
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function mapVideoRenderer(renderer: any): YouTubeSearchResultItem | null {
  if (!renderer || typeof renderer !== 'object') return null;
  const videoId = typeof renderer.videoId === 'string' ? renderer.videoId.trim() : '';
  if (!VIDEO_ID_EXACT_REGEX.test(videoId)) return null;

  const title = readTextRuns(renderer.title) || 'YouTube Video';
  const channelName =
    readTextRuns(renderer.ownerText) ||
    readTextRuns(renderer.longBylineText) ||
    readTextRuns(renderer.shortBylineText) ||
    'YouTube Channel';

  let duration = readTextRuns(renderer.lengthText);
  if (!duration && Array.isArray(renderer.thumbnailOverlays)) {
    for (const overlay of renderer.thumbnailOverlays) {
      const style = overlay?.thumbnailOverlayTimeStatusRenderer?.style;
      const overlayText = readTextRuns(overlay?.thumbnailOverlayTimeStatusRenderer?.text);
      if (style === 'LIVE' || overlayText.toUpperCase() === 'LIVE') {
        duration = 'LIVE';
        break;
      }
      if (overlayText) {
        duration = overlayText;
        break;
      }
    }
  }

  const viewCountText =
    readTextRuns(renderer.shortViewCountText) || readTextRuns(renderer.viewCountText) || '';
  const publishedTime = readTextRuns(renderer.publishedTimeText) || '';

  return {
    videoId,
    title,
    channelName,
    duration,
    viewCountText,
    publishedTime,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export function parseYouTubeInitialDataVideos(
  ytInitialData: any,
  limit = 12
): YouTubeSearchResultItem[] {
  if (!ytInitialData || typeof ytInitialData !== 'object') return [];

  const results: YouTubeSearchResultItem[] = [];
  const seenIds = new Set<string>();
  const stack: Array<{ node: any; depth: number }> = [{ node: ytInitialData, depth: 0 }];
  const MAX_DEPTH = 20;

  while (stack.length > 0 && results.length < limit) {
    const current = stack.pop();
    if (!current || !current.node || typeof current.node !== 'object') continue;
    const { node, depth } = current;

    if (node.videoRenderer && typeof node.videoRenderer === 'object') {
      const mapped = mapVideoRenderer(node.videoRenderer);
      if (mapped && !seenIds.has(mapped.videoId)) {
        seenIds.add(mapped.videoId);
        results.push(mapped);
        if (results.length >= limit) break;
      }
    }

    if (depth >= MAX_DEPTH) continue;

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (node[i] && typeof node[i] === 'object') {
          stack.push({ node: node[i], depth: depth + 1 });
        }
      }
    } else {
      const keys = Object.keys(node);
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i];
        if (key === 'videoRenderer') continue;
        const val = node[key];
        if (val && typeof val === 'object') {
          stack.push({ node: val, depth: depth + 1 });
        }
      }
    }
  }

  return results;
}

function formatSecondsDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '';
  const sec = Math.floor(totalSeconds);
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function parsePipedSearchResults(
  data: any,
  limit = 12
): YouTubeSearchResultItem[] {
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  const results: YouTubeSearchResultItem[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const rawUrl = String(item.url || item.videoId || '');
    const videoIdMatch =
      rawUrl.match(/(?:v=|\/watch\?v=|\/shorts\/)([\w-]{11})/) ||
      (VIDEO_ID_EXACT_REGEX.test(rawUrl) ? [rawUrl, rawUrl] : null);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    if (!VIDEO_ID_EXACT_REGEX.test(videoId) || seenIds.has(videoId)) continue;

    seenIds.add(videoId);
    const views = Number(item.views || item.viewCount || 0);
    const durationSec = Number(item.duration || item.lengthSeconds || 0);
    results.push({
      videoId,
      title: String(item.title || 'YouTube Video').trim(),
      channelName: String(item.uploaderName || item.author || 'YouTube Channel').trim(),
      duration:
        item.isShort === true
          ? 'SHORT'
          : durationSec > 0
            ? formatSecondsDuration(durationSec)
            : '',
      viewCountText:
        Number.isFinite(views) && views > 0 ? `${views.toLocaleString()} views` : '',
      publishedTime: String(item.uploadedDate || item.publishedText || '').trim(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
    if (results.length >= limit) break;
  }

  return results;
}

function isNativeMobileWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const origin = window.location?.origin || '';
  return (
    origin.startsWith('capacitor://') ||
    origin.startsWith('file://') ||
    origin.startsWith('ionic://') ||
    ((origin.startsWith('http://localhost') || origin.startsWith('https://localhost')) &&
      !origin.includes(':3000'))
  );
}

/**
 * Multi-tier YouTube search that works seamlessly across both the Web Preview and Native Android/iOS APK:
 * 1. Native Android/iOS APK: Uses CapacitorHttp native bridge directly against YouTube InnerTube / Web search (bypasses WebView CORS).
 * 2. Web Browser / Preview: Queries `/api/youtube/search` on the Express server.
 * 3. Universal CORS Fallback: Queries CORS-enabled public Piped video search API (`api.piped.private.coffee`).
 */
export async function searchYouTubeVideosMultiTier(
  rawQuery: string,
  limit = 12,
  signal?: AbortSignal
): Promise<YouTubeSearchResultItem[]> {
  const query = String(rawQuery || '').trim();
  if (query.length < 2) return [];

  const isNative = isNativeMobileWebView();

  // Tier 1: Native APK via CapacitorHttp (zero CORS restrictions, direct to YouTube)
  if (isNative) {
    try {
      const { Capacitor, CapacitorHttp } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform() || isNative) {
        // 1A: Fast YouTube InnerTube v1 JSON search (~200ms)
        try {
          const innerTubeRes = await CapacitorHttp.post({
            url: 'https://www.youtube.com/youtubei/v1/search?prettyPrint=false',
            headers: {
              'Content-Type': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            },
            data: {
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20241114.01.00',
                  hl: 'en',
                  gl: 'US',
                },
              },
              query,
              params: 'EgIQAQ%3D%3D',
            },
            connectTimeout: 7000,
            readTimeout: 7000,
          });
          const payload =
            typeof innerTubeRes.data === 'string'
              ? JSON.parse(innerTubeRes.data)
              : innerTubeRes.data;
          const parsed = parseYouTubeInitialDataVideos(payload, limit);
          if (parsed.length > 0) return parsed;
        } catch {
          // Fall through to HTML or Piped fallback
        }

        // 1B: Native CapacitorHttp GET on YouTube search page
        try {
          const webRes = await CapacitorHttp.get({
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D&hl=en`,
            headers: {
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            },
            connectTimeout: 8000,
            readTimeout: 8000,
          });
          const html = typeof webRes.data === 'string' ? webRes.data : '';
          const initialData = extractYtInitialDataJson(html);
          const parsed = parseYouTubeInitialDataVideos(initialData, limit);
          if (parsed.length > 0) return parsed;
        } catch {
          // Fall through to Piped CORS fallback
        }
      }
    } catch {
      // Fall through to web/CORS tiers
    }
  }

  // Tier 2: Local / Same-Origin Backend `/api/youtube/search` (Primary for Web Preview)
  if (!isNative) {
    try {
      const res = await fetch(
        `/api/youtube/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        { signal }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.results) && data.results.length > 0) {
          return data.results;
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
    }
  }

  // Tier 3: Universal CORS-enabled Piped Video Search API (works in both APK WebView & Web Browser)
  const pipedEndpoints = [
    `https://api.piped.private.coffee/search?q=${encodeURIComponent(query)}&filter=videos`,
  ];

  for (const endpoint of pipedEndpoints) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const onParentAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onParentAbort, { once: true });

    try {
      const res = await fetch(endpoint, {
        signal: ctrl.signal,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const parsed = parsePipedSearchResults(data, limit);
        if (parsed.length > 0) return parsed;
      }
    } catch (err: any) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onParentAbort);
    }
  }

  return [];
}

/**
 * Fetches YouTube video title & channel metadata directly via YouTube's CORS-enabled public oEmbed endpoint,
 * working identically on Android APK and Web without requiring a backend proxy.
 */
export async function fetchYouTubeOEmbedClient(
  videoId: string
): Promise<{ title: string; channelName: string; thumbnailUrl: string } | null> {
  if (!videoId || !VIDEO_ID_EXACT_REGEX.test(videoId)) return null;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.title) {
        return {
          title: String(data.title),
          channelName: String(data.author_name || 'YouTube Channel'),
          thumbnailUrl: String(
            data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
          ),
        };
      }
    }
  } catch {
    // ignore and try fallback
  }

  return null;
}
