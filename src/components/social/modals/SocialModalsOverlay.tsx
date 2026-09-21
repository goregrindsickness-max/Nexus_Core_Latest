import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Settings, X } from 'lucide-react';
import { PhotoLightboxModal } from './PhotoLightboxModal';
import { InlineShareModal } from './InlineShareModal';
import { InlineReactionsModal } from './InlineReactionsModal';
import { ClipsOverlaysModal } from './ClipsOverlaysModal';
import { UploadStoryModal } from './UploadStoryModal';
import { EventCompanionModal } from './EventCompanionModal';
import { TicketEscrowModal } from './TicketEscrowModal';
import { CartDrawer } from '../drawers/CartDrawer';
import { StripeCartCheckoutModal } from './StripeCartCheckoutModal';
import { StripeCheckoutModal } from '../StripeCheckoutModal';
import { AlbumDetailsModal } from './AlbumDetailsModal';
import { AttachSongModal } from './AttachSongModal';
import { SongShareModal } from './SongShareModal';
import { AddItemModal } from './AddItemModal';
import { SocialMapOverlay } from '../SocialMapOverlay';
import { PollCreationModal } from './PollCreationModal';
import { MerchDropModal } from './MerchDropModal';
import { CreateDIYEventModal } from './CreateDIYEventModal';
import { ReportProfileModal } from './ReportProfileModal';
import { SubmitEpkModal, ViewEpksModal } from './EpkModals';
import { AdminPinModal } from './AdminPinModal';
import { AdminConsoleModal } from './AdminConsoleModal';
import { PublicProfileModal } from './PublicProfileModal';
import { FollowersModal } from '../follows';
import { DirectMessageDrawer } from './DirectMessageDrawer';
import { InboxPreferences } from '../../messaging/InboxPreferences';
import { FanPitWallDrawer } from '../drawers/FanPitWallDrawer';
import { InteractiveCropperModal } from '../../InteractiveCropperModal';
import { MetalArchivesImportModal } from './MetalArchivesImportModal';
import { profileStore } from '../../../utils/indexedDB';
import { uploadBase64ToStorage, normalizeLoadedProfile as defaultNormalizeLoadedProfile, sanitizeCreativePayload, formatCreativePayload, extractGlobalProfilePayload, executeWithSchemaResilience, sanitizeBandPayload } from '../../../supabase';
import { FeedItem } from '../../../data/socialFeedMockData';

export interface SocialModalsOverlayProps {
  [key: string]: any;
}

