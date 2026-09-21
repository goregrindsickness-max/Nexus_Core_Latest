import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Calendar, Ticket, Music, Navigation, Filter, ExternalLink, ShieldCheck } from 'lucide-react';

interface GigMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMapEvent: any;
  setSelectedMapEvent: (evt: any) => void;
  selectedCityFilter: string;
  setSelectedCityFilter: (city: string) => void;
  mapFilterGenre: string;
  setMapFilterGenre: (genre: string) => void;
  userProfile: any;
  triggerNotification?: (msg: string) => void;
  liveEvents?: any[];
}

export const GigMapModal: React.FC<GigMapModalProps> = ({
  isOpen,
  onClose,
  selectedMapEvent,
  setSelectedMapEvent,
  selectedCityFilter,
  setSelectedCityFilter,
  mapFilterGenre,
  setMapFilterGenre,
  userProfile,
  triggerNotification,
  liveEvents,
}) => {
  const MOCK_MAP_EVENTS = [
    {
      id: 'evt_1',
      title: 'Devourment + Mortician (Live at Reggies)',
      venue: 'Reggies Rock Club',
      city: 'Chicago, IL',
      date: 'Tonight • 8:00 PM',
      price: '$35',
      lat: 41.85,
      lng: -87.62,
      genre: 'Death Metal / Grind',
      headliner: 'Devourment',
      support: ['Mortician', 'Sanguisugabogg'],
      verified: true,
      ticketUrl: 'https://reggieschicago.com',
    },
    {
      id: 'evt_2',
      title: 'Immolation (Close to a World Below Anniv)',
      venue: 'The Metro',
      city: 'Chicago, IL',
      date: 'Tomorrow • 7:30 PM',
      price: '$42',
      lat: 41.94,
      lng: -87.65,
      genre: 'Death Metal',
      headliner: 'Immolation',
      support: ['Incantation', 'Fulci'],
      verified: true,
      ticketUrl: 'https://metrochicago.com',
    },
    {
      id: 'evt_3',
      title: 'Underground DIY Noise Fest III',
      venue: 'Subterranean',
      city: 'Chicago, IL',
      date: 'Sat Jul 29 • 6:00 PM',
      price: '$20',
      lat: 41.91,
      lng: -87.67,
      genre: 'Hardcore / Punk',
      headliner: 'Jesus Piece',
      support: ['Kubbik', 'Jarhead Fertilizer'],
      verified: false,
      ticketUrl: '',
    },
    {
      id: 'evt_4',
      title: 'Cannibal Corpse World Tour',
      venue: 'Brooklyn Steel',
      city: 'New York, NY',
      date: 'Fri Aug 04 • 8:00 PM',
      price: '$45',
      lat: 40.71,
      lng: -73.93,
      genre: 'Death Metal',
      headliner: 'Cannibal Corpse',
      support: ['Mayhem', 'Gorguts'],
      verified: true,
      ticketUrl: 'https://bowerypresents.com',
    },
  ];

  const baseEvents = (liveEvents && liveEvents.length > 0) ? liveEvents : MOCK_MAP_EVENTS;

  const normalizedEvents = baseEvents.map((evt: any, idx: number) => ({
    ...evt,
    id: evt.id || `gig-${idx}`,
    title: evt.title || (evt.headliner ? `${evt.headliner} at ${evt.venue || 'Venue'}` : (evt.name || 'Live Show')),
    venue: evt.venue || evt.venue_name || 'Underground Venue',
    city: evt.city || 'Chicago, IL',
    date: evt.date || 'Tonight',
    price: evt.price || '$20',
    genre: evt.genre || (evt.micro_genres ? evt.micro_genres.join(' / ') : 'Extreme Metal'),
    headliner: evt.headliner || evt.name || 'Live Band',
    support: evt.support || evt.lineup || [],
    verified: !!evt.verified || !!evt.is_community_submitted,
    ticketUrl: evt.ticket_url || evt.external_ticket_url || evt.ticketUrl || ''
  }));

  const uniqueCities = Array.from(new Set(normalizedEvents.map((e: any) => e.city).filter(Boolean)));

  const filteredEvents = normalizedEvents.filter((evt: any) => {
    if (selectedCityFilter !== 'all' && !evt.city.toLowerCase().includes(selectedCityFilter.toLowerCase())) return false;
    if (mapFilterGenre !== 'all' && !evt.genre.toLowerCase().includes(mapFilterGenre.toLowerCase())) return false;
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xl animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="bg-[#0b0c0f] border border-cyan-900/40 rounded-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(6,182,212,0.15)]"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-black/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-cyan-400 animate-bounce" />
                <div>
                  <h2 className="text-white font-black uppercase text-sm tracking-widest font-mono flex items-center gap-2">
                    Live Gig & Event Map Radar
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    Geolocated concert radar • Ticket claims & promoter listings
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <select 
                  value={selectedCityFilter}
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Cities ({normalizedEvents.length})</option>
                  {uniqueCities.map((city: any, cIdx: number) => (
                    <option key={`city-opt-${cIdx}`} value={city}>{city}</option>
                  ))}
                </select>

                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Map body + sidebar */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
              {/* Simulated Map Visual Canvas */}
              <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center p-4">
                {/* Dark Grid Background Effect */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#06b6d4 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                {/* Concentric Radar Rings */}
                <div className="absolute w-[400px] h-[400px] rounded-full border border-cyan-500/10 animate-ping pointer-events-none" />
                <div className="absolute w-[280px] h-[280px] rounded-full border border-cyan-500/20 pointer-events-none" />

                {/* Radar sweep */}
                <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent animate-spin duration-10000 pointer-events-none" />

                {/* Interactive Event Pins on Map */}
                <div className="relative w-full h-full max-w-lg max-h-[400px] border border-zinc-900 rounded-2xl bg-black/40 backdrop-blur-sm p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1"><Navigation className="w-3 h-3 text-cyan-400" /> GPS RADAR: ACTIVE</span>
                    <span>SHOWING {filteredEvents.length} NEARBY EVENTS</span>
                  </div>

                   {/* Pins layout */}
                  <div className="relative flex-1 my-4 flex items-center justify-center flex-wrap gap-4 overflow-y-auto p-2 max-h-[320px]">
                    {filteredEvents.map((evt, idx) => {
                      const isSelected = selectedMapEvent?.id === evt.id;
                      return (
                        <motion.button
                          key={evt.id ? `gig-evt-${evt.id}-${idx}` : `gig-evt-${idx}`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedMapEvent(evt)}
                          className={`relative group cursor-pointer flex flex-col items-center max-w-[130px]`}
                        >
                          <div className={`p-2.5 rounded-full border shadow-xl transition-all ${
                            isSelected 
                              ? 'bg-cyan-500 text-black border-white shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-125 z-20' 
                              : 'bg-zinc-900 text-cyan-400 border-cyan-500/40 hover:border-cyan-400 hover:bg-zinc-800'
                          }`}>
                            <Music className="w-4 h-4" />
                          </div>
                          
                          <span className={`mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-bold truncate max-w-full shadow-md ${
                            isSelected 
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/50' 
                              : 'bg-black/80 text-zinc-400 border border-zinc-800 group-hover:text-white'
                          }`} title={evt.venue}>
                            {evt.venue}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="text-[9px] font-mono text-zinc-600 text-center">
                    Select a pin to view show details, line-up & ticket access
                  </div>
                </div>
              </div>

              {/* Event detail drawer */}
              <div className="w-full md:w-80 bg-[#07080a] border-t md:border-t-0 md:border-l border-zinc-900 p-4 flex flex-col justify-between overflow-y-auto">
                {selectedMapEvent ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-mono uppercase tracking-wider font-bold mb-1">
                        {selectedMapEvent.verified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{selectedMapEvent.genre}</span>
                      </div>
                      <h3 className="text-sm font-black text-white font-mono leading-snug">
                        {selectedMapEvent.title}
                      </h3>
                    </div>

                    <div className="space-y-2 bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-xs font-mono">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>{selectedMapEvent.venue} ({selectedMapEvent.city})</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{selectedMapEvent.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Ticket className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Door Price: <strong className="text-emerald-400">{selectedMapEvent.price}</strong></span>
                      </div>
                    </div>

                    {selectedMapEvent.support && selectedMapEvent.support.length > 0 && (
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold block mb-1">Supporting Acts</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedMapEvent.support.map((act: string, i: number) => (
                            <span key={`gig-act-${act}-${i}`} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-zinc-800">
                              {act}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 space-y-2">
                      <button 
                        onClick={() => {
                          triggerNotification?.(`🎟️ Reserved presale pass for ${selectedMapEvent.title}!`);
                        }}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono uppercase font-black text-xs py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" /> Claim Presale Pass
                      </button>

                      {selectedMapEvent.ticketUrl && (
                        <a 
                          href={selectedMapEvent.ticketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono uppercase font-bold text-[10px] py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-zinc-800"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Venue Website
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2">
                    <MapPin className="w-8 h-8 text-zinc-700" />
                    <p className="text-xs font-mono text-zinc-500">Select an event pin on the radar canvas to view venue details and tickets.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
