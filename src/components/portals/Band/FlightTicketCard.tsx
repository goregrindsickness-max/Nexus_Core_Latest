import React from 'react';
import { motion } from 'motion/react';
import { 
  User, Plane, Bell, Navigation, Save, Edit3, Trash2, ArrowRight
} from 'lucide-react';
import { Flight } from '../../../types';
import MarqueeText from '../../MarqueeText';

interface FlightTicketCardProps {
  flight: Flight;
  isEditing: boolean;
  isOffline: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onQuickStatusToggle: () => void;
  onExecuteAction: (action: 'pickup' | 'reminder') => void;
  
  // Editing state inputs
  editTraveler: string;
  setEditTraveler: (v: string) => void;
  editAirline: string;
  setEditAirline: (v: string) => void;
  editFlightNo: string;
  setEditFlightNo: (v: string) => void;
  editDepAirport: string;
  setEditDepAirport: (v: string) => void;
  editArrAirport: string;
  setEditArrAirport: (v: string) => void;
  editDepTime: string;
  setEditDepTime: (v: string) => void;
  editArrTime: string;
  setEditArrTime: (v: string) => void;
  editStatus: Flight['status'];
  setEditStatus: (v: Flight['status']) => void;
  editGate: string;
  setEditGate: (v: string) => void;
  editNotes: string;
  setEditNotes: (v: string) => void;
}

