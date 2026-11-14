import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, MapPin, Ticket, Building2, Star, Clock, Plus } from 'lucide-react';
import { formatTimeTo12h, hasGigTickets, isPastShowDate } from '../../utils/socialFeedUtils';

export interface LiveTonightGig {
  id: string;
  headliner: string;
  venue: string;
  time: string;
  date?: string;
  city?: string;
  distance?: string;
  isFollowed?: boolean;
  ticketUrl?: string;
  external_ticket_url?: string;
  ticket_url?: string;
  price?: string;
  presale_price?: string;
  day_of_show_price?: string;
  ticketsAvailable?: boolean;
  ticketStatus?: string;
  hasTickets?: boolean;
}

export interface SubViewControlPanelsProps {
  isLiveTonightOpen: boolean;
  setIsLiveTonightOpen: (open: boolean) => void;
  liveEvents: LiveTonightGig[];
  onSelectLiveTonight: (gig: LiveTonightGig) => void;
  onCheckoutTicket: (gig: LiveTonightGig) => void;
  filterHideTicketPresales?: boolean;
  setFilterHideTicketPresales?: (val: boolean) => void;
  filterShowFollowedOnly?: boolean;
  setFilterShowFollowedOnly?: (val: boolean) => void;
  filterShowMerchDropsOnlyFromFollowed?: boolean;
  setFilterShowMerchDropsOnlyFromFollowed?: (val: boolean) => void;
  onOpenMapModal?: () => void;
  onOpenArchivesModal?: () => void;
  onOpenShowCreator?: () => void;
  onEditShow?: (gig: LiveTonightGig) => void;
  onDeleteGig?: (gig: LiveTonightGig) => void;
  portalRole?: string;
  userProfile?: any;
  discoverProfiles?: any[];
  allProfiles?: any[];
  onToggleFollow?: (profile: any) => void;
  onSelectProfile?: (profile: any) => void;
  triggerNotification?: (msg: string) => void;
}

