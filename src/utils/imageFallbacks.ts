import React from 'react';

/**
 * Lightweight SVG Monogram & Silhouette Placeholder Registry
 *
 * Replaces external stock photo URLs with zero-network self-contained SVG data URIs
 * when `avatar_url` or `cover_url` is null.
 */

export function createMonogramPlaceholderSvg(
  label?: string | null,
  variant: 'band' | 'venue' | 'user' = 'band'
): string {
  const clean = (label || '').trim();
  const initials = clean
    ? clean
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w[0] || '')
        .join('')
        .toUpperCase() || 'NX'
    : variant === 'venue'
      ? 'VN'
      : 'BD';

  const stroke = variant === 'venue' ? '%23eab308' : variant === 'user' ? '%2306b6d4' : '%2339ff14';
  const accent = variant === 'venue' ? '%23f97316' : variant === 'user' ? '%236366f1' : '%2310b981';

  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%2309090b'/><circle cx='100' cy='100' r='84' fill='%2318181b' stroke='${stroke}' stroke-width='3'/><circle cx='100' cy='68' r='22' fill='none' stroke='${accent}' stroke-width='2.5' opacity='0.45'/><path d='M56 150 C56 122 144 122 144 150' fill='none' stroke='${accent}' stroke-width='2.5' opacity='0.45'/><text x='100' y='112' font-family='monospace' font-size='42' font-weight='900' fill='%23f4f4f5' text-anchor='middle' letter-spacing='2'>${encodeURIComponent(initials)}</text></svg>`;
}

export const SILHOUETTE_BAND_SVG = createMonogramPlaceholderSvg('BD', 'band');
export const SILHOUETTE_VENUE_SVG = createMonogramPlaceholderSvg('VN', 'venue');
export const SILHOUETTE_USER_SVG = createMonogramPlaceholderSvg('MB', 'user');

export const VIRULENT_EXCISION_SVG_LOGO =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><polygon points='200,20 240,110 330,110 260,170 290,260 200,210 110,260 140,170 70,110 160,110' fill='none' stroke='%2339ff14' stroke-width='4'/><circle cx='200' cy='200' r='120' fill='none' stroke='%23ff0055' stroke-width='3' stroke-dasharray='10 5'/><g transform='translate(200,200)'><path d='M-60,-40 L60,-40 L80,20 L0,70 L-80,20 Z' fill='%23111' stroke='%2339ff14' stroke-width='5'/><path d='M-40,-20 L40,-20 L50,15 L0,50 L-50,15 Z' fill='%231a000d' stroke='%23ff0055' stroke-width='3'/><circle cx='0' cy='0' r='20' fill='%2339ff14'/><circle cx='0' cy='0' r='8' fill='%23000'/></g><text x='200' y='340' font-family='monospace' font-size='20' font-weight='900' fill='%2339ff14' text-anchor='middle' letter-spacing='3'>VIRULENT EXCISION</text><text x='200' y='365' font-family='monospace' font-size='11' font-weight='700' fill='%23ff0055' text-anchor='middle' letter-spacing='5'>BRUTAL DEATH METAL</text></svg>";

export const VIRULENT_EXCISION_SVG_COVER =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><rect width='1200' height='400' fill='%2309090b'/><path d='M0 320 L300 180 L600 280 L900 140 L1200 260 L1200 400 L0 400 Z' fill='%2318181b'/><line x1='0' y1='320' x2='1200' y2='260' stroke='%2339ff14' stroke-width='2' opacity='0.4'/></svg>";

export const PROMOTER_SVG_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><polygon points='200,30 360,120 360,280 200,370 40,280 40,120' fill='none' stroke='%23eab308' stroke-width='5'/><polygon points='200,60 330,135 330,265 200,340 70,265 70,135' fill='none' stroke='%23f97316' stroke-width='3' stroke-dasharray='8 4'/><g transform='translate(200,200)'><circle cx='0' cy='0' r='65' fill='%2318181b' stroke='%23eab308' stroke-width='4'/><path d='M-30,-25 L30,-25 L0,35 Z' fill='%23eab308'/><circle cx='0' cy='0' r='12' fill='%23000'/></g><text x='200' y='330' font-family='monospace' font-size='18' font-weight='900' fill='%23eab308' text-anchor='middle' letter-spacing='4'>NEXUS LIVE</text><text x='200' y='355' font-family='monospace' font-size='11' font-weight='700' fill='%23f97316' text-anchor='middle' letter-spacing='5'>PRODUCTIONS</text></svg>";

export const PROMOTER_SVG_COVER = VIRULENT_EXCISION_SVG_COVER;

