/* 7.4: sync between devices through a private GitHub repo – tested against a fake GitHub API (no network).
   Two browser contexts = two devices: upload on the PC, load on the phone, study on both, merge. */
const { chromium } = require('playwright');
const fs = require('fs'), crypto = require('crypto');
const B = (process.env.BASE || 'http://localhost:8000') + '/index.html', OUT = process.env.OUT || __dirname + '/out';
let pass = 0, fail = 0; const log = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

/* ---- a tiny fake of the GitHub contents API ---- */
const files = {}; let puts = 0, conflicts = 0; const TOKEN = 'github_pat_TEST123';
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');
async function fakeGitHub(route) {
  const req = route.request(), url = new URL(req.url()), auth = req.headers()['authorization'] || '';
  const json = (status, body) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,PUT' } });
  if (auth !== 'Bearer ' + TOKEN) return json(401, { message: 'Bad credentials' });
  const m = /^\/repos\/me\/progress(\/contents\/(.*))?$/.exec(url.pathname);
  if (!m) return json(404, { message: 'Not Found' });
  if (!m[1]) return json(200, { full_name: 'me/progress', private: true });
  const path = decodeURIComponent(m[2]);
  if (req.method() === 'GET') {
    if (path === 'profiles') { const list = Object.keys(files).filter((k) => k.startsWith('profiles/')).map((k) => ({ name: k.slice(9), path: k, sha: sha(files[k]), size: files[k].length })); return list.length ? json(200, list) : json(404, { message: 'Not Found' }); }
    if (!(path in files)) return json(404, { message: 'Not Found' });
    return json(200, { name: path.split('/').pop(), path, sha: sha(files[path]), content: Buffer.from(files[path]).toString('base64'), encoding: 'base64' });
  }
  if (req.method() === 'PUT') {
    const body = JSON.parse(req.postData());
    if ((path in files) && body.sha !== sha(files[path])) { conflicts++; return json(409, { message: 'is at ' + sha(files[path]) + ' but expected ' + body.sha }); }
    files[path] = Buffer.from(body.content, 'base64').toString('utf8'); puts++;
    return json(path in files ? 200 : 201, { content: { path, sha: sha(files[path]) } });
  }
  return json(405, { message: 'no' });
}
const remote = (slug) => JSON.parse(files['profiles/' + slug + '.json']);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const errs = [];
  const device = async (seed, w = 1280) => {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); await ctx.route('https://api.github.com/**', fakeGitHub);
    const p = await ctx.newPage(); p.setDefaultTimeout(8000); p.on('pageerror', (e) => errs.push(e.message)); p.on('dialog', (d) => d.accept());
    await p.addInitScript((seed) => {
      if (window.speechSynthesis) window.speechSynthesis.speak = (u) => setTimeout(() => u.onend && u.onend(), 10);
      if (localStorage.getItem('seeded') || !seed) return; localStorage.setItem('seeded', '1');
      localStorage.setItem('deutschcoach.profiles', JSON.stringify({ active: 'p1', list: [{ id: 'p1', name: 'Kamlesh', color: '#2465B4', created: 1 }] }));
      localStorage.setItem('deutschcoach.v2', JSON.stringify(seed));
    }, seed);
    await p.goto(B); await p.waitForTimeout(700);
    return p;
  };
  const go = async (p, r) => { await p.evaluate((r) => { location.hash = '#/' + r; }, r); await p.waitForTimeout(350); };
  const connect = async (p, token = TOKEN) => { await go(p, 'settings/sync'); await p.fill('.sy-repo', 'me/progress'); await p.fill('.sy-token', token); await p.click('.sy-connect'); await p.waitForTimeout(500); };

  // ---- PC: progress, connect, upload ----
  const pc = await device({ v: 2, xp: 300, updatedAt: Date.now() - 5000, days: { '2026-10-29': 120 }, lessons: { 1: { done: true, read: true, score: 90, parts: { learn: 1 }, tasks: {}, exam: {} } }, srs: { 'v:der tisch': { s: 5, d: 5, last: Date.now() - 864e5, due: Date.now() + 864e5, reps: 2 } }, mistakes: [{ id: 'm1', t: 1, prompt: 'Q1', answer: 'A1' }], settings: { onboarded: true, labels: 'both', aiKey: 'sk-ant-SECRET', theme: 'dark' } });
  await connect(pc, 'wrong-token');
  log(/not accepted/.test(await pc.textContent('.toast').catch(() => '')) || !(await pc.$('.sy-list:not([hidden])')), 'a wrong token is refused with a clear message');
  await connect(pc);
  log(await pc.isVisible('.sy-list') && /Upload “Kamlesh”/.test(await pc.textContent('.sy-list')), 'connected: offers to upload “Kamlesh”');
  await pc.click('.sy-up'); await pc.waitForTimeout(800);
  log(!!files['profiles/kamlesh.json'], 'profile uploaded to profiles/kamlesh.json in the private repo');
  const r1 = remote('kamlesh');
  log(r1.name === 'Kamlesh' && r1.data.xp === 300 && r1.data.lessons[1].done, 'the file holds name, XP and lessons');
  log(!files['profiles/kamlesh.json'].includes('sk-ant-SECRET') && !files['profiles/kamlesh.json'].includes(TOKEN), 'neither the Claude key nor the GitHub token is ever uploaded');
  log(await pc.evaluate(() => !Store.export().includes('github_pat') && !!localStorage.getItem('deutschcoach.sync')), 'the token lives only on this device – not in the backup file');
  await pc.screenshot({ path: OUT + '/sync-settings.png', fullPage: true });

  // ---- phone: fresh browser → “load my profile” ----
  const phone = await device(null, 390);
  const ob = await phone.$('.ob-sync');
  log(!!ob, 'first start on a new device: “I already learn on another device – load my profile”');
  await ob.click(); await phone.waitForTimeout(300);
  await connect(phone);
  log(/kamlesh/.test(await phone.textContent('.sy-remote')), 'the phone lists the profiles on GitHub');
  await phone.click('.sy-get'); await phone.waitForTimeout(900);
  const ph = await phone.evaluate(() => ({ name: Store.name(), xp: Store.get().xp, l1: !!Store.get().lessons[1].done, card: !!Store.get().srs['v:der tisch'], key: Store.get().settings.aiKey, profiles: Store.profiles().length }));
  log(ph.name === 'Kamlesh' && ph.xp === 300 && ph.l1 && ph.card, 'phone: Kamlesh with 300 XP, lesson 1 and the flashcards – continue where you left off');
  log(ph.profiles === 1, 'the empty first-start profile is reused, not left behind as “Unnamed”');
  log(!ph.key, 'the Claude key did not travel to the phone');
  await phone.screenshot({ path: OUT + '/sync-phone.png' });

  // ---- both study, then sync: merge, not overwrite ----
  await phone.evaluate(() => { const s = Store.get(); Store.lesson(2).done = true; Store.lesson(2).score = 80; s.srs['v:die lampe'] = { s: 3, d: 5, last: Date.now(), due: Date.now() + 3 * 864e5, reps: 1 }; Store.addXP(40); Store.mistake({ prompt: 'Phone Q', answer: 'Phone A' }); });
  await phone.evaluate(() => Sync.syncNow('test')); await phone.waitForTimeout(500);
  await pc.evaluate(() => { const s = Store.get(); Store.lesson(3).done = true; s.srs['v:das bett'] = { s: 2, d: 5, last: Date.now(), due: Date.now() + 2 * 864e5, reps: 1 }; Store.addXP(10); });
  await pc.evaluate(() => Sync.syncNow('test')); await pc.waitForTimeout(800);
  const m = await pc.evaluate(() => { const s = Store.get(); return { l: [1, 2, 3].map((n) => !!(s.lessons[n] && s.lessons[n].done)), cards: ['v:der tisch', 'v:die lampe', 'v:das bett'].map((k) => !!s.srs[k]), xp: s.xp, mist: s.mistakes.map((x) => x.answer) }; });
  log(m.l.every(Boolean), 'PC after sync: lessons 1, 2 (from the phone) and 3 (from the PC) are all done');
  log(m.cards.every(Boolean), 'flashcards from both devices are kept');
  log(m.mist.includes('Phone A') && m.mist.includes('A1'), 'mistakes from both devices are kept');
  log(m.xp >= 340, `XP keeps the higher total (${m.xp})`);
  const r2 = remote('kamlesh').data;
  log(r2.lessons[2].done && r2.lessons[3].done && r2.srs['v:das bett'] && r2.srs['v:die lampe'], 'GitHub has the merged progress');
  await phone.evaluate(() => Sync.syncNow('test')); await phone.waitForTimeout(600);
  log(await phone.evaluate(() => !!(Store.get().lessons[3] && Store.get().lessons[3].done)), 'the phone picks up the PC\'s lesson 3 on its next sync');
  // ---- a conflict: the file changed on GitHub between reading and writing ----
  const before = conflicts;
  await pc.route('https://api.github.com/**', async (route) => { if (route.request().method() === 'PUT' && conflicts === before) { const f = remote('kamlesh'); f.data.lessons[4] = { done: true, score: 75, parts: {}, tasks: {}, exam: {} }; f.data.updatedAt = Date.now(); files['profiles/kamlesh.json'] = JSON.stringify(f); } return fakeGitHub(route); });
  await pc.evaluate(() => { Store.lesson(5).done = true; Store.save(); return Sync.syncNow('test'); }); await pc.waitForTimeout(900);
  const r3 = remote('kamlesh').data;
  log(conflicts > before && r3.lessons[4].done && r3.lessons[5].done, 'a change on GitHub while saving → merged again and retried, nothing lost');
  // ---- Home shows the status ----
  await go(pc, 'home'); log(/Synced/.test(await pc.textContent('.sync-line')), 'Home shows “☁ Synced …”');
  // ---- offline: no error, syncs later ----
  await pc.context().setOffline(true); await pc.evaluate(() => { Store.addXP(5); return Sync.syncNow('offline'); }); await pc.waitForTimeout(200);
  log(await pc.evaluate(() => /Offline|Synced/.test(Sync.statusText())), 'offline: studying continues, no sync error');
  await pc.context().setOffline(false); await pc.evaluate(() => Sync.syncNow('online')); await pc.waitForTimeout(600);
  log(remote('kamlesh').data.xp === (await pc.evaluate(() => Store.get().xp)), 'back online: the offline XP reaches GitHub');
  log(!errs.length, 'no page errors: ' + errs.join(' | '));
  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close(); process.exit(fail ? 1 : 0);
})();
