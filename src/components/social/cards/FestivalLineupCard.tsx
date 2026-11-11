import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  MapPin,
  Ticket,
  ExternalLink,
  Sparkles,
  Clock,
  Edit3,
  Music,
  ChevronRight,
} from 'lucide-react';
import {
  NetworkEntity,
  FestivalEdition,
  FestivalLineupItem,
  BillingTier,
  BILLING_TIER_META,
  getEntityByIdOrSlug,
  getEditionById,
  getEditionsForEntity,
  getLineupForEdition,
  hydrateLineupItemWithBandMetadata,
  openTaggedBandOrEntityProfile,
} from '../../../services/networkEntitiesService';

export interface FestivalLineupCardProps {
  editionId?: string;
  entityId?: string;
  festivalData?: {
    editionId?: string;
    entityId?: string;
    editionName?: string;
    entityName?: string;
    entitySlug?: string;
    startDate?: string;
    endDate?: string;
    venueName?: string;
    city?: string;
    state?: string;
    ticketUrl?: string;
    flyerUrl?: string;
    status?: string;
    lineup?: FestivalLineupItem[];
  };
  isEditable?: boolean;
  onEditLineup?: (entity: NetworkEntity, edition: FestivalEdition) => void;
  triggerNotification?: (msg: string) => void;
  compact?: boolean;
}

const TIER_ORDER: BillingTier[] = [
  'headliner',
  'co_headliner',
  'main_support',
  'support',
  'opener',
];

