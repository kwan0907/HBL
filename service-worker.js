const CACHE_NAME = 'hbl-multi-region-v7-compact-controls-search';
self.addEventListener('install', event => { self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  const isPriceData = /\/data\/[^/]+\.js$/.test(url.pathname);
  if (isPriceData) {
    const stableUrl = url.origin + url.pathname;
    const networkRequest = new Request(event.request, { cache:'no-store' });
    event.respondWith(fetch(networkRequest).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(stableUrl, copy));
      }
      return response;
    }).catch(() => caches.match(stableUrl)));
    return;
  }
  const networkRequest = new Request(event.request, { cache:'no-cache' });
  event.respondWith(fetch(networkRequest).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
