import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Flame,
  Zap,
  Search,
  Image,
  Youtube,
  ArrowRight,
  PlayCircle,
  Plus,
  Edit2,
  Trash2,
  Bell,
  BellPlus,
  Check,
  Bookmark,
  Rss,
  X,
  CheckCircle2,
  CornerDownRight,
  Sparkles,
  Share2,
  Upload,
  Music,
  FileAudio,
  Film,
  Volume2,
} from 'lucide-react';
import { MASTER_GENRES } from '../../constants/genres';
import { getSupabase } from '../../supabase';

export function isAudioUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (lower.startsWith('data:audio/')) return true;
  return /\.(mp3|wav|ogg|flac|m4a|aac|wma)(\?.*)?$/i.test(lower);
}

export function isVideoUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  return /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(lower);
}

export async function uploadForumMediaToStorage(file: File): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop() || 'bin';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filePath = `forum_uploads/forum_${Date.now()}_${sanitizedName}.${fileExt}`;

    // Attempt upload to 'forum-media' bucket
    const { data, error } = await supabase.storage.from('forum-media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (!error && data) {
      const { data: publicData } = supabase.storage.from('forum-media').getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }

    // Fallback to 'media' bucket
    const res2 = await supabase.storage.from('media').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (!res2.error && res2.data) {
      const { data: publicData2 } = supabase.storage.from('media').getPublicUrl(filePath);
      if (publicData2?.publicUrl) {
        return publicData2.publicUrl;
      }
    }
  } catch (err) {
    console.warn('[Forum Storage] Bucket upload failed, falling back to data URL:', err);
  }

  // Fallback to Data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve((e.target?.result as string) || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

interface NativeMediaUploaderProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

const NativeMediaUploader: React.FC<NativeMediaUploaderProps> = ({ value, onChange, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlOption, setShowUrlOption] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name);
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name);

    if (!isImage && !isAudio && !isVideo) {
      alert('Please select an image file (PNG, JPG, WEBP) or music/audio track (MP3, WAV, FLAC, M4A).');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadForumMediaToStorage(file);
      if (publicUrl) {
        onChange(publicUrl);
      }
    } catch (e) {
      console.error('File upload failed:', e);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const isAudio = isAudioUrl(value);
  const isVideo = isVideoUrl(value);

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[10px] font-bold uppercase text-zinc-500">{label}</label>}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,audio/*,video/*,.mp3,.wav,.ogg,.flac,.m4a"
        className="hidden"
      />

      {isUploading ? (
        <div className="rounded-xl border border-rose-900/50 bg-zinc-950 p-4 flex items-center justify-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-rose-400">Uploading file to forum-media bucket...</span>
        </div>
      ) : value ? (
        <div className="relative group rounded-xl overflow-hidden border border-rose-900/50 bg-zinc-950 p-2.5 flex items-center gap-3 shadow-inner">
          {isAudio ? (
            <div className="w-14 h-14 rounded-lg bg-rose-950/80 border border-rose-900/60 flex flex-col items-center justify-center text-rose-400 shrink-0">
              <FileAudio className="w-6 h-6" />
              <span className="text-[8px] font-bold uppercase mt-1">Audio Track</span>
            </div>
          ) : isVideo ? (
            <div className="w-14 h-14 rounded-lg bg-purple-950/80 border border-purple-900/60 flex flex-col items-center justify-center text-purple-400 shrink-0">
              <Film className="w-6 h-6" />
              <span className="text-[8px] font-bold uppercase mt-1">Video</span>
            </div>
          ) : (
            <img
              referrerPolicy="no-referrer"
              src={value}
              alt="Uploaded Preview"
              className="w-14 h-14 object-cover rounded-lg border border-zinc-800 shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <span className="text-xs font-black text-rose-400 block truncate">
              {isAudio ? 'Music / Audio Track Attached' : isVideo ? 'Video Attached' : 'Image Attached'}
            </span>
            {isAudio ? (
              <audio controls src={value} className="w-full max-w-xs mt-1.5 h-8 rounded bg-zinc-900" />
            ) : (
              <span className="text-[10px] text-zinc-500 block font-mono">Uploaded to forum-media storage</span>
            )}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] font-bold uppercase px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg cursor-pointer transition-colors"
              >
                Change File
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-[10px] font-bold uppercase px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-900/50 rounded-lg cursor-pointer transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-rose-500 bg-rose-950/20 scale-[1.01]'
              : 'border-zinc-800 hover:border-rose-900/60 bg-zinc-950/80 hover:bg-zinc-900/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400 shadow-sm">
                <Upload className="w-4 h-4" />
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-400 shadow-sm">
                <Music className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">
                Click to select image or music track <span className="text-zinc-500 font-normal">or drag & drop</span>
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Images (PNG, JPG, WEBP) & Music files (MP3, WAV, FLAC, M4A)</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlOption(!showUrlOption);
              }}
              className="text-[9px] font-semibold text-zinc-500 hover:text-rose-400 underline mt-1 cursor-pointer transition-colors"
            >
              {showUrlOption ? 'Hide Web URL Option' : 'Or paste a web media URL instead'}
            </button>
          </div>
        </div>
      )}

      {!value && showUrlOption && (
        <div className="mt-2 flex gap-2 items-center bg-zinc-950 border border-zinc-800 rounded-xl p-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste media URL (e.g. https://...)"
            className="flex-1 bg-transparent text-xs text-white focus:outline-none px-2"
          />
        </div>
      )}
    </div>
  );
};

interface ForumViewProps {
  userProfile?: any;
  profileHandle?: string;
  triggerNotification?: (msg: string) => void;
  profileAvatarUrl?: string;
  discoverProfiles?: any[];
  allProfiles?: any[];
}

