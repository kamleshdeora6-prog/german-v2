/* Deutsch Coach – habit engine (v6).
   Everything that brings a learner back tomorrow, built on what learning research supports:
     · one clear next step instead of a menu (decision fatigue is the #1 reason people close an app);
     · a small daily goal the learner chose (commitment) and a visible "done for today" moment (closure);
     · a streak that forgives: freezes are earned every 7 days and used automatically, so one bad day
       never wipes out weeks of work (the "what-the-hell effect" is what makes people quit after a break);
     · daily quests that rotate (variable reward) and a combo for answers in a row (flow);
     · a friendly league between the profiles on this device (social proof without strangers);
     · a calendar reminder the learner sets once (implementation intention: "after X, at Y, I learn").
   No dark patterns: no fake urgency, no guilt messages, no paid anything. */
(function () {
  "use strict";
  const DAY = 864e5;
  const pad = (n) => String(n).padStart(2, "0");
  const dstr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dstr(new Date());
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return dstr(d); };

  /* ---------- levels ---------- */
  const TITLES = ["Anfänger", "Entdecker", "Wortsammler", "Satzbauer", "Fragensteller", "Grammatikfuchs", "Plaudertasche", "Leseratte", "Kenner", "Profi", "Redekünstler", "Meister", "Sprachgenie"];
  const need = (lv) => 40 * lv * lv;                    // total XP needed to reach level lv+1 … quadratic, so early levels come fast
  function level(xp) {
    let lv = 0; while (xp >= need(lv + 1)) lv++;
    const lo = need(lv), hi = need(lv + 1);
    return { n: lv + 1, title: TITLES[Math.min(lv, TITLES.length - 1)], into: xp - lo, span: hi - lo, pct: Math.round(((xp - lo) / (hi - lo)) * 100) };
  }

  /* ---------- daily quests ---------- */
  const QUESTS = [
    { k: "xp", t: (n) => `Earn ${n} XP`, n: [40, 60, 80], ic: "⚡" },
    { k: "right", t: (n) => `Get ${n} answers right`, n: [10, 15, 20], ic: "✓" },
    { k: "words", t: (n) => `Review ${n} words`, n: [10, 15, 20], ic: "🗂" },
    { k: "combo", t: (n) => `Get ${n} right in a row`, n: [5, 7, 10], ic: "🔥", max: true },
    { k: "part", t: (n) => `Finish ${n} lesson part${n > 1 ? "s" : ""}`, n: [1, 2, 3], ic: "📘" },
    { k: "speak", t: (n) => `Say ${n} sentence${n > 1 ? "s" : ""} out loud`, n: [1, 3, 5], ic: "🎙" },
    { k: "listen", t: (n) => `Do ${n} dictation${n > 1 ? "s" : ""}`, n: [1, 2, 3], ic: "🎧" },
    { k: "perfect", t: () => "Finish a round with 90 % or more", n: [1], ic: "🏅" },
  ];
  function seeded(seed) { let x = 0; for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296); }
  function questsFor(day, goal) {
    const r = seeded(day + (Store.profile() || {}).id);
    const pool = QUESTS.slice(); const out = [];
    // always one XP quest scaled to the learner's own goal, plus two random ones
    out.push({ k: "xp", t: QUESTS[0].t(Math.max(20, Math.round(goal * 1.2 / 10) * 10)), target: Math.max(20, Math.round(goal * 1.2 / 10) * 10), ic: "⚡" });
    pool.shift();
    while (out.length < 3) { const q = pool.splice(Math.floor(r() * pool.length), 1)[0]; const n = q.n[Math.floor(r() * q.n.length)]; out.push({ k: q.k, t: q.t(n), target: n, ic: q.ic, max: q.max }); }
    return out;
  }
  function qd() {
    const s = Store.get(); const d = today();
    if (!s.qd || s.qd.date !== d) s.qd = { date: d, c: {}, done: [], celebrated: false, quests: questsFor(d, s.settings.goal || 50) };
    return s.qd;
  }

  /* ---------- streak with freezes ---------- */
  function streakState() {
    const s = Store.get();
    s.streak = Object.assign({ count: 0, last: "", best: 0, freezes: 0, frozen: [], lost: 0 }, s.streak || {});
    // older versions stored UTC dates; that is fine, the difference is at most one day
    return s.streak;
  }
  /* Called on every activity day. Uses freezes for missed days, never punishes twice. */
  function touch() {
    const st = streakState(); const d = today();
    if (st.last === d) return null;
    let event = null;
    if (!st.last) { st.count = 1; }
    else {
      const gap = daysBetween(st.last, d);
      if (gap <= 0) { st.last = d; return null; }         // clock moved backwards – ignore
      if (gap === 1) st.count++;
      else if (gap - 1 <= st.freezes) {
        st.freezes -= gap - 1;
        for (let i = 1; i < gap; i++) st.frozen.push(addDays(st.last, i));
        st.frozen = st.frozen.slice(-30); st.count++;
        event = { kind: "frozen", used: gap - 1 };
      } else { st.lost = st.count; st.lostGap = gap - 1; st.count = 1; event = { kind: "reset", lost: st.lost, gap: gap - 1 }; }
    }
    st.last = d; st.best = Math.max(st.best || 0, st.count);
    if (st.count > 0 && st.count % 7 === 0 && st.freezes < 2) { st.freezes++; event = { kind: "earned" }; }
    return event;
  }
  /* What the streak looks like right now (before today's activity). At risk = not yet learned today. */
  function streakView() {
    const st = streakState(); const d = today();
    if (!st.last) return { count: 0, today: false, freezes: st.freezes, best: st.best || 0 };
    const gap = daysBetween(st.last, d);
    const alive = gap <= 1 + st.freezes;
    return { count: alive ? st.count : 0, today: gap === 0, freezes: st.freezes, best: st.best || 0, atRisk: gap === 1, willFreeze: gap > 1 && alive };
  }
  function week() {
    const s = Store.get(); const st = streakState(); const d = parse(today());
    const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const names = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];   // English initials: the week strip is for orientation
    return names.map((n, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); const k = dstr(x);
      return { n, k, xp: s.days[k] || 0, frozen: st.frozen.includes(k), today: k === today(), future: x > d }; });
  }

  /* ---------- combo + feedback ---------- */
  let combo = 0, sessionBest = 0; const queue = [];
  let audio = null;
  function tone(freqs, dur = 0.09) {
    const set = Store.get().settings; if (set.sound === false) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      let t = audio.currentTime;
      freqs.forEach((f) => { const o = audio.createOscillator(), g = audio.createGain(); o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(audio.destination); o.start(t); o.stop(t + dur + 0.02); t += dur * 0.8; });
    } catch (e) { /* no audio – fine */ }
  }
  const buzz = (p) => { try { if (Store.get().settings.haptics !== false && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };

  const Habit = (window.Habit = {
    today, level, week, streakView, daysBetween,
    /* an answer in any exercise; returns the combo so the UI can show it */
    answer(ok) {
      if (ok) { combo++; sessionBest = Math.max(sessionBest, combo); Habit.track("right"); Habit.track("combo", combo, true); tone(combo >= 5 ? [660, 880, 1175] : [660, 990]); buzz(12); }
      else { combo = 0; tone([220], 0.14); buzz([30, 40, 30]); }
      return { combo, bonus: ok && combo >= 5 ? 5 : ok && combo >= 3 ? 2 : 0 };
    },
    resetCombo() { combo = 0; sessionBest = 0; },
    flush() { const q = queue.splice(0); if (q.length) setTimeout(() => Habit.celebrate(q[q.length - 1][0], q.map((x) => x[1] || x[0]).join(" · ")), 400); },
    bestCombo: () => sessionBest,
    count: (k) => qd().c[k] || 0,   // how many of something today (cards, drills, dictations …) – the practice day ticks itself with these
    /* quest counters. max=true keeps the highest value instead of adding */
    track(k, n = 1, max = false) {
      const q = qd(); q.c[k] = max ? Math.max(q.c[k] || 0, n) : (q.c[k] || 0) + n;
      q.quests.forEach((x, i) => {
        if (q.done.includes(i) || (q.c[x.k] || 0) < x.target) return;
        q.done.push(i);
        const s = Store.get(); s.xp += 10; s.days[today()] = (s.days[today()] || 0) + 10;
        setTimeout(() => H.toast(`${x.ic} Quest done: ${x.t} · +10 XP`, "good"), 400);
        if (q.done.length === q.quests.length) {
          s.xp += 20; s.days[today()] += 20;
          setTimeout(() => Habit.celebrate("All three quests done!", "Your chest for today: +20 bonus XP."), 1200);
        }
      });
      Store.save();
    },
    quests() { const q = qd(); return q.quests.map((x, i) => ({ ...x, have: Math.min(x.target, q.c[x.k] || 0), done: q.done.includes(i) })); },
    /* XP hook from Store.addXP */
    onXP(n, before) {
      const s = Store.get(); const goal = s.settings.goal || 50; const now = s.days[today()] || 0;
      const ev = touch();
      if (ev && ev.kind === "earned") setTimeout(() => H.toast("❄️ 7 days in a row – you earned a streak freeze!", "good"), 600);
      if (ev && ev.kind === "frozen") setTimeout(() => H.toast(`❄️ A freeze saved your streak (${ev.used} day${ev.used > 1 ? "s" : ""}). Welcome back!`, "good"), 600);
      if (n > 0) Habit.track("xp", n);
      const q = qd();
      if (before < goal && now >= goal && !q.celebrated) { q.celebrated = true; Store.save(); setTimeout(() => Habit.celebrate("Tagesziel erreicht! (Daily goal reached)", `${goal} XP today · ${streakView().count}-day streak 🔥`), 700); }
      const lb = level(s.xp - n), la = level(s.xp);
      if (la.n > lb.n) setTimeout(() => Habit.celebrate(`Level ${la.n}: ${la.title}`, "New level reached. Weiter so!"), 1500);
    },
    /* the single most useful thing to do now */
    next() {
      const UNITS_I = (u) => (DC.starter || []).indexOf(u) + 1;
      const s = Store.get(); const V = window.Views;
      const due = SRS.due(V.vocabIds()).length;
      const L = DC.curriculum; const l = L.find((x) => !(s.lessons[x.n] && s.lessons[x.n].done)) || L[L.length - 1];
      const ls = Store.lesson(l.n); const parts = ls.parts || {};
      const PARTS = [["learn", "Learn the rule", 6], ["read", "Read the text", 4], ["practice", "Practise", 8], ["exam", "Exam questions", 6], ["speak", "Speak", 4]];
      const nextPart = PARTS.find(([k]) => !parts[k] && !(k === "practice" && ls.done));
      const sp = V.starterProgress && V.starterProgress();
      if (sp && s.starterMode && sp.next && !(s.lessons[L[0].n] && s.lessons[L[0].n].done)) return { go: `starter/u/${sp.next.id}`, label: `First steps: ${sp.next.en}`, sub: `Unit ${UNITS_I(sp.next)} of ${sp.total} · pictures & sound`, min: 4, kind: "starter" };
      if (due >= 12) return { go: "vocab/review", label: `Review ${due} words`, sub: "Words due today – 4 minutes", min: 4, kind: "words" };
      if (nextPart && Store.unlocked(l.n)) return { go: `lesson/${l.n}/${nextPart[0]}`, label: `${nextPart[1]}`, sub: `Lesson ${l.pos} · ${H.ltText(l)}`, min: nextPart[2], kind: "lesson", lesson: l };
      if (due > 0) return { go: "vocab/review", label: `Review ${due} words`, sub: "Words due today", min: 3, kind: "words" };
      return { go: "practice/smart", label: "Smart mix", sub: "10 questions on what you need most", min: 5, kind: "smart" };
    },
    markPart(n, part) {
      const ls = Store.lesson(n); ls.parts = ls.parts || {};
      if (ls.parts[part]) return; ls.parts[part] = Date.now(); Store.save(); Habit.track("part");
    },
    partsDone(n) { const ls = (Store.get().lessons[n] || {}); const p = ls.parts || {}; return ["learn", "read", "practice", "exam", "speak"].filter((k) => p[k] || (k === "practice" && ls.done)).length; },
    /* weekly XP for every profile on this device */
    league() {
      const d = parse(today()); const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const keys = []; for (let i = 0; i < 7; i++) { const x = new Date(mon); x.setDate(mon.getDate() + i); keys.push(dstr(x)); }
      return Store.profiles().map((p) => {
        let st = null;
        if (p.id === (Store.profile() || {}).id) st = Store.get();
        else try { st = JSON.parse(localStorage.getItem(p.id === "p1" ? "deutschcoach.v2" : "deutschcoach.v2." + p.id) || "null"); } catch (e) {}
        const xp = st && st.days ? keys.reduce((a, k) => a + (st.days[k] || 0), 0) : 0;
        return { name: p.name || "Unnamed", color: p.color, xp, me: p.id === (Store.profile() || {}).id };
      }).sort((a, b) => b.xp - a.xp);
    },
    /* a full-screen moment of success */
    celebrate(title, sub = "") {
      // never interrupt a question: wait for the end-of-round screen
      if ((document.querySelector(".session .sess-body .q") || document.querySelector(".st-sess")) && !document.querySelector(".summary")) { queue.push([title, sub]); return; }   // also First steps rounds
      // working on a list of exercises or an answer (lesson practice, exam, writing): never block the screen – a banner instead
      if (document.querySelector("#view .q-in, #view textarea, #view .tasks")) { tone([523, 659, 784], 0.1); H.toast(`🎉 ${title}${sub ? " · " + sub : ""}`, "good"); return; }
      document.querySelectorAll(".celebrate").forEach((x) => x.remove());
      const d = document.createElement("div"); d.className = "celebrate"; d.setAttribute("role", "status");
      d.innerHTML = `<div class="cel-card"><div class="cel-burst">🎉</div><h2>${H.esc(title)}</h2>${sub ? `<p>${H.esc(sub)}</p>` : ""}<button class="btn sign">Continue</button></div>`;
      document.body.appendChild(d); confetti(d);
      tone([523, 659, 784, 1047], 0.12); buzz([20, 40, 20, 40, 60]);
      const close = () => d.remove();
      d.querySelector("button").onclick = close; d.onclick = (e) => { if (e.target === d) close(); };
      setTimeout(() => d.querySelector("button").focus(), 50);
    },
    /* calendar reminder: one recurring event, the learner's own calendar does the notifying */
    reminderICS(time = "19:00", minutes = 10) {
      const [h, m] = time.split(":").map(Number);
      const start = new Date(); start.setHours(h, m, 0, 0); if (start < new Date()) start.setDate(start.getDate() + 1);
      const f = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
      const end = new Date(start.getTime() + minutes * 60e3);
      const url = location.href.split("#")[0] + "#/home";
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Zombieland//Deutsch Coach//EN", "BEGIN:VEVENT", `UID:dc-${Date.now()}@deutsch-coach`, `DTSTAMP:${f(new Date())}`,
        `DTSTART:${f(start)}`, `DTEND:${f(end)}`, "RRULE:FREQ=DAILY", "SUMMARY:🇩🇪 Deutsch Coach – " + minutes + " Minuten", `DESCRIPTION:Keep your streak alive. Open: ${url}`, `URL:${url}`,
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Zeit für Deutsch!", "TRIGGER:PT0M", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "deutsch-coach-reminder.ics";
      document.body.appendChild(a); a.click(); a.remove();
      const s = Store.get(); s.settings.reminder = time; Store.save();
    },
  });

  function confetti(host) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#FFB020", "#FF6B4A", "#2F6FED", "#1FA971", "#8B5CF6", "#E5484D"];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement("i"); p.className = "cf";
      p.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.3}s;animation-duration:${1.6 + Math.random() * 1.2}s;transform:rotate(${Math.random() * 360}deg)`;
      host.appendChild(p);
    }
  }
  /* SVG ring used on the start screen and in summaries */
  Habit.ring = (pct, size = 120, stroke = 12, inner = "") => {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.min(1, pct / 100));
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="ring-bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}" class="ring-fg ${pct >= 100 ? "full" : ""}" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg><div class="ring-in">${inner}</div></div>`;
  };
})();
