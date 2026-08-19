var CACHE_V='v5.2.1';
// Veridia HealthTech — Service Worker (offline + cache)
const CACHE_NAME = 'veridia-v3';
const ASSETS = [
  '/portal-profesional.html',
  '/index.html',
  '/sobre-nosotros.html',
  '/superadmin.html',
  '/portal-paciente.html',
  '/css/app-styles.css',
  '/css/design-system.css',
  '/data/bedca-data.js',
  '/assets/logo-icon.png',
  '/assets/logo-full.png',
  '/manifest.json',
  '/js/firebase.js',
  '/js/icons-nav.js',
  '/js/backend-service.js',
  '/js/i18n.js',
  '/js/charts.js',
  '/js/core.js',
  '/js/v-security.js',
  '/js/v-clinical.js',
  '/js/v-pathology.js',
  '/js/v-ux.js',
  '/js/v-platform.js',
  '/js/v-memory.js',
  '/js/dashboard.js',
  '/js/agenda.js',
  '/js/pacientes.js',
  '/js/historia.js',
  '/js/antropometria.js',
  '/js/analiticas.js',
  '/js/formula.js',
  '/js/espen.js',
  '/js/pathology-db.js',
  '/js/desarrollada.js',
  '/js/alimentos.js',
  '/js/recetas.js',
  '/js/planes.js',
  '/js/favoritos.js',
  '/js/facturacion.js',
  '/js/anamnesis.js',
  '/js/lifecycle-alerts.js',
  '/js/clinical-tools.js',
  '/js/mensajeria.js',
  '/js/ia-copilot.js',
  '/js/utilities.js',
  '/js/soporte-nutricional.js',
  '/js/restauracion.js',
  '/js/feedback.js',
  '/js/settings.js',
  '/js/contabilidad.js',
  '/js/auth.js'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // API calls and external resources: network-first
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets: cache-first with network fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback
      if (e.request.destination === 'document') return caches.match('/portal-profesional.html');
    })
  );
});
