import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { authFetch, getSupabaseAccessToken } from '../utils/apiConfig';

export const ANDROID_CHANNEL_ID = 'nexus_alerts';

export async function initAndroidNotificationChannel(): Promise<void> {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('LocalNotifications')) {
    return;
  }
  try {
    await LocalNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Nexus Real-Time Alerts',
      description: 'High-priority notifications for tour alerts, offers, routing beacons, and chat messages',
      importance: 5,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: '#e11d48',
    });
  } catch (err) {
    console.warn('[PushClient] Error creating Android channel:', err);
  }
}

const recentNativeNotificationKeys = new Map<string, number>();
const NATIVE_DEDUPE_WINDOW_MS = 15000;

function computeStableNotifId(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) ^ seed.charCodeAt(i);
  }
  const positive = Math.abs(hash % 2147483000);
  return positive > 0 ? positive : 1;
}

export async function triggerNativeNotification(options: {
  title: string;
  body: string;
  targetTab?: string;
  category?: string;
  data?: any;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('LocalNotifications')) {
    return false;
  }
  try {
    const now = Date.now();
    // Clean expired keys
    for (const [k, ts] of recentNativeNotificationKeys.entries()) {
      if (now - ts > NATIVE_DEDUPE_WINDOW_MS) {
        recentNativeNotificationKeys.delete(k);
      }
    }

    const normBody = String(options.body || '').trim().toLowerCase();
    const normTitle = String(options.title || '').trim().toLowerCase();
    const msgId = String(options.data?.messageId || options.data?.notificationId || options.data?.id || '').trim();
    const bodyKey = `body:${normBody}`;
    const fullKey = `full:${normTitle}|${normBody}`;
    const idKey = msgId ? `id:${msgId}` : '';

    if (
      recentNativeNotificationKeys.has(fullKey) ||
      (normBody.length > 8 && recentNativeNotificationKeys.has(bodyKey)) ||
      (idKey && recentNativeNotificationKeys.has(idKey))
    ) {
      return false;
    }

    recentNativeNotificationKeys.set(fullKey, now);
    if (normBody.length > 8) recentNativeNotificationKeys.set(bodyKey, now);
    if (idKey) recentNativeNotificationKeys.set(idKey, now);

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') {
      return false;
    }

    await initAndroidNotificationChannel();

    // Use a deterministic ID for identical content so Android replaces rather than stacks duplicates
    const notifId = computeStableNotifId(`${options.category || 'general'}_${normTitle}_${normBody}`);
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: options.title,
          body: options.body,
          channelId: ANDROID_CHANNEL_ID,
          schedule: { at: new Date(Date.now() + 50) },
          extra: {
            targetTab: options.targetTab || 'social',
            category: options.category || 'general',
            ...options.data,
          },
        },
      ],
    });
    return true;
  } catch (err) {
    console.warn('[PushClient] Failed to schedule local notification:', err);
    return false;
  }
}

export interface PushDeepLinkPayload {
  type?: string;
  pushType?: string;
  targetTab?: string;
  feedTab?: string;
  targetId?: string;
  senderId?: string;
  sender_id?: string;
  senderName?: string;
  sender_name?: string;
  name?: string;
  showId?: string;
  show_id?: string;
  route?: string;
  url?: string;
  title?: string;
  showTitle?: string;
  category?: string;
  [key: string]: any;
}

export interface PendingDmThread {
  profile_id: string;
  name: string;
  username: string;
  timestamp: number;
}

export interface PendingShowDeepLink {
  showId: string;
  targetId?: string;
  title?: string;
  route?: string;
  timestamp: number;
}

const DEFAULT_VAPID_PUBLIC_KEY =
  'BFtYUwYxD4nggBN6jldwPmQ-rM209n3Cqom0TYLxoksAambfhk5PzDZ-0-FppflHkjW4P6tlvTsOnnl1kVlitiQ';

const NATIVE_TOKEN_STORAGE_KEY = 'nexus_native_push_token';
const NATIVE_PERMISSION_STORAGE_KEY = 'nexus_native_permission';

