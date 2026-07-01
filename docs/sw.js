const CACHE_NAME = 'viking-music-v2';
const ASSETS = [
  'index.html',
  'css/styles.css',
  'js/supabase.js',
  'js/auth.js',
  'js/player.js',
  'js/playlists.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Cache First for Audio files - Basic strategy (ignoring Range requests for simplicity in this sandbox)
  // In a real production app, one should use workbox-range-requests or handle 206 responses.
  if (event.request.destination === 'audio' || url.pathname.endsWith('.mp3') || url.pathname.endsWith('.m4a') || url.pathname.endsWith('.wav')) {
    event.respondWith(
      caches.open('viking-audio-cache').then(cache => {
        return cache.match(event.request).then(response => {
          if (response) return response;
          return fetch(event.request).then(fetchResponse => {
            if (fetchResponse.status === 200) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Network First for Supabase API calls (so they work offline if already cached, but stay fresh)
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      caches.open('viking-api-cache').then(cache => {
        return fetch(event.request).then(fetchResponse => {
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        }).catch(() => {
          return cache.match(event.request);
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
