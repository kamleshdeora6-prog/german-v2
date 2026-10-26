/* Deutsch Coach – shared UI components */
(function () {
  "use strict";
  const { esc, md } = H;
  const UI = {};

  UI.say = (text, label = "") => `<button class="say" data-tts="${esc(text)}" aria-label="Listen">🔊${label ? " " + label : ""}</button>`;
  UI.table = (rows, cls = "") => {
    if (!rows || !rows.length) return "";
    const [head, ...body] = rows;
    return `<div class="tablewrap" tabindex="0" role="region" aria-label="Table"><table class="gt ${cls}"><thead><tr>${head.map((c) => `<th>${md(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${md(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  };
  UI.levelDot = (lvl) => `<span class="lvl lvl-${lvl}">${lvl}</span>`;
  UI.empty = (msg, btn) => `<div class="empty"><p>${msg}</p>${btn || ""}</div>`;
  UI.colorArticles = (s) => esc(s).replace(/\b(der|die|das)\b(\s+[A-ZÄÖÜ])/g, (m, a, rest) => `<span class="g-${{ der: "m", die: "f", das: "n" }[a]}">${a}</span>${rest}`);

  /* ---------- exercise item ----------
     item: {kind: choice|input|order, prompt, answer, options, tokens, why, whyNot, full, en, hint, accept}
     opts: {onDone(ok, given), compact} */
  UI.reportBtn = (ctx) => `<button class="rflag" type="button" title="Report a problem" aria-label="Report a problem with this question" data-report="${esc(JSON.stringify(ctx))}">⚑</button>`;
  const itemCtx = (item, given) => ({ id: item.gen ? `${item.gen}` : undefined, lesson: item.lesson || undefined, part: item.title || item.topic, q: item.prompt, a: item.answer, accept: (item.accept || []).slice(0, 6), given });
  UI.item = (el, item, opts = {}) => {
    const st = Store.get().settings;
    let answered = false;
    const promptHtml = `<div class="q-prompt">${item.prompt}</div>${item.hint ? `<div class="q-hint">${esc(item.hint)}</div>` : ""}`;
    let body = "";
    if (item.kind === "choice") body = `<div class="choices">${item.options.map((o) => `<button class="choice" data-v="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    else if (item.kind === "input") body = `<form class="q-form" autocomplete="off"><input class="q-in" type="text" autocapitalize="off" spellcheck="false" placeholder="Type your answer" aria-label="Answer"><button class="btn" type="submit">Check</button></form>${UI.umlautBar()}`;
    else if (item.kind === "order") body = `<div class="built" aria-live="polite">${item.fixedFirst ? `<span class="tok fixed">${esc(item.fixedFirst)}</span>` : ""}</div><div class="bank">${bankTokens(item).map((t, i) => `<button class="tok" data-i="${i}">${esc(t)}</button>`).join("")}</div><div class="row"><button class="btn q-check">Check</button><button class="btn ghost q-reset">Reset</button></div>`;
    el.innerHTML = `<div class="q ${opts.compact ? "compact" : ""}">${UI.reportBtn(itemCtx(item))}${promptHtml}${body}<div class="q-fb" hidden></div></div>`;
    const fb = el.querySelector(".q-fb");

    function finish(ok, given, gradeInfo = {}) {
      if (answered) return; answered = true;
      el.querySelector(".q").classList.add(ok ? "is-ok" : "is-bad");
      const whyNot = !ok && item.whyNot && item.whyNot[given] ? `<p class="whynot"><b>Why not „${esc(given)}“?</b> ${item.whyNot[given]}</p>` : "";
      const full = item.full || (item.kind === "order" ? item.answer : "");
      fb.hidden = false;
      fb.innerHTML = `<p class="verdict">${ok ? "✓ Richtig!" : "✗ Not quite."} ${gradeInfo.note ? `<span class="muted">${esc(gradeInfo.note)}</span>` : ""}</p>
        ${ok ? "" : `<p>Answer: <b>${esc(item.answer)}</b></p>`}
        ${whyNot}
        ${item.why ? `<div class="why"><b>Why:</b> ${item.why}</div>` : ""}
        ${full ? `<p class="ex">${UI.colorArticles(full)} ${UI.say(full)}</p>` : ""}
        ${item.en && st.showEn ? `<p class="muted">${esc(item.en)}</p>` : ""}
        <div class="row">${!ok && item.kind !== "choice" ? `<button class="btn ghost sm q-override">I was right</button>` : ""}<button class="btn sm q-next">${opts.nextLabel || "Next"}</button><button class="btn ghost sm q-ask">Ask Max</button>${UI.reportBtn(itemCtx(item, given)).replace('class="rflag"', 'class="btn ghost sm rflag inline"').replace(">⚑<", ">⚑ Report<")}</div>`;
      Store.topic(item.gen, ok);
      if (!ok) Store.mistake({ prompt: item.prompt, answer: item.answer, given, gen: item.gen, why: item.why });
      const cb = window.Habit ? Habit.answer(ok) : { combo: 0, bonus: 0 };
      Store.addXP((ok ? 10 : 2) + cb.bonus);
      if (cb.combo >= 3) fb.insertAdjacentHTML("afterbegin", `<p class="combo" aria-live="polite">🔥 ${cb.combo} in a row${cb.bonus ? ` · +${cb.bonus} bonus XP` : ""}</p>`);
      if (full && ok) Speech.speak(full);
      fb.querySelector(".q-next").onclick = () => opts.onNext && opts.onNext(ok);
      if (ok && item.orders && item.orders.length > 1) {
        const left = item.orders.filter((o) => Grade.clean(o) !== Grade.clean(given));
        fb.insertAdjacentHTML("afterbegin", `<p class="multi">German allows <b>${item.orders.length}</b> correct orders here. <button class="link show-orders">Show them all</button></p>`);
        fb.querySelector(".show-orders").onclick = (e) => { e.target.outerHTML = `<ul class="orders">${item.orders.map((o) => `<li>${esc(o)} ${UI.say(o)}</li>`).join("")}</ul>`; };
        const again = document.createElement("button");
        again.className = "btn sm ghost"; again.textContent = "Try another correct order";
        fb.querySelector(".row").prepend(again);
        again.onclick = () => UI.item(el, Object.assign({}, item, { answer: left[0], accept: left.slice(1), orders: left, prompt: item.prompt + " <i>(a different order this time)</i>" }), opts);
      }
      const ov = fb.querySelector(".q-override");
      if (ov) ov.onclick = () => { Store.topic(item.gen, true); Store.addXP(8); el.querySelector(".q").classList.replace("is-bad", "is-ok"); ov.remove(); fb.querySelector(".verdict").textContent = "✓ Counted as correct."; opts.onOverride && opts.onOverride(); };
      fb.querySelector(".q-ask").onclick = () => App.askMax(`${given ? `I answered „${given}“. ` : ""}Why is it „${String(item.answer)}“? ${String(item.prompt).replace(/<[^>]+>/g, "")}`);
      opts.onDone && opts.onDone(ok, given);
      fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    if (item.kind === "choice") {
      el.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
        if (answered) return;
        const v = b.dataset.v; const ok = v === item.answer;
        el.querySelectorAll(".choice").forEach((x) => { x.disabled = true; if (x.dataset.v === item.answer) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        finish(ok, v);
      }));
    } else if (item.kind === "input") {
      const inp = el.querySelector(".q-in");
      UI.bindUmlauts(el, inp);
      if (!opts.noFocus) setTimeout(() => inp.focus({ preventScroll: true }), 50);
      el.querySelector("form").onsubmit = (e) => {
        e.preventDefault(); if (answered) return;
        const g = Grade.grade(inp.value, item.answer, item.accept);
        if (g.level === "empty") return inp.focus();
        inp.disabled = true;
        finish(g.ok, inp.value.trim(), g);
      };
    } else {
      const built = el.querySelector(".built"), bank = el.querySelector(".bank");
      const move = (b) => { if (answered) return; (b.parentElement === bank ? built : bank).appendChild(b); };
      bank.querySelectorAll(".tok").forEach((b) => (b.onclick = () => move(b)));
      el.querySelector(".q-reset").onclick = () => built.querySelectorAll(".tok:not(.fixed)").forEach((b) => bank.appendChild(b));
      el.querySelector(".q-check").onclick = () => {
        const words = Array.from(built.querySelectorAll(".tok")).map((b) => b.textContent);
        if (bank.children.length) return H.toast("Use all the words first.");
        const given = words.join(" ");
        const clean = (s) => Grade.clean(s);
        const ok = clean(given) === clean(item.answer) || (item.accept || []).some((a) => clean(a) === clean(given));
        finish(ok, given);
      };
    }
    return { finish };
  };
  /* The words the learner has to place: the answer minus the fixed opening (which is shown already).
     Derived from the answer itself so repeated words (du … du, heute … heute) can never go missing. */
  function bankTokens(item) {
    const words = String(item.answer).replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);
    const skip = item.fixedFirst ? String(item.fixedFirst).split(/\s+/).filter(Boolean).length : 0;
    return Engine.R.shuffle(words.slice(skip));
  }

  /* external dictionaries – opened in the system browser (also from inside the APK) */
  UI.dictLinks = (word) => {
    const w = encodeURIComponent(String(word).replace(/^(der|die|das)\s+/i, "").trim());
    const links = [["Linguee", `https://www.linguee.com/german-english/search?query=${w}`], ["DeepL", `https://www.deepl.com/translator#de/en/${w}`], ["dict.cc", `https://www.dict.cc/?s=${w}`], ["LEO", `https://dict.leo.org/englisch-deutsch/${w}`], ["Duden", `https://www.duden.de/suchen/dudenonline/${w}`], ["Wiktionary", `https://de.wiktionary.org/wiki/${w}`]];
    return `<span class="dictlinks">${links.map(([n, u]) => `<button class="chip ext" data-url="${u}">${n} ↗</button>`).join("")}</span>`;
  };
  UI.umlautBar = () => `<div class="umlauts" aria-label="Special letters">${["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map((c) => `<button type="button" class="uml" data-c="${c}">${c}</button>`).join("")}</div>`;
  UI.bindUmlauts = (root, input) => {
    root.querySelectorAll(".uml").forEach((b) => (b.onmousedown = (e) => e.preventDefault(), b.onclick = () => {
      const el = input || document.activeElement; if (!el || el.disabled) return;
      const s = el.selectionStart ?? el.value.length, e2 = el.selectionEnd ?? el.value.length;
      el.value = el.value.slice(0, s) + b.dataset.c + el.value.slice(e2); el.focus(); el.setSelectionRange(s + 1, s + 1);
    }));
  };

  /* ---------- mic ---------- */
  UI.mic = (label = "Speak") => `<button class="btn mic" ${Speech.canListen() ? "" : "disabled title='Not supported here'"}>🎙️ ${label}</button>`;
  UI.bindMic = (root, onText) => {
    const b = root.querySelector(".mic"); if (!b) return;
    b.onclick = async () => {
      if (b.classList.contains("rec")) return;
      Speech.stop();
      b.classList.add("rec"); const old = b.innerHTML; b.innerHTML = "● Listening…";
      try { const t = await Speech.listen(); onText(t); }
      catch (e) { H.toast(e.message, "bad"); }
      finally { b.classList.remove("rec"); b.innerHTML = old; }
    };
  };

  /* ---------- simple session runner for a list of item factories ---------- */
  UI.session = (el, nextItem, { total = 10, title = "", onEnd } = {}) => {
    let i = 0, right = 0, xp0 = Store.get().xp;
    const wrap = document.createElement("div");
    el.innerHTML = `<div class="session"><div class="sess-head"><button class="sess-x" data-go="practice" aria-label="Leave">✕</button><div class="bar"><i></i></div><span class="sess-count"></span></div><div class="sess-title muted small">${title}</div><div class="sess-body"></div></div>`;
    const body = el.querySelector(".sess-body"), cnt = el.querySelector(".sess-count"), bar = el.querySelector(".bar i");
    if (window.Habit) Habit.resetCombo();
    function step() {
      if (i >= total) {
        const pct = Math.round((right / total) * 100), gained = Store.get().xp - xp0;
        bar.style.width = "100%"; cnt.textContent = "";
        if (window.Habit && pct >= 90) Habit.track("perfect");
        const st = Store.get(), goal = st.settings.goal || 50, todayXP = st.days[Store.today()] || 0;
        const nx = window.Habit ? Habit.next() : null;
        body.innerHTML = `<div class="result summary arming">
          <div class="sum-head">${pct >= 90 ? H.bi("Ausgezeichnet!", "Excellent!") : pct >= 70 ? H.bi("Sehr gut!", "Very good!") : pct >= 50 ? H.bi("Gut gemacht!", "Well done!") : H.bi("Weiter üben!", "Keep practising!")}</div>
          <div class="sum-grid">
            <div class="sum-tile xp"><b>+${gained}</b><span>XP</span></div>
            <div class="sum-tile acc"><b>${pct}%</b><span>${right}/${total} right</span></div>
            <div class="sum-tile cmb"><b>${window.Habit ? Habit.bestCombo() : 0}</b><span>best combo</span></div>
          </div>
          ${window.Habit ? `<div class="sum-goal">${Habit.ring(Math.round((todayXP / goal) * 100), 72, 8, `<b>${Math.min(999, Math.round((todayXP / goal) * 100))}%</b>`)}<div><b>Daily goal</b><br><span class="muted">${todayXP} / ${goal} XP today</span></div></div>` : ""}
          <p class="muted small">${pct >= 80 ? "Strong round – these topics will come back less often." : "The ones you missed are saved under “My mistakes” and will come back."}</p>
          <div class="col">${nx ? `<button class="btn sign big-btn" data-go="${nx.go}">Next: ${H.esc(nx.label)}</button>` : ""}<div class="row center"><button class="btn ghost again">Another round</button><button class="btn ghost" data-go="home">Done for now</button></div></div></div>`;
        setTimeout(() => { const sm = body.querySelector(".summary"); if (sm) sm.classList.remove("arming"); }, 700);   // a double-tap on the last “Next” must not skip the summary
        body.querySelector(".again").onclick = () => { i = 0; right = 0; xp0 = Store.get().xp; if (window.Habit) Habit.resetCombo(); step(); };
        onEnd && onEnd(right, total);
        if (window.Habit) Habit.flush();
        return;
      }
      cnt.textContent = `${i + 1} / ${total}`; bar.style.width = (i / total) * 100 + "%";
      const it = nextItem(i);
      if (!it) { body.innerHTML = UI.empty("No questions available for this selection."); return; }
      UI.item(body, it, { onDone: (ok) => { if (ok) right++; bar.style.width = ((i + 1) / total) * 100 + "%"; }, onOverride: () => right++, onNext: () => { i++; step(); } });
    }
    step();
    return wrap;
  };


  /* ---------- audio player bar: appears whenever something longer than a word is being read aloud ---------- */
  UI.mountPlayer = () => {
    if (document.querySelector(".player")) return;
    const bar = document.createElement("div"); bar.className = "player"; bar.hidden = true; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Audio player");
    bar.innerHTML = `<div class="pl-text" aria-live="off"></div><div class="pl-ctrl">
      <button class="pl-b pl-back" aria-label="Back: replay this sentence (tap twice for the previous one)" title="Back">⏮</button>
      <button class="pl-b pl-play" aria-label="Pause">⏸</button>
      <button class="pl-b pl-next" aria-label="Skip to the next sentence" title="Next">⏭</button>
      <button class="pl-b pl-rate" aria-label="Speed">0.9×</button>
      <span class="pl-pos"></span>
      <button class="pl-b pl-stop" aria-label="Stop" title="Stop">■</button></div><div class="pl-prog"><i></i></div>`;
    document.body.appendChild(bar);
    const $ = (c) => bar.querySelector(c);
    $(".pl-back").onclick = () => Speech.back();
    $(".pl-next").onclick = () => Speech.next();
    $(".pl-stop").onclick = () => Speech.stop();
    $(".pl-play").onclick = () => { const st = Speech.status(); if (st.state === "playing") Speech.pause(); else if (st.state === "paused") Speech.resume(); else Speech.back(); };
    const RATES = [0.6, 0.75, 0.9, 1.0, 1.15];
    $(".pl-rate").onclick = () => { const r = Speech.status().rate; const nx = RATES.find((x) => x > r + 0.01) || RATES[0]; Speech.setRate(nx); };
    Speech.onChange((st) => {
      const show = st.state !== "idle" && (st.n > 1 || st.text.length > 40);
      bar.hidden = !show; document.body.classList.toggle("has-player", show);
      document.querySelectorAll("[data-tts].playing,[data-tts].paused").forEach((b) => b.classList.remove("playing", "paused"));
      if (st.state !== "idle") document.querySelectorAll("[data-tts]").forEach((b) => { if (b.dataset.tts === st.key) b.classList.add(st.state); });
      if (!show) return;
      bar.classList.toggle("locked", !!st.locked);
      $(".pl-text").textContent = st.text;
      $(".pl-play").textContent = st.state === "playing" ? "⏸" : "▶"; $(".pl-play").setAttribute("aria-label", st.state === "playing" ? "Pause" : "Play");
      $(".pl-rate").textContent = (Math.round(st.rate * 100) / 100) + "×";
      $(".pl-pos").textContent = st.n > 1 ? `${Math.min(st.i + 1, st.n)} / ${st.n}` : "";
      bar.querySelector(".pl-prog i").style.width = st.n ? (Math.min(st.i + (st.state === "paused" ? 0 : 0.5), st.n) / st.n) * 100 + "%" : "0";
    });
  };

  /* 🇬🇧 under a German question: word-by-word meanings for learners who can't read it yet */
  UI.hint = (text) => `<button type="button" class="hintbtn" data-gloss="${H.esc(String(text).replace(/__|\*\*/g, ""))}" title="What does this mean? (word by word)" aria-label="Show English word by word">EN?</button>`;
  window.UI = UI;
})();
