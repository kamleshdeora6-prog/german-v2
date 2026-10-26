/* Deutsch Coach – automated checks. Run: node tests/run.js   (exit code 1 on any failure)
   Covers course data, every exercise generator, Max's corrections and false alarms. */
"use strict";
const path = require("path");
const ROOT = path.join(__dirname, "..");
global.window = global;
for (const f of ["curriculum", "reference", "scenes", "vocab", "verbs", "conj", "notes", "passages", "bank", "lid", "exams", "placement", "starter"]) require(path.join(ROOT, "js/data", f + ".js"));
require(path.join(ROOT, "js/engine.js")); require(path.join(ROOT, "js/engine_plus.js")); require(path.join(ROOT, "js/tutor.js"));
/* Weber needs a tiny Store/H stub outside the browser */
global.H = global.H || { esc: (x) => String(x) };
const _s = { settings: { tone: "streng" } };
global.Store = global.Store || { get: () => _s, save() {} };
require(path.join(ROOT, "js/weber.js"));

let failed = 0;
const ok = (cond, msg) => { if (!cond) { failed++; console.log("  ✗ " + msg); } };
const section = (t) => console.log("\n" + t);

section("1. Course data");
ok(DC.curriculum.every((l, i) => l.pos === i + 1), "course positions run 1..n without gaps");
ok(new Set(DC.curriculum.map((l) => l.n)).size === DC.curriculum.length, "lesson IDs are unique");
ok(DC.curriculum.filter((l) => l.n <= 60).every((l, i, a) => i === 0 || a[i - 1].n < l.n), "original lessons 1–60 keep their order (saved progress)");
DC.curriculum.forEach((l) => {
  ["examples", "tasks"].forEach((k) => ok(l[k].length >= 10, `lesson ${l.n}: ${k} has ${l[k].length}, expected at least 10`));
  ok(l.exam.length === 10, `lesson ${l.n}: exam has ${l.exam.length}, expected 10`);
  if (l.dialog) { ok(l.dialog.every((d) => d.who && d.de), `lesson ${l.n}: dialogue lines need "Name: text"`); ok((l.dq || []).every((q) => q.a), `lesson ${l.n}: dialogue questions need answers`); }
  if (l.reading2) ok(l.reading2.title && l.reading2.text.length > 200, `lesson ${l.n}: second text too short`);
  const vk = l.vocab.map((v) => v.de.split(",")[0].toLowerCase()); ok(vk.length === new Set(vk).size, `lesson ${l.n}: duplicate word in lesson vocabulary`);
  ok(l.reading && l.reading.length > 80, `lesson ${l.n}: reading text too short`);
  ok(DC.scenes[l.scene], `lesson ${l.n}: picture "${l.scene}" missing`);
  l.rec.forEach((r) => { const pr = DC.curriculum.find((x) => x.n === r); ok(pr && pr.pos < l.pos, `lesson ${l.n}: prerequisite ${r} is not an earlier lesson`); });
});
const keys = DC.vocab.map((v) => v.de.toLowerCase());
ok(keys.length === new Set(keys).size, "no duplicate vocabulary entries");
ok(!DC.vocab.some((v) => /_\d+$/.test(v.de) || /\(Variante\)/.test(v.exDe || "")), "no template copies like „die Erklärung_2“");
const FEM = /(ung|heit|keit|schaft|ion|tät)$/;
DC.vocab.forEach((v) => { const m = v.de.match(/^(der|die|das) ([A-ZÄÖÜ][a-zäöüß]+)$/); if (m && FEM.test(m[2]) && !/(schwung|sprung|ursprung|stadion|religion)$/i.test(m[2])) ok(m[1] === "die", `${v.de}: -ung/-heit/-keit/-schaft/-ion/-tät nouns are feminine`); });
ok(DC.lid.every((q) => q.a >= 0 && q.a < q.choices.length), "every citizenship question has a valid answer index");
DC.bank.filter((b) => /\[.*\]/.test(b.q)).forEach((b) => ok(b.q.match(/\[(.*)\]/)[1].split("/").map((x) => x.trim()).includes(b.a), `bank item options contain the answer: ${b.q}`));
DC.exams.reading.forEach((s) => s.parts.forEach((p) => p.items.forEach((it) => ok(it.why, `reading exam "${s.title}": every item needs a reason`))));
console.log(`  ${DC.curriculum.length} lessons, ${DC.vocab.length} words, ${DC.bank.length} bank items`);

