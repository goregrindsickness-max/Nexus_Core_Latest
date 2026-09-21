import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const ANDROID_CHANNEL_ID = 'nexus_alerts';

/**
 * Initializes the Android notification channel with high priority
 * for heads-up notifications, vibration, and audio chimes.
 */
export async function initAndroidNotificationChannel(): Promise<void> {
  if (typeof window === 'undefined' || !Capacitor.isPluginAvailable('LocalNotifications')) {
    return;
  }
  try {
    await LocalNotifications.createChannel({
      id: ANDROID_CHANNEL_ID,
      name: 'Nexus Real-Time Alerts',
      description: 'High-priority notifications for tour alerts, offers, routing beacons, and chat messages',
      importance: 5, // High: Heads-up popups and sound
      visibility: 1, // Public: Lock-screen visible
      vibration: true,
      lights: true,
      lightColor: '#e11d48',
    });
    console.log('[NativePush] Notification channel initialized:', ANDROID_CHANNEL_ID);
  } catch (err) {
    console.warn('[NativePush] Error creating Android channel:', err);
  }
}

/**
 * Triggers a real native device notification via Capacitor LocalNotifications.
 * Directly appears in the Android system notification bar and tray.
 */
export async function triggerNativeNotification(options: {
  title: string;
  body: string;
  targetTab?: string;
  category?: string;
  data?: any;
}): Promise<boolean> {
  if (typeof window === 'undefined' || !Capacitor.isPluginAvailable('LocalNotifications')) {
    return false;
  }

  try {
    // Explicitly verify and request permissions on Android 13+ (POST_NOTIFICATIONS)
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }
    if (perm.display !== 'granted') {
      console.warn('[NativePush] Notification permission not granted by user:', perm.display);
      return false;
    }

    await initAndroidNotificationChannel();

    const notifId = Math.floor(Math.random() * 2147483647);
    // Omitting allowWhileIdle: true avoids the strict Android 12+ (API 31+) SecurityException for SCHEDULE_EXACT_ALARM
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

    console.log('[NativePush] Scheduled local notification id:', notifId);
    return true;
  } catch (err) {
    console.warn('[NativePush] Failed to schedule local notification:', err);
    return false;
  }
}

/**
 * Registers for native push and local notifications on Android/iOS via Capacitor.
 * Safely guards against web browser environments where plugins are unavailable.
 */
export async function registerNotificationsOnStartup(): Promise<void> {
  try {
    const hasLocal = Capacitor.isPluginAvailable('LocalNotifications');
    const hasPush = Capacitor.isPluginAvailable('PushNotifications');

    if (!hasLocal && !hasPush) {
      console.log('[NativePush] Capacitor notification plugins not available on this platform.');
      return;
    }

    // 1. Create Android Notification Channel
    await initAndroidNotificationChannel();

    // 2. Setup Local Notifications & Actions
    if (hasLocal) {
      try {
        let localPerm = await LocalNotifications.checkPermissions();
        if (localPerm.display === 'prompt' || localPerm.display === 'prompt-with-rationale') {
          localPerm = await LocalNotifications.requestPermissions();
        }

        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
          console.log('[NativePush] Local notification action tapped:', notificationAction);
          const extra = notificationAction.notification.extra;
          if (extra?.targetTab) {
            window.dispatchEvent(new CustomEvent('nexus_navigate_tab', { detail: extra.targetTab }));
          }
          if (extra?.senderId) {
            window.dispatchEvent(
              new CustomEvent('nexus_open_chat', {
                detail: {
                  profile_id: extra.senderId,
                  name: extra.senderName || 'Direct Message',
                  username: extra.senderName || 'Direct Message',
                },
              })
            );
          }
        });
      } catch (err) {
        console.warn('[NativePush] LocalNotifications setup warning:', err);
      }
    }

    // 3. Setup Push Notifications (Remote FCM)
    if (hasPush) {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        // Explicitly triggers native Android 13+ permission popup
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('[NativePush] Push registration success, token:', token.value);
          localStorage.setItem('nexus_native_push_token', token.value);
          localStorage.setItem('nexus_native_permission', 'granted');

          // Send token to server
          try {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: token.value,
                platform: 'android',
                userId: localStorage.getItem('nexus_auth_user_id') || undefined,
                userEmail: localStorage.getItem('nexus_auth_user_email') || undefined,
              }),
            });
          } catch (e) {
            console.warn('[NativePush] Token sync notice:', e);
          }
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('[NativePush] Error on push registration:', JSON.stringify(error));
        });

        // When a remote push arrives while the app is active in foreground:
        // Android does not show a system notification by default for foreground pushes.
        // We schedule an immediate LocalNotification so the user sees the real notification!
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          console.log('[NativePush] Remote push received in foreground:', JSON.stringify(notification));

          // Schedule local device notification so it appears in the Android notification shade
          if (hasLocal) {
            await triggerNativeNotification({
              title: notification.title || 'Nexus Alert',
              body: notification.body || '',
              targetTab: notification.data?.targetTab || 'social',
              category: notification.data?.category || 'general',
              data: notification.data,
            });
          }

          // Dispatch in-app notice event for drawer unread counter
          window.dispatchEvent(
            new CustomEvent('nexus_in_app_notice', {
              detail: {
                id: 'push-' + Date.now(),
                title: notification.title || 'Nexus Alert',
                message: notification.body || '',
                time: 'Just now',
                type: 'system',
                targetTab: notification.data?.targetTab || 'social',
                read: false,
                avatar: '/icon-192.png',
              },
            })
          );
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('[NativePush] Push notification action performed:', JSON.stringify(notification));
          const data = notification.notification.data;
          if (data?.targetTab) {
            window.dispatchEvent(new CustomEvent('nexus_navigate_tab', { detail: data.targetTab }));
          }
          if (data?.senderId) {
            window.dispatchEvent(
              new CustomEvent('nexus_open_chat', {
                detail: {
                  profile_id: data.senderId,
                  name: notification.notification.title || 'Chat',
                },
              })
            );
          }
        });
      }
    }
  } catch (err) {
    console.warn('[NativePush] Register notifications on startup notice:', err);
  }
}