export const FestivalLineupCard: React.FC<FestivalLineupCardProps> = ({
  editionId,
  entityId,
  festivalData,
  isEditable = false,
  onEditLineup,
  triggerNotification,
  compact = false,
}) => {
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'poster' | 'schedule'>('poster');
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshTick((t) => t + 1);
    window.addEventListener('nexus_entities_updated', handleUpdate);
    return () => window.removeEventListener('nexus_entities_updated', handleUpdate);
  }, []);

  const resolvedData = useMemo(() => {
    const targetEdId = editionId || festivalData?.editionId;
    const targetEntId = entityId || festivalData?.entityId;

    let edition: FestivalEdition | null = targetEdId ? getEditionById(targetEdId) : null;
    let entity: NetworkEntity | null = targetEntId ? getEntityByIdOrSlug(targetEntId) : null;

    if (!edition && entity) {
      const eds = getEditionsForEntity(entity.id);
      edition = eds[0] || null;
    }
    if (!entity && edition) {
      entity = getEntityByIdOrSlug(edition.entity_id);
    }

    let lineup: FestivalLineupItem[] = [];
    if (edition) {
      lineup = getLineupForEdition(edition.id);
    }
    if (lineup.length === 0 && Array.isArray(festivalData?.lineup)) {
      lineup = festivalData!.lineup.map((i) => hydrateLineupItemWithBandMetadata(i));
    }

    return {
      entity,
      edition,
      editionName:
        edition?.edition_name ||
        festivalData?.editionName ||
        entity?.display_name ||
        'Festival Edition',
      entityName: entity?.display_name || festivalData?.entityName || 'Festival',
      entitySlug: entity?.slug || festivalData?.entitySlug || 'festival',
      startDate: edition?.start_date || festivalData?.startDate || '2027-07-16',
      endDate: edition?.end_date || festivalData?.endDate || '2027-07-18',
      venueName: edition?.venue_name || festivalData?.venueName || 'Main Festival Grounds',
      city: edition?.city || festivalData?.city || entity?.location || 'Chicago',
      state: edition?.state || festivalData?.state || '',
      ticketUrl:
        edition?.ticket_url ||
        festivalData?.ticketUrl ||
        entity?.external_links?.tickets ||
        '',
      flyerUrl:
        edition?.flyer_url ||
        festivalData?.flyerUrl ||
        entity?.banner_url ||
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
      status: edition?.status || festivalData?.status || 'announced',
      lineup,
    };
  }, [editionId, entityId, festivalData, refreshTick]);

  const availableDays = useMemo(() => {
    const daysSet = new Set<number>();
    for (const item of resolvedData.lineup) {
      daysSet.add(item.day_number || 1);
    }
    return Array.from(daysSet).sort((a, b) => a - b);
  }, [resolvedData.lineup]);

  const filteredLineup = useMemo(() => {
    if (selectedDay === 'all') return resolvedData.lineup;
    return resolvedData.lineup.filter((i) => (i.day_number || 1) === selectedDay);
  }, [resolvedData.lineup, selectedDay]);

  const groupedByTier = useMemo(() => {
    const map: Record<BillingTier, FestivalLineupItem[]> = {
      headliner: [],
      co_headliner: [],
      main_support: [],
      support: [],
      opener: [],
    };
    for (const item of filteredLineup) {
      const t = item.billing_tier in map ? item.billing_tier : 'support';
      map[t].push(item);
    }
    return map;
  }, [filteredLineup]);

  const formatDateRange = (start: string, end: string) => {
    try {
      const s = new Date(start + 'T12:00:00');
      const e = new Date(end + 'T12:00:00');
      if (isNaN(s.getTime())) return start;
      const startStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = e.toLocaleDateString('en-US', {
        month: s.getMonth() === e.getMonth() ? undefined : 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return start === end ? `${startStr}, ${s.getFullYear()}` : `${startStr} – ${endStr}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  return (
    <div className="my-2.5 rounded-2xl overflow-hidden border border-amber-500/40 bg-[#080a10] shadow-[0_0_25px_rgba(245,158,11,0.12)] text-left relative">
      {/* Top Poster Header Banner */}
      <div className="relative p-4 sm:p-5 border-b border-amber-500/30 overflow-hidden">
        {resolvedData.flyerUrl && (
          <img
            src={resolvedData.flyerUrl}
            alt={resolvedData.editionName}
            className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d14]/70 via-[#080a10]/90 to-[#080a10]" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-black font-mono text-[9px] font-black uppercase tracking-widest">
                🎪 OFFICIAL FESTIVAL BILLING
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                  resolvedData.status === 'sold_out'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {resolvedData.status.replace('_', ' ')}
              </span>
              {resolvedData.entity && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaggedBandOrEntityProfile(resolvedData.entity!, triggerNotification);
                  }}
                  className="text-[10px] font-mono text-amber-300 hover:text-amber-200 underline cursor-pointer"
                >
                  @{resolvedData.entitySlug}
                </button>
              )}
            </div>

            <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              {resolvedData.editionName}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-zinc-300">
              <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                {formatDateRange(resolvedData.startDate, resolvedData.endDate)}
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {resolvedData.venueName ? `${resolvedData.venueName} • ` : ''}
                {resolvedData.city}
                {resolvedData.state ? `, ${resolvedData.state}` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {isEditable && resolvedData.entity && resolvedData.edition && onEditLineup && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLineup(resolvedData.entity!, resolvedData.edition!);
                }}
                className="px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 font-mono font-bold text-[10px] uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Lineup</span>
              </button>
            )}

            {resolvedData.ticketUrl && (
              <a
                href={resolvedData.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-mono font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Passes & Tickets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Day Filter & View Switcher Bar */}
        <div className="relative z-10 mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDay('all');
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                selectedDay === 'all'
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Full Lineup ({resolvedData.lineup.length})
            </button>
            {availableDays.map((dayNum) => (
              <button
                type="button"
                key={dayNum}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDay(dayNum);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                  selectedDay === dayNum
                    ? 'bg-amber-500 text-black'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                Day {dayNum}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('poster');
              }}
              className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase cursor-pointer ${
                viewMode === 'poster' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Poster Billing
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode('schedule');
              }}
              className={`px-2.5 py-1 rounded text-[9px] font-mono font-bold uppercase cursor-pointer ${
                viewMode === 'schedule' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Set Times & Stages
            </button>
          </div>
        </div>
      </div>

      {/* Main Billing Body */}
      <div className="p-4 sm:p-5">
        {filteredLineup.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-zinc-500">
            Lineup announcements coming soon.
          </div>
        ) : viewMode === 'poster' ? (
          <div className="space-y-4 text-center">
            {TIER_ORDER.map((tierKey) => {
              const items = groupedByTier[tierKey];
              if (!items || items.length === 0) return null;

              const isHeadliner = tierKey === 'headliner';
              const isCoHeadliner = tierKey === 'co_headliner';
              const isMainSupport = tierKey === 'main_support';

              return (
                <div key={tierKey} className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-zinc-800" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-500">
                      {BILLING_TIER_META[tierKey].label}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-zinc-800 to-zinc-800" />
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                    {items.map((item) => {
                      const bandName =
                        item.resolved_band_name || item.custom_band_name || 'TBA';
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaggedBandOrEntityProfile(item, triggerNotification);
                          }}
                          title={
                            item.is_platform_band
                              ? `Click to open ${bandName} interactive band profile`
                              : item.custom_external_url
                              ? `Open ${bandName} external page`
                              : `View ${bandName}`
                          }
                          className={`group inline-flex items-center gap-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                            isHeadliner
                              ? 'px-4 py-2 bg-gradient-to-b from-amber-500/20 to-amber-950/30 border-amber-500/50 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                              : isCoHeadliner
                              ? 'px-3.5 py-1.5 bg-rose-950/25 border-rose-500/40 hover:border-rose-400'
                              : isMainSupport
                              ? 'px-3 py-1.5 bg-violet-950/25 border-violet-500/35 hover:border-violet-400'
                              : 'px-2.5 py-1 bg-zinc-900/80 border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          {(isHeadliner || isCoHeadliner) && item.resolved_band_logo && (
                            <img
                              src={item.resolved_band_logo}
                              alt={bandName}
                              className={`${
                                isHeadliner ? 'w-7 h-7' : 'w-5 h-5'
                              } rounded-full object-cover border border-white/20 shrink-0`}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span className={BILLING_TIER_META[tierKey].textClass}>
                            {bandName}
                          </span>
                          {item.is_platform_band ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0" />
                          ) : item.custom_external_url ? (
                            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-white shrink-0" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Schedule / Set Times View */
          <div className="divide-y divide-zinc-800/70 rounded-xl border border-zinc-800 bg-[#0b0e15] overflow-hidden">
            {filteredLineup.map((item) => {
              const bandName = item.resolved_band_name || item.custom_band_name || 'TBA';
              const tierMeta = BILLING_TIER_META[item.billing_tier] || BILLING_TIER_META.support;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    openTaggedBandOrEntityProfile(item, triggerNotification);
                  }}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-900/80 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {item.resolved_band_logo ? (
                        <img
                          src={item.resolved_band_logo}
                          alt={bandName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase text-white group-hover:text-amber-300 transition-colors truncate">
                          {bandName}
                        </span>
                        <span
                          className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${tierMeta.badgeClass}`}
                        >
                          {tierMeta.label}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400 truncate">
                        Day {item.day_number || 1} • {item.stage_name || 'Main Stage'}
                        {item.resolved_band_genre ? ` • ${item.resolved_band_genre}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.set_time && (
                      <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-amber-300 tabular-nums">
                        {item.set_time}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Interactive Legend Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>Tap any billed band to open their interactive Nexus profile & discography</span>
          </div>
          <span className="text-zinc-500">
            {resolvedData.lineup.filter((i) => i.is_platform_band).length} of{' '}
            {resolvedData.lineup.length} bands linked on Nexus
          </span>
        </div>
      </div>
    </div>
  );
};

export default FestivalLineupCard;
