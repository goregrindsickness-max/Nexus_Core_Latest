import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Coffee, Square, User, RefreshCw, Edit2, Trash2, MapPin, Clock, Calendar, ChevronDown, ChevronUp, Check, X, FileText, Plane, CheckSquare, Settings, Flame, Compass, Truck, Table, ChevronRight, ChevronLeft, Map, ExternalLink, Shield, AlertTriangle, Play, CloudSun, Cloud, CloudSnow, CloudRain, CloudLightning, Wind, Sun, AlertCircle, Info, Navigation, Fuel, Gauge, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { AnimatedText, AnimatedCount } from '../../AnimatedElements';
import { V2ExpandableCard } from '../../V2ExpandableCard';
import InteractiveRoutePreview from './InteractiveRoutePreview';
import ShowsView from './ShowsView';
import CoOpRouteStagingView from './CoOpRouteStagingView';
import TourNotesView from './TourNotesView';
import TourNotesCard from './TourNotesCard';
import BlackBookView from './BlackBookView';
import GuestlistsView from './GuestlistsView';
import SetlistsView from './SetlistsView';
import FlightTrackerModal from './FlightTrackerModal';
import TourChecklistView from './TourChecklistView';
import OnRouteEssentialsView from './OnRouteEssentialsView';
import TourManagerPackageModule from './TourManagerPackageModule';
import CreativesHubView from './CreativesHubView';

