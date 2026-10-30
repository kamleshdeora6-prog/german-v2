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
