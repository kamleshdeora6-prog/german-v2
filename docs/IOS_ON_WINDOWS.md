# Deutsch Coach on iPhone – from a Windows laptop

You do **not** need a Mac. There are two ways; start with the first.

## Option 1 – Install the web app (2 minutes, recommended)

1. On the iPhone, open **Safari** (it must be Safari) and go to
   `https://kamleshdeora6-prog.github.io/german-v2/`
2. Tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
3. Open it from the home screen. It runs full-screen, works offline, keeps progress and
   updates itself (an "Update" bar appears when a new version is online).

Limits: no native speech engine (Safari's own German voice is used – install one under
*Settings → Accessibility → Spoken Content → Voices → German*).

## Option 2 – A real iOS app (.ipa), built by GitHub, installed with Sideloadly

### A. Let GitHub build the app (its Mac machines do it for you)
1. Push this repository to GitHub (see "Updating the repo" below).
2. On github.com open the repo → **Actions** → **Build iOS app (unsigned IPA)** → **Run workflow**.
3. Wait ~10 minutes until the run is green. Open the run → **Artifacts** →
   download **DeutschCoach-unsigned-ipa** (a .zip). Unzip it: you get `DeutschCoach-unsigned.ipa`.

If the run is red: open the failed step and copy the last 30 lines – that is the exact error.

### B. Install it on the iPhone from Windows
1. Install **iTunes for Windows** from apple.com (the *apple.com* version, not the Microsoft Store one –
   Sideloadly needs its drivers) and **Sideloadly** from sideloadly.io.
2. Connect the iPhone with a cable, unlock it, tap **Trust this computer**.
3. Open Sideloadly → drag the `.ipa` in → enter your **Apple ID** → **Start**.
   A free Apple ID works. Approve the two-factor code on your phone if asked.
4. On the iPhone: *Settings → General → VPN & Device Management* → tap your Apple ID → **Trust**.
5. iOS 16+: *Settings → Privacy & Security → Developer Mode* → on, restart.

**Important:** with a free Apple ID the app expires after **7 days**. Re-run Sideloadly
(same steps, takes 1 minute) – your progress stays on the phone. Sideloadly can refresh
automatically over Wi-Fi if you leave it running on the laptop. A paid Apple Developer
account (99 $/year) makes it last a year.

### What was wrong before (fixed in 6.0)
- No launch screen → iOS ran the app letterboxed in old iPhone-4 size. Added `UILaunchScreen`.
- No shared scheme → `xcodebuild -scheme DeutschCoach` could not find it on CI. Added to `project.yml`.
- No app icon asset catalog. Added `ios/Assets.xcassets`.
- After using the microphone, the audio session stayed in record-only mode, so all speech went silent.
  Now it switches to `playAndRecord` while listening and back to `playback` afterwards.
- Speech results containing quotes or line breaks broke the JavaScript callback. Now JSON-encoded.

## Updating the repo from Windows
Easiest: **GitHub Desktop** (desktop.github.com) → clone `german-v2` → copy the new files over the
folder → *Commit to main* → *Push origin*. The website updates by itself within ~2 minutes.
