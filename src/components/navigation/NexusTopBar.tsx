import React, { useState, useEffect } from 'react';
import { 
  Shield, Sparkles, ChevronDown, ChevronUp, CheckCircle2, CloudOff, RefreshCcw, 
  Bell, Repeat, User, Plus, ArrowRight, Settings, X, Lock, Home, Radio,
  Volume2, Layers, Wifi, Zap, Activity, Compass, Music, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { hasRegisteredWorkspace, normalizeRegisteredWorkspaces, Band, UserProfile } from '../../types';
import { 
  resolveEffectiveAvatar, 
  resolveCreativeName, 
  resolveCreativeHandle, 
  resolvePromoterName, 
  resolvePromoterHandle,
  resolveBandName,
  resolveBandHandle 
} from '../../utils/bandProfileUtils';
import MarqueeText from '../MarqueeText';
import { syncGlobalUnreadBadge } from '../../utils/appBadgeService';
import { CommunityBandManager } from '../../lib/communityBands';
import { handleImageErrorWithCache } from '../../services/profileImageCacheService';
import {
  NetworkEntity,
  ENTITY_CATEGORY_META,
  getUserManagedEntities,
  openTaggedBandOrEntityProfile,
  syncNetworkEntitiesFromSupabase,
} from '../../services/networkEntitiesService';
import { CreateEntityModal } from '../social/modals/CreateEntityModal';
import { FestivalLineupEditorModal } from '../social/modals/FestivalLineupEditorModal';
import {
  SwipableWorkspaceEntityCard,
  buildWorkspaceEntityItems,
} from '../social/navigation/SwipableWorkspaceEntityCard';

export interface NexusTopBarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  setDashboardV2ActiveNav?: (nav: any) => void;
  triggerNotification?: (msg: string) => void;
  pendingSyncCount?: number;
  processOfflineQueue?: () => Promise<void>;
  isRosterOwner?: boolean;
  activePlan?: string;
  onUpgradeToPro?: () => void;
  getTrialCountdownStr?: () => string;
  activeClearanceLevel?: number;
  activeSimulatedMember?: any;
  userProfile: UserProfile | null;
  notifications?: any[];
  setIsNotificationDrawerOpen?: (open: boolean) => void;
  v2RoleMenuOpen?: boolean;
  setV2RoleMenuOpen?: (open: boolean) => void;
  activeBand?: Band | null;
  bands?: Band[];
  simulatedMemberId?: string;
  setSimulatedMemberId?: (id: string) => void;
  bandLineup?: any[];
  crewMembers?: any[];
  handleOpenMyProfile?: () => void;
  setUserProfile?: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  isOfflineSimActive?: boolean;
  setIsOfflineSimActive?: (active: boolean) => void;
  isOnline?: boolean;
  onOpenSettingsDrawer?: () => void;
}

