import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Disc,
  Music,
  MapPin,
  Globe,
  ExternalLink,
  ShieldCheck,
  Users,
  Sparkles,
  Save,
  Check,
  Search,
  Upload,
  Info,
  Image as ImageIcon,
  Loader2,
  Youtube,
  Play,
  UserPlus,
  Clock,
  Tag,
  ListMusic,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ShieldAlert,
  AlertCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import {
  communityBandManager,
  CommunityBandRecord,
  LineupMember,
  DiscographyRelease,
  DiscographyTrack
} from '../../../lib/communityBands';
import { uploadBase64ToStorage, generateUUID, ensureUUID } from '../../../supabase';
import { MASTER_GENRES } from '../../../constants/genres';

interface CommunityBandCuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBand?: CommunityBandRecord | null;
  userProfile?: any;
  onSaved?: (band: CommunityBandRecord) => void;
  triggerNotification?: (msg: string) => void;
}

export const CommunityBandCuratorModal: React.FC<CommunityBandCuratorModalProps> = ({
  isOpen,
  onClose,
  initialBand,
  userProfile,
  onSaved,
  triggerNotification
}) => {
  const [activePage, setActivePage] = useState<'list' | 'editor'>('list');
  const [bandsList, setBandsList] = useState<CommunityBandRecord[]>([]);
  const [selectedBand, setSelectedBand] = useState<CommunityBandRecord | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'lineup' | 'discography'>('overview');

  // Supabase Debug Log & Connection Status State
  const [syncLogs, setSyncLogs] = useState<{ message: string; timestamp: number }[]>([]);
  const [showUpsertBox, setShowUpsertBox] = useState<boolean>(false);
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const handleLog = (e: any) => {
      if (e.detail) {
        setSyncLogs(prev => [...prev.slice(-40), e.detail]);
        const msg = (e.detail.message || '').toLowerCase();
        if (msg.includes('success') || msg.includes('fully synced')) {
          setConnectionStatus('success');
        } else if (msg.includes('error') || msg.includes('fail') || msg.includes('rejected')) {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('syncing');
        }
      }
    };
    window.addEventListener('nexus_band_sync_log', handleLog);
    return () => window.removeEventListener('nexus_band_sync_log', handleLog);
  }, []);

  // Basic Info Form State
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('Extreme Metal');
  const [microGenres, setMicroGenres] = useState<string[]>([]);
  const [foundedYear, setFoundedYear] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('USA');
  const [recordLabel, setRecordLabel] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [bandcampUrl, setBandcampUrl] = useState('');
  const [metalArchivesUrl, setMetalArchivesUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [curatorHandle, setCuratorHandle] = useState('@community_archivist');

  // Lineup Editor State
  const [lineup, setLineup] = useState<LineupMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberStatus, setNewMemberStatus] = useState<'active' | 'past' | 'touring'>('active');
  const [newMemberYears, setNewMemberYears] = useState('');
  const [editingMemberIdx, setEditingMemberIdx] = useState<number | null>(null);

  // Discography Editor State
  const [albums, setAlbums] = useState<DiscographyRelease[]>([]);
  const [editingAlbumIdx, setEditingAlbumIdx] = useState<number | null>(null);

  // Current working release (for creating or editing)
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [releaseType, setReleaseType] = useState<'album' | 'ep' | 'single' | 'demo'>('album');
  const [releaseLabel, setReleaseLabel] = useState('');
  const [releaseCatalogId, setReleaseCatalogId] = useState('');
  const [releaseImageUrl, setReleaseImageUrl] = useState('');
  const [releaseTracks, setReleaseTracks] = useState<DiscographyTrack[]>([]);

  // Working Track inputs
  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackDuration, setNewTrackDuration] = useState('');
  const [newTrackLyrics, setNewTrackLyrics] = useState('');
  const [showNewTrackLyricsInput, setShowNewTrackLyricsInput] = useState(false);

  // Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingAlbumImg, setIsUploadingAlbumImg] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');

  const handleSyncAllToSupabase = async () => {
    if (isSyncingAll) return;
    try {
      setIsSyncingAll(true);
      setSyncStatusText('Connecting to Supabase...');
      const res = await communityBandManager.syncAllToSupabase((curr, total, name) => {
        setSyncStatusText(`Syncing (${curr}/${total}): ${name}...`);
      });
      loadBands();
      if (res.success || res.syncedCount > 0) {
        triggerNotification?.(`⚡ Successfully pushed ${res.syncedCount} band archives and full discographies to Supabase!`);
      } else {
        triggerNotification?.(`❌ Database sync notice: ${res.errors.join('; ')}`);
      }
    } catch (err: any) {
      console.error('Sync all error:', err);
      triggerNotification?.(`❌ Sync error: ${err?.message || 'Unknown failure'}`);
    } finally {
      setIsSyncingAll(false);
      setSyncStatusText('');
    }
  };

  const handleDeviceFileUpload = async (
    file: File,
    bucket: string,
    prefix: string,
    onSuccess: (url: string) => void,
    setLoadingState: (loading: boolean) => void
  ) => {
    try {
      setLoadingState(true);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target?.result as string;
        if (!base64) {
          setLoadingState(false);
          return;
        }
        try {
          // Dedicated storage asset path separation: never used as database primary key
          const storageFolderId = (selectedBand?.id && ensureUUID(selectedBand.id))
            ? ensureUUID(selectedBand.id)
            : (userProfile?.id ? ensureUUID(userProfile.id) : 'community-uploads');
          const fileToken = `${prefix}_${Date.now()}`;

          const publicUrl = await uploadBase64ToStorage(
            base64,
            bucket,
            storageFolderId,
            fileToken
          );
          if (publicUrl) {
            onSuccess(publicUrl);
          } else {
            onSuccess(base64);
          }
        } catch (err) {
          console.warn('Storage upload error, fallback to base64:', err);
          onSuccess(base64);
        } finally {
          setLoadingState(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error('File reading failed:', e);
      setLoadingState(false);
    }
  };

  const loadBands = () => {
    const list = communityBandManager.getAll();
    setBandsList(list);
    communityBandManager.fetchFromSupabase().then((remoteList) => {
      if (remoteList && remoteList.length > 0) {
        setBandsList(remoteList);
      }
    }).catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      loadBands();
      if (initialBand) {
        populateForm(initialBand);
        setActivePage('editor');
      } else {
        resetForm();
        setActivePage('list');
      }
    }
  }, [isOpen, initialBand]);

  useEffect(() => {
    const handleUpdate = () => {
      const freshList = communityBandManager.getAll();
      if (freshList && freshList.length > 0) {
        setBandsList(freshList);
      }
    };
    window.addEventListener('nexus_community_bands_updated', handleUpdate);
    window.addEventListener('nexus_avatar_updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus_community_bands_updated', handleUpdate);
      window.removeEventListener('nexus_avatar_updated', handleUpdate);
    };
  }, []);

  const populateForm = (band: CommunityBandRecord) => {
    setSelectedBand(band);
    setIsCreatingNew(false);
    setName(band.name);
    const bandMicro = band.micro_genres || band.subgenres || [];
    setMicroGenres(bandMicro);
    const matchedCluster = MASTER_GENRES.find(c => c.name.toLowerCase() === (band.genre || '').toLowerCase() || c.tags.some(t => bandMicro.includes(t.label)))?.name || MASTER_GENRES[0]?.name || 'Extreme Metal';
    setGenre(matchedCluster);
    setFoundedYear(band.founded_year || '');
    setCity(band.city || '');
    setStateProvince(band.state_province || band.state || '');
    setCountry(band.country || 'USA');
    setRecordLabel(band.record_label || band.label || '');
    setBio(band.bio || (band as any).description || '');
    setAvatarUrl(band.avatar_url || band.logo_url || (band as any).avatar || (band as any).image || '');
    setCoverUrl(band.cover_url || band.banner_url || (band as any).cover || (band as any).banner || '');
    setSpotifyUrl(band.spotify_url || '');
    setBandcampUrl(band.bandcamp_url || '');
    setMetalArchivesUrl(band.metal_archives_url || '');
    setYoutubeUrl(band.youtube_url || band.featured_youtube_url || '');
    setCuratorHandle(band.curated_by || (userProfile?.console_handle || userProfile?.handle || '@community_archivist'));
    setLineup(band.lineup || []);
    setAlbums([...(band.discography || [])].sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0')));
    setEditingAlbumIdx(null);
    setEditingMemberIdx(null);
    resetReleaseInputs();
    setActivePage('editor');
  };

  // Delete Community Band Archive with confirmation
  const handleDeleteBand = (band: CommunityBandRecord) => {
    const bandTitle = band.name || 'this band';
    const releaseCount = band.discography?.length || 0;
    
    if (!window.confirm(`🗑️ Are you sure you want to permanently delete "${bandTitle}" (${releaseCount} releases)?\n\nThis will remove it from community archives and Supabase.`)) {
      return;
    }

    const res = communityBandManager.deleteCommunityBand(band.id, true);
    if (res.success) {
      triggerNotification?.(`🗑️ Deleted community archive for "${bandTitle}".`);
      loadBands();
      if (selectedBand?.id === band.id) {
        resetForm();
        setActivePage('list');
      }
    } else {
      triggerNotification?.(`❌ Failed to delete archive: ${res.error || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setSelectedBand(null);
    setIsCreatingNew(true);
    setName('');
    setGenre('Extreme Metal');
    setMicroGenres(['Death Metal']);
    setFoundedYear('');
    setCity('');
    setStateProvince('');
    setCountry('USA');
    setRecordLabel('');
    setBio('');
    setAvatarUrl('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400');
    setCoverUrl('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200');
    setSpotifyUrl('');
    setBandcampUrl('');
    setMetalArchivesUrl('');
    setYoutubeUrl('');
    setCuratorHandle(userProfile?.console_handle || userProfile?.handle || '@community_archivist');
    setLineup([]);
    setAlbums([]);
    setEditingAlbumIdx(null);
    setEditingMemberIdx(null);
    resetReleaseInputs();
    setActivePage('editor');
  };

  const resetReleaseInputs = () => {
    setReleaseTitle('');
    setReleaseYear(new Date().getFullYear().toString());
    setReleaseType('album');
    setReleaseLabel('');
    setReleaseCatalogId('');
    setReleaseImageUrl('');
    setReleaseTracks([]);
    setNewTrackTitle('');
    setNewTrackDuration('');
    setNewTrackLyrics('');
    setShowNewTrackLyricsInput(false);
    setEditingAlbumIdx(null);
  };

  // Lineup Handlers
  const handleAddOrUpdateMember = () => {
    if (!newMemberName.trim()) return;

    if (editingMemberIdx !== null) {
      const updated = [...lineup];
      updated[editingMemberIdx] = {
        ...updated[editingMemberIdx],
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'Musician',
        status: newMemberStatus,
        years: newMemberYears.trim() || 'Present'
      };
      setLineup(updated);
      setEditingMemberIdx(null);
    } else {
      const newMem: LineupMember = {
        id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: newMemberName.trim(),
        role: newMemberRole.trim() || 'Musician',
        status: newMemberStatus,
        years: newMemberYears.trim() || 'Present'
      };
      setLineup([...lineup, newMem]);
    }

    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberYears('');
    setNewMemberStatus('active');
  };

  const handleEditMember = (idx: number) => {
    const mem = lineup[idx];
    setEditingMemberIdx(idx);
    setNewMemberName(mem.name);
    setNewMemberRole(mem.role);
    setNewMemberStatus(mem.status || 'active');
    setNewMemberYears(mem.years || '');
  };

  const handleRemoveMember = (idx: number) => {
    setLineup(lineup.filter((_, i) => i !== idx));
    if (editingMemberIdx === idx) {
      setEditingMemberIdx(null);
      setNewMemberName('');
      setNewMemberRole('');
      setNewMemberYears('');
    }
  };

  // Discography & Tracklist Handlers
  const handleLoadReleaseForEdit = (idx: number) => {
    const alb = albums[idx];
    setEditingAlbumIdx(idx);
    setReleaseTitle(alb.title);
    setReleaseYear(alb.year);
    setReleaseType((['album', 'ep', 'single', 'demo'].includes((alb.type || '').toLowerCase()) ? (alb.type.toLowerCase() as any) : 'album'));
    setReleaseLabel(alb.label || alb.release_info || '');
    setReleaseCatalogId(alb.catalog_id || '');
    setReleaseImageUrl(alb.image_url || '');
    setReleaseTracks(alb.tracks || []);
    setNewTrackTitle('');
    setNewTrackDuration('');
  };

  const handleSaveRelease = () => {
    if (!releaseTitle.trim()) return;

    const releaseId = editingAlbumIdx !== null 
      ? (albums[editingAlbumIdx]?.id ? ensureUUID(albums[editingAlbumIdx].id) : generateUUID())
      : generateUUID();

    const releaseData: DiscographyRelease = {
      id: releaseId,
      title: releaseTitle.trim(),
      year: releaseYear.trim() || new Date().getFullYear().toString(),
      type: releaseType,
      image_url: releaseImageUrl.trim() || undefined,
      label: releaseLabel.trim() || undefined,
      release_info: releaseLabel.trim() || undefined,
      catalog_id: releaseCatalogId.trim() || undefined,
      tracks: releaseTracks
    };

    let updated = [...albums];
    if (editingAlbumIdx !== null) {
      updated[editingAlbumIdx] = releaseData;
    } else {
      updated.push(releaseData);
    }
    updated.sort((a, b) => parseInt(b.year || '0') - parseInt(a.year || '0'));
    setAlbums(updated);

    resetReleaseInputs();
  };

  const handleRemoveAlbum = (idx: number) => {
    setAlbums(albums.filter((_, i) => i !== idx));
    if (editingAlbumIdx === idx) {
      resetReleaseInputs();
    }
  };

  const handleAddTrackToRelease = () => {
    if (!newTrackTitle.trim()) return;
    const trackNum = releaseTracks.length + 1;
    const newTrack: DiscographyTrack = {
      number: trackNum,
      title: newTrackTitle.trim(),
      duration: newTrackDuration.trim() || '3:30',
      lyrics: newTrackLyrics.trim() || undefined
    };
    setReleaseTracks([...releaseTracks, newTrack]);
    setNewTrackTitle('');
    setNewTrackDuration('');
    setNewTrackLyrics('');
    setShowNewTrackLyricsInput(false);
  };

  const handleRemoveTrack = (tIdx: number) => {
    const filtered = releaseTracks.filter((_, i) => i !== tIdx).map((t, idx) => ({
      ...t,
      number: idx + 1
    }));
    setReleaseTracks(filtered);
  };

  // Full Save to Supabase and Local Storage
  const handleSave = async () => {
    if (isSaving || !name.trim()) return;

    setIsSaving(true);

    try {
      const resolvedCreatorId = selectedBand?.creator_id || userProfile?.id || (userProfile?.console_handle ? userProfile.console_handle : undefined);

      const parsedFoundedYear = foundedYear.trim() ? parseInt(foundedYear.trim(), 10) : undefined;
      const validFoundedYear = (parsedFoundedYear && !isNaN(parsedFoundedYear) && parsedFoundedYear > 0) ? parsedFoundedYear : undefined;

      // Assign valid UUID: new generation for new band, preserved UUID for existing band
      const bandId = isCreatingNew
        ? generateUUID()
        : (selectedBand?.id ? ensureUUID(selectedBand.id) : generateUUID());

      const bandPayload: Partial<CommunityBandRecord> & { band_name: string } = {
        id: bandId,
        band_name: name.trim(),
        name: name.trim(),
        genre: genre || (microGenres.length > 0 ? microGenres[0] : 'Extreme Metal'),
        micro_genres: microGenres.length > 0 ? microGenres : (genre ? [genre] : ['Extreme Metal']),
        subgenres: microGenres.length > 0 ? microGenres : (genre ? [genre] : ['Extreme Metal']),
        founded_year: validFoundedYear !== undefined ? String(validFoundedYear) : undefined,
        city: city.trim(),
        state_province: stateProvince.trim(),
        country: country.trim(),
        record_label: recordLabel.trim() || undefined,
        label: recordLabel.trim() || undefined,
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        logo_url: avatarUrl.trim(),
        cover_url: coverUrl.trim(),
        banner_url: coverUrl.trim(),
        spotify_url: spotifyUrl.trim() || undefined,
        spotify: spotifyUrl.trim() || undefined,
        bandcamp_url: bandcampUrl.trim() || undefined,
        bandcamp: bandcampUrl.trim() || undefined,
        metal_archives_url: metalArchivesUrl.trim() || undefined,
        youtube_url: youtubeUrl.trim() || undefined,
        featured_youtube_url: youtubeUrl.trim() || undefined,
        lineup,
        discography: albums,
        creator_id: resolvedCreatorId,
        curated_by: curatorHandle || userProfile?.console_handle || userProfile?.handle || '@fan_archivist',
        curator_name: userProfile?.full_name || userProfile?.name || 'Community Archivist',
        verification_status: selectedBand?.verification_status || 'community_archive'
      };

      const savedRecord = communityBandManager.upsertCommunityBand(bandPayload, { isNew: isCreatingNew });

      // Attempt Supabase sync with explicit isNew configuration
      try {
        const syncRes = await communityBandManager.syncToSupabaseTables(savedRecord, { isNew: isCreatingNew });
        if (!syncRes.success && syncRes.error) {
          console.error('[CommunityBandCuratorModal] Remote Supabase sync error:', syncRes.error);
          triggerNotification?.(`⚠️ Saved locally, cloud sync notice: ${syncRes.error}`);
        } else {
          triggerNotification?.(`⚡ Saved & synchronized "${savedRecord.name}" to cloud archive!`);
        }
      } catch (syncErr: any) {
        console.warn('[CommunityBandCuratorModal] Remote Supabase sync deferred (offline / offline queue active):', syncErr);
        triggerNotification?.(`⚡ Saved locally (${savedRecord.name}). Remote sync queued.`);
      }

      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3000);

      loadBands();
      populateForm(savedRecord);
      onSaved?.(savedRecord);
      
      // Return to archives list after successful save
      setTimeout(() => {
        setActivePage('list');
      }, 800);
    } catch (error) {
      console.error('Failed to save archive:', error);
      triggerNotification?.(`❌ Failed to save band archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredBands = bandsList.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1000005] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#090a0f] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] sm:h-[88vh]">
        
        {/* Global Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-zinc-850 bg-gradient-to-r from-zinc-950 via-zinc-900/70 to-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white font-display uppercase tracking-wide">
                  Community Band Archivist Hub
                </h3>
                <span className="hidden sm:inline-block text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  SUPABASE SYNCED
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 font-sans">
                {activePage === 'list' 
                  ? 'Select an existing archive or create a new community band profile.'
                  : (isCreatingNew ? 'Creating New Archive' : `Editing: ${selectedBand?.name || 'Band'}`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activePage === 'editor' && (
              <>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow"
                  title="Start a blank band profile from scratch"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Blank</span>
                </button>

                {selectedBand && !isCreatingNew && (
                  <button
                    type="button"
                    onClick={() => handleDeleteBand(selectedBand)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 font-mono text-xs font-bold uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow"
                    title="Permanently delete this community band archive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}



                <button
                  onClick={() => setActivePage('list')}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-amber-400 font-mono text-xs font-bold uppercase flex items-center gap-1.5 border border-zinc-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Archives List</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PAGE 1: EXISTING ARCHIVES LIST (Explorer) */}
        {activePage === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-950/40">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                  Existing Archives ({bandsList.length})
                </h4>
                <p className="text-xs text-zinc-400">
                  Tap any archive to open the mobile-optimized editor, or create a brand new fan archive.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncAllToSupabase}
                  disabled={isSyncingAll}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 font-mono font-bold text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow active:scale-95 disabled:opacity-50"
                  title="Push all community archives, members, and discography tracklists directly to Supabase cloud tables"
                >
                  {isSyncingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span className="truncate max-w-[140px] sm:max-w-[200px]">{syncStatusText || 'Syncing...'}</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 text-amber-400" />
                      <span>Push All to Supabase</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow active:scale-95"
                  title="Start a blank profile from scratch"
                >
                  <Plus className="w-4 h-4 text-zinc-400" /> Blank
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by band name, genre, location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono text-white placeholder-zinc-500 outline-none focus:border-amber-500/60 shadow-inner"
              />
            </div>

            {/* Band Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
              {filteredBands.map((band, bIdx) => (
                <div
                  key={band.id ? `band-${band.id}-${bIdx}` : `band-${bIdx}`}
                  onClick={() => populateForm(band)}
                  className="w-full text-left p-3.5 sm:p-4 rounded-xl border bg-zinc-900/60 border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900 transition-all flex items-center gap-3.5 cursor-pointer shadow-sm group"
                >
                  <img
                    src={band.avatar_url || band.logo_url || (band as any).avatar || (band as any).image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=120'}
                    alt={band.name}
                    className="w-14 h-14 rounded-xl object-cover border border-zinc-750 shrink-0 group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=120';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-white truncate font-display group-hover:text-amber-300 transition-colors">
                        {band.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">

                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          band.verification_status === 'verified_official'
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                            : 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                        }`}>
                          {band.verification_status === 'verified_official' ? 'VERIFIED' : 'FAN ARCHIVE'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-zinc-400 truncate font-mono mt-1">
                      {band.genre} • {band.city || band.country || 'Global'}
                    </div>

                    <div className="text-[10px] text-zinc-500 font-mono mt-1.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <span>💿 {band.discography?.length || 0} releases</span>
                        <span>👥 {band.lineup?.length || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold group-hover:underline text-xs">Edit →</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBand(band);
                          }}
                          className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-500/40 transition-colors cursor-pointer"
                          title={`Delete "${band.name}" archive`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredBands.length === 0 && (
                <div className="col-span-full py-12 text-center text-zinc-500 font-mono text-xs border border-dashed border-zinc-800 rounded-2xl">
                  No band archives found matching "{searchQuery}". Click "Blank" above to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE 2: EDITOR & CREATOR PAGE */}
        {activePage === 'editor' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#090a0f]">
            
            {/* Top Sub-navigation Tabs */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-850 bg-zinc-950/80 shrink-0 overflow-x-auto gap-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" /> Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('lineup')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'lineup'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Lineup ({lineup.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('discography')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'discography'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Disc className="w-3.5 h-3.5" /> Discography ({albums.length})
                </button>
              </div>

              {savedFeedback && (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in shrink-0">
                  <Check className="w-3.5 h-3.5" /> Saved & Synced!
                </span>
              )}
            </div>

            {/* Scrollable Editor Content */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
              
              {/* TAB 1: OVERVIEW & MEDIA */}
              {activeTab === 'overview' && (
                <div className="space-y-3 animate-in fade-in duration-150">


                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Band / Artist Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Gorguts, Dying Fetus..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Founded Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 1991"
                        value={foundedYear}
                        onChange={(e) => setFoundedYear(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Smart Divergence Detection: If user edited an existing archive's name */}
                  {selectedBand && !isCreatingNew && name.trim() && name.trim().toLowerCase() !== selectedBand.name.trim().toLowerCase() && (
                    <div className="p-3 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2 text-xs font-mono animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Creating a new band or renaming &quot;{selectedBand.name}&quot;?</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        You changed the name while editing existing profile <strong>{selectedBand.name}</strong> ({albums.length} releases, {lineup.length} members). 
                        To prevent copying {selectedBand.name}&apos;s discography to <strong>{name}</strong>, choose an action:
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBand(null);
                            setIsCreatingNew(true);
                            setAlbums([]);
                            setLineup([]);
                            setBio('');
                            setRecordLabel('');
                            setSpotifyUrl('');
                            setBandcampUrl('');
                            setMetalArchivesUrl('');
                            setYoutubeUrl('');
                            triggerNotification?.(`✨ Started fresh archive for "${name}". Old releases and lineup cleared.`);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] cursor-pointer flex items-center gap-1.5 shadow"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Start Fresh Archive for {name} (Clear Releases)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBand({ ...selectedBand, name: name.trim() });
                            triggerNotification?.(`🏷️ Will rename "${selectedBand.name}" to "${name.trim()}".`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 font-bold uppercase text-[10px] cursor-pointer"
                        >
                          Keep Releases &amp; Rename {selectedBand.name}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Primary Sonic Classification</label>
                      <select 
                        value={genre}
                        onChange={(e) => {
                          setGenre(e.target.value);
                          const cluster = MASTER_GENRES.find(c => c.name === e.target.value);
                          if (cluster && cluster.tags.length > 0) {
                            setMicroGenres([cluster.tags[0].label]);
                          } else {
                            setMicroGenres([]);
                          }
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-400 focus:border-amber-500 outline-none shadow-inner"
                      >
                        <option value="">SELECT CLASSIFICATION...</option>
                        {MASTER_GENRES.map((g, gIdx) => (
                          <option key={`${g.name}-${gIdx}`} value={g.name}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Record Label</label>
                      <input
                        type="text"
                        placeholder="e.g. Relapse Records, Season of Mist..."
                        value={recordLabel}
                        onChange={(e) => setRecordLabel(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  {genre && (
                    <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-850 rounded-xl">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center justify-between">
                        <span>Genre Tags & Subgenres (Maps to `micro_genres`)</span>
                        <span className="text-[9px] text-amber-400 font-mono">{microGenres.length} selected</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-black/60 border border-zinc-800 rounded-lg max-h-28 overflow-y-auto">
                        {MASTER_GENRES.find(c => c.name === genre)?.tags.map((tagObj, idx) => {
                          const tag = tagObj.label;
                          const isSelected = microGenres.includes(tag);
                          return (
                            <button
                              key={`${tagObj.id}-${idx}`}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setMicroGenres(microGenres.filter(t => t !== tag));
                                } else {
                                  if (microGenres.length < 5) {
                                    setMicroGenres([...microGenres, tag]);
                                  }
                                }
                              }}
                              className={`text-[9px] font-mono px-2 py-1 rounded-md border transition-colors ${
                                isSelected 
                                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold shadow-sm' 
                                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Montreal..."
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">State / Province</label>
                      <input
                        type="text"
                        placeholder="e.g. Quebec, MD..."
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none shadow-inner"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Country</label>
                      <input
                        type="text"
                        placeholder="USA, Canada, Germany..."
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="curator-band-bio" className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center justify-between">
                      <span>Bio / Band Description</span>
                      <span className="text-[9px] text-zinc-500 font-mono">History & Background</span>
                    </label>
                    <textarea
                      id="curator-band-bio"
                      rows={3}
                      placeholder="Origins, classic lineup, signature sound, lyrical themes..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:border-amber-500 outline-none shadow-inner resize-y transition-colors"
                    />
                  </div>

                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Youtube className="w-3.5 h-3.5 text-red-500" />
                        <span>Featured YouTube URL</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:border-red-500 outline-none"
                    />
                  </div>

                  {/* Uploaders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1.5 bg-zinc-950 border border-zinc-850 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Avatar / Logo</span>
                        </label>
                        {isUploadingAvatar && (
                          <span className="text-[9px] font-mono text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-zinc-600 font-mono text-[9px]">NO IMG</span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                          <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px] uppercase cursor-pointer transition-colors shadow-sm">
                            <Upload className="w-3 h-3" />
                            <span>Upload Avatar</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleDeviceFileUpload(file, 'community-bands', 'community-avatar', (url) => setAvatarUrl(url), setIsUploadingAvatar);
                                }
                              }}
                            />
                          </label>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="text-[9px] font-mono text-zinc-500 hover:text-red-400 text-left"
                            >
                              Remove avatar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-zinc-950 border border-zinc-850 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cover Banner</span>
                        </label>
                        {isUploadingCover && (
                          <span className="text-[9px] font-mono text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-zinc-600 font-mono text-[9px]">NO BANNER</span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col gap-1">
                          <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px] uppercase cursor-pointer transition-colors shadow-sm">
                            <Upload className="w-3 h-3" />
                            <span>Upload Banner</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleDeviceFileUpload(file, 'community-bands', 'community-banner', (url) => setCoverUrl(url), setIsUploadingCover);
                                }
                              }}
                            />
                          </label>
                          {coverUrl && (
                            <button
                              type="button"
                              onClick={() => setCoverUrl('')}
                              className="text-[9px] font-mono text-zinc-500 hover:text-red-400 text-left"
                            >
                              Remove banner
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Spotify URL</label>
                      <input
                        type="text"
                        placeholder="https://open.spotify.com/artist/..."
                        value={spotifyUrl}
                        onChange={(e) => setSpotifyUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Bandcamp URL</label>
                      <input
                        type="text"
                        placeholder="https://band.bandcamp.com"
                        value={bandcampUrl}
                        onChange={(e) => setBandcampUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase">Metal Archives URL</label>
                      <input
                        type="text"
                        placeholder="https://metal-archives.com/..."
                        value={metalArchivesUrl}
                        onChange={(e) => setMetalArchivesUrl(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Danger Zone: Delete Community Archive */}
                  {selectedBand && !isCreatingNew && (
                    <div className="p-4 rounded-xl border border-red-900/30 bg-red-950/10 space-y-2 mt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-mono font-bold text-red-400 uppercase flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Community Archive</span>
                          </div>
                          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">
                            Permanently remove this community archive profile for &quot;{selectedBand.name}&quot; ({albums.length} releases, {lineup.length} members).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBand(selectedBand)}
                          className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-mono font-bold uppercase flex items-center gap-1.5 cursor-pointer shadow transition-all shrink-0 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Archive</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LINEUP */}
              {activeTab === 'lineup' && (
                <div className="space-y-4 animate-in fade-in duration-150">


                  <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-amber-400" />
                        {editingMemberIdx !== null ? `Edit Lineup Member #${editingMemberIdx + 1}` : 'Add Band Member'}
                      </span>
                      {editingMemberIdx !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMemberIdx(null);
                            setNewMemberName('');
                            setNewMemberRole('');
                            setNewMemberYears('');
                            setNewMemberStatus('active');
                          }}
                          className="text-xs font-mono text-zinc-400 hover:text-white"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Musician Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Trey Williams, Chuck Schuldiner"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Role / Instrument</label>
                        <input
                          type="text"
                          placeholder="e.g. Drums, Vocals"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Years Active</label>
                        <input
                          type="text"
                          placeholder="e.g. 1993–present"
                          value={newMemberYears}
                          onChange={(e) => setNewMemberYears(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-400">Status:</span>
                        <div className="flex items-center gap-1.5">
                          {(['active', 'past', 'touring'] as const).map((st, idx) => (
                            <button
                              key={`status-${st}-${idx}`}
                              type="button"
                              onClick={() => setNewMemberStatus(st)}
                              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                                newMemberStatus === st
                                  ? 'bg-amber-500 text-black shadow-sm'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddOrUpdateMember}
                        disabled={!newMemberName.trim()}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono font-black text-xs uppercase cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        {editingMemberIdx !== null ? 'Update Member' : 'Add to Lineup'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Current Lineup List ({lineup.length})</span>
                      {lineup.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Clear all ${lineup.length} lineup members from this form?`)) {
                              setLineup([]);
                              setEditingMemberIdx(null);
                            }
                          }}
                          className="text-[11px] font-mono text-zinc-400 hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded hover:bg-red-950/20 border border-transparent hover:border-red-900/40"
                        >
                          <Trash2 className="w-3 h-3" /> Clear Lineup
                        </button>
                      )}
                    </div>
                    {lineup.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 font-mono text-xs">
                        No lineup members added yet. Use the form above to add members.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {lineup.map((mem, mIdx) => (
                          <div
                            key={`mem-${mem.id || 'new'}-${mIdx}`}
                            className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white font-display">{mem.name}</span>
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                  mem.status === 'active' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                                  mem.status === 'touring' ? 'bg-blue-950 text-blue-400 border border-blue-500/30' :
                                  'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {mem.status || 'active'}
                                </span>
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                {mem.role} • {mem.years || 'Present'}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleEditMember(mIdx)}
                                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(mIdx)}
                                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: DISCOGRAPHY */}
              {activeTab === 'discography' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">


                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Disc className="w-3.5 h-3.5 text-amber-400" />
                        {editingAlbumIdx !== null ? `Edit Release: ${releaseTitle}` : 'Add Album / EP / Demo Release'}
                      </span>
                      {editingAlbumIdx !== null && (
                        <button
                          type="button"
                          onClick={resetReleaseInputs}
                          className="text-[10px] font-mono text-zinc-400 hover:text-white"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    {/* Release Title */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase">Release Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Considerated, Effigy of the Forgotten"
                        value={releaseTitle}
                        onChange={(e) => setReleaseTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Release Year & Release Type on the same level */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Release Year</label>
                        <input
                          type="text"
                          placeholder="1991"
                          value={releaseYear}
                          onChange={(e) => setReleaseYear(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Release Type</label>
                        <select
                          value={releaseType}
                          onChange={(e: any) => setReleaseType(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                        >
                          <option value="album">Full Album</option>
                          <option value="ep">EP</option>
                          <option value="single">Single</option>
                          <option value="demo">Demo</option>
                        </select>
                      </div>
                    </div>

                    {/* Shrunk Label input & Catalog ID next to it */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Record Label</label>
                        <input
                          type="text"
                          placeholder="Roadrunner"
                          value={releaseLabel}
                          onChange={(e) => setReleaseLabel(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase">Catalog ID (Cat #)</label>
                        <input
                          type="text"
                          placeholder="ROAR-019"
                          value={releaseCatalogId}
                          onChange={(e) => setReleaseCatalogId(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Album Artwork & Image Uploader */}
                    <div className="space-y-1.5 bg-zinc-900/80 border border-zinc-850 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center gap-1.5">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>Release Artwork / Cover Image</span>
                        </label>
                        {isUploadingAlbumImg && (
                          <span className="text-[9px] font-mono text-amber-400 flex items-center gap-1">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading...
                          </span>
                        )}
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                          {releaseImageUrl ? (
                            <img src={releaseImageUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <Disc className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Paste image URL..."
                            value={releaseImageUrl}
                            onChange={(e) => setReleaseImageUrl(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none focus:border-amber-500"
                          />

                          <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-mono font-bold text-[10px] uppercase cursor-pointer transition-colors shadow-sm">
                            <Upload className="w-3 h-3" />
                            <span>Upload Image File</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleDeviceFileUpload(file, 'community-bands', 'release-art', (url) => setReleaseImageUrl(url), setIsUploadingAlbumImg);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Tracklist Builder */}
                    <div className="pt-2 border-t border-zinc-850 space-y-2">
                      <label className="text-[10px] font-mono font-bold text-zinc-300 uppercase flex items-center justify-between">
                        <span>Tracklist ({releaseTracks.length} tracks)</span>
                      </label>

                      {/* Song Title Input Full Width */}
                      <div className="space-y-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850">
                        <input
                          type="text"
                          placeholder="Song Title (Full Width)..."
                          value={newTrackTitle}
                          onChange={(e) => setNewTrackTitle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-amber-500"
                        />

                        {/* Under it: Duration, Add Lyrics button, Add Track button */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Duration (3:45)"
                            value={newTrackDuration}
                            onChange={(e) => setNewTrackDuration(e.target.value)}
                            className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white outline-none"
                          />

                          <button
                            type="button"
                            onClick={() => setShowNewTrackLyricsInput(!showNewTrackLyricsInput)}
                            className={`px-2.5 py-1.5 rounded-lg border font-mono text-[10px] uppercase font-bold transition-colors ${
                              showNewTrackLyricsInput || newTrackLyrics.trim()
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {newTrackLyrics.trim() ? 'Lyrics Added ✓' : '+ Lyrics'}
                          </button>

                          <button
                            type="button"
                            onClick={handleAddTrackToRelease}
                            disabled={!newTrackTitle.trim()}
                            className="flex-1 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono text-xs uppercase font-bold shadow-sm"
                          >
                            + Track
                          </button>
                        </div>

                        {showNewTrackLyricsInput && (
                          <textarea
                            placeholder="Paste track lyrics here..."
                            value={newTrackLyrics}
                            onChange={(e) => setNewTrackLyrics(e.target.value)}
                            rows={3}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-300 outline-none focus:border-amber-500"
                          />
                        )}
                      </div>

                      {releaseTracks.length > 0 && (
                        <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                          {releaseTracks.map((tr, tIdx) => (
                            <div key={`track-${tIdx}`} className="bg-zinc-900/60 border border-zinc-800 p-2 rounded-lg text-xs font-mono space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-zinc-300 font-bold">{tr.number}. {tr.title} <span className="text-zinc-500 font-normal">({tr.duration})</span></span>
                                <div className="flex items-center gap-2">
                                  {tr.lyrics && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Lyrics</span>}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTrack(tIdx)}
                                    className="text-zinc-500 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              {tr.lyrics && (
                                <p className="text-[10px] text-zinc-400 italic line-clamp-1 pl-3 border-l border-zinc-800">{tr.lyrics}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveRelease}
                        disabled={!releaseTitle.trim()}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono font-black text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {editingAlbumIdx !== null ? 'Update Release' : 'Add Release'}
                      </button>
                    </div>
                  </div>

                  {/* Discography List */}
                  <div className="space-y-2 pb-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Catalog Releases ({albums.length})</span>
                      <div className="flex items-center gap-2">
                        {albums.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to clear all ${albums.length} releases from this archive?`)) {
                                setAlbums([]);
                                resetReleaseInputs();
                                triggerNotification?.('Cleared all releases from form.');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear All Releases
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            // Open Metal Archives Import Modal
                            const event = new CustomEvent('open_metal_archives_import', { detail: { bandId: selectedBand?.id || 'band-1', bandName: name } });
                            window.dispatchEvent(event);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Disc className="w-3.5 h-3.5" /> Import from Metal-Archives
                        </button>
                      </div>
                    </div>
                    {albums.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-zinc-800 text-zinc-500 text-xs font-mono">
                        No releases added yet. Use the form above to add albums and tracklists.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {albums.map((alb, i) => (
                          <div
                            key={alb.id ? `alb-${alb.id}-${i}` : `alb-${i}`}
                            className="p-3.5 bg-zinc-950 border border-zinc-850 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shrink-0 shadow">
                                {alb.image_url ? (
                                  <img src={alb.image_url} alt={alb.title} className="w-full h-full object-cover" />
                                ) : (
                                  <Disc className="w-5 h-5 text-zinc-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white truncate font-display">{alb.title}</span>
                                  <span className="uppercase text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                    {alb.type || 'album'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                  {alb.year} • {alb.label || 'Independent'} • {alb.tracks?.length || 0} tracks
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleLoadReleaseForEdit(i)}
                                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono uppercase font-bold"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveAlbum(i)}
                                className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-zinc-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Visual Supabase Connection Status & Real-Time Debug Log Terminal */}
            {showUpsertBox && (
              <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      connectionStatus === 'success' ? 'bg-emerald-400 animate-pulse' :
                      connectionStatus === 'error' ? 'bg-red-400 animate-ping' :
                      connectionStatus === 'syncing' ? 'bg-amber-400 animate-bounce' : 'bg-zinc-600'
                    }`} />
                    <span className="text-zinc-300 uppercase tracking-wider font-bold">Supabase Upsert Connection:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                      connectionStatus === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      connectionStatus === 'error' ? 'bg-red-950 text-red-300 border border-red-800' :
                      connectionStatus === 'syncing' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}>
                      {connectionStatus === 'success' ? 'Synced & Active' :
                       connectionStatus === 'error' ? 'Sync Error / RLS Notice' :
                       connectionStatus === 'syncing' ? 'Transferring Data...' : 'Standby / Ready'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSyncLogs([])}
                      className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 uppercase tracking-wider px-2 py-1 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                    >
                      Clear Log
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDebugPanel(!showDebugPanel)}
                      className="text-[10px] font-mono text-amber-400 hover:text-amber-300 uppercase tracking-wider px-2.5 py-1 rounded bg-amber-950/40 border border-amber-800/60 font-bold cursor-pointer"
                    >
                      {showDebugPanel ? 'Hide Live Logs' : `Show Live Logs (${syncLogs.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUpsertBox(false)}
                      className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-900 cursor-pointer"
                      title="Hide connection box"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {showDebugPanel && (
                  <div className="bg-black/90 rounded-xl border border-zinc-800 p-2.5 max-h-36 overflow-y-auto font-mono text-[10px] space-y-1 shadow-inner select-text">
                    {syncLogs.length === 0 ? (
                      <div className="text-zinc-600 italic py-1 text-center">
                        No active database transfer logs yet. Click "Save & Sync Archive" to initiate live Supabase upsert.
                      </div>
                    ) : (
                      syncLogs.map((log, lIdx) => (
                        <div key={`sync-log-${lIdx}-${log.timestamp}`} className="flex items-start gap-2 text-zinc-300 border-b border-zinc-900/60 pb-1 last:border-0">
                          <span className="text-zinc-500 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                          </span>
                          <span className={log.message.includes('Success') || log.message.includes('fully synced') ? 'text-emerald-400 font-bold' : log.message.includes('error') || log.message.includes('fail') || log.message.includes('notice') ? 'text-amber-400' : 'text-zinc-300'}>
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Sticky Mobile-First Footer with Save Button & Supabase Toggle */}
            <div className="p-4 border-t border-zinc-850 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 flex flex-wrap items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePage('list')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase font-bold border border-zinc-800 cursor-pointer"
                >
                  ← Back to List
                </button>

                <button
                  type="button"
                  onClick={() => setShowUpsertBox(!showUpsertBox)}
                  className={`px-2.5 py-2 rounded-xl text-[11px] font-mono border flex items-center gap-1.5 transition-all cursor-pointer ${
                    showUpsertBox
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                      : 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Toggle Supabase Upsert Connection Details & Live Logs"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    connectionStatus === 'success' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' :
                    connectionStatus === 'error' ? 'bg-red-400 shadow-[0_0_6px_#f87171]' :
                    connectionStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'
                  }`} />
                  <Database className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline font-bold">Supabase</span>
                  {showUpsertBox ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-mono font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save & Sync Archive</span>
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CommunityBandCuratorModal;
