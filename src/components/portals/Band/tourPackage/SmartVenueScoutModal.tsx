import React, { useState, useMemo } from 'react';
import { 
  Search, MapPin, Building2, BookOpen, Star, Sparkles, X, Check, 
  Phone, Mail, ArrowRightLeft, Plus, Users, Zap, Truck, Filter
} from 'lucide-react';
import { getAllBlackBookVenues, searchBlackBookVenues, VenueResult, saveVenueToBlackBook, BUILT_IN_BLACK_BOOK_VENUES } from '../../../../services/venueSearchService';
import { TourPackageStop } from '../../../../lib/tourPackageManager';
import { formatTimeTo12Hour } from '../../../../lib/timeUtils';

interface SmartVenueScoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCity?: string;
  targetStop?: TourPackageStop | null;
  allStops?: TourPackageStop[];
  onSelectVenueForNewStop?: (venue: VenueResult, targetDate?: string) => void;
  onSwapVenueForStop?: (stopId: string, venue: VenueResult) => void;
  triggerNotification?: (msg: string) => void;
}

const POPULAR_TOUR_CITIES = [
  'Nashville, TN',
  'Joliet, IL',
  'Chicago, IL',
  'Denver, CO',
  'Austin, TX',
  'Los Angeles, CA',
  'Seattle, WA',
  'Portland, OR',
  'Dallas, TX',
  'Phoenix, AZ',
  'Detroit, MI',
  'Philadelphia, PA'
];

