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
  ChevronDown,
  Skull,
} from 'lucide-react';
import { MASTER_GENRES } from '../../constants/genres';
import { getSupabase } from '../../supabase';
import { uploadBase64ToStorage } from '../../services/storageService';
import {
  BRUTAL_DEATH_METAL_HIGHLIGHTS,
  LEGACY_MOCK_THREAD_IDS,
  LEGACY_MOCK_TITLES,
  isRetiredNonExtremeMock,
} from '../../services/forumHighlightService';
import { initialForumThreads } from '../../data/forumMockData';
import { FirstTimeTooltip } from '../common/FirstTimeTooltip';
import { BirthdayShoutoutBadge } from './BirthdayShoutoutBadge';
import { buildBirthdayHornsMessage, isMutualConnection } from '../../utils/birthdayUtils';
import { isProfileFollowedGlobally } from '../../utils/followSyncService';
import { sendDirectMessage } from '../../store/useChatStore';

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
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string) || '';
        if (base64) {
          const storageUrl = await uploadBase64ToStorage(base64, 'forum-media', 'forum', 'forum-upload');
          resolve(storageUrl || base64);
        } else {
          resolve('');
        }
      };
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
    console.warn('[Forum Storage] Bucket upload failed, using storage service fallback:', err);
  }

  // Convert to base64 and upload via storage service to storage bucket
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string) || '';
      if (base64) {
        const storageUrl = await uploadBase64ToStorage(base64, 'forum-media', 'forum', 'forum-upload');
        resolve(storageUrl || base64);
      } else {
        resolve('');
      }
    };
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
        className="sr-only"
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

export function getCategoryAccentClasses(category?: string): {
  text: string;
  dot: string;
  tint: string;
} {
  switch ((category || '').toLowerCase()) {
    case 'album art':
      return { text: 'text-fuchsia-400', dot: 'bg-fuchsia-400', tint: 'border-fuchsia-500/30 bg-fuchsia-950/30' };
    case 'album reviews':
      return { text: 'text-teal-300', dot: 'bg-teal-400', tint: 'border-teal-500/30 bg-teal-950/30' };
    case 'show & fest':
      return { text: 'text-amber-300', dot: 'bg-amber-400', tint: 'border-amber-500/30 bg-amber-950/30' };
    case 'gear & rig':
      return { text: 'text-sky-300', dot: 'bg-sky-400', tint: 'border-sky-500/30 bg-sky-950/30' };
    case 'recommendations':
      return { text: 'text-emerald-300', dot: 'bg-emerald-400', tint: 'border-emerald-500/30 bg-emerald-950/30' };
    default:
      return { text: 'text-rose-400', dot: 'bg-rose-400', tint: 'border-rose-500/30 bg-rose-950/30' };
  }
}

export function getThreadActivityBadge(thread: any): 'trending' | 'new_replies' | null {
  const votes = Number(thread?.votes) || 0;
  const commentsCount = Array.isArray(thread?.comments) ? thread.comments.length : 0;
  if (votes >= 95 || commentsCount >= 3) return 'trending';
  if (commentsCount > 0) {
    const latestReplyTime = String(thread.comments[commentsCount - 1]?.timeAgo || '').toLowerCase();
    if (
      latestReplyTime.includes('just now') ||
      latestReplyTime.includes('m ago') ||
      latestReplyTime === '1h ago' ||
      latestReplyTime === '2h ago'
    ) {
      return 'new_replies';
    }
  }
  return null;
}

export function getThreadRecencyScore(thread: any, fallbackIndex: number): number {
  if (thread?.createdAt) {
    const ms = Date.parse(thread.createdAt);
    if (Number.isFinite(ms)) return ms;
  }
  const t = String(thread?.timeAgo || '').toLowerCase().trim();
  const now = Date.now();
  if (t === 'just now') return now;
  const minMatch = t.match(/^(\d+)\s*m/);
  if (minMatch) return now - Number(minMatch[1]) * 60_000;
  const hrMatch = t.match(/^(\d+)\s*h/);
  if (hrMatch) return now - Number(hrMatch[1]) * 3_600_000;
  const dayMatch = t.match(/^(\d+)\s*d/);
  if (dayMatch) return now - Number(dayMatch[1]) * 86_400_000;
  return now - (fallbackIndex + 100) * 86_400_000;
}

export const SEEDED_FORUM_THRESHOLD = 10;

const SEEDED_FORUM_IDS = new Set([
  ...LEGACY_MOCK_THREAD_IDS,
  'bdm-h1',
  'bdm-h2',
]);

const SEEDED_FORUM_TITLES = new Set([
  ...LEGACY_MOCK_TITLES,
  "suffocation — pierced from within snare ping vs. effigy's raw cavern mix",
  'defeated sanity & devourment: guttural slam riff architecture breakdown',
]);

export function isSeededForumThread(thread: any): boolean {
  if (!thread) return false;
  if (thread.isSeeded === true) return true;
  if (thread.isUserCreated === true) return false;
  const id = String(thread.id || '');
  if (SEEDED_FORUM_IDS.has(id)) return true;
  const title = String(thread.title || '').trim().toLowerCase();
  if (SEEDED_FORUM_TITLES.has(title)) {
    return true;
  }
  return false;
}

