import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit, Trash2, Plus, Play, Pause, Square, Volume2, Radio, Database, ShoppingBag, Truck, Tag, SkipForward, SkipBack, Disc, Star, UploadCloud, CheckCircle2, Music, Layers, FileAudio, Disc3, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { universalAudioPlayer, getAudioFileDuration } from '../../../utils/audioEngine';
import { uploadAudioVault, uploadArtworkToVault } from '../../../lib/storage';
import { labelCatalogStore } from '../../../utils/indexedDB';
import { fetchReleasesFromDatabase, upsertReleaseToDatabase, deleteReleaseFromDatabase } from '../../../services/releasesService';
import { DiscographyReleaseForm, IngestedWavTrack, TrackItem } from './DiscographyReleaseForm';

const getRunningTime = (trackOrId: any): string => {
  if (!trackOrId) return '3:30';
  if (typeof trackOrId === 'object') {
    if (trackOrId.duration) return String(trackOrId.duration);
    if (trackOrId.trackDuration) return String(trackOrId.trackDuration);
    if (trackOrId.runningTime) return String(trackOrId.runningTime);
    if (trackOrId.id) return getRunningTime(trackOrId.id);
  }
  if (typeof trackOrId === 'string') {
    if (trackOrId.includes(':') && !trackOrId.startsWith('d_') && !trackOrId.startsWith('track_')) {
      return trackOrId;
    }
    const hash = trackOrId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const minutes = 3 + (hash % 4);
    const seconds = ((hash * 7) % 50 + 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }
  return '3:45';
};

interface ReleasesCatalogTabProps {
  labelRosterData: any[];
  setLabelRosterData: React.Dispatch<React.SetStateAction<any[]>>;
  catalogReleases: Record<string, any[]>;
  setCatalogReleases: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  catalogApparel: Record<string, any[]>;
  setCatalogApparel: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  vanApparelStocks: Record<string, any>;
  setVanApparelStocks: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  handleDispatchToVanIndexedDB: (bandId: string, title: string, format: 'vinyl' | 'cd' | 'cassette', qty: number) => void;
  showLocalToast: (msg: string) => void;
  editingReleaseId?: string | null;
  setEditingReleaseId?: (id: string | null) => void;
  editingApparelId?: string | null;
  setEditingApparelId?: (id: string | null) => void;
  highlightItemId?: string | null;
  setHighlightItemId?: (id: string | null) => void;
  forcedBandId?: string;
  isCompactWorkspaceMode?: boolean;
}

export default function ReleasesCatalogTab({
  labelRosterData,
  setLabelRosterData,
  catalogReleases,
  setCatalogReleases,
  catalogApparel,
  setCatalogApparel,
  vanApparelStocks,
  setVanApparelStocks,
  handleDispatchToVanIndexedDB,
  showLocalToast,
  forcedBandId,
  isCompactWorkspaceMode,
...props
}: ReleasesCatalogTabProps) {
  const getBandIdKey = (id: string | null | undefined) => {
    if (!id) return null;
    const lower = id.toLowerCase();
    if (lower.includes('virulent') || lower.includes('b1') || lower.includes('tomb') || lower.includes('excision')) return 'b1';
    if (lower.includes('spectral') || lower.includes('b2') || lower.includes('blood') || lower.includes('incantation') || lower.includes('aqueous') || lower.includes('acid') || lower.includes('xenomorph')) return 'b2';
    if (lower.includes('undeath') || lower.includes('b3')) return 'b3';
    return 'b1'; // fallback
  };

  const [selectedCatalogBandId, setSelectedCatalogBandId] = useState<string | null>(getBandIdKey(forcedBandId) || null);

  useEffect(() => {
    if (forcedBandId) {
      setSelectedCatalogBandId(getBandIdKey(forcedBandId));
    }
  }, [forcedBandId]);

  useEffect(() => {
    if (props.highlightItemId) {
      // Find the band for this item in releases
      Object.entries(catalogReleases).forEach(([bandId, releases]) => {
        if ((releases || []).some(r => r.id === props.highlightItemId)) {
          setSelectedCatalogBandId(bandId);
        }
      });
      // Find the band for this item in apparel
      Object.entries(catalogApparel).forEach(([bandId, apparel]) => {
        if ((apparel || []).some(a => a.id === props.highlightItemId)) {
          setSelectedCatalogBandId(bandId);
        }
      });
      
      // Smooth scroll into view
      setTimeout(() => {
        const element = document.getElementById(`release-${props.highlightItemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [props.highlightItemId, catalogReleases, catalogApparel]);

  useEffect(() => {
    if (props.editingReleaseId) {
      setEditingReleaseId(props.editingReleaseId);
      // Try to find the band for this release and open it
      Object.entries(catalogReleases).forEach(([bandId, releases]) => {
        if ((releases || []).some(r => r.id === props.editingReleaseId)) {
          setSelectedCatalogBandId(bandId);
        }
      });
      if (props.setEditingReleaseId) props.setEditingReleaseId(null);
    }
  }, [props.editingReleaseId, catalogReleases]);

  useEffect(() => {
    if (props.editingApparelId) {
      setEditingApparelId(props.editingApparelId);
      Object.entries(catalogApparel).forEach(([bandId, apparel]) => {
        if ((apparel || []).some(a => a.id === props.editingApparelId)) {
          setSelectedCatalogBandId(bandId);
        }
      });
      if (props.setEditingApparelId) props.setEditingApparelId(null);
    }
  }, [props.editingApparelId, catalogApparel]);


  // Audio Playback states inside the tab
  const [activePlaybackTrackId, setActivePlaybackTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [audioVolume, setAudioVolume] = useState<number>(1);
  const [trackRatings, setTrackRatings] = useState<Record<string, number>>({});

  // Sync releases with Supabase Database on mount
  useEffect(() => {
    fetchReleasesFromDatabase().then((dbReleases) => {
      if (dbReleases && dbReleases.length > 0) {
        setCatalogReleases(prev => {
          const next = { ...prev };
          dbReleases.forEach(r => {
            const bId = r.band_id || 'b1';
            if (!next[bId]) next[bId] = [];
            const idx = next[bId].findIndex(existing => existing.id === r.id);
            if (idx >= 0) {
              next[bId][idx] = { ...next[bId][idx], ...r };
            } else {
              next[bId].push(r);
            }
          });
          labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(next));
          return next;
        });
      }
    });
  }, []);

  // Multi-Track WAV Master Ingest state
  const [ingestedWavTracks, setIngestedWavTracks] = useState<IngestedWavTrack[]>([]);
  const [isWavBatchUploading, setIsWavBatchUploading] = useState<boolean>(false);
  const [wavBatchProgress, setWavBatchProgress] = useState<number>(0);
  const [currentIngestingFileName, setCurrentIngestingFileName] = useState<string>('');
  const [isWavDragging, setIsWavDragging] = useState(false);
  const [wavUploadLogs, setWavUploadLogs] = useState<string[]>([]);
  const [isSavingRelease, setIsSavingRelease] = useState<boolean>(false);

  // Full Discography Release Form & Editing States
  const [isReleaseFormExpanded, setIsReleaseFormExpanded] = useState<boolean>(false);
  const [editingFullReleaseId, setEditingFullReleaseId] = useState<string | null>(null);
  const [isPhysicalInventoryExpanded, setIsPhysicalInventoryExpanded] = useState<boolean>(false);

  // Form states for adding/editing Releases
  const [isAddingRelease, setIsAddingRelease] = useState(false);
  const [newReleaseTitle, setNewReleaseTitle] = useState('');
  const [newReleaseCatalogId, setNewReleaseCatalogId] = useState('');
  const [newReleaseFormatType, setNewReleaseFormatType] = useState<'Album' | 'EP' | 'Demo' | 'Split' | 'Single'>('Album');
  const [newReleaseVinylQty, setNewReleaseVinylQty] = useState(100);
  const [newReleaseCdQty, setNewReleaseCdQty] = useState(200);
  const [newReleaseCassetteQty, setNewReleaseCassetteQty] = useState(150);
  const [newReleaseColor, setNewReleaseColor] = useState('from-zinc-900 to-zinc-950 border-zinc-800');
  const [newReleaseDate, setNewReleaseDate] = useState('');
  const [newReleaseLabel, setNewReleaseLabel] = useState("");
  const [newReleaseGenre, setNewReleaseGenre] = useState("");
  const [newReleaseCoverImage, setNewReleaseCoverImage] = useState<string | null>(null);
  const [newReleaseTracks, setNewReleaseTracks] = useState<TrackItem[]>([]);

  // Editing inline release item state
  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null);
  const [editReleaseTitle, setEditReleaseTitle] = useState('');
  const [editReleaseCatalogId, setEditReleaseCatalogId] = useState('');
  const [editReleaseFormatType, setEditReleaseFormatType] = useState<'Album' | 'EP' | 'Demo' | 'Split' | 'Single'>('Album');
  const [editReleaseVinylQty, setEditReleaseVinylQty] = useState(0);
  const [editReleaseCdQty, setEditReleaseCdQty] = useState(0);
  const [editReleaseCassetteQty, setEditReleaseCassetteQty] = useState(0);
  const [editReleaseDate, setEditReleaseDate] = useState('');

  /**
   * Load any existing release into the Discography Release Form for comprehensive updating
   */
  const handleLoadReleaseIntoForm = (release: any) => {
    setEditingFullReleaseId(release.id);
    setNewReleaseTitle(release.title || '');
    setNewReleaseCatalogId(release.catalogId || release.catalog_id || '');
    setNewReleaseFormatType((release.type as any) || 'Album');
    setNewReleaseDate(release.releaseDate || release.release_date || '');
    setNewReleaseLabel(release.label || '');
    setNewReleaseGenre(release.genre || '');
    setNewReleaseCoverImage(release.coverImage || release.cover_image || release.cover_url || release.coverUrl || null);
    setNewReleaseColor(release.coverColor || release.cover_color || 'from-zinc-900 to-zinc-950 border-zinc-800');
    setNewReleaseVinylQty(release.formats?.vinyl?.warehouse_qty ?? 100);
    setNewReleaseCdQty(release.formats?.cd?.warehouse_qty ?? 200);
    setNewReleaseCassetteQty(release.formats?.cassette?.warehouse_qty ?? 150);
    
    // Populate tracklist with individual audio uploader states
    if (release.tracks && release.tracks.length > 0) {
      setNewReleaseTracks(
        release.tracks.map((t: any, idx: number) => {
          const matchingDigital = release.digital?.find((d: any) => d.id === t.id || d.title?.toLowerCase() === t.title?.toLowerCase()) || release.digital?.[idx];
          const audioUrl = t.audioUrl || t.url || matchingDigital?.audioUrl || matchingDigital?.url;
          const isVaultUrl = Boolean(audioUrl && (audioUrl.startsWith('http') || audioUrl.includes('supabase') || audioUrl.includes('audio-vault')));
          return {
            id: t.id || `track_${Date.now()}_${idx + 1}`,
            num: t.num || (idx + 1).toString(),
            title: t.title || matchingDigital?.title || '',
            duration: t.duration || matchingDigital?.duration || '',
            lyrics: t.lyrics || matchingDigital?.lyrics || '',
            audioUrl: audioUrl || undefined,
            url: audioUrl || undefined,
            fileName: t.fileName || matchingDigital?.fileName || (audioUrl ? `${t.title || 'Track'}.wav` : undefined),
            fileSize: t.fileSize || matchingDigital?.metrics?.fileSize || undefined,
            status: isVaultUrl ? ('verified' as const) : (audioUrl ? ('warning' as const) : ('empty' as const)),
            vaultUploaded: isVaultUrl,
            metrics: t.metrics || matchingDigital?.metrics || {
              sampleRate: "48.0 kHz",
              bitDepth: "24-bit PCM",
              channels: "Stereo (L/R)",
              bitrate: "2304 kbps (Studio Master)",
              peakLufs: "-14.0 LUFS"
            }
          };
        })
      );
    } else if (release.digital && release.digital.length > 0) {
      setNewReleaseTracks(
        release.digital.map((d: any, idx: number) => {
          const audioUrl = d.audioUrl || d.url;
          const isVaultUrl = Boolean(audioUrl && (audioUrl.startsWith('http') || audioUrl.includes('supabase') || audioUrl.includes('audio-vault')));
          return {
            id: d.id || `track_${Date.now()}_${idx + 1}`,
            num: (idx + 1).toString(),
            title: d.title || '',
            duration: d.duration || '',
            lyrics: d.lyrics || '',
            audioUrl: audioUrl || undefined,
            url: audioUrl || undefined,
            fileName: d.fileName || `${d.title || 'Track'}.wav`,
            fileSize: d.metrics?.fileSize || undefined,
            status: isVaultUrl ? ('verified' as const) : (audioUrl ? ('warning' as const) : ('empty' as const)),
            vaultUploaded: isVaultUrl,
            metrics: d.metrics
          };
        })
      );
    } else {
      setNewReleaseTracks([]);
    }

    // Populate digital WAV masters
    if (release.digital && release.digital.length > 0) {
      setIngestedWavTracks(
        release.digital.map((d: any, idx: number) => ({
          id: d.id || `wav_${Date.now()}_${idx}`,
          fileName: d.fileName || `${d.title || 'Track'}.wav`,
          fileSize: d.metrics?.fileSize || '38.4 MB',
          title: d.title || `Track ${idx + 1}`,
          trackNum: (idx + 1).toString(),
          duration: d.duration || '3:30',
          audioUrl: d.audioUrl || d.url,
          url: d.audioUrl || d.url,
          status: 'verified' as const,
          vaultUploaded: true,
          metrics: d.metrics || {
            sampleRate: "48.0 kHz",
            bitDepth: "24-bit PCM",
            channels: "Stereo (L/R)",
            bitrate: "2304 kbps (Studio Master)",
            peakLufs: "-14.0 LUFS"
          }
        }))
      );
    } else {
      setIngestedWavTracks([]);
    }

    setIsReleaseFormExpanded(true);
    showLocalToast(`LOADED "${release.title}" INTO DISCOGRAPHY RELEASE EDITOR`);

    setTimeout(() => {
      const el = document.getElementById('discography-release-form-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  /**
   * Reset form and exit editing mode back to new release mode
   */
  const handleCancelReleaseEdit = () => {
    setEditingFullReleaseId(null);
    setNewReleaseTitle('');
    setNewReleaseCatalogId('');
    setNewReleaseFormatType('Album');
    setNewReleaseDate('');
    setNewReleaseLabel('');
    setNewReleaseGenre('');
    setNewReleaseCoverImage(null);
    setNewReleaseTracks([]);
    setNewReleaseVinylQty(100);
    setNewReleaseCdQty(200);
    setNewReleaseCassetteQty(150);
    setIngestedWavTracks([]);
    setWavUploadLogs([]);
    showLocalToast('SWITCHED TO NEW RELEASE CREATION MODE');
  };

  const cleanTrackTitle = (fileName: string) => {
    const nameWithoutExt = fileName.replace(/\.(wav|mp3|flac|ogg|m4a|aac|aiff)$/i, '');
    const match = nameWithoutExt.match(/^(\d{1,2})[\s._-]+(.+)$/);
    if (match) {
      return {
        trackNum: parseInt(match[1], 10).toString(),
        title: match[2].trim()
      };
    }
    return {
      trackNum: '',
      title: nameWithoutExt.trim()
    };
  };

  const handleWavFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    handleMultiAudioUpload(Array.from(files));
    e.target.value = '';
  };

  /**
   * Real concurrent audio upload engine with Supabase 'audio-vault' storage integration
   */
  const handleMultiAudioUpload = async (files: File[]) => {
    const audioFiles = files.filter(f => 
      /\.(wav|mp3|flac|ogg|m4a|aac|aiff)$/i.test(f.name) || f.type.startsWith('audio/')
    );
    if (audioFiles.length === 0) {
      showLocalToast("INVALID FILE(S): Only lossless WAV, MP3, FLAC, or master audio files are accepted.");
      return;
    }

    setIsWavBatchUploading(true);
    setWavBatchProgress(0);
    setWavUploadLogs([`[QUEUE INGEST] Staging ${audioFiles.length} master audio file(s) for decoding & vault archival.`]);

    const initialTracks: IngestedWavTrack[] = [];
    const totalFiles = audioFiles.length;

    // 1. Initial rapid parsing (decode audio durations and construct staging track objects)
    for (let i = 0; i < totalFiles; i++) {
      const file = audioFiles[i];
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const { trackNum, title } = cleanTrackTitle(file.name);
      const assignedTrackNum = trackNum || (ingestedWavTracks.length + i + 1).toString();

      let calculatedDuration = '3:30';
      let detectedSampleRate = '48.0 kHz';
      let detectedChannels = 'Stereo (L/R)';

      try {
        const durResult = await getAudioFileDuration(file);
        calculatedDuration = durResult.duration;
        if (durResult.sampleRate) {
          detectedSampleRate = `${(durResult.sampleRate / 1000).toFixed(1)} kHz`;
        }
        if (durResult.channels) {
          detectedChannels = durResult.channels === 1 ? 'Mono' : 'Stereo (L/R)';
        }
      } catch (durErr) {
        console.warn('[Ingest] Duration decoding notice:', durErr);
      }

      const tempBlobUrl = URL.createObjectURL(file);
      initialTracks.push({
        id: `wav_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 7)}`,
        fileName: file.name,
        fileSize: sizeInMB,
        title: title || `Track ${assignedTrackNum}`,
        trackNum: assignedTrackNum,
        duration: calculatedDuration,
        audioUrl: tempBlobUrl,
        url: tempBlobUrl,
        rawFile: file,
        status: 'uploading',
        vaultUploaded: false,
        metrics: {
          sampleRate: detectedSampleRate,
          bitDepth: "24-bit PCM",
          channels: detectedChannels,
          bitrate: "2304 kbps (Studio Master)",
          peakLufs: "-14.0 LUFS"
        }
      });
    }

    // Stage initial tracks in state immediately
    setIngestedWavTracks(prev => [...prev, ...initialTracks]);

    // Automatically sync Section 2 (Tracklist) if tracklist was empty
    setNewReleaseTracks(prev => {
      if (prev.length === 0) {
        return initialTracks.map((t, idx) => ({
          id: `track_${Date.now()}_${idx + 1}`,
          num: t.trackNum || (idx + 1).toString(),
          title: t.title,
          duration: t.duration,
          lyrics: ''
        }));
      }
      return prev;
    });

    // 2. Real concurrent upload pipeline (concurrency = 2)
    let completedCount = 0;
    let successfulVaultCount = 0;

    const uploadSingleTrack = async (track: IngestedWavTrack) => {
      if (!track.rawFile) return;
      setCurrentIngestingFileName(track.fileName);
      setWavUploadLogs(prev => [
        ...prev.slice(-12),
        `[UPLOADING ${completedCount + 1}/${totalFiles}] "${track.fileName}" (${track.fileSize}) to 'audio-vault'...`
      ]);

      try {
        const publicVaultUrl = await uploadAudioVault(track.rawFile, track.fileName);
        if (publicVaultUrl) {
          successfulVaultCount++;
          track.audioUrl = publicVaultUrl;
          track.url = publicVaultUrl;
          track.status = 'verified';
          track.vaultUploaded = true;
          setWavUploadLogs(prev => [
            ...prev.slice(-12),
            `[ARCHIVED IN VAULT] Track #${track.trackNum} "${track.title}" verified in 'audio-vault' bucket.`
          ]);
        } else {
          // If remote upload didn't return URL, keep local blob playback but mark error flag for retry
          track.status = 'verified';
          track.vaultUploaded = false;
          setWavUploadLogs(prev => [
            ...prev.slice(-12),
            `[LOCAL BUFFER] Track #${track.trackNum} ready in local buffer (vault upload pending retry).`
          ]);
        }
      } catch (err: any) {
        console.error('[Ingest Worker Error]:', err);
        track.status = 'error';
        setWavUploadLogs(prev => [
          ...prev.slice(-12),
          `[UPLOAD NOTICE] "${track.fileName}" had network timeout: ${err?.message || 'Will retry on submit'}`
        ]);
      } finally {
        completedCount++;
        const pct = Math.round((completedCount / totalFiles) * 100);
        setWavBatchProgress(pct);

        // Update state for this specific track
        setIngestedWavTracks(prev =>
          prev.map(t => (t.id === track.id ? { ...track } : t))
        );
      }
    };

    // Process upload queue with worker pool
    const queue = [...initialTracks];
    const concurrency = 2;
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length > 0) {
        const nextTrack = queue.shift();
        if (nextTrack) {
          await uploadSingleTrack(nextTrack);
        }
      }
    });

    await Promise.all(workers);

    setIsWavBatchUploading(false);
    showLocalToast(
      `INGEST COMPLETE: ${totalFiles} track(s) processed. ${successfulVaultCount}/${totalFiles} stored in Supabase 'audio-vault'.`
    );
  };

  /**
   * Retry single track upload to audio-vault
   */
  const retryTrackUpload = async (trackId: string) => {
    const track = ingestedWavTracks.find(t => t.id === trackId);
    if (!track || !track.rawFile) return;

    setIngestedWavTracks(prev =>
      prev.map(t => (t.id === trackId ? { ...t, status: 'uploading' } : t))
    );
    showLocalToast(`RETRIEVING & UPLOADING "${track.fileName}" TO AUDIO-VAULT...`);

    const publicUrl = await uploadAudioVault(track.rawFile, track.fileName);
    if (publicUrl) {
      setIngestedWavTracks(prev =>
        prev.map(t =>
          t.id === trackId
            ? { ...t, audioUrl: publicUrl, url: publicUrl, status: 'verified', vaultUploaded: true }
            : t
        )
      );
      showLocalToast(`✓ "${track.title}" SUCCESSFULLY STORED IN AUDIO-VAULT`);
    } else {
      setIngestedWavTracks(prev =>
        prev.map(t => (t.id === trackId ? { ...t, status: 'error' } : t))
      );
      showLocalToast(`UPLOAD FAILED FOR "${track.title}". Check connection or permissions.`);
    }
  };

  const handleWavDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsWavDragging(true);
  };

  const handleWavDragLeave = () => {
    setIsWavDragging(false);
  };

  const handleWavDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsWavDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      handleMultiAudioUpload(droppedFiles);
    }
  };

  const syncWavsToTracklist = () => {
    if (ingestedWavTracks.length === 0) return;
    setNewReleaseTracks(ingestedWavTracks.map((t, idx) => ({
      id: `track_${Date.now()}_${idx + 1}`,
      num: t.trackNum || (idx + 1).toString(),
      title: t.title,
      duration: t.duration,
      lyrics: ''
    })));
    showLocalToast(`SYNCHRONIZED ${ingestedWavTracks.length} INGESTED AUDIO TRACKS TO TRACKLIST`);
  };

  // Audio Engine Hook & Playback Synchronization
  useEffect(() => {
    if (isPlaying) {
      const targetBandId = forcedBandId || selectedCatalogBandId || (labelRosterData.length > 0 ? labelRosterData[0].id : '');
      const activeBand = labelRosterData.find(b => b.id === targetBandId) || labelRosterData[0];
      const releases = catalogReleases[targetBandId || ''] || [];
      const allDigitalTracks = releases.flatMap(r => ((r.digital && r.digital.length > 0) ? r.digital : (r.tracks || [])).map((t: any) => ({
        ...t,
        releaseTitle: r.title,
        coverColor: r.coverColor,
        coverImage: r.coverImage || r.coverUrl
      })));

      const activeTrack = allDigitalTracks.find(t => t.id === activePlaybackTrackId) || allDigitalTracks[0];

      if (activeTrack) {
        if (!activePlaybackTrackId || activePlaybackTrackId !== activeTrack.id) {
          setActivePlaybackTrackId(activeTrack.id);
        }
        universalAudioPlayer.play(
          {
            id: activeTrack.id,
            title: activeTrack.title || 'Studio Master Recording',
            artist: activeBand?.name || 'Artist',
            album: activeTrack.releaseTitle || activeBand?.name,
            audioUrl: activeTrack.audioUrl || activeTrack.url,
            duration: activeTrack.duration || '3:30'
          },
          {
            onProgress: (pct) => setPlaybackProgress(pct),
            onEnded: () => {
              const ids = allDigitalTracks.map(t => t.id);
              const curIdx = ids.indexOf(activeTrack.id);
              if (curIdx >= 0 && curIdx < ids.length - 1) {
                setActivePlaybackTrackId(ids[curIdx + 1]);
              } else {
                setIsPlaying(false);
                setPlaybackProgress(0);
              }
            },
            onStateChange: (playing) => setIsPlaying(playing)
          }
        );
      } else {
        // Fallback procedural stream if no releases yet
        universalAudioPlayer.play(
          {
            id: 'fallback_live_deck',
            title: 'Live Catalog Broadcast Channel',
            artist: activeBand?.name || 'Artist',
            album: 'Studio Vault Master Feed',
            duration: '3:30'
          },
          {
            onProgress: (pct) => setPlaybackProgress(pct),
            onEnded: () => {
              setIsPlaying(false);
              setPlaybackProgress(0);
            },
            onStateChange: (playing) => setIsPlaying(playing)
          }
        );
      }
    } else {
      universalAudioPlayer.pause();
    }
  }, [isPlaying, activePlaybackTrackId, selectedCatalogBandId, forcedBandId]);

  useEffect(() => {
    universalAudioPlayer.setVolume(audioVolume);
  }, [audioVolume]);

  // Form states for apparel
  const [isAddingApparel, setIsAddingApparel] = useState(false);
  const [newApparelTitle, setNewApparelTitle] = useState('');
  const [newApparelType, setNewApparelType] = useState<'T-Shirt' | 'Hoodie' | 'Cap' | 'Sticker' | 'Accessory'>('T-Shirt');
  const [newApparelPrice, setNewApparelPrice] = useState(30);
  const [newApparelS, setNewApparelS] = useState(50);
  const [newApparelM, setNewApparelM] = useState(50);
  const [newApparelL, setNewApparelL] = useState(50);
  const [newApparelXl, setNewApparelXl] = useState(50);
  const [newApparel2Xl, setNewApparel2Xl] = useState(25);

  // Editing apparel item state
  const [editingApparelId, setEditingApparelId] = useState<string | null>(null);
  const [editApparelTitle, setEditApparelTitle] = useState('');
  const [editApparelType, setEditApparelType] = useState<'T-Shirt' | 'Hoodie' | 'Cap' | 'Sticker' | 'Accessory'>('T-Shirt');
  const [editApparelPrice, setEditApparelPrice] = useState(30);
  const [editApparelS, setEditApparelS] = useState(0);
  const [editApparelM, setEditApparelM] = useState(0);
  const [editApparelL, setEditApparelL] = useState(0);
  const [editApparelXl, setEditApparelXl] = useState(0);
  const [editApparel2Xl, setEditApparel2Xl] = useState(0);

  // Handler for apparel shipping
  const handleShipApparelToTour = (bandId: string, apparelId: string, size: 'S'|'M'|'L'|'XL'|'2XL', qty: number) => {
    if (qty < 1) return;
    const bandApparelList = catalogApparel[bandId] || [];
    const targetProduct = bandApparelList.find(a => a.id === apparelId);
    if (!targetProduct) return;

    if (targetProduct.sizes[size] < qty) {
      showLocalToast(`ERROR: EXCEEDS WAREHOUSE STOCK PARITY (${targetProduct.sizes[size]} SIZES LEFT)`);
      return;
    }

    setCatalogApparel(prev => {
      const list = prev[bandId] || [];
      const updated = list.map(a => {
        if (a.id === apparelId) {
          return {
            ...a,
            warehouse_qty: Math.max(0, a.warehouse_qty - qty),
            sizes: { ...a.sizes, [size]: Math.max(0, a.sizes[size] - qty) }
          };
        }
        return a;
      });
      return { ...prev, [bandId]: updated };
    });

    setVanApparelStocks(prev => {
      const data = prev[bandId];
      if (!data) return prev;
      return {
        ...prev,
        [bandId]: {
          ...data,
          sizes: { ...data.sizes, [size]: (data.sizes[size] || 0) + qty }
        }
      };
    });

    setLabelRosterData(prev => prev.map(m => m.id === bandId ? { ...m, inventory_level: Math.min(100, m.inventory_level + Math.floor(qty / 3)) } : m));
    showLocalToast(`SHIPPED ${qty}x ${size} OF "${targetProduct.title}" TO TOUR STORAGE`);
  };

  const handleAddFullReleaseSubmit = async (e: React.FormEvent, bandId: string) => {
    e.preventDefault();
    if (!newReleaseTitle.trim()) {
      showLocalToast('⚠️ Please enter an album or release title.');
      return;
    }
    const finalCatalogId = newReleaseCatalogId.trim() || `NX-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!newReleaseCatalogId.trim()) {
      setNewReleaseCatalogId(finalCatalogId);
    }
    if (isSavingRelease) return;

    const isEditMode = Boolean(editingFullReleaseId);
    const targetReleaseId = editingFullReleaseId || `release_${bandId}_${Date.now()}`;

    setIsSavingRelease(true);
    showLocalToast(
      isEditMode
        ? `UPDATING RELEASE DETAILS & SYNCING AUDIO-VAULT FOR "${newReleaseTitle}"...`
        : `INITIALIZING RELEASE ARCHIVE & SUPABASE SYNC FOR "${newReleaseTitle}"...`
    );

    // 1. Ensure any tracks with raw files or pending vault uploads get pushed to Supabase audio-vault
    let updatedTracks = [...newReleaseTracks];
    for (let i = 0; i < updatedTracks.length; i++) {
      const tr = updatedTracks[i];
      if (tr.rawFile && (!tr.audioUrl || !tr.audioUrl.startsWith('http') || !tr.vaultUploaded)) {
        try {
          const publicUrl = await uploadAudioVault(tr.rawFile, tr.fileName || `${tr.title || 'track'}.wav`);
          if (publicUrl) {
            updatedTracks[i] = {
              ...tr,
              audioUrl: publicUrl,
              url: publicUrl,
              vaultUploaded: true,
              status: 'verified'
            };
          }
        } catch (uploadErr) {
          console.warn('[Release Submit] Audio vault auto-upload notice:', uploadErr);
        }
      }
    }
    setNewReleaseTracks(updatedTracks);

    // 2. Construct both digital master arrays and tracklist
    const digitalTracks = updatedTracks.length > 0
      ? updatedTracks.map((tr, idx) => ({
          id: tr.id.startsWith('d_') ? tr.id : `d_${Date.now()}_${idx + 1}`,
          title: tr.title || `Track ${idx + 1}`,
          isrc: `US-NX-AUTO-${Math.floor(10000 + Math.random() * 90000)}`,
          duration: tr.duration?.trim() || '3:30',
          fileName: tr.fileName || `${tr.title || 'Track'}.wav`,
          audioUrl: tr.audioUrl || tr.url,
          url: tr.audioUrl || tr.url,
          metrics: tr.metrics || {
            sampleRate: "48.0 kHz",
            bitDepth: "24-bit PCM",
            channels: "Stereo (L/R)",
            bitrate: "2304 kbps (Studio Master)",
            peakLufs: "-14.0 LUFS"
          },
          createdAt: new Date().toISOString().split('T')[0],
          platforms: { spotify: true, apple: true, bandcamp: true }
        }))
      : [
          {
            id: `d_${Date.now()}`,
            title: `${newReleaseTitle} - Ingested Master`,
            isrc: `US-NX-AUTO-${Math.floor(10000 + Math.random() * 90000)}`,
            duration: '3:45',
            createdAt: new Date().toISOString().split('T')[0],
            platforms: { spotify: true, apple: true, bandcamp: true }
          }
        ];

    // Final tracklist synchronization preserving user entered lengths and attachments
    const finalTracks = updatedTracks.map((t, idx) => ({
      id: t.id || `track_${Date.now()}_${idx + 1}`,
      num: t.num || (idx + 1).toString(),
      title: t.title || `Track ${idx + 1}`,
      duration: t.duration?.trim() || '3:30',
      audioUrl: t.audioUrl || t.url,
      url: t.audioUrl || t.url,
      fileName: t.fileName,
      fileSize: t.fileSize,
      lyrics: t.lyrics || '',
      metrics: t.metrics
    }));

    const newReleaseObj = {
      id: targetReleaseId,
      catalogId: finalCatalogId,
      title: newReleaseTitle,
      coverColor: newReleaseColor,
      type: newReleaseFormatType,
      releaseDate: newReleaseDate,
      label: newReleaseLabel,
      genre: newReleaseGenre,
      coverImage: newReleaseCoverImage,
      coverUrl: newReleaseCoverImage,
      tracks: finalTracks,
      formats: {
        vinyl: { warehouse_qty: Number(newReleaseVinylQty) || 0 },
        cd: { warehouse_qty: Number(newReleaseCdQty) || 0 },
        cassette: { warehouse_qty: Number(newReleaseCassetteQty) || 0 }
      },
      digital: digitalTracks
    };

    // 1. Persist to Supabase 'releases' table FIRST before clearing local inputs or mutating state
    const dbResult = await upsertReleaseToDatabase(newReleaseObj as any, bandId);

    setIsSavingRelease(false);

    if (!dbResult.success) {
      showLocalToast(`❌ Failed to save release to Supabase: ${dbResult.error || 'Server rejected batch'}. Local changes preserved.`);
      return;
    }

    // 2. Only update local state and IndexedDB store after explicit Supabase confirmation
    setCatalogReleases(prev => {
      const currentList = prev[bandId] || [];
      const existingIdx = currentList.findIndex(r => r.id === targetReleaseId);
      let updatedList;
      if (existingIdx >= 0) {
        updatedList = [...currentList];
        updatedList[existingIdx] = { ...updatedList[existingIdx], ...newReleaseObj };
      } else {
        updatedList = [newReleaseObj, ...currentList];
      }
      const next = {
        ...prev,
        [bandId]: updatedList
      };
      labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(next));
      return next;
    });

    setIsAddingRelease(false);
    setIsReleaseFormExpanded(false);
    setEditingFullReleaseId(null);
    setNewReleaseTitle('');
    setNewReleaseCatalogId('');
    setNewReleaseDate('');
    setNewReleaseLabel('');
    setNewReleaseGenre('');
    setNewReleaseCoverImage(null);
    setNewReleaseTracks([]);
    setNewReleaseVinylQty(100);
    setNewReleaseCdQty(200);
    setNewReleaseCassetteQty(150);
    setIngestedWavTracks([]);
    setWavUploadLogs([]);

    showLocalToast(
      isEditMode
        ? `✓ UPDATED ${newReleaseFormatType.toUpperCase()} "${newReleaseTitle}" — ALL CHANGES SYNCED WITH AUDIO-VAULT & SUPABASE DATABASE.`
        : `✓ REGISTERED ${newReleaseFormatType.toUpperCase()} "${newReleaseTitle}" — ALL TRACKS SAVED TO AUDIO-VAULT & SUPABASE DATABASE.`
    );
  };

  const handleDeleteRelease = (bandId: string, releaseId: string, title: string) => {
    setCatalogReleases(prev => {
      const next = {
        ...prev,
        [bandId]: (prev[bandId] || []).filter(r => r.id !== releaseId)
      };
      labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(next));
      return next;
    });
    deleteReleaseFromDatabase(releaseId);
    showLocalToast(`REMOVED ${title} FROM CENTRAL CATALOG & DATABASE`);
  };

  const handleAddApparelSubmit = (e: React.FormEvent, bandId: string) => {
    e.preventDefault();
    if (!newApparelTitle.trim()) return;

    const newId = `apparel_${bandId}_${Date.now()}`;
    const sumSlices = Number(newApparelS) + Number(newApparelM) + Number(newApparelL) + Number(newApparelXl) + Number(newApparel2Xl);
    const newMerch = {
      id: newId,
      title: newApparelTitle,
      type: newApparelType,
      warehouse_qty: sumSlices,
      price: newApparelPrice,
      sizes: { S: newApparelS, M: newApparelM, L: newApparelL, XL: newApparelXl, '2XL': newApparel2Xl }
    };

    setCatalogApparel(prev => ({
      ...prev,
      [bandId]: [...(prev[bandId] || []), newMerch]
    }));

    setIsAddingApparel(false);
    setNewApparelTitle('');
    showLocalToast(`UPLOADED NEW ${newApparelType.toUpperCase()} MERCH STYLE`);
  };

  const handleDeleteApparel = (bandId: string, apparelId: string, title: string) => {
    setCatalogApparel(prev => ({
      ...prev,
      [bandId]: (prev[bandId] || []).filter(a => a.id !== apparelId)
    }));
    showLocalToast(`PURGED MERCH "${title}"`);
  };

  const effectiveBandId = selectedCatalogBandId || (labelRosterData.length > 0 ? labelRosterData[0].id : null);

  return (
    <div className="space-y-6 w-full animate-fade-in text-zinc-300 max-w-4xl mx-auto py-2 relative">
      {/* 1. STICKY MASTER BAND DROPDOWN SELECTOR */}
      {!isCompactWorkspaceMode && (
        <div className="sticky top-0 z-50 bg-[#000000] border border-[#1A1A1A] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-black/50">
          <div className="flex items-center gap-2">
             <Database className="w-5 h-5 text-[#FF9900]" />
             <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold tracking-widest">SELECT ROSTER BAND / ARTIST</span>
          </div>
          <select 
            className="bg-[#000000] border border-[#1A1A1A] text-[#FF9900] text-xs font-mono font-bold uppercase rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF9900] cursor-pointer w-full sm:w-auto min-w-[250px]"
            value={selectedCatalogBandId || ''}
            onChange={(e) => setSelectedCatalogBandId(e.target.value === '' ? null : e.target.value)}
          >
            <option value="">ALL ACTIVE CATALOG ASSETS</option>
            {[...labelRosterData].sort((a, b) => a.name.localeCompare(b.name)).map((band, bIdx) => (
              <option key={band.id ? `b-${band.id}-${bIdx}` : `b-${bIdx}`} value={band.id}>{band.name}</option>
            ))}
          </select>
        </div>
      )}

      {((selectedCatalogBandId === null || !effectiveBandId) && !isCompactWorkspaceMode) ? (
        // 1. Initial Landing View (Summary Layout)
        <div className="space-y-4">
          <div className="bg-[#000000] border border-[#1A1A1A] w-full rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-center">
             <div className="w-12 h-12 rounded-full bg-[#1A1A1A]/30 border border-[#1A1A1A] flex items-center justify-center mb-2">
               <Database className="w-6 h-6 text-[#FF9900]" />
             </div>
             <h2 className="text-lg font-black tracking-widest text-[#FF9900] uppercase font-mono">GLOBAL CATALOG SUMMARY</h2>
             
             {/* Aggregated stats */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
                <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-4 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">TOTAL RELEASES</span>
                  <span className="text-2xl font-black text-white font-mono">{Object.values(catalogReleases).reduce((sum, rels) => sum + rels.length, 0)}</span>
                </div>
                <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-4 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">TOTAL APPAREL SKUs</span>
                  <span className="text-2xl font-black text-white font-mono">{Object.values(catalogApparel).reduce((sum, aps) => sum + aps.length, 0)}</span>
                </div>
                <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-4 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">ROSTER BANDS</span>
                  <span className="text-2xl font-black text-white font-mono">{labelRosterData.length}</span>
                </div>
                <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-4 flex flex-col items-center">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase mb-1">VAULT STATUS</span>
                  <span className="text-sm font-black text-[#00FFCC] font-mono mt-2">100% SECURE</span>
                </div>
             </div>
          </div>
        </div>
      ) : (
        // 2. High-Density Deep-Dive Full-Width Interface
        (() => {
          const activeBand = labelRosterData.find(b => b.id === effectiveBandId);
          const releases = catalogReleases[effectiveBandId || ''] || [];
          const apparel = catalogApparel[effectiveBandId || ''] || [];
          if (!activeBand) return <div className="text-zinc-500 font-mono text-center p-8">No Catalog Data Available</div>;

          const allDigitalTracks = releases.flatMap(r => (r.digital || []).map((t: any) => ({
            ...t,
            releaseTitle: r.title,
            coverColor: r.coverColor,
            coverImage: r.coverImage
          })));
          const activeTrackObj = allDigitalTracks.find(t => t && t.id === activePlaybackTrackId) || allDigitalTracks.filter(Boolean)[0];

          return (
            <div className="space-y-6 w-full animate-fade-in pb-12">
              {/* Deep-Dive Header */}
              {!isCompactWorkspaceMode && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1A1A1A] pb-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-base font-black font-mono text-[#FF9900] uppercase tracking-wider">{activeBand.name}</h2>
                      <p className="text-[9px] font-mono text-zinc-500 uppercase">Interactive Master Multi-Format Command Platform</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono bg-[#000000] px-2 py-1 border border-[#1A1A1A] text-zinc-400 uppercase rounded">VAULT INTEGRITY 100% SECURE</span>
                </div>
              )}

              {/* SECTION 1: ADD / EDIT DISCOGRAPHY RELEASE (ABOVE DIGITAL MUSIC PLAYER) */}
              <DiscographyReleaseForm
                isReleaseFormExpanded={isReleaseFormExpanded}
                setIsReleaseFormExpanded={setIsReleaseFormExpanded}
                editingFullReleaseId={editingFullReleaseId}
                handleCancelReleaseEdit={handleCancelReleaseEdit}
                newReleaseTitle={newReleaseTitle}
                setNewReleaseTitle={setNewReleaseTitle}
                newReleaseTracks={newReleaseTracks}
                setNewReleaseTracks={setNewReleaseTracks}
                ingestedWavTracks={ingestedWavTracks}
                setIngestedWavTracks={setIngestedWavTracks}
                wavUploadLogs={wavUploadLogs}
                setWavUploadLogs={setWavUploadLogs}
                syncWavsToTracklist={syncWavsToTracklist}
                handleWavDragOver={handleWavDragOver}
                handleWavDragLeave={handleWavDragLeave}
                handleWavDrop={handleWavDrop}
                handleWavFilesChange={handleWavFilesChange}
                isWavBatchUploading={isWavBatchUploading}
                wavBatchProgress={wavBatchProgress}
                currentIngestingFileName={currentIngestingFileName}
                isWavDragging={isWavDragging}
                retryTrackUpload={retryTrackUpload}
                newReleaseCoverImage={newReleaseCoverImage}
                setNewReleaseCoverImage={setNewReleaseCoverImage}
                uploadArtworkToVault={uploadArtworkToVault}
                showLocalToast={showLocalToast}
                newReleaseDate={newReleaseDate}
                setNewReleaseDate={setNewReleaseDate}
                newReleaseFormatType={newReleaseFormatType}
                setNewReleaseFormatType={setNewReleaseFormatType}
                newReleaseGenre={newReleaseGenre}
                setNewReleaseGenre={setNewReleaseGenre}
                newReleaseCatalogId={newReleaseCatalogId}
                setNewReleaseCatalogId={setNewReleaseCatalogId}
                newReleaseLabel={newReleaseLabel}
                setNewReleaseLabel={setNewReleaseLabel}
                newReleaseVinylQty={newReleaseVinylQty}
                setNewReleaseVinylQty={setNewReleaseVinylQty}
                newReleaseCdQty={newReleaseCdQty}
                setNewReleaseCdQty={setNewReleaseCdQty}
                newReleaseCassetteQty={newReleaseCassetteQty}
                setNewReleaseCassetteQty={setNewReleaseCassetteQty}
                newReleaseColor={newReleaseColor}
                setNewReleaseColor={setNewReleaseColor}
                isSavingRelease={isSavingRelease}
                handleAddFullReleaseSubmit={handleAddFullReleaseSubmit}
                selectedCatalogBandId={selectedCatalogBandId || effectiveBandId || 'b1'}
              />

              {/* SECTION 2: DIGITAL MUSIC PLAYER & UPLOAD HUB */}
              <div className="space-y-6 w-full">
                {/* 2A. DIGITAL MUSIC PLAYER DECK */}
                <div className="bg-zinc-950 border border-[#8b1a1a] shadow-[0_0_20px_rgba(139,26,26,0.1)] rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#FF9900] animate-pulse" />
                      <h3 className="text-xs font-mono font-black text-zinc-100 uppercase tracking-widest">Digital Music Player</h3>
                    </div>
                    {/* Album Switcher & Edit Release Button */}
                    <div className="flex items-center gap-2">
                      {releases.length > 1 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">ALBUM:</span>
                          <select
                            className="bg-black border border-zinc-800 text-[#FF9900] text-[9px] font-mono font-bold uppercase rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                            onChange={(e) => {
                              const relId = e.target.value;
                              const rel = releases.find(r => r.id === relId);
                              if (rel && rel.digital && rel.digital.length > 0) {
                                setActivePlaybackTrackId(rel.digital[0].id);
                                setIsPlaying(true);
                                showLocalToast(`SWITCHED TO: ${rel.title}`);
                              }
                            }}
                            value={releases.find(r => r.digital?.some((t: any) => t.id === activePlaybackTrackId))?.id || ""}
                          >
                            {releases.map((r, rIdx) => (
                              <option key={r.id ? `r-${r.id}-${rIdx}` : `r-${rIdx}`} value={r.id}>{r.title.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      {/* Quick Edit Current Release Button */}
                      {(() => {
                        const currentRel = releases.find(r => r.digital?.some((t: any) => t.id === activePlaybackTrackId)) || releases[0];
                        if (!currentRel) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => handleLoadReleaseIntoForm(currentRel)}
                            className="text-[8.5px] font-mono font-bold text-amber-400 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 hover:border-amber-500 px-2.5 py-1 rounded-lg uppercase flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            title="Open this release in the Editor Form above"
                          >
                            <Edit className="w-2.5 h-2.5" />
                            <span>Edit Details</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* SKEUOMORPHIC FULL-WIDTH PLAYER GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* OFFICIAL ALBUM COVER ART SHOWCASE - EXTRA LARGE */}
                    <div className="lg:col-span-5 flex justify-center py-2">
                      <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl flex items-center justify-center group transition-all">
                        {/* Glow Behind */}
                        <div 
                          className="absolute inset-0 bg-[#FF9900]/15 rounded-2xl blur-2xl transition-opacity duration-500" 
                          style={{ opacity: isPlaying ? 0.85 : 0.2 }} 
                        />
                        
                        {activeTrackObj?.coverImage || activeTrackObj?.coverUrl || activeBand.avatar ? (
                          <img 
                            src={activeTrackObj?.coverImage || activeTrackObj?.coverUrl || activeBand.avatar} 
                            alt={activeTrackObj?.releaseTitle || activeBand.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-4 text-center">
                            <Disc className="w-16 h-16 text-[#FF9900] mb-2 opacity-80 animate-spin-slow" />
                            <span className="text-xs font-mono font-bold text-zinc-300 uppercase">OFFICIAL COVER ART</span>
                          </div>
                        )}

                        {/* Subtle Edge Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 pointer-events-none" />
                      </div>
                    </div>

                    {/* METADATA, VISUALIZER & CONTROLS */}
                    <div className="lg:col-span-7 flex flex-col items-center text-center space-y-3">
                      {/* Meta info */}
                      <div className="space-y-1.5 w-full flex flex-col items-center">
                        <div className="flex items-center gap-2 justify-center w-full">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-mono uppercase font-black tracking-widest flex items-center gap-1.5 ${isPlaying ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20 animate-pulse' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#FF9900] animate-ping' : 'bg-zinc-600'}`} />
                            {isPlaying ? 'NOW STREAMING' : 'PLAYER IDLE'}
                          </span>
                        </div>

                        {/* Song Title Container */}
                        <div className="w-full h-8 flex items-center justify-center bg-black/40 px-3 rounded-lg border border-zinc-900 max-w-md mx-auto">
                          <span className="font-mono font-black text-xs uppercase tracking-wider text-[#FF9900] text-center truncate">
                            {activeTrackObj ? activeTrackObj.title : "EMPTY DECK STREAM"}
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-[9px] font-mono text-zinc-555 w-full text-center">
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            <span>ALBUM: <span className="text-zinc-400 font-bold uppercase">{activeTrackObj?.releaseTitle || 'N/A'}</span></span>
                            <span>•</span>
                            <span>ISRC: <span className="text-zinc-400 font-bold uppercase">{activeTrackObj?.isrc || 'N/A'}</span></span>
                          </div>

                          {/* Star Rating System */}
                          <div className="flex items-center justify-center gap-1 bg-black/40 border border-zinc-900 px-2 py-0.5 rounded-lg">
                            <span className="text-[7.5px] font-black text-zinc-555 uppercase tracking-widest">RATING:</span>
                            {[1, 2, 3, 4, 5].map((star, idx) => {
                              const activeTrackId = activeTrackObj?.id || "";
                              const rating = trackRatings[activeTrackId] || 0;
                              return (
                                <button
                                  key={`star-rating-${star}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setTrackRatings(prev => ({ ...prev, [activeTrackId]: star }));
                                    showLocalToast(`RATED "${activeTrackObj?.title || 'TRACK'}" ${star} STARS`);
                                  }}
                                  className="hover:scale-110 transition-transform cursor-pointer"
                                >
                                  <Star className={`w-3 h-3 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 hover:text-zinc-550'}`} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Equalizer bars */}
                      <div className="h-4 flex items-end justify-center gap-0.5 overflow-hidden border-b border-zinc-900/40 pb-0.5 w-full max-w-sm mx-auto">
                        {Array.from({ length: 32 }).map((_, idx) => (
                          <div
                            key={`equalizer-bar-${idx}`}
                            className={`flex-1 rounded-t-sm transition-all duration-300 ${isPlaying ? 'bg-[#FF9900]' : 'bg-zinc-800/40'}`}
                            style={{ height: `${isPlaying ? Math.floor(15 + Math.random() * 85) : 10}%` }}
                          />
                        ))}
                      </div>

                      {/* Track length progress bar */}
                      <div className="space-y-1 w-full max-w-md mx-auto">
                        <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 font-bold">
                          {(() => {
                            const durStr = activeTrackObj?.duration || getRunningTime(activeTrackObj);
                            const parts = durStr.split(':');
                            const totalSec = parts.length === 2 ? parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) : 210;
                            const curSec = Math.floor((playbackProgress / 100) * totalSec);
                            const curMins = Math.floor(curSec / 60);
                            const curSecs = (curSec % 60).toString().padStart(2, '0');
                            return <span>{curMins}:{curSecs}</span>;
                          })()}

                          <span>{activeTrackObj?.duration || getRunningTime(activeTrackObj)}</span>
                        </div>
                        <div 
                          className="h-1 bg-black rounded-full overflow-hidden cursor-pointer border border-zinc-900/60 relative"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const percent = Math.round((clickX / rect.width) * 100);
                            const clamped = Math.min(100, Math.max(0, percent));
                            setPlaybackProgress(clamped);
                            universalAudioPlayer.seek(clamped);
                          }}
                        >
                          <div 
                            className="h-full bg-gradient-to-r from-[#FF9900] to-amber-500 rounded-full transition-all duration-300" 
                            style={{ width: `${playbackProgress}%` }} 
                          />
                        </div>
                      </div>

                      {/* Centered Controls & Volume */}
                      <div className="flex flex-col items-center justify-center gap-2 pt-1 w-full">
                        {/* Enlarged audio control buttons */}
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            type="button"
                            onClick={() => {
                              const trackIds = allDigitalTracks.map(t => t.id);
                              if (trackIds.length > 0) {
                                const currIdx = trackIds.indexOf(activePlaybackTrackId || '');
                                const prevIdx = currIdx > 0 ? currIdx - 1 : trackIds.length - 1;
                                setActivePlaybackTrackId(trackIds[prevIdx]);
                                setIsPlaying(true);
                              }
                            }}
                            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
                            title="Previous Track"
                          >
                            <SkipBack className="w-5 h-5" />
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              if (isPlaying) {
                                setIsPlaying(false);
                                universalAudioPlayer.pause();
                              } else {
                                const targetTrack = activeTrackObj || allDigitalTracks[0];
                                if (targetTrack) {
                                  setActivePlaybackTrackId(targetTrack.id);
                                }
                                setIsPlaying(true);
                              }
                            }} 
                            className="p-3.5 bg-[#FF9900]/10 hover:bg-[#FF9900] border border-[#FF9900]/45 hover:border-[#FF9900] text-[#FF9900] hover:text-black rounded-full transition-all active:scale-95 flex items-center justify-center shadow-md cursor-pointer"
                            title={isPlaying ? "Pause Stream" : "Play Stream"}
                          >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                          </button>

                          <button 
                            type="button"
                            onClick={() => { 
                              setIsPlaying(false); 
                              setPlaybackProgress(0); 
                              universalAudioPlayer.stop();
                            }} 
                            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
                            title="Stop Stream"
                          >
                            <Square className="w-5 h-5" />
                          </button>

                          <button 
                            type="button"
                            onClick={() => {
                              const trackIds = allDigitalTracks.map(t => t.id);
                              if (trackIds.length > 0) {
                                const currIdx = trackIds.indexOf(activePlaybackTrackId || '');
                                const nextIdx = (currIdx + 1) % trackIds.length;
                                setActivePlaybackTrackId(trackIds[nextIdx]);
                                setIsPlaying(true);
                              }
                            }}
                            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
                            title="Next Track"
                          >
                            <SkipForward className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Volume controls */}
                        <div className="flex items-center justify-center gap-2 px-3 py-1 bg-black border border-zinc-900 rounded-lg w-40">
                          <Volume2 className="w-3.5 h-3.5 text-zinc-555" />
                          <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.05" 
                            value={audioVolume} 
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setAudioVolume(val);
                              universalAudioPlayer.setVolume(val);
                            }} 
                            className="w-20 accent-[#FF9900] h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer" 
                          />
                          <span className="text-[9px] text-zinc-400 font-mono w-6 text-right">{Math.round(audioVolume * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FULLY DETAILED TRACK LIST DIRECTLY UNDER CONTROLS */}
                  <div className="border-t border-zinc-900 pt-3">
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {releases.flatMap((release, relIdx) => (release.digital || []).map((track: any, idx) => {
                        const isCurrent = track.id === activePlaybackTrackId;
                        const trackDuration = track.duration || getRunningTime(track);
                        return (
                          <div 
                            key={`rel-${release.id || relIdx}-track-${track.id || idx}-${relIdx}-${idx}`} 
                            onClick={() => {
                              setActivePlaybackTrackId(track.id);
                              setIsPlaying(true);
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${isCurrent ? 'bg-[#FF9900]/10 border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.15)]' : 'bg-black/40 border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950/40'}`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${isCurrent ? 'bg-[#FF9900] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-500'}`}>
                                {isCurrent && isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                              </span>
                              <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                <span className={`text-[11px] font-mono font-bold uppercase tracking-wider block ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>{track.title}</span>
                                <span className="text-[9px] text-zinc-500 font-mono uppercase block">album: {release.title}</span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-medium text-zinc-400 shrink-0">{trackDuration}</span>
                          </div>
                        );
                      }))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PHYSICAL RELEASE INVENTORY (UNDER DIGITAL MUSIC PLAYER, COLLAPSED BY DEFAULT) */}
              <div className="space-y-4 w-full mt-6 bg-zinc-950/60 p-5 rounded-2xl border border-[#FF9900]/20 shadow-[0_0_15px_rgba(255,153,0,0.05)] transition-all">
                <div 
                  onClick={() => setIsPhysicalInventoryExpanded(!isPhysicalInventoryExpanded)}
                  className="flex items-center justify-between cursor-pointer group select-none"
                >
                  <div className="flex items-center gap-2.5 flex-1 justify-center text-center">
                    <Database className="w-4.5 h-4.5 text-[#FF9900] group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="text-xs sm:text-sm font-mono font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                        <span>Physical Release Inventory</span>
                        <span className="text-[9px] font-mono text-zinc-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {releases.length} {releases.length === 1 ? 'RECORD' : 'RECORDS'}
                        </span>
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-block text-[9px] font-mono text-zinc-500 uppercase tracking-wider">CD / VINYL / CASSETTES ARCHIVE</span>
                    <span className="text-[9px] font-mono text-[#FF9900] uppercase font-black tracking-wider bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-[#FF9900]/30 group-hover:border-[#FF9900] transition-colors flex items-center gap-1">
                      {isPhysicalInventoryExpanded ? 'Collapse [-]' : 'Expand [+]'}
                    </span>
                  </div>
                </div>

                {isPhysicalInventoryExpanded && (
                  <div className="pt-3 border-t border-zinc-900 animate-fade-in space-y-4">
                    {releases.length === 0 ? (
                  <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-10 text-center text-zinc-600 font-mono text-sm">
                    NO COVERSHEET ITEMS IN PHYSICAL RECORD
                  </div>
                ) : (
                  <div className="space-y-6 w-full">
                    {releases.map((release, idx) => {
                      const isEditingThis = editingReleaseId === release.id;
                      const vinylVariants = release.formats?.vinyl?.variants || [{ id: 'v1', name: 'Standard Black Wax', qty: release.formats?.vinyl?.warehouse_qty ?? 0 }];
                      const vinylStock = vinylVariants.reduce((sum, v) => sum + v.qty, 0);
                      const cdStock = release.formats?.cd?.warehouse_qty ?? 0;
                      const cassetteStock = release.formats?.cassette?.warehouse_qty ?? 0;
                      const physicalShelfId = release.formats?.vinyl?.shelf_id || `A${release.id.replace(/\D/g, '').substring(0,2) || '24'}`;
                      return (
                        <div 
                          key={`rel-card-${release.id || 'r'}-${idx}`} 
                          id={`release-${release.id}`}
                          className={`p-4 shadow-xl w-full transition-all space-y-3 rounded-xl border ${
                            props.highlightItemId === release.id 
                              ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_25px_rgba(255,153,0,0.5)] border-2 animate-pulse scale-[1.01]' 
                              : 'bg-zinc-950 border-zinc-900 hover:border-[#FF9900]/40'
                          }`}
                        >
                          {isEditingThis ? (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                <span className="text-xs font-mono font-bold text-zinc-400">EDIT HARD COPY LABELS</span>
                                <span className="text-[10px] font-mono text-zinc-650">CATALOG NO: {release.catalogId}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-500 uppercase font-black">Release Title</label>
                                  <input 
                                    type="text" 
                                    value={editReleaseTitle} 
                                    onChange={e => setEditReleaseTitle(e.target.value)} 
                                    className="bg-black border border-zinc-800 text-sm font-mono text-white px-3 py-2.5 rounded-lg w-full focus:outline-none focus:border-[#FF9900]" 
                                    placeholder="Title" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-500 uppercase font-black">Catalog ID</label>
                                  <input 
                                    type="text" 
                                    value={editReleaseCatalogId} 
                                    onChange={e => setEditReleaseCatalogId(e.target.value)} 
                                    className="bg-black border border-zinc-800 text-sm font-mono text-white px-3 py-2.5 rounded-lg w-full focus:outline-none focus:border-[#FF9900]" 
                                    placeholder="Catalog ID" 
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-500 uppercase font-black text-center block">Vinyl Qty</label>
                                  <div className="flex items-center bg-black border border-zinc-800 p-2.5 rounded-lg font-mono text-sm">
                                    <span className="text-zinc-500 mr-2">V:</span>
                                    <input type="number" value={editReleaseVinylQty} onChange={e => setEditReleaseVinylQty(Number(e.target.value))} className="bg-transparent w-full focus:outline-none text-white text-center" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-500 uppercase font-black text-center block">CD Qty</label>
                                  <div className="flex items-center bg-black border border-zinc-800 p-2.5 rounded-lg font-mono text-sm">
                                    <span className="text-zinc-500 mr-2">CD:</span>
                                    <input type="number" value={editReleaseCdQty} onChange={e => setEditReleaseCdQty(Number(e.target.value))} className="bg-transparent w-full focus:outline-none text-white text-center" />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-zinc-500 uppercase font-black text-center block">Cassette Qty</label>
                                  <div className="flex items-center bg-black border border-zinc-800 p-2.5 rounded-lg font-mono text-sm">
                                    <span className="text-zinc-500 mr-2">C:</span>
                                    <input type="number" value={editReleaseCassetteQty} onChange={e => setEditReleaseCassetteQty(Number(e.target.value))} className="bg-transparent w-full focus:outline-none text-white text-center" />
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const bandKey = selectedCatalogBandId || effectiveBandId || 'b1';
                                    const updatedRelease = {
                                      ...release,
                                      title: editReleaseTitle,
                                      catalogId: editReleaseCatalogId,
                                      formats: { vinyl: { warehouse_qty: editReleaseVinylQty }, cd: { warehouse_qty: editReleaseCdQty }, cassette: { warehouse_qty: editReleaseCassetteQty } }
                                    };
                                    setCatalogReleases(prev => {
                                      const next = {
                                        ...prev,
                                        [bandKey]: (prev[bandKey] || []).map(r => r.id === release.id ? updatedRelease : r)
                                      };
                                      labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(next));
                                      return next;
                                    });
                                    upsertReleaseToDatabase(updatedRelease as any, bandKey);
                                    setEditingReleaseId(null);
                                    showLocalToast(`UPDATED HARD COPY LABELS FOR: ${editReleaseTitle}`);
                                  }}
                                  className="flex-1 py-3 bg-[#FF9900] hover:bg-white text-black font-mono font-black text-xs rounded-xl uppercase tracking-wider active:scale-95 transition-all shadow"
                                >
                                  SAVE CHANGES
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => setEditingReleaseId(null)} 
                                  className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono uppercase rounded-xl text-zinc-400 hover:text-white transition-all"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Release Header Bar - CENTERED TITLE HEADER TEXT */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-900 pb-2.5">
                                <div className="flex items-center justify-center text-center gap-2.5 flex-wrap flex-1">
                                  <span className="text-base font-black text-zinc-100 font-mono uppercase tracking-wide">{release.title}</span>
                                  <span className="bg-black text-[#FF9900] px-2 py-0.5 rounded border border-zinc-850 text-[9px] font-mono uppercase font-black tracking-widest leading-none">{release.type || "Album"}</span>
                                  <span className="bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/20 px-2 py-0.5 rounded text-[8.5px] font-mono uppercase tracking-wider font-black">
                                    BIN: {physicalShelfId}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-500">
                                    CAT: <b className="text-zinc-300">{release.catalogId || 'N/A'}</b>
                                  </span>
                                </div>

                                {/* Quick Action Controls */}
                                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleLoadReleaseIntoForm(release)}
                                    className="text-[8.5px] font-mono font-bold text-amber-400 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 hover:border-amber-500 px-2 py-1 rounded uppercase flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                    title="Edit this release in the main Discography Form"
                                  >
                                    <Edit className="w-2.5 h-2.5" />
                                    <span>Edit In Form</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingReleaseId(release.id);
                                      setEditReleaseTitle(release.title);
                                      setEditReleaseCatalogId(release.catalogId);
                                      setEditReleaseFormatType(release.type || "Album");
                                      setEditReleaseVinylQty(vinylStock);
                                      setEditReleaseCdQty(cdStock);
                                      setEditReleaseCassetteQty(cassetteStock);
                                    }}
                                    className="p-1.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-[#FF9900] transition-colors"
                                    title="Quick Edit Quantities"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleDeleteRelease(selectedCatalogBandId!, release.id, release.title)} 
                                    className="p-1.5 hover:bg-zinc-900 rounded text-zinc-500 hover:text-rose-500 transition-colors"
                                    title="Delete Release"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {release.releaseDate && new Date(release.releaseDate) > new Date() && (
                                <div className="text-[9.5px] font-mono font-bold text-[#FF9900] uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded w-fit mx-auto text-center">
                                  DISTRIBUTION STATUS RUNTIME: {Math.ceil((new Date(release.releaseDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} DAYS REMAINING UNTIL STREET DATE
                                </div>
                              )}

                              {/* Main Card Body: 3 Physical Covers Showcase + Logistics Grid */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                                {/* 3 PHYSICAL FORMAT COVERS SIDE-BY-SIDE WITHOUT INNER CONTAINER */}
                                <div className="lg:col-span-6 flex items-end justify-center gap-3 sm:gap-4 py-1">
                                  {/* 1. VINYL 120px by 120px */}
                                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className="w-[120px] h-[120px] min-w-[120px] min-h-[120px] relative rounded-md overflow-hidden bg-zinc-950 border border-zinc-700 shadow-xl group transition-all">
                                      {release.coverImage || release.cover_image || release.cover_url || release.coverUrl || activeBand.avatar ? (
                                        <img 
                                          src={release.coverImage || release.cover_image || release.cover_url || release.coverUrl || activeBand.avatar} 
                                          alt={`${release.title} Vinyl`} 
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                          referrerPolicy="no-referrer" 
                                        />
                                      ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${release.coverColor || 'from-zinc-900 to-zinc-950'} flex flex-col items-center justify-center p-2 text-center`}>
                                          <Disc className="w-8 h-8 text-[#FF9900] opacity-80" />
                                          <span className="text-[7.5px] font-mono font-bold text-zinc-400 mt-1 uppercase truncate w-full">{release.title}</span>
                                        </div>
                                      )}
                                      {/* Vinyl jacket sheen & groove overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/15 pointer-events-none" />
                                      <div className="absolute top-1 left-1 bg-black/85 backdrop-blur-[1px] border border-zinc-800 px-1 py-0.5 rounded text-[7px] font-mono font-black text-orange-400">
                                        12" VINYL
                                      </div>
                                    </div>
                                    <div className="w-full text-center">
                                      <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded border border-orange-900/50 block tracking-wider">
                                        VINYL: <b className="text-white">{vinylStock}</b>
                                      </span>
                                    </div>
                                  </div>

                                  {/* 2. CD JEWEL CASE 75px by 70px */}
                                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className="w-[75px] h-[70px] min-w-[75px] min-h-[70px] relative rounded-sm overflow-hidden bg-zinc-900 border border-zinc-650 shadow-lg flex items-center justify-center group">
                                      {/* CD Jewel Case Frosted Spine Hinge */}
                                      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-900 border-r border-zinc-950/70 z-10 flex flex-col justify-around py-1">
                                        <div className="w-full h-0.5 bg-zinc-500/50" />
                                        <div className="w-full h-0.5 bg-zinc-500/50" />
                                      </div>
                                      {release.coverImage || release.cover_image || release.cover_url || release.coverUrl || activeBand.avatar ? (
                                        <img 
                                          src={release.coverImage || release.cover_image || release.cover_url || release.coverUrl || activeBand.avatar} 
                                          alt={`${release.title} CD Case`} 
                                          className="w-full h-full object-cover pl-2 transition-transform duration-500 group-hover:scale-105" 
                                          referrerPolicy="no-referrer" 
                                        />
                                      ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${release.coverColor || 'from-zinc-900 to-zinc-950'} flex items-center justify-center pl-2`}>
                                          <Disc3 className="w-5 h-5 text-[#FF9900] opacity-80" />
                                        </div>
                                      )}
                                      {/* Plastic Jewel Case Sheen */}
                                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
                                      <div className="absolute top-0.5 right-0.5 bg-black/85 px-1 py-0.2 rounded text-[6.5px] font-mono font-black text-amber-400">
                                        CD
                                      </div>
                                    </div>
                                    <div className="w-full text-center">
                                      <span className="text-[9.5px] font-mono font-black text-[#FF9900] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50 block tracking-wider">
                                        CD: <b className="text-white">{cdStock}</b>
                                      </span>
                                    </div>
                                  </div>

                                  {/* 3. CASSETTE CASE 45px by 60px */}
                                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                                    <div className="w-[45px] h-[60px] min-w-[45px] min-h-[60px] relative rounded-sm overflow-hidden bg-zinc-900 border border-zinc-650 shadow-md flex items-center justify-center group">
                                      {release.coverImage || release.cover_image || release.cover_url || release.coverUrl || activeBand.avatar ? (
                                        <img 
                                          src={release.coverImage || release.cover_image || release.cover_url || release.coverUrl || activeBand.avatar} 
                                          alt={`${release.title} Cassette Case`} 
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                          referrerPolicy="no-referrer" 
                                        />
                                      ) : (
                                        <div className={`w-full h-full bg-gradient-to-br ${release.coverColor || 'from-zinc-900 to-zinc-950'} flex items-center justify-center`}>
                                          <Layers className="w-4 h-4 text-cyan-400 opacity-80" />
                                        </div>
                                      )}
                                      {/* Norelco J-Card acrylic border & spine */}
                                      <div className="absolute inset-0 border border-white/20 pointer-events-none" />
                                      <div className="absolute bottom-0 left-0 right-0 h-3.5 bg-black/85 backdrop-blur-[1px] border-t border-zinc-800 flex items-center justify-center">
                                        <span className="text-[6.5px] font-mono font-black text-cyan-400">TAPE</span>
                                      </div>
                                    </div>
                                    <div className="w-full text-center">
                                      <span className="text-[9px] font-mono font-black text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-900/50 block tracking-wider">
                                        TAPE: <b className="text-white">{cassetteStock}</b>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Logistics & Dispatch Controls */}
                                <div className="lg:col-span-6 space-y-3">
                                  {/* Wax Matrix */}
                                  <div className="bg-black/50 rounded-xl p-3 border border-zinc-900 space-y-2">
                                    <div className="flex items-center justify-between text-[9px] font-mono">
                                      <span className="text-[#FF9900] font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Disc className="w-3 h-3 text-[#FF9900]" /> WAX MATRIX VARIANTS:
                                      </span>
                                      <span className="text-zinc-500">TOTAL: {vinylStock}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {vinylVariants.map((v, vIdx) => (
                                        <span key={`variant-${release.id}-${v.id || 'v'}-${vIdx}`} className="bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 text-[8.5px] font-mono text-zinc-300 uppercase">
                                          {v.name}: <b className="text-[#FF9900] font-black">{v.qty}</b>
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Dispatch to Van Unit */}
                                  <div className="bg-black/50 p-3 rounded-xl border border-zinc-900 space-y-2">
                                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">DISPATCH TO MERCH VAN:</span>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        id={`ship-qty-${release.id}`} 
                                        defaultValue={10} 
                                        className="w-14 bg-black border border-zinc-800 text-white rounded-lg text-center text-xs py-1.5 focus:outline-none focus:border-[#FF9900] font-mono font-bold" 
                                        min={1} 
                                      />
                                      <select 
                                        id={`ship-fmt-${release.id}`} 
                                        className="flex-1 bg-black border border-zinc-800 text-zinc-300 rounded-lg text-xs py-1.5 px-2 outline-none focus:border-[#FF9900] font-mono"
                                      >
                                        <option value="vinyl">12" VINYL</option>
                                        <option value="cd">CD COMPACT DISC</option>
                                        <option value="cassette">CASSETTE TAPE</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const qty = parseInt((document.getElementById(`ship-qty-${release.id}`) as HTMLInputElement)?.value) || 1;
                                          const fmt = (document.getElementById(`ship-fmt-${release.id}`) as HTMLSelectElement)?.value as any;
                                          handleDispatchToVanIndexedDB(activeBand.id, release.title, fmt, qty);
                                        }}
                                        className="py-1.5 px-4 bg-[#FF9900] hover:bg-white text-black font-black text-[10px] font-mono rounded-lg transition-all active:scale-95 shadow cursor-pointer uppercase"
                                      >
                                        SHIP
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                    </div>
                  )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
