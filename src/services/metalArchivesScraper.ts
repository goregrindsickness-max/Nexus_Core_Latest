import { CatalogRelease, ReleaseTrack, fetchReleasesFromDatabase } from './releasesService';
import { ensureUUID } from './schemaResilienceService';
import { communityBandManager, resolveAuthenticReleaseYear } from '../lib/communityBands';
import { authFetch, getSupabaseAccessToken } from '../utils/apiConfig';

export interface MetalArchivesScrapeResult {
  bandName: string;
  genre: string;
  country: string;
  releases: CatalogRelease[];
}

export interface DiscographyScreenshotParseOptions {
  images?: string[];
  rawText?: string;
  bandName?: string;
  defaultAlbumTitle?: string;
  defaultYear?: string;
  defaultType?: string;
  defaultLabel?: string;
}

/**
 * Parses raw text or table markup copied directly from Encyclopaedia Metallum (Metal Archives),
 * Bandcamp, or Discogs — including multi-line tracklist copies where track numbers, titles,
 * durations, and "Show lyrics" are split across lines or tabs, even when no release header row is present.
 */
export function parseMetalArchivesRawText(
  rawText: string,
  defaultBandNameOrOpts:
    | string
    | {
        bandName?: string;
        defaultAlbumTitle?: string;
        albumTitleHint?: string;
        defaultYear?: string;
        releaseYearHint?: string;
        defaultType?: string;
        releaseTypeHint?: string;
        defaultLabel?: string;
      } = 'Artist',
  defaultAlbumTitle?: string,
  defaultYear?: string,
  defaultType: string = 'Full-length',
  defaultLabel: string = 'Metal Archives Catalog'
): MetalArchivesScrapeResult {
  const defaultBandName =
    typeof defaultBandNameOrOpts === 'string'
      ? defaultBandNameOrOpts
      : defaultBandNameOrOpts?.bandName || 'Artist';
  const resolvedAlbumTitle =
    typeof defaultBandNameOrOpts === 'object'
      ? defaultBandNameOrOpts?.defaultAlbumTitle || defaultBandNameOrOpts?.albumTitleHint || defaultAlbumTitle
      : defaultAlbumTitle;
  const resolvedYear =
    typeof defaultBandNameOrOpts === 'object'
      ? defaultBandNameOrOpts?.defaultYear || defaultBandNameOrOpts?.releaseYearHint || defaultYear
      : defaultYear;
  const resolvedType =
    typeof defaultBandNameOrOpts === 'object'
      ? defaultBandNameOrOpts?.defaultType || defaultBandNameOrOpts?.releaseTypeHint || defaultType
      : defaultType;
  const resolvedLabel =
    typeof defaultBandNameOrOpts === 'object'
      ? defaultBandNameOrOpts?.defaultLabel || defaultLabel
      : defaultLabel;

  const cleanedLines = (rawText || '')
    .split(/\r?\n/)
    .map((l) =>
      l
        .replace(/\bShow lyrics\b/gi, '')
        .replace(/\(loading lyrics\.{0,3}\)/gi, '')
        .replace(/\binstrumental\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter((l) => {
      if (!l) return false;
      if (/^(Tools\s+Name\s+Type|Discography|Complete discography|Songs|Main|Lives|Demos|Misc\.)$/i.test(l)) return false;
      if (/^(Side\s+[A-Z0-9]+|Disc\s+\d+|Total\s+length|Total\s+playing\s+time|Bonus\s+tracks?):?$/i.test(l)) return false;
      if (/^Added by:|^Modified by:|^Added on:|^Last modified on:/i.test(l)) return false;
      return true;
    });

  const releases: CatalogRelease[] = [];
  let headerMetaTitle = resolvedAlbumTitle?.trim() || '';
  let headerMetaType = resolvedType || 'Full-length';
  let headerMetaYear = resolvedYear?.trim() || '';
  let headerMetaLabel = resolvedLabel || 'Metal Archives Catalog';
  let headerMetaCatId = '';

  // Pre-scan for Metal-Archives album page header fields ("Type: Full-length", "Release date: November 20th, 2012", "Label: Metal Blade Records")
  for (let i = 0; i < Math.min(cleanedLines.length, 20); i++) {
    const line = cleanedLines[i];
    const typeField = line.match(/^Type:\s*(.+)$/i);
    if (typeField) {
      headerMetaType = normalizeReleaseType(typeField[1].trim());
      continue;
    }
    const dateField = line.match(/^Release date:\s*.*?(\b(?:19|20)\d{2}\b)/i);
    if (dateField) {
      headerMetaYear = dateField[1];
      continue;
    }
    const labelField = line.match(/^(?:Label|Record label):\s*(.+)$/i);
    if (labelField) {
      headerMetaLabel = labelField[1].trim();
      continue;
    }
    const catField = line.match(/^Catalog ID:\s*(.+)$/i);
    if (catField) {
      headerMetaCatId = catField[1].trim();
      continue;
    }
  }

  const ensureActiveRelease = (): CatalogRelease => {
    if (releases.length === 0) {
      const yr = headerMetaYear || new Date().getFullYear().toString();
      const title = headerMetaTitle || `${defaultBandName} Release`;
      const cat = headerMetaCatId || `MA-${yr}-1`;
      releases.push({
        id: ensureUUID(`ma-${defaultBandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`),
        title,
        type: normalizeReleaseType(headerMetaType),
        releaseDate: yr,
        label: headerMetaLabel,
        catalogId: cat,
        genre: 'Death Metal / Grindcore',
        coverImage: null,
        coverUrl: null,
        tracks: [],
      });
    }
    return releases[releases.length - 1];
  };

  const pushTrackToCurrent = (numStr: string, titleStr: string, durStr?: string) => {
    const cleanTitle = titleStr
      .replace(/^[\.\-\)\s]+/, '')
      .replace(/\bShow lyrics\b/gi, '')
      .trim();
    if (!cleanTitle || /^\d{1,2}:\d{2}$/.test(cleanTitle)) return;

    const currentRel = ensureActiveRelease();
    if (
      currentRel.tracks &&
      currentRel.tracks.length === 1 &&
      currentRel.tracks[0].title === currentRel.title &&
      currentRel.tracks[0].id.endsWith('_placeholder')
    ) {
      currentRel.tracks = [];
    }
    if (!currentRel.tracks) currentRel.tracks = [];

    const normalizedDur = durStr ? durStr.replace(/^0(\d:)/, '$1').trim() : '3:30';
    const trackNumber = currentRel.tracks.length + 1;
    currentRel.tracks.push({
      id: `t_${releases.length}_${trackNumber}`,
      num: String(parseInt(numStr, 10) || trackNumber),
      title: cleanTitle,
      duration: normalizedDur,
    });
  };

  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    if (/^(Type|Release date|Catalog ID|Label|Record label|Format|Reviews|Version desc\.):/i.test(line)) {
      continue;
    }

    // 1. Check for Discography Table Release Header: "Aeons Black Full-length 2012"
    const relHeaderMatch = line.match(
      /^(.*?)\s+(Full-length|Live album|Live|EP|Single|Demo|Split|Compilation|Boxed set|Collaboration)\s+((?:19|20)\d{2})(.*)$/i
    );
    if (relHeaderMatch && !/^\d+[\.\)]/.test(line)) {
      const title = relHeaderMatch[1].replace(/^[^\w\d]+/, '').replace(/[^\w\d\s\(\)'\-!?,&/]+$/, '').trim();
      const rawType = relHeaderMatch[2].trim();
      const year = relHeaderMatch[3].trim();
      const extra = relHeaderMatch[4]?.trim() || '';

      let detectedLabel = headerMetaLabel || 'Metal Archives Catalog';
      let detectedCatId = `MA-${year}-${releases.length + 1}`;
      let reviewNote: string | undefined = undefined;

      if (extra) {
        if (/\d+\s*\(\d+%\)/.test(extra)) {
          reviewNote = `Metal Archives: ${extra}`;
        } else if (extra.includes('/') || extra.includes('-')) {
          const parts = extra.split(/[\/\-]/);
          if (parts[0]) detectedLabel = parts[0].trim();
          if (parts[1]) detectedCatId = parts[1].trim();
        } else if (extra.length > 2) {
          detectedLabel = extra;
        }
      }

      if (title) {
        releases.push({
          id: ensureUUID(`ma-${defaultBandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}`),
          title,
          type: normalizeReleaseType(rawType),
          releaseDate: year,
          genre: 'Death Metal / Grindcore',
          label: detectedLabel,
          catalogId: detectedCatId,
          coverImage: null,
          coverUrl: null,
          tracks: [
            { id: `t_${releases.length}_1_placeholder`, num: '1', title, duration: '3:45' },
          ],
          ...(reviewNote ? { notes: reviewNote } : {}),
        } as CatalogRelease);
        continue;
      }
    }

    // 2. Single-line track with number, title, and duration: "1. Still They Pray 04:10" or "01. Menstrual Envy (03:09)"
    const singleLineTrack = line.match(
      /^([A-Za-z]?\d{1,3})[\.\-\)\s]+(.+?)\s+(?:[-–—\(\[]\s*)?(\d{1,2}:\d{2})(?:[\)\]]|\s|$)/
    );
    if (singleLineTrack) {
      pushTrackToCurrent(singleLineTrack[1], singleLineTrack[2], singleLineTrack[3]);
      continue;
    }

    // 3. Multi-line Metal-Archives track copy where line i is just "1." or "1. Song Title" and duration is on line i+1 or i+2
    const trackNumOnly = line.match(/^([A-Za-z]?\d{1,3})[\.\)]$/);
    if (trackNumOnly) {
      const nextLine = cleanedLines[i + 1] || '';
      const thirdLine = cleanedLines[i + 2] || '';
      // Next line might be "Song Title 04:10" or just "Song Title" followed by "04:10"
      const combinedMatch = nextLine.match(/^(.+?)\s+(\d{1,2}:\d{2})$/);
      if (combinedMatch) {
        pushTrackToCurrent(trackNumOnly[1], combinedMatch[1], combinedMatch[2]);
        i += 1;
        continue;
      }
      if (nextLine && /^\d{1,2}:\d{2}$/.test(thirdLine)) {
        pushTrackToCurrent(trackNumOnly[1], nextLine, thirdLine);
        i += 2;
        continue;
      }
      if (nextLine && !/^([A-Za-z]?\d{1,3})[\.\)]$/.test(nextLine)) {
        pushTrackToCurrent(trackNumOnly[1], nextLine, '3:30');
        i += 1;
        continue;
      }
    }

    // 4. Line has "1. Song Title" without duration, and next line is "04:10"
    const numberedNoDur = line.match(/^([A-Za-z]?\d{1,3})[\.\-\)]\s+(.+)$/);
    if (numberedNoDur) {
      const nextLine = cleanedLines[i + 1] || '';
      const durMatch = nextLine.match(/^(\d{1,2}:\d{2})$/);
      if (durMatch) {
        pushTrackToCurrent(numberedNoDur[1], numberedNoDur[2], durMatch[1]);
        i += 1;
        continue;
      }
      pushTrackToCurrent(numberedNoDur[1], numberedNoDur[2], '3:30');
      continue;
    }

    // 5. Line has "Song Title 04:10" without a leading track number
    const unnumberedWithDur = line.match(/^([A-Za-z0-9].+?)\s+(\d{1,2}:\d{2})$/);
    if (unnumberedWithDur && !/^(Total|Length|Time|Side|Disc)/i.test(unnumberedWithDur[1])) {
      const cur = ensureActiveRelease();
      const nextNum = String((cur.tracks?.length || 0) + 1);
      pushTrackToCurrent(nextNum, unnumberedWithDur[1], unnumberedWithDur[2]);
      continue;
    }
  }

  return {
    bandName: defaultBandName,
    genre: 'Death Metal / Grindcore',
    country: 'Global',
    releases,
  };
}

