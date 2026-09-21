import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff, 
  Shield, 
  ShieldAlert, 
  Volume2, 
  VolumeX, 
  Download, 
  Play, 
  UserX, 
  UserCheck, 
  Archive, 
  Check, 
  AlertTriangle,
  Info,
  Search,
  X,
  Plus,
  Loader2,
  Trash2,
  Smartphone,
  Zap,
  BellRing,
  Radio,
  MapPin,
  Ticket,
  ShoppingBag,
  DollarSign,
  Clock,
  Flame,
  Sparkles
} from 'lucide-react';
import { getSupabase } from '../../supabase';
import {
  pushManager,
  INDUSTRY_PRO_PUSH_CATEGORIES,
  FAN_PUSH_CATEGORIES,
  PushNotificationPreferences,
  getDefaultPushPreferences,
  PushPermissionStatus,
  isIframeEnvironment
} from '../../lib/pushNotifications';

interface MessageType { 
  id: string; 
  sender: string; 
  text?: string; 
  time: string; 
  image?: string; 
  link?: string; 
  voice?: boolean; 
  voiceDuration?: string; 
  voiceAudioUrl?: string; 
  reactions?: { emoji: string; by: string }[]; 
  replyTo?: MessageType; 
  status?: 'sent' | 'delivered' | 'read' 
}

interface ChatType { 
  id: string; 
  name: string; 
  avatar: string; 
  role: string; 
  roleBadge: string; 
  roleColor: string; 
  online: boolean; 
  unread: number; 
  messages: MessageType[]; 
  settings?: { 
    muted?: boolean; 
    notifications?: boolean; 
    autoSavePhotos?: boolean; 
    disappearing?: 'Off' | '24 hours' | '7 days'; 
    readReceipts?: boolean; 
    typingIndicator?: boolean; 
    blocked?: boolean; 
    restricted?: boolean; 
    hidden?: boolean; 
  } 
}

interface InboxPreferencesProps {
  userProfile: any;
  chats: ChatType[];
  setChats: React.Dispatch<React.SetStateAction<ChatType[]>>;
  globalReadReceipts: boolean;
  setGlobalReadReceipts: (val: boolean) => void;
  globalActiveStatus: boolean;
  setGlobalActiveStatus: (val: boolean) => void;
  whoCanReachMe: 'everyone' | 'artists_bands' | 'mutuals';
  setWhoCanReachMe: (val: 'everyone' | 'artists_bands' | 'mutuals') => void;
  triggerNotification?: (msg: string) => void;
}

