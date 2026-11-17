const AUDIO_FILE_EXT_REGEX = /\.(mp3|wav|flac|ogg|m4a|aac|webm)$/i;
const IMAGE_ASSET_EXT_REGEX = /\.(jpe?g|png|webp|gif|svg|avif|bmp)(\?|$)/i;

export function isAudioAssetFilename(name: string): boolean {
  return Boolean(name && AUDIO_FILE_EXT_REGEX.test(name.trim()));
}

export function isImageAssetUrl(url: string): boolean {
  return Boolean(url && IMAGE_ASSET_EXT_REGEX.test(url.trim()));
}

export function detectAudioSourceType(
  url: string,
  fromPreviewField = false
): 'vault' | 'itunes_preview' | 'external' {
  const lower = String(url || '').toLowerCase();
  if (
    lower.includes('itunes.apple.com') ||
    lower.includes('audio-ssl.itunes.apple.com') ||
    lower.includes('apple.com')
  ) {
    return 'itunes_preview';
  }
  if (lower.includes('audio-vault') || lower.includes('supabase.co/storage')) {
    return 'vault';
  }
  return fromPreviewField ? 'itunes_preview' : 'external';
}

/**
 * Strips leading `<timestamp>_<salt>_` upload prefixes and file extensions from `audio-vault` object names.
 */
export function stripVaultFilenamePrefix(fileName: string): string {
  return String(fileName || '')
    .trim()
    .replace(AUDIO_FILE_EXT_REGEX, '')
    .replace(/^\d{10,16}_[a-z0-9]{4,12}_/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeNormalized(text: string): string[] {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((tok) => tok.length >= 2 && !/^\d+$/.test(tok));
}

export function normalizeCatalogTitleKey(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Finds the best matching track from a release's tracklist for a file inside `audio-vault/masters/<ReleaseTitle>/`.
 */
export function matchVaultFileToTrack(
  fileName: string,
  tracks: Array<{ title?: string; id?: string; duration?: string }>
): number {
  if (!Array.isArray(tracks) || tracks.length === 0) return -1;

  const cleaned = stripVaultFilenamePrefix(fileName);
  const fileTokens = new Set(tokenizeNormalized(cleaned));
  if (fileTokens.size === 0) return -1;

  let bestIdx = -1;
  let bestScore = 0;

  tracks.forEach((track, idx) => {
    const title = String(track?.title || '').trim();
    if (!title) return;
    const titleTokens = tokenizeNormalized(title);
    if (titleTokens.length === 0) return;

    let overlap = 0;
    for (const tok of titleTokens) {
      if (fileTokens.has(tok)) overlap += 1;
    }

    const ratio = overlap / titleTokens.length;
    if (overlap >= 2 || (titleTokens.length === 1 && overlap === 1)) {
      const score = ratio * 100 + overlap;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = idx;
      }
    }
  });

  return bestIdx;
}

/**
 * Parses a readable track title (and optional artist) from an `audio-vault` filename when no release row matches.
 */
export function parseVaultFilenameMetadata(
  fileName: string,
  fallbackBand = 'Virulent Excision'
): { title: string; band: string } {
  const cleaned = stripVaultFilenamePrefix(fileName)
    .replace(/\s*-+\s*\d{1,2}\s*-+\s*/g, ' — ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return { title: 'Vault Track', band: fallbackBand };
  }

  // Detect common "Band — Track" or "VE Extermination Protocol" style filenames
  const parts = cleaned.split(' — ').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const artistPart = parts[0];
    const songPart = parts.slice(1).join(' ');
    return {
      title: `${songPart} (${artistPart})`,
      band: artistPart,
    };
  }

  const normalizedUpper = cleaned.toUpperCase();
  if (normalizedUpper.startsWith('VE ')) {
    return {
      title: cleaned.slice(3).trim() || cleaned,
      band: 'Virulent Excision',
    };
  }

  return {
    title: cleaned,
    band: fallbackBand,
  };
}
