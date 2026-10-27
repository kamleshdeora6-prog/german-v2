# Changelog

All dates are the release dates of the app version shown in Settings → About.

## 6.8.0 — 26 October 2026
- Library hub (`js/views11.js`, route `library`): flashcards (`cards`), exercises by level/type (`exercises`), conjugation tables + drill (`verbs`), sentence translation (`sentences`), picture description (`pictures`), links to notes, passages, vocabulary, tables, LiD. Header link on desktop, tiles on Practice and More.
- Data: legacy `flashcards.json` (grammar/article/verb cards → `DC.cards`) and `sentences.json` (→ `DC.sentences`) are now built by `tools/build_data.py`; `js/data/pictures.js` uses the photos in `assets/` (APK now includes `assets/`). Three wrong legacy verb cards corrected.
- Reading list shows all levels (B2/C1 passages were hidden). Grammar → Tables shows `assets/grammar_reference.png`.
- Max: no false alarm for an infinitive before a finite verb at the end ("Bevor ich schlafen gehe"); 202 sentences and the picture models added to the false-alarm corpus.

## 6.7.0 — 26 October 2026
- Guided partner mode (`js/data/dialogues.js`, 12 hand-written scenarios × 6 steps with English and example answers; "lesson" scenario built from `l.speak` and exam model answers). No model needed; English detection, Max corrections, summary via `AI.localSummary`.
- `settings.partnerMode` ("guided" | "ai"), toggle on the partner page and in Settings; AI load failure or two failed turns → guided mode (stable).
- Editions: `js/edition.js` (`window.EDITION`); `tools/make_editions.py` builds stable and lab folders. Lab: Gemma 4, warm-up, `deutschcoach.lab.*` storage keys, import of stable progress, 18-answer A1/A2/B1 self-test, diagnostics report (GPU adapter, limits, load time, tokens/s, error ring buffer, ASR).
- Service worker: `PREFIX`-based cache names; `activate` deletes only its own edition's old caches, so stable and lab on the same github.io origin don't wipe each other.
- Max: "Seit wann …?" / "Bis morgen" are not subordinate clauses (dialogue lines added to the false-alarm corpus).

