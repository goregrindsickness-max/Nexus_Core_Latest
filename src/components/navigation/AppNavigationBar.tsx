import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Plus,
  Radio,
  ShieldCheck,
  ShieldAlert,
  X,
  Sparkles,
  Disc,
  DollarSign,
  Globe,
  Calendar,
  ListTodo,
  User,
  FileText,
  Plane,
  MapPin,
  Package,
  Award,
  BookOpen,
  Printer,
  BarChart2,
  Settings,
  Tag,
  HelpCircle,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { Band, UserProfile, normalizeRegisteredWorkspaces } from '../../types';

export interface AppNavigationBarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  dashboardV2ActiveNav?: string;
  setDashboardV2ActiveNav: (nav: any) => void;
  promoHubSubTab: 'distro' | 'stories' | 'loyalty';
  setPromoHubSubTab: (tab: 'distro' | 'stories' | 'loyalty') => void;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  setIsQuickActionPanelOpen: (open: boolean) => void;
  isPttOpen: boolean;
  setIsPttOpen: (open: boolean) => void;
  isPttRecording: boolean;
  playPttSound: (sound: string) => void;
  isNavMenuOpen: boolean;
  setIsNavMenuOpen: (open: boolean) => void;
  activeBand: Band | null;
  bandLogoUrl?: string;
  userProfile: UserProfile | null;
  setUserProfile: (profile: any) => void;
  handleOpenMyProfile: () => void;
  setLoginInitialTab?: (tab: any) => void;
  setIsLoggedOut?: (loggedOut: boolean) => void;
  setShowSplash?: (show: boolean) => void;
}

