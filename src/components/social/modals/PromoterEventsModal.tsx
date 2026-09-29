import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket, 
  Search, 
  Flame, 
  Sparkles, 
  Plus, 
  Check, 
  Share2, 
  ExternalLink,
  Music,
  Users,
  Building,
  AlertCircle,
  CalendarPlus,
  Bell,
  Download
} from 'lucide-react';

export interface PromoterEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterProfile: any;
  userProfile?: any;
  shows?: any[];
  triggerNotification?: (msg: string) => void;
  openCheckout?: (itemType: string, details?: any) => void;
  onSelectEvent?: (event: any) => void;
}

export interface PromoterEventItem {
  id: string;
  title: string;
  type: 'festival' | 'tour' | 'club_gig' | 'showcase';
  date: string;
  dateRaw?: string;
  venue: string;
  city: string;
  lineup: string[];
  doorsTime?: string;
  setTime?: string;
  price?: string;
  ticketStatus: 'on_sale' | 'selling_fast' | 'presale' | 'sold_out';
  ticketUrl?: string;
  description?: string;
  bannerUrl?: string;
  isFeatured?: boolean;
}

// Default upcoming anchor events are empty so non-real mock events are removed
const DEFAULT_NEXUS_UPCOMING_EVENTS: PromoterEventItem[] = [];

