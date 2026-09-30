import React, { useMemo, useState, useEffect } from 'react';
import { ChevronDown, MapPin, Ticket, Filter, Map as MapIcon, SlidersHorizontal, Calendar, Star, Clock, Trash2, History, UserPlus, Check, Sparkles, Building2, Palette, Music, Disc } from 'lucide-react';
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

const DEFAULT_CURATED_DISCOVERY = [
  {
    id: 'scene-band-cordyceps',
    name: 'Cordyceps',
    role: 'Band',
    handle: '@cordyceps_bdm',
    genre: 'Brutal Death Metal',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-label-unique-leader',
    name: 'Unique Leader Records',
    role: 'Record Label',
    handle: '@uniqueleaderrec',
    genre: 'Extreme Metal Distro',
    avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-creative-bloodshed',
    name: 'Bloodshed Visuals',
    role: 'Creative',
    handle: '@bloodshed_art',
    genre: 'Album Art & Stage FX',
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-promoter-heavy-mtn',
    name: 'Heavy Mountain Bookings',
    role: 'Promoter',
    handle: '@heavymtn_tours',
    genre: 'Northwest Metal Tours',
    avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-band-nile',
    name: 'Nile',
    role: 'Band',
    handle: '@nile_official',
    genre: 'Technical Death Metal',
    avatar: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-label-relapse',
    name: 'Relapse Records',
    role: 'Record Label',
    handle: '@relapserecords',
    genre: 'Underground Metal',
    avatar: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-creative-rotten-graphics',
    name: 'Rotten Graphics',
    role: 'Creative',
    handle: '@rottengraphics',
    genre: 'Merch & Poster Design',
    avatar: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'scene-promoter-denver-collective',
    name: 'Denver Metal Collective',
    role: 'Promoter',
    handle: '@denvermetal',
    genre: 'Rocky Mountain Gigs',
    avatar: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=150&auto=format&fit=crop&q=80',
  }
];

