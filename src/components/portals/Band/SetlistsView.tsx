import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ChevronLeft, Save, Plus, Trash2, Edit2, ChevronUp, ChevronDown, 
  Music, Copy, RefreshCw, Clock, Sparkles, Check, X, ListMusic, Search, Flame, Zap,
  Printer
} from 'lucide-react';
import { Show } from '../../../types';
import { getSupabase } from '../../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import InfoTip from '../../InfoTip';

export interface SetlistSong {
  id: string;
  name: string;
  minutes: number;
  seconds: number;
  vibe?: string;
}

export interface Setlist {
  showId: string;
  allottedMinutes: number;
  allottedSeconds: number;
  songs: SetlistSong[];
  client_id?: string;
  is_synced?: boolean;
}

export type VibeType = 'opener' | 'heavy' | 'groove' | 'atmospheric' | 'anthem' | 'closer' | 'instrumental' | 'interlude' | 'mid-pace' | 'break';

export interface MasterSong {
  id: string;
  name: string;
  minutes: number;
  seconds: number;
  vibe?: string;
}

interface SetlistsViewProps {
  shows: Show[];
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
}

export default function SetlistsView({
  shows,
  onBack,
  triggerNotification,
  addLog
}: SetlistsViewProps) {
  // Load initial active show
  const [selectedShowId, setSelectedShowId] = useState<string>('');

  // Sound Synthesis Cue Player for tactile feedback
  const playSetlistSynthSound = (type: 'add' | 'click' | 'delete' | 'success' | 'reorder' | 'edit') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'edit') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(554.37, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'reorder') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(392.00, ctx.currentTime + 0.1); // G4
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'add') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.14); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.21); // C6
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'delete') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(349.23, ctx.currentTime); // F4
        osc.frequency.linearRampToValueAtTime(174.61, ctx.currentTime + 0.18); // F3
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(698.46, ctx.currentTime + 0.08);
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.16);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.24);
        gain.gain.setValueAtTime(0.09, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.38);
        osc.start();
        osc.stop(ctx.currentTime + 0.38);
      }
    } catch (_) {
      // Audio safety block
    }
  };

  // Seeded initial Master Song Bank
  const [masterSongs, setMasterSongs] = useState<MasterSong[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_master_song_bank');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      { id: 'm1', name: 'Symbiotic Voracity', minutes: 5, seconds: 30, vibe: 'opener' },
      { id: 'm2', name: 'Relentless Devastation', minutes: 4, seconds: 15, vibe: 'heavy' },
      { id: 'm3', name: 'Voracious Cleansing', minutes: 3, seconds: 45, vibe: 'groove' },
      { id: 'm4', name: 'Eradication Echoes', minutes: 6, seconds: 12, vibe: 'atmospheric' },
      { id: 'm5', name: 'Ascension Failure', minutes: 4, seconds: 50, vibe: 'anthem' },
      { id: 'm6', name: 'Savage Synthesis', minutes: 5, seconds: 10, vibe: 'opener' },
      { id: 'm7', name: 'Ocular Obliteration', minutes: 3, seconds: 15, vibe: 'heavy' },
      { id: 'm8', name: 'Cerebral Devourment', minutes: 4, seconds: 23, vibe: 'groove' }
    ];
  });

  // Local state for all setlists
  const [setlists, setSetlists] = useState<Record<string, Setlist>>(() => {
    try {
      const masterCache = localStorage.getItem('nexus_master_setlists');
      if (masterCache) {
        return JSON.parse(masterCache);
      }
      const saved = localStorage.getItem('nexus_core_setlists');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });

  // Collapsible views state
  const [isSongBankCollapsed, setIsSongBankCollapsed] = useState(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Custom states for Master tracks inline editing
  const [editingMasterId, setEditingMasterId] = useState<string | null>(null);
  const [editMasterName, setEditMasterName] = useState('');
  const [editMasterMin, setEditMasterMin] = useState(4);
  const [editMasterSec, setEditMasterSec] = useState(0);
  const [editMasterVibe, setEditMasterVibe] = useState<VibeType | undefined>(undefined);

  // Drag and drop tracking
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Load state for new Master song addition
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterMin, setNewMasterMin] = useState(4);
  const [newMasterSec, setNewMasterSec] = useState(0);
  const [newMasterVibe, setNewMasterVibe] = useState<VibeType | undefined>(undefined);

  // Search filter for master song bank
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and Drop action handles
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    if (sourceIndexStr === '') return;
    const sourceIndex = parseInt(sourceIndexStr, 10);
    if (sourceIndex === targetIndex) return;

    const list = [...activeSetlist.songs];
    const draggedItem = list[sourceIndex];
    // Remove the item
    list.splice(sourceIndex, 1);
    // Insert at target index
    list.splice(targetIndex, 0, draggedItem);

    updateActiveSetlist({ songs: list });
    playSetlistSynthSound('reorder');
    addLog(`Setlist reordered via drag-and-drop: moved index ${sourceIndex} to ${targetIndex}`);
  };

  // Editing song inside currents show setlist
  const [editingSongInSetId, setEditingSongInSetId] = useState<string | null>(null);
  const [editSongName, setEditSongName] = useState('');
  const [editSongMin, setEditSongMin] = useState(0);
  const [editSongSec, setEditSongSec] = useState(0);

  // Swapping mode: stores the setlist song ID that is currently being swapped with a master song
  const [swappingSongId, setSwappingSongId] = useState<string | null>(null);

  // Pre-load selecting first show if available
  useEffect(() => {
    if (shows && shows.length > 0 && !selectedShowId) {
      // Find the upcoming show or fallback to first
      const today = new Date().toISOString().split('T')[0];
      const nextShow = shows.find(s => s.date >= today) || shows[0];
      setSelectedShowId(nextShow.id);
    }
  }, [shows]);

  // Load from Supabase on mount (Real dynamic syncing)
  useEffect(() => {
    const syncWithSupabase = async () => {
      const supabase = getSupabase();
      if (!supabase || !navigator.onLine) return;

      try {
        // Load repertoire songs
        const { data: repData, error: repErr } = await supabase
          .from('repertoire_songs')
          .select('*')
          .order('name', { ascending: true });
        
        if (!repErr && repData && repData.length > 0) {
          const mappedRep: MasterSong[] = repData.map((d: any) => ({
            id: d.id,
            name: d.name,
            minutes: d.minutes,
            seconds: d.seconds
          }));
          setMasterSongs(mappedRep);
          addLog(`Synchronized ${mappedRep.length} repertoire song definitions from Supabase.`);
        }

        // Load setlists
        const { data: setlistsData, error: setlistsErr } = await supabase
          .from('setlists')
          .select('*');

        if (!setlistsErr && setlistsData && setlistsData.length > 0) {
          const mappedLists: Record<string, Setlist> = {};
          setlistsData.forEach((d: any) => {
            mappedLists[d.show_id] = {
              showId: d.show_id,
              allottedMinutes: d.allotted_minutes,
              allottedSeconds: d.allotted_seconds,
              songs: d.songs || []
            };
          });
          setSetlists(prev => ({
            ...prev,
            ...mappedLists
          }));
          addLog(`Synchronized setlist records for ${setlistsData.length} tour stops from Supabase.`);
        }
      } catch (err) {
        console.error('Supabase initial setlist synchronization error:', err);
      }
    };

    syncWithSupabase();
  }, []);

  // Persist master song bank
  useEffect(() => {
    localStorage.setItem('nexus_core_master_song_bank', JSON.stringify(masterSongs));
  }, [masterSongs]);

  // Persist setlists map
  useEffect(() => {
    localStorage.setItem('nexus_core_setlists', JSON.stringify(setlists));
  }, [setlists]);

  // Find or construct the active show setlist
  const activeSetlist: Setlist = setlists[selectedShowId] || {
    showId: selectedShowId,
    allottedMinutes: 60,
    allottedSeconds: 0,
    songs: []
  };

  const updateActiveSetlist = (updatedFields: Partial<Setlist>) => {
    if (!selectedShowId) return;
    setSetlists(prev => {
      const current = prev[selectedShowId] || {
        showId: selectedShowId,
        allottedMinutes: 60,
        allottedSeconds: 0,
        songs: []
      };
      const updated = {
        ...current,
        ...updatedFields
      };

      // Background write sync to Supabase table
      const supabase = getSupabase();
      if (supabase && navigator.onLine) {
        supabase.from('setlists').upsert({
          show_id: selectedShowId,
          allotted_minutes: updated.allottedMinutes,
          allotted_seconds: updated.allottedSeconds,
          songs: updated.songs
        }).then(({ error }) => {
          if (error) {
            console.error('Supabase setlist upsert error:', error);
          } else {
            addLog(`Committed setlist changes to Supabase for show stop ${selectedShowId}`);
          }
        });
      }

      return {
        ...prev,
        [selectedShowId]: updated
      };
    });
  };

  // Add song from master bank to active setlist
  const handleAddMasterToSetlist = (mSong: MasterSong) => {
    if (!selectedShowId) {
      triggerNotification('Please select a show stop first.');
      return;
    }
    const newSong: SetlistSong = {
      id: 'ss_' + Math.random().toString(36).substring(2, 9),
      name: mSong.name,
      minutes: mSong.minutes,
      seconds: mSong.seconds,
      vibe: mSong.vibe || 'heavy'
    };
    updateActiveSetlist({
      songs: [...activeSetlist.songs, newSong]
    });
    playSetlistSynthSound('add');
    triggerNotification(`Added "${mSong.name}" to tonight's setlist!`);
    addLog(`Assigned master song ${mSong.name} to show ID: ${selectedShowId}`);
  };

  const handleAddBreak = () => {
    if (!selectedShowId) {
      triggerNotification('Please select a show stop first.');
      return;
    }
    const newBreak: SetlistSong = {
      id: 'ss_break_' + Math.random().toString(36).substring(2, 9),
      name: 'BREAK / INTERMISSION',
      minutes: 2,
      seconds: 0,
      vibe: 'break'
    };
    updateActiveSetlist({
      songs: [...activeSetlist.songs, newBreak]
    });
    playSetlistSynthSound('add');
    triggerNotification('Added an intermission break to tonight\'s timeline!');
    addLog(`Setlist modification: Inserted a break of 2:00 minutes`);
  };

  // Add a brand new track to Master Song Bank
  const handleCreateMasterSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim()) return;
    
    // Check if duplicate name
    if ((masterSongs || []).some(m => m.name.toLowerCase() === newMasterName.trim().toLowerCase())) {
      triggerNotification('Repertoire already contains this track name.');
      return;
    }

    const newM: MasterSong = {
      id: 'm_' + Math.random().toString(36).substring(2, 9),
      name: newMasterName.trim(),
      minutes: Number(newMasterMin) || 0,
      seconds: Number(newMasterSec) || 0,
      vibe: newMasterVibe
    };

    // Save definition to Supabase repertoire table when online
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('repertoire_songs').insert({
          id: newM.id,
          name: newM.name,
          minutes: newM.minutes,
          seconds: newM.seconds
        });
        if (error) throw error;
        addLog(`Synchronized custom repertoire track definition to database: ${newM.name}`);
      } catch (err: any) {
        console.error('Supabase repertoire write unsuccessful:', err);
      }
    }

    setMasterSongs(prev => [newM, ...prev]);
    setNewMasterName('');
    setNewMasterMin(4);
    setNewMasterSec(0);
    playSetlistSynthSound('success');
    triggerNotification(`Added "${newM.name}" to global Repertoire bank!`);
    addLog(`Repertoire Bank: Saved song candidate ${newM.name}`);
  };

  // Remove song from Master Bank
  const handleDeleteMasterSong = async (id: string, name: string) => {
    // Delete from Supabase repertoire table when online
    const supabase = getSupabase();
    if (supabase && navigator.onLine) {
      try {
        const { error } = await supabase.from('repertoire_songs').delete().eq('id', id);
        if (error) throw error;
        addLog(`Deleted repertoire track definition from database: ${name}`);
      } catch (err: any) {
        console.error('Supabase repertoire delete unsuccessful:', err);
      }
    }

    setMasterSongs(prev => prev.filter(m => m.id !== id));
    playSetlistSynthSound('delete');
    triggerNotification(`Removed "${name}" from repertoire database.`);
    addLog(`Repertoire Bank: Eliminated song candidate ID: ${id}`);
  };

  // Delete song from active Show setlist
  const handleDeleteFromSetlist = (songId: string, songName: string) => {
    updateActiveSetlist({
      songs: activeSetlist.songs.filter(s => s.id !== songId)
    });
    playSetlistSynthSound('delete');
    triggerNotification(`Removed "${songName}" from tonight's setlist.`);
    addLog(`Setlist modification: Removed song ID ${songId}`);
  };

  // Move song Up / Down in the active setlist
  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    const list = [...activeSetlist.songs];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    updateActiveSetlist({ songs: list });
    playSetlistSynthSound('reorder');
    addLog(`Setlist reordered: swapped sequence for index ${index}`);
  };

  // Clone from another show setlist
  const handleCopySetlistFromShow = (fromShowId: string) => {
    const source = setlists[fromShowId];
    if (!source || source.songs.length === 0) {
      triggerNotification('The selected source show has an empty setlist.');
      return;
    }
    // Deep copy songs with new IDs to prevent overlap issues
    const copiedSongs = source.songs.map(s => ({
      ...s,
      id: 'ss_' + Math.random().toString(36).substring(2, 9)
    }));

    updateActiveSetlist({
      allottedMinutes: source.allottedMinutes,
      allottedSeconds: source.allottedSeconds,
      songs: copiedSongs
    });
    triggerNotification(`Copied ${copiedSongs.length} songs from the selected show stop!`);
    addLog(`Setlist clone: copied sequence into ${selectedShowId}`);
  };

  // Trigger swap flow
  const handleSwapSongWithMaster = (setlistSongId: string, targetMasterSong: MasterSong) => {
    const list = activeSetlist.songs.map(s => {
      if (s.id === setlistSongId) {
        return {
          ...s,
          name: targetMasterSong.name,
          minutes: targetMasterSong.minutes,
          seconds: targetMasterSong.seconds,
          vibe: targetMasterSong.vibe || s.vibe
        };
      }
      return s;
    });
    updateActiveSetlist({ songs: list });
    setSwappingSongId(null);
    playSetlistSynthSound('success');
    triggerNotification(`Successfully swapped with track "${targetMasterSong.name}"!`);
    addLog(`Setlist: Swapped slot track with Master Bank item.`);
  };

  // Start editing a setlist song inline
  const startEditingSetlistSong = (song: SetlistSong) => {
    setEditingSongInSetId(song.id);
    setEditSongName(song.name);
    setEditSongMin(song.minutes);
    setEditSongSec(song.seconds);
    playSetlistSynthSound('edit');
  };

  const saveEditingSetlistSong = () => {
    if (!editingSongInSetId) return;
    const list = activeSetlist.songs.map(s => {
      if (s.id === editingSongInSetId) {
        return {
          ...s,
          name: editSongName.trim() || s.name,
          minutes: Math.max(0, editSongMin),
          seconds: Math.max(0, Math.min(59, editSongSec))
        };
      }
      return s;
    });
    updateActiveSetlist({ songs: list });
    setEditingSongInSetId(null);
    playSetlistSynthSound('success');
    triggerNotification('Song adjustments saved.');
    addLog('Adjusted setlist song parameters inline.');
  };

  // Edit and Save actions for Master Rep Song Bank
  const handleEditMasterSong = (song: MasterSong) => {
    setEditingMasterId(song.id);
    setEditMasterName(song.name);
    setEditMasterMin(song.minutes);
    setEditMasterSec(song.seconds);
    setEditMasterVibe(song.vibe as any || undefined);
  };

  const saveEditingMasterSong = async () => {
    if (!editingMasterId) return;
    
    const updatedSongs = masterSongs.map(m => {
      if (m.id === editingMasterId) {
        return {
          ...m,
          name: editMasterName.trim() || m.name,
          minutes: Math.max(0, editMasterMin),
          seconds: Math.max(0, Math.min(59, editMasterSec)),
          vibe: editMasterVibe
        };
      }
      return m;
    });

    // Propagate modified metadata if that song is currently inside activeShow setlist
    const updatedActiveSongs = activeSetlist.songs.map(s => {
      const originalM = masterSongs.find(m => m.id === editingMasterId);
      if (originalM && s.name.toLowerCase() === originalM.name.toLowerCase()) {
        return {
          ...s,
          name: editMasterName.trim() || s.name,
          minutes: Math.max(0, editMasterMin),
          seconds: Math.max(0, Math.min(59, editMasterSec)),
          vibe: editMasterVibe
        };
      }
      return s;
    });

    setMasterSongs(updatedSongs);
    updateActiveSetlist({ songs: updatedActiveSongs });
    setEditingMasterId(null);
    playSetlistSynthSound('success');
    triggerNotification('Master song templates updated!');
    addLog(`Master Song Bank: Adjusted template parameters for song ID: ${editingMasterId}`);
  };

  // Calculate times
  const totalSeconds = activeSetlist.songs.reduce((acc, s) => acc + (s.minutes * 60) + s.seconds, 0);
  const allottedSecondsTotal = (activeSetlist.allottedMinutes * 60) + activeSetlist.allottedSeconds;
  const remainingSecondsTotal = allottedSecondsTotal - totalSeconds;

  const formatMinSec = (totalSecs: number) => {
    const absSecs = Math.abs(totalSecs);
    const m = Math.floor(absSecs / 60);
    const s = absSecs % 60;
    return `${totalSecs < 0 ? '-' : ''}${m}:${s.toString().padStart(2, '0')}`;
  };

  const selectedShow = shows.find(s => s.id === selectedShowId);

  // Filter master song bank
  const filteredMasterSongs = masterSongs.filter(m => {
    const isAlreadySlotted = (activeSetlist.songs || []).some(s => s.name.toLowerCase() === m.name.toLowerCase());
    return !isAlreadySlotted && m.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#08090d] text-white pb-6" id="setlists-scheduler-page-container">
      
      {/* Smart Nav Header */}
      <div 
        className="relative border-b border-[#1b1f28] pb-4 pt-4 flex flex-col items-center justify-center text-center bg-[#0d0f14]/90 backdrop-blur-md sticky top-0 z-30 gap-1 sm:gap-2"
      >
        
        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <motion.h1 
              animate={{
                textShadow: [
                  '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)',
                  '0 0 20px rgba(59, 130, 246, 0.85), 0 0 35px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.4)',
                  '0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)'
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
              style={{
                letterSpacing: '0.1em',
                fontWeight: 950,
                fontSize: '26px',
                marginLeft: '0px',
                marginTop: '0px'
              }}
            >
              Setlist Creator
            </motion.h1>
            <InfoTip 
              title="SETLIST ORCHESTRATOR"
              bullets={[
                "CREATE AND ORDER DETAILED GIG SONGS FOR SPECIFIC SHOW BOOKINGS.",
                "REAL-TIME TIMING TOTALIZES RUNNING MINUTES/SECONDS AUTO.",
                "ELEGANT PRINTER GIG REPORT EXPORTER FORMATS ON-STAGE ROAD SHEETS.",
                "ASSIGN ENERGY OR VIBES PRESETS TO CURATE PACE CRITICAL FLOWS."
              ]}
              accentColor="#3b82f6"
              position="bottom-right"
            />
          </motion.div>
          <p 
            className="text-[10px] md:text-xs text-zinc-400 font-mono tracking-wide max-w-xl leading-relaxed text-center"
            style={{ marginTop: '-4px', width: '329.809px' }}
          >
            Design dynamic performance setlists, calculate target show timings, share printable gig templates, and optimize transition tempos.
          </p>
        </div>
      </div>

      <div className="px-4 py-5 max-w-[490px] mx-auto space-y-6">
        
        {/* Dynamic header summary info */}
        <div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">Setlist For</span>
          <div className="relative">
            <select
              value={selectedShowId}
              onChange={(e) => {
                setSelectedShowId(e.target.value);
                setSwappingSongId(null);
                setEditingSongInSetId(null);
              }}
              className="w-full bg-[#11141c] border-2 border-purple-950/40 hover:border-purple-500/50 rounded-xl p-3 text-xs uppercase font-mono tracking-wide text-white focus:outline-none focus:border-purple-500 cursor-pointer appearance-none transition-colors"
            >
              {shows.length === 0 ? (
                <option value="">-- No shows registered yet --</option>
              ) : (
                shows.map((s, sIdx) => (
                  <option key={`${s.id}-${sIdx}`} value={s.id}>
                    {s.festival_name || s.name} ({s.date}) {s.city ? `• ${s.city}` : ''}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-purple-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
        </div>

        {/* CLONE PANEL */}
        {shows.length > 1 && (
          <div 
            className="p-3 border border-[#2a2d36]/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-left gap-3 bg-[#0d162a]"
          >
            <div className="space-y-0.5">
              <span className="text-[9px] font-mono text-purple-300 uppercase tracking-wider block">Re-use Previous Configuration</span>
              <p className="text-[10px] text-zinc-400">Duplicate tracks & timeline structure from another registered stop</p>
            </div>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleCopySetlistFromShow(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-[#090b0f] border border-purple-900/40 hover:border-purple-500 text-[10px] font-mono rounded p-2 focus:outline-none focus:border-purple-400 text-purple-300 cursor-pointer w-full sm:w-auto min-w-[130px]"
            >
              <option value="" disabled>Clone from...</option>
              {shows.filter(s => s.id !== selectedShowId).map((s, sIdx) => (
                <option key={`${s.id}-${sIdx}`} value={s.id}>
                  {s.festival_name || s.name} ({s.date})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ALLOTTED STAGE TIME */}
        {selectedShowId && (
          <div className="p-4 bg-[#11141c]/90 border border-[#1d222e] rounded-xl space-y-3.5 text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#00ffcc] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#00ffcc]" /> Allotted Stage Time
              </h3>
              {activeSetlist.is_synced === false ? (
                <span className="text-[9px] font-mono font-bold text-amber-500 tracking-tight animate-pulse">[ ▰ OFFLINE CACHED ]</span>
              ) : (
                <span className="text-[9px] font-mono font-bold text-emerald-500/80 tracking-tight transition-all">[ ✓ SYNCED ]</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  value={activeSetlist.allottedMinutes}
                  onChange={(e) => updateActiveSetlist({ allottedMinutes: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-full bg-[#08090d] border border-[#2e3440] rounded-lg p-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-[#00ffcc]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-zinc-500 uppercase mb-1">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={activeSetlist.allottedSeconds}
                  onChange={(e) => updateActiveSetlist({ allottedSeconds: Math.max(0, Math.min(59, parseInt(e.target.value) || 0)) })}
                  className="w-full bg-[#08090d] border border-[#2e3440] rounded-lg p-2.5 text-xs text-white text-center font-mono focus:outline-none focus:border-[#00ffcc]"
                />
              </div>
            </div>
          </div>
        )}

        {/* SCORE METRICS STATS DOCK */}
        {selectedShowId && (
          <div className="grid grid-cols-3 gap-2.5">
            {/* Total Set length */}
            <div className="bg-[#12141c]/80 border border-zinc-850 p-2.5 rounded-xl flex flex-col items-center">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Total Set</span>
              <span className="text-xs font-mono font-black text-purple-400">
                {formatMinSec(totalSeconds)}
              </span>
            </div>

            {/* Total Allotted */}
            <div className="bg-[#12141c]/80 border border-zinc-850 p-2.5 rounded-xl flex flex-col items-center">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Allotted</span>
              <span className="text-xs font-mono font-bold text-zinc-300">
                {formatMinSec(allottedSecondsTotal)}
              </span>
            </div>

            {/* Remaining Time */}
            <div className={`border p-2.5 rounded-xl flex flex-col items-center transition-colors ${
              remainingSecondsTotal < 0 
                ? 'bg-rose-950/20 border-rose-800/40 text-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]' 
                : 'bg-emerald-950/20 border-emerald-800/40 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.1)]'
            }`}>
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block mb-1">Remaining</span>
              <span className="text-xs font-mono font-black">
                {formatMinSec(remainingSecondsTotal)}
              </span>
            </div>
          </div>
        )}

        {/* TODAY'S SETLIST CARD */}
        {selectedShowId && (
          <div 
            className="p-4 border border-zinc-850 rounded-xl space-y-3.5 text-left shadow-lg bg-[#1a0232]"
          >
            <div className="border-b border-zinc-800/60 pb-3 flex flex-col items-center justify-center text-center gap-3">
              <div className="space-y-0.5">
                <h3 className="text-xl md:text-2xl font-display font-black tracking-widest text-white flex items-center justify-center gap-2 select-text uppercase">
                  <ListMusic className="w-5 h-5 text-purple-400 animate-pulse" /> TODAY'S SETLIST
                </h3>
                <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                  {activeSetlist.songs.filter(s => s.vibe !== 'break').length} SONG{activeSetlist.songs.filter(s => s.vibe !== 'break').length !== 1 ? 'S' : ''} SCHEDULED
                </p>
              </div>

              <div className="flex items-center justify-center gap-1.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddBreak}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 border border-amber-450/35 hover:border-amber-400 rounded bg-amber-400/5 hover:bg-amber-400/20 transition-all cursor-pointer shadow-[0_0_8px_rgba(255,170,0,0.08)]"
                >
                  <Clock className="w-3.5 h-3.5" /> + ADD BREAK
                </button>

                {activeSetlist.songs.length > 0 && (
                  <button
                    onClick={() => {
                      playSetlistSynthSound('click');
                      setIsPrintModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#00ffcc] border border-[#00ffcc]/35 hover:border-[#00ffcc] rounded bg-[#00ffcc]/5 hover:bg-[#00ffcc]/20 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,255,204,0.1)]"
                  >
                    <Printer className="w-3.5 h-3.5" /> PRINT SETLIST
                  </button>
                )}

                {remainingSecondsTotal < 0 ? (
                  <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1 px-2 py-1 bg-rose-950/30 border border-rose-800/40 rounded">
                    ⚠️ OVERTIME RISK
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider flex items-center gap-1 px-2 py-1 bg-emerald-950/30 border border-emerald-800/40 rounded">
                    ❇️ TIME STABLE
                  </span>
                )}
              </div>
            </div>

            {activeSetlist.songs.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2.5 bg-[#090b0f]/50 rounded-xl border border-dashed border-zinc-850">
                <Music className="w-10 h-10 text-zinc-800 animate-pulse stroke-[1.5]" />
                <p className="text-xs text-zinc-400 font-bold">No tracks slotted in yet</p>
                <p className="text-[10px] text-zinc-600 font-mono max-w-[220px] leading-relaxed">Choose tracks from your master song bank below to populate tonight's tour card!</p>
              </div>
            ) : (
              <div className="space-y-2 select-none">
                <AnimatePresence initial={false}>
                {activeSetlist.songs.map((song, idx) => {
                  // Render small helper vibe badge
                  const renderVibeBadge = (vibe?: string) => {
                    if (!vibe) return null;
                    const presets: Record<string, { label: string; textClass: string; bgClass: string; borderClass: string }> = {
                      opener: { label: '🔥 OPEN', textClass: 'text-red-400', bgClass: 'bg-red-950/20', borderClass: 'border-red-500/20' },
                      heavy: { label: '💀 BRUTAL', textClass: 'text-purple-400', bgClass: 'bg-purple-950/20', borderClass: 'border-purple-500/20' },
                      groove: { label: '⚡ GROOVE', textClass: 'text-amber-400', bgClass: 'bg-amber-950/20', borderClass: 'border-amber-500/20' },
                      atmospheric: { label: '🌌 SYNTH', textClass: 'text-cyan-400', bgClass: 'bg-cyan-950/20', borderClass: 'border-cyan-500/20' },
                      anthem: { label: '👑 ANTHEM', textClass: 'text-emerald-400', bgClass: 'bg-emerald-950/20', borderClass: 'border-emerald-500/20' },
                      closer: { label: '🔒 CLOSER', textClass: 'text-indigo-400', bgClass: 'bg-indigo-950/20', borderClass: 'border-indigo-500/20' },
                      instrumental: { label: '🎻 INST', textClass: 'text-violet-400', bgClass: 'bg-violet-950/20', borderClass: 'border-violet-500/20' },
                      interlude: { label: '⏳ INTER', textClass: 'text-rose-400', bgClass: 'bg-rose-950/20', borderClass: 'border-rose-500/20' },
                      'mid-pace': { label: '🥁 MID', textClass: 'text-blue-400', bgClass: 'bg-blue-950/20', borderClass: 'border-blue-500/20' },
                    };
                    const config = presets[vibe] || presets.heavy;
                    return (
                      <span className={`text-[7px] font-mono font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${config.bgClass} ${config.textClass} ${config.borderClass}`}>
                        {config.label}
                      </span>
                    );
                  };

                  const isBreak = song.vibe === 'break' || song.name.toLowerCase().includes('break');

                  if (isBreak) {
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        key={`setlist-song-${song.id || 'song'}-${idx}`} 
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, idx)}
                        onDragOver={(e: any) => handleDragOver(e)}
                        onDrop={(e: any) => handleDrop(e, idx)}
                        onDragEnd={() => setDraggingIndex(null)}
                        className={`p-2.5 rounded-xl border border-dashed text-left flex justify-between items-start gap-2 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                          draggingIndex === idx 
                            ? 'border-amber-500 bg-amber-950/20 opacity-40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                            : 'border-amber-500/35 bg-amber-950/5 hover:border-amber-500/60 hover:bg-amber-950/10 shadow-sm'
                        }`}
                      >
                        {/* Grab visual + Break title */}
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="text-amber-500/40 font-mono text-xs select-none mt-0.5">⋮⋮</span>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-amber-550 font-bold">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              <span className="text-xs font-black text-amber-400 tracking-wider">⚡ BREAK / INTERMISSION</span>
                            </div>
                            
                            {/* Inline duration adjustments directly on the card (same-level layout) */}
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mr-1">Duration:</span>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newMin = Math.max(0, song.minutes - 1);
                                    const updatedSongs = activeSetlist.songs.map((s, i) => i === idx ? { ...s, minutes: newMin } : s);
                                    updateActiveSetlist({ songs: updatedSongs });
                                    playSetlistSynthSound('click');
                                  }}
                                  className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-[10px] font-black cursor-pointer transition select-none"
                                >
                                  -
                                </button>
                                <span className="font-mono text-[10px] text-zinc-200 w-6 text-center font-bold">
                                  {song.minutes}m
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newMin = song.minutes + 1;
                                    const updatedSongs = activeSetlist.songs.map((s, i) => i === idx ? { ...s, minutes: newMin } : s);
                                    updateActiveSetlist({ songs: updatedSongs });
                                    playSetlistSynthSound('click');
                                  }}
                                  className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-[10px] font-black cursor-pointer transition select-none"
                                >
                                  +
                                </button>
                              </div>
                              
                              <span className="text-zinc-650 font-mono text-[9px] mx-0.5 select-none">:</span>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let newSec = song.seconds - 15;
                                    let newMin = song.minutes;
                                    if (newSec < 0) {
                                      if (newMin > 0) {
                                        newMin -= 1;
                                        newSec = 45;
                                      } else {
                                        newSec = 0;
                                      }
                                    }
                                    const updatedSongs = activeSetlist.songs.map((s, i) => i === idx ? { ...s, minutes: newMin, seconds: newSec } : s);
                                    updateActiveSetlist({ songs: updatedSongs });
                                    playSetlistSynthSound('click');
                                  }}
                                  className="px-1.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-[8px] font-bold cursor-pointer transition select-none"
                                >
                                  -15s
                                </button>
                                <span className="font-mono text-[10px] text-zinc-200 w-7 text-center font-bold">
                                  {song.seconds.toString().padStart(2, '0')}s
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let newSec = song.seconds + 15;
                                    let newMin = song.minutes;
                                    if (newSec >= 60) {
                                      newMin += 1;
                                      newSec = 0;
                                    }
                                    const updatedSongs = activeSetlist.songs.map((s, i) => i === idx ? { ...s, minutes: newMin, seconds: newSec } : s);
                                    updateActiveSetlist({ songs: updatedSongs });
                                    playSetlistSynthSound('click');
                                  }}
                                  className="px-1.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white text-[8px] font-bold cursor-pointer transition select-none"
                                >
                                  +15s
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side: Delete Break Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveSetlist({
                              songs: activeSetlist.songs.filter((_, i) => i !== idx)
                            });
                            playSetlistSynthSound('delete');
                            triggerNotification('Removed intermission break.');
                          }}
                          className="p-1 px-2 text-zinc-500 hover:text-red-400 bg-zinc-900 border border-zinc-850 hover:border-red-500/30 rounded transition flex items-center justify-center cursor-pointer text-[10px] shrink-0 font-bold self-start mt-0.5"
                          title="Remove break"
                        >
                          ✕
                        </button>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      key={`setlist-draggable-${song.id || 's'}-${idx}`} 
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, idx)}
                      onDragOver={(e: any) => handleDragOver(e)}
                      onDrop={(e: any) => handleDrop(e, idx)}
                      onDragEnd={() => setDraggingIndex(null)}
                      className={`p-3 rounded-xl border text-left flex justify-between items-center transition-all duration-200 cursor-grab active:cursor-grabbing ${
                        draggingIndex === idx 
                          ? 'border-purple-500 bg-purple-950/20 opacity-40 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                          : 'border-zinc-800 bg-[#090b0f] hover:border-zinc-700 hover:bg-[#0c0f16]'
                      }`}
                    >
                      {/* Left side: Grab pattern indicator + Title/Vibe */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-zinc-650 font-mono text-xs select-none">⋮⋮</span>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-purple-400 font-bold">
                              {String(idx + 1).padStart(2, '0')}.
                            </span>
                            <span className="text-xs font-semibold text-white tracking-wide truncate">{song.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-zinc-500">
                              Duration: {song.minutes}:{song.seconds.toString().padStart(2, '0')}
                            </span>
                            {renderVibeBadge(song.vibe)}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Delete/Remove Trigger only ("x") */}
                      <button
                        type="button"
                        onClick={() => handleDeleteFromSetlist(song.id, song.name)}
                        className="p-1 px-2 text-zinc-405 hover:text-red-400 bg-zinc-900 border border-zinc-850 hover:border-red-500/30 rounded transition-colors cursor-pointer text-[10px]"
                        title="Remove song and return to bank"
                      >
                        ✕
                      </button>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* COLLAPSIBLE PACING TIMELINE CARD */}
        {selectedShowId && activeSetlist.songs.length > 0 && (
          <div 
            className="p-4 border border-[#1d222e] rounded-xl space-y-3.5 text-left bg-[#151516] relative overflow-hidden shadow-md"
          >
            <div 
              onClick={() => {
                playSetlistSynthSound('click');
                setIsTimelineCollapsed(!isTimelineCollapsed);
              }}
              className="flex justify-between items-center cursor-pointer select-none"
            >
              <h3 className="text-[10px] font-mono font-bold tracking-widest uppercase text-teal-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> TOURING PACING TIMELINE
              </h3>
              <div className="flex items-center gap-2.5">
                <span className="text-[8px] font-mono text-zinc-500 uppercase">
                  {isTimelineCollapsed ? "Show details" : "Hide details"}
                </span>
                <span className="text-zinc-500 text-xs font-mono">{isTimelineCollapsed ? "▼" : "▲"}</span>
              </div>
            </div>

            {!isTimelineCollapsed && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 pt-2 border-t border-zinc-900"
              >
                {/* Continuous progress segmented bar */}
                <div className="w-full h-4 rounded-full bg-zinc-950/60 p-0.5 border border-zinc-900 flex overflow-hidden shadow-inner select-none">
                  {activeSetlist.songs.map((song, idx) => {
                    const songSecs = (song.minutes * 60) + song.seconds;
                    const pct = totalSeconds > 0 ? (songSecs / totalSeconds) * 100 : 0;
                    
                    // Decide color palette based on song tag/vibe
                    let bgGradient = "from-zinc-650 to-zinc-500";
                    if (song.vibe === 'break' || song.name.toLowerCase().includes('break')) {
                      bgGradient = "from-amber-600 to-yellow-500";
                    } else if (song.vibe === 'opener') {
                      bgGradient = "from-red-500 via-rose-500 to-pink-500";
                    } else if (song.vibe === 'heavy') {
                      bgGradient = "from-purple-650 via-fuchsia-600 to-violet-500";
                    } else if (song.vibe === 'groove') {
                      bgGradient = "from-amber-500 via-yellow-500 to-orange-400";
                    } else if (song.vibe === 'atmospheric') {
                      bgGradient = "from-cyan-500 via-sky-500 to-blue-500";
                    } else if (song.vibe === 'anthem') {
                      bgGradient = "from-emerald-500 via-green-500 to-teal-400";
                    } else if (song.vibe === 'closer') {
                      bgGradient = "from-indigo-600 via-indigo-500 to-indigo-400";
                    } else if (song.vibe === 'instrumental') {
                      bgGradient = "from-violet-600 via-violet-500 to-violet-400";
                    } else if (song.vibe === 'interlude') {
                      bgGradient = "from-rose-500 via-rose-450 to-rose-400";
                    } else if (song.vibe === 'mid-pace') {
                      bgGradient = "from-blue-600 via-sky-550 to-cyan-500";
                    }

                    return (
                      <div 
                        key={`setlist-song-${song.id || 's'}-${idx}`}
                        title={`${idx + 1}. ${song.name} (${song.minutes}:${song.seconds.toString().padStart(2, '0')})`}
                        style={{ width: `${pct}%` }}
                        className={`h-full bg-gradient-to-r ${bgGradient} border-r border-zinc-950/40 relative group first:rounded-l-full last:rounded-r-full transition-all duration-300 hover:opacity-95 cursor-help`}
                      />
                    );
                  })}
                </div>

                {/* Quick interactive Pacing Legend */}
                <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 pt-1 justify-center border-t border-zinc-900/10">
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-red-500" /> Opener
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Brutal Metal
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Groove
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-cyan-500" /> Atmospheric
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Anthem
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-500" /> Closer
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-violet-500" /> Instrumental
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Interlude
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500" /> Mid-pace
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase flex items-center gap-1 select-none">
                    <span className="w-2.5 h-2.5 rounded bg-yellow-600" /> Break
                  </span>
                </div>
                
                {/* Advisor Recommendation tool */}
                {remainingSecondsTotal > 0 && (
                  <div className="mt-1 pt-2 border-t border-zinc-900/40 flex items-center justify-between gap-1.5 text-[9px] font-mono">
                     <span className="text-zinc-400 flex items-center gap-1">
                       <Zap className="w-3 h-3 text-emerald-400 animate-pulse" /> Squeeze in <span className="text-emerald-400 font-bold">{formatMinSec(remainingSecondsTotal)}</span> more of airtime.
                     </span>
                     <button
                       type="button"
                       onClick={() => {
                         const candidate = filteredMasterSongs.find(m => {
                           const mDuration = (m.minutes * 60) + m.seconds;
                           return mDuration <= remainingSecondsTotal;
                         });

                         if (candidate) {
                           handleAddMasterToSetlist(candidate);
                         } else {
                           triggerNotification('No matching song can fit perfectly within the remaining budget timeframe.');
                         }
                       }}
                       className="px-2 py-0.5 rounded bg-[#00ffcc]/10 border border-[#00ffcc]/25 hover:bg-[#00ffcc] hover:text-black font-semibold text-[8px] text-[#00ffcc] cursor-pointer transition-all uppercase"
                     >
                       FIT SUGGESTION
                     </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}

        {/* PRINT BLUEPRINT PREVIEW MODAL OVERLAY */}
        <AnimatePresence>
          {isPrintModalOpen && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-100 text-black p-5 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
              >
                <div className="flex justify-between items-center border-b border-zinc-300 pb-3 mb-4 shrink-0">
                  <div className="text-left font-sans">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">BluePrint Stage Specs</span>
                    <h2 className="font-black text-base tracking-tight uppercase text-zinc-900">GigSet Print Room</h2>
                  </div>
                  <button
                    onClick={() => setIsPrintModalOpen(false)}
                    className="p-1 text-zinc-400 hover:text-black hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Print layout sheet content */}
                <div id="stage-printable-setlist" className="bg-[#fcf8f2] border-2 border-zinc-850 p-6 rounded-xl flex-1 overflow-y-auto font-sans text-zinc-900 shadow-inner">
                  <div className="border-b-4 border-zinc-900 pb-3 mb-4 text-center">
                    <span className="text-[9px] font-mono font-bold uppercase bg-zinc-900 text-white px-2 py-0.5 rounded">STAGE MASTER PRINT</span>
                    <p className="font-black text-xl uppercase tracking-wider mt-2 font-display">{selectedShow?.festival_name || selectedShow?.name || "LIVE SET"}</p>
                    <p className="text-[11px] font-mono text-zinc-500 font-extrabold uppercase mt-1">
                      DATE: {selectedShow?.date} {selectedShow?.city ? `// SPOT: ${selectedShow.city}` : ''}
                    </p>
                    <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                      ALLOTTED SECONDS: {formatMinSec(allottedSecondsTotal)} MIN // REALTIME TIMING: {formatMinSec(totalSeconds)} MIN
                    </p>
                  </div>

                  {/* High contrast legibility numbered listings */}
                  <div className="space-y-3 text-left">
                    {activeSetlist.songs.map((song, i) => {
                      const isBreak = song.vibe === 'break' || song.name.toLowerCase().includes('break');
                      return (
                        <div key={`setlist-active-${song.id || 'song'}-${i}`} className={`flex justify-between items-baseline border-b pb-2 ${isBreak ? 'border-amber-300 border-dashed text-amber-700' : 'border-zinc-200 text-zinc-900'}`}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-zinc-500">{String(i + 1).padStart(2, '0')}.</span>
                            <span className={`font-black tracking-wide ${isBreak ? 'text-sm italic text-amber-600 uppercase' : 'text-lg text-zinc-900'}`}>{song.name}</span>
                          </div>
                          <span className="font-mono font-extrabold text-sm text-zinc-650 shrink-0">
                            [{song.minutes}:{song.seconds.toString().padStart(2, '0')}]
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-3 border-t border-zinc-300 font-mono text-[8px] text-zinc-400 text-center leading-normal">
                    <p>COSMIC NEXUS OS // gig template synced</p>
                    <p>© 2026 NEXUS CORE ALL RIGHTS RESERVED</p>
                  </div>
                </div>

                {/* Actions bottom bar */}
                <div className="mt-4 pt-3 border-t border-zinc-200 flex gap-3 shrink-0 font-mono">
                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(false)}
                    className="flex-1 py-2 text-[10px] font-bold uppercase tracking-wider border border-zinc-350 hover:bg-zinc-200/50 rounded-xl transition cursor-pointer text-zinc-700"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const printContents = document.getElementById('stage-printable-setlist')?.innerHTML;
                      if (printContents) {
                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                          printWindow.document.write(`
                            <html>
                              <head>
                                <title>PRINT STAGE SETLIST</title>
                                <style>
                                  body { font-family: sans-serif; background: white; color: black; padding: 40px; margin: 0; }
                                  #stage-printable-setlist { width: 100%; border: 3px solid black; padding: 30px; border-radius: 8px; box-sizing: border-box; }
                                  .text-center { text-align: center; }
                                  .space-y-3 > * + * { margin-top: 14px; }
                                  .flex { display: flex; }
                                  .justify-between { justify-content: space-between; }
                                  .items-baseline { align-items: baseline; }
                                  .items-center { align-items: center; }
                                  .gap-2 { gap: 8px; }
                                  .border-b { border-bottom: 1px solid #ccc; }
                                  .border-b-4 { border-bottom: 4px solid black; }
                                  .pb-2 { padding-bottom: 8px; }
                                  .pb-3 { padding-bottom: 12px; }
                                  .mb-4 { margin-bottom: 16px; }
                                  .font-mono { font-family: monospace; }
                                  .font-bold { font-weight: bold; }
                                  .font-black { font-weight: 900; }
                                  .font-extrabold { font-weight: 800; }
                                  .text-zinc-500 { color: #666; }
                                  .text-zinc-650 { color: #555; }
                                  .text-zinc-400 { color: #888; }
                                  .text-sm { font-size: 14px; }
                                  .text-lg { font-size: 20px; }
                                  .text-xl { font-size: 24px; }
                                  .uppercase { text-transform: uppercase; }
                                  .block { display: block; }
                                  .w-fit { width: fit-content; }
                                  .mx-auto { margin-left: auto; margin-right: auto; }
                                  .bg-zinc-900 { background: black; color: white; }
                                  .py-0\\.5 { padding-top: 2px; padding-bottom: 2px; }
                                  .px-2 { padding-left: 8px; padding-right: 8px; }
                                  .mt-2 { margin-top: 8px; }
                                  .mt-1 { margin-top: 4px; }
                                  .mt-0\\.5 { margin-top: 2px; }
                                  .mt-6 { margin-top: 24px; }
                                  .pt-3 { padding-top: 12px; }
                                </style>
                              </head>
                              <body>
                                \${printContents}
                                <script type="text/javascript">
                                  window.onload = function() { window.print(); window.close(); }
                                </script>
                              </body>
                            </html>
                          `);
                          printWindow.document.close();
                        }
                      }
                    }}
                    className="flex-1 py-1.5 bg-[#00ffcc] hover:brightness-110 text-black font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Printer className="w-3.5 h-3.5" /> TRIGGER PRINT
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* YOUR SONG BANK (COLLAPSIBLE) */}
        <div className="p-4 bg-[#240000] border border-purple-950/40 rounded-xl space-y-4 text-left">
          <div 
            onClick={() => {
              playSetlistSynthSound('click');
              setIsSongBankCollapsed(!isSongBankCollapsed);
            }}
            className="border-b border-zinc-800/60 pb-3 flex flex-col items-center justify-center text-center gap-3 cursor-pointer select-none"
          >
            <div className="space-y-0.5">
              <h3 className="text-[24px] font-display font-black tracking-widest text-[#ffffff] select-text uppercase">
                YOUR SONG BANK
              </h3>
              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                {masterSongs.length} TRACK{masterSongs.length !== 1 ? 'S' : ''} REGISTERED
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                {isSongBankCollapsed ? "Expand song bank tools" : "Collapse song bank tools"}
              </span>
              <span className="text-zinc-500 text-xs font-mono">{isSongBankCollapsed ? "▼" : "▲"}</span>
            </div>
          </div>

          {!isSongBankCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Add to Master view */}
              <form onSubmit={handleCreateMasterSong} className="p-3 bg-[#08090d]/90 border border-purple-950/30 rounded-xl space-y-3.5">
                <span className="text-[9px] font-mono font-black text-[#be0000] uppercase tracking-widest block">Compile New Track Candidate</span>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Song name (e.g. Voracious Cleansing)"
                    value={newMasterName}
                    onChange={(e) => setNewMasterName(e.target.value)}
                    className="w-full bg-[#11141c] border border-zinc-850 focus:border-purple-500 rounded-lg p-2.5 text-xs text-white focus:outline-none placeholder:text-zinc-650 font-mono tracking-wide"
                  />
                  
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div>
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={newMasterMin || ''}
                        onChange={(e) => setNewMasterMin(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-[#11141c] border border-zinc-850 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 text-center font-mono placeholder:text-zinc-650 text-white"
                      />
                      <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-wide">Mins</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Sec"
                        value={newMasterSec || ''}
                        onChange={(e) => setNewMasterSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-full bg-[#11141c] border border-zinc-850 rounded-lg p-2.5 focus:outline-none focus:border-purple-500 text-center font-mono placeholder:text-zinc-650 text-white"
                      />
                      <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-wide">Secs</span>
                    </div>
                  </div>

                  {/* Tag/Performance Vibe Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wide block">Track Performance Vibe</span>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-[8px] font-mono font-bold uppercase select-none">
                      {(['opener', 'heavy', 'groove', 'atmospheric', 'anthem', 'closer', 'instrumental', 'interlude', 'mid-pace'] as const).map((v, vIdx) => {
                        let activeStyle = '';
                        let inactiveStyle = 'border-zinc-850 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-zinc-950/45';
                        if (v === 'opener') activeStyle = 'bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
                        else if (v === 'heavy') activeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.1)]';
                        else if (v === 'groove') activeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]';
                        else if (v === 'atmospheric') activeStyle = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.1)]';
                        else if (v === 'anthem') activeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
                        else if (v === 'closer') activeStyle = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.1)]';
                        else if (v === 'instrumental') activeStyle = 'bg-violet-500/20 text-violet-300 border-violet-550/50 shadow-[0_0_10px_rgba(139,92,246,0.1)]';
                        else if (v === 'interlude') activeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
                        else if (v === 'mid-pace') activeStyle = 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]';

                        return (
                          <button
                            key={`${v}-${vIdx}`}
                            type="button"
                            onClick={() => { setNewMasterVibe(prev => prev === v ? undefined : v); playSetlistSynthSound('click'); }}
                            className={`py-1.5 px-0.5 rounded-lg border text-center transition-all cursor-pointer ${newMasterVibe === v ? activeStyle : inactiveStyle}`}
                            style={v === 'heavy' && newMasterVibe === v ? { backgroundColor: '#581c87' } : undefined}
                          >
                            {v === 'opener' ? 'OPENER' : v === 'heavy' ? 'BRUTAL' : v === 'groove' ? 'GROOVE' : v === 'atmospheric' ? 'SYNTH' : v === 'anthem' ? 'ANTHEM' : v === 'closer' ? 'CLOSER' : v === 'instrumental' ? 'INST' : v === 'interlude' ? 'INTER' : 'MID'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newMasterName.trim()}
                  className="w-full py-2 flex items-center justify-center gap-1.5 border border-purple-500/40 bg-purple-950/20 hover:bg-purple-900 hover:text-white text-purple-300 font-mono font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-all cursor-pointer disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Save to master Repertoire
                </button>
              </form>

              {/* Search bar inside master bank */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search your song bank..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#08090d] border border-zinc-850 focus:border-purple-500 rounded-xl p-2 pl-9 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              {/* Master bank tracks list */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {filteredMasterSongs.length === 0 ? (
                  <p className="text-[10px] text-zinc-650 font-mono text-center py-4">No tracks left in bank matching query.</p>
                ) : (
                  filteredMasterSongs.map((m, mIdx) => {
                    // Render small helper vibe badge
                    const renderMasterVibeBadge = (vibe?: string) => {
                      if (!vibe) return null;
                      const presets: Record<string, { label: string; textClass: string }> = {
                        opener: { label: '🔥 OPN', textClass: 'text-red-400/80' },
                        heavy: { label: '💀 MET', textClass: 'text-purple-400/80' },
                        groove: { label: '⚡ GRV', textClass: 'text-amber-400/80' },
                        atmospheric: { label: '🌌 SYN', textClass: 'text-cyan-400/80' },
                        anthem: { label: '👑 ATH', textClass: 'text-emerald-400/80' },
                        closer: { label: '🔒 CLS', textClass: 'text-indigo-400/80' },
                        instrumental: { label: '🎻 INS', textClass: 'text-violet-400/80' },
                        interlude: { label: '⏳ INT', textClass: 'text-rose-450/80' },
                        'mid-pace': { label: '🥁 MID', textClass: 'text-blue-400/80' },
                      };
                      const config = presets[vibe] || presets.heavy;
                      return (
                        <span className={`text-[7px] font-mono font-bold uppercase tracking-wider ${config.textClass}`}>
                          ({config.label})
                        </span>
                      );
                    };

                    if (editingMasterId === m.id) {
                      return (
                        <motion.div 
                          key={`master-track-${m.id || 'master'}-${mIdx}`}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3 bg-[#08090d]/90 border border-emerald-500/40 rounded-xl space-y-3.5 text-left"
                        >
                          <div className="flex justify-between items-center pb-1.5 border-b border-zinc-90 w-full">
                            <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Adjust Track Specifications</span>
                            <button 
                              type="button" 
                              onClick={() => setEditingMasterId(null)}
                              className="text-zinc-500 hover:text-white transition cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Track Name</label>
                              <input
                                type="text"
                                value={editMasterName}
                                onChange={(e) => setEditMasterName(e.target.value)}
                                className="w-full bg-[#11141c] border border-zinc-850 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Minutes</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editMasterMin}
                                  onChange={(e) => setEditMasterMin(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-full bg-[#11141c] border border-zinc-850 rounded-lg p-2.5 text-center text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Seconds</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="59"
                                  value={editMasterSec}
                                  onChange={(e) => setEditMasterSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                  className="w-full bg-[#11141c] border border-zinc-850 rounded-lg p-2.5 text-center text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[8px] font-mono text-zinc-500 uppercase tracking-wider mb-1">Performance Vibe</label>
                              <div className="grid grid-cols-3 gap-1 text-[8px] font-mono font-bold uppercase select-none">
                                {(['opener', 'heavy', 'groove', 'atmospheric', 'anthem', 'closer', 'instrumental', 'interlude', 'mid-pace'] as const).map((v, vIdx) => {
                                  let activeStyle = '';
                                  let inactiveStyle = 'border-zinc-850 text-zinc-500 hover:border-zinc-700 bg-[#11141c]';
                                  if (v === 'opener') activeStyle = 'bg-red-500/20 text-red-300 border-red-500/50 shadow-sm';
                                  else if (v === 'heavy') activeStyle = 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-sm';
                                  else if (v === 'groove') activeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm';
                                  else if (v === 'atmospheric') activeStyle = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm';
                                  else if (v === 'anthem') activeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm';
                                  else if (v === 'closer') activeStyle = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm';
                                  else if (v === 'instrumental') activeStyle = 'bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-sm';
                                  else if (v === 'interlude') activeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm';
                                  else if (v === 'mid-pace') activeStyle = 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-sm';

                                  return (
                                    <button
                                      key={`${v}-${vIdx}`}
                                      type="button"
                                      onClick={() => { setEditMasterVibe(prev => prev === v ? undefined : v); playSetlistSynthSound('click'); }}
                                      className={`py-1 rounded border text-center transition-all cursor-pointer ${editMasterVibe === v ? activeStyle : inactiveStyle}`}
                                      style={v === 'heavy' && editMasterVibe === v ? { backgroundColor: '#581c87' } : undefined}
                                    >
                                      {v === 'opener' ? 'OPENER' : v === 'heavy' ? 'BRUTAL' : v === 'groove' ? 'GROOVE' : v === 'atmospheric' ? 'SYNTH' : v === 'anthem' ? 'ANTHEM' : v === 'closer' ? 'CLOSER' : v === 'instrumental' ? 'INST' : v === 'interlude' ? 'INTER' : 'MID'}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-1.5 pt-2 border-t border-zinc-900 font-mono">
                            <button
                              type="button"
                              onClick={() => setEditingMasterId(null)}
                              className="px-2.5 py-1 bg-zinc-800 text-[9px] font-bold rounded uppercase hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveEditingMasterSong}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black text-[9px] font-bold rounded uppercase cursor-pointer transition text-center"
                            >
                              Save Specs
                            </button>
                          </div>
                        </motion.div>
                      );
                    }

                    return (
                      <motion.div 
                        layout
                        whileHover={{ scale: 1.015, x: 2 }}
                        transition={{ duration: 0.15 }}
                        key={`${m.id}-${mIdx}`} 
                        className="p-2.5 bg-[#0a0b10] border border-zinc-850 hover:border-zinc-800 rounded-xl flex justify-between items-center transition"
                      >
                        <div className="text-left space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-zinc-200 block">{m.name}</span>
                            {renderMasterVibeBadge(m.vibe)}
                          </div>
                          <span className="text-[9px] font-mono text-zinc-550 block">Time: {m.minutes}:{m.seconds.toString().padStart(2, '0')}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddMasterToSetlist(m)}
                            className="px-2.5 py-1.5 bg-[#00ffcc]/10 border border-[#00ffcc]/35 hover:bg-[#00ffcc] hover:text-black hover:border-[#00ffcc] font-mono text-[9px] tracking-wider font-extrabold uppercase rounded-lg text-[#00ffcc] transition-all transform active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditMasterSong(m)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-950/20 border border-emerald-900/30 hover:border-emerald-500/40 rounded transition cursor-pointer shrink-0"
                            title="Edit track parameters"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMasterSong(m.id, m.name)}
                            className="p-1.5 text-zinc-650 hover:text-red-400 transition cursor-pointer shrink-0"
                            title="Decommission track"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