export const NexusTopBar: React.FC<NexusTopBarProps> = ({
  activeTab,
  setActiveTab,
  setDashboardV2ActiveNav,
  triggerNotification,
  pendingSyncCount = 0,
  processOfflineQueue,
  isRosterOwner = true,
  activePlan = 'touring-pro-plus',
  onUpgradeToPro,
  getTrialCountdownStr = () => 'Active',
  activeClearanceLevel = 5,
  activeSimulatedMember,
  userProfile,
  notifications = [],
  setIsNotificationDrawerOpen,
  v2RoleMenuOpen: externalV2RoleMenuOpen,
  setV2RoleMenuOpen: externalSetV2RoleMenuOpen,
  activeBand,
  bands = [],
  simulatedMemberId = '',
  setSimulatedMemberId,
  bandLineup = [],
  crewMembers = [],
  handleOpenMyProfile,
  setUserProfile,
  isOfflineSimActive = false,
  setIsOfflineSimActive,
  isOnline = true,
  onOpenSettingsDrawer
}) => {
  const [internalRoleMenuOpen, setInternalRoleMenuOpen] = useState(false);
  const roleMenuOpen = externalV2RoleMenuOpen !== undefined ? externalV2RoleMenuOpen : internalRoleMenuOpen;
  const setRoleMenuOpen = externalSetV2RoleMenuOpen || setInternalRoleMenuOpen;

  // Collapsible state for Active Managed Client / Band switcher card (collapsed by default to shrink vertical footprint)
  const [isBandClientSectionExpanded, setIsBandClientSectionExpanded] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [managedEntities, setManagedEntities] = useState<NetworkEntity[]>([]);
  const [showCreateEntityModal, setShowCreateEntityModal] = useState(false);
  const [lineupEditorEntity, setLineupEditorEntity] = useState<NetworkEntity | null>(null);

  useEffect(() => {
    const refresh = () => setManagedEntities(getUserManagedEntities(userProfile?.id));
    refresh();
    syncNetworkEntitiesFromSupabase().then(refresh).catch(() => {});
    window.addEventListener('nexus_entities_updated', refresh);
    return () => window.removeEventListener('nexus_entities_updated', refresh);
  }, [userProfile?.id]);

  // Live ticker updates
  const [tickerIndex, setTickerIndex] = useState(0);
  const unreadNotificationsCount = (notifications || []).filter((n: any) => !n.is_read).length;

  useEffect(() => {
    syncGlobalUnreadBadge();
  }, [unreadNotificationsCount]);

  const isTourManager = userProfile?.band_role_mode === 'tour_manager' || userProfile?.role?.toLowerCase() === 'tour manager';

  const tickerMessages = [
    `⚡ NEXUS CORE: Live Sync Gateway Active [${isOnline ? 'ONLINE' : 'OFFLINE FAILOVER'}]`,
    isTourManager 
      ? `🧭 TOUR MANAGER: ${activeBand?.name || 'Tour Operations'} • LEVEL ${activeClearanceLevel} ACCESS`
      : `🎸 ARTIST: ${activeBand?.name || 'Artist Workspace'} • LEVEL ${activeClearanceLevel} ACCESS`,
    pendingSyncCount > 0 ? `⚠️ PENDING SYNC: [${pendingSyncCount}] Offline mutations in queue` : `✨ LEDGER: All tour records & sales synchronized`,
    `📡 SCENE RADAR: Underground heavy network broadcast connected`
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % tickerMessages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [tickerMessages.length]);

  return (
    <header className="w-full flex flex-col border-b border-[#1b1e25] bg-black sticky top-0 z-40 select-none">
      {/* 1. Main Navigation Bar */}
      <div className="pl-2 pr-4 sm:pr-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand Logo / Return Home */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('home-v2');
              if (setDashboardV2ActiveNav) setDashboardV2ActiveNav('EVENTS');
            }}
            className="flex items-center select-none shrink-0 cursor-pointer hover:opacity-85 active:scale-98 transition-all focus:outline-none"
            title="Return to Home Dashboard"
          >
            <img 
              src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png" 
              alt="Nexus Core" 
              className="object-contain w-32 sm:w-36 h-auto"
              referrerPolicy="no-referrer"
              onError={(e) => {
                handleImageErrorWithCache(e, "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png").catch(() => {});
                e.currentTarget.onerror = null;
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="hidden items-center gap-1.5 px-1 py-0.5">
              <span className="font-black tracking-wider text-base sm:text-lg bg-gradient-to-r from-purple-400 via-rose-500 to-amber-400 bg-clip-text text-transparent font-display">
                NEXUS CORE
              </span>
            </div>
          </button>
        </div>

        {/* Action Controls & Workspace Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Sync Gateway Activation Button with Tactile Animation */}
          <button
            onClick={async () => {
              setIsManualSyncing(true);
              try {
                if (processOfflineQueue) await processOfflineQueue();
                await CommunityBandManager.getInstance().fetchFromSupabase();
              } catch (e) {
                // Silent
              } finally {
                setTimeout(() => setIsManualSyncing(false), 1400);
              }
            }}
            disabled={isManualSyncing}
            className={`rounded-xl px-2.5 py-1 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider ${
              isManualSyncing
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-105'
                : pendingSyncCount > 0
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700/80 shadow-inner'
            }`}
            title="Click to sync local changes and fetch latest database updates"
          >
            <RefreshCcw
              className={`w-3.5 h-3.5 ${
                isManualSyncing
                  ? 'text-cyan-400 animate-spin'
                  : pendingSyncCount > 0
                  ? 'text-amber-400 animate-spin'
                  : 'text-cyan-400 group-hover:rotate-180 transition-transform duration-500'
              }`}
            />
            <span className="hidden sm:inline">
              {isManualSyncing ? 'Syncing...' : pendingSyncCount > 0 ? `Sync (${pendingSyncCount})` : 'Cloud Sync'}
            </span>
          </button>

          {/* Clearance Level / Plan Badge */}
          <button
            onClick={() => {
              setActiveTab('plans');
            }}
            className={`rounded-xl px-2.5 py-1 flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95 shrink-0 ${
              !isRosterOwner
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500/30 shadow-emerald-500/5'
                : activePlan === 'touring-pro-plus'
                  ? 'bg-purple-500/10 hover:bg-purple-500/20 text-white border border-purple-500/30 shadow-purple-500/5'
                  : activePlan === 'touring-pro'
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-white border border-emerald-500/30 shadow-emerald-500/5'
                    : getTrialCountdownStr() === 'Expired'
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 text-white border border-rose-500/30 shadow-rose-500/5 animate-pulse'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-white border border-amber-500/30 shadow-amber-500/5'
            }`}
          >
            <div className="flex flex-col text-left select-none">
              <span className="text-[10px] font-bold text-white leading-tight font-sans truncate max-w-[80px] sm:max-w-[110px]">
                {(activeSimulatedMember?.name || userProfile?.name || 'Artist').trim().split(/\s+/)[0]}
              </span>
              <span className={`text-[8px] font-mono font-bold uppercase tracking-wider leading-none mt-0.5 ${
                !isRosterOwner
                  ? 'text-[#00ffcc]'
                  : activePlan === 'touring-pro-plus'
                    ? 'text-purple-400'
                    : activePlan === 'touring-pro'
                      ? 'text-emerald-400'
                      : getTrialCountdownStr() === 'Expired'
                        ? 'text-rose-400'
                        : 'text-amber-400'
              }`}>
                Lvl {activeClearanceLevel}
              </span>
            </div>
          </button>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotificationDrawerOpen && setIsNotificationDrawerOpen(true)}
            className="p-1.5 sm:p-2 rounded-full hover:bg-zinc-850 text-zinc-400 hover:text-white transition-all cursor-pointer focus:outline-none active:scale-95 flex items-center justify-center shrink-0 relative"
            title="Notifications Center"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadNotificationsCount > 0 && (
              <span className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ring-2 ring-black ${userProfile?.active_workspace === 'band' ? 'bg-[#00ffcc]' : 'bg-red-500'}`} />
            )}
          </button>

          {/* Settings Drawer Button */}
          {onOpenSettingsDrawer && (
            <button
              onClick={onOpenSettingsDrawer}
              className="p-1.5 sm:p-2 rounded-full hover:bg-zinc-850 text-zinc-400 hover:text-[#00ffcc] transition-all cursor-pointer focus:outline-none active:scale-95 flex items-center justify-center shrink-0"
              title="System Settings & Custom Gateway"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Workspace Avatar & Role Switcher Trigger */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-900 flex items-center justify-center font-black text-white focus:outline-none transition-all active:scale-95 overflow-hidden shadow-md cursor-pointer ml-1 ${
                userProfile?.active_workspace === 'band' 
                  ? 'border-2 border-[#39ff14] shadow-[0_0_12px_rgba(57,255,20,0.8)]' 
                  : 'border border-zinc-700 hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500'
              }`}
            >
              {(() => {
                const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                return resolveEffectiveAvatar(r, activeBand, userProfile);
              })() ? (
                <img 
                  src={(() => {
                    const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                    return resolveEffectiveAvatar(r, activeBand, userProfile) || "";
                  })()} 
                  className="w-full h-full object-cover" 
                  alt="" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                    e.currentTarget.src = r === 'creative' 
                      ? 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150' 
                      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                  }}
                />
              ) : (
                <span className="text-emerald-400 text-xs font-bold font-mono">
                  {(() => {
                    const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                    if (r === 'band') return (activeBand?.name || 'BD').slice(0, 2).toUpperCase();
                    if (r === 'creative') return (userProfile?.creative_metadata?.business_name || 'CR').slice(0, 2).toUpperCase();
                    if (r === 'label') return (userProfile?.label_company_name || 'LB').slice(0, 2).toUpperCase();
                    if (r === 'promoter') return (userProfile?.promoter_metadata?.brand_name || 'PR').slice(0, 2).toUpperCase();
                    const name = (userProfile?.full_name || userProfile?.name || 'User').replace(/^@+/, '').trim();
                    const parts = name.split(/\s+/).filter(Boolean);
                    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                    return name.slice(0, 2).toUpperCase() || 'U';
                  })()}
                </span>
              )}
            </button>

            {/* Role Switcher Modal / Dropdown */}
            <AnimatePresence>
              {roleMenuOpen && (
                <motion.div key="v2-role-menu-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="fixed inset-0 z-[99990] bg-black/60 backdrop-blur-[2px]" onClick={() => setRoleMenuOpen(false)} />
                  <div className="fixed top-[92px] right-3 sm:right-6 w-84 max-w-[calc(100vw-24px)] bg-[#09090b] border border-zinc-800 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.95)] z-[99999] text-left animate-in fade-in slide-in-from-top-3 duration-200">
                    <button onClick={() => setRoleMenuOpen(false)} className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center bg-black/40 hover:bg-rose-900/40 border border-zinc-800 hover:border-rose-500/50 text-zinc-500 hover:text-rose-400 rounded-full transition-all cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                    
                    {/* Active Profile Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                      <div className="w-10 h-10 rounded-full bg-rose-950/40 border border-rose-500/40 flex items-center justify-center font-black text-rose-400 shrink-0 overflow-hidden">
                        {(() => {
                          const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                          const avatar = resolveEffectiveAvatar(r, activeBand, userProfile);
                          if (avatar) {
                            return (
                              <img 
                                src={avatar} 
                                className="w-full h-full object-cover" 
                                alt="" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = r === 'creative' 
                                    ? 'https://images.unsplash.com/photo-1626544827763-d516dce335e2?w=150' 
                                    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
                                }}
                              />
                            );
                          }
                          const name = r === 'band' 
                            ? resolveBandName(activeBand, userProfile) 
                            : r === 'creative' 
                            ? resolveCreativeName(userProfile) 
                            : r === 'promoter' 
                            ? resolvePromoterName(userProfile) 
                            : (userProfile?.name || 'U');
                          return (
                            <div className="font-mono text-sm">
                              {name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h4 className="text-sm font-black text-white truncate flex items-center gap-1.5">
                          {(() => {
                            const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                            if (r === 'industry_pro') return 'Industry Pro';
                            if (r === 'fan_only') return 'Fan Only';
                            if (r === 'promoter') return resolvePromoterName(userProfile);
                            if (r === 'creative') return resolveCreativeName(userProfile);
                            if (r === 'label') return userProfile?.label_company_name || 'Pro Label';
                            if (userProfile?.band_role_mode === 'tour_manager' || userProfile?.role?.toLowerCase() === 'tour manager') {
                              return userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Miguel Goregrinder Medina';
                            }
                            return resolveBandName(activeBand, userProfile);
                          })()}
                          <span className="text-[7px] font-black tracking-widest uppercase bg-emerald-500/25 border border-emerald-500/45 text-emerald-400 px-1 py-0.5 rounded">
                            {activeClearanceLevel === 5 ? 'OWNER' : `LVL ${activeClearanceLevel}`}
                          </span>
                        </h4>
                        <p className="text-[9px] text-zinc-400 font-mono uppercase truncate mt-0.5">
                          {userProfile?.account_type === 'industry_pro' ? 'Professional' : userProfile?.account_type === 'fan_only' ? 'Fan' : (userProfile?.band_role_mode === 'tour_manager' || userProfile?.role?.toLowerCase() === 'tour manager' ? 'Tour Manager & Production Director' : (activeSimulatedMember?.role || userProfile?.role || 'Vocals'))} • LEVEL {activeClearanceLevel} CLEARANCE
                        </p>
                      </div>
                    </div>

                    {/* Default Band/Artist Tab Section - Only if band is registered (Collapsed by default to shrink vertical footprint) */}
                    {hasRegisteredWorkspace(userProfile, 'band') && activeBand && (
                      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-2.5 mb-3 transition-all">
                        {/* Compact Header Toggle Button */}
                        <button
                          type="button"
                          onClick={() => setIsBandClientSectionExpanded(!isBandClientSectionExpanded)}
                          className="w-full flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-zinc-800/40 p-1 rounded-lg transition-colors"
                          title={isBandClientSectionExpanded ? "Collapse client options" : "Expand client options"}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#00ffcc]/30 bg-zinc-950 shrink-0">
                              {activeBand?.logo_url ? (
                                <img
                                  src={activeBand.logo_url}
                                  className="w-full h-full object-cover"
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#00ffcc] font-mono text-xs font-bold">
                                  {activeBand?.name?.charAt(0).toUpperCase() || 'B'}
                                </div>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <span className="block text-[7px] font-mono font-bold text-zinc-500 uppercase tracking-widest leading-none mb-0.5">
                                {userProfile?.band_role_mode === 'tour_manager' || userProfile?.role?.toLowerCase() === 'tour manager' ? 'ACTIVE MANAGED CLIENT' : 'ACTIVE BAND / ARTIST'}
                              </span>
                              <h4 className="text-[11px] font-bold text-white truncate uppercase tracking-tight leading-tight">
                                {activeBand?.name || 'No Band Name'}
                              </h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                              {isBandClientSectionExpanded ? 'Hide' : 'Expand'}
                            </span>
                            {isBandClientSectionExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Expandable Inner Controls */}
                        {isBandClientSectionExpanded && (
                          <div className="mt-2 pt-2 border-t border-zinc-800/80 animate-in fade-in duration-150">
                            {/* Switch to Tour Manager Mode / Switch to Band Member Mode Button */}
                            {(() => {
                              const isTourManagerMode = userProfile?.band_role_mode === 'tour_manager' || userProfile?.role?.toLowerCase() === 'tour manager';
                              
                              if (isTourManagerMode) {
                                return (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between px-0.5">
                                      <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                                        <Compass className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
                                        Identity: Tour Manager
                                      </span>
                                      <span className="text-[7.5px] font-mono px-1.5 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded font-bold uppercase tracking-wider">
                                        TM MODE ACTIVE
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prevRole = userProfile?.previous_band_role || 'Vocals';
                                        const updated: UserProfile = {
                                          ...userProfile!,
                                          band_role_mode: 'musician',
                                          role: prevRole,
                                        };
                                        if (setUserProfile) setUserProfile(updated);
                                        try {
                                          localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                                          window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                                        } catch {}
                                      }}
                                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:text-white rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                                      title="Switch identity back to Artist / Band Member mode"
                                    >
                                      <Music className="w-3 h-3 text-emerald-400" />
                                      <span>Switch to Artist / Member Mode</span>
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between px-0.5">
                                    <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                      <Music className="w-3 h-3 text-emerald-400" />
                                      Identity: {userProfile?.role || 'Vocals'}
                                    </span>
                                    <span className="text-[7.5px] font-mono px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-bold uppercase tracking-wider">
                                      BAND MEMBER
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentRole = userProfile?.role || 'Vocals';
                                      const updated: UserProfile = {
                                        ...userProfile!,
                                        band_role_mode: 'tour_manager',
                                        previous_band_role: currentRole !== 'Tour Manager' ? currentRole : (userProfile?.previous_band_role || 'Vocals'),
                                        role: 'Tour Manager',
                                      };
                                      if (setUserProfile) setUserProfile(updated);
                                      try {
                                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                                        window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                                      } catch {}
                                      setActiveTab('home-v2');
                                      if (setDashboardV2ActiveNav) setDashboardV2ActiveNav('EVENTS');
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm active:scale-95"
                                    title="Switch to Tour Manager & Booking Agent executive identity"
                                  >
                                    <Compass className="w-3 h-3 text-amber-400" />
                                    <span>Switch to Tour Manager Mode</span>
                                  </button>
                                </div>
                              );
                            })()}

                            {/* Add Another Band/Artist Button */}
                            {(() => {
                              const currentLimit = 
                                userProfile?.sub_tier === 'touring_pro_plus' || activePlan === 'touring-pro-plus' ? 5 :
                                userProfile?.sub_tier === 'touring_pro' || activePlan === 'touring-pro' ? 2 :
                                userProfile?.sub_tier === 'enterprise_circuit' ? 999 :
                                userProfile?.sub_tier === 'power_user_pro' ? 2 : 1;
                              
                              return (
                                <button
                                  onClick={() => {
                                    setRoleMenuOpen(false);
                                    setActiveTab('plans');
                                  }}
                                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-[#00ffcc] hover:text-white rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  <Plus className="w-3 h-3 text-[#00ffcc]" />
                                  <span>Add Another Band/Artist ({bands.length}/{currentLimit})</span>
                                </button>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Switch Portal Roster */}
                    <div className="space-y-2">
                      <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase mb-1.5">SWITCH ACTIVE PORTAL</span>
                      <div className="space-y-1">
                        {(() => {
                          const rawPortalRole = userProfile?.active_workspace || userProfile?.account_type || 'fan_only';
                          const portalRole = (rawPortalRole === 'fan' || rawPortalRole === 'fan_only') ? 'fan_only' : rawPortalRole;
                          const isFanAccount = userProfile?.account_type === 'fan' || userProfile?.account_type === 'fan_only';
                          const isIndustryPro = !isFanAccount && (userProfile?.account_type === 'industry_pro' || userProfile?.account_type === 'industry pro' || ['band', 'promoter', 'creative', 'label'].some(w => hasRegisteredWorkspace(userProfile, w)));

                          if (portalRole === 'fan_only' && !isIndustryPro) {
                            return (
                              <>
                                <div className="w-full flex items-center justify-between p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">💙</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider">Fan / Supporter</p>
                                      <p className="text-[8px] opacity-80 font-mono leading-none">Active Environment</p>
                                    </div>
                                  </div>
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse" />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = {
                                      ...userProfile,
                                      active_workspace: 'industry_pro',
                                      account_type: 'industry_pro',
                                      role: 'Industry Pro',
                                    };
                                    if (setUserProfile) setUserProfile(updated as any);
                                    try {
                                      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                                      window.dispatchEvent(
                                        new CustomEvent('nexus_core_user_profile_updated', { detail: updated })
                                      );
                                    } catch {}
                                    triggerNotification?.(
                                      '⚡ Upgraded to Industry Pro! Select a workspace below to register.'
                                    );
                                  }}
                                  className="w-full mt-1.5 p-3 rounded-xl bg-gradient-to-br from-[#291244] via-[#1a0b2e] to-[#0d282a] hover:from-[#36185a] hover:via-[#230f3d] hover:to-[#113638] border border-[#9d4edf]/60 hover:border-teal-400/80 shadow-[0_0_20px_rgba(157,78,223,0.28)] transition-all duration-200 cursor-pointer text-left group"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-8 h-8 rounded-lg bg-[#6601BB]/40 border border-[#a268ff]/50 flex items-center justify-center shrink-0">
                                        <span className="text-xs">🎟️</span>
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-white group-hover:text-teal-300 transition-colors">
                                          Upgrade to Industry Pro
                                        </p>
                                        <p className="text-[9px] text-zinc-300/90 leading-snug mt-0.5">
                                          Unlock Band, Promoter, Venue, Creative &amp; Label workspaces
                                        </p>
                                      </div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
                                      <ArrowRight className="w-3 h-3 text-teal-300 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                  </div>
                                </button>
                              </>
                            );
                          }

                          return [
                            { key: 'industry_pro', icon: '🎟️', name: 'Industry Pro', desc: 'Active social environment', bg: 'bg-violet-950/40', border: 'border-violet-500/30', text: 'text-violet-400', dot: 'bg-violet-700 shadow-[0_0_8px_#6d28d9]' },
                            { key: 'fan_only', icon: '💙', name: 'Fan Only', desc: 'Royal Blue fan community', bg: 'bg-cyan-950/40', border: 'border-cyan-500/30', text: 'text-cyan-400', dot: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' },
                            { key: 'band', icon: '🎸', name: 'Band / Artist Workspace', desc: 'Lineup, repertoire & presets', bg: 'bg-emerald-950/40', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' },
                            { key: 'promoter', icon: '🏟️', name: 'Venue Promoter Gateway', desc: 'Calendars, lineups & finance', bg: 'bg-yellow-950/40', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-500 shadow-[0_0_8px_#eab308]' },
                            { key: 'creative', icon: '🛠️', name: 'Creative Hub & Crew', desc: 'Contracts, portfolio & sound crew', bg: 'bg-fuchsia-950/40', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', dot: 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' },
                            { key: 'label', icon: '💿', name: 'Record Label Console', desc: 'Oversee rosters & releases', bg: 'bg-orange-950/40', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500 shadow-[0_0_8px_#f97316]' }
                          ].map((portal, idx) => {
                            const isActive = portalRole === portal.key;

                            if (portal.key === 'fan_only' && isIndustryPro) {
                              return (
                                <div key={`portal-disabled-${portal.key}-${idx}`} className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950/20 border border-zinc-900/30 text-zinc-650 opacity-40 select-none cursor-not-allowed">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs grayscale opacity-50">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{portal.name}</p>
                                      <p className="text-[8px] font-mono leading-none text-zinc-600">downgrade not possible</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-mono text-zinc-700">LOCKED</span>
                                </div>
                              );
                            }

                            const isAllowed = (portal.key === 'industry_pro' || (portal.key === 'fan_only' && !isIndustryPro)) || hasRegisteredWorkspace(userProfile, portal.key) || (userProfile?.email === 'admin@nexus.com');

                            if (
                              isAllowed &&
                              (portal.key === 'band' ||
                                portal.key === 'promoter' ||
                                portal.key === 'creative' ||
                                portal.key === 'label')
                            ) {
                              const entityItems = buildWorkspaceEntityItems(portal.key, {
                                userProfile,
                                activeBand,
                                bands,
                                managedEntities,
                              });
                              return (
                                <SwipableWorkspaceEntityCard
                                  key={`portal-entity-${portal.key}-${idx}`}
                                  workspaceType={portal.key}
                                  entities={entityItems}
                                  activeEntityId={
                                    portal.key === 'band'
                                      ? activeBand?.id || (userProfile as any)?.band_id
                                      : undefined
                                  }
                                  isWorkspaceActive={isActive}
                                  onSelectEntity={(selectedEntity) => {
                                    setRoleMenuOpen(false);
                                    const updated: any = {
                                      ...userProfile,
                                      active_workspace: portal.key,
                                      account_type: portal.key,
                                    };
                                    if (portal.key === 'band') {
                                      updated.band_id = selectedEntity.id || updated.band_id;
                                      updated.band_name = selectedEntity.name || updated.band_name;
                                      updated.band_handle = selectedEntity.handle || updated.band_handle;
                                      updated.band_logo = selectedEntity.logoUrl || updated.band_logo;
                                    } else if (portal.key === 'promoter') {
                                      updated.promoter_agency = selectedEntity.name || updated.promoter_agency;
                                      updated.promoter_handle = selectedEntity.handle || updated.promoter_handle;
                                      updated.promoter_logo = selectedEntity.logoUrl || updated.promoter_logo;
                                    } else if (portal.key === 'creative') {
                                      updated.creative_name = selectedEntity.name || updated.creative_name;
                                      updated.creative_handle = selectedEntity.handle || updated.creative_handle;
                                      updated.creative_logo = selectedEntity.logoUrl || updated.creative_logo;
                                    } else if (portal.key === 'label') {
                                      updated.label_name = selectedEntity.name || updated.label_name;
                                      updated.label_handle = selectedEntity.handle || updated.label_handle;
                                      updated.label_avatar = selectedEntity.logoUrl || updated.label_avatar;
                                    }
                                    if (setUserProfile) setUserProfile(updated);
                                    try {
                                      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                                      window.dispatchEvent(
                                        new CustomEvent('nexus_core_user_profile_updated', { detail: updated })
                                      );
                                    } catch {}
                                    if (portal.key === 'band') {
                                      setActiveTab('home-v2');
                                      if (setDashboardV2ActiveNav) setDashboardV2ActiveNav('EVENTS');
                                    } else if (portal.key === 'promoter') {
                                      setActiveTab('promoter');
                                    } else if (portal.key === 'creative') {
                                      setActiveTab('creative');
                                    } else if (portal.key === 'label') {
                                      setActiveTab('label');
                                    }
                                  }}
                                />
                              );
                            }

                            if (isActive) {
                              return (
                                <div key={`portal-active-${portal.key}-${idx}`} className={`w-full flex items-center justify-between p-2 rounded-xl ${portal.bg} border ${portal.border} ${portal.text}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                      <p className="text-[8px] opacity-80 font-mono leading-none">Active Environment</p>
                                    </div>
                                  </div>
                                  <span className={`w-1.5 h-1.5 rounded-full ${portal.dot} animate-pulse`} />
                                </div>
                              );
                            }

                            if (isAllowed) {
                              return (
                                <button
                                  key={`portal-allowed-${portal.key}-${idx}`}
                                  onClick={() => {
                                    setRoleMenuOpen(false);
                                    const targetAcc = (portal.key === 'fan' || portal.key === 'fan_only') ? 'fan_only' : (portal.key === 'industry_pro') ? 'industry_pro' : portal.key;
                                    const updated = { ...userProfile, active_workspace: portal.key, account_type: targetAcc };
                                    if (setUserProfile) setUserProfile(updated as any);
                                    try {
                                      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                                      window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                                    } catch {}
                                    if (portal.key === 'industry_pro' || portal.key === 'fan_only') {
                                      setActiveTab('social');
                                    } else if (portal.key === 'band') {
                                      setActiveTab('home-v2');
                                      if (setDashboardV2ActiveNav) setDashboardV2ActiveNav('EVENTS');
                                    } else if (portal.key === 'promoter') {
                                      setActiveTab('promoter');
                                    } else if (portal.key === 'creative') {
                                      setActiveTab('creative');
                                    } else if (portal.key === 'label') {
                                      setActiveTab('label');
                                    }
                                  }}
                                  className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/50 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider group-hover:text-white transition-colors">{portal.name}</p>
                                      <p className="text-[8px] opacity-50 font-mono leading-none">{portal.desc}</p>
                                    </div>
                                  </div>
                                  <div className="w-5 h-5 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                                    <ArrowRight className="w-3 h-3 text-zinc-500 group-hover:text-white" />
                                  </div>
                                </button>
                              );
                            }

                            return (
                              <button
                                key={`${portal.key}-${idx}`}
                                onClick={() => {
                                  setRoleMenuOpen(false);
                                  if (typeof window !== 'undefined') {
                                    localStorage.setItem('nexus_target_register_workspace', portal.key);
                                  }
                                  if (onUpgradeToPro) onUpgradeToPro();
                                }}
                                className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-900/50 text-zinc-650 hover:text-zinc-500 transition-all cursor-pointer group"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs opacity-40">{portal.icon}</span>
                                  <div className="text-left">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 group-hover:text-zinc-500">{portal.name} 🔒</p>
                                    <p className="text-[8px] opacity-40 font-mono leading-none">Registration Required</p>
                                  </div>
                                </div>
                                <div className="w-5 h-5 rounded-full bg-zinc-950 flex items-center justify-center">
                                  <span className="text-[10px]">🔒</span>
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Decoupled Public Brand Entities & Festival Pages */}
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-black text-amber-400 tracking-wider uppercase">
                          PUBLIC PAGES & FESTIVAL ENTITIES ({managedEntities.length})
                        </span>
                      </div>

                      {managedEntities.length > 0 && (
                        <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                          {managedEntities.map((ent) => {
                            const catMeta = ENTITY_CATEGORY_META[ent.category] || ENTITY_CATEGORY_META.festival;
                            return (
                              <div
                                key={ent.id}
                                className="w-full flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-zinc-800/80 transition-all"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRoleMenuOpen(false);
                                    openTaggedBandOrEntityProfile(ent, triggerNotification);
                                  }}
                                  className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                                >
                                  <span className="text-xs shrink-0">{catMeta.icon}</span>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-white truncate">
                                      {ent.display_name}
                                    </p>
                                    <p className="text-[8px] font-mono text-amber-300/80 truncate">
                                      @{ent.slug} • {catMeta.shortLabel}
                                    </p>
                                  </div>
                                </button>
                                {ent.category === 'festival' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoleMenuOpen(false);
                                      setLineupEditorEntity(ent);
                                    }}
                                    className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[8px] font-mono font-bold uppercase shrink-0 cursor-pointer"
                                  >
                                    Lineup
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setRoleMenuOpen(false);
                          setShowCreateEntityModal(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 hover:text-white text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>+ Create Public Page or Entity</span>
                      </button>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-1.5">
                      <button 
                        onClick={() => {
                          setRoleMenuOpen(false);
                          if (onOpenSettingsDrawer) {
                            onOpenSettingsDrawer();
                          } else {
                            setActiveTab('plans');
                          }
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900/60 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-zinc-500" />
                        <span>System Settings & Gateway</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setRoleMenuOpen(false);
                          localStorage.removeItem('nexus_core_user_profile'); 
                          if (setUserProfile) setUserProfile(null); 
                          window.location.reload();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-500 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-colors text-left cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-rose-500" />
                        <span>Log Out from Terminal</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <CreateEntityModal
        isOpen={showCreateEntityModal}
        onClose={() => setShowCreateEntityModal(false)}
        userProfile={userProfile}
        onEntityCreated={(created, createdEditionId) => {
          setManagedEntities(getUserManagedEntities(userProfile?.id));
          if (created.category === 'festival' && createdEditionId) {
            setLineupEditorEntity(created);
          }
        }}
        triggerNotification={triggerNotification}
      />

      <FestivalLineupEditorModal
        isOpen={Boolean(lineupEditorEntity)}
        onClose={() => setLineupEditorEntity(null)}
        entity={lineupEditorEntity}
        triggerNotification={triggerNotification}
      />

      {/* 2. Live Scene Radar Marquee Ticker */}
      <div className="bg-[#090b10] border-t border-b border-zinc-900/80 px-3 py-1 flex items-center gap-2 text-[10px] font-mono text-zinc-400 overflow-hidden">
        <div className="flex items-center gap-1 shrink-0 text-[#00ffcc] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] animate-ping inline-block" />
          <span className="tracking-widest uppercase text-[8px]">TICKER</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <MarqueeText 
            text={tickerMessages[tickerIndex]} 
            className="text-zinc-300 font-mono tracking-wide"
          />
        </div>
      </div>
    </header>
  );
};

export default NexusTopBar;
