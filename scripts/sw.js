const CACHE_NAME = 'cotodo-cache-v1';
const urlsToCache = ['/', '/stylesheets/styles.css', '/scripts/index.js', '/images/icon-500.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});