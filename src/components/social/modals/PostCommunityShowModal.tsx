import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, MapPin, Clock, Ticket, Upload, Plus, Trash2, 
  Check, ZoomIn, Layers, Music, ExternalLink 
} from 'lucide-react';
import { showsStore, venuesStore } from '../../../utils/indexedDB';
import { getSupabase } from '../../../services/clientService';
import { compressImageInSocialFeed } from '../../../utils/socialFeedUtils';

export interface PostCommunityShowModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit?: (showData: any) => void;
  triggerNotification?: (msg: string) => void;
  initialData?: any;
}

export interface TourStopItem {
  id: string;
  show_date: string;
  city: string;
  state: string;
  venue_name: string;
  doors_time?: string;
  set_time?: string;
  ticket_url?: string;
}

export function PostCommunityShowModal({
  isOpen = true,
  onClose,
  onSubmit,
  triggerNotification,
  initialData
}: PostCommunityShowModalProps) {
  // Tab selector: 'single' (Default) | 'tour' (Batch Multi-Date Tour)
  const [activeTab, setActiveTab] = useState<'single' | 'tour'>('single');

  // Single Show State
  const [headliner, setHeadliner] = useState(initialData?.headliner || initialData?.name || '');
  const [tourName, setTourName] = useState(initialData?.tour_name || initialData?.festival_name || '');
  const [showDate, setShowDate] = useState(initialData?.show_date || initialData?.date || '');
  const [doorsTime, setDoorsTime] = useState(initialData?.doors_time || '19:00');
  const [setTime, setSetTime] = useState(initialData?.set_time || '20:00');
  const [price, setPrice] = useState(initialData?.price || initialData?.day_of_show_price || '');
  const [presalePrice, setPresalePrice] = useState(initialData?.presale_price || '');
  const [ageRestriction, setAgeRestriction] = useState(initialData?.age_restriction || 'All Ages');
  const [safetyCode, setSafetyCode] = useState(initialData?.safety_code || '');
  const [venueName, setVenueName] = useState(initialData?.venue_name || initialData?.venue || '');
  const [streetAddress, setStreetAddress] = useState(initialData?.street_address || initialData?.venue_address || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || initialData?.state_province || '');
  const [country, setCountry] = useState(initialData?.country || 'United States');
  const [capacity, setCapacity] = useState(initialData?.venue_capacity || initialData?.capacity || '');
  const [ticketUrl, setTicketUrl] = useState(initialData?.ticket_url || initialData?.external_ticket_url || '');
  const [flyerUrl, setFlyerUrl] = useState(initialData?.flyer_url || '');
  const [venueSource, setVenueSource] = useState<'matched-blackbook' | 'auto-stubbed' | null>(null);

  const [supportBands, setSupportBands] = useState<string[]>(
    (initialData?.support_lineup?.map((b: any) => typeof b === 'string' ? b : b.band_name || b.name) || 
     initialData?.supportBands || 
     (typeof initialData?.support_bands === 'string' ? initialData.support_bands.split(',').map((s: string) => s.trim()).filter(Boolean) : [])) as string[]
  );
  const [newBandInput, setNewBandInput] = useState('');
  const [isDraggingSingleFlyer, setIsDraggingSingleFlyer] = useState(false);

  // Tour Dates Tab State
  const [tourHeadliner, setTourHeadliner] = useState(initialData?.headliner || '');
  const [tourSupportBands, setTourSupportBands] = useState<string[]>(supportBands);
  const [newTourSupportInput, setNewTourSupportInput] = useState('');
  const [tourPackageName, setTourPackageName] = useState(initialData?.tour_name || '');
  const [tourFlyerUrl, setTourFlyerUrl] = useState(initialData?.flyer_url || '');
  const [tourStops, setTourStops] = useState<TourStopItem[]>([]);
  const [isDraggingTourFlyer, setIsDraggingTourFlyer] = useState(false);
  const [isPosterZoomModalOpen, setIsPosterZoomModalOpen] = useState(false);

  // Inline Stop Add State
  const [stopDate, setStopDate] = useState('');
  const [stopCity, setStopCity] = useState('');
  const [stopState, setStopState] = useState('');
  const [stopVenue, setStopVenue] = useState('');
  const [stopDoorsTime, setStopDoorsTime] = useState('19:00');
  const [stopTicketUrl, setStopTicketUrl] = useState('');
  const [isBatchCreating, setIsBatchCreating] = useState(false);

  const singleFlyerInputRef = useRef<HTMLInputElement>(null);
  const tourFlyerInputRef = useRef<HTMLInputElement>(null);

  // Black Book Venue Matching
  useEffect(() => {
    if (!venueName.trim()) {
      setVenueSource(null);
      return;
    }
    const checkVenues = async () => {
      try {
        const stored = await venuesStore.getItem<any>('nexus_master_venues');
        let venueList: any[] = [];
        if (stored) {
          venueList = typeof stored === 'string' ? JSON.parse(stored) : stored;
        }
        const matched = venueList.find((v: any) => 
          v.name?.toLowerCase().trim() === venueName.toLowerCase().trim() ||
          (v.city?.toLowerCase().trim() === city.toLowerCase().trim() && v.name?.toLowerCase().includes(venueName.toLowerCase().trim()))
        );
        if (matched) {
          setVenueSource('matched-blackbook');
          if (!capacity && matched.capacity) setCapacity(String(matched.capacity));
          if (!streetAddress && matched.street_address) setStreetAddress(matched.street_address);
          if (!city && matched.city) setCity(matched.city);
          if (!state && matched.state) setState(matched.state);
        } else {
          setVenueSource('auto-stubbed');
        }
      } catch {
        setVenueSource('auto-stubbed');
      }
    };
    checkVenues();
  }, [venueName, city]);

  if (!isOpen) return null;

  // Process flyer upload with compression
  const processImageFile = (file: File, onSuccess: (dataUrl: string) => void) => {
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      triggerNotification?.('⚠️ Flyer image exceeds 12MB limit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = reader.result as string;
        const compressed = await compressImageInSocialFeed(raw, 1200, 1200, 0.82);
        onSuccess(compressed);
        triggerNotification?.('✅ Flyer image attached');
      } catch {
        onSuccess(reader.result as string);
        triggerNotification?.('✅ Flyer image attached');
      }
    };
    reader.readAsDataURL(file);
  };

  // Support Band Handlers
  const handleAddBand = () => {
    const trimmed = newBandInput.trim();
    if (trimmed && !supportBands.includes(trimmed)) {
      setSupportBands(prev => [...prev, trimmed]);
      setNewBandInput('');
    }
  };

  const handleRemoveBand = (idx: number) => {
    setSupportBands(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddTourSupportBand = () => {
    const trimmed = newTourSupportInput.trim();
    if (trimmed && !tourSupportBands.includes(trimmed)) {
      setTourSupportBands(prev => [...prev, trimmed]);
      setNewTourSupportInput('');
    }
  };

  const handleRemoveTourSupportBand = (idx: number) => {
    setTourSupportBands(prev => prev.filter((_, i) => i !== idx));
  };

  // Stop Adder Handler
  const handleAddTourStop = () => {
    if (!stopDate) {
      triggerNotification?.('⚠️ Please select a date for the tour stop.');
      return;
    }
    if (!stopCity.trim()) {
      triggerNotification?.('⚠️ Please enter the city for this stop.');
      return;
    }

    const newStop: TourStopItem = {
      id: 'stop_' + Math.random().toString(36).substring(2, 9),
      show_date: stopDate,
      city: stopCity.trim(),
      state: stopState.trim().toUpperCase(),
      venue_name: stopVenue.trim() || 'Live Venue',
      doors_time: stopDoorsTime || '19:00',
      ticket_url: stopTicketUrl.trim() || undefined,
    };

    setTourStops(prev => [...prev, newStop]);
    triggerNotification?.(`📍 Added stop: ${newStop.city}, ${newStop.state} @ ${newStop.venue_name}`);

    setStopCity('');
    setStopState('');
    setStopVenue('');
    setStopTicketUrl('');
  };

  const handleRemoveTourStop = (id: string) => {
    setTourStops(prev => prev.filter(s => s.id !== id));
  };

  // Submit Single Show
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const headlinerVal = headliner.trim();
    if (!headlinerVal) {
      triggerNotification?.('⚠️ Please provide a band / headliner name.');
      return;
    }
    if (!showDate) {
      triggerNotification?.('⚠️ Please choose a show date.');
      return;
    }
    if (!city.trim()) {
      triggerNotification?.('⚠️ City is required.');
      return;
    }

    const showId = initialData?.id || ('sh_comm_' + Math.random().toString(36).substring(2, 9));
    const showName = tourName.trim() ? `${headlinerVal} (${tourName.trim()})` : `${headlinerVal} Live`;

    const showPayload = {
      id: showId,
      name: showName,
      show_name: showName,
      headliner: headlinerVal,
      tour_name: tourName.trim() || undefined,
      festival_name: tourName.trim() || undefined,
      date: showDate,
      show_date: showDate,
      doors_time: doorsTime || '19:00',
      set_time: setTime || '20:00',
      venue_name: venueName.trim() || 'Live Venue',
      venue: venueName.trim() || 'Live Venue',
      venue_address: streetAddress.trim() || undefined,
      street_address: streetAddress.trim() || undefined,
      venue_capacity: capacity ? parseInt(String(capacity), 10) : undefined,
      capacity: capacity ? parseInt(String(capacity), 10) : undefined,
      city: city.trim(),
      state: state.trim() || undefined,
      state_province: state.trim() || undefined,
      country: country.trim() || 'United States',
      price: price.trim() || 'Cover at Door',
      day_of_show_price: price.trim() || 'Cover at Door',
      presale_price: presalePrice.trim() || undefined,
      age_restriction: ageRestriction,
      safety_code: safetyCode.trim() || undefined,
      ticket_url: ticketUrl.trim() || undefined,
      external_ticket_url: ticketUrl.trim() || undefined,
      flyer_url: flyerUrl || undefined,
      support_bands: supportBands.join(', '),
      support_lineup: supportBands.map(bandName => ({ band_name: bandName, set_duration: '35 mins' })),
      is_community_submitted: true,
      created_at: initialData?.created_at || new Date().toISOString()
    };

    // 1. Local storage save
    try {
      await showsStore.setItem(showId, showPayload);
    } catch (storeErr) {
      console.warn('Local indexedDB write fallback:', storeErr);
    }

    // 2. Supabase sync if connected
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('shows').upsert([{
          id: showId,
          headliner: headlinerVal,
          show_name: showName,
          tour_name: tourName.trim() || null,
          show_date: showDate,
          date: showDate,
          doors_time: doorsTime || '19:00',
          venue_name: venueName.trim() || 'Live Venue',
          city: city.trim(),
          state_province: state.trim() || null,
          price: price.trim() || 'Cover at Door',
          flyer_url: flyerUrl || null,
          ticket_url: ticketUrl.trim() || null,
          support_bands: supportBands.join(', '),
          is_community_submitted: true,
          created_at: showPayload.created_at
        }]);
      }
    } catch (sbErr) {
      console.warn('Supabase show sync notice:', sbErr);
    }

    if (onSubmit) {
      onSubmit(showPayload);
    }
    triggerNotification?.(`✅ Show successfully posted: ${headlinerVal} in ${city.trim()}!`);
    window.dispatchEvent(new CustomEvent('COMMUNITY_SHOWS_UPDATED'));
    onClose?.();
  };

  // Submit Batch Tour Dates
  const handleBatchCreateTour = async () => {
    const headlinerVal = tourHeadliner.trim();
    if (!headlinerVal) {
      triggerNotification?.('⚠️ Please enter the Headliner / Main Touring Artist.');
      return;
    }
    if (tourStops.length === 0) {
      triggerNotification?.('⚠️ Please add at least one tour stop date.');
      return;
    }

    setIsBatchCreating(true);
    let createdCount = 0;
    const activeTourName = tourPackageName.trim() || `${headlinerVal} Tour`;
    const sharedSupport = tourSupportBands.join(', ');
    const sharedLineup = tourSupportBands.map(b => ({ band_name: b, set_duration: '35 mins' }));

    try {
      for (const stop of tourStops) {
        const showId = 'sh_tour_' + Math.random().toString(36).substring(2, 9);
        const venueVal = stop.venue_name || 'Live Venue';
        const finalName = `${headlinerVal} at ${venueVal}`;

        const showPayload: any = {
          id: showId,
          name: finalName,
          show_name: finalName,
          headliner: headlinerVal,
          festival_name: activeTourName,
          tour_name: activeTourName,
          date: stop.show_date,
          show_date: stop.show_date,
          doors_time: stop.doors_time || '19:00',
          set_time: '20:00',
          venue_name: venueVal,
          venue: venueVal,
          city: stop.city,
          state_province: stop.state || undefined,
          state: stop.state || undefined,
          country: 'United States',
          price: 'Cover at Door',
          day_of_show_price: 'Cover at Door',
          age_restriction: 'All Ages',
          ticket_url: stop.ticket_url || undefined,
          external_ticket_url: stop.ticket_url || undefined,
          flyer_url: tourFlyerUrl || undefined,
          support_bands: sharedSupport,
          support_lineup: sharedLineup,
          is_community_submitted: true,
          created_at: new Date().toISOString()
        };

        await showsStore.setItem(showId, showPayload);

        try {
          const supabase = getSupabase();
          if (supabase) {
            await supabase.from('shows').upsert([{
              id: showId,
              headliner: headlinerVal,
              show_name: finalName,
              tour_name: activeTourName,
              show_date: stop.show_date,
              date: stop.show_date,
              doors_time: stop.doors_time || '19:00',
              venue_name: venueVal,
              city: stop.city,
              state_province: stop.state,
              price: 'Cover at Door',
              flyer_url: tourFlyerUrl || null,
              ticket_url: stop.ticket_url || null,
              support_bands: sharedSupport,
              is_community_submitted: true,
              created_at: new Date().toISOString()
            }]);
          }
        } catch (_) {}

        createdCount++;
      }

      window.dispatchEvent(new CustomEvent('COMMUNITY_SHOWS_UPDATED'));
      triggerNotification?.(`🎉 Successfully created ${createdCount} tour show events! Each stop now has its own event page you can edit anytime.`);
      
      if (onSubmit) {
        onSubmit({
          id: 'sh_batch_completed',
          _isBatch: true,
          count: createdCount
        });
      }
      onClose?.();
    } catch (err) {
      console.error('Failed to create tour dates batch:', err);
      triggerNotification?.('⚠️ Failed to save tour stops. Please try again.');
    } finally {
      setIsBatchCreating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 pb-16 sm:pb-6 bg-black/85 backdrop-blur-md animate-fadeIn">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-3xl bg-[#0c0e12] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] sm:max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-[#11141c]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                🎟️
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide font-mono">
                  {initialData ? 'Edit Community Show' : 'Post Community Show'}
                </h3>
                <p className="text-[11px] text-zinc-400">Post a single concert date or configure a full multi-date tour</p>
              </div>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center border-b border-zinc-800 bg-black/40 px-5 pt-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`pb-2.5 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Single Show</span>
            </button>

            {!initialData && (
              <button
                type="button"
                onClick={() => setActiveTab('tour')}
                className={`pb-2.5 px-3.5 text-xs font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'tour'
                    ? 'border-emerald-400 text-emerald-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tour Dates (Batch)</span>
                {tourStops.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    {tourStops.length}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* ======================================================== */}
          {/* TAB A: SINGLE SHOW FORM                                   */}
          {/* ======================================================== */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Manual Flyer Dropzone */}
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDraggingSingleFlyer(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDraggingSingleFlyer(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingSingleFlyer(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith('image/')) {
                    processImageFile(file, (url) => setFlyerUrl(url));
                  }
                }}
                onClick={() => singleFlyerInputRef.current?.click()}
                className={`p-3.5 rounded-xl text-center border-2 border-dashed transition cursor-pointer relative ${
                  isDraggingSingleFlyer 
                    ? 'bg-emerald-950/40 border-emerald-400' 
                    : flyerUrl 
                    ? 'bg-neutral-900/60 border-neutral-700 hover:border-emerald-500/50' 
                    : 'bg-neutral-900/40 border-neutral-700 hover:border-emerald-500/50 hover:bg-neutral-900/70'
                }`}
              >
                {flyerUrl ? (
                  <div className="flex items-center gap-3 text-left">
                    <img 
                      src={flyerUrl} 
                      alt="Flyer Preview" 
                      className="w-14 h-18 object-cover rounded-lg border border-neutral-700 shadow shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold text-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>Event Flyer Attached</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Click or drag a new image file to replace</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            singleFlyerInputRef.current?.click();
                          }}
                          className="text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                        >
                          Replace Flyer
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFlyerUrl('');
                          }}
                          className="text-[10px] font-mono text-rose-400 hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 flex flex-col items-center">
                    <Upload className="w-6 h-6 text-emerald-400 mb-1.5" />
                    <span className="text-xs font-semibold text-emerald-300 font-mono">
                      Drop Event Flyer / Poster Image Here
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                      Supports JPG, PNG, WEBP (Click to browse files)
                    </span>
                  </div>
                )}
                <input 
                  ref={singleFlyerInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageFile(file, (url) => setFlyerUrl(url));
                  }} 
                />
              </div>

              {/* Headliner */}
              <div>
                <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                  Band / Headliner Name <span className="text-emerald-400">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={headliner}
                  onChange={(e) => setHeadliner(e.target.value)}
                  placeholder="e.g. Mortician, Cannibal Corpse, Sanguisugabogg"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Support Bands */}
              <div>
                <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                  Support Lineup / Other Bands (Optional)
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newBandInput}
                    onChange={(e) => setNewBandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBand();
                      }
                    }}
                    placeholder="Type band name and press Enter or click Add"
                    className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddBand}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs flex items-center gap-1 cursor-pointer transition border border-zinc-700"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add</span>
                  </button>
                </div>

                {supportBands.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {supportBands.map((band, idx) => (
                      <span 
                        key={`sup-${idx}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-[11px]"
                      >
                        <span>{band}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveBand(idx)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tour Name */}
              <div>
                <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                  Festival or Tour Package Name (Optional)
                </label>
                <input 
                  type="text"
                  value={tourName}
                  onChange={(e) => setTourName(e.target.value)}
                  placeholder="e.g. Chaos & Carnage Tour 2026, Maryland Deathfest"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="block font-mono text-[11px] text-zinc-400 mb-1">
                    Show Date <span className="text-emerald-400">*</span>
                  </label>
                  <input 
                    type="date"
                    required
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-zinc-400 mb-1">
                    Doors Time
                  </label>
                  <input 
                    type="time"
                    value={doorsTime}
                    onChange={(e) => setDoorsTime(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-zinc-400 mb-1">
                    Set Time
                  </label>
                  <input 
                    type="time"
                    value={setTime}
                    onChange={(e) => setSetTime(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    Day of Show Price <span className="text-emerald-400">*</span>
                  </label>
                  <input 
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. $25, Free, Donation"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    Pre-Sale Price (Optional)
                  </label>
                  <input 
                    type="text"
                    value={presalePrice}
                    onChange={(e) => setPresalePrice(e.target.value)}
                    placeholder="e.g. $20 adv"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Age Restriction & Safety Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    Age Restriction
                  </label>
                  <select
                    value={ageRestriction}
                    onChange={(e) => setAgeRestriction(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  >
                    <option value="All Ages">All Ages</option>
                    <option value="18+">18+</option>
                    <option value="21+">21+</option>
                    <option value="16+">16+</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    Safety Code / Policy (Optional)
                  </label>
                  <input 
                    type="text"
                    value={safetyCode}
                    onChange={(e) => setSafetyCode(e.target.value)}
                    placeholder="e.g. Safe Space / Zero Tolerance"
                    className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Venue Details */}
              <div className="space-y-3 pt-2 border-t border-zinc-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider">
                        Venue Name <span className="text-emerald-400">*</span>
                      </label>
                      {venueSource === 'matched-blackbook' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          Black Book Matched {capacity ? `(${capacity} Cap)` : ''}
                        </span>
                      )}
                      {venueSource === 'auto-stubbed' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                          <MapPin className="w-2.5 h-2.5 text-amber-400" />
                          Auto-Stubbed in Black Book
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={venueName} 
                      onChange={(e) => setVenueName(e.target.value)} 
                      placeholder="e.g. The Rail Club Live, Trees, Come and Take It Live" 
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400" 
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Street Address (Optional)
                    </label>
                    <input 
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      placeholder="e.g. 3101 Joyce Dr, 2709 Elm St"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      City <span className="text-emerald-400">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Haltom City, Austin"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      State / Prov
                    </label>
                    <input 
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. TX, CA"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Capacity
                    </label>
                    <input 
                      type="text"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="e.g. 650"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>
              </div>

              {/* Ticket URL */}
              <div className="pt-2 border-t border-zinc-800/80">
                <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                  External Ticketing Link (Optional)
                </label>
                <input 
                  type="url"
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  placeholder="https://dice.fm/event/... or https://ticketmaster.com/..."
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-bold rounded-lg font-mono text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-400/20"
                >
                  {initialData ? 'Update Show Details' : 'Post Community Show'}
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB B: TOUR DATES (BATCH MULTI-DATE) FORM                */}
          {/* ======================================================== */}
          {activeTab === 'tour' && (
            <div className="p-5 overflow-y-auto flex-1 text-xs space-y-4">
              {/* Tour Shared Header */}
              <div className="p-4 rounded-xl bg-[#11141c] border border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                  <Music className="w-3.5 h-3.5" />
                  <span>Tour Package & Shared Lineup</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Headliner / Main Artist <span className="text-emerald-400">*</span>
                    </label>
                    <input 
                      type="text"
                      required
                      value={tourHeadliner}
                      onChange={(e) => setTourHeadliner(e.target.value)}
                      placeholder="e.g. Cannibal Corpse, Aborted"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                      Tour Package Name (Optional)
                    </label>
                    <input 
                      type="text"
                      value={tourPackageName}
                      onChange={(e) => setTourPackageName(e.target.value)}
                      placeholder="e.g. North American Devastation Tour 2026"
                      className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                {/* Support Bands */}
                <div>
                  <label className="block font-mono text-[11px] text-zinc-300 uppercase tracking-wider mb-1">
                    Support Bands (Shared Across All Tour Stops)
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newTourSupportInput}
                      onChange={(e) => setNewTourSupportInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTourSupportBand();
                        }
                      }}
                      placeholder="Add touring package band (e.g. Ingested, PeelingFlesh)"
                      className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddTourSupportBand}
                      className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg font-mono text-xs flex items-center gap-1 cursor-pointer transition border border-zinc-700"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add</span>
                    </button>
                  </div>

                  {tourSupportBands.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tourSupportBands.map((band, idx) => (
                        <span 
                          key={`tour-sup-${idx}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-200 font-mono text-[11px]"
                        >
                          <span>{band}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTourSupportBand(idx)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Layout: Poster Dropzone/Viewer + Stops Entry */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-zinc-300 uppercase tracking-wider font-bold">
                      Tour Poster Reference
                    </span>
                    {tourFlyerUrl && (
                      <button
                        type="button"
                        onClick={() => setIsPosterZoomModalOpen(true)}
                        className="text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3 h-3" />
                        <span>Enlarge Poster</span>
                      </button>
                    )}
                  </div>

                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingTourFlyer(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDraggingTourFlyer(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingTourFlyer(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        processImageFile(file, (url) => setTourFlyerUrl(url));
                      }
                    }}
                    onClick={() => tourFlyerInputRef.current?.click()}
                    className={`rounded-xl text-center border-2 border-dashed transition cursor-pointer relative overflow-hidden flex flex-col items-center justify-center ${
                      isDraggingTourFlyer 
                        ? 'bg-emerald-950/40 border-emerald-400' 
                        : tourFlyerUrl 
                        ? 'bg-neutral-950 border-neutral-700 hover:border-emerald-500/50' 
                        : 'bg-neutral-900/40 border-neutral-700 hover:border-emerald-500/50 p-6'
                    }`}
                    style={{ minHeight: tourFlyerUrl ? '320px' : '180px' }}
                  >
                    {tourFlyerUrl ? (
                      <div className="relative w-full h-full flex flex-col group">
                        <img 
                          src={tourFlyerUrl} 
                          alt="Tour Poster" 
                          className="w-full h-80 object-contain bg-black rounded-lg"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
                          <span className="text-[10px] font-mono text-emerald-400 truncate">
                            Attached to all {tourStops.length} stops
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsPosterZoomModalOpen(true);
                              }}
                              className="px-2 py-0.5 bg-black/80 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono hover:bg-emerald-950 cursor-pointer"
                            >
                              Zoom
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTourFlyerUrl('');
                              }}
                              className="px-2 py-0.5 bg-black/80 text-rose-400 border border-rose-500/30 rounded text-[10px] font-mono hover:bg-rose-950 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center p-4">
                        <Upload className="w-6 h-6 text-emerald-400 mb-1.5" />
                        <span className="text-xs font-semibold text-emerald-300 font-mono">
                          Drop Tour Poster Here
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-1 font-mono text-center">
                          Upload poster to preview tour stops & dates side-by-side
                        </span>
                      </div>
                    )}
                    <input 
                      ref={tourFlyerInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file, (url) => setTourFlyerUrl(url));
                      }} 
                    />
                  </div>
                </div>

                {/* Right: Inline Add Stop + List */}
                <div className="md:col-span-7 space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#11141c] border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Tour Stop</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Enter date & venue from poster</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          Date <span className="text-emerald-400">*</span>
                        </label>
                        <input 
                          type="date"
                          value={stopDate}
                          onChange={(e) => setStopDate(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          Venue Name
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. Reggies, Trees"
                          value={stopVenue}
                          onChange={(e) => setStopVenue(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          City <span className="text-emerald-400">*</span>
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. Austin, Chicago"
                          value={stopCity}
                          onChange={(e) => setStopCity(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[10px] text-zinc-400 mb-0.5">
                          State / Prov
                        </label>
                        <input 
                          type="text"
                          placeholder="e.g. TX, IL"
                          value={stopState}
                          onChange={(e) => setStopState(e.target.value)}
                          className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input 
                        type="url"
                        placeholder="Ticket URL (Optional)"
                        value={stopTicketUrl}
                        onChange={(e) => setStopTicketUrl(e.target.value)}
                        className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1 text-xs text-white font-mono focus:border-emerald-400 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddTourStop}
                        className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black font-bold font-mono text-xs rounded transition cursor-pointer shrink-0"
                      >
                        + Add Stop
                      </button>
                    </div>
                  </div>

                  {/* List of stops */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Tour Stops
                        </span>
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                          {tourStops.length} Total
                        </span>
                      </div>
                      {tourStops.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setTourStops([])}
                          className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 cursor-pointer"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {tourStops.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs">
                        No tour stops added yet. Use the form above to add dates from your poster.
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                        {tourStops.map((stop, idx) => (
                          <div 
                            key={stop.id}
                            className="p-2.5 rounded-lg bg-black/60 border border-zinc-800 flex items-center justify-between gap-2 hover:border-zinc-700 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 font-mono">
                              <span className="text-[10px] text-zinc-500 shrink-0 font-bold w-5">
                                #{idx + 1}
                              </span>
                              <span className="text-emerald-400 font-bold shrink-0">
                                {stop.show_date}
                              </span>
                              <span className="text-zinc-200 truncate">
                                {stop.city}{stop.state ? `, ${stop.state}` : ''}
                              </span>
                              <span className="text-zinc-500 truncate hidden sm:inline">
                                @ {stop.venue_name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {stop.ticket_url && (
                                <ExternalLink className="w-3 h-3 text-cyan-400" />
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveTourStop(stop.id)}
                                className="text-zinc-500 hover:text-rose-400 p-1 transition cursor-pointer"
                                title="Remove stop"
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
              </div>

              {/* Batch Actions Footer */}
              <div className="pt-3 flex items-center justify-between border-t border-zinc-800">
                <p className="text-[11px] text-zinc-400 font-mono">
                  {tourStops.length > 0 
                    ? `Will generate ${tourStops.length} separate community show pages that can each be edited individually.`
                    : 'Add tour dates to generate separate community events.'}
                </p>
                <div className="flex items-center gap-3">
                  {onClose && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-mono text-xs transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleBatchCreateTour}
                    disabled={isBatchCreating || tourStops.length === 0 || !tourHeadliner.trim()}
                    className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg font-mono text-xs transition-colors cursor-pointer shadow-lg shadow-emerald-400/20 flex items-center gap-2"
                  >
                    <span>{isBatchCreating ? 'Creating Events...' : `Save & Create All (${tourStops.length}) Events`}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Full-Size Poster Zoom Lightbox Modal */}
          {isPosterZoomModalOpen && tourFlyerUrl && (
            <div 
              className="fixed inset-0 z-[100005] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg animate-fadeIn"
              onClick={() => setIsPosterZoomModalOpen(false)}
            >
              <div 
                className="relative max-w-4xl max-h-[90vh] bg-black border border-zinc-800 rounded-xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between pb-2 px-2 border-b border-zinc-800">
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    Tour Poster High-Resolution Viewer
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPosterZoomModalOpen(false)}
                    className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-auto max-h-[80vh] p-2 flex items-center justify-center">
                  <img 
                    src={tourFlyerUrl} 
                    alt="Tour Poster Zoom" 
                    className="max-h-[78vh] object-contain rounded"
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default PostCommunityShowModal;
