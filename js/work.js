/* Deutsch Coach – study minutes (7.3).
   Two numbers per day:
   · work  = what you got done, in minutes it is *worth* (a lesson part = 20 min even if you knew it and needed 5,
             a drill question = ½ min, a flashcard = ¼ min, a dictation sentence = 1 min, a written answer = 2 min …);
   · time  = real active time in the app (counted only while the app is open, visible and you touched it in the last minute).
   The daily target is your plan's minutes (or Settings). Days add up against the plan: a 3-hour day puts you ahead,
   a 60-minute day uses some of that lead – "60 min ahead of plan". The streak stays easy: any real practice keeps it. */
(function () {
  "use strict";
  const st = () => Store.get();
  const PART = { learn: 12, read: 10, practice: 20, exam: 15, speak: 10 };
  const TRACK = { drill: 0.5, words: 0.25, listen: 1, speak: 1.5, read: 2, write: 5, exam: 12, partner: 1, starter: 0.5 };
  const today = () => Store.today();
  const day = (d = today()) => { const s = st(); s.work = s.work || {}; return (s.work[d] = s.work[d] || { m: 0, t: 0, k: {} }); };
  const r1 = (x) => Math.round(x * 10) / 10;

  const Work = (window.Work = {
    PART, TRACK,
    /* the daily target in minutes */
    target() {
      const s = st();
      return Math.max(5, +s.settings.minutesGoal || (s.plan && s.plan.minutes) || ({ 20: 10, 50: 20, 100: 30, 150: 45 }[s.settings.goal] || 20));
    },
    /* add work worth `mins` (optionally under a key, e.g. "L4:practice", so a finished part can be topped up to its worth) */
    add(mins, key) {
      if (!(mins > 0)) return;
      const d = day(); const before = d.m;
      d.m = r1(d.m + mins);
      if (!key) { const m = /^#\/lesson\/(\d+)\/(learn|read|practice|exam|speak)/.exec(location.hash || ""); if (m) key = `L${m[1]}:${m[2]}`; }
      if (key) d.k[key] = r1((d.k[key] || 0) + mins);
      const s = st(); if (!s.workStart) s.workStart = today();
      Store.save();
      const T = Work.target();
      if (before < T && d.m >= T && !d.celebrated) { d.celebrated = true; Store.save(); if (window.Habit) setTimeout(() => Habit.celebrate("Tagesziel erreicht! (Daily goal reached)", `${Math.round(d.m)} min of work today 🔥`), 600); }
      Work.paint();
    },
    /* a lesson part is finished: it counts its full worth, minus what its exercises already added today */
    part(n, part) {
      const worth = PART[part] || 10, key = `L${n}:${part}`, d = day();
      const have = d.k[key] || 0;
      if (have < worth) Work.add(worth - have, key);
    },
    done: (d) => (st().work && st().work[d || today()] ? st().work[d || today()].m : 0),
    time: (d) => Math.round(((st().work && st().work[d || today()]) || { t: 0 }).t / 60),
    /* ahead (+) or behind (−) the plan: every day since you started counts its target, today included */
    balance() {
      const s = st(), T = Work.target(); const start = s.workStart || today();
      let bal = 0; const d = new Date(start + "T12:00:00"); const end = new Date(today() + "T12:00:00");
      for (let i = 0; d <= end && i < 400; i++, d.setDate(d.getDate() + 1)) {
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        bal += ((s.work || {})[k] ? s.work[k].m : 0) - T;
      }
      return Math.round(bal);
    },
    /* "covered by your lead": today isn't at the target yet, but earlier days make up for it */
    covered() { return Work.done() < Work.target() && Work.balance() >= 0; },
    met: (d) => Work.done(d) >= Work.target(),
    fmt(m) { m = Math.round(Math.abs(m)); return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}` : `${m} min`; },
    /* one line for Home and Today */
    summary() {
      const T = Work.target(), m = Math.round(Work.done()), left = Math.max(0, T - m), bal = Work.balance();
      return { T, m, left, bal, time: Work.time(),
        line: `${m} of ${T} min of work${left ? ` · ${Work.fmt(left)} left` : " · ✓ goal reached"}`,
        balLine: bal > 0 ? `${Work.fmt(bal)} ahead of plan` : bal < 0 ? `${Work.fmt(bal)} behind plan` : "exactly on plan" };
    },
    /* live numbers in any element with [data-work] */
    paint() {
      const s = Work.summary();
      document.querySelectorAll("[data-work]").forEach((el) => {
        const k = el.dataset.work;
        el.textContent = k === "line" ? s.line : k === "bal" ? s.balLine : k === "time" ? `⏱ ${Work.fmt(s.time)} studied today` : k === "m" ? s.m : k === "left" ? Work.fmt(s.left) : "";
        if (k === "bal") el.className = el.className.replace(/\b(ahead|behind)\b/g, "") + (s.bal >= 0 ? " ahead" : " behind");
      });
    },
  });

  /* every Habit.track("drill"/"words"/…) is work of a known size */
  const hookHabit = () => {
    if (!window.Habit || Habit._work) return;
    Habit._work = true;
    const t = Habit.track; Habit.track = function (k, n = 1, max) { const r = t.apply(this, arguments); if (TRACK[k] && !max) Work.add(TRACK[k] * (n || 1)); return r; };
    const mp = Habit.markPart; Habit.markPart = function (n, part) { const had = ((Store.lesson(n).parts || {})[part]); const r = mp.apply(this, arguments); if (!had) Work.part(n, part); return r; };
  };
  if (window.Habit) hookHabit(); else document.addEventListener("DOMContentLoaded", hookHabit);

  /* real active time: counted in 15-second ticks while the app is visible and you used it in the last minute */
  let lastInput = Date.now();
  ["pointerdown", "keydown", "touchstart", "scroll"].forEach((e) => addEventListener(e, () => (lastInput = Date.now()), { passive: true, capture: true }));
  setInterval(() => {
    if (document.hidden || Date.now() - lastInput > 60e3 || !window.Store) return;
    try { const d = day(); d.t = (d.t || 0) + 15; if (d.t % 60 === 0) { Store.save(); Work.paint(); } } catch (e) { /* storage not ready */ }
  }, 15e3);
})();
