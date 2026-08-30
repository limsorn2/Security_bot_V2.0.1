// Simple Service Worker for PWA Android Installation
const CACHE_NAME = 'security-bot-v2-cache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle requests
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