export const SocialModalsOverlay: React.FC<SocialModalsOverlayProps> = (props) => {
  const normalizeLoadedProfile = props.normalizeLoadedProfile || defaultNormalizeLoadedProfile;
  const handleToggleMutualFollow = props.handleToggleMutualFollow;
  const {
    Account, Add, Adjust, Admin, Avatar, Banner, CHECKED, CRYPTOGRAPHIC, Cart, Changes, Check, Checkout, Companion, Console, Conversation, Cover, Creation, Direct, Drawer, Drop, END, EPK, EPKs, Event, Failed, Fan, FeedItem, Followers, Following, Footnote, Gig, Global, Header, Immediately, Inbox, IndexedDB, Item, Just, Keep, MODAL, Map, Merch, Messaging, Mini, Modal, Mode, New, Null, Overlay, PIN, PROFILE, PUBLIC, Poll, Preferences, Privacy, Pro, Profile, Record, Report, SANITY, SIGNAL, Save, Saving, Sections, Secured, Share, Simulate, Social, Song, Story, Stripe, Submit, TO, Terminal, URL, Updated, Upload, User, V2, VIEW, View, Write, _, _profile_v1_, activeClipComments, activeClipMetrics, activeClipShare, activeEventData, activePitWallShow, active_, adding, adminPIN, all, allProfiles, and, animate, any, app, as, aspectRatio, author, authorName, authorRole, auto, autoAvatarPost, avatar_update_, avatars, b, back, backdrop, band, bandJoinRequests, banner, banners, between, bg, black, blacklistRecords, blur, bold, border, bottomSheetOpen, setBottomSheetOpen, checkoutItem, setCheckoutItem, bucket, cache, cartItems, center, charAt, chats, clips, col, col_, collPlayerActiveId, collPlayerActiveTrackId, collPlayerIsPlaying, collection, collectionTab, colors, columnToUpdate, columns, computed, cover, creative, cropped, croppedBase64, cropperImageSrc, cropperOpen, cropperType, current, damping, data, database, date, deleteClip, display, drawer, effect, epkFilterTab, epkFormBandName, epkFormBio, epkFormHistory, epkFormMembers, epkFormProfileLink, epkFormTracks, epkSubmissionSuccess, epkSubmissions, eventModeTab, exit, expandedEpkId, fixed, flex, font, full, gap, getProfileForUser, getSupabase, globalActiveStatus, globalReadReceipts, h, handleFollowProfile, handleSaveItem, handleShareExternal, handleShareToTimeline, handleTicketAction, hover, idx, imageSrc, inAppSongsList, inbox, indexedKey, initial, inset, instantly, isAdminMode, isBlacklistLoading, isCartOpen, isDragOver, isEmbedded, isEpkDragOver, isEventModeActive, isOpen, isTicketScanned, item, itemCategory, itemDescription, itemImages, itemLocation, itemPrice, itemTitle, items, justify, l, label, labelRosterTicker, leading, liveFollowsList, liveFollowsLoading, liveSetlists, local, look, mapFilterGenre, max, md, memory, merch, merchDropIsTimed, merchDropName, merchDropPrice, merchDropThumbnail, merchDropTimerHours, merchDropTimerMinutes, message, ml, mono, myCollections, my_label, newBlacklistType, newBlacklistValue, newClipBandName, newClipCaption, newClipSongTitle, newClipTags, newClipTitle, newClipVideoUrl, newPurchases, newStoryBorder, newStoryCaption, newStoryImage, newStoryMusic, newStoryStickerScale, newStoryStickerX, newStoryStickerY, newStoryStickers, newStoryTextColorHex, newStoryTextOverlay, newStoryTextSize, newStoryTextStyle, newStoryTextX, newStoryTextY, newStoryVideo, nexus_, nexus_my_collections_v1, nodes, normal, on, onClearCart, onClose, onCropComplete, onSave, only, opacity, openCheckout, openFloatingChat, optimizing, out, overflow, overwriting, persist, picture, pollIsTimed, pollOptions, pollQuestion, pollTimerDays, pollTimerHours, pollVariant, portalRole, post, postedByValue, prevent, previewImage, price, productId, profile, profileActivePlaybackTrackId, profileActiveTab, profileBlurb, profileCacheKey, profileFullLegalName, profileGenres, profileHandle, profileIsPlaying, profileMicroGenres, profilePlaybackProgress, profilePrimaryGenres, profileSceneRoles, profileStore, profileTopSongArtist, profileTopSongTitle, profile_anonymous, profiles, promoter, publicUrl, purple, px, py, quantity, reactionsActiveTab, reportReason, reports, returned, right, rosterExpanded, rounded, sans, save, saveProfileData, savedData, savedStr, scanTime, selectedAlbum, selectedChatId, selectedCityFilter, selectedClipFile, selectedGigOnMap, selectedLabelBand, selectedMapEvent, selectedStorySticker, selectedUserProfile, server, session, setActiveClipComments, setActiveClipMetrics, setActiveClipShare, setActivePitWallShow, setActiveTab, setAdminPIN, setAttachedSong, setBandJoinRequests, setBlacklistRecords, setCartItems, setChats, setClips, setCollPlayerActiveId, setCollPlayerActiveTrackId, setCollPlayerIsPlaying, setCollectionTab, setCropperOpen, setDrawerCurrentView, setEpkFilterTab, setEpkFormBandName, setEpkFormBio, setEpkFormHistory, setEpkFormMembers, setEpkFormProfileLink, setEpkFormTracks, setEpkSubmissionSuccess, setEpkSubmissions, setEventModeTab, setExpandedEpkId, setFeed, setGlobalActiveStatus, setGlobalReadReceipts, setIsAdminMode, setIsBlacklistLoading, setIsCartOpen, setIsDragOver, setIsEpkDragOver, setIsEventModeActive, setIsTicketScanned, setItemCategory, setItemDescription, setItemImages, setItemLocation, setItemPrice, setItemTitle, setLeftDrawerOpen, setLiveProfileStats, setMapFilterGenre, setMerchDropIsTimed, setMerchDropName, setMerchDropPrice, setMerchDropThumbnail, setMerchDropTimerHours, setMerchDropTimerMinutes, setMyCollections, setNewBlacklistType, setNewBlacklistValue, setNewClipBandName, setNewClipCaption, setNewClipSongTitle, setNewClipTags, setNewClipTitle, setNewClipVideoUrl, setNewStoryBorder, setNewStoryCaption, setNewStoryImage, setNewStoryMusic, setNewStoryStickerScale, setNewStoryStickerX, setNewStoryStickerY, setNewStoryStickers, setNewStoryTextColorHex, setNewStoryTextOverlay, setNewStoryTextSize, setNewStoryTextStyle, setNewStoryTextX, setNewStoryTextY, setNewStoryVideo, setPollIsTimed, setPollOptions, setPollQuestion, setPollTimerDays, setPollTimerHours, setPollVariant, setPreviewImage, setProfileActivePlaybackTrackId, setProfileActiveTab, setProfileAvatarUrl, setProfileBlurb, setProfileCoverUrl, setProfileFavoriteSong, setProfileIsPlaying, setProfilePlaybackProgress, setProfileTopSongArtist, setProfileTopSongTitle, setProfileTopSongUrl, setReactionsActiveTab, setReportReason, setReports, setRosterExpanded, setScanTime, setSecondaryUserProfile, setSelectedAlbum, setSelectedChatId, setSelectedCityFilter, setSelectedClipFile, setSelectedGalleryItem, setSelectedGigOnMap, setSelectedLabelBand, setSelectedMapEvent, setSelectedSecondaryUserProfile, setSelectedStorySticker, setSelectedUserProfile, setSharingPost, setShopBrandFilter, setShowAddItemModal, setShowAdminPINModal, setShowClipsAnalyticsModal, setShowConversationSettings, setShowInboxSettings, setShowMapModal, setShowMerchDropModal, setShowMyClipsModal, setShowPollModal, setShowReportModal, setShowSongModal, setShowSongShareModal, setShowStripeCartCheckout, setShowSubmitEpkModal, setShowUploadClipModal, setShowUploadStoryModal, setShowViewEpksModal, setSongAlbum, setSongArtist, setSongCoverUrl, setSongShareAlbum, setSongShareArtist, setSongShareCoverUrl, setSongShareSpotifyUrl, setSongShareTitle, setSongSpotifyUrl, setSongTitle, setStories, setTimeout, setUserProfile, setVenueMessageInput, setVenueMessages, setViewingFollowersOrFollowing, setViewingReactionsPost, setViewingReceipt, setWhoCanReachMe, settings, shadow, sharingPost, showAddItemModal, showAdminPINModal, showClipsAnalyticsModal, showConversationSettings, showInboxSettings, showMapModal, showMerchDropModal, showMyClipsModal, showPollModal, showReportModal, showSongModal, showSongShareModal, showStripeCartCheckout, showSubmitEpkModal, showUploadClipModal, showUploadStoryModal, showViewEpksModal, size, sizes, sm, songAlbum, songArtist, songCoverUrl, songShareAlbum, songShareArtist, songShareCoverUrl, songShareSpotifyUrl, songShareTitle, songSpotifyUrl, songTitle, space, spring, state, states, sticky, stiffness, string, supabase, syncPostToSupabase, synchronized, table, take, targetProfile, terminal, text, the, thumbnail, toISOString, toUpperCase, token, too, top, tracking, transition, triggerNotification, triggerPictureViewer, updateErr, updated, updatedProf, upload, uploadBase64ToStorage, uppercase, userProfile, userProfileId, using, val, venueMessageInput, venueMessages, viewingFollowersOrFollowing, viewingReactionsPost, viewingReceipt, w, white, whoCanReachMe, wider, widest, x, xs, y, z, zinc
  } = props as any;

  return (
    <>
      <PhotoLightboxModal
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
      />
      <InlineShareModal
        sharingPost={sharingPost}
        setSharingPost={setSharingPost}
        handleShareToTimeline={handleShareToTimeline}
        handleShareExternal={handleShareExternal}
      />

      <InlineReactionsModal
        viewingReactionsPost={viewingReactionsPost}
        setViewingReactionsPost={setViewingReactionsPost}
        reactionsActiveTab={reactionsActiveTab}
        setReactionsActiveTab={setReactionsActiveTab}
        allProfiles={allProfiles}
        userProfile={userProfile}
      />

      <ClipsOverlaysModal
    showClipsAnalyticsModal={showClipsAnalyticsModal}
    setShowClipsAnalyticsModal={setShowClipsAnalyticsModal}
    showMyClipsModal={showMyClipsModal}
    setShowMyClipsModal={setShowMyClipsModal}
    showUploadClipModal={showUploadClipModal}
    setShowUploadClipModal={setShowUploadClipModal}
    activeClipComments={activeClipComments}
    setActiveClipComments={setActiveClipComments}
    activeClipShare={activeClipShare}
    setActiveClipShare={setActiveClipShare}
    activeClipMetrics={activeClipMetrics}
    setActiveClipMetrics={setActiveClipMetrics}
    clips={clips}
    setClips={setClips}
    deleteClip={deleteClip}
    newClipTitle={newClipTitle}
    setNewClipTitle={setNewClipTitle}
    newClipCaption={newClipCaption}
    setNewClipCaption={setNewClipCaption}
    newClipVideoUrl={newClipVideoUrl}
    setNewClipVideoUrl={setNewClipVideoUrl}
    newClipSongTitle={newClipSongTitle}
    setNewClipSongTitle={setNewClipSongTitle}
    newClipBandName={newClipBandName}
    setNewClipBandName={setNewClipBandName}
    newClipTags={newClipTags}
    setNewClipTags={setNewClipTags}
    selectedClipFile={selectedClipFile}
    setSelectedClipFile={setSelectedClipFile}
    userProfile={userProfile}
    triggerNotification={triggerNotification}
  />
  {/* Upload Story Overlay Modal */}
      <UploadStoryModal
        showUploadStoryModal={showUploadStoryModal}
        setShowUploadStoryModal={setShowUploadStoryModal}
        newStoryImage={newStoryImage}
        setNewStoryImage={setNewStoryImage}
        newStoryVideo={newStoryVideo}
        setNewStoryVideo={setNewStoryVideo}
        newStoryMusic={newStoryMusic}
        setNewStoryMusic={setNewStoryMusic}
        newStoryCaption={newStoryCaption}
        setNewStoryCaption={setNewStoryCaption}
        newStoryTextOverlay={newStoryTextOverlay}
        setNewStoryTextOverlay={setNewStoryTextOverlay}
        newStoryTextStyle={newStoryTextStyle}
        setNewStoryTextStyle={(val: any) => setNewStoryTextStyle(val)}
        newStoryTextColorHex={newStoryTextColorHex}
        setNewStoryTextColorHex={setNewStoryTextColorHex}
        newStoryTextSize={newStoryTextSize}
        setNewStoryTextSize={setNewStoryTextSize}
        newStoryTextX={newStoryTextX}
        setNewStoryTextX={setNewStoryTextX}
        newStoryTextY={newStoryTextY}
        setNewStoryTextY={setNewStoryTextY}
        newStoryBorder={newStoryBorder}
        setNewStoryBorder={setNewStoryBorder}
        newStoryStickers={newStoryStickers}
        setNewStoryStickers={setNewStoryStickers}
        selectedStorySticker={selectedStorySticker}
        setSelectedStorySticker={setSelectedStorySticker}
        newStoryStickerScale={newStoryStickerScale}
        setNewStoryStickerScale={setNewStoryStickerScale}
        newStoryStickerX={newStoryStickerX}
        setNewStoryStickerX={setNewStoryStickerX}
        newStoryStickerY={newStoryStickerY}
        setNewStoryStickerY={setNewStoryStickerY}
        setStories={setStories}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
      />

      {/* Event Companion Mode Modal */}
      <EventCompanionModal
        isEventModeActive={isEventModeActive}
        setIsEventModeActive={setIsEventModeActive}
        activeEventData={activeEventData}
        eventModeTab={eventModeTab}
        setEventModeTab={setEventModeTab}
        isTicketScanned={isTicketScanned}
        setIsTicketScanned={setIsTicketScanned}
        scanTime={scanTime}
        setScanTime={setScanTime}
        liveSetlists={liveSetlists}
        venueMessages={venueMessages}
        setVenueMessages={setVenueMessages}
        venueMessageInput={venueMessageInput}
        setVenueMessageInput={setVenueMessageInput}
        userProfile={userProfile}
        getSupabase={getSupabase}
        onCheckoutTicket={(gig) => openCheckout ? openCheckout('ticket', gig) : null}
        onEditShow={props.onEditShow}
        onDeleteGig={props.onDeleteGig || props.onDeleteShow}
        onDeleteShow={props.onDeleteShow || props.onDeleteGig}
        triggerNotification={props.triggerNotification}
      />

      <TicketEscrowModal
    viewingReceipt={viewingReceipt}
    setViewingReceipt={setViewingReceipt}
    handleTicketAction={handleTicketAction}
    triggerNotification={triggerNotification}
    userProfile={userProfile}
  />
  <CartDrawer
    isCartOpen={isCartOpen}
    setIsCartOpen={setIsCartOpen}
    cartItems={cartItems}
    setCartItems={setCartItems}
    setShowStripeCartCheckout={setShowStripeCartCheckout}
  />
  {/* Stripe Cart Checkout Modal */}
      {showStripeCartCheckout && cartItems.length > 0 && (
        <StripeCartCheckoutModal
          cartItems={cartItems}
          onClose={() => setShowStripeCartCheckout(false)}
          onClearCart={() => {
            setCartItems([]);
            // Simulate adding items to collection
            const newPurchases = cartItems.map((item, idx) => ({
              id: `col_${Date.now()}_${idx}`,
              type: 'merch' as const,
              data: {
                id: item.productId,
                name: item.name,
                thumbnail: item.image,
                price: item.price,
                band: item.bandName,
                sizes: item.size ? [item.size] : []
              },
              quantity: item.quantity,
              date: new Date()
            }));
            setMyCollections(prev => {
              const updated = [...newPurchases, ...prev];
              try {
                localStorage.setItem('nexus_my_collections_v1', JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });
            setTimeout(() => {
              setShowStripeCartCheckout(false);
            }, 3000);
          }}
        />
      )}

      {/* 1-Click Checkout Modal for openCheckout */}
      {bottomSheetOpen && checkoutItem && (
        <StripeCheckoutModal
          checkoutItem={checkoutItem}
          itemType={checkoutItem.type}
          rawItem={checkoutItem.data}
          post={{
            title: checkoutItem.data?.name || checkoutItem.data?.title || checkoutItem.data?.headliner || 'Item',
            authorName: checkoutItem.data?.bandName || checkoutItem.data?.band || checkoutItem.data?.artist || checkoutItem.data?.venue || 'Creator',
            authorId: checkoutItem.data?.authorId || checkoutItem.data?.bandId || 'creator_1',
            type: checkoutItem.type,
            rawItem: checkoutItem.data,
            merchData: {
              name: checkoutItem.data?.name || checkoutItem.data?.title || checkoutItem.data?.headliner || 'Item',
              thumbnail: checkoutItem.data?.thumbnail || checkoutItem.data?.image || checkoutItem.data?.coverUrl || checkoutItem.data?.poster || checkoutItem.data?.flyer,
              price: checkoutItem.data?.price || checkoutItem.data?.ticketPrice || 25,
              sizes: checkoutItem.data?.sizes || ['S', 'M', 'L', 'XL', '2XL', '3XL']
            }
          }}
          size={checkoutItem.data?.size || 'L'}
          price={checkoutItem.data?.price || checkoutItem.data?.ticketPrice || 25}
          isNegotiated={checkoutItem.data?.isNegotiated}
          userProfile={userProfile}
          triggerNotification={triggerNotification}
          setMyCollections={setMyCollections}
          setViewingReceipt={setViewingReceipt}
          onClose={() => {
            if (props.setBottomSheetOpen) props.setBottomSheetOpen(false);
            if (props.setCheckoutItem) props.setCheckoutItem(null);
          }}
        />
      )}

      <AlbumDetailsModal
    selectedAlbum={selectedAlbum}
    setSelectedAlbum={setSelectedAlbum}
    triggerNotification={triggerNotification}
    openCheckout={openCheckout}
  />
  <AttachSongModal
    showSongModal={showSongModal}
    setShowSongModal={setShowSongModal}
    inAppSongsList={inAppSongsList}
    setAttachedSong={setAttachedSong}
    triggerNotification={triggerNotification}
  />
  {/* Song Share Modal */}
      <SongShareModal
        isOpen={showSongShareModal}
        onClose={() => setShowSongShareModal(false)}
        songTitle={songShareTitle}
        setSongTitle={setSongShareTitle}
        songArtist={songShareArtist}
        setSongArtist={setSongShareArtist}
        songAlbum={songShareAlbum}
        setSongAlbum={setSongShareAlbum}
        songSpotifyUrl={songShareSpotifyUrl}
        setSongSpotifyUrl={setSongShareSpotifyUrl}
        songCoverUrl={songShareCoverUrl}
        setSongCoverUrl={setSongShareCoverUrl}
        triggerNotification={triggerNotification}
      />

      {/* Add New Item Modal */}
      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        itemCategory={itemCategory}
        setItemCategory={(val) => setItemCategory(val as any)}
        itemTitle={itemTitle}
        setItemTitle={setItemTitle}
        itemDescription={itemDescription}
        setItemDescription={setItemDescription}
        itemPrice={itemPrice}
        setItemPrice={setItemPrice}
        itemLocation={itemLocation}
        setItemLocation={setItemLocation}
        itemImages={itemImages}
        setItemImages={setItemImages}
        onSave={handleSaveItem}
        triggerNotification={triggerNotification}
      />

      {/* Gig Map Modal / Social Map Overlay */}
      <SocialMapOverlay
        isOpen={showMapModal}
        onClose={() => { setShowMapModal(false); setSelectedGigOnMap(null); }}
        selectedMapEvent={selectedGigOnMap}
        setSelectedMapEvent={setSelectedGigOnMap}
        selectedCityFilter={selectedCityFilter}
        setSelectedCityFilter={setSelectedCityFilter}
        mapFilterGenre={mapFilterGenre}
        setMapFilterGenre={setMapFilterGenre}
        userProfile={userProfile}
        triggerNotification={triggerNotification}
        liveEvents={props.liveEvents}
      />

      {/* Poll Creation Modal */}
      <PollCreationModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        pollVariant={pollVariant}
        setPollVariant={setPollVariant}
        pollQuestion={pollQuestion}
        setPollQuestion={setPollQuestion}
        pollOptions={pollOptions}
        setPollOptions={setPollOptions}
        pollIsTimed={pollIsTimed}
        setPollIsTimed={setPollIsTimed}
        pollTimerDays={pollTimerDays}
        setPollTimerDays={setPollTimerDays}
        pollTimerHours={pollTimerHours}
        setPollTimerHours={setPollTimerHours}
        triggerNotification={triggerNotification}
      />

      {/* Merch Drop Modal */}
      <MerchDropModal
        isOpen={showMerchDropModal}
        onClose={() => setShowMerchDropModal(false)}
        merchDropName={merchDropName}
        setMerchDropName={setMerchDropName}
        merchDropPrice={merchDropPrice}
        setMerchDropPrice={setMerchDropPrice}
        merchDropIsTimed={merchDropIsTimed}
        setMerchDropIsTimed={setMerchDropIsTimed}
        merchDropTimerHours={merchDropTimerHours}
        setMerchDropTimerHours={setMerchDropTimerHours}
        merchDropTimerMinutes={merchDropTimerMinutes}
        setMerchDropTimerMinutes={setMerchDropTimerMinutes}
        merchDropThumbnail={merchDropThumbnail}
        setMerchDropThumbnail={setMerchDropThumbnail}
        triggerNotification={triggerNotification}
      />

      {/* DIY Event Creator Modal */}
      <CreateDIYEventModal
        isOpen={props.showEventModal}
        onClose={() => props.setShowEventModal && props.setShowEventModal(false)}
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
        triggerNotification={props.triggerNotification}
      />

      {/* Report Profile Modal */}
      <ReportProfileModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        selectedUserProfile={selectedUserProfile}
        userProfile={userProfile}
        reportReason={reportReason}
        setReportReason={setReportReason}
        setReports={setReports}
        triggerNotification={triggerNotification}
      />

      {/* Submit EPK Modal */}
      <SubmitEpkModal
        isOpen={showSubmitEpkModal}
        onClose={() => {
          setShowSubmitEpkModal(false);
          setEpkSubmissionSuccess(false);
        }}
        selectedUserProfile={selectedUserProfile}
        epkSubmissionSuccess={epkSubmissionSuccess}
        setEpkSubmissionSuccess={setEpkSubmissionSuccess}
        epkFormBandName={epkFormBandName}
        setEpkFormBandName={setEpkFormBandName}
        epkFormBio={epkFormBio}
        setEpkFormBio={setEpkFormBio}
        epkFormHistory={epkFormHistory}
        setEpkFormHistory={setEpkFormHistory}
        epkFormMembers={epkFormMembers}
        setEpkFormMembers={setEpkFormMembers}
        epkFormProfileLink={epkFormProfileLink}
        setEpkFormProfileLink={setEpkFormProfileLink}
        epkFormTracks={epkFormTracks}
        setEpkFormTracks={setEpkFormTracks}
        isDragOver={isEpkDragOver}
        setIsDragOver={setIsEpkDragOver}
        setEpkSubmissions={setEpkSubmissions}
        triggerNotification={triggerNotification}
      />

      {/* View EPKs Modal */}
      <ViewEpksModal
        isOpen={showViewEpksModal}
        onClose={() => {
          setShowViewEpksModal(false);
          setExpandedEpkId(null);
        }}
        epkFilterTab={epkFilterTab}
        setEpkFilterTab={(val) => setEpkFilterTab(val as 'all' | 'my_label')}
        epkSubmissions={epkSubmissions}
        setEpkSubmissions={setEpkSubmissions}
        userProfile={userProfile}
        expandedEpkId={expandedEpkId}
        setExpandedEpkId={setExpandedEpkId}
        triggerNotification={triggerNotification}
      />

      {/* Admin PIN Modal */}
      <AdminPinModal
        isOpen={showAdminPINModal}
        onClose={() => {
          setShowAdminPINModal(false);
          setAdminPIN('');
        }}
        adminPIN={adminPIN}
        setAdminPIN={setAdminPIN}
        setIsAdminMode={setIsAdminMode}
      />

      {/* Secured Admin Console Overlay */}
      <AdminConsoleModal
        isOpen={isAdminMode}
        onClose={() => setIsAdminMode(false)}
        blacklistRecords={blacklistRecords}
        setBlacklistRecords={setBlacklistRecords}
        newBlacklistType={newBlacklistType}
        setNewBlacklistType={setNewBlacklistType}
        newBlacklistValue={newBlacklistValue}
        setNewBlacklistValue={setNewBlacklistValue}
        isBlacklistLoading={isBlacklistLoading}
        setIsBlacklistLoading={setIsBlacklistLoading}
        reports={reports}
        setReports={setReports}
        triggerNotification={triggerNotification}
        supabase={supabase}
      />

      
      

      {/* PUBLIC PROFILE VIEW MODAL */}
      <PublicProfileModal
        feed={props.feed || props.posts || []}
        selectedUserProfile={selectedUserProfile}
        setSelectedUserProfile={setSelectedUserProfile}
        onBackProfile={props.onBackProfile}
        profileHistory={props.profileHistory}
        setSecondaryUserProfile={setSelectedSecondaryUserProfile}
        targetProfile={targetProfile}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
        portalRole={portalRole}
        profileActiveTab={profileActiveTab}
        setProfileActiveTab={setProfileActiveTab}
        triggerPictureViewer={triggerPictureViewer}
        triggerNotification={triggerNotification}
        allProfiles={allProfiles}
        handleFollowProfile={handleFollowProfile}
        setViewingFollowersOrFollowing={setViewingFollowersOrFollowing}
        openFloatingChat={openFloatingChat}
        bandJoinRequests={bandJoinRequests}
        setBandJoinRequests={setBandJoinRequests}
        setLeftDrawerOpen={setLeftDrawerOpen}
        setDrawerCurrentView={setDrawerCurrentView}
        openCheckout={openCheckout}
        setShowReportModal={setShowReportModal}
        setShowSubmitEpkModal={setShowSubmitEpkModal}
        setShowAddItemModal={setShowAddItemModal}
        setShopBrandFilter={setShopBrandFilter}
        setActiveTab={setActiveTab}
        profileBlurb={profileBlurb}
        setProfileBlurb={setProfileBlurb}
        saveProfileData={saveProfileData}
        labelRosterTicker={labelRosterTicker}
        profilePrimaryGenres={profilePrimaryGenres}
        profileMicroGenres={profileMicroGenres}
        profileGenres={profileGenres}
        profileTopSongArtist={profileTopSongArtist}
        setProfileTopSongArtist={setProfileTopSongArtist}
        profileTopSongTitle={profileTopSongTitle}
        setProfileTopSongTitle={setProfileTopSongTitle}
        setProfileFavoriteSong={setProfileFavoriteSong}
        setProfileTopSongUrl={setProfileTopSongUrl}
        rosterExpanded={rosterExpanded}
        setRosterExpanded={setRosterExpanded}
        collectionTab={collectionTab}
        setCollectionTab={setCollectionTab}
        myCollections={myCollections}
        collPlayerActiveId={collPlayerActiveId}
        setCollPlayerActiveId={setCollPlayerActiveId}
        collPlayerActiveTrackId={collPlayerActiveTrackId}
        setCollPlayerActiveTrackId={setCollPlayerActiveTrackId}
        collPlayerIsPlaying={collPlayerIsPlaying}
        setCollPlayerIsPlaying={setCollPlayerIsPlaying}
        setSelectedGalleryItem={setSelectedGalleryItem}
        selectedLabelBand={selectedLabelBand}
        setSelectedLabelBand={setSelectedLabelBand}
        profileActivePlaybackTrackId={profileActivePlaybackTrackId}
        setProfileActivePlaybackTrackId={setProfileActivePlaybackTrackId}
        profileIsPlaying={profileIsPlaying}
        setProfileIsPlaying={setProfileIsPlaying}
        profilePlaybackProgress={profilePlaybackProgress}
        setProfilePlaybackProgress={setProfilePlaybackProgress}
        getProfileForUser={getProfileForUser}
        supabase={supabase}
        liveProfileStats={props.liveProfileStats}
        setLiveProfileStats={setLiveProfileStats}
      />


            {/* Followers / Following Mini Modal */}
            <FollowersModal
              viewingFollowersOrFollowing={viewingFollowersOrFollowing}
              setViewingFollowersOrFollowing={setViewingFollowersOrFollowing}
              selectedUserProfile={selectedUserProfile}
              portalRole={portalRole}
              targetProfile={targetProfile}
              liveFollowsLoading={liveFollowsLoading}
              liveFollowsList={liveFollowsList}
              allProfiles={allProfiles}
              userProfile={userProfile}
              setSelectedUserProfile={setSelectedUserProfile}
              triggerNotification={triggerNotification}
              getProfileForUser={getProfileForUser}
              normalizeLoadedProfile={normalizeLoadedProfile}
              handleFollowProfile={handleFollowProfile}
              handleToggleMutualFollow={handleToggleMutualFollow}
            />

      {/* Direct Messaging Drawer / Conversation Settings Overlay */}
      <DirectMessageDrawer
        isOpen={showConversationSettings}
        onClose={() => setShowConversationSettings(false)}
        selectedChatId={selectedChatId}
        setSelectedChatId={setSelectedChatId}
        chats={chats}
        setChats={setChats}
        setSelectedUserProfile={setSelectedUserProfile}
        getProfileForUser={getProfileForUser}
        triggerNotification={triggerNotification}
        setShowReportModal={setShowReportModal}
        setReportReason={setReportReason}
      />

      {/* Inbox Privacy & Global Settings Overlay */}
      <AnimatePresence>
        {showInboxSettings && (
          <motion.div
            key="inbox-settings-drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[450px] max-w-full bg-[#030105] border-l border-zinc-900 z-[100] flex flex-col shadow-2xl font-sans"
          >
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-[#030105]/95 backdrop-blur-md border-b border-zinc-900/60">
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowInboxSettings(false)} className="p-2 -ml-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-900 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xs font-black uppercase tracking-wider text-white font-display">Inbox Preferences</h2>
                </div>
                <span className="text-[9px] bg-purple-950/40 border border-purple-900/30 text-purple-400 font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Terminal V2
                </span>
              </div>

              {/* Settings Sections */}
              <div className="p-4">
                <InboxPreferences
                  userProfile={userProfile}
                  chats={chats}
                  setChats={setChats}
                  globalReadReceipts={globalReadReceipts}
                  setGlobalReadReceipts={setGlobalReadReceipts}
                  globalActiveStatus={globalActiveStatus}
                  setGlobalActiveStatus={setGlobalActiveStatus}
                  whoCanReachMe={whoCanReachMe}
                  setWhoCanReachMe={setWhoCanReachMe}
                  triggerNotification={triggerNotification}
                />
              </div>

              {/* Footnote */}
              <div className="text-center py-6 opacity-50 space-y-1">
                <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                  • END-TO-END CRYPTOGRAPHIC SANITY CHECKED •
                </p>
                <p className="text-[8px] font-mono text-zinc-650 leading-normal uppercase">
                  Changes take effect on current session terminal nodes instantly.
                </p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FanPitWallDrawer
    activePitWallShow={activePitWallShow}
    setActivePitWallShow={setActivePitWallShow}
    userProfile={userProfile}
    triggerNotification={triggerNotification}
    setIsCartOpen={setIsCartOpen}
    cartItems={cartItems}
  />
  <InteractiveCropperModal
        isOpen={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageSrc={cropperImageSrc}
        aspectRatio={cropperType === 'avatar' ? '1:1' : '3:1'}
        onCropComplete={async (croppedBase64) => {
          setCropperOpen(false);
          try {
            triggerNotification?.("⏳ Saving and optimizing cropped image...");
            const userProfileId = userProfile?.id || 'profile_anonymous';
            const bucket = 'community-bands';
            const token = cropperType === 'avatar' ? 'profile-avatar' : 'cover-banner';
            
            const publicUrl = await uploadBase64ToStorage(croppedBase64, bucket, userProfileId, token);
            const finalUrl = publicUrl || croppedBase64;

            if (cropperType === 'avatar') {
              setProfileAvatarUrl(finalUrl);
            } else {
              setProfileCoverUrl(finalUrl);
            }

            // Immediately save to database profiles table to persist instantly
            const supabase = getSupabase();
            if (supabase && userProfile?.id) {
              const columnToUpdate: Record<string, string> = {};
              
              if (cropperType === 'avatar') {
                columnToUpdate.avatar_url = publicUrl;
              } else {
                columnToUpdate.banner_url = publicUrl;
              }

              const globalPayload = extractGlobalProfilePayload({
                id: userProfile.id,
                ...columnToUpdate
              }, userProfile.id);

              const { data: updatedProf, error: updateErr } = await supabase
                .from('profiles')
                .update(globalPayload)
                .eq('id', userProfile.id)
                .select()
                .single();

              // If portal is band or user is linked to band, sync to bands table too
              if (portalRole === 'band' || userProfile?.band_id || band?.id) {
                const targetBandId = band?.id || userProfile?.band_id || userProfile?.id;
                if (targetBandId) {
                  const bandImageField = cropperType === 'avatar' ? { logo_url: publicUrl } : { cover_url: publicUrl };
                  const sanitized = sanitizeBandPayload({
                    id: targetBandId,
                    ...bandImageField
                  });
                  executeWithSchemaResilience(
                    async (payload) => await supabase.from('bands').update(payload).eq('id', targetBandId),
                    sanitized
                  ).catch(e => console.warn('[SocialModalsOverlay] Band image sync notice:', e));
                }
              }

              // If portal is creative, sync to creatives table too
              if (portalRole === 'creative' || userProfile?.creative_id) {
                const targetCreativeId = userProfile?.creative_id || userProfile?.id;
                if (targetCreativeId) {
                  const creativeImageField = cropperType === 'avatar' ? { avatar_url: publicUrl } : { banner_url: publicUrl };
                  const sanitized = sanitizeCreativePayload({
                    id: targetCreativeId,
                    ...creativeImageField
                  });
                  executeWithSchemaResilience(
                    async (payload) => await supabase.from('creatives').update(payload).eq('id', targetCreativeId),
                    sanitized
                  ).catch(e => console.warn('[SocialModalsOverlay] Creative image sync notice:', e));
                }
              }

              if (cropperType === 'avatar' && typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('nexus_avatar_updated', {
                  detail: {
                    avatarUrl: publicUrl,
                    authorName: userProfile?.full_name || userProfile?.name || 'Profile User',
                    authorRole: portalRole || 'User'
                  }
                }));
              }

              if (updateErr) {
                console.error("Failed to update profile image in database:", updateErr.message);
              } else if (updatedProf && setUserProfile) {
                // Keep memory states synchronized, using only the updated columns to prevent overwriting computed app state
                queueMicrotask(() => { setUserProfile((prev: any) => ({ ...prev, ...columnToUpdate })); });
                
                // Write back to local cache
                const profileCacheKey = `nexus_${portalRole}_profile_v1_${userProfile.id}`;
                try {
                  const savedStr = localStorage.getItem(profileCacheKey);
                  if (savedStr) {
                    const savedData = JSON.parse(savedStr);
                    if (cropperType === 'avatar') savedData.profileAvatarUrl = publicUrl;
                    else savedData.profileCoverUrl = publicUrl;
                    localStorage.setItem(profileCacheKey, JSON.stringify(savedData));
                  }
                } catch (e) {}

                // Save to IndexedDB too
                try {
                  const indexedKey = `active_${portalRole}_${userProfile.id}`;
                  profileStore.getItem(indexedKey).then((savedData: any) => {
                    if (savedData) {
                      if (cropperType === 'avatar') savedData.profileAvatarUrl = publicUrl;
                      else savedData.profileCoverUrl = publicUrl;
                      profileStore.setItem(indexedKey, savedData);
                    }
                  });
                } catch (e) {}
              }
            }

            if (cropperType === 'avatar') {
              triggerNotification?.("✨ Profile avatar updated & synchronized!");
              
              const authorName = isEmbedded ? (userProfile?.bandName || userProfile?.companyName || userProfile?.label_company_name || userProfile?.name || 'Pro Account') : (profileHandle || userProfile?.name || 'User');
              const authorRole = isEmbedded ? portalRole.charAt(0).toUpperCase() + portalRole.slice(1) : (profileSceneRoles.join(' • ') || 'Fan');
              const postedByValue = isEmbedded ? (profileFullLegalName.split(' ')[0] || userProfile?.name?.split(' ')[0]) : undefined;

              const autoAvatarPost: FeedItem = {
                id: `avatar_update_${Date.now()}`,
                type: 'post',
                author: {
                  name: authorName,
                  avatar: publicUrl,
                  role: authorRole,
                  postedBy: postedByValue
                },
                timeAgo: 'Just now',
            timestamp: new Date().toISOString(),
                content: '✨ Updated profile picture! Check out the new look.',
                tag: 'PROFILE SIGNAL',
                image: publicUrl,
                images: [publicUrl],
                reactions: [
                  { type: 'flame', count: 1, active: true }
                ],
                comments: []
              };

              setFeed(prev => [autoAvatarPost, ...prev]);
              syncPostToSupabase(autoAvatarPost);
            } else {
              triggerNotification?.("✨ Profile cover banner updated & synchronized!");
            }
          } catch (err) {
            console.error("Failed to upload cropped image:", err);
            triggerNotification?.("⚠️ Failed to upload image to the server.");
          }
        }}
        title={cropperType === 'avatar' ? "Adjust Profile Avatar" : "Adjust Cover Banner"}
      />

    </>
  );
};
