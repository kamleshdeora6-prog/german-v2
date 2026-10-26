/* Deutsch Coach – "Erste Schritte / First steps": a picture course for people who know zero German.
   Hand-written (not generated). Every unit: words with a picture (emoji), a tip in English and short
   sentences to build from tiles. Nouns carry their article, because der/die/das has to be learnt with the word. */
window.DC = window.DC || {};
DC.starter = [
  { id: "hallo", icon: "👋", en: "Hello & goodbye", de: "Hallo & Tschüss",
    tip: "German has a friendly and a polite way to say most things. **Hallo** and **Tschüss** are friendly; **Guten Tag** and **Auf Wiedersehen** are polite – use them with people you don't know.",
    words: [
      ["Hallo", "hello", "👋"], ["Tschüss", "bye", "🙋"], ["Guten Morgen", "good morning", "🌅"], ["Guten Tag", "good day / hello (polite)", "🤝"],
      ["Guten Abend", "good evening", "🌆"], ["Gute Nacht", "good night", "🌙"], ["Auf Wiedersehen", "goodbye (polite)", "🚪"], ["Danke", "thank you", "🙏"],
      ["Bitte", "please / you're welcome", "😊"], ["Ja", "yes", "✅"], ["Nein", "no", "❌"], ["Entschuldigung", "sorry / excuse me", "🙇"],
    ],
    phrases: [["Hallo, wie geht's?", "Hello, how are you?"], ["Danke, gut!", "Thanks, good!"], ["Guten Morgen, Anna!", "Good morning, Anna!"], ["Vielen Dank!", "Thank you very much!"], ["Bis morgen!", "See you tomorrow!"]] },

  { id: "ich", icon: "🙂", en: "Me & you", de: "Ich & du",
    tip: "**ich** = I, **du** = you (a friend), **Sie** = you (polite, always with a capital S). The verb changes with the person: __ich bin__, __du bist__, __er ist__.",
    words: [
      ["ich", "I", "🙋"], ["du", "you (friend)", "👉"], ["er", "he", "👨"], ["sie", "she", "👩"], ["wir", "we", "👫"], ["Sie", "you (polite)", "🎩"],
      ["ich bin", "I am", "🧍"], ["du bist", "you are", "🫵"], ["ich heiße", "my name is", "📛"], ["der Name", "name", "🏷️"],
    ],
    phrases: [["Ich heiße Anna.", "My name is Anna."], ["Wie heißt du?", "What's your name?"], ["Ich bin Ravi.", "I am Ravi."], ["Wer bist du?", "Who are you?"], ["Freut mich!", "Nice to meet you!"]] },

  { id: "menschen", icon: "🧑", en: "People", de: "Menschen",
    tip: "Every German noun starts with a **capital letter** and has an article: **der** (masculine), **die** (feminine) or **das** (neuter). Learn them together: __der Mann__, __die Frau__, __das Kind__.",
    words: [
      ["der Mann", "man", "👨"], ["die Frau", "woman", "👩"], ["das Kind", "child", "🧒"], ["der Junge", "boy", "👦"], ["das Mädchen", "girl", "👧"],
      ["das Baby", "baby", "👶"], ["der Freund", "friend (m)", "🧑‍🤝‍🧑"], ["die Freundin", "friend (f)", "👭"], ["der Lehrer", "teacher (m)", "👨‍🏫"], ["die Ärztin", "doctor (f)", "👩‍⚕️"],
    ],
    phrases: [["Das ist ein Mann.", "That is a man."], ["Das ist eine Frau.", "That is a woman."], ["Das Kind ist klein.", "The child is small."], ["Er ist mein Freund.", "He is my friend."], ["Sie ist Ärztin.", "She is a doctor."]] },

  { id: "familie", icon: "👨‍👩‍👧", en: "Family", de: "Familie",
    tip: "**mein** = my: __mein Vater__ (der), but __meine Mutter__ (die) – feminine words get an extra **-e**.",
    words: [
      ["die Familie", "family", "👨‍👩‍👧‍👦"], ["die Mutter", "mother", "👩"], ["der Vater", "father", "👨"], ["die Eltern", "parents", "👫"], ["die Schwester", "sister", "👧"],
      ["der Bruder", "brother", "👦"], ["die Oma", "grandma", "👵"], ["der Opa", "grandpa", "👴"], ["der Sohn", "son", "👶"], ["die Tochter", "daughter", "👧"],
    ],
    phrases: [["Das ist meine Mutter.", "This is my mother."], ["Das ist mein Vater.", "This is my father."], ["Ich habe einen Bruder.", "I have a brother."], ["Meine Oma ist nett.", "My grandma is nice."], ["Hast du Geschwister?", "Do you have brothers and sisters?"]] },

  { id: "zahlen", icon: "🔢", en: "Numbers 0–12", de: "Zahlen",
    tip: "**ei** sounds like English \"eye\": __eins, zwei, drei__. **ie** sounds like \"ee\": __vier, sieben__.",
    words: [
      ["null", "zero", "0️⃣"], ["eins", "one", "1️⃣"], ["zwei", "two", "2️⃣"], ["drei", "three", "3️⃣"], ["vier", "four", "4️⃣"], ["fünf", "five", "5️⃣"],
      ["sechs", "six", "6️⃣"], ["sieben", "seven", "7️⃣"], ["acht", "eight", "8️⃣"], ["neun", "nine", "9️⃣"], ["zehn", "ten", "🔟"], ["zwölf", "twelve", "🕛"],
    ],
    phrases: [["Ich bin zwölf.", "I am twelve."], ["Ich habe zwei Kinder.", "I have two children."], ["Eins, zwei, drei!", "One, two, three!"], ["Das kostet fünf Euro.", "That costs five euros."]] },

  { id: "farben", icon: "🎨", en: "Colours", de: "Farben",
    tip: "Colours after **ist** never change: __Der Apfel ist rot.__ __Die Banane ist gelb.__",
    words: [
      ["rot", "red", "🟥"], ["blau", "blue", "🟦"], ["grün", "green", "🟩"], ["gelb", "yellow", "🟨"], ["schwarz", "black", "⬛"], ["weiß", "white", "⬜"],
      ["orange", "orange", "🟧"], ["braun", "brown", "🟫"], ["lila", "purple", "🟪"], ["rosa", "pink", "🌸"],
    ],
    phrases: [["Der Apfel ist rot.", "The apple is red."], ["Das Auto ist blau.", "The car is blue."], ["Die Banane ist gelb.", "The banana is yellow."], ["Meine Lieblingsfarbe ist grün.", "My favourite colour is green."]] },

  { id: "essen", icon: "🍎", en: "Food", de: "Essen",
    tip: "**Ich möchte …** = I would like … – the most useful sentence in a café: __Ich möchte ein Brot, bitte.__",
    words: [
      ["das Brot", "bread", "🍞"], ["der Apfel", "apple", "🍎"], ["die Banane", "banana", "🍌"], ["der Käse", "cheese", "🧀"], ["das Ei", "egg", "🥚"],
      ["die Pizza", "pizza", "🍕"], ["der Reis", "rice", "🍚"], ["das Fleisch", "meat", "🥩"], ["der Fisch", "fish", "🐟"], ["die Tomate", "tomato", "🍅"],
      ["der Kuchen", "cake", "🍰"], ["die Kartoffel", "potato", "🥔"],
    ],
    phrases: [["Ich möchte ein Brot, bitte.", "I would like a bread roll, please."], ["Ich esse einen Apfel.", "I am eating an apple."], ["Der Kuchen ist lecker.", "The cake is delicious."], ["Ich esse kein Fleisch.", "I don't eat meat."], ["Guten Appetit!", "Enjoy your meal!"]] },

  { id: "trinken", icon: "☕", en: "Drinks", de: "Getränke",
    tip: "German nouns with **das** are often things: __das Wasser__, __das Bier__. Kaffee and Tee are **der**.",
    words: [
      ["das Wasser", "water", "💧"], ["die Milch", "milk", "🥛"], ["der Kaffee", "coffee", "☕"], ["der Tee", "tea", "🍵"], ["der Saft", "juice", "🧃"],
      ["das Bier", "beer", "🍺"], ["der Wein", "wine", "🍷"], ["die Cola", "cola", "🥤"], ["das Glas", "glass", "🥃"], ["die Tasse", "cup", "☕"],
    ],
    phrases: [["Einen Kaffee, bitte.", "A coffee, please."], ["Ich trinke Tee.", "I drink tea."], ["Ein Glas Wasser, bitte.", "A glass of water, please."], ["Ich habe Durst.", "I am thirsty."], ["Prost!", "Cheers!"]] },

  { id: "tiere", icon: "🐶", en: "Animals", de: "Tiere",
    tip: "**der Hund** but **die Katze** – the article is part of the word. Tip: say it out loud every time: \"der Hund, der Hund\".",
    words: [
      ["der Hund", "dog", "🐶"], ["die Katze", "cat", "🐱"], ["der Vogel", "bird", "🐦"], ["das Pferd", "horse", "🐴"], ["die Kuh", "cow", "🐮"],
      ["die Maus", "mouse", "🐭"], ["der Bär", "bear", "🐻"], ["das Schwein", "pig", "🐷"], ["der Elefant", "elephant", "🐘"], ["der Affe", "monkey", "🐵"],
    ],
    phrases: [["Der Hund ist groß.", "The dog is big."], ["Die Katze ist klein.", "The cat is small."], ["Ich habe einen Hund.", "I have a dog."], ["Das ist ein Vogel.", "That is a bird."], ["Hast du eine Katze?", "Do you have a cat?"]] },

  { id: "haus", icon: "🏠", en: "At home", de: "Zu Hause",
    tip: "**Wo ist …?** = Where is …? – __Wo ist die Küche?__",
    words: [
      ["das Haus", "house", "🏠"], ["die Wohnung", "flat, apartment", "🏢"], ["die Tür", "door", "🚪"], ["das Fenster", "window", "🪟"], ["der Tisch", "table", "🪑"],
      ["der Stuhl", "chair", "💺"], ["das Bett", "bed", "🛏️"], ["die Lampe", "lamp", "💡"], ["die Küche", "kitchen", "🍳"], ["das Bad", "bathroom", "🛁"],
      ["das Sofa", "sofa", "🛋️"], ["der Schlüssel", "key", "🔑"],
    ],
    phrases: [["Wo ist die Küche?", "Where is the kitchen?"], ["Das Haus ist groß.", "The house is big."], ["Mein Bett ist bequem.", "My bed is comfortable."], ["Die Tür ist offen.", "The door is open."], ["Wo ist mein Schlüssel?", "Where is my key?"]] },

  { id: "koerper", icon: "🖐️", en: "Body", de: "Körper",
    tip: "**Ich habe …schmerzen** = my … hurts: __Ich habe Kopfschmerzen.__ (head + ache)",
    words: [
      ["der Kopf", "head", "🙆"], ["die Hand", "hand", "✋"], ["der Fuß", "foot", "🦶"], ["das Auge", "eye", "👁️"], ["die Nase", "nose", "👃"],
      ["der Mund", "mouth", "👄"], ["das Ohr", "ear", "👂"], ["das Bein", "leg", "🦵"], ["der Arm", "arm", "💪"], ["der Zahn", "tooth", "🦷"],
    ],
    phrases: [["Ich habe Kopfschmerzen.", "I have a headache."], ["Meine Hand tut weh.", "My hand hurts."], ["Ich bin krank.", "I am ill."], ["Ich brauche einen Arzt.", "I need a doctor."]] },

  { id: "kleidung", icon: "👕", en: "Clothes", de: "Kleidung",
    tip: "**Ich trage …** = I'm wearing …: __Ich trage eine Jacke.__ With **der** words, ein becomes **einen**: __Ich trage einen Hut.__",
    words: [
      ["das T-Shirt", "T-shirt", "👕"], ["die Hose", "trousers", "👖"], ["der Schuh", "shoe", "👟"], ["die Jacke", "jacket", "🧥"], ["das Kleid", "dress", "👗"],
      ["der Hut", "hat", "👒"], ["die Socke", "sock", "🧦"], ["der Schal", "scarf", "🧣"], ["die Brille", "glasses", "👓"], ["die Tasche", "bag", "👜"],
    ],
    phrases: [["Ich trage eine Jacke.", "I'm wearing a jacket."], ["Die Hose ist zu groß.", "The trousers are too big."], ["Das Kleid ist schön.", "The dress is beautiful."], ["Wo sind meine Schuhe?", "Where are my shoes?"]] },

  { id: "stadt", icon: "🚌", en: "Town & travel", de: "Stadt & Verkehr",
    tip: "**mit dem …** = by …: __mit dem Bus__, __mit dem Zug__, __mit dem Auto__. On foot = __zu Fuß__.",
    words: [
      ["das Auto", "car", "🚗"], ["der Bus", "bus", "🚌"], ["der Zug", "train", "🚆"], ["das Fahrrad", "bicycle", "🚲"], ["das Flugzeug", "plane", "✈️"],
      ["das Taxi", "taxi", "🚕"], ["der Bahnhof", "station", "🚉"], ["die Straße", "street", "🛣️"], ["die Bank", "bank", "🏦"], ["der Supermarkt", "supermarket", "🛒"],
      ["das Hotel", "hotel", "🏨"], ["die Apotheke", "pharmacy", "💊"],
    ],
    phrases: [["Wo ist der Bahnhof?", "Where is the station?"], ["Ich fahre mit dem Bus.", "I go by bus."], ["Ich gehe zu Fuß.", "I'm walking."], ["Ist das Hotel weit?", "Is the hotel far?"], ["Geradeaus und dann links.", "Straight on and then left."]] },

  { id: "wetter", icon: "☀️", en: "Weather", de: "Wetter",
    tip: "Weather sentences start with **Es**: __Es regnet.__ (It's raining.) __Es ist kalt.__ (It's cold.)",
    words: [
      ["die Sonne", "sun", "☀️"], ["der Regen", "rain", "🌧️"], ["der Schnee", "snow", "❄️"], ["der Wind", "wind", "💨"], ["die Wolke", "cloud", "☁️"],
      ["warm", "warm", "🌡️"], ["kalt", "cold", "🥶"], ["heiß", "hot", "🥵"], ["der Sommer", "summer", "🏖️"], ["der Winter", "winter", "⛄"],
    ],
    phrases: [["Es regnet.", "It's raining."], ["Es ist kalt.", "It's cold."], ["Die Sonne scheint.", "The sun is shining."], ["Im Sommer ist es heiß.", "In summer it's hot."], ["Wie ist das Wetter?", "What's the weather like?"]] },

  { id: "tun", icon: "🏃", en: "Doing things", de: "Was machst du?",
    tip: "Verbs end in **-en** in the dictionary (__spielen__ = to play). With **ich** they end in **-e**: __ich spiele__. With **du** in **-st**: __du spielst__.",
    words: [
      ["essen", "to eat", "🍽️"], ["trinken", "to drink", "🥤"], ["schlafen", "to sleep", "😴"], ["gehen", "to go, to walk", "🚶"], ["laufen", "to run", "🏃"],
      ["lesen", "to read", "📖"], ["schreiben", "to write", "✍️"], ["spielen", "to play", "⚽"], ["kochen", "to cook", "🍳"], ["arbeiten", "to work", "💼"],
      ["lernen", "to learn", "📚"], ["schwimmen", "to swim", "🏊"],
    ],
    phrases: [["Ich lerne Deutsch.", "I'm learning German."], ["Ich spiele Fußball.", "I play football."], ["Was machst du?", "What are you doing?"], ["Wir kochen heute.", "We're cooking today."], ["Er schläft.", "He's sleeping."]] },

  { id: "gefuehle", icon: "😊", en: "How are you?", de: "Wie geht's?",
    tip: "**Wie geht's?** = How are you? The answer: __Mir geht's gut.__ (I'm fine) or __Nicht so gut.__ (Not so good.)",
    words: [
      ["gut", "good", "👍"], ["schlecht", "bad", "👎"], ["glücklich", "happy", "😊"], ["traurig", "sad", "😢"], ["müde", "tired", "🥱"],
      ["krank", "ill", "🤒"], ["hungrig", "hungry", "🤤"], ["groß", "big, tall", "🦒"], ["klein", "small", "🐜"], ["schön", "beautiful, nice", "🌷"],
    ],
    phrases: [["Wie geht's?", "How are you?"], ["Mir geht's gut.", "I'm fine."], ["Ich bin müde.", "I'm tired."], ["Ich habe Hunger.", "I'm hungry."], ["Das ist schön!", "That's nice!"]] },

  { id: "zeit", icon: "🕐", en: "Days & time", de: "Tage & Zeit",
    tip: "Days are all **der** and are used with **am**: __am Montag__ = on Monday.",
    words: [
      ["heute", "today", "📍"], ["morgen", "tomorrow", "➡️"], ["gestern", "yesterday", "⬅️"], ["der Tag", "day", "🌞"], ["die Woche", "week", "📅"],
      ["der Montag", "Monday", "1️⃣"], ["der Freitag", "Friday", "🎉"], ["der Sonntag", "Sunday", "🛌"], ["die Uhr", "clock; o'clock", "🕐"], ["jetzt", "now", "⏱️"],
    ],
    phrases: [["Heute ist Montag.", "Today is Monday."], ["Wie spät ist es?", "What time is it?"], ["Es ist drei Uhr.", "It's three o'clock."], ["Bis Freitag!", "See you on Friday!"], ["Am Sonntag schlafe ich lange.", "On Sunday I sleep in."]] },

  { id: "hilfe", icon: "🆘", en: "Survival phrases", de: "Wichtige Sätze",
    tip: "Three sentences that save you anywhere: __Ich verstehe nicht.__ __Langsam, bitte.__ __Sprechen Sie Englisch?__",
    words: [
      ["Ich verstehe nicht.", "I don't understand.", "🤷"], ["Langsam, bitte.", "Slowly, please.", "🐢"], ["Noch einmal, bitte.", "Again, please.", "🔁"],
      ["Sprechen Sie Englisch?", "Do you speak English?", "🇬🇧"], ["Wie viel kostet das?", "How much is that?", "💶"], ["Wo ist die Toilette?", "Where is the toilet?", "🚻"],
      ["Ich spreche ein bisschen Deutsch.", "I speak a little German.", "🤏"], ["Hilfe!", "Help!", "🆘"], ["Ich komme aus Indien.", "I come from India.", "🌏"], ["Kein Problem.", "No problem.", "👌"],
    ],
    phrases: [["Ich verstehe nicht.", "I don't understand."], ["Sprechen Sie Englisch?", "Do you speak English?"], ["Wie viel kostet das?", "How much does that cost?"], ["Ich spreche ein bisschen Deutsch.", "I speak a little German."], ["Wo ist die Toilette, bitte?", "Where is the toilet, please?"]] },
];
