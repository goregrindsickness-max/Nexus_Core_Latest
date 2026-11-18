import { fetchCachedShowsList } from '../lib/supabaseQueryCache';
import { tourPackageManager } from '../lib/tourPackageManager';
import { showsStore } from '../utils/indexedDB';
import {
  getEffectiveShowEndDate,
  getEffectiveShowStartDate,
  isShowEmbargoedOrDraft,
  parseShowExtraNotes,
} from '../utils/showDisplayUtils';

function buildShowSig(s: any): string {
  const headliner = String(s?.headliner || s?.band_name || s?.name || s?.show_name || '')
    .toLowerCase()
    .trim();
  const dateStr = String(getEffectiveShowStartDate(s) || '').toLowerCase().trim();
  const cityStr = String(s?.city || '').toLowerCase().trim();
  return headliner && dateStr ? `${headliner}__${dateStr}__${cityStr}` : '';
}

function mergeRicherShow(existing: any, incoming: any): any {
  const existingExtra = parseShowExtraNotes(existing);
  const incomingExtra = parseShowExtraNotes(incoming);
  const mergedExtra = { ...existingExtra, ...incomingExtra };
  const resolvedEndDate =
    getEffectiveShowEndDate(incoming) ||
    getEffectiveShowEndDate(existing) ||
    mergedExtra.end_date;

  const resolvedFlyer =
    incoming?.flyer_url ||
    incoming?.flyerUrl ||
    existing?.flyer_url ||
    existing?.flyerUrl ||
    mergedExtra.flyer_url;

  const resolvedSupportLineup =
    (Array.isArray(incoming?.support_lineup) && incoming.support_lineup.length > 0
      ? incoming.support_lineup
      : null) ||
    (Array.isArray(existing?.support_lineup) && existing.support_lineup.length > 0
      ? existing.support_lineup
      : undefined);

  const resolvedSupportBands =
    incoming?.support_bands || existing?.support_bands || undefined;

  return {
    ...existing,
    ...incoming,
    ...(resolvedEndDate ? { end_date: resolvedEndDate, endDate: resolvedEndDate } : {}),
    ...(resolvedFlyer ? { flyer_url: resolvedFlyer, flyerUrl: resolvedFlyer } : {}),
    ...(resolvedSupportLineup ? { support_lineup: resolvedSupportLineup } : {}),
    ...(resolvedSupportBands ? { support_bands: resolvedSupportBands } : {}),
    additional_notes:
      Object.keys(mergedExtra).length > 0
        ? JSON.stringify({ ...mergedExtra, ...(resolvedEndDate ? { end_date: resolvedEndDate } : {}) })
        : incoming?.additional_notes ?? existing?.additional_notes,
  };
}

/**
 * Loads and merges all shows from Supabase, IndexedDB showsStore, localStorage extended cache,
 * and optional prop-passed shows, preserving multi-day end_date and full support lineups.
 */