export const VORTEX_GRAPHICS_SVG_AVATAR =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><circle cx='200' cy='200' r='180' fill='none' stroke='%2310b981' stroke-width='6' stroke-dasharray='12 6'/><circle cx='200' cy='200' r='140' fill='none' stroke='%23d946ef' stroke-width='4' opacity='0.7'/><g transform='translate(200,200)'><path d='M0,-110 C60,-110 110,-60 110,0 C110,60 60,110 0,110 C-60,110 -110,60 -110,0' fill='none' stroke='%2310b981' stroke-width='8' stroke-linecap='round'/><path d='M0,-75 C40,-75 75,-40 75,0 C75,40 40,75 0,75 C-40,75 -75,40 -75,0' fill='none' stroke='%23d946ef' stroke-width='6' stroke-linecap='round'/><path d='M0,-40 C20,-40 40,-20 40,0 C40,20 20,40 0,40 C-20,40 -40,20 -40,0' fill='none' stroke='%2322c55e' stroke-width='5'/><circle cx='0' cy='0' r='14' fill='%2310b981'/></g><text x='200' y='360' font-family='monospace' font-size='22' font-weight='900' fill='%2310b981' text-anchor='middle' letter-spacing='4'>VORTEX GRAPHICS</text></svg>";

export const VORTEX_GRAPHICS_SVG_COVER = VIRULENT_EXCISION_SVG_COVER;

export const GENERIC_BAND_LOGO = SILHOUETTE_BAND_SVG;
export const GENERIC_BAND_COVER = VIRULENT_EXCISION_SVG_COVER;
export const GENERIC_MERCH_THUMBNAIL = createMonogramPlaceholderSvg('MR', 'band');
export const GENERIC_GEAR_THUMBNAIL = createMonogramPlaceholderSvg('GR', 'band');
export const GENERIC_VINYL_THUMBNAIL = createMonogramPlaceholderSvg('LP', 'band');

const KNOWN_SUPABASE_IMAGE_MAP: Record<string, string> = {
  'virulent-band-logo': VIRULENT_EXCISION_SVG_LOGO,
  'virulent-band-cover': VIRULENT_EXCISION_SVG_COVER,
  'promoter-avatar': PROMOTER_SVG_AVATAR,
  'promoter-banner': PROMOTER_SVG_COVER,
  'creative-avatar': VORTEX_GRAPHICS_SVG_AVATAR,
  'creative-banner': VORTEX_GRAPHICS_SVG_COVER,
  'peavy': GENERIC_GEAR_THUMBNAIL,
  'heinous': GENERIC_VINYL_THUMBNAIL,
  'hm-2': GENERIC_GEAR_THUMBNAIL,
};

export function getResilientFallback(
  url?: string | null,
  fallbackType: 'avatar' | 'banner' | 'merch' | 'generic' = 'generic',
  label?: string | null
): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    if (fallbackType === 'banner') return GENERIC_BAND_COVER;
    if (fallbackType === 'merch') return GENERIC_MERCH_THUMBNAIL;
    return createMonogramPlaceholderSvg(label, 'band');
  }

  const clean = url.trim().toLowerCase();

  for (const [key, fallback] of Object.entries(KNOWN_SUPABASE_IMAGE_MAP)) {
    if (clean.includes(key)) {
      return fallback;
    }
  }

  if (clean.includes('virulent') || clean.includes('excision')) {
    return fallbackType === 'banner' ? VIRULENT_EXCISION_SVG_COVER : VIRULENT_EXCISION_SVG_LOGO;
  }
  if (clean.includes('promoter')) {
    return fallbackType === 'banner' ? PROMOTER_SVG_COVER : PROMOTER_SVG_AVATAR;
  }
  if (clean.includes('creative') || clean.includes('vortex')) {
    return fallbackType === 'banner' ? VORTEX_GRAPHICS_SVG_COVER : VORTEX_GRAPHICS_SVG_AVATAR;
  }
  if (clean.includes('banner') || clean.includes('cover')) {
    return GENERIC_BAND_COVER;
  }
  if (clean.includes('merch') || clean.includes('shirt') || clean.includes('vinyl') || clean.includes('gear')) {
    return GENERIC_MERCH_THUMBNAIL;
  }

  return fallbackType === 'banner' ? GENERIC_BAND_COVER : createMonogramPlaceholderSvg(label, 'band');
}

export function handleImageFallbackError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackType: 'avatar' | 'banner' | 'merch' | 'generic' = 'generic'
) {
  const target = e.currentTarget;
  target.onerror = null;
  const currentSrc = target.src;
  const fallback = getResilientFallback(currentSrc, fallbackType, target.alt);
  if (fallback && currentSrc !== fallback) {
    target.src = fallback;
  } else {
    target.style.display = 'none';
  }
}
