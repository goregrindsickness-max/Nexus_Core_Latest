import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  MapPin, 
  Ticket, 
  Award, 
  ShieldAlert, 
  Copy, 
  Plus, 
  RefreshCw, 
  Terminal, 
  UserPlus, 
  ScanLine, 
  Check, 
  Database 
} from 'lucide-react';
import { Show } from '../types';

interface FanProfile {
  id: string;
  username: string;
  homebase_location: string;
  registration_timestamp: string;
  scans_count: number;
}

interface StagedTicket {
  id: string;
  tour_node_id: string;
  fan_profile_id: string;
  purchase_timestamp: string;
  is_scanned: boolean;
}

interface DevSandboxFanDeckProps {
  shows: Show[];
  triggerNotification?: (msg: string) => void;
}

export default function DevSandboxFanDeck({ shows, triggerNotification }: DevSandboxFanDeckProps) {
  // SQL DDL Schema strings for database initialization
  const sqlDdl = `-- ========================================================
-- SYSTEM RELEASE: FRONT-OF-HOUSE (FOH) FAN PORTAL SCHEMA
-- TARGET PLATFORM: SUPABASE / STANDALONE POSTGRESQL 15+
-- ========================================================

-- 1. CREATE FAN PROFILES TABLE
CREATE TABLE public.fan_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    homebase_location VARCHAR(255),
    registration_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE ROW-LEVEL SECURITY
ALTER TABLE public.fan_profiles ENABLE ROW LEVEL SECURITY;

-- 2. CREATE STAGED TICKETS ALLOCATION TABLE (FKs mapping nodes & profiles)
CREATE TABLE public.staged_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_node_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    fan_profile_id UUID NOT NULL REFERENCES public.fan_profiles(id) ON DELETE CASCADE,
    purchase_timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_scanned BOOLEAN DEFAULT false NOT NULL
);

-- ENABLE ROW-LEVEL SECURITY
ALTER TABLE public.staged_tickets ENABLE ROW LEVEL SECURITY;

-- 3. DEV/SERVICE-ROLE EXCLUSIVE PATHS (No public Read/Write policies created yet)
-- RLS default is RESTRICT/DENY ALL. Standard user authorization pipelines are halted in dev.
-- ACCESS IS ISOLATED SOLELY TO INTERNAL SERVICE_ROLE OR LOGGED ADMIN PATHS.
`;

  // Copied State
  const [copied, setCopied] = useState(false);

  // SECTION A: Simulated GPS Location & Perimeter (within 50 miles)
  const [useRealGps, setUseRealGps] = useState(false);
  const [gpsSimLocation, setGpsSimLocation] = useState<'Chicago' | 'Brooklyn' | 'Denver' | 'LA'>('Chicago');
  // Mock Lat / Lon
  const gpsCoords = {
    Chicago: { lat: 41.8781, lon: -87.6298, name: 'Chicago, IL (Subterranean Area)' },
    Brooklyn: { lat: 40.7128, lon: -73.9352, name: 'Brooklyn, NY (Saint Vitus Area)' },
    Denver: { lat: 39.7392, lon: -104.9903, name: 'Denver, CO (Red Rocks Area)' },
    LA: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles, CA (No Tour Stops)' }
  };

  // Location distances (hardcoded realistic approximations from respective cities)
  const getDistanceMiles = (showCity: string): number => {
    const curCity = gpsSimLocation.toLowerCase();
    const cityLower = showCity.toLowerCase();
    
    if (curCity === 'chicago') {
      if (cityLower.includes('chicago')) return 2.4;
      if (cityLower.includes('brooklyn') || cityLower.includes('ny')) return 712;
      if (cityLower.includes('denver') || cityLower.includes('co')) return 918;
    }
    if (curCity === 'brooklyn') {
      if (cityLower.includes('chicago')) return 712;
      if (cityLower.includes('brooklyn') || cityLower.includes('ny')) return 4.1;
      if (cityLower.includes('denver') || cityLower.includes('co')) return 1620;
    }
    if (curCity === 'denver') {
      if (cityLower.includes('chicago')) return 918;
      if (cityLower.includes('brooklyn') || cityLower.includes('ny')) return 1620;
      if (cityLower.includes('denver') || cityLower.includes('co')) return 12.8;
    }
    // LA
    return 1000 + Math.random() * 500;
  };

  const currentCoords = gpsCoords[gpsSimLocation];

  // Simulated DB State
  const [simFans, setSimFans] = useState<FanProfile[]>([
    { id: 'fan_001', username: 'grindcore_warrior', homebase_location: 'Chicago, IL', registration_timestamp: '2026-06-01T12:00:00Z', scans_count: 3 },
    { id: 'fan_002', username: 'doom_gazer', homebase_location: 'Brooklyn, NY', registration_timestamp: '2026-06-05T14:30:00Z', scans_count: 1 },
    { id: 'fan_003', username: 'slam_enthusiast', homebase_location: 'Denver, CO', registration_timestamp: '2026-06-10T09:15:00Z', scans_count: 0 }
  ]);

  const [sandboxLogs, setSandboxLogs] = useState<string[]>([
    'SYSTEM Initialized [FOH_SANDBOX_LOG]',
    'Row level security schemas pre-validated.',
    'Ready for simulated ticket validation pipelines.'
  ]);

  // Input states for generating a new mock fan profile
  const [newFanUsername, setNewFanUsername] = useState('');
  const [newFanLocation, setNewFanLocation] = useState('Chicago, IL');

  const addSandboxLog = (msg: string) => {
    const formatted = `[${new Date().toLocaleTimeString()}] ${msg}`;
    setSandboxLogs(prev => [formatted, ...prev].slice(0, 50));
    console.log('[FOH_SANDBOX_LOG]', msg);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlDdl);
    setCopied(true);
    if (triggerNotification) triggerNotification('📋 PostgreSQL Schema Code Copied!');
    addSandboxLog('Copied PostgreSQL DDL Schema text block to memory buffer.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateMockFan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFanUsername.trim()) return;

    const handle = newFanUsername.trim().toLowerCase().replace(/\s+/g, '_');
    const newFan: FanProfile = {
      id: `fan_${Date.now()}`,
      username: handle,
      homebase_location: newFanLocation || 'Chicago, IL',
      registration_timestamp: new Date().toISOString(),
      scans_count: 0
    };

    setSimFans(prev => [...prev, newFan]);
    setNewFanUsername('');
    addSandboxLog(`Staged new consumer fan profile: @${handle} (${newFan.homebase_location})`);
    if (triggerNotification) triggerNotification(`🟢 Staged mock fan @${handle}`);
  };

  // Scan ticketing scanner simulation
  const handleScanTicket = (fanId: string) => {
    setSimFans(prev => prev.map(fan => {
      if (fan.id === fanId) {
        const nextScansCount = fan.scans_count + 1;
        let tier = 'BRONZE';
        let mult = 1.0;
        
        if (nextScansCount >= 4) {
          tier = 'DIAMOND';
          mult = 2.0;
        } else if (nextScansCount === 3) {
          tier = 'GOLD';
          mult = 1.5;
        } else if (nextScansCount === 2) {
          tier = 'SILVER';
          mult = 1.25;
        }
        
        addSandboxLog(`Scan processed: Fan @${fan.username} ticket updated. Scans: ${nextScansCount}. Loyalty Tier: [${tier}]. Reward Multiplier: ${mult}x.`);
        if (triggerNotification) triggerNotification(`🎫 Ticket validated for @${fan.username}! [${tier} ${mult}x]`);
        
        return {
          ...fan,
          scans_count: nextScansCount
        };
      }
      return fan;
    }));
  };

  // Get active loyalty tier
  const getLoyaltyTierDetails = (scans: number) => {
    if (scans >= 4) return { tier: 'DIAMOND', mult: 2.0, color: 'text-cyan-400 border-cyan-400/30 bg-cyan-950/10' };
    if (scans === 3) return { tier: 'GOLD', mult: 1.5, color: 'text-amber-400 border-amber-400/30 bg-amber-950/10' };
    if (scans === 2) return { tier: 'SILVER', mult: 1.25, color: 'text-zinc-300 border-zinc-300/30 bg-zinc-800/10' };
    if (scans === 1) return { tier: 'BRONZE', mult: 1.0, color: 'text-orange-500 border-orange-500/20 bg-orange-950/10' };
    return { tier: 'UNRANKED', mult: 0.0, color: 'text-zinc-500 border-zinc-900 bg-black/10' };
  };

  return (
    <div className="space-y-6 text-left">
      {/* Heavy Cyber-Brutalist WARNING System Banner */}
      <div className="p-4 bg-amber-950/30 border-2 border-red-500/50 rounded-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <ShieldAlert className="w-24 h-24 text-red-500" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 relative z-10">
          <div className="p-2.5 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-black text-white tracking-widest uppercase">
              [ SECURITY WARNING // ALPHABETICAL SANDBOX: UNRELEASED FOH CONSUMER CONSOLE LAYER ]
            </h3>
            <p className="text-[10px] font-mono text-zinc-400 mt-1 leading-relaxed">
              DANGEROUS DEVELOPER PERIMETER. This isolated environment coordinates future consumer interfaces (Fan Profiles, Scan Matrix, ticketing tables) under strict Row-Level Security protocol. All mutations trigger LOCAL LOG STREAMS only to prevent pipeline pollution.
            </p>
          </div>
        </div>
      </div>

      {/* Relational Schema DDL Container */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-850 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase font-black text-zinc-300">
              Database Schema Initialization (DDL Block)
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopySql}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-lg font-mono text-[9px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> [ COPIED! ]
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> [ COPY SQL ]
              </>
            )}
          </button>
        </div>
        <div className="p-4">
          <p className="text-[10px] text-zinc-400 font-sans leading-normal mb-3">
            Copy and run this PostgreSQL script within your Supabase SQL Editor to stand up the core relational consumer-tracking framework under safe RLS rules:
          </p>
          <pre className="p-3 bg-[#0a0c10] border border-zinc-900 text-zinc-400 text-[10px] font-mono rounded-xl max-h-[180px] overflow-y-auto whitespace-pre leading-relaxed select-all">
            {sqlDdl}
          </pre>
        </div>
      </div>

      {/* THREE SECTION SANDBOX RENDER (FOH COMMAND PANEL) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Section A: Broadcast Perimeter (GPS Sim) */}
        <div className="col-span-1 lg:col-span-4 bg-[#0e1015] border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-[9.5px] font-mono font-black text-[#00ffcc] tracking-widest uppercase">
                Section A // Broadcast Perimeter
              </span>
              <Wifi className="w-3.5 h-3.5 text-[#00ffcc] animate-pulse" />
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-black/50 border border-zinc-900 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase">
                  <span>GPS Coordinates</span>
                  <span className="text-emerald-400 font-bold">● VIRTUAL FIXED</span>
                </div>
                <div className="text-white text-xs font-mono font-bold">
                  {currentCoords.name}
                </div>
                <div className="text-[10.5px] font-mono text-zinc-550 leading-none">
                  LAT: {currentCoords.lat.toFixed(5)} • LON: {currentCoords.lon.toFixed(5)}
                </div>
              </div>

              {/* Selector for virtual location */}
              <div className="space-y-1.5">
                <span className="text-[8px] font-mono text-zinc-550 uppercase block font-black">SHIFT SIMULATED RADIUS VECTOR</span>
                <div className="grid grid-cols-4 gap-1">
                  {(['Chicago', 'Brooklyn', 'Denver', 'LA'] as const).map((loc, lIdx) => (
                    <button
                      key={`${loc}-${lIdx}`}
                      type="button"
                      onClick={() => {
                        setGpsSimLocation(loc);
                        addSandboxLog(`Manual location override shifted vector target to: [${loc}]`);
                      }}
                      className={`py-1 text-[9px] font-mono font-black rounded border cursor-pointer uppercase transition-all ${
                        gpsSimLocation === loc
                          ? 'bg-[#00ffcc]/10 border-[#00ffcc]/40 text-[#00ffcc]'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:border-zinc-800'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-900/40 text-left space-y-2">
            <span className="text-[8.5px] font-mono text-zinc-550 uppercase tracking-wider block font-bold">REGIONAL NODES IN CO-OP RANGE (&lt; 50 MILES):</span>
            <div className="space-y-1">
              {shows.filter(s => getDistanceMiles(s.city) < 50).length === 0 ? (
                <div className="p-2 bg-black/20 text-center rounded border border-zinc-950 text-[10px] text-zinc-550 font-mono italic">
                  No active tour stops in 50M range vector
                </div>
              ) : (
                shows.filter(s => getDistanceMiles(s.city) < 50).map((s, sIdx) => (
                  <div key={`${s.id}-${sIdx}`} className="flex justify-between items-center p-2 bg-black/40 rounded border border-zinc-900 text-[10px] font-mono">
                    <span className="text-white font-bold max-w-[130px] truncate">{s.name || s.city}</span>
                    <span className="text-[#00ffcc] font-black shrink-0">~{getDistanceMiles(s.city).toFixed(1)} MILES</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section B: Regional Ticketing Matrix */}
        <div className="col-span-1 lg:col-span-5 bg-[#0e1015] border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-[9.5px] font-mono font-black text-amber-500 tracking-widest uppercase">
                Section B // regional ticketing matrix
              </span>
              <Ticket className="w-3.5 h-3.5 text-amber-500" />
            </div>

            <p className="text-[10px] text-zinc-400 font-mono leading-relaxed">
              Active scheduled dates pulling automatically from <code className="text-amber-500 underline">public.staged_tour_nodes</code> memory. Dead-link gates verify UI allocations are locked in test configuration.
            </p>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {shows.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-zinc-900 rounded-xl">
                  <span className="text-[10px] font-mono text-zinc-650 uppercase">No Dates Registered in memory.</span>
                </div>
              ) : (
                shows.map((show, shIdx) => {
                  const distance = getDistanceMiles(show.city);
                  const isInRange = distance < 50;
                  return (
                    <div 
                      key={`${show.id}-${shIdx}`} 
                      className={`p-2.5 rounded-xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-all bg-black/40 ${
                        isInRange ? 'border-zinc-800' : 'border-zinc-950 opacity-60'
                      }`}
                    >
                      <div className="text-left space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11.5px] font-mono font-black text-white">{show.city}</span>
                          <span className={`text-[8px] font-mono font-extrabold px-1 rounded uppercase ${
                            isInRange ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-950 text-zinc-550 border border-zinc-900'
                          }`}>
                            {isInRange ? 'In Range' : 'Too Far'}
                          </span>
                        </div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase">
                          {show.date} • {show.name || 'Unknown Venue'}
                        </div>
                      </div>

                      <button
                        disabled
                        type="button"
                        className="py-1 px-2.5 bg-zinc-900 border border-zinc-800 text-zinc-600 rounded text-[8.5px] font-mono font-black tracking-tight select-none cursor-not-allowed shrink-0 border-dashed"
                      >
                        [ SECURE TICKET (DISABLED IN DEV) ]
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900/40 text-left text-[9.5px] font-mono text-zinc-550 flex justify-between items-center gap-1 uppercase">
            <span>Verified Source Table:</span>
            <span className="text-amber-500 font-extrabold font-mono">PUBLIC.STAGED_TOUR_NODES</span>
          </div>
        </div>

        {/* Section C: VIP Loyalty Ledger */}
        <div className="col-span-1 lg:col-span-3 bg-[#0e1015] border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-[9.5px] font-mono font-black text-purple-400 tracking-widest uppercase">
                Section C // VIP Loyalty Ledger
              </span>
              <Award className="w-3.5 h-3.5 text-purple-400" />
            </div>

            <div className="space-y-3">
              <form onSubmit={handleCreateMockFan} className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="New Fan Handle"
                  value={newFanUsername}
                  onChange={(e) => setNewFanUsername(e.target.value)}
                  className="bg-black border border-zinc-850 rounded px-2 py-1 text-[10px] font-mono text-white focus:outline-none focus:border-purple-400 placeholder:text-zinc-650 flex-grow"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-purple-500 hover:bg-purple-400 text-black rounded text-[9.5px] font-mono font-black uppercase shrink-0 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Stg
                </button>
              </form>

              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {simFans.map((fan, idx) => {
                  const details = getLoyaltyTierDetails(fan.scans_count);
                  return (
                    <div key={`${fan.id}-${idx}`} className="p-2 bg-black rounded-lg border border-zinc-900 flex items-center justify-between gap-1.5 text-left">
                      <div className="space-y-1 min-w-0">
                        <span className="text-[10px] font-mono text-zinc-300 font-bold block truncate">@{fan.username}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-mono font-black border uppercase px-1 rounded ${details.color}`}>
                            {details.tier}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-550">
                            ({fan.scans_count} scans)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleScanTicket(fan.id)}
                        className="py-1 px-1.5 bg-zinc-900 hover:bg-purple-950/20 border border-zinc-850 hover:border-purple-500/35 text-[9px] font-mono text-zinc-400 hover:text-purple-400 rounded uppercase font-black cursor-pointer transition shrink-0"
                        title="Simulate Ticket Scan Update"
                      >
                        [ SCAN ]
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900/40 text-left space-y-1 uppercase font-mono">
            <div className="flex justify-between items-center text-[8.5px] text-purple-400">
              <span>ACTIVE FAN REGISTRY CO-OP TYPE:</span>
              <span className="font-extrabold text-[9px]">PUBLIC.FAN_PROFILES</span>
            </div>
          </div>
        </div>

      </div>

      {/* Local Monospace Execution Log Stream */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-zinc-500 font-mono text-[9px] uppercase tracking-wider">
          <span>CONSOLE PIPE STREAM OVERWATCH // [FOH_SANDBOX_LOG]</span>
          <span className="text-[8px] tracking-widest text-[#00ffcc]">ONLINE SYNC HALTED IN DEV</span>
        </div>
        <div className="bg-black p-3.5 border border-zinc-900 rounded-xl space-y-1 max-h-[120px] overflow-y-auto font-mono text-[10.5px] text-zinc-500 leading-normal scroll-smooth">
          {sandboxLogs.map((log, i) => (
            <div key={`fan-deck-row-${i}`} className="font-mono text-zinc-400 truncate">
              <span className="text-purple-400/80 mr-1.5">▋</span>
              {log}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
