const { chromium } = require('playwright');
const base = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); p.setDefaultTimeout(5000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('dialog'); d.dismiss(); });
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); });
  await p.addInitScript(() => { if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', theme: 'dark' } })); });
  await p.goto(base); await p.waitForTimeout(500);
  const dismiss = async () => { const c = await p.$('.celebrate button'); if (c) { await c.click().catch(() => {}); await p.waitForTimeout(80); } };
  // ---- lesson 2 practice: wrong answer, correct it, stale note, next button ----
  await p.goto(base + '#/lesson/1'); await p.waitForTimeout(200);
  await p.evaluate(() => { const ls = Store.lesson(1); ls.done = true; ls.score = 80; Store.save(); });
  await p.goto(base + '#/lesson/2/practice'); await p.waitForTimeout(300);
  const t2 = (await p.$$('.task'))[1];
  await (await t2.$('input')).fill('sprechst'); await (await t2.$('button.btn')).click(); await p.waitForTimeout(100);
  let fb = await t2.$eval('.tfb', (e) => e.innerText);
  log(/You wrote: sprechst/.test(fb) && /sprichst/.test(fb), 'wrong answer shows what you typed and the right form');
  log(/e → i/.test(fb), 'explains the vowel change: ' + fb.split('\n').find((x) => /vowel/.test(x)));
  await (await t2.$('input')).fill('sprichst'); await p.waitForTimeout(50);
  log(/Changed – press Check again/.test(await t2.$eval('.tfb', (e) => e.innerText)), 'typing again marks the old feedback as out of date');
  await (await t2.$('button.btn')).click(); await p.waitForTimeout(100);
  fb = await t2.$eval('.tfb', (e) => e.innerText); log(/Correct|Richtig/.test(fb) && !/press Check again/.test(fb), 'corrected answer is accepted: ' + fb.replace(/\n/g, ' ').slice(0, 40));
  const t14 = (await p.$$('.task'))[13]; await (await t14.$('input')).fill('isst'); await (await t14.$('button.btn')).click(); await p.waitForTimeout(100);
  log(/Capital/.test(await t14.$eval('.tfb', (e) => e.innerText)), 'lower-case „isst“ accepted with a capital-letter note');
  // answer all to pass 70 %
  const tasks = await p.evaluate(() => DC.curriculum.find((l) => l.n === 2).tasks.map((t) => t.a));
  const lis = await p.$$('.task'); for (let i = 0; i < lis.length; i++) { await (await lis[i].$('input')).fill(tasks[i]); await (await lis[i].$('button.btn')).click(); }
  await p.waitForTimeout(400); await dismiss();
  const nb = await p.$('.partnav .nextpart'); log(!!nb && /exam/i.test(await nb.textContent()), 'Practice ends with "Next: exam questions →"');
  await p.screenshot({ path: OUT + '/practice.png', fullPage: false });
  await nb.click(); await p.waitForTimeout(300); log((await p.url()).endsWith('/lesson/2/exam'), 'Next goes to the exam');
  // ---- exam: closed + open feedback ----
  const eqs = await p.$$('.eq');
  for (const k of [4, 5]) { const a = await p.evaluate((k) => DC.curriculum.find((l) => l.n === 2).exam[k].a, k); await (await eqs[k].$('input')).fill(a); await (await eqs[k].$('button.btn')).click(); }
  await (await eqs[3].$('input')).fill('trinkst'); await (await eqs[3].$('button.btn')).click(); await p.waitForTimeout(80);
  log(/Correct|Richtig/.test(await eqs[3].$eval('.efb', (e) => e.innerText)), 'closed exam question checked');
  await (await eqs[7].$('textarea')).fill('ich lese gern. ich spiele fussball.'); await (await eqs[7].$('.chk')).click(); await p.waitForTimeout(150);
  const ofb = await eqs[7].$eval('.efb', (e) => e.innerText);
  log(/6 sentences/.test(ofb) && /oft, manchmal, nie/.test(ofb) && /Capital letter/.test(ofb) && /Model answer/.test(ofb), 'open answer: length, required words, capitals and a model answer');
  console.log('      ' + ofb.replace(/\n+/g, ' | ').slice(0, 300));
  await eqs[7].screenshot({ path: OUT + '/exam-open.png' });
  await (await eqs[8].$('textarea')).fill('I play cricket on weekends with my friends.'); await (await eqs[8].$('.chk')).click(); await p.waitForTimeout(100);
  log(/looks like English/.test(await eqs[8].$eval('.efb', (e) => e.innerText)), 'English answer: told to write in German');
  const good = await p.evaluate(() => DC.curriculum.find((l) => l.n === 2).exam[8].m);
  await (await eqs[8].$('textarea')).fill(good); await (await eqs[8].$('.chk')).click(); await p.waitForTimeout(100);
  const sc = +(await eqs[8].$eval('.fb-score', (e) => e.textContent)); log(sc >= 70, 'a good answer scores well: ' + sc);
  const nb2 = await p.$('.partnav .nextpart'); log(/speak/i.test(await nb2.textContent()), 'Exam ends with "Next: speaking →"');
  await nb2.click(); await p.waitForTimeout(300); log((await p.url()).endsWith('/lesson/2/speak'), 'Next goes to speaking');
  // ---- speak: type instead of microphone ----
  const sp = (await p.$$('.sprompts > li'))[1];
  await (await sp.$('.typeit')).click(); await (await sp.$('.sp-in')).fill('Ich spiele gern Fussball im Park. Ich laufe oft.'); await (await sp.$('.sp-chk')).click(); await p.waitForTimeout(100);
  log(!!(await sp.$('.fb-score')), 'speaking prompt answered by typing gets scored feedback');
  await sp.screenshot({ path: OUT + '/speak.png' });
  const fin = await p.$('.partnav .finish'); const ft = await fin.textContent(); log(/lesson 3/i.test(ft), 'Speak ends with: ' + ft.trim());
  await fin.click(); await p.waitForTimeout(300); log((await p.url()).endsWith('/lesson/3'), 'Finish opens the next lesson');
  log(await p.evaluate(() => !!Store.lesson(2).parts.speak && !!Store.lesson(2).parts.exam && !!Store.lesson(2).parts.practice), 'lesson 2: practice, exam and speak parts ticked');

  // ---- practice day: 158 minutes, auto ticks, more ----
  await p.evaluate(() => { const s = Store.get(); s.plan = { level: 'B1', from: 1, target: 43, created: Date.now(), days: 60, off: 1, deadline: Date.now() + 70 * 864e5, minutes: 158, words: 20, verdict: 'planHard', doneToday: null }; delete s.daily; Store.save(); });
  await p.goto(base + '#/daily'); await p.waitForTimeout(300);
  const txt = await p.textContent('#view');
  const m = /Today's list: (\d+) min/.exec(txt); log(m && +m[1] >= 158, 'practice day fills the plan: ' + (m && m[1]) + ' min for a 158-min plan');
  const n0 = await p.$$eval('.daylist li', (x) => x.length); console.log('      ' + n0 + ' steps: ' + (await p.$$eval('.daylist li .link', (x) => x.slice(0, 8).map((e) => e.textContent.trim()).join(' | '))));
  await p.screenshot({ path: OUT + '/daily.png', fullPage: true });
  // do 10 smart drills → the drill item should tick itself
  await p.goto(base + '#/practice/smart'); await p.waitForTimeout(300);
  for (let i = 0; i < 10; i++) { await p.evaluate(() => Habit.track('drill')); }
  await p.goto(base + '#/daily'); await p.waitForTimeout(300);
  log(await p.$eval('.daylist li:has([data-id="drill:10"])', (e) => e.classList.contains('ok')), 'sentence drills tick themselves after 10 drills');
  log(await p.$eval('.daylist li:has([data-id^="part:3:learn"])', (e) => !e.classList.contains('ok')).catch(() => true), 'undone lesson part stays open');
  await p.goto(base + '#/lesson/3'); await p.click('.nextpart'); await p.waitForTimeout(200);
  await p.goto(base + '#/daily'); await p.waitForTimeout(300);
  log(await p.$eval('.daylist li:has([data-id="part:3:learn"])', (e) => e.classList.contains('ok')), 'lesson part ticks itself after doing it');
  // tick everything → done + more
  await p.evaluate(() => { const st = Store.get().daily; st.manual = st.items.map((x) => x.id); Store.save(); });
  await p.goto(base + '#/home'); await p.goto(base + '#/daily'); await p.waitForTimeout(300);
  log(/Done for today|Geschafft/.test(await p.textContent('#view')), 'all done shows the done message');
  const before = await p.$$eval('.daylist li', (x) => x.length);
  await p.click('.more15'); await p.waitForTimeout(300);
  const after = await p.$$eval('.daylist li', (x) => x.length); log(after > before && !/Done for today/.test(await p.textContent('.daylist + *').catch(() => '')), `“+15 more minutes” adds steps (${before} → ${after})`);
  log(!/\( due\)/.test(await p.textContent('#view')), 'no empty "( due)" label');
  // weak topics now work
  await p.evaluate(() => { const s = Store.get(); s.topics.dativ = { r: 2, w: 6, recent: [0,0,1,0,1,0,0,0] }; Store.save(); });
  await p.goto(base + '#/weak'); await p.waitForTimeout(200);
  log(/Drill/.test(await p.textContent('#view')), 'weak topics list shows topics you get wrong');
  console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none')); console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
