/* Deutsch Coach – runs every browser test (Playwright + Chromium) against a local copy of the app.
   node tests/browser/run-all.js            all tests
   node tests/browser/run-all.js exam-pack  one test
   Starts its own web servers: the app on :8000 and both editions (tools/make_editions.py) on :8100. */
const http = require("http"), fs = require("fs"), path = require("path"), { spawnSync, spawn } = require("child_process");
const ROOT = path.join(__dirname, "..", ".."), DIST = path.join(require("os").tmpdir(), "deutsch-coach-editions");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".wasm": "application/wasm", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".opus": "audio/ogg" };
const serve = (dir, port) => new Promise((ok) => {
  const s = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
    const f = path.join(dir, p); if (!f.startsWith(dir)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end("not found"); } res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); res.end(d); });
  }); s.listen(port, () => ok(s));
});
const ORDER = ["user-journey", "today", "fixes", "sync", "first-steps", "lessons", "drill-guide", "library", "exam-pack", "claude-ai", "claude-ai-robustness", "local-ai", "editions", "lab-models", "offline"];
(async () => {
  fs.mkdirSync(path.join(__dirname, "out"), { recursive: true });
  const py = spawnSync(process.platform === "win32" ? "python" : "python3", [path.join(ROOT, "tools", "make_editions.py"), DIST], { stdio: "inherit" });
  if (py.status) { console.error("make_editions failed"); process.exit(1); }
  const a = await serve(ROOT, 8000), b = await serve(DIST, 8100);
  const only = process.argv.slice(2); const tests = ORDER.filter((t) => !only.length || only.includes(t));
  let bad = 0; const summary = [];
  for (const t of tests) {
    const t0 = Date.now();
    const r = await new Promise((ok) => { const c = spawn(process.execPath, [path.join(__dirname, t + ".js")], { env: Object.assign({}, process.env, { OUT: path.join(__dirname, "out", t) }) }); let o = ""; c.stdout.on("data", (d) => (o += d)); c.stderr.on("data", (d) => (o += d)); c.on("close", (code) => ok({ code, o })); setTimeout(() => c.kill(), 10 * 60e3); });
    fs.mkdirSync(path.join(__dirname, "out", t), { recursive: true });
    fs.writeFileSync(path.join(__dirname, "out", t + ".log"), r.o);
    const fails = r.o.split("\n").filter((l) => /^FAIL\b|^✗|Error:|TimeoutError/.test(l));
    const passes = (r.o.match(/^(PASS|OK)\b/gm) || []).length;
    const ok = r.code === 0 && !fails.length;
    if (!ok) bad++;
    summary.push(`${ok ? "✓" : "✗"} ${t.padEnd(22)} ${String(passes).padStart(3)} checks  ${Math.round((Date.now() - t0) / 1000)} s${ok ? "" : "\n    " + (fails.slice(0, 5).join("\n    ") || "exit code " + r.code)}`);
    console.log(summary[summary.length - 1]);
  }
  a.close(); b.close();
  console.log(bad ? `\n${bad} test file(s) failed – see tests/browser/out/*.log` : `\nAll ${tests.length} browser test files passed.`);
  process.exit(bad ? 1 : 0);
})();
