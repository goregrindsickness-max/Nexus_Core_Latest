import React from 'react';
import { Calendar, MapPin, EyeOff, Tag, Users, Check } from 'lucide-react';
import { FeedPost, MarqueeText } from '../TimelineFeed';

export interface EventEmbedCardProps {
  post?: FeedPost;
  postId?: string;
  eventData?: {
    eventTitle: string;
    date: string;
    venue: string;
    city: string;
    isSecretLocation?: boolean;
    flyerUrl?: string;
    category?: string;
    lineup?: string[];
    description?: string;
    rsvpCount?: number;
  };
  isRsvped?: boolean;
  rsvpCount?: number;
  rsvpedEvents?: Record<string, boolean>;
  rsvpCounts?: Record<string, number>;
  onToggleRsvp?: (postId: string) => void;
  handleToggleRsvp?: (postId: string) => void;
}

export const EventEmbedCard: React.FC<EventEmbedCardProps> = ({
  post,
  postId,
  eventData,
  isRsvped: propIsRsvped,
  rsvpCount: propRsvpCount,
  rsvpedEvents,
  rsvpCounts,
  onToggleRsvp,
  handleToggleRsvp,
}) => {
  const actualPostId = postId || post?.id || '';
  const actualEventData = eventData || post?.eventData;

  if (!actualEventData) return null;

  const isRsvped = propIsRsvped !== undefined
    ? propIsRsvped
    : rsvpedEvents
    ? Boolean(rsvpedEvents[actualPostId])
    : false;

  const displayRsvpCount = propRsvpCount !== undefined
    ? propRsvpCount
    : (rsvpCounts && rsvpCounts[actualPostId] !== undefined)
    ? rsvpCounts[actualPostId]
    : (actualEventData.rsvpCount || 42);

  const toggleHandler = onToggleRsvp || handleToggleRsvp || (() => {});

  return (
    <div className="bg-[#0b0c10] border-2 border-red-900/60 hover:border-red-500/80 rounded-2xl p-4 sm:p-5 shadow-[0_0_25px_rgba(239,68,68,0.2)] hover:shadow-[0_0_35px_rgba(239,68,68,0.35)] transition-all my-3 space-y-4 group/event">
      {/* Top Banner with Category & Secret Flag */}
      <div className="flex items-center justify-between gap-2 border-b border-zinc-850 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-red-950 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-mono font-black text-red-500 uppercase tracking-widest block">
              {actualEventData.category || 'UNDERGROUND GIG & DIY SHOW'}
            </span>
            <MarqueeText
              text={actualEventData.eventTitle}
              className="text-sm sm:text-base font-mono font-black text-white"
              maxLength={26}
            />
          </div>
        </div>

        {actualEventData.isSecretLocation ? (
          <span className="bg-amber-950/90 text-amber-300 border border-amber-500/50 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <EyeOff className="w-3 h-3 text-amber-400" />
            SECRET LOCATION
          </span>
        ) : (
          <span className="bg-red-950/80 text-red-400 border border-red-900 text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full shrink-0">
            CONFIRMED VENUE
          </span>
        )}
      </div>

      {/* Main Content: Flyer Poster & Info Grid */}
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        {actualEventData.flyerUrl && (
          <div className="w-full sm:w-36 h-48 sm:h-44 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shrink-0 shadow-lg relative group/flyer">
            <img
              src={actualEventData.flyerUrl}
              alt={actualEventData.eventTitle}
              className="w-full h-full object-cover group-hover/flyer:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Analepsy%20-%20Quinscence.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
            <span className="absolute bottom-1.5 left-1.5 text-[8px] font-mono font-black text-white bg-black/80 px-1.5 py-0.5 rounded border border-white/20">
              FLYER
            </span>
          </div>
        )}

        <div className="space-y-2.5 min-w-0 flex-1 w-full">
          {/* Date & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-zinc-950/90 border border-zinc-850 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold">DATE & TIME</span>
              <span className="font-bold text-red-400">{actualEventData.date}</span>
            </div>
            <div className="bg-zinc-950/90 border border-zinc-850 p-2.5 rounded-xl">
              <span className="text-[10px] text-zinc-500 block uppercase font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" /> LOCATION
              </span>
              <span className="font-bold text-zinc-200 block truncate">
                {actualEventData.venue}, {actualEventData.city}
              </span>
            </div>
          </div>

          {/* Lineup Tags */}
          {actualEventData.lineup && actualEventData.lineup.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold flex items-center gap-1">
                <Tag className="w-3 h-3 text-red-500" /> LINEUP
              </span>
              <div className="flex flex-wrap gap-1.5">
                {actualEventData.lineup.map((band, idx) => (
                  <span
                    key={`event-lineup-${band}-${idx}`}
                    className="text-[10px] font-mono font-bold bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md hover:border-red-500/50 hover:text-white transition-colors"
                  >
                    {band}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {actualEventData.description && (
            <p className="text-xs font-sans text-zinc-400 leading-relaxed bg-zinc-950/40 p-2 rounded-lg border border-zinc-900">
              {actualEventData.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer: RSVP Action & Count */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-850">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Users className="w-4 h-4 text-red-500" />
          <span>
            <strong className="text-white font-bold">{displayRsvpCount}</strong> metalheads going
          </span>
        </div>

        <button
          onClick={() => toggleHandler(actualPostId)}
          className={`px-4 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
            isRsvped
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105'
          }`}
        >
          {isRsvped ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>RSVP'D (YOU'RE IN)</span>
            </>
          ) : (
            <>
              <Calendar className="w-3.5 h-3.5" />
              <span>RSVP / ATTEND SHOW</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
