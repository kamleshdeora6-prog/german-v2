/* Deutsch Coach – one place for every mistake: drills, lesson tasks, mock exams, writing and speaking corrections.
   Each mistake gets a type ("Dativ", "Exam: Hören", "Writing" …), repeats are counted, and it comes back in
   practice until you get it right twice in a row – then it counts as fixed. */
(function () {
  "use strict";
  const { esc } = H;
  const st = () => Store.get();
  const plain = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const catOf = (m) => m.cat || (m.gen && Engine.GEN[m.gen] ? m.gen : m.gen && /^bank:/.test(m.gen) ? "bank" : m.lesson ? "lesson" + m.lesson : /^Speaking/i.test(m.prompt || "") ? "speak" : "other");
  const M = (window.Mistakes = {
    catOf,
    title(cat) {
      if (Engine.GEN[cat]) return Engine.GEN[cat].title;
      if (/^lesson\d+/.test(cat)) { const l = DC.curriculum.find((x) => x.n === +cat.slice(6)); return l ? `Lesson ${l.pos}: ${H.ltText ? H.ltText(l, "title") : l.title}` : "Lesson"; }
      if (/^telc:/.test(cat)) return "Exam: " + ({ lesen: "Lesen", hoeren: "Hören", sprachbausteine: "Sprachbausteine", schreiben: "Schreiben", sprechen: "Sprechen" }[cat.slice(5)] || cat.slice(5));
      return { bank: "Question bank", write: "Writing", speak: "Speaking", correction: "Corrections from Max", other: "Other" }[cat] || cat;
    },
    all: () => (st().mistakes || []),
    open: () => M.all().filter((m) => !m.fixed),
    fixed: () => M.all().filter((m) => m.fixed),
    groups() {
      const g = {}; M.open().forEach((m) => { const c = catOf(m); (g[c] = g[c] || []).push(m); });
      return Object.entries(g).map(([cat, xs]) => ({ cat, title: M.title(cat), xs, n: xs.reduce((a, m) => a + (m.n || 1), 0) })).sort((a, b) => b.n - a.n);
    },
    /* the next mistakes to practise: most repeated first, not the ones just seen */
    queue(n = 10, cat = null) {
      const now = Date.now();
      return M.open().filter((m) => !cat || catOf(m) === cat).filter((m) => !m.next || m.next <= now)
        .sort((a, b) => (b.n || 1) - (a.n || 1) || (a.seenAt || 0) - (b.seenAt || 0)).slice(0, n);
    },
    /* a practice item for a mistake: a fresh question of the same kind, or the question itself again */
    item(m) {
      let it;
      if (m.gen && Engine.GEN[m.gen]) { try { it = Engine.generate(m.gen); } catch (e) { it = null; } }
      if (!it && m.options && m.options.length) it = { kind: "choice", prompt: m.prompt, answer: m.answer, options: H.shuffle(m.options.slice()), why: m.why || "" };
      if (!it && m.answer) it = { kind: "input", prompt: m.given && !/correct/i.test(m.prompt || "") ? `${m.prompt}<p class="muted small">Last time you wrote: <s>${esc(plain(m.given))}</s></p>` : m.prompt, answer: plain(m.answer), why: m.why || "" };
      if (!it) return null;
      it.gen = it.gen || "mistake:" + catOf(m);
      it.onResult = (ok) => M.result(m, ok);
      return it;
    },
    result(m, ok) {
      m.seenAt = Date.now(); m.tries = (m.tries || 0) + 1;
      if (ok) { m.ok = (m.ok || 0) + 1; m.next = Date.now() + 864e5; if (m.ok >= 2) m.fixed = Date.now(); }
      else { m.ok = 0; m.next = Date.now() + 10 * 60e3; }
      Store.save();
    },
  });
  /* every Store.mistake(…) call goes through here: id, type, and no duplicates */
  const orig = Store.mistake;
  Store.mistake = (m) => {
    const s = st(); s.mistakes = s.mistakes || [];
    const k = plain(m.prompt).slice(0, 160) + "|" + plain(m.answer);
    const dup = s.mistakes.find((x) => !x.fixed && plain(x.prompt).slice(0, 160) + "|" + plain(x.answer) === k);
    if (dup) { dup.n = (dup.n || 1) + 1; dup.t = Date.now(); dup.given = m.given || dup.given; dup.ok = 0; Store.save(); return; }
    orig(Object.assign({ id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), n: 1 }, m));
    // keep 300: drop the oldest fixed ones first
    if (s.mistakes.length > 300) { const fixed = s.mistakes.filter((x) => x.fixed).sort((a, b) => a.fixed - b.fixed); const drop = new Set(fixed.slice(0, s.mistakes.length - 300)); s.mistakes = s.mistakes.filter((x) => !drop.has(x)).slice(0, 300); Store.save(); }
  };
  /* older entries get an id once */
  setTimeout(() => { let ch = false; M.all().forEach((m, i) => { if (!m.id) { m.id = "m" + (m.t || Date.now()).toString(36) + i; ch = true; } }); if (ch) Store.save(); }, 0);

  /* ---------------- the page ---------------- */
  const V = window.Views;
  V.mistakes = (el, [cat]) => {
    if (cat === "go" || (cat && cat.startsWith("go:"))) {
      const c = cat.startsWith("go:") ? decodeURIComponent(cat.slice(3)) : null;
      const q = M.queue(10, c);
      if (!q.length) return (el.innerHTML = UI.empty("Nothing to practise right now – mistakes you just practised come back later.", `<button class="btn" data-go="mistakes">Back</button>`));
      const items = q.map(M.item).filter(Boolean);
      return UI.session(el, (i) => items[i], { title: c ? M.title(c) : "My mistakes", total: items.length, onEnd: () => {} });
    }
    const groups = M.groups(), fixed = M.fixed();
    el.innerHTML = `<button class="back" data-go="practice">‹ Practice</button><h2 class="page-title">${H.bi("Meine Fehler", "My mistakes")}</h2>
      <p class="muted">Everything you got wrong – in drills, lessons, mock exams and texts – sorted by type. Each mistake comes back until you get it right twice in a row.</p>
      ${groups.length ? `<section class="card"><div class="row"><button class="btn sign big-btn" data-go="mistakes/go">▶ Practise my mistakes (${Math.min(10, M.queue(10).length)})</button></div>
        <ul class="mgroups">${groups.map((g) => `<li><div><b>${esc(g.title)}</b><span class="muted small"> · ${g.xs.length} open${g.n > g.xs.length ? `, ${g.n}× made` : ""}</span>
          <details><summary class="small">show</summary><ul class="small mlist">${g.xs.slice(0, 12).map((m) => `<li>${m.given ? `<s>${esc(plain(m.given)).slice(0, 80)}</s> → ` : ""}<b>${esc(plain(m.answer)).slice(0, 100)}</b>${m.n > 1 ? ` <span class="muted">×${m.n}</span>` : ""}</li>`).join("")}</ul></details></div>
          <button class="btn sm" data-go="mistakes/go:${encodeURIComponent(g.cat)}">Practise</button>${Engine.GEN[g.cat] ? `<button class="btn ghost sm" data-go="revise/${g.cat}">📘 Rule</button>` : ""}</li>`).join("")}</ul></section>`
      : UI.empty("No open mistakes. Well done – or do a drill or a mock exam first.")}
      ${fixed.length ? `<details class="card"><summary>✓ Fixed (${fixed.length})</summary><ul class="small mlist">${fixed.slice(0, 30).map((m) => `<li><b>${esc(plain(m.answer)).slice(0, 100)}</b> <span class="muted">· ${esc(M.title(catOf(m)))}</span></li>`).join("")}</ul></details>` : ""}
      ${window.AI && AI.ready && AI.ready() && !AI.local() ? `<div class="row"><button class="btn ghost" data-go="practice/ai">✨ New exercises from my mistakes (Claude)</button></div>` : ""}`;
  };
})();