let nativeListenersAttached = false;
let localActionListenerAttached = false;
let webSwMessageListenerAttached = false;
let activeDmThreadId: string | null = null;
let floatingChatHeadOpen = false;
let pendingDmThread: PendingDmThread | null = null;
let pendingShowDeepLink: PendingShowDeepLink | null = null;

function safeLocalStorageGet(key: string): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function normalizeId(id?: string | null): string {
  return String(id || '').trim().toLowerCase();
}

export function setActiveDmThreadId(threadId: string | null): void {
  activeDmThreadId = threadId && String(threadId).trim() ? String(threadId).trim() : null;
}

export function getActiveDmThreadId(): string | null {
  return activeDmThreadId;
}

export function setFloatingChatHeadOpen(open: boolean): void {
  floatingChatHeadOpen = Boolean(open);
}

export function isFloatingChatHeadOpen(): boolean {
  return floatingChatHeadOpen;
}

export function isViewingDmThread(candidateId?: string | null): boolean {
  if (!activeDmThreadId || !candidateId) return false;
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return false;
  }
  return normalizeId(activeDmThreadId) === normalizeId(candidateId);
}

export function peekPendingDmThread(): PendingDmThread | null {
  if (!pendingDmThread) return null;
  const ageMs = Date.now() - pendingDmThread.timestamp;
  if (ageMs >= 60_000) {
    pendingDmThread = null;
    return null;
  }
  return pendingDmThread;
}

export function consumePendingDmThread(): PendingDmThread | null {
  const result = peekPendingDmThread();
  pendingDmThread = null;
  return result;
}

export function peekPendingShowDeepLink(): PendingShowDeepLink | null {
  if (!pendingShowDeepLink) return null;
  const ageMs = Date.now() - pendingShowDeepLink.timestamp;
  if (ageMs >= 60_000) {
    pendingShowDeepLink = null;
    return null;
  }
  return pendingShowDeepLink;
}

