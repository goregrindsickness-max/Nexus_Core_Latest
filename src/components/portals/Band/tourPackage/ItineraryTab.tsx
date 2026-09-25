import React, { useState, useEffect } from 'react';
import { MapPin, Copy, Trash2, Phone, Mail, Save, Plus, CheckCircle2, RefreshCw, Edit3, X, BookOpen, Star, Building2, Check, Clock, DollarSign, Sparkles, ArrowRightLeft, Compass, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { TourPackageStop } from '../../../../lib/tourPackageManager';
import { getAllBlackBookVenues, searchBlackBookVenues, isVenueInBlackBook, saveVenueToBlackBook, VenueResult } from '../../../../services/venueSearchService';
import { formatTimeTo12Hour } from '../../../../lib/timeUtils';
import { SmartVenueScoutModal } from './SmartVenueScoutModal';

interface ItineraryTabProps {
  stops: TourPackageStop[];
  selectedStopId: string;
  setSelectedStopId: (id: string) => void;
  onCopyDaySheet: (stop: TourPackageStop) => void;
  onRemoveStop: (id: string, venueName: string) => void;
  onToggleAdvancing: (id: string) => void;
  onUpdateStop?: (updated: TourPackageStop) => void;
  onAddStop?: (newStop: TourPackageStop) => void;
  triggerNotification?: (msg: string) => void;
  onSaveProgress?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  lastSavedAt?: Date | null;
  onOpenAddStopModal?: () => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  stops,
  selectedStopId,
  setSelectedStopId,
  onCopyDaySheet,
  onRemoveStop,
  onToggleAdvancing,
  onUpdateStop,
  onAddStop,
  triggerNotification,
  onSaveProgress,
  isSaving,
  hasUnsavedChanges,
  lastSavedAt,
  onOpenAddStopModal
}) => {
  const activeStop = stops.find(s => s.id === selectedStopId);
  const advancedCount = stops.filter(s => s.advancingDone).length;

  // Collapsed / Expanded state for entire Tour Dates section (collapsed by default)
  const [isTourRouteSectionCollapsed, setIsTourRouteSectionCollapsed] = useState(true);

  // Smart Black Book Venue Scout Modal State
  const [isSmartScoutOpen, setIsSmartScoutOpen] = useState(false);
  const [scoutTargetCity, setScoutTargetCity] = useState('');
  const [scoutTargetStop, setScoutTargetStop] = useState<TourPackageStop | null>(null);

  // Edit Stop Modal State
  const [editingStop, setEditingStop] = useState<TourPackageStop | null>(null);
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [capacity, setCapacity] = useState<number>(500);
  const [status, setStatus] = useState<TourPackageStop['status']>('confirmed');
  const [loadInTime, setLoadInTime] = useState('15:00');
  const [soundcheckTime, setSoundcheckTime] = useState('16:30');
  const [doorsTime, setDoorsTime] = useState('19:00');
  const [showStartTime, setShowStartTime] = useState('19:45');
  const [curfewTime, setCurfewTime] = useState('23:30');
  const [venueContactName, setVenueContactName] = useState('');
  const [venueContactPhone, setVenueContactPhone] = useState('');
  const [venueContactEmail, setVenueContactEmail] = useState('');
  const [grossDeal, setGrossDeal] = useState<number>(3000);
  const [merchCutVenuePct, setMerchCutVenuePct] = useState<number>(10);
  const [parkingNotes, setParkingNotes] = useState('');
  const [hospitalityNotes, setHospitalityNotes] = useState('');
  const [advancingDone, setAdvancingDone] = useState(false);
  const [blackBookVenueId, setBlackBookVenueId] = useState<string | undefined>(undefined);
  const [saveToBlackBookChecked, setSaveToBlackBookChecked] = useState(true);

  // Black Book lookup & suggestions
  const [blackBookSearchQuery, setBlackBookSearchQuery] = useState('');
  const [blackBookSuggestions, setBlackBookSuggestions] = useState<VenueResult[]>([]);
  const [isSearchingBlackBook, setIsSearchingBlackBook] = useState(false);
  const [activeStopInBlackBook, setActiveStopInBlackBook] = useState<boolean | null>(null);

  // Check if activeStop is in Black Book
  useEffect(() => {
    if (!activeStop?.venueName) {
      setActiveStopInBlackBook(null);
      return;
    }
    isVenueInBlackBook(activeStop.venueName, activeStop.city).then(res => {
      setActiveStopInBlackBook(res);
    });
  }, [activeStop?.venueName, activeStop?.city]);

  // Handle Black Book Search
  const handleBlackBookSearchChange = async (query: string) => {
    setBlackBookSearchQuery(query);
    if (!query.trim()) {
      setBlackBookSuggestions([]);
      return;
    }
    setIsSearchingBlackBook(true);
    try {
      const results = await searchBlackBookVenues(query);
      setBlackBookSuggestions(results);
    } catch {
      setBlackBookSuggestions([]);
    } finally {
      setIsSearchingBlackBook(false);
    }
  };

  const handleSelectBlackBookVenue = (v: VenueResult) => {
    setVenueName(v.name);
    if (v.city) setCity(v.city);
    if (v.state) setState(v.state);
    if (v.capacity) setCapacity(typeof v.capacity === 'number' ? v.capacity : parseInt(v.capacity) || 500);
    setBlackBookVenueId(v.id);
    if (v.fullAddress) {
      setParkingNotes(prev => prev || `Address: ${v.fullAddress}`);
    }
    if (v.contactName) setVenueContactName(v.contactName);
    if (v.contactPhone) setVenueContactPhone(v.contactPhone);
    if (v.contactEmail) setVenueContactEmail(v.contactEmail);
    if (v.parkingNotes) setParkingNotes(v.parkingNotes);
    setBlackBookSuggestions([]);
    setBlackBookSearchQuery('');
    triggerNotification?.(`Connected "${v.name}" from Black Book Rolodex!`);
  };

  const openEditModal = (stop: TourPackageStop) => {
    setEditingStop(stop);
    setDate(stop.date);
    setVenueName(stop.venueName);
    setCity(stop.city);
    setState(stop.state);
    setCapacity(stop.capacity || 500);
    setStatus(stop.status);
    setLoadInTime(stop.loadInTime || '15:00');
    setSoundcheckTime(stop.soundcheckTime || '16:30');
    setDoorsTime(stop.doorsTime || '19:00');
    setShowStartTime(stop.showStartTime || '19:45');
    setCurfewTime(stop.curfewTime || '23:30');
    setVenueContactName(stop.venueContactName || '');
    setVenueContactPhone(stop.venueContactPhone || '');
    setVenueContactEmail(stop.venueContactEmail || '');
    setGrossDeal(stop.grossDeal || 0);
    setMerchCutVenuePct(stop.merchCutVenuePct ?? 10);
    setParkingNotes(stop.parkingNotes || '');
    setHospitalityNotes(stop.hospitalityNotes || '');
    setAdvancingDone(!!stop.advancingDone);
    setBlackBookVenueId(stop.blackBookVenueId);
    setBlackBookSearchQuery('');
    setBlackBookSuggestions([]);
  };

  const handleSaveStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStop || !venueName.trim() || !city.trim()) return;

    let linkedBbId = blackBookVenueId;

    // Check if new venue should be added to Black Book
    if (saveToBlackBookChecked) {
      const alreadyIn = await isVenueInBlackBook(venueName.trim(), city.trim());
      if (!alreadyIn) {
        const saved = saveVenueToBlackBook({
          name: venueName.trim(),
          city: city.trim(),
          state: state.trim(),
          capacity,
          contactName: venueContactName.trim(),
          contactPhone: venueContactPhone.trim(),
          contactEmail: venueContactEmail.trim(),
          parkingNotes: parkingNotes.trim()
        });
        linkedBbId = saved.id;
        triggerNotification?.(`Added "${venueName.trim()}" to Black Book Rolodex!`);
      }
    }

    const updated: TourPackageStop = {
      ...editingStop,
      date,
      venueName: venueName.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase() || 'US',
      capacity: Number(capacity) || 500,
      status,
      loadInTime,
      soundcheckTime,
      doorsTime,
      showStartTime,
      curfewTime,
      venueContactName: venueContactName.trim() || 'Production PM',
      venueContactPhone: venueContactPhone.trim(),
      venueContactEmail: venueContactEmail.trim(),
      grossDeal: Number(grossDeal) || 0,
      merchCutVenuePct: Number(merchCutVenuePct) || 0,
      parkingNotes: parkingNotes.trim(),
      hospitalityNotes: hospitalityNotes.trim(),
      advancingDone,
      blackBookVenueId: linkedBbId
    };

    onUpdateStop?.(updated);
    setEditingStop(null);
    triggerNotification?.(`Updated show details for ${updated.venueName}.`);
  };

  const handleQuickAddToBlackBook = (stop: TourPackageStop) => {
    saveVenueToBlackBook({
      name: stop.venueName,
      city: stop.city,
      state: stop.state,
      capacity: stop.capacity,
      contactName: stop.venueContactName,
      contactPhone: stop.venueContactPhone,
      contactEmail: stop.venueContactEmail,
      parkingNotes: stop.parkingNotes
    });
    setActiveStopInBlackBook(true);
    triggerNotification?.(`Saved "${stop.venueName}" to your Black Book Rolodex!`);
  };

  // Handler for swapping venue onto an existing stop
  const handleSwapVenueForStop = (stopId: string, venue: VenueResult) => {
    const target = stops.find(s => s.id === stopId);
    if (!target) return;

    const updated: TourPackageStop = {
      ...target,
      venueName: venue.name,
      city: venue.city || target.city,
      state: venue.state || target.state,
      capacity: typeof venue.capacity === 'number' ? venue.capacity : parseInt(venue.capacity || '500') || target.capacity,
      blackBookVenueId: venue.id,
      venueContactName: venue.contactName || target.venueContactName,
      venueContactPhone: venue.contactPhone || target.venueContactPhone,
      venueContactEmail: venue.contactEmail || target.venueContactEmail,
      parkingNotes: venue.parkingNotes || (venue.fullAddress ? `Address: ${venue.fullAddress}` : target.parkingNotes)
    };

    onUpdateStop?.(updated);
    triggerNotification?.(`Swapped venue to ${venue.name} (${venue.city}, ${venue.state})`);
  };

  // Handler for adding a new stop from the Smart Scout modal
  const handleSelectVenueForNewStop = (venue: VenueResult, targetDate?: string) => {
    const newStop: TourPackageStop = {
      id: `pkg-s${Date.now()}`,
      date: targetDate || new Date().toISOString().split('T')[0],
      venueName: venue.name,
      city: venue.city || 'TBD',
      state: venue.state || 'US',
      capacity: typeof venue.capacity === 'number' ? venue.capacity : parseInt(venue.capacity || '500') || 500,
      status: 'confirmed',
      loadInTime: '15:00',
      soundcheckTime: '16:30',
      doorsTime: '19:00',
      showStartTime: '19:45',
      curfewTime: '23:30',
      venueContactName: venue.contactName || 'Production PM',
      venueContactPhone: venue.contactPhone || '',
      venueContactEmail: venue.contactEmail || '',
      grossDeal: 3000,
      merchCutVenuePct: 10,
      parkingNotes: venue.parkingNotes || (venue.fullAddress ? `Address: ${venue.fullAddress}` : ''),
      hospitalityNotes: 'Standard green room buyouts per contract.',
      advancingDone: false,
      blackBookVenueId: venue.id
    };

    if (onAddStop) {
      onAddStop(newStop);
    } else if (onUpdateStop) {
      onUpdateStop(newStop);
    }
  };

  return (
    <div className="space-y-3">
      {/* Centered Route Header Card with Centered Text & Buttons */}
      <div className="w-full p-3.5 sm:p-4 bg-[#0e1117] border border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center gap-3 shadow-lg">
        <div className="flex flex-col items-center justify-center gap-1.5 text-center w-full">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm font-mono font-bold text-white uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-400" />
              Tour Route ({stops.length} Stops)
            </span>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              Advanced: <strong className="text-emerald-400">{advancedCount}/{stops.length}</strong>
            </span>
            {lastSavedAt && (
              <span className="text-[9.5px] font-mono text-zinc-500">
                Last saved: {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          <p className="text-[11px] text-zinc-400 max-w-lg mx-auto">
            {isTourRouteSectionCollapsed 
              ? `Tour routing section is collapsed (${stops.length} dates). Expand to view full stop itineraries and advance details.` 
              : 'Sequential routing, production schedules, venue rolodex connections, and advance checkpoints.'}
          </p>
        </div>

        {/* Centered Actions Row */}
        <div className="flex items-center justify-center gap-2 flex-wrap w-full">
          {/* Collapse / Expand Entire Tour Dates Section Toggle */}
          <button
            type="button"
            onClick={() => setIsTourRouteSectionCollapsed(!isTourRouteSectionCollapsed)}
            className={`px-3 py-1.5 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
              isTourRouteSectionCollapsed
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-zinc-700'
            }`}
            title={isTourRouteSectionCollapsed ? "Expand all tour dates" : "Collapse tour dates section"}
          >
            {isTourRouteSectionCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Expand Tour Dates ({stops.length})</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                <span>Collapse Tour Dates</span>
              </>
            )}
          </button>

          {/* Smart Search Venue Button */}
          <button
            type="button"
            onClick={() => {
              setScoutTargetStop(null);
              setScoutTargetCity('');
              setIsSmartScoutOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-amber-400"
            title="Smart search Black Book for venues by city (e.g. Nashville, Joliet, Denver)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Smart Venue Scout
          </button>

          {onOpenAddStopModal && (
            <button
              type="button"
              onClick={onOpenAddStopModal}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700/60"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Stop
            </button>
          )}

          {onSaveProgress && (
            <button
              type="button"
              onClick={onSaveProgress}
              disabled={isSaving}
              className={`px-3.5 py-1.5 rounded-lg font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                isSaving
                  ? 'bg-amber-600/50 text-white cursor-wait'
                  : hasUnsavedChanges
                  ? 'bg-amber-500 hover:bg-amber-400 text-black font-black ring-2 ring-amber-400/50 animate-pulse'
                  : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
              }`}
              title="Save tour route progress (Ctrl+S / Cmd+S)"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Route Changes *
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Route Saved
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* When Expanded: Render Tour Stops List & Closeable Inspector; When Collapsed: Null (Header toggle button is the sole control) */}
      {!isTourRouteSectionCollapsed && (
        <div className={`grid grid-cols-1 ${activeStop ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-3 animate-in fade-in slide-in-from-top-2`}>
          {/* Stops List (Original Left-aligned, sleek horizontal layout) */}
          <div className={`${activeStop ? 'lg:col-span-2' : 'col-span-full'} space-y-2`}>
            {stops.map((stop) => {
              const isSelected = stop.id === selectedStopId;
              const d = new Date(stop.date + 'T00:00:00');
              const dateMonth = isNaN(d.getTime()) ? 'DATE' : d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
              const dateDay = isNaN(d.getTime()) ? '--' : d.toLocaleDateString('en-US', { day: '2-digit' });
              const dateWeekday = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();

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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        {stop.blackBookVenueId && (
                          <span className="inline-flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">
                            <BookOpen className="w-2.5 h-2.5" /> Black Book
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1 font-sans">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span>{stop.city}, {stop.state}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-500 font-mono text-[10px]">Cap: {stop.capacity || 500}</span>
                      </p>
                      <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono text-zinc-400 flex-wrap">
                        <span>Load-In: <strong className="text-zinc-200">{formatTimeTo12Hour(stop.loadInTime)}</strong></span>
                        <span>•</span>
                        <span>Doors: <strong className="text-zinc-200">{formatTimeTo12Hour(stop.doorsTime)}</strong></span>
                        <span>•</span>
                        <span>Deal: <strong className="text-emerald-400">${stop.grossDeal.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap self-end sm:self-center">
                    {/* Smart Scout / Swap in City button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setScoutTargetStop(stop);
                        setScoutTargetCity(stop.city);
                        setIsSmartScoutOpen(true);
                      }}
                      className="px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/30 font-mono text-[9px] uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Scout & Swap Black Book venues in ${stop.city}`}
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Scout {stop.city || 'City'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(stop);
                      }}
                      className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
                      title="Edit Stop Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
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
                      className="p-1 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer ml-0.5"
                      title="Remove stop"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stop Advance Deep Inspector (Closeable Date Detail Card) */}
          {activeStop && (
            <div className="bg-[#0b0e14] border border-zinc-800 rounded-xl p-3.5 space-y-3 relative animate-in fade-in slide-in-from-right-2">
              <div className="flex items-start justify-between pb-2 border-b border-zinc-850 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-left min-w-0">
                    <h4 className="text-xs font-bold text-white uppercase truncate">{activeStop.venueName}</h4>
                    <span className="text-[9px] font-mono text-zinc-400 truncate block">{activeStop.city}, {activeStop.state} • Cap: {activeStop.capacity || 500}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(activeStop)}
                    className="p-1 rounded bg-zinc-850 hover:bg-zinc-800 text-amber-300 transition cursor-pointer"
                    title="Edit Stop"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleAdvancing(activeStop.id)}
                    className={`px-2 py-0.5 rounded font-mono text-[8.5px] font-bold uppercase tracking-wider border cursor-pointer ${
                      activeStop.advancingDone
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400'
                        : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                    }`}
                  >
                    {activeStop.advancingDone ? '✓ Advanced' : 'Advance Pending'}
                  </button>
                  {/* Close Button for Date Detail Card */}
                  <button
                    type="button"
                    onClick={() => setSelectedStopId('')}
                    className="p-1 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer ml-1"
                    title="Close Date Detail Card"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Black Book Connection Status Widget & Smart Scout Swap */}
              <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-between text-[9px] font-mono gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-zinc-400">Black Book:</span>
                  {activeStopInBlackBook ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Listed
                    </span>
                  ) : (
                    <span className="text-zinc-400">Not in Directory</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setScoutTargetStop(activeStop);
                      setScoutTargetCity(activeStop.city);
                      setIsSmartScoutOpen(true);
                    }}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1 cursor-pointer transition shadow-sm"
                    title="Search and pick alternative venues in this city"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Scout Venues
                  </button>

                  {!activeStopInBlackBook && (
                    <button
                      type="button"
                      onClick={() => handleQuickAddToBlackBook(activeStop)}
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1 cursor-pointer transition"
                    >
                      <Plus className="w-2.5 h-2.5" /> Save
                    </button>
                  )}
                </div>
              </div>

              {/* Day Timings Box (12-Hour AM/PM Format) */}
              <div className="space-y-1 text-left bg-zinc-950 p-2.5 rounded-lg border border-zinc-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold block">Production Run-of-Show Timetable (12H)</span>
                  <button
                    type="button"
                    onClick={() => openEditModal(activeStop)}
                    className="text-[8px] font-mono text-zinc-500 hover:text-amber-300 uppercase cursor-pointer"
                  >
                    Edit Times
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                    <span className="text-zinc-500">Load-In:</span>
                    <span className="text-white font-bold">{formatTimeTo12Hour(activeStop.loadInTime)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                    <span className="text-zinc-500">Soundcheck:</span>
                    <span className="text-white font-bold">{formatTimeTo12Hour(activeStop.soundcheckTime)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                    <span className="text-zinc-500">Doors:</span>
                    <span className="text-white font-bold">{formatTimeTo12Hour(activeStop.doorsTime)}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-0.5">
                    <span className="text-zinc-500">Downbeat:</span>
                    <span className="text-emerald-400 font-bold">{formatTimeTo12Hour(activeStop.showStartTime)}</span>
                  </div>
                  <div className="flex justify-between col-span-2 pt-0.5">
                    <span className="text-zinc-500">Curfew / Bus Call:</span>
                    <span className="text-purple-300 font-bold">{formatTimeTo12Hour(activeStop.curfewTime)}</span>
                  </div>
                </div>
              </div>

              {/* Venue Contacts */}
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold block">Venue Production Contact</span>
                <div className="p-2 rounded bg-zinc-950/80 border border-zinc-900 space-y-0.5 text-[10px] text-zinc-300">
                  <div className="font-bold text-white">{activeStop.venueContactName || 'Production PM'}</div>
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
                <span className="text-[8px] font-mono text-zinc-500 uppercase font-bold block">Parking &amp; Shore Power</span>
                <p className="text-[10px] text-zinc-300 bg-zinc-950/80 p-2 rounded border border-zinc-900 leading-relaxed font-sans">
                  {activeStop.parkingNotes || 'Contact venue upon arrival.'}
                </p>
              </div>

              {/* Hospitality & Deal Summary */}
              <div className="p-2 rounded bg-zinc-950/80 border border-zinc-900 space-y-1 text-left text-[9.5px] font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Gross Guarantee Deal:</span>
                  <span className="text-emerald-400 font-bold">${activeStop.grossDeal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Merch Cut:</span>
                  <span className="text-zinc-300">{activeStop.merchCutVenuePct}% Venue</span>
                </div>
                {activeStop.hospitalityNotes && (
                  <div className="pt-1 border-t border-zinc-900 text-zinc-400 font-sans text-[9px]">
                    <strong>Hospitality:</strong> {activeStop.hospitalityNotes}
                  </div>
                )}
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
      )}

      {/* Edit Stop Modal */}
      {editingStop && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f121a] border border-amber-500/40 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  Edit Tour Stop: {editingStop.venueName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStop(null)}
                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStop} className="p-4 space-y-3.5 max-h-[82vh] overflow-y-auto">
              {/* Seamless Black Book Lookup Section */}
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Connect Venue from Black Book Rolodex
                  </span>
                  {blackBookVenueId && (
                    <span className="text-[8px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                      ✓ Linked to Black Book
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={blackBookSearchQuery}
                    onChange={(e) => handleBlackBookSearchChange(e.target.value)}
                    placeholder="Search Black Book (e.g. Exit/In, Basement East, Belasco, Catalyst, Neumos)..."
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  {blackBookSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-amber-500/50 rounded-xl shadow-2xl p-1.5 z-50 max-h-48 overflow-y-auto space-y-1">
                      {blackBookSuggestions.map(v => (
                        <div
                          key={v.id}
                          onClick={() => handleSelectBlackBookVenue(v)}
                          className="p-2 rounded-lg bg-zinc-950 hover:bg-amber-950/50 border border-zinc-800 hover:border-amber-500/40 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-white uppercase block">{v.name}</span>
                            <span className="text-[9px] font-mono text-zinc-400">{v.city}{v.state ? `, ${v.state}` : ''} • Cap: {v.capacity || 'N/A'}</span>
                          </div>
                          <span className="text-[9px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
                            Insert <Check className="w-3 h-3" />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stop Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Show Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Exit/In or The Belasco"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nashville"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    State / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="TN"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Venue Capacity
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100000"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 500)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Show Booking Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="advancing">Advancing</option>
                    <option value="pending">Pending Hold</option>
                    <option value="settled">Settled / Completed</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Gross Guarantee Deal ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={grossDeal}
                    onChange={(e) => setGrossDeal(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Venue Merch Cut (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={merchCutVenuePct}
                    onChange={(e) => setMerchCutVenuePct(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Run of Show Timetable (12-Hour format) */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2 text-left">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold block">
                  Run-of-Show Timetable Checkpoints
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-0.5">Load-In</label>
                    <input
                      type="text"
                      value={loadInTime}
                      onChange={(e) => setLoadInTime(e.target.value)}
                      placeholder="15:00"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs"
                    />
                    <span className="text-[8.5px] font-mono text-zinc-400">{formatTimeTo12Hour(loadInTime)}</span>
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-0.5">Soundcheck</label>
                    <input
                      type="text"
                      value={soundcheckTime}
                      onChange={(e) => setSoundcheckTime(e.target.value)}
                      placeholder="16:30"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs"
                    />
                    <span className="text-[8.5px] font-mono text-zinc-400">{formatTimeTo12Hour(soundcheckTime)}</span>
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-0.5">Doors</label>
                    <input
                      type="text"
                      value={doorsTime}
                      onChange={(e) => setDoorsTime(e.target.value)}
                      placeholder="19:00"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs"
                    />
                    <span className="text-[8.5px] font-mono text-zinc-400">{formatTimeTo12Hour(doorsTime)}</span>
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-0.5">Downbeat</label>
                    <input
                      type="text"
                      value={showStartTime}
                      onChange={(e) => setShowStartTime(e.target.value)}
                      placeholder="19:45"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs"
                    />
                    <span className="text-[8.5px] font-mono text-zinc-400">{formatTimeTo12Hour(showStartTime)}</span>
                  </div>
                  <div>
                    <label className="text-[8px] font-mono text-zinc-500 uppercase block mb-0.5">Curfew / Bus</label>
                    <input
                      type="text"
                      value={curfewTime}
                      onChange={(e) => setCurfewTime(e.target.value)}
                      placeholder="23:30"
                      className="w-full px-2 py-1 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-xs"
                    />
                    <span className="text-[8.5px] font-mono text-zinc-400">{formatTimeTo12Hour(curfewTime)}</span>
                  </div>
                </div>
              </div>

              {/* Contacts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Venue Contact / PM
                  </label>
                  <input
                    type="text"
                    value={venueContactName}
                    onChange={(e) => setVenueContactName(e.target.value)}
                    placeholder="Marcus Vance"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={venueContactPhone}
                    onChange={(e) => setVenueContactPhone(e.target.value)}
                    placeholder="(213) 555-0182"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={venueContactEmail}
                    onChange={(e) => setVenueContactEmail(e.target.value)}
                    placeholder="production@thebelasco.com"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Parking, Shore Power & Hospitality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Parking, Load-In Dock &amp; Shore Power
                  </label>
                  <textarea
                    rows={2}
                    value={parkingNotes}
                    onChange={(e) => setParkingNotes(e.target.value)}
                    placeholder="Back alley loading dock accommodates 1 Tour Bus + 16ft Cargo Trailer. Shore power 50A available."
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-zinc-400 uppercase font-bold block mb-1">
                    Hospitality &amp; Rider Buyouts
                  </label>
                  <textarea
                    rows={2}
                    value={hospitalityNotes}
                    onChange={(e) => setHospitalityNotes(e.target.value)}
                    placeholder="Catering buyouts $25/head for 12 crew/members. Hot vegan options requested."
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Save to Black Book Checkbox */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-850">
                <label className="flex items-center gap-2 cursor-pointer text-left">
                  <input
                    type="checkbox"
                    checked={saveToBlackBookChecked}
                    onChange={(e) => setSaveToBlackBookChecked(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  <span className="text-[10px] font-mono text-zinc-300">
                    Sync &amp; Save this venue to Black Book Directory if not already registered
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-emerald-400 font-bold">
                  <input
                    type="checkbox"
                    checked={advancingDone}
                    onChange={(e) => setAdvancingDone(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-zinc-900 border-zinc-700"
                  />
                  Advancing Done
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingStop(null)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase shadow-md cursor-pointer"
                >
                  Save Tour Stop Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Black Book Venue Scout Modal */}
      <SmartVenueScoutModal
        isOpen={isSmartScoutOpen}
        onClose={() => {
          setIsSmartScoutOpen(false);
          setScoutTargetStop(null);
          setScoutTargetCity('');
        }}
        targetCity={scoutTargetCity}
        targetStop={scoutTargetStop}
        allStops={stops}
        onSelectVenueForNewStop={handleSelectVenueForNewStop}
        onSwapVenueForStop={handleSwapVenueForStop}
        triggerNotification={triggerNotification}
      />
    </div>
  );
};

