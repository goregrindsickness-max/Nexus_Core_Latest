const YOUTUBE_ID_REGEX =
  /(?:youtu\.be\/|(?:www\.|m\.|music\.)?youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;

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
