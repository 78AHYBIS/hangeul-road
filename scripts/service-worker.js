/* global self, caches, clients */
/**
 * Hangeul Road service worker: makes the app open and work with no network.
 *
 * At build time `scripts/sw-plugin.ts` puts two constants in front of this file:
 *   PRECACHE - every file of the build (scripts, styles, content chunks, icons)
 *   VERSION  - a hash of those files; a new build gives a new version
 *
 * Strategy: everything is cached at install, then served from the cache first.
 * A new version installs in the background and waits; the app shows "Update ready"
 * and sends SKIP_WAITING when the user taps Reload.
 */

const CACHE = `hangeul-road-${VERSION}`;
const META_CACHE = 'hangeul-road-meta';
const META_URL = './__reminder-meta.json';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((path) => `./${path}`))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('hangeul-road-') && key !== CACHE && key !== META_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'REMINDER') event.waitUntil(saveMeta(event.data.meta));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Outside links (YouTube, store pages…) go straight to the network.
  if (url.origin !== self.location.origin) return;

  // The app is one page (HashRouter), so every navigation gets the cached index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html', { cacheName: CACHE }).then((cached) => cached ?? fetch(request)),
    );
    return;
  }

  event.respondWith(
    caches
      .match(request, { cacheName: CACHE, ignoreSearch: true })
      .then((cached) => cached ?? fetch(request)),
  );
});

// ---- Daily reminder ----------------------------------------------------------------
// Where the browser supports Periodic Background Sync (Chrome on Android, installed app),
// it wakes this worker now and then. The page keeps the reminder settings and the last
// study day in a small cache entry, because a service worker cannot read React state.

async function readMeta() {
  const cache = await caches.open(META_CACHE);
  const response = await cache.match(META_URL);
  return response ? response.json() : null;
}

async function saveMeta(meta) {
  const cache = await caches.open(META_CACHE);
  await cache.put(META_URL, new Response(JSON.stringify(meta)));
}

function localDay(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'daily-reminder') return;
  event.waitUntil(
    (async () => {
      const meta = await readMeta();
      if (!meta?.on) return;
      const now = new Date();
      const today = localDay(now);
      const [h, m] = meta.time.split(':').map(Number);
      const due = now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
      if (!due || meta.studiedOn === today || meta.shownOn === today) return;
      await self.registration.showNotification('Hangeul Road', {
        body: 'Your plan for today is ready. Five minutes counts too.',
        icon: './icons/icon-192.png',
        tag: 'daily-reminder',
      });
      await saveMeta({ ...meta, shownOn: today });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const open = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (open[0]) return open[0].focus();
      return clients.openWindow('./');
    })(),
  );
});
