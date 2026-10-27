/* Deutsch Coach – views: Einstufungstest, Aussprache, Was ist neu.
   Added in 4.4.0 from the master report (Parts 7.8 and 7.9). */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});

  /* (The placement test lives in views7.js.) */

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
    { v: "6.9.0", date: "27 October 2026", items: [
      "<b>📘 Rules & tips above every drill</b>: what the topic is in one sentence, how it works, examples to listen to, typical mistakes, the full lesson explanation and what to do in this drill. Read it, tap “Got it – hide & start”, and it stays hidden for that topic until you open it again.",
      "<b>📘 Grammar revision</b> (Practice page): every topic on one page each, by level, with search – revise without practising.",
      "<b>12 new drills</b> – now every lesson has one: plural, personal pronouns (mich/mir/ihn/ihm …), dates (am ersten Mai), suggestions (Lass uns …), indirect questions, Präteritum of all verbs + Plusquamperfekt, entweder … oder / weder … noch, je … desto, „es“ & impersonal constructions, participle clauses, describing graphs, exam phrases.",
    ] },
    { v: "6.8.0", date: "26 October 2026", items: [
      "<b>📚 Library (Bibliothek)</b> is back: every collection in one place, as in the first app – Flashcards, Notes, Exercises, Passages, Conjugation, Sentences, Describe a picture, Vocabulary, Grammar tables and Leben in Deutschland. In the top bar on PC, on the Practice page and under More.",
      "<b>🃏 Flashcards</b> by level and topic, German → English or English → German, plus the first app's grammar, article and verb cards. “Again” cards come back in the same round.",
      "<b>🔤 Conjugation</b>: all 353 verb tables, searchable, and a conjugation drill. <b>🔁 Sentences</b>: the first app's 202 sentences to translate (A1–B2).",
      "<b>🖼 Describe a picture</b>: the photos from the first app with questions, useful words, a model description and feedback like in the speaking exam.",
      "Reading list now also shows the B2/C1 passages; the grammar poster is under Grammar → Tables.",
    ] },
    { v: "6.7.0", date: "26 October 2026", items: [
      "<b>🎯 Guided speaking partner</b> – works on every phone, PC and in the Android/iPhone app, offline, nothing to download: your partner asks real questions from 12 scenarios out loud, you answer freely by voice or typing, Max corrects your German, and an example answer is one tap away. The scenario “Today's lesson” uses your current lesson's speaking tasks.",
      "<b>Two modes</b> on the speaking-partner page: Guided or Free talk with the on-device AI. If the AI can't start or stops answering, the conversation continues in guided mode.",
      "<b>Two editions</b>: this daily app keeps only the proven parts (Llama models). A separate <b>Lab</b> edition has the newest models, a longer German test and a diagnostics report, with its own progress.",
      "Max no longer flags „Seit wann …?“ questions.",
    ] },
    { v: "6.6.0", date: "26 October 2026", items: [
      "<b>Gemma 4 E2B</b> (Google, 2026) as a third on-device model for PCs with a graphics card – the strongest German of the three. Settings also marks the model recommended for your device.",
      "<b>🧪 German self-test</b>: Settings → AI tutor tests the downloaded model on this device with six sentences, checks every reply with Max and measures the speed – so you can see which model works best here.",
      "<b>Faster conversations</b>: replies appear word by word while the AI writes; the model warms up while you pick a scenario; replies too long for A1/A2 are made shorter automatically.",
      "<b>Saves battery</b>: the on-device AI frees the graphics chip after 5 minutes without use.",
      "<b>Max catches more</b>: „kein Zeit“, „mein Schwester“, „kein Kinder“ → keine / meine.",
    ] },
    { v: "6.5.0", date: "26 October 2026", items: [
      "<b>AI on your own device – free, no account, no internet</b>: the speaking partner now runs locally with Llama 3.2 (Settings → AI tutor → Download, about 0.7 GB once). Every family member can use it on their own device – no API key needed.",
      "Your answers are corrected by <b>Max's checked rules</b>, not by the small model, so corrections stay reliable. Each partner reply has an <b>EN?</b> word-by-word help.",
      "<b>Everything from your own repo</b>: the AI and speech libraries are now part of the app (no third-party servers), and a GitHub Action can store the models on your own site.",
      "Claude (online, own key) is still available in Settings for the best quality, detailed feedback and AI exercises.",
    ] },
    { v: "6.4.1", date: "26 October 2026", items: [
      "<b>AI tutor, safer and more reliable</b>: answers cut off by the AI are retried with more room; long conversations stay fast and cheap (last 20 turns); a failed reply no longer breaks the conversation.",
      "<b>Speaking partner</b>: answers in English get a friendly “try it in German”; ideas for what to say appear only when you ask (“💡 Stuck?”), so you practise your own words.",
      "<b>Offline speech</b>: Whisper's typical German noise phrases („Untertitel im Auftrag des ZDF …“) are filtered out instead of being sent as your answer.",
      "<b>Exercises from my mistakes</b> accept every correct answer, not only one.",
      "<b>Your API key is never saved into backup files.</b>",
    ] },
    { v: "6.4.0", date: "26 October 2026", items: [
      "<b>AI tutor (Claude)</b> with your own Anthropic API key: a <b>speaking partner</b> for role-plays at your level (it answers out loud, corrects real mistakes and gives feedback at the end), <b>detailed feedback</b> on exam answers, speaking and writing, and <b>new exercises from your own mistakes</b> – every AI sentence is checked by Max before you see it.",
      "<b>It grows with you</b>: the tutor knows your level, lesson, weak topics and recent mistakes, and keeps short notes about you after each conversation (see and delete them in Settings).",
      "<b>Offline speech recognition</b> with Whisper on your device: download once (80 MB), then speaking works without internet and no audio leaves your device. If it ever fails, the browser's recognition takes over.",
      "Tap the microphone a second time when you're done talking.",
    ] },
    { v: "6.3.0", date: "26 October 2026", items: [
      "<b>Always a next step</b>: Practice, Exam and Speak now end with a button to the next part, and Speak with “Finish – next lesson”.",
      "<b>Feedback that teaches</b>: a wrong answer shows what you typed, marks the letters that differ and explains why – e.g. „sprechen changes e → i with du and er/sie/es“. Lower-case answers get a note about capital letters. Typing again after a check marks the old verdict as out of date.",
      "<b>Open exam and speaking answers</b> get a score and a checklist: German or not, length, the words the task asks for, questions vs. statements, this lesson's grammar, corrections and capital letters – plus a model answer for every question (232 new).",
      "<b>Speaking without a microphone</b>: type what you would say and get the same feedback.",
      "<b>Practice day</b> now fills the minutes your plan asks for (e.g. 158 min → 23 steps), ticks every step itself when you finish it, skips lessons you have already finished, and “+15 minutes” always gives you more.",
      "<b>Fixed</b>: weak topics were never found; “Word review ( due)” showed no number; celebrations no longer cover the screen while you're answering; messages no longer pile on top of each other.",
    ] },
    { v: "6.2.0", date: "26 October 2026", items: [
      "<b>Erste Schritte · First steps</b> – a picture course for people who know zero German: 18 units, 192 words with pictures and sound, 86 everyday sentences. Short rounds with picture questions, listening, pair matching, der/die/das, typing and sentence building. Wrong answers come back until they're right.",
      "<b>Picture flashcards</b> for every unit: flip, listen, slow audio, “Again” / “I knew it”.",
      "<b>The app in English</b>: Settings → App language → English. Every lesson now has an English title and an English grammar explanation; German questions have an <b>EN?</b> button with word-by-word meanings.",
      "<b>“I know zero German”</b> at the start switches the app to English and begins with First steps.",
    ] },
    { v: "6.1.0", date: "26 October 2026", items: [
      "<b>Uses the whole screen on a PC</b>: two columns on the start screen, lesson parts side by side, a wider practice grid and course path.",
      "<b>German + English everywhere</b>: every menu and button has an English label. Settings → Menu language switches between both, German only and English only.",
      "<b>13 new lessons</b> – 73 in total, including Perfekt already in A1 and new B2, C1 and C2 topics.",
      "<b>4,297 words</b> with example sentences; Max makes fewer false corrections.",
      "<b>Your progress is safe</b> when lessons are added: it is now saved under a permanent lesson ID.",
    ] },
    { v: "6.0.0", date: "26 October 2026", items: [
      "<b>New start screen “Heute”</b>: one big button always shows your best next step. Daily goal ring, streak, week view.",
      "<b>Streak freezes</b>: every 7 days in a row earns a freeze (max. 2). A missed day no longer wipes out your streak.",
      "<b>Daily quests</b>, <b>combos</b> for answers in a row, levels with titles, and an end-of-round summary.",
      "<b>Familien-Liga</b>: all learners on this device compete in a friendly weekly league.",
      "<b>Audio player</b>: pause, stop, back one sentence, skip and speed – no more audio that restarts by itself.",
      "<b>Twice the content</b>: every lesson now has 30 words, 20 examples, a second (longer) text, a listening scene with questions and 20 exercises. The word list grew from 1,995 to 3,548 words.",
      "<b>Corrected German</b>: wrong verb forms in generated sentences (<i>kommet → kommt</i>, <i>warn → waren</i>) and „einen Kilo“ in lesson 6. Max no longer flags correct Konjunktiv I, passive infinitives or colons.",
      "<b>New look</b> (Mitternacht & Bernstein), new menu, calendar reminder, sounds and vibration, Resources page, and an update bar so you always get the newest version.",
    ] },
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
