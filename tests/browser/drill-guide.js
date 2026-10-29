const { chromium } = require('playwright');
const B = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1'); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', unlockAll: true } })); });
  await p.goto(B + '#/practice'); await p.waitForTimeout(400);
  const ids = await p.evaluate(() => Object.keys(Engine.GEN));
  log(ids.length === 65, `${ids.length} drills on the practice page`);
  log(!!(await p.$('[data-go="revise"]')), 'Practice: Grammar revision tile');
  // every drill: guide shows + first item renders
  const bad = [];
  for (const id of ids) {
    await p.goto(B + '#/practice/' + id); await p.waitForTimeout(120);
    const r = await p.evaluate(() => { const g = document.querySelector('.dguide'); return { open: g && g.open, len: g ? g.querySelector('.guide').innerText.length : 0, q: !!document.querySelector('.sess-body .q'), ex: document.querySelectorAll('.guide .g-ex li').length, err: /hit an error/.test(document.body.innerText) }; });
    if (!r.open || r.len < 150 || !r.q || r.err) bad.push(id + JSON.stringify(r));
  }
  log(!bad.length, 'every drill opens with a rules & tips panel and a question' + (bad.length ? ': ' + bad.join(' | ') : ''));
  await p.goto(B + '#/practice/akkusativ'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/drill-open.png' });
  const txt = await p.textContent('.dguide'); log(/In one sentence/.test(txt) && /Typical mistakes/.test(txt) && /In this drill/.test(txt), 'guide has rule, examples, mistakes, drill tip');
  await p.click('.dguide > summary'); await p.waitForTimeout(200); await p.screenshot({ path: OUT + '/drill-hidden.png' });
  await p.goto(B + '#/home'); await p.goto(B + '#/practice/akkusativ'); await p.waitForTimeout(300);
  log(await p.evaluate(() => !document.querySelector('.dguide').open), 'hidden panel stays hidden next time');
  await p.goto(B + '#/practice/dativ'); await p.waitForTimeout(200); log(await p.evaluate(() => document.querySelector('.dguide').open), '… but other topics still open the first time');
  // answering still works under the panel
  await p.goto(B + '#/practice/indirekt'); await p.waitForSelector('.q-in'); const pr = await p.textContent('.q-prompt');
  const ans = await p.evaluate(() => { const t = document.querySelector('.q-prompt').innerText; return t; });
  await p.fill('.q-in', 'xyz'); await p.press('.q-in', 'Enter'); await p.waitForSelector('.q-fb:not([hidden])'); log(/verb goes to the end/.test(await p.textContent('.q-fb')), 'new drill "indirect questions" works: ' + pr.replace(/\s+/g, ' ').slice(0, 70));
  // revision page
  await p.goto(B + '#/revise'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/revise.png' });
  log((await p.$$('.rlv .topic')).length === 65, 'revision page lists all 65 topics');
  await p.fill('.search', 'perfekt'); await p.waitForTimeout(150); const vis = await p.$$eval('.rlv .topic', (x) => x.filter((y) => !y.hidden).length); log(vis >= 1 && vis < 10, `search works (${vis} for "perfekt")`);
  await p.goto(B + '#/revise/je_desto'); await p.waitForTimeout(200); log(/je|desto/i.test(await p.textContent('#view')) && !!(await p.$('[data-go="practice/je_desto"]')), 'topic page with "Practise this"');
  const cov = await p.evaluate(() => { const c = new Set(Object.values(Engine.GEN).flatMap((g) => g.lessons)); return DC.curriculum.filter((l) => !c.has(l.n)).map((l) => 'L' + l.pos); });
  log(true, 'lessons still without a drill: ' + (cov.join(', ') || 'none'));
  log(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close();
})();
