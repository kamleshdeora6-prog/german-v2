import { loadJsonData } from './core/loader.js';
import { normalizeText, normalizePassageItem, normalizeVocabItem, normalizeFlashcardItem, normalizeConjugationItem, normalizeExerciseItem, normalizeSentenceBank, normalizeLidQuestion as normalizeLidQuestionExternal } from './core/normalize.js';
import { compareAnswerLoose, compareAnswerStrict } from './core/grading.js';

const LS_KEY='german_coach_v14';
const BASE_URL=new URL('./', window.location.href);
const DATA_FILES=['passages','notes','exercises','flashcards','conjugation','sentences','vocab','lid','verbs'];
const STORE_DEFAULT={theme:'theme-focus',lang:'de',missionPreset:'medium',missionCustom:{passages:2,exercises:20,vocab:12,writing:2},daily:{},streak:0,lastActive:'',xp:0,countRepeats:false,weak:{},difficultWords:[],reviewQueue:[],lastSection:'practice',lastPractice:'exercises',lastPracticeGroup:'grammar',dataHealth:{loaded:false,missing:[]},onboardingDone:false,goal:'b1_exam',focusTopic:'prepositions',confidenceLevel:'A2',soundOn:true,achievements:[]};
let LID_QUESTIONS=[];
const state={data:{passages:[],notes:{},exercises:[],flashcards:[],conjugation:[],verbs:[],sentences:{},vocab:[],lid:[]},section:'practice',practice:'exercises',practiceGroup:'grammar',vocabMode:'list',examMode:'cefr',speech:null,currentExercise:null,currentPassage:null,currentListen:null,currentStructure:null,currentWriting:null,currentFlash:null,flashFront:true,currentConj:null,currentExam:null,currentQA:null,currentPhoto:null,currentLid:null,currentFixed:null,currentTopicFlow:null,currentRevision:null,revisionPool:[]};
const WRITING_TASKS=[{"key": "formal_email", "title_en": "Formal email", "title_de": "Formelle E-Mail", "prompt_en": "Write a short formal email asking for an appointment.", "prompt_de": "Schreibe eine kurze formelle E-Mail und bitte um einen Termin.", "sample": "Sehr geehrte Damen und Herren,\nich möchte gern einen Termin vereinbaren. Hätten Sie nächste Woche Zeit?\nMit freundlichen Grüßen\n..."}, {"key": "complaint", "title_en": "Complaint", "title_de": "Beschwerde", "prompt_en": "Write a short complaint about a problem in your apartment building.", "prompt_de": "Schreibe eine kurze Beschwerde über ein Problem im Haus.", "sample": "Sehr geehrte Frau ...,\nleider ist es im Treppenhaus oft sehr laut. Könnten Sie bitte darauf achten?\nMit freundlichen Grüßen\n..."}, {"key": "photo", "title_en": "Photo description", "title_de": "Bildbeschreibung", "prompt_en": "Describe the picture in 5–6 sentences.", "prompt_de": "Beschreibe das Bild in 5–6 Sätzen.", "sample": "Auf dem Bild sehe ich ... Im Vordergrund ... Im Hintergrund ... Meiner Meinung nach ..."}];
const PHOTO_TASKS=[
  {title_en:"Beach friends",title_de:"Freunde am Strand",src:"assets/photo_beach_friends.jpg",prompt_en:"Describe the beach scene in 5–7 sentences and mention what the people are doing.",prompt_de:"Beschreibe die Strandszene in 5–7 Sätzen und erkläre, was die Personen machen.",sample_de:"Auf dem Bild sehe ich mehrere junge Leute am Strand. Sie sitzen zusammen und trinken etwas. Die Stimmung wirkt entspannt und fröhlich. Im Hintergrund sieht man das Meer und den Himmel. Vielleicht machen die Freunde Urlaub. Meiner Meinung nach genießen sie den Abend zusammen.",sample_en:"In the picture I can see several young people on the beach. They are sitting together and having drinks. The atmosphere looks relaxed and cheerful. In the background you can see the sea and the sky. Maybe the friends are on holiday. In my opinion they are enjoying the evening together."},
  {title_en:"Beach holiday",title_de:"Urlaub am Meer",src:"assets/photo_beach_holiday.jpg",prompt_en:"Describe the holiday photo and say how the atmosphere looks.",prompt_de:"Beschreibe das Urlaubsfoto und sage, wie die Atmosphäre wirkt.",sample_de:"Auf dem Bild liegen zwei Personen am Strand auf Liegen. Vor ihnen sieht man das Meer. Es ist sonnig und ruhig. Die Menschen erholen sich und lesen vielleicht etwas. Die Atmosphäre ist sehr friedlich. Ich denke, dass sie einen entspannten Urlaub machen.",sample_en:"In the picture two people are lying on deckchairs on the beach. In front of them you can see the sea. It is sunny and calm. The people are relaxing and perhaps reading something. The atmosphere is very peaceful. I think they are having a relaxing holiday."},
  {title_en:"Picnic in the park",title_de:"Picknick im Park",src:"assets/photo_picnic_park.jpg",prompt_en:"Describe the picnic photo and mention what the group may be talking about.",prompt_de:"Beschreibe das Picknickfoto und nenne, worüber die Gruppe vielleicht spricht.",sample_de:"Auf dem Bild sehe ich vier Personen auf einer Decke im Park. Sie essen zusammen und lachen. Auf der Decke liegen verschiedene Lebensmittel. Das Wetter scheint schön zu sein. Wahrscheinlich sprechen sie über ihren Alltag oder ihre Pläne. Das Bild wirkt freundlich und gemütlich.",sample_en:"In the picture I can see four people on a blanket in the park. They are eating together and laughing. There is different food on the blanket. The weather seems nice. They are probably talking about everyday life or their plans. The picture looks friendly and cosy."},
  {title_en:"Family dinner",title_de:"Familienessen",src:"assets/photo_family_dinner.jpg",prompt_en:"Describe the family dinner and explain the atmosphere at the table.",prompt_de:"Beschreibe das Familienessen und erkläre die Stimmung am Tisch.",sample_de:"Auf dem Bild sitzt eine Familie zusammen am Tisch. Alle essen gemeinsam und unterhalten sich. In der Mitte des Tisches stehen viele Speisen. Die Atmosphäre wirkt warm und familiär. Vielleicht feiern sie einen besonderen Anlass. Ich finde, das Bild zeigt ein harmonisches Familienleben.",sample_en:"In the picture a family is sitting together at the table. Everyone is eating together and talking. In the middle of the table there are many dishes. The atmosphere looks warm and familiar. Maybe they are celebrating a special occasion. I think the picture shows a harmonious family life."},
  {title_en:"Shopping day",title_de:"Einkaufstag",src:"assets/photo_shopping.jpg",prompt_en:"Describe the shopping photo and say what the people might have bought.",prompt_de:"Beschreibe das Einkaufsfoto und sage, was die Personen vielleicht gekauft haben.",sample_de:"Auf dem Bild sehe ich eine Familie in einem Einkaufszentrum. Die Eltern und das Kind tragen Einkaufstaschen. Sie sehen zufrieden und fröhlich aus. Im Hintergrund erkennt man mehrere Geschäfte. Vielleicht haben sie Kleidung oder Geschenke gekauft. Die Szene wirkt modern und lebendig.",sample_en:"In the picture I can see a family in a shopping centre. The parents and the child are carrying shopping bags. They look satisfied and happy. In the background you can see several shops. Maybe they bought clothes or presents. The scene looks modern and lively."},
  {title_en:"Office work",title_de:"Arbeit im Büro",src:"assets/photo_office_work.jpg",prompt_en:"Describe the office photo and explain what the man might be doing.",prompt_de:"Beschreibe das Bürofoto und erkläre, was der Mann vielleicht macht.",sample_de:"Auf dem Bild sehe ich einen Mann in einem Büro. Er sitzt vor einem Laptop und telefoniert. Auf dem Tisch liegen Unterlagen und Notizen. Der Mann wirkt freundlich und konzentriert. Vielleicht spricht er mit einem Kunden oder Kollegen. Das Bild zeigt eine typische Arbeitssituation im Büro.",sample_en:"In the picture I can see a man in an office. He is sitting in front of a laptop and talking on the phone. On the desk there are documents and notes. The man looks friendly and focused. Maybe he is speaking with a customer or a colleague. The picture shows a typical office work situation."}
];

const CASE_DRILLS=[
  {level:'A1',topic:'nominative',prompt_de:'___ Mann arbeitet heute im Büro.',choices:['Der','Den','Dem','Des'],answer:'Der',reason_de:'"der Mann" ist das Subjekt. Subjekte stehen im Nominativ. Maskulin Nominativ = der.',reason_en:'"der Mann" is the subject, so use nominative. Masculine nominative = der.'},
  {level:'A1',topic:'accusative',prompt_de:'Ich sehe ___ Mann im Park.',choices:['der','den','dem','des'],answer:'den',reason_de:'"sehen" braucht ein direktes Objekt. Direktes Objekt = Akkusativ. Maskulin Akkusativ = den.',reason_en:'"sehen" takes a direct object. Direct object = accusative. Masculine accusative = den.'},
  {level:'A1',topic:'dative',prompt_de:'Ich helfe ___ Mann.',choices:['der','den','dem','des'],answer:'dem',reason_de:'"helfen" verlangt den Dativ. Maskulin Dativ = dem.',reason_en:'"helfen" requires dative. Masculine dative = dem.'},
  {level:'A2',topic:'movement_vs_location',prompt_de:'Ich gehe in ___ Schule.',choices:['die','der','dem','den'],answer:'die',reason_de:'"gehen" zeigt Bewegung wohin? → Akkusativ. "die Schule" wird im Akkusativ zu "in die Schule".',reason_en:'"gehen" shows movement (where to?) so use accusative. "die Schule" becomes "in die Schule".'},
  {level:'A2',topic:'movement_vs_location',prompt_de:'Ich bin in ___ Schule.',choices:['die','der','dem','den'],answer:'der',reason_de:'"sein" zeigt einen Ort wo? → Dativ. Femininer Dativ = der.',reason_en:'"sein" shows location (where?) so use dative. Feminine dative = der.'},
  {level:'A2',topic:'possessive',prompt_de:'Das ist ___ Buch.',choices:['mein','meine','meinen','meinem'],answer:'mein',reason_de:'"Buch" ist Neutrum im Nominativ. Nach "ist" steht hier Nominativ: mein Buch.',reason_en:'"Buch" is neuter nominative here. After "ist" use nominative: mein Buch.'},
  {level:'A2',topic:'separable_verbs',prompt_de:'Ich ___ morgen früh ___ .',choices:['stehe / auf','aufstehe /','stehe / an','bin / aufgestanden'],answer:'stehe / auf',reason_de:'"aufstehen" ist trennbar. Im Hauptsatz steht das Verb an Position 2 und die Vorsilbe am Ende: Ich stehe ... auf.',reason_en:'"aufstehen" is separable. In a main clause the verb is in position 2 and the prefix goes to the end.'},
  {level:'B1',topic:'perfect',prompt_de:'Gestern ___ ich früh ___ .',choices:['habe / aufgestanden','bin / aufgestanden','habe / gestanden auf','bin / stehen auf'],answer:'bin / aufgestanden',reason_de:'"aufstehen" bildet das Perfekt mit "sein". Das Partizip ist "aufgestanden".',reason_en:'"aufstehen" forms the perfect with "sein". The participle is "aufgestanden".'},
  {level:'B1',topic:'verb_preposition',prompt_de:'Ich warte ___ den Bus.',choices:['für','auf','mit','zu'],answer:'auf',reason_de:'Das Verb heißt "warten auf" + Akkusativ. Deshalb: auf den Bus.',reason_en:'The verb pattern is "warten auf" + accusative. Therefore: auf den Bus.'},
  {level:'B1',topic:'subordinate_clause',prompt_de:'Ich lerne viel, weil ich die Prüfung ___ .',choices:['bestehe','bestehen will','will bestehen','bestanden'],answer:'bestehen will',reason_de:'In einem Nebensatz steht das konjugierte Verb am Ende. Hier kommt die Verbgruppe ans Satzende: weil ich die Prüfung bestehen will.',reason_en:'In a subordinate clause the finite verb goes to the end. Here the verb group ends the clause.'},
  {level:'B2',topic:'adjective_endings',prompt_de:'Wir trinken kalten Kaffee aus ___ alten Tasse.',choices:['der','die','dem','den'],answer:'der',reason_de:'Nach "aus" steht Dativ. "Tasse" ist feminin, deshalb: aus der alten Tasse.',reason_en:'"aus" takes dative. "Tasse" is feminine, therefore: aus der alten Tasse.'},
  {level:'B2',topic:'case_reasoning',prompt_de:'Ich gebe ___ neuen Kollegen die Unterlagen.',choices:['der','den','dem','des'],answer:'dem',reason_de:'"geben" hat oft Dativ + Akkusativ. Der Empfänger ist Dativ: dem neuen Kollegen. Die Unterlagen sind Akkusativ.',reason_en:'"geben" often takes dative + accusative. The receiver is dative: dem neuen Kollegen.'}
];

