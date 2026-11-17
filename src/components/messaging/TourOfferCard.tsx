import React, { useState } from 'react';
import { Calendar, Check, ExternalLink, MapPin, DollarSign, Repeat2 } from 'lucide-react';
import { OfferCardPayload } from '../../utils/groupMessagingUtils';

interface TourOfferCardProps {
  card: OfferCardPayload;
  resolvedStatus?: {
    status: 'pending' | 'accepted' | 'countered';
    guarantee?: string;
    respondedBy?: string;
  };
  isSentByMe: boolean;
  onAcceptOffer?: (card: OfferCardPayload) => void;
  onCounterOffer?: (card: OfferCardPayload, counterGuarantee: string, note: string) => void;
  onViewShow?: (card: OfferCardPayload) => void;
}

export const TourOfferCard: React.FC<TourOfferCardProps> = ({
  card,
  resolvedStatus,
  isSentByMe,
  onAcceptOffer,
  onCounterOffer,
  onViewShow,
}) => {
  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState(card.guarantee || '');
  const [counterNote, setCounterNote] = useState('');

  if (card.type === 'offer_response') {
    return (
      <div className="w-full min-w-[215px] rounded-xl p-2.5 bg-[#0b0d12] border border-white/[0.08]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-zinc-400">
            {card.status === 'accepted' ? 'Offer Accepted' : 'Counter Offer Sent'}
          </span>
          <span
            className={`text-[11px] font-semibold ${
              card.status === 'accepted' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {card.status === 'accepted' ? 'Confirmed' : 'Countered'}
          </span>
        </div>
        <p className="text-xs font-semibold text-white mt-1">{card.title}</p>
        {card.guarantee && (
          <p className="text-[11px] text-zinc-300 mt-0.5 tabular-nums">{card.guarantee}</p>
        )}
        {card.terms && (
          <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{card.terms}</p>
        )}
      </div>
    );
  }

  const effectiveStatus = resolvedStatus?.status || card.status || 'pending';
  const effectiveGuarantee = resolvedStatus?.guarantee || card.guarantee;
  const isShowShare = card.type === 'show_share';

  return (
    <div
      className={`w-full min-w-[235px] sm:min-w-[275px] rounded-xl p-3 border transition-colors ${
        isSentByMe
          ? 'bg-black/35 border-rose-500/25'
          : 'bg-[#0b0d12] border-white/[0.09]'
      }`}
    >
      {/* Header row with unboxed metadata */}
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="text-rose-400 font-semibold">
          {isShowShare ? 'Show Lineup' : 'Tour Booking Offer'}
        </span>
        {!isShowShare && (
          <span
            className={`font-semibold ${
              effectiveStatus === 'accepted'
                ? 'text-emerald-400'
                : effectiveStatus === 'countered'
                ? 'text-amber-400'
                : 'text-zinc-400'
            }`}
          >
            {effectiveStatus === 'accepted'
              ? 'Accepted'
              : effectiveStatus === 'countered'
              ? 'Countered'
              : 'Pending'}
          </span>
        )}
      </div>

      <h4 className="text-sm font-bold text-white mt-1 leading-snug">{card.title}</h4>

      {/* Structured venue, date & terms */}
      <div className="mt-2 space-y-1 text-[11px] text-zinc-300">
        {(card.venue || card.city) && (
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">
              {[card.venue, card.city].filter(Boolean).join(' · ')}
            </span>
          </p>
        )}
        {card.date && (
          <p className="flex items-center gap-1.5 tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{card.date}</span>
          </p>
        )}
        {effectiveGuarantee && (
          <p className="flex items-center gap-1.5 text-emerald-300 font-medium tabular-nums">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{effectiveGuarantee}</span>
          </p>
        )}
      </div>

      {card.terms && (
        <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed border-t border-white/[0.06] pt-2">
          {card.terms}
        </p>
      )}

      {resolvedStatus?.respondedBy && (
        <p className="text-[10px] text-zinc-500 mt-1.5">
          Updated by {resolvedStatus.respondedBy}
        </p>
      )}

      {/* Inline Counter Form */}
      {isCounterOpen && !isShowShare && (
        <div className="mt-2.5 pt-2.5 border-t border-white/[0.07] space-y-2">
          <input
            type="text"
            value={counterAmount}
            onChange={(e) => setCounterAmount(e.target.value)}
            placeholder="Proposed guarantee (e.g. $1,200 + door)"
            className="w-full bg-[#141720] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60"
          />
          <input
            type="text"
            value={counterNote}
            onChange={(e) => setCounterNote(e.target.value)}
            placeholder="Notes (backline, hospitality, curfew)..."
            className="w-full bg-[#141720] border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-rose-500/60"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (onCounterOffer) {
                  onCounterOffer(
                    card,
                    counterAmount.trim() || card.guarantee || 'Revised guarantee',
                    counterNote.trim()
                  );
                }
                setIsCounterOpen(false);
              }}
              className="flex-1 min-h-[36px] rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Send Counter
            </button>
            <button
              type="button"
              onClick={() => setIsCounterOpen(false)}
              className="px-3 min-h-[36px] rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* One-Tap Action Row */}
      <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center gap-1.5 flex-wrap">
        {!isShowShare && !isSentByMe && effectiveStatus !== 'accepted' && onAcceptOffer && (
          <button
            type="button"
            onClick={() => onAcceptOffer(card)}
            className="flex-1 min-h-[38px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept</span>
          </button>
        )}

        {!isShowShare && !isSentByMe && effectiveStatus !== 'accepted' && onCounterOffer && (
          <button
            type="button"
            onClick={() => setIsCounterOpen((v) => !v)}
            className="flex-1 min-h-[38px] px-3 rounded-lg bg-white/[0.07] hover:bg-white/[0.12] text-zinc-100 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Repeat2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Counter</span>
          </button>
        )}

        {(card.showId || card.title) && onViewShow && (
          <button
            type="button"
            onClick={() => onViewShow(card)}
            className="min-h-[38px] px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
            <span>View Show</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default TourOfferCard;
