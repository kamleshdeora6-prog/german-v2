const { chromium } = require('playwright');
const VERSION = /version: "([^"]+)"/.exec(require('fs').readFileSync(__dirname + '/../../js/app.js', 'utf8'))[1];

const B = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] }); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  p.on('response', (r) => { if (r.status() >= 400 && !/manifest\.json|models\//.test(r.url())) errs.push(r.status() + ' ' + r.url()); });
  await p.addInitScript(() => { window.__said = []; if (window.speechSynthesis) { window.speechSynthesis.speak = (u) => { window.__said.push(u.text); setTimeout(() => u.onend && u.onend(), 30); }; } if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1'); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', unlockAll: true } })); });
  const go = async (r) => { await p.evaluate((r) => { location.hash = '#/' + r; }, r); await p.waitForTimeout(250); };
  await p.goto(B); await p.waitForTimeout(500);
  log(await p.evaluate((v) => App.version === v, VERSION), 'version ' + VERSION);
  log(await p.evaluate(() => !window.DC.lid && !DC.telc && !DC.scenes && !!DC.curriculum), 'heavy-but-rare data is not loaded at startup');
  await go('exam/lid'); await p.waitForSelector('.q, .choice, .lidq, #view .screen');
  log(await p.evaluate(() => !!DC.lid), '… and loads when a screen needs it (Leben in Deutschland)');
  // ---- mock exam hub ----
  await go('telc'); await p.waitForSelector('.lvseg');
  log(/Mock exams/.test(await p.textContent('#view')) && !!(await p.$('.ready')), 'mock exam hub with readiness meter');
  await p.screenshot({ path: OUT + '/telc-hub.png', fullPage: true });
  // every part of every test: fill in the right answers → 100 %
  const ids = await p.evaluate(() => Object.values(DC.telc).flat().map((t) => t.id));
  for (const id of ids) {
    const parts = await p.evaluate((id) => { const t = Object.values(DC.telc).flat().find((x) => x.id === id); return t.blocks.flatMap((b) => b.parts).filter((k) => !['write', 'speak'].includes(t.parts[k].type)); }, id);
    const bad = [];
    for (const pk of parts) {
      await go(`telc/${id}/part/${pk}`); await p.waitForSelector('.tpart');
      await p.evaluate(({ id, pk }) => {
        const t = Object.values(DC.telc).flat().find((x) => x.id === id), P = t.parts[pk], sec = document.querySelector('.tpart');
        if (P.type === 'match') P.items.forEach((it) => { sec.querySelector(`.mi[data-n="${it.n}"] select`).value = it.a; });
        if (P.type === 'mc') P.items.forEach((it) => { sec.querySelector(`[data-n="${it.n}"] input[value="${it.a}"]`).checked = true; });
        if (P.type === 'rf') P.items.forEach((it) => { sec.querySelector(`[data-n="${it.n}"] input[value="${it.a ? 1 : 0}"]`).checked = true; });
        if (P.type === 'gapmc') P.items.forEach((it) => { sec.querySelector(`.gap-s[data-n="${it.n}"]`).value = String(it.a); });
        if (P.type === 'gapbank') Object.entries(P.answers).forEach(([n, a]) => { sec.querySelector(`.gap-s[data-n="${n}"]`).value = a; });
        if (P.type === 'form') P.fields.forEach((f, i) => { sec.querySelector(`input[data-i="${i}"]`).value = f.a[0]; });
      }, { id, pk });
      await p.click('.pchk'); const sc = await p.textContent('.pscore');
      if (!/\(100%\)/.test(sc)) bad.push(pk + ': ' + sc.trim().slice(0, 40));
    }
    log(!bad.length, `${id}: all ${parts.length} scored parts give 100% with the right answers` + (bad.length ? ' – ' + bad.join(' | ') : ''));
  }
  // wrong answers show the solution and explanations
  await go('telc/b1-1/part/sb1'); await p.waitForSelector('.gap-s'); await p.click('.pchk');
  log(/0 \/ 15/.test(await p.textContent('.pscore')) && /Pronominaladverb|darüber/.test(await p.textContent('.gapres')), 'empty answers: 0 points, every gap explained');
  await p.screenshot({ path: OUT + '/sb1.png', fullPage: true });
  // listening: plays limited in the exam, transcript after checking in practice
  await go('telc/b1-1/part/hv1'); await p.waitForSelector('.aud-b'); await p.click('.aud .aud-b'); await p.waitForTimeout(300);
  log(await p.evaluate(() => window.__said.length > 0), 'listening text is read aloud');
  await p.click('.pchk'); log(await p.evaluate(() => !document.querySelector('.transcript').hidden), 'transcript appears after checking');
  // ---- writing: check, rewrite, check again ----
  await go('telc/b1-1/part/sa'); await p.waitForSelector('.wtext');
  await p.fill('.wtext', 'Liebe Julia,\n\nich habe einen neuen Job. Er ist gut.\n\nViele Grüße\nSohan'); await p.click('.wchk'); await p.waitForSelector('.fb-open');
  const s1 = +(await p.textContent('.wfb .fb-score'));
  const model = await p.evaluate(() => DC.telc.B1[0].parts.sa.model);
  await p.fill('.wtext', model); await p.click('.wchk'); await p.waitForTimeout(200);
  const s2 = +(await p.textContent('.wfb .fb-score'));
  log(s2 >= 85 && s1 < s2, `writing check: short text ${s1}, model text ${s2}`);
  log(/→/.test(await p.textContent('.whist summary')) && !!(await p.$('.wdiff ins')), 'versions with scores and a diff of what changed: ' + (await p.textContent('.whist summary')).trim());
  await p.screenshot({ path: OUT + '/writing.png', fullPage: true });
  // ---- speaking: record and play back ----
  await go('telc/b1-1/part/mp'); await p.waitForSelector('.rec-b');
  await p.click('.rec-b'); await p.waitForTimeout(1600); await p.click('.rec-b'); await p.waitForSelector('.takes li audio', { timeout: 8000 }).catch(() => {});
  log((await p.$$('.teil >> nth=0 >> .takes li')).length === 1, 'speaking: recording saved and listed with a player');
  await p.click('.sc[data-i="0"] [data-v="2"]'); await p.click('.pchk'); log(/points/.test(await p.textContent('.pscore')), 'speaking self-check scored');
  // ---- full exam (A1, practice mode) ----
  await go('telc/a1-1/run'); await p.waitForSelector('.go'); await p.check('.relax'); await p.click('.go');
  for (let blk = 0; blk < 4; blk++) {
    await p.waitForSelector('.handin');
    await p.evaluate(() => { const t = DC.telc.A1[0]; document.querySelectorAll('.tpart').forEach((sec) => { const P = t.parts[sec.dataset.pk];
      if (P.type === 'mc') P.items.forEach((it) => { sec.querySelector(`[data-n="${it.n}"] input[value="${it.a}"]`).checked = true; });
      if (P.type === 'rf') P.items.forEach((it) => { sec.querySelector(`[data-n="${it.n}"] input[value="${it.a ? 1 : 0}"]`).checked = true; });
      if (P.type === 'form') P.fields.forEach((f, i) => { sec.querySelector(`input[data-i="${i}"]`).value = f.a[0]; });
      if (P.type === 'write') sec.querySelector('.wtext').value = P.model;
      if (P.type === 'speak') sec.querySelectorAll('.sc').forEach((r) => (r.dataset.v = 2)); }); });
    await p.click('.handin'); await p.waitForTimeout(300);
  }
  await p.waitForSelector('.resbig'); const res = await p.textContent('.resbig');
  log(/Passed/.test(res), 'full A1 exam with the right answers → passed: ' + res.replace(/\s+/g, ' ').trim().slice(0, 90));
  await p.screenshot({ path: OUT + '/result.png', fullPage: true });
  await p.waitForTimeout(900); await p.evaluate(() => document.querySelectorAll('.celebrate').forEach((x) => x.remove()));
  // ---- timer in the timed exam ----
  await p.evaluate(() => document.querySelectorAll('.celebrate').forEach((x) => x.remove())); await go('telc/b1-1/run'); await p.waitForSelector('.go'); await p.click('.go'); await p.waitForSelector('.etime');
  const t1 = await p.textContent('.etime'); await p.waitForTimeout(2100); const t2 = await p.textContent('.etime');
  log(t1 === '90:00' || /^89:5/.test(t1), `timed exam: Lesen block 90 min, counts down (${t1} → ${t2})`); log(t1 !== t2, 'timer ticks');
  // ---- notebook ----
  await go('read/P0'); await p.waitForSelector('.reading .w'); let star = null; for (let k = 0; k < 25 && !star; k++) { await p.click(`.reading .w >> nth=${k}`); await p.waitForTimeout(80); star = await p.$('.lookup .star'); } if (star) await star.click(); await p.waitForTimeout(200);
  await go('notebook'); const nbt = await p.textContent('#view');
  log(!!star && /Words 1/.test(nbt), 'notebook: a word tapped in a text is saved with ☆');
  await go('practice/akkusativ'); await p.waitForSelector('.dguide .star'); await p.click('.dguide .star'); await go('notebook/rule'); log(/Akkusativ/.test(await p.textContent('.nblist')), 'notebook: a rule saved from the rules panel');
  log(await p.evaluate(() => Views.vocabList().some((w) => String(w.id).startsWith('nb:'))), 'saved words are in the flashcard deck');
  await go('cards/nb:'); await p.waitForSelector('.flash'); log(true, 'review of saved words opens');
  // ---- dictation ----
  await p.evaluate(() => { window.__said = []; }); await go('dictation/A1'); await p.waitForSelector('.d-in'); await p.waitForFunction(() => window.__said.length > 0); await p.waitForTimeout(200); const want = await p.evaluate(() => window.__said[window.__said.length - 1]);
  const wantFull = await p.evaluate(() => window.__said.join(' '));
  await p.fill('.d-in', wantFull); await p.press('.d-in', 'Enter'); await p.waitForSelector('.ddiff');
  log(/Richtig/.test(await p.textContent('.d-fb')), 'dictation: exact sentence → ✓');
  await p.click('.d-next'); await p.waitForSelector('.d-in'); await p.fill('.d-in', 'ich wohne in berln'); await p.press('.d-in', 'Enter'); await p.waitForSelector('.ddiff');
  log(!!(await p.$('.ddiff .bad, .ddiff .miss')), 'dictation: wrong letters marked'); await p.screenshot({ path: OUT + '/dictation.png' });
  // ---- story ----
  await go('story/cafe'); await p.waitForSelector('.choice');
  const goodOpt = await p.evaluate(() => { const s = DC.dialogues.cafe[0]; return [...document.querySelectorAll('.choice')].map((b) => b.dataset.v).find((v) => s.ideas.includes(v)); });
  await p.click(`.choice[data-v="${goodOpt.replace(/"/g, '\\"')}"]`); await p.waitForTimeout(1300);
  log((await p.$$('.story .msg.assistant')).length === 2, 'story: right answer → the conversation continues');
  // ---- audio lessons ----
  await go('audio'); await p.click('[data-go="audio/lesson"]'); await p.waitForTimeout(1500);
  log(/Say it in German|Listen|German/.test(await p.textContent('.ap-step')), 'audio lesson plays: ' + await p.textContent('.ap-step'));
  await go('home');
  // ---- declension ----
  await go('decline'); await p.fill('.search', 'Student'); await p.waitForTimeout(200); const dt = await p.textContent('.dout');
  log(/den Studenten/.test(dt) && /des Studenten/.test(dt), 'declension: der Student → den/des Studenten (n-Deklination)');
  await p.fill('.search', 'Tisch'); await p.waitForTimeout(200); log(/dem Tisch/.test(await p.textContent('.dout')) && /den Tischen/.test(await p.textContent('.dout')), 'declension: dem Tisch, den Tischen');
  // ---- weekly report + readiness ----
  await go('stats'); log(/This week/.test(await p.textContent('#view')) && !!(await p.$('.ready .skillbars')), 'progress page: weekly report and readiness per skill');
  await go('home'); log(!!(await p.$('.ready')), 'home: readiness meter');
  await p.screenshot({ path: OUT + '/home.png', fullPage: true });
  // ---- write trainer history ----
  await go('write/0'); await p.waitForSelector('.wtext'); await p.fill('.wtext', 'Sehr geehrte Damen und Herren, ich schreibe Ihnen, weil ich eine Frage habe. Mit freundlichen Grüßen'); await p.click('.chk'); await p.waitForTimeout(200);
  log(!!(await p.$('.wfb .whist')), 'writing trainer keeps versions too');
  // ---- library ----
  await go('library'); log((await p.$$('.lib .tile')).length >= 17, `library: ${(await p.$$('.lib .tile')).length} sections`);
  await go('watch'); log((await p.$$('.tlink')).length >= 8, 'watch & listen links');
  log(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 4).join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close();
})();
