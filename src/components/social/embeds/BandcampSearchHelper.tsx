import React, { useState, useEffect, useRef } from 'react';
import { Search, Disc, ExternalLink, Music2, Loader2, Play, Pause, X, Sparkles, Check } from 'lucide-react';
import { openBandcampLink } from '../../../utils/socialFeedUtils';
import { ComposerThemeConfig } from '../CreatePostCard';

export interface BandcampSearchHelperProps {
  onSelectTrack: (track: { url: string; title: string; artist: string; artworkUrl?: string; previewUrl?: string }) => void;
  theme?: ComposerThemeConfig;
  className?: string;
}

interface SearchResultItem {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName?: string;
  artworkUrl?: string;
  previewUrl?: string;
}

export const BandcampSearchHelper: React.FC<BandcampSearchHelperProps> = ({
  onSelectTrack,
  theme,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeoutRef = useRef<any>(null);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const triggerSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(trimmed)}&entity=song&limit=6`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.results)) {
          const mapped: SearchResultItem[] = data.results.map((r: any) => ({
            trackId: r.trackId,
            trackName: r.trackName,
            artistName: r.artistName,
            collectionName: r.collectionName,
            artworkUrl: r.artworkUrl100 ? r.artworkUrl100.replace('100x100bb', '300x300bb') : undefined,
            previewUrl: r.previewUrl
          }));
          setResults(mapped);
        } else {
          setResults([]);
        }
      }
    } catch (e) {
      console.warn('[BandcampSearchHelper] Search error:', e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (val.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        triggerSearch(val);
      }, 400);
    } else if (!val.trim()) {
      setResults([]);
      setHasSearched(false);
      if (audioRef.current) {
        audioRef.current.pause();
        setActivePreview(null);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      triggerSearch(query);
    }
  };

  const handleDirectBandcampSearch = (searchQuery: string) => {
    const term = searchQuery.trim() || query.trim();
    if (!term) return;
    const bandcampSearchUrl = `https://bandcamp.com/search?q=${encodeURIComponent(term)}&item_type=t`;
    openBandcampLink(bandcampSearchUrl);
  };

  const handleTogglePreview = (previewUrl?: string) => {
    if (!previewUrl) return;

    if (activePreview === previewUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setActivePreview(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setActivePreview(previewUrl);
    audio.play().catch(() => setActivePreview(null));

    audio.onended = () => {
      setActivePreview(null);
    };
  };

  const handleSelect = (item: SearchResultItem) => {
    setSelectedId(item.trackId);
    if (audioRef.current) {
      audioRef.current.pause();
      setActivePreview(null);
    }

    // Build canonical Bandcamp URL slug
    const cleanArtistSlug = item.artistName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const cleanTrackSlug = item.trackName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const candidateUrl = `https://${cleanArtistSlug}.bandcamp.com/track/${cleanTrackSlug}`;

    onSelectTrack({
      url: candidateUrl,
      title: item.trackName,
      artist: item.artistName,
      artworkUrl: item.artworkUrl,
      previewUrl: item.previewUrl
    });
  };

  return (
    <div className={`p-3 rounded-xl bg-gradient-to-b from-[#02181f]/90 via-zinc-950 to-black border border-cyan-500/40 space-y-2.5 shadow-[0_0_18px_rgba(6,182,212,0.12)] ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
            SEARCH SONGS ON BANDCAMP
          </span>
        </div>
        <span className="text-[8.5px] font-mono font-bold text-cyan-400/80 bg-cyan-950/70 border border-cyan-500/30 px-1.5 py-0.5 rounded">
          QUICK EMBED HELPER
        </span>
      </div>

      {/* Search Input Field */}
      <div className="relative flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-cyan-400/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Type song title or artist name (e.g. Sanguisugabogg, Mortician)..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black/80 text-xs text-white placeholder:text-zinc-500 border border-cyan-500/40 rounded-lg pl-8 pr-8 py-2 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
                setHasSearched(false);
                if (audioRef.current) audioRef.current.pause();
                setActivePreview(null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => triggerSearch(query)}
          disabled={isSearching || !query.trim()}
          className="px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold uppercase transition-all shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="hidden sm:inline">FIND</span>
        </button>
      </div>

      {/* Direct One-Click Bandcamp Web Search Action */}
      {query.trim().length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-zinc-300 min-w-0 truncate">
            <Sparkles className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">Want to search official Bandcamp catalog directly?</span>
          </div>
          <button
            type="button"
            onClick={() => handleDirectBandcampSearch(query)}
            className="flex items-center justify-center gap-1 px-2.5 py-1 rounded bg-cyan-500 text-black font-bold uppercase tracking-wider text-[9px] hover:bg-cyan-400 transition-colors shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)] cursor-pointer"
          >
            <span>Search Bandcamp.com</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      )}

      {/* Instant Search Results Dropdown */}
      {results.length > 0 && (
        <div className="space-y-1.5 pt-1 max-h-60 overflow-y-auto pr-1">
          <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider px-1">
            Matching tracks — Click to auto-fill embed:
          </div>

          {results.map((song) => {
            const isSelected = selectedId === song.trackId;
            const isPlaying = activePreview === song.previewUrl;

            return (
              <div
                key={`bc-search-res-${song.trackId}`}
                className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-black/60 hover:bg-zinc-900/90 border-zinc-800 hover:border-cyan-500/40'
                }`}
              >
                {/* Artwork & Details */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative w-9 h-9 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center">
                    {song.artworkUrl ? (
                      <img
                        src={song.artworkUrl}
                        alt={song.trackName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Music2 className="w-4 h-4 text-cyan-400" />
                    )}

                    {/* Audio preview play/pause button overlay */}
                    {song.previewUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePreview(song.previewUrl);
                        }}
                        className="absolute inset-0 bg-black/60 hover:bg-black/40 flex items-center justify-center transition-colors"
                        title={isPlaying ? 'Pause preview' : 'Play 30s preview'}
                      >
                        {isPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate font-mono">{song.trackName}</p>
                    <p className="text-[10px] text-cyan-400/90 truncate font-mono">
                      {song.artistName} {song.collectionName ? `• ${song.collectionName}` : ''}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDirectBandcampSearch(`${song.artistName} ${song.trackName}`)}
                    className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-750 text-[9px] font-mono transition-colors"
                    title="Open on Bandcamp"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelect(song)}
                    className={`px-2.5 py-1.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 border border-cyan-500/50'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>EMBEDDED</span>
                      </>
                    ) : (
                      <span>EMBED</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {hasSearched && !isSearching && results.length === 0 && (
        <div className="p-3 rounded-lg bg-black/60 border border-zinc-800 text-center space-y-1.5">
          <p className="text-[10px] font-mono text-zinc-400">
            No exact match found in quick search.
          </p>
          <button
            type="button"
            onClick={() => handleDirectBandcampSearch(query)}
            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-cyan-400 hover:underline"
          >
            <span>Search Bandcamp.com for "{query}"</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
};
