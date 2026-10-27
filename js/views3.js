/* Deutsch Coach – views: Max (tutor), Prüfung, Grammatik, Statistik, Einstellungen, Mehr */
(function () {
  "use strict";
  const { esc, md } = H;
  const V = (window.Views = window.Views || {});

  /* ---------------- Max ---------------- */
  V.tutor = (el) => {
    const s = Store.get();
    el.innerHTML = `<div class="chat">
      <div class="chat-head"><span class="avatar">M</span><div><b>Max</b><small>${s.settings.aiOnline && s.settings.aiKey ? "Offline rules + online AI" : "Offline tutor · works without internet"}</small></div><button class="btn ghost sm clear">Clear</button></div>
      <div class="msgs" aria-live="polite"></div>
      <form class="composer"><div class="umlrow">${UI.umlautBar()}</div><textarea rows="1" placeholder="Ask in English, or type a German sentence to check"></textarea>${UI.mic("")}<button class="btn send" aria-label="Send">➤</button></form></div>`;
    const msgs = el.querySelector(".msgs"), ta = el.querySelector("textarea");
    UI.bindUmlauts(el, ta);
    const render = (m) => {
      const d = document.createElement("div");
      d.className = "msg " + m.role;
      d.innerHTML = m.role === "user" ? esc(m.text) : m.html;
      msgs.appendChild(d);
      if (m.item) { const box = document.createElement("div"); box.className = "msg assistant"; msgs.appendChild(box); UI.item(box, m.item, { compact: true, noFocus: true, nextLabel: "Another one", onNext: () => V.tutorSend(`Quiz me on ${m.item.title}`) }); }
      msgs.scrollTop = msgs.scrollHeight;
    };
    s.chat.forEach((m) => render(Object.assign({}, m, { item: null })));
    if (!s.chat.length) Tutor.reply("help", {}).then((r) => render({ role: "assistant", html: r.html }));
    V.tutorSend = async (text) => {
      text = text.trim(); if (!text) return;
      const um = { role: "user", text }; s.chat.push(um); render(um);
      const typing = document.createElement("div"); typing.className = "msg assistant typing"; typing.textContent = "…"; msgs.appendChild(typing);
      const ctx = { profile: V.profile(), history: s.chat.slice(-9, -1).map((m) => ({ role: m.role, text: m.text || (m.html || "").replace(/<[^>]+>/g, " ") })), aiOnline: s.settings.aiOnline };
      let r;
      try { r = await Tutor.reply(text, ctx); } catch (e) { r = { html: `<p>Something went wrong: ${esc(e.message)}</p>` }; }
      typing.remove();
      const am = { role: "assistant", html: r.html, text: r.html.replace(/<[^>]+>/g, " ").slice(0, 600) };
      s.chat.push(am); s.chat = s.chat.slice(-60); Store.save();
      render(Object.assign({}, am, { item: r.item }));
      if (r.speak) Speech.speak(r.speak);
      Store.addXP(1);
    };
    el.querySelector("form").onsubmit = (e) => { e.preventDefault(); const t = ta.value; ta.value = ""; ta.style.height = ""; V.tutorSend(t); };
    ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); el.querySelector("form").requestSubmit(); } };
    ta.oninput = () => { ta.style.height = "auto"; ta.style.height = Math.min(140, ta.scrollHeight) + "px"; };
    UI.bindMic(el.querySelector(".composer"), (t) => { ta.value = t; ta.focus(); });
    el.querySelector(".clear").onclick = () => { s.chat = []; Store.save(); V.tutor(el); };
    if (App.pendingAsk) { const q = App.pendingAsk; App.pendingAsk = null; V.tutorSend(q); }
  };

  /* ---------------- Prüfung ---------------- */
  V.exam = (el, [part]) => {
    const s = Store.get();
    if (part === "mock") return mock(el);
    if (part === "lid") return lid(el);
    if (part === "speak") return speakExam(el);
    el.innerHTML = `<h2 class="page-title">B1 exam trainer</h2>
      <section class="grid2">
        <button class="tile hero" data-go="exam/mock"><b>Mock test</b><span>Reading, listening, language, writing (≈ 25 min)</span></button>
        <button class="tile" data-go="readexam"><b>Reading exam</b><span>${DC.exams.reading.length} sets, A2–C1</span></button>
        <button class="tile" data-go="write"><b>Writing exam</b><span>${DC.exams.writing.length} tasks with model texts</span></button>
        <button class="tile" data-go="exam/speak"><b>Speaking exam</b><span>Plan · present · react</span></button>
        <button class="tile" data-go="exam/lid"><b>Leben in Deutschland</b><span>Practice selection: ${DC.lid.length} of the 310 official questions</span></button>
        <button class="tile" data-go="lesson/42/exam"><b>Model presentation</b><span>Lesson 42</span></button>
      </section>
      <section class="card"><h3>What the Goethe B1 speaking test looks like</h3>
        <ol class="plan"><li><b>Teil 1 – Plan together (3 min):</b> suggest, react, agree.</li><li><b>Teil 2 – Present (3 min):</b> 5 slides: topic, experience, home country, pros/cons + opinion, conclusion.</li><li><b>Teil 3 – React (2 min):</b> feedback + a question, then answer questions.</li></ol></section>
      ${s.exams.length ? `<section class="card"><h3>Your results</h3><ul class="results">${s.exams.slice(0, 10).map((x) => `<li>${H.fmtDate(x.date)} · ${esc(x.type)} · <b>${x.score}%</b></li>`).join("")}</ul></section>` : ""}`;
  };

  function mock(el) {
    const s = Store.get();
    const withQ = DC.curriculum.filter((l) => l.level !== "A1" && l.exam.slice(0, 3).every((q) => q.a));
    const [rl, ll] = H.shuffle(withQ);
    const gens = Object.values(Engine.GEN).filter((g) => g.level !== "A1" && g.level !== "C2").map((g) => g.id);
    const lang = Array.from({ length: 12 }, () => Engine.generate(H.pick(gens))).filter(Boolean);
    const writeTopic = H.pick(["Schreiben Sie einer Freundin: Sie haben eine neue Wohnung. Beschreiben Sie die Wohnung, erzählen Sie vom Umzug und laden Sie sie ein. (80 Wörter)", "Schreiben Sie Ihrem Kursleiter: Sie können nächste Woche nicht zum Kurs kommen. Entschuldigen Sie sich, nennen Sie den Grund und fragen Sie nach den Hausaufgaben. (40 Wörter)", "Diskussion im Forum: „Braucht man in der Stadt ein Auto?“ Schreiben Sie Ihre Meinung mit Gründen. (80 Wörter)", "Schreiben Sie Ihrem Nachbarn: Sie machen am Samstag eine Party. Entschuldigen Sie sich für den Lärm und laden Sie ihn ein. (40 Wörter)"]);
    let score = 0, max = 0;
    el.innerHTML = `<h2 class="page-title">Mock test</h2><div class="timerbar">⏱ <span class="tl">25:00</span></div>
      <section class="card"><h3>1 · Lesen</h3><div class="reading">${esc(rl.reading)}</div>${rl.exam.slice(0, 3).map((q, i) => `<div class="mq" data-a="${esc(q.a)}"><p>${md(q.q)}</p><input class="q-in" placeholder="Antwort"></div>`).join("")}</section>
      <section class="card"><h3>2 · Hören</h3><p class="muted small">Listen (max. twice), then answer.</p><div class="row"><button class="btn play">▶ Play <span class="plays">(2 left)</span></button></div>${ll.exam.slice(0, 3).map((q) => `<div class="mq" data-a="${esc(q.a)}"><p>${md(q.q)}</p><input class="q-in" placeholder="Antwort"></div>`).join("")}</section>
      <section class="card"><h3>3 · Sprachbausteine</h3>${lang.map((it, i) => `<div class="lq" data-i="${i}"><p>${it.prompt}</p>${it.kind === "choice" ? `<select><option value="">–</option>${it.options.map((o) => `<option>${esc(o)}</option>`).join("")}</select>` : `<input class="q-in" placeholder="${it.kind === "order" ? "Write the full sentence: " + esc(it.tokens.join(" / ")) : "Antwort"}">`}</div>`).join("")}</section>
      <section class="card"><h3>4 · Schreiben</h3><p>${esc(writeTopic)}</p><textarea rows="7" class="wr" placeholder="Ihr Text …"></textarea><p class="muted small wc">0 words</p></section>
      <div class="row center"><button class="btn sign finish">Finish and score</button></div><div class="mres"></div>`;
    let plays = 2;
    el.querySelector(".play").onclick = (e) => { if (!plays) return; plays--; Speech.play(Speech.split(ll.reading), { locked: true, key: "exam-listen" }); el.querySelector(".plays").textContent = `(${plays} left)`; if (!plays) e.currentTarget.disabled = true; };
    const wr = el.querySelector(".wr"); wr.oninput = () => (el.querySelector(".wc").textContent = wr.value.split(/\s+/).filter(Boolean).length + " words");
    let left = 25 * 60; const tl = el.querySelector(".tl");
    const tick = setInterval(() => { if (!document.body.contains(tl)) return clearInterval(tick); left--; tl.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0) { clearInterval(tick); el.querySelector(".finish").click(); } }, 1000);
    el.querySelector(".finish").onclick = (e) => {
      clearInterval(tick); e.currentTarget.disabled = true;
      el.querySelectorAll(".mq").forEach((q) => { max += 2; const ok = Grade.overlap(q.querySelector("input").value, q.dataset.a) >= 0.5; if (ok) score += 2; q.insertAdjacentHTML("beforeend", `<p class="${ok ? "okt" : "badt"}">${ok ? "✓" : "✗"} ${esc(q.dataset.a)}</p>`); });
      el.querySelectorAll(".lq").forEach((q) => {
        const it = lang[+q.dataset.i]; max += 1;
        const v = (q.querySelector("select") || q.querySelector("input")).value;
        const ok = it.kind === "choice" ? v === it.answer : Grade.grade(v, it.answer, it.accept).ok;
        if (ok) score += 1; Store.topic(it.gen, ok);
        q.insertAdjacentHTML("beforeend", `<p class="${ok ? "okt" : "badt"}">${ok ? "✓" : "✗ " + esc(it.answer)}</p><details><summary>Why</summary>${it.why}</details>`);
      });
      const text = wr.value.trim(); const wc = text.split(/\s+/).filter(Boolean).length;
      const sents = text.split(/(?<=[.!?])\s+/).filter(Boolean);
      const errs = sents.reduce((a, x) => a + Tutor.check(x).issues.length, 0);
      const conn = (text.match(/\b(weil|dass|wenn|obwohl|deshalb|trotzdem|außerdem|zuerst|danach|denn|aber)\b/gi) || []).length;
      const wScore = Math.max(0, Math.min(10, Math.round((Math.min(wc, 80) / 80) * 5 + Math.min(conn, 4) * 0.75 + (errs === 0 && wc > 20 ? 2 : errs < 3 ? 1 : 0))));
      max += 10; score += wScore;
      const pct = Math.round((score / max) * 100);
      s.exams.unshift({ date: Date.now(), type: "Mock test", score: pct }); Store.addXP(40);
      el.querySelector(".mres").innerHTML = `<section class="card result"><p class="big">${pct}%</p><p>${pct >= 60 ? "Pass level (≥ 60 %). Well done!" : "Below the 60 % pass mark – review the explanations above."}</p><p class="muted">Writing: ${wc} words, ${conn} connectors, ${errs} rule issue(s) → ${wScore}/10. Automatic scoring is an estimate.</p>${sents.filter((x) => Tutor.check(x).issues.length).map((x) => `<p class="ex ok">${esc(Tutor.check(x).fixed)}</p>`).join("")}<button class="btn" data-go="exam">Back</button></section>`;
      Store.save();
    };
  }

  function speakExam(el) {
    const plan = H.pick(DC.curriculum.find((l) => l.n === 27).exam.slice(7, 10));
    const pres = H.pick(DC.curriculum.find((l) => l.n === 42).exam.slice(5, 8));
    const slides = ["Thema vorstellen", "Eigene Erfahrung", "Situation im Heimatland", "Vor- und Nachteile + Meinung", "Abschluss und Dank"];
    el.innerHTML = `<h2 class="page-title">Speaking exam</h2>
      <section class="card"><h3>Teil 1 · Plan together</h3><p>${md(plan.q)}</p><p class="muted small">Max plays your partner. Answer each suggestion out loud.</p><div class="partner"></div></section>
      <section class="card"><h3>Teil 2 · Presentation</h3><p>${md(pres.q)}</p><ol class="slides">${slides.map((x) => `<li>${x}</li>`).join("")}</ol>
        <div class="row"><button class="btn ghost ptimer">Start 3 minutes</button>${UI.mic("Record a sentence")}</div><div class="transcript"></div></section>
      <section class="card"><h3>Teil 3 · Feedback & questions</h3><p>Say: <i>Deine Präsentation war sehr interessant, weil … Ich habe eine Frage: …</i></p><p>Then answer: <b class="q3"></b> ${UI.say("")}</p></section>`;
    const partnerLines = ["Wie wäre es, wenn wir am Samstag feiern?", "Was hältst du davon, wenn jeder etwas mitbringt?", "Ich schlage vor, dass wir zusammen ein Geschenk kaufen. Wie viel möchtest du ausgeben?", "Wer kümmert sich um die Getränke?", "Gut. Also, wie machen wir es jetzt?"];
    let pi = 0; const pbox = el.querySelector(".partner");
    const nextLine = () => {
      if (pi >= partnerLines.length) { pbox.insertAdjacentHTML("beforeend", `<p class="muted">Done! Did you suggest, react with reasons and summarise?</p>`); return; }
      const line = partnerLines[pi++];
      pbox.insertAdjacentHTML("beforeend", `<div class="msg assistant">🧑 ${esc(line)}</div>`); Speech.speak(line);
    };
    pbox.insertAdjacentHTML("afterend", `<div class="row">${UI.mic("Reply")}<button class="btn ghost sm skip">Next line</button></div>`);
    const row = pbox.nextElementSibling;
    UI.bindMic(row, (t) => { const r = Tutor.check(t); pbox.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(t)}</div>${r.issues.length ? `<p class="muted small">Better: ${esc(r.fixed)}</p>` : ""}`); Store.addXP(4); setTimeout(nextLine, 600); });
    row.querySelector(".skip").onclick = nextLine; nextLine();
    const card2 = el.querySelectorAll(".card")[1];
    UI.bindMic(card2, (t) => { const r = Tutor.check(t); card2.querySelector(".transcript").insertAdjacentHTML("beforeend", `<p>🗣️ ${esc(t)}${r.issues.length ? `<br><span class="muted">→ ${esc(r.fixed)}</span>` : ""}</p>`); Store.addXP(4); });
    const pt = card2.querySelector(".ptimer"); let tm;
    pt.onclick = () => { clearInterval(tm); let left = 180; tm = setInterval(() => { if (!document.body.contains(pt)) return clearInterval(tm); left--; pt.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; if (left <= 0) { clearInterval(tm); pt.textContent = "Time's up!"; } }, 1000); };
    const q3 = H.pick(["Würden Sie das auch Ihren Freunden empfehlen?", "Wie ist das in Ihrem Heimatland genau?", "Was war für Sie am schwierigsten?", "Was würden Sie anders machen?"]);
    el.querySelector(".q3").textContent = q3; el.querySelector(".q3").nextElementSibling.dataset.tts = q3;
  }

  function lid(el) {
    const qs = H.shuffle(DC.lid).slice(0, 15);
    let i = 0, right = 0, de = true;
    const draw = () => {
      if (i >= qs.length) { const pct = Math.round((right / qs.length) * 100); Store.get().exams.unshift({ date: Date.now(), type: "Leben in Deutschland", score: pct }); Store.save(); el.innerHTML = `<section class="card result"><p class="big">${right}/${qs.length}</p><p>The real test needs 17 of 33 correct.</p><div class="row"><button class="btn" data-go="exam/lid">Again</button><button class="btn ghost" data-go="exam">Back</button></div></section>`; return; }
      const q = qs[i];
      const text = de && q.q_de ? q.q_de : q.q; const ch = de && q.choices_de ? q.choices_de : q.choices;
      el.innerHTML = `<div class="session"><div class="sess-head"><span class="sess-title">Leben in Deutschland</span><span>${i + 1}/${qs.length} <button class="btn ghost sm lang">${de ? "EN" : "DE"}</button></span></div>
        <div class="q"><div class="q-prompt">${esc(text)} ${de ? UI.say(text) : ""}</div><div class="choices">${ch.map((c, k) => `<button class="choice" data-k="${k}">${esc(c)}</button>`).join("")}</div><div class="q-fb" hidden></div></div></div>`;
      el.querySelector(".lang").onclick = () => { de = !de; draw(); };
      el.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
        const ok = +b.dataset.k === q.a; if (ok) right++;
        el.querySelectorAll(".choice").forEach((x) => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        const fb = el.querySelector(".q-fb"); fb.hidden = false;
        fb.innerHTML = `<p>${esc(de && q.ex_de ? q.ex_de : q.ex)}</p><button class="btn nx">Next</button>`;
        fb.querySelector(".nx").onclick = () => { i++; draw(); };
        Store.addXP(ok ? 4 : 1);
      }));
    };
    draw();
  }

  /* ---------------- Grammatik ---------------- */
  V.grammar = (el, [sect]) => {
    el.innerHTML = `<h2 class="page-title">Grammar reference</h2><input class="search" type="search" placeholder="Search (e.g. Dativ, weil, Perfekt)">
      <nav class="tabs"><button class="tab ${!sect || sect === "rules" ? "on" : ""}" data-go="grammar/rules">Rules</button><button class="tab ${sect === "tables" ? "on" : ""}" data-go="grammar/tables">Tables</button><button class="tab ${sect === "notes" ? "on" : ""}" data-go="grammar/notes">Notes</button></nav><div class="gbody"></div>`;
    const body = el.querySelector(".gbody"), q = el.querySelector(".search");
    const draw = () => {
      const t = q.value.toLowerCase().trim();
      if (sect === "tables") {
        body.innerHTML = DC.reference.map((r) => `<section class="card"><h3>${esc(r.title)}</h3>${r.sections.filter((x) => !t || JSON.stringify(x).toLowerCase().includes(t)).map((x) => x.kind === "table" ? `${x.title ? `<h4>${md(x.title)}</h4>` : ""}${UI.table(x.rows)}` : `${x.title ? `<h4>${md(x.title)}</h4>` : ""}${x.lines.map((l) => `<p>${md(l)}</p>`).join("")}`).join("")}</section>`).join("");
        if (!t) body.insertAdjacentHTML("afterbegin", `<details class="card poster"><summary>🖼 Everything on one poster: articles, pronouns, possessives, prepositions</summary><img src="assets/grammar_reference.png" alt="Grammar overview: articles, negation, personal and possessive pronouns in all cases, prepositions with accusative and dative" loading="lazy"><p class="muted small">Tap and hold (or right-click) to save it. The translations on the poster are in Spanish.</p></details>`);
      } else if (sect === "notes") {
        body.innerHTML = Object.entries(DC.notes).filter(([k, v]) => !t || (k + v).toLowerCase().includes(t)).map(([k, v]) => `<details class="card"><summary>${esc(k.replace(/_/g, " "))}</summary><pre>${esc(v)}</pre></details>`).join("");
      } else {
        body.innerHTML = Tutor.RULES.filter((r) => !t || (r.t + r.k.join(" ") + r.what).toLowerCase().includes(t)).map((r) => `<details class="card rule"><summary>${esc(r.t)} <small>L${r.l}</small></summary>${Tutor.ruleHtml(r)}</details>`).join("") || UI.empty("Nothing found. Ask Max instead.", `<button class="btn" data-ask="${esc(q.value)}">Ask Max</button>`);
      }
    };
    q.oninput = draw; draw();
  };

  /* ---------------- Statistik ---------------- */
  V.stats = (el) => {
    const s = Store.get();
    const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10); return { d, xp: s.days[d] || 0 }; });
    const mx = Math.max(s.settings.goal, ...days.map((d) => d.xp));
    const topics = Object.entries(s.topics).filter(([id]) => Engine.GEN[id]).map(([id, t]) => ({ id, title: Engine.GEN[id].title, r: t.r, w: t.w, pct: Math.round((t.r / Math.max(1, t.r + t.w)) * 100) })).sort((a, b) => a.pct - b.pct);
    el.innerHTML = `<h2 class="page-title">Progress</h2>
      <section class="stats3"><div><b>${s.xp}</b><span>total XP</span></div><div><b>${s.streak.count}</b><span>day streak</span></div><div><b>${V.profile().done}</b><span>lessons done</span></div></section>
      <section class="card"><h3>Last 14 days</h3><div class="chart">${days.map((d) => `<div class="col" title="${d.d}: ${d.xp} XP"><i style="height:${(d.xp / mx) * 100}%" class="${d.xp >= s.settings.goal ? "met" : ""}"></i><small>${d.d.slice(8)}</small></div>`).join("")}</div></section>
      <section class="card"><h3>Grammar accuracy</h3>${topics.length ? topics.map((t) => `<div class="acc"><button class="link" data-go="practice/${t.id}">${esc(t.title)}</button><div class="bar"><i style="width:${t.pct}%" class="${t.pct < 60 ? "low" : ""}"></i></div><span>${t.pct}% (${t.r + t.w})</span></div>`).join("") : "<p class='muted'>Practise some drills to see your accuracy here.</p>"}</section>
      <section class="card"><h3>Mistake log</h3>${s.mistakes.length ? `<button class="btn sm" data-go="practice/mistakes">Practise these topics</button>` + s.mistakes.slice(0, 30).map((m) => `<div class="mist"><p>${m.prompt}</p><p class="muted">You: ${esc(m.given || "–")} · Right: <b>${esc(m.answer)}</b></p>${m.why ? `<details><summary>Why</summary>${m.why}</details>` : ""}</div>`).join("") : "<p class='muted'>No mistakes yet.</p>"}</section>`;
  };

  /* ---------------- Einstellungen ---------------- */
  /* lab edition: long self-test, progress import and a plain-text diagnostics report */
  function bindLab(el) {
    const imp = el.querySelector(".lab-import");
    if (imp) imp.onclick = () => { if (!confirm("Replace the lab's progress with a copy of your daily app's progress?")) return; if (Store.importStable()) { H.toast("Progress copied from the daily app."); V.settings(el); } };
    const lt = el.querySelector(".lab-test");
    if (lt) lt.onclick = async () => {
      const out = el.querySelector(".lab-tres"); lt.disabled = true;
      try { const r = await LLM.selfTest(LLM.current(), (i, n) => (out.textContent = `Testing ${i + 1}/${n}…`), ["A1", "A2", "B1"]);
        const by = (lv) => { const x = r.rows.filter((y) => y.level === lv); return Math.round(x.reduce((a, y) => a + y.score, 0) / x.length); };
        out.innerHTML = `<b>${r.score}/100</b> · A1 ${by("A1")} · A2 ${by("A2")} · B1 ${by("B1")} · ${r.tps} tokens/s – now press “Diagnostics report”.`;
      } catch (e) { out.textContent = "✗ " + e.message; }
      lt.disabled = false;
    };
    const ta = el.querySelector(".lab-out"), acts = el.querySelector(".lab-acts");
    el.querySelector(".lab-diag").onclick = async () => { ta.hidden = false; acts.hidden = false; ta.value = "Collecting…"; ta.value = await diagnostics(); };
    el.querySelector(".lab-copy").onclick = async () => { try { await navigator.clipboard.writeText(ta.value); H.toast("Copied – paste it into the chat with Claude."); } catch (e) { ta.select(); document.execCommand("copy"); H.toast("Copied."); } };
    el.querySelector(".lab-save").onclick = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ta.value], { type: "text/plain" })); a.download = `deutsch-coach-lab-report-${new Date().toISOString().slice(0, 10)}.txt`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  }
  async function diagnostics() {
    const st = Store.get().settings, L = [];
    const line = (k, v) => L.push(`${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`);
    L.push("=== Deutsch Coach LAB – diagnostics ===");
    line("app", `${App.version} (${window.EDITION})`); line("time", new Date().toString());
    line("browser", navigator.userAgent); line("memory GB", navigator.deviceMemory || "?"); line("cores", navigator.hardwareConcurrency || "?");
    line("screen", `${screen.width}x${screen.height} @${devicePixelRatio}`);
    try { const e = await navigator.storage.estimate(); line("storage", `${Math.round(e.usage / 1048576)} MB used of ${Math.round(e.quota / 1048576)} MB`); } catch (e) {}
    line("gpu", await LLM.gpuInfo());
    L.push(""); L.push("--- AI ---");
    line("provider", st.aiProvider); line("partner mode", st.partnerMode || "(default)");
    line("model", LLM.current().key); try { const b = await LLM._build(LLM.current()); line("build", b.id); } catch (e) {}
    line("supported", LLM.supported()); line("fits", await LLM.fits().catch(() => "?")); line("downloaded", LLM.downloaded());
    line("source", await LLM.source().catch(() => "?")); line("loaded now", LLM.isLoaded()); line("load secs", LLM.loadSecs);
    line("last answer", LLM.lastStats); line("tests", st.llmTest || {});
    if (LLM.lastTest) { L.push(""); L.push(`--- last self-test (${LLM.lastTest.model}) ---`); LLM.lastTest.rows.forEach((r) => L.push(`[${r.level || "A2"}] ${r.score} | ${r.secs || "?"}s | issues ${r.issues}${r.german ? "" : " | NOT ONLY GERMAN"}\n  > ${r.user}\n  < ${r.reply}`)); }
    L.push(""); L.push("--- errors ---"); (LLM.log.length ? LLM.log : [{ msg: "none" }]).forEach((x) => L.push(`${x.t || ""} ${x.where || ""} ${x.msg}`));
    L.push(""); L.push("--- speech ---"); line("asr setting", st.asr); line("whisper supported", ASR.supported()); line("whisper downloaded", ASR.downloaded()); line("active", ASR.active());
    return L.join("\n");
  }
  V.settings = (el) => {
    const s = Store.get(); const st = s.settings;
    const voices = Speech.voices();
    el.innerHTML = `<h2 class="page-title">Settings</h2>
      <section class="card form">
        <label>Daily goal <select data-k="goal" data-num="1"><option value="20">Locker – 20 XP (~5 min)</option><option value="50">Normal – 50 XP (~10 min)</option><option value="100">Ernsthaft – 100 XP (~20 min)</option><option value="150">Intensiv – 150 XP (~30 min)</option></select></label>
        <label>Speaking speed <input data-k="rate" type="range" min="0.5" max="1.3" step="0.05"> <button class="btn ghost sm test">Test voice</button></label>
        ${voices.length ? `<label>German voice <select data-k="voice"><option value="">Automatic</option>${voices.map((v) => `<option>${esc(v.name)}</option>`).join("")}</select></label>` : `<p class="muted small">${window.AndroidBridge ? "Using the phone's text-to-speech engine." : "No German voice found. Install one in your system's speech settings."}</p>`}
        <label class="chk"><input data-k="showEn" type="checkbox"> Show English translations</label>
        <label class="chk"><input data-k="unlockAll" type="checkbox"> Open all lessons (skip the order)</label>
      </section>
      <section class="card form"><h3>Habit</h3>
        <label>Daily reminder <span class="row inline"><input class="remt" type="time" value="${H.esc(st.reminder || "19:00")}" style="max-width:140px"><button class="btn sign sm addcal">Add to my calendar</button></span></label>
        <p class="muted small">Downloads a repeating calendar event with an alarm – works with Google Calendar, iPhone and Outlook. Learning at a fixed time is the strongest habit trigger.</p>
        <label class="chk"><input data-k="sound" type="checkbox"> Sounds for right/wrong answers</label>
        <label class="chk"><input data-k="haptics" type="checkbox"> Vibration (phones)</label>
      </section>
      <section class="card form aiset"><h3>✨ ${H.bi("KI-Tutor", "AI tutor")}</h3>
        <p class="muted small">The AI tutor powers the <b>speaking partner</b> and answers open questions in Max. Everything else in the app works without it.</p>
        <label>Where the AI runs <select data-k="aiProvider">${[["local", "On this device – free, no account, offline (recommended)"], ["claude", "Claude – online, needs an Anthropic API key, best quality"]].map(([v, t]) => `<option value="${v}" ${(st.aiProvider || "local") === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        ${(st.aiProvider || "local") === "local" ? `
          ${LLM.supported() ? `
            <label>Model <select data-k="llmModel">${LLM.MODELS.map((m) => `<option value="${m.key}" ${LLM.current().key === m.key ? "selected" : ""}>${m.name} · ${m.size} · ${m.hint}${LLM.recommended() === m.key ? " · recommended here" : ""}${(st.llmTest || {})[m.key] ? ` · tested ${st.llmTest[m.key].score}/100` : ""}</option>`).join("")}</select></label>
            <div class="row"><button class="btn sm llm-dl">${LLM.downloaded() ? "✓ Ready – test it" : `Download (${LLM.current().size}, once)`}</button>${LLM.downloaded() ? `<button class="btn ghost sm llm-rm">Delete from this device</button>` : ""}<span class="muted small llm-prog"></span></div>
            <p class="muted small llm-fit"></p>
            ${LLM.downloaded() ? `<div class="row"><button class="btn ghost sm llm-test">🧪 Test its German on this device</button><span class="muted small llm-tres">${(st.llmTest || {})[LLM.current().key] ? `Last test: German ${st.llmTest[LLM.current().key].score}/100 · ${st.llmTest[LLM.current().key].tps} tokens/s` : ""}</span></div><div class="llm-trows"></div>` : ""}
            <p class="muted small">Runs on your graphics chip (WebGPU). Downloaded once from <span class="llm-src">…</span>, then offline. Uses the battery more than the rest of the app while it talks. Small models write simple German and can slip – your answers are always corrected by Max's checked rules, not by the model.</p>`
          : `<p class="muted small">⚠️ ${H.esc(LLM.why())}</p>`}`
        : `
          <p class="muted small">Get a key at <button class="link" data-url="https://console.anthropic.com/settings/keys">console.anthropic.com</button> (paid, a few cents a month). The key stays on this device and is sent only to api.anthropic.com – with your answers and a short learning profile. With Claude you also get <b>detailed feedback</b> on free answers and writing and <b>new exercises from your mistakes</b>.</p>
          <label>API key <input data-k="aiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-…"></label>
          <label>Model <select data-k="aiModel">${AI.MODELS.map(([v, t]) => `<option value="${v}" ${AI.model() === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
          <label class="chk"><input data-k="aiOnline" type="checkbox"> Use Claude when I'm online</label>
          <div class="row"><button class="btn sm ai-test">Test connection</button><span class="muted small ai-status">${AI.hasKey() ? `This month: ${AI.usage().calls} requests · about $${AI.usage().usd.toFixed(AI.usage().usd < 1 ? 3 : 2)}` : "No key yet."}</span></div>
          <details><summary>What the tutor has learnt about you (${(s.aiNotes || []).length} notes)</summary>${(s.aiNotes || []).length ? `<ul class="small">${s.aiNotes.map((n) => `<li>${H.esc(n)}</li>`).join("")}</ul><button class="btn ghost sm ai-forget">Forget these notes</button>` : `<p class="muted small">After your first conversation with the speaking partner, the tutor keeps a few short notes (recurring mistakes, interests) so later lessons fit you better. They stay on this device.</p>`}</details>`}
      </section>
      <section class="card form"><h3>🗣 ${H.bi("Sprechpartner", "Speaking partner")}</h3>
        <label>Mode <select data-k="partnerMode">${[["guided", "Guided – real questions, Max corrects you, works on every device (recommended)"], ["ai", "Free talk with the AI – needs the AI tutor above"]].map(([v, t]) => `<option value="${v}" ${(st.partnerMode || (window.EDITION === "lab" ? "ai" : "guided")) === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <p class="muted small">If the AI can't start or stops answering, the partner continues in guided mode.</p>
      </section>
      ${window.EDITION === "lab" ? `<section class="card form labset"><h3>🧪 Lab edition</h3>
        <p class="muted small">This is the test version. It has its own progress (your daily app isn't touched), the newest AI models, a longer German test and a diagnostics report you can send back.</p>
        ${Store.hasStable() ? `<div class="row"><button class="btn ghost sm lab-import">Copy my progress from the daily app</button></div>` : ""}
        ${LLM.supported() && LLM.downloaded() ? `<div class="row"><button class="btn sm lab-test">🧪 Long test: A1 · A2 · B1 (18 answers)</button><span class="muted small lab-tres"></span></div>` : ""}
        <div class="row"><button class="btn sm lab-diag">📋 Diagnostics report</button></div>
        <textarea class="lab-out" rows="8" readonly hidden aria-label="Diagnostics report"></textarea>
        <div class="row lab-acts" hidden><button class="btn ghost sm lab-copy">Copy</button><button class="btn ghost sm lab-save">Download .txt</button></div>
      </section>` : ""}
      <section class="card form"><h3>🎙 ${H.bi("Spracherkennung", "Speech recognition")}</h3>
        <p class="muted small"><b>Offline (Whisper)</b> runs on this device: it downloads once (about ${ASR.SIZE_MB} MB), then works without internet, sends no audio anywhere and understands learners better. <b>Browser</b> uses the browser's built-in recognition (Chrome sends audio to Google). ${window.AndroidBridge ? "In the Android app, the phone's own recognition is used." : ""}</p>
        <label>Use <select data-k="asr">${[["auto", "Automatic – offline once downloaded (recommended)"], ["whisper", "Always offline (Whisper)"], ["browser", "Always the browser's recognition"]].map(([v, t]) => `<option value="${v}" ${(st.asr || "auto") === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        ${ASR.supported() ? `<div class="row"><button class="btn sm asr-dl" ${ASR.downloaded() ? "disabled" : ""}>${ASR.downloaded() ? "✓ Offline model ready" : `Download offline model (${ASR.SIZE_MB} MB)`}</button><span class="muted small asr-prog"></span></div>` : `<p class="muted small">Offline recognition isn't available here${window.AndroidBridge ? " (the app uses the phone's recognition)" : " – open the app over https in Chrome, Edge or Firefox"}.</p>`}
      </section>
      <section class="card"><h3>Look and feel</h3>
        <label>Theme <select data-k="theme">${[["auto", "System (follows your phone)"], ["light", "Hell – light"], ["dark", "Dunkel – dark"], ["paper", "Papier – warm, easy on the eyes"]].map(([v, t]) => `<option value="${v}" ${(s.settings.theme || "auto") === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>App language <select data-k="labels">${[["en", "English – I'm new to German (menus, lesson explanations and hints in English)"], ["both", "Deutsch + English (recommended once you know some German)"], ["de", "Nur Deutsch – German only"]].map(([v, t]) => `<option value="${v}" ${(s.settings.labels || "both") === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Text size <select data-k="textSize">${[["s", "Small"], ["m", "Normal"], ["l", "Large"], ["xl", "Very large"]].map(([v, t]) => `<option value="${v}" ${(s.settings.textSize || "m") === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <label>Teacher's tone <select data-k="tone">${[["streng", "Streng – Frau Weber, no excuses (default)"], ["neutral", "Neutral – plain feedback"], ["freundlich", "Freundlich – gentle encouragement"]].map(([v, t]) => `<option value="${v}" ${(s.settings.tone || "streng") === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>
        <p class="muted small">Frau Weber comments on your plan, repeated mistakes and broken streaks. She's blunt about the work, never about you.</p>
      </section>
      <section class="card"><h3>Learner profiles</h3>
        <p class="muted small">Each learner on this device has separate progress. Nothing leaves the device.</p>
        <label>Your name <input class="pn" maxlength="30" value="${H.esc(Store.name())}"></label>
        <ul class="plist">${Store.profiles().map((p) => `<li><span class="av" style="background:${p.color}">${H.esc((p.name || "?").charAt(0).toUpperCase())}</span> ${H.esc(p.name || "Unnamed")} ${p.id === Store.profile().id ? '<span class="muted small">· active</span>' : `<button class="btn ghost sm psw" data-id="${p.id}">Switch</button><button class="btn bad sm pdel" data-id="${p.id}">Delete</button>`}</li>`).join("")}</ul>
        <div class="row"><button class="btn padd">Add a learner</button></div></section>
      <section class="card"><h3>Your data</h3><p class="muted small">Progress is saved on this device. Export a backup to move it to another phone or browser.</p>
        <div class="row"><button class="btn exp">Export backup</button><label class="btn ghost">Import backup<input type="file" accept="application/json,.json" class="imp" hidden></label><button class="btn bad rst">Reset progress</button></div></section>
      <section class="card"><h3>App version</h3><p class="muted small">If the app looks old after an update, reload it. Your progress is kept.</p><div class="row"><button class="btn ghost appreset">Reload newest version</button></div></section>
      <section class="card"><h3>Install the app</h3>
        <p><b>Android (Chrome):</b> menu ⋮ → “Install app” / “Add to Home screen”. Or install the APK.</p>
        <p><b>iPhone (Safari):</b> Share → “Add to Home Screen”. Works offline after the first visit.</p>
        <p><b>Desktop Chrome:</b> install icon in the address bar.</p>
        <p class="muted small">${DC.curriculum.length} lessons · ${DC.vocab.length} words · ${Object.keys(Engine.GEN).length} sentence generators</p></section>
      <section class="card about"><h3>About</h3>
        <p>Deutsch Coach <b>${App.version}</b></p>
        <p>Created by <b>${App.author}</b></p>
        <p>Last updated: ${App.updated}</p>
        <p class="muted small">© ${new Date().getFullYear()} ${App.author}. All rights reserved.</p>
        <div class="row"><button class="btn ghost sm" data-go="about">About & privacy</button><button class="btn ghost sm" data-report='{"part":"General feedback"}'>⚑ Report a problem</button></div></section>`;
    const pn = el.querySelector(".pn");
    pn.onchange = () => { if (!pn.value.trim()) { pn.value = Store.name(); return; } Store.setName(pn.value); App.renderChip(); H.toast("Name saved."); };
    el.querySelectorAll(".psw").forEach((b) => (b.onclick = () => { Store.switchTo(b.dataset.id); App.afterSwitch(); }));
    el.querySelectorAll(".pdel").forEach((b) => (b.onclick = () => {
      const p = Store.profiles().find((x) => x.id === b.dataset.id);
      if (confirm(`Delete ${p.name || "this profile"} and all of its progress? This cannot be undone.`)) { Store.deleteProfile(p.id); V.settings(el); }
    }));
    el.querySelector(".padd").onclick = App.profileSheet;
    el.querySelectorAll("[data-k]").forEach((inp) => {
      const k = inp.dataset.k;
      if (inp.type === "checkbox") inp.checked = !!st[k]; else inp.value = st[k] ?? "";
      inp.onchange = () => {
        st[k] = inp.type === "checkbox" ? inp.checked : inp.type === "number" || inp.type === "range" || inp.dataset.num ? +inp.value : inp.value.trim();
        Store.save(); if (k === "theme" || k === "labels" || k === "textSize") App.applyTheme();
        if (k === "aiProvider" || k === "llmModel") { V.settings(el); setTimeout(() => { const x = el.querySelector(".aiset"); if (x) x.scrollIntoView({ block: "center" }); }, 30); return; }
        if (k === "aiOnline" && st.aiOnline && !st.aiKey) H.toast("Add your API key to use the AI tutor.");
        if (k === "aiKey" && st.aiKey) { st.aiOnline = true; Store.save(); const c = el.querySelector('[data-k="aiOnline"]'); if (c) c.checked = true; H.toast("Key saved. Press “Test connection” to check it."); }
      };
    });
    const lsrc = el.querySelector(".llm-src"); if (lsrc) LLM.source().then((t) => (lsrc.textContent = t));
    const lfit = el.querySelector(".llm-fit"); if (lfit) LLM.fits().then((ok) => { if (!ok) lfit.innerHTML = `⚠️ This device's graphics chip is too small for ${H.esc(LLM.current().name)} – pick a smaller model.`; });
    const ltest = el.querySelector(".llm-test");
    if (ltest) ltest.onclick = async () => {
      const out = el.querySelector(".llm-tres"), rows = el.querySelector(".llm-trows"); ltest.disabled = true;
      try {
        out.textContent = "Starting…";
        const r = await LLM.selfTest(LLM.current(), (i, n) => (out.textContent = `Testing ${i + 1}/${n}…`));
        const verdict = r.score >= 80 && r.tps >= 8 ? "✓ Good for conversation practice." : r.score >= 80 ? "Good German, but slow on this device – try the smaller model." : r.score >= 60 ? "Usable, with some slips – a bigger model would be better if this device can run it." : "Not reliable on this device – use a bigger model, or Claude online.";
        out.innerHTML = `<b>German ${r.score}/100</b> · ${r.tps} tokens/s · ${verdict}`;
        rows.innerHTML = `<details><summary class="small">See the 6 test replies</summary><ul class="small">${r.rows.map((x) => `<li><span class="muted">${H.esc(x.user)}</span><br>→ ${H.esc(x.reply)} <b>${x.score}</b>${x.issues ? ` · Max found ${x.issues} problem${x.issues > 1 ? "s" : ""}` : ""}${x.german ? "" : " · not only German"}</li>`).join("")}</ul></details>`;
      } catch (err) { out.textContent = "✗ " + err.message; }
      ltest.disabled = false;
    };
    if (window.EDITION === "lab") bindLab(el);
    const ldl = el.querySelector(".llm-dl");
    if (ldl) ldl.onclick = async () => {
      const pr = el.querySelector(".llm-prog"); ldl.disabled = true; ldl.textContent = LLM.downloaded() ? "Starting…" : "Downloading…";
      const off = LLM.onProgress((p) => { pr.textContent = `${Math.round((p.progress || 0) * 100)} % · ${String(p.text || "").replace(/\[.*?\]/g, "").slice(0, 70)}`; });
      try {
        await LLM.load();
        pr.textContent = "Testing…";
        const t = await LLM.chat({ system: "Antworte mit einem kurzen, freundlichen deutschen Satz.", messages: [{ role: "user", content: "Sag hallo zu einem Deutschlerner." }], maxTokens: 60 });
        pr.innerHTML = `✓ Works offline: <i>${H.esc(t.slice(0, 120))}</i>`; ldl.textContent = "✓ Ready – test it";
      } catch (err) { pr.textContent = "✗ " + err.message; ldl.textContent = "Try again"; }
      ldl.disabled = false; off();
    };
    const lrm = el.querySelector(".llm-rm"); if (lrm) lrm.onclick = async () => { if (!confirm(`Delete ${LLM.current().name} (${LLM.current().size}) from this device? You can download it again later.`)) return; await LLM.remove(); V.settings(el); H.toast("Model deleted – space freed."); };
    const aitest = el.querySelector(".ai-test");
    if (aitest) aitest.onclick = async (e) => {
      const out = el.querySelector(".ai-status"); e.target.disabled = true; out.textContent = "Testing…";
      try { const r = await AI.call({ system: "Reply with one short friendly German sentence for a language learner.", messages: [{ role: "user", content: "Sag hallo." }], maxTokens: 200 }); out.innerHTML = `✓ Works (${H.esc(AI.model())}): <i>${H.esc(r.slice(0, 120))}</i>`; }
      catch (err) { out.textContent = "✗ " + err.message; }
      e.target.disabled = false;
    };
    const fg = el.querySelector(".ai-forget"); if (fg) fg.onclick = () => { AI.forget(); V.settings(el); H.toast("Notes deleted."); };
    const dl = el.querySelector(".asr-dl");
    if (dl) dl.onclick = async () => {
      const pr = el.querySelector(".asr-prog"); dl.disabled = true; dl.textContent = "Downloading…";
      const files = {}; const off = ASR.onProgress((p) => { files[p.file] = [p.loaded || 0, p.total || 0]; const v = Object.values(files); const a = v.reduce((x, y) => x + y[0], 0), b = v.reduce((x, y) => x + y[1], 0); pr.textContent = b ? `${Math.round(a / 1e6)} / ${Math.round(b / 1e6)} MB` : ""; });
      try { await ASR.load(); dl.textContent = "✓ Offline model ready"; pr.textContent = "Speech recognition now works offline."; }
      catch (err) { dl.disabled = false; dl.textContent = "Try the download again"; pr.textContent = "✗ " + err.message; }
      off();
    };
    el.querySelector(".test").onclick = () => Speech.speak("Guten Tag! Ich heiße Max und helfe dir beim Deutschlernen.");
    el.querySelector(".exp").onclick = App.backup;
    el.querySelector(".addcal").onclick = () => { Habit.reminderICS(el.querySelector(".remt").value || "19:00", Math.max(5, Math.round((st.goal || 50) / 5))); H.toast("Open the downloaded file to add the reminder.", "good"); };
    el.querySelector(".appreset").onclick = App.hardReload;
    el.querySelector(".imp").onchange = async (e) => { try { Store.import(await e.target.files[0].text()); H.toast("Backup imported.", "good"); App.route(); } catch (err) { H.toast(err.message, "bad"); } };
    el.querySelector(".rst").onclick = () => { if (confirm("Delete all progress on this device? This can't be undone.")) { Store.reset(); H.toast("Progress reset."); App.go("home"); } };
  };

})();
