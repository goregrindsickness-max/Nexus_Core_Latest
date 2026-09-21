import React from 'react';
import { MapPin, Copy, Trash2, Phone, Mail } from 'lucide-react';
import { TourPackageStop } from '../TourManagerPackageModule';

interface ItineraryTabProps {
  stops: TourPackageStop[];
  selectedStopId: string;
  setSelectedStopId: (id: string) => void;
  onCopyDaySheet: (stop: TourPackageStop) => void;
  onRemoveStop: (id: string, venueName: string) => void;
  onToggleAdvancing: (id: string) => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  stops,
  selectedStopId,
  setSelectedStopId,
  onCopyDaySheet,
  onRemoveStop,
  onToggleAdvancing
}) => {
  const activeStop = stops.find(s => s.id === selectedStopId) || stops[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Stops List */}
        <div className="lg:col-span-2 space-y-2">
          {stops.map((stop) => {
            const isSelected = stop.id === selectedStopId;
            const d = new Date(stop.date + 'T00:00:00');
            const dateMonth = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const dateDay = d.toLocaleDateString('en-US', { day: '2-digit' });
            const dateWeekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

            return (
              <div
                key={stop.id}
                onClick={() => setSelectedStopId(stop.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-[#151923] border-amber-500/60 shadow-lg shadow-amber-950/20'
                    : 'bg-[#0e1117] border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Date Badge */}
                  <div className="w-12 h-12 rounded-lg bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-center shrink-0">
                    <span className="text-[8px] font-mono text-amber-400 font-bold uppercase">{dateMonth}</span>
                    <span className="text-base font-mono font-black text-white leading-none">{dateDay}</span>
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase">{dateWeekday}</span>
                  </div>

                  {/* Venue & City Info */}
                  <div className="text-left space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                        {stop.venueName}
                      </h4>
                      <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                        stop.status === 'confirmed'
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40'
                          : stop.status === 'advancing'
                          ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                          : 'bg-amber-950/60 text-amber-400 border-amber-500/40'
                      }`}>
                        {stop.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-sans">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{stop.city}, {stop.state}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500 font-mono text-[10px]">Cap: {stop.capacity || 500}</span>
                    </p>
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-zinc-400">
                      <span>Load-In: <strong className="text-zinc-200">{stop.loadInTime}</strong></span>
                      <span>•</span>
                      <span>Doors: <strong className="text-zinc-200">{stop.doorsTime}</strong></span>
                      <span>•</span>
                      <span>Deal: <strong className="text-emerald-400">${stop.grossDeal.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyDaySheet(stop);
                    }}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copy Day Sheet"
                  >
                    <Copy className="w-3 h-3 text-amber-400" /> Day Sheet
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStop(stop.id, stop.venueName);
                    }}
                    className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove stop"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stop Advance Deep Inspector */}
        {activeStop && (
          <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase">{activeStop.venueName}</h4>
                  <span className="text-[9px] font-mono text-zinc-400">{activeStop.city}, {activeStop.state}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleAdvancing(activeStop.id)}
                className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider border cursor-pointer ${
                  activeStop.advancingDone
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                    : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                }`}
              >
                {activeStop.advancingDone ? '✓ Advanced' : 'Advance Pending'}
              </button>
            </div>

            {/* Day Timings Box */}
            <div className="space-y-1 text-left bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
              <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold block mb-1">Production Run-of-Show Timetable</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                  <span className="text-zinc-500">Load-In:</span>
                  <span className="text-white font-bold">{activeStop.loadInTime}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                  <span className="text-zinc-500">Soundcheck:</span>
                  <span className="text-white font-bold">{activeStop.soundcheckTime}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                  <span className="text-zinc-500">Doors:</span>
                  <span className="text-white font-bold">{activeStop.doorsTime}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                  <span className="text-zinc-500">Downbeat:</span>
                  <span className="text-emerald-400 font-bold">{activeStop.showStartTime}</span>
                </div>
                <div className="flex justify-between col-span-2 pt-0.5">
                  <span className="text-zinc-500">Curfew / Bus Call:</span>
                  <span className="text-purple-300 font-bold">{activeStop.curfewTime}</span>
                </div>
              </div>
            </div>

            {/* Venue Contacts */}
            <div className="space-y-1 text-left">
              <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold block">Venue Production Contact</span>
              <div className="p-2 rounded bg-zinc-950/80 border border-zinc-900 space-y-0.5 text-[10px] text-zinc-300">
                <div className="font-bold text-white">{activeStop.venueContactName}</div>
                {activeStop.venueContactPhone && (
                  <div className="text-zinc-400 flex items-center gap-1 font-mono text-[9.5px]">
                    <Phone className="w-3 h-3 text-amber-400" /> {activeStop.venueContactPhone}
                  </div>
                )}
                {activeStop.venueContactEmail && (
                  <div className="text-zinc-400 flex items-center gap-1 font-mono text-[9.5px]">
                    <Mail className="w-3 h-3 text-cyan-400" /> {activeStop.venueContactEmail}
                  </div>
                )}
              </div>
            </div>

            {/* Parking & Shore Power */}
            <div className="space-y-1 text-left">
              <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold block">Parking & Shore Power</span>
              <p className="text-[10px] text-zinc-300 bg-zinc-950/80 p-2 rounded border border-zinc-900 leading-relaxed font-sans">
                {activeStop.parkingNotes || 'Contact venue upon arrival.'}
              </p>
            </div>

            {/* Copy Full Day Sheet */}
            <button
              type="button"
              onClick={() => onCopyDaySheet(activeStop)}
              className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Master Day Sheet (SMS/WhatsApp)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
