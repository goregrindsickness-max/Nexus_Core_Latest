import React, { useState, Suspense } from 'react';
import { TimelineFeed } from './TimelineFeed';
import {
  PostComposerTrigger,
  CompactComposerTriggerBar,
  ENABLE_COMPACT_COMPOSER_STRIP_AB_TEST,
  type CompactComposerTriggerBarProps,
  StoriesBar,
  WelcomeStarterCard,
} from '../feed';

const StorefrontView = React.lazy(() =>
  import('./StorefrontView').then((m) => ({ default: m.StorefrontView }))
);
const InboxTerminal = React.lazy(() =>
  import('../messaging/InboxTerminal').then((m) => ({ default: m.InboxTerminal }))
);
const CreatePostCard = React.lazy(() =>
  import('./CreatePostCard').then((m) => ({ default: m.CreatePostCard }))
);
const PhotoPitView = React.lazy(() =>
  import('./PhotoPitView').then((m) => ({ default: m.PhotoPitView }))
);
const ForumView = React.lazy(() =>
  import('./ForumView').then((m) => ({ default: m.ForumView }))
);
const ClipsView = React.lazy(() =>
  import('./ClipsView').then((m) => ({ default: m.ClipsView }))
);
const CreatePostModal = React.lazy(() =>
  import('../feed/CreatePostModal').then((m) => ({ default: m.CreatePostModal }))
);

const LazyTabFallback = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
  </div>
);
import { formatPostTimestamp } from '../../utils/socialFeedUtils';
import { mergePostWithReactions } from './utils/reactionStore';
import { isMiguelNameOrProfile } from './utils/profileUtils';
import { resolveCreativeLogo, resolvePromoterLogo, resolveBandLogo } from '../../utils/bandProfileUtils';
import { generateValidUUID } from '../../services/postInteractionsService';
import { isProfileFollowedGlobally } from '../../utils/followSyncService';

export {
  PostComposerTrigger,
  CompactComposerTriggerBar,
  ENABLE_COMPACT_COMPOSER_STRIP_AB_TEST,
  type CompactComposerTriggerBarProps,
};

