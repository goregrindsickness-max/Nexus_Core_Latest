import express from 'express';
import path from 'path';
import fs from 'fs';
import { Type } from '@google/genai';
import {
  getSupabaseService,
  getUserOwnedEntityIds,
  assertBandOrEntityOwner,
  hasAnyOwnershipMatch,
} from '../lib/supabaseAdmin';
import {
  getGemini,
  uploadsDir,
  atomicWriteJsonFile,
} from '../lib/clients';
import {
  requireAuth,
} from '../middleware/auth';
import {
  isAllowedBandcampUrl,
  aiLimiter,
  scrapeLimiter,
  apiMutationLimiter,
} from '../middleware/security';

export const bandsRouter = express.Router();

// ============================================================
// BANDCAMP URL RESOLVER
// ============================================================
bandsRouter.post('/api/bandcamp/resolve', requireAuth, scrapeLimiter, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid URL' });
    }

    const cleanUrl = url.trim();

    const iframeSrcMatch = cleanUrl.match(/src=["'](https:\/\/bandcamp\.com\/EmbeddedPlayer\/[^"']+)["']/i);
    const directEmbedMatch = cleanUrl.match(/https:\/\/bandcamp\.com\/EmbeddedPlayer\/[^\s"']+/i);

    if (iframeSrcMatch || directEmbedMatch) {
      const rawEmbed = (iframeSrcMatch ? iframeSrcMatch[1] : directEmbedMatch![0]).replace(/&amp;/g, '&');
      if (!isAllowedBandcampUrl(rawEmbed)) {
        return res.status(400).json({ error: 'Invalid Bandcamp embed URL' });
      }
      const trackIdMatch = rawEmbed.match(/track=(\d+)/i);
      const albumIdMatch = rawEmbed.match(/album=(\d+)/i);
      return res.json({
        success: true,
        embedUrl: rawEmbed,
        trackId: trackIdMatch ? trackIdMatch[1] : null,
        albumId: albumIdMatch ? albumIdMatch[1] : null,
        itemType: trackIdMatch ? 'track' : 'album',
        pageUrl: cleanUrl,
      });
    }

    if (!isAllowedBandcampUrl(cleanUrl)) {
      return res.status(400).json({ error: 'Only valid HTTPS bandcamp.com URLs are permitted' });
    }

    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: `Bandcamp responded with status ${response.status}` });
    }

    const html = await response.text();

    const ogVideoMatch =
      html.match(/<meta[^>]+property=["']og:video["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:video["']/i) ||
      html.match(/<meta[^>]+property=["']twitter:player["'][^>]+content=["']([^"']+)["']/i);

    let embedUrl = ogVideoMatch ? ogVideoMatch[1].replace(/&amp;/g, '&') : null;

    if (!embedUrl) {
      const directEmbedInHtml = html.match(/https:\/\/bandcamp\.com\/EmbeddedPlayer\/[^\s"'<>]+/i);
      if (directEmbedInHtml) {
        embedUrl = directEmbedInHtml[0].replace(/&amp;/g, '&');
      }
    }

    const trackIdMatch =
      html.match(/track_id(?:&quot;|")?\s*:\s*(\d+)/i) ||
      (embedUrl ? embedUrl.match(/track=(\d+)/i) : null) ||
      html.match(/item_id=(\d+)/i);
    const albumIdMatch =
      html.match(/album_id(?:&quot;|")?\s*:\s*(\d+)/i) ||
      (embedUrl ? embedUrl.match(/album=(\d+)/i) : null);

    const trackId = trackIdMatch ? trackIdMatch[1] : null;
    const albumId = albumIdMatch ? albumIdMatch[1] : null;

    if (!embedUrl && (trackId || albumId)) {
      if (trackId) {
        embedUrl = `https://bandcamp.com/EmbeddedPlayer/track=${trackId}/size=large/bgcol=000000/linkcol=06b6d4/tracklist=false/artwork=small/transparent=true/`;
      } else if (albumId) {
        embedUrl = `https://bandcamp.com/EmbeddedPlayer/album=${albumId}/size=large/bgcol=000000/linkcol=06b6d4/tracklist=false/artwork=small/transparent=true/`;
      }
    }

    if (embedUrl) {
      let darkEmbedUrl = embedUrl;
      if (/bgcol=[a-fA-F0-9]+/i.test(darkEmbedUrl)) {
        darkEmbedUrl = darkEmbedUrl.replace(/bgcol=[a-fA-F0-9]+/i, 'bgcol=000000');
      } else {
        darkEmbedUrl = darkEmbedUrl.replace(/\/EmbeddedPlayer\//i, '/EmbeddedPlayer/bgcol=000000/');
      }

      if (/linkcol=[a-fA-F0-9]+/i.test(darkEmbedUrl)) {
        darkEmbedUrl = darkEmbedUrl.replace(/linkcol=[a-fA-F0-9]+/i, 'linkcol=06b6d4');
      } else {
        darkEmbedUrl = darkEmbedUrl.replace(/\/bgcol=000000\//i, '/bgcol=000000/linkcol=06b6d4/');
      }

      if (!darkEmbedUrl.includes('transparent=true')) {
        darkEmbedUrl = darkEmbedUrl.replace(/\/+$/, '') + '/transparent=true/';
      }
      embedUrl = darkEmbedUrl;
    }

    const titleMatch =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    const imageMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const artistMatch =
      html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);

    let title = titleMatch ? titleMatch[1] : '';
    let artist = artistMatch ? artistMatch[1] : '';
    if (title.includes(', by ')) {
      const parts = title.split(', by ');
      title = parts[0];
      if (!artist) artist = parts[1];
    }

    return res.json({
      success: Boolean(embedUrl),
      embedUrl,
      trackId,
      albumId,
      title,
      artist,
      artwork: imageMatch ? imageMatch[1] : null,
      itemType: trackId ? 'track' : albumId ? 'album' : 'unknown',
      pageUrl: cleanUrl,
    });
  } catch (err: any) {
    console.error('[BANDCAMP RESOLVE ERROR]', err);
    return res.status(500).json({ error: err.message || 'Failed to resolve Bandcamp URL' });
  }
});

// ============================================================
// SCENE RADIO PLAYLIST & OEMBED APIS
// ============================================================
interface PlaylistTrack {
  videoId: string;
  title: string;
  author: string;
  thumbnailUrl: string;
}

const playlistMemoryCache = new Map<string, PlaylistTrack[]>();
const GLOBAL_PLAYLIST_STORAGE_FILE = path.join(
  process.cwd(),
  'data',
  'scene_radio_global_playlists.json'
);

function readGlobalPlaylistFile(): Record<string, PlaylistTrack[]> {
  try {
    if (fs.existsSync(GLOBAL_PLAYLIST_STORAGE_FILE)) {
      const content = fs.readFileSync(GLOBAL_PLAYLIST_STORAGE_FILE, 'utf-8');
      return JSON.parse(content) || {};
    }
  } catch (e) {
    console.warn('[SERVER RADIO] Could not read global playlist file:', e);
  }
  return {};
}

function writeGlobalPlaylistFile(dataMap: Record<string, PlaylistTrack[]>) {
  try {
    const parentDir = path.dirname(GLOBAL_PLAYLIST_STORAGE_FILE);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(GLOBAL_PLAYLIST_STORAGE_FILE, JSON.stringify(dataMap, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[SERVER RADIO] Could not write global playlist file:', e);
  }
}

async function getPlaylistCache(playlistId: string): Promise<PlaylistTrack[]> {
  if (playlistMemoryCache.has(playlistId)) {
    return playlistMemoryCache.get(playlistId) || [];
  }

  const fileData = readGlobalPlaylistFile();
  if (fileData[playlistId] && Array.isArray(fileData[playlistId]) && fileData[playlistId].length > 0) {
    playlistMemoryCache.set(playlistId, fileData[playlistId]);
    return fileData[playlistId];
  }

  const supabase = getSupabaseService();
  if (supabase) {
    try {
      const dbKey = `playlist_cache_${playlistId}`;
      const { data } = await supabase
        .from('nexus_notifications')
        .select('data')
        .eq('id', dbKey)
        .maybeSingle();

      if (data && Array.isArray(data.data) && data.data.length > 0) {
        playlistMemoryCache.set(playlistId, data.data);
        fileData[playlistId] = data.data;
        writeGlobalPlaylistFile(fileData);
        return data.data;
      }
    } catch (err: any) {
      console.warn(`[SERVER RADIO WARNING] Failed to read playlist cache from DB:`, err.message);
    }
  }

  return [];
}

async function savePlaylistCache(playlistId: string, tracks: PlaylistTrack[]): Promise<void> {
  playlistMemoryCache.set(playlistId, tracks);

  const fileData = readGlobalPlaylistFile();
  fileData[playlistId] = tracks;
  writeGlobalPlaylistFile(fileData);

  const supabase = getSupabaseService();
  if (supabase) {
    try {
      const dbKey = `playlist_cache_${playlistId}`;
      await supabase.from('nexus_notifications').upsert({
        id: dbKey,
        data: tracks,
        created_at: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn(`[SERVER RADIO WARNING] Failed to persist playlist cache to DB:`, err.message);
    }
  }
}

bandsRouter.get('/api/playlist/:playlistId', async (req, res) => {
  try {
    const { playlistId } = req.params;
    const isSyncMode = req.query.sync === 'true';

    let existingTracks = await getPlaylistCache(playlistId);

    if (!isSyncMode && existingTracks.length > 0) {
      return res.json({ playlistId, tracks: existingTracks, cached: true });
    }

    const newTracks: PlaylistTrack[] = [];

    const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
    const rssPromise = fetch(rssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })
      .then(async (response) => {
        if (response.ok) {
          const xmlText = await response.text();
          const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
          let match;
          while ((match = entryRegex.exec(xmlText)) !== null) {
            const entryContent = match[1];
            const videoIdMatch = entryContent.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
            const titleMatch = entryContent.match(/<title>(.*?)<\/title>/);
            const authorMatch = entryContent.match(
              /<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/
            );

            if (videoIdMatch && videoIdMatch[1]) {
              const videoId = videoIdMatch[1];
              let title = titleMatch ? titleMatch[1] : 'Unknown Track';
              title = title
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");

              let author = authorMatch ? authorMatch[1] : 'Scene Artist';
              author = author
                .replace(/&amp;/g, '&')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");

              newTracks.push({
                videoId,
                title,
                author,
                thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              });
            }
          }
        }
      })
      .catch((err) => console.warn('[SERVER RADIO] RSS fetch failed:', err));

    const webUrl = `https://www.youtube.com/playlist?list=${encodeURIComponent(playlistId)}`;
    const webPromise = fetch(webUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
      .then(async (response) => {
        if (response.ok) {
          const html = await response.text();
          const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/);
          if (match && match[1]) {
            const data = JSON.parse(match[1]);
            const contents =
              data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content
                ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]
                ?.playlistVideoListRenderer?.contents;

            if (Array.isArray(contents)) {
              for (const item of contents) {
                const video = item.playlistVideoRenderer;
                if (video && video.videoId) {
                  const vId = video.videoId;
                  const title =
                    video.title?.runs?.[0]?.text ||
                    video.title?.simpleText ||
                    'Unknown Track';
                  const author = video.shortBylineText?.runs?.[0]?.text || 'Scene Artist';

                  if (!newTracks.some((t) => t.videoId === vId)) {
                    newTracks.push({
                      videoId: vId,
                      title,
                      author,
                      thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                    });
                  }
                }
              }
            }

            const contItem = Array.isArray(contents)
              ? contents.find((c: any) => c.continuationItemRenderer)
              : null;
            let currentToken =
              contItem?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
            const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);

            if (currentToken && apiKeyMatch && apiKeyMatch[1]) {
              const apiKey = apiKeyMatch[1];
              let pageCount = 0;

              while (currentToken && pageCount < 3) {
                pageCount++;
                try {
                  const browseRes = await fetch(
                    `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'User-Agent':
                          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                      },
                      body: JSON.stringify({
                        context: {
                          client: {
                            clientName: 'WEB',
                            clientVersion: '2.20240101.00.00',
                          },
                        },
                        continuation: currentToken,
                      }),
                    }
                  );

                  if (!browseRes.ok) break;
                  const browseData = await browseRes.json();

                  const actions = browseData?.onResponseReceivedActions;
                  let nextToken = null;

                  if (Array.isArray(actions)) {
                    for (const action of actions) {
                      const items = action?.appendContinuationItemsAction?.continuationItems;
                      if (Array.isArray(items)) {
                        for (const item of items) {
                          const video = item.playlistVideoRenderer;
                          if (video && video.videoId) {
                            const vId = video.videoId;
                            const title =
                              video.title?.runs?.[0]?.text ||
                              video.title?.simpleText ||
                              'Unknown Track';
                            const author =
                              video.shortBylineText?.runs?.[0]?.text || 'Scene Artist';

                            if (!newTracks.some((t) => t.videoId === vId)) {
                              newTracks.push({
                                videoId: vId,
                                title,
                                author,
                                thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                              });
                            }
                          } else if (item.continuationItemRenderer) {
                            nextToken =
                              item.continuationItemRenderer?.continuationEndpoint
                                ?.continuationCommand?.token;
                          }
                        }
                      }
                    }
                  }
                  currentToken = nextToken;
                } catch (contErr) {
                  console.warn(`[SERVER RADIO] Continuation page ${pageCount} failed:`, contErr);
                  break;
                }
              }
            }
          }
        }
      })
      .catch((err) => console.warn('[SERVER RADIO] Web scrape failed:', err));

    await Promise.all([rssPromise, webPromise]);

    let updated = false;
    for (const track of newTracks) {
      const existingIdx = existingTracks.findIndex((t) => t.videoId === track.videoId);
      if (existingIdx === -1) {
        existingTracks.push(track);
        updated = true;
      } else {
        const curr = existingTracks[existingIdx];
        const isGeneric =
          !curr.title ||
          curr.title.startsWith('Track ') ||
          curr.title === 'Unknown Track' ||
          curr.title === 'Loading Track...';
        if (isGeneric && track.title && !track.title.startsWith('Track ')) {
          existingTracks[existingIdx] = track;
          updated = true;
        }
      }
    }

    if (updated) {
      await savePlaylistCache(playlistId, existingTracks);
    }

    res.json({ playlistId, tracks: existingTracks });
  } catch (error) {
    console.error('Error fetching YouTube playlist:', error);
    res.status(500).json({ error: 'Internal server error while fetching playlist' });
  }
});

bandsRouter.post('/api/playlist/:playlistId/tracks', requireAuth, apiMutationLimiter, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { videoId, title, author, thumbnailUrl } = req.body;

    if (!videoId || !title) {
      return res.status(400).json({ error: 'Missing videoId or title' });
    }

    const existingTracks = await getPlaylistCache(playlistId);
    const existingIndex = existingTracks.findIndex((t) => t.videoId === videoId);

    if (existingIndex === -1) {
      existingTracks.push({
        videoId,
        title,
        author: author || 'Scene Artist',
        thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
      await savePlaylistCache(playlistId, existingTracks);
    } else {
      const current = existingTracks[existingIndex];
      if (
        !current.title ||
        current.title.startsWith('Track ') ||
        current.title === 'Loading Track...' ||
        current.title === 'Unknown Track'
      ) {
        existingTracks[existingIndex] = {
          videoId,
          title,
          author: author || current.author || 'Scene Artist',
          thumbnailUrl:
            thumbnailUrl ||
            current.thumbnailUrl ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        };
        await savePlaylistCache(playlistId, existingTracks);
      }
    }

    res.json({ success: true, totalCached: existingTracks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cache track' });
  }
});

bandsRouter.post('/api/playlist/:playlistId/enrich', requireAuth, scrapeLimiter, async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { videoIds } = req.body;

    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid videoIds array' });
    }

    let existingTracks = await getPlaylistCache(playlistId);
    const existingMap = new Map<string, PlaylistTrack>();
    existingTracks.forEach((t) => existingMap.set(t.videoId, t));

    const idsToFetch = videoIds.filter((id) => {
      const cached = existingMap.get(id);
      if (!cached) return true;
      if (
        !cached.title ||
        cached.title.startsWith('Track ') ||
        cached.title === 'Loading Track...' ||
        cached.title === 'Unknown Track'
      ) {
        return true;
      }
      return false;
    });

    const BATCH_SIZE = 10;
    let newlyEnrichedCount = 0;

    for (let i = 0; i < idsToFetch.length; i += BATCH_SIZE) {
      const batch = idsToFetch.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (vId) => {
          try {
            const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(vId)}&format=json`;
            const response = await fetch(oembedUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0' },
            });
            if (response.ok) {
              const data = await response.json();
              if (data && data.title) {
                existingMap.set(vId, {
                  videoId: vId,
                  title: data.title,
                  author: data.author_name || 'Scene Artist',
                  thumbnailUrl:
                    data.thumbnail_url || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                });
                newlyEnrichedCount++;
              }
            }
          } catch (_) {}
        })
      );
    }

    const updatedList = Array.from(existingMap.values());
    if (newlyEnrichedCount > 0) {
      await savePlaylistCache(playlistId, updatedList);
    }

    res.json({
      playlistId,
      newlyEnrichedCount,
      totalCached: updatedList.length,
      tracks: updatedList,
    });
  } catch (error) {
    console.error('[SERVER RADIO] Error in batch enrich:', error);
    res.status(500).json({ error: 'Failed to batch enrich tracks' });
  }
});

bandsRouter.get('/api/oembed', async (req, res) => {
  try {
    const videoId = req.query.videoId as string;
    if (!videoId) {
      return res.status(400).json({ error: 'Missing videoId query parameter' });
    }
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: 'Failed to fetch oEmbed from YouTube' });
    }
    const data = await response.json();
    res.json({
      videoId,
      title: data.title || 'Unknown Track',
      author: data.author_name || 'Scene Artist',
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    });
  } catch (error) {
    console.error('Error fetching YouTube oEmbed:', error);
    res.status(500).json({ error: 'Internal server error while fetching oEmbed' });
  }
});

// ============================================================
// AI BAND ENRICHMENT & DISCOGRAPHY SCRAPING
// ============================================================
bandsRouter.post('/api/enrich-band', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { bandName, genre, city } = req.body;
    if (!bandName) {
      return res.status(400).json({ error: 'Band name is required' });
    }

    const ai = await getGemini();
    if (!ai) {
      return res.status(500).json({ error: 'Gemini API is not configured on the server.' });
    }

    const prompt = `Search the web for the musical artist or band named "${bandName}" ${city ? `from ${city}` : ''} ${genre ? `(Genre: ${genre})` : ''}. 
    Find their official biography, their current or most well-known band members and their roles/instruments, their discography (albums, EPs, singles with release years), and any official social media or streaming links (Spotify, Instagram, Bandcamp, YouTube, Website).
    Return the information strictly matching the requested JSON schema. If you cannot find specific details (like exact members for an obscure local band), provide as much accurate real-world data as exists, or leave arrays empty if completely unknown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bio: {
              type: Type.STRING,
              description: 'A compelling 2-3 sentence biography of the band.',
            },
            formedYear: { type: Type.STRING, description: 'Year the band was formed, if known.' },
            hometown: {
              type: Type.STRING,
              description: 'City and State/Country where the band is based.',
            },
            genres: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of subgenres.',
            },
            members: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  role: {
                    type: Type.STRING,
                    description: 'e.g., Vocals, Lead Guitar, Drums, Bass',
                  },
                },
                required: ['name', 'role'],
              },
            },
            discography: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  year: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'Album, EP, Single, Demo, Split' },
                  label: {
                    type: Type.STRING,
                    description: 'Record label or Independent',
                  },
                },
                required: ['title', 'year', 'type'],
              },
            },
            socials: {
              type: Type.OBJECT,
              properties: {
                instagram: { type: Type.STRING },
                spotify: { type: Type.STRING },
                bandcamp: { type: Type.STRING },
                youtube: { type: Type.STRING },
                website: { type: Type.STRING },
              },
            },
          },
          required: ['bio', 'members', 'discography'],
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Empty response from Gemini');
    }

    const enrichedData = JSON.parse(resultText);
    res.json({ success: true, data: enrichedData });
  } catch (error: any) {
    console.error('[ENRICH BAND ERROR]:', error);
    res.status(500).json({ error: error.message || 'Failed to enrich band profile' });
  }
});

bandsRouter.post(
  ['/api/scrape/metal-archives', '/api/scrape/discography'],
  requireAuth,
  scrapeLimiter,
  async (req: express.Request, res: express.Response) => {
    const startTime = Date.now();
    try {
      const { bandName, country, genre, source = 'auto' } = req.body;
      if (!bandName || typeof bandName !== 'string') {
        return res.status(400).json({ error: 'Band name is required.' });
      }

      const cleanBandName = bandName.trim();
      console.log(
        `[DISCOGRAPHY SCRAPER] Initiating fast lookup for "${cleanBandName}" (source: ${source})...`
      );

      let releases: any[] = [];
      let matchedBand: any = null;
      let providerUsed = 'none';

      const browserHeaders = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.metal-archives.com/',
        'X-Requested-With': 'XMLHttpRequest',
      };

      const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 4500) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(timer);
          return response;
        } catch (err) {
          clearTimeout(timer);
          throw err;
        }
      };

      const fetchCoverArtWithTimeout = async (mbid: string, timeoutMs = 2200): Promise<string> => {
        try {
          const caaRes = await fetchWithTimeout(
            `https://coverartarchive.org/release-group/${mbid}`,
            { headers: { Accept: 'application/json' } },
            timeoutMs
          );
          if (caaRes.ok) {
            const caaData = await caaRes.json();
            const frontImg =
              caaData?.images?.find((img: any) => img.front) || caaData?.images?.[0];
            if (frontImg) {
              const rawUrl =
                frontImg.thumbnails?.['500'] ||
                frontImg.thumbnails?.large ||
                frontImg.thumbnails?.small ||
                frontImg.image ||
                '';
              return rawUrl.replace(/^http:\/\//i, 'https://');
            }
          }
        } catch (_) {}
        return '';
      };

      const fetchReleaseTracklist = async (
        releaseGroupMbid: string,
        timeoutMs = 3200
      ): Promise<{ tracks: string[]; label: string }> => {
        try {
          const rgRes = await fetchWithTimeout(
            `https://musicbrainz.org/ws/2/release?release-group=${releaseGroupMbid}&inc=recordings+labels&fmt=json&limit=5`,
            {
              headers: {
                'User-Agent': 'NexusCoreMusicOS/2.0 ( https://thenexuscoreapp.com )',
                Accept: 'application/json',
              },
            },
            timeoutMs
          );
          if (!rgRes.ok) return { tracks: [], label: '' };
          const rgData = await rgRes.json();
          const relList: any[] = rgData?.releases || [];
          if (relList.length === 0) return { tracks: [], label: '' };

          const bestRelease =
            relList.find((r) => r.media?.[0]?.tracks?.length > 0) || relList[0];
          const rawTracks: any[] = [];
          for (const medium of bestRelease.media || []) {
            if (Array.isArray(medium.tracks)) {
              rawTracks.push(...medium.tracks);
            }
          }
          const formattedTracks = rawTracks
            .map((t: any, idx: number) => {
              const title = t.title || t.recording?.title || `Track ${idx + 1}`;
              const lengthMs = t.length || t.recording?.length;
              if (lengthMs && typeof lengthMs === 'number') {
                const totalSec = Math.floor(lengthMs / 1000);
                const mins = Math.floor(totalSec / 60);
                const secs = String(totalSec % 60).padStart(2, '0');
                return `${title} (${mins}:${secs})`;
              }
              return title;
            })
            .filter(Boolean);

          const labelName = bestRelease['label-info']?.[0]?.label?.name || '';
          return { tracks: formattedTracks, label: labelName };
        } catch (_) {
          return { tracks: [], label: '' };
        }
      };

      const fetchItunesLookup = async (
        artistQuery: string,
        albumQuery?: string,
        timeoutMs = 2500
      ): Promise<{ coverUrl: string; tracks: string[] }> => {
        try {
          const q = encodeURIComponent(
            albumQuery ? `${artistQuery} ${albumQuery}` : artistQuery
          );
          const itunesRes = await fetchWithTimeout(
            `https://itunes.apple.com/search?term=${q}&entity=album&limit=5`,
            { headers: { Accept: 'application/json' } },
            timeoutMs
          );
          if (!itunesRes.ok) return { coverUrl: '', tracks: [] };
          const itunesData = await itunesRes.json();
          const results: any[] = itunesData?.results || [];
          if (results.length === 0) return { coverUrl: '', tracks: [] };

          const normArtist = artistQuery.toLowerCase();
          const normAlbum = (albumQuery || '').toLowerCase();
          const matchedAlbum =
            results.find(
              (r) =>
                r.artistName?.toLowerCase().includes(normArtist) &&
                (!normAlbum || r.collectionName?.toLowerCase().includes(normAlbum))
            ) || results[0];

          const hiResArtwork = matchedAlbum.artworkUrl100
            ? matchedAlbum.artworkUrl100.replace('100x100bb', '600x600bb')
            : '';

          let tracks: string[] = [];
          if (matchedAlbum.collectionId) {
            try {
              const lookupRes = await fetchWithTimeout(
                `https://itunes.apple.com/lookup?id=${matchedAlbum.collectionId}&entity=song`,
                { headers: { Accept: 'application/json' } },
                2200
              );
              if (lookupRes.ok) {
                const lookupData = await lookupRes.json();
                const songItems = (lookupData?.results || []).filter(
                  (item: any) => item.wrapperType === 'track'
                );
                tracks = songItems
                  .map((s: any) => {
                    const tName = s.trackName;
                    const durMs = s.trackTimeMillis;
                    if (durMs && typeof durMs === 'number') {
                      const totalSec = Math.floor(durMs / 1000);
                      const mins = Math.floor(totalSec / 60);
                      const secs = String(totalSec % 60).padStart(2, '0');
                      return `${tName} (${mins}:${secs})`;
                    }
                    return tName;
                  })
                  .filter(Boolean);
              }
            } catch (_) {}
          }

          return { coverUrl: hiResArtwork, tracks };
        } catch (_) {
          return { coverUrl: '', tracks: [] };
        }
      };

      const fetchBandcampArtistAlbums = async (artistQuery: string): Promise<any[]> => {
        try {
          const slug = artistQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!slug) return [];
          const bcUrl = `https://${slug}.bandcamp.com/music`;
          const bcRes = await fetchWithTimeout(
            bcUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                Accept: 'text/html',
              },
            },
            3200
          );
          if (!bcRes.ok) return [];
          const html = await bcRes.text();

          const foundAlbums: any[] = [];
          const gridRegex =
            /<li[^>]*class="[^"]*music-grid-item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
          let match: RegExpExecArray | null;
          while ((match = gridRegex.exec(html)) !== null) {
            const block = match[1];
            const hrefMatch = block.match(/href="(\/(?:album|track)\/[^"]+)"/i);
            const titleMatch = block.match(
              /<p[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/p>/i
            );
            const imgMatch =
              block.match(/data-original="([^"]+)"/i) ||
              block.match(/<img[^>]+src="([^"]+)"/i);
            if (titleMatch) {
              const rawTitle = titleMatch[1]
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              const itemUrl = hrefMatch ? `https://${slug}.bandcamp.com${hrefMatch[1]}` : bcUrl;
              const imgUrl = imgMatch ? imgMatch[1].replace(/_\d+\.jpg$/i, '_16.jpg') : '';
              const isTrack = hrefMatch ? hrefMatch[1].startsWith('/track/') : false;
              foundAlbums.push({
                title: rawTitle,
                year: new Date().getFullYear().toString(),
                type: isTrack ? 'Single' : 'Album',
                label: 'Bandcamp Official',
                cover_url: imgUrl,
                bandcamp_url: itemUrl,
                tracks: [],
              });
            }
          }

          if (foundAlbums.length === 0) {
            const ogTitle = html.match(
              /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
            )?.[1];
            const ogImage = html.match(
              /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i
            )?.[1];
            if (ogTitle && !ogTitle.toLowerCase().includes('bandcamp')) {
              const cleanTitle = ogTitle.split(', by ')[0].trim();
              foundAlbums.push({
                title: cleanTitle,
                year: new Date().getFullYear().toString(),
                type: 'Album',
                label: 'Bandcamp Official',
                cover_url: ogImage || '',
                bandcamp_url: `https://${slug}.bandcamp.com`,
                tracks: [],
              });
            }
          }

          return foundAlbums.slice(0, 15);
        } catch (_) {
          return [];
        }
      };

      if (source === 'auto' || source === 'metal-archives') {
        try {
          const searchUrl = `https://www.metal-archives.com/search/ajax-band-search/?field=name&query=${encodeURIComponent(cleanBandName)}&sEcho=1&iDisplayStart=0&iDisplayLength=10`;
          const searchRes = await fetchWithTimeout(
            searchUrl,
            { headers: browserHeaders },
            3500
          );

          if (searchRes.ok) {
            const contentType = searchRes.headers.get('content-type') || '';
            if (contentType.includes('application/json') || contentType.includes('text/plain')) {
              const searchJson = await searchRes.json();
              const aaData: any[] = searchJson?.aaData || [];

              if (aaData.length > 0) {
                const parsedCandidates = aaData
                  .map((row: string[]) => {
                    const linkHtml = row[0] || '';
                    const genreText = row[1] || '';
                    const countryText = row[2] || '';
                    const hrefMatch = linkHtml.match(
                      /href=["']https?:\/\/www\.metal-archives\.com\/bands\/([^/"']+)\/(\d+)["']/i
                    );
                    const nameMatch = linkHtml.match(/<a[^>]*>(.*?)<\/a>/i);
                    return {
                      slug: hrefMatch ? hrefMatch[1] : '',
                      id: hrefMatch ? hrefMatch[2] : '',
                      name: nameMatch
                        ? nameMatch[1].replace(/<[^>]+>/g, '').trim()
                        : cleanBandName,
                      genre: genreText.replace(/<[^>]+>/g, '').trim(),
                      country: countryText.replace(/<[^>]+>/g, '').trim(),
                    };
                  })
                  .filter((c) => c.id);

                if (parsedCandidates.length > 0) {
                  const normalizedTarget = cleanBandName.toLowerCase();
                  matchedBand =
                    parsedCandidates.find((c) => {
                      const exactName = c.name.toLowerCase() === normalizedTarget;
                      const countryMatch =
                        country && c.country.toLowerCase().includes(country.toLowerCase());
                      return exactName && countryMatch;
                    }) ||
                    parsedCandidates.find((c) => c.name.toLowerCase() === normalizedTarget) ||
                    parsedCandidates[0];

                  const discogUrl = `https://www.metal-archives.com/band/discography/id/${matchedBand.id}/tab/all`;
                  const discogRes = await fetchWithTimeout(
                    discogUrl,
                    {
                      headers: {
                        ...browserHeaders,
                        Accept: 'text/html, */*; q=0.01',
                      },
                    },
                    3500
                  );

                  if (discogRes.ok) {
                    const discogHtml = await discogRes.text();
                    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
                    let rowMatch: RegExpExecArray | null;

                    while ((rowMatch = rowRegex.exec(discogHtml)) !== null) {
                      const trContent = rowMatch[1];
                      if (trContent.includes('<th')) continue;

                      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
                      const cells: string[] = [];
                      let tdMatch: RegExpExecArray | null;
                      while ((tdMatch = tdRegex.exec(trContent)) !== null) {
                        cells.push(tdMatch[1]);
                      }

                      if (cells.length >= 3) {
                        const albumCell = cells[0];
                        const typeCell = cells[1];
                        const yearCell = cells[2];

                        const albumUrlMatch = albumCell.match(
                          /href=["'](https?:\/\/www\.metal-archives\.com\/albums\/[^"']+\/(\d+))["']/i
                        );
                        const rawTitle = albumCell
                          .replace(/<[^>]+>/g, '')
                          .replace(/\s+/g, ' ')
                          .trim();
                        const rawType = typeCell
                          .replace(/<[^>]+>/g, '')
                          .replace(/\s+/g, ' ')
                          .trim();
                        const rawYear = yearCell
                          .replace(/<[^>]+>/g, '')
                          .replace(/\s+/g, ' ')
                          .trim();

                        if (rawTitle) {
                          let mappedType = 'Album';
                          const lowerType = rawType.toLowerCase();
                          if (lowerType.includes('ep')) mappedType = 'EP';
                          else if (lowerType.includes('single')) mappedType = 'Single';
                          else if (lowerType.includes('demo')) mappedType = 'Demo';
                          else if (lowerType.includes('split')) mappedType = 'Split';
                          else if (lowerType.includes('live')) mappedType = 'Live Album';
                          else if (lowerType.includes('compilation')) mappedType = 'Compilation';

                          releases.push({
                            title: rawTitle,
                            type: mappedType,
                            originalType: rawType,
                            year: rawYear || 'Unknown',
                            albumUrl: albumUrlMatch ? albumUrlMatch[1] : '',
                            albumId: albumUrlMatch ? albumUrlMatch[2] : '',
                            label: 'Encyclopaedia Metallum',
                            cover_url: '',
                            tracks: [],
                          });
                        }
                      }
                    }

                    if (releases.length > 0) {
                      providerUsed = 'metal-archives';
                      const topMaReleases = releases.slice(0, 8);
                      await Promise.allSettled(
                        topMaReleases.map(async (rel) => {
                          const itunesInfo = await fetchItunesLookup(cleanBandName, rel.title, 2200);
                          if (itunesInfo.coverUrl) rel.cover_url = itunesInfo.coverUrl;
                          if (itunesInfo.tracks.length > 0) rel.tracks = itunesInfo.tracks;
                        })
                      );
                    }
                  }
                }
              }
            }
          }
        } catch (maErr: any) {
          console.warn(
            `[DISCOGRAPHY SCRAPER] Metal Archives blocked or timed out (${maErr.message}). Falling back to MusicBrainz...`
          );
        }
      }

      if (releases.length === 0) {
        try {
          console.log(
            `[DISCOGRAPHY SCRAPER] Querying MusicBrainz API for "${cleanBandName}"...`
          );
          const mbHeaders = {
            'User-Agent': 'NexusCoreMusicOS/2.0 ( https://thenexuscoreapp.com )',
            Accept: 'application/json',
          };

          const artistSearchUrl = `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(`"${cleanBandName}"`)}&fmt=json&limit=10`;
          const mbSearchRes = await fetchWithTimeout(artistSearchUrl, { headers: mbHeaders }, 4500);

          if (mbSearchRes.ok) {
            const mbData = await mbSearchRes.json();
            const artists: any[] = mbData?.artists || [];

            if (artists.length > 0) {
              const normName = cleanBandName.toLowerCase();
              const bestArtist =
                artists.find((a) => {
                  const exact = (a.name || '').toLowerCase() === normName;
                  const countryMatch =
                    country &&
                    ((a.country || '').toLowerCase() === country.toLowerCase() ||
                      (a.area?.name || '').toLowerCase().includes(country.toLowerCase()));
                  return exact && countryMatch;
                }) ||
                artists.find((a) => (a.name || '').toLowerCase() === normName) ||
                artists[0];

              matchedBand = {
                id: bestArtist.id,
                name: bestArtist.name,
                genre:
                  bestArtist.tags
                    ?.slice(0, 3)
                    .map((t: any) => t.name)
                    .join(', ') ||
                  genre ||
                  'Heavy Music',
                country: bestArtist.area?.name || bestArtist.country || country || 'Unknown',
              };

              const rgUrl = `https://musicbrainz.org/ws/2/release-group?artist=${bestArtist.id}&fmt=json&limit=100`;
              const rgRes = await fetchWithTimeout(rgUrl, { headers: mbHeaders }, 5000);

              if (rgRes.ok) {
                const rgData = await rgRes.json();
                const releaseGroups: any[] = rgData?.['release-groups'] || [];

                const sortedGroups = releaseGroups.sort((a, b) => {
                  const yearA = parseInt(
                    (a['first-release-date'] || '9999').substring(0, 4),
                    10
                  );
                  const yearB = parseInt(
                    (b['first-release-date'] || '9999').substring(0, 4),
                    10
                  );
                  return yearA - yearB;
                });

                const topGroups = sortedGroups.slice(0, 25);

                const enrichedReleases = await Promise.all(
                  topGroups.map(async (rg, index) => {
                    const primaryType = rg['primary-type'] || 'Album';
                    const secondaryTypes: string[] = rg['secondary-types'] || [];
                    let mappedType = 'Album';

                    if (secondaryTypes.includes('Live')) mappedType = 'Live Album';
                    else if (secondaryTypes.includes('Compilation')) mappedType = 'Compilation';
                    else if (secondaryTypes.includes('Demo')) mappedType = 'Demo';
                    else if (primaryType === 'EP') mappedType = 'EP';
                    else if (primaryType === 'Single') mappedType = 'Single';

                    const releaseYear = rg['first-release-date']
                      ? rg['first-release-date'].substring(0, 4)
                      : 'Unknown';

                    const shouldEnrichDeeply = index < 10;
                    const [coverUrl, detailInfo] = shouldEnrichDeeply
                      ? await Promise.all([
                          fetchCoverArtWithTimeout(rg.id, 2200),
                          fetchReleaseTracklist(rg.id, 3000),
                        ])
                      : ['', { tracks: [], label: '' }];

                    let finalCover = coverUrl;
                    let finalTracks = detailInfo.tracks;

                    if (shouldEnrichDeeply && (!finalCover || finalTracks.length === 0)) {
                      const itunesFallback = await fetchItunesLookup(cleanBandName, rg.title, 2000);
                      if (!finalCover && itunesFallback.coverUrl)
                        finalCover = itunesFallback.coverUrl;
                      if (finalTracks.length === 0 && itunesFallback.tracks.length > 0)
                        finalTracks = itunesFallback.tracks;
                    }

                    return {
                      title: rg.title,
                      type: mappedType,
                      originalType: secondaryTypes.length > 0 ? secondaryTypes[0] : primaryType,
                      year: releaseYear,
                      albumUrl: `https://musicbrainz.org/release-group/${rg.id}`,
                      albumId: rg.id,
                      label: detailInfo.label || 'MusicBrainz Verified',
                      cover_url: finalCover,
                      tracks: finalTracks,
                    };
                  })
                );

                if (enrichedReleases.length > 0) {
                  releases = enrichedReleases;
                  providerUsed = 'musicbrainz';
                }
              }
            }
          }
        } catch (mbErr: any) {
          console.warn(
            `[DISCOGRAPHY SCRAPER] MusicBrainz lookup warning: ${mbErr.message}`
          );
        }
      }

      if (releases.length < 3) {
        try {
          const bcAlbums = await fetchBandcampArtistAlbums(cleanBandName);
          if (bcAlbums.length > 0) {
            const existingTitles = new Set(
              releases.map((r) => (r.title || '').toLowerCase().trim())
            );
            for (const bcRel of bcAlbums) {
              const norm = (bcRel.title || '').toLowerCase().trim();
              if (norm && !existingTitles.has(norm)) {
                releases.push(bcRel);
                existingTitles.add(norm);
              }
            }
            if (providerUsed === 'none') {
              providerUsed = 'bandcamp';
              matchedBand = {
                name: cleanBandName,
                genre: genre || 'Independent / Underground',
                country: country || 'Unknown',
              };
            }
          }
        } catch (_) {}
      }

      if (releases.length === 0) {
        const ai = await getGemini();
        if (ai) {
          try {
            console.log(
              `[DISCOGRAPHY SCRAPER] Falling back to Gemini Search Grounding for "${cleanBandName}"...`
            );
            const aiRes = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: `Find the official discography (albums, EPs, demos, singles) for the musical artist or metal/rock/punk band "${cleanBandName}" ${country ? `from ${country}` : ''} ${genre ? `(${genre})` : ''}. Search Metal Archives, Bandcamp, Spotify, and Discogs. Return a JSON object with a "releases" array containing objects with "title", "year", "type" (Album, EP, Single, Demo, Split), "label", and "tracks" (array of track titles if known).`,
              config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    bandName: { type: Type.STRING },
                    country: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    releases: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          year: { type: Type.STRING },
                          type: { type: Type.STRING },
                          label: { type: Type.STRING },
                          tracks: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                        },
                        required: ['title', 'year', 'type'],
                      },
                    },
                  },
                  required: ['releases'],
                },
              },
            });

            if (aiRes.text) {
              const parsed = JSON.parse(aiRes.text);
              if (Array.isArray(parsed.releases) && parsed.releases.length > 0) {
                releases = await Promise.all(
                  parsed.releases.map(async (r: any, idx: number) => {
                    let coverUrl = '';
                    let tracks: string[] = Array.isArray(r.tracks) ? r.tracks : [];
                    if (idx < 6) {
                      const itunesInfo = await fetchItunesLookup(cleanBandName, r.title, 2000);
                      coverUrl = itunesInfo.coverUrl;
                      if (tracks.length === 0 && itunesInfo.tracks.length > 0) {
                        tracks = itunesInfo.tracks;
                      }
                    }
                    return {
                      title: r.title,
                      type: r.type || 'Album',
                      originalType: r.type || 'Album',
                      year: r.year || 'Unknown',
                      label: r.label || 'Independent',
                      cover_url: coverUrl,
                      tracks,
                    };
                  })
                );
                matchedBand = {
                  name: parsed.bandName || cleanBandName,
                  country: parsed.country || country || 'Unknown',
                  genre: parsed.genre || genre || 'Metal',
                };
                providerUsed = 'gemini-search';
              }
            }
          } catch (aiErr: any) {
            console.warn(
              `[DISCOGRAPHY SCRAPER] Gemini fallback warning: ${aiErr.message}`
            );
          }
        }
      }

      const elapsedMs = Date.now() - startTime;
      console.log(
        `[DISCOGRAPHY SCRAPER] Completed for "${cleanBandName}" via [${providerUsed}] in ${elapsedMs}ms (${releases.length} releases found).`
      );

      return res.json({
        success: releases.length > 0,
        found: releases.length > 0,
        provider: providerUsed,
        elapsedMs,
        band: matchedBand || {
          name: cleanBandName,
          genre: genre || '',
          country: country || '',
        },
        releases,
      });
    } catch (error: any) {
      console.error('[DISCOGRAPHY SCRAPER ERROR]:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch discography.' });
    }
  }
);

