/* Deutsch Coach – views: Üben, Wörter, Hören, Sprechen, Lesen */
(function () {
  "use strict";
  const { esc, md } = H;
  const V = (window.Views = window.Views || {});

  let VOCAB = null;
  V.vocabList = () => (VOCAB = VOCAB || DC.vocab.map((w) => Object.assign({ id: "v:" + w.de.toLowerCase() }, w)));
  V.vocabIds = () => V.vocabList().filter((w) => Store.get().srs[w.id]).map((w) => w.id);

  /* ---------------- Üben ---------------- */
  function smartPick() {
    const s = Store.get();
    const maxLesson = Math.max(1, ...Object.entries(s.lessons).filter(([, v]) => v.read || v.done).map(([k]) => +k));
    const pool = Object.values(Engine.GEN).filter((g) => s.settings.unlockAll || Math.min(...g.lessons) <= maxLesson);
    const weights = pool.map((g) => {
      const t = s.topics[g.id]; const rec = t && t.recent && t.recent.length ? t.recent : null;
      const acc = rec ? rec.reduce((a, b) => a + b, 0) / rec.length : 0.5;
      const near = Math.min(...g.lessons) >= maxLesson - 3 ? 1.5 : 1;
      return (1.2 - acc) * near + 0.1;
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i].id; }
    return pool[0].id;
  }
  V.practice = (el, [id]) => {
    if (id) {
      if (id === "smart") return UI.session(el, () => Engine.generate(smartPick()), { title: "Smart mix", total: 10 });
      if (id === "mistakes") {
        const ms = Store.get().mistakes.filter((m) => m.gen && Engine.GEN[m.gen]);
        if (!ms.length) return (el.innerHTML = UI.empty("No mistakes saved yet.", `<button class="btn" data-go="practice">Back</button>`));
        return UI.session(el, (i) => Engine.generate(ms[i % ms.length].gen), { title: "Fix your mistakes", total: Math.min(10, ms.length * 2) });
      }
      if (id === "bank") {
        const bank = H.shuffle(DC.bank);
        return UI.session(el, (i) => {
          const b = bank[i]; const m = /\[([^\]]+)\]/.exec(b.q);
          if (m) { const opts = m[1].split("/").map((x) => x.trim()); return { kind: "choice", gen: "bank:" + b.type, prompt: md(b.q.replace(m[0], "")), answer: opts.includes(b.a) ? b.a : opts[0], options: H.shuffle(opts), why: esc(b.hint) }; }
          return { kind: /Ordne|Baue|Setze|Words:/.test(b.q) ? "input" : "input", gen: "bank:" + b.type, prompt: md(b.q), answer: b.a, why: esc(b.hint) };
        }, { title: "Classic question bank", total: 10 });
      }
      if (!Engine.GEN[id]) return (el.innerHTML = UI.empty("Unknown topic."));
      return UI.session(el, () => Engine.generate(id), { title: Engine.GEN[id].title, total: 10 });
    }
    const s = Store.get();
    const groups = ["A1", "A2", "B1"].map((lv) => ({ lv, gens: Object.values(Engine.GEN).filter((g) => g.level === lv) }));
    el.innerHTML = `<h2 class="page-title">Practice</h2>
      <section class="grid2">
        <button class="tile hero" data-go="practice/smart"><b>Smart mix</b><span>Focuses on your weak topics</span></button>
        <button class="tile" data-go="practice/mistakes"><b>My mistakes</b><span>${s.mistakes.length} saved</span></button>
        <button class="tile" data-go="vocab"><b>Words</b><span>${SRS.due(V.vocabIds()).length} due today</span></button>
        <button class="tile" data-go="practice/bank"><b>Question bank</b><span>${DC.bank.length} classic items</span></button>
      </section>
      ${groups.map((g) => `<section class="card"><h3>${UI.levelDot(g.lv)} Grammar drills</h3><div class="topics">${g.gens.map((x) => {
        const t = s.topics[x.id]; const rec = t && t.recent && t.recent.length ? Math.round((t.recent.reduce((a, b) => a + b, 0) / t.recent.length) * 100) : null;
        return `<button class="topic" data-go="practice/${x.id}"><span>${esc(x.title)}</span><small>L${x.lessons.join(", L")}${rec !== null ? ` · ${rec}%` : ""}</small>${rec !== null ? `<i class="meter" style="--p:${rec}%"></i>` : ""}</button>`;
      }).join("")}</div></section>`).join("")}`;
  };

  /* ---------------- Wörter ---------------- */
  V.vocab = (el, [mode]) => {
    const all = V.vocabList();
    const s = Store.get();
    if (mode === "review") return review(el);
    if (mode === "articles") return articles(el);
    if (mode === "type") return typing(el);
    const st = SRS.stats(all.map((w) => w.id));
    const levels = ["all", "A1", "A2", "B1"];
    el.innerHTML = `<h2 class="page-title">Words</h2>
      <section class="stats3"><div><b>${st.due}</b><span>due</span></div><div><b>${st.learned}</b><span>learning</span></div><div><b>${st.mature}</b><span>known well</span></div></section>
      <section class="grid2">
        <button class="tile hero" data-go="vocab/review"><b>Review</b><span>${st.due ? st.due + " due + new words" : "Learn new words"}</span></button>
        <button class="tile" data-go="vocab/articles"><b>der · die · das</b><span>Article trainer</span></button>
        <button class="tile" data-go="vocab/type"><b>Type it</b><span>English → German</span></button>
      </section>
      <section class="card"><h3>Word list</h3>
        <div class="filters"><input class="search" type="search" placeholder="Search German or English">
        <select class="lvsel">${levels.map((l) => `<option value="${l}">${l === "all" ? "All levels" : l}</option>`).join("")}</select></div>
        <ul class="wordlist"></ul></section>`;
    const list = el.querySelector(".wordlist"), q = el.querySelector(".search"), lv = el.querySelector(".lvsel");
    const draw = () => {
      const t = q.value.toLowerCase().trim();
      const rows = all.filter((w) => (lv.value === "all" || w.level === lv.value) && (!t || w.de.toLowerCase().includes(t) || (w.en || "").toLowerCase().includes(t))).slice(0, 150);
      list.innerHTML = rows.map((w) => { const c = s.srs[w.id]; return `<li><span class="${w.art ? "g-" + { der: "m", die: "f", das: "n" }[w.art] : ""}">${esc(w.de)}</span>${w.pl ? `<small> ${esc(w.pl)}</small>` : ""} ${UI.say(w.de)}<span class="en">${esc(w.en)}</span>${c ? `<i class="box b${c.box}" title="box ${c.box}"></i>` : ""}</li>`; }).join("") || "<li class='muted'>No words match.</li>";
    };
    q.oninput = draw; lv.onchange = draw; draw();
  };
  function reviewQueue(n = 20) {
    const all = V.vocabList(); const ids = all.map((w) => w.id);
    const due = SRS.due(ids);
    const s = Store.get();
    const maxLesson = Math.max(1, ...Object.keys(s.lessons).map(Number));
    const fresh = all.filter((w) => !s.srs[w.id] && (!w.lesson || w.lesson <= maxLesson)).sort((a, b) => (a.level > b.level ? 1 : -1)).slice(0, Math.max(0, 8 - Math.min(due.length, 8))).map((w) => w.id);
    return H.shuffle(due).slice(0, n).concat(fresh);
  }
  function review(el) {
    const byId = Object.fromEntries(V.vocabList().map((w) => [w.id, w]));
    let q = reviewQueue(); let i = 0;
    const draw = () => {
      if (i >= q.length) { el.innerHTML = UI.empty(`Done! ${q.length} cards reviewed. Come back tomorrow for the next ones.`, `<button class="btn" data-go="vocab">Back to words</button>`); return; }
      const w = byId[q[i]]; const isNew = !SRS.card(w.id);
      el.innerHTML = `<div class="session"><div class="sess-head"><span class="sess-title">${isNew ? "New word" : "Review"}</span><span>${i + 1}/${q.length}</span></div><div class="bar"><i style="width:${(i / q.length) * 100}%"></i></div>
        <button class="flash" aria-label="Show answer"><span class="front">${esc(w.en)}</span><span class="back" hidden><b class="${w.art ? "g-" + { der: "m", die: "f", das: "n" }[w.art] : ""}">${esc(w.de)}</b>${w.pl ? `<small>Pl. ${esc(w.pl)}</small>` : ""}${w.exDe ? `<i>${esc(w.exDe)}</i>` : ""}</span></button>
        <div class="row center grades" hidden><button class="btn bad" data-g="0">Again</button><button class="btn ghost" data-g="1">Hard</button><button class="btn" data-g="2">Good</button><button class="btn ghost" data-g="3">Easy</button></div>
        <p class="muted small center">Think of the German word (with article), then tap the card.</p></div>`;
      const card = el.querySelector(".flash");
      card.onclick = () => { card.querySelector(".back").hidden = false; el.querySelector(".grades").hidden = false; Speech.speak(w.de); };
      el.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => { const g = +b.dataset.g; SRS.grade(w.id, g); Store.addXP(g ? 3 : 1); if (g === 0) q.push(w.id); i++; draw(); }));
    };
    draw();
  }
  function articles(el) {
    const nouns = V.vocabList().filter((w) => w.art);
    const next = () => {
      const w = H.pick(nouns); const bare = w.de.replace(/^(der|die|das)\s+/, "");
      const g = { der: "m", die: "f", das: "n" }[w.art];
      return { kind: "choice", gen: "articles", prompt: `<span class="big">${esc(bare)}</span><br><span class="muted">${esc(w.en)}</span>`, answer: w.art, options: ["der", "die", "das"], why: `<span class="g-${g}">${w.art}</span> ${esc(bare)}${w.pl ? ` · Plural: ${esc(w.pl)}` : ""}. ${Tutor.articleGuess(bare).includes("ending suggests") ? "" : ""}${articleTip(bare, w.art)}`, full: w.de };
    };
    UI.session(el, next, { title: "der · die · das", total: 15 });
  }
  function articleTip(w, a) {
    if (/(ung|heit|keit|schaft|ion|tät)$/.test(w)) return "Tip: this ending is always feminine.";
    if (/(chen|lein|ment|um)$/.test(w)) return "Tip: this ending is neuter.";
    if (/e$/.test(w) && a === "die") return "Tip: most nouns in -e are feminine.";
    if (/e$/.test(w)) return "Careful: an exception to the -e = die tendency.";
    return "No reliable rule – say it three times with the article.";
  }
  function typing(el) {
    const words = V.vocabList().filter((w) => w.en && w.de.length < 30);
    UI.session(el, () => { const w = H.pick(words); return { kind: "input", gen: "vocab_type", prompt: `German for: <b>${esc(w.en)}</b>${w.art ? " <span class='muted'>(with article)</span>" : ""}`, answer: w.de, why: w.exDe ? `<i>${esc(w.exDe)}</i> – ${esc(w.exEn)}` : "", full: w.de }; }, { title: "Type it", total: 10 });
  }

  /* ---------------- Hören ---------------- */
  V.listen = (el) => {
    const s = Store.get();
    const pool = () => {
      const maxL = Math.max(1, ...Object.keys(s.lessons).map(Number));
      const ex = DC.curriculum.filter((l) => s.settings.unlockAll || l.n <= maxL + 1).flatMap((l) => l.examples.map((e) => e.de));
      return Math.random() < 0.5 ? { de: H.pick(ex) } : Engine.sentence();
    };
    el.innerHTML = `<h2 class="page-title">Listening</h2><div class="dict"></div>`;
    const box = el.querySelector(".dict");
    const round = () => {
      const it = pool();
      box.innerHTML = `<section class="card"><h3>Dictation</h3><p class="muted small">Listen and type exactly what you hear.</p>
        <div class="row">${UI.say(it.de, "Play")}<button class="btn ghost sm slow">Slow</button><button class="btn ghost sm words">Word by word</button></div>
        <form class="q-form"><input class="q-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type what you hear"><button class="btn">Check</button></form>${UI.umlautBar()}
        <div class="dfb"></div></section>`;
      setTimeout(() => Speech.speak(it.de), 300);
      box.querySelector(".slow").onclick = () => Speech.speak(it.de, 0.6);
      box.querySelector(".words").onclick = async () => { for (const w of it.de.split(" ")) { Speech.speak(w, 0.7); await new Promise((r) => setTimeout(r, 700 + w.length * 60)); } };
      const inp = box.querySelector("input"); UI.bindUmlauts(box, inp);
      box.querySelector("form").onsubmit = (e) => {
        e.preventDefault();
        const d = Grade.wordDiff(it.de, inp.value);
        Store.topic("dictation", d.score >= 90); Store.addXP(d.score >= 90 ? 10 : 3);
        box.querySelector(".dfb").innerHTML = `<p class="diff">${d.words.map((w) => `<span class="${w.ok ? "hit" : "miss"}">${esc(w.w)}</span>`).join(" ")}</p><p><b>${d.score}%</b>${it.en ? ` · <span class="muted">${esc(it.en)}</span>` : ""}</p><button class="btn nx">Next sentence</button>`;
        box.querySelector(".nx").onclick = round;
      };
    };
    round();
    el.insertAdjacentHTML("beforeend", `<section class="card"><h3>Listening with texts</h3><p class="muted small">Hide the text, listen, then answer.</p><button class="btn ghost" data-go="read">Open reading & listening texts</button></section>`);
  };

  /* ---------------- Sprechen ---------------- */
  V.speak = (el) => {
    const s = Store.get();
    const maxL = Math.max(1, ...Object.keys(s.lessons).map(Number));
    const lessons = DC.curriculum.filter((l) => s.settings.unlockAll || l.n <= maxL);
    const sentences = H.shuffle(lessons.flatMap((l) => l.examples.map((e) => e.de)));
    const l = H.pick(lessons);
    el.innerHTML = `<h2 class="page-title">Speaking</h2>
      ${Speech.canListen() ? "" : `<p class="warn">Speech recognition isn't available here. Use Chrome on Android/desktop or the Android app. You can still listen and practise aloud.</p>`}
      <section class="card"><h3>Shadowing</h3><div class="shadow"></div></section>
      <section class="card"><h3>Free talk: ${esc(l.theme)}</h3><div class="scene">${DC.scenes[l.scene]}</div>
        <ol class="prompts">${l.speak.map((p) => `<li>${md(p)}</li>`).join("")}</ol>
        <div class="row">${UI.mic("Speak")}<button class="btn ghost sm" data-go="speak">Other picture</button></div><div class="transcript"></div></section>
      <section class="card"><h3>Question & answer</h3><p class="muted small">Max asks, you answer out loud.</p><div class="qa"></div></section>`;
    V.shadow(el.querySelector(".shadow"), sentences);
    const free = el.querySelectorAll(".card")[1];
    UI.bindMic(free, (t) => {
      const r = Tutor.check(t); Store.addXP(6);
      free.querySelector(".transcript").insertAdjacentHTML("beforeend", `<div class="said"><p>🗣️ ${esc(t)}</p>${r.issues.length ? `<p class="ex ok">${esc(r.fixed)}</p><p class="muted">${r.issues.map((x) => x.why).join(" ")}</p>` : `<p class="muted">✓ No rule problems found.</p>`}</div>`);
    });
    const QS = ["Wie heißt du und woher kommst du?", "Was machst du am Wochenende?", "Was hast du gestern gemacht?", "Warum lernst du Deutsch?", "Wie ist das Wetter heute?", "Was isst du gern?", "Wie kommst du zur Arbeit?", "Was würdest du mit viel Geld machen?", "Was ist in deinem Heimatland anders als in Deutschland?", "Wohnst du lieber in der Stadt oder auf dem Land? Warum?", "Was sind Vorteile und Nachteile von Homeoffice?", "Worauf freust du dich?"];
    const qa = el.querySelector(".qa");
    const ask = () => {
      const q = H.pick(QS);
      qa.innerHTML = `<p class="ex big">${esc(q)} ${UI.say(q)}</p><div class="row">${UI.mic("Answer")}<button class="btn ghost sm nq">Other question</button></div><div class="qafb"></div>`;
      Speech.speak(q);
      qa.querySelector(".nq").onclick = ask;
      UI.bindMic(qa, (t) => {
        const r = Tutor.check(t); const words = t.split(/\s+/).length;
        qa.querySelector(".qafb").innerHTML = `<p>🗣️ ${esc(t)}</p><p class="muted">${words} words${words < 6 ? " – try a longer answer with weil/denn." : ""}</p>${r.issues.length ? `<p class="ex ok">${esc(r.fixed)}</p><p class="muted">${r.issues.map((x) => x.why).join(" ")}</p>` : ""}`;
        Store.addXP(words >= 6 ? 8 : 3);
      });
    };
    ask();
  };

  /* ---------------- Lesen ---------------- */
  V.read = (el, [idx]) => {
    const texts = DC.curriculum.map((l) => ({ id: "L" + l.n, title: `L${l.n} · ${l.theme}`, level: l.level, de: l.reading, q: l.exam.slice(0, 3).filter((x) => x.a) }))
      .concat(DC.passages.map((p, i) => ({ id: "P" + i, title: p.title, level: p.level, de: p.de, q: p.q.map((x) => ({ q: x })) })));
    if (idx) {
      const t = texts.find((x) => x.id === idx);
      if (!t) return (el.innerHTML = UI.empty("Text not found."));
      el.innerHTML = `<button class="back" data-go="read">‹ All texts</button><h2 class="page-title">${esc(t.title)}</h2>
        <section class="card"><div class="row">${UI.say(t.de, "Play")}<button class="btn ghost sm slow">Slow</button><button class="btn ghost sm hide">Hide text (listening)</button></div>
        <div class="reading">${t.de.split(/(\s+)/).map((w) => (/\S/.test(w) ? `<span class="w">${esc(w)}</span>` : w)).join("")}</div><div class="lookup" hidden></div></section>
        <section class="card"><h3>Questions</h3>${t.q.map((q, i) => `<div class="rq"><p>${md(q.q)}</p><textarea rows="2" placeholder="Answer in German"></textarea>${q.a ? `<button class="btn ghost sm show" data-i="${i}">Show answer</button><p class="muted" hidden>${esc(q.a)}</p>` : `<button class="btn ghost sm chk">Check my German</button><p class="muted" hidden></p>`}</div>`).join("")}</section>`;
      el.querySelector(".slow").onclick = () => Speech.speak(t.de, 0.7);
      el.querySelector(".hide").onclick = (e) => { const r = el.querySelector(".reading"); r.classList.toggle("blur"); e.target.textContent = r.classList.contains("blur") ? "Show text" : "Hide text (listening)"; };
      const lk = el.querySelector(".lookup");
      el.querySelectorAll(".w").forEach((w) => (w.onclick = () => V.lookupWord(w.textContent, lk)));
      el.querySelectorAll(".rq").forEach((r) => {
        const b = r.querySelector("button"), p = r.querySelector("p.muted");
        b.onclick = () => {
          p.hidden = false;
          if (b.classList.contains("chk")) { const c = Tutor.check(r.querySelector("textarea").value || "…"); p.innerHTML = c.issues.length ? `Suggestion: <b>${esc(c.fixed)}</b>` : "✓ No rule problems found."; }
          Store.addXP(3);
        };
      });
      return;
    }
    el.innerHTML = `<h2 class="page-title">Reading & listening</h2>${["A1", "A2", "B1"].map((lv) => `<section class="card"><h3>${UI.levelDot(lv)} Texts</h3><ul class="textlist">${texts.filter((t) => t.level === lv).map((t) => `<li><button class="link" data-go="read/${t.id}">${esc(t.title)}</button></li>`).join("")}</ul></section>`).join("")}`;
  };
})();
