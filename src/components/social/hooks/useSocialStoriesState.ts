import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '../../../supabase';
import { mockStories } from '../../../data/socialFeedMockData';
import {
  StoryItem,
  normalizeStory,
  fetchAuthoritativeStories,
  syncLocalStoriesToCloud,
} from '../utils/storiesPersistenceService';

const DEFAULT_MOCK_STORIES = mockStories.map((s: any, idx: number) => normalizeStory(s, idx));

export function useSocialStoriesState() {
  const [stories, setStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pit_stories_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any, idx: number) => normalizeStory(s, idx));
        }
      }
    } catch (e) {
      console.warn("Failed to load stories from localStorage:", e);
    }
    return DEFAULT_MOCK_STORIES;
  });

  // Keep localStorage updated with latest stories
  useEffect(() => {
    try {
      localStorage.setItem('nexus_pit_stories_v2', JSON.stringify(stories));
    } catch (e) {
      console.warn("Failed to save stories to localStorage:", e);
    }
  }, [stories]);

  // Comprehensive cloud sync and loading
  const refreshStories = useCallback(async () => {
    try {
      // 1. First sync any phone-saved local stories up to the cloud
      await syncLocalStoriesToCloud();

      // 2. Fetch all authoritative cloud stories
      const cloudStories = await fetchAuthoritativeStories();

      if (cloudStories && cloudStories.length > 0) {
        setStories((prev) => {
          const cloudIds = new Set(cloudStories.map((s) => s.id));
          const localOnly = prev.filter(
            (s) =>
              !cloudIds.has(s.id) &&
              (s.id.startsWith('story_') || s.id.startsWith('s_'))
          );
          const combined = [...localOnly, ...cloudStories];
          return combined.map((s, idx) => normalizeStory(s, idx));
        });
      }
    } catch (err) {
      console.warn('[useSocialStoriesState] Failed to refresh cloud stories:', err);
    }
  }, []);

  useEffect(() => {
    refreshStories();

    // Listen for local story publishing events
    const handleStoryPublished = (event: any) => {
      const newStory = event.detail;
      if (newStory) {
        setStories((prev) => [normalizeStory(newStory), ...prev.filter((s) => s.id !== newStory.id)]);
      }
      refreshStories();
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
              refreshStories();
            }
          )
          .subscribe();
      } catch (subErr) {
        console.warn('[useSocialStoriesState] Realtime subscription error:', subErr);
      }
    }

    // Periodic cloud poll every 20 seconds to guarantee cross-device sync
    const pollInterval = setInterval(() => {
      refreshStories();
    }, 20000);

    return () => {
      window.removeEventListener('nexus_story_published', handleStoryPublished);
      clearInterval(pollInterval);
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
