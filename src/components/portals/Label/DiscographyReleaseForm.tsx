import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  RefreshCw, 
  Play, 
  Pause, 
  FileAudio, 
  Music, 
  ChevronDown, 
  ChevronUp,
  Layers,
  Sparkles
} from 'lucide-react';
import { uploadAudioVault, uploadArtworkToVault } from '../../../lib/storage';
import { getAudioFileDuration, universalAudioPlayer } from '../../../utils/audioEngine';

export interface TrackItem {
  id: string;
  num: string;
  title: string;
  duration: string;
  lyrics: string;
  // Audio file attachment & vault storage fields
  audioUrl?: string;
  url?: string;
  fileName?: string;
  fileSize?: string;
  rawFile?: File;
  file?: File | null;
  status?: 'empty' | 'uploading' | 'verified' | 'warning' | 'error';
  vaultUploaded?: boolean;
  metrics?: {
    sampleRate?: string;
    bitDepth?: string;
    channels?: string;
    bitrate?: string;
    peakLufs?: string;
  };
}

export interface IngestedWavTrack {
  id: string;
  fileName: string;
  fileSize: string;
  title: string;
  trackNum: string;
  duration: string;
  audioUrl?: string;
  url?: string;
  rawFile?: File;
  file?: File | null;
  status: 'verified' | 'uploading' | 'error' | 'pending' | 'completed';
  vaultUploaded?: boolean;
  metrics: {
    sampleRate: string;
    bitDepth: string;
    channels?: string;
    bitrate?: string;
    peakLufs: string;
  };
}

interface DiscographyReleaseFormProps {
  isReleaseFormExpanded: boolean;
  setIsReleaseFormExpanded: (expanded: boolean | ((prev: boolean) => boolean)) => void;
  editingFullReleaseId: string | null;
  handleCancelReleaseEdit: () => void;
  newReleaseTitle: string;
  setNewReleaseTitle: (title: string) => void;
  newReleaseTracks: TrackItem[];
  setNewReleaseTracks: React.Dispatch<React.SetStateAction<TrackItem[]>>;
  ingestedWavTracks?: IngestedWavTrack[];
  setIngestedWavTracks?: React.Dispatch<React.SetStateAction<IngestedWavTrack[]>>;
  wavUploadLogs?: string[];
  setWavUploadLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  syncWavsToTracklist?: () => void;
  handleWavDragOver?: (e: React.DragEvent) => void;
  handleWavDragLeave?: () => void;
  handleWavDrop?: (e: React.DragEvent) => void;
  handleWavFilesChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isWavBatchUploading?: boolean;
  wavBatchProgress?: number;
  currentIngestingFileName?: string;
  isWavDragging?: boolean;
  retryTrackUpload?: (trackId: string) => void;
  newReleaseCoverImage: string | null;
  setNewReleaseCoverImage: (cover: string | null) => void;
  uploadArtworkToVault: (file: File) => Promise<string | null>;
  showLocalToast: (msg: string) => void;
  newReleaseDate: string;
  setNewReleaseDate: (date: string) => void;
  newReleaseFormatType: string;
  setNewReleaseFormatType: (format: any) => void;
  newReleaseGenre: string;
  setNewReleaseGenre: (genre: string) => void;
  newReleaseCatalogId: string;
  setNewReleaseCatalogId: (catId: string) => void;
  newReleaseLabel: string;
  setNewReleaseLabel: (label: string) => void;
  newReleaseVinylQty: number;
  setNewReleaseVinylQty: (qty: number) => void;
  newReleaseCdQty: number;
  setNewReleaseCdQty: (qty: number) => void;
  newReleaseCassetteQty: number;
  setNewReleaseCassetteQty: (qty: number) => void;
  newReleaseColor: string;
  setNewReleaseColor: (color: string) => void;
  isSavingRelease: boolean;
  handleAddFullReleaseSubmit: (e: React.FormEvent, bandId: string) => Promise<void>;
  selectedCatalogBandId: string;
}