export const SubViewControlPanels: React.FC<SubViewControlPanelsProps> = ({
  isLiveTonightOpen,
  setIsLiveTonightOpen,
  liveEvents = [],
  onSelectLiveTonight,
  onCheckoutTicket,
  filterHideTicketPresales = false,
  setFilterHideTicketPresales,
  filterShowFollowedOnly = false,
  setFilterShowFollowedOnly,
  filterShowMerchDropsOnlyFromFollowed = false,
  setFilterShowMerchDropsOnlyFromFollowed,
  onOpenMapModal,
  onOpenArchivesModal,
  onOpenShowCreator,
  onEditShow,
  onDeleteGig,
  portalRole = 'band',
  userProfile,
  discoverProfiles = [],
  allProfiles = [],
  onToggleFollow,
  onSelectProfile,
  triggerNotification,
}) => {
  const activeWorkspace = (userProfile?.active_workspace || portalRole || '').toLowerCase();
  const isBand = activeWorkspace === 'band' || portalRole === 'band';
  const isPromoter = activeWorkspace === 'promoter' || portalRole === 'promoter';
  const isFan = activeWorkspace === 'fan_only' || activeWorkspace === 'fan' || portalRole === 'fan_only' || portalRole === 'fan';
  const isIndustryPro = activeWorkspace === 'industry_pro' || activeWorkspace === 'pro' || portalRole === 'industry_pro' || portalRole === 'pro' || (!isBand && !isPromoter && !isFan);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isHoveredRef = React.useRef(false);

  // Local follow state tracking for instant UI responsiveness
  const [followedState, setFollowedState] = useState<Record<string, boolean>>({});

  // Combine discoverProfiles & curated scene profiles for the ticker
  const tickerProfiles = useMemo(() => {
    const list: any[] = [];
    const seenNames = new Set<string>();

    // 1. Add active discoverProfiles
    if (discoverProfiles && Array.isArray(discoverProfiles)) {
      discoverProfiles.forEach((p) => {
        const name = (p.name || '').trim();
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          list.push({
            id: p.id || `disc-${name}`,
            name: p.name,
            role: p.role || 'Creator',
            handle: p.handle || `@${name.toLowerCase().replace(/\\s+/g, '')}`,
            genre: p.genre || p.bio || 'Scene Creator',
            avatar: p.avatar || p.logo_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80',
            followed: Boolean(p.followed),
            rawProfile: p,
          });
        }
      });
    }

    // 2. Add curated scene entities to ensure diverse mix of Band, Label, Creative, Promoter
    DEFAULT_CURATED_DISCOVERY.forEach((curated) => {
      if (!seenNames.has(curated.name.toLowerCase())) {
        seenNames.add(curated.name.toLowerCase());
        list.push({
          ...curated,
          followed: Boolean(followedState[curated.id] || followedState[curated.name.toLowerCase()]),
          rawProfile: curated,
        });
      }
    });

    return list;
  }, [discoverProfiles, followedState]);

  const handleEntityFollowClick = (e: React.MouseEvent, entity: any) => {
    e.stopPropagation();
    const entityKey = entity.id || entity.name.toLowerCase();
    const currentFollow = Boolean(followedState[entityKey] !== undefined ? followedState[entityKey] : entity.followed);
    const nextFollow = !currentFollow;

    setFollowedState((prev) => ({
      ...prev,
      [entityKey]: nextFollow,
      [entity.name.toLowerCase()]: nextFollow,
    }));

    if (onToggleFollow) {
      onToggleFollow(entity.rawProfile || entity);
    }

    triggerNotification?.(
      nextFollow
        ? `⚡ Now following ${entity.name}`
        : `Unfollowed ${entity.name}`
    );
  };

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

  // Auto-scroll loop at a medium readable speed (~3.5 seconds per step), pausing on user interaction
  React.useEffect(() => {
    if (!isLiveTonightOpen || uniqueLiveEvents.length <= 1) return;
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
  }, [isLiveTonightOpen, uniqueLiveEvents.length]);

  return (
    <div className="w-full bg-black/60 border-b border-zinc-900">
      {/* Upcoming Shows Near You Strip */}
      <div className="py-2.5 pl-1 sm:pl-0 border-t border-zinc-900/60">
        <div
          className="px-4 mb-2 flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsLiveTonightOpen(!isLiveTonightOpen)}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
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
              className={`text-[10px] font-black uppercase tracking-widest ${
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
            {uniqueLiveEvents && uniqueLiveEvents.length > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hidden sm:inline">
                {uniqueLiveEvents.length} {uniqueLiveEvents.length === 1 ? 'Show' : 'Shows'} Featured
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onOpenShowCreator && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenShowCreator();
                }}
                className="text-[9px] font-mono uppercase font-bold text-[#00ffcc] hover:text-black hover:bg-[#00ffcc] bg-zinc-900 border border-[#00ffcc]/40 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
              >
                + Post Show
              </button>
            )}
            {onOpenMapModal && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMapModal();
                }}
                className="text-[9px] font-mono uppercase text-cyan-300 hover:text-black bg-cyan-950/60 hover:bg-cyan-400 border border-cyan-800/80 hover:border-cyan-400 px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                title="Explore all upcoming events, single shows, multi-city tours, and scene archives"
              >
                <Calendar className="w-3 h-3 text-cyan-400 group-hover:text-black" /> View All Events
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${
                isLiveTonightOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </div>

        {isLiveTonightOpen && (
          <div
            ref={scrollRef}
            onMouseEnter={() => { isHoveredRef.current = true; }}
            onMouseLeave={() => { isHoveredRef.current = false; }}
            onTouchStart={() => { isHoveredRef.current = true; }}
            onTouchEnd={() => { isHoveredRef.current = false; }}
            className="overflow-x-auto no-scrollbar px-4 flex gap-3 pb-1 animate-in slide-in-from-top-2 fade-in duration-200 scroll-smooth"
          >
            {uniqueLiveEvents.map((gig, idx) => {
              const isTonight = gig.date?.toLowerCase() === 'tonight' || (!gig.date && gig.time.toLowerCase().includes('tonight'));
              const isTomorrow = gig.date?.toLowerCase() === 'tomorrow';
              const ticketsAvailable = hasGigTickets(gig);
              const formattedTime = formatTimeTo12h(gig.time);
              
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
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className={`text-xs font-black text-white uppercase tracking-wide ${
                        isBand ? 'group-hover:text-[#39ff14]' : isIndustryPro ? 'group-hover:text-purple-300' : 'group-hover:text-rose-400'
                      } transition-colors truncate max-w-[130px] sm:max-w-[170px]`}>
                        {gig.headliner}
                      </div>

                      {/* Followed Band Badge */}
                      {gig.isFollowed && (
                        <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          <Star className="w-2 h-2 fill-amber-300" /> Following
                        </span>
                      )}

                      {/* Date Badge */}
                      {gig.date && (
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
      </div>

      {/* Interactive Discover & Follow Scene Ticker Module */}
      <div className="px-3 py-1.5 bg-zinc-950/90 border-t border-zinc-900/80 flex items-center gap-2.5 overflow-hidden text-[9px] font-mono select-none">
        {/* Module Label Badge */}
        <div className="flex items-center gap-1.5 shrink-0 text-[8.5px] font-mono font-black text-rose-400 uppercase tracking-wider bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
          <Sparkles className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
          <span>SCENE FEED</span>
        </div>

        {/* Continuous Scrolling Ticker */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          <div className="animate-scene-follow-ticker flex items-center gap-2.5 shrink-0">
            {tickerProfiles.concat(tickerProfiles).map((item, idx) => {
              const itemKey = item.id || item.name.toLowerCase();
              const isFollowed = Boolean(followedState[itemKey] !== undefined ? followedState[itemKey] : item.followed);
              const roleColor =
                item.role?.toLowerCase().includes('label')
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : item.role?.toLowerCase().includes('promoter')
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : item.role?.toLowerCase().includes('creative')
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => onSelectProfile && onSelectProfile(item.rawProfile || item)}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shrink-0 shadow-sm group/item"
                >
                  <span className={`text-[7px] font-mono font-black px-1.5 py-0.2 rounded uppercase tracking-wider border ${roleColor}`}>
                    {item.role?.toUpperCase().replace('RECORD ', '') || 'ARTIST'}
                  </span>

                  <img
                    src={item.avatar}
                    alt={item.name}
                    className="w-3.5 h-3.5 rounded-full object-cover border border-zinc-700 shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />

                  <span className="text-[9.5px] font-bold text-zinc-200 group-hover/item:text-white truncate max-w-[110px]">
                    {item.name}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleEntityFollowClick(e, item)}
                    className={`flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      isFollowed
                        ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : 'bg-zinc-800 hover:bg-rose-900/60 border border-zinc-700 hover:border-rose-500/60 text-zinc-300 hover:text-white'
                    }`}
                  >
                    {isFollowed ? (
                      <>
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-2.5 h-2.5 text-rose-400" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubViewControlPanels;

