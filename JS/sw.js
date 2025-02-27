// Novo arquivo para Service Worker
const CACHE_NAME = 'vl-contabilidade-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/ESTILOS/style.css',
  '/JS/menu.js',
  '/IMAGENS/LOGO-P.webp',
  // ... outros recursos
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
}); 