export const SmartVenueScoutModal: React.FC<SmartVenueScoutModalProps> = ({
  isOpen,
  onClose,
  targetCity = '',
  targetStop = null,
  allStops = [],
  onSelectVenueForNewStop,
  onSwapVenueForStop,
  triggerNotification
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState<'all' | 'club' | 'mid' | 'large'>('all');
  const [allVenues, setAllVenues] = useState<VenueResult[]>(() => BUILT_IN_BLACK_BOOK_VENUES);
  const [selectedStopDate, setSelectedStopDate] = useState<string>(() => {
    if (targetStop?.date) return targetStop.date;
    if (allStops.length > 0) {
      const lastStop = allStops[allStops.length - 1];
      if (lastStop?.date) {
        const d = new Date(lastStop.date + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          return d.toISOString().split('T')[0];
        }
      }
    }
    return new Date().toISOString().split('T')[0];
  });
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);

  // Sync initial city when targetCity changes
  React.useEffect(() => {
    if (targetCity) {
      const cityPart = targetCity.split(',')[0].trim();
      setSearchQuery(cityPart);
    } else if (targetStop?.city) {
      setSearchQuery(targetStop.city);
    }
  }, [targetCity, targetStop]);

  // Load all available venues from Black Book & Built-in Database
  React.useEffect(() => {
    if (!isOpen) return;
    getAllBlackBookVenues().then(venues => {
      if (venues && venues.length > 0) {
        setAllVenues(venues);
      }
    });
  }, [isOpen]);

  // Filtered results
  const filteredVenues = useMemo(() => {
    let list = [...allVenues];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(v => 
        v.name.toLowerCase().includes(q) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.state && v.state.toLowerCase().includes(q)) ||
        (v.fullAddress && v.fullAddress.toLowerCase().includes(q)) ||
        (v.tags && v.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    // Capacity filter
    if (capacityFilter === 'club') {
      list = list.filter(v => {
        const cap = typeof v.capacity === 'number' ? v.capacity : parseInt(v.capacity || '0');
        return cap > 0 && cap <= 350;
      });
    } else if (capacityFilter === 'mid') {
      list = list.filter(v => {
        const cap = typeof v.capacity === 'number' ? v.capacity : parseInt(v.capacity || '0');
        return cap > 350 && cap <= 850;
      });
    } else if (capacityFilter === 'large') {
      list = list.filter(v => {
        const cap = typeof v.capacity === 'number' ? v.capacity : parseInt(v.capacity || '0');
        return cap > 850;
      });
    }

    return list;
  }, [allVenues, searchQuery, capacityFilter]);

  if (!isOpen) return null;

  const handleApplyVenueToStop = (venue: VenueResult) => {
    if (targetStop && onSwapVenueForStop) {
      onSwapVenueForStop(targetStop.id, venue);
      triggerNotification?.(`Swapped venue for ${targetStop.date} to "${venue.name}" (${venue.city}, ${venue.state})!`);
      onClose();
    } else if (onSelectVenueForNewStop) {
      onSelectVenueForNewStop(venue, selectedStopDate);
      triggerNotification?.(`Added "${venue.name}" (${venue.city}, ${venue.state}) to Tour Route!`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#0b0e14] border border-amber-500/50 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Centered Header Bar (No badge) */}
        <div className="p-4 sm:p-5 bg-[#0f131d] border-b border-zinc-800 text-center relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-xl mx-auto space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white uppercase font-mono tracking-wide">
              Smart Black Book Venue Scout
            </h2>
            <p className="text-xs text-zinc-400 font-mono">
              {targetStop ? (
                <span>
                  Finding replacement venue for Stop:{' '}
                  <strong className="text-amber-300">
                    {targetStop.venueName ? `${targetStop.venueName} ` : ''}({targetStop.city || 'TBD'}, {targetStop.state || 'US'})
                  </strong>{' '}
                  on {targetStop.date}
                </span>
              ) : (
                <span>Sourcing touring venues, capacities, and production contacts for your route</span>
              )}
            </p>
          </div>
        </div>

        {/* Clean Search Bar & Capacity Filter (No Quick Hubs) */}
        <div className="p-3.5 sm:p-4 bg-[#0d1017] border-b border-zinc-850 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by city (e.g. Nashville, Joliet, Denver, Kansas City) or venue name..."
                className="w-full pl-9 pr-8 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-amber-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* If adding a new stop, show Date Selector */}
            {!targetStop && (
              <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1.5 rounded-xl border border-zinc-800 shrink-0">
                <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">Stop Date:</span>
                <input
                  type="date"
                  value={selectedStopDate}
                  onChange={(e) => setSelectedStopDate(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {/* Capacity filter chips */}
            <div className="flex items-center justify-end gap-1 text-[10px] font-mono shrink-0">
              <span className="text-zinc-500 uppercase font-bold mr-1">Cap:</span>
              <button
                type="button"
                onClick={() => setCapacityFilter('all')}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  capacityFilter === 'all'
                    ? 'bg-zinc-700 text-white border-zinc-600 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setCapacityFilter('club')}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  capacityFilter === 'club'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                &lt;350
              </button>
              <button
                type="button"
                onClick={() => setCapacityFilter('mid')}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  capacityFilter === 'mid'
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                350-850
              </button>
              <button
                type="button"
                onClick={() => setCapacityFilter('large')}
                className={`px-2 py-1 rounded border transition cursor-pointer ${
                  capacityFilter === 'large'
                    ? 'bg-purple-950 text-purple-300 border-purple-500/50 font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                850+
              </button>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredVenues.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Building2 className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-mono font-bold text-zinc-300 uppercase">
                  No venues found matching "{searchQuery}"
                </p>
                <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
                  Try searching for another city, clearing capacity filters, or enter custom details directly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCapacityFilter('all');
                }}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-mono text-xs uppercase cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredVenues.map((venue) => {
                const isExpanded = expandedVenueId === venue.id;
                const isTargetStopMatch = targetStop?.city && venue.city && targetStop.city.toLowerCase() === venue.city.toLowerCase();

                return (
                  <div
                    key={venue.id}
                    className={`bg-[#0f121a] border rounded-xl p-3.5 flex flex-col justify-between transition-all hover:border-amber-500/60 ${
                      isTargetStopMatch
                        ? 'border-amber-500/40 bg-[#121622] shadow-md shadow-amber-950/20'
                        : 'border-zinc-850 hover:bg-[#121620]'
                    }`}
                  >
                    <div className="space-y-2 text-left">
                      {/* Venue Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-tight">
                              {venue.name}
                            </h3>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30 font-bold">
                              Cap: {venue.capacity || 'N/A'}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 font-sans mt-0.5">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>{venue.city}, {venue.state || 'US'}</span>
                            {venue.streetAddress && (
                              <span className="text-zinc-500 truncate text-[11px]">• {venue.streetAddress}</span>
                            )}
                          </p>
                        </div>

                        {/* Rating Badges */}
                        <div className="flex items-center gap-1 text-[10px] font-mono shrink-0">
                          {venue.payoutRating && (
                            <span className="inline-flex items-center gap-0.5 text-amber-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800" title={`Payout Rating: ${venue.payoutRating}/5`}>
                              <Star className="w-3 h-3 fill-amber-400" /> {venue.payoutRating}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Genre Tags */}
                      {venue.tags && venue.tags.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {venue.tags.map(t => (
                            <span key={t} className="text-[8.5px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Contacts & Specs Summary */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-400 bg-zinc-950/80 p-2 rounded-lg border border-zinc-900">
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">Contact:</span>
                          <span className="text-zinc-200 truncate block">{venue.contactName || 'Production PM'}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[8px] uppercase">Phone:</span>
                          <span className="text-zinc-200 truncate block">{venue.contactPhone || 'Inquire On Advance'}</span>
                        </div>
                        {venue.contactEmail && (
                          <div className="col-span-2">
                            <span className="text-zinc-500 block text-[8px] uppercase">Email:</span>
                            <span className="text-cyan-400 truncate block">{venue.contactEmail}</span>
                          </div>
                        )}
                        {venue.parkingNotes && (
                          <div className="col-span-2 pt-1 border-t border-zinc-900 font-sans text-[9.5px] text-zinc-300">
                            <strong className="text-zinc-400 font-mono">Parking/Load:</strong> {venue.parkingNotes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 mt-2 border-t border-zinc-850/80 flex items-center justify-between gap-2">
                      <span className="text-[9px] font-mono text-zinc-400">
                        {targetStop ? `Replace ${targetStop.venueName}` : `Schedule for ${selectedStopDate}`}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleApplyVenueToStop(venue)}
                        className={`px-3 py-1.5 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                          targetStop
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-950/40'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/40'
                        }`}
                      >
                        {targetStop ? (
                          <>
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            Swap into {targetStop.date}
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add as Tour Stop
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-[#0a0d12] border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-400 shrink-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Showing <strong className="text-white">{filteredVenues.length}</strong> venues in Black Book Rolodex</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
          >
            Close Scout
          </button>
        </div>

      </div>
    </div>
  );
};
