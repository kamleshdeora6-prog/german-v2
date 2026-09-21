# Deutsch Coach — v4

A single, offline-first app for learning German from zero to C2: a 60-lesson course, an unlimited
sentence generator that explains **why** every answer is right or wrong, 1,989 spaced-repetition words,
listening, speaking, reading, writing and reading exam trainers, and an offline tutor called **Max**.

Runs as a website (GitHub Pages), as an installable PWA on Android/iOS/desktop, and as a native
Android APK (`dist/deutsch-coach.apk`).

---

## What's inside

**The line (learning path).** 60 lessons (A1 → C2) in a fixed order, grouped like transit lines: A1 (1–12),
A2 (13–24), B1 (25–42), B2 (43–50), C1 (51–56), C2 (57–60). Each lesson unlocks when the previous one is passed (≥ 70 %), and every lesson
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

**Also included:** spaced-repetition word deck (1,989 words (A1 → C2) incl. articles and plurals), der/die/das
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


## What's new in v4

- **60 lessons** instead of 42: B2 (43–50), C1 (51–56), C2 (57–60) — Konjunktiv I, participles, nominal style, passive alternatives, Funktionsverbgefüge, subjective modals, Konjunktiv II past, extended attributes, modal particles, cohesion, register, complex syntax, hedging, exam finale. Same structure as before: rule, table, 10 examples, reading text, 10 exercises, 10 exam questions, speaking prompts.
- **1,989 vocabulary items** with level and topic (A1 510 · A2 381 · B1 461 · B2 246 · C1 235 · C2 156), including C2 idioms and genitive prepositions. All of it feeds the flashcard/SRS system.
- **Reading exam trainer** (`#/readexam`): 5 exam-style sets (A2 matching, B1 true-false + multiple choice, B1 job texts, B2 Sachtext, C1 Kommentar) with a reason for every answer and a pass mark at 60 %.
- **Writing exam trainer** (`#/write`): 10 tasks A2 → C2 (informal email, complaint, forum post, application letter, report, Erörterung, Stellungnahme, Kommentar) with content points, phrase bank, timer, dictation, live word/sentence/connector counters, automatic grammar check and a full model text.
- **Notes** (`#/notes`): one cheat-sheet page per level, all rules and tables of that level.
- **50 exercise generators** (was 35): 14 new ones for B2–C2 plus `satzbau`.
- **Free word order** (`#/practice/satzbau`): the generator computes *every* correct order for a sentence (TeKaMoLo, Dativ before Akkusativ, verb in position 2, prefix last). Any correct order is accepted; after a correct answer the app shows how many orders exist, lists them, and challenges you to produce a different one.
- **Dictionary links**: every looked-up word and every lesson vocabulary item links out to Linguee, DeepL, dict.cc, Duden and Wiktionary. Inside the Android app these open in the system browser via the `openUrl` bridge.
- **iOS project** in `ios/` (see below).

## iOS

Apple's build tools only run on macOS, so the `.ipa` has to be produced on a Mac. There are three routes, in order of effort:

**1. No Mac, no Apple developer account (GitHub builds it for you).**
Push the repo to GitHub and run the workflow *Build iOS app (unsigned IPA)* under Actions (or push a `v*` tag). It runs on GitHub's macOS machines, generates the Xcode project with XcodeGen and uploads `DeutschCoach-unsigned.ipa` as an artifact. Download it, then install it on the iPhone with **AltStore** (AltServer runs on Windows and macOS) or **Sideloadly** (Windows/macOS). Both re-sign the app with your own free Apple ID on the spot. A free Apple ID means the app stops working after 7 days and needs a refresh — AltStore does that automatically over Wi-Fi while the computer is on. With a paid Apple Developer account ($99/year) it lasts a year and can go through TestFlight instead.

**2. With a Mac.**
```
brew install xcodegen      # once
cd ios && ./build_ios.sh --open
```
Press ▶ in Xcode with the iPhone connected. A free Apple ID gives 7-day builds; a paid account gives a year and App Store / TestFlight distribution.

**3. App Store.**
Only route that needs the paid account plus Apple's review. Nothing in the app should trip the review rules, but it's the slowest path.

`ios/Sources/App.swift` is a WKWebView host exposing the same bridge as Android: native German text-to-speech (`AVSpeechSynthesizer`), speech recognition (`SFSpeechRecognizer`, de-DE), share sheet and external dictionary links. iPhone-only is the default; `TARGETED_DEVICE_FAMILY` in `ios/project.yml` is set to `1,2` (iPhone + iPad) — change it to `1` for iPhone only.

**Without a Mac:** open the GitHub Pages URL on the iPhone in Safari → Share → *Add to Home Screen*. That installs the PWA: full screen, own icon, and everything works offline after the first load (service worker v4). The only iOS limitation is speech recognition — Safari's `webkitSpeechRecognition` is unavailable, so the microphone exercises fall back to typing; text-to-speech works.
