import React from 'react';
import { MapPin, Calendar, Ticket, Sparkles, ExternalLink } from 'lucide-react';
import { calculateShowDistanceMiles } from '../../../utils/showDisplayUtils';

export interface GigProximityPillProps {
  post: any;
  userProfile?: any;
  onSelectTicketShow?: (showData: any) => void;
  onOpenTicketModal?: (eventData: any) => void;
}

export const GigProximityPill: React.FC<GigProximityPillProps> = ({
  post,
  userProfile,
  onSelectTicketShow,
  onOpenTicketModal,
}) => {
  if (!post) return null;

  const ticketData = post.ticketData;
  const tourData = post.tourData;
  const isEventBroadcast = post.postType === 'event_broadcast';

  let nearestShow: any = null;

  if (tourData && Array.isArray(tourData.dates) && tourData.dates.length > 0) {
    const explicitNearest =
      tourData.nearestStop ||
      tourData.dates.find((d: any) => d?.isNearestToUser);

    let bestStop = explicitNearest || tourData.dates[0];
    if (!explicitNearest) {
      let bestDist = calculateShowDistanceMiles(bestStop, userProfile);
      for (const stop of tourData.dates) {
        const dist = calculateShowDistanceMiles(stop, userProfile);
        if (dist < bestDist) {
          bestDist = dist;
          bestStop = stop;
        }
      }
    }

    const distMiles = calculateShowDistanceMiles(bestStop, userProfile);
    const resolvedTicketUrl =
      bestStop.ticketUrl ||
      bestStop.external_ticket_url ||
      bestStop.ticket_url ||
      tourData.ticketUrl ||
      '';

    nearestShow = {
      ...bestStop,
      id: bestStop.id || post.id,
      headliner:
        bestStop.headliner ||
        tourData.headliner ||
        post.author?.bandName ||
        post.author?.name ||
        post.user?.name ||
        'Live Tour',
      support:
        bestStop.support ||
        (Array.isArray(tourData.supportBands) ? tourData.supportBands.join(', ') : ''),
      support_bands:
        bestStop.support_bands ||
        (Array.isArray(tourData.supportBands) ? tourData.supportBands : []),
      venue: bestStop.venue || 'Venue TBA',
      city: bestStop.city || 'Your Area',
      date: bestStop.date || bestStop.rawDate || 'Upcoming',
      rawDate: bestStop.rawDate || bestStop.show_date || bestStop.date || '',
      time: bestStop.time || '7:00 PM',
      price: bestStop.price || bestStop.priceRange || '$25',
      ticketUrl: resolvedTicketUrl,
      external_ticket_url: resolvedTicketUrl,
      flyer_url: bestStop.flyer_url || bestStop.flyerUrl || tourData.flyerUrl || post.image_url,
      distanceMiles: distMiles,
      totalTourStops: tourData.dates.length,
    };
  } else if (ticketData) {
    const distMiles = calculateShowDistanceMiles(ticketData, userProfile);
    nearestShow = {
      ...ticketData,
      id: ticketData.id || post.id,
      headliner:
        ticketData.headliner ||
        post.author?.bandName ||
        post.author?.name ||
        post.user?.name ||
        'Live Show',
      venue: ticketData.venue || 'Local Venue',
      city: ticketData.city || post.location || 'Near You',
      date: ticketData.date || 'Upcoming',
      time: ticketData.time || '8:00 PM',
      price: ticketData.price || '$20',
      ticketUrl: ticketData.ticketUrl || ticketData.external_ticket_url || '',
      external_ticket_url: ticketData.external_ticket_url || ticketData.ticketUrl || '',
      flyer_url: ticketData.flyer_url || post.image_url,
      distanceMiles: distMiles,
    };
  } else if (isEventBroadcast) {
    nearestShow = {
      id: post.id,
      headliner: post.author?.bandName || post.author?.name || post.user?.name || 'Live Event',
      venue: post.location || 'Main Stage',
      city: post.location || 'Local Area',
      date: 'This Weekend',
      time: '8:00 PM',
      price: '$20',
    };
  }

  if (!nearestShow) return null;

  const handleOpenEventPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenTicketModal) {
      onOpenTicketModal(nearestShow);
    } else if (onSelectTicketShow) {
      onSelectTicketShow(nearestShow);
    }
  };

  const handleGetTickets = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectTicketShow) {
      onSelectTicketShow(nearestShow);
    } else if (onOpenTicketModal) {
      onOpenTicketModal(nearestShow);
    }
  };

  const externalTicketHref =
    nearestShow.external_ticket_url || nearestShow.ticketUrl || '';

  const proximityLabel =
    Number.isFinite(nearestShow.distanceMiles) && nearestShow.distanceMiles < 2500
      ? nearestShow.distanceMiles < 15
        ? 'In Your Area'
        : `${Math.round(nearestShow.distanceMiles)} mi away`
      : null;

  return (
    <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/55 via-zinc-900/95 to-zinc-950 border border-emerald-500/35 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
      {/* Top / Left Info Block: Full width on mobile so text never squishes */}
      <button
        type="button"
        onClick={handleOpenEventPage}
        className="w-full sm:w-auto sm:flex-1 min-w-0 flex items-start sm:items-center gap-2.5 text-left cursor-pointer group/pill"
        title="Open official event page for this tour stop"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <MapPin className="w-4 h-4 text-emerald-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap leading-tight">
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-400">
              Nearest Tour Stop
            </span>
            {proximityLabel && (
              <span className="text-[10px] font-mono font-semibold text-emerald-300/90">
                • {proximityLabel}
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-300 inline-flex items-center gap-1">
              • <Calendar className="w-2.5 h-2.5 text-emerald-400 inline" /> {nearestShow.date}
            </span>
          </div>

          <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5 leading-snug group-hover/pill:text-emerald-300 transition-colors break-words">
            <span className="text-emerald-300">{nearestShow.city}</span> — {nearestShow.venue}
          </p>
          <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
            {nearestShow.headliner}
            {nearestShow.support ? ` w/ ${nearestShow.support}` : ''}
          </p>
        </div>
      </button>

      {/* Bottom / Right Action Row: 2 equal-width buttons on mobile, compact inline on desktop */}
      <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-emerald-500/15">
        <button
          type="button"
          onClick={handleOpenEventPage}
          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/[0.14] hover:border-emerald-500/40 text-zinc-100 hover:text-white font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Event Page</span>
        </button>

        {externalTicketHref ? (
          <a
            href={externalTicketHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.28)] cursor-pointer"
          >
            <Ticket className="w-3 h-3 shrink-0" />
            <span>Tickets</span>
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
          </a>
        ) : (
          <button
            type="button"
            onClick={handleGetTickets}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(16,185,129,0.28)] cursor-pointer"
          >
            <Ticket className="w-3 h-3 shrink-0" />
            <span>Tickets • {nearestShow.price}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default GigProximityPill;
