const { chromium } = require('playwright');
const base = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${__dirname}/fixtures/speech.wav`] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });
  const p = await ctx.newPage(); p.setDefaultTimeout(8000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => { errs.push('dialog'); d.dismiss(); });
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', partnerMode: 'ai', aiProvider: 'claude' }, mistakes: [{ t: 1, prompt: 'x', given: 'Ich habe 28 Jahre', answer: 'Ich bin 28 Jahre alt' }] })); });
  // ---- a simulated Anthropic API that checks every request ----
  const reqs = [];
  await ctx.route('https://api.anthropic.com/v1/messages', async (route) => {
    const r = route.request(); const h = r.headers(); const body = JSON.parse(r.postData() || '{}'); reqs.push({ h, body });
    if (h['x-api-key'] === 'sk-bad') return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }) });
    const sys = String(body.system || ''), last = String(body.messages.slice(-1)[0].content);
    let text = 'Hallo! Schön, dich zu sehen.';
    if (/conversation partner/.test(sys)) text = JSON.stringify({ de: /28 Jahre/.test(last) ? 'Ach so, du bist 28. Und was machst du beruflich?' : 'Hallo! Ich bin deine Nachbarin. Wie heißt du?', en: 'Hello! …', correction: /habe 28 Jahre/.test(last) ? { wrong: 'Ich habe 28 Jahre', right: 'Ich bin 28 Jahre alt', why: 'Age uses sein.' } : null, suggest: 'Ich heiße Sohan.', end: false });
    else if (/reviewing a short spoken role-play/.test(sys)) text = '```json\n' + JSON.stringify({ score: 78, summary: 'Good start.', good: ['Clear answers'], mistakes: [{ wrong: 'Ich habe 28 Jahre', right: 'Ich bin 28 Jahre alt', why: 'Age uses sein.' }], words: [{ de: 'der Beruf', en: 'job' }], next: 'Practise sein.' }) + '\n```';
    else if (/write German grammar exercises/.test(sys)) text = JSON.stringify({ items: [
      { type: 'gap', sentence: 'Ich ___ 28 Jahre alt.', answer: 'bin', hint: '(sein)', en: 'I am 28.', why: 'Age uses sein.', topic: 'sein' },
      { type: 'gap', sentence: 'Du ___ gut Deutsch.', answer: 'sprichst', hint: '(sprechen)', en: 'You speak good German.', why: 'e → i', topic: 'Präsens' },
      { type: 'choice', sentence: 'Ich helfe ___ Mann.', answer: 'dem', options: ['den', 'dem', 'der'], en: 'I help the man.', why: 'helfen + Dativ', topic: 'Dativ' },
      { type: 'gap', sentence: 'Er ___ 25 Jahre.', answer: 'hat', en: 'wrong on purpose', why: '', topic: 'bad' },
      { type: 'choice', sentence: 'Wir ___ nach Hause.', answer: 'gehen', options: ['geht', 'gehst'], en: 'answer missing from options', why: '', topic: 'bad' },
      { type: 'gap', sentence: 'no gap here', answer: 'x' },
      { type: 'gap', sentence: 'Sie ___ ein Buch.', answer: 'liest', hint: '(lesen)', en: 'She reads a book.', why: 'e → ie', topic: 'Präsens' },
      { type: 'gap', sentence: 'Wir ___ heute Abend zusammen.', answer: 'kochen', hint: '(kochen)', en: 'We cook together tonight.', why: 'wir -en', topic: 'Präsens' } ] });
    else if (/experienced, encouraging German teacher/.test(sys)) text = JSON.stringify({ score: 72, verdict: 'A good answer!', task_fit: 'You answered the question.', errors: [{ wrong: 'fussball', right: 'Fußball', why: 'Nouns are capitalised; ß after a long vowel.' }], corrected: 'Ich lese gern. Ich spiele Fußball.', better: 'Ich lese oft Romane und spiele manchmal Fußball.', tip: 'Use oft/manchmal/nie.' });
    else if (/private notes/.test(sys)) text = JSON.stringify({ notes: ['Uses haben for age – practise sein', 'Likes football'] });
    else if (/You are Max/.test(sys)) text = '<p><b>Dativ</b> answers <i>Wem?</i> …</p><script>alert(1)</script>';
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', content: [{ type: 'thinking', thinking: '…' }, { type: 'text', text }], usage: { input_tokens: 800, output_tokens: 200 } }) });
  });
  // ---- a stand-in for the Whisper library (the real one downloads ~80 MB from a CDN) ----
  await ctx.route(/vendor\/transformers-4\.3\.1\/transformers\.min\.js/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: `export const env = { backends: { onnx: { wasm: {} } } }; export async function pipeline(task, model, o) { o.progress_callback && o.progress_callback({ status: 'progress', file: 'model.onnx', loaded: 40e6, total: 80e6 }); if (task !== 'automatic-speech-recognition' || model !== 'Xenova/whisper-base') throw new Error('wrong model'); return async (audio, opts) => ({ text: ' Ich heiße Sohan (' + (opts.language) + ', ' + Math.round(audio.length / 16000) + ' s).' }); }` }));

  await p.goto(base); await p.waitForTimeout(500);
  // ---- without a key: friendly explanation, nothing sent ----
  await p.goto(base + '#/partner'); await p.waitForTimeout(200);
  log(/API key/.test(await p.textContent('#view')) && reqs.length === 0, 'without a key: explains how to get one, sends nothing');
  // ---- settings: bad key, good key, test connection ----
  await p.goto(base + '#/settings'); await p.waitForTimeout(300);
  await p.fill('[data-k="aiKey"]', 'sk-bad'); await p.dispatchEvent('[data-k="aiKey"]', 'change');
  await p.click('.ai-test'); await p.waitForFunction(() => /✗|✓/.test(document.querySelector('.ai-status').textContent));
  log(/not accepted/.test(await p.textContent('.ai-status')), 'a wrong key gives a clear message: ' + (await p.textContent('.ai-status')));
  await p.fill('[data-k="aiKey"]', 'sk-ant-test'); await p.dispatchEvent('[data-k="aiKey"]', 'change');
  await p.click('.ai-test'); await p.waitForFunction(() => /✓/.test(document.querySelector('.ai-status').textContent));
  log(/Works \(claude-haiku-5-5\)/.test(await p.textContent('.ai-status')), 'test connection works with Claude Haiku 5.5');
  const q0 = reqs[reqs.length - 1];
  log(q0.h['anthropic-dangerous-direct-browser-access'] === 'true' && q0.h['anthropic-version'] === '2023-06-01' && q0.body.model === 'claude-haiku-5-5' && q0.body.output_config.effort === 'low', 'requests use the right headers, model and effort');
  // ---- speaking partner ----
  await p.goto(base + '#/partner'); await p.waitForTimeout(200);
  log(await p.$$eval('.tile', (t) => t.length) >= 12, 'scenario list shown');
  await p.goto(base + '#/partner/intro'); await p.waitForSelector('.pchat .msg.assistant:not(.typing)');
  log(/Nachbarin/.test(await p.textContent('.pchat')), 'partner opens the conversation in German');
  await p.click('.p-help'); log(/Ich heiße Sohan/.test(await p.textContent('.p-suggest')), 'an idea for what to say, shown only when asked');
  await p.fill('.pcomp textarea', 'Ich habe 28 Jahre.'); await p.click('.pcomp .btn.sign');
  await p.waitForFunction(() => document.querySelectorAll('.pchat .msg.assistant:not(.typing)').length >= 2);
  log(/Ich bin 28 Jahre alt/.test(await p.textContent('.pchat .msg.user')), 'real mistake corrected under the learner\'s message');
  const sentProfile = reqs[reqs.length - 1].body.system; log(/Recent mistakes/.test(sentProfile) && /Level: A1/.test(sentProfile), 'the learner profile (level, mistakes) goes with every request');
  // speak with the microphone → offline Whisper (stand-in) → sent to the partner
  await p.evaluate(() => { Store.get().settings.asr = 'whisper'; Store.save(); });
  await p.click('.pcomp .mic'); await p.waitForFunction(() => document.querySelectorAll('.pchat .msg.user').length >= 2, null, { timeout: 15000 }).catch(() => {});
  const said = await p.$$eval('.pchat .msg.user', (m) => m.map((x) => x.textContent).join(' | '));
  log(/Ich heiße Sohan \(german, \d s\)/.test(said), 'microphone → offline Whisper → German text sent: ' + said.split(' | ').pop());
  log(await p.evaluate(() => Store.get().settings.asrReady === true), 'Whisper marked as downloaded after first use');
  await p.click('.p-end'); await p.waitForSelector('.msg.summary', { timeout: 10000 });
  log(/78/.test(await p.textContent('.msg.summary')) && /der Beruf/.test(await p.textContent('.msg.summary')), 'finish: score, mistakes and words to learn');
  await p.waitForTimeout(500);
  log(await p.evaluate(() => (Store.get().aiNotes || []).length === 2), 'the tutor saved notes about the learner (grows with you)');
  log(await p.evaluate(() => Store.get().mistakes.some((m) => /Speaking partner/.test(m.prompt))), 'partner corrections go into "My mistakes"');
  await p.screenshot({ path: OUT + '/partner.png', fullPage: true });
  // ---- AI exercises: Max filters bad items ----
  await p.goto(base + '#/practice/ai'); await p.waitForSelector('.sess-body .q', { timeout: 10000 });
  const total = await p.evaluate(() => +document.querySelector('.sess-count').textContent.split('/')[1]);
  log(total === 5, `exercises: 8 came back, 3 broken ones dropped by Max's check → ${total}`);
  await p.screenshot({ path: OUT + '/aiex.png' });
  // ---- exam: detailed AI feedback under the rule-based one ----
  await p.evaluate(() => { const ls = Store.lesson(1); ls.done = true; Store.save(); });
  await p.goto(base + '#/lesson/2/exam'); await p.waitForTimeout(300);
  const eq = (await p.$$('.eq'))[7];
  await (await eq.$('textarea')).fill('ich lese gern. ich spiele fussball.'); await (await eq.$('.chk')).click();
  await (await eq.$('.ai-fb-btn')).click(); await p.waitForSelector('.ai-fb', { timeout: 10000 });
  const aitxt = await eq.$eval('.ai-fb', (e) => e.innerText);
  log(/Fußball/.test(aitxt) && /72/.test(aitxt), 'exam: Claude feedback with corrections and a score');
  await eq.screenshot({ path: OUT + '/exam-ai.png' });
  // ---- Max online: HTML is cleaned ----
  await p.goto(base + '#/tutor'); await p.waitForTimeout(300);
  await p.fill('.composer textarea', 'Can you tell me something interesting about German culture please'); await p.press('.composer textarea', 'Enter');
  await p.waitForFunction(() => /Answered by Claude|couldn't answer|Dativ/.test(document.querySelector('.chat').textContent), null, { timeout: 10000 }).catch(() => {});
  log(!errs.includes('dialog') && !(await p.$('.chat script')), 'Max online answer shown without running scripts from the reply');
  // ---- whisper failure falls back gracefully ----
  await ctx.unroute(/vendor\/transformers-4\.3\.1\/transformers\.min\.js/); await ctx.route(/vendor\/transformers-4\.3\.1\/transformers\.min\.js/, (r) => r.abort());
  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push(e.message));
  await p2.goto(base + '#/settings'); await p2.waitForTimeout(400);
  await p2.evaluate(async () => { Store.get().settings.asrReady = false; Store.save(); for (const k of await caches.keys()) await caches.delete(k); });
  await p2.reload(); await p2.waitForTimeout(400);
  await p2.click('.asr-dl'); await p2.waitForFunction(() => /✗|✓/.test(document.querySelector('.asr-prog').textContent), null, { timeout: 15000 }).catch(() => {});
  log(/✗/.test(await p2.textContent('.asr-prog')) && /Try the download again/.test(await p2.textContent('.asr-dl')), 'download failure is shown with a retry button: ' + (await p2.textContent('.asr-prog')).slice(0, 80));
  await p2.screenshot({ path: OUT + '/settings.png', fullPage: false });
  console.log('\nrequests sent: ' + reqs.length + ' · ERRORS: ' + (errs.length ? errs.join('\n') : 'none')); console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
