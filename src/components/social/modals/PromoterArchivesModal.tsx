import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  History, 
  MapPin, 
  Calendar, 
  Search, 
  Flame, 
  Plus, 
  Check, 
  Music, 
  Building, 
  Award,
  ExternalLink, 
  Shield, 
  Camera, 
  Layers,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Eye,
  SlidersHorizontal,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { uploadArchiveFlyer } from '../../../services/storageService';
import {
  fetchArchiveShowsFromDatabase,
  saveArchiveShowToDatabase,
  deleteArchiveShowFromDatabase,
  resetArchiveShowInDatabase,
  CANONICAL_DOMINATION_FEST_ARCHIVES,
  ArchiveShowItem
} from '../../../services/archiveShowsService';

export interface PromoterArchivesModalProps {
  isOpen: boolean;
  onClose: () => void;
  promoterProfile: any;
  userProfile?: any;
  shows?: any[];
  triggerNotification?: (msg: string) => void;
  onSelectArchiveItem?: (item: any) => void;
}

export type { ArchiveShowItem };

export const PromoterArchivesModal: React.FC<PromoterArchivesModalProps> = ({
  isOpen,
  onClose,
  promoterProfile,
  userProfile,
  shows = [],
  triggerNotification,
  onSelectArchiveItem
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Collapsed by default state for each card
  const [expandedShowIds, setExpandedShowIds] = useState<Set<string>>(new Set());

  // Database archive shows state
  const [archiveShows, setArchiveShows] = useState<ArchiveShowItem[]>(CANONICAL_DOMINATION_FEST_ARCHIVES);
  const [isLoadingArchives, setIsLoadingArchives] = useState<boolean>(false);

  // Editing state
  const [editingItem, setEditingItem] = useState<ArchiveShowItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editYear, setEditYear] = useState('2024');
  const [editType, setEditType] = useState<'festival' | 'tour' | 'club_gig' | 'anniversary'>('festival');
  const [editDate, setEditDate] = useState('');
  const [editVenue, setEditVenue] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLineup, setEditLineup] = useState('');
  const [editAttendance, setEditAttendance] = useState('');
  const [editMilestone, setEditMilestone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editFlyerUrl, setEditFlyerUrl] = useState('');

  // Add form state
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState('2024');
  const [newType, setNewType] = useState<'festival' | 'tour' | 'club_gig' | 'anniversary'>('festival');
  const [newDate, setNewDate] = useState('');
  const [newVenue, setNewVenue] = useState('Reggies Rock Club');
  const [newCity, setNewCity] = useState('Chicago, IL');
  const [newLineup, setNewLineup] = useState('');
  const [newAttendance, setNewAttendance] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newFlyerUrl, setNewFlyerUrl] = useState('');

  // Storage upload status
  const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);

  // Flyer Lightbox viewer state
  const [viewingFlyer, setViewingFlyer] = useState<{ url: string; title: string } | null>(null);

  const addFileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const promoterUserId = promoterProfile?.user_id || promoterProfile?.id || userProfile?.id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80';

  // Load from Supabase 'archive_shows' table on mount/open
  const loadArchiveData = async () => {
    try {
      setIsLoadingArchives(true);
      const data = await fetchArchiveShowsFromDatabase(promoterUserId);
      if (data && data.length > 0) {
        setArchiveShows(data);
      }
    } catch (err) {
      console.warn('Error loading archive shows from DB:', err);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadArchiveData();
    }
  }, [isOpen, promoterUserId]);

  if (!isOpen) return null;

  const promoterName = promoterProfile?.entity_name || promoterProfile?.corporate_name || promoterProfile?.name || 'Nexus Live Productions';
  const promoterAvatar = promoterProfile?.promoter_logo || promoterProfile?.avatar_url || promoterProfile?.avatar || '';

  // Toggle individual card expand/collapse
  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedShowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    const allIds = new Set(filteredArchives.map(a => a.id));
    setExpandedShowIds(allIds);
  };

  const handleCollapseAll = () => {
    setExpandedShowIds(new Set());
  };

  // Flyer file loader helper with direct routing to 'archives' storage bucket
  const handleFlyerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingFlyer(true);
      triggerNotification?.('⏳ Uploading flyer to "archives" storage bucket...');

      const targetId = isEditing ? (editingItem?.id || `arch_${Date.now()}`) : `arch_${Date.now()}`;
      const targetTitle = isEditing ? (editTitle || 'show') : (newTitle || 'show');

      // Upload directly into the Supabase 'archives' storage bucket
      const uploadedUrl = await uploadArchiveFlyer(file, targetId, targetTitle);

      if (uploadedUrl && !uploadedUrl.startsWith('data:')) {
        if (isEditing) {
          setEditFlyerUrl(uploadedUrl);
        } else {
          setNewFlyerUrl(uploadedUrl);
        }
        triggerNotification?.('🖼️ Flyer routed to "archives" bucket successfully!');
      } else {
        // Fallback to data URI if offline
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const base64 = uploadEvent.target?.result as string;
          if (base64) {
            if (isEditing) {
              setEditFlyerUrl(base64);
            } else {
              setNewFlyerUrl(base64);
            }
          }
        };
        reader.readAsDataURL(file);
        triggerNotification?.('🖼️ Loaded flyer image for show.');
      }
    } catch (err) {
      console.warn('Error uploading flyer to archives:', err);
      triggerNotification?.('⚠️ Flyer upload issue, using local image.');
    } finally {
      setIsUploadingFlyer(false);
      if (e.target) e.target.value = '';
    }
  };

  // Merge database archive shows with any past shows from the calendar
  const pastCalendarShows: ArchiveShowItem[] = (shows || []).filter(s => {
    const showDate = s.date || s.show_date || '';
    return showDate && showDate < new Date().toISOString().split('T')[0];
  }).map(s => {
    const dateParts = (s.date || '').split('-');
    const y = dateParts[0] ? parseInt(dateParts[0], 10) : 2023;
    return {
      id: s.id,
      year: isNaN(y) ? 2023 : y,
      title: s.festival_name || s.name || 'Historic Show',
      type: (s.festival_name ? 'festival' : 'club_gig') as any,
      date: s.date || 'Past Event',
      venue: s.venue_address || s.venue || 'Underground Venue',
      city: s.city || 'Chicago, IL',
      lineup: [s.headliner || s.name].filter(Boolean),
      attendance: s.expected_attendance || 'Full House',
      historicalNotes: s.additional_notes || 'Official completed live production.'
    };
  });

  const allArchives = [...archiveShows, ...pastCalendarShows];

  // Deduplicate by ID
  const seenIds = new Set<string>();
  const deduplicatedArchives = allArchives.filter(item => {
    if (seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  const yearsAvailable = Array.from(new Set(deduplicatedArchives.map(a => a.year))).sort((a, b) => b - a);

  const filteredArchives = deduplicatedArchives.filter(item => {
    if (selectedYear !== 'all' && item.year.toString() !== selectedYear) {
      return false;
    }
    if (filterType !== 'all') {
      if (filterType === 'festival' && item.type !== 'festival' && item.type !== 'anniversary') return false;
      if (filterType === 'anniversary' && item.type !== 'anniversary') return false;
      if (filterType === 'club_gig' && item.type !== 'club_gig' && item.type !== 'tour') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchVenue = item.venue.toLowerCase().includes(q);
      const matchCity = item.city.toLowerCase().includes(q);
      const matchLineup = (item.lineup || []).some(b => b.toLowerCase().includes(q));
      const matchNotes = (item.historicalNotes || '').toLowerCase().includes(q);
      const matchMilestone = (item.milestone || '').toLowerCase().includes(q);
      if (!matchTitle && !matchVenue && !matchCity && !matchLineup && !matchNotes && !matchMilestone) return false;
    }
    return true;
  });

  // Open Edit Modal for a show
  const handleStartEdit = (item: ArchiveShowItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setEditTitle(item.title || '');
    setEditYear(item.year?.toString() || '2024');
    setEditType(item.type || 'festival');
    setEditDate(item.date || '');
    setEditVenue(item.venue || '');
    setEditCity(item.city || '');
    setEditLineup(Array.isArray(item.lineup) ? item.lineup.join(', ') : '');
    setEditAttendance(item.attendance || '');
    setEditMilestone(item.milestone || '');
    setEditNotes(item.historicalNotes || '');
    setEditFlyerUrl(item.flyerUrl || '');
  };

  // Save Edit Form permanently to archive_shows database table
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim() || !editDate.trim()) {
      triggerNotification?.('⚠️ Please provide an event title and date.');
      return;
    }

    const updatedData: ArchiveShowItem = {
      ...editingItem,
      year: parseInt(editYear, 10) || editingItem.year || 2024,
      title: editTitle.trim(),
      type: editType,
      date: editDate.trim(),
      venue: editVenue.trim(),
      city: editCity.trim(),
      lineup: editLineup.split(',').map(s => s.trim()).filter(Boolean),
      attendance: editAttendance.trim() || undefined,
      milestone: editMilestone.trim() || undefined,
      historicalNotes: editNotes.trim() || undefined,
      flyerUrl: editFlyerUrl.trim() || undefined
    };

    // Update in-memory state immediately
    setArchiveShows(prev => {
      const exists = prev.some(p => p.id === editingItem.id);
      if (exists) {
        return prev.map(p => p.id === editingItem.id ? updatedData : p);
      }
      return [updatedData, ...prev];
    });

    // Save permanently to database table & storage
    saveArchiveShowToDatabase(updatedData, promoterUserId).then(() => {
      console.log(`[PromoterArchivesModal] Saved archive "${updatedData.title}" to archive_shows table.`);
    }).catch(err => {
      console.warn('Database save warning:', err);
    });

    triggerNotification?.(`💾 Successfully saved "${updatedData.title}" permanently to archive database!`);
    setEditingItem(null);
  };

  // Delete show from archive
  const handleDeleteArchive = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to remove "${title}" from your historic archives?`)) return;

    setArchiveShows(prev => prev.filter(item => item.id !== id));
    deleteArchiveShowFromDatabase(id, promoterUserId).catch(() => {});

    triggerNotification?.(`🗑️ Removed "${title}" from archives.`);
    if (editingItem?.id === id) setEditingItem(null);
  };

  // Reset edited show to default
  const handleResetToDefault = async (id: string, title: string) => {
    const res = await resetArchiveShowInDatabase(id, promoterUserId);
    if (res.data) {
      setArchiveShows(prev => prev.map(item => item.id === id ? res.data! : item));
    }
    triggerNotification?.(`🔄 Reset "${title}" to original defaults.`);
    setEditingItem(null);
  };

  // Create new show permanently to archive_shows database table
  const handleCreateArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate.trim()) {
      triggerNotification?.('⚠️ Please provide an event title and date.');
      return;
    }

    const created: ArchiveShowItem = {
      id: `arch_${Date.now()}`,
      year: parseInt(newYear, 10) || 2024,
      title: newTitle.trim(),
      type: newType,
      date: newDate.trim(),
      venue: newVenue.trim() || 'Reggies Rock Club',
      city: newCity.trim() || 'Chicago, IL',
      lineup: newLineup.split(',').map(s => s.trim()).filter(Boolean),
      attendance: newAttendance.trim() || 'Archived Production',
      milestone: newMilestone.trim() || 'Historic Promoter Production',
      historicalNotes: newNotes.trim() || `Archived show promoted by ${promoterName}.`,
      flyerUrl: newFlyerUrl.trim() || undefined,
      photoCount: 0
    };

    setArchiveShows(prev => [created, ...prev]);

    // Save permanently to database table & storage
    saveArchiveShowToDatabase(created, promoterUserId).then(() => {
      console.log(`[PromoterArchivesModal] Created archive "${created.title}" in archive_shows table.`);
    }).catch(err => {
      console.warn('Database save warning:', err);
    });

    triggerNotification?.(`📜 Added historic show "${created.title}" to permanent archives!`);
    setShowAddForm(false);
    setNewTitle('');
    setNewLineup('');
    setNewAttendance('');
    setNewMilestone('');
    setNewNotes('');
    setNewFlyerUrl('');
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
        className="relative w-full max-w-4xl bg-zinc-950 border border-amber-600/40 rounded-2xl shadow-[0_0_40px_rgba(217,119,6,0.2)] overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Top Accent Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {promoterAvatar ? (
              <img 
                src={promoterAvatar} 
                alt={promoterName} 
                className="w-12 h-12 rounded-xl object-cover border border-amber-500/50 shadow-md shrink-0" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <History className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-mono truncate">
                  {promoterName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  📜 HISTORIC SHOW ARCHIVES (2014 - 2024)
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                Comprehensive archives • All past festival iterations, historic lineups, and underground milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-lg uppercase font-mono flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Past Show</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Archives"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Add Past Show Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateArchive}
              className="border-b border-zinc-800 bg-zinc-900/90 p-4 sm:p-5 space-y-3 overflow-hidden text-left"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase font-mono text-amber-400 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Historic Show / Festival to Archive
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Festival / Show Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chicago Domination Fest 2017"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Year *</label>
                  <input
                    type="number"
                    required
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Show Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="festival">Festival</option>
                    <option value="anniversary">Anniversary / Finale</option>
                    <option value="tour">Tour Stop</option>
                    <option value="club_gig">Club Gig</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Date(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OCT 15 - 17, 2021"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Venue</label>
                  <input
                    type="text"
                    placeholder="e.g. Reggies Rock Club"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">City / State</label>
                  <input
                    type="text"
                    placeholder="e.g. Chicago, IL"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Attendance / Box Office</label>
                  <input
                    type="text"
                    placeholder="e.g. 750+ Sold Out Capacity"
                    value={newAttendance}
                    onChange={(e) => setNewAttendance(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Milestone Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. 🏆 5th Anniversary Golden Era"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Lineup Bands (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Defeated Sanity, Disgorge, Cephalotripsy, Gorgasm, Malignancy"
                  value={newLineup}
                  onChange={(e) => setNewLineup(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Flyer Artwork Section */}
              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-amber-400" /> Show Flyer / Poster Artwork
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter Flyer Image URL (https://...)"
                    value={newFlyerUrl}
                    onChange={(e) => setNewFlyerUrl(e.target.value)}
                    className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  />
                  <input 
                    type="file"
                    ref={addFileInputRef}
                    accept="image/*"
                    onChange={(e) => handleFlyerFileUpload(e, false)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingFlyer}
                    onClick={() => addFileInputRef.current?.click()}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    {isUploadingFlyer ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        <span>Uploading to Archives...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>Upload Flyer</span>
                      </>
                    )}
                  </button>
                </div>
                {newFlyerUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={newFlyerUrl} alt="Flyer Preview" className="w-12 h-12 rounded object-cover border border-amber-500/40" />
                    <span className="text-[10px] text-zinc-400 font-mono truncate">Flyer attached</span>
                    <button type="button" onClick={() => setNewFlyerUrl('')} className="text-[10px] text-rose-400 hover:underline font-mono">Remove</button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Historical Notes / Retrospective Story</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Sold out 3-day anniversary gathering with fans across 15 states."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end pt-1 gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase font-mono rounded-lg transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save to Archive
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Controls: Year Filter Pills, Search, & Expand/Collapse All */}
        <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-950/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Year Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-1">
            <button
              type="button"
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-amber-500 text-black font-black shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All Years ({deduplicatedArchives.length})
            </button>
            {yearsAvailable.map(yr => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase font-mono transition-all whitespace-nowrap cursor-pointer ${
                  selectedYear === yr.toString()
                    ? 'bg-amber-500 text-black font-black shadow-md'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Search and Expand/Collapse All */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search past band, year, venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={expandedShowIds.size === filteredArchives.length && filteredArchives.length > 0 ? handleCollapseAll : handleExpandAll}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
              title={expandedShowIds.size === filteredArchives.length ? "Collapse all show cards" : "Expand all show cards"}
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">
                {expandedShowIds.size === filteredArchives.length && filteredArchives.length > 0 ? "Collapse All" : "Expand All"}
              </span>
            </button>
          </div>
        </div>

        {/* Archive Timeline List (Collapsed by default) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredArchives.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <History className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-mono font-black text-zinc-400 uppercase tracking-wider">
                No matching historic archives found
              </h3>
              <p className="text-xs text-zinc-600 font-mono max-w-sm mx-auto">
                Reset your search query or year selection to view all past editions and tour archives.
              </p>
            </div>
          ) : (
            filteredArchives.map((item) => {
              const isExpanded = expandedShowIds.has(item.id);
              const lineupCount = item.lineup ? item.lineup.length : 0;
              const hasFlyer = Boolean(item.flyerUrl);

              return (
                <div
                  key={item.id}
                  className={`bg-zinc-900/60 hover:bg-zinc-900 border rounded-xl transition-all duration-200 overflow-hidden shadow-md ${
                    isExpanded ? 'border-amber-500/60 bg-zinc-900/95 ring-1 ring-amber-500/20' : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {/* Collapsed Header Bar (Clickable to toggle expansion) */}
                  <div
                    onClick={(e) => toggleExpand(item.id, e)}
                    className="p-3.5 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4 cursor-pointer select-none group"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full">
                      {/* Left: Flyer thumbnail or Year Badge Box */}
                      <div className="shrink-0 flex items-center gap-2">
                        {hasFlyer ? (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingFlyer({ url: item.flyerUrl!, title: item.title });
                            }}
                            className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden border border-amber-500/50 relative group/thumb cursor-pointer hover:border-amber-400 transition-all shadow-md bg-zinc-950 shrink-0"
                            title="Click to view full flyer"
                          >
                            <img src={item.flyerUrl} alt={item.title} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-white drop-shadow" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-zinc-950/90 backdrop-blur-xs py-0.5 text-center border-t border-zinc-800">
                              <span className="text-[9px] font-black text-amber-400 font-mono leading-none">{item.year}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col items-center justify-center p-1.5 shadow-inner shrink-0 group-hover:border-zinc-700 transition-colors">
                            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono leading-tight tracking-tight">
                              {item.year}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-400 uppercase font-black px-1 py-0.5 mt-1 rounded bg-zinc-800/90 border border-zinc-700/60">
                              {item.type === 'anniversary' ? 'ANNIV' : item.type === 'festival' ? 'FEST' : item.type === 'tour' ? 'TOUR' : 'GIG'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Center / Main details */}
                      <div className="min-w-0 flex-1 space-y-2 text-left">
                        {/* Tier 1: Title and Milestone/Type Badges */}
                        <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-white font-mono leading-snug group-hover:text-amber-400 transition-colors">
                            {item.title}
                          </h3>
                          
                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            {item.milestone && (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-xs">
                                {item.milestone}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black uppercase bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {item.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Tier 2: Clean Metadata Chips (Date, Venue & City, Attendance) */}
                        <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-mono text-zinc-400 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800/90 text-zinc-200">
                            <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-semibold text-[11px] sm:text-xs">{item.date}</span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-zinc-950/80 px-2.5 py-1 rounded-lg border border-zinc-800/90 text-zinc-200">
                            <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-[11px] sm:text-xs">
                              <strong className="text-white">{item.venue}</strong> • {item.city}
                            </span>
                          </div>

                          {item.attendance && (
                            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-950/60 px-2.5 py-1 rounded-lg border border-zinc-800/60 text-zinc-300 text-[11px]">
                              <Flame className="w-3 h-3 text-amber-500/90 shrink-0" />
                              <span>{item.attendance}</span>
                            </div>
                          )}
                        </div>

                        {/* Tier 3: Complete Lineup Roster Badges (Displays all entered bands) */}
                        {item.lineup && item.lineup.length > 0 && (
                          <div className="flex items-start gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase flex items-center gap-1 shrink-0 py-0.5 mr-0.5">
                              <Music className="w-3 h-3 text-amber-400/80" /> Lineup ({item.lineup.length}):
                            </span>
                            {item.lineup.map((band, idx) => (
                              <span
                                key={`${item.id}-band-${idx}`}
                                className="px-2 py-0.5 bg-zinc-950/90 border border-zinc-800/90 hover:border-amber-500/50 text-zinc-200 rounded-md text-[10.5px] font-mono font-medium transition-colors"
                              >
                                {band}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions (Edit & Expand Details Button) */}
                    <div className="flex items-center justify-between sm:justify-end w-full md:w-auto gap-2 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-zinc-800/80">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(item, e)}
                        className="px-3 py-1.5 bg-zinc-800/90 hover:bg-amber-500 hover:text-black text-zinc-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border border-zinc-700/60 hover:border-amber-500"
                        title="Edit show details & flyer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-400 group-hover:text-black" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => toggleExpand(item.id, e)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                          isExpanded 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs' 
                            : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-700/60'
                        }`}
                        title={isExpanded ? "Collapse details" : "Expand full show info and lineup"}
                      >
                        <span>{isExpanded ? "Collapse" : "Details"}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-zinc-800/80 bg-zinc-950/60 p-4 sm:p-5 space-y-4 text-left overflow-hidden"
                      >
                        <div className="flex flex-col md:flex-row gap-5 items-start">
                          {/* Left: Flyer Poster if present */}
                          {item.flyerUrl ? (
                            <div className="w-full md:w-48 shrink-0 flex flex-col items-center">
                              <div 
                                onClick={() => setViewingFlyer({ url: item.flyerUrl!, title: item.title })}
                                className="w-full h-56 rounded-xl overflow-hidden border border-amber-500/40 shadow-lg relative group/flyer cursor-pointer bg-zinc-900"
                              >
                                <img src={item.flyerUrl} alt={item.title} className="w-full h-full object-cover group-hover/flyer:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/flyer:opacity-100 flex items-center justify-center transition-opacity gap-1.5 text-white font-mono text-xs font-bold">
                                  <Eye className="w-4 h-4" /> View Full Flyer
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-zinc-500 mt-1.5 flex items-center gap-1">
                                <Camera className="w-3 h-3 text-amber-500" /> Official Poster Artwork
                              </span>
                            </div>
                          ) : (
                            <div className="w-full md:w-48 shrink-0 flex flex-col items-center justify-center h-40 bg-zinc-900/60 border border-dashed border-zinc-800 rounded-xl p-3 text-center">
                              <ImageIcon className="w-8 h-8 text-zinc-600 mb-1" />
                              <span className="text-[10px] font-mono text-zinc-500">No flyer attached</span>
                              <button
                                type="button"
                                onClick={(e) => handleStartEdit(item, e)}
                                className="mt-2 text-[10px] font-mono text-amber-400 hover:underline"
                              >
                                + Add Flyer
                              </button>
                            </div>
                          )}

                          {/* Right: Comprehensive Details, Full Lineup, and Notes */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Badges Bar */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {item.type.replace('_', ' ')}
                              </span>

                              {item.attendance && (
                                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                                  {item.attendance}
                                </span>
                              )}

                              {item.milestone && (
                                <span className="text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/30">
                                  {item.milestone}
                                </span>
                              )}
                            </div>

                            {/* Full Lineup */}
                            {item.lineup && item.lineup.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <div className="text-[10px] font-mono text-zinc-400 uppercase font-bold flex items-center gap-1.5">
                                  <Music className="w-3 h-3 text-amber-400" /> Documented Lineup ({item.lineup.length} bands):
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.lineup.map((band, idx) => (
                                    <span 
                                      key={`${item.id}-band-${idx}`}
                                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-lg text-xs font-mono font-semibold hover:border-amber-500/40 transition-colors shadow-sm"
                                    >
                                      {band}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Historical Retrospective Notes */}
                            {item.historicalNotes && (
                              <div className="space-y-1 pt-1 bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl">
                                <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-amber-500" /> Retrospective Notes:
                                </div>
                                <p className="text-xs text-zinc-300 font-mono leading-relaxed">
                                  {item.historicalNotes}
                                </p>
                              </div>
                            )}

                            {/* Bottom Card Footer Actions */}
                            <div className="pt-2 flex items-center justify-between border-t border-zinc-900 flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Shield className="w-3 h-3" /> Historic Nexus Production
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => handleStartEdit(item, e)}
                                  className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit Show Info
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => toggleExpand(item.id, e)}
                                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                  Collapse
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-zinc-500 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Archive encompasses {filteredArchives.length} documented past productions</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded font-mono text-xs transition-colors cursor-pointer"
          >
            Close Archive
          </button>
        </div>

        {/* EDIT HISTORIC SHOW MODAL OVERLAY */}
        <AnimatePresence>
          {editingItem && (
            <div 
              className="fixed inset-0 z-[10000005] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
              onClick={() => setEditingItem(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-950 border border-amber-500/50 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col shadow-[0_0_60px_rgba(217,119,6,0.3)] no-scrollbar text-left"
              >
                {/* Edit Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/80 sticky top-0 z-20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider font-mono">
                        Edit Archive Show
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-mono">
                        Update historical details, lineup, venue, notes, and flyer artwork
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit Form Body */}
                <form onSubmit={handleSaveEdit} className="p-4 sm:p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Festival / Show Name *</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Year *</label>
                      <input
                        type="number"
                        required
                        value={editYear}
                        onChange={(e) => setEditYear(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Type</label>
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as any)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="festival">Festival</option>
                        <option value="anniversary">Anniversary / Finale</option>
                        <option value="tour">Tour Stop</option>
                        <option value="club_gig">Club Gig</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Date(s) *</label>
                      <input
                        type="text"
                        required
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Venue</label>
                      <input
                        type="text"
                        value={editVenue}
                        onChange={(e) => setEditVenue(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">City / State</label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Attendance / Capacity</label>
                      <input
                        type="text"
                        value={editAttendance}
                        onChange={(e) => setEditAttendance(e.target.value)}
                        placeholder="e.g. 750+ Sold Out Capacity"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Milestone Badge</label>
                      <input
                        type="text"
                        value={editMilestone}
                        onChange={(e) => setEditMilestone(e.target.value)}
                        placeholder="e.g. 🏆 10th Anniversary Finale"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Lineup Bands (comma separated)</label>
                    <textarea
                      rows={2}
                      value={editLineup}
                      onChange={(e) => setEditLineup(e.target.value)}
                      placeholder="e.g. Defeated Sanity, Disgorge, Cephalotripsy, Gorgasm"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Flyer Artwork Section */}
                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-amber-400" /> Show Flyer / Poster Artwork
                    </label>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter Flyer Image URL (https://...)"
                        value={editFlyerUrl}
                        onChange={(e) => setEditFlyerUrl(e.target.value)}
                        className="flex-1 w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                      <input 
                        type="file"
                        ref={editFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleFlyerFileUpload(e, true)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={isUploadingFlyer}
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        {isUploadingFlyer ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            <span>Uploading to Archives...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Upload Flyer</span>
                          </>
                        )}
                      </button>
                    </div>

                    {editFlyerUrl && (
                      <div className="mt-2.5 flex items-center gap-3 p-2 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                        <img 
                          src={editFlyerUrl} 
                          alt="Flyer Preview" 
                          className="w-14 h-16 rounded object-cover border border-amber-500/50 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] text-white font-mono font-bold block">Flyer Attached</span>
                          <span className="text-[9px] text-zinc-400 font-mono truncate block">{editFlyerUrl.slice(0, 50)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingFlyer({ url: editFlyerUrl, title: editTitle || 'Flyer Preview' })}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[10px] font-mono cursor-pointer"
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditFlyerUrl('')}
                            className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 rounded text-[10px] font-mono cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono text-zinc-400 block mb-1 font-bold">Historical Notes / Story / Retrospective</label>
                    <textarea
                      rows={3}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add retrospective notes, memorable tour milestones, soundcheck details, etc."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Form Footer Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteArchive(editingItem.id, editingItem.title)}
                        className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Show
                      </button>

                      {true && (
                        <button
                          type="button"
                          onClick={() => handleResetToDefault(editingItem.id, editingItem.title)}
                          className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Reset any custom edits back to original presets"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase font-mono rounded-lg transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Save Changes
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* FULL FLYER LIGHTBOX MODAL */}
        <AnimatePresence>
          {viewingFlyer && (
            <div 
              className="fixed inset-0 z-[10000010] bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 sm:p-8"
              onClick={() => setViewingFlyer(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-2xl max-h-[90vh] bg-zinc-950 border border-amber-500/60 rounded-2xl shadow-[0_0_80px_rgba(217,119,6,0.4)] overflow-hidden flex flex-col"
              >
                <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-mono font-black text-white uppercase truncate">
                      {viewingFlyer.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingFlyer(null)}
                    className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-auto p-2 flex items-center justify-center bg-black">
                  <img 
                    src={viewingFlyer.url} 
                    alt={viewingFlyer.title} 
                    className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl" 
                  />
                </div>

                <div className="p-2.5 bg-zinc-950 border-t border-zinc-900 text-center">
                  <a 
                    href={viewingFlyer.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-amber-400 hover:underline font-mono inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Open Full Image in New Tab
                  </a>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PromoterArchivesModal;
