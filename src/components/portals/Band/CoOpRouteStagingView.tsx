import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Plus, Trash2, Calendar, MapPin, Truck, Settings, Share2, Send, Activity, UserPlus, Clock, Sparkles, Users, Fuel, AlertTriangle, FileText, Check, Copy, TrendingUp, RefreshCw, Sun, CloudSun, Wind, Thermometer, CloudRain, CloudSnow, CloudLightning, Cloud } from 'lucide-react';
import { motion } from 'motion/react';
import { getShowWeatherAndWarnings } from './ShowsView';

// Coordinates registry for major tour nodes to simulate highly realistic routes
const cityCoords: { [key: string]: { lat: number; lng: number } } = {
  'AUSTIN, TX': { lat: 30.2672, lng: -97.7431 },
  'AUSTIN': { lat: 30.2672, lng: -97.7431 },
  'FORT WORTH, TX': { lat: 32.7555, lng: -97.3308 },
  'FORT WORTH': { lat: 32.7555, lng: -97.3308 },
  'CHICAGO, IL': { lat: 41.8781, lng: -87.6298 },
  'CHICAGO': { lat: 41.8781, lng: -87.6298 },
  'CUDAHY, WI': { lat: 42.9492, lng: -87.8601 },
  'CUDAHY': { lat: 42.9492, lng: -87.8601 },
  'LOS ANGELES, CA': { lat: 34.0522, lng: -118.2437 },
  'LOS ANGELES': { lat: 34.0522, lng: -118.2437 },
  'SAN FRANCISCO, CA': { lat: 37.7749, lng: -122.4194 },
  'SAN FRANCISCO': { lat: 37.7749, lng: -122.4194 },
  'DENVER, CO': { lat: 39.7392, lng: -104.9903 },
  'DENVER': { lat: 39.7392, lng: -104.9903 },
  'SEATTLE, WA': { lat: 47.6062, lng: -122.3321 },
  'SEATTLE': { lat: 47.6062, lng: -122.3321 },
};

// Procedural distance calculation mimicking actual road routing curves
function getTransitMetrics(cityA: string, cityB: string) {
  if (!cityA || !cityB) return { distance: 0, hours: 0 };
  
  const cleanA = cityA.toUpperCase().replace(/[.[\]]/g, '').trim();
  const cleanB = cityB.toUpperCase().replace(/[.[\]]/g, '').trim();
  
  if (cleanA === cleanB) return { distance: 0, hours: 0 };
  
  const coordA = cityCoords[cleanA] || cityCoords[cleanA.split(',')[0].trim()] || null;
  const coordB = cityCoords[cleanB] || cityCoords[cleanB.split(',')[0].trim()] || null;
  
  if (coordA && coordB) {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (coordB.lat - coordA.lat) * Math.PI / 180;
    const dLng = (coordB.lng - coordA.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coordA.lat * Math.PI / 180) * Math.cos(coordB.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceMiles = Math.round(R * c);
    
    // Add 15% winding road extension multiplier for travel accuracy
    const realisticMiles = Math.round(distanceMiles * 1.15);
    const drivingHours = Number((realisticMiles / 55).toFixed(1)); // Avg commercial tour vehicle speed is 55mph with stops
    return { distance: realisticMiles, hours: drivingHours };
  }
  
  // Custom hash fallback so that arbitrary typing yields realistic distance increments
  let hashA = 0;
  for (let i = 0; i < cleanA.length; i++) hashA += cleanA.charCodeAt(i) * (i + 1);
  let hashB = 0;
  for (let i = 0; i < cleanB.length; i++) hashB += cleanB.charCodeAt(i) * (i + 1);
  
  const diff = Math.abs(hashA - hashB);
  const distanceMiles = (diff % 520) + 95; // Reasonable procedural miles between 95 and 615
  const drivingHours = Number((distanceMiles / 55).toFixed(1));
  return { distance: distanceMiles, hours: drivingHours };
}

// Maps weather conditions to appropriate lucide icons
const getWeatherIcon = (conditions: string) => {
  const cond = conditions.toLowerCase();
  if (cond.includes('snow') || cond.includes('blizzard') || cond.includes('freezing')) return <CloudSnow className="w-3.5 h-3.5 text-sky-400" />;
  if (cond.includes('lightning') || cond.includes('thunderstorm')) return <CloudLightning className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />;
  if (cond.includes('rain') || cond.includes('shower') || cond.includes('storm')) return <CloudRain className="w-3.5 h-3.5 text-blue-400" />;
  if (cond.includes('wind') || cond.includes('breeze') || cond.includes('gale')) return <Wind className="w-3.5 h-3.5 text-teal-400" />;
  if (cond.includes('sunny') || cond.includes('clear') || cond.includes('heat')) return <Sun className="w-3.5 h-3.5 text-amber-400" />;
  if (cond.includes('cloudy') || cond.includes('overcast')) return <CloudSun className="w-3.5 h-3.5 text-zinc-400" />;
  return <Cloud className="w-3.5 h-3.5 text-zinc-400" />;
};

// Formats a custom legal performance contract matching physical co-op constraints
function generateCoOpShowContractDoc({
  tourName,
  node,
  bands,
  guaranteeBasis,
  shareDrums,
  shareBass,
  shareGuitar,
  shareCustom,
  customGearNotes
}: any) {
  const dateStr = node.date || '[ PENDING DATE VALUE ]';
  const venueStr = node.venue || '[ PENDING VENUE SELECTION ]';
  const cityStr = node.city || '[ PENDING CITY CORRIDOR ]';
  const tourTitle = tourName ? tourName.toUpperCase() : 'CO-OPERATIVE STAGED RUN';
  
  const bandGuaranteesText = bands.map((b: any) => {
    return `- ${b.name}: $${b.guarantee} USD (${guaranteeBasis === 'PER_SHOW' ? 'Per-Show Base Guarantee' : 'Consolidated Total split allocation'})`;
  }).join('\n');
  
  const totalCoreGuar = bands.reduce((acc: number, b: any) => acc + (Number(b.guarantee) || 0), 0);
  const supportBands = node.localSupports || [];
  const supportGuar = supportBands.reduce((acc: number, s: any) => acc + (Number(s.guarantee) || 0), 0);
  const totalContractVal = totalCoreGuar + supportGuar;
  
  const supportText = supportBands.length > 0
    ? supportBands.map((s: any) => `- ${s.name} (Leg Support): $${s.guarantee} USD`).join('\n')
    : "- None (Core Tour Package bands execute full performance slots)";
    
  const gearShared = [];
  if (shareDrums) gearShared.push("Drum kit shells and master hardware");
  if (shareBass) gearShared.push("Bass Cabinet rig & amplifier head");
  if (shareGuitar) gearShared.push("Guitar cabinets in shared stage configuration");
  if (shareCustom && customGearNotes) gearShared.push(`Custom: ${customGearNotes}`);
  const gearText = gearShared.length > 0 
    ? gearShared.map((g: string) => `- SHARED CO-OP GEAR: ${g}`).join('\n')
    : "- INDEPENDENT LOAD-IN: No shared/co-op backline variables requested.";

  return `===================================================================
CO-OPERATIVE PERFORMANCE BLOCK AGREEMENT & SHOW RIDER
VALUATION REGISTRY: NXS-STAGE-PORTAL // GEN-550
===================================================================

[TOUR IDENTIFIER] 
"${tourTitle}"

[SHOW / LEG DETAILS]
Date/Reference: ${dateStr}
Scheduled Venue: ${venueStr}
City Corridor: ${cityStr}

-------------------------------------------------------------------
Section 1: RUNNING FINANCIAL ALLOCATIONS & GUARANTEES
-------------------------------------------------------------------
The local promoter at ${venueStr} guarantees a complete block package
performance sum of $${totalContractVal} USD for the event.

Itemized Stage Co-Op Splits:
${bandGuaranteesText}

Date-Specific Local Leg Supports:
${supportText}

-------------------------------------------------------------------
Section 2: TIMELINE & OPERATIONAL RUNNING ORDER
-------------------------------------------------------------------
Standard Co-Op staging running order applies as scheduled in the 
workspace timeline. Key checkpoints:
- Target Load-In: ${node.loadIn}
- Core Performance Kick-off: ${node.setTime}

-------------------------------------------------------------------
Section 3: BACKLINE GEAR SHARING & PLATFORM DIRECTIVES
-------------------------------------------------------------------
To accelerate load-shares and optimize staging times, artists agree 
to the following backline arrangements:
${gearText}

-------------------------------------------------------------------
Section 4: CO-OP PLATFORM SIGN-OFF VALIDATION
-------------------------------------------------------------------
All staged performance parties are registered on the Nexus Staging Portal.
Authorized digitally signed records dispatched to the Venue Booking Envoy:
${bands.map((b: any) => `- [✅] SIGNED BY: ${b.name}`).join('\n')}

Agreement generated automatically. Preserves cooperative scheduling integrity.
===================================================================`;
}

interface CoOpRouteStagingViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandName?: string;
}

const defaultSchedule = [
  { id: '1', time: '14:00', label: 'Co-op load-in & load-share' },
  { id: '2', time: '16:00', label: 'Shared Gear Setup' },
  { id: '3', time: '17:00', label: 'Co-Bill Soundcheck' },
  { id: '4', time: '18:00', label: 'Your Soundcheck' },
  { id: '5', time: '19:00', label: 'Doors Open' },
  { id: '6', time: '20:00', label: 'Co-Bill Performance' },
  { id: '7', time: '21:30', label: 'Your Performance' },
  { id: '8', time: '23:00', label: 'Curfew / Outload' }
];

