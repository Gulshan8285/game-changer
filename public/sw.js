const CACHE_PREFIX = "dhan-kamao";
const CACHE_VERSION = "v2";
const STATIC_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}-runtime`;
const PRECACHE_URLS = [
  "/offline.html",
  "/logo.svg",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith(`${CACHE_PREFIX}-`) &&
                key !== STATIC_CACHE &&
                key !== RUNTIME_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);

          if (networkResponse.ok && !url.pathname.startsWith("/admin")) {
            await cache.put(request, networkResponse.clone());
          }

          return networkResponse;
        } catch {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match("/offline.html");
        }
      })(),
    );

    return;
  }

  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(
      (async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      })(),
    );
  }
});
