import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Registers for native push notifications on Android/iOS via Capacitor.
 * Safely guards against web browser environments where the plugin is unavailable.
 */
export async function registerNotificationsOnStartup(): Promise<void> {
  try {
    if (!Capacitor.isPluginAvailable('PushNotifications')) {
      console.log('PushNotifications plugin not available on this platform.');
      return;
    }

    // Check current status
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      // This explicitly forces the native Android 13+ permission popup to appear
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      // Register for push tokens
      await PushNotifications.register();

      // Setup standard event listeners
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on push registration:', JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', JSON.stringify(notification));
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', JSON.stringify(notification));
      });
    }
  } catch (err) {
    console.warn('Register notifications on startup notice:', err);
  }
}
