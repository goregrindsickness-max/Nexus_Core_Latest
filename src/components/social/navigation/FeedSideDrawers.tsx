import React from 'react';
import { User, Settings, Bell } from 'lucide-react';
import { LeftProfileDrawer } from '../drawers/LeftProfileDrawer';
import { RightNotificationsDrawer } from '../drawers/RightNotificationsDrawer';
import { SceneRadioPlayer } from '../player/SceneRadioPlayer';

export interface FeedSideDrawersProps {
  leftDrawerOpen: boolean;
  setLeftDrawerOpen: (val: boolean) => void;
  drawerCurrentView: string;
  setDrawerCurrentView: (val: string) => void;
  followingActiveTab: any;
  setFollowingActiveTab: (val: any) => void;
  followingSearchQuery: string;
  setFollowingSearchQuery: (val: string) => void;
  discoverProfiles: any[];
  setDiscoverProfiles: React.Dispatch<React.SetStateAction<any[]>>;
  handleFollowProfile: (id: string) => void;
  filterShowFollowedOnly: boolean;
  setFilterShowFollowedOnly: (val: boolean) => void;
  pinEntered: string;
  setPinEntered: (val: string) => void;
  pinError: string;
  setPinError: (val: string) => void;
  collectionTab: any;
  setCollectionTab: (val: any) => void;
  saveProfileData: (finalSave?: boolean) => void;
  setViewingReceipt: (val: any) => void;
  isMiguelNameOrProfile: any;
  userProfile?: any;
  activeBand?: any;
  portalRole: string;
  isEmbedded?: boolean;
  profileAvatarUrl: string | null;
  setProfileAvatarUrl: (val: string | null) => void;
  profileCoverUrl: string | null;
  setProfileCoverUrl: (val: string | null) => void;
  profileFullLegalName: string;
  setProfileFullLegalName: (val: string) => void;
  profileHandle: string;
  setProfileHandle: (val: string) => void;
  profileBlurb: string;
  setProfileBlurb: (val: string) => void;
  profileLocation: string;
  setProfileLocation: (val: string) => void;
  profileZip: string;
  setProfileZip: (val: string) => void;
  profileMetalArchivesUrl: string;
  setProfileMetalArchivesUrl: (val: string) => void;
  profileTopSongArtist: string;
  setProfileTopSongArtist: (val: string) => void;
  profileTopSongTitle: string;
  setProfileTopSongTitle: (val: string) => void;
  profileTopSongUrl: string;
  setProfileTopSongUrl: (val: string) => void;
  profileGenres: string[];
  setProfileGenres: (val: string[]) => void;
  profileMicroGenres: string[];
  setProfileMicroGenres: (val: string[]) => void;
  profileStealthMode: boolean;
  setProfileStealthMode: (val: boolean) => void;
  profileFavoriteSong: string;
  setProfileFavoriteSong: (val: string) => void;
  profileEmail: string;
  setProfileEmail: (val: string) => void;
  profilePassword: string;
  setProfilePassword: (val: string) => void;
  profilePin: string;
  setProfilePin: (val: string) => void;
  isPinModalOpen: boolean;
  setIsPinModalOpen: (val: boolean) => void;
  showMapModal: boolean;
  setShowMapModal: (val: boolean) => void;
  showReportModal: boolean;
  setShowReportModal: (val: boolean) => void;
  showAdminPINModal: boolean;
  setShowAdminPINModal: (val: boolean) => void;
  showLabelEpkModal: boolean;
  setShowLabelEpkModal: (val: boolean) => void;
  showViewEpksModal: boolean;
  setShowViewEpksModal: (val: boolean) => void;
  showSubmitEpkModal: boolean;
  setShowSubmitEpkModal: (val: boolean) => void;
  setActiveTab: (val: any) => void;
  triggerNotification?: (msg: string) => void;
  getSupabase: () => any;
  handleLogout: () => void;

  // Right Notifications Drawer Props
  rightDrawerOpen: boolean;
  setRightDrawerOpen: (val: boolean) => void;
  unreadNotifsCount: number;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  notifFilter: string;
  setNotifFilter: (val: string) => void;
  markAllNotifsAsRead: () => void;
  clearAllNotifs: () => void;
  deleteNotif: (id: string) => void;
  setSelectedChatId: (id: string | null) => void;

  // Scene Radio Player Props
  showSceneRadio: boolean;
  setShowSceneRadio: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  selectedChatId: string | null;
  traysHiddenOnMobile: boolean;
}

