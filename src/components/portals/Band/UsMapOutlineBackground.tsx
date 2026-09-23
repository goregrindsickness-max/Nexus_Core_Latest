import React from 'react';
import { US_MAP_GEOMETRY } from './usMapGeometry';

interface UsMapOutlineBackgroundProps {
  className?: string;
}

export const UsMapOutlineBackground: React.FC<UsMapOutlineBackgroundProps> = ({ className = '' }) => {
  const { viewBox, nationOutline, stateBoundaries, keyCities } = US_MAP_GEOMETRY;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center select-none ${className}`}>
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.14)_0%,rgba(245,158,11,0.05)_45%,transparent_75%)]" />

      {/* Geographically Precise US Map Vector (Mercator / Mapbox Aligned) */}
      <svg
        viewBox={viewBox}
        className="w-full h-full object-contain opacity-40 transition-opacity duration-700"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Neon Glow Filter */}
          <filter id="us-map-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="us-nation-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id="radar-lat-grid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Tactical Lat/Long Graticule Grid */}
        <g stroke="url(#radar-lat-grid)" strokeWidth="0.75" strokeDasharray="3 6">
          <line x1="80" y1="120" x2="880" y2="120" />
          <line x1="80" y1="200" x2="880" y2="200" />
          <line x1="80" y1="280" x2="880" y2="280" />
          <line x1="80" y1="360" x2="880" y2="360" />
          <line x1="80" y1="440" x2="880" y2="440" />

          <line x1="160" y1="60" x2="160" y2="480" />
          <line x1="280" y1="60" x2="280" y2="480" />
          <line x1="400" y1="60" x2="400" y2="480" />
          <line x1="520" y1="60" x2="520" y2="480" />
          <line x1="640" y1="60" x2="640" y2="480" />
          <line x1="760" y1="60" x2="760" y2="480" />
          <line x1="860" y1="60" x2="860" y2="480" />
        </g>

        {/* 1. Official US Interior State Boundaries */}
        <path
          d={stateBoundaries}
          fill="none"
          stroke="#f97316"
          strokeWidth="0.9"
          strokeOpacity="0.45"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 2. Official Contiguous US Perimeter Outline (Coastlines & Borders) */}
        <path
          d={nationOutline}
          fill="rgba(249, 115, 22, 0.03)"
          stroke="url(#us-nation-grad)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#us-map-glow)"
        />

        {/* 3. Tactical Tour Route Vectors Between Key Regional Hubs */}
        <g stroke="#fbbf24" strokeWidth="1" strokeDasharray="3 5" strokeOpacity="0.35" fill="none">
          {/* West Coast Line */}
          <path d="M 124 109 Q 120 220 159 344" />
          {/* SW to Mountain */}
          <path d="M 159 344 Q 260 340 338 277" />
          {/* Mountain to Texas */}
          <path d="M 338 277 Q 400 340 457 400" />
          {/* Texas to Midwest */}
          <path d="M 457 400 Q 520 320 622 250" />
          {/* Midwest to South */}
          <path d="M 622 250 Q 670 330 675 348" />
          {/* South to Northeast */}
          <path d="M 675 348 Q 750 300 843 263" />
          {/* NYC to Boston */}
          <path d="M 843 263 Q 860 250 891 243" />
          {/* Chicago to NYC */}
          <path d="M 622 250 Q 730 240 843 263" />
        </g>

        {/* 4. Verified Scene Tour Waypoint Pings & Radar Rings */}
        <g>
          {keyCities.map((city) => {
            const isMajorHub = ['Seattle', 'Los Angeles', 'Denver', 'Austin', 'Chicago', 'Atlanta', 'New York'].includes(city.name);
            return (
              <g key={city.name}>
                {/* Center Solid Radar Dot */}
                <circle
                  cx={city.x}
                  cy={city.y}
                  r={isMajorHub ? 3.5 : 2.5}
                  fill="#f97316"
                  opacity={isMajorHub ? 0.95 : 0.7}
                />
                
                {/* Glowing Radar Halo on Major Hubs */}
                {isMajorHub && (
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={8}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="0.8"
                    opacity="0.6"
                    className="animate-ping origin-center"
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* 5. Geodetic Crosshairs & Metadata */}
        <g fill="#f97316" fontFamily="monospace" fontSize="8" fontWeight="bold" opacity="0.45">
          <text x="750" y="490">US-CONUS // MERCATOR LOCK</text>
          <text x="110" y="80">PACIFIC // 47.6° N</text>
          <text x="830" y="80">ATLANTIC // 71.0° W</text>
        </g>
      </svg>
    </div>
  );
};

export default UsMapOutlineBackground;