const RAW_LID=[{"q": "What is the German constitution called?", "choices": ["Das Grundgesetz", "Die Bundesordnung", "Das Reichsgesetz"], "a": 0, "ex": "Germany's constitution is called the Grundgesetz."}, {"q": "Who elects the Bundestag?", "choices": ["The Länder governments", "Citizens with voting rights", "Only the Federal President"], "a": 1, "ex": "Citizens elect the Bundestag in democratic elections."}, {"q": "What is forbidden in a democracy?", "choices": ["Election fraud", "Different opinions", "Peaceful criticism"], "a": 0, "ex": "Election fraud damages free democratic elections."}, {"q": "What do you do in an election?", "choices": ["You vote secretly", "You show your ballot publicly", "You ask the police to decide"], "a": 0, "ex": "Voting is secret."}, {"q": "Why are several parties important?", "choices": ["So one party controls everything", "So different opinions can be represented", "So elections become unnecessary"], "a": 1, "ex": "Pluralism allows different political positions."}, {"q": "What does freedom of the press mean?", "choices": ["Newspapers need permission from one party", "Media may report freely within the law", "Only state media may publish"], "a": 1, "ex": "Press freedom is a protected basic right."}, {"q": "Who can be a member of a political party?", "choices": ["Only teachers", "Citizens and residents according to party rules", "Only judges"], "a": 1, "ex": "Political parties are open according to their statutes."}, {"q": "What does equality before the law mean?", "choices": ["The same law applies regardless of origin or gender", "Rich people may ignore the law", "Men and women have different basic rights"], "a": 0, "ex": "Everyone is equal before the law."}, {"q": "What is the role of the opposition in parliament?", "choices": ["To control and criticise the government", "To close parliament", "To appoint police officers"], "a": 0, "ex": "Opposition is part of democratic control."}, {"q": "What is guaranteed by freedom of religion?", "choices": ["A boss chooses your religion", "You may choose and practise a religion freely", "Only one religion is allowed"], "a": 1, "ex": "Freedom of religion protects individual choice."}, {"q": "What is a Land in Germany?", "choices": ["A federal state", "A district office", "A city bus line"], "a": 0, "ex": "Germany is a federal state made up of Länder."}, {"q": "How many federal states does Germany have?", "choices": ["12", "16", "20"], "a": 1, "ex": "Germany has 16 Länder."}, {"q": "What is the capital of Germany?", "choices": ["Munich", "Berlin", "Frankfurt"], "a": 1, "ex": "Berlin is the capital."}, {"q": "What is the job of the police?", "choices": ["To write laws", "To protect public safety and enforce the law", "To elect parliament"], "a": 1, "ex": "Police protect safety and enforce the law."}, {"q": "What is the Federal Constitutional Court for?", "choices": ["To check whether laws fit the constitution", "To organise school holidays", "To issue passports"], "a": 0, "ex": "It protects the constitution."}, {"q": "Who signs federal laws after they are passed?", "choices": ["The Federal President", "The mayor of Berlin", "The chief of police"], "a": 0, "ex": "The Federal President signs laws."}, {"q": "What does federalism mean?", "choices": ["All power is only in one city", "Power is shared between federation and Länder", "Only Europe may make laws"], "a": 1, "ex": "Federalism divides responsibilities."}, {"q": "What is a municipality responsible for?", "choices": ["Local services like roads and registration", "The national anthem", "Foreign policy"], "a": 0, "ex": "Municipalities handle local administration."}, {"q": "Where do you usually register your address?", "choices": ["At the Bürgeramt / Einwohnermeldeamt", "At the bank", "At the train station"], "a": 0, "ex": "Address registration is done with local authorities."}, {"q": "What is the Bundestag?", "choices": ["The federal parliament", "A television station", "A trade union"], "a": 0, "ex": "The Bundestag is the federal parliament."}, {"q": "What is freedom of expression?", "choices": ["You may express opinions within the law", "Only the government may speak", "You must repeat the opinion of your employer"], "a": 0, "ex": "Freedom of expression protects opinion within legal limits."}, {"q": "What protects human dignity?", "choices": ["The Basic Law", "A company contract", "A sports club rule"], "a": 0, "ex": "Human dignity is protected by the Basic Law."}, {"q": "What is not allowed even if someone is angry?", "choices": ["Violence against other people", "Peaceful protest", "Writing a complaint"], "a": 0, "ex": "Violence is illegal."}, {"q": "What does equal opportunity in education aim for?", "choices": ["Only wealthy children may study", "Access should not depend on origin", "Schools should only exist in big cities"], "a": 1, "ex": "Education should be accessible regardless of background."}, {"q": "What right helps workers organise together?", "choices": ["Freedom of association", "Ban on contracts", "Compulsory party membership"], "a": 0, "ex": "Workers may organise in unions and associations."}, {"q": "What may you do if an office makes a wrong decision?", "choices": ["Use legal remedies like an objection or lawsuit", "Ignore all deadlines forever", "Bribe an official"], "a": 0, "ex": "Administrative decisions can be challenged legally."}, {"q": "What is discrimination?", "choices": ["Unfair unequal treatment because of traits like origin or religion", "Following a queue", "Speaking politely"], "a": 0, "ex": "Discrimination is unfair treatment."}, {"q": "What is protected by the right to privacy?", "choices": ["Private life and personal data", "Only public speeches", "Only company profits"], "a": 0, "ex": "Privacy protects private life and data."}, {"q": "What may the state not do?", "choices": ["Torture people", "Protect rights", "Hold elections"], "a": 0, "ex": "Torture is prohibited."}, {"q": "What is the purpose of social rights and protections?", "choices": ["To support people in need and protect social participation", "To ban all work", "To replace democracy"], "a": 0, "ex": "Social protections support participation and security."}, {"q": "What happened on 3 October?", "choices": ["Day of German Unity", "Constitution Day of Bavaria", "Election Day every year"], "a": 0, "ex": "3 October marks German reunification."}, {"q": "What happened in 1989 in Berlin?", "choices": ["The Berlin Wall fell", "Germany joined the euro", "The Bundestag moved to Bonn"], "a": 0, "ex": "The fall of the Berlin Wall was a key event in 1989."}, {"q": "What does “Nie wieder” refer to in German remembrance culture?", "choices": ["A commitment against dictatorship and persecution", "A football slogan", "A tax rule"], "a": 0, "ex": "It refers to responsibility after National Socialism."}, {"q": "Why are memorials important?", "choices": ["They remember victims and historical responsibility", "They replace schools", "They decide elections"], "a": 0, "ex": "Memorials help preserve remembrance."}, {"q": "What was divided after the Second World War?", "choices": ["Germany", "The Bundestag", "The euro"], "a": 0, "ex": "Germany was divided into East and West."}, {"q": "What is a central lesson from the Nazi period?", "choices": ["Human rights and democracy must be protected", "Only one party should rule", "Press freedom is dangerous"], "a": 0, "ex": "The Nazi period showed why democracy and rights matter."}, {"q": "What was the Berlin Wall?", "choices": ["A border barrier dividing East and West Berlin", "A museum from Roman times", "The first German parliament"], "a": 0, "ex": "The Wall divided Berlin until 1989."}, {"q": "When did Germany become reunified?", "choices": ["1990", "1972", "2005"], "a": 0, "ex": "Reunification happened in 1990."}, {"q": "What does a democracy need from citizens?", "choices": ["Participation and responsibility", "Silence", "Only military service"], "a": 0, "ex": "Democracy depends on active citizens."}, {"q": "Why do schools teach National Socialist history?", "choices": ["To understand responsibility and protect democracy", "To glorify dictatorship", "To replace history of other periods"], "a": 0, "ex": "History teaching helps prevent repetition of injustice."}, {"q": "What is compulsory schooling?", "choices": ["Children must attend school for a number of years", "Only university is free", "School is optional for everyone"], "a": 0, "ex": "School attendance is compulsory."}, {"q": "What is the purpose of health insurance?", "choices": ["To help cover medical care", "To choose election results", "To register a marriage"], "a": 0, "ex": "Health insurance covers medical treatment."}, {"q": "What should you do if you move house?", "choices": ["Register your new address on time", "Nothing at all", "Only tell your neighbours"], "a": 0, "ex": "Address registration is required."}, {"q": "What can parents usually do in Germany?", "choices": ["Share childcare and parental leave", "Stop compulsory schooling permanently", "Ignore child protection laws"], "a": 0, "ex": "Parents may share care responsibilities."}, {"q": "What is a rental contract?", "choices": ["An agreement between tenant and landlord", "A school certificate", "A passport form"], "a": 0, "ex": "A rental contract regulates renting a home."}, {"q": "What is a trade union?", "choices": ["An organisation representing workers' interests", "A political party in every company", "A private police force"], "a": 0, "ex": "Trade unions represent employees."}, {"q": "What may you do if you lose your job?", "choices": ["Register with the employment agency", "Burn your documents", "Avoid all communication"], "a": 0, "ex": "The employment agency can support job seekers."}, {"q": "Why are taxes paid?", "choices": ["To finance public tasks like schools and roads", "Only to punish drivers", "To choose a religion"], "a": 0, "ex": "Taxes finance public services."}, {"q": "What does integration mean?", "choices": ["Participating in society with rights and responsibilities", "Forgetting your own history completely", "Living without any contact to others"], "a": 0, "ex": "Integration is participation in society."}, {"q": "What should happen in a workplace team?", "choices": ["Respect, cooperation and following the rules", "Insults and discrimination", "No communication"], "a": 0, "ex": "Workplaces require cooperation and respect."}, {"q": "In Germany, what is the Basic Law?", "choices": ["the German constitution", "a museum ticket", "a bank contract"], "a": 0, "ex": "The Basic Law is the constitution of Germany."}, {"q": "Which statement about the Basic Law is correct?", "choices": ["the German constitution", "a museum ticket", "a bank contract"], "a": 0, "ex": "The Basic Law is the constitution of Germany."}, {"q": "What best describes the Basic Law?", "choices": ["the German constitution", "a museum ticket", "a bank contract"], "a": 0, "ex": "The Basic Law is the constitution of Germany."}, {"q": "In Germany, what is secret voting?", "choices": ["ballots are cast without pressure and in secret", "votes must be shown to neighbours", "the police chooses for you"], "a": 0, "ex": "German elections are free and secret."}, {"q": "Which statement about secret voting is correct?", "choices": ["ballots are cast without pressure and in secret", "votes must be shown to neighbours", "the police chooses for you"], "a": 0, "ex": "German elections are free and secret."}, {"q": "What best describes secret voting?", "choices": ["ballots are cast without pressure and in secret", "votes must be shown to neighbours", "the police chooses for you"], "a": 0, "ex": "German elections are free and secret."}, {"q": "In Germany, what is freedom of assembly?", "choices": ["people may gather peacefully", "only companies may meet", "street names decide politics"], "a": 0, "ex": "Peaceful assembly is protected."}, {"q": "Which statement about freedom of assembly is correct?", "choices": ["people may gather peacefully", "only companies may meet", "street names decide politics"], "a": 0, "ex": "Peaceful assembly is protected."}, {"q": "What best describes freedom of assembly?", "choices": ["people may gather peacefully", "only companies may meet", "street names decide politics"], "a": 0, "ex": "Peaceful assembly is protected."}, {"q": "In Germany, what is freedom of occupation?", "choices": ["people may choose a profession", "employers choose every citizen's job", "only officials may work"], "a": 0, "ex": "People may choose their profession."}, {"q": "Which statement about freedom of occupation is correct?", "choices": ["people may choose a profession", "employers choose every citizen's job", "only officials may work"], "a": 0, "ex": "People may choose their profession."}, {"q": "What best describes freedom of occupation?", "choices": ["people may choose a profession", "employers choose every citizen's job", "only officials may work"], "a": 0, "ex": "People may choose their profession."}, {"q": "In Germany, what is the Federal Constitutional Court?", "choices": ["it checks constitutionality", "it runs local buses", "it collects rent"], "a": 0, "ex": "The court reviews constitutional questions."}, {"q": "Which statement about the Federal Constitutional Court is correct?", "choices": ["it checks constitutionality", "it runs local buses", "it collects rent"], "a": 0, "ex": "The court reviews constitutional questions."}, {"q": "What best describes the Federal Constitutional Court?", "choices": ["it checks constitutionality", "it runs local buses", "it collects rent"], "a": 0, "ex": "The court reviews constitutional questions."}, {"q": "In Germany, what is the Bundesrat?", "choices": ["it represents the Länder at federal level", "it is a television show", "it replaces all local councils"], "a": 0, "ex": "The Bundesrat represents the Länder."}, {"q": "Which statement about the Bundesrat is correct?", "choices": ["it represents the Länder at federal level", "it is a television show", "it replaces all local councils"], "a": 0, "ex": "The Bundesrat represents the Länder."}, {"q": "What best describes the Bundesrat?", "choices": ["it represents the Länder at federal level", "it is a television show", "it replaces all local councils"], "a": 0, "ex": "The Bundesrat represents the Länder."}, {"q": "In Germany, what is human dignity?", "choices": ["it must be respected and protected", "it depends on salary", "it only applies to politicians"], "a": 0, "ex": "Human dignity is protected by the Basic Law."}, {"q": "Which statement about human dignity is correct?", "choices": ["it must be respected and protected", "it depends on salary", "it only applies to politicians"], "a": 0, "ex": "Human dignity is protected by the Basic Law."}, {"q": "What best describes human dignity?", "choices": ["it must be respected and protected", "it depends on salary", "it only applies to politicians"], "a": 0, "ex": "Human dignity is protected by the Basic Law."}, {"q": "In Germany, what is social insurance?", "choices": ["it supports people in cases like illness or unemployment", "it decides election campaigns", "it replaces schools"], "a": 0, "ex": "Social insurance protects people against major risks."}, {"q": "Which statement about social insurance is correct?", "choices": ["it supports people in cases like illness or unemployment", "it decides election campaigns", "it replaces schools"], "a": 0, "ex": "Social insurance protects people against major risks."}, {"q": "What best describes social insurance?", "choices": ["it supports people in cases like illness or unemployment", "it decides election campaigns", "it replaces schools"], "a": 0, "ex": "Social insurance protects people against major risks."}, {"q": "In Germany, what is the Bürgeramt?", "choices": ["it handles many local registrations and documents", "it decides criminal cases", "it runs airports"], "a": 0, "ex": "The Bürgeramt handles common local administrative tasks."}, {"q": "Which statement about the Bürgeramt is correct?", "choices": ["it handles many local registrations and documents", "it decides criminal cases", "it runs airports"], "a": 0, "ex": "The Bürgeramt handles common local administrative tasks."}, {"q": "What best describes the Bürgeramt?", "choices": ["it handles many local registrations and documents", "it decides criminal cases", "it runs airports"], "a": 0, "ex": "The Bürgeramt handles common local administrative tasks."}, {"q": "In Germany, what is compulsory schooling?", "choices": ["children must attend school", "school is voluntary for all children", "only city children go to school"], "a": 0, "ex": "School attendance is compulsory."}, {"q": "Which statement about compulsory schooling is correct?", "choices": ["children must attend school", "school is voluntary for all children", "only city children go to school"], "a": 0, "ex": "School attendance is compulsory."}, {"q": "What best describes compulsory schooling?", "choices": ["children must attend school", "school is voluntary for all children", "only city children go to school"], "a": 0, "ex": "School attendance is compulsory."}, {"q": "In Germany, what is the right to vote?", "choices": ["eligible citizens may elect representatives", "only celebrities can vote", "children choose all laws directly every week"], "a": 0, "ex": "Eligible citizens vote in elections."}, {"q": "Which statement about the right to vote is correct?", "choices": ["eligible citizens may elect representatives", "only celebrities can vote", "children choose all laws directly every week"], "a": 0, "ex": "Eligible citizens vote in elections."}, {"q": "What best describes the right to vote?", "choices": ["eligible citizens may elect representatives", "only celebrities can vote", "children choose all laws directly every week"], "a": 0, "ex": "Eligible citizens vote in elections."}, {"q": "In Germany, what is freedom of conscience?", "choices": ["people may follow their convictions", "the employer chooses your values", "there may be only one worldview"], "a": 0, "ex": "Freedom of conscience protects personal convictions."}, {"q": "Which statement about freedom of conscience is correct?", "choices": ["people may follow their convictions", "the employer chooses your values", "there may be only one worldview"], "a": 0, "ex": "Freedom of conscience protects personal convictions."}, {"q": "What best describes freedom of conscience?", "choices": ["people may follow their convictions", "the employer chooses your values", "there may be only one worldview"], "a": 0, "ex": "Freedom of conscience protects personal convictions."}, {"q": "In Germany, what is municipal council?", "choices": ["it decides local matters in a city or town", "it commands the army", "it prints euro banknotes"], "a": 0, "ex": "Municipal councils make local decisions."}, {"q": "Which statement about municipal council is correct?", "choices": ["it decides local matters in a city or town", "it commands the army", "it prints euro banknotes"], "a": 0, "ex": "Municipal councils make local decisions."}, {"q": "What best describes municipal council?", "choices": ["it decides local matters in a city or town", "it commands the army", "it prints euro banknotes"], "a": 0, "ex": "Municipal councils make local decisions."}, {"q": "In Germany, what is the police?", "choices": ["it protects safety and enforces the law", "it writes the constitution", "it appoints teachers nationally"], "a": 0, "ex": "Police protect safety and enforce the law."}, {"q": "Which statement about the police is correct?", "choices": ["it protects safety and enforces the law", "it writes the constitution", "it appoints teachers nationally"], "a": 0, "ex": "Police protect safety and enforce the law."}, {"q": "What best describes the police?", "choices": ["it protects safety and enforces the law", "it writes the constitution", "it appoints teachers nationally"], "a": 0, "ex": "Police protect safety and enforce the law."}, {"q": "In Germany, what is taxes?", "choices": ["they finance public services", "they replace elections", "they are paid only by tourists"], "a": 0, "ex": "Taxes help finance public services."}, {"q": "Which statement about taxes is correct?", "choices": ["they finance public services", "they replace elections", "they are paid only by tourists"], "a": 0, "ex": "Taxes help finance public services."}, {"q": "What best describes taxes?", "choices": ["they finance public services", "they replace elections", "they are paid only by tourists"], "a": 0, "ex": "Taxes help finance public services."}, {"q": "In Germany, what is an objection to an official decision?", "choices": ["it is a legal way to challenge a decision", "it means ignoring the letter forever", "it is a party membership"], "a": 0, "ex": "Official decisions can often be challenged legally."}, {"q": "Which statement about an objection to an official decision is correct?", "choices": ["it is a legal way to challenge a decision", "it means ignoring the letter forever", "it is a party membership"], "a": 0, "ex": "Official decisions can often be challenged legally."}, {"q": "What best describes an objection to an official decision?", "choices": ["it is a legal way to challenge a decision", "it means ignoring the letter forever", "it is a party membership"], "a": 0, "ex": "Official decisions can often be challenged legally."}, {"q": "In Germany, what is equal rights for women and men?", "choices": ["both have the same rights", "men may vote twice", "women cannot work"], "a": 0, "ex": "Women and men have equal rights."}, {"q": "Which statement about equal rights for women and men is correct?", "choices": ["both have the same rights", "men may vote twice", "women cannot work"], "a": 0, "ex": "Women and men have equal rights."}, {"q": "What best describes equal rights for women and men?", "choices": ["both have the same rights", "men may vote twice", "women cannot work"], "a": 0, "ex": "Women and men have equal rights."}, {"q": "In Germany, what is the Day of German Unity?", "choices": ["it commemorates reunification on 3 October", "it marks the start of summer", "it is always an election day"], "a": 0, "ex": "The Day of German Unity is celebrated on 3 October."}, {"q": "Which statement about the Day of German Unity is correct?", "choices": ["it commemorates reunification on 3 October", "it marks the start of summer", "it is always an election day"], "a": 0, "ex": "The Day of German Unity is celebrated on 3 October."}, {"q": "What best describes the Day of German Unity?", "choices": ["it commemorates reunification on 3 October", "it marks the start of summer", "it is always an election day"], "a": 0, "ex": "The Day of German Unity is celebrated on 3 October."}, {"q": "In Germany, what is the Berlin Wall?", "choices": ["it divided Berlin until 1989", "it is Germany's current national border", "it is the name of parliament"], "a": 0, "ex": "The Berlin Wall divided Berlin until 1989."}, {"q": "Which statement about the Berlin Wall is correct?", "choices": ["it divided Berlin until 1989", "it is Germany's current national border", "it is the name of parliament"], "a": 0, "ex": "The Berlin Wall divided Berlin until 1989."}, {"q": "What best describes the Berlin Wall?", "choices": ["it divided Berlin until 1989", "it is Germany's current national border", "it is the name of parliament"], "a": 0, "ex": "The Berlin Wall divided Berlin until 1989."}, {"q": "In Germany, what is the Länder?", "choices": ["they are the federal states", "they are only football clubs", "they are trade unions"], "a": 0, "ex": "Germany consists of Länder, its federal states."}, {"q": "Which statement about the Länder is correct?", "choices": ["they are the federal states", "they are only football clubs", "they are trade unions"], "a": 0, "ex": "Germany consists of Länder, its federal states."}, {"q": "What best describes the Länder?", "choices": ["they are the federal states", "they are only football clubs", "they are trade unions"], "a": 0, "ex": "Germany consists of Länder, its federal states."}, {"q": "What should you do before starting a business in Germany?", "choices": ["Check registrations, taxes and legal form", "Only buy a briefcase", "Wait for a neighbour to decide"], "a": 0, "ex": "Starting a business usually requires checking registration, taxes and legal form."}, {"q": "Which institution often helps with unemployment support?", "choices": ["Employment agency / Jobcenter", "Football club", "Hotel reception"], "a": 0, "ex": "Employment services help with job seeking and benefits."}, {"q": "What belongs to a democratic debate?", "choices": ["Different opinions and respectful discussion", "Violence against opponents", "Fake counting of votes"], "a": 0, "ex": "Democracy needs open debate without violence."}, {"q": "Why is paying into health insurance important?", "choices": ["Medical care is financed when needed", "It replaces your passport", "It chooses your apartment"], "a": 0, "ex": "Health insurance helps cover treatment costs."}, {"q": "What can you do if you are treated unfairly because of your religion?", "choices": ["Seek advice and legal help against discrimination", "Accept it because it is always legal", "Change your name by force"], "a": 0, "ex": "Discrimination can be challenged with advice and legal remedies."}, {"q": "Which institution can issue a passport or ID card locally?", "choices": ["The local authority / Bürgeramt", "The supermarket", "The cinema"], "a": 0, "ex": "Local registration offices issue many documents."}, {"q": "What is the purpose of a constitution?", "choices": ["To define basic state order and rights", "To advertise products", "To replace local laws with songs"], "a": 0, "ex": "A constitution defines the legal foundation of the state."}, {"q": "What shows respect for religious diversity?", "choices": ["Allowing people to practise different religions peacefully", "Forcing everyone into one religion", "Banning all holidays"], "a": 0, "ex": "Religious freedom protects diversity."}, {"q": "What should happen in a free election?", "choices": ["Votes are counted correctly and secretly", "One party fills in all ballots", "Only officials may stand as candidates"], "a": 0, "ex": "Free elections require secrecy and fair counting."}, {"q": "What belongs to responsible citizenship?", "choices": ["Informing yourself and participating lawfully", "Ignoring all rules", "Threatening officials"], "a": 0, "ex": "Citizenship includes lawful participation."}, {"q": "Which option is the German constitution called?", "choices": ["Das Grundgesetz", "Die Bundesordnung", "Das Reichsgesetz"], "a": 0, "ex": "Germany's constitution is called the Grundgesetz."}, {"q": "Which option is forbidden in a democracy?", "choices": ["Election fraud", "Different opinions", "Peaceful criticism"], "a": 0, "ex": "Election fraud damages free democratic elections."}, {"q": "Which option do you do in an election?", "choices": ["You vote secretly", "You show your ballot publicly", "You ask the police to decide"], "a": 0, "ex": "Voting is secret."}, {"q": "Which option does freedom of the press mean?", "choices": ["Newspapers need permission from one party", "Media may report freely within the law", "Only state media may publish"], "a": 1, "ex": "Press freedom is a protected basic right."}, {"q": "Which option does equality before the law mean?", "choices": ["The same law applies regardless of origin or gender", "Rich people may ignore the law", "Men and women have different basic rights"], "a": 0, "ex": "Everyone is equal before the law."}, {"q": "Which option is the role of the opposition in parliament?", "choices": ["To control and criticise the government", "To close parliament", "To appoint police officers"], "a": 0, "ex": "Opposition is part of democratic control."}, {"q": "Which option is guaranteed by freedom of religion?", "choices": ["A boss chooses your religion", "You may choose and practise a religion freely", "Only one religion is allowed"], "a": 1, "ex": "Freedom of religion protects individual choice."}, {"q": "Which option is a Land in Germany?", "choices": ["A federal state", "A district office", "A city bus line"], "a": 0, "ex": "Germany is a federal state made up of Länder."}, {"q": "Which option is the capital of Germany?", "choices": ["Munich", "Berlin", "Frankfurt"], "a": 1, "ex": "Berlin is the capital."}, {"q": "Which option is the job of the police?", "choices": ["To write laws", "To protect public safety and enforce the law", "To elect parliament"], "a": 1, "ex": "Police protect safety and enforce the law."}, {"q": "Which option is the Federal Constitutional Court for?", "choices": ["To check whether laws fit the constitution", "To organise school holidays", "To issue passports"], "a": 0, "ex": "It protects the constitution."}, {"q": "Which option does federalism mean?", "choices": ["All power is only in one city", "Power is shared between federation and Länder", "Only Europe may make laws"], "a": 1, "ex": "Federalism divides responsibilities."}, {"q": "Which option is a municipality responsible for?", "choices": ["Local services like roads and registration", "The national anthem", "Foreign policy"], "a": 0, "ex": "Municipalities handle local administration."}, {"q": "Which option is the Bundestag?", "choices": ["The federal parliament", "A television station", "A trade union"], "a": 0, "ex": "The Bundestag is the federal parliament."}, {"q": "Which option is freedom of expression?", "choices": ["You may express opinions within the law", "Only the government may speak", "You must repeat the opinion of your employer"], "a": 0, "ex": "Freedom of expression protects opinion within legal limits."}, {"q": "Which option protects human dignity?", "choices": ["The Basic Law", "A company contract", "A sports club rule"], "a": 0, "ex": "Human dignity is protected by the Basic Law."}, {"q": "Which option is not allowed even if someone is angry?", "choices": ["Violence against other people", "Peaceful protest", "Writing a complaint"], "a": 0, "ex": "Violence is illegal."}, {"q": "Which option does equal opportunity in education aim for?", "choices": ["Only wealthy children may study", "Access should not depend on origin", "Schools should only exist in big cities"], "a": 1, "ex": "Education should be accessible regardless of background."}, {"q": "Which option right helps workers organise together?", "choices": ["Freedom of association", "Ban on contracts", "Compulsory party membership"], "a": 0, "ex": "Workers may organise in unions and associations."}, {"q": "Which option may you do if an office makes a wrong decision?", "choices": ["Use legal remedies like an objection or lawsuit", "Ignore all deadlines forever", "Bribe an official"], "a": 0, "ex": "Administrative decisions can be challenged legally."}, {"q": "Which option is discrimination?", "choices": ["Unfair unequal treatment because of traits like origin or religion", "Following a queue", "Speaking politely"], "a": 0, "ex": "Discrimination is unfair treatment."}, {"q": "Which option is protected by the right to privacy?", "choices": ["Private life and personal data", "Only public speeches", "Only company profits"], "a": 0, "ex": "Privacy protects private life and data."}, {"q": "Which option may the state not do?", "choices": ["Torture people", "Protect rights", "Hold elections"], "a": 0, "ex": "Torture is prohibited."}, {"q": "Which option is the purpose of social rights and protections?", "choices": ["To support people in need and protect social participation", "To ban all work", "To replace democracy"], "a": 0, "ex": "Social protections support participation and security."}, {"q": "Which option happened on 3 October?", "choices": ["Day of German Unity", "Constitution Day of Bavaria", "Election Day every year"], "a": 0, "ex": "3 October marks German reunification."}, {"q": "Which option happened in 1989 in Berlin?", "choices": ["The Berlin Wall fell", "Germany joined the euro", "The Bundestag moved to Bonn"], "a": 0, "ex": "The fall of the Berlin Wall was a key event in 1989."}, {"q": "Which option does “Nie wieder” refer to in German remembrance culture?", "choices": ["A commitment against dictatorship and persecution", "A football slogan", "A tax rule"], "a": 0, "ex": "It refers to responsibility after National Socialism."}, {"q": "Which option was divided after the Second World War?", "choices": ["Germany", "The Bundestag", "The euro"], "a": 0, "ex": "Germany was divided into East and West."}, {"q": "Which option is a central lesson from the Nazi period?", "choices": ["Human rights and democracy must be protected", "Only one party should rule", "Press freedom is dangerous"], "a": 0, "ex": "The Nazi period showed why democracy and rights matter."}, {"q": "Which option was the Berlin Wall?", "choices": ["A border barrier dividing East and West Berlin", "A museum from Roman times", "The first German parliament"], "a": 0, "ex": "The Wall divided Berlin until 1989."}, {"q": "Which option does a democracy need from citizens?", "choices": ["Participation and responsibility", "Silence", "Only military service"], "a": 0, "ex": "Democracy depends on active citizens."}, {"q": "Which option is compulsory schooling?", "choices": ["Children must attend school for a number of years", "Only university is free", "School is optional for everyone"], "a": 0, "ex": "School attendance is compulsory."}, {"q": "Which option is the purpose of health insurance?", "choices": ["To help cover medical care", "To choose election results", "To register a marriage"], "a": 0, "ex": "Health insurance covers medical treatment."}, {"q": "Which option should you do if you move house?", "choices": ["Register your new address on time", "Nothing at all", "Only tell your neighbours"], "a": 0, "ex": "Address registration is required."}, {"q": "Which option can parents usually do in Germany?", "choices": ["Share childcare and parental leave", "Stop compulsory schooling permanently", "Ignore child protection laws"], "a": 0, "ex": "Parents may share care responsibilities."}, {"q": "Which option is a rental contract?", "choices": ["An agreement between tenant and landlord", "A school certificate", "A passport form"], "a": 0, "ex": "A rental contract regulates renting a home."}, {"q": "Which option is a trade union?", "choices": ["An organisation representing workers' interests", "A political party in every company", "A private police force"], "a": 0, "ex": "Trade unions represent employees."}, {"q": "Which option may you do if you lose your job?", "choices": ["Register with the employment agency", "Burn your documents", "Avoid all communication"], "a": 0, "ex": "The employment agency can support job seekers."}, {"q": "Which option does integration mean?", "choices": ["Participating in society with rights and responsibilities", "Forgetting your own history completely", "Living without any contact to others"], "a": 0, "ex": "Integration is participation in society."}, {"q": "Which option should happen in a workplace team?", "choices": ["Respect, cooperation and following the rules", "Insults and discrimination", "No communication"], "a": 0, "ex": "Workplaces require cooperation and respect."}, {"q": "Which option best describes the Basic Law?", "choices": ["the German constitution", "a museum ticket", "a bank contract"], "a": 0, "ex": "The Basic Law is the constitution of Germany."}, {"q": "Which option best describes secret voting?", "choices": ["ballots are cast without pressure and in secret", "votes must be shown to neighbours", "the police chooses for you"], "a": 0, "ex": "German elections are free and secret."}, {"q": "Which option best describes freedom of assembly?", "choices": ["people may gather peacefully", "only companies may meet", "street names decide politics"], "a": 0, "ex": "Peaceful assembly is protected."}, {"q": "What does freedom of religion mean in Germany?", "choices": ["Only one religion is allowed", "Everyone may choose and practise a religion freely", "Religion is decided by the employer"], "a": 1, "ex": "Freedom of religion means people may choose, change and practise a religion freely within the law."}, {"q": "How often are Bundestag elections normally held?", "choices": ["Every 2 years", "Every 4 years", "Every 8 years"], "a": 1, "ex": "The Bundestag is normally elected every four years."}, {"q": "Which colors are on the German flag?", "choices": ["Black, red, gold", "Blue, white, red", "Green, white, black"], "a": 0, "ex": "The German flag is black, red and gold."}, {"q": "What is the role of the Bundesrat?", "choices": ["It represents the federal states", "It elects the mayors", "It leads the courts"], "a": 0, "ex": "The Bundesrat represents the Länder in federal lawmaking."}, {"q": "What does the rule of law mean?", "choices": ["The government may ignore the courts", "State action is bound by law", "Only police decide what is legal"], "a": 1, "ex": "In a Rechtsstaat, state institutions are bound by law and can be checked by courts."}, {"q": "Who can join a political party in Germany?", "choices": ["Only members of parliament", "Adults who meet the legal requirements", "Only civil servants"], "a": 1, "ex": "Political participation through parties is generally open to adults who meet the legal requirements."}, {"q": "What is protected by freedom of opinion?", "choices": ["Peaceful expression of opinions", "Insults without limits", "Election fraud"], "a": 0, "ex": "Freedom of opinion protects expressing views within the limits of the law."}, {"q": "Why are taxes important for the state?", "choices": ["They finance public tasks", "They are paid only by tourists", "They replace all laws"], "a": 0, "ex": "Taxes help finance schools, roads, administration and many public services."}, {"q": "Which institution decides whether a law is constitutional?", "choices": ["The Federal Constitutional Court", "The local tax office", "The city library"], "a": 0, "ex": "The Bundesverfassungsgericht reviews constitutional questions."}, {"q": "What is equal treatment before the law?", "choices": ["Everyone is judged by the same laws", "Only citizens have rights", "Rich people have separate rules"], "a": 0, "ex": "Equality before the law means the same legal standards apply to everyone."}, {"q": "Which level of government is responsible for local matters like a town hall?", "choices": ["The municipality", "The European Parliament", "The weather service"], "a": 0, "ex": "Local matters are mainly handled by municipalities."}, {"q": "What is one important task of the police in a democracy?", "choices": ["Protect public safety under the law", "Write school exams", "Collect church tax"], "a": 0, "ex": "The police protect public safety and must act within the law."}, {"q": "What may citizens do in a democracy?", "choices": ["Take part in elections and public discussion", "Ignore all laws", "Choose judges directly in every case"], "a": 0, "ex": "Citizens participate through voting and public debate."}, {"q": "Why is an independent press important?", "choices": ["It informs the public and can criticise power", "It replaces the parliament", "It decides court cases"], "a": 0, "ex": "A free press helps control political power by informing the public."}, {"q": "What does social security support?", "choices": ["People in situations like illness, unemployment or old age", "Only sports clubs", "Only large companies"], "a": 0, "ex": "The social system supports people in specific life situations."}, {"q": "What happens if someone does not agree with an administrative decision?", "choices": ["They can often use legal remedies", "They must accept it immediately in every case", "They ask the football club"], "a": 0, "ex": "Legal remedies and courts are part of the rule of law."}, {"q": "What is the purpose of the Constitution?", "choices": ["It defines fundamental rights and the state order", "It sets supermarket prices", "It replaces school books"], "a": 0, "ex": "A constitution structures the state and protects fundamental rights."}, {"q": "What does gender equality mean?", "choices": ["Women and men have equal rights", "Only men may vote", "Only women may work part-time"], "a": 0, "ex": "Equal rights for women and men are protected in Germany."}, {"q": "What is volunteering?", "choices": ["Free civic engagement for others", "A paid tax duty", "A school punishment"], "a": 0, "ex": "Volunteering means people freely contribute time and effort."}, {"q": "What can help integration?", "choices": ["Language learning and participation", "Avoiding all contact", "Ignoring official letters"], "a": 0, "ex": "Language, contact and participation support integration."}];
const LISTENING_BANK=[{"level": "A1", "text": "Ich heiße Lara. Ich wohne in Köln und arbeite in einem Café. Am Wochenende besuche ich oft meine Schwester.", "question_en": "Where does Lara work?", "question_de": "Wo arbeitet Lara?", "answer": "Sie arbeitet in einem Café.", "reason_en": "Use location after in with dative: in einem Café.", "reason_de": "Bei einem Ort nach in steht hier der Dativ: in einem Café."}, {"level": "A2", "text": "Herr Becker fährt jeden Morgen mit der U-Bahn ins Büro. Heute kommt er aber zu spät, weil die Bahn ein technisches Problem hat.", "question_en": "Why is Mr Becker late today?", "question_de": "Warum kommt Herr Becker heute zu spät?", "answer": "Weil die Bahn ein technisches Problem hat.", "reason_en": "After weil the verb goes to the end.", "reason_de": "Nach weil steht das Verb am Ende."}, {"level": "B1", "text": "Anna möchte ihren Vertrag kündigen. Deshalb schreibt sie eine E-Mail an die Firma und bittet um eine schriftliche Bestätigung.", "question_en": "What does Anna ask the company for?", "question_de": "Worum bittet Anna die Firma?", "answer": "Sie bittet um eine schriftliche Bestätigung.", "reason_en": "bitten um requires um + accusative.", "reason_de": "bitten um verlangt um + Akkusativ."}, {"level": "B2", "text": "Das Unternehmen hat die Preise erhöht, obwohl die Nachfrage in den letzten Monaten gesunken ist. Viele Kunden reagieren darauf mit Kritik.", "question_en": "How do many customers react?", "question_de": "Wie reagieren viele Kunden?", "answer": "Viele Kunden reagieren mit Kritik.", "reason_en": "The answer needs the fixed phrase reagieren mit ...", "reason_de": "Hier passt die feste Verbindung reagieren mit ..."}];
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let store=loadStore();