export const FeedSideDrawers: React.FC<FeedSideDrawersProps> = ({
  leftDrawerOpen,
  setLeftDrawerOpen,
  drawerCurrentView,
  setDrawerCurrentView,
  followingActiveTab,
  setFollowingActiveTab,
  followingSearchQuery,
  setFollowingSearchQuery,
  discoverProfiles,
  setDiscoverProfiles,
  handleFollowProfile,
  filterShowFollowedOnly,
  setFilterShowFollowedOnly,
  pinEntered,
  setPinEntered,
  pinError,
  setPinError,
  collectionTab,
  setCollectionTab,
  saveProfileData,
  setViewingReceipt,
  isMiguelNameOrProfile,
  userProfile,
  activeBand,
  portalRole,
  isEmbedded,
  profileAvatarUrl,
  setProfileAvatarUrl,
  profileCoverUrl,
  setProfileCoverUrl,
  profileFullLegalName,
  setProfileFullLegalName,
  profileHandle,
  setProfileHandle,
  profileBlurb,
  setProfileBlurb,
  profileLocation,
  setProfileLocation,
  profileZip,
  setProfileZip,
  profileMetalArchivesUrl,
  setProfileMetalArchivesUrl,
  profileTopSongArtist,
  setProfileTopSongArtist,
  profileTopSongTitle,
  setProfileTopSongTitle,
  profileTopSongUrl,
  setProfileTopSongUrl,
  profileGenres,
  setProfileGenres,
  profileMicroGenres,
  setProfileMicroGenres,
  profileStealthMode,
  setProfileStealthMode,
  profileFavoriteSong,
  setProfileFavoriteSong,
  profileEmail,
  setProfileEmail,
  profilePassword,
  setProfilePassword,
  profilePin,
  setProfilePin,
  isPinModalOpen,
  setIsPinModalOpen,
  showMapModal,
  setShowMapModal,
  showReportModal,
  setShowReportModal,
  showAdminPINModal,
  setShowAdminPINModal,
  showLabelEpkModal,
  setShowLabelEpkModal,
  showViewEpksModal,
  setShowViewEpksModal,
  showSubmitEpkModal,
  setShowSubmitEpkModal,
  setActiveTab,
  triggerNotification,
  getSupabase,
  handleLogout,

  rightDrawerOpen,
  setRightDrawerOpen,
  unreadNotifsCount,
  notifications,
  setNotifications,
  notifFilter,
  setNotifFilter,
  markAllNotifsAsRead,
  clearAllNotifs,
  deleteNotif,
  setSelectedChatId,

  showSceneRadio,
  setShowSceneRadio,
  activeTab,
  selectedChatId,
  traysHiddenOnMobile,
}) => {
  return (
    <>
      {/* Left Drawer - Profile Hub & Settings */}
      <LeftProfileDrawer
        leftDrawerOpen={leftDrawerOpen}
        drawerCurrentView={drawerCurrentView}
        setDrawerCurrentView={setDrawerCurrentView}
        followingActiveTab={followingActiveTab}
        setFollowingActiveTab={setFollowingActiveTab}
        followingSearchQuery={followingSearchQuery}
        setFollowingSearchQuery={setFollowingSearchQuery}
        discoverProfiles={discoverProfiles}
        setDiscoverProfiles={setDiscoverProfiles}
        handleFollowProfile={handleFollowProfile}
        filterShowFollowedOnly={filterShowFollowedOnly}
        setFilterShowFollowedOnly={setFilterShowFollowedOnly}
        pinEntered={pinEntered}
        setPinEntered={setPinEntered}
        pinError={pinError}
        setPinError={setPinError}
        collectionTab={collectionTab}
        setCollectionTab={setCollectionTab}
        saveProfileData={saveProfileData}
        setViewingReceipt={setViewingReceipt}
        isMiguelNameOrProfile={typeof isMiguelNameOrProfile === "function" ? isMiguelNameOrProfile : () => Boolean(isMiguelNameOrProfile)}
        setLeftDrawerOpen={setLeftDrawerOpen}
        userProfile={userProfile}
        activeBand={activeBand}
        portalRole={portalRole}
        isEmbedded={isEmbedded}
        profileAvatarUrl={profileAvatarUrl}
        setProfileAvatarUrl={setProfileAvatarUrl}
        profileCoverUrl={profileCoverUrl}
        setProfileCoverUrl={setProfileCoverUrl}
        profileFullLegalName={profileFullLegalName}
        setProfileFullLegalName={setProfileFullLegalName}
        profileHandle={profileHandle}
        setProfileHandle={setProfileHandle}
        profileBlurb={profileBlurb}
        setProfileBlurb={setProfileBlurb}
        profileLocation={profileLocation}
        setProfileLocation={setProfileLocation}
        profileZip={profileZip}
        setProfileZip={setProfileZip}
        profileMetalArchivesUrl={profileMetalArchivesUrl}
        setProfileMetalArchivesUrl={setProfileMetalArchivesUrl}
        profileTopSongArtist={profileTopSongArtist}
        setProfileTopSongArtist={setProfileTopSongArtist}
        profileTopSongTitle={profileTopSongTitle}
        setProfileTopSongTitle={setProfileTopSongTitle}
        profileTopSongUrl={profileTopSongUrl}
        setProfileTopSongUrl={setProfileTopSongUrl}
        profileGenres={profileGenres}
        setProfileGenres={setProfileGenres}
        profileMicroGenres={profileMicroGenres}
        setProfileMicroGenres={setProfileMicroGenres}
        profileStealthMode={profileStealthMode}
        setProfileStealthMode={setProfileStealthMode}
        profileFavoriteSong={profileFavoriteSong}
        setProfileFavoriteSong={setProfileFavoriteSong}
        profileEmail={profileEmail}
        setProfileEmail={setProfileEmail}
        profilePassword={profilePassword}
        setProfilePassword={setProfilePassword}
        profilePin={profilePin}
        setProfilePin={setProfilePin}
        isPinModalOpen={isPinModalOpen}
        setIsPinModalOpen={setIsPinModalOpen}
        showMapModal={showMapModal}
        setShowMapModal={setShowMapModal}
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        showAdminPINModal={showAdminPINModal}
        setShowAdminPINModal={setShowAdminPINModal}
        showLabelEpkModal={showLabelEpkModal}
        setShowLabelEpkModal={setShowLabelEpkModal}
        showViewEpksModal={showViewEpksModal}
        setShowViewEpksModal={setShowViewEpksModal}
        showSubmitEpkModal={showSubmitEpkModal}
        setShowSubmitEpkModal={setShowSubmitEpkModal}
        setActiveTab={setActiveTab}
        triggerNotification={triggerNotification}
        getSupabase={getSupabase}
        handleLogout={handleLogout}
      />

      {/* Right Drawer - Notifications & Notices */}
      <RightNotificationsDrawer
        rightDrawerOpen={rightDrawerOpen}
        setRightDrawerOpen={setRightDrawerOpen}
        unreadNotifsCount={unreadNotifsCount}
        notifications={notifications}
        setNotifications={setNotifications}
        notifFilter={notifFilter}
        setNotifFilter={setNotifFilter}
        markAllNotifsAsRead={markAllNotifsAsRead}
        clearAllNotifs={clearAllNotifs}
        deleteNotif={deleteNotif}
        setActiveTab={setActiveTab}
        setSelectedChatId={setSelectedChatId}
        userProfile={userProfile}
      />

      <SceneRadioPlayer
        showSceneRadio={showSceneRadio}
        setShowSceneRadio={setShowSceneRadio}
        activeTab={activeTab}
        selectedChatId={selectedChatId}
        traysHiddenOnMobile={traysHiddenOnMobile}
        triggerNotification={triggerNotification}
      />

      {/* Floating Left Handle - Pull to open User/Profile settings */}
      {activeTab !== 'reels' && activeTab !== 'messages' && !traysHiddenOnMobile && (
        <>
          <button
            onClick={() => setLeftDrawerOpen(true)}
            className="fixed left-0 top-[55%] z-30 bg-zinc-900/90 hover:bg-rose-950/90 border border-l-0 border-zinc-800 hover:border-rose-500/50 rounded-r-xl py-4 px-1.5 shadow-[2px_0_12px_rgba(0,0,0,0.7)] flex flex-col items-center gap-2 group transition-all duration-300"
            title="Open Fan Profile & Settings"
          >
            <User className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            <span className="text-[8px] font-black uppercase text-zinc-400 group-hover:text-white tracking-widest [writing-mode:vertical-lr] select-none">PROFILE</span>
            <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 group-hover:rotate-45 transition-all mt-0.5" />
          </button>

          {/* Floating Right Handle - Pull to open Notifications */}
          <button
            onClick={() => setRightDrawerOpen(true)}
            className="fixed right-0 top-[55%] z-30 bg-zinc-900/95 hover:bg-rose-950/95 border border-r-0 border-zinc-800 hover:border-rose-500/50 rounded-l-xl py-4 px-1.5 shadow-[-4px_0_20px_rgba(244,63,94,0.15)] flex flex-col items-center gap-1.5 group transition-all duration-300"
            title="Open Notifications"
          >
            <div className="relative">
              <Bell className="w-4 h-4 text-rose-500 group-hover:scale-115 transition-transform" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 border border-zinc-950 shadow-[0_0_8px_#f43f5e] animate-ping" />
              )}
            </div>
            <span className="text-[8px] font-black uppercase text-zinc-400 group-hover:text-white tracking-widest [writing-mode:vertical-lr] select-none">NOTICES</span>
            {unreadNotifsCount > 0 && (
              <span className="bg-rose-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded-md mt-1 scale-90 border border-rose-500/40">
                {unreadNotifsCount}
              </span>
            )}
          </button>
        </>
      )}
    </>
  );
};
