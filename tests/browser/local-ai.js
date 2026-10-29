const { chromium } = require('playwright');
const base = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--use-webgpu-adapter=swiftshader', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${__dirname}/fixtures/speech.wav`] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });
  const p = await ctx.newPage(); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  const net = []; ctx.on('request', (r) => net.push(r.url()));
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', partnerMode: 'ai' } })); });
  await ctx.route(/huggingface\.co/, (r) => r.abort());   // like a device that can't reach the model host
  await p.goto(base); await p.waitForTimeout(500);
  log(await p.evaluate(() => Store.get().settings.aiProvider === 'local'), 'default: AI runs on this device (no key, no account)');
  log(await p.evaluate(() => LLM.supported()), 'WebGPU detected');
  const bld = await p.evaluate(async () => (await LLM._build(LLM.current())).id);
  log(/q4f32/.test(bld), 'GPU without shader-f16 → the f32 build is chosen automatically: ' + bld);
  // real WebLLM, model host unreachable → clear message, no crash
  await p.goto(base + '#/settings'); await p.waitForTimeout(400);
  log(/Hugging Face|own site/.test(await p.textContent('.llm-src')), 'Settings says where the model comes from: ' + await p.textContent('.llm-src'));
  await p.click('.llm-dl'); await p.waitForFunction(() => /✗|✓/.test(document.querySelector('.llm-prog').textContent), null, { timeout: 60000 }).catch(() => {});
  const msg = await p.textContent('.llm-prog'); log(/✗/.test(msg) && /Try again/.test(await p.textContent('.llm-dl')), 'download blocked → shown with a retry: ' + msg.slice(0, 110));
  log(net.some((u) => /vendor\/web-llm-0\.2\.86\/index\.js/.test(u)) && !net.some((u) => /cdn\.jsdelivr|esm\.run|unpkg/.test(u)), 'the AI library is loaded from the repo, not from a CDN');
  // self-hosted: models/manifest.json listing the model → the app asks its own site
  await ctx.route('**/models/manifest.json', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ llm: ['Llama-3.2-1B-Instruct-q4f32_1-MLC'], whisper: ['Xenova/whisper-base'] }) }));
  const p2 = await ctx.newPage(); p2.on('pageerror', (e) => errs.push(e.message)); await p2.goto(base + '#/settings'); await p2.waitForTimeout(600);
  log(/own site/.test(await p2.textContent('.llm-src')), 'with the models in the repo, Settings says: ' + await p2.textContent('.llm-src'));
  await p2.click('.llm-dl'); await p2.waitForTimeout(4000);
  log(net.some((u) => /\/models\/Llama-3\.2-1B-Instruct-q4f32_1-MLC\/resolve\/main\//.test(u)), 'and the engine requests the model files from the app\'s own models/ folder');
  await p2.close();

  // ---- the conversation flow with the model's replies simulated ----
  await p.evaluate(() => {
    const st = Store.get().settings; st.llmReady = { 'Llama-3.2-1B-Instruct-q4f32_1-MLC': 1 }; Store.save();
    let n = 0; window.__llmSeen = [];
    LLM.isLoaded = () => true; LLM.load = async () => ({});
    LLM.chat = async ({ system, messages }) => { window.__llmSeen.push({ system, messages }); n++; if (/Max, a German tutor/.test(system)) return 'The **Dativ** answers Wem? Example: Ich helfe dem Mann.'; return n === 2 ? 'Partner: "Ich heisse Anna (freundlich). Und wie heißt du?"' : n === 3 ? 'You are nice. What is your job?' : 'Schön! Was machst du am Wochenende?'; };
  });
  await p.goto(base + '#/partner'); await p.waitForTimeout(300);
  log(/on this device/.test(await p.textContent('#view')), 'partner page says it runs on this device');
  await p.goto(base + '#/partner/intro'); await p.waitForFunction(() => document.querySelector('.pchat .msg.assistant:not(.typing)'));
  await p.evaluate(() => { let k = 0; const orig = LLM.chat; LLM.chat = async (o) => (k++ === 0 ? 'Partner: "Ich heiße Anna (freundlich) . Und wie heißt du?"' : orig(o)); });
  await p.goto(base + '#/partner/cafe'); await p.waitForFunction(() => document.querySelector('.pchat .msg.assistant:not(.typing)'));
  const first = (await p.textContent('.pchat .msg.assistant p')).replace(/🔊|EN\?/g, '').trim();
  log(first === 'Ich heiße Anna. Und wie heißt du?', 'model output is cleaned (no "Partner:", quotes or stage directions): ' + first);
  await p.goto(base + '#/partner/intro'); await p.waitForFunction(() => document.querySelector('.pchat .msg.assistant:not(.typing)'));
  log(!!(await p.$('.pchat .msg.assistant .hintbtn')), 'EN? word-by-word help under each reply (no translation needed from the model)');
  await p.fill('.pcomp textarea', 'Ich habe 28 Jahre.'); await p.click('.pcomp .btn.sign'); await p.waitForFunction(() => document.querySelectorAll('.pchat .msg.assistant:not(.typing)').length >= 2);
  log(/Ich bin 28 Jahre alt/.test(await p.textContent('.pchat .msg.user')), 'learner corrected by Max (rules), not by the small model');
  const sec = await p.$$eval('.pchat .msg.assistant', (m) => m[1].textContent);
  log(!/You are nice/.test(sec), 'an English reply from the model is retried: ' + sec.trim().slice(0, 50));
  await p.click('.p-help'); log(/Ich bin … von Beruf|Ich heiße|In meiner Freizeit/.test(await p.textContent('.p-suggest')), 'ideas come from the scenario\'s phrase list');
  await p.fill('.pcomp textarea', 'Am Wochenende spiele ich Fußball mit meinen Freunden.'); await p.click('.pcomp .btn.sign'); await p.waitForFunction(() => document.querySelectorAll('.pchat .msg.assistant:not(.typing)').length >= 3);
  await p.click('.p-end'); await p.waitForSelector('.msg.summary');
  const sum = await p.textContent('.msg.summary'); log(/Max found 1 sentence/.test(sum) && /Ich bin 28 Jahre alt/.test(sum), 'summary built from Max\'s checks: ' + sum.replace(/\s+/g, ' ').slice(0, 90));
  const sys = await p.evaluate(() => window.__llmSeen[1].system); log(/NUR auf Deutsch/.test(sys) && /Niveau A1/.test(sys), 'prompt keeps the model in German at the learner\'s level');
  await p.screenshot({ path: OUT + '/local-partner.png', fullPage: true });
  // ---- what stays with Claude ----
  await p.goto(base + '#/practice/ai'); await p.waitForTimeout(300);
  log(/answer keys/.test(await p.textContent('#view')) && !!(await p.$('[data-go="practice/mistakes"]')), 'AI exercises: explained, offline alternatives offered');
  await p.evaluate(() => { const ls = Store.lesson(1); ls.done = true; Store.save(); });
  await p.goto(base + '#/lesson/2/exam'); await p.waitForTimeout(300);
  const eq = (await p.$$('.eq'))[7]; await (await eq.$('textarea')).fill('Ich lese gern Bücher.'); await (await eq.$('.chk')).click();
  log(!(await eq.$('.ai-fb-btn')) && !!(await eq.$('.fb-score')), 'exam: rule-based feedback, no Claude button in on-device mode');
  // ---- Max with the local model ----
  await p.goto(base + '#/tutor'); await p.waitForTimeout(300);
  await p.fill('.composer textarea', 'Can you tell me something interesting about German culture please'); await p.press('.composer textarea', 'Enter');
  await p.waitForFunction(() => /on this device|Dativ/.test(document.querySelector('.chat').textContent), null, { timeout: 8000 }).catch(() => {});
  log(/can be wrong/.test(await p.textContent('.chat')), 'Max\'s local answers are labelled "can be wrong"');
  // ---- Whisper from the repo ----
  log(await p.evaluate(async () => { const r = await fetch('vendor/ort-1.31.0/ort-wasm-simd-threaded.asyncify.wasm', { method: 'HEAD' }); return r.ok; }), 'speech runtime (27 MB) is served from the repo');
  console.log('\nERRORS: ' + (errs.join(' | ') || 'none')); console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
