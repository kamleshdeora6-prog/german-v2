/* Deutsch Coach – Einstufungstest, Lernplan, Übungstag, Schwachstellen, Auffrischung.
   Frau Weber comments on plans, streaks and repeated mistakes (js/weber.js). */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const START_LESSON = { A1: 1, A2: 13, B1: 25, B2: 43, C1: 51, C2: 57 };
  const LAST_LESSON = { A1: 12, A2: 24, B1: 42, B2: 50, C1: 56, C2: 60 };
  const STAGE_LEVEL = { 1: "A1", 2: "A1", 3: "A2", 4: "A2", 5: "B1", 6: "B1", 7: "B2", 8: "B2", 9: "C1", 10: "C1", 11: "C2", 12: "C2" };
  const day = 864e5;

  /* ============ 1. Einstufungstest (rule knowledge, staged, with a stop rule) ============ */
  V.placement = (el, [mode]) => {
    if (mode !== "go") {
      const last = Store.get().placement;
      el.innerHTML = `<h2 class="page-title">Placement test</h2>
        <section class="card"><p>Eight questions per stage, twelve stages, from “Ich ___ Ravi” to the subtleties of C2. Each question tests one rule – no writing, no transformation, just: do you know it?</p>
        <ul class="plain small">
          <li>It <b>adapts</b>: pass a stage and it gets harder, fail one and it stops.</li>
          <li>Answer honestly. <b>“I don't know”</b> is a real answer here and keeps the result clean.</li>
          <li>Takes 10–20 minutes. At the end: your level, your sub-level, and the topics to fix first.</li>
        </ul>
        ${last ? `<p class="muted small">Last result: <b>${esc(last.level)}${last.sub ? "." + last.sub : ""}</b> on ${new Date(last.date).toLocaleDateString()}.</p>` : ""}
        <div class="row"><button class="btn sign" data-go="placement/go">Start the test</button><button class="btn ghost" data-go="refresh">I learnt before and forgot it</button></div></section>
        ${Weber.html("shortcut", { topic: "Dativ" }, "quiet")}`;
      return;
    }
    const bank = DC.placement;
    let stage = 3, asked = [], stageRight = 0, stageAsked = 0, done = false;
    const log = [];
    const wrap = document.createElement("div"); el.innerHTML = `<h2 class="page-title">Placement test</h2>`; el.appendChild(wrap);

    const nextItem = () => {
      const pool = bank.filter((i) => i.s === stage && !asked.includes(i));
      if (!pool.length) return null;
      const it = H.pick(pool); asked.push(it); return it;
    };
    const step = () => {
      if (done) return;
      const it = nextItem();
      if (!it) { stage++; stageRight = 0; stageAsked = 0; return stage > 12 ? finish() : step(); }
      const opts = H.shuffle(it.o.map((text, i) => ({ text, ok: i === it.a })));
      wrap.innerHTML = `<div class="sess-head"><span class="sess-title">Stage ${stage} of 12 · ${UI.levelDot(STAGE_LEVEL[stage])}</span><span class="muted small">${log.length + 1}. Frage</span></div>
        <div class="pbar"><span style="width:${((stage - 1) / 12) * 100}%"></span></div>
        <section class="card"><p class="qtext">${esc(it.q).replace(/___/g, "<b>___</b>")}</p>
          <div class="choices">${opts.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.text)}</button>`).join("")}</div>
          <div class="row"><button class="btn ghost sm dunno">I don't know</button></div></section>`;
      const answer = (ok, chosen) => {
        log.push({ t: it.t, s: stage, ok });
        stageAsked++; if (ok) stageRight++;
        wrap.querySelectorAll(".choice").forEach((b, i) => { b.disabled = true; if (opts[i].ok) b.classList.add("right"); else if (i === chosen) b.classList.add("wrong"); });
        setTimeout(() => {
          if (stageAsked >= 4) {
            if (stageRight >= 3) { stage++; stageRight = 0; stageAsked = 0; if (stage > 12) return finish(); }
            else if (stageRight <= 1) return finish();          // stop rule: clearly out of depth
            else { stage = Math.max(1, stage - 1); stageRight = 0; stageAsked = 0; }
          }
          step();
        }, ok ? 260 : 700);
      };
      wrap.querySelectorAll(".choice").forEach((b, i) => (b.onclick = () => answer(opts[i].ok, i)));
      wrap.querySelector(".dunno").onclick = () => answer(false, -1);
    };

    const finish = () => {
      done = true;
      const byStage = {};
      log.forEach((r) => { const b = (byStage[r.s] = byStage[r.s] || { n: 0, ok: 0 }); b.n++; if (r.ok) b.ok++; });
      let top = 1;
      Object.keys(byStage).map(Number).sort((a, b) => a - b).forEach((st) => { const b = byStage[st]; if (b.n >= 2 && b.ok / b.n >= 0.6) top = st; });
      const level = STAGE_LEVEL[top];
      const sub = top % 2 === 0 ? 2 : 1;                      // stage 5 = B1.1, stage 6 = B1.2
      const weakCount = {};
      log.filter((r) => !r.ok).forEach((r) => (weakCount[r.t] = (weakCount[r.t] || 0) + 1));
      const weak = Object.entries(weakCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
      const start = sub === 2 ? Math.min(LAST_LESSON[level], START_LESSON[level] + Math.ceil((LAST_LESSON[level] - START_LESSON[level]) / 2)) : START_LESSON[level];
      const s = Store.get();
      s.placement = { date: Date.now(), level, sub, start, weak, right: log.filter((r) => r.ok).length, total: log.length };
      s.weakTopics = weak; Store.save();
      const wrong = log.filter((r) => !r.ok).length;
      wrap.innerHTML = `<section class="card result lvl-${level}">
          <p class="muted">${log.length - wrong}/${log.length} correct · you stopped in stage ${top}</p>
          <p class="big">Your level: ${UI.levelDot(level)} <b>${level}.${sub}</b></p>
          <p>Start at <b>lesson ${start}</b>. Everything before it stays open for review.</p>
          ${weak.length ? `<p><b>Fix these first:</b></p><div class="chips">${weak.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
          <div class="row"><button class="btn sign plan">Make a plan from here</button><button class="btn ghost setl">Start at lesson ${start}</button><button class="btn ghost" data-go="placement/go">Test again</button></div>
        </section>
        ${Weber.html(wrong > log.length / 2 ? "rough" : "stakes", {})}
        <section class="card"><h3>What you got wrong</h3><ul class="plain small">${log.filter((r) => !r.ok).map((r) => { const it = asked.find((x) => x.t === r.t); return it ? `<li><b>${esc(it.t)}:</b> ${esc(it.w)}</li>` : ""; }).join("") || "<li>Nothing – you answered everything correctly up to where you stopped.</li>"}</ul></section>`;
      wrap.querySelector(".plan").onclick = () => App.go("plan");
      wrap.querySelector(".setl").onclick = () => {
        const st = Store.get();
        for (let n = 1; n < start; n++) { const L = Store.lesson(n); if (!L.done) { L.done = true; L.score = Math.max(L.score || 0, 70); L.placed = true; } }
        Store.save(); App.dropCache(); App.go("lesson/" + start);
      };
    };
    step();
  };

  /* ============ 2. Lernplan ============ */
  const planMath = (fromLesson, level, days) => {
    const target = LAST_LESSON[level];
    const lessons = Math.max(1, target - fromLesson + 1);
    const hoursNeeded = Math.round(lessons * 2.2);                 // ≈ 2.2 h per lesson incl. review
    const perDay = lessons / Math.max(1, days);
    const covered = LEVELS.slice(0, LEVELS.indexOf(level) + 1).filter((lv) => LAST_LESSON[lv] >= fromLesson);
    const wordPool = DC.vocab.filter((v) => covered.includes(v.level)).length * (lessons / Math.max(1, LAST_LESSON[level] - START_LESSON[covered[0] || level] + 1));
    return { target, lessons, hoursNeeded, perDay, minutes: Math.round((hoursNeeded * 60) / Math.max(1, days)),
             words: Math.max(8, Math.round(wordPool / Math.max(1, days))) };
  };
  const activePlan = () => Store.get().plan || null;

  V.plan = (el, [act]) => {
    const s = Store.get();
    const p = activePlan();
    if (act === "clear") { delete s.plan; Store.save(); return App.go("plan"); }
    if (p && act !== "new") return renderPlan(el, p);
    const done = DC.curriculum.filter((l) => Store.lesson(l.n).done).length;
    const from = Math.min(DC.curriculum.length, done + 1);
    el.innerHTML = `<h2 class="page-title">Your plan</h2>
      <section class="card"><p>Learning five topics in order beats ten at random: German builds on itself. Tell me the goal and the date, and you get one thing to do each day – no menu, no choosing.</p>
        <label>Goal <select class="goal">${LEVELS.map((l) => `<option ${l === (s.placement ? nextLevel(s.placement.level) : "B1") ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <label>Start from lesson <input class="from" type="number" min="1" max="${DC.curriculum.length}" value="${from}"></label>
        <fieldset class="seg2"><legend>How do you want to set the pace?</legend>
          <label><input type="radio" name="mode" value="date" checked> By a date</label>
          <label><input type="radio" name="mode" value="time"> By minutes per day</label></fieldset>
        <label class="byDate">Target date <input class="date" type="date" value="${new Date(Date.now() + 120 * day).toISOString().slice(0, 10)}"></label>
        <label class="byTime" hidden>Minutes per day <input class="mins" type="number" min="5" max="300" step="5" value="45"></label>
        <label>Days off per week <input class="off" type="number" min="0" max="3" value="1"></label>
        <div class="row"><button class="btn sign go">Check this plan</button>${p ? '<button class="btn ghost" data-go="plan">Back to my plan</button>' : ""}</div>
        <div class="verdict"></div></section>`;
    const $ = (q) => el.querySelector(q);
    el.querySelectorAll("[name=mode]").forEach((r) => (r.onchange = () => { $(".byDate").hidden = r.value !== "date"; $(".byTime").hidden = r.value !== "time"; }));
    $(".go").onclick = () => {
      const level = $(".goal").value, from2 = Math.max(1, Math.min(DC.curriculum.length, +$(".from").value || 1));
      const off = Math.max(0, Math.min(3, +$(".off").value || 0));
      const byDate = el.querySelector("[name=mode]:checked").value === "date";
      let days;
      if (byDate) {
        const target = new Date($(".date").value + "T12:00:00");
        days = Math.max(1, Math.round((target - Date.now()) / day));
      } else {
        const mins = Math.max(5, +$(".mins").value || 30);
        const m0 = planMath(from2, level, 1);
        days = Math.max(1, Math.ceil((m0.hoursNeeded * 60) / mins));
      }
      const study = Math.max(1, Math.round(days * ((7 - off) / 7)));
      const m = planMath(from2, level, study);
      if (m.lessons <= 0) return H.toast("You have already finished that level – pick a higher goal.");
      const j = Weber.judgePlan({ hoursNeeded: m.hoursNeeded, days: study });
      const realWeeks = Math.ceil(m.hoursNeeded / 5 / 7 * 7 / 7) || 1;
      const guided = (Weber.HOURS[level] || 300) - (LEVELS.indexOf(level) > 0 && from2 > START_LESSON[level] ? 0 : 0);
      const vars = { level, weeks: Math.max(1, Math.round(days / 7)), days, min: j.min,
        hours: guided,                                    // hours a course would budget for this level
        lessons: Math.max(1, Math.round(m.perDay * 10) / 10), words: m.words,
        realWeeks: Math.max(2, Math.ceil(m.hoursNeeded / 5)),          // at a sane 5 h a week
        year: new Date(Date.now() + (m.hoursNeeded * 60 / Math.max(5, j.min)) * day).getFullYear() };
      $(".verdict").innerHTML = `${Weber.html(j.verdict, vars)}
        <div class="card sub"><p><b>${m.lessons}</b> lessons · <b>${m.hoursNeeded} h</b> of work · <b>${study}</b> study days (${off} day${off === 1 ? "" : "s"} off a week)</p>
        <p>That's <b>${j.min} minutes</b> and about <b>${m.words} words</b> a day.</p>
        <div class="row"><button class="btn sign save">${j.verdict === "planMad" ? "Save it anyway" : "Save this plan"}</button></div></div>`;
      $(".save").onclick = () => {
        const st = Store.get();
        st.plan = { level, from: from2, target: LAST_LESSON[level], created: Date.now(), days: study, off, deadline: Date.now() + days * day, minutes: j.min, words: m.words, verdict: j.verdict, doneToday: null };
        Store.save(); App.dropCache(/^plan/); App.go("plan");
      };
    };
  };
  const nextLevel = (l) => LEVELS[Math.min(LEVELS.length - 1, LEVELS.indexOf(l) + 1)];

  function renderPlan(el, p) {
    const doneLessons = DC.curriculum.filter((l) => l.n >= p.from && l.n <= p.target && Store.lesson(l.n).done).length;
    const total = p.target - p.from + 1;
    const elapsed = Math.max(0, Math.round((Date.now() - p.created) / day));
    const left = Math.max(0, Math.round((p.deadline - Date.now()) / day));
    const shouldHave = Math.min(total, Math.round((elapsed / Math.max(1, elapsed + left)) * total));
    const diff = doneLessons - shouldHave;
    const perDay = left > 0 ? Math.max(0.2, (total - doneLessons) / left) : 0;
    const next = DC.curriculum.find((l) => l.n >= p.from && !Store.lesson(l.n).done) || null;
    el.innerHTML = `<h2 class="page-title">Your plan</h2>
      <section class="card lvl-${p.level}">
        <p class="big">${UI.levelDot(p.level)} by ${new Date(p.deadline).toLocaleDateString()}</p>
        <div class="pbar"><span style="width:${Math.round((doneLessons / total) * 100)}%"></span></div>
        <p>${doneLessons}/${total} lessons · <b>${left}</b> days left · about <b>${Math.round(perDay * 10) / 10}</b> lessons and <b>${p.words}</b> words a day from here.</p>
        ${diff < -1 ? Weber.html("behind", { n: -diff, weeks: Math.max(1, Math.round(elapsed / 7)) }) : diff > 1 ? Weber.html("ahead", { n: diff }) : ""}
      </section>
      <section class="card"><h3>Today</h3>
        ${next ? `<button class="tile wide lvl-${next.level}" data-go="lesson/${next.n}"><b>Lesson ${next.n}: ${esc(next.title)}</b><span>${esc(next.theme)}</span></button>` : "<p>All lessons in this plan are done. Set a new goal.</p>"}
        <div class="row"><button class="btn sign" data-go="daily">Start today's session</button><button class="btn ghost" data-go="weak">Weak topics</button></div>
      </section>
      <section class="card"><h3>Change the plan</h3>
        <div class="row"><button class="btn ghost" data-go="plan/new">New goal or date</button><button class="btn bad ghost" data-go="plan/clear">Delete plan</button></div>
        <p class="muted small">Falling behind isn't fatal – the daily number simply goes up, which is exactly why it's better to know.</p></section>`;
  }

  /* ============ 3. Übungstag – the daily session ============ */
  V.daily = (el) => {
    const s = Store.get();
    const today = Store.today();
    const p = activePlan();
    const plan = [];
    const next = DC.curriculum.find((l) => (!p || l.n >= p.from) && !Store.lesson(l.n).done);
    if (next) plan.push({ k: "lesson", label: `Lesson ${next.n}: ${next.title}`, go: "lesson/" + next.n, mins: 15 });
    plan.push({ k: "words", label: `Word review (${(V.dueCount ? V.dueCount() : "")} due)`, go: "vocab/review", mins: 8 });
    plan.push({ k: "drill", label: "Sentence drills – 10 items", go: "practice/smart", mins: 8 });
    if ((s.weakTopics || []).length) plan.push({ k: "weak", label: "Weak topics", go: "weak", mins: 6 });
    plan.push({ k: "write", label: "Short writing task", go: "write", mins: 12 });
    const state = (s.daily && s.daily.date === today) ? s.daily : { date: today, done: [] };
    s.daily = state; Store.save();
    const pct = Math.round((state.done.length / plan.length) * 100);
    el.innerHTML = `<h2 class="page-title">Practice day</h2>
      <section class="card"><p class="muted">One session, in order. About ${plan.reduce((a, x) => a + x.mins, 0)} minutes – ${p ? `your plan asks for ${p.minutes}` : "set a plan to get a target"}.</p>
        <div class="pbar"><span style="width:${pct}%"></span></div>
        <ol class="daylist">${plan.map((x, i) => `<li class="${state.done.includes(x.k) ? "ok" : ""}"><label><input type="checkbox" data-k="${x.k}" ${state.done.includes(x.k) ? "checked" : ""}></label>
          <button class="link" data-go="${x.go}">${esc(x.label)}</button><span class="muted small">${x.mins} min</span></li>`).join("")}</ol>
        ${pct === 100 ? `<p class="big">Done for today.</p>${Weber.html("planOk", { level: p ? p.level : "your goal", weeks: "", min: p ? p.minutes : 30, lessons: 1, words: p ? p.words : 15 })}` : ""}
      </section>
      ${!p ? `<section class="card"><p>No plan yet – without a date this is just a list of good intentions.</p><div class="row"><button class="btn sign" data-go="plan">Make a plan</button></div></section>` : ""}`;
    el.querySelectorAll("input[type=checkbox]").forEach((c) => (c.onchange = () => {
      const st = Store.get(); const d = st.daily;
      d.done = c.checked ? [...new Set([...d.done, c.dataset.k])] : d.done.filter((x) => x !== c.dataset.k);
      Store.save(); V.daily(el);
    }));
  };

  /* ============ 4. Schwachstellen ============ */
  V.weak = (el, [id]) => {
    const s = Store.get();
    const topics = Object.entries(s.topics || {})
      .map(([k, v]) => ({ k, ...v, rate: v.n ? v.ok / v.n : 1 }))
      .filter((t) => t.n >= 4 && t.rate < 0.8)
      .sort((a, b) => a.rate - b.rate);
    const fromTest = (s.weakTopics || []).filter((t) => !topics.some((x) => x.k === t));
    if (id) {
      const gen = Engine.GEN[id];
      if (!gen) return (el.innerHTML = UI.empty("Unknown topic.", `<button class="btn" data-go="weak">Back</button>`));
      const t = s.topics[id] || { n: 0, ok: 0 };
      const misses = t.n - t.ok;
      el.innerHTML = `<button class="back" data-go="weak">‹ Weak topics</button><h2 class="page-title">${esc(gen.title || id)}</h2>
        ${misses >= 4 ? Weber.html("repeat", { topic: gen.title || id, n: misses }) : ""}
        <div class="sesshost"></div>`;
      UI.session(el.querySelector(".sesshost"), () => Engine.generate(id), { total: 10, title: gen.title || id, onEnd: () => { App.dropCache(/^weak/); } });
      return;
    }
    el.innerHTML = `<h2 class="page-title">Weak topics</h2>
      <p class="muted">What you actually get wrong – from your answers and from the placement test. Drilled here, they come back in the daily session until the rate improves.</p>
      ${topics.length ? `<section class="card"><h3>From your practice</h3>${topics.slice(0, 12).map((t) => {
        const g = Engine.GEN[t.k]; const pctv = Math.round(t.rate * 100);
        return `<div class="weakrow"><div><b>${esc((g && g.title) || t.k)}</b><span class="muted small"> ${t.ok}/${t.n} correct (${pctv} %)</span>
          <div class="pbar sm"><span style="width:${pctv}%"></span></div></div>${g ? `<button class="btn sm" data-go="weak/${t.k}">Drill</button>` : ""}</div>`;
      }).join("")}</section>` : `<section class="card"><p>Not enough data yet. Do a session or the placement test and this fills up.</p></section>`}
      ${fromTest.length ? `<section class="card"><h3>From the placement test</h3><div class="chips">${fromTest.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
        <p class="muted small">These came from the test, where topics are named by rule rather than by drill.</p></section>` : ""}
      <div class="row"><button class="btn ghost" data-go="practice/mistakes">My saved mistakes</button><button class="btn ghost" data-go="stats">Full statistics</button></div>`;
  };

  /* ============ 5. Auffrischung – for returners ============ */
  /* The rules that carry the most weight if you have to rebuild a level quickly, in teaching order. */
  const MUSTDO = {
    A1: ["artikel", "praesens", "akkusativ", "wortstellung", "negation", "modal", "trennbar"],
    A2: ["dativ", "praepositionen", "wechsel", "perfekt", "dat_akk", "konjunktionen", "adjektiv"],
    B1: ["adjektiv_komplett", "relativ", "konjunktiv2", "passiv", "verb_praep", "genitiv", "ndeklination", "nebensatz"],
    B2: ["konjunktiv1", "partizip", "passiversatz", "nominalstil", "konnektor_b2", "funktionsverb", "modal_subjektiv", "konj2_vergangenheit"],
    C1: ["attribut_c1", "kohaesion", "modalpartikel", "kollokation", "adjektiv_komplett"],
    C2: ["register", "nuancen", "kollokation"],
  };
  V.refresh = (el, [act]) => {
    const s = Store.get();
    if (!act) {
      el.innerHTML = `<h2 class="page-title">Refresher</h2>
        <section class="card"><p>For everyone who did a course, then had a gap. You don't need 60 lessons again – you need to know what fell out.</p>
        <ol class="plain small"><li>A 20-question check at the level you reached.</li><li>A ranked <b>must-do list</b>: the rules that carry the most weight in exams and daily life.</li><li>Short drills, in order, until each one holds.</li></ol>
        <label>What level did you reach? <select class="lv">${LEVELS.map((l) => `<option ${l === "B1" ? "selected" : ""}>${l}</option>`).join("")}</select></label>
        <div class="row"><button class="btn sign start">Start the check</button></div></section>
        ${Weber.html("streak", { days: 30, gap: 90 }, "quiet")}`;
      el.querySelector(".start").onclick = () => { Store.get().refreshLevel = el.querySelector(".lv").value; Store.save(); App.go("refresh/check"); };
      return;
    }
    if (act === "check") {
      const lv = s.refreshLevel || "B1";
      const stages = Object.keys(STAGE_LEVEL).filter((k) => STAGE_LEVEL[k] === lv).map(Number);
      const pool = H.shuffle(DC.placement.filter((i) => stages.includes(i.s))).slice(0, 16);
      let i = 0; const log = [];
      const wrap = document.createElement("div"); el.innerHTML = `<h2 class="page-title">Refresher check · ${lv}</h2>`; el.appendChild(wrap);
      const step = () => {
        if (i >= pool.length) return done();
        const it = pool[i];
        const opts = H.shuffle(it.o.map((text, k) => ({ text, ok: k === it.a })));
        wrap.innerHTML = `<div class="pbar"><span style="width:${(i / pool.length) * 100}%"></span></div>
          <section class="card"><p class="muted small">${i + 1}/${pool.length}</p><p class="qtext">${esc(it.q).replace(/___/g, "<b>___</b>")}</p>
          <div class="choices">${opts.map((o, k) => `<button class="choice" data-k="${k}">${esc(o.text)}</button>`).join("")}</div>
          <div class="row"><button class="btn ghost sm dunno">I don't know</button></div></section>`;
        const ans = (ok, k) => {
          log.push({ t: it.t, ok, w: it.w });
          wrap.querySelectorAll(".choice").forEach((b, n) => { b.disabled = true; if (opts[n].ok) b.classList.add("right"); else if (n === k) b.classList.add("wrong"); });
          setTimeout(() => { i++; step(); }, ok ? 240 : 650);
        };
        wrap.querySelectorAll(".choice").forEach((b, k) => (b.onclick = () => ans(opts[k].ok, k)));
        wrap.querySelector(".dunno").onclick = () => ans(false, -1);
      };
      const done = () => {
        const lost = log.filter((r) => !r.ok);
        const st = Store.get();
        st.refresh = { date: Date.now(), level: lv, lost: [...new Set(lost.map((r) => r.t))] };
        st.weakTopics = [...new Set([...(st.weakTopics || []), ...lost.map((r) => r.t)])].slice(0, 10);
        Store.save();
        const gens = (MUSTDO[lv] || []).filter((g) => Engine.GEN[g]);
        wrap.innerHTML = `<section class="card result"><p class="big">${log.length - lost.length}/${log.length} still there</p>
            <p>${lost.length ? "Gone or shaky: " + [...new Set(lost.map((r) => r.t))].map(esc).join(", ") + "." : "Nothing missing at this level – move up."}</p></section>
          ${Weber.html(lost.length > log.length / 2 ? "rough" : "stakes", {})}
          <section class="card"><h3>Must-do list for ${lv}</h3>
            <p class="muted small">In this order. These carry the most weight in exams and in everyday conversation.</p>
            <ol class="mustdo">${gens.map((g, n) => `<li><b>${esc(Engine.GEN[g].title || g)}</b> <button class="btn sm" data-go="weak/${g}">Drill</button>${n === 0 ? ' <span class="muted small">start here</span>' : ""}</li>`).join("")}</ol>
            <div class="row"><button class="btn sign" data-go="plan">Put this in a plan</button><button class="btn ghost" data-go="refresh">Start over</button></div></section>`;
      };
      step();
    }
  };
})();
