// Nexus Core App Badging Engine
// Provides home screen icon notification counter functionality (similar to Facebook & Reddit app icon badges)
// Compatible with PWA home screen installations, Chromium, iOS 16.4+ Safari, and Android WebViews / APKs.

const BADGE_STORAGE_KEY = 'nexus_app_badge_count';
const BADGE_ENABLED_KEY = 'nexus_app_badge_enabled';

export function isAppBadgeSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

export function isBadgeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(BADGE_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function saveBadgePreference(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BADGE_ENABLED_KEY, enabled ? 'true' : 'false');
    if (!enabled) {
      clearAppBadge();
    } else {
      syncGlobalUnreadBadge();
    }
  } catch {}
}

export function getStoredBadgeCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(BADGE_STORAGE_KEY);
    return val ? Math.max(0, parseInt(val, 10) || 0) : 0;
  } catch {
    return 0;
  }
}

/**
 * Sets the home screen application icon badge counter silently without emitting in-app notification popups.
 */
export async function setAppBadge(count: number): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const targetCount = Math.max(0, Math.floor(count));

  try {
    localStorage.setItem(BADGE_STORAGE_KEY, String(targetCount));
  } catch {}

  if (!isBadgeEnabled()) {
    return false;
  }

  let success = false;

  // 1. Web App Badging API (PWA Home Screen Icon / Taskbar)
  if ('setAppBadge' in navigator) {
    try {
      if (targetCount > 0) {
        await (navigator as any).setAppBadge(targetCount);
      } else {
        await (navigator as any).clearAppBadge();
      }
      success = true;
    } catch (err) {
      // Silent error handling
    }
  }

  // 2. Service Worker Sync for Background Badging
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_APP_BADGE',
        count: targetCount
      });
    } catch {}
  }

  // 3. Dispatch global browser event for UI badging components (internal state only)
  window.dispatchEvent(
    new CustomEvent('nexus_app_badge_changed', {
      detail: { count: targetCount }
    })
  );

  return success;
}

/**
 * Clears the application icon badge counter on the home screen
 */
export async function clearAppBadge(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(BADGE_STORAGE_KEY, '0');
  } catch {}

  let success = false;

  if ('clearAppBadge' in navigator) {
    try {
      await (navigator as any).clearAppBadge();
      success = true;
    } catch (err) {
      // Silent
    }
  }

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_APP_BADGE'
      });
    } catch {}
  }

  window.dispatchEvent(
    new CustomEvent('nexus_app_badge_changed', {
      detail: { count: 0 }
    })
  );

  return success;
}

/**
 * Increments the current badge count by a specified amount (default 1)
 */
export async function incrementAppBadge(amount: number = 1): Promise<number> {
  const current = getStoredBadgeCount();
  const next = current + amount;
  await setAppBadge(next);
  return next;
}

/**
 * Decrements the current badge count by a specified amount (default 1)
 */
export async function decrementAppBadge(amount: number = 1): Promise<number> {
  const current = getStoredBadgeCount();
  const next = Math.max(0, current - amount);
  await setAppBadge(next);
  return next;
}

/**
 * Calculates total unread items across notifications and chat messages, then updates the home screen app icon badge silently.
 */
export function syncGlobalUnreadBadge(): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Unread notifications count
    const notifsRaw = localStorage.getItem('nexus_core_notifications');
    let unreadNotifs = 0;
    if (notifsRaw) {
      const parsed = JSON.parse(notifsRaw);
      if (Array.isArray(parsed)) {
        unreadNotifs = parsed.filter((n: any) => !n.is_read && !n.read).length;
      }
    }

    // 2. Unread messaging conversations count
    const convsRaw = localStorage.getItem('nexus_messaging_conversations');
    let unreadMsgs = 0;
    if (convsRaw) {
      const parsed = JSON.parse(convsRaw);
      if (Array.isArray(parsed)) {
        unreadMsgs = parsed.reduce((acc: number, c: any) => acc + (c.unread || (c.isRead === false ? 1 : 0)), 0);
      }
    }

    const totalUnread = unreadNotifs + unreadMsgs;
    setAppBadge(totalUnread);
  } catch (e) {
    // Silent catch
  }
}

/**
 * Synchronizes the home screen icon badge count from total unread items
 */
export async function syncAppBadgeFromUnread(unreadCount: number): Promise<boolean> {
  return setAppBadge(unreadCount);
}

/**
 * Simulates setting a badge for testing without creating in-app notification toasts.
 */
export async function testAppBadge(testCount: number = 2): Promise<boolean> {
  return setAppBadge(testCount);
}

// Auto-subscribe listeners on module load
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'nexus_core_notifications' || e.key === 'nexus_messaging_conversations') {
      syncGlobalUnreadBadge();
    }
  });
}
