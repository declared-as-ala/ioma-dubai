// Kill-switch service worker. This site does not use a service worker, but another app (or an earlier build)
// served from the same origin may have registered one that serves stale Next.js chunks.
// When the browser re-checks /sw.js it receives this file, which clears every cache, unregisters itself and
// reloads open tabs once.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => c.navigate(c.url));
    })(),
  );
});
