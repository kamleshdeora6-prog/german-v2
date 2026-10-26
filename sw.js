/* Offline cache, v6.
   Before: cache-first, so after every deploy people kept seeing the old app until a second reload.
   Now: network-first with a short timeout for the app's own files (fresh when online, instant offline),
   and the page shows an "Update" bar when a new service worker is waiting. */
const CACHE = "deutsch-coach-v6.3.0";
const FILES = ["./", "index.html", "manifest.webmanifest", "css/app.css", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "js/engine.js", "js/engine_plus.js", "js/core.js", "js/habit.js", "js/tutor.js", "js/feedback.js", "js/ui.js", "js/views1.js", "js/views2.js", "js/views3.js", "js/views4.js", "js/views5.js", "js/views6.js", "js/views7.js", "js/views8.js", "js/views9.js", "js/weber.js", "js/app.js",
  ...["curriculum", "reference", "scenes", "vocab", "verbs", "conj", "notes", "passages", "bank", "lid", "exams", "placement", "starter"].map((f) => `js/data/${f}.js`)];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then((r) => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    if (!hit) return net.catch(() => caches.match("index.html"));
    // online: wait up to 2.5 s for the fresh file, otherwise serve the cached copy
    const timeout = new Promise((res) => setTimeout(() => res(hit), 2500));
    return Promise.race([net.catch(() => hit), timeout]);
  })());
});
