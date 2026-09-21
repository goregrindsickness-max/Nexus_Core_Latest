import React, { useEffect, useRef, useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { getCurrentCoordinates } from '../../../services/locationService';

// This is required to access the env var properly in Vite, as set up in vite.config.ts
const API_KEY =
  
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function RouteDisplay({ origin, destination, setRouteMetrics }: {
  origin: string | google.maps.LatLngLiteral | null;
  destination: string | google.maps.LatLngLiteral;
  setRouteMetrics: (metrics: { distance: string; duration: string; trafficDuration: string } | null) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin) return;
    
    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));

    routesLib.Route.computeRoutes({
      origin,
      destination,
      travelMode: 'DRIVING',
      routingPreference: 'TRAFFIC_AWARE',
      fields: ['path', 'distanceMeters', 'durationMillis', 'staticDurationMillis', 'viewport'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const route = routes[0];
        
        // Render polylines
        const newPolylines = route.createPolylines();
        newPolylines.forEach(p => {
          // Style the polyline to match the dark theme
          p.setOptions({
            strokeColor: '#00ffcc',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;
        
        if (route.viewport) {
          map.fitBounds(route.viewport);
        }

        // Parse metrics
        let distanceStr = '';
        if (route.distanceMeters) {
          distanceStr = (route.distanceMeters * 0.000621371).toFixed(1) + ' mi';
        }

        const parseDuration = (dur: any) => {
          if (!dur) return '';
          // dur is in milliseconds
          let seconds = typeof dur === 'number' ? Math.floor(dur / 1000) : parseInt(dur, 10);
          if (isNaN(seconds)) return '';
          const h = Math.floor(seconds / 3600);
          const m = Math.floor((seconds % 3600) / 60);
          return `${h > 0 ? h + 'h ' : ''}${m}m`;
        };

        setRouteMetrics({
          distance: distanceStr,
          duration: parseDuration(route.staticDurationMillis || route.durationMillis),
          trafficDuration: parseDuration(route.durationMillis),
        });
      } else {
        setRouteMetrics(null);
      }
    }).catch(err => {
      console.error("Error computing route:", err);
      setRouteMetrics(null);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, destination, setRouteMetrics]);

  return null;
}

interface InteractiveRoutePreviewProps {
  destination: string;
}

export default function InteractiveRoutePreview({ destination }: InteractiveRoutePreviewProps) {
  const [origin, setOrigin] = useState<google.maps.LatLngLiteral | null>(null);
  const [locating, setLocating] = useState(true);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routeMetrics, setRouteMetrics] = useState<{ distance: string; duration: string; trafficDuration: string } | null>(null);

  useEffect(() => {
    let isSubscribed = true;
    getCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000 }).then((coords) => {
      if (!isSubscribed) return;
      if (coords) {
        setOrigin({ lat: coords.latitude, lng: coords.longitude });
        setLocating(false);
      } else {
        setGeoError("Location access unavailable or permission denied");
        setLocating(false);
      }
    });
    return () => {
      isSubscribed = false;
    };
  }, []);

  if (!hasValidKey) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 text-center">
        <p className="text-zinc-500 font-mono text-[10px] uppercase mb-2">Map Preview Disabled</p>
        <p className="text-zinc-400 text-xs font-sans">
          Google Maps Platform API Key is required to view the interactive route.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-950/50 border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
      <div className="h-64 relative w-full bg-zinc-950">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={{ lat: 39.8283, lng: -98.5795 }} // Center of US as fallback
            defaultZoom={4}
            mapId="COOP_DARK_MAP"
            disableDefaultUI={true}
            gestureHandling="cooperative"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            colorScheme="DARK"
          >
            {origin && (
              <>
                <AdvancedMarker position={origin} title="Current Location">
                  <Pin background="#8b5cf6" glyphColor="#fff" borderColor="#6d28d9" />
                </AdvancedMarker>
                <RouteDisplay 
                  origin={origin} 
                  destination={destination} 
                  setRouteMetrics={setRouteMetrics} 
                />
              </>
            )}
          </Map>
        </APIProvider>
        
        {locating && (
          <div className="absolute inset-0 bg-zinc-950/80 flex items-center justify-center backdrop-blur-sm z-10">
            <span className="text-[#00ffcc] font-mono text-xs uppercase animate-pulse">Acquiring GPS Signal...</span>
          </div>
        )}
        
        {geoError && !origin && (
          <div className="absolute inset-0 bg-zinc-950/80 flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm z-10">
            <span className="text-rose-400 font-mono text-xs uppercase mb-1">Location Error</span>
            <span className="text-zinc-500 font-sans text-[10px]">{geoError}</span>
          </div>
        )}
      </div>
      
      {/* Real-time Metrics Panel */}
      <div className="bg-black/60 p-3 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">Total Distance</span>
          <span className="text-zinc-200 font-mono text-sm font-bold">{routeMetrics?.distance || '--'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">Est. Duration</span>
          <span className="text-zinc-200 font-mono text-sm font-bold">{routeMetrics?.duration || '--'}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">Traffic Impact</span>
          <span className="text-amber-400 font-mono text-sm font-bold">
            {routeMetrics?.trafficDuration ? (
              routeMetrics.trafficDuration === routeMetrics.duration ? 'None' : routeMetrics.trafficDuration
            ) : '--'}
          </span>
        </div>
      </div>
    </div>
  );
}
