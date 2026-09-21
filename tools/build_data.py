"""Converts curriculum sources + legacy repo data into JS data files (no fetch needed -> works on file://, APK, GitHub Pages)."""
import json, glob, re, sys, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
SCENES_DIR = HERE
os.chdir(os.path.join(HERE, "curriculum"))

def parse(path):                     # lesson text parser
    topics, cur, sec = [], None, None
    for raw in open(path, encoding="utf-8"):
        line = raw.rstrip("\n")
        if line.startswith("@@"):
            f = [x.strip() for x in line[2:].split("|")]
            cur = dict(n=int(f[0]), lvl=f[1], title=f[2], theme=f[3], scene=f[4],
                       rec=[x for x in f[5].split(",") if x.strip()] if len(f) > 5 else [], sec={})
            topics.append(cur); sec = None; continue
        if line.startswith("#") and cur is not None:
            sec = line[1:].strip(); cur["sec"][sec] = []; continue
        if sec and line.strip():
            cur["sec"][sec].append(line.strip())
    return topics

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
_F = "/usr/share/fonts/truetype/dejavu/"
for _n, _f in (("DV", "DejaVuSans.ttf"), ("DVB", "DejaVuSans-Bold.ttf")):
    try: pdfmetrics.registerFont(TTFont(_n, _F + _f))
    except Exception: pass
from scenes import SCENES
from reportlab.graphics import renderSVG
OUT = os.path.join(HERE, "..", "js", "data")
LEGACY = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "legacy_data")

def js(name, obj):
    with open(os.path.join(OUT, name + ".js"), "w", encoding="utf-8") as f:
        f.write(f"window.DC=window.DC||{{}};DC.{name}=")
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

# ---------- curriculum ----------
lessons = []
for p in sorted(glob.glob("content_*.txt")):
    lessons += parse(p)
lessons.sort(key=lambda t: t["n"])
def split_ans(line):
    q, _, a = line.partition("||")
    return {"q": q.strip(), "a": a.strip()}
cur = []
for t in lessons:
    s = t["sec"]
    cur.append({
        "n": t["n"], "level": t["lvl"], "title": t["title"], "theme": t["theme"], "scene": t["scene"],
        "rec": [int(x) for x in t["rec"] if x.strip()],
        "expl": s.get("expl", []), "use": " ".join(s.get("use", [])),
        "table": [r.split("|") for r in s.get("table", [])],
        "examples": [dict(zip(("de", "en"), (l.split(" = ", 1) + [""])[:2])) for l in s.get("ex", [])],
        "vocab": [dict(zip(("de", "en"), (l.split(" = ", 1) + [""])[:2])) for l in s.get("vocab", [])],
        "reading": " ".join(s.get("read", [])),
        "tasks": [split_ans(l) for l in s.get("task", [])],
        "exam": [split_ans(l) for l in s.get("exam", [])],
        "speak": s.get("speak", []),
    })
js("curriculum", cur)

ref = []
for tp in parse("ref_1.txt"):
    secs = []
    for k, v in tp["sec"].items():
        if k.startswith("table"):
            secs.append({"kind": "table", "title": k.split(":", 1)[1] if ":" in k else "", "rows": [r.split("|") for r in v]})
        else:
            secs.append({"kind": "text", "title": "" if k == "text" else k, "lines": v})
    ref.append({"title": tp["title"].replace("Referenz ", "Ref ").split(": ", 1)[-1], "sections": secs})
js("reference", ref)

# ---------- scenes as SVG ----------
scenes = {}
for k, fn in SCENES.items():
    svg = renderSVG.drawToString(fn())
    svg = re.sub(r"<\?xml[^>]*>|<!DOCTYPE[^>]*>", "", svg)
    svg = re.sub(r"font-family=\"DVB?\"|font-family:\s*DVB?", 'font-family="system-ui,sans-serif"', svg)
    svg = re.sub(r'width="[\d.]+" height="[\d.]+"', 'width="100%" preserveAspectRatio="xMidYMid meet"', svg, count=1)
    svg = re.sub(r"\s+", " ", svg).strip()
    scenes[k] = svg
js("scenes", scenes)

# ---------- legacy data (cleaned) ----------
def L(name):
    with open(os.path.join(LEGACY, name + ".json"), encoding="utf-8") as f:
        return json.load(f)
vocab = L("vocab")
seen = set(); v2 = []
for v in vocab:
    k = v["word"].lower()
    if k in seen: continue
    seen.add(k)
    v2.append({"de": v["word"], "en": v["translation"], "type": v.get("type", ""), "art": v.get("article") or "",
               "pl": v.get("plural") or "", "level": v.get("level", "A1"), "topic": v.get("topic", ""),
               "exDe": v.get("example_de", ""), "exEn": v.get("example_en", "")})