const DEFAULT_FORUM_THREADS = [
  {
    id: 't1',
    title: "Close to a World Below's album art is a masterpiece. Who is the artist?",
    content:
      'The surreal apocalyptic aesthetic fits the dissonant death metal sound so perfectly. Is it Andreas Marschall or someone inspired by him?',
    category: 'Album Art',
    genre: 'Death Metal',
    author: '@StarGazer',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    timeAgo: '2h ago',
    votes: 148,
    userVote: null as 'up' | 'down' | null,
    comments: [
      {
        id: 'fc1',
        author: '@CosmicVoid',
        text: "It's actually painted by Andreas Marschall! Incredible choice by Immolation.",
        timeAgo: '1h ago',
        replies: [
          {
            id: 'fr1',
            author: '@StarGazer',
            text: 'That is awesome! No wonder it felt so familiar. His vintage covers are incredible.',
            timeAgo: '30m ago',
          },
        ],
      },
    ],
  },
  {
    id: 't2',
    title: 'Immolation - Close to a World Below: Decades Later',
    content:
      "Can we talk about how well this legendary record has aged? The crushing riffs, the intricate dissonant chords, and Ross Dolan's iconic vocal delivery.",
    category: 'Album Reviews',
    genre: 'Death Metal',
    author: '@OnyxRiff',
    timeAgo: '4h ago',
    votes: 95,
    userVote: null as 'up' | 'down' | null,
    comments: [
      {
        id: 'fc2',
        author: '@PummelingBass',
        text: 'Totally agree. It pioneered a resurgence of dark dissonant death metal. Every track is a 10/10.',
        timeAgo: '3h ago',
        replies: [],
      },
    ],
  },
  {
    id: 't3',
    title: 'Maryland Deathfest 2026 predictions and wishlist',
    content:
      "Who are we hoping to see on the bill next year? I'm hoping for a Cryptopsy/Immolation co-headlining set, plus maybe some European legends.",
    category: 'Show & Fest',
    genre: 'Death Metal',
    author: '@FestivalGoon',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    timeAgo: '1d ago',
    votes: 112,
    userVote: null as 'up' | 'down' | null,
    comments: [],
  },
  {
    id: 't4',
    title: 'What gear did Cryptopsy use on None So Vile for that extreme speed?',
    content:
      "Is it standard Marshall amps or custom distortion chains? Jon Levasseur's guitar tone is unbelievably raw and fast, especially paired with Flo Mounier's gravity blasts.",
    category: 'Gear & Rig',
    genre: 'Death Metal',
    author: '@GuitarNerd_666',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    timeAgo: '2d ago',
    votes: 64,
    userVote: null as 'up' | 'down' | null,
    comments: [],
  },
  {
    id: 't5',
    title: "Cosmic Black Metal: Paysage d'Hiver vs. Alcest vs. Darkspace",
    content:
      "I'm fascinated by black metal that reaches into the cold starry abyss instead of just cold forests. Who do you think captures the galactic loneliness best?",
    category: 'Album Reviews',
    genre: 'Black Metal',
    author: '@AstraVoid',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80',
    timeAgo: '5h ago',
    votes: 78,
    userVote: null as 'up' | 'down' | null,
    comments: [
      {
        id: 'fc3',
        author: '@SpectralGlow',
        text: "Darkspace is the absolute pinnacle of cosmic dread. Paysage d'Hiver is more like being trapped in a blinding blizzard!",
        timeAgo: '3h ago',
        replies: [],
      },
    ],
  },
  {
    id: 't6',
    title: 'The vintage 4-track raw tape sound of early Norwegian Black Metal',
    content:
      'Is there any modern plug-in or analog deck that actually replicates that Transilvanian Hunger fuzz? Everything today sounds too clean or too artificial.',
    category: 'Gear & Rig',
    genre: 'Black Metal',
    author: '@GravenSoul',
    timeAgo: '1d ago',
    votes: 42,
    userVote: null as 'up' | 'down' | null,
    comments: [],
  },
  {
    id: 't7',
    title: 'Is Electric Wizard\'s "Dopethrone" the heaviest record ever recorded?',
    content:
      "That guitar tone sounds like molten sludge. I've heard rumors they used maxed-out Boss FZ-2 Hyper Fuzz pedals into vintage Sound City tube heads. Anyone got details?",
    category: 'Gear & Rig',
    genre: 'Doom/Sludge',
    author: '@SludgeWorship',
    image: 'https://images.unsplash.com/photo-1526478806334-5fd488fcaabc?w=600&auto=format&fit=crop&q=80',
    timeAgo: '3h ago',
    votes: 115,
    userVote: null as 'up' | 'down' | null,
    comments: [
      {
        id: 'fc4',
        author: '@FuzzLord',
        text: 'Yes! It is indeed the FZ-2 on Mode II (scooped boost) pushing those power tubes to near-explosion. Pure genius.',
        timeAgo: '1h ago',
        replies: [],
      },
    ],
  },
  {
    id: 't8',
    title: 'Bell Witch live is a colossal, crushing, slow-motion experience',
    content:
      'Just saw them perform Mirror Reaper in its entirety last night. Only two musicians on stage, but it felt louder and more emotionally massive than a full orchestra.',
    category: 'Show & Fest',
    genre: 'Doom/Sludge',
    author: '@MournfulChord',
    timeAgo: '2d ago',
    votes: 93,
    userVote: null as 'up' | 'down' | null,
    comments: [],
  },
];

// Helper functions for UUID generation and local caching
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function saveForumCache(threads: any[]) {
  try {
    localStorage.setItem('nexus_forum_threads_cache', JSON.stringify(threads));
  } catch (e) {
    console.warn('Failed to save forum cache to localStorage:', e);
  }
}

