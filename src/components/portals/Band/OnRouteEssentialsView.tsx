import React, { useState } from 'react';
import { ChevronLeft, MapPin, Phone, Search, Navigation, Crosshair, LocateFixed, RefreshCw } from 'lucide-react';
import InfoTip from '../../InfoTip';
import { getCurrentCoordinates } from '../../../services/locationService';
import UsMapOutlineBackground from './UsMapOutlineBackground';

interface OnRouteEssentialsViewProps {
  onBack: () => void;
  venueAddress?: string | null;
}

interface PlaceResult {
  id: string;
  name: string;
  distance: string;
  address: string;
  phone: string;
}

// Distance helper
const getDistanceMiles = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 3959; // Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
};

// Comprehensive category-to-keyword matrices for complete real-world POI discovery
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  HOTELS: ['hotel', 'motel', 'inn', 'suites', 'best western', 'hampton inn', 'holiday inn', 'marriott', 'hilton', 'la quinta', 'super 8', 'comfort inn', 'lodging'],
  GROCERY: ['supermarket', 'grocery', 'albertsons', 'walmart', 'kroger', 'heb', 'brookshires', 'aldi', 'dollar general', 'family dollar', 'target', 'costco', 'sams club', 'trader joes', 'food mart', 'market'],
  PHARMACY: ['pharmacy', 'cvs', 'walgreens', 'rite aid', 'medicine', 'drugstore', 'walmart pharmacy', 'kroger pharmacy', 'albertsons pharmacy'],
  CONVENIENCE: ['convenience', 'gas station', '7-eleven', 'circle k', 'quiktrip', 'buc-ees', 'racetrac', 'shell', 'chevron', 'exxon', 'valero', 'pilot flying j', 'loves travel stop', 'caseys'],
  RESTAURANTS: ['restaurant', 'diner', 'tacos', 'bbq', 'pizza', 'burger', 'grill', 'cafe', 'mcdonalds', 'wendys', 'whataburger', 'chick-fil-a', 'subway', 'chipotle', 'sonic', 'steakhouse'],
  HARDWARE: ['hardware', 'home depot', 'lowes', 'ace hardware', 'harbor freight', 'tractor supply', 'true value', 'lumber'],
  'LIQUOR STORE': ['liquor', 'spirits', 'package store', 'beer', 'wine', 'spec', 'total wine', 'beverage depot'],
  'REPAIR SHOP': ['auto repair', 'mechanic', 'tire', 'autozone', 'oreilly', 'advance auto', 'discount tire', 'firestone', 'pep boys', 'brakes', 'oil change'],
  HOSPITALS: ['hospital', 'emergency room', 'urgent care', 'medical center', 'clinic', 'health center', 'er', 'trauma'],
  INSTRUMENTS: ['guitar', 'music store', 'musical instruments', 'guitar center', 'pawn shop', 'audio equipment', 'sam ash', 'music supply', 'drums', 'amps']
};

