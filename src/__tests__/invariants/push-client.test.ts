import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Shared hoisted mocks for Capacitor plugins & API helpers
const {
  capState,
  pushPluginMocks,
  localPluginMocks,
  apiMocks,
} = vi.hoisted(() => {
  const pushListeners = new Map<string, Array<(payload: any) => any>>();
  const localListeners = new Map<string, Array<(payload: any) => any>>();

  return {
    capState: {
      isNative: false,
      platform: 'web' as 'android' | 'ios' | 'web',
      availablePlugins: new Set<string>(['PushNotifications', 'LocalNotifications']),
      pushListeners,
      localListeners,
    },
    pushPluginMocks: {
      checkPermissions: vi.fn(async () => ({ receive: 'prompt' })),
      requestPermissions: vi.fn(async () => ({ receive: 'granted' })),
      register: vi.fn(async () => {}),
      addListener: vi.fn((eventName: string, cb: (payload: any) => any) => {
        const list = pushListeners.get(eventName) || [];
        list.push(cb);
        pushListeners.set(eventName, list);
        return Promise.resolve({ remove: vi.fn() });
      }),
    },
    localPluginMocks: {
      createChannel: vi.fn(async () => {}),
      checkPermissions: vi.fn(async () => ({ display: 'granted' })),
      requestPermissions: vi.fn(async () => ({ display: 'granted' })),
      schedule: vi.fn(async () => ({ notifications: [] })),
      addListener: vi.fn((eventName: string, cb: (payload: any) => any) => {
        const list = localListeners.get(eventName) || [];
        list.push(cb);
        localListeners.set(eventName, list);
        return Promise.resolve({ remove: vi.fn() });
      }),
    },
    apiMocks: {
      authFetch: vi.fn(),
      getSupabaseAccessToken: vi.fn(async () => 'mock-jwt-token'),
    },
  };
});

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: () => capState.isNative,
    getPlatform: () => capState.platform,
    isPluginAvailable: (name: string) => capState.availablePlugins.has(name),
  },
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: pushPluginMocks,
}));

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: localPluginMocks,
}));

vi.mock('@/src/utils/apiConfig', () => apiMocks);
vi.mock('../../utils/apiConfig', () => apiMocks);

import {
  initPushClient,
  registerNativePush,
  registerWebPush,
  handlePushDeepLink,
  setActiveDmThreadId,
  setFloatingChatHeadOpen,
  peekPendingDmThread,
  consumePendingDmThread,
  consumePendingShowDeepLink,
  _resetPushClientForTests,
} from '@/src/lib/pushClient';