// ============================================================
// RELEASES / DISCOGRAPHY LOCAL & SERVER PERSISTENCE
// ============================================================
const primaryReleasesFile = path.join(process.cwd(), 'data', 'releases_cache.json');
const uploadsReleasesFile = path.join(uploadsDir, 'releases_cache.json');

async function loadCachedReleases(): Promise<any[]> {
  let primaryData: any[] | null = null;
  let uploadsData: any[] | null = null;

  if (fs.existsSync(primaryReleasesFile)) {
    try {
      const content = await fs.promises.readFile(primaryReleasesFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          primaryData = parsed;
        }
      }
    } catch (e) {
      console.warn('[SERVER RELEASES] Primary cache read warning:', e);
    }
  }

  if (fs.existsSync(uploadsReleasesFile)) {
    try {
      const content = await fs.promises.readFile(uploadsReleasesFile, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          uploadsData = parsed;
        }
      }
    } catch (e) {
      console.warn('[SERVER RELEASES] Uploads cache read warning:', e);
    }
  }

  if (primaryData) {
    return primaryData;
  }
  if (uploadsData) {
    atomicWriteJsonFile(primaryReleasesFile, uploadsData).catch(() => {});
    return uploadsData;
  }
  return [];
}

async function saveCachedReleases(releasesList: any[]): Promise<void> {
  try {
    const existing = await loadCachedReleases();
    const map = new Map<string, any>();

    const makeKey = (r: any) => {
      if (r.id) return String(r.id);
      return `${(r.band_id || r.band_name || '').toLowerCase()}_${(r.title || '').toLowerCase()}_${r.release_year || r.year || ''}`;
    };

    existing.forEach((r: any) => {
      if (r && r.title) map.set(makeKey(r), r);
    });
    releasesList.forEach((r: any) => {
      if (r && r.title) {
        const key = makeKey(r);
        const prev = map.get(key) || {};
        map.set(key, {
          ...prev,
          ...r,
          id:
            r.id ||
            prev.id ||
            `rel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          updated_at: new Date().toISOString(),
        });
      }
    });

    const finalArray = Array.from(map.values());
    await atomicWriteJsonFile(primaryReleasesFile, finalArray);
    await atomicWriteJsonFile(uploadsReleasesFile, finalArray);
  } catch (e) {
    console.error('[SERVER RELEASES] Cache write error:', e);
    throw e;
  }
}

async function handleGetReleases(req: express.Request, res: express.Response) {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const paramVal = req.params.idOrName || '';
    const bandId = ((req.query.band_id as string) || paramVal || '').trim();
    const bandName = ((req.query.band_name as string) || paramVal || '')
      .trim()
      .toLowerCase();

    const cached = await loadCachedReleases();
    let dbReleases: any[] = [];
    const supabase = getSupabaseService();
    if (supabase) {
      try {
        let q = supabase.from('releases').select('*');
        if (bandId && !bandId.includes(' ')) q = q.eq('band_id', bandId);
        const { data, error } = await q;
        if (!error && Array.isArray(data)) {
          dbReleases = data;
        }
      } catch (_) {}
    }

    const combinedMap = new Map<string, any>();
    [...cached, ...dbReleases].forEach((r: any) => {
      if (!r || !r.title) return;
      const key =
        r.id ||
        `${(r.band_id || r.band_name || '').toLowerCase()}_${r.title.toLowerCase()}`;
      combinedMap.set(key, { ...(combinedMap.get(key) || {}), ...r });
    });

    let results = Array.from(combinedMap.values());
    if (bandId || bandName) {
      results = results.filter((r: any) => {
        const matchId =
          bandId &&
          r.band_id &&
          String(r.band_id).toLowerCase() === bandId.toLowerCase();
        const matchName =
          bandName &&
          r.band_name &&
          String(r.band_name).trim().toLowerCase() === bandName;
        const matchTitleFallback =
          bandName && r.artist && String(r.artist).trim().toLowerCase() === bandName;
        return matchId || matchName || matchTitleFallback;
      });
    }

    results.sort(
      (a: any, b: any) =>
        (Number(b.release_year || b.year) || 0) -
        (Number(a.release_year || a.year) || 0)
    );
    res.json({ success: true, count: results.length, releases: results });
  } catch (err: any) {
    console.error('[SERVER RELEASES GET ERROR]:', err);
    res.status(500).json({ error: err.message || 'Failed to load releases' });
  }
}

bandsRouter.get('/api/releases', handleGetReleases);
bandsRouter.get('/api/releases/band/:idOrName', handleGetReleases);

bandsRouter.post(
  '/api/releases',
  requireAuth,
  apiMutationLimiter,
  express.json({ limit: '50mb' }),
  async (req: express.Request, res: express.Response) => {
    try {
      const payload = req.body?.releases || req.body?.release || req.body;
      const listToSave = Array.isArray(payload) ? payload : [payload];
      const validList = listToSave.filter((r: any) => r && r.title);

      if (validList.length === 0) {
        return res.status(400).json({ error: 'Valid release with title is required' });
      }

      const user = req.authUser!;
      const supabase = getSupabaseService();
      const ownedIds = await getUserOwnedEntityIds(supabase, user);

      for (const rel of validList) {
        if (rel.band_id) {
          const ownsBand = await assertBandOrEntityOwner(supabase, user, String(rel.band_id));
          if (!ownsBand) {
            return res.status(403).json({
              error: 'Forbidden: You cannot modify releases for an entity you do not own.',
            });
          }
        }
        rel.created_by = rel.created_by || user.id;
      }

      const normalizedList: any[] = [];
      for (const r of validList) {
        let coverUrl = r.cover_url || r.coverUrl || '';

        if (typeof coverUrl === 'string' && coverUrl.startsWith('data:image/')) {
          try {
            const matches = coverUrl.match(/^data:([^;]+);base64,([\s\S]+)$/);
            if (matches && matches.length === 3) {
              const mimeType = matches[1];
              const base64Payload = matches[2].replace(/\s+/g, '');
              const buffer = Buffer.from(base64Payload, 'base64');
              const ext = (mimeType.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
              const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
              const filePath = path.join(uploadsDir, fileName);
              await fs.promises.writeFile(filePath, buffer);
              coverUrl = `/uploads/${fileName}`;
            }
          } catch (imgErr) {
            console.warn(
              '[SERVER RELEASES] Could not extract base64 cover image, keeping inline:',
              imgErr
            );
          }
        }

        normalizedList.push({
          ...r,
          id:
            r.id ||
            `rel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          band_id: r.band_id || null,
          band_name: r.band_name || r.artist || null,
          title: String(r.title).trim(),
          release_type: r.release_type || r.type || 'Album',
          release_year:
            Number(r.release_year || r.year) || new Date().getFullYear(),
          cover_url: coverUrl,
          bandcamp_embed_url: r.bandcamp_embed_url || r.bandcamp_url || '',
          spotify_url: r.spotify_url || '',
          apple_music_url: r.apple_music_url || '',
          youtube_url: r.youtube_url || '',
          tracks: Array.isArray(r.tracks) ? r.tracks : [],
          label: r.label || 'Independent',
          created_by: r.created_by || user.id,
          created_at: r.created_at || new Date().toISOString(),
        });
      }

      await saveCachedReleases(normalizedList);

      if (supabase) {
        for (const rel of normalizedList) {
          try {
            const dbPayload: Record<string, any> = {
              band_id: rel.band_id,
              title: rel.title,
              release_type: rel.release_type,
              release_year: rel.release_year,
              cover_url: rel.cover_url,
              spotify_url: rel.spotify_url,
              apple_music_url: rel.apple_music_url,
              youtube_url: rel.youtube_url,
              bandcamp_embed_url: rel.bandcamp_embed_url,
              tracks: rel.tracks,
            };
            if (
              rel.id &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                rel.id
              )
            ) {
              dbPayload.id = rel.id;
            }
            await supabase.from('releases').upsert([dbPayload]);
          } catch (_) {}
        }
      }

      const firstBandId = normalizedList[0]?.band_id;
      const firstBandName = (normalizedList[0]?.band_name || '').toLowerCase();
      const allCached = await loadCachedReleases();
      const bandReleases = allCached.filter((r: any) => {
        if (firstBandId && r.band_id === firstBandId) return true;
        if (
          firstBandName &&
          (r.band_name || '').toLowerCase() === firstBandName
        )
          return true;
        return false;
      });

      res.json({
        success: true,
        count: normalizedList.length,
        releases: bandReleases.length > 0 ? bandReleases : normalizedList,
      });
    } catch (err: any) {
      console.error('[SERVER RELEASES POST ERROR]:', err);
      res.status(500).json({ error: err.message || 'Failed to save releases' });
    }
  }
);

