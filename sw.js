/* 3M cafe — service worker
   Bump CACHE_VERSION (build.py does it automatically) whenever the menu or assets change. */
const CACHE_VERSION = 'c88ad99392';
const CACHE = `3m-cafe-${CACHE_VERSION}`;
const PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "css/styles.css",
  "js/app.js",
  "data/menu.json",
  "assets/fonts/cairo-arabic-400-normal.woff2",
  "assets/fonts/cairo-arabic-700-normal.woff2",
  "assets/fonts/cairo-latin-400-normal.woff2",
  "assets/fonts/cairo-latin-700-normal.woff2",
  "assets/fonts/cinzel-latin-700-normal.woff2",
  "assets/fonts/el-messiri-arabic-700-normal.woff2",
  "assets/fonts/great-vibes-latin-400-normal.woff2",
  "assets/icons/apple-touch-icon.png",
  "assets/icons/favicon-32.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/maskable-512.png",
  "assets/img/addons.webp",
  "assets/img/beirut.webp",
  "assets/img/cocktail.webp",
  "assets/img/coffee-hot.webp",
  "assets/img/croissant.webp",
  "assets/img/frappe-choc.webp",
  "assets/img/frappe-pist.webp",
  "assets/img/hero-scene.webp",
  "assets/img/hot-choc.webp",
  "assets/img/icecream.webp",
  "assets/img/iced-coffee.webp",
  "assets/img/juice-guava.webp",
  "assets/img/juice-orange.webp",
  "assets/img/logo-260.webp",
  "assets/img/logo-520.webp",
  "assets/img/logo.png",
  "assets/img/milkshake.webp",
  "assets/img/mojito.webp",
  "assets/img/sahlab.webp",
  "assets/img/shisha.webp",
  "assets/img/smoothie-mango.webp",
  "assets/img/smoothie-melon.webp",
  "assets/img/soft-drinks.webp",
  "assets/img/sweets.webp",
  "assets/img/tea.webp",
  "assets/img/waffle.webp"
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
  );
  // First install activates immediately; later versions wait for the user to tap "تحديث".
  if (!self.registration.active) self.skipWaiting();
});

const dropOldCaches = () => caches.keys()
  .then((keys) => Promise.all(keys.filter((k) => k.startsWith('3m-cafe-') && k !== CACHE).map((k) => caches.delete(k))));
// Always read from THIS version's cache only (never from an older version's leftovers).
const fromCache = (req) => caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }));

self.addEventListener('activate', (event) => {
  event.waitUntil(dropOldCaches().then(() => self.clients.claim()));
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
          dropOldCaches();
          return res;
        })
        .catch(() => fromCache('./index.html').then((r) => r || fromCache('./')))
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
    fromCache(req).then((cached) =>
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