describe('Invariant 7: Client Capacitor + Web Push Registration, Foreground Suppression & Deep-Linking', () => {
  let dispatchedEvents: Array<{ type: string; detail: any }> = [];
  let swListeners: Array<(event: any) => void> = [];
  let originalDocument: any;
  let originalNotification: any;
  let originalPushManager: any;
  let originalServiceWorker: any;
  let originalEnvVapid: string | undefined;

  beforeEach(() => {
    _resetPushClientForTests();
    capState.isNative = false;
    capState.platform = 'web';
    capState.availablePlugins = new Set(['PushNotifications', 'LocalNotifications']);
    capState.pushListeners.clear();
    capState.localListeners.clear();

    dispatchedEvents = [];
    swListeners = [];

    pushPluginMocks.checkPermissions.mockResolvedValue({ receive: 'prompt' });
    pushPluginMocks.requestPermissions.mockResolvedValue({ receive: 'granted' });
    pushPluginMocks.register.mockResolvedValue(undefined);
    localPluginMocks.checkPermissions.mockResolvedValue({ display: 'granted' });
    localPluginMocks.requestPermissions.mockResolvedValue({ display: 'granted' });
    localPluginMocks.createChannel.mockResolvedValue(undefined);
    localPluginMocks.schedule.mockResolvedValue({ notifications: [] });

    apiMocks.getSupabaseAccessToken.mockResolvedValue('mock-jwt-token');
    apiMocks.authFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, publicKey: 'BFtYUwYxD4nggBN6jldwPmQ-rM209n3Cqom0TYLxoksAambfhk5PzDZ-0-FppflHkjW4P6tlvTsOnnl1kVlitiQ' }),
    });

    (window as any).dispatchEvent = vi.fn((ev: any) => {
      dispatchedEvents.push({ type: ev.type, detail: ev.detail });
      return true;
    });

    originalDocument = (globalThis as any).document;
    (globalThis as any).document = { visibilityState: 'visible' };

    originalNotification = (window as any).Notification;
    originalPushManager = (window as any).PushManager;
    originalServiceWorker = (navigator as any).serviceWorker;
    originalEnvVapid = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY;
  });

  afterEach(() => {
    (globalThis as any).document = originalDocument;
    if (originalNotification === undefined) delete (window as any).Notification;
    else (window as any).Notification = originalNotification;
    if (originalPushManager === undefined) delete (window as any).PushManager;
    else (window as any).PushManager = originalPushManager;
    if (originalServiceWorker === undefined) delete (navigator as any).serviceWorker;
    else (navigator as any).serviceWorker = originalServiceWorker;

    if ((import.meta as any).env) {
      if (originalEnvVapid === undefined) delete (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;
      else (import.meta as any).env.VITE_VAPID_PUBLIC_KEY = originalEnvVapid;
    }
  });

  it('registers native Capacitor Android FCM permissions and posts token to /api/push/register', async () => {
    capState.isNative = true;
    capState.platform = 'android';

    localStorage.setItem('nexus_auth_user_id', 'user-android-1');
    localStorage.setItem('nexus_auth_user_email', 'band@nexuscore.app');

    const res = await initPushClient({
      userId: 'user-android-1',
      userEmail: 'band@nexuscore.app',
    });
    expect(res).toBeUndefined();

    expect(localPluginMocks.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'nexus_alerts', importance: 5 })
    );
    expect(pushPluginMocks.checkPermissions).toHaveBeenCalledTimes(1);
    expect(pushPluginMocks.requestPermissions).toHaveBeenCalledTimes(1);
    expect(pushPluginMocks.register).toHaveBeenCalledTimes(1);

    // Emit native FCM registration token event
    const regCallbacks = capState.pushListeners.get('registration') || [];
    expect(regCallbacks).toHaveLength(1);
    await regCallbacks[0]({ value: 'fcm_native_token_xyz' });

    expect(localStorage.getItem('nexus_native_push_token')).toBe('fcm_native_token_xyz');
    expect(apiMocks.authFetch).toHaveBeenCalledWith(
      '/api/push/register',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );

    const postCall = apiMocks.authFetch.mock.calls.find(([url]) => url === '/api/push/register');
    const body = JSON.parse(postCall![1].body);
    expect(body).toMatchObject({
      token: 'fcm_native_token_xyz',
      fcm_token: 'fcm_native_token_xyz',
      platform: 'android',
      userId: 'user-android-1',
      userEmail: 'band@nexuscore.app',
    });
  });

  it('suppresses foreground DM banners/chimes when actively viewing that DM thread, while alerting for other threads', async () => {
    capState.isNative = true;
    capState.platform = 'android';

    await registerNativePush({ id: 'me-1', email: 'me@nexuscore.app' });
    const receivedCbs = capState.pushListeners.get('pushNotificationReceived') || [];
    expect(receivedCbs).toHaveLength(1);

    // Active thread matches incoming senderId -> suppress sound/banner spam
    setActiveDmThreadId('peer-active-42');
    await receivedCbs[0]({
      title: 'Alex Rivera',
      body: 'Soundcheck at 4pm',
      data: { type: 'dm', targetId: 'peer-active-42', senderId: 'peer-active-42' },
    });

    expect(localPluginMocks.schedule).not.toHaveBeenCalled();
    expect(dispatchedEvents.filter((e) => e.type === 'nexus_in_app_notice')).toHaveLength(0);

    // Different sender arrives while viewing peer-active-42 -> must display banner & schedule notification
    await receivedCbs[0]({
      title: 'Booking Agent',
      body: 'Settlement ready for Trees Dallas',
      data: { type: 'dm', targetId: 'peer-other-99', senderId: 'peer-other-99' },
    });

    expect(localPluginMocks.schedule).toHaveBeenCalledTimes(1);
    const notices = dispatchedEvents.filter((e) => e.type === 'nexus_in_app_notice');
    expect(notices).toHaveLength(1);
    expect(notices[0].detail).toMatchObject({
      title: 'Booking Agent',
      senderId: 'peer-other-99',
      type: 'message',
    });
  });

  it('registers Web/PWA Service Worker using VITE_VAPID_PUBLIC_KEY and posts web subscription to /api/push/register', async () => {
    capState.isNative = false;
    capState.platform = 'web';

    const testVapidKey =
      'BFtYUwYxD4nggBN6jldwPmQ-rM209n3Cqom0TYLxoksAambfhk5PzDZ-0-FppflHkjW4P6tlvTsOnnl1kVlitiQ';
    if ((import.meta as any).env) {
      (import.meta as any).env.VITE_VAPID_PUBLIC_KEY = testVapidKey;
    }

    const mockSubJson = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/web-sub-123',
      keys: { p256dh: 'mock-p256', auth: 'mock-auth' },
    };
    const mockSub = {
      ...mockSubJson,
      options: {},
      toJSON: () => mockSubJson,
    };

    const pushManagerSubscribe = vi.fn(async () => mockSub);
    const mockReg = {
      pushManager: {
        getSubscription: vi.fn(async () => null),
        subscribe: pushManagerSubscribe,
      },
    };

    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn(async () => mockReg),
        addEventListener: vi.fn((type: string, cb: (ev: any) => void) => {
          if (type === 'message') swListeners.push(cb);
        }),
      },
      configurable: true,
      writable: true,
    });

    const MockNotification = {
      permission: 'granted',
      requestPermission: vi.fn(async () => 'granted'),
    };
    (window as any).Notification = MockNotification;
    (globalThis as any).Notification = MockNotification;
    (window as any).PushManager = function PushManager() {};

    const result = await registerWebPush({
      userId: 'web-user-7',
      userEmail: 'fan@nexuscore.app',
    });

    expect((navigator as any).serviceWorker.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(pushManagerSubscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
    expect(result.subscription).toBe(mockSub);

    const regCall = apiMocks.authFetch.mock.calls.find(([url]) => url === '/api/push/register');
    expect(regCall).toBeDefined();
    const payload = JSON.parse(regCall![1].body);
    expect(payload).toMatchObject({
      platform: 'web',
      subscription: mockSubJson,
      web_push_subscription: mockSubJson,
      userId: 'web-user-7',
    });

    // Verify Service Worker notificationclick postMessage deep-links cleanly to a show reminder
    expect(swListeners).toHaveLength(1);
    swListeners[0]({
      data: {
        type: 'NEXUS_PUSH_NAVIGATE',
        pushType: 'show_reminder',
        showId: 'show-trees-88',
        targetId: 'show-trees-88',
        route: '/shows/show-trees-88',
      },
    });

    const showEvent = dispatchedEvents.find((e) => e.type === 'nexus_open_show_details');
    expect(showEvent?.detail).toMatchObject({
      showId: 'show-trees-88',
      targetId: 'show-trees-88',
      type: 'show_reminder',
    });
  });

  it('deep-links DM and Show Reminder notification taps on native pushNotificationActionPerformed', async () => {
    capState.isNative = true;
    capState.platform = 'android';

    await registerNativePush({ id: 'me-1', email: 'me@nexuscore.app' });
    const tapCallbacks = capState.pushListeners.get('pushNotificationActionPerformed') || [];
    expect(tapCallbacks).toHaveLength(1);

    // 1. Tapping a DM notification opens INBOX terminal thread
    tapCallbacks[0]({
      notification: {
        title: 'Corpsegrinder',
        data: {
          type: 'dm',
          targetId: 'peer-dm-55',
          senderId: 'peer-dm-55',
          senderName: 'Corpsegrinder',
          route: '/messages',
        },
      },
    });

    expect(dispatchedEvents.some((e) => e.type === 'nexus_navigate_tab' && e.detail === 'social')).toBe(true);
    const inboxEvent = dispatchedEvents.find((e) => e.type === 'nexus_open_inbox_thread');
    expect(inboxEvent?.detail).toMatchObject({
      profile_id: 'peer-dm-55',
      name: 'Corpsegrinder',
      feedTab: 'messages',
    });
    // When chat head is not open, it must NOT pop open a duplicate floating chat head over the Inbox
    expect(dispatchedEvents.some((e) => e.type === 'nexus_open_chat_thread')).toBe(false);
    // peekPendingDmThread preserves the pending thread for lazy-mounted InboxTerminal
    expect(peekPendingDmThread()).toMatchObject({
      profile_id: 'peer-dm-55',
      name: 'Corpsegrinder',
    });
    expect(consumePendingDmThread()).toMatchObject({
      profile_id: 'peer-dm-55',
      name: 'Corpsegrinder',
    });

    dispatchedEvents = [];

    // 1b. When Floating Chat Head IS already open, tapping a DM push notification switches the open Chat Head to that thread
    setFloatingChatHeadOpen(true);
    handlePushDeepLink({
      type: 'dm',
      senderId: 'peer-dm-77',
      title: '💬 Direct Message from Maya',
    });
    const chatHeadEvent = dispatchedEvents.find((e) => e.type === 'nexus_open_chat_thread');
    expect(chatHeadEvent?.detail).toMatchObject({
      profile_id: 'peer-dm-77',
      name: 'Maya',
      fromPushTap: true,
    });
    setFloatingChatHeadOpen(false);

    dispatchedEvents = [];

    // 1c. Tapping a Group Chat notification opens that specific group thread in Inbox
    handlePushDeepLink({
      type: 'direct_messages',
      senderId: 'peer-dm-55',
      groupId: 'grp_tour_crew_1',
      groupName: 'Tour Crew 2027',
    });
    const groupInboxEvent = dispatchedEvents.find((e) => e.type === 'nexus_open_inbox_thread');
    expect(groupInboxEvent?.detail).toMatchObject({
      profile_id: 'grp_tour_crew_1',
      name: 'Tour Crew 2027',
      isGroup: true,
      groupId: 'grp_tour_crew_1',
    });
    consumePendingDmThread();

    dispatchedEvents = [];

    // 2. Tapping a Show Reminder notification opens the specific show details modal
    handlePushDeepLink({
      type: 'show_reminder',
      targetId: 'show-nile-2026',
      showId: 'show-nile-2026',
      title: 'NILE @ AM/FM Dallas',
      route: '/shows',
    });

    expect(dispatchedEvents.some((e) => e.type === 'nexus_navigate_tab' && e.detail === 'social')).toBe(true);
    const showEvent = dispatchedEvents.find((e) => e.type === 'nexus_open_show_details');
    expect(showEvent?.detail).toMatchObject({
      showId: 'show-nile-2026',
      targetId: 'show-nile-2026',
      type: 'show_reminder',
    });
    expect(consumePendingShowDeepLink()).toMatchObject({
      showId: 'show-nile-2026',
      title: 'NILE @ AM/FM Dallas',
    });
  });

  it('does not invoke LocalNotifications on web when Notification API is unsupported and returns unsupported cleanly', async () => {
    capState.isNative = false;
    capState.platform = 'web';
    capState.availablePlugins = new Set(['PushNotifications', 'LocalNotifications']);
    delete (window as any).Notification;
    localPluginMocks.requestPermissions.mockClear();
    localPluginMocks.createChannel.mockClear();

    const { pushManager } = await import('@/src/lib/pushNotifications');
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const status = await pushManager.requestPermission();
    expect(status).toBe('unsupported');
    expect(localPluginMocks.createChannel).not.toHaveBeenCalled();
    expect(localPluginMocks.requestPermissions).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
