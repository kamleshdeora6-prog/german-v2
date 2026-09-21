/* Deutsch Coach – app shell: router, navigation, theme, install */
(function () {
  "use strict";
  const ROUTES = { home: "home", path: "path", lesson: "lesson", practice: "practice", vocab: "vocab", tutor: "tutor", listen: "listen", speak: "speak", read: "read", exam: "exam", grammar: "grammar", stats: "stats", settings: "settings", more: "more", readexam: "readexam", write: "write", notes: "notes" };
  const TAB_OF = { home: "home", path: "path", lesson: "path", practice: "practice", vocab: "practice", tutor: "tutor" };
  const App = (window.App = { version: "3.0.0", pendingAsk: null });

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
    if (st.onboarded) return;
    const d = document.createElement("div");
    d.className = "modal";
    d.innerHTML = `<div class="sheet" role="dialog" aria-labelledby="ob-t"><h2 id="ob-t">Willkommen!</h2>
      <p>Deutsch Coach takes you from A1 to B1 in 42 lessons – like stops on a train line. Every lesson has an explanation, examples, words, a text, exercises, exam questions and a picture to talk about.</p>
      <p>Practice sentences are generated fresh each time, and every answer tells you <b>why</b>. Max, your tutor, checks your German offline.</p>
      <p>Where do you want to start?</p>
      <div class="col"><button class="btn sign" data-lvl="1">From the beginning (A1)</button><button class="btn ghost" data-lvl="13">I know A1 – start at A2</button><button class="btn ghost" data-lvl="25">I know A2 – start at B1</button></div></div>`;
    document.body.appendChild(d);
    d.querySelectorAll("[data-lvl]").forEach((b) => (b.onclick = () => {
      const n = +b.dataset.lvl; const s = Store.get();
      for (let i = 1; i < n; i++) { const l = Store.lesson(i); l.done = true; l.read = true; l.score = l.score || 70; }
      st.onboarded = true; Store.save(); d.remove(); App.go(n > 1 ? `lesson/${n}` : "home");
    }));
  }

  window.addEventListener("hashchange", App.route);
  window.addEventListener("DOMContentLoaded", () => {
    Store.get(); App.applyTheme();
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", App.applyTheme);
    App.route(); onboarding();
    if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
    document.body.classList.toggle("in-app", !!window.AndroidBridge);
  });
  // Android hardware back
  window.__onBack = () => { if (location.hash && location.hash !== "#/home" && location.hash !== "#/") { history.back(); return true; } return false; };
})();
