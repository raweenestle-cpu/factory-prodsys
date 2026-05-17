const CACHE_NAME = 'prodsys-v1';
const STATIC = [
  '/factory-prodsys/',
  '/factory-prodsys/index.html',
  '/factory-prodsys/leadman.html',
  '/factory-prodsys/mixing.html',
  '/factory-prodsys/pasteurize.html',
  '/factory-prodsys/cipman.html',
  '/factory-prodsys/filling.html',
  '/factory-prodsys/flavor.html',
  '/factory-prodsys/aging.html',
  '/factory-prodsys/flowmeter.html',
  '/factory-prodsys/admin.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first — ถ้าออนไลน์ดึงใหม่ ถ้าออฟไลน์ใช้ cache
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
