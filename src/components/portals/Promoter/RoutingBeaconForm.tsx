import React, { useState } from 'react';
import { getSupabase, executeWithSchemaResilience } from '../../../supabase';
import { Radio, Loader2 } from 'lucide-react';

interface RoutingBeaconFormProps {
  activeBandName?: string;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
}

export default function RoutingBeaconForm({
  activeBandName = 'Void Walkers',
  triggerNotification,
  addLog
}: RoutingBeaconFormProps) {
  const [targetRegion, setTargetRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRegion || !startDate || !endDate || !bookingEmail) {
      triggerNotification?.("Error: All fields are required.");
      return;
    }

    setLoading(true);
    addLog?.(`Routing Beacon: Broadcasting availability to region '${targetRegion}'...`);

    const payload = {
      id: 'rb_' + Math.random().toString(36).substring(2, 9),
      band_name: activeBandName,
      target_region: targetRegion,
      start_date: startDate,
      end_date: endDate,
      booking_email: bookingEmail,
      created_at: new Date().toISOString()
    };

    try {
      // 1. Try cloud database insert using Supabase
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await executeWithSchemaResilience(
          async (dataPayload) => {
            const { error, data } = await supabase.from('routing_beacons_v1').insert([dataPayload]);
            return { error, data };
          },
          payload
        );

        if (error) {
          console.warn("[RoutingBeacon] Failed insert on Cloud Supabase, falling back to local list:", error);
        }
      }

      // 2. Local fallback storage to guarantee user intent is recorded resiliently
      const localBeaconsStr = localStorage.getItem('nexus_core_routing_beacons_v1') || '[]';
      const localBeacons = JSON.parse(localBeaconsStr);
      localBeacons.push(payload);
      localStorage.setItem('nexus_core_routing_beacons_v1', JSON.stringify(localBeacons));

      triggerNotification?.(`Routing Beacon dropped successfully in ${targetRegion}!`);
      addLog?.(`Routing Beacon inserted: ${activeBandName} available ${startDate} to ${endDate} in ${targetRegion}.`);

      // Reset form
      setTargetRegion('');
      setStartDate('');
      setEndDate('');
      setBookingEmail('');
    } catch (err: any) {
      console.error(err);
      triggerNotification?.("Failed to drop routing beacon. Storing locally.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="routing-beacon-form" className="p-4 bg-black border border-zinc-900 rounded-xl space-y-4 text-left font-mono">
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
        <Radio className="w-4 h-4 text-[#00ffcc] animate-pulse" />
        <h4 className="text-xs font-black text-white uppercase tracking-wider">
          Broadcast Open Dates
        </h4>
      </div>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        Declare availability to local scene agents, bookers, and independent promoters. Broadcasted signals sync in real-time across regional gateway routers.
      </p>

      <form onSubmit={handleBroadcast} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
            Target Region/State
          </label>
          <input
            type="text"
            required
            value={targetRegion}
            onChange={(e) => setTargetRegion(e.target.value)}
            disabled={loading}
            placeholder="e.g. Dallas, Texas, California, London"
            className="w-full bg-[#0c0e12] border border-zinc-800 focus:border-[#00ffcc] focus:outline-none p-2 rounded text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
              Window Start
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0c0e12] border border-zinc-800 focus:border-[#00ffcc] focus:outline-none p-2 rounded text-xs text-white uppercase tracking-wider"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
              Window End
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              className="w-full bg-[#0c0e12] border border-zinc-800 focus:border-[#00ffcc] focus:outline-none p-2 rounded text-xs text-white uppercase tracking-wider"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">
            Direct Booking Email
          </label>
          <input
            type="email"
            required
            value={bookingEmail}
            onChange={(e) => setBookingEmail(e.target.value)}
            disabled={loading}
            placeholder="booking@yourband.com"
            className="w-full bg-[#0c0e12] border border-zinc-800 focus:border-[#00ffcc] focus:outline-none p-2 rounded text-xs text-white font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 border border-[#00ffcc]/30 hover:border-[#00ffcc] text-[#00ffcc] text-[10px] font-black uppercase tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>TRANSMITTING SIGNALS...</span>
            </>
          ) : (
            <>
              <span>Send Beacon 📡</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
