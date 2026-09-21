import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { requestPauseSceneRadio } from './utils/mediaPlaybackCoordinator';
import {
  ArrowRight,
  PlayCircle,
  User,
  Music,
  Heart,
  MessageSquare,
  Repeat,
  Share2,
  Trash2,
  Disc,
  Plus,
  Activity,
  X,
  PlaySquare,
  Upload,
  Sparkles,
  Info,
  Send,
  Eye,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { uploadClipVideoFile } from '../../supabase';
import { UploadClipModal } from './modals/UploadClipModal';
import {
  saveClipMediaBlob,
  generateVideoThumbnail,
  resolveClipVideoPlaybackUrl,
  trackRealClipView,
  calculateClipsDashboardStats
} from './utils/clipsPersistenceService';

interface ClipItem {
  id: any;
  creator: string;
  role: string;
  avatar: string;
  caption: string;
  title?: string;
  videoUrl: string;
  likes: number;
  comments: number;
  shares: number;
  reposts: number;
  views: number;
  audio: string;
  hasLiked: boolean;
  thumbnailUrl?: string;
  created_at?: string;
  user_id?: string;
  isFollowed?: boolean;
}

interface ClipsViewProps {
  userProfile?: any;
  clips?: ClipItem[];
  setClips?: React.Dispatch<React.SetStateAction<ClipItem[]>>;
  triggerNotification?: (msg: string) => void;
  setActiveTab?: (tab: any) => void;
  portalRole?: string;
  deleteClip?: (id: any) => Promise<void>;
  getSupabase?: () => any;
  onSelectProfile?: (userPayload: any) => void;
}

const DEFAULT_CLIPS: ClipItem[] = [
  {
    id: 'c1',
    creator: 'Dying Fetus',
    role: '💀 Band',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100',
    caption: 'Live breakdown in Montreal! Technical slam riffs in full force. 🔥 #DyingFetus #DeathMetal',
    videoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
    likes: 1420,
    comments: 89,
    shares: 210,
    reposts: 45,
    views: 8900,
    audio: 'Dying Fetus - Grotesque Impalement (Live)',
    hasLiked: false,
    isFollowed: false,
  },
  {
    id: 'c2',
    creator: 'Goregrind_Official',
    role: '💀 Band',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    caption: 'New drum playthrough teaser! Pitch shifted vocal gargles and gravity blasts. 🥁',
    videoUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    likes: 980,
    comments: 42,
    shares: 112,
    reposts: 28,
    views: 4500,
    audio: 'Goregrind - Masticated Tissue (Teaser)',
    hasLiked: true,
    isFollowed: true,
  },
];

export const ClipsView: React.FC<ClipsViewProps> = ({
  userProfile,
  clips: propClips,
  setClips: propSetClips,
  triggerNotification,
  setActiveTab,
  portalRole,
  deleteClip,
  getSupabase,
  onSelectProfile,
}) => {
  const [internalClips, setInternalClips] = useState<ClipItem[]>(DEFAULT_CLIPS);
  const clips = propClips && propClips.length > 0 ? propClips : internalClips;
  const setClips = propSetClips || setInternalClips;

  // Modals & Drawers inside Clips view
  const [showUploadClipModal, setShowUploadClipModal] = useState(false);
  const [showClipsAnalyticsModal, setShowClipsAnalyticsModal] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);
  const [activeClipComments, setActiveClipComments] = useState<any | null>(null);
  const [activeClipShare, setActiveClipShare] = useState<any | null>(null);
  const [activeClipMetrics, setActiveClipMetrics] = useState<any | null>(null);

  // New clip form states
  const [newClipVideoUrl, setNewClipVideoUrl] = useState('');
  const [selectedClipFile, setSelectedClipFile] = useState<File | null>(null);
  const [shouldCompressClip, setShouldCompressClip] = useState(true);
  const [newClipCaption, setNewClipCaption] = useState('');
  const [newClipSong, setNewClipSong] = useState('Original Audio');
  const [isUploadingClip, setIsUploadingClip] = useState(false);

  // Comment input
  const [commentInput, setCommentInput] = useState('');
  const [clipCommentsList, setClipCommentsList] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>({
    c1: [
      { id: 'cc1', author: 'DeathMetalFan99', text: 'That blast beat section was unbelievable!', time: '10m ago' },
      { id: 'cc2', author: 'SlamLord', text: 'Heavy as hell! 🔥', time: '5m ago' }
    ]
  });

  const handleLikeClip = (clipId: any) => {
    setClips((prev) => {
      const updated = prev.map((c) => {
        if (c.id === clipId) {
          const nextHasLiked = !c.hasLiked;
          const nextLikesCount = nextHasLiked ? c.likes + 1 : Math.max(0, c.likes - 1);
          if (!c.hasLiked) triggerNotification?.("Liked clip!");
          return { ...c, hasLiked: nextHasLiked, likes: nextLikesCount, likes_count: nextLikesCount };
        }
        return c;
      });
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const client = getSupabase ? getSupabase() : null;
    if (client && typeof clipId === 'string') {
      try {
        client.from('clips').select('likes_count').eq('id', clipId).maybeSingle().then(({ data }: any) => {
          if (data) {
            client.from('clips').update({ likes_count: (data.likes_count || 0) + 1 }).eq('id', clipId).then();
          }
        });
      } catch (_) {}
    }
  };

  const handleAddComment = (clipId: any) => {
    if (!commentInput.trim()) return;
    const newComm = {
      id: `cc_${Date.now()}`,
      author: userProfile?.name || 'Fan',
      text: commentInput,
      time: 'Just now'
    };
    setClipCommentsList(prev => ({
      ...prev,
      [clipId]: [...(prev[clipId] || []), newComm]
    }));
    setClips(prev => {
      const updated = prev.map(c => c.id === clipId ? { ...c, comments: c.comments + 1, comments_count: (c.comments || 0) + 1 } : c);
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });

    const client = getSupabase ? getSupabase() : null;
    if (client && typeof clipId === 'string') {
      try {
        client.from('clips').select('comments_count').eq('id', clipId).maybeSingle().then(({ data }: any) => {
          if (data) {
            client.from('clips').update({ comments_count: (data.comments_count || 0) + 1 }).eq('id', clipId).then();
          }
        });
      } catch (_) {}
    }

    setCommentInput('');
    triggerNotification?.("Comment added to clip!");
  };

  const handleCreateClip = async () => {
    if (!newClipVideoUrl && !selectedClipFile) {
      triggerNotification?.("Please provide a video URL or select a clip file.");
      return;
    }

    setIsUploadingClip(true);
    try {
      let finalVideoUrl = newClipVideoUrl;
      const supabaseClient = getSupabase ? getSupabase() : null;
      const userId = userProfile?.id || userProfile?.user_id || 'anon';

      if (selectedClipFile) {
        // Upload to 'clips' storage bucket in Supabase
        try {
          finalVideoUrl = await uploadClipVideoFile(selectedClipFile, userId, 'clip');
        } catch (storageErr) {
          console.warn("[ClipsView] uploadClipVideoFile error:", storageErr);
        }

        // Direct fallback to 'photo-pit' and 'clips' buckets if needed
        if (!finalVideoUrl && supabaseClient) {
          const fileExt = selectedClipFile.name.split('.').pop() || 'mp4';
          const fileName = `${userId}_${Date.now()}.${fileExt}`;
          for (const b of ['photo-pit', 'clips']) {
            try {
              const { data, error } = await supabaseClient.storage.from(b).upload(fileName, selectedClipFile, {
                upsert: true,
                contentType: selectedClipFile.type || 'video/mp4'
              });

              if (!error && data) {
                const { data: publicData } = supabaseClient.storage.from(b).getPublicUrl(fileName);
                if (publicData?.publicUrl) {
                  finalVideoUrl = publicData.publicUrl;
                  break;
                }
              }
            } catch (directErr) {
              console.warn(`[ClipsView] Direct storage upload to ${b} failed:`, directErr);
            }
          }
        }

        if (!finalVideoUrl) {
          console.warn("Storage upload failed, fallback to local object URL");
          finalVideoUrl = URL.createObjectURL(selectedClipFile);
        }
      }

      if (!finalVideoUrl) {
        finalVideoUrl = 'https://assets.mixkit.co/videos/preview/mixkit-rock-band-performing-on-stage-41584-large.mp4';
      }

      const clipId = `clip_${Date.now()}`;

      let thumbUrl = '';
      if (selectedClipFile) {
        await saveClipMediaBlob(clipId, selectedClipFile);
        try {
          thumbUrl = await generateVideoThumbnail(selectedClipFile);
        } catch (_) {}
      }

      const newClipItem: ClipItem = {
        id: clipId,
        creator: userProfile?.name || userProfile?.username || 'Pro Creator',
        role: portalRole === 'band' ? '💀 Band' : 'Member',
        avatar: userProfile?.avatar || userProfile?.avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
        caption: newClipCaption || 'Check out my new reel clip!',
        title: newClipCaption || 'Live Clip',
        videoUrl: finalVideoUrl,
        thumbnailUrl: thumbUrl,
        likes: 1,
        comments: 0,
        shares: 0,
        reposts: 0,
        views: 1,
        audio: newClipSong || 'Original Sound',
        hasLiked: true,
        user_id: userProfile?.id || userProfile?.user_id,
        created_at: new Date().toISOString()
      };

      // Persist to Supabase database ('clips' and 'nexus_clips' tables)
      if (supabaseClient) {
        try {
          const { error: clipsErr } = await supabaseClient.from('clips').insert([{
            id: clipId,
            user_id: newClipItem.user_id,
            video_url: finalVideoUrl,
            caption: newClipItem.caption,
            title: newClipItem.title,
            description: newClipItem.caption || newClipItem.title,
            song_title: newClipSong || 'Original Sound',
            band_name: userProfile?.name || userProfile?.username || 'Scene Band',
            username: userProfile?.name || userProfile?.username || 'Anonymous',
            avatar: newClipItem.avatar,
            created_at: newClipItem.created_at,
            likes_count: 1,
            comments_count: 0,
            shares_count: 0
          }]);
          if (clipsErr) {
            console.warn("Saving to 'clips' with extended columns failed, trying core schema fallback:", clipsErr.message);
            await supabaseClient.from('clips').insert([{
              video_url: finalVideoUrl,
              title: newClipItem.title,
              description: newClipItem.caption || newClipItem.title,
              thumbnail_url: thumbUrl,
              likes_count: 1
            }]);
          }
        } catch (_) {}

        try {
          await supabaseClient.from('nexus_clips').insert([{
            id: clipId,
            profile_id: newClipItem.user_id,
            user_id: newClipItem.user_id,
            username: newClipItem.creator,
            avatar: newClipItem.avatar,
            video_url: finalVideoUrl,
            caption: newClipItem.caption,
            song_title: newClipSong || 'Original Sound',
            band_name: userProfile?.name || 'Scene Band',
            created_at: newClipItem.created_at
          }]);
        } catch (_) {}
      }

      // Update state and localStorage
      setClips(prev => {
        const updated = [newClipItem, ...prev.filter(c => c.id !== clipId)];
        try {
          localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });

      setShowUploadClipModal(false);
      setNewClipVideoUrl('');
      setSelectedClipFile(null);
      setNewClipCaption('');
      triggerNotification?.("⚡ Video clip uploaded and saved to clips storage!");
    } catch (err: any) {
      console.error("Failed to upload clip in ClipsView:", err);
      triggerNotification?.(`Error posting clip: ${err.message || err}`);
    } finally {
      setIsUploadingClip(false);
    }
  };

  return (
    <div className="w-full bg-[#030303] flex flex-col items-center animate-in fade-in duration-300">
      {/* Top Bar Action Controls for Reels */}
      <div className="w-full max-w-[480px] flex items-center justify-between px-3 py-2 bg-zinc-950/80 border border-zinc-900 rounded-xl mb-3 shadow-lg">
        <button
          onClick={() => {
            if (setActiveTab) setActiveTab('feed');
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0"
          title="Back to Feed"
        >
          <ArrowRight className="w-4 h-4 text-zinc-400 rotate-180" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadClipModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 hover:text-rose-300 rounded-xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-rose-500" />
            <span>Add Clip</span>
          </button>
          <button
            onClick={() => setShowClipsAnalyticsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all font-black text-xs uppercase tracking-wider cursor-pointer shrink-0"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Reels Container */}
      <div className="w-full max-w-[480px] h-[calc(100vh-140px)] max-h-[900px] relative bg-black sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col snap-y snap-mandatory overflow-y-scroll no-scrollbar mb-8 border border-zinc-900">
        {/* Clips Loop */}
        {clips.map((clip, cIdx) => (
          <div
            key={clip.id ? `clip-${clip.id}-${cIdx}` : `clip-${cIdx}`}
            className="h-full w-full shrink-0 snap-start snap-always relative flex items-center justify-center bg-zinc-950/80 border-b border-zinc-900 group"
          >
            {/* Video Placeholder or Player */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black overflow-hidden">
              {clip.videoUrl && !clip.videoUrl.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                <video
                  src={clip.videoUrl}
                  poster={clip.thumbnailUrl || undefined}
                  className="w-full h-full object-cover opacity-80"
                  autoPlay
                  loop
                  playsInline
                  controls
                  onPlay={() => {
                    requestPauseSceneRadio('clips_video_play');
                    trackRealClipView(clip.id, clip.views, (newViews) => {
                      setClips(prev => prev.map(c => c.id === clip.id ? { ...c, views: newViews } : c));
                    });
                  }}
                  onError={async (e) => {
                    const el = e.currentTarget;
                    const fallback = await resolveClipVideoPlaybackUrl(clip.id, clip.videoUrl);
                    if (el.src !== fallback) {
                      el.src = fallback;
                      el.load();
                      el.play().catch(() => {});
                    }
                  }}
                />
              ) : (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
                    style={{ backgroundImage: `url('${clip.videoUrl}')` }}
                  />
                  <PlayCircle
                    className="w-20 h-20 text-white/20 group-hover:text-white/40 transition-colors cursor-pointer"
                    onClick={() => triggerNotification?.("Video played")}
                  />
                </>
              )}
            </div>

            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex items-end justify-between">
              <div className="flex-1 max-w-[80%] pr-4">
                <div
                  className="flex items-center gap-3 mb-3 cursor-pointer"
                  onClick={() => {
                    const profilePayload = {
                      id: (clip as any).creator_id || clip.user_id,
                      name: clip.creator,
                      avatar: clip?.avatar,
                      role: clip?.role || "Member",
                      isYou: clip.creator === userProfile?.name,
                    };
                    if (onSelectProfile) {
                      onSelectProfile(profilePayload);
                    } else {
                      window.dispatchEvent(
                        new CustomEvent('openPublicProfile', {
                          detail: profilePayload,
                        })
                      );
                    }
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-zinc-800 border-2 border-rose-500 overflow-hidden flex items-center justify-center shadow-[0_0_10px_#f43f5e]">
                    {clip?.avatar ? (
                      <img src={clip?.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <User className="w-5 h-5 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-white drop-shadow-md hover:underline">{clip.creator}</span>
                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">{clip?.role || "Member"}</span>
                  </div>
                  <button
                    className={`text-[10px] border px-3 py-1 rounded-full font-bold uppercase transition-colors ml-2 ${
                      clip.isFollowed ? 'bg-white text-black border-white' : 'border-white/40 hover:bg-white hover:text-black text-white'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!clip.isFollowed) {
                        triggerNotification?.(`Followed ${clip.creator}`);
                        setClips((prev) =>
                          prev.map((c) => (c.id === clip.id ? { ...c, isFollowed: true } : c))
                        );
                      }
                    }}
                  >
                    {clip.isFollowed ? 'Followed' : 'Follow'}
                  </button>
                </div>
                <p className="text-sm text-zinc-100 drop-shadow-md leading-snug">{clip.caption.replace(/#\w+/g, '').trim()}</p>

                {/* View Metrics / Reactions Link */}
                <div
                  className="mt-2 text-[10px] font-bold text-zinc-300 flex items-center gap-2 cursor-pointer hover:text-white group/metrics"
                  onClick={() => setActiveClipMetrics(clip.id)}
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="group-hover/metrics:underline decoration-white/50 underline-offset-2">See who viewed & reacted</span>
                </div>

                <div className="mt-3 text-xs text-zinc-300 flex items-center gap-2 font-mono bg-black/40 inline-flex px-3 py-1.5 rounded-full border border-white/10">
                  <Music className="w-3.5 h-3.5 text-rose-400" /> {clip.audio}
                </div>
              </div>

              {/* Actions Column */}
              <div className="flex flex-col items-center gap-4 pb-2">
                <button
                  onClick={() => handleLikeClip(clip.id)}
                  className="flex flex-col items-center gap-1 group/btn"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md group-hover/btn:scale-110 transition-all ${
                      clip.hasLiked ? 'bg-rose-500/20 border-rose-500' : 'bg-black/40 border-zinc-700 group-hover/btn:bg-zinc-800'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 transition-colors ${
                        clip.hasLiked ? 'text-rose-500 fill-rose-500' : 'text-white group-hover/btn:text-rose-500'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">{clip.likes.toLocaleString()}</span>
                </button>

                <button
                  onClick={() => setActiveClipComments(clip.id)}
                  className="flex flex-col items-center gap-1 group/btn"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-zinc-700 backdrop-blur-md group-hover/btn:bg-zinc-800 transition-colors">
                    <MessageSquare className="w-5 h-5 text-white group-hover/btn:text-cyan-400 group-hover/btn:scale-110 transition-all" />
                  </div>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">{clip.comments.toLocaleString()}</span>
                </button>

                <button
                  onClick={() => {
                    setClips((prev) =>
                      prev.map((c) => (c.id === clip.id ? { ...c, reposts: (c.reposts || 0) + 1 } : c))
                    );
                    triggerNotification?.("Reposted to your feed!");
                  }}
                  className="flex flex-col items-center gap-1 group/btn"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-zinc-700 backdrop-blur-md group-hover/btn:bg-zinc-800 transition-colors">
                    <Repeat className="w-5 h-5 text-white group-hover/btn:text-emerald-400 group-hover/btn:scale-110 transition-all" />
                  </div>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">{clip.reposts?.toLocaleString() || '0'}</span>
                </button>

                <button
                  onClick={() => setActiveClipShare(clip.id)}
                  className="flex flex-col items-center gap-1 group/btn"
                >
                  <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center border border-zinc-700 backdrop-blur-md group-hover/btn:bg-zinc-800 transition-colors">
                    <Share2 className="w-5 h-5 text-white group-hover/btn:text-cyan-400 group-hover/btn:scale-110 transition-all" />
                  </div>
                  <span className="text-[10px] font-bold text-white drop-shadow-md">{clip.shares?.toLocaleString() || '0'}</span>
                </button>

                {clip.user_id === userProfile?.id && (
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to permanently delete this clip?")) {
                        if (deleteClip) {
                          await deleteClip(clip.id);
                        } else {
                          setClips((prev) => prev.filter((c) => c.id !== clip.id));
                        }
                      }
                    }}
                    className="flex flex-col items-center gap-1 group/btn mt-1 text-rose-500 hover:text-rose-400 cursor-pointer"
                    title="Delete clip"
                  >
                    <div className="w-10 h-10 rounded-full bg-rose-950/40 hover:bg-rose-900 border border-rose-900 flex items-center justify-center backdrop-blur-md group-hover/btn:scale-110 transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold drop-shadow-md text-rose-400">Delete</span>
                  </button>
                )}

                <button
                  onClick={() => setShowSongModal(true)}
                  className="flex flex-col items-center gap-1 mt-2 cursor-pointer group/disc"
                  title="Use this audio"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-800 border-2 border-rose-500/50 animate-[spin_6s_linear_infinite] group-hover/disc:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] group-hover/disc:shadow-[0_0_20px_rgba(244,63,94,0.6)] flex items-center justify-center overflow-hidden transition-all">
                    <Disc className="w-6 h-6 text-rose-400 group-hover/disc:text-white transition-colors" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD CLIP MODAL */}
      <UploadClipModal
        showUploadClipModal={showUploadClipModal}
        setShowUploadClipModal={setShowUploadClipModal}
        newClipVideoUrl={newClipVideoUrl}
        setNewClipVideoUrl={setNewClipVideoUrl}
        selectedClipFile={selectedClipFile}
        setSelectedClipFile={setSelectedClipFile}
        newClipCaption={newClipCaption}
        setNewClipCaption={setNewClipCaption}
        newClipSongTitle={newClipSong}
        setNewClipSongTitle={setNewClipSong}
        newClipBandName={userProfile?.band_name || userProfile?.name || ''}
        setNewClipBandName={() => {}}
        newClipTags="SLAM, LIVE, DEATHCORE"
        setNewClipTags={() => {}}
        setClips={setClips}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
      />

      {/* CLIPS COMMENTS DRAWER */}
      <AnimatePresence>
        {activeClipComments && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-end md:items-center p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-[#121214] border border-zinc-900 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-900">
                <span className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Clip Comments
                </span>
                <button onClick={() => setActiveClipComments(null)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                {(clipCommentsList[activeClipComments] || []).map((comm, commIdx) => (
                  <div key={comm.id ? `comm-${comm.id}-${commIdx}` : `comm-${commIdx}`} className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-rose-400">{comm.author}</span>
                      <span className="text-zinc-600 font-mono">{comm.time}</span>
                    </div>
                    <p className="text-xs text-zinc-200">{comm.text}</p>
                  </div>
                ))}
                {(!clipCommentsList[activeClipComments] || clipCommentsList[activeClipComments].length === 0) && (
                  <p className="text-center text-xs text-zinc-600 py-6">No comments yet. Be the first to reply!</p>
                )}
              </div>

              <div className="p-3 border-t border-zinc-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(activeClipComments); }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <button
                  onClick={() => handleAddComment(activeClipComments)}
                  className="bg-rose-600 hover:bg-rose-500 text-white px-4 rounded-xl text-xs font-bold uppercase transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIPS ANALYTICS DASHBOARD MODAL */}
      <AnimatePresence>
        {showClipsAnalyticsModal && (() => {
          const stats = calculateClipsDashboardStats(clips, userProfile?.id);
          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#121214] border border-emerald-900/40 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-[0_0_40px_rgba(52,211,153,0.1)]"
              >
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <span className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> Clips Performance & Engagement
                  </span>
                  <button onClick={() => setShowClipsAnalyticsModal(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Total Reel Views</span>
                    <p className="text-xl font-black text-white mt-1">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Avg Engagement Rate</span>
                    <p className="text-xl font-black text-emerald-400 mt-1">{stats.avgEngagementRate}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Total Likes</span>
                    <p className="text-xl font-black text-rose-400 mt-1">{stats.totalLikes.toLocaleString()}</p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Shares & Reposts</span>
                    <p className="text-xl font-black text-cyan-400 mt-1">{stats.totalShares.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setShowClipsAnalyticsModal(false)}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold uppercase transition-colors"
                  >
                    Close Dashboard
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ATTACH SONG / AUDIO SELECTION MODAL */}
      <AnimatePresence>
        {showSongModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121214] border border-rose-900/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 bg-zinc-950/40">
                <span className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5 font-display">
                  <Music className="w-4 h-4 text-rose-400" /> Select Scene Audio For Reel
                </span>
                <button
                  onClick={() => setShowSongModal(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900/50 cursor-pointer transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-zinc-400 font-sans">
                  Select a trending scene track or original audio stem to attach to your Clip reel:
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {[
                    { id: '1', title: 'Voracious Cleansing', band: 'Infestment', duration: '3:45' },
                    { id: '2', title: 'Hammer Smashed Face', band: 'Cannibal Corpse', duration: '4:02' },
                    { id: '3', title: 'Scourge of Iron', band: 'Cannibal Corpse', duration: '4:44' },
                    { id: '4', title: 'Close to a World Below', band: 'Immolation', duration: '5:12' },
                    { id: '5', title: 'Grotesque Impalement', band: 'Dying Fetus', duration: '4:26' },
                  ].map((track, trkIdx) => (
                    <div
                      key={track.id ? `trk-${track.id}-${trkIdx}` : `trk-${trkIdx}`}
                      onClick={() => {
                        triggerNotification?.(`Audio "${track.title}" attached to Clip reel!`);
                        setShowSongModal(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-900/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          ♫
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">{track.title}</h5>
                          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide truncate">{track.band}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{track.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClipsView;
