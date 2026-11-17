import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, X, Sparkles, Check, Building2, Globe2, Loader2 } from 'lucide-react';
import { searchVenues, VenueResult, initGooglePlacesScript } from '../../services/venueSearchService';

export interface VenueAutocompleteInputProps {
  value: string;
  onChange: (venue: string, venueData?: VenueResult) => void;
  placeholder?: string;
  theme?: {
    innerPanelBg?: string;
    inputBorder?: string;
    inputFocus?: string;
    badgeBg?: string;
    badgeText?: string;
    accentText?: string;
  };
  onClose?: () => void;
}

export const VenueAutocompleteInput: React.FC<VenueAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = 'Search Black Book or Google Places venue...',
  theme = {},
  onClose
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<VenueResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [selectedVenueData, setSelectedVenueData] = useState<VenueResult | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync external value
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Preload Google Places
  useEffect(() => {
    initGooglePlacesScript().catch(() => {});
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchVenues(q);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.warn('Venue search failed:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setQuery(newText);
    onChange(newText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(newText);
    }, 150);
  };

  const handleSelectVenue = (venue: VenueResult) => {
    const formatted = venue.displayText || venue.name;
    setQuery(formatted);
    setSelectedVenueData(venue);
    onChange(formatted, venue);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onChange(query);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectVenue(suggestions[selectedIndex]);
      } else {
        onChange(query);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSelectedVenueData(null);
    onChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <div className="relative flex items-center">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          ) : (
            <Search className="w-4 h-4 text-zinc-400" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length > 0) {
              performSearch(query);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full ${theme.innerPanelBg || 'bg-zinc-950'} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder || 'border-zinc-800'} rounded-xl pl-9 pr-16 py-2.5 font-mono focus:outline-none focus:border-rose-500 transition-all ${theme.inputFocus || ''}`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
              title="Clear Venue"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* AUTOCOMPLETE DROPDOWN */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#0c0d12] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto">
          <div className="px-3 py-1.5 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            <span>Suggested Venues ({suggestions.length})</span>
            <span className="text-[8px] text-zinc-600">Press ↵ Enter to select</span>
          </div>

          <div className="p-1 space-y-0.5">
            {suggestions.map((venue, idx) => {
              const isSelected = idx === selectedIndex;
              const isBlackBook = venue.source === 'blackbook';

              return (
                <div
                  key={venue.id || `v-opt-${idx}`}
                  onClick={() => handleSelectVenue(venue)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-lg flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-rose-950/40 border border-rose-800/40 text-white'
                      : 'hover:bg-zinc-900/80 text-zinc-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 shrink-0 mt-0.5">
                      {isBlackBook ? (
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Globe2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate font-mono">
                          {venue.name}
                        </span>
                        {isBlackBook ? (
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 px-1.5 py-0.2 rounded shrink-0">
                            📓 Black Book
                          </span>
                        ) : (
                          <span className="text-[8px] font-mono font-black uppercase tracking-wider bg-sky-950/80 border border-sky-700/60 text-sky-300 px-1.5 py-0.2 rounded shrink-0">
                            📍 Google Places
                          </span>
                        )}
                      </div>

                      <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                        {venue.fullAddress || [venue.streetAddress, venue.city, venue.state].filter(Boolean).join(', ') || venue.displayText}
                      </div>

                      {isBlackBook && (venue.capacity || venue.payoutRating || venue.genreFit) && (
                        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 mt-1">
                          {venue.capacity && (
                            <span className="text-emerald-400 font-bold">Cap: {venue.capacity}</span>
                          )}
                          {venue.payoutRating && (
                            <span>• Payout: ★ {venue.payoutRating}</span>
                          )}
                          {venue.genreFit && (
                            <span>• Fit: {venue.genreFit}%</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-zinc-600 pt-1">
                    <Check className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'opacity-0'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Tagged Venue Summary Card */}
      {value && (
        <div className="flex items-center justify-between gap-2 p-2 bg-zinc-950/70 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] font-mono font-bold text-white truncate block">
                {value}
              </span>
              <span className="text-[9px] font-mono text-zinc-500">
                {selectedVenueData?.source === 'blackbook' ? '📓 Black Book Verified Venue' : '📍 Location Tagged'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[9px] font-mono uppercase tracking-wider shrink-0 transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default VenueAutocompleteInput;
