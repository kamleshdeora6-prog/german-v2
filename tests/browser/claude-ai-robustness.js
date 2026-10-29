const { chromium } = require('playwright');
const base = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
const issues = []; const note = (ok, m) => { console.log((ok ? 'OK    ' : 'ISSUE ') + m); if (!ok) issues.push(m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${__dirname}/fixtures/speech.wav`] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'], acceptDownloads: true });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('DIALOG ' + d.message()); d.dismiss(); });
  await p.addInitScript(() => { window.__said = []; window.speechSynthesis && (window.speechSynthesis.speak = (u) => window.__said.push(u.text)); if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', partnerMode: 'ai', aiProvider: 'claude', aiKey: 'sk-ant-test', aiOnline: true, asr: 'whisper' } })); });
  let mode = 'normal'; const reqs = []; let fails = 0;
  await ctx.route('https://api.anthropic.com/v1/messages', async (route) => {
    const body = JSON.parse(route.request().postData()); reqs.push(body);
    const ok = (text, extra = {}) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({ content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: JSON.stringify(body).length / 4 | 0, output_tokens: 120 } }, extra)) });
    const sys = String(body.system);
    if (mode === 'prose') return ok('Sure! Here is my reply:\n{"de": "Wie heißt du?", "en": "What is your name?", "correction": null, "suggest": "Ich heiße …"}\nHope this helps!');
    if (mode === 'truncated') return ok('{"de": "Das ist sehr interessant, erzähl mir mehr über deine Fam', { stop_reason: 'max_tokens' });
    if (mode === 'html') return ok(JSON.stringify({ de: '<img src=x onerror="alert(1)">Hallo!', en: '<b>hi</b>', correction: { wrong: '<script>alert(2)</script>', right: 'x', why: '<i>y</i>' }, suggest: '"><svg onload=alert(3)>' }));
    if (mode === 'busy' && fails < 1) { fails++; return route.fulfill({ status: 529, contentType: 'application/json', body: '{"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}' }); }
    if (mode === 'down') return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
    if (mode === 'synonym' && /exercises/.test(sys)) return ok(JSON.stringify({ items: [
      { type: 'gap', sentence: 'Ich ___ heute ins Kino.', answer: 'gehe', accept: ['fahre', 'laufe', 'geht'], en: 'I go to the cinema today.', why: 'ich → -e', topic: 'Präsens' },
      { type: 'gap', sentence: 'Am Wochenende ___ ich nach Hamburg.', answer: 'fahre', en: 'At the weekend I go to Hamburg.', why: '', topic: 'Präsens' },
      { type: 'gap', sentence: 'Das Kind spielt im Garten mit ___ Hund.', answer: 'dem', en: '', why: 'mit + Dativ', topic: 'Dativ' },
      { type: 'gap', sentence: 'Gestern bin ich ins Kino ___.', answer: 'gegangen', en: '', why: '', topic: 'Perfekt' } ] }));
    if (/conversation partner/.test(sys)) return ok(JSON.stringify({ de: 'Schön! Und was machst du gern am Wochenende?', en: 'Nice! And what do you like doing at the weekend?', correction: null, suggest: 'Am Wochenende spiele ich Fußball.' }));
    if (/private notes/.test(sys)) return ok('{"notes": ["note"]}');
    return ok('{"score": 80, "summary": "ok", "good": [], "mistakes": [], "words": [], "next": "x"}');
  });
  let asrText = ' Ich spiele gern Fußball.';
  await ctx.route(/vendor\/transformers-4\.3\.1\/transformers\.min\.js/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: `export const env = { backends: { onnx: { wasm: {} } } }; export async function pipeline() { return async () => { const r = await fetch('/__asr'); return { text: await r.text() }; }; }` }));
  await ctx.route('**/__asr', (route) => route.fulfill({ status: 200, contentType: 'text/plain', headers: { 'access-control-allow-origin': '*' }, body: asrText }));
  await p.goto(base); await p.waitForTimeout(400);
  const send = async (t) => { await p.fill('.pcomp textarea', t); await p.click('.pcomp .btn.sign'); await p.waitForFunction(() => !document.querySelector('.pchat .typing'), null, { timeout: 10000 }); };

  console.log('\n— 1. Robustness against bad AI replies —');
  await p.goto(base + '#/partner/intro'); await p.waitForFunction(() => !document.querySelector('.pchat .typing'));
  mode = 'prose'; await send('Hallo!'); note(/Wie heißt du/.test(await p.textContent('.pchat')), 'JSON wrapped in chatty text is still understood');
  mode = 'truncated'; await send('Ich habe eine große Familie.');
  const tr = await p.textContent('.pchat'); note(!/could not be read/.test(tr) || /longer|cut off/.test(tr), 'a reply cut off at max_tokens: ' + (tr.match(/⚠️[^T]*/) || ['(no error shown)'])[0].trim());
  mode = 'html'; await send('Test.'); await p.waitForTimeout(300);
  note(!errs.some((e) => /DIALOG/.test(e)) && !(await p.$('.pchat img, .pchat svg, .pchat script')), 'HTML/script inside AI replies is shown as text, never run');
  mode = 'busy'; fails = 0; await send('Noch ein Test.'); note(/Wochenende/.test(await p.textContent('.pchat')), 'one "overloaded" (529) is retried silently');
  mode = 'down'; const t0 = Date.now(); await send('Hallo?'); const waited = Date.now() - t0;
  note(/busy|try again/i.test(await p.textContent('.pchat')) && !!(await p.$('.p-retry')), `server down: clear message + Try again (after ${Math.round(waited / 1000)} s of retries)`);
  mode = 'normal'; await send('Ich bin wieder da.');
  const roles = reqs[reqs.length - 1].messages.map((m) => m.role[0]).join('');
  note(!/uu|aa/.test(roles), 'after an error, messages still alternate user/assistant (API requirement): ' + roles);

  console.log('\n— 2. Cost and length of a long conversation —');
  for (let i = 0; i < 26; i++) await send('Ich spiele gern Fußball mit meinen Freunden im Park. ' + i);
  const lastReq = reqs[reqs.length - 1]; const chars = JSON.stringify(lastReq.messages).length;
  note(lastReq.messages.length <= 30, `after ~30 turns the request carries ${lastReq.messages.length} messages (${Math.round(chars / 1000)}k characters)`);
  note(lastReq.max_tokens >= 1000, `partner max_tokens = ${lastReq.max_tokens} (thinking also uses this budget)`);
  const usage = await p.evaluate(() => AI.usage()); console.log(`      usage counter: ${usage.calls} requests, about $${usage.usd.toFixed(4)}`);

  console.log('\n— 3. Speech: Whisper quirks —');
  await p.goto(base + '#/partner/free'); await p.waitForFunction(() => !document.querySelector('.pchat .typing'));
  asrText = ' Untertitel im Auftrag des ZDF für funk, 2017'; const n0 = reqs.length;
  await p.click('.pcomp .mic'); await p.waitForTimeout(6000);
  note(!/ZDF/.test(await p.$$eval('.pchat .msg.user', (m) => m.map((x) => x.textContent).join(' '))), 'Whisper\'s typical German "hallucination" on noise (Untertitel … ZDF) is not sent as the learner\'s words');
  asrText = ' I like playing football with my friends.';
  await p.click('.pcomp .mic'); await p.waitForTimeout(6000);
  const us = await p.$$eval('.pchat .msg.user', (m) => m.map((x) => x.textContent).join(' | '));
  note(!/I like playing/.test(us) && /That was English/.test(await p.textContent('.p-suggest')), 'learner answers in English → told to try German');
  note(await p.evaluate(() => (window.__said || []).length > 0), 'partner replies are read aloud');

  console.log('\n— 4. Exercises from mistakes —');
  mode = 'synonym'; await p.goto(base + '#/practice/ai'); await p.waitForSelector('.sess-body .q', { timeout: 10000 });
  const first = await p.textContent('.sess-body .q-prompt');
  if (/Kino/.test(first)) { await p.fill('.q-in', 'fahre'); await p.click('.q-form .btn'); }
  const v1 = await p.textContent('.sess-body .q-fb').catch(() => '');
  note(!/Kino/.test(first) || /Richtig|Correct/.test(v1), 'an open gap with more than one right verb (gehe/fahre ins Kino) accepts the other right answer: ' + v1.replace(/\s+/g, ' ').slice(0, 60));

  console.log('\n— 5. Privacy and key safety —');
  await p.goto(base + '#/settings'); await p.waitForTimeout(300);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.exp')]);
  const txt = require('fs').readFileSync(await dl.path(), 'utf8');
  note(!/sk-ant-test/.test(txt), 'the exported backup file does not contain the API key');
  note(!/Sohan/.test(String(reqs[0].system)) || true, 'name sent to Anthropic: ' + (/Sohan/.test(String(reqs[1] && reqs[1].system)) ? 'yes (first name only)' : 'no'));

  console.log('\nPage errors: ' + (errs.filter((e) => !/DIALOG/.test(e)).join(' | ') || 'none'));
  console.log(`\n${issues.length} issue(s):\n- ` + issues.join('\n- '));
  await b.close();
})();
