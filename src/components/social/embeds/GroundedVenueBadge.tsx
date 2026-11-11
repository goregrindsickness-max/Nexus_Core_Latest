import React, { useState } from 'react';
import { MapPin, ExternalLink, Navigation, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { detectGroundedVenue, GroundedVenueData } from '../../../services/venueGroundingService';

interface GroundedVenueBadgeProps {
  postText?: string;
  initialVenueData?: GroundedVenueData | null;
  onVenueResolved?: (data: GroundedVenueData) => void;
  className?: string;
}

export const GroundedVenueBadge: React.FC<GroundedVenueBadgeProps> = ({
  postText = '',
  initialVenueData = null,
  onVenueResolved,
  className = ''
}) => {
  const [venueData, setVenueData] = useState<GroundedVenueData | null>(initialVenueData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(Boolean(initialVenueData));

  const handleDetectVenue = async () => {
    if (!postText.trim() || isLoading) return;
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await detectGroundedVenue(postText);
      if (res) {
        setVenueData(res);
        onVenueResolved?.(res);
      }
    } catch (err) {
      console.warn('Venue grounding error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // If no initial venue data and no search done, render compact trigger button if text seems location-related
  const seemsLocationRelated = React.useMemo(() => {
    const lower = postText.toLowerCase();
    return (
      lower.includes('at ') ||
      lower.includes('playing ') ||
      lower.includes('venue') ||
      lower.includes('bar') ||
      lower.includes('stage') ||
      lower.includes('live at') ||
      lower.includes('show') ||
      lower.includes('fest') ||
      lower.includes('hall') ||
      lower.includes('theater') ||
      lower.includes('theatre') ||
      lower.includes('club')
    );
  }, [postText]);

  if (!venueData && !hasSearched) {
    if (!seemsLocationRelated) return null;
    return (
      <div className={`mt-2 ${className}`}>
        <button
          type="button"
          onClick={handleDetectVenue}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono transition-all shadow-sm cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span>{isLoading ? 'Grounding Venue...' : '📍 Ground Venue with Google Maps'}</span>
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`mt-2.5 p-3 rounded-2xl bg-zinc-950/80 border border-emerald-500/40 flex items-center gap-2.5 text-xs font-mono text-emerald-400 animate-pulse ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
        <span>Querying Google Maps Platform for verified venue location...</span>
      </div>
    );
  }

  if (!venueData || !venueData.hasVenue) {
    if (hasSearched) {
      return (
        <div className={`mt-2 text-[11px] font-mono text-zinc-500 italic ${className}`}>
          No verified music venue grounding match found for this transmission.
        </div>
      );
    }
    return null;
  }

  const primarySource = venueData.mapsSources[0];
  const mapsUri = primarySource?.uri || (venueData.groundingChunks?.[0]?.maps?.uri ?? null);
  const venueTitle = primarySource?.title || 'Verified Venue';

  return (
    <div className={`mt-3 rounded-2xl bg-[#03140c]/90 border border-emerald-500/50 p-3.5 shadow-lg shadow-emerald-950/30 font-sans relative overflow-hidden ${className}`}>
      {/* Background Accent Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Pill */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-900/60 pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold font-mono text-[11px] tracking-wider uppercase text-emerald-400 flex items-center gap-1">
            Google Maps Grounded
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          </span>
        </div>
        <span className="text-[9px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full font-bold">
          Verified Location
        </span>
      </div>

      {/* Venue Title */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
          {venueTitle}
        </h4>
        {venueData.responseText && (
          <p className="text-xs text-emerald-200/90 leading-relaxed font-sans line-clamp-3">
            {venueData.responseText.replace(/NO_VENUE_DETECTED/g, '').trim()}
          </p>
        )}
      </div>

      {/* Maps Grounding Links */}
      {mapsUri && (
        <div className="mt-3 pt-2.5 border-t border-emerald-900/50 flex items-center justify-between gap-2 flex-wrap">
          <a
            href={mapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venueTitle)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 font-mono text-[11px] transition-colors cursor-pointer"
          >
            <span>Get Directions</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
