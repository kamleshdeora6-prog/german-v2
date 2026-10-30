/* Deutsch Coach – sync profiles between devices through a private GitHub repo (7.4).
   Each learner's progress is one file, profiles/<name>.json, in a separate private repo (never the app's repo).
   The access token is typed in once per device and stays on that device (localStorage) – it is never part of
   the code, a backup file or the synced progress. The Claude API key is never uploaded either.
   Progress is saved on the device first (offline works) and synced: on start, when you come back to the app,
   a few seconds after you study, when you leave the app and when the connection returns.
   Two devices with changes are merged, not overwritten: words, mistakes and lessons from both are kept,
   XP / minutes / days take the higher value. */
(function () {
  "use strict";
  const LAB = window.EDITION === "lab";
  const SKEY = LAB ? "deutschcoach.lab.sync" : "deutschcoach.sync";
  const LOCAL_SETTINGS = ["aiKey", "voice", "rate", "theme", "textSize", "asr", "llmModel", "llmReady", "llmTest", "aiProvider", "natural", "sound", "haptics", "partnerMode"];
  const esc = (x) => H.esc(x);
  let status = { state: "off", at: 0, msg: "" };
  let pushT = null, busy = null;

  /* ---------- settings on this device ---------- */
  const cfg = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null") || {}; } catch (e) { return {}; } };
  const setCfg = (c) => { try { localStorage.setItem(SKEY, JSON.stringify(c)); } catch (e) {} };
  const on = () => { const c = cfg(); return !!(c.repo && c.token); };
  const slugOf = (name) => String(name || "learner").trim().toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "learner";

  /* ---------- GitHub contents API ---------- */
  const b64e = (str) => { const bytes = new TextEncoder().encode(str); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); };
  const b64d = (b64) => { const bin = atob(String(b64).replace(/\s+/g, "")); const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i); return new TextDecoder().decode(bytes); };
  async function api(path, opts = {}) {
    const c = cfg();
    const repo = String(c.repo || "").trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
    const r = await fetch(`https://api.github.com/repos/${repo}${path}`, Object.assign({ cache: "no-store" }, opts, {
      headers: Object.assign({ Accept: "application/vnd.github+json", Authorization: `Bearer ${String(c.token || "").trim()}`, "X-GitHub-Api-Version": "2022-11-28" }, opts.body ? { "Content-Type": "application/json" } : {}),
    }));
    if (r.status === 404 && opts.allow404) return null;
    if (!r.ok) {
      let m = ""; try { m = (await r.json()).message || ""; } catch (e) {}
      const e = new Error(r.status === 401 ? "The token was not accepted – check that it is copied completely and not expired." : r.status === 403 ? "The token may not write to this repo – it needs “Contents: Read and write”." : r.status === 404 ? "Repo not found – check “owner/repo” and that the token has access to it." : `GitHub: ${r.status} ${m}`);
      e.status = r.status; throw e;
    }
    return r.status === 204 ? null : r.json();
  }
  const fileOf = (slug) => `/contents/profiles/${encodeURIComponent(slug)}.json`;
  async function getRemote(slug) {
    const j = await api(fileOf(slug), { allow404: true });
    if (!j) return null;
    let content = j.content;
    if (!content && j.git_url) { const b = await api(`/git/blobs/${j.sha}`); content = b.content; }   // files over 1 MB come without content
    return { sha: j.sha, file: JSON.parse(b64d(content)) };
  }
  async function putRemote(slug, file, sha) {
    const body = { message: `${file.name || slug}: progress ${new Date().toISOString().slice(0, 16).replace("T", " ")}`, content: b64e(JSON.stringify(file)) };
    if (sha) body.sha = sha;
    const j = await api(fileOf(slug), { method: "PUT", body: JSON.stringify(body) });
    return j && j.content ? j.content.sha : null;
  }
  async function listRemote() {
    const j = await api("/contents/profiles", { allow404: true });
    return (j || []).filter((x) => /\.json$/.test(x.name)).map((x) => ({ slug: x.name.replace(/\.json$/, ""), sha: x.sha, size: x.size }));
  }

  /* ---------- merging two copies of one learner's progress ---------- */
  const t = (x) => (x && (x.updatedAt || x.created)) || 0;
  const maxMap = (a = {}, b = {}) => { const o = Object.assign({}, a); Object.entries(b || {}).forEach(([k, v]) => { o[k] = typeof v === "number" ? Math.max(o[k] || 0, v) : o[k] === undefined ? v : o[k]; }); return o; };
  const mKey = (m) => m.id || `${String(m.prompt || "").slice(0, 160)}|${m.answer}`;
  const mTime = (m) => Math.max(m.t || 0, m.seenAt || 0, m.fixed || 0);
  function merge(local, remote) {
    if (!remote) return local; if (!local) return remote;
    const newer = t(remote) > t(local) ? remote : local, older = newer === remote ? local : remote;
    const out = JSON.parse(JSON.stringify(newer));
    out.xp = Math.max(local.xp || 0, remote.xp || 0);
    out.days = maxMap(local.days, remote.days);
    // minutes of work per day
    out.work = Object.assign({}, local.work);
    Object.entries(remote.work || {}).forEach(([d, w]) => { const a = out.work[d]; out.work[d] = !a ? w : { m: Math.max(a.m || 0, w.m || 0), t: Math.max(a.t || 0, w.t || 0), k: maxMap(a.k, w.k), celebrated: a.celebrated || w.celebrated }; });
    if (local.workStart || remote.workStart) out.workStart = [local.workStart, remote.workStart].filter(Boolean).sort()[0];
    // flashcards: the copy reviewed last wins, per card
    out.srs = Object.assign({}, older.srs);
    Object.entries(newer.srs || {}).forEach(([id, c]) => { const o = out.srs[id]; out.srs[id] = !o ? c : ((c.last || 0) > (o.last || 0) || ((c.last || 0) === (o.last || 0) && (c.reps || c.seen || 0) >= (o.reps || o.seen || 0))) ? c : o; });
    out.scards = Object.assign({}, older.scards, newer.scards);
    // lessons: what is done on either device is done
    out.lessons = {};
    new Set(Object.keys(local.lessons || {}).concat(Object.keys(remote.lessons || {}))).forEach((n) => {
      const a = (local.lessons || {})[n] || {}, b = (remote.lessons || {})[n] || {}, nw = newer === local ? a : b, ol = nw === a ? b : a;
      const l = Object.assign({}, ol, nw);
      l.done = !!(a.done || b.done); l.read = !!(a.read || b.read); l.spoke = !!(a.spoke || b.spoke); l.score = Math.max(a.score || 0, b.score || 0);
      l.parts = Object.assign({}, b.parts, a.parts); Object.keys(l.parts).forEach((k) => (l.parts[k] = Math.min(...[a.parts && a.parts[k], b.parts && b.parts[k]].filter(Boolean))));
      ["tasks", "exam"].forEach((k) => { l[k] = Object.assign({}, ol[k], nw[k]); Object.keys(l[k]).forEach((i) => { if ((a[k] || {})[i] === true || (b[k] || {})[i] === true) l[k][i] = true; }); });
      l.examScore = maxMap(a.examScore, b.examScore);
      out.lessons[n] = l;
    });
    // grammar topics: the copy with more answers
    out.topics = Object.assign({}, older.topics);
    Object.entries(newer.topics || {}).forEach(([id, x]) => { const o = out.topics[id]; out.topics[id] = !o || (x.r || 0) + (x.w || 0) >= (o.r || 0) + (o.w || 0) ? x : o; });
    // mistakes: all of them, the latest state of each
    const ms = new Map();
    (older.mistakes || []).concat(newer.mistakes || []).forEach((m) => { const k = mKey(m), o = ms.get(k); if (!o || mTime(m) >= mTime(o)) ms.set(k, m); });
    out.mistakes = [...ms.values()].sort((a, b) => (b.t || 0) - (a.t || 0)).slice(0, 300);
    // streak: the device that learned last knows the streak
    const sa = local.streak || {}, sb = remote.streak || {};
    out.streak = Object.assign({}, (sb.last || "") > (sa.last || "") ? sb : sa); out.streak.best = Math.max(sa.best || 0, sb.best || 0, out.streak.count || 0);
    // exam results and parts
    const byAt = (x, y) => { const m = new Map(); (x || []).concat(y || []).forEach((r) => m.set(String(r.at || JSON.stringify(r)), r)); return [...m.values()]; };
    out.telc = byAt(local.telc, remote.telc); out.exams = byAt(local.exams, remote.exams); out.whist = byAt(local.whist, remote.whist);
    out.telcParts = Object.assign({}, older.telcParts); Object.entries(newer.telcParts || {}).forEach(([k, v]) => { const o = out.telcParts[k]; out.telcParts[k] = !o || (v.at || 0) >= (o.at || 0) ? v : o; });
    out.tlog = {}; new Set(Object.keys(local.tlog || {}).concat(Object.keys(remote.tlog || {}))).forEach((d) => { const a = (local.tlog || {})[d] || {}, b = (remote.tlog || {})[d] || {}; const o = {}; new Set(Object.keys(a).concat(Object.keys(b))).forEach((k) => { const x = a[k] || [0, 0], y = b[k] || [0, 0]; o[k] = x[1] >= y[1] ? x : y; }); out.tlog[d] = o; });
    // today: same day → keep the steps done on either device
    const ta = local.todaySession, tb = remote.todaySession;
    if (ta && tb && ta.date === tb.date) { const pick = ta.steps.filter((x) => x.done).length >= tb.steps.filter((x) => x.done).length ? ta : tb; out.todaySession = JSON.parse(JSON.stringify(pick)); }
    const wa = local.wotd, wb = remote.wotd;
    if (wa && wb && wa.date === wb.date) out.wotd = Object.assign({}, wa, { learned: [...new Set((wa.learned || []).concat(wb.learned || []))] });
    // settings: the newer copy, but things that belong to this device stay as they are here
    out.settings = Object.assign({}, newer.settings);
    LOCAL_SETTINGS.forEach((k) => { if (local.settings && k in local.settings) out.settings[k] = local.settings[k]; });
    out.updatedAt = Math.max(t(local), t(remote));
    return out;
  }
  const forUpload = (d) => { const x = JSON.parse(JSON.stringify(d)); if (x.settings) x.settings.aiKey = ""; delete x.resume; return x; };
  const same = (a, b) => JSON.stringify(forUpload(a)) === JSON.stringify(forUpload(b));

  /* ---------- syncing the active profile ---------- */
  const linked = () => (Store.profile() || {}).sync;
  function setStatus(state, msg = "") { status = { state, at: Date.now(), msg }; paint(); }
  async function syncNow(reason = "") {
    if (!on() || !linked() || navigator.onLine === false) return;
    if (busy) return busy;
    busy = (async () => {
      const slug = linked(); setStatus("busy");
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const r = await getRemote(slug);
          const local = Store.raw();
          const merged = r ? merge(local, r.file.data) : local;
          if (r && !same(merged, local)) { Store._quiet = true; Store.replace(merged); Store._quiet = false; if (window.App && App.dropCache) { App.dropCache(); if (!document.querySelector("#view input:focus, #view textarea:focus")) App.route(); } }
          if (r && same(merged, r.file.data)) { setStatus("ok"); return; }
          const p = Store.profile() || {};
          try { await putRemote(slug, { app: "deutsch-coach", v: 1, name: p.name || slug, color: p.color, updatedAt: merged.updatedAt || Date.now(), data: forUpload(merged) }, r && r.sha); setStatus("ok"); return; }
          catch (e) { if (e.status !== 409 && e.status !== 422) throw e; }   // changed on another device in the meantime: merge again
        }
        setStatus("error", "Another device kept changing it – try again.");
      } catch (e) { setStatus("error", e.message); if (window.ErrLog && e.status !== 401) ErrLog.add(e, { where: "sync " + reason }); }
      finally { busy = null; }
    })();
    return busy;
  }
  const schedule = (ms = 8000) => { if (!on() || !linked() || Store._quiet) return; clearTimeout(pushT); pushT = setTimeout(() => syncNow("change"), ms); };

  /* link the active profile to a file on GitHub (upload it, or merge with what is there) */
  async function link(slug) {
    Store.setProfile({ sync: slug }); return syncNow("link");
  }
  /* bring a profile from GitHub onto this device */
  async function download(slug) {
    const r = await getRemote(slug); if (!r) throw new Error("That profile is not on GitHub any more.");
    const have = Store.profiles().find((p) => p.sync === slug);
    if (have) { Store.switchTo(have.id); return syncNow("open"); }
    Store.addProfileWith({ name: r.file.name || slug, color: r.file.color, sync: slug }, Object.assign({}, r.file.data, { settings: Object.assign({}, r.file.data.settings, LOCAL_KEEP()) }));
    setStatus("ok");
  }
  const LOCAL_KEEP = () => { const s = Store.get().settings || {}; const o = {}; LOCAL_SETTINGS.forEach((k) => { if (k in s) o[k] = s[k]; }); return o; };

  /* ---------- small status line (Home, Settings) ---------- */
  const ago = (ms) => { const s = Math.round((Date.now() - ms) / 1000); return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : `${Math.round(s / 3600)} h ago`; };
  function statusText() {
    if (!on()) return "Sync is off – progress stays on this device.";
    if (!linked()) return "Connected to GitHub – this profile isn't synced yet.";
    if (status.state === "busy") return "☁ Syncing …";
    if (status.state === "error") return "⚠ Sync problem: " + status.msg;
    if (navigator.onLine === false) return "☁ Offline – will sync when you're back online.";
    return status.at ? `☁ Synced ${ago(status.at)}` : "☁ Synced with GitHub";
  }
  function paint() { document.querySelectorAll("[data-sync]").forEach((el) => { el.textContent = statusText(); el.classList.toggle("bad", status.state === "error"); }); }

  /* ---------- Settings → Sync page ---------- */
  async function page(el) {
    const c = cfg();
    el.innerHTML = `<button class="back" data-go="settings">‹ Settings</button><h2 class="page-title">${H.bi("Synchronisieren", "Sync between devices")}</h2>
      <section class="card"><p>Learn on the PC, continue on the phone. Your progress is saved in <b>your own private GitHub repo</b> – one file per learner – and every device that knows the token can load and update it.</p>
        <p class="muted small" data-sync>${esc(statusText())}</p></section>
      <section class="card form"><h3>1. Connect this device</h3>
        <label>Progress repo <input class="sy-repo" placeholder="your-name/german-progress" value="${esc(c.repo || "")}" autocapitalize="off" spellcheck="false"></label>
        <label>Access token <input class="sy-token" type="password" placeholder="github_pat_…" value="${esc(c.token || "")}" autocomplete="off" spellcheck="false"></label>
        <div class="row"><button class="btn sign sy-connect">${on() ? "Save & check" : "Connect"}</button>${on() ? `<button class="btn ghost sy-off">Disconnect this device</button>` : ""}</div>
        <p class="muted small">The token stays only on this device. It is never uploaded, never in a backup, and the app's own repo is never touched. Your Claude key is never synced.</p>
        <details><summary>How do I make the repo and the token? (5 minutes, once)</summary><ol class="small">
          <li>On github.com: <b>+</b> → <b>New repository</b> → name <code>german-progress</code> → <b>Private</b> → Create.</li>
          <li>Profile picture → <b>Settings</b> → <b>Developer settings</b> → <b>Personal access tokens</b> → <b>Fine-grained tokens</b> → <b>Generate new token</b>.</li>
          <li>Name: <i>Deutsch Coach sync</i>. Expiration: up to 1 year. <b>Repository access</b>: <i>Only select repositories</i> → <code>german-progress</code>.</li>
          <li><b>Permissions → Repository permissions → Contents: Read and write</b>. Nothing else.</li>
          <li>Generate, copy the token (starts with <code>github_pat_</code>) and paste it here, with the repo as <code>your-name/german-progress</code>.</li>
          <li>On the phone: open the app in the browser, Settings → Sync, paste the same two lines, pick your profile.</li></ol></details></section>
      <section class="card sy-list" ${on() ? "" : "hidden"}><h3>2. Profiles</h3><div class="sy-body"><p class="muted">Loading …</p></div></section>`;
    el.querySelector(".sy-connect").onclick = async () => {
      const old = cfg();
      setCfg({ repo: el.querySelector(".sy-repo").value.trim(), token: el.querySelector(".sy-token").value.trim() });
      try { await api(""); H.toast("Connected ✓", "good"); page(el); } catch (e) { if (old.repo && old.token) setCfg(old); else localStorage.removeItem(SKEY); H.toast(e.message, "bad"); }
    };
    const off = el.querySelector(".sy-off"); if (off) off.onclick = () => { localStorage.removeItem(SKEY); setStatus("off"); page(el); };
    if (!on()) return;
    const body = el.querySelector(".sy-body");
    try {
      const remote = await listRemote();
      const local = Store.profiles(), me = Store.profile();
      const meLinked = me.sync && remote.some((r) => r.slug === me.sync);
      const suggest = slugOf(me.name);
      body.innerHTML = `
        <p><b>This device:</b> ${esc(me.name || "Unnamed")} ${me.sync ? `<span class="chip">☁ ${esc(me.sync)}</span>` : ""}</p>
        ${me.sync ? `<div class="row"><button class="btn sm sy-now">Sync now</button><button class="btn ghost sm sy-unlink">Stop syncing this profile</button></div>`
          : `<div class="row"><button class="btn sign sm sy-up" data-slug="${esc(suggest)}">${remote.some((r) => r.slug === suggest) ? `Join “${esc(suggest)}” on GitHub (merge)` : `Upload “${esc(me.name || "Unnamed")}” to GitHub`}</button></div>`}
        <h4>On GitHub</h4>
        ${remote.length ? `<ul class="sy-remote">${remote.map((r) => { const here = local.find((p) => p.sync === r.slug); return `<li><b>${esc(r.slug)}</b> <span class="muted small">${Math.round(r.size / 1024)} KB</span> ${here ? (here.id === me.id ? '<span class="muted small">· this profile</span>' : `<button class="btn ghost sm sy-open" data-slug="${esc(r.slug)}">Switch to it</button>`) : `<button class="btn sm sy-get" data-slug="${esc(r.slug)}">Use on this device</button>`}</li>`; }).join("")}</ul>`
          : `<p class="muted">Nothing on GitHub yet – upload this profile above.</p>`}`;
      const now = body.querySelector(".sy-now"); if (now) now.onclick = async () => { await syncNow("button"); page(el); };
      const ul = body.querySelector(".sy-unlink"); if (ul) ul.onclick = () => { Store.setProfile({ sync: "" }); page(el); };
      const up = body.querySelector(".sy-up"); if (up) up.onclick = async () => { up.disabled = true; await link(up.dataset.slug); H.toast(status.state === "error" ? status.msg : "Synced ✓", status.state === "error" ? "bad" : "good"); page(el); };
      body.querySelectorAll(".sy-get, .sy-open").forEach((b) => (b.onclick = async () => { b.disabled = true; try { await download(b.dataset.slug); if (window.App) { App.dropCache(); App.applyTheme(); App.renderChip(); } H.toast(`Hallo, ${Store.name()}!`, "good"); App.go("home"); } catch (e) { b.disabled = false; H.toast(e.message, "bad"); } }));
    } catch (e) { body.innerHTML = `<p class="bad">⚠ ${esc(e.message)}</p>`; }
  }

  window.Sync = { on, cfg, setCfg, syncNow, schedule, link, download, listRemote, merge, statusText, page, slugOf, _api: api };

  /* ---------- when to sync ---------- */
  const boot = () => {
    if (!window.Store) return;
    Store.on(() => schedule());
    if (on() && linked()) setTimeout(() => syncNow("start"), 1200);
    document.addEventListener("visibilitychange", () => { if (!on() || !linked()) return; if (document.hidden) { clearTimeout(pushT); syncNow("leave"); } else syncNow("back"); });
    addEventListener("online", () => syncNow("online"));
    addEventListener("pagehide", () => { if (pushT) syncNow("close"); });
    setInterval(paint, 30e3);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
