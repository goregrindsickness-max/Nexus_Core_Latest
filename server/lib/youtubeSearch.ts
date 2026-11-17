export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelName: string;
  duration: string;
  viewCountText: string;
  publishedTime: string;
  thumbnailUrl: string;
  url: string;
}

const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_MAX_ENTRIES = 200;
const VIDEO_ID_REGEX = /^[\w-]{11}$/;

const youtubeSearchCache = new Map<
  string,
  { results: YouTubeSearchResult[]; expiresAt: number }
>();

export function clearYouTubeSearchCache(): void {
  youtubeSearchCache.clear();
}

function readCachedSearch(cacheKey: string): YouTubeSearchResult[] | null {
  const entry = youtubeSearchCache.get(cacheKey);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    youtubeSearchCache.delete(cacheKey);
    return null;
  }
  return entry.results;
}

function writeCachedSearch(cacheKey: string, results: YouTubeSearchResult[]): void {
  if (youtubeSearchCache.size >= SEARCH_CACHE_MAX_ENTRIES) {
    const oldestKey = youtubeSearchCache.keys().next().value;
    if (oldestKey) youtubeSearchCache.delete(oldestKey);
  }
  youtubeSearchCache.set(cacheKey, {
    results,
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
  });
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
 * Extracts and parses YouTube's embedded `ytInitialData` JSON object using balanced brace scanning
 * so descriptions containing `</script>` or nested braces do not truncate the JSON payload.
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

function mapVideoRenderer(renderer: any): YouTubeSearchResult | null {
  if (!renderer || typeof renderer !== 'object') return null;
  const videoId = typeof renderer.videoId === 'string' ? renderer.videoId.trim() : '';
  if (!VIDEO_ID_REGEX.test(videoId)) return null;

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
      const overlayText = readTextRuns(
        overlay?.thumbnailOverlayTimeStatusRenderer?.text
      );
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
  if (!duration && Array.isArray(renderer.badges)) {
    const isLive = renderer.badges.some(
      (b: any) =>
        b?.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_LIVE_NOW' ||
        String(b?.metadataBadgeRenderer?.label || '').toUpperCase().includes('LIVE')
    );
    if (isLive) duration = 'LIVE';
  }

  const viewCountText =
    readTextRuns(renderer.shortViewCountText) ||
    readTextRuns(renderer.viewCountText) ||
    '';
  const publishedTime = readTextRuns(renderer.publishedTimeText) || '';

  const thumbs = Array.isArray(renderer.thumbnail?.thumbnails)
    ? renderer.thumbnail.thumbnails
    : [];
  const bestThumb =
    thumbs.length > 0 && typeof thumbs[thumbs.length - 1]?.url === 'string'
      ? thumbs[thumbs.length - 1].url
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const normalizedThumb = bestThumb.startsWith('//')
    ? `https:${bestThumb}`
    : bestThumb;

  return {
    videoId,
    title,
    channelName,
    duration,
    viewCountText,
    publishedTime,
    thumbnailUrl: normalizedThumb,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

/**
 * Traverses parsed `ytInitialData` to extract deduplicated `videoRenderer` items in visual order.
 */
export function parseYouTubeInitialDataVideos(
  ytInitialData: any,
  limit = 12
): YouTubeSearchResult[] {
  if (!ytInitialData || typeof ytInitialData !== 'object') return [];

  const results: YouTubeSearchResult[] = [];
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

function formatIsoDuration(iso: string): string {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return '';
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

async function searchViaYouTubeDataApi(
  query: string,
  limit: number,
  apiKey: string
): Promise<YouTubeSearchResult[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
      `&videoEmbeddable=true&maxResults=${limit}&q=${encodeURIComponent(query)}&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(searchUrl, { signal: controller.signal });
    if (!res.ok) return null;

    const data = await res.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const videoIds = items
      .map((item: any) => item?.id?.videoId)
      .filter((id: any) => typeof id === 'string' && VIDEO_ID_REGEX.test(id));

    if (videoIds.length === 0) return [];

    const detailsMap = new Map<string, { duration: string; viewCountText: string }>();
    try {
      const detailsUrl =
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics` +
        `&id=${encodeURIComponent(videoIds.join(','))}&key=${encodeURIComponent(apiKey)}`;
      const detailsRes = await fetch(detailsUrl, { signal: controller.signal });
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json();
        for (const v of detailsData?.items || []) {
          const isoDur = v?.contentDetails?.duration || '';
          const viewsRaw = Number(v?.statistics?.viewCount);
          const viewCountText =
            Number.isFinite(viewsRaw) && viewsRaw > 0
              ? `${viewsRaw.toLocaleString()} views`
              : '';
          detailsMap.set(v.id, {
            duration: formatIsoDuration(isoDur),
            viewCountText,
          });
        }
      }
    } catch {
      // Optional enrichment failure shouldn't break search
    }

    return items
      .map((item: any): YouTubeSearchResult | null => {
        const videoId = item?.id?.videoId;
        if (typeof videoId !== 'string' || !VIDEO_ID_REGEX.test(videoId)) return null;
        const snippet = item.snippet || {};
        const extra = detailsMap.get(videoId);
        const thumb =
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          videoId,
          title: String(snippet.title || 'YouTube Video'),
          channelName: String(snippet.channelTitle || 'YouTube Channel'),
          duration:
            snippet.liveBroadcastContent === 'live' ? 'LIVE' : extra?.duration || '',
          viewCountText: extra?.viewCountText || '',
          publishedTime: snippet.publishedAt
            ? String(snippet.publishedAt).slice(0, 10)
            : '',
          thumbnailUrl: thumb,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter((r: YouTubeSearchResult | null): r is YouTubeSearchResult => r !== null);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchViaYouTubeWeb(
  query: string,
  limit: number
): Promise<YouTubeSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8500);
  try {
    // sp=EgIQAQ%3D%3D filters YouTube search strictly to Video results
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%3D%3D`;
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`YouTube search returned HTTP ${response.status}`);
    }

    const html = await response.text();
    const initialData = extractYtInitialDataJson(html);
    if (!initialData) {
      return [];
    }

    return parseYouTubeInitialDataVideos(initialData, limit);
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchYouTubeVideos(
  rawQuery: string,
  rawLimit = 12
): Promise<{ results: YouTubeSearchResult[]; source: 'api' | 'web' | 'cache' }> {
  const query = String(rawQuery || '').trim().slice(0, 120);
  const limit = Math.max(1, Math.min(20, Number(rawLimit) || 12));
  if (query.length < 2) {
    return { results: [], source: 'web' };
  }

  const cacheKey = `${query.toLowerCase()}::${limit}`;
  const cached = readCachedSearch(cacheKey);
  if (cached) {
    return { results: cached, source: 'cache' };
  }

  const apiKey = (process.env.YOUTUBE_API_KEY || '').trim();
  if (apiKey) {
    const apiResults = await searchViaYouTubeDataApi(query, limit, apiKey);
    if (apiResults && apiResults.length > 0) {
      writeCachedSearch(cacheKey, apiResults);
      return { results: apiResults, source: 'api' };
    }
  }

  const webResults = await searchViaYouTubeWeb(query, limit);
  if (webResults.length > 0) {
    writeCachedSearch(cacheKey, webResults);
  }
  return { results: webResults, source: 'web' };
}
