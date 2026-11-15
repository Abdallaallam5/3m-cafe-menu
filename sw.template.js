/* 3M cafe — service worker
   Bump CACHE_VERSION (build.py does it automatically) whenever the menu or assets change. */
const CACHE_VERSION = '%%VERSION%%';
const CACHE = `3m-cafe-${CACHE_VERSION}`;
const PRECACHE = %%ASSETS%%;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
  );
  // First install activates immediately; later versions wait for the user to tap "تحديث".
  if (!self.registration.active) self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('3m-cafe-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network first (fresh menu when online), fall back to cached shell offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Menu data: stale-while-revalidate.
  if (url.pathname.endsWith('/data/menu.json')) {
    event.respondWith(
      caches.open(CACHE).then((cache) =>
        cache.match(req, { ignoreSearch: true }).then((cached) => {
          const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
          return cached || network;
        })
      )
    );
    return;
  }

  // Static assets: cache first.
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) =>
      cached || fetch(req).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
    )
  );
});
