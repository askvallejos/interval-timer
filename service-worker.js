const CACHE_NAME = 'interval-timer-v1.3';
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
        // Cache essential resources first
        const essentialUrls = ['/', '/index.html', '/script.js'];
        return cache.addAll(essentialUrls)
          .then(() => {
            // Cache additional resources individually with error handling
            const additionalCaching = urlsToCache
              .filter(url => !essentialUrls.includes(url))
              .map(url => {
                return cache.add(url).catch((error) => {
                  console.warn('Failed to cache:', url, error);
                  // Don't let individual failures break the entire install
                  return Promise.resolve();
                });
              });
            return Promise.all(additionalCaching);
          });
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
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
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          console.log('Serving from cache:', event.request.url);
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
        }).catch((error) => {
          console.log('Network request failed:', event.request.url, error);
          
          // Network failed, try to serve appropriate offline fallbacks
          if (event.request.destination === 'document' || 
              event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
          
          // For other requests, try to find a cached version
          return caches.match(event.request.url).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If it's a request for sounds, try to return a cached sound file
            if (event.request.url.includes('/sounds/')) {
              return caches.match('/sounds/beep.mp3');
            }
            
            // Return a basic network error response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        });
      })
  );
}); 