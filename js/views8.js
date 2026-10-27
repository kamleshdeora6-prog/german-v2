/* Deutsch Coach – v6 views: grouped "More" menu and outside resources. */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});

  /* ---------------- Mehr: grouped, so nothing is more than one glance away ---------------- */
  V.more = (el) => {
    const groups = [
      ["Lernen", "Learn", [["library", "📚", "Bibliothek", "Library", "Flashcards, notes, exercises, texts, verbs, pictures"], ["starter", "🐣", "Erste Schritte", "First steps", "German from zero, with pictures"], ["partner", "🗣", "Sprechpartner", "Speaking partner", "AI conversation at your level"], ["practice/ai", "✨", "Aus meinen Fehlern", "From my mistakes", "AI exercises made for you"], ["vocab", "🗂", "Wörter", "Words", `${DC.vocab.length} words, spaced repetition`], ["listen", "🎧", "Hören", "Listening", "Dictation"], ["speak", "🎙", "Sprechen", "Speaking", "Shadowing & free talk"], ["read", "📖", "Lesen", "Reading", `${DC.curriculum.length + DC.passages.length} texts`], ["write", "✍️", "Schreiben", "Writing", `${DC.exams.writing.length} tasks with models`], ["pronounce", "👄", "Aussprache", "Pronunciation", "ü/u, ö/o, ich/sch …"]]],
      ["Nachschlagen", "Look up", [["translate", "⇄", "Übersetzen", "Translate", "Offline + DeepL, LEO"], ["grammar", "📐", "Grammatik", "Grammar", "Rules & tables"], ["notes", "🧾", "Spickzettel", "Cheat sheets", "A1–C2 on one page each"], ["resources", "🌍", "Links", "Resources", "Free courses, news, podcasts"]]],
      ["Prüfung", "Exams", [["exam", "🎓", "Prüfungstrainer", "Exam trainer", "Mock test & Leben in D."], ["readexam", "📰", "Leseprüfung", "Reading exam", `${DC.exams.reading.length} sets`], ["placement", "🧭", "Einstufungstest", "Placement test", "Find your level"]]],
      ["Planen", "Plan", [["stats", "📊", "Fortschritt", "Progress", "Stats & mistakes"], ["plan", "🎯", "Mein Plan", "My plan", "Goal and deadline"], ["daily", "🗓", "Übungstag", "Practice day", "Today's session in order"], ["weak", "🩹", "Schwächen", "Weak topics", "What you get wrong"], ["refresh", "🔁", "Auffrischen", "Refresher", "Learnt it once, forgot it"]]],
      ["App", "App", [["settings", "⚙️", "Einstellungen", "Settings", "Profiles, reminder, backup"], ["news", "✨", "Neu", "What's new", `Version ${App.version}`], ["about", "ℹ️", "Über die App", "About & privacy", "Who made this, your data"]]],
    ];
    el.innerHTML = `<h2 class="page-title">${H.bi("Mehr", "More")}</h2>${groups.map(([g, ge, items]) => `<h3 class="grp">${H.bi(g, ge)}</h3><section class="grid2 menu">${items.map(([go, ic, t, te, d]) => `<button class="tile" data-go="${go}"><span class="ti">${ic}</span><b>${H.bi(t, te)}</b><span>${esc(d)}</span></button>`).join("")}</section>`).join("")}
      <p class="credit muted small">${App.credit()}</p>`;
  };

  /* ---------------- outside resources: what a teacher would hand you on day one ---------------- */
  const RES = [
    ["Free courses", [
      ["DW Learn German", "https://learngerman.dw.com/en/overview", "A1–C1 · Nicos Weg video course, free, with exercises"],
      ["Goethe B1 practice tests", "https://www.goethe.de/ins/no/de/spr/prf/ueb/pb1.html", "Official Modellsätze with audio"],
      ["telc", "https://www.telc.net/", "Exam formats and free mock tests"],
    ]],
    ["Listen every day", [
      ["nachrichtenleicht", "https://www.nachrichtenleicht.de/", "News in easy German, every Friday (A2–B1)"],
      ["Easy German (YouTube)", "https://www.youtube.com/@EasyGerman", "Street interviews with subtitles (A2–C1)"],
      ["Easy German Podcast", "https://www.easygerman.fm/", "Natural conversation about life in Germany (B1+)"],
      ["Slow German", "https://slowgerman.com/", "Slow podcast on everyday topics (A2–B1)"],
      ["Coffee Break German", "https://coffeebreaklanguages.com/coffeebreakgerman/", "Structured audio lessons for beginners"],
      ["ZDF logo!", "https://www.zdf.de/kinder/logo", "Children's news – clear speech, short (B1)"],
    ]],
    ["Look it up", [
      ["Verbformen", "https://www.verbformen.de/", "Every conjugation and declination"],
      ["DWDS", "https://www.dwds.de/", "Dictionary with real example sentences"],
      ["Duden", "https://www.duden.de/", "Spelling, meaning, grammar"],
      ["Forvo", "https://forvo.com/languages/de/", "Native speakers pronounce any word"],
      ["Lingolia Deutsch", "https://deutsch.lingolia.com/en/", "Clear grammar explanations with exercises"],
      ["mein-deutschbuch", "https://mein-deutschbuch.de/", "Thousands of free grammar exercises"],
    ]],
  ];
  V.resources = (el) => {
    el.innerHTML = `<button class="back" data-go="more">‹ More</button><h2 class="page-title">Resources</h2>
      <p class="muted">The app teaches the system. Real German from real people makes it stick: one item from “Listen every day” for 10 minutes is the best habit you can add.</p>
      ${RES.map(([g, list]) => `<section class="card"><h3>${g}</h3><div class="tlinks">${list.map(([n, u, d]) => `<button class="tlink" data-url="${u}"><b>${esc(n)} ↗</b><span>${esc(d)}</span></button>`).join("")}</div></section>`).join("")}`;
  };
})();