export function consumePendingShowDeepLink(): PendingShowDeepLink | null {
  const result = peekPendingShowDeepLink();
  pendingShowDeepLink = null;
  return result;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData =
    typeof window !== 'undefined' && typeof window.atob === 'function'
      ? window.atob(base64)
      : Buffer.from(base64, 'base64').toString('binary');
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function resolveVapidPublicKey(): Promise<string> {
  const envKey = (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY;
  if (typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }

  try {
    const res = await authFetch('/api/push/vapid-public-key');
    if (res.ok) {
      const data = await res.json();
      if (data?.publicKey && typeof data.publicKey === 'string') {
        return data.publicKey.trim();
      }
    }
  } catch (err) {
    console.warn('[PushClient] Failed fetching VAPID public key, using default fallback:', err);
  }

  return DEFAULT_VAPID_PUBLIC_KEY;
}

function dispatchWindowEvent(name: string, detail: any): void {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function cleanNotificationSenderName(rawName: string): string {
  const cleaned = String(rawName || '')
    .replace(/^💬\s*Direct Message from\s+/i, '')
    .replace(/^💬\s*New Direct Message/i, '')
    .replace(/^💬\s*/i, '')
    .trim();
  return cleaned || 'Direct Message';
}

export function handlePushDeepLink(rawPayload?: PushDeepLinkPayload | null): void {
  if (typeof window === 'undefined' || !rawPayload) return;

  const nested =
    rawPayload.data && typeof rawPayload.data === 'object' ? rawPayload.data : {};
  const data: PushDeepLinkPayload = { ...nested, ...rawPayload };

  const type = String(data.type || data.pushType || data.category || '')
    .toLowerCase()
    .trim();
  const route = String(data.route || data.url || '').trim();
  const targetTab = String(data.targetTab || '').trim();
  const rawTargetId = String(data.targetId || data.target_id || '').trim();
  const groupId = String(data.groupId || data.group_id || '').trim();

  const isDmRoute =
    route.startsWith('/inbox') ||
    route.startsWith('/messages') ||
    route.startsWith('/dm') ||
    targetTab === 'messages';
  const isShowRoute =
    route.startsWith('/shows') ||
    route.startsWith('/events');

  const senderId = String(
    groupId ||
      data.senderId ||
      data.sender_id ||
      (type === 'dm' || type === 'direct_messages' || isDmRoute ? rawTargetId : '') ||
      ''
  ).trim();
  const rawSenderName = String(
    data.groupName ||
      data.group_name ||
      data.senderName ||
      data.sender_name ||
      data.name ||
      data.title ||
      'Direct Message'
  ).trim();
  const senderName = cleanNotificationSenderName(rawSenderName);

  const showId = String(
    data.showId ||
      data.show_id ||
      (type === 'show_reminder' || type === 'show' || isShowRoute ? rawTargetId : '') ||
      ''
  ).trim();

  // 1. Direct Message / Group Chat Deep Link
  if (type === 'dm' || type === 'direct_messages' || type === 'chat' || type === 'chat_message' || isDmRoute || Boolean(senderId)) {
    const resolvedPartnerId = groupId || senderId || rawTargetId;

    // If the user ALREADY has the Floating Chat Head open and it's a 1-on-1 DM, switch the Chat Head directly to this thread
    if (floatingChatHeadOpen && resolvedPartnerId && !resolvedPartnerId.startsWith('grp_')) {
      dispatchWindowEvent('nexus_open_chat_thread', {
        profile_id: resolvedPartnerId,
        name: senderName,
        username: senderName,
        fromPushTap: true,
      });
      return;
    }

    // Otherwise, route to Social -> INBOX ('messages') and open that specific conversation thread
    if (resolvedPartnerId) {
      pendingDmThread = {
        profile_id: resolvedPartnerId,
        name: senderName,
        username: senderName,
        timestamp: Date.now(),
      };
    }

    dispatchWindowEvent('nexus_navigate_tab', 'social');
    dispatchWindowEvent('nexus_open_inbox_thread', {
      profile_id: resolvedPartnerId,
      name: senderName,
      username: senderName,
      isGroup: resolvedPartnerId.startsWith('grp_'),
      groupId: resolvedPartnerId.startsWith('grp_') ? resolvedPartnerId : undefined,
      feedTab: 'messages',
    });

    // Re-dispatch after a short delay in case InboxTerminal is lazy-mounting after the tab switch
    if (resolvedPartnerId) {
      setTimeout(() => {
        dispatchWindowEvent('nexus_open_inbox_thread', {
          profile_id: resolvedPartnerId,
          name: senderName,
          username: senderName,
          isGroup: resolvedPartnerId.startsWith('grp_'),
          groupId: resolvedPartnerId.startsWith('grp_') ? resolvedPartnerId : undefined,
          feedTab: 'messages',
        });
      }, 180);
    }
    return;
  }

  // 2. Show Reminder / Show Settlement / Ticket Alert -> Switch to Social -> Feed -> Event Companion
  if (
    type === 'show_reminder' ||
    type === 'show' ||
    type === 'tour_proximity' ||
    isShowRoute ||
    Boolean(showId)
  ) {
    const resolvedShowId = showId || rawTargetId;
    if (resolvedShowId || data.title || data.showTitle) {
      pendingShowDeepLink = {
        showId: resolvedShowId,
        targetId: rawTargetId || resolvedShowId,
        title: data.showTitle || data.title,
        route,
        timestamp: Date.now(),
      };
    }

    dispatchWindowEvent('nexus_navigate_tab', 'social');
    dispatchWindowEvent('nexus_open_show_details', {
      showId: resolvedShowId,
      targetId: rawTargetId || resolvedShowId,
      title: data.showTitle || data.title,
      route,
      type: type || 'show_reminder',
    });
    return;
  }

  // 3. Generic tab or route navigation
  if (targetTab) {
    if (targetTab === 'messages') {
      dispatchWindowEvent('nexus_navigate_tab', 'social');
      dispatchWindowEvent('nexus_navigate_feed_tab', 'messages');
    } else {
      dispatchWindowEvent('nexus_navigate_tab', targetTab);
    }
  } else if (route) {
    const cleanRoute = route.replace(/^\/+/, '').split('/')[0]?.toLowerCase();
    if (cleanRoute === 'forum' || cleanRoute === 'shop' || cleanRoute === 'photopit' || cleanRoute === 'gallery' || cleanRoute === 'reels' || cleanRoute === 'clips' || cleanRoute === 'messages' || cleanRoute === 'inbox') {
      dispatchWindowEvent('nexus_navigate_tab', 'social');
      dispatchWindowEvent('nexus_navigate_feed_tab', cleanRoute === 'clips' ? 'reels' : cleanRoute === 'inbox' ? 'messages' : cleanRoute);
    } else if (cleanRoute) {
      dispatchWindowEvent('nexus_navigate_tab', cleanRoute);
    }
  }
}

export function handleInitialDeepLinkFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const openTab = params.get('openTab');
    const chatWith = params.get('chatWith');
    const showId = params.get('showId');
    const targetId = params.get('targetId');
    const pushType = params.get('pushType') || params.get('type');
    const route = params.get('route');
    const senderName = params.get('senderName');

    if (!openTab && !chatWith && !showId && !targetId && !pushType && !route) {
      return false;
    }

    setTimeout(() => {
      handlePushDeepLink({
        type: pushType || (chatWith ? 'dm' : showId ? 'show_reminder' : undefined),
        targetTab: openTab || undefined,
        senderId: chatWith || undefined,
        senderName: senderName || undefined,
        showId: showId || undefined,
        targetId: targetId || undefined,
        route: route || undefined,
      });
    }, 350);

    ['openTab', 'chatWith', 'showId', 'targetId', 'pushType', 'type', 'route', 'senderName'].forEach(
      (k) => params.delete(k)
    );
    const cleanedSearch = params.toString();
    const cleanedUrl =
      window.location.pathname +
      (cleanedSearch ? `?${cleanedSearch}` : '') +
      window.location.hash;
    window.history.replaceState(null, '', cleanedUrl);
    return true;
  } catch {
    return false;
  }
}

async function postNativeTokenToBackend(
  fcmToken: string,
  userInfo?: { id?: string; email?: string }
): Promise<boolean> {
  if (!fcmToken) return false;
  try {
    const accessToken = await getSupabaseAccessToken();
    if (!accessToken) {
      return false;
    }

    const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
    const userId = userInfo?.id || safeLocalStorageGet('nexus_auth_user_id') || undefined;
    const userEmail =
      (userInfo?.email || safeLocalStorageGet('nexus_auth_user_email') || '')
        .toLowerCase()
        .trim() || undefined;

    const res = await authFetch('/api/push/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: fcmToken,
        fcm_token: fcmToken,
        platform,
        userId,
        userEmail,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[PushClient] Native token backend registration error:', err);
    return false;
  }
}

export async function registerNativePush(userInfo?: {
  id?: string;
  email?: string;
}): Promise<{ granted: boolean; token?: string }> {
  if (typeof window === 'undefined' || !Capacitor.isNativePlatform()) {
    return { granted: false };
  }

  try {
    await initAndroidNotificationChannel();

    if (Capacitor.isPluginAvailable('LocalNotifications')) {
      try {
        const localPerm = await LocalNotifications.checkPermissions();
        if (
          localPerm.display === 'prompt' ||
          localPerm.display === 'prompt-with-rationale'
        ) {
          await LocalNotifications.requestPermissions();
        }
      } catch (err) {
        console.warn('[PushClient] LocalNotifications permission check warning:', err);
      }

      if (!localActionListenerAttached) {
        localActionListenerAttached = true;
        LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (notificationAction: any) => {
            const extra = notificationAction?.notification?.extra;
            handlePushDeepLink(extra);
          }
        );
      }
    }

    if (!Capacitor.isPluginAvailable('PushNotifications')) {
      return { granted: false };
    }

    if (!nativeListenersAttached) {
      nativeListenersAttached = true;

      PushNotifications.addListener('registration', async (token) => {
        if (!token?.value) return;
        safeLocalStorageSet(NATIVE_TOKEN_STORAGE_KEY, token.value);
        safeLocalStorageSet(NATIVE_PERMISSION_STORAGE_KEY, 'granted');
        await postNativeTokenToBackend(token.value, userInfo);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.warn(
          '[PushClient] FCM registration warning:',
          typeof error === 'object' ? JSON.stringify(error) : error
        );
      });

      PushNotifications.addListener('pushNotificationReceived', async (notification: any) => {
        const data = (notification?.data && typeof notification.data === 'object'
          ? notification.data
          : {}) as PushDeepLinkPayload;
        const type = String(data.type || data.pushType || data.category || '')
          .toLowerCase()
          .trim();
        const groupId = String(data.groupId || data.group_id || '').trim();
        const partnerId = String(
          groupId ||
            data.senderId ||
            data.sender_id ||
            (type === 'dm' ? data.targetId || data.target_id : '') ||
            ''
        ).trim();

        // Suppress duplicate sound/banner spam if the user is actively viewing this DM or Group thread
        if (
          (type === 'dm' || Boolean(partnerId)) &&
          (isViewingDmThread(partnerId) || (groupId && isViewingDmThread(groupId)))
        ) {
          return;
        }

        const title = notification?.title || 'Nexus Alert';
        const body = notification?.body || '';

        if (Capacitor.isPluginAvailable('LocalNotifications')) {
          await triggerNativeNotification({
            title,
            body,
            targetTab: data.targetTab || 'social',
            category: data.category || type || 'general',
            data: {
              ...data,
              channelId: ANDROID_CHANNEL_ID,
            },
          });
        }

        dispatchWindowEvent('nexus_in_app_notice', {
          id: 'push-' + Date.now(),
          title,
          message: body,
          time: 'Just now',
          type: type === 'dm' ? 'message' : type === 'show_reminder' ? 'gig' : 'system',
          targetTab: data.targetTab || 'social',
          senderId: partnerId || undefined,
          groupId: groupId || undefined,
          showId: data.showId || data.show_id || undefined,
          read: false,
          avatar: '/icon-192.png',
        });
      });

      PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (notificationAction: any) => {
          const data =
            notificationAction?.notification?.data ||
            notificationAction?.data ||
            {};
          handlePushDeepLink({
            ...data,
            title: notificationAction?.notification?.title || data.title,
          });
        }
      );
    }

    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive !== 'granted') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      safeLocalStorageSet(NATIVE_PERMISSION_STORAGE_KEY, 'denied');
      return { granted: false };
    }

    safeLocalStorageSet(NATIVE_PERMISSION_STORAGE_KEY, 'granted');
    await PushNotifications.register();

    const cachedToken = safeLocalStorageGet(NATIVE_TOKEN_STORAGE_KEY) || undefined;
    return { granted: true, token: cachedToken };
  } catch (err) {
    console.warn('[PushClient] registerNativePush error:', err);
    return { granted: false };
  }
}

