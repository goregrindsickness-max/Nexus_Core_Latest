export interface TourLike {
  id?: string;
  title?: string;
  tour_name?: string;
  publicationStatus?: string;
  publication_status?: string;
  isPublished?: boolean;
  is_published?: boolean;
  status?: string;
}

const PLACEHOLDER_SUPPORT_VALUES = new Set([
  'tba',
  'tbd',
  'local support',
  'support',
  'various',
  'none',
  'n/a',
  'na',
  '-',
]);

export function parseShowExtraNotes(show: any): Record<string, any> {
  if (!show) return {};
  const raw = show.additional_notes;
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed.startsWith('{')) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }
  return {};
}

export function isShowEmbargoedOrDraft(show: any, tours?: TourLike[]): boolean {
  if (!show) return false;
  const extra = parseShowExtraNotes(show);

  const pubStatus = String(
    show.publication_status ??
      show.publicationStatus ??
      extra.publication_status ??
      extra.publicationStatus ??
      ''
  )
    .toLowerCase()
    .trim();

  if (pubStatus === 'embargoed_private' || pubStatus === 'embargoed' || pubStatus === 'draft') {
    return true;
  }

  if (
    show.is_published === false ||
    show.isPublished === false ||
    extra.is_published === false ||
    extra.isPublished === false
  ) {
    return true;
  }

  const rawStatus = String(show.status ?? extra.status ?? '')
    .toLowerCase()
    .trim();
  if (rawStatus === 'embargoed' || rawStatus === 'embargoed_private' || rawStatus === 'draft') {
    return true;
  }

  if (Array.isArray(tours) && tours.length > 0) {
    const showTourId = String(show.tour_id ?? show.tourId ?? extra.tour_id ?? '').trim();
    const showTourName = String(show.tour_name ?? show.tourName ?? extra.tour_name ?? '')
      .toLowerCase()
      .trim();

    for (const tour of tours) {
      if (!tour) continue;
      const tourId = String(tour.id || '').trim();
      const tourTitle = String(tour.title || tour.tour_name || '')
        .toLowerCase()
        .trim();

      const matchesId = Boolean(showTourId && tourId && showTourId === tourId);
      const matchesTitle = Boolean(showTourName && tourTitle && showTourName === tourTitle);
      if (!matchesId && !matchesTitle) continue;

      const tourPub = String(tour.publicationStatus ?? tour.publication_status ?? '')
        .toLowerCase()
        .trim();
      const tourStatus = String(tour.status ?? '').toLowerCase().trim();
      if (
        tourPub === 'embargoed_private' ||
        tourPub === 'embargoed' ||
        tourPub === 'draft' ||
        tourStatus === 'embargoed' ||
        tourStatus === 'draft' ||
        tour.isPublished === false ||
        tour.is_published === false
      ) {
        return true;
      }
    }
  }

  return false;
}

function extractActNamesFromItem(item: unknown): string[] {
  if (!item) return [];
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractActNamesFromItem(parsed);
      } catch {
        // Fall through to delimiter split
      }
    }
    return trimmed
      .split(/\s*(?:,|\/|\||•|;)\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (Array.isArray(item)) {
    return item.flatMap(extractActNamesFromItem);
  }
  if (typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const candidate = obj.band_name ?? obj.bandName ?? obj.name ?? obj.band ?? obj.title ?? obj.artist;
    if (typeof candidate === 'string' && candidate.trim()) {
      return [candidate.trim()];
    }
  }
  return [];
}

export function getSupportActsList(showOrGig: any): string[] {
  if (!showOrGig) return [];
  const extra = parseShowExtraNotes(showOrGig);
  const headlinerLower = String(showOrGig.headliner || showOrGig.name || '')
    .toLowerCase()
    .trim();

  const rawCandidates = [
    showOrGig.support_lineup,
    showOrGig.supportLineup,
    showOrGig.support_acts,
    showOrGig.supportActs,
    showOrGig.lineup,
    showOrGig.support,
    extra.support_lineup,
    extra.support_acts,
  ];

  const seen = new Set<string>();
  const acts: string[] = [];

  for (const candidate of rawCandidates) {
    if (!candidate) continue;
    const extracted = extractActNamesFromItem(candidate);
    for (const rawName of extracted) {
      const clean = rawName.trim();
      const lower = clean.toLowerCase();
      if (!clean || PLACEHOLDER_SUPPORT_VALUES.has(lower)) continue;
      if (headlinerLower && lower === headlinerLower) continue;
      if (seen.has(lower)) continue;
      seen.add(lower);
      acts.push(clean);
    }
    if (acts.length > 0) break;
  }

  return acts;
}

export function formatSupportActsPreview(showOrGig: any, maxActs = 2): string | null {
  const acts = getSupportActsList(showOrGig);
  if (acts.length === 0) return null;
  const visible = acts.slice(0, maxActs);
  const remaining = acts.length - visible.length;
  return remaining > 0 ? `w/ ${visible.join(', ')} +${remaining}` : `w/ ${visible.join(', ')}`;
}