export async function loadAllMergedShows(
  supabase?: any,
  passedShows?: any[]
): Promise<any[]> {
  const deletedIds = new Set<string>();
  try {
    const rawDel = localStorage.getItem('nexus_deleted_community_shows');
    if (rawDel) {
      const list = JSON.parse(rawDel);
      if (Array.isArray(list)) {
        list.forEach((d) => deletedIds.add(String(d).toLowerCase().trim()));
      }
    }
  } catch {
    // ignore storage errors
  }

  let remoteShows: any[] = [];
  if (supabase) {
    try {
      const rows = await fetchCachedShowsList(supabase, { limit: 500, ascending: false });
      if (Array.isArray(rows)) remoteShows = rows;
    } catch {
      remoteShows = [];
    }
  }

  const localShows: any[] = [];
  try {
    const extRaw = localStorage.getItem('nexus_core_shows_extended');
    if (extRaw) {
      const extMap = JSON.parse(extRaw);
      if (extMap && typeof extMap === 'object') {
        Object.values(extMap).forEach((item) => {
          if (item && typeof item === 'object') localShows.push(item);
        });
      }
    }
  } catch {
    // ignore
  }

  try {
    await showsStore.iterate((val: any) => {
      if (val && typeof val === 'object') {
        localShows.push(val);
      }
    });
  } catch {
    // ignore
  }

  const activeTours = tourPackageManager.getAllTours();
  const combined = [
    ...(Array.isArray(passedShows) ? passedShows : []),
    ...remoteShows,
    ...localShows,
  ];

  const byId = new Map<string, any>();
  const sigToId = new Map<string, string>();
  let fallbackCounter = 0;

  for (const rawItem of combined) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    if (isShowEmbargoedOrDraft(rawItem, activeTours)) continue;

    const sId = String(rawItem.id || '').trim();
    const sIdLower = sId.toLowerCase();
    const sH = String(rawItem.headliner || rawItem.band_name || rawItem.name || rawItem.show_name || '')
      .toLowerCase()
      .trim();
    const sD = String(getEffectiveShowStartDate(rawItem) || '').toLowerCase().trim();
    const delSig = sH && sD ? `${sH}__${sD}` : '';

    if (sIdLower && deletedIds.has(sIdLower)) continue;
    if (delSig && deletedIds.has(delSig)) continue;

    const extra = parseShowExtraNotes(rawItem);
    const endDate = getEffectiveShowEndDate(rawItem);
    const hydrated = {
      ...rawItem,
      ...(endDate ? { end_date: endDate, endDate } : {}),
      ...(extra.flyer_url && !rawItem.flyer_url ? { flyer_url: extra.flyer_url } : {}),
      ...(extra.tour_name && !rawItem.tour_name ? { tour_name: extra.tour_name } : {}),
    };

    const sig = buildShowSig(hydrated);
    const key = sIdLower || sig || `show_${fallbackCounter++}`;
    const existingById = byId.get(key);
    const mappedId = sig ? sigToId.get(sig) : undefined;
    const existingBySig = mappedId ? byId.get(mappedId) : undefined;

    if (existingById) {
      byId.set(key, mergeRicherShow(existingById, hydrated));
      if (sig && !sigToId.has(sig)) sigToId.set(sig, key);
    } else if (existingBySig && mappedId) {
      byId.set(mappedId, mergeRicherShow(existingBySig, hydrated));
    } else {
      byId.set(key, hydrated);
      if (sig) sigToId.set(sig, key);
    }
  }

  const finalShows = Array.from(byId.values());

  // Propagate tour flyers across stops sharing the same tour_name, festival_name, or headliner
  const tourFlyerLookup = new Map<string, string>();
  for (const s of finalShows) {
    const f = s.flyer_url || s.flyerUrl || s.image_url || s.cover_url;
    if (!f) continue;
    const tKey = String(s.tour_name || s.festival_name || '').toLowerCase().trim();
    const hKey = String(s.headliner || s.band_name || '').toLowerCase().trim();
    if (tKey && !tourFlyerLookup.has(`t:${tKey}`)) tourFlyerLookup.set(`t:${tKey}`, f);
    if (hKey && !tourFlyerLookup.has(`h:${hKey}`)) tourFlyerLookup.set(`h:${hKey}`, f);
  }

  for (const s of finalShows) {
    if (!(s.flyer_url || s.flyerUrl)) {
      const tKey = String(s.tour_name || s.festival_name || '').toLowerCase().trim();
      const hKey = String(s.headliner || s.band_name || s.name || s.show_name || '')
        .toLowerCase()
        .trim();
      const inherited =
        (tKey && tourFlyerLookup.get(`t:${tKey}`)) ||
        (hKey && tourFlyerLookup.get(`h:${hKey}`)) ||
        (hKey.includes('dying fetus') || tKey.includes('dying fetus')
          ? '/assets/aistudio/image_4f16032b.png'
          : undefined);
      if (inherited) {
        s.flyer_url = inherited;
        s.flyerUrl = inherited;
      }
    }
  }

  return finalShows;
}

