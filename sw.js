// NOTE: Profile (Videos/Remix, Articles), sessions spinner and login-location
// patches now live directly inside index.html. This worker no longer rewrites HTML.
// Navigations are still fetched with cache:"no-store" (same as before) so the latest index.html loads.
self.addEventListener('fetch', function(event) {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request, {cache: "no-store"}).catch(function() { return fetch(event.request); }));
});

const APP_NAME = 'Post App';

self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try { data = event.data.json(); } catch(e) { data = { body: event.data.text() }; }
  }
  // An empty / undecryptable push must still show something (browsers require a visible notification).
  const title = data.title || APP_NAME;
  const type = data.type || data.notification_type || '';
  const options = {
    body: data.body || (event.data ? '' : 'You have a new notification'),
    icon: data.icon || '/icon-192.png',
    badge: data.badge_url || '/badge-72.png',
    data: {
      url: data.url || self.registration.scope,
      type: type,
    },
    vibrate: [100, 50, 100],
    // One shared tag made every new notification REPLACE the previous one (and replacement is silent
    // without renotify). A unique tag per push keeps each notification visible and audible.
    tag: data.tag || ('post-' + (type || 'n') + '-' + Date.now()),
    renotify: true,
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
  var targetUrl = notifData.url || (scopeUrl + (scopeUrl.endsWith('/') ? '' : '/') + (isChat ? '?open=friends' : '?open=notifications'));

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