function loadForumCache(): any[] | null {
  try {
    const saved = localStorage.getItem('nexus_forum_threads_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return null;
}

export const ForumView: React.FC<ForumViewProps> = ({
  userProfile,
  profileHandle,
  triggerNotification,
  profileAvatarUrl,
  discoverProfiles = [],
  allProfiles = [],
}) => {
  const [forumThreads, setForumThreads] = useState<any[]>(() => {
    const cached = loadForumCache();
    return cached && cached.length > 0 ? cached : DEFAULT_FORUM_THREADS;
  });
  const [forumSearch, setForumSearch] = useState('');
  const [forumCategory, setForumCategory] = useState('All');
  const [forumPrimaryGenre, setForumPrimaryGenre] = useState('All');
  const [forumMicroGenre, setForumMicroGenre] = useState('All');
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);

  // Space Subscriptions state
  const [subscribedSpaces, setSubscribedSpaces] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_forum_subscriptions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['Death Metal', 'Album Art', 'Gear & Rig'];
  });

  const toggleSubscribeSpace = (spaceName: string) => {
    if (!spaceName || spaceName === 'All') return;
    setSubscribedSpaces((prev) => {
      const exists = prev.includes(spaceName);
      const updated = exists ? prev.filter((s) => s !== spaceName) : [...prev, spaceName];
      try {
        localStorage.setItem('nexus_forum_subscriptions', JSON.stringify(updated));
      } catch (e) {}

      const msg = exists ? `Unsubscribed from ${spaceName}` : `Subscribed to ${spaceName} space!`;
      triggerNotification?.(msg);

      // Dispatch Notice to Notification System
      window.dispatchEvent(
        new CustomEvent('nexus_add_notification', {
          detail: {
            title: exists ? 'Space Unsubscribed' : 'Space Subscribed',
            message: exists
              ? `You unsubscribed from the ${spaceName} space.`
              : `You are now subscribed to updates from the ${spaceName} space!`,
            type: 'system',
            targetTab: 'forum',
          },
        })
      );

      return updated;
    });
  };

  // Get current user's effective console handle
  const getEffectiveUserHandle = () => {
    const raw =
      userProfile?.console_handle ||
      profileHandle ||
      userProfile?.handle ||
      (userProfile?.name ? userProfile.name.replace(/\s+/g, '_').toLowerCase() : 'fan');
    return raw.startsWith('@') ? raw : `@${raw}`;
  };

  // Check if thread or comment belongs to current user
  const isUserOwner = (authorName?: string) => {
    if (!authorName) return false;
    const currentUserName = userProfile?.name || '';
    const myHandle = (userProfile?.console_handle || profileHandle || userProfile?.handle || '').replace('@', '').toLowerCase();
    const cleanAuthor = authorName.replace('@', '').toLowerCase();
    if (myHandle && (cleanAuthor === myHandle || cleanAuthor.includes(myHandle))) return true;
    if (currentUserName && authorName.toLowerCase() === currentUserName.toLowerCase()) return true;
    if (authorName.toLowerCase() === 'fan' || authorName.toLowerCase() === '@fan') return true;
    return false;
  };

  // Format any author display into their console handle
  const formatForumAuthor = (authorName?: string) => {
    if (!authorName) return getEffectiveUserHandle();
    if (isUserOwner(authorName)) {
      return getEffectiveUserHandle();
    }
    if (authorName.startsWith('@')) return authorName;
    const match = [...(allProfiles || []), ...(discoverProfiles || [])].find(
      (p) =>
        (p?.name && p.name.toLowerCase() === authorName.toLowerCase()) ||
        (p?.handle && p.handle.toLowerCase() === authorName.toLowerCase()) ||
        (p?.console_handle && p.console_handle.toLowerCase() === authorName.toLowerCase())
    );
    if (match?.console_handle || match?.handle) {
      const h = match.console_handle || match.handle;
      return h.startsWith('@') ? h : `@${h}`;
    }
    return authorName.includes(' ')
      ? `@${authorName.replace(/\s+/g, '_').toLowerCase()}`
      : `@${authorName}`;
  };

  // Load threads and comments from Supabase if connected & merge with local cache
  useEffect(() => {
    const supabase = getSupabase();

    async function loadThreadsAndComments() {
      const cachedThreads = loadForumCache() || [];
      if (!supabase) {
        if (cachedThreads.length > 0) setForumThreads(cachedThreads);
        return;
      }

      try {
        const [threadsRes, commentsRes] = await Promise.all([
          supabase.from('forum_threads').select('*').order('created_at', { ascending: false }),
          supabase.from('forum_comments').select('*').order('created_at', { ascending: true }),
        ]);

        const threadsData = threadsRes.data;
        const commentsData = commentsRes.data;

        if (threadsData && threadsData.length > 0) {
          const commentsByThread: Record<string, any[]> = {};

          if (commentsData && commentsData.length > 0) {
            const rawByThread: Record<string, any[]> = {};
            commentsData.forEach((c: any) => {
              const tid = c.thread_id;
              if (!tid) return;
              if (!rawByThread[tid]) rawByThread[tid] = [];
              rawByThread[tid].push(c);
            });

            Object.keys(rawByThread).forEach((tid) => {
              const rawList = rawByThread[tid];
              const topLevel: any[] = [];
              const repliesMap: Record<string, any[]> = {};

              rawList.forEach((item) => {
                const mappedItem = {
                  id: item.id,
                  author: item.author_name || item.author || 'Fan',
                  authorAvatar: item.author_avatar,
                  userId: item.user_id,
                  text: item.text || item.comment || item.content || '',
                  timeAgo: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently',
                  likes: item.likes ?? 0,
                  parentCommentId: item.parent_comment_id || null,
                  replies: [],
                };

                if (item.parent_comment_id) {
                  if (!repliesMap[item.parent_comment_id]) {
                    repliesMap[item.parent_comment_id] = [];
                  }
                  repliesMap[item.parent_comment_id].push(mappedItem);
                } else {
                  topLevel.push(mappedItem);
                }
              });

              topLevel.forEach((top) => {
                top.replies = repliesMap[top.id] || [];
              });

              commentsByThread[tid] = topLevel;
            });
          }

          const mappedSupabase = threadsData.map((t: any) => {
            let threadComments = commentsByThread[t.id];
            if (!threadComments && Array.isArray(t.comments) && t.comments.length > 0) {
              threadComments = t.comments;
            }

            return {
              id: t.id,
              title: t.title,
              content: t.content,
              category: t.category || 'General',
              genre: t.genre || 'Death Metal',
              primaryGenre: t.primary_genre || 'Extreme Metal',
              author: t.author || t.author_name || 'Fan',
              authorAvatar: t.author_avatar || t.author_avatar_url,
              image: t.image_url || t.image || t.media_url,
              youtubeId: t.youtube_id,
              votes: t.votes ?? 1,
              timeAgo: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recently',
              comments: threadComments || [],
              userVote: null,
            };
          });

          // Merge Supabase threads with any local cached threads that haven't synced yet
          const supabaseIds = new Set(mappedSupabase.map((t) => String(t.id)));
          const localOnly = cachedThreads.filter((ct) => !supabaseIds.has(String(ct.id)));

          const combined = [...localOnly, ...mappedSupabase];
          setForumThreads(combined);
          saveForumCache(combined);
        } else if (cachedThreads.length > 0) {
          setForumThreads(cachedThreads);
        }
      } catch (err) {
        console.warn('Supabase forum load error, fallback to local cache:', err);
        if (cachedThreads.length > 0) {
          setForumThreads(cachedThreads);
        }
      }
    }

    loadThreadsAndComments();
  }, []);

  // New Thread Form state
  const [showCreateThread, setShowCreateThread] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadCategory, setNewThreadCategory] = useState('Album Art');
  const [newThreadPrimaryGenre, setNewThreadPrimaryGenre] = useState('Extreme Metal');
  const [newThreadMicroGenre, setNewThreadMicroGenre] = useState('Death Metal');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [showThreadMediaInput, setShowThreadMediaInput] = useState(false);
  const [showThreadYoutubeInput, setShowThreadYoutubeInput] = useState(false);
  const [newThreadMediaUrl, setNewThreadMediaUrl] = useState('');
  const [newThreadYoutubeUrl, setNewThreadYoutubeUrl] = useState('');

  // Editing Thread State
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editThreadTitle, setEditThreadTitle] = useState('');
  const [editThreadContent, setEditThreadContent] = useState('');
  const [editThreadCategory, setEditThreadCategory] = useState('');
  const [editThreadGenre, setEditThreadGenre] = useState('');
  const [editThreadMediaUrl, setEditThreadMediaUrl] = useState('');

  const handleStartEditThread = (thread: any) => {
    setEditingThreadId(thread.id);
    setEditThreadTitle(thread.title);
    setEditThreadContent(thread.content);
    setEditThreadCategory(thread.category || 'Album Art');
    setEditThreadGenre(thread.genre || 'Death Metal');
    setEditThreadMediaUrl(thread.image || '');
  };

  const handleSaveThreadEdit = async (threadId: string) => {
    if (!editThreadTitle.trim() || !editThreadContent.trim()) return;
    setForumThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            title: editThreadTitle,
            content: editThreadContent,
            category: editThreadCategory,
            genre: editThreadGenre,
            image: editThreadMediaUrl || undefined,
          };
        }
        return t;
      });
      saveForumCache(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('forum_threads')
          .update({
            title: editThreadTitle,
            content: editThreadContent,
            category: editThreadCategory,
            genre: editThreadGenre,
            image_url: editThreadMediaUrl || null,
          })
          .eq('id', threadId);
      } catch (e) {
        console.warn('Error updating thread in Supabase:', e);
      }
    }

    setEditingThreadId(null);
    triggerNotification?.('Thread updated successfully!');
  };

  const handleDeleteThread = async (threadId: string, threadTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${threadTitle}"?`)) return;
    setForumThreads((prev) => {
      const updated = prev.filter((t) => t.id !== threadId);
      saveForumCache(updated);
      return updated;
    });
    if (expandedThreadId === threadId) {
      setExpandedThreadId(null);
    }

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('forum_comments').delete().eq('thread_id', threadId);
        await supabase.from('forum_threads').delete().eq('id', threadId);
      } catch (e) {
        console.warn('Error deleting thread in Supabase:', e);
      }
    }

    triggerNotification?.('Thread deleted.');
  };

  // Editing Comments State
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const handleStartEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleSaveCommentEdit = async (threadId: string, commentId: string) => {
    if (!editingCommentText.trim()) return;
    setForumThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map((c: any) => (c.id === commentId ? { ...c, text: editingCommentText } : c)),
          };
        }
        return t;
      })
    );
    setEditingCommentId(null);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('forum_comments').update({ text: editingCommentText }).eq('id', commentId);
      } catch (e) {
        console.warn('Error updating comment in Supabase:', e);
      }
    }

    triggerNotification?.('Comment updated.');
  };

  const handleDeleteComment = async (threadId: string, commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    setForumThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.filter((c: any) => c.id !== commentId),
          };
        }
        return t;
      })
    );

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('forum_comments').delete().eq('parent_comment_id', commentId);
        await supabase.from('forum_comments').delete().eq('id', commentId);
      } catch (e) {
        console.warn('Error deleting comment in Supabase:', e);
      }
    }

    triggerNotification?.('Comment deleted.');
  };

  // Editing Replies State
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState('');

  const handleStartEditReply = (reply: any) => {
    setEditingReplyId(reply.id);
    setEditingReplyText(reply.text);
  };

  const handleSaveReplyEdit = async (threadId: string, commentId: string, replyId: string) => {
    if (!editingReplyText.trim()) return;
    setForumThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map((c: any) => {
              if (c.id === commentId && c.replies) {
                return {
                  ...c,
                  replies: c.replies.map((r: any) => (r.id === replyId ? { ...r, text: editingReplyText } : r)),
                };
              }
              return c;
            }),
          };
        }
        return t;
      })
    );
    setEditingReplyId(null);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('forum_comments').update({ text: editingReplyText }).eq('id', replyId);
      } catch (e) {
        console.warn('Error updating reply in Supabase:', e);
      }
    }

    triggerNotification?.('Reply updated.');
  };

  const handleDeleteReply = async (threadId: string, commentId: string, replyId: string) => {
    if (!window.confirm('Delete this reply?')) return;
    setForumThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map((c: any) => {
              if (c.id === commentId && c.replies) {
                return {
                  ...c,
                  replies: c.replies.filter((r: any) => r.id !== replyId),
                };
              }
              return c;
            }),
          };
        }
        return t;
      })
    );

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('forum_comments').delete().eq('id', replyId);
      } catch (e) {
        console.warn('Error deleting reply in Supabase:', e);
      }
    }

    triggerNotification?.('Reply deleted.');
  };

  // Comment & Reply inputs
  const [threadCommentInput, setThreadCommentInput] = useState('');
  const [activeThreadReplyCommentId, setActiveThreadReplyCommentId] = useState<string | null>(null);
  const [threadReplyInputs, setThreadReplyInputs] = useState<Record<string, string>>({});

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : url;
  };

  const getGenreMetadata = (primary: string, micro: string) => {
    if (primary === 'All') {
      return {
        title: 'Collective Music Boards',
        desc: 'The ultimate space for heavy, experimental, and underground music. Switch genre circles below to explore!',
      };
    }
    if (micro === 'All') {
      return {
        title: `${primary} Hub`,
        desc: `Everything related to ${primary} acts, labels, and gear.`,
      };
    }
    return {
      title: `${micro} Board`,
      desc: `Discuss ${micro} album arts, reviews, gear setup, upcoming shows, and labels.`,
    };
  };

  const renderAvatarForName = (name: string) => {
    if (!name) return null;
    if (name === userProfile?.name && profileAvatarUrl) {
      return (
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
          <img src={profileAvatarUrl} className="w-full h-full object-cover" alt={name} />
        </div>
      );
    }
    const found =
      discoverProfiles.find((p) => p.name === name) ||
      allProfiles.find((p) => p.name === name);
    if (found && found.avatar) {
      return (
        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
          <img src={found.avatar} className="w-full h-full object-cover" alt={name} />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-full bg-rose-950/60 border border-rose-900/40 text-[9px] font-black text-rose-400 flex items-center justify-center shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    const authorName = getEffectiveUserHandle();
    const avatarUrl = profileAvatarUrl || (userProfile?.name?.charAt(0).toUpperCase() || 'F');
    const yId = newThreadYoutubeUrl ? getYouTubeId(newThreadYoutubeUrl) : undefined;
    const threadUUID = generateUUID();

    const newThread = {
      id: threadUUID,
      title: newThreadTitle,
      content: newThreadContent,
      category: newThreadCategory,
      genre: newThreadMicroGenre,
      primaryGenre: newThreadPrimaryGenre,
      author: authorName,
      authorAvatar: avatarUrl,
      image: newThreadMediaUrl || undefined,
      youtubeId: yId,
      timeAgo: 'Just now',
      votes: 1,
      userVote: 'up' as const,
      comments: [],
    };

    setForumThreads((prev) => {
      const updated = [newThread, ...prev];
      saveForumCache(updated);
      return updated;
    });

    // Persist to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        const primaryPayload: any = {
          id: threadUUID,
          title: newThreadTitle,
          content: newThreadContent,
          category: newThreadCategory,
          genre: newThreadMicroGenre,
          primary_genre: newThreadPrimaryGenre,
          author: authorName,
          author_name: authorName,
          user_id: userProfile?.id || null,
          author_avatar: avatarUrl,
          image_url: newThreadMediaUrl || null,
          youtube_id: yId || null,
          votes: 1,
        };

        const { data, error } = await supabase.from('forum_threads').insert([primaryPayload]).select('*');

        if (error) {
          console.warn('Supabase primary forum_threads insert error:', error.message || error);
          // Try fallback payload in case of schema column differences
          const fallbackPayload: any = {
            id: threadUUID,
            title: newThreadTitle,
            content: newThreadContent,
            category: newThreadCategory,
            genre: newThreadMicroGenre,
            author: authorName,
            author_avatar: avatarUrl,
            image_url: newThreadMediaUrl || null,
            youtube_id: yId || null,
            votes: 1,
          };
          const fallbackRes = await supabase.from('forum_threads').insert([fallbackPayload]).select('*');
          if (fallbackRes.error) {
            console.warn('Supabase fallback forum_threads insert error:', fallbackRes.error.message || fallbackRes.error);
            delete fallbackPayload.id;
            const noIdRes = await supabase.from('forum_threads').insert([fallbackPayload]).select('*');
            if (noIdRes.data && noIdRes.data[0]?.id) {
              const returnedId = String(noIdRes.data[0].id);
              setForumThreads((prev) => {
                const updated = prev.map((t) => (t.id === threadUUID ? { ...t, id: returnedId } : t));
                saveForumCache(updated);
                return updated;
              });
            }
          }
        }
      } catch (e) {
        console.warn('Failed to insert into Supabase forum_threads:', e);
      }
    }

    // Dispatch Notification to System
    window.dispatchEvent(
      new CustomEvent('nexus_add_notification', {
        detail: {
          title: `Discussion Published: ${newThreadCategory}`,
          message: `Your thread "${newThreadTitle}" is live on the ${newThreadMicroGenre} board!`,
          type: 'mention',
          targetTab: 'forum',
          author: authorName,
          avatar: avatarUrl,
        },
      })
    );

    setNewThreadTitle('');
    setNewThreadContent('');
    setNewThreadMediaUrl('');
    setNewThreadYoutubeUrl('');
    setNewThreadPrimaryGenre('Extreme Metal');
    setNewThreadMicroGenre('Death Metal');
    setShowCreateThread(false);
    setExpandedThreadId(null);
    triggerNotification?.('Thread published successfully!');
  };

  const handleVote = async (threadId: string, type: 'up' | 'down') => {
    const curThread = forumThreads.find((t) => t.id === threadId);
    let updatedVotes = 0;

    setForumThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          let diff = 0;
          let newVote: 'up' | 'down' | null = type;
          if (t.userVote === type) {
            diff = type === 'up' ? -1 : 1;
            newVote = null;
          } else if (t.userVote === null) {
            diff = type === 'up' ? 1 : -1;
          } else {
            diff = type === 'up' ? 2 : -2;
          }
          updatedVotes = t.votes + diff;
          return {
            ...t,
            votes: updatedVotes,
            userVote: newVote,
          };
        }
        return t;
      });
      saveForumCache(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('forum_threads').update({ votes: updatedVotes }).eq('id', threadId);
      } catch (e) {
        console.warn('Error updating votes in Supabase:', e);
      }
    }

    if (curThread && type === 'up') {
      window.dispatchEvent(
        new CustomEvent('nexus_add_notification', {
          detail: {
            title: 'Forum Thread Flame Reaction',
            message: `${userProfile?.name || 'A scene member'} gave a Flame reaction to "${curThread.title.slice(0, 40)}..."`,
            type: 'like',
            targetTab: 'forum',
            author: userProfile?.name || 'Fan',
            avatar: profileAvatarUrl,
          },
        })
      );
    }
  };

  const handleAddThreadComment = async (threadId: string) => {
    if (!threadCommentInput.trim()) return;
    const curThread = forumThreads.find((t) => t.id === threadId);
    const authorName = getEffectiveUserHandle();
    const commentUUID = generateUUID();

    const newComment = {
      id: commentUUID,
      author: authorName,
      text: threadCommentInput,
      timeAgo: 'Just now',
      likes: 0,
      replies: [],
    };

    setForumThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: [...(t.comments || []), newComment],
          };
        }
        return t;
      });
      saveForumCache(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase) {
      try {
        const commentPayload: any = {
          id: commentUUID,
          thread_id: threadId,
          parent_comment_id: null,
          author_name: authorName,
          user_id: userProfile?.id || null,
          author_avatar: profileAvatarUrl || null,
          text: threadCommentInput,
          likes: 0,
        };
        const { error } = await supabase.from('forum_comments').insert([commentPayload]);
        if (error) {
          console.warn('Notice inserting comment into Supabase forum_comments:', error.message || error);
          delete commentPayload.user_id;
          await supabase.from('forum_comments').insert([commentPayload]);
        }
      } catch (e) {
        console.warn('Error inserting comment to Supabase forum_comments:', e);
      }
    }

    // Dispatch Notification to Notification System
    window.dispatchEvent(
      new CustomEvent('nexus_add_notification', {
        detail: {
          title: `New Comment on Forum Post`,
          message: `${authorName} commented on "${curThread?.title.slice(0, 40) || 'Discussion'}": "${threadCommentInput.slice(0, 50)}..."`,
          type: 'comment',
          targetTab: 'forum',
          author: authorName,
          avatar: profileAvatarUrl,
        },
      })
    );

    setThreadCommentInput('');
    triggerNotification?.('Comment posted!');
  };

  const handleAddThreadReply = async (threadId: string, commentId: string) => {
    const text = threadReplyInputs[commentId];
    if (!text || !text.trim()) return;
    const curThread = forumThreads.find((t) => t.id === threadId);
    const authorName = getEffectiveUserHandle();
    const replyUUID = generateUUID();

    const newReply = {
      id: replyUUID,
      author: authorName,
      text: text,
      timeAgo: 'Just now',
      likes: 0,
    };

    setForumThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: (t.comments || []).map((c: any) => {
              if (c.id === commentId) {
                return {
                  ...c,
                  replies: c.replies ? [...c.replies, newReply] : [newReply],
                };
              }
              return c;
            }),
          };
        }
        return t;
      });
      saveForumCache(updated);
      return updated;
    });

    const supabase = getSupabase();
    if (supabase) {
      try {
        const replyPayload: any = {
          id: replyUUID,
          thread_id: threadId,
          parent_comment_id: commentId,
          author_name: authorName,
          user_id: userProfile?.id || null,
          author_avatar: profileAvatarUrl || null,
          text: text,
          likes: 0,
        };
        const { error } = await supabase.from('forum_comments').insert([replyPayload]);
        if (error) {
          console.warn('Notice inserting reply into Supabase forum_comments:', error.message || error);
          delete replyPayload.user_id;
          await supabase.from('forum_comments').insert([replyPayload]);
        }
      } catch (e) {
        console.warn('Error inserting reply to Supabase forum_comments:', e);
      }
    }

    // Dispatch Notification to System
    window.dispatchEvent(
      new CustomEvent('nexus_add_notification', {
        detail: {
          title: `New Reply on Forum Comment`,
          message: `${authorName} replied on thread "${curThread?.title.slice(0, 35) || 'Discussion'}": "${text.slice(0, 45)}..."`,
          type: 'comment',
          targetTab: 'forum',
          author: authorName,
          avatar: profileAvatarUrl,
        },
      })
    );

    setThreadReplyInputs((prev) => ({ ...prev, [commentId]: '' }));
    setActiveThreadReplyCommentId(null);
    triggerNotification?.('Reply posted!');
  };

  const handleVoteThreadComment = (threadId: string, commentId: string, type: 'up' | 'down') => {
    setForumThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map((c: any) => {
              if (c.id === commentId) {
                const currentVote = c.myVote;
                let newVote = currentVote === type ? undefined : type;
                let scoreChange = 0;
                if (currentVote === 'up') scoreChange -= 1;
                if (currentVote === 'down') scoreChange += 1;
                if (newVote === 'up') scoreChange += 1;
                if (newVote === 'down') scoreChange -= 1;
                return { ...c, myVote: newVote, likes: (c.likes || 0) + scoreChange };
              }
              return c;
            }),
          };
        }
        return t;
      })
    );
  };

  const handleVoteThreadReply = (threadId: string, commentId: string, replyId: string, type: 'up' | 'down') => {
    setForumThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            comments: t.comments.map((c: any) => {
              if (c.id === commentId && c.replies) {
                return {
                  ...c,
                  replies: c.replies.map((r: any) => {
                    if (r.id === replyId) {
                      const currentVote = r.myVote;
                      let newVote = currentVote === type ? undefined : type;
                      let scoreChange = 0;
                      if (currentVote === 'up') scoreChange -= 1;
                      if (currentVote === 'down') scoreChange += 1;
                      if (newVote === 'up') scoreChange += 1;
                      if (newVote === 'down') scoreChange -= 1;
                      return { ...r, myVote: newVote, likes: (r.likes || 0) + scoreChange };
                    }
                    return r;
                  }),
                };
              }
              return c;
            }),
          };
        }
        return t;
      })
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-20 animate-in fade-in duration-300">
      {/* Forum Header Banner (Centered) */}
      <div className="bg-[#101014] border border-zinc-900/90 rounded-2xl p-5 mb-4 flex flex-col items-center justify-center text-center gap-3 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
            The Forums
          </h2>
          <p className="text-xs text-zinc-400 font-medium">
            The place to discuss all things music.
          </p>
        </div>

        <button
          onClick={() => setShowCreateThread(!showCreateThread)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-150 shadow-md shadow-rose-900/30 font-bold cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          {showCreateThread ? 'View Board' : 'New Discussion'}
        </button>

        {forumMicroGenre !== 'All' && (
          <button
            onClick={() => toggleSubscribeSpace(forumMicroGenre)}
            className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subscribedSpaces.includes(forumMicroGenre)
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {subscribedSpaces.includes(forumMicroGenre) ? (
              <>
                <Check className="w-3.5 h-3.5 text-rose-400" /> Subscribed to {forumMicroGenre}
              </>
            ) : (
              <>
                <BellPlus className="w-3.5 h-3.5 text-rose-400" /> Subscribe to {forumMicroGenre}
              </>
            )}
          </button>
        )}
      </div>

      {/* Edit Thread Modal Overlay */}
      {editingThreadId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-rose-900/50 rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Edit2 className="w-4 h-4" /> Edit Discussion Thread
              </h3>
              <button
                onClick={() => setEditingThreadId(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Thread Title</label>
              <input
                type="text"
                value={editThreadTitle}
                onChange={(e) => setEditThreadTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-900/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Category Topic</label>
                <select
                  value={editThreadCategory}
                  onChange={(e) => setEditThreadCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Album Art">Album Art</option>
                  <option value="Album Reviews">Album Reviews</option>
                  <option value="Show & Fest">Show & Fest</option>
                  <option value="Gear & Rig">Gear & Rig</option>
                  <option value="Recommendations">Recommendations</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Genre Circle</label>
                <input
                  type="text"
                  value={editThreadGenre}
                  onChange={(e) => setEditThreadGenre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Thread Content</label>
              <textarea
                value={editThreadContent}
                onChange={(e) => setEditThreadContent(e.target.value)}
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none resize-none"
              />
            </div>
            <div>
              <NativeMediaUploader
                value={editThreadMediaUrl}
                onChange={setEditThreadMediaUrl}
                label="Attached Media (Image or Audio/Music Track)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-900">
              <button
                onClick={() => setEditingThreadId(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveThreadEdit(editingThreadId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase rounded-xl transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Thread Form Box */}
      {showCreateThread ? (
        <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 mb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <h3 className="text-sm font-black uppercase tracking-wider text-rose-400">Start a New Discussion Thread</h3>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Thread Title</label>
            <input
              type="text"
              placeholder="e.g., Cryptopsy's new mix sounds incredibly punchy..."
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-900/50"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Category Topic</label>
              <select
                value={newThreadCategory}
                onChange={(e) => setNewThreadCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-900/50 font-bold cursor-pointer"
              >
                <option value="Album Art">Album Art</option>
                <option value="Album Reviews">Album Reviews</option>
                <option value="Show & Fest">Show & Fest Discussion</option>
                <option value="Gear & Rig">Gear & Rig Talk</option>
                <option value="Recommendations">Recommendations / Recs</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Music Genre Circle</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={newThreadPrimaryGenre}
                  onChange={(e) => {
                    setNewThreadPrimaryGenre(e.target.value);
                    const firstTag = MASTER_GENRES.find((c) => c.name === e.target.value)?.tags[0]?.label || 'General';
                    setNewThreadMicroGenre(firstTag);
                  }}
                  className="w-full sm:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-900/50 font-bold cursor-pointer"
                >
                  {MASTER_GENRES.map((cluster, idx) => (
                    <option key={`cluster-${cluster.name}-${idx}`} value={cluster.name}>{cluster.name}</option>
                  ))}
                </select>
                <select
                  value={newThreadMicroGenre}
                  onChange={(e) => setNewThreadMicroGenre(e.target.value)}
                  className="w-full sm:flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-900/50 font-bold cursor-pointer"
                >
                  {MASTER_GENRES.find((c) => c.name === newThreadPrimaryGenre)?.tags.map((tag, tagIdx) => (
                    <option key={`tag-${tag.id}-${tagIdx}`} value={tag.label}>{tag.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5">Thread Content</label>
            <textarea
              placeholder="Type your discussion point in detail. Mention bands, venues, labels or dates..."
              value={newThreadContent}
              onChange={(e) => setNewThreadContent(e.target.value)}
              rows={5}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-rose-900/50 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => { setShowThreadMediaInput(!showThreadMediaInput); setShowThreadYoutubeInput(false); }}
              className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg transition-colors border cursor-pointer ${showThreadMediaInput || newThreadMediaUrl ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'}`}
            >
              <Upload className="w-3 h-3" /> + Upload Media / Track
            </button>
            <button
              onClick={() => { setShowThreadYoutubeInput(!showThreadYoutubeInput); setShowThreadMediaInput(false); }}
              className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1.5 rounded-lg transition-colors border cursor-pointer ${showThreadYoutubeInput ? 'bg-rose-950 text-rose-400 border-rose-900' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-800'}`}
            >
              <Youtube className="w-3 h-3 text-rose-500" /> + YouTube
            </button>
          </div>

          {(showThreadMediaInput || newThreadMediaUrl) && (
            <div className="mt-2 animate-in fade-in duration-200">
              <NativeMediaUploader
                value={newThreadMediaUrl}
                onChange={setNewThreadMediaUrl}
                label="Attach Image or Music Track from Device"
              />
            </div>
          )}

          {showThreadYoutubeInput && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-2 flex gap-2 items-center animate-in fade-in duration-200 mt-2">
              <input
                type="text"
                value={newThreadYoutubeUrl}
                onChange={(e) => setNewThreadYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube Video ID or URL"
                className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowCreateThread(false)}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateThread}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Post Thread
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Genre Selector Dropdown & Space Subscriptions Bar */}
          <div className="flex flex-col items-start gap-3 mb-5 bg-zinc-950/60 border border-purple-900/40 shadow-[0_0_25px_rgba(168,85,247,0.2)] rounded-2xl p-4 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Current Circle:</span>
                <div className="flex items-center gap-1.5 bg-rose-950/30 border border-rose-900/40 px-3 py-1 rounded-full text-xs font-black text-rose-400 uppercase tracking-wide whitespace-nowrap shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {forumPrimaryGenre === 'All' ? '🌌 All Genres Collective' : (forumMicroGenre === 'All' ? `All ${forumPrimaryGenre}` : forumMicroGenre)}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full md:w-auto">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider shrink-0">Switch Circle:</label>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <select
                    value={forumPrimaryGenre}
                    onChange={(e) => {
                      setForumPrimaryGenre(e.target.value);
                      setForumMicroGenre('All');
                      triggerNotification?.(`Switched primary circle to ${e.target.value}`);
                    }}
                    className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-white rounded-xl px-3 py-2 focus:outline-none hover:border-zinc-700 transition-colors cursor-pointer uppercase tracking-wider min-w-[130px]"
                  >
                    <option value="All">All Categories</option>
                    {MASTER_GENRES.map((cluster, idx) => (
                      <option key={`fcluster-${cluster.name}-${idx}`} value={cluster.name}>{cluster.name}</option>
                    ))}
                  </select>

                  {forumPrimaryGenre !== 'All' && (
                    <select
                      value={forumMicroGenre}
                      onChange={(e) => {
                        setForumMicroGenre(e.target.value);
                        triggerNotification?.(`Switched to ${e.target.value}`);
                      }}
                      className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-white rounded-xl px-3 py-2 focus:outline-none hover:border-zinc-700 transition-colors cursor-pointer uppercase tracking-wider min-w-[130px]"
                    >
                      <option value="All">All {forumPrimaryGenre}</option>
                      {MASTER_GENRES.find((c) => c.name === forumPrimaryGenre)?.tags.map((tag, tagIdx) => (
                        <option key={`ftag-${tag.id}-${tagIdx}`} value={tag.label}>{tag.label}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Subscribed Spaces Bar */}
            <div className="w-full pt-3 border-t border-zinc-900 flex items-center gap-2 flex-wrap text-[10px]">
              <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Bell className="w-3 h-3 text-rose-400" /> Subscribed Spaces:
              </span>
              {subscribedSpaces.length === 0 ? (
                <span className="text-zinc-600 font-mono italic">No subscriptions yet</span>
              ) : (
                subscribedSpaces.map((space, sIdx) => (
                  <span
                    key={`subscribed-space-${space}-${sIdx}`}
                    className="bg-rose-950/40 border border-rose-900/50 text-rose-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold"
                  >
                    {space}
                    <button
                      onClick={() => toggleSubscribeSpace(space)}
                      className="hover:text-white transition-colors cursor-pointer ml-0.5"
                      title="Unsubscribe"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Topic Tag Pills & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
            <div className="relative w-full sm:flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder={`Search in ${forumPrimaryGenre === 'All' ? 'all circles' : forumMicroGenre}...`}
                value={forumSearch}
                onChange={(e) => setForumSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
              {['All', 'My Subscriptions', 'Album Art', 'Album Reviews', 'Show & Fest', 'Gear & Rig'].map((cat, catIdx) => (
                <button
                  key={`forum-cat-${cat}-${catIdx}`}
                  onClick={() => setForumCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                    forumCategory === cat
                      ? 'bg-rose-950 text-rose-400 border border-rose-900/80'
                      : 'bg-zinc-950 text-zinc-500 border border-zinc-900 hover:text-zinc-300'
                  }`}
                >
                  {cat === 'My Subscriptions' ? `🔔 Subscriptions (${subscribedSpaces.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Threads List or Single Thread Expanded */}
          {expandedThreadId ? (
            (() => {
              const thread = forumThreads.find((t) => t.id === expandedThreadId);
              if (!thread) return null;
              return (
                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => { setExpandedThreadId(null); setThreadCommentInput(''); }}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Forums
                    </button>

                    {/* Owner controls on expanded thread */}
                    {isUserOwner(thread.author) && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEditThread(thread)}
                          className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-rose-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteThread(thread.id, thread.title)}
                          className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 text-rose-400 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/40 border border-rose-900/60 px-2.5 py-0.5 rounded-full">
                          {thread.category}
                        </span>
                        {thread.genre && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-950/40 border border-purple-900/60 px-2.5 py-0.5 rounded-full font-mono">
                            {thread.genre}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{thread.timeAgo}</span>
                    </div>
                    <h3 className="text-lg font-black text-white leading-snug">{thread.title}</h3>
                    <div className="flex items-center gap-2">
                      {thread.authorAvatar ? (
                        <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-900/50">
                          <img src={thread.authorAvatar} alt={formatForumAuthor(thread.author)} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        renderAvatarForName(thread.author)
                      )}
                      <span className="text-xs text-zinc-300 font-bold">posted by {formatForumAuthor(thread.author)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap bg-zinc-950/50 p-4 rounded-xl border border-zinc-900/60 font-medium">
                    {thread.content}
                  </p>

                  {thread.youtubeId && (
                    <div className="w-full aspect-video rounded-xl overflow-hidden border border-zinc-800">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${thread.youtubeId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  {thread.image && (
                    isAudioUrl(thread.image) ? (
                      <div className="w-full mt-2 p-3 bg-zinc-950/90 border border-rose-900/50 rounded-xl space-y-2 shadow-sm">
                        <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                          <Volume2 className="w-4 h-4 text-rose-500 animate-pulse" /> Attached Music / Audio Track
                        </div>
                        <audio controls src={thread.image} className="w-full h-9 rounded bg-zinc-900" />
                      </div>
                    ) : isVideoUrl(thread.image) ? (
                      <div className="w-full mt-2 rounded-xl overflow-hidden border border-zinc-800 bg-black">
                        <video controls src={thread.image} className="w-full max-h-[500px]" />
                      </div>
                    ) : (
                      <div className="w-full rounded-xl overflow-hidden border border-zinc-800 mt-2">
                        <img src={thread.image} alt="Thread attachment" className="w-full object-cover" />
                      </div>
                    )
                  )}

                  <div className="flex items-center gap-3 py-2.5 border-y border-zinc-900/80">
                    {/* Upvote / Downvote Pill Node */}
                    <div className="inline-flex items-center gap-1 bg-zinc-950 border border-zinc-800/90 rounded-full px-2.5 py-1 shadow-sm">
                      <button
                        onClick={() => handleVote(thread.id, 'up')}
                        className={`p-0.5 hover:text-rose-400 transition-colors cursor-pointer ${
                          thread.userVote === 'up' ? 'text-rose-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Upvote / Flame"
                      >
                        <Flame className="w-4 h-4 fill-current" />
                      </button>
                      <span className="text-xs font-mono font-black text-white px-1">{thread.votes}</span>
                      <button
                        onClick={() => handleVote(thread.id, 'down')}
                        className={`p-0.5 hover:text-purple-400 transition-colors cursor-pointer ${
                          thread.userVote === 'down' ? 'text-purple-500 scale-110' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                        title="Downvote"
                      >
                        <Zap className="w-4 h-4 rotate-180 fill-current" />
                      </button>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-950 border border-zinc-800/90 rounded-full px-3 py-1 text-xs font-mono">
                      <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{thread.comments.length} {thread.comments.length === 1 ? 'Comment' : 'Comments'}</span>
                    </span>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Comments</h4>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add your constructive voice to this thread..."
                        value={threadCommentInput}
                        onChange={(e) => setThreadCommentInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddThreadComment(thread.id); }}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-rose-900/50"
                      />
                      <button
                        onClick={() => handleAddThreadComment(thread.id)}
                        className="px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Comment
                      </button>
                    </div>

                    <div className="space-y-4 pt-2">
                      {thread.comments.slice().reverse().map((comment: any, cIdx: number) => (
                        <div key={comment.id ? `fcomm-${comment.id}-${cIdx}` : `fcomm-${cIdx}`} className="bg-zinc-950/40 border border-[#00ffcc]/30 rounded-xl p-3.5 space-y-2 hover:border-[#00ffcc]/40 transition-all">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5">
                              {renderAvatarForName(comment.author)}
                              <span className="text-xs font-black text-zinc-300">{formatForumAuthor(comment.author)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-zinc-600 font-mono">{comment.timeAgo}</span>
                              {isUserOwner(comment.author) && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleStartEditComment(comment)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Edit Comment"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(thread.id, comment.id)}
                                    className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="Delete Comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="flex gap-2 my-2">
                              <input
                                type="text"
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-white"
                              />
                              <button
                                onClick={() => handleSaveCommentEdit(thread.id, comment.id)}
                                className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 ml-6.5">{comment.text}</p>
                          )}

                          {comment.replies && comment.replies.length > 0 && (
                            <div className="border-l border-[#00ffcc]/30 pl-3 ml-6.5 mt-2 space-y-2 bg-black/15 p-2 rounded-lg">
                              {comment.replies.map((rep: any, rIdx: number) => (
                                <div key={rep.id ? `frep-${rep.id}-${rIdx}` : `frep-${rIdx}`} className="text-[11px] space-y-0.5">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      {renderAvatarForName(rep.author)}
                                      <span className="font-bold text-zinc-400">{formatForumAuthor(rep.author)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[8px] text-zinc-600 font-mono">{rep.timeAgo}</span>
                                      {isUserOwner(rep.author) && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleStartEditReply(rep)}
                                            className="p-0.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                            title="Edit Reply"
                                          >
                                            <Edit2 className="w-2.5 h-2.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteReply(thread.id, comment.id, rep.id)}
                                            className="p-0.5 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                            title="Delete Reply"
                                          >
                                            <Trash2 className="w-2.5 h-2.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {editingReplyId === rep.id ? (
                                    <div className="flex gap-2 my-1">
                                      <input
                                        type="text"
                                        value={editingReplyText}
                                        onChange={(e) => setEditingReplyText(e.target.value)}
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[10px] text-white"
                                      />
                                      <button
                                        onClick={() => handleSaveReplyEdit(thread.id, comment.id, rep.id)}
                                        className="px-2 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded cursor-pointer"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingReplyId(null)}
                                        className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] font-bold rounded cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <p className="text-zinc-300 ml-6.5">{rep.text}</p>
                                  )}

                                  <div className="mt-1 flex items-center gap-2 ml-6.5">
                                    <button
                                      onClick={() => handleVoteThreadReply(thread.id, comment.id, rep.id, rep.myVote === 'up' ? 'down' : 'up')}
                                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors text-[9px] font-bold uppercase cursor-pointer ${rep.myVote === 'up' ? 'text-rose-500 bg-rose-500/10 border border-rose-900/30' : 'text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800'}`}
                                    >
                                      <Flame className={`w-3 h-3 ${rep.myVote === 'up' ? 'fill-current' : ''}`} /> {rep.likes || 0}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 ml-6.5 flex justify-between items-center">
                            <button
                              onClick={() => handleVoteThreadComment(thread.id, comment.id, comment.myVote === 'up' ? 'down' : 'up')}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors text-[10px] font-bold uppercase cursor-pointer ${comment.myVote === 'up' ? 'text-rose-500 bg-rose-500/10 border border-rose-900/30' : 'text-zinc-500 hover:text-white bg-zinc-900 border border-zinc-800'}`}
                            >
                              <Flame className={`w-3 h-3 ${comment.myVote === 'up' ? 'fill-current' : ''}`} /> {comment.likes || 0}
                            </button>
                            <button
                              onClick={() => setActiveThreadReplyCommentId(activeThreadReplyCommentId === comment.id ? null : comment.id)}
                              className="text-[9px] font-black uppercase text-rose-400/80 hover:text-rose-400 tracking-wider transition-colors cursor-pointer"
                            >
                              {activeThreadReplyCommentId === comment.id ? 'Cancel' : 'Reply'}
                            </button>
                          </div>

                          {activeThreadReplyCommentId === comment.id && (
                            <div className="flex gap-2 mt-2 pt-2 border-t border-zinc-900">
                              <input
                                type="text"
                                placeholder={`Reply to ${formatForumAuthor(comment.author)}...`}
                                value={threadReplyInputs[comment.id] || ''}
                                onChange={(e) => setThreadReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddThreadReply(thread.id, comment.id); }}
                                className="flex-1 bg-zinc-900 border border-zinc-855 rounded px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-rose-900/50"
                              />
                              <button
                                onClick={() => handleAddThreadReply(thread.id, comment.id)}
                                className="bg-rose-950/60 text-rose-300 border border-rose-900/40 px-2 rounded text-[10px] font-bold hover:bg-rose-900 transition-colors cursor-pointer"
                              >
                                Send
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="space-y-2.5">
              {(() => {
                const filteredList = forumThreads
                  .filter((t) => {
                    if (forumCategory === 'All') return true;
                    if (forumCategory === 'My Subscriptions') {
                      return (
                        subscribedSpaces.includes(t.genre) ||
                        subscribedSpaces.includes(t.category) ||
                        subscribedSpaces.includes(t.primaryGenre)
                      );
                    }
                    return t.category === forumCategory;
                  })
                  .filter((t) => {
                    if (forumPrimaryGenre === 'All') return true;
                    const cluster = MASTER_GENRES.find((c) => c.name === forumPrimaryGenre);
                    if (!cluster) return false;
                    const validTags = cluster.tags.map((tag) => tag.label);
                    if (forumMicroGenre === 'All') {
                      return validTags.includes(t.genre);
                    }
                    return t.genre === forumMicroGenre;
                  })
                  .filter(
                    (t) =>
                      t.title.toLowerCase().includes(forumSearch.toLowerCase()) ||
                      t.content.toLowerCase().includes(forumSearch.toLowerCase())
                  );

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-12 px-4 bg-[#121214] border border-zinc-900 rounded-2xl space-y-3">
                      <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold uppercase text-white font-mono">No Discussions Found</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        No threads match your current filter or search criteria. Be the first to start a discussion!
                      </p>
                      <button
                        onClick={() => setShowCreateThread(true)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                      >
                        + Start New Discussion
                      </button>
                    </div>
                  );
                }

                return filteredList.map((thread, tIdx) => {
                  const hasImage = thread.image && !isAudioUrl(thread.image) && !isVideoUrl(thread.image);
                  const hasVideo = thread.image && isVideoUrl(thread.image);
                  const hasAudio = thread.image && isAudioUrl(thread.image);
                  const hasYoutube = !!thread.youtubeId;

                  return (
                    <div
                      key={thread.id ? `thread-${thread.id}-${tIdx}` : `thread-${tIdx}`}
                      onClick={() => setExpandedThreadId(thread.id)}
                      className="bg-[#121214] hover:bg-[#15161a] border border-zinc-900/90 hover:border-zinc-800 rounded-xl p-3 sm:p-3.5 cursor-pointer transition-all duration-150 flex flex-col justify-between gap-2.5 relative group shadow-sm"
                    >
                      {/* Top row: Badges & Author */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap text-[10px] text-zinc-500 font-bold">
                          <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-950/30 border border-rose-900/40 px-2 py-0.5 rounded-full shrink-0">
                            {thread.category}
                          </span>
                          {thread.genre && (
                            <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-950/30 border border-purple-900/40 px-2 py-0.5 rounded-full font-mono shrink-0">
                              {thread.genre}
                            </span>
                          )}
                          <span className="text-zinc-600">•</span>
                        </div>

                        {/* Author line */}
                        <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
                          {thread.authorAvatar ? (
                            <div className="w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 border border-zinc-800">
                              <img src={thread.authorAvatar} alt={formatForumAuthor(thread.author)} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            renderAvatarForName(thread.author)
                          )}
                          <span className="truncate max-w-[160px] text-zinc-300 font-mono text-xs font-bold">{formatForumAuthor(thread.author)}</span>
                        </div>
                      </div>

                      {/* Middle row: Title & Concise Excerpt on left, Media Thumbnail on right */}
                      <div className="flex gap-3 sm:gap-4 items-center justify-between">
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors leading-snug line-clamp-2">
                            {thread.title}
                          </h3>
                          <p className="text-xs text-zinc-400 line-clamp-2 font-normal leading-relaxed">
                            {thread.content}
                          </p>
                        </div>

                        {/* Right: Small preview of attached image / media */}
                        {(hasYoutube || hasImage || hasVideo) && (
                          <div className="shrink-0">
                            {hasYoutube ? (
                              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-800 overflow-hidden bg-black shadow-inner">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={`https://img.youtube.com/vi/${thread.youtubeId}/hqdefault.jpg`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  alt="YouTube preview"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                  <PlayCircle className="w-4 h-4 text-white/90 drop-shadow" />
                                </div>
                              </div>
                            ) : hasVideo ? (
                              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 shadow-inner flex items-center justify-center">
                                <video src={thread.image} className="w-full h-full object-cover pointer-events-none" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                                  <PlayCircle className="w-4 h-4 text-white/90 drop-shadow" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 shadow-inner">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={thread.image}
                                  alt="Attached image preview"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer row: Pill-shaped Upvote/Downvote next to Comments + Media badges + Read Full (all on same level) */}
                      <div className="flex items-center justify-between gap-2 pt-1 text-[10px] text-zinc-500 font-bold w-full">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          {/* Upvote / Downvote Pill Node */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 bg-zinc-950 border border-zinc-800/90 hover:border-zinc-700 rounded-full px-2 py-0.5 text-[11px] shadow-sm transition-colors shrink-0"
                          >
                            <button
                              onClick={() => handleVote(thread.id, 'up')}
                              className={`p-0.5 transition-colors cursor-pointer ${
                                thread.userVote === 'up' ? 'text-rose-500 scale-110' : 'text-zinc-500 hover:text-rose-400'
                              }`}
                              title="Upvote / Flame"
                            >
                              <Flame className="w-3 h-3 fill-current" />
                            </button>
                            <span className="font-mono font-black text-white text-[10px] px-1 min-w-[14px] text-center">
                              {thread.votes}
                            </span>
                            <button
                              onClick={() => handleVote(thread.id, 'down')}
                              className={`p-0.5 transition-colors cursor-pointer ${
                                thread.userVote === 'down' ? 'text-purple-500 scale-110' : 'text-zinc-500 hover:text-purple-400'
                              }`}
                              title="Downvote"
                            >
                              <Zap className="w-3 h-3 rotate-180 fill-current" />
                            </button>
                          </div>

                          {/* Comments Count Pill */}
                          <span className="inline-flex items-center gap-1.5 text-zinc-400 bg-zinc-950 border border-zinc-800/90 rounded-full px-2.5 py-0.5 text-[10px] font-mono group-hover:text-zinc-200 transition-colors whitespace-nowrap shrink-0">
                            <MessageSquare className="w-3 h-3 text-zinc-500" />
                            <span>{thread.comments?.length || 0} {thread.comments?.length === 1 ? 'Comment' : 'Comments'}</span>
                          </span>

                          {/* Compact Media Type Indicators (audio/video/youtube only) */}
                          {hasAudio && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-rose-400 bg-rose-950/40 border border-rose-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                              <Volume2 className="w-2.5 h-2.5 text-rose-500" /> Audio Track
                            </span>
                          )}
                          {hasVideo && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-sky-400 bg-sky-950/40 border border-sky-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                              <Film className="w-2.5 h-2.5 text-sky-400" /> Video
                            </span>
                          )}
                          {hasYoutube && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-red-400 bg-red-950/40 border border-red-900/40 px-1.5 py-0.5 rounded-full shrink-0">
                              <Youtube className="w-2.5 h-2.5 text-red-500" /> YouTube
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-rose-400 flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap">
                          <span>Read Full</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ForumView;