export const DiscographyReleaseForm: React.FC<DiscographyReleaseFormProps> = ({
  isReleaseFormExpanded,
  setIsReleaseFormExpanded,
  editingFullReleaseId,
  handleCancelReleaseEdit,
  newReleaseTitle,
  setNewReleaseTitle,
  newReleaseTracks,
  setNewReleaseTracks,
  newReleaseCoverImage,
  setNewReleaseCoverImage,
  showLocalToast,
  newReleaseDate,
  setNewReleaseDate,
  newReleaseFormatType,
  setNewReleaseFormatType,
  newReleaseGenre,
  setNewReleaseGenre,
  newReleaseCatalogId,
  setNewReleaseCatalogId,
  newReleaseLabel,
  setNewReleaseLabel,
  newReleaseVinylQty,
  setNewReleaseVinylQty,
  newReleaseCdQty,
  setNewReleaseCdQty,
  newReleaseCassetteQty,
  setNewReleaseCassetteQty,
  newReleaseColor,
  setNewReleaseColor,
  isSavingRelease,
  handleAddFullReleaseSubmit,
  selectedCatalogBandId
}) => {
  const [expandedLyricsIds, setExpandedLyricsIds] = useState<Record<string, boolean>>({});
  const [playingPreviewTrackId, setPlayingPreviewTrackId] = useState<string | null>(null);
  const [isBatchDragging, setIsBatchDragging] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // Bulk Text / Text File Tracklist Parser State
  const [isTextParserOpen, setIsTextParserOpen] = useState(false);
  const [pastedTracklistText, setPastedTracklistText] = useState('');
  const textFileInputRef = useRef<HTMLInputElement | null>(null);

  const parsePastedTracklist = (textToParse?: string) => {
    const text = textToParse !== undefined ? textToParse : pastedTracklistText;
    if (!text.trim()) {
      showLocalToast('Please enter or paste tracklist text.');
      return;
    }
    const lines = text.split('\n');
    const newTracks: TrackItem[] = [];

    lines.forEach((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return;

      // Extract duration if present e.g. (3:45), [3:45], - 3:45, or 3:45 at end
      let duration = '3:30';
      const durMatch = trimmed.match(/(?:[\(\[\-\s]+)(\d{1,2}:\d{2})(?:[\)\]\s]*)$/);
      if (durMatch) {
        duration = durMatch[1];
        trimmed = trimmed.replace(durMatch[0], '').trim();
      }

      // Extract leading track number e.g. "1.", "01 -", "1 -"
      let trackNum = (idx + 1).toString();
      const numMatch = trimmed.match(/^(\d{1,2})[\.\s\-\)]+(.+)$/);
      if (numMatch) {
        trackNum = parseInt(numMatch[1], 10).toString();
        trimmed = numMatch[2].trim();
      }

      // Clean trailing dashes or quotes
      trimmed = trimmed.replace(/^[\-\.\)\s]+|[\-\.\s]+$/g, '');

      newTracks.push({
        id: `track_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        num: trackNum,
        title: trimmed || `Track ${idx + 1}`,
        duration: duration,
        lyrics: '',
        status: 'empty'
      });
    });

    if (newTracks.length > 0) {
      setNewReleaseTracks(newTracks);
      setIsTextParserOpen(false);
      setPastedTracklistText('');
      showLocalToast(`Successfully parsed and loaded ${newTracks.length} tracks into archive tracklist!`);
    } else {
      showLocalToast('No valid tracks found in text.');
    }
  };

  const handleTextFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPastedTracklistText(content);
        parsePastedTracklist(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const batchFileInputRef = useRef<HTMLInputElement | null>(null);

  const toggleLyrics = (trackId: string) => {
    setExpandedLyricsIds(prev => ({
      ...prev,
      [trackId]: !prev[trackId]
    }));
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

  /**
   * Individual track audio uploader handler
   */
  const handleIndividualTrackUpload = async (file: File, trackId: string, trackIdx: number) => {
    if (!file) return;

    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const { trackNum, title: parsedTitle } = cleanTrackTitle(file.name);

    let detectedDuration = '3:30';
    let detectedSampleRate = '48.0 kHz';
    let detectedChannels = 'Stereo (L/R)';

    try {
      const durResult = await getAudioFileDuration(file);
      detectedDuration = durResult.duration;
      if (durResult.sampleRate) {
        detectedSampleRate = `${(durResult.sampleRate / 1000).toFixed(1)} kHz`;
      }
      if (durResult.channels) {
        detectedChannels = durResult.channels === 1 ? 'Mono' : 'Stereo (L/R)';
      }
    } catch (durErr) {
      console.warn('[Track Audio Parse] Duration extraction notice:', durErr);
    }

    const tempBlobUrl = URL.createObjectURL(file);

    // Update track immediately to uploading status & buffer
    setNewReleaseTracks(prev =>
      prev.map(t => {
        if (t.id === trackId) {
          return {
            ...t,
            title: t.title && t.title !== `Track ${t.num}` ? t.title : (parsedTitle || t.title || `Track ${trackIdx + 1}`),
            duration: detectedDuration,
            fileName: file.name,
            fileSize: sizeInMB,
            audioUrl: tempBlobUrl,
            url: tempBlobUrl,
            rawFile: file,
            status: 'uploading',
            vaultUploaded: false,
            metrics: {
              sampleRate: detectedSampleRate,
              bitDepth: '24-bit PCM',
              channels: detectedChannels,
              bitrate: '2304 kbps (Studio Master)',
              peakLufs: '-14.0 LUFS'
            }
          };
        }
        return t;
      })
    );

    showLocalToast(`UPLOADING "${file.name}" TO AUDIO-VAULT STORAGE BUCKET...`);

    // Perform actual storage upload to Supabase audio-vault
    try {
      const publicVaultUrl = await uploadAudioVault(file, file.name);
      if (publicVaultUrl) {
        setNewReleaseTracks(prev =>
          prev.map(t => {
            if (t.id === trackId) {
              return {
                ...t,
                audioUrl: publicVaultUrl,
                url: publicVaultUrl,
                status: 'verified',
                vaultUploaded: true
              };
            }
            return t;
          })
        );
        showLocalToast(`✓ "${file.name}" ATTACHED & STORED IN AUDIO-VAULT!`);
      } else {
        // Timed out or storage error -> Set yellow warning icon
        setNewReleaseTracks(prev =>
          prev.map(t => {
            if (t.id === trackId) {
              return {
                ...t,
                status: 'warning',
                vaultUploaded: false
              };
            }
            return t;
          })
        );
        showLocalToast(`⚠️ UPLOAD TIMED OUT FOR "${file.name}". Stored locally. Click Retry to archive in vault.`);
      }
    } catch (err: any) {
      console.error('[Track Upload Error]:', err);
      setNewReleaseTracks(prev =>
        prev.map(t => {
          if (t.id === trackId) {
            return {
              ...t,
              status: 'warning',
              vaultUploaded: false
            };
          }
          return t;
        })
      );
      showLocalToast(`⚠️ UPLOAD TIMED OUT / NETWORK ISSUE FOR "${file.name}". Click Retry.`);
    }
  };

  /**
   * Retry upload for a specific track
   */
  const handleRetryTrackUpload = async (trackId: string, trackIdx: number) => {
    const track = newReleaseTracks.find(t => t.id === trackId);
    if (!track) return;

    if (track.rawFile) {
      // Re-upload the in-memory file
      setNewReleaseTracks(prev =>
        prev.map(t => (t.id === trackId ? { ...t, status: 'uploading' } : t))
      );
      showLocalToast(`RETRYING AUDIO-VAULT UPLOAD FOR "${track.fileName || track.title}"...`);

      try {
        const publicVaultUrl = await uploadAudioVault(track.rawFile, track.fileName || `${track.title}.wav`);
        if (publicVaultUrl) {
          setNewReleaseTracks(prev =>
            prev.map(t => {
              if (t.id === trackId) {
                return {
                  ...t,
                  audioUrl: publicVaultUrl,
                  url: publicVaultUrl,
                  status: 'verified',
                  vaultUploaded: true
                };
              }
              return t;
            })
          );
          showLocalToast(`✓ "${track.title}" SUCCESSFULLY SAVED IN AUDIO-VAULT!`);
        } else {
          setNewReleaseTracks(prev =>
            prev.map(t => (t.id === trackId ? { ...t, status: 'warning', vaultUploaded: false } : t))
          );
          showLocalToast(`⚠️ RETRY TIMED OUT. Ensure audio-vault bucket is public in Supabase.`);
        }
      } catch (err) {
        setNewReleaseTracks(prev =>
          prev.map(t => (t.id === trackId ? { ...t, status: 'warning', vaultUploaded: false } : t))
        );
      }
    } else {
      // Raw file was purged across refresh, prompt file chooser to re-attach
      fileInputRefs.current[trackId]?.click();
    }
  };

  /**
   * Multi-file batch drag & drop / multi-select handler
   */
  const handleBatchAudioFiles = async (files: File[]) => {
    const audioFiles = files.filter(f => 
      /\.(wav|mp3|flac|ogg|m4a|aac|aiff)$/i.test(f.name) || f.type.startsWith('audio/')
    );
    if (audioFiles.length === 0) {
      showLocalToast('INVALID FILE(S): Please select master WAV, MP3, or FLAC audio files.');
      return;
    }

    setIsBatchUploading(true);
    setBatchProgress(0);
    showLocalToast(`BATCH INGEST: Staging ${audioFiles.length} master track(s)...`);

    const createdTrackIds: string[] = [];

    // 1. Process files and create or update track rows
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      const { trackNum, title: parsedTitle } = cleanTrackTitle(file.name);
      const assignedTrackNum = trackNum || (i + 1).toString();

      let detectedDuration = '3:30';
      let detectedSampleRate = '48.0 kHz';
      let detectedChannels = 'Stereo (L/R)';

      try {
        const durResult = await getAudioFileDuration(file);
        detectedDuration = durResult.duration;
        if (durResult.sampleRate) {
          detectedSampleRate = `${(durResult.sampleRate / 1000).toFixed(1)} kHz`;
        }
        if (durResult.channels) {
          detectedChannels = durResult.channels === 1 ? 'Mono' : 'Stereo (L/R)';
        }
      } catch (err) {}

      const tempBlobUrl = URL.createObjectURL(file);
      const newTrackId = `track_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
      createdTrackIds.push(newTrackId);

      setNewReleaseTracks(prev => {
        // If an empty placeholder track exists at this index, replace it; otherwise append
        if (prev[i] && (!prev[i].audioUrl && (!prev[i].title || prev[i].title.startsWith('Track ')))) {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            title: parsedTitle || updated[i].title || `Track ${assignedTrackNum}`,
            num: assignedTrackNum,
            duration: detectedDuration,
            fileName: file.name,
            fileSize: sizeInMB,
            audioUrl: tempBlobUrl,
            url: tempBlobUrl,
            rawFile: file,
            status: 'uploading',
            vaultUploaded: false,
            metrics: {
              sampleRate: detectedSampleRate,
              bitDepth: '24-bit PCM',
              channels: detectedChannels,
              bitrate: '2304 kbps (Studio Master)',
              peakLufs: '-14.0 LUFS'
            }
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: newTrackId,
              num: (prev.length + 1).toString(),
              title: parsedTitle || `Track ${prev.length + 1}`,
              duration: detectedDuration,
              lyrics: '',
              fileName: file.name,
              fileSize: sizeInMB,
              audioUrl: tempBlobUrl,
              url: tempBlobUrl,
              rawFile: file,
              status: 'uploading',
              vaultUploaded: false,
              metrics: {
                sampleRate: detectedSampleRate,
                bitDepth: '24-bit PCM',
                channels: detectedChannels,
                bitrate: '2304 kbps (Studio Master)',
                peakLufs: '-14.0 LUFS'
              }
            }
          ];
        }
      });
    }

    // 2. Upload batch concurrently to audio-vault
    let completedCount = 0;
    let successCount = 0;

    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      try {
        const publicUrl = await uploadAudioVault(file, file.name);
        if (publicUrl) {
          successCount++;
          setNewReleaseTracks(prev =>
            prev.map(t => {
              if (t.fileName === file.name || (t.rawFile && t.rawFile.name === file.name)) {
                return {
                  ...t,
                  audioUrl: publicUrl,
                  url: publicUrl,
                  status: 'verified',
                  vaultUploaded: true
                };
              }
              return t;
            })
          );
        } else {
          setNewReleaseTracks(prev =>
            prev.map(t => {
              if (t.fileName === file.name || (t.rawFile && t.rawFile.name === file.name)) {
                return {
                  ...t,
                  status: 'warning',
                  vaultUploaded: false
                };
              }
              return t;
            })
          );
        }
      } catch (uploadErr) {
        setNewReleaseTracks(prev =>
          prev.map(t => {
            if (t.fileName === file.name || (t.rawFile && t.rawFile.name === file.name)) {
              return {
                ...t,
                status: 'warning',
                vaultUploaded: false
              };
            }
            return t;
          })
        );
      } finally {
        completedCount++;
        setBatchProgress(Math.round((completedCount / audioFiles.length) * 100));
      }
    }

    setIsBatchUploading(false);
    showLocalToast(`INGEST COMPLETE: ${successCount}/${audioFiles.length} tracks archived in 'audio-vault' bucket.`);
  };

  /**
   * Preview a track inline
   */
  const handleTogglePlayPreview = (track: TrackItem) => {
    if (!track.audioUrl && !track.url) {
      showLocalToast('NO AUDIO ATTACHED: Please attach a master WAV/MP3 file first.');
      return;
    }

    if (playingPreviewTrackId === track.id) {
      universalAudioPlayer.pause();
      setPlayingPreviewTrackId(null);
    } else {
      setPlayingPreviewTrackId(track.id);
      universalAudioPlayer.play(
        {
          id: track.id,
          title: track.title || 'Track Preview',
          artist: newReleaseTitle || 'Discography Preview',
          album: newReleaseTitle || 'Release Preview',
          audioUrl: track.audioUrl || track.url,
          duration: track.duration || '3:30'
        },
        {
          onEnded: () => setPlayingPreviewTrackId(null),
          onStateChange: (isPlaying) => {
            if (!isPlaying) setPlayingPreviewTrackId(null);
          }
        }
      );
      showLocalToast(`PLAYING PREVIEW: ${track.title || 'Track'}`);
    }
  };

  // Calculate vault stats
  const attachedTracks = newReleaseTracks.filter(t => Boolean(t.audioUrl || t.url || t.fileName));
  const verifiedTracks = newReleaseTracks.filter(t => t.status === 'verified' || t.vaultUploaded);
  const warningTracks = newReleaseTracks.filter(t => t.status === 'warning' || (t.audioUrl && !t.vaultUploaded && !t.audioUrl.startsWith('http')));

  return (
    <div 
      id="discography-release-form-section" 
      className={`bg-zinc-950 rounded-2xl p-5 transition-all duration-300 border ${
        editingFullReleaseId
          ? 'border-amber-500/80 bg-amber-950/10 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
          : !isReleaseFormExpanded 
            ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-[pulse_2.5s_infinite] hover:border-red-500' 
            : 'border-zinc-900 shadow-xl'
      }`}
    >
      <div 
        onClick={() => setIsReleaseFormExpanded(prev => !prev)}
        className="flex items-center justify-between cursor-pointer flex-wrap gap-2"
      >
        <div className="flex items-center gap-2.5">
          <Plus className={`w-4 h-4 ${editingFullReleaseId ? 'text-amber-400 rotate-45' : 'text-red-500'} transition-transform duration-300 ${isReleaseFormExpanded && !editingFullReleaseId ? 'rotate-45' : ''}`} />
          <h3 className="text-xs font-mono font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2 flex-wrap">
            {editingFullReleaseId ? (
              <>
                <span className="text-amber-400 font-bold">Edit Discography Release:</span>
                <span className="text-white underline decoration-amber-400/50">"{newReleaseTitle || 'Untitled Release'}"</span>
              </>
            ) : (
              'Add New Discography Release'
            )}
          </h3>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {editingFullReleaseId && (
            <>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] font-mono font-bold uppercase tracking-wider">
                EDIT MODE ACTIVE
              </span>
              <button
                type="button"
                onClick={handleCancelReleaseEdit}
                className="text-[9px] font-mono text-zinc-400 hover:text-white uppercase font-black tracking-wider bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                [ Cancel Edit / New Release ]
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsReleaseFormExpanded(prev => !prev)}
            className="text-[9px] font-mono text-zinc-400 uppercase font-black tracking-wider bg-zinc-900/85 px-2.5 py-1 rounded-lg border border-zinc-800 hover:text-red-400 hover:border-red-500/30 transition-colors cursor-pointer"
          >
            {isReleaseFormExpanded ? 'Collapse [-]' : 'Expand [+]'}
          </button>
        </div>
      </div>

      {isReleaseFormExpanded && (
        <form onSubmit={(e) => handleAddFullReleaseSubmit(e, selectedCatalogBandId)} className="space-y-5 pt-4 border-t border-zinc-900 mt-4 animate-fade-in">
          
          {/* FIELD 1: RELEASE TITLE */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">1. RELEASE TITLE</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Celestial Void" 
              value={newReleaseTitle} 
              onChange={e => setNewReleaseTitle(e.target.value)} 
              className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:border-[#FF9900]" 
            />
          </div>

          {/* COMBINED FIELD 2: TRACKLIST & INDIVIDUAL AUDIO INGEST */}
          <div className="space-y-3 border-t border-zinc-900 pt-4">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-zinc-300 block uppercase font-black tracking-wider flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#FF9900]" />
                  2. Tracklist & Master Audio Ingest
                </label>
                {newReleaseTracks.length > 0 && (
                  <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black uppercase flex items-center gap-1 border ${
                    warningTracks.length > 0 
                      ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                      : verifiedTracks.length === newReleaseTracks.length
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}>
                    {verifiedTracks.length}/{newReleaseTracks.length} IN AUDIO-VAULT
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <input 
                  type="file" 
                  ref={batchFileInputRef} 
                  accept=".wav,.mp3,.flac,.ogg,.m4a,audio/*" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) handleBatchAudioFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }} 
                />
                <button 
                  type="button" 
                  onClick={() => setIsTextParserOpen(prev => !prev)}
                  className={`text-[8.5px] font-mono px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                    isTextParserOpen 
                      ? 'bg-[#FF9900]/20 text-[#FF9900] border-[#FF9900]/50' 
                      : 'text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700'
                  }`}
                  title="Paste text file or raw song list with times"
                >
                  <Sparkles className="w-3 h-3 text-[#FF9900]" />
                  {isTextParserOpen ? 'Close Text Parser [-]' : '+ Bulk Paste / Text File'}
                </button>
                <button 
                  type="button" 
                  onClick={() => batchFileInputRef.current?.click()}
                  className="text-[8.5px] font-mono text-[#FF9900] bg-black hover:bg-zinc-900 px-2.5 py-1 rounded-lg border border-[#FF9900]/40 hover:border-[#FF9900] transition-colors flex items-center gap-1 cursor-pointer"
                  title="Drop or select multiple WAV/MP3 files at once"
                >
                  <UploadCloud className="w-3 h-3" />
                  + Batch Ingest (Multi-WAV)
                </button>
                <button 
                  type="button" 
                  onClick={() => setNewReleaseTracks(prev => [
                    ...prev, 
                    {
                      id: `track_${Date.now()}_${prev.length + 1}`, 
                      num: (prev.length + 1).toString(), 
                      title: '', 
                      duration: '', 
                      lyrics: '',
                      status: 'empty'
                    }
                  ])} 
                  className="text-[8.5px] font-mono text-zinc-200 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3 text-[#FF9900]" />
                  + Add Track
                </button>
              </div>
            </div>

            {/* Bulk Text / Text File Parser Box */}
            {isTextParserOpen && (
              <div className="p-4 bg-black/90 border border-[#FF9900]/40 rounded-xl space-y-3 animate-fade-in shadow-xl my-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#FF9900]" />
                    <span className="text-[10px] font-mono font-black text-white uppercase tracking-wider">
                      Bulk Paste Text File / Song Titles & Times
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={textFileInputRef} 
                      accept=".txt,.md,.csv,text/*" 
                      className="hidden" 
                      onChange={handleTextFileUpload} 
                    />
                    <button
                      type="button"
                      onClick={() => textFileInputRef.current?.click()}
                      className="text-[8.5px] font-mono text-[#FF9900] bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-[#FF9900]/30 transition-colors cursor-pointer"
                    >
                      📁 Upload .txt File
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTextParserOpen(false)}
                      className="text-[8.5px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800"
                    >
                      Close [X]
                    </button>
                  </div>
                </div>

                <p className="text-[9px] font-mono text-zinc-400">
                  Paste your raw tracklist below (e.g., copied from liner notes, setlist, or text file). Each line will be automatically parsed into track number, title, and duration (e.g. <span className="text-amber-400">"1. Intro - 2:15"</span> or <span className="text-amber-400">"Song Title 3:45"</span>).
                </p>

                <textarea
                  rows={5}
                  value={pastedTracklistText}
                  onChange={e => setPastedTracklistText(e.target.value)}
                  placeholder={`1. Introduction - 1:20\n2. Casket Decay - 4:15\n3. Putrid Embalming (3:52)\n4. Necro Phobia 5:10`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-[11px] font-mono text-white focus:outline-none focus:border-[#FF9900] resize-y"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => parsePastedTracklist()}
                    className="text-[9.5px] font-mono font-black uppercase tracking-wider bg-[#FF9900] hover:bg-[#FF8800] text-black px-4 py-2 rounded-lg transition-colors shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auto-Parse & Populate Organized Tracklist
                  </button>
                </div>
              </div>
            )}

            {/* Quick Batch Drag & Drop Zone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsBatchDragging(true); }}
              onDragLeave={() => setIsBatchDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsBatchDragging(false);
                if (e.dataTransfer.files) handleBatchAudioFiles(Array.from(e.dataTransfer.files));
              }}
              onClick={() => batchFileInputRef.current?.click()}
              className={`border border-dashed rounded-xl py-2 px-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
                isBatchDragging 
                  ? 'border-[#FF9900] bg-[#FF9900]/10' 
                  : 'border-zinc-850 hover:border-zinc-700 bg-black/30'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-[#FF9900]" />
              <span className="text-[8.5px] font-mono text-zinc-400 uppercase">
                Drag & drop album WAV batch here to auto-fill tracklist & archive to Audio-Vault
              </span>
            </div>

            {/* Batch Progress Bar */}
            {isBatchUploading && (
              <div className="p-3 bg-black border border-[#FF9900]/30 rounded-xl space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="text-[#FF9900] font-black uppercase flex items-center gap-1.5 animate-pulse">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    CONCURRENT AUDIO-VAULT ARCHIVAL IN PROGRESS...
                  </span>
                  <span className="text-white font-bold">{batchProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#FF9900] to-emerald-400 transition-all duration-200" style={{ width: `${batchProgress}%` }} />
                </div>
              </div>
            )}

            {/* Empty State Prompt */}
            {newReleaseTracks.length === 0 && (
              <div className="text-center py-6 border border-zinc-850/80 rounded-xl bg-black/40 space-y-2">
                <Music className="w-6 h-6 text-zinc-600 mx-auto" />
                <p className="text-[10px] font-mono text-zinc-400 uppercase font-bold">No tracks in tracklist yet</p>
                <p className="text-[8.5px] font-mono text-zinc-600 uppercase">
                  Click "+ Add Track" or drop master audio files above to automatically populate tracklist with individual uploaders.
                </p>
              </div>
            )}

            {/* Combined Track Cards */}
            <div className="space-y-2.5">
              {newReleaseTracks.map((track, idx) => {
                const isVerified = track.status === 'verified' || track.vaultUploaded;
                const isWarning = track.status === 'warning' || (!isVerified && track.status !== 'uploading' && Boolean(track.audioUrl || track.url || track.fileName));
                const isUploading = track.status === 'uploading';
                const isLyricsOpen = Boolean(expandedLyricsIds[track.id]);

                return (
                  <div 
                    key={`${track.id}-${idx}`} 
                    className={`border rounded-xl p-3 space-y-2.5 transition-all ${
                      isVerified
                        ? 'bg-black/60 border-zinc-850 hover:border-emerald-500/40'
                        : isWarning
                          ? 'bg-amber-950/10 border-amber-700/60 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                          : isUploading
                            ? 'bg-black/80 border-[#FF9900]/50'
                            : 'bg-black/50 border-zinc-850 hover:border-zinc-750'
                    }`}
                  >
                    {/* Primary Row: Track #, Title, Duration, Actions */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                      {/* Track Number */}
                      <input 
                        type="text" 
                        placeholder="#" 
                        value={track.num} 
                        onChange={e => { 
                          const n = [...newReleaseTracks]; 
                          n[idx].num = e.target.value; 
                          setNewReleaseTracks(n); 
                        }} 
                        className="w-10 bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2 focus:outline-none focus:border-[#FF9900] text-center shrink-0 font-bold" 
                      />

                      {/* Track Title */}
                      <input 
                        type="text" 
                        placeholder="Track Title" 
                        value={track.title} 
                        onChange={e => { 
                          const n = [...newReleaseTracks]; 
                          n[idx].title = e.target.value; 
                          setNewReleaseTracks(n); 
                        }} 
                        className="min-w-0 flex-1 bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2 focus:outline-none focus:border-[#FF9900] font-bold" 
                      />

                      {/* Duration */}
                      <input 
                        type="text" 
                        placeholder="Duration" 
                        value={track.duration} 
                        onChange={e => { 
                          const n = [...newReleaseTracks]; 
                          n[idx].duration = e.target.value; 
                          setNewReleaseTracks(n); 
                        }} 
                        className="w-20 bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2 focus:outline-none focus:border-[#FF9900] text-center shrink-0" 
                      />

                      {/* Remove Track */}
                      <button 
                        type="button" 
                        onClick={() => { 
                          const n = [...newReleaseTracks]; 
                          n.splice(idx, 1); 
                          setNewReleaseTracks(n); 
                        }} 
                        className="p-2 text-zinc-500 hover:text-rose-400 bg-black hover:bg-rose-950/30 rounded-lg border border-zinc-850 hover:border-rose-900/50 shrink-0 cursor-pointer transition-colors"
                        title="Remove track"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Integrated Audio Attachment Bar */}
                    <div className="pt-0.5">
                      {/* Hidden File Input for this Track */}
                      <input 
                        type="file" 
                        ref={el => { fileInputRefs.current[track.id] = el; }}
                        accept=".wav,.mp3,.flac,.ogg,.m4a,audio/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleIndividualTrackUpload(file, track.id, idx);
                          }
                          e.target.value = '';
                        }}
                      />

                      {/* 1. STATE: VERIFIED & STORED IN AUDIO-VAULT (GREEN CHECKMARK) */}
                      {isVerified && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-emerald-950/20 border border-emerald-800/40 rounded-lg font-mono">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9.5px] font-black text-emerald-400 uppercase tracking-wider">
                                  ✓ Attached & Archived in Audio-Vault
                                </span>
                                <span className="text-[8px] bg-emerald-900/40 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700/50">
                                  {track.metrics?.sampleRate || '48.0 kHz'} • {track.metrics?.bitDepth || '24-bit PCM'}
                                </span>
                              </div>
                              <div className="text-[8px] text-zinc-400 truncate mt-0.5">
                                File: <span className="text-zinc-200 font-bold">{track.fileName || `${track.title}.wav`}</span>
                                {track.fileSize && <span> ({track.fileSize})</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            {/* Inline Preview Player */}
                            <button
                              type="button"
                              onClick={() => handleTogglePlayPreview(track)}
                              className={`px-2 py-1 rounded text-[8px] font-mono font-bold uppercase flex items-center gap-1 border transition-colors cursor-pointer ${
                                playingPreviewTrackId === track.id
                                  ? 'bg-[#FF9900] text-black border-[#FF9900]'
                                  : 'bg-black text-zinc-300 hover:text-white border-zinc-800'
                              }`}
                            >
                              {playingPreviewTrackId === track.id ? (
                                <>
                                  <Pause className="w-2.5 h-2.5" />
                                  Playing
                                </>
                              ) : (
                                <>
                                  <Play className="w-2.5 h-2.5 text-[#FF9900]" />
                                  Test Audio
                                </>
                              )}
                            </button>

                            {/* Re-attach / Replace Audio */}
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[track.id]?.click()}
                              className="px-2 py-1 rounded text-[8px] font-mono text-zinc-400 hover:text-white bg-black border border-zinc-800 hover:border-zinc-700 uppercase cursor-pointer"
                            >
                              Replace File
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. STATE: TIMED OUT / INCOMPLETE / WARNING (YELLOW WARNING ICON) */}
                      {isWarning && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-amber-950/30 border border-amber-700/60 rounded-lg font-mono">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[9.5px] font-black text-amber-400 uppercase tracking-wider">
                                  ⚠️ Audio Not Saved to Vault Bucket (Local Buffer Only)
                                </span>
                              </div>
                              <div className="text-[8px] text-amber-200/70 truncate mt-0.5">
                                {track.fileName || `${track.title}.wav`} — Click Retry to push file to Supabase Audio-Vault
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            {/* Direct Retry Vault Upload Button */}
                            <button
                              type="button"
                              onClick={() => handleRetryTrackUpload(track.id, idx)}
                              className="px-2.5 py-1 rounded bg-[#FF9900] hover:bg-[#FF9900]/85 text-black text-[8.5px] font-mono font-black uppercase flex items-center gap-1 border border-[#FF9900] cursor-pointer shadow-sm active:scale-95"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              Retry Vault Upload
                            </button>

                            {/* Re-select Audio */}
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[track.id]?.click()}
                              className="px-2 py-1 rounded text-[8px] font-mono text-zinc-400 hover:text-white bg-black border border-zinc-800 hover:border-zinc-700 uppercase cursor-pointer"
                            >
                              Select File
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. STATE: CURRENTLY UPLOADING (ANIMATED SPINNER) */}
                      {isUploading && (
                        <div className="flex items-center justify-between gap-2 p-2 bg-black border border-[#FF9900]/40 rounded-lg font-mono animate-pulse">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-[#FF9900] animate-spin shrink-0" />
                            <span className="text-[9px] font-bold text-[#FF9900] uppercase tracking-wider">
                              Encoding & Archiving to Supabase 'audio-vault'...
                            </span>
                          </div>
                          <span className="text-[8px] text-zinc-500 uppercase">{track.fileName}</span>
                        </div>
                      )}

                      {/* 4. STATE: EMPTY / NO AUDIO ATTACHED YET */}
                      {!isVerified && !isWarning && !isUploading && (
                        <div 
                          onClick={() => fileInputRefs.current[track.id]?.click()}
                          className="flex items-center justify-between p-2 rounded-lg border border-dashed border-zinc-850 hover:border-[#FF9900]/50 bg-black/30 hover:bg-black/60 cursor-pointer transition-all group font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <FileAudio className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#FF9900] transition-colors" />
                            <span className="text-[8.5px] text-zinc-400 group-hover:text-zinc-200 uppercase font-bold">
                              + Attach Master Audio (WAV, MP3, FLAC)
                            </span>
                          </div>
                          <span className="text-[8px] text-[#FF9900] bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 group-hover:border-[#FF9900]/40">
                            Browse File
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Lyrics Accordion Toggle */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => toggleLyrics(track.id)}
                        className="text-[8px] font-mono text-zinc-500 hover:text-zinc-300 uppercase flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {isLyricsOpen ? <ChevronUp className="w-3 h-3 text-[#FF9900]" /> : <ChevronDown className="w-3 h-3" />}
                        {track.lyrics ? 'Edit Lyrics (Present)' : '+ Add Lyrics (Optional)'}
                      </button>

                      {isLyricsOpen && (
                        <textarea 
                          placeholder="Paste song lyrics here (optional)..." 
                          value={track.lyrics} 
                          onChange={e => { 
                            const n = [...newReleaseTracks]; 
                            n[idx].lyrics = e.target.value; 
                            setNewReleaseTracks(n); 
                          }} 
                          className="w-full bg-black border border-zinc-850 text-zinc-400 text-[10px] font-mono rounded-lg p-2 h-16 focus:outline-none focus:border-[#FF9900] mt-1.5 animate-fade-in" 
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FIELD 3: ALBUM COVER UPLOAD */}
          <div className="space-y-1.5 border-t border-zinc-900 pt-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">3. ALBUM COVER UPLOAD</label>
              {newReleaseCoverImage && (
                <button
                   type="button"
                   onClick={() => setNewReleaseCoverImage(null)}
                  className="text-[8px] font-mono text-rose-400 hover:text-rose-350 uppercase cursor-pointer"
                >
                  [ Remove Cover ]
                </button>
              )}
            </div>
            <div 
              className="border border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-2 border-zinc-850 hover:border-zinc-700 bg-black/40"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setNewReleaseCoverImage(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);

                    showLocalToast("Uploading release cover artwork to 'audio-vault' bucket...");
                    try {
                      const uploadedUrl = await uploadArtworkToVault(file);
                      if (uploadedUrl) {
                        setNewReleaseCoverImage(uploadedUrl);
                        showLocalToast("Cover artwork archived to 'audio-vault' storage bucket!");
                      }
                    } catch (err) {
                      console.warn('[Cover Upload] Notice:', err);
                    }
                  }
                };
                input.click();
              }}
            >
               {newReleaseCoverImage ? (
                   <img src={newReleaseCoverImage} alt="Cover Preview" className="w-24 h-24 object-cover rounded-md border border-zinc-700 shadow-lg" />
               ) : (
                   <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">CLICK TO UPLOAD COVER IMAGE</span>
               )}
            </div>
          </div>

          {/* FIELD 4: RELEASE DATE & FORMAT TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">4. RELEASE DATE</label>
              <input 
                type="date" 
                required 
                value={newReleaseDate} 
                onChange={e => setNewReleaseDate(e.target.value)} 
                className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:border-[#FF9900]" 
                style={{ colorScheme: 'dark' }} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">5. FORMAT TYPE</label>
              <select 
                value={newReleaseFormatType} 
                onChange={e => setNewReleaseFormatType(e.target.value as any)} 
                className="w-full bg-black border border-zinc-850 text-zinc-400 text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:text-white"
              >
                <option value="Album">ALBUM</option>
                <option value="EP">EP</option>
                <option value="Demo">DEMO</option>
                <option value="Split">SPLIT</option>
                <option value="Single">SINGLE</option>
              </select>
            </div>
          </div>

          {/* FIELD 6: GENRE, CATALOG ID, & RECORD LABEL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-zinc-900 pt-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">6. GENRE</label>
              <input 
                type="text" 
                placeholder="e.g. Death Metal" 
                value={newReleaseGenre} 
                onChange={e => setNewReleaseGenre(e.target.value)} 
                className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:border-[#FF9900]" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">7. CATALOG ID</label>
              <input 
                type="text" 
                required 
                placeholder="NX-XXX" 
                value={newReleaseCatalogId} 
                onChange={e => setNewReleaseCatalogId(e.target.value)} 
                className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:border-[#FF9900]" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">RECORD LABEL (OPTIONAL)</label>
              <input 
                type="text" 
                placeholder="Independent / Label Name" 
                value={newReleaseLabel} 
                onChange={e => setNewReleaseLabel(e.target.value)} 
                className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:border-[#FF9900]" 
              />
            </div>
          </div>

          {/* FIELD 8: PHYSICAL COPIES & ART ACCENT COLOR */}
          <div className="space-y-2 border-t border-zinc-900 pt-3">
            <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">8. PHYSICAL COPIES (WAREHOUSE STOCK)</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-zinc-500 block uppercase text-center font-black">VINYL WAREHOUSE PCS</label>
                <input type="number" min={0} value={newReleaseVinylQty} onChange={e => setNewReleaseVinylQty(Number(e.target.value))} className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2 text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-zinc-500 block uppercase text-center font-black">CD WAREHOUSE PCS</label>
                <input type="number" min={0} value={newReleaseCdQty} onChange={e => setNewReleaseCdQty(Number(e.target.value))} className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2 text-center" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-mono text-zinc-500 block uppercase text-center font-black">CASSETTE WAREHOUSE PCS</label>
                <input type="number" min={0} value={newReleaseCassetteQty} onChange={e => setNewReleaseCassetteQty(Number(e.target.value))} className="w-full bg-black border border-zinc-850 text-white text-[11px] font-mono rounded-lg p-2 text-center" />
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className="text-[9px] font-mono text-zinc-500 block uppercase font-black">ART ACCENT COLOR THEME</label>
              <select value={newReleaseColor} onChange={e => setNewReleaseColor(e.target.value)} className="w-full bg-black border border-zinc-850 text-zinc-400 text-[11px] font-mono rounded-lg p-2.5 focus:outline-none focus:text-white">
                <option value="from-emerald-950/80 to-zinc-950 border-emerald-500/30">EMERALD BARRELS</option>
                <option value="from-amber-950/80 to-zinc-950 border-[#FF9900]/30">AMBER COALTAR</option>
                <option value="from-purple-950/80 to-zinc-950 border-purple-500/30">WITCH PURPLE</option>
                <option value="from-zinc-900 to-zinc-950 border-zinc-800">COAL BLACK</option>
              </select>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={isSavingRelease || isBatchUploading}
            className={`w-full py-3.5 ${isSavingRelease || isBatchUploading ? 'bg-[#FF9900]/50 text-black/70 cursor-not-allowed' : 'bg-[#FF9900] hover:bg-[#FF9900]/85 text-black cursor-pointer active:scale-98'} font-mono font-black text-xs tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg`}
          >
            {isSavingRelease ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {editingFullReleaseId ? 'Updating Release & Audio-Vault...' : 'Archiving Audio Masters to Vault & Updating Database...'}
              </>
            ) : isBatchUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Uploading Master Audio Files ({batchProgress}%)...
              </>
            ) : editingFullReleaseId ? (
              'Save & Update Release Details (Sync Audio-Vault & Supabase)'
            ) : (
              'Save Release & Archive All Masters in Audio-Vault'
            )}
          </button>
        </form>
      )}
    </div>
  );
};
