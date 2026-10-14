/**
 * Resilient Image Fallback Registry
 * 
 * Provides self-contained SVG data URIs and reliable CDN fallbacks
 * when external Supabase storage buckets are restricted (e.g. HTTP 402 exceed_cached_egress_quota).
 */

export const VIRULENT_EXCISION_SVG_LOGO = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><polygon points='200,20 240,110 330,110 260,170 290,260 200,210 110,260 140,170 70,110 160,110' fill='none' stroke='%2339ff14' stroke-width='4'/><circle cx='200' cy='200' r='120' fill='none' stroke='%23ff0055' stroke-width='3' stroke-dasharray='10 5'/><g transform='translate(200,200)'><path d='M-60,-40 L60,-40 L80,20 L0,70 L-80,20 Z' fill='%23111' stroke='%2339ff14' stroke-width='5'/><path d='M-40,-20 L40,-20 L50,15 L0,50 L-50,15 Z' fill='%231a000d' stroke='%23ff0055' stroke-width='3'/><circle cx='0' cy='0' r='20' fill='%2339ff14'/><circle cx='0' cy='0' r='8' fill='%23000'/></g><text x='200' y='340' font-family='monospace' font-size='20' font-weight='900' fill='%2339ff14' text-anchor='middle' letter-spacing='3'>VIRULENT EXCISION</text><text x='200' y='365' font-family='monospace' font-size='11' font-weight='700' fill='%23ff0055' text-anchor='middle' letter-spacing='5'>BRUTAL DEATH METAL</text></svg>";

export const VIRULENT_EXCISION_SVG_COVER = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80";

export const PROMOTER_SVG_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><polygon points='200,30 360,120 360,280 200,370 40,280 40,120' fill='none' stroke='%23eab308' stroke-width='5'/><polygon points='200,60 330,135 330,265 200,340 70,265 70,135' fill='none' stroke='%23f97316' stroke-width='3' stroke-dasharray='8 4'/><g transform='translate(200,200)'><circle cx='0' cy='0' r='65' fill='%2318181b' stroke='%23eab308' stroke-width='4'/><path d='M-30,-25 L30,-25 L0,35 Z' fill='%23eab308'/><circle cx='0' cy='0' r='12' fill='%23000'/></g><text x='200' y='330' font-family='monospace' font-size='18' font-weight='900' fill='%23eab308' text-anchor='middle' letter-spacing='4'>NEXUS LIVE</text><text x='200' y='355' font-family='monospace' font-size='11' font-weight='700' fill='%23f97316' text-anchor='middle' letter-spacing='5'>PRODUCTIONS</text></svg>";

export const PROMOTER_SVG_COVER = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80";

export const VORTEX_GRAPHICS_SVG_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'><rect width='400' height='400' fill='%23050505'/><circle cx='200' cy='200' r='180' fill='none' stroke='%2310b981' stroke-width='6' stroke-dasharray='12 6'/><circle cx='200' cy='200' r='140' fill='none' stroke='%23d946ef' stroke-width='4' opacity='0.7'/><g transform='translate(200,200)'><path d='M0,-110 C60,-110 110,-60 110,0 C110,60 60,110 0,110 C-60,110 -110,60 -110,0' fill='none' stroke='%2310b981' stroke-width='8' stroke-linecap='round'/><path d='M0,-75 C40,-75 75,-40 75,0 C75,40 40,75 0,75 C-40,75 -75,40 -75,0' fill='none' stroke='%23d946ef' stroke-width='6' stroke-linecap='round'/><path d='M0,-40 C20,-40 40,-20 40,0 C40,20 20,40 0,40 C-20,40 -40,20 -40,0' fill='none' stroke='%2322c55e' stroke-width='5'/><circle cx='0' cy='0' r='14' fill='%2310b981'/></g><text x='200' y='360' font-family='monospace' font-size='22' font-weight='900' fill='%2310b981' text-anchor='middle' letter-spacing='4'>VORTEX GRAPHICS</text></svg>";

export const VORTEX_GRAPHICS_SVG_COVER = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80";

export const GENERIC_BAND_LOGO = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400";
export const GENERIC_BAND_COVER = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80";
export const GENERIC_MERCH_THUMBNAIL = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80";
export const GENERIC_GEAR_THUMBNAIL = "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=600";
export const GENERIC_VINYL_THUMBNAIL = "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600";

/**
 * Maps known Supabase image filenames or resource keys to reliable fallbacks.
 */
const KNOWN_SUPABASE_IMAGE_MAP: Record<string, string> = {
  'band-logo': VIRULENT_EXCISION_SVG_LOGO,
  'band-cover': VIRULENT_EXCISION_SVG_COVER,
  'promoter-avatar': PROMOTER_SVG_AVATAR,
  'promoter-banner': PROMOTER_SVG_COVER,
  'creative-avatar': VORTEX_GRAPHICS_SVG_AVATAR,
  'creative-banner': VORTEX_GRAPHICS_SVG_COVER,
  'peavy': GENERIC_GEAR_THUMBNAIL,
  'heinous': GENERIC_VINYL_THUMBNAIL,
  'origin': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
  'tdf': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
  'virulent': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
  'analepsy': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  'destroy': 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80',
  'hm-2': GENERIC_GEAR_THUMBNAIL,
  'concert': 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1600&q=80',
  'circuits': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
  'bars': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'
};

/**
 * Returns a resilient image URL if the input URL is a broken/restricted Supabase storage URL.
 */
export function getResilientFallback(url?: string | null, fallbackType: 'avatar' | 'banner' | 'merch' | 'generic' = 'generic'): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    if (fallbackType === 'avatar') return VIRULENT_EXCISION_SVG_LOGO;
    if (fallbackType === 'banner') return VIRULENT_EXCISION_SVG_COVER;
    if (fallbackType === 'merch') return GENERIC_MERCH_THUMBNAIL;
    return GENERIC_BAND_LOGO;
  }

  const clean = url.trim().toLowerCase();

  // Check known keyword matches
  for (const [key, fallback] of Object.entries(KNOWN_SUPABASE_IMAGE_MAP)) {
    if (clean.includes(key)) {
      return fallback;
    }
  }

  if (clean.includes('avatar') || clean.includes('logo')) {
    return VIRULENT_EXCISION_SVG_LOGO;
  }
  if (clean.includes('banner') || clean.includes('cover')) {
    return VIRULENT_EXCISION_SVG_COVER;
  }
  if (clean.includes('merch') || clean.includes('shirt') || clean.includes('vinyl') || clean.includes('gear')) {
    return GENERIC_MERCH_THUMBNAIL;
  }

  return fallbackType === 'banner' ? GENERIC_BAND_COVER : GENERIC_BAND_LOGO;
}

/**
 * Helper to wrap any img onError event to automatically substitute the resilient fallback.
 */
export function handleImageFallbackError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackType: 'avatar' | 'banner' | 'merch' | 'generic' = 'generic') {
  const target = e.currentTarget;
  target.onerror = null;
  const currentSrc = target.src;
  const fallback = getResilientFallback(currentSrc, fallbackType);
  if (fallback && currentSrc !== fallback) {
    target.src = fallback;
  } else {
    target.style.display = 'none';
  }
}
