# Deutsch Coach 6.0 – specialist review and what was changed

Review date: 26 October 2026 · Base: version 5.0.0 (repo `german-v2`, live site on GitHub Pages)

## 1. German teacher

**Wrong German produced by the app**
| Where | Problem | Status |
|---|---|---|
| Sentence generator (questions, negation) | *„Er kommet“, „ihr kommet“* – a rule for *atmen/öffnen* also hit *kommen* | fixed + test |
| Präteritum drill | *„wir warn“, „sie warn“* instead of *waren* | fixed + test |
| Lesson 6 reading | *„Er nimmt einen Kilo“* → *ein Kilo* (das Kilo) | fixed |
| Lesson 52 task | *„als ob er ja nichts gewusst hätte“* – unnatural particle use | noted |
| Register drill | *„Das geht nicht klar“* offered as everyday German for *„nicht hinnehmbar“* (better: *„Das geht gar nicht.“*) | noted |
| Generator semantics | sentences like *„Ich gebe dem Arzt das Sofa“*, *„Am Abend sieht sie das Bett“* – grammatical but odd | noted for next version |

**Too little content (the main problem)**
| | 5.0 | 6.0 |
|---|---|---|
| Words in total | 1,995 | 3,548 |
| Words per lesson | 12 | 30 |
| Example sentences per lesson | 10 | 20 |
| Reading texts per lesson | 1 (50–90 words, even at C2) | 2 (second text: ~130 words at A1 → ~450 at C2) |
| Listening | lesson text read aloud | + a dialogue per lesson with 3 comprehension questions |
| Exercises per lesson | 10 | 20 |

Still open (recommended next): Perfekt appears only in lesson 17 although the Goethe A1 exam
expects it; B2–C2 need more lessons (relative clauses with *wer/was/wo*, passive with modal verbs,
formal letters); 1,400 more words to reach exam word-list size at B1/B2; example sentences for the new words;
real recorded audio instead of device voices.

## 2. Habit and motivation specialist – why people quit

| Cause of drop-out | Change in 6.0 |
|---|---|
| Long onboarding before the first exercise | 3 taps (name → daily goal + coach style → level), then straight into lesson 1 |
| Start screen with ~13 cards = decision fatigue | “Heute”: one big button with the single best next step |
| Lessons of 30–45 minutes, no sense of progress | 5 numbered steps per lesson with ticks; each step is 4–8 minutes |
| Streak reset after one missed day (“what-the-hell effect”) | Streak freezes: 1 per 7-day streak, max. 2, used automatically |
| Strict teacher scolds on broken streaks; default tone “streng” | Default tone “neutral”, chosen in onboarding; “Willkommen zurück” card after a break |
| No “done for today” moment | Daily-goal ring, celebration when reached, end-of-round summary |
| No variety in rewards | Rotating daily quests, combo bonus, levels with titles |
| Learning alone | Familien-Liga between the profiles on the device |
| No trigger to come back | Calendar reminder (.ics, repeats daily with alarm) |
| Celebrations interrupting a question | Queued until the end of the round |
| Streak days counted in UTC | Local date |

## 3. Designer – colour and structure

Palette “Mitternacht & Bernstein”: midnight ink `#14182B`, warm paper `#F7F5F0`, amber accent
`#FFB020` for every primary action and reward, green `#1FA971` only for “right”, red `#D93A3A`
only for “wrong”, flame `#FF7A1A` only for the streak, ice `#3BA7E8` only for freezes.
Article colours der/die/das stay blue/red/green (textbook convention). Dark theme `#0D1020`.
Tactile 3-D buttons, larger tap targets, no text selection on double-tap.

Navigation: **Heute · Kurs · Üben · Max · Mehr** (was 6 tabs + 4 top links + a floating button on every
screen). “Mehr” is grouped into Lernen / Nachschlagen / Prüfung / Planen / App. The Max button only
appears inside lessons and exercises.

## 4. Tester – findings (regression run: 58 scripted user checks, 0 console errors)

Fixed: “Play all” started a second playback loop on every tap (audio restarted by itself, two voices);
no pause/stop/rewind; next-lesson button hidden after lesson 42; two Theme selectors in Settings;
service worker served the old version first (site looked “stuck” after deploys); double-tap on the last
“Next” skipped the summary; reading questions and listening questions shared one handler;
Max flagged correct German (Konjunktiv I, *muss verteilt werden*, colons/semicolons, *dusche* as a verb,
*hat ihr Mann*, *seit Wochen*, *nutzen*).

Tested as a careless user: empty and whitespace names, HTML in names, spamming Play, leaving the screen
mid-audio, Esc, double-clicking answers and Next, empty answers, invalid URLs (`#/lesson/999`,
`#/practice/xyz` …), profile without name, streak edge cases (yesterday, gaps covered by freezes,
gaps too long, day-7 reward, same day twice).

## 5. Developer – what changed in the code

- `js/habit.js` (new): streaks with freezes, quests, combo, levels, league, celebrations, reminder file.
- `js/core.js`: sentence-based audio player (pause, resume, back, next, speed, generation counter),
  local dates, XP hook.
- `js/ui.js`: player bar, end-of-round summary, combo display.
- `js/views1.js`: new start screen, lesson steps, second text, listening scene.
- `js/views8.js` (new): grouped “Mehr”, Resources page.
- `js/tutor.js`: 8 false-alarm fixes (all found by checking the new content against Max).
- `sw.js`: network-first with offline fallback; update bar; “Reload newest version” in Settings.
- `tools/build_data.py`: `plus_*.txt` files add content per lesson; `vocab_d/e.txt` add words.
- `tests/run.js`: verb-form test, dialogue/second-text checks, duplicate-word check; Tests workflow added.
- iOS: launch screen, app icon, shared scheme, audio session, safe JS callbacks, native end-of-speech
  event; CI workflow rewritten. Android APK rebuilt as 6.0.0 (`dist/deutsch-coach.apk`).
