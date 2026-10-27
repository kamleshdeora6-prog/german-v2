# Deutsch Coach LAB – test version

This is the **test edition** of Deutsch Coach. Use the normal app (german-v2) every day; use this one to try the
newest AI features and send back the results.

What is different from the daily app:

- **Own progress.** The lab stores everything under its own name, so testing never changes your daily progress.
  Settings → 🧪 Lab edition → *Copy my progress from the daily app* gives you a copy to test with.
- **Newest on-device models**, including **Gemma 4 E2B** (PCs with a graphics card), and the AI warms up while you pick a scenario.
- **Free talk with the AI** is the default speaking-partner mode (the guided mode is one tap away).
- **Long German test** (18 answers at A1, A2 and B1) and a **diagnostics report**.
- A small purple **LAB** badge in the corner.

## Set it up (once)

1. Create a new GitHub repository, e.g. `german-v2-lab`, and upload the contents of this folder.
2. Settings → Pages → Source: *GitHub Actions* (the `pages.yml` workflow publishes it).
3. Optional, for fully offline models: Actions → *Add the offline AI models* → Run workflow.
4. Open `https://<your-name>.github.io/german-v2-lab/` in Chrome or Edge.

## How to test and send results

1. Settings → AI tutor → pick a model → **Download** (once).
2. Settings → 🧪 Lab edition → **Long test: A1 · A2 · B1**. Takes 1–5 minutes.
3. Talk to the speaking partner for a few minutes in *Free talk* mode.
4. Settings → 🧪 Lab edition → **Diagnostics report** → *Copy* (or *Download .txt*) and paste it into the chat with Claude.

Repeat with each model you want to compare (1B, 3B, Gemma 4) and on each device. The report has the device's
graphics chip, the model build, load time, speed, every test reply with its score, and any errors.
