import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const output = 'docs';
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory()
    ? files(join(directory, entry.name))
    : [join(directory, entry.name)]));
  return nested.flat();
}
const assets = (await files(output))
  .filter((file) => !file.endsWith('sw.js'))
  .map((file) => `./${relative(output, file).replaceAll('\\', '/')}`);
const precache = [...new Set(['./', ...assets])];
const version = await readFile('package.json', 'utf8').then((text) => JSON.parse(text).version);
const source = `const CACHE = 'quilt-solver-${version}';
const PRECACHE = ${JSON.stringify(precache)};
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
`;
await writeFile(join(output, 'sw.js'), source);
