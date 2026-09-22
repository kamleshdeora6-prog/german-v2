/* Deutsch Coach – sentence engine.
   Builds grammatically correct German sentences from a small tagged lexicon and turns them into
   exercises. Every item carries the reasoning: why the answer is right and why each wrong option is wrong. */
(function () {
  "use strict";
  const R = {
    pick: (a) => a[Math.floor(Math.random() * a.length)],
    shuffle: (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    cap: (s) => s.charAt(0).toUpperCase() + s.slice(1),
  };
  const G = { m: "masculine (der)", f: "feminine (die)", n: "neuter (das)", pl: "plural (die)" };
  const CASE_NAME = { nom: "Nominativ", akk: "Akkusativ", dat: "Dativ", gen: "Genitiv" };

  // ---------------- lexicon ----------------
  // [word, gender, plural, english, tags, weakForm?]
  const NOUNS = [
    ["Tisch", "m", "Tische", "table", "buy see repair place_on place_under"], ["Stuhl", "m", "Stühle", "chair", "buy see repair place_on"],
    ["Computer", "m", "Computer", "computer", "buy see repair use"], ["Apfel", "m", "Äpfel", "apple", "buy see eat"],
    ["Kaffee", "m", "Kaffees", "coffee", "buy drink order"], ["Schlüssel", "m", "Schlüssel", "key", "see forget find"],
    ["Brief", "m", "Briefe", "letter", "read write see"], ["Hund", "m", "Hunde", "dog", "see find"],
    ["Film", "m", "Filme", "film", "see"], ["Kuchen", "m", "Kuchen", "cake", "buy eat order"],
    ["Pullover", "m", "Pullover", "jumper", "buy wear wash"], ["Kühlschrank", "m", "Kühlschränke", "fridge", "buy repair open"],
    ["Lampe", "f", "Lampen", "lamp", "buy see repair place_on"], ["Tasche", "f", "Taschen", "bag", "buy see forget find wear"],
    ["Wohnung", "f", "Wohnungen", "flat", "see find rent"], ["Zeitung", "f", "Zeitungen", "newspaper", "buy read"],
    ["Jacke", "f", "Jacken", "jacket", "buy wear wash forget"], ["Tür", "f", "Türen", "door", "open see"],
    ["Uhr", "f", "Uhren", "watch", "buy repair forget wear"], ["Suppe", "f", "Suppen", "soup", "eat order"],
    ["Katze", "f", "Katzen", "cat", "see find"], ["Milch", "f", "-", "milk", "buy drink"],
    ["Buch", "n", "Bücher", "book", "buy read see forget find write"], ["Auto", "n", "Autos", "car", "buy see repair wash"],
    ["Handy", "n", "Handys", "mobile phone", "buy repair forget find use"], ["Fahrrad", "n", "Fahrräder", "bike", "buy repair wash see"],
    ["Bild", "n", "Bilder", "picture", "see buy"], ["Geschenk", "n", "Geschenke", "present", "buy find open"],
    ["Fenster", "n", "Fenster", "window", "open see"], ["Brot", "n", "Brote", "bread", "buy eat"],
    ["Ticket", "n", "Tickets", "ticket", "buy forget find"], ["Wasser", "n", "-", "water", "buy drink order"],
    ["Sofa", "n", "Sofas", "sofa", "buy see place_on"], ["Bett", "n", "Betten", "bed", "buy see place_on place_under"],
    ["Bus", "m", "Busse", "bus", "ride"], ["Zug", "m", "Züge", "train", "ride"], ["Park", "m", "Parks", "park", "place"], ["Bahnhof", "m", "Bahnhöfe", "station", "place"],
    ["Supermarkt", "m", "Supermärkte", "supermarket", "place"], ["Termin", "m", "Termine", "appointment", "x"], ["Urlaub", "m", "Urlaube", "holiday", "x"], ["Regen", "m", "-", "rain", "x"],
    ["Stadt", "f", "Städte", "city", "place"], ["Arbeit", "f", "Arbeiten", "work", "x"], ["Schule", "f", "Schulen", "school", "place"], ["U-Bahn", "f", "U-Bahnen", "underground", "ride"],
    ["Post", "f", "-", "post office", "place"], ["Bank", "f", "Banken", "bank", "place"], ["Straße", "f", "Straßen", "street", "place"], ["Küche", "f", "Küchen", "kitchen", "place"],
    ["Kino", "n", "Kinos", "cinema", "place"], ["Büro", "n", "Büros", "office", "place"], ["Haus", "n", "Häuser", "house", "place"], ["Hotel", "n", "Hotels", "hotel", "place"],
    ["Restaurant", "n", "Restaurants", "restaurant", "place"], ["Wetter", "n", "-", "weather", "x"], ["Zimmer", "n", "Zimmer", "room", "place"], ["Essen", "n", "-", "food", "x"],
  ].map(([de, g, pl, en, tags, wf]) => ({ de, g, pl, en, tags: tags.split(" "), wf }));

  const PEOPLE = [
    ["Mann", "m", "Männer", "man"], ["Frau", "f", "Frauen", "woman"], ["Kind", "n", "Kinder", "child"],
    ["Lehrer", "m", "Lehrer", "teacher"], ["Lehrerin", "f", "Lehrerinnen", "teacher"],
    ["Kollege", "m", "Kollegen", "colleague", "Kollegen"], ["Kollegin", "f", "Kolleginnen", "colleague"],
    ["Nachbar", "m", "Nachbarn", "neighbour", "Nachbarn"], ["Nachbarin", "f", "Nachbarinnen", "neighbour"],
    ["Student", "m", "Studenten", "student", "Studenten"], ["Junge", "m", "Jungen", "boy", "Jungen"],
    ["Kunde", "m", "Kunden", "customer", "Kunden"], ["Mädchen", "n", "Mädchen", "girl"],
    ["Arzt", "m", "Ärzte", "doctor"], ["Ärztin", "f", "Ärztinnen", "doctor"], ["Chef", "m", "Chefs", "boss"],
    ["Freund", "m", "Freunde", "friend"], ["Freundin", "f", "Freundinnen", "friend"],
  ].map(([de, g, pl, en, wf]) => ({ de, g, pl, en, wf, person: true, tags: ["person"] }));

  const ART = {
    def: { nom: { m: "der", f: "die", n: "das", pl: "die" }, akk: { m: "den", f: "die", n: "das", pl: "die" }, dat: { m: "dem", f: "der", n: "dem", pl: "den" }, gen: { m: "des", f: "der", n: "des", pl: "der" } },
    indef: { nom: { m: "ein", f: "eine", n: "ein", pl: "" }, akk: { m: "einen", f: "eine", n: "ein", pl: "" }, dat: { m: "einem", f: "einer", n: "einem", pl: "" }, gen: { m: "eines", f: "einer", n: "eines", pl: "" } },
  };
  const POSS_END = { nom: { m: "", f: "e", n: "", pl: "e" }, akk: { m: "en", f: "e", n: "", pl: "e" }, dat: { m: "em", f: "er", n: "em", pl: "en" }, gen: { m: "es", f: "er", n: "es", pl: "er" } };
  function art(kind, c, g) {
    if (kind === "def" || kind === "indef") return ART[kind][c][g];
    const stem = kind === "kein" ? "kein" : kind; // possessive stems: mein, dein, sein, ihr, unser, eur
    const end = POSS_END[c][g];
    if (stem === "eur" && end === "") return "euer";
    return stem + end;
  }
  function nounForm(n, c, plural) {
    if (plural) { if (c === "dat" && !/[ns]$/.test(n.pl)) return n.pl + "n"; return n.pl; }
    if (n.wf && c !== "nom") return n.wf;
    if (c === "gen" && (n.g === "m" || n.g === "n")) return /[sßzx]$|sch$/.test(n.de) || n.de.length <= 4 ? n.de + "es" : n.de + "s";
    return n.de;
  }
  function np(n, c, kind = "def", plural = false) {
    const g = plural ? "pl" : n.g;
    const a = art(kind, c, g);
    return (a ? a + " " : "") + nounForm(n, c, plural);
  }
  function whyArticle(n, c, kind, reason) {
    const a = art(kind, c, n.g);
    let s = `<b>${n.de}</b> is ${G[n.g]}. ${reason} → <b>${CASE_NAME[c]}</b>. ${CASE_NAME[c]} ${n.g === "m" ? "masculine" : n.g === "f" ? "feminine" : "neuter"} = <b>${a}</b>.`;
    if (n.wf && c !== "nom") s += ` <br><b>${n.de}</b> is an n-noun (n-Deklination): outside the Nominativ it becomes <b>${n.wf}</b>.`;
    return s;
  }

  // ---------------- verbs ----------------
  const SUBJ = [
    { de: "ich", p: "1s", en: "I", refl: ["mich", "mir"], poss: "mein" }, { de: "du", p: "2s", en: "you", refl: ["dich", "dir"], poss: "dein" },
    { de: "er", p: "3s", en: "he", refl: ["sich", "sich"], poss: "sein" }, { de: "sie", p: "3s", en: "she", refl: ["sich", "sich"], poss: "ihr" },
    { de: "wir", p: "1p", en: "we", refl: ["uns", "uns"], poss: "unser" }, { de: "ihr", p: "2p", en: "you (all)", refl: ["euch", "euch"], poss: "eur" },
    { de: "sie", p: "3p", en: "they", refl: ["sich", "sich"], poss: "ihr", plural: true },
  ];
  const END = { "1s": "e", "2s": "st", "3s": "t", "1p": "en", "2p": "t", "3p": "en" };
  const IRR = {
    sein: { "1s": "bin", "2s": "bist", "3s": "ist", "1p": "sind", "2p": "seid", "3p": "sind" },
    haben: { "1s": "habe", "2s": "hast", "3s": "hat", "1p": "haben", "2p": "habt", "3p": "haben" },
    werden: { "1s": "werde", "2s": "wirst", "3s": "wird", "1p": "werden", "2p": "werdet", "3p": "werden" },
    wissen: { "1s": "weiß", "2s": "weißt", "3s": "weiß", "1p": "wissen", "2p": "wisst", "3p": "wissen" },
    können: { "1s": "kann", "2s": "kannst", "3s": "kann", "1p": "können", "2p": "könnt", "3p": "können" },
    müssen: { "1s": "muss", "2s": "musst", "3s": "muss", "1p": "müssen", "2p": "müsst", "3p": "müssen" },
    wollen: { "1s": "will", "2s": "willst", "3s": "will", "1p": "wollen", "2p": "wollt", "3p": "wollen" },
    dürfen: { "1s": "darf", "2s": "darfst", "3s": "darf", "1p": "dürfen", "2p": "dürft", "3p": "dürfen" },
    sollen: { "1s": "soll", "2s": "sollst", "3s": "soll", "1p": "sollen", "2p": "sollt", "3p": "sollen" },
    möchten: { "1s": "möchte", "2s": "möchtest", "3s": "möchte", "1p": "möchten", "2p": "möchtet", "3p": "möchten" },
  };
  const PRET = { sein: "war", haben: "hatte", können: "konnte", müssen: "musste", wollen: "wollte", dürfen: "durfte", sollen: "sollte", werden: "wurde" };
  const PRET_END = { "1s": "", "2s": "st", "3s": "", "1p": "n", "2p": "t", "3p": "n" };
  const KII = { sein: "wäre", haben: "hätte", werden: "würde", können: "könnte", müssen: "müsste", dürfen: "dürfte" };

  // inf, english [base, 3s, past participle], stem-change stem (du/er), aux, participle, separable prefix, object {case, tag}
  const V = [
    ["kaufen", "buy,buys,bought", null, "haben", "gekauft", null, "akk", "buy"],
    ["sehen", "see,sees,seen", "sieh", "haben", "gesehen", null, "akk", "see"],
    ["suchen", "look for,looks for,looked for", null, "haben", "gesucht", null, "akk", "find"],
    ["finden", "find,finds,found", null, "haben", "gefunden", null, "akk", "find"],
    ["nehmen", "take,takes,taken", "nimm", "haben", "genommen", null, "akk", "buy"],
    ["lesen", "read,reads,read", "lies", "haben", "gelesen", null, "akk", "read"],
    ["essen", "eat,eats,eaten", "iss", "haben", "gegessen", null, "akk", "eat"],
    ["trinken", "drink,drinks,drunk", null, "haben", "getrunken", null, "akk", "drink"],
    ["bestellen", "order,orders,ordered", null, "haben", "bestellt", null, "akk", "order"],
    ["reparieren", "repair,repairs,repaired", null, "haben", "repariert", null, "akk", "repair"],
    ["öffnen", "open,opens,opened", null, "haben", "geöffnet", null, "akk", "open"],
    ["waschen", "wash,washes,washed", "wäsch", "haben", "gewaschen", null, "akk", "wash"],
    ["vergessen", "forget,forgets,forgotten", "vergiss", "haben", "vergessen", null, "akk", "forget"],
    ["brauchen", "need,needs,needed", null, "haben", "gebraucht", null, "akk", "buy"],
    ["besuchen", "visit,visits,visited", null, "haben", "besucht", null, "akk", "person"],
    ["fragen", "ask,asks,asked", null, "haben", "gefragt", null, "akk", "person"],
    ["anrufen", "call,calls,called", null, "haben", "angerufen", "an", "akk", "person"],
    ["einladen", "invite,invites,invited", "läd", "haben", "eingeladen", "ein", "akk", "person"],
    ["treffen", "meet,meets,met", "triff", "haben", "getroffen", null, "akk", "person"],
    ["helfen", "help,helps,helped", "hilf", "haben", "geholfen", null, "dat", "person"],
    ["danken", "thank,thanks,thanked", null, "haben", "gedankt", null, "dat", "person"],
    ["antworten", "answer,answers,answered", null, "haben", "geantwortet", null, "dat", "person"],
    ["zuhören", "listen to,listens to,listened to", null, "haben", "zugehört", "zu", "dat", "person"],
    ["gratulieren", "congratulate,congratulates,congratulated", null, "haben", "gratuliert", null, "dat", "person"],
    ["fahren", "go,goes,gone", "fähr", "sein", "gefahren", null, null, "move"],
    ["gehen", "go,goes,gone", null, "sein", "gegangen", null, null, "move"],
    ["fliegen", "fly,flies,flown", null, "sein", "geflogen", null, null, "move"],
    ["kommen", "come,comes,come", null, "sein", "gekommen", null, null, "move"],
    ["laufen", "run,runs,run", "läuf", "sein", "gelaufen", null, null, "move"],
    ["aufstehen", "get up,gets up,got up", null, "sein", "aufgestanden", "auf", null, "time"],
    ["einschlafen", "fall asleep,falls asleep,fallen asleep", "schläf", "sein", "eingeschlafen", "ein", null, "time"],
    ["arbeiten", "work,works,worked", null, "haben", "gearbeitet", null, null, "plain"],
    ["schlafen", "sleep,sleeps,slept", "schläf", "haben", "geschlafen", null, null, "plain"],
    ["kochen", "cook,cooks,cooked", null, "haben", "gekocht", null, null, "plain"],
    ["lernen", "study,studies,studied", null, "haben", "gelernt", null, null, "plain"],
    ["tanzen", "dance,dances,danced", null, "haben", "getanzt", null, null, "plain"],
    ["warten", "wait,waits,waited", null, "haben", "gewartet", null, null, "plain"],
    ["einkaufen", "go shopping,goes shopping,gone shopping", null, "haben", "eingekauft", "ein", null, "plain"],
    ["fernsehen", "watch TV,watches TV,watched TV", "sieh", "haben", "ferngesehen", "fern", null, "plain"],
  ].map(([inf, en, ch, aux, pp, sep, obj, tag]) => ({ inf, en: en.split(","), ch, aux, pp, sep, obj, tag }));
  const VERB = Object.fromEntries(V.map((v) => [v.inf, v]));

  function stemOf(v) { let s = v.sep ? v.inf.slice(v.sep.length) : v.inf; return s.replace(/e?n$/, ""); }
  function conj(v, p) {
    if (typeof v === "string") v = VERB[v] || { inf: v };
    if (IRR[v.inf]) return IRR[v.inf][p];
    let stem = stemOf(v);
    if (v.ch && (p === "2s" || p === "3s")) stem = v.ch;
    let e = END[p];
    if (/[^e](er|el)$/.test(stem) && /(eln|ern)$/.test(v.inf)) { if (p === "1p" || p === "3p") return stem + "n"; }
    const needE = /(t|d)$/.test(stem) || /[^aeiouäöülrh]n$/.test(stem) || /[^aeiouäöülrh]m$/.test(stem);
    if (needE && !(v.ch && (p === "2s" || p === "3s")) && (p === "2s" || p === "3s" || p === "2p")) e = "e" + e;
    if (p === "2s" && /[sßzx]$/.test(stem)) e = "t";
    if (v.ch === "läd" && p === "3s") return "lädt";
    if (v.ch === "läd" && p === "2s") return "lädst";
    if (v.ch && /t$/.test(stem) && p === "3s") e = "";
    return stem + e;
  }
  function conjSplit(v, p) { const f = conj(v, p); return v.sep ? [f, v.sep] : [f, ""]; }
  function pret(inf, p) { return PRET[inf] + PRET_END[p]; }
  function kii(inf, p) { const b = KII[inf]; return b + (p === "2s" ? "st" : p === "1p" || p === "3p" ? "n" : p === "2p" ? "t" : ""); }
  function en3(v, s) { return s.p === "3s" ? v.en[1] : v.en[0]; }
  function enBe(s) { return s.p === "1s" ? "am" : s.p === "3s" ? "is" : "are"; }

  const TIMES = [["heute", "today"], ["morgen", "tomorrow"], ["am Montag", "on Monday"], ["am Abend", "in the evening"], ["jeden Tag", "every day"], ["am Wochenende", "at the weekend"], ["um acht Uhr", "at eight o'clock"]];
  const PAST = [["gestern", "yesterday"], ["letzte Woche", "last week"], ["am Samstag", "on Saturday"], ["vorgestern", "the day before yesterday"]];
  const DEST = [["nach Berlin", "to Berlin"], ["nach Hause", "home"], ["in die Stadt", "into town"], ["ins Kino", "to the cinema"], ["zur Arbeit", "to work"], ["zum Arzt", "to the doctor"], ["in den Park", "to the park"]];
  const objs = (tag) => (tag === "person" ? PEOPLE : NOUNS.filter((n) => n.tags.includes(tag)));
  let lastSubj = null;
  function randSubj(opts = {}) { let s = R.pick(SUBJ); if (opts.noPl && s.plural) s = SUBJ[0]; lastSubj = s; return s; }
  const an = (w) => (/^[aeiou]/i.test(w) ? "an " : "a ") + w;
  function subjNoun() { const n = R.pick(PEOPLE); return { de: np(n, "nom"), p: "3s", en: "the " + n.en, noun: n }; }

  // simple clause (present): returns parts for word order manipulations
  function clause(opts = {}) {
    const tags = opts.tags || ["buy", "see", "person", "move", "plain", "eat", "read"];
    const pool = V.filter((v) => tags.includes(v.tag) && (!opts.noSep || !v.sep) && (!opts.dat || v.obj === "dat"));
    const v = R.pick(pool);
    const s = opts.subj || (Math.random() < 0.25 && !opts.pronounOnly ? subjNoun() : randSubj());
    let obj = "", objEn = "", o = null, okind = "";
    if (v.obj) {
      o = R.pick(objs(v.tag));
      const kind = o.person ? "def" : R.pick(["def", "indef"]); okind = kind;
      obj = np(o, v.obj, kind); objEn = (kind === "def" ? "the " : /^[aeiou]/.test(o.en) ? "an " : "a ") + o.en;
      if (["Milch", "Wasser", "Kaffee"].includes(o.de) && kind === "indef") { obj = v.obj === "akk" && o.g === "m" ? "einen Kaffee" : o.de; objEn = o.en; }
    } else if (v.tag === "move") { const d = R.pick(DEST); obj = d[0]; objEn = d[1]; }
    const [fin, pre] = conjSplit(v, s.p);
    const time = opts.time || R.pick(TIMES);
    return { v, s, fin, pre, obj, objEn, time, o, okind,
      main: () => [R.cap(s.de), fin, time[0], obj, pre].filter(Boolean).join(" ") + ".",
      endClause: () => [s.de, time[0], obj, (pre || "") + fin].filter(Boolean).join(" "),
      en: () => `${R.cap(s.en)} ${v.tag === "move" && v.inf === "fahren" ? (s.p === "3s" ? "goes" : "go") : en3(v, s)}${objEn ? " " + objEn : ""} ${time[1]}.`,
    };
  }

  // ---------------- item helpers ----------------
  function choice(topic, lesson, prompt, answer, options, why, whyNot = {}, extra = {}) {
    const opts = R.shuffle([...new Set([answer, ...options])]);
    return Object.assign({ kind: "choice", topic, lesson, prompt, answer, options: opts, why, whyNot }, extra);
  }
  function input(topic, lesson, prompt, answer, why, extra = {}) { return Object.assign({ kind: "input", topic, lesson, prompt, answer, why }, extra); }
  function order(topic, lesson, prompt, sentence, why, extra = {}) {
    const words = sentence.replace(/[.!?]$/, "").split(" ");
    return Object.assign({ kind: "order", topic, lesson, prompt, answer: sentence, tokens: R.shuffle(words.map((w, i) => (i === 0 && !/^[A-ZÄÖÜ][a-zäöüß]*[a-z]/.test(w) ? w : w))), why }, extra);
  }
  const blank = "_____";
  const wrongArts = (right, c) => ["der", "die", "das", "den", "dem", "des"].filter((x) => x !== right).slice(0, 6);

  // ---------------- generators ----------------
  const GEN = {};
  function def(id, meta, fn) { GEN[id] = Object.assign({ id, fn }, meta); }

  def("sein_haben", { title: "sein & haben", level: "A1", lessons: [1] }, () => {
    const s = randSubj();
    if (Math.random() < 0.5) {
      const adj = R.pick([["müde", "tired"], ["krank", "ill"], ["zu Hause", "at home"], ["28 Jahre alt", "28 years old"], ["aus Indien", "from India"]]);
      const a = IRR.sein[s.p];
      return choice("sein_haben", 1, `${R.cap(s.de)} ${blank} ${adj[0]}.`, a, [IRR.haben[s.p], IRR.sein[s.p === "1s" ? "3s" : "1s"]],
        `Age, origin, states (${adj[0]}) use <b>sein</b>. Subject <b>${s.de}</b> → <b>${a}</b>.`, { [IRR.haben[s.p]]: "haben is for possession (Ich habe Hunger / ein Auto), not for age or states.", }, { en: `${R.cap(s.en)} ${enBe(s)} ${adj[1]}.` });
    }
    const o = R.pick(NOUNS.filter((n) => n.tags.includes("buy")));
    const a = IRR.haben[s.p];
    return choice("sein_haben", 1, `${R.cap(s.de)} ${blank} ${np(o, "akk", "indef")}.`, a, [IRR.sein[s.p], conj("haben", s.p === "2s" ? "3s" : "2s")],
      `Possession = <b>haben</b>. Subject <b>${s.de}</b> → <b>${a}</b>. (ich habe, du hast, er/sie hat, wir haben, ihr habt, sie haben)`, {}, { en: `${R.cap(s.en)} ${s.p === "3s" ? "has" : "have"} ${an(o.en)}.` });
  });

  def("praesens", { title: "Present tense endings", level: "A1", lessons: [2] }, () => {
    const c = clause({ noSep: true, pronounOnly: true, tags: ["buy", "see", "move", "plain", "eat", "read", "person"] });
    const v = c.v, s = c.s;
    const ans = conj(v, s.p);
    const rule = [];
    rule.push(`Stem <b>${stemOf(v)}-</b> + ending for <b>${s.de}</b> = <b>-${END[s.p]}</b>.`);
    if (v.ch && (s.p === "2s" || s.p === "3s")) rule.push(`<b>${v.inf}</b> is a stem-changing verb: with du and er/sie/es the vowel changes (${v.ch}-).`);
    if (/(t|d)$/.test(stemOf(v)) && ["2s", "3s", "2p"].includes(s.p)) rule.push("Stem ends in -t/-d → add an extra <b>e</b> (du arbeitest, er arbeitet).");
    const wrong = SUBJ.map((x) => conj(v, x.p)).filter((x) => x !== ans);
    const sentence = c.main();
    return input("praesens", 2, sentence.replace(new RegExp("\\b" + ans + "\\b"), `${blank} (${v.inf})`), ans, rule.join(" "), { full: sentence, en: c.en(), options: [...new Set(wrong)] });
  });

  def("wortstellung", { title: "Verb in position 2", level: "A1", lessons: [3, 10, 11] }, () => {
    const c = clause({ pronounOnly: false });
    const s = [R.cap(c.time[0]), c.fin, c.s.de, c.obj, c.pre].filter(Boolean).join(" ") + ".";
    return order("wortstellung", 3, `Build the sentence. Start with „${R.cap(c.time[0])}“.`, s,
      `The conjugated verb (<b>${c.fin}</b>) must be in <b>position 2</b>. „${c.time[0]}“ takes position 1, so the subject <b>${c.s.de}</b> moves behind the verb (inversion).${c.pre ? ` <b>${c.v.inf}</b> is separable → <b>${c.pre}</b> goes to the end.` : ""}`,
      { en: c.en(), fixedFirst: R.cap(c.time[0]) });
  });

  def("fragen", { title: "Questions", level: "A1", lessons: [4] }, () => {
    const c = clause({ pronounOnly: true, tags: ["buy", "see", "eat", "read", "move"] });
    const st = c.main();
    if (Math.random() < 0.5) {
      const q = [R.cap(c.fin), c.s.de, c.time[0], c.obj, c.pre].filter(Boolean).join(" ") + "?";
      return order("fragen", 4, `Make a yes/no question from: „${st}“`, q, "Yes/no questions put the conjugated verb in <b>position 1</b>, the subject follows.", { en: c.en() });
    }
    const wq = c.v.tag === "move" ? "Wohin" : c.v.obj ? "Was" : "Wann";
    const q = wq === "Wann" ? ["Wann", c.fin, c.s.de, c.obj, c.pre].filter(Boolean).join(" ") + "?" : [wq, c.fin, c.s.de, c.time[0], c.pre].filter(Boolean).join(" ") + "?";
    return order("fragen", 4, `Ask for the ${wq === "Wohin" ? "destination" : wq === "Was" ? "object" : "time"} in: „${st}“`, q,
      `W-questions: <b>question word (pos. 1) + verb (pos. 2) + subject</b>. ${wq === "Wohin" ? "Direction (nach/in/zu …) → <b>wohin</b>, not wo." : ""}`, { en: c.en() });
  });

  def("artikel", { title: "der, die, das", level: "A1", lessons: [5] }, () => {
    const n = R.pick(NOUNS.concat(PEOPLE));
    const a = art("def", "nom", n.g);
    const tip = /ung$|heit$|keit$|ion$|e$/.test(n.de) && n.g === "f" ? "Nouns ending in -ung, -heit, -keit, -ion and most in -e are feminine." :
      /chen$/.test(n.de) ? "-chen/-lein are always neuter (das Mädchen!)." : n.person && n.g !== "n" ? "People: natural gender – men masculine, women (-in) feminine." : "No reliable ending rule – learn this noun together with its article.";
    if (Math.random() < 0.7)
      return choice("artikel", 5, `${blank} ${n.de}`, a, ["der", "die", "das"].filter((x) => x !== a), `<b>${a} ${n.de}</b> (${n.en}) – ${G[n.g]}. ${tip}`, {}, { en: "the " + n.en, gender: n.g });
    return input("artikel", 5, `Plural of <b>${a} ${n.de}</b>? (write: die …)`, n.pl === "-" ? "kein Plural" : "die " + n.pl,
      `The plural article is always <b>die</b>. ${n.de} → ${n.pl}. Plural endings must be learned: -e, -¨e, -er, -¨er, -(e)n, -s or no ending.`);
  });

  def("akkusativ", { title: "Akkusativ", level: "A1", lessons: [6] }, () => {
    const v = R.pick(V.filter((x) => x.obj === "akk" && x.tag !== "person" && !x.sep));
    const o = R.pick(objs(v.tag)); const s = randSubj(); const kind = R.pick(["def", "indef"]);
    if (o.pl === "-" && kind === "indef") return GEN.akkusativ.fn();
    const ans = art(kind, "akk", o.g);
    const sent = `${R.cap(s.de)} ${conj(v, s.p)} ${ans} ${o.de}.`;
    const opts = kind === "def" ? ["der", "die", "das", "den", "dem"] : ["ein", "eine", "einen", "einem"];
    const wn = {}; opts.forEach((x) => { if (x !== ans) wn[x] = x === art(kind, "nom", o.g) ? "That is the Nominativ form (subject). Here the noun is the object." : x === art(kind, "dat", o.g) ? `Dativ – but ${v.inf} takes the Akkusativ.` : `Wrong gender: ${o.de} is ${G[o.g]}.`; });
    return choice("akkusativ", 6, sent.replace(` ${ans} `, ` ${blank} `), ans, opts,
      whyArticle(o, "akk", kind, `<b>${v.inf}</b> + direct object (Wen/Was?)`) + (o.g !== "m" ? " Only masculine changes in the Akkusativ; feminine/neuter stay the same." : ""), wn,
      { full: sent, en: `${R.cap(s.en)} ${en3(v, s)} ${kind === "def" ? "the" : "a"} ${o.en}.` });
  });

  def("negation", { title: "nicht or kein", level: "A1", lessons: [7] }, () => {
    const s = randSubj();
    if (Math.random() < 0.55) {
      const o = R.pick(NOUNS.filter((n) => n.tags.includes("buy") && n.pl !== "-"));
      const pos = `${R.cap(s.de)} ${IRR.haben[s.p]} ${np(o, "akk", "indef")}.`;
      const ans = `${R.cap(s.de)} ${IRR.haben[s.p]} ${art("kein", "akk", o.g)} ${o.de}.`;
      return choice("negation", 7, `Negate: „${pos}“`, ans, [`${R.cap(s.de)} ${IRR.haben[s.p]} nicht ${np(o, "akk", "indef")}.`, `${R.cap(s.de)} ${IRR.haben[s.p]} ${o.g === "m" ? "kein" : "keinen"} ${o.de}.`],
        `A noun with <b>ein</b> (or no article) is negated with <b>kein</b>, which takes the same ending as ein: ${np(o, "akk", "indef")} → <b>${art("kein", "akk", o.g)} ${o.de}</b>.`, { }, { en: `${R.cap(s.en)} ${s.p === "3s" ? "doesn't" : "don't"} have ${an(o.en)}.` });
    }
    const c = clause({ subj: s, tags: ["plain", "move"], noSep: true });
    const ans = c.v.tag === "move" ? [R.cap(s.de), c.fin, c.time[0], "nicht", c.obj].join(" ") + "." : [R.cap(s.de), c.fin, c.time[0], "nicht"].join(" ") + ".";
    return order("negation", 7, `Negate with nicht: „${c.main()}“`, ans,
      c.v.tag === "move" ? "Verbs and places are negated with <b>nicht</b>. nicht stands <b>before</b> the place/direction (nicht nach Berlin)." : "A verb is negated with <b>nicht</b>, which goes to the <b>end</b> of the main clause (after time expressions).");
  });

  def("possessiv", { title: "mein, dein, sein …", level: "A1", lessons: [8] }, () => {
    const s = R.pick(SUBJ.slice(0, 7)); const o = R.pick(NOUNS.concat(PEOPLE).filter((n) => n.pl !== "-"));
    const c = R.pick(["nom", "akk"]);
    const stem = s.poss; const ans = art(stem, c, o.g);
    const who = { ich: "ich → mein", du: "du → dein", er: "er → sein", sie: s.plural ? "sie (they) → ihr" : "sie (she) → ihr", wir: "wir → unser", ihr: "ihr → euer" }[s.de];
    const sent = c === "nom" ? `Das ist ${ans} ${nounForm(o, "nom")}.` : `Ich suche ${ans} ${nounForm(o, "akk")}.`;
    const opts = [...new Set([stem, stem + "e", stem + "en", stem + "em"].map((x) => (x === "eur" ? "euer" : x)))];
    return choice("possessiv", 8, sent.replace(ans + " ", `${blank} (${s.de}) `), ans, opts,
      `${who}. Possessives take the endings of <b>ein/kein</b>. ${o.de} is ${G[o.g]}, ${CASE_NAME[c]}${c === "akk" ? " (suchen + Akk.)" : " (after „Das ist“)"} → <b>${ans}</b>.${stem === "eur" && ans !== "euer" ? " euer loses its e when it gets an ending: eure/euren." : ""}`);
  });

  def("uhrzeit", { title: "Telling the time", level: "A1", lessons: [9] }, () => {
    const h = 1 + Math.floor(Math.random() * 11), m = R.pick([0, 15, 30, 45, 5, 50]);
    const W = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf"];
    const nx = W[h + 1];
    const ans = { 0: `${h === 1 ? "ein" : W[h]} Uhr`, 15: `Viertel nach ${W[h]}`, 30: `halb ${nx}`, 45: `Viertel vor ${nx}`, 5: `fünf nach ${W[h]}`, 50: `zehn vor ${nx}` }[m];
    const wrong = m === 30 ? [`halb ${W[h]}`, `Viertel nach ${W[h]}`] : m === 45 ? [`Viertel vor ${W[h]}`, `halb ${nx}`] : m === 15 ? [`Viertel vor ${W[h]}`, `halb ${W[h]}`] : [`halb ${nx}`, `Viertel nach ${W[h]}`];
    return choice("uhrzeit", 9, `Es ist ${h}:${String(m).padStart(2, "0")} Uhr. Informally:`, ans, wrong,
      m === 30 ? `<b>halb</b> counts towards the <b>next</b> hour: ${h}:30 = halb ${nx} (half way to ${nx}).` : m === 45 ? `${h}:45 = a quarter <b>before</b> ${nx} → Viertel vor ${nx}.` : `Minutes after the hour: <b>nach</b>; minutes before the next hour: <b>vor</b>.`, { [`halb ${W[h]}`]: `halb ${W[h]} would be ${h - 1 || 12}:30 – halb looks forward to the next hour.` });
  });

  def("trennbar", { title: "Separable verbs", level: "A1", lessons: [10] }, () => {
    const v = R.pick(V.filter((x) => x.sep)); const s = randSubj(); const t = R.pick(TIMES);
    let obj = "", objEn = ""; if (v.obj) { const pp = R.pick(PEOPLE); obj = " " + np(pp, v.obj); objEn = " the " + pp.en; }
    const f = conj(v, s.p);
    const sent = `${R.cap(t[0])} ${f} ${s.de}${obj} ${v.sep}.`;
    return input("trennbar", 10, `${R.cap(t[0])} ${blank} ${s.de}${obj} ${blank}. (${v.inf}) – write both parts`, `${f} ${v.sep}`,
      `<b>${v.inf}</b> = ${v.sep}- + ${v.inf.slice(v.sep.length)}. In a main clause the conjugated part (<b>${f}</b>) stays in position 2 and the prefix <b>${v.sep}</b> goes to the very end.`, { full: sent, en: `${R.cap(s.en)} ${en3(v, s)}${objEn} ${t[1]}.` });
  });

  def("modal", { title: "Modal verbs", level: "A1", lessons: [11] }, () => {
    const m = R.pick(["können", "müssen", "wollen", "dürfen", "sollen", "möchten"]);
    const c = clause({ pronounOnly: true, tags: ["buy", "move", "plain", "person"] });
    const mf = IRR[m][c.s.p];
    const sent = [R.cap(c.s.de), mf, c.time[0], c.obj, c.v.inf].filter(Boolean).join(" ") + ".";
    const EN = { können: "can", müssen: "must", wollen: "wants to", dürfen: "may", sollen: "should", möchten: "would like to" };
    return order("modal", 11, `Build the sentence with „${m}“: ${c.s.de} / ${c.v.inf} / ${c.time[0]}${c.obj ? " / " + c.obj : ""}`, sent,
      `Modal verb <b>${mf}</b> is conjugated in position 2 (ich/er have no ending: ich ${IRR[m]["1s"]}). The main verb goes to the end as an <b>infinitive</b> (${c.v.inf})${c.v.sep ? " – the separable verb stays together" : ""}.`, { en: `${R.cap(c.s.en)} ${EN[m]} …` });
  });

  def("imperativ", { title: "Imperative", level: "A1", lessons: [12] }, () => {
    const v = R.pick(V.filter((x) => ["nehmen", "lesen", "essen", "helfen", "kaufen", "warten", "anrufen", "fahren", "arbeiten", "öffnen", "vergessen", "schlafen"].includes(x.inf)));
    const form = R.pick(["du", "ihr", "Sie"]);
    let stem = v.ch && /[ie]/.test(v.ch) && !/ä/.test(v.ch) ? v.ch : stemOf(v);
    let du = stem + (/(t|d)$|[^aeiouäöülrh]n$/.test(stemOf(v)) ? "e" : "");
    if (v.ch === "fähr" || v.ch === "schläf" || v.ch === "läuf") du = stemOf(v);
    const base = v.sep ? v.inf.slice(v.sep.length) : v.inf;
    const ans0 = form === "du" ? du : form === "ihr" ? conj(v, "2p") : `${base} Sie`;
    const pre = v.sep ? ` … ${v.sep}` : "";
    const fmt = (x) => R.cap(x) + pre + "!";
    const opts0 = form === "du" ? [conj(v, "2s"), stemOf(v) + "e", base] : form === "ihr" ? [conj(v, "2s"), base] : [base, conj(v, "2p") + " Sie"];
    const ans = fmt(ans0);
    return choice("imperativ", 12, `Imperative (${form}) of <b>${v.inf}</b>${v.sep ? " (separable)" : ""}:`, ans, [...new Set(opts0.map(fmt))].filter((x) => x !== ans),
      form === "du" ? `du-imperative: du-form without <b>du</b> and without <b>-st</b>. e→i/ie changes stay (nimm, lies, hilf), a→ä changes are dropped (fahr, schlaf).${pre ? ` Separable: the prefix goes to the end (${ans}).` : ""}` :
        form === "ihr" ? "ihr-imperative = ihr-form without ihr." : "Sie-imperative = infinitive + Sie (verb first).");
  });

  def("dativ", { title: "Dativ", level: "A2", lessons: [13] }, () => {
    const v = R.pick(V.filter((x) => x.obj === "dat" && !x.sep)); const o = R.pick(PEOPLE); const s = randSubj();
    const plural = Math.random() < 0.2;
    const ans = np(o, "dat", "def", plural);
    const sent = `${R.cap(s.de)} ${conj(v, s.p)} ${ans}.`;
    return input("dativ", 13, `${R.cap(s.de)} ${conj(v, s.p)} ${blank} (${plural ? "die " + o.pl : np(o, "nom")}).`, ans,
      plural ? `<b>${v.inf}</b> always takes the <b>Dativ</b>. Dativ plural = <b>den</b> + noun with <b>-n</b> (den ${nounForm(o, "dat", true)}).` :
        whyArticle(o, "dat", "def", `<b>${v.inf}</b> is a Dativ verb (Wem?)`), { full: sent, en: `${R.cap(s.en)} ${en3(v, s)} the ${plural ? o.en + "s" : o.en}.`, options: [np(o, "akk", "def", plural), np(o, "nom", "def", plural)] });
  });

  def("dat_akk", { title: "Dativ + Akkusativ", level: "A2", lessons: [14] }, () => {
    const verb = R.pick([["geben", "gibt", "gib"], ["schenken", "schenkt", null], ["zeigen", "zeigt", null], ["bringen", "bringt", null]]);
    const s = SUBJ[0]; const p = R.pick(PEOPLE.filter((x) => !x.wf)); const o = R.pick(NOUNS.filter((n) => n.tags.includes("buy") && n.pl !== "-"));
    const f = verb[0] === "geben" ? "gebe" : verb[0].replace(/en$/, "e");
    const full = `Ich ${f} ${np(p, "dat")} ${np(o, "akk")}.`;
    if (Math.random() < 0.5)
      return order("dat_akk", 14, `Put in order: ich / ${verb[0]} / ${np(p, "nom")} (receiver) / ${np(o, "nom")} (thing)`, full,
        `Receiver = <b>Dativ</b> (${np(p, "dat")}), thing = <b>Akkusativ</b> (${np(o, "akk")}). With two nouns: <b>Dativ before Akkusativ</b>.`);
    const pd = { m: "ihm", f: "ihr", n: "ihm" }[p.g], pa = { m: "ihn", f: "sie", n: "es" }[o.g];
    const ans = `Ich ${f} ${pa} ${pd}.`;
    return choice("dat_akk", 14, `Replace both nouns with pronouns: „${full}“`, ans, [`Ich ${f} ${pd} ${pa}.`, `Ich ${f} ${pa} ${pd === "ihm" ? "ihn" : "sie"}.`],
      `${np(o, "akk")} → <b>${pa}</b> (Akk.), ${np(p, "dat")} → <b>${pd}</b> (Dat.). With two pronouns: <b>Akkusativ before Dativ</b>.`, { [`Ich ${f} ${pd} ${pa}.`]: "Two pronouns: Akkusativ comes first (es ihm, ihn ihr)." });
  });

  const PREP = [
    ["mit", "dat", [["Bus", "m"], ["Zug", "m"], ["U-Bahn", "f"], ["Fahrrad", "n"], ["Auto", "n"]], "Ich fahre", "by"],
    ["für", "akk", PEOPLE.map((p) => [p.de, p.g, p.wf]), "Das Geschenk ist", "for"],
    ["ohne", "akk", [["Schlüssel", "m"], ["Jacke", "f"], ["Handy", "n"], ["Ticket", "n"]], "Ich gehe nie", "without"],
    ["zu", "dat", [["Arzt", "m"], ["Post", "f"], ["Bahnhof", "m"], ["Bank", "f"], ["Rathaus", "n"]], "Ich gehe", "to"],
    ["bei", "dat", [["Arzt", "m"], ["Firma", "f"], ["Chef", "m"], ["Nachbarin", "f"]], "Ich bin heute", "at"],
    ["aus", "dat", [["Haus", "n"], ["Küche", "f"], ["Bahnhof", "m"], ["Schule", "f"]], "Sie kommt gerade", "out of"],
    ["durch", "akk", [["Park", "m"], ["Stadt", "f"], ["Zentrum", "n"]], "Wir gehen", "through"],
    ["gegen", "akk", [["Baum", "m"], ["Wand", "f"], ["Auto", "n"]], "Der Ball fliegt", "against"],
  ];
  def("praepositionen", { title: "Prepositions + case", level: "A2", lessons: [15] }, () => {
    const [pr, c, list, start] = R.pick(PREP); const [w, g, wf] = R.pick(list);
    let a = art("def", c, g); let form = pr + " " + a;
    if (pr === "zu" && a === "dem") form = "zum"; else if (pr === "zu" && a === "der") form = "zur"; else if (pr === "bei" && a === "dem") form = "beim";
    const noun = wf && c !== "nom" ? wf : w;
    const opts = [...new Set(["der", "die", "das", "den", "dem"].map((x) => pr + " " + x))].filter((x) => x !== pr + " " + a).slice(0, 3);
    return choice("praepositionen", 15, `${start} ${blank} ${noun}.`, form, opts,
      `<b>${pr}</b> always takes the <b>${CASE_NAME[c]}</b> (${c === "akk" ? "durch, für, gegen, ohne, um" : "aus, bei, mit, nach, seit, von, zu"}). ${w} is ${G[g]} → ${a}.${form !== pr + " " + a ? ` ${pr} + ${a} contracts to <b>${form}</b>.` : ""}`, {}, { full: `${start} ${form} ${noun}.` });
  });

  const PLACES = [["Tisch", "m", "auf"], ["Sofa", "n", "auf"], ["Bett", "n", "auf"], ["Regal", "n", "in"], ["Schrank", "m", "in"], ["Tasche", "f", "in"], ["Wand", "f", "an"], ["Tür", "f", "neben"], ["Stuhl", "m", "unter"], ["Fenster", "n", "vor"]];
  def("wechsel", { title: "Wo? or Wohin?", level: "A2", lessons: [16] }, () => {
    const [w, g, pr] = R.pick(PLACES); const o = R.pick(NOUNS.filter((n) => ["Buch", "Handy", "Schlüssel", "Brief", "Tasche", "Zeitung", "Bild", "Uhr"].includes(n.de)));
    const wohin = Math.random() < 0.5;
    const hang = pr === "an";
    const verbs = hang ? ["hänge", "hängt"] : ["lege", "liegt"];
    const c = wohin ? "akk" : "dat"; let a = art("def", c, g);
    let form = pr + " " + a; if (pr === "in" && a === "dem") form = "im"; if (pr === "in" && a === "das") form = "ins"; if (pr === "an" && a === "dem") form = "am";
    const sent = wohin ? `Ich ${verbs[0]} ${np(o, "akk")} ${form} ${w}.` : `${R.cap(np(o, "nom"))} ${verbs[1]} ${form} ${w}.`;
    const alt = art("def", wohin ? "dat" : "akk", g);
    return choice("wechsel", 16, sent.replace(` ${form} `, ` ${blank} `), form, [pr + " " + alt, pr + " " + (g === "f" ? "die" : "der")].filter((x) => x !== form),
      wohin ? `<b>${verbs[0].replace(/e$/, "en")}</b> = movement to a place → <b>Wohin?</b> → Akkusativ (${pr} ${a}).` : `<b>${verbs[1].replace(/t$/, "en")}</b> = position, no movement → <b>Wo?</b> → Dativ (${pr} ${a}).`,
      { [pr + " " + alt]: wohin ? "That would answer Wo? (Dativ). legen/hängen/stellen show movement → Akkusativ." : "That would answer Wohin? (Akkusativ). liegen/hängen/stehen show position → Dativ." });
  });

  def("perfekt", { title: "Perfekt", level: "A2", lessons: [17] }, () => {
    const v = R.pick(V); const s = randSubj(); const t = R.pick(PAST);
    let obj = "";
    if (v.obj) obj = np(R.pick(objs(v.tag)), v.obj);
    else if (v.tag === "move") obj = R.pick(DEST)[0];
    const aux = IRR[v.aux][s.p]; const wrongAux = IRR[v.aux === "sein" ? "haben" : "sein"][s.p];
    const sent = [R.cap(t[0]), aux, s.de, obj, v.pp].filter(Boolean).join(" ") + ".";
    const reason = v.aux === "sein" ? (v.tag === "move" ? `<b>${v.inf}</b> = movement from A to B → <b>sein</b>.` : `<b>${v.inf}</b> = change of state → <b>sein</b>.`) : `<b>${v.inf}</b> has no movement/change of state → <b>haben</b>.`;
    const ppRule = /^ge/.test(v.pp) ? (/t$/.test(v.pp) ? "Regular: ge-…-t." : "Irregular: ge-…-en.") : v.sep ? `Separable: ge goes between prefix and stem (${v.pp}).` : /iert$/.test(v.pp) ? "-ieren verbs have no ge-." : "Inseparable prefix (be-, ver-, er-…) → no ge-.";
    if (Math.random() < 0.5)
      return choice("perfekt", 17, sent.replace(` ${aux} `, ` ${blank} `).replace(v.pp + ".", v.pp + `. (${v.inf})`), aux, [wrongAux], reason + " " + ppRule, { [wrongAux]: v.aux === "sein" ? "haben is for verbs without movement/change." : "sein is only for movement (gehen, fahren…) or change of state (aufstehen, einschlafen) + sein/bleiben." }, { full: sent });
    return input("perfekt", 17, `Perfekt: ${R.cap(t[0])} ${blank} ${s.de}${obj ? " " + obj : ""} ${blank}. (${v.inf}) – write aux + participle`, `${aux} ${v.pp}`, reason + " " + ppRule, { full: sent });
  });

  def("praeteritum", { title: "war, hatte, konnte …", level: "A2", lessons: [18] }, () => {
    const s = randSubj(); const t = R.pick(PAST);
    const k = R.pick([["sein", "krank", "was ill"], ["haben", "keine Zeit", "had no time"], ["können", "nicht kommen", "couldn't come"], ["müssen", "lange arbeiten", "had to work long"], ["wollen", "ins Kino gehen", "wanted to go to the cinema"]]);
    const f = pret(k[0], s.p);
    const sent = `${R.cap(t[0])} ${f} ${s.de} ${k[1]}.`;
    return input("praeteritum", 18, `${R.cap(t[0])} ${blank} ${s.de} ${k[1]}. (${k[0]}, Präteritum)`, f,
      `In speech we use the <b>Präteritum</b> for sein, haben and modal verbs. ${k[0]} → ${PRET[k[0]]}-; ich and er/sie/es have <b>no ending</b>: ich ${PRET[k[0]]}, du ${pret(k[0], "2s")}.${["können", "müssen", "dürfen"].includes(k[0]) ? " Modal verbs lose the umlaut in the Präteritum." : ""}`, { full: sent, en: `${R.cap(s.en)} ${k[2]} ${t[1]}.` });
  });

  def("reflexiv", { title: "Reflexive pronouns", level: "A2", lessons: [19] }, () => {
    const s = randSubj();
    const dat = Math.random() < 0.45;
    const [v, rest] = dat ? R.pick([["wasch", "die Hände"], ["putz", "die Zähne"], ["kauf", "einen Kaffee"]]) : R.pick([["wasch", ""], ["freu", "auf das Wochenende"], ["beeil", ""], ["ärger", "über den Lärm"], ["interessier", "für Musik"]]);
    const inf = v + (/er$/.test(v) ? "n" : "en");
    const f = conj(VERB[inf] || { inf }, s.p);
    const ans = s.refl[dat ? 1 : 0];
    const sent = `${R.cap(s.de)} ${f} ${ans}${rest ? " " + rest : ""}.`;
    return choice("reflexiv", 19, sent.replace(` ${ans}`, ` ${blank}`), ans, [...new Set([s.refl[dat ? 0 : 1], "sich", "mich", "uns"])].filter((x) => x !== ans).slice(0, 3),
      dat ? `There is already an Akkusativ object (<b>${rest}</b>), so the reflexive pronoun is <b>Dativ</b>: ${ans}.` : `No other object → reflexive pronoun in the <b>Akkusativ</b>: ${ans}. (Only ich and du differ between Akk./Dat.: mich/mir, dich/dir.)`);
  });

  def("konjunktionen", { title: "und, aber, denn, sondern", level: "A2", lessons: [20] }, () => {
    const items = [
      ["Ich bleibe zu Hause, ___ ich bin krank.", "denn", "denn gives a reason and keeps normal word order (verb in position 2)."],
      ["Ich möchte kommen, ___ ich habe keine Zeit.", "aber", "aber shows a contrast."],
      ["Er trinkt keinen Kaffee, ___ Tee.", "sondern", "sondern corrects a negation (kein/nicht … sondern …)."],
      ["Trinkst du Tee ___ Kaffee?", "oder", "oder = alternative."],
      ["Ich koche ___ du deckst den Tisch.", "und", "und adds information."],
      ["Wir wohnen nicht in Köln, ___ in Bonn.", "sondern", "After nicht, a correction uses sondern, not aber."],
      ["Sie lernt viel, ___ sie hat bald eine Prüfung.", "denn", "denn = because, but the verb stays in position 2."],
    ];
    const [q, a, why] = R.pick(items);
    return choice("konjunktionen", 20, q.replace("___", blank), a, ["und", "aber", "oder", "denn", "sondern"].filter((x) => x !== a).slice(0, 3), why + " These connectors are in <b>position 0</b> – they don't change word order.", { weil: "weil would send the verb to the end." });
  });

  def("nebensatz", { title: "weil, dass, wenn, ob", level: "A2", lessons: [21] }, () => {
    const c = clause({ pronounOnly: true, tags: ["buy", "move", "plain", "person"] });
    const conjn = R.pick(["weil", "dass", "wenn", "ob"]);
    const mains = { weil: ["Ich bin froh", "Anna ist müde", "Wir bleiben heute zu Hause"], dass: ["Ich glaube", "Anna sagt", "Es ist gut"], wenn: ["Ich rufe dich an", "Das ist schön", "Ich freue mich"], ob: ["Ich weiß nicht", "Anna fragt", "Weißt du"] };
    const main = R.pick(mains[conjn]);
    const sub = c.endClause();
    const full = `${main}, ${conjn} ${sub}${main === "Weißt du" ? "?" : "."}`;
    return order("nebensatz", 21, `Join with „${conjn}“: „${main}${main === "Weißt du" ? " …?" : "."}“ + „${c.main()}“`, full,
      `<b>${conjn}</b> starts a subordinate clause: the conjugated verb (<b>${c.fin}${c.pre ? "" : ""}</b>) goes to the <b>end</b>.${c.pre ? ` Separable verbs join together again at the end: <b>${c.pre}${c.fin}</b>.` : ""} Always a comma before ${conjn}.`, { fixedFirst: main + "," });
  });

  const ADJ = [["klein", "kleiner", "am kleinsten", "small"], ["groß", "größer", "am größten", "big"], ["alt", "älter", "am ältesten", "old"], ["schnell", "schneller", "am schnellsten", "fast"], ["teuer", "teurer", "am teuersten", "expensive"], ["gut", "besser", "am besten", "good"], ["warm", "wärmer", "am wärmsten", "warm"], ["billig", "billiger", "am billigsten", "cheap"], ["jung", "jünger", "am jüngsten", "young"], ["hoch", "höher", "am höchsten", "high"], ["gern", "lieber", "am liebsten", "gladly"]];
  def("komparativ", { title: "Comparative & superlative", level: "A2", lessons: [22] }, () => {
    const a = R.pick(ADJ.filter((x) => x[0] !== "gern"));
    const pairs = [["Der Zug", "der Bus"], ["Mein Bruder", "meine Schwester"], ["Berlin", "Bonn"], ["Das Auto", "das Fahrrad"], ["Der Kaffee", "der Tee"]];
    const [x, y] = R.pick(pairs);
    if (Math.random() < 0.6)
      return input("komparativ", 22, `${x} ist ${blank} als ${y}. (${a[0]})`, a[1],
        `Comparative = adjective + <b>-er</b> + <b>als</b>.${/[äöü]/.test(a[1]) && !/[äöü]/.test(a[0]) ? " Short adjectives with a/o/u often take an umlaut." : ""}${a[0] === "gut" ? " gut is irregular: gut – besser – am besten." : ""}${a[0] === "teuer" ? " teuer drops the e: teurer." : ""}`);
    return input("komparativ", 22, `${x} ist ${blank}. (${a[0]}, superlative)`, a[2], `Superlative after sein: <b>am … -sten</b> (${a[2]}).${/[sßzt]$/.test(a[0]) ? " After -s/-ß/-z/-t add -esten." : ""}`);
  });

  def("adjektiv", { title: "Adjective endings", level: "A2", lessons: [23] }, () => {
    const o = R.pick(NOUNS.filter((n) => n.tags.includes("buy") && n.pl !== "-"));
    const adj = R.pick(["neu", "alt", "klein", "rot", "schön", "teuer", "billig"]);
    const stemA = adj === "teuer" ? "teur" : adj;
    const type = R.pick(["def", "indef"]); const c = R.pick(["nom", "akk", "dat"]);
    let end;
    if (type === "def") end = c === "nom" || (c === "akk" && o.g !== "m") ? "e" : "en";
    else end = c === "dat" ? "en" : c === "akk" && o.g === "m" ? "en" : o.g === "m" ? "er" : o.g === "n" ? "es" : "e";
    const a = art(type, c, o.g);
    const frame = { nom: `${R.cap(a)} ${blank} ${o.de} ist hier.`, akk: `Ich kaufe ${a} ${blank} ${o.de}.`, dat: `Ich spreche von ${a} ${blank} ${nounForm(o, "dat")}.` }[c];
    const ans = stemA + end;
    const why = type === "def" ? `After <b>${a}</b> (der-word) the article already shows the case, so the adjective only takes <b>-e</b> (nom. sg. + akk. fem./neut.) or <b>-en</b> (everything else).` :
      end === "er" || end === "es" ? `„${a}“ has no ending, so the adjective must show the gender: <b>-${end}</b> (like de${end === "er" ? "r" : "s"}).` : `After <b>${a}</b> the article shows the case${c === "dat" ? " (Dativ → always -en)" : ""}, so the adjective takes <b>-${end}</b>.`;
    return choice("adjektiv", 23, frame.replace(blank, `${blank} (${adj})`), ans, ["e", "en", "er", "es", "em"].map((e) => stemA + e).filter((x) => x !== ans).slice(0, 3),
      `${o.de} = ${G[o.g]}, ${CASE_NAME[c]}${c === "akk" ? " (kaufen)" : c === "dat" ? " (von + Dativ)" : ""}. ` + why);
  });

  def("zeit", { title: "seit, vor, für, bis", level: "A2", lessons: [24] }, () => {
    const it = R.pick([
      ["Ich wohne ___ zwei Jahren in Berlin.", "seit", "Started in the past and still true now → seit + Dativ + present tense."],
      ["___ drei Tagen war ich in Wien.", "Vor", "vor + time = ago (finished in the past)."],
      ["Wir fahren ___ eine Woche nach Italien.", "für", "A planned duration → für + Akkusativ."],
      ["Das Büro ist ___ Freitag geschlossen.", "bis", "End point → bis."],
      ["___ dem Essen putze ich mir die Zähne.", "Nach", "After an event → nach + Dativ."],
      ["___ nächster Woche arbeite ich Teilzeit.", "Ab", "Starting point in the future → ab."],
      ["Ich lerne ___ sechs Monaten Deutsch.", "seit", "Still learning now → seit (not für!)."],
    ]);
    return choice("zeit", 24, it[0].replace("___", blank), it[1], ["seit", "vor", "für", "bis", "nach", "ab"].map((x) => (it[0].startsWith("___") ? R.cap(x) : x)).filter((x) => x !== it[1]).slice(0, 3), it[2]);
  });

  def("konjunktiv2", { title: "Konjunktiv II", level: "B1", lessons: [25, 26] }, () => {
    const s = randSubj({ noPl: false });
    const it = R.pick([
      [`Wenn ${s.de} Zeit ${blank}, würde${s.p === "2s" ? "st" : ["1p", "3p"].includes(s.p) ? "n" : s.p === "2p" ? "t" : ""} ${s.de === "du" ? "du" : s.de} mehr lesen.`, kii("haben", s.p), "Unreal condition: <b>wenn + hätte/wäre</b> (verb at the end), then <b>würde + infinitive</b>. „haben“ uses its own form hätte instead of würde haben.", [conj("haben", s.p), pret("haben", s.p)]],
      [`Wenn ${s.de} reich ${blank}, würde${s.p === "2s" ? "st" : ["1p", "3p"].includes(s.p) ? "n" : s.p === "2p" ? "t" : ""} ${s.de} reisen.`, kii("sein", s.p), "Unreal condition with sein → <b>wäre</b>.", [IRR.sein[s.p], pret("sein", s.p)]],
      [`${blank} Sie mir bitte helfen?`, "Könnten", "Polite request: <b>Könnten Sie …?</b> (Konjunktiv II of können).", ["Können", "Konnten"]],
      [`Ich ${blank} gern einen Tee.`, "hätte", "Polite ordering: <b>Ich hätte gern …</b>", ["habe", "hatte"]],
      [`An deiner Stelle ${blank} ich zum Arzt gehen.`, "würde", "Advice: <b>An deiner Stelle würde ich …</b> (würde in position 2, infinitive at the end).", ["werde", "wurde"]],
      [`Du ${blank} mehr schlafen.`, "solltest", "Advice: <b>sollte</b> = Konjunktiv II of sollen.", ["sollst", "sollen"]],
    ]);
    return choice("konjunktiv2", 25, it[0], it[1], it[3], it[2], { [it[3][0]]: "That is the indicative (a real fact), not a wish/unreal situation.", [it[3][1]]: "That is the Präteritum (past). Konjunktiv II has an umlaut or uses würde." });
  });

  def("zu_infinitiv", { title: "zu + infinitive", level: "B1", lessons: [28, 30] }, () => {
    const v = R.pick(V.filter((x) => ["einkaufen", "anrufen", "aufstehen", "kochen", "lernen", "arbeiten", "fernsehen", "einladen"].includes(x.inf)));
    const zu = v.sep ? v.sep + "zu" + v.inf.slice(v.sep.length) : "zu " + v.inf;
    const frame = R.pick([["Ich habe keine Lust, ___.", true], ["Es ist wichtig, früh ___.", true], ["Vergiss nicht, ___!", true], ["Ich muss heute ___.", false], ["Ich versuche, jeden Tag ___.", true], ["Wir wollen morgen ___.", false]]);
    const ans = frame[1] ? zu : v.inf;
    return choice("zu_infinitiv", 28, frame[0].replace("___", `${blank} (${v.inf})`), ans, frame[1] ? [v.inf, "zu " + v.inf === zu ? v.inf + " zu" : "zu " + v.inf] : [zu],
      frame[1] ? `After expressions like Lust haben, es ist wichtig, vergessen, versuchen → <b>zu + infinitive</b> at the end.${v.sep ? ` Separable verb: zu goes <b>between</b> prefix and stem (${zu}).` : ""}` : "After a <b>modal verb</b> the infinitive has <b>no zu</b>.");
  });

  def("umzu_damit", { title: "um … zu or damit", level: "B1", lessons: [29] }, () => {
    const it = R.pick([
      ["Ich lerne Deutsch, ___ in Berlin zu arbeiten.", "um", "Same subject (ich … ich) → <b>um … zu</b>."],
      ["Ich spreche langsam, ___ du mich verstehst.", "damit", "Different subjects (ich / du) → <b>damit</b>."],
      ["Er spart Geld, ___ ein Auto zu kaufen.", "um", "Same subject + zu-infinitive → um."],
      ["Wir fahren früh los, ___ wir den Zug nicht verpassen.", "damit", "damit + subordinate clause (verb at the end). Also possible with the same subject."],
      ["Die Lehrerin erklärt es noch einmal, ___ alle es verstehen.", "damit", "Different subjects (Lehrerin / alle) → damit."],
    ]);
    return choice("umzu_damit", 29, it[0].replace("___", blank), it[1], ["um", "damit", "weil", "dass"].filter((x) => x !== it[1]).slice(0, 3), it[2], { weil: "weil gives a reason, not a goal.", dass: "dass introduces content (Ich glaube, dass …), not a goal." });
  });

  const VP = [["warten", "auf", "akk", "den Bus", "worauf"], ["denken", "an", "akk", "die Familie", "woran"], ["sich interessieren", "für", "akk", "Musik", "wofür"], ["träumen", "von", "dat", "einem Haus", "wovon"], ["Angst haben", "vor", "dat", "der Prüfung", "wovor"], ["sprechen", "über", "akk", "das Wetter", "worüber"], ["sich freuen", "auf", "akk", "den Urlaub", "worauf"], ["teilnehmen", "an", "dat", "dem Kurs", "woran"]];
  def("verb_praep", { title: "Verbs with prepositions", level: "B1", lessons: [31] }, () => {
    const [v, p, c, o, wo] = R.pick(VP);
    if (Math.random() < 0.5)
      return choice("verb_praep", 31, `${v}: Ich … ${blank} ${o}.`, p, ["auf", "an", "für", "von", "vor", "über", "mit"].filter((x) => x !== p).slice(0, 3), `Fixed combination: <b>${v} ${p} + ${CASE_NAME[c]}</b>. Learn these as one unit.`);
    return choice("verb_praep", 31, `Ask about the thing: „… ${p} ${o}.“ → ${blank}?`, R.cap(wo), [R.cap(p) + " was", "Was", R.cap(p) + " wen"],
      `Things are asked with <b>wo(r) + preposition</b> (${wo}); the r is added when the preposition starts with a vowel. For people: ${p} + wen/wem.`, { [R.cap(p) + " wen"]: "Only for people: Auf wen wartest du?", [R.cap(p) + " was"]: "„" + R.cap(p) + " was“ is colloquial – standard German uses " + wo + "." });
  });

  def("relativ", { title: "Relative pronouns", level: "B1", lessons: [33] }, () => {
    const person = Math.random() < 0.55;
    const role = R.pick(person ? ["nom", "akk", "dat", "mit"] : ["nom", "akk", "mit"]);
    const pool = person ? PEOPLE : NOUNS.filter((x) => x.pl !== "-" && (role === "mit" ? x.tags.includes("use") || ["Auto", "Fahrrad"].includes(x.de) : role === "nom" ? x.tags.includes("forget") || x.tags.includes("find") : x.tags.includes("buy")));
    const n = R.pick(pool);
    const rel = { nom: art("def", "nom", n.g), akk: art("def", "akk", n.g), dat: art("def", "dat", n.g), mit: art("def", "dat", n.g) }[role];
    let tail = person ? { nom: "dort wartet", akk: "ich gestern gesehen habe", dat: "ich oft helfe", mit: "ich gesprochen habe" }[role] : { nom: "dort liegt", akk: "ich gekauft habe", mit: "ich jeden Tag fahre" }[role];
    if (!person && role === "mit" && n.tags.includes("use")) tail = "ich jeden Tag arbeite";
    const pre = role === "mit" ? "mit " : "";
    const sent = `Das ist ${np(n, "nom")}, ${pre}${rel} ${tail}.`;
    return choice("relativ", 33, sent.replace(`, ${pre}${rel} `, `, ${pre}${blank} `), rel, ["der", "die", "das", "den", "dem"].filter((x) => x !== rel).slice(0, 3),
      `Gender from the noun (<b>${n.de}</b>, ${G[n.g]}), case from the relative clause: ${role === "nom" ? "it is the subject of „" + tail + "“ → Nominativ" : role === "akk" ? (() => { const pp = tail.split(" ").find((w) => /^ge\w+(t|en)$/.test(w)); const inf = pp ? { gesehen: "sehen", gekauft: "kaufen" }[pp] || pp : tail.split(" ").pop(); return "„" + inf + "“ needs an Akkusativ object (" + (pp ? "ich habe <b>ihn/sie/es</b> " + pp : "") + ") → Akkusativ. „habe“ is only the helper verb"; })() : role === "dat" ? "helfen takes the Dativ" : "mit + Dativ"} → <b>${rel}</b>. The verb goes to the end.`);
  });

  def("als_wenn", { title: "als or wenn", level: "B1", lessons: [34] }, () => {
    const it = R.pick([
      ["___ ich zehn war, zogen wir nach Pune.", "Als", "One single event/period in the past → <b>als</b>."],
      ["___ ich Zeit habe, lese ich.", "Wenn", "Present/future or general → <b>wenn</b>."],
      ["Immer ___ es regnete, spielten wir drinnen.", "wenn", "Repeated in the past (immer wenn) → <b>wenn</b>."],
      ["___ ich gestern nach Hause kam, war niemand da.", "Als", "One event in the past (gestern) → <b>als</b>."],
      ["Ich weiß nicht, ___ der Kurs beginnt.", "wann", "Question word for time (indirect question) → <b>wann</b>."],
    ]);
    return choice("als_wenn", 34, it[0].replace("___", blank), it[1], ["als", "wenn", "wann"].map((x) => (it[0].startsWith("___") ? R.cap(x) : x)).filter((x) => x !== it[1]), it[2]);
  });

  def("obwohl_deshalb", { title: "obwohl, trotzdem, deshalb", level: "B1", lessons: [36, 37] }, () => {
    const it = R.pick([
      ["Es regnet.", "ich gehe spazieren", "trotzdem", "Es regnet. Trotzdem gehe ich spazieren.", "trotzdem is an adverb: in position 1 the verb follows immediately (inversion)."],
      ["Ich bin krank.", "ich bleibe zu Hause", "deshalb", "Ich bin krank. Deshalb bleibe ich zu Hause.", "deshalb (consequence) in position 1 → verb directly after it."],
      ["Ich gehe spazieren", "es regnet", "obwohl", "Ich gehe spazieren, obwohl es regnet.", "obwohl starts a subordinate clause → verb at the end."],
      ["Der Zug ist teuer.", "wir fahren mit dem Bus", "darum", "Der Zug ist teuer. Darum fahren wir mit dem Bus.", "darum = deshalb → inversion."],
      ["Sie arbeitet", "sie ist müde", "obwohl", "Sie arbeitet, obwohl sie müde ist.", "obwohl → verb (ist) at the end."],
    ]);
    return order("obwohl_deshalb", 36, `Join: „${it[0]}“ + „${it[1]}“ with ${it[2]}`, it[3], it[4]);
  });

  def("passiv", { title: "Passive", level: "B1", lessons: [39] }, () => {
    const v = R.pick(V.filter((x) => ["reparieren", "kaufen", "öffnen", "waschen", "bestellen", "lesen"].includes(x.inf)));
    const o = R.pick(objs(v.tag).filter((n) => n.pl !== "-"));
    const past = Math.random() < 0.4;
    const aux = past ? "wurde" : "wird";
    const ans = `${R.cap(np(o, "nom"))} ${aux} ${v.pp}.`;
    return input("passiv", 39, `Passive (${past ? "Präteritum" : "Präsens"}): „Man ${past ? { reparieren: "reparierte", kaufen: "kaufte", öffnen: "öffnete", waschen: "wusch", bestellen: "bestellte", lesen: "las" }[v.inf] : conj(v, "3s")} ${np(o, "akk")}.“`, ans,
      `The Akkusativ object becomes the <b>subject</b> (Nominativ): ${np(o, "akk")} → <b>${np(o, "nom")}</b>. Passive = <b>${past ? "wurde" : "werden"} + Partizip II</b> (${v.pp}). „man“ disappears.`);
  });

  def("genitiv", { title: "Genitiv: wegen, trotz, während", level: "B1", lessons: [40] }, () => {
    const it = R.pick([["Regen", "m", "wegen", "Wegen des Regens bleiben wir zu Hause."], ["Wetter", "n", "trotz", "Trotz des Wetters gehen wir raus."], ["Fahrt", "f", "während", "Während der Fahrt lese ich."], ["Streik", "m", "wegen", "Wegen des Streiks fährt kein Zug."], ["Kälte", "f", "trotz", "Trotz der Kälte joggt sie."], ["Film", "m", "während", "Während des Films schläft er."]]);
    const a = art("def", "gen", it[1]);
    return choice("genitiv", 40, it[3].replace(new RegExp(` ${a} `), ` ${blank} `), a, ["dem", "den", "die", "der", "des"].filter((x) => x !== a).slice(0, 3),
      `<b>${it[2]}</b> + Genitiv. ${it[0]} is ${G[it[1]]} → <b>${a}</b>${it[1] !== "f" ? " and the noun gets -(e)s" : ""}.`, { dem: "wegen + Dativ is common in speech, but the exam expects the Genitiv." });
  });

  def("futur", { title: "Futur I with werden", level: "B1", lessons: [41] }, () => {
    const c = clause({ pronounOnly: true, tags: ["move", "plain", "buy"] });
    const w = IRR.werden[c.s.p];
    const sent = [R.cap(c.s.de), w, c.time[0], c.obj, c.v.inf].filter(Boolean).join(" ") + ".";
    return order("futur", 41, `Futur I: ${c.s.de} / werden / ${c.v.inf} / ${c.time[0]}${c.obj ? " / " + c.obj : ""}`, sent,
      `Futur I = <b>werden</b> (position 2: ${w}) + <b>infinitive</b> at the end (${c.v.inf}). Like a modal verb.`);
  });

  def("translate", { title: "Translate EN → DE", level: "A1", lessons: [2, 6, 13] }, () => {
    const c = clause({ pronounOnly: true, noSep: true, tags: ["buy", "eat", "read", "see", "person", "plain"] });
    const de = c.main();
    const alt = [R.cap(c.time[0]), c.fin, c.s.de, c.obj].filter(Boolean).join(" ") + ".";
    /* English is ambiguous where German is not: "you" = du / ihr / Sie, "the doctor" = der Arzt / die Ärztin.
       Accept every German version the English allows, in both word orders. */
    const subs = [c.s];
    if (c.s.en === "you") subs.push({ de: "Sie", p: "3p", formal: true });
    if (c.s.en === "you (all)") subs.push({ de: "Sie", p: "3p", formal: true });
    const objsAlt = [c.obj];
    let other = null;
    if (c.o && c.o.person) {
      other = PEOPLE.find((x) => x !== c.o && x.en === c.o.en);
      if (other) objsAlt.push(np(other, c.v.obj, c.okind));
    }
    const accept = new Set([alt]);
    subs.forEach((sb) => objsAlt.forEach((ob) => {
      const [f, pr] = conjSplit(c.v, sb.p);
      const sd = sb.formal ? "Sie" : sb.de;
      accept.add([R.cap(sd), f, c.time[0], ob, pr].filter(Boolean).join(" ") + ".");
      accept.add([R.cap(c.time[0]), f, sd, ob, pr].filter(Boolean).join(" ") + ".");
    }));
    accept.delete(de);
    const notes = [];
    if (other) notes.push(`“the ${c.o.en}” can be a man or a woman, so <b>${np(c.o, c.v.obj, c.okind)}</b> and <b>${np(other, c.v.obj, c.okind)}</b> are both right`);
    if (subs.length > 1) notes.push(`“you” can be <b>${c.s.de}</b> or polite <b>Sie</b>`);
    return input("translate", 2, `Translate: <i>${c.en()}</i>`, de, `Model: <b>${de}</b><br>Also correct: ${alt}${notes.length ? "<br>" + notes.join("; ") + "." : ""}<br>Check: verb in position 2${c.v.obj ? `, ${c.v.inf} + ${CASE_NAME[c.v.obj]}` : ""}.`, { accept: [...accept], full: de });
  });

  // ---------------- public API ----------------
  function generate(id) {
    const g = id && GEN[id] ? GEN[id] : R.pick(Object.values(GEN));
    for (let i = 0; i < 6; i++) { try { lastSubj = null; const it = g.fn(); if (it) { if (lastSubj && lastSubj.de === "sie" && !it.hint) it.hint = "sie = " + lastSubj.en; it.gen = g.id; it.level = it.level || g.level; it.title = g.title; return it; } } catch (e) { console.warn("gen", g.id, e); } }
    return null;
  }
  function forLesson(n) { return Object.values(GEN).filter((g) => g.lessons.includes(n)).map((g) => g.id); }
  function sentence() { const c = clause(); return { de: c.main(), en: c.en() }; }
  function lookupNoun(word) {
    const w = word.toLowerCase();
    return NOUNS.concat(PEOPLE).find((n) => n.de.toLowerCase() === w || n.pl.toLowerCase() === w || (n.wf || "").toLowerCase() === w);
  }
  function conjugateAll(inf) {
    const v = VERB[inf] || { inf };
    const out = {};
    ["1s", "2s", "3s", "1p", "2p", "3p"].forEach((p) => { const [f, pre] = conjSplit(v, p); out[p] = f + (pre ? " … " + pre : ""); });
    return { forms: out, aux: v.aux, pp: v.pp, known: !!VERB[inf] || !!IRR[inf] };
  }
  window.Engine = { GEN, generate, forLesson, sentence, lookupNoun, conjugateAll, conj, art, np, NOUNS, PEOPLE, VERBS: V, IRR, R };
})();
