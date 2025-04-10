const CACHE_NAME = 'cotodo-cache-v3';

const urlsToCache = [
	'./',
	'./index.html',
	'./profile.html',
	'./calendar.html',
	'./stylesheets/index.css',
	'./stylesheets/buttons.css',
	'./stylesheets/profile.css',
	'./stylesheets/calendar.css',
	'./scripts/index.js',
	'./images/icon-512.png',
	'./images/icon-192.png'
];
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