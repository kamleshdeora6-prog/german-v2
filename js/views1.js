/* Deutsch Coach – views: Start, Linie (learning path), Lektion */
(function () {
  "use strict";
  const { esc, md } = H;
  const V = (window.Views = window.Views || {});
  const LESSONS = () => DC.curriculum;

  V.profile = () => {
    const s = Store.get();
    const done = LESSONS().filter((l) => s.lessons[l.n] && s.lessons[l.n].done).length;
    const next = LESSONS().find((l) => !(s.lessons[l.n] && s.lessons[l.n].done)) || LESSONS()[LESSONS().length - 1];
    const weak = Object.entries(s.topics).map(([id, t]) => ({ id, title: (Engine.GEN[id] || {}).title || id, pct: Math.round(((t.recent || []).reduce((a, b) => a + b, 0) / Math.max(1, (t.recent || []).length)) * 100), n: (t.recent || []).length }))
      .filter((x) => x.n >= 3 && x.pct < 70 && Engine.GEN[x.id]).sort((a, b) => a.pct - b.pct).slice(0, 3);
    return { done, next, weak, due: SRS.due(V.vocabIds()).length, level: next.level };
  };

  /* ---------------- Start ---------------- */
  V.home = (el) => {
    const s = Store.get(); const p = V.profile();
    const todayXP = s.days[Store.today()] || 0; const goal = s.settings.goal;
    const pct = Math.min(100, Math.round((todayXP / goal) * 100));
    const l = p.next;
    const ls = Store.lesson(l.n);
    const plan = [
      { t: `Review ${p.due} due word${p.due === 1 ? "" : "s"}`, go: "vocab", done: p.due === 0 },
      { t: `Lesson ${l.n}: ${l.title}`, go: `lesson/${l.n}`, done: ls.done },
      { t: "10 smart drills", go: "practice/smart", done: todayXP >= goal * 0.6 },
      { t: "Speak about the lesson picture", go: `lesson/${l.n}/speak`, done: !!ls.spoke },
    ];
    const hr = new Date().getHours();
    const hello = hr < 11 ? "Guten Morgen" : hr < 18 ? "Guten Tag" : "Guten Abend";
    el.innerHTML = `
    <h2 class="hello">${hello}${Store.name() ? `, <span>${esc(Store.name())}</span>` : ""}!</h2>
    <section class="board" aria-label="Next lesson">
      <div class="board-top"><span>Nächster Halt</span><span>${UI.levelDot(l.level)} Linie ${l.level}</span></div>
      <div class="board-main"><span class="board-n">${l.n}</span><span class="board-title">${esc(l.title)}</span></div>
      <div class="board-sub">${esc(l.theme)}${l.rec.length ? ` · reuses ${l.rec.length} earlier lessons` : ""}</div>
      <button class="btn sign" data-go="lesson/${l.n}">${ls.read ? "Continue" : "Start"} lesson ${l.n}</button>
    </section>
    <section class="stats3">
      <div><b>${s.streak.count}</b><span>day streak</span></div>
      <div><b>${p.done}/${DC.curriculum.length}</b><span>lessons</span></div>
      <div><b>${p.due}</b><span>words due</span></div>
    </section>
    <section class="card">
      <div class="goal"><span>Today: ${todayXP} / ${goal} XP</span><div class="bar"><i style="width:${pct}%"></i></div></div>
      <h3>Today's route</h3>
      <ol class="plan">${plan.map((x) => `<li class="${x.done ? "done" : ""}"><button class="link" data-go="${x.go}">${esc(x.t)}</button></li>`).join("")}</ol>
    </section>
    ${p.weak.length ? `<section class="card"><h3>Needs practice</h3><div class="chips">${p.weak.map((w) => `<button class="chip" data-go="practice/${w.id}">${esc(w.title)} · ${w.pct}%</button>`).join("")}</div></section>` : ""}
    <section class="grid2">
      <button class="tile" data-go="tutor"><b>Ask Max</b><span>Check a sentence, ask why</span></button>
      <button class="tile" data-go="listen"><b>Listen</b><span>Dictation with audio</span></button>
      <button class="tile" data-go="speak"><b>Speak</b><span>Shadowing & free talk</span></button>
      <button class="tile" data-go="exam"><b>B1 exam</b><span>Mock test & Leben in D.</span></button>
    </section>
    ${s.mistakes.length ? `<section class="card"><h3>Recent mistakes</h3>${s.mistakes.slice(0, 3).map((m) => `<p class="mist">${m.prompt}<br><span class="muted">You: ${esc(m.given || "–")} · Right: <b>${esc(m.answer)}</b></span></p>`).join("")}<button class="btn ghost sm" data-go="stats">Review all</button></section>` : ""}
    ${(() => { const month = 30 * 864e5, last = s.lastBackup || 0, snooze = s.backupSnooze || 0;
      return s.xp >= 60 && Date.now() - last > month && Date.now() > snooze && Date.now() - (s.created || 0) > 7 * 864e5
        ? `<section class="card remind"><p>💾 <b>Back up your progress?</b> ${last ? "Your last backup is over a month old." : "You haven't saved a backup yet."} Progress lives only on this device.</p><div class="row"><button class="btn sign sm bk-now">Export backup</button><button class="btn ghost sm bk-later">Remind me later</button></div></section>` : ""; })()}
    <div class="novoice"></div>
    <section class="card quick"><div class="row"><button class="btn ghost" data-go="translate">⇄ Translate a word or sentence</button><button class="btn ghost" data-go="write">✍ Writing exam</button></div></section>
    <p class="credit muted small">${App.credit()}</p>`;
    const bn = el.querySelector(".bk-now"); if (bn) bn.onclick = () => { App.backup(); el.querySelector(".remind").remove(); };
    const bl = el.querySelector(".bk-later"); if (bl) bl.onclick = () => { s.backupSnooze = Date.now() + 30 * 864e5; Store.save(); el.querySelector(".remind").remove(); };
    if (!s.voiceWarned) App.voiceStatus().then((v) => { if (v === "none" && document.body.contains(el)) { const nv = el.querySelector(".novoice"); if (nv) nv.innerHTML = `<section class="card">${App.voiceHelp()}<button class="btn ghost sm nv-ok">Got it</button></section>`; const ok = el.querySelector(".nv-ok"); if (ok) ok.onclick = () => { s.voiceWarned = true; Store.save(); nv.innerHTML = ""; }; } });
  };

  /* ---------------- Linie (path as a transit line) ---------------- */
  V.path = (el) => {
    const s = Store.get();
    let html = `<h2 class="page-title">Your line from A1 to C2</h2><p class="muted">Each stop is a lesson. Finish a stop (score ≥ 70 %) to open the next one. Later stops reuse earlier grammar.</p><ol class="line">`;
    let prevLvl = null;
    LESSONS().forEach((l) => {
      if (l.level !== prevLvl) {
        html += `<li class="transfer lvl-${l.level}"><span class="dot"></span><span>${prevLvl ? `Change to line ${l.level}` : `Line ${l.level} starts`}</span></li>`;
        prevLvl = l.level;
      }
      const st = s.lessons[l.n] || {};
      const open = Store.unlocked(l.n);
      const cur = open && !st.done && (l.n === 1 || (s.lessons[l.n - 1] || {}).done || s.settings.unlockAll) && !LESSONS().some((x) => x.n < l.n && !(s.lessons[x.n] || {}).done);
      html += `<li class="stop lvl-${l.level} ${st.done ? "done" : ""} ${cur ? "current" : ""} ${open ? "" : "locked"}">
        <span class="dot"></span>
        <button class="stop-btn" ${open ? `data-go="lesson/${l.n}"` : "disabled"}>
          <span class="stop-n">${l.n}</span><span class="stop-t">${esc(l.title)}<small>${esc(l.theme)}${st.score ? ` · ${st.score}%` : ""}${open ? "" : " · locked"}</small></span>
        </button></li>`;
    });
    el.innerHTML = html + `</ol><p class="muted small">Already know some topics? Turn on “Open all lessons” in Settings.</p>`;
    const c = el.querySelector(".current"); if (c) setTimeout(() => c.scrollIntoView({ block: "center" }), 60);
  };

  /* ---------------- Lesson ---------------- */
  const TABS = [["learn", "Learn"], ["read", "Read"], ["practice", "Practice"], ["exam", "Exam"], ["speak", "Speak"]];
  V.lesson = (el, [nStr, tab = "learn"]) => {
    const n = +nStr; const l = LESSONS().find((x) => x.n === n);
    if (!l) return (el.innerHTML = UI.empty("Lesson not found.", `<button class="btn" data-go="path">Back to the line</button>`));
    if (!Store.unlocked(n)) return (el.innerHTML = UI.empty(`Lesson ${n} opens when you finish lesson ${n - 1}.`, `<button class="btn" data-go="lesson/${n - 1}">Go to lesson ${n - 1}</button>`));
    const ls = Store.lesson(n);
    const titles = Object.fromEntries(LESSONS().map((x) => [x.n, x.title]));
    el.innerHTML = `
      <header class="lhead lvl-${l.level}">
        <div class="lhead-row"><button class="back" data-go="path" aria-label="Back">‹</button><span>Lesson ${l.n} · ${l.level}</span>${ls.done ? `<span class="badge">done ${ls.score}%</span>` : ""}</div>
        <h2>${esc(l.title)}</h2><p>${esc(l.theme)}</p>
      </header>
      ${l.rec.length ? `<details class="recap"><summary>Builds on ${l.rec.length} earlier lesson${l.rec.length > 1 ? "s" : ""}</summary>${l.rec.map((r) => `<button class="chip" data-go="lesson/${r}">L${r} ${esc(titles[r])}</button>`).join("")}</details>` : ""}
      <nav class="tabs" role="tablist">${TABS.map(([k, t]) => `<button role="tab" class="tab ${k === tab ? "on" : ""}" data-go="lesson/${n}/${k}">${t}${k === "practice" && ls.score ? ` <small>${ls.score}%</small>` : ""}</button>`).join("")}</nav>
      <div class="lbody"></div>
      <div class="lnav">${n > 1 ? `<button class="btn ghost" data-go="lesson/${n - 1}">‹ L${n - 1}</button>` : "<span></span>"}${n < 42 ? `<button class="btn ghost" ${Store.unlocked(n + 1) ? `data-go="lesson/${n + 1}"` : "disabled"}>L${n + 1} ›</button>` : ""}</div>`;
    const body = el.querySelector(".lbody");
    ({ learn, read, practice, exam, speak }[tab] || learn)(body, l, ls);
  };

  function learn(el, l, ls) {
    ls.read = true; Store.save();
    el.innerHTML = `
      <section class="card"><h3>Explanation</h3>${l.expl.map((p) => `<p>${md(p)}</p>`).join("")}
        <p class="use"><b>When do I use it?</b> ${md(l.use)}</p>
        <button class="btn ghost sm" data-ask="Explain ${esc(l.title)} with mistakes to avoid">Ask Max: how NOT to use it</button></section>
      ${l.table.length ? `<section class="card"><h3>Grammar table</h3>${UI.table(l.table, "lvl-" + l.level)}</section>` : ""}
      <section class="card"><h3>10 examples <button class="btn ghost sm playall">Play all</button></h3>
        <ol class="exs">${l.examples.map((e) => `<li><span class="de">${UI.colorArticles(e.de)}</span> ${UI.say(e.de)}<br><span class="en">${esc(e.en)}</span></li>`).join("")}</ol></section>
      <section class="card"><h3>Vocabulary</h3>
        <ul class="vocab">${l.vocab.map((w) => `<li><span class="${H.genderClass(w.de)}">${esc(w.de)}</span> ${UI.say(w.de.split(",")[0])}<span class="en">${esc(w.en)}</span><button class="chip ext" data-url="https://www.linguee.com/german-english/search?query=${encodeURIComponent(w.de.replace(/^(der|die|das)\s+/, "").split(",")[0])}">Linguee ↗</button></li>`).join("")}</ul>
        <button class="btn sm addcards">Add these words to my review deck</button></section>
      <div class="row center"><button class="btn sign" data-go="lesson/${l.n}/read">Next: read the text</button></div>`;
    el.querySelector(".playall").onclick = async () => {
      for (const e of l.examples) { Speech.speak(e.de); await new Promise((r) => setTimeout(r, 900 + e.de.length * 75 / (Store.get().settings.rate || 0.9))); if (!document.body.contains(el)) break; }
    };
    el.querySelector(".addcards").onclick = () => {
      let c = 0; V.vocabList().filter((w) => w.lesson === l.n).forEach((w) => { if (!SRS.card(w.id)) { SRS.grade(w.id, 1); Store.get().srs[w.id].due = Date.now(); c++; } });
      Store.save(); H.toast(c ? `${c} words added – review them under Words.` : "Already in your deck.");
    };
  }

  function read(el, l) {
    const words = l.reading.split(/(\s+)/).map((w) => (/\S/.test(w) ? `<span class="w">${esc(w)}</span>` : w)).join("");
    const answered = l.exam.slice(0, 3).filter((q) => q.a);
    el.innerHTML = `
      <section class="card"><h3>Reading <span class="row inline">${UI.say(l.reading, "Play")}<button class="btn ghost sm slow">Slow</button></span></h3>
        <div class="reading">${words}</div><p class="muted small">Tap a word to look it up.</p><div class="lookup" hidden></div></section>
      <section class="card"><h3>Did you understand?</h3>${answered.map((q, i) => `<div class="rq" data-i="${i}"><p>${md(q.q)}</p><form class="q-form"><input class="q-in" placeholder="Answer in German"><button class="btn sm">Check</button></form><p class="rfb muted" hidden></p></div>`).join("")}</section>
      <div class="row center"><button class="btn sign" data-go="lesson/${l.n}/practice">Next: practise</button></div>`;
    el.querySelector(".slow").onclick = () => Speech.speak(l.reading, 0.7);
    const lk = el.querySelector(".lookup");
    el.querySelectorAll(".w").forEach((w) => (w.onclick = () => V.lookupWord(w.textContent, lk)));
    el.querySelectorAll(".rq").forEach((box) => {
      const q = answered[+box.dataset.i];
      box.querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        const v = box.querySelector("input").value; const sc = Grade.overlap(v, q.a);
        const f = box.querySelector(".rfb"); f.hidden = false;
        f.innerHTML = `${sc >= 0.5 ? "✓ Good." : "Compare:"} Model answer: <b>${esc(q.a)}</b>`;
        if (sc >= 0.5) Store.addXP(5);
      };
    });
  }

  V.lookupWord = (raw, box) => {
    const w = raw.replace(/[.,!?„“":;()]/g, "");
    const hits = Tutor.dict(w);
    let html = hits.length ? hits.slice(0, 2).map((x) => `<b>${esc(x.de)}</b> = ${esc(x.en)}`).join("<br>") : "";
    if (!html) {
      const fin = Tutor.check ? null : null;
      const guess = Tutor.dict(w.toLowerCase().replace(/(e|st|t|en)$/, "en"));
      html = guess.length ? `Probably a form of <b>${esc(guess[0].de)}</b> = ${esc(guess[0].en)}` : `„${esc(w)}“ isn't in the offline word list.`;
    }
    box.hidden = false;
    box.innerHTML = `${html} ${UI.say(w)} <button class="link" data-ask="What does ${esc(w)} mean?">Ask Max</button><br>${UI.dictLinks(w)}`;
  };

  function practice(el, l, ls) {
    const tasks = l.tasks;
    const gens = Engine.forLesson(l.n);
    const scoreNow = () => Math.round((Object.values(ls.tasks).filter(Boolean).length / tasks.length) * 100);
    el.innerHTML = `
      <section class="card"><h3>Lesson exercises</h3><p class="muted small">Type the answer. Several gaps: write them in order (e.g. „stehe auf“). [Mix] tasks combine earlier lessons.</p>
        <ol class="tasks">${tasks.map((t, i) => `<li class="task ${ls.tasks[i] === true ? "ok" : ls.tasks[i] === false ? "bad" : ""}" data-i="${i}">${UI.reportBtn({ id: `L${l.n}-task${i + 1}`, lesson: l.n, part: "Practice " + (i + 1), q: t.q, a: t.a })}
          <p>${md(t.q).replace("[Mix]", '<span class="mix">Mix</span>')}</p>
          <form class="q-form"><input class="q-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Answer"><button class="btn sm">Check</button></form>
          <div class="tfb" hidden></div></li>`).join("")}</ol>
        ${UI.umlautBar()}
        <div class="scorebox"><span>Score: <b class="sc">${scoreNow()}%</b></span><span class="muted">70 % completes the lesson</span></div>
      </section>
      ${gens.length ? `<section class="card"><h3>Unlimited practice</h3><p class="muted small">New sentences are generated every time, with the reasoning for each answer.</p><div class="genbox"></div></section>` : ""}`;
    let lastInput = null;
    el.querySelectorAll(".q-in").forEach((i) => i.addEventListener("focus", () => (lastInput = i)));
    UI.bindUmlauts(el, { get value() { return lastInput ? lastInput.value : ""; }, set value(v) { if (lastInput) lastInput.value = v; }, get selectionStart() { return lastInput ? lastInput.selectionStart : 0; }, get selectionEnd() { return lastInput ? lastInput.selectionEnd : 0; }, focus() { lastInput && lastInput.focus(); }, setSelectionRange(a, b) { lastInput && lastInput.setSelectionRange(a, b); } });
    el.querySelectorAll(".task").forEach((li) => {
      const i = +li.dataset.i, t = tasks[i];
      const f = li.querySelector(".tfb");
      const mark = (ok) => {
        ls.tasks[i] = ok; li.className = "task " + (ok ? "ok" : "bad");
        ls.score = Math.max(ls.score || 0, scoreNow());
        el.querySelector(".sc").textContent = scoreNow() + "%";
        if (!ls.done && scoreNow() >= 70) { ls.done = true; Store.addXP(50); H.toast(`Lesson ${l.n} complete! Lesson ${l.n + 1} is open.`, "good"); }
        Store.save();
      };
      li.querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        const inp = li.querySelector("input"); if (!inp.value.trim()) return;
        const open = !t.a || /^z\.\s?B\./.test(t.a);
        const g = open ? { ok: true } : Grade.grade(inp.value, t.a);
        f.hidden = false;
        if (open) {
          const r = Tutor.check(inp.value);
          f.innerHTML = r.issues.length ? `Max suggests: <b>${esc(r.fixed)}</b><br><span class="muted">${r.issues.map((x) => x.why).join(" ")}</span>` : "✓ No rule problems found.";
          mark(!r.issues.length);
          return;
        }
        f.innerHTML = `${g.ok ? "✓" : "✗"} <b>${esc(t.a)}</b> ${g.note ? `<span class="muted">${esc(g.note)}</span>` : ""} ${!g.ok ? `<button class="link ov">I was right</button> <button class="link" data-ask="${esc(`Why is the answer „${t.a}“ in: ${t.q}`)}">Why?</button>` : ""}`;
        const ov = f.querySelector(".ov"); if (ov) ov.onclick = () => { mark(true); ov.remove(); };
        Store.topic("lesson" + l.n, g.ok); Store.addXP(g.ok ? 5 : 1);
        if (!g.ok) Store.mistake({ prompt: md(t.q), answer: t.a, given: inp.value, lesson: l.n });
        mark(g.ok);
      };
    });
    const gb = el.querySelector(".genbox");
    if (gb) {
      const run = () => UI.item(gb, Engine.generate(H.pick(gens)), { noFocus: true, onNext: run });
      run();
    }
  }

  function exam(el, l, ls) {
    el.innerHTML = `<section class="card"><h3>10 exam questions</h3><p class="muted small">Closed questions are checked automatically. Open questions: write or speak, then let Max check your German.</p>
      ${l.exam.map((q, i) => `<div class="eq" data-i="${i}">${UI.reportBtn({ id: `L${l.n}-exam${i + 1}`, lesson: l.n, part: "Exam " + (i + 1), q: q.q, a: q.a })}<p><b>${i + 1}.</b> ${md(q.q)}</p>
        ${q.a && !/^z\.\s?B\./.test(q.a) ? `<form class="q-form"><input class="q-in" autocomplete="off" placeholder="Answer"><button class="btn sm">Check</button></form>` :
          `<textarea rows="3" placeholder="Write your answer in German…"></textarea><div class="row">${UI.mic("Speak")}<button class="btn sm chk">Check with Max</button>${q.a ? `<button class="btn ghost sm model">Model answer</button>` : ""}</div>`}
        <div class="efb" hidden></div></div>`).join("")}</section>`;
    el.querySelectorAll(".eq").forEach((box) => {
      const q = l.exam[+box.dataset.i]; const f = box.querySelector(".efb");
      const form = box.querySelector("form");
      if (form) form.onsubmit = (e) => {
        e.preventDefault(); const v = box.querySelector("input").value;
        const g = Grade.grade(v, q.a); const ov = Grade.overlap(v, q.a);
        const ok = g.ok || ov >= 0.6;
        f.hidden = false; f.innerHTML = `${ok ? "✓" : "✗"} Model answer: <b>${esc(q.a)}</b>`;
        ls.exam[box.dataset.i] = ok; Store.addXP(ok ? 5 : 1); Store.save();
      };
      const ta = box.querySelector("textarea");
      if (ta) {
        UI.bindMic(box, (t) => { ta.value = (ta.value ? ta.value + " " : "") + t; });
        box.querySelector(".chk").onclick = () => {
          const sents = ta.value.split(/(?<=[.!?])\s+/).filter((x) => x.trim());
          if (!sents.length) return H.toast("Write or speak an answer first.");
          const res = sents.map((s) => Tutor.check(s));
          const errs = res.reduce((a, r) => a + r.issues.length, 0);
          const conn = (ta.value.match(/\b(weil|dass|wenn|obwohl|deshalb|trotzdem|aber|denn|außerdem|zuerst|dann|danach)\b/gi) || []).length;
          f.hidden = false;
          f.innerHTML = `<p>${sents.length} sentence(s), ${ta.value.split(/\s+/).filter(Boolean).length} words, ${conn} connector(s). ${errs ? `${errs} possible error(s):` : "No rule problems found."}</p>${res.filter((r) => r.issues.length).map((r) => `<p class="ex ok">${esc(r.fixed)}</p><ul class="nots">${r.issues.map((x) => `<li>${x.rule}<br><span class="muted">${x.why}</span></li>`).join("")}</ul>`).join("")}${conn < 2 ? `<p class="muted">Tip: link your ideas with weil, deshalb, außerdem, obwohl.</p>` : ""}`;
          Store.addXP(8);
        };
        const m = box.querySelector(".model"); if (m) m.onclick = () => { f.hidden = false; f.innerHTML = `Model: <b>${esc(q.a)}</b>`; };
      }
    });
  }

  function speak(el, l, ls) {
    el.innerHTML = `<section class="card"><h3>Speak about the picture</h3><div class="scene">${DC.scenes[l.scene] || ""}</div>
      <ol class="prompts">${l.speak.map((p) => `<li>${md(p)}</li>`).join("")}</ol>
      <p class="muted small">Goal: talk for 2 minutes and use „${esc(l.title)}“ at least 3 times. Useful starters: Auf dem Bild sehe ich … · Links/rechts … · Ich glaube, dass …</p>
      <div class="row"><button class="btn ghost timer">Start 2-min timer</button>${UI.mic("Speak a sentence")}</div>
      <div class="transcript"></div></section>
      <section class="card"><h3>Shadow the examples</h3><p class="muted small">Listen, then repeat. You get a score for each word.</p><div class="shadow"></div></section>`;
    const tr = el.querySelector(".transcript");
    UI.bindMic(el.querySelector(".card"), (t) => {
      const r = Tutor.check(t);
      ls.spoke = true; Store.addXP(6); Store.save();
      tr.insertAdjacentHTML("beforeend", `<div class="said"><p>🗣️ ${esc(t)}</p>${r.issues.length ? `<p class="ex ok">${esc(r.fixed)} ${UI.say(r.fixed)}</p><p class="muted">${r.issues.map((x) => x.why).join(" ")}</p>` : `<p class="muted">✓ No rule problems found.</p>`}</div>`);
    });
    const tb = el.querySelector(".timer"); let tm = null;
    tb.onclick = () => {
      if (tm) { clearInterval(tm); tm = null; tb.textContent = "Start 2-min timer"; return; }
      let left = 120; tb.textContent = "2:00";
      tm = setInterval(() => { left--; tb.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0 || !document.body.contains(tb)) { clearInterval(tm); tm = null; tb.textContent = "Time's up – well done!"; ls.spoke = true; Store.addXP(10); } }, 1000);
    };
    V.shadow(el.querySelector(".shadow"), l.examples.map((e) => e.de));
  }

  V.shadow = (box, sentences) => {
    let i = 0;
    const draw = () => {
      const s = sentences[i % sentences.length];
      box.innerHTML = `<p class="ex big">${esc(s)}</p><div class="row">${UI.say(s, "Listen")}<button class="btn ghost sm slowb">Slow</button>${UI.mic("Repeat")}<button class="btn ghost sm nx">Next</button></div><div class="sfb"></div>`;
      box.querySelector(".slowb").onclick = () => Speech.speak(s, 0.65);
      box.querySelector(".nx").onclick = () => { i++; draw(); };
      UI.bindMic(box, (t) => {
        const d = Grade.wordDiff(s, t);
        box.querySelector(".sfb").innerHTML = `<p class="diff">${d.words.map((w) => `<span class="${w.ok ? "hit" : "miss"}">${esc(w.w)}</span>`).join(" ")}</p><p><b>${d.score}%</b> · heard: <i>${esc(t)}</i></p>`;
        Store.addXP(d.score >= 80 ? 6 : 2);
      });
    };
    draw();
  };
})();