export const PromoterEventsModal: React.FC<PromoterEventsModalProps> = ({
  isOpen,
  onClose,
  promoterProfile,
  userProfile,
  shows = [],
  triggerNotification,
  openCheckout,
  onSelectEvent
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Event Form State (for promoter self)
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventVenue, setNewEventVenue] = useState(
    Array.isArray(promoterProfile?.active_venues) && promoterProfile.active_venues.length > 0 
      ? promoterProfile.active_venues[0] 
      : 'Live Venue'
  );
  const [newEventCity, setNewEventCity] = useState(promoterProfile?.location || 'Chicago, IL');
  const [newLineupText, setNewLineupText] = useState('');
  const [newEventType, setNewEventType] = useState<'festival' | 'tour' | 'club_gig'>('festival');
  const [newEventPrice, setNewEventPrice] = useState('$25.00');
  const [localCustomEvents, setLocalCustomEvents] = useState<PromoterEventItem[]>([]);

  // RSVP'd Shows State (stored in localStorage)
  const [rsvpedShowIds, setRsvpedShowIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_rsvped_shows');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Reminders Set State
  const [remindedShowIds, setRemindedShowIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('nexus_show_reminders');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Load custom stored promoter events
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexus_promoter_custom_events');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setLocalCustomEvents(parsed);
        }
      }
    } catch (_) {}
  }, []);

  if (!isOpen) return null;

  const promoterName = promoterProfile?.entity_name || promoterProfile?.corporate_name || promoterProfile?.band_name || promoterProfile?.name || 'Live Calendar';
  const promoterAvatar = promoterProfile?.promoter_logo || promoterProfile?.avatar_url || promoterProfile?.avatar || '';
  const isOwner = Boolean(
    promoterProfile?.isYou || 
    (userProfile?.id && (promoterProfile?.user_id === userProfile?.id || promoterProfile?.id === userProfile?.id)) ||
    (userProfile?.email && promoterProfile?.email === userProfile?.email)
  );

  // Consolidate shows from Supabase and defaults
  const allEvents: PromoterEventItem[] = [
    ...localCustomEvents,
    ...DEFAULT_NEXUS_UPCOMING_EVENTS,
    // Map any active live shows from DB
    ...(shows || []).filter(s => {
      if (s.is_published === false || s.publication_status === 'embargoed_private' || s.publication_status === 'draft' || s.status === 'Draft' || s.status === 'Embargoed') {
        return false;
      }
      return true;
    }).map(s => {
      const lineupArray = Array.isArray(s.lineup)
        ? s.lineup
        : (s.lineup ? String(s.lineup).split(',').map((x: string) => x.trim()) : [s.headliner || s.name].filter(Boolean));

      return {
        id: String(s.id || Math.random().toString(36).substring(2, 9)),
        title: s.festival_name || s.tour_name || s.name || s.title || 'Upcoming Live Show',
        type: (s.festival_name ? 'festival' : (s.tour_name ? 'tour' : 'club_gig')) as any,
        date: s.date || s.show_date || 'TBA',
        dateRaw: s.date || s.show_date,
        venue: s.venue_address || s.venue_name || s.venue || 'Underground Venue',
        city: s.city ? (s.state_province ? `${s.city}, ${s.state_province}` : s.city) : 'Chicago, IL',
        lineup: lineupArray,
        doorsTime: s.doors_time || '7:00 PM',
        setTime: s.set_time || '8:00 PM',
        price: s.price ? (String(s.price).startsWith('$') ? String(s.price) : `$${s.price}`) : '$25.00',
        ticketStatus: (s.ticket_status || 'on_sale') as any,
        ticketUrl: s.ticket_url || s.ticket_link,
        description: s.additional_notes || s.description || 'Confirmed live extreme metal show.'
      };
    })
  ];

  // Deduplicate by title + date
  const seenKeys = new Set<string>();
  const deduplicatedEvents = allEvents.filter(ev => {
    const key = `${ev.title.toLowerCase().trim()}_${ev.date.toLowerCase().trim()}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Toggle RSVP for a show
  const toggleRsvp = (event: PromoterEventItem) => {
    setRsvpedShowIds(prev => {
      const next = new Set(prev);
      const isRsvped = next.has(event.id);
      if (isRsvped) {
        next.delete(event.id);
        triggerNotification?.(`Cancelled RSVP for "${event.title}"`);
      } else {
        next.add(event.id);
        triggerNotification?.(`🔥 RSVP Confirmed! Added "${event.title}" to your Pit List.`);
        
        // Dispatch global event for Sonic XP & timeline feeds
        try {
          window.dispatchEvent(new CustomEvent('nexus_show_rsvped', {
            detail: { showId: event.id, title: event.title }
          }));
        } catch (_) {}
      }
      try {
        localStorage.setItem('nexus_rsvped_shows', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  // Toggle Reminder
  const toggleReminder = (event: PromoterEventItem) => {
    setRemindedShowIds(prev => {
      const next = new Set(prev);
      const isReminded = next.has(event.id);
      if (isReminded) {
        next.delete(event.id);
        triggerNotification?.(`⏰ Reminder removed for "${event.title}"`);
      } else {
        next.add(event.id);
        triggerNotification?.(`⏰ Show reminder scheduled for "${event.title}"!`);
      }
      try {
        localStorage.setItem('nexus_show_reminders', JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });
  };

  // Add to Google Calendar / Apple Calendar
  const handleAddToCalendar = (event: PromoterEventItem) => {
    const rawDateStr = event.dateRaw || event.date || '';
    let startIso = rawDateStr.replace(/[^0-9]/g, '').slice(0, 8);
    if (startIso.length < 8) {
      const now = new Date();
      startIso = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }

    const title = encodeURIComponent(event.title);
    const location = encodeURIComponent(`${event.venue}, ${event.city}`);
    const details = encodeURIComponent(
      `${event.description || 'Live Show'}\n\nLineup: ${event.lineup?.join(', ')}\nDoors: ${event.doorsTime || '6:00 PM'}\nTickets: ${event.price || 'GA'}`
    );

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}T200000Z/${startIso}T235900Z&details=${details}&location=${location}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
    triggerNotification?.(`📅 Opening Calendar export for "${event.title}"...`);
  };

  // Download .ics file
  const handleDownloadIcs = (event: PromoterEventItem) => {
    const rawDateStr = event.dateRaw || event.date || '';
    let startIso = rawDateStr.replace(/[^0-9]/g, '').slice(0, 8);
    if (startIso.length < 8) {
      const now = new Date();
      startIso = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexus Extreme Metal//Live Shows Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}-${Date.now()}@nexuslive.app`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startIso}T200000Z`,
      `DTEND:${startIso}T235900Z`,
      `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}\\nLineup: ${(event.lineup || []).join(', ')}`,
      `LOCATION:${event.venue.replace(/,/g, '\\,')}\\, ${event.city.replace(/,/g, '\\,')}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerNotification?.(`📅 Downloaded "${event.title}.ics" calendar invite!`);
  };

  const myRsvpCount = deduplicatedEvents.filter(ev => rsvpedShowIds.has(ev.id)).length;

  const filteredEvents = deduplicatedEvents.filter(ev => {
    if (filterType === 'rsvps') {
      return rsvpedShowIds.has(ev.id);
    }
    if (filterType !== 'all') {
      if (filterType === 'festival' && ev.type !== 'festival') return false;
      if (filterType === 'tour' && ev.type !== 'tour') return false;
      if (filterType === 'club_gig' && ev.type !== 'club_gig' && ev.type !== 'showcase') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchVenue = ev.venue.toLowerCase().includes(q);
      const matchCity = ev.city.toLowerCase().includes(q);
      const matchLineup = ev.lineup.some(b => b.toLowerCase().includes(q));
      if (!matchTitle && !matchVenue && !matchCity && !matchLineup) return false;
    }
    return true;
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate.trim()) {
      triggerNotification?.('⚠️ Please provide an event title and date.');
      return;
    }

    const created: PromoterEventItem = {
      id: `ev_${Date.now()}`,
      title: newEventTitle.trim(),
      type: newEventType,
      date: newEventDate.trim(),
      dateRaw: newEventDate.trim(),
      venue: newEventVenue.trim(),
      city: newEventCity.trim(),
      lineup: newLineupText.split(',').map(s => s.trim()).filter(Boolean),
      doorsTime: '6:30 PM',
      setTime: '7:00 PM',
      price: newEventPrice.trim() || '$25.00',
      ticketStatus: 'on_sale',
      description: `Official event announced by ${promoterName}.`
    };

    const updated = [created, ...localCustomEvents];
    setLocalCustomEvents(updated);
    try {
      localStorage.setItem('nexus_promoter_custom_events', JSON.stringify(updated));
    } catch (_) {}

    triggerNotification?.(`⚡ Created upcoming event: ${created.title}!`);
    setShowAddForm(false);
    setNewEventTitle('');
    setNewLineupText('');
  };

  return (
    <div 
      className="fixed inset-0 z-[10000000] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-zinc-950 border border-yellow-500/40 rounded-2xl shadow-[0_0_40px_rgba(234,179,8,0.2)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Accent Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {promoterAvatar ? (
              <img 
                src={promoterAvatar} 
                alt={promoterName} 
                className="w-12 h-12 rounded-xl object-cover border border-yellow-500/50 shadow-md shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono truncate">
                  {promoterName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  ⚡ UPCOMING SHOWS & LIVE CALENDAR
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                Confirmed gigs, festival dates, personal RSVP tracking & calendar reminders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black rounded-lg uppercase font-mono flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Event</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Events"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Owner Add Event Drawer */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateEvent}
              className="border-b border-yellow-500/30 bg-zinc-900/90 p-4 sm:p-5 space-y-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Fast Event Publishing
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Event / Festival Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Underground Metal Showcase"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Date</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NOV 28, 2026"
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Live Music Club"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Chicago, IL"
                    value={newEventCity}
                    onChange={(e) => setNewEventCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Ticket Price</label>
                  <input
                    type="text"
                    placeholder="e.g. $25 Advance / $30 Door"
                    value={newEventPrice}
                    onChange={(e) => setNewEventPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1">Lineup Bands (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Headliner Band, Support 1, Support 2"
                  value={newLineupText}
                  onChange={(e) => setNewLineupText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex gap-2">
                  {(['festival', 'tour', 'club_gig'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewEventType(t)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                        newEventType === t 
                          ? 'bg-yellow-500 text-black' 
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black uppercase font-mono rounded-lg transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Publish to Live Events
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Controls: Filter Pills & Search */}
        <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {[
              { id: 'all', label: 'All Upcoming' },
              { id: 'rsvps', label: `🔥 My RSVPs (${myRsvpCount})` },
              { id: 'festival', label: 'Festivals' },
              { id: 'tour', label: 'Tours' },
              { id: 'club_gig', label: 'Club Gigs' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterType(pill.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
                  filterType === pill.id
                    ? 'bg-yellow-500 text-black font-black shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search band, festival, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Events Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-16 space-y-3 bg-zinc-900/30 rounded-2xl border border-zinc-850 p-6">
              <Calendar className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
              <h3 className="text-sm font-mono font-black text-zinc-300 uppercase tracking-wider">
                {filterType === 'rsvps' ? 'No RSVPs Yet' : 'No upcoming shows currently scheduled'}
              </h3>
              <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
                {filterType === 'rsvps'
                  ? "You haven't RSVP'd to any shows yet. Click the 'RSVP / Pit List' flame icon on any event to build your personal live calendar and set reminders."
                  : "Confirmed tour dates and festival appearances will automatically appear here once published."}
              </p>
              {isOwner && filterType !== 'rsvps' && (
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase font-mono rounded-xl inline-flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Announce First Show
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isFest = event.type === 'festival';
              const isTour = event.type === 'tour';
              const isRsvped = rsvpedShowIds.has(event.id);
              const isReminded = remindedShowIds.has(event.id);

              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent?.(event)}
                  className={`group bg-zinc-900/60 hover:bg-zinc-900 border ${
                    isRsvped ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : 'border-zinc-800 hover:border-yellow-500/50'
                  } rounded-xl p-4 transition-all duration-200 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Date Block */}
                    <div className="shrink-0 w-20 text-center bg-zinc-950 border border-zinc-800 group-hover:border-yellow-500/30 rounded-xl p-2.5 shadow-inner">
                      <div className="text-[10px] font-mono uppercase font-bold text-yellow-400">
                        {event.date.split(' ')[0] || 'DATE'}
                      </div>
                      <div className="text-lg font-black text-white font-mono leading-none mt-1">
                        {event.date.split(' ')[1]?.replace(',', '') || '—'}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 mt-1">
                        {event.date.includes('202') ? event.date.slice(-4) : (event.dateRaw ? event.dateRaw.slice(0, 4) : '2026')}
                      </div>
                    </div>

                    {/* Main Details */}
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono tracking-wider ${
                          isFest 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isTour
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isFest ? 'FESTIVAL' : isTour ? 'TOUR STOP' : 'CLUB GIG'}
                        </span>

                        {isRsvped && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                            <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                            RSVP Confirmed
                          </span>
                        )}

                        <span className="text-[10px] font-mono text-zinc-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" /> Doors {event.doorsTime || '6:00 PM'}
                        </span>

                        <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          event.ticketStatus === 'selling_fast'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {event.ticketStatus.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono mt-1.5 group-hover:text-yellow-400 transition-colors">
                        {event.title}
                      </h3>

                      <div className="text-xs text-zinc-300 font-mono mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                        <span className="font-bold text-white">{event.venue}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-zinc-400">{event.city}</span>
                      </div>

                      {/* Lineup Tags */}
                      {event.lineup && event.lineup.length > 0 && (
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold flex items-center gap-1">
                            <Music className="w-3 h-3 text-yellow-500/70" /> Lineup:
                          </span>
                          {event.lineup.map((band, idx) => (
                            <span 
                              key={`${event.id}-band-${idx}`}
                              className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-[10px] font-mono font-semibold"
                            >
                              {band}
                            </span>
                          ))}
                        </div>
                      )}

                      {event.description && (
                        <p className="text-[11px] text-zinc-400 font-mono mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      {/* Calendar & Reminder Quick-Actions */}
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        {/* RSVP Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRsvp(event);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-black uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                            isRsvped
                              ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-950/40'
                              : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-amber-500/40'
                          }`}
                        >
                          <Flame className={`w-3.5 h-3.5 ${isRsvped ? 'fill-black text-black' : 'text-amber-400'}`} />
                          <span>{isRsvped ? 'In Pit (RSVP’d)' : 'RSVP to Show'}</span>
                        </button>

                        {/* Add to Google Calendar */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCalendar(event);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 cursor-pointer"
                          title="Add event to Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Google Cal</span>
                        </button>

                        {/* Download .ICS File */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadIcs(event);
                          }}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 flex items-center gap-1 cursor-pointer"
                          title="Download .ICS file for Apple/Outlook Calendar"
                        >
                          <Download className="w-3.5 h-3.5 text-zinc-400" />
                          <span>.ICS</span>
                        </button>

                        {/* Set Reminder */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleReminder(event);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer border ${
                            isReminded
                              ? 'bg-purple-950/80 text-purple-300 border-purple-500/60'
                              : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border-zinc-800'
                          }`}
                          title="Set show reminder"
                        >
                          <Bell className={`w-3.5 h-3.5 ${isReminded ? 'fill-purple-400 text-purple-400' : 'text-zinc-400'}`} />
                          <span>{isReminded ? 'Reminder Set' : 'Remind Me'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Ticket CTA */}
                  <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-mono text-zinc-400">Tickets From</div>
                      <div className="text-sm sm:text-base font-black text-yellow-400 font-mono">
                        {event.price || '$25.00'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (openCheckout) {
                          openCheckout('ticket', {
                            name: event.title,
                            venue: event.venue,
                            date: event.date,
                            price: parseFloat((event.price || '25').replace(/[^0-9.]/g, '')) || 25
                          });
                        }
                        triggerNotification?.(`🎟️ Adding pass for "${event.title}" to secure checkout...`);
                      }}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-black font-black text-xs uppercase font-mono rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.25)] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Get Passes</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-zinc-500 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Showing {filteredEvents.length} {filterType === 'rsvps' ? 'RSVP’d' : 'confirmed'} live dates</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-xs transition-colors cursor-pointer"
          >
            Close View
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PromoterEventsModal;
