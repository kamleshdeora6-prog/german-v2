/* Deutsch Coach – Übersetzen: look up words and sentences.
   Offline: dictionary (1,989 words + verbs + function words), word-by-word gloss,
   matching example sentences from the course, article and conjugation tables, grammar check.
   Online: DeepL, Google Translate, LEO, Linguee, dict.cc, Duden, Wiktionary, Reverso. */
(function () {
  "use strict";
  const { esc } = H;
  const V = (window.Views = window.Views || {});

  const DE_HINT = /[äöüß]|\b(der|die|das|und|ist|nicht|ich|du|wir|ein|eine|mit|auf|für|sich|den|dem|des|zu|von|bin|bist|sind|haben|habe|kein|auch|noch|schon|wie|was|wo)\b/i;
  const EN_HINT = /\b(the|is|are|and|i|you|we|they|a|an|of|to|with|for|not|this|that|what|how|where|do|does|have|has|my|your)\b/i;
  function detect(t) {
    const one = t.trim().replace(/[.!?]+$/, "");
    if (!/\s/.test(one) || one.split(/\s+/).length <= 2) {
      // short input: ask the dictionary which side it belongs to
      const low = one.toLowerCase().replace(/^(der|die|das|to|the|a|an)\s+/, "");
      const isDe = DC.vocab.some((v) => v.de.toLowerCase().replace(/^(der|die|das)\s+/, "") === low) || (DC.conj && DC.conj[low]);
      const isEn = DC.vocab.some((v) => (v.en || "").toLowerCase().split(/[,/;]\s*/).map((x) => x.replace(/^to /, "").replace(/ \(.*\)$/, "")).includes(low));
      if (isDe && !isEn) return "de";
      if (isEn && !isDe) return "en";
      if (/^(der|die|das)\s/i.test(one) || /[äöüß]/i.test(one) || /^[A-ZÄÖÜ]/.test(one)) return "de";
    }
    const de = (t.match(new RegExp(DE_HINT.source, "gi")) || []).length + (/[äöüß]/i.test(t) ? 2 : 0) + (/\b[A-ZÄÖÜ][a-zäöüß]+\b.*\b[A-ZÄÖÜ][a-zäöüß]+\b/.test(t.replace(/^\S+\s*/, "")) ? 1 : 0);
    const en = (t.match(new RegExp(EN_HINT.source, "gi")) || []).length;
    return en > de ? "en" : "de";
  }

  const enc = encodeURIComponent;
  function links(text, from) {
    const to = from === "de" ? "en" : "de";
    const w = enc(text.trim());
    const single = !/\s/.test(text.trim()) || text.trim().split(/\s+/).length <= 3;
    const sentence = [
      ["DeepL", `https://www.deepl.com/translator#${from}/${to}/${w}`, "best for full sentences"],
      ["Google Translate", `https://translate.google.com/?sl=${from}&tl=${to}&text=${w}&op=translate`, ""],
      ["Reverso Context", `https://context.reverso.net/translation/${from === "de" ? "german-english" : "english-german"}/${w}`, "real example sentences"],
    ];
    const word = [
      ["LEO", `https://dict.leo.org/englisch-deutsch/${w}`, "detailed: all meanings, forms, forum"],
      ["Linguee", `https://www.linguee.com/${from === "de" ? "german-english" : "english-german"}/search?query=${w}`, "translations in real texts"],
      ["dict.cc", `https://www.dict.cc/?s=${w}`, ""],
      ["Duden", `https://www.duden.de/suchen/dudenonline/${w}`, "German meaning & grammar"],
      ["Wiktionary", `https://de.wiktionary.org/wiki/${w}`, "declension & conjugation tables"],
    ];
    const list = single ? word.concat(sentence) : sentence.concat(word);
    return `<div class="tlinks">${list.map(([n, u, d]) => `<button class="tlink" data-url="${u}"><b>${n} ↗</b>${d ? `<span>${d}</span>` : ""}</button>`).join("")}</div>`;
  }

  // sentences from the course (lesson examples) that contain the search
  function examples(text, from) {
    const t = text.toLowerCase().replace(/[.!?]+$/, "").trim();
    if (t.length < 2) return [];
    const out = [];
    DC.curriculum.forEach((l) => l.examples.forEach((e) => {
      const hay = (from === "de" ? e.de : e.en).toLowerCase();
      const re = new RegExp(`(^|[^a-zäöüß])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-zäöüß]|$)`, "i");
      if (re.test(hay)) out.push({ de: e.de, en: e.en, n: l.n, level: l.level, exact: hay.replace(/[.!?]+$/, "") === t });
    }));
    out.sort((a, b) => (b.exact - a.exact) || a.de.length - b.de.length);
    return out.slice(0, 6);
  }

  function wordCard(x, from) {
    const vid = "v:" + String(x.de).toLowerCase();
    const inVocab = DC.vocab.some((v) => "v:" + v.de.toLowerCase() === vid);
    const has = inVocab && Store.get().srs[vid];
    return `<div class="tword"><p><b class="${H.genderClass(x.de)}">${esc(x.de)}</b> ${UI.say(String(x.de).replace(/ \(.*\)$/, ""))} = ${esc(x.en)} ${x.level ? UI.levelDot(x.level) : ""}</p>
      ${x.pl ? `<p class="muted small">Plural: ${esc(x.pl)}</p>` : ""}${x.extra ? `<p class="muted small">${esc(x.extra)}</p>` : ""}
      ${x.ex ? `<p class="ex">${esc(x.ex)}${x.exEn ? `<br><span class="en">${esc(x.exEn)}</span>` : ""}</p>` : ""}
      ${inVocab ? `<button class="btn ghost sm addcard" data-id="${esc(vid)}" ${has ? "disabled" : ""}>${has ? "✓ In your flashcards" : "+ Add to my flashcards"}</button>` : ""}</div>`;
  }

  const EN_FUNC = { i: "ich", you: "du / Sie", he: "er", she: "sie", it: "es", we: "wir", they: "sie", me: "mich / mir", him: "ihn / ihm", her: "sie / ihr", us: "uns", them: "sie / ihnen",
    my: "mein(e)", your: "dein(e) / Ihr(e)", his: "sein(e)", our: "unser(e)", their: "ihr(e)", a: "ein / eine", an: "ein / eine", the: "der / die / das",
    is: "ist", are: "sind", am: "bin", was: "war", were: "waren", be: "sein", have: "haben", has: "hat", had: "hatte", will: "werden", would: "würde", could: "könnte", can: "können", must: "müssen", should: "sollte", do: "(tun)", does: "(tut)", did: "(tat)",
    and: "und", or: "oder", but: "aber", because: "weil / denn", that: "dass / das", if: "wenn / ob", when: "wenn / als / wann", not: "nicht", no: "nein / kein", yes: "ja",
    in: "in", on: "auf / an", at: "an / bei / um", to: "zu / nach", from: "von / aus", with: "mit", without: "ohne", for: "für", of: "von", about: "über", after: "nach", before: "vor", into: "in",
    what: "was", who: "wer", where: "wo", how: "wie", why: "warum", which: "welche(r)", very: "sehr", also: "auch", too: "auch / zu", only: "nur", here: "hier", there: "dort", now: "jetzt", today: "heute", please: "bitte", thanks: "danke" };
  function gloss(text, from) {
    const toks = text.replace(/[„“"()]/g, " ").split(/\s+/).filter(Boolean);
    return `<div class="gloss">${toks.map((tok) => {
      const w = tok.replace(/[.,!?;:]+$/, "");
      const fw = from === "en" ? EN_FUNC[w.toLowerCase()] : null;
      const hit = !fw && w ? Tutor.dict(w)[0] : null;
      const mean = fw || (hit ? (from === "de" ? hit.en : hit.de) : "?");
      return `<span class="g"><b>${esc(tok)}</b><i>${esc(String(mean).replace(/ \(form of .*\)$/, "").split(/[;,]/)[0])}</i></span>`;
    }).join("")}</div><p class="muted small">Word-by-word meanings from the offline dictionary – a guide, not a finished translation. “?” means the word isn't in the offline list; use LEO or DeepL above.</p>`;
  }

  function lookup(el, text, dir) {
    const out = el.querySelector(".tout");
    text = text.trim();
    if (!text) { out.innerHTML = ""; return; }
    const from = dir === "auto" ? detect(text) : dir;
    const words = text.split(/\s+/).length;
    const s = Store.get();
    s.translateHistory = [text].concat((s.translateHistory || []).filter((x) => x !== text)).slice(0, 25);
    Store.save();

    let html = `<section class="card"><h3>Translate online</h3><p class="muted small">Detected: <b>${from === "de" ? "German → English" : "English → German"}</b>. Opens in your browser.</p>${links(text, from)}</section>`;

    // offline dictionary
    const hits = words <= 3 ? Tutor.dict(text) : [];
    const ex = examples(text, from);
    const exact = ex.find((e) => e.exact);
    if (exact) html += `<section class="card tbest"><h3>From your course</h3><p class="big">${esc(from === "de" ? exact.en : exact.de)}</p>${UI.say(exact.de)}<p class="muted small">Lesson ${exact.n} ${UI.levelDot(exact.level)}</p></section>`;
    if (hits.length) {
      html += `<section class="card"><h3>Meaning (offline)</h3>${hits.map((x) => wordCard(x, from)).join("")}</section>`;
      const top = hits[0]; const bare = String(top.de).replace(/^(der|die|das)\s+/, "").replace(/ \(.*\)$/, "");
      if (/^(der|die|das)\s/.test(top.de)) html += `<details class="card"><summary>Article & cases of ${esc(bare)}</summary>${Tutor.articleGuess(bare)}</details>`;
      else if (DC.conj && DC.conj[bare.toLowerCase()]) html += `<details class="card"><summary>Conjugation of ${esc(bare)}</summary>${Tutor.conjugateHtml(bare)}</details>`;
    } else if (words <= 3) {
      html += `<section class="card"><h3>Meaning (offline)</h3><p>“${esc(text)}” isn't in the offline dictionary. Try <b>LEO</b> or <b>Linguee</b> above – they're the most detailed.</p>${from === "de" && words === 1 && /^[A-ZÄÖÜ]/.test(text) ? Tutor.articleGuess(text) : ""}</section>`;
    }
    if (words > 1) html += `<section class="card"><h3>Word by word</h3>${gloss(text, from)}</section>`;
    if (from === "de" && words >= 3) {
      const r = Tutor.check(text);
      html += `<section class="card"><h3>Grammar check</h3>${r.issues.length
        ? `<p class="ex ok">${esc(r.fixed)} ${UI.say(r.fixed)}</p><ul class="nots">${r.issues.map((i) => `<li>${i.rule}<br><span class="muted">${i.why}</span></li>`).join("")}</ul>`
        : `<p>Max didn't spot a mistake ${UI.say(text)}</p><p class="muted small">He checks word order, endings, cases, articles and negation – not meaning or style, and he doesn't catch everything yet.</p>`}</section>`;
    }
    const others = ex.filter((e) => !e.exact);
    if (others.length) html += `<section class="card"><h3>Used in your lessons</h3><ul class="exs">${others.map((e) => `<li>${UI.colorArticles(e.de)} ${UI.say(e.de)}<br><span class="en">${esc(e.en)}</span> <button class="link" data-go="lesson/${e.n}">L${e.n}</button></li>`).join("")}</ul></section>`;
    html += `<div class="row"><button class="btn ghost" data-ask="${esc(words > 3 ? "Translate: " + text : "What does " + text + " mean?")}">Ask Max about it</button></div>`;
    out.innerHTML = html;
    out.querySelectorAll(".addcard").forEach((b) => (b.onclick = () => {
      const st = Store.get(); if (!st.srs[b.dataset.id]) st.srs[b.dataset.id] = { box: 0, due: Date.now(), seen: 0, lapses: 0 };
      Store.save(); b.disabled = true; b.textContent = "✓ In your flashcards"; H.toast("Added – it's in today's word review.");
    }));
    drawHistory(el);
  }

  function drawHistory(el) {
    const hist = Store.get().translateHistory || [];
    el.querySelector(".thist").innerHTML = hist.length ? `<p class="muted small">Recent</p><div class="chips">${hist.slice(0, 12).map((h) => `<button class="chip th">${esc(h.length > 40 ? h.slice(0, 40) + "…" : h)}</button>`).join("")}<button class="link clr">clear</button></div>` : "";
    el.querySelectorAll(".th").forEach((b, i) => (b.onclick = () => { el.querySelector(".tin").value = hist[i]; lookup(el, hist[i], el.dataset.dir); }));
    const c = el.querySelector(".clr"); if (c) c.onclick = () => { Store.get().translateHistory = []; Store.save(); drawHistory(el); };
  }

  V.translate = (el, [q]) => {
    el.dataset.dir = el.dataset.dir || "auto";
    el.innerHTML = `<h2 class="page-title">Translate</h2>
      <section class="card">
        <div class="seg" role="radiogroup" aria-label="Direction">${[["auto", "Auto"], ["de", "DE → EN"], ["en", "EN → DE"]].map(([k, t]) => `<button role="radio" aria-checked="${el.dataset.dir === k}" class="${el.dataset.dir === k ? "on" : ""}" data-dir="${k}">${t}</button>`).join("")}</div>
        <textarea class="tin" rows="3" placeholder="A word or a whole sentence – German or English">${esc(q ? decodeURIComponent(q) : "")}</textarea>${UI.umlautBar()}
        <div class="row"><button class="btn sign go">Translate</button>${UI.mic("Speak")}<button class="btn ghost clear">Clear</button></div>
        <div class="thist"></div>
      </section>
      <div class="tout" aria-live="polite"></div>`;
    const ta = el.querySelector(".tin");
    UI.bindUmlauts(el, ta);
    UI.bindMic(el, (txt) => { ta.value = txt; lookup(el, txt, el.dataset.dir); });
    el.querySelectorAll("[data-dir]").forEach((b) => (b.onclick = () => {
      el.dataset.dir = b.dataset.dir;
      el.querySelectorAll("[data-dir]").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
      if (ta.value.trim()) lookup(el, ta.value, el.dataset.dir);
    }));
    el.querySelector(".go").onclick = () => lookup(el, ta.value, el.dataset.dir);
    ta.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); lookup(el, ta.value, el.dataset.dir); } };
    el.querySelector(".clear").onclick = () => { ta.value = ""; el.querySelector(".tout").innerHTML = ""; ta.focus(); };
    drawHistory(el);
    if (ta.value.trim()) lookup(el, ta.value, el.dataset.dir); else setTimeout(() => ta.focus(), 50);
  };
})();

