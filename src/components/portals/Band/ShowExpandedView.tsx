import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ChevronLeft,
  Share2, 
  MapPin, 
  Contact2, 
  Clock, 
  Music, 
  Lock, 
  TrendingDown, 
  Banknote,
  Gift,
  Printer,
  ExternalLink,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  X,
  Users
} from 'lucide-react';
import { Show, Sale } from '../../../types';
import DaySheetPrintView from './DaySheetPrintView';
import { getSupabase } from '../../../supabase';

interface ShowExpandedViewProps {
  show: Show;
  sales: Sale[];
  onBack: () => void;
  onManageSetlist: () => void;
  onCloseShow: () => void;
  onAddExpense: () => void;
  onViewAllSales: () => void;
  bandName?: string;
  triggerNotification?: (msg: string) => void;
  onOpenOnRouteEssentials?: () => void;
  onOpenPitWall?: () => void;
}

export default function ShowExpandedView({
  show,
  sales,
  onBack,
  onManageSetlist,
  onCloseShow,
  onAddExpense,
  onViewAllSales,
  bandName = 'Artist',
  triggerNotification = () => {},
  onOpenOnRouteEssentials,
  onOpenPitWall
}: ShowExpandedViewProps) {
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);
  const [isPitWallOpen, setIsPitWallOpen] = useState(false);
  const [pitWallMessages, setPitWallMessages] = useState<any[]>([]);
  const [newPitWallMessage, setNewPitWallMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load venue pit wall messages
  useEffect(() => {
    if (!show?.id) return;
    const storageKey = `nexus_venue_pitwall_${show.id}`;
    const cached = localStorage.getItem(storageKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPitWallMessages(parsed);
          return;
        }
      } catch (e) {
        console.warn("Could not parse pit messages", e);
      }
    }

    const seed = [
      {
        id: `seed-1-${show.id}`,
        user: 'Pit Host',
        username: 'Pit Host',
        text: `Welcome to the live Pit Wall for ${show.name}! Sound off in the chat 🤘`,
        time: 'Showtime',
        timestamp: 'Showtime'
      },
      {
        id: `seed-2-${show.id}`,
        user: 'Tour Crew',
        username: 'Tour Crew',
        text: `Doors open at ${show.doors_time || 'scheduled time'}. Load-in complete!`,
        time: '30m ago',
        timestamp: '30m ago'
      }
    ];
    setPitWallMessages(seed);
  }, [show?.id, show?.name, show?.doors_time]);

  useEffect(() => {
    if (isPitWallOpen) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPitWallOpen, pitWallMessages.length]);

  const handleSendPitMessage = (customText?: string) => {
    const text = (customText !== undefined ? customText : newPitWallMessage).trim();
    if (!text || !show) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      user: 'You',
      username: bandName || 'Artist',
      text: text,
      time: 'Just now',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setPitWallMessages(prev => {
      const updated = [...prev, newMsg];
      try {
        localStorage.setItem(`nexus_venue_pitwall_${show.id}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    setNewPitWallMessage('');
  };

  const [itineraries, setItineraries] = useState<any[]>([]);
  const [loadingItineraries, setLoadingItineraries] = useState(false);
  const [isAddingItin, setIsAddingItin] = useState(false);
  const [newItinTime, setNewItinTime] = useState('');
  const [newItinActivity, setNewItinActivity] = useState('');

  useEffect(() => {
    if (!show || !show.id) return;
    
    const fetchItineraries = async () => {
      setLoadingItineraries(true);
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { data, error } = await supabase
            .from('itineraries')
            .select('*')
            .eq('show_id', show.id);
            
          if (data && !error && data.length > 0) {
            const sorted = [...data].sort((a, b) => {
              const t1 = a.time || '';
              const t2 = b.time || '';
              return t1.localeCompare(t2);
            });
            setItineraries(sorted);
          } else {
            const fallback = [];
            if (show.load_in_time) fallback.push({ id: 'fallback-loadin', time: show.load_in_time, activity: 'Load-In' });
            if (show.doors_time) fallback.push({ id: 'fallback-doors', time: show.doors_time, activity: 'Doors' });
            if (show.set_time) fallback.push({ id: 'fallback-set', time: show.set_time, activity: 'Set Time' });
            if (show.curfew_time) fallback.push({ id: 'fallback-curfew', time: show.curfew_time, activity: 'Curfew' });
            fallback.sort((a, b) => a.time.localeCompare(b.time));
            setItineraries(fallback);
          }
        } else {
          const fallback = [];
          if (show.load_in_time) fallback.push({ id: 'fallback-loadin', time: show.load_in_time, activity: 'Load-In' });
          if (show.doors_time) fallback.push({ id: 'fallback-doors', time: show.doors_time, activity: 'Doors' });
          if (show.set_time) fallback.push({ id: 'fallback-set', time: show.set_time, activity: 'Set Time' });
          if (show.curfew_time) fallback.push({ id: 'fallback-curfew', time: show.curfew_time, activity: 'Curfew' });
          fallback.sort((a, b) => a.time.localeCompare(b.time));
          setItineraries(fallback);
        }
      } catch (err) {
        console.error("Failed to load itineraries from Supabase:", err);
      } finally {
        setLoadingItineraries(false);
      }
    };

    fetchItineraries();
  }, [show?.id, show]);

  const handleAddItinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItinTime || !newItinActivity || !show?.id) return;
    
    try {
      const supabase = getSupabase();
      if (supabase) {
        const newItem = {
          id: crypto.randomUUID ? crypto.randomUUID() : 'iti_' + Math.random().toString(36).substring(2, 9),
          show_id: show.id,
          time: newItinTime,
          activity: newItinActivity
        };
        const { error } = await supabase.from('itineraries').insert([newItem]);
        if (error) {
          console.error("Failed to insert itinerary:", error);
          triggerNotification("Failed to add itinerary entry.");
        } else {
          triggerNotification("Itinerary entry added!");
          setItineraries(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
          setNewItinTime('');
          setNewItinActivity('');
          setIsAddingItin(false);
        }
      } else {
        const newItem = {
          id: 'local_' + Math.random().toString(36).substring(2, 9),
          show_id: show.id,
          time: newItinTime,
          activity: newItinActivity
        };
        setItineraries(prev => [...prev, newItem].sort((a, b) => a.time.localeCompare(b.time)));
        setNewItinTime('');
        setNewItinActivity('');
        setIsAddingItin(false);
        triggerNotification("Added itinerary locally (Offline Mode)");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteItin = async (id: string) => {
    if (id.startsWith('fallback') || id.startsWith('local_')) {
      setItineraries(prev => prev.filter(item => item.id !== id));
      triggerNotification("Deleted entry.");
      return;
    }
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { error } = await supabase.from('itineraries').delete().eq('id', id);
        if (error) {
          console.error("Failed to delete itinerary:", error);
          triggerNotification("Failed to delete entry.");
        } else {
          setItineraries(prev => prev.filter(item => item.id !== id));
          triggerNotification("Itinerary entry deleted!");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Aggregate sales data for this specific show
  const showSales = useMemo(() => {
    // Since Sale doesn't have show_id by default, we'll try to match by date or just show recent sales
    // For this demonstration and UI, we will just use all sales that have the same band_id (or all if not provided)
    // and pretend they are for this show if they occurred on the same calendar day.
    const showDate = new Date(show.date).toDateString();
    return sales.filter(s => {
      const saleDate = new Date(s.created_at).toDateString();
      return saleDate === showDate;
    });
  }, [sales, show.date]);

  const stats = useMemo(() => {
    let revenue = 0;
    let sold = 0;
    let comped = 0;
    let cardRev = 0;
    let cashRev = 0;

    showSales.forEach(sale => {
      revenue += sale.amount * (sale.quantity || 1);
      if (sale.amount === 0) {
        comped += (sale.quantity || 1);
      } else {
        sold += (sale.quantity || 1);
      }

      if (sale.payment_method === 'CARD' || sale.payment_method === 'QR') {
        cardRev += sale.amount * (sale.quantity || 1);
      } else if (sale.payment_method === 'CASH') {
        cashRev += sale.amount * (sale.quantity || 1);
      }
    });

    const cardPct = revenue > 0 ? Math.round((cardRev / revenue) * 100) : 0;
    const cashPct = revenue > 0 ? Math.round((cashRev / revenue) * 100) : 0;

    // Use show's overriding revenue if not tied directly to items
    const displayRevenue = show.revenue !== undefined ? show.revenue : revenue;

    return {
      revenue: displayRevenue,
      sold,
      comped,
      cardPct,
      cashPct
    };
  }, [showSales, show.revenue]);

  const expenses = 0; // Mocked for now, need expenses list if available

  // Parse location and date
  const parseDate = (dString: string) => {
    try {
      return new Date(dString).toLocaleDateString(undefined, { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
      });
    } catch {
      return dString;
    }
  };

  const isClosed = show.status === 'Closed';

  return (
    <div className="flex flex-col bg-[#0b0c10] text-[#c5c6c7] pb-24 font-sans h-full min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#13161d] sticky top-0 z-20 border-b border-zinc-800/60 pl-16 md:pl-20">
        <div className="flex flex-col items-center">
          <h2 className="text-[17px] font-display font-bold text-[#00ffcc] leading-tight">
            {show.name.split(',')[0]}
          </h2>
          <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
            {show.city || (show.name.includes(',') ? show.name.split(',').slice(1).join(',').trim() : 'Location Unknown')} • {parseDate(show.date)}
          </span>
        </div>
        <button className="p-2 -mr-2 text-[#00ffcc] hover:bg-teal-900/30 rounded-full transition-colors cursor-pointer">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1 bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-3 flex flex-col justify-between aspect-square">
            <span className="text-emerald-500 font-mono text-sm leading-none">$</span>
            <div className="mt-auto">
              <span className="text-xl font-bold text-white block leading-none mb-1">${stats.revenue.toFixed(0)}</span>
              <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest">REVENUE</span>
            </div>
          </div>
          
          <div className="col-span-1 bg-blue-950/20 border border-blue-900/50 rounded-xl p-3 flex flex-col justify-between aspect-square">
            <Banknote className="w-4 h-4 text-blue-500" />
            <div className="mt-auto">
              <span className="text-xl font-bold text-white block leading-none mb-1">{stats.sold}</span>
              <span className="text-[9px] font-mono font-bold text-blue-500 uppercase tracking-widest">SOLD</span>
            </div>
          </div>

          <div className="col-span-1 bg-rose-950/20 border border-rose-900/50 rounded-xl p-3 flex flex-col justify-between aspect-square">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <div className="mt-auto">
              <span className="text-xl font-bold text-white block leading-none mb-1">${expenses}</span>
              <span className="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-widest">EXPENSES</span>
            </div>
          </div>

          <div className="col-span-1 bg-purple-950/20 border border-purple-900/50 rounded-xl p-3 flex flex-col justify-between">
            <Gift className="w-4 h-4 text-purple-500 mb-2" />
            <div className="mt-auto">
              <span className="text-xl font-bold text-white block leading-none mb-1">{stats.comped}</span>
              <span className="text-[9px] font-mono font-bold text-purple-500 uppercase tracking-widest">COMPED</span>
            </div>
          </div>

          <div className="col-span-2 bg-teal-950/10 border border-teal-900/40 rounded-xl p-3 flex flex-col justify-between">
            <div className="text-teal-500 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
            </div>
            <div className="mt-auto flex items-end gap-5">
              <div>
                <span className="text-xl font-bold text-white block leading-none mb-1">{stats.cardPct}%</span>
                <span className="text-[9px] font-mono font-bold text-teal-500 uppercase tracking-widest">CARD</span>
              </div>
              <div className="h-6 w-px bg-teal-900/50 relative bottom-1" />
              <div>
                <span className="text-xl font-bold text-white block leading-none mb-1">{stats.cashPct}%</span>
                <span className="text-[9px] font-mono font-bold text-amber-500 uppercase tracking-widest">CASH</span>
              </div>
            </div>
          </div>
        </div>

        {/* SHOW DETAILS SECTION */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-display tracking-wide">Show Details</h3>
          
          <div className="bg-[#13161d] border border-zinc-800/60 rounded-2xl p-5 space-y-6">
                        {/* Address */}
            <div className="flex gap-4 items-start w-full">
              <MapPin className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-mono text-zinc-500 block mb-0.5">Venue Address</span>
                <span className="text-[15px] font-medium text-white block leading-tight">
                  {show.venue_address || '5629 St Joe Road'}
                </span>
                <span className="text-[15px] font-medium text-white block leading-tight mb-2">
                  {show.city || 'Fort Wayne'}{show.state_province ? `, ${show.state_province}` : ''}{show.country ? ` (${show.country})` : ''}
                </span>

                {/* Driving directions shortcuts */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                      [show.venue_address, show.city, show.state_province, show.country].filter(Boolean).join(', ') || show.name
                    )}`}
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="text-[10px] font-mono font-black tracking-wider text-[#00ffcc] hover:text-[#00ffd0] bg-[#00ffcc]/5 hover:bg-[#00ffcc]/15 border border-[#00ffd0]/20 px-2 py-1 rounded transition-all inline-flex items-center gap-1 outline-none no-underline"
                  >
                    <span>Google Directions</span>
                    <ExternalLink className="w-2.5 h-2.5 text-[#00ffcc]" />
                  </a>
                  <a 
                    href={`https://maps.apple.com/?daddr=${encodeURIComponent(
                      [show.venue_address, show.city, show.state_province, show.country].filter(Boolean).join(', ') || show.name
                    )}`}
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="text-[10px] font-mono font-black tracking-wider text-purple-300 hover:text-purple-200 bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/20 px-2 py-1 rounded transition-all inline-flex items-center gap-1 outline-none no-underline"
                  >
                    <span>Apple Directions</span>
                    <ExternalLink className="w-2.5 h-2.5 text-purple-300" />
                  </a>
                  {onOpenOnRouteEssentials && (
                    <button 
                      onClick={onOpenOnRouteEssentials}
                      className="text-[10px] font-mono font-black tracking-wider text-[#A855F7] hover:text-white bg-[#A855F7]/10 hover:bg-[#A855F7]/30 border border-[#A855F7]/30 hover:border-[#A855F7] px-2 py-1 rounded-none transition-all inline-flex items-center gap-1 shadow-[0_0_8px_rgba(168,85,247,0.15)] hover:shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                    >
                      <MapPin className="w-2.5 h-2.5 text-[#A855F7]" />
                      <span>ON-ROUTE AMENITIES</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="flex gap-4 items-start">
              <Contact2 className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] font-mono text-zinc-500 block mb-0.5">Promoter Contact</span>
                <span className="text-[15px] font-medium text-white block leading-tight">
                  {show.promoter_contact || 'None Recorded'}
                </span>
              </div>
            </div>

            {/* Schedule */}
            <div className="flex gap-4 items-start">
              <Clock className="w-5 h-5 text-[#00ffcc] shrink-0 mt-0.5" />
              <div className="w-full">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-mono text-zinc-500 block">Itinerary & Schedule</span>
                  <button
                    onClick={() => setIsAddingItin(!isAddingItin)}
                    className="text-[11px] font-mono flex items-center gap-1 text-[#00ffcc] hover:text-[#00ffcc]/80 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isAddingItin ? 'Cancel' : 'Add Activity'}</span>
                  </button>
                </div>

                {isAddingItin && (
                  <form onSubmit={handleAddItinSubmit} className="mb-4 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60 flex flex-col gap-2 max-w-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="text-[10px] text-zinc-400 block mb-1">Time (e.g. 17:00)</label>
                        <input
                          type="text"
                          required
                          value={newItinTime}
                          onChange={(e) => setNewItinTime(e.target.value)}
                          placeholder="17:00"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-zinc-400 block mb-1">Activity</label>
                        <input
                          type="text"
                          required
                          value={newItinActivity}
                          onChange={(e) => setNewItinActivity(e.target.value)}
                          placeholder="Soundcheck / Dinner"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#00ffcc] text-zinc-950 font-bold py-1 rounded text-xs hover:bg-[#00ffcc]/90 transition-colors"
                    >
                      Save to Itinerary
                    </button>
                  </form>
                )}

                {loadingItineraries ? (
                  <span className="text-xs text-zinc-500 block">Loading active logistics...</span>
                ) : itineraries.length === 0 ? (
                  <span className="text-xs text-zinc-500 block">No itinerary activities registered. Click 'Add Activity' to define the sequence.</span>
                ) : (
                  <div className="relative border-l border-zinc-800 pl-4 py-1 flex flex-col gap-4 max-w-md">
                    {itineraries.map((item, idx) => (
                      <div key={`${item.id}-${idx}`} className="relative group">
                        {/* Bullet node */}
                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-700 group-hover:border-[#00ffcc] group-hover:bg-[#00ffcc] transition-all" />
                        
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs font-mono font-bold text-[#00ffcc] block">{item.time}</span>
                            <span className="text-sm font-medium text-white">{item.activity}</span>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteItin(item.id)}
                            className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                            title="Remove from itinerary"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {show.additional_notes && (
              <div className="pt-2 border-t border-zinc-800/40">
                <span className="text-[11px] font-mono text-zinc-500 block mb-1.5">Additional Notes</span>
                <p className="text-sm text-white leading-snug">
                  {show.additional_notes}
                </p>
              </div>
            )}
            {!show.additional_notes && (
               <div className="pt-2 border-t border-zinc-800/40">
                 <span className="text-[11px] font-mono text-zinc-500 block mb-1.5">Additional Notes</span>
                 <p className="text-sm text-zinc-500 leading-snug font-mono text-xs">
                   No specific notes filed
                 </p>
               </div>
            )}

            {/* Show Provisions & WiFi Details */}
            <div className="pt-4 border-t border-zinc-800/40 space-y-3.5">
              <span className="text-[11px] font-mono text-zinc-400 block tracking-wider uppercase">Venue Provisions & WiFi</span>
              
              <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
                {/* Age Restrictions */}
                <div className="bg-[#1a1e28]/50 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase block mb-1">Age Restriction</span>
                  <span className="text-xs font-bold text-zinc-100 block">
                    {show.age_restriction === 'all' ? '🧒 All Ages' : show.age_restriction === '18' ? '🔞 18+' : show.age_restriction === '21' ? '🍻 21+' : '🧒 All Ages'}
                  </span>
                </div>

                {/* Expected Merch Cut */}
                <div className="bg-[#1a1e28]/50 p-2.5 rounded-xl border border-zinc-850">
                  <span className="text-[9px] text-zinc-500 uppercase block mb-1">Merch cut & Fee</span>
                  <span className="text-zinc-100 block text-[11px] leading-tight">
                    Cut: <strong className="text-[#00ffcc]">{show.venue_cut_percentage !== undefined ? show.venue_cut_percentage : 0}%</strong>
                    {show.merch_space_fee ? ` • Fee: $${show.merch_space_fee}` : ''}
                    {show.seller_cost ? ` • Seller: $${show.seller_cost}` : ''}
                  </span>
                </div>
              </div>

              {/* Toggles for Gear */}
              <div className="flex flex-wrap gap-2 pt-1">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${show.tables_provided ? 'bg-[#00ffcc]/10 border-[#00ffcc]/35 text-[#00ffcc]' : 'bg-zinc-900/40 border-zinc-850 text-zinc-500'}`}>
                  {show.tables_provided ? '✓ Tables Provided' : '✗ No Tables'}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${show.hanging_grids_provided ? 'bg-[#00ffcc]/10 border-[#00ffcc]/35 text-[#00ffcc]' : 'bg-zinc-900/40 border-zinc-850 text-zinc-500'}`}>
                  {show.hanging_grids_provided ? '✓ Hanging Grids' : '✗ No Hanging Grids'}
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${show.shore_power ? 'bg-[#00ffcc]/10 border-[#00ffcc]/35 text-[#00ffcc]' : 'bg-zinc-900/40 border-zinc-850 text-zinc-500'}`}>
                  {show.shore_power ? '✓ Shore Power' : '✗ No Shore Power'}
                </span>
              </div>

              {/* WiFi block */}
              <div className="bg-teal-950/10 border border-teal-900/30 rounded-xl p-3 text-xs font-mono">
                <span className="text-[9px] text-[#00ffcc] font-bold block mb-1 uppercase tracking-wide">Backstage WiFi Network</span>
                <div className="space-y-1">
                  {show.wifi_network && show.wifi_network.trim() !== '' ? (
                    <div className="text-[11px]">
                      <span className="text-zinc-500">SSID: </span>
                      <span className="text-white font-bold">{show.wifi_network}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-600">
                      // WIFI SSID: NOT SPECIFIED
                    </div>
                  )}
                  {show.wifi_password && show.wifi_password.trim() !== '' ? (
                    <div className="flex justify-between items-center bg-black/40 px-2 py-1 rounded border border-zinc-850 mt-1 text-[11px]">
                      <div>
                        <span className="text-zinc-500">PASS: </span>
                        <span className="text-[#00ffcc] font-bold">{show.wifi_password}</span>
                      </div>
                      <button
                        onClick={() => {
                          try {
                            navigator.clipboard.writeText(show.wifi_password || '');
                          } catch (_) {}
                        }}
                        className="text-[9px] text-[#00ffcc] hover:text-white uppercase font-black tracking-wider cursor-pointer font-sans"
                      >
                        COPY PASSWORD
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-zinc-600 mt-1">
                      // WIFI CODE: NOT SPECIFIED
                    </div>
                  )}
                </div>
              </div>

              {/* Stage Backline Requirements block */}
              <div className="bg-purple-950/10 border border-purple-900/30 rounded-xl p-3 text-xs font-mono">
                <span className="text-[9px] text-purple-400 font-bold block mb-1 uppercase tracking-wide">Stage Backline Requirements</span>
                {show.stage_backline_requirements && show.stage_backline_requirements.trim() !== '' ? (
                  <p className="text-zinc-300 leading-normal text-[11px] whitespace-pre-wrap">{show.stage_backline_requirements}</p>
                ) : (
                  <p className="text-[11px] text-zinc-600 font-mono">// BACKLINE: NO RECORD FOUND</p>
                )}
              </div>

              {/* Dinner Arrangements block */}
              <div className="bg-amber-950/10 border border-amber-900/30 rounded-xl p-3 text-xs font-mono">
                <span className="text-[9px] text-amber-500 font-bold block mb-1 uppercase tracking-wide">Dinner Arrangements</span>
                {show.dinner_arrangements && show.dinner_arrangements.trim() !== '' ? (
                  <p className="text-zinc-300 leading-normal text-[11px] whitespace-pre-wrap">{show.dinner_arrangements}</p>
                ) : (
                  <p className="text-[11px] text-zinc-600 font-mono">// DINNER ARRANGEMENTS: NOT LOGGED</p>
                )}
              </div>

              {/* Parking block */}
              {show.parking_arrangements && (
                <div className="bg-[#151720]/45 border border-zinc-850 rounded-xl p-3 text-xs font-mono">
                  <span className="text-[9px] text-zinc-500 uppercase block mb-1">Parking Arrangements</span>
                  <p className="text-zinc-300 leading-normal text-[11px]">{show.parking_arrangements}</p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3">
          <button 
            type="button"
            onClick={() => {
              if (onOpenPitWall) {
                onOpenPitWall();
              } else {
                setIsPitWallOpen(true);
              }
            }}
            className="w-full bg-gradient-to-r from-rose-950/70 to-rose-900/40 hover:from-rose-900/80 hover:to-rose-800/60 border border-rose-600/70 text-rose-300 hover:text-white py-3.5 rounded-xl font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.25)]"
          >
            <MessageSquare className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            ENTER VENUE PIT WALL
          </button>

          <button 
            type="button"
            onClick={() => setIsDaySheetOpen(true)}
            className="w-full bg-gradient-to-r from-teal-950/40 to-[#00ffcc]/10 hover:from-[#00ffcc]/10 hover:to-[#00ffcc]/20 border border-[#00ffcc]/20 hover:border-[#00ffcc]/40 text-[#00ffcc] py-3.5 rounded-xl font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.1)]"
          >
            <Printer className="w-4.5 h-4.5" />
            CREATE 8.5x11 DAY-SHEET / PRINT
          </button>

          <button 
            onClick={onManageSetlist}
            className="w-full bg-[#8c52ff] hover:bg-[#7b42ea] text-white py-3.5 rounded-xl font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Music className="w-4 h-4" />
            MANAGE SETLIST
          </button>
          
          <button 
            onClick={onCloseShow}
            className={`w-full py-3.5 rounded-xl font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              isClosed 
                ? 'bg-zinc-800 text-zinc-400' 
                : 'bg-[#00e6b8] hover:bg-[#00ffcc] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]'
            }`}
          >
            <Lock className="w-4 h-4" />
            {isClosed ? 'SHOW CLOSED' : 'FINALIZE & CLOSE SHOW'}
          </button>
        </div>

        {/* SHOW EXPENSES */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-[16px] font-bold text-white font-display tracking-wide">Show Expenses</h3>
            <button 
              onClick={onAddExpense}
              className="text-[#ff4d4d] text-xs font-bold flex items-center gap-1 hover:text-red-400 transition-colors"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Add Expense
            </button>
          </div>
          
          <div className="bg-[#13161d] border border-zinc-800/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
            <TrendingDown className="w-10 h-10 text-zinc-700 mb-3" strokeWidth={1.5} />
            <p className="text-xs text-zinc-400 mb-4 font-mono">No expenses recorded for this show yet</p>
            <button 
              onClick={onAddExpense}
              className="bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border border-rose-900/50 py-2 px-4 rounded-lg text-xs font-bold transition-colors"
            >
              Record First Expense
            </button>
          </div>
        </div>

        {/* RECENT SALES */}
        <div className="space-y-3 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-[16px] font-bold text-white font-display tracking-wide">Recent Sales</h3>
            <button 
              onClick={onViewAllSales}
              className="text-[#00ffcc] text-xs font-bold hover:text-teal-400 transition-colors"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-2">
            {showSales.length === 0 ? (
              <div className="text-zinc-500 text-xs font-mono py-4 text-center border border-zinc-800/40 rounded-xl bg-zinc-900/20">
                No recorded sales.
              </div>
            ) : (
              showSales.slice(0, 3).map((sale, idx) => (
                <div key={`${sale.id}-${idx}`} className="bg-[#13161d] border border-zinc-800/60 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-900/20 border border-amber-900/50 p-2 rounded-lg">
                      <Banknote className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {sale.quantity}x {sale.item_name || 'Item'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        No discount applied
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[15px] font-bold text-white">
                      ${(sale.amount * (sale.quantity || 1)).toFixed(2)}
                    </span>
                    <span className="block text-[9px] text-zinc-500 font-mono mt-0.5 uppercase tracking-wide">
                      {new Date(sale.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {sale.payment_method}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <DaySheetPrintView
        show={show}
        sales={sales}
        activeBandName={bandName}
        isOpen={isDaySheetOpen}
        onClose={() => setIsDaySheetOpen(false)}
        triggerNotification={triggerNotification}
      />

      {/* Venue Pit Wall Drawer */}
      <AnimatePresence>
        {isPitWallOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-[100dvh] w-full sm:w-[420px] bg-[#0c0f12] border-l border-rose-900/50 z-[200] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/90">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-950/80 border border-rose-800/60 flex items-center justify-center text-rose-400">
                  <MessageSquare className="w-4 h-4 text-rose-500 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-black text-rose-500 uppercase tracking-widest text-sm flex items-center gap-1.5">
                    <span>The Pit Wall</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-950 border border-rose-800/60 text-rose-300 font-bold">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-zinc-400 text-[10px] font-mono truncate">{show.name} • {show.city}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPitWallOpen(false)}
                className="p-2 hover:bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Topic Chips */}
            <div className="px-3 py-2 bg-zinc-950/60 border-b border-zinc-900 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {[
                '🤘 Soundcheck complete',
                '🔥 Merch table open',
                '⚡ Doors open soon',
                '🍻 Stage ready',
                '🔊 Live in the pit'
              ].map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewPitWallMessage(tag)}
                  className="text-[10px] font-mono bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div className="text-center text-[10px] text-zinc-500 uppercase tracking-widest font-mono py-1">
                — Real-time Venue & Tour Chat —
              </div>
              {pitWallMessages.map((msg, mIdx) => {
                const isMe = msg.user === 'You' || msg.username === (bandName || 'Artist');
                return (
                  <div
                    key={msg.id ? `msg-${msg.id}-${mIdx}` : `msg-${mIdx}`}
                    className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full ${
                        isMe ? 'bg-rose-600' : 'bg-zinc-800 border border-zinc-700'
                      } flex items-center justify-center text-[11px] text-white font-bold shrink-0 shadow`}
                    >
                      {isMe ? '🤘' : (msg.user?.[0] || msg.username?.[0] || 'A')}
                    </div>
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-sm ${
                        isMe
                          ? 'bg-rose-600 text-white rounded-tr-sm'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold truncate ${isMe ? 'text-rose-200' : 'text-zinc-400'}`}>
                          {msg.user || msg.username || 'Fan'}
                        </span>
                        <span className={`text-[8px] font-mono ${isMe ? 'text-rose-200/70' : 'text-zinc-500'}`}>
                          {msg.time || msg.timestamp || ''}
                        </span>
                      </div>
                      <p className="leading-relaxed break-words text-[13px]">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 sticky bottom-0 z-10 shrink-0">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPitMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={newPitWallMessage}
                  onChange={(e) => setNewPitWallMessage(e.target.value)}
                  placeholder="Message the pit wall..."
                  className="flex-1 bg-zinc-900 border border-zinc-700/80 focus:border-rose-500 rounded-full px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newPitWallMessage.trim()}
                  className="w-10 h-10 bg-rose-600 hover:bg-rose-500 active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