export const FeedViewRouter: React.FC<any> = (props) => {
  const [internalComposerModalOpen, setInternalComposerModalOpen] = useState(false);
  const isComposerModalOpen =
    props.isComposerModalOpen !== undefined ? Boolean(props.isComposerModalOpen) : internalComposerModalOpen;
  const setIsComposerModalOpen = props.setIsComposerModalOpen || setInternalComposerModalOpen;

  const {
    activeBand,
    activeTab,
    setActiveTab,
    userProfile,
    setUserProfile,
    postIdentity,
    setPostIdentity,
    newPostText,
    setNewPostText,
    mediaUrl,
    setMediaUrl,
    selectedMediaFiles,
    setSelectedMediaFiles,
    handleMediaUpload,
    newPostTag,
    setNewPostTag,
    handleCreatePost,
    youtubeUrl,
    setYoutubeUrl,
    taggedVenue,
    setTaggedVenue,
    setShowPollModal,
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
    setShowMerchDropModal,
    merchDropName,
    setMerchDropName,
    merchDropPrice,
    setMerchDropPrice,
    setShowSongModal,
    attachedSong,
    setAttachedSong,
    taggedBands,
    setTaggedBands,
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
    isUploadingTapeAudio,
    handleTapeAudioUpload,
    tapeFileInputRef,
    triggerNotification,
    stories,
    setShowUploadStoryModal,
    setActiveStory,
    filterHideTicketPresales,
    filterShowFollowedOnly,
    filterShowMerchDropsOnlyFromFollowed,
    discoverProfiles,
    profileFullLegalName,
    feed,
    setFeed,
    labelPosts,
    setLabelPosts,
    handleReaction,
    handleAddComment,
    setEditingPostId,
    setEditingPostText,
    editingPostImages,
    setEditingPostImages,
    handleSaveEdit,
    handleDeletePost,
    setCheckoutItem,
    setSelectedUserProfile,
    setActiveEventData,
    setIsEventModeActive,
    setBottomSheetOpen,
    handleVotePoll,
    shopBrandFilter,
    setShopBrandFilter,
    portalRole,
    shopSearchQuery,
    setShopSearchQuery,
    shopCategory,
    setShopCategory,
    shopItems,
    setShopItems,
    selectedMerch,
    setSelectedMerch,
    selectedMerchSize,
    setSelectedMerchSize,
    selectedMerchQty,
    setSelectedMerchQty,
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    checkoutSuccess,
    setCheckoutSuccess,
    getSupabase,
    profileAvatarUrl,
    allProfiles,
    syncPostToSupabase,
    uploadBase64ToStorage,
    compressImageInSocialFeed,
    triggerPictureViewer,
    clips,
    setClips,
    deleteClip,
    getProfileForUser,
    getPostAuthorDisplayName,
  } = props;

  const [selectedForumThreadId, setSelectedForumThreadId] = useState<string | null>(null);

  const handleComposerSubmit = async (e: React.FormEvent) => {
    const offTopicRegex = /(politics|election|vote|candidate|government|president|congress|democrat|republican)/i;
    const pendingFest =
      typeof window !== 'undefined' ? localStorage.getItem('nexus_pending_festival_edition_id') : null;
    const shouldClose =
      (Boolean(String(newPostText || '').trim()) || Boolean(pendingFest)) &&
      !offTopicRegex.test(String(newPostText || ''));
    await handleCreatePost(e);
    if (ENABLE_COMPACT_COMPOSER_STRIP_AB_TEST && shouldClose) {
      setIsComposerModalOpen(false);
    }
  };

  const composerProps = {
    roleTheme: props.roleTheme || props.portalRole,
    portalRole: props.portalRole,
    activeBand: props.activeBand,
    bands: props.bands,
    allProfiles,
    discoverProfiles,
    profileFullLegalName: props.profileFullLegalName,
    profileHandle: props.profileHandle,
    profileAvatarUrl: props.profileAvatarUrl,
    userProfile,
    setUserProfile,
    postIdentity,
    setPostIdentity,
    newPostText,
    setNewPostText,
    newPostImageUrl: mediaUrl,
    setNewPostImageUrl: setMediaUrl,
    selectedMediaFiles,
    setSelectedMediaFiles,
    handleMediaUpload,
    newPostCategory: newPostTag,
    setNewPostCategory: setNewPostTag,
    handleCreatePost: handleComposerSubmit,
    availableIdentities: userProfile?.bands || [],
    youtubeUrl,
    setYoutubeUrl,
    taggedVenue,
    setTaggedVenue,
    setShowPollModal,
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
    setShowMerchDropModal,
    merchDropName,
    setMerchDropName,
    merchDropPrice,
    setMerchDropPrice,
    setShowSongModal,
    attachedSong,
    setAttachedSong,
    taggedBands,
    setTaggedBands,
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
    isUploadingTapeAudio,
    handleTapeAudioUpload,
    tapeFileInputRef,
    triggerNotification,
    setShowEventModal: props.setShowEventModal,
    eventTitle: props.eventTitle,
    setEventTitle: props.setEventTitle,
    eventType: props.eventType,
    setEventType: props.setEventType,
    eventDate: props.eventDate,
    setEventDate: props.setEventDate,
    eventTime: props.eventTime,
    setEventTime: props.setEventTime,
    eventLocationName: props.eventLocationName,
    setEventLocationName: props.setEventLocationName,
    eventAddress: props.eventAddress,
    setEventAddress: props.setEventAddress,
    eventIsSecret: props.eventIsSecret,
    setEventIsSecret: props.setEventIsSecret,
    eventLineup: props.eventLineup,
    setEventLineup: props.setEventLineup,
    eventFlyerUrl: props.eventFlyerUrl,
    setEventFlyerUrl: props.setEventFlyerUrl,
    eventDescription: props.eventDescription,
    setEventDescription: props.setEventDescription,
    eventCost: props.eventCost,
    setEventCost: props.setEventCost,
    eventTicketUrl: props.eventTicketUrl,
    setEventTicketUrl: props.setEventTicketUrl,
    eventData: props.eventData,
    setEventData: props.setEventData,
    classifiedType: props.classifiedType,
    setClassifiedType: props.setClassifiedType,
    classifiedTitle: props.classifiedTitle,
    setClassifiedTitle: props.setClassifiedTitle,
    classifiedPrice: props.classifiedPrice,
    setClassifiedPrice: props.setClassifiedPrice,
    classifiedCondition: props.classifiedCondition,
    setClassifiedCondition: props.setClassifiedCondition,
    classifiedBrand: props.classifiedBrand,
    setClassifiedBrand: props.setClassifiedBrand,
    classifiedYear: props.classifiedYear,
    setClassifiedYear: props.setClassifiedYear,
    classifiedLocation: props.classifiedLocation,
    setClassifiedLocation: props.setClassifiedLocation,
    classifiedDescription: props.classifiedDescription,
    setClassifiedDescription: props.setClassifiedDescription,
  };

  return (
    <>
          {activeTab === 'feed' && (
            <>
              {/* Scene Creator Box (A/B Test: Trigger bar rendered above Upcoming Shows; modal renders full-screen edge-to-edge CreatePostModal) */}
              {ENABLE_COMPACT_COMPOSER_STRIP_AB_TEST ? (
                isComposerModalOpen ? (
                  <Suspense fallback={null}>
                    <CreatePostModal
                      isOpen={isComposerModalOpen}
                      onClose={() => setIsComposerModalOpen(false)}
                      composerProps={composerProps}
                    />
                  </Suspense>
                ) : null
              ) : (
                <div className="max-w-2xl mx-auto px-4 pt-3 pb-0 sm:px-4">
                  <Suspense fallback={<LazyTabFallback />}>
                    <CreatePostCard
                      isFullScreenModal={false}
                      onCloseModal={() => setIsComposerModalOpen(false)}
                      {...(composerProps as any)}
                    />
                  </Suspense>
                </div>
              )}

      {/* Stories Bar */}
      <StoriesBar
        stories={stories}
        onAddStory={() => setShowUploadStoryModal(true)}
        onSelectStory={(story) => setActiveStory(story)}
      />

      {/* Dynamic Filtered Feed */}
      {(() => {
        const filteredFeed = feed.filter(post => {
          // Hide quiet vault uploads / gallery-only items from the public feed
          if (
            post.is_gallery_only === true ||
            post.post_to_feed === false ||
            post.hidden_from_feed === true ||
            post.gallery_only === true ||
            post.is_archived_asset === true ||
            post.content === 'Archived Profile Photo' ||
            post.content === 'Archived Cover Photo' ||
            String(post.content || '').startsWith('Archived ')
          ) {
            return false;
          }

          if (filterHideTicketPresales) {
            const isTicket = 
              post.tag?.toLowerCase().includes('ticket') || 
              post.tag?.toLowerCase().includes('presale') ||
              post.content?.toLowerCase().includes('ticket presale') ||
              post.content?.toLowerCase().includes('presale');
            if (isTicket) return false;
          }

          if (filterShowFollowedOnly) {
            const authorName = (post?.author?.name || (post as any)?.profile?.name || (post as any)?.author_name || 'Anonymous User').toLowerCase();
            const isAuthorFollowed = (discoverProfiles || []).some(p => (p?.name || "User").toLowerCase() === authorName && p.followed);
            const isSelf = (post?.author?.name || '') === profileFullLegalName || (userProfile && (post?.author?.name || '') === userProfile?.name);
            if (!isAuthorFollowed && !isSelf) return false;
          }

          if (filterShowMerchDropsOnlyFromFollowed) {
            const isMerch = 
              post.tag?.toLowerCase().includes('merch') || 
              post.content?.toLowerCase().includes('merch drop') ||
              post.content?.toLowerCase().includes('merch alert') ||
              post.songData;
            
            if (isMerch) {
              const authorName = (post?.author?.name || (post as any)?.profile?.name || (post as any)?.author_name || 'Anonymous User').toLowerCase();
              const inDiscoverList = (discoverProfiles || []).some(p => (p?.name || "User").toLowerCase() === authorName);
              if (inDiscoverList) {
                const isFollowed = (discoverProfiles || []).some(p => (p?.name || "User").toLowerCase() === authorName && p.followed);
                if (!isFollowed) return false;
              }
            }
          }

          // 1-Tap Category Filter Chips Logic
          if (props.activeFeedCategoryFilter && props.activeFeedCategoryFilter !== 'all') {
            const filter = props.activeFeedCategoryFilter;
            if (filter === 'tour') {
              const isTour = 
                Boolean(post.event_data || post.tour_dates || post.eventData || post.tourDates || post.tourData || post.ticketData) ||
                ['TOUR DATES', 'GIG', 'EVENT', 'TOUR ANNOUNCEMENT', 'TICKETS', 'PRESALE', 'LIVE EVENT', 'CONCERT'].includes(post.tag?.toUpperCase() || '') ||
                post.tag?.toLowerCase().includes('tour') ||
                post.tag?.toLowerCase().includes('ticket') ||
                post.tag?.toLowerCase().includes('presale') ||
                post.tag?.toLowerCase().includes('show') ||
                post.tag?.toLowerCase().includes('gig') ||
                post.content?.toLowerCase().includes('tour') ||
                post.content?.toLowerCase().includes('ticket') ||
                post.content?.toLowerCase().includes('presale') ||
                post.content?.toLowerCase().includes('live at') ||
                post.type === 'tour' ||
                post.type === 'event';
              if (!isTour) return false;
            } else if (filter === 'merch') {
              const isMerch = 
                Boolean(post.merch_data || post.merchDrop || post.merchData || post.merch_drop) ||
                ['MERCH DROP', 'MERCH', 'MERCH ALERT', 'STORE', 'VINYL DROP', 'APPAREL'].includes(post.tag?.toUpperCase() || '') ||
                post.tag?.toLowerCase().includes('merch') ||
                post.tag?.toLowerCase().includes('vinyl') ||
                post.tag?.toLowerCase().includes('cassette') ||
                post.tag?.toLowerCase().includes('shirt') ||
                post.tag?.toLowerCase().includes('hoodie') ||
                post.content?.toLowerCase().includes('merch drop') ||
                post.content?.toLowerCase().includes('merch alert') ||
                post.content?.toLowerCase().includes('merch') ||
                post.content?.toLowerCase().includes('pre-order') ||
                post.type === 'merch';
              if (!isMerch) return false;
            } else if (filter === 'audio') {
              const isAudio = 
                Boolean(post.attached_song || post.songData || post.tapeData || post.tape_data || post.audio_url || post.audioUrl) ||
                ['DEMO', 'SONG SHARE', 'LIVE BOOTLEG', 'ALBUM RELEASE', 'AUDIO', 'TRACK', 'CASSETTE', 'SOUNDCHECK'].includes(post.tag?.toUpperCase() || '') ||
                post.tag?.toLowerCase().includes('demo') ||
                post.tag?.toLowerCase().includes('tape') ||
                post.tag?.toLowerCase().includes('audio') ||
                post.tag?.toLowerCase().includes('track') ||
                post.tag?.toLowerCase().includes('bootleg') ||
                post.tag?.toLowerCase().includes('album') ||
                post.tag?.toLowerCase().includes('song') ||
                post.content?.toLowerCase().includes('new single') ||
                post.content?.toLowerCase().includes('demo') ||
                post.content?.toLowerCase().includes('track') ||
                post.content?.toLowerCase().includes('song') ||
                post.content?.toLowerCase().includes('soundboard') ||
                post.type === 'music' ||
                post.type === 'audio';
              if (!isAudio) return false;
            } else if (filter === 'photos') {
              const isPhoto = 
                (Array.isArray(post.images) && post.images.length > 0) ||
                (Array.isArray(post.media_urls) && post.media_urls.length > 0) ||
                Boolean(post.image_url || post.imageUrl || post.mediaUrl || post.media_url || post.photo_pit) ||
                ['PHOTO PIT', 'GALLERY', 'PIT SNAP', 'CONCERT PHOTOS', 'PHOTO'].includes(post.tag?.toUpperCase() || '') ||
                post.tag?.toLowerCase().includes('photo') ||
                post.tag?.toLowerCase().includes('gallery') ||
                post.type === 'photo';
              if (!isPhoto) return false;
            } else if (filter === 'bulletin' || filter === 'gear' || filter === 'classifieds') {
              const isBulletin =
                Boolean(post.classifiedData || post.classified_data) ||
                post.category === 'gear' ||
                post.category === 'classifieds' ||
                post.type === 'gear' ||
                post.type === 'classifieds' ||
                ['GEAR SWAP', 'CLASSIFIED', 'CLASSIFIEDS', 'BULLETIN', 'GEAR'].includes(post.tag?.toUpperCase() || '');
              if (!isBulletin) return false;
            } else if (filter === 'followed' || filter === 'following') {
              const authorName = (post?.author?.name || (post as any)?.profile?.name || (post as any)?.author_name || (post as any)?.authorName || '').toLowerCase().trim();
              const authorId = post?.author?.id || post?.author_id || post?.profile_id || post?.user_id || post?.band_id;
              const authorHandle = (post?.author?.handle || post?.handle || post?.console_handle || '').toLowerCase().trim().replace(/^@/, '');

              const isLocallyFollowed = isProfileFollowedGlobally(
                {
                  id: authorId,
                  band_id: post?.band_id,
                  name: authorName,
                  band_name: post?.band_id ? authorName : undefined,
                  handle: authorHandle,
                  type: post?.band_id ? 'band' : undefined,
                  isBandProfile: Boolean(post?.band_id),
                },
                undefined,
                userProfile?.id
              );

              const isDiscoverFollowed = (discoverProfiles || []).some(p => {
                if (!p?.followed) return false;
                const pName = (p?.name || p?.band_name || '').toLowerCase().trim();
                const pHandle = (p?.handle || '').toLowerCase().trim().replace(/^@/, '');
                const pId = p?.id;
                return (
                  (authorName && pName === authorName) ||
                  (authorId && pId === authorId) ||
                  (authorHandle && pHandle && pHandle === authorHandle)
                );
              });

              const isAllProfilesFollowed = (props.allProfiles || []).some((p: any) => {
                if (!p?.followed && !p?.is_followed) return false;
                const pName = (p?.name || p?.full_name || p?.band_name || '').toLowerCase().trim();
                const pId = p?.id;
                return (
                  (authorName && pName === authorName) ||
                  (authorId && pId === authorId)
                );
              });

              const isFollowedInUserProfile = Boolean(
                userProfile?.following?.includes(authorId) ||
                userProfile?.followed_artists?.includes(authorId) ||
                userProfile?.saved_bands?.includes(authorId) ||
                (authorName && userProfile?.following?.some((f: any) => typeof f === 'string' && f.toLowerCase() === authorName))
              );

              const isSelf = Boolean(
                (authorName && authorName === (profileFullLegalName || '').toLowerCase()) ||
                (userProfile?.name && authorName === userProfile.name.toLowerCase()) ||
                (userProfile?.console_handle && (
                  (authorHandle && authorHandle === userProfile.console_handle.toLowerCase().replace(/^@/, '')) ||
                  (authorName && authorName.includes(userProfile.console_handle.toLowerCase().replace(/^@/, '')))
                )) ||
                (userProfile?.id && (
                  post.author?.id === userProfile.id || 
                  post.profile_id === userProfile.id || 
                  post.user_id === userProfile.id ||
                  post.author_id === userProfile.id
                ))
              );

              if (!isLocallyFollowed && !isDiscoverFollowed && !isAllProfilesFollowed && !isFollowedInUserProfile && !isSelf) {
                return false;
              }
            }
          }
          return true;
        }).map(post => {
          const isBoostActive = !!post.is_boosted && !!post.boost_expires_at && new Date(post.boost_expires_at).getTime() > Date.now();
          return { ...post, effective_boost: isBoostActive };
        }).sort((a, b) => {
          if (a.effective_boost && !b.effective_boost) return -1;
          if (!a.effective_boost && b.effective_boost) return 1;
          return 0;
        });

        const liveUserAvatar = profileAvatarUrl || userProfile?.avatar || userProfile?.avatar_url || userProfile?.profile_avatar;
        const isFilterActive = Boolean(props.activeFeedCategoryFilter && props.activeFeedCategoryFilter !== 'all');

        const postsToPass = filteredFeed.length > 0 ? filteredFeed.map((p: any) => {
          const isOwnerMiguel = isMiguelNameOrProfile(userProfile);
          const pAuthorName = String(p.author?.name || p.authorName || '').toLowerCase().trim();
          const pAuthorHandle = String(p.author?.handle || p.authorHandle || p.author?.console_handle || '').toLowerCase().trim();
          const cleanUserHandle = String(userProfile?.console_handle || userProfile?.handle || '').toLowerCase().replace(/^@/, '').trim();
          const cleanUserName = String(userProfile?.name || userProfile?.full_name || '').toLowerCase().trim();
          
          const isHandleMatch = cleanUserHandle && cleanUserHandle !== 'user' && (
            pAuthorHandle === `@${cleanUserHandle}` ||
            pAuthorHandle === cleanUserHandle ||
            pAuthorName === `@${cleanUserHandle}` ||
            pAuthorName === cleanUserHandle
          );
          const isNameMatch = cleanUserName && cleanUserName !== 'user' && cleanUserName !== 'nexus member' && cleanUserName !== 'anonymous' && (
            pAuthorName === cleanUserName
          );
          const isIdMatch = userProfile?.id && (p.author?.id === userProfile.id || p.profile_id === userProfile.id || p.user_id === userProfile.id || p.authorId === userProfile.id);

          const isSelf = Boolean(
            isIdMatch ||
            isHandleMatch ||
            isNameMatch ||
            (isOwnerMiguel && (pAuthorName.includes('goregrinder') || pAuthorName.includes('bdmceo') || pAuthorHandle.includes('bdmceo')))
          );

          const postWorkspace = (p.workspace_type || p.workspaceType || p.author?.workspace_type || p.author?.workspaceType || '').toLowerCase();
          const pAuthorRole = String(p.authorRole || p.author?.role || '').toLowerCase();

          const isBandPost = postWorkspace === 'band' || pAuthorRole.includes('artist') || pAuthorRole.includes('band') || Boolean(p.author?.isBand);
          const isCreativePost = postWorkspace === 'creative' || pAuthorRole.includes('creative') || pAuthorRole.includes('photographer') || pAuthorRole.includes('media');
          const isPromoterPost = postWorkspace === 'promoter' || pAuthorRole.includes('promoter') || pAuthorRole.includes('venue');

          const rawAvatar = typeof p.author?.avatar === 'string' ? p.author.avatar : (typeof p.authorAvatar === 'string' ? p.authorAvatar : undefined);
          const isGenericUiAvatar = rawAvatar && (rawAvatar.includes('ui-avatars.com') || rawAvatar === 'U' || rawAvatar === 'Anon');

          let resolvedAuthorAvatar: string | undefined;

          if (isCreativePost || (isSelf && portalRole === 'creative' && !isBandPost && !isPromoterPost)) {
            resolvedAuthorAvatar = isSelf ? resolveCreativeLogo(userProfile, rawAvatar) : (rawAvatar || resolveCreativeLogo(null, rawAvatar));
          } else if (isPromoterPost || (isSelf && portalRole === 'promoter' && !isBandPost && !isCreativePost)) {
            resolvedAuthorAvatar = isSelf ? resolvePromoterLogo(userProfile, rawAvatar) : (rawAvatar || resolvePromoterLogo(null, rawAvatar));
          } else if (isBandPost || (isSelf && portalRole === 'band')) {
            resolvedAuthorAvatar = isSelf ? resolveBandLogo(activeBand, userProfile, rawAvatar) : (rawAvatar || resolveBandLogo(p, null, rawAvatar));
          } else {
            resolvedAuthorAvatar = (isSelf && liveUserAvatar)
              ? liveUserAvatar
              : ((!isGenericUiAvatar && rawAvatar)
                ? rawAvatar
                : (isSelf ? liveUserAvatar : (!isGenericUiAvatar ? rawAvatar : undefined)));
          }

          const parsedPost = {
            id: p.id,
            type: p.type || 'post',
            timestamp: p.timestamp || p.created_at || (p.timeAgo && p.timeAgo !== 'Just now' ? p.timeAgo : undefined) || new Date().toISOString(),
            created_at: p.created_at || p.timestamp || new Date().toISOString(),
            timeAgo: p.timeAgo,
            authorId: p.author?.id || p.author_id || (isSelf ? (userProfile?.id || 'current_user') : (p.id ? `mock_author_${p.id}` : `author_${Math.random()}`)),
            authorName: getPostAuthorDisplayName(p.author || { name: p.authorName, legalName: p.legalName || p.realName }),
            legalName: p.legalName || p.realName || p.author?.legalName || p.author?.realName,
            authorAvatar: resolvedAuthorAvatar,
            authorRole: p.authorRole || p.author?.role || (
              p.author?.account_type === 'industry pro' || p.author?.account_type === 'industry_pro'
                ? 'Industry Pro'
                : (p.albumData || p.tag === 'ALBUM RELEASE' ? 'ARTIST' : 'FAN')
            ),
            location: p.location || p.venue || p.scraped_location || p.tagged_venue || p.author?.location || p.author_location,
            taggedVenue: p.taggedVenue || p.tagged_venue || p.venue || p.eventData?.venue || p.eventData?.locationName || p.event_data?.venue || p.event_data?.locationName || p.festivalData?.venueName || p.festival_data?.venueName || '',
            tagged_venue: p.tagged_venue || p.taggedVenue || p.venue || '',
            venue: p.venue,
            groundedVenue: p.groundedVenue || p.grounded_venue,
            grounded_venue: p.grounded_venue || p.groundedVenue,
            message: p.content || p.message || '',
            image_url: p.image || p.image_url || (p.images && p.images[0]),
            images: p.images || (p.image ? [p.image] : p.image_url ? [p.image_url] : undefined),
            youtubeId: p.youtubeId,
            tag: p.tag || (p.songData ? 'SONG SHARE' : p.albumData ? 'ALBUM RELEASE' : p.pollData ? 'SLAM DISCUSSION' : p.tapeData ? 'LIVE BOOTLEG' : undefined),
            songData: p.songData,
            albumData: p.albumData,
            pollData: p.pollData,
            tapeData: p.tapeData,
            tourData: p.tourData,
            merchData: p.merchData,
            ticketData: p.ticketData,
            eventData: p.eventData || p.event_data,
            classifiedData: p.classifiedData || p.classified_data,
            classified_data: p.classifiedData || p.classified_data,
            category: p.category || (p.classifiedData?.listingType) || (p.classified_data?.listingType),
            isVipExclusive: p.isVipExclusive || p.is_vip_exclusive,
            requiredTier: p.requiredTier || p.required_tier,
            vipDiscountPct: p.vipDiscountPct || p.vip_discount_pct,
            likes_count: p.likes || p.likes_count || (Array.isArray(p.reactions) ? p.reactions.reduce((acc: number, r: any) => acc + (r.count || 0), 0) : 0),
            user_liked: p.liked || p.user_liked || false,
            reactions: {
              likes: Array.isArray(p.reactions) ? p.reactions.find((r: any) => ['likes', 'heart', 'thumbs'].includes(r.type))?.count || 0 : p.reactions?.likes || p.reactions?.heart || p.reactions?.thumbs || 0,
              horns: Array.isArray(p.reactions) ? p.reactions.find((r: any) => r.type === 'horns')?.count || 0 : p.reactions?.horns || 0,
              hype: Array.isArray(p.reactions) ? p.reactions.find((r: any) => ['hype', 'flame', 'rocket'].includes(r.type))?.count || 0 : p.reactions?.hype || p.reactions?.flame || p.reactions?.rocket || 0,
              brutal: Array.isArray(p.reactions) ? p.reactions.find((r: any) => ['brutal', 'heavy', 'skull', 'grim'].includes(r.type))?.count || 0 : p.reactions?.brutal || p.reactions?.heavy || p.reactions?.skull || p.reactions?.grim || 0,
              respect: Array.isArray(p.reactions) ? p.reactions.find((r: any) => r.type === 'respect')?.count || 0 : p.reactions?.respect || 0,
              crushed: Array.isArray(p.reactions) ? p.reactions.find((r: any) => r.type === 'crushed')?.count || 0 : p.reactions?.crushed || 0,
            },
            user_reactions: Array.isArray(p.reactions) ? p.reactions.reduce((acc: Record<string, boolean>, r: any) => {
              if (r.active) acc[r.type] = true;
              return acc;
            }, {}) : (p.user_reactions || {}),
            comments: (p.comments || []).map((c: any) => ({
              ...c,
              id: c.id,
              user_id: c.user_id || c.userId || (c.text && String(c.text).toLowerCase().includes('glen benton') ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : undefined),
              userId: c.user_id || c.userId || (c.text && String(c.text).toLowerCase().includes('glen benton') ? '5403162d-1947-43aa-b5f6-38a1bd2a1b80' : undefined),
              author: typeof c.author === 'object' ? c.author?.name : (c.author || c.username || c.author_name || c.name || (c.text && String(c.text).toLowerCase().includes('glen benton') ? 'Miguel Goregrinder Medina' : 'User')),
              author_name: typeof c.author === 'object' ? c.author?.name : (c.author_name || c.author || c.username || c.name || (c.text && String(c.text).toLowerCase().includes('glen benton') ? 'Miguel Goregrinder Medina' : 'User')),
              username: typeof c.author === 'object' ? c.author?.name : (c.username || c.author || c.author_name || c.name || (c.text && String(c.text).toLowerCase().includes('glen benton') ? 'Miguel Goregrinder Medina' : 'User')),
              avatar: c.avatar || c.user_avatar || c.author_avatar || c.avatar_url || c.userAvatar || (c.text && String(c.text).toLowerCase().includes('glen benton') ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' : undefined),
              user_avatar: c.user_avatar || c.avatar || c.author_avatar || c.avatar_url || c.userAvatar || (c.text && String(c.text).toLowerCase().includes('glen benton') ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80' : undefined),
              text: c.content || c.text || '',
              time: c.created_at ? formatPostTimestamp(c.created_at) : (c.time && c.time !== 'Just now' ? c.time : (c.timeAgo && c.timeAgo !== 'Just now' ? c.timeAgo : 'Recently')),
              created_at: c.created_at,
              parent_comment_id: c.parent_comment_id || c.parentCommentId || null,
            })),
            is_pinned: p.is_pinned,
          };
          return mergePostWithReactions(parsedPost, userProfile?.id);
        }) : (isFilterActive ? [] : labelPosts.map((p: any) => mergePostWithReactions(p, userProfile?.id)));

        return (
          <div className="max-w-2xl mx-auto pt-2 pb-28 sm:pb-24 px-4">
            <WelcomeStarterCard
              userProfile={userProfile}
              feed={feed}
              discoverProfiles={discoverProfiles}
              profileAvatarUrl={profileAvatarUrl}
              profileCoverUrl={props.profileCoverUrl}
              profileBlurb={props.profileBlurb}
              onFollowBandsAction={() => {
                if (typeof document !== 'undefined') {
                  const searchInput = document.querySelector<HTMLInputElement>(
                    'input[placeholder*="Bands, Venues"]'
                  );
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                  }
                }
                if (props.setLeftDrawerOpen && props.setDrawerCurrentView) {
                  props.setDrawerCurrentView('following');
                  props.setLeftDrawerOpen(true);
                }
              }}
              onCustomizeProfileAction={() => {
                if (props.setLeftDrawerOpen && props.setDrawerCurrentView) {
                  props.setDrawerCurrentView('profile');
                  props.setLeftDrawerOpen(true);
                }
              }}
              onDropPostAction={() => setIsComposerModalOpen(true)}
            />

            {/* Category Filter Bar positioned right above the feed stream */}
            <div className="max-w-2xl mx-auto px-4 pt-3 pb-1 sm:px-4 text-left">
              <div className="flex items-center justify-between gap-2 mb-1.5 px-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">
                  Filter your Feed
                </span>
                {props.activeFeedCategoryFilter && props.activeFeedCategoryFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => props.setActiveFeedCategoryFilter?.('all')}
                    className="text-[9.5px] font-mono font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider cursor-pointer"
                  >
                    Reset Filter
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 select-none">
                {[
                  { id: 'all', label: 'All Stream', emoji: '🔥' },
                  { id: 'followed', label: 'Followed', emoji: '⭐' },
                  { id: 'bulletin', label: 'Bulletin & Gear', emoji: '📌' },
                  { id: 'tour', label: 'Tour Dates', emoji: '🎟️' },
                  { id: 'merch', label: 'Merch Drops', emoji: '👕' },
                  { id: 'audio', label: 'Demos & Tapes', emoji: '🎙️' },
                  { id: 'photos', label: 'Photo Pit', emoji: '📸' }
                ].map((chip) => {
                  const isSelected = 
                    (props.activeFeedCategoryFilter || 'all') === chip.id || 
                    (chip.id === 'followed' && props.activeFeedCategoryFilter === 'following');
                  return (
                    <button
                      key={`feed-filter-chip-${chip.id}`}
                      type="button"
                      onClick={() => props.setActiveFeedCategoryFilter?.(chip.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-tight whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? portalRole === 'fan_only'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/70 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                            : portalRole === 'promoter'
                            ? 'bg-yellow-500/25 text-yellow-300 border border-yellow-400/80 shadow-[0_0_12px_rgba(234,179,8,0.4)]'
                            : (portalRole === 'band' || userProfile?.active_workspace === 'band')
                            ? 'bg-[#39ff14]/20 text-[#39ff14] border border-[#39ff14]/80 shadow-[0_0_12px_rgba(57,255,20,0.4)]'
                            : portalRole === 'label'
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-400/80 shadow-[0_0_12px_rgba(249,115,22,0.4)]'
                            : portalRole === 'creative'
                            ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/80 shadow-[0_0_12px_rgba(217,70,239,0.4)]'
                            : 'bg-[#6601BB]/30 text-[#e9d5ff] border border-[#a855f7]/70 shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                          : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 border border-zinc-800/80'
                      }`}
                    >
                      <span className="text-sm">{chip.emoji}</span>
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Empty state for active category filter */}
            {isFilterActive && filteredFeed.length === 0 && (
              <div className="bg-[#0b0b0d] border border-zinc-800/80 rounded-2xl p-8 text-center my-4 space-y-3 shadow-xl animate-in fade-in duration-200">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-xl shadow-inner">
                  {(props.activeFeedCategoryFilter === 'followed' || props.activeFeedCategoryFilter === 'following') && '⭐'}
                  {props.activeFeedCategoryFilter === 'tour' && '🎟️'}
                  {props.activeFeedCategoryFilter === 'merch' && '👕'}
                  {props.activeFeedCategoryFilter === 'audio' && '🎙️'}
                  {props.activeFeedCategoryFilter === 'photos' && '📸'}
                  {props.activeFeedCategoryFilter === 'bulletin' && '📌'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    No {(props.activeFeedCategoryFilter === 'followed' || props.activeFeedCategoryFilter === 'following') ? 'Followed Posts' : props.activeFeedCategoryFilter === 'tour' ? 'Tour Dates' : props.activeFeedCategoryFilter === 'merch' ? 'Merch Drops' : props.activeFeedCategoryFilter === 'audio' ? 'Demos & Tapes' : props.activeFeedCategoryFilter === 'bulletin' ? 'Bulletin & Gear Notices' : 'Photo Pit Snaps'} Yet
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    {(props.activeFeedCategoryFilter === 'followed' || props.activeFeedCategoryFilter === 'following')
                      ? 'Follow more bands, venues, labels, and scene members to see their posts exclusively here.'
                      : `There are currently no active posts in the stream tagged with this category.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => props.setActiveFeedCategoryFilter?.('all')}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all cursor-pointer shadow"
                >
                  🔥 Show All Stream
                </button>
              </div>
            )}

            <TimelineFeed
              posts={postsToPass}
              currentUserId={userProfile?.id}
              currentUserName={userProfile?.name}
              userProfile={userProfile}
              portalRole={portalRole}
              onShareToTimeline={(sharedPost) => {
                const newPost: any = {
                  id: `share_${Date.now()}`,
                  authorId: userProfile?.id || 'user',
                  authorName: userProfile?.name || 'You',
                  authorAvatar: userProfile?.avatar || '',
                  legal_name: userProfile?.name,
                  timestamp: new Date().toISOString(),
                  message: `Reposted from @${sharedPost.authorName}: "${sharedPost.message}"`,
                  tag: sharedPost.tag || 'COMMUNITY',
                  songData: sharedPost.songData,
                  albumData: sharedPost.albumData,
                  likes_count: 0,
                  comments: [],
                };
                setLabelPosts(prev => [newPost, ...prev]);
                setFeed(prev => [newPost, ...prev]);
              }}
              onToggleLike={(postId) => {
                handleReaction(postId, 'heart');
                setLabelPosts(prev => prev.map(p => p.id === postId ? { ...p, user_liked: !p.user_liked, likes_count: p.user_liked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 } : p));
              }}
              onEmojiReact={(postId, type) => {
                handleReaction(postId, type);
                setLabelPosts(prev => prev.map(p => {
                  if (p.id !== postId) return p;
                  const newReacts = { ...p.user_reactions };
                  Object.keys(newReacts).forEach(k => newReacts[k] = false);
                  newReacts[type] = !p.user_reactions?.[type];
                  return { ...p, user_reactions: newReacts };
                }));
              }}
              onAddComment={(postId, text, parentCommentId) => {
                handleAddComment(postId, text, parentCommentId);
                const activeName = userProfile?.full_name || userProfile?.name || 'Miguel Goregrinder Medina';
                const activeAvatar = userProfile?.avatar_url || userProfile?.avatar || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80';
                setLabelPosts(prev => prev.map(p => p.id === postId ? {
                  ...p,
                  comments: [
                    ...(p.comments || []),
                    {
                      id: generateValidUUID(),
                      post_id: postId,
                      user_id: userProfile?.id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80',
                      parent_comment_id: parentCommentId || null,
                      username: activeName,
                      author: activeName,
                      avatar: activeAvatar,
                      user_avatar: activeAvatar,
                      text,
                      time: 'Just now'
                    }
                  ]
                } : p));
              }}
              onTogglePin={(postId) => {
                setFeed(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !(p as any).is_pinned } : p));
                setLabelPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !p.is_pinned } : p));
              }}
              onEditPost={(postId, newText, newImages) => {
                setEditingPostId(postId);
                setEditingPostText(newText);
                const resolvedImages = newImages || [];
                const primaryMedia = resolvedImages.length > 0 ? resolvedImages[0] : null;
                if (setEditingPostImages) {
                  setEditingPostImages(resolvedImages);
                }
                handleSaveEdit(postId, newText, resolvedImages);
                setFeed(prev => prev.map(p => p.id === postId ? {
                  ...p,
                  content: newText,
                  message: newText,
                  text: newText,
                  images: resolvedImages,
                  image: primaryMedia,
                  image_url: primaryMedia || undefined,
                  mediaUrl: primaryMedia || undefined,
                  media_url: primaryMedia || undefined
                } : p));
                setLabelPosts(prev => prev.map(p => p.id === postId ? {
                  ...p,
                  content: newText,
                  message: newText,
                  text: newText,
                  images: resolvedImages,
                  image: primaryMedia,
                  image_url: primaryMedia || undefined,
                  mediaUrl: primaryMedia || undefined,
                  media_url: primaryMedia || undefined
                } : p));
              }}
              onDeletePost={(postId) => {
                handleDeletePost(postId, true);
                setFeed(prev => prev.filter(p => p.id !== postId));
                setLabelPosts(prev => prev.filter(p => p.id !== postId));
              }}
              onAddToCart={(item) => {
                setCheckoutItem({
                  type: 'music',
                  data: [{
                    id: `release_${Date.now()}`,
                    title: item.title,
                    bandName: item.bandName,
                    price: item.price,
                    type: item.format,
                    image: (item as any).image || (item as any).coverUrl || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&q=80'
                  }]
                });
              }}
              onOpenProfile={(authorId, authorName) => {
                if (typeof authorId === 'object' && authorId !== null) {
                  setSelectedUserProfile(getProfileForUser(authorId));
                } else if (typeof authorName === 'object' && authorName !== null) {
                  setSelectedUserProfile(getProfileForUser(authorName));
                } else {
                  setSelectedUserProfile(getProfileForUser({
                    id: authorId,
                    name: authorName
                  }));
                }
              }}
              onOpenTicketModal={(ticketData) => {
                setActiveEventData({
                  id: `ticket_${Date.now()}`,
                  venue: ticketData.venue,
                  headliner: ticketData.headliner || 'Event',
                  time: `Doors ${ticketData.doorTime}`
                });
                setIsEventModeActive(true);
              }}
              onOpenMerchModal={(merchData) => {
                setCheckoutItem({ type: 'merch', data: merchData });
                setBottomSheetOpen(true);
              }}
              onVotePoll={handleVotePoll}
              discoverProfiles={discoverProfiles}
              onFollowProfile={props.handleFollowProfile}
              onTriggerNotification={triggerNotification}
              onNavigateToForum={(threadId) => {
                if (threadId) {
                  setSelectedForumThreadId(threadId);
                }
                setActiveTab('forum');
              }}
            />
          </div>
        );
      })()}
      </>
      )}

      {/* SHOP VIEW */}
      {activeTab === 'shop' && (
        <Suspense fallback={<LazyTabFallback />}>
          <StorefrontView
            activeTab={activeTab}
            shopBrandFilter={shopBrandFilter}
            setShopBrandFilter={setShopBrandFilter}
            portalRole={portalRole}
            shopSearchQuery={shopSearchQuery}
            setShopSearchQuery={setShopSearchQuery}
            shopCategory={shopCategory}
            setShopCategory={setShopCategory}
            shopItems={shopItems}
            setShopItems={setShopItems}
            selectedMerch={selectedMerch}
            setSelectedMerch={setSelectedMerch}
            selectedMerchSize={selectedMerchSize}
            setSelectedMerchSize={setSelectedMerchSize}
            selectedMerchQty={selectedMerchQty}
            setSelectedMerchQty={setSelectedMerchQty}
            isCheckoutModalOpen={isCheckoutModalOpen}
            setIsCheckoutModalOpen={setIsCheckoutModalOpen}
            checkoutSuccess={checkoutSuccess}
            setCheckoutSuccess={setCheckoutSuccess}
            userProfile={userProfile}
            triggerNotification={triggerNotification}
            getSupabase={getSupabase}
            openCheckout={props.openCheckout}
            addToCart={props.addToCart}
            cartItems={props.cartItems}
            setCartItems={props.setCartItems}
            isCartOpen={props.isCartOpen}
            setIsCartOpen={props.setIsCartOpen}
            chats={props.chats}
            setChats={props.setChats}
            allProfiles={allProfiles}
            setFeed={setFeed}
            setLabelPosts={setLabelPosts}
            onAddFeedPost={(p: any) => {
              setFeed((prev: any[]) => [p, ...prev]);
              setLabelPosts((prev: any[]) => [p, ...prev]);
            }}
          />
        </Suspense>
      )}

      {/* FORUM VIEW */}
      {activeTab === 'forum' && (
        <Suspense fallback={<LazyTabFallback />}>
          <ForumView
            userProfile={userProfile}
            profileHandle={props.profileHandle}
            triggerNotification={triggerNotification}
            profileAvatarUrl={profileAvatarUrl}
            discoverProfiles={discoverProfiles}
            allProfiles={allProfiles}
            initialThreadId={selectedForumThreadId}
            onClearInitialThread={() => setSelectedForumThreadId(null)}
          />
        </Suspense>
      )}

      {/* MESSENGER INBOX VIEW */}
      {activeTab === 'messages' && (
        <div className="w-full flex-1 min-h-0 animate-in fade-in duration-300 flex flex-col overflow-hidden">
          <Suspense fallback={<LazyTabFallback />}>
            <InboxTerminal
              onBack={() => setActiveTab('feed')}
              userProfile={userProfile}
              allProfiles={allProfiles}
              discoverProfiles={discoverProfiles}
              onSelectProfile={setSelectedUserProfile}
            />
          </Suspense>
        </div>
      )}

      {/* MEDIA GALLERY / PHOTO PIT VIEW */}
      {(activeTab === 'gallery' || activeTab === 'photopit') && (
        <Suspense fallback={<LazyTabFallback />}>
          <PhotoPitView
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            feed={feed}
            setFeed={setFeed}
            triggerNotification={triggerNotification}
            profileFullLegalName={profileFullLegalName}
            profileAvatarUrl={profileAvatarUrl}
            portalRole={portalRole}
            syncPostToSupabase={syncPostToSupabase}
            uploadBase64ToStorage={uploadBase64ToStorage}
            compressImageInSocialFeed={compressImageInSocialFeed}
            triggerPictureViewer={triggerPictureViewer}
            setActiveTab={setActiveTab}
          />
        </Suspense>
      )}

      {/* REELS / CLIPS VIEW */}
      {(activeTab === 'reels' || activeTab === 'clips') && (
        <Suspense fallback={<LazyTabFallback />}>
          <ClipsView
            userProfile={userProfile}
            clips={clips}
            setClips={setClips}
            triggerNotification={triggerNotification}
            setActiveTab={setActiveTab}
            portalRole={portalRole}
            deleteClip={deleteClip}
            getSupabase={getSupabase}
            onSelectProfile={(userPayload) => setSelectedUserProfile(getProfileForUser(userPayload))}
          />
        </Suspense>
      )}
      </>
  );
};
