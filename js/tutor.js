/* Deutsch Coach – "Max", the offline tutor.
   Works 100% offline with rules + the course data. Optional: the user can add their own API key
   in Settings to let Max answer open questions with an online model. */
(function () {
  "use strict";
  const E = window.Engine;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => s.toLowerCase().normalize("NFC").replace(/[„“"'.,!?;:()]/g, " ").replace(/\s+/g, " ").trim();

  // ---------- rules knowledge base: what / how / how NOT / why ----------
  const RULES = [
    { k: ["nominativ", "nominative", "subject", "cases", "fälle", "kasus", "case"], l: 5, g: "artikel", t: "The four cases",
      what: "German marks the role of a noun with its case: Nominativ (subject – wer?), Akkusativ (direct object – wen/was?), Dativ (receiver – wem?), Genitiv (owner – wessen?).",
      how: ["Ask the question: <i>Wer kauft? → der Mann</i> (Nom.) · <i>Wen sieht er? → den Mann</i> (Akk.) · <i>Wem hilft er? → dem Mann</i> (Dat.)", "Verbs and prepositions decide the case: sehen → Akk., helfen → Dat., mit → Dat., für → Akk."],
      not: [["Der Mann sieht der Hund.", "Der Mann sieht den Hund.", "sehen needs an Akkusativ object."], ["Ich helfe den Mann.", "Ich helfe dem Mann.", "helfen is a Dativ verb."]],
      why: "Because German word order is flexible (Den Hund sieht der Mann = The man sees the dog), the article, not the position, tells you who does what." },
    { k: ["akkusativ", "accusative", "direct object", "den", "einen"], l: 6, g: "akkusativ", t: "Akkusativ",
      what: "The direct object: the person/thing the action is done to (Wen? Was?).",
      how: ["Only masculine changes: der → <b>den</b>, ein → <b>einen</b>, kein → keinen, mein → meinen.", "Feminine, neuter and plural look the same as in the Nominativ.", "Always Akk.: haben, kaufen, sehen, brauchen, möchten, es gibt + durch, für, gegen, ohne, um."],
      not: [["Ich habe ein Hund.", "Ich habe einen Hund.", "Hund is masculine → einen."], ["Es gibt ein Supermarkt.", "Es gibt einen Supermarkt.", "es gibt always takes the Akkusativ."]],
      why: "The -n ending (den/einen) is the signal that a masculine noun is the object, not the subject." },
    { k: ["dativ", "dative", "indirect object", "dem", "einem", "wem"], l: 13, g: "dativ", t: "Dativ",
      what: "The receiver or the person something happens to (Wem?) – and the case after aus, bei, mit, nach, seit, von, zu.",
      how: ["der→<b>dem</b>, die→<b>der</b>, das→<b>dem</b>, Plural die→<b>den + -n</b> (den Kindern).", "Dativ verbs: helfen, danken, gefallen, gehören, schmecken, passen, antworten, gratulieren.", "Fixed phrases: Mir ist kalt. Wie geht es dir? Das gefällt mir."],
      not: [["Ich fahre mit den Bus.", "Ich fahre mit dem Bus.", "mit always takes the Dativ."], ["Das Buch gehört mich.", "Das Buch gehört mir.", "gehören + Dativ → mir."], ["mit den Kinder", "mit den Kindern", "Dativ plural adds -n."]],
      why: "The Dativ marks the second participant (the one who receives or benefits), so German can have two objects: Ich gebe dem Kind (Dat.) den Ball (Akk.)." },
    { k: ["genitiv", "genitive", "wegen", "trotz", "während", "wessen", "des"], l: 40, g: "genitiv", t: "Genitiv",
      what: "Possession (Wessen?) and the case after wegen, trotz, während, statt.",
      how: ["des + noun-(e)s (m/n), der (f/pl): das Auto <b>des Mannes</b>, die Tasche <b>der Frau</b>.", "Names: Annas Wohnung (no apostrophe).", "Adjectives after des/der → -en: wegen des schlechten Wetters."],
      not: [["das Auto von mein Vater", "das Auto meines Vaters / von meinem Vater", "von needs the Dativ; the Genitiv form is more formal."], ["wegen dem Regen", "wegen des Regens", "Spoken German often uses the Dativ, but exams expect the Genitiv."]],
      why: "It's the formal way to show relationships; in speech it's often replaced by von + Dativ." },
    { k: ["artikel", "article", "gender", "der die das", "genus"], l: 5, g: "artikel", t: "der, die, das",
      what: "Every noun has a grammatical gender: masculine (der), feminine (die), neuter (das). Plural is always die.",
      how: ["Feminine: -ung, -heit, -keit, -schaft, -ion, -tät, most -e.", "Neuter: -chen, -lein, -ment, -um, infinitives used as nouns (das Essen).", "Masculine: days, months, seasons, -er for people, -ismus, -ling."],
      not: [["die Mädchen (one girl)", "das Mädchen", "-chen is always neuter, even for people."], ["der Problem", "das Problem", "No rule – learn every noun with its article."]],
      why: "Gender decides every article and adjective ending, so it's worth learning noun + article + plural as one unit." },
    { k: ["word order", "wortstellung", "satzbau", "position 2", "verb position", "inversion", "satzstellung"], l: 3, g: "wortstellung", t: "Verb in position 2",
      what: "In a main clause the conjugated verb is always the second element.",
      how: ["Position 1 can be the subject, a time, a place or an object: <i>Heute <b>gehe</b> ich ins Kino.</i>", "If position 1 is not the subject, the subject comes right after the verb (inversion).", "Middle field order: Time – Reason – Manner – Place (TeKaMoLo)."],
      not: [["Heute ich gehe ins Kino.", "Heute gehe ich ins Kino.", "Only one element before the verb."], ["Morgen wir fahren nach Hamburg.", "Morgen fahren wir nach Hamburg.", "Verb must be in position 2."]],
      why: "German uses the verb as an anchor: first element = topic, second = verb. That's why you can start with whatever you want to emphasise." },
    { k: ["nebensatz", "subordinate", "weil", "dass", "verb at the end", "verb am ende", "ob"], l: 21, g: "nebensatz", t: "Subordinate clauses (weil, dass, wenn, ob)",
      what: "Clauses with weil, dass, wenn, ob, obwohl, als, damit, bevor, nachdem … send the conjugated verb to the end.",
      how: ["<i>Ich komme nicht, weil ich krank <b>bin</b>.</i>", "Modal/Perfekt: the finite verb is the very last word: <i>…, weil ich arbeiten <b>muss</b> / gearbeitet <b>habe</b>.</i>", "Subordinate clause first → main clause starts with the verb: <i>Wenn ich Zeit habe, <b>komme</b> ich.</i>"],
      not: [["…, weil ich bin müde.", "…, weil ich müde bin.", "weil → verb at the end."], ["…, dass er kommt morgen.", "…, dass er morgen kommt.", "dass → verb at the end."], ["Wenn ich Zeit habe, ich komme.", "Wenn ich Zeit habe, komme ich.", "The whole subordinate clause is position 1."]],
      why: "The verb at the end marks the clause as dependent, so the listener knows the main idea is elsewhere." },
    { k: ["denn", "weil vs denn", "aber", "sondern", "und", "oder", "konjunktion", "connector"], l: 20, g: "konjunktionen", t: "und, aber, oder, denn, sondern",
      what: "Connectors in position 0 – they join main clauses without changing word order.",
      how: ["<i>Ich bleibe zu Hause, <b>denn</b> ich bin krank.</i>", "sondern only after a negation: <i>nicht A, sondern B</i>."],
      not: [["…, denn ich müde bin.", "…, denn ich bin müde.", "denn keeps the verb in position 2 (unlike weil)."], ["Ich trinke keinen Kaffee, aber Tee.", "…, sondern Tee.", "Correcting a negation → sondern."]],
      why: "denn and weil mean the same, but denn is a coordinating conjunction (main clause), weil subordinating (verb at the end)." },
    { k: ["perfekt", "perfect", "past tense", "vergangenheit", "partizip", "participle", "haben oder sein", "haben or sein"], l: 17, g: "perfekt", t: "Perfekt",
      what: "The spoken past: haben/sein (position 2) + Partizip II (end).",
      how: ["Regular: ge-…-t (gemacht). Irregular: ge-…-en (gegessen).", "Separable: auf<b>ge</b>standen. No ge- for -ieren (studiert) and be-/ver-/er- verbs (besucht).", "<b>sein</b> for movement A→B (gehen, fahren, fliegen) and change of state (aufstehen, einschlafen) + sein, bleiben, passieren. Everything else: haben."],
      not: [["Ich habe nach Berlin gefahren.", "Ich bin nach Berlin gefahren.", "fahren = movement → sein."], ["Ich bin gegessen.", "Ich habe gegessen.", "No movement → haben."], ["Ich habe gegeht.", "Ich bin gegangen.", "gehen is irregular."], ["Ich habe gestudiert.", "Ich habe studiert.", "-ieren verbs have no ge-."]],
      why: "Sein-verbs describe the subject changing place or state; haben-verbs describe an action." },
    { k: ["präteritum", "preterite", "simple past", "war", "hatte", "plusquamperfekt"], l: 35, g: "praeteritum", t: "Präteritum",
      what: "Written past tense (stories). In speech only common for sein, haben, modals: war, hatte, konnte, musste.",
      how: ["Regular: stem + -te (machte). Irregular: own stem (ging, kam, fuhr).", "ich and er/sie/es have no ending: ich war, er war.", "Plusquamperfekt (past before past): hatte/war + Partizip II."],
      not: [["Ich bin krank gewesen. (in speech)", "Ich war krank.", "Natural spoken German uses war."], ["Ich konntest nicht.", "Ich konnte nicht.", "ich has no ending."]],
      why: "Präteritum sounds narrative/written; Perfekt sounds conversational – except for these very frequent verbs." },
    { k: ["trennbar", "separable", "prefix", "aufstehen", "anrufen"], l: 10, g: "trennbar", t: "Separable verbs",
      what: "Verbs with a stressed prefix (an-, auf-, aus-, ein-, mit-, zu-, fern- …) split in main clauses.",
      how: ["<i>Ich <b>stehe</b> um 7 Uhr <b>auf</b>.</i>", "Stay together at the end: with modals (<i>muss aufstehen</i>), in subordinate clauses (<i>weil ich aufstehe</i>).", "Perfekt: auf<b>ge</b>standen; zu-infinitive: auf<b>zu</b>stehen."],
      not: [["Ich aufstehe um 7.", "Ich stehe um 7 auf.", "Prefix to the end."], ["Ich rufe an dich.", "Ich rufe dich an.", "The prefix is the last element."]],
      why: "The prefix works like the second part of a verb bracket (Satzklammer) around the middle of the sentence." },
    { k: ["modal", "können", "müssen", "dürfen", "sollen", "wollen", "möchten"], l: 11, g: "modal", t: "Modal verbs",
      what: "können (can), müssen (must), dürfen (may), sollen (should), wollen (want), möchten (would like).",
      how: ["Modal in position 2, infinitive at the end: <i>Ich <b>muss</b> heute <b>arbeiten</b>.</i>", "ich/er: no ending (ich kann, er kann).", "nicht müssen = don't have to; nicht dürfen = must not."],
      not: [["Ich kann spreche Deutsch.", "Ich kann Deutsch sprechen.", "Second verb = infinitive at the end."], ["Ich muss zu arbeiten.", "Ich muss arbeiten.", "No zu after modal verbs."], ["Er kannt …", "Er kann …", "er has no ending."]],
      why: "The modal carries person and tense; the main verb only carries the meaning, so it stays in the infinitive." },
    { k: ["imperativ", "imperative", "command", "befehl"], l: 12, g: "imperativ", t: "Imperative",
      what: "Commands, requests, tips – for du, ihr and Sie.",
      how: ["du: du-form minus -st: du nimmst → <b>Nimm!</b> (e→i stays, a→ä disappears: <b>Fahr!</b>)", "ihr: <b>Nehmt!</b>  Sie: <b>Nehmen Sie!</b>", "sein: Sei! Seid! Seien Sie!"],
      not: [["Nehme das!", "Nimm das!", "The e→i change stays in the du-imperative."], ["Fährt vorsichtig! (to one friend)", "Fahr vorsichtig!", "a→ä changes are dropped; -t is the ihr-form."]],
      why: "The imperative puts the verb first to signal an instruction; bitte, doch, mal make it friendlier." },
    { k: ["negation", "nicht", "kein", "negative"], l: 7, g: "negation", t: "nicht or kein",
      what: "kein negates nouns with ein/no article; nicht negates everything else.",
      how: ["<i>Ich habe <b>keine</b> Zeit.</i> (kein = ein-endings)", "nicht before adjectives, places, prepositions: <i>nicht gut, nicht in Berlin</i>; otherwise at the end.", "Correction: <i>kein/nicht … sondern …</i>"],
      not: [["Ich habe nicht ein Auto.", "Ich habe kein Auto.", "nicht + ein → kein."], ["Ich nicht komme.", "Ich komme nicht.", "nicht comes after the verb."]],
      why: "kein works like an article (it changes with case), nicht is an adverb." },
    { k: ["possessiv", "possessive", "mein", "dein", "sein", "ihr"], l: 8, g: "possessiv", t: "Possessive articles",
      what: "mein, dein, sein, ihr, unser, euer, ihr/Ihr – with the endings of ein/kein.",
      how: ["sein = his/its, ihr = her/their.", "meinen Bruder (Akk. m), meinem Bruder (Dat.), meine Eltern (Pl.)", "euer → eure/euren (e drops)."],
      not: [["Anna und sein Sohn", "Anna und ihr Sohn", "Anna is female → ihr."], ["Ich besuche mein Bruder.", "Ich besuche meinen Bruder.", "Akk. masculine → meinen."]],
      why: "The stem shows the owner; the ending shows gender and case of the thing owned." },
    { k: ["präposition", "preposition", "mit", "für", "zu", "bei", "aus", "von"], l: 15, g: "praepositionen", t: "Prepositions and cases",
      what: "Every preposition controls a case.",
      how: ["Akk.: durch, für, gegen, ohne, um, bis.", "Dat.: aus, bei, mit, nach, seit, von, zu, gegenüber.", "zum = zu dem, zur = zu der, beim = bei dem, vom = von dem."],
      not: [["für dem Chef", "für den Chef", "für + Akk."], ["zu Hause gehen", "nach Hause gehen", "Direction home = nach Hause; location = zu Hause."], ["nach dem Arzt gehen", "zum Arzt gehen", "Persons/places you go to → zu."]],
      why: "Prepositions are learned with their case – there is no logic to guess it." },
    { k: ["wechselpräposition", "two-way", "wo wohin", "liegen legen", "stellen stehen", "hängen", "in dem in den"], l: 16, g: "wechsel", t: "Two-way prepositions",
      what: "an, auf, hinter, in, neben, über, unter, vor, zwischen: Wo? → Dativ, Wohin? → Akkusativ.",
      how: ["Movement to a goal: <i>Ich lege das Buch <b>auf den</b> Tisch.</i>", "Position: <i>Das Buch liegt <b>auf dem</b> Tisch.</i>", "Pairs: legen/liegen, stellen/stehen, setzen/sitzen, hängen/hängen."],
      not: [["Ich gehe im Kino.", "Ich gehe ins Kino.", "Direction → Akk. (ins)."], ["Ich bin in das Büro.", "Ich bin im Büro.", "Location → Dat. (im)."]],
      why: "The case shows whether something is moving to a place or is already there." },
    { k: ["reflexiv", "reflexive", "sich", "mich", "mir"], l: 19, g: "reflexiv", t: "Reflexive verbs",
      what: "The pronoun refers back to the subject: sich waschen, sich freuen, sich interessieren.",
      how: ["Akk.: mich, dich, sich, uns, euch, sich.", "Dat. (when there is another object): <i>Ich wasche <b>mir</b> die Hände.</i>", "Perfekt always with haben: Ich habe mich gefreut."],
      not: [["Ich freue auf den Urlaub.", "Ich freue mich auf den Urlaub.", "sich freuen needs the pronoun."], ["Ich wasche mich die Hände.", "Ich wasche mir die Hände.", "Second object → Dativ pronoun."]],
      why: "The reflexive pronoun fills the object slot when the subject does something to itself." },
    { k: ["komparativ", "comparative", "superlativ", "superlative", "als", "wie", "besser"], l: 22, g: "komparativ", t: "Comparison",
      what: "-er + als (comparative), am -sten (superlative), so … wie (equal).",
      how: ["alt – älter – am ältesten; gut – besser – am besten; viel – mehr – am meisten; gern – lieber – am liebsten.", "Before a noun: der schnellste Zug."],
      not: [["größer wie", "größer als", "Comparative → als; equality → so … wie."], ["mehr schön", "schöner", "German adds -er, even for long adjectives."]],
      why: "German forms comparisons with endings, never with 'more/most'." },
    { k: ["adjektiv", "adjective", "endung", "ending", "adjektivendungen"], l: 23, g: "adjektiv", t: "Adjective endings",
      what: "Adjectives before a noun take endings; after sein they don't.",
      how: ["After der/die/das: -e (nom. sg., akk. f/n) or -en (all others).", "After ein/kein/mein: -er (m. nom.), -es (n. nom./akk.), otherwise like above.", "No article: the adjective takes the article ending: heißer Tee, kalte Milch, frisches Brot."],
      not: [["ein neue Auto", "ein neues Auto", "ein shows no gender → adjective shows it (-es)."], ["Die Jacke ist blaue.", "Die Jacke ist blau.", "No ending after sein."]],
      why: "Someone in the noun phrase must show the gender/case clearly: if the article does, the adjective relaxes (-e/-en); if not, the adjective does the job." },
    { k: ["konjunktiv", "subjunctive", "würde", "hätte", "wäre", "könnte", "polite", "höflich", "wish"], l: 25, g: "konjunktiv2", t: "Konjunktiv II",
      what: "Wishes, unreal situations and politeness.",
      how: ["würde + infinitive: <i>Ich würde gern reisen.</i>", "Own forms: wäre, hätte, könnte, müsste, dürfte, sollte.", "<i>Wenn ich Zeit <b>hätte</b>, <b>würde</b> ich kommen.</i> (I don't have time.)"],
      not: [["Wenn ich Zeit habe, würde ich kommen.", "Wenn ich Zeit hätte, würde ich kommen.", "Both parts are unreal → Konjunktiv II in both."], ["Ich würde haben …", "Ich hätte …", "Use hätte/wäre instead of würde haben/sein."]],
      why: "The umlaut/würde signals 'not real', which is also why it sounds polite (less direct)." },
    { k: ["ratschlag", "advice", "sollte", "empfehlen", "recommend", "tipp"], l: 26, g: "konjunktiv2", t: "Giving advice",
      what: "Du solltest … · An deiner Stelle würde ich … · Ich empfehle dir, … zu … · Es wäre gut, wenn …",
      how: ["sollte (advice) vs soll (someone else's instruction): <i>Der Arzt sagt, ich soll …</i>"],
      not: [["Du sollst mehr schlafen. (as your own advice)", "Du solltest mehr schlafen.", "sollst sounds like an order."]],
      why: "Konjunktiv II softens advice so it sounds friendly." },
    { k: ["vorschlag", "suggestion", "planen", "planning", "teil 1", "gemeinsam"], l: 27, g: null, t: "Planning together (exam)",
      what: "Suggest – react – agree/disagree – decide.",
      how: ["Wie wäre es, wenn wir …? · Was hältst du davon, wenn …? · Wir könnten … · Lass uns …", "Gute Idee! / Das finde ich nicht so gut, weil … / Lieber …", "Also, wir machen es so: Du … und ich …"],
      not: [["Only saying 'Ja' and 'Okay'.", "Ja, gute Idee, denn … Und was hältst du von …?", "Examiners need reasons and your own suggestions."]],
      why: "The task is graded on interaction: reacting to your partner and reaching a result." },
    { k: ["zu infinitiv", "infinitive with zu", "zu +", "lust zu"], l: 28, g: "zu_infinitiv", t: "zu + infinitive",
      what: "After many verbs/nouns/adjectives: <i>Ich habe keine Lust, <b>zu kochen</b>.</i>",
      how: ["Triggers: anfangen, aufhören, versuchen, vergessen, vorhaben, Lust/Zeit/Angst haben, es ist wichtig/schwer…", "Separable: an<b>zu</b>rufen.", "Same subject → zu-infinitive can replace a dass-clause."],
      not: [["Ich möchte zu schwimmen.", "Ich möchte schwimmen.", "No zu after modal verbs."], ["zu anrufen", "anzurufen", "zu goes inside separable verbs."]],
      why: "zu marks the infinitive as dependent on the word before it." },
    { k: ["um zu", "damit", "purpose", "zweck", "final"], l: 29, g: "umzu_damit", t: "um … zu / damit",
      what: "Purpose (Wozu?).",
      how: ["Same subject: <i>Ich lerne, <b>um</b> die Prüfung <b>zu bestehen</b>.</i>", "Different subjects: <i>Ich spreche langsam, <b>damit du</b> mich verstehst.</i>"],
      not: [["Ich spreche langsam, um du mich verstehst.", "…, damit du mich verstehst.", "Different subject → damit."], ["…, um ich Deutsch lerne.", "…, um Deutsch zu lernen.", "um … zu has no subject."]],
      why: "um … zu has no subject of its own, so it only works when the subject is the same." },
    { k: ["da-wort", "wo-wort", "worauf", "darauf", "verb preposition", "verben mit präpositionen", "warten auf"], l: 31, g: "verb_praep", t: "Verbs with prepositions",
      what: "Fixed pairs: warten auf, denken an, sich freuen auf/über, Angst haben vor, träumen von …",
      how: ["Thing: <b>wo(r)+prep</b> / <b>da(r)+prep</b>: Worauf wartest du? Ich warte darauf.", "Person: prep + pronoun: Auf wen? Auf ihn."],
      not: [["Auf was wartest du?", "Worauf wartest du?", "Standard German uses wo-words for things."], ["Ich freue mich darauf auf ihn.", "Ich freue mich auf ihn.", "da-words only for things."]],
      why: "da-/wo-words replace 'preposition + it/what' for things; people keep a real pronoun." },
    { k: ["indirekte frage", "indirect question", "können sie mir sagen", "wissen sie ob"], l: 32, g: null, t: "Indirect questions",
      what: "Polite questions as subordinate clauses – verb at the end.",
      how: ["W-question keeps the W-word: <i>Wissen Sie, wann der Bus <b>kommt</b>?</i>", "Yes/no → ob: <i>Wissen Sie, ob das Büro offen <b>ist</b>?</i>"],
      not: [["Wissen Sie, wo ist der Bahnhof?", "Wissen Sie, wo der Bahnhof ist?", "Indirect question → verb at the end."], ["Ich weiß nicht, wenn er kommt.", "Ich weiß nicht, ob/wann er kommt.", "wenn is not a question word."]],
      why: "The question becomes part of a bigger sentence, so it follows subordinate clause word order." },
    { k: ["relativsatz", "relative", "der die das which", "which", "who"], l: 33, g: "relativ", t: "Relative clauses",
      what: "Describe a noun: <i>der Mann, <b>der</b> dort wohnt</i>.",
      how: ["Gender/number from the noun, case from the relative clause.", "Dat. pl. <b>denen</b>; Gen. <b>dessen/deren</b>.", "Preposition first: die Freundin, <b>mit der</b> ich wohne."],
      not: [["der Mann, den hilft mir", "der Mann, der mir hilft", "He is the subject → Nominativ, verb at the end."], ["die Leute, mit die ich arbeite", "die Leute, mit denen ich arbeite", "Dativ plural = denen."]],
      why: "The pronoun has to fit both worlds: the noun it refers to (gender) and its job in the new clause (case)." },
    { k: ["als wenn", "als oder wenn", "wann", "temporal", "bevor", "nachdem", "während", "seit"], l: 34, g: "als_wenn", t: "als / wenn / wann",
      what: "Time clauses.",
      how: ["als = one event in the past.", "wenn = present/future or repeated (immer wenn).", "wann = question word (also indirect)."],
      not: [["Wenn ich Kind war, …", "Als ich Kind war, …", "One period in the past → als."], ["Wann ich Zeit habe, …", "Wenn ich Zeit habe, …", "wann only asks a question."]],
      why: "German distinguishes once-in-the-past (als) from whenever/if (wenn)." },
    { k: ["obwohl", "trotzdem", "although", "contrast"], l: 36, g: "obwohl_deshalb", t: "obwohl / trotzdem",
      what: "Unexpected contrast.",
      how: ["obwohl → verb at the end: <i>…, obwohl es regnet.</i>", "trotzdem → adverb (inversion): <i>Es regnet. Trotzdem gehe ich.</i>"],
      not: [["Trotzdem ich gehe.", "Trotzdem gehe ich.", "Adverb in position 1 → verb next."], ["obwohl es regnet nicht", "obwohl es nicht regnet", "Verb at the end."]],
      why: "obwohl subordinates, trotzdem is just an adverb." },
    { k: ["deshalb", "deswegen", "darum", "therefore", "sonst", "consequence"], l: 37, g: "obwohl_deshalb", t: "deshalb / sonst",
      what: "Consequences.",
      how: ["deshalb/deswegen/darum in position 1 → verb next: <i>Es regnet, deshalb <b>nehme</b> ich den Bus.</i>", "sonst = otherwise."],
      not: [["…, deshalb ich nehme den Bus.", "…, deshalb nehme ich den Bus.", "Inversion after deshalb."]],
      why: "weil gives the reason, deshalb the result – switch between them for variety." },
    { k: ["passiv", "passive", "wird gemacht", "werden partizip"], l: 39, g: "passiv", t: "Passive",
      what: "The action matters, not the doer.",
      how: ["Präsens: wird + Partizip II. Präteritum: wurde + P II. Perfekt: ist + P II + worden. Modal: muss + P II + werden.", "Doer (optional): von + Dativ."],
      not: [["Das Haus ist gebaut worden von 1900.", "Das Haus wurde 1900 gebaut.", "Keep the participle at the end; use wurde for simple past."], ["Den Wagen wird repariert.", "Der Wagen wird repariert.", "The object becomes the subject → Nominativ."]],
      why: "Common in instructions, news and formal writing." },
    { k: ["werden", "futur", "future", "will"], l: 41, g: "futur", t: "werden: 4 jobs",
      what: "werden = become · Futur (werden + inf.) · Passive (werden + P II) · Konjunktiv (würde).",
      how: ["Future often just present + time: <i>Morgen fahre ich …</i>", "Assumption: <i>Er wird wohl krank sein.</i>"],
      not: [["Ich will morgen kommen. (meaning future)", "Ich werde morgen kommen.", "will = want, not future!"]],
      why: "English 'will' ≠ German 'will' (= want)." },
    { k: ["uhrzeit", "time", "halb", "viertel", "clock"], l: 9, g: "uhrzeit", t: "Telling the time",
      what: "Official 14:30 = vierzehn Uhr dreißig; informal halb drei.",
      how: ["halb + NEXT hour: 2:30 = halb drei.", "um + time, am + day, im + month."],
      not: [["halb zwei (for 2:30)", "halb drei", "halb looks forward to the next hour."], ["in Montag", "am Montag", "Days take am."]],
      why: "German counts half-way to the next hour." },
    { k: ["sein haben", "to be", "age", "alter", "jahre alt"], l: 1, g: "sein_haben", t: "sein & haben",
      what: "The two most important verbs.",
      how: ["Age with sein: <i>Ich bin 28 Jahre alt.</i>", "Hunger/Durst/Zeit with haben."],
      not: [["Ich habe 28 Jahre.", "Ich bin 28 Jahre alt.", "Age uses sein."], ["Ich bin Hunger.", "Ich habe Hunger.", "Hunger is a noun → haben."]],
      why: "German describes age as a state (sein) and hunger as something you have." },
    { k: ["präsens", "present", "conjugation", "endings", "konjugation"], l: 2, g: "praesens", t: "Present tense",
      what: "Stem + -e, -st, -t, -en, -t, -en.",
      how: ["-t/-d stems add e: du arbeitest.", "Stem change only for du and er/sie/es: fahren → fährt, lesen → liest, sprechen → spricht."],
      not: [["du arbeitst", "du arbeitest", "Extra e after -t."], ["ich fähre", "ich fahre", "Vowel change only with du/er."]],
      why: "Endings identify the subject even when it's far away from the verb." },
    { k: ["frage", "question", "w-frage", "ja nein", "doch"], l: 4, g: "fragen", t: "Questions",
      what: "W-word + verb + subject; yes/no: verb first.",
      how: ["<i>Wo wohnst du? – Wohnst du hier?</i>", "Answer yes to a negative question with <b>doch</b>."],
      not: [["Wo du wohnst?", "Wo wohnst du?", "Verb in position 2."], ["Hast du keine Zeit? – Ja!", "Doch!", "Positive answer to a negative question → doch."]],
      why: "The verb position itself marks a question." },
    { k: ["je desto", "präsentation", "presentation", "teil 2"], l: 42, g: null, t: "Presentation (exam) & je … desto",
      what: "5 slides: topic – experience – home country – pros/cons + opinion – conclusion.",
      how: ["<i>Je mehr ich übe, desto besser spreche ich.</i> (je → verb end; desto + comparative → inversion)", "Use zwar … aber, obwohl, deshalb, Konjunktiv II for opinions."],
      not: [["Je mehr ich übe, desto ich spreche besser.", "…, desto besser spreche ich.", "desto + comparative, then the verb."]],
      why: "Examiners reward structure, connectors and a clear opinion." },
  ];

  const HELP = `I'm <b>Max</b>, your offline German tutor. Try:
<ul class="tips">
<li><button class="chip" data-say="Explain the Dativ">Explain the Dativ</button></li>
<li><button class="chip" data-say="Check: Gestern ich habe nach Berlin gefahren.">Check: Gestern ich habe nach Berlin gefahren.</button></li>
<li><button class="chip" data-say="Conjugate fahren">Conjugate fahren</button></li>
<li><button class="chip" data-say="Article of Mädchen">Article of Mädchen</button></li>
<li><button class="chip" data-say="What does Termin mean?">What does Termin mean?</button></li>
<li><button class="chip" data-say="Quiz me on Perfekt">Quiz me on Perfekt</button></li>
<li><button class="chip" data-say="weil or denn?">weil or denn?</button></li>
<li><button class="chip" data-say="What should I learn next?">What should I learn next?</button></li>
</ul>Just type a German sentence and I'll check it.`;

  // ---------- finite verb index ----------
  let FIN = null;
  function finIndex() {
    if (FIN) return FIN;
    FIN = new Map();
    const P = ["1s", "2s", "3s", "1p", "2p", "3p"];
    const add = (form, inf, p) => { form = form.toLowerCase(); if (!FIN.has(form)) FIN.set(form, []); FIN.get(form).push({ inf, p }); };
    Object.entries(E.IRR).forEach(([inf, t]) => P.forEach((p) => add(t[p], inf, p)));
    E.VERBS.forEach((v) => P.forEach((p) => add(E.conj(v, p), v.inf, p)));
    const map = { ich: "1s", du: "2s", er: "3s", wir: "1p", ihr: "2p", sie: "3p" };
    Object.entries(DC.conj || {}).forEach(([inf, v]) => Object.entries(v.f || {}).forEach(([k, f]) => { if (map[k] && f) add(String(f).split(" ")[0], inf, map[k]); }));
    ["war", "hatte", "konnte", "musste", "wollte", "durfte", "sollte", "wurde", "ging", "kam", "fuhr"].forEach((f) => add(f, "(past)", "1s"));
    return FIN;
  }
  const isFinite = (w) => finIndex().has(w.toLowerCase());
  const PRON_P = { ich: "1s", du: "2s", er: "3s", es: "3s", wir: "1p", ihr: "2p" };
  const SEIN_PP = new Set("gegangen gefahren gekommen geflogen gelaufen aufgestanden eingeschlafen geblieben gewesen passiert geworden umgezogen gereist geschwommen gestorben angekommen abgefahren eingestiegen ausgestiegen umgestiegen zurückgekommen mitgekommen losgefahren gewandert gefallen aufgewacht gerannt gesprungen".split(" "));
  const HABEN_PP = new Set("gegessen gekauft gemacht gearbeitet gelernt gesehen getrunken gelesen geschrieben gespielt gekocht gewohnt gehört gesagt gefragt genommen gefunden gebracht geholfen besucht verstanden studiert telefoniert gewartet geschlafen getroffen angerufen eingekauft ferngesehen bekommen vergessen gewaschen bestellt repariert".split(" "));
  const BAD_PP = { gegeht: "gegangen", gekommt: "gekommen", getrinkt: "getrunken", geesst: "gegessen", gesehet: "gesehen", gefahrt: "gefahren", geschreibt: "geschrieben", gebringt: "gebracht", gedenkt: "gedacht", gewisst: "gewusst", geweißt: "gewusst", gestudiert: "studiert", gebesucht: "besucht", geverstanden: "verstanden", geeinkauft: "eingekauft", gelest: "gelesen", genehmt: "genommen", gefindet: "gefunden", geschlaft: "geschlafen", gehelft: "geholfen", getrefft: "getroffen", geanruft: "angerufen", geaufstanden: "aufgestanden", gebleibt: "geblieben", geseint: "gewesen", geflegt: "geflogen", gefliegt: "geflogen", geruft: "gerufen", gesprecht: "gesprochen", gesprichtet: "gesprochen", getelefoniert: "telefoniert", gereparierrt: "repariert" };
  const HABEN_F = new Set(["habe", "hast", "hat", "haben", "habt"]);
  const SEIN_F = new Set(["bin", "bist", "ist", "sind", "seid"]);
  const MODAL_F = new Set(["kann", "kannst", "können", "könnt", "muss", "musst", "müssen", "müsst", "will", "willst", "wollen", "wollt", "darf", "darfst", "dürfen", "dürft", "soll", "sollst", "sollen", "sollt", "möchte", "möchtest", "möchten", "möchtet"]);
  const SUB = new Set(["weil", "dass", "obwohl", "wenn", "ob", "damit", "bevor", "nachdem", "während", "bis", "seit", "seitdem", "sodass"]);
  const TIME1 = ["heute", "morgen", "gestern", "dann", "danach", "deshalb", "deswegen", "darum", "trotzdem", "leider", "jetzt", "zuerst", "später", "manchmal", "oft", "hier", "dort", "abends", "morgens", "vielleicht", "außerdem", "also"];
  const TIME2 = ["am montag", "am dienstag", "am mittwoch", "am donnerstag", "am freitag", "am samstag", "am sonntag", "am abend", "am morgen", "am wochenende", "jeden tag", "letzte woche", "nächste woche", "im sommer", "im winter", "zu hause", "in berlin", "im büro"];
  const DAT_P = new Set(["mit", "bei", "von", "aus", "nach", "seit", "zu", "gegenüber"]);
  const AKK_P = new Set(["für", "ohne", "durch", "gegen", "um"]);
  const PRONOUNS = new Set(["ich", "du", "er", "sie", "es", "wir", "ihr", "man"]);

  function nounGender(word) {
    const n = E.lookupNoun(word);
    if (n) return { g: n.g, de: n.de, pl: n.pl.toLowerCase() === word.toLowerCase() };
    const v = (DC.vocab || []).find((x) => x.art && x.de.split(" ").slice(1).join(" ").toLowerCase() === word.toLowerCase());
    if (v) return { g: { der: "m", die: "f", das: "n" }[v.art], de: v.de.split(" ").slice(1).join(" ") };
    return null;
  }
  const KNOWN_NOUNS = () => {
    const s = new Set();
    E.NOUNS.concat(E.PEOPLE).forEach((n) => s.add(n.de.toLowerCase()));
    (DC.vocab || []).forEach((v) => { if (v.art) s.add(v.de.split(" ").slice(1).join(" ").toLowerCase()); });
    return s;
  };
  let NOUNSET = null;

  function check(sentence) {
    const raw = sentence.trim();
    const endP = /[.!?]$/.test(raw) ? raw.slice(-1) : ".";
    let words = raw.replace(/[.!?]+$/, "").split(/\s+/);
    const issues = [];
    const low = () => words.map((w) => w.toLowerCase().replace(/[,;:]$/, ""));
    NOUNSET = NOUNSET || KNOWN_NOUNS();
    const add = (rule, why, lesson) => issues.push({ rule, why, lesson });

    // participle spelling
    words = words.map((w) => {
      const k = w.toLowerCase().replace(/[,;:]$/, "");
      if (BAD_PP[k]) { add(`<s>${k}</s> → <b>${BAD_PP[k]}</b>`, "Wrong Partizip II. " + (/iert$/.test(BAD_PP[k]) ? "-ieren verbs have no ge-." : BAD_PP[k].startsWith("ge") ? "This verb is irregular or separable – learn its participle." : "Verbs with be-/ver-/er- have no ge-."), 17); return w.replace(new RegExp(k, "i"), BAD_PP[k]); }
      return w;
    });
    // age
    let L = low();
    const hi = L.findIndex((w) => HABEN_F.has(w));
    if (hi >= 0 && /^\d+$/.test(L[hi + 1] || "") && /^jahre?n?$/.test(L[hi + 2] || "")) {
      const sein = { habe: "bin", hast: "bist", hat: "ist", haben: "sind", habt: "seid" }[L[hi]];
      add(`<s>${L[hi]} ${L[hi + 1]} Jahre</s> → <b>${sein} ${L[hi + 1]} Jahre alt</b>`, "Age is expressed with <b>sein</b> + Jahre alt.", 1);
      words.splice(hi, 3, sein, L[hi + 1], "Jahre", "alt"); if ((words[hi + 4] || "").toLowerCase() === "alt") words.splice(hi + 4, 1);
    }
    // haben/sein in Perfekt
    L = low();
    const ppIdx = L.findIndex((w) => SEIN_PP.has(w) || HABEN_PP.has(w));
    if (ppIdx > 0) {
      let clauseStart = 0; for (let k = 0; k < ppIdx; k++) if (/,$/.test(words[k]) || /^(und|aber|oder|denn|sondern)$/.test(L[k])) clauseStart = k + 1;
      const auxIdx = L.findIndex((w, i) => i >= clauseStart && i < ppIdx && (HABEN_F.has(w) || SEIN_F.has(w)));
      if (auxIdx >= 0) {
        const aux = L[auxIdx], pp = L[ppIdx];
        const hasObjAuto = /auto|wagen/.test(L.join(" ")) && pp === "gefahren";
        if (HABEN_F.has(aux) && SEIN_PP.has(pp) && !hasObjAuto) {
          const r = { habe: "bin", hast: "bist", hat: "ist", haben: "sind", habt: "seid" }[aux];
          add(`<s>${aux} … ${pp}</s> → <b>${r} … ${pp}</b>`, `<b>${pp}</b> describes movement or a change of state → Perfekt with <b>sein</b>. (Exception: <i>Ich habe das Auto gefahren</i> – with an object.)`, 17);
          words[auxIdx] = words[auxIdx][0] === words[auxIdx][0].toUpperCase() ? R_cap(r) : r;
        } else if (SEIN_F.has(aux) && HABEN_PP.has(pp)) {
          const r = { bin: "habe", bist: "hast", ist: "hat", sind: "haben", seid: "habt" }[aux];
          add(`<s>${aux} … ${pp}</s> → <b>${r} … ${pp}</b>`, `<b>${pp}</b> has no movement from A to B → Perfekt with <b>haben</b>.${pp === "gegessen" ? " (Careful: „ich bin gegessen“ means someone ate you!)" : ""}`, 17);
          words[auxIdx] = words[auxIdx][0] === words[auxIdx][0].toUpperCase() ? R_cap(r) : r;
        }
        // participle must be last in main clause
        L = low();
        const commaAt = words.findIndex((w, i) => i > ppIdx && /,$/.test(words[i - 1] || "") );
        if (ppIdx < words.length - 1 && !words.slice(0, ppIdx).some((w) => /,$/.test(w)) && !SUB.has(L[0]) && commaAt < 0 && !/,$/.test(words[ppIdx])) {
          const tail = words.slice(ppIdx + 1);
          if (tail.length && !SUB.has(tail[0].toLowerCase()) && !/^(und|aber|oder|denn|sondern|als|wie)$/i.test(tail[0])) {
            add(`<s>${words[ppIdx]} ${tail.join(" ")}</s> → <b>${tail.join(" ")} ${words[ppIdx]}</b>`, "The Partizip II closes the sentence (verb bracket): everything else goes between the auxiliary and the participle.", 17);
            const pp2 = words.splice(ppIdx, 1)[0]; words.push(pp2);
          }
        }
      }
    }
    // inversion after time words
    L = low();
    let first = 0;
    if (TIME2.includes(L.slice(0, 2).join(" "))) first = 2; else if (TIME1.includes(L[0])) first = 1;
    else if (L[0] === "um" && /^\d/.test(L[1] || "") && L[2] === "uhr") first = 3;
    if (first && PRONOUNS.has(L[first]) && isFinite(L[first + 1] || "") && !SUB.has(L[0])) {
      add(`<s>${words.slice(0, first + 2).join(" ")}</s> → <b>${words.slice(0, first).join(" ")} ${L[first + 1]} ${L[first]}</b>`, `„${words.slice(0, first).join(" ")}“ already takes position 1, so the verb must come next (position 2) and the subject follows (inversion).`, 3);
      const tmp = words[first]; words[first] = words[first + 1].toLowerCase(); words[first + 1] = tmp.toLowerCase();
    }
    // subordinate clause verb position
    L = low();
    for (let i = 0; i < L.length; i++) {
      if (!SUB.has(L[i])) continue;
      if (L[i] === "seit" && !(i === 0 || /,$/.test(words[i - 1] || ""))) continue;
      if ((L[i] === "während" || L[i] === "seit") && /^(der|des|dem|den|einer|eines|einem|zwei|drei|vier|fünf|sechs|wenigen|langem)$/.test(L[i + 1] || "")) continue;
      if (L[i] === "während" && !(i === 0 || /,$/.test(words[i - 1] || ""))) continue;
      if (L[i] === "bis" && !/,$/.test(words[i - 1] || "")) continue;
      let end = L.length; for (let j = i + 1; j < L.length; j++) if (/,$/.test(words[j])) { end = j + 1; break; }
      const clause = words.slice(i, end);
      if (clause.length < 4) continue;
      const cl = clause.map((w) => w.toLowerCase().replace(/,$/, ""));
      let subjLen = PRONOUNS.has(cl[1]) ? 1 : /^(der|die|das|mein|meine|dein|sein|ihr|unser|ein|eine|anna|max|ravi|leila|jonas)$/.test(cl[1]) ? (/^(anna|max|ravi|leila|jonas)$/.test(cl[1]) ? 1 : 2) : 1;
      const vi = 1 + subjLen;
      const lastIsVerb = isFinite(cl[cl.length - 1]) || /(t|en|e)$/.test(cl[cl.length - 1]) && isFinite(cl[cl.length - 1]);
      const lastFinite = isFinite(cl[cl.length - 1] || "") || /^(wird|werden|wurde|wurden|worden|ist|sind|war|waren|hat|haben|hatte|hatten|sei|seien|habe|wäre|hätte)$/.test(cl[cl.length - 1] || "");
      if (isFinite(cl[vi] || "") && vi < cl.length - 1 && !lastFinite && !(lastIsVerb && MODAL_F.has(cl[cl.length - 1]))) {
        const v = clause[vi].replace(/,$/, "");
        const rest = clause.filter((_, k) => k !== vi).map((w) => w.replace(/,$/, ""));
        const fixed = rest.concat(v);
        const fixedStr = fixed.join(" ");
        const why = L[i] === "denn" ? "" : `<b>${L[i]}</b> starts a subordinate clause → the conjugated verb (<b>${v}</b>) goes to the <b>end</b>.`;
        add(`<s>${clause.join(" ").replace(/,$/, "")}</s> → <b>${fixedStr}</b>`, why, 21);
        const hadComma = /,$/.test(clause[clause.length - 1]);
        words.splice(i, clause.length, ...fixed.map((w, k) => (k === fixed.length - 1 && hadComma ? w + "," : w)));
        L = low();
        // subordinate clause first → main verb should follow
        if (i === 0 && end < L.length && !isFinite(L[end] || "")) {
          const vj = L.findIndex((w, k) => k > end && isFinite(w));
          if (vj > end) { const vv = words.splice(vj, 1)[0]; words.splice(end, 0, vv); add(`Main clause after the ${L[0]}-clause`, "When the sentence starts with a subordinate clause, that whole clause is position 1 → the main verb comes right after the comma.", 21); L = low(); }
        }
      }
    }
    // main clause after a leading subordinate clause: "Wenn ich Zeit habe, ich komme."
    L = low();
    if (SUB.has(L[0])) {
      const c = words.findIndex((w) => /,$/.test(w));
      if (c > 0 && PRONOUNS.has(L[c + 1]) && isFinite(L[c + 2] || "")) {
        add(`<s>${L[c + 1]} ${L[c + 2]}</s> → <b>${L[c + 2]} ${L[c + 1]}</b>`, `The whole ${L[0]}-clause is position 1 → the main-clause verb comes <b>right after the comma</b>.`, 21);
        const tmp = words[c + 1]; words[c + 1] = words[c + 2]; words[c + 2] = tmp.toLowerCase();
      }
    }
    // denn with verb at end
    L = low();
    const di = L.indexOf("denn");
    if (di > 0 && L.length - di >= 4 && PRONOUNS.has(L[di + 1]) && !isFinite(L[di + 2]) && isFinite(L[L.length - 1])) {
      const v = words.pop(); words.splice(di + 2, 0, v);
      add(`denn … <s>${v}</s> (end)`, "<b>denn</b> is a position-0 connector: the verb stays in <b>position 2</b> (denn ich <b>bin</b> müde). If you want the verb at the end, use <b>weil</b>.", 20);
    }
    // modal + non-infinitive / zu after modal
    L = low();
    const mi = L.findIndex((w) => MODAL_F.has(w));
    let mEnd = L.length; if (mi >= 0) for (let k = mi; k < L.length; k++) if (/[,.!?:;]$/.test(words[k]) || /[„“"]/.test(words[k])) { mEnd = k + 1; break; }
    if (mi >= 0 && mi < L.length - 1 && !L.some((w) => SUB.has(w)) && mEnd === L.length) {
      const lastW = L[L.length - 1];
      if (L[L.length - 2] === "zu" && !/^(zu)$/.test(lastW)) { add(`<s>zu ${lastW}</s> → <b>${lastW}</b>`, "No <b>zu</b> after a modal verb.", 11); words.splice(L.length - 2, 1); }
      else if (isFinite(lastW) && !/en$|ern$|eln$/.test(lastW) && !MODAL_F.has(lastW)) {
        const inf = finIndex().get(lastW)[0].inf;
        if (inf && inf !== "(past)" && !/^(sein|haben)$/.test(inf) || /^(bin|ist|habe|hat)$/.test(lastW)) {
          add(`<s>${lastW}</s> → <b>${inf}</b>`, `After a modal verb (<b>${L[mi]}</b>) the second verb is an <b>infinitive</b> at the end.`, 11);
          words[words.length - 1] = inf;
        }
      } else if (mi + 1 < L.length - 1 && isFinite(L[mi + 2] || "") && /en$/.test(L[mi + 2] || "") === false) { /* skip */ }
      // conjugated form instead of infinitive: "Ich kann spreche Deutsch"
      L = low();
      const badK = L.findIndex((w, k) => k > mi && words[k] === w && !/n$/.test(w) && finIndex().has(w) && !finIndex().get(w).some((x) => x.inf === w) && !MODAL_F.has(w) && !PRONOUNS.has(w) && finIndex().get(w)[0].inf !== "(past)");
      if (badK > 0) {
        const inf = finIndex().get(L[badK])[0].inf;
        add(`<s>${L[badK]}</s> → <b>${inf}</b> (at the end)`, `After a modal verb (<b>${L[mi]}</b>) the second verb is an <b>infinitive</b> and goes to the <b>end</b>.`, 11);
        words.splice(badK, 1); words.push(inf);
      }
      // infinitive not at end: "Ich kann sprechen Deutsch"
      L = low();
      const infIdx = L.findIndex((w, k) => k > mi + 1 && k < L.length - 1 && finIndex().has(w) && finIndex().get(w).some((x) => x.inf === w));
      const perfInf = /^(haben|sein|worden|werden)$/.test((L[L.length - 1] || "").replace(/[.?!]$/, ""));
      if (infIdx > 0 && !perfInf && !PRONOUNS.has(L[infIdx + 1]) && !L.includes("und")) {
        const w = words.splice(infIdx, 1)[0]; words.push(w);
        add(`<s>${w} ${words.slice(infIdx, -1).join(" ")}</s> → <b>${words.slice(infIdx, -1).join(" ")} ${w}</b>`, "With a modal verb the infinitive goes to the very <b>end</b> (verb bracket).", 11);
      }
    }
    // subject-verb agreement for ich/du/er/wir/ihr
    L = low();
    const starts = new Set([0]);
    words.forEach((w, k) => { if (/,$/.test(w) || /^(und|aber|oder|denn|sondern|weil|dass|wenn|ob|obwohl|damit|als|bevor|nachdem)$/i.test(w)) starts.add(k + 1); });
    for (let i = 0; i < L.length - 1; i++) {
      for (const [a, b] of [[i, i + 1], [i + 1, i]]) {
        const pr = L[a], vb = L[b];
        if (!PRON_P[pr] || !finIndex().has(vb)) continue;
        if (/,$/.test(words[Math.min(a, b)])) continue;
        if (b > 0 && /^[A-ZÄÖÜ]/.test(words[b])) continue;
        if (a < b && !starts.has(a)) continue;
        if (b < a) {
          const before = L.slice(0, b).filter((w) => !/^(und|aber|oder|denn|sondern)$/.test(w));
          const onlyFront = before.length === 0 || (before.length <= 3 && before.every((w) => TIME1.includes(w) || TIME2.includes(before.join(" ")) || /^(um|am|im|jeden|letzte|nächste)$/.test(w) || /^\d/.test(w) || w === "uhr"));
          if (!onlyFront) continue;
        }
        if (b > a && a > 0 && (DAT_P.has(L[a - 1]) || AKK_P.has(L[a - 1]))) continue;
        const cands = finIndex().get(vb).filter((x) => x.inf !== "(past)");
        if (!cands.length) continue;
        const ok = cands.some((x) => x.p === PRON_P[pr] || (pr === "ihr" && x.p === "3s" && false));
        if (ok) continue;
        if (pr === "es" || pr === "er") { if (cands.some((x) => x.p === "3s")) continue; }
        const inf = cands[0].inf;
        let right;
        try { right = E.conj(E.VERBS.find((v) => v.inf === inf) || inf, PRON_P[pr]); } catch (e) { right = null; }
        const table = DC.conj && DC.conj[inf] && DC.conj[inf].f;
        const key = { "1s": "ich", "2s": "du", "3s": "er", "1p": "wir", "2p": "ihr" }[PRON_P[pr]];
        if (table && table[key]) right = String(table[key]).split(" ")[0];
        if (!right || right === vb) continue;
        add(`<s>${pr} ${vb}</s> → <b>${pr} ${right}</b>`, `The ending must match the subject: <b>${pr}</b> → -${{ "1s": "e", "2s": "st", "3s": "t", "1p": "en", "2p": "t" }[PRON_P[pr]]}${/[äie]/.test(right) && right !== inf ? ` (${inf} changes its vowel with du/er)` : ""}.`, 2);
        words[b] = words[b][0] === words[b][0].toUpperCase() ? R_cap(right) : right;
      }
    }
    // nicht ein → kein
    L = low();
    const ni = /^warum\b/i.test(raw) ? -1 : L.findIndex((w, i) => w === "nicht" && /^ein(e|en|em|er)?$/.test(L[i + 1] || ""));
    if (ni >= 0) { const k = "k" + L[ni + 1]; add(`<s>nicht ${L[ni + 1]}</s> → <b>${k}</b>`, "A noun with <b>ein</b> is negated with <b>kein</b> (same ending).", 7); words.splice(ni, 2, k); }
    // preposition + article case
    L = low();
    for (let i = 0; i < L.length - 2; i++) {
      const p = L[i]; if (!DAT_P.has(p) && !AKK_P.has(p)) continue;
      const a = L[i + 1]; if (!/^(der|die|das|den|dem|ein|eine|einen|einem|einer)$/.test(a)) continue;
      const ng = nounGender(words[i + 2].replace(/[,;:]$/, "")); if (!ng || ng.pl) continue;
      const c = DAT_P.has(p) ? "dat" : "akk";
      const kind = /^ein/.test(a) ? "indef" : "def";
      const right = E.art(kind, c, ng.g);
      if (right !== a) {
        let fix = `${p} ${right}`;
        if (p === "zu" && right === "dem") fix = "zum"; else if (p === "zu" && right === "der") fix = "zur"; else if (p === "von" && right === "dem") fix = "vom"; else if (p === "bei" && right === "dem") fix = "beim";
        add(`<s>${p} ${a} ${ng.de}</s> → <b>${fix} ${ng.de}</b>`, `<b>${p}</b> always takes the <b>${c === "dat" ? "Dativ" : "Akkusativ"}</b>. ${ng.de} is ${{ m: "masculine", f: "feminine", n: "neuter" }[ng.g]} → ${right}.`, 15);
        words.splice(i, 2, ...fix.split(" "));
        L = low();
      }
    }
    // verb + object case (akk/dat verbs)
    L = low();
    for (let i = 0; i < L.length - 2; i++) {
      const cands = finIndex().get(L[i]); if (!cands) continue;
      const v = E.VERBS.find((x) => cands.some((c) => c.inf === x.inf) && x.obj);
      if (!v) continue;
      if (!(PRONOUNS.has(L[i - 1]) || PRONOUNS.has(L[i + 1]))) continue;
      if (/^[A-ZÄÖÜ]/.test(words[i]) && i > 0) continue;
      let j = i + 1; if (PRONOUNS.has(L[j])) j++;
      if (TIME1.includes(L[j])) j++;
      const a = L[j]; if (!/^(der|die|das|den|dem|ein|eine|einen|einem)$/.test(a || "")) continue;
      const nw = (words[j + 1] || "").replace(/[,;:.!?]$/, "");
      if (nw.length < 2 || !/^[A-ZÄÖÜ]/.test(nw)) continue;      // German nouns are capitalised
      const ng = nounGender(nw); if (!ng || ng.pl) continue;
      if (a === "der" && j === 1) continue;
      const kind = /^ein/.test(a) ? "indef" : "def";
      const right = E.art(kind, v.obj, ng.g);
      if (right !== a) {
        add(`<s>${a} ${ng.de}</s> → <b>${right} ${ng.de}</b>`, `<b>${v.inf}</b> takes the <b>${v.obj === "dat" ? "Dativ" : "Akkusativ"}</b>. ${ng.de} is ${{ m: "masculine", f: "feminine", n: "neuter" }[ng.g]} → ${right}.`, v.obj === "dat" ? 13 : 6);
        words[j] = right;
      }
    }
    // als vs wenn
    L = low();
    if (L[0] === "wenn" && L.slice(0, 6).some((w) => /^(war|hatte|waren|kam|ging|wohnte)$/.test(w)) && !L.includes("immer")) {
      add("<s>Wenn</s> → <b>Als</b>", "A single event/period in the past takes <b>als</b>; wenn is for present/future or repeated events.", 34);
      words[0] = "Als";
    }
    // capitalisation of known nouns
    L = low();
    words = words.map((w, i) => {
      const k = w.replace(/[,;:]$/, "");
      const prev = (L[i - 1] || ""), next = words[i + 1] || "";
      if (i > 0 && k === k.toLowerCase() && NOUNSET.has(k) && !isFinite(k) && !/^(essen|leben|arbeiten|junge|alte|kranke|recht|unrecht|leid|weh|schuld|angst)$/.test(k) && !PRONOUNS.has(prev) && !/^[A-ZÄÖÜ]/.test(next) && !/^(zu|sich|mich|dich|uns|euch)$/.test(prev)) {
        add(`<s>${k}</s> → <b>${R_cap(k)}</b>`, "All German nouns start with a capital letter.", 5);
        return R_cap(k) + w.slice(k.length);
      }
      return w;
    });
    if (words[0] && words[0][0] !== words[0][0].toUpperCase()) { add("Capital letter at the start", "Every sentence starts with a capital letter.", 3); words[0] = R_cap(words[0]); }
    if (L.includes("wegen") && /wegen (dem|den)/.test(L.join(" "))) add("<s>wegen dem</s> → <b>wegen des</b>", "Spoken German often uses the Dativ, but in writing/exams wegen takes the <b>Genitiv</b>.", 40);
    // dedupe
    const seen = new Set();
    const out = issues.filter((x) => (seen.has(x.rule) ? false : seen.add(x.rule)));
    return { issues: out, fixed: words.join(" ") + endP };
  }
  function R_cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------- dictionary ----------
  const FUNC = {
    der: "the (masc. nom. / fem. dat.)", die: "the (fem. / plural)", das: "the (neuter) / that", den: "the (masc. akk. / dat. pl.)", dem: "the (masc./neut. dat.)", des: "of the (genitive)",
    ein: "a (masc./neut.)", eine: "a (fem.)", einen: "a (masc. akk.)", einem: "a (dat.)", einer: "a (fem. dat./gen.)", kein: "no / not a", keine: "no / not any",
    ich: "I", du: "you", er: "he / it", sie: "she / they / it", es: "it", wir: "we", ihr: "you (all) / her / their", mich: "me (akk.)", mir: "me (dat.)", dich: "you (akk.)", dir: "you (dat.)", ihn: "him (akk.)", ihm: "him (dat.)", uns: "us", euch: "you (all)", ihnen: "them (dat.)", sich: "himself/herself/themselves",
    mein: "my", meine: "my", dein: "your", sein: "his / to be", seine: "his", unser: "our",
    und: "and", oder: "or", aber: "but", denn: "because (verb pos. 2)", sondern: "but rather", weil: "because (verb at end)", dass: "that", wenn: "if / when(ever)", als: "when (past) / than / as", ob: "whether", obwohl: "although", damit: "so that", bevor: "before", nachdem: "after", während: "while / during", deshalb: "therefore", trotzdem: "nevertheless", dann: "then", danach: "after that", auch: "also", noch: "still / yet", schon: "already", nur: "only", sehr: "very", nicht: "not", gern: "gladly (like to)", oft: "often", immer: "always", nie: "never", heute: "today", morgen: "tomorrow", gestern: "yesterday", jetzt: "now", hier: "here", dort: "there", viel: "much / a lot", zusammen: "together", leider: "unfortunately",
    in: "in / into", im: "in the", ins: "into the", an: "at / on", am: "at the / on (day)", auf: "on / onto", mit: "with / by", bei: "at / near", zu: "to / too", zum: "to the", zur: "to the", von: "from / of", vom: "from the", aus: "from / out of", nach: "to / after", seit: "since / for", für: "for", ohne: "without", um: "at (time) / around", durch: "through", gegen: "against", über: "over / about", unter: "under", vor: "before / ago / in front of", hinter: "behind", neben: "next to", zwischen: "between", wegen: "because of", trotz: "despite",
    ist: "is", sind: "are", bin: "am", bist: "are", war: "was", hat: "has", habe: "have", hatte: "had", wird: "becomes / will", kann: "can", muss: "must", will: "wants", möchte: "would like", man: "one / people", was: "what", wer: "who", wo: "where", wie: "how / as", warum: "why", wann: "when", woher: "where from", wohin: "where to", ja: "yes", nein: "no", doch: "yes (after negative) / after all",
  };
  function dict(term) {
    const t = term.toLowerCase().trim().replace(/^(der|die|das|to|a|an|the)\s+/, "");
    const res = []; const seenDe = new Set();
    const push0 = res.push.bind(res);
    res.push = (x) => { const k = x.de.toLowerCase(); if (seenDe.has(k)) return; seenDe.add(k); push0(x); };
    (DC.vocab || []).forEach((v) => {
      const de = v.de.toLowerCase(), bare = de.replace(/^(der|die|das)\s+/, "");
      const en = (v.en || "").toLowerCase();
      if (bare === t || de === t || en === t || en.split(/[,/;]\s*/).includes(t) || en.replace(/^to /, "") === t) res.push({ de: v.de, en: v.en, pl: v.pl, ex: v.exDe, exEn: v.exEn, level: v.level });
    });
    (DC.verbs || []).forEach((v) => { const en = (v.en || "").toLowerCase(); if (v.inf.toLowerCase() === t || en === t || en.replace(/^to /, "") === t) res.push({ de: v.inf, en: v.en, extra: `${v.pres} · ${v.past} · ${v.perf}`, ex: v.exDe, exEn: v.exEn, level: v.level }); });
    Object.entries(DC.conj || {}).forEach(([inf, v]) => { if (res.length < 3 && (inf === t || (v.en || "").toLowerCase().replace(/^to /, "") === t)) res.push({ de: inf, en: v.en }); });
    E.NOUNS.concat(E.PEOPLE).forEach((n) => { if ((n.de.toLowerCase() === t || n.en === t) && !res.some((r) => r.de.toLowerCase().endsWith(n.de.toLowerCase()))) res.push({ de: E.art("def", "nom", n.g) + " " + n.de, en: n.en, pl: "die " + n.pl }); });
    if (!res.length && FUNC[t]) res.push({ de: t, en: FUNC[t] });
    if (!res.length) {
      const fin = finIndex().get(t);
      if (fin && fin[0].inf !== "(past)") { const base = dict(fin[0].inf); if (base.length) res.push(Object.assign({}, base[0], { de: `${t} (form of ${base[0].de})` })); }
    }
    return res.slice(0, 5);
  }

  function articleGuess(word) {
    const w = word.replace(/^(der|die|das)\s+/i, "").trim();
    const ng = nounGender(w);
    const W = R_cap(w);
    if (ng) {
      const a = E.art("def", "nom", ng.g);
      return `<p><b class="g-${ng.g}">${a} ${W}</b> – ${{ m: "masculine", f: "feminine", n: "neuter" }[ng.g]}.</p>
<table class="mini"><tr><th></th><th>Nom.</th><th>Akk.</th><th>Dat.</th><th>Gen.</th></tr>
<tr><td>definite</td><td>${a}</td><td>${E.art("def", "akk", ng.g)}</td><td>${E.art("def", "dat", ng.g)}</td><td>${E.art("def", "gen", ng.g)}</td></tr>
<tr><td>indefinite</td><td>${E.art("indef", "nom", ng.g)}</td><td>${E.art("indef", "akk", ng.g)}</td><td>${E.art("indef", "dat", ng.g)}</td><td>${E.art("indef", "gen", ng.g)}</td></tr></table>`;
    }
    const rules = [[/(ung|heit|keit|schaft|ion|tät|ik|ur|enz|anz)$/i, "die", "Endings -ung, -heit, -keit, -schaft, -ion, -tät, -ik, -ur, -enz, -anz are (almost) always feminine."],
      [/(chen|lein|ment|um|ma)$/i, "das", "Endings -chen, -lein, -ment, -um, -ma are usually neuter."],
      [/(ling|ismus|ist|or|ant)$/i, "der", "Endings -ling, -ismus, -ist, -or, -ant are usually masculine."],
      [/e$/i, "die", "Most nouns ending in -e are feminine (exceptions: der Junge, der Kollege, das Ende …)."],
      [/er$/i, "der", "People/tools ending in -er are often masculine (der Lehrer, der Computer) – but not always (die Mutter, das Zimmer)."]];
    for (const [re, a, why] of rules) if (re.test(w)) return `<p>I don't have <b>${esc(W)}</b> in my word list, but the ending suggests <b>${a} ${esc(W)}</b>.</p><p class="muted">${why} Please double-check in a dictionary.</p>`;
    return `<p>I don't know <b>${esc(W)}</b> and its ending gives no reliable clue. Look it up (e.g. duden.de) and learn it with article + plural.</p>`;
  }

  function conjugateHtml(inf) {
    inf = inf.toLowerCase().trim();
    const tbl = DC.conj && DC.conj[inf];
    const eng = E.conjugateAll(inf);
    const vinfo = (DC.verbs || []).find((v) => v.inf === inf);
    const ev = E.VERBS.find((v) => v.inf === inf);
    const f = tbl ? { ich: tbl.f.ich, du: tbl.f.du, "er/sie/es": tbl.f.er, wir: tbl.f.wir, ihr: tbl.f.ihr, "sie/Sie": tbl.f.sie } :
      { ich: eng.forms["1s"], du: eng.forms["2s"], "er/sie/es": eng.forms["3s"], wir: eng.forms["1p"], ihr: eng.forms["2p"], "sie/Sie": eng.forms["3p"] };
    const guessed = !tbl && !eng.known && !vinfo;
    let h = `<p><b>${esc(inf)}</b>${tbl ? " – " + esc(tbl.en) : vinfo ? " – " + esc(vinfo.en) : ""}${guessed ? ' <span class="muted">(pattern for regular verbs – check if this verb is irregular)</span>' : ""}</p><table class="mini"><tr><th colspan="2">Präsens</th></tr>`;
    Object.entries(f).forEach(([k, v]) => (h += `<tr><td>${k}</td><td><b>${esc(v)}</b> <button class="say" data-tts="${esc(k.split("/")[0] + " " + v)}" aria-label="listen">🔊</button></td></tr>`));
    h += "</table>";
    if (vinfo) h += `<p>Präteritum: <b>${esc(vinfo.past)}</b> · Perfekt: <b>${esc(vinfo.perf)}</b></p>`;
    else if (ev) h += `<p>Perfekt: <b>${ev.aux === "sein" ? "ist" : "hat"} ${ev.pp}</b> ${ev.aux === "sein" ? "(sein: movement/change)" : ""}</p>`;
    if (vinfo && vinfo.exDe) h += `<p class="ex">${esc(vinfo.exDe)} <span class="muted">– ${esc(vinfo.exEn || "")}</span></p>`;
    if (ev && ev.ch) h += `<p class="muted">Stem change with du/er: ${ev.ch}-.</p>`;
    if (ev && ev.sep) h += `<p class="muted">Separable: ich ${eng.forms["1s"]} · Perfekt ${ev.pp} · zu-Inf. ${ev.sep}zu${ev.inf.slice(ev.sep.length)}</p>`;
    return h;
  }

  function ruleHtml(r) {
    let h = `<h4>${r.t}</h4><p><b>What:</b> ${r.what}</p><p><b>How:</b></p><ul>${r.how.map((x) => `<li>${x}</li>`).join("")}</ul>`;
    if (r.not && r.not.length) h += `<p><b>How NOT (common mistakes):</b></p><ul class="nots">${r.not.map(([w, c, y]) => `<li><s>${w}</s> → <b>${c}</b><br><span class="muted">${y}</span></li>`).join("")}</ul>`;
    h += `<p><b>Why:</b> ${r.why}</p><div class="row">`;
    if (r.l) h += `<button class="btn sm" data-go="lesson/${r.l}">Open lesson ${r.l}</button>`;
    if (r.g) h += `<button class="btn sm ghost" data-say="Quiz me on ${r.t}" data-gen="${r.g}">Quiz me</button>`;
    return h + "</div>";
  }
  function findRules(q) {
    const n = " " + norm(q) + " ";
    const scored = RULES.map((r) => ({ r, s: r.k.reduce((a, k) => a + (n.includes(" " + k + " ") || n.includes(k) ? k.length : 0), 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    return scored.map((x) => x.r);
  }
  function searchCourse(q) {
    const terms = norm(q).split(" ").filter((w) => w.length > 3 && !/^(what|when|where|which|about|explain|erkläre|please|does|with|this|that|have|mean|tell)$/.test(w));
    if (!terms.length) return [];
    const hits = [];
    (DC.curriculum || []).forEach((l) => {
      const hay = norm(l.title + " " + l.expl.join(" ") + " " + l.use);
      const s = terms.reduce((a, t) => a + (hay.includes(t) ? (norm(l.title).includes(t) ? 5 : 1) : 0), 0);
      if (s) hits.push({ l, s });
    });
    return hits.sort((a, b) => b.s - a.s).slice(0, 3);
  }
  const looksGerman = (s) => /\b(ich|du|er|wir|ihr|ist|bin|habe|hat|der|die|das|den|dem|nicht|und|mit|weil|dass|gestern|heute|morgen)\b/i.test(s) && !/\b(the|is|what|how|why|explain|does|mean|should|can you)\b/i.test(s);

  // ---------- online model (optional) ----------
  async function online(history, text, profile) {
    const st = window.Store && Store.get().settings;
    if (!st || !st.aiKey || !st.aiOnline) return null;
    const sys = `You are Max, a patient German tutor for an English-speaking learner at level ${profile.level} preparing for the B1 exam (Goethe/telc). Always answer in English with German examples. Structure grammar answers as: What / How / How NOT (typical mistakes) / Why. When correcting a sentence, show the corrected sentence first, then each error with the reason. Keep answers under 200 words. Use simple HTML (<b>, <i>, <ul>, <li>, <p>) and no markdown.`;
    const msgs = history.slice(-8).map((m) => ({ role: m.role, content: m.text })).concat([{ role: "user", content: text }]);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": st.aiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
      body: JSON.stringify({ model: st.aiModel || "claude-haiku-4-5-20251001", max_tokens: 700, system: sys, messages: msgs }),
    });
    if (!res.ok) throw new Error("Online model error " + res.status);
    const data = await res.json();
    return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }

  // ---------- main reply ----------
  async function reply(text, ctx) {
    const t = text.trim();
    const n = norm(t);
    if (!t) return { html: HELP };
    if (/^(hi|hallo|hello|hey|help|hilfe|\?)$/.test(n)) return { html: HELP };

    let m;
    if ((m = t.match(/^(?:check|korrigiere?|correct|prüfe?|is this (?:right|correct)\??)\s*[:\-]?\s*(.+)$/i)) || (looksGerman(t) && t.split(" ").length >= 3 && !/\?$/.test(t) && !/^(explain|erkläre|what|why|how|was|warum|wie)\b/i.test(t))) {
      const s = m ? m[1] : t;
      const r = check(s);
      if (!r.issues.length) return { html: `<p>I found no rule problems in:</p><p class="ex">${esc(s)} <button class="say" data-tts="${esc(s)}">🔊</button></p><p class="muted">My checker covers word order, verb endings, haben/sein, cases after verbs & prepositions, modal verbs, kein/nicht and capitalisation. It can't judge meaning or style.</p>` };
      return { html: `<p><b>Corrected:</b></p><p class="ex ok">${esc(r.fixed)} <button class="say" data-tts="${esc(r.fixed)}">🔊</button></p><ul class="nots">${r.issues.map((i) => `<li>${i.rule}<br><span class="muted">${i.why}</span>${i.lesson ? ` <button class="link" data-go="lesson/${i.lesson}">Lesson ${i.lesson}</button>` : ""}</li>`).join("")}</ul>`, weak: r.issues.map((i) => i.lesson) };
    }
    if ((m = t.match(/(?:conjugat\w*|konjugier\w*|forms? of|konjugation (?:von)?)\s+(?:the verb\s+)?([a-zäöüß]+)/i))) return { html: conjugateHtml(m[1]) };
    if ((m = t.match(/(?:article|artikel|gender|genus)\s+(?:of|for|von)?\s*["„]?([A-Za-zÄÖÜäöüß-]+)/i)) || (m = t.match(/^(?:der|die|das)\s*(?:\/|or|oder)\s*(?:der|die|das)?\s*(?:\/|or|oder)?\s*(?:der|die|das)?\s+([A-Za-zÄÖÜäöüß-]+)\??$/i)) || (m = t.match(/^is it (?:der|die|das) ([A-Za-zÄÖÜäöüß-]+)/i))) return { html: articleGuess(m[1]) };
    if ((m = t.match(/(?:what does|was (?:heißt|bedeutet))\s+["„]?([^"“?]+?)["“]?\s*(?:mean|auf englisch)?\s*\??$/i)) || (m = t.match(/^(?:translate|meaning of|übersetze)\s+["„]?([^"“?]+?)["“]?\??$/i)) || (m = t.match(/how do (?:you|i) say\s+["„]?([^"“?]+?)["“]?\s+in german\??$/i)) || (m = t.match(/what is\s+["„]?([^"“?]+?)["“]?\s+in german\??$/i))) {
      const r = dict(m[1]);
      if (r.length) return { html: r.map((x) => `<p><b>${esc(x.de)}</b> = ${esc(x.en)}${x.pl ? ` <span class="muted">(Pl. ${esc(x.pl)})</span>` : ""} <button class="say" data-tts="${esc(x.de)}">🔊</button>${x.extra ? `<br><span class="muted">${esc(x.extra)}</span>` : ""}${x.ex ? `<br><i>${esc(x.ex)}</i> – ${esc(x.exEn || "")}` : ""}</p>`).join("") };
      const on = await tryOnline(ctx, t); if (on) return on;
      return { html: `<p>„${esc(m[1])}“ isn't in my offline word list (${(DC.vocab || []).length} words + ${(DC.verbs || []).length} verbs). Try a dictionary like dict.cc or turn on online AI in Settings.</p>` };
    }
    if (/\b(quiz|test me|practi[cs]e|übung|drill|frag mich)\b/i.test(t)) {
      const r = findRules(t)[0];
      const gen = r && r.g ? r.g : null;
      const item = E.generate(gen);
      return { html: `<p>Here's a ${r ? r.t : "mixed"} question:</p>`, item };
    }
    if (/\b(what (?:should|to) (?:i )?(?:learn|do|study)|next|plan|progress|fortschritt|weak|schwach|recommend)\b/i.test(t)) {
      const p = ctx.profile;
      const weak = p.weak.length ? `<p>Your weakest topics right now: ${p.weak.map((w) => `<button class="chip" data-gen="${w.id}" data-say="Quiz me on ${w.title}">${w.title} (${w.pct}%)</button>`).join(" ")}</p>` : "";
      return { html: `<p>You're on <b>lesson ${p.next.n}: ${esc(p.next.title)}</b> (${p.done}/42 done, ${p.due} cards due).</p>${weak}<p>Plan for today: 1) review due vocabulary, 2) study lesson ${p.next.n}, 3) 10 generated drills, 4) speak about the lesson picture for 2 minutes.</p><div class="row"><button class="btn sm" data-go="lesson/${p.next.n}">Continue lesson ${p.next.n}</button><button class="btn sm ghost" data-go="vocab">Review words</button></div>` };
    }
    if (/\b(exam|prüfung|goethe|telc|dtz|teil [123])\b/i.test(t) && !findRules(t).length) {
      return { html: `<p><b>B1 speaking (Goethe)</b>: Teil 1 plan something together (3 min) · Teil 2 present a topic with 5 slides (3 min) · Teil 3 react and answer questions (2 min).</p><p><b>Scoring tips:</b> use connectors (weil, obwohl, deshalb, zwar … aber), give reasons, react to your partner, correct yourself calmly.</p><div class="row"><button class="btn sm" data-go="exam">Open exam trainer</button><button class="btn sm ghost" data-go="lesson/27">Planning lesson</button><button class="btn sm ghost" data-go="lesson/42">Presentation lesson</button></div>` };
    }
    if ((m = t.match(/^(?:say|pronounce|sprich|aussprache(?: von)?)\s+(.+)$/i))) return { html: `<p class="ex">${esc(m[1])} <button class="say" data-tts="${esc(m[1])}">🔊</button></p><p class="muted">Tap 🔊 to hear it, then use the Speak trainer to compare your pronunciation.</p>`, speak: m[1] };

    const rules = findRules(t);
    if (rules.length) {
      let html = ruleHtml(rules[0]);
      if (rules[1] && /\b(or|oder|vs|versus|difference|unterschied)\b/i.test(t)) html += "<hr>" + ruleHtml(rules[1]);
      return { html };
    }
    const on = await tryOnline(ctx, t); if (on) return on;
    const hits = searchCourse(t);
    if (hits.length) return { html: `<p>These lessons match your question:</p>${hits.map((h) => `<p><button class="link" data-go="lesson/${h.l.n}">Lesson ${h.l.n}: ${esc(h.l.title)}</button><br><span class="muted">${h.l.expl[0].replace(/\*\*/g, "")}</span></p>`).join("")}` };
    const d = dict(t.replace(/\?$/, ""));
    if (d.length) return { html: d.map((x) => `<p><b>${esc(x.de)}</b> = ${esc(x.en)} <button class="say" data-tts="${esc(x.de)}">🔊</button></p>`).join("") };
    return { html: `<p>I'm not sure what you mean. ${ctx.aiOnline ? "" : "Offline, I understand grammar topics, sentence checks, conjugations, articles, word meanings and quizzes."}</p>` + HELP };
  }
  async function tryOnline(ctx, t) {
    try { const txt = await online(ctx.history || [], t, ctx.profile); if (txt) return { html: txt, online: true }; } catch (e) { return { html: `<p class="muted">Online AI failed (${esc(e.message)}). Answering offline.</p>` }; }
    return null;
  }

  window.Tutor = { reply, check, RULES, dict, conjugateHtml, articleGuess, ruleHtml, findRules };
})();
