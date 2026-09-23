
import { V2ExpandableCard } from "../V2ExpandableCard";
import DevBandDistroDeck from "../portals/Band/DevBandDistroDeck";
import MerchandisePrintersView from "../portals/Band/MerchandisePrintersView";
import { getShowWeatherAndWarnings } from "../portals/Band/ShowsView";
import { getShowCoordinates, calculateHaversineDistance } from "../../utils/geoUtils";
const concertBg = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20concert%202.png";
import React from "react";
import { useBandState } from "../../hooks/useBandState";
import { useInventoryState } from "../../hooks/useInventoryState";
import { useOffersManagement } from "../../hooks/useOffersManagement";
import { LegacyMetricsCarousel } from "./LegacyMetricsCarousel";
import { Calendar, ShoppingCart, Tag, TrendingUp, Globe, Settings, Sparkles, ChevronUp, ChevronDown, Lock, Mic } from "lucide-react";
import PromoHubView from "../portals/Band/PromoHubView";
import EventsWorkspace from "../portals/Band/EventsWorkspace";
import SalesWorkspace from "../portals/Band/SalesWorkspace";
import MerchWorkspaceWrapper from "../portals/Band/MerchWorkspaceWrapper";
import FinanceWorkspace from "../portals/Band/FinanceWorkspace";
import SettingsWorkspace from "../SettingsWorkspace";