function loadStore(){ try{return Object.assign({},STORE_DEFAULT,JSON.parse(localStorage.getItem(LS_KEY)||'{}'));}catch{return JSON.parse(JSON.stringify(STORE_DEFAULT));}}
function saveStore(){ localStorage.setItem(LS_KEY, JSON.stringify(store)); }
function setDataHealth(loaded,missing=[]){ store.dataHealth={loaded,missing}; saveStore(); const node=$('#dataHealthText'); if(node){ node.innerHTML=loaded ? `<span class="good">${t('Data loaded correctly.','Daten korrekt geladen.')}</span>` : `<span class="bad">${t('Some data files are missing: ','Einige Datendateien fehlen: ')}${missing.join(', ')}</span>`; } }
function weakRoute(type){
  if(!type) return {section:'practice',practice:'exercises',setup:()=>{ $('#exerciseFocusFilter').value='weak'; }};
  if(type==='conjugation') return {section:'conjugation'};
  if(type==='vocab' || type==='vocabulary') return {section:'vocab', setup:()=>switchVocab('type')};
  if(['nominative','accusative','dative','movement_vs_location','case_reasoning','possessive','separable_verbs','perfect','verb_preposition','subordinate_clause','adjective_endings'].includes(type)) return {section:'practice', practice:'cases', setup:()=>newCaseDrill(type)};
  if(type==='listening') return {section:'practice',practice:'listening'};
  if(type==='typing' || type==='passages') return {section:'practice',practice:'typing'};
  if(type==='writing') return {section:'practice',practice:'writing'};
  return {section:'practice', practice:'exercises', setup:()=>{ const typeSel=$('#exerciseTypeFilter'); const focusSel=$('#exerciseFocusFilter'); if(focusSel) focusSel.value='all'; if(typeSel && [...typeSel.options].some(o=>o.value===type)) typeSel.value=type; else if(typeSel) typeSel.value='ALL'; }};
}
function openWeakTopic(type){ const route=weakRoute(type); goSection(route.section); if(route.practice) switchPractice(route.practice); if(route.setup) route.setup(); if(route.section==='practice' && (!route.practice || route.practice==='exercises')) newExercise(); if(route.section==='conjugation') newConj(); if(route.section==='vocab') renderVocabList(); }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function today(){ const k=todayKey(); if(!store.daily[k]) store.daily[k]={uniquePassages:[],repeatPassages:0,correctExercises:0,attemptedExercises:0,uniqueVocab:[],writingDone:0,listeningDone:0,xp:0}; return store.daily[k]; }
function mission(){ return store.missionPreset==='custom'?store.missionCustom:({easy:{passages:1,exercises:10,vocab:8,writing:1},medium:{passages:2,exercises:20,vocab:12,writing:2},hard:{passages:3,exercises:35,vocab:18,writing:3}}[store.missionPreset]||STORE_DEFAULT.missionCustom); }
function xpStep(){ return store.missionPreset==='easy'?1:store.missionPreset==='medium'?2:3; }
function norm(s){ return normalizeText(s); }
function shuffle(a){ a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function uniqueBy(arr,keyFn){ const s=new Set(); return arr.filter(x=>{const k=keyFn(x); if(s.has(k)) return false; s.add(k); return true;}); }

function groupFromPractice(mode){
  if(['exercises','cases','fixed','topicflow'].includes(mode)) return 'grammar';
  if(['typing','structure','writing'].includes(mode)) return 'production';
  if(['listening'].includes(mode)) return 'listening';
  if(['revision'].includes(mode)) return 'revision';
  return 'grammar';
}
function switchPracticeGroup(name){
  state.practiceGroup=name; store.lastPracticeGroup=name; saveStore();
  $$('.pgroupbtn').forEach(b=>b.classList.toggle('active',b.dataset.pgroup===name));
  $$('.practice-group').forEach(p=>p.classList.add('hidden'));
  const wrap=$('#practice-'+name+'-group'); if(wrap) wrap.classList.remove('hidden');
  if(name==='grammar' && !['exercises','cases','fixed','topicflow'].includes(state.practice)) switchPractice('exercises');
  if(name==='production' && !['typing','structure','writing'].includes(state.practice)) switchPractice('typing');
  if(name==='listening'){ state.practice='listening'; store.lastPractice='listening'; }
  if(name==='revision'){ state.practice='revision'; store.lastPractice='revision'; renderRevisionPanel(); }
}

function t(en,de){ return store.lang==='de' ? (de||en) : (en||de); }
function speak(text,speed=1){ stopSpeak(); const u=new SpeechSynthesisUtterance(text); u.lang='de-DE'; u.rate=Number(speed)||1; state.speech=u; speechSynthesis.speak(u); }
function stopSpeak(){ try{ speechSynthesis.cancel(); }catch(e){} state.speech=null; }
function updateStreak(){ const tk=todayKey(); if(store.lastActive===tk) return; if(!store.lastActive) store.streak=1; else { const diff=Math.round((new Date(tk)-new Date(store.lastActive))/86400000); store.streak = diff===1 ? store.streak+1 : 1; } store.lastActive=tk; saveStore(); }
function addXP(n){ store.xp+=n; today().xp=(today().xp||0)+n; saveStore(); }
function markPassageDone(key){ const d=today(); if(!d.uniquePassages.includes(key)){ d.uniquePassages.push(key); addXP(xpStep()); } else { d.repeatPassages++; if(store.countRepeats) addXP(1); } saveStore(); }
function addVocabSeen(word){ const d=today(); if(!d.uniqueVocab.includes(word)){ d.uniqueVocab.push(word); addXP(1); saveStore(); } }
function recordWeak(type,ok,weight=1){ store.weak[type]??={wrong:0,right:0}; if(ok) store.weak[type].right+=weight; else store.weak[type].wrong+=weight; saveStore(); }
function getWeakAreas(){ return Object.entries(store.weak).map(([type,v])=>({type,score:v.wrong*2-v.right,wrong:v.wrong,right:v.right})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score); }
function missionPct(){ const d=today(),m=mission(); const sum=Math.min(d.uniquePassages.length,m.passages)+Math.min(d.correctExercises,m.exercises)+Math.min(d.uniqueVocab.length,m.vocab)+Math.min(d.writingDone,m.writing); const max=m.passages+m.exercises+m.vocab+m.writing; return Math.round((sum/max)*100)||0; }
function coachText(){ const weak=getWeakAreas().slice(0,3).map(x=>x.type).join(', '); const due=dueReviews().length; if(weak && due) return store.lang==='de'?`Schwächen: ${weak} • ${due} fällig`:`Weak areas: ${weak} • ${due} due`; return weak ? (store.lang==='de'?`Schwächen: ${weak}`:`Weak areas: ${weak}`) : t('Step by step','Schritt für Schritt'); }

function reviewNow(){ return new Date().getTime(); }
function queueReview(kind,key,data,days=0){
  store.reviewQueue ||= [];
  const id=`${kind}|${key}`;
  const due=reviewNow()+days*86400000;
  const existing=store.reviewQueue.find(r=>r.id===id);
  if(existing){ Object.assign(existing,{kind,key,data,due}); }
  else store.reviewQueue.push({id,kind,key,data,due});
  saveStore();
}
function dueReviews(){ store.reviewQueue ||= []; return store.reviewQueue.filter(r=>r.due<=reviewNow()); }
function completeReview(id,ok){ store.reviewQueue ||= []; const idx=store.reviewQueue.findIndex(r=>r.id===id); if(idx<0) return; if(ok){ store.reviewQueue[idx].due=reviewNow()+3*86400000; } else { store.reviewQueue[idx].due=reviewNow()+12*3600000; } saveStore(); }
function adaptivePlan(){
  const weak=getWeakAreas().slice(0,3).map(w=>w.type);
  const due=dueReviews().length;
  const tasks=[];
  if(due) tasks.push((store.lang==='de'?`1. Wiederhole ${due} fällige Aufgaben`:`1. Review ${due} due items`));
  if(weak[0]) tasks.push((store.lang==='de'?`2. Übe Schwäche: ${weak[0]}`:`2. Practice weak area: ${weak[0]}`));
  tasks.push(store.lang==='de'?'3. Schreibe 1 kurze Antwort in ganzen Sätzen':'3. Write 1 short answer in full sentences');
  tasks.push(store.lang==='de'?'4. Mache 1 Fall-Training':'4. Do 1 case trainer round');
  return tasks;
}
function labelSection(sec){ return ({practice:t('Practice','Üben'),vocab:t('Vocabulary','Wortschatz'),grammar:t('Grammar','Grammatik'),flashcards:t('Flashcards','Karteikarten'),weak:t('Weak Areas','Schwächen'),conjugation:t('Conjugation','Konjugation'),exam:t('Exam Mode','Prüfungsmodus'),lid:'Leben in Deutschland',app:'App'})[sec]||sec; }
function setTheme(theme){ store.theme=theme; document.body.className=theme; $('#themeSelect').value=theme; $('#settingsTheme').value=theme; saveStore(); }
function setLanguage(lang){ store.lang=lang; $('#languageSelect').value=lang; $('#settingsLanguage').value=lang; saveStore(); renderAll(); }
function translateStatic(){
 const navMap={practice:t('Practice','Üben'),vocab:t('Vocabulary','Wortschatz'),grammar:t('Grammar','Grammatik'),flashcards:t('Flashcards','Karteikarten'),weak:t('Weak Areas','Schwächen'),conjugation:t('Conjugation','Konjugation'),exam:t('Exam Mode','Prüfungsmodus'),lid:'Leben in Deutschland',app:'App'};
 $$('.navbtn').forEach(b=>b.textContent=navMap[b.dataset.section]||b.textContent);
 const subt={exercises:t('Exercises','Übungen'),typing:t('Typing','Abschreiben'),listening:t('Listening Q&A','Hören & Antworten'),structure:t('Sentence Structure','Satzbau'),writing:t('Writing','Schreiben')};
 $$('.subbtn').forEach(b=>b.textContent=subt[b.dataset.practice]||b.textContent);
 const vb={list:t('List','Liste'),match:t('Match Game','Zuordnen'),type:t('Type the Word','Wort tippen')}; $$('.vocabbtn').forEach(b=>b.textContent=vb[b.dataset.vmode]||b.textContent);
 const eb={cefr:'A1–B2 Exam',photo:t('Photo description','Bildbeschreibung'),qa:'Q ↔ A'}; $$('.exambtn').forEach(b=>b.textContent=eb[b.dataset.emode]||b.textContent);
 $('#continueBtn').textContent=t('Continue','Weiter');
 $('#exerciseAnswerInput').placeholder=t('Type your answer','Deine Antwort'); $('#typingInput').placeholder=t('Type here','Hier schreiben'); $('#listenInput').placeholder=t('Answer in a full sentence','Antworte in einem ganzen Satz'); $('#structureAnswer').placeholder=t('Build the correct sentence','Bilde den richtigen Satz'); $('#writingInput').placeholder=t('Write here','Hier schreiben'); $('#typeWordInput').placeholder=t('Type German word','Deutsches Wort schreiben'); $('#conjInput').placeholder=t('Type form','Form eingeben'); $('#qaInput').placeholder=t('Write here','Hier schreiben');
}

const FIXED_RULES_BANK=[
  {
    "topic": "Prepositions",
    "rule": "mit + Dativ",
    "question": "Ich fahre ___ dem Bus zur Arbeit.",
    "answer": "mit",
    "explanation": "Die Präposition 'mit' steht immer mit Dativ: mit dem Bus, mit der Bahn, mit dem Auto."
  },
  {
    "topic": "Prepositions",
    "rule": "nach + Dativ",
    "question": "Wir fahren morgen ___ Berlin.",
    "answer": "nach",
    "explanation": "Für Städte und Länder ohne Artikel benutzt man meistens 'nach': nach Berlin, nach Deutschland."
  },
  {
    "topic": "Prepositions",
    "rule": "bei + Dativ",
    "question": "Am Wochenende bin ich ___ meiner Freundin.",
    "answer": "bei",
    "explanation": "'bei' steht immer mit Dativ: bei meiner Freundin, beim Arzt, bei der Arbeit."
  },
  {
    "topic": "Prepositions",
    "rule": "von + Dativ",
    "question": "Der Brief ist ___ meinem Lehrer.",
    "answer": "von",
    "explanation": "'von' verlangt Dativ: von meinem Lehrer, von der Firma, vom Chef."
  },
  {
    "topic": "Prepositions",
    "rule": "zu + Dativ",
    "question": "Ich gehe heute ___ meiner Tante.",
    "answer": "zu",
    "explanation": "'zu' verlangt Dativ. Mit Artikeln gibt es oft Kurzformen: zum, zur."
  },
  {
    "topic": "Prepositions",
    "rule": "aus + Dativ",
    "question": "Er kommt ___ der Schweiz.",
    "answer": "aus",
    "explanation": "'aus' benutzt man oft für Herkunft oder Material und es verlangt Dativ."
  },
  {
    "topic": "Prepositions",
    "rule": "für + Akkusativ",
    "question": "Das Geschenk ist ___ meinen Bruder.",
    "answer": "für",
    "explanation": "'für' verlangt immer Akkusativ: für meinen Bruder, für die Mutter."
  },
  {
    "topic": "Prepositions",
    "rule": "ohne + Akkusativ",
    "question": "Ich gehe nicht ___ meinen Regenschirm raus.",
    "answer": "ohne",
    "explanation": "'ohne' steht immer mit Akkusativ: ohne meinen Regenschirm."
  },
  {
    "topic": "Prepositions",
    "rule": "um + Akkusativ",
    "question": "Wir sitzen ___ den Tisch.",
    "answer": "um",
    "explanation": "'um' steht mit Akkusativ: um den Tisch, um die Ecke."
  },
  {
    "topic": "Prepositions",
    "rule": "durch + Akkusativ",
    "question": "Wir gehen ___ den Park.",
    "answer": "durch",
    "explanation": "'durch' verlangt Akkusativ: durch den Park, durch die Stadt."
  },
  {
    "topic": "Prepositions",
    "rule": "gegen + Akkusativ",
    "question": "Das Auto ist ___ einen Baum gefahren.",
    "answer": "gegen",
    "explanation": "'gegen' steht mit Akkusativ: gegen einen Baum, gegen die Wand."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "warten auf + Akk",
    "question": "Ich warte ___ den Zug.",
    "answer": "auf",
    "explanation": "'warten' verbindet sich mit 'auf' + Akkusativ: auf den Zug, auf den Bus."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "denken an + Akk",
    "question": "Ich denke oft ___ meine Familie.",
    "answer": "an",
    "explanation": "'denken' braucht hier 'an' + Akkusativ: an meine Familie, an den Termin."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "sprechen mit + Dat",
    "question": "Morgen spreche ich ___ dem Chef.",
    "answer": "mit",
    "explanation": "'sprechen mit' verlangt Dativ: mit dem Chef, mit der Kollegin."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "sprechen über + Akk",
    "question": "Wir sprechen ___ das Problem.",
    "answer": "über",
    "explanation": "'sprechen über' verlangt Akkusativ: über das Problem, über den Plan."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "sich interessieren für + Akk",
    "question": "Sie interessiert sich ___ deutsche Geschichte.",
    "answer": "für",
    "explanation": "'sich interessieren für' verlangt Akkusativ."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "sich freuen auf + Akk",
    "question": "Ich freue mich ___ den Urlaub.",
    "answer": "auf",
    "explanation": "'sich freuen auf' benutzt man für etwas in der Zukunft."
  },
  {
    "topic": "Verb + Preposition",
    "rule": "sich freuen über + Akk",
    "question": "Er freut sich ___ das Geschenk.",
    "answer": "über",
    "explanation": "'sich freuen über' benutzt man für etwas, das schon da ist."
  },
  {
    "topic": "Verb + Case",
    "rule": "helfen + Dativ",
    "question": "Ich helfe ___ Frau mit den Taschen.",
    "answer": "der",
    "explanation": "'helfen' verlangt Dativ: der Frau, dem Mann, den Kindern."
  },
  {
    "topic": "Verb + Case",
    "rule": "danken + Dativ",
    "question": "Wir danken ___ Lehrer für die Hilfe.",
    "answer": "dem",
    "explanation": "'danken' verlangt Dativ: dem Lehrer, der Lehrerin."
  },
  {
    "topic": "Verb + Case",
    "rule": "gefallen + Dativ",
    "question": "Der Film gefällt ___ Kindern.",
    "answer": "den",
    "explanation": "'gefallen' steht mit Dativ: den Kindern, der Mutter."
  },
  {
    "topic": "Verb + Case",
    "rule": "sehen + Akkusativ",
    "question": "Ich sehe ___ Mann an der Haltestelle.",
    "answer": "den",
    "explanation": "'sehen' verlangt ein direktes Objekt im Akkusativ."
  },
  {
    "topic": "Verb + Case",
    "rule": "brauchen + Akkusativ",
    "question": "Wir brauchen ___ neuen Computer.",
    "answer": "einen",
    "explanation": "'brauchen' verlangt Akkusativ: einen Computer, eine Wohnung."
  },
  {
    "topic": "Cases",
    "rule": "Wohin? = Akkusativ",
    "question": "Ich gehe in ___ Küche.",
    "answer": "die",
    "explanation": "Bei Bewegung/Wohin? mit Wechselpräpositionen benutzt man Akkusativ: in die Küche."
  },
  {
    "topic": "Cases",
    "rule": "Wo? = Dativ",
    "question": "Ich bin in ___ Küche.",
    "answer": "der",
    "explanation": "Bei Ort/Wo? mit Wechselpräpositionen benutzt man Dativ: in der Küche."
  },
  {
    "topic": "Cases",
    "rule": "auf + Akk bei Bewegung",
    "question": "Sie legt das Buch auf ___ Tisch.",
    "answer": "den",
    "explanation": "Legen = Bewegung. Deshalb: auf den Tisch."
  },
  {
    "topic": "Cases",
    "rule": "auf + Dat bei Ort",
    "question": "Das Buch liegt auf ___ Tisch.",
    "answer": "dem",
    "explanation": "Liegen = Ort. Deshalb: auf dem Tisch."
  },
  {
    "topic": "Cases",
    "rule": "an + Akk bei Bewegung",
    "question": "Wir hängen das Bild an ___ Wand.",
    "answer": "die",
    "explanation": "Hängen (aktiv) = Bewegung → Akkusativ: an die Wand."
  },
  {
    "topic": "Cases",
    "rule": "an + Dat bei Ort",
    "question": "Das Bild hängt an ___ Wand.",
    "answer": "der",
    "explanation": "Ort → Dativ: an der Wand."
  },
  {
    "topic": "Articles",
    "rule": "maskulin Akkusativ",
    "question": "Ich habe ___ neuen Termin.",
    "answer": "einen",
    "explanation": "Maskulin nach 'haben' = Akkusativ: einen neuen Termin."
  },
  {
    "topic": "Articles",
    "rule": "maskulin Dativ",
    "question": "Ich spreche mit ___ netten Nachbarn.",
    "answer": "dem",
    "explanation": "'mit' + Dativ; maskulin Dativ = dem netten Nachbarn."
  },
  {
    "topic": "Articles",
    "rule": "feminin Dativ",
    "question": "Ich fahre mit ___ Kollegin zur Arbeit.",
    "answer": "der",
    "explanation": "'mit' verlangt Dativ; feminin Dativ = der Kollegin."
  },
  {
    "topic": "Articles",
    "rule": "neutrum Nominativ",
    "question": "___ Kind spielt im Garten.",
    "answer": "Das",
    "explanation": "Subjekt im Nominativ, Neutrum = das Kind."
  },
  {
    "topic": "Connectors",
    "rule": "weil → Verb am Ende",
    "question": "Ich bleibe zu Hause, weil ich krank ___.",
    "answer": "bin",
    "explanation": "Nach 'weil' steht das konjugierte Verb am Ende: weil ich krank bin."
  },
  {
    "topic": "Connectors",
    "rule": "obwohl → Verb am Ende",
    "question": "Obwohl es regnet, ___ wir spazieren.",
    "answer": "gehen",
    "explanation": "Im Nebensatz mit obwohl steht das Verb am Ende; im Hauptsatz bleibt Verbposition 2."
  },
  {
    "topic": "Connectors",
    "rule": "deshalb → Verb Position 2",
    "question": "Ich bin müde, deshalb ___ ich früh ins Bett.",
    "answer": "gehe",
    "explanation": "'deshalb' ist kein Nebensatz-Einleiter; das Verb bleibt in Position 2."
  },
  {
    "topic": "Connectors",
    "rule": "damit = anderer Subjektbezug",
    "question": "Ich erkläre alles noch einmal, damit ihr es besser ___.",
    "answer": "versteht",
    "explanation": "Bei 'damit' folgt ein Nebensatz mit eigenem Subjekt."
  },
  {
    "topic": "Sentence Order",
    "rule": "Verb Position 2",
    "question": "Heute ___ ich keine Zeit.",
    "answer": "habe",
    "explanation": "Wenn ein Zeitwort zuerst steht, bleibt das Verb auf Position 2."
  },
  {
    "topic": "Separable Verbs",
    "rule": "trennbar im Hauptsatz",
    "question": "Ich ___ morgen früh um sechs Uhr ___.",
    "answer": "stehe / auf",
    "explanation": "Trennbare Verben teilen sich im Hauptsatz: Ich stehe ... auf."
  },
  {
    "topic": "Perfect",
    "rule": "sein + Bewegung",
    "question": "Gestern ___ wir sehr spät angekommen.",
    "answer": "sind",
    "explanation": "Ankommen bildet das Perfekt mit 'sein': wir sind angekommen."
  },
  {
    "topic": "Reflexive",
    "rule": "sich beeilen",
    "question": "Wir müssen ___ beeilen.",
    "answer": "uns",
    "explanation": "Reflexivpronomen im Präsens: ich mich, du dich, wir uns."
  }
];
const TOPIC_FLOW_BANK=[
  {
    "topic": "Articles",
    "intro": "Artikel zeigen Genus und oft auch den Fall. Nominativ: der / die / das. Im Akkusativ ändert sich nur maskulin: der → den. Nach ein-Wörtern ändern sich Formen wie ein / einen / einem.",
    "question": "Ich sehe ___ Mann im Café.",
    "answer": "den",
    "options": [
      "der",
      "den",
      "dem"
    ],
    "explanation": "Das Verb 'sehen' verlangt ein direktes Objekt im Akkusativ. Maskulin Akkusativ = den."
  },
  {
    "topic": "Articles",
    "intro": "Bestimmte und unbestimmte Artikel ändern sich nach Kasus. Besonders wichtig ist maskulin: der → den → dem.",
    "question": "Wir sprechen mit ___ neuen Lehrer.",
    "answer": "dem",
    "options": [
      "den",
      "dem",
      "der"
    ],
    "explanation": "'mit' verlangt Dativ. Maskulin Dativ = dem neuen Lehrer."
  },
  {
    "topic": "Cases",
    "intro": "Nominativ = Subjekt. Akkusativ = direktes Objekt. Dativ = indirektes Objekt oder Objekt nach bestimmten Verben/Präpositionen. Fragewörter: Wer? Wen/Was? Wem?",
    "question": "Ich gebe ___ Kind einen Ball.",
    "answer": "dem",
    "options": [
      "das",
      "den",
      "dem"
    ],
    "explanation": "Bei 'geben' bekommt jemand etwas: dem Kind (Dativ) einen Ball (Akkusativ)."
  },
  {
    "topic": "Cases",
    "intro": "Bei Wechselpräpositionen musst du zwischen Bewegung (Wohin? → Akkusativ) und Ort (Wo? → Dativ) unterscheiden.",
    "question": "Wir gehen auf ___ Markt.",
    "answer": "den",
    "options": [
      "dem",
      "den",
      "der"
    ],
    "explanation": "Gehen zeigt Bewegung/Wohin? → Akkusativ: auf den Markt."
  },
  {
    "topic": "Prepositions",
    "intro": "Einige Präpositionen haben immer den gleichen Fall: mit, nach, bei, von, zu = Dativ; für, ohne, um, durch, gegen = Akkusativ.",
    "question": "Das Geschenk ist ___ meine Mutter.",
    "answer": "für",
    "options": [
      "mit",
      "für",
      "bei"
    ],
    "explanation": "'für' steht immer mit Akkusativ: für meine Mutter."
  },
  {
    "topic": "Prepositions",
    "intro": "Wechselpräpositionen können mit Akkusativ oder Dativ stehen. Entscheidend ist die Bedeutung: Bewegung oder Ort.",
    "question": "Das Bild hängt an ___ Wand.",
    "answer": "der",
    "options": [
      "die",
      "der",
      "dem"
    ],
    "explanation": "Hängt = Ort/Wo? → Dativ: an der Wand."
  },
  {
    "topic": "Reflexive verbs",
    "intro": "Reflexive Verben brauchen ein Reflexivpronomen: ich mich, du dich, er/sie sich, wir uns, ihr euch. Manche Verben sind immer reflexiv, andere nicht.",
    "question": "Ich interessiere ___ für Deutsch und Geschichte.",
    "answer": "mich",
    "options": [
      "mich",
      "mir",
      "dich"
    ],
    "explanation": "'sich interessieren für' benutzt ein Akkusativ-Reflexivpronomen: ich interessiere mich."
  },
  {
    "topic": "Reflexive verbs",
    "intro": "Im Perfekt stehen Reflexivpronomen wie gewohnt vor den Ergänzungen, das Partizip steht am Satzende.",
    "question": "Wir haben ___ gestern sehr gefreut.",
    "answer": "uns",
    "options": [
      "uns",
      "euch",
      "sich"
    ],
    "explanation": "Subjekt 'wir' → Reflexivpronomen 'uns': Wir haben uns gestern sehr gefreut."
  },
  {
    "topic": "Verb + Preposition",
    "intro": "Viele deutsche Verben verbinden sich fest mit bestimmten Präpositionen und Fällen: warten auf + Akk, sprechen mit + Dat, denken an + Akk.",
    "question": "Er spricht morgen ___ seiner Chefin.",
    "answer": "mit",
    "options": [
      "mit",
      "an",
      "auf"
    ],
    "explanation": "'sprechen mit' verlangt Dativ: mit seiner Chefin."
  },
  {
    "topic": "Verb + Preposition",
    "intro": "Lerne Verb + Präposition immer zusammen. Nur so wird der richtige Fall automatisch.",
    "question": "Ich denke oft ___ unseren Urlaub.",
    "answer": "an",
    "options": [
      "an",
      "auf",
      "mit"
    ],
    "explanation": "'denken an' verlangt Akkusativ: an unseren Urlaub."
  },
  {
    "topic": "Word order",
    "intro": "Im Hauptsatz steht das konjugierte Verb immer auf Position 2. Wenn ein anderes Element zuerst kommt, steht das Subjekt oft direkt danach.",
    "question": "Morgen ___ ich im Homeoffice.",
    "answer": "arbeite",
    "options": [
      "arbeite",
      "ich arbeite",
      "arbeiten"
    ],
    "explanation": "Zeitangabe zuerst, aber Verb bleibt auf Position 2: Morgen arbeite ich ..."
  },
  {
    "topic": "Word order",
    "intro": "Im Nebensatz mit weil, dass, wenn, obwohl steht das konjugierte Verb am Ende.",
    "question": "Ich bleibe zu Hause, weil ich starke Kopfschmerzen ___.",
    "answer": "habe",
    "options": [
      "habe",
      "hatte",
      "bin"
    ],
    "explanation": "Nach 'weil' steht das Verb am Ende: weil ich starke Kopfschmerzen habe."
  },
  {
    "topic": "Perfekt",
    "intro": "Das Perfekt bildet man mit haben oder sein + Partizip II. Bewegung und Zustandsänderung nehmen oft sein.",
    "question": "Gestern ___ ich lange im Büro gearbeitet.",
    "answer": "habe",
    "options": [
      "habe",
      "bin",
      "werde"
    ],
    "explanation": "'arbeiten' bildet das Perfekt mit 'haben': ich habe gearbeitet."
  },
  {
    "topic": "Perfekt",
    "intro": "Bei trennbaren Verben steht die Vorsilbe im Partizip vor 'ge': ankommen → angekommen, aufstehen → aufgestanden.",
    "question": "Wann ___ ihr zu Hause angekommen?",
    "answer": "seid",
    "options": [
      "habt",
      "seid",
      "werdet"
    ],
    "explanation": "'ankommen' bildet Perfekt mit 'sein': ihr seid angekommen."
  },
  {
    "topic": "Imperativ",
    "intro": "Imperativformen: du-Form meist ohne Pronomen, ihr-Form = Präsens ohne ihr, Sie-Form = Infinitiv + Sie.",
    "question": "___ bitte leise! (du, sein)",
    "answer": "Sei",
    "options": [
      "Sei",
      "Bist",
      "Seid"
    ],
    "explanation": "Der Imperativ von 'sein' in der du-Form lautet 'Sei!'."
  },
  {
    "topic": "Imperativ",
    "intro": "Bei trennbaren Verben bleibt die Vorsilbe auch im Imperativ getrennt: Ruf an! Komm mit!",
    "question": "___ mich morgen an! (du, anrufen)",
    "answer": "Ruf",
    "options": [
      "Ruf",
      "Rufe",
      "Anruf"
    ],
    "explanation": "Du-Imperativ von anrufen: Ruf ... an!"
  },
  {
    "topic": "um...zu / damit",
    "intro": "'um ... zu' benutzt man bei gleichem Subjekt. 'damit' benutzt man bei unterschiedlichem Subjekt oder wenn man einen ganzen Nebensatz braucht.",
    "question": "Ich lerne viel, ___ ich die Prüfung bestehe.",
    "answer": "damit",
    "options": [
      "damit",
      "um",
      "obwohl"
    ],
    "explanation": "Mit eigenem Subjekt 'ich' im Nebensatz benutzt man 'damit'."
  },
  {
    "topic": "um...zu / damit",
    "intro": "Bei gleichem Subjekt ist 'um ... zu' meist kürzer und natürlicher.",
    "question": "Er spart Geld, ___ ein Auto zu kaufen.",
    "answer": "um",
    "options": [
      "um",
      "damit",
      "weil"
    ],
    "explanation": "Gleiches Subjekt → um ... zu."
  },
  {
    "topic": "werden",
    "intro": "'werden' kann heißen: 1. werden = become, 2. Futur, 3. Passiv. Die Bedeutung hängt vom Zusammenhang ab.",
    "question": "Nächstes Jahr ___ ich B1 machen.",
    "answer": "werde",
    "options": [
      "werde",
      "bin",
      "habe"
    ],
    "explanation": "Hier zeigt 'werden' Futur: Ich werde B1 machen."
  },
  {
    "topic": "werden",
    "intro": "Im Passiv steht 'werden' + Partizip II: Das Auto wird repariert.",
    "question": "Die Tür ___ morgen repariert.",
    "answer": "wird",
    "options": [
      "wird",
      "ist",
      "hat"
    ],
    "explanation": "Passiv Präsens: Die Tür wird repariert."
  },
  {
    "topic": "Modal verbs",
    "intro": "Modalverben verändern die Bedeutung des Vollverbs: können, müssen, wollen, sollen, dürfen, mögen/möchten. Das Vollverb steht am Satzende im Infinitiv.",
    "question": "Ich ___ heute lange arbeiten.",
    "answer": "muss",
    "options": [
      "muss",
      "arbeite",
      "bin"
    ],
    "explanation": "Mit Modalverb steht das Vollverb am Ende: Ich muss heute lange arbeiten."
  },
  {
    "topic": "Modal verbs",
    "intro": "Im Präteritum sind Modalverben im Alltag sehr häufig: ich konnte, musste, wollte, durfte ...",
    "question": "Früher ___ ich nicht so gut Deutsch sprechen.",
    "answer": "konnte",
    "options": [
      "konnte",
      "kann",
      "gekonnt"
    ],
    "explanation": "Präteritum von können: ich konnte."
  },
  {
    "topic": "Nebensätze",
    "intro": "Häufige Nebensatz-Einleiter sind weil, dass, wenn, obwohl, nachdem. Das Verb steht am Ende des Nebensatzes.",
    "question": "Obwohl er müde war, ___ er noch gelernt.",
    "answer": "hat",
    "options": [
      "hat",
      "war",
      "ist"
    ],
    "explanation": "Im Hauptsatz bleibt das Verb auf Position 2: Obwohl ..., hat er ..."
  },
  {
    "topic": "Nebensätze",
    "intro": "Bei zwei Verben im Perfekt im Nebensatz steht das konjugierte Verb oft ganz am Ende: ..., weil er spät gekommen ist.",
    "question": "Ich weiß, dass sie gestern sehr spät nach Hause gekommen ___.",
    "answer": "ist",
    "options": [
      "ist",
      "hat",
      "war"
    ],
    "explanation": "Perfekt im Nebensatz: ... gekommen ist."
  },
  {
    "topic": "Trennbare Verben",
    "intro": "Trennbare Verben teilen sich im Hauptsatz, aber im Infinitiv und Partizip bleiben sie zusammen: aufstehen, aufzustehen, aufgestanden.",
    "question": "Wann ___ du morgens ___?",
    "answer": "stehst / auf",
    "options": [
      "stehst / auf",
      "aufstehst /",
      "bist / aufgestanden"
    ],
    "explanation": "Hauptsatz Präsens: Du stehst ... auf."
  },
  {
    "topic": "Question forms",
    "intro": "Ja/Nein-Fragen haben das Verb zuerst. W-Fragen beginnen mit einem Fragewort, danach kommt das Verb.",
    "question": "___ kommst du heute nach Hause?",
    "answer": "Wann",
    "options": [
      "Wann",
      "Wenn",
      "Als"
    ],
    "explanation": "Hier braucht man ein Fragewort: Wann kommst du ...?"
  },
  {
    "topic": "Question forms",
    "intro": "Antworten sollten als ganzer Satz geübt werden, nicht nur mit einem Wort.",
    "question": "Forme eine Frage: 'Ich arbeite seit drei Jahren hier.' → '___ arbeitest du schon hier?'",
    "answer": "Wie lange",
    "options": [
      "Wie lange",
      "Wann",
      "Warum"
    ],
    "explanation": "Für Dauer fragt man: Wie lange?"
  }
];
function fillGroupedPracticeSelectors(){
  if($('#fixedTopicSelect')) $('#fixedTopicSelect').innerHTML=uniqueBy(FIXED_RULES_BANK,x=>x.topic).map(x=>`<option>${x.topic}</option>`).join('');
  if($('#topicFlowSelect')) $('#topicFlowSelect').innerHTML=uniqueBy(TOPIC_FLOW_BANK,x=>x.topic).map(x=>`<option>${x.topic}</option>`).join('');
  renderRevisionPanel();
}
function newFixedRule(){
  const topic=$('#fixedTopicSelect')?.value || 'Prepositions';
  const pool=FIXED_RULES_BANK.filter(x=>x.topic===topic); state.currentFixed=shuffle(pool)[0]||FIXED_RULES_BANK[0];
  if(!state.currentFixed) return; $('#fixedRuleCard').textContent=state.currentFixed.rule; $('#fixedQuestion').textContent=state.currentFixed.question; $('#fixedChoices').innerHTML=''; $('#fixedInput').value=''; $('#fixedFeedback').textContent=''; $('#fixedExplanation').classList.add('hidden');
}
function checkFixedRule(){ const u=$('#fixedInput').value.trim(); const q=state.currentFixed; if(!q) return; const ok=compareAnswerLoose(u,q.answer); $('#fixedFeedback').textContent=ok? 'Correct':'Try again'; $('#fixedExplanation').classList.remove('hidden'); $('#fixedExplanation').textContent=q.explanation; }
function showFixedRule(){ const q=state.currentFixed; if(!q) return; $('#fixedFeedback').textContent='Answer: '+q.answer; $('#fixedExplanation').classList.remove('hidden'); $('#fixedExplanation').textContent=q.explanation; }
function newTopicFlow(){ const topic=$('#topicFlowSelect')?.value || 'Articles'; const pool=TOPIC_FLOW_BANK.filter(x=>x.topic===topic); state.currentTopicFlow=shuffle(pool)[0]||TOPIC_FLOW_BANK[0]; const q=state.currentTopicFlow; if(!q) return; $('#topicFlowIntro').textContent=q.intro; $('#topicFlowQuestion').textContent=q.question; $('#topicFlowChoices').innerHTML=(q.options||[]).map(o=>`<button class="chip" type="button">${o}</button>`).join(''); $$('#topicFlowChoices .chip').forEach(b=>b.onclick=()=>$('#topicFlowInput').value=b.textContent); $('#topicFlowInput').value=''; $('#topicFlowFeedback').textContent=''; $('#topicFlowExplanation').classList.add('hidden'); }
function checkTopicFlow(){ const q=state.currentTopicFlow; if(!q) return; const ok=compareAnswerLoose($('#topicFlowInput').value,q.answer); $('#topicFlowFeedback').textContent=ok? 'Correct':'Try again'; $('#topicFlowExplanation').classList.remove('hidden'); $('#topicFlowExplanation').textContent=q.explanation; }
function showTopicFlow(){ const q=state.currentTopicFlow; if(!q) return; $('#topicFlowFeedback').textContent='Answer: '+q.answer; $('#topicFlowExplanation').classList.remove('hidden'); $('#topicFlowExplanation').textContent=q.explanation; }
function renderRevisionPanel(){
  const host=$('#revisionTopicGrid'); if(!host) return; const topics=uniqueBy([...(state.data.exercises.filter(x=>x.topic).map(x=>({topic:x.topic}))), ...(TOPIC_FLOW_BANK.map(x=>({topic:x.topic}))), ...(FIXED_RULES_BANK.map(x=>({topic:x.topic})))],x=>x.topic).map(x=>x.topic).slice(0,30);
  host.innerHTML=topics.map(t=>`<button type="button" class="chip-toggle" data-rtopic="${t}">${t}</button>`).join('');
  $$('#revisionTopicGrid .chip-toggle').forEach(b=>b.onclick=()=>b.classList.toggle('active'));
}
function selectedRevisionTopics(){ return $$('#revisionTopicGrid .chip-toggle.active').map(b=>b.dataset.rtopic); }
function startRevisionMix(){ const topics=selectedRevisionTopics(); state.revisionPool=shuffle(state.data.exercises.filter(e=>!topics.length || topics.includes(e.topic) || topics.includes(e.type))); newRevisionMix(); }
function newRevisionMix(){ const pool=state.revisionPool?.length?state.revisionPool:shuffle(state.data.exercises); const q=pool[0]; state.currentRevision=q||null; if(!q){ $('#revisionQuestion').textContent='No revision items found.'; return; } $('#revisionMeta').classList.remove('hidden'); $('#revisionMeta').textContent=`${q.level||'A1'} • ${q.topic||q.type||'General'}`; $('#revisionQuestion').textContent=q.question; $('#revisionInput').value=''; $('#revisionFeedback').textContent=''; $('#revisionExplanation').classList.add('hidden'); }
function checkRevisionMix(){ const q=state.currentRevision; if(!q) return; const ok=compareAnswerLoose($('#revisionInput').value,q.answer); $('#revisionFeedback').textContent=ok? 'Correct':'Try again'; $('#revisionExplanation').classList.remove('hidden'); $('#revisionExplanation').textContent=q.explanation||''; }
function showRevisionMix(){ const q=state.currentRevision; if(!q) return; $('#revisionFeedback').textContent='Answer: '+q.answer; $('#revisionExplanation').classList.remove('hidden'); $('#revisionExplanation').textContent=q.explanation||''; }


function playTone(kind='ok'){
  if(store.soundOn===false) return;
  try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sine'; o.frequency.value=kind==='ok'?720:kind==='warn'?440:520; g.gain.value=0.0001; o.connect(g); g.connect(ctx.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime+0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.18); o.stop(ctx.currentTime+0.2); }catch(e){}
}
function overallAccuracy(){ const d=today(); return Math.round((d.correctExercises/Math.max(1,d.attemptedExercises))*100)||0; }
function totalStudyDays(){ return Object.keys(store.daily||{}).length; }
function buildAchievements(){
 const d=today();
 const defs=[
  {key:'first_steps',label:'🌱 First Steps',hit:()=>store.xp>=10},
  {key:'streak_3',label:'🔥 3-Day Streak',hit:()=>store.streak>=3},
  {key:'streak_7',label:'🔥 7-Day Streak',hit:()=>store.streak>=7},
  {key:'xp_100',label:'⭐ 100 XP',hit:()=>store.xp>=100},
  {key:'xp_500',label:'⭐ 500 XP',hit:()=>store.xp>=500},
  {key:'writer',label:'✍️ Writing Starter',hit:()=>Object.values(store.daily||{}).reduce((n,v)=>n+(v.writingDone||0),0)>=5},
  {key:'listener',label:'🎧 Listening Starter',hit:()=>Object.values(store.daily||{}).reduce((n,v)=>n+(v.listeningDone||0),0)>=5},
  {key:'reader',label:'📘 Passage Reader',hit:()=>Object.values(store.daily||{}).reduce((n,v)=>n+((v.uniquePassages||[]).length||0),0)>=10},
  {key:'reviewer',label:'🧠 Reviewer',hit:()=>dueReviews().length===0 && (store.reviewQueue||[]).length>=3},
  {key:'accuracy_80',label:'🎯 80% Accuracy',hit:()=>overallAccuracy()>=80 && today().attemptedExercises>=10},
 ];
 return defs.map(x=>({...x, unlocked:x.hit()}));
}
function renderHeatmap(){ const wrap=$('#heatmapWrap'); if(!wrap) return; const days=[]; for(let i=27;i>=0;i--){ const dt=new Date(); dt.setDate(dt.getDate()-i); const key=dt.toISOString().slice(0,10); const d=store.daily?.[key]||{}; const score=((d.correctExercises||0)+(d.uniqueVocab||[]).length+(d.writingDone||0)+((d.uniquePassages||[]).length||0)); let cls=0; if(score>=1) cls=1; if(score>=5) cls=2; if(score>=12) cls=3; if(score>=24) cls=4; days.push(`<div class="heat-cell heat-${cls}" title="${key} • ${score}">${dt.getDate()}</div>`); } wrap.innerHTML=days.join(''); }
function renderStatsCenter(){ const host=$('#statsCenter'); if(!host) return; const all=Object.values(store.daily||{}); const totalExercises=all.reduce((n,v)=>n+(v.attemptedExercises||0),0); const totalCorrect=all.reduce((n,v)=>n+(v.correctExercises||0),0); const totalVocab=all.reduce((n,v)=>n+((v.uniqueVocab||[]).length||0),0); const totalPassages=all.reduce((n,v)=>n+((v.uniquePassages||[]).length||0),0); const totalWriting=all.reduce((n,v)=>n+(v.writingDone||0),0); host.innerHTML=`<div><strong>${t('Study days','Lerntage')}:</strong> ${totalStudyDays()}</div><div><strong>${t('Accuracy','Genauigkeit')}:</strong> ${Math.round((totalCorrect/Math.max(1,totalExercises))*100)||0}%</div><div><strong>${t('Exercises done','Gelöste Aufgaben')}:</strong> ${totalCorrect}/${totalExercises}</div><div><strong>${t('Vocabulary studied','Gelernte Wörter')}:</strong> ${totalVocab}</div><div><strong>${t('Passages completed','Bearbeitete Passagen')}:</strong> ${totalPassages}</div><div><strong>${t('Writing tasks','Schreibaufgaben')}:</strong> ${totalWriting}</div>`; }
function renderBadges(){ const wrap=$('#badgesWrap'); if(!wrap) return; const badges=buildAchievements(); wrap.innerHTML=badges.map(b=>`<div class="badge-card ${b.unlocked?'':'locked'}"><strong>${b.label}</strong><div class="muted tiny">${b.unlocked?t('Unlocked','Freigeschaltet'):t('Locked','Gesperrt')}</div></div>`).join(''); }
function roadmapSuggestions(){ const weak=getWeakAreas().slice(0,3).map(w=>w.type); const focus=store.focusTopic; const due=dueReviews().length; const plan=[]; if(focus) plan.push(`${t('Main focus','Hauptfokus')}: ${focus}`); if(weak.length) plan.push(`${t('Weak now','Jetzt schwach')}: ${weak.join(', ')}`); if(due) plan.push(`${t('Reviews due','Fällige Wiederholungen')}: ${due}`); if(store.goal==='b1_exam') plan.push(t('Next roadmap: connectors → word order → writing','Nächste Roadmap: Konnektoren → Wortstellung → Schreiben')); else if(store.goal==='work_german') plan.push(t('Next roadmap: office German → email writing → speaking','Nächste Roadmap: Bürodeutsch → E-Mails → Sprechen')); else plan.push(t('Next roadmap: daily situations → cases → confidence','Nächste Roadmap: Alltagssituationen → Fälle → Sicherheit')); return plan; }
function renderSmartCoach(){ const host=$('#smartCoachWrap'); if(!host) return; const weak=getWeakAreas().slice(0,5); const suggestions=roadmapSuggestions(); host.innerHTML=`<strong>${t('Coach recommendation','Coach-Empfehlung')}</strong><br>${suggestions.join('<br>')}<hr><strong>${t('Top weak areas','Top-Schwächen')}</strong><br>${(weak.length?weak.map(w=>`${w.type} (${w.wrong}/${w.right})`).join('<br>'):t('No weak areas yet.','Noch keine Schwächen.'))}`; const road=$('#coachRoadmap'); if(road) road.innerHTML=suggestions.join('<br>'); }
function exportProgress(){ const payload={store}; const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='german-coach-progress.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500); }
function importProgressFile(file){ if(!file) return; const reader=new FileReader(); reader.onload=()=>{ try{ const parsed=JSON.parse(reader.result); if(parsed && parsed.store){ Object.assign(store, parsed.store); saveStore(); renderAll(); } }catch(e){ alert('Import failed'); } }; reader.readAsText(file); }
function openOnboarding(){ $('#onboardingModal')?.classList.remove('hidden'); }
function closeOnboarding(){ $('#onboardingModal')?.classList.add('hidden'); }
function saveOnboarding(){ store.goal=$('#onboardingGoal')?.value||store.goal; store.confidenceLevel=$('#onboardingLevel')?.value||store.confidenceLevel; store.focusTopic=$('#onboardingFocus')?.value||store.focusTopic; store.onboardingDone=true; saveStore(); closeOnboarding(); renderApp(); }
function startQuickExam(){ const weak=getWeakAreas().slice(0,2).map(w=>w.type); let pool=state.data.exercises.filter(e=>!weak.length || weak.includes(e.type)||weak.includes(e.topic)); if(pool.length<8) pool=state.data.exercises; pool=shuffle(uniqueBy(pool,e=>(e.question||'')+'|'+(e.answer||''))).slice(0,8); state.currentExam={level:'quick',items:pool,answers:{}}; const wrap=$('#examWrap'); wrap.innerHTML=pool.map((q,i)=>`<div class="note-block"><div><strong>${i+1}.</strong> ${q.question}</div><input data-exam="${i}" placeholder="${t('Type your answer','Deine Antwort')}"></div>`).join(''); $$('[data-exam]').forEach(inp=>inp.oninput=e=>state.currentExam.answers[e.target.dataset.exam]=e.target.value); $('#examResult').textContent=t('Quick simulation loaded.','Schnellsimulation geladen.'); }

function renderApp(){
 $('#aboutText').innerHTML=`<strong>${t('About','Über')}:</strong> ${t('German Coach works fully in the browser. Your progress is saved locally on this device. Use Practice for drills, Vocabulary for word learning, Grammar for master tables and rules, Weak Areas for targeted review, and Exam Mode for simulations.','German Coach läuft vollständig im Browser. Dein Fortschritt wird lokal auf diesem Gerät gespeichert. Nutze Üben für Aufgaben, Wortschatz zum Lernen neuer Wörter, Grammatik für Mastertabellen und Regeln, Schwächen für gezieltes Wiederholen und Prüfungsmodus für Simulationen.')}`;
 const weak=getWeakAreas();
 const counts=[
   [t('Passages','Passagen'), state.data.passages.length],
   [t('Exercises','Übungen'), state.data.exercises.length],
   [t('Vocabulary items','Wortschatz-Einträge'), state.data.vocab.length],
   [t('Flashcards','Karteikarten'), state.data.flashcards.length],
   [t('Verbs','Verben'), (state.data.conjugation.length + (state.data.verbs?.length||0))],
   [t('Grammar notes','Grammatiknotizen'), Object.keys(state.data.notes||{}).length],
   [t('Sentence entries','Satz-Einträge'), Object.values(state.data.sentences||{}).reduce((n,a)=>n+(Array.isArray(a)?a.length:0),0)],
   [t('Leben in Deutschland questions','LiD-Fragen'), (state.data.lid&&state.data.lid.length)||LID_QUESTIONS.length]
 ];
 $('#appCounts').innerHTML='<div class="counts-grid">'+counts.map(([k,v])=>`<div class="count-card"><div class="muted">${k}</div><div class="count-big">${v}</div></div>`).join('')+'</div>';
 const dh=$('#dataHealthText'); if(dh){ const missing=(store.dataHealth&&store.dataHealth.missing)||[]; dh.innerHTML=(store.dataHealth&&store.dataHealth.loaded)?`<span class="good">${t('Data files connected.','Datendateien verbunden.')}</span>`:`<span class="bad">${t('Missing data files: ','Fehlende Datendateien: ')}${missing.join(', ')||'unknown'}</span>`; }
 $('#weakAreaText').innerHTML= weak.length ? `<strong>${t('Current weak areas','Aktuelle Schwächen')}:</strong><br>${weak.slice(0,5).map(w=>`${w.type} (${w.wrong}/${w.right})`).join('<br>')}` : t('No weak areas recorded yet.','Noch keine Schwächen gespeichert.');
 renderWeakSection();
 renderStatsCenter();
 renderBadges();
 renderHeatmap();
 renderSmartCoach();
}

function renderWeakSection(){ const weak=getWeakAreas(); const wrap=$('#weakWrap'); if(!wrap) return; wrap.innerHTML = weak.length ? weak.slice(0,8).map(w=>`<div class="note-block"><strong>${w.type}</strong> — ${t('wrong','falsch')}: ${w.wrong}, ${t('right','richtig')}: ${w.right}<br><button class="ghost weak-practice-btn" data-type="${w.type}">${t('Practice this topic','Dieses Thema üben')}</button></div>`).join('') : `<div class="note-block">${t('No weak areas yet. Work through some tasks first.','Noch keine Schwächen. Löse zuerst einige Aufgaben.')}</div>`; $$('.weak-practice-btn').forEach(b=>b.onclick=()=>openWeakTopic(b.dataset.type)); }
function updateHeader(){ const d=today(),m=mission(); const rows=[['Passages',d.uniquePassages.length,m.passages,'mPassages'],['Exercises',d.correctExercises,m.exercises,'mExercises'],['Vocab',d.uniqueVocab.length,m.vocab,'mVocab'],['Writing',d.writingDone,m.writing,'mWriting']]; rows.forEach(([_,val,target,id])=>{ $('#'+id+'Text').textContent=`${val}/${target}`; $('#'+id+'Bar').style.width=`${Math.min(100,(val/Math.max(1,target))*100)}%`; }); $('#streakPill').textContent=`🔥 ${store.streak}`; $('#xpPill').textContent=`⭐ ${store.xp} XP`; $('#dailyPill').textContent=`${missionPct()}%`; $('#coachPill').textContent=coachText(); $('#todayDrop').innerHTML=`<div>${d.uniquePassages.length} unique passages</div><div>${d.repeatPassages} repeats</div><div>${d.correctExercises}/${d.attemptedExercises} correct exercises</div><div>${d.uniqueVocab.length} vocabulary seen</div><div>${d.writingDone} writing tasks</div><div>${d.listeningDone} listening tasks</div>`; }
function updateUI(){ translateStatic(); updateHeader(); $('#topTitle').textContent=labelSection(state.section); $('#missionPreset').value=store.missionPreset; $('#themeSelect').value=store.theme; $('#languageSelect').value=store.lang; $('#settingsTheme').value=store.theme; $('#settingsLanguage').value=store.lang; $('#countRepeatsToggle').checked=!!store.countRepeats; $('#customPassages').value=store.missionCustom.passages; $('#customExercises').value=store.missionCustom.exercises; $('#customVocab').value=store.missionCustom.vocab; $('#customWriting').value=store.missionCustom.writing; renderGrammar(); renderVocabList(); renderWritingTask(); renderPhotoTask(); renderApp(); }
function renderAll(){ updateUI(); goSection(state.section); }
function goSection(sec){ state.section=sec; store.lastSection=sec; saveStore(); $$('.app-section').forEach(s=>s.classList.add('hidden')); const node=$('#section-'+sec); if(node) node.classList.remove('hidden'); $$('.navbtn').forEach(b=>b.classList.toggle('active',b.dataset.section===sec)); $('#topTitle').textContent=labelSection(sec); $('#sidebar').classList.remove('open'); if(sec==='lid'){ $('#lidShowEnglish').checked=false; newLid(); } if(sec==='practice'){ if($('#listenShowEnglish')) $('#listenShowEnglish').checked=false; if($('#writingShowEnglish')) $('#writingShowEnglish').checked=false; if($('#qaShowEnglish')) $('#qaShowEnglish').checked=false; if(state.practice==='structure') newStructure(); } if(sec==='grammar') renderGrammar(); if(sec==='app') renderApp(); if(sec==='vocab') renderVocabList(); }
function switchPractice(name){
  state.practice=name; state.practiceGroup=groupFromPractice(name); store.lastPractice=name; store.lastPracticeGroup=state.practiceGroup; saveStore();
  $$('.psubbtn').forEach(b=>b.classList.toggle('active',b.dataset.practice===name));
  $$('.practice-subpanel').forEach(p=>p.classList.add('hidden'));
  const panel=$('#practice-'+name); if(panel) panel.classList.remove('hidden');
  switchPracticeGroup(state.practiceGroup);
}
function switchVocab(mode){ state.vocabMode=mode; $$('.vocabbtn').forEach(b=>b.classList.toggle('active',b.dataset.vmode===mode)); ['list','match','type'].forEach(x=>$('#vocab-'+x).classList.toggle('hidden',x!==mode)); }
function switchExam(mode){ state.examMode=mode; $$('.exambtn').forEach(b=>b.classList.toggle('active',b.dataset.emode===mode)); $$('.exam-panel').forEach(p=>p.classList.add('hidden')); $('#exam-'+mode).classList.remove('hidden'); }
function fillFilters(){ const types=uniqueBy(state.data.exercises,e=>e.type).map(e=>e.type).sort(); $('#exerciseTypeFilter').innerHTML='<option value="ALL">All types</option>'+types.map(t=>`<option value="${t}">${t}</option>`).join(''); const topics=uniqueBy(state.data.vocab,v=>v.topic).map(v=>v.topic).filter(Boolean).sort(); $('#vocabTopicFilter').innerHTML='<option value="ALL">All topics</option>'+topics.map(t=>`<option>${t}</option>`).join(''); const cats=uniqueBy(state.data.flashcards,f=>f.category||f.topic||f.type).map(f=>f.category||f.topic||f.type).filter(Boolean).sort(); $('#flashCategoryFilter').innerHTML='<option value="ALL">All categories</option>'+cats.map(c=>`<option>${c}</option>`).join(''); fillWritingTasks(); $('#photoTaskSelect').innerHTML=PHOTO_TASKS.map((x,i)=>`<option value="${i}">${store.lang==='de'?x.title_de:x.title_en}</option>`).join(''); }
const EXPLANATIONS={ articles:{en:'Check gender and case. Ask: who is the subject, what receives the action, and which preposition is used?',de:'Prüfe Genus und Fall. Frage: Wer ist das Subjekt, was bekommt die Handlung und welche Präposition steht im Satz?'}, prepositions:{en:'Many prepositions fix the case: mit/nach/bei/von/zu → dative; für/ohne/um/durch/gegen → accusative.',de:'Viele Präpositionen bestimmen den Fall: mit/nach/bei/von/zu → Dativ; für/ohne/um/durch/gegen → Akkusativ.'}, sentence_structure:{en:'Remember the German sentence frame: verb in position 2 in main clauses, verb at the end in subordinate clauses.',de:'Denke an den deutschen Satzrahmen: Verb auf Position 2 im Hauptsatz, Verb am Ende im Nebensatz.'}, perfect:{en:'Perfekt uses haben/sein + participle II. Separable verbs keep ge inside: abholen → abgeholt.',de:'Das Perfekt benutzt haben/sein + Partizip II. Trennbare Verben behalten ge innen: abholen → abgeholt.'}, default:{en:'Read the whole sentence, then check case, verb position, and spelling.',de:'Lies zuerst den ganzen Satz, prüfe dann Fall, Verbposition und Rechtschreibung.'} };
function explanationFor(type){ return EXPLANATIONS[type] || EXPLANATIONS[(type||'').replace('_reason','')] || EXPLANATIONS.default; }
function poolExercises(){
 let base=[...state.data.exercises];
 const lvl=$('#exerciseLevelFilter').value, typ=$('#exerciseTypeFilter').value, focus=$('#exerciseFocusFilter').value;
 let arr=[...base];
 if(lvl!=='ALL') arr=arr.filter(e=>e.level===lvl);
 if(typ!=='ALL') arr=arr.filter(e=>e.type===typ);
 if(focus==='weak'){
   const weak=getWeakAreas().map(w=>w.type);
   const weakMatches=arr.filter(e=>weak.includes(e.type));
   if(weakMatches.length) arr=weakMatches;
 }
 arr=uniqueBy(arr,e=>`${e.type}|${e.question}|${e.answer}`);
 if(!arr.length){
   let fallback=[...base];
   if(lvl!=='ALL') fallback=fallback.filter(e=>e.level===lvl);
   if(typ!=='ALL') fallback=fallback.filter(e=>e.type===typ);
   arr=uniqueBy(fallback,e=>`${e.type}|${e.question}|${e.answer}`);
 }
 return arr;
}
function newExercise(){ const pool=poolExercises(); if(!pool.length){ state.currentExercise=null; $('#exerciseMeta').textContent=''; $('#exerciseQuestion').textContent=t('No exercise found for this filter. Falling back may be needed.','Keine Übung für diesen Filter gefunden. Bitte Filter ändern.'); $('#exerciseAnswerInput').value=''; $('#exerciseResult').textContent=''; $('#exerciseExplanation').classList.add('hidden'); return; } state.currentExercise=pool[Math.floor(Math.random()*pool.length)]; $('#exerciseMeta').textContent=`${state.currentExercise.level} • ${state.currentExercise.type}`; $('#exerciseQuestion').textContent=state.currentExercise.question; $('#exerciseAnswerInput').value=''; $('#exerciseResult').textContent=''; $('#exerciseExplanation').classList.add('hidden'); }
function showExerciseAnswer(){ if(!state.currentExercise) return; const ex=state.currentExercise; $('#exerciseResult').textContent=t('Correct: ','Richtig: ')+ex.answer; $('#exerciseExplanation').innerHTML=`<strong>${t('Hint','Hinweis')}:</strong> ${ex.hint||''}`; $('#exerciseExplanation').classList.remove('hidden'); }
function checkExercise(){ if(!state.currentExercise) return; const ex=state.currentExercise; const ans=$('#exerciseAnswerInput').value.trim(); const ok=norm(ans)===norm(ex.answer); today().attemptedExercises++; if(ok){ today().correctExercises++; addXP(xpStep()); } else { queueReview('exercise', `${ex.type}|${ex.question}`, {prompt:ex.question, exercise:ex}, 0); } recordWeak(ex.type,ok); saveStore(); updateHeader(); $('#exerciseResult').textContent=ok?t('Correct!','Richtig!'):t('Not quite. Correct: ','Nicht ganz. Richtig: ')+ex.answer; playTone(ok?'ok':'warn'); $('#exerciseResult').className='result '+(ok?'good':'bad'); const exp=explanationFor(ex.type); $('#exerciseExplanation').innerHTML=`<strong>${t('Your answer','Deine Antwort')}:</strong> ${ans||'—'}<br><strong>${t('Correct answer','Richtige Antwort')}:</strong> ${ex.answer}<br><strong>${t('Rule','Regel')}:</strong> ${store.lang==='de'?(exp.de||exp.en):(exp.en||exp.de)}<br>${ex.hint?'<strong>'+t('Hint','Hinweis')+':</strong> '+ex.hint:''}`; $('#exerciseExplanation').classList.remove('hidden'); }
function typingPassages(){ const lvl=$('#typingLevelFilter').value; return state.data.passages.filter(p=>lvl==='ALL'||p.level===lvl); }
function renderTypingOptions(){ const opts=typingPassages(); $('#typingSelect').innerHTML=opts.map((p,i)=>`<option value="${i}">${p.level} • ${p.title}</option>`).join(''); loadTypingPassage(); }
function currentPassage(){ const list=typingPassages(); const idx=+($('#typingSelect').value||0); return list[idx]||list[0]||null; }
function loadTypingPassage(){ const p=currentPassage(); if(!p) return; state.currentPassage=p; $('#typingReference').value=p.german; $('#typingEnglish').value=p.english||''; $('#typingEnglishWrap').classList.toggle('hidden',!$('#typingShowEnglish').checked); $('#typingInput').value=''; $('#typingFeedback').textContent=''; }
function checkTyping(){ const p=currentPassage(); if(!p) return; const ok=norm($('#typingInput').value)===norm(p.german); $('#typingFeedback').textContent=ok?t('Perfect match.','Perfekte Übereinstimmung.'):t('Check the reference and try again.','Prüfe den Referenztext und versuche es noch einmal.'); playTone(ok?'ok':'warn'); $('#typingFeedback').className='result '+(ok?'good':'bad'); if(ok){ markPassageDone(`${p.level}|${p.title}`); updateHeader(); } else { queueReview('passage', `${p.level}|${p.title}`, {prompt:p.title, passage:p}, 1); } }
function levenshtein(a,b){ a=norm(a); b=norm(b); const m=a.length,n=b.length; const dp=Array.from({length:m+1},()=>Array(n+1).fill(0)); for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j; for(let i=1;i<=m;i++) for(let j=1;j<=n;j++) dp[i][j]=Math.min(dp[i-1][j]+1,dp[i][j-1]+1,dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); return dp[m][n]; }

function articleFamily(tok){ return ['der','die','das','den','dem','des','ein','eine','einen','einem','einer','kein','keine','keinen','keinem','keiner'].includes(tok); }
function gradeListeningAnswer(item, answer){
  const raw=(answer||'').trim();
  const val=norm(raw), corr=norm(item.answer);
  if(!val) return {ok:false,why:t('No answer entered.','Keine Antwort eingegeben.'),kind:'empty'};
  if(val===corr) return {ok:true,why:t('Exact answer.','Exakte Antwort.'),kind:'exact'};
  const vt=val.split(' '), ct=corr.split(' ');
  const missing=ct.filter(x=>!vt.includes(x));
  const extra=vt.filter(x=>!ct.includes(x));
  const articleProblem=(vt.some(articleFamily) || ct.some(articleFamily)) && missing.some(articleFamily);
  const verbProblem=ct.some(x=>/(en|st|t|te|ten|est)$/.test(x)) && missing.some(x=>/(en|st|t|te|ten|est)$/.test(x));
  const sim=1-levenshtein(val,corr)/Math.max(val.length,corr.length,1);
  let why='', kind='different';
  if(articleProblem){ why=t('Article or case is wrong.','Artikel oder Fall ist falsch.'); kind='article_case'; }
  else if(verbProblem){ why=t('Verb form or word order is wrong.','Verbform oder Wortstellung ist falsch.'); kind='verb_order'; }
  else if(sim>0.88 && missing.length<=1 && extra.length<=1){ why=t('Very close, but there is still a spelling or form mistake.','Fast richtig, aber es gibt noch einen Schreib- oder Formfehler.'); kind='spelling'; }
  else if(missing.length){ why=t('Important words are missing or different.','Wichtige Wörter fehlen oder sind anders.'); kind='missing_words'; }
  else { why=t('The sentence is too different from the correct answer.','Der Satz ist zu anders als die richtige Antwort.'); }
  return {ok:false,why,kind,missing,extra,sim};
}
function newListeningFromState(){
  const showEn = $('#listenShowEnglish') ? $('#listenShowEnglish').checked : false;
  $('#listenPrompt').innerHTML=showEn ? `${state.currentListen.question_de}<div class="muted tiny">${state.currentListen.question_en}</div>` : state.currentListen.question_de;
  $('#listenInput').value=''; $('#listenFeedback').textContent=''; $('#listenAnswer').classList.add('hidden'); $('#listenAnswer').textContent='';
}
function newListening(){ const lvl=$('#listenLevelFilter').value; const pool=LISTENING_BANK.filter(x=>lvl==='ALL'||x.level===lvl); state.currentListen=pool[Math.floor(Math.random()*pool.length)]||LISTENING_BANK[0]; newListeningFromState(); }

function checkListening(){
  const item=state.currentListen, raw=$('#listenInput').value;
  const g=gradeListeningAnswer(item, raw);
  const reason = store.lang==='de' ? item.reason_de : item.reason_en;
  const whyMap={article_case:t('Check article + case: ask who? whom? where? where to?','Prüfe Artikel + Fall: Wer? Wen? Wo? Wohin?'),verb_order:t('Check the verb form and where the verb stands in the sentence.','Prüfe die Verbform und die Stellung des Verbs im Satz.'),spelling:t('Almost correct, but spelling or one form is still wrong.','Fast richtig, aber die Schreibung oder eine Form ist noch falsch.'),missing_words:t('One or more important words are missing.','Ein oder mehrere wichtige Wörter fehlen.'),different:t('The answer is too different from the target sentence.','Die Antwort ist zu anders als der Zielsatz.')};
  $('#listenFeedback').innerHTML = g.ok ? `<strong>${t('Correct!','Richtig!')}</strong><br>${t('Exact match after normalization.','Exakte Übereinstimmung nach Normalisierung.')}` : `<strong>${t('Not correct.','Nicht richtig.')}</strong><br><strong>${t('Your answer','Deine Antwort')}:</strong> ${raw||'—'}<br><strong>${t('Correct answer','Richtige Antwort')}:</strong> ${item.answer}<br><strong>${t('Why wrong','Warum falsch')}:</strong> ${g.why}<br><strong>${t('What to check','Was du prüfen sollst')}:</strong> ${whyMap[g.kind]||whyMap.different}<br><strong>${t('Grammar hint','Grammatiktipp')}:</strong> ${reason}`;
  $('#listenFeedback').className='result '+(g.ok?'good':'bad');
  recordWeak(g.kind==='article_case'?'dative':g.kind==='verb_order'?'sentence_structure':'listening',g.ok);
  today().listeningDone++;
  if(g.ok) addXP(xpStep());
  else queueReview('listening', item.question_de, {prompt:item.question_de, item}, 0);
  saveStore(); updateHeader();
  $('#listenAnswer').textContent=item.answer+' — '+reason; $('#listenAnswer').classList.remove('hidden');
}
function structurePool(){
  const lvl = $('#structureLevelFilter') ? $('#structureLevelFilter').value : 'ALL';
  let items=[];
  for(const [level, arr] of Object.entries(state.data.sentences||{})){
    if(!Array.isArray(arr)) continue;
    for(const s of arr){ items.push({level:level.toUpperCase(), de:s.de||'', en:s.en||''}); }
  }
  if(lvl!=='ALL') items=items.filter(x=>x.level===lvl);
  return items.filter(x=>x.de);
}

function newStructure(){
  const pool=structurePool();
  const item=pool[Math.floor(Math.random()*pool.length)];
  state.currentStructure=item;
  if(!item){
    $('#structurePrompt').textContent=t('No sentence available.','Kein Satz verfügbar.');
    $('#structureWords').innerHTML='';
    $('#structureAnswer').value='';
    $('#structureFeedback').textContent='';
    $('#structureReason').classList.add('hidden');
    return;
  }
  const prompt=(item.en||item.de);
  $('#structurePrompt').textContent=t('Build the correct German sentence for: ','Bilde den richtigen deutschen Satz zu: ')+prompt;
  $('#structureWords').innerHTML=shuffle(item.de.replace(/[?.!]/g,'').split(/\s+/)).map(w=>`<button class="chip structure-chip">${w}</button>`).join(' ');
  $$('.structure-chip').forEach(btn=>btn.onclick=()=>{
    const cur=$('#structureAnswer').value.trim();
    $('#structureAnswer').value=(cur?cur+' ':'')+btn.textContent;
  });
  $('#structureAnswer').value='';
  $('#structureFeedback').textContent='';
  $('#structureReason').classList.add('hidden');
}
function checkStructure(){ const item=state.currentStructure; if(!item) return; const ans=$('#structureAnswer').value.trim(); const ok=norm(ans)===norm(item.de); $('#structureFeedback').textContent=ok?t('Correct!','Richtig!'):t('Not quite.','Nicht ganz.'); $('#structureFeedback').className='result '+(ok?'good':'bad'); $('#structureReason').innerHTML=`<strong>${t('Correct sentence','Richtiger Satz')}:</strong> ${item.de}<br>${t('Reason: in German, the finite verb usually stays in position 2 in a main clause. Check articles and case as well.','Grund: Im Deutschen steht das finite Verb im Hauptsatz meist auf Position 2. Prüfe auch Artikel und Fall.')}`; $('#structureReason').classList.remove('hidden'); recordWeak('sentence_structure',ok); if(ok) addXP(xpStep()); else queueReview('structure', item.de, {prompt:item.en||item.de, item}, 0); saveStore(); updateHeader(); }
function showStructure(){ if(!state.currentStructure) return; $('#structureReason').innerHTML=`<strong>${t('Correct sentence','Richtiger Satz')}:</strong> ${state.currentStructure.de}`; $('#structureReason').classList.remove('hidden'); }
function fillWritingTasks(){ $('#writingTaskSelect').innerHTML=WRITING_TASKS.map((x,i)=>`<option value="${i}">${store.lang==='de'?x.title_de:x.title_en}</option>`).join(''); }

function filteredCaseDrills(topic){
  let arr=[...CASE_DRILLS];
  const lvl=$('#caseLevelFilter')?$('#caseLevelFilter').value:'ALL';
  if(lvl!=='ALL') arr=arr.filter(x=>x.level===lvl);
  if(topic) arr=arr.filter(x=>x.topic===topic);
  return arr;
}
function newCaseDrill(topic=''){
  const pool=filteredCaseDrills(topic);
  state.currentCase=pool[Math.floor(Math.random()*pool.length)]||CASE_DRILLS[0];
  renderCaseDrill();
}
function renderCaseDrill(){
  const item=state.currentCase; if(!item) return;
  $('#casePrompt').textContent=item.prompt_de;
  $('#caseChoices').innerHTML=item.choices.map(c=>`<button class="choicebtn case-choice" data-v="${c}">${c}</button>`).join('');
  $$('.case-choice').forEach(b=>b.onclick=()=>checkCaseDrill(b.dataset.v));
  $('#caseFeedback').textContent=''; $('#caseReason').classList.add('hidden');
}
function checkCaseDrill(val){
  const item=state.currentCase; if(!item) return;
  const ok=norm(val)===norm(item.answer);
  $('#caseFeedback').textContent=ok?t('Correct!','Richtig!'):t('Not quite.','Nicht ganz.');
  $('#caseFeedback').className='result '+(ok?'good':'bad');
  $('#caseReason').innerHTML=`<strong>${t('Correct answer','Richtige Antwort')}:</strong> ${item.answer}<br><strong>${t('Why','Warum')}:</strong> ${store.lang==='de'?item.reason_de:item.reason_en}`;
  $('#caseReason').classList.remove('hidden');
  recordWeak(item.topic,ok);
  if(ok) addXP(xpStep()); else queueReview('case', `${item.topic}|${item.prompt_de}`, {prompt:item.prompt_de, item}, 0);
  saveStore(); updateHeader();
}
function showCaseDrill(){ const item=state.currentCase; if(!item) return; $('#caseReason').innerHTML=`<strong>${t('Correct answer','Richtige Antwort')}:</strong> ${item.answer}<br><strong>${t('Why','Warum')}:</strong> ${store.lang==='de'?item.reason_de:item.reason_en}`; $('#caseReason').classList.remove('hidden'); }

function renderWritingTask(){ const task=WRITING_TASKS[+($('#writingTaskSelect').value||0)]||WRITING_TASKS[0]; state.currentWriting=task; const showEn = $('#writingShowEnglish') ? $('#writingShowEnglish').checked : false; $('#writingPrompt').innerHTML=showEn ? `${task.prompt_de}<div class="muted tiny">${task.prompt_en}</div>` : task.prompt_de; $('#writingInput').value=''; $('#writingFeedback').textContent=''; $('#writingSample').classList.add('hidden'); $('#writingSample').textContent=showEn ? `${task.sample}

${task.prompt_en}` : task.sample; $('#writingPhotoWrap').classList.toggle('hidden', task.key!=='photo'); if(task.key==='photo') $('#writingPhoto').src='assets/photo_office.svg'; }
function checkWriting(){ const wc=$('#writingInput').value.trim().split(/\s+/).filter(Boolean).length; const ok=wc>=25; $('#writingFeedback').textContent=ok?t('Good start.','Guter Anfang.'):t('Write a little more.','Schreibe noch etwas mehr.'); $('#writingFeedback').className='result '+(ok?'good':'bad'); if(ok){ today().writingDone++; addXP(xpStep()); saveStore(); updateHeader(); } }
function vocabPool(){ let arr=[...state.data.vocab]; const lvl=$('#vocabLevelFilter').value, topic=$('#vocabTopicFilter').value, s=norm($('#vocabSearch').value), diff=$('#vocabDifficultOnly').checked; if(lvl!=='ALL') arr=arr.filter(v=>v.level===lvl); if(topic!=='ALL') arr=arr.filter(v=>v.topic===topic); if(diff) arr=arr.filter(v=>store.difficultWords.includes(v.de)); if(s) arr=arr.filter(v=>norm(v.de).includes(s)||norm(v.en).includes(s)||norm(v.example_de||'').includes(s)||norm(v.example_en||'').includes(s)); return arr; }
function renderVocabList(){
  const list=vocabPool();
  $('#vocabListWrap').innerHTML=list.slice(0,300).map(v=>{
    const helper = $('#vocabShowEnglish') && $('#vocabShowEnglish').checked;
    const meta = `${v.level} • ${v.topic||'Allgemein'}`;
    return `<div class="vocab-item"><div class="vocab-top"><div><div class="vocab-word">${v.de}</div><div class="muted">${meta}${helper?` • ${v.en}`:''}</div></div><button class="ghost diff-btn" data-word="${String(v.de).replace(/"/g,'&quot;')}">${store.difficultWords.includes(v.de)?'★':'☆'}</button></div><div class="vocab-example"><strong>DE:</strong> ${v.example_de||'—'}${helper?`<br><strong>EN:</strong> ${v.example_en||'—'}`:''}</div></div>`;
  }).join('') || `<div class="note-block">${t('No vocabulary found for this filter.','Kein Wortschatz für diesen Filter gefunden.')}</div>`;
  $$('.diff-btn').forEach(b=>b.onclick=()=>toggleDifficult(b.dataset.word.replace(/&quot;/g,'"')));
}
function toggleDifficult(word){ if(store.difficultWords.includes(word)) store.difficultWords=store.difficultWords.filter(w=>w!==word); else store.difficultWords.push(word); saveStore(); renderVocabList(); renderApp(); }
function newMatch(){ const items=shuffle(state.data.vocab).slice(0,6); state.matchItems=items; state.sel={}; $('#matchFeedback').textContent=''; $('#matchDe').innerHTML=items.map((v,i)=>`<button class="match-btn" data-side="de" data-idx="${i}">${v.de}</button>`).join(''); $('#matchEn').innerHTML=shuffle(items.map((v,i)=>({i,en:v.en}))).map(v=>`<button class="match-btn" data-side="en" data-idx="${v.i}">${v.en}</button>`).join(''); $$('.match-btn').forEach(b=>b.onclick=onMatchClick); }
function onMatchClick(e){ const btn=e.currentTarget, side=btn.dataset.side, idx=btn.dataset.idx; $$(`.match-btn[data-side="${side}"]`).forEach(x=>x.classList.remove('selected')); btn.classList.add('selected'); state.sel[side]=idx; if(state.sel.de!=null&&state.sel.en!=null){ const ok=state.sel.de===state.sel.en; $('#matchFeedback').textContent=ok?t('Match!','Treffer!'):t('Not a match.','Kein Treffer.'); $('#matchFeedback').className='result '+(ok?'good':'bad'); if(ok) addVocabSeen(state.matchItems[+state.sel.de].de); state.sel={}; setTimeout(newMatch, ok?400:700); } }
function newTypeWord(){ state.currentWord=state.data.vocab[Math.floor(Math.random()*state.data.vocab.length)]; $('#typeWordMeta').textContent=`${state.currentWord.level} • ${state.currentWord.topic||'General'}`; $('#typeWordPrompt').textContent=t('Type the German word for: ','Schreibe das deutsche Wort für: ')+state.currentWord.en; $('#typeWordInput').value=''; $('#typeWordFeedback').textContent=''; }
function showTypeWord(force=false){ const w=state.currentWord; const ok=!force && norm($('#typeWordInput').value)===norm(w.de); $('#typeWordFeedback').textContent=ok?t('Correct!','Richtig!'):t('Correct: ','Richtig: ')+w.de; $('#typeWordFeedback').className='result '+(ok?'good':'bad'); if(ok){ addVocabSeen(w.de); addXP(1); } else if(!force){ queueReview('vocab', w.de, {prompt:w.en, answer:w.de}, 0); } }

function masterTablesHtml(){
  return `
  <div class="grammar-section"><h4>${t('Master tables','Mastertabellen')}</h4>
    <div class="note-block">${t('Core article, case and pronoun tables for fast review.','Wichtige Tabellen zu Artikeln, Fällen und Pronomen für den schnellen Überblick.')}</div>
  </div>
  <div class="grammar-section"><h4>${t('Definite articles','Bestimmte Artikel')}</h4>
    <div class="grammar-table-wrap"><table class="grammar-table"><thead><tr><th>Fall</th><th>Mask.</th><th>Fem.</th><th>Neut.</th><th>Plural</th></tr></thead><tbody>
      <tr><td>Nominativ</td><td>der</td><td>die</td><td>das</td><td>die</td></tr>
      <tr><td>Akkusativ</td><td>den</td><td>die</td><td>das</td><td>die</td></tr>
      <tr><td>Dativ</td><td>dem</td><td>der</td><td>dem</td><td>den</td></tr>
      <tr><td>Genitiv</td><td>des</td><td>der</td><td>des</td><td>der</td></tr>
    </tbody></table></div>
  </div>
  <div class="grammar-section"><h4>${t('Indefinite articles','Unbestimmte Artikel')}</h4>
    <div class="grammar-table-wrap"><table class="grammar-table"><thead><tr><th>Fall</th><th>Mask.</th><th>Fem.</th><th>Neut.</th></tr></thead><tbody>
      <tr><td>Nominativ</td><td>ein</td><td>eine</td><td>ein</td></tr>
      <tr><td>Akkusativ</td><td>einen</td><td>eine</td><td>ein</td></tr>
      <tr><td>Dativ</td><td>einem</td><td>einer</td><td>einem</td></tr>
      <tr><td>Genitiv</td><td>eines</td><td>einer</td><td>eines</td></tr>
    </tbody></table></div>
  </div>
  <div class="grammar-section"><h4>${t('Negation with kein','Negation mit kein')}</h4>
    <div class="grammar-table-wrap"><table class="grammar-table"><thead><tr><th>Fall</th><th>Mask.</th><th>Fem.</th><th>Neut.</th><th>Plural</th></tr></thead><tbody>
      <tr><td>Nominativ</td><td>kein</td><td>keine</td><td>kein</td><td>keine</td></tr>
      <tr><td>Akkusativ</td><td>keinen</td><td>keine</td><td>kein</td><td>keine</td></tr>
      <tr><td>Dativ</td><td>keinem</td><td>keiner</td><td>keinem</td><td>keinen</td></tr>
      <tr><td>Genitiv</td><td>keines</td><td>keiner</td><td>keines</td><td>keiner</td></tr>
    </tbody></table></div>
  </div>
  <div class="grammar-section"><h4>${t('Personal pronouns','Personalpronomen')}</h4>
    <div class="grammar-table-wrap"><table class="grammar-table"><thead><tr><th>Fall</th><th>ich</th><th>du</th><th>er</th><th>sie</th><th>es</th><th>wir</th><th>ihr</th><th>sie/Sie</th></tr></thead><tbody>
      <tr><td>Nominativ</td><td>ich</td><td>du</td><td>er</td><td>sie</td><td>es</td><td>wir</td><td>ihr</td><td>sie / Sie</td></tr>
      <tr><td>Akkusativ</td><td>mich</td><td>dich</td><td>ihn</td><td>sie</td><td>es</td><td>uns</td><td>euch</td><td>sie / Sie</td></tr>
      <tr><td>Dativ</td><td>mir</td><td>dir</td><td>ihm</td><td>ihr</td><td>ihm</td><td>uns</td><td>euch</td><td>ihnen / Ihnen</td></tr>
    </tbody></table></div>
  </div>
  <div class="grammar-section"><h4>${t('Article rules: DER / DIE / DAS','Artikelregeln: DER / DIE / DAS')}</h4>
    <div class="note-block">
      <strong>DER</strong>: ${t('male persons, days, months, seasons, weather, many nouns ending in -ling / -or / -us, many tools in -er','männliche Personen, Tage, Monate, Jahreszeiten, Wetter, viele Wörter auf -ling / -or / -us, viele Werkzeuge auf -er')}<br>
      ${t('Examples: der Vater, der Montag, der Herbst, der Regen, der Motor','Beispiele: der Vater, der Montag, der Herbst, der Regen, der Motor')}<br><br>
      <strong>DIE</strong>: ${t('female persons and many nouns ending in -e, -ei, -heit, -keit, -schaft, -ung, -tät, -ik, -ur, -ion','weibliche Personen und viele Wörter auf -e, -ei, -heit, -keit, -schaft, -ung, -tät, -ik, -ur, -ion')}<br>
      ${t('Examples: die Frau, die Klasse, die Bäckerei, die Zeitung, die Religion','Beispiele: die Frau, die Klasse, die Bäckerei, die Zeitung, die Religion')}<br><br>
      <strong>DAS</strong>: ${t('many nouns ending in -chen, -ment, -nis, -um, -tum and nominalized infinitives','viele Wörter auf -chen, -ment, -nis, -um, -tum und nominalisierte Infinitive')}<br>
      ${t('Examples: das Mädchen, das Dokument, das Zeugnis, das Museum, das Lesen','Beispiele: das Mädchen, das Dokument, das Zeugnis, das Museum, das Lesen')}
    </div>
  </div>`;
}

function renderGrammar(){
  const wrap=$('#grammarWrap');
  if(!wrap) return;
  try{
    const s=norm($('#grammarSearch') ? $('#grammarSearch').value : '');
    const entries=Object.entries(state.data.notes||{}).filter(([k,v])=>!s||norm(k).includes(s)||norm(String(v)).includes(s));
    const intro=`<div class="note-block"><strong>${t('Grammar overview','Grammatik-Überblick')}</strong><br>${t('Use the search field or scroll through the master tables and topic notes below.','Nutze die Suche oder scrolle durch die Mastertabellen und die Themennotizen unten.')}</div>`;
    const notesHtml=entries.map(([k,v])=>`<div class="grammar-section"><h4>${k.replaceAll('_',' ')}</h4><div class="note-block">${String(v).replace(/\n/g,'<br>')}</div></div>`).join('');
    const empty = !entries.length ? `<div class="note-block">${t('No grammar note matched your search.','Keine Grammatiknotiz passt zu deiner Suche.')}</div>` : '';
    wrap.innerHTML=intro+masterTablesHtml()+empty+notesHtml+`<div class="grammar-section"><h4>${t('Reference image','Referenzbild')}</h4><div class="media-wrap"><img src="assets/grammar_reference.png" alt="Grammar reference"></div></div>`;
  }catch(err){
    console.error('renderGrammar failed',err);
    wrap.innerHTML=`<div class="note-block"><strong>${t('Grammar failed to render.','Grammatik konnte nicht geladen werden.')}</strong><br>${String(err&&err.message||err)}</div>`;
  }
}

function nextFlash(){ let list=state.data.flashcards; const cat=$('#flashCategoryFilter').value; if(cat&&cat!=='ALL') list=list.filter(f=>(f.category||f.topic||f.type)===cat); state.currentFlash=list[Math.floor(Math.random()*list.length)]||state.data.flashcards[0]; state.flashFront=true; renderFlash(); }
function renderFlash(){ if(!state.currentFlash){ $('#flashCard').textContent=t('No flashcard available.','Keine Karte verfügbar.'); return; } $('#flashCard').textContent=state.flashFront?state.currentFlash.front:state.currentFlash.back; }
function flipFlash(){ state.flashFront=!state.flashFront; renderFlash(); }
function newConj(){ let list=state.data.conjugation; const lvl=$('#conjLevelFilter').value; if(lvl!=='ALL') list=list.filter(v=>v.level===lvl); const verb=list[Math.floor(Math.random()*list.length)]||state.data.conjugation[0]; const persons=Object.keys(verb.forms); const p=persons[Math.floor(Math.random()*persons.length)]; state.currentConj={verb,person:p,answer:verb.forms[p]}; $('#conjQuestion').textContent=`${verb.infinitive} → ${p}`; $('#conjInput').value=''; $('#conjFeedback').textContent=''; $('#conjReveal').classList.add('hidden'); }
function checkConj(){ const ok=norm($('#conjInput').value)===norm(state.currentConj.answer); $('#conjFeedback').textContent=ok?t('Correct!','Richtig!'):t('Not quite.','Nicht ganz.'); $('#conjFeedback').className='result '+(ok?'good':'bad'); recordWeak('conjugation',ok); if(ok) addXP(xpStep()); else queueReview('conjugation', state.currentConj.question, {prompt:state.currentConj.question, answer:state.currentConj.answer}, 0); saveStore(); updateHeader(); }
function showConj(){ $('#conjReveal').innerHTML=`<strong>${t('Answer','Antwort')}:</strong> ${state.currentConj.answer}<br><strong>${t('Full forms','Alle Formen')}:</strong> ${Object.entries(state.currentConj.verb.forms).map(([k,v])=>`${k}: ${v}`).join(' • ')}`; $('#conjReveal').classList.remove('hidden'); }
function sampleExercisesForExam(level){ let pool=state.data.exercises.filter(e=>level==='freestyle'||e.level===level); pool=shuffle(uniqueBy(pool,e=>e.question+'|'+e.answer)).slice(0,15); state.currentExam={level,items:pool,answers:{}}; const wrap=$('#examWrap'); wrap.innerHTML=pool.map((q,i)=>`<div class="note-block"><div><strong>${i+1}.</strong> ${q.question}</div><input data-exam="${i}" placeholder="${t('Type your answer','Deine Antwort')}"></div>`).join(''); $$('[data-exam]').forEach(inp=>inp.oninput=e=>state.currentExam.answers[e.target.dataset.exam]=e.target.value); $('#examResult').textContent=''; }
function startExam(){ sampleExercisesForExam($('#examLevel').value); }
function finishExam(){ if(!state.currentExam) return; let correct=0; state.currentExam.items.forEach((q,i)=>{ if(norm(state.currentExam.answers[i])===norm(q.answer)) correct++; }); const score=Math.round(correct/Math.max(state.currentExam.items.length,1)*60); const est=score<20?'A1':score<35?'A2':score<48?'B1':'B2'; $('#examResult').textContent=`${t('Score','Punktzahl')}: ${score}/60 • ${t('Estimated level','Geschätztes Niveau')}: ${est}`; $('#examResult').className='result good'; }
function renderPhotoTask(){ const task=PHOTO_TASKS[+($('#photoTaskSelect').value||0)]||PHOTO_TASKS[0]; state.currentPhoto=task; $('#photoExamImage').src=task.src; $('#photoExamPrompt').textContent=store.lang==='de'?task.prompt_de:task.prompt_en; $('#photoExamInput').value=''; $('#photoExamFeedback').textContent=''; $('#photoExamSample').classList.add('hidden'); $('#photoExamSample').textContent=task.sample; }
function checkPhotoExam(){ const wc=$('#photoExamInput').value.trim().split(/\s+/).filter(Boolean).length; $('#photoExamFeedback').textContent=wc>=35?t('Good start.','Guter Anfang.'):t('Write more detail.','Schreibe ausführlicher.'); $('#photoExamFeedback').className='result '+(wc>=35?'good':'bad'); }
const QA_BANK=[{mode:'answer',prompt_en:'Where do you work?',prompt_de:'Wo arbeitest du?',answer:'Ich arbeite in einem Büro.'},{mode:'answer',prompt_en:'Why are you learning German?',prompt_de:'Warum lernst du Deutsch?',answer:'Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.'},{mode:'question',prompt_en:'Ich wohne seit zwei Jahren in Berlin.',prompt_de:'Ich wohne seit zwei Jahren in Berlin.',answer:'Wie lange wohnst du schon in Berlin?'},{mode:'question',prompt_en:'Ich fahre morgen mit dem Zug nach Hamburg.',prompt_de:'Ich fahre morgen mit dem Zug nach Hamburg.',answer:'Wie fährst du morgen nach Hamburg?'}];
function newQA(){ const mode=$('#qaMode').value; const pool=QA_BANK.filter(x=>x.mode===mode); state.currentQA=pool[Math.floor(Math.random()*pool.length)]||QA_BANK[0]; const showEn = $('#qaShowEnglish') ? $('#qaShowEnglish').checked : false; $('#qaPrompt').innerHTML=showEn ? `${state.currentQA.prompt_de}<div class="muted tiny">${state.currentQA.prompt_en}</div>` : state.currentQA.prompt_de; $('#qaInput').value=''; $('#qaFeedback').textContent=''; $('#qaExplanation').classList.add('hidden'); }
function checkQA(){ const ok=norm($('#qaInput').value)===norm(state.currentQA.answer); $('#qaFeedback').textContent=ok?t('Correct!','Richtig!'):t('Not quite.','Nicht ganz.'); $('#qaFeedback').className='result '+(ok?'good':'bad'); const qaShowEn = $('#qaShowEnglish') ? $('#qaShowEnglish').checked : false; $('#qaExplanation').innerHTML=`<strong>${t('Correct answer','Richtige Antwort')}:</strong> ${state.currentQA.answer}${qaShowEn && state.currentQA.answer_en ? ' / '+state.currentQA.answer_en : ''}`; $('#qaExplanation').classList.remove('hidden'); }
function showQA(){ const qaShowEn = $('#qaShowEnglish') ? $('#qaShowEnglish').checked : false; $('#qaExplanation').innerHTML=`<strong>${t('Correct answer','Richtige Antwort')}:</strong> ${state.currentQA.answer}${qaShowEn && state.currentQA.answer_en ? ' / '+state.currentQA.answer_en : ''}`; $('#qaExplanation').classList.remove('hidden'); }
function deifyLidText(txt){
  if(!txt) return txt;
  const exact={
    'What is the German constitution called?':'Wie heißt die deutsche Verfassung?',
    'Who elects the Bundestag?':'Wer wählt den Bundestag?',
    'What is forbidden in a democracy?':'Was ist in einer Demokratie verboten?',
    'What do you do in an election?':'Was macht man bei einer Wahl?',
    'Why are several parties important?':'Warum sind mehrere Parteien wichtig?',
    'What does freedom of the press mean?':'Was bedeutet Pressefreiheit?',
    'What does freedom of religion mean in Germany?':'Was bedeutet Religionsfreiheit in Deutschland?',
    'What does freedom of religion mean?':'Was bedeutet Religionsfreiheit?',
    'How often are Bundestag elections normally held?':'Wie oft findet normalerweise die Bundestagswahl statt?',
    'Which statement about equal rights for women and men is correct?':'Welche Aussage zur Gleichberechtigung von Frauen und Männern ist richtig?',
    'What does gender equality mean?':'Was bedeutet Gleichberechtigung von Frauen und Männern?',
    'What is the role of the Bundesrat?':'Was ist die Aufgabe des Bundesrates?',
    'Which colors are on the German flag?':'Welche Farben hat die deutsche Flagge?',
    'What is the capital of Germany?':'Was ist die Hauptstadt von Deutschland?',
    'How many federal states does Germany have?':'Wie viele Bundesländer hat Deutschland?',
    'What is a Land in Germany?':'Was ist ein Bundesland in Deutschland?',
    'What is the Bundestag?':'Was ist der Bundestag?'
  };
  if(exact[txt]) return exact[txt];
  let s=' '+txt+' ';
  const reps=[
    [' What does ',' Was bedeutet '],[' What is the role of ',' Was ist die Aufgabe von '],[' What is the job of ',' Was ist die Aufgabe von '],
    [' What is protected by ',' Was wird geschützt durch '],[' What is guaranteed by ',' Was wird garantiert durch '],[' What is a ',' Was ist ein '],
    [' What is an ',' Was ist ein '],[' What is ',' Was ist '],[' Which statement about ',' Welche Aussage zu '],[' Which statement ',' Welche Aussage '],
    [' Which right ',' Welches Recht '],[' Which colors are on ',' Welche Farben hat '],[' Which institution ',' Welche Institution '],[' Which office ',' Welche Behörde '],
    [' Who ',' Wer '],[' Why ',' Warum '],[' How many ',' Wie viele '],[' How often ',' Wie oft '],[' Where ',' Wo '],[' When ',' Wann '],[' In Germany ',' In Deutschland '],
    [' the German constitution ',' die deutsche Verfassung '],[' the Bundestag ',' den Bundestag '],[' the Bundesrat ',' den Bundesrat '],[' the Federal President ',' den Bundespräsidenten '],
    [' democracy ',' Demokratie '],[' freedom of religion ',' Religionsfreiheit '],[' freedom of expression ',' Meinungsfreiheit '],[' freedom of the press ',' Pressefreiheit '],
    [' equal rights ',' die Gleichberechtigung '],[' women and men ',' von Frauen und Männern '],[' federal states ',' Bundesländer '],[' Germany ',' Deutschland '],[' capital ',' Hauptstadt ']
  ];
  for(const [a,b] of reps) s=s.replaceAll(a,b);
  s=s.trim();
  if(!/[?!.]$/.test(s)) s+='?';
  return s;
}
function deifyLidChoice(txt){
  if(!txt) return txt;
  const exact={
    'Citizens with voting rights':'Wahlberechtigte Bürgerinnen und Bürger',
    'The Länder governments':'Die Landesregierungen',
    'Only the Federal President':'Nur der Bundespräsident',
    'Election fraud':'Wahlbetrug',
    'Different opinions':'Verschiedene Meinungen',
    'Peaceful criticism':'Friedliche Kritik',
    'You vote secretly':'Man wählt geheim',
    'You show your ballot publicly':'Man zeigt den Wahlzettel öffentlich',
    'You ask the police to decide':'Die Polizei entscheidet',
    'So different opinions can be represented':'Damit verschiedene Meinungen vertreten werden können',
    'So one party controls everything':'Damit eine Partei alles kontrolliert',
    'So elections become unnecessary':'Damit Wahlen unnötig werden',
    'Media may report freely within the law':'Medien dürfen im Rahmen des Gesetzes frei berichten',
    'Newspapers need permission from one party':'Zeitungen brauchen die Erlaubnis einer Partei',
    'Only state media may publish':'Nur staatliche Medien dürfen veröffentlichen',
    'Only one religion is allowed':'Nur eine Religion ist erlaubt',
    'Everyone may choose and practise a religion freely':'Jeder darf seine Religion frei wählen und ausüben',
    'Religion is decided by the employer':'Der Arbeitgeber entscheidet über die Religion',
    'Black, red, gold':'Schwarz, Rot, Gold',
    'Blue, white, red':'Blau, Weiß, Rot',
    'Green, white, black':'Grün, Weiß, Schwarz',
    'both have the same rights':'Frauen und Männer haben die gleichen Rechte',
    'men may vote twice':'Männer dürfen zweimal wählen',
    'women cannot work':'Frauen dürfen nicht arbeiten'
  };
  if(exact[txt]) return exact[txt];
  let s=' '+txt+' ';
  const reps=[
    [' The ',' Die '],[' the ',' die '],[' citizens ',' Bürgerinnen und Bürger '],[' federal parliament ',' Bundestag '],[' federal government ',' Bundesregierung '],
    [' voting rights ',' Wahlrecht '],[' freedom of religion ',' Religionsfreiheit '],[' freedom of expression ',' Meinungsfreiheit '],[' freedom of the press ',' Pressefreiheit '],
    [' equal rights ',' Gleichberechtigung '],[' women and men ',' Frauen und Männer '],[' Germany ',' Deutschland '],[' human dignity ',' Menschenwürde '],
    [' constitution ',' Verfassung '],[' basic law ',' Grundgesetz '],[' election ',' Wahl '],[' elections ',' Wahlen '],[' law ',' Gesetz '],[' laws ',' Gesetze '],
    [' police ',' Polizei '],[' government ',' Regierung '],[' parliament ',' Parlament '],[' church ',' Kirche '],[' religion ',' Religion '],
    [' may ',' dürfen '],[' must ',' müssen '],[' can ',' können '],[' only ',' nur '],[' not ',' nicht '],[' freely ',' frei '],[' secretly ',' geheim '],
    [' and ',' und '],[' or ',' oder '],[' children ',' Kinder '],[' employers ',' Arbeitgeber '],[' state ',' Staat '],[' states ',' Staaten ']
  ];
  for(const [a,b] of reps) s=s.replaceAll(a,b);
  s=s.replace(/\s+/g,' ').trim();
  return s.charAt(0).toUpperCase()+s.slice(1);
}
function deifyLidExplain(txt){
  if(!txt) return txt;
  let s=' '+txt+' ';
  const reps=[
    [" Germany's constitution is called the Grundgesetz. "," Die deutsche Verfassung heißt Grundgesetz. "],
    [' Citizens elect the Bundestag in democratic elections. ',' Die Bürgerinnen und Bürger wählen den Bundestag in demokratischen Wahlen. '],
    [' Voting is secret. ',' Wahlen sind geheim. '],
    [' Press freedom is a protected basic right. ',' Die Pressefreiheit ist ein geschütztes Grundrecht. '],
    [' Freedom of religion protects individual choice. ',' Die Religionsfreiheit schützt die freie persönliche Entscheidung. '],
    [' Germany has 16 Länder. ',' Deutschland hat 16 Bundesländer. '],
    [' Berlin is the capital. ',' Berlin ist die Hauptstadt. '],
    [' Everyone is equal before the law. ',' Alle Menschen sind vor dem Gesetz gleich. '],
    [' Opposition is part of democratic control. ',' Die Opposition gehört zur demokratischen Kontrolle. '],
    [' Human dignity is protected by the Basic Law. ',' Die Menschenwürde wird durch das Grundgesetz geschützt. '],
    [' The Berlin Wall fell was a key event in 1989. ',' Der Fall der Berliner Mauer war 1989 ein zentrales Ereignis. ']
  ];
  for(const [a,b] of reps) s=s.replaceAll(a,b);
  if(s.trim()!==txt.trim()) return s.trim();
  return txt.replace(/Germany/g,'Deutschland').replace(/German/g,'deutsch').replace(/constitution/g,'Verfassung').replace(/freedom of religion/g,'Religionsfreiheit').replace(/freedom of expression/g,'Meinungsfreiheit').replace(/freedom of the press/g,'Pressefreiheit').replace(/equal rights/g,'Gleichberechtigung').replace(/women and men/g,'Frauen und Männer');
}
function normalizeLidQuestion(item){ return {q:item.q||'', q_de:item.q_de||deifyLidText(item.q||''), choices:item.choices||[], choices_de:item.choices_de||((item.choices||[]).map(deifyLidChoice)), a:item.a||0, ex:item.ex||'', ex_de:item.ex_de||deifyLidExplain(item.ex||'')}; }
LID_QUESTIONS=(state.data.lid||RAW_LID).map(normalizeLidQuestion);
function newLid(){ state.currentLid=LID_QUESTIONS[Math.floor(Math.random()*LID_QUESTIONS.length)]||LID_QUESTIONS[0]; renderLid(); }
function renderLid(){ const item=state.currentLid; if(!item) return; const showEn=$('#lidShowEnglish').checked; const qDe=item.q_de||item.q||''; const qEn=item.q||''; $('#lidQuestion').innerHTML=showEn && qEn && qEn!==qDe ? `${qDe}<div class="muted tiny">${qEn}</div>` : qDe; const choicesDe=(item.choices_de&&item.choices_de.length)?item.choices_de:(item.choices||[]); $('#lidChoices').innerHTML=choicesDe.map((c,i)=>{ const en=(item.choices&&item.choices[i])||''; const label=showEn && en && en!==c ? `${c}<div class="muted tiny">${en}</div>` : c; return `<button class="lid-choice" data-i="${i}">${label}</button>`; }).join(''); $$('.lid-choice').forEach(b=>b.onclick=()=>checkLid(+b.dataset.i)); $('#lidMeta').textContent=t('German exam mode: answer in German by default.','Deutscher Prüfungsmodus: Standardmäßig auf Deutsch.'); $('#lidFeedback').textContent=''; $('#lidExplain').classList.add('hidden'); }
function checkLid(i){ const item=state.currentLid; const ok=i===item.a; const showEn=$('#lidShowEnglish').checked; const choicesDe=(item.choices_de&&item.choices_de.length)?item.choices_de:item.choices; const ans=choicesDe[item.a]||item.choices[item.a]; const ansHtml=showEn && item.choices[item.a] && item.choices[item.a]!==ans ? `${ans}<br><span class="muted tiny">(${item.choices[item.a]})</span>` : ans; const ex=item.ex_de||item.ex; const exHtml=showEn && item.ex && item.ex!==ex ? `${ex}<br><span class="muted tiny">(${item.ex})</span>` : ex; $('#lidFeedback').textContent=ok?t('Correct!','Richtig!'):t('Not correct.','Nicht richtig.'); $('#lidFeedback').className='result '+(ok?'good':'bad'); $('#lidExplain').innerHTML=`<strong>${t('Correct answer','Richtige Antwort')}:</strong> ${ansHtml}<br><strong>${t('Explanation','Erklärung')}:</strong> ${exHtml}`; $('#lidExplain').classList.remove('hidden'); recordWeak('leben_in_deutschland',ok); if(ok) addXP(1); saveStore(); updateHeader(); }
function showLidAnswer(){ if(!state.currentLid) return; const showEn=$('#lidShowEnglish').checked; const choicesDe=(state.currentLid.choices_de&&state.currentLid.choices_de.length)?state.currentLid.choices_de:state.currentLid.choices; const ans=choicesDe[state.currentLid.a]||state.currentLid.choices[state.currentLid.a]; $('#lidExplain').innerHTML=`<strong>${t('Correct answer','Richtige Antwort')}:</strong> ${ans}${showEn && state.currentLid.choices[state.currentLid.a] && state.currentLid.choices[state.currentLid.a]!==ans ? '<br><span class="muted tiny">('+state.currentLid.choices[state.currentLid.a]+')</span>' : ''}`; $('#lidExplain').classList.remove('hidden'); }
function bind(){ $('#sidebarOpen').onclick=()=>$('#sidebar').classList.add('open'); $('#sidebarClose').onclick=()=>$('#sidebar').classList.remove('open'); $$('.navbtn').forEach(b=>b.onclick=()=>goSection(b.dataset.section)); $$('.pgroupbtn').forEach(b=>b.onclick=()=>switchPracticeGroup(b.dataset.pgroup)); $$('.psubbtn').forEach(b=>b.onclick=()=>switchPractice(b.dataset.practice)); $$('.vocabbtn').forEach(b=>b.onclick=()=>switchVocab(b.dataset.vmode)); $$('.exambtn').forEach(b=>b.onclick=()=>switchExam(b.dataset.emode)); $('#themeSelect').onchange=e=>setTheme(e.target.value); $('#settingsTheme').onchange=e=>setTheme(e.target.value); $('#languageSelect').onchange=e=>setLanguage(e.target.value); $('#settingsLanguage').onchange=e=>setLanguage(e.target.value); $('#missionPreset').onchange=e=>{ store.missionPreset=e.target.value; saveStore(); updateHeader(); }; ['customPassages','customExercises','customVocab','customWriting'].forEach(id=>$('#'+id).onchange=()=>{ store.missionCustom={passages:+$('#customPassages').value,exercises:+$('#customExercises').value,vocab:+$('#customVocab').value,writing:+$('#customWriting').value}; saveStore(); updateHeader(); }); $('#continueBtn').onclick=()=>{ const weak=getWeakAreas()[0]; if(weak) openWeakTopic(weak.type); else { goSection('practice'); switchPractice('exercises'); newExercise(); } }; $('#resetTodayBtn').onclick=()=>{ store.daily[todayKey()]={uniquePassages:[],repeatPassages:0,correctExercises:0,attemptedExercises:0,uniqueVocab:[],writingDone:0,listeningDone:0,xp:0}; saveStore(); updateHeader(); }; $('#countRepeatsToggle').onchange=e=>{ store.countRepeats=e.target.checked; saveStore(); }; $('#exerciseLevelFilter').onchange=newExercise; $('#exerciseTypeFilter').onchange=newExercise; $('#exerciseFocusFilter').onchange=newExercise; $('#nextExerciseBtn').onclick=newExercise; $('#checkExerciseBtn').onclick=checkExercise; $('#showExerciseAnswerBtn').onclick=showExerciseAnswer; $('#typingLevelFilter').onchange=renderTypingOptions; $('#typingSelect').onchange=loadTypingPassage; $('#typingShowEnglish').onchange=()=>$('#typingEnglishWrap').classList.toggle('hidden',!$('#typingShowEnglish').checked); $('#playPassageBtn').onclick=()=>{ const p=currentPassage(); if(p) speak(p.german,$('#audioSpeed').value); }; $('#stopPassageBtn').onclick=stopSpeak; $('#repeatPassageBtn').onclick=()=>{ const p=currentPassage(); if(p) speak(p.german,$('#audioSpeed').value); }; $('#checkTypingBtn').onclick=checkTyping; $('#clearTypingBtn').onclick=()=>$('#typingInput').value=''; $('#listenLevelFilter').onchange=newListening; if($('#listenShowEnglish')) $('#listenShowEnglish').onchange=newListening; $('#newListeningBtn').onclick=newListening; $('#playListenBtn').onclick=()=>speak(state.currentListen.text,$('#listenSpeed').value); $('#stopListenBtn').onclick=stopSpeak; $('#replayListenBtn').onclick=()=>speak(state.currentListen.text,$('#listenSpeed').value); $('#revealListenBtn').onclick=()=>$('#listenAnswer').classList.remove('hidden'); $('#checkListenBtn').onclick=checkListening; $('#structureLevelFilter').onchange=newStructure; $('#newStructureBtn').onclick=newStructure; $('#checkStructureBtn').onclick=checkStructure; $('#showStructureBtn').onclick=showStructure; $('#caseLevelFilter').onchange=()=>newCaseDrill(); $('#newCaseBtn').onclick=()=>newCaseDrill(); $('#showCaseBtn').onclick=showCaseDrill; $('#writingTaskSelect').onchange=renderWritingTask; if($('#writingShowEnglish')) $('#writingShowEnglish').onchange=renderWritingTask; $('#newWritingBtn').onclick=()=>{ $('#writingTaskSelect').selectedIndex=($('#writingTaskSelect').selectedIndex+1)%WRITING_TASKS.length; renderWritingTask(); }; $('#checkWritingBtn').onclick=checkWriting; $('#showWritingSampleBtn').onclick=()=>$('#writingSample').classList.remove('hidden'); 
 $('#fixedTopicSelect').onchange=newFixedRule; $('#newFixedBtn').onclick=newFixedRule; $('#checkFixedBtn').onclick=checkFixedRule; $('#showFixedBtn').onclick=showFixedRule;
 $('#topicFlowSelect').onchange=newTopicFlow; $('#newTopicFlowBtn').onclick=newTopicFlow; $('#checkTopicFlowBtn').onclick=checkTopicFlow; $('#showTopicFlowBtn').onclick=showTopicFlow;
 $('#startRevisionBtn').onclick=startRevisionMix; $('#newRevisionBtn').onclick=newRevisionMix; $('#checkRevisionBtn').onclick=checkRevisionMix; $('#showRevisionBtn').onclick=showRevisionMix;
 $('#vocabSearch').oninput=renderVocabList; $('#vocabLevelFilter').onchange=renderVocabList; $('#vocabTopicFilter').onchange=renderVocabList; $('#vocabDifficultOnly').onchange=renderVocabList; if($('#vocabShowEnglish')) $('#vocabShowEnglish').onchange=renderVocabList; $('#newMatchBtn').onclick=newMatch; $('#newTypeWordBtn').onclick=newTypeWord; $('#checkTypeWordBtn').onclick=()=>showTypeWord(false); $('#showTypeWordBtn').onclick=()=>showTypeWord(true); $('#grammarSearch').oninput=renderGrammar; $('#flashCategoryFilter').onchange=nextFlash; $('#nextFlashBtn').onclick=nextFlash; $('#flashCard').onclick=flipFlash; $('#conjLevelFilter').onchange=newConj; $('#newConjBtn').onclick=newConj; $('#checkConjBtn').onclick=checkConj; $('#showConjBtn').onclick=showConj; $('#startExamBtn').onclick=startExam; $('#quickExamBtn').onclick=startQuickExam; const exBtn=$('#exportProgressBtn'); if(exBtn) exBtn.onclick=exportProgress; const imp=$('#importProgressInput'); if(imp) imp.onchange=e=>importProgressFile(e.target.files&&e.target.files[0]); const ob=$('#startOnboardingBtn'); if(ob) ob.onclick=openOnboarding; const cob=$('#closeOnboardingBtn'); if(cob) cob.onclick=closeOnboarding; const sob=$('#saveOnboardingBtn'); if(sob) sob.onclick=saveOnboarding;  $('#finishExamBtn').onclick=finishExam; $('#photoTaskSelect').onchange=renderPhotoTask; $('#newPhotoTaskBtn').onclick=()=>{ $('#photoTaskSelect').selectedIndex=($('#photoTaskSelect').selectedIndex+1)%PHOTO_TASKS.length; renderPhotoTask(); }; $('#checkPhotoExamBtn').onclick=checkPhotoExam; $('#showPhotoSampleBtn').onclick=()=>$('#photoExamSample').classList.remove('hidden'); $('#qaMode').onchange=newQA; if($('#qaShowEnglish')) $('#qaShowEnglish').onchange=newQA; $('#newQARoundBtn').onclick=newQA; $('#checkQABtn').onclick=checkQA; $('#showQABtn').onclick=showQA; $('#newLidBtn').onclick=newLid; $('#showLidAnswerBtn').onclick=showLidAnswer; $('#lidShowEnglish').onchange=renderLid; const rw=$('#refreshWeakBtn'); if(rw) rw.onclick=renderWeakSection; const pw=$('#practiceWeakBtn'); if(pw) pw.onclick=()=>{ const first=getWeakAreas()[0]; if(first) openWeakTopic(first.type); else { goSection('practice'); switchPractice('exercises'); newExercise(); } }; const sa=$('#startAdaptiveBtn'); if(sa) sa.onclick=()=>{ const due=dueReviews()[0]; if(due) openReviewItem(due.id); else { const first=getWeakAreas()[0]; if(first) openWeakTopic(first.type); else { goSection('practice'); switchPractice('cases'); newCaseDrill(); } } }; }

function nextTypingPassage(){ const sel=$("#typingSelect"); if(!sel || !sel.options.length) return; sel.selectedIndex=(sel.selectedIndex+1)%sel.options.length; loadTypingPassage(); }
function bindKeyboardShortcuts(){
  const onEnter=(el,checkFn,nextFn,getFeedback,{textarea=false}={})=>{
    if(!el) return;
    el.addEventListener('keydown',e=>{
      if(e.key!=='Enter') return;
      if(textarea && e.shiftKey) return;
      e.preventDefault();
      const hasFeedback=(getFeedback()||'').trim().length>0;
      if(hasFeedback) nextFn(); else checkFn();
    });
  };
  onEnter($("#exerciseAnswerInput"), checkExercise, newExercise, ()=>$("#exerciseResult").textContent);
  onEnter($("#typingInput"), checkTyping, nextTypingPassage, ()=>$("#typingFeedback").textContent,{textarea:true});
  onEnter($("#listenInput"), checkListening, newListening, ()=>$("#listenFeedback").textContent,{textarea:true});
  onEnter($("#structureAnswer"), checkStructure, newStructure, ()=>$("#structureFeedback").textContent,{textarea:true});
  onEnter($("#qaInput"), checkQA, newQA, ()=>$("#qaFeedback").textContent,{textarea:true});
  onEnter($("#conjInput"), checkConj, newConj, ()=>$("#conjFeedback").textContent);
  const w=$("#writingInput");
  if(w) w.addEventListener('keydown',e=>{
    if(e.key==='Enter' && (e.ctrlKey||e.metaKey)){
      e.preventDefault();
      const hasFeedback=($("#writingFeedback").textContent||'').trim().length>0;
      if(hasFeedback){ $("#newWritingBtn").click(); } else { checkWriting(); }
    }
  });
  const lidWrap=$("#section-lid");
  if(lidWrap) lidWrap.addEventListener('keydown',e=>{
    if(!state.currentLid) return;
    if(['1','2','3'].includes(e.key)){ checkLid(Number(e.key)-1); }
    if(e.key==='Enter'){ e.preventDefault(); const hasFeedback=(($('#lidFeedback').textContent)||'').trim().length>0; if(hasFeedback) newLid(); }
  });
}

async function init(){
  const results=await Promise.all(DATA_FILES.map(async n=>{ try{ return [n, await loadJsonData(`data/${n}.json`)]; }catch(e){ console.error(e); return [n, null]; }}));
  const loaded=Object.fromEntries(results);
  const missing=DATA_FILES.filter(n=>loaded[n]==null);
  state.data.passages=(Array.isArray(loaded.passages)?loaded.passages:[]).map(normalizePassageItem);
  state.data.notes=loaded.notes||{};
  state.data.exercises=(Array.isArray(loaded.exercises)?loaded.exercises:((loaded.exercises&&loaded.exercises.exercises)||[])).map(normalizeExerciseItem);
  state.data.flashcards=(Array.isArray(loaded.flashcards)?loaded.flashcards:((loaded.flashcards&&loaded.flashcards.flashcards)||[])).map(normalizeFlashcardItem);
  state.data.conjugation=(Array.isArray(loaded.conjugation)?loaded.conjugation:((loaded.conjugation&&loaded.conjugation.verbs)||[])).map(normalizeConjugationItem);
  state.data.verbs=(Array.isArray(loaded.verbs)?loaded.verbs:((loaded.verbs&&loaded.verbs.verbs)||[])).map(normalizeConjugationItem);
  state.data.sentences=normalizeSentenceBank(loaded.sentences||{});
  state.data.vocab=(Array.isArray(loaded.vocab)?loaded.vocab:((loaded.vocab&&loaded.vocab.vocab)||[])).map(normalizeVocabItem);
  state.data.lid=Array.isArray(loaded.lid)?loaded.lid:[];
  LID_QUESTIONS=(state.data.lid&&state.data.lid.length?state.data.lid:RAW_LID).map(normalizeLidQuestionExternal);
  updateStreak();
  setTheme(store.theme);
  bind();
  bindKeyboardShortcuts();
  fillFilters(); fillGroupedPracticeSelectors();
  newExercise(); renderTypingOptions(); newListening(); newStructure(); newCaseDrill(); newFixedRule(); newTopicFlow(); renderWritingTask(); renderPhotoTask(); newQA(); nextFlash(); newConj(); newMatch(); newTypeWord(); newLid();
  setDataHealth(missing.length===0,missing.map(x=>x+'.json'));
  updateUI(); goSection(store.lastSection||'practice'); switchPracticeGroup(store.lastPracticeGroup||groupFromPractice(store.lastPractice||'exercises')); switchPractice(store.lastPractice||'exercises'); switchVocab('list'); switchExam('cefr');
  if(missing.length){ console.warn('Missing data files', missing); }
}
document.addEventListener('DOMContentLoaded', init);