export function isThreadHighlighted(thread: any, allThreads: any[]): boolean {
  if (!thread || isSeededForumThread(thread)) return false;
  const realThreads = (allThreads || []).filter((t) => !isSeededForumThread(t));
  if (realThreads.length === 0 || realThreads.length >= SEEDED_FORUM_THRESHOLD) return false;
  const highlightedIds = new Set(realThreads.slice(0, 3).map((t) => String(t.id)));
  return highlightedIds.has(String(thread.id));
}

export interface ForumFilterOptions {
  category: string;
  sort: 'hot' | 'new';
  primaryGenre: string;
  microGenre: string;
  subscribedSpaces: string[];
  searchQuery: string;
}

export function filterAndSortForumThreads(
  threads: any[],
  opts: ForumFilterOptions
): any[] {
  const q = (opts.searchQuery || '').trim().toLowerCase();
  const sourceThreads = (threads || []).filter((t) => t && !isRetiredNonExtremeMock(t));
  const realCount = sourceThreads.filter((t) => !isSeededForumThread(t)).length;
  const hideSeeded = realCount >= SEEDED_FORUM_THRESHOLD;
  const prioritizeRealOverSeeded = realCount > 0 && !hideSeeded;

  const filtered = sourceThreads
    .filter((t) => (hideSeeded ? !isSeededForumThread(t) : true))
    .map((t, idx) => ({ t, idx }))
    .filter(({ t }) => {
      if (opts.category === 'All') return true;
      if (opts.category === 'My Subscriptions') {
        return (
          opts.subscribedSpaces.includes(t.genre) ||
          opts.subscribedSpaces.includes(t.category) ||
          opts.subscribedSpaces.includes(t.primaryGenre)
        );
      }
      return t.category === opts.category;
    })
    .filter(({ t }) => {
      if (opts.primaryGenre === 'All') return true;
      const cluster = MASTER_GENRES.find((c) => c.name === opts.primaryGenre);
      if (!cluster) return false;
      const validTags = cluster.tags.map((tag) => tag.label);
      if (opts.microGenre === 'All') {
        return validTags.includes(t.genre);
      }
      return t.genre === opts.microGenre;
    })
    .filter(({ t }) => {
      if (!q) return true;
      return (
        String(t.title || '').toLowerCase().includes(q) ||
        String(t.content || '').toLowerCase().includes(q) ||
        String(t.author || '').toLowerCase().includes(q) ||
        String(t.genre || '').toLowerCase().includes(q)
      );
    });

  filtered.sort((a, b) => {
    if (prioritizeRealOverSeeded) {
      const aSeeded = isSeededForumThread(a.t);
      const bSeeded = isSeededForumThread(b.t);
      if (aSeeded !== bSeeded) {
        return aSeeded ? 1 : -1;
      }
    }
    if (opts.sort === 'new') {
      return getThreadRecencyScore(b.t, b.idx) - getThreadRecencyScore(a.t, a.idx);
    }
    const scoreA = (Number(a.t.votes) || 0) + (Array.isArray(a.t.comments) ? a.t.comments.length * 4 : 0);
    const scoreB = (Number(b.t.votes) || 0) + (Array.isArray(b.t.comments) ? b.t.comments.length * 4 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return getThreadRecencyScore(b.t, b.idx) - getThreadRecencyScore(a.t, a.idx);
  });

  return filtered.map(({ t }) => t);
}

interface ForumViewProps {
  userProfile?: any;
  profileHandle?: string;
  triggerNotification?: (msg: string) => void;
  profileAvatarUrl?: string;
  discoverProfiles?: any[];
  allProfiles?: any[];
  initialThreadId?: string | null;
  onClearInitialThread?: () => void;
}

const DEFAULT_FORUM_THREADS = initialForumThreads;

const isValidForumAvatarUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length <= 5) return false;
  if (
    trimmed.includes('undefined') ||
    trimmed.includes('null') ||
    trimmed.includes('ui-avatars.com')
  ) {
    return false;
  }
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  );
};

interface ForumAuthorAvatarProps {
  name: string;
  candidates: string[];
}

const ForumAuthorAvatar: React.FC<ForumAuthorAvatarProps> = ({ name, candidates }) => {
  const [failedIdx, setFailedIdx] = useState(0);
  const candidateKey = candidates.join('|');

  useEffect(() => {
    setFailedIdx(0);
  }, [candidateKey]);

  const initials =
    (name || 'Fan')
      .replace(/@/g, '')
      .split(/[\s_]+/)
      .filter(Boolean)
      .map((n: string) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'BD';

  const activeSrc = candidates[failedIdx];

  if (activeSrc) {
    return (
      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-zinc-700/80 bg-zinc-900 flex items-center justify-center">
        <img
          src={activeSrc}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
          onError={() => setFailedIdx((idx) => idx + 1)}
        />
      </div>
    );
  }

  return (
    <div className="w-5 h-5 rounded-full bg-red-950/80 border border-red-800/60 text-[9px] font-black text-red-300 flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
};

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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_forum_cache_updated', { detail: { count: threads.length } }));
    }
  } catch (e) {
    console.warn('Failed to save forum cache to localStorage:', e);
  }
}

