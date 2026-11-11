# Problems (collected with Sohan, fixed together)

Status: 1–11 fixed in 7.3.0 (30 Oct 2026) – tested in `tests/browser/fixes.js` and `tests/run.js`. New problems go below as 12, 13 …

## 1. ✅ (7.3) Word-order questions ("Unlimited practice" in a lesson, e.g. Lesson 4 – make a yes/no question)
Reported 29 Oct 2026, screenshots: Lesson 4 → Practice → Unlimited practice.
- The word tiles show, but tapping them doesn't visibly build the sentence – there is no answer line, so you can't make the question.
- There is no way to type the answer yourself.
- "Check" with nothing built just shows the solution ("Not quite").
- The tiles give the answer away: "Essen" is capitalised (the first word), the other words are lowercase.
To do: check that tapping moves tiles into a visible answer line (and back), add "⌨ Type instead", hide capitals/punctuation on tiles, and don't allow Check before an answer exists.

## 2. ✅ (7.3) Lesson exam questions without the text (Lesson 4 → Exam)
Reported 29 Oct 2026. Questions like "Woher kommt Leila?", "Seit wann ist Ravi in Berlin?", "Warum lernt Ravi Deutsch?"
are about the lesson's reading text, but the Exam tab doesn't show that text – you have to switch to the Read tab
and back, and lose your place.
To do: show the reading text on the Exam tab (foldable, or side by side on PC / sticky "Show text" panel on the phone),
with listening, so questions can be answered without leaving the page.

## 3. ✅ (7.3) Spelling mistakes marked as correct (Lesson tasks, "Frage zur Antwort")
Reported 29 Oct 2026, screenshot: "Frage zur Antwort: „Nein, ich bin ledig.“" – typed "bist du verhertitet?" → "✓ Richtig!",
only the capital B was mentioned. The answer is "Bist du verheiratet?".
Cause: the lesson task/exam check (js/views1.js ~204 and ~311) accepts an answer when half of the content words match
(`Grade.overlap(...) >= 0.5`). "bist" matched, "verhertitet" didn't – 1 of 2 = 0.5 → counted correct, and FB.closed() is then
called with {ok:true}, so the misspelled word is never shown.
To do: short answers (one right solution) must match word by word – allow small typos only as "Almost" with the wrong
letters marked (verh<del>ert</del>itet → verh<mark>eira</mark>tet); keep the content-overlap rule only for long free answers;
always show spelling differences even when the answer counts; add test cases for typos in tests/run.js.

## 4. ✅ (7.3) Free writing checked too softly (Lesson 4 → Exam/Write, "Welche Fragen stellt man beim ersten Treffen nicht? Warum?")
Reported 29 Oct 2026. Answer: "Für ersten treffen man muss nicht fragen , wie viel geld hast du ? Weil es ist eine personal information ist"
→ "Sehr gut!", only "geld → Geld" corrected. This check is Max (rule-based), not an AI model.
Missed: "Für ersten" → "Beim ersten"; "treffen" → "Treffen" (noun); verb 2nd ("… muss man nicht fragen"; better "sollte/darf man");
"Weil es ist … ist" → verb at the end + doubled verb ("weil das persönlich ist"); English word "personal information";
"Weil …" alone as a sentence; space before "," and "?".
To do: Max rules for these (weil/dass + verb at the end, doubled verb, verb 2nd after a time/place start, English words,
nouns after articles/prepositions lowercase, space before punctuation); the score must drop with the number of
mistakes (no "Sehr gut" with 5+ errors); if Claude or the local AI is set up, offer "Check deeper with AI" on writing tasks.

