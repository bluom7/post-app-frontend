const APP_NAME = 'Post App';

self.addEventListener('push', function(event) {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch(e) { data = { body: event.data.text() }; }
  const title = data.title || APP_NAME;
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge_url || '/badge-72.png',
    data: { url: data.url || self.registration.scope },
    vibrate: [100, 50, 100],
    tag: data.tag || 'post-app',
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var scopeUrl = self.registration.scope;
  var notifData = event.notification.data || {};
  var notifType = notifData.type || '';
  var isChat = notifType === 'message' || notifType === 'group_message' || notifType === 'chat';
  var targetMsg = isChat ? 'OPEN_FRIENDS' : 'OPEN_NOTIFICATIONS';
  var targetUrl = scopeUrl + (scopeUrl.endsWith('/') ? '' : '/') + (isChat ? '?open=friends' : '?open=notifications');

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          client.postMessage({ type: targetMsg });
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('install', function(event) { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });
