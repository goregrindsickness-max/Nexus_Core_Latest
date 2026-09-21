import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlaySquare, X, Upload, Video, RefreshCw, Music2 } from 'lucide-react';
import { uploadClipVideoFile } from '../../../supabase';
import {
  saveClipMediaBlob,
  generateVideoThumbnail,
  resolveValidClipUserId,
  generateClipUUID,
} from '../utils/clipsPersistenceService';

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
  getSupabase
}) => {
  const [isUploadingClip, setIsUploadingClip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInBackground, setUploadInBackground] = useState(true);
  const [uploadStatusText, setUploadStatusText] = useState('');

  const handlePostClip = async () => {
    if (!newClipVideoUrl && !selectedClipFile) {
      triggerNotification?.("Please provide a video URL or select a clip file.");
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
        console.warn("Failed to cache media blob locally:", err);
      }
    }

    const localPreviewUrl = selectedClipFile ? URL.createObjectURL(selectedClipFile) : (newClipVideoUrl || '');
    if (!finalVideoUrl && localPreviewUrl) {
      finalVideoUrl = localPreviewUrl;
    }
    if (!finalVideoUrl) {
      finalVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-rock-band-performing-on-stage-41584-large.mp4';
    }

    const cleanTags = newClipTags
      ? newClipTags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : ['SLAM', 'LIVE'];

    const username = userProfile?.username || userProfile?.full_name || userProfile?.name || 'Anonymous';
    const avatar = userProfile?.avatar_url || userProfile?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
    const bandName = newClipBandName || userProfile?.band_name || userProfile?.full_name || 'Scene Band';
    const songTitle = newClipSongTitle || 'Pit Anthem';
    const title = newClipTitle || newClipCaption || 'Live Clip';
    const caption = newClipCaption || title;
    const role = userProfile?.role_badge || userProfile?.account_type || (bandName ? '💀 Band' : 'Operator');

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
      likes: 1,
      likes_count: 1,
      comments: 0,
      comments_count: 0,
      shares: 0,
      shares_count: 0,
      views: 1,
      views_count: 1,
      hasLiked: true,
      created_at: new Date().toISOString()
    };

    // Helper to persist clip record to Supabase clips table
    const persistClipToSupabase = async (activeUrl: string) => {
      if (!supabaseClient) return null;
      try {
        const payload = {
          id: clipId,
          user_id: validUserId,
          profile_id: validUserId,
          video_url: activeUrl,
          caption: caption,
          title: title,
          description: caption,
          song_title: songTitle,
          band_name: bandName,
          username: username,
          avatar: avatar,
          thumbnail_url: thumbUrl || null,
          duration: 15,
          likes_count: 1,
          comments_count: 0,
          shares_count: 0,
          tags: cleanTags,
          created_at: newClipObj.created_at
        };

        const { data, error: insErr } = await supabaseClient
          .from('clips')
          .insert([payload])
          .select();

        if (!insErr && data && data[0]) {
          console.log('[UploadClipModal] Clip successfully persisted to database:', data[0].id);
          return data[0];
        }

        if (insErr) {
          console.warn('[UploadClipModal] Extended insert failed, trying core columns fallback:', insErr.message);
          const corePayload = {
            id: clipId,
            user_id: validUserId,
            video_url: activeUrl,
            title: title,
            description: caption,
            thumbnail_url: thumbUrl || null,
            likes_count: 1
          };
          const { data: coreData, error: coreErr } = await supabaseClient
            .from('clips')
            .insert([corePayload])
            .select();
          if (!coreErr && coreData && coreData[0]) {
            console.log('[UploadClipModal] Core fallback persisted to database:', coreData[0].id);
            return coreData[0];
          } else if (coreErr) {
            console.error('[UploadClipModal] Core schema fallback error:', coreErr.message);
          }
        }
      } catch (dbErr) {
        console.error('[UploadClipModal] Database insert error:', dbErr);
      }
      return null;
    };

    // If uploading in background, publish immediately to UI and complete storage upload asynchronously
    if (uploadInBackground && selectedClipFile) {
      // Optimistically update local state & localStorage
      setClips((prev) => {
        const updated = [newClipObj, ...prev.filter(c => c.id !== clipId)];
        try {
          localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      setNewClipCaption('');
      if (setNewClipTitle) setNewClipTitle('');
      setNewClipVideoUrl('');
      setSelectedClipFile(null);
      setShowUploadClipModal(false);
      setIsUploadingClip(false);
      triggerNotification?.("🚀 Clip posted! Uploading to clips storage bucket in background...");

      // Execute background storage upload and DB persistence asynchronously
      (async () => {
        try {
          let remoteUrl = '';
          try {
            remoteUrl = await uploadClipVideoFile(selectedClipFile, validUserId, 'clip');
          } catch (storageErr) {
            console.warn('[UploadClipModal] Background storage upload error:', storageErr);
          }

          const permanentUrl = remoteUrl || finalVideoUrl;
          await persistClipToSupabase(permanentUrl);

          if (remoteUrl) {
            // Update local state with permanent Supabase Storage URL
            setClips(prev =>
              prev.map(c =>
                c.id === clipId
                  ? { ...c, video_url: remoteUrl, videoUrl: remoteUrl }
                  : c
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
            triggerNotification?.("✅ Clip uploaded to clips storage bucket and synced globally!");
          }
        } catch (bgErr) {
          console.warn("[UploadClipModal] Background upload completion error:", bgErr);
        }
      })();

      return;
    }

    // Synchronous / Modal Progress Bar Upload
    try {
      setUploadProgress(35);
      setUploadStatusText('Uploading video to clips storage bucket...');

      let remoteUrl = newClipVideoUrl;
      if (selectedClipFile) {
        try {
          remoteUrl = await uploadClipVideoFile(selectedClipFile, validUserId, 'clip');
          setUploadProgress(75);
        } catch (storageErr) {
          console.warn("[UploadClipModal] uploadClipVideoFile error:", storageErr);
        }
      }

      if (remoteUrl) {
        newClipObj.video_url = remoteUrl;
        newClipObj.videoUrl = remoteUrl;
      }

      setUploadProgress(90);
      setUploadStatusText('Saving clip record to database...');

      await persistClipToSupabase(remoteUrl || finalVideoUrl);

      setUploadProgress(100);
      setUploadStatusText('Complete!');

      setClips((prev) => {
        const updated = [newClipObj, ...prev.filter(c => c.id !== clipId)];
        try {
          localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      setNewClipCaption('');
      if (setNewClipTitle) setNewClipTitle('');
      setNewClipVideoUrl('');
      setSelectedClipFile(null);
      setShowUploadClipModal(false);
      triggerNotification?.("Clip published and saved to clips storage successfully!");
    } catch (err: any) {
      console.error("Failed to upload clip:", err);
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
        <motion.div key="modal-backdrop-uploadclipmodal-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-start md:items-center overflow-y-auto p-4 py-8 ">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-[#121214] border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(244,63,94,0.15)] flex flex-col max-h-[85vh] my-auto"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40 shrink-0">
            <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 font-display">
              <PlaySquare className="w-4 h-4 text-rose-400" /> New Reel Clip
            </span>
            <button
              onClick={() => setShowUploadClipModal(false)}
              className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 flex flex-col space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            <div className="w-full flex flex-col gap-4">
              {newClipVideoUrl ? (
                <div
                  className="w-full relative rounded-xl overflow-hidden bg-black flex items-center justify-center border border-zinc-700"
                  style={{ height: '240px' }}
                >
                  <video src={newClipVideoUrl} className="w-full h-full object-contain" controls autoPlay loop playsInline />
                  <button
                    onClick={() => {
                      setNewClipVideoUrl('');
                      setSelectedClipFile(null);
                    }}
                    className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-full hover:bg-rose-500/80 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
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
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedClipFile(file);
                            setNewClipVideoUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">MP4, MOV, or WEBM up to 100MB</p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Or paste video URL..."
                      value={newClipVideoUrl}
                      onChange={(e) => setNewClipVideoUrl(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* Caption & Metadata Inputs */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                    CAPTION & PIT NOTES
                  </label>
                  <textarea
                    placeholder="Add a caption..."
                    value={newClipCaption}
                    onChange={(e) => setNewClipCaption(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 h-20 resize-none"
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

                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                    GENRE TAGS (COMMA SEPARATED)
                  </label>
                  <input
                    type="text"
                    placeholder="SLAM, TECHNICAL DEATH, LIVE"
                    value={newClipTags}
                    onChange={(e) => setNewClipTags(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Background Upload Toggle */}
              <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800 rounded-xl px-3 py-2.5 mt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="uploadInBackground"
                    checked={uploadInBackground}
                    onChange={(e) => setUploadInBackground(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-0 cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="uploadInBackground" className="text-xs text-zinc-300 font-medium cursor-pointer">
                    Upload in background (post instantly)
                  </label>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">Fast publish</span>
              </div>

              {/* Upload Progress Bar (when uploading synchronously) */}
              {isUploadingClip && !uploadInBackground && (
                <div className="space-y-1.5 mt-3">
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

              {/* Submit Button */}
              <button
                onClick={handlePostClip}
                disabled={isUploadingClip}
                className={`w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-colors mt-4 shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer ${
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
