/* Offline cache: app shell is cached on install, updated in the background. */
const CACHE = "deutsch-coach-v4.4.0";
const FILES = ["./", "index.html", "manifest.webmanifest", "css/app.css", "icons/icon-192.png", "icons/icon-512.png",
  "js/engine.js", "js/engine_plus.js", "js/core.js", "js/tutor.js", "js/ui.js", "js/views1.js", "js/views2.js", "js/views3.js", "js/views4.js", "js/views5.js", "js/views6.js", "js/app.js",
  ...["curriculum", "reference", "scenes", "vocab", "verbs", "conj", "notes", "passages", "bank", "lid", "exams"].map((f) => `js/data/${f}.js`)];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => {
    const net = fetch(e.request).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone())); return r; }).catch(() => hit);
    return hit || net;
  }));
});
