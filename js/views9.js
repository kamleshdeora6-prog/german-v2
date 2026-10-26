/* Deutsch Coach – "Erste Schritte · First steps": a picture course for people who know zero German.
   Routes:  #/starter                 the unit path
            #/starter/u/<unit>        one round (level 1 → 2 → 3, then "practise again")
            #/starter/cards/<unit>    flip flashcards for a unit
            #/starter/review          mixed review of everything learnt so far
   A round: new words are introduced with a picture and audio, then checked straight away in many
   small exercise types (pick the picture, listen, match pairs, der/die/das, type, build a sentence).
   Wrong answers come back at the end of the round, so every round ends with everything right. */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});
  const UNITS = () => DC.starter || [];
  const unit = (id) => UNITS().find((u) => u.id === id);
  const NO_PIC_UNITS = new Set(["hallo", "ich", "zeit", "hilfe", "gefuehle"]);   // abstract words: their emoji is decoration, not a clue

  /* ---------- words ---------- */
  const W = (u, i) => {
    const [de, en, e] = u.words[i];
    const m = /^(der|die|das)\s+(.+)$/.exec(de);
    return { id: "st:" + de, de, en, e: e || "", art: m ? m[1] : "", base: m ? m[2] : de, unit: u.id, pics: !NO_PIC_UNITS.has(u.id) && !!e };
  };
  const words = (u) => u.words.map((_, i) => W(u, i));
  const allLearnt = () => UNITS().filter((u) => lvlOf(u.id) > 0).flatMap(words);

  /* ---------- progress ---------- */
  const st = () => { const s = Store.get(); s.starter = s.starter || { u: {} }; s.starter.u = s.starter.u || {}; return s.starter; };
  const lvlOf = (id) => (st().u[id] && st().u[id].lvl) || 0;
  const unlocked = (i) => i === 0 || Store.get().settings.unlockAll || lvlOf(UNITS()[i - 1].id) > 0 || lvlOf(UNITS()[i].id) > 0;
  V.starterProgress = () => { const L = UNITS(); const done = L.filter((u) => lvlOf(u.id) >= 1).length; return { done, total: L.length, mastered: L.filter((u) => lvlOf(u.id) >= 3).length, next: L.find((u, i) => unlocked(i) && lvlOf(u.id) < 1) }; };

  /* ---------- helpers ---------- */
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pickN = (a, n) => shuffle(a).slice(0, n);
  const norm = (s) => String(s || "").normalize("NFC").toLowerCase().replace(/[.,!?;:„“"'’…()¿¡-]/g, " ").replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/\s+/g, " ").trim();
  const lev = (a, b) => { const m = a.length, n = b.length; let p = Array.from({ length: n + 1 }, (_, i) => i); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; };
  const say = (t, slow) => Speech.speak(t, slow ? 0.6 : Math.min(0.9, (Store.get().settings.rate || 0.9)));
  const artCls = (a) => (a ? "g-" + { der: "m", die: "f", das: "n" }[a] : "");
  const wordHtml = (w) => (w.art ? `<span class="${artCls(w.art)}">${w.art}</span> ${esc(w.base)}` : esc(w.de));
  const pic = (w, big) => `<span class="st-pic${big ? " big" : ""}" aria-hidden="true">${w.e || "🔤"}</span>`;
  const tokens = (s) => s.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);

  /* options that cannot be confused: different German, different English and (for picture questions) a different picture */
  function distractors(w, pool, n, byPic) {
    const seen = new Set([norm(w.de), norm(w.en)]); const pics = new Set([w.e]); const out = [];
    for (const x of shuffle(pool)) {
      if (out.length >= n) break;
      if (seen.has(norm(x.de)) || seen.has(norm(x.en)) || (byPic && (!x.pics || pics.has(x.e)))) continue;
      seen.add(norm(x.de)); seen.add(norm(x.en)); pics.add(x.e); out.push(x);
    }
    return out;
  }
  const poolFor = (u) => { const own = words(u); if (own.length >= 8) return own; const i = UNITS().indexOf(u); return own.concat(UNITS().slice(Math.max(0, i - 2), i).flatMap(words)); };

  /* ---------- building a round ---------- */
  function buildRound(u, lvl) {
    const all = words(u), pool = poolFor(u), half = Math.ceil(all.length / 2);
    const nouns = (ws) => ws.filter((w) => w.art);
    const mc = (type, w) => {
      const byPic = type === "pick" && w.pics;
      const ds = distractors(w, pool, 3, byPic);
      return { type, w, opts: shuffle([w].concat(ds)) };
    };
    const q = [];
    const intro = (ws) => ws.forEach((w, i) => { q.push({ type: "intro", w }); if (i % 2 === 1 || i === ws.length - 1) { const a = ws[i - (i % 2)], b = ws[i]; [a, b].filter((x, k, arr) => arr.indexOf(x) === k).forEach((x) => q.push(mc(x.pics ? "pick" : "en2de", x))); } });
    const sentences = shuffle(u.phrases || []);
    const build = (p, listen) => {
      const tk = tokens(p[0]);
      const extra = distractors({ de: p[0], en: p[1], e: "" }, pool, 6, false).flatMap((x) => tokens(x.base)).filter((t) => !tk.some((k) => norm(k) === norm(t)));
      return { type: listen ? "listenbuild" : "build", p, tiles: shuffle(tk.concat(pickN([...new Set(extra)], Math.min(3, Math.max(2, 7 - tk.length))))) };
    };
    if (lvl === 1) {
      const A = all.slice(0, half);
      intro(A);
      q.push({ type: "match", pairs: pickN(A, Math.min(5, A.length)) });
      shuffle(A).slice(0, 4).forEach((w, i) => q.push(mc(["de2en", "listen", "en2de", "de2en"][i], w)));
      if (sentences[0]) q.push(build(sentences[0]));
    } else if (lvl === 2) {
      const B = all.slice(half);
      intro(B);
      q.push({ type: "match", pairs: pickN(all, 5) });
      const T2 = ["listen", "de2en", "en2de", "pick", "listen", "de2en"];
      shuffle(all).slice(0, 6).forEach((w, i) => q.push(mc(T2[i] === "pick" && !w.pics ? "en2de" : T2[i], w)));
      pickN(nouns(all), 2).forEach((w) => q.push({ type: "article", w }));
      sentences.slice(0, 2).forEach((p, i) => q.push(build(p, i === 1)));
    } else {
      // level 3 = recall: typing from memory, listening, articles, sentences – in mixed order, the pair game in the middle
      const mix = [];
      pickN(all, 4).forEach((w) => mix.push({ type: "type", w }));
      pickN(all, 3).forEach((w) => mix.push(mc("listen", w)));
      pickN(nouns(all), 2).forEach((w) => mix.push({ type: "article", w }));
      sentences.slice(0, 3).forEach((p, i) => mix.push(build(p, i === 2)));
      q.push(...shuffle(mix));
      q.splice(Math.min(5, q.length), 0, { type: "match", pairs: pickN(all, 5) });
    }
    return q;
  }
  function buildReview() {
    const ws = allLearnt(); if (!ws.length) return [];
    const due = SRS.due(ws.map((w) => w.id)); const pri = ws.filter((w) => due.includes(w.id));
    const pick = shuffle(pri).concat(shuffle(ws.filter((w) => !due.includes(w.id)))).slice(0, 10);
    const q = pick.map((w, i) => {
      const t = ["de2en", "listen", "en2de", "type", "pick", "article"][i % 6];
      if (t === "type") return { type: "type", w };
      if (t === "article") return w.art ? { type: "article", w } : { type: "de2en", w, opts: shuffle([w].concat(distractors(w, ws, 3))) };
      const tt = t === "pick" && !w.pics ? "en2de" : t;
      return { type: tt, w, opts: shuffle([w].concat(distractors(w, ws, 3, tt === "pick"))) };
    });
    const units = UNITS().filter((u) => lvlOf(u.id) > 0);
    const p = shuffle(units.flatMap((u) => (u.phrases || []).map((x) => [x, u])))[0];
    if (p) { const tk = tokens(p[0][0]); q.splice(5, 0, { type: "build", p: p[0], tiles: shuffle(tk.concat(pickN(ws.map((w) => w.base).filter((x) => !/\s/.test(x) && !tk.includes(x)), 3))) }); }
    if (ws.length >= 5) q.push({ type: "match", pairs: pickN(ws, 5) });
    return q;
  }

  /* ---------- the unit path ---------- */
  function pathView(el) {
    const L = UNITS(); const pr = V.starterProgress();
    const due = SRS.due(allLearnt().map((w) => w.id)).length;
    const lab = Store.get().settings.labels || "both";
    el.innerHTML = `<button class="back" data-go="path">‹ Course</button>
      <h2 class="page-title">${H.bi("Erste Schritte", "First steps")}</h2>
      <section class="card st-hero">
        <p><b>German from zero.</b> Pictures, sound and tiny rounds of 3–5 minutes – no grammar words, no reading needed. ${L.length} units, ${L.reduce((n, u) => n + u.words.length, 0)} words and ${L.reduce((n, u) => n + (u.phrases || []).length, 0)} everyday sentences.</p>
        <div class="st-bar"><i style="width:${Math.round((pr.done / L.length) * 100)}%"></i></div>
        <p class="muted small">${pr.done} of ${L.length} units started · ${pr.mastered} mastered (3 levels)</p>
        <div class="row">${pr.next ? `<button class="btn sign" data-go="starter/u/${pr.next.id}">${pr.done ? "Continue" : "Start now"}: ${esc(pr.next.en)}</button>` : ""}
          ${due ? `<button class="btn ghost" data-go="starter/review">🔁 Review ${due} word${due === 1 ? "" : "s"}</button>` : allLearnt().length ? `<button class="btn ghost" data-go="starter/review">🔁 Mixed review</button>` : ""}</div>
        <div class="st-lang"><span class="muted small">Show the app in</span>
          <div class="seg">${[["en", "English"], ["both", "German + English"]].map(([v, t]) => `<button data-labset="${v}" class="${lab === v ? "on" : ""}">${t}</button>`).join("")}</div></div>
      </section>
      <ol class="st-path">${L.map((u, i) => {
        const lv = lvlOf(u.id), open = unlocked(i);
        const btn = !open ? `<span class="muted small">🔒 Finish “${esc(L[i - 1].en)}” first</span>` : `<button class="btn ${lv < 3 ? "sign" : "ghost"} sm" data-go="starter/u/${u.id}">${lv === 0 ? "Start" : lv < 3 ? `Level ${lv + 1}` : "Practise again"}</button><button class="btn ghost sm" data-go="starter/cards/${u.id}">🃏 Cards</button>`;
        return `<li class="st-node ${open ? "" : "locked"} ${lv >= 3 ? "gold" : lv ? "started" : ""}">
          <div class="st-ic" style="--p:${(lv / 3) * 100}%"><span>${u.icon}</span></div>
          <div class="st-body"><b>${i + 1}. ${esc(u.en)}</b> <span class="muted small" lang="de">${esc(u.de)}</span>
            <div class="st-crowns" aria-label="${lv} of 3 levels">${[1, 2, 3].map((k) => `<i class="${k <= lv ? "on" : ""}"></i>`).join("")}</div>
            <div class="row">${btn}</div></div></li>`;
      }).join("")}</ol>
      <section class="card"><h3>After First steps</h3><p>You can greet, introduce yourself, order food and drink, ask the way and say what you need. The real course starts with <b>Lesson 1</b>: it explains the grammar behind what you've learnt (in English when the app is set to English).</p>
        <button class="btn" data-go="lesson/1">Go to Lesson 1 →</button></section>`;
    el.querySelectorAll("[data-labset]").forEach((b) => (b.onclick = () => { Store.get().settings.labels = b.dataset.labset; Store.save(); App.applyTheme(); pathView(el); H.toast(b.dataset.labset === "en" ? "The app is now in English. German stays in the lessons." : "Menus now show German and English."); }));
  }

  /* ---------- flashcards ---------- */
  function cardsView(el, u) {
    let deck = shuffle(words(u)), i = 0, known = 0, again = [];
    const draw = () => {
      if (i >= deck.length) {
        if (again.length) { deck = shuffle(again); again = []; i = 0; return draw(); }
        el.innerHTML = `<div class="st-done"><div class="st-pic big">🃏</div><h2>All ${words(u).length} cards done!</h2><p class="muted">${known} known first time.</p>
          <div class="row center"><button class="btn sign" data-go="starter/u/${u.id}">Play a round</button><button class="btn ghost" data-go="starter">Back to First steps</button></div></div>`;
        Store.addXP(5); return;
      }
      const w = deck[i];
      el.innerHTML = `<button class="back" data-go="starter">‹ First steps</button>
        <h2 class="page-title">${u.icon} ${esc(u.en)} <span class="muted small">· cards</span></h2>
        <p class="muted small">Card ${i + 1} of ${deck.length}. Say the German word out loud, then flip.</p>
        <button class="flip" aria-label="Flip the card"><div class="flip-in">
          <div class="face f-front">${pic(w, true)}<div class="st-word">${wordHtml(w)}</div><span class="muted small">tap to see the meaning</span></div>
          <div class="face f-back">${pic(w, true)}<div class="st-en">${esc(w.en)}</div><div class="st-word small">${wordHtml(w)}</div></div></div></button>
        <div class="row center"><button class="btn ghost hear">🔊 Listen</button><button class="btn ghost slow">🐢 Slowly</button></div>
        <div class="row center st-grade" hidden><button class="btn bad again">↺ Again</button><button class="btn sign gotit">✓ I knew it</button></div>`;
      const f = el.querySelector(".flip"), g = el.querySelector(".st-grade");
      f.onclick = () => { f.classList.toggle("on"); g.hidden = false; };
      el.querySelector(".hear").onclick = () => say(w.de);
      el.querySelector(".slow").onclick = () => say(w.de, true);
      el.querySelector(".again").onclick = () => { SRS.grade(w.id, 0); again.push(w); i++; draw(); };
      el.querySelector(".gotit").onclick = () => { SRS.grade(w.id, 2); known++; i++; draw(); };
      say(w.de);
    };
    draw();
  }

  /* ---------- a round ---------- */
  function session(el, queue, opts) {
    let done = 0, right = 0, wrong = 0, xp = 0, locked = false;
    const missed = new Set(), seenW = new Map();
    const t0 = Date.now();
    Habit.resetCombo && Habit.resetCombo();
    document.body.classList.add("st-focus");
    el.innerHTML = `<div class="st-sess"><div class="st-top"><button class="st-x" aria-label="Quit the round">✕</button><div class="st-bar"><i></i></div><span class="st-combo"></span></div>
      <div class="st-stage"></div></div><div class="st-foot" hidden><div class="st-foot-in"><div class="st-msg"></div><button class="btn big-btn st-go">Continue</button></div></div>`;
    const stage = el.querySelector(".st-stage"), foot = el.querySelector(".st-foot"), msg = el.querySelector(".st-msg"), go = el.querySelector(".st-go");
    el.querySelector(".st-x").onclick = () => { Speech.stop(); document.body.classList.remove("st-focus"); App.go("starter"); };   // nothing is lost: progress counts only for finished rounds
    const bar = () => { el.querySelector(".st-bar i").style.width = Math.round((done / Math.max(1, done + queue.length)) * 100) + "%"; };

    function feedback(ok, html, item) {
      locked = true;
      if (item.w) { const r = seenW.get(item.w.id) || { ok: 0, bad: 0 }; ok ? r.ok++ : r.bad++; seenW.set(item.w.id, r); }
      if (item.type !== "intro" && item.type !== "match") {
        const h = Habit.answer(ok); xp += ok ? 1 + h.bonus : 0;
        el.querySelector(".st-combo").textContent = h.combo >= 3 ? `🔥 ${h.combo}` : "";
        ok ? right++ : wrong++;
        if (!ok && !item.retry) { missed.add(item); queue.push(Object.assign({}, item, { retry: true, opts: item.opts ? shuffle(item.opts) : item.opts, tiles: item.tiles ? shuffle(item.tiles) : item.tiles })); }
      }
      foot.hidden = false; foot.className = "st-foot " + (ok ? "ok" : "bad");
      msg.innerHTML = html; go.textContent = "Continue"; go.focus({ preventScroll: true });
    }
    go.onclick = () => { foot.hidden = true; done++; next(); };

    function next() {
      locked = false; bar();
      const item = queue.shift();
      V._stItem = item;   // the current exercise (used by the automated tests)
      if (!item) return finish();
      stage.innerHTML = ""; stage.className = "st-stage t-" + item.type;
      ({ intro, pick: mcView, de2en: mcView, en2de: mcView, listen: mcView, article, match, type: typeView, build: buildView, listenbuild: buildView })[item.type](item);
    }

    function intro(item) {
      const w = item.w;
      stage.innerHTML = `<p class="st-kicker">✨ New word</p><div class="st-card">${pic(w, true)}<div class="st-word">${wordHtml(w)} ${UI.say(w.de)}</div><div class="st-en">${esc(w.en)}</div>
        ${w.art ? `<p class="muted small">Learn it with <b class="${artCls(w.art)}">${w.art}</b> – blue = der, red = die, green = das.</p>` : ""}</div>`;
      say(w.de);
      foot.hidden = false; foot.className = "st-foot"; msg.innerHTML = ""; go.textContent = "Got it"; locked = true;
      seenW.set(w.id, seenW.get(w.id) || { ok: 0, bad: 0 });
    }

    function mcView(item) {
      const w = item.w, t = item.type;
      const prompt = t === "pick" ? `Which one is <b>“${esc(w.en)}”</b>?` : t === "en2de" ? `How do you say <b>“${esc(w.en)}”</b>?` : t === "de2en" ? `What does this mean?` : `What do you hear?`;
      const head = t === "de2en" ? `<div class="st-q">${w.pics ? pic(w) : ""}<span class="st-word">${wordHtml(w)}</span> ${UI.say(w.de)}</div>` : t === "listen" ? `<div class="st-q"><button class="st-big-say" aria-label="Listen again">🔊</button><button class="st-slow" aria-label="Listen slowly">🐢</button></div>` : t === "pick" ? "" : "";
      const label = (o) => (t === "de2en" ? esc(o.en) : t === "pick" ? `${pic(o)}<span>${wordHtml(o)}</span>` : wordHtml(o));
      stage.innerHTML = `<p class="st-kicker">${prompt}</p>${head}<div class="st-opts ${t === "pick" ? "pics" : ""}">${item.opts.map((o, k) => `<button class="st-opt" data-k="${k}"><kbd>${k + 1}</kbd>${label(o)}</button>`).join("")}</div>`;
      if (t === "de2en" || t === "listen") say(w.de);
      const sb = stage.querySelector(".st-big-say"); if (sb) sb.onclick = () => say(w.de);
      const sl = stage.querySelector(".st-slow"); if (sl) sl.onclick = () => say(w.de, true);
      stage.querySelectorAll(".st-opt").forEach((b) => (b.onclick = () => {
        if (locked) return;
        const o = item.opts[+b.dataset.k], ok = o === w;
        stage.querySelectorAll(".st-opt").forEach((x) => { x.disabled = true; if (item.opts[+x.dataset.k] === w) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        if (t !== "de2en" && t !== "listen") say(w.de);
        feedback(ok, ok ? `<b>${H.bi("Richtig!", "Correct!")}</b> ${wordHtml(w)} = ${esc(w.en)}` : `<b>Correct answer:</b> ${wordHtml(w)} = ${esc(w.en)}`, item);
      }));
    }

    function article(item) {
      const w = item.w;
      stage.innerHTML = `<p class="st-kicker">der, die or das?</p><div class="st-q">${w.pics ? pic(w, true) : ""}<span class="st-word">___ ${esc(w.base)}</span></div><p class="muted small center">${esc(w.en)}</p>
        <div class="st-opts arts">${["der", "die", "das"].map((a, k) => `<button class="st-opt ${artCls(a)}" data-a="${a}"><kbd>${k + 1}</kbd>${a}</button>`).join("")}</div>`;
      stage.querySelectorAll(".st-opt").forEach((b) => (b.onclick = () => {
        if (locked) return; const ok = b.dataset.a === w.art;
        stage.querySelectorAll(".st-opt").forEach((x) => { x.disabled = true; if (x.dataset.a === w.art) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong"); say(w.de);
        feedback(ok, `${ok ? `<b>${H.bi("Richtig!", "Correct!")}</b> ` : "<b>It's</b> "}${wordHtml(w)}`, item);
      }));
    }

    function match(item) {
      const ps = item.pairs; let sel = null, left = ps.length, errs = 0;
      const L = shuffle(ps), R = shuffle(ps);
      stage.innerHTML = `<p class="st-kicker">Tap the pairs</p><div class="st-match"><div>${L.map((w) => `<button class="st-m de" data-id="${esc(w.id)}">${w.pics ? pic(w) : ""}<span>${esc(w.de)}</span></button>`).join("")}</div><div>${R.map((w) => `<button class="st-m en" data-id="${esc(w.id)}">${esc(w.en)}</button>`).join("")}</div></div>`;
      stage.querySelectorAll(".st-m").forEach((b) => (b.onclick = () => {
        if (b.classList.contains("done")) return;
        if (b.classList.contains("de")) say(ps.find((w) => w.id === b.dataset.id).de);
        if (!sel || sel.classList.contains(b.classList.contains("de") ? "de" : "en")) { if (sel) sel.classList.remove("sel"); sel = b; b.classList.add("sel"); return; }
        if (sel.dataset.id === b.dataset.id) {
          [sel, b].forEach((x) => { x.classList.remove("sel"); x.classList.add("done"); x.disabled = true; }); sel = null; left--;
          Habit.answer(true);
          if (!left) { right++; xp += errs ? 1 : 3; feedback(true, errs ? `<b>Done!</b> ${errs} wrong tap${errs > 1 ? "s" : ""} on the way.` : `<b>${H.bi("Perfekt!", "Perfect!")}</b> All pairs, no mistakes.`, item); }
        } else {
          errs++; const a = sel, c = b; [a, c].forEach((x) => x.classList.add("wrong")); Habit.answer(false);
          setTimeout(() => [a, c].forEach((x) => x.classList.remove("wrong", "sel")), 450); sel = null;
        }
      }));
    }

    function typeView(item) {
      const w = item.w;
      stage.innerHTML = `<p class="st-kicker">Write it in German</p><div class="st-q">${w.pics ? pic(w, true) : ""}<span class="st-en">${esc(w.en)}</span></div>
        <form class="st-type"><input class="st-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${w.art ? "with der / die / das" : "type in German"}" aria-label="Your answer in German">
        <div class="st-keys">${["ä", "ö", "ü", "ß"].map((c) => `<button type="button" class="chip" data-c="${c}">${c}</button>`).join("")}</div>
        <button class="btn sign big-btn">Check</button><button type="button" class="btn ghost sm st-dunno">I don't know</button></form>`;
      const inp = stage.querySelector(".st-in"); setTimeout(() => inp.focus(), 30);
      stage.querySelectorAll("[data-c]").forEach((b) => (b.onclick = () => { inp.value += b.dataset.c; inp.focus(); }));
      const check = (give) => {
        if (locked) return;
        const a = norm(inp.value), full = norm(w.de), base = norm(w.base);
        if (!a && !give) { inp.focus(); return; }
        let ok = false, note = "";
        if (a === full) ok = true;
        else if (w.art && a === base) { ok = true; note = `Remember the article: <b>${wordHtml(w)}</b>`; }
        else if (w.art && /^(der|die|das) /.test(a) && a.replace(/^\S+ /, "") === base) { ok = false; note = `Right word, wrong article: it's <b>${wordHtml(w)}</b>`; }
        else if (full.length >= 5 && (lev(a, full) === 1 || (w.art && lev(a, base) === 1))) { ok = true; note = `Small typo – it's <b>${wordHtml(w)}</b>`; }
        inp.disabled = true; say(w.de);
        feedback(ok, ok ? `<b>${H.bi("Richtig!", "Correct!")}</b> ${note || wordHtml(w)}` : note || `<b>Correct answer:</b> ${wordHtml(w)}`, item);
      };
      stage.querySelector("form").onsubmit = (e) => { e.preventDefault(); check(false); };
      stage.querySelector(".st-dunno").onclick = () => check(true);
    }

    function buildView(item) {
      const [de, en] = item.p, listen = item.type === "listenbuild";
      stage.innerHTML = `<p class="st-kicker">${listen ? "Listen and build what you hear" : "Build the German sentence"}</p>
        <div class="st-q">${listen ? `<button class="st-big-say" aria-label="Listen again">🔊</button><button class="st-slow" aria-label="Listen slowly">🐢</button>` : `<span class="st-en">“${esc(en)}”</span>`}</div>
        <div class="st-answer" aria-live="polite"></div><div class="st-tiles">${item.tiles.map((t, k) => `<button class="tok" data-k="${k}">${esc(t)}</button>`).join("")}</div>
        <div class="row center"><button class="btn sign big-btn st-check" disabled>Check</button></div>`;
      const ans = stage.querySelector(".st-answer"), chk = stage.querySelector(".st-check");
      const sb = stage.querySelector(".st-big-say"); if (sb) { sb.onclick = () => say(de); say(de); }
      const sl = stage.querySelector(".st-slow"); if (sl) sl.onclick = () => say(de, true);
      const picked = [];
      const sync = () => { chk.disabled = !picked.length; };
      stage.querySelectorAll(".st-tiles .tok").forEach((b) => (b.onclick = () => {
        if (locked) return;
        if (b.parentElement === ans) { picked.splice(picked.indexOf(b), 1); stage.querySelector(".st-tiles").appendChild(b); }
        else { picked.push(b); ans.appendChild(b); }
        sync();
      }));
      chk.onclick = () => {
        if (locked) return;
        const got = picked.map((b) => b.textContent).join(" "), want = tokens(de).join(" ");
        const ok = norm(got) === norm(want);
        stage.querySelectorAll(".tok").forEach((b) => (b.disabled = true));
        say(de);
        feedback(ok, ok ? `<b>${H.bi("Richtig!", "Correct!")}</b> ${esc(de)}` : `<b>Correct answer:</b> ${esc(de)}<br><span class="muted">${esc(en)}</span>`, item);
      };
    }

    function finish() {
      document.body.classList.remove("st-focus");
      const qs = right + wrong, acc = qs ? Math.round((right / qs) * 100) : 100;
      const gain = 10 + Math.min(xp, 20) + (wrong === 0 ? 5 : 0);   // a 3-minute round is worth about as much as a lesson part
      seenW.forEach((r, id) => SRS.grade(id, r.bad ? 1 : 2));
      let head = "Round complete!", sub = "";
      if (opts.unit) {
        const rec = (st().u[opts.unit.id] = st().u[opts.unit.id] || { lvl: 0 });
        const before = rec.lvl; rec.lvl = Math.max(rec.lvl, opts.lvl); rec.best = Math.max(rec.best || 0, acc); rec.last = Date.now();
        if (rec.lvl > before) {
          head = rec.lvl === 3 ? `“${opts.unit.en}” mastered! 👑` : `Level ${rec.lvl} of 3 done!`;
          if (rec.lvl === 1) { const i = UNITS().indexOf(opts.unit); const nx = UNITS()[i + 1]; sub = nx ? `New unit unlocked: ${nx.icon} ${nx.en}` : "That was the last unit – you're ready for Lesson 1."; }
        }
      }
      Store.addXP(gain); Store.save();
      const mins = Math.max(1, Math.round((Date.now() - t0) / 60000));
      const nextBtn = opts.unit ? (lvlOf(opts.unit.id) < 3 ? `<button class="btn sign big-btn" data-go="starter/u/${opts.unit.id}">Next: level ${lvlOf(opts.unit.id) + 1}</button>` : (() => { const nx = V.starterProgress().next; return nx ? `<button class="btn sign big-btn" data-go="starter/u/${nx.id}">Next unit: ${esc(nx.en)}</button>` : `<button class="btn sign big-btn" data-go="lesson/1">Start Lesson 1 →</button>`; })()) : `<button class="btn sign big-btn" data-go="starter/review">Another review</button>`;
      el.innerHTML = `<div class="st-done summary arming"><div class="st-pic big">${acc >= 90 ? "🏆" : acc >= 70 ? "🎉" : "💪"}</div><h2>${esc(head)}</h2>${sub ? `<p><b>${esc(sub)}</b></p>` : ""}
        <div class="st-stats"><div><b>+${gain}</b><span>XP</span></div><div><b>${acc}%</b><span>right</span></div><div><b>${mins}</b><span>min</span></div><div><b>${Habit.bestCombo ? Habit.bestCombo() : 0}</b><span>best combo</span></div></div>
        ${missed.size ? `<p class="muted small">Practised again: ${[...missed].filter((x) => x.w).map((x) => esc(x.w.de)).slice(0, 6).join(", ")}</p>` : ""}
        <div class="row center">${nextBtn}<button class="btn ghost" data-go="starter">Back to First steps</button></div></div>`;
      setTimeout(() => { const s = el.querySelector(".summary"); if (s) s.classList.remove("arming"); }, 700);
      Habit.flush && Habit.flush();
    }

    /* keyboard: 1–4 pick an answer, Enter continues */
    const key = (e) => {
      if (!document.body.contains(el)) { document.removeEventListener("keydown", key); return; }
      if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      if (e.key === "Enter" && !foot.hidden) { e.preventDefault(); go.click(); return; }
      const n = +e.key; if (n >= 1 && n <= 4) { const b = stage.querySelectorAll(".st-opt")[n - 1]; if (b && !b.disabled) b.click(); }
    };
    document.addEventListener("keydown", key);
    next();
  }

  V.starter = (el, parts) => {
    const [mode, id] = parts || [];
    if (!UNITS().length) { el.innerHTML = `<div class="empty"><p>First steps is missing from this version.</p></div>`; return; }
    if (mode === "cards") { const u = unit(id); if (!u) return App.go("starter"); return cardsView(el, u); }
    if (mode === "review") { const q = buildReview(); if (!q.length) { el.innerHTML = `<div class="empty"><p>Finish the first unit, then you can review.</p><button class="btn sign" data-go="starter">First steps</button></div>`; return; } return session(el, q, {}); }
    if (mode === "u") {
      const u = unit(id); const i = UNITS().indexOf(u);
      if (!u) { el.innerHTML = `<div class="empty"><p>Unit not found.</p><button class="btn" data-go="starter">Back to First steps</button></div>`; return; }
      if (!unlocked(i)) { el.innerHTML = `<div class="empty"><p>🔒 “${esc(u.en)}” opens when you finish “${esc(UNITS()[i - 1].en)}”.</p><button class="btn sign" data-go="starter/u/${UNITS()[i - 1].id}">Go there</button></div>`; return; }
      const lvl = Math.min(3, lvlOf(u.id) + 1);
      return session(el, buildRound(u, lvl), { unit: u, lvl });
    }
    pathView(el);
  };
  window.addEventListener("hashchange", () => { if (!/^#\/starter\/(u|review)/.test(location.hash)) document.body.classList.remove("st-focus"); });
  V.starterBuild = buildRound;   // for tests
})();