// Reusable Accordion module - COLLAPSED BY DEFAULT
const Accordion: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, badge, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-zinc-900 bg-black/40 rounded-xl overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-900/30 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-850 text-zinc-400 group-hover:text-purple-400 transition-colors">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-200 group-hover:text-white transition-colors font-mono">
                {title}
              </span>
              {badge && (
                <span className="text-[8px] font-mono font-bold bg-zinc-900 border border-zinc-800 text-purple-400 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-zinc-500 font-sans mt-0.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="p-4 pt-1 border-t border-zinc-900 bg-black/60 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const InboxPreferences: React.FC<InboxPreferencesProps> = ({
  userProfile,
  chats,
  setChats,
  globalReadReceipts,
  setGlobalReadReceipts,
  globalActiveStatus,
  setGlobalActiveStatus,
  whoCanReachMe,
  setWhoCanReachMe,
  triggerNotification
}) => {
  // Section 4: Signal Notifications & Media states
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [autoDownloadMedia, setAutoDownloadMedia] = useState(true);
  const [autoplayAudio, setAutoplayAudio] = useState(false);

  // Section 5: Device Push Matrix states
  const [pushPrefs, setPushPrefs] = useState<PushNotificationPreferences>(pushManager.getPreferences());
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>(pushManager.getPermissionStatus());
  const [pushWorkspaceTab, setPushWorkspaceTab] = useState<'industry_pro' | 'fan_only' | 'device'>('industry_pro');
  const [isRequestingPush, setIsRequestingPush] = useState(false);
  const inIframe = isIframeEnvironment();

  useEffect(() => {
    const handleSyncStatus = () => {
      setPermissionStatus(pushManager.getPermissionStatus());
    };
    window.addEventListener('focus', handleSyncStatus);
    document.addEventListener('visibilitychange', handleSyncStatus);
    return () => {
      window.removeEventListener('focus', handleSyncStatus);
      document.removeEventListener('visibilitychange', handleSyncStatus);
    };
  }, []);

  // DB Sync status
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Management Drawer controls
  const [activeDrawer, setActiveDrawer] = useState<'blocked' | 'restricted' | 'hidden' | null>(null);
  
  // Drawer data lists
  const [blockedProfiles, setBlockedProfiles] = useState<any[]>([]);
  const [restrictedProfiles, setRestrictedProfiles] = useState<any[]>([]);
  const [hiddenConversations, setHiddenConversations] = useState<any[]>([]);
  
  // Global search inside drawers
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // 1. Initial State Fetch and Supabase sync
  useEffect(() => {
    const fetchDBSettings = async () => {
      const supabase = getSupabase();
      if (!supabase || !userProfile?.id) {
        // Fallback to local storage if offline or not logged in
        const cached = localStorage.getItem(`nexus_inbox_pref_s4_${userProfile?.id || 'default'}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setSoundEffectsEnabled(parsed.soundEffectsEnabled ?? true);
            setAutoDownloadMedia(parsed.autoDownloadMedia ?? true);
            setAutoplayAudio(parsed.autoplayAudio ?? false);
          } catch (e) {}
        }
        return;
      }

      try {
        setSyncing(true);
        const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
        if (!isValidUUID(userProfile.id)) {
          setSyncing(false);
          return;
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('show_active_status, read_receipts_enabled, gatekeeper_setting, sound_effects_enabled, auto_download_media, autoplay_audio')
          .eq('id', userProfile.id)
          .single();

        if (error) {
          console.warn("Missing custom preference columns. Using fallback mode.", error.message);
          return;
        }

        if (data) {
          if (data.show_active_status !== null) setGlobalActiveStatus(data.show_active_status);
          if (data.read_receipts_enabled !== null) setGlobalReadReceipts(data.read_receipts_enabled);
          if (data.gatekeeper_setting) setWhoCanReachMe(data.gatekeeper_setting as any);
          if (data.sound_effects_enabled !== null) setSoundEffectsEnabled(data.sound_effects_enabled);
          if (data.auto_download_media !== null) setAutoDownloadMedia(data.auto_download_media);
          if (data.autoplay_audio !== null) setAutoplayAudio(data.autoplay_audio);
        }
      } catch (err: any) {
        setSyncError(err.message);
      } finally {
        setSyncing(false);
      }
    };

    fetchDBSettings();
  }, [userProfile?.id]);

  // Fetch drawer-specific data from Supabase
  useEffect(() => {
    if (!activeDrawer || !userProfile?.id) return;
    
    const fetchDrawerData = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      try {
        setSyncing(true);
        if (activeDrawer === 'blocked') {
          const { data: blockRecords, error } = await supabase
            .from('blocks')
            .select('blocked_id')
            .eq('blocker_id', userProfile.id);

          if (error) throw error;
          
          if (blockRecords && blockRecords.length > 0) {
            const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
            const ids = blockRecords.map(b => b.blocked_id).filter(isValidUUID);
            if (ids.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, console_handle, avatar_url, role_badge')
                .in('id', ids);
              const mapped = (profiles || []).map(p => ({
                id: p.id,
                name: p.full_name || p.console_handle || 'Unknown',
                avatar: p.avatar_url || '',
                role_badge: p.role_badge || ''
              }));
              setBlockedProfiles(mapped);
            } else {
              setBlockedProfiles([]);
            }
          } else {
            setBlockedProfiles([]);
          }
        } else if (activeDrawer === 'restricted') {
          const { data: restrictRecords, error } = await supabase
            .from('restricted_profiles')
            .select('restricted_id')
            .eq('restricting_id', userProfile.id);

          if (error) throw error;
          
          if (restrictRecords && restrictRecords.length > 0) {
            const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
            const ids = restrictRecords.map(r => r.restricted_id).filter(isValidUUID);
            if (ids.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, console_handle, avatar_url, role_badge')
                .in('id', ids);
              const mapped = (profiles || []).map(p => ({
                id: p.id,
                name: p.full_name || p.console_handle || 'Unknown',
                avatar: p.avatar_url || '',
                role_badge: p.role_badge || ''
              }));
              setRestrictedProfiles(mapped);
            } else {
              setRestrictedProfiles([]);
            }
          } else {
            setRestrictedProfiles([]);
          }
        } else if (activeDrawer === 'hidden') {
          const { data: hiddenRecords, error } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userProfile.id)
            .eq('is_hidden', true);

          if (error) {
            // Fallback: search locally hidden chats
            const localHidden = chats.filter(c => c.settings?.hidden);
            setHiddenConversations(localHidden);
          } else if (hiddenRecords && hiddenRecords.length > 0) {
            const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
            const ids = hiddenRecords.map(h => h.conversation_id).filter(isValidUUID);
            if (ids.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, console_handle, avatar_url, role_badge')
                .in('id', ids);
              
              // Map or fallback to existing chats
              const mapped = profiles?.map((p: any) => {
                const matchedChat = chats.find(c => c.id === p.id);
                return {
                  id: p.id,
                  name: p.full_name || p.console_handle || matchedChat?.name || 'Unknown User',
                  avatar: p.avatar_url || matchedChat?.avatar || '',
                  role: matchedChat?.role || 'Operator',
                  roleBadge: p.role_badge || matchedChat?.roleBadge || ''
                };
              }) || [];
              setHiddenConversations(mapped);
            } else {
              setHiddenConversations([]);
            }
          } else {
            setHiddenConversations([]);
          }
        }
      } catch (err: any) {
        console.error(`Error loading ${activeDrawer} data from Supabase:`, err.message);
        // Resilient Fallback to local chats state
        if (activeDrawer === 'blocked') {
          setBlockedProfiles(chats.filter(c => c.settings?.blocked));
        } else if (activeDrawer === 'restricted') {
          setRestrictedProfiles(chats.filter(c => c.settings?.restricted));
        } else if (activeDrawer === 'hidden') {
          setHiddenConversations(chats.filter(c => c.settings?.hidden));
        }
      } finally {
        setSyncing(false);
      }
    };

    fetchDrawerData();
  }, [activeDrawer, chats, userProfile?.id]);

  // Profile Search handler for Block/Restrict actions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      try {
        setSearching(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, console_handle, avatar_url, role_badge')
          .or(`full_name.ilike.%${searchQuery}%,console_handle.ilike.%${searchQuery}%`)
          .neq('id', userProfile?.id || '')
          .limit(6);

        if (!error && data) {
          const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.full_name || p.console_handle || 'Unknown',
            avatar: p.avatar_url || '',
            role_badge: p.role_badge || ''
          }));
          setSearchResults(mapped);
        }
      } catch (err) {
        console.error("Profile search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userProfile?.id]);

  // DB Sync Helper
  const syncColumn = async (columnName: string, value: any) => {
    const s4Cache = { soundEffectsEnabled, autoDownloadMedia, autoplayAudio, [columnName]: value };
    localStorage.setItem(`nexus_inbox_pref_s4_${userProfile?.id || 'default'}`, JSON.stringify(s4Cache));

    const supabase = getSupabase();
    const isValidUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
    if (!supabase || !userProfile?.id || !isValidUUID(userProfile.id)) return;

    try {
      setSyncing(true);
      setSyncError(null);
      const { error } = await supabase
        .from('profiles')
        .update({ [columnName]: value })
        .eq('id', userProfile.id);

      if (error) {
        console.warn(`Local preference updated. Supabase column "${columnName}" error:`, error.message);
      }
    } catch (err: any) {
      console.error(`Failed to sync database column: ${columnName}`, err);
    } finally {
      setSyncing(false);
    }
  };

  // BLOCK PROFILE ACTION
  const handleBlockUser = async (targetId: string, targetName: string) => {
    const supabase = getSupabase();
    
    // Update local parent chat settings
    setChats(prev => prev.map(c => c.id === targetId ? { ...c, settings: { ...c.settings, blocked: true } } : c));
    triggerNotification?.(`Profile "${targetName}" blocked.`);

    if (supabase && userProfile?.id) {
      try {
        setSyncing(true);
        const { error } = await supabase
          .from('blocks')
          .insert({ blocker_id: userProfile.id, blocked_id: targetId });

        if (error && error.code !== '23505') { // Ignore unique constraint violation
          throw error;
        }

        // Refresh blocked list
        setBlockedProfiles(prev => [...prev.filter(p => p.id !== targetId), { id: targetId, name: targetName }]);
      } catch (err: any) {
        console.warn("Blocks db upload fallback:", err.message);
      } finally {
        setSyncing(false);
      }
    }
  };

  // UNBLOCK PROFILE ACTION
  const handleUnblockUser = async (targetId: string, targetName: string) => {
    const supabase = getSupabase();

    setChats(prev => prev.map(c => c.id === targetId ? { ...c, settings: { ...c.settings, blocked: false } } : c));
    setBlockedProfiles(prev => prev.filter(p => p.id !== targetId));
    triggerNotification?.(`Profile "${targetName}" unblocked.`);

    if (supabase && userProfile?.id) {
      try {
        setSyncing(true);
        await supabase
          .from('blocks')
          .delete()
          .eq('blocker_id', userProfile.id)
          .eq('blocked_id', targetId);
      } catch (err: any) {
        console.warn("Blocks db delete fallback:", err.message);
      } finally {
        setSyncing(false);
      }
    }
  };

  // RESTRICT PROFILE ACTION
  const handleRestrictUser = async (targetId: string, targetName: string) => {
    const supabase = getSupabase();

    setChats(prev => prev.map(c => c.id === targetId ? { ...c, settings: { ...c.settings, restricted: true } } : c));
    triggerNotification?.(`Profile "${targetName}" restricted.`);

    if (supabase && userProfile?.id) {
      try {
        setSyncing(true);
        const { error } = await supabase
          .from('restricted_profiles')
          .insert({ restricting_id: userProfile.id, restricted_id: targetId });

        if (error && error.code !== '23505') {
          throw error;
        }

        setRestrictedProfiles(prev => [...prev.filter(p => p.id !== targetId), { id: targetId, name: targetName }]);
      } catch (err: any) {
        console.warn("Restricted db upload fallback:", err.message);
      } finally {
        setSyncing(false);
      }
    }
  };

  // UNRESTRICT PROFILE ACTION
  const handleUnrestrictUser = async (targetId: string, targetName: string) => {
    const supabase = getSupabase();

    setChats(prev => prev.map(c => c.id === targetId ? { ...c, settings: { ...c.settings, restricted: false } } : c));
    setRestrictedProfiles(prev => prev.filter(p => p.id !== targetId));
    triggerNotification?.(`Restrictions removed for "${targetName}".`);

    if (supabase && userProfile?.id) {
      try {
        setSyncing(true);
        await supabase
          .from('restricted_profiles')
          .delete()
          .eq('restricting_id', userProfile.id)
          .eq('restricted_id', targetId);
      } catch (err: any) {
        console.warn("Restricted db delete fallback:", err.message);
      } finally {
        setSyncing(false);
      }
    }
  };

  // UNHIDE CONVERSATION ACTION
  const handleUnhideConversation = async (targetId: string, targetName: string) => {
    const supabase = getSupabase();

    setChats(prev => prev.map(c => c.id === targetId ? { ...c, settings: { ...c.settings, hidden: false } } : c));
    setHiddenConversations(prev => prev.filter(c => c.id !== targetId));
    triggerNotification?.(`Conversation with "${targetName}" unhidden.`);

    if (supabase && userProfile?.id) {
      try {
        setSyncing(true);
        const { error } = await supabase
          .from('conversation_participants')
          .update({ is_hidden: false })
          .eq('user_id', userProfile.id)
          .eq('conversation_id', targetId);

        if (error) {
          // If table schema structure is direct email-based fallback
          await supabase
            .from('hidden_conversations')
            .delete()
            .eq('user_id', userProfile.id);
        }
      } catch (err: any) {
        console.warn("Hidden conversation update fallback:", err.message);
      } finally {
        setSyncing(false);
      }
    }
  };

  return (
    <div className="space-y-4 font-sans text-zinc-300 relative">
      
      {/* DB Sync Banner */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-b border-zinc-900 pb-2">
        <span className="flex items-center gap-1.5 uppercase font-bold">
          <span className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-purple-500 animate-pulse' : 'bg-[#39ff14]'}`} />
          {syncing ? 'SYS-SYNC IN PROGRESS' : 'SECURE CONNECTION ACTIVE'}
        </span>
        <span className="uppercase text-purple-400 font-bold">
          Terminal Node V2
        </span>
      </div>

      {/* 1. PRESENCE & SECURITY ACCORDION */}
      <Accordion 
        title="1. Presence & Security" 
        subtitle="Control online signaling and receipts"
        icon={<Eye className="w-4 h-4" />}
        badge={globalActiveStatus ? "VISIBLE" : "STEALTH"}
      >
        {/* Show Active Status */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div className="space-y-1 font-sans">
            <span className="text-xs font-bold text-zinc-250">Show Active Status</span>
            <p className="text-[10px] text-zinc-500 leading-normal">
              When disabled, you will detach from all live presence signals. Other operators won't see your activity, and you won't see theirs.
            </p>
          </div>
          <button 
            onClick={async () => {
              const newVal = !globalActiveStatus;
              setGlobalActiveStatus(newVal);
              await syncColumn('show_active_status', newVal);
              triggerNotification?.(newVal ? "🌐 Realtime Active Status restored." : "📶 Stepped off the grid. Presence suppressed.");
            }}
            className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${globalActiveStatus ? 'bg-purple-600' : 'bg-zinc-800'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${globalActiveStatus ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Read Receipts */}
        <div className="flex items-start justify-between gap-4 pt-4 border-t border-zinc-900/60">
          <div className="space-y-1 font-sans">
            <span className="text-xs font-bold text-zinc-250">Read Receipts</span>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Enable read indicator ticks. If either sender or recipient has read receipts disabled, read indicator ticks are suppressed.
            </p>
          </div>
          <button 
            onClick={async () => {
              const newVal = !globalReadReceipts;
              setGlobalReadReceipts(newVal);
              await syncColumn('read_receipts_enabled', newVal);
              triggerNotification?.(`Read receipts configured to ${newVal ? 'ON' : 'OFF'}`);
            }}
            className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${globalReadReceipts ? 'bg-purple-600' : 'bg-zinc-800'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${globalReadReceipts ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </Accordion>

      {/* 2. GATEKEEPER CONTROLS ACCORDION */}
      <Accordion 
        title="2. Gatekeeper Controls" 
        subtitle="Manage conversation initialization restrictions"
        icon={<Shield className="w-4 h-4" />}
        badge={whoCanReachMe === 'everyone' ? 'OPEN' : whoCanReachMe === 'artists_bands' ? 'ARTISTS ONLY' : 'MUTUALS'}
      >
        <span className="text-xs font-bold text-zinc-200 block mb-1">Who can start conversations with you?</span>
        <p className="text-[10px] text-zinc-500 leading-normal mb-3 font-sans">
          Filter incoming direct signals to protect your nexus terminal node from unauthorized noise.
        </p>

        <div className="space-y-2">
          {[
            { id: 'everyone', label: 'Everyone', desc: 'Any verified user or workspace account.' },
            { id: 'artists_bands', label: 'Artists & Bands Only', desc: 'Only accounts marked as band/artist workspace roster.' },
            { id: 'mutuals', label: 'Mutuals & Collaborators', desc: 'Only operators you actively follow back.' }
          ].map((opt, idx) => (
            <button
              key={`${opt.id}-${idx}`}
              onClick={async () => {
                const targetId = opt.id as 'everyone' | 'artists_bands' | 'mutuals';
                setWhoCanReachMe(targetId);
                await syncColumn('gatekeeper_setting', targetId);
                triggerNotification?.(`Inbox gatekeeper set to: ${opt.label}`);
              }}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between cursor-pointer ${
                whoCanReachMe === opt.id 
                  ? 'bg-purple-950/10 border-purple-500/40 text-purple-400' 
                  : 'bg-zinc-900/20 border-zinc-900 text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-250'
              }`}
            >
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="text-xs font-bold block font-mono">{opt.label}</span>
                <span className="text-[9px] opacity-80 leading-normal block font-sans">{opt.desc}</span>
              </div>
              {whoCanReachMe === opt.id && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0 animate-ping" />}
            </button>
          ))}
        </div>
      </Accordion>

      {/* 3. AUDITED ROSTER CONNECTIONS ACCORDION */}
      <Accordion 
        title="3. Audited Roster Connections" 
        subtitle="Launch management drawers for blocked, restricted and hidden nodes"
        icon={<ShieldAlert className="w-4 h-4" />}
        badge="MANAGE"
      >
        <p className="text-[10px] text-zinc-500 leading-normal mb-3 font-sans">
          Click on any connect categories below to launch dedicated sliding drawers. Search profiles, add new restrictions, or restore nodes dynamically.
        </p>
        <div className="grid grid-cols-1 gap-2">
          {/* Blocked Button */}
          <button 
            onClick={() => {
              setSearchQuery('');
              setActiveDrawer('blocked');
            }}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 hover:border-purple-900 bg-zinc-950/40 hover:bg-zinc-900/30 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <UserX className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold font-mono text-zinc-300">Blocked Profiles</span>
            </div>
            <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono font-black">
              LAUNCH
            </span>
          </button>

          {/* Restricted Button */}
          <button 
            onClick={() => {
              setSearchQuery('');
              setActiveDrawer('restricted');
            }}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 hover:border-purple-900 bg-zinc-950/40 hover:bg-zinc-900/30 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold font-mono text-zinc-300">Restricted Profiles</span>
            </div>
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-mono font-black">
              LAUNCH
            </span>
          </button>

          {/* Hidden Button */}
          <button 
            onClick={() => {
              setSearchQuery('');
              setActiveDrawer('hidden');
            }}
            className="flex items-center justify-between p-3 rounded-xl border border-zinc-900 hover:border-purple-900 bg-zinc-950/40 hover:bg-zinc-900/30 transition-all text-left"
          >
            <div className="flex items-center gap-2.5">
              <Archive className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono text-zinc-300">Hidden Conversations</span>
            </div>
            <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono font-black">
              LAUNCH
            </span>
          </button>
        </div>
      </Accordion>

      {/* 4. SIGNAL NOTIFICATIONS & MEDIA ACCORDION */}
      <Accordion 
        title="4. Signal Notifications & Media" 
        subtitle="Mute signal chimes and manage asset loading behavior"
        icon={<Volume2 className="w-4 h-4" />}
        badge="LIVE"
      >
        {/* Terminal Sound FX */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div className="space-y-1 font-sans">
            <span className="text-xs font-bold text-zinc-250">Terminal Sound FX</span>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Play high-frequency incoming signal audio chimes and system interface sounds.
            </p>
          </div>
          <button 
            onClick={async () => {
              const newVal = !soundEffectsEnabled;
              setSoundEffectsEnabled(newVal);
              await syncColumn('sound_effects_enabled', newVal);
              triggerNotification?.(newVal ? "🔊 Sound FX enabled." : "🔇 Terminal audio muted.");
            }}
            className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${soundEffectsEnabled ? 'bg-purple-600' : 'bg-zinc-800'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${soundEffectsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Auto-Download Media */}
        <div className="flex items-start justify-between gap-4 pt-4 border-t border-zinc-900/60">
          <div className="space-y-1 font-sans">
            <span className="text-xs font-bold text-zinc-250">Auto-Download Assets</span>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Automatically pre-download and cache voice notes, high-res photos, and multi-track stems.
            </p>
          </div>
          <button 
            onClick={async () => {
              const newVal = !autoDownloadMedia;
              setAutoDownloadMedia(newVal);
              await syncColumn('auto_download_media', newVal);
              triggerNotification?.(newVal ? "⚡ Auto-download enabled for attachments." : "⏳ Click-to-download enforced for attachments.");
            }}
            className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${autoDownloadMedia ? 'bg-purple-600' : 'bg-zinc-800'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${autoDownloadMedia ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Audio File Autoplay */}
        <div className="flex items-start justify-between gap-4 pt-4 border-t border-zinc-900/60">
          <div className="space-y-1 font-sans">
            <span className="text-xs font-bold text-zinc-250">Audio File Auto-Play</span>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Automatically stream voice notes and raw track stems upon opening message buffers.
            </p>
          </div>
          <button 
            onClick={async () => {
              const newVal = !autoplayAudio;
              setAutoplayAudio(newVal);
              await syncColumn('autoplay_audio', newVal);
              triggerNotification?.(newVal ? "🎵 Audio autoplay armed." : "🔇 Autoplay disarmed.");
            }}
            className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${autoplayAudio ? 'bg-purple-600' : 'bg-zinc-800'}`}
          >
            <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${autoplayAudio ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </Accordion>

      {/* 5. REAL-TIME DEVICE PUSH MATRIX (INDUSTRY PRO & FAN) */}
      <Accordion
        title="5. Real-Time Device Push Matrix"
        subtitle="Manage hardware device push alerts for Pro & Fan operations"
        icon={<Smartphone className="w-4 h-4 text-rose-500" />}
        badge={
          permissionStatus === 'granted'
            ? pushPrefs.enabled ? 'ARMED' : 'MUTED'
            : permissionStatus === 'denied'
            ? 'BLOCKED'
            : 'AUTHORIZE'
        }
      >
        {/* Permission Request Header */}
        <div className="p-3 rounded-xl border border-zinc-850 bg-gradient-to-r from-zinc-950 via-zinc-900/40 to-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                <BellRing className="w-3.5 h-3.5 text-rose-500" /> Device Notification Engine
              </span>
              <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border ${
                permissionStatus === 'granted'
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/80 border-amber-500/40 text-amber-400'
              }`}>
                {permissionStatus === 'granted' ? 'GRANTED' : 'PROMPT NEEDED'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              Sends native system banners, sound pings, and vibration patterns to your mobile or desktop device.
            </p>
          </div>

          {permissionStatus !== 'granted' ? (
            <button
              onClick={async () => {
                setIsRequestingPush(true);
                try {
                  const status = await pushManager.requestPermission({ id: userProfile?.id, email: userProfile?.email });
                  setPermissionStatus(status);
                  if (status === 'granted') {
                    triggerNotification?.('✨ Device Push Notifications authorized!');
                  } else if (inIframe) {
                    window.open(window.location.href, '_blank', 'noopener,noreferrer');
                  }
                } catch (err) {
                  if (inIframe) {
                    window.open(window.location.href, '_blank', 'noopener,noreferrer');
                  }
                } finally {
                  setIsRequestingPush(false);
                }
              }}
              disabled={isRequestingPush}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer disabled:opacity-60"
            >
              <Zap className="w-3 h-3 fill-current" />
              {isRequestingPush ? 'Authorizing...' : 'Allow Device Notifications'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const updated = await pushManager.updatePreferences({ enabled: !pushPrefs.enabled }, userProfile?.id);
                  setPushPrefs(updated);
                  triggerNotification?.(updated.enabled ? '🔔 Push notifications enabled.' : '🔕 Push notifications muted.');
                }}
                className={`w-10 h-6 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${pushPrefs.enabled ? 'bg-rose-600' : 'bg-zinc-800'}`}
              >
                <span className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${pushPrefs.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900 mt-2">
          <button
            onClick={() => setPushWorkspaceTab('industry_pro')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pushWorkspaceTab === 'industry_pro'
                ? 'bg-purple-950/80 border border-purple-600/50 text-purple-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>💼</span> Industry Pro Triggers
          </button>
          <button
            onClick={() => setPushWorkspaceTab('fan_only')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pushWorkspaceTab === 'fan_only'
                ? 'bg-cyan-950/80 border border-cyan-600/50 text-cyan-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>🤘</span> Fan Triggers
          </button>
          <button
            onClick={() => setPushWorkspaceTab('device')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              pushWorkspaceTab === 'device'
                ? 'bg-zinc-850 border border-zinc-700 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>⚙️</span> Device & Audio
          </button>
        </div>

        {/* TAB 1: INDUSTRY PRO TRIGGERS */}
        {pushWorkspaceTab === 'industry_pro' && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Qualified Industry Pro Event Channels
              </span>
              <span className="text-[9px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/30">
                HIGH SIGNAL • TIME SENSITIVE
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {INDUSTRY_PRO_PUSH_CATEGORIES.map((cat, idx) => {
                const isEnabled = pushPrefs.categories[cat.id] !== false;
                return (
                  <div
                    key={`${cat.id}-${idx}`}
                    className="p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/50 flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-xs font-bold text-zinc-200 font-mono">{cat.label}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          cat.priority === 'P0' ? 'bg-red-950/80 text-red-400 border border-red-800/40' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {cat.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal font-sans">{cat.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          pushManager.simulatePush(cat.id as any);
                        }}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-purple-400 border border-zinc-800 text-[9px] font-mono font-bold px-2 py-1 cursor-pointer transition-colors"
                        title={`Send test push for ${cat.label}`}
                      >
                        TEST
                      </button>
                      <button
                        onClick={async () => {
                          const updatedCats = { ...pushPrefs.categories, [cat.id]: !isEnabled };
                          const updated = await pushManager.updatePreferences({ categories: updatedCats }, userProfile?.id);
                          setPushPrefs(updated);
                        }}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${isEnabled ? 'bg-purple-600' : 'bg-zinc-800'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: FAN TRIGGERS */}
        {pushWorkspaceTab === 'fan_only' && (
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Qualified Fan Event Channels
              </span>
              <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/30">
                SCARCITY & LIVE ACCESS
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {FAN_PUSH_CATEGORIES.map((cat, idx) => {
                const isEnabled = pushPrefs.categories[cat.id] !== false;
                return (
                  <div
                    key={`${cat.id}-${idx}`}
                    className="p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 bg-zinc-950/50 flex items-start justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-xs font-bold text-zinc-200 font-mono">{cat.label}</span>
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          cat.priority === 'P0' ? 'bg-red-950/80 text-red-400 border border-red-800/40' : 'bg-zinc-900 text-zinc-400'
                        }`}>
                          {cat.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 leading-normal font-sans">{cat.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          pushManager.simulatePush(cat.id as any);
                        }}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 text-[9px] font-mono font-bold px-2 py-1 cursor-pointer transition-colors"
                        title={`Send test push for ${cat.label}`}
                      >
                        TEST
                      </button>
                      <button
                        onClick={async () => {
                          const updatedCats = { ...pushPrefs.categories, [cat.id]: !isEnabled };
                          const updated = await pushManager.updatePreferences({ categories: updatedCats }, userProfile?.id);
                          setPushPrefs(updated);
                        }}
                        className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${isEnabled ? 'bg-cyan-600' : 'bg-zinc-800'}`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: DEVICE & AUDIO CONTROLS */}
        {pushWorkspaceTab === 'device' && (
          <div className="space-y-3 pt-2">
            {/* Sound Effects for Push */}
            <div className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/50 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Push Alert Chimes
                </span>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Play harmonic frequencies based on priority level (P0 double beep vs melodic Fan chime).
                </p>
              </div>
              <button
                onClick={async () => {
                  const updated = await pushManager.updatePreferences({ soundEnabled: !pushPrefs.soundEnabled }, userProfile?.id);
                  setPushPrefs(updated);
                  triggerNotification?.(updated.soundEnabled ? '🔊 Push audio chimes enabled.' : '🔇 Push audio chimes muted.');
                }}
                className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${pushPrefs.soundEnabled ? 'bg-purple-600' : 'bg-zinc-800'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${pushPrefs.soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Device Vibration Patterns */}
            <div className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/50 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Haptic Vibration Feedback
                </span>
                <p className="text-[10px] text-zinc-500 leading-normal">
                  Trigger tactical motor pulses on supported mobile devices and tablets.
                </p>
              </div>
              <button
                onClick={async () => {
                  const updated = await pushManager.updatePreferences({ vibrationEnabled: !pushPrefs.vibrationEnabled }, userProfile?.id);
                  setPushPrefs(updated);
                  triggerNotification?.(updated.vibrationEnabled ? '📳 Device vibration enabled.' : '📴 Vibration muted.');
                }}
                className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${pushPrefs.vibrationEnabled ? 'bg-cyan-600' : 'bg-zinc-800'}`}
              >
                <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${pushPrefs.vibrationEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Quiet Hours */}
            <div className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/50 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Quiet Hours Suppressor
                  </span>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Suppress non-critical P1 alerts during rest hours. P0 critical logistics still pass through.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const updated = await pushManager.updatePreferences({ quietHoursEnabled: !pushPrefs.quietHoursEnabled }, userProfile?.id);
                    setPushPrefs(updated);
                    triggerNotification?.(updated.quietHoursEnabled ? '🌙 Quiet hours activated.' : '☀️ Quiet hours disabled.');
                  }}
                  className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer shrink-0 ${pushPrefs.quietHoursEnabled ? 'bg-amber-600' : 'bg-zinc-800'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${pushPrefs.quietHoursEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {pushPrefs.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase">Start Time</label>
                    <input
                      type="time"
                      value={pushPrefs.quietHoursStart}
                      onChange={async (e) => {
                        const updated = await pushManager.updatePreferences({ quietHoursStart: e.target.value }, userProfile?.id);
                        setPushPrefs(updated);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-400 uppercase">End Time</label>
                    <input
                      type="time"
                      value={pushPrefs.quietHoursEnd}
                      onChange={async (e) => {
                        const updated = await pushManager.updatePreferences({ quietHoursEnd: e.target.value }, userProfile?.id);
                        setPushPrefs(updated);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Accordion>

      {/* DETACHED SUB-DRAWERS (AnimatePresence slide-over) */}
      <AnimatePresence>
        {activeDrawer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md flex justify-end"
            onClick={() => setActiveDrawer(null)}
          >
            {/* Drawer Body */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="w-full max-w-md h-full bg-[#050308] border-l border-zinc-850 p-6 shadow-2xl flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
                  <div className="flex items-center gap-2">
                    {activeDrawer === 'blocked' && <UserX className="w-5 h-5 text-purple-400" />}
                    {activeDrawer === 'restricted' && <ShieldAlert className="w-5 h-5 text-amber-500" />}
                    {activeDrawer === 'hidden' && <Archive className="w-5 h-5 text-cyan-400" />}
                    
                    <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                      {activeDrawer === 'blocked' && "Blocked Accounts"}
                      {activeDrawer === 'restricted' && "Restricted Accounts"}
                      {activeDrawer === 'hidden' && "Hidden Conversations"}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setActiveDrawer(null)} 
                    className="p-1.5 rounded-full hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Bar for Block/Restrict */}
                {activeDrawer !== 'hidden' && (
                  <div className="mb-4 relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input 
                      type="text"
                      placeholder="Search profiles to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-900 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-800 transition-colors font-sans"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Profile Search Results Grid */}
                {activeDrawer !== 'hidden' && searchQuery.trim() !== '' && (
                  <div className="mb-4 bg-zinc-950 border border-zinc-900 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2 no-scrollbar">
                    <span className="text-[8px] font-mono font-black text-purple-400 uppercase tracking-widest block mb-1">
                      GLOBAL NETWORK SEARCH
                    </span>
                    
                    {searching ? (
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                        SEARCHING SECURE REGISTRY...
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-[10px] text-zinc-600 italic font-sans py-2">
                        No profiles matching "{searchQuery}" found.
                      </div>
                    ) : (
                      searchResults.map((p, pIdx) => {
                        const isAlreadyBlocked = (blockedProfiles || []).some(b => b.id === p.id);
                        const isAlreadyRestricted = (restrictedProfiles || []).some(r => r.id === p.id);
                        
                        return (
                          <div key={`${p.id}-${pIdx}`} className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/40 hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800">
                            <div className="flex items-center gap-2 min-w-0">
                              <img 
                                src={p.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80`} 
                                className="w-6 h-6 rounded-full object-cover shrink-0" 
                                alt="" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-zinc-200 truncate block">{p.name || 'Operator'}</span>
                                {p.role_badge && (
                                  <span className="text-[8px] text-purple-400 font-mono font-bold uppercase tracking-widest block">
                                    {p.role_badge}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              {activeDrawer === 'blocked' ? (
                                <button 
                                  disabled={isAlreadyBlocked}
                                  onClick={() => {
                                    handleBlockUser(p.id, p.name || 'Operator');
                                    setSearchQuery('');
                                  }}
                                  className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition-colors ${
                                    isAlreadyBlocked 
                                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                      : 'bg-purple-600 text-white hover:bg-purple-500 cursor-pointer'
                                  }`}
                                >
                                  {isAlreadyBlocked ? "BLOCKED" : "BLOCK"}
                                </button>
                              ) : (
                                <button 
                                  disabled={isAlreadyRestricted}
                                  onClick={() => {
                                    handleRestrictUser(p.id, p.name || 'Operator');
                                    setSearchQuery('');
                                  }}
                                  className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition-colors ${
                                    isAlreadyRestricted 
                                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                                      : 'bg-amber-600 text-white hover:bg-amber-500 cursor-pointer'
                                  }`}
                                >
                                  {isAlreadyRestricted ? "RESTRICTED" : "RESTRICT"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Active Records List */}
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest block mb-2">
                    ACTIVE {activeDrawer.toUpperCase()} NODES
                  </span>

                  {/* 1. Blocked Items list */}
                  {activeDrawer === 'blocked' && (
                    blockedProfiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-900">
                        <UserX className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-[11px] text-zinc-500 font-sans">No blocked operators on record.</p>
                      </div>
                    ) : (
                      blockedProfiles.map((p, pIdx) => (
                        <div key={`${p.id}-${pIdx}`} className="flex items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={p.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80`} 
                              className="w-7 h-7 rounded-full object-cover shrink-0" 
                              alt="" 
                              referrerPolicy="no-referrer" 
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-zinc-200 truncate block">{p.name}</span>
                              <span className="text-[8px] font-mono text-zinc-650 uppercase">AUDITED NODE BLOCK</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleUnblockUser(p.id, p.name)}
                            className="text-[9px] font-mono text-purple-400 hover:text-white font-bold px-2.5 py-1 rounded bg-purple-500/10 hover:bg-purple-600/30 border border-purple-500/15 transition-all cursor-pointer"
                          >
                            UNBLOCK
                          </button>
                        </div>
                      ))
                    )
                  )}

                  {/* 2. Restricted Items list */}
                  {activeDrawer === 'restricted' && (
                    restrictedProfiles.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-900">
                        <ShieldAlert className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-[11px] text-zinc-500 font-sans">No restricted operators on record.</p>
                      </div>
                    ) : (
                      restrictedProfiles.map((p, pIdx) => (
                        <div key={`${p.id}-${pIdx}`} className="flex items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={p.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80`} 
                              className="w-7 h-7 rounded-full object-cover shrink-0" 
                              alt="" 
                              referrerPolicy="no-referrer" 
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-zinc-200 truncate block">{p.name}</span>
                              <span className="text-[8px] font-mono text-zinc-650 uppercase">SIGNAL THRESHOLD LIMIT</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleUnrestrictUser(p.id, p.name)}
                            className="text-[9px] font-mono text-amber-500 hover:text-white font-bold px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-600/30 border border-amber-500/15 transition-all cursor-pointer"
                          >
                            RESTORE
                          </button>
                        </div>
                      ))
                    )
                  )}

                  {/* 3. Hidden Conversations list */}
                  {activeDrawer === 'hidden' && (
                    hiddenConversations.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center bg-zinc-950/40 rounded-xl border border-dashed border-zinc-900">
                        <Archive className="w-8 h-8 text-zinc-700 mb-2" />
                        <p className="text-[11px] text-zinc-500 font-sans">No hidden conversation threads found.</p>
                      </div>
                    ) : (
                      hiddenConversations.map((c, cIdx) => (
                        <div key={`${c.id}-${cIdx}`} className="flex items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-900 hover:border-zinc-800 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={c.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80`} 
                              className="w-7 h-7 rounded-full object-cover shrink-0" 
                              alt="" 
                              referrerPolicy="no-referrer" 
                            />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-zinc-200 truncate block">{c.name}</span>
                              <span className="text-[8px] font-mono text-zinc-650 uppercase">STEALTH BUFFER COAX</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleUnhideConversation(c.id, c.name)}
                            className="text-[9px] font-mono text-cyan-400 hover:text-white font-bold px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-600/30 border border-cyan-500/15 transition-all cursor-pointer"
                          >
                            UNHIDE
                          </button>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 border-t border-zinc-900 pt-4 flex flex-col items-center gap-1 opacity-40">
                <p className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest text-center leading-normal">
                  ROSTER AUDITING PROTOCOL v2.0 • END-TO-END SYSTEM ENCRYPTED
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
