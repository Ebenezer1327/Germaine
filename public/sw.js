// Service Worker for Germaine PWA
const CACHE_NAME = 'germaine-v2';

// Only cache static assets that won't redirect
const urlsToCache = [
  '/css/style.css',
  '/js/script.js',
  '/js/todo.js',
  '/js/journal.js',
  '/manifest.json'
];

// Install event - cache essential static files only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('Cache install error:', err);
      })
  );
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
  self.clients.claim();
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API requests - always go to network
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // For navigation requests (HTML pages), use network-first strategy
  // This avoids caching redirected responses from auth
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Could return an offline page here if needed
          return caches.match('/');
        })
    );
    return;
  }
  
  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Don't cache redirected responses
          if (response.redirected) {
            return response;
          }
          
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Offline fallback for assets could go here
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let data = {
    title: 'Germaine Reminder',
    body: 'You have a task due!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'todo-reminder',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View Task' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      requireInteraction: data.requireInteraction,
      actions: data.actions,
      data: data.data || {}
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open or focus the todo page
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url.includes('/todo') && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window to todo page
          if (clients.openWindow) {
            return clients.openWindow('/todo');
          }
        })
    );
  }
});

// Background sync for offline todo creation (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-todos') {
    event.waitUntil(syncTodos());
  }
});

async function syncTodos() {
  // Future: sync offline-created todos when back online
  console.log('Syncing todos...');
}
