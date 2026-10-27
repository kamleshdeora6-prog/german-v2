/* Deutsch Coach – Library (Bibliothek): every collection in the repo in one place, as in the first app –
   flashcards, notes, exercises, passages, conjugation, sentences, pictures, word list, Leben in Deutschland. */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});
  const LV = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const back = (to = "library", label = "Library") => `<button class="back" data-go="${to}">‹ ${label}</button>`;
  const lvSel = (cls, all = true, cur = "") => `<select class="${cls}">${all ? `<option value="">All levels</option>` : ""}${LV.map((l) => `<option ${l === cur ? "selected" : ""}>${l}</option>`).join("")}</select>`;
  const myLevel = () => { try { return AI.profile().level; } catch (e) { return "A1"; } };

  /* ---------------- hub ---------------- */
  V.library = (el) => {
    const nNotes = Object.keys(DC.notes || {}).length, nSent = Object.values(DC.sentences || {}).reduce((a, x) => a + x.length, 0);
    const T = [
      ["cards", "🃏", "Karteikarten", "Flashcards", `${DC.vocab.length} words · ${(DC.cards || []).length} grammar & verb cards`],
      ["grammar/notes", "🧾", "Notizen", "Notes", `${nNotes} grammar notes, searchable`],
      ["exercises", "✏️", "Übungen", "Exercises", `${Object.keys(Engine.GEN).length} drills + ${DC.bank.length} classic questions`],
      ["read", "📖", "Texte", "Passages", `${DC.passages.length + DC.curriculum.length} texts with questions`],
      ["verbs", "🔤", "Konjugation", "Conjugation", `${Object.keys(DC.conj).length} verb tables + drill`],
      ["sentences", "🔁", "Sätze", "Sentences", `${nSent} sentences to translate`],
      ["pictures", "🖼", "Bildbeschreibung", "Describe a picture", `${(DC.pictures || []).length} photos · speaking exam`],
      ["vocab", "📚", "Wortschatz", "Vocabulary", "Word list, articles, typing"],
      ["grammar/tables", "📐", "Tabellen", "Grammar tables", "Articles, pronouns, prepositions"],
      ["exam/lid", "🇩🇪", "Leben in Deutschland", "Life in Germany test", `${DC.lid.length} questions`],
    ];
    el.innerHTML = `<button class="back" data-go="more">‹ More</button><h2 class="page-title">${H.bi("Bibliothek", "Library")}</h2>
      <p class="muted">Everything in the course, by type – open any part directly, in any order.</p>
      <section class="grid2 menu lib">${T.map(([go, ic, t, te, d]) => `<button class="tile" data-go="${go}"><span class="ti">${ic}</span><b>${H.bi(t, te)}</b><span>${esc(d)}</span></button>`).join("")}</section>`;
  };

  /* ---------------- flashcards: decks by level and topic, both directions ---------------- */
  const TOPIC_EN = { Allgemein: "General", Arbeit: "Work", Essen: "Food", Verkehr: "Transport", Natur: "Nature", Wetter: "Weather", Gefühle: "Feelings", Kleidung: "Clothes", Freizeit: "Free time", Stadt: "Town", Sprache: "Language", Zeit: "Time", Menschen: "People", Familie: "Family", Wohnen: "Home", Einkaufen: "Shopping", Gesundheit: "Health", Reisen: "Travel", Technik: "Technology", Gesellschaft: "Society", Behörden: "Offices & forms", Umwelt: "Environment", Bildung: "Education", Medien: "Media", Wirtschaft: "Economy", Politik: "Politics", Wissenschaft: "Science", Psychologie: "Psychology", Abstrakt: "Abstract", Verb: "Verbs", Adjektiv: "Adjectives", Adverb: "Adverbs", Kommunikation: "Communication", Lernen: "Learning" };
  V.cards = (el, [deck]) => {
    const st = Store.get().settings;
    if (deck) return cardSession(el, deck);
    const lv = st.cardLevel || myLevel();
    const words = DC.vocab.filter((w) => w.level === lv);
    const topics = {}; words.forEach((w) => { const t = w.topic || "Allgemein"; topics[t] = (topics[t] || 0) + 1; });
    const list = Object.entries(topics).filter(([, n]) => n >= 6).sort((a, b) => b[1] - a[1]);
    const gc = (DC.cards || []);
    el.innerHTML = `${back()}<h2 class="page-title">${H.bi("Karteikarten", "Flashcards")}</h2>
      <section class="card form"><div class="row wrap"><label>Level ${lvSel("c-lv", false, lv)}</label>
        <label>Front <select class="c-dir"><option value="de" ${st.cardDir !== "en" ? "selected" : ""}>German → English</option><option value="en" ${st.cardDir === "en" ? "selected" : ""}>English → German</option></select></label></div>
        <p class="muted small">Tap a card to turn it. “Again” cards come back in the same round; your answers also go into the spaced-repetition review (Words → Review).</p></section>
      <section class="grid2 menu">
        <button class="tile hero" data-go="cards/lv:${lv}"><b>🎲 Mixed ${lv}</b><span>${words.length} words · 20 per round</span></button>
        <button class="tile" data-go="vocab/review"><b>🔁 Due today</b><span>${SRS.due(V.vocabIds()).length} words to review</span></button>
        <button class="tile" data-go="cards/g:grammar"><b>📐 Grammar cards</b><span>${gc.filter((c) => c.type === "grammar").length} rules in one line</span></button>
        <button class="tile" data-go="cards/g:article_or_case"><b>der · den · dem</b><span>${gc.filter((c) => c.type === "article_or_case").length} article & case cards</span></button>
        <button class="tile" data-go="cards/g:verb"><b>🔤 Verb forms</b><span>${gc.filter((c) => c.type === "verb").length} verb cards</span></button>
      </section>
      <section class="card"><h3>${lv} by topic</h3><div class="topics">${list.map(([t, n]) => `<button class="topic" data-go="cards/t:${encodeURIComponent(t)}"><span>${esc(t)}${TOPIC_EN[t] ? ` <small class="muted">${esc(TOPIC_EN[t])}</small>` : ""}</span><small>${n} cards</small></button>`).join("") || `<p class="muted">No topics at this level.</p>`}</div></section>`;
    el.querySelector(".c-lv").onchange = (e) => { st.cardLevel = e.target.value; Store.save(); V.cards(el, []); };
    el.querySelector(".c-dir").onchange = (e) => { st.cardDir = e.target.value; Store.save(); };
  };
  function cardSession(el, deck) {
    const st = Store.get().settings, lv = st.cardLevel || myLevel(), dir = st.cardDir === "en" ? "en" : "de";
    const [kind, arg] = [deck.split(":")[0], decodeURIComponent(deck.split(":").slice(1).join(":"))];
    let cards, title;
    const fromWord = (w) => ({ id: w.id, front: dir === "de" ? w.de : w.en, back: dir === "de" ? w.en : w.de, de: w.de, art: w.art, pl: w.pl, ex: w.exDe, exEn: w.exEn });
    const ids = V.vocabList(); const byDe = Object.fromEntries(ids.map((w) => [w.de, w]));
    const withId = (w) => Object.assign({}, w, { id: (byDe[w.de] || {}).id });
    if (kind === "g") { title = { grammar: "Grammar cards", article_or_case: "Articles & cases", verb: "Verb forms" }[arg] || "Cards"; cards = (DC.cards || []).filter((c) => c.type === arg).map((c) => ({ front: c.front, back: c.back, de: /[äöüß]|\b(der|die|das|ich|du|er|wir)\b/i.test(c.back) ? c.back : "" })); }
    else if (kind === "t") { title = `${arg} · ${lv}`; cards = DC.vocab.filter((w) => w.level === lv && (w.topic || "Allgemein") === arg).map(withId).map(fromWord); }
    else { title = `Mixed ${arg}`; cards = DC.vocab.filter((w) => w.level === arg).map(withId).map(fromWord); }
    cards = H.shuffle(cards).slice(0, 20);
    if (!cards.length) return (el.innerHTML = UI.empty("No cards here.", `<button class="btn" data-go="cards">Back</button>`));
    let i = 0, known = 0; const total = cards.length;
    const draw = () => {
      if (i >= cards.length) {
        if (window.Habit) Habit.track("words");
        return (el.innerHTML = UI.empty(`🃏 Done – ${known} of ${total} known at the first try.`, `<div class="row center"><button class="btn sign" data-go="cards/${deck}">Another round</button><button class="btn ghost" data-go="cards">All decks</button></div>`));
      }
      const c = cards[i];
      el.innerHTML = `<div class="session"><div class="sess-head"><button class="back" data-go="cards" aria-label="Back">‹</button><span class="sess-title">${esc(title)}</span><span>${Math.min(i + 1, total)}/${total}${cards.length > total ? " +" + (cards.length - total) : ""}</span></div>
        <div class="bar"><i style="width:${(Math.min(i, total) / total) * 100}%"></i></div>
        <button class="flash" aria-label="Turn the card"><span class="front">${UI.colorArticles(c.front)}</span><span class="back" hidden><b>${UI.colorArticles(c.back)}</b>${c.pl ? `<small>${esc(c.pl)}</small>` : ""}${c.ex ? `<i>${esc(c.ex)}</i>${c.exEn ? `<small class="muted">${esc(c.exEn)}</small>` : ""}` : ""}</span></button>
        <div class="row center">${c.de ? UI.say(c.ex || c.de, "Listen") : ""}</div>
        <div class="row center grades" hidden><button class="btn bad" data-g="0">Again</button><button class="btn" data-g="2">I knew it</button></div>
        <p class="muted small center">Say the answer in your head (or out loud), then tap the card.</p></div>`;
      const card = el.querySelector(".flash");
      card.onclick = () => { card.querySelector(".back").hidden = false; el.querySelector(".grades").hidden = false; if (c.de && dir === "en") Speech.speak(c.de); };
      if (c.de && dir === "de") setTimeout(() => Speech.speak(c.de), 200);
      el.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => {
        const g = +b.dataset.g;
        if (c.id) SRS.grade(c.id, g);
        if (g) { if (!c.again) known++; Store.addXP(2); } else { cards.push(Object.assign({}, c, { again: true })); Store.addXP(1); }
        i++; draw();
      }));
    };
    draw();
  }

  /* ---------------- exercises: all drills and the classic bank, by level and type ---------------- */
  const BANK_EN = { connectors: "Connectors", word_order: "Word order", passive: "Passive", konjunktiv_ii: "Konjunktiv II", relative_clauses: "Relative clauses", adjectives: "Adjective endings", sentence_patterns: "Sentence patterns", translation_en_de: "Translate", mixed_quiz: "Mixed quiz", question_to_answer: "Answer the question", answer_to_question: "Ask the question", sentence_structure_reason: "Why this word order?", article_rules: "Article rules", indirect_questions: "Indirect questions", wenn_wann_als: "wenn / wann / als", um_zu_damit: "um … zu / damit", lassen: "lassen", verb_preposition: "Verbs + prepositions", verbindungsadverbien: "deshalb, trotzdem …", prepositions: "Prepositions", infinitiv_mit_zu: "Infinitive with zu", konjunktiv_ii_tipps: "Konjunktiv II tips" };
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  function bankItem(b) {
    const m = /\[([^\]]+)\]/.exec(b.q);
    if (m) { const opts = m[1].split("/").map((x) => x.trim()); return { kind: "choice", gen: "bank:" + b.type, prompt: md(b.q.replace(m[0], "")), answer: opts.includes(b.a) ? b.a : opts[0], options: H.shuffle(opts), why: esc(b.hint) }; }
    return { kind: "input", gen: "bank:" + b.type, prompt: md(b.q), answer: b.a, why: esc(b.hint) };
  }
  V.exercises = (el, [sel]) => {
    if (sel && sel.startsWith("bank:")) {
      const t = sel.slice(5); const pool = H.shuffle(DC.bank.filter((b) => !t || b.type === t || b.level === t));
      if (!pool.length) return (el.innerHTML = UI.empty("No questions here.", `<button class="btn" data-go="exercises">Back</button>`));
      return UI.session(el, (i) => bankItem(pool[i % pool.length]), { title: BANK_EN[t] || (t ? t + " questions" : "Question bank"), total: Math.min(10, pool.length) });
    }
    const types = {}; DC.bank.forEach((b) => (types[b.type] = (types[b.type] || 0) + 1));
    const groups = LV.map((lv) => ({ lv, gens: Object.values(Engine.GEN).filter((g) => g.level === lv) })).filter((g) => g.gens.length);
    el.innerHTML = `${back()}<h2 class="page-title">${H.bi("Übungen", "Exercises")}</h2>
      <p class="muted">Drills make new sentences every time and explain every answer. The question bank has the hand-checked classic questions.</p>
      <section class="card"><h3>📋 Question bank – ${DC.bank.length} questions</h3><div class="topics">
        <button class="topic" data-go="exercises/bank:"><span><b>All, mixed</b></span><small>${DC.bank.length}</small></button>
        ${["A1", "A2", "B1", "B2"].filter((l) => DC.bank.some((b) => b.level === l)).map((l) => `<button class="topic" data-go="exercises/bank:${l}"><span>${UI.levelDot(l)} ${l}</span><small>${DC.bank.filter((b) => b.level === l).length}</small></button>`).join("")}
        ${Object.entries(types).filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<button class="topic" data-go="exercises/bank:${t}"><span>${esc(BANK_EN[t] || t.replace(/_/g, " "))}</span><small>${n}</small></button>`).join("")}</div></section>
      ${groups.map((g) => `<section class="card"><h3>${UI.levelDot(g.lv)} ${g.lv} drills</h3><div class="topics">${g.gens.map((x) => `<button class="topic" data-go="practice/${x.id}"><span>${esc(x.title)}</span><small>L${x.lessons.map(Course.pos).sort((a, b) => a - b).join(", L")}</small></button>`).join("")}</div></section>`).join("")}`;
  };

  /* ---------------- conjugation: verb tables + drill ---------------- */
  const PRO = [["ich", "ich"], ["du", "du"], ["er", "er/sie/es"], ["wir", "wir"], ["ihr", "ihr"], ["sie", "sie/Sie"]];
  V.verbs = (el, [inf]) => {
    if (inf === "drill") return verbDrill(el);
    if (inf) {
      inf = decodeURIComponent(inf);
      el.innerHTML = `${back("verbs", "All verbs")}<h2 class="page-title">${esc(inf)}</h2><section class="card">${Tutor.conjugateHtml(inf)}</section>
        <div class="row"><button class="btn sign" data-go="verbs/drill">Practise conjugation</button></div>`;
      return;
    }
    const all = Object.entries(DC.conj).map(([k, v]) => ({ inf: k, en: v.en, level: v.level || "", type: v.type || "" })).sort((a, b) => (a.level + a.inf).localeCompare(b.level + b.inf));
    el.innerHTML = `${back()}<h2 class="page-title">${H.bi("Konjugation", "Conjugation")}</h2>
      <section class="grid2"><button class="tile hero" data-go="verbs/drill"><b>🎯 Conjugation drill</b><span>10 forms · ich, du, er …</span></button><button class="tile" data-go="cards/g:verb"><b>🃏 Verb cards</b><span>Perfekt & Präteritum</span></button></section>
      <section class="card"><div class="filters"><input class="search" type="search" placeholder="Find a verb (German or English)">${lvSel("vlv")}<select class="vty"><option value="">All verbs</option><option value="irregular">Irregular only</option><option value="regular">Regular only</option></select></div><ul class="wordlist vlist"></ul></section>`;
    const list = el.querySelector(".vlist"), q = el.querySelector(".search"), lv = el.querySelector(".vlv"), ty = el.querySelector(".vty");
    const draw = () => {
      const t = q.value.toLowerCase().trim();
      const rows = all.filter((v) => (!lv.value || v.level === lv.value) && (!ty.value || v.type === ty.value || (ty.value === "regular" && v.type !== "irregular" && v.type !== "modal")) && (!t || v.inf.includes(t) || (v.en || "").toLowerCase().includes(t))).slice(0, 200);
      list.innerHTML = rows.map((v) => `<li><button class="link" data-go="verbs/${encodeURIComponent(v.inf)}"><b>${esc(v.inf)}</b></button> <span class="muted">${esc(v.en || "")}</span> <small>${esc(v.level)}${v.type === "irregular" ? " · irregular" : ""}</small></li>`).join("") || `<li class="muted">No verb found.</li>`;
    };
    q.oninput = draw; lv.onchange = draw; ty.onchange = draw; draw();
  };
  function verbDrill(el) {
    const lvl = myLevel(); const okLv = LV.slice(0, LV.indexOf(lvl) + 2);
    const pool = Object.entries(DC.conj).filter(([, v]) => v.f && (!v.level || okLv.includes(v.level)));
    UI.session(el, () => {
      const [inf, v] = pool[Math.floor(Math.random() * pool.length)]; const [k, label] = PRO[Math.floor(Math.random() * PRO.length)];
      const ans = String(v.f[k] || "").trim(); const p = label.split("/")[0]; const shown = k === "sie" ? "sie (they) / Sie" : k === "er" ? "er / sie / es" : p;
      return { kind: "input", gen: "conj", prompt: `<b>${esc(inf)}</b> <span class="muted">(${esc(v.en || "")})</span> → <b>${esc(shown)}</b> ___`, answer: ans, full: `${p.charAt(0).toUpperCase() + p.slice(1)} ${ans} …`, why: `${esc(inf)}: ${PRO.map(([kk, l]) => `${l.split("/")[0]} <b>${esc(v.f[kk] || "")}</b>`).join(" · ")}${v.type === "irregular" ? " – irregular verb" : ""}.` };
    }, { title: "Conjugation drill", total: 10 });
  }

  /* ---------------- sentences: translate English → German ---------------- */
  V.sentences = (el, [lv]) => {
    const S = DC.sentences || {};
    if (lv) {
      const pool = H.shuffle(lv === "mix" ? Object.values(S).flat() : S[lv] || []);
      if (!pool.length) return (el.innerHTML = UI.empty("No sentences.", `<button class="btn" data-go="sentences">Back</button>`));
      return UI.session(el, (i) => { const s = pool[i % pool.length]; return { kind: "input", gen: "sent:" + lv, prompt: `Translate into German:<br><b>${esc(s.en)}</b>`, answer: s.de, full: s.de, why: "" }; }, { title: `Sentences ${lv === "mix" ? "mixed" : lv}`, total: 10 });
    }
    el.innerHTML = `${back()}<h2 class="page-title">${H.bi("Sätze übersetzen", "Translate sentences")}</h2>
      <p class="muted">Write the German sentence. Small differences (punctuation, capitals) are forgiven; the feedback shows exactly what to change and why.</p>
      <section class="grid2">${Object.keys(S).map((l) => `<button class="tile" data-go="sentences/${l}"><b>${UI.levelDot(l)} ${l}</b><span>${S[l].length} sentences</span></button>`).join("")}<button class="tile hero" data-go="sentences/mix"><b>🎲 Mixed</b><span>All levels</span></button></section>
      <section class="card"><h3>All sentences</h3>${Object.entries(S).map(([l, xs]) => `<details><summary>${l} · ${xs.length}</summary><ul class="sentlist">${xs.map((s) => `<li><span>${esc(s.de)}</span> ${UI.say(s.de)}<br><small class="muted">${esc(s.en)}</small></li>`).join("")}</ul></details>`).join("")}</section>`;
  };

  /* ---------------- describe a picture ---------------- */
  /* what an examiner listens for: German, enough sentences, words for what is in the picture,
     the picture phrases (Auf dem Bild … / im Hintergrund … / links …), an opinion or own experience, correct grammar */
  const EN_W = /\b(the|is|are|and|a|an|i|you|see|there|they|with|this|of|in the|people|eating|picture)\b/gi;
  function picCheck(text, p) {
    const t = String(text).trim(), ss = t.split(/(?<=[.!?])\s+/).filter((x) => x.trim()), ws = t.split(/\s+/).filter(Boolean);
    const english = ws.length >= 3 && ((t.match(EN_W) || []).length / ws.length > 0.3) && !/[äöüß]|\b(ich|und|ist|sind|die|der|das|auf|sehe)\b/i.test(t);
    const need = { A1: 4, A2: 5, B1: 6 }[p.level] || 5;
    const stems = p.words.map(([d]) => d.replace(/^(der|die|das)\s+/i, "").split(/[\s,/]/)[0].toLowerCase().slice(0, 5)).filter((x) => x.length >= 4);
    const used = stems.filter((st) => ws.some((w) => w.toLowerCase().includes(st)));
    const phr = [/auf dem (bild|foto)|das bild zeigt|ich sehe|man sieht|sieht man/i, /vordergrund|hintergrund|links|rechts|in der mitte|neben|vor |hinter /i];
    const opinion = /\b(ich glaube|ich denke|ich finde|vielleicht|wahrscheinlich|meiner meinung)\b/i.test(t);
    const own = /\b(ich|mein|meine|mir|mich)\b/i.test(t.replace(/^ich sehe\b|ich glaube|ich denke|ich finde/gi, ""));
    const fixes = ss.map((x) => ({ s: x, r: Tutor.check(x) })).filter((x) => x.r.issues.length);
    const checks = [
      [!english, "In German", english ? "This is English – describe the picture in German. Start with „Auf dem Bild sehe ich …“." : "Good – all in German."],
      [ss.length >= need, `${need}+ sentences`, ss.length >= need ? `${ss.length} sentences.` : `You have ${ss.length}. Add ${need - ss.length} more: who, where, what they do, how it looks.`],
      [used.length >= 2, "Words for the picture", used.length >= 2 ? `You used ${used.length} of the useful words.` : `Name what you see – e.g. ${p.words.slice(0, 3).map(([d]) => d).join(", ")}.`],
      [phr.every((r) => r.test(t)), "Picture phrases", phr.every((r) => r.test(t)) ? "You placed things in the picture." : `Use ${!phr[0].test(t) ? "„Auf dem Bild sehe ich …“" : ""}${!phr[0].test(t) && !phr[1].test(t) ? " and " : ""}${!phr[1].test(t) ? "„links / rechts / im Hintergrund …“" : ""}.`],
      [opinion, "A guess or opinion", opinion ? "You said what you think." : "Add one guess: „Ich glaube, …“ / „Vielleicht …“."],
      [own, "About you", own ? "You connected it to your life." : "Answer the last question about yourself."],
      [!fixes.length, "Grammar rules", fixes.length ? `${fixes.length} sentence${fixes.length > 1 ? "s" : ""} to fix – see below.` : "Max found no rule problems."],
    ];
    let score = english ? 10 : Math.round(checks.reduce((a, [ok], i) => a + (ok ? [10, 20, 15, 15, 10, 10, 20][i] : 0), 0) - Math.max(0, fixes.length - 1) * 5);
    score = Math.max(0, Math.min(100, score));
    const verdict = score >= 85 ? ["Sehr gut!", "Very good!"] : score >= 65 ? ["Gut!", "Good!"] : score >= 45 ? ["Okay – noch besser:", "Okay – to make it better:"] : ["Weiter üben", "Keep working on it"];
    return { score, html: `<div class="fb-open"><div class="fb-head"><span class="fb-score ${score >= 65 ? "good" : score >= 45 ? "mid" : "low"}">${score}</span><div><b>${H.bi(verdict[0], verdict[1])}</b><div class="pbar sm"><span style="width:${score}%"></span></div></div></div>
      <ul class="fb-list">${checks.map(([ok, l, tip]) => `<li class="${ok ? "y" : "n"}"><span>${ok ? "✓" : "✗"}</span><div><b>${esc(l)}</b><br><span class="muted">${esc(tip)}</span></div></li>`).join("")}</ul>
      ${fixes.length ? `<h4>Corrections</h4>${fixes.map((x) => `<p class="fb-you">${esc(x.s)}</p><p class="ex ok">→ ${esc(x.r.fixed)} ${UI.say(x.r.fixed)}</p><ul class="nots">${x.r.issues.map((i) => `<li>${i.rule}<br><span class="muted">${i.why}</span></li>`).join("")}</ul>`).join("")}` : ""}
      <details class="fb-model" ${score < 45 ? "open" : ""}><summary>📝 Model description</summary><p class="ex">${esc(p.model)} ${UI.say(p.model)}</p></details></div>` };
  }
  V.pictures = (el, [idx]) => {
    const P = DC.pictures || [];
    if (idx !== undefined && P[+idx]) {
      const p = P[+idx];
      el.innerHTML = `${back("pictures", "All pictures")}<h2 class="page-title">${esc(p.title)} <span class="muted small">${esc(p.en)} · ${p.level}</span></h2>
        <figure class="pic"><img src="${esc(p.img)}" alt="${esc(p.en)}" loading="lazy"></figure>
        <section class="card"><h3>Talk about the picture</h3><ol class="picq">${p.q.map((q) => `<li lang="de">${esc(q)} ${UI.say(q)} ${UI.hint(q)}</li>`).join("")}</ol>
          <details><summary>Useful words (${p.words.length})</summary><ul class="picw">${p.words.map(([d, e]) => `<li><b>${UI.colorArticles(d)}</b> ${UI.say(d)} <span class="muted">${esc(e)}</span></li>`).join("")}</ul></details>
          <p class="muted small">Start with: <i>Auf dem Bild sehe ich … · Im Vordergrund/Hintergrund … · Links/Rechts … · Ich glaube, dass …</i></p></section>
        <section class="card"><h3>Your description</h3><textarea rows="5" placeholder="Speak or write 4–8 sentences in German…"></textarea>
          <div class="row">${UI.mic("Speak")}<button class="btn sm chk">Check my description</button><button class="btn ghost sm mdl">Model description</button></div><div class="pfb"></div></section>
        <div class="row">${+idx > 0 ? `<button class="btn ghost" data-go="pictures/${+idx - 1}">‹ Previous</button>` : ""}${+idx < P.length - 1 ? `<button class="btn" data-go="pictures/${+idx + 1}">Next picture ›</button>` : ""}</div>`;
      const ta = el.querySelector("textarea"), f = el.querySelector(".pfb");
      UI.bindMic(el, (t) => { ta.value = (ta.value ? ta.value + " " : "") + t; });
      el.querySelector(".chk").onclick = () => {
        if (!ta.value.trim()) return H.toast("Speak or write a description first.");
        const r = picCheck(ta.value, p);
        f.innerHTML = r.html; Store.addXP(r.score >= 65 ? 10 : 4); if (window.Habit) { Habit.track("speak"); Habit.track("write"); }
      };
      el.querySelector(".mdl").onclick = () => { f.innerHTML = `<div class="fb-model"><b>📝 Model description</b><p class="ex">${esc(p.model)} ${UI.say(p.model)}</p><p class="muted small">One possible description – say it out loud, then describe the picture your own way.</p></div>`; };
      return;
    }
    el.innerHTML = `${back()}<h2 class="page-title">${H.bi("Bildbeschreibung", "Describe a picture")}</h2>
      <p class="muted">In the A2–B1 speaking exams you describe a photo and say what you think. Look, answer the questions out loud, then check your description.</p>
      <section class="picgrid">${P.map((p, i) => `<button class="pictile" data-go="pictures/${i}"><img src="${esc(p.img)}" alt="" loading="lazy"><b>${esc(p.title)}</b><span>${esc(p.en)} · ${p.level}</span></button>`).join("")}</section>`;
  };
})();
