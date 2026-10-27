/* Deutsch Coach – guided conversations: the speaking partner that needs no AI model.
   Each scenario: the partner's lines in order (German + English) and example answers ("ideas").
   The learner answers freely (spoken or typed); Max's rules check the German. Hand-written, so the
   partner's German is always correct and always at the right level. */
window.DC = window.DC || {};
DC.dialogues = {
  intro: [
    { de: "Hallo! Ich bin Anna, deine neue Nachbarin. Wie heißt du?", en: "Hello! I'm Anna, your new neighbour. What's your name?", ideas: ["Hallo Anna! Ich heiße Ravi.", "Ich bin Sohan. Freut mich!"] },
    { de: "Freut mich! Woher kommst du?", en: "Nice to meet you! Where are you from?", ideas: ["Ich komme aus Indien, aus Mumbai.", "Ich komme aus der Türkei."] },
    { de: "Interessant! Und was machst du beruflich?", en: "Interesting! And what do you do for a living?", ideas: ["Ich bin Lehrer.", "Ich arbeite als Ingenieurin bei einer Firma."] },
    { de: "Wie lange wohnst du schon hier?", en: "How long have you lived here?", ideas: ["Ich wohne seit zwei Monaten hier.", "Erst seit einer Woche."] },
    { de: "Was machst du gern in deiner Freizeit?", en: "What do you like doing in your free time?", ideas: ["Ich lese gern und ich spiele Cricket.", "Ich koche gern und gehe oft spazieren."] },
    { de: "Schön! Möchtest du am Samstag mit uns Kaffee trinken?", en: "Nice! Would you like to have coffee with us on Saturday?", ideas: ["Ja, gern! Um wie viel Uhr?", "Leider kann ich am Samstag nicht."] },
  ],
  cafe: [
    { de: "Guten Tag! Was darf es sein?", en: "Hello! What can I get you?", ideas: ["Ich hätte gern einen Kaffee, bitte.", "Einen Tee mit Milch, bitte."] },
    { de: "Gern. Möchten Sie den Kaffee mit Milch und Zucker?", en: "Sure. Would you like the coffee with milk and sugar?", ideas: ["Mit Milch, aber ohne Zucker, bitte.", "Nur schwarz, bitte."] },
    { de: "Wir haben heute frischen Apfelkuchen. Möchten Sie ein Stück?", en: "We have fresh apple cake today. Would you like a piece?", ideas: ["Ja, gern! Was kostet der Kuchen?", "Nein danke, nur den Kaffee."] },
    { de: "Ein Stück kostet drei Euro fünfzig. Essen Sie hier oder nehmen Sie es mit?", en: "A piece costs three fifty. Eating in or taking away?", ideas: ["Ich esse hier.", "Zum Mitnehmen, bitte."] },
    { de: "Alles klar. Das macht zusammen sechs Euro zwanzig.", en: "All right. That's six twenty altogether.", ideas: ["Kann ich mit Karte zahlen?", "Hier sind sieben Euro. Stimmt so."] },
    { de: "Natürlich. Vielen Dank und einen schönen Tag noch!", en: "Of course. Thank you and have a nice day!", ideas: ["Danke, Ihnen auch!", "Tschüss, bis zum nächsten Mal!"] },
  ],
  shop: [
    { de: "Guten Tag! Kann ich Ihnen helfen?", en: "Hello! Can I help you?", ideas: ["Ja, bitte. Wo finde ich den Reis?", "Ich suche Milch."] },
    { de: "Der Reis ist im dritten Gang, links. Brauchen Sie noch etwas?", en: "The rice is in the third aisle, on the left. Do you need anything else?", ideas: ["Ja, haben Sie auch frisches Brot?", "Nein, danke. Das ist alles."] },
    { de: "Das Brot ist dort hinten bei der Bäckerei. Welches Brot möchten Sie?", en: "The bread is back there at the bakery counter. Which bread would you like?", ideas: ["Ein Vollkornbrot, bitte.", "Ich nehme vier Brötchen."] },
    { de: "Die Tomaten sind heute im Angebot. Möchten Sie welche?", en: "The tomatoes are on offer today. Would you like some?", ideas: ["Ja, ein Kilo, bitte. Was kosten sie?", "Nein danke, ich habe noch Tomaten."] },
    { de: "Ein Kilo kostet zwei Euro. Brauchen Sie eine Tüte?", en: "A kilo is two euros. Do you need a bag?", ideas: ["Nein, ich habe eine Tasche dabei.", "Ja, bitte. Was kostet eine Tüte?"] },
    { de: "Gut. Die Kasse ist dort vorne. Schönen Tag noch!", en: "Good. The checkout is up front. Have a nice day!", ideas: ["Vielen Dank für Ihre Hilfe!", "Danke, gleichfalls!"] },
  ],
  way: [
    { de: "Hallo! Sie sehen ein bisschen verloren aus. Suchen Sie etwas?", en: "Hello! You look a little lost. Are you looking for something?", ideas: ["Ja, wie komme ich zum Bahnhof?", "Entschuldigung, wo ist die Post?"] },
    { de: "Zum Bahnhof? Gehen Sie hier geradeaus bis zur Ampel. Wissen Sie, wo die Ampel ist?", en: "To the station? Go straight on here to the traffic lights. Do you know where the lights are?", ideas: ["Ja, dort vorne, oder?", "Nein, ist das weit?"] },
    { de: "Nein, nur zweihundert Meter. An der Ampel gehen Sie nach rechts. Fahren Sie mit dem Zug?", en: "No, only two hundred metres. At the lights turn right. Are you taking the train?", ideas: ["Ja, ich fahre nach Hamburg.", "Nein, ich hole meine Freundin ab."] },
    { de: "Dann gehen Sie weiter bis zur Kirche. Der Bahnhof ist gegenüber der Kirche. Ist das klar?", en: "Then keep going to the church. The station is opposite the church. Is that clear?", ideas: ["Also geradeaus, dann rechts bis zur Kirche?", "Können Sie das bitte wiederholen?"] },
    { de: "Genau! Zu Fuß sind es ungefähr zehn Minuten. Haben Sie es eilig?", en: "Exactly! On foot it's about ten minutes. Are you in a hurry?", ideas: ["Ja, mein Zug fährt in zwanzig Minuten.", "Nein, ich habe Zeit."] },
    { de: "Dann schaffen Sie es locker. Gute Reise!", en: "Then you'll easily make it. Have a good trip!", ideas: ["Vielen Dank für Ihre Hilfe!", "Danke schön, tschüss!"] },
  ],
  doctor: [
    { de: "Praxis Dr. Weber, guten Morgen. Was kann ich für Sie tun?", en: "Dr Weber's practice, good morning. What can I do for you?", ideas: ["Guten Morgen, ich brauche einen Termin.", "Ich bin krank und möchte zum Arzt."] },
    { de: "Was haben Sie denn für Beschwerden?", en: "What symptoms do you have?", ideas: ["Ich habe Kopfschmerzen und Fieber.", "Mein Hals tut weh."] },
    { de: "Seit wann haben Sie die Beschwerden?", en: "Since when have you had the symptoms?", ideas: ["Seit zwei Tagen.", "Seit gestern Abend."] },
    { de: "Können Sie heute um elf Uhr kommen?", en: "Can you come today at eleven?", ideas: ["Ja, um elf Uhr passt gut.", "Leider nicht. Geht es auch am Nachmittag?"] },
    { de: "Gut. Bringen Sie bitte Ihre Versichertenkarte mit. Sind Sie bei uns schon Patient?", en: "Good. Please bring your health insurance card. Are you already a patient with us?", ideas: ["Nein, ich komme zum ersten Mal.", "Ja, ich war letztes Jahr schon hier."] },
    { de: "Alles klar. Trinken Sie viel und ruhen Sie sich aus. Bis später!", en: "All right. Drink a lot and get some rest. See you later!", ideas: ["Vielen Dank, bis später!", "Danke, auf Wiederhören!"] },
  ],
  flat: [
    { de: "Herzlich willkommen! Das ist die Wohnung. Wie gefällt sie Ihnen?", en: "Welcome! This is the flat. How do you like it?", ideas: ["Sie ist sehr hell und schön.", "Die Küche gefällt mir gut."] },
    { de: "Die Wohnung hat zwei Zimmer, eine Küche und ein Bad. Wie viele Personen ziehen ein?", en: "The flat has two rooms, a kitchen and a bathroom. How many people are moving in?", ideas: ["Nur ich. Ich wohne allein.", "Meine Frau und ich."] },
    { de: "Die Kaltmiete ist 750 Euro. Haben Sie Fragen zur Miete?", en: "The basic rent is 750 euros. Do you have questions about the rent?", ideas: ["Wie hoch sind die Nebenkosten?", "Ist die Kaution drei Monatsmieten?"] },
    { de: "Die Nebenkosten sind 180 Euro im Monat. Was arbeiten Sie?", en: "The utilities are 180 euros a month. What is your job?", ideas: ["Ich arbeite als Ingenieur bei Siemens.", "Ich bin Student und arbeite nebenbei."] },
    { de: "Die Wohnung ist ab dem ersten Dezember frei. Passt Ihnen das?", en: "The flat is free from the first of December. Does that suit you?", ideas: ["Ja, das passt sehr gut.", "Geht es auch erst ab Januar?"] },
    { de: "Gut. Ich schicke Ihnen die Unterlagen per E-Mail. Haben Sie noch eine Frage?", en: "Good. I'll send you the documents by email. Do you have another question?", ideas: ["Darf ich ein Haustier haben?", "Nein, vielen Dank für die Besichtigung!"] },
  ],
  weekend: [
    { de: "Guten Morgen! Wie war dein Wochenende?", en: "Good morning! How was your weekend?", ideas: ["Es war sehr schön, danke!", "Ganz gut, aber zu kurz."] },
    { de: "Was hast du am Samstag gemacht?", en: "What did you do on Saturday?", ideas: ["Am Samstag habe ich eingekauft und gekocht.", "Ich bin mit Freunden in die Stadt gefahren."] },
    { de: "Und am Sonntag? Hast du dich ausgeruht?", en: "And on Sunday? Did you relax?", ideas: ["Ja, ich habe lange geschlafen.", "Nein, ich habe den ganzen Tag gelernt."] },
    { de: "Ich war am Sonntag im Kino. Wann warst du zuletzt im Kino?", en: "I was at the cinema on Sunday. When were you last at the cinema?", ideas: ["Ich war letzten Monat im Kino.", "Das ist schon lange her."] },
    { de: "Hast du schon Pläne für das nächste Wochenende?", en: "Do you already have plans for next weekend?", ideas: ["Ja, ich besuche meine Familie.", "Noch nicht. Hast du eine Idee?"] },
    { de: "Klingt gut! So, jetzt müssen wir arbeiten. Bis später!", en: "Sounds good! Right, now we have to work. See you later!", ideas: ["Bis später!", "Ja, leider. Bis zur Mittagspause!"] },
  ],
  plan: [
    { de: "Hallo! Nächste Woche hat Maria Geburtstag. Wollen wir zusammen eine kleine Party planen?", en: "Hi! Maria has her birthday next week. Shall we plan a little party together?", ideas: ["Ja, gute Idee! Wann wollen wir feiern?", "Gern! Wie wäre es mit Samstag?"] },
    { de: "Ich schlage Freitagabend vor. Was meinst du?", en: "I suggest Friday evening. What do you think?", ideas: ["Freitag passt mir gut, ab sieben Uhr.", "Freitag kann ich leider nicht. Wie wäre es mit Samstag?"] },
    { de: "Okay. Wo sollen wir feiern – bei mir oder in einem Restaurant?", en: "Okay. Where should we celebrate – at my place or in a restaurant?", ideas: ["Bei dir, das ist gemütlicher und billiger.", "Lieber im Restaurant, dann haben wir keine Arbeit."] },
    { de: "Gut. Was machen wir mit dem Essen?", en: "Good. What do we do about the food?", ideas: ["Ich kann einen Salat und einen Kuchen mitbringen.", "Wir könnten Pizza bestellen."] },
    { de: "Und das Geschenk? Hast du eine Idee?", en: "And the present? Do you have an idea?", ideas: ["Wie wäre es mit einem Gutschein für ein Konzert?", "Wir könnten ihr ein Buch schenken."] },
    { de: "Super. Also: Wer kümmert sich um was?", en: "Great. So: who takes care of what?", ideas: ["Ich kaufe das Geschenk, und du lädst die Gäste ein.", "Du machst die Musik, ich kümmere mich um das Essen."] },
  ],
  job: [
    { de: "Guten Tag und herzlich willkommen! Erzählen Sie bitte kurz etwas über sich.", en: "Hello and welcome! Please tell me a little about yourself.", ideas: ["Ich heiße Ravi Sharma und bin Ingenieur.", "Ich komme aus Indien und lebe seit zwei Jahren in Berlin."] },
    { de: "Welche Berufserfahrung haben Sie?", en: "What work experience do you have?", ideas: ["Ich habe fünf Jahre als Softwareentwickler gearbeitet.", "Nach dem Studium habe ich bei einer Bank gearbeitet."] },
    { de: "Was sind Ihre Stärken?", en: "What are your strengths?", ideas: ["Ich arbeite gern im Team und bin zuverlässig.", "Ich lerne schnell und bin sehr genau."] },
    { de: "Warum möchten Sie bei uns arbeiten?", en: "Why would you like to work for us?", ideas: ["Ihre Firma hat einen sehr guten Ruf.", "Weil ich mich für Ihre Produkte interessiere."] },
    { de: "Wie gut ist Ihr Deutsch? Sprechen Sie noch andere Sprachen?", en: "How good is your German? Do you speak other languages?", ideas: ["Ich lerne Deutsch und mache bald die B1-Prüfung.", "Ich spreche Englisch, Hindi und ein bisschen Deutsch."] },
    { de: "Vielen Dank. Haben Sie noch Fragen an uns?", en: "Thank you. Do you have any questions for us?", ideas: ["Wie sehen die Arbeitszeiten aus?", "Gibt es die Möglichkeit, im Homeoffice zu arbeiten?"] },
  ],
  office: [
    { de: "Guten Tag. Bitte setzen Sie sich. Was ist Ihr Anliegen?", en: "Hello. Please take a seat. How can I help?", ideas: ["Guten Tag, ich möchte mich anmelden.", "Ich bin umgezogen und möchte meine neue Adresse melden."] },
    { de: "Haben Sie einen Termin?", en: "Do you have an appointment?", ideas: ["Ja, um zehn Uhr.", "Nein, leider nicht. Geht es trotzdem?"] },
    { de: "Ich brauche Ihren Pass und die Wohnungsgeberbestätigung.", en: "I need your passport and the landlord's confirmation.", ideas: ["Hier ist mein Pass. Was ist eine Wohnungsgeberbestätigung?", "Können Sie mir sagen, woher ich dieses Formular bekomme?"] },
    { de: "Die Bestätigung bekommen Sie von Ihrem Vermieter. Wann sind Sie eingezogen?", en: "You get the confirmation from your landlord. When did you move in?", ideas: ["Ich bin am ersten Oktober eingezogen.", "Vor zwei Wochen."] },
    { de: "Gut. Wohnen noch andere Personen in der Wohnung?", en: "Good. Do other people live in the flat?", ideas: ["Ja, meine Frau und meine Tochter.", "Nein, ich wohne allein."] },
    { de: "Alles erledigt. Hier ist Ihre Meldebescheinigung. Haben Sie noch Fragen?", en: "All done. Here is your registration certificate. Any other questions?", ideas: ["Wissen Sie, wann ich meine Steuer-ID bekomme?", "Nein, vielen Dank für Ihre Hilfe!"] },
  ],
  debate: [
    { de: "Viele Firmen holen ihre Mitarbeiter aus dem Homeoffice zurück. Wie finden Sie das?", en: "Many companies are bringing staff back from working at home. What do you think?", ideas: ["Meiner Meinung nach ist eine Mischung am besten.", "Das finde ich falsch, weil man zu Hause konzentrierter arbeitet."] },
    { de: "Ich sehe das anders: Im Büro arbeitet man besser im Team. Was sagen Sie dazu?", en: "I see it differently: in the office people work better as a team. What do you say?", ideas: ["Das stimmt zum Teil, aber Videokonferenzen funktionieren auch gut.", "Da bin ich anderer Meinung, denn man kann auch online gut zusammenarbeiten."] },
    { de: "Und was ist mit jungen Mitarbeitern, die noch viel lernen müssen?", en: "And what about young employees who still have a lot to learn?", ideas: ["Für sie ist das Büro wichtig, das gebe ich zu.", "Sie könnten zwei Tage pro Woche im Büro sein."] },
    { de: "Welche Vorteile hat das Homeoffice für Sie persönlich?", en: "What advantages does working from home have for you personally?", ideas: ["Ich spare jeden Tag eine Stunde Fahrzeit.", "Ich kann meine Zeit freier einteilen."] },
    { de: "Gibt es auch Nachteile?", en: "Are there disadvantages too?", ideas: ["Ja, man fühlt sich manchmal allein.", "Einerseits ist es bequem, andererseits trennt man Arbeit und Freizeit schlechter."] },
    { de: "Können wir uns auf einen Kompromiss einigen?", en: "Can we agree on a compromise?", ideas: ["Ja: drei Tage Büro, zwei Tage Homeoffice.", "Ich schlage vor, dass jedes Team selbst entscheidet."] },
  ],
  free: [
    { de: "Hallo! Schön, dass du da bist. Wie geht es dir heute?", en: "Hi! Nice that you're here. How are you today?", ideas: ["Mir geht es gut, danke. Und dir?", "Ich bin ein bisschen müde."] },
    { de: "Was hast du heute schon gemacht?", en: "What have you done today so far?", ideas: ["Ich habe gearbeitet und Deutsch gelernt.", "Ich war einkaufen."] },
    { de: "Was machst du heute Abend?", en: "What are you doing this evening?", ideas: ["Ich koche und sehe einen Film.", "Ich treffe Freunde."] },
    { de: "Warum lernst du Deutsch?", en: "Why are you learning German?", ideas: ["Ich lerne Deutsch, weil ich in Deutschland arbeite.", "Für meine Familie und für die Prüfung."] },
    { de: "Was ist für dich am schwierigsten beim Deutschlernen?", en: "What is the hardest thing for you when learning German?", ideas: ["Die Artikel sind sehr schwierig.", "Das Sprechen ist am schwierigsten."] },
    { de: "Toll, dass du jeden Tag übst! Worauf freust du dich diese Woche?", en: "Great that you practise every day! What are you looking forward to this week?", ideas: ["Ich freue mich auf das Wochenende.", "Ich freue mich auf meinen Deutschkurs."] },
  ],
};
DC.dialogueReactions = ["Schön!", "Ah, verstehe.", "Interessant!", "Super!", "Okay.", "Gut.", "Aha!", "Toll!"];
