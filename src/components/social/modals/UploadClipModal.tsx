import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PlaySquare,
  X,
  Video,
  RefreshCw,
  Scissors,
  Zap,
  Ticket,
  ShoppingBag,
} from 'lucide-react';
import { uploadClipVideoFile } from '../../../supabase';
import {
  saveClipMediaBlob,
  generateVideoThumbnail,
  resolveValidClipUserId,
  generateClipUUID,
} from '../utils/clipsPersistenceService';
import { ensureProfileRowExists } from '../utils/postSyncUtils';
import { pushManager } from '../../../lib/pushNotifications';
import { authFetch, getSupabaseAccessToken } from '../../../utils/apiConfig';

export interface ClipPinnedAttachmentInput {
  type: 'show' | 'merch';
  id?: string;
  title: string;
  subtitle?: string;
  price?: string;
  ctaLabel?: string;
}

interface UploadClipModalProps {
  showUploadClipModal: boolean;
  setShowUploadClipModal: (val: boolean) => void;
  newClipVideoUrl: string;
  setNewClipVideoUrl: (val: string) => void;
  selectedClipFile: File | null;
  setSelectedClipFile: (file: File | null) => void;
  newClipCaption: string;
  setNewClipCaption: (val: string) => void;
  newClipTitle?: string;
  setNewClipTitle?: (val: string) => void;
  newClipSongTitle: string;
  setNewClipSongTitle: (val: string) => void;
  newClipBandName: string;
  setNewClipBandName: (val: string) => void;
  newClipTags: string;
  setNewClipTags: (val: string) => void;
  setClips: React.Dispatch<React.SetStateAction<any[]>>;
  userProfile?: any;
  triggerNotification?: (msg: string) => void;
  getSupabase?: () => any;
}

