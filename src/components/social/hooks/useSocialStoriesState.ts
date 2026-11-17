import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../../../supabase';
import {
  StoryItem,
  normalizeStory,
  isGenuineActiveStory,
  fetchAuthoritativeStories,
  syncLocalStoriesToCloud,
} from '../utils/storiesPersistenceService';

export function useSocialStoriesState() {
  const [stories, setStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pit_stories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
            .filter(isGenuineActiveStory)
            .map((s: any, idx: number) => normalizeStory(s, idx));
        }
      }
    } catch (e) {
      console.warn("Failed to load stories from localStorage:", e);
    }
    return [];
  });

  // Keep localStorage updated with latest genuine active stories
  useEffect(() => {
    try {
      const activeOnly = stories.filter(isGenuineActiveStory);
      localStorage.setItem('nexus_pit_stories_v2', JSON.stringify(activeOnly));
    } catch (e) {
      console.warn("Failed to save stories to localStorage:", e);
    }
  }, [stories]);

  // Comprehensive cloud sync and loading
  const refreshStories = useCallback(async (force = false) => {
    try {
      // 1. First sync any phone-saved local stories up to the cloud
      await syncLocalStoriesToCloud();

      // 2. Fetch all genuine, non-expired (24h) authoritative cloud stories
      const cloudStories = await fetchAuthoritativeStories(force);

      setStories((prev) => {
        const cloudIds = new Set(cloudStories.map((s) => s.id));
        const localOnly = prev.filter(
          (s) =>
            !cloudIds.has(s.id) &&
            isGenuineActiveStory(s) &&
            s.id.startsWith('story_')
        );
        const combined = [...localOnly, ...cloudStories].filter(isGenuineActiveStory);
        return combined.map((s, idx) => normalizeStory(s, idx));
      });
    } catch (err) {
      console.warn('[useSocialStoriesState] Failed to refresh cloud stories:', err);
    }
  }, []);

  useEffect(() => {
    refreshStories(true);

    // Listen for local story publishing events
    const handleStoryPublished = (event: any) => {
      const newStory = event.detail;
      if (newStory && isGenuineActiveStory(newStory)) {
        setStories((prev) => [normalizeStory(newStory), ...prev.filter((s) => s.id !== newStory.id)]);
      }
      refreshStories(true);
    };

    window.addEventListener('nexus_story_published', handleStoryPublished);

    // Setup Supabase Realtime channel for nexus_stories
    const supabaseClient = getSupabase();
    let channel: any = null;

    if (supabaseClient) {
      try {
        channel = supabaseClient
          .channel('public:nexus_stories')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'nexus_stories' },
            () => {
              console.log('[useSocialStoriesState] Realtime story change detected. Refreshing...');
              refreshStories(true);
            }
          )
          .subscribe();
      } catch (subErr) {
        console.warn('[useSocialStoriesState] Realtime subscription error:', subErr);
      }
    }

    return () => {
      window.removeEventListener('nexus_story_published', handleStoryPublished);
      if (channel && supabaseClient) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [refreshStories]);

  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [showUploadStoryModal, setShowUploadStoryModal] = useState(false);
  const [newStoryImage, setNewStoryImage] = useState('');
  const [newStoryVideo, setNewStoryVideo] = useState('');
  const [selectedStoryFile, setSelectedStoryFile] = useState<File | null>(null);
  const [fallbackBase64, setFallbackBase64] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryMusic, setNewStoryMusic] = useState('');
  const [newStoryTextOverlay, setNewStoryTextOverlay] = useState('');
  const [newStoryTextStyle, setNewStoryTextStyle] = useState<'metal' | 'neon' | 'cyber' | 'minimal'>('metal');
  const [newStoryTextColor, setNewStoryTextColor] = useState('#ffffff');
  const [newStoryTextColorHex, setNewStoryTextColorHex] = useState('#ffffff');
  const [newStoryBorder, setNewStoryBorder] = useState('none');
  const [selectedStorySticker, setSelectedStorySticker] = useState('');
  const [newStoryStickers, setNewStoryStickers] = useState<string[]>([]);
  const [newStoryTextSize, setNewStoryTextSize] = useState(16);
  const [newStoryTextX, setNewStoryTextX] = useState(50);
  const [newStoryTextY, setNewStoryTextY] = useState(50);
  const [newStoryStickerScale, setNewStoryStickerScale] = useState(1.0);
  const [newStoryStickerX, setNewStoryStickerX] = useState(50);
  const [newStoryStickerY, setNewStoryStickerY] = useState(30);

  return {
    stories,
    setStories,
    storyProgress,
    setStoryProgress,
    isStoryPaused,
    setIsStoryPaused,
    showUploadStoryModal,
    setShowUploadStoryModal,
    newStoryImage,
    setNewStoryImage,
    newStoryVideo,
    setNewStoryVideo,
    selectedStoryFile,
    setSelectedStoryFile,
    fallbackBase64,
    setFallbackBase64,
    isUploading,
    setIsUploading,
    newStoryCaption,
    setNewStoryCaption,
    newStoryMusic,
    setNewStoryMusic,
    newStoryTextOverlay,
    setNewStoryTextOverlay,
    newStoryTextStyle,
    setNewStoryTextStyle,
    newStoryTextColor,
    setNewStoryTextColor,
    newStoryTextColorHex,
    setNewStoryTextColorHex,
    newStoryBorder,
    setNewStoryBorder,
    selectedStorySticker,
    setSelectedStorySticker,
    newStoryStickers,
    setNewStoryStickers,
    newStoryTextSize,
    setNewStoryTextSize,
    newStoryTextX,
    setNewStoryTextX,
    newStoryTextY,
    setNewStoryTextY,
    newStoryStickerScale,
    setNewStoryStickerScale,
    newStoryStickerX,
    setNewStoryStickerX,
    newStoryStickerY,
    setNewStoryStickerY
  };
}
