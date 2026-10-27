/* Deutsch Coach – app shell: router, navigation, theme, install */
(function () {
  "use strict";
  const ROUTES = { home: "home", library: "library", cards: "cards", exercises: "exercises", verbs: "verbs", sentences: "sentences", pictures: "pictures", path: "path", lesson: "lesson", practice: "practice", vocab: "vocab", tutor: "tutor", listen: "listen", speak: "speak", read: "read", exam: "exam", grammar: "grammar", stats: "stats", settings: "settings", more: "more", readexam: "readexam", write: "write", notes: "notes", translate: "translate", about: "about", placement: "placement", pronounce: "pronounce", news: "news", plan: "plan", daily: "daily", weak: "weak", refresh: "refresh", resources: "resources", starter: "starter", partner: "partner" };
  const TAB_OF = { library: "practice", cards: "practice", exercises: "practice", verbs: "practice", sentences: "practice", pictures: "practice", home: "home", path: "path", lesson: "path", practice: "practice", vocab: "practice", listen: "practice", speak: "practice", pronounce: "practice", tutor: "tutor", daily: "home", plan: "more", weak: "practice", refresh: "path", starter: "path", partner: "practice" };
  const App = (window.App = { version: "6.8.0", updated: "26 October 2026", author: "Zombieland", pendingAsk: null });
  /* Where problem reports go. Put an email address here to offer email as well. */
  App.contact = { github: "https://github.com/kamleshdeora6-prog/german-v2", email: "" };
  App.report = (ctx) => {
    document.querySelectorAll(".modal.rsheet").forEach((m) => m.remove());
    const strip = (x) => String(x == null ? "" : x).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const where = ctx.lesson ? `Lesson ${ctx.lesson}${ctx.part ? " · " + ctx.part : ""}` : ctx.part || location.hash.slice(2);
    const d = document.createElement("div"); d.className = "modal rsheet";
    d.innerHTML = `<div class="sheet" role="dialog" aria-labelledby="rp-t"><h2 id="rp-t">Report a problem</h2>
      <p class="muted small">Wrong German, a wrong answer key, a bad explanation, a bug – thank you for telling us.</p>
      <div class="rbox"><p><b>${H.esc(where)}</b>${ctx.id ? ` · <code>${H.esc(ctx.id)}</code>` : ""}</p>${ctx.q ? `<p>${H.esc(strip(ctx.q))}</p>` : ""}${ctx.a ? `<p class="muted small">Expected: ${H.esc(strip(ctx.a))}</p>` : ""}${ctx.given ? `<p class="muted small">Your answer: ${H.esc(strip(ctx.given))}</p>` : ""}</div>
      <label>What's wrong? <textarea class="rnote" rows="3" placeholder="e.g. my answer is also correct / this sentence is unnatural"></textarea></label>
      <div class="row"><button class="btn sign rgh">Send via GitHub</button>${App.contact.email ? '<button class="btn ghost rmail">Send by email</button>' : ""}<button class="btn ghost rclose">Cancel</button></div>
      <p class="muted small">GitHub needs a free account. Your name and progress are not sent.</p></div>`;
    const body = () => [`**Where:** ${where}`, ctx.id ? `**Question ID:** \`${ctx.id}\`` : "", ctx.q ? `**Question:** ${strip(ctx.q)}` : "", ctx.a ? `**Expected answer:** ${strip(ctx.a)}` : "", ctx.accept && ctx.accept.length ? `**Also accepted:** ${ctx.accept.map(strip).join(" | ")}` : "", ctx.given ? `**My answer:** ${strip(ctx.given)}` : "", "", `**What's wrong:** ${d.querySelector(".rnote").value.trim() || "(please describe)"}`, "", `_Deutsch Coach ${App.version} · ${navigator.userAgent.includes("Android") ? "Android" : /iPhone|iPad/.test(navigator.userAgent) ? "iOS" : "desktop"}${window.AndroidBridge ? " app" : " web"}_`].filter((x) => x !== "").join("\n");
    const title = () => `[Report] ${where}: ${strip(ctx.q).slice(0, 60)}`;
    d.querySelector(".rgh").onclick = () => { App.openLink(`${App.contact.github}/issues/new?labels=report&title=${encodeURIComponent(title())}&body=${encodeURIComponent(body())}`); d.remove(); H.toast("Thanks! Finish the report on GitHub."); };
    const m = d.querySelector(".rmail"); if (m) m.onclick = () => { location.href = `mailto:${App.contact.email}?subject=${encodeURIComponent(title())}&body=${encodeURIComponent(body())}`; d.remove(); };
    d.querySelector(".rclose").onclick = () => d.remove();
    d.onclick = (e) => { if (e.target === d) d.remove(); };
    document.body.appendChild(d);
    setTimeout(() => d.querySelector(".rnote").focus(), 50);
  };
  App.backup = () => {
    const data = Store.export();
    const st = Store.get(); st.lastBackup = Date.now(); Store.save();
    const name = `deutsch-coach-${(Store.name() || "backup").replace(/[^\wäöüß-]+/gi, "_")}-${Store.today()}.json`;
    if (window.AndroidBridge && AndroidBridge.share) return AndroidBridge.share(data);
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type: "application/json" })); a.download = name; a.click();
    H.toast("Backup saved. Keep the file somewhere safe.");
  };
  /* German voice check: speechSynthesis loads voices late, so ask twice */
  App.voiceStatus = () => new Promise((res) => {
    if (window.AndroidBridge) return res("native");
    if (!("speechSynthesis" in window)) return res("none");
    if (Speech.voices().length) return res("ok");
    setTimeout(() => res(Speech.voices().length ? "ok" : "none"), 900);
  });
  App.voiceHelp = () => `<div class="voicehelp"><p><b>No German voice found on this device</b>, so lessons will be silent. To fix it:</p>
    <ul><li><b>Android:</b> Settings → System → Languages → Text-to-speech output → Google → install <i>Deutsch</i>. Then restart the app.</li>
    <li><b>iPhone / iPad:</b> Settings → Accessibility → Spoken Content → Voices → German → download one (e.g. Anna).</li>
    <li><b>Windows:</b> Settings → Time &amp; language → Speech → Add voices → Deutsch.</li>
    <li><b>Mac:</b> System Settings → Accessibility → Spoken Content → System voice → Manage voices → German.</li></ul>
    <p class="muted small">Or install the Android app, which uses the phone's own speech engine.</p></div>`;
  App.credit = () => `Deutsch Coach ${App.version} · created by <b>${App.author}</b> · last updated ${App.updated}`;

  /* ---------- profiles ---------- */
  const initial = (n) => (n || "?").trim().charAt(0).toUpperCase() || "?";
  App.renderChip = () => {
    const c = document.querySelector(".pchip"); if (!c) return;
    const p = Store.profile() || {};
    c.innerHTML = `<span class="av" style="background:${p.color || "#E3A400"}">${H.esc(initial(p.name))}</span><span class="pname">${H.esc(p.name || "Profile")}</span>`;
  };
  App.profileSheet = () => {
    document.querySelectorAll(".modal.psheet").forEach((m) => m.remove());
    const d = document.createElement("div"); d.className = "modal psheet";
    const cur = Store.profile();
    const draw = () => {
      d.innerHTML = `<div class="sheet" role="dialog" aria-labelledby="ps-t"><h2 id="ps-t">Who is learning?</h2>
        <p class="muted small">Every profile has its own progress, words and streak on this device.</p>
        <ul class="plist">${Store.profiles().map((p) => `<li><button class="pick ${p.id === cur.id ? "on" : ""}" data-id="${p.id}"><span class="av" style="background:${p.color}">${H.esc(initial(p.name))}</span>${H.esc(p.name || "Unnamed")}${p.id === cur.id ? ' <span class="muted small">· active</span>' : ""}</button></li>`).join("")}</ul>
        <div class="row"><input class="newname" maxlength="30" placeholder="New learner's name" aria-label="New learner's name"><button class="btn sign add">Add</button></div>
        <div class="row"><button class="btn ghost" data-go="settings">Manage profiles</button><button class="btn ghost close">Close</button></div></div>`;
      d.querySelectorAll(".pick").forEach((b) => (b.onclick = () => { Store.switchTo(b.dataset.id); d.remove(); App.afterSwitch(); }));
      d.querySelector(".add").onclick = () => {
        const nm = d.querySelector(".newname").value.trim();
        if (!nm) { H.toast("Type a name first."); return; }
        Store.addProfile(nm); d.remove(); App.afterSwitch();
      };
      d.querySelector(".close").onclick = () => d.remove();
      d.querySelector("[data-go]").addEventListener("click", () => d.remove());
    };
    draw(); d.onclick = (e) => { if (e.target === d) d.remove(); };
    document.body.appendChild(d);
  };
  App.afterSwitch = () => { App.applyTheme(); App.renderChip(); H.toast(`Hallo, ${Store.name() || "du"}!`); onboarding(); App.go("home"); };

  App.go = (h) => { if (location.hash === "#/" + h) App.route(); else location.hash = "#/" + h; };
  App.askMax = (q) => { App.maxPanel(true); setTimeout(() => (V0().tutorSend ? V0().tutorSend(q) : App.pendingAsk = q), 60); };
  const V0 = () => window.Views;
  /* Floating Max: opens over whatever you are doing, so you never lose your place. */
  App.maxPanel = (open) => {
    let p = document.getElementById("maxpanel");
    if (!p) {
      p = document.createElement("div"); p.id = "maxpanel"; p.className = "maxpanel"; p.hidden = true;
      p.innerHTML = `<div class="maxhead"><b>Max</b><span class="muted small ctx"></span><button class="x" aria-label="Close">✕</button></div><div class="maxbody"></div>`;
      document.body.appendChild(p);
      p.querySelector(".x").onclick = () => App.maxPanel(false);
    }
    if (open === false) { p.hidden = true; document.body.classList.remove("max-open"); return; }
    Views.tutor(p.querySelector(".maxbody"), [], { embedded: true });   // rebuild so replies land in the panel
    p.querySelector(".ctx").textContent = App.contextLabel();
    p.hidden = false; document.body.classList.add("max-open");
    const ta = p.querySelector("textarea"); if (ta) setTimeout(() => ta.focus(), 50);
  };
  App.contextLabel = () => {
    const r = (App.lastRoute || "").split("/");
    if (r[0] === "lesson") { const l = Course.byN(r[1]); return l ? `you're on lesson ${l.pos}: ${H.ltText(l)}` : ""; }
    if (r[0] === "practice") return r[1] ? `you're practising ${(Engine.GEN[r[1]] || {}).title || r[1]}` : "you're practising";
    if (r[0] === "write") return "you're writing";
    if (r[0] === "readexam") return "you're in the reading exam";
    if (r[0] === "placement") return "you're in the placement test";
    return "";
  };
  App.applyTheme = () => {
    const st = Store.get().settings;
    const t = st.theme || "auto";
    const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    const r = document.documentElement;
    r.dataset.theme = t === "paper" ? "paper" : dark ? "dark" : "light";
    r.dataset.size = st.textSize || "m";
    r.dataset.labels = st.labels || "both";   // menu language: both | de | en
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = t === "paper" ? "#F6F1E7" : dark ? "#0F1A21" : "#1C2B36";
  };
  /* Screens that hold your place (a session you are in the middle of) are kept alive in the
     background instead of being rebuilt, so leaving to ask Max and coming back resumes where you were. */
  const KEEP = /^(cards|exercises|sentences|practice|lesson|write|readexam|placement|vocab|listen|speak|exam|weak|refresh)/;
  const cache = new Map();          // route key -> detached element
  const MAX_KEEP = 6;
  App.lastRoute = null;
  App.route = () => {
    const raw = (location.hash.replace(/^#\/?/, "") || "home");
    const parts = raw.split("/");
    const name = ROUTES[parts[0]] ? parts[0] : "home";
    const host = document.getElementById("view");
    const key = raw;
    Speech.stop();
    if (KEEP.test(name) && !/^(home|more)$/.test(name)) { const s = Store.get(); s.resume = { route: key, at: Date.now() }; Store.save(); }
    App.lastRoute = key;
    // park the current screen if it is worth keeping
    const cur = host.firstElementChild;
    if (cur && cur.dataset.key && KEEP.test(cur.dataset.key.split("/")[0])) {
      cache.set(cur.dataset.key, cur);
      while (cache.size > MAX_KEEP) cache.delete(cache.keys().next().value);
    }
    host.innerHTML = "";
    host.className = "view v-" + name; document.body.dataset.route = name;
    const cached = cache.get(key);
    if (cached) { cache.delete(key); host.appendChild(cached); App.afterRoute(name); return; }
    const view = document.createElement("div");
    view.className = "screen"; view.dataset.key = key;
    host.appendChild(view);
    try { Views[name](view, parts.slice(1)); }
    catch (e) { console.error(e); view.innerHTML = `<div class="empty"><p>This screen hit an error: ${H.esc(e.message)}</p><button class="btn" data-go="home">Go home</button></div>`; }
    App.afterRoute(name);
  };
  App.dropCache = (re) => { [...cache.keys()].forEach((k) => { if (!re || re.test(k)) cache.delete(k); }); };
  App.afterRoute = (name) => {
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.tab === (TAB_OF[name] || "more")));
    if (name !== "tutor") window.scrollTo(0, 0);
    document.getElementById("view").focus({ preventScroll: true });
  };

  App.openLink = (url) => {
    if (window.AndroidBridge && AndroidBridge.openUrl) { try { AndroidBridge.openUrl(url); return; } catch (e) {} }
    window.open(url, "_blank", "noopener");
  };
  document.addEventListener("click", (e) => {
    const rp = e.target.closest("[data-report]");
    if (rp) { e.preventDefault(); try { App.report(JSON.parse(rp.dataset.report)); } catch (err) { App.report({}); } return; }
    const gl = e.target.closest("[data-gloss]");
    if (gl) { e.preventDefault(); e.stopPropagation(); const host = gl.parentElement; const old = host.querySelector(":scope > .ghint"); if (old) { old.remove(); gl.classList.remove("on"); return; } const d = document.createElement("div"); d.className = "ghint"; d.innerHTML = Views.gloss ? Views.gloss(gl.dataset.gloss, "de", true) : ""; host.appendChild(d); gl.classList.add("on"); return; }
    const ext = e.target.closest("[data-url]");
    if (ext) { e.preventDefault(); App.openLink(ext.dataset.url); return; }
    const t = e.target.closest("[data-go],[data-tts],[data-ask],[data-say]");
    if (!t) return;
    if (t.dataset.tts !== undefined) { e.preventDefault(); e.stopPropagation(); const k = t.dataset.tts; const st = Speech.status(); if (st.key === k && st.state === "playing") Speech.pause(); else if (st.key === k && st.state === "paused") Speech.resume(); else Speech.speak(k); return; }
    if (t.dataset.go) { e.preventDefault(); App.go(t.dataset.go); return; }
    if (t.dataset.ask) { e.preventDefault(); App.askMax(t.dataset.ask); return; }
    if (t.dataset.say) { e.preventDefault(); if (Views.tutorSend && document.querySelector(".v-tutor")) Views.tutorSend(t.dataset.say); else App.askMax(t.dataset.say); }
  });

  /* Onboarding: three taps, then straight into the first exercise. Everything else can wait. */
  function onboarding() {
    const st = Store.get().settings;
    document.querySelectorAll(".modal.onb").forEach((m) => m.remove());
    if (st.onboarded) { if (!Store.name()) askName(); return; }
    const d = document.createElement("div");
    d.className = "modal onb";
    let goal = 50, start = 1, tone = "neutral";
    const draw = (step) => {
      const dots = `<div class="obdots">${[1, 2, 3].map((i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>`;
      if (step === 1) d.innerHTML = `<div class="sheet ob" role="dialog" aria-labelledby="ob-t">${dots}<div class="ob-hero">🇩🇪</div><h2 id="ob-t">Willkommen! <span class="muted small">Welcome!</span></h2>
        <p>German from A1 to C2 in short daily steps. Every answer tells you <b>why</b>.</p>
        <label class="namebox">What should we call you? <input class="obname" maxlength="30" autocomplete="given-name" placeholder="Your name" value="${H.esc(Store.name())}"></label>
        <button class="btn sign big-btn ob-next">Weiter · Next</button>${Store.hasStable() ? `<button class="btn ghost ob-import">🧪 Lab: copy my progress from the daily app</button>` : ""}</div>`;
      if (step === 2) d.innerHTML = `<div class="sheet ob" role="dialog" aria-labelledby="ob-t">${dots}<h2 id="ob-t">How much a day?</h2>
        <p class="muted">Small and daily beats big and rare. You can change this any time.</p>
        <div class="col goalpick">${[[20, "Locker", "Casual", "5 min"], [50, "Normal", "Regular", "10 min"], [100, "Ernsthaft", "Serious", "20 min"], [150, "Intensiv", "Intense", "30 min"]].map(([g, t, te, m]) => `<button class="pickrow ${g === goal ? "on" : ""}" data-goal="${g}"><b>${t} <span class="muted small">· ${te}</span></b><span>${m} a day</span></button>`).join("")}</div>
        <p class="muted small" style="margin-top:14px">Coach style</p>
        <div class="seg tonepick">${[["freundlich", "Freundlich · kind"], ["neutral", "Neutral"], ["streng", "Streng · strict"]].map(([v, t]) => `<button class="${v === tone ? "on" : ""}" data-tone="${v}">${t}</button>`).join("")}</div>
        <button class="btn sign big-btn ob-next">Weiter · Next</button></div>`;
      if (step === 3) d.innerHTML = `<div class="sheet ob" role="dialog" aria-labelledby="ob-t">${dots}<h2 id="ob-t">Where do you start?</h2>
        <div class="col">${[[-1, "I know zero German", "First steps with pictures · app in English"], [1, "I know a few words", "Start at lesson 1 (A1)"], [0, "I know some German", "15-minute placement test"], [13, "I finished A1", "Start at A2"], [25, "I finished A2", "Start at B1"], [43, "I finished B1", "Start at B2"], [51, "I finished B2", "Start at C1"]].map(([n, t, sub]) => `<button class="pickrow" data-lvl="${n}"><b>${t}</b><span>${sub}</span></button>`).join("")}</div>
        <p class="muted small credit">${App.credit()}</p></div>`;
      const nm = d.querySelector(".obname"); if (nm) { setTimeout(() => nm.focus(), 50); nm.onkeydown = (e) => { if (e.key === "Enter") d.querySelector(".ob-next").click(); }; }
      d.querySelectorAll("[data-goal]").forEach((b) => (b.onclick = () => { goal = +b.dataset.goal; d.querySelectorAll("[data-goal]").forEach((x) => x.classList.toggle("on", x === b)); }));
      d.querySelectorAll("[data-tone]").forEach((b) => (b.onclick = () => { tone = b.dataset.tone; d.querySelectorAll("[data-tone]").forEach((x) => x.classList.toggle("on", x === b)); }));
      const im = d.querySelector(".ob-import");
      if (im) im.onclick = () => { if (Store.importStable()) { const s = Store.get(); s.settings.onboarded = true; Store.save(); d.remove(); App.applyTheme(); App.renderChip(); H.toast("Progress copied from the daily app."); App.go("home"); } };
      const nx = d.querySelector(".ob-next");
      if (nx) nx.onclick = () => {
        if (step === 1) { const v = nm.value.trim(); if (!v) { H.toast("Please type your name first."); nm.focus(); return; } Store.setName(v); App.renderChip(); }
        draw(step + 1);
      };
      d.querySelectorAll("[data-lvl]").forEach((b) => (b.onclick = () => {
        const n = +b.dataset.lvl; const s = Store.get();
        s.settings.goal = goal; s.settings.tone = tone;
        DC.curriculum.filter((x) => n > 1 && Course.before(x.n, n)).forEach((x) => { const l = Store.lesson(x.n); l.done = true; l.read = true; l.score = l.score || 70; });
        if (n === -1) { s.starterMode = true; s.settings.labels = "en"; App.applyTheme(); }
        s.settings.onboarded = true; Store.save(); d.remove();
        App.go(n === -1 ? "starter" : n === 0 ? "placement" : `lesson/${Math.max(1, n)}`);
      }));
    };
    draw(1);
    document.body.appendChild(d);
  }

  // learners who already had progress before profiles existed: just ask for the name once
  function askName() {
    const d = document.createElement("div"); d.className = "modal onb";
    d.innerHTML = `<div class="sheet" role="dialog" aria-labelledby="an-t"><h2 id="an-t">Hallo! Wie heißt du?</h2>
      <p class="muted">Your progress is safe. Add your name so this profile is yours – other learners on this device can add their own.</p>
      <div class="row"><input class="obname" maxlength="30" autocomplete="given-name" placeholder="Your name" aria-label="Your name"><button class="btn sign ok">Save</button></div></div>`;
    document.body.appendChild(d);
    const go = () => { const nm = d.querySelector(".obname").value.trim(); if (!nm) return H.toast("Type your name first."); Store.setName(nm); App.renderChip(); d.remove(); App.route(); };
    d.querySelector(".ok").onclick = go;
    d.querySelector(".obname").onkeydown = (e) => { if (e.key === "Enter") go(); };
  }

  App.resume = () => (Store.get().resume || null);
  App.mountMaxButton = () => {
    if (document.querySelector(".maxfab")) return;
    const b = document.createElement("button");
    b.className = "maxfab"; b.type = "button"; b.title = "Ask Max (anywhere)"; b.setAttribute("aria-label", "Ask Max");
    b.innerHTML = "<span>M</span>";
    b.onclick = () => App.maxPanel(document.getElementById("maxpanel") ? document.getElementById("maxpanel").hidden : true);
    document.body.appendChild(b);
  };
  /* Reload the newest version: drop the offline cache (never the progress) and fetch everything again. */
  App.hardReload = async () => {
    try { Store.save(); if (window.caches) for (const k of await caches.keys()) await caches.delete(k); } catch (e) {}
    try { if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister(); } catch (e) {}
    location.reload();
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { App.maxPanel(false); Speech.stop(); }
    // space = pause/resume while audio plays (unless you are typing)
    if (e.key === " " && !/INPUT|TEXTAREA|SELECT|BUTTON/.test(document.activeElement.tagName) && Speech.status().state !== "idle") { e.preventDefault(); Speech.status().state === "playing" ? Speech.pause() : Speech.resume(); }
  });
  window.addEventListener("hashchange", App.route);
  window.addEventListener("DOMContentLoaded", () => {
    Store.get(); App.applyTheme();
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", App.applyTheme);
    App.renderChip(); App.mountMaxButton(); UI.mountPlayer();
    document.querySelector(".pchip").onclick = App.profileSheet;
    App.route(); onboarding(); App.newsBadge && App.newsBadge();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register("sw.js").then((reg) => {
        reg.update().catch(() => {});
        // a new version was installed in the background: offer it instead of silently showing the old one
        const offer = () => { if (document.querySelector(".updbar")) return; const b = document.createElement("div"); b.className = "updbar"; b.innerHTML = `<span>✨ A new version of Deutsch Coach is ready.</span><button class="btn sign sm">Update</button>`; b.querySelector("button").onclick = App.hardReload; document.body.appendChild(b); };
        if (reg.waiting && navigator.serviceWorker.controller) offer();
        reg.addEventListener("updatefound", () => { const w = reg.installing; if (w) w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller) offer(); }); });
      }).catch(() => {});
    }
    document.body.classList.toggle("in-app", !!window.AndroidBridge);
  });
  // Android hardware back
  window.__onBack = () => { if (location.hash && location.hash !== "#/home" && location.hash !== "#/") { history.back(); return true; } return false; };
})();
