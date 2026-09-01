const CACHE = 'cicekoto-neon-v21';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js?v=20',
  '/img/favicon.svg',
  '/img/cicek-oto-logo.png',
  '/img/hologram-vag-sedan-v1.png',
  '/img/neon/hero-reference.png',
  '/img/neon/services-reference.png',
  '/img/neon/booking-reference.png',
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