export const SubViewControlPanels: React.FC<SubViewControlPanelsProps> = ({
  isLiveTonightOpen,
  setIsLiveTonightOpen,
  liveEvents = [],
  onSelectLiveTonight,
  onCheckoutTicket,
  onOpenMapModal,
  onOpenShowCreator,
  portalRole = 'band',
  userProfile,
}) => {
  const activeWorkspace = (userProfile?.active_workspace || portalRole || '').toLowerCase();
  const isBand = activeWorkspace === 'band' || portalRole === 'band';
  const isPromoter = activeWorkspace === 'promoter' || portalRole === 'promoter';
  const isFan = activeWorkspace === 'fan_only' || activeWorkspace === 'fan' || portalRole === 'fan_only' || portalRole === 'fan';
  const isIndustryPro = activeWorkspace === 'industry_pro' || activeWorkspace === 'pro' || portalRole === 'industry_pro' || portalRole === 'pro' || (!isBand && !isPromoter && !isFan);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isHoveredRef = React.useRef(false);

  // Filter shows so each multi-city tour or headliner features ONLY 1 geographically closest show to avoid feed clutter
  const uniqueLiveEvents = useMemo(() => {
    if (!liveEvents || !Array.isArray(liveEvents)) return [];

    const tourGroups = new Map<string, LiveTonightGig[]>();

    for (const gig of liveEvents) {
      if (!gig) continue;
      const gigId = String(gig.id || '').trim();
      const h = String(gig.headliner || (gig as any).name || '').toLowerCase().trim();
      const d = String(gig.date || '').toLowerCase().trim();

      // Exclude shows that have already passed or are archived (Exempt Nile)
      if (!h.includes('nile') && (isPastShowDate(gig.date) || isPastShowDate(d) || (h.includes('vader') && d.includes('2026-09-24')) || gigId === '5c8a0bc3-aff4-491f-9693-d3ca3ed406ee')) {
        continue;
      }

      // Group key: tour_id or tour_name or headliner name
      const tourKey = (gig as any).tour_id || (gig as any).tour_name || (h ? h : `gig-${gigId}`);
      const group = tourGroups.get(tourKey) || [];
      group.push(gig);
      tourGroups.set(tourKey, group);
    }

    const parseMiles = (gig: LiveTonightGig): number => {
      if ((gig as any).distanceMiles !== undefined) return Number((gig as any).distanceMiles);
      if (gig.distance && typeof gig.distance === 'string') {
        const cleaned = gig.distance.replace(/,/g, '').match(/\d+(\.\d+)?/);
        if (cleaned) return parseFloat(cleaned[0]);
      }
      const cityLower = String(gig.city || '').toLowerCase();
      const userCity = String(userProfile?.city || userProfile?.location || '').toLowerCase();
      if (userCity && cityLower.includes(userCity)) return 5;
      if (cityLower.includes('kansas city') || cityLower.includes('denver') || cityLower.includes('st. louis')) return 20;
      return 99999;
    };

    const featuredGigs: LiveTonightGig[] = [];

    for (const [, gigs] of tourGroups) {
      if (gigs.length === 0) continue;
      if (gigs.length === 1) {
        featuredGigs.push(gigs[0]);
        continue;
      }

      // Sort gigs in the tour by closest geographical distance
      gigs.sort((a, b) => {
        const distA = parseMiles(a);
        const distB = parseMiles(b);
        if (distA !== distB) return distA - distB;
        return String(a.date || '').localeCompare(String(b.date || ''));
      });

      // Feature the 1 closest show for this tour
      featuredGigs.push(gigs[0]);
    }

    // Sort final featured list so followed bands and closest shows appear first
    featuredGigs.sort((a, b) => {
      if (a.isFollowed && !b.isFollowed) return -1;
      if (!a.isFollowed && b.isFollowed) return 1;
      return parseMiles(a) - parseMiles(b);
    });

    return featuredGigs;
  }, [liveEvents, userProfile]);

  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    (uniqueLiveEvents || []).forEach(g => {
      if (g.city && g.city.trim()) {
        set.add(g.city.trim());
      }
    });
    return Array.from(set);
  }, [uniqueLiveEvents]);

  const filteredGigs = useMemo(() => {
    if (selectedCity === 'ALL') return uniqueLiveEvents;
    return uniqueLiveEvents.filter(g => (g.city || '').toLowerCase().includes(selectedCity.toLowerCase()));
  }, [uniqueLiveEvents, selectedCity]);

  // Helper function to format countdown badge
  const getGigCountdownBadge = (gig: LiveTonightGig) => {
    const dateStr = (gig.date || '').toLowerCase().trim();
    const timeStr = (gig.time || '').toLowerCase().trim();

    if (dateStr === 'tonight' || timeStr.includes('tonight')) {
      return { text: '🔥 TONIGHT', style: 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse font-bold' };
    }
    if (dateStr === 'tomorrow') {
      return { text: '⚡ TOMORROW', style: 'bg-amber-950/70 border-amber-500/60 text-amber-300 font-bold' };
    }

    if (gig.date) {
      try {
        const gigDate = new Date(gig.date);
        if (!isNaN(gigDate.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((gigDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) return { text: '🔥 TONIGHT', style: 'bg-rose-950/80 border-rose-500/60 text-rose-300 animate-pulse font-bold' };
          if (diffDays === 1) return { text: '⚡ TOMORROW', style: 'bg-amber-950/70 border-amber-500/60 text-amber-300 font-bold' };
          if (diffDays > 1 && diffDays <= 7) return { text: `⏳ IN ${diffDays} DAYS`, style: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300 font-bold' };
        }
      } catch {}
    }

    return null;
  };

  // Auto-scroll loop at a medium readable speed (~3.5 seconds per step), pausing on user interaction
  React.useEffect(() => {
    if (!isLiveTonightOpen || filteredGigs.length <= 1) return;
    const el = scrollRef.current;
    if (!el) return;

    const intervalId = setInterval(() => {
      if (!scrollRef.current || isHoveredRef.current) return;
      const target = scrollRef.current;
      const maxScroll = target.scrollWidth - target.clientWidth;
      if (maxScroll <= 0) return;

      if (target.scrollLeft >= maxScroll - 15) {
        target.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        target.scrollBy({ left: 240, behavior: 'smooth' });
      }
    }, 3500);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLiveTonightOpen, filteredGigs.length]);

  return (
    <div className="w-full bg-black/60 border-b border-zinc-900">
      {/* Upcoming Shows Near You Strip */}
      <div className="py-2.5 pl-1 sm:pl-0 border-t border-zinc-900/60">
        {/* Title Header Row with All Events Link & Collapse Chevron */}
        <div
          className="px-4 mb-2 flex items-center justify-between gap-2 cursor-pointer select-none"
          onClick={() => setIsLiveTonightOpen(!isLiveTonightOpen)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isLiveTonightOpen
                  ? isBand
                    ? 'bg-[#39ff14] shadow-[0_0_8px_#39ff14] animate-pulse'
                    : isPromoter
                    ? 'bg-yellow-400 animate-pulse'
                    : isFan
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <span
              className={`text-xs font-black uppercase tracking-widest truncate ${
                isLiveTonightOpen
                  ? isBand
                    ? 'text-[#39ff14]'
                    : isPromoter
                    ? 'text-yellow-400'
                    : isFan
                    ? 'text-cyan-400'
                    : 'text-purple-400'
                  : 'text-zinc-500'
              }`}
            >
              Upcoming Shows & Tours Near You
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenMapModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMapModal();
                }}
                className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400/85 hover:text-cyan-300 transition-colors cursor-pointer whitespace-nowrap"
                title="Explore all upcoming events, single shows, multi-city tours, and scene archives"
              >
                <span>All Events</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                isLiveTonightOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {/* Single Consolidated Control Row: All Cities Dropdown (left) & High-Contrast + Post Show (right) */}
        <div className="px-4 mb-2.5 flex items-center justify-between gap-2.5">
          {availableCities.length > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center bg-zinc-900/90 border border-amber-500/50 hover:border-amber-400 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-bold text-amber-300 shadow-sm transition-all min-w-0"
            >
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-transparent text-amber-300 font-mono font-bold focus:outline-none cursor-pointer text-[11px] truncate"
              >
                <option value="ALL" className="bg-zinc-950 text-white">All Cities ({uniqueLiveEvents.length})</option>
                {availableCities.map(c => (
                  <option key={c} value={c} className="bg-zinc-950 text-white">{c}</option>
                ))}
              </select>
            </div>
          ) : (
            <div />
          )}

          {onOpenShowCreator && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenShowCreator();
              }}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3.5 py-1.5 text-[11px] font-mono font-black uppercase tracking-wider text-black bg-[#00ffcc] hover:bg-[#33ffd6] border border-[#00ffcc] shadow-[0_0_14px_rgba(0,255,204,0.32)] transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2.75} />
              <span>Post Show</span>
            </button>
          )}
        </div>

        {isLiveTonightOpen && (
          <>
            {filteredGigs.length === 0 ? (
              <div className="mx-4 my-2 p-3.5 rounded-xl bg-zinc-950/80 border border-dashed border-amber-500/40 text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                  <MapPin className="w-3 h-3 text-rose-400" /> No shows currently listed for {selectedCity}
                </div>
                <p className="text-[10px] font-mono text-zinc-400 max-w-sm mx-auto">
                  Be the first to submit a local gig, venue flyer, or tour date in {selectedCity}!
                </p>
                {onOpenShowCreator && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenShowCreator();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Post Show in {selectedCity}</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                ref={scrollRef}
                onMouseEnter={() => { isHoveredRef.current = true; }}
                onMouseLeave={() => { isHoveredRef.current = false; }}
                onTouchStart={() => { isHoveredRef.current = true; }}
                onTouchEnd={() => { isHoveredRef.current = false; }}
                className="overflow-x-auto no-scrollbar px-4 flex gap-3 pb-1 animate-in slide-in-from-top-2 fade-in duration-200 scroll-smooth"
              >
                {filteredGigs.map((gig, idx) => {
                  const isTonight = gig.date?.toLowerCase() === 'tonight' || (!gig.date && gig.time.toLowerCase().includes('tonight'));
                  const isTomorrow = gig.date?.toLowerCase() === 'tomorrow';
                  const ticketsAvailable = hasGigTickets(gig);
                  const formattedTime = formatTimeTo12h(gig.time);
                  const countdownBadge = getGigCountdownBadge(gig);
                  const flyerUrl = (gig as any).flyer_url || (gig as any).image_url || (gig as any).cover_url;
                  const lineupSupport = (gig as any).lineup || (gig as any).support_acts;
                  
                  return (
                    <div
                      key={`gig-${gig.id}-${idx}`}
                      className={`shrink-0 bg-[#0a0c10] border rounded-xl px-3 py-2 flex items-center gap-3 shadow-lg shadow-black/50 transition-all group cursor-pointer ${
                        isBand
                          ? 'border-[#39ff14]/60 hover:border-[#39ff14] bg-gradient-to-r from-[#39ff14]/10 to-[#0a0c10] shadow-[0_0_12px_rgba(57,255,20,0.15)]'
                          : isIndustryPro
                          ? 'border-purple-500/70 hover:border-purple-400 bg-gradient-to-r from-purple-950/40 via-[#130826] to-[#0a0c10] shadow-[0_0_14px_rgba(168,85,247,0.25)]'
                          : isPromoter
                          ? 'border-yellow-500/60 hover:border-yellow-400 bg-gradient-to-r from-yellow-950/20 to-[#0a0c10]'
                          : isFan
                          ? 'border-cyan-500/60 hover:border-cyan-400 bg-gradient-to-r from-cyan-950/20 to-[#0a0c10]'
                          : gig.isFollowed 
                          ? 'border-amber-500/50 hover:border-amber-400/80 bg-gradient-to-r from-amber-950/20 to-[#0a0c10]' 
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                      onClick={() => onSelectLiveTonight(gig)}
                    >
                      {/* Concert Ticket Stub Image/Icon Badge */}
                      <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-750 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                        {flyerUrl ? (
                          <img src={flyerUrl} alt={gig.headliner} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-amber-400">
                            <Building2 className="w-4 h-4 text-amber-400" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className={`text-xs font-black text-white uppercase tracking-wide ${
                            isBand ? 'group-hover:text-[#39ff14]' : isIndustryPro ? 'group-hover:text-purple-300' : 'group-hover:text-rose-400'
                          } transition-colors truncate max-w-[130px] sm:max-w-[170px]`}>
                            {gig.headliner}
                          </div>

                          {/* Live Countdown Badge */}
                          {countdownBadge && (
                            <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border ${countdownBadge.style}`}>
                              {countdownBadge.text}
                            </span>
                          )}

                          {/* Followed Band Badge */}
                          {gig.isFollowed && (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Star className="w-2 h-2 fill-amber-300" /> Following
                            </span>
                          )}

                          {/* Date Badge */}
                          {gig.date && !countdownBadge && (
                            <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                              isTonight 
                                ? isBand ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 animate-pulse' : isIndustryPro ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 animate-pulse' : 'bg-rose-950/70 border-rose-500/50 text-rose-300 animate-pulse' 
                                : isTomorrow
                                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                            }`}>
                              {gig.date}
                            </span>
                          )}
                        </div>

                        {/* Lineup Support snippet if available */}
                        {lineupSupport && (
                          <div className="text-[8.5px] font-mono text-zinc-400 truncate max-w-[140px] sm:max-w-[170px]">
                            w/ {typeof lineupSupport === 'string' ? lineupSupport : Array.isArray(lineupSupport) ? lineupSupport.join(', ') : 'Local Support'}
                          </div>
                        )}

                        {/* Venue & Location */}
                        <div className="text-[9px] text-zinc-400 flex items-center gap-1 font-mono truncate">
                          <MapPin className={`w-2.5 h-2.5 ${isBand ? 'text-[#39ff14]' : isIndustryPro ? 'text-purple-400' : 'text-rose-500'} shrink-0`} /> 
                          <span className="truncate max-w-[130px] sm:max-w-[160px]">{gig.venue}{gig.city ? ` • ${gig.city}` : ''}</span>
                          {gig.distance && (
                            <span className="text-[#00ffcc] shrink-0">({gig.distance})</span>
                          )}
                        </div>

                        {/* Time / Doors Schedule */}
                        <div className="text-[8.5px] text-zinc-300 flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5 text-zinc-500 shrink-0" />
                          <span>{formattedTime}</span>
                          {gig.price && (
                            <span className="text-emerald-400 font-bold ml-1">{gig.price}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button
                          type="button"
                          disabled={!ticketsAvailable}
                          className={`p-1.5 rounded-lg transition-colors shadow-md ${
                            ticketsAvailable
                              ? 'bg-[#006df9] hover:bg-[#005bc3] text-white cursor-pointer shadow-blue-900/30'
                              : 'bg-zinc-800/80 text-zinc-600 cursor-not-allowed opacity-40'
                          }`}
                          title={ticketsAvailable ? "Get Tickets / Box Office" : "Box Office Unlinked / No Tickets Available"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ticketsAvailable) {
                              onCheckoutTicket(gig);
                            }
                          }}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default SubViewControlPanels;

