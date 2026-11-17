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
  const nestedData = notifData.data && typeof notifData.data === 'object' ? notifData.data : {};
  const baseTargetUrl = notifData.url || '/';
  const pushType = notifData.type || nestedData.type || '';
  const route = notifData.route || nestedData.route || '';
  const targetTab = notifData.targetTab || nestedData.targetTab;
  const targetId = notifData.targetId || nestedData.targetId || '';
  const showId = notifData.showId || nestedData.showId || '';
  const groupId = notifData.groupId || nestedData.groupId || '';
  const senderId = groupId || notifData.senderId || nestedData.senderId || (pushType === 'dm' ? targetId : '');
  const senderName = notifData.senderName || nestedData.senderName || event.notification.title;

  let deepLinkUrl = baseTargetUrl;
  try {
    const parsedUrl = new URL(baseTargetUrl, self.location.origin);
    if (targetTab) parsedUrl.searchParams.set('openTab', String(targetTab));
    if (senderId) parsedUrl.searchParams.set('chatWith', String(senderId));
    if (senderName && senderId) parsedUrl.searchParams.set('senderName', String(senderName));
    if (showId) parsedUrl.searchParams.set('showId', String(showId));
    if (targetId) parsedUrl.searchParams.set('targetId', String(targetId));
    if (pushType) parsedUrl.searchParams.set('pushType', String(pushType));
    if (route) parsedUrl.searchParams.set('route', String(route));
    deepLinkUrl = parsedUrl.pathname + parsedUrl.search;
  } catch (_) {}

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If a client window is already open, focus it and post a structured navigation message
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.postMessage({
            type: senderId ? 'NEXUS_OPEN_CHAT' : 'NEXUS_PUSH_NAVIGATE',
            pushType: pushType,
            targetTab: targetTab || (senderId || showId ? 'social' : undefined),
            senderId: senderId || undefined,
            groupId: groupId || undefined,
            name: senderName,
            senderName: senderName,
            targetId: targetId || undefined,
            showId: showId || undefined,
            route: route || undefined,
            data: notifData
          });
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