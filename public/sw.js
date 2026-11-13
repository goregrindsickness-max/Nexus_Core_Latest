// Nexus Core Service Worker for Real-Time Device Push Notifications & App Icon Badging

self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nexus Core Alert', body: event.data.text() };
    }
  }

  const title = data.title || '⚡ Nexus Push Alert';
  const options = {
    body: data.body || 'New operational update from Nexus Core.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'nexus-alert-' + Date.now(),
    renotify: data.renotify !== false,
    vibrate: data.vibrate || [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/',
      targetTab: data.targetTab,
      category: data.category,
      workspace: data.workspace,
      senderId: data.senderId || data.data?.senderId,
      senderName: data.senderName || data.data?.senderName,
      timestamp: Date.now(),
      ...data
    },
    actions: data.actions || [
      { action: 'view', title: 'Open Alert' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  if (data.image) {
    options.image = data.image;
  }

  // Update Home Screen App Icon Badge Counter
  if ('setAppBadge' in navigator) {
    const unreadCount = data.unreadCount !== undefined ? data.unreadCount : (data.badgeCount || 1);
    navigator.setAppBadge(unreadCount).catch(function() {});
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notifData = event.notification.data || {};
  const baseTargetUrl = notifData.url || '/';
  const targetTab = notifData.targetTab;
  const senderId = notifData.senderId || notifData.data?.senderId;
  const senderName = notifData.senderName || notifData.data?.senderName || event.notification.title;

  let deepLinkUrl = baseTargetUrl;
  try {
    const parsedUrl = new URL(baseTargetUrl, self.location.origin);
    if (targetTab) parsedUrl.searchParams.set('openTab', String(targetTab));
    if (senderId) parsedUrl.searchParams.set('chatWith', String(senderId));
    deepLinkUrl = parsedUrl.pathname + parsedUrl.search;
  } catch (_) {}

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a client window is already open, focus it and post a navigation message
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          if (senderId) {
            client.postMessage({
              type: 'NEXUS_OPEN_CHAT',
              senderId: senderId,
              name: senderName
            });
          }
          if (targetTab) {
            client.postMessage({
              type: 'NEXUS_PUSH_NAVIGATE',
              targetTab: targetTab,
              data: notifData
            });
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one with deep-link params
      if (clients.openWindow) {
        return clients.openWindow(deepLinkUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.tag);
});

/* ==========================================================================
   ⚡ APP ICON BADGING EVENT LISTENERS
   ========================================================================== */

self.addEventListener('message', function(event) {
  if (event.data?.type === 'SET_APP_BADGE') {
    if ('setAppBadge' in navigator) {
      const count = event.data.count !== undefined ? event.data.count : 1;
      if (count > 0) {
        navigator.setAppBadge(count).catch(function() {});
      } else {
        navigator.clearAppBadge().catch(function() {});
      }
    }
  } else if (event.data?.type === 'CLEAR_APP_BADGE') {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(function() {});
    }
  }
});

/* ==========================================================================
   ⚠️ MANDATORY PWA LIFECYCLE HOOKS (Ensures Chrome/Android Installability)
   ========================================================================== */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});