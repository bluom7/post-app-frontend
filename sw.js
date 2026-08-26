self.addEventListener('fetch', function(event) {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(fetch(event.request).then(async function(response) {
    var contentType = response.headers.get('content-type') || '';
    if (contentType.indexOf('text/html') === -1) return response;
    var html = await response.text();
    var oldMarkup = 'secSessionsLoading ? React.createElement("div", {style:{textAlign:"center",padding:40,color:"var(--muted)"}}, "Loading sessions...") :';
    var newMarkup = 'secSessionsLoading ? React.createElement("div", {style:{display:"flex",alignItems:"center",justifyContent:"center",padding:40}}, React.createElement("span", {role:"status","aria-label":"Loading sessions",style:{width:22,height:22,borderRadius:"50%",border:"2.5px solid #dbeafe",borderTopColor:"#1877F2",display:"inline-block",animation:"_rpt_spin 0.75s linear infinite"}})) :';
    if (html.indexOf(oldMarkup) === -1) return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
    var headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    return new Response(html.replace(oldMarkup, newMarkup), {status: response.status, statusText: response.statusText, headers: headers});
  }).catch(function() { return fetch(event.request); }));
});

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
    data: {
      url: data.url || self.registration.scope,
      type: data.type || data.notification_type || '',
    },
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
