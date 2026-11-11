/* 7.6 – Android app: it now shows this live web app, so updates arrive without installing a new APK.
   On its first start the app hands over the progress of the old built-in copy (another storage);
   take it once if this storage has no progress yet, then tell the app it is done. */
(function () {
  var B = window.AndroidBridge;
  if (!B || !B.getHandover || !/^https?:$/.test(location.protocol)) return;
  try {
    var h = B.getHandover();
    if (!h || h === "done") return;
    var d = JSON.parse(h), mine = false;
    // "progress here" = a profile that has really learned something (an empty first-start profile does not count)
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i); if (!/^deutschcoach\.(lab\.)?v2(\.|$)|^germanCoachProgress$/.test(k)) continue;
      try { var x = JSON.parse(localStorage.getItem(k)) || {}; if ((x.xp || 0) > 0 || Object.keys(x.lessons || {}).length || Object.keys(x.srs || {}).length) mine = true; } catch (e) {}
    }
    if (!mine) Object.keys(d).forEach(function (k) { localStorage.setItem(k, d[k]); });
    B.setHandover("done");
    window.__handedOver = !mine;
  } catch (e) { window.__handoverError = String(e && e.message || e); }
})();
