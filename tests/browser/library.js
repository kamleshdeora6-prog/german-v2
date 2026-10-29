const { chromium } = require('playwright');
const B = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch();
  for (const [vw, vh, tag] of [[1280, 900, 'pc'], [390, 844, 'phone']]) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh } }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('response', (r) => { if (r.status() >= 400 && !/manifest\.json|models\//.test(r.url())) errs.push(r.status() + ' ' + r.url()); });
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1'); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both' } })); });
  const t = async (r) => { await p.goto(B + '#/' + r); await p.waitForTimeout(250); return p.textContent('#view'); };
  const shot = (n) => p.screenshot({ path: `${OUT}/${tag}-${n}.png`, fullPage: tag === 'phone' });
  const tx = await t('library'); const tiles = await p.$$eval('.lib .tile', (x) => x.map((y) => y.dataset.go));
  log(tiles.length >= 15 && !/error/.test(tx), `${tag}: library has ${tiles.length} sections: ${tiles.join(', ')}`); await shot('library');
  if (tag === 'pc') { log(!!(await p.$('.top a[href="#/library"], header a[href="#/library"]')), 'header link Bibliothek on PC'); }
  for (const go of tiles) { const v = await t(go); log(v.length > 80 && !/hit an error|not found/i.test(v), `${tag}: ${go} opens (${v.replace(/\s+/g, ' ').trim().slice(0, 70)})`); }
  await t('more'); log(!!(await p.$('[data-go="library"]')), 'More → Library'); await t('practice'); log(!!(await p.$('[data-go="library"]')), 'Practice → Library');
  if (tag === 'phone') { await ctx.close(); continue; }
  // flashcards
  await t('cards'); await shot('cards'); await p.click('.tile.hero'); await p.waitForSelector('.flash');
  const front = await p.textContent('.flash .front'); await p.click('.flash'); const backT = await p.textContent('.flash .back');
  log(front.trim() && backT.trim(), `flashcard turns: ${front.trim()} → ${backT.trim().slice(0, 40)}`); await shot('card');
  await p.click('[data-g="0"]'); const cnt = await p.textContent('.sess-head'); log(/\+1/.test(cnt), '"Again" puts the card back into the round: ' + cnt.replace(/\s+/g, ' ').trim());
  log(await p.evaluate(() => Object.keys(Store.get().srs).length >= 1), 'flashcard answers go into spaced repetition');
  await t('cards/g:grammar'); await p.click('.flash'); log((await p.textContent('.flash')).trim().length > 6, 'grammar cards from the first app: ' + (await p.textContent('.flash')).replace(/\s+/g, ' ').trim().slice(0, 80));
  // exercises
  await t('exercises'); await p.click('[data-go="exercises/bank:prepositions"]'); await p.waitForSelector('.q');
  log(/___|\?|\./.test(await p.textContent('.q-prompt')), 'question bank by type: ' + (await p.textContent('.q-prompt')).trim().slice(0, 60));
  // verbs
  await t('verbs'); await p.fill('.search', 'to go'); await p.waitForTimeout(150); await p.click('.vlist .link'); await p.waitForTimeout(250);
  log(/gehe|geht/.test(await p.textContent('#view')), 'verb table: ' + (await p.textContent('.page-title')));
  await t('verbs/drill'); await p.waitForSelector('.q-in'); const vp = await p.textContent('.q-prompt'); await p.fill('.q-in', 'xyz'); await p.press('.q-in', 'Enter'); await p.waitForSelector('.q-fb:not([hidden])');
  log(/ich .* du .* er/.test(await p.textContent('.q-fb .why')), 'conjugation drill explains with the full table: ' + vp.trim());
  // sentences
  await t('sentences/A1'); await p.waitForSelector('.q-in'); const sp = await p.textContent('.q-prompt'); const ans = await p.evaluate(() => { const en = document.querySelector('.q-prompt b').textContent; return Object.values(DC.sentences).flat().find((s) => s.en === en).de; });
  await p.fill('.q-in', ans.replace(/\.$/, '').toLowerCase()); await p.press('.q-in', 'Enter'); await p.waitForSelector('.q-fb:not([hidden])');
  log(/Richtig/.test(await p.textContent('.q-fb')), 'sentence translation accepted without capitals/full stop: ' + sp.replace('Translate into German:', '').trim());
  // pictures
  await t('pictures'); await shot('pictures'); const imgs = await p.$$eval('.pictile img', (x) => x.map((i) => i.naturalWidth > 0));
  log(imgs.length === 9 && imgs.every(Boolean), `all ${imgs.length} pictures from assets/ load`);
  await p.click('.pictile'); await p.waitForSelector('.pic img'); await p.fill('textarea', 'Auf dem Bild sehe ich eine Familie. Sie sitzen am Tisch und essen zusammen. Die Stimmung ist gut. Ich esse auch gern mit meiner Familie.');
  await p.click('.chk'); await p.waitForSelector('.fb-open'); log(/\d+/.test(await p.textContent('.fb-score')), 'picture description scored: ' + await p.textContent('.fb-score')); await shot('picture');
  await p.click('.mdl'); log(/Auf dem Bild/.test(await p.textContent('.pfb')), 'model description');
  // notes, reading, poster
  await t('grammar/notes'); log((await p.$$('.gbody details')).length >= 50, `notes: ${(await p.$$('.gbody details')).length} notes`);
  await t('grammar/tables'); await p.click('.poster summary'); await p.waitForTimeout(600); log(await p.$eval('.poster img', (i) => new Promise((r) => (i.complete ? r(i.naturalWidth) : (i.onload = () => r(i.naturalWidth))))).then((w) => w > 0), 'grammar poster image (assets/grammar_reference.png)');
  const rd = await t('read'); log(/B2|C1/.test(rd), 'reading list now shows B2/C1 passages too');
  log(!errs.length, 'no errors / missing files' + (errs.length ? ': ' + errs.slice(0, 4).join(' | ') : ''));
  await ctx.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`); await b.close();
})();
