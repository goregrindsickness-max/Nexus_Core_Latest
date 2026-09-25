import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  CheckSquare,
  Banknote,
  ShoppingCart,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { UserProfile } from '../../../types';

export interface PromoterWorkspaceNavBannerProps {
  userProfile?: UserProfile | null;
  onNavigateToTab?: (tab: string, subNav?: string) => void;
  setActiveTab?: (tab: any) => void;
  triggerNotification?: (msg: string) => void;
  portalRole?: string;
}

export function PromoterWorkspaceNavBanner({
  userProfile,
  onNavigateToTab,
  setActiveTab,
  triggerNotification,
  portalRole
}: PromoterWorkspaceNavBannerProps) {
  const isPromoterRole = portalRole === 'promoter';
  if (!isPromoterRole) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_social_promoter_nav_expanded', String(next));
      } catch {}
      return next;
    });
  };

  const promoterAgencyName = userProfile?.promoter_metadata?.business_name || 'Promoter HQ';

  const workspaceNavItems = [
    { id: 'ROUTING', label: 'ROUTING', icon: MapPin, description: 'Tour Routing & Gig Beacons' },
    { id: 'WORKSPACE', label: 'WORKSPACE', icon: CheckSquare, description: 'Event Builder & Festival Planner' },
    { id: 'OFFERS', label: 'OFFERS', icon: Banknote, description: 'Contracts & In-App Offers Hub' },
    { id: 'SALES', label: 'SALES', icon: ShoppingCart, description: 'Live Ticket Sales & Ledger' },
    { id: 'SOCIAL', label: 'SOCIAL', icon: Globe, description: 'Promoter Alliance Social Network' },
    { id: 'SETTINGS', label: 'SETTINGS', icon: Settings, description: 'Promoter Profile & Agency Specs' }
  ];

  const handleNavClick = (itemId: string) => {
    if (itemId === 'SOCIAL') {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      triggerNotification?.('✨ Promoter Alliance Social Feed is currently active');
      return;
    }

    triggerNotification?.(`⚡ Switching to Promoter ${itemId} Workspace...`);
    if (onNavigateToTab) {
      onNavigateToTab('promoter', itemId);
    } else if (setActiveTab) {
      setActiveTab('promoter');
    } else {
      window.dispatchEvent(
        new CustomEvent('nexus_navigate', {
          detail: { tab: 'promoter', subNav: itemId }
        })
      );
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('promoter_active_tab', itemId);
      window.dispatchEvent(new CustomEvent('nexus_promoter_nav', { detail: itemId }));
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
          <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-black text-white group-hover:text-yellow-400 tracking-widest uppercase transition-colors">
              {promoterAgencyName}
            </span>
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold tracking-wider uppercase hidden xs:inline-block">
              PROMOTER PRO
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
              <ChevronUp className="w-3.5 h-3.5 text-yellow-400" />
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
                    key={`promoter-workspace-nav-${item.id}-${idx}`}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    title={item.description}
                    className="flex flex-col items-center justify-center w-full min-w-[44px] pt-0.5 pb-1 group relative transition-colors cursor-pointer"
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-yellow-500/15 blur-xl rounded-full w-10 h-10 mx-auto -z-10 animate-pulse" />
                    )}
                    <IconComponent
                      className={`w-5 h-5 mb-0.5 transition-all ${
                        isActive
                          ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] scale-110'
                          : 'text-zinc-500 group-hover:text-zinc-300 group-hover:scale-105'
                      }`}
                    />
                    <span
                      className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors ${
                        isActive ? 'text-yellow-400 font-black drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'text-zinc-500 group-hover:text-zinc-300'
                      }`}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="w-8 h-[3px] bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.8)] rounded-t-full absolute bottom-0" />
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
