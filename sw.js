// Pixel Ugró – offline gyorsítótár
// Ha új verziót töltesz fel, emeld meg ezt a számot, hogy a telefonok frissítsék a mentett fájlokat.
const CACHE = 'pixel-ugro-v1';

const ASSETS = [
  './pixel-ugro.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // egyenként próbáljuk menteni: egy hiányzó fájl se akassza meg a többit
      await Promise.all(ASSETS.map((url) => c.add(url).catch(() => {})));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      // ha van mentett verzió, azonnal azt adjuk, közben a hálózatból frissítünk;
      // ha nincs mentve, megvárjuk a hálózatot (vagy elbukik, ha nincs net és nincs cache)
      return cached || network;
    })
  );
});
