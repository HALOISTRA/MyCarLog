const CACHE_NAME = "vehicle-passport-v1";
const STATIC_ASSETS = ["/", "/garage", "/reminders", "/documents"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API and auth routes
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: "Offline" }), { headers: { "Content-Type": "application/json" } }))
    );
    return;
  }

  // Cache-first for static assets
  if (request.destination === "image" || request.destination === "script" || request.destination === "style") {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request).then((resp) => {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return resp;
      }))
    );
    return;
  }

  // Network-first for pages
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((cached) => cached ?? caches.match("/")))
  );
});
