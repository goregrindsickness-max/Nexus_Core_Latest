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
  const headlinerLower = String(showOrGig.headliner || showOrGig.band_name || '')
    .toLowerCase()
    .trim();

  const rawCandidates = [
    showOrGig.support_lineup,
    showOrGig.supportLineup,
    showOrGig.support_bands,
    showOrGig.supportBands,
    showOrGig.support_acts,
    showOrGig.supportActs,
    showOrGig.lineup,
    showOrGig.support,
    extra.support_lineup,
    extra.support_bands,
    extra.supportBands,
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

export function getFullShowLineup(showOrGig: any): string[] {
  if (!showOrGig) return [];
  const extra = parseShowExtraNotes(showOrGig);
  const headliner = String(showOrGig.headliner || showOrGig.band_name || extra.headliner || '').trim();
  const seen = new Set<string>();
  const result: string[] = [];

  if (headliner) {
    seen.add(headliner.toLowerCase());
    result.push(headliner);
  }

  const rawLineups = [
    showOrGig.lineup,
    showOrGig.support_lineup,
    showOrGig.supportLineup,
    showOrGig.support_bands,
    showOrGig.supportBands,
    showOrGig.support,
    extra.lineup,
    extra.support_lineup,
    extra.support_bands,
  ];

  for (const candidate of rawLineups) {
    if (!candidate) continue;
    for (const rawName of extractActNamesFromItem(candidate)) {
      const clean = rawName.trim();
      const lower = clean.toLowerCase();
      if (!clean || PLACEHOLDER_SUPPORT_VALUES.has(lower) || seen.has(lower)) continue;
      seen.add(lower);
      result.push(clean);
    }
  }

  if (result.length === 0 && showOrGig.name) {
    result.push(String(showOrGig.name).trim());
  }

  return result;
}

function normalizeIsoDateString(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = String(val).trim();
  if (!trimmed) return undefined;
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return trimmed;
}

export function getLocalTodayIso(nowInput?: Date): string {
  const now = nowInput || new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftIsoDateYear(dateStr?: string, deltaYears = 1): string {
  if (!dateStr) return '';
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return dateStr;
  const nextYear = parseInt(match[1], 10) + deltaYears;
  const month = match[2];
  let day = match[3];
  if (month === '02' && day === '29') {
    const isLeap = (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;
    if (!isLeap) day = '28';
  }
  return `${nextYear}-${month}-${day}`;
}

export function findMatchingExistingShowForBatchStop(
  existingShows: any[],
  headliner: string,
  showDate: string,
  city?: string
): any | undefined {
  const hLower = String(headliner || '').toLowerCase().trim();
  const dLower = String(showDate || '').split('T')[0].toLowerCase().trim();
  const cLower = String(city || '').toLowerCase().trim();
  if (!hLower || !dLower || !Array.isArray(existingShows)) return undefined;

  return existingShows.find((val) => {
    if (!val || typeof val !== 'object') return false;
    const h = String(val.headliner || val.band_name || val.name || '').toLowerCase().trim();
    const d = String(val.date || val.show_date || '').split('T')[0].toLowerCase().trim();
    if (h !== hLower || d !== dLower) return false;
    const valCity = String(val.city || '').toLowerCase().trim();
    return !cLower || !valCity || valCity === cLower;
  });
}

function parseDateToLocal(val?: string | null): Date | null {
  if (!val) return null;
  const trimmed = String(val).trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower === 'tonight' || lower === 'upcoming') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (lower === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  const isoMatch = trimmed.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const parsed = new Date(year, month, day);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (/\b(20\d{2})\b/.test(trimmed)) {
    const ts = Date.parse(trimmed);
    if (!isNaN(ts)) {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  const monthDayMatch = trimmed.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})\b/i);
  if (monthDayMatch) {
    const currentYear = new Date().getFullYear();
    const ts = Date.parse(`${monthDayMatch[1]} ${parseInt(monthDayMatch[2], 10)}, ${currentYear}`);
    if (!isNaN(ts)) {
      const d = new Date(ts);
      d.setHours(0, 0, 0, 0);
      return d;
    }
  }

  return null;
}

export function getEffectiveShowStartDate(showOrGig: any): string | undefined {
  if (!showOrGig) return undefined;
  if (typeof showOrGig === 'string') return normalizeIsoDateString(showOrGig);
  const extra = parseShowExtraNotes(showOrGig);
  return normalizeIsoDateString(
    showOrGig.rawDate ||
      showOrGig.show_date ||
      showOrGig.start_date ||
      showOrGig.startDate ||
      showOrGig.date ||
      extra.show_date ||
      extra.date
  );
}

export function getEffectiveShowEndDate(showOrGig: any): string | undefined {
  if (!showOrGig || typeof showOrGig === 'string') return undefined;
  const extra = parseShowExtraNotes(showOrGig);
  return normalizeIsoDateString(
    showOrGig.end_date ||
      showOrGig.endDate ||
      showOrGig.rawEndDate ||
      extra.end_date ||
      extra.endDate
  );
}

export function isMultiDayShow(showOrGig: any): boolean {
  const startRaw = getEffectiveShowStartDate(showOrGig);
  const endRaw = getEffectiveShowEndDate(showOrGig);
  if (!startRaw || !endRaw) return false;
  const startD = parseDateToLocal(startRaw);
  const endD = parseDateToLocal(endRaw);
  if (!startD || !endD) return false;
  return endD.getTime() > startD.getTime();
}

export function getMultiDaySpanDays(startDate?: string | null, endDate?: string | null): number {
  const startD = parseDateToLocal(startDate);
  const endD = parseDateToLocal(endDate);
  if (!startD || !endD) return 1;
  const diffDays = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 1 ? diffDays + 1 : 1;
}

export function isShowPastOrEnded(showOrGig: any, nowInput?: Date): boolean {
  if (!showOrGig) return false;
  const now = nowInput || new Date();
  const startRaw = getEffectiveShowStartDate(showOrGig);
  const endRaw = getEffectiveShowEndDate(showOrGig);

  const startD = parseDateToLocal(startRaw);
  const endD = parseDateToLocal(endRaw);

  // If valid end date is present and >= start date, stay active through the end of the final festival day
  if (endD && (!startD || endD.getTime() >= startD.getTime())) {
    const endOfFinalDay = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate(), 23, 59, 59, 999);
    return endOfFinalDay < now;
  }

  if (startD) {
    // 'Tonight' / 'Tomorrow' / 'Upcoming' strings should never be treated as past
    if (typeof startRaw === 'string') {
      const lower = startRaw.toLowerCase().trim();
      if (lower === 'tonight' || lower === 'tomorrow' || lower === 'upcoming') {
        return false;
      }
    }
    const endOfStartDay = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate(), 23, 59, 59, 999);
    return endOfStartDay < now;
  }

  return false;
}

