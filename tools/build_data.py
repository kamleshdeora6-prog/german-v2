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
            f = [x.strip() for x in line[2:].split("|")] + ["", "", "", "", ""]   # plus files only give the number
            after = next((x[6:] for x in f if x.startswith("after=")), "")
            cur = dict(n=int(f[0]), lvl=f[1], title=f[2], theme=f[3], scene=f[4],
                       rec=[x for x in f[5].split(",") if x.strip() and not x.startswith("after=")] if not f[5].startswith("after=") else [], after=after, sec={})
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
# Lesson numbers are permanent IDs (progress is saved under them). New lessons are slotted into the
# course with "after=<id>" in their header; "pos" is the place in the course shown to learners.
_base = sorted([t for t in lessons if not t.get("after")], key=lambda t: t["n"])
_new = sorted([t for t in lessons if t.get("after")], key=lambda t: t["n"])
while _new:
    placed = False
    for t in list(_new):
        idx = next((i for i, x in enumerate(_base) if x["n"] == int(t["after"])), None)
        if idx is None: continue
        _base.insert(idx + 1, t); _new.remove(t); placed = True
    if not placed: raise SystemExit("after= points to a missing lesson: " + str([t["n"] for t in _new]))
lessons = _base
def split_ans(line):
    q, _, a = line.partition("||")
    return {"q": q.strip(), "a": a.strip()}