section("1b. Placement bank and Frau Weber");
const stages = {};
DC.placement.forEach((i) => { stages[i.s] = (stages[i.s] || 0) + 1; ok(i.o.length === 4, `placement item “${i.q}” must have 4 options`); ok(i.w, `placement item “${i.q}” needs a reason`); ok(i.o[i.a] !== undefined, "answer index inside options"); });
for (let s = 1; s <= 12; s++) ok((stages[s] || 0) >= 6, `stage ${s} has ${stages[s] || 0} items, expected at least 6`);
["planOk", "planMad", "planLazy", "shortcut", "repeat", "streak", "rough", "behind", "ahead", "stakes"].forEach((k) => {
  ["streng", "neutral", "freundlich"].forEach((tone) => {
    Store.get().settings.tone = tone;
    const line = Weber.say(k, { level: "B1", weeks: 12, days: 84, min: 45, hours: 300, lessons: 1, words: 15, realWeeks: 18, year: 2031, topic: "Dativ", n: 6, gap: 9 });
    ok(line && !/\{\w+\}/.test(line), `Weber ${k}/${tone} left a placeholder: ${line}`);
  });
});
Store.get().settings.tone = "streng";
console.log(`  ${DC.placement.length} placement items, 12 stages, 3 tones`);

section("1c. English layer and First steps");
DC.curriculum.forEach((l) => { ok(l.en && l.en.title && l.en.theme && l.en.expl.length, `lesson ${l.n}: English title/theme/explanation missing`); if (l.en) l.en.expl.forEach((p) => { const plain = p.replace(/__[^_]+__|\*\*[^*]+\*\*/g, ""); ok((plain.match(/\b(ist|sind|wird|benutzt|steht|immer|wenn|aber|nur|oder|auch)\b/g) || []).length < 3, `lesson ${l.n}: English explanation looks German: "${p.slice(0, 60)}"`); }); });
const ST = DC.starter || [];
ok(ST.length >= 15, `First steps has ${ST.length} units, expected at least 15`);
ok(new Set(ST.map((u) => u.id)).size === ST.length, "First steps unit IDs are unique");
let stWords = 0;
ST.forEach((u) => {
  ok(u.icon && u.en && u.de && u.tip, `unit ${u.id}: icon, titles and tip needed`);
  ok(u.words.length >= 8, `unit ${u.id}: only ${u.words.length} words`);
  ok((u.phrases || []).length >= 4, `unit ${u.id}: needs at least 4 sentences to build`);
  const de = u.words.map((w) => w[0]), en = u.words.map((w) => w[1].toLowerCase());
  ok(de.length === new Set(de).size, `unit ${u.id}: duplicate German word`);
  ok(en.length === new Set(en).size, `unit ${u.id}: duplicate English meaning (a picture/meaning question would have two right answers)`);
  u.words.forEach(([d, e, pic]) => { stWords++; ok(d && e && pic, `unit ${u.id}: "${d}" needs German, English and a picture`); const m = /^(der|die|das) (\S.*)$/.exec(d); if (m) ok(/^[A-ZÄÖÜ]/.test(m[2]), `unit ${u.id}: noun "${d}" must be capitalised`); });
  (u.phrases || []).forEach(([d, e]) => ok(/[.!?]$/.test(d) && e, `unit ${u.id}: sentence "${d}" needs end punctuation and English`));
});
console.log(`  ${DC.curriculum.length} lessons with English explanations · First steps: ${ST.length} units, ${stWords} words`);