export default function CoOpRouteStagingView({ onBack, triggerNotification, addLog, activeBandName }: CoOpRouteStagingViewProps) {
  const [tourName, setTourName] = useState('');
  const [transportType, setTransportType] = useState('Shared Van & Trailer');
  const [isLive, setIsLive] = useState(false);

  // Time format toggle (12hr vs 24hr)
  const [use24Hour, setUse24Hour] = useState(true);

  // Content-Aware Venue Database
  const [venueDatabase, setVenueDatabase] = useState<any[]>([]);
  const [showVenueSuggestions, setShowVenueSuggestions] = useState<{ [nodeId: string]: boolean }>({});
  const [showCitySuggestions, setShowCitySuggestions] = useState<{ [nodeId: string]: boolean }>({});

  // Active expanded schedule planner ID
  const [expandedScheduleNodeId, setExpandedScheduleNodeId] = useState<string | null>(null);

  // Intentional Data Inputs & Backline
  const [shareDrums, setShareDrums] = useState(false);
  const [shareBass, setShareBass] = useState(false);
  const [shareGuitar, setShareGuitar] = useState(false);
  const [shareCustom, setShareCustom] = useState(false);
  const [customGearNotes, setCustomGearNotes] = useState('');

  // Structured Gear Loadout Matrix state
  const [gearAssets, setGearAssets] = useState<any[]>([
    {
      id: 'acoustic_drums',
      name: 'MAPEX MARS SERIES DRUM KIT (6-Piece Shell Pack)',
      category: 'Drums',
      supplierId: 'host',
      utilizerIds: ['host', 'band_1'],
      customDrumhead: { host: false, band_1: false },
      wirelessIsolate: { host: false, band_1: false }
    },
    {
      id: 'iem_rack',
      name: 'Wireless IEM & Mic Receiver Rack (Ch. 1-8)',
      category: 'Wireless / IEM',
      supplierId: 'host',
      utilizerIds: ['host'],
      customDrumhead: {},
      wirelessIsolate: { host: false, band_1: false }
    },
    {
      id: 'bass_rig',
      name: 'SVT Bass Cabinet Stage Rig (8x10 Cab + SVT Head)',
      category: 'Amps & Cabinets',
      supplierId: 'band_1',
      utilizerIds: ['host', 'band_1'],
      customDrumhead: {},
      wirelessIsolate: {}
    },
    {
      id: 'guitar_cab_1',
      name: 'Stage Guitar Cabinet A (Marshall 1960B 4x12)',
      category: 'Amps & Cabinets',
      supplierId: 'host',
      utilizerIds: ['host', 'band_1'],
      customDrumhead: {},
      wirelessIsolate: {}
    }
  ]);
  const [newGearName, setNewGearName] = useState('');
  const [newGearCategory, setNewGearCategory] = useState('Amps & Cabinets');

  // Premium multi-band state supporting up to 5 spots
  const [bands, setBands] = useState<any[]>([
    { id: 'host', name: (activeBandName && activeBandName !== 'Artist' ? activeBandName : 'VIRULENT EXCISION').toUpperCase(), guarantee: 800, accepted: true, isRegistered: true, isHost: true, role: 'HEADLINER' },
    { id: 'band_1', name: 'VOID_REAPER', guarantee: 600, accepted: false, isRegistered: false, isHost: false, role: 'SUPPORT' }
  ]);

  useEffect(() => {
    if (activeBandName && activeBandName !== 'Artist') {
      setBands(prev => prev.map(b => b.isHost ? { ...b, name: activeBandName.toUpperCase() } : b));
    }
  }, [activeBandName]);

  // Financial verification shares configuration state
  const [yourShare, setYourShare] = useState<number>(50);
  const [partnerShare, setPartnerShare] = useState<number>(50);

  // Collapsible Road Map Active Node
  const [activeNodeIndex, setActiveNodeIndex] = useState<number | null>(0);

  // Collapsible sections - closed by default
  const [isCardACollapsed, setIsCardACollapsed] = useState<boolean>(false);
  const [isCardBCollapsed, setIsCardBCollapsed] = useState<boolean>(true);
  const [isCardCCollapsed, setIsCardCCollapsed] = useState<boolean>(true);
  const [isFuelCollapsed, setIsFuelCollapsed] = useState<boolean>(true);
  const [isRoadMapCollapsed, setIsRoadMapCollapsed] = useState<boolean>(true);

  // Live Deal Calculator Slider States
  const [estimatedAttendance, setEstimatedAttendance] = useState<number>(300);
  const [avgTicketPrice, setAvgTicketPrice] = useState<number>(15);

  // Valuation basis setting (Per Show guarantee vs consolidated Full Run guarantee)
  const [guaranteeBasis, setGuaranteeBasis] = useState<'PER_SHOW' | 'FULL_RUN'>('PER_SHOW');

  // Gas & Transit estimation states
  const [gasPrice, setGasPrice] = useState<number>(3.65);
  const [openedContractNodeId, setOpenedContractNodeId] = useState<string | null>(null);
  const [copiedContractNodeId, setCopiedContractNodeId] = useState<{ [nodeId: string]: boolean }>({});

  // Promoter pricing renegotiation interactive sandbox state
  const [promoterProposedPrice, setPromoterProposedPrice] = useState<number>(0);
  const [negotiationStatus, setNegotiationStatus] = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('NONE');
  const [negotiationLog, setNegotiationLog] = useState<string[]>([]);
  const [showPromoterSandbox, setShowPromoterSandbox] = useState(false);
  const [promoterGuarantees, setPromoterGuarantees] = useState<{ [bandId: string]: number }>({});

  // Load registered venues on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_core_venues');
      const defaultVenues = [
        { name: "Emo's Austin", city: "Austin", state_province: "TX" },
        { name: "Tulips FTW", city: "Fort Worth", state_province: "TX" },
        { name: "The Double Door", city: "Chicago", state_province: "IL" },
        { name: "Cactus Club", city: "Cudahy", state_province: "WI" },
        { name: "Whisky A Go Go", city: "Los Angeles", state_province: "CA" },
        { name: "The Fillmore", city: "San Francisco", state_province: "CA" },
        { name: "Bluebird Theater", city: "Denver", state_province: "CO" },
        { name: "Showbox", city: "Seattle", state_province: "WA" },
      ];
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setVenueDatabase(parsed);
          return;
        }
      }
      setVenueDatabase(defaultVenues);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Nodes (Dates with schedule lists)
  const [nodes, setNodes] = useState<any[]>([
    {
      id: 'node_1',
      date: '',
      city: '',
      venue: '',
      loadIn: '14:00',
      setTime: '21:00',
      backlineNotes: '',
      status: 'UNLOCKED',
      schedule: defaultSchedule,
      localSupports: []
    }
  ]);

  const handleInitializeStaging = () => {
    if (!tourName) {
      triggerNotification('Please provide a Tour Name.');
      return;
    }
    
    const blankBands = bands.filter(b => !b.name.trim());
    if (blankBands.length > 0) {
      triggerNotification('Please provide handles or names for all band slots.');
      return;
    }

    setIsLive(true);
    
    // Auto-verify pre-existing bands if any
    const knownBands = ['AUSTIN_DEATHMTL', 'GOREGRIND_CORPS', 'VOID_REAPER', 'YOUR_BAND'];
    const updatedBands = bands.map(b => {
      if (b.isHost) {
        return b;
      }
      const cleaned = b.name.toUpperCase().replace('@', '').trim();
      const isMockRegistered = knownBands.includes(cleaned);
      return {
        ...b,
        isRegistered: b.isRegistered || isMockRegistered,
        accepted: b.accepted || isMockRegistered,
      };
    });

    setBands(updatedBands);
    triggerNotification('CORE INITIALIZED: Multi-band block workspace activated.');
    
    const artistList = updatedBands.map(b => b.name).join(', ');
    addLog(`Staged new co-op run: ${tourName} with bands [${artistList}]`);
  };

  const handleAddNode = () => {
    const newId = `node_${Date.now()}`;
    setNodes([
      ...nodes,
      {
        id: newId,
        date: '',
        city: '',
        venue: '',
        loadIn: '14:00',
        setTime: '21:00',
        backlineNotes: '',
        status: 'UNLOCKED',
        schedule: defaultSchedule,
        localSupports: []
      }
    ]);
    setIsRoadMapCollapsed(false);
    setActiveNodeIndex(nodes.length);
  };

  const handleUpdateNode = (id: string, field: string, value: any) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(nodes.filter(n => n.id !== id));
  };

  const handleAddLocalSupport = (nodeId: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentSupports = n.localSupports || [];
      const newSupport = {
        id: `support_${Date.now()}`,
        name: '',
        guarantee: 250,
        accepted: true,
        isRegistered: false
      };
      return {
        ...n,
        localSupports: [...currentSupports, newSupport]
      };
    }));
    triggerNotification('Added local/leg support slot to show! 🎸');
  };

  const handleUpdateLocalSupport = (nodeId: string, supportId: string, field: string, value: any) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentSupports = n.localSupports || [];
      const updatedSupports = currentSupports.map((s: any) => 
        s.id === supportId ? { ...s, [field]: value } : s
      );
      return {
        ...n,
        localSupports: updatedSupports
      };
    }));
  };

  const handleDeleteLocalSupport = (nodeId: string, supportId: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentSupports = n.localSupports || [];
      return {
        ...n,
        localSupports: currentSupports.filter((s: any) => s.id !== supportId)
      };
    }));
    triggerNotification('Removed local/leg support slot.');
  };

  const handleUpdateScheduleItem = (nodeId: string, itemId: string, field: string, value: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentSchedule = n.schedule || defaultSchedule;
      const updatedSchedule = currentSchedule.map((item: any) => 
        item.id === itemId ? { ...item, [field]: value } : item
      );
      return { ...n, schedule: updatedSchedule };
    }));
  };

  const handleAddScheduleItem = (nodeId: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentSchedule = n.schedule || defaultSchedule;
      const newId = `sched_${Date.now()}`;
      return {
        ...n,
        schedule: [
          ...currentSchedule,
          { id: newId, time: '20:00', label: 'Custom Set / Logistics event' }
        ]
      };
    }));
    triggerNotification('Added event slot to running order planner! ⏱️');
  };

  const handleDeleteScheduleItem = (nodeId: string, itemId: string) => {
    setNodes(nodes.map(n => {
      if (n.id !== nodeId) return n;
      const currentSchedule = n.schedule || defaultSchedule;
      return {
        ...n,
        schedule: currentSchedule.filter((item: any) => item.id !== itemId)
      };
    }));
  };

  const handleDispatch = () => {
    triggerNotification('TRANSMITTING: Unified co-op block dispatched for regional routing.');
    addLog(`Dispatched Co-Op run ${tourName} directly to global promoters index.`);
  };

  const allBandsAccepted = bands.length > 0 && bands.every(b => b.accepted);
  const originalPackagePrice = bands.reduce((total, b) => total + (Number(b.guarantee) || 0), 0);
  const currentPackagePrice = negotiationStatus === 'ACCEPTED' ? promoterProposedPrice : originalPackagePrice;
  const isValidToDispatch = isLive && allBandsAccepted && bands.every(b => b.name.trim()) && (negotiationStatus !== 'PENDING');

  // ----------------------------------------------------
  // Dynamic Transit & Financial Calculations
  // ----------------------------------------------------
  // Helper to map transportType strings to active MPG rating
  const getRigMPG = (rig: string) => {
    const norm = rig.toLowerCase();
    if (norm.includes('bus')) return 6;
    if (norm.includes('sprinter') || norm.includes('cargo')) return 18;
    if (norm.includes('tour bus')) return 6;
    if (norm.includes('sedan') || norm.includes('eco') || norm.includes('independent')) return 12; // Independent caravan uses ~12 cumulative
    return 14; // Default/Shared Van & Trailer
  };

  const activeRigMPG = getRigMPG(transportType);

  // Compute total tour routing distance by consecutively mapping stop-by-stop pairs
  let totalTourDistance = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i - 1].city && nodes[i].city) {
      const transit = getTransitMetrics(nodes[i - 1].city, nodes[i].city);
      totalTourDistance += transit.distance;
    }
  }

  // Calculate estimated fuel cost from mileage, MPG, and current bench price
  const estimatedFuelCost = activeRigMPG > 0 ? (totalTourDistance / activeRigMPG) * gasPrice : 0;

  // Compute dynamic warnings and optimization cues for the Backline & Gear Loadout Matrix
  const computeGearMatrixAlerts = () => {
    const alerts: { type: 'danger' | 'warning' | 'info' | 'success'; text: string; action?: string }[] = [];

    const getBandName = (id: string) => {
      const b = bands.find(x => x.id === id);
      return b ? (b.name.trim() || `Band (${id})`) : (id === 'host' ? 'YOUR_BAND' : `Band (${id})`);
    };

    // Rule 1: Custom drumhead conflict on shared drum kit (category Drums)
    gearAssets.forEach(asset => {
      if ((asset.category === 'Drums' || asset.id === 'acoustic_drums') && asset.utilizerIds?.length >= 2) {
        const customDemandIds = asset.utilizerIds.filter((bid: string) => asset.customDrumhead?.[bid] === true);
        if (customDemandIds.length >= 2) {
          const names = customDemandIds.map((bid: string) => `@${getBandName(bid)}`).join(' and ');
          alerts.push({
            type: 'danger',
            text: `⚠️ CO-OP DRUMHEAD CONFLICT: Both ${names} are utilizing the shared "${asset.name}" and require custom logo drumhead swaps. Swapping drumheads midway through a multi-band set blocks changeovers and increases head-tear risk.`,
            action: "Recommend standard black display heads or bringing independent drum shell packs if set intervals are under 15 minutes."
          });
        }
      }
    });

    // Rule 2: Non-shareable wireless IEM receiver rack configurations (category Wireless)
    gearAssets.forEach(asset => {
      if ((asset.category.includes('Wireless') || asset.id === 'iem_rack') && asset.utilizerIds?.length >= 2) {
        const isolatedIds = asset.utilizerIds.filter((bid: string) => asset.wirelessIsolate?.[bid] === true);
        if (isolatedIds.length >= 2) {
          const names = isolatedIds.map((bid: string) => `@${getBandName(bid)}`).join(' and ');
          alerts.push({
            type: 'warning',
            text: `⚠️ RF SIGNAL OVERLAP WARNING: Multiple bands (${names}) specified non-shareable configurations for "${asset.name}". Shared high-density transmitter chains are highly prone to physical frequency intermodulation.`,
            action: "Allocate independent RF bands, or haul secondary frequency-isolated standalone chassis."
          });
        }
      }
    });

    // Rule 3: Redundant assets in trailer (Amps & Cabinets OR Drums) with active multiple suppliers but zero sharing
    const categoriesToCheck = ['Amps & Cabinets', 'Drums'];
    categoriesToCheck.forEach(cat => {
      const catAssets = gearAssets.filter(g => g.category === cat);
      const activeSuppliers = catAssets.filter(g => g.supplierId && g.supplierId !== 'PROMOTER' && g.supplierId !== '').map(g => g.supplierId);
      const uniqueSuppliers = Array.from(new Set(activeSuppliers));
      
      if (uniqueSuppliers.length >= 2) {
        // Find if they are mutually exclusive (each supplies an asset that only they use)
        const exclusiveDeals = catAssets.filter(g => g.supplierId && g.utilizerIds?.length === 1 && g.utilizerIds[0] === g.supplierId);
        if (exclusiveDeals.length >= 2) {
          const bandNameStrs = exclusiveDeals.map(g => `@${getBandName(g.supplierId)}`).join(' and ');
          alerts.push({
            type: 'info',
            text: `🚛 TRAILER VOLUME REDUNDANCY: Both ${bandNameStrs} are hauling independent ${cat} rigs with zero shared utilization. Heavy gear chunks reduce fleet fuel miles and crowd van beds.`,
            action: `Set one ${cat === 'Drums' ? 'drum shell pack' : 'cabinet'} as a shared asset utilized by both to cut transport payload by half.`
          });
        }
      }
    });

    // Rule 4: Supplier assigned but no utilizers
    gearAssets.forEach(item => {
      if (item.supplierId && item.supplierId !== 'PROMOTER' && (!item.utilizerIds || item.utilizerIds.length === 0)) {
        alerts.push({
          type: 'warning',
          text: `💡 DEAD WEIGHT IDLE RIG: "${item?.name}" is scheduled to be hauled by @${getBandName(item.supplierId)}, but zero active billing bands are registered to utilize it on stage.`,
          action: "Select 'No Supplier / Unassigned' or check utilizers to avoid moving unnecessary payload."
        });
      }
    });

    // Rule 5: Active utilizers but no supplier assigned
    gearAssets.forEach(item => {
      if (item.utilizerIds && item.utilizerIds.length > 0 && !item.supplierId) {
        alerts.push({
          type: 'danger',
          text: `⚠️ UNASSIGNED STAGE SUPPLY: "${item?.name}" has active player utilizers, but is not assigned to any supply band or promoter backup supply.`,
          action: "Please assign a supplier band immediately in the Gear Loadout Matrix to ensure it is hauled."
        });
      }
    });

    // Return the generated warnings
    return alerts;
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-0 font-mono">
      <div className="w-full space-y-4 mt-2 pb-6">
        
        {/* NEW HEADER TITLE */}
        <div className="text-center pt-1 pb-1">
          <p className="text-zinc-400 text-[11px] max-w-md mx-auto text-center leading-normal mt-1 mb-3">
            Team up with other bands to build a shared tour route. Group your logistics, split fuel costs, lock down payouts, and package your package together to pitch directly to promoters.
          </p>
        </div>

        {/* STEP 1: INITIAL CARD MATRIX INTAKE */}
        {!isLive && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 w-full"
          >
            {/* Card 1: The Valuation Card */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 mb-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">How Bands Get Paid</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Define how guarantees are calculated and split</p>
              </div>
              
              <div className="grid grid-cols-2 bg-zinc-900 rounded p-1 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setGuaranteeBasis('PER_SHOW');
                    triggerNotification('VALUATION BASIS: Per-Show Guarantees 💵');
                  }}
                  className={`text-[10px] py-2.5 font-bold uppercase transition-all rounded cursor-pointer text-center ${guaranteeBasis === 'PER_SHOW' ? 'bg-[#26014a] text-white shadow font-black border border-purple-500/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Per Show Basis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGuaranteeBasis('FULL_RUN');
                    triggerNotification('VALUATION BASIS: Full Tour Run Cumulative 💰');
                  }}
                  className={`text-[10px] py-2.5 font-bold uppercase transition-all rounded cursor-pointer text-center ${guaranteeBasis === 'FULL_RUN' ? 'bg-[#26014a] text-white shadow font-black border border-purple-500/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Full Run Basis
                </button>
              </div>
            </div>

            {/* Card 2: The Lineup Card */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 mb-4 space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Set Up the Tour Package</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Configure your package identity and artist lineup</p>
              </div>

              {/* Field 1: Tour Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Tour Name / Identifier</label>
                <input
                  type="text"
                  placeholder="[ ENTER TOUR NAME / IDENTIFIER (E.G. SUMERIAN EXCESS TOUR) ]"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  className="w-full bg-black border border-purple-500/50 hover:border-purple-400 focus:border-purple-400 focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] p-3 text-xs uppercase text-white placeholder-zinc-700 outline-none transition-all duration-300 rounded font-mono"
                />
              </div>

              {/* Field 2: Invited Bands */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Invited Bands & Guarantees (Max 5 spots total)</span>
                  {bands.length < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `band_${Date.now()}`;
                        setBands([...bands, { id: newId, name: '', guarantee: 500, accepted: false, isRegistered: false, isHost: false }]);
                        triggerNotification('Added new band slot. Max 5 total.');
                      }}
                      className="text-[9px] border border-[#A855F7]/30 bg-[#A855F7]/10 hover:bg-[#A855F7]/20 text-[#A855F7] px-2.5 py-1 uppercase font-bold cursor-pointer transition-colors rounded"
                    >
                      + Add Band Slot
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {bands.map((b, idx) => {
                    const rowClass = b.isHost 
                      ? "flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 border border-emerald-500/20 border-l-2 border-l-emerald-500 pl-3 bg-emerald-950/10 rounded"
                      : "flex flex-col sm:flex-row gap-3 items-stretch sm:items-center p-3 border border-purple-500/10 border-l-2 border-l-purple-500/60 pl-3 bg-purple-950/10 rounded";

                    return (
                      <div key={`${b.id}-${idx}`} className={rowClass}>
                        <div className="text-[9.5px] font-bold shrink-0 w-20 uppercase font-mono tracking-wider">
                          {b.isHost ? (
                            <span className="text-emerald-400">STAGE HOST</span>
                          ) : (
                            <span className="text-purple-400">INVITE #{idx}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder={b.isHost ? 'Your Band Handle / Name' : '@Band_Handle'}
                            value={b.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBands(bands.map(item => item.id === b.id ? { ...item, name: val } : item));
                            }}
                            className="w-full bg-black border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] focus:shadow-[0_0_12px_rgba(168,85,247,0.2)] text-white p-2.5 text-[11px] uppercase outline-none font-mono transition-all duration-300 rounded"
                          />
                        </div>

                        {b.isHost && (
                          <div className="w-36 shrink-0 relative">
                            <select
                              value={b.role || 'HEADLINER'}
                              onChange={(e) => {
                                const val = e.target.value;
                                setBands(bands.map(item => item.id === b.id ? { ...item, role: val } : item));
                                triggerNotification(`Host billing updated to ${val}`);
                              }}
                              className="w-full bg-black border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] text-white p-2.5 text-[10px] uppercase outline-none font-mono rounded appearance-none cursor-pointer h-[38px] text-left pl-3 pr-8"
                            >
                              <option value="HEADLINER" className="bg-zinc-950 text-white">HEADLINER</option>
                              <option value="CO-HEADLINER" className="bg-zinc-950 text-white">CO-HEADLINER</option>
                              <option value="SUPPORT" className="bg-zinc-950 text-white">SUPPORT</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-[13px] w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                          </div>
                        )}

                        <div className="flex gap-2 items-center">
                          <div className="flex items-center bg-black border border-[#262626] hover:border-[#A855F7]/55 focus-within:border-[#A855F7] focus-within:shadow-[0_0_12px_rgba(168,85,247,0.2)] px-2.5 w-40 shrink-0 h-[38px] transition-all duration-300 rounded">
                            <span className="text-zinc-500 text-[10px] pr-1">$</span>
                            <input
                              type="number"
                              placeholder="Guarantee"
                              value={b.guarantee}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setBands(bands.map(item => item.id === b.id ? { ...item, guarantee: val } : item));
                              }}
                              className="bg-black text-white p-1 text-[11px] outline-none w-full text-right font-mono"
                            />
                            <span className="text-[8px] text-zinc-500 pl-1.5 uppercase select-none font-bold shrink-0 tracking-widest">
                              {guaranteeBasis === 'PER_SHOW' ? 'Show' : 'Tour'}
                            </span>
                          </div>

                          {bands.length > 1 && !b.isHost ? (
                            <button
                              type="button"
                              onClick={() => {
                                setBands(bands.filter(item => item.id !== b.id));
                                triggerNotification('Removed band slot.');
                              }}
                              className="text-zinc-500 hover:text-red-400 p-2.5 cursor-pointer bg-black/40 border border-[#262626] hover:border-red-500/40 rounded transition-colors shrink-0"
                              title="Remove Band"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-[38px]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: The Logistics Card */}
            <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-5 mb-4 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Logistics & Transportation</h4>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Benchmark transit types and fuel costs to calculate travel splits</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field 3: Transportation Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Transportation Selection</label>
                  <div className="relative">
                    <Truck className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={transportType}
                      onChange={(e) => setTransportType(e.target.value)}
                      className="w-full bg-black border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] focus:shadow-[0_0_15px_rgba(168,85,247,0.25)] p-3 pl-10 text-xs uppercase text-white outline-none transition-all duration-300 appearance-none cursor-pointer font-mono shadow-[0_0_10px_rgba(0,0,0,0.5)] h-[42px] rounded"
                    >
                      <option value="Shared Van & Trailer">Shared Van & Trailer (14 MPG)</option>
                      <option value="Independent Vehicles">Independent Vehicles (12 MPG)</option>
                      <option value="Tour Bus Rig">Tour Bus Rig (6 MPG)</option>
                      <option value="Van & Trailer + Independent Car Combo">Van & Trailer + Car (10 MPG)</option>
                    </select>
                  </div>
                </div>

                {/* Field 4: Fuel Price Benchmark */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">Fuel Price Benchmark ($/Gal)</label>
                  <div className="flex items-center bg-black border border-[#262626] hover:border-[#A855F7]/55 focus-within:border-[#A855F7] focus-within:shadow-[0_0_15px_rgba(168,85,247,0.25)] h-[42px] px-3 transition-all duration-300 rounded">
                    <span className="text-zinc-500 text-xs font-bold">$</span>
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      max="10.00"
                      value={gasPrice}
                      onChange={(e) => setGasPrice(Number(e.target.value) || 3.65)}
                      className="bg-black text-white p-2 text-xs font-mono outline-none w-full text-right"
                      placeholder="3.65"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Submission Action */}
            <button
              onClick={handleInitializeStaging}
              className="w-full py-4 rounded font-bold uppercase tracking-widest text-sm bg-gradient-to-r from-purple-950 to-zinc-950 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-400 transition-all cursor-pointer text-center"
            >
              Create Tour Package ⚡
            </button>
          </motion.div>
        )}

        {isLive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Live Run Header */}
            <div className="w-[81%] mx-auto flex flex-col sm:flex-row border border-[#A855F7]/30 p-3.5 bg-zinc-950/90 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.1)] items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[9px] text-[#A855F7] uppercase tracking-wider block mb-1 font-mono">Active Scheduled Co-Op Region Run</span>
                <h3 className="text-xl font-black uppercase tracking-widest text-white">{tourName || 'UNNAMED CO-OP RUN'}</h3>
              </div>
              <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider block mb-1 font-mono">Primary Transport Rig</span>
                <span className="text-xs font-bold uppercase text-zinc-300">{transportType}</span>
              </div>
            </div>

            {/* Card A: Tour Package Status */}
            <div className="w-[90%] mx-auto bg-zinc-950/90 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-lg p-5 mb-4 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-400/40 transition-all duration-300">
              <div 
                onClick={() => {
                  const nextState = !isCardACollapsed;
                  setIsCardACollapsed(nextState);
                  if (!nextState) {
                    setIsCardBCollapsed(true);
                    setIsCardCCollapsed(true);
                    setIsFuelCollapsed(true);
                  }
                  triggerNotification(`TOUR PACKAGE STATUS: ${nextState ? 'COLLAPSED' : 'EXPANDED'}`);
                }}
                className="flex justify-between items-center cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold tracking-wide uppercase text-sm">
                    📦 Tour Package Status
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {isCardACollapsed ? 'EXPAND ＋' : 'DEFLATE －'}
                </span>
              </div>

              {!isCardACollapsed && (
                <div className="mt-4 space-y-4">
                  {/* Roster lists in flat, clean layout lanes with micro-text metrics */}
                  <div className="space-y-2.5">
                    {bands.map((b, idx) => (
                      <div 
                        key={`${b.id}-${idx}`}
                        className="bg-rose-950/20 border border-rose-500/20 rounded p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                              {b.name.startsWith('@') ? b.name : `@${b.name}`}
                            </span>
                            <span className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                              {b.role || (b.isHost ? 'HEADLINER' : 'SUPPORT')}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono font-bold uppercase">
                              {b.isHost ? 'Host' : 'Partner'}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-300 font-medium">
                            Guaranteed Payout: <span className="text-rose-400 font-bold font-mono">${b.guarantee}</span> per {guaranteeBasis === 'PER_SHOW' ? 'show' : 'tour'}
                          </div>
                          <div className="text-[10px] text-zinc-500 uppercase font-mono">
                            Status: {b.isRegistered ? "Verified Nexus Roster" : "Pending Verification"}
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto font-sans">
                          {/* Consent check */}
                          <div className="flex items-center justify-between md:justify-end gap-3 px-3 py-2 bg-black/40 border border-zinc-800 rounded">
                            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono">Consent:</span>
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={b.accepted}
                                disabled={b.isHost}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setBands(bands.map(item => item.id === b.id ? { ...item, accepted: checked } : item));
                                  triggerNotification(`Consent updated for ${b.name}`);
                                }}
                                className="sr-only"
                              />
                              <span className={`text-[10px] font-black uppercase font-mono ${b.accepted ? 'text-emerald-400' : 'text-zinc-500 hover:text-rose-400 transition-colors'}`}>
                                {b.accepted ? '[ ✓ SIGNED ]' : '[ ⚙ CLICK TO SIGN ]'}
                              </span>
                            </label>
                          </div>

                          {/* Invitation actions for non-registered */}
                          {!b.isRegistered && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const inviteLink = `${window.location.origin}/onboard?invite=coop_${tourName.toLowerCase().replace(/\s+/g, '_')}&band=${encodeURIComponent(b.name)}`;
                                  navigator.clipboard.writeText(inviteLink);
                                  triggerNotification(`COPIED ENCRYPTED ONBOARDING KEY FOR ${b.name} 🔑`);
                                  addLog(`Generated invitation deep link key for ${b.name}`);
                                }}
                                className="text-[9px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono font-bold px-3 py-2 uppercase transition-colors cursor-pointer rounded"
                              >
                                [ Copy Invite Key 🔑 ]
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setBands(bands.map(item => item.id === b.id ? { ...item, isRegistered: true, accepted: true } : item));
                                  triggerNotification(`Diagnostic verification bypassed for ${b.name} 🛡️`);
                                  addLog(`Bypassed verification sequence for ${b.name}`);
                                }}
                                className="text-[9px] bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-mono font-bold px-3 py-2 uppercase transition-colors cursor-pointer rounded"
                              >
                                [ Bypass ]
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

               {/* Card B: Shared Backline */}
            <div className="w-[90%] mx-auto bg-zinc-950/90 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] rounded-lg p-5 mb-4 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-purple-400/40 transition-all duration-300">
              <div 
                onClick={() => {
                  const nextState = !isCardBCollapsed;
                  setIsCardBCollapsed(nextState);
                  if (!nextState) {
                    setIsCardACollapsed(true);
                    setIsCardCCollapsed(true);
                    setIsFuelCollapsed(true);
                  }
                  triggerNotification(`SHARED BACKLINE: ${nextState ? 'COLLAPSED' : 'EXPANDED'}`);
                }}
                className="flex justify-between items-center cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold tracking-wide uppercase text-sm">
                    💰 Shared Backline
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {isCardBCollapsed ? 'EXPAND ＋' : 'DEFLATE －'}
                </span>
              </div>

              {!isCardBCollapsed && (
                <div className="mt-4 space-y-4">
                  {/* Baseline Payout Indicator */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 border border-purple-500/20 rounded">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block mb-1">Baseline Minimum Payout</span>
                      <div className="text-lg font-black text-white font-mono tracking-widest">
                        ${originalPackagePrice.toLocaleString()} <span className="text-xs text-purple-400 font-bold">USD {guaranteeBasis === 'PER_SHOW' ? 'PER SHOW' : 'FULL TOUR RUN'}</span>
                      </div>
                    </div>
                    {negotiationStatus === 'ACCEPTED' ? (
                      <div className="bg-emerald-950/45 border border-emerald-500/40 p-2 text-[10px] text-emerald-400 uppercase font-mono tracking-wide rounded">
                        [ TERMS LOCKED AT ${promoterProposedPrice} ]
                      </div>
                    ) : (
                      <span className="text-[9px] text-zinc-500 uppercase font-mono text-left max-w-xs leading-normal">
                        * Combined guarantees dictate the block price pitched to promoters.
                      </span>
                    )}
                  </div>

                  {/* Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] uppercase tracking-wide text-zinc-400 font-bold">
                        <span>Attendance</span>
                        <span className="text-purple-400 font-mono">{estimatedAttendance} Guests</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="1500"
                        step="25"
                        value={estimatedAttendance}
                        onChange={(e) => setEstimatedAttendance(Number(e.target.value))}
                        className="w-full h-1.5 bg-purple-950 accent-purple-400 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] uppercase tracking-wide text-zinc-400 font-bold">
                        <span>Ticket Price</span>
                        <span className="text-purple-400 font-mono">${avgTicketPrice}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="1"
                        value={avgTicketPrice}
                        onChange={(e) => setAvgTicketPrice(Number(e.target.value))}
                        className="w-full h-1.5 bg-purple-950 accent-purple-400 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Live Deal Calculator Output Box */}
                  {(() => {
                    const grossSales = estimatedAttendance * avgTicketPrice;
                    let bufferStatus = "";
                    let statusColor = "";
                    let bgClass = "";
                    if (grossSales >= originalPackagePrice * 1.8) {
                      bufferStatus = "✓ STRONG PROFIT BUFFER: Highly low-risk and attractive for venue promoters.";
                      statusColor = "text-emerald-400";
                      bgClass = "bg-emerald-950/20 border-emerald-500/20";
                    } else if (grossSales >= originalPackagePrice) {
                      bufferStatus = "⚠ MARGINAL BUFFER: Gross sales exceed guarantees, but margins will be tight.";
                      statusColor = "text-amber-400";
                      bgClass = "bg-amber-950/20 border-amber-500/20";
                    } else {
                      bufferStatus = "✗ HIGH RISK: Gross sales are below guaranteed payouts. Likely rejection.";
                      statusColor = "text-red-400";
                      bgClass = "bg-red-950/20 border-red-500/20";
                    }
                    return (
                      <div className="bg-[#050505] border border-purple-900/40 p-4 rounded space-y-2.5 font-mono text-xs">
                        <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-zinc-500 pb-1">
                          <span>Financial Simulation</span>
                          <span className="text-purple-400 font-sans">Gross Ticket Sales Model</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-zinc-400">Gross Ticket Revenue:</span>
                          <span className="text-base font-black text-white font-mono">
                            {estimatedAttendance} × ${avgTicketPrice} = <span className="text-purple-400">${grossSales.toLocaleString()}</span>
                          </span>
                        </div>
                        <p className={`p-2 rounded border text-[10.5px] leading-relaxed uppercase font-mono ${bgClass} ${statusColor}`}>
                          {bufferStatus}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Guarantee adjustments & splits */}
                  <div className="pt-3 border-t border-purple-950/40 space-y-3 font-sans">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block font-mono">Itemized Guarantees &amp; Splits</span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {bands.map((b, bIdx) => (
                        <div key={`${b.id}-${bIdx}`} className="bg-black/60 border border-zinc-900 p-2.5 rounded">
                          <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-1 font-mono">{b.name}</span>
                          <div className="flex items-center bg-zinc-950 border border-zinc-850 px-2 py-0.5 rounded">
                            <span className="text-purple-400 text-xs font-bold">$</span>
                            <input
                              type="number"
                              value={b.guarantee}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                setBands(bands.map(item => item.id === b.id ? { ...item, guarantee: val } : item));
                              }}
                              className="w-full bg-transparent p-0.5 text-white text-right outline-none font-bold text-xs font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <div className="bg-black/60 border border-zinc-900 p-2.5 rounded">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1 font-mono">Your Band Share (%)</span>
                        <input
                          type="number"
                          value={yourShare}
                          onChange={(e) => setYourShare(Number(e.target.value) || 0)}
                          className="w-full bg-transparent border border-zinc-850 bg-zinc-950 px-2 py-1 text-white text-right font-mono text-xs rounded"
                        />
                      </div>
                      <div className="bg-black/60 border border-zinc-900 p-2.5 rounded">
                        <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-1 font-mono">Partner Share (%)</span>
                        <input
                          type="number"
                          value={partnerShare}
                          onChange={(e) => setPartnerShare(Number(e.target.value) || 0)}
                          className="w-full bg-transparent border border-zinc-850 bg-zinc-950 px-2 py-1 text-white text-right font-mono text-xs rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Negotiation Trigger */}
                  {negotiationStatus === 'PENDING' && (
                    <div className="border border-amber-500 p-3 bg-amber-500/5 space-y-2 mt-2 rounded">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-amber-400 font-mono">
                        <span>⚠️ Inbound Promoter Counter-Offer Received</span>
                        <span className="text-[9px] text-zinc-500">Pending</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-normal uppercase font-mono">
                        A promoter has counter-offered <strong className="text-white">${promoterProposedPrice.toLocaleString()}</strong>.
                      </p>
                      <div className="flex gap-2 font-mono">
                        <button
                          type="button"
                          onClick={() => {
                            const acceptedBands = bands.map(b => {
                              const proposedCut = promoterGuarantees[b.id] !== undefined ? promoterGuarantees[b.id] : Math.round(b.guarantee * (promoterProposedPrice / (originalPackagePrice || 1)));
                              return { ...b, guarantee: proposedCut };
                            });
                            setBands(acceptedBands);
                            setNegotiationStatus('ACCEPTED');
                            triggerNotification('Accepted promoter terms ✓');
                          }}
                          className="bg-[#059669]/10 hover:bg-[#059669]/25 text-emerald-400 border border-emerald-500/40 text-[9px] uppercase font-bold py-1.5 px-3 rounded cursor-pointer"
                        >
                          [ Accept Offer ✓ ]
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNegotiationStatus('REJECTED');
                            triggerNotification('Rejected promoter terms ✗');
                          }}
                          className="bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/40 text-[9px] uppercase font-bold py-1.5 px-3 rounded cursor-pointer"
                        >
                          [ Reject Offer ✗ ]
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Card C: Shared Backline */}
            <div className="w-[90%] mx-auto bg-zinc-950/90 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] rounded-lg p-5 mb-4 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-purple-400/40 transition-all duration-300">
              <div 
                onClick={() => {
                  const nextState = !isCardCCollapsed;
                  setIsCardCCollapsed(nextState);
                  if (!nextState) {
                    setIsCardACollapsed(true);
                    setIsCardBCollapsed(true);
                    setIsFuelCollapsed(true);
                  }
                  triggerNotification(`SHARED BACKLINE: ${nextState ? 'COLLAPSED' : 'EXPANDED'}`);
                }}
                className="flex justify-between items-center cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold tracking-wide uppercase text-sm">
                    🛡️ Shared Backline
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {isCardCCollapsed ? 'EXPAND ＋' : 'DEFLATE －'}
                </span>
              </div>

              {!isCardCCollapsed && (
                <div className="mt-4 space-y-4">
                  <p className="text-[11px] text-zinc-400 leading-relaxed uppercase">
                    Coordinate shared hardware, amplifiers, drums, and monitoring equipment to save trailer space, reduce transport weight, and prevent duplicate gear loadouts.
                  </p>

                  {/* Active Co-Op Logistics Warnings */}
                  {(() => {
                    const alerts = computeGearMatrixAlerts();
                    return (
                      <div className="space-y-1.5 font-mono">
                        {alerts.map((al, idx) => (
                          <div 
                            key={`coop-route-step-${idx}`} 
                            className={`p-2.5 border text-[10.5px] uppercase flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                              al.type === 'danger' ? 'bg-red-950/20 border-red-500/30 text-red-300' :
                              al.type === 'warning' ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' :
                              al.type === 'info' ? 'bg-blue-950/20 border-blue-500/20 text-blue-300' :
                              'bg-emerald-950/20 border-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            <div>
                              <p className="font-bold">{al.text}</p>
                              {al.action && (
                                <p className="text-[9px] text-zinc-500 normal-case italic mt-0.5">
                                  Action required: {al.action}
                                </p>
                              )}
                            </div>
                            <span className="text-[8px] bg-black/40 px-1.5 py-0.5 border border-white/10 uppercase select-none font-bold">
                              {al.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Backline Asset Cards (Flat Stack) */}
                  <div className="space-y-3">
                    {gearAssets.map((asset, idx) => {
                      const handleUpdateSupplier = (assetId: string, supplierId: string) => {
                        setGearAssets(prev => prev.map(item => item.id === assetId ? { ...item, supplierId } : item));
                        triggerNotification('Updated supplier assigned for gear asset! 🚚');
                        addLog(`Changed supplier on asset "${assetId}" to "${supplierId}"`);
                      };

                      const handleToggleUtilizer = (assetId: string, bandId: string) => {
                        setGearAssets(prev => prev.map(item => {
                          if (item.id !== assetId) return item;
                          const utilizers = item.utilizerIds || [];
                          const updatedUtilizers = utilizers.includes(bandId)
                            ? utilizers.filter(id => id !== bandId)
                            : [...utilizers, bandId];
                          return { ...item, utilizerIds: updatedUtilizers };
                        }));
                      };

                      const handleToggleDrumhead = (assetId: string, bandId: string) => {
                        setGearAssets(prev => prev.map(item => {
                          if (item.id !== assetId) return item;
                          const current = item.customDrumhead || {};
                          return {
                            ...item,
                            customDrumhead: { ...current, [bandId]: !current[bandId] }
                          };
                        }));
                      };

                      const handleToggleWirelessIsolate = (assetId: string, bandId: string) => {
                        setGearAssets(prev => prev.map(item => {
                          if (item.id !== assetId) return item;
                          const current = item.wirelessIsolate || {};
                          return {
                            ...item,
                            wirelessIsolate: { ...current, [bandId]: !current[bandId] }
                          };
                        }));
                      };

                      const handleDeleteCustomGear = (assetId: string) => {
                        setGearAssets(prev => prev.filter(item => item.id !== assetId));
                        triggerNotification('Removed custom gear item.');
                      };

                      return (
                        <div key={`${asset.id}-${idx}`} className="bg-black/60 border border-zinc-900 p-3.5 rounded space-y-3 relative">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] font-mono px-1.5 py-0.5 bg-purple-950/40 border border-purple-500/20 text-purple-400 uppercase font-bold">
                                {asset.category}
                              </span>
                              <span className="text-xs font-bold text-white uppercase font-mono">{asset.name}</span>
                            </div>
                            
                            {!['acoustic_drums', 'iem_rack', 'bass_rig', 'guitar_cab_1'].includes(asset.id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCustomGear(asset.id)}
                                className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="Delete Asset"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2.5 border-t border-zinc-950">
                            {/* Supplier */}
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">
                                Supplying &amp; Transporting:
                              </span>
                              <select
                                value={asset.supplierId}
                                onChange={(e) => handleUpdateSupplier(asset.id, e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-850 p-1.5 text-xs uppercase text-zinc-300 outline-none cursor-pointer"
                              >
                                <option value="">[ Unassigned ]</option>
                                <option value="PROMOTER">[ Provided by Venue / Promoter ]</option>
                                {bands.map((b, bIdx) => (
                                  <option key={`${b.id}-${bIdx}`} value={b.id}>
                                    @{b.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Utilizers */}
                            <div className="space-y-1">
                              <span className="text-[9px] uppercase font-bold text-zinc-500 block font-mono">
                                Utilizing Bands:
                              </span>
                              <div className="flex flex-wrap gap-2 bg-zinc-950/60 border border-zinc-850 p-1.5 rounded">
                                {bands.map((b, bIdx) => {
                                  const isChecked = asset.utilizerIds?.includes(b.id);
                                  return (
                                    <label 
                                      key={`${b.id}-${bIdx}`} 
                                      className="flex items-center gap-1 cursor-pointer text-[10px] uppercase font-bold text-zinc-400 hover:text-white px-1"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleUtilizer(asset.id, b.id)}
                                        className="sr-only"
                                      />
                                      <span className={isChecked ? 'text-purple-400' : 'text-zinc-600'}>
                                        {isChecked ? '●' : '○'}
                                      </span>
                                      <span>{b.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Individual Settings */}
                          {asset.utilizerIds && asset.utilizerIds.length > 0 && (
                            <div className="bg-zinc-900/40 p-2 border border-zinc-900 rounded space-y-1.5 mt-2">
                              {asset.utilizerIds.map((bid: string, bIdx: number) => {
                                const bandName = bands.find(x => x.id === bid)?.name || bid;
                                const isDrums = asset.category === 'Drums' || asset.id === 'acoustic_drums';
                                if (isDrums) {
                                  const hasCustomHead = asset.customDrumhead?.[bid] || false;
                                  return (
                                    <div key={`asset-${asset.id}-drum-${bid}-${bIdx}`} className="flex items-center justify-between font-mono text-[9.5px]">
                                      <span className="text-zinc-400">@{bandName}</span>
                                      <label className="flex items-center gap-1 cursor-pointer text-[#A855F7]">
                                        <input
                                          type="checkbox"
                                          checked={hasCustomHead}
                                          onChange={() => handleToggleDrumhead(asset.id, bid)}
                                          className="sr-only"
                                        />
                                        <span>{hasCustomHead ? '☑' : '☐'} REQUIRES LOGO DRUMHEAD</span>
                                      </label>
                                    </div>
                                  );
                                } else {
                                  const hasIsolate = asset.wirelessIsolate?.[bid] || false;
                                  return (
                                    <div key={`asset-${asset.id}-iso-${bid}-${bIdx}`} className="flex items-center justify-between font-mono text-[9.5px]">
                                      <span className="text-zinc-400">@{bandName}</span>
                                      <label className="flex items-center gap-1 cursor-pointer text-[#A855F7]">
                                        <input
                                          type="checkbox"
                                          checked={hasIsolate}
                                          onChange={() => handleToggleWirelessIsolate(asset.id, bid)}
                                          className="sr-only"
                                        />
                                        <span>{hasIsolate ? '☑' : '☐'} ISOLATED RF ZONE</span>
                                      </label>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Asset Intake Form (Flat Stacked) */}
                  <div className="bg-zinc-950 border border-dashed border-zinc-800 p-3.5 rounded space-y-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block font-mono">
                      ➕ Register Custom Band Asset
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        placeholder="E.G. MOOG STANDALONE KEYBOARD STACK"
                        value={newGearName}
                        onChange={(e) => setNewGearName(e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 p-2 text-xs uppercase text-white placeholder-zinc-700 outline-none"
                      />
                      <select
                        value={newGearCategory}
                        onChange={(e) => setNewGearCategory(e.target.value)}
                        className="bg-black border border-zinc-800 p-2 text-xs uppercase text-zinc-400 cursor-pointer outline-none font-mono"
                      >
                        <option value="Amps & Cabinets">Amps &amp; Cabinets</option>
                        <option value="Drums">Drums / Percussion</option>
                        <option value="Wireless / IEM">Wireless / IEM</option>
                        <option value="Custom FX / Synths">Custom FX / Synths</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newGearName.trim()) {
                            triggerNotification('Please enter a gear asset name.');
                            return;
                          }
                          const newId = `custom_gear_${Date.now()}`;
                          setGearAssets(prev => [
                            ...prev,
                            {
                              id: newId,
                              name: newGearName.trim(),
                              category: newGearCategory,
                              supplierId: '',
                              utilizerIds: [],
                              customDrumhead: {},
                              wirelessIsolate: {}
                            }
                          ]);
                          setNewGearName('');
                          triggerNotification(`Added custom asset "${newGearName}" to Loadout Matrix! 📦`);
                        }}
                        className="bg-purple-500/10 hover:bg-purple-500/25 text-purple-400 border border-purple-500/40 text-[10px] font-bold uppercase px-4 py-2 tracking-wider transition-colors cursor-pointer"
                      >
                        Add Asset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card D: Fuel Cost Estimator */}
            <div className="w-[90%] mx-auto bg-zinc-950/90 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] rounded-lg p-5 mb-4 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-purple-400/40 transition-all duration-300">
              <div 
                onClick={() => {
                  const nextState = !isFuelCollapsed;
                  setIsFuelCollapsed(nextState);
                  if (!nextState) {
                    setIsCardACollapsed(true);
                    setIsCardBCollapsed(true);
                    setIsCardCCollapsed(true);
                  }
                  triggerNotification(`FUEL COST ESTIMATOR: ${nextState ? 'COLLAPSED' : 'EXPANDED'}`);
                }}
                className="flex justify-between items-center cursor-pointer select-none font-sans"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold tracking-wide uppercase text-sm">
                    ⛽ Fuel Cost Estimator
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {isFuelCollapsed ? 'EXPAND ＋' : 'DEFLATE －'}
                </span>
              </div>

              {!isFuelCollapsed && (
                <div className="mt-4 space-y-4 font-mono text-xs">
                  <p className="text-[11px] text-zinc-400 leading-relaxed uppercase font-sans">
                    Map fuel consumption against active travel routing. The engine aggregates mileage between stops, adjusts for fuel prices, profiles transport rigs, and splits costs equitably.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Fuel controls */}
                    <div className="space-y-4 bg-black/40 border border-zinc-900 p-3.5 rounded font-sans">
                      <div>
                        <span className="text-[9.5px] uppercase tracking-wide font-bold text-zinc-400 block mb-1.5 select-none font-sans">
                          Benchmark Fuel Cost (USD / Gal):
                        </span>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="2.50"
                            max="6.50"
                            step="0.05"
                            value={gasPrice}
                            onChange={(e) => setGasPrice(Number(e.target.value))}
                            className="flex-1 accent-purple-400 bg-purple-950 h-1.5 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-white bg-zinc-950 border border-zinc-850 px-2 py-0.5 min-w-[65px] text-center rounded">
                            ${gasPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9.5px] uppercase tracking-wide font-bold text-zinc-400 block mb-2 select-none">
                          Fleet Vehicle Config:
                        </span>
                        <div className="grid grid-cols-2 gap-2 font-sans">
                          {[
                            { name: 'Shared Van & Trailer', mpg: 14 },
                            { name: 'Independent Vehicles', mpg: 12 },
                            { name: 'Tour Bus Rig', mpg: 6 },
                            { name: 'Van & Trailer + Car', mpg: 10 },
                          ].map((cfg, idx) => {
                            const isSelected = transportType === cfg.name || 
                                               (cfg.name === 'Tour Bus Rig' && transportType === 'Separate Tour Buses') ||
                                               (cfg.name === 'Shared Van & Trailer' && transportType === 'Shared Van & Trailer (14 MPG)');
                            return (
                              <button
                                key={`${cfg.name}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setTransportType(cfg.name);
                                  triggerNotification(`RIG EXPENSE PROFILE: ${cfg.name} (${cfg.mpg} MPG)`);
                                }}
                                className={`p-2 border text-left flex flex-col justify-between transition-all rounded cursor-pointer ${
                                  isSelected 
                                    ? 'border-purple-500 bg-purple-950/20 text-white' 
                                    : 'border-zinc-900 bg-zinc-950 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300'
                                }`}
                              >
                                <span className="text-[9px] font-bold uppercase tracking-wider">{cfg.name}</span>
                                <span className="text-[8px] font-mono mt-0.5 text-purple-400 font-bold">{cfg.mpg} MPG</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Fuel math results */}
                    <div className="bg-black/40 border border-zinc-900 p-3.5 rounded flex flex-col justify-between gap-3">
                      <div className="space-y-2">
                        <span className="text-[9.5px] uppercase text-zinc-400 block font-bold tracking-widest pb-1 font-sans">
                          Logistical Aggregation:
                        </span>
                        
                        <div className="space-y-1.5 text-[11px] uppercase text-zinc-400">
                          <div className="flex justify-between">
                            <span>Chained Stops:</span>
                            <span className="text-white font-bold">{nodes.length} Stops</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estimated Distance:</span>
                            <span className="text-purple-400 font-bold">{totalTourDistance} MILES</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fleet MPG Metric:</span>
                            <span className="text-zinc-300">{activeRigMPG} MPG</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Fuel Required:</span>
                            <span className="text-zinc-300">
                              {totalTourDistance > 0 ? `${(totalTourDistance / activeRigMPG).toFixed(1)} GALLONS` : '0 GAL'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-900/60 flex flex-col gap-1 select-none font-mono">
                        <div className="flex justify-between items-baseline font-sans">
                          <span className="text-[9.5px] text-purple-400 font-bold uppercase">
                            Estimated Fuel Bill:
                          </span>
                          <span className="text-base font-black text-white font-mono">
                            ${estimatedFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline text-[10.5px] font-bold text-zinc-500 uppercase font-sans">
                          <span>Split Share ({bands.length} Bands):</span>
                          <span className="text-emerald-400 font-mono">
                            ${(estimatedFuelCost / (bands.length || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / Band
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: ROAD MAP PLAN */}
            <div className="w-[90%] mx-auto bg-zinc-950/90 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)] rounded-lg p-5 mb-4 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:border-purple-400/40 transition-all duration-300">
              <div 
                onClick={() => {
                  setIsRoadMapCollapsed(!isRoadMapCollapsed);
                  triggerNotification(`ROAD MAP: ${!isRoadMapCollapsed ? 'COLLAPSED' : 'EXPANDED'}`);
                }}
                className="flex justify-between items-center cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-400 font-bold tracking-wide uppercase text-sm">
                    📍 Tour Route Planner
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-400">
                  {isRoadMapCollapsed ? 'EXPAND ＋' : 'DEFLATE －'}
                </span>
              </div>

              {!isRoadMapCollapsed && (
                <div className="mt-4">
                  {/* Toolbar - Enlarge and move 12/24hr format button next to +add show button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-900/30 border border-zinc-900 rounded-lg">
                    <span className="text-xs text-zinc-400 font-medium">
                      Configure your tour schedule, route stops, and timing logistics below.
                    </span>
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUse24Hour(!use24Hour);
                          triggerNotification(`Time format toggled to ${!use24Hour ? '12-Hour' : '24-Hour'} mode`);
                        }}
                        className="flex items-center justify-center gap-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-6 py-3 uppercase font-extrabold border border-zinc-700 hover:border-zinc-600 transition-all cursor-pointer rounded-md whitespace-nowrap shadow-lg hover:shadow-[#A855F7]/10"
                      >
                        Format: <span className="text-purple-400">{use24Hour ? '24H' : '12H'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddNode();
                        }}
                        className="flex items-center justify-center gap-2 text-sm bg-purple-500/20 text-purple-300 px-6 py-3 uppercase font-extrabold hover:bg-purple-500/30 transition-all border-2 border-purple-500/50 cursor-pointer rounded-md whitespace-nowrap shadow-lg hover:shadow-purple-500/20"
                      >
                        <Plus className="w-4 h-4" /> Add Show
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* UN-NESTED INDIVIDUAL STOP PLANNER NODES (FULL WIDTH) */}
            {!isRoadMapCollapsed && (
              <div className="mt-4 space-y-6">
                {nodes.map((node, index) => {
                  const nodeSchedule = node.schedule || defaultSchedule;
                  
                  // Helper within scope to handle local conversion
                  const formatTime = (timeStr: string, is24h: boolean) => {
                    if (!timeStr) return '';
                    if (is24h) {
                      return timeStr;
                    }
                    try {
                      const cleaned = timeStr.trim().toUpperCase();
                      if (cleaned.includes('AM') || cleaned.includes('PM')) {
                        return timeStr;
                      }
                      const parts = cleaned.split(':');
                      if (parts.length >= 1) {
                        let h = parseInt(parts[0], 10);
                        let mStr = '00';
                        if (parts.length >= 2) {
                          const mRaw = parseInt(parts[1], 10);
                          mStr = isNaN(mRaw) ? '00' : (mRaw < 10 ? `0${mRaw}` : mRaw.toString());
                        }
                        if (isNaN(h)) return timeStr;
                        const ampm = h >= 12 ? 'PM' : 'AM';
                        h = h % 12;
                        h = h ? h : 12;
                        return `${h}:${mStr} ${ampm}`;
                      }
                      return timeStr;
                    } catch {
                      return timeStr;
                    }
                  };

                  const prevNode = index > 0 ? nodes[index - 1] : null;
                  const transitLeg = prevNode ? getTransitMetrics(prevNode.city, node.city) : null;

                  return (
                    <React.Fragment key={`${node.id}-${index}`}>
                      {index > 0 && prevNode && (
                        <div className="my-[20px] mx-2 sm:mx-6 pl-4 border-l-2 border-dashed border-[#A855F7]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono uppercase">
                            <Truck className="w-3.5 h-3.5 text-[#A855F7]" />
                            <span>TRANSIT LEG: ROAD TO <strong className="text-white">{node.city || 'NEXT STOP'}</strong></span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 font-mono">
                            {transitLeg && transitLeg.distance > 0 ? (
                              <>
                                <span className="text-[10px] text-zinc-300 font-bold bg-[#0a0a0a] px-2 py-0.5 border border-[#1e1e1e]">
                                  📏 {transitLeg.distance} MILES
                                </span>
                                <span className="text-[10px] text-zinc-300 font-bold bg-[#0a0a0a] px-2 py-0.5 border border-[#1e1e1e]">
                                  ⏱️ ~{transitLeg.hours} HOURS DRIVE TIME
                                </span>
                                
                                {transitLeg.hours >= 8 ? (
                                  <span className="text-[9px] text-amber-400 bg-amber-950/45 border border-amber-500/40 px-2 py-0.5 font-bold uppercase flex items-center gap-1.5 animate-pulse">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> FATIGUE RISK WARNING
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 px-2 py-0.5 font-bold uppercase">
                                    ✓ OPTIMAL HOP
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-[9px] text-zinc-600 italic select-none">
                                * Complete distinct cities above and below to outline transit leg overhead
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border border-[#262626] bg-[#050505] relative overflow-hidden group">
                        {/* High-level compressed metadata ribbon header */}
                        <div 
                          onClick={() => setActiveNodeIndex(activeNodeIndex === index ? null : index)}
                          className={`p-3.5 bg-[#0a0a0a] hover:bg-[#111111] flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer select-none gap-3 ${activeNodeIndex === index ? 'border-b border-[#262626]/40' : ''}`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-zinc-600">●</span>
                            <span className="text-purple-400 font-semibold tracking-wide text-sm">
                              Stop 0{index + 1}: {(!node.date && !node.city) ? 'Date & City Pending' : `${node.date || 'Date Pending'} — ${node.city || 'City Pending'}`}
                            </span>
                            {node.venue && (
                              <span className="text-zinc-400 font-mono uppercase text-xs">
                                ({node.venue})
                              </span>
                            )}
                            {node.city && (
                              (() => {
                                const weatherData = getShowWeatherAndWarnings({
                                  id: node.id,
                                  name: node.venue || 'Show',
                                  city: node.city,
                                  date: node.date,
                                  show_type: 'Festival',
                                  festival_name: node.venue && (node.venue.toLowerCase().includes('festival') || node.venue.toLowerCase().includes('fest')) ? node.venue : ''
                                } as any);
                                const hasAlerts = (weatherData.warnings || []).some(w => w.severity === 'SEVERE' || w.severity === 'WARNING');
                                return (
                                  <>
                                    <span className="text-zinc-400 opacity-60">//</span>
                                    <div className="flex items-center gap-1 bg-black/80 px-2 py-0.5 border border-zinc-900 rounded text-[9.5px] text-zinc-300 select-none font-sans">
                                      {getWeatherIcon(weatherData.conditions)}
                                      <span className="font-semibold font-mono">{weatherData.temp}°F</span>
                                      <span className="opacity-50 text-[8px] uppercase">{weatherData.conditions}</span>
                                      {hasAlerts && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse ml-0.5" title="Severe Weather Alerts Active" />
                                      )}
                                    </div>
                                  </>
                                );
                              })()
                            )}
                          </div>
                          <span className="text-xs font-mono font-bold text-[#A855F7]">
                            {activeNodeIndex === index ? 'DEFLATE －' : 'EXPAND ＋'}
                          </span>
                        </div>

                        {activeNodeIndex === index && (
                          <div className="p-4 bg-zinc-950/40 relative border-t border-[#262626] space-y-4">
                            <div className="flex justify-between items-center pb-1.5 mb-2.5">
                              <div className="text-zinc-100 font-bold uppercase tracking-wider text-xs">📋 Show Details</div>
                                <span className="text-[9px] text-[#A855F7] font-black font-mono bg-[#A855F7]/10 px-2 py-0.5 border border-[#A855F7]/20 uppercase">
                                  STATUS: {node.status}
                                </span>
                              </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                              {/* Calendar Clickable Area with showPicker */}
                              <div 
                                className="relative cursor-pointer"
                                onClick={(e) => {
                                  try {
                                    const input = e.currentTarget.querySelector('input[type="date"]');
                                    if (input) {
                                      (input as any).showPicker();
                                    }
                                  } catch (err) {}
                                }}
                              >
                                <Calendar className="w-4 h-4 text-[#A855F7] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input 
                                  type="date"
                                  value={node.date}
                                  onChange={(e) => handleUpdateNode(node.id, 'date', e.target.value)}
                                  className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] focus:shadow-[0_0_12px_rgba(168,85,247,0.25)] p-2.5 pl-9 text-xs uppercase text-white outline-none cursor-pointer transition-all duration-300"
                                />
                              </div>

                              {/* Content-Aware City, State Search */}
                              <div className="relative">
                                <MapPin className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input 
                                  type="text"
                                  placeholder="City, State"
                                  value={node.city}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateNode(node.id, 'city', val);
                                    setShowCitySuggestions(prev => ({ ...prev, [node.id]: true }));
                                  }}
                                  onFocus={() => {
                                    setShowCitySuggestions(prev => ({ ...prev, [node.id]: true }));
                                  }}
                                  className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] focus:shadow-[0_0_12px_rgba(168,85,247,0.25)] p-2.5 pl-9 text-xs uppercase text-white outline-none placeholder-zinc-600 font-mono transition-all duration-300"
                                />
                                {showCitySuggestions[node.id] && node.city && (
                                  (() => {
                                    const uniqueCities = Array.from(new Set(venueDatabase.map(v => `${v.city}${v.state_province ? `, ${v.state_province}` : ''}`)))
                                      .filter((c: string) => c.toLowerCase().includes(node.city.toLowerCase()));
                                    if (uniqueCities.length === 0) return null;
                                    return (
                                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-[#0a0a0a] border border-[#262626] divide-y divide-[#1e1e1e] shadow-2xl">
                                        <div className="p-1 px-2 text-[8px] uppercase tracking-widest text-[#A855F7] bg-[#0c0c0c] font-black flex justify-between items-center select-none">
                                          <span>[ City Matcher ]</span>
                                          <button 
                                            type="button" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowCitySuggestions(prev => ({ ...prev, [node.id]: false }));
                                            }}
                                            className="text-zinc-500 hover:text-white bg-transparent border-0 cursor-pointer text-[8px]"
                                          >
                                            [ CLOSE ]
                                          </button>
                                        </div>
                                        {uniqueCities.slice(0, 5).map((citySelection, idx) => (
                                          <button
                                            key={`${citySelection}-${idx}`}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleUpdateNode(node.id, 'city', citySelection);
                                              setShowCitySuggestions(prev => ({ ...prev, [node.id]: false }));
                                            }}
                                            className="w-full text-left p-2 hover:bg-[#A855F7]/15 text-[10px] text-zinc-300 hover:text-[#A855F7] transition-colors cursor-pointer block bg-transparent border-0"
                                          >
                                            {citySelection}
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>

                              {/* Content-Aware Target Venue DB matching */}
                              <div className="relative">
                                <input 
                                  type="text"
                                  placeholder="Target Venue Name"
                                  value={node.venue}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleUpdateNode(node.id, 'venue', val);
                                    setShowVenueSuggestions(prev => ({ ...prev, [node.id]: true }));
                                  }}
                                  onFocus={() => {
                                    setShowVenueSuggestions(prev => ({ ...prev, [node.id]: true }));
                                  }}
                                  className="w-full bg-[#000000] border border-[#262626] hover:border-[#A855F7]/50 focus:border-[#A855F7] focus:shadow-[0_0_12px_rgba(168,85,247,0.25)] p-2.5 px-3 text-xs uppercase text-white outline-none placeholder-zinc-600 font-mono transition-all duration-300"
                                />
                                {showVenueSuggestions[node.id] && node.venue && (
                                  (() => {
                                    const filtered = venueDatabase.filter(v => 
                                      v.name.toLowerCase().includes(node.venue.toLowerCase()) ||
                                      (v.city && v.city.toLowerCase().includes(node.venue.toLowerCase()))
                                    );
                                    if (filtered.length === 0) return null;
                                    return (
                                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-[#0a0a0a] border border-[#262626] divide-y divide-[#1e1e1e] shadow-2xl">
                                        <div className="p-1 px-2 text-[8px] uppercase tracking-widest text-[#A855F7] bg-[#0c0c0c] font-black flex justify-between items-center select-none">
                                          <span>[ Venues DB Matcher ]</span>
                                          <button 
                                            type="button" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setShowVenueSuggestions(prev => ({ ...prev, [node.id]: false }));
                                            }}
                                            className="text-zinc-500 hover:text-white bg-transparent border-0 cursor-pointer text-[8px]"
                                          >
                                            [ CLOSE ]
                                          </button>
                                        </div>
                                        {filtered.slice(0, 5).map((vSelection, idx) => (
                                          <button
                                            key={`${vSelection.name}-${idx}`}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleUpdateNode(node.id, 'venue', vSelection.name);
                                              if (vSelection.city) {
                                                const stateSuffix = vSelection.state_province ? `, ${vSelection.state_province}` : '';
                                                handleUpdateNode(node.id, 'city', `${vSelection.city}${stateSuffix}`);
                                              }
                                              setShowVenueSuggestions(prev => ({ ...prev, [node.id]: false }));
                                              triggerNotification(`AUTO-FILLED: Locked venue coordinates for ${vSelection.name} 🔮`);
                                            }}
                                            className="w-full text-left p-2 hover:bg-[#A855F7]/15 text-[10px] text-zinc-300 hover:text-[#A855F7] flex justify-between items-center transition-colors cursor-pointer bg-transparent border-0"
                                          >
                                            <span className="font-bold">{vSelection.name}</span>
                                            <span className="text-[8px] text-zinc-500 uppercase">{vSelection.city}{vSelection.state_province ? `, ${vSelection.state_province}` : ''}</span>
                                          </button>
                                        ))}
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            </div>

                            {/* Operational Times and Labels */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#111] p-3 border border-[#262626]">
                              <div className="flex items-center text-xs justify-between">
                                <div className="flex items-center">
                                  <span className="text-zinc-500 mr-2 font-bold uppercase tracking-wider text-[10px]">Load-In:</span>
                                  <input 
                                    type="text" 
                                    value={node.loadIn}
                                    onChange={(e) => handleUpdateNode(node.id, 'loadIn', e.target.value)}
                                    className="bg-transparent border-b border-[#262626] focus:border-[#A855F7] w-16 text-center text-white outline-none"
                                    placeholder="[ 14:00 ]"
                                  />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono italic pr-2 select-none">
                                  ({formatTime(node.loadIn, use24Hour)})
                                </span>
                              </div>
                              
                              <div className="flex items-center text-xs justify-between">
                                <div className="flex items-center">
                                  <span className="text-zinc-500 mr-2 font-bold uppercase tracking-wider text-[10px]">Set Time:</span>
                                  <input 
                                    type="text" 
                                    value={node.setTime}
                                    onChange={(e) => handleUpdateNode(node.id, 'setTime', e.target.value)}
                                    className="bg-transparent border-b border-[#262626] focus:border-[#A855F7] w-16 text-center text-white outline-none"
                                    placeholder="[ 21:00 ]"
                                  />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-mono italic pr-2 select-none">
                                  ({formatTime(node.setTime, use24Hour)})
                                </span>
                              </div>

                              <div className="flex items-center text-xs w-full">
                                <span className="text-zinc-500 mr-2 shrink-0 font-bold uppercase tracking-wider text-[10px]">Notes:</span>
                                <input 
                                  type="text" 
                                  value={node.backlineNotes}
                                  onChange={(e) => handleUpdateNode(node.id, 'backlineNotes', e.target.value)}
                                  className="bg-transparent border-b border-[#262626] focus:border-[#A855F7] flex-1 text-white outline-none placeholder-zinc-700 font-mono uppercase"
                                  placeholder="[ Guaranteed Backline Notes... ]"
                                />
                              </div>
                            </div>

                          {/* DYNAMIC TOUR WEATHER ROUTING FORECAST SECTION */}
                          {node.city ? (
                            (() => {
                              const weatherData = getShowWeatherAndWarnings({
                                id: node.id,
                                name: node.venue || 'Show',
                                city: node.city,
                                date: node.date,
                                show_type: 'Festival',
                                festival_name: node.venue && (node.venue.toLowerCase().includes('festival') || node.venue.toLowerCase().includes('fest')) ? node.venue : ''
                              } as any);

                              return (
                                <div className="mt-3 bg-zinc-950/60 border border-zinc-900 rounded p-3 text-xs font-sans">
                                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-1 mb-1.5 select-none gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400">
                                        🌦️ Weather Routing &amp; Stage Safety Forecast
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono uppercase">
                                      <span>Humid: <strong className="text-zinc-300">{weatherData.humidity}%</strong></span>
                                      <span>Wind: <strong className="text-zinc-300">{weatherData.windSpeed} mph</strong></span>
                                      <span>Setting: <strong className={`${weatherData.isOutdoor ? 'text-purple-400' : 'text-zinc-400'}`}>{weatherData.isOutdoor ? 'OUTDOOR' : 'INDOOR'}</strong></span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                    <div className="sm:col-span-1 flex items-center gap-2 bg-black/40 border border-zinc-900 p-2 rounded">
                                      {getWeatherIcon(weatherData.conditions)}
                                      <div>
                                        <div className="text-sm font-black text-white font-mono leading-none">{weatherData.temp}°F</div>
                                        <div className="text-[9px] uppercase text-zinc-500 mt-0.5 leading-none">{weatherData.conditions}</div>
                                      </div>
                                    </div>

                                    <div className="sm:col-span-3">
                                      {weatherData.warnings.length > 0 ? (
                                        <div className="space-y-1.5">
                                          {weatherData.warnings.map((w, wIdx) => (
                                            <div 
                                              key={`coop-route-warn-${node.id || node.date || 'node'}-${wIdx}`} 
                                              className={`p-2 border rounded flex items-start gap-2 text-[10.5px] leading-relaxed transition-all ${w.color}`}
                                            >
                                              <span className={`px-1.5 py-0.5 text-[8.5px] font-black uppercase rounded shrink-0 ${w.badgeColor}`}>
                                                {w.severity}
                                              </span>
                                              <div>
                                                <strong className="block text-white font-semibold">{w.title}</strong>
                                                <span className="text-[9.5px] opacity-90">{w.description}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="p-2 border border-emerald-500/10 bg-emerald-950/5 text-emerald-400/90 rounded text-[10px] flex items-center gap-1.5 font-semibold">
                                          <span>✓ WEATHER METRICS OPTIMAL — NO DISRUPTIONS DETECTED FOR {node.city.toUpperCase()}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="bg-zinc-900/30 border border-zinc-800 text-zinc-400 p-4 rounded text-xs leading-normal mt-2">
                              Add a city to view real-time weather alerts and travel delays along your route.
                            </div>
                          )}

                          {/* DATE/LEG SPECIFIC SHOW SUPPORT BANDS */}
                          <div className="mt-3 bg-[#0a0a0a] border border-[#1a1a1a] p-3 text-xs">
                            <div className="flex justify-between items-center mb-2 select-none">
                              <span className="text-zinc-200 font-medium text-xs tracking-wider uppercase mb-2">
                                👥 Local Opening Acts
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddLocalSupport(node.id)}
                                className="text-[9px] border border-zinc-700 hover:border-[#A855F7] bg-[#000000] text-[#A855F7] hover:text-white px-2 py-0.5 uppercase font-bold transition-all cursor-pointer"
                              >
                                + Add Leg Support
                              </button>
                            </div>

                            {(!node.localSupports || node.localSupports.length === 0) ? (
                              <p className="text-[9px] text-zinc-500 font-mono uppercase italic">
                                * Running full package core bands only (No specific date/leg support added yet)
                              </p>
                            ) : (
                              <div className="space-y-2 mt-2">
                                {node.localSupports.map((supp: any, sIdx: number) => (
                                  <div key={`${supp.id}-${sIdx}`} className="flex gap-2 items-center bg-[#000000] border border-[#222] p-1.5">
                                    <span className="text-[9px] font-bold text-[#A855F7] uppercase shrink-0 w-20">
                                      [ Leg Support {sIdx + 1} ]
                                    </span>
                                    
                                    <input
                                      type="text"
                                      placeholder="Enter Band Handle / Name"
                                      value={supp.name}
                                      onChange={(e) => handleUpdateLocalSupport(node.id, supp.id, 'name', e.target.value)}
                                      className="bg-black border border-[#262626] focus:border-[#A855F7] text-white p-1 text-[10px] uppercase outline-none flex-1 font-mono"
                                    />

                                    <div className="flex items-center bg-black border border-[#262626] px-1.5 w-28">
                                      <span className="text-zinc-500 text-[10px] pr-1">$</span>
                                      <input
                                        type="number"
                                        placeholder="Guarantees"
                                        value={supp.guarantee}
                                        onChange={(e) => handleUpdateLocalSupport(node.id, supp.id, 'guarantee', Number(e.target.value))}
                                        className="bg-black text-white p-1 text-[10px] outline-none w-full text-right font-mono"
                                      />
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLocalSupport(node.id, supp.id)}
                                      className="text-zinc-500 hover:text-red-500 p-1 bg-transparent border-0 cursor-pointer"
                                      title="Delete Support"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Individual Show Estimate Rolling Total Rollup */}
                            {node.localSupports && node.localSupports.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-[#1a1a1a] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-[9px] text-zinc-400 uppercase font-mono">
                                <span>Show Guarantees Budget Rollup:</span>
                                <span className="text-white">
                                  Core (${originalPackagePrice}) + Support (${node.localSupports.reduce((sum: number, s: any) => sum + (Number(s.guarantee) || 0), 0)}) = <strong className="text-[#A855F7]">${originalPackagePrice + node.localSupports.reduce((sum: number, s: any) => sum + (Number(s.guarantee) || 0), 0)}</strong> Show Total Contract Value
                                </span>
                              </div>
                            )}
                          </div>

                          {/* COLLAPSIBLE RUNNING ORDER SCHEDULE PLANNER */}
                          <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setExpandedScheduleNodeId(expandedScheduleNodeId === node.id ? null : node.id)}
                                className="text-purple-400/90 font-medium text-xs flex items-center gap-2 hover:text-[#b97bf8] transition-colors bg-transparent border-0 cursor-pointer"
                              >
                                {expandedScheduleNodeId === node.id ? '⏱️ Set Times & Schedule ▲' : '⏱️ Set Times & Schedule ▼'}
                              </button>
                              <span className="text-[9px] text-zinc-500 font-mono uppercase">
                                {nodeSchedule.length} milestones planned
                              </span>
                            </div>

                            {expandedScheduleNodeId === node.id && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="border border-[#262626]/80 bg-[#000000] p-3 space-y-3 mt-1"
                              >
                                <div className="flex justify-between items-center bg-[#111] p-2 border-b border-[#262626] select-none">
                                  <span className="text-[9px] uppercase font-black tracking-widest text-[#A855F7] flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Set-Times & Running Order Planner
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddScheduleItem(node.id)}
                                    className="text-[9px] border border-[#a855f7]/30 hover:border-[#a855f7] bg-[#a855f7]/10 hover:bg-[#a855f7]/20 text-[#a855f7] px-2 py-0.5 uppercase font-bold transition-all cursor-pointer"
                                  >
                                    + Append Milestone
                                  </button>
                                </div>

                                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                  {nodeSchedule.map((item: any, idx) => (
                                    <div key={`${item.id}-${idx}`} className="flex gap-2 items-center bg-[#050505] p-1.5 border border-[#1e1e1e]">
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <input 
                                          type="text" 
                                          value={item.time}
                                          onChange={(e) => handleUpdateScheduleItem(node.id, item.id, 'time', e.target.value)}
                                          className="bg-black border border-[#262626] focus:border-[#A855F7] text-white p-1 text-[10px] font-bold w-14 text-center outline-none font-mono"
                                          placeholder="19:30"
                                        />
                                        <span className="text-[8px] text-zinc-500 font-mono hidden sm:inline select-none">
                                          [{formatTime(item.time, use24Hour)}]
                                        </span>
                                      </div>
                                      <input 
                                        type="text" 
                                        value={item.label}
                                        onChange={(e) => handleUpdateScheduleItem(node.id, item.id, 'label', e.target.value)}
                                        className="bg-black border border-[#262626] focus:border-[#A855F7] text-white p-1 text-[10px] flex-1 outline-none uppercase placeholder-zinc-700 font-mono"
                                        placeholder="Event Description..."
                                      />
                                      {nodeSchedule.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteScheduleItem(node.id, item.id)}
                                          className="text-zinc-500 hover:text-red-500 p-1 bg-transparent border-0 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[8px] text-zinc-500 leading-relaxed uppercase select-none">
                                  * Plan interlocking load-ins, shared soundchecks, and precise set execution sequences with your co-billing block partner in real time.
                                </p>
                              </motion.div>
                            )}
                          </div>

                          {/* REVOLUTIONARY REGIONAL VIABILITY ASSESSMENT & CONTRACT DOCUMENT EXPORTER */}
                          <div className="mt-4 pt-4 border-t border-[#1a1a1a] grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* Left Column: Viability scoring */}
                            <div className="bg-[#0b0b0b] border border-[#1a1a1a] p-3 flex flex-col justify-between">
                              <div className="flex justify-between items-start mb-2 select-none">
                                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-[#A855F7]" />
                                  Regional Viability Index
                                </span>
                                <span className="text-[8px] text-zinc-600 font-mono">STATUS: CALCULATED</span>
                              </div>

                              {(() => {
                                const totalShowGuarantees = originalPackagePrice + (node.localSupports ? node.localSupports.reduce((sum: number, s: any) => sum + (Number(s.guarantee) || 0), 0) : 0);
                                const legDistance = prevNode ? getTransitMetrics(prevNode.city, node.city).distance : 0;
                                
                                let yieldStyle = 'bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 p-4 rounded text-xs mt-4';
                                let yieldLabel = '⚓ Route Analysis: Tour Kickoff';
                                let yieldDesc = 'First location of the co-op run. Serves as your regional logistical anchor.';

                                if (legDistance > 0) {
                                  const yieldRatio = totalShowGuarantees / legDistance;
                                  if (yieldRatio >= 8) {
                                    yieldStyle = 'bg-emerald-950/10 border border-emerald-500/20 text-emerald-400 p-4 rounded text-xs mt-4';
                                    yieldLabel = '⚓ Route Analysis: PREMIUM PAYOUT ROUTE';
                                    yieldDesc = `Yield is high at $${yieldRatio.toFixed(1)} USD/Mile. Excellent contract density relative to highway fuel drain.`;
                                  } else if (yieldRatio >= 3) {
                                    yieldStyle = 'bg-amber-950/10 border border-amber-500/20 text-amber-400 p-4 rounded text-xs mt-4';
                                    yieldLabel = '⚓ Route Analysis: VIABLE TRANSIT RUN';
                                    yieldDesc = `Yield stands at $${yieldRatio.toFixed(1)} USD/Mile. Sound scheduling splits and normal fuel consumption ratios.`;
                                  } else {
                                    yieldStyle = 'bg-red-950/10 border border-red-500/20 text-red-400 p-4 rounded text-xs mt-4';
                                    yieldLabel = '⚓ Route Analysis: HEAVY TRANSIT OVERHEAD';
                                    yieldDesc = `Low yield at $${yieldRatio.toFixed(1)} USD/Mile. Heavy transit driving relative to guarantee. Raise ask with promoter.`;
                                  }
                                }

                                return (
                                  <div className={yieldStyle}>
                                    <div className="font-bold uppercase tracking-wider mb-1">
                                      {yieldLabel}
                                    </div>
                                    <p className="text-zinc-400 leading-normal">
                                      {yieldDesc}
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>

                            {/* Right Column: Contract exporter select */}
                            <div className="bg-[#0b0b0b] border border-[#1a1a1a] p-3 flex flex-col justify-between">
                              <div>
                                <span className="text-zinc-100 font-bold text-xs uppercase tracking-wider block mb-2 select-none">
                                  📄 Contract &amp; Rider Generator
                                </span>
                                <p className="text-zinc-400 text-xs leading-relaxed mt-1 mb-4">
                                  Instantly bundle your schedule, local openers, guaranteed splits, and shared gear rules into a professional performance contract text block to send straight to the promoter.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenedContractNodeId(openedContractNodeId === node.id ? null : node.id);
                                }}
                                className="w-full py-4 rounded font-bold uppercase tracking-widest text-xs bg-gradient-to-r from-purple-950 to-zinc-950 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)] hover:border-purple-400 transition-all cursor-pointer"
                              >
                                {openedContractNodeId === node.id ? 'Generate Performance Contract ▲' : 'Generate Performance Contract ▼'}
                              </button>
                            </div>
                          </div>

                          {/* EXPANDED TERMINAL GENERATED TEXT RECORD WITH COPY CLIPBOARD FEEDBACK */}
                          {openedContractNodeId === node.id && (
                            <motion.div
                              initial={{ opacity: 0, scaleY: 0.95 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              className="mt-4 border border-[#262626] bg-[#000] p-4 font-mono space-y-3.5 relative overflow-hidden col-span-1 sm:col-span-2 text-left"
                            >
                              <div className="flex justify-between items-center pb-1.5">
                                <span className="text-[9px] uppercase font-black tracking-widest text-[#A855F7] flex items-center gap-1.5 select-none text-left">
                                  <FileText className="w-3.5 h-3.5 text-[#A855F7]" />
                                  ACTIVE ENVOY: RECORD FOR target node-0{index + 1}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => {
                                    const text = generateCoOpShowContractDoc({
                                      tourName,
                                      node,
                                      bands,
                                      guaranteeBasis,
                                      shareDrums,
                                      shareBass,
                                      shareGuitar,
                                      shareCustom,
                                      customGearNotes
                                    });
                                    navigator.clipboard.writeText(text);
                                    setCopiedContractNodeId({ ...copiedContractNodeId, [node.id]: true });
                                    triggerNotification(`CO-OP RIDER FOR SHOW #${index + 1} COPIED TO CO-OP CLIPBOARD! 📄`);
                                    setTimeout(() => {
                                      setCopiedContractNodeId(prev => ({ ...prev, [node.id]: false }));
                                    }, 2000);
                                  }}
                                  className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[8px] px-2.5 py-1.5 uppercase font-black transition-all cursor-pointer"
                                >
                                  {copiedContractNodeId[node.id] ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" /> [ COPIED TO CO-OP CLIPBOARD! ]
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3 text-emerald-500" /> [ COPY ENVOY FILE ]
                                    </>
                                  )}
                                </button>
                              </div>

                              <textarea
                                readOnly
                                rows={12}
                                value={generateCoOpShowContractDoc({
                                  tourName,
                                  node,
                                  bands,
                                  guaranteeBasis,
                                  shareDrums,
                                  shareBass,
                                  shareGuitar,
                                  shareCustom,
                                  customGearNotes
                                })}
                                className="w-full bg-[#050505] text-[10px] text-zinc-300 p-2.5 border border-zinc-900 font-mono focus:outline-none focus:border-[#A855F7] select-all cursor-text h-56 resize-y whitespace-pre"
                              />
                            </motion.div>
                          )}

                          {nodes.length > 1 && (
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="absolute bottom-3 right-3 text-zinc-500 hover:text-red-500 transition-colors bg-transparent border-0 cursor-pointer"
                              title="Remove Node"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
              )}

            {/* ADAPTIVE SPACING AND ADD NEXT NODE ACTION PANEL */}
            <div className="mt-12 mb-8 px-4 sm:px-6">
              <button
                type="button"
                onClick={handleAddNode}
                className="w-full bg-[#0a0a0a] border border-[#262626] hover:border-[#A855F7]/80 text-[#A855F7] hover:text-white p-4.5 font-mono text-xs font-black uppercase tracking-widest transition-all hover:bg-[#A855F7]/10 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.5)] rounded-sm"
              >
                [ ADD NEXT NODE // ──► ]
              </button>
            </div>

            {/* TRANSMISSION COMMAND DECK TRACKING FRAME */}
            <footer className="relative mt-12 bg-[#000000] p-4 sm:p-6 pb-10 z-40 w-full flex flex-col gap-4">
              <div className="border border-[#262626] p-4 flex flex-col gap-4 bg-[#050505]">
                {/* Monospace low-visibility feedback tracking indicators */}
                <div className="flex flex-col gap-2 font-mono text-[10px] uppercase">
                  {/* Indicator 1 (Financial Verification) */}
                  <div>
                    {yourShare + partnerShare === 100 ? (
                      <span className="text-zinc-500 font-bold tracking-wider">
                        [ SYSTEM STATE // GUARANTEE SPLIT: LOCKED AND CALIBRATED ]
                      </span>
                    ) : (
                      <span className="text-red-500 font-black tracking-widest animate-pulse">
                        [ SYSTEM FAULT // TRACKING PERCENTAGE INVALID: MUST EQUAL 100% ]
                      </span>
                    )}
                  </div>

                  {/* Indicator 2 (Signatory Verification) */}
                  <div>
                    {bands.every(b => b.accepted) ? (
                      <span className="text-zinc-500 font-bold tracking-wider">
                        [ SIGNATORY STATE // CO-BILL COOP AUTHORIZED ]
                      </span>
                    ) : (
                      <span className="text-amber-500 font-black tracking-wider">
                        [ SIGNATORY FAULT // PENDING REMOTE BAND COMPLIANCE SIGN-OFF ]
                      </span>
                    )}
                  </div>
                </div>

                {/* EXECUTION TRANSMISSION BUTTON */}
                <button
                  type="button"
                  onClick={handleDispatch}
                  disabled={!isValidToDispatch || (yourShare + partnerShare !== 100) || !bands.every(b => b.accepted)}
                  className={`w-full py-4.5 px-6 font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex justify-center items-center gap-3 ${
                    isValidToDispatch && (yourShare + partnerShare === 100) && bands.every(b => b.accepted)
                      ? 'bg-[#000000] border border-[#262626] text-[#A855F7] hover:bg-[#A855F7] hover:text-black hover:border-[#A855F7] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]' 
                      : 'bg-[#111111] border border-[#262626] text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4 shrink-0" />
                  [ Unify and send co-op tour plan to regional promoters ]
                </button>
              </div>
            </footer>
          </motion.div>
        )}
      </div>
    </div>
  );
}