async function deleteReleaseRecord(
  authUser: Express.Request['authUser'],
  releaseId?: string,
  title?: string,
  bandId?: string,
  bandName?: string
) {
  const existing = await loadCachedReleases();
  const normTitle = (title || '').trim().toLowerCase();
  const normBandId = (bandId || '').trim().toLowerCase();
  const normBandName = (bandName || '').trim().toLowerCase();

  const supabase = getSupabaseService();
  const ownedIds = await getUserOwnedEntityIds(supabase, authUser!);

  const matchingTargets = existing.filter((r: any) => {
    if (!r) return false;
    if (
      releaseId &&
      releaseId !== 'undefined' &&
      String(r.id) === String(releaseId)
    )
      return true;
    if (normTitle && (r.title || '').trim().toLowerCase() === normTitle) {
      if (normBandId && (r.band_id || '').trim().toLowerCase() === normBandId)
        return true;
      if (
        normBandName &&
        (r.band_name || '').trim().toLowerCase() === normBandName
      )
        return true;
      if (!normBandId && !normBandName) return true;
    }
    return false;
  });

  for (const target of matchingTargets) {
    const isAuthorized = hasAnyOwnershipMatch(authUser!, ownedIds, [
      target.created_by,
      target.band_id,
    ]);
    if (!isAuthorized) {
      const err: any = new Error(
        'Forbidden: You are not authorized to delete this release.'
      );
      err.status = 403;
      throw err;
    }
  }

  const filtered = existing.filter((r: any) => {
    if (!r) return false;
    if (
      releaseId &&
      releaseId !== 'undefined' &&
      String(r.id) === String(releaseId)
    )
      return false;
    if (normTitle && (r.title || '').trim().toLowerCase() === normTitle) {
      if (normBandId && (r.band_id || '').trim().toLowerCase() === normBandId)
        return false;
      if (
        normBandName &&
        (r.band_name || '').trim().toLowerCase() === normBandName
      )
        return false;
      if (!normBandId && !normBandName) return false;
    }
    return true;
  });

  await atomicWriteJsonFile(primaryReleasesFile, filtered);
  await atomicWriteJsonFile(uploadsReleasesFile, filtered);

  if (supabase && releaseId && releaseId !== 'undefined') {
    try {
      await supabase.from('releases').delete().eq('id', releaseId);
    } catch (_) {}
  }
  return filtered.length;
}

bandsRouter.delete(
  '/api/releases/:id',
  requireAuth,
  apiMutationLimiter,
  async (req: express.Request, res: express.Response) => {
    try {
      const releaseId = req.params.id;
      const title = (req.query.title as string) || '';
      const bandId = (req.query.band_id as string) || '';
      const bandName = (req.query.band_name as string) || '';
      const remaining = await deleteReleaseRecord(
        req.authUser,
        releaseId,
        title,
        bandId,
        bandName
      );
      res.json({ success: true, releaseId, remaining });
    } catch (err: any) {
      res
        .status(err.status || 500)
        .json({ error: err.message || 'Failed to delete release' });
    }
  }
);

bandsRouter.post(
  '/api/releases/delete',
  requireAuth,
  apiMutationLimiter,
  express.json(),
  async (req: express.Request, res: express.Response) => {
    try {
      const { id, title, band_id, band_name } = req.body || {};
      const remaining = await deleteReleaseRecord(
        req.authUser,
        id,
        title,
        band_id,
        band_name
      );
      res.json({ success: true, remaining });
    } catch (err: any) {
      res
        .status(err.status || 500)
        .json({ error: err.message || 'Failed to delete release' });
    }
  }
);
