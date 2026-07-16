const CACHE = 'quilt-solver-0.1.0';
const PRECACHE = ["./","./assets/index-5MVYInlL.css","./assets/index-XTNmGnaJ.js","./assets/solver.worker-CBSqmEOD.js","./coi.js","./icons/quilt.svg","./index.html","./manifest.webmanifest","./solver/z3-built.js","./solver/z3-built.wasm"];
const isolated = (response) => {
  const headers = new Headers(response.headers);
  headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => {
    if (cached) return isolated(cached);
    return fetch(event.request).then((response) => {
      if (new URL(event.request.url).origin === self.location.origin) caches.open(CACHE).then((cache) => cache.put(event.request, response.clone()));
      return isolated(response);
    });
  }));
});
