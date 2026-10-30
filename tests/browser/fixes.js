/* 7.3: the problems collected in docs/ISSUES.md – word tiles, spelling, the text on the exam tab, Max's stricter
   writing check with explanations, levelled model answers, minutes of work, Today on Home, words of the day. */
const { chromium } = require('playwright');
const fs = require('fs');
const B = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.addInitScript(() => {
    if (window.speechSynthesis) window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 10);
    if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1');
    localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Kamlesh', color: '#E3A400', created: 1 }] }));
    localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 300, settings: { onboarded: true, labels: 'both', unlockAll: true, goal: 100 } }));
  });
  const go = async (r) => { await p.evaluate((r) => { location.hash = '#/' + r; }, r); await p.waitForTimeout(350); };
  await p.goto(B); await p.waitForTimeout(700);

  // ---- 1. word tiles (Lesson 4 → Practice → Unlimited practice) ----
  await go('lesson/4/practice');
  let found = false;
  for (let k = 0; k < 25 && !found; k++) {
    await p.evaluate(() => { const gb = document.querySelector('.genbox'); const it = Engine.generate('fragen'); UI.item(gb, it, { noFocus: true }); });
    found = !!(await p.$('.genbox .bank .tok')) && /yes\/no/.test(await p.textContent('.genbox .q-prompt'));
  }
  log(found, 'lesson 4 unlimited practice: a yes/no question with word tiles');
  const before = await p.evaluate(() => ({ ph: !document.querySelector('.genbox .built .ph').hidden, dis: document.querySelector('.genbox .q-check').disabled, toks: [...document.querySelectorAll('.genbox .bank .tok')].map((t) => t.textContent), ans: null }));
  log(before.ph && before.dis, 'empty answer line shows a hint and Check waits until the sentence is built');
  log(before.toks.every((t) => !/^[A-ZÄÖÜ]/.test(t) || /^(Sie|[A-ZÄÖÜ][a-zäöüß]+)$/.test(t)) && !before.toks.some((t) => /^(Kaufen|Kaufst|Kauft|Siehst|Sieht|Isst|Liest|Fährst|Fährt|Braucht|Brauchst)$/.test(t)), 'no capitalised verb gives the first word away: ' + before.toks.join(' '));
  await p.click('.genbox .bank .tok');
  const built1 = await p.evaluate(() => ({ n: document.querySelectorAll('.genbox .built .tok:not(.fixed)').length, ph: document.querySelector('.genbox .built .ph').hidden }));
  log(built1.n === 1 && built1.ph, 'tapping a tile moves it into the visible answer line');
  await p.screenshot({ path: OUT + '/fix-tiles.png', clip: await (await p.$('.genbox')).boundingBox() });
  await p.click('.genbox .q-type');
  log(await p.isVisible('.genbox .ord-type input') && !(await p.isVisible('.genbox .bank')), '“⌨ Type instead” switches to a text box');
  const ans = await p.evaluate(() => document.querySelector('.genbox .q-prompt').textContent);
  const right = await p.evaluate(() => { const it = document.querySelector('.genbox'); return null; });
  await p.fill('.genbox .ord-type input', 'Das ist falsch'); await p.click('.genbox .ord-type button');
  log(/Not quite/.test(await p.textContent('.genbox .q-fb')), 'a typed wrong sentence is marked wrong');

  // ---- 2./3. lesson exam: text beside the questions, spelling counts ----
  await go('lesson/4/exam');
  const et = await p.evaluate(() => { const d = document.querySelector('.exam-text details'); return { open: d.open, text: d.textContent.length, sticky: getComputedStyle(document.querySelector('.exam-text')).position, grid: getComputedStyle(document.querySelector('.exam-split')).display }; });
  log(et.text > 300 && et.sticky === 'sticky' && et.grid === 'grid' && et.open, `the reading text is on the exam tab, open beside the questions on a wide screen (${et.text} chars)`);
  const eqs = await p.$$('.eq');
  await (await eqs[5].$('input')).fill('bist du verhertitet?'); await (await eqs[5].$('form button')).click(); await p.waitForTimeout(100);
  const f5 = await eqs[5].$eval('.efb', (e) => e.innerText);
  log(!/Richtig/.test(f5) && /spelling/i.test(f5) && /verheiratet/.test(f5), 'misspelt „verhertitet“ is not “Richtig” – the spelling is marked: ' + f5.replace(/\n/g, ' ').slice(0, 120));
  await eqs[5].screenshot({ path: OUT + '/fix-spelling.png' });
  await (await eqs[5].$('input')).fill('Bist du verheiratet?'); await (await eqs[5].$('form button')).click(); await p.waitForTimeout(100);
  log(/Richtig/.test(await eqs[5].$eval('.efb', (e) => e.innerText)), 'the right spelling is accepted');
  await (await eqs[0].$('input')).fill('Sie kommt aus dem Iran'); await (await eqs[0].$('form button')).click(); await p.waitForTimeout(80);
  log(/Richtig|content is right/i.test(await eqs[0].$eval('.efb', (e) => e.innerText)), 'a full-sentence answer with the right content still counts');
  // ---- 4./5./6. the open answer from the screenshot ----
  await (await eqs[9].$('textarea')).fill('Für ersten treffen man muss nicht fragen , wie viel geld hast du ? Weil es ist eine personal information ist');
  await (await eqs[9].$('.chk')).click(); await p.waitForTimeout(250);
  const f9 = await eqs[9].$eval('.efb', (e) => e.innerText);
  const sc9 = +(await eqs[9].$eval('.fb-score', (e) => e.textContent));
  log(sc9 < 65, `many mistakes → no “Sehr gut” (score ${sc9})`);
  log(/Beim ersten Treffen muss man nicht fragen, wie viel Geld du hast/.test(f9), 'the whole answer comes back corrected');
  log(/beim ersten Treffen/.test(f9) && /verb goes to the end|subordinate clause/.test(f9) && /only once/.test(f9) && /English/.test(f9) && /no space before/i.test(f9), 'every mistake is explained: phrase, word order, doubled verb, English words, spaces');
  log(/B1/.test(f9) && /B2/.test(f9), 'model answers at higher levels (B1, B2) are shown');
  await eqs[9].screenshot({ path: OUT + '/fix-writing.png' });
  // model answers button
  await (await eqs[9].$('.model')).click(); await p.waitForTimeout(80);
  log((await eqs[9].$$('.mlevel')).length === 3 && (await eqs[9].$$('.mlevel u')).length > 0, 'Model answers: A1 · B1 · B2 with the higher-level parts underlined');

  // ---- 7. the room description (Lesson 5 speaking) ----
  await go('lesson/5/speak');
  const sp = (await p.$$('.sprompts > li'))[2];
  await (await sp.$('.typeit')).click();
  await (await sp.$('.sp-in')).fill('Das Sofa ist rote, Meine Zimmer hat 1 zimmer 1 koche, Die Zimmer hat ein bed, Meine Zimmer hat eine schrank, Mein Zimmer ist im sebt stock.');
  await (await sp.$('.sp-chk')).click(); await p.waitForTimeout(250);
  const f7 = await sp.$eval('.efb', (e) => e.innerText); const sc7 = +(await sp.$eval('.fb-score', (e) => e.textContent));
  log(sc7 < 50, `room description with ~10 mistakes scores low (${sc7}) – not “Gut”`);
  const want7 = [/ist rot\b/, /Mein Zimmer/, /einen Schrank/, /\bBett\b/, /Das Zimmer hat/, /Küche/, /Full stops between sentences/];
  log(want7.every((r) => r.test(f7)), 'finds rot, Mein Zimmer, einen Schrank, Bett, Das Zimmer, Küche and the comma-joined sentences: ' + want7.filter((r) => !r.test(f7)).join(' '));
  log(/Words from this lesson you could use/.test(f7), 'suggests words from the lesson');
  await sp.screenshot({ path: OUT + '/fix-room.png' });

  // ---- 8./9./10. minutes of work, balance, Today on Home, words of the day ----
  await p.evaluate(() => { const s = Store.get(); s.settings.minutesGoal = 90; const y = new Date(Date.now() - 864e5); const k = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`; s.workStart = k; s.work = { [k]: { m: 180, t: 9000, k: {} } }; s.work[Store.today()] = { m: 60, t: 2700, k: {} }; delete s.todaySession; Store.save(); });
  await go('home'); await p.waitForTimeout(300);
  const home = await p.textContent('#view');
  log(/60\s*\/ 90 min/.test(home.replace(/\s+/g, ' ')), 'Home ring: 60 / 90 min of work');
  log(/1 h ahead of plan|60 min ahead of plan/.test(home), '3 h yesterday + 60 min today with a 90-min target → “1 h ahead of plan”');
  log(/45 min studied today/.test(home), 'real study time shown separately (45 min)');
  log(/Covered by your lead/.test(home), 'a short day is “covered by your lead”, not a failure');
  const ht = await p.$('.home-today');
  log(!!ht && (await ht.$$('.ht-steps li')).length >= 5, "Today's plan is expanded on Home (left column)");
  const plan = await p.evaluate(() => Store.get().todaySession.steps.reduce((a, x) => a + x.mins, 0));
  log(plan >= 25 && plan <= 50, `the plan fills the 30 minutes still open (${plan} min)`);
  log((await p.$$('.ht-words .chip')).length === 5, '5 new words of the day on Home');
  await p.screenshot({ path: OUT + '/fix-home.png', fullPage: true });
  // a drill answer adds work
  const w0 = await p.evaluate(() => Work.done());
  await go('practice/akkusativ'); await p.waitForSelector('.q');
  await p.evaluate(() => { const c = document.querySelector('.q .choice'); if (c) c.click(); else { const i = document.querySelector('.q .q-in'); i.value = 'x'; document.querySelector('.q form').requestSubmit(); } });
  await p.waitForTimeout(150);
  log(await p.evaluate((w0) => Work.done() > w0, w0), 'a drill answer counts as work');
  // settings: words per day
  await go('settings'); log(await p.evaluate(() => document.querySelector('[data-k="newWords"]').value === '5' && document.querySelector('[data-k="minutesGoal"]').value === '90'), 'settings: minutes goal and new words per day');
  // ---- 11. readable names in “This week” ----
  await p.evaluate(() => { Store.topic('mistake:correction', true); Store.topic('mistake:correction', false); Store.topic('mistake:correction', true); });
  await go('home'); const wk = await p.textContent('.weekly');
  log(!/mistake:/.test(wk) && /Corrections from Max/.test(wk), '“This week” shows “Corrections from Max”, not mistake:correction');

  // phone width: the text panel is a foldable bar
  await p.setViewportSize({ width: 390, height: 800 }); await go('lesson/4/exam'); await p.reload(); await p.waitForTimeout(800);
  const ph = await p.evaluate(() => ({ open: document.querySelector('.exam-text details').open, grid: getComputedStyle(document.querySelector('.exam-split')).display, w: document.documentElement.scrollWidth }));
  log(!ph.open && ph.grid === 'block' && ph.w <= 392, 'phone: the text is a folded “Text” bar on top, no sideways scrolling ' + JSON.stringify(ph));
  await p.click('.exam-text summary'); await p.waitForTimeout(100);
  await p.screenshot({ path: OUT + '/fix-exam-phone.png' });
  log(!errs.length, 'no page errors: ' + errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
