import { useState, useRef, useEffect } from 'react';
import type { FeedItem } from '../../../data/socialFeedMockData';
import { mockFeed } from '../../../data/socialFeedMockData';
import { getSupabase, uploadBase64ToStorage, createShopMerchItem } from '../../../supabase';
import { isAudioUrl, extractUUID } from '../../../utils/socialFeedUtils';
import { registerCommunityEvent } from '../../../utils/communityEventUtils';
import { syncPostToSupabase } from '../utils/postSyncUtils';
import { resolveActivePersona } from '../utils/personaResolution';
import { savePostReaction } from '../utils/reactionStore';
import { getCurrentCoordinates } from '../../../services/locationService';

export function getYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}

export interface UseSocialFeedStateParams {
  feed: FeedItem[];
  setFeed: React.Dispatch<React.SetStateAction<FeedItem[]>>;
  userProfile?: any;
  portalRole: string;
  activeBand?: any;
  isEmbedded?: boolean;
  profileHandle?: string;
  profileAvatarUrl?: string;
  profileSceneRoles?: string[];
  profileFullLegalName?: string;
  activeClearanceLevel?: number;
  setActiveClearanceLevel?: (level: number) => void;
  triggerNotification?: (msg: string) => void;
  attachedSong?: any;
  setAttachedSong?: React.Dispatch<React.SetStateAction<any>>;
  setHypeAnimations?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setReactionMenuOpenFor?: React.Dispatch<React.SetStateAction<string | null>>;
  longPressTimerRef?: React.MutableRefObject<any>;
  setNotifications?: React.Dispatch<React.SetStateAction<any[]>>;
  bands?: any[];
}