function formatSec(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const UploadClipModal: React.FC<UploadClipModalProps> = ({
  showUploadClipModal,
  setShowUploadClipModal,
  newClipVideoUrl,
  setNewClipVideoUrl,
  selectedClipFile,
  setSelectedClipFile,
  newClipCaption,
  setNewClipCaption,
  newClipTitle = '',
  setNewClipTitle,
  newClipSongTitle,
  setNewClipSongTitle,
  newClipBandName,
  setNewClipBandName,
  newClipTags,
  setNewClipTags,
  setClips,
  userProfile,
  triggerNotification,
  getSupabase,
}) => {
  const [isUploadingClip, setIsUploadingClip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInBackground, setUploadInBackground] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // In-Browser Clip Trimmer & Breakdown Marker state
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const [videoDurationSec, setVideoDurationSec] = useState<number>(30);
  const [trimStartSec, setTrimStartSec] = useState<number>(0);
  const [trimEndSec, setTrimEndSec] = useState<number>(30);
  const [previewCurrentSec, setPreviewCurrentSec] = useState<number>(0);
  const [breakdownDropSec, setBreakdownDropSec] = useState<number | null>(null);

  // Pin Show or Merch Attachment state
  const [pinMode, setPinMode] = useState<'none' | 'show' | 'merch'>('none');
  const [pinTitle, setPinTitle] = useState('');
  const [pinSubtitle, setPinSubtitle] = useState('');
  const [pinPrice, setPinPrice] = useState('$25');

  // Reset trimmer & pin state when modal opens/closes or video changes
  useEffect(() => {
    if (!newClipVideoUrl) {
      setVideoDurationSec(30);
      setTrimStartSec(0);
      setTrimEndSec(30);
      setBreakdownDropSec(null);
      setPreviewCurrentSec(0);
    }
  }, [newClipVideoUrl]);

  const handlePostClip = async () => {
    if (!newClipVideoUrl && !selectedClipFile) {
      triggerNotification?.('Please provide a video URL or select a clip file.');
      return;
    }

    setIsUploadingClip(true);
    setUploadProgress(15);
    setUploadStatusText('Preparing clip media...');

    const supabaseClient = getSupabase ? getSupabase() : null;
    const validUserId = await resolveValidClipUserId(supabaseClient, userProfile);
    const clipId = generateClipUUID();

    let finalVideoUrl = newClipVideoUrl;
    let thumbUrl = '';

    if (selectedClipFile) {
      try {
        await saveClipMediaBlob(clipId, selectedClipFile);
        try {
          thumbUrl = await generateVideoThumbnail(selectedClipFile);
        } catch (_) {}
      } catch (err) {
        console.warn('Failed to cache media blob locally:', err);
      }
    }

    const localPreviewUrl = selectedClipFile
      ? URL.createObjectURL(selectedClipFile)
      : newClipVideoUrl || '';
    if (!finalVideoUrl && localPreviewUrl) {
      finalVideoUrl = localPreviewUrl;
    }

    const cleanTags = newClipTags
      ? newClipTags
          .split(',')
          .map((t: string) => t.trim())
          .filter(Boolean)
      : ['SLAM', 'LIVE'];

    const username =
      userProfile?.username || userProfile?.full_name || userProfile?.name || 'Anonymous';
    const avatar =
      userProfile?.avatar_url ||
      userProfile?.avatar ||
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
    const bandName =
      newClipBandName || userProfile?.band_name || userProfile?.full_name || 'Scene Band';
    const songTitle = newClipSongTitle || 'Pit Anthem';
    const title = newClipTitle || newClipCaption || 'Live Clip';
    const caption = newClipCaption || title;
    const role =
      userProfile?.role_badge ||
      userProfile?.account_type ||
      (bandName ? '💀 Band' : 'Operator');

    const pinnedAttachment: ClipPinnedAttachmentInput | undefined =
      pinMode !== 'none' && pinTitle.trim()
        ? {
            type: pinMode,
            id: `pin_${Date.now()}`,
            title: pinTitle.trim(),
            subtitle:
              pinSubtitle.trim() ||
              (pinMode === 'show' ? 'Upcoming Live Show' : 'Limited Scene Merch Drop'),
            price: pinPrice.trim() || (pinMode === 'show' ? '$25' : '$35'),
            ctaLabel: pinMode === 'show' ? 'RSVP / Tickets' : 'Grab Merch',
          }
        : undefined;

    const effectiveTrimStart = Math.max(0, Math.min(trimStartSec, trimEndSec - 1));
    const effectiveTrimEnd = Math.max(effectiveTrimStart + 1, trimEndSec);
    const effectiveDuration = Math.max(1, Math.round(effectiveTrimEnd - effectiveTrimStart));

    const newClipObj: any = {
      id: clipId,
      user_id: validUserId,
      profile_id: validUserId,
      username: username,
      creator: username,
      author: username,
      avatar: avatar,
      role: role,
      video_url: finalVideoUrl,
      videoUrl: finalVideoUrl,
      thumbnail_url: thumbUrl,
      thumbnailUrl: thumbUrl,
      caption: caption,
      title: title,
      song_title: songTitle,
      songTitle: songTitle,
      band_name: bandName,
      bandName: bandName,
      audio: `${bandName} - ${songTitle}`,
      tags: cleanTags,
      trimStartSec: effectiveTrimStart > 0 ? effectiveTrimStart : undefined,
      trimEndSec: effectiveTrimEnd < videoDurationSec ? effectiveTrimEnd : undefined,
      breakdownDropSec: breakdownDropSec !== null ? breakdownDropSec : undefined,
      pinnedAttachment,
      duration: effectiveDuration,
      likes: 1,
      likes_count: 1,
      comments: 0,
      comments_count: 0,
      shares: 0,
      shares_count: 0,
      views: 1,
      views_count: 1,
      hasLiked: true,
      created_at: new Date().toISOString(),
    };

    const persistClipToSupabase = async (activeUrl: string) => {
      if (!supabaseClient) return null;
      const safeDbVideoUrl =
        !activeUrl || activeUrl.startsWith('blob:')
          ? 'https://www.youtube.com/watch?v=jQ26iMGJbW4'
          : activeUrl;
      try {
        const payload: any = {
          id: clipId,
          user_id: validUserId,
          profile_id: validUserId,
          video_url: safeDbVideoUrl,
          caption: caption,
          title: title,
          description: caption,
          song_title: songTitle,
          band_name: bandName,
          username: username,
          avatar: avatar,
          thumbnail_url: thumbUrl || null,
          duration: effectiveDuration,
          likes_count: 1,
          comments_count: 0,
          shares_count: 0,
          tags: cleanTags,
          created_at: newClipObj.created_at,
        };

        const { data, error: insErr } = await supabaseClient
          .from('clips')
          .upsert([payload], { onConflict: 'id' })
          .select();

        if (!insErr && data && data[0]) {
          return data[0];
        }

        if (insErr) {
          if (insErr.code === '23503') {
            try {
              await ensureProfileRowExists(supabaseClient, validUserId, userProfile);
              const { data: retryData, error: retryErr } = await supabaseClient
                .from('clips')
                .upsert([payload], { onConflict: 'id' })
                .select();
              if (!retryErr && retryData && retryData[0]) {
                return retryData[0];
              }
            } catch (_) {}
          }

          const corePayload = {
            id: clipId,
            user_id: payload.user_id || validUserId,
            video_url: activeUrl,
            title: title,
            description: caption,
            thumbnail_url: thumbUrl || null,
            duration: effectiveDuration,
            likes_count: 1,
            comments_count: 0,
            shares_count: 0,
          };
          const { data: coreData, error: coreErr } = await supabaseClient
            .from('clips')
            .upsert([corePayload], { onConflict: 'id' })
            .select();
          if (!coreErr && coreData && coreData[0]) {
            return coreData[0];
          }
        }
      } catch (dbErr) {
        console.error('[UploadClipModal] Database insert error:', dbErr);
      }
      return null;
    };

    const resetModalForm = () => {
      setNewClipCaption('');
      if (setNewClipTitle) setNewClipTitle('');
      setNewClipVideoUrl('');
      setSelectedClipFile(null);
      setPinMode('none');
      setPinTitle('');
      setPinSubtitle('');
      setBreakdownDropSec(null);
      setShowUploadClipModal(false);
    };

    if (uploadInBackground && selectedClipFile) {
      setClips((prev) => {
        const updated = [newClipObj, ...prev.filter((c) => c.id !== clipId)];
        try {
          localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      resetModalForm();
      setIsUploadingClip(false);

      pushManager
        .sendPushToServer({
          title: `🔥 New Clip Drop: ${bandName}`,
          body: `"${title || caption || 'New clip reel live now!'}"`,
          category: 'exclusive_content',
          priority: 'P1',
          targetTab: 'social',
          data: { clipId, bandName, type: 'clip_drop' },
        })
        .catch(() => {});

      (async () => {
        try {
          await persistClipToSupabase(finalVideoUrl);
          let remoteUrl = '';
          try {
            remoteUrl = await uploadClipVideoFile(selectedClipFile, validUserId, 'clip');
          } catch (_) {}

          if (remoteUrl) {
            try {
              if (supabaseClient) {
                await supabaseClient
                  .from('clips')
                  .update({ video_url: remoteUrl })
                  .eq('id', clipId);
              }
            } catch (_) {}

            try {
              if (await getSupabaseAccessToken()) {
                await authFetch('/api/clips', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...newClipObj,
                    video_url: remoteUrl,
                    videoUrl: remoteUrl,
                  }),
                });
              }
            } catch (_) {}

            setClips((prev) =>
              prev.map((c) =>
                c.id === clipId ? { ...c, video_url: remoteUrl, videoUrl: remoteUrl } : c
              )
            );
            try {
              const raw = localStorage.getItem('nexus_saved_clips');
              if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                  const updated = list.map((c: any) =>
                    c.id === clipId ? { ...c, video_url: remoteUrl, videoUrl: remoteUrl } : c
                  );
                  localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
                }
              }
            } catch (_) {}
          }
        } catch (_) {}
      })();

      return;
    }

    try {
      setUploadProgress(35);
      setUploadStatusText('Uploading video to clips storage bucket...');

      let remoteUrl = '';
      if (selectedClipFile) {
        try {
          remoteUrl = await uploadClipVideoFile(selectedClipFile, validUserId, 'clip');
          setUploadProgress(75);
        } catch (_) {}
      } else if (
        newClipVideoUrl &&
        (newClipVideoUrl.startsWith('http://') ||
          newClipVideoUrl.startsWith('https://') ||
          newClipVideoUrl.startsWith('/uploads/')) &&
        !newClipVideoUrl.startsWith('blob:')
      ) {
        remoteUrl = newClipVideoUrl;
      }

      const isRemotePermanent =
        remoteUrl &&
        (remoteUrl.startsWith('http://') ||
          remoteUrl.startsWith('https://') ||
          remoteUrl.startsWith('/uploads/')) &&
        !remoteUrl.startsWith('blob:');
      const activeClipUrl = isRemotePermanent
        ? remoteUrl
        : localPreviewUrl || finalVideoUrl || '';

      newClipObj.video_url = activeClipUrl;
      newClipObj.videoUrl = activeClipUrl;

      setUploadProgress(90);
      setUploadStatusText('Saving clip record to database...');

      await persistClipToSupabase(isRemotePermanent ? remoteUrl : activeClipUrl);

      try {
        if (await getSupabaseAccessToken()) {
          await authFetch('/api/clips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClipObj),
          });
        }
      } catch (_) {}

      setUploadProgress(100);
      setUploadStatusText('Complete!');

      setClips((prev) => {
        const updated = [newClipObj, ...prev.filter((c) => c.id !== clipId)];
        try {
          localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      resetModalForm();
    } catch (err: any) {
      console.error('Failed to upload clip:', err);
      triggerNotification?.(`Error posting clip: ${err.message || err}`);
    } finally {
      setIsUploadingClip(false);
      setUploadProgress(0);
      setUploadStatusText('');
    }
  };

  return (
    <AnimatePresence>
      {showUploadClipModal && (
        <motion.div
          key="modal-backdrop-uploadclipmodal-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-start md:items-center overflow-y-auto p-4 py-8"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-[#121214] border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.15)] flex flex-col max-h-[88vh] my-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
              <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 font-display">
                <PlaySquare className="w-4 h-4 text-rose-400" /> New Reel Clip Studio
              </span>
              <button
                type="button"
                onClick={() => setShowUploadClipModal(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="w-full flex flex-col gap-3.5">
                {newClipVideoUrl ? (
                  <div className="space-y-3">
                    <div
                      className="w-full relative rounded-xl overflow-hidden bg-black flex items-center justify-center border border-zinc-700"
                      style={{ height: '220px' }}
                    >
                      <video
                        ref={previewVideoRef}
                        src={newClipVideoUrl}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                        loop
                        playsInline
                        onLoadedMetadata={(e) => {
                          const dur = e.currentTarget.duration;
                          if (Number.isFinite(dur) && dur > 1) {
                            const rounded = Math.ceil(dur);
                            setVideoDurationSec(rounded);
                            setTrimStartSec(0);
                            setTrimEndSec(rounded);
                          }
                        }}
                        onTimeUpdate={(e) => {
                          const v = e.currentTarget;
                          setPreviewCurrentSec(Math.floor(v.currentTime));
                          if (v.currentTime < trimStartSec) {
                            v.currentTime = trimStartSec;
                          } else if (trimEndSec > trimStartSec && v.currentTime > trimEndSec) {
                            v.currentTime = trimStartSec;
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewClipVideoUrl('');
                          setSelectedClipFile(null);
                        }}
                        className="absolute top-2 right-2 bg-black/70 p-1.5 rounded-full hover:bg-rose-500/80 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>

                    {/* IN-BROWSER CLIP TRIMMER & BREAKDOWN MARKER */}
                    <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <Scissors className="w-3.5 h-3.5 text-rose-400" />
                          <span>Clip Trimmer &amp; Breakdown Marker</span>
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md">
                          Cut: {formatSec(trimStartSec)} – {formatSec(trimEndSec)} (
                          {Math.max(1, trimEndSec - trimStartSec)}s)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                            <span>Start</span>
                            <span className="text-white">{formatSec(trimStartSec)}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={Math.max(1, trimEndSec - 1)}
                            step={1}
                            value={trimStartSec}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setTrimStartSec(next);
                              if (previewVideoRef.current) {
                                previewVideoRef.current.currentTime = next;
                              }
                            }}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                            <span>End</span>
                            <span className="text-white">{formatSec(trimEndSec)}</span>
                          </div>
                          <input
                            type="range"
                            min={Math.min(videoDurationSec, trimStartSec + 1)}
                            max={Math.max(2, videoDurationSec)}
                            step={1}
                            value={trimEndSec}
                            onChange={(e) => {
                              const next = Number(e.target.value);
                              setTrimEndSec(next);
                            }}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Breakdown Drop Marker Stamp */}
                      <div className="pt-2 border-t border-zinc-900 flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-[11px] font-semibold text-zinc-200">
                              Breakdown Drop Marker
                            </span>
                          </div>
                          {breakdownDropSec !== null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/35 px-2 py-0.5 rounded-md">
                                ⚡ Drop @ {formatSec(breakdownDropSec)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setBreakdownDropSec(null)}
                                className="text-[10px] text-zinc-400 hover:text-white cursor-pointer px-1"
                              >
                                Clear
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setBreakdownDropSec(
                                  Math.max(
                                    trimStartSec,
                                    Math.min(trimEndSec, previewCurrentSec || Math.floor((trimStartSec + trimEndSec) / 2))
                                  )
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Mark Drop ({formatSec(previewCurrentSec)})</span>
                            </button>
                          )}
                        </div>

                        {breakdownDropSec !== null && (
                          <input
                            type="range"
                            min={trimStartSec}
                            max={trimEndSec}
                            step={1}
                            value={breakdownDropSec}
                            onChange={(e) => setBreakdownDropSec(Number(e.target.value))}
                            className="w-full accent-amber-400 cursor-pointer"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-zinc-800 rounded-xl p-6 text-center hover:border-rose-500/50 transition-colors bg-zinc-950/40">
                      <Video className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                      <label className="text-xs font-bold text-zinc-300 block cursor-pointer">
                        Select Video File
                        <input
                          type="file"
                          accept="video/*"
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSelectedClipFile(file);
                              setNewClipVideoUrl(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        MP4, MOV, or WEBM up to 100MB
                      </p>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Or paste video / YouTube URL..."
                        value={newClipVideoUrl}
                        onChange={(e) => setNewClipVideoUrl(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                )}

                {/* Caption & Metadata Inputs */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                      CAPTION &amp; PIT NOTES
                    </label>
                    <textarea
                      placeholder="Add a caption..."
                      value={newClipCaption}
                      onChange={(e) => setNewClipCaption(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 h-16 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                        SONG TITLE
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Slit Your Gut"
                        value={newClipSongTitle}
                        onChange={(e) => setNewClipSongTitle(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                        BAND NAME
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CRYPTOPSY"
                        value={newClipBandName}
                        onChange={(e) => setNewClipBandName(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* PIN SHOW OR MERCH DROP TO CLIP */}
                  <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase">
                        PIN SHOW OR MERCH TO CLIP
                      </span>
                      <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                        {(
                          [
                            { id: 'none', label: 'None' },
                            { id: 'show', label: '🎟️ Show' },
                            { id: 'merch', label: '👕 Merch' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setPinMode(opt.id);
                              if (opt.id === 'show' && !pinTitle) {
                                setPinTitle(`${newClipBandName || 'Scene'} Live Show`);
                                setPinSubtitle('The Regent • Doors 7:30 PM');
                                setPinPrice('$25');
                              } else if (opt.id === 'merch' && !pinTitle) {
                                setPinTitle(`${newClipBandName || 'Band'} Limited Tour Tee`);
                                setPinSubtitle('Heavyweight Black Cotton • S–2XL');
                                setPinPrice('$35');
                              }
                            }}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                              pinMode === opt.id
                                ? 'bg-rose-600 text-white'
                                : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {pinMode !== 'none' && (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          placeholder={
                            pinMode === 'show'
                              ? 'Show / Tour Title (e.g. Age of Terror Tour)'
                              : 'Merch Item Name (e.g. Heavyweight Tour Tee)'
                          }
                          value={pinTitle}
                          onChange={(e) => setPinTitle(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder={
                              pinMode === 'show'
                                ? 'Venue & Date (e.g. The Regent • Nov 22)'
                                : 'Details (e.g. Limited Drop • All Sizes)'
                            }
                            value={pinSubtitle}
                            onChange={(e) => setPinSubtitle(e.target.value)}
                            className="col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                          <input
                            type="text"
                            placeholder="$25"
                            value={pinPrice}
                            onChange={(e) => setPinPrice(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                        GENRE TAGS (COMMA SEPARATED)
                      </label>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Tap pills below to toggle
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder="SLAM, TECHNICAL DEATH, LIVE"
                      value={newClipTags}
                      onChange={(e) => setNewClipTags(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[
                        'SLAM',
                        'GOREGRIND',
                        'DEATHCORE',
                        'BRUTAL DEATH',
                        'HARDCORE',
                        'BEATDOWN',
                        'TECH DEATH',
                        'BLACK METAL',
                        'BREAKDOWN',
                        'LIVE',
                      ].map((tag) => {
                        const activeTags = newClipTags
                          .split(',')
                          .map((t: string) => t.trim().toUpperCase());
                        const isSelected = activeTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                const filtered = activeTags.filter(
                                  (t: string) => t !== tag && t.length > 0
                                );
                                setNewClipTags(filtered.join(', '));
                              } else {
                                const existing = activeTags.filter((t: string) => t.length > 0);
                                setNewClipTags([...existing, tag].join(', '));
                              }
                            }}
                            className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer border ${
                              isSelected
                                ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                            }`}
                          >
                            #{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Background Upload Toggle */}
                <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5 mt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="uploadInBackground"
                      checked={uploadInBackground}
                      onChange={(e) => setUploadInBackground(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <label
                      htmlFor="uploadInBackground"
                      className="text-xs text-zinc-300 font-medium cursor-pointer"
                    >
                      Upload in background (post instantly)
                    </label>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">Fast publish</span>
                </div>

                {isUploadingClip && !uploadInBackground && (
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-zinc-400">{uploadStatusText || 'Uploading...'}</span>
                      <span className="text-rose-400 font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                      <div
                        className="bg-rose-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handlePostClip}
                  disabled={isUploadingClip}
                  className={`w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer ${
                    isUploadingClip ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploadingClip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{uploadStatusText || 'Posting Clip...'}</span>
                    </>
                  ) : (
                    <span>Post Reel Clip</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
