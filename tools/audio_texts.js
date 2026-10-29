/* Lists every German text the app reads aloud, split into sentences exactly like Speech.play does,
   with the voice for each line. Used by tools/make_audio.py.  Output: JSON [[voice, sentence], …] */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, "js/data")).filter((x) => x.endsWith(".js")).sort((a, b) => (a === "telc2.js") - (b === "telc2.js")))
  vm.runInContext(fs.readFileSync(path.join(ROOT, "js/data", f), "utf8"), ctx);
const DC = ctx.DC;
// must match splitSentences() in js/core.js
const split = (t) => String(t).replace(/<[^>]+>/g, "").replace(/_{2,}/g, " … ").replace(/\s+/g, " ").trim().split(/(?<=[.!?…:;])\s+(?=[„"A-ZÄÖÜ0-9–-])/).map((x) => x.trim()).filter(Boolean);
const VOICE = { A: "m", B: "f", C: "f2", N: "n" };   // exam speakers → voices
const out = new Map();
const add = (voice, text) => { if (!text) return; split(text).forEach((s) => { if (/[a-zäöüß]/i.test(s) && s.length < 400) out.set(voice + "|" + s, [voice, s]); }); };
const strip = (s) => String(s || "").replace(/\*\*|__/g, "");
// lessons
(DC.curriculum || []).forEach((l) => {
  (l.examples || []).forEach((e) => add("m", e.de));
  add("m", strip(l.reading)); if (l.reading2) add("m", strip(l.reading2.text));
  const who = [...new Set((l.dialog || []).map((d) => d.who))];   // same voices as the lesson's dialogue player (views1.js)
  (l.dialog || []).forEach((d) => add(["m", "f", "f2"][who.indexOf(d.who) % 3], strip(d.de)));
  (l.exam || []).forEach((q) => { if (q.m) add("m", q.m); });
});
(DC.vocab || []).forEach((v) => { add("m", v.de); if (v.exDe) add("m", v.exDe); });
(DC.passages || []).forEach((p) => add("m", p.de));
Object.values(DC.dialogues || {}).forEach((steps) => steps.forEach((s) => { add("f", s.de); (s.ideas || []).forEach((x) => add("m", x)); }));
(DC.dialogueReactions || []).forEach((x) => add("f", x));
Object.values(DC.sentences || {}).forEach((xs) => xs.forEach((s) => add("m", s.de)));
(DC.pictures || []).forEach((p) => { add("m", p.model); p.q.forEach((q) => add("m", q)); p.words.forEach(([d]) => add("m", d)); });
(DC.starter || []).forEach((u) => (u.phrases || []).forEach((p) => add("m", p[0])));
Object.values(DC.telc || {}).flat().forEach((t) => Object.values(t.parts).forEach((p) => {
  (p.audio || []).forEach(([sp, tx]) => add(VOICE[sp] || "m", tx));
  (p.items || []).forEach((it) => (it.audio || []).forEach(([sp, tx]) => add(VOICE[sp] || "m", tx)));
  if (p.model) add("m", p.model);
  (p.teile || []).forEach((te) => add("m", te.model));
}));
process.stdout.write(JSON.stringify([...out.values()]));
