import React, { Suspense } from 'react';
import { Lock } from 'lucide-react';
import { NexusTopBar } from '../navigation/NexusTopBar';

const HomeDashboardView = React.lazy(() =>
  import('../dashboard/HomeDashboardView').then((m) => ({ default: m.HomeDashboardView }))
);
const HomeV2DashboardView = React.lazy(() =>
  import('../dashboard/HomeV2DashboardView').then((m) => ({ default: m.HomeV2DashboardView }))
);
const MainTabRouter = React.lazy(() => import('../views/MainTabRouter'));

export interface ArtistBandPortalProps {
  [key: string]: any;
}

export const ArtistBandPortal: React.FC<ArtistBandPortalProps> = (props) => {
  const {
    activeTab,
    setActiveTab,
    setDashboardV2ActiveNav,
    triggerNotification,
    pendingSyncCount,
    processOfflineQueue,
    isRosterOwner,
    activePlan,
    getTrialCountdownStr,
    activeClearanceLevel,
    activeSimulatedMember,
    userProfile,
    notifications,
    setIsNotificationDrawerOpen,
    v2RoleMenuOpen,
    setV2RoleMenuOpen,
    activeBand,
    bands,
    simulatedMemberId,
    setSimulatedMemberId,
    bandLineup,
    crewMembers,
    handleOpenMyProfile,
    setUserProfile,
    isOfflineSimActive,
    setIsOfflineSimActive,
    isOnline,
    setShowWorkspaceRegistration,
    setIsSettingsDrawerOpen,
    isTabRestricted,
    isBandRegistered,
    dashboardRef,
    dashboardScrollPos,
    addLog,
    musicTrackCount,
    setDistroDeckSubTab,
    isSyncBadgeExpanded,
    setIsSyncBadgeExpanded,
    status,
    setIsMetricCarouselPaused,
    setCurrentMetricIndex,
    metrics,
    currentMetricIndex,
    setIsHoveringTourStatus,
    registerTourStatusInteraction,
    handleStatusTouchStart,
    handleStatusTouchMove,
    handleStatusTouchEnd,
    hasSettleReminder,
    firstShowToSettle,
    setAutoExpandShowId,
    shows,
    setTourStatusIndex,
    tourStatusIndex,
    activeShowDisplay,
    currentOrNextShow,
    countdownString,
    inventory,
    isCritical,
    totalTableStock,
    totalVanStock,
    notes,
    filteredNotes,
    isNoteExpanded,
    setIsNoteExpanded,
    inlineNoteEditingId,
    setInlineNoteEditingId,
    inlineNoteText,
    setInlineNoteText,
    inlineNoteCategory,
    setInlineNoteCategory,
    inlineNoteTag,
    setInlineNoteTag,
    activeNoteIndex,
    setActiveNoteIndex,
    isTourNotesCardCollapsed,
    setIsTourNotesCardCollapsed,
    handleNoteTouchStart,
    handleNoteTouchMove,
    handleNoteTouchEnd,
    handleDeleteNote,
    handleUpdateNote,
    handleDataSubmit,
    showSpecificNotes,
    localWeather,
    weatherLoading,
    weatherError,
    currentCoords,
    customNavDestination,
    setCustomNavDestination,
    venues,
    fetchLocalWeather,
    setIsWeatherForecastExpanded,
    isWeatherForecastExpanded,
    isEditingBusCall,
    isTime24Hour,
    setIsTime24Hour,
    tempBusCallTime,
    setTempBusCallTime,
    tempLockupTime,
    setTempLockupTime,
    setIsEditingBusCall,
    setBusCallTime,
    setLockupTime,
    renderTime,
    busCallTime,
    lockupTime,
    checklistItems,
    toggleChecklistItem,
    flights,
    tableStockPercent,
    handleRestock,
    handleNewSaleClick,
    handleNewSalePointerDown,
    handleNewSalePointerUp,
    setIsGlobalHoverPaused,
    setDashboardCarouselIndex,
    dashboardCarouselIndex,
    getNextShow,
    getSetlistDetailsForShow,
    selectedGuestlistShowId,
    setSelectedGuestlistShowId,
    sales,
    setModalType,
    setIsModalOpen,
    sortedShows,
    setPromoCardActiveSlot,
    promoCardActiveSlot,
    alliancePosts,
    previewReactionMenuOpenFor,
    setPreviewReactionMenuOpenFor,
    handleAlliancePostReaction,
    setAlliancePosts,
    previewFollowedActs,
    setPreviewFollowedActs,
    filteredInventory,
    setPromoHubSelectedItemId,
    setPromoHubSubTab,
    loyaltyMembers,
    reviewLeft,
    userReviews,
    setReviewLeft,
    setReviewText,
    setReviewScore,
    reviewScore,
    reviewText,
    reviewerName,
    setReviewerName,
    reviewerGroup,
    setReviewerGroup,
    setUserReviews,
    dashboardV2ActiveNav,
    setIsV2StoryCreatorExpanded,
    isV2StoryCreatorExpanded,
    stagedDistroItems,
    setStagedDistroItems,
    setBands,
    bandJoinRequests,
    setBandJoinRequests,
    isSubNavRestricted,
    activeDriver,
    activeEventsSection,
    checkedPreDriveItems,
    checklistBank,
    commitFlightMutation,
    customMpg,
    driveHoursElapsed,
    filteredSales,
    filteredShows,
    fuelPrice,
    handleUpdateOffer,
    isDriverRotationExpanded,
    isFuelCalculatorExpanded,
    isInteractiveMapExpanded,
    isPreDriveChecklistExpanded,
    isWaypointsExpanded,
    newWaypointName,
    newWaypointType,
    offers,
    onRouteVenueAddress,
    setActiveDriver,
    setActiveEventsSection,
    setCheckedPreDriveItems,
    setChecklistBank,
    setChecklistItems,
    setCustomMpg,
    setDriveHoursElapsed,
    setFlights,
    setFuelPrice,
    setIsDriverRotationExpanded,
    setIsFuelCalculatorExpanded,
    setIsInteractiveMapExpanded,
    setIsPreDriveChecklistExpanded,
    setIsWaypointsExpanded,
    setNewWaypointName,
    setNewWaypointType,
    setShows,
    setVehicleType,
    setVenues,
    setWaypoints,
    vehicleType,
    waypoints,
    bandCoverUrl,
    setInventory,
    setLoyaltyMembers,
    inventoryAudits,
    setInventoryAudits,
    activeBandId,
    setTransferPreselectedId,
    setIsTransferModalOpen,
    setEditingItem,
    expenses,
    setExpenses,
    setEditingBand,
    setIsBandModalOpen,
    bandInfoBio,
    setBandInfoBio,
    bandInfoCustomSlug,
    setBandInfoCustomSlug,
    bandInfoBookingEmail,
    setBandInfoBookingEmail,
    bandInfoBookingPhone,
    setBandInfoBookingPhone,
    bandInfoYoutubeVideo,
    setBandInfoYoutubeVideo,
    bandInfoStreamingUrl,
    setBandInfoStreamingUrl,
    bandInfoTechRider,
    setBandInfoTechRider,
    bandInfoTourVehicle,
    setBandInfoTourVehicle,
    bandInfoMetalArchivesUrl,
    setBandInfoMetalArchivesUrl,
    bandLogoUrl,
    setLogoUploaderDragActive,
    handleBandInfoLogoUpload,
    logoUploaderDragActive,
    bandInfoLogoFileInputRef,
    setCoverUploaderDragActive,
    handleBandInfoCoverUpload,
    coverUploaderDragActive,
    bandInfoCoverFileInputRef,
    bandInfoName,
    setBandInfoName,
    selectedMicroGenres,
    setSelectedMicroGenres,
    bandInfoHomebase,
    setBandInfoHomebase,
    bandInfoFoundedYear,
    setBandInfoFoundedYear,
    setBandLineup,
    setCrewMembers,
    setSales,
    logs,
    dbStatus,
    editingItem,
    commitInventoryMutation,
    setIsCashDrawerOpen,
    setAutoOpenSettlementShowId,
    processingGlobalSyncQueue,
    getSupabase,
    inventoryStore,
    pendingOpenShowsForm,
    setPendingOpenShowsForm,
    autoExpandShowId,
    autoOpenSettlementShowId,
    setOnRouteVenueAddress,
    blockedPromoters,
    handleAcceptOffer,
    handleDeclineOffer,
    handleRenegotiateOffer,
    handleBlockPromoter,
    setSettingsExpandedSection,
    supabaseUrl,
    supabaseKey,
    setActiveBandId,
    settingsExpandedSection,
    promoHubSubTab,
    promoHubSelectedItemId,
    setActivePlan,
    pendingFlightIsAdding,
    setPendingFlightIsAdding,
    distroDeckSubTab,
  } = props;

  return (
    <Suspense fallback={null}>
      <NexusTopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab as any}
        setDashboardV2ActiveNav={setDashboardV2ActiveNav}
        triggerNotification={triggerNotification}
        pendingSyncCount={pendingSyncCount}
        processOfflineQueue={processOfflineQueue}
        isRosterOwner={isRosterOwner}
        activePlan={activePlan}
        getTrialCountdownStr={getTrialCountdownStr}
        activeClearanceLevel={activeClearanceLevel}
        activeSimulatedMember={activeSimulatedMember}
        userProfile={userProfile}
        notifications={notifications}
        setIsNotificationDrawerOpen={setIsNotificationDrawerOpen}
        v2RoleMenuOpen={v2RoleMenuOpen}
        setV2RoleMenuOpen={setV2RoleMenuOpen}
        activeBand={activeBand}
        bands={bands}
        simulatedMemberId={simulatedMemberId}
        setSimulatedMemberId={setSimulatedMemberId}
        bandLineup={bandLineup}
        crewMembers={crewMembers}
        handleOpenMyProfile={handleOpenMyProfile}
        setUserProfile={setUserProfile}
        isOfflineSimActive={isOfflineSimActive}
        setIsOfflineSimActive={setIsOfflineSimActive}
        isOnline={isOnline}
        onUpgradeToPro={() => setShowWorkspaceRegistration(true)}
        onOpenSettingsDrawer={() => setIsSettingsDrawerOpen(true)}
      />

      {isTabRestricted(activeTab, activeClearanceLevel) ? (
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-[#030303] text-zinc-300">
          <div className="max-w-md w-full bg-[#09090b] border border-zinc-800 p-8 rounded-2xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500/10 via-red-500/10 to-amber-500/10 rounded-2xl blur opacity-65" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-rose-950/20 border border-rose-500/30 flex items-center justify-center mb-5 text-rose-500">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                Access Restricted
              </h3>
              <p className="text-xs text-zinc-500 font-mono mt-2">
                SECURE PORTAL INTERCEPTED • LEVEL {activeClearanceLevel}
              </p>
              <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 my-6 text-left w-full space-y-2 text-xs">
                <p className="text-zinc-400 font-sans leading-relaxed">
                  The requested portal <span className="font-mono text-rose-400 font-bold uppercase">{activeTab}</span> is restricted for your active simulated user.
                </p>
                <p className="text-zinc-500 font-sans leading-relaxed text-[11px]">
                  To view this tab, you require a higher security clearance level than your current <span className="font-mono text-zinc-300 font-semibold">Level {activeClearanceLevel}</span>.
                </p>
              </div>

              <div className="w-full space-y-3 text-left">
                <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">
                  Temporarily elevate simulated identity
                </span>
                <select
                  value={simulatedMemberId}
                  onChange={(e) => {
                    const targetId = e.target.value;
                    setSimulatedMemberId(targetId);
                    const combined = [
                      ...(Array.isArray(bandLineup) ? bandLineup : []),
                      ...(Array.isArray(crewMembers) ? crewMembers : []),
                    ];
                    const foundName = combined.find((m: any) => m.id === targetId)?.name || 'Member';
                    triggerNotification?.(`⚡ Simulating ${foundName}`);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none cursor-pointer"
                >
                  {[
                    ...(Array.isArray(bandLineup) ? bandLineup : []).map((m: any) => ({ ...m, type: 'Lineup', lvl: m.clearanceLevel || 5 })),
                    ...(Array.isArray(crewMembers) ? crewMembers : []).map((c: any) => ({ ...c, type: 'Crew', lvl: c.clearanceLevel || 1 })),
                  ].map((member: any, idx: number) => {
                    const optKey = `${member.type}-${member.id || 'noid'}-${idx}`;
                    const optVal = member.id || `${member.type}-${idx}`;
                    return (
                      <option key={optKey} value={optVal}>
                        [{member.type}] {member?.name || 'Unnamed'} ({member.role || 'Crew'}) - Lvl {member.lvl}
                      </option>
                    );
                  })}
                </select>

                <button
                  onClick={() => {
                    setSimulatedMemberId('');
                    triggerNotification?.('⚡ Returned to normal view');
                  }}
                  className="w-full bg-red-950/40 text-red-400 border border-red-900 hover:bg-red-900/60 rounded-lg py-2 text-xs font-mono transition-all"
                >
                  Clear Simulation
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'home' || activeTab === 'home-v2' ? (
        !isBandRegistered ? (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[70vh] bg-[#030303] text-zinc-300 font-mono">
            <div className="max-w-md w-full bg-[#09090b] border border-emerald-500/30 p-8 rounded-2xl shadow-[0_10px_50px_-12px_rgba(16,185,129,0.2)] relative overflow-hidden group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-2xl blur opacity-65" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-center mb-5 text-emerald-400 shadow-lg shadow-emerald-950/50">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider font-display">
                  Band Workspace Locked
                </h3>
                <p className="text-xs text-emerald-400/80 font-mono mt-1">
                  REGISTRATION REQUIRED
                </p>
                <div className="bg-black/50 border border-zinc-800 rounded-xl p-4 my-6 text-left w-full space-y-2 text-xs">
                  <p className="text-zinc-300 font-sans leading-relaxed">
                    You have not registered a Band Workspace on your profile yet.
                  </p>
                  <p className="text-zinc-500 font-sans leading-relaxed text-[11px]">
                    Registering your band unlocks tour logistics, merch inventory management, flight & hotel manifests, setlist builders, and financial tracking.
                  </p>
                </div>

                <div className="w-full space-y-3 text-left">
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('nexus_target_register_workspace', 'band');
                      }
                      setShowWorkspaceRegistration(true);
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-950/50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Register Band Workspace Now</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('social');
                      const updated = { ...userProfile, active_workspace: 'industry_pro', account_type: 'industry_pro' };
                      setUserProfile(updated);
                      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                      window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                    }}
                    className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs rounded-xl transition-all border border-zinc-800 cursor-pointer"
                  >
                    Return to Industry Pro
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'home' ? (
          <HomeDashboardView
            dashboardRef={dashboardRef}
            dashboardScrollPos={dashboardScrollPos}
            setActiveTab={setActiveTab}
            triggerNotification={triggerNotification}
            addLog={addLog}
            musicTrackCount={musicTrackCount}
            isRosterOwner={isRosterOwner}
            setDistroDeckSubTab={setDistroDeckSubTab}
            userProfile={userProfile}
            activeBand={activeBand}
            isSyncBadgeExpanded={isSyncBadgeExpanded}
            setIsOfflineSimActive={setIsOfflineSimActive}
            isOfflineSimActive={isOfflineSimActive}
            isOnline={isOnline}
            setIsSyncBadgeExpanded={setIsSyncBadgeExpanded}
            status={status}
            setIsMetricCarouselPaused={setIsMetricCarouselPaused}
            setCurrentMetricIndex={setCurrentMetricIndex}
            metrics={metrics}
            currentMetricIndex={currentMetricIndex}
            setIsHoveringTourStatus={setIsHoveringTourStatus}
            registerTourStatusInteraction={registerTourStatusInteraction}
            handleStatusTouchStart={handleStatusTouchStart}
            handleStatusTouchMove={handleStatusTouchMove}
            handleStatusTouchEnd={handleStatusTouchEnd}
            hasSettleReminder={hasSettleReminder}
            firstShowToSettle={firstShowToSettle}
            setAutoExpandShowId={setAutoExpandShowId}
            shows={shows}
            setTourStatusIndex={setTourStatusIndex}
            tourStatusIndex={tourStatusIndex}
            activeShowDisplay={activeShowDisplay}
            currentOrNextShow={currentOrNextShow}
            countdownString={countdownString}
            inventory={inventory}
            isCritical={isCritical}
            totalTableStock={totalTableStock}
            totalVanStock={totalVanStock}
            notes={notes}
            filteredNotes={filteredNotes}
            isNoteExpanded={isNoteExpanded}
            setIsNoteExpanded={setIsNoteExpanded}
            inlineNoteEditingId={inlineNoteEditingId}
            setInlineNoteEditingId={setInlineNoteEditingId}
            inlineNoteText={inlineNoteText}
            setInlineNoteText={setInlineNoteText}
            inlineNoteCategory={inlineNoteCategory}
            setInlineNoteCategory={setInlineNoteCategory}
            inlineNoteTag={inlineNoteTag}
            setInlineNoteTag={setInlineNoteTag}
            activeNoteIndex={activeNoteIndex}
            setActiveNoteIndex={setActiveNoteIndex}
            isTourNotesCardCollapsed={isTourNotesCardCollapsed}
            setIsTourNotesCardCollapsed={setIsTourNotesCardCollapsed}
            handleNoteTouchStart={handleNoteTouchStart}
            handleNoteTouchMove={handleNoteTouchMove}
            handleNoteTouchEnd={handleNoteTouchEnd}
            handleDeleteNote={handleDeleteNote}
            handleUpdateNote={handleUpdateNote}
            handleDataSubmit={handleDataSubmit}
            showSpecificNotes={showSpecificNotes}
            localWeather={localWeather}
            weatherLoading={weatherLoading}
            weatherError={weatherError}
            currentCoords={currentCoords}
            customNavDestination={customNavDestination}
            setCustomNavDestination={setCustomNavDestination}
            venues={venues}
            fetchLocalWeather={fetchLocalWeather}
            setIsWeatherForecastExpanded={setIsWeatherForecastExpanded}
            isWeatherForecastExpanded={isWeatherForecastExpanded}
            isEditingBusCall={isEditingBusCall}
            isTime24Hour={isTime24Hour}
            setIsTime24Hour={setIsTime24Hour}
            tempBusCallTime={tempBusCallTime}
            setTempBusCallTime={setTempBusCallTime}
            tempLockupTime={tempLockupTime}
            setTempLockupTime={setTempLockupTime}
            setIsEditingBusCall={setIsEditingBusCall}
            setBusCallTime={setBusCallTime}
            setLockupTime={setLockupTime}
            renderTime={renderTime}
            busCallTime={busCallTime}
            lockupTime={lockupTime}
            checklistItems={checklistItems}
            toggleChecklistItem={toggleChecklistItem}
            flights={flights}
            tableStockPercent={tableStockPercent}
            handleRestock={handleRestock}
            handleNewSaleClick={handleNewSaleClick}
            handleNewSalePointerDown={handleNewSalePointerDown}
            handleNewSalePointerUp={handleNewSalePointerUp}
            setIsGlobalHoverPaused={setIsGlobalHoverPaused}
            setDashboardCarouselIndex={setDashboardCarouselIndex}
            dashboardCarouselIndex={dashboardCarouselIndex}
            getNextShow={getNextShow}
            getSetlistDetailsForShow={getSetlistDetailsForShow}
            selectedGuestlistShowId={selectedGuestlistShowId}
            setSelectedGuestlistShowId={setSelectedGuestlistShowId}
            sales={sales}
            setModalType={setModalType}
            setIsModalOpen={setIsModalOpen}
            sortedShows={sortedShows}
            setPromoCardActiveSlot={setPromoCardActiveSlot}
            promoCardActiveSlot={promoCardActiveSlot}
            setIsNotificationDrawerOpen={setIsNotificationDrawerOpen}
            setDashboardV2ActiveNav={setDashboardV2ActiveNav}
            alliancePosts={alliancePosts}
            previewReactionMenuOpenFor={previewReactionMenuOpenFor}
            setPreviewReactionMenuOpenFor={setPreviewReactionMenuOpenFor}
            handleAlliancePostReaction={handleAlliancePostReaction}
            setAlliancePosts={setAlliancePosts}
            previewFollowedActs={previewFollowedActs}
            setPreviewFollowedActs={setPreviewFollowedActs}
            filteredInventory={filteredInventory}
            setPromoHubSelectedItemId={setPromoHubSelectedItemId}
            setPromoHubSubTab={setPromoHubSubTab}
            loyaltyMembers={loyaltyMembers}
            reviewLeft={reviewLeft}
            userReviews={userReviews}
            setReviewLeft={setReviewLeft}
            setReviewText={setReviewText}
            setReviewScore={setReviewScore}
            reviewScore={reviewScore}
            reviewText={reviewText}
            reviewerName={reviewerName}
            setReviewerName={setReviewerName}
            reviewerGroup={reviewerGroup}
            setReviewerGroup={setReviewerGroup}
            setUserReviews={setUserReviews}
            renderRecentSalesFeed={() => null}
          />
        ) : (
          <HomeV2DashboardView
            setIsGlobalHoverPaused={setIsGlobalHoverPaused}
            dashboardV2ActiveNav={dashboardV2ActiveNav}
            setActiveTab={setActiveTab}
            setDashboardV2ActiveNav={setDashboardV2ActiveNav}
            setIsV2StoryCreatorExpanded={setIsV2StoryCreatorExpanded}
            isV2StoryCreatorExpanded={isV2StoryCreatorExpanded}
            inventory={inventory}
            filteredInventory={filteredInventory}
            triggerNotification={triggerNotification}
            addLog={addLog}
            activeBand={activeBand}
            stagedDistroItems={stagedDistroItems}
            setStagedDistroItems={setStagedDistroItems}
            activeTab={activeTab}
            userProfile={userProfile}
            setUserProfile={setUserProfile}
            bands={bands}
            setBands={setBands}
            bandJoinRequests={bandJoinRequests}
            setBandJoinRequests={setBandJoinRequests}
            isSubNavRestricted={isSubNavRestricted}
            activeClearanceLevel={activeClearanceLevel}
            simulatedMemberId={simulatedMemberId}
            setSimulatedMemberId={setSimulatedMemberId}
            bandLineup={bandLineup}
            crewMembers={crewMembers}
            activeDriver={activeDriver}
            activeEventsSection={activeEventsSection}
            activeShowDisplay={activeShowDisplay}
            busCallTime={busCallTime}
            checkedPreDriveItems={checkedPreDriveItems}
            checklistBank={checklistBank}
            checklistItems={checklistItems}
            commitFlightMutation={commitFlightMutation}
            countdownString={countdownString}
            currentCoords={currentCoords}
            currentOrNextShow={currentOrNextShow}
            customMpg={customMpg}
            customNavDestination={customNavDestination}
            driveHoursElapsed={driveHoursElapsed}
            fetchLocalWeather={fetchLocalWeather}
            filteredNotes={filteredNotes}
            isNoteExpanded={isNoteExpanded}
            setIsNoteExpanded={setIsNoteExpanded}
            inlineNoteEditingId={inlineNoteEditingId}
            setInlineNoteEditingId={setInlineNoteEditingId}
            inlineNoteText={inlineNoteText}
            setInlineNoteText={setInlineNoteText}
            inlineNoteCategory={inlineNoteCategory}
            setInlineNoteCategory={setInlineNoteCategory}
            inlineNoteTag={inlineNoteTag}
            setInlineNoteTag={setInlineNoteTag}
            activeNoteIndex={activeNoteIndex}
            setActiveNoteIndex={setActiveNoteIndex}
            isTourNotesCardCollapsed={isTourNotesCardCollapsed}
            setIsTourNotesCardCollapsed={setIsTourNotesCardCollapsed}
            handleNoteTouchStart={handleNoteTouchStart}
            handleNoteTouchMove={handleNoteTouchMove}
            handleNoteTouchEnd={handleNoteTouchEnd}
            filteredSales={filteredSales}
            filteredShows={filteredShows}
            flights={flights}
            fuelPrice={fuelPrice}
            handleDeleteNote={handleDeleteNote}
            handleUpdateNote={handleUpdateNote}
            handleUpdateOffer={handleUpdateOffer}
            isCritical={isCritical}
            isDriverRotationExpanded={isDriverRotationExpanded}
            isEditingBusCall={isEditingBusCall}
            isFuelCalculatorExpanded={isFuelCalculatorExpanded}
            isInteractiveMapExpanded={isInteractiveMapExpanded}
            isOfflineSimActive={isOfflineSimActive}
            isOnline={isOnline}
            isPreDriveChecklistExpanded={isPreDriveChecklistExpanded}
            isTime24Hour={isTime24Hour}
            isWaypointsExpanded={isWaypointsExpanded}
            localWeather={localWeather}
            lockupTime={lockupTime}
            newWaypointName={newWaypointName}
            newWaypointType={newWaypointType}
            offers={offers}
            onRouteVenueAddress={onRouteVenueAddress}
            renderTime={renderTime}
            selectedGuestlistShowId={selectedGuestlistShowId}
            setActiveDriver={setActiveDriver}
            setActiveEventsSection={setActiveEventsSection}
            setAutoExpandShowId={setAutoExpandShowId}
            setBusCallTime={setBusCallTime}
            setCheckedPreDriveItems={setCheckedPreDriveItems}
            setChecklistBank={setChecklistBank}
            setChecklistItems={setChecklistItems}
            setCustomMpg={setCustomMpg}
            setCustomNavDestination={setCustomNavDestination}
            setDriveHoursElapsed={setDriveHoursElapsed}
            setFlights={setFlights}
            setFuelPrice={setFuelPrice}
            setIsDriverRotationExpanded={setIsDriverRotationExpanded}
            setIsEditingBusCall={setIsEditingBusCall}
            setIsFuelCalculatorExpanded={setIsFuelCalculatorExpanded}
            setIsInteractiveMapExpanded={setIsInteractiveMapExpanded}
            setIsModalOpen={setIsModalOpen}
            setIsOfflineSimActive={setIsOfflineSimActive}
            setIsPreDriveChecklistExpanded={setIsPreDriveChecklistExpanded}
            setIsTime24Hour={setIsTime24Hour}
            setIsWaypointsExpanded={setIsWaypointsExpanded}
            setLockupTime={setLockupTime}
            setModalType={setModalType}
            setNewWaypointName={setNewWaypointName}
            setNewWaypointType={setNewWaypointType}
            setSelectedGuestlistShowId={setSelectedGuestlistShowId}
            setShows={setShows}
            setTempBusCallTime={setTempBusCallTime}
            setTempLockupTime={setTempLockupTime}
            setVehicleType={setVehicleType}
            setVenues={setVenues}
            setWaypoints={setWaypoints}
            showSpecificNotes={showSpecificNotes}
            shows={shows}
            sortedShows={sortedShows}
            tempBusCallTime={tempBusCallTime}
            tempLockupTime={tempLockupTime}
            totalTableStock={totalTableStock}
            totalVanStock={totalVanStock}
            userReviews={userReviews}
            vehicleType={vehicleType}
            venues={venues}
            waypoints={waypoints}
            weatherError={weatherError}
            weatherLoading={weatherLoading}
            bandCoverUrl={bandCoverUrl}
            handleDataSubmit={handleDataSubmit}
            loyaltyMembers={loyaltyMembers}
            setInventory={setInventory}
            setLoyaltyMembers={setLoyaltyMembers}
            inventoryAudits={inventoryAudits}
            setInventoryAudits={setInventoryAudits}
            activeBandId={activeBandId}
            setTransferPreselectedId={setTransferPreselectedId}
            setIsTransferModalOpen={setIsTransferModalOpen}
            setEditingItem={setEditingItem}
            expenses={expenses}
            sales={sales}
            setExpenses={setExpenses}
            setEditingBand={setEditingBand}
            setIsBandModalOpen={setIsBandModalOpen}
            bandInfoBio={bandInfoBio}
            setBandInfoBio={setBandInfoBio}
            bandInfoCustomSlug={bandInfoCustomSlug}
            setBandInfoCustomSlug={setBandInfoCustomSlug}
            bandInfoBookingEmail={bandInfoBookingEmail}
            setBandInfoBookingEmail={setBandInfoBookingEmail}
            bandInfoBookingPhone={bandInfoBookingPhone}
            setBandInfoBookingPhone={setBandInfoBookingPhone}
            bandInfoYoutubeVideo={bandInfoYoutubeVideo}
            setBandInfoYoutubeVideo={setBandInfoYoutubeVideo}
            bandInfoStreamingUrl={bandInfoStreamingUrl}
            setBandInfoStreamingUrl={setBandInfoStreamingUrl}
            bandInfoTechRider={bandInfoTechRider}
            setBandInfoTechRider={setBandInfoTechRider}
            bandInfoTourVehicle={bandInfoTourVehicle}
            setBandInfoTourVehicle={setBandInfoTourVehicle}
            bandInfoMetalArchivesUrl={bandInfoMetalArchivesUrl}
            setBandInfoMetalArchivesUrl={setBandInfoMetalArchivesUrl}
            bandLogoUrl={bandLogoUrl}
            setLogoUploaderDragActive={setLogoUploaderDragActive}
            handleBandInfoLogoUpload={handleBandInfoLogoUpload}
            logoUploaderDragActive={logoUploaderDragActive}
            bandInfoLogoFileInputRef={bandInfoLogoFileInputRef}
            setCoverUploaderDragActive={setCoverUploaderDragActive}
            handleBandInfoCoverUpload={handleBandInfoCoverUpload}
            coverUploaderDragActive={coverUploaderDragActive}
            bandInfoCoverFileInputRef={bandInfoCoverFileInputRef}
            bandInfoName={bandInfoName}
            setBandInfoName={setBandInfoName}
            selectedMicroGenres={selectedMicroGenres}
            setSelectedMicroGenres={setSelectedMicroGenres}
            bandInfoHomebase={bandInfoHomebase}
            setBandInfoHomebase={setBandInfoHomebase}
            bandInfoFoundedYear={bandInfoFoundedYear}
            setBandInfoFoundedYear={setBandInfoFoundedYear}
            setBandLineup={setBandLineup}
            setCrewMembers={setCrewMembers}
            setReviewLeft={setReviewLeft}
            setReviewText={setReviewText}
            reviewScore={reviewScore}
            setReviewScore={setReviewScore}
            reviewText={reviewText}
            reviewerName={reviewerName}
            setReviewerName={setReviewerName}
            reviewerGroup={reviewerGroup}
            setReviewerGroup={setReviewerGroup}
            setSales={setSales}
            logs={logs}
            handleRestock={handleRestock}
            dbStatus={dbStatus}
          />
        )
      ) : (
        <MainTabRouter
          activeTab={activeTab}
          setActiveTab={setActiveTab as any}
          triggerNotification={triggerNotification}
          addLog={addLog}
          dashboardRef={dashboardRef}
          dashboardScrollPos={dashboardScrollPos}
          filteredInventory={filteredInventory}
          inventory={inventory}
          setInventory={setInventory}
          inventoryAudits={inventoryAudits}
          setInventoryAudits={setInventoryAudits}
          setEditingItem={setEditingItem}
          editingItem={editingItem}
          activeBandId={activeBandId}
          setTransferPreselectedId={setTransferPreselectedId}
          setIsTransferModalOpen={setIsTransferModalOpen}
          setDistroDeckSubTab={setDistroDeckSubTab}
          stagedDistroItems={stagedDistroItems}
          setStagedDistroItems={setStagedDistroItems}
          activeClearanceLevel={activeClearanceLevel}
          shows={shows}
          setShows={setShows}
          filteredShows={filteredShows}
          filteredSales={filteredSales}
          sales={sales}
          setSales={setSales}
          commitInventoryMutation={commitInventoryMutation}
          handleDataSubmit={handleDataSubmit}
          activeBand={activeBand}
          setIsCashDrawerOpen={setIsCashDrawerOpen}
          setAutoOpenSettlementShowId={setAutoOpenSettlementShowId}
          loyaltyMembers={loyaltyMembers}
          setLoyaltyMembers={setLoyaltyMembers}
          isOfflineSimActive={isOfflineSimActive}
          isOnline={isOnline}
          processingGlobalSyncQueue={processingGlobalSyncQueue}
          getSupabase={getSupabase}
          inventoryStore={inventoryStore}
          setModalType={setModalType as any}
          setIsModalOpen={setIsModalOpen}
          pendingOpenShowsForm={pendingOpenShowsForm}
          setPendingOpenShowsForm={setPendingOpenShowsForm}
          autoExpandShowId={autoExpandShowId}
          setAutoExpandShowId={setAutoExpandShowId}
          autoOpenSettlementShowId={autoOpenSettlementShowId}
          setOnRouteVenueAddress={setOnRouteVenueAddress}
          offers={offers}
          blockedPromoters={blockedPromoters}
          handleAcceptOffer={handleAcceptOffer}
          handleDeclineOffer={handleDeclineOffer}
          handleRenegotiateOffer={handleRenegotiateOffer}
          handleBlockPromoter={handleBlockPromoter}
          handleUpdateOffer={handleUpdateOffer}
          filteredNotes={filteredNotes}
          handleDeleteNote={handleDeleteNote}
          handleUpdateNote={handleUpdateNote}
          userProfile={userProfile}
          setUserProfile={setUserProfile}
          venues={venues}
          setVenues={setVenues}
          setSettingsExpandedSection={setSettingsExpandedSection}
          logs={logs}
          handleRestock={handleRestock}
          dbStatus={dbStatus}
          supabaseUrl={supabaseUrl}
          supabaseKey={supabaseKey}
          bands={bands}
          setBands={setBands}
          setActiveBandId={setActiveBandId}
          setIsBandModalOpen={setIsBandModalOpen}
          settingsExpandedSection={settingsExpandedSection}
          selectedGuestlistShowId={selectedGuestlistShowId}
          expenses={expenses}
          setExpenses={setExpenses}
          promoHubSubTab={promoHubSubTab}
          promoHubSelectedItemId={promoHubSelectedItemId}
          userReviews={userReviews}
          setUserReviews={setUserReviews}
          activePlan={activePlan}
          setActivePlan={setActivePlan}
          flights={flights}
          setFlights={setFlights}
          commitFlightMutation={commitFlightMutation}
          pendingFlightIsAdding={pendingFlightIsAdding}
          setPendingFlightIsAdding={setPendingFlightIsAdding}
          checklistItems={checklistItems}
          setChecklistItems={setChecklistItems}
          checklistBank={checklistBank}
          setChecklistBank={setChecklistBank}
          onRouteVenueAddress={onRouteVenueAddress}
          distroDeckSubTab={distroDeckSubTab}
        />
      )}
    </Suspense>
  );
};

export default ArtistBandPortal;
