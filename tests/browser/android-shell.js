/* 7.6 – Android app as a shell around the live web app: boot.html hands the old built-in progress over once,
   js/handover.js takes it (never over real progress), offline.html when the first start has no internet. */
const { chromium } = require('playwright'); const fs = require('fs'), os = require('os'), path = require('path');
const BASE = (process.env.BASE || 'http://localhost:8000') + '/';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const ROOT = path.join(__dirname, '..', '..'), TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-shell-'));
['boot.html', 'offline.html'].forEach((f) => fs.writeFileSync(path.join(TMP, f), fs.readFileSync(path.join(ROOT, 'android/www', f), 'utf8').replace(/__APP_URL__/g, BASE)));
const OLD = { xp: 1234, lessons: { 1: { done: true, score: 90, tasks: {} }, 3: { done: true, score: 75, tasks: {} } }, settings: { onboarded: true } };
const PROF = { active: 'p1', list: [{ id: 'p1', name: 'Sohan', color: '#E3A400', created: 1 }] };
(async () => {
  const b = await chromium.launch();
  // bridge stand-in: the handover string lives here (in the app: SharedPreferences), shared by every page
  let ho = '';
  const page = async () => {
    const ctx = await b.newContext(); const p = await ctx.newPage(); p.setDefaultTimeout(8000);
    await ctx.exposeBinding('__hoSet', (_, v) => { ho = v; });
    await ctx.addInitScript((cur) => { window.AndroidBridge = { getHandover: () => window.__ho, setHandover: (v) => { window.__ho = v; window.__hoSet(v); }, shell: () => 1, speak() {}, stop() {} }; window.__ho = cur; }, ho);
    return { ctx, p };
  };
  // 1) the old app's storage (file://) → boot.html hands it over and opens the live app
  let { ctx, p } = await page();
  await p.goto('file://' + path.join(TMP, 'offline.html'));
  log(/No internet/.test(await p.textContent('body')) && /Try again/.test(await p.textContent('button')), 'offline page: "needs the internet once", try again');
  await p.evaluate(([o, pr]) => { localStorage.clear(); localStorage.setItem('deutschcoach.v2', JSON.stringify(o)); localStorage.setItem('deutschcoach.profiles', JSON.stringify(pr)); localStorage.setItem('other', 'x'); }, [OLD, PROF]);
  await p.route(BASE + '**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>live app</p>' }));
  await p.goto('file://' + path.join(TMP, 'boot.html')); await p.waitForURL(BASE + 'index.html'); await p.waitForTimeout(200);
  const h = JSON.parse(ho || '{}');
  log(p.url() === BASE + 'index.html', 'boot page opens the live app: ' + p.url());
  log(h['deutschcoach.v2'] && JSON.parse(h['deutschcoach.v2']).xp === 1234 && h['deutschcoach.profiles'] && !h.other, 'old progress handed over (only the app\'s own keys): ' + Object.keys(h).join(', '));
  await ctx.close();
  // 2) the live app takes it on its first start
  ({ ctx, p } = await page());
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(900);
  const st = await p.evaluate(() => ({ xp: Store.get().xp, done: !!(Store.get().lessons[3] || {}).done, name: Store.name(), flag: window.__handedOver, err: window.__handoverError }));
  log(st.xp === 1234 && st.done && st.name === 'Sohan' && st.flag === true, 'live app imported the old progress: ' + JSON.stringify(st));
  log(ho === 'done', 'app told: hand-over done');
  log(!(await p.$('.onboard, .ob')), 'no first-start screen after the hand-over');
  // 3) next start: nothing happens again (progress made here stays)
  await p.evaluate(() => { Store.get().xp = 2000; Store.save(); });
  await p.reload(); await p.waitForTimeout(700);
  log(await p.evaluate(() => Store.get().xp) === 2000, 'later starts never import again');
  // 4) a second hand-over never overwrites real progress here
  await ctx.close(); ho = JSON.stringify({ 'deutschcoach.v2': JSON.stringify({ xp: 5 }) });
  ({ ctx, p } = await page());
  await p.goto(BASE + 'manifest.webmanifest'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('deutschcoach.v2', JSON.stringify({ xp: 777, settings: { onboarded: true } })); localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'A', created: 1 }] })); });
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(700);
  log(await p.evaluate(() => Store.get().xp) === 777 && ho === 'done', 'real progress on the live app is kept, the old copy is not forced over it');
  // 5) … but an empty first-start profile there does not block it
  await ctx.close(); ho = JSON.stringify({ 'deutschcoach.v2': JSON.stringify(OLD), 'deutschcoach.profiles': JSON.stringify(PROF) });
  ({ ctx, p } = await page());
  await p.goto(BASE + 'manifest.webmanifest'); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('deutschcoach.v2', JSON.stringify({ xp: 0, settings: {} })); });
  await p.goto(BASE + 'index.html'); await p.waitForTimeout(700);
  log(await p.evaluate(() => Store.get().xp) === 1234, 'an empty first-start profile is replaced by the old progress');
  // 6) in the Android app a new version is taken by itself on Home
  log(/AndroidBridge\) offer = /.test(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8')), 'app reloads into a new version by itself when on Home');
  await ctx.close(); await b.close();
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