/**
 * Sends one or more screenshots (base64 data URLs) and/or raw text to the content-aware
 * Gemini vision archivist endpoint (/api/scrape/parse-discography-image) to extract
 * structured album metadata, tracklists, durations, and high-resolution cover art.
 */
export async function parseDiscographyFromImageOrText(
  options: DiscographyScreenshotParseOptions
): Promise<MetalArchivesScrapeResult> {
  const {
    images = [],
    rawText = '',
    bandName = 'Artist',
    defaultAlbumTitle = '',
    defaultYear = '',
    defaultType = 'Full-length',
    defaultLabel = '',
  } = options;

  try {
    const response = await authFetch('/api/scrape/parse-discography-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images,
        rawText,
        bandName,
        defaultAlbumTitle,
        defaultYear,
        defaultType,
        defaultLabel,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.releases) && data.releases.length > 0) {
        const formattedReleases: CatalogRelease[] = data.releases.map((rel: any, idx: number) => {
          const cover = rel.cover_url || rel.cover_image || rel.coverUrl || rel.coverImage || null;
          const rYear = resolveAuthenticReleaseYear(rel) || rel.release_date || rel.year || defaultYear || new Date().getFullYear().toString();
          const tracks: ReleaseTrack[] = Array.isArray(rel.tracks) && rel.tracks.length > 0
            ? rel.tracks.map((t: any, tIdx: number) => ({
                id: `t_${idx}_${tIdx + 1}`,
                num: String(t.num || t.number || tIdx + 1),
                title: String(t.title || `Track ${tIdx + 1}`).trim(),
                duration: String(t.duration || '3:30').trim(),
                previewUrl: t.previewUrl || undefined,
              }))
            : [{ id: `t_${idx}_1`, num: '1', title: rel.title || 'Track 1', duration: '3:30' }];

          return {
            id: ensureUUID(
              rel.id ||
                `rel-${bandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${(rel.title || idx)
                  .toString()
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '-')}`
            ),
            title: rel.title || defaultAlbumTitle || 'Untitled Release',
            type: normalizeReleaseType(rel.type || defaultType || 'Full-length'),
            releaseDate: rYear,
            genre: rel.genre || data.genre || 'Extreme Metal',
            label: rel.label || defaultLabel || 'Metal Archives Verified',
            catalogId: rel.catalog_id || rel.catalogId || `CAT-${rYear}-${String(idx + 1).padStart(3, '0')}`,
            coverImage: cover,
            coverUrl: cover,
            tracks,
          } as CatalogRelease;
        });

        return {
          bandName: data.bandName || bandName,
          genre: data.genre || 'Extreme Metal',
          country: data.country || 'Global',
          releases: formattedReleases,
        };
      }
    } else {
      const errData = await response.json().catch(() => ({}));
      if (images.length > 0 && !rawText.trim()) {
        throw new Error(errData.error || 'Could not extract tracklist from screenshot. Make sure the track names are legible.');
      }
    }
  } catch (err: any) {
    if (images.length > 0 && !rawText.trim()) {
      throw err;
    }
    console.warn('[metalArchivesScraper] Vision endpoint fallback to local parser:', err);
  }

  if (rawText && rawText.trim()) {
    return parseMetalArchivesRawText(
      rawText,
      bandName,
      defaultAlbumTitle,
      defaultYear,
      defaultType,
      defaultLabel
    );
  }

  return {
    bandName,
    genre: 'Extreme Metal',
    country: 'Global',
    releases: [],
  };
}

