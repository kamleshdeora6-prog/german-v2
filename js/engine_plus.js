/* Deutsch Coach – generators for B2 / C1 / C2 and the free word-order builder.
   Registers itself into Engine.GEN, so everything (practice, exams, tutor quizzes) picks them up. */
(function () {
  "use strict";
  const E = window.Engine, R = E.R;
  const def = (id, meta, fn) => (E.GEN[id] = Object.assign({ id, fn }, meta));
  const choice = (topic, lesson, prompt, answer, options, why, whyNot = {}, extra = {}) =>
    Object.assign({ kind: "choice", topic, lesson, prompt, answer, options: R.shuffle([...new Set([answer, ...options])]), why, whyNot }, extra);
  const input = (topic, lesson, prompt, answer, why, extra = {}) => Object.assign({ kind: "input", topic, lesson, prompt, answer, why }, extra);
  const list = (arr) => R.pick(arr);
  const blank = "_____";

  /* ---------- L43 Konjunktiv I ---------- */
  const K1 = { sein: "sei", haben: "habe", werden: "werde", können: "könne", müssen: "müsse", wollen: "wolle", sollen: "solle", dürfen: "dürfe", wissen: "wisse" };
  def("konjunktiv1", { title: "Konjunktiv I (reported speech)", level: "B2", lessons: [43] }, () => {
    const it = list([
      ["„Ich bin im Büro.“", "sei", "Er sagt, er " + blank + " im Büro.", ["ist", "wäre"], "sein → Konjunktiv I <b>sei</b> (3. Person Singular)."],
      ["„Ich habe keine Zeit.“", "habe", "Sie erklärt, sie " + blank + " keine Zeit.", ["hat", "hätte"], "haben → <b>habe</b>. Konjunktiv II (hätte) nur, wenn Konj. I wie der Indikativ aussieht."],
      ["„Wir kommen später.“", "kämen", "Sie sagen, sie " + blank + " später.", ["kommen", "kommten"], "Plural „kommen“ = Indikativ → Ausweichform <b>Konjunktiv II: kämen</b> (oder: würden kommen)."],
      ["„Ich habe den Bericht gelesen.“", "habe", "Er behauptet, er " + blank + " den Bericht gelesen.", ["hat", "hätte"], "Vergangenheit in der indirekten Rede: <b>habe/sei + Partizip II</b>."],
      ["„Ich bin gestern gefahren.“", "sei", "Sie sagt, sie " + blank + " gestern gefahren.", ["ist", "wäre"], "sein-Perfekt → <b>sei + Partizip II</b>."],
      ["„Ich werde kündigen.“", "werde", "Er kündigte an, er " + blank + " kündigen.", ["wird", "würde"], "Zukunft in der indirekten Rede: <b>werde + Infinitiv</b>."],
      ["„Ich kann das nicht.“", "könne", "Sie meint, sie " + blank + " das nicht.", ["kann", "könnte"], "Modalverben bilden den Konjunktiv I regelmäßig: <b>könne, müsse, wolle</b>."],
      ["„Ich weiß nichts davon.“", "wisse", "Er behauptet, er " + blank + " nichts davon.", ["weiß", "wüsste"], "wissen → <b>wisse</b>."],
    ]);
    return choice("konjunktiv1", 43, `Indirekte Rede: ${it[0]} → ${it[2]}`, it[1], it[3], it[4],
      { [it[3][0]]: "Das ist der Indikativ – dann übernimmst du die Aussage als eigene Behauptung.", [it[3][1]]: "Konjunktiv II nimmt man nur, wenn die Konjunktiv-I-Form mit dem Indikativ identisch wäre." });
  });

  /* ---------- L44 Partizipien ---------- */
  def("partizip", { title: "Participles as adjectives", level: "B2", lessons: [44] }, () => {
    const PART = [
      ["die Kinder, die spielen", "die spielenden Kinder", "Partizip I (Infinitiv + d) = aktiv und gleichzeitig."],
      ["der Brief, der geschrieben wurde", "der geschriebene Brief", "Partizip II = passiv/abgeschlossen."],
      ["die Kosten, die steigen", "die steigenden Kosten", "Partizip I für einen laufenden Vorgang."],
      ["der Zug, der angekommen ist", "der angekommene Zug", "sein-Verb → Partizip II bleibt aktiv, aber abgeschlossen."],
      ["die Aufgabe, die gelöst werden muss", "die zu lösende Aufgabe", "„zu + Partizip I“ = passiv + notwendig."],
      ["die Rechnung, die bezahlt werden muss", "die zu zahlende Rechnung", "Notwendigkeit → zu + Partizip I."],
      ["der Kollege, der in Bonn arbeitet", "der in Bonn arbeitende Kollege", "Erweitertes Attribut: Ergänzung steht vor dem Partizip."],
      ["die Studie, die letztes Jahr erschien", "die letztes Jahr erschienene Studie", "Erweitertes Attribut mit Partizip II."],
    ];
    const it = list(PART);
    if (Math.random() < 0.5) return input("partizip", 44, `Verdichten Sie zu einem Attribut: <i>${it[0]}</i>`, it[1], it[2]);
    return input("partizip", 44, `Lösen Sie auf (Relativsatz): <i>${it[1]}</i>`, it[0], it[2], { accept: [it[0].replace(/^die |^der |^das /, "")] });
  });

  /* ---------- L45 Nominal- / Verbalstil ---------- */
  def("nominalstil", { title: "Nominal ↔ verbal style", level: "B2", lessons: [45] }, () => {
    const N = [
      ["weil es geregnet hat", "wegen des Regens", "weil → <b>wegen + Genitiv</b>."],
      ["obwohl es kalt war", "trotz der Kälte", "obwohl → <b>trotz + Genitiv</b>."],
      ["nachdem wir geprüft haben", "nach der Prüfung", "nachdem → <b>nach + Dativ</b>."],
      ["bevor die Sitzung beginnt", "vor Beginn der Sitzung", "bevor → <b>vor + Dativ</b>."],
      ["wenn Sie ankommen", "bei Ihrer Ankunft", "wenn/falls → <b>bei + Dativ</b>."],
      ["indem man Energie spart", "durch Energiesparen", "indem → <b>durch + Akkusativ</b>."],
      ["um die Kosten zu senken", "zur Senkung der Kosten", "um … zu → <b>zu/zwecks + Nomen</b>."],
      ["weil die Preise gestiegen sind", "aufgrund gestiegener Preise", "aufgrund + Genitiv, Adjektiv ohne Artikel → -er."],
    ];
    const it = list(N);
    if (Math.random() < 0.5) return input("nominalstil", 45, `Nominalstil: <i>${it[0]}</i> → ?`, it[1], it[2]);
    return input("nominalstil", 45, `Verbalstil (Nebensatz): <i>${it[1]}</i> → ?`, it[0], it[2]);
  });

  /* ---------- L46 Passiv-Ersatzformen ---------- */
  def("passiversatz", { title: "Passive alternatives", level: "B2", lessons: [46] }, () => {
    const v = R.pick(E.VERBS.filter((x) => ["reparieren", "öffnen", "lösen", "bezahlen", "erledigen", "waschen", "bestellen"].includes(x.inf) || x.obj === "akk"));
    const P = [
      ["Das kann leicht repariert werden.", "Das lässt sich leicht reparieren.", "<b>sich lassen + Infinitiv</b> = kann … werden."],
      ["Die Formulare müssen abgegeben werden.", "Die Formulare sind abzugeben.", "<b>sein + zu + Infinitiv</b> = muss … werden."],
      ["Der Plan kann umgesetzt werden.", "Der Plan ist umsetzbar.", "Adjektiv auf <b>-bar</b> = kann … werden."],
      ["Die Tür kann nicht geöffnet werden.", "Die Tür lässt sich nicht öffnen.", "Negative Möglichkeit mit sich lassen."],
      ["Die Rechnung muss heute bezahlt werden.", "Die Rechnung ist heute zu bezahlen.", "Notwendigkeit mit sein + zu."],
      ["Das Problem kann gelöst werden.", "Das Problem lässt sich lösen.", "Möglichkeit mit sich lassen."],
    ];
    const it = list(P);
    if (Math.random() < 0.55) return input("passiversatz", 46, `Ersatzform statt Passiv: <i>${it[0]}</i>`, it[1], it[2], { accept: [it[1].replace(/\.$/, "")] });
    return input("passiversatz", 46, `Formulieren Sie als Passiv mit Modalverb: <i>${it[1]}</i>`, it[0], it[2]);
  });

  /* ---------- L47 Konnektoren B2 ---------- */
  def("konnektor_b2", { title: "falls, indem, sodass, anstatt", level: "B2", lessons: [47] }, () => {
    const it = list([
      [`${blank} es regnet, fällt das Fest aus.`, "Falls", ["Indem", "Sodass", "Anstatt"], "Bedingung → <b>falls/wenn</b>."],
      [`Man spart Energie, ${blank} man weniger heizt.`, "indem", ["sodass", "falls", "anstatt"], "Mittel/Weg (Wie?) → <b>indem</b>."],
      [`Der Zug fiel aus, ${blank} wir zu spät kamen.`, "sodass", ["indem", "falls", "obwohl"], "Folge → <b>sodass</b>."],
      [`${blank} zu diskutieren, sollten wir abstimmen.`, "Anstatt", ["Indem", "Falls", "Sodass"], "Alternative → <b>anstatt … zu</b>."],
      [`Wir kommen, ${blank}, es schneit.`, "es sei denn", ["indem", "sodass", "falls"], "Ausnahme → <b>es sei denn</b>."],
      [`${blank} Sie einverstanden sind, beginnen wir.`, "Sofern", ["Indem", "Sodass", "Anstatt"], "Formelle Bedingung → <b>sofern</b>."],
      [`Beeil dich, ${blank} verpassen wir den Zug.`, "sonst", ["indem", "falls", "sodass"], "Negative Folge → <b>sonst/andernfalls</b>."],
      [`Es war so kalt, ${blank} der See zufror.`, "dass", ["sodass", "indem", "falls"], "Nach <b>so + Adjektiv</b> folgt <b>dass</b>."],
    ]);
    return choice("konnektor_b2", 47, it[0], it[1], it[2], it[3]);
  });

  /* ---------- L48 Funktionsverbgefüge ---------- */
  def("funktionsverb", { title: "Noun–verb combinations", level: "B2", lessons: [48] }, () => {
    const F = [
      ["eine Entscheidung", "treffen", ["machen", "nehmen", "geben"], "eine Entscheidung <b>treffen</b> (= entscheiden). „machen“ ist falsch."],
      ["Kritik", "üben", ["machen", "geben", "nehmen"], "Kritik <b>üben</b> an + Dativ."],
      ["in Betracht", "ziehen", ["nehmen", "setzen", "bringen"], "etwas in Betracht <b>ziehen</b> = erwägen."],
      ["zur Verfügung", "stehen", ["haben", "machen", "geben"], "jemandem zur Verfügung <b>stehen</b> (oder: stellen)."],
      ["in Kraft", "treten", ["gehen", "kommen", "setzen"], "Ein Gesetz <b>tritt</b> in Kraft."],
      ["Rücksicht", "nehmen", ["geben", "machen", "halten"], "Rücksicht <b>nehmen</b> auf + Akkusativ."],
      ["Maßnahmen", "ergreifen", ["machen", "tun", "setzen"], "Maßnahmen <b>ergreifen</b> (formell)."],
      ["eine Frage", "stellen", ["machen", "fragen", "geben"], "eine Frage <b>stellen</b>."],
      ["Bezug", "nehmen", ["machen", "geben", "setzen"], "Bezug <b>nehmen</b> auf + Akkusativ."],
      ["in Anspruch", "nehmen", ["ziehen", "stellen", "setzen"], "etwas in Anspruch <b>nehmen</b> = nutzen."],
      ["Wert", "legen", ["setzen", "geben", "halten"], "Wert <b>legen</b> auf + Akkusativ."],
      ["zur Sprache", "bringen", ["nehmen", "stellen", "geben"], "ein Thema zur Sprache <b>bringen</b> = ansprechen."],
    ];
    const it = list(F);
    return choice("funktionsverb", 48, `Ergänzen Sie das passende Verb: <i>${it[0]} ${blank}</i>`, it[1], it[2], it[3]);
  });

  /* ---------- L49 subjektive Modalverben ---------- */
  def("modal_subjektiv", { title: "Modal verbs: certainty", level: "B2", lessons: [49] }, () => {
    const it = list([
      ["Sein Auto steht vor dem Haus. Er ___ zu Hause sein. (fast sicher)", "muss", ["darf", "soll", "will"], "Logischer Schluss, fast sicher → <b>muss</b>."],
      ["Die Reparatur ___ etwa 200 Euro kosten. (vorsichtige Schätzung)", "dürfte", ["muss", "will", "soll"], "Vorsichtige Vermutung → <b>dürfte</b>."],
      ["Sie ___ im Stau stehen, sicher weiß ich es nicht. (möglich)", "könnte", ["muss", "soll", "will"], "Möglichkeit → <b>könnte/kann</b>."],
      ["Das ___ nicht stimmen, die Zahlen widersprechen sich. (ausgeschlossen)", "kann", ["darf", "soll", "will"], "Ausgeschlossen → <b>kann nicht</b>."],
      ["Er ___ nichts davon gewusst haben, sagt er selbst.", "will", ["soll", "muss", "darf"], "Eigenbehauptung des Subjekts → <b>will</b>."],
      ["Die Firma ___ Probleme haben, heißt es in der Presse.", "soll", ["will", "muss", "darf"], "Fremdbehauptung → <b>soll</b>."],
      ["Das ___ ungewöhnlich sein, verboten ist es aber nicht.", "mag", ["muss", "will", "soll"], "Eingeräumte Möglichkeit → <b>mag</b>."],
    ]);
    return choice("modal_subjektiv", 49, it[0], it[1], it[2], it[3],
      { will: "„will“ heißt hier: die Person behauptet es über sich selbst.", soll: "„soll“ heißt: andere behaupten es." });
  });

  /* ---------- L50 Konjunktiv II Vergangenheit ---------- */
  def("konj2_vergangenheit", { title: "Konjunktiv II (past)", level: "B2", lessons: [50] }, () => {
    const it = list([
      ["Ich hatte keine Zeit, deshalb kam ich nicht.", "Wenn ich Zeit gehabt hätte, wäre ich gekommen.", "Irreale Vergangenheit: <b>hätte/wäre + Partizip II</b> in beiden Teilen."],
      ["Du hast nicht angerufen. (höflicher Vorwurf)", "Du hättest anrufen können.", "Vorwurf: <b>hätte + Infinitiv + Modalinfinitiv</b> (doppelter Infinitiv)."],
      ["Ich wusste es nicht, deshalb blieb ich.", "Hätte ich es gewusst, wäre ich nicht geblieben.", "Ohne „wenn“ steht das Verb an erster Stelle."],
      ["Er ist nicht der Chef, verhält sich aber so.", "Er verhält sich, als ob er der Chef wäre.", "Irrealer Vergleich: <b>als ob + Konjunktiv II</b> (Verb am Ende)."],
      ["Schade, ich habe nicht gelernt.", "Wenn ich nur gelernt hätte!", "Irrealer Wunsch mit <b>nur/doch</b>."],
      ["Wir hatten kein Geld, deshalb fuhren wir nicht weg.", "Wenn wir Geld gehabt hätten, wären wir weggefahren.", "hätten + P II / wären + P II."],
    ]);
    return input("konj2_vergangenheit", 50, `Formulieren Sie irreal: <i>${it[0]}</i>`, it[1], it[2]);
  });

  /* ---------- L51 erweiterte Attribute ---------- */
  def("attribut_c1", { title: "Extended attributes", level: "C1", lessons: [51] }, () => {
    const A = [
      ["die vom Ausschuss geprüften Anträge", "die Anträge, die der Ausschuss geprüft hat", "Partizip II + Agens („vom Ausschuss“) → Aktivsatz im Relativsatz."],
      ["die in den letzten Jahren stark gestiegenen Kosten", "die Kosten, die in den letzten Jahren stark gestiegen sind", "sein-Verb → Perfekt mit „sind“."],
      ["die noch zu klärenden Fragen", "die Fragen, die noch geklärt werden müssen", "zu + Partizip I = Passiv + Notwendigkeit."],
      ["der gestern veröffentlichte Bericht", "der Bericht, der gestern veröffentlicht wurde", "Partizip II ohne Agens → Passiv."],
      ["die an der Studie beteiligten Forschenden", "die Forschenden, die an der Studie beteiligt waren", "Partizip II mit Präposition."],
    ];
    const it = list(A);
    if (Math.random() < 0.5) return input("attribut_c1", 51, `Lösen Sie in einen Relativsatz auf: <i>${it[0]}</i>`, it[1], it[2]);
    return input("attribut_c1", 51, `Verdichten Sie zu einem Attribut: <i>${it[1]}</i>`, it[0], it[2]);
  });

  /* ---------- L52 Modalpartikeln ---------- */
  def("modalpartikel", { title: "Modal particles", level: "C1", lessons: [52] }, () => {
    const it = list([
      [`Wie heißt du ${blank}? (freundliches Interesse)`, "denn", ["doch", "eben", "bloß"], "In Fragen signalisiert <b>denn</b> freundliches Interesse."],
      [`Komm ${blank} her! (lockere Aufforderung)`, "mal", ["ja", "eben", "etwa"], "<b>mal</b> macht Aufforderungen weicher."],
      [`Das weißt du ${blank}! (Erinnerung, leichter Vorwurf)`, "doch", ["mal", "etwa", "bloß"], "<b>doch</b> erinnert an etwas Bekanntes."],
      [`Dann machen wir es ${blank} morgen. (Resignation)`, "eben", ["ja", "denn", "mal"], "<b>eben/halt</b> = so ist es nun mal."],
      [`Er ist ${blank} noch im Meeting. (Vermutung)`, "wohl", ["ja", "mal", "bloß"], "<b>wohl</b> drückt eine Vermutung aus."],
      [`Vergiss das ${blank} nicht! (Warnung, betont)`, "ja", ["denn", "mal", "eben"], "Betontes <b>ja</b> ist eine Warnung."],
      [`Wo ist ${blank} mein Schlüssel? (Ungeduld)`, "bloß", ["denn", "eben", "ja"], "<b>bloß/nur</b> zeigt Ungeduld oder Sorge."],
      [`Hast du das ${blank} vergessen? (Vorwurf, Zweifel)`, "etwa", ["mal", "eben", "wohl"], "<b>etwa</b> in Fragen = Zweifel oder Vorwurf."],
      [`Das schaffst du ${blank}. (beruhigend)`, "schon", ["etwa", "bloß", "denn"], "<b>schon</b> beruhigt."],
    ]);
    return choice("modalpartikel", 52, it[0], it[1], it[2], it[3]);
  });

  /* ---------- L53 Kohäsion ---------- */
  def("kohaesion", { title: "Cohesion: concessive & consecutive", level: "C1", lessons: [53] }, () => {
    const it = list([
      [`${blank} die Kosten hoch sind, lohnt sich das Projekt.`, "Obwohl", ["Wohingegen", "Folglich", "Ungeachtet"], "Konzessiver Nebensatz → <b>obwohl</b> (Verb am Ende)."],
      [`Die Kosten sind hoch; ${blank} lohnt sich das Projekt.`, "gleichwohl", ["obwohl", "wohingegen", "zumal"], "Adverb nach Semikolon → <b>gleichwohl/dennoch</b> + Inversion."],
      [`Im Norden regnet es, ${blank} im Süden die Sonne scheint.`, "wohingegen", ["folglich", "zumal", "obwohl"], "Gegensatz zweier Sachverhalte → <b>wohingegen</b>."],
      [`Die Maschine war defekt; ${blank} verzögerte sich die Lieferung.`, "folglich", ["obwohl", "wohingegen", "zumal"], "Folge → <b>folglich/infolgedessen</b>."],
      [`${blank} der Kritik hält die Firma am Kurs fest.`, "Ungeachtet", ["Folglich", "Zumal", "Wohingegen"], "<b>ungeachtet + Genitiv</b> = trotz."],
      [`Wir handeln jetzt, ${blank} die Frist bald abläuft.`, "zumal", ["wohingegen", "folglich", "ungeachtet"], "<b>zumal</b> verstärkt einen Grund."],
      [`${blank} die Methode teuer ist, liefert sie genaue Ergebnisse.`, "Zwar", ["Folglich", "Zumal", "Ungeachtet"], "<b>zwar … jedoch</b> räumt ein und schränkt dann ein."],
      [`${blank} der aktuellen Lage verschieben wir die Investition.`, "Angesichts", ["Wohingegen", "Folglich", "Gleichwohl"], "<b>angesichts + Genitiv</b> = in Anbetracht."],
    ]);
    return choice("kohaesion", 53, it[0], it[1], it[2], it[3]);
  });

  /* ---------- L55 Kollokationen ---------- */
  def("kollokation", { title: "Collocations", level: "C1", lessons: [55] }, () => {
    const C = [
      ["___ Sie bitte dem Hinweis Beachtung.", "Schenken", ["Geben", "Machen", "Setzen"], "Beachtung <b>schenken</b>."],
      ["Der Fehler konnte schnell ___ werden.", "behoben", ["gemacht", "gelöscht", "genommen"], "einen Fehler <b>beheben</b>."],
      ["Die Kampagne hat großes Interesse ___.", "geweckt", ["gemacht", "gegeben", "gefunden"], "Interesse <b>wecken</b>."],
      ["Wir ___ großen Wert auf Pünktlichkeit.", "legen", ["machen", "geben", "halten"], "Wert <b>legen</b> auf."],
      ["Die Zahlen ___ deutlich voneinander ab.", "weichen", ["gehen", "fallen", "treten"], "<b>abweichen</b> von."],
      ["Das Angebot ___ sich an Fachkräfte.", "richtet", ["wendet", "zielt", "geht"], "sich <b>richten</b> an + Akk."],
      ["Die Kosten ___ erheblich ins Gewicht.", "fallen", ["gehen", "treten", "kommen"], "ins Gewicht <b>fallen</b> = bedeutsam sein."],
      ["Er hat sich zurückhaltend zu den Plänen ___.", "geäußert", ["gesagt", "gesprochen", "gemeint"], "sich <b>äußern</b> zu + Dativ."],
    ];
    const it = list(C);
    return choice("kollokation", 55, it[0], it[1], it[2], it[3]);
  });

  /* ---------- L57 Register ---------- */
  def("register", { title: "Register: formal ↔ casual", level: "C2", lessons: [57, 59] }, () => {
    const Rg = [
      ["Ich melde mich.", "Ich werde mich mit Ihnen in Verbindung setzen.", "formell"],
      ["Keine Ahnung.", "Hierzu liegen mir keine Informationen vor.", "formell"],
      ["Das geht nicht klar.", "Dies ist nicht hinnehmbar.", "gehoben"],
      ["Mach hin!", "Ich bitte um zügige Bearbeitung.", "formell"],
      ["Das kostet echt viel.", "Damit sind erhebliche Kosten verbunden.", "formell"],
      ["Sag mal, wann kommst du?", "Dürfte ich fragen, wann Sie kommen?", "formell"],
    ];
    const it = list(Rg);
    if (Math.random() < 0.5) return input("register", 57, `Formulieren Sie formell: <i>„${it[0]}“</i>`, it[1], `Formelles Register: unpersönlich, Nominalstil, Höflichkeitsformen. Umgangssprachlich: „${it[0]}“`);
    return input("register", 57, `Formulieren Sie alltagssprachlich: <i>„${it[1]}“</i>`, it[0], `Alltagssprache ist kürzer, verbal und direkt; formell wäre: „${it[1]}“`);
  });

  /* ---------- L59 Nuancen / Hedging ---------- */
  def("nuancen", { title: "Hedging and emphasis", level: "C2", lessons: [59] }, () => {
    const it = list([
      [`Das Argument ist ${blank} unberechtigt. (höflich abschwächen: es hat etwas für sich)`, "nicht ganz", ["völlig", "überaus", "durchaus"], "Litotes: <b>nicht ganz un-…</b> schwächt stark ab."],
      [`Die Zahlen ${blank} eher optimistisch sein. (vorsichtig)`, "dürften", ["müssen", "wollen", "sollen"], "<b>dürfte</b> = vorsichtige Vermutung."],
      [`Ihr Vorschlag ist ${blank} hilfreich. (verstärken)`, "überaus", ["eher", "kaum", "nicht ganz"], "<b>überaus/ausgesprochen</b> verstärkt."],
      [`Der Aufwand war ${blank} gering. (= sehr groß)`, "alles andere als", ["durchaus", "eher", "überaus"], "<b>alles andere als</b> verneint stark."],
      [`Die ${blank} Lösung schuf neue Probleme. (Distanz)`, "vermeintliche", ["ausgesprochene", "durchaus", "eher"], "<b>vermeintlich</b> markiert Distanz zur Behauptung."],
      [`${blank} ich sehe, fehlen belastbare Daten. (Vorbehalt)`, "Soweit", ["Durchaus", "Überaus", "Keineswegs"], "<b>soweit ich sehe</b> schränkt die eigene Aussage ein."],
      [`Das ist ${blank} möglich. (Widerspruch zu Zweifeln)`, "durchaus", ["kaum", "eher", "nicht ganz"], "<b>durchaus</b> bestätigt gegen einen Einwand."],
    ]);
    return choice("nuancen", 59, it[0], it[1], it[2], it[3]);
  });

  /* ================= free word order: several correct answers ================= */
  const TIMES = [["heute", "today"], ["morgen", "tomorrow"], ["am Montag", "on Monday"], ["nach der Arbeit", "after work"], ["jeden Tag", "every day"], ["um acht Uhr", "at eight"]];
  const PLACES = [["im Park", "in the park"], ["in der Stadt", "in town"], ["zu Hause", "at home"], ["im Büro", "at the office"], ["auf dem Markt", "at the market"]];
  const MANNER = [["mit dem Rad", "by bike"], ["zu Fuß", "on foot"], ["gemeinsam", "together"], ["in Ruhe", "calmly"]];

  function permutations(a) {
    if (a.length <= 1) return [a];
    const out = [];
    a.forEach((x, i) => permutations(a.slice(0, i).concat(a.slice(i + 1))).forEach((p) => out.push([x].concat(p))));
    return out;
  }
  /* Middle-field rules kept: dative before accusative (nouns), time before place,
     manner before place. Everything else may move – that is what makes German flexible. */
  function midOk(order) {
    const idx = (t) => order.findIndex((e) => e.t === t);
    const has = (t) => idx(t) >= 0;
    if (has("dat") && has("akk") && idx("dat") > idx("akk")) return false;
    if (has("time") && has("place") && idx("time") > idx("place")) return false;
    if (has("manner") && has("place") && idx("manner") > idx("place")) return false;
    if (has("time") && has("manner") && idx("time") > idx("manner")) return false;
    return true;
  }
  function buildOrders(parts) {
    const { subject, verb, end } = parts;
    const els = parts.elements;
    const res = new Set();
    const fronts = [{ t: "subj", text: subject }].concat(els);
    fronts.forEach((front) => {
      const rest = front.t === "subj" ? els : els.filter((e) => e !== front);
      permutations(rest).forEach((p) => {
        if (!midOk(p)) return;
        const mid = front.t === "subj" ? p.map((e) => e.text) : [subject].concat(p.map((e) => e.text));
        const s = [cap(front.text), verb].concat(mid).concat(end ? [end] : []).join(" ") + ".";
        res.add(s);
      });
    });
    return [...res];
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  def("satzbau", { title: "Word order – several correct answers", level: "B1", lessons: [3, 45] }, () => {
    const s = R.pick([{ de: "ich", p: "1s", en: "I" }, { de: "wir", p: "1p", en: "we" }, { de: "er", p: "3s", en: "he" }, { de: "sie", p: "3p", en: "they" }]);
    const kind = Math.random();
    let parts, why;
    if (kind < 0.3) {
      // transitive verb + place that fits the action
      const v = R.pick(E.VERBS.filter((x) => ["kaufen", "lesen", "essen", "trinken", "suchen", "treffen"].includes(x.inf)));
      const o = R.pick(E.NOUNS.concat(E.PEOPLE).filter((n) => n.tags.includes(v.tag === "person" ? "person" : v.tag)));
      parts = { subject: s.de, verb: E.conj(v, s.p), end: "",
        elements: [{ t: "time", text: R.pick(TIMES)[0] }, { t: "akk", text: E.np(o, "akk", "def") }, { t: "place", text: R.pick(PLACES)[0] }] };
      why = "The conjugated verb stays in position 2. Subject, time and place may swap – but the time expression stays <b>before</b> the place (TeKaMoLo).";
    } else if (kind < 0.5) {
      // movement: manner + direction
      const v = R.pick(E.VERBS.filter((x) => ["fahren", "gehen", "laufen"].includes(x.inf)));
      parts = { subject: s.de, verb: E.conj(v, s.p), end: "",
        elements: [{ t: "time", text: R.pick(TIMES)[0] }, { t: "manner", text: R.pick(MANNER)[0] }, { t: "place", text: R.pick([["in die Stadt"], ["nach Hause"], ["ins Büro"], ["zum Markt"]])[0] }] };
      why = "TeKaMoLo: <b>Te</b>mporal – <b>Ka</b>usal – <b>Mo</b>dal (how) – <b>Lo</b>kal (where to). Any one element can also take position 1.";
    } else if (kind < 0.7) {
      const v = R.pick(E.VERBS.filter((x) => ["aufstehen", "einkaufen", "fernsehen", "einschlafen"].includes(x.inf)));
      parts = { subject: s.de, verb: E.conj(v, s.p), end: v.sep,
        elements: [{ t: "time", text: R.pick(TIMES)[0] }, { t: "place", text: R.pick([["zu Hause"], ["im Büro"], ["in der Stadt"]])[0] }] };
      why = `Separable verb: the prefix <b>${v.sep}</b> closes the sentence. Everything between position 2 and the prefix can be rearranged.`;
    } else {
      const p = R.pick(E.PEOPLE.filter((x) => !x.wf));
      const o = R.pick(E.NOUNS.filter((n) => n.tags.includes("buy") && n.pl !== "-"));
      parts = { subject: s.de, verb: E.conj({ inf: "geben", ch: "gib" }, s.p), end: "",
        elements: [{ t: "time", text: R.pick(TIMES)[0] }, { t: "dat", text: E.np(p, "dat", "def") }, { t: "akk", text: E.np(o, "akk", "def") }] };
      why = "Two noun objects: <b>Dativ before Akkusativ</b>. The time expression is free, and any element may take position 1.";
    }
    const orders = buildOrders(parts);
    const answer = orders[0];
    const words = answer.replace(/\.$/, "").split(" ");
    return { kind: "order", topic: "satzbau", gen: "satzbau", lesson: 3, level: "B1",
      prompt: `Build a correct sentence. <b>${orders.length} different orders are correct</b> – find one, then try another.`,
      answer, accept: orders.slice(1), orders, tokens: R.shuffle(words), why, multi: true };
  });
})();
