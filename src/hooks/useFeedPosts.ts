import { useState } from 'react';
import { useFeedLocalCache } from '../components/social/hooks/useFeedLocalCache';
import { useSocialFeedState, getYouTubeId, type UseSocialFeedStateParams } from '../components/social/hooks/useSocialFeedState';
import { useSocialFeedSync, type UseSocialFeedSyncParams } from '../components/social/hooks/useSocialFeedSync';
import { DEFAULT_LABEL_POSTS } from '../data/mockSocialData';
import { mockFeed, type FeedItem } from '../data/socialFeedMockData';
import { mergePostWithReactions } from '../components/social/utils/reactionStore';

export { getYouTubeId, type FeedItem };

export interface UseFeedPostsOptions extends Omit<UseSocialFeedStateParams, 'feed' | 'setFeed'> {
  activeBandId?: string;
  defaultFeed?: FeedItem[];
  setChats?: React.Dispatch<React.SetStateAction<any[]>>;
  loadChatsFromSupabase?: () => void;
  refetchChats?: () => void;
}

/**
 * Domain hook encapsulating social feed posts fetching, IndexedDB/localStorage cache hydration,
 * real-time Supabase subscriptions (`nexus_posts`, `nexus_notifications`), post creation,
 * editing, deletion, and reactions.
 */
export function useFeedPosts(options: UseFeedPostsOptions) {
  const {
    portalRole,
    userProfile,
    activeBand,
    activeBandId,
    defaultFeed = mockFeed,
    setChats,
    setNotifications,
    loadChatsFromSupabase,
    refetchChats,
    triggerNotification,
    ...restStateParams
  } = options;

  // 1. Feed local cache hydration + Supabase realtime `nexus_posts` sync
  const { feed, setFeed, _setFeed } = useFeedLocalCache({
    portalRole,
    userProfile,
    activeBand,
    activeBandId,
    defaultFeed,
  });

  // 2. Fallback / Label posts state with hydrated reactions
  const [labelPosts, setLabelPosts] = useState<any[]>(() =>
    DEFAULT_LABEL_POSTS.map((p) => mergePostWithReactions(p, userProfile?.id))
  );

  // 3. Composer state, post mutations (create, edit, delete), and reaction handlers
  const feedState = useSocialFeedState({
    feed,
    setFeed,
    userProfile,
    portalRole,
    activeBand,
    triggerNotification,
    setNotifications,
    ...restStateParams,
  });

  // 4. Real-time sync & IndexedDB persistence helpers
  const feedSync = useSocialFeedSync({
    userProfile,
    portalRole,
    setChats,
    setNotifications,
    loadChatsFromSupabase,
    refetchChats,
    triggerNotification,
    feed,
  } as UseSocialFeedSyncParams);

  return {
    feed,
    setFeed,
    _setFeed,
    labelPosts,
    setLabelPosts,
    ...feedState,
    ...feedSync,
  };
}
