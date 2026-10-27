/* Deutsch Coach – Einstufungstest, Lernplan, Übungstag, Schwachstellen, Auffrischung.
   Frau Weber comments on plans, streaks and repeated mistakes (js/weber.js). */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  /* Course positions (not lesson IDs) of the first and last lesson of every level. */
  const START_LESSON = new Proxy({}, { get: (_, lv) => (Course.first(lv) || {}).pos || 1 });
  const LAST_LESSON = new Proxy({}, { get: (_, lv) => (Course.last(lv) || {}).pos || DC.curriculum.length });
  const atPos = (p) => DC.curriculum[Math.max(0, Math.min(DC.curriculum.length, p) - 1)];
  const HOURS_PER_LESSON = { A1: 3, A2: 4, B1: 5, B2: 7, C1: 9, C2: 10 };   // v6 lessons are twice as long; includes review
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
          <p>Start at <b>lesson ${start}</b> (${esc(H.ltText(atPos(start)))}). Everything before it stays open for review.</p>
          ${weak.length ? `<p><b>Fix these first:</b></p><div class="chips">${weak.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>` : ""}
          <div class="row"><button class="btn sign plan">Make a plan from here</button><button class="btn ghost setl">Start at lesson ${start}</button><button class="btn ghost" data-go="placement/go">Test again</button></div>
        </section>
        ${Weber.html(wrong > log.length / 2 ? "rough" : "stakes", {})}
        <section class="card"><h3>What you got wrong</h3><ul class="plain small">${log.filter((r) => !r.ok).map((r) => { const it = asked.find((x) => x.t === r.t); return it ? `<li><b>${esc(it.t)}:</b> ${esc(it.w)}</li>` : ""; }).join("") || "<li>Nothing – you answered everything correctly up to where you stopped.</li>"}</ul></section>`;
      wrap.querySelector(".plan").onclick = () => App.go("plan");
      wrap.querySelector(".setl").onclick = () => {
        const st = Store.get();
        for (let p = 1; p < start; p++) { const L = Store.lesson(atPos(p).n); if (!L.done) { L.done = true; L.score = Math.max(L.score || 0, 70); L.placed = true; } }
        Store.save(); App.dropCache(); App.go("lesson/" + atPos(start).n);
      };
    };
    step();
  };

  /* ============ 2. Lernplan ============ */
  const planMath = (fromLesson, level, days) => {
    const target = LAST_LESSON[level];
    const lessons = Math.max(1, target - fromLesson + 1);
    const hoursNeeded = Math.round(DC.curriculum.filter((l) => l.pos >= fromLesson && l.pos <= target).reduce((a, l) => a + (HOURS_PER_LESSON[l.level] || 5), 0));
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
    const doneLessons = DC.curriculum.filter((l) => l.pos >= p.from && l.pos <= p.target && Store.lesson(l.n).done).length;
    const total = p.target - p.from + 1;
    const elapsed = Math.max(0, Math.round((Date.now() - p.created) / day));
    const left = Math.max(0, Math.round((p.deadline - Date.now()) / day));
    const shouldHave = Math.min(total, Math.round((elapsed / Math.max(1, elapsed + left)) * total));
    const diff = doneLessons - shouldHave;
    const perDay = left > 0 ? Math.max(0.2, (total - doneLessons) / left) : 0;
    const next = DC.curriculum.find((l) => l.pos >= p.from && !Store.lesson(l.n).done) || null;
    el.innerHTML = `<h2 class="page-title">Your plan</h2>
      <section class="card lvl-${p.level}">
        <p class="big">${UI.levelDot(p.level)} by ${new Date(p.deadline).toLocaleDateString()}</p>
        <div class="pbar"><span style="width:${Math.round((doneLessons / total) * 100)}%"></span></div>
        <p>${doneLessons}/${total} lessons · <b>${left}</b> days left · about <b>${Math.round(perDay * 10) / 10}</b> lessons and <b>${p.words}</b> words a day from here.</p>
        ${diff < -1 ? Weber.html("behind", { n: -diff, weeks: Math.max(1, Math.round(elapsed / 7)) }) : diff > 1 ? Weber.html("ahead", { n: diff }) : ""}
      </section>
      <section class="card"><h3>Today</h3>
        ${next ? `<button class="tile wide lvl-${next.level}" data-go="lesson/${next.n}"><b>Lesson ${next.pos}: ${H.lt(next)}</b><span>${H.lt(next, "theme")}</span></button>` : "<p>All lessons in this plan are done. Set a new goal.</p>"}
        <div class="row"><button class="btn sign" data-go="daily">Start today's session</button><button class="btn ghost" data-go="weak">Weak topics</button></div>
      </section>
      <section class="card"><h3>Change the plan</h3>
        <div class="row"><button class="btn ghost" data-go="plan/new">New goal or date</button><button class="btn bad ghost" data-go="plan/clear">Delete plan</button></div>
        <p class="muted small">Falling behind isn't fatal – the daily number simply goes up, which is exactly why it's better to know.</p></section>`;
  }

  /* ============ 3. Übungstag – the daily session ============
     Filled to the minutes the plan asks for (or the daily goal), in a sensible order: the next lesson part
     by part, then words, drills, listening, reading, speaking and writing – and the next lesson again.
     Every item ticks itself when the work is done (lesson parts, cards reviewed, drills answered …).
     Finished early? “Add 15 minutes” always gives more. */
  const PARTS = [["learn", "Learn the rule", 6], ["read", "Read & listen", 6], ["practice", "Practise (20 exercises)", 10], ["exam", "Exam questions", 8], ["speak", "Speak", 5]];
  const BLOCKS = {
    words: { label: (n) => `Words: review ${n} cards`, go: () => "vocab/review", mins: 6, size: 15, icon: "🗂" },
    drill: { label: (n) => `Sentence drills: ${n} items`, go: () => "practice/smart", mins: 8, size: 10, icon: "✎" },
    listen: { label: (n) => `Listening: ${n} dictation${n > 1 ? "s" : ""}`, go: () => "listen", mins: 8, size: 4, icon: "🎧" },
    read: { label: () => "Reading: one text with questions", go: () => "read", mins: 8, size: 1, icon: "📖" },
    speak: { label: (n) => `Speaking: shadow ${n} sentences`, go: () => "speak", mins: 5, size: 5, icon: "🎙" },
    write: { label: () => "Writing: one short task", go: () => "write", mins: 12, size: 1, icon: "✍️" },
    weak: { label: (n) => `Weak topics: ${n} items`, go: () => "weak", mins: 6, size: 10, icon: "🩹" },
    starter: { label: () => "First steps: one picture round", go: () => "starter", mins: 4, size: 1, icon: "🐣" },
    partner: { label: (n) => `Conversation with the speaking partner: ${n} answers`, go: () => "partner/lesson", mins: 10, size: 8, icon: "🗣" },
    exam: { label: () => "Mock exam: one part", go: () => (V.nextExamPart ? V.nextExamPart() : "telc"), mins: 12, size: 1, icon: "🎓" },
  };
  const dailyTarget = (p, s) => (p && p.minutes) || ({ 20: 10, 50: 20, 100: 30, 150: 45 }[s.settings.goal] || 20);
  function lessonParts(p, skip) {
    const out = [];
    DC.curriculum.filter((l) => (!p || l.pos >= p.from)).some((l) => {
      const ls = Store.lesson(l.n); const parts = ls.parts || {};
      if (ls.done) return false;                       // a finished lesson: move on, don't send the learner back
      PARTS.forEach(([k, t, m]) => { if (!(parts[k] || (k === "practice" && ls.done)) && !skip.has(`part:${l.n}:${k}`)) out.push({ id: `part:${l.n}:${k}`, k: "part", n: l.n, part: k, label: `Lesson ${l.pos} · ${t}`, sub: H.ltText(l), go: `lesson/${l.n}/${k}`, mins: m }); });
      return out.length >= 15;
    });
    return out;
  }
  function buildDay(minutes, state, p) {
    const s = Store.get(); const items = state.items || [];
    const have = new Set(items.map((x) => x.id)); const need = {}; items.forEach((x) => { if (x.need) need[x.k] = Math.max(need[x.k] || 0, x.need); });
    let total = items.reduce((a, x) => a + x.mins, 0);
    const parts = lessonParts(p, have);
    const weak = Object.entries(s.topics || {}).some(([k, v]) => Engine.GEN[k] && (v.r || 0) + (v.w || 0) >= 4 && (v.r || 0) / ((v.r || 0) + (v.w || 0)) < 0.8);
    const block = (k) => { const B = BLOCKS[k]; need[k] = (need[k] || 0) + B.size; return { id: `${k}:${need[k]}`, k, need: need[k], label: B.label(B.size), go: B.go(), mins: B.mins, icon: B.icon }; };
    const order = [];
    if (s.starterMode && window.Views.starterProgress && Views.starterProgress().next) order.push("starter");
    const talk = window.AI && AI.ready() ? "partner" : "speak";
    const examOn = ["A2", "B1", "B2"].includes((window.AI && AI.profile().level) || "A1") || Object.keys(s.telcParts || {}).length > 0;
    order.push("parts2", "words", "drill", "parts3", "listen", talk, "read", examOn ? "exam" : "speak", "write", "drill", weak ? "weak" : "words", "listen", talk, "drill", examOn ? "exam" : "words", "read");
    let guard = 0;
    while (total < minutes && guard++ < 60) {
      const k = order[(guard - 1) % order.length];
      if (k.startsWith("parts")) { const n = +k.slice(5); for (let i = 0; i < n && parts.length && total < minutes; i++) { const it = parts.shift(); items.push(it); total += it.mins; } continue; }
      const it = block(k); items.push(it); total += it.mins;
    }
    state.items = items; state.minutes = Math.max(state.minutes || 0, minutes);
    return state;
  }
  const isDone = (x, state) => {
    if ((state.manual || []).includes(x.id)) return true;
    if (x.k === "part") { const ls = Store.lesson(x.n); return !!((ls.parts || {})[x.part] || (x.part === "practice" && ls.done)); }
    return window.Habit && Habit.count(x.k === "starter" ? "starter" : x.k) >= x.need;
  };
  V.daily = (el) => {
    const s = Store.get(); const today = Store.today(); const p = activePlan();
    const target = dailyTarget(p, s);
    let state = s.daily && s.daily.date === today && s.daily.items ? s.daily : { date: today, items: [], manual: [] };
    if (!state.items.length || (state.minutes || 0) < target) state = buildDay(target, state, p);
    s.daily = state; Store.save();
    const items = state.items; const done = items.filter((x) => isDone(x, state));
    const minsDone = done.reduce((a, x) => a + x.mins, 0), minsAll = items.reduce((a, x) => a + x.mins, 0);
    const pct = Math.round((minsDone / Math.max(1, minsAll)) * 100);
    const allDone = done.length === items.length;
    const first = items.find((x) => !isDone(x, state));
    el.innerHTML = `<h2 class="page-title">${H.bi("Übungstag", "Practice day")}</h2>
      <section class="card">
        <p>${p ? `Your plan asks for <b>${target} minutes</b> a day.` : `Your daily goal: about <b>${target} minutes</b>.`} Today's list: <b>${minsAll} min</b> in ${items.length} steps – they tick themselves when you finish them.</p>
        <div class="pbar"><span style="width:${pct}%"></span></div>
        <p class="muted small">${minsDone} of ${minsAll} min done · ${done.length}/${items.length} steps</p>
        ${first ? `<button class="btn sign big-btn" data-go="${first.go}">${done.length ? "Continue" : "Start"}: ${esc(first.label)}</button>` : ""}
        <ol class="daylist">${items.map((x) => { const ok = isDone(x, state); const sz = x.need ? BLOCKS[x.k].size : 0; const prog = sz > 1 && !ok && window.Habit ? ` · ${Math.max(0, Math.min(sz, Habit.count(x.k) - (x.need - sz)))}/${sz}` : "";
          return `<li class="${ok ? "ok" : ""}"><label title="Tick by hand"><input type="checkbox" data-id="${esc(x.id)}" ${ok ? "checked" : ""}></label>
          <button class="link" data-go="${x.go}">${x.icon ? x.icon + " " : ""}${esc(x.label)}${x.sub ? `<small class="muted"> · ${esc(x.sub)}</small>` : ""}</button><span class="muted small">${x.mins} min${prog}</span></li>`; }).join("")}</ol>
        ${allDone ? `<div class="daydone"><p class="big">🎉 ${H.bi("Geschafft für heute!", "Done for today!")} ${minsDone} minutes.</p>${p ? Weber.html("planOk", { level: p.level, weeks: "", min: p.minutes, lessons: 1, words: p.words }) : ""}</div>` : ""}
        <div class="row">${allDone ? `<button class="btn sign more15">+ 15 more minutes</button>` : `<button class="btn ghost more15">+ Add 15 minutes</button>`}<button class="btn ghost" data-go="practice/smart">Free practice</button></div>
      </section>
      ${!p ? `<section class="card"><p>No plan yet – make one and the practice day fills the minutes your goal needs.</p><div class="row"><button class="btn sign" data-go="plan">Make a plan</button></div></section>` : ""}`;
    el.querySelectorAll("input[type=checkbox]").forEach((c) => (c.onchange = () => {
      const st = Store.get().daily; st.manual = st.manual || [];
      st.manual = c.checked ? [...new Set([...st.manual, c.dataset.id])] : st.manual.filter((x) => x !== c.dataset.id);
      Store.save(); V.daily(el);
    }));
    el.querySelector(".more15").onclick = () => { const st = Store.get().daily; buildDay(st.items.reduce((a, x) => a + x.mins, 0) + 15, st, p); Store.save(); V.daily(el); H.toast("15 more minutes added."); };
  };

  /* ============ 4. Schwachstellen ============ */
  V.weak = (el, [id]) => {
    const s = Store.get();
    const topics = Object.entries(s.topics || {})
      .filter(([k]) => Engine.GEN[k])
      .map(([k, v]) => { const n = (v.r || 0) + (v.w || 0); return { k, ...v, n, ok: v.r || 0, rate: n ? (v.r || 0) / n : 1 }; })
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
        <section class="card"><p>For everyone who did a course, then had a gap. You don't need the whole course again – you need to know what fell out.</p>
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
