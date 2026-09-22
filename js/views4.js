/* Deutsch Coach – views: Leseprüfung und Schreibtraining (A1–C2) */
(function () {
  "use strict";
  const { esc, md } = H;
  const V = (window.Views = window.Views || {});
  const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  /* ---------------- Lesen (exam style) ---------------- */
  V.readexam = (el, [idx]) => {
    const sets = DC.exams.reading;
    if (idx === undefined) {
      el.innerHTML = `<h2 class="page-title">Reading exam</h2>
        <p class="muted">Exam-style sets: match adverts to situations, true/false, multiple choice. Every answer comes with the reason and the line in the text.</p>
        ${sets.map((s, i) => `<button class="tile wide lvl-${s.level}" data-go="readexam/${i}"><b>${UI.levelDot(s.level)} ${esc(s.title)}</b><span>${s.parts.length} part(s) · ca. ${s.minutes} min · ${s.parts.reduce((a, p) => a + p.items.length, 0)} questions</span></button>`).join("")}
        <section class="card"><h3>Also useful</h3><div class="row"><button class="btn ghost" data-go="read">Reading texts with audio</button><button class="btn ghost" data-go="exam/mock">Full mock test</button></div></section>`;
      return;
    }
    const set = sets[+idx];
    if (!set) return (el.innerHTML = UI.empty("Set not found.", `<button class="btn" data-go="readexam">Back</button>`));
    let html = `<button class="back" data-go="readexam">‹ All sets</button><h2 class="page-title">${UI.levelDot(set.level)} ${esc(set.title)}</h2>`;
    set.parts.forEach((part, pi) => {
      html += `<section class="card" data-p="${pi}">${UI.reportBtn({ id: `read-${idx}-p${pi + 1}`, part: `Reading exam: ${set.title}, part ${pi + 1}`, q: part.instruction })}<p class="muted">${esc(part.instruction)}</p>`;
      if (part.text) html += `<div class="reading">${esc(part.text).replace(/\n/g, "<br>")}</div><div class="row">${UI.say(part.text, "Listen")}<button class="btn ghost sm hide">Hide text</button></div>`;
      if (part.type === "match") {
        html += `<ul class="adlist">${part.ads.map((a) => `<li><b>${a.k})</b> ${esc(a.t)}</li>`).join("")}</ul>`;
        html += part.items.map((it, i) => `<div class="rsit" data-i="${i}"><span>${i + 1}. ${esc(it.q)}</span>
          <select><option value="">–</option>${part.ads.map((a) => `<option>${a.k}</option>`).join("")}<option>x</option></select></div><p class="fb muted" hidden></p>`).join("");
      } else if (part.type === "tf") {
        html += part.items.map((it, i) => `<div class="rsit" data-i="${i}"><span>${i + 1}. ${esc(it.q)}</span>
          <select><option value="">–</option><option value="r">richtig</option><option value="f">falsch</option></select></div><p class="fb muted" hidden></p>`).join("");
      } else {
        html += part.items.map((it, i) => `<div class="mcq" data-i="${i}"><p><b>${i + 1}.</b> ${esc(it.q)}</p>
          <div class="choices">${it.options.map((o, k) => `<button class="choice" data-k="${k}">${esc(o)}</button>`).join("")}</div><p class="fb muted" hidden></p></div>`).join("");
      }
      html += `</section>`;
    });
    html += `<div class="row center"><button class="btn sign check">Check answers</button></div><div class="rres"></div>`;
    el.innerHTML = html;
    el.querySelectorAll(".hide").forEach((b) => (b.onclick = () => { const r = b.closest("section").querySelector(".reading"); r.classList.toggle("blur"); b.textContent = r.classList.contains("blur") ? "Show text" : "Hide text"; }));
    // multiple choice answers immediately
    el.querySelectorAll(".mcq").forEach((box) => {
      const part = set.parts[+box.closest("section").dataset.p], it = part.items[+box.dataset.i];
      box.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
        const ok = +b.dataset.k === it.a;
        box.querySelectorAll(".choice").forEach((x) => { x.disabled = true; if (+x.dataset.k === it.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        const f = box.querySelector(".fb"); f.hidden = false; f.innerHTML = `${ok ? "✓" : "✗"} ${esc(it.why || "")}`;
        box.dataset.ok = ok ? "1" : "0";
        Store.topic("lesen", ok); Store.addXP(ok ? 5 : 1);
      }));
    });
    el.querySelector(".check").onclick = (e) => {
      let right = 0, total = 0;
      el.querySelectorAll("section").forEach((sec) => {
        const part = set.parts[+sec.dataset.p];
        sec.querySelectorAll(".rsit").forEach((row) => {
          const it = part.items[+row.dataset.i]; const sel = row.querySelector("select");
          const given = sel.value;
          const expect = part.type === "tf" ? (it.a ? "r" : "f") : it.a;
          const ok = given === expect; total++; if (ok) right++;
          sel.style.borderColor = ok ? "var(--ok)" : "var(--bad)";
          const f = row.nextElementSibling; f.hidden = false;
          f.innerHTML = `${ok ? "✓" : "✗ richtig: " + esc(part.type === "tf" ? (it.a ? "richtig" : "falsch") : it.a)} – ${esc(it.why || "")}`;
        });
        sec.querySelectorAll(".mcq").forEach((box) => { total++; if (box.dataset.ok === "1") right++; });
      });
      const pct = total ? Math.round((right / total) * 100) : 0;
      Store.get().exams.unshift({ date: Date.now(), type: `Lesen ${set.level}`, score: pct });
      Store.addXP(20); Store.save();
      el.querySelector(".rres").innerHTML = `<section class="card result"><p class="big">${right}/${total} · ${pct}%</p><p>${pct >= 60 ? "Bestanden (≥ 60 %)." : "Noch unter 60 % – lies die Begründungen und versuch es noch einmal."}</p><div class="row center"><button class="btn" data-go="readexam">Other set</button><button class="btn ghost" data-go="exam">Exam menu</button></div></section>`;
      e.currentTarget.disabled = true;
    };
  };

  /* ---------------- Schreiben ---------------- */
  V.write = (el, [idx]) => {
    const tasks = DC.exams.writing;
    if (idx === undefined) {
      const lvl = Store.get().settings.writeLevel || "all";
      el.innerHTML = `<h2 class="page-title">Writing trainer</h2>
        <p class="muted">Every task has the exam instructions, the content points, a phrase bank and a model text. Max checks structure, length, connectors and grammar.</p>
        <div class="levelbar">${["all"].concat(LEVELS).map((l) => `<button class="${l === lvl ? "on" : ""} lvl-${l}" data-lvl="${l}">${l === "all" ? "All" : l}</button>`).join("")}</div>
        ${tasks.map((t, i) => (lvl === "all" || t.level === lvl) ? `<button class="tile wide lvl-${t.level}" data-go="write/${i}"><b>${UI.levelDot(t.level)} ${esc(t.type)}</b><span>${esc(t.prompt.slice(0, 90))}… · ${t.words} Wörter · ${t.minutes} min</span></button>` : "").join("")}`;
      el.querySelectorAll("[data-lvl]").forEach((b) => (b.onclick = () => { Store.get().settings.writeLevel = b.dataset.lvl; Store.save(); V.write(el, []); }));
      return;
    }
    const t = tasks[+idx];
    if (!t) return (el.innerHTML = UI.empty("Task not found.", `<button class="btn" data-go="write">Back</button>`));
    const saved = (Store.get().writings || {})[idx] || "";
    el.innerHTML = `<button class="back" data-go="write">‹ All tasks</button>
      <h2 class="page-title">${UI.levelDot(t.level)} ${esc(t.type)}</h2>
      <section class="card wtask">${UI.reportBtn({ id: `write-${idx}`, part: `Writing: ${t.type}`, q: t.prompt })}<p><b>Aufgabe:</b> ${esc(t.prompt)}</p>
        <p><b>Inhaltspunkte:</b></p><ul class="wpoints">${t.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <p class="muted small">Ziel: ca. ${t.words} Wörter · Zeit: ${t.minutes} Minuten</p>
        <div class="row"><button class="btn ghost sm timer">Start timer</button><button class="btn ghost sm phrases">Phrase bank</button>${UI.mic("Dictate")}</div>
        <div class="bank-box" hidden><div class="phrasebank">${t.phrases.map((p) => `<button type="button">${esc(p)}</button>`).join("")}</div></div>
      </section>
      <section class="card"><textarea class="wtext" rows="14" placeholder="Schreiben Sie hier …">${esc(saved)}</textarea>${UI.umlautBar()}
        <div class="wstats"><span>Wörter: <b class="wc">0</b></span><span>Sätze: <b class="sc">0</b></span><span>Konnektoren: <b class="cc">0</b></span></div>
        <div class="row"><button class="btn sign chk">Check my text</button><button class="btn ghost model">Show model text</button><button class="btn ghost save">Save draft</button></div>
        <div class="wfb"></div></section>`;
    const ta = el.querySelector(".wtext"), fb = el.querySelector(".wfb");
    UI.bindUmlauts(el, ta);
    const stats = () => {
      const v = ta.value;
      const words = v.split(/\s+/).filter(Boolean).length;
      const sents = v.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 3);
      const conn = (v.match(/\b(weil|dass|wenn|falls|obwohl|trotzdem|deshalb|außerdem|zwar|jedoch|damit|indem|sodass|zunächst|danach|abschließend|einerseits|andererseits|dagegen|folglich|zumal|denn|aber)\b/gi) || []).length;
      el.querySelector(".wc").textContent = words; el.querySelector(".sc").textContent = sents.length; el.querySelector(".cc").textContent = conn;
      return { words, sents, conn, v };
    };
    ta.oninput = stats; stats();
    el.querySelector(".phrases").onclick = (e) => { const b = el.querySelector(".bank-box"); b.hidden = !b.hidden; e.target.textContent = b.hidden ? "Phrase bank" : "Hide phrases"; };
    el.querySelectorAll(".phrasebank button").forEach((b) => (b.onclick = () => { ta.value += (ta.value && !/\s$/.test(ta.value) ? " " : "") + b.textContent + " "; ta.focus(); stats(); }));
    UI.bindMic(el, (txt) => { ta.value += (ta.value ? " " : "") + txt; stats(); });
    el.querySelector(".save").onclick = () => { const s = Store.get(); s.writings = s.writings || {}; s.writings[idx] = ta.value; Store.save(); H.toast("Draft saved on this device."); };
    let tm = null;
    el.querySelector(".timer").onclick = (e) => {
      if (tm) { clearInterval(tm); tm = null; e.target.textContent = "Start timer"; return; }
      let left = t.minutes * 60;
      tm = setInterval(() => { if (!document.body.contains(e.target)) return clearInterval(tm); left--; e.target.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0) { clearInterval(tm); tm = null; e.target.textContent = "Zeit vorbei"; } }, 1000);
    };
    el.querySelector(".model").onclick = () => {
      fb.innerHTML = `<section class="card"><h3>Model text</h3><p class="muted small">Compare structure and phrases – don't copy it.</p><pre>${esc(t.model)}</pre>${UI.say(t.model, "Listen")}</section>`;
      fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
    el.querySelector(".chk").onclick = () => {
      const st = stats();
      if (st.words < 10) return H.toast("Write a few sentences first.");
      const checks = st.sents.map((x) => ({ s: x, r: Tutor.check(x) }));
      const errs = checks.reduce((a, c) => a + c.r.issues.length, 0);
      const lenOk = st.words >= t.words * 0.8;
      const structOk = /\n/.test(st.v) || st.sents.length >= 4;
      const registerFormal = /Sehr geehrte|Mit freundlichen Grüßen|Sie /.test(st.v);
      const needFormal = /formell|Beschwerde|Bewerbung|Stellungnahme|Bericht|Kommentar|Leserbrief/i.test(t.type);
      const crit = [
        ["length", lenOk, `${st.words} von ~${t.words} Wörtern`],
        ["structure", structOk, structOk ? "Absätze/Sätze erkennbar" : "Gliedere den Text in Absätze"],
        ["connectors", st.conn >= 4, `${st.conn} Konnektoren gefunden`],
        ["register", needFormal ? registerFormal : true, needFormal ? (registerFormal ? "formelle Anrede/Schluss vorhanden" : "Formelle Anrede und Grußformel fehlen") : "Register passt zur Aufgabe"],
        ["errors", errs === 0, errs === 0 ? "Max found no rule errors (he doesn't catch everything yet)" : `${errs} mögliche Fehler`],
      ];
      const score = Math.round((crit.filter((c) => c[1]).length / crit.length) * 100);
      Store.get().exams.unshift({ date: Date.now(), type: `Schreiben ${t.level}`, score });
      Store.addXP(25); Store.save();
      fb.innerHTML = `<section class="card"><h3>Feedback · ${score}%</h3>
        <ul class="checklist">${crit.map((c) => `<li class="${c[1] ? "y" : "n"}">${c[1] ? "✓" : "✗"} ${esc(c[2])}</li>`).join("")}</ul>
        <p class="muted small">Die Inhaltspunkte prüfst du selbst: ${t.points.map((p) => esc(p)).join(" · ")}</p>
        ${checks.filter((c) => c.r.issues.length).map((c) => `<div class="mist"><p>${esc(c.s)}</p><p class="ex ok">${esc(c.r.fixed)}</p><ul class="nots">${c.r.issues.map((i) => `<li>${i.rule}<br><span class="muted">${i.why}</span></li>`).join("")}</ul></div>`).join("")}
        <div class="row"><button class="btn ghost model2">Model text</button><button class="btn ghost" data-ask="${esc("Give me tips for writing a " + t.type + " in German")}">Ask Max for tips</button></div></section>`;
      fb.querySelector(".model2").onclick = () => el.querySelector(".model").click();
      fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  };

  /* ---------------- Notes / cheat sheets by level ---------------- */
  V.notes = (el, [lvl]) => {
    const level = lvl || "A1";
    const lessons = DC.curriculum.filter((l) => l.level === level);
    el.innerHTML = `<h2 class="page-title">Grammar notes</h2>
      <div class="levelbar">${LEVELS.map((l) => `<button class="${l === level ? "on" : ""} lvl-${l}" data-go="notes/${l}">${l}</button>`).join("")}</div>
      <p class="muted">Every lesson of ${level} on one page: rule, table, examples. Tap a heading to open the full lesson.</p>
      ${lessons.map((l) => `<details class="card lvl-${l.level}"><summary>${l.n}. ${esc(l.title)}</summary>
        ${l.expl.map((p) => `<p>${md(p)}</p>`).join("")}
        ${l.table.length ? UI.table(l.table, "lvl-" + l.level) : ""}
        <ol class="exs">${l.examples.slice(0, 5).map((e) => `<li>${UI.colorArticles(e.de)} ${UI.say(e.de)}<br><span class="en">${esc(e.en)}</span></li>`).join("")}</ol>
        <div class="row"><button class="btn sm" data-go="lesson/${l.n}">Open lesson</button><button class="btn ghost sm" data-go="lesson/${l.n}/practice">Practise</button></div></details>`).join("")}`;
  };
})();