section("2. Exercise generators");
const lower = (s) => s.split(/\s+/).map((x) => x.toLowerCase().replace(/[.!?]+$/, "")).sort().join("|");
let items = 0;
for (const id of Object.keys(Engine.GEN)) for (let i = 0; i < 200; i++) {
  const it = Engine.generate(id); items++;
  if (!it || !it.answer || !it.prompt || !it.why) { ok(false, `${id}: incomplete item`); continue; }
  if (/undefined|NaN|\[object/.test(it.prompt + it.answer + it.why)) ok(false, `${id}: "undefined" in text`);
  if (it.kind === "choice") ok(it.options.includes(it.answer), `${id}: options must contain the answer`);
  if (it.kind === "order") {
    ok(lower(it.tokens.join(" ")) === lower(it.answer), `${id}: tokens must rebuild the answer`);
    (it.orders || []).forEach((o) => ok(lower(o) === lower(it.answer), `${id}: every accepted order uses the same words`));
  }
}
console.log(`  ${Object.keys(Engine.GEN).length} generators, ${items} items`);


section("2b. Verb forms the generators build");
const PARADIGM = { kommen: "komme kommst kommt kommen kommt kommen", öffnen: "öffne öffnest öffnet öffnen öffnet öffnen", arbeiten: "arbeite arbeitest arbeitet arbeiten arbeitet arbeiten",
  einladen: "lade lädst lädt laden ladet laden", fahren: "fahre fährst fährt fahren fahrt fahren", tanzen: "tanze tanzt tanzt tanzen tanzt tanzen", lesen: "lese liest liest lesen lest lesen" };
Object.entries(PARADIGM).forEach(([inf, forms]) => { const got = ["1s", "2s", "3s", "1p", "2p", "3p"].map((p) => Engine.conj(inf, p)).join(" "); ok(got === forms, `${inf}: got "${got}", expected "${forms}"`); });
for (let i = 0; i < 400; i++) { const it = Engine.generate(["fragen", "negation", "praeteritum", "praesens", "wortstellung"][i % 5]); ok(!/\b(kommet|nennet|warn|warst e)\b/.test(it.prompt + " " + it.answer + " " + (it.full || "")), `wrong verb form in: ${it.answer}`); }
console.log("  conjugation tables and 400 generated sentences checked");

section("3. Max corrects typical mistakes");
const CASES = [
  ["Gestern ich habe nach Berlin gefahren.", "Gestern bin ich nach Berlin gefahren."],
  ["Ich komme nicht, weil ich bin krank.", "Ich komme nicht, weil ich krank bin."],
  ["Ich kann spreche Deutsch.", "Ich kann Deutsch sprechen."],
  ["Ich habe nicht ein Auto.", "Ich habe kein Auto."],
  ["Ich fahre mit den Bus.", "Ich fahre mit dem Bus."],
  ["Ich helfe dich.", "Ich helfe dir."],
  ["Ich sehe dir.", "Ich sehe dich."],
  ["Ich will gehen nach Hause.", "Ich will nach Hause gehen."],
  ["Der Auto von mein Vater ist neu.", "Das Auto von meinem Vater ist neu."],
  ["Ich habe keine Zeit nicht.", "Ich habe keine Zeit."],
  ["Ich komme aus indien.", "Ich komme aus Indien."],
  ["Ich kann nicht kommen morgen.", "Ich kann morgen nicht kommen."],
  ["Ich trinke kein Kaffee nicht.", "Ich trinke keinen Kaffee."],
  ["Ich kaufe einen neue Tisch.", "Ich kaufe einen neuen Tisch."],
  ["Das ist ein gutes Mann.", "Das ist ein guter Mann."],
  ["Sie hat ein teueres Auto.", "Sie hat ein teures Auto."],
  ["Wir helfen der alte Frau.", "Wir helfen der alten Frau."],
];
CASES.forEach(([a, b]) => { const r = Tutor.check(a); ok(r.fixed === b, `"${a}" → got "${r.fixed}", expected "${b}"`); });
console.log(`  ${CASES.length} cases`);

section("4. Max leaves correct German alone");
const good = [];
DC.curriculum.forEach((l) => { l.examples.forEach((e) => good.push(e.de)); [l.reading, l.reading2 ? l.reading2.text : ""].forEach((t) => good.push(...t.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 12 && !/[„“"]/.test(x)))); (l.dialog || []).forEach((d) => good.push(...d.de.split(/(?<=[.!?])\s+/).filter((x) => x.trim().length > 12))); });
DC.vocab.forEach((v) => { if (v.exDe) good.push(v.exDe); });
(DC.starter || []).forEach((u) => (u.phrases || []).forEach((p) => good.push(p[0])));
for (let i = 0; i < 3000; i++) { const it = Engine.generate(); if (it && it.full) good.push(it.full); if (it && it.kind === "order") good.push(it.answer); }
let fp = 0;
good.forEach((s) => { const r = Tutor.check(s); if (r.issues.length) { fp++; if (fp <= 10) console.log(`  ✗ false alarm: "${s}" → "${r.fixed}"`); } });
failed += fp;
console.log(`  ${good.length} correct sentences checked, ${fp} false alarms`);

console.log(failed ? `\nFAILED: ${failed} problem(s)` : "\nAll checks passed.");
process.exit(failed ? 1 : 0);
