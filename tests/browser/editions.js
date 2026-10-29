const { chromium } = require('playwright');
const VERSION = /version: "([^"]+)"/.exec(require('fs').readFileSync(__dirname + '/../../js/app.js', 'utf8'))[1];

const S = (process.env.EDITIONS || 'http://localhost:8100') + '/german-v2/index.html', L = (process.env.EDITIONS || 'http://localhost:8100') + '/german-v2-lab/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-angle=swiftshader', '--use-webgpu-adapter=swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage(); p.setDefaultTimeout(10000);
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
  await ctx.route(/huggingface\.co/, (r) => r.abort());
  await p.addInitScript(() => { window.speechSynthesis && (window.speechSynthesis.speak = () => {}); window.__spoken = []; if (window.speechSynthesis) window.speechSynthesis.speak = (u) => window.__spoken.push(u.text); if (localStorage.getItem('seeded')) return; localStorage.setItem('seeded', '1'); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] })); localStorage.setItem('deutschcoach.v2', JSON.stringify({ v: 2, xp: 777, settings: { onboarded: true, labels: 'both' } })); });
  // ================= STABLE =================
  await p.goto(S); await p.waitForTimeout(500);
  log(await p.evaluate((v) => window.EDITION === 'stable' && App.version === v, VERSION), 'stable edition ' + VERSION);
  log(await p.evaluate(() => LLM.MODELS.map((m) => m.key).join() === '1b,3b'), 'stable: Llama models only (no Gemma)');
  await p.goto(S + '#/partner'); await p.waitForTimeout(300);
  log(!!(await p.$('[data-pm="guided"].on')), 'stable: guided mode is the default');
  log(/works on every device/i.test(await p.textContent('#view')), 'guided mode explained');
  await p.click('[data-go="partner/intro"]'); await p.waitForSelector('.pchat .msg.assistant');
  const l1 = await p.textContent('.pchat .msg.assistant p');
  log(/heiße|Hallo/.test(l1), 'partner opens with the first scripted line: ' + l1.replace(/🔊|EN\?/g, '').trim().slice(0, 60));
  log(await p.evaluate(() => !!document.querySelector('.pchat .msg.assistant details')), 'English for the partner\'s line in a fold-out');
  await p.fill('.pcomp textarea', 'My name is Sohan and I am from India.'); await p.click('.pcomp .btn.sign'); await p.waitForTimeout(200);
  log(/That was English/.test(await p.textContent('.p-suggest')) && !(await p.$('.pchat .msg.user')), 'English answer → asked to try in German, not sent');
  await p.fill('.pcomp textarea', 'Ich habe 28 Jahre.'); await p.click('.pcomp .btn.sign'); await p.waitForFunction(() => document.querySelectorAll('.pchat .msg.assistant').length >= 2);
  log(/Ich bin 28 Jahre alt/.test(await p.textContent('.pchat .msg.user')), 'mistake corrected by Max');
  await p.click('.p-help'); log(/For example/.test(await p.textContent('.p-suggest')), 'example answer on request');
  let n = 0;
  while (!(await p.$('.msg.summary')) && n < 10) { const c = await p.$$eval('.pchat .msg.assistant', (x) => x.length); await p.fill('.pcomp textarea', 'Ich wohne seit zwei Jahren in Berlin.'); await p.click('.pcomp .btn.sign'); await p.waitForFunction((c) => document.querySelectorAll('.pchat .msg.assistant').length > c, c).catch(() => {}); n++; }
  { const reached = await p.evaluate(() => (Store.get().days[Store.today()] || 0) >= (Store.get().settings.goal || 50));
    const cel = await p.waitForSelector('.celebrate, .toast', { timeout: 3000 }).then(() => true).catch(() => false);
    log(!reached || cel, reached ? 'daily goal reached → celebration after the talk' : 'daily goal not reached yet – no celebration needed'); }
  await p.evaluate(() => document.querySelectorAll('.celebrate').forEach((x) => x.remove()));
  const sum = await p.textContent('.msg.summary'); log(/Well done/.test(sum) && /Max found 1 sentence/.test(sum) && /1 example answer/.test(sum), 'summary at the end: ' + sum.replace(/\s+/g, ' ').slice(0, 120));
  log(await p.evaluate(() => Habit.count('partner') >= 6 && Habit.count('speak') >= 6), 'counts as speaking practice for the day');
  log(await p.evaluate(() => window.__spoken.length >= 6), 'partner lines spoken aloud (' + await p.evaluate(() => window.__spoken.length) + ')');
  await p.screenshot({ path: OUT + '/guided.png', fullPage: true });
  await p.goto(S + '#/partner/lesson'); await p.waitForSelector('.pchat .msg.assistant');
  log(/Today's lesson|Lektion|lesson/i.test(await p.textContent('.page-title')) && (await p.textContent('.pchat .msg.assistant p')).length > 8, 'lesson scenario: built from the current lesson: ' + (await p.textContent('.pchat .msg.assistant p')).replace(/🔊|EN\?/g, '').trim().slice(0, 60));
  // AI mode chosen but no model → guided with a note
  await p.goto(S + '#/partner'); await p.click('[data-pm="ai"]'); await p.waitForTimeout(300);
  log(!!(await p.$('[data-pm="guided"].on')) && /isn't ready/.test(await p.textContent('#view')), 'AI mode without a model → guided, with the reason');
  // AI mode with a model that fails at load → offer guided
  await p.evaluate(() => { Store.get().settings.llmReady = { 'Llama-3.2-1B-Instruct-q4f32_1-MLC': 1 }; Store.save(); LLM.isLoaded = () => false; LLM.load = async () => { throw new Error('Your graphics chip couldn\'t start the on-device AI (WebGPU).'); }; });
  await p.evaluate(() => App.go('partner/cafe')); await p.waitForSelector('[data-go="partner/cafe/guided"]', { timeout: 8000 }).catch(() => {});
  log(!!(await p.$('[data-go="partner/cafe/guided"]')), 'AI fails to start → "Talk in guided mode" button');
  await p.evaluate(() => document.querySelectorAll('.celebrate').forEach((x) => x.remove()));
  await p.click('[data-go="partner/cafe/guided"]'); await p.waitForSelector('.pchat .msg.assistant');
  log(/guided/.test(await p.textContent('.page-title')), 'guided café conversation runs');
  // AI fails mid-talk twice → auto switch
  await p.evaluate(() => { LLM.isLoaded = () => true; LLM.load = async () => ({}); LLM.chat = async () => { throw new Error('Device lost'); }; });
  await p.evaluate(() => App.go('partner/shop')); await p.waitForSelector('.p-retry', { timeout: 8000 }).catch(() => {});
  await p.click('.p-retry').catch(() => {}); await p.waitForFunction(() => /guided/.test(document.querySelector('.page-title').textContent), null, { timeout: 8000 }).catch(() => {});
  log(/guided/.test(await p.textContent('.page-title')), 'AI fails twice in a talk → switches to guided automatically');
  // Settings
  await p.goto(S + '#/settings'); await p.waitForTimeout(300);
  log(!!(await p.$('[data-k="partnerMode"]')) && !(await p.$('.labset')), 'Settings: partner mode; no lab panel in stable');
  // ================= LAB =================
  const q = await ctx.newPage(); q.on('pageerror', (e) => errs.push('LAB ' + e.message)); q.on('dialog', (d) => d.accept()); q.setDefaultTimeout(10000);
  await q.goto(L); await q.waitForTimeout(500);
  log(await q.evaluate(() => window.EDITION === 'lab' && /lab$/.test(App.version)), 'lab edition ' + await q.evaluate(() => App.version));
  log(await q.evaluate(() => Store.get().xp === 0 && JSON.parse(localStorage.getItem('deutschcoach.v2')).xp >= 777), 'lab has its own progress (stable XP not used)');
  log(await q.evaluate(() => LLM.MODELS.some((m) => m.key === 'g4')), 'lab: Gemma 4 offered');
  log(!!(await q.$('.labbadge')) && /LAB/.test(await q.title()), 'LAB badge and title');
  log(!!(await q.$('.modal.onb .ob-import')), 'lab first start: offers to copy progress from the daily app');
  await q.click('.ob-import'); await q.waitForTimeout(400);
  log(await q.evaluate(() => Store.get().xp >= 777 && !Store.get().settings.aiKey && Store.name() === 'Sohan' && !document.querySelector('.modal.onb')), 'lab: progress and name copied, onboarding skipped');
  await q.goto(L + '#/settings'); await q.waitForSelector('.labset');
  log(!!(await q.$('.lab-import')), 'Settings: lab panel with import button');
  await q.evaluate(() => { const s = Store.get(); s.xp = 5; Store.save(); });
  await q.waitForTimeout(300);
  log(await p.evaluate(() => JSON.parse(localStorage.getItem('deutschcoach.v2')).xp >= 777), 'stable progress untouched by the lab');
  await q.evaluate(() => { Store.get().settings.llmReady = { 'Llama-3.2-1B-Instruct-q4f32_1-MLC': 1 }; Store.save(); LLM.isLoaded = () => true; LLM.load = async () => ({}); let i = 0; LLM.chat = async () => { LLM.lastStats = { secs: 1.2, tokens: 20, tps: 15 }; i++; return i % 4 ? 'Das ist schön! Was machst du gern?' : 'That is nice. What do you do?'; }; });
  await q.goto(L + '#/settings'); await q.waitForSelector('.lab-test');
  await q.click('.lab-test'); await q.waitForFunction(() => /A1 \d+/.test(document.querySelector('.lab-tres').textContent), null, { timeout: 20000 }).catch(() => {});
  log(/A1 \d+ · A2 \d+ · B1 \d+/.test(await q.textContent('.lab-tres')), 'long test A1/A2/B1: ' + await q.textContent('.lab-tres'));
  await q.click('.lab-diag'); await q.waitForFunction(() => /--- speech ---/.test(document.querySelector('.lab-out').value), null, { timeout: 15000 }).catch(() => {});
  const rep = await q.inputValue('.lab-out');
  log(/gpu: \{/.test(rep) && /\[B1\]/.test(rep) && /NOT ONLY GERMAN/.test(rep) && /--- errors ---/.test(rep), 'diagnostics report: GPU, every test reply, errors (' + rep.split('\n').length + ' lines)');
  require('fs').writeFileSync(OUT + '/lab-report.txt', rep);
  await q.goto(L + '#/partner'); await q.waitForTimeout(300);
  log(!!(await q.$('[data-pm="ai"].on')), 'lab: free talk with AI is the default when the model is ready');
  await q.screenshot({ path: OUT + '/lab-partner.png' });
  // ================= service workers on one origin =================
  await p.goto(S); await p.waitForFunction(() => navigator.serviceWorker.controller || navigator.serviceWorker.ready, null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(2500); await q.goto(L); await q.waitForTimeout(2500); await p.reload(); await p.waitForTimeout(2000);
  const keys = await p.evaluate(() => caches.keys());
  log(keys.includes('deutsch-coach-v' + VERSION) && keys.includes('deutsch-coach-lab-v' + VERSION), 'both editions keep their caches side by side: ' + keys.join(', '));
  log(!errs.length, 'no page errors' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  console.log(`\n${pass} passed, ${fail} failed`); await b.close(); process.exit(fail ? 1 : 0);
})();