export default function EventsWorkspace(props: any) {
  const {
    activeBand,
    activeDriver,
    activeEventsSection,
    activeShowDisplay,
    addLog,
    busCallTime,
    calculateHaversineDistance,
    checkedPreDriveItems,
    checklistBank,
    checklistItems,
    commitFlightMutation,
    concertBg,
    countdownString,
    currentCoords,
    currentOrNextShow,
    customMpg,
    customNavDestination,
    dashboardV2ActiveNav,
    driveHoursElapsed,
    encodeURIComponent,
    fetchLocalWeather,
    filteredNotes,
    filteredSales,
    filteredShows,
    flights,
    fuelPrice,
    getShowCoordinates,
    getShowWeatherAndWarnings,
    handleDeleteNote,
    handleUpdateNote,
    handleUpdateOffer,
    isCritical,
    isDriverRotationExpanded,
    isEditingBusCall,
    isFuelCalculatorExpanded,
    isInteractiveMapExpanded,
    isOfflineSimActive,
    isOnline,
    isPreDriveChecklistExpanded,
    isTime24Hour,
    isWaypointsExpanded,
    localWeather,
    lockupTime,
    newWaypointName,
    newWaypointType,
    offers,
    onRouteVenueAddress,
    renderTime,
    selectedGuestlistShowId,
    setActiveDriver,
    setActiveEventsSection,
    setActiveTab,
    setAutoExpandShowId,
    setBusCallTime,
    setCheckedPreDriveItems,
    setChecklistBank,
    setChecklistItems,
    setCustomMpg,
    setCustomNavDestination,
    setDashboardV2ActiveNav,
    setDriveHoursElapsed,
    setFlights,
    setFuelPrice,
    setIsDriverRotationExpanded,
    setIsEditingBusCall,
    setIsFuelCalculatorExpanded,
    setIsInteractiveMapExpanded,
    setIsModalOpen,
    setIsOfflineSimActive,
    setIsPreDriveChecklistExpanded,
    setIsTime24Hour,
    setIsWaypointsExpanded,
    setLockupTime,
    setModalType,
    setNewWaypointName,
    setNewWaypointType,
    setSelectedGuestlistShowId,
    setShows,
    setTempBusCallTime,
    setTempLockupTime,
    setUserProfile,
    setVehicleType,
    setVenues,
    setWaypoints,
    showSpecificNotes,
    shows,
    sortedShows,
    tempBusCallTime,
    tempLockupTime,
    totalTableStock,
    totalVanStock,
    triggerNotification,
    undefined,
    userProfile,
    userReviews,
    vehicleType,
    venues,
    waypoints,
    weatherError,
    weatherLoading,
  } = props;

  const isTourManager = props.userProfile?.band_role_mode === 'tour_manager' || props.userProfile?.role?.toLowerCase() === 'tour manager';
  const [showSingleBandCountdownInTM, setShowSingleBandCountdownInTM] = useState(false);

  return (
    <div className="flex flex-col gap-0">
                    
                    {/* Band Name & Connection State Bar under main nav bar */}
                    <div className="w-full px-6 py-[6px] bg-[#090b0e] border-b border-zinc-900 flex flex-row items-center justify-between gap-4 select-none shrink-0">
                      {/* Left side: Band Name or Tour Manager Identity */}
                      {(() => {
                        const displayTitle = isTourManager 
                          ? (props.userProfile?.full_name || props.userProfile?.legal_name || props.userProfile?.name || 'MIGUEL GOREGRINDER MEDINA')
                          : (activeBand?.name || 'Artist');
                        
                        return (
                          <div className="flex-1 overflow-hidden flex items-center gap-3">
                            <div className="relative max-w-xl group overflow-hidden">
                              <div className="overflow-hidden whitespace-nowrap">
                                <span 
                                  className={`inline-block text-[18px] sm:text-[20px] font-black tracking-tight uppercase select-text ${isTourManager ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]' : 'text-[#39ff14]'}`} 
                                  style={{
                                    display: 'inline-block',
                                    animation: displayTitle.length > 22 ? 'marquee 12s linear infinite' : 'none',
                                    paddingRight: displayTitle.length > 22 ? '2rem' : '0'
                                  }}
                                >
                                  {isTourManager ? `TM: ${displayTitle}` : displayTitle}
                                </span>
                              </div>
                            </div>

                            {/* Context & Active Identity Badge */}
                            {isTourManager ? (
                              <div className="hidden sm:flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                                  <Compass className="w-3 h-3 text-amber-400" />
                                  Executive Suite
                                </span>
                                {activeBand?.name && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-zinc-400 text-[9.5px] font-mono uppercase">
                                    <span className="text-zinc-500">Client / Roster:</span> <strong className="text-amber-300/90">{activeBand.name}</strong>
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {props.userProfile?.role || 'Band Member'}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Right side: Text based Live Cloud Sync / Simulate Offline button */}
                      <div className="flex items-center shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsOfflineSimActive(prev => {
                              const next = !prev;
                              if (next) {
                                triggerNotification?.('⚠️ Local Buffer Mode Active. Simulated network disconnect.');
                                addLog?.('Switched to simulated local offline cache buffer.');
                              } else {
                                triggerNotification?.('🟢 Back Online. Cloud databases fully synchronized!');
                                addLog?.('Switched to simulated cloud synced mode.');
                              }
                              return next;
                            });
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[8.5px] font-bold uppercase tracking-wider font-mono cursor-pointer transition-all ${
                            (isOfflineSimActive || !isOnline)
                              ? 'bg-amber-950/40 border-amber-900 text-amber-500 hover:bg-amber-950/60 animate-pulse'
                              : 'bg-[#0a3a2e]/40 border-emerald-900 text-emerald-400 hover:bg-[#0a3a2e]/60'
                          }`}
                          title="Click to toggle offline mode simulation"
                        >
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />
                          <span>{(isOfflineSimActive || !isOnline) ? "SIMULATE OFFLINE" : "LIVE CLOUD SYNC"}</span>
                        </button>
                      </div>
                    </div>

                    {/* TOUR MANAGER MODE MODULE OR SINGLE BAND COUNTDOWN */}
                    {isTourManager && !showSingleBandCountdownInTM ? (
                      <div className="p-4" id="tm-tour-package-planning-module">
                        <TourManagerPackageModule
                          userProfile={props.userProfile}
                          activeBand={activeBand}
                          triggerNotification={triggerNotification}
                          addLog={addLog}
                          onSwitchToSingleBandView={() => setShowSingleBandCountdownInTM(true)}
                        />
                      </div>
                    ) : (
                    <div className="p-4">
                      {isTourManager && (
                        <div className="mb-2 flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                          <span className="text-[10px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-amber-400" />
                            Viewing Single Band Countdown View
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowSingleBandCountdownInTM(false)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[9.5px] uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            ← Return to Tour Package Planner
                          </button>
                        </div>
                      )}
                      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#13161d] p-5 shadow-lg group">
                        {/* Background Image */}
                        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 mix-blend-luminosity pointer-events-none" style={{
        backgroundImage: `url(${concertBg})`
      }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#13161d]/95 via-[#13161d]/85 to-[#13161d]/30 pointer-events-none" />

                        <div className="relative z-10 space-y-4">
                          <div className="flex justify-between items-start text-left">
                            <div>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block">NEXT STOP VENUE</span>
                              <h3 className="text-lg font-display font-black text-white drop-shadow-md tracking-tight uppercase leading-snug">
                                {activeShowDisplay}
                              </h3>
                              {currentOrNextShow && <span className="text-[10px] text-[#00ffcc] font-mono font-bold tracking-wider block mt-0.5">
                                  {new Date(currentOrNextShow.date).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
                                </span>}
                            </div>
                            <span className="bg-[#181a21]/90 backdrop-blur-sm border border-zinc-700 text-zinc-300 text-[8.5px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase whitespace-nowrap">
                              {currentOrNextShow ? 'ACTIVE SHOW' : 'NO ACTIVE SHOW'}
                            </span>
                          </div>

                          {/* Countdown Pill Box */}
                          <div className="bg-[#141111] border border-[#2e3444]/40 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-inner">
                            <span className="text-[8px] font-mono text-zinc-455 uppercase tracking-widest block mb-0.5 font-bold">EST. SHOWTIME COUNTDOWN</span>
                            <span className="text-xs font-mono font-black text-[#00ffcc] tracking-wider animate-pulse flex items-center gap-1.5 justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-ping inline-block" />
                              {countdownString}
                            </span>
                          </div>

                          {/* Bus Call Times Section */}
                          <div className="bg-[#141111] border border-zinc-800 rounded-xl p-3 px-4.5 text-left shadow-lg">
                            {isEditingBusCall ? <div className="space-y-3 py-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-[7.5px] font-mono text-purple-300 uppercase block font-black">EDIT TIMINGS</span>
                                  <button type="button" onClick={() => {
                const next = !isTime24Hour;
                setIsTime24Hour(next);
                localStorage.setItem('tour_time_is_24h', String(next));
              }} className="text-[8px] font-mono font-bold text-purple-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 hover:bg-zinc-800">
                                    Use {isTime24Hour ? "12h" : "24h"} format
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-mono text-zinc-400 block uppercase font-bold">Bus Call:</label>
                                    <input type="time" value={tempBusCallTime} onChange={e => setTempBusCallTime(e.target.value)} className="w-full bg-[#1c1829] border border-zinc-850 rounded px-2 py-1 text-[11px] text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500" />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-mono text-zinc-400 block uppercase font-bold">Lockup / Load-out:</label>
                                    <input type="time" value={tempLockupTime} onChange={e => setTempLockupTime(e.target.value)} className="w-full bg-[#1c1829] border border-zinc-850 rounded px-2 py-1 text-[11px] text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500" />
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-1.5 border-t border-zinc-900">
                                  <button type="button" onClick={() => setIsEditingBusCall(false)} className="text-[8.5px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-850 transition-all flex items-center gap-1 cursor-pointer">
                                    <X className="w-3 h-3" /> Cancel
                                  </button>
                                  <button type="button" onClick={() => {
                setBusCallTime(tempBusCallTime);
                setLockupTime(tempLockupTime);
                localStorage.setItem('tour_bus_call_time', tempBusCallTime);
                localStorage.setItem('tour_lockup_time', tempLockupTime);
                setIsEditingBusCall(false);
              }} className="text-[8.5px] font-mono text-[#00ffcc] hover:text-[#00ffcc]/80 bg-purple-950/80 px-2.5 py-1 rounded border border-purple-800 transition-all flex items-center gap-1 cursor-pointer">
                                    <Check className="w-3 h-3" /> Save
                                  </button>
                                </div>
                              </div> : <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-2">
                                  <Coffee className="w-4 h-4 text-purple-400 animate-pulse" />
                                  <div className="text-left leading-tight">
                                    <span className="text-[7.5px] font-mono text-purple-300 uppercase block font-black">BUS CALL LOAD-OUT</span>
                                    <span className="text-[10px] text-zinc-200 font-sans font-semibold">
                                      {renderTime(busCallTime)} Sharp Tonight
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[8.5px] font-mono font-bold text-purple-400 bg-purple-950/45 px-2 py-0.5 rounded border border-purple-900/30">
                                    Lockup call at {renderTime(lockupTime)}
                                  </span>
                                  
                                  <div className="flex items-center gap-1 pl-1">
                                    <button type="button" onClick={() => {
                  const nextVal = !isTime24Hour;
                  setIsTime24Hour(nextVal);
                  localStorage.setItem('tour_time_is_24h', String(nextVal));
                }} title={`Switch to ${isTime24Hour ? "12" : "24"} hour format`} className="text-[8px] font-mono font-bold text-zinc-400 hover:text-[#00ffcc] bg-zinc-900/30 hover:bg-zinc-800/55 px-1.5 py-0.5 rounded transition-all border border-zinc-800/40">
                                      {isTime24Hour ? "24H" : "12H"}
                                    </button>
                                    
                                    <button type="button" onClick={() => {
                  setTempBusCallTime(busCallTime);
                  setTempLockupTime(lockupTime);
                  setIsEditingBusCall(true);
                }} title="Edit Bus Call & Lockup Times" className="text-zinc-500 hover:text-[#00ffcc] hover:bg-zinc-800/40 transition-all p-1 rounded font-mono">
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>}
                          </div>

                          {/* Table Merchandise Stock Progress */}
                          <div className="bg-[#1c2230]/75 border border-[#00ffcc]/30 rounded-xl p-3.5 mt-2 flex flex-col gap-2 cursor-pointer hover:border-[#00ffcc]/65 transition-all shadow-lg" onClick={() => {
          setActiveTab('inventory');
          triggerNotification('Opening full Merch Inventory...');
        }}>
                            <div className="flex justify-between text-xs items-start">
                              <span className="text-zinc-300 font-sans flex items-center gap-2 font-semibold">
                                <Table className="w-4 h-4 text-[#00ffcc]" />
                                Table Stock (Active Merch Area)
                              </span>
                              <span className={`font-mono text-xs font-bold text-right flex flex-col items-end ${isCritical ? 'text-amber-400' : 'text-emerald-400'}`}>
                                <span>{Math.round(totalTableStock / (totalTableStock + totalVanStock || 1) * 100)}%</span>
                                <span className="text-[8.5px] text-zinc-500 font-normal mt-0.5 leading-none">({totalTableStock} pcs)</span>
                              </span>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-amber-500 animate-pulse' : 'bg-[#00ffcc]'}`} style={{
              width: `${Math.round(totalTableStock / (totalTableStock + totalVanStock || 1) * 100)}%`
            }}></div>
                            </div>
                            {isCritical ? <div className="text-[8.5px] font-mono text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5 bg-amber-500/10 p-1.5 rounded border border-amber-500/20">
                                <AlertTriangle className="w-3 h-3" />
                                WARNING: CRITICAL TABLE INVENTORY LEVELS
                              </div> : <p className="text-[8.5px] text-zinc-500 font-mono mt-0.5">Stock currently displayed on tables and ready for purchase.</p>}
                          </div>
                          
                          {/* Show specific notes panel (if any) */}
                          {showSpecificNotes.length > 0 && <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 space-y-1.5 text-left">
                              <span className="text-[8.5px] font-mono text-amber-500 uppercase tracking-widest font-black flex items-center gap-1 leading-none">
                                <FileText className="w-3 h-3 shrink-0" />
                                SHOW NOTES / DIRECTIVES ({showSpecificNotes.length})
                              </span>
                              <div className="space-y-1">
                                {showSpecificNotes.slice(0, 2).map((note, nIdx) => <div key={note.id ? `note-${note.id}-${nIdx}` : `note-${nIdx}`} className="text-[10.5px] text-zinc-300 font-sans leading-normal border-l-2 border-amber-500 pl-2">
                                    {note.text}
                                  </div>)}
                              </div>
                            </div>}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* V2 Tour Notes Card */}
                    <div className="bg-black pb-2">
                      {props.renderTourNotesCard ? props.renderTourNotesCard() : <TourNotesCard {...props} />}
                    </div>

                    {/* ALWAYS VISIBLE INTERACTIVE MAP */}
                    <div className="px-5 py-2.5 bg-black" id="events-workspace-always-visible-map">
                      <ShowsView shows={filteredShows} setShows={setShows} sales={filteredSales} triggerNotification={triggerNotification} addLog={addLog} setModalType={setModalType} setIsModalOpen={setIsModalOpen} onBack={() => {}} hideBackButton={true} onlyMap={true} disableScrollToTop={true} activeBandId={props.activeBandId || activeBand?.id} bandName={activeBand?.name} />
                    </div>

                    
                    {/* CLUSTER: MASTER PLANNING & SCHEDULING */}
                    <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/40 via-black to-black border-l-4 border-emerald-500 mt-6 mb-2 rounded-r-md">
                      <h3 className="text-xs font-display font-black text-emerald-400 uppercase tracking-widest">Master Planning & Schedules</h3>
                    </div>
                    <V2ExpandableCard 
                      theme="green" 
                      title={props.activeClearanceLevel === 1 ? "🔒 [Level 2+ Req] Shows & Tour Planner" : "Shows & Tour Planner"} 
                      isExpanded={props.activeClearanceLevel !== 1 && activeEventsSection === 'PLANNER'} 
                      onToggle={() => {
                        if (props.activeClearanceLevel === 1) {
                          triggerNotification?.("🚫 Access Denied: Shows & Tour Planner is restricted for Security Clearance Level 1.");
                          return;
                        }
                        setActiveEventsSection(activeEventsSection === 'PLANNER' ? null : 'PLANNER');
                      }}
                    >
                      <div className="w-full">
                        <ShowsView shows={filteredShows} setShows={setShows} sales={filteredSales} triggerNotification={triggerNotification} addLog={addLog} setModalType={setModalType} setIsModalOpen={setIsModalOpen} onBack={() => {}} hideBackButton={true} hideMap={true} disableScrollToTop={true} activeBandId={props.activeBandId || activeBand?.id} bandName={activeBand?.name} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard 
                      theme="green" 
                      title={props.activeClearanceLevel === 1 ? "🔒 [Level 2+ Req] Multi-Band Tour Planner" : "Multi-Band Tour Planner"} 
                      isExpanded={props.activeClearanceLevel !== 1 && activeEventsSection === 'COOP_PLANNER'} 
                      onToggle={() => {
                        if (props.activeClearanceLevel === 1) {
                          triggerNotification?.("🚫 Access Denied: Multi-Band Tour Planner is restricted for Security Clearance Level 1.");
                          return;
                        }
                        setActiveEventsSection(activeEventsSection === 'COOP_PLANNER' ? null : 'COOP_PLANNER');
                      }}
                    >
                      <div className="w-full">
                        <CoOpRouteStagingView onBack={() => setActiveEventsSection(null)} addLog={addLog} triggerNotification={triggerNotification} activeBandName={activeBand?.name || 'Artist'} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="green" title="Upcoming Show Calendar" isExpanded={activeEventsSection === 'CALENDAR'} onToggle={() => setActiveEventsSection(activeEventsSection === 'CALENDAR' ? null : 'CALENDAR')}>
                      <div className="bg-[#0e1014] border-t border-zinc-900 p-4 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-900 relative z-10">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse shadow-[0_0_8px_#00ffcc]" />
                            <span className="text-[10px] font-mono uppercase text-[#00ffcc] font-black tracking-widest flex items-center gap-1">
                              ACTIVE CALENDAR STOPS
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button type="button" onClick={() => {
            setModalType('show');
            setIsModalOpen(true);
          }} className="p-1 hover:bg-[#00ffcc]/10 text-[#00ffcc] rounded-md transition-colors cursor-pointer" title="Add Show Leg">
                              <Plus className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setDashboardV2ActiveNav('EVENTS')} className="text-[10.5px] font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer">
                              Total Shows: {shows.length}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 text-left relative z-10">
                          {Array.from({
          length: 3
        }).map((_, index) => {
          const show = sortedShows[index];
          if (show) {
            const {
              month,
              day,
              weekday
            } = (() => {
              try {
                const d = new Date(show.date + 'T00:00:00');
                if (isNaN(d.getTime())) {
                  return {
                    month: 'TBD',
                    day: '??',
                    weekday: ''
                  };
                }
                return {
                  month: d.toLocaleDateString('en-US', {
                    month: 'short'
                  }).toUpperCase(),
                  day: d.toLocaleDateString('en-US', {
                    day: 'numeric'
                  }),
                  weekday: d.toLocaleDateString('en-US', {
                    weekday: 'short'
                  })
                };
              } catch (e) {
                return {
                  month: 'TBD',
                  day: '??',
                  weekday: ''
                };
              }
            })();
            const isActive = currentOrNextShow?.id === show.id;
            const stId = (show.show_type || '').toLowerCase();
            const isFestival = !!show.festival_name || stId.includes('festival') || stId.includes('fest');
            const isHeadline = stId.includes('headliner') || !isFestival && !stId.includes('support');
            const isSupport = stId.includes('support');
            const colorTheme = (() => {
              if (isFestival) {
                return {
                  borderClass: isActive ? 'border-emerald-500/40' : 'border-emerald-500/20 hover:border-emerald-500/40',
                  badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                  dateBadgeClass: isActive ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-950/40 border-emerald-900/60 text-emerald-400',
                  label: 'Festival Set',
                  dotColor: 'bg-emerald-400'
                };
              } else if (isSupport) {
                return {
                  borderClass: isActive ? 'border-amber-500/40' : 'border-amber-500/20 hover:border-amber-500/40',
                  badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                  dateBadgeClass: isActive ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-950/40 border-emerald-900/60 text-amber-400',
                  label: 'Support Set',
                  dotColor: 'bg-amber-400'
                };
              } else {
                return {
                  borderClass: isActive ? 'border-purple-500/40' : 'border-purple-500/20 hover:border-purple-500/40',
                  badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
                  dateBadgeClass: isActive ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-purple-950/40 border-purple-900/60 text-purple-400',
                  label: 'Headline Set',
                  dotColor: 'bg-purple-400'
                };
              }
            })();
            return <div key={show.id ? `cal-show-${show.id}-${index}` : `cal-show-${index}`} onClick={() => {
              setSelectedGuestlistShowId(show.id);
              setAutoExpandShowId(show.id);
              setActiveTab('shows');
              triggerNotification(`Focus stop: ${show.festival_name || show.name}`);
            }} className={`p-3 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer select-none border group hover:translate-x-0.5 hover:shadow-md ${isActive ? 'border-[#00ffd0]/40 shadow-sm shadow-[#00ffd0]/5 ring-1 ring-[#00ffd0]/20' : `${colorTheme.borderClass}`}`} style={{
              backgroundColor: '#111111'
            }}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-11 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 leading-none transition-all border font-mono ${colorTheme.dateBadgeClass}`}>
                                      <span className="text-[7.5px] font-black tracking-widest uppercase">{month}</span>
                                      <span className="text-sm font-display font-black mt-1 leading-none">{day}</span>
                                    </div>

                                    <div className="min-w-0 space-y-0.5">
                                      <h4 className="text-[11.5px] font-bold text-white tracking-wide truncate group-hover:text-[#00ffcc] transition-colors">
                                        {show.festival_name || show.name}
                                      </h4>
                                      <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-zinc-400 leading-none">
                                        <span className="text-[#00ffd0] font-semibold">{weekday}</span>
                                        <span className="text-zinc-600">•</span>
                                        {show.city ? <span className="truncate max-w-[125px] flex items-center gap-0.5 hover:text-zinc-300 transition-colors">
                                            <MapPin className="w-2.5 h-2.5 shrink-0 text-zinc-500" /> {show.city}{show.state_province ? `, ${show.state_province}` : ''}{show.country ? ` (${show.country})` : ''}
                                          </span> : <span className="truncate max-w-[125px]">{show.festival_name ? show.name : 'Headline Set'}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                                    {isActive ? <span className="text-[7px] font-mono font-black tracking-widest bg-emerald-500/15 text-[#00ffd0] border border-emerald-500/35 px-1.5 py-0.5 rounded uppercase leading-none animate-pulse">
                                        ACTIVE
                                      </span> : <span className={`text-[7px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded border ${colorTheme.badgeClass}`}>
                                        {colorTheme.label}
                                      </span>}
                                    
                                    {show.revenue ? <span className="text-[10px] text-[#00ffcc] font-mono font-bold mt-0.5">${show.revenue.toLocaleString()}</span> : <span className="text-[8.5px] font-mono text-zinc-500 tracking-wider">PLANNING</span>}
                                  </div>
                                </div>;
          } else {
            return <div key={`empty-tour-stop-${index}`} onClick={() => {
              setModalType('show');
              setIsModalOpen(true);
            }} className="p-3 bg-zinc-950/20 hover:bg-zinc-950/45 border border-dashed border-zinc-800 hover:border-teal-500/30 rounded-xl flex items-center justify-between opacity-50 hover:opacity-100 transition-all cursor-pointer group">
                                  <div className="flex items-center gap-3">
                                    <div className="w-11 h-12 rounded-lg border border-dashed border-zinc-805 flex items-center justify-center shrink-0 text-zinc-650 group-hover:text-[#00ffcc] group-hover:border-[#00ffcc]/30 bg-[#0e1015] font-mono text-xs">
                                      +
                                    </div>
                                    <div className="text-left">
                                      <h4 className="text-[10.5px] font-bold text-zinc-500 group-hover:text-zinc-350 font-display">OPEN TOUR STOP</h4>
                                      <span className="text-[8.5px] font-mono text-zinc-600 block mt-0.5">Click to register show slot</span>
                                    </div>
                                  </div>
                                  <Plus className="w-3.5 h-3.5 text-zinc-700 group-hover:text-[#00ffcc] group-hover:translate-x-0.5 transition-all" />
                                </div>;
          }
        })}
                        </div>
                      </div>
                    </V2ExpandableCard>

                    {/* CLUSTER: TRANSIT & DAY-OF-SHOW */}
                    <div className="px-5 py-4 bg-gradient-to-r from-zinc-800/50 via-[#0d0d0d] to-black border-l-4 border-zinc-500 mt-6 mb-2 rounded-r-md">
                      <h3 className="text-xs font-display font-black text-zinc-300 uppercase tracking-widest">Transit & Day-Of-Show</h3>
                    </div>
                    <V2ExpandableCard theme="darkgrey" title="Driving Directions" isExpanded={activeEventsSection === 'DRIVING'} onToggle={() => setActiveEventsSection(activeEventsSection === 'DRIVING' ? null : 'DRIVING')}>
                      <div className="bg-[#0c0d12] border-t border-zinc-900 p-6 space-y-4">
                        {(() => {
        const nameLength = currentOrNextShow ? (currentOrNextShow.festival_name || currentOrNextShow.name).length : 20;
        const defaultMockDistance = nameLength * 11 + 42;
        let distanceMiles = defaultMockDistance;
        let distanceKm = Math.round(defaultMockDistance * 1.60934);
        if (currentOrNextShow) {
          const targetCoords = getShowCoordinates(currentOrNextShow);
          if (currentCoords) {
            const dist = calculateHaversineDistance(currentCoords.latitude, currentCoords.longitude, targetCoords.lat, targetCoords.lng);
            distanceMiles = dist.miles;
            distanceKm = dist.km;
          }
        }
        const distanceVal = distanceMiles;
        const fromCity = localWeather?.cityName ? localWeather.cityName.split(',')[0].trim() : "My GPS Coords";
        const toCity = currentOrNextShow?.city || currentOrNextShow?.name || "Next Venue";
        const travelFullRoute = currentOrNextShow ? `${fromCity} ➔ ${toCity}` : "Standard Route";
        const driveHours = Math.floor(distanceVal / 50);
        const driveMins = Math.floor(distanceVal % 50 / 50 * 60);
        const travelMapRoute = nameLength % 3 === 0 ? 'via Interstate 90 W' : nameLength % 3 === 1 ? 'via Route 101 S' : 'via County Bypass-2';
        return <div className="space-y-4 text-left font-sans">
                              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest block font-black">LOGISTICS ENGINE</span>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">ROUTE DESTINATION VENUE / CITY:</label>
                                <div className="flex gap-2">
                                  <input type="text" placeholder={currentOrNextShow ? `e.g. Override default destination...` : "Enter custom destination or city name..."} value={customNavDestination} onChange={e => setCustomNavDestination(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/50 transition-all font-sans" />
                                  {customNavDestination && <button type="button" onClick={() => setCustomNavDestination("")} className="text-xs font-mono uppercase bg-zinc-900 border border-zinc-800 px-4 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer flex items-center justify-center shrink-0">
                                      Clear
                                    </button>}
                                </div>
                              </div>

                              {currentOrNextShow && !customNavDestination.trim() ? <div className="space-y-4">
                                  <div className="flex items-center gap-3 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900">
                                    <Truck className="w-6 h-6 text-[#00ffcc] shrink-0 animate-pulse" />
                                    <div className="leading-tight">
                                      <span className="text-lg text-white font-mono font-bold block">{distanceMiles} mi / {distanceKm} km</span>
                                      <p className="text-xs text-[#00ffcc] font-sans font-medium">{driveHours > 0 ? `${driveHours}h ` : ''}{driveMins}m estimated remaining drive</p>
                                    </div>
                                  </div>
                                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-1">
                                    <p className="text-xs text-zinc-300 font-sans truncate font-semibold" title={travelFullRoute}>
                                      Route: <span className="text-white">{travelFullRoute}</span>
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-mono tracking-tight truncate">{travelMapRoute}</p>
                                  </div>
                                </div> : <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 text-zinc-400 font-mono text-xs space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Compass className="w-5 h-5 text-[#00ffcc]" />
                                    <span className="font-bold text-zinc-200">
                                      {customNavDestination.trim() ? "Custom Set Route" : "No Active Tour (Standby)"}
                                    </span>
                                  </div>
                                  <p className="text-zinc-500 text-[11px] font-sans leading-relaxed">
                                    {customNavDestination.trim() ? `Ready to navigate to custom location: "${customNavDestination}"` : "Ready for incoming automated tour itineraries or custom waypoint navigation routes."}
                                  </p>
                                </div>}

                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <a href={customNavDestination.trim() ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customNavDestination)}` : currentOrNextShow ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([currentOrNextShow.venue_address, currentOrNextShow.city, currentOrNextShow.state_province, currentOrNextShow.country].filter(Boolean).join(', ') || currentOrNextShow.name)}` : "https://www.google.com/maps/search/?api=1&query=music+venues"} target="_blank" referrerPolicy="no-referrer" className="flex-1 text-xs font-mono font-black tracking-wider text-[#00ffcc] hover:text-[#00ffd0] bg-[#00ffcc]/5 hover:bg-[#00ffcc]/15 border border-[#00ffd0]/25 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 outline-none no-underline cursor-pointer">
                                  <span>Google Directions</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-[#00ffcc]" />
                                </a>
                                <a href={customNavDestination.trim() ? `https://maps.apple.com/?daddr=${encodeURIComponent(customNavDestination)}` : currentOrNextShow ? `https://maps.apple.com/?daddr=${encodeURIComponent([currentOrNextShow.venue_address, currentOrNextShow.city, currentOrNextShow.state_province, currentOrNextShow.country].filter(Boolean).join(', ') || currentOrNextShow.name)}` : "https://maps.apple.com/?q=music+venues"} target="_blank" referrerPolicy="no-referrer" className="flex-1 text-xs font-mono font-black tracking-wider text-purple-300 hover:text-purple-200 bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/25 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 outline-none no-underline cursor-pointer">
                                  <span>Apple Directions</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
                                </a>
                              </div>

                              {/* SUB-SECTIONS DECK (COLLAPSED BY DEFAULT) */}
                              <div className="pt-4 border-t border-zinc-900 space-y-3">
                                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">// PRE-DRIVE & TRANSIT ESSENTIALS //</p>

                                {/* SUB-SECTION 0: EMBEDDED INTERACTIVE ROUTE MAP */}
                                <div className="border border-zinc-900 bg-zinc-950/30 rounded-xl overflow-hidden">
                                  <button type="button" onClick={() => setIsInteractiveMapExpanded(!isInteractiveMapExpanded)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/40 transition-colors text-left">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-[#00ffcc]" />
                                      <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wide">🗺️ Live Interactive Route Preview</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300">
                                      {isInteractiveMapExpanded ? '[ DEFLATE － ]' : '[ EXPAND ＋ ]'}
                                    </span>
                                  </button>

                                  {isInteractiveMapExpanded && <div className="p-3.5 bg-zinc-950/70">
                                      <InteractiveRoutePreview destination={customNavDestination.trim() ? customNavDestination : currentOrNextShow ? [currentOrNextShow.venue_address, currentOrNextShow.city, currentOrNextShow.state_province, currentOrNextShow.country].filter(Boolean).join(', ') || currentOrNextShow.name : "music venues"} />
                                    </div>}
                                </div>

                                {/* SUB-SECTION 1: REST STOPS & WAYPOINTS */}
                                <div className="border border-zinc-900 bg-zinc-950/30 rounded-xl overflow-hidden">
                                  <button type="button" onClick={() => setIsWaypointsExpanded(!isWaypointsExpanded)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/40 transition-colors text-left">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-emerald-400" />
                                      <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wide">📍 Rest Stops & Waypoints</span>
                                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-bold">
                                        {waypoints.length} stops
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300">
                                      {isWaypointsExpanded ? '[ DEFLATE － ]' : '[ EXPAND ＋ ]'}
                                    </span>
                                  </button>

                                  {isWaypointsExpanded && <div className="p-3.5 bg-zinc-950/70 border-t border-zinc-900/60 space-y-3">
                                      {/* Add Stop Form */}
                                      <div className="space-y-2 bg-black/40 p-2.5 rounded-lg border border-zinc-900">
                                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Add Route Waypoint:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <input type="text" placeholder="e.g. Love's / Rest Area / Diner..." value={newWaypointName} onChange={e => setNewWaypointName(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/30" />
                                          <div className="flex gap-1.5">
                                            <select value={newWaypointType} onChange={e => setNewWaypointType(e.target.value)} className="bg-zinc-950 border border-zinc-900 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none">
                                              <option value="Rest Stop">Rest Stop</option>
                                              <option value="Gas Station">Gas Station</option>
                                              <option value="Food">Food</option>
                                              <option value="Hotel">Hotel</option>
                                              <option value="Scenic">Scenic</option>
                                            </select>
                                            <button type="button" onClick={() => {
                        if (!newWaypointName.trim()) {
                          triggerNotification('Please enter a waypoint name');
                          return;
                        }
                        const estimateDistance = `${Math.floor(Math.random() * 80) + 10} mi`;
                        const newWp = {
                          id: `wp-${Date.now()}`,
                          name: newWaypointName.trim(),
                          type: newWaypointType,
                          distance: estimateDistance
                        };
                        setWaypoints([...waypoints, newWp]);
                        setNewWaypointName('');
                        triggerNotification(`Added waypoint: ${newWp.name}`);
                      }} className="bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 text-[#00ffcc] border border-[#00ffcc]/30 px-3 py-1.5 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer">
                                              Add
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Waypoint List */}
                                      <div className="space-y-1.5">
                                        {waypoints.length === 0 ? <p className="text-zinc-600 font-mono text-center py-2 text-[10px] italic">No custom stops planned yet.</p> : waypoints.map((wp, idx) => <div key={wp.id ? `wp-${wp.id}-${idx}` : `wp-${idx}`} className="flex items-center justify-between p-2 bg-black/20 border border-zinc-900 rounded-lg text-xs">
                                              <div className="flex items-center gap-2.5">
                                                <span className="w-5 h-5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-500 flex items-center justify-center font-bold">
                                                  {idx + 1}
                                                </span>
                                                <div>
                                                  <span className="text-zinc-200 font-medium font-sans">{wp.name}</span>
                                                  <div className="flex gap-1.5 mt-0.5">
                                                    <span className="text-[8px] font-mono uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-500 px-1 rounded">
                                                      {wp.type}
                                                    </span>
                                                    <span className="text-[8px] font-mono text-zinc-500">Est: {wp.distance}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <button type="button" onClick={() => {
                      setWaypoints(waypoints.filter(item => item.id !== wp.id));
                      triggerNotification(`Removed waypoint: ${wp.name}`);
                    }} className="text-zinc-650 hover:text-rose-400 p-1 rounded hover:bg-zinc-900 transition-colors cursor-pointer" title="Delete waypoint">
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>)}
                                      </div>
                                    </div>}
                                </div>

                                {/* SUB-SECTION 2: FUEL EXPENSE BUDGET ESTIMATOR */}
                                <div className="border border-zinc-900 bg-zinc-950/30 rounded-xl overflow-hidden">
                                  <button type="button" onClick={() => setIsFuelCalculatorExpanded(!isFuelCalculatorExpanded)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/40 transition-colors text-left">
                                    <div className="flex items-center gap-2">
                                      <Fuel className="w-4 h-4 text-amber-400" />
                                      <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wide">⛽ Fuel Budget</span>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300">
                                      {isFuelCalculatorExpanded ? '[ DEFLATE － ]' : '[ EXPAND ＋ ]'}
                                    </span>
                                  </button>

                                  {isFuelCalculatorExpanded && <div className="p-3.5 bg-zinc-950/70 border-t border-zinc-900/60 space-y-3">
                                      {(() => {
                                        const mpgVal = Math.max(parseFloat(customMpg) || 12, 1);
                                        const priceVal = Math.max(parseFloat(fuelPrice) || 3.89, 0.1);
                                        const gallonsNeeded = distanceMiles / mpgVal;
                                        const estCost = gallonsNeeded * priceVal;
                                        const guarantee = currentOrNextShow?.guarantee_amount ?? 1000;
                                        const netProfit = guarantee - estCost;

                                        return (
                                          <>
                                            <div className="grid grid-cols-2 gap-2 mb-3">
                                              {/* Cell 1: Vehicle Profile Dropdown */}
                                              <select
                                                value={vehicleType}
                                                onChange={e => {
                                                  const type = e.target.value as 'van' | 'bus' | 'car';
                                                  setVehicleType(type);
                                                  if (type === 'van') setCustomMpg('12');
                                                  else if (type === 'bus') setCustomMpg('6');
                                                  else setCustomMpg('30');
                                                }}
                                                className="bg-zinc-950 border border-zinc-900 rounded p-2 text-xs text-zinc-100 focus:outline-none"
                                              >
                                                <option value="van">Tour Van (12 MPG)</option>
                                                <option value="bus">Tour Bus (6 MPG)</option>
                                                <option value="car">Support Sedan (30 MPG)</option>
                                              </select>

                                              {/* Cell 2: Fuel Price per Gallon input box */}
                                              <input
                                                type="number"
                                                step="0.01"
                                                value={fuelPrice}
                                                onChange={e => setFuelPrice(e.target.value)}
                                                placeholder="Fuel Price $/Gal"
                                                className="bg-zinc-950 border border-zinc-900 rounded p-2 text-xs text-zinc-100 focus:outline-none"
                                              />

                                              {/* Cell 3: Custom MPG Rating input box */}
                                              <input
                                                type="number"
                                                value={customMpg}
                                                onChange={e => setCustomMpg(e.target.value)}
                                                placeholder="MPG Rating"
                                                className="bg-zinc-950 border border-zinc-900 rounded p-2 text-xs text-zinc-100 focus:outline-none"
                                              />

                                              {/* Cell 4: Dynamic Mileage Capsule */}
                                              <div className="bg-zinc-900/60 border border-zinc-800 rounded p-2 text-xs font-mono text-center flex items-center justify-center text-cyan-400">
                                                {distanceMiles} mi (Mapped)
                                              </div>
                                            </div>

                                            {/* Bottom Financial Summary Box */}
                                            <div className="bg-zinc-950/40 border border-zinc-900 rounded p-2.5 text-xs space-y-1.5">
                                              <div className="flex justify-between items-center">
                                                <span className="text-zinc-400 font-sans">Fuel Expense:</span>
                                                <span className="font-mono text-zinc-300">${estCost.toFixed(2)} USD</span>
                                              </div>
                                              <div className="flex justify-between items-center border-t border-zinc-900/50 pt-1.5">
                                                <span className="text-zinc-400 font-sans">Gig Net Profit:</span>
                                                <span className="font-bold text-emerald-400 text-sm">${netProfit.toFixed(2)}</span>
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>}
                                </div>

                                {/* SUB-SECTION 3: PRE-DRIVE SAFETY CHECKLIST */}
                                <div className="border border-zinc-900 bg-zinc-950/30 rounded-xl overflow-hidden">
                                  <button type="button" onClick={() => setIsPreDriveChecklistExpanded(!isPreDriveChecklistExpanded)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/40 transition-colors text-left">
                                    <div className="flex items-center gap-2">
                                      <CheckSquare className="w-4 h-4 text-purple-400" />
                                      <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wide">🚐 Pre-Drive Vehicle Checklist</span>
                                      {(() => {
                    const checkedCount = Object.values(checkedPreDriveItems).filter(Boolean).length;
                    const totalCount = Object.keys(checkedPreDriveItems).length;
                    return <span className="text-[9px] font-mono px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-md font-bold">
                                            {checkedCount}/{totalCount}
                                          </span>;
                  })()}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300">
                                      {isPreDriveChecklistExpanded ? '[ DEFLATE － ]' : '[ EXPAND ＋ ]'}
                                    </span>
                                  </button>

                                  {isPreDriveChecklistExpanded && <div className="p-3.5 bg-zinc-950/70 border-t border-zinc-900/60 space-y-3">
                                      <p className="text-[9.5px] font-sans text-zinc-400 leading-normal">
                                        Safety check all mechanical and backline securing points before leaving the loading dock. Avoid highway debris or equipment shift hazards.
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {[{
                    key: 'tires',
                    label: 'Tire Pressure & Tread'
                  }, {
                    key: 'trailer',
                    label: 'Trailer Latch & Safety Chains'
                  }, {
                    key: 'instruments',
                    label: 'Backline Secure in Road cases'
                  }, {
                    key: 'merch',
                    label: 'Merchandise counts verified'
                  }, {
                    key: 'fluids',
                    label: 'Engine Oil & Washer Fluids'
                  }, {
                    key: 'gps',
                    label: 'GPS / Navigation Offline Sync'
                  }].map((item, idx) => <button key={`${item.key}-${idx}`} type="button" onClick={() => {
                    const updated = {
                      ...checkedPreDriveItems,
                      [item.key]: !checkedPreDriveItems[item.key]
                    };
                    setCheckedPreDriveItems(updated);
                    const checkedCount = Object.values(updated).filter(Boolean).length;
                    if (checkedCount === 6) {
                      triggerNotification('✅ ALL Pre-Drive Inspections Cleared! Safe travels!');
                    }
                  }} className="flex items-center gap-2.5 p-2 bg-black/35 hover:bg-black/60 border border-zinc-900 rounded-lg text-left transition-colors cursor-pointer text-xs">
                                            {checkedPreDriveItems[item.key] ? <CheckSquare className="w-4 h-4 text-[#00ffcc] shrink-0" /> : <Square className="w-4 h-4 text-zinc-700 shrink-0" />}
                                            <span className={checkedPreDriveItems[item.key] ? 'text-zinc-300' : 'text-zinc-550 line-through decoration-zinc-800'}>
                                              {item.label}
                                            </span>
                                          </button>)}
                                      </div>

                                      {/* Completeness Bar */}
                                      {(() => {
                  const checkedCount = Object.values(checkedPreDriveItems).filter(Boolean).length;
                  const pct = Math.round(checkedCount / 6 * 100);
                  return <div className="space-y-1">
                                            <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 uppercase font-black">
                                              <span>INSPECTION PREPARATION STATE</span>
                                              <span>{pct}% CLEARED</span>
                                            </div>
                                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                                              <div className="bg-gradient-to-r from-purple-500 to-[#00ffcc] h-full transition-all duration-500" style={{
                        width: `${pct}%`
                      }} />
                                            </div>
                                          </div>;
                })()}
                                    </div>}
                                </div>

                                {/* SUB-SECTION 4: SHIFT ROTATION & FATIGUE TRACKER */}
                                <div className="border border-zinc-900 bg-zinc-950/30 rounded-xl overflow-hidden">
                                  <button type="button" onClick={() => setIsDriverRotationExpanded(!isDriverRotationExpanded)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-900/40 transition-colors text-left">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-[#00ffcc]" />
                                      <span className="text-xs font-mono font-bold text-zinc-200 uppercase tracking-wide">👥 Driver Rotation & Fatigue Alert</span>
                                      {driveHoursElapsed >= 4 && <span className="text-[9px] font-mono px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded-md font-bold animate-pulse">
                                          FATIGUE WARNING
                                        </span>}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-300">
                                      {isDriverRotationExpanded ? '[ DEFLATE － ]' : '[ EXPAND ＋ ]'}
                                    </span>
                                  </button>

                                  {isDriverRotationExpanded && <div className="p-3.5 bg-zinc-950/70 border-t border-zinc-900/60 space-y-3.5">
                                      <div className="grid grid-cols-2 gap-3 text-left">
                                        <div className="space-y-1 text-left">
                                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Active Driver behind wheel:</label>
                                          <select value={activeDriver} onChange={e => {
                      setActiveDriver(e.target.value);
                      setDriveHoursElapsed(0);
                      triggerNotification(`Driver rotated: ${e.target.value} is now driving. Resetting fatigue monitor.`);
                    }} className="w-full bg-zinc-950 border border-zinc-900 rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none">
                                            <option value="Driver A (Guitarist)">Driver A (Guitarist)</option>
                                            <option value="Driver B (Bassist)">Driver B (Bassist)</option>
                                            <option value="Driver C (Vocalist)">Driver C (Vocalist)</option>
                                            <option value="Crew Member / TM">Crew Member / TM</option>
                                          </select>
                                        </div>

                                        <div className="space-y-1 text-left">
                                          <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider block font-bold">Current Shift Duration:</label>
                                          <div className="flex items-center gap-1.5">
                                            <button type="button" disabled={driveHoursElapsed <= 0} onClick={() => setDriveHoursElapsed(prev => Math.max(0, prev - 0.5))} className="bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-300 border border-zinc-800 w-7 h-7 rounded flex items-center justify-center font-bold font-mono cursor-pointer transition-colors">
                                              -
                                            </button>
                                            <span className="flex-1 bg-zinc-950 border border-zinc-900 rounded text-center font-mono text-xs text-white py-1 font-bold">
                                              {driveHoursElapsed.toFixed(1)}h
                                            </span>
                                            <button type="button" onClick={() => {
                        const nextVal = driveHoursElapsed + 0.5;
                        setDriveHoursElapsed(nextVal);
                        if (nextVal >= 4) {
                          triggerNotification(`🚨 Shift Alert: ${activeDriver} has reached the 4-hour fatigue limit. SWITCH DRIVERS!`);
                        }
                      }} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 w-7 h-7 rounded flex items-center justify-center font-bold font-mono cursor-pointer transition-colors">
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Alert status or timer progress */}
                                      {(() => {
                  const isFatigued = driveHoursElapsed >= 4;
                  const percentage = Math.min(100, driveHoursElapsed / 4 * 100);
                  return <div className={`p-2.5 rounded-xl border ${isFatigued ? 'bg-rose-500/10 border-rose-500/30' : 'bg-black/40 border-zinc-900'} space-y-1.5`}>
                                            <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase">
                                              <span className={isFatigued ? 'text-rose-400 animate-pulse' : 'text-zinc-500'}>
                                                {isFatigued ? '🚨 ROTATE DRIVERS NOW' : 'SHIFT FATIGUE BARRIERS'}
                                              </span>
                                              <span className={isFatigued ? 'text-rose-400 font-extrabold' : 'text-zinc-400'}>
                                                {driveHoursElapsed.toFixed(1)} hrs / 4.0 Max
                                              </span>
                                            </div>
                                            
                                            <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden">
                                              <div className={`h-full transition-all duration-300 ${isFatigued ? 'bg-rose-500' : 'bg-[#00ffcc]'}`} style={{
                        width: `${percentage}%`
                      }} />
                                            </div>

                                            <p className="text-[8.5px] text-zinc-500 leading-normal font-sans">
                                              {isFatigued ? `WARNING: ${activeDriver} has exceeded recommended safety shift windows. Safely pull over at the next exit and rotate.` : `Active pilot: ${activeDriver} is focused. Rest of the crew should rest. Keep shifts under 4 hours to avoid micro-sleep risks.`}
                                            </p>
                                          </div>;
                })()}
                                    </div>}
                                </div>
                              </div>
                            </div>;
      })()}
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="darkgrey" title="Tour Weather Forecast" isExpanded={activeEventsSection === 'WEATHER'} onToggle={() => setActiveEventsSection(activeEventsSection === 'WEATHER' ? null : 'WEATHER')}>
                      <div className="bg-[#0c0d12] border-t border-zinc-900 p-6 space-y-4">
                        {(() => {
        const nameLower = currentOrNextShow ? (currentOrNextShow.festival_name || currentOrNextShow.name).toLowerCase() : '';
        let tempVal = '68°F';
        let condStr = 'Partly Cloudy';
        let weatherIconComp = <CloudSun className="w-6 h-6 text-teal-400" />;
        let windStr = 'NW 11mph';
        let humStr = '62%';
        let locationLabel = 'EST. VENUE WEATHER';
        if (currentOrNextShow) {
          if (nameLower.includes('festival') || nameLower.includes('fest') || nameLower.includes('park') || nameLower.includes('riot')) {
            tempVal = '59°F';
            condStr = 'Breezy & Cool';
            weatherIconComp = <Wind className="w-6 h-6 text-cyan-400 animate-pulse" />;
            windStr = 'W 18mph';
            humStr = '50%';
          } else if (nameLower.includes('stubbs') || nameLower.includes('texas') || nameLower.includes('austin') || nameLower.includes('garden')) {
            tempVal = '83°F';
            condStr = 'Warm & Sunny';
            weatherIconComp = <Sun className="w-6 h-6 text-amber-400 animate-pulse" />;
            windStr = 'SE 6mph';
            humStr = '40%';
          } else if (nameLower.includes('underground') || nameLower.includes('metro') || nameLower.includes('club') || nameLower.includes('hall')) {
            tempVal = '71°F';
            condStr = 'Indoor AC / Dry';
            weatherIconComp = <Compass className="w-6 h-6 text-zinc-400" />;
            windStr = 'Stable AC';
            humStr = '52%';
          }
        } else {
          locationLabel = 'LOCAL SYSTEM ESTIMATE';
        }
        if (localWeather) {
          tempVal = localWeather.temp;
          condStr = localWeather.condition;
          windStr = localWeather.wind;
          humStr = localWeather.humidity;
          locationLabel = `GPS: ${localWeather.cityName}`;
          switch (localWeather.iconType) {
            case 'clear':
              weatherIconComp = <Sun className="w-6 h-6 text-amber-400 animate-pulse" />;
              break;
            case 'cloudy':
              weatherIconComp = <CloudSun className="w-6 h-6 text-teal-400" />;
              break;
            case 'fog':
              weatherIconComp = <Cloud className="w-6 h-6 text-zinc-400" />;
              break;
            case 'drizzle':
              weatherIconComp = <CloudRain className="w-6 h-6 text-blue-400" />;
              break;
            case 'rain':
              weatherIconComp = <CloudRain className="w-6 h-6 text-sky-400 animate-pulse" />;
              break;
            case 'snow':
              weatherIconComp = <CloudSnow className="w-6 h-6 text-teal-200 animate-pulse" />;
              break;
            case 'thunder':
              weatherIconComp = <CloudLightning className="w-6 h-6 text-yellow-400 animate-pulse" />;
              break;
          }
        } else if (weatherLoading) {
          tempVal = '---';
          condStr = 'Locating...';
          weatherIconComp = <RefreshCw className="w-6 h-6 text-[#00ffcc] animate-spin" />;
          windStr = '...';
          humStr = '...';
          locationLabel = 'SCANNING GPS SATELLITES';
        } else if (weatherError) {
          if (currentOrNextShow) {
            locationLabel = `GPS: BLOCKED (SHOW ESTIMATE)`;
          } else {
            locationLabel = 'GPS: BLOCK (NO ACTIVE SHOW)';
            condStr = 'Location permission needed';
            tempVal = '--°F';
            windStr = 'N/A';
            humStr = 'N/A';
          }
        }
        const getSimulatedForecast = (baseTemp: number, baseCondition: string) => {
          const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const todayIndex = new Date().getDay();
          const forecast = [];
          for (let i = 1; i <= 3; i++) {
            const dayIndex = (todayIndex + i) % 7;
            const tOffset = i === 1 ? 4 : i === 2 ? -2 : 1;
            const dailyTempMax = Math.round(baseTemp + tOffset);
            const dailyTempMin = Math.round(baseTemp - 12 - tOffset / 2);
            let conditionStr = 'Partly Cloudy';
            let iconType = 'cloudy';
            if (baseCondition.toLowerCase().includes('sunny') || baseCondition.toLowerCase().includes('clear')) {
              conditionStr = i === 2 ? 'Mostly Sunny' : i === 3 ? 'Clear Skies' : 'Passing Clouds';
              iconType = i === 3 ? 'clear' : 'cloudy';
            } else if (baseCondition.toLowerCase().includes('rain') || baseCondition.toLowerCase().includes('drizzle')) {
              conditionStr = i === 1 ? 'Showers' : i === 2 ? 'Overcast' : 'Sunny Breaks';
              iconType = i === 1 ? 'rain' : i === 2 ? 'cloudy' : 'clear';
            } else if (baseCondition.toLowerCase().includes('breezy') || baseCondition.toLowerCase().includes('cool')) {
              conditionStr = i === 1 ? 'Breezy & Cool' : i === 2 ? 'Chilly Wind' : 'Partly Cloudy';
              iconType = i === 3 ? 'cloudy' : 'fog';
            }
            forecast.push({
              day: weekdayNames[dayIndex],
              tempMax: `${dailyTempMax}°F`,
              tempMin: `${dailyTempMin}°F`,
              condition: conditionStr,
              iconType: iconType
            });
          }
          return forecast;
        };
        return <div className="space-y-4">
                              <div className="flex justify-between items-center pb-2 border-b border-zinc-900">
                                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest font-black">
                                  {locationLabel}
                                </span>
                                <button type="button" onClick={e => {
              e.stopPropagation();
              fetchLocalWeather();
            }} className="text-zinc-500 hover:text-[#00ffcc] transition-colors">
                                  <RefreshCw className={`w-4 h-4 ${weatherLoading ? 'animate-spin text-[#00ffcc]' : ''}`} />
                                </button>
                              </div>
                              <div className="flex items-center gap-4">
                                {weatherIconComp}
                                <span className="text-3xl text-white font-mono font-black">{tempVal}</span>
                                <div className="pl-4 border-l border-zinc-800">
                                  <p className="text-sm text-zinc-200 font-semibold">{condStr}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-zinc-950 p-3 rounded-xl border border-zinc-900">
                                <p className="text-zinc-500">
                                  Wind: <span className="text-zinc-200">{windStr}</span>
                                </p>
                                <p className="text-zinc-500">
                                  Humidity: <span className="text-zinc-200">{humStr}</span>
                                </p>
                              </div>

                              <div className="pt-2">
                                <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black mb-3">3-Day Extended Forecast</h4>
                                <div className="grid grid-cols-3 gap-3">
                                  {(localWeather?.forecast || getSimulatedForecast(parseFloat(tempVal) || 72, condStr)).map((day, fIdx) => {
                let dayIcon = <CloudSun className="w-5 h-5 text-teal-400 mx-auto" />;
                if (day.iconType === 'clear') dayIcon = <Sun className="w-5 h-5 text-amber-400 mx-auto" />;else if (day.iconType === 'rain') dayIcon = <CloudRain className="w-5 h-5 text-sky-400 mx-auto" />;else if (day.iconType === 'snow') dayIcon = <CloudSnow className="w-5 h-5 text-teal-200 mx-auto" />;else if (day.iconType === 'thunder') dayIcon = <CloudLightning className="w-5 h-5 text-yellow-400 mx-auto" />;else if (day.iconType === 'fog') dayIcon = <Cloud className="w-5 h-5 text-zinc-400 mx-auto" />;
                return <div key={`forecast-day-${fIdx}`} className="bg-zinc-950 rounded-xl p-3 border border-zinc-900 text-center">
                                        <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-tight block">{day.day}</span>
                                        <div className="my-2">{dayIcon}</div>
                                        <span className="text-sm font-mono text-zinc-100 font-extrabold block">{day.tempMax}</span>
                                        <span className="text-[10px] font-mono text-zinc-500 block">{day.tempMin}</span>
                                        <span className="text-[10px] text-zinc-400 truncate block mt-2 font-sans">{day.condition}</span>
                                      </div>;
              })}
                                </div>
                              </div>

                              {/* Smart Weather Routing & Future Stop Disruption Alerts */}
                              {(() => {
            const showsWithAlerts = sortedShows.map(show => {
              const weather = getShowWeatherAndWarnings(show);
              return {
                show,
                weather
              };
            }).filter(item => item.weather.warnings.length > 0);
            return <div className="pt-4 border-t border-zinc-900 mt-4 space-y-3">
                                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-black flex items-center gap-1.5">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                      Smart Route Weather Disruption Alerts ({showsWithAlerts.length})
                                    </h4>
                                    {showsWithAlerts.length > 0 ? <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                        {showsWithAlerts.map(({
                  show,
                  weather
                }, idx) => <div key={`weather-alert-show-${show.id || "show"}-${idx}`} className="bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-3 space-y-2 text-left font-sans text-xs">
                                            <div className="flex justify-between items-start border-b border-zinc-900 pb-1.5">
                                              <div>
                                                <span className="text-[11px] font-bold text-zinc-150 block">{show.festival_name || show.name}</span>
                                                <span className="text-[9px] font-mono text-zinc-500">{show.city || 'Unknown Location'} • {new Date(show.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}</span>
                                              </div>
                                              <div className="text-right">
                                                <span className="text-[10px] font-mono font-black text-[#00ffcc]">{weather.temp}°F</span>
                                                <span className="text-[8.5px] font-mono text-zinc-500 block leading-tight">{weather.conditions}</span>
                                              </div>
                                            </div>
                                            
                                            <div className="space-y-1.5">
                                              {weather.warnings.map((warn, wIdx) => <div key={`weather-warn-${show.id || idx}-${wIdx}`} className={`p-2 rounded-lg border text-[9.5px] leading-relaxed flex items-start gap-1.5 ${warn.color}`}>
                                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-inherit" />
                                                  <div>
                                                    <p className="font-bold tracking-wide uppercase text-[9.5px]">{warn.title}</p>
                                                    <p className="opacity-90">{warn.description}</p>
                                                  </div>
                                                </div>)}
                                            </div>
                                          </div>)}
                                      </div> : <div className="py-4 text-center text-[10.5px] text-zinc-600 bg-zinc-950/20 rounded-xl border border-dashed border-zinc-900 font-mono">
                                        All clear! No weather disruptions detected along current route stops.
                                      </div>}
                                  </div>;
          })()}
                            </div>;
      })()}
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="darkgrey" title="Flight Tracker" isExpanded={activeEventsSection === 'FLIGHTS'} onToggle={() => setActiveEventsSection(activeEventsSection === 'FLIGHTS' ? null : 'FLIGHTS')}>
                      <div className="w-full">
                        <FlightTrackerModal onClose={() => {}} flights={flights} setFlights={setFlights} commitFlightMutation={commitFlightMutation} triggerNotification={triggerNotification} addLog={addLog} initialIsAdding={false} isOffline={isOfflineSimActive || !isOnline} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="darkgrey" title="Core Checklist" isExpanded={activeEventsSection === 'CHECKLIST'} onToggle={() => setActiveEventsSection(activeEventsSection === 'CHECKLIST' ? null : 'CHECKLIST')}>
                      <div className="w-full">
                        <TourChecklistView onBack={() => {}} activeItems={checklistItems} setActiveItems={setChecklistItems} bankItems={checklistBank} setBankItems={setChecklistBank} triggerNotification={triggerNotification} addLog={addLog} activeBandName={activeBand?.name} disableScrollToTop={true} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="darkgrey" title="Setlist Manager" isExpanded={activeEventsSection === 'SETLISTS'} onToggle={() => setActiveEventsSection(activeEventsSection === 'SETLISTS' ? null : 'SETLISTS')}>
                      <div className="w-full">
                        <SetlistsView shows={filteredShows || shows} onBack={() => {}} triggerNotification={triggerNotification} addLog={addLog} bandName={activeBand?.name || 'Artist'} activeBandId={activeBand?.id || props.activeBandId} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="darkgrey" title="Guest List Manager" isExpanded={activeEventsSection === 'GUEST_LIST'} onToggle={() => setActiveEventsSection(activeEventsSection === 'GUEST_LIST' ? null : 'GUEST_LIST')}>
                      <div className="w-full">
                        <GuestlistsView shows={filteredShows || shows} setShows={setShows} onBack={() => {}} triggerNotification={triggerNotification} addLog={addLog} initialShowId={selectedGuestlistShowId} bandName={activeBand?.name || 'Artist'} activeBandId={activeBand?.id || props.activeBandId} />
                      </div>
                    </V2ExpandableCard>

                    {/* CLUSTER: UTILITIES & BUSINESS OPERATIONS */}
                    <div className="px-5 py-4 bg-gradient-to-r from-amber-950/40 via-black to-black border-l-4 border-amber-500 mt-6 mb-2 rounded-r-md">
                      <h3 className="text-xs font-display font-black text-amber-400 uppercase tracking-widest">Utilities & Business Operations</h3>
                    </div>
                    <V2ExpandableCard theme="yellow" title="Amenities Finder" isExpanded={activeEventsSection === 'AMENITIES'} onToggle={() => setActiveEventsSection(activeEventsSection === 'AMENITIES' ? null : 'AMENITIES')}>
                      <div className="w-full">
                        <OnRouteEssentialsView onBack={() => {}} venueAddress={onRouteVenueAddress} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard 
                      theme="yellow" 
                      title={props.activeClearanceLevel === 1 ? "🔒 [Level 2+ Req] Black Book Directory" : "Black Book Directory"} 
                      isExpanded={props.activeClearanceLevel !== 1 && activeEventsSection === 'BLACK_BOOK_DIR'} 
                      onToggle={() => {
                        if (props.activeClearanceLevel === 1) {
                          triggerNotification?.("🚫 Access Denied: Black Book Directory is restricted for Security Clearance Level 1.");
                          return;
                        }
                        setActiveEventsSection(activeEventsSection === 'BLACK_BOOK_DIR' ? null : 'BLACK_BOOK_DIR');
                      }}
                    >
                      <div className="w-full">
                        <BlackBookView onBack={() => {}} triggerNotification={triggerNotification} userProfile={userProfile} setUserProfile={setUserProfile} activeBandName={activeBand?.name || ''} offers={offers} onUpdateOffer={handleUpdateOffer} userReviews={userReviews} venues={venues} setVenues={setVenues} initialTab="directory" hideTabs={true} disableScrollToTop={true} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard 
                      theme="yellow" 
                      title={props.activeClearanceLevel === 1 ? "🔒 [Level 2+ Req] Routing Beacons & Offers" : "Routing Beacons & Offers"} 
                      isExpanded={props.activeClearanceLevel !== 1 && activeEventsSection === 'BLACK_BOOK_BEACONS'} 
                      onToggle={() => {
                        if (props.activeClearanceLevel === 1) {
                          triggerNotification?.("🚫 Access Denied: Routing Beacons & Offers is restricted for Security Clearance Level 1.");
                          return;
                        }
                        setActiveEventsSection(activeEventsSection === 'BLACK_BOOK_BEACONS' ? null : 'BLACK_BOOK_BEACONS');
                      }}
                    >
                      <div className="w-full">
                        <BlackBookView onBack={() => {}} triggerNotification={triggerNotification} userProfile={userProfile} setUserProfile={setUserProfile} activeBandName={activeBand?.name || ''} offers={offers} onUpdateOffer={handleUpdateOffer} userReviews={userReviews} venues={venues} setVenues={setVenues} initialTab="beacons" hideTabs={true} disableScrollToTop={true} />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard 
                      theme="yellow" 
                      title="Creatives Hub" 
                      isExpanded={activeEventsSection === 'CREATIVES_HUB'} 
                      onToggle={() => setActiveEventsSection(activeEventsSection === 'CREATIVES_HUB' ? null : 'CREATIVES_HUB')}
                    >
                      <div className="w-full bg-black">
                        <CreativesHubView
                          onBack={() => {}}
                          triggerNotification={triggerNotification}
                          addLog={addLog}
                          activeBandName={activeBand?.name || 'Artist'}
                        />
                      </div>
                    </V2ExpandableCard>
                    <V2ExpandableCard theme="yellow" title="Tactical Road Tools" isExpanded={activeEventsSection === 'NOTES'} onToggle={() => setActiveEventsSection(activeEventsSection === 'NOTES' ? null : 'NOTES')}>
                      <div className="w-full">
                        <TourNotesView notes={filteredNotes} shows={shows} onBack={() => {}} onAddNote={() => {
        setModalType('note');
        setIsModalOpen(true);
      }} onDeleteNote={handleDeleteNote} triggerNotification={triggerNotification} addLog={addLog} onUpdateNote={handleUpdateNote} toolkitOnly={true} />
                      </div>
                    </V2ExpandableCard>

                    <div className="h-[15px] w-full shrink-0" />
                 </div>
  );
}
