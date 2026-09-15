const CACHE = 'cicekoto-neon-v43';
const ASSETS = [
  '/',
  '/index.html',
  '/css/fonts.css?v=1',
  '/css/style.css?v=29',
  '/js/main.js?v=34',
  '/img/favicon-16.png',
  '/img/favicon-32.png',
  '/img/apple-touch-icon.png',
  '/img/icon-192.png',
  '/img/icon-512.png',
  '/img/optimized/cicek-oto-logo.webp',
  '/img/optimized/cicek-oto-logo-256.webp',
  '/img/optimized/hologram-vag-sedan-v1.webp',
  '/fonts/manrope-latin.woff2',
  '/fonts/manrope-latin-ext.woff2',
  '/fonts/space-grotesk-latin.woff2',
  '/fonts/space-grotesk-latin-ext.woff2',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const requestUrl = new URL(e.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname === '/admin' || requestUrl.pathname === '/admin.html') return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (res.ok && ['document','style','script','image','font','manifest'].includes(e.request.destination)) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || (requestUrl.pathname === '/' || requestUrl.pathname === '/index.html' ? caches.match('/index.html') : Response.error())))
  );
});
