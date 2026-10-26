# AI tutor and offline speech – all on your own devices

Deutsch Coach works completely offline. The AI extras can too: nothing needs an account, an API key or a server.

## 1. The speaking partner on your device (default, free)

**What it does:** role-plays at your level (café, doctor, flat viewing, job interview, Bürgeramt, discussions, or today's lesson topic). You speak or type; the partner answers out loud in simple German. Your mistakes are corrected by **Max's checked rules** – not by the AI – and at the end you get a summary. Max also uses the on-device AI for open questions (marked “can be wrong”).

**Set up on each device (once):** Settings → AI tutor → “On this device” → **Download**.

| Model | Download | Good for |
|---|---|---|
| Llama 3.2 1B (default) | about 0.7 GB | phones and most laptops |
| Llama 3.2 3B | about 1.8 GB | laptops and PCs – noticeably better German (recommended on computers) |
| Gemma 4 E2B (Google, 2026) | about 2–3 GB | PCs with 4 GB+ graphics memory – the best German of the three |

**Which one is best on *your* device?** Settings → AI tutor → **🧪 Test its German on this device**. The app sends six typical learner sentences to the model, checks every reply with Max's rules (German only, no grammar problems, short, ends with a question) and measures the speed. Try two models and keep the better one; "Delete from this device" frees the space of the other.

**Requirements:** a browser with WebGPU – current **Chrome or Edge on Windows/Mac/Linux**, or **Chrome on a newer Android phone**. Open the app's *website* (or the installed web app). Inside the Android/iOS apps it isn't available. The app checks this and tells you.

**Good to know**
- After the download it works with no internet at all. The first start each time you open the app takes 10–60 seconds (it warms up while you choose a scenario), and replies appear word by word.
- It uses the graphics chip, so it uses more battery while it talks; after 5 minutes without use it switches itself off.
- Small models write simple German and can make small slips. That's why corrections, answer keys and feedback always come from the app's checked rules. For the best German, use the 3B model on a PC.
- Settings → AI tutor → **Delete from this device** frees the space.

## 2. Put the models on your own site (recommended for the family)

So that every device downloads from **your** app instead of Hugging Face:

1. GitHub → your repo → **Actions** → **“Add the offline AI models to the site”** → **Run workflow**.
2. It copies Llama 3.2 1B (~0.7 GB) and Whisper (~80 MB) into `models/` and republishes the site (about 10 minutes).
3. Settings → AI tutor now says “Downloaded once from this app's own site”.

GitHub Pages allows about 1 GB per site, so only the 1B model is stored there; the 3B model, and the f32 variant some older graphics chips need, come from Hugging Face if picked.

## 3. Offline speech recognition (Whisper)

Settings → Speech recognition → **Download offline model** (about 80 MB, once). Your voice never leaves the device. If it fails, the browser's own recognition takes over.

## 4. Optional: Claude (online)

Settings → AI tutor → “Claude”. Needs an Anthropic API key (paid, a few cents a month). Adds the best conversation quality, **detailed feedback** on free answers and writing, and **new exercises from your mistakes**. One key must not be shared by putting it on several devices – anyone with the key can spend its credit.
