/* Deutsch Coach – views: Start, course map, lesson */
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

  /* ---------------- Start ("Heute") ----------------
     One screen, one decision: the big button always shows the single most useful next step.
     Everything else (quests, week, league, tools) is there to glance at, not to choose from. */
  V.home = (el) => {
    const s = Store.get(); const p = V.profile();
    const goal = s.settings.goal || 50; const todayXP = s.days[Store.today()] || 0;
    const pct = Math.round((todayXP / goal) * 100);
    const sv = Habit.streakView(); const lv = Habit.level(s.xp); const nx = Habit.next();
    const l = p.next; const ls = Store.lesson(l.n); const partsDone = Habit.partsDone(l.n);
    const hr = new Date().getHours();
    const hello = hr < 5 ? "Gute Nacht" : hr < 11 ? "Guten Morgen" : hr < 18 ? "Guten Tag" : "Guten Abend";
    const league = Habit.league();
    const back = s.streak && s.streak.lost >= 3 && !sv.today && sv.count <= 1;
    el.innerHTML = `
    <div class="h-top"><h2 class="hello">${hello}${Store.name() ? `, <span>${esc(Store.name())}</span>` : ""}!</h2>
      <button class="lvchip" data-go="stats" aria-label="Level ${lv.n}, ${lv.pct}% to next level"><b>Lv ${lv.n}</b><span>${esc(lv.title)}</span><i style="--p:${lv.pct}%"></i></button></div>
    <div class="home-grid"><div class="col-a">
    ${back ? `<section class="card welcome"><p>👋 <b>Willkommen zurück!</b> <i class="muted">(Welcome back!)</i> Breaks happen. One short session today starts a new streak – and you keep everything you learned.</p></section>` : ""}
    ${(() => { const sp = Views.starterProgress && Views.starterProgress(); const l1 = s.lessons[DC.curriculum[0].n] || {};
        return sp && sp.done < sp.total && !l1.done && (s.starterMode || sp.done > 0 || !s.xp) ? `<button class="st-entry" data-go="${sp.next ? "starter/u/" + sp.next.id : "starter"}"><span class="st-pic">🐣</span><span><b>${H.bi("Erste Schritte", "First steps – German from zero")}</b><span>Picture cards and 3-minute rounds · ${sp.done}/${sp.total} units${sp.next ? " · next: " + esc(sp.next.en) : ""}</span></span></button>` : ""; })()}
    <section class="hero" aria-label="Today">
      <div class="hero-row">
        ${Habit.ring(pct, 116, 12, `<b>${todayXP}</b><span>/ ${goal} XP</span>`)}
        <div class="hero-side">
          <div class="flame ${sv.today ? "lit" : sv.atRisk ? "risk" : ""}"><span class="fl">🔥</span><b>${sv.count}</b><span>${sv.count === 1 ? "day" : "days"}</span></div>
          <div class="freeze" title="Streak freezes protect your streak on a missed day">❄️ ${sv.freezes}/2 freeze${sv.freezes === 1 ? "" : "s"}</div>
          <p class="muted small">${pct >= 100 ? "Tagesziel erreicht ✓ (daily goal reached)" : sv.today ? `${goal - todayXP} XP to today's goal` : sv.atRisk ? "Learn today to keep your streak" : sv.willFreeze ? "A freeze will cover the missed day" : "Start your streak today"}</p>
        </div>
      </div>
      <button class="btn sign big-btn go-next" data-go="${nx.go}"><span>${pct >= 100 ? "Keep going" : sv.today ? "Continue" : "Start"}: ${esc(nx.label)}</span><small>${esc(nx.sub)} · ~${nx.min} min</small></button>
    </section>
    <section class="week" aria-label="This week">${Habit.week().map((d) => `<div class="wd ${d.xp >= goal ? "met" : d.xp ? "some" : ""} ${d.frozen ? "frz" : ""} ${d.today ? "today" : ""} ${d.future ? "fut" : ""}"><span>${d.n}</span><i>${d.frozen ? "❄" : d.xp >= goal ? "✓" : d.xp ? "•" : ""}</i></div>`).join("")}</section>
    <section class="card quests"><h3>${H.bi("Tagesquests", "Daily quests · new at midnight")}</h3>
      ${Habit.quests().map((q) => `<div class="quest ${q.done ? "done" : ""}"><span class="qic">${q.done ? "✅" : q.ic}</span><div class="qt"><span>${esc(q.t)}</span><div class="pbar sm"><span style="width:${Math.round((q.have / q.target) * 100)}%"></span></div></div><small>${q.have}/${q.target}</small></div>`).join("")}
    </section>
    </div><div class="col-b">
    <section class="board lvl-${l.level}" aria-label="Your lesson">
      <div class="board-top"><span>Lesson ${l.pos} of ${DC.curriculum.length}</span><span>${UI.levelDot(l.level)}</span></div>
      <div class="board-title">${H.lt(l)}</div>
      <div class="board-sub">${H.lt(l, "theme")}</div>
      <div class="dots" aria-label="${partsDone} of 5 parts done">${[0, 1, 2, 3, 4].map((i) => `<i class="${i < partsDone ? "on" : ""}"></i>`).join("")}<span>${partsDone}/5</span></div>
      <button class="btn ghost-light sm" data-go="lesson/${l.n}">${ls.read ? "Open lesson" : "Start lesson"}</button>
    </section>
    <section class="grid2 tools">
      <button class="tile" data-go="vocab"><span class="ti">🗂</span><b>${H.bi("Wörter", "Words")}</b><span>${p.due ? `${p.due} due` : "Learn new words"}</span></button>
      <button class="tile" data-go="listen"><span class="ti">🎧</span><b>${H.bi("Hören", "Listening")}</b><span>Dictation</span></button>
      <button class="tile" data-go="speak"><span class="ti">🎙</span><b>${H.bi("Sprechen", "Speaking")}</b><span>Shadowing & talk</span></button>
      <button class="tile" data-go="translate"><span class="ti">⇄</span><b>${H.bi("Übersetzen", "Translate")}</b><span>DeepL, LEO, offline</span></button>
    </section>
    ${league.length > 1 ? `<section class="card league"><h3>${H.bi("Familien-Liga", "Family league · this week")}</h3><ol>${league.map((x, i) => `<li class="${x.me ? "me" : ""}"><span class="rk">${["🥇", "🥈", "🥉"][i] || i + 1}</span><span class="av" style="background:${x.color}">${esc((x.name || "?").charAt(0).toUpperCase())}</span><span class="nm">${esc(x.name)}</span><b>${x.xp} XP</b></li>`).join("")}</ol></section>`
      : `<section class="card league solo"><p>👨‍👩‍👧 <b>Learn together.</b> Add a profile for a friend or family member on this device and compete in a weekly league.</p><button class="btn ghost sm addp">Add a learner</button></section>`}
    ${p.weak.length ? `<section class="card"><h3>Needs practice</h3><div class="chips">${p.weak.map((w) => `<button class="chip" data-go="practice/${w.id}">${esc(w.title)} · ${w.pct}%</button>`).join("")}</div></section>` : ""}
    ${(() => { const r = s.resume; return r && Date.now() - r.at < 3 * 864e5 && r.route !== "home" && r.route !== nx.go
        ? `<section class="card slim"><p>↩︎ <b>Continue where you left off</b> <span class="muted small">${esc(r.route)}</span></p><button class="btn ghost sm" data-go="${esc(r.route)}">Continue</button></section>` : ""; })()}
    ${s.plan ? (() => { const pl = s.plan, left = Math.max(0, Math.round((pl.deadline - Date.now()) / 864e5));
        return `<section class="card slim lvl-${pl.level}"><p>🎯 <b>${pl.level} in ${left} days</b> · ${pl.minutes} min a day</p><button class="btn ghost sm" data-go="daily">Today's plan</button></section>`; })()
      : `<section class="card slim"><p>🎯 <b>${s.placement ? "Give your level a date." : "Not sure of your level?"}</b></p><button class="btn ghost sm" data-go="${s.placement ? "plan" : "placement"}">${s.placement ? "Make a plan" : "Placement test"}</button></section>`}
    ${!s.settings.reminder ? `<section class="card slim"><p>⏰ <b>Pick a learning time.</b> <span class="muted small">People who fix a time keep going much longer.</span></p><button class="btn ghost sm" data-go="settings">Set reminder</button></section>` : ""}
    ${(() => { const month = 30 * 864e5, last = s.lastBackup || 0, snooze = s.backupSnooze || 0;
      return s.xp >= 200 && Date.now() - last > month && Date.now() > snooze && Date.now() - (s.created || 0) > 14 * 864e5
        ? `<section class="card remind"><p>💾 <b>Save a backup?</b> Progress lives only on this device.</p><div class="row"><button class="btn sign sm bk-now">Export backup</button><button class="btn ghost sm bk-later">Later</button></div></section>` : ""; })()}
    <div class="novoice"></div>
    </div></div>
    <p class="credit muted small">${App.credit()}</p>`;
    const bn = el.querySelector(".bk-now"); if (bn) bn.onclick = () => { App.backup(); el.querySelector(".remind").remove(); };
    const bl = el.querySelector(".bk-later"); if (bl) bl.onclick = () => { s.backupSnooze = Date.now() + 30 * 864e5; Store.save(); el.querySelector(".remind").remove(); };
    const ap = el.querySelector(".addp"); if (ap) ap.onclick = App.profileSheet;
    if (!s.voiceWarned) App.voiceStatus().then((v) => { if (v === "none" && document.body.contains(el)) { const nv = el.querySelector(".novoice"); if (nv) nv.innerHTML = `<section class="card">${App.voiceHelp()}<button class="btn ghost sm nv-ok">Got it</button></section>`; const ok = el.querySelector(".nv-ok"); if (ok) ok.onclick = () => { s.voiceWarned = true; Store.save(); nv.innerHTML = ""; }; } });
  };

  /* ---------------- course map ---------------- */
  V.path = (el) => {
    const s = Store.get();
    const sp = Views.starterProgress ? Views.starterProgress() : null;
    let html = `<h2 class="page-title">${H.bi("Dein Kurs von A1 bis C2", "Your course from A1 to C2")}</h2>
      <button class="st-entry" data-go="starter"><span class="st-pic">🐣</span><span><b>${H.bi("Erste Schritte", "First steps")}${sp && sp.done ? ` · ${sp.done}/${sp.total}` : ""}</b><span>New to German? Start here: picture cards, sound and tiny rounds before Lesson 1.</span></span></button>
      <p class="muted">Finish a lesson (score ≥ 70 %) to open the next one. Later lessons reuse earlier grammar.</p><ol class="line">`;
    let prevLvl = null;
    LESSONS().forEach((l) => {
      if (l.level !== prevLvl) {
        html += `<li class="transfer lvl-${l.level}"><span class="dot"></span><span>${prevLvl ? `Level ${l.level} starts` : `Level ${l.level} starts`}</span></li>`;
        prevLvl = l.level;
      }
      const st = s.lessons[l.n] || {};
      const open = Store.unlocked(l.n);
      const cur = open && !st.done && !LESSONS().some((x) => Course.before(x.n, l.n) && !(s.lessons[x.n] || {}).done);
      html += `<li class="stop lvl-${l.level} ${st.done ? "done" : ""} ${cur ? "current" : ""} ${open ? "" : "locked"}">
        <span class="dot"></span>
        <button class="stop-btn" ${open ? `data-go="lesson/${l.n}"` : "disabled"}>
          <span class="stop-n">${l.pos}</span><span class="stop-t">${H.lt(l)}<small>${esc(H.ltText(l, "theme"))}${st.score ? ` · ${st.score}%` : ""}${open ? "" : " · locked"}</small></span>
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
    const pv = Course.prev(n), nx = Course.next(n);
    if (!Store.unlocked(n)) return (el.innerHTML = UI.empty(`Lesson ${l.pos} opens when you finish lesson ${pv.pos}.`, `<button class="btn" data-go="lesson/${pv.n}">Go to lesson ${pv.pos}</button>`));
    const ls = Store.lesson(n);
    const titles = Object.fromEntries(LESSONS().map((x) => [x.n, x.title]));
    el.innerHTML = `
      <header class="lhead lvl-${l.level}">
        <div class="lhead-row"><button class="back" data-go="path" aria-label="Back">‹</button><span>Lesson ${l.pos} · ${l.level}</span>${ls.done ? `<span class="badge">done ${ls.score}%</span>` : ""}</div>
        <h2>${H.lt(l)}</h2><p>${H.lt(l, "theme")}</p>
      </header>
      ${l.rec.length ? `<details class="recap"><summary>Builds on ${l.rec.length} earlier lesson${l.rec.length > 1 ? "s" : ""}</summary>${l.rec.map((r) => `<button class="chip" data-go="lesson/${r}">L${r} ${esc(titles[r])}</button>`).join("")}</details>` : ""}
      <nav class="tabs steps" role="tablist">${TABS.map(([k, t], i) => { const dn = (ls.parts && ls.parts[k]) || (k === "practice" && ls.done); return `<button role="tab" aria-selected="${k === tab}" class="tab ${k === tab ? "on" : ""} ${dn ? "dn" : ""}" data-go="lesson/${n}/${k}"><span class="stepn">${dn ? "✓" : i + 1}</span>${t}${k === "practice" && ls.score ? ` <small>${ls.score}%</small>` : ""}</button>`; }).join("")}</nav>
      <div class="lbody"></div>
      <div class="lnav">${pv ? `<button class="btn ghost" data-go="lesson/${pv.n}">‹ L${pv.pos}</button>` : "<span></span>"}${nx ? `<button class="btn ghost" ${Store.unlocked(nx.n) ? `data-go="lesson/${nx.n}"` : "disabled"}>L${nx.pos} ›</button>` : ""}</div>`;
    const body = el.querySelector(".lbody");
    ({ learn, read, practice, exam, speak }[tab] || learn)(body, l, ls);
  };

  /* the button at the end of every part: always a way forward */
  function partNav(l, ls, part) {
    const nx = Course.next(l.n);
    if (part === "practice") return `<div class="partnav"><button class="btn sign big-btn nextpart" data-go="lesson/${l.n}/exam">Next: exam questions →</button>
      <p class="muted small">${ls.done ? `✓ Lesson complete (${ls.score}%).` : `Your score: <b class="sc2">${ls.score || 0}%</b>. 70 % here opens ${nx ? `lesson ${nx.pos}` : "the certificate"} – you can come back any time.`}</p></div>`;
    if (part === "exam") return `<div class="partnav"><button class="btn sign big-btn nextpart" data-go="lesson/${l.n}/speak">Next: speaking →</button><p class="muted small">Answer at least 4 questions to tick off this part.</p></div>`;
    if (part === "speak") {
      const go = nx && Store.unlocked(nx.n) ? `lesson/${nx.n}` : ls.done ? "home" : `lesson/${l.n}/practice`;
      const label = nx && Store.unlocked(nx.n) ? `Finish – next: lesson ${nx.pos} →` : ls.done ? "Finish lesson ✓" : "Finish – back to practice (70 % opens the next lesson)";
      return `<div class="partnav"><button class="btn sign big-btn nextpart finish" data-go="${go}">${label}</button><button class="btn ghost" data-go="home">${H.bi("Heute", "Today")}</button></div>`;
    }
    return "";
  }

  function learn(el, l, ls) {
    ls.read = true; Store.save();
    el.innerHTML = `
      <section class="card"><h3>Explanation</h3>${H.lexpl(l)}
        <button class="btn ghost sm" data-ask="Explain ${esc(l.title)} with mistakes to avoid">Ask Max: how NOT to use it</button></section>
      ${l.table.length ? `<section class="card"><h3>Grammar table</h3>${UI.table(l.table, "lvl-" + l.level)}</section>` : ""}
      <section class="card"><h3>${l.examples.length} examples <button class="btn ghost sm playall">Play all</button></h3>
        <ol class="exs">${l.examples.map((e) => `<li><span class="de">${UI.colorArticles(e.de)}</span> ${UI.say(e.de)}<br><span class="en">${esc(e.en)}</span></li>`).join("")}</ol></section>
      <section class="card"><h3>Vocabulary</h3>
        <ul class="vocab">${l.vocab.map((w) => `<li><span class="${H.genderClass(w.de)}">${esc(w.de)}</span> ${UI.say(w.de.split(",")[0])}<span class="en">${esc(w.en)}</span><button class="chip ext" data-url="https://www.linguee.com/german-english/search?query=${encodeURIComponent(w.de.replace(/^(der|die|das)\s+/, "").split(",")[0])}">Linguee ↗</button></li>`).join("")}</ul>
        <button class="btn sm addcards">Add these words to my review deck</button></section>
      <div class="row center"><button class="btn sign big-btn nextpart" data-go="lesson/${l.n}/read">Got it – next: read the text</button></div>`;
    el.querySelector(".nextpart").addEventListener("click", () => window.Habit && Habit.markPart(l.n, "learn"));
    el.querySelector(".playall").onclick = () => { const key = "L" + l.n + "-all"; if (Speech.isPlaying(key)) return Speech.stop(); Speech.play(l.examples.map((e) => e.de), { key }); };
    el.querySelector(".addcards").onclick = () => {
      let c = 0; V.vocabList().filter((w) => w.lesson === l.n).forEach((w) => { if (!SRS.card(w.id)) { SRS.grade(w.id, 1); Store.get().srs[w.id].due = Date.now(); c++; } });
      Store.save(); H.toast(c ? `${c} words added – review them under Words.` : "Already in your deck.");
    };
  }

  function read(el, l) {
    if (window.Habit) Habit.markPart(l.n, "learn");   // reaching the text means the rule was seen
    const words = l.reading.split(/(\s+)/).map((w) => (/\S/.test(w) ? `<span class="w">${esc(w)}</span>` : w)).join("");
    const answered = l.exam.slice(0, 3).filter((q) => q.a);
    el.innerHTML = `
      <section class="card"><h3>Reading <span class="row inline">${UI.say(l.reading, "Play")}<button class="btn ghost sm slow">Slow</button></span></h3>
        <div class="reading">${words}</div><p class="muted small">Tap a word to look it up.</p><div class="lookup" hidden></div></section>
      ${l.reading2 ? `<section class="card read2"><h3>${esc(l.reading2.title)} ${UI.say(l.reading2.text, "Play")}</h3><div class="reading">${l.reading2.text.split(/(\s+)/).map((w) => (/\S/.test(w) ? `<span class="w">${esc(w)}</span>` : w)).join("")}</div><div class="lookup" hidden></div></section>` : ""}
      ${l.dialog ? `<section class="card"><h3>🎧 ${H.bi("Hörszene", "Listening scene")}</h3><p class="muted small">Listen first without reading. Then answer, then check the transcript.</p>
        <div class="row"><button class="btn sign sm dplay">▶ Play dialogue</button><button class="btn ghost sm dslow">Slow</button><button class="btn ghost sm dshow">Show transcript</button></div>
        <div class="dlg blur">${l.dialog.map((d) => `<p><b>${esc(d.who)}:</b> ${esc(d.de)}</p>`).join("")}</div>
        ${(l.dq || []).map((q, i) => `<div class="rq dq" data-i="${i}"><p>${md(q.q)} ${UI.hint(q.q)}</p><form class="q-form"><input class="q-in" placeholder="Answer"><button class="btn sm">Check</button></form><p class="rfb muted" hidden></p></div>`).join("")}</section>` : ""}
      <section class="card"><h3>Did you understand?</h3>${answered.map((q, i) => `<div class="rq" data-i="${i}"><p>${md(q.q)} ${UI.hint(q.q)}</p><form class="q-form"><input class="q-in" placeholder="Answer in German"><button class="btn sm">Check</button></form><p class="rfb muted" hidden></p></div>`).join("")}</section>
      <div class="row center"><button class="btn sign big-btn nextpart" data-go="lesson/${l.n}/practice">Next: practise</button></div>`;
    el.querySelector(".nextpart").addEventListener("click", () => window.Habit && Habit.markPart(l.n, "read"));
    el.querySelector(".slow").onclick = () => Speech.speak(l.reading, 0.7);
    if (l.reading2) {
      const r2 = el.querySelector(".read2 .reading"); r2.querySelectorAll(".w").forEach((w) => (w.onclick = () => V.lookupWord(w.textContent, el.querySelector(".read2 .lookup"))));
    }
    if (l.dialog) {
      const who = [...new Set(l.dialog.map((d) => d.who))];
      const play = (rate) => Speech.play(l.dialog.map((d) => d.de), { rate, key: "dlg" + l.n, pitches: l.dialog.map((d) => [1, 1.35, 0.8][who.indexOf(d.who) % 3]) });
      el.querySelector(".dplay").onclick = () => play();
      el.querySelector(".dslow").onclick = () => play(0.7);
      el.querySelector(".dshow").onclick = (e) => { el.querySelector(".dlg").classList.toggle("blur"); e.target.textContent = el.querySelector(".dlg").classList.contains("blur") ? "Show transcript" : "Hide transcript"; };
      el.querySelectorAll(".dq").forEach((box) => {
        const q = l.dq[+box.dataset.i];
        box.querySelector("form").onsubmit = (e) => {
          e.preventDefault(); const v = box.querySelector("input").value; if (!v.trim()) return;
          const ok = Grade.grade(v, q.a).ok || Grade.overlap(v, q.a) >= 0.5;
          const f = box.querySelector(".rfb"); f.hidden = false; f.innerHTML = `${ok ? "✓" : "✗"} <b>${esc(q.a)}</b>`;
          if (window.Habit) Habit.track("listen"); Store.addXP(ok ? 5 : 1);
        };
      });
    }
    const lk = el.querySelector(".lookup");
    el.querySelectorAll(".w").forEach((w) => (w.onclick = () => V.lookupWord(w.textContent, lk)));
    el.querySelectorAll(".rq:not(.dq)").forEach((box) => {
      const q = answered[+box.dataset.i];
      box.querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        const v = box.querySelector("input").value; const sc = Grade.overlap(v, q.a);
        const f = box.querySelector(".rfb"); f.hidden = false;
        f.innerHTML = `${sc >= 0.5 ? "✓ Good." : "Compare:"} Model answer: <b>${esc(q.a)}</b>`;
        if (sc >= 0.5) Store.addXP(5); if (window.Habit) { Habit.markPart(l.n, "read"); Habit.track("read"); }
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
      ${gens.length ? `<section class="card"><h3>Unlimited practice</h3><p class="muted small">New sentences are generated every time, with the reasoning for each answer.</p><div class="genbox"></div></section>` : ""}
      ${partNav(l, ls, "practice")}`;
    let lastInput = null;
    el.querySelectorAll(".q-in").forEach((i) => i.addEventListener("focus", () => (lastInput = i)));
    UI.bindUmlauts(el, { get value() { return lastInput ? lastInput.value : ""; }, set value(v) { if (lastInput) lastInput.value = v; }, get selectionStart() { return lastInput ? lastInput.selectionStart : 0; }, get selectionEnd() { return lastInput ? lastInput.selectionEnd : 0; }, focus() { lastInput && lastInput.focus(); }, setSelectionRange(a, b) { lastInput && lastInput.setSelectionRange(a, b); } });
    el.querySelectorAll(".task").forEach((li) => {
      const i = +li.dataset.i, t = tasks[i];
      const f = li.querySelector(".tfb");
      const mark = (ok) => {
        ls.tasks[i] = ok; li.className = "task " + (ok ? "ok" : "bad");
        ls.score = Math.max(ls.score || 0, scoreNow());
        el.querySelector(".sc").textContent = scoreNow() + "%"; const s2 = el.querySelector(".sc2"); if (s2) s2.textContent = scoreNow() + "%";
        if (!ls.done && scoreNow() >= 70) { ls.done = true; if (window.Habit) Habit.markPart(l.n, "practice"); Store.addXP(50); setTimeout(() => window.Habit && Habit.celebrate(`Lektion ${l.pos} geschafft! (Lesson done)`, `${scoreNow()} % · ${Course.next(l.n) ? "Lesson " + Course.next(l.n).pos + " is now open." : "Course complete!"}`), 300);  }
        Store.save();
      };
      // typing again after a check: the old verdict no longer belongs to this answer
      li.querySelector("input").addEventListener("input", () => { if (!f.hidden && !f.classList.contains("stale")) { f.classList.add("stale"); f.insertAdjacentHTML("afterbegin", '<span class="stale-note">✎ Changed – press Check again.</span><br>'); } });
      li.querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        const inp = li.querySelector("input"); if (!inp.value.trim()) { H.toast("Type your answer first."); return; }
        const open = !t.a || /^z\.\s?B\./.test(t.a);
        const g = open ? { ok: true } : Grade.grade(inp.value, t.a);
        f.hidden = false;
        if (open) {
          const r = Tutor.check(inp.value);
          f.classList.remove("stale");
          f.innerHTML = r.issues.length ? `Max suggests: <b>${esc(r.fixed)}</b><br><span class="muted">${r.issues.map((x) => x.why).join(" ")}</span>` : `✓ No rule problems found.${t.a ? ` Example: <b>${esc(t.a)}</b>` : ""}`;
          mark(!r.issues.length);
          return;
        }
        f.classList.remove("stale");
        f.innerHTML = `${FB.closed(t.q, inp.value, t.a, g)} ${!g.ok ? `<br><button class="link ov">My answer is also correct</button> · <button class="link" data-ask="${esc(`Why is the answer „${t.a}“ in: ${t.q}`)}">Ask Max why</button>` : ""}`;
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
      ${l.exam.map((q, i) => `<div class="eq" data-i="${i}">${UI.reportBtn({ id: `L${l.n}-exam${i + 1}`, lesson: l.n, part: "Exam " + (i + 1), q: q.q, a: q.a })}<p><b>${i + 1}.</b> ${md(q.q)} ${UI.hint(q.q)}</p>
        ${q.a && !/^z\.\s?B\./.test(q.a) ? `<form class="q-form"><input class="q-in" autocomplete="off" placeholder="Answer"><button class="btn sm">Check</button></form>` :
          `<textarea rows="3" placeholder="Write your answer in German…"></textarea><div class="row">${UI.mic("Speak")}<button class="btn sm chk">Check my answer</button>${q.a || q.m ? `<button class="btn ghost sm model">Model answer</button>` : ""}</div>`}
        <div class="efb" hidden></div></div>`).join("")}</section>
      ${partNav(l, ls, "exam")}`;
    el.querySelectorAll(".eq").forEach((box) => {
      const q = l.exam[+box.dataset.i]; const f = box.querySelector(".efb");
      const form = box.querySelector("form");
      const inp0 = box.querySelector("input"); if (inp0) inp0.addEventListener("input", () => { if (!f.hidden) f.classList.add("stale"); });
      if (form) form.onsubmit = (e) => {
        e.preventDefault(); const v = box.querySelector("input").value;
        if (!v.trim()) { H.toast("Type your answer first."); return; }
        const g = Grade.grade(v, q.a); const ov = Grade.overlap(v, q.a);
        const ok = g.ok || ov >= 0.6;
        const short = q.a.split(/\s+/).length <= 4;      // one-word / short answers: show the exact difference; longer ones: the content counts
        f.hidden = false; f.classList.remove("stale");
        f.innerHTML = short || g.ok ? FB.closed(q.q, v, q.a, ok && !g.ok ? { ok: true } : g) : `${ok ? `<span class="fb-ok">✓ ${H.bi("Inhalt stimmt", "The content is right")}</span>` : `<span class="fb-bad">✗ Not quite.</span>`} Model answer: <b>${esc(q.a)}</b>${ok ? "" : `<br><span class="muted small">Look for the answer in the reading text (part 2), then try again.</span>`}`;
        if (!ok) f.insertAdjacentHTML("beforeend", ` <br><button class="link ov">My answer is also correct</button>`);
        const ovb = f.querySelector(".ov"); if (ovb) ovb.onclick = () => { ls.exam[box.dataset.i] = true; Store.save(); ovb.replaceWith("✓ Counted as correct."); };
        ls.exam[box.dataset.i] = ok; if (window.Habit && Object.keys(ls.exam).length >= 4) Habit.markPart(l.n, "exam"); Store.addXP(ok ? 5 : 1); Store.save();
      };
      const ta = box.querySelector("textarea");
      if (ta) {
        UI.bindMic(box, (t) => { ta.value = (ta.value ? ta.value + " " : "") + t; });
        box.querySelector(".chk").onclick = () => {
          if (!ta.value.trim()) return H.toast("Write or speak an answer first.");
          const r = FB.open(ta.value, { prompt: q.q, lesson: l, model: q.m || (q.a ? q.a.replace(/^z\.\s?B\.\s*/, "") : "") });
          f.hidden = false; f.innerHTML = r.html;
          ls.exam[box.dataset.i] = r.score >= 50; ls.examScore = Object.assign(ls.examScore || {}, { [box.dataset.i]: r.score });
          if (window.Habit && Object.keys(ls.exam).length >= 4) Habit.markPart(l.n, "exam"); Store.addXP(r.score >= 65 ? 10 : 4); Store.save();
        };
        const m = box.querySelector(".model"); if (m) m.onclick = () => { const mt = q.m || q.a.replace(/^z\.\s?B\.\s*/, ""); f.hidden = false; f.innerHTML = `<div class="fb-model"><b>📝 Model answer</b><p class="ex">${esc(mt)} ${UI.say(mt)}</p><p class="muted small">One possible answer. Write your own, then press “Check my answer”.</p></div>`; };
      }
    });
  }

  function speak(el, l, ls) {
    el.innerHTML = `<section class="card"><h3>Speak about the picture</h3><div class="scene">${DC.scenes[l.scene] || ""}</div>
      <p class="muted small">Answer each question out loud – or type what you would say if you have no microphone. You get feedback on every answer.</p>
      <ol class="prompts sprompts">${l.speak.map((p, i) => `<li data-i="${i}"><p>${md(p)} ${UI.hint(p)}</p>
        <div class="row">${UI.mic("Speak")}<button class="btn ghost sm typeit">⌨ Type instead</button></div>
        <textarea rows="2" class="sp-in" placeholder="What you say appears here – or type it" hidden></textarea>
        <div class="row sp-row" hidden><button class="btn sm sp-chk">Check my answer</button></div><div class="efb" hidden></div></li>`).join("")}</ol>
      <p class="muted small">Goal: talk for 2 minutes and use this lesson's grammar at least 3 times. Useful starters: Auf dem Bild sehe ich … · Links/rechts … · Ich glaube, dass …</p>
      <div class="row"><button class="btn ghost timer">Start 2-min timer</button></div></section>
      <section class="card"><h3>Shadow the examples</h3><p class="muted small">Listen, then repeat. You get a score for each word.</p><div class="shadow"></div></section>
      ${partNav(l, ls, "speak")}`;
    el.querySelectorAll(".sprompts > li").forEach((li) => {
      const p = l.speak[+li.dataset.i], ta = li.querySelector(".sp-in"), row = li.querySelector(".sp-row"), f = li.querySelector(".efb");
      const check = () => {
        if (!ta.value.trim()) return H.toast("Say or type an answer first.");
        const r = FB.open(ta.value, { prompt: p.replace(/__/g, ""), lesson: l });
        f.hidden = false; f.innerHTML = r.html;
        ls.spoke = true; if (window.Habit) { Habit.track("speak"); Habit.markPart(l.n, "speak"); } Store.addXP(r.score >= 65 ? 8 : 3); Store.save();
      };
      const open = () => { ta.hidden = false; row.hidden = false; };
      li.querySelector(".typeit").onclick = () => { open(); ta.focus(); };
      li.querySelector(".sp-chk").onclick = check;
      UI.bindMic(li, (t) => { open(); ta.value = (ta.value ? ta.value + " " : "") + t; check(); });
    });
    const tb = el.querySelector(".timer"); let tm = null;
    tb.onclick = () => {
      if (tm) { clearInterval(tm); tm = null; tb.textContent = "Start 2-min timer"; return; }
      let left = 120; tb.textContent = "2:00";
      tm = setInterval(() => { left--; tb.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0 || !document.body.contains(tb)) { clearInterval(tm); tm = null; tb.textContent = "Time's up – well done!"; ls.spoke = true; Store.addXP(10); } }, 1000);
    };
    V.shadow(el.querySelector(".shadow"), l.examples.map((e) => e.de));
    el.querySelector(".finish").addEventListener("click", () => { if (ls.spoke && window.Habit) Habit.markPart(l.n, "speak"); });
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
        if (window.Habit) Habit.track("speak"); Store.addXP(d.score >= 80 ? 6 : 2);
      });
    };
    draw();
  };
})();
