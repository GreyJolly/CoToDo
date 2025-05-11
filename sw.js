const CACHE_NAME = 'cotodo-cache-v6';

const urlsToCache = [
	'./',
	'./index.html',
	'./profile.html',
	'./calendar.html',
	'./list.html',
	'./contributors.html',
	'./friends.html',
	'./friend_requests.html',
	',/task.html',
	'./stylesheets/index.css',
	'./stylesheets/buttons.css',
	'./stylesheets/profile.css',
	'./stylesheets/calendar.css',
	'./stylesheets/contributors.css',
	'./stylesheets/friend_requests.css',
	'./stylesheets/friends.css',
	'./stylesheets/list.css',
	'./stylesheets/task.js',
	'./scripts/index.js',
	'./scripts/calendar.js',
	'./scripts/contributors.js',
	'./scripts/friend_requests.js',
	'./scripts/friends.js',
	'./scripts/index.js',
	'./scripts/list.js',
	'./scripts/profile.js',
	'./scripts/task.js',
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