## 6.6.0 — 26 October 2026
- On-device models: Gemma 4 E2B (f16/f32 WebGPU libraries vendored, `model_manifest` and 192 MB buffer requirement passed through; `LLM.fits()` checks `maxStorageBufferBindingSize`); per-device recommendation.
- `LLM.chat` streams (`stream: true`, usage stats → tokens/s); never sends `extra_body.enable_thinking` (WebLLM would inject Qwen `<think>` tags into any model's prompt).
- German self-test (`LLM.selfTest`): six learner sentences, replies scored by Max (German only, rule problems, length, question), speed measured; results in Settings and in the model list.
- Partner: live streaming bubble; A1/A2 replies with over-long sentences are regenerated shorter; the model is preloaded on the scenario list; idle unload after 5 minutes.
- Max: new rule for ein/kein/mein/dein/sein/unser/euer without ending before feminine or plural nouns (3 new test cases; no new false alarms in the 8,000-sentence corpus).

## 6.5.0 — 26 October 2026
- **On-device AI (default)** – `js/llm.js`, `js/llm-worker.js`: WebLLM 0.2.86 in a module worker with Llama 3.2 1B (default) or 3B; f16 build on GPUs with `shader-f16`, f32 build otherwise (detected automatically). Downloaded once, then offline; delete button frees the space.
  - Speaking partner in local mode: German-only prompt at the learner's level, output cleaned (speaker labels, quotes, stage directions), one retry if Max flags the reply or it contains English, corrections of the learner by Max, summary built from Max's checks, scenario idea phrases, EN? gloss.
  - Max: open questions answered by the local model, labelled “can be wrong”.
  - Detailed AI feedback and AI exercises stay Claude-only (answer keys must be right).
- **Self-contained**: `vendor/` holds web-llm 0.2.86 (+ Llama 3.2 WebGPU libraries), transformers.js 4.3.1 and onnxruntime-web 1.31.0 (asyncify wasm). No CDN at runtime.
- **Models on your own site**: workflow “Add the offline AI models to the site” copies Llama 3.2 1B and Whisper base into `models/` (checks GitHub's 100 MB file and ~1 GB site limits, requests a Pages build). The app prefers `models/` and falls back to Hugging Face.
- Service worker: never caches `models/`; caches `vendor/` once (cache-first). `.nojekyll` added (faster Pages builds).
- Settings: AI tutor section with “On this device” / “Claude” choice.

## 6.4.1 — 26 October 2026
Sandbox review of the AI features (simulated API with broken, cut-off, malicious and failing replies; fake microphone input):
- `stop_reason: max_tokens` is detected and retried with a doubled budget (thinking shares `max_tokens`); higher budgets for all AI calls; the retry loop always ends with a clear error.
- Speaking partner: consecutive same-role turns are merged (the API requires alternation – this broke conversations after a failed reply); only the last 20 turns are sent; English answers are caught; hints only on request (and counted in the summary).
- Whisper: hallucinated subtitle credits and empty/noise transcripts are filtered.
- AI exercises: the model lists alternative correct answers (`accept`), each checked by Max.
- Backups never contain the API key; importing a backup keeps the key already on the device.

## 6.4.0 — 26 October 2026
- **AI tutor** (`js/ai.js`, `js/views10.js`): Claude via the learner's own API key (Haiku 5.5 default, Sonnet 5.5 optional, `low`/`medium` effort), retries and plain-English errors, monthly usage and cost estimate, learner profile in every request, tutor notes ("memory") with a forget button.
  - Speaking partner: 13 role-plays (A1–B2) + "today's lesson topic", spoken replies, inline corrections, end-of-talk summary; mistakes go to "My mistakes".
  - Detailed AI feedback under exam, speaking and writing answers (rule-based feedback stays first).
  - Exercises from my mistakes: generated items are dropped unless Max finds no error and the answer is valid.
  - Max uses Claude for questions his rules can't answer; script tags and event handlers in replies are removed.
  - Practice day adds an AI conversation block when the tutor is available.
- **Offline speech recognition** (`js/asr.js`, `js/asr-worker.js`): Whisper base (Xenova/whisper-base, 8-bit, WebAssembly) via transformers.js 4.3.1 in a module worker; silence detection, tap-to-stop, 16 kHz resampling; automatic fallback to the browser's recognition. The Android/iOS apps keep using native recognition.
- Settings: new AI tutor and speech-recognition sections; About & privacy updated.

## 6.3.0 — 26 October 2026
- **Next-part buttons** at the end of Practice, Exam and Speak (Speak → next lesson).
- **Feedback engine** (`js/feedback.js`): closed answers show the typed answer, a letter/word diff, capital-letter notes and a rule explanation for verb gaps (ending, extra -e-, vowel change, full table for irregular verbs); stale feedback is marked after editing. Open answers (exam + speaking) get a 0–100 score with a checklist (German, length, required words, questions, lesson grammar, Max corrections, capitals, lesson words) and a model answer.
- **232 model answers** and per-lesson grammar checks (`tools/curriculum/models.txt`); tests check that every model scores ≥ 60 with the app's own feedback and passes Max.
- **Speak**: answer each prompt by microphone or by typing.
- **Practice day** rebuilt: fills the plan's minutes, auto-ticks from real activity (lesson parts, cards, drills, dictations, reading, speaking, writing), skips finished lessons, “+15 minutes”.
- **Fixes**: weak topics read the wrong fields (always empty); “Word review ( due)”; celebrations blocked exercise screens; overlapping toasts; three Max false alarms (separable *ein* before a comma, modal + second clause with *oder*, state passive *sind repariert*).

## 6.2.0 — 26 October 2026
- **First steps (Erste Schritte)**: a Duolingo-style picture course for complete beginners – 18 units, 192 words with pictures, 86 sentences; 3 levels per unit (introduce → practise → recall); picture, listening, meaning, pair-matching, der/die/das, typing and tile-building exercises; mistakes return at the end of the round; flip flashcards and a mixed review on spaced repetition.
- **Complete English mode**: Settings → App language → English. All 73 lessons have an English title, topic and grammar explanation (German + English mode shows the English as a fold-out). German questions and speaking prompts have an **EN?** word-by-word hint.
- **Onboarding**: “I know zero German” switches the app to English and starts First steps.
- **Fixed**: a quest celebration could pop up in the middle of a round.

## 6.1.0 — 26 October 2026
- **Whole-screen layout on PC**: two-column start screen, lesson cards side by side, wide practice grid, two-column course path; the header logo is no longer cut off.
- **German + English labels** on every menu, tab, button and onboarding step; Settings → Menu language (both / German / English).
- **13 new lessons** (73 in total): Perfekt in A1; Passiv, Relativsätze, Verben mit Präposition and more in B2; academic and stylistic topics in C1/C2.
- **4,297 words** (from 3,548), with an example sentence for every A1/A2 word and most B1 words.
- **Stable lesson IDs**: progress stays correct when lessons are added.
- **iOS build fixed**: `build_ios.sh` ended with a test that returned exit code 1 on CI; the workflow now shows the real Xcode error if anything else fails.
- **Max**: no false alarms on adjectival nouns (*die Abgeordnete*) or dummy *es* (*Es fehlen …*); 7,788 correct sentences checked.

## 6.0.0 — 26 October 2026
- **New start screen “Heute”** with one next-step button, daily goal ring, streak and week view.
- **Habit system**: streak freezes, daily quests, combos, levels, Familien-Liga, calendar reminder, sounds and vibration.
- **Audio player** with pause, stop, back one sentence, skip and speed (fixes audio restarting by itself).
- **Content doubled**: 30 words, 20 examples, a second text, a listening dialogue with questions and 20 exercises in every lesson; 3,548 words in total.
- **Corrections**: verb forms in generated sentences (*kommet*, *warn*), *ein Kilo*, eight false alarms in Max.
- **New design** (Mitternacht & Bernstein), five-tab navigation, grouped “Mehr”, Resources page.
- **Updates arrive**: network-first offline cache, update bar, “Reload newest version”.
- **iOS build fixed** (launch screen, icon, scheme, audio session); guide for Windows in `docs/IOS_ON_WINDOWS.md`.
- Full review in `docs/REVIEW_v6.md`.

## 5.0.0 — 23 September 2026
- **Real placement test**: 96 original items in 12 stages (A1 → C2), four options, one rule each. Adaptive with a stop rule; result gives level, sub-level (e.g. B1.2), a starting lesson and the topics to fix first.
- **Learning plan**: pick a goal level and either a date or minutes per day. The app computes lessons, hours, daily minutes and words, warns when the maths doesn't work, and recalculates when you fall behind.
- **Practice day**: one session in order — lesson, word review, drills, weak topics, writing — with progress kept per day.
- **Weak topics**: what you actually get wrong, from your answers and the placement test, with drills.
- **Refresher** for returners: a 16-question check at the level you reached, then a ranked must-do list.
- **Frau Weber**, a strict teacher's voice on plans, repeated mistakes and broken streaks — blunt about the work, never about the person. Three tones in Settings (streng / neutral / freundlich).
- **Max is now available on every screen** as a floating button, with the context of what you're doing.
- **Screens keep their place**: leaving a session and coming back resumes where you were; the start screen offers "continue where you left off".
- **New themes**: System, Hell, Dunkel and Papier (warm, low contrast), plus four text sizes.

## 4.4.0 — 23 September 2026
- **Placement test** (More → Placement test): about 20 adaptive questions, a recommended starting lesson and your weakest topics.
- **Pronunciation drills** (Speak → Sounds): eight minimal-pair groups with audio, a listening quiz and a microphone check.
- **Writing exam feedback** now scores the four official criteria (task completion, coherence, vocabulary, structures) and shows the content points as a checklist.
- **What's new** screen and this changelog; the master report ships with the app under `docs/`.

## 4.3.0 — 22 September 2026
- Max checks **adjective endings** and 30 error types in total; 0 false alarms over ~2,500 correct sentences.
- New grammar: **n-Deklination**, **Futur II**, **complete adjective endings** (Genitiv and no article) with three new generators (53 in total).
- Vocabulary: examples for every C1/C2 word, 76 new words, 134 template duplicates removed (1,995 genuine words).
- Corrected wrong German in the legacy question bank, wrong titles and template questions on 15 reading texts, two gender errors.
- Own release signing key supported; `tests/run.js` and a Tests workflow; WCAG 2 AA fixes; textbook-like wording removed.

## 4.2.0 — 22 September 2026
- ⚑ Report a problem on every question; About & privacy page; backup reminder; sound check; Open Graph preview.

## 4.1.0 — 22 September 2026
- Learner profiles (several people per device); Translate tab with DeepL, LEO, Linguee and offline meanings.

## 4.0.0 — 20 September 2026
- B2, C1 and C2 levels (60 lessons); reading and writing exam trainers; word order with several correct answers.
