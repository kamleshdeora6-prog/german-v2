#!/usr/bin/env python3
"""Natural German audio for Deutsch Coach, made once with Piper (free, open-source neural voices, CC0).

  python3 tools/make_audio.py [--out audio] [--minutes 40] [--limit N] [--voices DIR]

Every sentence the app reads aloud (tools/audio_texts.js) becomes a small MP3 in audio/<voice>/<hash>.mp3,
and audio/index.json lists what exists. The app plays these files when they exist and falls back to the
device's text-to-speech otherwise – so a partial run is fine, and the next run only makes what is missing.

Voices (one letter per role): m = Thorsten (main voice), f = Kerstin (2nd speaker, the partner "Anna"),
f2 = Ramona, n = Pavoque (announcements). They are downloaded once into --voices (default ~/.cache/piper-voices):
first the better "medium" Thorsten from Hugging Face if reachable, otherwise the original Piper releases on GitHub.
The GitHub Action .github/workflows/pages.yml runs this on every deploy with a cache, so new texts get audio
automatically."""
import argparse, json, os, pathlib, subprocess, sys, tarfile, time, urllib.request, wave, io

ROOT = pathlib.Path(__file__).resolve().parent.parent
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE"
GH = "https://github.com/rhasspy/piper/releases/download/v0.0.2"
VOICES = {   # role: [(file name, list of (url, kind))]
    "m":  ("thorsten", [(f"{HF}/thorsten/medium/de_DE-thorsten-medium.onnx", "hf"), (f"{GH}/voice-de-thorsten-low.tar.gz", "tgz")]),
    "f":  ("kerstin",  [(f"{HF}/kerstin/low/de_DE-kerstin-low.onnx", "hf"), (f"{GH}/voice-de-kerstin-low.tar.gz", "tgz")]),
    "f2": ("ramona",   [(f"{HF}/ramona/low/de_DE-ramona-low.onnx", "hf"), (f"{GH}/voice-de-ramona-low.tar.gz", "tgz")]),
    "n":  ("pavoque",  [(f"{HF}/pavoque/low/de_DE-pavoque-low.onnx", "hf"), (f"{GH}/voice-de-pavoque-low.tar.gz", "tgz")]),
}
LENGTH_SCALE = 1.08   # a little slower than natural speech – easier for learners (the app's speed buttons still work)


def fnv1a(s: str) -> str:
    """Same hash as Natural.key() in js/voice.js (32-bit FNV-1a over UTF-16 code units, hex)."""
    h = 0x811C9DC5
    for ch in s.encode("utf-16-le").decode("utf-16-le"):
        for unit in ([ord(ch)] if ord(ch) < 0x10000 else [0xD800 + ((ord(ch) - 0x10000) >> 10), 0xDC00 + ((ord(ch) - 0x10000) & 0x3FF)]):
            h ^= unit
            h = (h * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def fetch(url, dest):
    req = urllib.request.Request(url, headers={"User-Agent": "deutsch-coach-audio"})
    with urllib.request.urlopen(req, timeout=120) as r, open(dest, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b: break
            f.write(b)


def voice_files(role, vdir):
    """Download a voice once; returns the .onnx path (its .onnx.json sits next to it)."""
    name, sources = VOICES[role]
    vdir.mkdir(parents=True, exist_ok=True)
    have = sorted(vdir.glob(f"*{name}*.onnx"))
    if have: return have[-1]
    for url, kind in sources:
        try:
            if kind == "hf":
                dest = vdir / url.rsplit("/", 1)[1]
                fetch(url, dest); fetch(url + ".json", str(dest) + ".json")
                return dest
            tgz = vdir / url.rsplit("/", 1)[1]
            fetch(url, tgz)
            with tarfile.open(tgz) as t: t.extractall(vdir)
            tgz.unlink()
            return sorted(vdir.glob(f"*{name}*.onnx"))[-1]
        except Exception as e:  # try the next source
            print(f"  {name}: {url} not available ({e.__class__.__name__}) – trying the next source", file=sys.stderr)
    raise SystemExit(f"no source for voice {name}")


def to_mp3(pcm: bytes, rate: int) -> bytes:
    import lameenc
    enc = lameenc.Encoder(); enc.set_bit_rate(32); enc.set_in_sample_rate(rate); enc.set_channels(1); enc.set_quality(5)
    return enc.encode(pcm) + enc.flush()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "audio"))
    ap.add_argument("--voices", default=os.path.expanduser("~/.cache/piper-voices"))
    ap.add_argument("--minutes", type=float, default=0, help="stop after this many minutes (0 = no limit); the rest is made next time")
    ap.add_argument("--limit", type=int, default=0, help="make at most N new files (for tests)")
    a = ap.parse_args()
    from piper import PiperVoice, SynthesisConfig
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    lines = json.loads(subprocess.check_output(["node", str(ROOT / "tools" / "audio_texts.js")]))
    want = {}
    for role, text in lines:
        want.setdefault(role, {})[fnv1a(role + "|" + text)] = text
    loaded, made, t0, cfg = {}, 0, time.time(), SynthesisConfig(length_scale=LENGTH_SCALE)
    todo = [(r, h, t) for r, hs in want.items() for h, t in hs.items() if not (out / r / f"{h}.mp3").exists()]
    print(f"{sum(len(x) for x in want.values())} sentences, {len(todo)} still need audio")
    for role, h, text in todo:
        if a.minutes and time.time() - t0 > a.minutes * 60: print("time limit reached – the rest follows next run"); break
        if a.limit and made >= a.limit: break
        if role not in loaded: loaded[role] = PiperVoice.load(str(voice_files(role, pathlib.Path(a.voices))))
        v = loaded[role]
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w: v.synthesize_wav(text, w, syn_config=cfg)
        buf.seek(0)
        with wave.open(buf) as w: rate, pcm = w.getframerate(), w.readframes(w.getnframes())
        secs = len(pcm) / 2 / rate
        if secs < 0.25 or secs > 3 + len(text) * 0.25:   # silence or runaway output: leave it to the device voice
            print(f"  skipped (suspicious length {secs:.1f} s): {text[:60]}"); continue
        (out / role).mkdir(exist_ok=True)
        (out / role / f"{h}.mp3").write_bytes(to_mp3(pcm, rate))
        made += 1
        if made % 500 == 0: print(f"  {made} files · {int(time.time() - t0)} s")
    # index of what exists (files of texts that are no longer used are removed)
    idx = {"v": 1, "made": int(time.time()), "voices": {r: VOICES[r][0] for r in VOICES}, "have": {}}
    for r in VOICES:
        d = out / r
        if not d.exists(): continue
        for f in d.glob("*.mp3"):
            if f.stem not in want.get(r, {}): f.unlink()
        idx["have"][r] = sorted(f.stem for f in d.glob("*.mp3"))
    (out / "index.json").write_text(json.dumps(idx, separators=(",", ":")))
    total = sum(f.stat().st_size for f in out.rglob("*.mp3"))
    print(f"made {made} new files · {sum(len(x) for x in idx['have'].values())} in total · {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
