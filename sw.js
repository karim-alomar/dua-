const C = 'dua-v1';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});
‎// الشبكة أولاً (لتظهر التحديثات فوراً)، وإذا ما في إنترنت بنرجع للنسخة المخزّنة
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith(
    fetch(req)
      .then(res => { const copy = res.clone(); caches.open(C).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
  );
});