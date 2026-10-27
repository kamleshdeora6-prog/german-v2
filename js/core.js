/* Deutsch Coach – core services: progress store, spaced repetition, grading, speech. */
(function () {
  "use strict";
  const LAB = window.EDITION === "lab";          // the lab edition keeps its own, separate progress
  const KEY = LAB ? "deutschcoach.lab.v2" : "deutschcoach.v2";                 // storage of the first profile (keeps old progress)
  const PKEY = LAB ? "deutschcoach.lab.profiles" : "deutschcoach.profiles";    // { active, list: [{ id, name, color, created }] }
  const COLORS = ["#E3A400", "#1D8F4E", "#2465B4", "#7C3F98", "#C2571A", "#0F7B8A", "#8A1C3F", "#5B6770"];
  let profiles = null;
  function loadProfiles() {
    try { profiles = JSON.parse(localStorage.getItem(PKEY) || "null"); } catch (e) { profiles = null; }
    if (!profiles || !Array.isArray(profiles.list) || !profiles.list.length) {
      profiles = { active: "p1", list: [{ id: "p1", name: "", color: COLORS[0], created: Date.now() }] };
      writeProfiles();
    }
    if (!profiles.list.some((p) => p.id === profiles.active)) profiles.active = profiles.list[0].id;
    return profiles;
  }
  function writeProfiles() { try { localStorage.setItem(PKEY, JSON.stringify(profiles)); } catch (e) {} }
  const keyOf = (id) => (id === "p1" ? KEY : KEY + "." + id);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };   // local day, not UTC: a streak must follow the learner's clock
  const DEFAULTS = () => ({
    v: 2, created: Date.now(), xp: 0, streak: { count: 0, last: "" }, days: {},
    lessons: {}, topics: {}, srs: {}, chat: [], exams: [], mistakes: [],
    settings: { theme: "auto", rate: 0.9, voice: "", goal: 50, sound: true, haptics: true, tone: "neutral", labels: "both", textSize: "m", unlockAll: false, showEn: true, aiProvider: "local", llmModel: "1b", aiOnline: true, aiKey: "", aiModel: "claude-haiku-5-5", asr: "auto", onboarded: false },
  });

  let state = null;
  const listeners = new Set();
  function load() {
    try {
      const pid = (profiles || loadProfiles()).active;
      const raw = localStorage.getItem(keyOf(pid)) || (pid === "p1" && !LAB ? localStorage.getItem("germanCoachProgress") : null);
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
    const k = keyOf((profiles || loadProfiles()).active), snap = state;
    saveT = setTimeout(() => { try { localStorage.setItem(k, JSON.stringify(snap)); } catch (e) { console.warn("save failed", e); } }, 150);
    listeners.forEach((f) => f(state));
  }
  function flush() { clearTimeout(saveT); if (state) try { localStorage.setItem(keyOf(profiles.active), JSON.stringify(state)); } catch (e) {} }
  /* Course order. A lesson's number n is its permanent ID; pos is its place in the course. */
  const CL = () => (window.DC && DC.curriculum) || [];
  const Course = (window.Course = {
    byN: (n) => CL().find((l) => l.n === +n),
    pos: (n) => { const l = Course.byN(n); return l ? l.pos || CL().indexOf(l) + 1 : 0; },
    prev: (n) => { const i = CL().findIndex((l) => l.n === +n); return i > 0 ? CL()[i - 1] : null; },
    next: (n) => { const i = CL().findIndex((l) => l.n === +n); return i >= 0 && i < CL().length - 1 ? CL()[i + 1] : null; },
    first: (lv) => CL().find((l) => l.level === lv),
    last: (lv) => CL().filter((l) => l.level === lv).pop(),
    before: (a, b) => Course.pos(a) < Course.pos(b),
  });
  const Store = {
    get: () => state || load(),
    /* ----- local profiles: every learner on this device gets separate progress ----- */
    profiles: () => (profiles || loadProfiles()).list.slice(),
    profile: () => { const P = profiles || loadProfiles(); return P.list.find((p) => p.id === P.active); },
    name: () => (Store.profile() || {}).name || "",
    setName(name) { const p = Store.profile(); p.name = String(name).trim().slice(0, 30); writeProfiles(); listeners.forEach((f) => f(state)); },
    switchTo(id) {
      const P = profiles || loadProfiles();
      if (!P.list.some((p) => p.id === id) || id === P.active) return;
      flush(); P.active = id; writeProfiles(); state = null; load(); listeners.forEach((f) => f(state));
    },
    addProfile(name) {
      const P = profiles || loadProfiles();
      const id = "p" + Date.now().toString(36);
      P.list.push({ id, name: String(name || "").trim().slice(0, 30), color: COLORS[P.list.length % COLORS.length], created: Date.now() });
      writeProfiles(); Store.switchTo(id); return id;
    },
    deleteProfile(id) {
      const P = profiles || loadProfiles();
      if (P.list.length < 2) return false;
      if (id === P.active) { flush(); const other = P.list.find((p) => p.id !== id); P.active = other.id; state = null; }
      P.list = P.list.filter((p) => p.id !== id); writeProfiles();
      try { localStorage.removeItem(keyOf(id)); } catch (e) {}
      if (!state) load(); listeners.forEach((f) => f(state)); return true;
    },
    save,
    on: (f) => listeners.add(f),
    addXP(n) {
      const s = Store.get(); const d = today(); const before = s.days[d] || 0;
      s.xp += n; s.days[d] = before + n;
      if (window.Habit) Habit.onXP(n, before);       // streak (with freezes), quests, goal and level celebrations
      else if (s.streak.last !== d) { s.streak.count = (s.streak.count || 0) + 1; s.streak.last = d; }
      save();
    },
    topic(id, ok) {
      if (!id) return;
      const t = (Store.get().topics[id] = Store.get().topics[id] || { r: 0, w: 0, recent: [] });
      ok ? t.r++ : t.w++;
      t.recent = (t.recent || []).concat(ok ? 1 : 0).slice(-12);
      save();
    },
    /* lab only: copy the stable app's progress (same site) into the lab – the stable app is not touched */
    hasStable() { try { return LAB && !!localStorage.getItem("deutschcoach.v2"); } catch (e) { return false; } },
    importStable() {
      if (!LAB) return false;
      const raw = localStorage.getItem("deutschcoach.v2"); if (!raw) return false;
      const keep = state && state.settings ? { aiProvider: state.settings.aiProvider, llmModel: state.settings.llmModel, llmReady: state.settings.llmReady, llmTest: state.settings.llmTest, partnerMode: state.settings.partnerMode } : {};
      const d = deepMerge(DEFAULTS(), JSON.parse(raw)); d.settings.aiKey = ""; Object.keys(keep).forEach((k) => keep[k] !== undefined && (d.settings[k] = keep[k]));
      try { const sp = JSON.parse(localStorage.getItem("deutschcoach.profiles") || "null"); const p1 = sp && sp.list && sp.list.find((x) => x.id === "p1"); const me = profiles.list.find((x) => x.id === profiles.active); if (p1 && p1.name && me && !me.name) { me.name = p1.name; writeProfiles(); } } catch (e) {}
      state = d; flush(); listeners.forEach((f) => { try { f(state); } catch (e) {} }); return true;
    },
    mistake(m) { const s = Store.get(); s.mistakes.unshift(Object.assign({ t: Date.now() }, m)); s.mistakes = s.mistakes.slice(0, 120); save(); },
    lesson(n) { const s = Store.get(); return (s.lessons[n] = s.lessons[n] || { read: false, score: 0, done: false, tasks: {}, exam: {} }); },
    unlocked(n) { const s = Store.get(); const p = Course.prev(n); return s.settings.unlockAll || !p || !!(s.lessons[p.n] && s.lessons[p.n].done); },
    export() { const s = Store.get(); return JSON.stringify(Object.assign({}, s, { profileName: Store.name(), settings: Object.assign({}, s.settings, { aiKey: "" }) }), null, 1); },   // the API key never goes into a backup file
    import(txt) { const d = JSON.parse(txt); if (!d || typeof d !== "object" || !("xp" in d)) throw new Error("This file is not a Deutsch Coach backup."); const nm = d.profileName; delete d.profileName; const key = (state && state.settings && state.settings.aiKey) || ""; state = deepMerge(DEFAULTS(), d); if (!state.settings.aiKey) state.settings.aiKey = key; if (nm && !Store.name()) Store.setName(nm); save(); },
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
  /* ---------- audio player ----------
     Text is split into sentences and spoken one at a time, so the learner can pause, stop,
     jump back a sentence ("let me hear that again"), skip ahead and change speed while listening.
     A generation counter makes every old callback harmless: tapping Play twice, leaving the screen
     or starting another text can never leave a second voice running in the background. */
  const splitSentences = (t) => String(t).replace(/<[^>]+>/g, "").replace(/_{2,}/g, " … ").replace(/\s+/g, " ").trim()
    .split(/(?<=[.!?…:;])\s+(?=[„"A-ZÄÖÜ0-9–-])/).map((x) => x.trim()).filter(Boolean);
  const P = { list: [], i: 0, state: "idle", rate: null, gen: 0, key: "", started: 0, timer: null };
  const subs = new Set();
  const emit = () => subs.forEach((f) => { try { f(Speech.status()); } catch (e) {} });
  function sayOne(text, rate, done, pitch) {
    const g = P.gen;
    const end = () => { if (g === P.gen) done(); };
    if (bridge() && bridge().speak) {
      try { bridge().stop && bridge().stop(); bridge().speak(text, rate); } catch (e) {}
      // iOS reports the real end (window.__ttsDone); Android doesn't, so estimate it (about 14 characters a second at rate 1)
      P.bridgeEnd = end;
      const est = bridge().hasEndEvent ? 3000 + (text.length * 200) / rate : 500 + (text.length * 72) / rate;
      clearTimeout(P.timer); P.timer = setTimeout(end, est);
      return;
    }
    if (!window.speechSynthesis) return end();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const st = Store.get().settings;
    u.lang = "de-DE"; u.rate = rate; if (pitch) u.pitch = pitch;
    const v = loadVoices().find((x) => x.name === st.voice) || loadVoices().find((x) => /de-DE/i.test(x.lang)) || loadVoices()[0];
    if (v) u.voice = v;
    u.onend = end; u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") end(); };
    // safety net: some browsers never fire onend
    clearTimeout(P.timer); P.timer = setTimeout(end, 4000 + (text.length * 160) / rate);
    speechSynthesis.speak(u);
  }
  function playCurrent() {
    P.gen++; clearTimeout(P.timer);
    if (P.i >= P.list.length) { P.state = "idle"; P.gen++; emit(); return; }
    P.state = "playing"; P.started = Date.now(); emit();
    sayOne(P.list[P.i], P.rate || Store.get().settings.rate || 0.9, () => { P.i++; playCurrent(); }, P.pitches && P.pitches[P.i]);
  }
  function hardStop() { P.gen++; clearTimeout(P.timer); if (bridge() && bridge().stop) try { bridge().stop(); } catch (e) {} if (window.speechSynthesis) speechSynthesis.cancel(); }
  const Speech = {
    canSpeak: () => !!(bridge() && bridge().speak) || !!window.speechSynthesis,
    canListen: () => !!(bridge() && bridge().listen) || !!(window.SpeechRecognition || window.webkitSpeechRecognition) || !!(window.ASR && ASR.supported()),
    voices: () => loadVoices(),
    split: splitSentences,
    /* speak(text) – a text of any length; play(list) – a list of sentences (e.g. "Play all") */
    speak(text, rate) { Speech.play(splitSentences(text), { rate, key: String(text) }); },
    play(list, { rate, key, start = 0, locked = false, pitches = null } = {}) {
      hardStop();
      P.list = (list || []).map(String).filter((x) => x.trim()); P.i = Math.max(0, Math.min(start, P.list.length - 1)); P.rate = rate || null; P.key = key || P.list.join(" "); P.locked = !!locked; P.pitches = pitches;
      if (!P.list.length) { P.state = "idle"; emit(); return; }
      playCurrent();
    },
    pause() { if (P.state !== "playing") return; P.elapsed = Date.now() - P.started; hardStop(); P.state = "paused"; emit(); },
    resume() { if (P.state === "paused") playCurrent(); },
    toggle() { P.state === "playing" ? Speech.pause() : P.state === "paused" ? Speech.resume() : null; },
    /* like a music player: within the first 2 s go to the previous sentence, otherwise restart this one */
    back() { if (!P.list.length) return; const into = P.state === "playing" ? Date.now() - P.started : P.state === "paused" ? P.elapsed : 0; const deep = into > 2000; if (!deep) P.i = Math.max(0, Math.min(P.i, P.list.length) - 1); playCurrent(); },
    next() { if (!P.list.length) return; if (P.i < P.list.length - 1) { P.i++; playCurrent(); } else Speech.stop(); },
    setRate(r) { P.rate = r; if (P.state === "playing") playCurrent(); else emit(); },
    stop() { hardStop(); P.state = "idle"; P.list = []; P.i = 0; P.key = ""; emit(); },
    isPlaying: (key) => P.state !== "idle" && (!key || P.key === String(key)),
    status: () => ({ locked: P.locked, state: P.state, i: P.i, n: P.list.length, text: P.list[P.i] || "", key: P.key, rate: P.rate || Store.get().settings.rate || 0.9 }),
    onChange: (f) => subs.add(f),
    /* opts: { onStage, onLevel, stopSignal } – used by Whisper (recording, then transcribing) */
    async listen(opts = {}) {
      if (!(bridge() && bridge().listen) && window.ASR && ASR.active()) {
        try { return await ASR.listen(opts); }
        catch (e) {
          if (/Microphone|didn't hear/i.test(e.message) || !(window.SpeechRecognition || window.webkitSpeechRecognition)) throw e;
          H.toast("Offline recognition had a problem – using the browser's recognition instead.");
        }
      }
      return Speech.listenBrowser();
    },
    listenBrowser() {
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
  window.__ttsDone = () => { const f = P.bridgeEnd; P.bridgeEnd = null; if (f) setTimeout(f, 120); };
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
      // toasts stack in one column instead of covering each other
      let box = document.querySelector(".toasts"); if (!box) { box = document.createElement("div"); box.className = "toasts"; document.body.appendChild(box); }
      if (box.children.length >= 3) box.firstElementChild.remove();
      const t = document.createElement("div"); t.className = "toast " + kind; t.textContent = msg;
      box.appendChild(t); setTimeout(() => t.classList.add("in"), 10);
      setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 300); }, 2600 + box.children.length * 600);
    },
    genderClass(de) { const m = /^(der|die|das)\s/i.exec(de || ""); return m ? "g-" + { der: "m", die: "f", das: "n" }[m[1].toLowerCase()] : ""; },
    fmtDate: (t) => new Date(t).toLocaleDateString(),
    /* bilingual label: German word + English help underneath (Settings → Menu language) */
    bi: (de, en, cls = "") => `<span class="bi ${cls}"><span class="de-l">${de}</span><span class="en-l">${en}</span></span>`,
    /* lesson text in the chosen menu language (Settings → Menu language): German, English, or both */
    lt: (l, k = "title") => { const de = H.esc(l[k] || ""), en = H.esc((l.en && l.en[k]) || l[k] || ""); return de === en ? de : H.bi(de, en); },
    ltText: (l, k = "title") => { const lab = (Store.get().settings.labels || "both"); return lab === "en" && l.en && l.en[k] ? l.en[k] : l[k] || ""; },
    lexpl: (l) => {
      const de = (l.expl || []).map((p) => `<p>${H.md(p)}</p>`).join("") + (l.use ? `<p class="use"><b>When do I use it?</b> ${H.md(l.use)}</p>` : "");
      if (!l.en || !l.en.expl.length) return de;
      const en = l.en.expl.map((p) => `<p>${H.md(p)}</p>`).join("") + (l.en.use ? `<p class="use"><b>When do I use it?</b> ${H.md(l.en.use)}</p>` : "");
      return `<div class="x-de">${de}</div><details class="x-en-fold"><summary>🇬🇧 Explanation in English</summary>${en}</details>
        <div class="x-en">${en}</div><details class="x-de-fold"><summary>🇩🇪 The same in German</summary>${de}</details>`;
    },
  };

  window.addEventListener("pagehide", flush);
  window.Store = Store; window.SRS = SRS; window.Grade = { grade, clean, overlap, wordDiff, lev }; window.Speech = Speech; window.H = H;
})();
