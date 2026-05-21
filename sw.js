const CACHE_NAME = 'prodsys-v3';
const STATIC = [
  '/factory-prodsys/',
  '/factory-prodsys/index.html',
  '/factory-prodsys/shared.js',
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

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  
  // ไม่ cache Firebase, gstatic, googleapis — ดึงจาก network เสมอ
  const url = e.request.url;
  if(url.includes('firebase') || url.includes('gstatic') || url.includes('googleapis') || url.includes('firebaseio')) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Network first สำหรับไฟล์อื่น
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
