const CACHE_NAME = 'interval-timer-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/script.js',
  '/sounds/beep.mp3',
  '/sounds/complete.mp3',
  '/public/sounds/beep.mp3',
  '/public/sounds/complete.mp3',
  '/public/favicon/favicon.ico',
  '/public/favicon/favicon-32x32.png',
  '/public/favicon/favicon-16x16.png',
  '/public/favicon/apple-touch-icon.png',
  '/public/favicon/android-chrome-192x192.png',
  '/public/favicon/android-chrome-512x512.png',
  '/public/favicon/site.webmanifest'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => {
          return cache.add(url).catch((error) => {
            console.log('Failed to cache:', url, error);
          });
        }));
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(() => {
          // Network failed, try to serve a basic offline page for HTML requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
}); 