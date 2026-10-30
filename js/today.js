/* Deutsch Coach – "Today": one guided session instead of a menu. It runs the day's steps one after the other
   on one screen – flashcards, the next lesson step, a short drill, listening, speaking and your mistakes –
   sized to your daily goal. Leaving and coming back resumes at the same step. */
(function () {
  "use strict";
  const { esc } = H;
  const V = window.Views;
  const st = () => Store.get();
  const PARTS = [["learn", "Learn the rule"], ["read", "Read the text"], ["practice", "Practise"], ["exam", "Exam questions"], ["speak", "Speak"]];
  const minutes = () => (st().plan && st().plan.minutes) || ({ 20: 10, 50: 20, 100: 30, 150: 45 }[st().settings.goal] || 20);
  const lessonNow = () => { try { return AI.profile().lesson; } catch (e) { return DC.curriculum[0]; } };
  const nextPart = (l) => { const ls = Store.lesson(l.n), p = ls.parts || {}; return PARTS.find(([k]) => !(p[k] || (k === "practice" && ls.done))); };
  const dueCards = () => SRS.due(V.vocabIds());
  const level = () => { try { return AI.profile().level; } catch (e) { return "A1"; } };

  /* 7.3: the plan fills your daily minutes – every step is worth what it takes (Work.js counts it) */
  const LESSON_PARTS = (l) => PARTS.filter(([k]) => { const ls = Store.lesson(l.n), p = ls.parts || {}; return !(p[k] || (k === "practice" && ls.done)); });
  function cycle(i, l, parts, lv) {
    const out = [];
    if (parts.length) { const [k, t] = parts.shift(); out.push({ k: "lesson", label: `Lesson ${l.pos}: ${t}`, mins: Work.PART[k] || 10, n: l.n, part: k }); }
    out.push({ k: "drill", label: "Grammar drill: 10 questions", mins: 5 });
    if (i % 2 === 0) out.push({ k: "listen", label: "Listening: 3 sentences", mins: 3 });
    if (Mistakes.open().length && i < 3) out.push({ k: "mistakes", label: `My mistakes: ${Math.min(6, Mistakes.queue(6).length) || 6}`, mins: 3 });
    out.push({ k: "speak", label: "Speaking: one answer", mins: 4 });
    if (["A2", "B1", "B2"].includes(lv) && i % 2 === 1) out.push({ k: "exam", label: "Mock exam: one part", mins: 12 });
    if (i % 2 === 1) out.push({ k: "cards", label: "Flashcards: 12 more", mins: 3 });
    return out;
  }
  function plan(want) {
    const m = want || Math.max(10, Work.target() - Math.round(Work.done())), l = lessonNow(), steps = [];
    if (st().starterMode && Views.starterProgress && Views.starterProgress().next) {
      const out = [{ k: "starter", label: "First steps: one picture round", mins: 4 }, { k: "cards", label: "Flashcards: your first words", mins: 3 }];
      while (out.reduce((a, x) => a + x.mins, 0) < Math.min(m, 40)) out.push({ k: "starter", label: "First steps: one more round", mins: 4 });
      return out;
    }
    if (!want) {
      const w = wordsToday();
      if (w.ids.length && w.learned.length < w.ids.length) steps.push({ k: "words", label: `New words of the day: ${w.ids.length}`, mins: w.ids.length });
      const due = dueCards().length;
      steps.push({ k: "cards", label: due ? `Flashcards: ${Math.min(due, 12)} due` : "Flashcards: new words", mins: 3 });
    }
    const parts = LESSON_PARTS(l), lv = level();
    for (let i = 0; steps.reduce((a, x) => a + x.mins, 0) < m && i < 12; i++) cycle(i, l, parts, lv).forEach((x) => steps.push(x));
    // trim the last cycle so the plan ends close to the target
    while (steps.length > 3 && steps.reduce((a, x) => a + x.mins, 0) - steps[steps.length - 1].mins >= m) steps.pop();
    return steps;
  }
  /* ---------- 7.3: new words of the day ---------- */
  const wordsToday = () => {
    const s = st(), d = Store.today();
    if (s.wotd && s.wotd.date === d) return s.wotd;
    const n = +s.settings.newWords || 5, l = lessonNow(), lv = l.level;
    const list = V.vocabList().filter((w) => !w.sentence && w.en && !s.srs[w.id] && !/^nb:/.test(w.id));
    const lessonIds = new Set((l.vocab || []).map((v) => "v:" + v.de.toLowerCase()));
    const pick = list.filter((w) => lessonIds.has(w.id) || w.lesson === l.n).concat(list.filter((w) => w.level === lv && !lessonIds.has(w.id) && w.lesson !== l.n)).slice(0, n);
    s.wotd = { date: d, ids: pick.map((w) => w.id), learned: [] }; Store.save();
    return s.wotd;
  };
  V.wordsToday = () => { const w = wordsToday(), by = Object.fromEntries(V.vocabList().map((x) => [x.id, x])); return { ids: w.ids, learned: w.learned, words: w.ids.map((id) => by[id]).filter(Boolean) }; };
  function words(body, cur, next, skip) {
    const W = V.wordsToday(); let i = W.words.findIndex((w) => !W.learned.includes(w.id));
    if (i < 0) return next();
    const draw = () => {
      if (i >= W.words.length) return next();
      const w = W.words[i];
      body.innerHTML = `<section class="card nwd"><p class="muted small">🆕 New word ${i + 1} of ${W.words.length} · listen, say it out loud, then add it to your cards</p>
        <p class="nw-de">${UI.colorArticles(w.de)} ${UI.say(w.de.split(",")[0])}</p>${w.pl ? `<p class="muted">Plural: ${esc(w.pl)}</p>` : ""}<p class="nw-en">${esc(w.en)}</p>
        ${w.exDe ? `<p class="ex">${UI.colorArticles(w.exDe)} ${UI.say(w.exDe)}${w.exEn ? `<br><span class="muted small">${esc(w.exEn)}</span>` : ""}</p>` : ""}
        <div class="row"><button class="btn sign nw-ok">✓ Got it – add to my flashcards</button>${skip}</div></section>`;
      setTimeout(() => Speech.speak(w.de.split(",")[0]), 200);
      body.querySelector(".nw-ok").onclick = () => {
        const s = st(); if (!s.srs[w.id]) { SRS.grade(w.id, 1); s.srs[w.id].due = Date.now() + 10 * 60e3; }
        if (!s.wotd.learned.includes(w.id)) s.wotd.learned.push(w.id);
        if (window.Habit) Habit.track("words"); Work.add(0.75); Store.addXP(3); Store.save(); i++; draw();
      };
      const sk = body.querySelector(".t-skip"); if (sk) sk.onclick = () => next();
    };
    draw();
  }
  const state = () => {
    const s = st(), d = Store.today();
    if (!s.todaySession || s.todaySession.date !== d) { s.todaySession = { date: d, steps: plan(), i: 0, xp0: (s.days || {})[d] || 0 }; Store.save(); }
    return s.todaySession;
  };

  V.today = (el, [act]) => {
    const T = state();
    if (act === "more") { const left = Math.max(15, Work.target() - Math.round(Work.done())); T.steps = T.steps.concat(plan(Math.min(left, 30)).filter((x) => !(x.k === "lesson" && T.steps.some((y) => y.k === "lesson" && y.n === x.n && y.part === x.part)))); Store.save(); return App.go("today"); }
    if (act === "words") { el.innerHTML = `<div class="today"><button class="back" data-go="home">‹ Home</button><div class="t-body"></div></div>`; return words(el.querySelector(".t-body"), {}, () => App.go("home"), ""); }
    // a lesson or exam step done elsewhere counts when you come back
    T.steps.forEach((x) => { if (!x.done && x.k === "lesson") { const ls = Store.lesson(x.n); if ((ls.parts || {})[x.part] || (x.part === "practice" && ls.done)) x.done = true; } });
    while (T.i < T.steps.length && T.steps[T.i].done) T.i++;
    const done = T.steps.filter((x) => x.done).length, total = T.steps.length;
    const ws = Work.summary();
    el.innerHTML = `<div class="today"><div class="t-head"><h2 class="page-title">${H.bi("Heute", "Today")}</h2><span class="muted small">${done}/${total} steps · ~${T.steps.reduce((a, x) => a + (x.done ? 0 : x.mins), 0)} min in this plan</span></div>
      <div class="t-work"><b data-work="line">${esc(ws.line)}</b><span class="t-bal ${ws.bal >= 0 ? "ahead" : "behind"}" data-work="bal">${esc(ws.balLine)}</span><span class="muted small" data-work="time">⏱ ${Work.fmt(ws.time)} studied today</span></div>
      <div class="pbar"><span style="width:${Math.min(100, Math.round((ws.m / Math.max(1, ws.T)) * 100))}%"></span></div>
      <ol class="t-steps">${T.steps.map((x, i) => `<li class="${x.done ? "done" : i === T.i ? "now" : ""}">${x.done ? "✓" : i === T.i ? "▶" : "·"} ${esc(x.label)}</li>`).join("")}</ol>
      <div class="t-body"></div></div>`;
    const body = el.querySelector(".t-body");
    if (T.i >= T.steps.length) return finish(body, T);
    const cur = T.steps[T.i];
    const next = () => { cur.done = true; T.i++; Store.save(); App.go("today"); };
    const skip = `<button class="link t-skip">Skip this step</button>`;
    const bindSkip = () => { const b = body.querySelector(".t-skip"); if (b) b.onclick = () => { cur.done = true; cur.skipped = true; T.i++; Store.save(); App.go("today"); }; };
    ({ cards, lesson, starter, drill, listen, mistakes, speak, exam, words }[cur.k] || drill)(body, cur, next, skip);
    bindSkip();
  };

  /* ---------- steps ---------- */
  function cards(body, cur, next, skip) {
    const list = V.vocabList(), byId = Object.fromEntries(list.map((w) => [w.id, w]));
    let q = H.shuffle(dueCards()).slice(0, 12);
    if (q.length < 6) { const lv = level(); q = q.concat(list.filter((w) => !Store.get().srs[w.id] && w.level === lv && w.en).slice(0, 6 - q.length).map((w) => w.id)); }
    q = q.filter((id) => byId[id]);
    if (!q.length) return next();
    let i = 0;
    const draw = () => {
      if (i >= q.length) return next();
      const w = byId[q[i]];
      body.innerHTML = `<section class="card"><p class="muted small">${i + 1} / ${q.length} · say the German word (with article), then tap the card</p>
        <button class="flash"><span class="front">${esc(w.en)}</span><span class="back" hidden><b>${UI.colorArticles(w.de)}</b>${w.pl ? `<small>${esc(w.pl)}</small>` : ""}${w.exDe ? `<i>${esc(w.exDe)}</i>` : ""}</span></button>
        <div class="row center grades" hidden><button class="btn bad" data-g="0">Again</button><button class="btn ghost" data-g="1">Hard</button><button class="btn" data-g="2">Good</button><button class="btn ghost" data-g="3">Easy</button></div>
        <div class="row center">${skip}</div></section>`;
      const c = body.querySelector(".flash");
      c.onclick = () => { c.querySelector(".back").hidden = false; body.querySelector(".grades").hidden = false; Speech.speak(w.de); };
      body.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => { const g = +b.dataset.g; SRS.grade(w.id, g); if (window.Habit) Habit.track("words"); Store.addXP(g ? 3 : 1); if (g === 0) q.push(w.id); i++; draw(); }));
      body.querySelector(".t-skip").onclick = () => next();
    };
    draw();
  }
  function lesson(body, cur, next, skip) {
    const l = DC.curriculum.find((x) => x.n === cur.n);
    body.innerHTML = `<section class="card lvl-${l.level}"><h3>Lesson ${l.pos}: ${H.lt(l)}</h3><p>Next step: <b>${esc(cur.label.split(": ").pop())}</b>. It opens in the lesson – when you're done, come back with “Back to Today”.</p>
      <div class="row"><button class="btn sign big-btn t-go">Open the lesson →</button>${skip}</div></section>`;
    body.querySelector(".t-go").onclick = () => { st().returnToToday = Date.now(); Store.save(); App.go(`lesson/${cur.n}/${cur.part}`); };
  }
  function starter(body, cur, next, skip) {
    body.innerHTML = `<section class="card"><h3>🐣 First steps</h3><p>One picture round, then come back here.</p><div class="row"><button class="btn sign big-btn t-go">Start →</button><button class="btn ghost t-done">I did it ✓</button>${skip}</div></section>`;
    body.querySelector(".t-go").onclick = () => { st().returnToToday = Date.now(); Store.save(); App.go("starter"); };
    body.querySelector(".t-done").onclick = next;
  }
  function drillTopic() {
    const l = lessonNow(), gens = Engine.forLesson ? Engine.forLesson(l.n) : [];
    const ids = (gens || []).map((g) => (typeof g === "string" ? g : g.id)).filter((id) => Engine.GEN[id]);
    // the weakest topic you have already met, otherwise one from the current lesson
    const met = Object.entries(st().topics || {}).filter(([k, v]) => Engine.GEN[k] && (v.r || 0) + (v.w || 0) >= 3).map(([k, v]) => [k, (v.recent || []).reduce((a, b) => a + b, 0) / Math.max(1, (v.recent || []).length)]).sort((a, b) => a[1] - b[1]);
    if (met.length && met[0][1] < 0.8 && Math.random() < 0.6) return met[0][0];
    return ids.length ? H.pick(ids) : Object.keys(Engine.GEN)[0];
  }
  function drill(body, cur, next, skip) {
    const id = drillTopic(), g = Engine.GEN[id];
    body.innerHTML = `<div class="dg-host"></div><div class="sess-host"></div><div class="row center">${skip}</div>`;
    if (V.drillGuide) V.drillGuide(body.querySelector(".dg-host"), id);
    UI.session(body.querySelector(".sess-host"), () => Engine.generate(id), { title: g.title, total: 10, onEnd: () => cont(body, next) });
  }
  function mistakes(body, cur, next, skip) {
    const items = Mistakes.queue(6).map(Mistakes.item).filter(Boolean);
    if (!items.length) return next();
    body.innerHTML = `<div class="sess-host"></div><div class="row center">${skip}</div>`;
    UI.session(body.querySelector(".sess-host"), (i) => items[i], { title: "My mistakes", total: items.length, onEnd: () => cont(body, next) });
  }
  function cont(body, next) {
    const s = body.querySelector(".summary") || body;
    const b = document.createElement("div"); b.className = "row center t-cont"; b.innerHTML = `<button class="btn sign big-btn">Continue Today →</button>`;
    s.prepend(b); b.querySelector("button").onclick = next; b.querySelector("button").focus();
  }
  function listen(body, cur, next, skip) {
    const lv = level();
    const pool = H.shuffle(DC.curriculum.filter((l) => l.level === lv).flatMap((l) => l.examples || []).filter((e) => e.de.split(" ").length >= 3 && e.de.split(" ").length <= 12)).slice(0, 3);
    let i = 0;
    const draw = () => {
      if (i >= pool.length) return next();
      const e = pool[i];
      body.innerHTML = `<section class="card"><p class="muted small">Listening ${i + 1} / ${pool.length} · write what you hear</p><div class="row"><button class="btn sign t-play">🔊 Play</button><button class="btn ghost t-slow">🐢 Slow</button></div>
        <form class="q-form t-form" autocomplete="off"><textarea class="q-in t-in" rows="2" spellcheck="false" placeholder="Write it in German…"></textarea><button class="btn">Check</button></form><div class="t-fb"></div><div class="row center">${skip}</div></section>`;
      body.querySelector(".t-play").onclick = () => Speech.speak(e.de); body.querySelector(".t-slow").onclick = () => Speech.speak(e.de, 0.6);
      setTimeout(() => Speech.speak(e.de), 250);
      const inp = body.querySelector(".t-in"); inp.onkeydown = (ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); body.querySelector(".t-form").requestSubmit(); } };
      body.querySelector(".t-form").onsubmit = (ev) => {
        ev.preventDefault(); if (!inp.value.trim()) return;
        const r = V._charDiff(inp.value.trim(), e.de);
        body.querySelector(".t-fb").innerHTML = `<p class="ddiff">${r.html}</p><p class="ex">${UI.colorArticles(e.de)} ${UI.say(e.de)}</p><p class="muted">${esc(e.en)}</p><div class="row"><button class="btn sm t-n">Next</button></div>`;
        Store.topic("dictation", r.pct >= 95); Store.addXP(r.pct >= 95 ? 5 : 2); if (window.Habit) Habit.track("listen");
        body.querySelector(".t-n").onclick = () => { i++; draw(); };
      };
      body.querySelector(".t-skip").onclick = () => next();
    };
    draw();
  }
  function speak(body, cur, next, skip) {
    const l = lessonNow(), p = H.pick(l.speak || ["Erzähl von deinem Tag."]).replace(/__/g, "");
    body.innerHTML = `<section class="card"><h3>🎙 Speak</h3><p lang="de"><b>${esc(p)}</b> ${UI.say(p)} ${UI.hint(p)}</p><p class="muted small">Answer in 2–4 sentences – speak or type.</p>
      <textarea class="t-sp" rows="3" placeholder="What you say appears here – or type it"></textarea><div class="row">${UI.mic("Speak")}<button class="btn sm t-chk">Check</button>${skip}</div><div class="t-fb"></div></section>`;
    const ta = body.querySelector(".t-sp"), f = body.querySelector(".t-fb");
    UI.bindMic(body, (t) => { ta.value = (ta.value ? ta.value + " " : "") + t; });
    body.querySelector(".t-chk").onclick = () => {
      if (!ta.value.trim()) return H.toast("Say or type an answer first.");
      const r = FB.open(ta.value, { prompt: p, lesson: l }); f.innerHTML = r.html + (V.aiButton ? V.aiButton(p, l.n, ".t-sp") : "") + `<div class="row"><button class="btn sign t-n">Continue Today →</button></div>`;
      if (window.Habit) Habit.track("speak"); Store.addXP(r.score >= 65 ? 8 : 3);
      f.querySelector(".t-n").onclick = next;
    };
  }
  function exam(body, cur, next, skip) {
    body.innerHTML = `<section class="card"><h3>🎓 One mock exam part</h3><p>The next part you haven't done yet (or your weakest one). Come back with “Back to Today” afterwards.</p><div class="row"><button class="btn sign big-btn t-go">Open →</button><button class="btn ghost t-done">I did it ✓</button>${skip}</div></section>`;
    body.querySelector(".t-go").onclick = () => { st().returnToToday = Date.now(); Store.save(); App.go(V.nextExamPart ? V.nextExamPart() : "telc"); };
    body.querySelector(".t-done").onclick = next;
  }
  function finish(body, T) {
    const s = st(), xp = ((s.days || {})[Store.today()] || 0) - (T.xp0 || 0);
    const ws = Work.summary();
    body.innerHTML = `<section class="card t-end"><h3>🎉 ${ws.left ? H.bi("Plan geschafft!", "This plan is done!") : H.bi("Fertig für heute!", "Done for today!")}</h3><p>${esc(ws.line)} · ${esc(ws.balLine)}</p><p>+${Math.max(0, xp)} XP · 🔥 ${s.streak.count}-day streak</p>
      ${ws.left ? `<p class="muted">Your goal still has ${Work.fmt(ws.left)} – add more steps whenever you like${ws.bal >= 0 ? ", or rest: your lead covers today" : ""}.</p>` : ""}
      ${UI.weeklyCard ? UI.weeklyCard() : ""}
      <div class="row"><button class="btn sign" data-go="today/more">+ more steps</button><button class="btn ghost" data-go="home">Home</button><button class="btn ghost" data-go="library">Library</button></div></section>`;
    if (!T.celebrated) { T.celebrated = true; Store.save(); if (window.Habit) setTimeout(() => Habit.celebrate("Heute geschafft! (Done for today)", `${T.steps.length} steps · +${Math.max(0, xp)} XP`), 400); }
  }
  /* ---------- 7.3: Today's plan on Home – see what's next without opening Today ---------- */
  V.homeToday = () => {
    const s = st(); if (s.starterMode && Views.starterProgress && Views.starterProgress().next && !s.todaySession) return "";
    const T = state(), ws = Work.summary();
    T.steps.forEach((x) => { if (!x.done && x.k === "lesson") { const ls = Store.lesson(x.n); if ((ls.parts || {})[x.part] || (x.part === "practice" && ls.done)) x.done = true; } });
    const nextI = T.steps.findIndex((x) => !x.done);
    const W = V.wordsToday();
    const icon = { cards: "🗂", lesson: "📘", drill: "🧩", listen: "🎧", mistakes: "🔁", speak: "🎙", exam: "🎓", starter: "🐣", words: "🆕" };
    return `<section class="card home-today"><div class="ht-head"><h3>${H.bi("Heute", "Today's plan")}</h3><span class="muted small">${T.steps.filter((x) => x.done).length}/${T.steps.length} steps</span></div>
      <p class="ht-work"><b>${esc(ws.line)}</b></p>
      <ol class="t-steps ht-steps">${T.steps.map((x, i) => `<li class="${x.done ? "done" : i === nextI ? "now" : ""}"><span>${x.done ? "✓" : icon[x.k] || "·"}</span> ${esc(x.label)} <span class="muted small">~${x.mins} min</span></li>`).join("")}</ol>
      <div class="row">${nextI >= 0 ? `<button class="btn sign" data-go="today">▶ Next: ${esc(T.steps[nextI].label)}</button>` : `<button class="btn sign" data-go="today/more">+ more steps</button>`}</div>
      ${W.words.length ? `<div class="ht-words"><b>🆕 ${H.bi("Neue Wörter heute", "New words today")}</b> <span class="muted small">${W.learned.length}/${W.words.length} learned</span><div class="chips">${W.words.map((w) => `<button class="chip ${W.learned.includes(w.id) ? "on" : ""} ${H.genderClass ? H.genderClass(w.de) : ""}" data-tts="${esc(w.de.split(",")[0])}" title="${esc(w.en)}">${W.learned.includes(w.id) ? "✓ " : ""}${esc(w.de.split(",")[0])}</button>`).join("")}</div>${W.learned.length < W.words.length ? `<button class="link" data-go="today/words">Learn them now</button>` : ""}</div>` : ""}
    </section>`;
  };
  /* a "Back to Today" bar on the lesson/exam screen you were sent to */
  V.todayBar = () => {
    const s = st(); if (!s.returnToToday || Date.now() - s.returnToToday > 3 * 3600e3 || !s.todaySession || s.todaySession.date !== Store.today()) return;
    if (/^#\/(today|home)/.test(location.hash)) { delete s.returnToToday; Store.save(); return; }
    if (document.querySelector(".todaybar")) return;
    const b = document.createElement("button"); b.className = "todaybar"; b.textContent = "‹ Back to Today"; b.onclick = () => { b.remove(); App.go("today"); };
    document.body.appendChild(b);
  };
  window.addEventListener("hashchange", () => { const b = document.querySelector(".todaybar"); if (b && /^#\/(today|home)/.test(location.hash)) b.remove(); setTimeout(V.todayBar, 50); });
})();