export function HomeV2DashboardView(props: any & { renderTourNotesCard: any; renderCashDrawerLedgerSection: any; renderDecoupledLiveInventorySection: any; renderDecoupledLiveTeamActivitySection: any; renderRecentSalesFeed: any; renderDecoupledFinanceCards: any; supabaseUrl?: string; supabaseKey?: string; }) {
  const { bands, setBands, activeBandId, setActiveBandId, currentLoadedBandId, setCurrentLoadedBandId, editingBand, setEditingBand, deletingBandId, setDeletingBandId, bandLineup, setBandLineup, crewMembers, setCrewMembers, bandLogoUrl, setBandLogoUrl, bandCoverUrl, setBandCoverUrl, selectedMicroGenres, setSelectedMicroGenres, bandJoinRequests, setBandJoinRequests } = useBandState();
  const { inventory, setInventory, editingItem, setEditingItem, stagedDistroItems, setStagedDistroItems, inventoryAudits, setInventoryAudits } = useInventoryState();
  const { offers, setOffers, blockedPromoters, setBlockedPromoters } = useOffersManagement();

  const {
    userProfile,
    setUserProfile,
    activeClearanceLevel,
    setActiveClearanceLevel,
    simulatedMemberId,
    setSimulatedMemberId,
    isPttRecording,
    setIsPttRecording,
    isInitialHydrated,
    setIsInitialHydrated,
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
    currentCoords,
    setCurrentCoords,
    busCallTime,
    setBusCallTime,
    lockupTime,
    setLockupTime,
    isTime24Hour,
    setIsTime24Hour,
    isEditingBusCall,
    setIsEditingBusCall,
    isWeatherForecastExpanded,
    setIsWeatherForecastExpanded,
    customNavDestination,
    setCustomNavDestination,
    isWaypointsExpanded,
    setIsWaypointsExpanded,
    isInteractiveMapExpanded,
    setIsInteractiveMapExpanded,
    isFuelCalculatorExpanded,
    setIsFuelCalculatorExpanded,
    isPreDriveChecklistExpanded,
    setIsPreDriveChecklistExpanded,
    isDriverRotationExpanded,
    setIsDriverRotationExpanded,
    vehicleType,
    setVehicleType,
    fuelPrice,
    setFuelPrice,
    customMpg,
    setCustomMpg,
    activeDriver,
    setActiveDriver,
    driveHoursElapsed,
    setDriveHoursElapsed,
    checkedPreDriveItems,
    setCheckedPreDriveItems,
    waypoints,
    setWaypoints,
    newWaypointName,
    setNewWaypointName,
    newWaypointType,
    setNewWaypointType,
    tempBusCallTime,
    setTempBusCallTime,
    tempLockupTime,
    setTempLockupTime,
    isOfflineSimActive,
    setIsOfflineSimActive,
    isSyncBadgeExpanded,
    setIsSyncBadgeExpanded,
    activeTab,
    setActiveTab,
    distroDeckSubTab,
    setDistroDeckSubTab,
    settingsExpandedSection,
    setSettingsExpandedSection,
    promoHubSubTab,
    setPromoHubSubTab,
    promoHubSelectedItemId,
    setPromoHubSelectedItemId,
    promoCardActiveSlot,
    setPromoCardActiveSlot,
    blackBookCardActiveSlot,
    setBlackBookCardActiveSlot,
    isTransferModalOpen,
    setIsTransferModalOpen,
    isCashDrawerOpen,
    setIsCashDrawerOpen,
    onRouteVenueAddress,
    setOnRouteVenueAddress,
    inlineCashDrawerAddingType,
    setInlineCashDrawerAddingType,
    inlineCashDrawerAmount,
    setInlineCashDrawerAmount,
    inlineCashDrawerDescription,
    setInlineCashDrawerDescription,
    inlineCashDrawerActiveFilter,
    setInlineCashDrawerActiveFilter,
    dashboardV2ActiveNav,
    setDashboardV2ActiveNav,
    isLiveTeamActivityOpen,
    setIsLiveTeamActivityOpen,
    activeEventsSection,
    setActiveEventsSection,
    isV2StoryCreatorExpanded,
    setIsV2StoryCreatorExpanded,
    v2RoleMenuOpen,
    setV2RoleMenuOpen,
    isPttOpen,
    setIsPttOpen,
    allianceActivePostIndex,
    setAllianceActivePostIndex,
    allianceCommentText,
    setAllianceCommentText,
    previewReactionMenuOpenFor,
    setPreviewReactionMenuOpenFor,
    previewFollowedActs,
    setPreviewFollowedActs,
    alliancePosts,
    setAlliancePosts,
    notifications,
    setNotifications,
    isNotificationDrawerOpen,
    setIsNotificationDrawerOpen,
    isNavMenuOpen,
    setIsNavMenuOpen,
    isQuickActionPanelOpen,
    setIsQuickActionPanelOpen,
    pendingOpenShowsForm,
    setPendingOpenShowsForm,
    pendingFlightIsAdding,
    setPendingFlightIsAdding,
    autoExpandShowId,
    setAutoExpandShowId,
    transferPreselectedId,
    setTransferPreselectedId,
    autoOpenSettlementShowId,
    setAutoOpenSettlementShowId,
    isLoggedOut,
    setIsLoggedOut,
    showSplash,
    setShowSplash,
    loginInitialTab,
    setLoginInitialTab,
    isUpgradeMode,
    setIsUpgradeMode,
    showWorkspaceRegistration,
    setShowWorkspaceRegistration,
    currentTime,
    setCurrentTime,
    activePlan,
    setActivePlan,
    isLongPressTriggered,
    setIsLongPressTriggered,
    profileCarouselIndex,
    setProfileCarouselIndex,
    dbStatus,
    setDbStatus,
    isOnline,
    setIsOnline,
    pendingSyncCount,
    setPendingSyncCount,
    logs,
    setLogs,
    isModalOpen,
    setIsModalOpen,
    modalType,
    setModalType,
    selectedSaleReceipt,
    setSelectedSaleReceipt,
    sales,
    setSales,
    shows,
    setShows,
    isHydrated,
    setIsHydrated,
    notes,
    setNotes,
    dailySalesGoal,
    setDailySalesGoal,
    cashTransactions,
    setCashTransactions,
    expenses,
    setExpenses,
    venues,
    setVenues,
    isBandModalOpen,
    setIsBandModalOpen,
    newBandForm,
    setNewBandForm,
    customLogoPreset,
    setCustomLogoPreset,
    editName,
    setEditName,
    editGenre,
    setEditGenre,
    editLogoUrl,
    setEditLogoUrl,
    editLogoPresetIdx,
    setEditLogoPresetIdx,
    dragActive,
    setDragActive,
    bandInfoName,
    setBandInfoName,
    bandInfoHomebase,
    setBandInfoHomebase,
    bandInfoFoundedYear,
    setBandInfoFoundedYear,
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
    logoUploaderDragActive,
    setLogoUploaderDragActive,
    coverUploaderDragActive,
    setCoverUploaderDragActive,
    reviewScore,
    setReviewScore,
    reviewText,
    setReviewText,
    reviewerName,
    setReviewerName,
    reviewerGroup,
    setReviewerGroup,
    reviewLeft,
    setReviewLeft,
    userReviews,
    setUserReviews,
    loyaltyMembers,
    setLoyaltyMembers,
    showNotification,
    setShowNotification,
    leftCarouselIndex,
    setLeftCarouselIndex,
    isLeftCardPaused,
    setIsLeftCardPaused,
    isMetricCarouselPaused,
    setIsMetricCarouselPaused,
    isGlobalHoverPaused,
    setIsGlobalHoverPaused = () => {},
    isEditingSalesGoal,
    setIsEditingSalesGoal,
    salesGoalInput,
    setSalesGoalInput,
    newExpenseDesc,
    setNewExpenseDesc,
    newExpenseAmount,
    setNewExpenseAmount,
    currentMetricIndex,
    setCurrentMetricIndex,
    teamCarouselIndex,
    setTeamCarouselIndex,
    isTeamCarouselPaused,
    setIsTeamCarouselPaused,
    dashboardCarouselIndex,
    setDashboardCarouselIndex,
    selectedGuestlistShowId,
    setSelectedGuestlistShowId,
    localWeather,
    setLocalWeather,
    weatherLoading,
    setWeatherLoading,
    weatherError,
    setWeatherError,
    musicTrackCount,
    setMusicTrackCount,
    revenueSplits,
    setRevenueSplits,
    tourStatusIndex,
    setTourStatusIndex,
    isTourStatusPaused,
    setIsTourStatusPaused,
    isHoveringTourStatus,
    setIsHoveringTourStatus,
    lastInteractionTime,
    setLastInteractionTime,
    isChecklistModalOpen,
    setIsChecklistModalOpen,
    isFlightModalOpen,
    setIsFlightModalOpen,
    flights,
    setFlights,
    checklistItems,
    setChecklistItems,
    checklistBank,
    setChecklistBank,


































    queueLength,
    isSyncing,
    type,
    operation,
    payload,
    error,
    data,
    count,
    latitude,
    longitude,
    saved,
    handleUnhandledRejection,
    activeBandIdRef,
    userProfileRef,
    NOTE_CATEGORIES,
    NOTE_STATUSES,
    handleNoteTouchStart,
    handleNoteTouchMove,
    handleNoteTouchEnd,
    isRosterOwner,
    isTabRestricted,
    allowed,
    isSubNavRestricted,
    parsed,
    dashboardScrollPos,
    dashboardRef,
    cached,
    defaultAnnouncements,
    handleAlliancePostReaction,
    updated,
    newActive,
    hypeReact,
    matrix,
    emoji,
    label,
    seenIds,
    seenMessages,
    msgKey,
    notifTime,
    prevTime,
    params,
    handleLocationChange,
    handleProfileUpdate,
    handleNavigate,
    playPttSound,
    AudioCtx,
    ctx,
    osc1,
    osc2,
    gain,
    osc,
    bufferSize,
    buffer,
    noise,
    filter,
    renderTime,
    parts,
    min,
    ampm,
    now,
    getTrialCountdownStr,
    isPromoGated,
    yearInMs,
    endTime,
    timeLeft,
    days,
    hours,
    trialDurationMs,
    minutes,
    seconds,
    newSalePressTimer,
    handleNewSalePointerDown,
    handleNewSalePointerUp,
    handleNewSaleClick,
    interval,
    getNextShow,
    todayStr,
    upcoming,
    sorted,
    getSetlistDetailsForShow,
    setlistsMap,
    sl,
    totalSecs,
    timer,
    isSupabaseConfigured,
    handleQueueChanged,
    addLog,
    queueOfflineAction,
    existingQueueStr,
    queue,
    hydrateStores,
    inv,
    pos,
    old,
    shws,
    flts,
    revs,
    vens,
    oldV,
    offs,
    oldO,
    exps,
    oldE,
    lm,
    ct,
    bp,
    existing,
    extendedMap,
    extra,
    isLoadedFromDbRef,
    mockIds,
    activeBand,
    handleCreateOffer,
    handleUpdateOffer,
    nextShows,
    handleAcceptOffer,
    handleDeclineOffer,
    handleBlockPromoter,
    targetOffer,
    promoterId,
    handleRenegotiateOffer,
    supabase,
    validBands,
    cleanBandPayload,
    errors,
    loadCaches,
    legacyBands,
    adminBands,
    adminActiveId,
    userBandsData,
    userActiveId,
    suffix,
    cachedSalesStr,
    cachedShowsStr,
    cachedNotesStr,
    cachedAuditsStr,
    cachedInventoryStr,
    cachedExpensesStr,
    cachedCashTransactionsStr,
    cachedSalesGoalStr,
    defaultExpenses,
    variantsCache,
    bandId,
    savedLineup,
    rawLineup,
    savedCover,
    savedCrew,
    activeSimulatedMember,
    list,
    crewList,
    combined,
    found,
    lvl,
    filteredShows,
    filteredSales,
    filteredInventory,
    filteredNotes,
    logoPresets,
    rosterFileInputRef,
    editRosterFileInputRef,
    bandInfoLogoFileInputRef,
    bandInfoCoverFileInputRef,
    parsedGenres,
    handleBandInfoLogoUpload,
    reader,
    dataUrl,
    userProfileId,
    publicUrl,
    handleBandInfoCoverUpload,
    compressLogoImage,
    img,
    canvas,
    compressedUrl,
    handleLogoUpload,
    handleUpdateBand,
    updatedLogo,
    handleDeleteBand,
    remaining,
    handleCreateBand,
    currentLimit,
    newId,
    bandLogo,
    existingBandsStr,
    existingBands,
    updatedBands,
    registered,
    updatedProfile,
    handleOpenMyProfile,
    isBandWorkspace,
    detailPayload,
    raw,
    triggerNotification,
    handleOfflineSyncSuccess,
    handleRestock,
    saveShowExtraMetadata,
    syncOfflineQueue,
    queueStr,
    dbSale,
    columns,
    dbNote,
    handleOnline,
    handleOffline,
    commitInventoryMutation,
    mutations,
    existsIndex,
    commitSaleMutation,
    validMutations,
    amt,
    qty,
    commitFlightMutation,
    commitShowMutation,
    commitReviewMutation,
    processingGlobalSyncQueue,
    processQueueForModule,
    masterCache,
    localTs,
    cloudTs,
    matchedSplit,
    grossFunds,
    labelLine,
    artistLine,
    cleanPayload,
    setlistsCache,
    handleDataSubmit,
    id,
    timestamp,
    isUpdate,
    handleDeleteNote,
    handleUpdateNote,
    dbUpdates,
    handleMarkNotificationAsRead,
    hydrateModuleData,
    mockSaleIds,
    realSales,
    mockShowIds,
    realShows,
    mockNoteIds,
    realNotes,
    localNotes,
    cvStr,
    formatted,
    cachedStr,
    dbIdSet,
    localOnlyItems,
    merged,
    localAudits,
    localLoyalty,
    localBjr,
    cleanNotifs,
    localNotif,
    unsubscribeSales,
    payloadTime,
    isRecentDuplicate,
    checkTime,
    unsubscribeShows,
    unsubscribeNotes,
    isFallback,
    unsubscribeFlights,
    unsubscribeReviews,
    unsubscribeAudits,
    unsubscribeLoyalty,
    leftTouchStartXRef,
    leftTouchEndXRef,
    leftTouchTimerRef,
    handleLeftTouchStart,
    handleLeftTouchMove,
    handleLeftTouchEnd,
    diffX,
    activeEl,
    isEditing,
    todayStrValForSales,
    todaySalesOnly,
    todayRevenue,
    isCritical,
    totalTableStock,
    totalVanStock,
    dailyExpensesTotal,
    todayStrVal,
    runningExpensesTotal,
    expensePerShow,
    showsCount,
    topSellingItems,
    sortedList,
    mapped,
    dbMatch,
    activeNames,
    fallbackPool,
    sortedShows,
    oneYearFromNow,
    oneYearFromNowStr,
    currentOrNextShow,
    showsNeedingSettlement,
    timeParts,
    h,
    m,
    endThreshold,
    hasSettleReminder,
    firstShowToSettle,
    activeShowDisplay,
    countdownString,
    targetDate,
    diffMs,
    endWindow,
    showSpecificNotes,
    tableStockPercent,
    maxPotential,
    totalSalesCount,
    todaySalesCount,
    todayItemsSold,
    tourTotalRevenue,
    averageSaleValue,
    itemCounts,
    handleAddExpense,
    newExp,
    handleSaveSalesGoal,
    fetchLocalWeather,
    geoRes,
    geoData,
    city,
    subdivision,
    weatherRes,
    weatherData,
    current,
    tempVal,
    relativeHumidity,
    windSpeed,
    code,
    fCode,
    dateObj,
    dayName,
    registerTourStatusInteraction,
    touchStartXRef,
    touchEndXRef,
    handleStatusTouchStart,
    handleStatusTouchMove,
    handleStatusTouchEnd,
    msSinceLastInteraction,
    toggleChecklistItem,
    nextState,
    status,
    teamMembers,
    savedTeam,
    avatars,
    teamActivities,
    member,
    timeMs,
    timeAgo,
    m0,
    m1,
    m2,
    totalInventoryValue,
    metrics,
    renderLegacyMetricsCarousel,
    reactions,
    i,
    hr,
    cachedBands,
    cachedActiveBandIdStr,
    currentActiveBandId,
    width,
    height,
    successCount,
    needsUpdate,
    item,
    skipTableUpsert,
    hasSplitAction,
    sls,
    slsNeedsUpdate,
    active,
    mergedShows,
    targetHour,
    targetMinute,
    topSellerName,
    maxCount,
    cityNameStr,
    conditionStr,
    fCondition,
    fIcon,
    avatar,
    App
  } = props;
  
  const {
    renderTourNotesCard,
    renderCashDrawerLedgerSection,
    renderDecoupledLiveInventorySection,
    renderDecoupledLiveTeamActivitySection,
    renderRecentSalesFeed,
    renderDecoupledFinanceCards,
    supabaseUrl,
    supabaseKey
  } = props;

  return (
          <div id="v2-dashboard-scroll-container" className="flex-grow overflow-y-auto w-full h-full p-0 m-0 scrollbar-thin bg-[#050505] flex flex-col band-portal-theme">
            {/* Top Navigation Menu Bar */}
            <div className="sticky top-0 z-20 bg-[#0c0e12]/95 backdrop-blur-md border-b border-zinc-900 w-full shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col">
              {/* Glowing Icon Navigation Bar */}
              <div className="flex items-center justify-around px-2 py-[7px] relative w-full bg-[#0c0e12]">
                {[
                  { id: 'EVENTS', label: 'Events', icon: Calendar },
                  { id: 'SALES', label: 'Sales', icon: ShoppingCart },
                  { id: 'MERCH', label: 'Merch', icon: Tag },
                  { id: 'FINANCE', label: 'Finance', icon: TrendingUp },
                  { id: 'SOCIAL', label: 'Social', icon: Globe },
                  { id: 'SETTINGS', label: 'Settings', icon: Settings },
                  { id: 'STUDIO', label: 'Studio', icon: Mic },
                ].map((item, idx) => {
                  const IconComponent = item.icon;
                  const isActive = item.id === 'STUDIO' ? activeTab === 'studio' : dashboardV2ActiveNav === item.id;
                  return (
                    <button
                      key={`${item.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        if (item.id === 'STUDIO') {
                          setActiveTab('studio');
                        } else if (item.id === 'SOCIAL') {
                          setActiveTab('social');
                        } else {
                          setDashboardV2ActiveNav(item.id as any);
                        }
                      }}
                      className="flex flex-col items-center justify-center w-full pt-0.5 pb-1 group relative transition-colors cursor-pointer"
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-[#39ff14]/10 blur-xl rounded-full w-10 h-10 mx-auto -z-10 animate-pulse" />
                      )}
                      <IconComponent className={`w-5 h-5 mb-0.5 transition-all ${
                        isActive
                          ? 'text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)] scale-110'
                          : 'text-zinc-500 group-hover:text-zinc-300'
                      }`} />
                      <span className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors ${
                        isActive ? 'text-[#39ff14] font-black' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="w-8 h-[3px] bg-[#39ff14] shadow-[0_0_12px_rgba(57,255,20,0.8)] rounded-t-full absolute bottom-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Story Creator (Full Width, Collapsed by Default with Glowing Green Border, Outside the Main Padded Container) */}
            {dashboardV2ActiveNav === 'SOCIAL' && (
              <div className="w-full border-b border-[#39ff14]/30 bg-zinc-950/95 overflow-hidden shadow-[0_4px_25px_rgba(57,255,20,0.08)] z-30">
                <button
                  type="button"
                  onClick={() => setIsV2StoryCreatorExpanded(!isV2StoryCreatorExpanded)}
                  className="w-full px-4 py-3.5 bg-[#39ff14]/5 hover:bg-[#39ff14]/10 transition-all flex items-center justify-between border-b border-[#39ff14]/20 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full bg-[#39ff14] shadow-[0_0_10px_#39ff14] ${isV2StoryCreatorExpanded ? 'animate-pulse' : ''}`} />
                    <div>
                      <span className="text-[11px] font-mono font-black text-[#39ff14] tracking-widest uppercase block">
                        STORY CREATOR WORKSPACE
                      </span>
                      <span className="text-[8.5px] font-mono text-zinc-400 font-medium">
                        {isV2StoryCreatorExpanded ? 'Configure and distribute immersive interactive visual stories' : 'Tap to open story setup and creative templates'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[8.5px] font-mono text-zinc-400 font-black tracking-wider uppercase shrink-0">
                    <span className="text-[#39ff14]/80">{isV2StoryCreatorExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
                    {isV2StoryCreatorExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#39ff14]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#39ff14]" />
                    )}
                  </div>
                </button>
                {isV2StoryCreatorExpanded && (
                  <div className="bg-black">
                    <PromoHubView
                      inventory={filteredInventory}
                      onBack={() => {}}
                      triggerNotification={triggerNotification}
                      addLog={addLog}
                      activeBandName={activeBand?.name || 'Artist'}
                      stagedDistroItems={stagedDistroItems}
                      setStagedDistroItems={setStagedDistroItems}
                      initialSubTab="stories"
                      subTabMode="stories_only"
                      onCollapse={() => {
                        setIsV2StoryCreatorExpanded(false);
                        setTimeout(() => {
                          const container = document.getElementById('v2-dashboard-scroll-container');
                          if (container) {
                            container.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }, 50);
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* V2 Viewport / Workspace */}
            <div className={`${dashboardV2ActiveNav === 'EVENTS' ? 'pb-2' : dashboardV2ActiveNav === 'MERCH' ? 'pb-20' : dashboardV2ActiveNav === 'FINANCE' ? 'pb-8' : 'pb-32'} flex-grow w-full`}>
               {isSubNavRestricted(dashboardV2ActiveNav, activeClearanceLevel) ? (
                 <div className="mx-5 my-6 p-8 bg-[#09090b] border border-zinc-850 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-12 h-12 rounded-full bg-rose-950/20 border border-rose-500/30 flex items-center justify-center text-rose-500">
                     <Lock className="w-6 h-6" />
                   </div>
                   <div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-white">Access Restricted</h3>
                     <p className="text-[10px] text-zinc-500 font-mono mt-1">SECURE PORTAL INTERCEPTED • LEVEL {activeClearanceLevel}</p>
                   </div>
                   <p className="text-xs text-zinc-400 max-w-[280px] leading-relaxed">
                     The <span className="font-mono text-rose-400 font-bold uppercase">{dashboardV2ActiveNav}</span> panel is restricted for your active simulated user. You require higher security clearance to unlock this console.
                   </p>
                   <div className="pt-2 w-full max-w-[240px] space-y-2 text-left">
                     <span className="text-[8px] font-mono uppercase text-zinc-500 block mb-1 tracking-wider font-bold">Acting simulated identity</span>
                     <select
                       value={simulatedMemberId}
                       onChange={(e) => {
                         const targetId = e.target.value;
                         setSimulatedMemberId(targetId);
                         const combined = [
                           ...(Array.isArray(bandLineup) ? bandLineup : []),
                           ...(Array.isArray(crewMembers) ? crewMembers : [])
                         ];
                         const foundName = combined.find((m: any) => m.id === targetId)?.name || 'Member';
                         triggerNotification?.(`⚡ Simulating ${foundName}`);
                       }}
                       className="w-full bg-zinc-900 border border-zinc-800 focus:border-[#00ffcc]/50 rounded-lg px-2 py-1.5 text-xs text-white font-mono focus:outline-none cursor-pointer"
                     >
                       {[
                         ...(Array.isArray(bandLineup) ? bandLineup : []).map((m: any) => ({ ...m, type: 'Lineup', lvl: m.clearanceLevel || 5 })),
                         ...(Array.isArray(crewMembers) ? crewMembers : []).map((c: any) => ({ ...c, type: 'Crew', lvl: c.clearanceLevel || 1 }))
                       ].map((member: any, idx) => (
                         <option key={`${member.id || '' || ''}-${idx}`} value={member.id}>
                           [{member.type}] {member?.name || 'Unnamed'} ({member.role || 'Crew'}) - Lvl {member.lvl}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>
               ) : (
                 <>
                   {dashboardV2ActiveNav === 'EVENTS' && (
<EventsWorkspace 
  activeBand={activeBand}
  activeClearanceLevel={activeClearanceLevel}
              bandJoinRequests={bandJoinRequests}
              setBandJoinRequests={setBandJoinRequests}
  activeDriver={activeDriver}
  activeEventsSection={activeEventsSection}
  activeShowDisplay={activeShowDisplay}
  addLog={addLog}
  busCallTime={busCallTime}
  calculateHaversineDistance={calculateHaversineDistance}
  checkedPreDriveItems={checkedPreDriveItems}
  checklistBank={checklistBank}
  checklistItems={checklistItems}
  commitFlightMutation={commitFlightMutation}
  concertBg={concertBg}
  countdownString={countdownString}
  currentCoords={currentCoords}
  currentOrNextShow={currentOrNextShow}
  customMpg={customMpg}
  customNavDestination={customNavDestination}
  dashboardV2ActiveNav={dashboardV2ActiveNav}
  driveHoursElapsed={driveHoursElapsed}
  encodeURIComponent={encodeURIComponent}
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
  setIsGlobalHoverPaused={setIsGlobalHoverPaused}
  handleDataSubmit={handleDataSubmit}
  filteredSales={filteredSales}
  filteredShows={filteredShows}
  flights={flights}
  fuelPrice={fuelPrice}
  getShowCoordinates={getShowCoordinates}
  getShowWeatherAndWarnings={getShowWeatherAndWarnings}
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
  renderTourNotesCard={renderTourNotesCard}
  selectedGuestlistShowId={selectedGuestlistShowId}
  setActiveDriver={setActiveDriver}
  setActiveEventsSection={setActiveEventsSection}
  setActiveTab={setActiveTab}
  setAutoExpandShowId={setAutoExpandShowId}
  setBusCallTime={setBusCallTime}
  setCheckedPreDriveItems={setCheckedPreDriveItems}
  setChecklistBank={setChecklistBank}
  setChecklistItems={setChecklistItems}
  setCustomMpg={setCustomMpg}
  setCustomNavDestination={setCustomNavDestination}
  setDashboardV2ActiveNav={setDashboardV2ActiveNav}
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
  setUserProfile={setUserProfile}
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
  triggerNotification={triggerNotification}
  undefined={undefined}
  userProfile={userProfile}
  userReviews={userReviews}
  vehicleType={vehicleType}
  venues={venues}
  waypoints={waypoints}
  weatherError={weatherError}
  weatherLoading={weatherLoading}
/>
)}

               {dashboardV2ActiveNav === 'SALES' && (
<SalesWorkspace 
  activeBand={activeBand}
  addLog={addLog}
  bandCoverUrl={bandCoverUrl}
  dashboardV2ActiveNav={dashboardV2ActiveNav}
  filteredInventory={filteredInventory}
  handleDataSubmit={handleDataSubmit}
  inventory={inventory}
  loyaltyMembers={loyaltyMembers}
  renderCashDrawerLedgerSection={renderCashDrawerLedgerSection}
  renderDecoupledLiveInventorySection={renderDecoupledLiveInventorySection}
  renderDecoupledLiveTeamActivitySection={renderDecoupledLiveTeamActivitySection}
  renderLegacyMetricsCarousel={renderLegacyMetricsCarousel}
  renderRecentSalesFeed={renderRecentSalesFeed}
  sales={sales}
  setInventory={setInventory}
  setLoyaltyMembers={setLoyaltyMembers}
  setShows={setShows}
  setStagedDistroItems={setStagedDistroItems}
  shows={filteredShows || shows}
  filteredShows={filteredShows}
  stagedDistroItems={stagedDistroItems}
  triggerNotification={triggerNotification}
  handleNewSaleClick={handleNewSaleClick}
  handleNewSalePointerDown={handleNewSalePointerDown}
  handleNewSalePointerUp={handleNewSalePointerUp}
  setActiveTab={setActiveTab}
  setDashboardV2ActiveNav={setDashboardV2ActiveNav}
/>
)}

               {dashboardV2ActiveNav === 'MERCH' && (
                  <MerchWorkspaceWrapper
                    filteredInventory={filteredInventory}
                    setInventory={setInventory}
                    inventoryAudits={inventoryAudits}
                    setInventoryAudits={setInventoryAudits}
                    triggerNotification={triggerNotification}
                    addLog={addLog}
                    activeBandId={activeBandId}
                    activeBand={activeBand}
                    onOpenTransferModal={(itemId) => {
                      setTransferPreselectedId(itemId || null);
                      setIsTransferModalOpen(true);
                    }}
                    stagedDistroItems={stagedDistroItems}
                    setStagedDistroItems={setStagedDistroItems}
                    setEditingItem={setEditingItem}
                    setActiveTab={setActiveTab}
                  />
               )}
               {false && (
                 <div className="flex flex-col gap-0">
                    <V2ExpandableCard title="Audio & Merch Hub" defaultExpanded={false}>
                      <div className="h-[75vh] overflow-y-auto relative bg-[#0a0a0a]">
                        <DevBandDistroDeck
                          inventory={inventory}
                          triggerNotification={triggerNotification}
                          onBack={() => {}}
                          onNavigateToTab={(tab) => setActiveTab(tab as any)}
                          stagedDistroItems={stagedDistroItems}
                          setStagedDistroItems={setStagedDistroItems}
                          initialSubTab="music"
                          subTabMode="decoupled_merch"
                        />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard title="Merch Print Shop" defaultExpanded={false}>
                      <div className="h-[75vh] overflow-y-auto">
                        <MerchandisePrintersView
                          inventory={inventory}
                          onBack={() => {}}
                          triggerNotification={triggerNotification}
                          addLog={addLog}
                        />
                      </div>
                    </V2ExpandableCard>
                 </div>
               )}

               {dashboardV2ActiveNav === 'FINANCE' && (
<FinanceWorkspace 
  activeBand={activeBand}
  addLog={addLog}
  dashboardV2ActiveNav={dashboardV2ActiveNav}
  expenses={expenses}
  inventory={inventory}
  renderDecoupledFinanceCards={renderDecoupledFinanceCards}
  sales={sales}
  setExpenses={setExpenses}
  setShows={setShows}
  shows={shows}
  triggerNotification={triggerNotification}
/>
)}

               {dashboardV2ActiveNav === 'SETTINGS' && (
                 <SettingsWorkspace
                   bandCoverUrl={bandCoverUrl}
                   activeBand={activeBand}
                   bands={bands}
                   setBands={setBands}
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
                   bandLineup={bandLineup}
                   setBandLineup={setBandLineup}
                   crewMembers={crewMembers}
                   setCrewMembers={setCrewMembers}
                   bandJoinRequests={bandJoinRequests}
                   setBandJoinRequests={setBandJoinRequests}
                   triggerNotification={triggerNotification}
                   userReviews={userReviews}
                   setReviewLeft={setReviewLeft}
                   setReviewText={setReviewText}
                   reviewScore={reviewScore}
                   setReviewScore={setReviewScore}
                   reviewText={reviewText}
                   reviewerName={reviewerName}
                   setReviewerName={setReviewerName}
                   reviewerGroup={reviewerGroup}
                   setReviewerGroup={setReviewerGroup}
                   userProfile={userProfile}
                   setUserProfile={setUserProfile}
                   shows={shows}
                   setShows={setShows}
                   inventory={inventory}
                   setInventory={setInventory}
                   sales={sales}
                   setSales={setSales}
                   venues={venues}
                   setVenues={setVenues}
                   addLog={addLog}
                   logs={logs}
                   handleDataSubmit={handleDataSubmit}
                   handleRestock={handleRestock}
                   dbStatus={dbStatus}
                   supabaseUrl={supabaseUrl}
                   supabaseKey={supabaseKey}
                 />
               )}
                 </>
               )}
            </div>
          </div>
  );
}