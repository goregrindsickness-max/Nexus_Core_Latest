import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Database, Key, RefreshCw, Trash2, CheckCircle2, 
  AlertTriangle, User, Image, Shield, HardDrive, Wifi, Sparkles, 
  ArrowRight, Check, Copy, Sliders, ExternalLink, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../../types';
import { 
  getOfflineQueue, processOfflineQueue, clearSupabaseClientsCache,
  getSupabaseUrlForPortal, getSupabaseAnonKeyForPortal, testSupabaseConnection,
  saveOfflineQueue, OfflineAction
} from '../../supabase';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  triggerNotification?: (msg: string) => void;
  activeTab?: string;
  setActiveTab?: (tab: any) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  userProfile,
  setUserProfile,
  triggerNotification,
  activeTab,
  setActiveTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'credentials' | 'profile' | 'storage' | 'queue'>('credentials');
  
  // Multi-Portal Credentials State
  const [selectedPortal, setSelectedPortal] = useState<'band' | 'promoter' | 'creative'>('band');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Profile Asset Editing State
  const [profileName, setProfileName] = useState<string>('');
  const [profileAvatar, setProfileAvatar] = useState<string>('');
  const [profileBanner, setProfileBanner] = useState<string>('');
  const [profileRole, setProfileRole] = useState<string>('');
  const [profileBio, setProfileBio] = useState<string>('');

  // Storage Stats State
  const [storageUsageKb, setStorageUsageKb] = useState<number>(0);
  const [storageItemCount, setStorageItemCount] = useState<number>(0);
  const [storageKeys, setStorageKeys] = useState<{ key: string; sizeKb: number }[]>([]);

  // Offline Queue State
  const [offlineActions, setOfflineActions] = useState<OfflineAction[]>([]);
  const [isSyncingQueue, setIsSyncingQueue] = useState<boolean>(false);

  // Load portal credentials when portal selection changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedUrl = localStorage.getItem(`nexus_core_${selectedPortal}_supabase_url`) || '';
      const savedKey = localStorage.getItem(`nexus_core_${selectedPortal}_supabase_key`) || '';
      setCustomUrl(savedUrl || getSupabaseUrlForPortal(selectedPortal));
      setCustomKey(savedKey || getSupabaseAnonKeyForPortal(selectedPortal));
      setTestResult(null);
    } catch {}
  }, [selectedPortal, isOpen]);

  // Load profile values
  useEffect(() => {
    if (userProfile) {
      setProfileName(userProfile.name || userProfile.full_name || '');
      setProfileAvatar(userProfile.avatar_url || '');
      setProfileBanner(userProfile.banner_url || userProfile.cover_url || '');
      setProfileRole(userProfile.role || '');
      setProfileBio(userProfile.bio || '');
    }
  }, [userProfile, isOpen]);

  // Calculate storage usage
  const recalculateStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      let totalBytes = 0;
      const keys: { key: string; sizeKb: number }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) {
          const val = localStorage.getItem(k) || '';
          const bytes = (k.length + val.length) * 2; // UTF-16 approximate
          totalBytes += bytes;
          keys.push({ key: k, sizeKb: Math.round((bytes / 1024) * 10) / 10 });
        }
      }
      keys.sort((a, b) => b.sizeKb - a.sizeKb);
      setStorageUsageKb(Math.round(totalBytes / 1024));
      setStorageItemCount(localStorage.length);
      setStorageKeys(keys.slice(0, 15));
    } catch {}
  };

  // Load offline queue
  const refreshQueue = () => {
    try {
      const q = getOfflineQueue();
      setOfflineActions(q);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      recalculateStorage();
      refreshQueue();
    }
  }, [isOpen]);

  // Test Supabase Connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(customUrl.trim(), customKey.trim());
      setTestResult(res);
      if (res.success) {
        triggerNotification?.('✅ Supabase gateway connection verified.');
      } else {
        triggerNotification?.(`❌ Connection check failed: ${res.message}`);
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Connection error' });
    } finally {
      setTestingConnection(false);
    }
  };

  // Save Credentials
  const handleSaveCredentials = () => {
    try {
      if (customUrl.trim()) {
        localStorage.setItem(`nexus_core_${selectedPortal}_supabase_url`, customUrl.trim());
      }
      if (customKey.trim()) {
        localStorage.setItem(`nexus_core_${selectedPortal}_supabase_key`, customKey.trim());
      }
      clearSupabaseClientsCache();
      triggerNotification?.(`⚡ Updated Supabase Gateway for ${selectedPortal.toUpperCase()} portal.`);
    } catch (e) {
      console.warn('Save credentials error:', e);
    }
  };

  // Reset Credentials
  const handleResetCredentials = () => {
    try {
      localStorage.removeItem(`nexus_core_${selectedPortal}_supabase_url`);
      localStorage.removeItem(`nexus_core_${selectedPortal}_supabase_key`);
      clearSupabaseClientsCache();
      setCustomUrl(getSupabaseUrlForPortal(selectedPortal));
      setCustomKey(getSupabaseAnonKeyForPortal(selectedPortal));
      setTestResult(null);
      triggerNotification?.(`Default gateway restored for ${selectedPortal.toUpperCase()}.`);
    } catch (e) {}
  };

  // Save Profile Assets
  const handleSaveProfileAssets = () => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      name: profileName.trim() || userProfile.name,
      full_name: profileName.trim() || userProfile.full_name,
      avatar_url: profileAvatar.trim() || userProfile.avatar_url,
      banner_url: profileBanner.trim() || userProfile.banner_url,
      cover_url: profileBanner.trim() || userProfile.cover_url,
      role: profileRole.trim() || userProfile.role,
      bio: profileBio.trim() || userProfile.bio,
    };
    setUserProfile(updated);
    try {
      localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
    } catch {}
    triggerNotification?.('👤 Profile identity and media assets saved.');
  };

  // Storage Purge
  const handleClearCache = (type: 'nexus_only' | 'offline_queue' | 'all') => {
    if (!confirm(`Are you sure you want to clear ${type === 'all' ? 'ALL local data' : 'selected cache keys'}?`)) {
      return;
    }
    try {
      if (type === 'all') {
        localStorage.clear();
        triggerNotification?.('⚠️ Local storage purged. Reloading page...');
        setTimeout(() => window.location.reload(), 500);
      } else if (type === 'offline_queue') {
        saveOfflineQueue([]);
        refreshQueue();
        triggerNotification?.('Offline mutation queue purged.');
      } else if (type === 'nexus_only') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('nexus_') || k.startsWith('tour_')) && k !== 'nexus_core_user_profile') {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
        recalculateStorage();
        triggerNotification?.('Cleared cached scene records.');
      }
    } catch (e) {}
  };

  // Process Offline Queue
  const handleProcessQueueNow = async () => {
    setIsSyncingQueue(true);
    try {
      await processOfflineQueue();
      refreshQueue();
      triggerNotification?.('⚡ Offline ledger queue synchronized with database.');
    } catch (e: any) {
      triggerNotification?.(`Sync failed: ${e?.message || 'Network error'}`);
    } finally {
      setIsSyncingQueue(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99990] flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Slide-in Drawer Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative z-10 w-full max-w-lg bg-[#0c0e14] border-l border-zinc-800 text-white flex flex-col h-full shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-display">
                  System Settings & Gateway
                </h3>
                <p className="text-[10px] font-mono text-zinc-400">
                  NEXUS CORE INFRASTRUCTURE STACK
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-Tabs Nav */}
          <div className="flex border-b border-zinc-800/80 bg-black/40 px-3 pt-2 gap-1 overflow-x-auto select-none">
            {[
              { id: 'credentials', label: 'Gateway & Keys', icon: Database },
              { id: 'profile', label: 'Profile Media', icon: User },
              { id: 'storage', label: 'Local Cache', icon: HardDrive },
              { id: 'queue', label: `Offline Queue (${offlineActions.length})`, icon: Wifi }
            ].map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={`${tab.id}-${idx}`}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-[#0c0e14] text-[#00ffcc] border-t-2 border-t-[#00ffcc] border-x border-zinc-800' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Body Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* TAB 1: GATEWAY & KEYS */}
            {activeSubTab === 'credentials' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-xl space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">
                    Active Multi-Portal Target
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'band', label: 'Band / Artist' },
                      { id: 'promoter', label: 'Promoter' },
                      { id: 'creative', label: 'Creative' }
                    ].map((p, pIdx) => (
                      <button
                        key={`${p.id}-${pIdx}`}
                        onClick={() => setSelectedPortal(p.id as any)}
                        className={`py-2 px-2.5 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          selectedPortal === p.id 
                            ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300 flex items-center justify-between">
                    <span>Supabase Project URL</span>
                    <span className="text-[9px] text-zinc-500 font-normal">HTTPS REQUIRED</span>
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>

                {/* Custom Anon Key Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300 flex items-center justify-between">
                    <span>Supabase Anon Public Key</span>
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="text-[10px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <textarea
                    rows={3}
                    value={showKey ? customKey : customKey.replace(/./g, '•')}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="Paste your Supabase anon/public API key..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00ffcc] resize-none"
                  />
                </div>

                {/* Connection Status Test Feedback */}
                {testResult && (
                  <div className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                    testResult.success 
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
                      : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? 'GATEWAY CONNECTED' : 'GATEWAY ERROR'}</p>
                      <p className="text-[11px] opacity-90">{testResult.message}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleTestConnection}
                    disabled={testingConnection}
                    className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
                    <span>{testingConnection ? 'Pinging Gateway...' : 'Test Connection'}</span>
                  </button>

                  <button
                    onClick={handleSaveCredentials}
                    className="flex-1 py-2.5 bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-mono font-black text-xs uppercase rounded-xl transition-all shadow-md shadow-[#00ffcc]/10 cursor-pointer"
                  >
                    Save & Apply Keys
                  </button>
                </div>

                <button
                  onClick={handleResetCredentials}
                  className="w-full text-center text-zinc-500 hover:text-zinc-400 text-[11px] font-mono underline cursor-pointer py-1"
                >
                  Reset to Default Cloud Project
                </button>
              </div>
            )}

            {/* TAB 2: PROFILE MEDIA & ASSETS */}
            {activeSubTab === 'profile' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">
                    Role / Title
                  </label>
                  <input
                    type="text"
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">
                    Avatar Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00ffcc]"
                    />
                    {profileAvatar && (
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
                        <img src={profileAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">
                    Banner Cover URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileBanner}
                      onChange={(e) => setProfileBanner(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#00ffcc]"
                    />
                    {profileBanner && (
                      <div className="w-14 h-9 rounded-xl overflow-hidden border border-zinc-700 shrink-0">
                        <img src={profileBanner} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold uppercase text-zinc-300">
                    Biography
                  </label>
                  <textarea
                    rows={3}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Short artist/touring bio..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] resize-none"
                  />
                </div>

                <button
                  onClick={handleSaveProfileAssets}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-black text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Profile Assets
                </button>
              </div>
            )}

            {/* TAB 3: STORAGE & CACHE PURGE */}
            {activeSubTab === 'storage' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-zinc-900/40 border border-zinc-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Total Local Storage</span>
                    <h4 className="text-lg font-black text-white font-mono">{storageUsageKb} KB</h4>
                    <p className="text-[10px] text-zinc-400 font-mono">{storageItemCount} active persistent keys</p>
                  </div>
                  <button
                    onClick={recalculateStorage}
                    className="p-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-lg transition-colors cursor-pointer"
                    title="Recalculate Storage"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Largest Cache Keys */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-400">
                    Heaviest Cached Keys
                  </span>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {storageKeys.map((k, kIdx) => (
                      <div key={`${k.key}-${kIdx}`} className="flex items-center justify-between px-3 py-1.5 bg-zinc-950 border border-zinc-850 rounded-lg text-xs font-mono">
                        <span className="text-zinc-300 truncate pr-2 max-w-[240px]">{k.key}</span>
                        <span className="text-emerald-400 font-bold shrink-0">{k.sizeKb} KB</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selective Purge Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleClearCache('nexus_only')}
                    className="w-full py-2 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer"
                  >
                    Clear Scene Cache (Keep Profile)
                  </button>
                  <button
                    onClick={() => handleClearCache('all')}
                    className="w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Reset All Local Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: OFFLINE SYNC QUEUE */}
            {activeSubTab === 'queue' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white font-mono uppercase">
                      Pending Injects ({offlineActions.length})
                    </span>
                    <p className="text-[10px] text-zinc-400 font-mono">
                      Mutations queued while offline or in resilience mode
                    </p>
                  </div>

                  <button
                    onClick={handleProcessQueueNow}
                    disabled={isSyncingQueue || offlineActions.length === 0}
                    className="px-3 py-1.5 bg-[#00ffcc] hover:bg-[#00e6b8] disabled:opacity-40 text-black font-mono font-black text-xs uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                    <span>Sync Now</span>
                  </button>
                </div>

                {offlineActions.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-950/60 border border-zinc-900 rounded-xl space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs text-zinc-300 font-mono font-bold">Offline Queue is Clean</p>
                    <p className="text-[10px] text-zinc-500">All local mutations are synchronized with database.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {offlineActions.map((action, idx) => (
                      <div key={action.id ? `action-${action.id}-${idx}` : `action-${idx}`} className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#00ffcc] uppercase">
                            [{action.action}] {action.table}
                          </span>
                          <span className="text-[9px] text-zinc-500">
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 bg-black/50 p-1.5 rounded border border-zinc-900 max-h-16 overflow-y-auto">
                          {JSON.stringify(action.payload || {})}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {offlineActions.length > 0 && (
                  <button
                    onClick={() => handleClearCache('offline_queue')}
                    className="w-full py-2 text-rose-400 hover:text-rose-300 text-xs font-mono underline cursor-pointer"
                  >
                    Discard & Purge Pending Queue
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsDrawer;
