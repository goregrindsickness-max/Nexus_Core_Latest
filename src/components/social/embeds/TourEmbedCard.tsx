import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Ticket,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';

export interface TourEmbedCardProps {
  post?: any;
  tourData?: any;
  postId?: string | number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  userRsvps?: Record<string, boolean>;
  onToggleRsvp?: (dateId: string) => void;
  onSelectTicketShow?: (showData: any) => void;
  onOpenTicketModal?: (eventData: any) => void;
}

export const TourEmbedCard: React.FC<TourEmbedCardProps> = ({
  post,
  tourData: propTourData,
  postId: propPostId,
  isExpanded,
  onToggleExpand,
  onSelectTicketShow,
  onOpenTicketModal,
}) => {
  // Collapsed by default so the tour card stays compact until the user clicks to expand all dates
  const [localExpanded, setLocalExpanded] = useState(false);
  const showAllStops = isExpanded !== undefined ? isExpanded : localExpanded;

  const resolvedTourData = useMemo(() => {
    if (propTourData && Array.isArray(propTourData.dates) && propTourData.dates.length > 0) {
      return propTourData;
    }
    if (post?.tourData && Array.isArray(post.tourData.dates) && post.tourData.dates.length > 0) {
      return post.tourData;
    }
    if (post?.ticketData) {
      const td = post.ticketData;
      return {
        id: td.id || post.id,
        tourName: td.headliner ? `${td.headliner} • Live Show` : 'Connected Show Details',
        headliner: td.headliner || post.author?.bandName || post.author?.name || 'Live Show',
        flyerUrl: td.flyer_url || post.image_url,
        ticketUrl: td.ticketUrl || td.external_ticket_url || '',
        dates: [
          {
            ...td,
            id: td.id || post.id,
            date: td.date || td.rawDate || 'Upcoming',
            city: td.city || post.location || 'Local Venue',
            venue: td.venue || 'Main Stage',
            price: td.price || '$25',
            priceRange: td.price || '$25',
            ticketUrl: td.ticketUrl || td.external_ticket_url || '',
            external_ticket_url: td.external_ticket_url || td.ticketUrl || '',
            isNearestToUser: true,
          },
        ],
      };
    }
    return propTourData || post?.tourData || null;
  }, [propTourData, post]);

  const resolvedPostId = propPostId ?? post?.id ?? 'tour';

  const allDates: any[] = useMemo(
    () => (Array.isArray(resolvedTourData?.dates) ? resolvedTourData.dates : []),
    [resolvedTourData?.dates]
  );

  const nearestStop = useMemo(() => {
    if (!allDates.length) return null;
    return (
      resolvedTourData?.nearestStop ||
      allDates.find((d) => d?.isNearestToUser) ||
      allDates[0]
    );
  }, [allDates, resolvedTourData?.nearestStop]);

  // Put the user's nearest GPS stop at the top when expanded so it's immediately visible
  const orderedExpandedDates = useMemo(() => {
    if (!nearestStop) return allDates;
    const rest = allDates.filter(
      (d) => !(d.id === nearestStop.id && d.city === nearestStop.city)
    );
    return [nearestStop, ...rest];
  }, [allDates, nearestStop]);

  if (!resolvedTourData || allDates.length === 0) {
    return null;
  }

  const buildFullEventPayload = (dateObj: any) => {
    const resolvedTicketUrl =
      dateObj.ticketUrl ||
      dateObj.external_ticket_url ||
      dateObj.ticket_url ||
      resolvedTourData.ticketUrl ||
      '';
    return {
      ...dateObj,
      id: dateObj.id || `${resolvedPostId}-${dateObj.city}`,
      headliner:
        dateObj.headliner ||
        resolvedTourData.headliner ||
        resolvedTourData.tourName ||
        'Live Tour',
      support:
        dateObj.support ||
        (Array.isArray(resolvedTourData.supportBands)
          ? resolvedTourData.supportBands.join(', ')
          : ''),
      support_bands:
        dateObj.support_bands ||
        (Array.isArray(resolvedTourData.supportBands)
          ? resolvedTourData.supportBands
          : []),
      lineup:
        Array.isArray(dateObj.lineup) && dateObj.lineup.length > 0
          ? dateObj.lineup
          : [
              {
                name:
                  dateObj.headliner ||
                  resolvedTourData.headliner ||
                  'Headliner',
                role: 'Headliner',
                time: '9:30 PM',
              },
              ...(Array.isArray(resolvedTourData.supportBands)
                ? resolvedTourData.supportBands.map((b: string, i: number) => ({
                    name: b,
                    role: i === 0 ? 'Direct Support' : 'Special Guest',
                    time: i === 0 ? '8:15 PM' : '7:15 PM',
                  }))
                : []),
            ],
      venue: dateObj.venue || 'Live Venue',
      city: dateObj.city || 'Tour Stop',
      date: dateObj.date || dateObj.rawDate || 'Upcoming',
      rawDate: dateObj.rawDate || dateObj.show_date || dateObj.date || '',
      show_date: dateObj.show_date || dateObj.rawDate || dateObj.date || '',
      time: dateObj.time || '7:00 PM',
      price: dateObj.price || dateObj.priceRange || '$25',
      priceRange: dateObj.priceRange || dateObj.price || '$25',
      ticketUrl: resolvedTicketUrl,
      external_ticket_url: resolvedTicketUrl,
      ticket_url: resolvedTicketUrl,
      flyer_url:
        dateObj.flyer_url ||
        dateObj.flyerUrl ||
        resolvedTourData.flyerUrl ||
        post?.image_url,
      tour_name: resolvedTourData.tourName,
    };
  };

  const handleOpenStopEventPage = (dateObj: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const payload = buildFullEventPayload(dateObj);
    if (onOpenTicketModal) {
      onOpenTicketModal(payload);
    } else if (onSelectTicketShow) {
      onSelectTicketShow(payload);
    }
  };

  const handleStopTickets = (dateObj: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const payload = buildFullEventPayload(dateObj);
    if (onSelectTicketShow) {
      onSelectTicketShow(payload);
    } else if (onOpenTicketModal) {
      onOpenTicketModal(payload);
    }
  };

  const handleToggleStops = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setLocalExpanded((prev) => !prev);
    }
  };

  return (
    <div className="mb-3 rounded-xl border border-emerald-500/30 bg-zinc-950/90 overflow-hidden shadow-md">
      {/* Compact Clickable Header Bar (Collapsed by default) */}
      <button
        type="button"
        onClick={handleToggleStops}
        className="w-full bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-950 hover:from-emerald-950/90 px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer group/tourhdr"
        aria-expanded={showAllStops}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-extrabold truncate">
              {resolvedTourData.isFanSharedTour
                ? 'Connected Tour Schedule'
                : 'Official Tour Schedule'}
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold">
              {allDates.length} {allDates.length === 1 ? 'Date' : 'Dates'}
            </span>
          </div>
          <p className="font-bold text-white text-xs sm:text-sm truncate mt-0.5 group-hover/tourhdr:text-emerald-200 transition-colors">
            {resolvedTourData.tourName || 'View Full Tour Routing & Event Pages'}
          </p>
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300 group-hover/tourhdr:border-emerald-400/60 shrink-0">
          <span>{showAllStops ? 'Hide Dates' : 'View All Dates'}</span>
          {showAllStops ? (
            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </div>
      </button>

      {/* Expandable Tour Stops List — Only rendered when clicked to expand */}
      {showAllStops && (
        <>
          <div className="divide-y divide-zinc-800/80 border-t border-emerald-500/25 max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
            {orderedExpandedDates.map((dateObj: any, idx: number) => {
              const isNearest =
                Boolean(dateObj.isNearestToUser) ||
                (nearestStop &&
                  dateObj.id === nearestStop.id &&
                  dateObj.city === nearestStop.city);
              const ticketHref =
                dateObj.ticketUrl ||
                dateObj.external_ticket_url ||
                dateObj.ticket_url ||
                resolvedTourData.ticketUrl ||
                '';
              const isSoldOut = dateObj.ticketStatus === 'Sold Out';

              return (
                <div
                  key={`${dateObj.id || idx}-${dateObj.city || idx}`}
                  onClick={(e) => handleOpenStopEventPage(dateObj, e)}
                  className={`px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors cursor-pointer group/stop ${
                    isNearest
                      ? 'bg-emerald-950/30 hover:bg-emerald-950/45'
                      : 'hover:bg-zinc-900/70'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div
                      className={`px-2 py-1 rounded-md border text-center min-w-[74px] shrink-0 ${
                        isNearest
                          ? 'bg-emerald-500/15 border-emerald-500/40'
                          : 'bg-zinc-900 border-zinc-800'
                      }`}
                    >
                      <div
                        className={`text-[10px] font-mono font-bold uppercase ${
                          isNearest ? 'text-emerald-300' : 'text-emerald-400'
                        }`}
                      >
                        {dateObj.date}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm group-hover/stop:text-emerald-300 transition-colors flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{dateObj.city}</span>
                        </span>
                        {isNearest && (
                          <span className="text-[9px] font-mono font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/35">
                            Nearest GPS
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono truncate">
                        {dateObj.venue}
                        {dateObj.support ? ` • w/ ${dateObj.support}` : ''}
                      </div>
                    </div>
                  </div>

                  <div
                    className="grid grid-cols-2 sm:flex items-center gap-1.5 shrink-0 pt-1 sm:pt-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => handleOpenStopEventPage(dateObj, e)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 hover:border-emerald-500/40 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title={`Open Event Page for ${dateObj.city} at ${dateObj.venue}`}
                    >
                      <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>Event Page</span>
                    </button>

                    {isSoldOut ? (
                      <span className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase bg-red-950/40 text-red-400 border border-red-500/30 text-center">
                        Sold Out
                      </span>
                    ) : ticketHref ? (
                      <a
                        href={ticketHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                        title={`Get tickets for ${dateObj.city}`}
                      >
                        <Ticket className="w-3 h-3 shrink-0" />
                        <span>Tickets</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleStopTickets(dateObj, e)}
                        className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Ticket className="w-3 h-3 shrink-0" />
                        <span>Tickets</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleToggleStops}
            className="w-full py-2 px-4 bg-zinc-900/90 hover:bg-zinc-900 border-t border-zinc-800 text-[11px] font-mono font-bold text-zinc-300 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Collapse Tour Dates</span>
          </button>
        </>
      )}
    </div>
  );
};
