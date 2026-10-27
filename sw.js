/* Offline cache, v6.
   Before: cache-first, so after every deploy people kept seeing the old app until a second reload.
   Now: network-first with a short timeout for the app's own files (fresh when online, instant offline),
   and the page shows an "Update" bar when a new service worker is waiting. */
const PREFIX = "deutsch-coach-v";          // the lab edition uses "deutsch-coach-lab-v" (tools/make_editions.py)
const VERSION = "6.8.0";
const CACHE = PREFIX + VERSION;
const VENDOR = PREFIX.replace(/-v$/, "") + "-vendor";
const FILES = ["./", "index.html", "manifest.webmanifest", "css/app.css", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "assets/grammar_reference.png",
  "js/edition.js", "js/engine.js", "js/engine_plus.js", "js/core.js", "js/habit.js", "js/tutor.js", "js/feedback.js", "js/ai.js", "js/llm.js", "js/asr.js", "js/ui.js", "js/views1.js", "js/views2.js", "js/views3.js", "js/views4.js", "js/views5.js", "js/views6.js", "js/views7.js", "js/views8.js", "js/views9.js", "js/views10.js", "js/views11.js", "js/weber.js", "js/app.js",
  ...["curriculum", "reference", "scenes", "vocab", "verbs", "conj", "notes", "passages", "bank", "lid", "exams", "placement", "starter", "dialogues", "sentences", "cards", "pictures"].map((f) => `js/data/${f}.js`)];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith(PREFIX) && /^\d/.test(k.slice(PREFIX.length))).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // AI model files are huge and cached by the AI libraries themselves – never copy them into this cache
  if (/\/models\//.test(u.pathname)) return;
  // vendored libraries never change under the same versioned path: cache first, fetch only once
  if (/\/vendor\//.test(u.pathname) || /\/js\/(llm|asr)-worker\.js$/.test(u.pathname)) {
    e.respondWith(caches.open(VENDOR).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
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
