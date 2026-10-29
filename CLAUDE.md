# Deutsch Coach – notes for development

German course app (A1–C2) by Zombieland. Vanilla JavaScript PWA, no build step, hosted on GitHub Pages
(`.github/workflows/pages.yml`), Android APK via `build_apk.sh` (apktool wrapper around the web app).

## Layout
- `index.html` loads every script with `defer` and `?v=<version>` (must equal `App.version` in `js/app.js` – a unit test checks it).
- `js/core.js` Store (localStorage, profiles), SRS (FSRS via `js/fsrs.js`), grading, Speech (TTS + recordings via `js/voice.js`).
- `js/views*.js` screens (`window.Views[name]`), routed by `js/app.js` (`ROUTES`, `TAB_OF`, `KEEP`, `NEED` = data loaded on demand).
- `js/data/*.js` content. Generated ones (curriculum, vocab, bank …) come from `tools/build_data.py` – edit the sources in `tools/curriculum/` and `tools/legacy_data/`, then run it. Hand-written: dialogues, pictures, telc, telc2, starter.
- Engine: `js/engine.js`, `engine_plus.js`, `engine_more.js` (drill generators, `Engine.GEN`). Max (rule-based checker): `js/tutor.js`. Feedback: `js/feedback.js`.
- 7.x: `views11` library/guide, `views12` mock exams/notebook/audio lessons/dictation/story/declension, `extras` recorder/notebook/writing history/weekly, `mistakes`, `today`, `errlog`, `voice`, `fsrs`.
- Editions: `python3 tools/make_editions.py OUT` → stable + lab (lab: own storage keys `deutschcoach.lab.*`, own SW caches, Gemma, diagnostics).

## Rules that bit us
- Bump the version in `js/app.js`, `sw.js` (`VERSION`), every `?v=` in `index.html`, `android/AndroidManifest.xml`; add News (`js/views6.js`) and CHANGELOG.
- New JS files: add to `index.html` and `FILES` in `sw.js`. Lazy data files: add to `NEED` in `app.js` and the data list in `sw.js`.
- All German text must pass Max with no false alarms: `node tests/run.js` checks ~10,000 sentences.
- Content is original. Never copy official exam papers (telc/Goethe are linked, not copied).
- Celebrations must not cover exercises (`Habit.celebrate` selector list in `js/habit.js`).

## Tests
- `node tests/run.js` – content, generators, Max cases and false alarms.
- `node tests/browser/run-all.js [name …]` – Playwright/Chromium browser tests (needs `npm i playwright@1.63.0` and `npx playwright install chromium`); logs and screenshots in `tests/browser/out/`.
- CI runs both (`.github/workflows/tests.yml`).

## Natural voices
`tools/audio_texts.js` lists every sentence to record (split exactly like `splitSentences` in core.js); `tools/make_audio.py` makes `audio/<voice>/<fnv1a>.mp3` + `audio/index.json` with Piper (voices m/f/f2/n). The Pages workflow runs it with a cache on each deploy. Without recordings the app uses the device voice.