function loadForumCache(): any[] | null {
  try {
    const saved = localStorage.getItem('nexus_forum_threads_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed.filter((t) => t && !isRetiredNonExtremeMock(t));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem('nexus_forum_threads_cache', JSON.stringify(cleaned));
        }
        return cleaned.length > 0 ? cleaned : null;
      }
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
  initialThreadId,
  onClearInitialThread,
}) => {
  const [forumThreads, setForumThreads] = useState<any[]>(() => {
    const cached = loadForumCache() || [];
    const realCount = cached.filter((t) => !isSeededForumThread(t)).length;
    if (realCount >= SEEDED_FORUM_THRESHOLD) {
      return cached.filter((t) => !isSeededForumThread(t));
    }
    const existingIds = new Set(cached.map((t) => String(t.id)));
    const existingTitles = new Set(cached.map((t) => String(t.title || '').trim().toLowerCase()));
    const missingSeeds = DEFAULT_FORUM_THREADS.filter(
      (s) => !existingIds.has(String(s.id)) && !existingTitles.has(String(s.title || '').trim().toLowerCase())
    );
    return [...cached, ...missingSeeds];
  });
  const [forumSearch, setForumSearch] = useState('');
  const [forumCategory, setForumCategory] = useState('All');
  const [forumSort, setForumSort] = useState<'hot' | 'new'>('hot');
  const [forumPrimaryGenre, setForumPrimaryGenre] = useState('All');
  const [forumMicroGenre, setForumMicroGenre] = useState('All');
  const [showCircleSheet, setShowCircleSheet] = useState(false);
  const [showInlineSearch, setShowInlineSearch] = useState(false);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(initialThreadId || null);
  const [activeInlineYoutubeIds, setActiveInlineYoutubeIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialThreadId) {
      setExpandedThreadId(initialThreadId);
    }
  }, [initialThreadId]);

  useEffect(() => {
    const handleOpenThread = (e: any) => {
      if (e?.detail?.threadId) {
        setExpandedThreadId(e.detail.threadId);
      }
    };
    const handleCacheUpdated = () => {
      const cached = loadForumCache();
      if (cached && cached.length > 0) {
        setForumThreads(cached);
      }
    };
    const handleOpenCircleSelector = () => {
      setShowCircleSheet(true);
    };
    window.addEventListener('nexus_open_forum_thread' as any, handleOpenThread);
    window.addEventListener('nexus_forum_cache_updated' as any, handleCacheUpdated);
    window.addEventListener('nexus:open-circle-selector' as any, handleOpenCircleSelector);
    return () => {
      window.removeEventListener('nexus_open_forum_thread' as any, handleOpenThread);
      window.removeEventListener('nexus_forum_cache_updated' as any, handleCacheUpdated);
      window.removeEventListener('nexus:open-circle-selector' as any, handleOpenCircleSelector);
    };
  }, []);

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
        window.dispatchEvent(new CustomEvent('nexus_onboarding_checklist_updated'));
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
  const isUserOwner = (authorName?: string, threadObj?: any) => {
    if (threadObj) {
      if (threadObj.isUserCreated === true) return true;
      if (userProfile?.id && (threadObj.userId === userProfile.id || threadObj.user_id === userProfile.id)) {
        return true;
      }
    }
    if (!authorName) return false;
    const currentUserName = userProfile?.name || '';
    const myHandle = (userProfile?.console_handle || profileHandle || userProfile?.handle || '').replace('@', '').toLowerCase().trim();
    const cleanAuthor = authorName.replace('@', '').toLowerCase().trim();
    if (cleanAuthor === 'fan' || cleanAuthor === 'scene member' || cleanAuthor === 'user' || cleanAuthor === 'anonymous') return false;
    if (myHandle && myHandle !== 'user' && myHandle !== 'fan' && cleanAuthor === myHandle) return true;
    if (currentUserName && currentUserName.toLowerCase() !== 'user' && cleanAuthor === currentUserName.toLowerCase()) return true;
    return false;
  };

  // Resolve birthday profile for a forum thread or comment author
  const resolveForumAuthorBirthdayProfile = (authorName?: string, itemObj?: any) => {
    const isOwner = isUserOwner(authorName, itemObj);
    if (isOwner && userProfile) {
      return {
        ...(itemObj || {}),
        ...userProfile,
      };
    }
    const clean = (authorName || '').replace(/^@/, '').trim().toLowerCase();
    const pool = [...(allProfiles || []), ...(discoverProfiles || [])];
    const match = pool.find((p: any) => {
      if (!p) return false;
      if (itemObj?.userId && p.id && String(p.id) === String(itemObj.userId)) return true;
      if (itemObj?.user_id && p.id && String(p.id) === String(itemObj.user_id)) return true;
      const pName = String(p.name || p.username || '').replace(/^@/, '').trim().toLowerCase();
      const pHandle = String(p.console_handle || p.handle || '').replace(/^@/, '').trim().toLowerCase();
      return clean && (pName === clean || pHandle === clean);
    });
    return {
      name: authorName,
      ...(itemObj || {}),
      ...(match || {}),
    };
  };

  const renderForumAuthorBirthdayBadge = (authorName?: string, itemObj?: any, threadIdForQuickComment?: string) => {
    const isOwner = isUserOwner(authorName, itemObj);
    const authorProfile = resolveForumAuthorBirthdayProfile(authorName, itemObj);
    const isMutual = !isOwner && Boolean(
      isMutualConnection(authorProfile, userProfile) ||
      isProfileFollowedGlobally(authorProfile)
    );
    return (
      <BirthdayShoutoutBadge
        profile={authorProfile}
        isOwnProfile={isOwner}
        isMutual={isMutual}
        compact
        onSendBirthdayHorns={() => {
          const recipientName = authorProfile?.name || authorName || 'Friend';
          const message = buildBirthdayHornsMessage(recipientName);
          const senderId = String(userProfile?.id || 'guest');
          const targetId = String(authorProfile?.id || itemObj?.userId || itemObj?.user_id || recipientName);
          sendDirectMessage(senderId, targetId, message, {
            senderName: userProfile?.name || getEffectiveUserHandle(),
          });
          if (threadIdForQuickComment) {
            const newComment = {
              id: `bday-horns-${Date.now()}`,
              author: getEffectiveUserHandle(),
              text: message,
              timeAgo: 'Just now',
              isUserCreated: true,
              replies: [],
            };
            setForumThreads((prev: any[]) =>
              prev.map((t: any) =>
                t.id === threadIdForQuickComment
                  ? { ...t, comments: [...(t.comments || []), newComment] }
                  : t
              )
            );
          }
          if (triggerNotification) {
            triggerNotification(`🤘 Sent Birthday Horns to ${recipientName}!`);
          }
        }}
      />
    );
  };

  // Format any author display into their console handle
  const formatForumAuthor = (authorName?: string) => {
    if (!authorName) return '@scene_member';
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
      const ensureSeedsMerged = (list: any[]) => {
        const activeList = (list || []).filter((t) => t && !isRetiredNonExtremeMock(t));
        const realCount = activeList.filter((t) => !isSeededForumThread(t)).length;
        if (realCount >= SEEDED_FORUM_THRESHOLD) {
          return activeList.filter((t) => !isSeededForumThread(t));
        }
        const existingIds = new Set(activeList.map((t) => String(t.id)));
        const existingTitles = new Set(activeList.map((t) => String(t.title || '').trim().toLowerCase()));
        const missingSeeds = DEFAULT_FORUM_THREADS.filter(
          (s) => !existingIds.has(String(s.id)) && !existingTitles.has(String(s.title || '').trim().toLowerCase())
        );
        return [...activeList, ...missingSeeds];
      };

      if (!supabase) {
        const merged = ensureSeedsMerged(cachedThreads);
        if (merged.length > 0) setForumThreads(merged);
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
              userId: t.user_id,
              user_id: t.user_id,
              image: t.image_url || t.image || t.media_url,
              youtubeId: t.youtube_id,
              votes: t.votes ?? 1,
              createdAt: t.created_at || undefined,
              timeAgo: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Recently',
              comments: threadComments || [],
              userVote: null,
            };
          });

          // Merge Supabase threads with any local cached threads that haven't synced yet
          const supabaseIds = new Set(mappedSupabase.map((t) => String(t.id)));
          const localOnly = cachedThreads.filter((ct) => !supabaseIds.has(String(ct.id)));

          const combined = ensureSeedsMerged([...localOnly, ...mappedSupabase]);

          setForumThreads(combined);
          saveForumCache(combined);
        } else {
          const merged = ensureSeedsMerged(cachedThreads);
          if (merged.length > 0) {
            setForumThreads(merged);
            saveForumCache(merged);
          }
        }
      } catch (err) {
        console.warn('Supabase forum load error, fallback to local cache:', err);
        const merged = ensureSeedsMerged(cachedThreads);
        if (merged.length > 0) {
          setForumThreads(merged);
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

  const getAvatarCandidates = (name: string, threadObj?: any): string[] => {
    const cleanName = (name || '').replace(/^@+/, '').toLowerCase().trim();
    const myAvatar =
      profileAvatarUrl ||
      userProfile?.avatar_url ||
      userProfile?.avatar ||
      userProfile?.profile_avatar;

    const allKnownProfiles = [...(discoverProfiles || []), ...(allProfiles || [])];
    const matchedProfile = allKnownProfiles.find((p) => {
      if (!p) return false;
      if (threadObj?.userId && p.id && String(p.id) === String(threadObj.userId)) return true;
      if (threadObj?.user_id && p.id && String(p.id) === String(threadObj.user_id)) return true;
      const pName = (p?.name || '').toLowerCase().trim();
      const pHandle = (p?.handle || p?.console_handle || '').replace(/^@+/, '').toLowerCase().trim();
      return Boolean(cleanName && (pName === cleanName || pHandle === cleanName));
    });

    const matchedAvatar =
      matchedProfile?.avatar ||
      matchedProfile?.avatar_url ||
      matchedProfile?.profile_avatar;

    const storedAvatar =
      typeof window !== 'undefined'
        ? localStorage.getItem('nexus_user_avatar') || localStorage.getItem('nexus_avatar') || ''
        : '';

    const ownerMatch =
      isUserOwner(name, threadObj) ||
      (userProfile?.name && name === userProfile.name) ||
      (profileHandle && name === profileHandle);

    const rawList = ownerMatch
      ? [myAvatar, storedAvatar, matchedAvatar, threadObj?.authorAvatar]
      : [matchedAvatar, threadObj?.authorAvatar];

    const seen = new Set<string>();
    const valid: string[] = [];
    for (const url of rawList) {
      if (isValidForumAvatarUrl(url) && !seen.has(url)) {
        seen.add(url);
        valid.push(url);
      }
    }
    return valid;
  };

  const renderAvatarForName = (name: string, threadObj?: any) => {
    if (!name) return null;
    const candidates = getAvatarCandidates(name, threadObj);
    return <ForumAuthorAvatar name={formatForumAuthor(name)} candidates={candidates} />;
  };

  const handleCreateThread = async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim()) return;
    const authorName = getEffectiveUserHandle();
    const myAvatar = profileAvatarUrl || userProfile?.avatar_url || userProfile?.avatar || userProfile?.profile_avatar || '';
    const avatarUrl = (typeof myAvatar === 'string' && myAvatar.length > 5 && (myAvatar.startsWith('http') || myAvatar.startsWith('data:') || myAvatar.startsWith('/')))
      ? myAvatar
      : '';
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
      userId: userProfile?.id,
      user_id: userProfile?.id,
      isUserCreated: true,
      image: newThreadMediaUrl || undefined,
      youtubeId: yId,
      createdAt: new Date().toISOString(),
      timeAgo: 'Just now',
      votes: 1,
      userVote: 'up' as const,
      comments: [],
    };

    setForumThreads((prev) => {
      const next = [newThread, ...prev];
      const realCount = next.filter((t) => !isSeededForumThread(t)).length;
      const updated = realCount >= SEEDED_FORUM_THRESHOLD ? next.filter((t) => !isSeededForumThread(t)) : next;
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

  const activeCircleLabel =
    forumPrimaryGenre === 'All'
      ? 'All Genres Collective'
      : forumMicroGenre === 'All'
        ? `All ${forumPrimaryGenre}`
        : forumMicroGenre;

  const isCircleSubscribed =
    forumMicroGenre !== 'All' && subscribedSpaces.includes(forumMicroGenre);

  const handleSelectTopicTab = (tabId: string) => {
    setExpandedThreadId(null);
    if (tabId === 'Hot') {
      setForumSort('hot');
      setForumCategory('All');
    } else if (tabId === 'New') {
      setForumSort('new');
      setForumCategory('All');
    } else {
      setForumCategory(tabId);
    }
  };

  const isTopicTabActive = (tabId: string) => {
    if (tabId === 'Hot') return forumCategory === 'All' && forumSort === 'hot';
    if (tabId === 'New') return forumCategory === 'All' && forumSort === 'new';
    return forumCategory === tabId;
  };

  return (
    <div className="max-w-3xl mx-auto pb-10 sm:pb-8 animate-in fade-in duration-300">
      {/* Compact Sticky Header: Circle Selector + +Post CTA on Row 1, Scrollable Filter Tabs on Row 2 */}
      <div className="sticky top-0 z-20 bg-[#08090d]/92 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 pt-2.5 pb-2">
        {/* Row 1: Current Circle Selector Pill + Search Toggle + Compact + Post CTA */}
        <div className="flex items-center justify-between gap-2 min-h-[42px]">
          <button
            type="button"
            onClick={() => setShowCircleSheet(true)}
            className="min-w-0 max-w-[66%] inline-flex items-center gap-1.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-rose-500/40 rounded-full px-3 py-1.5 text-xs font-bold text-white transition-all cursor-pointer"
            title="Switch Circle or Manage Subscriptions"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="truncate">{activeCircleLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowInlineSearch((prev) => !prev)}
              aria-label="Search forum discussions"
              className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                showInlineSearch || forumSearch.trim()
                  ? 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                  : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
              }`}
              title="Search discussions"
            >
              <Search className="w-4 h-4" />
            </button>

            <FirstTimeTooltip
              id="forum_new_discussion"
              title="Start a Discussion"
              tip="Post recommendations, gig reviews, album debates, or gear questions on forum boards."
              position="bottom"
              accentColor="rose"
              triggerOn="hover"
            >
              <button
                type="button"
                onClick={() => {
                  setExpandedThreadId(null);
                  setShowCreateThread((prev) => !prev);
                }}
                className="min-h-[36px] px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-150 shadow-md shadow-rose-950/40 cursor-pointer inline-flex items-center gap-1 active:scale-95 whitespace-nowrap"
              >
                {showCreateThread ? (
                  <>
                    <X className="w-3.5 h-3.5" />
                    <span>Close</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </FirstTimeTooltip>
          </div>
        </div>

        {/* Optional expandable compact search input */}
        {(showInlineSearch || forumSearch.trim().length > 0) && !showCreateThread && !expandedThreadId && (
          <div className="mt-2 relative animate-in fade-in duration-150">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search in ${activeCircleLabel}...`}
              value={forumSearch}
              onChange={(e) => setForumSearch(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-rose-500/50 rounded-xl py-2 pl-9 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
            {forumSearch && (
              <button
                type="button"
                onClick={() => setForumSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Row 2: Horizontal Scrollable Filter / Topic Tabs */}
        {!showCreateThread && !expandedThreadId && (
          <div className="mt-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'Hot', label: 'Hot', icon: Flame },
              { id: 'New', label: 'New', icon: Sparkles },
              { id: 'My Subscriptions', label: `Subscriptions (${subscribedSpaces.length})`, icon: Bell },
              { id: 'Album Art', label: 'Album Art', icon: null },
              { id: 'Album Reviews', label: 'Album Reviews', icon: null },
              { id: 'Show & Fest', label: 'Show & Fest', icon: null },
              { id: 'Gear & Rig', label: 'Gear & Rig', icon: null },
            ].map((tab) => {
              const active = isTopicTabActive(tab.id);
              const Icon = tab.icon;
              return (
                <button
                  key={`forum-tab-${tab.id}`}
                  type="button"
                  onClick={() => handleSelectTopicTab(tab.id)}
                  className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-rose-950/60 text-rose-300 border border-rose-500/45'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  {Icon && <Icon className={`w-3 h-3 ${active ? 'text-rose-400' : 'text-zinc-500'}`} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Circle Selector & Subscriptions Bottom Sheet / Modal */}
      {showCircleSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            onClick={() => setShowCircleSheet(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative w-full sm:max-w-lg bg-[#0d0e13] border-t sm:border border-zinc-800 rounded-t-3xl sm:rounded-2xl px-5 pt-3 pb-8 sm:pb-6 max-h-[82vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            {/* Drag Handle */}
            <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  Circles & Subscriptions
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Switch music circles or manage followed boards
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCircleSheet(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
                aria-label="Close circles drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Quick Subscribe Toggle for Selected Micro-Circle */}
              {forumMicroGenre !== 'All' && (
                <div className="flex items-center justify-between gap-3 bg-zinc-900/70 border border-zinc-800 rounded-xl px-3.5 py-2.5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      Active Circle
                    </span>
                    <span className="text-xs font-bold text-white truncate block">
                      {forumMicroGenre}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSubscribeSpace(forumMicroGenre)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wide border transition-colors cursor-pointer ${
                      isCircleSubscribed
                        ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                        : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200'
                    }`}
                  >
                    {isCircleSubscribed ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-rose-400" />
                        <span>Subscribed</span>
                      </>
                    ) : (
                      <>
                        <BellPlus className="w-3.5 h-3.5 text-rose-400" />
                        <span>Subscribe</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Genre Cluster & Sub-Genre Picker */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                  Select Circle
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForumPrimaryGenre('All');
                      setForumMicroGenre('All');
                      setShowCircleSheet(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      forumPrimaryGenre === 'All'
                        ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    All Genres Collective
                  </button>
                  {MASTER_GENRES.map((cluster, idx) => (
                    <button
                      key={`sheet-cluster-${cluster.name}-${idx}`}
                      type="button"
                      onClick={() => {
                        setForumPrimaryGenre(cluster.name);
                        setForumMicroGenre('All');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        forumPrimaryGenre === cluster.name
                          ? 'bg-rose-950/70 border-rose-500/60 text-rose-200'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {cluster.name}
                    </button>
                  ))}
                </div>

                {forumPrimaryGenre !== 'All' && (
                  <div className="pt-2 border-t border-zinc-800/70 space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 block">
                      Sub-Circles in {forumPrimaryGenre}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setForumMicroGenre('All');
                          setShowCircleSheet(false);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          forumMicroGenre === 'All'
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                        }`}
                      >
                        All {forumPrimaryGenre}
                      </button>
                      {MASTER_GENRES.find((c) => c.name === forumPrimaryGenre)?.tags.map((tag, tagIdx) => (
                        <button
                          key={`sheet-tag-${tag.id}-${tagIdx}`}
                          type="button"
                          onClick={() => {
                            setForumMicroGenre(tag.label);
                            setShowCircleSheet(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            forumMicroGenre === tag.label
                              ? 'bg-rose-600 text-white border-rose-500'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                          }`}
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subscribed Spaces Management */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Bell className="w-3 h-3 text-rose-400" />
                    Subscribed Spaces ({subscribedSpaces.length})
                  </span>
                  {subscribedSpaces.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setForumCategory('My Subscriptions');
                        setShowCircleSheet(false);
                      }}
                      className="text-[11px] font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                    >
                      View Feed →
                    </button>
                  )}
                </div>

                {subscribedSpaces.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    No subscriptions yet. Pick any circle above to subscribe.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {subscribedSpaces.map((space, sIdx) => (
                      <div
                        key={`sheet-sub-${space}-${sIdx}`}
                        className="inline-flex items-center gap-1 bg-rose-950/40 border border-rose-900/50 text-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const parentCluster = MASTER_GENRES.find((c) =>
                              c.tags.some((tg) => tg.label === space)
                            );
                            if (parentCluster) {
                              setForumPrimaryGenre(parentCluster.name);
                              setForumMicroGenre(space);
                            } else {
                              setForumPrimaryGenre('All');
                              setForumMicroGenre('All');
                              setForumCategory(space);
                            }
                            setShowCircleSheet(false);
                          }}
                          className="hover:text-white cursor-pointer"
                        >
                          {space}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSubscribeSpace(space)}
                          className="text-rose-400 hover:text-white cursor-pointer ml-0.5 p-0.5"
                          title={`Unsubscribe from ${space}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 mx-4 sm:mx-6 mt-4 mb-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
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

          {/* Threads List or Single Thread Expanded */}
          {expandedThreadId ? (
            (() => {
              const thread =
                forumThreads.find((t) => String(t.id) === String(expandedThreadId)) ||
                BRUTAL_DEATH_METAL_HIGHLIGHTS.find((t) => String(t.id) === String(expandedThreadId));
              if (!thread) return null;
              return (
                <div className="bg-[#121214] border border-zinc-900 rounded-2xl p-5 mx-4 sm:mx-6 mt-4 space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => { setExpandedThreadId(null); setThreadCommentInput(''); }}
                      className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" /> Back to Forums
                    </button>

                    {/* Owner controls on expanded thread */}
                    {isUserOwner(thread.author, thread) && (
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
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderAvatarForName(thread.author, thread)}
                      <span className="text-xs text-zinc-300 font-bold">posted by {formatForumAuthor(thread.author)}</span>
                      {renderForumAuthorBirthdayBadge(thread.author, thread, thread.id)}
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {renderAvatarForName(comment.author)}
                              <span className="text-xs font-black text-zinc-300">{formatForumAuthor(comment.author)}</span>
                              {renderForumAuthorBirthdayBadge(comment.author, comment, thread.id)}
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
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {renderAvatarForName(rep.author)}
                                      <span className="font-bold text-zinc-400">{formatForumAuthor(rep.author)}</span>
                                      {renderForumAuthorBirthdayBadge(rep.author, rep, thread.id)}
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
            <div className="divide-y divide-zinc-800/80 border-b border-zinc-800/80">
              {(() => {
                const filteredList = filterAndSortForumThreads(forumThreads, {
                  category: forumCategory,
                  sort: forumSort,
                  primaryGenre: forumPrimaryGenre,
                  microGenre: forumMicroGenre,
                  subscribedSpaces,
                  searchQuery: forumSearch,
                });

                if (filteredList.length === 0) {
                  return (
                    <div className="text-center py-14 px-7 sm:px-8 space-y-3">
                      <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold uppercase text-white font-mono">No Discussions Found</h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        No threads match your current filter or search criteria. Be the first to start a discussion!
                      </p>
                      <button
                        type="button"
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
                  const catAccent = getCategoryAccentClasses(thread.category);
                  const activity = getThreadActivityBadge(thread);
                  const highlighted = isThreadHighlighted(thread, forumThreads);
                  const commentsCount = Array.isArray(thread.comments) ? thread.comments.length : 0;

                  return (
                    <article
                      key={thread.id ? `thread-${thread.id}-${tIdx}` : `thread-${tIdx}`}
                      onClick={() => setExpandedThreadId(thread.id)}
                      className={`px-7 sm:px-8 py-4 hover:bg-zinc-950/70 active:bg-zinc-900/40 cursor-pointer transition-colors duration-150 flex flex-col gap-2.5 group ${
                        highlighted ? 'bg-gradient-to-r from-red-950/25 via-[#0d0607] to-transparent border-l-2 border-l-red-600' : ''
                      }`}
                    >
                      {/* Tight Single-Row Metadata Header */}
                      <div className="flex items-center justify-between gap-2 min-w-0 text-[11px]">
                        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                          {renderAvatarForName(thread.author, thread)}

                          <span className="font-semibold text-zinc-200 truncate max-w-[115px] sm:max-w-[160px]">
                            {formatForumAuthor(thread.author)}
                          </span>

                          {renderForumAuthorBirthdayBadge(thread.author, thread, thread.id)}

                          <span className="text-zinc-600 shrink-0" aria-hidden="true">·</span>

                          <span className={`font-bold truncate shrink-0 ${catAccent.text}`}>
                            {thread.category}
                          </span>

                          {thread.genre && (
                            <>
                              <span className="text-zinc-600 shrink-0 hidden sm:inline" aria-hidden="true">·</span>
                              <span className="text-zinc-400 truncate max-w-[110px] hidden sm:inline">
                                {thread.genre}
                              </span>
                            </>
                          )}

                          <span className="text-zinc-600 shrink-0" aria-hidden="true">·</span>
                          <span className="text-zinc-500 font-mono text-[10px] shrink-0">
                            {thread.timeAgo}
                          </span>
                        </div>

                        {highlighted ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wide text-red-300 bg-red-950/80 border border-red-600/60 px-2 py-0.5 rounded-full whitespace-nowrap">
                            <Skull className="w-2.5 h-2.5 text-red-400" />
                            <span>Highlighted</span>
                          </span>
                        ) : activity === 'trending' ? (
                          <span className="shrink-0 text-[10px] font-bold text-amber-300 whitespace-nowrap">
                            🔥 Trending
                          </span>
                        ) : activity === 'new_replies' ? (
                          <span className="shrink-0 text-[10px] font-bold text-teal-300 whitespace-nowrap">
                            New Replies
                          </span>
                        ) : null}
                      </div>

                      {/* Thread Title */}
                      <h3 className="text-[15px] sm:text-base font-bold text-white group-hover:text-rose-400 transition-colors leading-snug">
                        {thread.title}
                      </h3>

                      {/* Prominent Media Preview OR Sleek 3-Line Text Excerpt */}
                      {hasImage ? (
                        <div className="space-y-2">
                          <div className="w-full rounded-2xl overflow-hidden border border-zinc-800/80 bg-zinc-950">
                            <img
                              referrerPolicy="no-referrer"
                              src={thread.image}
                              alt={thread.title || 'Forum attachment'}
                              loading="lazy"
                              className="w-full max-h-72 object-cover group-hover:scale-[1.01] transition-transform duration-300"
                            />
                          </div>
                          {thread.content && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                              {thread.content}
                            </p>
                          )}
                        </div>
                      ) : hasYoutube ? (
                        <div className="space-y-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveInlineYoutubeIds((prev) => ({ ...prev, [String(thread.id)]: true }));
                            }}
                            className="relative w-full aspect-video max-h-72 rounded-2xl overflow-hidden border border-zinc-800/80 bg-black cursor-pointer"
                          >
                            {activeInlineYoutubeIds[String(thread.id)] ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${thread.youtubeId}?autoplay=1`}
                                title={thread.title || 'YouTube Video'}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <>
                                <img
                                  referrerPolicy="no-referrer"
                                  src={`https://img.youtube.com/vi/${thread.youtubeId}/hqdefault.jpg`}
                                  alt={thread.title || 'YouTube preview'}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-center justify-center">
                                  <div className="w-12 h-12 rounded-full bg-red-600/90 hover:bg-red-500 border border-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg transition-colors">
                                    <PlayCircle className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 border border-zinc-700/80 text-[10px] font-mono font-bold text-red-300">
                                  <Youtube className="w-3 h-3 text-red-500" />
                                  <span>Watch on YouTube</span>
                                </span>
                              </>
                            )}
                          </div>
                          {thread.content && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                              {thread.content}
                            </p>
                          )}
                        </div>
                      ) : hasVideo ? (
                        <div className="space-y-2">
                          <div className="relative w-full max-h-72 rounded-2xl overflow-hidden border border-zinc-800/80 bg-black flex items-center justify-center">
                            <video
                              src={thread.image}
                              className="w-full max-h-72 object-cover pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                              <div className="w-12 h-12 rounded-full bg-black/70 border border-white/25 backdrop-blur-sm flex items-center justify-center">
                                <PlayCircle className="w-6 h-6 text-white" />
                              </div>
                            </div>
                          </div>
                          {thread.content && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                              {thread.content}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {thread.content && (
                            <p className="text-xs sm:text-[13px] text-zinc-400 line-clamp-3 font-normal leading-relaxed">
                              {thread.content}
                            </p>
                          )}
                          {hasAudio && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-rose-300"
                            >
                              <Volume2 className="w-4 h-4 text-rose-400 shrink-0" />
                              <span className="font-bold truncate">Attached Audio Track</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px] text-zinc-400 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Upvote / Downvote Pill */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-full px-2.5 py-1 shadow-sm transition-colors shrink-0"
                          >
                            <button
                              type="button"
                              onClick={() => handleVote(thread.id, 'up')}
                              className={`p-0.5 transition-colors cursor-pointer ${
                                thread.userVote === 'up' ? 'text-rose-500 scale-110' : 'text-zinc-400 hover:text-rose-400'
                              }`}
                              title="Upvote / Flame"
                            >
                              <Flame className="w-3.5 h-3.5 fill-current" />
                            </button>
                            <span className="font-mono tabular-nums font-black text-white text-[11px] px-1.5 min-w-[20px] text-center">
                              {thread.votes}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleVote(thread.id, 'down')}
                              className={`p-0.5 transition-colors cursor-pointer ${
                                thread.userVote === 'down' ? 'text-purple-500 scale-110' : 'text-zinc-400 hover:text-purple-400'
                              }`}
                              title="Downvote"
                            >
                              <Zap className="w-3.5 h-3.5 rotate-180 fill-current" />
                            </button>
                          </div>

                          {/* Comments Count Pill */}
                          <span className="inline-flex items-center gap-1.5 text-zinc-300 bg-zinc-900/90 border border-zinc-800 rounded-full px-3 py-1 text-[11px] font-mono tabular-nums group-hover:text-white transition-colors whitespace-nowrap shrink-0">
                            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                            <span>{commentsCount}</span>
                          </span>

                          {thread.genre && (
                            <span className="sm:hidden text-[10px] text-zinc-500 truncate max-w-[96px]">
                              {thread.genre}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-semibold text-zinc-500 group-hover:text-rose-400 inline-flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap">
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </article>
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
