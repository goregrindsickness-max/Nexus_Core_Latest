import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '../supabase';
import { DbNotification, UserProfile } from '../types';
import { pushManager } from '../lib/pushNotifications';
import { 
  Bell, 
  X, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  Layers, 
  ArrowRight, 
  Search, 
  Trash2, 
  CheckCheck, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Info, 
  MessageSquare, 
  Tag, 
  Zap, 
  Eye, 
  PlusCircle,
  HelpCircle,
  TrendingUp,
  Inbox
} from 'lucide-react';

interface NotificationCenterViewProps {
  userProfile: UserProfile;
  notifications: DbNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<DbNotification[]>>;
  onMarkAsRead: (id: string) => void;
  onNavigateToInventory: () => void;
  onNavigateToPost?: (postId: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerNotification?: (msg: string) => void;
  hideTrigger?: boolean;
}

export default function NotificationCenterView({
  userProfile,
  notifications,
  setNotifications,
  onMarkAsRead,
  onNavigateToInventory,
  onNavigateToPost,
  isOpen,
  onClose,
  triggerNotification,
  hideTrigger = false
}: NotificationCenterViewProps) {
  const [liveBanner, setLiveBanner] = useState<DbNotification | null>(null);
  
  // Custom states for upgraded interactivity
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [showSimulateBlock, setShowSimulateBlock] = useState(false);

  // Maintain mutable values inside refs to prevent destroying and resubscribing the Supabase realtime channel
  const userProfileRef = React.useRef(userProfile);
  const isSoundEnabledRef = React.useRef(isSoundEnabled);
  const triggerNotificationRef = React.useRef(triggerNotification);

  React.useEffect(() => {
    userProfileRef.current = userProfile;
  }, [userProfile]);

  React.useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  React.useEffect(() => {
    triggerNotificationRef.current = triggerNotification;
  }, [triggerNotification]);

  // Play custom synth auditory cue (purely client-side synth synthesizer)
  const playBeep = (freq = 600, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!isSoundEnabledRef.current) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn("Web Audio blocked", e);
    }
  };

  // Set up Supabase Live Subscription Pipeline
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    console.log('[NotificationCenter] Initializing realtime channel listening on nexus_notifications table.');

    // Generate a unique channel name to prevent overlapping channel instances/memory leaks
    const channelId = `notifications-realtime-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nexus_notifications'
        },
        (payload: any) => {
          const rawNotif = payload.new as any;
          if (!rawNotif) return;

          const newNotif: DbNotification = {
            ...rawNotif,
            message: rawNotif.message || rawNotif.content || rawNotif.title || rawNotif.body || '',
            category: rawNotif.category || rawNotif.type || 'SYSTEM'
          };

          const currentUser = userProfileRef.current;
          const matchesUser = !newNotif.user_id || newNotif.user_id === currentUser?.id || newNotif.user_id === currentUser?.email;
          if (!matchesUser) return;

          setNotifications(prev => {
            const exists = (prev || []).some(n => n.id === newNotif.id);
            if (exists) return prev;

            // Deep duplicate check by message and category within 5 seconds window
            const newNotifTime = new Date(newNotif.created_at || Date.now()).getTime();
            const isDuplicate = (prev || []).some(n => 
              n.category === newNotif.category && 
              n.message === newNotif.message && 
              Math.abs(new Date(n.created_at || Date.now()).getTime() - newNotifTime) < 5000
            );
            if (isDuplicate) return prev;

            const updated = [newNotif, ...prev];
            localStorage.setItem('nexus_core_notifications', JSON.stringify(updated));
            return updated;
          });

          // Play incoming notification chime sound
          playBeep(880, 'triangle', 0.15);

          // Dispatch OS / Browser Push Notification
          pushManager.notify({
            title: `⚡ Nexus Alert [${newNotif.category}]`,
            body: newNotif.message,
            category: newNotif.category?.toLowerCase() || 'system',
            priority: newNotif.requires_push ? 'P0' : 'P1',
            targetTab: 'social',
            data: {
              notificationId: newNotif.id,
              category: newNotif.category,
            },
          });

          if (newNotif.requires_push) {
            setLiveBanner(newNotif);
          } else {
            const currentTrigger = triggerNotificationRef.current;
            if (currentTrigger) {
              currentTrigger(`New Alert: ${newNotif.message}`);
            }
          }
        }
      )
      .subscribe();

    const handleAllReadEvent = () => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })));
    };
    window.addEventListener('nexus_all_read', handleAllReadEvent);

    return () => {
      window.removeEventListener('nexus_all_read', handleAllReadEvent);
      supabase.removeChannel(channel).then();
    };
  }, [setNotifications]); // completely stable dependency array, avoids double subscriptions entirely!

  const handleActionLink = (notif: DbNotification) => {
    playBeep(440, 'sine', 0.05);
    onMarkAsRead(notif.id);
    onNavigateToInventory();
    if (triggerNotification) {
      triggerNotification("Routing to Inventory discrepancy sheets...");
    }
  };

  // 100% foolproof display-level deduplication layer
  const deduplicatedNotifications = useMemo(() => {
    const seenIds = new Set<string>();
    const seenMessages = new Map<string, number>(); // messageKey -> timestamp
    
    return notifications.filter(notif => {
      if (!notif || !notif.id) return false;
      
      // 1. Check ID duplication
      if (seenIds.has(notif.id)) {
        return false;
      }
      seenIds.add(notif.id);
      
      // 2. Check content duplication (within 5 seconds)
      const msgKey = `${notif.category || ''}:${notif.message}`;
      const notifTime = new Date(notif.created_at).getTime();
      
      if (seenMessages.has(msgKey)) {
        const prevTime = seenMessages.get(msgKey)!;
        if (Math.abs(notifTime - prevTime) < 5000) {
          return false;
        }
      }
      seenMessages.set(msgKey, notifTime);
      return true;
    });
  }, [notifications]);

  const unreadCount = useMemo(() => {
    return deduplicatedNotifications.filter(n => !n.is_read).length;
  }, [deduplicatedNotifications]);

  // Handle Mark All as Read
  const handleMarkAllAsRead = () => {
    playBeep(520, 'sine', 0.1);
    deduplicatedNotifications.forEach(n => {
      if (!n.is_read) onMarkAsRead(n.id);
    });
    if (triggerNotification) triggerNotification("All alerts logged as read.");
  };

  // Handle clear/delete all
  const handleClearAll = () => {
    playBeep(330, 'sawtooth', 0.12);
    if (window.confirm("Are you sure you want to clear all notifications from local list?")) {
      setNotifications([]);
      localStorage.setItem('nexus_core_notifications', JSON.stringify([]));
      if (triggerNotification) triggerNotification("Cleared notification console.");
    }
  };

  // Trigger simulated demo alert for rich interactive experience
  const simulateNotification = (category: string) => {
    const id = `sim-${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    let message = '';
    let requires_push = false;

    if (category === 'INVENTORY REFILL') {
      const items = ['Classic Vintage Tee', 'Skull Emblem Pullover', 'Alternative Logo Hoodie', 'Enamel Band Pins [Set of 3]'];
      const item = items[Math.floor(Math.random() * items.length)];
      const sizes = ['S', 'M', 'L', 'XL'];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      message = `Low Stock warning: Only 3 units remaining of "${item} (${size})" in primary venue bins. Pull from backup van stockpile advised!`;
      requires_push = true;
    } else if (category === 'CURFEW UPDATE') {
      const venueAlerts = [
        "Head promoter confirmed extremely strict 11:00 PM curfew limit tonight due to city ordinance violations. Excess time will trigger auto stage mute.",
        "Local police monitored DB meter active at center sound mixing dock. Please balance guitar frequency peaks below 98dB.",
        "Set adjustment alert: Backline changeovers running 12 mins delayed. Curfew hard shut unchanged at midnight."
      ];
      message = venueAlerts[Math.floor(Math.random() * venueAlerts.length)];
      requires_push = true;
    } else if (category === 'MARKET OFFER') {
      const guarantee = 1500 + Math.floor(Math.random() * 20) * 100;
      const venue = ['Starlight Ballroom', 'Underground Vaults', 'Electric Oasis', 'The Iron Foundry', 'Cosmic Lounge'][Math.floor(Math.random() * 5)];
      message = `New verified flash booking inquiry: "${venue}" offered a $${guarantee} direct guarantee plus 85% merch cut for next open Thursday!`;
      requires_push = false;
    } else {
      const telemetry = [
        "Cloud-based transaction log partition verified. Backup encryption locked securely to central databases.",
        "Automatic server check complete. Sync pipelines running smoothly with Supabase and Stripe endpoints.",
        "Master venue settlement calculated cleanly with zero manual overrides registered."
      ];
      message = telemetry[Math.floor(Math.random() * telemetry.length)];
      category = 'SYSTEM';
      requires_push = false;
    }

    const mockNotif: DbNotification = {
      id,
      created_at: timestamp,
      message,
      category,
      requires_push,
      is_read: false
    };

    setNotifications(prev => {
      // Check if there is an existing notification with the same message and category within 5 seconds
      const newNotifTime = new Date(mockNotif.created_at).getTime();
      const isDuplicate = (prev || []).some(n => 
        n.category === mockNotif.category && 
        n.message === mockNotif.message && 
        Math.abs(new Date(n.created_at).getTime() - newNotifTime) < 5000
      );
      if (isDuplicate) return prev;

      const updated = [mockNotif, ...prev];
      localStorage.setItem('nexus_core_notifications', JSON.stringify(updated));
      return updated;
    });

    playBeep(980, 'sine', 0.12);

    if (requires_push) {
      setLiveBanner(mockNotif);
    } else {
      if (triggerNotification) {
        triggerNotification(`[Sim] ${category} Alert Loaded!`);
      }
    }
  };

  // Dynamically group categories for navigation sidebar pills
  const availableCategories = useMemo(() => {
    const cats = new Set(deduplicatedNotifications.map(n => n.category).filter(Boolean));
    return ['ALL', ...Array.from(cats)];
  }, [deduplicatedNotifications]);

  // Filter list of notifications based on text query and category pill selector
  const filteredNotifications = useMemo(() => {
    return deduplicatedNotifications.filter(notif => {
      const matchesSearch = 
        notif.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (notif.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = 
        selectedCategory === 'ALL' || 
        notif.category?.toUpperCase() === selectedCategory.toUpperCase();
        
      return matchesSearch && matchesCategory;
    });
  }, [deduplicatedNotifications, searchQuery, selectedCategory]);

  // Style attributes mapping based on notification types
  const getCategoryStyles = (category: string) => {
    const cleanCat = (category || '').toUpperCase();
    if (cleanCat.includes('REFILL') || cleanCat.includes('STOCK')) {
      return {
        bg: 'bg-amber-500/10 hover:bg-amber-500/15',
        border: 'border-amber-500/40',
        text: 'text-amber-400',
        glow: 'glow-amber',
        icon: '⚠️',
        accentLine: 'bg-amber-500'
      };
    }
    if (cleanCat.includes('CURFEW') || cleanCat.includes('ALERT')) {
      return {
        bg: 'bg-rose-500/10 hover:bg-rose-500/15',
        border: 'border-rose-500/40',
        text: 'text-rose-400',
        glow: 'glow-rose',
        icon: '🚨',
        accentLine: 'bg-rose-500'
      };
    }
    if (cleanCat.includes('OFFER') || cleanCat.includes('MARKET')) {
      return {
        bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
        border: 'border-emerald-500/40',
        text: 'text-emerald-400',
        glow: 'glow-emerald',
        icon: '✨',
        accentLine: 'bg-emerald-500'
      };
    }
    return {
      bg: 'bg-indigo-500/10 hover:bg-indigo-500/15',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      glow: 'glow-indigo',
      icon: '⚙️',
      accentLine: 'bg-indigo-500'
    };
  };

  return (
    <>
      {/* MONOSPACE NOTIFICATION INDICATOR / BELL BUTTON (With Pulse animation when unread count > 0) */}
      {!hideTrigger && (
        <button
          id="dashboard-header-bell"
          onClick={() => {
            playBeep(700, 'sine', 0.05);
            onClose();
          }}
          style={{ width: '98.63px', height: '33.1696px' }}
          className="relative flex items-center justify-center gap-2 cursor-pointer select-none font-mono text-[11px] font-bold border-2 border-zinc-800 rounded-lg bg-zinc-950/90 hover:border-purple-500 active:scale-95 transition-all z-20 group"
          title="Toggle Notification Center Drawer"
        >
          <span className={`text-[12px] group-hover:scale-110 group-hover:rotate-12 transition-transform duration-200 ${unreadCount > 0 ? 'animate-bounce' : ''}`}>
            🔔
          </span>
          <span className="text-zinc-400 uppercase tracking-wider text-[9px] font-extrabold">ALERTS:</span>
          <span className={`font-mono transition-colors font-black ${
            unreadCount > 0 
              ? 'text-[#00ffcc] font-black' 
              : 'text-zinc-500'
          }`}>
            {unreadCount}
          </span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ffcc]"></span>
            </span>
          )}
          <span className="absolute top-[34px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] text-zinc-500 font-mono tracking-widest uppercase font-black group-hover:text-purple-400 transition-colors pointer-events-none">
            Notifications
          </span>
        </button>
      )}

      {/* FULL-MODERN SLIDE DRAWER VIEW CONTROLLER */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop frosted screen overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                playBeep(400, 'sine', 0.05);
                onClose();
              }}
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-40"
            />

            {/* Slide drawer container */}
            <motion.div
              initial={{ x: '100%', opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-zinc-950 text-zinc-100 z-50 flex flex-col shadow-[-10px_0_50px_rgba(0,0,0,0.85)] border-l border-zinc-800/80 font-sans"
              id="notification-central-drawer"
            >
              
              {/* HEADER CONTAINER with Premium Look */}
              <div className="p-5 pb-4 border-b border-zinc-900 bg-zinc-950 flex flex-col gap-3 relative overflow-hidden">
                {/* Visual Accent Layer */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-10 w-24 h-24 bg-teal-500/8px rounded-full blur-2xl pointer-events-none" />

                {/* Centered Main Header Content */}
                <div className="flex flex-col items-center justify-center text-center pt-6 pb-2 z-10">
                  <img 
                    src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png" 
                    alt="Nexus Core logo" 
                    className="object-contain mb-3"
                    style={{ width: '129.9783px', height: '52.9957px' }}
                    referrerPolicy="no-referrer"
                  />
                  <h2 
                    className="font-bold tracking-tight bg-gradient-to-r from-purple-400 via-fuchsia-300 to-[#00ffcc] bg-clip-text text-transparent uppercase text-center"
                    style={{ fontSize: '26px', lineHeight: '25px', textAlign: 'center' }}
                  >
                    NOTIFICATION CENTER
                  </h2>
                  <p className="text-[10px] text-zinc-500 font-mono mt-2 uppercase tracking-widest text-center">
                    Real-time Venue feed
                  </p>
                </div>

                {/* Control Buttons - absolute top-right corners */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
                  {/* Audio Feedback Controller */}
                  <button
                    onClick={() => {
                      setIsSoundEnabled(!isSoundEnabled);
                      if(!isSoundEnabled) {
                        setTimeout(() => {
                          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = ctx.createOscillator();
                          const gain = ctx.createGain();
                          osc.connect(gain);
                          gain.connect(ctx.destination);
                          osc.start();
                          osc.stop(ctx.currentTime + 0.1);
                        }, 50);
                      }
                    }}
                    className={`p-2 rounded-lg border transition-colors ${
                      isSoundEnabled 
                        ? 'border-zinc-800 bg-zinc-900/50 text-purple-400 hover:text-purple-300' 
                        : 'border-zinc-900 bg-zinc-950/40 text-zinc-600 hover:text-zinc-500'
                    }`}
                    title={isSoundEnabled ? "Mute alert chimes" : "Unmute alert chimes"}
                  >
                    {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => {
                      playBeep(450, 'sine', 0.05);
                      onClose();
                    }}
                    className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Subtitle status row */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mt-1 pt-2 border-t border-zinc-900/40 z-10">
                  <span className="truncate">USER PROFILE: <strong className="text-zinc-300">{userProfile?.email}</strong></span>
                  <span className="flex items-center gap-1 shrink-0 text-emerald-400 font-bold bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/50">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    LIVE ROUTED
                  </span>
                </div>
              </div>

              {/* SEARCH & INTERACTIVE PLAYGROUND BUTTON BAR */}
              <div className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-900 flex flex-col gap-3">
                {/* Search query input */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recent broadcast logs..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-purple-500/80 rounded-lg pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 placeholder-zinc-500 transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Categories Pill Navigation Selector */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none items-center">
                  <span className="text-[10px] font-bold font-mono text-zinc-500 mr-1 uppercase flex items-center gap-0.5">
                    <Tag className="w-3 h-3 text-purple-500" /> Tags:
                  </span>
                  {['ALL', 'INVENTORY REFILL', 'CURFEW UPDATE', 'MARKET OFFER', 'SYSTEM'].map((catName, cIdx) => {
                    const isSelected = selectedCategory === catName;
                    const count = catName === 'ALL' 
                      ? notifications.length 
                      : notifications.filter(n => n.category?.toUpperCase() === catName).length;
                    
                    return (
                      <button
                        key={`${catName}-${cIdx}`}
                        onClick={() => {
                          playBeep(650, 'sine', 0.05);
                          setSelectedCategory(catName);
                        }}
                        className={`text-[9.5px] font-mono tracking-wider px-2.5 py-1 rounded-full border transition-all shrink-0 cursor-pointer ${
                          isSelected 
                            ? 'bg-purple-600 border-purple-500 text-white font-bold shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                            : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {catName} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CENTRAL MAIN CONTENT LIST */}
              <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 space-y-3 scrollbar-thin scrollbar-webkit scrollbar-thumb-zinc-800">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.length === 0 ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="py-16 text-center space-y-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-zinc-900 mx-auto flex items-center justify-center border border-zinc-850">
                        <Inbox className="w-8 h-8 text-zinc-700" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm text-zinc-350">
                          {searchQuery || selectedCategory !== 'ALL' ? "No matching records found" : "Your feed is perfectly cleared"}
                        </h3>
                        <p className="text-xs text-zinc-500 max-w-sm mx-auto px-6 font-sans">
                          {searchQuery || selectedCategory !== 'ALL' 
                            ? "Try refining your search terms or modifying category tab select above."
                            : `All venue signals, pricing overrides and stage thresholds are healthy, active, and balanced.`}
                        </p>
                      </div>
                      
                      {!(searchQuery || selectedCategory !== 'ALL') && (
                        <button
                          onClick={() => {
                            playBeep(750, 'sine', 0.08);
                            simulateNotification('INVENTORY REFILL');
                          }}
                          className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-white border border-purple-950 hover:border-purple-600 bg-purple-950/20 px-3.5 py-1.5 rounded-lg transition-all font-mono"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Initialize Demo Broadcast
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    filteredNotifications.map((notif, index) => {
                      const styles = getCategoryStyles(notif.category);
                      const isUnread = !notif.is_read;
                      const isExpanded = expandedCardId === notif.id;
                      const hasFulfillment = notif.category?.toUpperCase() === 'INVENTORY REFILL' || 
                                             notif.message.toLowerCase().includes('low') || 
                                             notif.message.toLowerCase().includes('stock');

                      const isUrgentRed = isUnread && (notif.category?.toUpperCase() === 'CURFEW UPDATE' || notif.requires_push);
                      const isUrgentAmber = isUnread && (notif.category?.toUpperCase() === 'INVENTORY REFILL' || notif.message.toLowerCase().includes('stock') || notif.message.toLowerCase().includes('low'));
                      const glowClass = isUrgentRed ? 'flash-red-accent' : isUrgentAmber ? 'flash-glow-amber' : '';

                      return (
                        <motion.div
                          key={`${notif.id}-${index}`}
                          initial={{ opacity: 0, x: 20, y: 5 }}
                          animate={{ opacity: isUnread ? 1 : 0.65, x: 0, y: 0 }}
                          exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }}
                          transition={{ delay: Math.min(index * 0.03, 0.15) }}
                          onClick={() => {
                            playBeep(600, 'sine', 0.02);
                            if (isUnread) {
                              onMarkAsRead(notif.id);
                            }
                            if (notif.post_id && onNavigateToPost) {
                              onNavigateToPost(notif.post_id);
                            } else {
                              setExpandedCardId(isExpanded ? null : notif.id);
                            }
                          }}
                          className={`group relative overflow-hidden rounded-xl border p-2.5 transition-all duration-200 text-left bg-zinc-900/40 hover:bg-zinc-900 border-zinc-850 hover:border-zinc-700 select-none cursor-pointer hover:shadow-lg ${
                            isUnread ? 'ring-1 ring-purple-500/10' : ''
                          } ${isExpanded ? 'bg-zinc-900 border-zinc-700 shadow-md' : ''} ${glowClass}`}
                        >
                          
                          {/* Inner Category-linked Left Accent Bar */}
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${styles.accentLine}`} />
                          
                          {/* Top row with Category Badge & Time */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full border ${styles.bg} ${styles.border} ${styles.text}`}>
                              {styles.icon} {notif.category || 'BROADCAST'}
                            </span>
                            
                            <div className="flex items-center gap-2 font-mono text-[9.5px] text-zinc-500">
                              <span>
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                              {isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-pulse" title="New unread alert" />
                              )}
                            </div>
                          </div>

                          {/* Alert message display */}
                          <p className={`text-xs mt-1.5 font-sans leading-relaxed ${
                            isUnread ? 'text-[#f5f5f7] font-medium' : 'text-zinc-400 line-through decoration-zinc-800'
                          }`}>
                            {notif.message}
                          </p>

                          {/* Expandable Accordion Panel Area */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-2.5 pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 space-y-2 font-sans"
                                onClick={(e) => e.stopPropagation()} // Stop bubble up
                              >
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/50 font-mono text-[10px]">
                                  <div>
                                    <span className="text-zinc-600 block">DOCK ROUTER ID:</span>
                                    <span className="text-zinc-300 font-bold">#{notif.id.slice(0, 10).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-600 block">SEVERITY PRIORITY:</span>
                                    <span className={`font-bold ${notif.requires_push ? 'text-red-400' : 'text-indigo-400'}`}>
                                      {notif.requires_push ? '🔥 CRITICAL PUSH' : '💬 COLD TRACE'}
                                    </span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-zinc-600 block">TIME LOG DETAILS:</span>
                                    <span className="text-zinc-300">{new Date(notif.created_at).toLocaleString()}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                  {hasFulfillment && (
                                    <button
                                      onClick={() => handleActionLink(notif)}
                                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase text-[10px] px-3 py-1.5 rounded-lg tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/40"
                                    >
                                      <span>⚡ Dispatch Stock refill</span>
                                    </button>
                                  )}

                                  {isUnread ? (
                                    <button
                                      onClick={() => {
                                        playBeep(800, 'sine', 0.05);
                                        onMarkAsRead(notif.id);
                                        if (triggerNotification) triggerNotification("Logged notification as read.");
                                      }}
                                      className="text-[10px] bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg uppercase transition-all flex items-center gap-1 cursor-pointer border border-zinc-700"
                                    >
                                      <Check className="w-3.5 h-3.5 text-green-400" />
                                      Mark Read
                                    </button>
                                  ) : (
                                    <span className="text-[10px] text-zinc-600 border border-zinc-900 bg-zinc-950/20 px-3 py-1.5 rounded-lg select-none self-center">
                                      ✓ READ LOGBOOK
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Quick action helper bottom row (when not expanded) */}
                          {!isExpanded && (
                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-850 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              {notif.post_id ? (
                                <span className="text-[#00ffcc] flex items-center gap-1 font-bold animate-pulse">
                                  <ArrowRight className="w-3 h-3" /> CLICK TO VIEW RELATED POST
                                </span>
                              ) : (
                                <span className="text-purple-400/90 flex items-center gap-1 font-bold">
                                  <Eye className="w-3 h-3" /> CLICK CONSOLE TO EXPAND
                                </span>
                              )}
                              {isUnread && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playBeep(700, 'sine', 0.05);
                                    onMarkAsRead(notif.id);
                                  }}
                                  className="text-[9px] text-[#00ffcc] hover:text-white transition-colors uppercase font-bold"
                                >
                                  Quick Mark Read ✓
                                </button>
                              )}
                            </div>
                          )}

                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Simulation Labs segment at the bottom of the Drawer */}
              <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-900 flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => {
                    playBeep(550, 'sine', 0.05);
                    setShowSimulateBlock(!showSimulateBlock);
                  }}
                  className="w-full flex items-center justify-between text-[10px] font-bold text-zinc-500 hover:text-[#00ffcc] px-2.5 py-1.5 rounded bg-zinc-900/20 border border-zinc-900 hover:border-[#00ffcc]/20 transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-500/80 animate-pulse" />
                    SIMULATION LABS (TEST TRIGGER MODE)
                  </span>
                  <span className="font-mono text-zinc-650">{showSimulateBlock ? "▲" : "▼"}</span>
                </button>

                <AnimatePresence>
                  {showSimulateBlock && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden bg-zinc-900/30 border border-zinc-900 rounded p-2 mt-0.5 space-y-2 text-left"
                    >
                      <p className="text-[9px] text-zinc-500 leading-relaxed font-sans">
                        Trigger simulated notifications to verify real-time listening and visual glowing systems:
                      </p>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => simulateNotification('INVENTORY REFILL')}
                          className="bg-zinc-950 hover:bg-amber-950/20 text-neutral-400 hover:text-amber-400 border border-zinc-900 hover:border-amber-500/40 px-2 py-1 rounded text-[9.5px] font-mono text-left transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>📦 Inventory Refill</span>
                        </button>
                        <button
                          onClick={() => simulateNotification('CURFEW UPDATE')}
                          className="bg-zinc-950 hover:bg-rose-950/20 text-neutral-400 hover:text-rose-400 border border-zinc-900 hover:border-rose-500/40 px-2 py-1 rounded text-[9.5px] font-mono text-left transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>⏰ Curfew Update</span>
                        </button>
                        <button
                          onClick={() => simulateNotification('MARKET OFFER')}
                          className="bg-zinc-950 hover:bg-emerald-950/20 text-neutral-400 hover:text-emerald-400 border border-zinc-900 hover:border-emerald-500/40 px-2 py-1 rounded text-[9.5px] font-mono text-left transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>💸 Booking Offer</span>
                        </button>
                        <button
                          onClick={() => simulateNotification('SYSTEM')}
                          className="bg-zinc-950 hover:bg-indigo-950/20 text-neutral-400 hover:text-indigo-400 border border-zinc-900 hover:border-indigo-500/40 px-2 py-1 rounded text-[9.5px] font-mono text-left transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>📡 System Log</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* STICKY BOTTOM DRAWER FOOTER */}
              <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center z-10">
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] bg-purple-950/40 hover:bg-purple-900/60 border border-purple-900/50 hover:border-purple-500 text-purple-300 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
                      Clear list
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-zinc-650 font-mono select-none">
                  NEXUS CORE V2.4
                </span>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FLOATING RICH BANNER NOTIFICATION NOTIF OVERLAY */}
      <AnimatePresence>
        {liveBanner && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 24, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -45 }}
            className="fixed top-0 left-4 right-4 md:left-[35%] md:right-[35%] bg-zinc-950/98 backdrop-blur-md border border-zinc-800 text-zinc-100 p-4.5 rounded-2xl z-[100] shadow-[0_20px_50px_rgba(0,0,0,0.85)] flex flex-col space-y-3.5 border-l-4 border-purple-500 font-sans"
            id="workspace-interrupt-banner"
          >
            {/* Banner top deck */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <span className="text-[9px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                🔔 LIVE: {liveBanner.category || 'ALERT'}
              </span>
              <button
                onClick={() => {
                  playBeep(450, 'sine', 0.05);
                  setLiveBanner(null);
                }}
                className="text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer text-xs p-1"
                title="Dismiss overlay banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Message Body */}
            <p className="text-xs text-zinc-200 leading-relaxed text-left font-sans font-medium">
              {liveBanner.message}
            </p>

            {/* Event CTA option buttons */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {(liveBanner.category?.toUpperCase() === 'INVENTORY REFILL' || 
                liveBanner.message.toLowerCase().includes('low') || 
                liveBanner.message.toLowerCase().includes('stock')) && (
                <button
                  onClick={() => {
                    handleActionLink(liveBanner);
                    setLiveBanner(null);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 border border-purple-500 text-white font-bold uppercase text-[10px] px-3.5 py-1.5 rounded-lg tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-950/50 active:scale-95"
                >
                  <span>⚡ PULL STOCK FROM VAN 🚚</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  playBeep(500, 'sine', 0.05);
                  onMarkAsRead(liveBanner.id);
                  setLiveBanner(null);
                }}
                className="text-[9.5px] cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-850 px-3.5 py-1.5 rounded-lg ml-auto transition-all"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