/**
 * Intelligent scraper & archivist for Metal-Archives, MusicBrainz, and Apple Music.
 */
export async function scrapeMetalArchivesBand(
  queryOrUrl: string,
  rawPastedText?: string,
  source: string = 'all'
): Promise<MetalArchivesScrapeResult> {
  const query = (queryOrUrl || '').trim();
  const isSourceKeyword =
    typeof rawPastedText === 'string' &&
    /^(all|metal-archives|musicbrainz|itunes)$/i.test(rawPastedText.trim());
  const effectiveSource = isSourceKeyword ? rawPastedText.trim().toLowerCase() : source;
  const effectiveRawText = isSourceKeyword ? undefined : rawPastedText;

  // 1. If user provided raw pasted text directly, parse it first
  if (effectiveRawText && effectiveRawText.trim().length > 0) {
    const parsed = await parseDiscographyFromImageOrText({
      rawText: effectiveRawText,
      bandName: query || 'Band',
    });
    if (parsed.releases.length > 0) {
      return parsed;
    }
  }

  if (!query) {
    throw new Error('Please enter a valid band name or search query.');
  }

  let cleanName = query;
  if (cleanName.includes('metal-archives.com/bands/')) {
    const parts = cleanName.split('/bands/')[1]?.split('/');
    if (parts?.[0]) {
      cleanName = decodeURIComponent(parts[0]).replace(/_/g, ' ');
    }
  }
  cleanName = cleanName.replace(/https?:\/\/[^\s]+/g, '').trim() || cleanName;
  const queryLower = cleanName.toLowerCase().trim();

  const collectedReleasesMap = new Map<string, CatalogRelease>();
  let detectedGenre = 'Extreme Metal';
  let detectedCountry = 'Global';

  const mergeReleaseCandidate = (rel: CatalogRelease) => {
    const normTitle = (rel.title || '')
      .toLowerCase()
      .replace(/\s*-\s*(single|ep|demo|live|remastered|deluxe.*).*$/i, '')
      .trim();
    if (!normTitle) return;

    const existing = collectedReleasesMap.get(normTitle);
    if (!existing) {
      collectedReleasesMap.set(normTitle, rel);
      return;
    }

    const existingTracks = existing.tracks || [];
    const newTracks = rel.tracks || [];
    const existingIsPlaceholder =
      existingTracks.length <= 1 &&
      existingTracks[0]?.title?.toLowerCase().trim() === existing.title?.toLowerCase().trim();
    const newIsBetterTracks =
      newTracks.length > existingTracks.length || (existingIsPlaceholder && newTracks.length >= 1);

    collectedReleasesMap.set(normTitle, {
      ...existing,
      ...rel,
      id: existing.id || rel.id,
      coverUrl: existing.coverUrl || rel.coverUrl || null,
      coverImage: existing.coverImage || rel.coverImage || existing.coverUrl || rel.coverUrl || null,
      label:
        existing.label &&
        existing.label !== 'Underground Label' &&
        existing.label !== 'MusicBrainz Verified' &&
        existing.label !== 'Independent'
          ? existing.label
          : rel.label || existing.label,
      tracks: newIsBetterTracks ? newTracks : existingTracks,
    });
  };

  // 2. Call server-side universal archivist endpoint
  try {
    const token = await getSupabaseAccessToken();
    const response = await authFetch('/api/scrape/metal-archives', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        bandName: cleanName,
        query: cleanName,
        rawText: effectiveRawText,
        source: effectiveSource || 'all',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.genre) detectedGenre = data.genre;
      if (data?.country) detectedCountry = data.country;

      if (data && Array.isArray(data.releases) && data.releases.length > 0) {
        const parseRawTrack = (t: any, idx: number, tIdx: number): ReleaseTrack => {
          if (typeof t === 'string') {
            const match = t.trim().match(/^(.*?)\s*\((\d{1,2}:\d{2})\)\s*$/);
            if (match) {
              return {
                id: `t_${idx}_${tIdx + 1}`,
                num: String(tIdx + 1),
                title: match[1].trim() || `Track ${tIdx + 1}`,
                duration: match[2].trim(),
              };
            }
            return {
              id: `t_${idx}_${tIdx + 1}`,
              num: String(tIdx + 1),
              title: t.trim() || `Track ${tIdx + 1}`,
              duration: '3:30',
            };
          }
          return {
            id: t?.id || `t_${idx}_${tIdx + 1}`,
            num: String(t?.num || t?.number || tIdx + 1),
            title: t?.title || t?.name || `Track ${tIdx + 1}`,
            duration: t?.duration || '3:30',
            previewUrl: t?.previewUrl || t?.preview_url,
          };
        };

        data.releases.forEach((rel: any, idx: number) => {
          const cover = rel.cover_url || rel.cover_image || rel.coverUrl || rel.coverImage || rel.image_url || null;
          const rYear = resolveAuthenticReleaseYear(rel) || rel.release_date || rel.releaseDate || rel.year || '';
          const parsedTracks: ReleaseTrack[] =
            rel.tracks && Array.isArray(rel.tracks) && rel.tracks.length > 0
              ? rel.tracks.map((t: any, tIdx: number) => parseRawTrack(t, idx, tIdx))
              : [{ id: `t_${idx}_1`, num: '1', title: rel.title || 'Track 1', duration: '3:45' }];

          mergeReleaseCandidate({
            id: ensureUUID(
              rel.id ||
                `rel-${queryLower}-${(rel.title || idx).toString().toLowerCase().replace(/[^a-z0-9]/g, '-')}`
            ),
            title: rel.title || 'Untitled Release',
            type: normalizeReleaseType(rel.type || 'Full-length'),
            releaseDate: rYear,
            genre: rel.genre || detectedGenre,
            label: rel.label || 'Underground Label',
            catalogId: rel.catalog_id || rel.catalogId || `CAT-${rYear || 'CAT'}-${String(idx + 1).padStart(3, '0')}`,
            coverImage: cover,
            coverUrl: cover,
            tracks: parsedTracks,
          } as CatalogRelease);
        });
      }
    }
  } catch (apiErr) {
    console.warn('[metalArchivesScraper] Backend archivist notice:', apiErr);
  }

  // 3. Client-side direct Apple Music / iTunes musicArtist + album lookup (CORS friendly)
  if (collectedReleasesMap.size === 0 || effectiveSource === 'all' || effectiveSource === 'itunes') {
    try {
      const isHeavyGenre = (g: string) => /metal|rock|punk|alternative|hardcore|grind|indie/i.test(g || '');
      const isNonHeavyGenre = (g: string) =>
        /hip-hop|rap|afro|pop|r&b|soul|country|dance|house|trance|techno|jazz|classical|reggae|latin/i.test(g || '');

      const [artistSearchRes, albumSearchRes] = await Promise.all([
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=musicArtist&limit=25`).catch(() => null),
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(cleanName)}&entity=album&limit=40`).catch(() => null),
      ]);

      let primaryArtistId: number | null = null;
      if (artistSearchRes && artistSearchRes.ok) {
        const artistData = await artistSearchRes.json();
        const artistResults: any[] = artistData?.results || [];
        const exactArtists = artistResults.filter(
          (a) => (a.artistName || '').toLowerCase().trim() === queryLower
        );
        const bestArtist =
          exactArtists.find((a) => isHeavyGenre(a.primaryGenreName)) ||
          exactArtists[0] ||
          artistResults.find(
            (a) =>
              (a.artistName || '').toLowerCase().includes(queryLower) &&
              isHeavyGenre(a.primaryGenreName)
          );
        if (bestArtist?.artistId) {
          primaryArtistId = bestArtist.artistId;
          if (bestArtist.primaryGenreName) detectedGenre = bestArtist.primaryGenreName;
        }
      }

      const candidateMap = new Map<number, any>();

      if (primaryArtistId) {
        try {
          const artistLookupRes = await fetch(
            `https://itunes.apple.com/lookup?id=${primaryArtistId}&entity=album&limit=50`
          );
          if (artistLookupRes.ok) {
            const artistLookupData = await artistLookupRes.json();
            const artistCollections = (artistLookupData?.results || []).filter(
              (r: any) =>
                r.wrapperType === 'collection' &&
                (r.artistName || '').toLowerCase().trim() === queryLower
            );
            const heavyOnes = artistCollections.filter((r: any) => !isNonHeavyGenre(r.primaryGenreName));
            for (const col of heavyOnes.length > 0 ? heavyOnes : artistCollections) {
              if (col.collectionId) candidateMap.set(col.collectionId, col);
            }
          }
        } catch (_) {}
      }

      if (albumSearchRes && albumSearchRes.ok) {
        const albumData = await albumSearchRes.json();
        const rawAlbums: any[] = albumData?.results || [];
        const matchingAlbums = rawAlbums.filter((a) => {
          const artist = (a.artistName || '').toLowerCase().trim();
          return artist === queryLower && !isNonHeavyGenre(a.primaryGenreName);
        });
        for (const col of matchingAlbums) {
          if (col.collectionId && !candidateMap.has(col.collectionId)) {
            candidateMap.set(col.collectionId, col);
          }
        }
      }

      const finalResults = Array.from(candidateMap.values());
      if (finalResults.length > 0) {
        const collectionIds = finalResults.map((item: any) => item.collectionId).filter(Boolean);
        const songsByCollection = new Map<number, any[]>();

        const chunkSize = 8;
        for (let i = 0; i < collectionIds.length; i += chunkSize) {
          const chunk = collectionIds.slice(i, i + chunkSize);
          try {
            const trRes = await fetch(
              `https://itunes.apple.com/lookup?id=${chunk.join(',')}&entity=song&limit=300`
            );
            if (trRes.ok) {
              const trData = await trRes.json();
              (trData.results || []).forEach((sItem: any) => {
                if (sItem.wrapperType === 'track' && sItem.collectionId) {
                  const list = songsByCollection.get(sItem.collectionId) || [];
                  list.push(sItem);
                  songsByCollection.set(sItem.collectionId, list);
                }
              });
            }
          } catch (_) {}
        }

        finalResults.forEach((item: any, idx: number) => {
          const rawTitle = item.collectionName || 'Untitled Album';
          const year = (item.releaseDate || '').substring(0, 4) || '';
          const rawLabel =
            item.copyright?.replace(/^℗\s*\d{4}\s*/, '').trim() || item.artistName || 'Independent';
          const hdCover = item.artworkUrl100
            ? item.artworkUrl100.replace('100x100bb', '600x600bb')
            : null;

          const rawSongs = songsByCollection.get(item.collectionId) || [];
          rawSongs.sort((a: any, b: any) => (a.trackNumber || 0) - (b.trackNumber || 0));

          const parsedTracks: ReleaseTrack[] =
            rawSongs.length > 0
              ? rawSongs.map((s: any, tIdx: number) => {
                  const durMs = s.trackTimeMillis;
                  const durationStr = durMs
                    ? `${Math.floor(durMs / 60000)}:${Math.floor((durMs % 60000) / 1000)
                        .toString()
                        .padStart(2, '0')}`
                    : '3:30';
                  return {
                    id: `s-${s.trackId || tIdx + 1}`,
                    num: String(s.trackNumber || tIdx + 1),
                    title: s.trackName || `Track ${tIdx + 1}`,
                    duration: durationStr,
                    previewUrl: s.previewUrl || s.preview_url || undefined,
                  };
                })
              : [{ id: `t_${idx}_1`, num: '1', title: rawTitle, duration: '3:45' }];

          mergeReleaseCandidate({
            id: ensureUUID(`it-${item.collectionId || idx}`),
            title: rawTitle,
            type: normalizeReleaseType(rawTitle),
            releaseDate: year,
            genre: item.primaryGenreName || 'Metal',
            label: rawLabel,
            catalogId: `IT-${item.collectionId || idx + 1}`,
            coverImage: hdCover,
            coverUrl: hdCover,
            tracks: parsedTracks,
          } as CatalogRelease);
        });
      }
    } catch (itErr) {
      console.warn('[metalArchivesScraper] Direct iTunes fallback error:', itErr);
    }
  }

  // 4. Enrich / backfill from Community Band Archive & Live Supabase Releases if available
  try {
    const matchedCommunityBand = communityBandManager.findByName(cleanName);
    if (matchedCommunityBand) {
      if (matchedCommunityBand.genre) detectedGenre = matchedCommunityBand.genre;
      if (matchedCommunityBand.country) detectedCountry = matchedCommunityBand.country;

      const dbReleases = await fetchReleasesFromDatabase('band').catch(() => []);
      for (const dbRel of dbReleases || []) {
        const relBandId = String((dbRel as any).band_id || '');
        const relBandName = String((dbRel as any).band || (dbRel as any).band_name || '').toLowerCase().trim();
        if (dbRel && dbRel.title && (relBandId === matchedCommunityBand.id || relBandName === queryLower)) {
          mergeReleaseCandidate(dbRel);
        }
      }

      for (const rel of matchedCommunityBand.discography || []) {
        const cUrl =
          rel.cover_url ||
          rel.cover_image ||
          rel.coverUrl ||
          rel.coverImage ||
          rel.image_url ||
          null;
        const rYear = resolveAuthenticReleaseYear(rel) || rel.year || '';
        const tracks: ReleaseTrack[] =
          rel.tracks && rel.tracks.length > 0
            ? rel.tracks.map((t, tIdx) => ({
                id: `seed_${tIdx + 1}`,
                num: String(t.number || tIdx + 1),
                title: t.title || `Track ${tIdx + 1}`,
                duration: t.duration || '3:30',
                previewUrl: t.previewUrl,
              }))
            : [];

        if (tracks.length > 0 || cUrl) {
          mergeReleaseCandidate({
            id: ensureUUID(rel.id || `comm-${matchedCommunityBand.id}-${rel.title}`),
            title: rel.title,
            type: normalizeReleaseType(rel.type || 'Full-length'),
            releaseDate: rYear,
            genre: matchedCommunityBand.genre || detectedGenre,
            label: rel.label || rel.release_info || 'Metal Archives Verified',
            catalogId: rel.catalog_id || `CAT-${rYear}`,
            coverImage: cUrl,
            coverUrl: cUrl,
            tracks,
          } as CatalogRelease);
        }
      }
    }
  } catch (_) {}

  const finalReleases = Array.from(collectedReleasesMap.values()).sort(
    (a, b) => parseInt(b.releaseDate || '0', 10) - parseInt(a.releaseDate || '0', 10)
  );

  return {
    bandName: cleanName,
    genre: detectedGenre,
    country: detectedCountry,
    releases: finalReleases,
  };
}

export function normalizeReleaseType(rawType: string): string {
  const lower = (rawType || '').toLowerCase();
  if (lower.includes('live')) return 'Live';
  if (lower.includes('demo')) return 'Demo';
  if (lower.includes('split')) return 'Split';
  if (lower.includes('compilation')) return 'Compilation';
  if (lower.includes('ep')) return 'EP';
  if (lower.includes('single')) return 'Single';
  if (lower.includes('full') || lower.includes('album')) return 'Full-length';
  return 'Full-length';
}
