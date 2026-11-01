/* Deutsch Coach – what exactly was wrong? (7.5)
   Compares a typed answer with the right one word by word and says how close it was (Almost – 1 word · 2–3 words ·
   only the order · not yet), which word is wrong, which grammar topic that is (time prepositions, Dativ verbs,
   gender …) and the rule in one line. Every mistake is saved with its topic, so "My mistakes" can be practised by topic.
   Also: the "Which case?" reference page (route #/cases). */
(function () {
  "use strict";
  const esc = (x) => (window.H ? H.esc(x) : String(x));
  const T = {
    time_prep: { title: "Time words: um, am, im, in", gens: ["zeitpraep", "datum", "zeit"], ref: "time",
      rule: "<b>um</b> + clock time (um acht Uhr) · <b>am</b> + day, part of the day, date (am Montag, am Abend, am 3. Mai) · <b>im</b> + month, season (im Mai, im Winter) · <b>in</b> + time from now (in zwei Tagen) · years: just the number (2020) or im Jahr 2020." },
    dativ_verbs: { title: "Verbs with Dativ (helfen, danken …)", gens: ["dativ", "pronomen"], ref: "dverbs",
      rule: "These verbs always take the <b>Dativ</b>: helfen, danken, gehören, gefallen, gratulieren, antworten, folgen, glauben (jdm.), passen, schmecken, fehlen, vertrauen, zuhören, wehtun. der/das → <b>dem</b>, die → <b>der</b>, plural → <b>den</b> (+n); mir, dir, ihm, ihr, uns, euch, ihnen." },
    akkusativ: { title: "Akkusativ (den, einen)", gens: ["akkusativ"], ref: "akk",
      rule: "The direct object is <b>Akkusativ</b> (Wen? Was?). Only masculine changes: der → <b>den</b>, ein → <b>einen</b>, kein → <b>keinen</b>, mein → <b>meinen</b>. die and das stay the same." },
    dativ: { title: "Dativ (dem, der, einem)", gens: ["dativ", "dat_akk"], ref: "dat",
      rule: "Dativ (Wem?): der/das → <b>dem</b>, die → <b>der</b>, plural → <b>den</b> + n; ein → <b>einem</b>/<b>einer</b>. The person who gets something is Dativ: Ich gebe <b>dem</b> Mann das Buch." },
    prep_case: { title: "Prepositions + case", gens: ["praepositionen", "genitiv"], ref: "preps",
      rule: "Always <b>Akkusativ</b>: durch, für, gegen, ohne, um · always <b>Dativ</b>: aus, bei, mit, nach, seit, von, zu (zum, zur, beim, vom) · <b>Genitiv</b>: wegen, trotz, während, statt." },
    wechsel: { title: "Wo? or Wohin? (in dem / in den)", gens: ["wechsel"], ref: "wechsel",
      rule: "an, auf, hinter, in, neben, über, unter, vor, zwischen: <b>Wo?</b> (a place) → Dativ: im Park, auf dem Tisch · <b>Wohin?</b> (a direction) → Akkusativ: in den Park, auf den Tisch." },
    gender: { title: "Article / gender (der, die, das)", gens: ["wortschatz_artikel", "artikel"], ref: "gender",
      rule: "Every noun has its gender: learn it with the article. Tips: -ung, -heit, -keit, -schaft, -ion → die · -chen, -lein → das · in compounds the last word decides (die Haustür)." },
    plural: { title: "Plural", gens: ["wortschatz_plural", "plural"], ref: "gender", rule: "Learn the plural with the noun: der Tisch – die Tische, die Lampe – die Lampen, das Buch – die Bücher, das Auto – die Autos." },
    adj_end: { title: "Adjective endings", gens: ["adjektiv", "adjektiv_komplett"], ref: "adj",
      rule: "After der/die/das the adjective ends in <b>-e</b> (Nominativ singular) or <b>-en</b> (everything else). After ein/kein/mein without ending it shows the gender: ein gut<b>er</b> Mann, ein klein<b>es</b> Kind. After ist/sind: no ending (das Sofa ist rot)." },
    verb_end: { title: "Verb ending / subject", gens: ["praesens", "sein_haben"], ref: "verbs",
      rule: "The ending follows the subject: ich <b>-e</b>, du <b>-st</b>, er/sie/es <b>-t</b>, wir <b>-en</b>, ihr <b>-t</b>, sie/Sie <b>-en</b>." },
    pronoun: { title: "Pronouns (sie, ihr, Sie · mich, mir)", gens: ["pronomen", "reflexiv"], ref: "pron",
      rule: "<b>ihr</b> = you (all) · <b>sie</b> = she or they · <b>Sie</b> = you (polite). The verb tells you which: sie dank<b>en</b> (they), ihr dank<b>t</b>. Object pronouns: Akkusativ mich, dich, ihn, sie, es · Dativ mir, dir, ihm, ihr." },
    verb_pos2: { title: "Verb in position 2", gens: ["wortstellung", "fragen"], ref: "order",
      rule: "In a statement the conjugated verb is always the <b>2nd element</b>. If something else comes first (Heute, Am Montag), the subject moves behind the verb: Heute <b>gehe ich</b> …" },
    verb_end_pos: { title: "Verb at the end (weil, dass …)", gens: ["nebensatz"], ref: "order",
      rule: "After weil, dass, wenn, ob, obwohl, als … the conjugated verb goes to the <b>end</b>: …, weil ich krank <b>bin</b>." },
    word_order: { title: "Word order", gens: ["satzbau", "wortstellung"], ref: "order",
      rule: "Verb in position 2 (statement) or 1 (yes/no question). The middle is flexible: time before or after a known object (morgen das Brot / das Brot morgen), the rest of the verb at the end." },
    separable: { title: "Separable verbs", gens: ["trennbar"], ref: "verbs", rule: "The prefix goes to the end: anrufen → Ich <b>rufe</b> dich morgen <b>an</b>." },
    perfekt: { title: "Perfekt (haben / sein)", gens: ["perfekt"], ref: "verbs", rule: "Perfekt = haben/sein (position 2) + Partizip II at the end. Movement or change of state → <b>sein</b> (ich bin gefahren), everything else → <b>haben</b>." },
    negation: { title: "nicht or kein", gens: ["negation"], ref: "verbs", rule: "<b>kein</b> negates a noun with ein or without article (kein Auto, keine Zeit); <b>nicht</b> negates everything else (nicht heute, nicht gut, das Auto nicht)." },
    modal: { title: "Modal verbs", gens: ["modal"], ref: "verbs", rule: "Modal verb in position 2 + infinitive at the end, without zu: Ich <b>kann</b> heute nicht <b>kommen</b>." },
    possessive: { title: "mein, dein, sein …", gens: ["possessiv"], ref: "gender", rule: "mein/dein/sein take the endings of ein: mein Bruder, mein<b>e</b> Schwester, mein<b>en</b> Bruder (Akk.), mein<b>em</b> Bruder (Dat.)." },
    comparative: { title: "Comparative", gens: ["komparativ"], ref: "adj", rule: "Comparative = adjective + <b>-er</b> (+ often umlaut) + <b>als</b>: größer als, besser als. Never „mehr besser“." },
    capitals: { title: "Capital letters", gens: [], ref: "", rule: "Nouns, names, the polite Sie and the first word of a sentence start with a capital letter." },
    umlauts: { title: "Umlauts (ä, ö, ü, ß)", gens: [], ref: "", rule: "ä, ö, ü change the word (schon ≠ schön). On a keyboard without them: ae, oe, ue, ss – the app accepts these, but learn the real letters." },
    spelling: { title: "Spelling", gens: [], ref: "", rule: "Check the letters – the marked ones are different." },
    vocab: { title: "Word choice", gens: [], ref: "", rule: "A different word – check the meaning and add the right one to your flashcards." },
    missing: { title: "Missing or extra words", gens: [], ref: "", rule: "A word is missing or one too many." },
  };
  const GEN2TOPIC = { sein_haben: "verb_end", praesens: "verb_end", wortstellung: "verb_pos2", fragen: "verb_pos2", artikel: "gender", wortschatz_artikel: "gender", akkusativ: "akkusativ", negation: "negation", possessiv: "possessive", uhrzeit: "time_prep", zeitpraep: "time_prep", datum: "time_prep", zeit: "time_prep", trennbar: "separable", modal: "modal", dativ: "dativ", dat_akk: "dativ", praepositionen: "prep_case", genitiv: "prep_case", wechsel: "wechsel", perfekt: "perfekt", reflexiv: "pronoun", pronomen: "pronoun", nebensatz: "verb_end_pos", komparativ: "comparative", adjektiv: "adj_end", adjektiv_komplett: "adj_end", plural: "plural", wortschatz_plural: "plural", satzbau: "word_order" };
  /* Max's rules carry the lesson that teaches them */
  const LESSON2TOPIC = { 1: "verb_end", 2: "verb_end", 3: "verb_pos2", 4: "gender", 5: "capitals", 6: "akkusativ", 7: "negation", 8: "gender", 11: "modal", 13: "dativ_verbs", 14: "prep_case", 15: "prep_case", 17: "perfekt", 20: "verb_pos2", 21: "verb_end_pos", 23: "adj_end", 40: "prep_case" };

  /* ---------- word lists ---------- */
  const DET = /^(der|die|das|den|dem|des|ein|eine|einen|einem|einer|eines|kein|keine|keinen|keinem|keiner|mein|meine|meinen|meinem|meiner|dein|deine|deinen|deinem|deiner|sein|seine|seinen|seinem|seiner|ihr|ihre|ihren|ihrem|ihrer|unser|unsere|unseren|unserem|euer|eure|euren|eurem)$/;
  const SUBJ = /^(ich|du|er|sie|es|wir|ihr|man)$/;
  const OBJP = /^(mich|dich|ihn|uns|euch|mir|dir|ihm|ihnen|sich)$/;
  const TIMEP = /^(um|am|im|in|an|zu|seit|vor|ab|bis|nach|für)$/;
  const AKK_P = ["durch", "für", "gegen", "ohne", "um", "bis", "entlang"], DAT_P = ["aus", "bei", "mit", "nach", "seit", "von", "zu", "gegenüber", "ab", "zum", "zur", "beim", "vom"], WEC_P = ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen", "im", "am", "ins", "ans"], GEN_P = ["wegen", "trotz", "während", "statt"];
  const TIMEW = /^(\d+([.:]\d+)?|uhr|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|wochenende|morgen|vormittag|mittag|nachmittag|abend|nacht|januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember|sommer|winter|frühling|herbst|jahr|ersten|zweiten|dritten|halb|viertel|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|tagen|wochen|monaten|jahren|minuten|stunden)$/;
  const DVERB = /^(hilf|helf|half|geholfen|dank|gedankt|gehör|gefall|gefäll|gefiel|gratulier|antwort|folg|glaub|pass|schmeck|fehl|vertrau|hör|begegn|rat|rät|verzeih|gehorch|widersprech|stimm)/;
  const words = (s) => String(s || "").replace(/[„“"«»()]/g, " ").split(/\s+/).map((w) => w.replace(/[.,!?;:…]+$/, "")).filter(Boolean);
  const low = (w) => w.toLowerCase().normalize("NFC");
  const uml = (w) => low(w).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  const lev = (a, b) => (window.Grade ? Grade.lev(a, b) : (a === b ? 0 : 9));
  const caseOf = (d) => (/^(den|einen|keinen|meinen|deinen|seinen|ihren|unseren|euren)$/.test(d) ? "akk" : /^(dem|einem|keinem|meinem|deinem|seinem|ihrem|unserem|eurem)$/.test(d) ? "dat" : null);
  const nounInfo = (w) => { const v = (window.DC && DC.vocab || []).find((x) => x.art && x.de.split(" ").slice(1).join(" ").toLowerCase() === low(w)); return v ? { art: v.art, de: v.de } : null; };

  /* classify one wrong word: given g, right w, with the right sentence around it */
  function classify(g, w, rightWords, i) {
    const G = low(g), W = low(w), prev = low(rightWords[i - 1] || ""), next = low(rightWords[i + 1] || ""), sentence = rightWords.map(low);
    if (G === W) return { topic: "capitals", why: `<b>${esc(w)}</b> – ${/^[A-ZÄÖÜ]/.test(w) ? (i === 0 ? "first word of the sentence" : "a noun or polite Sie") + ": capital letter" : "small letter here"}.` };
    if (uml(g) === uml(w)) return { topic: "umlauts", why: `Write the umlaut: <b>${esc(w)}</b>.` };
    // prepositions of time
    if (TIMEP.test(G) && TIMEP.test(W) && (TIMEW.test(next) || /^\d/.test(next))) return { topic: "time_prep", why: `<b>${esc(g)} → ${esc(w)}</b>: ${W === "um" ? "clock times take <b>um</b> (um acht Uhr)" : W === "am" ? "days and parts of the day take <b>am</b> (am Montag, am Abend)" : W === "im" ? "months and seasons take <b>im</b> (im Mai, im Winter)" : W === "in" ? "a time from now takes <b>in</b> (in zwei Tagen)" : `here it is <b>${esc(w)}</b>`}.` };
    // articles / determiners
    if (DET.test(G) && DET.test(W)) {
      const p = rightWords.slice(Math.max(0, i - 2), i).map(low).reverse().find((x) => AKK_P.includes(x) || DAT_P.includes(x) || WEC_P.includes(x) || GEN_P.includes(x));
      const noun = rightWords.slice(i + 1).find((x) => /^[A-ZÄÖÜ]/.test(x)); const ni = noun && nounInfo(noun);
      const c = caseOf(W);
      if (p && WEC_P.includes(p)) return { topic: "wechsel", why: `<b>${esc(p)}</b> + ${c === "akk" ? "Akkusativ – a direction (Wohin?)" : c === "dat" ? "Dativ – a place (Wo?)" : "the right case"} → <b>${esc(w)}${noun ? " " + esc(noun) : ""}</b>.` };
      if (p) return { topic: "prep_case", why: `<b>${esc(p)}</b> always takes the <b>${AKK_P.includes(p) ? "Akkusativ" : DAT_P.includes(p) ? "Dativ" : "Genitiv"}</b> → <b>${esc(w)}${noun ? " " + esc(noun) : ""}</b>.` };
      const dv = sentence.slice(0, i).find((x) => DVERB.test(x));
      if (dv && (c === "dat" || W === "der")) return { topic: "dativ_verbs", why: `<b>${esc(rightWords[sentence.indexOf(dv)])}</b> always takes the <b>Dativ</b> → <b>${esc(w)}${noun ? " " + esc(noun) : ""}</b>${ni ? ` (${esc(ni.de)})` : ""}.` };
      if (c === "akk") return { topic: "akkusativ", why: `The object is <b>Akkusativ</b>${ni ? ` and ${esc(ni.de)} is masculine` : ""} → <b>${esc(w)}${noun ? " " + esc(noun) : ""}</b>.` };
      if (c === "dat") return { topic: "dativ", why: `This is <b>Dativ</b> (Wem?) → <b>${esc(w)}${noun ? " " + esc(noun) : ""}</b>.` };
      if (/^(mein|dein|sein|ihr|unser|euer)/.test(W) && /^(mein|dein|sein|ihr|unser|euer)/.test(G) && G.slice(0, 3) !== W.slice(0, 3)) return { topic: "possessive", why: `<b>${esc(g)} → ${esc(w)}</b>: a different owner (mein = my, dein = your, sein = his, ihr = her/their).` };
      return { topic: ni ? "gender" : "gender", why: ni ? `<b>${esc(ni.de)}</b> – ${ { der: "masculine", die: "feminine", das: "neuter" }[ni.art]} → <b>${esc(w)}</b>.` : `The article is <b>${esc(w)}</b> here.` };
    }
    // personal pronouns as subject (ihr ↔ sie / Sie, du ↔ Sie)
    if (SUBJ.test(G) || /^sie$/i.test(g)) if (SUBJ.test(W) || W === "sie") return { topic: "pronoun", why: `<b>${esc(g)} → ${esc(w)}</b>: ${W === "sie" ? (w === "Sie" && i > 0 ? "polite you = <b>Sie</b>" : "„they“ / „she“ = <b>sie</b>") : W === "ihr" ? "you (all) = <b>ihr</b>" : `here the subject is <b>${esc(w)}</b>`} – the verb ending matches it.` };
    if (OBJP.test(G) && OBJP.test(W)) { const dv = sentence.find((x) => DVERB.test(x)); return { topic: dv ? "dativ_verbs" : "pronoun", why: `<b>${esc(g)} → ${esc(w)}</b>: ${/^(mir|dir|ihm|ihnen)$/.test(W) ? "Dativ" : "Akkusativ"} pronoun${dv ? ` (${esc(dv)}… + Dativ)` : ""}.` }; }
    // prepositions in general
    if ([...AKK_P, ...DAT_P, ...WEC_P, ...GEN_P].includes(G) && [...AKK_P, ...DAT_P, ...WEC_P, ...GEN_P].includes(W)) return { topic: "prep_case", why: `<b>${esc(g)} → ${esc(w)}</b>: a different preposition.` };
    // same word, other ending: verb or adjective
    const stem = (x) => x.replace(/(est|st|en|et|e|t|n|s|er|em|es)$/, "");
    if (G.length > 2 && stem(G) && (stem(G) === stem(W) || G.slice(0, Math.max(3, W.length - 3)) === W.slice(0, Math.max(3, W.length - 3)))) {
      const subj = sentence.find((x) => SUBJ.test(x));
      if (DET.test(prev) || /^(ist|sind|war|bin|bist|wird)$/.test(prev)) return { topic: "adj_end", why: `Ending: <b>${esc(w)}</b>${/^(ist|sind|war|bin|bist|wird)$/.test(prev) ? " – after " + esc(prev) + " no ending" : ` after <b>${esc(rightWords[i - 1])}</b>`}.` };
      if (subj || /^[a-zäöüß]+$/.test(w)) return { topic: "verb_end", why: `Verb ending: <b>${esc(w)}</b>${subj ? ` – it matches <b>${esc(subj)}</b>` : ""}.` };
    }
    if (lev(uml(g), uml(w)) <= Math.max(1, Math.floor(W.length / 3))) return { topic: "spelling", why: `Spelling: <b>${esc(w)}</b>.` };
    return { topic: "vocab", why: `<b>${esc(g)}</b> → <b>${esc(w)}</b>${(() => { const n = nounInfo(w); return n ? ` (${esc(n.de)})` : ""; })()}.` };
  }

  /* compare a typed sentence with the right one */
  function compare(given, answer) {
    const a = words(given), b = words(answer);
    if (!a.length) return { verdict: "empty", n: 0, items: [], topics: [] };
    const A = a.map(low), B = b.map(low);
    // only the order is different
    const sortJ = (x) => x.map(uml).sort().join(" ");
    if (sortJ(A) === sortJ(B) && A.join(" ") !== B.join(" ")) return { verdict: "order", n: 0, items: [{ topic: "word_order", why: "All the words are right – only the order is different." }], topics: ["word_order"], html: "" };
    // align (LCS on lower-case words)
    const dp = Array.from({ length: A.length + 1 }, () => Array(B.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = uml(A[i]) === uml(B[j]) && A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0; const ops = [];
    while (i < A.length || j < B.length) {
      if (i < A.length && j < B.length && A[i] === B[j]) { ops.push(["=", a[i], b[j], j]); i++; j++; }
      else if (j < B.length && (i >= A.length || dp[i][j + 1] >= dp[i + 1][j])) { ops.push(["+", null, b[j], j]); j++; }
      else { ops.push(["-", a[i], null, j]); i++; }
    }
    // pair a deletion with the neighbouring insertion = a substitution
    const pairs = []; const used = new Set();
    for (let k = 0; k < ops.length; k++) {
      if (used.has(k) || ops[k][0] === "=") continue;
      const o = ops[k]; let m = -1;
      for (let x = k + 1; x < ops.length && ops[x][0] !== "="; x++) if (!used.has(x) && ops[x][0] !== o[0]) { m = x; break; }
      if (m >= 0) { used.add(k); used.add(m); const del = o[0] === "-" ? o : ops[m], ins = o[0] === "+" ? o : ops[m]; pairs.push({ g: del[1], w: ins[2], j: ins[3] }); }
      else { used.add(k); pairs.push(o[0] === "+" ? { g: null, w: o[2], j: o[3] } : { g: o[1], w: null, j: o[3] }); }
    }
    // capital letters of otherwise equal words
    const caps = []; ops.filter((o) => o[0] === "=" && o[1] !== o[2] && low(o[1]) === low(o[2])).forEach((o) => caps.push({ g: o[1], w: o[2], j: o[3] }));
    const items = pairs.map((p) => (p.g && p.w ? Object.assign({ g: p.g, w: p.w }, classify(p.g, p.w, b, p.j)) : { g: p.g, w: p.w, topic: "missing", why: p.w ? `Missing word: <b>${esc(p.w)}</b>.` : `One word too many: <b>${esc(p.g)}</b>.` }));
    caps.forEach((c) => items.push(Object.assign({ g: c.g, w: c.w, minor: true }, classify(c.g, c.w, b, c.j))));
    const real = items.filter((x) => !x.minor && x.topic !== "capitals");
    const n = real.length;
    const verdict = n === 0 ? (items.length ? "right" : "right") : n === 1 ? "almost" : n <= 3 ? "few" : "wrong";
    // the sentence with marks
    const bad = new Set(pairs.filter((p) => p.g).map((p) => p.g));
    const html = `<span class="fb-you">${a.map((x) => (bad.has(x) ? `<del>${esc(x)}</del>` : esc(x))).join(" ")}</span> → <b class="fb-right">${b.map((x, k) => (pairs.some((p) => p.w === x && p.j === k) ? `<mark>${esc(x)}</mark>` : esc(x))).join(" ")}</b>`;
    return { verdict, n, items, topics: sortTopics(real.map((x) => x.topic)), html };
  }

  /* grammar topics first, then spelling / word choice / capitals – a mistake is filed under its most useful topic */
  const LAST = ["vocab", "missing", "spelling", "umlauts", "capitals"];
  function sortTopics(list) { return [...new Set(list.filter(Boolean))].sort((a, b) => LAST.indexOf(a) - LAST.indexOf(b)); }
  /* the feedback block: verdict, marked sentence, one line per mistake with its topic and rule link */
  function feedbackHtml(d) {
    if (!d || d.verdict === "empty") return "";
    const head = { right: "", order: `<p class="dg-verdict almost">🟡 ${H.bi("Fast!", "Almost")} – right words, only the order</p>`, almost: `<p class="dg-verdict almost">🟡 ${H.bi("Fast!", "Almost")} – 1 word to fix</p>`, few: `<p class="dg-verdict few">🟠 ${d.n} words to fix</p>`, wrong: "" }[d.verdict];
    const lines = d.items.filter((x) => !x.minor || d.verdict === "right").slice(0, 6).map((x) => { const t = T[x.topic] || T.vocab; return `<li>${x.why} <span class="dg-topic">${esc(t.title)}</span>${t.ref ? ` <button class="link" data-go="cases/${t.ref}">📘 rule</button>` : t.gens.length ? ` <button class="link" data-go="revise/${t.gens[0]}">📘 rule</button>` : ""}</li>`; }).join("");
    return `<div class="dg">${head}${d.html && d.verdict !== "order" ? `<p class="dg-diff">${d.html}</p>` : ""}${lines ? `<ul class="dg-list">${lines}</ul>` : ""}</div>`;
  }
  /* a tip that belongs to the sentence (shown after answering): Dativ verbs, case prepositions, time words */
  function tipFor(answer) {
    const w = words(answer).map(low); const out = [];
    const dv = w.find((x) => DVERB.test(x) && !/^(pass|hör|stimm|glaub|rat)$/.test(x.slice(0, 4)));
    if (dv) out.push(`<b>${esc(dv)}</b>… + <b>Dativ</b> <button class="link" data-go="cases/dverbs">all Dativ verbs</button>`);
    const p = w.find((x, k) => (AKK_P.includes(x) || DAT_P.includes(x)) && x !== "um" && x !== "bis" && DET.test(w[k + 1] || ""));
    if (p) out.push(`<b>${esc(p)}</b> + <b>${AKK_P.includes(p) ? "Akkusativ" : "Dativ"}</b> <button class="link" data-go="cases/preps">all prepositions</button>`);
    const t = w.find((x, k) => /^(um|am|im)$/.test(x) && TIMEW.test(w[k + 1] || ""));
    if (t) out.push(`<b>${t}</b> ${t === "um" ? "+ clock time" : t === "am" ? "+ day / part of the day" : "+ month / season"} <button class="link" data-go="cases/time">time words</button>`);
    return out.length ? `<p class="dg-tip">💡 ${out.join(" · ")}</p>` : "";
  }

  window.Diag = { compare, feedbackHtml, tipFor, sortTopics, TOPICS: T, GEN2TOPIC, LESSON2TOPIC, title: (id) => (T[id] || { title: id }).title, topicOfIssue: (iss) => (/capital/i.test(iss.rule + iss.why) ? "capitals" : /English/.test(iss.why || "") ? "vocab" : LESSON2TOPIC[iss.lesson] || (iss.lesson === 0 ? "vocab" : null)) };

  /* ---------- the "Which case?" reference ---------- */
  const tbl = (rows) => (window.UI ? UI.table(rows, "cases-t") : "");
  window.Views = window.Views || {};
  window.Views.cases = (el, [sect]) => {
    el.innerHTML = `<button class="back" data-go="grammar">‹ Grammar</button><h2 class="page-title">${H.bi("Welcher Fall?", "Which case? – Dativ, Akkusativ & co.")}</h2>
      <nav class="chips cases-nav">${[["akk", "Akkusativ"], ["dat", "Dativ"], ["dverbs", "Dativ verbs"], ["both", "Dativ + Akkusativ"], ["preps", "Prepositions"], ["wechsel", "Wo? / Wohin?"], ["time", "Time words"], ["gender", "Articles"], ["pron", "Pronouns"]].map(([k, t]) => `<button class="chip" data-jump="${k}">${t}</button>`).join("")}</nav>
      <section class="card" id="cs-overview"><h3>The four cases in one table</h3>${tbl([["", "masculine", "feminine", "neuter", "plural"], ["Nominativ (Wer?)", "der / ein", "die / eine", "das / ein", "die / –"], ["Akkusativ (Wen? Was?)", "**den / einen**", "die / eine", "das / ein", "die / –"], ["Dativ (Wem?)", "**dem / einem**", "**der / einer**", "**dem / einem**", "**den** / – + **n**"], ["Genitiv (Wessen?)", "des / eines + s", "der / einer", "des / eines + s", "der / –"]])}
        <p class="muted small">Memory trick: in the Akkusativ only the masculine changes (der → den). The Dativ ends in <b>-m</b> for der/das (dem, einem, meinem) and <b>-r</b> for die (der, einer).</p></section>
      <section class="card" id="cs-akk"><h3>Akkusativ – the direct object</h3><p>${T.akkusativ.rule}</p><p class="ex">Ich kaufe <b>den</b> Tisch. · Ich sehe <b>einen</b> Hund. · Hast du <b>keinen</b> Hunger?</p>
        <p><b>Most verbs</b> take an Akkusativ object: haben, sehen, kaufen, brauchen, besuchen, fragen, kennen, lieben, suchen, finden, trinken, essen, lesen, nehmen, bestellen, bezahlen, anrufen, einladen, verstehen.</p>
        <p><b>es gibt</b> + Akkusativ: Es gibt <b>einen</b> Park.</p></section>
      <section class="card" id="cs-dat"><h3>Dativ – the person who gets something</h3><p>${T.dativ.rule}</p><p class="ex">Ich gebe <b>dem</b> Kind einen Apfel. · Das Buch gehört <b>meiner</b> Schwester. · Ich helfe <b>den</b> Kinder<b>n</b>.</p></section>
      <section class="card" id="cs-dverbs"><h3>Verbs that ALWAYS take the Dativ</h3>
        ${tbl([["verb", "example"], ["helfen", "Ich helfe **dir**."], ["danken", "Wir danken **der** Frau."], ["gehören", "Das Auto gehört **meinem** Vater."], ["gefallen", "Die Wohnung gefällt **mir**."], ["gratulieren", "Ich gratuliere **dir** zum Geburtstag."], ["antworten", "Bitte antworte **mir** bald."], ["folgen", "Folgen Sie **dem** Weg."], ["glauben (jdm.)", "Ich glaube **dir**."], ["passen", "Die Hose passt **mir** nicht."], ["schmecken", "Schmeckt **dir** die Suppe?"], ["fehlen", "Du fehlst **mir**."], ["vertrauen", "Ich vertraue **meinem** Freund."], ["zuhören", "Hör **mir** zu!"], ["wehtun", "Der Kopf tut **mir** weh."], ["begegnen", "Ich bin **ihm** begegnet."], ["raten", "Ich rate **dir**, früh zu kommen."]])}
        <p class="muted small">Also: es geht <b>mir</b> gut · <b>mir</b> ist kalt · <b>mir</b> ist langweilig.</p></section>
      <section class="card" id="cs-both"><h3>Dativ + Akkusativ – give somebody something</h3><p>Person = <b>Dativ</b>, thing = <b>Akkusativ</b>: geben, schenken, zeigen, schicken, bringen, erklären, leihen, empfehlen, kaufen (jdm. etw.), schreiben.</p>
        <p class="ex">Ich schenke <b>meiner</b> Mutter <b>einen</b> Schal. · Kannst du <b>mir</b> <b>das</b> Foto zeigen?</p><p class="muted small">Order: two nouns → Dativ before Akkusativ; a pronoun for the thing comes first: Ich gebe <b>es</b> <b>dem</b> Mann.</p></section>
      <section class="card" id="cs-preps"><h3>Prepositions with a fixed case</h3>${tbl([["case", "prepositions", "example"], ["**Akkusativ**", "durch, für, gegen, ohne, um, bis, entlang", "für **den** Freund, ohne **meinen** Sohn"], ["**Dativ**", "aus, bei, mit, nach, seit, von, zu, gegenüber, ab", "mit **dem** Bus, zu**r** Arbeit, beim Arzt"], ["**Genitiv**", "wegen, trotz, während, statt", "wegen **des** Regens"]])}
        <p class="muted small">Memory tricks: Akkusativ – „<b>DOGFU</b>“ (durch, ohne, gegen, für, um). Dativ – sing „aus, bei, mit, nach, seit, von, zu“ to the melody of a song you know. Short forms: zu dem = <b>zum</b>, zu der = <b>zur</b>, bei dem = <b>beim</b>, von dem = <b>vom</b>.</p></section>
      <section class="card" id="cs-wechsel"><h3>Wo? or Wohin? – the nine two-way prepositions</h3><p>${T.wechsel.rule}</p>${tbl([["Wo? → Dativ", "Wohin? → Akkusativ"], ["Ich bin **im** Park.", "Ich gehe **in den** Park."], ["Das Buch liegt **auf dem** Tisch.", "Ich lege das Buch **auf den** Tisch."], ["Das Bild hängt **an der** Wand.", "Ich hänge das Bild **an die** Wand."]])}<p class="muted small">Verb pairs: liegen/legen, stehen/stellen, sitzen/setzen, hängen/hängen – the first is Wo? (Dativ), the second Wohin? (Akkusativ).</p></section>
      <section class="card" id="cs-time"><h3>Time words: um, am, im, in …</h3>${tbl([["word", "use", "example"], ["**um**", "clock time", "um acht Uhr, um halb neun"], ["**am**", "day, part of the day, date, weekend", "am Montag, am Abend, am 3. Mai, am Wochenende"], ["**im**", "month, season", "im Mai, im Winter"], ["**in**", "a time from now", "in zwei Tagen, in einer Woche"], ["**vor**", "a time ago", "vor zwei Jahren"], ["**seit**", "since / for (until now)", "seit drei Monaten"], ["**von … bis**", "from … to", "von neun bis fünf"], ["(none)", "years", "2020 – or im Jahr 2020 (not „in 2020“)"]])}
        <p class="muted small">Exception: in der Nacht · in der Woche (but am Wochenende).</p></section>
      <section class="card" id="cs-gender"><h3>Articles: der, die or das?</h3><p>${T.gender.rule}</p><p>Mostly <b>der</b>: days, months, seasons, -er people (der Lehrer), -ling, -ismus · mostly <b>die</b>: -e (die Lampe), -ung, -heit, -keit, -schaft, -ion, -tät, -ik · always <b>das</b>: -chen, -lein, infinitives as nouns (das Essen), mostly -um, -ment.</p></section>
      <section class="card" id="cs-pron"><h3>Pronouns in all cases</h3>${tbl([["Nominativ", "Akkusativ", "Dativ"], ["ich", "mich", "mir"], ["du", "dich", "dir"], ["er", "ihn", "ihm"], ["sie (she)", "sie", "ihr"], ["es", "es", "ihm"], ["wir", "uns", "uns"], ["ihr (you all)", "euch", "euch"], ["sie (they) / Sie", "sie / Sie", "ihnen / Ihnen"]])}<p class="muted small">${T.pronoun.rule}</p></section>
      <div class="row"><button class="btn sign" data-go="practice/dativ">▶ Practise Dativ</button><button class="btn" data-go="practice/akkusativ">▶ Practise Akkusativ</button><button class="btn ghost" data-go="practice/praepositionen">▶ Prepositions</button><button class="btn ghost" data-go="practice/zeitpraep">▶ Time words</button></div>`;
    el.querySelectorAll("[data-jump]").forEach((b) => (b.onclick = () => { const t = el.querySelector("#cs-" + b.dataset.jump); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    if (sect) setTimeout(() => { const t = el.querySelector("#cs-" + sect); if (t) { t.scrollIntoView({ block: "start" }); t.classList.add("flash-hl"); } }, 60);
  };
})();