export async function registerWebPush(options?: {
  userId?: string;
  userEmail?: string;
  promptPermission?: boolean;
}): Promise<{ registration: ServiceWorkerRegistration | null; subscription: PushSubscription | null }> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { registration: null, subscription: null };
  }

  let reg: ServiceWorkerRegistration | null = null;
  try {
    reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (err) {
    console.warn('[PushClient] Service Worker registration failed:', err);
    return { registration: null, subscription: null };
  }

  if (!webSwMessageListenerAttached) {
    webSwMessageListenerAttached = true;
    navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
      const msg = event?.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'NEXUS_PUSH_NAVIGATE' || msg.type === 'NEXUS_OPEN_CHAT') {
        handlePushDeepLink({
          ...(msg.data && typeof msg.data === 'object' ? msg.data : {}),
          type: msg.pushType || msg.data?.type || (msg.type === 'NEXUS_OPEN_CHAT' ? 'dm' : undefined),
          targetTab: msg.targetTab || msg.data?.targetTab,
          senderId: msg.senderId || msg.data?.senderId,
          groupId: msg.groupId || msg.data?.groupId,
          senderName: msg.name || msg.senderName || msg.data?.senderName,
          showId: msg.showId || msg.data?.showId,
          targetId: msg.targetId || msg.data?.targetId,
          route: msg.route || msg.data?.route,
        });
      }
    });
  }

  try {
    if (!('Notification' in window) || !reg?.pushManager) {
      return { registration: reg, subscription: null };
    }

    let permission = Notification.permission;
    if (permission !== 'granted' && options?.promptPermission) {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return { registration: reg, subscription: null };
    }

    const vapidKey = await resolveVapidPublicKey();
    const convertedKey = urlBase64ToUint8Array(vapidKey);

    let sub = await reg.pushManager.getSubscription();
    if (sub && sub.options?.applicationServerKey) {
      try {
        const existingKey = new Uint8Array(sub.options.applicationServerKey);
        const matches =
          existingKey.length === convertedKey.length &&
          existingKey.every((b, idx) => b === convertedKey[idx]);
        if (!matches) {
          await sub.unsubscribe();
          sub = null;
        }
      } catch {
        // retain current subscription if comparison fails
      }
    }

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    const accessToken = await getSupabaseAccessToken();
    if (accessToken && sub) {
      const subJson = typeof sub.toJSON === 'function' ? sub.toJSON() : (sub as any);
      const userId = options?.userId || safeLocalStorageGet('nexus_auth_user_id') || undefined;
      const userEmail =
        (options?.userEmail || safeLocalStorageGet('nexus_auth_user_email') || '')
          .toLowerCase()
          .trim() || undefined;

      await authFetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'web',
          subscription: subJson,
          web_push_subscription: subJson,
          userId,
          userEmail,
          userAgent: navigator.userAgent,
        }),
      });
      safeLocalStorageSet('nexus_push_synced', 'true');
    }

    return { registration: reg, subscription: sub };
  } catch (err) {
    console.warn('[PushClient] Web Push subscription warning:', err);
    return { registration: reg, subscription: null };
  }
}

