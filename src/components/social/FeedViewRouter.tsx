import React from 'react';
import { StorefrontView } from './StorefrontView';
import { InboxTerminal } from '../messaging/InboxTerminal';
import { CreatePostCard } from './CreatePostCard';
import { TimelineFeed } from './TimelineFeed';
import { PhotoPitView } from './PhotoPitView';
import { ForumView } from './ForumView';
import { StoriesCarouselSection } from './StoriesCarouselSection';
import { ClipsView } from './ClipsView';
import { formatPostTimestamp } from '../../utils/socialFeedUtils';
import { getComposerRoleTheme } from './CreatePostCard';
import { mergePostWithReactions } from './utils/reactionStore';

export const FeedViewRouter: React.FC<any> = (props) => {
  const [feedStreamScope, setFeedStreamScope] = React.useState<'all' | 'workspace'>('all');

  const normRole = (props.portalRole || props.userProfile?.active_workspace || 'industry_pro').toLowerCase();
  const isWorkspace = ['band', 'label', 'promoter', 'creative', 'industry_pro'].includes(normRole);

  const theme = React.useMemo(() => {
    return (props.roleTheme && typeof props.roleTheme === 'object' && 'roleTitle' in props.roleTheme)
      ? props.roleTheme
      : getComposerRoleTheme(normRole);
  }, [props.roleTheme, normRole]);

  const workspaceStreamLabel = React.useMemo(() => {
    if (normRole === 'band' || normRole.includes('artist')) {
      return `${props.activeBand?.name || 'Band'} Stream`;
    }
    if (normRole === 'label') {
      return `${props.userProfile?.label_company_name || 'Label'} Desk`;
    }
    if (normRole === 'promoter') {
      return `${props.userProfile?.promoter_metadata?.brand_name || props.userProfile?.promoter_name || 'Promoter'} Wire`;
    }
    if (normRole === 'creative') {
      return `${props.userProfile?.creative_metadata?.business_name || props.userProfile?.creative_name || 'Creative'} Reel`;
    }
    return 'Operator Wire';
  }, [normRole, props.activeBand, props.userProfile]);

  const {
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

  return (
    <>
          {activeTab === 'feed' && (
            <>
              {/* Scene Creator Box */}
              <div className="max-w-2xl mx-auto px-4 pt-3 pb-0 sm:px-4">
                <CreatePostCard
                  roleTheme={props.roleTheme || props.portalRole}
                  portalRole={props.portalRole}
                  activeBand={props.activeBand}
                  bands={props.bands}
                  profileFullLegalName={props.profileFullLegalName}
                  profileHandle={props.profileHandle}
                  profileAvatarUrl={props.profileAvatarUrl}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  postIdentity={postIdentity}
                  setPostIdentity={setPostIdentity}
                  newPostText={newPostText}
                  setNewPostText={setNewPostText}
                  newPostImageUrl={mediaUrl}
                  setNewPostImageUrl={setMediaUrl}
                  selectedMediaFiles={selectedMediaFiles}
                  setSelectedMediaFiles={setSelectedMediaFiles}
                  handleMediaUpload={handleMediaUpload}
                  newPostCategory={newPostTag}
                  setNewPostCategory={setNewPostTag}
                  handleCreatePost={handleCreatePost}
                  availableIdentities={userProfile?.bands || []}
                  youtubeUrl={youtubeUrl}
                  setYoutubeUrl={setYoutubeUrl}
                  taggedVenue={taggedVenue}
                  setTaggedVenue={setTaggedVenue}
                  setShowPollModal={setShowPollModal}
                  pollQuestion={pollQuestion}
                  setPollQuestion={setPollQuestion}
                  pollVariant={pollVariant}
                  setPollVariant={setPollVariant}
                  pollOptions={pollOptions}
                  setPollOptions={setPollOptions}
                  pollIsTimed={pollIsTimed}
                  setPollIsTimed={setPollIsTimed}
                  pollTimerDays={pollTimerDays}
                  setPollTimerDays={setPollTimerDays}
                  pollTimerHours={pollTimerHours}
                  setPollTimerHours={setPollTimerHours}
                  setShowMerchDropModal={setShowMerchDropModal}
                  merchDropName={merchDropName}
                  setMerchDropName={setMerchDropName}
                  merchDropPrice={merchDropPrice}
                  setMerchDropPrice={setMerchDropPrice}
                  setShowSongModal={setShowSongModal}
                  attachedSong={attachedSong}
                  setAttachedSong={setAttachedSong}
                  taggedBands={taggedBands}
                  setTaggedBands={setTaggedBands}
                  tapeTitle={tapeTitle}
                  setTapeTitle={setTapeTitle}
                  tapeBand={tapeBand}
                  setTapeBand={setTapeBand}
                  tapeDate={tapeDate}
                  setTapeDate={setTapeDate}
                  tapeDuration={tapeDuration}
                  setTapeDuration={setTapeDuration}
                  tapeAudioUrl={tapeAudioUrl}
                  setTapeAudioUrl={setTapeAudioUrl}
                  tapeAudioFileName={tapeAudioFileName}
                  isUploadingTapeAudio={isUploadingTapeAudio}
                  handleTapeAudioUpload={handleTapeAudioUpload}
                  tapeFileInputRef={tapeFileInputRef}
                  triggerNotification={triggerNotification}
                  setShowEventModal={props.setShowEventModal}
                  eventTitle={props.eventTitle}
                  setEventTitle={props.setEventTitle}
                  eventType={props.eventType}
                  setEventType={props.setEventType}
                  eventDate={props.eventDate}
                  setEventDate={props.setEventDate}
                  eventTime={props.eventTime}
                  setEventTime={props.setEventTime}
                  eventLocationName={props.eventLocationName}
                  setEventLocationName={props.setEventLocationName}
                  eventAddress={props.eventAddress}
                  setEventAddress={props.setEventAddress}
                  eventIsSecret={props.eventIsSecret}
                  setEventIsSecret={props.setEventIsSecret}
                  eventLineup={props.eventLineup}
                  setEventLineup={props.setEventLineup}
                  eventFlyerUrl={props.eventFlyerUrl}
                  setEventFlyerUrl={props.setEventFlyerUrl}
                  eventDescription={props.eventDescription}
                  setEventDescription={props.setEventDescription}
                  eventCost={props.eventCost}
                  setEventCost={props.setEventCost}
                  eventTicketUrl={props.eventTicketUrl}
                  setEventTicketUrl={props.setEventTicketUrl}
                  eventData={props.eventData}
                  setEventData={props.setEventData}
                />
              </div>

      {/* Stories Carousel */}
      <StoriesCarouselSection
        stories={stories}
        onAddStory={() => setShowUploadStoryModal(true)}
        onSelectStory={(story) => setActiveStory(story)}
      />

      {/* Dynamic Filtered Feed */}
      {(() => {
        const filteredFeed = feed.filter(post => {
          // Hide quiet vault uploads / gallery-only items from the public feed
          if (post.is_gallery_only === true || post.post_to_feed === false || post.hidden_from_feed === true || post.gallery_only === true) {
            return false;
          }

          // If scoped to workspace, only keep posts authored by or associated with this workspace entity
          if (feedStreamScope === 'workspace' && isWorkspace) {
            const authorName = (post.author?.name || post.authorName || '').toLowerCase();
            const authorRole = (post.authorRole || post.author?.role || '').toLowerCase();
            const workspaceType = (post.workspace_type || post.workspaceType || post.author?.workspace_type || '').toLowerCase();
            const personaId = post.persona_id || post.author?.personaId || '';

            if (normRole === 'band' || normRole.includes('artist')) {
              const activeBandName = (props.activeBand?.name || '').toLowerCase();
              const activeBandId = String(props.activeBand?.id || '');
              const matchesBand =
                (activeBandName && (authorName === activeBandName || post.tapeData?.band?.toLowerCase() === activeBandName || post.songData?.artist?.toLowerCase() === activeBandName)) ||
                (activeBandId && personaId.includes(activeBandId)) ||
                workspaceType === 'band' ||
                authorRole.includes('band') ||
                authorRole.includes('artist');
              if (!matchesBand) return false;
            } else if (normRole === 'label') {
              const labelName = (userProfile?.label_company_name || '').toLowerCase();
              const matchesLabel =
                (labelName && authorName === labelName) ||
                personaId.includes('label') ||
                workspaceType === 'label' ||
                authorRole.includes('label');
              if (!matchesLabel) return false;
            } else if (normRole === 'promoter') {
              const promoterName = (userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_name || '').toLowerCase();
              const matchesPromoter =
                (promoterName && authorName === promoterName) ||
                personaId.includes('promoter') ||
                workspaceType === 'promoter' ||
                authorRole.includes('promoter');
              if (!matchesPromoter) return false;
            } else if (normRole === 'creative') {
              const creativeName = (userProfile?.creative_metadata?.business_name || userProfile?.creative_name || '').toLowerCase();
              const matchesCreative =
                (creativeName && authorName === creativeName) ||
                personaId.includes('creative') ||
                workspaceType === 'creative' ||
                authorRole.includes('creative');
              if (!matchesCreative) return false;
            } else if (normRole === 'industry_pro') {
              const matchesPro =
                workspaceType === 'industry_pro' ||
                authorRole.includes('pro') ||
                personaId.includes('pro');
              if (!matchesPro) return false;
            }
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
            } else if (filter === 'following') {
              const authorName = (post?.author?.name || (post as any)?.profile?.name || (post as any)?.author_name || '').toLowerCase();
              const isAuthorFollowed = (discoverProfiles || []).some(p => (p?.name || '').toLowerCase() === authorName && p.followed);
              const isSelf = Boolean(
                (post?.author?.name || '') === profileFullLegalName ||
                (userProfile && (post?.author?.name || '') === userProfile?.name) ||
                post.author?.isYou ||
                post.isYou ||
                (userProfile?.id && (post.author?.id === userProfile.id || post.profile_id === userProfile.id || post.user_id === userProfile.id))
              );
              if (!isAuthorFollowed && !isSelf) return false;
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
          const isSelf = Boolean(
            p.author?.isYou ||
            p.isYou ||
            (userProfile?.id && (p.author?.id === userProfile.id || p.profile_id === userProfile.id || p.user_id === userProfile.id)) ||
            (userProfile?.console_handle && p.author?.name && (
              p.author.name.toLowerCase().includes(userProfile.console_handle.toLowerCase().replace(/^@/, '')) ||
              (p.authorName && p.authorName.toLowerCase().includes(userProfile.console_handle.toLowerCase().replace(/^@/, '')))
            ))
          );

          const rawAvatar = typeof p.author?.avatar === 'string' ? p.author.avatar : (typeof p.authorAvatar === 'string' ? p.authorAvatar : undefined);
          const isGenericUiAvatar = rawAvatar && (rawAvatar.includes('ui-avatars.com') || rawAvatar === 'U' || rawAvatar === 'Anon');
          const resolvedAuthorAvatar = (!isGenericUiAvatar && rawAvatar)
            ? rawAvatar
            : (isSelf ? liveUserAvatar : (!isGenericUiAvatar ? rawAvatar : undefined));

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
              id: c.id,
              username: typeof c.author === 'object' ? c.author?.name : (c.author || c.username || 'User'),
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
          <div className="max-w-2xl mx-auto pt-2 pb-2 px-4">
            {/* Stream Scope Toggle Bar */}
            {isWorkspace && (
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedStreamScope('all')}
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      feedStreamScope === 'all'
                        ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                        : 'bg-[#0d0e12] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    🌐 Scene Network
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedStreamScope('workspace')}
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                      feedStreamScope === 'workspace'
                        ? `${theme.badgeBg} ${theme.badgeText} ${theme.accentBorder} shadow-sm`
                        : 'bg-[#0d0e12] text-zinc-400 border-zinc-800/80 hover:text-zinc-200'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.glowHex }} />
                    {workspaceStreamLabel}
                  </button>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 hidden sm:inline">
                  {feedStreamScope === 'workspace' ? 'Workspace scoped' : 'All signals'}
                </span>
              </div>
            )}

            {/* Empty state for active category filter */}
            {isFilterActive && filteredFeed.length === 0 && (
              <div className="bg-[#0b0b0d] border border-zinc-800/80 rounded-2xl p-8 text-center my-4 space-y-3 shadow-xl animate-in fade-in duration-200">
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-xl shadow-inner">
                  {props.activeFeedCategoryFilter === 'tour' && '🎟️'}
                  {props.activeFeedCategoryFilter === 'merch' && '👕'}
                  {props.activeFeedCategoryFilter === 'audio' && '🎙️'}
                  {props.activeFeedCategoryFilter === 'photos' && '📸'}
                  {props.activeFeedCategoryFilter === 'following' && '⭐'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">
                    No {props.activeFeedCategoryFilter === 'tour' ? 'Tour Dates' : props.activeFeedCategoryFilter === 'merch' ? 'Merch Drops' : props.activeFeedCategoryFilter === 'audio' ? 'Demos & Tapes' : props.activeFeedCategoryFilter === 'photos' ? 'Photo Pit Snaps' : 'Followed Posts'} Yet
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    {props.activeFeedCategoryFilter === 'following'
                      ? 'Follow more bands, venues, and scene members to see their posts here.'
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
                setLabelPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { id: 'c_' + Date.now(), post_id: postId, parent_comment_id: parentCommentId || null, username: userProfile?.name || 'Fan', text, time: 'Just now' }] } : p));
              }}
              onTogglePin={(postId) => {
                setFeed(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !(p as any).is_pinned } : p));
                setLabelPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !p.is_pinned } : p));
              }}
              onEditPost={(postId, newText) => {
                setEditingPostId(postId);
                setEditingPostText(newText);
                handleSaveEdit(postId);
                setFeed(prev => prev.map(p => p.id === postId ? { ...p, content: newText, message: newText } : p));
                setLabelPosts(prev => prev.map(p => p.id === postId ? { ...p, content: newText, message: newText } : p));
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
            />
          </div>
        );
      })()}
      </>
      )}

      {/* SHOP VIEW */}
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
      />

      {/* FORUM VIEW */}
      {activeTab === 'forum' && (
        <ForumView
          userProfile={userProfile}
          profileHandle={props.profileHandle}
          triggerNotification={triggerNotification}
          profileAvatarUrl={profileAvatarUrl}
          discoverProfiles={discoverProfiles}
          allProfiles={allProfiles}
        />
      )}


      {/* MESSENGER INBOX VIEW */}
      {activeTab === 'messages' && (
        <div className="w-full h-[calc(100dvh-125px)] sm:h-[calc(100dvh-70px)] animate-in fade-in duration-300 flex flex-col">
          <InboxTerminal
            onBack={() => setActiveTab('feed')}
            userProfile={userProfile}
            allProfiles={allProfiles}
            discoverProfiles={discoverProfiles}
            onSelectProfile={setSelectedUserProfile}
          />
        </div>
      )}

      {/* MEDIA GALLERY / PHOTO PIT VIEW */}
      {(activeTab === 'gallery' || activeTab === 'photopit') && (
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
      )}




















      {/* REELS / CLIPS VIEW */}
      {(activeTab === 'reels' || activeTab === 'clips') && (
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
      )}
      </>
  );
};
