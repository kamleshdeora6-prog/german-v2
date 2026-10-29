/* Deutsch Coach – crash log. Every script error, failed promise and broken screen is kept on this device
   (the last 30), so a problem can be reported with one tap instead of a screenshot. Nothing is sent anywhere
   unless you press "Send report". Loaded first, so it also catches errors while the app starts. */
(function () {
  "use strict";
  const KEY = "deutschcoach.errors", MAX = 30;
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
  const write = (xs) => { try { localStorage.setItem(KEY, JSON.stringify(xs.slice(-MAX))); } catch (e) {} };
  const ErrLog = (window.ErrLog = {
    list: read,
    clear: () => write([]),
    add(err, ctx = {}) {
      const msg = String((err && (err.message || err.reason)) || err || "unknown error").slice(0, 300);
      if (/ResizeObserver loop|Script error\.?$|^cancelled$|AbortError/i.test(msg)) return;   // browser noise, not app bugs
      const xs = read(), last = xs[xs.length - 1];
      const entry = { t: Date.now(), msg, where: ctx.where || "", route: (location.hash || "").slice(0, 80), v: (window.App && App.version) || "?", stack: String((err && err.stack) || "").split("\n").slice(0, 5).join("\n").slice(0, 600) };
      if (last && last.msg === entry.msg && last.route === entry.route && entry.t - last.t < 60e3) { last.n = (last.n || 1) + 1; last.t = entry.t; write(xs); return; }
      xs.push(entry); write(xs);
    },
    /* plain-text report for an issue or a chat message */
    report() {
      const xs = read().slice(-10);
      return [`Deutsch Coach ${(window.App && App.version) || "?"} (${window.EDITION || "stable"})`, navigator.userAgent, `Screen ${screen.width}x${screen.height}`, "",
        ...xs.map((x) => `${new Date(x.t).toISOString()} ${x.route} ${x.where} ×${x.n || 1}\n  ${x.msg}\n  ${(x.stack || "").replace(/\n/g, "\n  ")}`)].join("\n");
    },
  });
  window.addEventListener("error", (e) => ErrLog.add(e.error || e.message, { where: e.filename ? e.filename.split("/").pop() + ":" + e.lineno : "" }));
  window.addEventListener("unhandledrejection", (e) => ErrLog.add(e.reason || "unhandled promise", { where: "promise" }));
})();
