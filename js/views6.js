/* Deutsch Coach – views: Einstufungstest, Aussprache, Was ist neu.
   Added in 4.4.0 from the master report (Parts 7.8 and 7.9). */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const START_LESSON = { A1: 1, A2: 13, B1: 25, B2: 43, C1: 51, C2: 57 };

  /* ---------------- 1. Placement test ---------------- */
  const poolFor = (lv) => Object.values(Engine.GEN).filter((g) => g.level === lv && g.id !== "satzbau").map((g) => g.id);

  V.placement = (el, [mode]) => {
    if (mode !== "go") {
      el.innerHTML = `<h2 class="page-title">Placement test</h2>
        <section class="card"><p>Not sure where to start? Answer about 20 questions and the app finds your level.</p>
        <ul class="plain small">
          <li>The test <b>adapts</b>: two right answers in a row and it gets harder, two wrong and it gets easier.</li>
          <li>It takes 5–10 minutes. Don't guess – “I don't know” is a useful answer here.</li>
          <li>At the end you get a recommended starting lesson and your weakest topics. Nothing is deleted; you can still open any lesson.</li>
        </ul>
        <div class="row"><button class="btn sign" data-go="placement/go">Start the test</button><button class="btn ghost" data-go="path">Back to the course</button></div></section>`;
      return;
    }
    const TOTAL = 20;
    let lvI = 1, streakOk = 0, streakBad = 0, i = 0;
    const log = [];
    const wrap = document.createElement("div");
    el.innerHTML = `<h2 class="page-title">Placement test</h2>`;
    el.appendChild(wrap);
    const step = () => {
      if (i >= TOTAL) return finish();
      const lv = LEVELS[lvI];
      const pool = poolFor(lv);
      const item = Engine.generate(H.pick(pool.length ? pool : poolFor("A2")));
      wrap.innerHTML = `<div class="sess-head"><span class="sess-title">Question ${i + 1}/${TOTAL}</span><span>${UI.levelDot(lv)}</span></div>
        <div class="pbar"><span style="width:${(i / TOTAL) * 100}%"></span></div><div class="q-host"></div>
        <div class="row"><button class="btn ghost sm pskip">I don't know</button></div>`;
      const host = wrap.querySelector(".q-host");
      const record = (ok) => {
        log.push({ lv, gen: item.gen || item.topic, ok });
        if (ok) { streakOk++; streakBad = 0; if (streakOk >= 2 && lvI < 5) { lvI++; streakOk = 0; } }
        else { streakBad++; streakOk = 0; if (streakBad >= 2 && lvI > 0) { lvI--; streakBad = 0; } }
      };
      UI.item(host, item, { compact: true, onDone: (ok) => record(ok), onNext: () => { i++; step(); } });
      wrap.querySelector(".pskip").onclick = () => { record(false); i++; step(); };
    };
    const finish = () => {
      const byLevel = {};
      log.forEach((r) => { const b = (byLevel[r.lv] = byLevel[r.lv] || { n: 0, ok: 0 }); b.n++; if (r.ok) b.ok++; });
      // highest level that was answered at least twice with 60 % correct
      let level = "A1";
      LEVELS.forEach((lv) => { const b = byLevel[lv]; if (b && b.n >= 2 && b.ok / b.n >= 0.6) level = lv; });
      const weakCount = {};
      log.filter((r) => !r.ok).forEach((r) => (weakCount[r.gen] = (weakCount[r.gen] || 0) + 1));
      const weak = Object.entries(weakCount).sort((a, b) => b[1] - a[1]).slice(0, 4)
        .map(([g]) => ({ id: g, title: (Engine.GEN[g] || {}).title || g }));
      const start = START_LESSON[level];
      const right = log.filter((r) => r.ok).length;
      const s = Store.get();
      s.placement = { date: Date.now(), level, right, total: log.length };
      Store.save();
      wrap.innerHTML = `<section class="card result lvl-${level}">
          <p class="muted">${right}/${log.length} correct</p>
          <p class="big">Your level looks like ${UI.levelDot(level)}</p>
          <p>We suggest starting at <b>lesson ${start}</b>. Everything before it stays open – use it to review.</p>
          ${weak.length ? `<p><b>Weakest topics:</b></p><div class="chips">${weak.map((w) => `<button class="chip" data-go="practice/${w.id}">${esc(w.title)}</button>`).join("")}</div>` : ""}
          <div class="row"><button class="btn sign setl">Start at lesson ${start}</button><button class="btn ghost" data-go="placement/go">Test again</button><button class="btn ghost" data-go="path">Just show the course</button></div>
          <p class="muted small">A placement test is a guide, not a certificate. If lesson ${start} feels too hard, start earlier – the course is free to move around in.</p>
        </section>`;
      wrap.querySelector(".setl").onclick = () => {
        const st = Store.get();
        for (let n = 1; n < start; n++) { const L = Store.lesson(n); if (!L.done) { L.done = true; L.score = Math.max(L.score || 0, 70); L.placed = true; } }
        Store.save(); H.toast(`Lessons 1–${start - 1} marked as known.`); App.go("lesson/" + start);
      };
    };
    step();
  };

  /* ---------------- 2. Pronunciation drills ---------------- */
  const PAIRS = [
    { s: "ü vs. u", tip: "For <b>ü</b>: say “ee” and round your lips. Indian learners often say “u” – then <i>Mütter</i> (mothers) sounds like <i>Mutter</i> (mother).", pairs: [["Mütter", "Mutter"], ["Tür", "Tour"], ["müde", "Mode"], ["fühlen", "fuhren"]] },
    { s: "ö vs. o", tip: "For <b>ö</b>: say “e” as in <i>Bett</i> and round your lips. <i>schön</i> ≠ <i>schon</i>.", pairs: [["schön", "schon"], ["Höhle", "hohle"], ["Töne", "Tonne"], ["Söhne", "Sonne"]] },
    { s: "ich-Laut vs. sch", tip: "<b>ch</b> after i, e, ä, ö, ü, ei, eu is soft (like a whispered “h” in “huge”) – not “sh”.", pairs: [["mich", "misch"], ["Kirche", "Kirsche"], ["Fichte", "fischte"], ["Kichern", "Kirschen"]] },
    { s: "ach-Laut vs. k", tip: "<b>ch</b> after a, o, u, au is a scrape at the back of the mouth – not a hard k.", pairs: [["Bach", "back"], ["Loch", "Lok"], ["doch", "Dock"], ["Nacht", "nackt"]] },
    { s: "long vs. short vowel", tip: "A doubled vowel or a vowel + h is <b>long</b>; a double consonant after it makes it <b>short</b>. This changes the word.", pairs: [["Staat", "Stadt"], ["Beet", "Bett"], ["Ofen", "offen"], ["ihn", "in"]] },
    { s: "w vs. v", tip: "German <b>w</b> = English v (<i>Wein</i>). German <b>v</b> is usually f (<i>Vater</i>), but v in foreign words is v (<i>Vase</i>).", pairs: [["Wein", "fein"], ["wir", "vier"], ["warm", "Farm"], ["Welt", "Feld"]] },
    { s: "z and s", tip: "<b>z</b> = ts (<i>Zeit</i>). <b>s</b> before a vowel is voiced like English z (<i>Sonne</i>), never “s” as in “sun”.", pairs: [["Zeit", "seit"], ["heizen", "heißen"], ["Zoo", "so"], ["reizen", "reisen"]] },
    { s: "final -e and -er", tip: "Final <b>-e</b> is a weak “uh” (<i>Name</i>); final <b>-er</b> sounds almost like “a” (<i>Vater</i>) – not an Indian rolled r.", pairs: [["Name", "Namen"], ["bitte", "bitter"], ["eine", "einer"], ["leere", "Lehrer"]] },
  ];

  V.pronounce = (el, [idx]) => {
    if (idx === undefined) {
      el.innerHTML = `<h2 class="page-title">Pronunciation</h2>
        <p class="muted">Eight sound pairs that decide whether Germans understand you. Listen, repeat, then let the app check which word it heard.</p>
        ${PAIRS.map((p, i) => `<button class="tile wide" data-go="pronounce/${i}"><b>${esc(p.s)}</b><span>${p.pairs.map((x) => x[0]).join(" · ")}</span></button>`).join("")}
        <section class="card"><p class="muted small">Speech recognition judges <b>which word</b> it heard, not how good your accent is. If it hears the wrong word, the difference matters – practise it. If it hears the right one, listen to yourself and compare with the audio.</p></section>`;
      return;
    }
    const g = PAIRS[+idx];
    if (!g) return (el.innerHTML = UI.empty("Not found.", `<button class="btn" data-go="pronounce">Back</button>`));
    el.innerHTML = `<button class="back" data-go="pronounce">‹ All sounds</button>
      <h2 class="page-title">${esc(g.s)}</h2>
      <section class="card"><p>${g.tip}</p></section>
      <section class="card"><h3>Listen and repeat</h3>
        ${g.pairs.map(([a, b], i) => `<div class="prow"><div><b>${esc(a)}</b> ${UI.say(a)}</div><div class="muted">vs.</div><div><b>${esc(b)}</b> ${UI.say(b)}</div>
          <button class="btn ghost sm try" data-i="${i}">🎙️ Say “${esc(a)}”</button></div><p class="pfb muted small" hidden></p>`).join("")}
      </section>
      <section class="card"><h3>Hear the difference</h3><p class="muted small">Max says one of the two words. Which one was it?</p><div class="ptest"></div></section>`;
    el.querySelectorAll(".try").forEach((b) => (b.onclick = async () => {
      const [a, other] = g.pairs[+b.dataset.i];
      const fb = b.parentElement.nextElementSibling;
      fb.hidden = false; fb.textContent = "Listening …";
      try {
        const heard = (await Speech.listen()).trim();
        const clean = (x) => x.toLowerCase().replace(/[^a-zäöüß]/g, "");
        fb.innerHTML = !heard ? "I didn't hear anything – try again."
          : clean(heard).includes(clean(a)) ? `✓ I heard “${esc(heard)}” – that's the one.`
          : clean(heard).includes(clean(other)) ? `✗ I heard “${esc(heard)}” – that's the other word. Listen to both again and exaggerate the difference.`
          : `I heard “${esc(heard)}”. Try once more, a bit slower.`;
      } catch (e) { fb.textContent = "Speech recognition isn't available here."; }
    }));
    const host = el.querySelector(".ptest");
    let round = 0, right = 0;
    const ask = () => {
      if (round >= 6) { host.innerHTML = `<p class="big">${right}/6 correct</p><div class="row"><button class="btn sm again">Again</button><button class="btn ghost sm" data-go="pronounce">Other sound</button></div>`; host.querySelector(".again").onclick = () => { round = 0; right = 0; ask(); }; return; }
      const [a, b] = H.pick(g.pairs); const target = Math.random() < 0.5 ? a : b;
      host.innerHTML = `<div class="row">${UI.say(target, "▶ Play")}</div><div class="choices">${[a, b].map((w) => `<button class="choice">${esc(w)}</button>`).join("")}</div><p class="pq muted"></p>`;
      Speech.speak(target);
      host.querySelectorAll(".choice").forEach((btn) => (btn.onclick = () => {
        const ok = btn.textContent === target; if (ok) right++;
        host.querySelectorAll(".choice").forEach((x) => { x.disabled = true; if (x.textContent === target) x.classList.add("right"); });
        if (!ok) btn.classList.add("wrong");
        host.querySelector(".pq").innerHTML = `${ok ? "✓ Richtig" : "✗ It was “" + esc(target) + "”"} · <button class="link nx">next</button>`;
        host.querySelector(".nx").onclick = () => { round++; ask(); };
        Store.topic("aussprache", ok);
      }));
    };
    ask();
  };

  /* ---------------- 3. What's new ---------------- */
  const NEWS = [
    { v: "4.4.0", date: "23 September 2026", items: [
      "<b>Placement test</b> – about 20 adaptive questions find your level and suggest a starting lesson.",
      "<b>Pronunciation drills</b> – eight sound pairs (ü/u, ö/o, ich/sch, long/short vowels …) with listening tests and a microphone check.",
      "<b>Writing exam feedback</b> now scores the four official exam criteria and lists the content points as a checklist.",
      "The full <b>master report</b> (all grammar corrections, the complete word list and the development plan) is now included with the app.",
    ] },
    { v: "4.3.0", date: "22 September 2026", items: [
      "Max now checks <b>adjective endings</b> (einen neue Tisch → einen neuen Tisch) and 30 error types in total.",
      "New grammar: <b>n-Deklination</b>, <b>Futur II</b> and the complete <b>adjective-ending tables</b> including Genitiv and no article – each with exercises.",
      "Every C1 and C2 word now has an example sentence; 76 new words added, 134 duplicate entries removed.",
      "Corrected wrong German in old practice items (Es hängt von den Bus ab → vom Bus) and wrong titles on 15 reading texts.",
    ] },
    { v: "4.2.0", date: "22 September 2026", items: [
      "<b>⚑ Report a problem</b> on every question.", "Backup reminder, sound check at first start, About & privacy page.",
      "Accessibility: better contrast, labels and keyboard access.",
    ] },
    { v: "4.1.0", date: "22 September 2026", items: [
      "<b>Learner profiles</b> – several people on one device, each with their own progress.",
      "<b>Translate tab</b> with offline meanings and links to DeepL, LEO, Linguee and more.",
    ] },
    { v: "4.0.0", date: "20 September 2026", items: [
      "<b>B2, C1 and C2</b> – 18 new lessons (60 in total).", "<b>Reading and writing exam trainers</b> with model texts.",
      "Word order with <b>several correct answers</b>.",
    ] },
  ];
  V.news = (el) => {
    el.innerHTML = `<h2 class="page-title">What's new</h2>
      ${NEWS.map((n) => `<section class="card"><h3>Version ${n.v} <span class="muted small">· ${n.date}</span></h3><ul class="plain">${n.items.map((i) => `<li>${i}</li>`).join("")}</ul></section>`).join("")}
      <section class="card"><h3>The full report</h3><p class="muted small">Every correction, the complete word list A1–C2 and the development plan (80 pages, PDF).</p>
        <div class="row"><button class="btn ghost" data-url="docs/Deutsch_Coach_Master_Report.pdf">Open the master report ↗</button></div></section>`;
    const s = Store.get(); s.seenNews = App.version; Store.save();
  };
  window.App = window.App || {};
  App.newsBadge = () => {
    const s = Store.get();
    if (!s.seenNews) { s.seenNews = App.version; Store.save(); return; }   // first start: nothing to announce
    if (s.seenNews === App.version) return;
    const n = NEWS[0];
    const d = document.createElement("div"); d.className = "modal";
    d.innerHTML = `<div class="sheet"><h2>What's new in ${n.v}</h2><ul class="plain">${n.items.map((i) => `<li>${i}</li>`).join("")}</ul>
      <div class="row"><button class="btn sign ok">Got it</button><button class="btn ghost all">All changes</button></div></div>`;
    document.body.appendChild(d);
    const close = () => { const st = Store.get(); st.seenNews = App.version; Store.save(); d.remove(); };
    d.querySelector(".ok").onclick = close;
    d.querySelector(".all").onclick = () => { close(); App.go("news"); };
  };
})();