export default function OnRouteEssentialsView({ onBack, venueAddress }: OnRouteEssentialsViewProps) {
  const [sourceLocation, setSourceLocation] = useState('');
  const [customSearch, setCustomSearch] = useState('');
  const [activeMacro, setActiveMacro] = useState<string | null>(null);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [radialRangeMiles, setRadialRangeMiles] = useState<number>(10);
  const [lastExecutedType, setLastExecutedType] = useState<string | null>(null);
  const [operationalMode, setOperationalMode] = useState<'venue' | 'roaming'>(venueAddress ? 'venue' : 'roaming');

  // Context B condition
  const isFixedVenue = operationalMode === 'venue' && !!venueAddress;

  const handleCaptureGPS = async () => {
    setSearchError(null);
    setIsSearching(true);
    setSearchStatus("ACQUIRING CO-ORDINATE SENSORS...");

    const coords = await getCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000 });
    if (coords) {
      setSourceLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`);
      setIsSearching(false);
      setSearchStatus("GPS NAVIGATION COORDINATES LOCKED");
    } else {
      setSearchError("Unable to retrieve your location. Check app/device location permissions.");
      setIsSearching(false);
      setSearchStatus(null);
    }
  };

  const getCoordinates = async (address: string): Promise<{lat: number, lon: number} | null> => {
    // Check if it's already coordinates
    const match = address.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
    
    // Fast geocode with Photon first (instant, no rate limits)
    try {
      const pRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`);
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.features && pData.features.length > 0) {
          const [lon, lat] = pData.features[0].geometry.coordinates;
          return { lat, lon };
        }
      }
    } catch (e) {
      console.warn("Photon geocode fallback:", e);
    }

    // Secondary geocoding with OpenStreetMap
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&email=goregrindsickness@gmail.com`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    }
    return null;
  };

  // High-performance proximity search utilizing Photon OSM with multi-keyword sweeps
  const queryPhotonProximity = async (lat: number, lon: number, keywords: string[], maxRangeMiles: number): Promise<PlaceResult[]> => {
    const fetches = keywords.map(kw =>
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(kw)}&lat=${lat}&lon=${lon}&limit=15`)
        .then(r => r.json())
        .catch(() => ({ features: [] }))
    );

    const allResponses = await Promise.all(fetches);
    const seen = new Set<string>();
    const list: PlaceResult[] = [];

    allResponses.forEach(res => {
      res.features?.forEach((f: any) => {
        if (!f.geometry || !f.geometry.coordinates) return;
        const [fLon, fLat] = f.geometry.coordinates;
        const dist = parseFloat(getDistanceMiles(lat, lon, fLat, fLon));
        
        // Include items within the specified range (or up to 2.5x if sparse)
        if (dist <= maxRangeMiles) {
          const name = f.properties.name || f.properties.street || 'Local Facility';
          const key = `${name.toLowerCase().trim()}_${fLat.toFixed(3)}_${fLon.toFixed(3)}`;
          
          if (!seen.has(key)) {
            seen.add(key);
            const street = f.properties.street || '';
            const housenumber = f.properties.housenumber || '';
            const streetAddr = [housenumber, street].filter(Boolean).join(' ');
            const city = f.properties.city || f.properties.county || f.properties.district || '';
            const state = f.properties.state || '';
            const postcode = f.properties.postcode || '';
            const fullAddress = [streetAddr, city, state, postcode].filter(Boolean).join(', ');

            list.push({
              id: f.properties.osm_id?.toString() || Math.random().toString(),
              name: name.toUpperCase(),
              distance: `${dist} MILES`,
              address: fullAddress || 'Location coordinates active on GPS route',
              phone: 'Direct GPS Navigation Available'
            });
          }
        }
      });
    });

    list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return list;
  };

  const executeRealSearch = async (type: string, rangeMilesOverride?: number) => {
    setSearchError(null);
    const currentRange = rangeMilesOverride !== undefined ? rangeMilesOverride : radialRangeMiles;
    setSearchStatus(`SWEEPING SECTOR (${currentRange}-MILE RADIUS)...`);
    setIsSearching(true);
    setResults([]);
    setLastExecutedType(type);

    const rootLocation = isFixedVenue ? venueAddress : sourceLocation;
    if (!rootLocation) {
       setSearchError("Please provide a source location or click [ CAPTURE LIVE GPS ]");
       setIsSearching(false);
       setSearchStatus(null);
       return;
    }

    const coords = await getCoordinates(rootLocation);
    if (!coords) {
       setSearchError("Could not resolve location coordinates. Try a more specific address or use GPS.");
       setIsSearching(false);
       setSearchStatus(null);
       return;
    }

    const { lat, lon } = coords;
    
    // Determine keywords to search
    let searchKeywords: string[] = [];
    const upperType = type.toUpperCase().trim();

    if (CATEGORY_KEYWORDS[upperType]) {
      searchKeywords = CATEGORY_KEYWORDS[upperType];
    } else {
      // Custom user query
      const cleanSearch = type.trim();
      searchKeywords = [cleanSearch];
      const terms = cleanSearch.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      if (terms.length > 0) {
        searchKeywords.push(...terms);
      }
    }

    try {
      // Step 1: Search within primary radius
      let places = await queryPhotonProximity(lat, lon, searchKeywords, currentRange);

      // Step 2: If fewer than 3 results found, automatically expand radius up to 2.5x to capture nearby regional hubs
      let isExtended = false;
      if (places.length < 3) {
        const expandedRadius = Math.max(currentRange * 2.5, 25);
        setSearchStatus(`EXPANDING SEARCH RADIUS TO ${Math.round(expandedRadius)} MILES...`);
        const expandedPlaces = await queryPhotonProximity(lat, lon, searchKeywords, expandedRadius);
        if (expandedPlaces.length > places.length) {
          places = expandedPlaces;
          isExtended = true;
        }
      }

      if (places.length > 0) {
        const trimmed = places.slice(0, 25);
        setResults(trimmed);
        setSearchStatus(isExtended 
          ? `EXTENDED SWEEP COMPLETED (${trimmed.length} FOUND)` 
          : `${currentRange}-MILE SWEEP COMPLETED (${trimmed.length} FOUND)`);
      } else {
        setSearchError(`No active intercepts found within primary (${currentRange}mi) or extended sweeps. Try expanding search distance or searching a custom term.`);
        setSearchStatus(null);
      }
    } catch (err: any) {
      console.error("Proximity Search Error:", err);
      setSearchError("Satellite search encountered a network interruption. Please tap search again.");
      setSearchStatus(null);
    }

    setIsSearching(false);
  };

  const handleMacroTrigger = (macro: string) => {
    setActiveMacro(macro);
    setCustomSearch('');
    executeRealSearch(macro);
  };

  const handleExecutePing = () => {
    if (customSearch.trim()) {
      setActiveMacro(null);
      executeRealSearch(customSearch.trim());
    } else if (activeMacro) {
      executeRealSearch(activeMacro);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c0400] via-black to-[#1a0a00] text-zinc-300 font-sans flex flex-col relative selection:bg-orange-500/30 selection:text-white">
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-8 pt-8 md:pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER WITH OUTLINE US MAP BACKGROUND */}
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-black/40 backdrop-blur-md p-6 sm:p-8 text-center shadow-[0_4px_30px_-10px_rgba(249,115,22,0.3)] flex flex-col items-center justify-center">
          {/* Subtle US Map Vector Outline Layer */}
          <UsMapOutlineBackground className="opacity-40" />

          {/* Foreground Header Content */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="mb-4">
              <Crosshair style={{ width: '48px', height: '48px' }} className="text-orange-500 animate-[spin_6s_linear_infinite] drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
            </div>
            <div className="flex items-center justify-center gap-3">
              <h1 className="text-orange-500 font-mono font-black tracking-[0.2em] uppercase text-2xl sm:text-3xl md:text-4xl drop-shadow-[0_0_20px_rgba(249,115,22,0.8)]">
                LOCAL AMENITIES FINDER
              </h1>
              <InfoTip 
                title="LOCAL AMENITIES ENGINE"
                bullets={[
                  "AUTO-DETECTS VENUE GEOLOCATION FOR SHIFT LANDING SPOTS.",
                  "INPUT AN ADDRESS OR LOCK LIVE GPS DEVICE POSITION CONTEXT.",
                  "QUICK PRESETS FILTER FOR RESTAURANTS, HOTELS, PHARMACIES & STORES.",
                  "CLICK TO DEEP-LINK DIRECTLY INTO NATIVE TURN-BY-TURN ROUTING NAV."
                ]}
                accentColor="#f97316"
                position="bottom-right"
              />
            </div>
            <p className="text-zinc-300 text-xs text-center max-w-md mx-auto mb-1 mt-2 leading-relaxed font-mono drop-shadow-sm">
              Find essential spots near your venue or current location for food, sleep, gear fixes, or quick supply runs.
            </p>
          </div>
        </div>

        {/* The Operational Mode Segment Toggle */}
        <div className="flex w-full bg-zinc-950 p-1 border border-zinc-900 rounded-lg mb-3">
          <button
            onClick={() => setOperationalMode('venue')}
            className={`w-1/2 text-center py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
              operationalMode === 'venue'
                ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            Venue Mode
          </button>
          <button
            onClick={() => setOperationalMode('roaming')}
            className={`w-1/2 text-center py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all ${
              operationalMode === 'roaming'
                ? 'bg-amber-950/30 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
            }`}
          >
            Roaming Mode
          </button>
        </div>

        {/* LOCATION CONTEXT */}
        <div className="space-y-2 p-4 border border-zinc-900 bg-[#111111] backdrop-blur-sm relative overflow-hidden group hover:border-zinc-800 transition-colors">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          {operationalMode === 'venue' ? (
            <div className="relative">
              <div className="text-purple-400 text-[11px] font-mono mb-2 uppercase tracking-wider">
                📍 Automatically anchored to day-of-show venue location.
              </div>
              <div className="relative">
                <input 
                  type="text"
                  disabled
                  value={venueAddress || 'No venue linked'}
                  className="w-full opacity-60 bg-zinc-900/40 cursor-not-allowed border border-zinc-800 text-zinc-200 font-mono text-xs md:text-sm p-4 pl-[220px] outline-none rounded-none"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-zinc-950 px-2 py-1 rounded text-zinc-300 text-[11px] font-mono uppercase tracking-wider pointer-events-none">
                  📍 Day-Of-Show Anchor Active
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                placeholder="[ LOCATION CONTEXT // ENTER ADDRESS OR COORDS ]"
                value={sourceLocation}
                onChange={(e) => setSourceLocation(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-amber-500 text-zinc-100 font-mono text-xs md:text-sm p-4 outline-none transition-all duration-300 rounded-none placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              />
              <button
                onClick={handleCaptureGPS}
                className="bg-amber-500/10 text-amber-500 border border-amber-500/40 hover:border-amber-500 hover:bg-amber-500/20 px-4 py-4 font-mono text-xs font-black tracking-widest uppercase transition-all duration-300 rounded-none shrink-0 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <LocateFixed className="w-4 h-4 animate-pulse" />
                [ CAPTURE LIVE GPS ]
              </button>
            </div>
          )}
          {searchError && (
            <div className="bg-amber-950/20 border border-amber-500/30 text-amber-500 p-3 rounded text-xs text-center font-mono my-2">
              {searchError}
            </div>
          )}
          {searchStatus && (
            <div className="text-orange-500 font-mono text-[10px] md:text-xs uppercase font-black tracking-widest mt-2 p-2 bg-orange-500/5 border border-orange-500/20 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block animate-ping shadow-[0_0_8px_#F97316] shrink-0" />
              <span className="animate-pulse">// {searchStatus}</span>
            </div>
          )}
        </div>

        {/* INPUT DECK */}
        <div className="space-y-4">
          <div className="grid grid-rows-2 grid-flow-col gap-2 overflow-x-auto py-1 scrollbar-none hide-scrollbar">
            {['HOTELS', 'GROCERY', 'PHARMACY', 'CONVENIENCE', 'RESTAURANTS', 'HARDWARE', 'LIQUOR STORE', 'REPAIR SHOP', 'HOSPITALS', 'INSTRUMENTS'].map((macro, idx) => (
              <button
                key={`${macro}-${idx}`}
                onClick={() => handleMacroTrigger(macro)}
                className={
                  activeMacro === macro
                    ? 'bg-amber-950/30 border border-amber-500 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)] text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium'
                    : 'bg-zinc-950 border border-zinc-900 text-zinc-400 text-xs px-3 py-1.5 rounded-full whitespace-nowrap hover:text-zinc-200 transition-colors'
                }
              >
                {macro}
              </button>
            ))}
          </div>

          <input 
            type="text"
            placeholder="[ Search custom supplier (e.g. Guitar Center, Home Depot)... ]"
            value={customSearch}
            onChange={(e) => {
              setCustomSearch(e.target.value);
              if (e.target.value) setActiveMacro(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleExecutePing()}
            className="w-full bg-black/60 border border-orange-500/30 focus:border-orange-500 text-zinc-200 font-mono text-xs md:text-sm p-4 outline-none transition-all duration-300 rounded-none placeholder:text-zinc-600 focus:shadow-[0_0_20px_rgba(249,115,22,0.2)] focus:bg-black"
          />

          {/* SENSOR SWEEP RANGE CONTROLLER */}
          <div className="p-3 bg-black/60 border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-orange-300/65 font-bold uppercase tracking-wider">Search Radius</span>
              <div className="flex gap-1.5 flex-wrap">
                {[1, 3, 5, 10, 15, 25, 35, 45, 55].map((miles, idx) => (
                  <button
                    key={`${miles}-${idx}`}
                    onClick={() => {
                      setRadialRangeMiles(miles);
                      if (lastExecutedType) {
                        executeRealSearch(lastExecutedType, miles);
                      }
                    }}
                    className={`font-mono text-[10px] sm:text-xs px-2.5 py-1.5 border transition-all rounded-none ${
                      radialRangeMiles === miles
                        ? 'border-orange-500 bg-orange-500/20 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                        : 'border-orange-500/20 bg-black/40 text-orange-300/50 hover:border-orange-500 hover:text-orange-500'
                    }`}
                  >
                    {miles} Mi
                  </button>
                ))}
              </div>
            </div>

            {lastExecutedType && (
              <button
                onClick={() => executeRealSearch(lastExecutedType)}
                disabled={isSearching}
                className="font-mono text-[10px] sm:text-xs px-3.5 py-1.5 border border-orange-500/30 bg-black hover:bg-orange-500/10 text-orange-300/70 hover:text-orange-500 hover:border-orange-500 transition-all flex items-center gap-1.5 hover:shadow-[0_0_10px_rgba(249,115,22,0.2)]"
              >
                <RefreshCw className={`w-3 h-3 ${isSearching ? 'animate-spin' : ''}`} />
                Refresh Results
              </button>
            )}
          </div>

          <button
            onClick={handleExecutePing}
            disabled={isSearching}
            className="w-full relative overflow-hidden border border-orange-500/50 bg-black/40 text-orange-500 font-mono text-sm md:text-base font-black tracking-[0.3em] uppercase py-5 rounded-none transition-all duration-300 hover:border-orange-500 hover:bg-orange-500/10 hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] disabled:opacity-50 disabled:cursor-not-allowed group backdrop-blur-sm"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]"></div>
            {isSearching ? <span style={{ fontSize: '11px' }} className="animate-pulse relative z-10 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]">PINGING SATELLITES...</span> : <span style={{ fontSize: '11px' }} className="group-hover:text-white transition-colors duration-300 relative z-10 drop-shadow-[0_0_5px_rgba(249,115,22,0.5)] group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">Find Amenities 🔍</span>}
          </button>
        </div>

        {/* RESULTS LIST */}
        <div className="space-y-4 pt-6">
          {results.length > 0 && !isSearching && (
            <div className="font-mono text-xs text-orange-300/70 mb-4 border-b border-orange-500/30 pb-3 uppercase tracking-widest flex flex-col sm:flex-row justify-between gap-2 shadow-[0_4px_10px_-10px_rgba(249,115,22,0.3)]">
              <span className="flex items-center gap-2"><Navigation className="w-4 h-4 text-orange-500" /> // Radar Intercepts //</span>
              {searchStatus && (
                <span className="text-orange-500 font-black text-[10px] tracking-wide normal-case sm:text-right drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                  {searchStatus}
                </span>
              )}
            </div>
          )}

          {results.map((res, i) => (
            <div key={`radar-res-${res.id || 'r'}-${i}`} className="border border-orange-500/20 bg-black/40 backdrop-blur-sm p-5 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-5 hover:border-orange-500/65 hover:bg-black/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all duration-300 group" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-mono text-orange-500 font-black uppercase tracking-widest text-sm md:text-base group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] transition-all">{res.name}</h3>
                  <div className="font-mono text-xs text-zinc-400 lowercase">{res.address}</div>
                </div>
                <div className="border border-orange-500/50 bg-orange-500/10 px-3 py-1.5 text-orange-500 font-mono text-[10px] font-bold tracking-widest whitespace-nowrap shadow-[0_0_10px_rgba(249,115,22,0.1)] group-hover:bg-orange-500/20 group-hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all">
                  {res.distance}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-orange-500/20 mt-1">
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(res.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-black/50 border border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 text-orange-300/70 hover:text-white font-mono text-[10px] sm:text-xs tracking-widest uppercase py-3 flex items-center justify-center gap-2 transition-all duration-300 group/btn rounded-none text-center shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                >
                  <MapPin className="w-4 h-4 group-hover/btn:text-orange-500 text-orange-500/50 transition-colors" />
                  [ MAP DRIVE ROUTE → ]
                </a>
                <a 
                  href={`tel:${res.phone}`}
                  className="flex-1 bg-black/50 border border-orange-500/30 hover:border-orange-500 hover:bg-orange-500/10 text-orange-300/70 hover:text-white font-mono text-[10px] sm:text-xs tracking-widest uppercase py-3 flex items-center justify-center gap-2 transition-all duration-300 group/btn rounded-none text-center shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                >
                  <Phone className="w-4 h-4 group-hover/btn:text-orange-500 text-orange-500/50 transition-colors" />
                  [ DIAL OUTBOUND LINE ]
                </a>
              </div>
            </div>
          ))}

          {!isSearching && results.length === 0 && activeMacro === null && customSearch === '' && (
            <div className="text-center p-12 border border-dashed border-orange-500/30 bg-orange-500/5 text-orange-300/50 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">
              Awaiting target designation...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
