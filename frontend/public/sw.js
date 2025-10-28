// Service Worker for 4tify PWA
const CACHE_NAME = '4tify-v1.0.0';
const STATIC_CACHE = '4tify-static-v1.0.0';
const DYNAMIC_CACHE = '4tify-dynamic-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/pricing',
    '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
                    .map((key) => {
                        console.log('[SW] Removing old cache:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Firebase and external API requests
    if (
        request.url.includes('firebase') ||
        request.url.includes('googleapis') ||
        request.url.includes('firestore') ||
        request.url.includes('stripe')
    ) {
        return;
    }

    event.respondWith(
        caches.match(request).then((response) => {
            // Return cached response if available
            if (response) {
                console.log('[SW] Serving from cache:', request.url);
                return response;
            }

            // Otherwise fetch from network
            return fetch(request)
                .then((networkResponse) => {
                    // Cache successful responses
                    if (networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch((error) => {
                    console.log('[SW] Fetch failed:', error);
                    // Return offline page or cached fallback
                    return caches.match('/').then((fallback) => {
                        return fallback || new Response('Offline - No cached content available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain',
                            }),
                        });
                    });
                });
        })
    );
});

// Background sync for uploads (future feature)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-uploads') {
        console.log('[SW] Background sync: uploads');
        // Implement upload sync logic here
    }
});

// Push notifications (optional future feature)
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || '4tify Notification';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'notification',
        requireInteraction: false,
        data: data.url || '/',
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});
