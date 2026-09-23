import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  Mail, 
  Phone, 
  Check, 
  UserPlus, 
  Send, 
  Ticket, 
  X, 
  Sparkles, 
  QrCode, 
  CheckCircle,
  Copy,
  Share2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Smartphone,
  Info
} from 'lucide-react';
import { Show, GuestListItem } from '../../../types';
import { getSupabase } from '../../../supabase';
import { motion } from 'motion/react';
import InfoTip from '../../InfoTip';

interface GuestlistsViewProps {
  shows: Show[];
  setShows: React.Dispatch<React.SetStateAction<Show[]>>;
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  initialShowId?: string;
  bandName?: string;
  activeBandId?: string;
}

export default function GuestlistsView({
  shows,
  setShows,
  onBack,
  triggerNotification,
  addLog,
  initialShowId = '',
  bandName = 'Artist',
  activeBandId = ''
}: GuestlistsViewProps) {
  // Filter out community shows unless the band created them or is added to them
  const eligibleShows = useMemo(() => {
    const currentBandName = (bandName || '').trim().toLowerCase();
    const currentBandId = (activeBandId || '').trim();

    return shows.filter(show => {
      // 1. Explicit match on band_id for the active band
      if (currentBandId && show.band_id === currentBandId) {
        return true;
      }

      // 2. Check if the band is added to this show (lineup, support, headliner, acts, collaborators, or title)
      const isBandAddedToShow = (() => {
        // Check collaborator IDs
        if (currentBandId && Array.isArray(show.collaborator_ids) && show.collaborator_ids.includes(currentBandId)) {
          return true;
        }

        if (!currentBandName) return false;

        // Check title / name / festival
        const title = (show.name || '').toLowerCase();
        const festival = (show.festival_name || '').toLowerCase();
        if (title.includes(currentBandName) || festival.includes(currentBandName)) {
          return true;
        }

        // Check support_bands string
        if (typeof show.support_bands === 'string' && show.support_bands.toLowerCase().includes(currentBandName)) {
          return true;
        }

        // Check support_lineup array
        if (Array.isArray(show.support_lineup)) {
          const matchInSupport = show.support_lineup.some((item: any) => {
            if (typeof item === 'string') return item.toLowerCase().includes(currentBandName);
            if (item && typeof item === 'object') {
              const nameStr = (item.name || item.band_name || item.act || '').toLowerCase();
              return nameStr.includes(currentBandName);
            }
            return false;
          });
          if (matchInSupport) return true;
        }

        // Check acts / lineup if present
        const anyShow = show as any;
        if (Array.isArray(anyShow.acts)) {
          const matchActs = anyShow.acts.some((act: any) => {
            if (typeof act === 'string') return act.toLowerCase().includes(currentBandName);
            if (act && typeof act === 'object') {
              const nameStr = (act.name || act.band_name || act.title || '').toLowerCase();
              return nameStr.includes(currentBandName);
            }
            return false;
          });
          if (matchActs) return true;
        }

        if (typeof anyShow.lineup === 'string' && anyShow.lineup.toLowerCase().includes(currentBandName)) {
          return true;
        }

        if (typeof anyShow.headliner === 'string' && anyShow.headliner.toLowerCase().includes(currentBandName)) {
          return true;
        }

        return false;
      })();

      if (isBandAddedToShow) {
        return true;
      }

      // 3. Identify if this is a community show
      const isCommunityOnly = show.is_community_submitted === true || 
        (typeof show.id === 'string' && show.id.startsWith('sh_comm_')) || 
        (show.band_id && (show.band_id === 'community_hub' || show.band_id.startsWith('community')));

      // If it is a community show and band is NOT added to it, strictly exclude
      if (isCommunityOnly) {
        return false;
      }

      // 4. Regular band shows: belong to this band or legacy show without band_id
      return !show.band_id || show.band_id === currentBandId;
    });
  }, [shows, bandName, activeBandId]);

  // Select active show from eligible shows only
  const [activeShowId, setActiveShowId] = useState<string>(() => {
    if (initialShowId && eligibleShows.some(s => s.id === initialShowId)) {
      return initialShowId;
    }
    return eligibleShows.length > 0 ? eligibleShows[0].id : '';
  });

  // Keep activeShowId synced with eligible shows
  useEffect(() => {
    if (initialShowId && eligibleShows.some(s => s.id === initialShowId)) {
      setActiveShowId(initialShowId);
    } else if (activeShowId && !eligibleShows.some(s => s.id === activeShowId)) {
      setActiveShowId(eligibleShows.length > 0 ? eligibleShows[0].id : '');
    } else if (!activeShowId && eligibleShows.length > 0) {
      setActiveShowId(eligibleShows[0].id);
    }
  }, [eligibleShows, initialShowId, activeShowId]);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Form input states
  const [name, setName] = useState('');
  const [additionalCount, setAdditionalCount] = useState<number>(0);
  const [accessType, setAccessType] = useState<'VIP' | 'General' | 'Crew' | 'Media'>('General');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Editing guest states
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  // Modal transmit active states
  const [selectedGuest, setSelectedGuest] = useState<GuestListItem | null>(null);
  const [transmitMedium, setTransmitMedium] = useState<'email' | 'sms'>('email');
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitSuccess, setTransmitSuccess] = useState(false);

  // Active show object
  const activeShow = useMemo(() => {
    return eligibleShows.find(s => s.id === activeShowId);
  }, [eligibleShows, activeShowId]);

  // Guest list selector
  const guestList = useMemo(() => {
    return activeShow?.guest_list || [];
  }, [activeShow]);

  // Filtered guest list
  const filteredGuests = useMemo(() => {
    if (!searchQuery.substring(0).trim()) return guestList;
    const q = searchQuery.toLowerCase();
    return guestList.filter(g => g.name.toLowerCase().includes(q) || (g.email && g.email.toLowerCase().includes(q)));
  }, [guestList, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalPlusCount = 0;
    let confirmedCount = 0;
    guestList.forEach(g => {
      totalPlusCount += 1 + g.additional_count;
      if (g.confirmed_sent) confirmedCount++;
    });
    return {
      records: guestList.length,
      totalCapacity: totalPlusCount,
      confirmed: confirmedCount,
      pending: guestList.length - confirmedCount
    };
  }, [guestList]);

  // Synchronize guest list from Supabase on mount/change
  useEffect(() => {
    const syncSingleShowGuests = async () => {
      if (!activeShowId) return;
      const supabase = getSupabase();
      if (!supabase || !navigator.onLine) return;

      try {
        const { data, error } = await supabase
          .from('guestlists')
          .select('*')
          .eq('show_id', activeShowId);

        if (!error && data) {
          const mappedGuests: GuestListItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            additional_count: d.additional_count,
            access_type: d.access_type,
            email: d.email || undefined,
            phone: d.phone || undefined,
            confirmed_sent: d.confirmed_sent,
            confirmed_sent_at: d.confirmed_sent_at || undefined,
            confirmed_sent_via: d.confirmed_sent_via || undefined
          }));

          setShows(prev => prev.map(s => {
            if (s.id === activeShowId) {
              return { ...s, guest_list: mappedGuests };
            }
            return s;
          }));
          addLog(`Synchronized ${mappedGuests.length} guests for show ${activeShowId} from Supabase.`);
        }
      } catch (err) {
        console.error('Failed to sync guests from Supabase:', err);
      }
    };

    syncSingleShowGuests();
  }, [activeShowId]);

  // Handle local storage storage & React state updates
  const saveGuestListUpdate = (updatedList: GuestListItem[]) => {
    if (!activeShowId) return;
    
    // Update react parent state
    setShows(prev => prev.map(s => {
      if (s.id === activeShowId) {
        return { ...s, guest_list: updatedList };
      }
      return s;
    }));

    // Update localStorage
    try {
      const existing = localStorage.getItem('nexus_core_shows_extended');
      let extendedMap: any = {};
      if (existing) {
        extendedMap = JSON.parse(existing);
      }
      
      const prevExtra = extendedMap[activeShowId] || {};
      extendedMap[activeShowId] = {
        ...prevExtra,
        guest_list: updatedList
      };
      
      localStorage.setItem('nexus_core_shows_extended', JSON.stringify(extendedMap));
    } catch (err) {
      console.error('Failed to save guestlist update in storage:', err);
    }
  };

  // Add guest item controller
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.substring(0).trim()) {
      triggerNotification('Please enter a guest name');
      return;
    }

    const newGuest: GuestListItem = {
      id: 'g_' + Date.now(),
      name: name.trim(),
      additional_count: Number(additionalCount),
      access_type: accessType,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      confirmed_sent: false
    };

    // Sync validation to Supabase when online
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('guestlists').insert({
          id: newGuest.id,
          show_id: activeShowId,
          name: newGuest.name,
          additional_count: newGuest.additional_count,
          access_type: newGuest.access_type,
          email: newGuest.email,
          phone: newGuest.phone,
          confirmed_sent: newGuest.confirmed_sent
        });
        if (error) throw error;
        addLog(`Guest synced to Supabase: ${newGuest.name}`);
      } catch (err: any) {
        console.error('Supabase write guest failed:', err);
      }
    }

    const updated = [...guestList, newGuest];
    saveGuestListUpdate(updated);

    // Reset inputs
    setName('');
    setAdditionalCount(0);
    setAccessType('General');
    setEmail('');
    setPhone('');

    addLog(`Added guest "${newGuest.name}" to show guestlist`);
    triggerNotification(`Guest added to door list!`);
  };

  // Delete guest item controller
  const handleDeleteGuest = async (id: string, guestName: string) => {
    const updated = guestList.filter(g => g.id !== id);

    // Sync deletion to Supabase when online
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('guestlists').delete().eq('id', id);
        if (error) throw error;
        addLog(`Guest deleted from Supabase: ${guestName}`);
      } catch (err: any) {
        console.error('Supabase guest deletion failed:', err);
      }
    }

    saveGuestListUpdate(updated);
    addLog(`Removed guest "${guestName}" from show list`);
    triggerNotification(`Removed guest list record`);
  };

  // Trigger modal transmit config
  const handleOpenTransmit = (guest: GuestListItem, medium: 'email' | 'sms') => {
    setSelectedGuest(guest);
    setTransmitMedium(medium);
    setTestEmail(guest.email || `${guest.name.toLowerCase().replace(/\s+/g, '')}@example.com`);
    setTestPhone(guest.phone || '+1 (555) 019-9231');
    setIsTransmitting(false);
    setTransmitSuccess(false);
  };

  // Link ticket transmitting process to the node mailer api
  const triggerTransmit = async () => {
    setIsTransmitting(true);

    const activeShow = shows.find(s => s.id === activeShowId);

    let sendSuccess = true;
    if (transmitMedium === 'email' && selectedGuest) {
      try {
        const showDateRaw = activeShow ? activeShow.date : '';
        const response = await fetch('/api/emails/guestlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: testEmail,
            guestName: selectedGuest.name,
            bandName: bandName,
            showDate: showDateRaw,
            venueName: activeShow ? activeShow.name : '',
            passType: selectedGuest.access_type || 'General',
            additionalCount: selectedGuest.additional_count || 0
          })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error?.message || result.error || 'Failed to send guestlist email');
        }

        if (result.simulated) {
          console.log("Email simulated locally (Resend not fully configured).");
        }
      } catch (e: any) {
        console.error(e);
        triggerNotification(`Error: ${e.message}`);
        sendSuccess = false;
      }
    } else if (transmitMedium === 'sms') {
      // SMS simulation (for now)
      await new Promise(resolve => setTimeout(resolve, 1800));
    }

    setIsTransmitting(false);

    if (sendSuccess) {
      setTransmitSuccess(true);
      
      // Update state to mark as sent
      if (selectedGuest && activeShowId) {
        const updatedList = guestList.map(g => {
          if (g.id === selectedGuest.id) {
            const updatedG = {
              ...g,
              confirmed_sent: true,
              confirmed_sent_at: new Date().toISOString(),
              confirmed_sent_via: transmitMedium,
              email: transmitMedium === 'email' ? testEmail : g.email,
              phone: transmitMedium === 'sms' ? testPhone : g.phone
            };

            // Sync ticket transmission to Supabase when online
            const supabase = getSupabase();
            if (supabase && navigator.onLine) {
              supabase.from('guestlists').update({
                confirmed_sent: updatedG.confirmed_sent,
                confirmed_sent_at: updatedG.confirmed_sent_at,
                confirmed_sent_via: updatedG.confirmed_sent_via,
                email: updatedG.email,
                phone: updatedG.phone
              }).eq('id', g.id).then(({ error }) => {
                if (error) console.error('Supabase guest transmission update failed:', error);
              });
            }

            return updatedG;
          }
          return g;
        });
        saveGuestListUpdate(updatedList);
        
        addLog(`Sent ticket confirmation via ${transmitMedium.toUpperCase()} to "${selectedGuest.name}"`);
        triggerNotification(`Entry Pass transmitted successfully!`);
      }
    }
  };

  return (
    <div className="bg-[#0c0e12] min-h-screen text-zinc-100 flex flex-col font-sans mb-28 relative">
      
      {/* HEADER SECTION */}
      <div className="relative w-full border-b border-zinc-900 pb-6 pt-6 flex flex-col items-center justify-center text-center bg-[#0f1116] sticky top-0 z-40 gap-4" style={{ height: '170.565px' }}>
        
        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <h1 
              className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
              style={{
                textShadow: '0 0 12px rgba(244, 63, 94, 0.4), 0 0 25px rgba(225, 29, 72, 0.35), 0 0 50px rgba(251, 113, 133, 0.2)',
                letterSpacing: '0.1em',
                fontWeight: 950,
                fontSize: '26px',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            >
              Door Guestlists
            </h1>
            <InfoTip 
              title="GUESTLIST PROTOCOL"
              bullets={[
                "ADD VIP, INDUSTRY, PRESS, AND PLUS-ONE CLIENT REQUESTS SECURELY.",
                "EACH LIST CORRESPONDS TO A SPECIFIC CALENDAR DATE OR BOOKED SHOW.",
                "REAL-TIME CHECK-IN SWIPING AT THE DOOR TRACES ARRIVALS.",
                "CSV/RAW TEXT AGENT LIST SHARING ALLOWS QUICK PRINT EXPORTS."
              ]}
              accentColor="#f43f5e"
              position="bottom-right"
            />
          </motion.div>
          <p 
            className="text-xs md:text-sm text-zinc-400 font-mono tracking-wide max-w-xl leading-relaxed text-center px-4"
            style={{ marginTop: '1px', fontSize: '10px' }}
          >
            Coordinate door entries, edit VIP lists, print exportable agent sheets, and trace real-time check-ins on mobile devices.
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* SHOW SELECTOR SECTOR */}
        <div className="bg-[#111319] border border-zinc-850 p-3.5 rounded-2xl space-y-2" style={{ backgroundColor: '#000000' }}>
          <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
            SELECT SHOW TO MANAGE
          </label>
          {eligibleShows.length === 0 ? (
            <div className="text-xs text-zinc-500 italic py-1">No scheduled band shows available. Please create a schedule in Shows tab.</div>
          ) : (
            <select
              value={activeShowId}
              onChange={(e) => {
                setActiveShowId(e.target.value);
                setSearchQuery('');
              }}
              className="w-full bg-[#161a23] border border-zinc-800 text-xs text-white rounded-xl p-3 font-medium focus:outline-none focus:border-[#00ffcc] tracking-wide"
            >
              {eligibleShows.map((s, sIdx) => (
                <option key={`${s.id}-${sIdx}`} value={s.id}>
                  {s.date} - {s.festival_name || s.name} ({s.guest_list?.length || 0} guests)
                </option>
              ))}
            </select>
          )}
        </div>

        {activeShow ? (
          <>
            {/* INLINE CUMULATIVE STATS BAR */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-[#111319] border border-zinc-850 p-2 rounded-xl flex flex-col justify-center" style={{ backgroundColor: '#212121' }}>
                <span className="text-[9px] font-mono text-zinc-500 uppercase" style={{ color: '#ffffff' }}>Records</span>
                <span className="text-lg font-display font-bold text-white mt-0.5">{stats.records}</span>
              </div>
              <div className="bg-[#111319] border border-zinc-850 p-2 rounded-xl flex flex-col justify-center">
                <span className="text-[9px] font-mono text-zinc-500 uppercase" style={{ color: '#ffffff' }}>Total Head</span>
                <span className="text-lg font-display font-bold text-[#00ffcc] mt-0.5">{stats.totalCapacity}</span>
              </div>
              <div className="bg-[#111319] border border-zinc-850 p-2 rounded-xl flex flex-col justify-center" style={{ backgroundColor: '#20ff00' }}>
                <span className="text-[9px] font-mono text-zinc-500 uppercase" style={{ color: '#000000' }}>Confirmed</span>
                <span className="text-lg font-display font-bold text-emerald-400 mt-0.5" style={{ color: '#000000' }}>{stats.confirmed}</span>
              </div>
              <div className="bg-[#111319] border border-zinc-850 p-2 rounded-xl flex flex-col justify-center" style={{ backgroundColor: '#bcff00' }}>
                <span className="text-[9px] font-mono text-zinc-500 uppercase" style={{ color: '#000000' }}>Pending</span>
                <span className="text-lg font-display font-bold text-amber-500 mt-0.5" style={{ color: '#000000' }}>{stats.pending}</span>
              </div>
            </div>

            {/* ADD NEW GUEST COLLAPSIBLE BOX */}
            <div className="bg-[#111319] border border-zinc-850 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold uppercase font-display tracking-widest text-zinc-350 flex items-center gap-2 border-b border-zinc-900 pb-2">
                <UserPlus className="w-4 h-4 text-[#00ffcc]" />
                Register New Guest
              </h3>
              
              <form onSubmit={handleAddGuest} className="grid grid-cols-1 gap-3 text-left">
                {/* Guest name */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider font-bold">
                    GUEST NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full guest name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-sans"
                  />
                </div>

                {/* Additional head count & Access type */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider font-bold">
                      ADDITIONAL (+GUESTS)
                    </label>
                    <select
                      value={additionalCount}
                      onChange={(e) => setAdditionalCount(Number(e.target.value))}
                      className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-mono font-bold"
                    >
                      <option value={0}>No extra (+0)</option>
                      <option value={1}>Plus One (+1)</option>
                      <option value={2}>Plus Two (+2)</option>
                      <option value={3}>Plus Three (+3)</option>
                      <option value={4}>Plus Four (+4)</option>
                      <option value={5}>Plus Five (+5)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider font-bold">
                      ACCESS PERMISSION
                    </label>
                    <select
                      value={accessType}
                      onChange={(e) => setAccessType(e.target.value as any)}
                      className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-mono font-bold"
                    >
                      <option value="General">General (+1/2)</option>
                      <option value="VIP">VIP Access</option>
                      <option value="Crew">Crew Pass</option>
                      <option value="Media">Media/Press</option>
                    </select>
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider font-bold">
                      EMAIL ADDRESS (OPTIONAL)
                    </label>
                    <input
                      type="email"
                      placeholder="name@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider font-bold">
                      MOBILE PHONE (OPTIONAL)
                    </label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* Submit trigger button */}
                <button
                  type="submit"
                  className="w-full py-3 mt-1 text-center font-mono font-bold tracking-widest bg-[#00ffcc] text-black text-xs hover:bg-[#46ffda] rounded-xl transition-all cursor-pointer uppercase shadow-[0_0_15px_rgba(0,255,204,0.15)] active:scale-95"
                >
                  + Commit To Gig Door-List
                </button>
              </form>
            </div>

            {/* SECTOR SEARCH & LIST GUESTS */}
            <div className="bg-[#111319] border border-zinc-850 rounded-2xl p-4 space-y-3.5">
              <div className="flex justify-between items-center bg-transparent border-b border-zinc-900 pb-2.5">
                <span className="text-[10px] font-mono uppercase text-teal-400 font-bold tracking-wider">
                  DOOR VISITATION LIST ({filteredGuests.length})
                </span>
                
                {/* Visual indicator of total door lists */}
                <span className="text-[9px] font-mono text-zinc-500 uppercase">
                  capacity: {stats.totalCapacity} max
                </span>
              </div>

              {/* Search filter inline */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search guests by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#151922] border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-[#00ffcc] font-sans"
                />
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-550" />
              </div>

              {/* Guest representation */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {guestList.length === 0 ? (
                  <div className="p-5 text-left border-2 border-dashed border-zinc-800 bg-black/45 rounded-xl font-mono text-zinc-400 space-y-3">
                    <p className="text-[10px] uppercase font-bold text-[#8b5cf6]">● DOOR PROCEDURES: GUESTLIST OPERATIONS</p>
                    <ul className="space-y-2 text-[9.5px] leading-relaxed tracking-wide uppercase">
                      <li className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <span className="text-[#8b5cf6] font-bold">1.</span>
                        <span>Register guests with specific access types (VIP, Crew, Media) to manage venue door capacities.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <span className="text-[#8b5cf6] font-bold">2.</span>
                        <span>Issue digital entrance credentials directly to email or SMS via the built-in transmission controllers.</span>
                      </li>
                      <li className="flex items-start gap-2 text-zinc-500 hover:text-zinc-300 transition-colors">
                        <span className="text-[#8b5cf6] font-bold">3.</span>
                        <span>Verify door signature sign-offs and entry tallies instantly via real-time guestlist synchronization.</span>
                      </li>
                    </ul>
                  </div>
                ) : filteredGuests.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-550 font-mono italic">
                    No guests match filter criteria.
                  </div>
                ) : (
                  filteredGuests.map((g, gIdx) => (
                    <div 
                      key={`${g.id}-${gIdx}`}
                      className="bg-[#181d26] border border-[#2b3140] rounded-xl p-3 text-left relative flex justify-between items-center group"
                    >
                      <div className="space-y-1 pr-2 overflow-hidden flex-grow">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white font-sans tracking-wide truncate">
                            {g.name}
                          </h4>
                          {g.additional_count > 0 && (
                            <span className="text-[8.5px] font-mono font-bold bg-[#14232a] text-[#00ffcc] border border-[#0d594b]/40 rounded-full px-2 py-0.5">
                              +{g.additional_count} GUEST{g.additional_count > 1 ? 'S' : ''}
                            </span>
                          )}
                          <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-md font-extrabold uppercase shrink-0 ${
                            g.access_type === 'VIP' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40' :
                            g.access_type === 'Crew' ? 'bg-red-950/40 text-red-400 border border-red-900/40' :
                            g.access_type === 'Media' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' :
                            'bg-zinc-800/50 text-zinc-400 border border-zinc-700/30'
                          }`}>
                            {g.access_type || 'General'}
                          </span>
                        </div>
                        
                        {/* Optional Coordinates Details */}
                        {(g.email || g.phone || g.is_synced !== undefined) && (
                          <div className="flex flex-wrap gap-x-2 text-[9px] font-mono text-zinc-400 items-center mt-1">
                            {g.email && <span className="truncate max-w-[140px]">✉ {g.email}</span>}
                            {g.phone && <span>📱 {g.phone}</span>}
                            {g.is_synced === false ? (
                              <span className="text-[8px] font-mono font-bold text-amber-500 tracking-tight animate-pulse">[ ▰ OFFLINE CACHED ]</span>
                            ) : g.is_synced === true ? (
                              <span className="text-[8px] font-mono font-bold text-emerald-500/80 tracking-tight transition-all">[ ✓ SYNCED ]</span>
                            ) : null}
                          </div>
                        )}

                        {/* Confirmed Indicator */}
                        {g.confirmed_sent ? (
                          <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 font-bold bg-emerald-950/15 py-0.5 px-1.5 rounded w-fit border border-emerald-900/30">
                            <Check className="w-2.5 h-2.5" />
                            <span>Entry pass sent successfully ({g.confirmed_sent_via?.toUpperCase()})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[8px] font-mono text-amber-500 bg-amber-950/10 py-0.5 px-1.5 rounded w-fit border border-amber-900/20">
                            <span>Pending transmission receipt</span>
                          </div>
                        )}
                      </div>

                      {/* CTA Actions Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 pl-1">
                        {/* Transmission trigger Actions */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleOpenTransmit(g, 'email')}
                            className={`p-1 px-1.5 rounded border text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              g.confirmed_sent && g.confirmed_sent_via === 'email'
                                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                                : 'bg-[#151922] border-zinc-800 text-zinc-400 hover:border-[#00ffcc] hover:text-[#00ffcc]'
                            }`}
                            title="Send email confirmation pass"
                          >
                            <Mail className="w-3 h-3" />
                            Pass
                          </button>
                          <button
                            onClick={() => handleOpenTransmit(g, 'sms')}
                            className={`p-1 px-1.5 rounded border text-[9px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                              g.confirmed_sent && g.confirmed_sent_via === 'sms'
                                ? 'bg-emerald-900/30 border-emerald-700/50 text-emerald-400'
                                : 'bg-[#151922] border-zinc-800 text-zinc-400 hover:border-[#00ffcc] hover:text-[#00ffcc]'
                            }`}
                            title="Send text message confirmation pass"
                          >
                            <Phone className="w-3 h-3" />
                            SMS
                          </button>
                        </div>

                        {/* Delete action */}
                        <button
                          onClick={() => handleDeleteGuest(g.id, g.name)}
                          className="p-2 justify-center items-center rounded-lg hover:bg-red-950/40 text-zinc-550 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete guest list record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-20 text-center text-xs text-zinc-500 font-mono">
            No active schedules selected. Create a show scheduling record first.
          </div>
        )}
      </div>

      {/* DISPATCH / TRANSMIT ENTRY PASS MODAL */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#11131a] border-2 border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col relative text-left p-5 space-y-4">
            
            {/* Modal header dismiss */}
            <div className="flex justify-between items-center bg-transparent border-b border-zinc-900 pb-2.5">
              <span className="text-[10.5px] font-mono text-[#00ffcc] font-black tracking-widest uppercase flex items-center gap-1.5">
                <Ticket className="w-4 h-4" />
                TRANSMIT ACCESS PASS
              </span>
              <button 
                onClick={() => setSelectedGuest(null)}
                className="p-1 rounded bg-[#1e2330] text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* NEON ENTRY PASS GRAPHIC CARD */}
            <div className="bg-[#0c0e12] border border-[#2e3545] rounded-2xl p-4.5 space-y-4 relative overflow-hidden flex flex-col items-center text-center shadow-inner select-none">
              {/* Pass background glow elements */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-[#00ffcc] to-purple-600" />
              
              <div className="w-full flex justify-between items-center text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                <span>OFFICIAL ACCESS PASS</span>
                <span>{bandName.toUpperCase()} 2026</span>
              </div>

              {/* QR-CODE SCAN BOX */}
              <div className="bg-[#151923] p-4 rounded-xl border border-teal-500/20 shadow-md flex flex-col items-center justify-center relative space-y-2 mt-1">
                <div className="relative w-24 h-24 bg-white/95 rounded-lg border border-zinc-800 p-1 flex items-center justify-center">
                  <QrCode className="w-full h-full text-black stroke-[1.5]" />
                  {/* Glowing active scanning bar simulation */}
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce" style={{ top: '20%' }} />
                </div>
                <span className="text-[8px] font-mono text-zinc-450 uppercase tracking-widest block font-bold animate-pulse">
                  NEON SCAN AUTHORIZED
                </span>
              </div>

              {/* TICKET GUEST METADATA DETAILS */}
              <div className="w-full space-y-3 pt-1">
                <div>
                  <h4 className="text-sm font-black uppercase text-white tracking-wide">{selectedGuest.name}</h4>
                  <span className="text-[9px] font-mono text-[#00ffcc] uppercase tracking-widest bg-[#152327] border border-[#006e57]/40 py-0.5 px-2.5 rounded-full inline-block mt-0.5 font-bold">
                    {selectedGuest.access_type || 'General'} ACCESS {selectedGuest.additional_count > 0 ? `+ ${selectedGuest.additional_count} GUEST${selectedGuest.additional_count > 1 ? 'S' : ''}` : ''}
                  </span>
                </div>

                <div className="border-t border-dashed border-zinc-800 pt-3 flex justify-between text-left">
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">VENUE</span>
                    <span className="text-[10px] font-sans font-bold text-zinc-250 truncate block max-w-[150px]">
                      {activeShow.festival_name || activeShow.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">GIG DATE</span>
                    <span className="text-[10px] font-mono font-bold text-[#00ffcc]">
                      {activeShow.date}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-left">
                  <div>
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">DOORS</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-300">
                      {activeShow.doors_time || '19:00'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">SET-TIME</span>
                    <span className="text-[10px] font-mono font-bold text-zinc-300">
                      {activeShow.set_time || '21:30'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* NOTIFICATION FEEDBACK ZONE IN MODAL */}
            {isTransmitting ? (
              <div className="bg-[#141b25] border border-[#232f3f] rounded-2xl p-4.5 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-7 h-7 rounded-full border-2 border-t-[#00ffcc] border-zinc-850 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-mono font-bold text-white uppercase tracking-widest">TRANSMITTING TICKETS PASS</p>
                  <p className="text-[9px] font-mono text-zinc-500 mt-1">Encrypting keycode, synthesizing QR-pass...</p>
                </div>
              </div>
            ) : transmitSuccess ? (
              <div className="bg-[#122521] border border-emerald-900/40 rounded-2xl p-4.5 flex flex-col items-center justify-center text-center space-y-2 animate-fadeIn">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-white uppercase tracking-widest">TRANSMISSION SUCCESSFUL!</h4>
                  <p className="text-[9.5px] text-zinc-400 mt-1">
                    Pass forwarded to <span className="font-mono text-[#00ffcc] font-bold">{transmitMedium === 'email' ? testEmail : testPhone}</span>.
                  </p>
                  <p className="text-[9px] text-[#00ffcc] mt-1 font-mono italic">
                    They can safely show this pass at the gate.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGuest(null)}
                  className="w-full mt-2 py-2 font-mono text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                    This triggers a simulated secure notification pass (with QR auth passcodes) designed for seamless and instant door credentials entry.
                  </p>
                </div>

                {/* Transmit dispatch parameters form */}
                {transmitMedium === 'email' ? (
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider block">
                      EMAIL RECIPIENT
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-mono"
                      placeholder="guest-recipient@site.com"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono text-[#00ffcc] font-bold uppercase tracking-wider block">
                      SMS MOBILE NUMBER
                    </label>
                    <input
                      type="tel"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="w-full bg-[#181d26] border border-zinc-800 text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#00ffcc] font-mono"
                      placeholder="+1 (555) 012-9430"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={triggerTransmit}
                  className="w-full py-3 mt-1.5 text-center font-mono font-bold tracking-widest bg-gradient-to-r from-teal-500 to-[#00ffcc] text-black text-xs hover:to-[#5cffd9] rounded-xl transition-all cursor-pointer uppercase shadow-md active:scale-95"
                >
                  Confirm & Dispatch Entry Pass
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}

    </div>
  );
}
