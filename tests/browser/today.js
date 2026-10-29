/* 7.2: Today session, FSRS flashcards, sentence cards, the mistake engine, natural recordings, crash log. */
const { chromium } = require('playwright');
const fs = require('fs');
const B = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.addInitScript(() => {
    window.__said = []; window.__played = [];
    if (window.speechSynthesis) window.speechSynthesis.speak = (u) => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 20); };
    const op = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); setTimeout(() => this.onended && this.onended(), 30); return Promise.resolve(); };
    if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1');
    localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] }));
    localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', unlockAll: true, goal: 100 },
      srs: { 'v:der tisch': { box: 4, due: Date.now() - 1000, seen: 4, lapses: 0 } } }));   // an old Leitner card
  });
  const go = async (r) => { await p.evaluate((r) => { location.hash = '#/' + r; }, r); await p.waitForTimeout(300); };
  await p.goto(B); await p.waitForTimeout(600);
  // ---- FSRS ----
  const fs1 = await p.evaluate(() => { const c = SRS.grade('v:der tisch', 2); return { s: c.s, d: c.d, days: Math.round((c.due - Date.now()) / 864e5) }; });
  log(fs1.s > 8 && fs1.days >= 8, `FSRS: an old Leitner card (box 4) is converted and scheduled: stability ${fs1.s} d, next in ${fs1.days} d`);
  const fs2 = await p.evaluate(() => { const a = SRS.grade('v:der apfel', 2), b = SRS.grade('v:die lampe', 0); return [Math.round((a.due - Date.now()) / 864e5), Math.round((b.due - Date.now()) / 60e3)]; });
  log(fs2[0] === 3 && fs2[1] === 10, `FSRS: new card “good” → ${fs2[0]} days, “again” → ${fs2[1]} minutes`);
  // ---- Today ----
  await go('home'); log(/Start today's session/.test(await p.textContent('.go-next')), 'home: the big button starts Today');
  await p.click('.go-next'); await p.waitForSelector('.today');
  const steps = await p.$$eval('.t-steps li', (x) => x.map((y) => y.textContent.trim()));
  log(steps.length >= 5, `Today plan for a 30-minute goal: ${steps.join(' | ')}`);
  await p.screenshot({ path: OUT + '/today.png', fullPage: true });
  // step 1: flashcards
  let guard = 0; while ((await p.$('.t-body .flash')) && guard++ < 30) { await p.click('.t-body .flash'); await p.click('.t-body [data-g="2"]'); await p.waitForTimeout(60); }
  log(await p.evaluate(() => Store.get().todaySession.steps[0].done), 'step 1 (flashcards) done → next step');
  // step 2: lesson link → back bar → comes back
  if (await p.$('.t-go')) { await p.click('.t-go'); await p.waitForTimeout(400); log(!!(await p.$('.todaybar')), 'lesson step opens the lesson with a “Back to Today” bar');
    await p.evaluate(() => Habit.markPart(1, 'learn')); await p.click('.todaybar'); await p.waitForSelector('.today'); log(/✓/.test((await p.$$eval('.t-steps li', (x) => x[1].textContent))), 'lesson part done in the lesson → ticked off in Today'); }
  // step 3: drill (inline session)
  await p.waitForSelector('.t-body .q, .t-body .sess-body', { timeout: 5000 }).catch(() => {});
  for (let k = 0; k < 6; k++) { const r = await p.evaluate(() => { const q = document.querySelector('.t-body .q'); if (!q) return 'none'; const c = q.querySelector('.choice'); if (c) { c.click(); return 'c'; } const inp = q.querySelector('.q-in'); if (inp) { inp.value = 'x'; q.querySelector('form').requestSubmit(); return 'i'; } const tok = q.querySelector('.bank button'); if (tok) { q.querySelectorAll('.bank button').forEach((t) => t.click()); const ch = q.querySelector('.check, .q-check'); if (ch) ch.click(); return 'o'; } return 'other'; }); await p.waitForTimeout(150); await p.click('.t-body .q-next').catch(() => {}); await p.waitForTimeout(120); if (r === 'none') break; }
  await p.waitForSelector('.t-cont button', { timeout: 5000 }).catch(() => {});
  log(!!(await p.$('.t-cont button')), 'drill finished inside Today → “Continue Today”');
  // a drill mistake is now in the mistake engine
  const nm = await p.evaluate(() => Mistakes.open().length); log(nm > 0, `wrong drill answers went to “My mistakes” (${nm})`);
  // skip the rest quickly
  if (await p.$('.t-cont button')) await p.click('.t-cont button');
  for (let k = 0; k < 10 && !(await p.$('.t-end')); k++) { await p.waitForTimeout(150); const sk = await p.$('.t-skip'); if (sk) await sk.click(); else { const c = await p.$('.t-cont button, .t-n'); if (c) await c.click(); } }
  await p.waitForSelector('.t-end', { timeout: 6000 }).catch(() => {});
  log(!!(await p.$('.t-end')), 'all steps → “Done for today” with +10 minutes');
  await p.evaluate(() => document.querySelectorAll('.celebrate').forEach((x) => x.remove()));
  await go('today/more'); await p.waitForTimeout(400); log((await p.$$('.t-steps li:not(.done)')).length >= 3, '+10 minutes adds three steps');
  // ---- mistakes from a mock exam ----
  await go('telc/b1-1/part/sb1'); await p.waitForSelector('.gap-s');
  await p.evaluate(() => { document.querySelectorAll('.gap-s').forEach((s) => { const P = DC.telc.B1[0].parts.sb1; const it = P.items.find((x) => x.n === +s.dataset.n); s.value = String((it.a + 1) % 3); }); });
  await p.click('.pchk'); await p.waitForTimeout(200);
  const ex = await p.evaluate(() => Mistakes.open().filter((m) => m.cat === 'telc:sprachbausteine').length); log(ex === 10, `10 wrong gaps in the exam → 10 “Exam: Sprachbausteine” mistakes (${ex})`);
  await go('mistakes'); const mt = await p.textContent('#view'); log(/Exam: Sprachbausteine/.test(mt), 'mistakes page groups them by type');
  await p.screenshot({ path: OUT + '/mistakes.png', fullPage: true });
  // practise that group: answer right twice → fixed
  const sel = await p.$$eval('[data-go^="mistakes/go:"]', (x) => x.map((y) => y.dataset.go)); const exGo = sel.find((x) => /telc/.test(decodeURIComponent(x)));
  await go(exGo); await p.waitForSelector('.choice');
  const m1 = await p.evaluate(() => { const want = Mistakes.open().find((m) => m.cat === 'telc:sprachbausteine'); return want ? want.answer : null; });
  for (let k = 0; k < 10; k++) { const done = await p.evaluate(() => { const q = document.querySelector('.q'); if (!q) return true; const prompt = q.querySelector('.q-prompt').innerHTML; const m = Mistakes.open().concat(Mistakes.fixed()).find((x) => x.prompt && prompt.includes(x.prompt.slice(-40))); const c = [...q.querySelectorAll('.choice')].find((b) => m && b.dataset.v === m.answer) || q.querySelector('.choice'); c.click(); return false; }); if (done) break; await p.waitForTimeout(100); await p.click('.q-next').catch(() => {}); await p.waitForTimeout(100); }
  const st = await p.evaluate(() => Mistakes.all().filter((m) => m.cat === 'telc:sprachbausteine').map((m) => m.ok || 0));
  log(st.every((x) => x >= 1), `right answers count towards fixing them (streaks: ${st.join(',')})`);
  await p.evaluate(() => Mistakes.all().forEach((m) => { if (m.cat === 'telc:sprachbausteine') { m.next = 0; } }));
  await p.evaluate(() => App.go('mistakes/go:' + encodeURIComponent('telc:sprachbausteine'))); await p.waitForSelector('.choice');
  for (let k = 0; k < 10; k++) { const done = await p.evaluate(() => { const q = document.querySelector('.q'); if (!q) return true; const prompt = q.querySelector('.q-prompt').innerHTML; const m = Mistakes.all().find((x) => x.prompt && prompt.includes(x.prompt.slice(-40))); const c = [...q.querySelectorAll('.choice')].find((b) => m && b.dataset.v === m.answer) || q.querySelector('.choice'); c.click(); return false; }); if (done) break; await p.waitForTimeout(100); await p.click('.q-next').catch(() => {}); await p.waitForTimeout(100); }
  const fx = await p.evaluate(() => Mistakes.fixed().filter((m) => m.cat === 'telc:sprachbausteine').length); log(fx === 10, `right twice in a row → fixed (${fx}/10)`);
  // duplicates are counted, not repeated
  const dup = await p.evaluate(() => { Store.mistake({ prompt: 'Test <b>x</b>', answer: 'y' }); Store.mistake({ prompt: 'Test <b>x</b>', answer: 'y' }); const m = Mistakes.open().filter((x) => x.answer === 'y'); return [m.length, m[0].n]; });
  log(dup[0] === 1 && dup[1] === 2, 'the same mistake twice → one entry, counted ×2');
  // writing corrections become mistakes
  await go('telc/b1-1/part/sa'); await p.waitForSelector('.wtext'); await p.fill('.wtext', 'Liebe Julia,\n\nich habe 28 Jahre. Ich gehe morgen nicht ins Kino.\n\nViele Grüße\nSohan'); await p.click('.wchk'); await p.waitForTimeout(200);
  log(await p.evaluate(() => Mistakes.open().some((m) => m.cat === 'write' && /28 Jahre alt/.test(m.answer))), 'a correction in a checked letter → “Writing” mistake to practise');
  // ---- sentence cards & gap sentences ----
  await go('lesson/1'); await p.waitForSelector('.addcards'); await p.click('.addcards'); await p.waitForTimeout(200);
  const sc = await p.evaluate(() => Object.keys(Store.get().scards || {}).length); log(sc >= 5, `lesson: example sentences added as sentence cards (${sc})`);
  const cz = await p.evaluate(() => { const w = Views.vocabList().find((x) => x.exDe && Views.clozeOf(x)); const c = Views.clozeOf(w); return w.exDe + ' → ' + c.html.replace(/<[^>]+>/g, '') + ' [' + c.word + ']'; });
  log(/_____/.test(cz), 'gap sentence for a known word: ' + cz.slice(0, 90));
  await p.evaluate(() => { const s = Store.get(); Object.keys(s.scards).forEach((id) => (s.srs[id].due = 0)); Store.save(); });
  await go('vocab/review'); await p.waitForSelector('.flash'); const titles = []; for (let k = 0; k < 14; k++) { const t = await p.textContent('.sess-title').catch(() => ''); titles.push(t); if (!(await p.$('.flash'))) break; await p.click('.flash'); await p.click('[data-g="2"]'); await p.waitForTimeout(40); }
  log(titles.includes('Sentence'), 'review deck mixes in sentence cards: ' + [...new Set(titles)].join(', '));
  // ---- natural recordings ----
  const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); };
  await ctx.route('**/audio/index.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ v: 1, have: { m: ['Hallo!', 'Guten Tag!'].map((t) => fnv('m|' + t)) } }) }));
  await ctx.route('**/audio/m/*.mp3', (r) => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: fs.readFileSync(__dirname + '/fixtures/hallo.mp3') }));
  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push(e.message));
  await p2.addInitScript(() => { window.__said = []; window.__played = []; window.speechSynthesis.speak = (u) => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 20); };
    HTMLMediaElement.prototype.play = function () { window.__played.push(this.src); setTimeout(() => this.onended && this.onended(), 30); return Promise.resolve(); }; });
  await p2.goto(B + '#/home'); await p2.waitForTimeout(1500);
  const nat = await p2.evaluate(async () => { await Natural.load(); window.__played = []; window.__said = []; Speech.speak('Hallo! Wie geht es dir?'); await new Promise((r) => setTimeout(r, 400)); return { played: window.__played.length, said: window.__said }; });
  log(nat.played === 1 && nat.said.length === 1 && /Wie geht/.test(nat.said[0]), `recording for “Hallo!”, device voice for the sentence without one (${nat.played} recording, TTS: ${nat.said.join(' | ')})`);
  const off = await p2.evaluate(async () => { Store.get().settings.natural = 'off'; window.__played = []; window.__said = []; Speech.speak('Hallo!'); await new Promise((r) => setTimeout(r, 200)); return window.__played.length; });
  log(off === 0, 'setting “Always the device voice” → no recordings');
  await p2.close();
  // ---- crash log ----
  await go('settings'); await p.evaluate(() => { setTimeout(() => { throw new Error('Test crash for the log'); }, 0); }); await p.waitForTimeout(200);
  await go('settings/problems'); log(/Test crash for the log/.test(await p.textContent('#view')) && !!(await p.$('.pl-send')), 'crash log: the error is listed with “Send report”');
  // ---- simpler practice page ----
  await go('practice'); const tiles = await p.$$eval('.grid2 .tile', (x) => x.map((y) => y.dataset.go)); log(tiles[0] === 'today' && tiles.includes('mistakes') && tiles.length <= 9, 'practice page: Today first, ' + tiles.length + ' tiles');
  log(!errs.filter((e) => !/Test crash/.test(e)).length, 'no page errors' + (errs.length ? ': ' + errs.filter((e) => !/Test crash/.test(e)).slice(0, 3).join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
