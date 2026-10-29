/* Deutsch Coach – shared services for 7.0:
   Rec       – record your voice and keep the takes on this device (IndexedDB, not in the backup)
   Notebook  – one-tap ⭐ save of words, rules and sentences; saved words become flashcards
   Writings  – every text you write for a task, with each version's score (rewrite → resubmit)
   Weekly    – per-day accuracy per topic, for the weekly report and the readiness meter */
(function () {
  "use strict";
  const { esc } = H;

  /* ---------------- recordings ---------------- */
  const DB = "deutschcoach-audio", STORE = "takes", KEEP_PER_KEY = 5, KEEP_ALL = 80;
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((ok, fail) => {
    if (!window.indexedDB) return fail(new Error("no indexedDB"));
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => { const s = r.result.createObjectStore(STORE, { keyPath: "id" }); s.createIndex("key", "key"); s.createIndex("at", "at"); };
    r.onsuccess = () => ok(r.result); r.onerror = () => fail(r.error);
  }));
  const tx = async (mode, fn) => { const d = await db(); return new Promise((ok, fail) => { const t = d.transaction(STORE, mode); const st = t.objectStore(STORE); const res = fn(st); t.oncomplete = () => ok(res && res.result !== undefined ? res.result : res); t.onerror = () => fail(t.error); }); };
  const profileKey = () => (Store.profile ? Store.profile().id : "p1") + (window.EDITION === "lab" ? ":lab" : "");
  const Rec = (window.Rec = {
    supported: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder && window.indexedDB) && !window.AndroidBridge,
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", ""].find((t) => !t || MediaRecorder.isTypeSupported(t));
      const mr = new MediaRecorder(stream, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined);   // speech quality, small files
      const chunks = []; mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const t0 = Date.now(); mr.start(250);
      return { stop: () => new Promise((ok) => { mr.onstop = () => { stream.getTracks().forEach((t) => t.stop()); ok({ blob: new Blob(chunks, { type: mr.mimeType || "audio/webm" }), secs: Math.round((Date.now() - t0) / 1000) }); }; mr.stop(); }), secs: () => Math.round((Date.now() - t0) / 1000) };
    },
    async save(key, blob, meta = {}) {
      const item = Object.assign({ id: "r" + Date.now() + Math.random().toString(36).slice(2, 6), key: profileKey() + "|" + key, at: Date.now(), blob }, meta);
      await tx("readwrite", (s) => s.put(item));
      Rec.prune(key).catch(() => {});
      return item;
    },
    async list(key) { const k = profileKey() + "|" + key; const all = await tx("readonly", (s) => s.index("key").getAll(k)); return (all || []).sort((a, b) => b.at - a.at); },
    async all() { const p = profileKey() + "|"; const all = await tx("readonly", (s) => s.getAll()); return (all || []).filter((x) => x.key.startsWith(p)).sort((a, b) => b.at - a.at); },
    remove: (id) => tx("readwrite", (s) => s.delete(id)),
    async prune(key) {
      const mine = await Rec.list(key); for (const x of mine.slice(KEEP_PER_KEY)) await Rec.remove(x.id);
      const all = await tx("readonly", (s) => s.getAll()); const old = (all || []).sort((a, b) => b.at - a.at).slice(KEEP_ALL); for (const x of old) await Rec.remove(x.id);
    },
  });

  /* the recorder widget: ● Record → ■ Stop, then your takes with play buttons (and the model answer to compare) */
  UI.recorder = (el, { key, model = "", maxSecs = 180, label = "Record yourself" }) => {
    if (!Rec.supported()) { el.innerHTML = `<p class="muted small">🎙 Recording isn't available here${window.AndroidBridge ? " in the Android app – use the browser version" : ""}. You can still practise out loud.</p>`; return; }
    el.innerHTML = `<div class="recw"><div class="row"><button class="btn rec-b">● ${esc(label)}</button>${model ? `<button class="btn ghost sm rec-m">🔊 Hear the model</button>` : ""}<span class="muted small rec-t"></span></div><ul class="takes"></ul></div>`;
    const b = el.querySelector(".rec-b"), t = el.querySelector(".rec-t"), ul = el.querySelector(".takes");
    let cur = null, tick = null;
    const draw = async () => {
      let xs = []; try { xs = await Rec.list(key); } catch (e) {}
      ul.innerHTML = xs.map((x, i) => `<li data-id="${x.id}"><audio controls preload="none"></audio><span class="muted small">${i === 0 ? "Latest · " : ""}${new Date(x.at).toLocaleDateString()} ${new Date(x.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${x.secs || "?"} s</span><button class="link rec-del" aria-label="Delete">✕</button></li>`).join("");
      ul.querySelectorAll("li").forEach((li) => { const x = xs.find((y) => y.id === li.dataset.id); const a = li.querySelector("audio"); a.src = URL.createObjectURL(x.blob); li.querySelector(".rec-del").onclick = async () => { await Rec.remove(x.id); draw(); }; });
    };
    b.onclick = async () => {
      if (cur) { clearInterval(tick); b.disabled = true; const r = await cur.stop(); cur = null; b.disabled = false; b.classList.remove("on"); b.textContent = "● Record again"; t.textContent = ""; if (r.secs >= 1) { await Rec.save(key, r.blob, { secs: r.secs }); if (window.Habit) Habit.track("speak"); Store.addXP(3); } draw(); return; }
      Speech.stop();
      try { cur = await Rec.start(); } catch (e) { H.toast(/denied|NotAllowed/i.test(e.name + e.message) ? "Microphone permission was blocked. Allow it in the browser settings." : "Couldn't start the microphone.", "bad"); return; }
      b.classList.add("on"); b.textContent = "■ Stop";
      tick = setInterval(() => { const s = cur ? cur.secs() : 0; t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; if (s >= maxSecs) b.click(); }, 500);
    };
    const m = el.querySelector(".rec-m"); if (m) m.onclick = () => Speech.speak(model);
    draw();
  };

  /* ---------------- notebook ---------------- */
  const nb = () => (Store.get().notebook = Store.get().notebook || []);
  const Notebook = (window.Notebook = {
    list: () => nb(),
    has: (de) => nb().some((x) => x.de === de),
    add(item) {
      if (!item || !item.de || Notebook.has(item.de)) return false;
      const it = Object.assign({ id: "nb" + Date.now().toString(36), at: Date.now(), type: "word" }, item);
      nb().unshift(it);
      if (it.type === "word") SRS.grade("nb:" + it.id, 1), (Store.get().srs["nb:" + it.id].due = Date.now());   // straight into the review deck
      if (it.type === "sentence" && window.Views && Views.addSentenceCard) Views.addSentenceCard(it.de, it.en || "", { src: "notebook" });
      Store.save(); return true;
    },
    remove(id) { const s = Store.get(); s.notebook = nb().filter((x) => x.id !== id); delete s.srs["nb:" + id]; Store.save(); },
    /* saved words as flashcards, in the same shape as the vocabulary list */
    cards: () => nb().filter((x) => x.type === "word").map((x) => ({ id: "nb:" + x.id, de: x.de, en: x.en || "", art: (/^(der|die|das)\s/.exec(x.de) || [])[1] || "", level: "", topic: "Notebook", exDe: x.ex || "", exEn: "" })),
  });
  UI.star = (item) => `<button type="button" class="star ${Notebook.has(item.de) ? "on" : ""}" data-note="${esc(JSON.stringify(item))}" title="Save to my notebook" aria-label="Save to my notebook">${Notebook.has(item.de) ? "★" : "☆"}</button>`;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-note]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    let it; try { it = JSON.parse(b.dataset.note); } catch (er) { return; }
    if (Notebook.has(it.de)) { const x = nb().find((y) => y.de === it.de); Notebook.remove(x.id); b.classList.remove("on"); b.textContent = "☆"; H.toast("Removed from your notebook."); return; }
    Notebook.add(it); b.classList.add("on"); b.textContent = "★"; H.toast(it.type === "word" ? "⭐ Saved – it's in your notebook and your flashcards." : "⭐ Saved to your notebook.", "good");
  }, true);

  /* ---------------- writing history ---------------- */
  const Writings = (window.Writings = {
    get: (task) => (Store.get().whist || {})[task] || null,
    add(task, title, text, score) {
      const s = Store.get(); s.whist = s.whist || {};
      const w = (s.whist[task] = s.whist[task] || { title, versions: [] });
      const last = w.versions[w.versions.length - 1];
      if (last && last.text.trim() === text.trim()) { last.score = score; last.at = Date.now(); }
      else w.versions.push({ text, score, at: Date.now() });
      w.versions = w.versions.slice(-8); w.title = title; Store.save(); return w;
    },
    all: () => Object.entries(Store.get().whist || {}).map(([k, v]) => Object.assign({ task: k }, v)).sort((a, b) => b.versions[b.versions.length - 1].at - a.versions[a.versions.length - 1].at),
  });
  /* word-level comparison of two versions: what you added / removed */
  const diffWords = (a, b) => {
    const A = a.split(/(\s+)/), Bw = b.split(/(\s+)/), n = A.length, m = Bw.length;
    if (n * m > 400000) return esc(b);   // very long texts: skip the diff
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === Bw[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    let i = 0, j = 0, out = "";
    while (i < n && j < m) { if (A[i] === Bw[j]) { out += esc(A[i]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) { if (/\S/.test(A[i])) out += `<del>${esc(A[i])}</del>`; i++; } else { out += /\S/.test(Bw[j]) ? `<ins>${esc(Bw[j])}</ins>` : esc(Bw[j]); j++; } }
    while (i < n) { if (/\S/.test(A[i])) out += `<del>${esc(A[i])}</del>`; i++; } while (j < m) { out += /\S/.test(Bw[j]) ? `<ins>${esc(Bw[j])}</ins>` : esc(Bw[j]); j++; }
    return out;
  };
  UI.writeHistory = (task) => {
    const w = Writings.get(task); if (!w || !w.versions.length) return "";
    const v = w.versions, last = v[v.length - 1], prev = v[v.length - 2];
    return `<details class="card whist" ${v.length > 1 ? "open" : ""}><summary>📝 Your versions: ${v.map((x) => `<b class="${x.score >= 65 ? "good" : x.score >= 45 ? "mid" : "low"}">${x.score}</b>`).join(" → ")}</summary>
      ${prev ? `<p class="muted small">What you changed since the last version (<ins>added</ins> · <del>removed</del>):</p><div class="wdiff">${diffWords(prev.text, last.text)}</div>` : `<p class="muted small">Improve the text and check it again – every version is kept here so you can see your progress.</p>`}
      <ul class="small wvers">${v.map((x, i) => `<li>Version ${i + 1} · ${new Date(x.at).toLocaleDateString()} · <b>${x.score}</b> <button class="link wv-load" data-i="${i}">load</button></li>`).join("")}</ul></details>`;
  };
  UI.bindWriteHistory = (root, task, textarea) => root.querySelectorAll(".wv-load").forEach((b) => (b.onclick = () => { const w = Writings.get(task); textarea.value = w.versions[+b.dataset.i].text; textarea.dispatchEvent(new Event("input")); H.toast("Version loaded."); }));
  /* send the text to a friend or teacher for correction */
  UI.shareText = (text, title = "Please correct my German") => {
    const body = `${title}:\n\n${text}`;
    if (navigator.share) return navigator.share({ title, text: body }).catch(() => {});
    App.openLink("https://wa.me/?text=" + encodeURIComponent(body));
  };

  /* ---------------- weekly log ---------------- */
  const origTopic = Store.topic;
  Store.topic = (id, ok) => {
    origTopic(id, ok); if (!id) return;
    const s = Store.get(), d = Store.today(); s.tlog = s.tlog || {};
    const day = (s.tlog[d] = s.tlog[d] || {}); const x = (day[id] = day[id] || [0, 0]); x[1]++; if (ok) x[0]++;
    const keys = Object.keys(s.tlog); if (keys.length > 70) keys.sort().slice(0, keys.length - 70).forEach((k) => delete s.tlog[k]);
    Store.save();
  };
  const Weekly = (window.Weekly = {
    /* accuracy per topic in [from, to) days back */
    range(from, to) {
      const log = Store.get().tlog || {}, out = {};
      for (let i = from; i < to; i++) { const d = new Date(Date.now() - i * 864e5); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; Object.entries(log[k] || {}).forEach(([t, [r, n]]) => { const o = (out[t] = out[t] || [0, 0]); o[0] += r; o[1] += n; }); }
      return out;
    },
    report() {
      const now = Weekly.range(0, 7), before = Weekly.range(7, 14), s = Store.get();
      const days = Object.keys(s.days || {}).filter((d) => Date.now() - new Date(d).getTime() < 7 * 864e5 && s.days[d] > 0).length;
      const xp = Object.entries(s.days || {}).filter(([d]) => Date.now() - new Date(d).getTime() < 7 * 864e5).reduce((a, [, v]) => a + v, 0);
      const rows = Object.entries(now).filter(([, [, n]]) => n >= 3).map(([t, [r, n]]) => { const b = before[t]; return { t, pct: Math.round((r / n) * 100), n, prev: b && b[1] >= 3 ? Math.round((b[0] / b[1]) * 100) : null }; });
      return { days, xp, answers: Object.values(now).reduce((a, [, n]) => a + n, 0), rows: rows.sort((a, b) => a.pct - b.pct) };
    },
  });
  const title = (id) => (Engine.GEN[id] && Engine.GEN[id].title) || (/^lesson(\d+)/.test(id) ? "Lesson " + (Course.pos(+id.slice(6)) || id.slice(6)) : id.replace(/^bank:|^sent:|^lib:/, "").replace(/_/g, " "));
  UI.weeklyCard = () => {
    const r = Weekly.report(); if (!r.answers) return "";
    const top = r.rows.slice(0, 4), up = r.rows.filter((x) => x.prev !== null && x.pct > x.prev).sort((a, b) => b.pct - b.prev - (a.pct - a.prev)).slice(0, 2);
    return `<section class="card weekly"><h3>📅 ${H.bi("Diese Woche", "This week")}</h3><p class="muted small">${r.days} day${r.days === 1 ? "" : "s"} practised · ${r.answers} answers · ${r.xp} XP</p>
      ${top.length ? `<ul class="wk">${top.map((x) => `<li><span>${esc(title(x.t))}</span><b class="${x.pct >= 80 ? "good" : x.pct >= 60 ? "mid" : "low"}">${x.pct}%</b>${x.prev !== null ? `<small class="${x.pct >= x.prev ? "up" : "down"}">${x.pct >= x.prev ? "↑" : "↓"} ${x.prev}%</small>` : ""}${Engine.GEN[x.t] && x.pct < 80 ? `<button class="link" data-go="practice/${x.t}">practise</button>` : ""}</li>`).join("")}</ul>` : ""}
      ${up.length ? `<p class="small">💪 Better than last week: ${up.map((x) => `<b>${esc(title(x.t))}</b> (${x.prev}% → ${x.pct}%)`).join(", ")}</p>` : ""}</section>`;
  };
  UI.weeklyTitle = title;
})();