# extended corpus (vocab_a/b/c.txt): de|en|plural|topic, grouped by #LEVEL
for f in sorted(glob.glob("vocab_*.txt")):
    level = "A1"
    for line in open(f, encoding="utf-8"):
        line = line.strip()
        if not line: continue
        if line.startswith("#"): level = line[1:].strip(); continue
        parts = (line.split("|") + ["", "", ""])[:4]
        de, en, pl, topic = [x.strip() for x in parts]
        if not de or not en: continue
        key = de.lower()
        if key in seen: continue
        seen.add(key)
        m = re.match(r"^(der|die|das)\s+(.+)$", de)
        typ = "noun" if m else ("verb" if re.search(r"(en|ern|eln)$", de.split(" ")[-1]) and topic in ("Verb",) else ("phrase" if " " in de else "word"))
        v2.append({"de": de, "en": en, "type": typ, "art": m.group(1) if m else "",
                   "pl": ("die " + pl) if (m and pl) else pl, "level": level, "topic": topic or "Allgemein",
                   "exDe": "", "exEn": ""})

# add curriculum vocab
for l in cur:
    for w in l["vocab"]:
        key = w["de"].split(",")[0].lower()
        if key in seen: continue
        seen.add(key)
        m = re.match(r"^(der|die|das)\s+(.+?)(?:,\s*(.+))?$", w["de"])
        v2.append({"de": w["de"].split(",")[0], "en": w["en"], "type": "noun" if m else "phrase",
                   "art": m.group(1) if m else "", "pl": (m.group(3) or "") if m else "",
                   "level": l["level"], "topic": l["theme"], "lesson": l["n"], "exDe": "", "exEn": ""})
js("vocab", v2)

verbs = []; seen = set()
for v in L("verbs"):
    if v["verb"] in seen or re.search(r"_\d+$", v["verb"]) or "(Variante)" in (v.get("example_de") or ""): continue
    seen.add(v["verb"])
    verbs.append({"inf": v["verb"], "en": v["translation"], "level": v.get("level"), "pres": v.get("present"),
                  "past": v.get("past"), "perf": v.get("perfect"), "exDe": v.get("example_de"), "exEn": v.get("example_en")})
js("verbs", verbs)

conj = {}; 
for v in L("conjugation")["verbs"]:
    if "infinitive" not in v: continue
    conj.setdefault(v["infinitive"], {"en": v.get("english", ""), "type": v.get("type", ""), "level": v.get("level", ""), "f": v["forms"]})
js("conj", conj)

notes = L("notes")
js("notes", {k: v for k, v in notes.items() if isinstance(v, str) and len(v) > 40})

# passages: legacy repeats 15 texts 30x -> keep unique
ps = []; seen = set()
for p in L("passages"):
    if p["text_de"] in seen: continue
    seen.add(p["text_de"])
    ps.append({"level": p["level"], "topic": p["topic"], "title": re.sub(r"\s+\d+$", "", p["title"]), "de": p["text_de"],
               "q": [q["q_de"] for q in p.get("questions", [])]})
js("passages", ps)

# exercises: strip generator junk, dedupe
ex = L("exercises")["exercises"]; out = []; seen = set()
for e in ex:
    q = e["question"].strip()
    if re.search(r"Extra|Bonus|Beispiel \d|Nummer \d|\(\d+\)|example \d", q): continue
    if e["type"] in ("articles",): continue   # replaced by the case engine (legacy items ignored n-declension)
    q = q.replace("Complete: ", "").replace("Choose: ", "")
    if re.search(r"^Wir fahren ___ (den|die|das) |wirdet|dort wartet, kennt|wir früh anfangen, arbeite", q): continue
    q = re.sub(r"(\])\s*\((Der|Die|Das) [^)]*\)$", r"\1", q)
    q = q[0].upper() + q[1:]
    key = (q.lower(), str(e["answer"]).lower())
    if key in seen or not q or not str(e["answer"]).strip(): continue
    seen.add(key)
    out.append({"level": e["level"], "type": e["type"], "q": q, "a": str(e["answer"]), "hint": e.get("hint", "")})
js("bank", out)

js("lid", L("lid"))
print("lessons", len(cur), "vocab", len(v2), "verbs", len(verbs), "conj", len(conj), "passages", len(ps), "bank", len(out),
      collections.Counter(x["type"] for x in out).most_common(8))
