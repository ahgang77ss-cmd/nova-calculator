const C = 'nova-v1';
const A = ['./','./index.html','./styles.css','./engine.js','./app.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(A)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      const f = fetch(e.request).then(res => {
        if (res && res.status === 200 && new URL(e.request.url).origin === location.origin) {
          const cp = res.clone(); caches.open(C).then(c => c.put(e.request, cp));
        }
        return res;
      }).catch(() => hit);
      return hit || f;
    })
  );
});
