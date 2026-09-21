// Nexus Real-Time Device Push Notification Engine
// Tailored for Industry Pro and Fan Workspaces

import { getSupabase } from '../supabase';

export type WorkspaceType = 'industry_pro' | 'fan_only' | 'band' | 'promoter' | 'label' | 'creative' | 'fan';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushCategoryConfig {
  id: string;
  label: string;
  description: string;
  workspace: 'industry_pro' | 'fan_only' | 'global';
  priority: 'P0' | 'P1';
  icon: string;
  defaultEnabled: boolean;
}

export const INDUSTRY_PRO_PUSH_CATEGORIES: PushCategoryConfig[] = [
  {
    id: 'ticket_velocity',
    label: 'Ticket Velocity & Sell-Outs',
    description: 'Real-time box office sell-out warnings and gate revenue thresholds.',
    workspace: 'industry_pro',
    priority: 'P0',
    icon: '💰',
    defaultEnabled: true,
  },
  {
    id: 'routing_beacon',
    label: 'Routing Beacon & Open Date Offers',
    description: 'Inbound touring acts with open routing dates in your 50mi venue radius.',
    workspace: 'industry_pro',
    priority: 'P0',
    icon: '📍',
    defaultEnabled: true,
  },
  {
    id: 'booking_deals',
    label: 'Booking Offers & Signed Deals',
    description: 'Guarantee offers, contracts submitted, and signature authorizations.',
    workspace: 'industry_pro',
    priority: 'P0',
    icon: '⚡',
    defaultEnabled: true,
  },
  {
    id: 'day_of_show_logistics',
    label: 'Day-of-Show & Curfew Alerts',
    description: 'Bus calls, load-out checklists, runner rotations, and curfew alarms.',
    workspace: 'industry_pro',
    priority: 'P0',
    icon: '⏰',
    defaultEnabled: true,
  },
  {
    id: 'priority_epk',
    label: 'Priority EPK Submissions',
    description: 'Tier-1 roster submissions and festival showcase press kits.',
    workspace: 'industry_pro',
    priority: 'P1',
    icon: '📑',
    defaultEnabled: true,
  },
  {
    id: 'inventory_stockout',
    label: 'Merch & Van Stock Depletion',
    description: 'Immediate restock notices when physical inventory reaches critical lows.',
    workspace: 'industry_pro',
    priority: 'P1',
    icon: '📦',
    defaultEnabled: true,
  },
];

export const FAN_PUSH_CATEGORIES: PushCategoryConfig[] = [
  {
    id: 'tour_proximity',
    label: 'Band En Route / City Proximity',
    description: 'Instant alert when tracked bands arrive in your city before showtime.',
    workspace: 'fan_only',
    priority: 'P0',
    icon: '🤘',
    defaultEnabled: true,
  },
  {
    id: 'scarcity_merch_drop',
    label: 'Limited Drops & Vinyl Scarcity',
    description: 'Flash drop launches and low stock alarms (< 5 pressings left).',
    workspace: 'fan_only',
    priority: 'P0',
    icon: '⚡',
    defaultEnabled: true,
  },
  {
    id: 'vip_guestlist_access',
    label: 'VIP Access & Gate Authorization',
    description: 'Soundcheck passes, guestlist confirmations, and door call times.',
    workspace: 'fan_only',
    priority: 'P0',
    icon: '🎟️',
    defaultEnabled: true,
  },
  {
    id: 'exclusive_content',
    label: 'Vault Premieres & Soundboard Tapes',
    description: 'Exclusive live soundboard recordings and unreleased demo drops.',
    workspace: 'fan_only',
    priority: 'P1',
    icon: '🔥',
    defaultEnabled: true,
  },
  {
    id: 'artist_interactions',
    label: 'Direct Artist Replies & Mentions',
    description: 'When verified bands comment, quote, or reply to your pit uploads.',
    workspace: 'fan_only',
    priority: 'P1',
    icon: '💬',
    defaultEnabled: true,
  },
];

export interface PushNotificationPreferences {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  categories: Record<string, boolean>;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // e.g. "23:00"
  quietHoursEnd: string; // e.g. "08:00"
}

const STORAGE_KEY = 'nexus_device_push_preferences_v1';

// Default configuration builder
export const getDefaultPushPreferences = (): PushNotificationPreferences => {
  const initialCategories: Record<string, boolean> = {
    direct_messages: true,
  };

  INDUSTRY_PRO_PUSH_CATEGORIES.forEach((cat) => {
    initialCategories[cat.id] = cat.defaultEnabled;
  });

  FAN_PUSH_CATEGORIES.forEach((cat) => {
    initialCategories[cat.id] = cat.defaultEnabled;
  });

  return {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    categories: initialCategories,
    quietHoursEnabled: false,
    quietHoursStart: '23:00',
    quietHoursEnd: '08:00',
  };
};