export default function FlightTicketCard({
  flight,
  isEditing,
  isOffline,
  onEdit,
  onDelete,
  onSave,
  onQuickStatusToggle,
  onExecuteAction,
  
  editTraveler,
  setEditTraveler,
  editAirline,
  setEditAirline,
  editFlightNo,
  setEditFlightNo,
  editDepAirport,
  setEditDepAirport,
  editArrAirport,
  setEditArrAirport,
  editDepTime,
  setEditDepTime,
  editArrTime,
  setEditArrTime,
  editStatus,
  setEditStatus,
  editGate,
  setEditGate,
  editNotes,
  setEditNotes
}: FlightTicketCardProps) {
  
  // Calculate route progress percentage to show airplane tracking live
  let routeProgress = 8;
  if (flight.status === 'Scheduled') routeProgress = 8;
  else if (flight.status === 'Reminder Set') routeProgress = 20;
  else if (flight.status === 'Boarding') routeProgress = 35;
  else if (flight.status === 'In Transit') routeProgress = 65;
  else if (flight.status === 'Landed') routeProgress = 100;
  else if (flight.status === 'Needs Pickup') routeProgress = 100;
  else if (flight.status === 'Picked up') routeProgress = 100;
  else if (flight.status === 'Delayed') routeProgress = 45;

  // Plain English Status Conversions
  const getStatusLabel = (status: Flight['status']) => {
    switch (status) {
      case 'Scheduled':
        return '🟢 Booked / Ready';
      case 'Delayed':
        return '⚠️ Delayed';
      case 'Boarding':
        return '🛫 Now Boarding';
      case 'In Transit':
        return '🟢 Booked / Ready';
      case 'Landed':
        return '🛬 Landed';
      case 'Needs Pickup':
        return '🚗 Needs Pickup';
      case 'Reminder Set':
        return '⏱️ Alert Set';
      case 'Picked up':
        return '✅ Picked Up';
      default:
        return status;
    }
  };

  const getStatusColorClass = (status: Flight['status']) => {
    switch (status) {
      case 'Landed':
      case 'Picked up':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';
      case 'In Transit':
      case 'Boarding':
        return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30';
      case 'Delayed':
        return 'text-rose-400 bg-rose-950/45 border-rose-500/35 animate-pulse';
      case 'Needs Pickup':
        return 'text-amber-400 bg-amber-950/40 border-amber-500/30';
      default:
        return 'text-zinc-300 bg-zinc-900 border-zinc-750';
    }
  };

  // Animated Status Glow Matrix mapping helper
  const getGlowClasses = (status: Flight['status']) => {
    if (status === 'Delayed') {
      return 'animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.15)] border-amber-500/20';
    }
    if (status?.toLowerCase().includes('cancel') || status?.toLowerCase().includes('rebook')) {
      return 'animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)] border-rose-500/20';
    }
    return 'animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.15)] border-emerald-500/20';
  };

  return (
    <motion.div
      layout
      className={`bg-gradient-to-br from-zinc-900 via-neutral-950 to-purple-950/30 border border-zinc-800/50 rounded-xl relative overflow-hidden p-4 mb-4 flex flex-col justify-between text-left transition-all duration-300 ${getGlowClasses(flight.status)}`}
    >
      {/* Top Header Row */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border bg-zinc-900 border-zinc-800">
            <User className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            {isEditing ? (
              <input 
                type="text"
                value={editTraveler}
                onChange={(e) => setEditTraveler(e.target.value)}
                className="bg-zinc-900 text-xs text-white p-1 px-2 rounded focus:outline-none focus:border-purple-400 border border-zinc-800 w-full font-mono"
              />
            ) : (
              <MarqueeText 
                text={flight.travelerName} 
                className="text-sm font-mono font-black text-white uppercase tracking-wide" 
              />
            )}
            {!isEditing && (
              <div className="w-full overflow-hidden mt-0.5">
                <MarqueeText 
                  text={`${flight.airline} • ${flight.flightNumber}`} 
                  className="text-[10px] font-mono text-zinc-400" 
                />
              </div>
            )}
          </div>
        </div>

        {/* Status Badge */}
        {isEditing ? (
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as Flight['status'])}
            className="bg-zinc-900 text-[10px] text-white p-1 px-1.5 rounded font-mono border border-zinc-800 font-bold focus:outline-none focus:border-purple-400"
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
        ) : (
          <button 
            onClick={onQuickStatusToggle}
            title="Click to cycle status state"
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-black select-none cursor-pointer flex items-center gap-1.5 transition-all shadow-sm border ${getStatusColorClass(flight.status)}`}
          >
            {getStatusLabel(flight.status)}
          </button>
        )}
      </div>

      {/* Origin / Route Code Header */}
      <div className="flex items-center justify-between my-2 bg-zinc-950/40 border border-zinc-800/40 rounded-lg p-2">
        <div className="text-left">
          <span className="text-[8px] font-mono block tracking-wider uppercase text-zinc-500">Origin</span>
          {isEditing ? (
            <input 
              type="text"
              value={editDepAirport}
              onChange={(e) => setEditDepAirport(e.target.value)}
              className="bg-zinc-900 text-xs font-mono font-bold text-white w-14 p-1 mt-0.5 uppercase border border-zinc-800 rounded focus:outline-none"
            />
          ) : (
            <div className="text-xl font-mono tracking-widest font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {flight.departureAirport}
            </div>
          )}
          {!isEditing && <div className="text-[10px] font-mono text-zinc-400">{flight.departureTime}</div>}
        </div>

        {/* Airport Flight Path Arrow */}
        <div className="flex-1 px-4 flex flex-col items-center justify-center relative min-w-0">
          <div className="w-full h-[2px] rounded-full relative overflow-visible bg-zinc-800">
            <div 
              className="h-full rounded-full absolute left-0 top-0 transition-all duration-500 bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_8px_rgba(0,255,204,0.4)]"
              style={{ width: `${routeProgress}%` }}
            />
            {/* Sliding Plane Icon */}
            <div 
              className="absolute -top-1.5 -translate-x-1/2 transition-all duration-500 flex flex-col items-center z-10"
              style={{ left: `${Math.min(94, Math.max(6, routeProgress))}%` }}
            >
              <Plane className="w-3 h-3 rotate-90 text-cyan-400" />
            </div>
          </div>
          <span className="text-[9px] font-mono text-zinc-500 mt-1 uppercase tracking-widest">{flight.flightNumber}</span>
        </div>

        <div className="text-right">
          <span className="text-[8px] font-mono block tracking-wider uppercase text-zinc-500">Dest</span>
          {isEditing ? (
            <input 
              type="text"
              value={editArrAirport}
              onChange={(e) => setEditArrAirport(e.target.value)}
              className="bg-zinc-900 text-xs font-mono font-bold text-white w-14 p-1 mt-0.5 uppercase border border-zinc-800 rounded focus:outline-none text-right"
            />
          ) : (
            <div className="text-xl font-mono tracking-widest font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {flight.arrivalAirport}
            </div>
          )}
          {!isEditing && <div className="text-[10px] font-mono text-zinc-400 text-right">{flight.arrivalTime}</div>}
        </div>
      </div>

      {/* Metadata Grid (2x4) */}
      <div className="grid grid-cols-4 gap-1.5 text-[10px] my-2">
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Seat</span>
          <span className="font-bold text-zinc-300">12D</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Gate</span>
          <span className="font-bold text-zinc-300 truncate">
            {isEditing ? (
              <input 
                type="text"
                value={editGate}
                onChange={(e) => setEditGate(e.target.value)}
                className="bg-zinc-950 text-[10px] w-full text-white border border-zinc-800 rounded px-0.5 focus:outline-none"
              />
            ) : (
              flight.gate || 'TBD'
            )}
          </span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Boarding</span>
          <span className="font-bold text-zinc-300">45m Prior</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Baggage</span>
          <span className="font-bold text-zinc-300">32kg Max</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Conf</span>
          <span className="font-bold text-zinc-300 truncate">{flight.id ? flight.id.slice(0, 6).toUpperCase() : 'FX998A'}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Terminal</span>
          <span className="font-bold text-zinc-300">T2</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Carrier</span>
          <span className="font-bold text-zinc-300 truncate">
            {isEditing ? (
              <input 
                type="text"
                value={editAirline}
                onChange={(e) => setEditAirline(e.target.value)}
                className="bg-zinc-950 text-[10px] w-full text-white border border-zinc-800 rounded px-0.5 focus:outline-none"
              />
            ) : (
              flight.airline
            )}
          </span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/40 rounded px-2.5 py-1 text-[11px] font-mono text-zinc-400 flex flex-col">
          <span className="text-[8px] text-zinc-500 font-sans uppercase font-bold leading-none mb-0.5">Class</span>
          <span className="font-bold text-zinc-300">Economy</span>
        </div>
      </div>

      {/* Editing or Displaying Times inside ticket */}
      {isEditing && (
        <div className="grid grid-cols-2 gap-2 my-1.5 text-xs">
          <div>
            <label className="text-[8px] font-mono text-zinc-500 uppercase">DEP Time</label>
            <input 
              type="text"
              value={editDepTime}
              onChange={(e) => setEditDepTime(e.target.value)}
              className="bg-zinc-900 text-xs text-white p-1 rounded border border-zinc-800 w-full"
            />
          </div>
          <div>
            <label className="text-[8px] font-mono text-zinc-500 uppercase">ARR Time</label>
            <input 
              type="text"
              value={editArrTime}
              onChange={(e) => setEditArrTime(e.target.value)}
              className="bg-zinc-900 text-xs text-white p-1 rounded border border-zinc-800 w-full"
            />
          </div>
        </div>
      )}

      {/* Memo notes section */}
      {isEditing ? (
        <div className="space-y-1 mt-1">
          <label className="text-[8px] font-mono text-zinc-500 block uppercase font-bold">Edit Logistics notes:</label>
          <input 
            type="text"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="w-full bg-zinc-950 text-[10px] text-white p-1.5 border border-zinc-800 rounded focus:outline-none"
            placeholder="Luggage details or dispatch markers."
          />
        </div>
      ) : (
        flight.notes && (
          <div className="p-2 mt-1 rounded bg-zinc-900/40 border border-zinc-800/40 text-[10px] font-sans text-zinc-400 leading-relaxed italic flex items-center min-w-0">
            <span className="font-bold font-mono not-italic mr-1.5 text-zinc-500 shrink-0">Memo:</span>
            <div className="flex-1 min-w-0 overflow-hidden">
              <MarqueeText text={flight.notes} className="italic" />
            </div>
          </div>
        )
      )}

      {/* Perforated Ticket Stub Divider */}
      <div className="w-full my-4 border-t-2 border-dashed border-zinc-800/60 relative">
        {/* Side Punch-Out Notches */}
        <div className="w-4 h-4 bg-zinc-950 rounded-full border border-zinc-800/40 absolute -top-2 -left-[22px] z-10" />
        <div className="w-4 h-4 bg-zinc-950 rounded-full border border-zinc-800/40 absolute -top-2 -right-[22px] z-10" />
      </div>

      {/* Ticket Footer / Action Buttons */}
      <div className="flex items-center justify-between gap-1 mt-1">
        <div className="flex gap-1">
          <button
            onClick={() => onExecuteAction('reminder')}
            className="font-mono text-[9px] font-extrabold uppercase tracking-wider px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Bell className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>SMS Alert</span>
          </button>
          
          {(flight.status === 'Needs Pickup' || flight.status === 'Landed') && (
            <button
              onClick={() => onExecuteAction('pickup')}
              className="font-mono text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg bg-teal-650 hover:bg-teal-700 text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <Navigation className="w-3 h-3 shrink-0" />
              <span>Dispatch</span>
            </button>
          )}
        </div>

        {/* Ticket Mutating Action Controls (Small links or low profile icon buttons) */}
        <div className="flex gap-1 shrink-0">
          {isEditing ? (
            <button 
              onClick={onSave}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center w-7 h-7 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/20`}
              title="Save Changes"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={onEdit}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center w-7 h-7"
              title="Edit details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          <button 
            onClick={onDelete}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center w-7 h-7"
            title="Delete flight entry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
