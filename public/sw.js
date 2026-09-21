// Nexus Core Service Worker for Real-Time Device Push Notifications
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
    image: data.image || undefined,
    tag: data.tag || 'nexus-alert-' + Date.now(),
    renotify: data.renotify !== false,
    vibrate: data.vibrate || [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/',
      targetTab: data.targetTab,
      category: data.category,
      workspace: data.workspace,
      timestamp: Date.now(),
      ...data
    },
    actions: data.actions || [
      { action: 'view', title: 'Open Alert' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';
  const targetTab = event.notification.data?.targetTab;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a client window is already open, focus it and post a navigation message
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          if (event.notification.data?.senderId) {
            client.postMessage({
              type: 'NEXUS_OPEN_CHAT',
              senderId: event.notification.data.senderId,
              name: event.notification.title
            });
          }
          if (targetTab) {
            client.postMessage({
              type: 'NEXUS_PUSH_NAVIGATE',
              targetTab: targetTab,
              data: event.notification.data
            });
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  // Optional telemetry hook on dismiss
  console.log('[SW] Notification closed:', event.notification.tag);
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
  event.respondWith(fetch(event.request));
});