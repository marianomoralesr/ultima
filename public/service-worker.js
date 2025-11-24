// Service Worker for Trefa.mx - Advanced Caching Strategy
const CACHE_NAME = 'trefa-v1';
const RUNTIME_CACHE = 'trefa-runtime-v1';
const IMAGE_CACHE = 'trefa-images-v1';
const API_CACHE = 'trefa-api-v1';

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/placeholder-vehicle.webp',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fallback to cache
  networkFirst: async (request, cacheName) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      throw error;
    }
  },

  // Cache first, fallback to network
  cacheFirst: async (request, cacheName) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      throw error;
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request, cacheName) => {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });

    return cachedResponse || fetchPromise;
  },

  // Network only (no caching)
  networkOnly: async (request) => {
    return fetch(request);
  }
};

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('trefa-') &&
                   cacheName !== CACHE_NAME &&
                   cacheName !== RUNTIME_CACHE &&
                   cacheName !== IMAGE_CACHE &&
                   cacheName !== API_CACHE;
          })
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and dev tools
  if (url.protocol === 'chrome-extension:' || url.hostname === 'localhost' && url.port === '9222') {
    return;
  }

  // Handle different request types with appropriate strategies

  // Images - cache first with long expiry
  if (request.destination === 'image' ||
      /\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/i.test(url.pathname)) {
    event.respondWith(
      CACHE_STRATEGIES.cacheFirst(request, IMAGE_CACHE)
        .catch(() => {
          // Return placeholder image on error
          return caches.match('/placeholder-vehicle.webp');
        })
    );
    return;
  }

  // API calls to Supabase - stale while revalidate with 5 minute expiry
  if (url.hostname === 'jjepfehmuybpctdzipnu.supabase.co' && url.pathname.includes('/rest/')) {
    event.respondWith(
      CACHE_STRATEGIES.staleWhileRevalidate(request, API_CACHE)
        .then(response => {
          // Add cache headers
          const headers = new Headers(response.headers);
          headers.set('sw-cache-expires', Date.now() + (5 * 60 * 1000)); // 5 minutes
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: headers
          });
        })
    );
    return;
  }

  // CDN resources (images.trefa.mx) - cache first with long expiry
  if (url.hostname === 'images.trefa.mx') {
    event.respondWith(
      CACHE_STRATEGIES.cacheFirst(request, IMAGE_CACHE)
    );
    return;
  }

  // Static assets (JS, CSS) - cache first
  if (request.destination === 'script' ||
      request.destination === 'style' ||
      /\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(
      CACHE_STRATEGIES.cacheFirst(request, RUNTIME_CACHE)
    );
    return;
  }

  // HTML pages - network first for fresh content
  if (request.mode === 'navigate' ||
      request.destination === 'document' ||
      /\.html$/i.test(url.pathname)) {
    event.respondWith(
      CACHE_STRATEGIES.networkFirst(request, RUNTIME_CACHE)
        .catch(() => {
          // Return cached homepage as fallback
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Font files - cache first with long expiry
  if (request.destination === 'font' || /\.(woff|woff2|ttf|otf)$/i.test(url.pathname)) {
    event.respondWith(
      CACHE_STRATEGIES.cacheFirst(request, RUNTIME_CACHE)
    );
    return;
  }

  // Default strategy - stale while revalidate
  event.respondWith(
    CACHE_STRATEGIES.staleWhileRevalidate(request, RUNTIME_CACHE)
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-applications') {
    event.waitUntil(syncApplications());
  }
});

async function syncApplications() {
  // Get queued applications from IndexedDB and sync them
  // This would be implemented based on your specific needs
  console.log('Syncing offline applications...');
}

// Message handler for cache operations
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith('trefa-')) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  }
});