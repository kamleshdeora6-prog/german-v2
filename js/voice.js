/* Deutsch Coach – natural recorded voices (Piper, made by tools/make_audio.py into audio/).
   Speech uses a recording when one exists for the sentence and falls back to the device voice otherwise.
   Voices: m = main (male), f = second speaker (female), f2, n = announcements. */
(function () {
  "use strict";
  const BASE = new URL("audio/", document.baseURI).href;
  let index = null, loading = null;
  /* 32-bit FNV-1a over UTF-16 code units – the same as fnv1a() in tools/make_audio.py */
  const key = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ("0000000" + h.toString(16)).slice(-8); };
  const norm = (t) => String(t).replace(/\s+/g, " ").trim();
  const Natural = (window.Natural = {
    key,
    /* "auto" (default): recordings when available · "off": always the device voice */
    on: () => (Store.get().settings.natural || "auto") !== "off" && !window.AndroidBridge,
    load() {
      if (index || loading) return loading || Promise.resolve(index);
      loading = fetch(BASE + "index.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).catch(() => null)
        .then((j) => { index = { have: {} }; if (j && j.have) Object.entries(j.have).forEach(([v, hs]) => (index.have[v] = new Set(hs))); index.count = Object.values(index.have).reduce((a, s) => a + s.size, 0); loading = null; return index; });
      return loading;
    },
    ready: () => !!index,
    /* a file that failed to load: don't try it again in this session */
    miss(url) { const m = /audio\/([^/]+)\/([0-9a-f]{8})\.mp3/.exec(url); if (m && index && index.have[m[1]]) index.have[m[1]].delete(m[2]); },
    count: () => (index ? index.count : 0),
    /* URL of the recording for this sentence (preferred voice first, then any voice that has it) */
    url(text, voice) {
      if (!index || !Natural.on() || voice === "__tts") return null;
      const t = norm(text);
      for (const v of [voice, "m", "f", "f2", "n"].filter(Boolean)) { const h = key(v + "|" + t); if (index.have[v] && index.have[v].has(h)) return `${BASE}${v}/${h}.mp3`; }
      return null;
    },
  });
  // start loading the list early, without blocking anything
  if (/^https?:$/.test(location.protocol)) setTimeout(() => Natural.load(), 800);
})();
