import { useEffect, useState, useCallback, useRef } from 'react';
import { getSupabase } from '../supabase';

export interface UserPresenceInfo {
  userId?: string;
  email?: string;
  name?: string;
  handle?: string;
  isOnline: boolean;
  lastActiveAt: number | null; // Epoch ms
  showActiveStatus?: boolean;
  device?: string;
}

export interface FormattedPresence {
  text: string;
  shortText: string;
  subtext: string;
  dotClass: string;
  badgeClass: string;
  isOnline: boolean;
  isRecentlyActive: boolean;
  statusType: 'online' | 'recent' | 'offline';
}

// In-memory store for active realtime presences and historical last-seen timestamps
class PresenceManager {
  private activePresences: Map<string, UserPresenceInfo> = new Map();
  private lastSeenCache: Map<string, number> = new Map();
  private listeners: Set<() => void> = new Set();
  private channel: any = null;
  private heartbeatInterval: any = null;
  private lastHeartbeatSent: number = 0;
  private isInitialized: boolean = false;
  private currentUserId: string | null = null;
  private currentUserEmail: string | null = null;
  private isStealthMode: boolean = false;

  constructor() {
    this.loadLastSeenCache();
  }

  private loadLastSeenCache() {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('nexus_presence_last_seen_cache');
        if (saved) {
          const parsed = JSON.parse(saved);
          Object.entries(parsed).forEach(([key, val]) => {
            if (typeof val === 'number') {
              this.lastSeenCache.set(key.toLowerCase().trim(), val);
            }
          });
        }
      } catch (e) {}
    }
  }

  private saveLastSeenCache() {
    if (typeof localStorage !== 'undefined') {
      try {
        const obj: Record<string, number> = {};
        this.lastSeenCache.forEach((val, key) => {
          obj[key] = val;
        });
        localStorage.setItem('nexus_presence_last_seen_cache', JSON.stringify(obj));
      } catch (e) {}
    }
  }

  public subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (e) {}
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus_presence_updated'));
    }
  }

  public recordActivity(key: string, timestamp: number = Date.now()) {
    if (!key) return;
    const cleanKey = key.toLowerCase().trim();
    this.lastSeenCache.set(cleanKey, timestamp);
    this.saveLastSeenCache();
    this.notifyListeners();
  }

  public initialize(userId?: string | null, email?: string | null, showActiveStatus: boolean = true) {
    this.currentUserId = userId || null;
    this.currentUserEmail = email ? email.toLowerCase().trim() : null;
    this.isStealthMode = !showActiveStatus;

    if (this.isInitialized && this.channel) {
      this.sendHeartbeat();
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    this.isInitialized = true;

    // Track active user via Supabase Realtime channel
    const presenceKey = this.currentUserId || this.currentUserEmail || `anon_${Date.now()}`;
    const channelName = 'nexus_global_presence';

    this.channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel.presenceState();
        this.handlePresenceSync(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        this.handlePresenceJoin(key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        this.handlePresenceLeave(key, leftPresences);
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await this.sendHeartbeat();
        }
      });

    // Start background activity heartbeat listener
    this.setupHeartbeatListeners();
  }

  private handlePresenceSync(state: Record<string, any[]>) {
    const nextMap = new Map<string, UserPresenceInfo>();

    Object.entries(state).forEach(([key, presences]) => {
      if (!Array.isArray(presences) || presences.length === 0) return;
      const latest = presences[presences.length - 1];
      if (!latest) return;

      const info: UserPresenceInfo = {
        userId: latest.userId || latest.id || key,
        email: latest.email?.toLowerCase().trim(),
        name: latest.name || latest.full_name,
        handle: latest.handle || latest.console_handle,
        isOnline: latest.showActiveStatus !== false,
        lastActiveAt: latest.lastActiveAt || Date.now(),
        showActiveStatus: latest.showActiveStatus !== false,
      };

      if (info.userId) nextMap.set(info.userId.toLowerCase().trim(), info);
      if (info.email) nextMap.set(info.email.toLowerCase().trim(), info);
      if (info.handle) nextMap.set(info.handle.toLowerCase().trim(), info);
      if (info.name) nextMap.set(info.name.toLowerCase().trim(), info);

      // Cache last seen
      if (info.lastActiveAt) {
        if (info.userId) this.lastSeenCache.set(info.userId.toLowerCase().trim(), info.lastActiveAt);
        if (info.email) this.lastSeenCache.set(info.email.toLowerCase().trim(), info.lastActiveAt);
        if (info.name) this.lastSeenCache.set(info.name.toLowerCase().trim(), info.lastActiveAt);
      }
    });

    this.activePresences = nextMap;
    this.saveLastSeenCache();
    this.notifyListeners();
  }

  private handlePresenceJoin(key: string, newPresences: any[]) {
    if (!Array.isArray(newPresences) || newPresences.length === 0) return;
    const latest = newPresences[newPresences.length - 1];
    if (!latest) return;

    const info: UserPresenceInfo = {
      userId: latest.userId || latest.id || key,
      email: latest.email?.toLowerCase().trim(),
      name: latest.name || latest.full_name,
      handle: latest.handle || latest.console_handle,
      isOnline: latest.showActiveStatus !== false,
      lastActiveAt: latest.lastActiveAt || Date.now(),
      showActiveStatus: latest.showActiveStatus !== false,
    };

    if (info.userId) this.activePresences.set(info.userId.toLowerCase().trim(), info);
    if (info.email) this.activePresences.set(info.email.toLowerCase().trim(), info);
    if (info.handle) this.activePresences.set(info.handle.toLowerCase().trim(), info);
    if (info.name) this.activePresences.set(info.name.toLowerCase().trim(), info);

    if (info.lastActiveAt) {
      if (info.userId) this.lastSeenCache.set(info.userId.toLowerCase().trim(), info.lastActiveAt);
      if (info.email) this.lastSeenCache.set(info.email.toLowerCase().trim(), info.lastActiveAt);
    }

    this.notifyListeners();
  }

  private handlePresenceLeave(key: string, leftPresences: any[]) {
    const now = Date.now();
    if (Array.isArray(leftPresences)) {
      leftPresences.forEach((p) => {
        if (p.userId) {
          this.activePresences.delete(p.userId.toLowerCase().trim());
          this.lastSeenCache.set(p.userId.toLowerCase().trim(), now);
        }
        if (p.email) {
          this.activePresences.delete(p.email.toLowerCase().trim());
          this.lastSeenCache.set(p.email.toLowerCase().trim(), now);
        }
        if (p.name) {
          this.activePresences.delete(p.name.toLowerCase().trim());
          this.lastSeenCache.set(p.name.toLowerCase().trim(), now);
        }
      });
    }
    this.activePresences.delete(key.toLowerCase().trim());
    this.lastSeenCache.set(key.toLowerCase().trim(), now);
    this.saveLastSeenCache();
    this.notifyListeners();
  }

  public async sendHeartbeat() {
    if (!this.channel || this.isStealthMode) {
      if (this.channel && this.isStealthMode) {
        try {
          await this.channel.untrack();
        } catch (e) {}
      }
      return;
    }

    const now = Date.now();
    if (now - this.lastHeartbeatSent < 15000) return; // Throttle to every 15s min
    this.lastHeartbeatSent = now;

    let userName = 'Operator';
    let userHandle = '';

    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('nexus_core_user_profile') || localStorage.getItem('nexus_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          userName = parsed.name || parsed.full_name || userName;
          userHandle = parsed.console_handle || userHandle;
          if (parsed.show_active_status === false) {
            this.isStealthMode = true;
            await this.channel.untrack();
            return;
          }
        }
      } catch (e) {}
    }

    try {
      await this.channel.track({
        userId: this.currentUserId,
        email: this.currentUserEmail,
        name: userName,
        handle: userHandle,
        lastActiveAt: now,
        showActiveStatus: true,
      });

      if (this.currentUserId) this.lastSeenCache.set(this.currentUserId.toLowerCase().trim(), now);
      if (this.currentUserEmail) this.lastSeenCache.set(this.currentUserEmail.toLowerCase().trim(), now);
    } catch (err) {}
  }

  private setupHeartbeatListeners() {
    if (typeof window === 'undefined') return;

    const onUserActivity = () => {
      if (document.visibilityState === 'visible') {
        this.sendHeartbeat();
      }
    };

    window.addEventListener('mousemove', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('touchstart', onUserActivity, { passive: true });
    window.addEventListener('focus', onUserActivity);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sendHeartbeat();
      } else {
        // Tab went to background
        const now = Date.now();
        if (this.currentUserId) this.lastSeenCache.set(this.currentUserId.toLowerCase().trim(), now);
        if (this.currentUserEmail) this.lastSeenCache.set(this.currentUserEmail.toLowerCase().trim(), now);
        this.saveLastSeenCache();
      }
    });

    // Periodic heartbeat every 45s while open
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.sendHeartbeat();
      }
    }, 45000);
  }

  public getPresence(identifierOrObj?: any): UserPresenceInfo {
    if (!identifierOrObj) {
      return { isOnline: false, lastActiveAt: null, showActiveStatus: false };
    }

    let id = '';
    let email = '';
    let name = '';
    let handle = '';
    let explicitShowActive = true;
    let explicitTimestamp: number | null = null;

    if (typeof identifierOrObj === 'string') {
      const clean = identifierOrObj.toLowerCase().trim();
      if (clean.includes('@')) email = clean;
      else id = clean;
    } else if (typeof identifierOrObj === 'object') {
      id = (identifierOrObj.id || identifierOrObj.userId || identifierOrObj.profile_id || '').toLowerCase().trim();
      email = (identifierOrObj.email || identifierOrObj.contactId || '').toLowerCase().trim();
      name = (identifierOrObj.name || identifierOrObj.full_name || identifierOrObj.profileName || '').toLowerCase().trim();
      handle = (identifierOrObj.handle || identifierOrObj.console_handle || identifierOrObj.username || '').toLowerCase().trim();

      if (identifierOrObj.show_active_status === false) {
        explicitShowActive = false;
      }

      if (identifierOrObj.last_seen_at || identifierOrObj.last_active_at || identifierOrObj.updated_at || identifierOrObj.rawTime) {
        const raw = identifierOrObj.last_seen_at || identifierOrObj.last_active_at || identifierOrObj.updated_at || identifierOrObj.rawTime;
        const parsed = typeof raw === 'number' ? raw : new Date(raw).getTime();
        if (!isNaN(parsed) && parsed > 0) {
          explicitTimestamp = parsed;
        }
      }
    }

    // Check if stealth mode / private
    if (!explicitShowActive) {
      return { isOnline: false, lastActiveAt: null, showActiveStatus: false };
    }

    // 1. Check live realtime active presences
    const keysToCheck = [id, email, handle, name].filter(Boolean);
    for (const key of keysToCheck) {
      const live = this.activePresences.get(key);
      if (live && live.isOnline) {
        return {
          userId: live.userId || id,
          email: live.email || email,
          name: live.name || name,
          handle: live.handle || handle,
          isOnline: true,
          lastActiveAt: live.lastActiveAt || Date.now(),
          showActiveStatus: true,
        };
      }
    }

    // 2. Check cached last active timestamps
    let bestLastSeen: number | null = explicitTimestamp;
    for (const key of keysToCheck) {
      const cached = this.lastSeenCache.get(key);
      if (cached && (!bestLastSeen || cached > bestLastSeen)) {
        bestLastSeen = cached;
      }
    }

    // If active in the last 2 minutes, treat as online
    if (bestLastSeen) {
      const diffMs = Date.now() - bestLastSeen;
      const isVeryRecent = diffMs >= 0 && diffMs < 2 * 60 * 1000; // 2 minutes

      if (isVeryRecent) {
        return {
          userId: id,
          email: email,
          name: name,
          handle: handle,
          isOnline: true,
          lastActiveAt: bestLastSeen,
          showActiveStatus: true,
        };
      }

      return {
        userId: id,
        email: email,
        name: name,
        handle: handle,
        isOnline: false,
        lastActiveAt: bestLastSeen,
        showActiveStatus: true,
      };
    }

    return {
      userId: id,
      email: email,
      name: name,
      handle: handle,
      isOnline: false,
      lastActiveAt: null,
      showActiveStatus: true,
    };
  }

  public isOnline(identifierOrObj?: any): boolean {
    return this.getPresence(identifierOrObj).isOnline;
  }
}