export async function initPushClient(options?: {
  userId?: string;
  userEmail?: string;
  promptPermission?: boolean;
}): Promise<void> {
  if (typeof window === 'undefined') return;

  if (Capacitor.isNativePlatform()) {
    await registerNativePush({
      id: options?.userId,
      email: options?.userEmail,
    });
    return;
  }

  await registerWebPush(options);
}

export async function syncPushRegistrationForUser(userInfo: {
  id?: string;
  email?: string;
}): Promise<void> {
  if (typeof window === 'undefined') return;
  if (userInfo?.id) safeLocalStorageSet('nexus_auth_user_id', String(userInfo.id));
  if (userInfo?.email) {
    safeLocalStorageSet('nexus_auth_user_email', String(userInfo.email).toLowerCase().trim());
  }

  if (Capacitor.isNativePlatform()) {
    const cachedToken = safeLocalStorageGet(NATIVE_TOKEN_STORAGE_KEY);
    if (cachedToken) {
      await postNativeTokenToBackend(cachedToken, userInfo);
    } else {
      await registerNativePush(userInfo);
    }
    return;
  }

  await registerWebPush({
    userId: userInfo?.id,
    userEmail: userInfo?.email,
    promptPermission: false,
  });
}

export function _resetPushClientForTests(): void {
  nativeListenersAttached = false;
  localActionListenerAttached = false;
  webSwMessageListenerAttached = false;
  activeDmThreadId = null;
  floatingChatHeadOpen = false;
  pendingDmThread = null;
  pendingShowDeepLink = null;
  recentNativeNotificationKeys.clear();
}
