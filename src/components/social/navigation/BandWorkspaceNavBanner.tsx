import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  ShoppingCart,
  Tag,
  TrendingUp,
  Globe,
  Settings,
  Mic,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Radio,
  Sparkles
} from 'lucide-react';
import { Band, UserProfile } from '../../../types';
import { resolveBandName } from '../../../utils/bandProfileUtils';

export interface BandWorkspaceNavBannerProps {
  activeBand?: Band | null;
  userProfile?: UserProfile | null;
  onNavigateToTab?: (tab: string, subNav?: string) => void;
  setActiveTab?: (tab: any) => void;
  setDashboardV2ActiveNav?: (nav: any) => void;
  triggerNotification?: (msg: string) => void;
  portalRole?: string;
}

export function BandWorkspaceNavBanner({
  activeBand,
  userProfile,
  onNavigateToTab,
  setActiveTab,
  setDashboardV2ActiveNav,
  triggerNotification,
  portalRole
}: BandWorkspaceNavBannerProps) {
  // Only render for Band/Artist workspace role - NEVER for Industry Pro, Promoter, Creative, Label or Fan
  const isBandRole = portalRole === 'band' || portalRole === 'artist';
  if (!isBandRole) {
    return null;
  }

  // State for collapsible container - default to collapsed, with localStorage persistence
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nexus_social_band_nav_expanded');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_social_band_nav_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const bandDisplayName = resolveBandName(activeBand, userProfile) || 'Band / Artist';

  const workspaceNavItems = [
    { id: 'EVENTS', label: 'EVENTS', icon: Calendar, description: 'Shows, Tour Routing & Gig Schedules' },
    { id: 'SALES', label: 'SALES', icon: ShoppingCart, description: 'POS Register & Merch Settlements' },
    { id: 'MERCH', label: 'MERCH', icon: Tag, description: 'Inventory Counts & Gear Catalog' },
    { id: 'FINANCE', label: 'FINANCE', icon: TrendingUp, description: 'Tour Ledgers, P&L & Cash Drawer' },
    { id: 'SOCIAL', label: 'SOCIAL', icon: Globe, description: 'Universal Scene Feed & Fan Community' },
    { id: 'SETTINGS', label: 'SETTINGS', icon: Settings, description: 'Portal Config & Band Information' },
    { id: 'STUDIO', label: 'STUDIO', icon: Mic, description: 'Multi-Track DAW & Audio Session Hub' }
  ];

  const handleNavClick = (itemId: string) => {
    if (itemId === 'SOCIAL') {
      // Already on the Social feed
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      triggerNotification?.('✨ Scene Social Feed is currently active');
      return;
    }

    if (itemId === 'STUDIO') {
      triggerNotification?.('🎙️ Switching to Studio Workspace...');
      if (onNavigateToTab) {
        onNavigateToTab('studio');
      } else if (setActiveTab) {
        setActiveTab('studio');
      } else {
        window.dispatchEvent(new CustomEvent('nexus_navigate', { detail: { tab: 'studio' } }));
      }
      return;
    }

    // EVENTS, SALES, MERCH, FINANCE, SETTINGS
    triggerNotification?.(`⚡ Switching to Band ${itemId} Workspace...`);
    if (setDashboardV2ActiveNav) {
      setDashboardV2ActiveNav(itemId as any);
    }
    if (onNavigateToTab) {
      onNavigateToTab('home-v2', itemId);
    } else if (setActiveTab) {
      setActiveTab('home-v2');
    } else {
      window.dispatchEvent(
        new CustomEvent('nexus_navigate', {
          detail: { tab: 'home-v2', subNav: itemId }
        })
      );
    }
  };

  return (
    <div className="w-full bg-[#08090c] border-b border-zinc-900/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)] relative z-25">
      {/* Collapsible Bar Header / Quick Drawer Trigger */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0c0e12]/90 border-b border-zinc-900/60 select-none">
        <button
          type="button"
          onClick={toggleExpanded}
          className="flex items-center gap-2 text-left group cursor-pointer focus:outline-none"
        >
          <div className="w-2 h-2 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14] animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-white group-hover:text-[#39ff14] tracking-widest uppercase transition-colors">
              {bandDisplayName}
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] font-bold tracking-wider uppercase hidden xs:inline-block">
              WORKSPACE
            </span>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider hidden sm:inline-block">
            {isExpanded ? 'Active: SOCIAL' : 'Workspace Switcher'}
          </span>
          <button
            type="button"
            onClick={toggleExpanded}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all text-[9px] font-mono font-bold tracking-wider uppercase cursor-pointer"
            title={isExpanded ? 'Collapse Workspace Nav' : 'Expand Workspace Nav'}
          >
            <span className="text-[8px] text-zinc-400">{isExpanded ? 'COLLAPSE' : 'EXPAND'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#39ff14]" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>
        </div>
      </div>

      {/* Nav Bar Items (Collapsible) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-around px-1 py-[7px] relative w-full bg-[#0c0e12] overflow-x-auto no-scrollbar">
              {workspaceNavItems.map((item, idx) => {
                const IconComponent = item.icon;
                const isActive = item.id === 'SOCIAL';

                return (
                  <button
                    key={`social-workspace-nav-${item.id}-${idx}`}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    title={item.description}
                    className="flex flex-col items-center justify-center w-full min-w-[44px] pt-0.5 pb-1 group relative transition-colors cursor-pointer"
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-[#39ff14]/15 blur-xl rounded-full w-10 h-10 mx-auto -z-10 animate-pulse" />
                    )}
                    <IconComponent
                      className={`w-5 h-5 mb-0.5 transition-all ${
                        isActive
                          ? 'text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.8)] scale-110'
                          : 'text-zinc-500 group-hover:text-zinc-300 group-hover:scale-105'
                      }`}
                    />
                    <span
                      className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors ${
                        isActive ? 'text-[#39ff14] font-black drop-shadow-[0_0_5px_rgba(57,255,20,0.5)]' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="w-8 h-[3px] bg-[#39ff14] shadow-[0_0_12px_rgba(57,255,20,0.8)] rounded-t-full absolute bottom-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
