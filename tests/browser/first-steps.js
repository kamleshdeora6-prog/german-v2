const { chromium } = require('playwright');
const base = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); p.setDefaultTimeout(4000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('dialog: ' + d.message()); d.dismiss(); });
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); });
  await p.goto(base); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(400);
  // onboarding as a zero-German user
  await p.fill('.obname', 'Neu'); await p.click('.ob-next'); await p.click('.ob-next');
  const opt = await p.textContent('.onb [data-lvl="-1"]'); log(/zero German/.test(opt), 'onboarding offers "I know zero German"');
  await p.click('.onb [data-lvl="-1"]'); await p.waitForTimeout(300);
  log((await p.url()).endsWith('#/starter'), 'zero German lands on First steps: ' + (await p.url()).split('#')[1]);
  log(await p.evaluate(() => document.documentElement.dataset.labels === 'en'), 'app switched to English');
  log(await p.$$eval('.st-node', (n) => n.length) === 18, '18 units on the path');
  log(await p.$$eval('.st-node.locked', (n) => n.length) === 17, 'only the first unit is open');
  await p.screenshot({ path: OUT + '/m-path.png' });
  // nav labels in English only
  const navTxt = await p.$$eval('.nav a', (as) => as.map((a) => a.innerText.trim()).join('|'));
  log(!/Heute|Kurs|Üben|Mehr/.test(navTxt), 'menu shows English only: ' + navTxt.replace(/\n/g, ' '));

  const dismiss = async () => { const c = await p.$('.celebrate button'); if (c) { await c.click().catch(() => {}); await p.waitForTimeout(80); } };
  // ---- play unit 1, level 1, as a smart user (always right) ----
  async function play(smart, maxSteps = 80) {
    let steps = 0, types = new Set();
    while (steps++ < maxSteps) {
      await p.waitForTimeout(60);
      await dismiss();
      if (await p.$('.st-done')) return types;
      const it = await p.evaluate(() => { const i = Views._stItem; return i && { type: i.type, de: i.w && i.w.de, art: i.w && i.w.art, ans: i.opts ? i.opts.indexOf(i.w) : -1, p: i.p && i.p[0], ids: i.pairs && i.pairs.map((w) => w.id) }; });
      const footOpen = await p.$eval('.st-foot', (f) => !f.hidden).catch(() => false);
      if (footOpen) { await p.click('.st-go'); continue; }
      if (!it) { await p.waitForTimeout(100); continue; }
      types.add(it.type);
      const wrong = !smart && Math.random() < 0.35;
      if (['pick', 'de2en', 'en2de', 'listen'].includes(it.type)) { const n = await p.$$('.st-opt'); const k = wrong ? (it.ans + 1) % n.length : it.ans; await n[k].click(); if (!smart) await n[k].click().catch(() => {}); }
      else if (it.type === 'article') { await p.click(`.st-opt[data-a="${wrong ? (it.art === 'der' ? 'die' : 'der') : it.art}"]`); }
      else if (it.type === 'type') { await p.fill('.st-in', wrong ? 'xyz' : it.de.toUpperCase() === it.de ? it.de : it.de); await p.click('.st-type .btn.sign'); }
      else if (it.type === 'match') {
        for (const id of it.ids) {
          if (wrong) { const others = it.ids.filter((x) => x !== id); const o = others[0]; if (o) { await p.click(`.st-m.de[data-id="${id}"]:not(.done)`).catch(() => {}); await p.click(`.st-m.en[data-id="${o}"]:not(.done)`).catch(() => {}); await p.waitForTimeout(500); } }
          await p.click(`.st-m.de[data-id="${id}"]`); await p.click(`.st-m.en[data-id="${id}"]`);
        }
      }
      else if (it.type === 'build' || it.type === 'listenbuild') {
        const want = it.p.replace(/[.,!?]/g, '').split(/\s+/);
        if (wrong) { const t = await p.$$('.st-tiles .tok'); await t[t.length - 1].click(); }
        else for (const w of want) { const t = await p.$$('.st-tiles .tok'); for (const x of t) { if ((await x.textContent()) === w) { await x.click(); break; } } }
        await p.click('.st-check');
      }
      else if (it.type === 'intro') { await p.click('.st-go'); continue; }
    }
    return types;
  }
  await p.click('.st-node:first-child [data-go^="starter/u/"]'); await p.waitForTimeout(200);
  log(await p.evaluate(() => document.body.classList.contains('st-focus')), 'round hides the menus (focus mode)');
  await p.screenshot({ path: OUT + '/m-intro.png' });
  let types = await play(true);
  log(!!(await p.$('.st-done')), 'level 1 round reaches the summary; types: ' + [...types].join(','));
  await p.screenshot({ path: OUT + '/m-summary.png' });
  const lvl = await p.evaluate(() => Store.get().starter.u.hallo.lvl); log(lvl === 1, 'unit 1 is at level 1');
  log(await p.evaluate(() => Store.get().xp) >= 15, 'XP added: ' + (await p.evaluate(() => Store.get().xp)));
  log(await p.evaluate(() => Object.keys(Store.get().srs).filter((k) => k.startsWith('st:')).length) >= 5, 'new words went into the flashcard schedule');
  log(!(await p.evaluate(() => document.body.classList.contains('st-focus'))), 'menus come back after the round');
  await p.goto(base + '#/starter'); await p.waitForTimeout(200);
  log(await p.$$eval('.st-node.locked', (n) => n.length) === 16, 'unit 2 unlocked after level 1');

  // ---- level 2 and 3 as a careless user: wrong answers, double taps ----
  for (const L of [2, 3]) {
    await dismiss(); await p.goto(base + '#/starter'); await p.waitForTimeout(100); await p.goto(base + '#/starter/u/hallo'); await p.waitForTimeout(200);
    types = await play(false, 200);
    log(!!(await p.$('.st-done')), `level ${L} (careless user) still finishes; types: ` + [...types].join(','));
    log(await p.evaluate(() => Store.get().starter.u.hallo.lvl) === L, `unit 1 now at level ${L}`);
  }
  await p.goto(base + '#/starter'); await p.waitForTimeout(200);
  log(await p.$eval('.st-node:first-child', (n) => n.classList.contains('gold')), 'mastered unit shows gold');

  // ---- quitting midway & nonsense routes ----
  await p.goto(base + '#/starter/u/menschen'); await p.waitForTimeout(200);
  log(/opens when you finish/.test(await p.textContent('#view')) || !!(await p.$('.st-stage')), 'locked/unlocked unit route handled');
  await p.goto(base + '#/starter/u/ich'); await p.waitForTimeout(200);
  await dismiss(); await p.click('.st-go').catch(() => {}); await p.click('.st-x'); await p.waitForTimeout(200);
  log((await p.url()).endsWith('#/starter') && !(await p.evaluate(() => document.body.classList.contains('st-focus'))), 'quit (✕) returns to the path with menus visible');
  for (const r of ['starter/u/zzz', 'starter/cards/zzz', 'starter/xyz']) { await p.goto(base + '#/' + r); await p.waitForTimeout(150); log(!errs.length, `#/${r} → ${(await p.textContent('#view')).trim().slice(0, 40).replace(/\s+/g, ' ')}`); }
  // typing edge cases
  const res = await p.evaluate(() => { const q = Views.starterBuild(DC.starter[2], 3); return q.filter(Boolean).length === q.length && q.every((x) => x.type !== 'match' || x.pairs.length === 5); });
  log(res, 'level-3 round has no empty steps');
  const allOk = await p.evaluate(() => DC.starter.every((u) => [1, 2, 3].every((l) => { const q = Views.starterBuild(u, l); return q.length >= 8 && q.every((x) => x && (!x.opts || (x.opts.includes(x.w) && x.opts.length >= 2 && new Set(x.opts.map((o) => o.de.toLowerCase())).size === x.opts.length))); })));
  log(allOk, 'every unit × level builds a round where each question contains its answer and no duplicate options');
  const picOk = await p.evaluate(() => DC.starter.every((u) => [1, 2].every((l) => Views.starterBuild(u, l).filter((x) => x.type === 'pick').every((x) => new Set(x.opts.map((o) => o.e)).size === x.opts.length))));
  log(picOk, 'picture questions never show the same picture twice');
  // cards
  await p.goto(base + '#/starter/cards/hallo'); await p.waitForTimeout(200);
  await dismiss(); await p.click('.flip'); await p.waitForTimeout(500); await p.screenshot({ path: OUT + '/m-card.png' });
  log(await p.isVisible('.st-grade'), 'flashcard flips and shows grading');
  for (let i = 0; i < 30 && !(await p.$('.st-done')); i++) { await p.click('.flip').catch(() => {}); await p.click(i % 3 ? '.gotit' : '.again').catch(() => {}); }
  log(!!(await p.$('.st-done')), 'flashcard deck ends (cards marked "again" come back first)');
  // review
  await dismiss(); await p.goto(base + '#/starter/review'); await p.waitForTimeout(200);
  types = await play(true); log(!!(await p.$('.st-done')), 'mixed review works: ' + [...types].join(','));

  // ---- English mode in the real course ----
  await dismiss(); await p.goto(base + '#/lesson/1'); await p.waitForTimeout(300);
  const vis = await p.evaluate(() => { const v = (sel) => [...document.querySelectorAll(sel)].some((e) => e.offsetParent); return { en: v('.x-en'), de: v('.x-de') }; });
  log(vis.en && !vis.de, 'lesson 1 explanation is in English in English mode');
  log(/Introducing yourself/.test(await p.textContent('#view')), 'lesson title in English');
  await p.screenshot({ path: OUT + '/m-lesson-en.png', fullPage: false });
  await p.goto(base + '#/lesson/1/read'); await p.waitForTimeout(300);
  const hb = await p.$('.hintbtn'); log(!!hb, 'German questions have an EN? hint button');
  await dismiss(); if (hb) { await hb.click(); await p.waitForTimeout(100); const g = await p.textContent('.ghint'); log(/where|how|old/i.test(g), 'hint shows word-by-word English: ' + g.replace(/\s+/g, ' ').slice(0, 60)); }
  // switch to both
  await p.evaluate(() => { Store.get().settings.labels = 'both'; Store.save(); App.applyTheme(); });
  await p.goto(base + '#/lesson/1'); await p.waitForTimeout(300);
  const vis2 = await p.evaluate(() => { const v = (sel) => [...document.querySelectorAll(sel)].some((e) => e.offsetParent); return { de: v('.x-de'), fold: v('.x-en-fold'), en: v('.x-en') }; });
  log(vis2.de && vis2.fold && !vis2.en, 'German + English mode: German explanation with an English fold-out');
  await p.goto(base + '#/home'); await p.waitForTimeout(300);
  log(await p.isVisible('.st-entry'), 'Today shows the First steps card');
  const nx = await p.textContent('.go-next'); log(/First steps/.test(nx), 'big next-step button points to First steps: ' + nx.trim().slice(0, 50));
  await p.screenshot({ path: OUT + '/m-home.png' });
  // desktop
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.goto(base + '#/starter'); await p.waitForTimeout(300); await p.screenshot({ path: OUT + '/d-path.png' });
  await dismiss(); await p.goto(base + '#/starter/u/ich'); await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { await p.click('.st-go').catch(() => {}); await p.waitForTimeout(100); }
  await p.screenshot({ path: OUT + '/d-round.png' });
  const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth); log(!hs, 'no sideways scrolling on desktop');
  console.log('\nERRORS: ' + (errs.length ? errs.join('\n') : 'none')); console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
