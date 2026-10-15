const C = 'dua-v2';
const CORE = ['./', './manifest.json', './icon-192.png', './icon-512.png'];

‎// نسخة "نظيفة" من الرد (بدون redirect) لأن المتصفح بيرفض يعرض رد محوّل لصفحة
async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: 200, statusText: 'OK', headers: res.headers });
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(C).then(c =>
‎      // كل ملف لحاله: إذا واحد فشل ما بيفشل الباقي
      Promise.all(CORE.map(async u => {
        try {
          const res = await fetch(new Request(u, { cache: 'reload' }));
          if (res.ok) await c.put(u, await clean(res));
        } catch (_) {}
      }))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) {
        const store = await clean(res.clone());
        caches.open(C).then(c => c.put(req, store)).catch(() => {});
      }
      return res;
    } catch (_) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const page = (await caches.match('./')) || (await caches.match('./index.html'));
        if (page) return page;
      }
      return Response.error();
    }
  })());
});