import React, { useMemo } from 'react';
import { ChevronDown, MapPin, Ticket, Filter, Map as MapIcon, SlidersHorizontal, Calendar, Star, Clock, Trash2 } from 'lucide-react';
import { formatTimeTo12h, hasGigTickets } from '../../utils/socialFeedUtils';

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
  onOpenShowCreator?: () => void;
  onEditShow?: (gig: LiveTonightGig) => void;
  onDeleteGig?: (gig: LiveTonightGig) => void;
  portalRole?: string;
  userProfile?: any;
}

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
  onOpenShowCreator,
  onEditShow,
  onDeleteGig,
  portalRole = 'band',
  userProfile,
}) => {
  const isBand = portalRole === 'band' || userProfile?.active_workspace === 'band';
  const uniqueLiveEvents = useMemo(() => {
    if (!liveEvents || !Array.isArray(liveEvents)) return [];
    const seenIds = new Set<string>();
    const seenSigs = new Set<string>();
    const result: LiveTonightGig[] = [];

    for (const gig of liveEvents) {
      if (!gig) continue;
      const gigId = String(gig.id || '').trim();
      const h = String(gig.headliner || '').toLowerCase().trim();
      const d = String(gig.date || '').toLowerCase().trim();
      const sig = `${h}__${d}`;

      if (gigId && seenIds.has(gigId)) continue;
      if (h && d && seenSigs.has(sig)) continue;

      if (gigId) seenIds.add(gigId);
      if (h && d) seenSigs.add(sig);
      result.push(gig);
    }
    return result;
  }, [liveEvents]);

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
                    : portalRole === 'promoter'
                    ? 'bg-yellow-400 animate-pulse'
                    : portalRole === 'fan_only'
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-zinc-600'
              }`}
            />
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isLiveTonightOpen
                  ? isBand
                    ? 'text-[#39ff14]'
                    : portalRole === 'promoter'
                    ? 'text-yellow-400'
                    : portalRole === 'fan_only'
                    ? 'text-cyan-400'
                    : 'text-emerald-400'
                  : 'text-zinc-500'
              }`}
            >
              Upcoming Shows & Tours Near You
            </span>
            {uniqueLiveEvents && uniqueLiveEvents.length > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hidden sm:inline">
                {uniqueLiveEvents.length} {uniqueLiveEvents.length === 1 ? 'Date' : 'Dates'}
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
                title="Explore all upcoming events, filter by band, city, date, or radar map"
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
          <div className="overflow-x-auto no-scrollbar px-4 flex gap-3 pb-1 animate-in slide-in-from-top-2 fade-in duration-200">
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
                      : gig.isFollowed 
                      ? 'border-amber-500/50 hover:border-amber-400/80 bg-gradient-to-r from-amber-950/20 to-[#0a0c10]' 
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                  onClick={() => onSelectLiveTonight(gig)}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className={`text-xs font-black text-white uppercase tracking-wide ${isBand ? 'group-hover:text-[#39ff14]' : 'group-hover:text-rose-400'} transition-colors truncate max-w-[130px] sm:max-w-[170px]`}>
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
                            ? isBand ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300 animate-pulse' : 'bg-rose-950/70 border-rose-500/50 text-rose-300 animate-pulse' 
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
                      <MapPin className={`w-2.5 h-2.5 ${isBand ? 'text-[#39ff14]' : 'text-rose-500'} shrink-0`} /> 
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

      {/* Feed Filters Control Panel */}
      {(setFilterHideTicketPresales ||
        setFilterShowFollowedOnly ||
        setFilterShowMerchDropsOnlyFromFollowed) && (
        <div className="px-4 py-1.5 bg-zinc-950/80 border-t border-zinc-900/80 flex items-center justify-between text-[9px] font-mono text-zinc-400 overflow-x-auto no-scrollbar gap-2">
          <div className="flex items-center gap-1.5 shrink-0 text-zinc-500 font-bold uppercase tracking-wider">
            <SlidersHorizontal className="w-3 h-3 text-rose-500" /> Filters:
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {setFilterHideTicketPresales && (
              <button
                type="button"
                onClick={() => setFilterHideTicketPresales(!filterHideTicketPresales)}
                className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer font-bold uppercase tracking-wider ${
                  filterHideTicketPresales
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {filterHideTicketPresales ? '✓ Hide Tickets' : 'Hide Presales'}
              </button>
            )}

            {setFilterShowFollowedOnly && (
              <button
                type="button"
                onClick={() => setFilterShowFollowedOnly(!filterShowFollowedOnly)}
                className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer font-bold uppercase tracking-wider ${
                  filterShowFollowedOnly
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {filterShowFollowedOnly ? '✓ Followed Only' : 'Followed Artists'}
              </button>
            )}

            {setFilterShowMerchDropsOnlyFromFollowed && (
              <button
                type="button"
                onClick={() =>
                  setFilterShowMerchDropsOnlyFromFollowed(!filterShowMerchDropsOnlyFromFollowed)
                }
                className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer font-bold uppercase tracking-wider ${
                  filterShowMerchDropsOnlyFromFollowed
                    ? 'bg-rose-950/60 border-rose-500/60 text-rose-300'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {filterShowMerchDropsOnlyFromFollowed
                  ? '✓ Followed Merch'
                  : 'Followed Merch Drops'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default SubViewControlPanels;