export function AppNavigationBar({
  activeTab,
  setActiveTab,
  dashboardV2ActiveNav,
  setDashboardV2ActiveNav,
  promoHubSubTab,
  setPromoHubSubTab,
  triggerNotification,
  addLog,
  setIsQuickActionPanelOpen,
  isPttOpen,
  setIsPttOpen,
  isPttRecording,
  playPttSound,
  isNavMenuOpen,
  setIsNavMenuOpen,
  activeBand,
  bandLogoUrl,
  userProfile,
  setUserProfile,
  handleOpenMyProfile,
  setLoginInitialTab,
  setIsLoggedOut,
  setShowSplash,
}: AppNavigationBarProps) {
  return (
    <React.Fragment>
        {/* RECTANGULAR BOTTOM ACTION BAR (STAND IN NAV DECORATION BAR) */}
        <div className="fixed bottom-0 w-full sm:max-w-[620px] bg-[#0c0e12]/98 border-t border-[#1b1e25] px-4 py-3 grid grid-cols-3 items-center z-10 shadow-[0_-15px_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-start">
            <button
              onClick={() => {
                setActiveTab('home-v2');
                setDashboardV2ActiveNav('EVENTS');
                triggerNotification('Returning to Nexus Home');
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 w-[90px] rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                activeTab === 'home-v2' 
                  ? 'bg-[#00ffcc]/10 border-[#00ffcc]/30 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]' 
                  : 'bg-zinc-900/50 border-zinc-800 text-teal-600/50 hover:text-teal-400 hover:bg-zinc-800/80'
              }`}
            >
              <Home className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Home</span>
            </button>          </div>

          <div className="flex justify-center">
            {/* Glowing central Quick Add (50% Larger!) */}
            <button
              onClick={() => setIsQuickActionPanelOpen(true)}
              className="w-18 h-18 rounded-full bg-[#00ffcc] text-black shadow-xl flex items-center justify-center -translate-y-6 hover:scale-110 active:scale-95 transition-all border-4 border-[#0c0e12] cursor-pointer shadow-[#00ffcc]/20 relative z-50"
              title="Quick Actions panel"
            >
              <Plus className="w-9 h-9 text-black stroke-[3.5]" />
            </button>          </div>

          <div className="flex justify-end relative">
            {/* New PTT Radio Button linked directly to PTT Radio Modal */}
            <button
              onClick={() => {
                setIsPttOpen(true);
                playPttSound('static');
                triggerNotification('PTT Walkie Channel open.');
              }}
              className={`flex flex-col items-center justify-center gap-1.5 py-2 w-[90px] rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95 ${
                isPttOpen 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                  : 'bg-zinc-900/50 border-zinc-800 text-amber-600/50 hover:text-amber-400 hover:bg-zinc-800/80'
              }`}
            >
              <Radio className="w-5 h-5 stroke-[2]" />
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase">Radio</span>
              {isPttRecording && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 z-30">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border border-black"></span>
                </span>
              )}
            </button>          </div>
        </div>

        {/* Navigation Menu Dropdown */}
        <AnimatePresence>
          {isNavMenuOpen && (
            <motion.div key="nav-menu-wrapper" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex overflow-hidden pointer-events-none">
              {/* Backdrop */}
              <motion.div 
                key="nav-menu-backdrop"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 1 }}
                onClick={() => setIsNavMenuOpen(false)}
                className="absolute inset-0 bg-black/75 backdrop-blur-[2px] cursor-pointer pointer-events-auto"
              />

              {/* Dropdown Body */}
              <motion.div 
                key="nav-menu-body"
                initial={{ opacity: 1, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 1, y: -10, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute left-5 top-16 w-72 max-w-[88vw] h-auto bg-[#0c0e12] border-2 border-[#1c1f26] rounded-2xl flex flex-col shadow-2xl z-20 overflow-hidden pointer-events-auto"
              >
                {/* Header block with band context */}
                <div className="p-4 border-b border-[#1b1e25] bg-[#07080a] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#00ffcc]/40 bg-zinc-800">
                      <img 
                        src={bandLogoUrl || activeBand?.logo_url} 
                        alt={activeBand?.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[130px] font-sans flex items-center gap-1.5">
                        {activeBand?.name}
                        {activeBand?.is_verified ? (
                          <span title="Verified Artist"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /></span>
                        ) : (
                          <span title="Unverified / Fan Managed"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /></span>
                        )}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">
                        {userProfile?.role || "Tour Manager"}
                        {!activeBand?.is_verified && " (FAN MANAGED)"}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsNavMenuOpen(false)}
                    className="p-1 px-1.5 rounded border border-zinc-700 hover:border-zinc-500 bg-zinc-900/40 text-zinc-400 hover:text-white cursor-pointer active:scale-95 transition-all"
                    title="Close Menu"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>                </div>

                {/* Navigation Links */}
                <div className="h-auto max-h-[62vh] overflow-y-auto px-3.5 py-4 space-y-4 scrollbar-thin">
                  {[
                    {
                      groupTitle: "Core Access",
                      items: [
                        { tab: 'home-v2', label: 'Dashboard', icon: Home },
                        { tab: 'studio', label: 'Song Studio & Stems', icon: Disc },
                        { tab: 'new-sale', label: 'POS TERMINAL', icon: DollarSign },
                        { tab: 'social', label: 'Social & Feed', icon: Globe },
                        { tab: 'distro-deck', label: 'Audio & Merch Hub', icon: Radio },
                      ]
                    },
                    {
                      groupTitle: "Shows & Tours",
                      items: [
                        { tab: 'shows', label: 'Shows & Tours', icon: Calendar },
                        { tab: 'setlists', label: 'Setlist Scheduler', icon: ListTodo },
                        { tab: 'guestlist', label: 'Door Guestlists', icon: User },
                        { tab: 'notes', label: 'Tour Notes Scheduler', icon: FileText },
                        { tab: 'flights', label: 'Flight Tracker', icon: Plane },
                        { tab: 'on-route-essentials', label: 'OnRoute Essentials', icon: MapPin },
                      ]
                    },
                    {
                      groupTitle: "Sales & Offline Kits",
                      items: [
                        { tab: 'inventory', label: 'Merch Inventory', icon: Package },
                        { tab: 'loyalty', label: 'VIP Loyalty Club', icon: Award },
                        { tab: 'black-book', label: 'Black Book', icon: BookOpen },
                        { tab: 'merchandise-printers', label: 'Merchandise Printers', icon: Printer },
                        { tab: 'promo-hub', label: 'Promo & Marketing', icon: Sparkles },
                        { tab: 'reports', label: 'Reports & Analytics', icon: BarChart2 },
                      ]
                    },
                    {
                      groupTitle: "Settings & Setup",
                      items: [
                        { tab: 'settings', label: 'Settings', icon: Settings },
                        { tab: 'plans', label: 'Billing & Plans', icon: Tag },
                        { tab: 'terms', label: 'Terms of Service', icon: FileText },
                        { tab: 'help-desk', label: 'Help Desk (Beta)', icon: HelpCircle }
                      ]
                    }
                  ].map((group, groupIdx) => (
                    <div key={`nav-group-${group.groupTitle}-${groupIdx}`} className="space-y-1">
                      <p className="px-2.5 pb-1.5 text-[8.5px] font-extrabold font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-800/30 pb-1 mb-1">
                        {group.groupTitle}
                      </p>
                      {group.items.map((item, idx) => {
                        const IconComponent = item.icon;
                        const isActive = item.tab === 'loyalty'
                          ? (activeTab === 'promo-hub' && promoHubSubTab === 'loyalty')
                          : item.tab === 'promo-hub'
                            ? (activeTab === 'promo-hub' && promoHubSubTab === 'stories')
                            : activeTab === item.tab;
                        return (
                          <button
                            key={`${item.tab}-${idx}`}
                            onClick={() => {
                              if (item.tab === 'loyalty') {
                                setPromoHubSubTab('loyalty');
                                setActiveTab('promo-hub');
                              } else if (item.tab === 'promo-hub') {
                                setPromoHubSubTab('stories');
                                setActiveTab('promo-hub');
                              } else {
                                setActiveTab(item.tab as any);
                              }
                              setIsNavMenuOpen(false);
                              triggerNotification(`Navigating to ${item.label}...`);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left ${
                              isActive 
                                ? 'bg-[#00ffcc]/10 text-[#00ffcc] border-l-2 border-[#00d195] font-bold' 
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/20'
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 ${isActive ? 'text-[#00ffcc]' : 'text-zinc-500'}`} />
                            <span>{item.label}</span>
                          </button>                        );
                      })}
                    </div>
                  ))}

                  {/* Omni-Portal Suite Console Switcher */}
                  <div className="pt-3 mt-3 border-t border-zinc-805/60 space-y-1.5">
                    {((userProfile?.email === 'admin@nexus.com' || userProfile?.account_type === 'admin')) && (
                      <React.Fragment>
                        <p className="px-2.5 pb-2 text-[8.5px] font-extrabold font-mono text-[#00ffcc] uppercase tracking-widest flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#00ffcc]/80" />
                          OMNI-ROLE SUITE SWITCHER
                        </p>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...userProfile,
                          active_workspace: 'band',
                          account_type: 'industry pro'
                        };
                        setUserProfile(updated as any);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        setActiveTab('home-v2');
                        setDashboardV2ActiveNav('EVENTS');
                        setIsNavMenuOpen(false);
                        triggerNotification('⚡ Switched to Band & Artist Operator Console.');
                        addLog('Switched user active session to Band console mode.');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left ${
                        userProfile?.active_workspace === 'band' || userProfile?.account_type === 'band'
                          ? 'bg-emerald-950/20 text-[#00ffcc] font-bold border-l-2 border-[#00d195]'
                          : 'text-zinc-400 hover:text-emerald-350 hover:bg-emerald-950/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-[#00ffcc]" />
                        <span>Band / Artist Workspace</span>
                      </div>
                      {(userProfile?.active_workspace === 'band' || userProfile?.account_type === 'band') && (
                        <span className="text-[7px] uppercase bg-emerald-950 border border-emerald-550 text-emerald-300 px-1.5 py-0.5 rounded leading-none font-black animate-pulse">
                          ACTIVE VIEW
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const registered = normalizeRegisteredWorkspaces(userProfile?.registered_workspaces, ['creative']);
                        const updated = {
                          ...userProfile,
                          active_workspace: 'creative',
                          account_type: 'creative',
                          registered_workspaces: registered,
                          creative_metadata: userProfile?.creative_metadata || {
                            business_name: userProfile?.name + ' Studio',
                            booking_email: userProfile?.email,
                            base_location: userProfile?.target_region || 'Austin, Texas',
                            portfolio_link: '',
                            bio: 'Creative visual artist, designer, or audio tech.',
                            day_rate: '$350 / Day',
                            pricing_notes: 'Rates available upon request',
                            gear: ['Digital Audio Desk', 'Photoshop CC'],
                            skills: ['Art Direction', 'Audio Post'],
                            primary_category: 'Artist/Designer'
                          }
                        };
                        setUserProfile(updated as any);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                        setActiveTab('creative');
                        setIsNavMenuOpen(false);
                        triggerNotification?.('⚡ Switched to Creative & Crew Showcase Portfolio.');
                        addLog?.('Switched user active session to Creative Showcase mode.');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left ${
                        userProfile?.active_workspace === 'creative' || userProfile?.account_type === 'creative'
                          ? 'bg-violet-950/20 text-violet-300 font-bold border-l-2 border-violet-500'
                          : 'text-zinc-400 hover:text-violet-300 hover:bg-violet-950/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                        <span>Creative / Crew Space</span>
                      </div>
                      {(userProfile?.active_workspace === 'creative' || userProfile?.account_type === 'creative') && (
                        <span className="text-[7px] uppercase bg-violet-950 border border-violet-800 text-violet-300 px-1.5 py-0.5 rounded leading-none font-black animate-pulse">
                          ACTIVE VIEW
                        </span>
                      )}
                    </button>                    
                    <button
                      onClick={() => {
                        const updated = {
                          ...userProfile,
                          active_workspace: 'promoter',
                          account_type: 'industry pro'
                        };
                        setUserProfile(updated as any);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        setIsNavMenuOpen(false);
                        triggerNotification?.("⚡ Switched to Venue Promoter Integrated Gateway.");
                        addLog?.("Switched user active session to Promoter gateway mode.");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left ${
                        userProfile?.active_workspace === 'promoter' || userProfile?.account_type === 'promoter'
                          ? 'bg-purple-950/25 text-purple-300 font-bold border-l-2 border-purple-500'
                          : 'text-zinc-400 hover:text-purple-300 hover:bg-purple-950/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Radio className="w-4 h-4 text-purple-500" />
                        <span>Venue Promoter Gateway</span>
                      </div>
                      {(userProfile?.active_workspace === 'promoter' || userProfile?.account_type === 'promoter') && (
                        <span className="text-[7px] uppercase bg-purple-950 border border-purple-800 text-purple-300 px-1.5 py-0.5 rounded leading-none font-black animate-pulse">
                          ACTIVE VIEW
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const updated = {
                          ...userProfile,
                          active_workspace: 'label',
                          account_type: 'industry pro'
                        };
                        setUserProfile(updated as any);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        setIsNavMenuOpen(false);
                        triggerNotification?.("⚡ Switched to Record Label HQ Terminal.");
                        addLog?.("Switched user active session to Label administration mode.");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left ${
                        userProfile?.active_workspace === 'label' || userProfile?.account_type === 'label'
                          ? 'bg-amber-950/25 text-[#FF9900] font-bold border-l-2 border-[#FF9900]'
                          : 'text-zinc-400 hover:text-amber-300 hover:bg-amber-950/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-[#FF9900]" />
                        <span>Record Label Terminal</span>
                      </div>
                      {(userProfile?.active_workspace === 'label' || userProfile?.account_type === 'label') && (
                        <span className="text-[7px] uppercase bg-amber-950 border border-[#FF9900]/50 text-[#FF9900] px-1.5 py-0.5 rounded leading-none font-black animate-pulse">
                          ACTIVE VIEW
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const updated = {
                          ...userProfile,
                          active_workspace: 'industry_pro',
                          account_type: 'industry pro'
                        };
                        setUserProfile(updated as any);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        setActiveTab('social');
                        setIsNavMenuOpen(false);
                        triggerNotification?.("⚡ Switched to Industry Pro.");
                        addLog?.("Switched user active session to Industry Pro mode.");
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left ${
                        userProfile?.active_workspace === 'industry_pro' || userProfile?.account_type === 'industry pro' || userProfile?.account_type === 'industry_pro'
                          ? 'bg-rose-950/25 text-rose-400 font-bold border-l-2 border-rose-500'
                          : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-950/15'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-rose-500" />
                        <span>Industry Pro</span>
                      </div>
                      {userProfile?.account_type === 'industry_pro' && (
                        <span className="text-[7px] uppercase bg-rose-950 border border-rose-500/50 text-rose-400 px-1.5 py-0.5 rounded leading-none font-black animate-pulse">
                          ACTIVE VIEW
                        </span>
                      )}
                    </button>
                      </React.Fragment>
                    )}
                    <button
                      onClick={() => {
                        const currentAcc = userProfile?.account_type || 'fan_only';
                        const isFanAcc = currentAcc === 'fan' || currentAcc === 'fan_only';
                        const isProAcc = currentAcc === 'industry_pro';
                        const isCreativeAcc = currentAcc === 'creative';
                        const isPromoterAcc = currentAcc === 'promoter';
                        const isLabelAcc = currentAcc === 'label';
                        const isBandAcc = currentAcc === 'band';

                        const updated = {
                          ...userProfile,
                          account_type: currentAcc
                        };
                        setUserProfile(updated as any);
                        localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                        if (isCreativeAcc) setActiveTab('creative');
                        else if (isPromoterAcc) setActiveTab('promoter');
                        else if (isLabelAcc) setActiveTab('label');
                        else if (isBandAcc) setActiveTab('home-v2');
                        else setActiveTab('social');
                        setIsNavMenuOpen(false);
                        triggerNotification?.("⚡ Opening your public profile...");
                        
                        // Give React a moment to render the view if it isn't already
                        setTimeout(() => {
                          window.dispatchEvent(new CustomEvent('openPublicProfile', {
                            detail: isCreativeAcc ? {
                              id: updated?.id || null,
                              name: (updated as any)?.creative_metadata?.business_name || (updated as any)?.creative_name || updated?.name || 'Vortex Graphics',
                              creative_name: (updated as any)?.creative_name || updated?.name,
                              business_name: (updated as any)?.creative_metadata?.business_name || (updated as any)?.creative_name || updated?.name || 'Vortex Graphics',
                              legalName: updated?.full_name || updated?.name,
                              avatar: (updated as any)?.creative_avatar || updated?.avatar_url || null,
                              avatar_url: (updated as any)?.creative_avatar || updated?.avatar_url || null,
                              banner: (updated as any)?.creative_banner || updated?.banner_url || null,
                              banner_url: (updated as any)?.creative_banner || updated?.banner_url || null,
                              cover_url: (updated as any)?.creative_banner || updated?.banner_url || null,
                              location: (updated as any)?.location || updated?.city || 'USA / Global',
                              role: 'Creative',
                              type: 'creative',
                              account_type: 'creative',
                              isCreativeProfile: true,
                              isPersonal: false,
                              isYou: true,
                              badges: ['🛠️ Creative Pro', '🎨 Designer'],
                              customBadges: ['🛠️ Creative Pro', '🎨 Designer'],
                              bio: updated?.bio || (updated as any)?.creative_metadata?.bio || 'Professional creative specialist on the Nexus network.',
                              handle: (updated as any)?.creative_handle || updated?.console_handle || 'vortexgraphics',
                              console_handle: (updated as any)?.creative_handle || updated?.console_handle || 'vortexgraphics',
                              creative_metadata: (updated as any)?.creative_metadata || {}
                            } : {
                              id: updated?.id || null,
                              name: updated?.name || updated?.full_name || 'Miguel Goregrinder Medina',
                              legalName: updated?.full_name || updated?.name || 'Miguel Goregrinder Medina',
                              handle: (updated?.console_handle && !updated.console_handle.toLowerCase().includes('virulent') && updated.console_handle !== '@user' && updated.console_handle !== 'user') 
                                ? (updated.console_handle.startsWith('@') ? updated.console_handle : `@${updated.console_handle}`) 
                                : '@bdmCEO',
                              console_handle: (updated?.console_handle && !updated.console_handle.toLowerCase().includes('virulent') && updated.console_handle !== '@user' && updated.console_handle !== 'user') 
                                ? (updated.console_handle.startsWith('@') ? updated.console_handle : `@${updated.console_handle}`) 
                                : '@bdmCEO',
                              username: (updated?.console_handle && !updated.console_handle.toLowerCase().includes('virulent') && updated.console_handle !== '@user' && updated.console_handle !== 'user') 
                                ? (updated.console_handle.startsWith('@') ? updated.console_handle : `@${updated.console_handle}`) 
                                : '@bdmCEO',
                              avatar: updated?.avatar_url || null,
                              avatar_url: updated?.avatar_url || null,
                              banner: updated?.banner_url || null,
                              banner_url: updated?.banner_url || null,
                              cover_url: updated?.banner_url || null,
                              location: (updated as any)?.location || 'USA / Global',
                              role: isFanAcc ? 'Fan Listener' : (isProAcc ? 'Industry Pro' : (updated?.role || 'Member')),
                              type: isFanAcc || isProAcc ? 'user' : (currentAcc || 'user'),
                              account_type: currentAcc,
                              isPersonal: isFanAcc || isProAcc,
                              isBandProfile: false,
                              isYou: true,
                              badges: (updated as any)?.badges || (isFanAcc ? ['🤘 Fan'] : ['💼 Industry Pro']),
                              customBadges: (updated as any)?.badges || (isFanAcc ? ['🤘 Fan'] : ['💼 Industry Pro']),
                              bio: (updated as any)?.bio || (updated as any)?.blurb || 'User profile on the Nexus network.',
                              followersCount: 0,
                              followingCount: 0,
                              hasProAccess: !isFanAcc
                            }
                          }));
                        }, 100);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/15"
                    >
                      <User className="w-4 h-4 text-emerald-500" />
                      <span>View My Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setLoginInitialTab('signup');
                        setIsLoggedOut(true);
                        setShowSplash(false);
                        setIsNavMenuOpen(false);
                        triggerNotification?.("Opening Create Account page...");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded font-medium text-xs font-mono tracking-wide transition-all duration-150 cursor-pointer text-left text-zinc-400 hover:text-emerald-300 hover:bg-emerald-950/15"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      <span>Create Another Account</span>
                    </button>                  </div>
                </div>

                {/* Footer Section with User Profile and LOGOUT */}
                <div className="p-4 border-t border-[#1b1e25] bg-[#07080a]/50 space-y-4">
                  {/* User avatar/name block */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-emerald-500/30 bg-zinc-800 flex items-center justify-center text-xs font-black">
                        {(() => {
                          const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                          if (r === 'band') return activeBand?.logo_url || null;
                          if (r === 'creative') return userProfile?.creative_avatar || null;
                          if (r === 'label') return userProfile?.label_avatar || null;
                          if (r === 'promoter') return userProfile?.promoter_logo || null;
                          return userProfile?.avatar_url || null;
                        })() ? (
                          <img 
                            src={(() => {
                              const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                              if (r === 'band') return activeBand?.logo_url;
                              if (r === 'creative') return userProfile?.creative_avatar;
                              if (r === 'label') return userProfile?.label_avatar;
                              if (r === 'promoter') return userProfile?.promoter_logo;
                              return userProfile?.avatar_url;
                            })() || ""} 
                            alt={userProfile?.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-emerald-400">
                            {(() => {
                              const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                              if (r === 'band') return activeBand?.name;
                              if (r === 'creative') return userProfile?.creative_metadata?.business_name;
                              if (r === 'label') return userProfile?.label_company_name;
                              if (r === 'promoter') return userProfile?.promoter_metadata?.brand_name;
                              return userProfile?.name;
                            })()?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-white truncate">
                          {(() => {
                            const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                            if (r === 'industry_pro') return 'Industry Pro';
                            if (r === 'fan_only') return 'Fan Only';
                            if (r === 'promoter') return userProfile?.promoter_metadata?.brand_name || 'Promoter Gateway';
                            if (r === 'creative') return userProfile?.creative_metadata?.business_name || 'Creative Hub';
                            if (r === 'label') return userProfile?.label_company_name || 'Pro Label';
                            return activeBand?.name || userProfile?.bandName || 'Artist';
                          })()}
                        </h5>
                        <p className="text-[10px] text-zinc-500 font-mono truncate">
                          {(() => {
                            const r = userProfile?.active_workspace || userProfile?.account_type || 'industry_pro';
                            if (r === 'industry_pro') return '@' + (userProfile?.console_handle || userProfile?.screen_name || 'pro_user').replace(/^@+/, '').replace(/\s+/g, '');
                            if (r === 'fan_only') return '@' + (userProfile?.console_handle || userProfile?.screen_name || 'fan_only').replace(/^@+/, '').replace(/\s+/g, '');
                            if (r === 'promoter') return '@' + ((userProfile as any)?.promoter_handle || 'promoter_pro').replace(/^@+/, '');
                            if (r === 'creative') return '@' + ((userProfile as any)?.creative_handle || 'creative_pro').replace(/^@+/, '');
                            if (r === 'label') return '@' + (userProfile?.label_url_slug || 'label_pro').replace(/^@+/, '');
                            return '@' + (activeBand?.name || userProfile?.bandName || 'band_core').replace(/^@+/, '').replace(/\s+/g, '');
                          })()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsNavMenuOpen(false);
                        handleOpenMyProfile();
                      }}
                      className="text-[8.5px] font-mono font-bold uppercase text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-400 px-2 py-1 rounded transition-colors"
                    >
                      View Profile
                    </button>                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('distro-deck');
                      setIsNavMenuOpen(false);
                      triggerNotification?.("Opening Our Feed & Music Alliances...");
                    }}
                    className="w-full text-left py-2 px-3 text-zinc-500 hover:text-zinc-300 font-mono text-[8.5px] uppercase tracking-wider flex items-center justify-between transition-colors group border-b border-transparent hover:border-[#39ff14]"
                  >
                    <span className="group-hover:text-[#39ff14] transition-colors flex items-center gap-2 font-bold font-mono">
                      ⚡ [ OUR FEED & MUSIC ALLIANCES ]
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('landing' as any);
                      setIsNavMenuOpen(false);
                    }}
                    className="w-full text-left py-2 px-3 text-zinc-500/80 hover:text-zinc-300 font-mono text-[8.5px] uppercase tracking-wider flex items-center justify-between transition-colors group border-b border-transparent hover:border-[#A855F7]"
                  >
                    <span className="group-hover:text-[#A855F7] transition-colors flex items-center gap-2 font-bold">
                      ● [ DEV TOOL // VIEW PUBLIC LANDING GATEWAY ]
                    </span>
                  </button>
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      localStorage.removeItem('nexus_core_user_profile'); setUserProfile(null); window.location.reload();
                      setIsNavMenuOpen(false);
                      triggerNotification?.("Session terminated. Signed out successfully.");
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 hover:border-red-500/50 text-red-300 hover:text-red-200 rounded font-mono font-black text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md active:scale-[0.98]"
                    title="Terminate active session and lock console"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


    </React.Fragment>
  );
}
