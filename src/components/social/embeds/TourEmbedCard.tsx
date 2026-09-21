import React from 'react';
import { Calendar, Ticket, ChevronDown, ChevronUp } from 'lucide-react';
import { FeedPost, MarqueeText } from '../TimelineFeed';

export interface TourEmbedCardProps {
  post: FeedPost;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectTicketShow: (dateObj: any) => void;
  onOpenTicketModal?: (ticketData: any) => void;
}

export const TourEmbedCard: React.FC<TourEmbedCardProps> = ({
  post,
  isExpanded,
  onToggleExpand,
  onSelectTicketShow,
  onOpenTicketModal,
}) => {
  const ticketData = post.ticketData;
  const tourData = post.tourData;

  const hasExplicitTickets = Boolean(
    ticketData &&
    (ticketData.ticketUrl || (ticketData.date && ticketData.date !== 'Upcoming Tour Date' && ticketData.venue))
  );

  const hasTourDates = Boolean(tourData && tourData.dates && tourData.dates.length > 0);

  if (!hasExplicitTickets && !hasTourDates) return null;

  return (
    <div className="space-y-3 my-3">
      {/* 1. Single Show Ticket Banner */}
      {hasExplicitTickets && ticketData && (
        <div className="bg-gradient-to-r from-purple-950/80 via-zinc-950 to-zinc-950 border border-purple-500/40 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-purple-900/50 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider block">
                {ticketData.venue}
              </span>
              <MarqueeText
                text={ticketData.headliner || 'LIVE CONCERT'}
                className="text-xs sm:text-sm font-mono font-bold text-white"
                maxLength={24}
              />
              <span className="text-[11px] font-mono text-zinc-400">
                {ticketData.date} • {ticketData.priceRange}
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpenTicketModal ? onOpenTicketModal(ticketData) : onSelectTicketShow({
              date: ticketData.date,
              venue: ticketData.venue,
              city: post.location || 'Local Venue',
              ticketStatus: 'available',
            })}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-mono font-bold uppercase transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span>Tickets</span>
          </button>
        </div>
      )}

      {/* 2. Expanded Multi-Stop Tour Dates Embed */}
      {tourData && (
        <div className="bg-[#0e0a12] border border-purple-900/60 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping" />
              <MarqueeText
                text={tourData.tourName}
                className="font-mono font-black text-xs sm:text-sm text-purple-300 uppercase tracking-wide"
                maxLength={26}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 shrink-0">
              {tourData.dates.length} STOPS
            </span>
          </div>

          {/* Tour Dates List */}
          <div className="space-y-1.5">
            {tourData.dates
              .slice(0, isExpanded ? undefined : 3)
              .map((dateObj, idx) => (
                <div
                  key={`tour-date-${dateObj.date}-${dateObj.city}-${idx}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-950/80 border border-zinc-900 hover:border-purple-500/40 text-xs font-mono transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-bold text-purple-400 shrink-0 text-[11px] bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-900/50">
                      {dateObj.date}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-zinc-200 block truncate">{dateObj.city}</span>
                      <span className="text-[10px] text-zinc-500 truncate block">{dateObj.venue}</span>
                    </div>
                  </div>

                  <button
                    disabled={dateObj.ticketStatus === 'sold_out'}
                    onClick={() => onSelectTicketShow(dateObj)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors shrink-0 cursor-pointer ${
                      dateObj.ticketStatus === 'sold_out'
                        ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                        : dateObj.ticketStatus === 'soon'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
                        : 'bg-purple-600 hover:bg-purple-500 text-white'
                    }`}
                  >
                    {dateObj.ticketStatus === 'sold_out' ? 'Sold Out' : dateObj.ticketStatus === 'soon' ? 'Soon' : 'Tickets'}
                  </button>
                </div>
              ))}
          </div>

          {/* Show More / Show Less Toggle */}
          {tourData.dates.length > 3 && (
            <button
              onClick={onToggleExpand}
              className="w-full py-1.5 text-center text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 bg-purple-950/30 hover:bg-purple-950/60 rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{isExpanded ? 'SHOW LESS DATES' : `VIEW ALL ${tourData.dates.length} DATES`}</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