export function formatShowDateRange(
  startDate?: string | null,
  endDate?: string | null,
  options?: { includeWeekday?: boolean; compact?: boolean }
): string {
  const startTrimmed = String(startDate || '').trim();
  const endTrimmed = String(endDate || '').trim();
  if (!startTrimmed) return '';

  const lowerStart = startTrimmed.toLowerCase();
  const startD = parseDateToLocal(startTrimmed);
  const endD = parseDateToLocal(endTrimmed);
  const currentYear = new Date().getFullYear();

  if (endD && startD && endD.getTime() > startD.getTime()) {
    const sameYear = startD.getFullYear() === endD.getFullYear();
    const sameMonth = sameYear && startD.getMonth() === endD.getMonth();
    const includeYear = startD.getFullYear() !== currentYear || endD.getFullYear() !== currentYear;

    const startMonthDay = startD.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (sameMonth) {
      const yearSuffix = includeYear ? `, ${startD.getFullYear()}` : '';
      return `${startMonthDay} – ${endD.getDate()}${yearSuffix}`;
    }

    if (sameYear) {
      const endMonthDay = endD.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const yearSuffix = includeYear ? `, ${startD.getFullYear()}` : '';
      return `${startMonthDay} – ${endMonthDay}${yearSuffix}`;
    }

    const startFull = startD.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const endFull = endD.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startFull} – ${endFull}`;
  }

  if (lowerStart === 'tonight' || lowerStart === 'tomorrow' || lowerStart === 'upcoming') {
    return startTrimmed;
  }

  if (!startD) return startTrimmed;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (!options?.compact) {
    if (startD.getTime() === today.getTime()) return 'Tonight';
    if (startD.getTime() === tomorrow.getTime()) return 'Tomorrow';
  }

  const isDifferentYear = startD.getFullYear() !== currentYear;
  return startD.toLocaleDateString('en-US', {
    ...(options?.includeWeekday !== false ? { weekday: 'short' } : {}),
    month: 'short',
    day: 'numeric',
    ...(isDifferentYear ? { year: 'numeric' } : {}),
  });
}

export function getShowDateBadgeParts(
  startDate?: string | null,
  endDate?: string | null,
  fallbackDisplay?: string
): { month: string; day: string; year: string } {
  const startD = parseDateToLocal(startDate || fallbackDisplay);
  const endD = parseDateToLocal(endDate);
  if (startD) {
    const startMonth = startD.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const startDay = String(startD.getDate());
    const year = String(startD.getFullYear());
    if (endD && endD.getTime() > startD.getTime()) {
      const sameMonth = startD.getFullYear() === endD.getFullYear() && startD.getMonth() === endD.getMonth();
      const endMonth = endD.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      return {
        month: sameMonth ? startMonth : `${startMonth}-${endMonth}`,
        day: sameMonth ? `${startDay}–${endD.getDate()}` : `${startDay}–${endMonth} ${endD.getDate()}`,
        year,
      };
    }
    return { month: startMonth, day: startDay, year };
  }
  const clean = String(fallbackDisplay || startDate || 'TBA').trim();
  const tokens = clean.replace(/^[a-z]{3},\s*/i, '').split(/\s+/);
  return {
    month: (tokens[0] || 'TBA').slice(0, 6).toUpperCase(),
    day: (tokens[1] || '—').replace(',', ''),
    year: tokens.find((t) => /^20\d{2}$/.test(t)) || String(new Date().getFullYear()),
  };
}

const GENERIC_BAND_IDS = new Set([
  'community_hub',
  'b1',
  'guest',
  'my_band_id',
  '00000000-0000-4000-a000-000000000000',
  '00000000-0000-4000-a000-000000000001',
]);

export function normalizeBandMatchKey(name?: unknown): string {
  if (typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[’'`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function stripBandNameDecorators(rawName: string): string[] {
  const norm = normalizeBandMatchKey(rawName);
  if (!norm) return [];
  const variants = new Set<string>([norm]);
  // Strip parenthetical tags e.g. "Mortician (NY)" or "Mortician (Official)"
  const beforeParen = norm.split(/\s*\(/)[0].trim();
  if (beforeParen.length >= 2) variants.add(beforeParen);
  // Strip "Band at Venue" or "Band - Support"
  const beforeAt = norm.split(/\s+at\s+/)[0].trim();
  if (beforeAt.length >= 2) variants.add(beforeAt);
  const beforeDash = norm.split(/\s+-\s+/)[0].trim();
  if (beforeDash.length >= 2) variants.add(beforeDash);
  return Array.from(variants);
}

function actMatchesTargetNames(actName: string, targetNames: Set<string>): boolean {
  if (!actName || targetNames.size === 0) return false;
  const variants = stripBandNameDecorators(actName);
  for (const v of variants) {
    if (targetNames.has(v)) return true;
  }
  return false;
}

export type BandShowBillingRole = 'headliner' | 'support' | 'organizer' | null;

export function getBandBillingRoleInShow(
  showOrGig: any,
  bandTarget: any
): BandShowBillingRole {
  if (!showOrGig || !bandTarget) return null;

  const extra = parseShowExtraNotes(showOrGig);

  const targetNames = new Set<string>();
  const candidateTargetNames =
    typeof bandTarget === 'string'
      ? [bandTarget]
      : [
          bandTarget.band_name,
          bandTarget.bandName,
          bandTarget.name,
          bandTarget.entity_name,
          bandTarget.corporate_name,
        ];

  for (const rawTarget of candidateTargetNames) {
    if (typeof rawTarget !== 'string') continue;
    for (const v of stripBandNameDecorators(rawTarget)) {
      if (v.length >= 2) targetNames.add(v);
    }
  }

  const targetIds = new Set<string>();
  if (typeof bandTarget === 'object') {
    for (const rawId of [bandTarget.band_id, bandTarget.raw_id, bandTarget.id, bandTarget.user_id]) {
      if (typeof rawId === 'string') {
        const clean = rawId.trim().toLowerCase();
        if (clean && !GENERIC_BAND_IDS.has(clean)) {
          targetIds.add(clean);
        }
      }
    }
  }

  // 1. Check Headliner by name
  const headlinerCandidates = [
    showOrGig.headliner,
    showOrGig.band_name,
    showOrGig.bandName,
    extra.headliner,
    extra.band_name,
    showOrGig.name,
    showOrGig.show_name,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  for (const h of headlinerCandidates) {
    if (actMatchesTargetNames(h, targetNames)) {
      return 'headliner';
    }
  }

  // 2. Check Support Lineup / Lineup by name OR nested band_id
  const supportRawSources = [
    showOrGig.support_lineup,
    showOrGig.supportLineup,
    showOrGig.support_bands,
    showOrGig.supportBands,
    showOrGig.support_acts,
    showOrGig.supportActs,
    showOrGig.support,
    showOrGig.lineup,
    extra.support_lineup,
    extra.support_bands,
    extra.support_acts,
    extra.lineup,
  ];

  for (const src of supportRawSources) {
    if (!src) continue;
    if (Array.isArray(src)) {
      for (const item of src) {
        if (item && typeof item === 'object') {
          const itemBandId = String(item.band_id || item.bandId || item.id || '').trim().toLowerCase();
          if (itemBandId && !GENERIC_BAND_IDS.has(itemBandId) && targetIds.has(itemBandId)) {
            return 'support';
          }
        }
        for (const extractedName of extractActNamesFromItem(item)) {
          if (actMatchesTargetNames(extractedName, targetNames)) {
            return 'support';
          }
        }
      }
    } else {
      for (const extractedName of extractActNamesFromItem(src)) {
        if (actMatchesTargetNames(extractedName, targetNames)) {
          return 'support';
        }
      }
    }
  }

  // 3. Direct Show-level ID match (band_id owner or promoter organizer)
  const showBandId = String(showOrGig.band_id || extra.band_id || '').trim().toLowerCase();
  if (showBandId && !GENERIC_BAND_IDS.has(showBandId) && targetIds.has(showBandId)) {
    return 'headliner';
  }

  const showPromoterId = String(showOrGig.promoter_id || extra.promoter_id || '').trim().toLowerCase();
  if (showPromoterId && !GENERIC_BAND_IDS.has(showPromoterId) && targetIds.has(showPromoterId)) {
    return 'organizer';
  }

  // Only match creator_id / user_id when the show does not already name different headliner/support bands
  // (avoids attributing a fan-submitted community show for other bands to the submitter's own band profile)
  const hasExplicitHeadliner = headlinerCandidates.length > 0;
  const isTargetPromoterObj =
    typeof bandTarget === 'object' &&
    Boolean(
      bandTarget.account_type === 'promoter' ||
        bandTarget.is_promoter ||
        String(bandTarget.role || '').toLowerCase().includes('promoter')
    );

  if (!hasExplicitHeadliner || isTargetPromoterObj) {
    const showCreatorIds = [showOrGig.creator_id, showOrGig.user_id]
      .map((v) => (typeof v === 'string' ? v.trim().toLowerCase() : ''))
      .filter((v) => v && !GENERIC_BAND_IDS.has(v));

    if (showCreatorIds.some((id) => targetIds.has(id))) {
      return isTargetPromoterObj ? 'organizer' : 'headliner';
    }
  }

  return null;
}

export function doesShowFeatureBand(showOrGig: any, bandTarget: any): boolean {
  return getBandBillingRoleInShow(showOrGig, bandTarget) !== null;
}