cur = []
for t in lessons:
    s = t["sec"]
    cur.append({
        "n": t["n"], "pos": len(cur) + 1, "level": t["lvl"], "title": t["title"], "theme": t["theme"], "scene": t["scene"],
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
    if s.get("read2"): cur[-1]["reading2"] = {"title": s["read2"][0], "text": " ".join(s["read2"][1:])}
    if s.get("dialog"):
        cur[-1]["dialog"] = [dict(zip(("who", "de"), [y.strip() for y in x.split(":", 1)])) for x in s["dialog"]]
        cur[-1]["dq"] = [split_ans(x) for x in s.get("dq", [])]
# ---------- v6 deepening: plus_*.txt adds words, examples, a second text, a listening dialogue and tasks ----------
#   @@ <lesson n>
#   #vocab   de, plural = en          (appended)
#   #ex      German = English         (appended)
#   #read2   first line = title, then the text
#   #dialog  Name: line               (a listening scene; two or three speakers)
#   #dq      question || answer       (listening comprehension for the dialogue)
#   #task    question || answer       (appended)
byn = {l["n"]: l for l in cur}
for p in sorted(glob.glob("plus_*.txt")):
    for t in parse(p):
        l = byn.get(t["n"]);  s = t["sec"]
        if not l: raise SystemExit(f"{p}: lesson {t['n']} does not exist")
        l["vocab"] += [dict(zip(("de", "en"), (x.split(" = ", 1) + [""])[:2])) for x in s.get("vocab", [])]
        l["examples"] += [dict(zip(("de", "en"), (x.split(" = ", 1) + [""])[:2])) for x in s.get("ex", [])]
        l["tasks"] += [split_ans(x) for x in s.get("task", [])]
        if s.get("read2"): l["reading2"] = {"title": s["read2"][0], "text": " ".join(s["read2"][1:])}
        if s.get("dialog"):
            l["dialog"] = [dict(zip(("who", "de"), [y.strip() for y in x.split(":", 1)])) for x in s["dialog"]]
            l["dq"] = [split_ans(x) for x in s.get("dq", [])]
# ---------- v6.2 English layer: english.txt gives every lesson an English title, theme and explanation ----------
en_cur = None
for line in open("english.txt", encoding="utf-8"):
    line = line.rstrip("\n")
    if not line.strip() or line.startswith("#"): continue
    if line.startswith("@@"):
        n = int(line[2:].strip()); en_cur = byn.get(n)
        if not en_cur: raise SystemExit(f"english.txt: lesson {n} does not exist")
        en_cur["en"] = {"title": "", "theme": "", "expl": [], "use": ""}; continue
    k, _, v = line.partition("=")
    if k == "expl": en_cur["en"]["expl"].append(v.strip())
    elif k in ("title", "theme", "use"): en_cur["en"][k] = v.strip()
    else: raise SystemExit(f"english.txt: unknown field {k!r}")
missing = [l["n"] for l in cur if not (l.get("en") and l["en"]["title"] and l["en"]["expl"])]
if missing: raise SystemExit(f"english.txt: no English for lessons {missing}")
js("curriculum", cur)

ref = []
for tp in parse("ref_1.txt") + parse("ref_2.txt"):
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
    if re.search(r"_\d+$", v["word"]) or "(Variante)" in (v.get("example_de") or ""): continue   # legacy template copies (die Erklärung_2 …)
    k = v["word"].lower()
    if k in seen: continue
    seen.add(k)
    v2.append({"de": v["word"], "en": v["translation"], "type": v.get("type", ""), "art": v.get("article") or "",
               "pl": v.get("plural") or "", "level": v.get("level", "A1"), "topic": v.get("topic", ""),
               "exDe": v.get("example_de", ""), "exEn": v.get("example_en", "")})
EXTRA_EX = {}
# extended corpus (vocab_a/b/c.txt): de|en|plural|topic, grouped by #LEVEL
for f in sorted(glob.glob("vocab_*.txt")):
    level = "A1"
    for line in open(f, encoding="utf-8"):
        line = line.strip()
        if not line: continue
        if line.startswith("#"): level = line[1:].strip(); continue
        parts = (line.split("|") + ["", "", "", "", ""])[:6]
        de, en, pl, topic, exde, exen = [x.strip() for x in parts]
        if not de or not en: continue
        key = de.lower()
        if exde: EXTRA_EX[key] = (exde, exen)
        if key in seen: continue
        seen.add(key)
        m = re.match(r"^(der|die|das)\s+(.+)$", de)
        if m and " " in m.group(2) and re.search(r"\s[a-zäöüß]+$", m.group(2)): m = None   # "die Rechnung stellen" is a phrase, not a noun
        typ = "noun" if m else ("verb" if re.search(r"(en|ern|eln)$", de.split(" ")[-1]) and topic in ("Verb",) else ("phrase" if " " in de else "word"))
        v2.append({"de": de, "en": en, "type": typ, "art": m.group(1) if m else "",
                   "pl": ("die " + pl) if (m and pl) else pl, "level": level, "topic": topic or "Allgemein",
                   "exDe": "", "exEn": ""})

# example sentences: examples_*.txt (word|German|English) and the 5th/6th columns of vocab files
for f in sorted(glob.glob("examples_*.txt")):
    for line in open(f, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"): continue
        w, exde, exen = (line.split("|") + ["", ""])[:3]
        EXTRA_EX[w.strip().lower()] = (exde.strip(), exen.strip())

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
for v in v2:
    k = v["de"].lower()
    if k not in EXTRA_EX: k = re.sub(r",.*$", "", k).strip()
    if k in EXTRA_EX and not v.get("exDe"):
        v["exDe"], v["exEn"] = EXTRA_EX[k]
# Words still without an example borrow a real sentence from the course (German + English pairs only).
# Nouns match their exact form (or plural); verbs their infinitive, stem+t or stem+en; others the exact word.
_pairs = [(e["de"], e["en"]) for l in cur for e in l["examples"] if e.get("en")]
_used = collections.Counter()
def _find(v):
    w = re.sub(r"^(der|die|das)\s+", "", v["de"]).split(",")[0].split(" / ")[0].strip()
    w = re.sub(r"\s*\(.*?\)", "", w).strip()
    if not w or " " in w and not v.get("art"): return None
    forms = {w}
    if v.get("art"):
        pl = re.sub(r"^die\s+", "", v.get("pl") or "")
        if pl and not pl.startswith("-"): forms.add(pl)
    elif re.search(r"(en|ern|eln)$", w) and w[0].islower():
        st = re.sub(r"e?n$", "", w); forms |= {st + "t", st + "e", st + "st", "ge" + st + "t"}
    rx = re.compile(r"(?<![\wäöüßÄÖÜ])(" + "|".join(map(re.escape, sorted(forms, key=len, reverse=True))) + r")(?![\wäöüßÄÖÜ])")
    best = None
    for de, en in _pairs:
        m_ = rx.search(de)
        if m_ and v.get("art") and m_.start() == 0: m_ = rx.search(de, 1)   # „Morgen …“ at the start is usually the adverb
        if m_ and len(de) < 110 and (best is None or _used[de] < _used[best[0]]): best = (de, en)
    return best
for v in v2:
    if v.get("exDe"): continue
    f = _find(v)
    if f: v["exDe"], v["exEn"] = f; _used[f[0]] += 1
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
# legacy titles were shifted and the questions were templates -> correct title, topic and questions per text
FIX = {
 "Ich stehe morgens früh auf": ("Mein Tag", "Daily life", ["Wann steht die Person auf?", "Was macht die Person am Abend?"]),
 "Heute habe ich viel zu tun": ("Ein voller Tag", "Daily life", ["Was macht die Person zuerst?", "Wen trifft die Person danach?"]),
 "Am Wochenende habe ich mehr Zeit": ("Mein Wochenende", "Home", ["Was macht die Person in der Wohnung?", "Mit wem telefoniert die Person?"]),
 "Im Alltag ist gute Planung wichtig": ("Gut planen", "Daily life", ["Was schreibt die Person auf?", "Was ist der Person wichtig?"]),
 "Am Wochenende möchte ich etwas Besonderes": ("Pläne fürs Wochenende", "Free time", ["Was macht die Person bei gutem Wetter?", "Was macht sie, wenn es regnet?"]),
 "Bei der Arbeit ist Organisation sehr wichtig": ("Organisation bei der Arbeit", "Work", ["Was muss die Person oft machen?", "Warum plant sie ihren Tag genau?"]),
 "Vor einer Reise muss man viele Dinge": ("Eine Reise vorbereiten", "Travel", ["Was muss man vor einer Reise machen? Nennen Sie zwei Dinge.", "Warum lohnt sich die Vorbereitung?"]),
 "Deutsch zu lernen ist nicht immer leicht": ("Deutsch lernen", "Learning", ["Wie findet die Person Deutschlernen?", "Warum übt die Person jeden Tag?"]),
 "Viele Menschen möchten Beruf und Privatleben": ("Beruf und Privatleben", "Work", ["Welches Problem beschreibt der Text?", "Welche Lösung nennt der Text?"]),
 "Vor einer Prüfung muss man gut planen": ("Prüfungsvorbereitung", "Learning", ["Welche Tipps gibt der Text?", "Warum soll man ruhig bleiben?"]),
 "Im Alltag gibt es oft Situationen, in denen man seine Meinung": ("Die eigene Meinung erklären", "Communication", ["Wann muss man seine Meinung erklären?", "Was hilft dabei laut Text?"]),
 "Umweltfreundliches Verhalten spielt heute": ("Umwelt im Alltag", "Environment", ["Was kann man im Alltag für die Umwelt tun?", "Warum ist das heute wichtig?"]),
 "In modernen Unternehmen sind Kommunikation": ("Führung und Verantwortung", "Work", ["Was muss eine Teamleitung laut Text tun?", "Warum sind Kommunikation und Verantwortung so wichtig?"]),
 "Nachhaltigkeit ist nicht nur ein politisches Thema": ("Nachhaltigkeit als persönliche Aufgabe", "Environment", ["Welche zentrale Aussage macht der Text?", "Wie begründet der Text diese Aussage?"]),
 "In Diskussionen reicht eine einfache Meinung": ("Überzeugend argumentieren", "Communication", ["Was reicht in Diskussionen nicht aus?", "Was sollte man stattdessen tun?"]),
}
for p_ in ps:
    for k, (t, tp, qs) in FIX.items():
        if p_["de"].startswith(k):
            p_["title"], p_["topic"], p_["q"] = t, tp, qs
            break
    else:
        raise SystemExit("passage without fix: " + p_["de"][:40])
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
# --- clean-up of the legacy bank ---
# 1) the template-built preposition set produced wrong German (von + Akkusativ) and nonsense (auf die Politik warten)
out = [e for e in out if not (e["type"] in ("prepositions", "mixed_quiz") and re.search(r"(hängt|warte|interessiere mich) ___ (den|die|das) ", e["q"]))]
PREP = [
    ("B1", "Ich warte ___ den Bus. [auf / mit / zu]", "auf", "warten auf + Akkusativ: auf den Bus."),
    ("B1", "Wir warten ___ eine Antwort. [auf / für / an]", "auf", "warten auf + Akkusativ."),
    ("B1", "Ich interessiere mich ___ Politik. [für / an / über]", "für", "sich interessieren für + Akkusativ."),
    ("B1", "Sie interessiert sich sehr ___ Kunst. [für / mit / von]", "für", "sich interessieren für + Akkusativ."),
    ("B1", "Es hängt ___ Wetter ab. [vom / an / für]", "vom", "abhängen von + Dativ: von dem = vom Wetter."),
    ("B1", "Das hängt ___ der Prüfung ab. [von / an / auf]", "von", "abhängen von + Dativ: von der Prüfung."),
    ("B1", "Alles hängt ___ deiner Entscheidung ab. [von / für / über]", "von", "abhängen von + Dativ: von deiner Entscheidung."),
    ("B1", "Ich freue mich ___ das Wochenende. [auf / über / an]", "auf", "sich freuen auf = something in the future."),
    ("B1", "Ich freue mich ___ dein Geschenk. [über / auf / für]", "über", "sich freuen über = something that has already happened."),
    ("B1", "Er denkt oft ___ seine Familie. [an / über / von]", "an", "denken an + Akkusativ."),
    ("B1", "Wir sprechen ___ das Problem. [über / von / mit]", "über", "sprechen über + Akkusativ = talk about."),
    ("B1", "Ich spreche morgen ___ meiner Chefin. [mit / an / über]", "mit", "sprechen mit + Dativ = talk to someone."),
    ("B1", "Sie hat Angst ___ dem Hund. [vor / von / über]", "vor", "Angst haben vor + Dativ."),
    ("B1", "Ich bedanke mich ___ Ihre Hilfe. [für / über / an]", "für", "sich bedanken für + Akkusativ."),
    ("B1", "Er bewirbt sich ___ eine Stelle in Berlin. [um / für / auf]", "um", "sich bewerben um + Akkusativ."),
    ("B1", "Kannst du dich ___ die Kinder kümmern? [um / für / an]", "um", "sich kümmern um + Akkusativ."),
    ("B1", "Ich ärgere mich ___ den Lärm. [über / auf / an]", "über", "sich ärgern über + Akkusativ."),
    ("B1", "Wir nehmen ___ dem Kurs teil. [an / bei / in]", "an", "teilnehmen an + Dativ."),
]
out += [{"level": l, "type": "prepositions", "q": q, "a": a, "hint": h} for l, q, a, h in PREP]
# 2) "Ordne:" and "Baue den Satz:" were the same puzzle twice
seen_words = set(); dedup = []
for e in out:
    if e["type"] == "word_order":
        k = e["q"].split(":", 1)[-1].strip()
        if k in seen_words: continue
        seen_words.add(k)
    dedup.append(e)
out = dedup
# 3) Konjunktiv items carried an unrelated context in brackets
for e in out:
    if e["type"] == "konjunktiv_ii": e["q"] = re.sub(r"\s*\((Ich habe keine Zeit|[^)]*\.)\)\s*$", "", e["q"])
js("bank", out)

js("lid", L("lid"))
print("lessons", len(cur), "vocab", len(v2), "verbs", len(verbs), "conj", len(conj), "passages", len(ps), "bank", len(out),
      collections.Counter(x["type"] for x in out).most_common(8))