// Global Singleton Instance
export const presenceManager = new PresenceManager();

/**
 * Accurately formats a user's presence & last seen timestamp into human-friendly strings and visual styles.
 */
export function formatPresenceStatus(presence: UserPresenceInfo | null | undefined): FormattedPresence {
  if (!presence) {
    return {
      text: 'Offline',
      shortText: 'Offline',
      subtext: 'Encrypted Channel',
      dotClass: 'bg-zinc-600 ring-zinc-800',
      badgeClass: 'text-zinc-500 bg-zinc-900/60 border-zinc-800',
      isOnline: false,
      isRecentlyActive: false,
      statusType: 'offline',
    };
  }

  if (presence.showActiveStatus === false) {
    return {
      text: 'Offline',
      shortText: 'Offline',
      subtext: 'Encrypted Channel',
      dotClass: 'bg-zinc-600 ring-zinc-800',
      badgeClass: 'text-zinc-500 bg-zinc-900/60 border-zinc-800',
      isOnline: false,
      isRecentlyActive: false,
      statusType: 'offline',
    };
  }

  if (presence.isOnline) {
    return {
      text: 'Active now',
      shortText: 'Active',
      subtext: 'Real-time Signal Live',
      dotClass: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.9)] animate-pulse ring-2 ring-emerald-950',
      badgeClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
      isOnline: true,
      isRecentlyActive: true,
      statusType: 'online',
    };
  }

  if (!presence.lastActiveAt) {
    return {
      text: 'Offline',
      shortText: 'Offline',
      subtext: 'Encrypted Channel',
      dotClass: 'bg-zinc-600 ring-zinc-800',
      badgeClass: 'text-zinc-500 bg-zinc-900/60 border-zinc-800',
      isOnline: false,
      isRecentlyActive: false,
      statusType: 'offline',
    };
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - presence.lastActiveAt);
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 1) {
    return {
      text: 'Active just now',
      shortText: 'Active now',
      subtext: 'Active just now',
      dotClass: 'bg-emerald-400/90 ring-emerald-950 shadow-[0_0_6px_rgba(52,211,153,0.5)]',
      badgeClass: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40',
      isOnline: true,
      isRecentlyActive: true,
      statusType: 'online',
    };
  }

  if (diffMins < 60) {
    return {
      text: `Active ${diffMins}m ago`,
      shortText: `${diffMins}m ago`,
      subtext: `Last active ${diffMins}m ago`,
      dotClass: 'bg-amber-400/80 ring-amber-950 shadow-[0_0_4px_rgba(251,191,36,0.3)]',
      badgeClass: 'text-amber-400 bg-amber-950/30 border-amber-800/40',
      isOnline: false,
      isRecentlyActive: true,
      statusType: 'recent',
    };
  }

  if (diffHours < 24) {
    return {
      text: `Active ${diffHours}h ago`,
      shortText: `${diffHours}h ago`,
      subtext: `Last active ${diffHours}h ago`,
      dotClass: 'bg-zinc-500 ring-zinc-800',
      badgeClass: 'text-zinc-400 bg-zinc-900/60 border-zinc-800',
      isOnline: false,
      isRecentlyActive: false,
      statusType: 'recent',
    };
  }

  if (diffDays === 1) {
    return {
      text: 'Active yesterday',
      shortText: 'Yesterday',
      subtext: 'Last active yesterday',
      dotClass: 'bg-zinc-600 ring-zinc-800',
      badgeClass: 'text-zinc-500 bg-zinc-900/60 border-zinc-800',
      isOnline: false,
      isRecentlyActive: false,
      statusType: 'offline',
    };
  }

  if (diffDays < 7) {
    return {
      text: `Active ${diffDays}d ago`,
      shortText: `${diffDays}d ago`,
      subtext: `Last active ${diffDays}d ago`,
      dotClass: 'bg-zinc-600 ring-zinc-800',
      badgeClass: 'text-zinc-500 bg-zinc-900/60 border-zinc-800',
      isOnline: false,
      isRecentlyActive: false,
      statusType: 'offline',
    };
  }

  const d = new Date(presence.lastActiveAt);
  const formattedDate = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return {
    text: `Active ${formattedDate}`,
    shortText: formattedDate,
    subtext: `Last active ${formattedDate}`,
    dotClass: 'bg-zinc-700 ring-zinc-900',
    badgeClass: 'text-zinc-600 bg-zinc-950 border-zinc-900',
    isOnline: false,
    isRecentlyActive: false,
    statusType: 'offline',
  };
}

/**
 * React hook to get accurate live presence and status formatting for a specific contact/user.
 */
export function useUserPresence(targetIdentifierOrProfile?: any) {
  const [presence, setPresence] = useState<UserPresenceInfo>(() =>
    presenceManager.getPresence(targetIdentifierOrProfile)
  );

  const targetRef = useRef(targetIdentifierOrProfile);
  targetRef.current = targetIdentifierOrProfile;

  const update = useCallback(() => {
    setPresence(presenceManager.getPresence(targetRef.current));
  }, []);

  useEffect(() => {
    update();
    const unsub = presenceManager.subscribe(update);

    // Refresh every 30s so time diffs ("10m ago" -> "11m ago") update seamlessly
    const interval = setInterval(update, 30000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [update, targetIdentifierOrProfile]);

  const formatted = formatPresenceStatus(presence);

  return {
    presence,
    formatted,
    isOnline: presence.isOnline,
  };
}

/**
 * Hook to initialize global presence heartbeat at root app level.
 */
export function usePresenceHeartbeat(userId?: string | null, email?: string | null, showActiveStatus: boolean = true) {
  useEffect(() => {
    presenceManager.initialize(userId, email, showActiveStatus);
  }, [userId, email, showActiveStatus]);
}
