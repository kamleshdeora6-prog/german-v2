# Deutsch Coach — German A1 → B1

A single, offline-first app for learning German from zero to B1: a 42-lesson course, an unlimited
sentence generator that explains **why** every answer is right or wrong, spaced-repetition vocabulary,
listening, speaking, reading, exam training and an offline tutor called **Max**.

Runs as a website (GitHub Pages), as an installable PWA on Android/iOS/desktop, and as a native
Android APK (`dist/deutsch-coach.apk`).

---

## What's inside

**The line (learning path).** 42 lessons in a fixed order, grouped like transit lines: A1 (1–12),
A2 (13–24), B1 (25–42). Each lesson unlocks when the previous one is passed (≥ 70 %), and every lesson
lists which earlier lessons it reuses. Each lesson has five tabs:

| Tab | What you get |
|---|---|
| Learn | Explanation, "when do I use it", grammar table, 10 examples with audio, vocabulary |
| Read | A text that recycles earlier grammar, tap-a-word lookup, audio, comprehension questions |
| Practice | 10 fixed exercises (last 3 mix in older grammar) + unlimited generated drills |
| Exam | 10 exam-style questions; closed ones auto-checked, open ones checked by Max or spoken |
| Speak | A picture, prompts, a 2-minute timer, speech recognition and shadowing |

**Sentence engine (`js/engine.js`).** ~30 generators build correct German from a tagged lexicon
(gender, plural, n-declension, verb valency, stem changes, separable prefixes, auxiliaries). Each item
returns the answer **and** the reasoning: why this article/ending/word order, and why each wrong option
is wrong. Nothing repeats, so practice never runs out.

**Max, the tutor (`js/tutor.js`).** Works with no internet:
* explains ~40 grammar topics as *What / How / How NOT (typical mistakes) / Why*
* checks any German sentence you type or speak — word order, verb endings, haben vs sein,
  cases after verbs and prepositions, modal verbs, kein/nicht, als/wenn, capitalisation — and shows
  the corrected sentence with the rule behind each fix
* conjugates verbs, gives articles with a table, translates words, generates quizzes, plans your day
* optional: add your own Anthropic API key in Settings for open-ended questions (never required)

**Also included:** spaced-repetition word deck (717 words incl. articles and plurals), der/die/das
trainer, dictation, shadowing with word-by-word scoring, free-talk with speech recognition, 57 reading
texts, a B1 mock test (Lesen, Hören, Sprachbausteine, Schreiben, scored), a speaking-exam simulator
(Teil 1–3), the 183-question *Leben in Deutschland* quiz, a searchable grammar reference, progress
stats and a mistake log. Progress is stored on your device and can be exported/imported as JSON.

## Run it

* **Web:** open `index.html`, or push this repo to GitHub → Settings → Pages → deploy from `main` / root.
* **Phone (PWA):** open the Pages URL → Android Chrome: ⋮ → *Install app*; iPhone Safari: Share → *Add to Home Screen*. Works offline afterwards.
* **Android APK:** copy `dist/deutsch-coach.apk` to the phone and open it (allow "install unknown apps").
  The APK adds native text-to-speech and native speech recognition, and needs no internet at all.
* **iOS:** Apple does not allow sideloading without Xcode and a developer account, so use the PWA
  (Add to Home Screen) — it behaves like an app and works offline.

## Build it yourself

```bash
# 1. regenerate the data files from the curriculum sources (optional)
python3 tools/build_data.py            # needs: pip install reportlab pillow

# 2. build the APK  (needs java 17+)
mkdir -p tools/jars
curl -L -o tools/jars/apktool.jar https://github.com/iBotPeaches/Apktool/releases/download/v2.10.0/apktool_2.10.0.jar
curl -L -o tools/jars/signer.jar   https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar
TOOLS=tools/jars ./build_apk.sh        # → build/deutsch-coach.apk
```

The APK is a thin WebView wrapper (`android/`): the Java reference sources are in
`android/java-reference/`, the shipped implementation is the equivalent smali in `android/smali/`, so
the APK builds with apktool alone — no Android SDK or Gradle needed. It exposes
`AndroidBridge.speak/stop/listen/share` to the web app; the web app falls back to the browser's
Web Speech API when the bridge is absent.

A GitHub Actions workflow (`.github/workflows/build-apk.yml`) rebuilds the APK on every push and
uploads it as an artifact, so you can also get a fresh APK straight from GitHub.

## Layout

```
index.html  css/  icons/  manifest.webmanifest  sw.js   ← the app (static, no build step)
js/engine.js      sentence generator + grammar reasoning
js/tutor.js       offline tutor: rules, checker, dictionary
js/core.js        storage, spaced repetition, grading, speech
js/ui.js          exercise widget, sessions
js/views1..3.js   screens
js/data/*.js      generated data (curriculum, vocab, verbs, scenes, texts, LiD …)
tools/            curriculum sources + data generator
android/          APK wrapper (manifest, smali, resources)
dist/             prebuilt, signed APK
```

## Notes and limits

* Automatic checking is rule-based. It catches the frequent structural errors, not meaning or style —
  a green result means "no rule problem found", not "perfect German".
* Speech recognition needs Chrome (Android/desktop), Safari 14.1+ or the APK; text-to-speech needs a
  German voice installed on the device.
* The APK is signed with a debug key, which is fine for personal sideloading but not for Play Store.
* Exam formats follow Goethe/telc B1 practice; always check the current official model tests too.