## 5. ✅ (7.3) Wish: model answers at several levels
For writing/speaking tasks show 2–3 model answers: simple (the lesson's level, e.g. A2), then B1 and B2 – same idea,
richer words and sentence structure (weil/dass/obwohl, Konjunktiv II, Passiv …), with the new parts highlighted.
To do: add levelled models to the lesson tasks and mock-exam writing/speaking parts (written by hand, checked by Max);
AI can make more on demand if set up.

## 6. ✅ (7.3) Wish: teacher-style corrections for writing
Like Claude's reply in chat: the corrected sentence first, then one line per mistake – what → what, and *why* in plain words
(e.g. "Für ersten → Beim ersten: 'at the first meeting' is beim ersten Treffen"; "weil … ist: after weil the verb goes to
the end, only once"; "personal information → persönlich: use German words"), plus a tip for a better word (muss → sollte).
To do: Max – every rule gets a short why-text and an example, and the full corrected sentence is built from all fixes
(not just capitals); fixed phrases (beim ersten Treffen, am Wochenende, zum Arzt …) as a phrase list Max can match.
"Check deeper with AI" (Claude / local AI): ask for exactly this format – corrected text, list of what → what + why, a better
word tip, A2/B1/B2 model – shown in the same layout. Each correction can be saved to "My mistakes".
Honest limit: offline Max only explains mistakes it has a rule for; unusual phrasing needs the AI check.

## 7. ✅ (7.3) Speaking/writing check sees only capital letters (Today → Speak, Lesson 5 "Wie findest du die Wohnung?")
Reported 29 Oct 2026. Answer: "Das Sofa ist rote, Meine Zimmer hat 1 zimmer 1 koche, Die Zimmer hat ein bed, Meine Zimmer hat
eine schrank, Mein Zimmer ist im sebt stock." → "Gut!", only zimmer→Zimmer, stock→Stock.
Missed: rote → rot (no ending after ist); Meine/Die Zimmer → Mein/Das Zimmer (das Zimmer); 1 Zimmer 1 koche → ein Zimmer und
eine Küche (digits for ein/eine, misspelt Küche); bed → Bett (English); eine schrank → einen Schrank (hat + Akkusativ, der Schrank);
sebt stock → im siebten Stock; commas between whole sentences → full stops; capital after a comma.
Also: counted as "1 sentence" (comma-joined), and the score "Gut!" is too high for ~8 mistakes. "Words from this lesson"
should check gender too (der Schrank, das Zimmer).
To do: same as 4 + 6 – Max rules: gender from the vocab list (article ↔ noun), Akkusativ after haben/kaufen…, predicative adjective
without ending, digits for ein/eine, English words (bed, chair …) with the German word, comma splice; score scales with mistakes;
"Better: …" sentence suggestion + "words you could use" from the lesson (Küche, Bett, Schrank, gemütlich, hell …).

## 8. ✅ (7.3) Daily goal doesn't match the B1 plan (Home)
"B1 in 63 days · 158 min a day", but the daily goal is 30 XP – after 2–3 questions it says "Tagesziel erreicht ✓".
Agreed with Sohan (29 Oct): count WORK DONE, not only clock time.
- Every task has a "worth" in minutes (lesson part ~20 min, drill set ~8, listening ~5, mock-exam part ~15, 5 new words ~5 …).
  Finishing it credits its full worth, even if done faster (knew the topic: 20-min chapter in 5 min = 20 min of work).
  Partly done = partial credit (e.g. 6 of 10 questions = 60 %).
- Daily goal = the plan's minutes (158) of work. Show "60 of 158 min of work done · 98 min left".
- Separately, small in a corner: real time used today ("⏱ 35 min studied today"), active time only, paused when idle.
- Streak stays easy (agreed 29 Oct): any real practice day (a small minimum, e.g. 10 min of work) keeps the streak – a short
  day must not feel like a failure.
- Carry-over balance against the plan: work done minus daily target, added up since the plan started.
  e.g. target 90 min/day: day 1 = 180 min (+90), day 2 = 60 min (−30) → "60 min ahead of plan". Behind → "45 min behind –
  catch up over the next days". Show it on Home/Today; extra minutes today count toward the balance, not "wasted".
- Daily tick: ✓ when today's target is met, or a lighter "covered by your lead" mark when you're ahead.
- The B1 date can move with the balance ("At this pace: B1 by 20 Dec – 5 days early"). XP stays as points, not the goal.
- Today's session plan fills the remaining minutes with tasks (not "1 step left · ~4 min").

## 9. ✅ (7.3) Today's session on Home
The left column under the streak is empty. Show the Today plan there, expanded: every step with ✓ / next / time,
"Start next step" button, minutes done/left – so you see what's next as soon as you open the app, without opening Today.
(Phone: the same card at the top.)

## 10. ✅ (7.3) Wish: 5 new words of the day
Each day 5 new words (from the current lesson first, then the level's vocab list) with article, plural, example sentence
and audio; added to flashcards automatically; part of Today's session ("Learn 5 new words"); shown on Home.
Optional: choose 5/10/15 in settings.

## 11. ✅ (7.3) Small: "mistake:correction" shown as a raw name in "Diese Woche" (Home)
Should read "Corrections from Max" (Mistakes.title), and the internal "mistake:…" practice names need nice titles everywhere.

## 12. ✅ (7.5) Word order: more than one right answer is marked wrong
Reported 31 Oct 2026. "Wir essen morgen das Brot." and "Wir essen das Brot morgen." are both correct, but the app accepts only one.
German rule: the verb is fixed (position 2), but the middle field is flexible – a time word can stand before or after a
*known* object (das Brot, ihn, es). With "ein Brot" / no article, time first is the normal order (Wir essen morgen ein Brot).
To do: in the word-order generators (and Grade/order checks) build all correct orders automatically – time before/after a
definite object or pronoun, place/time swaps, the time word in position 1 (Morgen essen wir das Brot) – and accept every one;
show "German allows 2 correct orders" with both (the "orders" feature exists – extend it to all generators); add tests that
every accepted order passes Max and that wrong ones (verb not in position 2) still fail.

## 13. ✅ (7.5) Case rules and tips: what always takes Dativ / Akkusativ (+ clearer translation feedback)
Reported 31 Oct 2026, screenshot: Translate EN → DE "They thank the woman tomorrow." – typed "ihr danken morgen die frau"
→ only "Not quite" + the model answer. Not explained: ihr = you (all) – "they" is sie; danken always takes the Dativ → der Frau
(not die Frau); capital F.
To do:
- Feedback for typed sentences: word-by-word diff (ihr → Sie, die → der) and one "why" line per difference, using Max's rules
  (subject ↔ verb ending, case after verb/preposition, gender) – like the writing feedback in 7.3.
- A "Which case?" reference (Grammar → Cases, also reachable from Max and every drill guide), with lists and examples:
  · Dativ verbs: helfen, danken, gehören, gefallen, gratulieren, antworten, folgen, glauben (jemandem), passen, schmecken,
    fehlen, vertrauen, zuhören, wehtun, begegnen, raten, verzeihen …
  · Akkusativ verbs (most verbs): haben, sehen, kaufen, brauchen, besuchen, fragen, kennen, lieben, suchen, finden, trinken …
  · Dativ + Akkusativ verbs (person Dativ, thing Akkusativ): geben, schenken, zeigen, schicken, bringen, erklären, leihen, empfehlen …
  · Prepositions: Akkusativ – durch, für, gegen, ohne, um, bis, entlang · Dativ – aus, bei, mit, nach, seit, von, zu, gegenüber, ab ·
    Wechsel (Wo? → Dativ, Wohin? → Akkusativ) – an, auf, hinter, in, neben, über, unter, vor, zwischen · Genitiv – wegen, trotz,
    während, statt.
  · Article tables (der/die/das/die → den/die/das/die → dem/der/dem/den + n) and mnemonics (e.g. "DOGFU" for Akkusativ prepositions).
- Tips in context: when a sentence in a drill/translation has a Dativ verb or a case preposition, show a small note
  ("danken + Dativ → der Frau") under the question or in the feedback, with a link to the list. Lists as flashcards too.

## 14. ✅ (7.5) "Not quite" for a one-word slip feels harsh – say what is wrong and how close it was
Reported 31 Oct 2026, screenshot: "He buys a watch at eight o'clock." – typed "er kauft am acht uhr eine uhr" → red "✗ Not quite.
Almost – one letter is different." The only real mistake is am → um (a whole word, not a letter) – the rest was right.
To do:
- Graded verdicts instead of right/wrong only: ✓ Richtig · 🟡 Almost – 1 word (am → um) · 🟠 2–3 words to fix · ✗ Not yet.
  "Almost" in amber, not red; the wrong word(s) marked in the sentence (er kauft <del>am</del> → <b>um</b> acht Uhr …).
- Name the topic of the slip and give the rule in one line, e.g. "Time: um + clock time (um acht Uhr) · am + day / part of the
  day (am Montag, am Abend) · im + month / season (im Mai) · in + … (in zwei Tagen)", with a link to the topic's guide.
- Same for other one-word slips: wrong article/case (die → der Frau: danken + Dativ), verb ending (ihr → sie / danken),
  missing umlaut, word order only (all words right, order wrong → "Right words – only the order").
- "Almost" counts as a near-miss: comes back sooner in My mistakes, smaller XP than right, combo not broken harshly
  (decide together). The letter-count message must only appear when it really is one letter.
- Add "Time prepositions (um / am / im / in / von … bis / seit / vor)" to the "Which case?" reference planned in problem 13.

## 15. ✅ (7.5) Every mistake needs its grammar topic – so I can learn and practise exactly that
Reported 31 Oct 2026. Today "My mistakes" groups by where the mistake happened (drill name, "Translate EN → DE", lesson,
exam part, "Corrections from Max"). It should say *what kind* of mistake it was.
To do:
- Tag each mistake with one or more grammar topics, found by comparing the answer with the model (and Max's rule that fired):
  time prepositions (am → um) · Dativ verbs (die → der Frau after danken) · Akkusativ (ein → einen) · prepositions + case ·
  Wechselpräpositionen · article / gender · adjective endings · verb ending / subject (ihr → sie) · verb position 2 ·
  verb at the end (weil, dass) · separable verbs · Perfekt haben/sein · nicht / kein · capitals · umlauts · spelling ·
  vocabulary (wrong word) · word order only.
- "My mistakes" sorted by topic with counts ("Dativ verbs – 7 mistakes, 3 fixed"), each with: 📘 the rule (guide / "Which case?"
  page), ▶ a targeted drill for that topic (existing generator, or fresh questions built from the mistakes), and the mistakes
  themselves to redo.
- Topic statistics over time: Home / weekly report shows the 3 weakest topics and whether they are getting better;
  Today's plan adds a drill for the weakest topic.
- Max's rules and the new one-word verdicts (problem 14) both report their topic, so writing/speaking mistakes count too.
- Old mistakes get tagged once on update where the topic can be worked out.

## 16. ✅ (7.4.1) Drills restart by themselves after 2–5 questions (Today) – URGENT
Reported 1 Nov 2026, screenshot: Today → Grammar drill restarted ~5 times after 2, 3, 5 questions.
Likely cause (7.4 sync): every few seconds after an answer the sync runs; `Sync.merge` rebuilds the progress object (key order,
merged lists), so it never looks "identical" to the local copy → `Store.replace` + `App.route()` re-renders the screen → the drill
starts again. (Device without sync: check whether it happens there too.)
To do: compare progress by content, not by JSON order; only reload the screen when the other device really changed something;
never re-render while an exercise/session/text box is open – apply quietly and show "☁ Updated from your other device";
browser test: answer 10 drill questions with sync on and a fake GitHub → no restart.

## 17. ✅ (7.4.1) Today's plan doesn't move forward: yesterday's leftovers, no new chapter, too repetitive
Reported 1 Nov 2026 (screenshot: 29 steps, Lesson 6 parts from yesterday, "3 h 13 min behind plan").
- New day = new plan, but the lesson part stays the same until it is finished, so an unfinished day means repeating the same
  chapter the next day and never reaching new material.
- The plan is 29 small steps of the same kinds (drill / speaking / listening / mistakes repeated 6–7 times).
To do:
- Every day includes NEW material: the next lesson part(s), and when the current lesson is ≥ 70 % / exam part done, the next
  lesson starts – unfinished parts of an older lesson become a short "finish" step, not the whole day.
- Plan by blocks with variety: new lesson (largest share) → words of the day → one drill for the weakest topic (problem 15) →
  listening → speaking → mistakes → mock exam part (B1); no repeats of the same step type more than twice; ~8–12 steps,
  each worth more minutes, instead of 29 tiny ones.
- Yesterday's undone steps are not copied; the balance shows the lost minutes once ("behind plan"), the new plan is for today only.
- "Behind plan" should be encouraging: show how much per day catches up ("+20 min/day for a week") instead of only the big number.

## 18. ✅ (7.5) More vocabulary – everyday words that were missing
1 Nov 2026: Sohan shared a "3000 essential words" book (Collins, 2019) as a checklist. Of ~1,990 single words/short phrases
in it, ~550 are already in the app; the other ~1,400 are listed in `docs/vocab-to-add.csv` (priority, topic, German, English, type).
Priority 1 (~750): everyday topics – food, shops, house, clothes, body, health, travel, town, bank, post, weather, school, IT.
Priority 2 (~290): leisure, animals, plants, music, sports in general. Priority 3 (~390): specialist (car parts, skeleton,
insects, boat travel, baby goods, single sports).
To do when we build it: the book is copyrighted – use it only as a checklist of which words are missing. Every app entry is our
own: article + plural + level + own example sentence + English, checked by Max; no phrases or sentences copied from the book.
Add priority 1 first (with lesson/topic links, so they show up in words of the day and flashcards by topic), then 2; 3 optional.

## 19. ✅ (7.5.1) Lesson says "done – next lesson open", but the next lesson stays locked (needs 2–3 runs)
- Reported 11 Nov 2026: after finishing a chapter's practice (≥ 70 %) the celebration says the next lesson is open, but it is still locked; solving the chapter 2–3 times opens it.
- Cause: with sync on, the other device's progress is merged in when you change screens. A lesson screen kept in the background (e.g. after "Back to Today") still pointed at the old copy, so the answers and "done" were saved there and lost.
- Fix: kept screens are rebuilt when the progress was replaced; lesson answers always save to the current progress.
