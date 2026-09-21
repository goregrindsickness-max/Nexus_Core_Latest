import React, { useEffect } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Users, 
  Camera, 
  Video, 
  MessageSquare, 
  Bell 
} from 'lucide-react';
import { useChats } from '../../hooks/useChats';

interface SocialSubNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNotices?: () => void;
  noticesCount?: number;
}

export const SocialSubNav: React.FC<SocialSubNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNotices,
  noticesCount = 0,
}) => {
  const { totalUnreadCount, refetch } = useChats();

  // Listen for global read/update events across the workspace
  useEffect(() => {
    const handleSync = () => refetch();

    window.addEventListener('nexus_chats_updated', handleSync);
    window.addEventListener('nexus_chat_read', handleSync);
    window.addEventListener('nexus_all_read', handleSync);

    return () => {
      window.removeEventListener('nexus_chats_updated', handleSync);
      window.removeEventListener('nexus_chat_read', handleSync);
      window.removeEventListener('nexus_all_read', handleSync);
    };
  }, [refetch]);

  const navItems = [
    { id: 'feed', label: 'FEED', icon: Home },
    { id: 'shop', label: 'SHOP', icon: ShoppingBag },
    { id: 'forum', label: 'FORUM', icon: Users },
    { id: 'photopit', label: 'PHOTO PIT', icon: Camera },
    { id: 'clips', label: 'CLIPS', icon: Video },
    { id: 'inbox', label: 'INBOX', icon: MessageSquare, badge: totalUnreadCount },
    { id: 'notices', label: 'NOTICES', icon: Bell, badge: noticesCount, onClick: onOpenNotices },
  ];

  return (
    <div className="w-full bg-zinc-950/90 border-b border-zinc-800 px-1 py-1 flex items-center justify-around gap-0.5 sm:gap-1 sticky top-0 z-30 overflow-x-auto no-scrollbar">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const hasBadge = item.badge !== undefined && item.badge > 0;

        return (
          <button
            key={`social-subnav-${item.id}-${idx}`}
            onClick={() => {
              if (item.onClick) {
                item.onClick();
              } else {
                setActiveTab(item.id);
              }
            }}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 sm:px-2 relative group transition-colors cursor-pointer flex-1 min-w-0 shrink-0"
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 mb-1 transition-all ${
                  isActive
                    ? 'text-[#00ffcc] drop-shadow-[0_0_8px_rgba(0,255,204,0.8)] scale-110'
                    : 'text-zinc-400 group-hover:text-white'
                }`}
              />
              {hasBadge && (
                <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-violet-600 px-1 text-[9px] font-bold text-white shadow-lg ring-2 ring-black animate-pulse">
                  {item.badge! > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${
                isActive ? 'text-[#00ffcc]' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              {item.label}
            </span>
            {isActive && (
              <div className="w-8 h-[2px] bg-[#00ffcc] shadow-[0_0_10px_#00ffcc] rounded-full absolute bottom-0" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SocialSubNav;
