const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
 await p.goto((process.env.BASE || 'http://localhost:8000') + '/index.html'); await p.waitForTimeout(2500);
 const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return !!(r && r.active); });
 const keys = await p.evaluate(async () => (await caches.keys()).join(','));
 await ctx.setOffline(true); await p.reload(); await p.waitForTimeout(1500);
 const ok = await p.evaluate(() => !!document.querySelector('.nav') && typeof Habit === 'object' && Array.isArray(DC.starter) && typeof Views.partner === 'function' && typeof AI === 'object' && typeof ASR === 'object');
 console.log('sw active:', sw, '| cache:', keys, '| works offline:', ok); await b.close(); })();
