import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  Sparkles,
  UserPlus,
  Heart,
  MessageSquare,
  Share2,
  ShoppingBag,
  Calendar,
  ArrowRight,
  Clock,
  Flame,
  ShieldAlert,
  Megaphone,
  Radio,
  Volume2,
  Zap,
  Check
} from 'lucide-react';
import { pushManager, PushPermissionStatus, isIframeEnvironment } from '../../../lib/pushNotifications';

interface RightNotificationsDrawerProps {
  rightDrawerOpen: boolean;
  setRightDrawerOpen: (open: boolean) => void;
  unreadNotifsCount: number;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  notifFilter: string;
  setNotifFilter: (filter: any) => void;
  markAllNotifsAsRead: () => void;
  clearAllNotifs: () => void;
  deleteNotif: (id: string) => void;
  setActiveTab: (tab: any) => void;
  setSelectedChatId?: (id: string | null) => void;
  userProfile?: any;
}

export const RightNotificationsDrawer: React.FC<RightNotificationsDrawerProps> = ({
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
  setActiveTab,
  setSelectedChatId,
  userProfile
}) => {
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const inIframe = isIframeEnvironment();

  useEffect(() => {
    setPermissionStatus(pushManager.getPermissionStatus());

    const handleInAppNotice = (e: any) => {
      const notice = e.detail;
      if (notice) {
        setNotifications((prev) => [notice, ...prev]);
      }
    };

    const handleSyncStatus = () => {
      setPermissionStatus(pushManager.getPermissionStatus());
    };

    window.addEventListener('nexus_in_app_notice', handleInAppNotice);
    window.addEventListener('focus', handleSyncStatus);
    document.addEventListener('visibilitychange', handleSyncStatus);

    return () => {
      window.removeEventListener('nexus_in_app_notice', handleInAppNotice);
      window.removeEventListener('focus', handleSyncStatus);
      document.removeEventListener('visibilitychange', handleSyncStatus);
    };
  }, []);

  const handleAllowNotifications = async () => {
    setIsRequesting(true);
    try {
      const status = await pushManager.requestPermission({
        id: userProfile?.id,
        email: userProfile?.email
      });
      setPermissionStatus(status);
      if (status === 'granted') {
        pushManager.notify({
          title: 'Device Notifications Allowed',
          body: 'You will receive real-time alerts on this device.',
          category: 'general'
        });
      } else if (inIframe) {
        window.open(window.location.href, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.warn('Allow notifications error:', err);
      if (inIframe) {
        window.open(window.location.href, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  if (!rightDrawerOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === 'unread') return !n.read;
    if (notifFilter === 'social') return ['like', 'comment', 'mention', 'share', 'follow'].includes(n.type);
    if (notifFilter === 'system') return ['system', 'alert', 'security', 'gig', 'shop'].includes(n.type);
    return true;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'mention':
        return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
      case 'share':
        return <Share2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
      case 'shop':
        return <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />;
      case 'gig':
        return <Calendar className="w-3.5 h-3.5 text-rose-400" />;
      case 'alert':
      case 'security':
        return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
      case 'system':
      default:
        return <Megaphone className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex justify-end">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => setRightDrawerOpen(false)}
      />

      <div className="relative w-[85%] sm:w-96 max-w-sm bg-[#050608] border-l border-zinc-900 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-[0_0_80px_rgba(0,0,0,0.95)] bg-[radial-gradient(#1c1d24_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Top Right Aura Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-rose-950/20 rounded-full blur-[90px] pointer-events-none z-0" />
        <div className="absolute bottom-10 left-0 w-60 h-60 bg-purple-950/15 rounded-full blur-[80px] pointer-events-none z-0" />

        {/* Drawer Header */}
        <div className="relative p-4 border-b border-zinc-900/80 flex justify-between items-center bg-[#08090d]/90 backdrop-blur z-10">
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500 animate-pulse" /> Alerts & Notices
            </h2>
            {unreadNotifsCount > 0 && (
              <span className="text-[10px] text-rose-400 font-bold uppercase mt-0.5 tracking-wider font-mono">
                {unreadNotifsCount} UNREAD NOTIFICATIONS
              </span>
            )}
          </div>
          <button
            onClick={() => setRightDrawerOpen(false)}
            className="w-8 h-8 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar & Quick Actions */}
        <div className="p-3 border-b border-zinc-900/60 bg-[#06070a]/80 backdrop-blur z-10 flex flex-col gap-2.5">
          {/* Allow Device Notifications Button */}
          {permissionStatus !== 'granted' ? (
            <button
              id="allow-device-notifications-btn"
              onClick={handleAllowNotifications}
              disabled={isRequesting}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer border border-rose-500/30 disabled:opacity-60"
            >
              <Bell className="w-3.5 h-3.5 fill-current" />
              {isRequesting ? 'Authorizing...' : 'Allow Device Notifications'}
            </button>
          ) : (
            <div className="w-full py-1.5 px-3 rounded-lg bg-zinc-900/80 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-zinc-300">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <Check className="w-3.5 h-3.5" /> Device Notifications Allowed
              </span>
              <button
                onClick={() => pushManager.simulatePush('routing_beacon')}
                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                title="Send test alert"
              >
                Test
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'ALL' },
              { id: 'unread', label: 'UNREAD' },
              { id: 'social', label: 'SOCIAL' },
              { id: 'system', label: 'SYSTEM' }
            ].map((f, fIdx) => (
              <button
                key={`notif-filter-${f.id}-${fIdx}`}
                onClick={() => setNotifFilter(f.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
                  notifFilter === f.id
                    ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                    : 'bg-zinc-900/80 text-zinc-400 border border-zinc-800/80 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-zinc-900/50">
            <button
              onClick={markAllNotifsAsRead}
              className="text-[10px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 font-mono font-bold transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3 h-3 text-emerald-500" /> MARK ALL READ
            </button>
            <button
              onClick={clearAllNotifs}
              className="text-[10px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> CLEAR ALL
            </button>
          </div>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 relative z-10 custom-scrollbar">
          {filteredNotifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-center text-zinc-600">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">NO NOTIFICATIONS</p>
                <p className="text-[10px] text-zinc-600 font-mono mt-1">You are all caught up for now!</p>
              </div>
            </div>
          ) : (
            filteredNotifs.map((n, nIdx) => (
              <div
                key={n.id ? `notif-${n.id}-${nIdx}` : `notif-${nIdx}`}
                onClick={() => {
                  if (!n.read) {
                    setNotifications((prev) =>
                      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
                    );
                  }
                  if (n.targetTab) {
                    setActiveTab(n.targetTab);
                    if (n.targetChatId && setSelectedChatId) {
                      setSelectedChatId(n.targetChatId);
                    }
                    setRightDrawerOpen(false);
                  }
                }}
                className={`group relative p-3 rounded-2xl border transition-all cursor-pointer ${
                  !n.read
                    ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/60 shadow-[0_0_20px_rgba(225,29,72,0.08)]'
                    : 'bg-zinc-950/40 border-zinc-900/80 hover:border-zinc-800 hover:bg-zinc-900/40'
                }`}
              >
                {!n.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                )}

                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    {n.avatar ? (
                      <img
                        src={n.avatar}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover border border-zinc-800"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                        {getNotifIcon(n.type)}
                      </div>
                    )}
                    {n.avatar && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow">
                        {getNotifIcon(n.type)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                        {n.title || n.user || 'Scene Notice'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug mt-0.5 line-clamp-2">{n.message || n.text}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {n.time || 'Just now'}
                      </span>
                      {n.targetTab && (
                        <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-0.5">
                          VIEW <ArrowRight className="w-2 h-2" />
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotif(n.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-400 transition-all rounded cursor-pointer"
                    title="Delete notice"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info stamp */}
        <div className="p-3 border-t border-zinc-900/80 bg-[#06070a] text-center z-10">
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
            NEXUS NOTIFICATION MATRIX • ENCRYPTED LIVE FEED
          </span>
        </div>
      </div>
    </div>
  );
};
