import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Plane, Plus, Trash2, Edit3, Save, Search, 
  Clock, MapPin, User, Bell, Navigation, PlaneTakeoff, 
  PlaneLanding, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2,
  ChevronLeft, RefreshCw, Download
} from 'lucide-react';
import { Flight } from '../../../types';
import { getSupabase } from '../../../supabase';
import { fetchLiveFlightData } from '../../../flightService';
import { enqueuePendingMutation } from '../../../hooks/useOfflineSync';
import InfoTip from '../../InfoTip';
const airportBg = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20concert%202.png";
import FlightTicketCard from './FlightTicketCard';

interface FlightTrackerModalProps {
  onClose: () => void;
  flights: Flight[];
  setFlights: React.Dispatch<React.SetStateAction<Flight[]>>;
  commitFlightMutation?: (f: Flight | Flight[]) => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  initialIsAdding?: boolean;
  isOffline?: boolean;
}

export default function FlightTrackerModal({
  onClose,
  flights,
  setFlights,
  commitFlightMutation,
  triggerNotification,
  addLog,
  initialIsAdding = false,
  isOffline = false
}: FlightTrackerModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Custom Addition state
  const [isAdding, setIsAdding] = useState(initialIsAdding);
  const [newTraveler, setNewTraveler] = useState('');
  const [newAirline, setNewAirline] = useState('Delta');
  const [newFlightNo, setNewFlightNo] = useState('');
  const [newDepAirport, setNewDepAirport] = useState('');
  const [newArrAirport, setNewArrAirport] = useState('');
  const [newDepTime, setNewDepTime] = useState('');
  const [newArrTime, setNewArrTime] = useState('');
  const [newStatus, setNewStatus] = useState<Flight['status']>('Scheduled');
  const [newGate, setNewGate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Live flight sync integration
  const [newDepDate, setNewDepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualFallback, setManualFallback] = useState(false);
  const [isSyncingLiveFlight, setIsSyncingLiveFlight] = useState(false);

  // Backdrop visibility slider, weather interactive airport hub, live radio control transmitter, & TSA handbook states
  const backdropOpacity = 0.55;
  const [activeAirport, setActiveAirport] = useState<string>('ORD');
  const [selectedTSATopic, setSelectedTSATopic] = useState<string>('batteries');
  
  // Audio Feedback Synthesizer matching current dashboard tones
  const playPingSound = (frequency = 1200, type: OscillatorType = 'sine', duration = 0.15) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      if (type === 'sine') {
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, ctx.currentTime + duration);
      } else if (type === 'triangle') {
        osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + duration);
      }
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio context not allowed yet by browser policies.", e);
    }
  };

  const playTelemetryChirp = () => {
    playPingSound(880, 'triangle', 0.08);
    setTimeout(() => playPingSound(1320, 'triangle', 0.08), 80);
    setTimeout(() => playPingSound(1760, 'sine', 0.15), 160);
  };

  const playRadioChirp = () => {
    playPingSound(650, 'sawtooth', 0.06);
    setTimeout(() => playPingSound(1100, 'sine', 0.12), 65);
  };

  // Mock datasets for extensions
  const airportHubs = useMemo(() => [
    { code: 'ORD', name: 'Chicago O\'Hare Intl', weather: 'Rainy • 58°F', wind: 'NNE 14 kts', vis: '8 sm', delays: 'Moderate (18m)', freq: '121.15 MHz', coords: '41.9742° N, 87.9073° W', runway: '27C approach active' },
    { code: 'LAX', name: 'Los Angeles Intl', weather: 'Clear • 72°F', wind: 'W 8 kts', vis: '10 sm', delays: 'None (Green)', freq: '120.95 MHz', coords: '33.9416° N, 118.4085° W', runway: '24R visuals active' },
    { code: 'JFK', name: 'John F. Kennedy Intl', weather: 'Slight Fog • 64°F', wind: 'SE 11 kts', vis: '10 sm', delays: 'High (35m hold)', freq: '119.10 MHz', coords: '40.6413° N, 73.7781° W', runway: '31L localizer intercept' },
    { code: 'LHR', name: 'London Heathrow', weather: 'Drizzle • 52°F', wind: 'WSW 16 kts', vis: '6 sm', delays: 'Slight (8m)', freq: '120.40 MHz', coords: '51.4700° N, 0.4543° W', runway: '27R holding pattern' },
    { code: 'HND', name: 'Tokyo Haneda', weather: 'Mist • 61°F', wind: 'N 12 kts', vis: '4 sm', delays: 'Moderate (22m)', freq: '124.20 MHz', coords: '35.5494° N, 139.7798° E', runway: '34L ILS enabled' },
  ], []);

  const handleSyncLiveFlight = async () => {
    if (!newFlightNo.trim()) {
      triggerNotification('Please enter a flight number first');
      return;
    }
    if (!newDepDate) {
      triggerNotification('Please enter a departure date');
      return;
    }
    
    setIsSyncingLiveFlight(true);
    try {
      const flightData = await fetchLiveFlightData(newFlightNo, newDepDate);
      
      const supabase = getSupabase();
      if (supabase && navigator.onLine) {
        try {
          await supabase.from('tour_flights_v1').insert([{
            flight_number: newFlightNo.toUpperCase(),
            traveler_name: newTraveler.trim(),
            departure_date: newDepDate,
            departure_terminal: flightData.departureTerminal,
            departure_gate: flightData.departureGate,
            arrival_terminal: flightData.arrivalTerminal,
            arrival_gate: flightData.arrivalGate,
            estimated_arrival_time: flightData.rawArrTime || flightData.arrivalTime,
            status: flightData.status,
            airline: flightData.airline,
            sync_timestamp: new Date().toISOString()
          }]);
        } catch (dbErr) {
          console.error("Failed to write to tour_flights_v1:", dbErr);
        }
      }

      setNewAirline(flightData.airline || newAirline);
      setNewDepAirport(flightData.departureAirport);
      setNewArrAirport(flightData.arrivalAirport);
      setNewDepTime(flightData.departureTime);
      setNewArrTime(flightData.arrivalTime);
      
      const combinedGateStr = [
        flightData.arrivalTerminal ? `T${flightData.arrivalTerminal}` : '',
        flightData.arrivalGate ? `Gate ${flightData.arrivalGate}` : ''
      ].filter(Boolean).join(', ');

      if (combinedGateStr) setNewGate(combinedGateStr);
      
      const mappedStatus = ['Scheduled', 'Boarding', 'In Transit', 'Landed', 'Needs Pickup', 'Picked up', 'Delayed'].includes(flightData.status) 
        ? flightData.status 
        : 'Scheduled';
      setNewStatus(mappedStatus as Flight['status']);

      if (flightData.isSimulated) {
        triggerNotification(`Flight ${newFlightNo.toUpperCase()} resolved via Keyless Fallback Engine 🚀`);
      } else {
        triggerNotification(`Synced live details for ${newFlightNo.toUpperCase()} from AeroDataBox`);
      }
      setManualFallback(true);
      
    } catch (error: any) {
      triggerNotification(error.message || 'Live sync failed. Falling back to manual text entry.');
      setManualFallback(true);
    } finally {
      setIsSyncingLiveFlight(false);
    }
  };

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTraveler, setEditTraveler] = useState('');
  const [editAirline, setEditAirline] = useState('');
  const [editFlightNo, setEditFlightNo] = useState('');
  const [editDepAirport, setEditDepAirport] = useState('');
  const [editArrAirport, setEditArrAirport] = useState('');
  const [editDepTime, setEditDepTime] = useState('');
  const [editArrTime, setEditArrTime] = useState('');
  const [editStatus, setEditStatus] = useState<Flight['status']>('Scheduled');
  const [editGate, setEditGate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Quick preset data maker
  const handleApplyPreset = (type: 'vocalist' | 'drummer' | 'manager') => {
    if (type === 'vocalist') {
      setNewTraveler('Aria Vance (Lead Vocals)');
      setNewAirline('United Airlines');
      setNewFlightNo('UA542');
      setNewDepAirport('LAX');
      setNewArrAirport('ORD');
      setNewDepTime('08:15 AM');
      setNewArrTime('12:45 PM');
      setNewStatus('In Transit');
      setNewGate('B14');
      setNewNotes('Carries personal IEM transmitters. Needs airport meet-and-greet.');
    } else if (type === 'drummer') {
      setNewTraveler('Marcus Cruz (Drums)');
      setNewAirline('American Airlines');
      setNewFlightNo('AA198');
      setNewDepAirport('MIA');
      setNewArrAirport('ORD');
      setNewDepTime('11:30 AM');
      setNewArrTime('02:15 PM');
      setNewStatus('Delayed');
      setNewGate('D8');
      setNewNotes('Gate checked cymbals vault. Pick up with luggage truck.');
    } else if (type === 'manager') {
      setNewTraveler('Kenji Sato (Tour Manager)');
      setNewAirline('Delta Air Lines');
      setNewFlightNo('DL833');
      setNewDepAirport('LHR');
      setNewArrAirport('ORD');
      setNewDepTime('09:00 AM');
      setNewArrTime('01:30 PM');
      setNewStatus('Needs Pickup');
      setNewGate('M4');
      setNewNotes('Carrying venue settlement contracts. Send sprinter cab immediately.');
    }
    triggerNotification('Applied quick flight template');
  };

  // Synchronize or queue flight modification (insert or update)
  const persistFlightChange = async (flight: Flight, isInsert: boolean) => {
    if (commitFlightMutation) {
      commitFlightMutation(flight);
    } else {
      setFlights(prev => {
        if (isInsert) {
          return [flight, ...prev];
        } else {
          return prev.map(f => f.id === flight.id ? flight : f);
        }
      });
    }
  };

  // Add customized flight
  const handleAddFlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraveler.trim() || !newFlightNo.trim()) {
      triggerNotification('Please provide traveler name and flight number');
      return;
    }
    const flightObj: Flight = {
      id: 'flight_' + Date.now(),
      travelerName: newTraveler.trim(),
      airline: newAirline.trim(),
      flightNumber: newFlightNo.trim().toUpperCase(),
      departureAirport: (newDepAirport.trim() || 'TBD').toUpperCase(),
      arrivalAirport: (newArrAirport.trim() || 'TBD').toUpperCase(),
      departureTime: newDepTime.trim() || 'TBD',
      arrivalTime: newArrTime.trim() || 'TBD',
      status: newStatus,
      gate: newGate.trim() || undefined,
      notes: newNotes.trim() || undefined
    };

    setFlights(prev => [...prev, flightObj]);
    persistFlightChange(flightObj, true);
    addLog(`Added Flight Tracker entry: ${flightObj.travelerName} (${flightObj.airline} ${flightObj.flightNumber})`);
    triggerNotification(`Added flight for ${flightObj.travelerName}`);
    
    // Reset fields
    setNewTraveler('');
    setNewFlightNo('');
    setNewDepAirport('');
    setNewArrAirport('');
    setNewDepTime('');
    setNewArrTime('');
    setNewStatus('Scheduled');
    setNewGate('');
    setNewNotes('');
    setIsAdding(false);
  };

  // Start Editing
  const startEditing = (flight: Flight) => {
    setEditingId(flight.id);
    setEditTraveler(flight.travelerName);
    setEditAirline(flight.airline);
    setEditFlightNo(flight.flightNumber);
    setEditDepAirport(flight.departureAirport);
    setEditArrAirport(flight.arrivalAirport);
    setEditDepTime(flight.departureTime);
    setEditArrTime(flight.arrivalTime);
    setEditStatus(flight.status);
    setEditGate(flight.gate || '');
    setEditNotes(flight.notes || '');
  };

  // Save changes
  const handleSaveEdit = (id: string) => {
    if (!editTraveler.trim() || !editFlightNo.trim()) {
      triggerNotification('Traveler and Flight number are required');
      return;
    }
    setFlights(prev => prev.map(f => {
      if (f.id === id) {
        const updated: Flight = {
          ...f,
          travelerName: editTraveler,
          airline: editAirline,
          flightNumber: editFlightNo.toUpperCase(),
          departureAirport: editDepAirport.toUpperCase(),
          arrivalAirport: editArrAirport.toUpperCase(),
          departureTime: editDepTime,
          arrivalTime: editArrTime,
          status: editStatus,
          gate: editGate.trim() || undefined,
          notes: editNotes.trim() || undefined
        };
        addLog(`Updated flight for ${editTraveler}: ${editAirline} ${editFlightNo} set to ${editStatus}`);
        triggerNotification('Flight entry updated');
        persistFlightChange(updated, false);
        return updated;
      }
      return f;
    }));
    setEditingId(null);
  };

  // Quick toggle status directly from list
  const handleQuickStatusToggle = (id: string, currentStatus: Flight['status']) => {
    const statusOrder: Flight['status'][] = [
      'Scheduled', 
      'Reminder Set',
      'Boarding', 
      'In Transit', 
      'Landed', 
      'Needs Pickup', 
      'Picked up',
      'Delayed'
    ];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    setFlights(prev => prev.map(f => {
      if (f.id === id) {
        addLog(`Flight ${f.flightNumber} status updated to ${nextStatus}`);
        triggerNotification(`Updated to ${nextStatus}`);
        const updated = { ...f, status: nextStatus };
        persistFlightChange(updated, false);
        return updated;
      }
      return f;
    }));
  };

  // Trigger simulated action triggers
  const executeSIMAction = (flight: Flight, action: 'pickup' | 'reminder') => {
    if (action === 'pickup') {
      addLog(`[LOGISTICS] Initiated Sprinter Ground Pickup dispatch alert for ${flight.travelerName} at ${flight.arrivalAirport}`);
      triggerNotification(`🚗 Pickup dispatched for ${flight.travelerName}!`);
    } else if (action === 'reminder') {
      addLog(`[SMS] Flight update Ping sent to ${flight.travelerName}. ETA: ${flight.arrivalTime}`);
      triggerNotification(`⏱️ SMS Flight Alert sent to ${flight.travelerName}`);
    }
  };

  // Delete flight entry
  const handleDeleteFlight = async (id: string, travelerName: string) => {
    if (window.confirm(`Are you sure you want to remove ${travelerName}'s flight?`)) {
      setFlights(prev => prev.filter(f => f.id !== id));
      
      const supabase = getSupabase();
      if (supabase && !isOffline && navigator.onLine) {
        try {
          const res = await supabase.from('flights').delete().eq('id', id);
          if (res.error) {
            console.warn('[Flight Tracker] Error deleting flight from database. Queuing offline:', res.error);
            enqueuePendingMutation('flights', 'delete', null, [{ column: 'id', value: id }]);
          }
        } catch (e) {
          console.error('Failed to delete flight from Supabase:', e);
          enqueuePendingMutation('flights', 'delete', null, [{ column: 'id', value: id }]);
        }
      } else {
        console.info('[Flight Tracker] Offline. Queuing flight delete to device...');
        enqueuePendingMutation('flights', 'delete', null, [{ column: 'id', value: id }]);
      }

      addLog(`Removed flight entry for ${travelerName}`);
      triggerNotification('Flight removed');
    }
  };

  // Filter logic
  const filteredFlights = useMemo(() => {
    return flights.filter(flight => {
      if (!flight) return false;
      const tName = flight.travelerName || '';
      const fNum = flight.flightNumber || '';
      const airl = flight.airline || '';
      const matchSearch = 
        tName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fNum.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airl.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'ALL' || flight.status === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [flights, searchTerm, statusFilter]);

  // Statistics summaries
  const stats = useMemo(() => {
    return {
      total: flights.length,
      inTransit: flights.filter(f => f.status === 'In Transit' || f.status === 'Boarding').length,
      needsPickup: flights.filter(f => f.status === 'Needs Pickup').length,
      pickedUp: flights.filter(f => f.status === 'Picked up').length,
      landed: flights.filter(f => f.status === 'Landed').length,
      delayed: flights.filter(f => f.status === 'Delayed').length
    };
  }, [flights]);

  // Vibe colors mapping helper
  const getBadgeStyles = (status: Flight['status']) => {
    switch (status) {
      case 'Landed':
        return 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400';
      case 'Picked up':
        return 'bg-teal-950/40 border border-teal-500/30 text-teal-400';
      case 'In Transit':
        return 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-400';
      case 'Boarding':
        return 'bg-purple-950/40 border border-purple-500/30 text-purple-400';
      case 'Delayed':
        return 'bg-rose-950/45 border border-rose-500/35 text-rose-400';
      case 'Needs Pickup':
        return 'bg-amber-950/40 border border-amber-500/30 text-amber-400';
      case 'Reminder Set':
        return 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-400';
      default:
        return 'bg-zinc-900 border border-zinc-750 text-zinc-300';
    }
  };

  const getLightBadgeStyles = (status: Flight['status']) => {
    switch (status) {
      case 'Landed':
        return 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-800';
      case 'Picked up':
        return 'bg-teal-500/10 border border-teal-500/35 text-teal-800';
      case 'In Transit':
        return 'bg-cyan-500/10 border border-cyan-500/35 text-cyan-800';
      case 'Boarding':
        return 'bg-purple-500/10 border border-purple-500/35 text-purple-800';
      case 'Delayed':
        return 'bg-rose-500/10 border border-rose-500/35 text-rose-850 font-bold';
      case 'Needs Pickup':
        return 'bg-amber-500/10 border border-amber-500/35 text-amber-850 font-bold';
      case 'Reminder Set':
        return 'bg-indigo-500/10 border border-indigo-500/35 text-indigo-800';
      default:
        return 'bg-zinc-200/60 border border-zinc-300/80 text-zinc-700';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#08090d] text-zinc-100 overflow-hidden relative font-sans">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="relative flex-none pb-4 pt-4 md:pt-16 md:pb-14 flex flex-col items-center justify-center text-center border-b border-zinc-850 bg-zinc-950/90 overflow-hidden gap-2">
          {/* Airport takeoff background graphic with gradient fade */}
          <div className="absolute inset-0 z-0 select-none transition-all duration-300 pointer-events-none" style={{ opacity: backdropOpacity }}>
            <img 
              src={airportBg} 
              alt="Airport runway backdrop" 
              className="w-full h-full object-cover object-center scale-105 contrast-125 saturate-125 brightness-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-[#08090d]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#08090d]/60 via-transparent to-[#08090d]/60" />
          </div>

          {/* Centered Title Lockup */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <h2 
                style={{ fontSize: '26px', lineHeight: '1.1', textShadow: '0 0 25px rgba(59, 130, 246, 0.8)' }}
                className="font-extrabold text-white tracking-tight uppercase text-center animate-pulse"
              >
                ✈️ Flight Tracker
              </h2>
              <InfoTip 
                title="FLIGHT DISPATCH RADAR" 
                bullets={[
                  "TRACK ACTIVE COMMERCIAL FLIGHTS LIVE BY CARRIER AND FLIGHT NUMBER.",
                  "KEYLESS FALLBACK EMULATOR ESTIMATES ARRIVALS INDEPENDENTLY.",
                  "INTEGRATES DEEP LINKS TO GOOGLE FLIGHTS & FLIGHT RADARS.",
                  "SYNC WITH TOUR GROUND TRANSPORT & DIRECT ROAD LOGISTICS."
                ]} 
                accentColor="#00ffcc"
                position="bottom-right"
              />
            </motion.div>
            <p 
              className="text-zinc-400 text-xs text-center max-w-sm mx-auto mb-4 mt-1"
            >
              Monitor flight statuses, gate changes, and transit itineraries across the active tour run.
            </p>
          </div>
        </div>

        {/* COMPRESSED HIGH-DENSITY FLAT DASHBOARD BAND */}
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-zinc-800 bg-zinc-950/45 text-left relative overflow-hidden backdrop-blur-sm">
          {/* Subtle background image */}
          <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-[0.10]">
            <img 
              src="https://images.unsplash.com/photo-1570710891163-6d3b5c47248b?auto=format&fit=crop&q=80&w=600" 
              alt="Airline Gate Background" 
              className="w-full h-full object-cover object-center contrast-115 brightness-[0.75]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08090d] via-transparent to-transparent opacity-90" />
          </div>

          <div className="p-2 sm:p-3 border-r border-b sm:border-b-0 border-zinc-800/60 flex flex-col justify-center bg-zinc-900/10 hover:bg-zinc-900/20 transition-all duration-200 relative z-10 min-w-0">
            <span className="text-[8px] font-mono text-zinc-400 block uppercase tracking-wider font-extrabold truncate">TOTAL BOOKED</span>
            <span className="text-lg font-mono font-black text-zinc-100 mt-0.5 flex items-center gap-1.5">
              <span>{stats.total}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-550 shrink-0" />
            </span>
          </div>
          <div className="p-2 sm:p-3 border-r border-b sm:border-b-0 border-zinc-800/60 bg-[#00ffcc]/3 hover:bg-[#00ffcc]/6 flex flex-col justify-center transition-all duration-200 relative z-10 min-w-0">
            <span className="text-[8px] font-mono text-teal-400 block uppercase tracking-wider font-extrabold truncate">🟢 BOOKED / READY</span>
            <span className="text-lg font-mono font-black text-[#00ffcc] mt-0.5 flex items-center gap-1.5">
              <span>{stats.inTransit}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-pulse shrink-0" />
            </span>
          </div>
          <div className="p-2 sm:p-3 border-r border-b sm:border-b-0 border-zinc-800/60 bg-emerald-950/5 hover:bg-emerald-950/10 flex flex-col justify-center transition-all duration-200 relative z-10 min-w-0">
            <span className="text-[8px] font-mono text-emerald-400 block uppercase tracking-wider font-bold truncate">LANDED</span>
            <span className="text-lg font-mono font-black text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span>{stats.landed}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            </span>
          </div>
          <div className="p-2 sm:p-3 border-r border-zinc-800/60 bg-rose-950/5 hover:bg-rose-950/10 flex flex-col justify-center transition-all duration-200 relative z-10 min-w-0">
            <span className="text-[8px] font-mono text-rose-400 block uppercase tracking-wider font-bold truncate">⚠️ DELAYED</span>
            <span className="text-lg font-mono font-black text-rose-400 mt-0.5 flex items-center gap-1.5">
              <span>{stats.delayed}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
            </span>
          </div>
          <div className="p-2 sm:p-3 border-r border-zinc-800/60 bg-amber-500/3 hover:bg-amber-500/6 flex flex-col justify-center transition-all duration-200 relative z-10 min-w-0">
            <span className="text-[8px] font-mono text-amber-400 block uppercase tracking-wider font-extrabold truncate">NEEDS PICKUP</span>
            <span className="text-lg font-mono font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
              <span>{stats.needsPickup}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            </span>
          </div>
          <div className="p-2 sm:p-3 bg-teal-500/3 hover:bg-teal-500/6 flex flex-col justify-center transition-all duration-200 relative z-10 min-w-0">
            <span className="text-[8px] font-mono text-[#00ffcc] block uppercase tracking-wider font-extrabold truncate">PICKED UP</span>
            <span className="text-lg font-mono font-black text-teal-400 mt-0.5 flex items-center gap-1.5">
              <span>{stats.pickedUp}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse shrink-0" />
            </span>
          </div>
        </div>

        {/* FILTERS & SEARCH ROW */}
        <div className="p-4 bg-zinc-950/50 border-b border-zinc-850/60 flex flex-col gap-3">
          <div className="flex gap-2 sm:gap-3 items-center w-full min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search traveler, flight, carrier..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:outline-none focus:border-[#00ffcc] text-xs pl-9 pr-3 py-3 rounded-xl text-white font-mono placeholder:text-zinc-500"
              />
            </div>
            
            {/* Quick Filter Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 focus:outline-none text-xs rounded-xl px-3 sm:px-4 py-3 text-zinc-350 font-mono cursor-pointer shrink-0"
            >
              <option value="ALL">All Flights</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Reminder Set">Reminder Set</option>
              <option value="Boarding">Boarding</option>
              <option value="In Transit">In Transit</option>
              <option value="Landed">Landed</option>
              <option value="Needs Pickup">Needs Pickup</option>
              <option value="Picked up">Picked up</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="w-full bg-[#00ffcc] hover:bg-[#00ffcc]/90 text-black font-extrabold text-xs py-3 px-5 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer font-mono uppercase tracking-widest h-[44px] shrink-0 shadow-[0_0_15px_rgba(0,255,204,0.35)] hover:shadow-[0_0_22px_rgba(0,255,204,0.6)] animate-pulse hover:animate-none"
          >
            {isAdding ? <X className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
            {isAdding ? 'Cancel Entry' : 'Add New Flight'}
          </button>
        </div>

        {/* CONTROLLER SECTION */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6 items-stretch font-sans">
            
            {/* LEFT 2 COLUMNS: LOGISTICS RECORD SHEETS & DRAFTING DECK */}
            <div className="space-y-6 text-left">
              
              {/* ADDING FORM PANEL */}
          <AnimatePresence>
            {isAdding && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddFlight}
                className="border border-[#00ffcc]/20 bg-teal-950/5 p-5 rounded-2xl space-y-4 overflow-hidden text-left"
              >
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                  <span className="text-xs font-mono font-bold text-[#00ffcc] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> ADD AIRLINE LOGISTICS BOOKING
                  </span>
                  <div className="flex gap-1">
                    <button 
                      type="button" 
                      onClick={() => handleApplyPreset('vocalist')} 
                      className="text-[9px] font-mono font-bold bg-[#1ca8a2]/10 border border-[#1cb0a9]/20 hover:bg-[#1cb0a9]/30 text-teal-400 py-1 px-2 rounded hover:text-white transition"
                    >
                      + Aria (Lead)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleApplyPreset('drummer')} 
                      className="text-[9px] font-mono font-bold bg-[#1ca8a2]/10 border border-[#1cb0a9]/20 hover:bg-[#1cb0a9]/30 text-teal-400 py-1 px-2 rounded hover:text-white transition"
                    >
                      + Marcus (Drums)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleApplyPreset('manager')} 
                      className="text-[9px] font-mono font-bold bg-[#1ca8a2]/10 border border-[#1cb0a9]/20 hover:bg-[#1cb0a9]/30 text-teal-400 py-1 px-2 rounded hover:text-white transition"
                    >
                      + Kenji (Tour Mngr)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Traveler Name</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. John Doe (Bass)"
                      value={newTraveler}
                      onChange={(e) => setNewTraveler(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Departure Date</label>
                    <input 
                      type="date"
                      value={newDepDate}
                      onChange={(e) => setNewDepDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Flight Number</label>
                    <div className="flex gap-2">
			                <input 
                      	type="text" 
                      	required 
                      	placeholder="e.g. AA124"
                      	value={newFlightNo}
                      	onChange={(e) => setNewFlightNo(e.target.value)}
                      	className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]" 
                    	/>
		                </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 my-3 pt-3 border-t border-zinc-900">
                  <div className="text-[10px] font-mono text-zinc-550 leading-relaxed max-w-sm">
                    🛰️ <span className="text-zinc-400 font-bold">AeroDataBox Subscription cancelled?</span> We've engaged our autonomous <span className="text-[#00ffcc] font-bold">Keyless Fallback Simulation Engine</span>. You can also view external public live radars:
                  </div>
                  <div className="flex gap-2 justify-end shrink-0 select-none">
                    <a 
                      href={newFlightNo ? `https://www.google.com/travel/flights?q=Flight%20${encodeURIComponent(newFlightNo)}%20${newDepDate || ''}` : "https://www.google.com/travel/flights"}
                      target="_blank"
                      rel="noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-[9.5px] font-mono px-3 py-1.5 rounded bg-emerald-950/20 border border-emerald-550/30 text-emerald-400 hover:text-white hover:bg-emerald-900/40 hover:border-emerald-500 transition-all flex items-center justify-center gap-1 cursor-pointer font-bold"
                    >
                      Google Flights 🔍
                    </a>
                    <a 
                      href={newFlightNo ? `https://www.flightaware.com/live/flight/${newFlightNo}` : "https://www.flightaware.com"}
                      target="_blank"
                      rel="noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-[9.5px] font-mono px-3 py-1.5 rounded bg-blue-950/20 border border-blue-550/30 text-blue-400 hover:text-white hover:bg-blue-900/40 hover:border-blue-500 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      FlightAware ↗
                    </a>
                    <a 
                      href={newFlightNo ? `https://www.flightradar24.com/data/flights/${newFlightNo}` : "https://www.flightradar24.com"}
                      target="_blank"
                      rel="noreferrer"
                      referrerPolicy="no-referrer"
                      className="text-[9.5px] font-mono px-3 py-1.5 rounded bg-amber-950/20 border border-amber-550/30 text-amber-400 hover:text-white hover:bg-amber-900/40 hover:border-amber-500 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      FlightRadar24 ↗
                    </a>
                  </div>
                </div>

                <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={handleSyncLiveFlight}
                      disabled={isSyncingLiveFlight}
                      className="bg-[#00ffcc]/10 border border-[#00ffcc]/40 text-[#00ffcc] font-mono font-black tracking-widest uppercase text-[10px] px-6 py-3 rounded-lg hover:bg-[#00ffcc]/20 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap active:scale-95 disabled:opacity-50 w-full md:w-auto justify-center"
                    >
                      {isSyncingLiveFlight ? 'Syncing...' : 'SYNC LIVE DATA'} 
                      {!isSyncingLiveFlight && <Sparkles className="w-3.5 h-3.5" />}
                    </button>
                </div>

                {!manualFallback && (
                  <div className="flex justify-center mt-2 mb-2">
                    <button type="button" onClick={() => setManualFallback(true)} className="text-[9px] text-zinc-500 hover:text-zinc-400 underline font-mono uppercase tracking-wider cursor-pointer">
                       or Enter Flight Details Manually
                    </button>
                  </div>
                )}

                {manualFallback && (
                  <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50 space-y-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Manual Flight Details</span>
                      <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Airline Carrier</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Delta, United, Air Canada"
                      value={newAirline}
                      onChange={(e) => setNewAirline(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Tracker Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as Flight['status'])}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Reminder Set">Reminder Set</option>
                      <option value="Boarding">Boarding</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Landed">Landed</option>
                      <option value="Needs Pickup">Needs Pickup</option>
                      <option value="Picked up">Picked up</option>
                      <option value="Delayed">Delayed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Departure Airport</label>
                    <input 
                      type="text" 
                      placeholder="e.g. LAX"
                      value={newDepAirport}
                      onChange={(e) => setNewDepAirport(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Departure Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 09:40 AM"
                      value={newDepTime}
                      onChange={(e) => setNewDepTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Arrival Airport</label>
                    <input 
                      type="text" 
                      placeholder="e.g. JFK"
                      value={newArrAirport}
                      onChange={(e) => setNewArrAirport(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Arrival Time</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 05:15 PM"
                      value={newArrTime}
                      onChange={(e) => setNewArrTime(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Arrival Gate</label>
                    <input 
                      type="text" 
                      placeholder="e.g. B22 (Optional)"
                      value={newGate}
                      onChange={(e) => setNewGate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-zinc-450 block uppercase mb-1">Notes / Pickup Details</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Bring gear trunk, terminal 3 curbside (Optional)"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-teal-500" 
                    />
                  </div>
                </div>
                </div>
                )}

                <button
                  type="submit"
                  className={`w-full ${
                    isOffline 
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/15 border border-amber-500/35' 
                      : 'bg-teal-500 hover:bg-teal-400 text-black shadow-teal-500/10'
                  } font-bold uppercase py-2.5 rounded-xl text-xs transition font-mono tracking-widest cursor-pointer shadow-md`}
                >
                  {isOffline ? 'Save Flight to Device Offline' : 'Confirm Flights Booking Logistics'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* ACTIVE FLIGHTS GRAPH / LIST */}
          <div className="space-y-3">
            {filteredFlights.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-zinc-850 rounded-[24px]">
                <Plane className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">No matching flights on screen</h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">Try relaxing filters or toggle the Add Flight panel to draft one.</p>
                {!isAdding && (
                  <button 
                    onClick={() => setIsAdding(true)} 
                    className="mt-4 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30 hover:border-[#00ffcc] font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-xl"
                  >
                    Launch Flight Creator
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Global Action Labels Bar */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-zinc-900/60 border border-zinc-800/40 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      playTelemetryChirp();
                      triggerNotification("Flight statuses re-synchronized.");
                    }}
                    className="font-mono text-[10px] font-bold uppercase py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#00ffcc]" />
                    <span>Refresh Flights</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playPingSound(1300, 'triangle', 0.12);
                      triggerNotification("Active boarding passes exported.");
                    }}
                    className="font-mono text-[10px] font-bold uppercase py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Export Pass</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredFlights.map((flight, idx) => {
                    const isEditingThis = editingId === flight.id;
                    return (
                      <FlightTicketCard
                        key={`${flight.id}-${idx}`}
                        flight={flight}
                        isEditing={isEditingThis}
                        isOffline={isOffline}
                        onEdit={() => startEditing(flight)}
                        onDelete={() => handleDeleteFlight(flight.id, flight.travelerName)}
                        onSave={() => handleSaveEdit(flight.id)}
                        onQuickStatusToggle={() => handleQuickStatusToggle(flight.id, flight.status)}
                        onExecuteAction={(action) => executeSIMAction(flight, action)}
                        editTraveler={editTraveler}
                        setEditTraveler={setEditTraveler}
                        editAirline={editAirline}
                        setEditAirline={setEditAirline}
                        editFlightNo={editFlightNo}
                        setEditFlightNo={setEditFlightNo}
                        editDepAirport={editDepAirport}
                        setEditDepAirport={setEditDepAirport}
                        editArrAirport={editArrAirport}
                        setEditArrAirport={setEditArrAirport}
                        editDepTime={editDepTime}
                        setEditDepTime={setEditDepTime}
                        editArrTime={editArrTime}
                        setEditArrTime={setEditArrTime}
                        editStatus={editStatus}
                        setEditStatus={setEditStatus}
                        editGate={editGate}
                        setEditGate={setEditGate}
                        editNotes={editNotes}
                        setEditNotes={setEditNotes}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

            </div> {/* CLOSE LEFT 2-COLUMN RAIL */}

            {/* RIGHT COLUMN: REACTION WIDGET CONSOLES */}
            <div className="space-y-6 text-left font-sans">

              {/* TSA TOURING INSTRUMENT TRANSIT GUIDELINES HANDBOOK */}
              <div className="bg-[#141313] border border-zinc-800/80 rounded-2xl p-4.5 space-y-4 shadow-lg text-left">
                <div className="flex justify-between items-center border-b border-zinc-800 pb-2 flex-nowrap">
                  <span className="text-[10px] font-mono font-bold text-[#00ffcc] uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" /> TOURING TRANSIT HANDBOOK
                  </span>
                  <span className="text-[9px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 font-black leading-none uppercase select-none font-mono">
                    TSA CODES
                  </span>
                </div>

                {/* Topic quick selector tabs - horizontal scrolling chip track */}
                <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-barely-visible select-none whitespace-nowrap min-w-0">
                  {[
                    { key: 'batteries', label: '🔋 BATT' },
                    { key: 'guitars', label: '🎸 TUNING' },
                    { key: 'locks', label: '🔒 LOCKS' },
                    { key: 'weight', label: '⚠️ WEIGHT' },
                    { key: 'electronics', label: '⚡ RF GEAR' },
                    { key: 'trackers', label: '📡 TRACK' },
                  ].map((topic, idx) => (
                    <button
                      key={`${topic.key}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedTSATopic(topic.key as any);
                        playPingSound(1100, 'sine', 0.05);
                      }}
                      className={`text-[8.5px] font-mono font-black uppercase px-3 py-2 border rounded-lg tracking-wider transition cursor-pointer shrink-0 leading-none ${
                        selectedTSATopic === topic.key
                          ? 'bg-amber-400/10 text-amber-300 border-amber-500/40 shadow-inner'
                          : 'bg-zinc-950/45 text-zinc-500 border-zinc-850 hover:bg-zinc-900 hover:text-zinc-350'
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>

                {/* Selected TSA details box */}
                <div className="bg-black/30 border border-zinc-850/50 rounded-xl p-3.5 text-[10px] space-y-2 text-zinc-300 leading-relaxed font-sans">
                  {selectedTSATopic === 'batteries' && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-[10px] uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>🔋 LITHIUM ION BATTERY MANDATE</span>
                      </div>
                      <p className="font-sans font-medium text-zinc-400">
                        AA Rechargeable elements (and wireless Shure cells) are <strong className="text-zinc-300 font-bold font-extrabold">STRICTLY FORBIDDEN</strong> in checked luggage. Keep transmitter battery packs inside your cabin carry-on baggage. Under 100 watt-hours is aviation compliant.
                      </p>
                    </>
                  )}
                  {selectedTSATopic === 'guitars' && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-[10px] uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>🎸 STRING TENSION & NECK SAFETY</span>
                      </div>
                      <p className="font-sans font-medium text-zinc-400">
                        When shipping stringed hollow-body instruments, <strong className="text-zinc-300 font-bold">DETUNE strings by one full step</strong>. Jet engine cabin pressure fluctuation causes dramatic temperature drop which contracts wood and can crack delicate instrument necks!
                      </p>
                    </>
                  )}
                  {selectedTSATopic === 'locks' && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-[10px] uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>🔒 TSA-007 KEY EMBARKATION LOCKS</span>
                      </div>
                      <p className="font-sans font-medium text-zinc-400">
                        All heavy duty fly cases (CBR vaults / keyboard bins) must feature standard <strong className="text-zinc-300 font-bold">TSA-007 Master locks</strong>. Using non-approved custom locks will result in security forcing seals open, ruining premium hardcases.
                      </p>
                    </>
                  )}
                  {selectedTSATopic === 'weight' && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-[10px] uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>⚠️ OVERWEIGHT VALUABLES STICKERS</span>
                      </div>
                      <p className="font-sans font-medium text-zinc-400">
                        Cargo items exceeding <strong className="text-zinc-300 font-bold">70 lbs (32 kg)</strong> require high-visibility fluorescent "HEAVY" warnings on their main surfaces. Helps avoid extra inspection penalties at check-in scales.
                      </p>
                    </>
                  )}
                  {selectedTSATopic === 'electronics' && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-[10px] uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>⚡️ HIGH-VALUE ELECTRONICS & RF GEAR</span>
                      </div>
                      <p className="font-sans font-medium text-zinc-400">
                        Always declare specialized RF signal equipment, mixing desks, or rack chassis gear at the check-in counters. Remove any portable power banks or back-up battery supply cells from internal brackets. Always bring fragile calibrated gear onboard.
                      </p>
                    </>
                  )}
                  {selectedTSATopic === 'trackers' && (
                    <>
                      <div className="font-mono font-bold text-amber-300 text-[10px] uppercase border-b border-zinc-900 pb-1 flex items-center gap-1.5 font-mono">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>📡 GPS & BLUETOOTH LUGGAGE TRACKERS</span>
                      </div>
                      <p className="font-sans font-medium text-zinc-400">
                        Place smart trackers (such as AirTags, Tile, or SmartTags) deep within the foam of each travel flight case and key guitar vault. This allows crew loaders to independently verify cargo loading status right from your phone before flight departure.
                      </p>
                    </>
                  )}
                </div>
              </div>

            </div> {/* CLOSE RIGHT 1-COLUMN RAIL */}

          </div> {/* CLOSE GRID */}
        </div> {/* CLOSE CONTROLLER SECT */}

      </div>
    </div>
  );
}
