/* Deutsch Coach – core services: progress store, spaced repetition, grading, speech. */
(function () {
  "use strict";
  const KEY = "deutschcoach.v2";
  const today = () => new Date().toISOString().slice(0, 10);
  const DEFAULTS = () => ({
    v: 2, created: Date.now(), xp: 0, streak: { count: 0, last: "" }, days: {},
    lessons: {}, topics: {}, srs: {}, chat: [], exams: [], mistakes: [],
    settings: { theme: "auto", rate: 0.9, voice: "", goal: 30, unlockAll: false, showEn: true, aiOnline: false, aiKey: "", aiModel: "claude-haiku-4-5-20251001", onboarded: false },
  });

  let state = null;
  const listeners = new Set();
  function load() {
    try {
      const raw = localStorage.getItem(KEY) || localStorage.getItem("germanCoachProgress");
      const d = DEFAULTS();
      state = raw ? deepMerge(d, JSON.parse(raw)) : d;
    } catch (e) { state = DEFAULTS(); }
    return state;
  }
  function deepMerge(a, b) {
    if (!b || typeof b !== "object") return a;
    Object.keys(b).forEach((k) => {
      if (a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) && typeof b[k] === "object" && !Array.isArray(b[k])) a[k] = deepMerge(a[k], b[k]);
      else a[k] = b[k];
    });
    return a;
  }
  let saveT = null;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn("save failed", e); } }, 150);
    listeners.forEach((f) => f(state));
  }
  const Store = {
    get: () => state || load(),
    save,
    on: (f) => listeners.add(f),
    addXP(n) {
      const s = Store.get(); const d = today();
      s.xp += n; s.days[d] = (s.days[d] || 0) + n;
      if (s.streak.last !== d) {
        const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
        s.streak.count = s.streak.last === y ? s.streak.count + 1 : 1;
        s.streak.last = d;
      }
      save();
    },
    topic(id, ok) {
      if (!id) return;
      const t = (Store.get().topics[id] = Store.get().topics[id] || { r: 0, w: 0, recent: [] });
      ok ? t.r++ : t.w++;
      t.recent = (t.recent || []).concat(ok ? 1 : 0).slice(-12);
      save();
    },
    mistake(m) { const s = Store.get(); s.mistakes.unshift(Object.assign({ t: Date.now() }, m)); s.mistakes = s.mistakes.slice(0, 120); save(); },
    lesson(n) { const s = Store.get(); return (s.lessons[n] = s.lessons[n] || { read: false, score: 0, done: false, tasks: {}, exam: {} }); },
    unlocked(n) { const s = Store.get(); return s.settings.unlockAll || n === 1 || !!(s.lessons[n - 1] && s.lessons[n - 1].done); },
    export() { return JSON.stringify(Store.get(), null, 1); },
    import(txt) { const d = JSON.parse(txt); if (!d || typeof d !== "object" || !("xp" in d)) throw new Error("This file is not a Deutsch Coach backup."); state = deepMerge(DEFAULTS(), d); save(); },
    reset() { state = DEFAULTS(); save(); },
    today,
  };

  // ---------- spaced repetition (Leitner boxes) ----------
  const INTERVAL_D = [0, 1, 2, 4, 8, 16, 35, 70, 150];
  const SRS = {
    card(id) { return Store.get().srs[id]; },
    due(ids) { const now = Date.now(); return ids.filter((id) => { const c = Store.get().srs[id]; return c && c.due <= now; }); },
    fresh(ids) { return ids.filter((id) => !Store.get().srs[id]); },
    grade(id, g) { // g: 0 again, 1 hard, 2 good, 3 easy
      const s = Store.get(); const c = s.srs[id] || { box: 0, due: 0, seen: 0, lapses: 0 };
      c.seen++;
      if (g === 0) { c.box = Math.max(1, c.box - 2); c.lapses++; c.due = Date.now() + 10 * 60e3; }
      else { c.box = Math.min(INTERVAL_D.length - 1, c.box + (g === 3 ? 2 : g === 2 ? 1 : 0) || 1); c.due = Date.now() + INTERVAL_D[c.box] * 864e5 * (g === 1 ? 0.6 : 1) + (c.box === 1 ? 0 : 0); if (c.box === 1 && g !== 3) c.due = Date.now() + 864e5 * (g === 1 ? 0.5 : 1); }
      s.srs[id] = c; save(); return c;
    },
    stats(ids) { const s = Store.get(); let learned = 0, mature = 0; ids.forEach((id) => { const c = s.srs[id]; if (c) { learned++; if (c.box >= 5) mature++; } }); return { learned, mature, due: SRS.due(ids).length }; },
  };

  // ---------- grading ----------
  const UML = [["ae", "ä"], ["oe", "ö"], ["ue", "ü"]];
  function clean(s) {
    return String(s || "").normalize("NFC").toLowerCase().replace(/[„“"'’`´.,!?;:()\[\]…–—\/-]/g, " ").replace(/ß/g, "ss").replace(/\s+/g, " ").trim();
  }
  function lev(a, b) {
    const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[n];
  }
  function grade(given, answer, accept = []) {
    const g = clean(given);
    if (!g) return { ok: false, level: "empty" };
    const cands = [answer].concat(accept || []).filter(Boolean).flatMap((a) => {
      const full = clean(String(a).replace(/\s\/\s/g, " "));
      const parts = String(a).includes(" / ") ? String(a).split(" / ").map(clean).filter((p) => p.split(" ").length > 1) : [];
      return [full].concat(parts);
    });
    for (const c of cands) if (g === c) return { ok: true, level: "exact" };
    let gu = g; UML.forEach(([a, b]) => (gu = gu.split(a).join(b)));
    for (const c of cands) if (gu === c) return { ok: true, level: "umlaut", note: "Correct – but write the umlauts ä, ö, ü." };
    for (const c of cands) {
      const d = lev(gu, c);
      if (c.length > 6 && d === 1) return { ok: false, level: "close", note: "Almost – one letter is different.", diff: d };
    }
    const alt = String(answer).split(" / ").map(clean);
    if (alt.length > 1 && alt.includes(g)) return { ok: false, level: "partial", note: "That matches part of the answer." };
    return { ok: false, level: "wrong" };
  }
  // keyword overlap for open reading answers
  function overlap(given, model) {
    const stop = new Set("der die das den dem des ein eine einen einem und oder aber er sie es ich du wir ihr in im am zu mit von für ist sind hat haben the a an".split(" "));
    const toks = (s) => clean(s).split(" ").filter((w) => w.length > 2 && !stop.has(w));
    const m = toks(model), g = new Set(toks(given));
    if (!m.length) return 0;
    return m.filter((w) => g.has(w) || [...g].some((x) => x.length > 4 && (x.startsWith(w.slice(0, 5)) || w.startsWith(x.slice(0, 5))))).length / m.length;
  }
  function wordDiff(target, said) {
    const a = target.replace(/[.,!?„“"]/g, "").split(/\s+/).filter(Boolean);
    const b = clean(said).split(" ").filter(Boolean);
    const A = a.map(clean);
    const dp = Array.from({ length: A.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = A[i] === b[j] || lev(A[i], b[j]) <= (A[i].length > 5 ? 1 : 0) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    const out = []; let i = 0, j = 0;
    while (i < A.length) {
      if (j < b.length && (A[i] === b[j] || lev(A[i], b[j]) <= (A[i].length > 5 ? 1 : 0))) { out.push({ w: a[i], ok: true }); i++; j++; }
      else if (j < b.length && dp[i][j + 1] >= dp[i + 1][j]) j++;
      else { out.push({ w: a[i], ok: false }); i++; }
    }
    const score = a.length ? Math.round((out.filter((x) => x.ok).length / a.length) * 100) : 0;
    return { words: out, score };
  }

  // ---------- speech ----------
  const bridge = () => window.AndroidBridge;
  let voices = [];
  function loadVoices() { if (window.speechSynthesis) voices = speechSynthesis.getVoices().filter((v) => /^de/i.test(v.lang)); return voices; }
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  const Speech = {
    canSpeak: () => !!(bridge() && bridge().speak) || !!window.speechSynthesis,
    canListen: () => !!(bridge() && bridge().listen) || !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    voices: () => loadVoices(),
    speak(text, rate) {
      const st = Store.get().settings; const r = rate || st.rate || 0.9;
      const t = String(text).replace(/<[^>]+>/g, "").replace(/_{2,}/g, " … ");
      if (bridge() && bridge().speak) { try { bridge().speak(t, r); return; } catch (e) { /* fall back */ } }
      if (!window.speechSynthesis) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "de-DE"; u.rate = r;
      const v = loadVoices().find((x) => x.name === st.voice) || loadVoices().find((x) => /de-DE/i.test(x.lang)) || loadVoices()[0];
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    },
    stop() { if (bridge() && bridge().stop) try { bridge().stop(); } catch (e) {} if (window.speechSynthesis) speechSynthesis.cancel(); },
    listen() {
      return new Promise((resolve, reject) => {
        if (bridge() && bridge().listen) {
          const id = "s" + Date.now();
          window.__stt = window.__stt || {};
          window.__stt[id] = { resolve, reject };
          try { bridge().listen(id); } catch (e) { reject(e); }
          return;
        }
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) return reject(new Error("Speech recognition isn't available in this browser. Use Chrome (Android/desktop) or the Android app."));
        const r = new SR(); r.lang = "de-DE"; r.interimResults = false; r.maxAlternatives = 3;
        let done = false;
        r.onresult = (e) => { done = true; resolve(Array.from(e.results[0]).map((x) => x.transcript)[0] || ""); };
        r.onerror = (e) => { if (!done) reject(new Error(e.error === "not-allowed" ? "Microphone permission was blocked. Allow it in the browser settings." : "Didn't catch that (" + e.error + "). Try again.")); };
        r.onend = () => { if (!done) reject(new Error("No speech detected. Tap the mic and speak right away.")); };
        r.start();
      });
    },
  };
  // callbacks from the Android wrapper
  window.__sttResult = (id, text) => { const p = window.__stt && window.__stt[id]; if (p) { p.resolve(text || ""); delete window.__stt[id]; } };
  window.__sttError = (id, msg) => { const p = window.__stt && window.__stt[id]; if (p) { p.reject(new Error(msg || "Speech recognition failed.")); delete window.__stt[id]; } };

  // ---------- helpers ----------
  const H = {
    esc: (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])),
    md: (s) => H.esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/__(.+?)__/g, "<i>$1</i>").replace(/_{3,}/g, '<span class="gap"></span>'),
    $: (sel, root = document) => root.querySelector(sel),
    $$: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    shuffle: (a) => Engine.R.shuffle(a),
    pick: (a) => Engine.R.pick(a),
    toast(msg, kind = "") {
      const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg;
      document.body.appendChild(t); setTimeout(() => t.classList.add("in"), 10);
      setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 2600);
    },
    genderClass(de) { const m = /^(der|die|das)\s/i.exec(de || ""); return m ? "g-" + { der: "m", die: "f", das: "n" }[m[1].toLowerCase()] : ""; },
    fmtDate: (t) => new Date(t).toLocaleDateString(),
  };

  window.Store = Store; window.SRS = SRS; window.Grade = { grade, clean, overlap, wordDiff, lev }; window.Speech = Speech; window.H = H;
})();
