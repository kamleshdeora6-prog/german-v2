/* Deutsch Coach – AI tutor screens.
   #/partner            pick a role-play (or the current lesson's topic)
   #/partner/<id>       talk: speak or type, the partner answers in German at your level, corrects real
                        mistakes, and at the end gives a summary; your mistakes and new words are saved.
   #/practice/ai        10 new exercises built from your own mistakes (every sentence checked by Max first) */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});

  const SCENES = [
    { id: "lesson", icon: "📘", title: "Today's lesson topic", lv: "A1", role: "", ideas: ["Ich finde das interessant, weil …", "Bei mir ist das anders: …", "Kannst du das bitte wiederholen?"] },
    { id: "intro", icon: "👋", title: "Getting to know someone", lv: "A1", role: "a friendly neighbour who just met the learner in the stairwell and wants to know their name, origin, job and hobbies", ideas: ["Ich heiße … und komme aus …", "Ich bin … von Beruf.", "In meiner Freizeit … ich gern …", "Und du? Woher kommst du?"] },
    { id: "cafe", icon: "☕", title: "Ordering in a café", lv: "A1", role: "a waiter in a Berlin café; take the order, mention one or two specials, tell the price at the end", ideas: ["Ich hätte gern einen Kaffee, bitte.", "Was kostet der Kuchen?", "Mit Milch, bitte.", "Die Rechnung, bitte."] },
    { id: "shop", icon: "🛒", title: "At the supermarket", lv: "A1", role: "a shop assistant; the learner is looking for products and asks where things are and what they cost", ideas: ["Entschuldigung, wo finde ich …?", "Haben Sie auch …?", "Was kostet das?", "Ich nehme zwei, bitte."] },
    { id: "way", icon: "🗺️", title: "Asking the way", lv: "A2", role: "a passer-by at the station who gives directions with links, rechts, geradeaus and prepositions", ideas: ["Entschuldigung, wie komme ich zum Bahnhof?", "Ist das weit von hier?", "Also geradeaus und dann links?", "Vielen Dank!"] },
    { id: "doctor", icon: "🩺", title: "At the doctor's", lv: "A2", role: "a receptionist and then a doctor; ask about symptoms, give an appointment and simple advice", ideas: ["Ich habe seit zwei Tagen Kopfschmerzen.", "Ich brauche einen Termin.", "Muss ich Tabletten nehmen?", "Wie oft am Tag?"] },
    { id: "flat", icon: "🏠", title: "Viewing a flat", lv: "A2", role: "a landlord showing a flat; talk about rooms, rent, Nebenkosten and when the learner can move in", ideas: ["Wie hoch ist die Miete?", "Sind die Nebenkosten inklusive?", "Ab wann ist die Wohnung frei?", "Darf ich Haustiere haben?"] },
    { id: "weekend", icon: "🎉", title: "Talking about the weekend", lv: "A2", role: "a colleague on Monday morning asking what the learner did at the weekend (Perfekt) and sharing your own", ideas: ["Am Samstag habe ich … gemacht.", "Ich bin nach … gefahren.", "Es war sehr schön!", "Und was hast du gemacht?"] },
    { id: "plan", icon: "📅", title: "Planning something together", lv: "B1", role: "a classmate planning a birthday party with the learner (Goethe B1 'gemeinsam planen'): suggest, react, find compromises", ideas: ["Wie wäre es mit …?", "Gute Idee, aber …", "Ich kann … mitbringen.", "Also, wir machen …"] },
    { id: "job", icon: "💼", title: "Job interview", lv: "B1", role: "an HR manager in a job interview: experience, strengths, why this job, questions about the company", ideas: ["Ich habe drei Jahre als … gearbeitet.", "Meine Stärke ist …", "Ich möchte bei Ihnen arbeiten, weil …", "Ich habe eine Frage: …"] },
    { id: "office", icon: "🏛️", title: "At the Bürgeramt", lv: "B1", role: "a clerk at the Bürgeramt; the learner wants to register an address and must ask politely what documents are needed", ideas: ["Ich möchte mich anmelden.", "Welche Unterlagen brauche ich?", "Können Sie mir sagen, wo …?", "Brauche ich einen Termin?"] },
    { id: "debate", icon: "⚖️", title: "Discussion: an opinion", lv: "B2", role: "a discussion partner who takes the opposite view on a current topic (home office, cars in the city, social media) and asks for arguments", ideas: ["Meiner Meinung nach …", "Da bin ich anderer Meinung, weil …", "Einerseits …, andererseits …", "Das stimmt, aber …"] },
    { id: "free", icon: "💬", title: "Free conversation", lv: "A1", role: "a curious German friend; talk about whatever the learner wants, keep the conversation going", ideas: ["Heute habe ich …", "Ich interessiere mich für …", "Was machst du gern?", "Erzähl mal, wie war dein Tag?"] },
  ];
  const LV = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const sceneFor = (id) => {
    const sc = SCENES.find((x) => x.id === id); if (!sc) return null;
    if (sc.id !== "lesson") return sc;
    const l = AI.profile().lesson;
    return Object.assign({}, sc, { title: `Lesson ${l.pos}: ${H.ltText(l, "theme")}`, role: `a friendly German speaker talking with the learner about "${l.theme}" so that they practise "${l.title}" (${(l.en && l.en.title) || ""}). Use that grammar naturally in your questions.` });
  };

  function noKey(el, what) {
    const local = AI.local(), can = window.LLM && LLM.supported();
    el.innerHTML = `<button class="back" data-go="more">‹ More</button><h2 class="page-title">${what}</h2>
      <section class="card"><p><b>${esc(AI.why())}</b></p>
      ${local && can ? `<p>The AI partner runs <b>on this device</b> – free, no account, and offline after a one-time download (${esc(LLM.current().size)}).</p><div class="row"><button class="btn sign" data-go="settings">Download it in Settings</button></div>`
        : local ? `<p>The on-device AI needs a browser with <b>WebGPU</b>: current Chrome or Edge on a PC or Mac, or Chrome on a newer Android phone. Open the app's website there (not the Android app).</p>`
        : `<p>You chose Claude (online). Add your Anthropic API key in Settings, or switch to the free on-device AI.</p><div class="row"><button class="btn sign" data-go="settings">Open Settings</button></div>`}
      <p class="muted small">Everything else in the app keeps working offline – Max, the exercises and all feedback.</p></section>`;
  }

  /* ---------------- speaking partner ---------------- */
  V.partner = (el, [id]) => {
    if (!AI.ready()) return noKey(el, "Speaking partner");
    if (!id) {
      const my = AI.profile().level, mi = LV.indexOf(my);
      // warm the model up while the learner picks a scenario (it takes a few seconds)
      if (AI.local() && !LLM.isLoaded()) setTimeout(() => LLM.load().catch(() => {}), 300);
      el.innerHTML = `<button class="back" data-go="more">‹ More</button><h2 class="page-title">${H.bi("Sprechpartner", "Speaking partner")}</h2>
        <p class="muted">Talk in German at your level (${my}) – ${AI.local() ? "with a small AI on this device (free, offline). Its German is simple and can have small slips; your mistakes are corrected by Max's checked rules." : "with Claude (online)."} Speak or type; your partner answers out loud, corrects real mistakes, and gives you feedback at the end. ${ASR.active() ? "Speech is recognised offline on this device." : ""}</p>
        <section class="grid2 menu">${SCENES.map((s) => { const hard = LV.indexOf(s.lv) > mi + 1; return `<button class="tile" data-go="partner/${s.id}"><span class="ti">${s.icon}</span><b>${esc(s.id === "lesson" ? sceneFor("lesson").title : s.title)}</b><span>${s.lv}+${hard ? " · challenging" : ""}</span></button>`; }).join("")}</section>`;
      return;
    }
    const sc = sceneFor(id); if (!sc) return App.go("partner");
    if (AI.local() && !LLM.isLoaded()) {
      el.innerHTML = `<button class="back" data-go="partner">‹ Scenarios</button><h2 class="page-title">${sc.icon} ${esc(sc.title)}</h2>
        <section class="card"><p>⏳ Starting the AI on this device… The first start after opening the app takes 10–60 seconds.</p><div class="pbar"><span class="lp" style="width:2%"></span></div><p class="muted small lpt"></p></section>`;
      const off = LLM.onProgress((pr) => { const b = el.querySelector(".lp"); if (b) b.style.width = Math.round((pr.progress || 0) * 100) + "%"; const t = el.querySelector(".lpt"); if (t) t.textContent = String(pr.text || "").slice(0, 120); });
      LLM.load().then(() => { off(); if (document.body.contains(el)) V.partner(el, [id]); }).catch((e) => { off(); el.querySelector(".card").innerHTML = `<p>⚠️ ${esc(e.message)}</p><div class="row"><button class="btn sign" data-go="partner/${esc(id)}">Try again</button><button class="btn ghost" data-go="settings">Settings</button></div>`; });
      return;
    }
    const hist = []; let busy = false, turns = 0, helps = 0;
    const EN = /\b(the|is|are|and|i|you|my|have|with|this|that|what|don't|i'm|it's|because|like)\b/gi;
    const english = (t) => { const w = t.split(/\s+/).length; return w >= 3 && (t.match(EN) || []).length / w > 0.25 && !/[äöüß]|\b(ich|du|und|ist|nicht|das|der|die)\b/i.test(t); };
    el.innerHTML = `<button class="back" data-go="partner">‹ Scenarios</button><h2 class="page-title">${sc.icon} ${esc(sc.title)}</h2>
      <div class="chat pchat" aria-live="polite"></div>
      <div class="p-suggest muted small"></div>
      <form class="composer pcomp"><textarea rows="1" placeholder="Answer in German – or tap the microphone" aria-label="Your answer"></textarea>${UI.mic("")}<button class="btn sign">Send</button></form>
      <div class="row center"><button class="btn ghost p-end">Finish & get feedback</button></div>`;
    const chat = el.querySelector(".pchat"), ta = el.querySelector("textarea"), sug = el.querySelector(".p-suggest");
    const add = (cls, html) => { const d = document.createElement("div"); d.className = "msg " + cls; d.innerHTML = html; chat.appendChild(d); d.scrollIntoView({ block: "end", behavior: "smooth" }); return d; };
    const partner = (r) => {
      hist.push({ role: "assistant", de: String(r.de || ""), en: r.en || "" });
      add("assistant", `<p lang="de">${esc(r.de || "")} ${UI.say(r.de || "")} ${r.en ? "" : UI.hint(r.de || "")}</p>${r.en ? `<details><summary class="muted small">English</summary><p class="muted">${esc(r.en)}</p></details>` : ""}`);
      Speech.speak(String(r.de || ""));
      // the hint stays hidden until asked for: answering in your own words is the exercise
      sug.innerHTML = r.suggest ? `<button class="link p-help">💡 Stuck? Show an idea</button>` : "";
      const hb = sug.querySelector(".p-help"); if (hb) hb.onclick = () => { helps++; sug.innerHTML = `💡 For example: <i>${esc(r.suggest)}</i> <span class="muted small">– say it your own way.</span>`; };
    };
    const turn = async () => {
      busy = true; const wait = add("assistant typing", "…");
      try {
        // on this device the reply appears word by word while the model writes it
        const r = await AI.partnerTurn({ scenario: sc, history: hist, onToken: (t) => { wait.classList.add("live"); wait.innerHTML = `<p lang="de">${esc(t)}</p>`; } });
        wait.remove();
        if (r.correction && r.correction.wrong && r.correction.right && r.correction.wrong !== r.correction.right) {
          const last = chat.querySelectorAll(".msg.user"); const lu = last[last.length - 1];
          if (lu) lu.insertAdjacentHTML("beforeend", `<div class="p-corr"><del>${esc(r.correction.wrong)}</del> → <b>${esc(r.correction.right)}</b><br><span class="muted small">${esc(r.correction.why || "")}</span></div>`);
          Store.mistake({ prompt: `Speaking partner: ${esc(sc.title)}`, answer: r.correction.right, given: r.correction.wrong, why: esc(r.correction.why || "") });
        }
        partner(r);
      } catch (e) { wait.remove(); add("assistant err", `<p>⚠️ ${esc(e.message)}</p><button class="btn ghost sm p-retry">Try again</button>`).querySelector(".p-retry").onclick = (ev) => { ev.target.closest(".msg").remove(); turn(); }; }
      busy = false;
    };
    const send = (text, force) => {
      text = text.trim(); if (!text || busy) return;
      if (!force && english(text)) {
        sug.innerHTML = `🇩🇪 That was English. Try it in German – short and simple is fine. <button class="link p-anyway">Send anyway</button>`;
        sug.querySelector(".p-anyway").onclick = () => send(text, true); ta.value = text; return;
      }
      hist.push({ role: "user", text }); turns++;
      add("user", `<p>${esc(text)}</p>`); ta.value = ""; sug.innerHTML = "";
      if (window.Habit) { Habit.track("speak"); Habit.track("partner"); }
      Store.addXP(4); turn();
    };
    el.querySelector("form").onsubmit = (e) => { e.preventDefault(); send(ta.value); };
    ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(ta.value); } };
    UI.bindMic(el.querySelector(".pcomp"), (t) => send(t));
    el.querySelector(".p-end").onclick = async (e) => {
      if (turns < 2) return H.toast("Say a few things first – at least two answers.");
      e.target.disabled = true; e.target.textContent = "Writing your feedback…";
      try {
        const r = await AI.partnerSummary({ scenario: sc, history: hist.concat(helps ? [{ role: "user", text: `(The learner asked for a hint ${helps} time${helps > 1 ? "s" : ""}.)` }] : []) });
        const sc0 = Math.max(0, Math.min(100, +r.score || 0));
        el.querySelector(".pcomp").remove(); e.target.remove(); sug.remove();
        add("assistant summary", `<div class="fb-head"><span class="fb-score ${sc0 >= 65 ? "good" : sc0 >= 45 ? "mid" : "low"}">${sc0}</span><div><b>${H.bi("Gut gemacht!", "Well done!")}</b><br><span class="muted">${esc(r.summary || "")}</span></div></div>
          ${(r.good || []).length ? `<h4>What went well</h4><ul>${r.good.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
          ${(r.mistakes || []).length ? `<h4>To fix</h4><ul class="fb-list">${r.mistakes.map((x) => `<li class="n"><span>✗</span><div><del>${esc(x.wrong)}</del> → <b>${esc(x.right)}</b><br><span class="muted">${esc(x.why)}</span></div></li>`).join("")}</ul>` : ""}
          ${(r.words || []).length ? `<h4>Words to learn</h4><ul class="vocab">${r.words.map((w) => `<li><span class="${H.genderClass(w.de)}">${esc(w.de)}</span> ${UI.say(w.de)} <span class="en">${esc(w.en)}</span></li>`).join("")}</ul>` : ""}
          ${r.next ? `<p><b>Next:</b> ${esc(r.next)}</p>` : ""}
          <div class="row"><button class="btn sign" data-go="partner/${sc.id}">Talk again</button><button class="btn ghost" data-go="partner">Other scenario</button><button class="btn ghost" data-go="practice/ai">Exercises from my mistakes</button></div>`);
        (r.mistakes || []).slice(0, 6).forEach((x) => Store.mistake({ prompt: `Speaking partner: ${esc(sc.title)}`, answer: x.right, given: x.wrong, why: esc(x.why || "") }));
        Store.addXP(sc0 >= 65 ? 20 : 10);
        AI.learn(hist.map((m) => (m.role === "user" ? "Learner: " + m.text : "Partner: " + m.de)).join("\n") + `\nSummary: ${r.summary || ""} Mistakes: ${(r.mistakes || []).map((x) => x.wrong + " → " + x.right).join("; ")}`);
      } catch (err) { e.target.disabled = false; e.target.textContent = "Finish & get feedback"; H.toast(err.message, "bad"); }
    };
    turn();
  };

  /* ---------------- exercises from my mistakes ---------------- */
  V.aiPractice = async (el) => {
    if (AI.local()) {
      el.innerHTML = `<button class="back" data-go="practice">‹ Practice</button><h2 class="page-title">${H.bi("Aus meinen Fehlern", "Exercises from my mistakes")}</h2>
        <section class="card"><p>New AI-written exercises need answer keys that are always right – a small on-device model can't promise that, so this uses Claude (online, Settings → AI tutor).</p>
        <p>Offline, the app already builds exercises from your mistakes and weak topics:</p>
        <div class="row"><button class="btn sign" data-go="practice/mistakes">My saved mistakes</button><button class="btn ghost" data-go="weak">Weak topics</button><button class="btn ghost" data-go="practice/smart">Smart mix</button></div></section>`;
      return;
    }
    if (!AI.ready()) return noKey(el, "Exercises from my mistakes");
    el.innerHTML = `<button class="back" data-go="practice">‹ Practice</button><h2 class="page-title">${H.bi("Aus meinen Fehlern", "Exercises from my mistakes")}</h2>
      <section class="card ai-wait"><p>✨ Claude is writing 10 exercises for your weak points…</p><div class="pbar"><span class="grow"></span></div><p class="muted small">Every sentence is checked by Max before you see it.</p></section><div class="sesshost"></div>`;
    try {
      let items = await AI.exercises(12);
      if (items.length < 4) items = items.concat(await AI.exercises(10));
      items = items.slice(0, 10);
      if (!items.length) throw new Error("No usable exercises came back this time. Try again.");
      el.querySelector(".ai-wait").remove();
      UI.session(el.querySelector(".sesshost"), (i) => items[i % items.length], { total: items.length, title: "Made for you by Claude · checked by Max" });
    } catch (e) {
      el.querySelector(".ai-wait").innerHTML = `<p>⚠️ ${esc(e.message)}</p><div class="row"><button class="btn sign" data-go="practice/ai">Try again</button><button class="btn ghost" data-go="practice/mistakes">Offline: practise my mistakes</button></div>`;
    }
  };

  /* ---------------- "detailed feedback" buttons under answers (exam, speaking, writing) ---------------- */
  V.aiButton = (task, n, src, level) => AI.local() ? "" : AI.hasKey()
    ? `<div class="ai-row"><button class="btn ghost sm ai-fb-btn" data-aitask="${esc(task)}" data-ain="${n || ""}" data-aisrc="${esc(src || "")}" data-ailv="${esc(level || "")}">✨ Detailed feedback from Claude</button></div>`
    : `<p class="muted small ai-row">✨ Want a teacher's detailed feedback? <button class="link" data-go="settings">Add your Claude API key</button>.</p>`;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".ai-fb-btn"); if (!b) return;
    e.preventDefault();
    const box = b.closest(".eq, li, .card, .wbox") || document;
    const ta = b.dataset.aisrc ? document.querySelector(b.dataset.aisrc) : box.querySelector("textarea");
    const text = ta ? ta.value.trim() : "";
    if (!text) return H.toast("Write your answer first.");
    const l = b.dataset.ain ? Course.byN(+b.dataset.ain) : null;
    b.disabled = true; const old = b.textContent; b.textContent = "✨ Claude is reading your answer…";
    try {
      const r = await AI.feedback({ task: b.dataset.aitask, text, lesson: l, level: b.dataset.ailv || null });
      const out = document.createElement("div"); out.innerHTML = AI.feedbackHtml(r);
      b.closest(".ai-row").replaceWith(out);
      (r.errors || []).slice(0, 5).forEach((x) => Store.mistake({ prompt: esc(b.dataset.aitask).slice(0, 200), answer: x.right, given: x.wrong, why: esc(x.why || "") }));
      Store.addXP(3);
    } catch (err) { b.disabled = false; b.textContent = old; H.toast(err.message, "bad"); }
  });
})();
