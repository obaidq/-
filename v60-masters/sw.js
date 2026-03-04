// ═══════════════════════════════════════════════════════════════════════════
// V60 Masters — Service Worker (Cache-First Strategy)
// ═══════════════════════════════════════════════════════════════════════════

var CACHE_NAME = 'v60-masters-v1';

var PRE_CACHE = [
  './app.html',
  './coffeeKnowledgeBase.js',
  './troubleshooting-data.js',
  './newRecipes.js',
  './manifest.json',
  './grind-dial.js',
  './brew-along.js',
  './tasting-journal.js',
  './bean-library.js',
  './custom-recipe.js',
  './calibration-wizard.js',
  './cost-tracker.js'
];

// ─── Install: pre-cache app shell ────────────────────────────────────────
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(PRE_CACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ─── Activate: clean old caches ──────────────────────────────────────────
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (name) {
          return name !== CACHE_NAME;
        }).map(function (name) {
          return caches.delete(name);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: cache-first, fallback to network, then cache response ────────
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);

  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // Special handling for Google Fonts — cache on first fetch
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(e.request).then(function (cached) {
          if (cached) return cached;
          return fetch(e.request).then(function (response) {
            if (response && response.status === 200) {
              cache.put(e.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Cache-first for app files
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;

      return fetch(e.request).then(function (response) {
        // Don't cache non-ok responses or opaque responses we don't control
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(e.request, responseClone);
        });

        return response;
      }).catch(function () {
        // Offline fallback — if it's a navigation request, serve app.html
        if (e.request.mode === 'navigate') {
          return caches.match('./app.html');
        }
      });
    })
  );
});
