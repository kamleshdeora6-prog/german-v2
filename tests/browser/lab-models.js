const { chromium } = require('playwright');
const base = (process.env.EDITIONS || 'http://localhost:8100') + '/german-v2-lab/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--use-webgpu-adapter=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage(); p.setDefaultTimeout(15000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); if (sessionStorage.getItem('seeded')) return; sessionStorage.setItem('seeded', '1'); localStorage.clear(); localStorage.setItem('deutschcoach.lab.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.lab.v2', JSON.stringify({ v: 2, xp: 0, settings: { onboarded: true, labels: 'both', partnerMode: 'ai' } })); });
  await p.goto(base); await p.waitForTimeout(500);
  // ---- model choice ----
  const models = await p.evaluate(() => LLM.MODELS.map((m) => m.key + ':' + m.name));
  log(models.length === 3 && /Gemma 4/.test(models[2]), 'three on-device models offered: ' + models.join(' | '));
  const g4 = await p.evaluate(async () => { Store.get().settings.llmModel = 'g4'; Store.save(); return { id: (await LLM._build(LLM.current())).id, fits: await LLM.fits() }; });
  log(/q4f32/.test(g4.id), 'Gemma 4 on a GPU without f16 → f32 build: ' + g4.id);
  const maxBuf = await p.evaluate(async () => (await navigator.gpu.requestAdapter()).limits.maxStorageBufferBindingSize);
  log(g4.fits === (maxBuf >= 201326592), `buffer check: this GPU allows ${Math.round(maxBuf / 1048576)} MB per buffer, Gemma 4 needs 192 MB → fits=${g4.fits}`);
  await p.goto(base + '#/settings'); await p.waitForTimeout(800);
  if (!g4.fits) log(/too small/.test(await p.textContent('.llm-fit')), 'Settings warns that Gemma 4 is too big for this graphics chip');
  await p.evaluate(() => { Store.get().settings.llmModel = '1b'; Store.save(); });

  // ---- a stand-in engine that streams, so the app's real streaming/cleaning/checking code runs ----
  await p.evaluate(() => {
    window.__reqs = [];
    const replies = { test: ['Hallo Ravi! Schön, dich kennenzulernen. Woher genau kommst du?', 'Gern! Möchtest du auch einen Kuchen?', 'Oh, that is bad. Did you drink water?', 'Toll! Wer hat gewonnen?', 'Die Wohnung kostet 800 Euro. Möchtest du sie sehen?', 'Das finde ich auch. Ich habe kein Zeit für den Weg. Und du?'],
      partner: ['Hallo! Ich bin deine Nachbarin Anna, und ich wohne schon seit vielen Jahren hier im dritten Stock dieses schönen alten Hauses. Wie heißt du?', 'Hallo! Ich bin Anna. Wie heißt du?', 'Schön! Woher kommst du?'] };
    let ti = 0, pi = 0;
    const engine = { chat: { completions: { create: async (req) => {
      window.__reqs.push(req);
      const test = /Niveau A2/.test(req.messages[0].content) && req.messages.length === 2 && /Ravi|Kaffee|Kopfschmerzen|Fußball|Wohnung|Homeoffice/.test(req.messages[1].content) && !/Rolle/.test(req.messages[0].content);
      const text = test ? replies.test[ti++ % 6] : replies.partner[Math.min(pi++, 2)];
      const parts = text.match(/.{1,6}/g);
      return (async function* () { for (const x of parts) { await new Promise((r) => setTimeout(r, 25)); yield { choices: [{ delta: { content: x } }] }; } yield { choices: [], usage: { completion_tokens: Math.round(text.length / 4), extra: { decode_tokens_per_s: 14.2 } } }; })();
    } } } };
    LLM.load = async () => engine; LLM.isLoaded = () => true;
    Store.get().settings.llmReady = { 'Llama-3.2-1B-Instruct-q4f32_1-MLC': 1 }; Store.save();
  });
  // ---- self-test ----
  await p.goto(base + '#/home'); await p.goto(base + '#/settings'); await p.waitForTimeout(500);
  await p.click('.llm-test'); await p.waitForFunction(() => /German \d+\/100|✗/.test(document.querySelector('.llm-tres').textContent), null, { timeout: 30000 });
  const tres = await p.textContent('.llm-tres'); log(/German \d+\/100/.test(tres) && /14 tokens\/s/.test(tres), 'self-test result: ' + tres);
  const rows = await p.$$eval('.llm-trows li', (l) => l.map((x) => x.textContent));
  console.log('      ' + rows.join('\n      ')); log(/not only German/.test(rows[2]) && /Max found/.test(rows[5]), 'English reply and "kein Zeit" are caught by the test');
  log(await p.evaluate(() => window.__reqs.every((r) => r.stream === true && !r.extra_body)), 'requests stream, and never add the Qwen-only "thinking" switch');
  await p.screenshot({ path: OUT + '/selftest.png', fullPage: false });
  // ---- partner: live text, too-long reply for A1 is redone ----
  await p.goto(base + '#/partner/intro'); await p.waitForSelector('.pchat .msg');
  let sawLive = false; for (let i = 0; i < 40 && !sawLive; i++) { sawLive = await p.evaluate(() => !!document.querySelector('.pchat .msg.live')); await p.waitForTimeout(20); }
  log(sawLive, 'the reply appears while the model is still writing it');
  await p.waitForFunction(() => document.querySelector('.pchat .msg.assistant:not(.typing)'));
  const first = (await p.textContent('.pchat .msg.assistant p')).replace(/🔊|EN\?/g, '').trim();
  log(first === 'Hallo! Ich bin Anna. Wie heißt du?', 'a 25-word sentence is too long for A1 → asked again, shorter: ' + first);
  console.log('\nERRORS: ' + (errs.join(' | ') || 'none')); console.log(`${pass} passed, ${fail} failed`);
  await b.close();
})();
