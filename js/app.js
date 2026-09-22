/* Deutsch Coach – app shell: router, navigation, theme, install */
(function () {
  "use strict";
  const ROUTES = { home: "home", path: "path", lesson: "lesson", practice: "practice", vocab: "vocab", tutor: "tutor", listen: "listen", speak: "speak", read: "read", exam: "exam", grammar: "grammar", stats: "stats", settings: "settings", more: "more", readexam: "readexam", write: "write", notes: "notes", translate: "translate", about: "about" };
  const TAB_OF = { home: "home", path: "path", lesson: "path", practice: "practice", vocab: "practice", tutor: "tutor", translate: "translate" };
  const App = (window.App = { version: "4.2.0", updated: "22 September 2026", author: "Zombieland", pendingAsk: null });
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
  App.askMax = (q) => { App.pendingAsk = q; App.go("tutor"); };
  App.applyTheme = () => {
    const t = Store.get().settings.theme;
    const dark = t === "dark" || (t === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = dark ? "#0F1A21" : "#1C2B36";
  };
  App.route = () => {
    const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
    const name = ROUTES[parts[0]] ? parts[0] : "home";
    const view = document.getElementById("view");
    Speech.stop();
    view.className = "view v-" + name;
    try { Views[name](view, parts.slice(1)); }
    catch (e) { console.error(e); view.innerHTML = `<div class="empty"><p>This screen hit an error: ${H.esc(e.message)}</p><button class="btn" data-go="home">Go home</button></div>`; }
    document.querySelectorAll(".nav a").forEach((a) => a.classList.toggle("on", a.dataset.tab === (TAB_OF[name] || "more")));
    if (name !== "tutor") window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  };

  App.openLink = (url) => {
    if (window.AndroidBridge && AndroidBridge.openUrl) { try { AndroidBridge.openUrl(url); return; } catch (e) {} }
    window.open(url, "_blank", "noopener");
  };
  document.addEventListener("click", (e) => {
    const rp = e.target.closest("[data-report]");
    if (rp) { e.preventDefault(); try { App.report(JSON.parse(rp.dataset.report)); } catch (err) { App.report({}); } return; }
    const ext = e.target.closest("[data-url]");
    if (ext) { e.preventDefault(); App.openLink(ext.dataset.url); return; }
    const t = e.target.closest("[data-go],[data-tts],[data-ask],[data-say]");
    if (!t) return;
    if (t.dataset.tts !== undefined) { e.preventDefault(); e.stopPropagation(); Speech.speak(t.dataset.tts); return; }
    if (t.dataset.go) { e.preventDefault(); App.go(t.dataset.go); return; }
    if (t.dataset.ask) { e.preventDefault(); App.askMax(t.dataset.ask); return; }
    if (t.dataset.say) { e.preventDefault(); if (Views.tutorSend && document.querySelector(".v-tutor")) Views.tutorSend(t.dataset.say); else App.askMax(t.dataset.say); }
  });

  function onboarding() {
    const st = Store.get().settings;
    document.querySelectorAll(".modal.onb").forEach((m) => m.remove());
    if (st.onboarded) { if (!Store.name()) askName(); return; }
    const d = document.createElement("div");
    d.className = "modal onb";
    d.innerHTML = `<div class="sheet" role="dialog" aria-labelledby="ob-t"><h2 id="ob-t">Willkommen!</h2>
      <label class="namebox">What should Max call you? <input class="obname" maxlength="30" autocomplete="given-name" placeholder="Your name" value="${H.esc(Store.name())}"></label>
      <p>Deutsch Coach takes you from A1 to C2 in ${DC.curriculum.length} lessons – like stops on a train line. Every lesson has an explanation, examples, words, a text, exercises, exam questions and a picture to talk about.</p>
      <p>Practice sentences are generated fresh each time, and every answer tells you <b>why</b>. Max, your tutor, checks your German offline.</p>
      <div class="ob-box"><p>🔊 <b>Sound check</b> – every lesson reads German aloud. <button class="btn ghost sm obvoice" type="button">Test the voice</button></p><div class="obvres"></div></div>
      <div class="ob-box"><p>💾 <b>Your progress is saved only on this device.</b> If you clear your browser data or uninstall, it's gone – use <i>Settings → Export backup</i> now and then. The app will remind you once a month.</p></div>
      <p>Where do you want to start?</p>
      <div class="col"><button class="btn sign" data-lvl="1">From the beginning (A1)</button><button class="btn ghost" data-lvl="13">I know A1 – start at A2</button><button class="btn ghost" data-lvl="25">I know A2 – start at B1</button><button class="btn ghost" data-lvl="43">I know B1 – start at B2</button><button class="btn ghost" data-lvl="51">I know B2 – start at C1</button></div>
      <p class="muted small credit">${App.credit()}</p></div>`;
    document.body.appendChild(d);
    d.querySelector(".obvoice").onclick = async () => {
      Speech.speak("Hallo! Willkommen bei Deutsch Coach.");
      const st = await App.voiceStatus();
      d.querySelector(".obvres").innerHTML = st === "none" ? App.voiceHelp() : `<p class="muted small">Did you hear “Hallo! Willkommen bei Deutsch Coach”? If not, turn up the volume or check <i>Settings → Voice</i>.</p>`;
    };
    d.querySelectorAll("[data-lvl]").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.lvl; const s = Store.get();
      const nm = d.querySelector(".obname").value.trim();
      if (!nm) { H.toast("Please type your name first."); d.querySelector(".obname").focus(); return; }
      Store.setName(nm); App.renderChip();
      for (let i = 1; i < n; i++) { const l = Store.lesson(i); l.done = true; l.read = true; l.score = l.score || 70; }
      st.onboarded = true; Store.save(); d.remove(); App.go(n > 1 ? `lesson/${n}` : "home");
    }));
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

  window.addEventListener("hashchange", App.route);
  window.addEventListener("DOMContentLoaded", () => {
    Store.get(); App.applyTheme();
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", App.applyTheme);
    App.renderChip();
    document.querySelector(".pchip").onclick = App.profileSheet;
    App.route(); onboarding();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
    document.body.classList.toggle("in-app", !!window.AndroidBridge);
  });
  // Android hardware back
  window.__onBack = () => { if (location.hash && location.hash !== "#/home" && location.hash !== "#/") { history.back(); return true; } return false; };
})();
