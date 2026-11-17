import {
  ANDROID_CHANNEL_ID,
  initAndroidNotificationChannel,
  triggerNativeNotification,
  registerNativePush,
} from '../lib/pushClient';

export {
  ANDROID_CHANNEL_ID,
  initAndroidNotificationChannel,
  triggerNativeNotification,
};

/**
 * Registers for native push and local notifications on Android/iOS via Capacitor.
 * Delegates to unified pushClient to avoid duplicate listeners.
 */
export async function registerNotificationsOnStartup(): Promise<void> {
  await registerNativePush();
}
