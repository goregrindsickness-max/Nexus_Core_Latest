import React, { useState, useEffect, useMemo } from 'react';
import { Flame, Ticket, MapPin, Calendar, Compass, ChevronRight, Check } from 'lucide-react';
import { FeedPost } from './types';

interface GigProximityPillProps {
  post: FeedPost;
  userProfile?: any;
  onOpenTicketModal?: (ticketData: any) => void;
  onSelectTicketShow?: (dateObj: any) => void;
}

// Default list of notable metal scene hubs
const DEFAULT_POPULAR_CITIES = [
  'Seattle, WA',
  'Los Angeles, CA',
  'Chicago, IL',
  'Austin, TX',
  'New York, NY',
  'Denver, CO',
  'Philadelphia, PA',
  'London, UK',
  'Toronto, ON',
  'Berlin, DE'
];

export const GigProximityPill: React.FC<GigProximityPillProps> = ({
  post,
  userProfile,
  onOpenTicketModal,
  onSelectTicketShow,
}) => {
  const [userCity, setUserCity] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nexus_user_scene_city');
      if (stored) return stored;
    }
    return userProfile?.city || userProfile?.location || 'Seattle, WA';
  });

  const [isCityPickerOpen, setIsCityPickerOpen] = useState<boolean>(false);
  const [customCityInput, setCustomCityInput] = useState<string>('');

  // Listen for scene city changes globally
  useEffect(() => {
    const handleCityUpdate = (e: any) => {
      if (e.detail?.city) {
        setUserCity(e.detail.city);
      }
    };
    window.addEventListener('nexus_scene_city_changed', handleCityUpdate);
    return () => window.removeEventListener('nexus_scene_city_changed', handleCityUpdate);
  }, []);

  const handleSelectCity = (newCity: string) => {
    setUserCity(newCity);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_user_scene_city', newCity);
      window.dispatchEvent(new CustomEvent('nexus_scene_city_changed', { detail: { city: newCity } }));
    }
    setIsCityPickerOpen(false);
    setCustomCityInput('');
  };

  // Find matching or closest tour date for this post ONLY if explicit tourData, ticketData, or eventData exists
  const gigMatch = useMemo(() => {
    const normUserCity = userCity.toLowerCase().trim();
    const cityPrimary = normUserCity.split(',')[0].trim();

    // 1. Check if post has explicit ticketData with real ticketUrl or valid date
    if (post.ticketData && (post.ticketData.ticketUrl || (post.ticketData.date && post.ticketData.date !== 'Upcoming Tour Date' && post.ticketData.venue))) {
      const venueLower = (post.ticketData.venue || '').toLowerCase();
      const headliner = post.ticketData.headliner || post.authorName || 'Live Gig';
      const isLocal = venueLower.includes(cityPrimary) || (post.location && post.location.toLowerCase().includes(cityPrimary));
      return {
        isExactCity: isLocal,
        city: isLocal ? userCity : (post.location || 'Your Region'),
        venue: post.ticketData.venue || 'Underground Stage',
        date: post.ticketData.date || 'Tour Date',
        price: post.ticketData.priceRange || '$20',
        headliner: headliner,
        ticketData: post.ticketData,
        distanceText: isLocal ? '~8 mi away' : 'Touring Region'
      };
    }

    // 2. Check if post has tourData dates
    if (post.tourData && post.tourData.dates && post.tourData.dates.length > 0) {
      const matchingDate = post.tourData.dates.find(d => 
        d.city.toLowerCase().includes(cityPrimary) || 
        cityPrimary.includes(d.city.toLowerCase().split(',')[0])
      );
      if (matchingDate) {
        return {
          isExactCity: true,
          city: matchingDate.city,
          venue: matchingDate.venue,
          date: matchingDate.date,
          price: matchingDate.priceRange || '$22',
          headliner: post.tourData.tourName || post.authorName,
          dateObj: matchingDate,
          distanceText: '~12 mi away'
        };
      }
      // If no exact match, show the next upcoming stop on the tour
      const firstStop = post.tourData.dates[0];
      return {
        isExactCity: false,
        city: firstStop.city,
        venue: firstStop.venue,
        date: firstStop.date,
        price: firstStop.priceRange || '$20',
        headliner: post.tourData.tourName || post.authorName,
        dateObj: firstStop,
        distanceText: 'Next Tour Stop'
      };
    }

    // 3. Check if post has eventData with real date or venue
    if (post.eventData && (post.eventData.date || post.eventData.venue || post.eventData.locationName || post.eventData.ticketUrl)) {
      const isLocal = post.eventData.city?.toLowerCase().includes(cityPrimary) || post.location?.toLowerCase().includes(cityPrimary);
      return {
        isExactCity: Boolean(isLocal),
        city: post.eventData.city || userCity,
        venue: post.eventData.venue || post.eventData.locationName || 'Local Pit',
        date: post.eventData.date || 'Upcoming Show',
        price: post.eventData.price || post.eventData.cost || 'Free / $10',
        headliner: post.eventData.title || post.authorName,
        eventData: post.eventData,
        distanceText: isLocal ? '~5 mi away' : 'Regional Event'
      };
    }

    return null;
  }, [post, userCity]);

  if (!gigMatch) return null;

  const handleTicketClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenTicketModal && gigMatch.ticketData) {
      onOpenTicketModal(gigMatch.ticketData);
    } else if (onSelectTicketShow && gigMatch.dateObj) {
      onSelectTicketShow(gigMatch.dateObj);
    } else if (onOpenTicketModal) {
      onOpenTicketModal({
        headliner: gigMatch.headliner,
        venue: gigMatch.venue,
        date: gigMatch.date,
        priceRange: gigMatch.price
      });
    }
  };

  return (
    <div className="relative z-10 my-1.5">
      <div className={`rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2.5 transition-all border shadow-lg ${
        gigMatch.isExactCity
          ? 'bg-gradient-to-r from-amber-950/80 via-purple-950/40 to-zinc-950 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
          : 'bg-gradient-to-r from-purple-950/60 via-zinc-950 to-zinc-950 border-purple-800/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
      }`}>
        {/* Left icon & Details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
            gigMatch.isExactCity
              ? 'bg-amber-900/60 border-amber-400/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
              : 'bg-purple-900/60 border-purple-400/70 text-purple-300'
          }`}>
            <Flame className="w-4 h-4 fill-current animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.2 rounded border flex items-center gap-1 ${
                gigMatch.isExactCity
                  ? 'bg-amber-950 text-amber-300 border-amber-500/60'
                  : 'bg-purple-950 text-purple-300 border-purple-500/50'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                {gigMatch.isExactCity ? `🔥 PLAYING NEAR YOU (${gigMatch.distanceText})` : `📍 TOUR PROXIMITY: ${gigMatch.city}`}
              </span>

              {/* Scene city button (clickable to change city filter) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCityPickerOpen(prev => !prev);
                }}
                className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase flex items-center gap-0.5 hover:underline cursor-pointer"
                title="Change your scene city"
              >
                <MapPin className="w-2.5 h-2.5 text-rose-400" />
                <span>Scene: <strong className="text-zinc-200">{userCity}</strong></span>
              </button>
            </div>

            <div className="text-xs font-mono font-bold text-white truncate mt-0.5 flex items-center gap-1.5">
              <span className="truncate">{gigMatch.venue}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-purple-300 shrink-0">{gigMatch.date}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleTicketClick}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md ${
            gigMatch.isExactCity
              ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Get Tickets</span>
          <span>({gigMatch.price})</span>
          <ChevronRight className="w-3 h-3 hidden sm:inline" />
        </button>
      </div>

      {/* Quick City Switcher Popover */}
      {isCityPickerOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0e0f14] border border-zinc-700/80 rounded-2xl p-3.5 shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white uppercase">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Your Scene Hub / Proximity City</span>
            </div>
            <button
              onClick={() => setIsCityPickerOpen(false)}
              className="text-zinc-500 hover:text-white text-xs px-1.5 py-0.5 rounded bg-zinc-900"
            >
              Done
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_POPULAR_CITIES.map((c, cIdx) => (
              <button
                key={`city-${c}-${cIdx}`}
                onClick={() => handleSelectCity(c)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer ${
                  userCity === c
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                }`}
              >
                {userCity === c && <Check className="w-3 h-3" />}
                {c}
              </button>
            ))}
          </div>

          {/* Custom city input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customCityInput.trim()) {
                handleSelectCity(customCityInput.trim());
              }
            }}
            className="flex gap-2 pt-1"
          >
            <input
              type="text"
              value={customCityInput}
              onChange={(e) => setCustomCityInput(e.target.value)}
              placeholder="Or enter custom city (e.g. Portland, OR)..."
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-black text-white text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
            >
              Set City
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