/* About & privacy */
(function () {
  "use strict";
  const V = (window.Views = window.Views || {});
  V.about = (el) => {
    const c = App.contact;
    el.innerHTML = `<h2 class="page-title">About & privacy</h2>
      <section class="card about">
        <h3>Deutsch Coach ${App.version}</h3>
        <p>Created by <b>${App.author}</b> · last updated ${App.updated}.</p>
        <p>A free German course from A1 to C2: ${DC.curriculum.length} lessons, ${DC.vocab.length} words, practice that explains every answer, an offline tutor, exam training and a translator.</p>
        <p class="muted small">Deutsch Coach is an independent project. It is <b>not affiliated with</b> or endorsed by the Goethe-Institut, telc, ÖSD, the BAMF or any exam provider. Exam formats are modelled on public descriptions; always check the official information for your exam.</p>
      </section>
      <section class="card"><h3>Contact & problems</h3>
        <p>Found wrong German, a wrong answer or a bug? Tap <b>⚑</b> on any question – it fills in the details for you.</p>
        <div class="row"><button class="btn ghost" data-url="${c.github}/issues">Open issues on GitHub ↗</button>${c.email ? `<a class="btn ghost" href="mailto:${c.email}">${c.email}</a>` : ""}<button class="btn ghost" data-report='{"part":"General feedback"}'>⚑ Report a problem</button></div>
      </section>
      <section class="card"><h3>Your data</h3>
        <ul class="plain">
          <li><b>Everything stays on this device.</b> Progress, profiles, names, flashcards, drafts and history are stored in this browser (or in the Android app) and are never uploaded.</li>
          <li><b>No accounts, no ads, no tracking, no analytics.</b></li>
          <li><b>Hosting:</b> the web version is served by GitHub Pages. Like every web host, GitHub records technical access data such as IP addresses in its server logs; see GitHub's privacy statement. The Android app loads nothing from the internet.</li>
          <li><b>Clearing browser data deletes your progress.</b> Use <i>Settings → Export backup</i> to keep a copy; you can import it on any device.</li>
          <li><b>Speech:</b> text-to-speech runs on your device. Speech recognition uses your browser's or phone's service (on Chrome and Android this is Google's), only while the microphone button is active.</li>
          <li><b>Translate and dictionary buttons</b> (DeepL, Google, LEO, Linguee, dict.cc, Duden, Wiktionary, Reverso) open those websites with the word or sentence you searched. Their own privacy policies apply.</li>
          <li><b>Optional AI key:</b> if you add your own Anthropic API key in Settings, it is stored only on this device and sent only to api.anthropic.com when Max answers an open question. Without a key, nothing is sent anywhere.</li>
          <li><b>Problem reports</b> contain only the question, the expected answer, your answer and your note – never your name or progress – and are sent only when you press Send.</li>
        </ul>
        <div class="row"><button class="btn ghost" data-go="settings">Settings & backup</button><button class="btn ghost" data-go="news">What's new</button><button class="btn ghost" data-url="docs/Deutsch_Coach_Master_Report.pdf">Master report (PDF) ↗</button></div>
      </section>
      <p class="credit muted small">© ${new Date().getFullYear()} ${App.author}. All rights reserved.</p>`;
  };
})();
