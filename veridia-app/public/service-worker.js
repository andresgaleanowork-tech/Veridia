/**
 * Veridia HealthTech — Service Worker (Cache-first app shell + network fallback).
 *
 * Caches:
 *  - App shell: index.html, manifest.json, favicon.svg, icons
 *  - All bundled assets under /assets/* (vite build output)
 *  - Fonts (Google Fonts / system)
 *
 * Runtime caching (network-first with cache fallback):
 *  - /api/* requests (GET only)
 *
 * Strategies:
 *  - Stale-while-revalidate for assets
 *  - Network-first for API calls
 *  - Cache-first for same-origin static resources
 */

const VERSION = 'v5.2.0';
const CACHE_NAME = `veridia-shell-${VERSION}`;
const RUNTIME_CACHE = `veridia-runtime-${VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icons.svg',
];

// Precache the app shell and any asset referenced by importmap/manifest.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache what we can; missing files won't break the install.
      await Promise.allSettled(APP_SHELL.map((url) => cache.add(url)));
      self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      );
      self.clients.claim();
    })(),
  );
});

// Helper: network-first for API, cache-first for static assets.
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
    throw new Error('Network failed and no cache hit');
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { cacheName });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch {
    return cached;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  // API calls: network-first with runtime cache fallback
  if (url.pathname.startsWith('/api')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // Static assets: cache-first with network fallback
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, CACHE_NAME));
    return;
  }

  // Navigation: serve cached index.html (offline-capable SPA)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          return response;
        } catch {
          const cached = await caches.match('/index.html', { cacheName: CACHE_NAME });
          if (cached) {
            // Tell the client we are offline so it can show the offline page.
            const clients = await self.clients.matchAll({ type: 'window' });
            for (const client of clients) {
              client.postMessage({ type: 'veridia-offline' });
            }
            return cached;
          }
          throw new Error('No navigation cache');
        }
      })(),
    );
    return;
  }
});

// Background sync placeholder for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'veridia-background-sync') {
    event.waitUntil(
      (async () => {
        // Future: replay queued mutations when connection returns.
        const clients = await self.clients.matchAll();
        for (const client of clients) {
          client.postMessage({ type: 'veridia-online' });
        }
      })(),
    );
  }
});

// Push notification placeholder
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Veridia', body: 'Nuevo mensaje' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Veridia', {
      body: data.body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'veridia-notification',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow('/'),
  );
});