// Synthesized audio alert tones using Web Audio API
export function playPushChime(type: 'critical' | 'normal' | 'fan' = 'normal') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'critical') {
      // Urgent double beep for P0 logistics / sell-outs / limited drops
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.18);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.3);
      gain2.gain.setValueAtTime(0.2, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.35);
    } else if (type === 'fan') {
      // Uplifting melodic chime for fan drops/VIP
      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.22);
      });
    } else {
      // Standard subtle ping
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch (e) {
    // Audio context may be locked until user interaction
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIframeEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

// Push Manager Singleton
class DevicePushManager {
  private preferences: PushNotificationPreferences = getDefaultPushPreferences();
  private registration: ServiceWorkerRegistration | null = null;
  private recentNotificationHashes = new Set<string>();

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences();
      this.initServiceWorker();
      this.setupWindowListener();
    }
  }

  private loadPreferences() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.preferences = { ...getDefaultPushPreferences(), ...JSON.parse(stored) };
      }
    } catch (e) {
      this.preferences = getDefaultPushPreferences();
    }
  }

  public getPreferences(): PushNotificationPreferences {
    return { ...this.preferences };
  }

  public async updatePreferences(
    newPrefs: Partial<PushNotificationPreferences>,
    userId?: string
  ): Promise<PushNotificationPreferences> {
    this.preferences = { ...this.preferences, ...newPrefs };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences));
    } catch (e) {}

    // Synchronize to Supabase profile metadata if user exists
    if (userId) {
      try {
        const supabase = getSupabase();
        if (supabase) {
          await supabase.from('profiles').update({
            push_preferences: this.preferences,
            updated_at: new Date().toISOString()
          }).eq('id', userId);
        }
      } catch (err) {
        console.warn('[PushManager] Supabase preference sync error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nexus_push_preferences_changed', { detail: this.preferences })
      );
    }

    return this.preferences;
  }

  public getPermissionStatus(): PushPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as PushPermissionStatus;
  }

  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.registration = reg;
      return reg;
    } catch (err) {
      console.warn('[PushManager] Service Worker registration failed:', err);
      return null;
    }
  }

  private async initServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      this.registration = await navigator.serviceWorker.getRegistration();
      if (!this.registration) {
        this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
    } catch (e) {
      console.warn('[PushManager] Service worker lookup error:', e);
    }
  }

  private setupWindowListener() {
    if (typeof window === 'undefined') return;
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'NEXUS_PUSH_NAVIGATE') {
        const targetTab = event.data.targetTab;
        if (targetTab) {
          window.dispatchEvent(new CustomEvent('nexus_navigate_tab', { detail: targetTab }));
        }
      }
      if (event.data?.type === 'NEXUS_OPEN_CHAT') {
        window.dispatchEvent(
          new CustomEvent('nexus_open_chat', {
            detail: {
              profile_id: event.data.senderId,
              name: event.data.name,
              username: event.data.name,
            },
          })
        );
      }
    });
  }

  public async subscribeToPushServer(userInfo?: { id?: string; email?: string }): Promise<PushSubscription | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      let reg = this.registration;
      if (!reg) {
        reg = await navigator.serviceWorker.ready;
        this.registration = reg;
      }

      // 1. Obtain VAPID Public Key from backend API or fallback
      let publicKey = 'BFtYUwYxD4nggBN6jldwPmQ-rM209n3Cqom0TYLxoksAambfhk5PzDZ-0-FppflHkjW4P6tlvTsOnnl1kVlitiQ';
      try {
        const res = await fetch('/api/push/vapid-public-key');
        if (res.ok) {
          const data = await res.json();
          if (data.publicKey) publicKey = data.publicKey;
        }
      } catch (err) {
        console.warn('[PushManager] VAPID fetch error, using default:', err);
      }

      // 2. Subscribe browser to Push Service
      const convertedKey = urlBase64ToUint8Array(publicKey);
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      }

      // 3. Register subscription with Nexus server
      const payload = {
        subscription: sub.toJSON ? sub.toJSON() : sub,
        userId: userInfo?.id,
        userEmail: userInfo?.email,
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('[PushManager] Device successfully subscribed to real-time Web Push.');
      localStorage.setItem('nexus_push_synced', 'true');
      return sub;
    } catch (err) {
      console.warn('[PushManager] subscribeToPushServer warning:', err);
      return null;
    }
  }

  public async sendPushToServer(options: {
    userId?: string;
    userEmail?: string;
    title: string;
    body: string;
    icon?: string;
    targetTab?: string;
    category?: string;
    priority?: 'P0' | 'P1';
    data?: any;
  }): Promise<boolean> {
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      return res.ok;
    } catch (err) {
      console.warn('[PushManager] sendPushToServer error:', err);
      return false;
    }
  }

  public async requestPermission(userInfo?: { id?: string; email?: string }): Promise<PushPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        await this.registerServiceWorker();
        await this.updatePreferences({ enabled: true }, userInfo?.id);
        await this.subscribeToPushServer(userInfo);
      }
      return result as PushPermissionStatus;
    } catch (e) {
      console.error('[PushManager] Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public async notify(payload: {
    title: string;
    body: string;
    category?: string;
    workspace?: 'industry_pro' | 'fan_only' | 'all';
    targetTab?: string;
    icon?: string;
    data?: any;
    priority?: 'P0' | 'P1';
    sound?: boolean;
    renotify?: boolean;
  }): Promise<boolean> {
    return this.sendPushNotification({
      ...payload,
      category: payload.category || 'general'
    });
  }

  public async sendPushNotification(payload: {
    title: string;
    body: string;
    category: string;
    workspace?: 'industry_pro' | 'fan_only' | 'all';
    targetTab?: string;
    icon?: string;
    data?: any;
    priority?: 'P0' | 'P1';
    sound?: boolean;
    renotify?: boolean;
  }): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // Check global enable & category enable
    if (!this.preferences.enabled) return false;
    if (payload.category && this.preferences.categories[payload.category] === false) {
      return false;
    }

    // Check Quiet Hours
    if (this.preferences.quietHoursEnabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (
        this.preferences.quietHoursStart > this.preferences.quietHoursEnd
          ? currentTime >= this.preferences.quietHoursStart || currentTime <= this.preferences.quietHoursEnd
          : currentTime >= this.preferences.quietHoursStart && currentTime <= this.preferences.quietHoursEnd
      ) {
        // Suppress during quiet hours unless P0
        if (payload.priority !== 'P0') return false;
      }
    }

    // Deduplication key
    const hash = `${payload.title}_${payload.body}`;
    if (this.recentNotificationHashes.has(hash)) {
      return false; // Skip duplicate within short window
    }
    this.recentNotificationHashes.add(hash);
    setTimeout(() => this.recentNotificationHashes.delete(hash), 6000);

    // Audio chime & vibration
    if (this.preferences.soundEnabled && payload.sound !== false) {
      const chimeType = payload.priority === 'P0' ? 'critical' : payload.workspace === 'fan_only' ? 'fan' : 'normal';
      playPushChime(chimeType);
    }
    if (this.preferences.vibrationEnabled && 'vibrate' in navigator) {
      try {
        navigator.vibrate(payload.priority === 'P0' ? [300, 100, 300, 100, 400] : [200, 100, 200]);
      } catch (e) {}
    }

    // Also dispatch to in-app notification drawer event
    window.dispatchEvent(
      new CustomEvent('nexus_in_app_notice', {
        detail: {
          id: 'push-' + Date.now(),
          title: payload.title,
          message: payload.body,
          time: 'Just now',
          type: payload.workspace === 'industry_pro' ? 'security' : payload.workspace === 'fan_only' ? 'gig' : 'system',
          targetTab: payload.targetTab || 'social',
          read: false,
          avatar: payload.icon || '/icon-192.png',
        },
      })
    );

    // Device system notification via Service Worker or Web Notification
    const permission = this.getPermissionStatus();
    if (permission === 'granted') {
      try {
        if (this.registration && 'showNotification' in this.registration) {
          await (this.registration as any).showNotification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'nexus-' + payload.category + '-' + Date.now(),
            renotify: payload.renotify ?? true,
            data: {
              targetTab: payload.targetTab,
              category: payload.category,
              workspace: payload.workspace,
              ...payload.data,
            },
          });
          return true;
        } else if ('Notification' in window) {
          const notif = new (window as any).Notification(payload.title, {
            body: payload.body,
            icon: payload.icon || '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'nexus-' + payload.category + '-' + Date.now(),
            data: {
              targetTab: payload.targetTab,
              ...payload.data,
            },
          });
          notif.onclick = () => {
            window.focus();
            if (payload.data?.senderId) {
              window.dispatchEvent(
                new CustomEvent('nexus_open_chat', {
                  detail: {
                    profile_id: payload.data.senderId,
                    name: payload.title,
                  },
                })
              );
            }
            if (payload.targetTab) {
              window.dispatchEvent(new CustomEvent('nexus_navigate_tab', { detail: payload.targetTab }));
            }
            notif.close();
          };
          return true;
        }
      } catch (err) {
        console.warn('[PushManager] Notification display error:', err);
      }
    }

    return false;
  }

  // Pre-configured test simulators for both workspaces
  public async simulatePush(
    type:
      | 'ticket_velocity'
      | 'routing_beacon'
      | 'booking_deals'
      | 'day_of_show_logistics'
      | 'priority_epk'
      | 'inventory_stockout'
      | 'tour_proximity'
      | 'scarcity_merch_drop'
      | 'vip_guestlist_access'
      | 'exclusive_content'
      | 'artist_interactions'
  ): Promise<boolean> {
    const simulators: Record<
      string,
      {
        title: string;
        body: string;
        category: string;
        workspace: 'industry_pro' | 'fan_only';
        targetTab: string;
        priority: 'P0' | 'P1';
      }
    > = {
      ticket_velocity: {
        title: '💰 Box Office Velocity Spike: 92% Sold Out!',
        body: 'Friday at Starland Ballroom crossed 92% capacity (644/700). Estimated door gross: $17,400.',
        category: 'ticket_velocity',
        workspace: 'industry_pro',
        targetTab: 'promoter',
        priority: 'P0',
      },
      routing_beacon: {
        title: '📍 Inbound Tour Beacon Match: Fit For An Autopsy',
        body: 'Fit For An Autopsy posted an open off-date in your 50mi venue radius for Oct 14. 1-tap hold available.',
        category: 'routing_beacon',
        workspace: 'industry_pro',
        targetTab: 'promoter',
        priority: 'P0',
      },
      booking_deals: {
        title: '⚡ New Booking Guarantee Offer: $4,500 + 80% Split',
        body: 'Live Nation / House of Blues submitted an offer for Saturday headline slot. Action required.',
        category: 'booking_deals',
        workspace: 'industry_pro',
        targetTab: 'promoter',
        priority: 'P0',
      },
      day_of_show_logistics: {
        title: '⏰ Day-of-Show Alert: Bus Call in 45 Min',
        body: 'Load-out inspection checklist due before 1:00 AM venue sound curfew.',
        category: 'day_of_show_logistics',
        workspace: 'industry_pro',
        targetTab: 'promoter',
        priority: 'P0',
      },
      priority_epk: {
        title: '📑 Priority EPK Submission: Roadburn 2026 Showcase',
        body: 'New high-tier EPK submission received from Sanguisugabogg for label & promoter review.',
        category: 'priority_epk',
        workspace: 'industry_pro',
        targetTab: 'label',
        priority: 'P1',
      },
      inventory_stockout: {
        title: '📦 Merch Depletion Warning: Tour Tees at Critical Low',
        body: 'Size XL tour shirts reached 0 remaining in van stock. Prompt restock suggested.',
        category: 'inventory_stockout',
        workspace: 'industry_pro',
        targetTab: 'label',
        priority: 'P1',
      },
      tour_proximity: {
        title: '🤘 Band Inbound: Necrophagist arrived in your city!',
        body: 'Doors open at 7:00 PM tonight at The Underworld. Pit check-in is live.',
        category: 'tour_proximity',
        workspace: 'fan_only',
        targetTab: 'social',
        priority: 'P0',
      },
      scarcity_merch_drop: {
        title: '⚡ Limited Vinyl Flash Drop: Only 5 Pressings Left!',
        body: 'Exclusive 180g blood-splatter edition of "Terrasite" is live in the storefront.',
        category: 'scarcity_merch_drop',
        workspace: 'fan_only',
        targetTab: 'social',
        priority: 'P0',
      },
      vip_guestlist_access: {
        title: '🎟️ VIP Soundcheck Gate Pass Authorized',
        body: 'Your VIP Soundcheck credentials are ready. Present your digital badge at Stage Door B by 5:30 PM.',
        category: 'vip_guestlist_access',
        workspace: 'fan_only',
        targetTab: 'social',
        priority: 'P0',
      },
      exclusive_content: {
        title: '🔥 Live Soundboard Tape Drop: The Black Dahlia Murder',
        body: 'Exclusive soundboard master recording from last night’s pit is now streamable in the Vault.',
        category: 'exclusive_content',
        workspace: 'fan_only',
        targetTab: 'social',
        priority: 'P1',
      },
      artist_interactions: {
        title: '💬 Direct Artist Reply from Sanguisugabogg',
        body: '"Killer photo in the pit, see you in the front row tomorrow!"',
        category: 'artist_interactions',
        workspace: 'fan_only',
        targetTab: 'social',
        priority: 'P1',
      },
    };

    const sim = simulators[type];
    if (!sim) return false;

    return this.sendPushNotification({
      title: sim.title,
      body: sim.body,
      category: sim.category,
      workspace: sim.workspace,
      targetTab: sim.targetTab,
      priority: sim.priority,
    });
  }
}

export const pushManager = new DevicePushManager();
