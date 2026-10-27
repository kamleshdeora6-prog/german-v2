/* Deutsch Coach – 7.0 exam pack: mock exams in telc/Goethe format (full timed exam or one part at a time),
   writing check with versions, speaking with recordings, results, readiness meter and the official papers. */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});
  const LEVELS = ["A1", "A2", "B1"];
  const PITCH = { A: 1, B: 1.3, C: 0.8, N: 1.08 };
  const L = (i) => "abcdefghijklmnop"[i];
  const allTests = () => LEVELS.flatMap((lv) => (DC.telc[lv] || []));
  const testById = (id) => allTests().find((t) => t.id === id);
  const st = () => Store.get();
  const nl2p = (t) => esc(t).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("");

  /* ---------------- writing check (exam style) ---------------- */
  const SENT = (t) => t.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => x.length > 2);
  V.writeCheck = (text, task) => {
    const t = String(text || "").trim(), low = t.toLowerCase(), words = t.split(/\s+/).filter(Boolean).length;
    const en = words >= 4 && (low.match(/\b(the|and|is|are|i|you|my|have|with|this|that|will|would)\b/g) || []).length / words > 0.25;
    const greet = /^(liebe|lieber|hallo|hi|sehr geehrte|guten tag)\b/i.test(t);
    const close = /(grüße|gruß|bis bald|tschüss|bis dann|alles gute)/i.test(t);
    const pts = (task.keywords || []).map((grp, i) => ({ label: (task.points_list || [])[i] || `Point ${i + 1}`, ok: grp.some((k) => low.includes(k)) }));
    // after „Liebe Julia,“ the next line starts with a small letter – correct in German letters, so check it capitalised
    const fixes = SENT(t).filter((s) => !/,$/.test(s) || s.split(/\s+/).length > 4).map((s) => { const c = /^[a-zäöü]/.test(s) ? s[0].toUpperCase() + s.slice(1) : s; return { s, r: Tutor.check(c) }; }).filter((x) => x.r.issues.length);
    const need = task.minWords || 40, lenOk = words >= need * 0.85;
    const nSent = SENT(t).length, conn = (low.match(/\b(weil|dass|wenn|denn|deshalb|aber|trotzdem|obwohl|damit|danach|außerdem)\b/g) || []).length;
    const checks = [
      [!en, "In German", en ? "Write it in German – the English won't count." : "✓"],
      [pts.every((p) => p.ok), `All ${pts.length} points of the task`, pts.map((p) => `${p.ok ? "✓" : "✗"} ${p.label}`).join(" · ")],
      [greet && close, "Greeting and closing", greet && close ? "✓" : `${greet ? "" : "Start with „Liebe … / Hallo … / Sehr geehrte …“. "}${close ? "" : "End with „Viele Grüße“ + your name."}`],
      [lenOk, `Length (about ${need}${task.level === "B1" ? "–150" : ""} words)`, `${words} words${lenOk ? "" : ` – write ${need - words} more`}.`],
      [!fixes.length || fixes.length <= Math.max(1, nSent / 6), "Grammar", fixes.length ? `${fixes.length} sentence${fixes.length > 1 ? "s" : ""} to fix – see below.` : "Max found no rule mistakes."],
      [task.level === "A1" || conn >= (task.level === "B1" ? 3 : 1), "Linking words", conn ? `${conn} linking word${conn > 1 ? "s" : ""} (weil, dass, deshalb …)` : "Connect your sentences: weil, deshalb, aber, dann …"],
    ];
    const W = [5, 40, 10, 15, 20, 10];
    let score = en ? 5 : checks.reduce((a, [ok], i) => a + (ok ? W[i] : i === 1 ? Math.round((W[1] * pts.filter((p) => p.ok).length) / Math.max(1, pts.length)) : i === 4 ? Math.max(0, W[4] - fixes.length * 4) : 0), 0);
    score = Math.max(0, Math.min(100, Math.round(score)));
    if (!words) score = 0;
    const verdict = score >= 85 ? ["Sehr gut!", "Very good!"] : score >= 65 ? ["Gut!", "Good!"] : score >= 45 ? ["Okay – noch besser:", "Okay – to make it better:"] : ["Weiter üben", "Keep working on it"];
    const html = `<div class="fb-open"><div class="fb-head"><span class="fb-score ${score >= 65 ? "good" : score >= 45 ? "mid" : "low"}">${score}</span><div><b>${H.bi(verdict[0], verdict[1])}</b><div class="pbar sm"><span style="width:${score}%"></span></div></div></div>
      <ul class="fb-list">${checks.map(([ok, l, tip]) => `<li class="${ok ? "y" : "n"}"><span>${ok ? "✓" : "✗"}</span><div><b>${esc(l)}</b><br><span class="muted">${esc(tip)}</span></div></li>`).join("")}</ul>
      ${fixes.length ? `<h4>Corrections</h4>${fixes.map((x) => `<p class="fb-you">${esc(x.s)} ${UI.star({ type: "sentence", de: x.r.fixed, en: "", src: "Writing" })}</p><p class="ex ok">→ ${esc(x.r.fixed)} ${UI.say(x.r.fixed)}</p><ul class="nots">${x.r.issues.map((i) => `<li>${i.rule}<br><span class="muted">${i.why}</span></li>`).join("")}</ul>`).join("")}` : ""}
      ${task.model ? `<details class="fb-model" ${score < 45 ? "open" : ""}><summary>📝 Model answer</summary><div class="ex">${nl2p(task.model)}</div>${UI.say(task.model)}</details>` : ""}</div>`;
    return { score, html };
  };

  /* ---------------- results, readiness ---------------- */
  const skillOf = { lesen: "Lesen", sprachbausteine: "Sprachbausteine", hoeren: "Hören", schreiben: "Schreiben", sprechen: "Sprechen" };
  const partStore = () => (st().telcParts = st().telcParts || {});
  function savePart(test, pk, p, max) { partStore()[test.id + "/" + pk] = { p, max, at: Date.now(), skill: test.parts[pk].skill, level: test.level }; if (window.Habit) Habit.track("exam"); Store.save(); }
  /* for the practice day: the part you have not done yet, or the weakest one, at your exam level */
  V.nextExamPart = () => {
    const lv = st().settings.examLevel || (["A1", "A2", "B1"].includes(AI.profile().level) ? AI.profile().level : "B1");
    const ps = partStore(), tests = DC.telc ? DC.telc[lv] || [] : [];
    if (!tests.length) return "telc";
    // first a part you have not done in any test yet, otherwise the weakest part
    for (const t of tests) { const pk = t.blocks.flatMap((b) => b.parts).find((k) => !ps[t.id + "/" + k]); if (pk) return `telc/${t.id}/part/${pk}`; }
    const all = tests.flatMap((t) => t.blocks.flatMap((b) => b.parts).map((k) => [t.id, k, ps[t.id + "/" + k]]));
    const [id, todo] = all.sort((a, b) => a[2].p / a[2].max - b[2].p / b[2].max)[0];
    return `telc/${id}/part/${todo}`;
  };
  V.readiness = (level) => {
    level = level || st().settings.examLevel || "B1";
    const parts = Object.values(partStore()).filter((x) => x.level === level);
    const bySkill = {}; parts.forEach((x) => { const o = (bySkill[x.skill] = bySkill[x.skill] || [0, 0]); o[0] += x.p; o[1] += x.max; });
    const skills = Object.keys(skillOf).filter((k) => level === "B1" || k !== "sprachbausteine");
    const skillPct = skills.map((k) => (bySkill[k] ? Math.round((bySkill[k][0] / bySkill[k][1]) * 100) : null));
    const done = skillPct.filter((x) => x !== null);
    const examPart = done.length ? done.reduce((a, b) => a + b, 0) / skills.length : 0;   // untested skills count as 0
    const lvI = ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(level);
    const gens = Object.values(Engine.GEN).filter((g) => ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(g.level) <= lvI);
    const accs = gens.map((g) => { const t = st().topics[g.id]; return t && t.recent && t.recent.length ? t.recent.reduce((a, b) => a + b, 0) / t.recent.length : 0; });
    const drill = accs.length ? (accs.reduce((a, b) => a + b, 0) / accs.length) * 100 : 0;
    const ls = DC.curriculum.filter((l) => ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(l.level) <= lvI);
    const lessons = ls.length ? (ls.filter((l) => (st().lessons[l.n] || {}).done).length / ls.length) * 100 : 0;
    const pct = Math.round(examPart * 0.5 + drill * 0.3 + lessons * 0.2);
    const weakest = skills.map((k, i) => ({ k, name: skillOf[k], v: skillPct[i] })).sort((a, b) => (a.v === null ? -1 : a.v) - (b.v === null ? -1 : b.v))[0];
    return { level, pct, examPart: Math.round(examPart), drill: Math.round(drill), lessons: Math.round(lessons), skills: skills.map((k, i) => ({ k, name: skillOf[k], v: skillPct[i] })), weakest };
  };
  V.readinessCard = (compact, level) => {
    const r = V.readiness(level);
    const tip = r.weakest && r.weakest.v === null ? `Next: try the <b>${r.weakest.name}</b> part of a mock test.` : r.weakest ? `Weakest: <b>${r.weakest.name}</b> (${r.weakest.v}%).` : "";
    return `<section class="card ready"><div class="ready-row">${Habit && Habit.ring ? Habit.ring(r.pct, compact ? 64 : 84, 8, `<b>${r.pct}%</b>`) : `<b>${r.pct}%</b>`}
      <div><b>${H.bi(`Bereit für ${r.level}`, `${r.level} exam readiness`)}</b><br><span class="muted small">Mock tests ${r.examPart}% · drills ${r.drill}% · lessons ${r.lessons}%</span><br><span class="small">${tip}</span></div></div>
      ${compact ? `<div class="row"><button class="btn sm" data-go="telc">Mock exams</button></div>` : `<div class="skillbars">${r.skills.map((s) => `<div><span>${s.name}</span><i class="meter" style="--p:${s.v || 0}%"></i><b>${s.v === null ? "–" : s.v + "%"}</b></div>`).join("")}</div><p class="muted small">60% in every part is the pass mark. The meter counts mock-test results (50%), drill accuracy for ${r.level} and below (30%) and finished lessons (20%).</p>`}</section>`;
  };

  /* ---------------- hub ---------------- */
  V.telc = (el, [id, mode, arg]) => {
    if (id && !testById(id)) return App.go("telc");
    if (id && mode === "run") return runExam(el, testById(id));
    if (id && mode === "part") return practicePart(el, testById(id), arg);
    if (id && mode === "result") return showResult(el, testById(id), (st().telc || []).find((x) => String(x.at) === arg));
    if (id) return overview(el, testById(id));
    const lv = st().settings.examLevel || "B1";
    el.innerHTML = `<button class="back" data-go="exam">‹ Exam trainer</button><h2 class="page-title">${H.bi("Modelltests", "Mock exams")}</h2>
      <p class="muted">In the format of telc Deutsch / Goethe / Start Deutsch: the same parts, task types, number of items and times. All texts are written for this app – the official sample papers are linked below.</p>
      <div class="seg lvseg" role="group">${LEVELS.map((l) => `<button data-lv="${l}" class="${l === lv ? "on" : ""}">${l}</button>`).join("")}</div>
      ${V.readinessCard()}
      ${(DC.telc[lv] || []).map((t) => { const res = (st().telc || []).filter((x) => x.id === t.id); const last = res[res.length - 1]; return `<section class="card"><h3>${esc(t.title)}</h3><p class="muted small">${esc(t.exam)} · ${t.blocks.map((b) => `${esc(b.title)} ${b.minutes} min`).join(" · ")}</p>
        ${last ? `<p>Last result: <b class="${last.pass ? "good" : "low"}">${last.pct}% – ${last.pass ? "passed ✓" : "not passed yet"}</b> <button class="link" data-go="telc/${t.id}/result/${last.at}">details</button></p>` : ""}
        <div class="row"><button class="btn sign" data-go="telc/${t.id}/run">⏱ Full exam (timed)</button><button class="btn ghost" data-go="telc/${t.id}">Practise one part</button></div></section>`; }).join("")}
      <section class="card"><h3>📄 Official sample papers</h3><p class="muted small">Free from the exam providers – do them on paper or on screen, with their audio.</p><div class="tlinks">${(DC.telcLinks || []).map(([n, u, d]) => `<button class="tlink" data-url="${u}"><b>${esc(n)} ↗</b><span>${esc(d)}</span></button>`).join("")}</div></section>`;
    el.querySelectorAll("[data-lv]").forEach((b) => (b.onclick = () => { st().settings.examLevel = b.dataset.lv; Store.save(); V.telc(el, []); }));
  };
  function overview(el, t) {
    el.innerHTML = `<button class="back" data-go="telc">‹ Mock exams</button><h2 class="page-title">${esc(t.title)}</h2><p class="muted">${esc(t.exam)}. Practise any part on its own – no timer, answers checked right away, recordings replayed and texts shown afterwards.</p>
      ${t.blocks.map((b) => `<section class="card"><h3>${esc(b.title)} <span class="muted small">· ${b.minutes} min in the exam</span></h3><div class="topics">${b.parts.map((pk) => { const p = t.parts[pk], r = partStore()[t.id + "/" + pk]; return `<button class="topic" data-go="telc/${t.id}/part/${pk}"><span>${esc(p.title)}</span><small>${p.items ? p.items.length + " items · " : ""}${p.points} pts${r ? ` · last ${Math.round((r.p / r.max) * 100)}%` : ""}</small>${r ? `<i class="meter" style="--p:${Math.round((r.p / r.max) * 100)}%"></i>` : ""}</button>`; }).join("")}</div></section>`).join("")}
      <div class="row"><button class="btn sign" data-go="telc/${t.id}/run">⏱ Full exam (timed)</button></div>`;
  }

  /* ---------------- audio ---------------- */
  function audioBtn(lines, plays, practice) {
    return `<div class="aud" data-lines="${esc(JSON.stringify(lines))}" data-left="${practice ? 99 : plays}"><button class="btn sm aud-b">▶ Play</button> <span class="muted small aud-n">${practice ? "" : `(${plays}× allowed)`}</span></div>`;
  }
  function bindAudio(root) {
    root.querySelectorAll(".aud").forEach((a) => {
      const b = a.querySelector(".aud-b"), n = a.querySelector(".aud-n");
      b.onclick = () => {
        let left = +a.dataset.left; if (left <= 0) return;
        if (Speech.isPlaying(a.dataset.lines)) { Speech.stop(); b.textContent = "▶ Play"; return; }
        const lines = JSON.parse(a.dataset.lines);
        Speech.play(lines.map((x) => x[1]), { key: a.dataset.lines, pitches: lines.map((x) => PITCH[x[0]] || 1), locked: left < 90 });
        left--; a.dataset.left = left; if (left < 90) n.textContent = left ? `(${left}× left)` : "(heard)";
        b.textContent = "■ Stop";
        const off = Speech.onChange(() => { if (!Speech.isPlaying(a.dataset.lines)) { b.textContent = left > 0 ? "▶ Play again" : "✓ Heard"; b.disabled = left <= 0; } });
        void off;
      };
    });
  }

  /* ---------------- render one part ---------------- */
  const optList = (opts, cls = "") => `<ol class="optlist ${cls}" type="a">${opts.map((o) => `<li value="${"abcdefghijklmnop".indexOf(o.k) + 1}"><b>${o.k}</b> ${esc(o.t)}</li>`).join("")}</ol>`;
  function renderPart(t, pk, practice) {
    const p = t.parts[pk];
    let h = `<section class="card tpart" data-pk="${pk}"><h3>${esc(p.title)} <span class="muted small">· ${p.points} pts</span></h3><p class="instr">${esc(p.instruction)}</p>`;
    if (p.audio) h += audioBtn(p.audio, p.plays || 2, practice);
    if (p.text && p.type !== "gapmc" && p.type !== "gapbank") h += `<div class="ttext">${nl2p(p.text)}</div>`;
    if (p.type === "match") {
      h += `<div class="match"><div class="m-items">${p.items.map((it) => `<div class="mi" data-n="${it.n}"><b class="num">${it.n}</b><span>${esc(it.t)}</span><select aria-label="Answer ${it.n}"><option value="">–</option>${p.options.map((o) => `<option value="${o.k}">${o.k}) ${esc(o.t.length > 70 ? o.t.slice(0, 68) + "…" : o.t)}</option>`).join("")}${p.allowX ? `<option value="x">x) no matching ad</option>` : ""}</select><span class="mres"></span></div>`).join("")}</div>
        <div class="m-opts">${optList(p.options)}</div></div>`;
    } else if (p.type === "mc") {
      h += p.items.map((it) => `<div class="mc" data-n="${it.n}">${it.audio ? audioBtn(it.audio, p.plays || 2, practice) : ""}<p><b class="num">${it.n}</b> ${esc(it.q)}</p><div class="mcopts">${it.o.map((o, i) => `<label class="mco"><input type="radio" name="${t.id}-${pk}-${it.n}" value="${i}"><b>${L(i)}</b> ${esc(o)}</label>`).join("")}</div><div class="mres"></div></div>`).join("");
    } else if (p.type === "rf") {
      h += p.items.map((it) => `<div class="rf" data-n="${it.n}">${it.audio ? audioBtn(it.audio, p.plays || 2, practice) : ""}${it.t ? `<p class="tsign">${esc(it.t)}</p>` : ""}<p><b class="num">${it.n}</b> ${esc(it.s)}</p><div class="rfopts"><label><input type="radio" name="${t.id}-${pk}-${it.n}" value="1"> richtig</label><label><input type="radio" name="${t.id}-${pk}-${it.n}" value="0"> falsch</label></div><div class="mres"></div></div>`).join("");
    } else if (p.type === "gapmc" || p.type === "gapbank") {
      const sel = (n) => p.type === "gapmc"
        ? `<select class="gap-s" data-n="${n}" aria-label="Gap ${n}"><option value="">${n} …</option>${p.items.find((x) => x.n === n).o.map((o, i) => `<option value="${i}">${L(i)}) ${esc(o)}</option>`).join("")}</select>`
        : `<select class="gap-s" data-n="${n}" aria-label="Gap ${n}"><option value="">${n} …</option>${p.words.map((w) => `<option value="${w.k}">${w.k}) ${esc(w.w)}</option>`).join("")}</select>`;
      h += `${p.type === "gapbank" ? `<div class="wbank">${p.words.map((w) => `<span><b>${w.k}</b> ${esc(w.w)}</span>`).join("")}</div>` : ""}<div class="ttext gaptext">${nl2p(p.text).replace(/\[(\d+)\]/g, (m, n) => sel(+n))}</div><div class="gapres"></div>`;
    } else if (p.type === "form") {
      h += `<div class="formbox">${p.fields.map((f, i) => `<label class="ff"><span>${esc(f.label)}</span><input data-i="${i}" autocomplete="off"><span class="mres"></span></label>`).join("")}</div>`;
    } else if (p.type === "write") {
      const task = "telc:" + t.id + ":" + pk;
      h += `${p.letter ? `<div class="letter">${nl2p(p.letter)}</div>` : ""}${p.points_list ? `<ul class="wpts">${p.points_list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
        <textarea class="wtext" rows="10" placeholder="Schreiben Sie hier…"></textarea><div class="row"><span class="muted small wcount">0 words</span>${practice ? `<button class="btn sm wchk">Check my text</button><button class="btn ghost sm wshare">Send for correction</button>` : ""}</div><div class="wfb"></div><div class="whost">${UI.writeHistory(task)}</div>`;
    } else if (p.type === "speak") {
      h += p.teile.map((te, i) => `<div class="teil" data-i="${i}"><h4>${esc(te.t)} <span class="muted small">· about ${te.min} min</span></h4><p>${esc(te.task)}</p>${te.source ? `<blockquote>${esc(te.source)}</blockquote>` : ""}<ul class="prompts">${te.prompts.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        <div class="rechost" data-key="telc:${t.id}:${pk}:${i}"></div>
        <details><summary>📝 Model answer</summary><p class="ex">${esc(te.model)} ${UI.say(te.model)}</p></details></div>`).join("") +
        `<div class="selfcheck"><h4>How did it go? (be honest – this is your score)</h4>${p.criteria.map((c, i) => `<div class="sc" data-i="${i}"><span>${esc(c)}</span><span class="seg sm">${["no", "partly", "yes"].map((x, v) => `<button type="button" data-v="${v}">${x}</button>`).join("")}</span></div>`).join("")}</div>`;
    }
    if (practice && p.type !== "write") h += `<div class="row"><button class="btn sign pchk">Check answers</button></div><div class="pscore"></div>`;
    if (practice && (p.audio || (p.items || []).some((x) => x.audio))) h += `<details class="transcript" hidden><summary>📜 What was said</summary>${(p.audio ? [p.audio] : p.items.map((x) => x.audio)).map((a) => `<p>${a.map(([sp, tx]) => `<b>${sp === "N" ? "📢" : sp}:</b> ${esc(tx)}`).join("<br>")}</p>`).join("")}</details>`;
    return h + `</section>`;
  }
  function bindPart(root, t, pk, practice) {
    const p = t.parts[pk], sec = root.querySelector(`.tpart[data-pk="${pk}"]`);
    bindAudio(sec);
    if (p.type === "write") {
      const task = "telc:" + t.id + ":" + pk, ta = sec.querySelector(".wtext"), wc = sec.querySelector(".wcount");
      const key = "draft:" + task; try { ta.value = sessionStorage.getItem(key) || (Writings.get(task) ? Writings.get(task).versions.slice(-1)[0].text : ""); } catch (e) {}
      const count = () => { const n = ta.value.split(/\s+/).filter(Boolean).length; wc.textContent = `${n} words${p.minWords ? ` (aim: ${p.minWords}+)` : ""}`; try { sessionStorage.setItem(key, ta.value); } catch (e) {} };
      ta.oninput = count; count(); UI.bindWriteHistory(sec, task, ta);
      const chk = sec.querySelector(".wchk");
      if (chk) chk.onclick = () => {
        if (!ta.value.trim()) return H.toast("Write your text first.");
        const r = V.writeCheck(ta.value, p); sec.querySelector(".wfb").innerHTML = r.html;
        Writings.add(task, `${t.title} · ${p.title}`, ta.value, r.score);
        sec.querySelector(".whost").innerHTML = UI.writeHistory(task); UI.bindWriteHistory(sec, task, ta);
        savePart(t, pk, Math.round((p.points * r.score) / 100 * 10) / 10, p.points);
        if (window.Habit) Habit.track("write"); Store.addXP(r.score >= 65 ? 15 : 6);
      };
      const sh = sec.querySelector(".wshare"); if (sh) sh.onclick = () => ta.value.trim() ? UI.shareText(ta.value) : H.toast("Write your text first.");
    }
    if (p.type === "speak") {
      sec.querySelectorAll(".rechost").forEach((h, i) => UI.recorder(h, { key: h.dataset.key, model: p.teile[i].model, maxSecs: p.teile[i].min * 60 + 60, label: "Record your answer" }));
      sec.querySelectorAll(".sc").forEach((r) => r.querySelectorAll("[data-v]").forEach((b) => (b.onclick = () => { r.dataset.v = b.dataset.v; r.querySelectorAll("[data-v]").forEach((x) => x.classList.toggle("on", x === b)); })));
    }
    const pc = sec.querySelector(".pchk");
    if (pc) pc.onclick = () => {
      const r = scorePart(sec, t, pk, true);
      sec.querySelector(".pscore").innerHTML = `<p class="big"><b class="${r.pct >= 60 ? "good" : "low"}">${r.p} / ${r.max} points (${r.pct}%)</b> ${r.pct >= 60 ? "– pass level ✓" : "– 60% is the pass mark"}</p>${r.pct < 80 ? suggest(p) : ""}`;
      const tr = sec.querySelector(".transcript"); if (tr) tr.hidden = false;
      savePart(t, pk, r.p, r.max); Store.addXP(Math.round(r.pct / 10));
      if (window.Habit) Habit.track(p.skill === "hoeren" ? "listen" : p.skill === "lesen" ? "read" : p.skill === "sprechen" ? "speak" : "drill");
    };
  }
  const suggest = (p) => {
    const g = { lesen: [["read", "Reading & listening texts"], ["readexam", "Reading exam sets"]], hoeren: [["listen", "Listening practice"], ["dictation", "Dictation"]], sprachbausteine: [["revise", "Grammar revision"], ["practice/konjunktionen", "Connectors drill"], ["practice/verb_praep", "Verbs + prepositions"]], schreiben: [["write", "Writing exam"]], sprechen: [["partner", "Speaking partner"], ["pictures", "Describe a picture"]] }[p.skill] || [];
    return g.length ? `<p class="small">Practise more: ${g.map(([go, n]) => `<button class="link" data-go="${go}">${n}</button>`).join(" · ")}</p>` : "";
  };

  /* check a part: returns points; shows ✓/✗ when show=true */
  function scorePart(sec, t, pk, show) {
    const p = t.parts[pk]; let right = 0, n = 0;
    const mark = (el, ok, sol) => { if (!show || !el) return; el.innerHTML = ok ? `<span class="good">✓</span>` : `<span class="low">✗ ${esc(sol)}</span>`; };
    if (p.type === "match") p.items.forEach((it) => { n++; const row = sec.querySelector(`.mi[data-n="${it.n}"]`); const v = row.querySelector("select").value; const ok = v === it.a || ((p.alsoOk || {})[it.n] || []).includes(v); if (ok) right++; mark(row.querySelector(".mres"), ok, it.a); if (show) row.classList.toggle("bad", !ok); });
    if (p.type === "mc" || p.type === "rf") p.items.forEach((it) => { n++; const row = sec.querySelector(`[data-n="${it.n}"]`); const c = row.querySelector("input:checked"); const want = p.type === "mc" ? String(it.a) : it.a ? "1" : "0"; const ok = !!c && c.value === want; if (ok) right++; mark(row.querySelector(".mres"), ok, p.type === "mc" ? `${L(it.a)}) ${it.o[it.a]}` : it.a ? "richtig" : "falsch"); });
    if (p.type === "gapmc" || p.type === "gapbank") {
      const out = [];
      sec.querySelectorAll(".gap-s").forEach((s) => { n++; const num = +s.dataset.n; const want = p.type === "gapmc" ? String(p.items.find((x) => x.n === num).a) : p.answers[num]; const ok = s.value === want || ((p.alsoOk || {})[num] || []).includes(s.value); if (ok) right++; if (show) { s.classList.toggle("ok", ok); s.classList.toggle("bad", !ok); if (!ok) out.push(`<li><b>${num}</b>: ${p.type === "gapmc" ? esc(p.items.find((x) => x.n === num).o[+want]) : esc(p.words.find((w) => w.k === want).w)} – ${(p.why || {})[num] || ""}</li>`); } });
      if (show) sec.querySelector(".gapres").innerHTML = out.length ? `<ul class="small gapwhy">${out.join("")}</ul>` : "";
    }
    if (p.type === "form") p.fields.forEach((f, i) => { n++; const inp = sec.querySelector(`input[data-i="${i}"]`); const v = inp.value.trim().toLowerCase(); const ok = f.a.some((x) => x.toLowerCase() === v); if (ok) right++; mark(inp.parentNode.querySelector(".mres"), ok, f.a[0]); });
    if (p.type === "speak") { const rows = [...sec.querySelectorAll(".sc")]; n = rows.length * 2; right = rows.reduce((a, r) => a + (+r.dataset.v || 0), 0); }
    if (p.type === "write") { const ta = sec.querySelector(".wtext"); const r = V.writeCheck(ta.value, p); if (ta.value.trim()) Writings.add("telc:" + t.id + ":" + pk, `${t.title} · ${p.title}`, ta.value, r.score); return { p: Math.round(p.points * r.score / 10) / 10, max: p.points, pct: r.score, html: r.html }; }
    const pts = n ? Math.round((p.points * right / n) * 10) / 10 : 0;
    return { p: pts, max: p.points, pct: n ? Math.round((right / n) * 100) : 0, right, n };
  }

  function practicePart(el, t, pk) {
    if (!t.parts[pk]) return App.go("telc/" + t.id);
    const keys = t.blocks.flatMap((b) => b.parts), i = keys.indexOf(pk);
    el.innerHTML = `<button class="back" data-go="telc/${t.id}">‹ ${esc(t.title)}</button>${renderPart(t, pk, true)}
      <div class="row">${i > 0 ? `<button class="btn ghost" data-go="telc/${t.id}/part/${keys[i - 1]}">‹ ${esc(t.parts[keys[i - 1]].title)}</button>` : ""}${i < keys.length - 1 ? `<button class="btn" data-go="telc/${t.id}/part/${keys[i + 1]}">${esc(t.parts[keys[i + 1]].title)} ›</button>` : ""}</div>`;
    bindPart(el, t, pk, true);
  }

  /* ---------------- full exam ---------------- */
  function runExam(el, t) {
    let bi = 0, timer = null, left = 0; const scores = {};
    const start = () => {
      el.innerHTML = `<button class="back" data-go="telc">‹ Mock exams</button><h2 class="page-title">⏱ ${esc(t.title)}</h2>
        <section class="card"><p>The full exam, in order, with the real times: ${t.blocks.map((b) => `<b>${esc(b.title)}</b> ${b.minutes} min`).join(" · ")}.</p>
        <ul class="small"><li>Recordings play only as often as in the exam.</li><li>Answers are checked at the end of each block; you see everything in the results.</li><li>When the time is up, the block is handed in automatically.</li><li>Speaking: record your answers, then rate yourself honestly.</li></ul>
        <label class="chk"><input type="checkbox" class="relax"> Practice mode: no time limit</label>
        <div class="row"><button class="btn sign big-btn go">Start the exam</button></div></section>`;
      el.querySelector(".go").onclick = () => { relaxed = el.querySelector(".relax").checked; block(); };
    };
    let relaxed = false;
    const block = () => {
      const b = t.blocks[bi]; clearInterval(timer); left = b.minutes * 60;
      el.innerHTML = `<div class="exambar"><b>${esc(b.title)}</b><span class="muted small">Block ${bi + 1}/${t.blocks.length}</span><span class="etime">${relaxed ? "no limit" : fmt(left)}</span></div>
        ${b.parts.map((pk) => renderPart(t, pk, false)).join("")}
        <div class="row center"><button class="btn sign big-btn handin">${bi < t.blocks.length - 1 ? "Hand in – next: " + esc(t.blocks[bi + 1].title) : "Hand in – see my result"}</button></div>`;
      b.parts.forEach((pk) => bindPart(el, t, pk, false));
      window.scrollTo(0, 0);
      const tl = el.querySelector(".etime");
      if (!relaxed) timer = setInterval(() => { if (!el.isConnected) return clearInterval(timer); left--; tl.textContent = fmt(left); tl.classList.toggle("low", left < 300); if (left === 300) H.toast("5 minutes left."); if (left <= 0) { clearInterval(timer); H.toast("Time's up – this block is handed in."); handin(); } }, 1000);
      el.querySelector(".handin").onclick = () => { const empty = el.querySelectorAll(".tpart select:not(.gap-s) option:checked[value='']").length; if (left > 0 && !relaxed && empty > 3 && !confirm(`${empty} answers are still empty. Hand in anyway?`)) return; handin(); };
    };
    const handin = () => {
      clearInterval(timer); Speech.stop();
      t.blocks[bi].parts.forEach((pk) => { const sec = el.querySelector(`.tpart[data-pk="${pk}"]`); const r = scorePart(sec, t, pk, false); scores[pk] = { p: r.p, max: r.max }; savePart(t, pk, r.p, r.max); });
      bi++;
      if (bi < t.blocks.length) return block();
      finish();
    };
    const finish = () => {
      const parts = Object.entries(scores);
      const sum = (f) => parts.filter(([pk]) => f(t.parts[pk])).reduce((a, [, x]) => a + x.p, 0);
      const max = (f) => parts.filter(([pk]) => f(t.parts[pk])).reduce((a, [, x]) => a + x.max, 0);
      const oral = (p) => p.skill === "sprechen", written = (p) => !oral(p);
      const W = Math.round(sum(written) * 10) / 10, O = Math.round(sum(oral) * 10) / 10, WM = max(written), OM = max(oral);
      const pass = t.pass.written ? W >= t.pass.written && O >= t.pass.oral : (W + O) / (WM + OM) >= t.pass.percent / 100 && W / WM >= 0.6 && (!OM || O / OM >= 0.6);
      const res = { id: t.id, level: t.level, at: Date.now(), parts: scores, written: W, writtenMax: WM, oral: O, oralMax: OM, pct: Math.round(((W + O) / (WM + OM)) * 100), pass };
      const s = st(); s.telc = (s.telc || []).concat(res).slice(-30); s.exams = [{ date: Date.now(), type: t.title, score: res.pct }].concat(s.exams || []).slice(0, 50); Store.save();
      Store.addXP(res.pass ? 100 : 40);
      App.go(`telc/${t.id}/result/${res.at}`);
      if (res.pass && window.Habit) setTimeout(() => Habit.celebrate(`${t.level} bestanden! (Passed)`, `${res.pct}% in ${t.title}`), 500);
    };
    start();
  }
  const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

  function showResult(el, t, r) {
    if (!r) return App.go("telc/" + t.id);
    const rows = t.blocks.map((b) => { const ps = b.parts.filter((pk) => r.parts[pk]); const p = ps.reduce((a, pk) => a + r.parts[pk].p, 0), m = ps.reduce((a, pk) => a + r.parts[pk].max, 0); return { b, p: Math.round(p * 10) / 10, m, pct: m ? Math.round((p / m) * 100) : 0, ps }; });
    el.innerHTML = `<button class="back" data-go="telc">‹ Mock exams</button><h2 class="page-title">${esc(t.title)} – ${H.bi("Ergebnis", "Result")}</h2>
      <section class="card resbig ${r.pass ? "pass" : "fail"}"><div class="fb-score ${r.pass ? "good" : "low"}">${r.pct}%</div><div><b>${r.pass ? H.bi("Bestanden!", "Passed!") : H.bi("Noch nicht bestanden", "Not passed yet")}</b><br><span class="muted small">${t.pass.written ? `Written ${r.written}/${r.writtenMax} (need ${t.pass.written}) · Oral ${r.oral}/${r.oralMax} (need ${t.pass.oral})` : `Written ${r.written}/${r.writtenMax} · Oral ${r.oral}/${r.oralMax} · need 60%`}</span><br><span class="muted small">${new Date(r.at).toLocaleString()}</span></div></section>
      <section class="card"><h3>By part</h3><div class="skillbars">${rows.map((x) => `<div><span>${esc(x.b.title)}</span><i class="meter" style="--p:${x.pct}%"></i><b class="${x.pct >= 60 ? "good" : "low"}">${x.p}/${x.m}</b></div>`).join("")}</div>
        <ul class="small">${rows.flatMap((x) => x.ps.map((pk) => { const q = r.parts[pk], pct = Math.round((q.p / q.max) * 100); return `<li>${esc(t.parts[pk].title)}: <b class="${pct >= 60 ? "good" : "low"}">${q.p}/${q.max}</b> ${pct < 60 ? `<button class="link" data-go="telc/${t.id}/part/${pk}">practise this part</button>` : ""}</li>`; })).join("")}</ul></section>
      ${V.readinessCard(false, t.level)}
      <div class="row"><button class="btn sign" data-go="telc/${t.id}">Practise parts & see answers</button><button class="btn ghost" data-go="telc/${t.id}/run">Take it again</button></div>`;
  }

  /* ---------------- notebook ---------------- */
  V.notebook = (el, [tab = "all"]) => {
    const xs = Notebook.list().filter((x) => tab === "all" || x.type === tab);
    const cnt = (t) => Notebook.list().filter((x) => x.type === t).length;
    el.innerHTML = `<button class="back" data-go="library">‹ Library</button><h2 class="page-title">⭐ ${H.bi("Mein Notizbuch", "My notebook")}</h2>
      <p class="muted">Tap ☆ next to a word, a rule or a corrected sentence anywhere in the app to keep it here. Saved words are added to your flashcards automatically.</p>
      <nav class="tabs">${[["all", `All ${Notebook.list().length}`], ["word", `Words ${cnt("word")}`], ["rule", `Rules ${cnt("rule")}`], ["sentence", `Sentences ${cnt("sentence")}`]].map(([k, l]) => `<button class="tab ${k === tab ? "on" : ""}" data-go="notebook/${k}">${l}</button>`).join("")}</nav>
      ${cnt("word") ? `<div class="row"><button class="btn sign" data-go="cards/nb:">🃏 Review my saved words</button></div>` : ""}
      ${xs.length ? `<ul class="nblist">${xs.map((x) => `<li><div><b>${x.type === "rule" ? esc(x.de) : UI.colorArticles(x.de)}</b>${x.type !== "rule" ? " " + UI.say(x.de) : ""}${x.en ? `<br><span class="muted small">${esc(x.en)}</span>` : ""}${x.ex ? `<br><i class="small">${esc(x.ex)}</i>` : ""}${x.body ? `<details><summary class="small">show</summary><div class="small">${x.body}</div></details>` : ""}</div><span class="muted small">${esc(x.src || "")}</span><button class="link nb-del" data-id="${x.id}" aria-label="Remove">✕</button></li>`).join("")}</ul>` : UI.empty("Nothing saved here yet. Look for ☆ next to words in texts, in the rules panels and in corrections.")}`;
    el.querySelectorAll(".nb-del").forEach((b) => (b.onclick = () => { Notebook.remove(b.dataset.id); V.notebook(el, [tab]); }));
  };

  /* ---------------- audio-only lessons ---------------- */
  /* hands-free: English → pause (you say it in German) → German → pause (you repeat) → German again */
  V.audio = (el, [src]) => {
    const lv = AI.profile().level;
    const sets = [["lesson", `Today's lesson`, () => (AI.profile().lesson.examples || []).map((e) => [e.en, e.de])],
      ["words", "My due words", () => SRS.due(V.vocabIds()).slice(0, 20).map((id) => V.vocabList().find((w) => w.id === id)).filter((w) => w && w.en).map((w) => [w.en, w.de])],
      ["sentences", `Sentences ${["A1", "A2", "B1", "B2"].includes(lv) ? lv : "B1"}`, () => H.shuffle((DC.sentences || {})[["A1", "A2", "B1", "B2"].includes(lv) ? lv : "B1"] || []).slice(0, 20).map((s) => [s.en, s.de])],
      ["mistakes", "My mistakes", () => (Store.get().mistakes || []).filter((m) => m.answer && /\s/.test(m.answer) && !/<|_/.test(m.answer)).slice(0, 20).map((m) => [String(m.prompt || "").replace(/<[^>]+>/g, "").slice(0, 80), m.answer])]];
    if (!src) {
      el.innerHTML = `<button class="back" data-go="more">‹ More</button><h2 class="page-title">🎧 ${H.bi("Nur hören", "Audio lessons")}</h2>
        <p class="muted">Hands-free practice for walking or commuting: you hear English, say it in German in the pause, then hear the German twice and repeat it. Keep the screen on (or the app open) while it plays.</p>
        <section class="grid2">${sets.map(([k, n, f]) => { const c = k === "sentences" && !DC.sentences ? "" : f().length; return `<button class="tile" data-go="audio/${k}"><b>${esc(n)}</b><span>${c === "" ? "20 sentences" : c + " items"}</span></button>`; }).join("")}</section>
        <section class="card form"><label>Pause to answer <select class="ap">${[3, 5, 8].map((x) => `<option value="${x}" ${(+st().settings.audioPause || 5) === x ? "selected" : ""}>${x} seconds</option>`).join("")}</select></label></section>`;
      el.querySelector(".ap").onchange = (e) => { st().settings.audioPause = +e.target.value; Store.save(); };
      return;
    }
    const go = () => { const set = sets.find((x) => x[0] === src); const items = set ? set[2]() : []; if (!items.length) return (el.innerHTML = UI.empty("Nothing to play here yet.", `<button class="btn" data-go="audio">Back</button>`)); player(el, set[1], items); };
    if (src === "sentences" && !DC.sentences) { el.innerHTML = `<div class="skeleton"><i></i></div>`; App.need(["sentences"]).then(go); } else go();
  };
  function player(el, title, items) {
    let i = 0, on = true, gen = 0; const pause = (+st().settings.audioPause || 5) * 1000;
    el.innerHTML = `<button class="back" data-go="audio">‹ Audio lessons</button><h2 class="page-title">🎧 ${esc(title)}</h2>
      <section class="card audiop"><p class="muted small ap-step"></p><p class="ap-en big"></p><p class="ap-de big" hidden></p><div class="bar"><i></i></div>
      <div class="row center"><button class="btn ghost ap-prev">⏮</button><button class="btn sign ap-play">⏸ Pause</button><button class="btn ghost ap-next">⏭</button></div><p class="muted small center ap-n"></p></section>`;
    const $ = (s) => el.querySelector(s);
    const en = (txt) => new Promise((ok) => { if (!window.speechSynthesis) return setTimeout(ok, 1500); const u = new SpeechSynthesisUtterance(txt); u.lang = "en-GB"; u.rate = 1; u.onend = u.onerror = () => ok(); speechSynthesis.speak(u); });
    const de = (txt) => new Promise((ok) => { Speech.speak(txt); const t0 = Date.now(); const iv = setInterval(() => { if ((!Speech.isPlaying() && Date.now() - t0 > 600) || !el.isConnected) { clearInterval(iv); ok(); } }, 200); });
    const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
    const run = async () => {
      const my = ++gen;
      while (on && i < items.length && el.isConnected && my === gen) {
        const [e, d] = items[i]; $(".ap-n").textContent = `${i + 1} / ${items.length}`; $(".bar i").style.width = (i / items.length) * 100 + "%";
        $(".ap-en").textContent = e; $(".ap-de").hidden = true; $(".ap-de").textContent = d;
        $(".ap-step").textContent = "Listen…"; await en(e); if (my !== gen) return;
        $(".ap-step").textContent = "🗣 Say it in German…"; await wait(pause); if (my !== gen) return;
        $(".ap-de").hidden = false; $(".ap-step").textContent = "German:"; await de(d); if (my !== gen) return;
        $(".ap-step").textContent = "🔁 Repeat…"; await wait(Math.max(2500, d.split(" ").length * 450)); if (my !== gen) return;
        await de(d); if (my !== gen) return; await wait(800);
        i++; if (window.Habit) Habit.track("listen"); Store.addXP(1);
      }
      if (i >= items.length) { $(".ap-step").textContent = "✓ Done!"; $(".bar i").style.width = "100%"; on = false; $(".ap-play").textContent = "↻ Again"; }
    };
    const stop = () => { gen++; Speech.stop(); if (window.speechSynthesis) speechSynthesis.cancel(); };
    $(".ap-play").onclick = () => { if (i >= items.length) { i = 0; on = true; $(".ap-play").textContent = "⏸ Pause"; return run(); } on = !on; $(".ap-play").textContent = on ? "⏸ Pause" : "▶ Play"; if (on) run(); else stop(); };
    $(".ap-next").onclick = () => { stop(); i = Math.min(items.length - 1, i + 1); if (on) run(); };
    $(".ap-prev").onclick = () => { stop(); i = Math.max(0, i - 1); if (on) run(); };
    window.addEventListener("hashchange", stop, { once: true });
    run();
  }

  /* ---------------- dictation ---------------- */
  V.dictation = (el, [lv]) => {
    const level = lv || AI.profile().level;
    const pool = () => H.shuffle(DC.curriculum.filter((l) => l.level === level).flatMap((l) => l.examples || []).filter((e) => e.de.split(" ").length >= 3 && e.de.split(" ").length <= 14));
    if (!lv) {
      el.innerHTML = `<button class="back" data-go="practice">‹ Practice</button><h2 class="page-title">✍️ ${H.bi("Diktat", "Dictation")}</h2><p class="muted">Listen and write exactly what you hear. You see every wrong letter, ending and article – the best way to train Hören and spelling together.</p>
        <section class="grid2">${["A1", "A2", "B1", "B2", "C1"].map((l) => `<button class="tile ${l === level ? "hero" : ""}" data-go="dictation/${l}"><b>${UI.levelDot(l)} ${l}</b><span>10 sentences</span></button>`).join("")}</section>`;
      return;
    }
    const items = pool().slice(0, 10); let i = 0, sum = 0;
    const draw = () => {
      if (i >= items.length) return (el.innerHTML = UI.empty(`✍️ Done – ${Math.round(sum / items.length)}% of the letters right.`, `<div class="row center"><button class="btn sign" data-go="dictation/${level}">Another 10</button><button class="btn ghost" data-go="dictation">Levels</button></div>`));
      const e = items[i];
      el.innerHTML = `<div class="session"><div class="sess-head"><button class="sess-x" data-go="dictation" aria-label="Leave">✕</button><div class="bar"><i style="width:${(i / items.length) * 100}%"></i></div><span>${i + 1}/${items.length}</span></div>
        <div class="row center"><button class="btn sign big-btn d-play">🔊 Play</button><button class="btn ghost d-slow">🐢 Slow</button></div>
        <form class="q-form d-form" autocomplete="off"><textarea class="q-in d-in" rows="2" autocapitalize="sentences" spellcheck="false" placeholder="Write what you hear…"></textarea><button class="btn">Check</button></form><div class="d-fb"></div></div>`;
      const play = (r) => Speech.speak(e.de, r); el.querySelector(".d-play").onclick = () => play(); el.querySelector(".d-slow").onclick = () => play(0.6); setTimeout(() => play(), 300);
      const inp = el.querySelector(".d-in"); inp.focus();
      inp.onkeydown = (ev) => { if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); el.querySelector(".d-form").requestSubmit(); } };
      el.querySelector(".d-form").onsubmit = (ev) => {
        ev.preventDefault(); const given = inp.value.trim(); if (!given) return;
        const r = charDiff(given, e.de); sum += r.pct;
        el.querySelector(".d-fb").innerHTML = `<div class="q ${r.pct >= 95 ? "is-ok" : "is-bad"}"><p class="verdict">${r.pct >= 95 ? "✓ Richtig!" : `${r.pct}% right`}</p><p class="ddiff">${r.html}</p><p class="ex">${UI.colorArticles(e.de)} ${UI.say(e.de)} ${UI.star({ type: "sentence", de: e.de, en: e.en, src: "Dictation" })}</p><p class="muted">${esc(e.en)}</p><div class="row"><button class="btn sm d-next">Next</button></div></div>`;
        el.querySelector(".d-next").onclick = () => { i++; draw(); }; el.querySelector(".d-next").focus();
        Store.topic("dictation", r.pct >= 95); Store.addXP(r.pct >= 95 ? 5 : 2); if (window.Habit) Habit.track("listen");
      };
    };
    draw();
  };
  /* letter-level comparison: green = right, red = wrong/missing, struck = extra */
  function charDiff(given, want) {
    const a = given.replace(/\s+/g, " "), b = want.replace(/\s+/g, " "), n = a.length, m = b.length;
    const D = Array.from({ length: n + 1 }, (_, i) => { const r = new Uint16Array(m + 1); r[0] = i; return r; }); for (let j = 0; j <= m; j++) D[0][j] = j;
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    let i = n, j = m; const out = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) { out.push(a[i - 1] === b[j - 1] ? `<span class="ok">${esc(a[i - 1])}</span>` : `<span class="bad" title="${esc(b[j - 1])}">${esc(b[j - 1])}</span>`); i--; j--; }
      else if (j > 0 && D[i][j] === D[i][j - 1] + 1) { out.push(`<span class="miss">${esc(b[j - 1])}</span>`); j--; }
      else { out.push(`<s>${esc(a[i - 1])}</s>`); i--; }
    }
    return { html: out.reverse().join(""), pct: Math.max(0, Math.round((1 - D[n][m] / Math.max(1, m)) * 100)) };
  }
  V._charDiff = charDiff;

  /* ---------------- story mode: choose what to say ---------------- */
  V.story = (el, [id]) => {
    const D = DC.dialogues || {}, ids = Object.keys(D).filter((k) => k !== "free");
    if (!id) {
      el.innerHTML = `<button class="back" data-go="practice">‹ Practice</button><h2 class="page-title">📖 ${H.bi("Geschichten", "Stories")}</h2><p class="muted">A conversation in small steps: listen to your partner and choose the answer that fits. Then say it out loud.</p>
        <section class="grid2 menu">${ids.map((k) => { const sc = (window.Views && Views._scene && Views._scene(k)) || { icon: "💬", title: k, lv: "" }; return `<button class="tile" data-go="story/${k}"><span class="ti">${sc.icon}</span><b>${esc(sc.title)}</b><span>${sc.lv || ""}</span></button>`; }).join("")}</section>`;
      return;
    }
    const steps = D[id]; if (!steps) return App.go("story");
    const others = ids.filter((k) => k !== id).flatMap((k) => D[k].flatMap((s) => s.ideas || []));
    let k = 0, right = 0;
    const sc = (Views._scene && Views._scene(id)) || { icon: "💬", title: id };
    el.innerHTML = `<button class="back" data-go="story">‹ Stories</button><h2 class="page-title">${sc.icon} ${esc(sc.title)}</h2><div class="chat story"></div><div class="st-opts"></div>`;
    const chat = el.querySelector(".story"), box = el.querySelector(".st-opts");
    const say = (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ block: "end", behavior: "smooth" }); };
    const step = () => {
      if (k >= steps.length) { box.innerHTML = `<div class="q is-ok"><p class="verdict">✓ ${right}/${steps.length} at the first try</p><div class="row"><button class="btn sign" data-go="story/${id}">Again</button><button class="btn ghost" data-go="partner/${id}/guided">Now talk freely (guided partner)</button></div></div>`; Store.addXP(10); return; }
      const s = steps[k]; say("assistant", `<p lang="de">${esc(s.de)} ${UI.say(s.de)} ${UI.hint(s.de)}</p>`); Speech.speak(s.de);
      const good = H.pick(s.ideas || ["Ja."]); const opts = H.shuffle([good].concat(H.shuffle(others).slice(0, 2)));
      let first = true;
      box.innerHTML = `<p class="muted small">What do you answer?</p><div class="choices col">${opts.map((o) => `<button class="choice" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
      box.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
        if (b.dataset.v !== good) { b.classList.add("bad"); b.disabled = true; first = false; H.toast("That doesn't answer the question – try another one."); return; }
        if (first) right++; Store.topic("story", first);
        say("user", `<p>${esc(good)} ${UI.say(good)}</p>`); Speech.speak(good); k++; box.innerHTML = ""; setTimeout(step, 1100);
      }));
    };
    step();
  };

  /* ---------------- declension of nouns ---------------- */
  const CASES = [["nom", "Nominativ"], ["akk", "Akkusativ"], ["dat", "Dativ"], ["gen", "Genitiv"]];
  /* plural from the word list's notation: "die Tische", "-e", "¨e", "¨", "-" (same as singular) */
  V.pluralOf = (bare, pl) => {
    pl = String(pl || "").trim().split(/\s*[/,]\s*/)[0].replace(/^die\s+/, "");
    if (!pl) return "";
    const uml = (w) => w.replace(/(au|a|o|u)(?=[^aeiouäöü]*(e[lnr]?|chen|lein)?$)/i, (m) => ({ au: "äu", a: "ä", o: "ö", u: "ü", Au: "Äu", A: "Ä", O: "Ö", U: "Ü" }[m] || m));
    if (pl === "-") return bare;
    if (/^-[a-zäöüß]+$/.test(pl)) return bare + pl.slice(1);
    if (/^¨/.test(pl)) return uml(bare) + pl.slice(1).replace(/^-/, "");
    if (/^[A-ZÄÖÜ]/.test(pl)) return pl;
    return "";
  };
  V.declineHtml = (raw) => {
    const key = raw.replace(/^(der|die|das)\s+/i, "").toLowerCase();
    let w = DC.vocab.find((x) => x.type === "noun" && x.art && x.de.replace(/^(der|die|das)\s+/, "").toLowerCase() === key);
    if (!w) { const e = (Engine.NOUNS || []).find((x) => x.de.toLowerCase() === key); if (e) w = { de: { m: "der", f: "die", n: "das" }[e.g] + " " + e.de, art: { m: "der", f: "die", n: "das" }[e.g], pl: e.pl || "" }; }
    if (!w) return "";
    const bare = w.de.replace(/^(der|die|das)\s+/, ""), g = { der: "m", die: "f", das: "n" }[w.art];
    const pl = V.pluralOf(bare, w.pl);
    const weak = g === "m" && (/(e|ent|ant|ist|oge|at|af)$/.test(bare) && !/(Käse|Charme)$/.test(bare));
    const n = { de: bare, g, pl: pl && pl !== "–" && pl !== "-" ? pl : "" };
    if (weak) n.wf = bare === "Herr" ? "Herrn" : /e$/.test(bare) ? bare + "n" : bare + "en";
    const gen = n.wf ? (bare === "Name" ? "Namens" : n.wf) : null;
    const row = (c, kind) => { let s = Engine.np(n, c, kind); if (c === "gen" && gen) s = s.replace(/\S+$/, gen); return s; };
    return `<table class="mini decl"><tr><th></th><th>Singular</th><th>Singular (ein/kein)</th>${n.pl ? "<th>Plural</th>" : ""}</tr>${CASES.map(([c, name]) => `<tr><td>${name}</td><td><b>${esc(row(c, "def"))}</b></td><td>${esc(row(c, "indef"))}</td>${n.pl ? `<td>${esc(Engine.np(n, c, "def", true))}</td>` : ""}</tr>`).join("")}</table>${weak ? `<p class="small muted">n-Deklination: masculine nouns like this take -(e)n outside the Nominativ.</p>` : ""}`;
  };
  V.decline = (el) => {
    el.innerHTML = `<button class="back" data-go="library">‹ Library</button><h2 class="page-title">${H.bi("Deklination", "Declension")}</h2><p class="muted">Any noun from the word list in all four cases, with article, ein/kein and plural.</p>
      <input class="search" type="search" placeholder="Type a noun (e.g. Tisch, Student, Frau)"><div class="dout"></div>`;
    const q = el.querySelector(".search"), out = el.querySelector(".dout");
    q.oninput = () => { const t = q.value.trim(); if (t.length < 2) return (out.innerHTML = ""); const lo = t.toLowerCase().replace(/^(der|die|das)\s+/, ""), bare = (x) => x.de.replace(/^(der|die|das)\s+/, "").toLowerCase();
      const eng = (Engine.NOUNS || []).filter((x) => x.de.toLowerCase().startsWith(lo)).map((x) => ({ de: { m: "der", f: "die", n: "das" }[x.g] + " " + x.de, en: x.en, art: 1, type: "noun" }));
      const seen = new Set(); const hits = DC.vocab.filter((x) => x.type === "noun" && x.art && bare(x).startsWith(lo)).concat(eng).filter((x) => !seen.has(bare(x)) && seen.add(bare(x))).sort((a, b) => (bare(a) === lo ? -1 : 0) - (bare(b) === lo ? -1 : 0) || bare(a).length - bare(b).length).slice(0, 4); out.innerHTML = hits.length ? hits.map((h) => `<section class="card"><h3>${UI.colorArticles(h.de)} ${UI.say(h.de)} ${UI.star({ type: "word", de: h.de, en: h.en, src: "Declension" })} <span class="muted small">${esc(h.en)}</span></h3>${V.declineHtml(h.de)}</section>`).join("") : `<p class="muted">No noun found.</p>`; };
  };

  /* ---------------- watch: video courses per level ---------------- */
  V.watch = (el) => {
    const VID = [["A1–A2", [["DW Nicos Weg A1", "https://learngerman.dw.com/en/beginners/c-36519789", "Video course with exercises"], ["Easy German (YouTube)", "https://www.youtube.com/@EasyGerman", "Street interviews with subtitles"]]],
      ["A2–B1", [["DW Nicos Weg A2 / B1", "https://learngerman.dw.com/en/overview", "Continue the story, with exercises"], ["Deutsch mit Marija", "https://www.youtube.com/@deutschmitmarija", "Grammar and exam tips"]]],
      ["B1–C1", [["nachrichtenleicht", "https://www.nachrichtenleicht.de/", "News in easy German"], ["Tagesschau in 100 Sekunden", "https://www.tagesschau.de/multimedia/sendung/tagesschau_in_100_sekunden", "Real news, short"], ["Easy German Podcast", "https://www.easygerman.fm/", "Natural conversations"]]]];
    el.innerHTML = `<button class="back" data-go="library">‹ Library</button><h2 class="page-title">📺 ${H.bi("Videos & Podcasts", "Watch & listen")}</h2><p class="muted">10 minutes of real German a day makes the rules stick. Pick one at your level.</p>
      ${VID.map(([lv, xs]) => `<section class="card"><h3>${lv}</h3><div class="tlinks">${xs.map(([n, u, d]) => `<button class="tlink" data-url="${u}"><b>${esc(n)} ↗</b><span>${esc(d)}</span></button>`).join("")}</div></section>`).join("")}
      <section class="card"><h3>Speak with a teacher</h3><p class="muted small">A few live lessons before the exam help a lot with Sprechen.</p><div class="tlinks"><button class="tlink" data-url="https://preply.com/en/online/german-tutors"><b>Preply ↗</b><span>1-on-1 German tutors</span></button><button class="tlink" data-url="https://www.italki.com/en/teachers/german"><b>italki ↗</b><span>Tutors and community teachers</span></button></div></section>`;
  };
})();
