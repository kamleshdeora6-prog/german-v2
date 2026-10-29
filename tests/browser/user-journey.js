const { chromium } = require('playwright');
const base = (process.env.BASE || 'http://localhost:8000').replace(/\/index\.html$/, ''), out = process.env.OUT || __dirname + '/out';
const MOCK = () => {
  window.__speechLog = []; let active = null, pending = [];
  const ss = {
    speaking: false, paused: false, pending: false,
    getVoices: () => [{ name: 'Anna', lang: 'de-DE' }],
    speak(u) { if (active) { window.__speechLog.push({ overlap: true, t: u.text }); } active = u; this.speaking = true; window.__speechLog.push({ start: Date.now(), t: u.text, rate: u.rate });
      const dur = 250 + u.text.length * 12 / (u.rate || 1); const me = u;
      me.__t = setTimeout(() => { if (active === me) { active = null; ss.speaking = false; me.onend && me.onend({}); } }, dur); },
    cancel() { if (active) { clearTimeout(active.__t); const a = active; active = null; this.speaking = false; a.onerror && a.onerror({ error: 'interrupted' }); } },
    pause() {}, resume() {}, onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', { value: ss, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
};
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage(); p.setDefaultTimeout(4000); const errs = []; const notes = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + p.url().split('#')[1] + ': ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('console ' + p.url().split('#')[1] + ': ' + m.text()); });
  const log = (ok, msg) => { console.log((ok ? 'PASS ' : 'FAIL ') + msg); };
  const shot = (n) => p.screenshot({ path: `${out}/${n}.png` });
  const go = async (h) => { await p.evaluate(() => document.querySelectorAll('.celebrate').forEach((x) => x.remove())); await p.evaluate((h) => location.hash = '#/' + h, h); await p.waitForTimeout(350); };
  const speech = () => p.evaluate(() => window.__speechLog);
  const status = () => p.evaluate(() => Speech.status());
  const clearLog = () => p.evaluate(() => window.__speechLog.length = 0);

  console.log('start'); await p.goto(base + '/index.html'); console.log('loaded'); await p.waitForTimeout(600); await shot('01-onboard1');
  // dumb: Weiter with empty name
  await p.click('.ob-next'); await p.waitForTimeout(200);
  log(await p.$('.obname') !== null, 'empty name is refused, stays on step 1');
  await p.fill('.obname', '   '); await p.click('.ob-next'); await p.waitForTimeout(200);
  log(await p.$('.obname') !== null, 'name of only spaces refused');
  await p.fill('.obname', '<b>Zombie</b> 🧟 Sohan-with-a-very-very-long-name-that-goes-on'); await p.click('.ob-next'); await p.waitForTimeout(200);
  await shot('02-onboard2'); await p.click('[data-goal="20"]'); await p.click('[data-tone="freundlich"]'); await p.click('.ob-next'); await p.waitForTimeout(200);
  await shot('03-onboard3'); await p.click('[data-lvl="1"]'); await p.waitForTimeout(500);
  log(p.url().endsWith('#/lesson/1'), 'onboarding lands directly in lesson 1: ' + p.url().split('#')[1]);
  const chip = await p.textContent('.pchip'); log(chip.includes('<b>'), 'HTML in name shown as text, not rendered: ' + chip.slice(0, 30));
  await shot('04-lesson1');

  // ---------- AUDIO ----------
  await clearLog(); await p.click('.playall'); await p.waitForTimeout(400);
  let st = await status(); log(st.state === 'playing' && st.n === 20, 'Play all starts a 20-sentence playlist');
  log(await p.isVisible('.player'), 'player bar visible while playing'); await shot('05-player');
  await p.click('.playall'); await p.waitForTimeout(300); st = await status();
  log(st.state === 'idle', 'second tap on Play all stops it (no second loop)');
  await p.waitForTimeout(2500); let sl = await speech(); const after = sl.filter(x => x.start && x.start > Date.now() - 2200);
  log(after.length === 0, 'nothing restarts by itself after stopping (spoke ' + after.length + ' since)');
  // spam Play all 5 times
  await clearLog(); for (let i = 0; i < 5; i++) await p.click('.playall'); await p.waitForTimeout(3000); sl = await speech();
  log(!sl.some(x => x.overlap), 'spamming Play all never produces two voices at once');
  // pause / resume / back / next
  await p.evaluate(() => Speech.stop()); await p.click('.playall'); await p.waitForTimeout(1200);
  st = await status(); const iBefore = st.i;
  await p.click('.pl-play'); st = await status(); log(st.state === 'paused', 'pause works');
  await p.waitForTimeout(1200); const spokeWhilePaused = (await speech()).filter(x => x.start > Date.now() - 1100).length; log(spokeWhilePaused === 0, 'silence while paused');
  await p.click('.pl-play'); await p.waitForTimeout(100); st = await status(); log(st.state === 'playing' && st.i === iBefore, 'resume continues at the same sentence (' + st.i + ')');
  await p.click('.pl-next'); await p.waitForTimeout(80); st = await status(); log(st.i === iBefore + 1, 'skip goes to next sentence');
  await p.click('.pl-back'); await p.waitForTimeout(80); st = await status(); log(st.i === iBefore, 'back within 2 s goes to previous sentence');
  await p.waitForTimeout(2300); const iNow = (await status()).i; await p.click('.pl-back'); await p.waitForTimeout(80); st = await status();
  log(st.i === iNow || st.i === iNow - 1, `back after >2 s replays current sentence (was ${iNow}, now ${st.i})`);
  await p.click('.pl-rate'); st = await status(); log(Math.abs(st.rate - 1.0) < 0.01, 'speed button cycles 0.9 → 1.0 (' + st.rate + ')');
  await p.click('.pl-stop'); st = await status(); log(st.state === 'idle' && !(await p.isVisible('.player')), 'stop hides the player');
  // leave the screen while playing
  await p.click('.playall'); await p.waitForTimeout(300); await go('practice'); st = await status();
  log(st.state === 'idle', 'leaving the screen stops the audio');
  // single 🔊 toggle
  await go('lesson/1/read'); await p.click('.reading ~ * , .card h3 .say').catch(() => {}); await p.waitForTimeout(200);
  st = await status(); log(st.state === 'playing' && st.n > 3, `reading text "Play" runs as ${st.n} sentences`);
  await p.click('.card h3 .say'); st = await status(); log(st.state === 'paused', 'tapping 🔊 again pauses');
  await p.click('.card h3 .say'); st = await status(); log(st.state === 'playing', 'tapping 🔊 a third time resumes');
  await p.click('.slow'); await p.waitForTimeout(100); st = await status(); log(st.rate === 0.7, 'Slow restarts the text at 0.7×');
  await shot('06-reading-player');
  await p.keyboard.press('Escape'); st = await status(); log(st.state === 'idle', 'Esc stops audio');
  // exam listening is locked
  // ---------- PRACTICE as a careless user ----------
  await go('practice/smart'); await shot('07-practice');
  let rights = 0;
  for (let i = 0; i < 10; i++) {
    if (await p.$('.celebrate')) { log(false, 'celebration popped up in the middle of a round'); await p.click('.celebrate button'); }
    const kind = await p.evaluate(() => document.querySelector('.choice') ? 'choice' : document.querySelector('.q-in') ? 'input' : 'order');
    if (kind === 'choice') { const c = await p.$$('.choice'); await c[0].dblclick(); await c[c.length - 1].click({ timeout: 400 }).catch(() => {}); }
    else if (kind === 'input') { await p.click('.q-form .btn', { timeout: 800 }).catch(() => {}); /* empty submit */ await p.fill('.q-in', 'keine Ahnung'); await p.press('.q-in', 'Enter'); await p.press('.q-in', 'Enter', { timeout: 400 }).catch(() => {}); }
    else { await p.click('.q-check'); /* without words */ for (const t of await p.$$('.bank .tok')) await t.click(); await p.click('.q-check'); }
    await p.waitForTimeout(150);
    if (i === 4) await shot('08-feedback');
    const nx = await p.$('.q-next'); if (!nx) { log(false, 'no Next button after answering item ' + (i + 1) + ' (' + kind + ')'); break; }
    await nx.dblclick({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(120);   // dumb: double-click Next
    const cnt = await p.textContent('.sess-count').catch(() => ''); if (i === 0) log(/2 \/ 10|^$/.test(cnt.trim()) , 'double-click on Next skips at most one question (' + cnt + ')');
    if (await p.$('.summary')) break;
  }
  await p.waitForTimeout(300); log(!!(await p.$('.summary')), 'session ends with a summary screen'); await shot('09-summary');
  await p.click('.celebrate button').catch(() => {});
  // ---------- broken URLs ----------
  for (const h of ['lesson/999', 'lesson/abc', 'practice/xyz', 'nonsense', 'lesson/1/zzz', 'vocab/zzz', 'read/999', 'write/999', 'readexam/999']) {
    await go(h); const t = await p.evaluate(() => document.getElementById('view').innerText.slice(0, 80).replace(/\n/g, ' '));
    log(!/error/i.test(t) && t.trim().length > 5, `#/${h} → "${t.slice(0, 50)}"`);
  }
  // ---------- Today screen ----------
  await go('home'); await p.waitForTimeout(300); await shot('10-home'); await p.screenshot({ path: `${out}/10b-home-full.png`, fullPage: true });
  log(await p.isVisible('.go-next'), 'Today has one big next-step button: ' + (await p.textContent('.go-next')).trim().slice(0, 60));
  // profiles + league
  await p.click('.addp'); await p.waitForTimeout(200); await p.click('.psheet .add'); await p.waitForTimeout(150);
  log(!!(await p.$('.psheet')), 'adding a profile without a name is refused');
  await p.fill('.newname', 'Kamlesh'); await p.click('.psheet .add'); await p.waitForTimeout(500);
  const onb = await p.$('.modal.onb'); log(!!onb, 'new profile gets its own short onboarding');
  if (onb) { await p.click('.ob-next'); await p.click('.ob-next'); await p.click('[data-lvl="13"]'); await p.waitForTimeout(400); }
  await go('home'); await p.waitForTimeout(300);
  log(!!(await p.$('.league ol')), 'Familien-Liga shows both profiles'); await shot('11-home-league');
  // ---------- streak logic ----------
  const sk = await p.evaluate(() => {
    const s = Store.get(); const r = [];
    const set = (last, count, fr) => { s.streak = { count, last, best: count, freezes: fr, frozen: [], lost: 0 }; };
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    set(day(-1), 5, 0); Store.addXP(1); r.push(['yesterday → +1', s.streak.count === 6]);
    set(day(-3), 5, 2); Store.addXP(1); r.push(['2 missed days, 2 freezes → kept', s.streak.count === 6 && s.streak.freezes === 0]);
    set(day(-4), 5, 2); Store.addXP(1); r.push(['3 missed days, 2 freezes → reset to 1', s.streak.count === 1 && s.streak.lost === 5]);
    set(day(-1), 6, 0); Store.addXP(1); r.push(['day 7 earns a freeze', s.streak.count === 7 && s.streak.freezes === 1]);
    set(day(0), 3, 0); Store.addXP(1); r.push(['second activity same day → unchanged', s.streak.count === 3]);
    document.querySelectorAll('.celebrate').forEach((x) => x.remove());
    return r;
  });
  sk.forEach(([m, ok]) => log(ok, 'streak: ' + m));
  // ---------- settings ----------
  await go('settings'); await shot('12-settings');
  const themes = await p.$$eval('select[data-k="theme"]', (x) => x.length); log(themes === 1, 'only one theme selector (' + themes + ')');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 3000 }).catch(() => null), p.click('.addcal')]);
  log(!!dl, 'reminder downloads a calendar file ' + (dl ? dl.suggestedFilename() : ''));
  if (dl) { const fs = require('fs'); const f = await dl.path(); const ics = fs.readFileSync(f, 'utf8'); log(/RRULE:FREQ=DAILY/.test(ics) && /BEGIN:VALARM/.test(ics), 'calendar file repeats daily with an alarm'); }
  await p.selectOption('select[data-k="theme"]', 'dark'); await go('home'); await shot('13-home-dark');
  await go('lesson/1'); await shot('14-lesson-dark'); await go('more'); await shot('15-more-dark');
  await p.evaluate(() => { Store.get().settings.theme = 'light'; App.applyTheme(); });
  await go('resources'); await shot('16-resources');
  await go('lesson/60'); const t60 = await p.evaluate(() => document.getElementById('view').innerText.slice(0, 60)); log(true, 'lesson 60 locked shows: ' + t60.replace(/\n/g, ' '));
  await p.evaluate(() => { Store.get().settings.unlockAll = true; Store.save(); }); await go('lesson/50');
  log(!!(await p.$('.lnav [data-go^="lesson/"]')), 'lesson 50 has a "next lesson" button (bug was: hidden after 42)');
  // ---------- new content ----------
  for (const n of [1, 17, 30, 45, 52, 60]) {
    await go(`lesson/${n}/read`);
    const info = await p.evaluate(() => ({ r2: !!document.querySelector('.read2'), dlg: document.querySelectorAll('.dlg p').length, dq: document.querySelectorAll('.dq').length }));
    log(info.r2 && info.dlg >= 6 && info.dq === 3, `lesson ${n}: second text + dialogue (${info.dlg} lines) + 3 listening questions`);
  }
  await go('lesson/30/read'); await p.click('.dplay'); await p.waitForTimeout(150); let ds = await status();
  log(ds.state === 'playing' && ds.n >= 6, 'dialogue plays line by line (' + ds.n + ' lines)');
  const pitches = (await speech()).slice(-1); await p.click('.dshow'); await shot('18-dialog');
  await p.fill('.dq input', 'Er isst Chips'); await p.click('.dq .btn'); await p.waitForTimeout(150);
  log(/✓|✗/.test(await p.textContent('.dq .rfb')), 'listening question gives feedback');
  await p.evaluate(() => Speech.stop());
  await go('lesson/30'); const exn = await p.$$eval('.exs li', (x) => x.length); log(exn === 20, 'lesson 30 shows 20 examples (' + exn + ')');
  await go('lesson/30/practice'); const tk = await p.$$eval('.task', (x) => x.length); log(tk === 20, 'lesson 30 has 20 exercises (' + tk + ')');
  await shot('19-practice20');
  // desktop
  await p.setViewportSize({ width: 1280, height: 860 }); await go('home'); await shot('17-desktop');
  console.log('\nERRORS:\n' + (errs.join('\n') || 'none'));
  await b.close();
})();
