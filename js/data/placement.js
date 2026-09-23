window.DC = window.DC || {};
/* Placement bank – written for Deutsch Coach, four options, one clear rule per item.
   Stage 1–2 ≈ A1, 3–4 ≈ A2, 5–6 ≈ B1, 7–8 ≈ B2, 9–10 ≈ C1, 11–12 ≈ C2.
   Each item: q (question, ___ marks the gap), o (options), a (index of the correct one),
   t (topic key, used for the weak-topic report), w (why – shown only in the review at the end). */
DC.placement = [
  /* ---------------- Stage 1 · A1 ---------------- */
  { s: 1, t: "sein/haben", q: "Hallo! Ich ___ Ravi.", o: ["bin", "ist", "bist", "sind"], a: 0, w: "ich → bin." },
  { s: 1, t: "W-Fragen", q: "___ kommst du? – Aus Indien.", o: ["Woher", "Wohin", "Wo", "Wer"], a: 0, w: "woher = from where; wohin = where to; wo = where." },
  { s: 1, t: "Artikel", q: "Das ist ___ Buch.", o: ["ein", "eine", "einen", "einem"], a: 0, w: "das Buch is neuter → ein." },
  { s: 1, t: "Verbendung", q: "Er ___ in Berlin.", o: ["wohnt", "wohne", "wohnst", "wohnen"], a: 0, w: "er → -t." },
  { s: 1, t: "Zahlen/Uhrzeit", q: "Es ist 7.30 Uhr: ___.", o: ["halb acht", "halb sieben", "sieben halb", "acht halb"], a: 0, w: "German counts to the next hour: halb acht = 7.30." },
  { s: 1, t: "Artikel", q: "___ Frau heißt Anna.", o: ["Die", "Der", "Das", "Den"], a: 0, w: "die Frau, feminine." },
  { s: 1, t: "Verbendung", q: "___ ihr aus Spanien?", o: ["Kommt", "Kommst", "Kommen", "Komme"], a: 0, w: "ihr → -t." },
  { s: 1, t: "Negation", q: "Ich habe ___ Auto.", o: ["kein", "nicht", "keine", "nichts"], a: 0, w: "kein negates a noun; das Auto → kein." },

  /* ---------------- Stage 2 · A1 ---------------- */
  { s: 2, t: "Akkusativ", q: "Ich kaufe ___ Tisch.", o: ["einen", "ein", "eine", "einem"], a: 0, w: "der Tisch, Akkusativ → einen." },
  { s: 2, t: "Possessiv", q: "Das ist meine Schwester. ___ Name ist Leila.", o: ["Ihr", "Sein", "Euer", "Dein"], a: 0, w: "the sister's name → ihr." },
  { s: 2, t: "Wortstellung", q: "Welcher Satz ist richtig?", o: ["Morgen fahre ich nach Bonn.", "Morgen ich fahre nach Bonn.", "Ich morgen fahre nach Bonn.", "Fahre morgen ich nach Bonn."], a: 0, w: "The conjugated verb is always in position 2." },
  { s: 2, t: "Modalverben", q: "___ du Deutsch sprechen?", o: ["Kannst", "Kann", "Könnt", "Könnten"], a: 0, w: "du → kannst; the infinitive goes to the end." },
  { s: 2, t: "Trennbare Verben", q: "Ich ___ um sieben Uhr ___.", o: ["stehe … auf", "aufstehe … –", "stehe auf … –", "auf … stehe"], a: 0, w: "Separable verbs split: the prefix closes the sentence." },
  { s: 2, t: "Präpositionen", q: "Wir fahren ___ Berlin.", o: ["nach", "zu", "in", "an"], a: 0, w: "nach + city or country without an article." },
  { s: 2, t: "Plural", q: "ein Kind – zwei ___", o: ["Kinder", "Kinds", "Kinden", "Kindern"], a: 0, w: "das Kind → die Kinder." },
  { s: 2, t: "Imperativ", q: "___ bitte langsamer! (du)", o: ["Sprich", "Sprechen", "Sprichst", "Sprecht"], a: 0, w: "du-Imperativ of sprechen: Sprich (no -st, vowel change stays)." },

  /* ---------------- Stage 3 · A2 ---------------- */
  { s: 3, t: "Perfekt", q: "Gestern ___ ich nach Köln ___.", o: ["bin … gefahren", "habe … gefahren", "bin … fahren", "habe … gefahrt"], a: 0, w: "Verbs of movement form the Perfekt with sein." },
  { s: 3, t: "Dativ", q: "Ich helfe ___ Kollegen.", o: ["dem", "den", "der", "das"], a: 0, w: "helfen always takes the Dativ." },
  { s: 3, t: "Präpositionen", q: "Das Buch liegt ___ Tisch.", o: ["auf dem", "auf den", "auf der", "an das"], a: 0, w: "Position (wo?) → Dativ." },
  { s: 3, t: "Konnektoren", q: "Ich komme nicht, ___ ich krank bin.", o: ["weil", "denn", "deshalb", "trotzdem"], a: 0, w: "weil sends the verb to the end – and “bin” is at the end here." },
  { s: 3, t: "Komparativ", q: "Berlin ist ___ als Bonn.", o: ["größer", "größe", "am größten", "mehr groß"], a: 0, w: "Comparative with -er + als." },
  { s: 3, t: "Dativ", q: "Ich fahre mit ___ Bus.", o: ["dem", "den", "der", "das"], a: 0, w: "mit always takes the Dativ." },
  { s: 3, t: "Perfekt", q: "Sie ___ den Brief ___.", o: ["hat … geschrieben", "ist … geschrieben", "hat … schreiben", "hat … geschreibt"], a: 0, w: "schreiben: haben + irregular participle geschrieben." },
  { s: 3, t: "Wortstellung", q: "Welcher Satz ist richtig?", o: ["Ich komme heute nicht.", "Ich nicht komme heute.", "Ich komme nicht heute.", "Nicht ich komme heute."], a: 0, w: "nicht stands at the end when it negates the whole sentence." },

  /* ---------------- Stage 4 · A2 ---------------- */
  { s: 4, t: "Adjektivendungen", q: "Ich trinke ___ Kaffee. (heiß)", o: ["heißen", "heiße", "heißer", "heißes"], a: 0, w: "No article, Akkusativ masculine → -en: heißen Kaffee." },
  { s: 4, t: "Nebensatz", q: "Ich weiß nicht, ___ er heute kommt.", o: ["ob", "wenn", "dass", "als"], a: 0, w: "Indirect yes/no question → ob." },
  { s: 4, t: "Reflexiv", q: "Ich freue ___ auf das Wochenende.", o: ["mich", "mir", "sich", "mein"], a: 0, w: "sich freuen auf + Akkusativ; ich → mich." },
  { s: 4, t: "Präteritum", q: "Als Kind ___ ich viel Fußball.", o: ["spielte", "spiele", "gespielt", "spielen"], a: 0, w: "Narrating the past in writing → Präteritum." },
  { s: 4, t: "Konnektoren", q: "___ ich Kind war, wohnte ich in Pune.", o: ["Als", "Wenn", "Wann", "Ob"], a: 0, w: "als = one single event in the past; wenn = repeated or future." },
  { s: 4, t: "Dativ/Akkusativ", q: "Ich schenke ___ Mutter ___ Blumen.", o: ["meiner … –", "meine … –", "meiner … die", "meine … den"], a: 0, w: "Person = Dativ (meiner Mutter), thing = Akkusativ." },
  { s: 4, t: "Modalverben", q: "Man ___ hier nicht rauchen.", o: ["darf", "muss", "will", "mag"], a: 0, w: "Prohibition → darf nicht." },
  { s: 4, t: "Zeitangaben", q: "___ Montag habe ich Unterricht.", o: ["Am", "Im", "Um", "An"], a: 0, w: "Days: am Montag. Months: im Mai. Clock: um acht." },

  /* ---------------- Stage 5 · B1 ---------------- */
  { s: 5, t: "Adjektivendungen", q: "Wir suchen einen ___ Mitarbeiter.", o: ["neuen", "neue", "neuer", "neues"], a: 0, w: "einen (Akk. masc.) → adjective -en." },
  { s: 5, t: "Relativsatz", q: "Das ist der Kollege, ___ ich gestern getroffen habe.", o: ["den", "der", "dem", "dessen"], a: 0, w: "treffen + Akkusativ → den." },
  { s: 5, t: "Konjunktiv II", q: "An deiner Stelle ___ ich früher gehen.", o: ["würde", "werde", "wäre", "hätte"], a: 0, w: "Advice → würde + infinitive." },
  { s: 5, t: "Passiv", q: "Das Haus ___ 1990 ___.", o: ["wurde … gebaut", "ist … gebaut", "hat … gebaut", "wird … bauen"], a: 0, w: "Passive in the past: wurde + Partizip II." },
  { s: 5, t: "Verben mit Präposition", q: "Ich interessiere mich ___ Geschichte.", o: ["für", "an", "auf", "über"], a: 0, w: "sich interessieren für + Akkusativ." },
  { s: 5, t: "Genitiv", q: "Das ist das Auto ___ Nachbarn.", o: ["des", "dem", "der", "den"], a: 0, w: "Genitiv masculine → des Nachbarn." },
  { s: 5, t: "Konnektoren", q: "Es regnete stark, ___ das Spiel ausfiel.", o: ["sodass", "obwohl", "damit", "indem"], a: 0, w: "Consequence → sodass." },
  { s: 5, t: "n-Deklination", q: "Ich habe mit dem ___ gesprochen.", o: ["Kunden", "Kunde", "Kundes", "Kundem"], a: 0, w: "der Kunde is an n-noun: every case except the Nominativ ends in -n." },

  /* ---------------- Stage 6 · B1 ---------------- */
  { s: 6, t: "Infinitivsätze", q: "Ich habe keine Zeit, ___ Deutsch ___ lernen.", o: ["– … zu", "um … zu", "zu … –", "damit … zu"], a: 0, w: "Simple infinitive clause: … keine Zeit, Deutsch zu lernen." },
  { s: 6, t: "Infinitivsätze", q: "Ich lerne Deutsch, ___ eine Arbeit ___ finden.", o: ["um … zu", "– … zu", "damit … zu", "ohne … zu"], a: 0, w: "Purpose with the same subject → um … zu." },
  { s: 6, t: "Wechselpräpositionen", q: "Ich hänge das Bild ___ Wand.", o: ["an die", "an der", "auf der", "in der"], a: 0, w: "Movement (wohin?) → Akkusativ." },
  { s: 6, t: "Konjunktiv II", q: "Wenn ich mehr Zeit ___, würde ich reisen.", o: ["hätte", "habe", "hatte", "haben würde"], a: 0, w: "Irreal condition: hätte." },
  { s: 6, t: "Passiv", q: "Der Antrag muss heute ___ ___.", o: ["abgegeben werden", "abgegeben sein", "abgeben werden", "werden abgegeben"], a: 0, w: "Passive with a modal: Partizip II + werden at the end." },
  { s: 6, t: "Relativsatz", q: "Die Firma, ___ Produkte wir kaufen, ist neu.", o: ["deren", "dessen", "die", "der"], a: 0, w: "Genitive relative pronoun, feminine → deren." },
  { s: 6, t: "Verben mit Präposition", q: "Es hängt ___ Wetter ab.", o: ["vom", "auf das", "an dem", "über das"], a: 0, w: "abhängen von + Dativ: von dem = vom." },
  { s: 6, t: "Konnektoren", q: "___ er krank war, ist er zur Arbeit gegangen.", o: ["Obwohl", "Weil", "Trotzdem", "Deshalb"], a: 0, w: "Concession in a subordinate clause → obwohl." },

  /* ---------------- Stage 7 · B2 ---------------- */
  { s: 7, t: "Konjunktiv I", q: "Er sagt, er ___ keine Zeit.", o: ["habe", "hat", "hätte", "haben"], a: 0, w: "Reported speech → Konjunktiv I: habe." },
  { s: 7, t: "Partizipien", q: "die ___ Kosten (steigen)", o: ["steigenden", "gestiegenen", "steigen", "steigende"], a: 0, w: "Partizip I + adjective ending: die steigenden Kosten." },
  { s: 7, t: "Passiversatz", q: "Das Problem ___ sich leicht lösen.", o: ["lässt", "wird", "ist", "hat"], a: 0, w: "sich lassen + infinitive = can be done." },
  { s: 7, t: "Nominalstil", q: "weil es geregnet hat = ___ des Regens", o: ["wegen", "trotz", "während", "statt"], a: 0, w: "Reason → wegen + Genitiv." },
  { s: 7, t: "Konjunktiv II Vergangenheit", q: "Wenn ich das gewusst hätte, ___ ich früher ___.", o: ["wäre … gekommen", "hätte … gekommen", "würde … kommen", "wäre … kommen"], a: 0, w: "Irreal past with a sein-verb: wäre + Partizip II." },
  { s: 7, t: "Modalverben subjektiv", q: "Sein Auto steht da. Er ___ zu Hause sein.", o: ["muss", "darf", "soll", "will"], a: 0, w: "Near-certain conclusion → muss." },
  { s: 7, t: "Konnektoren", q: "Man spart Energie, ___ man weniger heizt.", o: ["indem", "sodass", "obwohl", "damit"], a: 0, w: "Means/how → indem." },
  { s: 7, t: "Adjektivendungen", q: "Trotz ___ Wetters fahren wir. (schlecht)", o: ["schlechten", "schlechtes", "schlechtem", "schlechter"], a: 0, w: "Genitiv after des: des schlechten Wetters." },

  /* ---------------- Stage 8 · B2 ---------------- */
  { s: 8, t: "Funktionsverbgefüge", q: "Wir müssen heute eine Entscheidung ___.", o: ["treffen", "machen", "nehmen", "geben"], a: 0, w: "eine Entscheidung treffen – never “machen”." },
  { s: 8, t: "Konnektoren", q: "___ Sie einverstanden sind, beginnen wir.", o: ["Sofern", "Indem", "Sodass", "Damit"], a: 0, w: "Formal condition → sofern." },
  { s: 8, t: "Passiversatz", q: "Die Formulare ___ bis Freitag ___.", o: ["sind … abzugeben", "haben … abzugeben", "werden … abgeben", "sind … abgeben"], a: 0, w: "sein + zu + infinitive = must be done." },
  { s: 8, t: "Konjunktiv I", q: "Sie sagen, sie ___ später. (kommen)", o: ["kämen", "kommen", "kommten", "kommend"], a: 0, w: "Konjunktiv I “kommen” looks like the indicative → Konjunktiv II kämen." },
  { s: 8, t: "Verben mit Präposition", q: "Der Erfolg ist ___ harte Arbeit zurückzuführen.", o: ["auf", "an", "von", "über"], a: 0, w: "zurückzuführen auf + Akkusativ." },
  { s: 8, t: "Partizipien", q: "die noch ___ Fragen (klären, notwendig)", o: ["zu klärenden", "geklärten", "klärenden", "zu klären"], a: 0, w: "zu + Partizip I = must be done: die zu klärenden Fragen." },
  { s: 8, t: "Nominalstil", q: "nachdem wir geprüft haben = ___ der Prüfung", o: ["nach", "bei", "vor", "seit"], a: 0, w: "nachdem → nach + Dativ." },
  { s: 8, t: "Wortschatz B2", q: "Der Bericht ___ deutliche Kritik an dem Verfahren.", o: ["übt", "macht", "gibt", "nimmt"], a: 0, w: "Kritik üben an + Dativ." },

  /* ---------------- Stage 9 · C1 ---------------- */
  { s: 9, t: "Erweiterte Attribute", q: "die ___ Anträge (vom Ausschuss / prüfen)", o: ["vom Ausschuss geprüften", "vom Ausschuss prüfenden", "geprüften vom Ausschuss", "prüfenden vom Ausschuss"], a: 0, w: "Extended attribute: everything stands before the participle." },
  { s: 9, t: "Modalpartikeln", q: "Wo sind ___ meine Schlüssel? (Ungeduld)", o: ["bloß", "ja", "eben", "schon"], a: 0, w: "bloß/nur signals impatience." },
  { s: 9, t: "Kohäsion", q: "Die Maschine war defekt; ___ verzögerte sich die Lieferung.", o: ["folglich", "obwohl", "zumal", "wohingegen"], a: 0, w: "Consequence as an adverb → folglich + inversion." },
  { s: 9, t: "Genitivpräpositionen", q: "___ der Kritik hält die Firma am Kurs fest.", o: ["Ungeachtet", "Entgegen", "Gemäß", "Zufolge"], a: 0, w: "ungeachtet + Genitiv = regardless of." },
  { s: 9, t: "Unpersönlicher Stil", q: "Es ist davon ___, dass die Zahlen steigen.", o: ["auszugehen", "ausgegangen", "ausgehen", "zu ausgehen"], a: 0, w: "Es ist davon auszugehen, dass … = it can be assumed." },
  { s: 9, t: "Kollokationen", q: "Bitte ___ Sie dem Hinweis Beachtung.", o: ["schenken", "geben", "machen", "legen"], a: 0, w: "Beachtung schenken." },
  { s: 9, t: "Relativsatz", q: "Das Verfahren, mit ___ Hilfe wir messen, ist neu.", o: ["dessen", "deren", "dem", "welchem"], a: 0, w: "Genitive relative pronoun, neuter → dessen." },
  { s: 9, t: "Kohäsion", q: "Wir handeln jetzt, ___ die Frist bald abläuft.", o: ["zumal", "wohingegen", "indem", "ungeachtet"], a: 0, w: "zumal reinforces a reason." },

  /* ---------------- Stage 10 · C1 ---------------- */
  { s: 10, t: "Nuancen", q: "Das Argument ist ___ unberechtigt. (höflich abschwächen)", o: ["nicht ganz", "völlig", "überaus", "keineswegs"], a: 0, w: "Litotes: nicht ganz un-… softens strongly." },
  { s: 10, t: "Register", q: "Formell für „Ich melde mich.“", o: ["Ich werde mich mit Ihnen in Verbindung setzen.", "Ich sag dann Bescheid.", "Ich meld mich dann mal.", "Ich komme drauf zurück."], a: 0, w: "Formal register: impersonal, full forms." },
  { s: 10, t: "Konjunktiv I", q: "Er behauptet, er ___ nichts davon gewusst.", o: ["habe", "hat", "hätte", "wäre"], a: 0, w: "Reported speech, past → habe + Partizip II." },
  { s: 10, t: "Satzbau C1", q: "___ hatte er begonnen, klingelte das Telefon.", o: ["Kaum", "Sobald", "Nachdem", "Während"], a: 0, w: "Kaum + inversion = hardly … when." },
  { s: 10, t: "Wortschatz C1", q: "Die Studie ___ auf 500 Interviews.", o: ["beruht", "besteht", "beträgt", "betrifft"], a: 0, w: "beruhen auf + Dativ = to be based on." },
  { s: 10, t: "Verbalstil", q: "zur Senkung der Kosten = ___ die Kosten zu senken", o: ["um", "damit", "indem", "ohne"], a: 0, w: "Purpose → um … zu." },
  { s: 10, t: "Modalverben subjektiv", q: "Die Firma ___ Probleme haben, heißt es in der Presse.", o: ["soll", "will", "muss", "darf"], a: 0, w: "soll = others claim it." },
  { s: 10, t: "Kohäsion", q: "___ die Methode teuer ist, liefert sie genaue Ergebnisse.", o: ["Zwar", "Folglich", "Zumal", "Somit"], a: 0, w: "zwar … jedoch concedes, then restricts." },

  /* ---------------- Stage 11 · C2 ---------------- */
  { s: 11, t: "Idiomatik", q: "Er sagt jedem sofort seine Meinung. Er ___.", o: ["nimmt kein Blatt vor den Mund", "redet um den heißen Brei herum", "dreht einem das Wort im Mund um", "hält die Stange"], a: 0, w: "kein Blatt vor den Mund nehmen = to speak plainly." },
  { s: 11, t: "Präpositionen C2", q: "___ des Arbeitskräftemangels wurden Fachkräfte angeworben.", o: ["Aufgrund", "Gemäß", "Entgegen", "Binnen"], a: 0, w: "aufgrund + Genitiv = because of." },
  { s: 11, t: "Stil", q: "Welcher Satz ist am prägnantesten?", o: ["Die Kosten sind erheblich gestiegen.", "Es ist so, dass die Kosten in erheblichem Maße eine Steigerung erfahren haben.", "Man kann sagen, dass die Kosten gestiegen sind, und zwar erheblich.", "Die Kosten, die gestiegen sind, sind erheblich gestiegen."], a: 0, w: "Concise beats padded: verb, not Nominalstil-plus-filler." },
  { s: 11, t: "Funktionsverbgefüge C2", q: "Nach langem Hin und Her ___ er zu der Überzeugung, dass er sich geirrt hatte.", o: ["gelangte", "beschloss", "fand", "kam heraus"], a: 0, w: "zu der Überzeugung gelangen." },
  { s: 11, t: "Partizipialsätze", q: "___ nach dem Geheimnis, lachte sie nur.", o: ["Gefragt", "Fragend", "Zu fragen", "Gefragt haben"], a: 0, w: "Participle clause with Partizip II = having been asked." },
  { s: 11, t: "Konjunktiv/Hedging", q: "Die Zahlen ___ eher optimistisch sein.", o: ["dürften", "müssten", "wollten", "sollten"], a: 0, w: "dürfte = cautious assumption." },
  { s: 11, t: "Wortschatz C2", q: "Der Vorwurf ___ jeder Grundlage.", o: ["entbehrt", "vermisst", "verzichtet", "entzieht"], a: 0, w: "einer Sache entbehren = to lack (+ Genitiv)." },
  { s: 11, t: "Register C2", q: "Gehoben für „Das geht nicht.“", o: ["Dies ist nicht hinnehmbar.", "Das ist echt nicht drin.", "Das klappt so nicht.", "Das geht gar nicht klar."], a: 0, w: "Elevated register." },

  /* ---------------- Stage 12 · C2 ---------------- */
  { s: 12, t: "Nuancen C2", q: "„Kein geringer Aufwand“ bedeutet:", o: ["ein sehr großer Aufwand", "ein kleiner Aufwand", "gar kein Aufwand", "ein mittlerer Aufwand"], a: 0, w: "Understatement by negation = a very large effort." },
  { s: 12, t: "Satzbau C2", q: "Welche Formulierung ist stilistisch am besten?", o: ["Entscheidend ist letztlich nicht die Technik, sondern die Organisation.", "Nicht die Technik ist letztlich entscheidend, sondern es ist die Organisation, die entscheidend ist.", "Die Organisation ist entscheidend und die Technik ist nicht entscheidend letztlich.", "Letztlich die Organisation entscheidend ist, nicht die Technik."], a: 0, w: "nicht … sondern, with the weight at the end." },
  { s: 12, t: "Idiomatik C2", q: "„Das schlägt mit 800 Euro zu Buche“ heißt:", o: ["es kostet 800 Euro", "es spart 800 Euro", "es dauert 800 Stunden", "es ist 800 Euro wert"], a: 0, w: "zu Buche schlagen = to cost, to show up in the accounts." },
  { s: 12, t: "Grammatik C2", q: "Auf der Messe habe ich ___ erfolgreichsten Autoren kennengelernt.", o: ["einen der", "einer der", "eines der", "eine der"], a: 0, w: "Akkusativ masculine: einen der … Autoren." },
  { s: 12, t: "Konnektoren C2", q: "___ sie zur Verständigung beitragen, schaffen Sportereignisse keinen Frieden.", o: ["Obwohl", "Weil", "Trotz", "Indem"], a: 0, w: "Concessive subordinate clause → obwohl." },
  { s: 12, t: "Wortschatz C2", q: "Die Regierung ___ die Kritik zu verharmlosen.", o: ["versucht", "verharrt", "verhindert", "vermeidet"], a: 0, w: "verharmlosen = to play down; only “versucht” fits the structure." },
  { s: 12, t: "Stil C2", q: "Welches Wort markiert Distanz zu einer Behauptung?", o: ["vermeintlich", "zweifellos", "eindeutig", "erwiesen"], a: 0, w: "vermeintlich = supposedly, marks distance." },
  { s: 12, t: "Register C2", q: "Welcher Satz gehört in eine wissenschaftliche Arbeit?", o: ["Es hat sich gezeigt, dass die Methode robust ist.", "Wir haben rausgefunden, dass die Methode echt gut ist.", "Die Methode ist der Hammer.", "Man sieht schon, dass das gut läuft."], a: 0, w: "Impersonal, precise, no colloquialisms." },
];
