/* Deutsch Coach – drills for the lessons that had none yet (6.9): suggestions, indirect questions, Präteritum of all
   verbs + Plusquamperfekt, two-part connectors, je … desto, impersonal „es“, complex sentences, describing graphs,
   text-type phrases – plus plural, personal pronouns and dates for A1/A2. All items hand-written and checked. */
(function () {
  "use strict";
  const E = window.Engine, R = E.R;
  const def = (id, meta, fn) => (E.GEN[id] = Object.assign({ id, fn }, meta));
  const choice = (topic, lesson, prompt, answer, options, why, whyNot = {}, extra = {}) =>
    Object.assign({ kind: "choice", topic, lesson, prompt, answer, options: R.shuffle([...new Set([answer, ...options])]), why, whyNot }, extra);
  const input = (topic, lesson, prompt, answer, why, extra = {}) => Object.assign({ kind: "input", topic, lesson, prompt, answer, why }, extra);
  const B = "_____";
  const noDot = (s) => s.replace(/[.?!]$/, "");

  /* ---------- A1 L5: plural ---------- */
  def("plural", { title: "Plural of nouns", level: "A1", lessons: [5] }, () => {
    const P = [
      ["der Tisch", "die Tische", "-e: many masculine nouns (der Tisch → die Tische)."],
      ["die Lampe", "die Lampen", "-n: feminine nouns ending in -e add -n."],
      ["das Kind", "die Kinder", "-er: often neuter, usually with umlaut if possible (das Buch → die Bücher)."],
      ["das Buch", "die Bücher", "-er + umlaut: das Buch → die Bücher."],
      ["die Frau", "die Frauen", "-en: most feminine nouns (die Frau → die Frauen)."],
      ["der Apfel", "die Äpfel", "Umlaut only: many masculine nouns on -el/-er (der Vater → die Väter)."],
      ["das Auto", "die Autos", "-s: words from other languages and words ending in a vowel (das Auto, das Handy)."],
      ["der Lehrer", "die Lehrer", "No ending: masculine/neuter nouns on -er, -el, -en (der Lehrer → die Lehrer)."],
      ["die Stadt", "die Städte", "-e + umlaut: some short feminine nouns (die Stadt → die Städte)."],
      ["der Stuhl", "die Stühle", "-e + umlaut: der Stuhl → die Stühle."],
      ["die Lehrerin", "die Lehrerinnen", "-in → -innen (double n!)."],
      ["das Zimmer", "die Zimmer", "Neuter on -er: no ending."],
      ["der Freund", "die Freunde", "-e: der Freund → die Freunde."],
      ["die Tür", "die Türen", "-en: die Tür → die Türen."],
    ];
    const it = R.pick(P);
    return input("plural", 5, `Plural: <b>${it[0]}</b> → die …`, it[1], `${it[2]} The plural article is always <b>die</b>.`, { accept: [it[1].replace(/^die /, "")] });
  });

  /* ---------- A1/A2: personal pronouns in all cases ---------- */
  def("pronomen", { title: "Personal pronouns: mich, mir, ihn, ihm …", level: "A2", lessons: [6, 13] }, () => {
    const it = R.pick([
      [`Ich sehe ${B} jeden Tag. (er)`, "ihn", ["ihm", "er", "sein"], "sehen + Akkusativ: er → <b>ihn</b>."],
      [`Kannst du ${B} helfen? (ich)`, "mir", ["mich", "mein", "ich"], "helfen + Dativ: ich → <b>mir</b>."],
      [`Ich rufe ${B} morgen an. (du)`, "dich", ["dir", "du", "dein"], "anrufen + Akkusativ: du → <b>dich</b>."],
      [`Das Kleid gefällt ${B}. (sie, Singular)`, "ihr", ["sie", "ihn", "ihm"], "gefallen + Dativ: sie → <b>ihr</b>."],
      [`Wir besuchen ${B} am Sonntag. (ihr)`, "euch", ["ihr", "euer", "uns"], "besuchen + Akkusativ: ihr → <b>euch</b>."],
      [`Ich gebe ${B} das Buch. (er)`, "ihm", ["ihn", "er", "sein"], "Who receives? → Dativ: er → <b>ihm</b>."],
      [`Kommst du mit ${B}? (wir)`, "uns", ["wir", "unser", "euch"], "mit + Dativ: wir → <b>uns</b>."],
      [`Das Geschenk ist für ${B}. (Sie, formal)`, "Sie", ["Ihnen", "Ihr", "sie"], "für + Akkusativ: Sie → <b>Sie</b>."],
      [`Ich danke ${B}. (Sie, formal)`, "Ihnen", ["Sie", "Ihr", "ihnen"], "danken + Dativ: Sie → <b>Ihnen</b>."],
      [`Der Film interessiert ${B} nicht. (ich)`, "mich", ["mir", "mein", "ich"], "interessieren + Akkusativ: ich → <b>mich</b>."],
      [`Wie geht es ${B}? (du)`, "dir", ["dich", "du", "dein"], "Wie geht es + Dativ: du → <b>dir</b>."],
      [`Ich warte auf ${B}. (sie, Plural)`, "sie", ["ihnen", "ihr", "ihre"], "warten auf + Akkusativ: sie → <b>sie</b>."],
    ]);
    return choice("pronomen", 13, it[0], it[1], it[2], it[3] + " Akk: mich, dich, ihn, sie, es, uns, euch, sie/Sie · Dat: mir, dir, ihm, ihr, ihm, uns, euch, ihnen/Ihnen.");
  });

  /* ---------- A1 L9: dates and ordinal numbers ---------- */
  def("datum", { title: "Dates: am ersten Mai", level: "A1", lessons: [9] }, () => {
    const M = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
    const ORD = { 1: "ersten", 2: "zweiten", 3: "dritten", 4: "vierten", 5: "fünften", 6: "sechsten", 7: "siebten", 8: "achten", 10: "zehnten", 12: "zwölften", 15: "fünfzehnten", 19: "neunzehnten", 20: "zwanzigsten", 21: "einundzwanzigsten", 30: "dreißigsten" };
    const ORDN = { 1: "erste", 2: "zweite", 3: "dritte", 4: "vierte", 7: "siebte", 8: "achte", 10: "zehnte", 20: "zwanzigste", 21: "einundzwanzigste" };
    if (Math.random() < 0.6) {
      const d = R.pick(Object.keys(ORD)), m = R.pick(M);
      return input("datum", 9, `Wann ist der Termin? (${d}.${M.indexOf(m) + 1}.) → Am ${B} ${m}.`, ORD[d], `<b>am</b> + Dativ: ordinal + <b>-en</b>. 1–19: -ten (zweiten, but <b>ersten, dritten, siebten</b>), from 20: -sten (zwanzigsten).`, { full: `Am ${ORD[d]} ${m}.` });
    }
    const d = R.pick(Object.keys(ORDN)), m = R.pick(M);
    return input("datum", 9, `Welcher Tag ist heute? (${d}.${M.indexOf(m) + 1}.) → Heute ist der ${B} ${m}.`, ORDN[d], `<b>der</b> + ordinal + <b>-e</b> (Nominativ): der erste, der dritte, der zwanzigste.`, { full: `Heute ist der ${ORDN[d]} ${m}.` });
  });

  /* ---------- B1 L28: suggestions ---------- */
  def("vorschlaege", { title: "Suggestions: Lass uns … / Wollen wir …?", level: "B1", lessons: [27] }, () => {
    const it = R.pick([
      [`${B} uns am Samstag ins Kino gehen!`, "Lass", ["Lasst", "Lassen", "Wollen"], "To one friend (du): <b>Lass uns</b> + infinitive at the end."],
      [`${B} wir zusammen kochen?`, "Wollen", ["Lass", "Sollst", "Wollt"], "<b>Wollen wir …?</b> / <b>Sollen wir …?</b> = Shall we …? (verb first, infinitive at the end)."],
      [`Wie wäre es ${B} einem Ausflug an den See?`, "mit", ["für", "zu", "von"], "<b>Wie wäre es mit</b> + Dativ?"],
      [`Hast du Lust, morgen schwimmen ${B} gehen?`, "zu", ["um", "für", "–"], "<b>Hast du Lust, … zu + Infinitiv?</b>"],
      [`Wir ${B} doch ins Museum gehen.`, "könnten", ["können", "konnten", "würden"], "Polite suggestion: <b>Wir könnten doch …</b> (Konjunktiv II)."],
      [`${B} wir uns um acht am Bahnhof treffen?`, "Sollen", ["Lass", "Lassen", "Sollt"], "<b>Sollen wir …?</b> = Shall we …?"],
      [`Ich ${B} vor, dass wir früher anfangen.`, "schlage", ["sage", "mache", "stelle"], "<b>vorschlagen</b>: Ich schlage vor, dass …"],
      [`Was ${B} du von einem Picknick?`, "hältst", ["findest", "meinst", "denkst"], "<b>Was hältst du von</b> + Dativ? = What do you think of …?"],
      [`Gute Idee! Da ${B} ich dabei.`, "bin", ["habe", "mache", "werde"], "Agreeing: <b>Da bin ich dabei!</b> / Gute Idee!"],
      [`Am Sonntag ${B} es mir leider nicht.`, "passt", ["geht gut", "kann", "macht"], "Saying no politely: <b>Das passt mir leider nicht.</b> / Da kann ich leider nicht."],
    ]);
    return choice("vorschlaege", 27, it[0], it[1], it[2], it[3]);
  });

  /* ---------- B1 L33: indirect questions ---------- */
  def("indirekt", { title: "Indirect questions: Wissen Sie, wo …?", level: "B1", lessons: [32] }, () => {
    const it = R.pick([
      ["Wo ist der Bahnhof?", "Können Sie mir sagen,", "Können Sie mir sagen, wo der Bahnhof ist?"],
      ["Wann beginnt der Kurs?", "Wissen Sie,", "Wissen Sie, wann der Kurs beginnt?"],
      ["Kommt er morgen?", "Weißt du,", "Weißt du, ob er morgen kommt?"],
      ["Wie viel kostet das Ticket?", "Ich möchte wissen,", "Ich möchte wissen, wie viel das Ticket kostet."],
      ["Hat sie schon gegessen?", "Ich frage mich,", "Ich frage mich, ob sie schon gegessen hat."],
      ["Warum ist der Zug zu spät?", "Wissen Sie,", "Wissen Sie, warum der Zug zu spät ist?"],
      ["Kann ich hier parken?", "Darf ich fragen,", "Darf ich fragen, ob ich hier parken kann?"],
      ["Wo wohnt deine Schwester?", "Sag mir bitte,", "Sag mir bitte, wo deine Schwester wohnt."],
      ["Ruft er heute an?", "Ich weiß nicht,", "Ich weiß nicht, ob er heute anruft."],
      ["Wer hat das gesagt?", "Weißt du,", "Weißt du, wer das gesagt hat?"],
    ]);
    const yesno = /, ob /.test(it[2]);
    return input("indirekt", 32, `Make it an indirect question: <i>${it[0]}</i><br>${it[1]} …`, it[2],
      `${yesno ? "Yes/no question → <b>ob</b>." : "W-question → the question word stays."} In the indirect question the <b>verb goes to the end</b>${/ (anruft|parken kann|gegessen hat|gesagt hat)/.test(it[2]) ? " (separable verbs join again; modal/auxiliary is last)" : ""}.`,
      { accept: [noDot(it[2]), it[2].replace(/^.*?, /, ""), noDot(it[2].replace(/^.*?, /, ""))], full: it[2] });
  });

  /* ---------- B1 L36: Präteritum of all verbs + Plusquamperfekt ---------- */
  const PRAET = [
    ["gehen", "ich", "ging"], ["kommen", "er", "kam"], ["sehen", "wir", "sahen"], ["geben", "sie (Sg.)", "gab"], ["nehmen", "ich", "nahm"],
    ["finden", "er", "fand"], ["sprechen", "sie (Pl.)", "sprachen"], ["schreiben", "ich", "schrieb"], ["fahren", "wir", "fuhren"], ["bleiben", "er", "blieb"],
    ["essen", "ich", "aß"], ["trinken", "sie (Sg.)", "trank"], ["laufen", "er", "lief"], ["denken", "ich", "dachte"], ["bringen", "er", "brachte"],
    ["wissen", "ich", "wusste"], ["arbeiten", "sie (Sg.)", "arbeitete"], ["machen", "wir", "machten"], ["lesen", "er", "las"], ["stehen", "ich", "stand"],
    ["anrufen", "sie (Sg.)", "rief … an"], ["aufstehen", "ich", "stand … auf"], ["helfen", "er", "half"], ["vergessen", "ich", "vergaß"], ["werden", "er", "wurde"],
  ];
  def("praeteritum_alle", { title: "Präteritum (all verbs) & Plusquamperfekt", level: "B1", lessons: [35] }, () => {
    if (Math.random() < 0.65) {
      const [inf, p, f] = R.pick(PRAET);
      const sep = /…/.test(f);
      return input("praeteritum_alle", 35, `Präteritum: <b>${inf}</b> → ${p} ___`, sep ? f.replace(" … ", " ") : f,
        `${inf} → <b>${f}</b>. ${/te$|ten$/.test(f.split(" ")[0]) ? "Regular (weak) verb: stem + -te. Mixed verbs (denken, bringen, wissen) change the vowel <i>and</i> take -te." : "Irregular (strong) verb: new vowel, no ending for ich/er (ich ging, er ging), -en for wir/sie."}${sep ? " Separable: the prefix goes to the end (Sie rief mich an)." : ""}`,
        { accept: sep ? [f.replace(" … ", ""), f.split(" … ")[0]] : [] });
    }
    const it = R.pick([
      [`Nachdem wir gegessen ${B}, gingen wir spazieren.`, "hatten", ["haben", "waren", "hätten"], "Plusquamperfekt = hatte/war + Partizip II: the earlier of two past actions. essen → <b>hatten</b> gegessen."],
      [`Nachdem sie angekommen ${B}, rief sie ihre Mutter an.`, "war", ["hatte", "ist", "wäre"], "ankommen takes <b>sein</b> → war angekommen."],
      [`Als ich zum Bahnhof kam, ${B} der Zug schon abgefahren.`, "war", ["hatte", "ist", "wurde"], "abfahren (movement) → <b>war</b> abgefahren."],
      [`Er wusste die Antwort, weil er das Buch gelesen ${B}.`, "hatte", ["war", "hat", "wurde"], "lesen → <b>hatte</b> gelesen (Plusquamperfekt in the subordinate clause)."],
      [`Nachdem ich die Prüfung bestanden hatte, ${B} ich eine Party.`, "machte", ["mache", "hatte gemacht", "habe gemacht"], "nachdem + Plusquamperfekt → main clause in <b>Präteritum</b>."],
      [`Bevor er nach Berlin zog, ${B} er fünf Jahre in Wien gewohnt.`, "hatte", ["war", "hat", "wurde"], "wohnen → <b>hatte</b> gewohnt (earlier past)."],
    ]);
    return choice("praeteritum_alle", 35, it[0], it[1], it[2], it[3]);
  });

  /* ---------- B1 L39: two-part connectors ---------- */
  def("zweiteilig", { title: "entweder … oder, weder … noch …", level: "B1", lessons: [38] }, () => {
    const it = R.pick([
      [`Wir fahren ${B} mit dem Zug oder mit dem Auto.`, "entweder", ["weder", "sowohl", "zwar"], "<b>entweder … oder</b> = either … or (one of two)."],
      [`Er trinkt weder Kaffee ${B} Tee.`, "noch", ["oder", "und", "aber"], "<b>weder … noch</b> = neither … nor (no negation word needed!)."],
      [`Sie spricht sowohl Englisch ${B} Spanisch.`, "als auch", ["oder", "noch", "sondern auch"], "<b>sowohl … als auch</b> = both … and."],
      [`Das Hotel war nicht nur teuer, ${B} auch laut.`, "sondern", ["aber", "oder", "noch"], "<b>nicht nur … sondern auch</b> = not only … but also."],
      [`Die Wohnung ist ${B} klein, aber sehr gemütlich.`, "zwar", ["weder", "sowohl", "entweder"], "<b>zwar … aber</b> = admittedly … but."],
      [`${B} habe ich Zeit, noch habe ich Lust.`, "Weder", ["Entweder", "Zwar", "Sowohl"], "<b>Weder</b> at position 1 → the verb comes next: Weder habe ich Zeit, noch habe ich Lust. No „kein/nicht“ – weder … noch is already negative."],
      [`${B} du kommst pünktlich, oder wir fahren ohne dich.`, "Entweder", ["Weder", "Sowohl", "Zwar"], "<b>Entweder</b> takes no position: Entweder <b>du kommst</b> … (or: Entweder kommst du …)."],
      [`Je früher wir anfangen, ${B} früher sind wir fertig.`, "desto", ["als", "so", "dann"], "<b>je … desto/umso</b> + comparative."],
    ]);
    return choice("zweiteilig", 38, it[0], it[1], it[2], it[3]);
  });

  /* ---------- B1 L43: je … desto ---------- */
  def("je_desto", { title: "je … desto", level: "B1", lessons: [42] }, () => {
    const it = R.pick([
      ["Ich übe viel. Ich spreche gut.", "Je mehr ich übe, desto besser spreche ich."],
      ["Es ist spät. Ich bin müde.", "Je später es ist, desto müder bin ich."],
      ["Die Wohnung ist groß. Die Miete ist hoch.", "Je größer die Wohnung ist, desto höher ist die Miete."],
      ["Du fährst schnell. Es ist gefährlich.", "Je schneller du fährst, desto gefährlicher ist es."],
      ["Ich lese viel. Mein Wortschatz wird groß.", "Je mehr ich lese, desto größer wird mein Wortschatz."],
      ["Wir fangen früh an. Wir sind früh fertig.", "Je früher wir anfangen, desto früher sind wir fertig."],
    ]);
    return input("je_desto", 42, `Connect with <b>je … desto</b>: <i>${it[0]}</i>`, it[1],
      "<b>Je</b> + comparative + … <b>verb at the end</b>, <b>desto</b> + comparative + <b>verb</b> + subject (inversion). Comparatives: viel → mehr, gut → besser, groß → größer, hoch → höher.",
      { accept: [noDot(it[1]), it[1].replace("desto", "umso"), noDot(it[1].replace("desto", "umso"))], full: it[1] });
  });

  /* ---------- C1 L61: es, impersonal constructions, nominalisation ---------- */
  def("es_unpersoenlich", { title: "„es“ & impersonal constructions", level: "C1", lessons: [54] }, () => {
    const it = R.pick([
      [`${B} wird in Deutschland viel über Klimaschutz diskutiert.`, "Es", ["Man", "Das", "Er"], "Subjectless passive: the placeholder <b>es</b> fills position 1 – and disappears if something else stands there: <i>In Deutschland wird viel diskutiert.</i>"],
      [`In dem Artikel ${B} es um die Energiewende.`, "geht", ["handelt", "gibt", "steht"], "<b>es geht um</b> + Akkusativ = it is about."],
      [`Bei dem Problem handelt es sich ${B} einen Softwarefehler.`, "um", ["über", "von", "an"], "<b>es handelt sich um</b> + Akkusativ (always with sich)."],
      [`Mir ist ${B} wichtig, dass alle informiert sind.`, "es", ["das", "–", "man"], "Correlate <b>es</b> pointing forward to the dass-clause."],
      [`Es ${B} sich, früh zu buchen.`, "lohnt", ["gibt", "geht", "handelt"], "<b>es lohnt sich</b>, … zu + Infinitiv = it is worth …"],
      [`Hier ${B} nicht geraucht.`, "wird", ["ist", "es wird", "man"], "Impersonal passive without es when position 1 is filled: <b>Hier wird nicht geraucht.</b>"],
      [`Die ${B} der Regeln ist Pflicht.`, "Einhaltung", ["Einhalten", "Einhaltene", "Einhalt"], "Nominalisation: einhalten → <b>die Einhaltung</b> (-ung, feminine)."],
      [`Nach der ${B} des Vertrags begann das Projekt.`, "Unterzeichnung", ["Unterschreiben", "Unterzeichnen", "Unterschrift von"], "unterzeichnen → <b>die Unterzeichnung</b> + Genitiv."],
      [`Es ${B} darauf an, wie man die Daten interpretiert.`, "kommt", ["geht", "liegt", "hängt"], "<b>es kommt darauf an</b>, … = it depends on …"],
    ]);
    return choice("es_unpersoenlich", 54, it[0], it[1], it[2], it[3]);
  });

  /* ---------- C2 L69: participle clauses, ellipsis, inversion ---------- */
  def("satz_c2", { title: "Participle clauses & inversion", level: "C2", lessons: [58] }, () => {
    const it = R.pick([
      ["Als er in Berlin angekommen war, rief er sofort an.", "In Berlin angekommen, rief er sofort an.", "Participle clause (Partizip II) replaces a time clause with the same subject."],
      ["Weil sie von der Kritik überrascht war, schwieg sie.", "Von der Kritik überrascht, schwieg sie.", "Partizip II clause instead of a weil-clause."],
      ["Während er laut lachte, verließ er den Raum.", "Laut lachend verließ er den Raum.", "Partizip I clause = at the same time."],
      ["Wenn man es genau betrachtet, ist das falsch.", "Genau betrachtet ist das falsch.", "Fixed participle phrase: genau betrachtet, streng genommen, offen gesagt."],
      ["Wenn ich ehrlich sein soll, halte ich das für riskant.", "Ehrlich gesagt halte ich das für riskant.", "ehrlich gesagt / kurz gesagt + inversion of the main clause."],
      ["Wenn er das gewusst hätte, wäre er gekommen.", "Hätte er das gewusst, wäre er gekommen.", "Conditional without wenn: <b>verb first</b> (Hätte er …, wäre …)."],
      ["Wenn Sie Fragen haben, wenden Sie sich an uns.", "Haben Sie Fragen, wenden Sie sich an uns.", "wenn left out → the verb moves to position 1."],
    ]);
    return input("satz_c2", 58, `Make it more compact: <i>${it[0]}</i>`, it[1], it[2], { accept: [noDot(it[1]), it[1].replace(/ angekommen, /, " angekommen ")], full: it[1] });
  });

  /* ---------- C1 L66: describing graphs and statistics ---------- */
  def("grafik", { title: "Describing graphs: um / auf / von …", level: "C1", lessons: [70] }, () => {
    const it = R.pick([
      [`Die Zahl der Nutzer ist ${B} 20 % gestiegen. (Differenz)`, "um", ["auf", "von", "bei"], "<b>um</b> = by how much (the difference)."],
      [`Der Preis ist von 3 Euro ${B} 4 Euro gestiegen.`, "auf", ["um", "zu", "bis"], "<b>von … auf</b> = from … to (the new value)."],
      [`Der Anteil liegt ${B} 35 Prozent.`, "bei", ["um", "auf", "in"], "<b>liegen bei</b> = to be at (a value)."],
      [`Die Grafik ${B} die Entwicklung der Mieten von 2010 bis 2020.`, "zeigt", ["sagt", "spricht", "macht"], "<b>Die Grafik zeigt / stellt … dar / gibt Auskunft über</b> …"],
      [`Die Arbeitslosigkeit ist deutlich ${B}.`, "gesunken", ["gesenkt", "gefallen worden", "gesinkt"], "<b>sinken – sank – ist gesunken</b> (intransitive). <i>senken</i> needs an object."],
      [`Im Vergleich ${B} 2015 hat sich die Zahl verdoppelt.`, "zu", ["mit", "von", "an"], "<b>im Vergleich zu</b> + Dativ."],
      [`Die Kurve ${B} ihren Höhepunkt im Jahr 2019.`, "erreicht", ["macht", "steigt", "hat"], "<b>einen Höhepunkt erreichen</b>."],
      [`Mehr als die ${B} der Befragten nutzt täglich das Internet.`, "Hälfte", ["Halbe", "halb", "Halbheit"], "<b>die Hälfte</b> · ein Drittel · ein Viertel · drei Viertel."],
      [`Die Zahlen sind ${B} 2018 konstant geblieben.`, "seit", ["vor", "ab", "um"], "<b>seit</b> + Zeitpunkt for a state up to now."],
    ]);
    return choice("grafik", 70, it[0], it[1], it[2], it[3]);
  });

  /* ---------- C1/C2 L63, L73: phrases for text types and the exam ---------- */
  def("redemittel", { title: "Exam phrases: essay, summary, opinion", level: "C1", lessons: [56, 60, 67] }, () => {
    const it = R.pick([
      [`Der Text ${B} sich mit der Frage, ob Homeoffice produktiver ist.`, "befasst", ["handelt", "geht", "spricht"], "Summary opener: <b>Der Text befasst sich mit</b> + Dativ / <b>handelt von</b> + Dativ."],
      [`Der Autor ${B} die These, dass Bildung der Schlüssel ist.`, "vertritt", ["macht", "hält", "sagt"], "eine These / Meinung <b>vertreten</b>."],
      [`${B} sind die Vorteile größer.`, "Meiner Meinung nach", ["Nach meine Meinung", "In meiner Meinung", "Für meine Meinung"], "<b>Meiner Meinung nach</b> … (nach after the noun) – or: Ich bin der Ansicht, dass …"],
      [`Dagegen ${B} sich einwenden, dass die Kosten hoch sind.`, "lässt", ["kann", "muss", "wird"], "<b>Dagegen lässt sich einwenden, dass …</b> = a counter-argument."],
      [`${B} lässt sich sagen, dass beide Seiten Recht haben.`, "Abschließend", ["Schließend", "Zum Schluss von", "Endlich"], "Conclusion: <b>Abschließend / Zusammenfassend lässt sich sagen …</b>"],
      [`Ein wichtiges Argument ${B} ist die Flexibilität.`, "dafür", ["dazu", "darauf", "davor"], "Argument <b>dafür / dagegen</b>."],
      [`Ich ${B} Ihnen da nur teilweise zustimmen.`, "kann", ["muss", "darf", "werde"], "Partial agreement: <b>Da kann ich Ihnen nur teilweise zustimmen.</b>"],
      [`Hiermit ${B} ich mich über den schlechten Service beschweren.`, "möchte", ["will gern", "werde", "soll"], "Formal letter: <b>Hiermit möchte ich …</b>"],
      [`Ich ${B} mich über eine baldige Antwort freuen.`, "würde", ["werde", "hätte", "wäre"], "Formal close: <b>Ich würde mich über eine baldige Antwort freuen.</b> (Konjunktiv II = polite)."],
    ]);
    return choice("redemittel", 56, it[0], it[1], it[2], it[3]);
  });
})();
