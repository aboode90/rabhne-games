const CACHE_NAME = 'rabhne-v2.12'; // Bumping version
const urlsToCache = [
  '/',
  '/index.html',
  '/games.html',
  '/dashboard.html',
  '/withdraw.html',
  '/admin.html',
  '/css/style.css?v=2.4',
  '/css/mobile.css?v=2.4',
  '/css/animations-light.css?v=2.4',
  '/js/main.js?v=2.4',
  '/js/auth.js?v=2.4',
  '/js/firebase-config.js?v=2.4',
  '/js/stats.js?v=2.4',
  '/js/pwa.js',
  '/js/ads.js',
  '/js/game.js?v=2.11' // Ensure game.js is fresh
];

// Install: Cache files
self.addEventListener('install', event => {
  // Force new SW to enter waiting state immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Attempt to cache, but don't fail entire install if one fails
        return cache.addAll(urlsToCache).catch(err => console.error('Caching failed', err));
      })
  );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
  // Take control of all open clients immediately
  event.waitUntil(clients.claim());

  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Network First strategy for HTML, Stale-While-Revalidate for assets
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  // For HTML pages: Network First (to get fresh content), fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // For CSS/JS/Images: Cache First, then Network (Stale-While-Revalidate essentially, or Cache First for speed)
  // Given we use versioning (?v=2.1), Cache First is safe and fast.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          // Don't cache partial responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
  );
});