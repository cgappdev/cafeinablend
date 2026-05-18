const CACHE_NAME = 'cafeinablend-v8';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './images/espresso.png',
    './images/croissant.png',
    './images/orange_juice.png'
];

// Install Event
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch Event - Network First Strategy with Robust Cache Fallback
// This ensures that the web app remains beautifully stylized and complete when offline.
self.addEventListener('fetch', event => {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // Identify assets that should be cached offline
    const shouldCache = 
        url.origin === self.location.origin || 
        url.hostname.includes('fonts.googleapis.com') || 
        url.hostname.includes('fonts.gstatic.com') || 
        url.hostname.includes('cdnjs.cloudflare.com') ||
        url.hostname.includes('ka-f.fontawesome.com') ||
        event.request.destination === 'image' ||
        event.request.destination === 'font';

    if (!shouldCache) {
        // Direct pass-through for Firebase Auth/Firestore and database network handshakes
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // If network response is valid, cache it and return
                if (response && (response.status === 200 || response.type === 'opaque')) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache on network failure
                return caches.match(event.request);
            })
    );
});
