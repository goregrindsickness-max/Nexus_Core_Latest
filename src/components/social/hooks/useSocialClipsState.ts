import { useState, useEffect } from 'react';
import { getSupabase } from '../../../supabase';
import { reviveClipsArray, clipsMediaStore } from '../utils/clipsPersistenceService';

export interface UseSocialClipsStateParams {
  triggerNotification?: (msg: string) => void;
}

export function useSocialClipsState({ triggerNotification }: UseSocialClipsStateParams) {
  const [clips, setClips] = useState<{
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
    bandName?: string;
    songTitle?: string;
    tags?: string[];
  }[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_saved_clips');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}
    return [];
  });

  const [showUploadClipModal, setShowUploadClipModal] = useState(false);
  const [newClipCaption, setNewClipCaption] = useState('');
  const [newClipVideoUrl, setNewClipVideoUrl] = useState('');
  const [selectedClipFile, setSelectedClipFile] = useState<File | null>(null);
  const [newClipTitle, setNewClipTitle] = useState('');
  const [isUploadingClip, setIsUploadingClip] = useState(false);
  const [selectedClipThumbnailFile, setSelectedClipThumbnailFile] = useState<File | null>(null);
  const [newClipThumbnailUrl, setNewClipThumbnailUrl] = useState('');
  const [clipDuration, setClipDuration] = useState<number>(15);
  const [compressionProgress, setCompressionProgress] = useState<number | null>(null);
  const [isCompressingClip, setIsCompressingClip] = useState(false);
  const [shouldCompressClip, setShouldCompressClip] = useState(false);

  const [newClipSongTitle, setNewClipSongTitle] = useState('');
  const [newClipBandName, setNewClipBandName] = useState('');
  const [newClipTags, setNewClipTags] = useState('');

  const [showClipsAnalyticsModal, setShowClipsAnalyticsModal] = useState(false);
  const [showMyClipsModal, setShowMyClipsModal] = useState(false);
  const [activeClipComments, setActiveClipComments] = useState<number | null>(null);
  const [activeClipShare, setActiveClipShare] = useState<number | null>(null);
  const [activeClipMetrics, setActiveClipMetrics] = useState<number | null>(null);
  const [newClipCommentText, setNewClipCommentText] = useState('');

  const compressVideoFile = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      resolve(file);
    });
  };

  const deleteClip = async (clipId: string | number) => {
    const idStr = String(clipId).trim();
    setClips(prev => {
      const updated = prev.filter(c => String(c.id).trim().toLowerCase() !== idStr.toLowerCase());
      try {
        localStorage.setItem('nexus_saved_clips', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    try {
      await clipsMediaStore.removeItem(`clip_media_${idStr.toLowerCase()}`);
      await clipsMediaStore.removeItem(`clip_media_${idStr}`);
      await clipsMediaStore.removeItem(idStr.toLowerCase());
      await clipsMediaStore.removeItem(idStr);
    } catch (_) {}
    triggerNotification?.("Clip deleted successfully!");
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      try {
        await supabaseClient.from('clips').delete().eq('id', clipId);
      } catch (err) {
        console.error("Failed to delete clip from database:", err);
      }
    }
  };

  // Load and revive clips from Supabase and IndexedDB on mount
  useEffect(() => {
    let isMounted = true;

    // Initial revival of cached local clips
    const initLocalClips = async () => {
      try {
        const saved = localStorage.getItem('nexus_saved_clips');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const revived = await reviveClipsArray(parsed);
            if (isMounted) {
              setClips(revived);
            }
          }
        }
      } catch (_) {}
    };
    initLocalClips();

    const fetchClips = async () => {
      const supabaseClient = getSupabase();
      if (!supabaseClient) return;

      try {
        let dbClips: any[] = [];
        
        // 1. Fetch from 'clips' table
        try {
          const { data: cData, error: cErr } = await supabaseClient
            .from('clips')
            .select('*')
            .order('created_at', { ascending: false });
          if (!cErr && cData && cData.length > 0) {
            dbClips = cData;
          }
        } catch (_) {}

        // 2. Fallback or merge with 'nexus_clips' table
        try {
          const { data: ncData, error: ncErr } = await supabaseClient
            .from('nexus_clips')
            .select('*')
            .order('created_at', { ascending: false });
          if (!ncErr && ncData && ncData.length > 0) {
            const existingIds = new Set(dbClips.map((c: any) => c.id));
            const uniqueNc = ncData.filter((c: any) => !existingIds.has(c.id));
            dbClips = [...dbClips, ...uniqueNc];
          }
        } catch (_) {}

        if (dbClips && dbClips.length > 0) {
          const userIds = Array.from(new Set(dbClips.map((c: any) => c.user_id || c.profile_id).filter(Boolean)));
          const profilesMap: { [key: string]: any } = {};

          if (userIds.length > 0) {
            const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
            const cleanUserIds = userIds.filter(isValidUUID);
            if (cleanUserIds.length > 0) {
              const { data: profiles } = await supabaseClient
                .from('profiles')
                .select('id, full_name, console_handle, avatar_url, account_type, creative_avatar, promoter_logo, role_badge')
                .in('id', cleanUserIds);

              if (profiles) {
                profiles.forEach((p: any) => {
                  profilesMap[p.id] = p;
                });
              }
            }
          }

          const mappedClips = dbClips.map((clip: any) => {
            const userId = clip.user_id || clip.profile_id;
            const creatorProfile = profilesMap[userId];
            
            const creatorName = clip.username || clip.creator || clip.band_name || (creatorProfile 
              ? (creatorProfile.name || creatorProfile.full_name || 'Anonymous Creator') 
              : 'Anonymous Creator');

            const creatorAvatar = clip.avatar || clip.avatar_url || (creatorProfile 
              ? (creatorProfile.avatar_url || creatorProfile.label_avatar || creatorProfile.creative_avatar || creatorProfile.promoter_logo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80') 
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80');

            const role = creatorProfile 
              ? (creatorProfile.role_badge || creatorProfile.account_type || 'Operator') 
              : (clip.band_name ? '💀 Band' : 'Operator');

            const videoUrl = clip.video_url || clip.videoUrl || clip.url || '';
            const caption = clip.caption || clip.description || clip.title || '';
            const songTitle = clip.song_title || clip.songTitle || clip.audio || 'Original Audio';
            const bandName = clip.band_name || clip.bandName || creatorName;

            return {
              id: clip.id,
              creator: creatorName,
              role: role,
              avatar: creatorAvatar,
              caption: caption,
              title: clip.title || caption || 'Live Clip',
              videoUrl: videoUrl,
              video_url: videoUrl,
              thumbnailUrl: clip.thumbnail_url || clip.thumbnailUrl || '',
              thumbnail_url: clip.thumbnail_url || clip.thumbnailUrl || '',
              likes: clip.likes_count || clip.likes || 0,
              likes_count: clip.likes_count || clip.likes || 0,
              comments: clip.comments_count || clip.comments || 0,
              comments_count: clip.comments_count || clip.comments || 0,
              shares: clip.shares_count || clip.shares || 0,
              shares_count: clip.shares_count || clip.shares || 0,
              reposts: 0,
              views: clip.views_count || clip.views || 0,
              views_count: clip.views_count || clip.views || 0,
              audio: songTitle ? `${bandName} - ${songTitle}` : `Original Audio - ${creatorName}`,
              songTitle: songTitle,
              bandName: bandName,
              tags: clip.tags || ['SLAM', 'LIVE'],
              hasLiked: false,
              created_at: clip.created_at,
              user_id: userId
            };
          });

          // Revive all video URLs ensuring IndexedDB binaries and valid sources
          const revivedMapped = await reviveClipsArray(mappedClips);

          if (isMounted) {
            setClips(prev => {
              // Also check localStorage in case prev was empty during initial parallel mount
              let localCached: any[] = [];
              try {
                const raw = localStorage.getItem('nexus_saved_clips');
                if (raw) localCached = JSON.parse(raw);
              } catch (_) {}

              const existingClips = [...prev, ...localCached];
              const existingMap = new Map<string, any>();
              existingClips.forEach(c => {
                if (c && c.id) {
                  existingMap.set(String(c.id).toLowerCase(), c);
                }
              });

              const dbIds = new Set(revivedMapped.map(c => String(c.id).toLowerCase()));

              // Preserve interaction states (likes, hasLiked, views) and local video URLs
              const mergedDbClips = revivedMapped.map(dbClip => {
                const local = existingMap.get(String(dbClip.id).toLowerCase());
                if (!local) return dbClip;
                return {
                  ...dbClip,
                  hasLiked: local.hasLiked !== undefined ? local.hasLiked : dbClip.hasLiked,
                  likes: Math.max(Number(local.likes) || 0, Number(dbClip.likes) || 0),
                  likes_count: Math.max(Number(local.likes_count) || 0, Number(dbClip.likes_count) || 0),
                  views: Math.max(Number(local.views) || 0, Number(dbClip.views) || 0),
                  views_count: Math.max(Number(local.views_count) || 0, Number(dbClip.views_count) || 0),
                  comments: Math.max(Number(local.comments) || 0, Number(dbClip.comments) || 0),
                  videoUrl: (dbClip.videoUrl && !dbClip.videoUrl.startsWith('blob:') && dbClip.videoUrl.startsWith('http'))
                    ? dbClip.videoUrl
                    : (local?.videoUrl && !local.videoUrl.startsWith('blob:') ? local.videoUrl : dbClip.videoUrl),
                  video_url: (dbClip.video_url && !dbClip.video_url.startsWith('blob:') && dbClip.video_url.startsWith('http'))
                    ? dbClip.video_url
                    : (local?.video_url && !local.video_url.startsWith('blob:') ? local.video_url : dbClip.video_url),
                };
              });

              // Retain any clips present locally that haven't synced to DB yet
              const localOnly: any[] = [];
              const seenLocal = new Set<string>();
              existingClips.forEach(c => {
                const cId = String(c?.id || '').toLowerCase();
                if (cId && !dbIds.has(cId) && !seenLocal.has(cId)) {
                  seenLocal.add(cId);
                  localOnly.push(c);
                }
              });

              const merged = [...mergedDbClips, ...localOnly];
              try {
                localStorage.setItem('nexus_saved_clips', JSON.stringify(merged));
              } catch (_) {}
              return merged;
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch clips from Supabase:", err);
      }
    };
    fetchClips();

    // Subscribe to realtime database changes for app-wide synchronization
    let channel: any = null;
    const client = getSupabase();
    if (client) {
      try {
        channel = client
          .channel('public:clips:appwide')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'clips' }, () => {
            fetchClips();
          })
          .subscribe();
      } catch (_) {}
    }

    return () => {
      isMounted = false;
      if (channel && client) {
        try {
          client.removeChannel(channel);
        } catch (_) {}
      }
    };
  }, []);

  return {
    clips,
    setClips,
    showUploadClipModal,
    setShowUploadClipModal,
    newClipCaption,
    setNewClipCaption,
    newClipVideoUrl,
    setNewClipVideoUrl,
    selectedClipFile,
    setSelectedClipFile,
    newClipTitle,
    setNewClipTitle,
    isUploadingClip,
    setIsUploadingClip,
    selectedClipThumbnailFile,
    setSelectedClipThumbnailFile,
    newClipThumbnailUrl,
    setNewClipThumbnailUrl,
    clipDuration,
    setClipDuration,
    compressionProgress,
    setCompressionProgress,
    isCompressingClip,
    setIsCompressingClip,
    shouldCompressClip,
    setShouldCompressClip,
    newClipSongTitle,
    setNewClipSongTitle,
    newClipBandName,
    setNewClipBandName,
    newClipTags,
    setNewClipTags,
    showClipsAnalyticsModal,
    setShowClipsAnalyticsModal,
    showMyClipsModal,
    setShowMyClipsModal,
    activeClipComments,
    setActiveClipComments,
    activeClipShare,
    setActiveClipShare,
    activeClipMetrics,
    setActiveClipMetrics,
    newClipCommentText,
    setNewClipCommentText,
    compressVideoFile,
    deleteClip
  };
}
