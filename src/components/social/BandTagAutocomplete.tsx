import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Music, X, Check, ShieldCheck, Disc3, Loader2, Plus } from 'lucide-react';
import { searchBandProfiles, BandProfileOption } from '../../services/bandProfileSearchService';

export interface BandTagAutocompleteProps {
  taggedBands: string[];
  onAddBand: (bandName: string) => void;
  onRemoveBand: (bandName: string) => void;
  availableBands?: any[];
  theme?: {
    innerPanelBg?: string;
    inputBorder?: string;
    inputFocus?: string;
    badgeBg?: string;
    badgeText?: string;
    accentText?: string;
    accentBg?: string;
    accentBorder?: string;
    attachedTagBg?: string;
  };
  onClose?: () => void;
}

export const BandTagAutocomplete: React.FC<BandTagAutocompleteProps> = ({
  taggedBands = [],
  onAddBand,
  onRemoveBand,
  availableBands = [],
  theme = {},
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<BandProfileOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(null);

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

  // Fetch suggestions
  const fetchSuggestions = useCallback(
    async (q: string) => {
      setIsLoading(true);
      try {
        const results = await searchBandProfiles(q, availableBands);
        setSuggestions(results);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.warn('Failed to search band profiles:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [availableBands]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 120);
  };

  const handleSelectBand = (bandName: string) => {
    const cleanName = bandName.trim().toUpperCase();
    if (!cleanName) return;

    if (!taggedBands.includes(cleanName)) {
      onAddBand(cleanName);
    }
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleAddCustom = () => {
    if (query.trim()) {
      handleSelectBand(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustom();
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
        handleSelectBand(suggestions[selectedIndex].name);
      } else {
        handleAddCustom();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const hasExactMatch = suggestions.some(
    (s) => s.name.toLowerCase().trim() === query.toLowerCase().trim()
  );

  return (
    <div ref={containerRef} className="space-y-2.5">
      {/* Search Input Bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
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
            placeholder="Search band profiles (e.g. Cordyceps, Dying Fetus, Tomb Mold)..."
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              fetchSuggestions(query);
            }}
            onKeyDown={handleKeyDown}
            className={`w-full ${theme.innerPanelBg || 'bg-zinc-950'} text-xs text-white placeholder:text-zinc-600 border ${theme.inputBorder || 'border-zinc-800'} rounded-xl pl-9 pr-10 py-2.5 font-mono focus:outline-none focus:border-rose-500 transition-all ${theme.inputFocus || ''}`}
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddCustom}
          disabled={!query.trim()}
          className={`px-3 py-2.5 ${theme.badgeBg || 'bg-zinc-900'} hover:${theme.accentBg || 'bg-zinc-800'} ${theme.badgeText || 'text-zinc-300'} text-xs font-mono font-bold rounded-xl border ${theme.accentBorder || 'border-zinc-700'} disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0 transition-colors`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ADD</span>
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 z-50 bg-[#0c0d12] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto">
            <div className="px-3 py-1.5 bg-zinc-950/80 border-b border-zinc-900 flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              <span>Band Profiles ({suggestions.length})</span>
              <span className="text-[8px] text-zinc-600">Select to tag</span>
            </div>

            <div className="p-1 space-y-1">
              {suggestions.map((band, idx) => {
                const isSelected = idx === selectedIndex;
                const isAlreadyTagged = taggedBands.includes(band.name.toUpperCase());

                return (
                  <div
                    key={band.id || `band-opt-${idx}`}
                    onClick={() => handleSelectBand(band.name)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`p-2 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isAlreadyTagged
                        ? 'bg-zinc-900/40 opacity-70 cursor-default'
                        : isSelected
                        ? 'bg-rose-950/50 border border-rose-800/40 text-white'
                        : 'hover:bg-zinc-900/80 text-zinc-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Avatar / Logo */}
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                        {band.avatar ? (
                          <img
                            src={band.avatar}
                            alt={band.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Disc3 className="w-4 h-4 text-rose-400" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate font-mono">
                            {band.name}
                          </span>
                          {band.isVerified ? (
                            <span className="flex items-center gap-0.5 text-[8px] font-mono font-bold bg-amber-950/70 border border-amber-600/60 text-amber-300 px-1 py-0.2 rounded shrink-0">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono bg-zinc-900 border border-zinc-700 text-zinc-400 px-1 py-0.2 rounded shrink-0">
                              PROFILE
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                          {[band.genre, band.location].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-zinc-500">
                      {isAlreadyTagged ? (
                        <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> TAGGED
                        </span>
                      ) : (
                        <Plus className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Custom Add Row if query not exactly in suggestions */}
              {query.trim() && !hasExactMatch && (
                <div
                  onClick={handleAddCustom}
                  className="p-2.5 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 text-zinc-400 hover:text-white flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-rose-400" />
                    <span className="text-xs font-mono">
                      Tag custom band: <strong className="text-white">"{query.trim().toUpperCase()}"</strong>
                    </span>
                  </div>
                  <span className="text-[9px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-bold">
                    + TAG
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tagged Bands List */}
      {taggedBands.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {taggedBands.map((band, idx) => (
            <span
              key={`band-chip-${band}-${idx}`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.attachedTagBg || 'bg-rose-950/50'} border ${theme.accentBorder || 'border-rose-900/60'} text-[11px] font-mono ${theme.badgeText || 'text-rose-300'} font-bold shadow-sm`}
            >
              <Music className="w-3 h-3 text-rose-400 shrink-0" />
              <span>{band}</span>
              <button
                type="button"
                onClick={() => onRemoveBand(band)}
                className="hover:text-white hover:bg-rose-900/50 p-0.5 rounded transition-colors ml-0.5"
                title={`Remove ${band}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default BandTagAutocomplete;
