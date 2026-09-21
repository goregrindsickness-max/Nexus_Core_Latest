import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft,
  Search, 
  Plus, 
  Trash2, 
  Calendar, 
  StickyNote, 
  Tag, 
  MapPin, 
  Edit3,
  AlertTriangle,
  CheckCircle,
  X,
  ChevronDown,
  Save,
  Clock,
  Filter,
  Music,
  DollarSign,
  Activity,
  Award,
  Flame,
  Truck,
  AlertOctagon,
  PhoneCall,
  Sliders
} from 'lucide-react';
import { TourNote, Show } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';

interface TourNotesViewProps {
  notes: TourNote[];
  shows: Show[];
  onBack: () => void;
  onAddNote: () => void;
  onDeleteNote: (id: string) => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  onUpdateNote?: (id: string, updates: Partial<TourNote>) => void;
  onSubmitNote?: (payload: any) => Promise<any> | void;
  isOffline?: boolean;
  toolkitOnly?: boolean;
}

export default function TourNotesView({
  notes,
  shows,
  onBack,
  onAddNote,
  onDeleteNote,
  triggerNotification,
  addLog,
  onUpdateNote,
  onSubmitNote,
  isOffline = false,
  toolkitOnly = false
}: TourNotesViewProps) {
  const NOTE_CATEGORIES = ["LOGISTICS", "SETTLEMENT", "STAFF", "COMP", "LOAD IN/OUT", "TECHNICAL", "PARKING", "VENUE", "CONTACT", "PAYMENT", "RESTOCK", "SECURITY", "CATERING", "GUEST LIST", "NOTE"];
  const NOTE_TAGS = ["URGENT", "IMPORTANT", "COMPLETE", "LOOK INTO", "NOTE"];

  // Search, Category, Urgency, and Show Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeTag, setActiveTag] = useState<string>('All');
  const [selectedShowFilter, setSelectedShowFilter] = useState<string>('All');

  // Inline Creation state
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('LOGISTICS');
  const [newNoteTagName, setNewNoteTagName] = useState('NOTE');
  const [newNoteShowId, setNewNoteShowId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    text: string;
    category: string;
    tag_name: string;
    show_id: string;
  }>({ text: '', category: 'LOGISTICS', tag_name: 'NOTE', show_id: '' });

  // ==========================================
  // MUSICIAN'S TACTICAL SURVIVAL TOOLKIT STATES
  // ==========================================
  const [isToolkitOpen, setIsToolkitOpen] = useState(toolkitOnly);
  const [activeToolkitTab, setActiveToolkitTab] = useState<'merch' | 'emergency'>('merch');

  // 1. SETLIST & TEMPO CURATOR STATES
  const [bpmTaps, setBpmTaps] = useState<number[]>([]);
  const [tappedBpm, setTappedBpm] = useState<number | null>(null);
  const [liveCurfewMinutes, setLiveCurfewMinutes] = useState(45);
  const [playlist, setPlaylist] = useState([
    { id: '1', title: 'Intro Jam / Soundcheck Burst', duration: '3:15', bpm: 120, checked: true },
    { id: '2', title: 'Roadhouse Gravity', duration: '4:45', bpm: 138, checked: true },
    { id: '3', title: 'Frontline Blitz (Main Single)', duration: '5:20', bpm: 142, checked: true },
    { id: '4', title: 'Midnight Van Chronicles', duration: '6:12', bpm: 104, checked: true },
    { id: '5', title: 'Terminal Ascent', duration: '5:50', bpm: 150, checked: true },
    { id: '6', title: 'Encore: Heavy Gear Anthem', duration: '7:30', bpm: 130, checked: false }
  ]);
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackMin, setNewTrackMin] = useState('4');
  const [newTrackSec, setNewTrackSec] = useState('30');
  const [newTrackBpm, setNewTrackBpm] = useState('120');

  // 2. MERCH SETTLEMENT STATES
  const [merchGross, setMerchGross] = useState(1250);
  const [venueSplitPct, setVenueSplitPct] = useState(20);
  const [localTaxRate, setLocalTaxRate] = useState(8.25);
  const [cardProcessingPct, setCardProcessingPct] = useState(3.0);

  // 3. FUEL & ROUTE EXPENSE STATES
  const [routeMiles, setRouteMiles] = useState(180);
  const [rigMpg, setRigMpg] = useState(12);
  const [fuelPricePerGallon, setFuelPricePerGallon] = useState(3.69);
  const [gigGuarantee, setGigGuarantee] = useState(1000);

  // 4. EMERGENCY PROTOCOL STATES
  const [activeEmergencyIndex, setActiveEmergencyIndex] = useState<number>(0);
  const [emergencyPhoneLogs, setEmergencyPhoneLogs] = useState<Array<{ name: string; phone: string; type: string }>>([
    { name: 'National Van Tow Dispatch', phone: '1-800-555-7623', type: 'RIG TOWING' },
    { name: 'Global Touring Legal Council', phone: '1-888-LAW-BAND', type: 'CONTRACT ESCALATION' },
    { name: 'Gig Insurance Hotline', phone: '1-800-444-2263', type: 'CLAIMS' }
  ]);
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  const [newEmergencyType, setNewEmergencyType] = useState('ROAD REPAIR');

  // Setlist calculators
  const totalSetSeconds = useMemo(() => {
    return playlist
      .filter(t => t.checked)
      .reduce((total, song) => {
        const parts = song.duration.split(':');
        const min = parseInt(parts[0], 10) || 0;
        const sec = parseInt(parts[1], 10) || 0;
        return total + (min * 60) + sec;
      }, 0);
  }, [playlist]);

  const totalSetFormatted = useMemo(() => {
    const mins = Math.floor(totalSetSeconds / 60);
    const secs = totalSetSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }, [totalSetSeconds]);

  const isExceedingCurfew = useMemo(() => {
    return totalSetSeconds > (liveCurfewMinutes * 60);
  }, [totalSetSeconds, liveCurfewMinutes]);

  const handleBpmTap = () => {
    const now = Date.now();
    const newTaps = [...bpmTaps, now].filter(t => now - t < 3000);
    setBpmTaps(newTaps);

    if (newTaps.length > 1) {
      let totalDiff = 0;
      for (let i = 1; i < newTaps.length; i++) {
        totalDiff += (newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = totalDiff / (newTaps.length - 1);
      const computedBpm = Math.round(60000 / avgInterval);
      setTappedBpm(computedBpm);
      setNewTrackBpm(String(computedBpm));
    }
  };

  const clearBpmTap = () => {
    setBpmTaps([]);
    setTappedBpm(null);
  };

  const handleAddTrack = () => {
    if (!newTrackTitle.trim()) {
      triggerNotification("Please supply track title");
      return;
    }
    const mins = parseInt(newTrackMin) || 0;
    const secs = parseInt(newTrackSec) || 0;
    const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    const bpmNum = parseInt(newTrackBpm) || 120;

    const newSong = {
      id: Date.now().toString(),
      title: newTrackTitle.trim(),
      duration: durationStr,
      bpm: bpmNum,
      checked: true
    };

    setPlaylist([...playlist, newSong]);
    setNewTrackTitle('');
    triggerNotification(`Added track: ${newSong.title}`);
    addLog(`[Survival Toolkit] Appended playlist track "${newSong.title}" (${durationStr} at ${bpmNum} BPM)`);
  };

  const toggleTrackChecked = (id: string) => {
    setPlaylist(playlist.map(p => p.id === id ? { ...p, checked: !p.checked } : p));
  };

  const handleDeleteTrack = (id: string) => {
    setPlaylist(playlist.filter(p => p.id !== id));
  };

  // Merch Settlement calculators
  const merchCalculations = useMemo(() => {
    // Standard retail formula for tax inclusive pools
    const taxFactor = 1 + (localTaxRate / 100);
    const taxAmount = merchGross - (merchGross / taxFactor);
    const grossLessTax = merchGross - taxAmount;
    
    // Credit card fee applies either to gross or ticket amount
    const creditCardDeduction = merchGross * (cardProcessingPct / 100);
    
    // Adjusted net venue pool matches standard split sheet models
    const adjustedPool = Math.max(0, merchGross - taxAmount - creditCardDeduction);
    const venueShare = adjustedPool * (venueSplitPct / 100);
    const artistPayoutShare = adjustedPool - venueShare;

    return {
      taxAmount,
      creditCardDeduction,
      adjustedPool,
      venueShare,
      artistPayoutShare
    };
  }, [merchGross, venueSplitPct, localTaxRate, cardProcessingPct]);

  // Fuel calculators
  const fuelCalculations = useMemo(() => {
    const gallonsNeeded = routeMiles / rigMpg;
    const fuelCost = gallonsNeeded * fuelPricePerGallon;
    const netTake = gigGuarantee - fuelCost;
    
    let marginStatus = '';
    let marginColor = '';
    if (netTake > 750) {
      marginStatus = "🚀 VERY LUCRATIVE RUN";
      marginColor = "text-[#00ffcc] bg-[#00ffcc]/10 border-[#00ffcc]/30";
    } else if (netTake > 300) {
      marginStatus = "🛣️ ROAD VIABLE COURSE";
      marginColor = "text-emerald-400 bg-emerald-950/20 border-emerald-900/30";
    } else if (netTake >= 0) {
      marginStatus = "⚠️ STRICT BREAK-EVEN ZONE";
      marginColor = "text-amber-400 bg-amber-950/20 border-amber-900/30";
    } else {
      marginStatus = "💸 CHARITY EXPOSURE GIG (NET COLD OVERHEAD)";
      marginColor = "text-rose-400 bg-rose-950/20 border-rose-900/30";
    }

    return {
      gallonsNeeded,
      fuelCost,
      netTake,
      marginStatus,
      marginColor
    };
  }, [routeMiles, rigMpg, fuelPricePerGallon, gigGuarantee]);

  const handleAddEmergencyContact = () => {
    if (!newEmergencyName.trim() || !newEmergencyPhone.trim()) {
      triggerNotification("Provide a name and phone number");
      return;
    }
    const newContact = {
      name: newEmergencyName.trim(),
      phone: newEmergencyPhone.trim(),
      type: newEmergencyType
    };
    setEmergencyPhoneLogs([...emergencyPhoneLogs, newContact]);
    setNewEmergencyName('');
    setNewEmergencyPhone('');
    triggerNotification(`Emergency backup contact "${newContact.name}" registered`);
    addLog(`[Survival Toolkit] Logged backup emergency link: "${newContact.name}" - ${newContact.phone}`);
  };

  const handleDeleteEmergencyContact = (idx: number) => {
    setEmergencyPhoneLogs(emergencyPhoneLogs.filter((_, i) => i !== idx));
  };

  // Get urgent notes for the warning rail at the top
  const urgentNotes = useMemo(() => {
    return notes.filter(n => n.tag_name?.toUpperCase() === 'URGENT');
  }, [notes]);

  // Search and Category Filters logic
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      // Hide internal NEXUS storage notes from the UI
      if (note.category?.startsWith('NEXUS_')) return false;

      // Category matches
      if (activeCategory !== 'All') {
        if (note.category?.toUpperCase() !== activeCategory.toUpperCase()) return false;
      }

      // Tag/Priority matches
      if (activeTag !== 'All') {
        if ((note.tag_name || 'NOTE').toUpperCase() !== activeTag.toUpperCase()) return false;
      }

      // Show association matches
      if (selectedShowFilter !== 'All') {
        if (selectedShowFilter === 'Unassigned') {
          if (note.show_id) return false;
        } else {
          if (note.show_id !== selectedShowFilter) return false;
        }
      }

      // Search query matches
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = note.text.toLowerCase().includes(q);
        const matchesCategory = note.category?.toLowerCase().includes(q) || false;
        const matchesTag = note.tag_name?.toLowerCase().includes(q) || false;
        return matchesText || matchesCategory || matchesTag;
      }

      return true;
    });
  }, [notes, activeCategory, activeTag, selectedShowFilter, searchQuery]);

  // Helper to find associated show name
  const getShowName = (showId?: string) => {
    if (!showId) return null;
    const matched = shows.find(s => s.id === showId);
    return matched ? matched.name : null;
  };

  // Helper to find show city
  const getShowCity = (showId?: string) => {
    if (!showId) return '';
    const matched = shows.find(s => s.id === showId);
    return matched?.city ? `, ${matched.city}` : '';
  };

  // Handle direct inline note submission
  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!newNoteText.trim()) return;

    setIsSubmitting(true);
    addLog(`Creating custom survival log note: "${newNoteText.substring(0, 15)}..."`);

    try {
      const payload = {
        text: newNoteText.trim(),
        category: newNoteCategory,
        tag_name: newNoteTagName,
        show_id: newNoteShowId || undefined
      };

      if (onSubmitNote) {
        await onSubmitNote(payload);
        triggerNotification("Tactical survival log entry recorded!");
        addLog(`Successfully logged note: Category [${newNoteCategory}], Tag [${newNoteTagName}]`);
        setNewNoteText('');
        setNewNoteCategory('LOGISTICS');
        setNewNoteTagName('NOTE');
        setNewNoteShowId('');
        setShowInlineCreate(false);
      } else {
        // Fallback or legacy trigger
        triggerNotification("Note recorded (legacy redirect called)");
        onAddNote();
      }
    } catch (err: any) {
      addLog(`Failed to submit inline note: ${err.message || err}`);
      triggerNotification("Error recorded; note queued offline");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Edit Mode on a specific note
  const startEditing = (note: TourNote) => {
    setEditingNoteId(note.id);
    setEditFormData({
      text: note.text,
      category: note.category || 'LOGISTICS',
      tag_name: note.tag_name || 'NOTE',
      show_id: note.show_id || ''
    });
    addLog(`Entered inline note edit mode for Note ID [${note.id}]`);
  };

  // Cancel edit mode
  const cancelEditing = () => {
    setEditingNoteId(null);
    addLog("Cancelled note editing.");
  };

  // Apply note editing updates
  const saveNoteUpdates = async (id: string) => {
    if (!editFormData.text.trim()) {
      triggerNotification("Note content cannot be empty.");
      return;
    }

    addLog(`Saving updates to Note ID [${id}]`);
    try {
      if (onUpdateNote) {
        onUpdateNote(id, {
          text: editFormData.text.trim(),
          category: editFormData.category,
          tag_name: editFormData.tag_name,
          show_id: editFormData.show_id || undefined
        });
        triggerNotification(" survival entry updated!");
        addLog(`Successfully updated note ID [${id}] fields`);
        setEditingNoteId(null);
      } else {
        triggerNotification("Note editing callback not active on portal.");
      }
    } catch (err: any) {
      addLog(`Failed to update note ID [${id}]: ${err.message || err}`);
      triggerNotification("Failed to update note.");
    }
  };

  return (
    <div className={toolkitOnly ? "w-full text-zinc-100 flex flex-col font-sans relative" : "bg-[#0c0e12] min-h-screen text-zinc-100 flex flex-col font-sans pb-16 relative"}>
      
      {!toolkitOnly && (
        <>
          {/* HEADER BAR */}
          <div className="relative border-b border-zinc-900 pb-3 pt-3 flex flex-col items-center justify-center text-center bg-[#0f1116] sticky top-0 z-40 gap-2 shadow-lg">
            
            {/* Centered Title Lockup */}
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <h1 
                  className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
                  style={{
                    textShadow: '0 0 12px rgba(239, 68, 68, 0.85), 0 0 24px rgba(239, 68, 68, 0.55), 0 0 36px rgba(185, 28, 28, 0.45)',
                    letterSpacing: '0.1em',
                    fontWeight: 950,
                    fontSize: '26px',
                    marginLeft: '0px',
                    marginTop: '0px'
                  }}
                >
                  Tour Notes
                </h1>
              </motion.div>
              <div className="max-w-[320px] mx-auto">
                <p 
                  className="text-zinc-400 font-mono tracking-wide leading-relaxed text-center"
                  style={{ marginTop: '-4px', fontSize: '10px' }}
                >
                  The ultimate road survival database. Log critical routing shifts, lock down immediate parking warnings, map out crew dinner logistics, and build a battle-tested daily journal from the frontline.
                </p>
              </div>
            </div>

          </div>
        </>
      )}

      <div className={toolkitOnly ? "w-full space-y-4" : "p-4 space-y-4 max-w-4xl mx-auto w-full"}>

        {!toolkitOnly && (
          <>
            {/* URGENT WARNING TICKER RAIL */}
            <AnimatePresence mode="popLayout">
          {urgentNotes.length > 0 ? (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-red-950/20 border-2 border-red-500/40 rounded-2xl p-3.5 shadow-lg shadow-red-950/30 flex flex-col gap-2 relative overflow-hidden"
              id="urgent-warnings-console"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl" />
              <div className="flex items-center gap-2 border-b border-red-500/20 pb-2">
                <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                <span className="text-[11px] font-mono tracking-wider font-extrabold text-red-400 uppercase">
                  CRITICAL DIRECTIVES & ROAD WARNINGS ({urgentNotes.length})
                </span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-2 pr-1 font-sans text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                {urgentNotes.slice(0, 3).map((note, idx) => (
                  <div key={`${note.id}-${idx}`} className="text-zinc-300 flex items-start gap-1.5 leading-normal">
                    <span className="text-red-500 font-bold select-none">•</span>
                    <span className="flex-1 text-[11px]">
                      <strong className="text-red-400 uppercase font-mono mr-1">[{note.category}]:</strong> 
                      {note.text} {note.show_id && <span className="text-emerald-400 font-mono text-[9px]">({getShowName(note.show_id)})</span>}
                    </span>
                  </div>
                ))}
                {urgentNotes.length > 3 && (
                  <div className="text-[9px] font-mono text-zinc-500 text-right uppercase italic">
                    + {urgentNotes.length - 3} more critical alerts logged below
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-zinc-950/40 border border-zinc-900/60 rounded-xl p-2 px-3 text-center text-[10px] font-mono text-zinc-500 flex items-center justify-center gap-2 tracking-wide"
              id="nominal-status-console"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ALL CHANNELS SECURE — NO ACTIVE ROAD HAZARD CRITICAL DIRECTIVES REPORTED</span>
            </motion.div>
          )}
        </AnimatePresence>

        
                {/* TOP WORKSPACE: INLINE NOTE CREATOR */}
        <div className="border border-zinc-900 bg-[#0c0e12]/80 backdrop-blur rounded-2xl overflow-hidden shadow-inner">
          <button 
            type="button"
            onClick={() => setShowInlineCreate(!showInlineCreate)}
            className="w-full p-3 px-4 flex items-center justify-between text-left hover:bg-zinc-900/40 transition-colors border-b border-zinc-950 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className={`w-4 h-4 text-[#00ffcc] transition-transform ${showInlineCreate ? 'rotate-45' : ''}`} />
              <span className="text-[11px] font-mono tracking-widest font-black text-zinc-300 uppercase">
                Add Tour Note
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/10">
              {showInlineCreate ? 'HIDE FORM' : 'ADD NOTE'}
            </span>
          </button>

          <AnimatePresence>
            {showInlineCreate && (
              <motion.form 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleInlineSubmit}
                className="overflow-hidden border-t border-zinc-900/40 bg-zinc-950/30 p-4 space-y-3"
              >
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest font-bold">
                    Note Text *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Log venue shifts, settlement details, parking warnings, catering guidelines, restock items etc..."
                    className="w-full bg-[#111319] border border-zinc-850 rounded-xl p-3 text-xs text-white placeholder-zinc-650 focus:outline-none focus:border-[#00ffcc] transition-colors font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Category select */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                      Log System Element
                    </label>
                    <div className="relative">
                      <select
                        value={newNoteCategory}
                        onChange={(e) => setNewNoteCategory(e.target.value)}
                        className="w-full bg-[#111319] border border-zinc-850 rounded-xl p-2.5 text-[11px] text-zinc-300 focus:outline-none focus:border-[#00ffcc] font-mono uppercase tracking-wider cursor-pointer appearance-none"
                      >
                        {NOTE_CATEGORIES.map((cat, idx) => (
                          <option key={`${cat}-${idx}`} value={cat} className="bg-[#111319]">{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Tag Name select */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                      Directives / Priority
                    </label>
                    <div className="relative">
                      <select
                        value={newNoteTagName}
                        onChange={(e) => setNewNoteTagName(e.target.value)}
                        className="w-full bg-[#111319] border border-zinc-850 rounded-xl p-2.5 text-[11px] text-zinc-300 focus:outline-none focus:border-[#00ffcc] font-mono uppercase tracking-wider cursor-pointer appearance-none"
                      >
                        {NOTE_TAGS.map((tag, idx) => (
                          <option key={`${tag}-${idx}`} value={tag} className="bg-[#111319]">{tag}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Show assignment select */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                      Assigned Show Location
                    </label>
                    <div className="relative">
                      <select
                        value={newNoteShowId}
                        onChange={(e) => setNewNoteShowId(e.target.value)}
                        className="w-full bg-[#111319] border border-zinc-850 rounded-xl p-2.5 text-[11px] text-zinc-300 focus:outline-none focus:border-[#00ffcc] font-mono cursor-pointer appearance-none text-ellipsis overflow-hidden whitespace-nowrap"
                      >
                        <option value="" className="bg-[#111319] font-mono uppercase text-[10px]">Unassigned / General</option>
                        {shows.map((s, sIdx) => (
                          <option key={`${s.id}-${sIdx}`} value={s.id} className="bg-[#111319] font-mono text-[10px]">
                            {s.name}{s.city ? ` - ${s.city}` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-zinc-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900/30">
                  <button
                    type="button"
                    onClick={() => {
                      setNewNoteText('');
                      setShowInlineCreate(false);
                    }}
                    className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs font-mono font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !newNoteText.trim()}
                    className={`${
                      isOffline 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/15' 
                        : 'bg-[#00ffcc] hover:bg-[#00e3b6] text-black'
                    } disabled:opacity-40 disabled:hover:bg-[#00ffcc] px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all uppercase flex items-center gap-1 cursor-pointer flex-row leading-none`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Recording...' : isOffline ? 'Save Log to Device' : 'Commit to Survival Log'}</span>
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* SECTOR SEARCH & MULTI-DIMENSIONAL FILTER BOARD */}
        <div className="bg-[#111319] border border-[#0000ff] p-3 sm:p-4 rounded-2xl space-y-2.5 sm:space-y-3.5 shadow-md">
          
          {/* SEARCH BAR BOX */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter frontline logs database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0e12] border border-purple-500/30 rounded-xl py-3 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-purple-400 font-mono transition-all placeholder-zinc-650"
            />
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-purple-500/50" />
            
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3.5 hover:text-white text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-zinc-900/40">
            {/* Show Specific Filter Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-500" /> Filter by Venue Venue Assignment
              </span>
              <div className="relative">
                <select
                  value={selectedShowFilter}
                  onChange={(e) => setSelectedShowFilter(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-purple-500/30 rounded-xl p-2.5 text-[11px] text-zinc-300 hover:text-white transition-colors focus:outline-none focus:border-purple-400 font-mono appearance-none cursor-pointer"
                >
                  <option value="All">All Show Locations</option>
                  <option value="Unassigned">Unassigned / General Notes</option>
                  {shows.map((s, sIdx) => (
                    <option key={`${s.id}-${sIdx}`} value={s.id}>{s.name} ({s.city || 'TBD'})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3.5 top-3.5 w-3 h-3 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Urgency Priority Filter pills */}
            <div className="flex flex-col gap-1">
              <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" /> Filter by Incident Directive State
              </span>
              <div className="flex flex-nowrap overflow-x-auto gap-1.5 p-1.5 bg-[#0c0e12] rounded-xl border border-purple-500/30 items-center justify-start min-h-[38px] px-2 scrollbar-none">
                {['All', ...NOTE_TAGS].map((tag, idx) => {
                  const isActive = activeTag === tag;
                  return (
                    <button
                      key={`${tag}-${idx}`}
                      onClick={() => setActiveTag(tag)}
                      className={`text-[9px] uppercase font-mono px-2 py-1 rounded-md tracking-wider font-extrabold transition-all cursor-pointer shrink-0 ${
                        isActive 
                        ? tag === 'URGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          tag === 'IMPORTANT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          tag === 'COMPLETE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
                      }`}
                    >
                      {tag === 'URGENT' ? '🚨 URGENT' : tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CATEGORY SELECTOR PILLS CAROUSEL */}
          <div className="space-y-1 pt-1.5 border-t border-zinc-900/40">
            <span className="text-[8.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Filter className="w-3 h-3 text-purple-400" /> Log Category Focus Segment
            </span>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {['All', ...NOTE_CATEGORIES].map((cat, idx) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={`${cat}-${idx}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-wider transition-all whitespace-nowrap relative shrink-0 cursor-pointer rounded-lg border ${
                      isActive 
                        ? 'text-[#00ffcc] bg-[#00ffcc]/5 border-[#00ffcc]/35' 
                        : 'text-zinc-400 bg-zinc-900/40 border-zinc-850 hover:text-zinc-200 hover:bg-zinc-900/80'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LIST OF NOTATIONS CARDS */}
        <div className="space-y-3.5 mt-2">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note, idx) => {
              const showName = getShowName(note.show_id);
              const showCity = getShowCity(note.show_id);
              const isEditing = editingNoteId === note.id;

              return (
                <div 
                  key={`${note.id}-${idx}`}
                  className={`bg-[#111319] border-2 rounded-2xl p-4.5 space-y-3 relative overflow-hidden group transition-all shadow-md ${
                    note.tag_name === 'URGENT' ? 'border-red-500/65 bg-red-950/5 shadow-lg shadow-red-950/20 hover:border-red-500' :
                    note.tag_name === 'COMPLETE' ? 'border-emerald-500/50 bg-[#111915]/20 hover:border-emerald-500' :
                    note.tag_name === 'IMPORTANT' ? 'border-amber-500/65 bg-amber-950/5 hover:border-amber-500' :
                    note.tag_name === 'LOOK INTO' ? 'border-blue-500/55 bg-blue-950/5 hover:border-blue-500' :
                    'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      /* EDITING COMPONENT MODE */
                      <motion.div 
                        key={`edit-pane-${note.id || idx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3 font-sans"
                      >
                        <div className="flex items-center gap-1.5 pb-2 border-b border-zinc-900">
                          <Edit3 className="w-4 h-4 text-[#00ffcc]" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-extrabold">
                            Update Survival Broadcast details
                          </span>
                        </div>

                        {/* Edit Text content */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                            Incident Narrative
                          </label>
                          <textarea
                            value={editFormData.text}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, text: e.target.value }))}
                            rows={3}
                            className="w-full bg-[#0c0e12] border border-zinc-800 p-2 text-xs rounded-xl text-white font-sans focus:outline-none focus:border-[#00ffcc]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Category select */}
                          <div className="space-y-1">
                            <label className="text-[8.5px] font-mono text-zinc-500 uppercase font-black">Category</label>
                            <select
                              value={editFormData.category}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                              className="w-full bg-[#0c0e12] border border-zinc-855 rounded-xl p-2 text-xs text-zinc-200 uppercase font-mono cursor-pointer"
                            >
                              {NOTE_CATEGORIES.map((cat, idx) => (
                                <option key={`${cat}-${idx}`} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>

                          {/* Tag selector */}
                          <div className="space-y-1">
                            <label className="text-[8.5px] font-mono text-zinc-500 uppercase font-black">Directive Priority</label>
                            <select
                              value={editFormData.tag_name}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, tag_name: e.target.value }))}
                              className="w-full bg-[#0c0e12] border border-zinc-855 rounded-xl p-2 text-xs text-zinc-200 uppercase font-mono cursor-pointer"
                            >
                              {NOTE_TAGS.map((tag, idx) => (
                                <option key={`${tag}-${idx}`} value={tag}>{tag}</option>
                              ))}
                            </select>
                          </div>

                          {/* Show select */}
                          <div className="space-y-1">
                            <label className="text-[8.5px] font-mono text-zinc-500 uppercase font-black">Show Assignment</label>
                            <select
                              value={editFormData.show_id}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, show_id: e.target.value }))}
                              className="w-full bg-[#0c0e12] border border-zinc-855 rounded-xl p-2 text-xs text-zinc-200 font-mono cursor-pointer text-ellipsis"
                            >
                              <option value="">Unassigned</option>
                              {shows.map((s, sIdx) => (
                                <option key={`${s.id}-${sIdx}`} value={s.id}>{s.name} ({s.city || 'TBD'})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900/30">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="px-3 py-1.5 border border-zinc-850 text-[10px] font-mono bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveNoteUpdates(note.id)}
                            className={`px-3.5 py-1.5 ${
                              isOffline 
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/15' 
                                : 'bg-[#00ffcc] hover:bg-[#00e3b6] text-black'
                            } text-[10px] font-mono font-bold rounded-lg transition-all flex items-center gap-1 uppercase leading-none cursor-pointer`}
                          >
                            <Save className="w-3 h-3" />
                            <span>{isOffline ? 'Save to Device' : 'Save Log'}</span>
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      /* STANDARD SHOW NOTE CARD */
                      <motion.div 
                        key={`view-pane-${note.id || idx}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono uppercase text-amber-400 tracking-wider font-extrabold bg-amber-400/5 px-2.5 py-0.5 rounded-md border border-amber-400/10 shadow-sm">
                            {note.category}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-650" />
                            {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Show assignment Indicator */}
                        {showName && (
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/25 px-2.5 py-1 rounded border border-emerald-900/30 w-fit shadow-inner">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>Assigned: <strong>{showName}</strong>{showCity}</span>
                          </div>
                        )}

                        <p className="text-xs text-zinc-250 leading-relaxed font-sans whitespace-pre-wrap selection:bg-[#00ffcc] selection:text-black">
                          {note.text}
                        </p>

                        <div className="flex justify-between items-center pt-2.5 border-t border-zinc-900/60 text-[10px] text-zinc-500">
                          <div className={`flex items-center gap-1.5 font-mono border px-2.5 py-0.5 rounded-md shadow-sm ${
                            note.tag_name === 'URGENT' ? 'bg-red-500/10 text-red-500 border-red-500/20 ring-1 ring-red-500/10' :
                            note.tag_name === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            note.tag_name === 'IMPORTANT' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            note.tag_name === 'LOOK INTO' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                          }`}>
                            <Tag className="w-3 h-3 text-current" />
                            <span className="uppercase text-[8px] font-black tracking-widest">{note.tag_name || 'NOTE'}</span>
                          </div>

                          <div className="flex gap-2">
                            {/* Inline Edit button */}
                            <button
                              onClick={() => startEditing(note)}
                              className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 text-[9px] font-mono uppercase font-black transition-all flex items-center gap-1 cursor-pointer"
                              title="Update incident entry fields inline"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit Mode</span>
                            </button>

                            <button 
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1 px-2.5 rounded bg-red-950/25 text-red-400 hover:bg-red-900/30 border border-red-900/10 text-[9px] font-mono uppercase font-black transition-colors flex items-center gap-1 cursor-pointer"
                              title="Delete Note"
                            >
                              <Trash2 className="w-3 h-3 text-red-400 shrink-0" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="py-6 bg-zinc-950/20 rounded-2xl border border-dashed border-zinc-900 text-center text-xs text-zinc-650 font-mono space-y-2.5 flex flex-col items-center justify-center">
              <StickyNote className="w-8 h-8 text-zinc-800" />
              <span>No matching tour notes discovered in active indices.</span>
              {(searchQuery || activeCategory !== 'All' || activeTag !== 'All' || selectedShowFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                    setActiveTag('All');
                    setSelectedShowFilter('All');
                  }}
                  className="px-3 py-1 text-[10px] text-[#00ffcc] bg-[#00ffcc]/5 border border-[#00ffcc]/20 rounded-full hover:bg-[#00ffcc]/15 transition-colors uppercase font-bold cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}
        </div>
          </>
        )}
{/* ============================== */}
        {/* MUSICIAN'S TACTICAL ROAD KITS */}
        {/* ============================== */}
        <div id="musician-tactical-kits" className="border-2 border-purple-500/20 bg-[#0f121a] rounded-2xl overflow-hidden shadow-xl shadow-purple-950/10 mb-[15px]">
          <div 
            onClick={() => setIsToolkitOpen(!isToolkitOpen)}
            className={`p-3.5 px-4 flex items-center justify-between bg-gradient-to-r from-purple-950/20 to-zinc-950 cursor-pointer select-none ${isToolkitOpen ? 'border-b border-zinc-900' : ''}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 px-2 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 font-mono text-[9px] font-black uppercase tracking-widest animate-pulse">
                SURVIVAL GADGETS
              </div>
              <h3 className="text-xs md:text-sm font-mono font-bold text-white tracking-wider uppercase flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#00ffcc]" />
                Musician's Tactical Road Toolkit
              </h3>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
              <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline text-zinc-550">
                {isToolkitOpen ? 'COLLAPSE CONSOLE' : 'EXPAND CONSOLE'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isToolkitOpen ? 'rotate-180 text-[#00ffcc]' : ''}`} />
            </div>
          </div>

          <AnimatePresence>
            {isToolkitOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                {/* TOOLKIT NAVIGATION SECTIONS */}
                <div className="grid grid-cols-2 border-b border-zinc-900 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-center">
                  <button
                    onClick={() => setActiveToolkitTab('merch')}
                    className={`p-3 border-r border-zinc-900 flex flex-col sm:flex-row items-center justify-center gap-1.5 focus:outline-none transition-colors cursor-pointer ${
                      activeToolkitTab === 'merch' 
                        ? 'text-emerald-400 bg-zinc-900/40 font-bold border-b border-b-emerald-400' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Merch Split</span>
                  </button>

                  <button
                    onClick={() => setActiveToolkitTab('emergency')}
                    className={`p-3 flex flex-col sm:flex-row items-center justify-center gap-1.5 focus:outline-none transition-colors cursor-pointer ${
                      activeToolkitTab === 'emergency' 
                        ? 'text-rose-400 bg-zinc-900/40 font-bold border-b border-b-rose-400' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
                    }`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Emergency</span>
                  </button>
                </div>

                <div className="p-4 bg-zinc-950/25">
                  <AnimatePresence mode="wait">

                    {/* tab 2: MERCH SPLIT CALCULATOR */}
                    {activeToolkitTab === 'merch' && (
                      <motion.div
                        key="tab-merch"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="space-y-4 text-left"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left inputs */}
                          <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-900 space-y-3 font-sans text-xs">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block font-bold">Sales Details</span>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                <span className="font-mono">GROSS MERCH SALES:</span>
                                <span className="text-white font-bold">${merchGross.toLocaleString()}</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="10000"
                                step="50"
                                value={merchGross}
                                onChange={(e) => setMerchGross(parseInt(e.target.value) || 0)}
                                className="w-full accent-emerald-400 cursor-pointer"
                              />
                              <div className="flex gap-2">
                                <span className="text-zinc-650 text-[10px] font-mono shrink-0 font-bold self-center">$</span>
                                <input
                                  type="number"
                                  value={merchGross}
                                  onChange={(e) => setMerchGross(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-1 text-xs font-mono font-bold focus:outline-none focus:border-emerald-400"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 pt-1">
                              <div className="space-y-1">
                                <label className="text-[8.5px] font-mono text-zinc-550 uppercase font-black block">Venue Cut %</label>
                                <input
                                  type="number"
                                  value={venueSplitPct}
                                  onChange={(e) => setVenueSplitPct(Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-1 text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8.5px] font-mono text-zinc-550 uppercase font-black block">Sales Tax %</label>
                                <input
                                  type="number"
                                  value={localTaxRate}
                                  onChange={(e) => setLocalTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-1 text-xs font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[8.5px] font-mono text-zinc-550 uppercase font-black block">CC Processing %</label>
                                <input
                                  type="number"
                                  value={cardProcessingPct}
                                  onChange={(e) => setCardProcessingPct(Math.max(0, parseFloat(e.target.value) || 0))}
                                  className="w-full bg-zinc-950 border border-zinc-800 text-white rounded p-1 text-xs font-mono"
                                />
                              </div>
                            </div>
                            
                            <p className="text-[8.5px] text-zinc-500 leading-normal font-mono uppercase italic">
                              * Computed using Standard Venue Settlement logic (gross is tax-inclusive). CC processing rate is deducted prior to sharing pool.
                            </p>
                          </div>

                          {/* Right results display mock terminal style */}
                          <div className="bg-zinc-950/70 border border-zinc-900 rounded-xl p-4 flex flex-col justify-between font-sans text-xs text-zinc-200">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 text-[10px] text-zinc-400 font-bold font-mono">
                                <span>Payout Calculation</span>
                              </div>

                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between py-0.5 text-xs text-zinc-400">
                                  <span>Gross Sales:</span>
                                  <span className="font-mono text-zinc-300">${merchGross.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 text-xs text-zinc-400">
                                  <span>Sales Tax ({localTaxRate}%):</span>
                                  <span className="font-mono text-rose-400">-${merchCalculations.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 text-xs text-zinc-400">
                                  <span>CC Fees ({cardProcessingPct}%):</span>
                                  <span className="font-mono text-rose-400">-${merchCalculations.creditCardDeduction.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 text-xs text-zinc-400 border-t border-zinc-900/60 pt-1.5">
                                  <span>Adjusted Net Pool:</span>
                                  <span className="font-mono text-zinc-300">${merchCalculations.adjustedPool.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-0.5 text-xs text-zinc-400">
                                  <span>Venue Cuts ({venueSplitPct}%):</span>
                                  <span className="font-mono text-rose-400">-${merchCalculations.venueShare.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-dashed border-zinc-800 mt-4 pt-3 flex flex-col gap-1">
                              <div className="flex justify-between items-baseline">
                                <span className="text-emerald-400 font-bold font-sans text-xs">Take-Home Pay:</span>
                                <span className="text-lg font-bold text-emerald-400 font-mono select-all">
                                  ${merchCalculations.artistPayoutShare.toFixed(2)}
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-550 text-right font-mono">Net retention: {merchGross > 0 ? Math.round((merchCalculations.artistPayoutShare / merchGross) * 100) : 0}% of retail gross</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* tab 4: EMERGENCY RESPONSE */}
                    {activeToolkitTab === 'emergency' && (
                      <motion.div
                        key="tab-emergency"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 5 }}
                        className="space-y-4 text-xs font-sans text-left"
                      >
                        {/* Emergency protocol lists */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-900 space-y-3">
                            <span className="text-[10px] font-mono text-rose-500 uppercase tracking-wider block font-bold flex items-center gap-1.5">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              <span>Emergency Guides</span>
                            </span>

                            {/* Horizontal selectable tag-strip container */}
                            <div className="flex overflow-x-auto space-x-2 py-1 scrollbar-none mb-2">
                              {[
                                { label: "Breakdown", title: "⚡ Van Highway Mechanical Failure", desc: "Guide: Steer to right shoulder. Turn on hazard flasher arrays. Check towing policy. Log active location coords immediately. Dial Van Tow dispatch." },
                                { label: "Canceled Show", title: "❌ Promoter Reneges / Shows Cancel", desc: "Guide: Retain contracts. Document local proof. Check if flight covers apply. Attempt to shift to nearest open community venue or secondary gig." },
                                { label: "Payment Dispute", title: "🤝 Split Settlement Disputes", desc: "Guide: Do not count-out merchandise without fully securing artist guarantee. Present the live Settlement matrix. Contact agent or band council." }
                              ].map((item, idx) => {
                                const isSelected = activeEmergencyIndex === idx;
                                return (
                                  <button
                                    key={`tour-note-row-${idx}`}
                                    type="button"
                                    onClick={() => setActiveEmergencyIndex(idx)}
                                    className={`text-[10px] px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-colors border cursor-pointer focus:outline-none ${
                                      isSelected
                                        ? 'bg-rose-950/20 border-rose-500 text-rose-200'
                                        : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-zinc-200'
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Selected Guide Details */}
                            {(() => {
                              const guides = [
                                { title: "⚡ Van Highway Mechanical Failure", desc: "Guide: Steer to right shoulder. Turn on hazard flasher arrays. Check towing policy. Log active location coords immediately. Dial Van Tow dispatch." },
                                { title: "❌ Promoter Reneges / Shows Cancel", desc: "Guide: Retain contracts. Document local proof. Check if flight covers apply. Attempt to shift to nearest open community venue or secondary gig." },
                                { title: "🤝 Split Settlement Disputes", desc: "Guide: Do not count-out merchandise without fully securing artist guarantee. Present the live Settlement matrix. Contact agent or band council." }
                              ];
                              const currentGuide = guides[activeEmergencyIndex] || guides[0];
                              return (
                                <div className="bg-zinc-950/40 p-3 border border-zinc-900 rounded-xl space-y-1.5">
                                  <div className="font-bold text-[10.5px] uppercase font-mono text-zinc-200">{currentGuide.title}</div>
                                  <p className="text-[10.5px] text-zinc-300 leading-relaxed font-sans">{currentGuide.desc}</p>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Quick emergency dials */}
                          <div className="bg-[#1a1114]/40 border border-rose-955 p-3.5 rounded-xl space-y-3 flex flex-col justify-between">
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider font-bold block">
                                Emergency Contacts
                              </span>

                              <div className="max-h-40 overflow-y-auto space-y-1.5 scrollbar-thin">
                                {emergencyPhoneLogs.map((contact, idx) => (
                                  <div key={`tour-note-sub-${idx}`} className="bg-zinc-950/50 border border-zinc-900 rounded p-1.5 flex justify-between items-center mb-1.5 text-xs">
                                    <div className="min-w-0 text-left">
                                      <div className="flex items-center gap-1.5 leading-none mb-1">
                                        <span className="text-[8.5px] text-rose-400 font-mono font-bold uppercase tracking-wider">{contact.type}</span>
                                        <span className="text-zinc-500 text-[9px] font-mono">| {contact.phone}</span>
                                      </div>
                                      <div className="text-zinc-200 font-sans font-semibold text-[10.5px] truncate">{contact.name}</div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 ml-1">
                                      <a 
                                        href={`tel:${contact.phone}`}
                                        className="text-[10.5px] font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          triggerNotification(`Dispatching simulated call to ${contact.name} (${contact.phone})...`);
                                        }}
                                      >
                                        [ 📞 Dial ]
                                      </a>
                                      <button 
                                        onClick={() => handleDeleteEmergencyContact(idx)}
                                        className="p-1 text-zinc-600 hover:text-red-400 rounded transition-colors cursor-pointer"
                                        title="Delete contact"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Add emergency entry */}
                            <div className="space-y-2 pt-2 border-t border-rose-950/40">
                              <div className="grid grid-cols-2 gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Contact Name (e.g. Mechanic)"
                                  value={newEmergencyName}
                                  onChange={(e) => setNewEmergencyName(e.target.value)}
                                  className="bg-zinc-950 border border-zinc-850 text-white rounded p-1 px-2 text-[10.5px] focus:outline-none w-full"
                                />
                                <input
                                  type="text"
                                  placeholder="Phone (e.g. 555-0199)"
                                  value={newEmergencyPhone}
                                  onChange={(e) => setNewEmergencyPhone(e.target.value)}
                                  className="bg-zinc-950 border border-zinc-850 text-white rounded p-1 px-2 text-[10.5px] focus:outline-none w-full"
                                />
                              </div>
                              <div className="flex gap-1.5">
                                <select 
                                  value={newEmergencyType}
                                  onChange={(e) => setNewEmergencyType(e.target.value)}
                                  className="bg-[#241113] border border-zinc-850 text-zinc-300 text-[10px] rounded p-1 cursor-pointer uppercase font-mono grow"
                                >
                                  <option value="ROAD REPAIR">ROAD REPAIR</option>
                                  <option value="RIG TOWING">RIG TOWING</option>
                                  <option value="LEGAL COUNCIL">LEGAL AID</option>
                                  <option value="AGENT CONTACT">AGENT ESCALATION</option>
                                  <option value="TOUR CLAIMS">INSURANCE</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={handleAddEmergencyContact}
                                  className="bg-rose-600 hover:bg-rose-500 border border-rose-700 shrink-0 text-white font-mono text-[9px] font-black uppercase px-3 py-1 rounded-md cursor-pointer"
                                >
                                  + SAVE LINK
                                </button>
                              </div>
                            </div>

                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!toolkitOnly && (
        /* FLOAT ACTION BUTTON FOR NOTES WRAPPER (HI FIDELITY ACCORDING TO SCREENSHOT 2) */
        <div className="fixed bottom-26 right-5 z-40 flex items-center gap-2">
          <span className="bg-[#111319]/90 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-mono tracking-widest uppercase font-bold text-[#00ffcc] shadow-xl">
            ADD NEW NOTE
          </span>
          <button
            onClick={onAddNote}
            className="w-13 h-13 rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all outline-none border-2 border-amber-600/30 ring-4 ring-amber-500/10 cursor-pointer"
            title="Add Custom Note"
          >
            <Plus className="w-7 h-7 text-black stroke-[3]" />
          </button>
        </div>
      )}

    </div>
  );
}