export function useSocialFeedState({
  feed,
  setFeed,
  userProfile,
  portalRole,
  activeBand,
  isEmbedded = false,
  profileHandle = '',
  profileAvatarUrl = '',
  profileSceneRoles = [],
  profileFullLegalName = '',
  activeClearanceLevel,
  setActiveClearanceLevel,
  triggerNotification,
  attachedSong,
  setAttachedSong,
  setHypeAnimations,
  setReactionMenuOpenFor,
  longPressTimerRef,
  setNotifications,
  bands = [],
}: UseSocialFeedStateParams) {
  // Pro / Label Dashboard Custom Settings & Identity Clearance
  const [localClearance, setLocalClearance] = useState<number>(() => {
    const saved = localStorage.getItem('activeClearanceLevel');
    return saved ? Number(saved) : 5;
  });
  const currentClearance = setActiveClearanceLevel ? activeClearanceLevel : localClearance;
  const updateClearance = setActiveClearanceLevel || setLocalClearance;
  const proClearanceLevel = currentClearance === 5 ? 'owner' : 'staff';

  // Composer & Post state
  const [postIdentity, setPostIdentity] = useState('default');

  useEffect(() => {
    setPostIdentity('default');
  }, [portalRole, activeBand?.id, userProfile?.active_workspace]);
  const [newPostText, setNewPostText] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [deleteConfirmPostId, setDeleteConfirmPostId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [newPostTag, setNewPostTag] = useState('');
  const [showTagWarning, setShowTagWarning] = useState(false);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const [mediaUrl, setMediaUrl] = useState('');
  const [selectedMediaFiles, setSelectedMediaFiles] = useState<{ url: string; type: 'image' | 'video'; file?: File }[]>([]);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [taggedVenue, setTaggedVenue] = useState('');
  const [taggedBands, setTaggedBands] = useState<string[]>([]);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [showVenueInput, setShowVenueInput] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showMerchDropModal, setShowMerchDropModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollVariant, setPollVariant] = useState<'standard' | 'encore_setlist' | 'promoter_lineup'>('standard');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollIsTimed, setPollIsTimed] = useState(false);
  const [pollTimerDays, setPollTimerDays] = useState('1');
  const [pollTimerHours, setPollTimerHours] = useState('0');
  const [merchDropName, setMerchDropName] = useState('');
  const [merchDropPrice, setMerchDropPrice] = useState('25');
  const [merchDropThumbnail, setMerchDropThumbnail] = useState('https://images.unsplash.com/photo-1572913017567-02f06497f1f9?w=500');
  const [merchDropIsTimed, setMerchDropIsTimed] = useState(false);
  const [merchDropTimerHours, setMerchDropTimerHours] = useState('24');
  const [merchDropTimerMinutes, setMerchDropTimerMinutes] = useState('0');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Tape Creator states
  const [showTapeInput, setShowTapeInput] = useState(false);
  const [tapeTitle, setTapeTitle] = useState('');
  const [tapeBand, setTapeBand] = useState('');
  const [tapeDate, setTapeDate] = useState('');
  const [tapeDuration, setTapeDuration] = useState('');
  const [tapeAudioUrl, setTapeAudioUrl] = useState('');
  const [tapeAudioFileName, setTapeAudioFileName] = useState('');
  const [isUploadingTapeAudio, setIsUploadingTapeAudio] = useState(false);
  const tapeFileInputRef = useRef<HTMLInputElement>(null);

  // DIY Event Creator states
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('DIY Show');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('8:00 PM');
  const [eventLocationName, setEventLocationName] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [eventIsSecret, setEventIsSecret] = useState(false);
  const [eventLineup, setEventLineup] = useState('');
  const [eventFlyerUrl, setEventFlyerUrl] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCost, setEventCost] = useState('Free / Donation');
  const [eventTicketUrl, setEventTicketUrl] = useState('');

  // Shop & Category Filter states
  const [shopCategory, setShopCategory] = useState<string>('all');
  const [shopBrandFilter, setShopBrandFilter] = useState<string | null>(null);
  const [communityCategory, setCommunityCategory] = useState<string>('all');
  const [shopSearchQuery, setShopSearchQuery] = useState('');

  // Forum state
  const [forumSearch, setForumSearch] = useState('');
  const [forumCategory, setForumCategory] = useState('All');
  const [forumPrimaryGenre, setForumPrimaryGenre] = useState('All');
  const [forumMicroGenre, setForumMicroGenre] = useState('All');

  // Media helper methods
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (!e.target?.result) {
          resolve('');
          return;
        }
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1920;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.92));
          } else {
            resolve(e.target!.result as string);
          }
        };
        img.onerror = () => {
          resolve(e.target!.result as string);
        };
        img.src = e.target.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const uploadPostAttachment = async (file: File): Promise<string | null> => {
    try {
      const compressed = await compressImage(file);
      const userProfileId = userProfile?.id || 'profile_anonymous';
      const publicUrl = await uploadBase64ToStorage(compressed, 'assets', userProfileId, `feed-post-${Date.now()}`);
      return publicUrl || compressed;
    } catch (e) {
      console.warn("Failed to compress and upload image, falling back to original file:", e);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Str = reader.result as string;
            const userProfileId = userProfile?.id || 'profile_anonymous';
            const publicUrl = await uploadBase64ToStorage(base64Str, 'assets', userProfileId, `feed-post-${Date.now()}`);
            resolve(publicUrl || base64Str);
          } catch (uploadErr) {
            resolve(reader.result as string);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    triggerNotification?.("🛰️ Querying satellite GPS coordinates...");

    const coords = await getCurrentCoordinates({ enableHighAccuracy: true, timeout: 10000 });
    if (!coords) {
      triggerNotification?.("⚠️ GPS coordinate retrieval failed or permission denied. Enter manually.");
      setIsDetectingLocation(false);
      return;
    }

    const { latitude, longitude } = coords;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        const city = address?.city || address?.town || address?.village || address?.suburb || '';
        const state = address?.state || '';
        const country = address?.country || '';

        if (city && state) {
          setTaggedVenue(`${city}, ${state}`);
          triggerNotification?.(`📍 Location resolved: ${city}, ${state}`);
        } else if (city) {
          setTaggedVenue(`${city}, ${country}`);
          triggerNotification?.(`📍 Location resolved: ${city}, ${country}`);
        } else {
          setTaggedVenue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          triggerNotification?.(`📍 Coordinates captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } else {
        setTaggedVenue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        triggerNotification?.(`📍 Coordinates captured: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (err) {
      console.warn("Reverse geocoding failed, using coordinates:", err);
      setTaggedVenue(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      triggerNotification?.(`📍 Captured location coordinates.`);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: { url: string; type: 'image' | 'video'; file: File }[] = [];
    Array.from(files).forEach((file) => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const url = URL.createObjectURL(file);
      newFiles.push({ url, type, file });
    });
    setSelectedMediaFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeMediaFile = (index: number) => {
    setSelectedMediaFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].url);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    if (longPressTimerRef?.current) clearTimeout(longPressTimerRef.current);

    const keyMap: Record<string, string> = {
      like: 'likes',
      likes: 'likes',
      thumbs: 'likes',
      heart: 'likes',
      flame: 'hype',
      hype: 'hype',
      heavy: 'brutal',
      brutal: 'brutal',
      horns: 'horns',
      respect: 'respect',
      crushed: 'crushed',
      skull: 'brutal',
      grim: 'brutal',
      rocket: 'hype',
    };

    const reactionKey = keyMap[reactionType] || (['likes', 'horns', 'hype', 'brutal', 'respect', 'crushed'].includes(reactionType) ? reactionType : 'likes');

    if (reactionKey === 'hype' && setHypeAnimations) {
      setHypeAnimations((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => setHypeAnimations((prev) => ({ ...prev, [postId]: false })), 600);
    }
    if (setReactionMenuOpenFor) {
      setReactionMenuOpenFor(null);
    }

    const targetPost = feed.find((p) => p.id === postId);
    const userReacts = targetPost?.user_reactions || {};
    const wasActive = Boolean(userReacts[reactionKey] || (reactionKey === 'likes' && targetPost?.user_liked));

    const rx = targetPost?.reactions;
    const currObj: any =
      typeof rx === 'object' && rx !== null && !Array.isArray(rx)
        ? { ...rx }
        : Array.isArray(rx)
        ? rx.reduce(
            (acc: any, r: any) => {
              const mapped = keyMap[r.type] || r.type;
              if (acc[mapped] !== undefined) acc[mapped] += r.count || 1;
              return acc;
            },
            { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 }
          )
        : { likes: 0, horns: 0, hype: 0, brutal: 0, respect: 0, crushed: 0 };

    const fullCurr = {
      likes: Number(currObj.likes || currObj.thumbs || currObj.heart || 0),
      horns: Number(currObj.horns || 0),
      hype: Number(currObj.hype || currObj.flame || 0),
      brutal: Number(currObj.brutal || currObj.heavy || 0),
      respect: Number(currObj.respect || 0),
      crushed: Number(currObj.crushed || 0),
    };

    const nextUserReacts = { ...userReacts };

    if (!wasActive) {
      Object.keys(nextUserReacts).forEach((k) => {
        if (k !== reactionKey && nextUserReacts[k]) {
          nextUserReacts[k] = false;
          const prevTargetKey = k as 'likes' | 'horns' | 'hype' | 'brutal' | 'respect' | 'crushed';
          if (fullCurr[prevTargetKey] > 0) {
            fullCurr[prevTargetKey] -= 1;
          }
        }
      });
      nextUserReacts[reactionKey] = true;
      fullCurr[reactionKey as keyof typeof fullCurr] += 1;
    } else {
      nextUserReacts[reactionKey] = false;
      if (fullCurr[reactionKey as keyof typeof fullCurr] > 0) {
        fullCurr[reactionKey as keyof typeof fullCurr] -= 1;
      }
    }

    // 1. Optimistically update local feed state
    setFeed((prev) =>
      prev.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            reactions: fullCurr,
            likes_count: fullCurr.likes,
            user_liked: Boolean(nextUserReacts.likes),
            user_reactions: nextUserReacts,
          };
        }
        return post;
      })
    );

    // 2. Persist locally to reactionStore (localStorage + IndexedDB) immediately
    let activeUserId = userProfile?.id;
    if (!activeUserId && typeof window !== 'undefined') {
      activeUserId = localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || 'guest';
    }
    savePostReaction(postId, fullCurr, nextUserReacts, activeUserId);

    // 3. Persist globally to Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        if (!activeUserId || activeUserId === 'guest') {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.id) {
            activeUserId = session.user.id;
          }
        }

        // Direct update into nexus_posts
        const { data: existingRows } = await supabase
          .from('nexus_posts')
          .select('id, data, reactions, likes_count')
          .or(`id.eq.${postId},id.eq.nexus_post_${postId}`)
          .limit(1);

        if (existingRows && existingRows.length > 0) {
          const row = existingRows[0];
          const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
          await supabase.from('nexus_posts').update({
            reactions: fullCurr,
            likes_count: fullCurr.likes,
            data: {
              ...postObj,
              reactions: fullCurr,
              likes_count: fullCurr.likes,
            },
          }).eq('id', row.id);
        } else if (targetPost) {
          // If mock/seed post, upsert into nexus_posts so it is globally stored in Supabase
          await supabase.from('nexus_posts').upsert([{
            id: postId,
            profile_id: (activeUserId && activeUserId !== 'guest') ? activeUserId : '00000000-0000-0000-0000-000000000000',
            content: targetPost.content || (targetPost as any).text || (targetPost as any).message || ' ',
            media_url: (targetPost as any).media_url || (targetPost as any).mediaUrl || targetPost.image || null,
            reactions: fullCurr,
            likes_count: fullCurr.likes,
            data: {
              ...targetPost,
              reactions: fullCurr,
              likes_count: fullCurr.likes,
            },
            created_at: targetPost.created_at || targetPost.timestamp || new Date().toISOString()
          }], { onConflict: 'id' });
        }

        // Best effort call to toggle_post_reaction RPC
        try {
          await supabase.rpc('toggle_post_reaction', {
            p_post_id: postId,
            p_profile_id: activeUserId,
            p_reaction_type: reactionKey,
          });
        } catch (_) {}

        // 4. Notifications:
        // When reacting to someone else's content, ONLY send notification to the author.
        // The reacting user does NOT need a notification toast or notification inbox entry.
        if (!wasActive && targetPost) {
          const targetUserId = (targetPost as any).authorId || (targetPost.author as any)?.id || (targetPost.author as any)?.email;
          const validReceiverUUID = (targetUserId && extractUUID(targetUserId)) || null;

          // Only notify author if they are a different user!
          const isReactingToSomeoneElse = validReceiverUUID && validReceiverUUID !== activeUserId && validReceiverUUID !== userProfile?.id;
          if (isReactingToSomeoneElse) {
            const actorName = userProfile?.name || userProfile?.console_handle || profileHandle || 'A user';
            const postSnippet = (targetPost.content || (targetPost as any).message || (targetPost as any).text || 'transmission').substring(0, 50);
            const notifId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : (extractUUID(postId) || '00000000-0000-0000-0000-000000000000');
            const notifItem = {
              id: notifId,
              user_id: validReceiverUUID,
              title: `🔥 NEW REACTION`,
              message: `${actorName} reacted (${reactionKey.toUpperCase()}) to your transmission: "${postSnippet}"`,
              content: `${actorName} reacted (${reactionKey.toUpperCase()}) to your transmission: "${postSnippet}"`,
              category: 'REACTION',
              highlight: 'New Reaction',
              timeAgo: 'Just now',
              timestamp: new Date().toISOString(),
              created_at: new Date().toISOString(),
              read: false,
              is_read: false,
              type: 'post_reaction',
              postId: postId,
              linkTab: 'feed',
            };

            await supabase.from('nexus_notifications').insert([
              {
                id: notifItem.id,
                user_id: validReceiverUUID,
                title: notifItem.title,
                message: notifItem.message,
                category: 'REACTION',
                type: 'post_reaction',
                is_read: false,
                data: notifItem,
                created_at: new Date().toISOString(),
              },
            ]);
          }
        }
      } catch (e) {
        console.warn('Notice: Syncing reaction note:', e);
      }
    }
  };

  const handleEditPost = (postId: string, currentText: string) => {
    setEditingPostId(postId);
    setEditingPostText(currentText);
  };

  const handleSaveEdit = async (postId: string) => {
    const updatedText = editingPostText.trim();
    setFeed((prev) => prev.map((post) => (post.id === postId ? { ...post, content: updatedText } : post)));
    setEditingPostId(null);
    setEditingPostText('');

    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('nexus_posts').update({ content: updatedText }).eq('id', postId);
        if (error) {
          const { data: existing } = await supabase.from('nexus_posts').select('*').or(`id.eq.${postId},id.eq.nexus_post_${postId}`).limit(1);
          if (existing && existing[0]) {
            const row = existing[0];
            const postObj = typeof row.data === 'string' ? JSON.parse(row.data) : row.data || {};
            await supabase.from('nexus_posts').update({ data: { ...postObj, content: updatedText } }).eq('id', row.id);
          }
        }
      } catch (e) {
        console.warn('Failed to sync edit to Supabase:', e);
      }
    }
  };

  const handleDeletePost = async (postId: string, skipConfirm = false) => {
    if (!postId) return false;
    if (!skipConfirm && !window.confirm('Delete this transmission?')) return false;

    try {
      const supabase = getSupabase();
      let activeUserId = userProfile?.id;
      if (!activeUserId && supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        activeUserId = session?.user?.id;
      }
      if (!activeUserId) {
        activeUserId = localStorage.getItem('nexus_active_profile_id') || localStorage.getItem('nexus_user_profile_id') || null;
      }

      let success = false;
      let errorMsg = '';

      if (supabase) {
        const { data, error } = await supabase.rpc('delete_post_direct', {
          p_post_id: postId,
          p_profile_id: activeUserId || null,
        });

        if (error) {
          console.error('[DELETE POST FAILED]:', error.message);
          errorMsg = error.message;
        } else if (data === true) {
          success = true;
        } else {
          const { error: delErr } = await supabase.from('nexus_posts').delete().eq('id', postId);
          if (!delErr) {
            success = true;
          } else {
            console.warn('[DELETE POST]: Database returned false (0 rows deleted).');
            errorMsg = 'Post not found or permission denied.';
          }
        }
      } else {
        success = true;
      }

      // Always perform local deletion to guarantee duplicates and mock posts can be cleaned up
      try {
        const saved = localStorage.getItem('nexus_deleted_posts');
        const deletedPosts = saved ? JSON.parse(saved) : [];
        if (!deletedPosts.includes(postId)) {
          deletedPosts.push(postId);
          localStorage.setItem('nexus_deleted_posts', JSON.stringify(deletedPosts));
        }
      } catch (e) {}

      setFeed((prev) => {
        const next = prev.filter((post) => post.id !== postId);
        return next.length === 0 ? mockFeed : next;
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus_post_deleted', { detail: { id: postId } }));
      }

      if (success) {
        if (triggerNotification) {
          triggerNotification("🗑️ Post deleted successfully.");
        }
      } else {
        if (triggerNotification) {
          triggerNotification("🗑️ Post removed locally.");
        } else {
          console.warn(`Could not delete post from DB: ${errorMsg}. Post was removed from local view instead.`);
        }
      }

      return true;
    } catch (err) {
      console.error('[DELETE POST EXCEPTION]:', err);
      return false;
    }
  };

  const handleCreatePost = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSubmittingPost) return;
    setShowTagWarning(false);
    setShowContentWarning(false);

    const offTopicRegex = /(politics|election|vote|candidate|government|president|congress|democrat|republican)/i;
    if (offTopicRegex.test(newPostText)) {
      setShowContentWarning(true);
      return;
    }

    if (!newPostText.trim()) return;

    setIsSubmittingPost(true);
    triggerNotification?.('Publishing post and uploading media...');

    try {
      let uploadedUrls: string[] = [];
      for (const mediaFile of selectedMediaFiles) {
        if (mediaFile.file) {
          const uploadedUrl = await uploadPostAttachment(mediaFile.file);
          if (uploadedUrl) {
            uploadedUrls.push(uploadedUrl);
          }
        } else if (mediaFile.url) {
          uploadedUrls.push(mediaFile.url);
        }
      }

      const finalImage = uploadedUrls.length > 0 ? uploadedUrls[0] : mediaUrl || undefined;
      const finalImages = uploadedUrls.length > 0 ? uploadedUrls : mediaUrl ? [mediaUrl] : undefined;

      // Deterministically resolve the active publishing persona
      const resolvedPersona = resolveActivePersona({
        postIdentity,
        portalRole,
        userProfile,
        activeBand,
        bands,
        profileFullLegalName,
        profileHandle,
        profileAvatarUrl,
      });

      const authorName = resolvedPersona.name;
      const authorAvatar = resolvedPersona.avatarUrl;
      const authorRole = resolvedPersona.roleBadge;
      const authorRealName = resolvedPersona.realName || authorName;
      const isBandRole = resolvedPersona.type === 'band';
      const activeWorkspace = resolvedPersona.type;
      const postedByValue = isBandRole
        ? (profileFullLegalName?.split(' ')[0] || userProfile?.name?.split(' ')[0])
        : undefined;

      const totalPollMs = (parseInt(pollTimerDays || '0') * 86400 + parseInt(pollTimerHours || '0') * 3600) * 1000;
      const pollExpiresAtValue = pollIsTimed && totalPollMs > 0 ? new Date(Date.now() + totalPollMs).toISOString() : undefined;

      const pollDataValue =
        pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2
          ? {
              question: pollQuestion,
              variant: pollVariant,
              options: pollOptions
                .filter((o) => o.trim())
                .map((optText, idx) => ({
                  id: `opt_${Date.now()}_${idx}`,
                  text: optText,
                  votes: 0,
                })),
              totalVotes: 0,
              isTimed: pollIsTimed,
              expiresAt: pollExpiresAtValue,
            }
          : undefined;

      const tapeDataValue =
        tapeTitle.trim() && tapeBand.trim()
          ? {
              title: tapeTitle.trim(),
              band: tapeBand.trim().toUpperCase(),
              date: tapeDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              duration: tapeDuration.trim() || '03:45',
              audioUrl: tapeAudioUrl || mediaUrl || (finalImage && isAudioUrl(finalImage) ? finalImage : undefined),
            }
          : undefined;

      const timerHoursNum = Math.max(0, parseInt(merchDropTimerHours) || 0);
      const timerMinsNum = Math.max(0, Math.min(59, parseInt(merchDropTimerMinutes) || 0));
      const totalMs = (timerHoursNum * 3600 + timerMinsNum * 60) * 1000;
      const expiresAtValue = merchDropIsTimed && totalMs > 0 ? new Date(Date.now() + totalMs).toISOString() : undefined;

      const merchDataValue = merchDropName.trim()
        ? {
            name: merchDropName.trim(),
            price: Number(merchDropPrice.trim()) || 25,
            thumbnail: merchDropThumbnail.trim() || 'https://images.unsplash.com/photo-1572913017567-02f06497f1f9?w=500',
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
            isTimed: merchDropIsTimed,
            durationHours: timerHoursNum + timerMinsNum / 60,
            expiresAt: expiresAtValue,
          }
        : undefined;

      if (merchDataValue) {
        createShopMerchItem({
          name: merchDataValue.name,
          price: merchDataValue.price,
          thumbnail: merchDataValue.thumbnail,
          sizes: merchDataValue.sizes,
          is_timed: merchDataValue.isTimed,
          expires_at: merchDataValue.expiresAt,
          duration_hours: merchDataValue.durationHours,
          seller_name: authorName,
        });
      }

      // Deduplicated & Persistent Event Page Integration (Completely Optional)
      let resolvedEventRecord: any = null;
      if (eventTitle.trim()) {
        try {
          const registered = registerCommunityEvent({
            title: eventTitle.trim(),
            category: eventType || 'DIY Show',
            date: eventDate.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: eventTime.trim() || '8:00 PM',
            venue: eventLocationName.trim() || 'DIY Venue Spot',
            address: eventAddress.trim() || undefined,
            isSecretLocation: eventIsSecret,
            lineup: eventLineup ? eventLineup.split(',').map((s) => s.trim()).filter(Boolean) : [],
            flyerUrl: eventFlyerUrl.trim() || finalImage || undefined,
            description: eventDescription.trim() || undefined,
            cost: eventCost.trim() || 'Free / Donation',
            ticketUrl: eventTicketUrl.trim() || undefined,
          }, authorName);

          resolvedEventRecord = registered.event;
          if (!registered.isNew && registered.matchedEvent) {
            console.log(`[Scene Deduplication] Linked post to existing event page: ${registered.matchedEvent.name} (${registered.matchedEvent.id})`);
          }
        } catch (err) {
          console.error('Error registering community event:', err);
        }
      }

      const eventDataValue = resolvedEventRecord
        ? {
            id: resolvedEventRecord.id,
            title: resolvedEventRecord.name,
            category: resolvedEventRecord.category || eventType || 'DIY Show',
            date: resolvedEventRecord.date,
            time: resolvedEventRecord.time,
            locationName: resolvedEventRecord.venue_name,
            city: resolvedEventRecord.city || (resolvedEventRecord.venue_address?.includes(',') ? resolvedEventRecord.venue_address.split(',')[0].trim() : resolvedEventRecord.venue_name),
            address: resolvedEventRecord.venue_address,
            isSecretLocation: resolvedEventRecord.is_secret_location,
            lineup: Array.isArray(resolvedEventRecord.lineup) ? resolvedEventRecord.lineup : [],
            flyerUrl: resolvedEventRecord.flyer_url || eventFlyerUrl.trim() || finalImage || undefined,
            description: resolvedEventRecord.description,
            cost: resolvedEventRecord.price || resolvedEventRecord.cost || eventCost.trim(),
            ticketUrl: resolvedEventRecord.external_ticket_url || resolvedEventRecord.ticketUrl || eventTicketUrl.trim() || undefined,
            rsvpsCount: resolvedEventRecord.rsvps_count || 1,
            attendees: resolvedEventRecord.attendees || [authorName],
          }
        : undefined;

      const ticketDataValue = eventDataValue && (eventTicketUrl.trim() || eventDataValue.ticketUrl)
        ? {
            headliner: eventDataValue.title,
            venue: eventDataValue.locationName,
            date: eventDataValue.date,
            doorTime: eventDataValue.time || '8:00 PM',
            priceRange: eventDataValue.cost || 'Free / Donation',
            ticketUrl: eventDataValue.ticketUrl,
            external_ticket_url: eventDataValue.ticketUrl,
            lineup: eventDataValue.lineup,
            city: eventDataValue.city || eventDataValue.locationName,
          }
        : undefined;

      const postUuid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'f' + Date.now().toString(16) + '-4000-8000-8000-' + Math.floor(Math.random() * 1e12).toString(16).padStart(12, '0');

      const activeAuthorId = userProfile?.id || (userProfile as any)?.profile_id;

      const ytId = youtubeUrl ? getYouTubeId(youtubeUrl) : undefined;
      const ytUrl = youtubeUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : undefined);
      const mediaUrlToUse = mediaUrl || ytUrl || tapeAudioUrl || finalImage || undefined;

      const newPost: any = {
        id: postUuid,
        type: merchDataValue ? 'merch_drop' : tapeDataValue ? 'tape_share' : pollDataValue ? 'poll' : eventDataValue ? 'event' : 'post',
        workspace_type: activeWorkspace,
        workspaceType: activeWorkspace,
        persona_id: resolvedPersona.id,
        authorRole: authorRole,
        authorName: authorName,
        authorAvatar: authorAvatar,
        author: {
          id: isBandRole ? (activeBand?.id || activeAuthorId) : activeAuthorId,
          personaId: resolvedPersona.id,
          name: authorName,
          realName: authorRealName,
          avatar: authorAvatar,
          role: authorRole,
          portalRole: portalRole,
          postedBy: postedByValue,
          workspace_type: activeWorkspace,
          workspaceType: activeWorkspace,
          isBand: isBandRole,
          band_name: isBandRole ? authorName : undefined,
        } as any,
        timeAgo: 'Just now',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        content: newPostText,
        tag: newPostTag,
        image: finalImage || mediaUrlToUse || undefined,
        mediaUrl: mediaUrlToUse,
        media_url: mediaUrlToUse,
        images: finalImages && finalImages.length > 0 ? finalImages : mediaUrlToUse ? [mediaUrlToUse] : [],
        youtubeId: ytId,
        youtube_id: ytId,
        youtubeUrl: ytUrl,
        youtube_url: ytUrl,
        location: taggedVenue || (eventDataValue ? eventDataValue.locationName : undefined),
        reactions: [{ type: 'flame', count: 0, active: false }],
        comments: [],
        topComment: undefined,
        songData: attachedSong
          ? {
              band: attachedSong.band,
              title: attachedSong.title,
              album: attachedSong.album,
              duration: attachedSong.duration,
              audioUrl: (attachedSong as any).audioUrl || (attachedSong as any).url || (attachedSong as any).audio_url,
              coverArt: (attachedSong as any).coverArt || (attachedSong as any).image,
            }
          : undefined,
        pollData: pollDataValue,
        merchData: merchDataValue,
        tapeData: tapeDataValue,
        eventData: eventDataValue,
      };

      await syncPostToSupabase(newPost, activeAuthorId);
      setFeed((prev) => [newPost, ...prev]);

      setNewPostText('');
      setNewPostTag('');
      setMediaUrl('');
      setSelectedMediaFiles([]);
      setYoutubeUrl('');
      setTaggedVenue('');
      if (setAttachedSong) setAttachedSong(null);
      setPollQuestion('');
      setPollOptions(['', '']);
      setMerchDropName('');
      setMerchDropPrice('25');
      setMerchDropThumbnail('https://images.unsplash.com/photo-1572913017567-02f06497f1f9?w=500');
      setMerchDropIsTimed(false);
      setMerchDropTimerHours('24');
      setMerchDropTimerMinutes('0');
      setTapeTitle('');
      setTapeBand('');
      setTapeDate('');
      setTapeDuration('');
      setTapeAudioUrl('');
      setTapeAudioFileName('');

      // Reset Event states
      setEventTitle('');
      setEventType('DIY Show');
      setEventDate('');
      setEventTime('8:00 PM');
      setEventLocationName('');
      setEventAddress('');
      setEventIsSecret(false);
      setEventLineup('');
      setEventFlyerUrl('');
      setEventDescription('');
      setEventCost('Free / Donation');
      setEventTicketUrl('');
      setShowTapeInput(false);
      setShowMediaInput(false);
      setShowYoutubeInput(false);
      setShowVenueInput(false);
      triggerNotification?.('Post published to the scene.');
    } catch (err) {
      console.error('Failed to create post:', err);
      triggerNotification?.('⚠️ Failed to publish post.');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  return {
    // Clearance
    localClearance,
    setLocalClearance,
    currentClearance,
    updateClearance,
    proClearanceLevel,

    // Composer & Post state
    postIdentity,
    setPostIdentity,
    newPostText,
    setNewPostText,
    editingPostId,
    setEditingPostId,
    editingPostText,
    setEditingPostText,
    deleteConfirmPostId,
    setDeleteConfirmPostId,
    mentionQuery,
    setMentionQuery,
    newPostTag,
    setNewPostTag,
    showTagWarning,
    setShowTagWarning,
    showContentWarning,
    setShowContentWarning,
    expandedComments,
    setExpandedComments,
    mediaUrl,
    setMediaUrl,
    selectedMediaFiles,
    setSelectedMediaFiles,
    isSubmittingPost,
    setIsSubmittingPost,
    isDetectingLocation,
    setIsDetectingLocation,
    youtubeUrl,
    setYoutubeUrl,
    taggedVenue,
    setTaggedVenue,
    taggedBands,
    setTaggedBands,
    showMediaInput,
    setShowMediaInput,
    showYoutubeInput,
    setShowYoutubeInput,
    showVenueInput,
    setShowVenueInput,
    showPollModal,
    setShowPollModal,
    showMerchDropModal,
    setShowMerchDropModal,
    pollQuestion,
    setPollQuestion,
    pollVariant,
    setPollVariant,
    pollOptions,
    setPollOptions,
    pollIsTimed,
    setPollIsTimed,
    pollTimerDays,
    setPollTimerDays,
    pollTimerHours,
    setPollTimerHours,
    merchDropName,
    setMerchDropName,
    merchDropPrice,
    setMerchDropPrice,
    merchDropThumbnail,
    setMerchDropThumbnail,
    merchDropIsTimed,
    setMerchDropIsTimed,
    merchDropTimerHours,
    setMerchDropTimerHours,
    merchDropTimerMinutes,
    setMerchDropTimerMinutes,
    commentInputs,
    setCommentInputs,

    // Tape state
    showTapeInput,
    setShowTapeInput,
    tapeTitle,
    setTapeTitle,
    tapeBand,
    setTapeBand,
    tapeDate,
    setTapeDate,
    tapeDuration,
    setTapeDuration,
    tapeAudioUrl,
    setTapeAudioUrl,
    tapeAudioFileName,
    setTapeAudioFileName,
    isUploadingTapeAudio,
    setIsUploadingTapeAudio,
    tapeFileInputRef,

    // DIY Event states
    showEventModal,
    setShowEventModal,
    eventTitle,
    setEventTitle,
    eventType,
    setEventType,
    eventDate,
    setEventDate,
    eventTime,
    setEventTime,
    eventLocationName,
    setEventLocationName,
    eventAddress,
    setEventAddress,
    eventIsSecret,
    setEventIsSecret,
    eventLineup,
    setEventLineup,
    eventFlyerUrl,
    setEventFlyerUrl,
    eventDescription,
    setEventDescription,
    eventCost,
    setEventCost,
    eventTicketUrl,
    setEventTicketUrl,

    // Filters
    shopCategory,
    setShopCategory,
    shopBrandFilter,
    setShopBrandFilter,
    communityCategory,
    setCommunityCategory,
    shopSearchQuery,
    setShopSearchQuery,
    forumSearch,
    setForumSearch,
    forumCategory,
    setForumCategory,
    forumPrimaryGenre,
    setForumPrimaryGenre,
    forumMicroGenre,
    setForumMicroGenre,

    // Handlers
    handleDetectLocation,
    handleMediaUpload,
    removeMediaFile,
    handleReaction,
    handleEditPost,
    handleSaveEdit,
    handleDeletePost,
    handleCreatePost,
  };
}
