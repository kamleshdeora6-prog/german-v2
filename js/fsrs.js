/* Deutsch Coach – FSRS-5 spaced repetition (the scheduler Anki uses since 23.10), replacing the old Leitner boxes.
   Each card keeps: s = stability (days until recall drops to 90 %), d = difficulty (1–10), last = last review.
   Grades: 0 again · 1 hard · 2 good · 3 easy. Old Leitner cards are converted the first time they are reviewed. */
(function () {
  "use strict";
  const W = [0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046, 1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315, 2.9898, 0.51655, 0.6621];
  const DECAY = -0.5, FACTOR = 19 / 81, RETENTION = 0.9, DAY = 864e5;
  const LEITNER = [0, 1, 2, 4, 8, 16, 35, 70, 150];
  const clampD = (d) => Math.min(10, Math.max(1, d));
  const R = (t, s) => Math.pow(1 + (FACTOR * t) / s, DECAY);                      // probability of recall after t days
  const interval = (s) => (s / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1);    // days until recall falls to 90 %
  const S0 = (G) => W[G - 1];
  const D0 = (G) => clampD(W[4] - Math.exp(W[5] * (G - 1)) + 1);
  const nextD = (d, G) => { const dd = d + (-W[6] * (G - 3)) * ((10 - d) / 9); return clampD(W[7] * D0(4) + (1 - W[7]) * dd); };
  const recallS = (d, s, r, G) => s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * (G === 2 ? W[15] : 1) * (G === 4 ? W[16] : 1) + 1);
  const forgetS = (d, s, r) => Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
  const shortS = (s, G) => s * Math.exp(W[17] * (G - 3 + W[18]));
  /* a card from the Leitner era: its box interval is our best guess of its stability */
  function migrate(c, now) {
    if (c.s) return c;
    const s = Math.max(0.5, LEITNER[c.box || 0] || 0.5);
    return Object.assign(c, { s, d: clampD(5 + (c.lapses || 0) * 0.7), last: Math.min(now, (c.due || now) - s * DAY), reps: c.seen || 0 });
  }
  const FSRS = (window.FSRS = {
    W, R, interval,
    /* returns the updated card; g = 0..3 */
    review(card, g, now = Date.now()) {
      const G = Math.max(1, Math.min(4, (g | 0) + 1));
      const c = card ? migrate(Object.assign({}, card), now) : null;
      let s, d, lapses = (c && c.lapses) || 0;
      if (!c || !c.s) { s = S0(G); d = D0(G); }
      else {
        const t = Math.max(0, (now - (c.last || now)) / DAY);
        if (t < 0.5) { s = shortS(c.s, G); d = nextD(c.d, G); }                       // again on the same day
        else { const r = R(t, c.s); d = nextD(c.d, G); s = G === 1 ? forgetS(c.d, c.s, r) : recallS(c.d, c.s, r, G); }
      }
      if (G === 1) lapses += c && c.s ? 1 : 0;
      s = Math.max(0.1, Math.min(36500, s));
      let due;
      if (G === 1) due = now + 10 * 60e3;                                                // relearn in 10 minutes
      else {
        let days = Math.max(1, Math.round(interval(s)));
        if (days > 2) days = Math.max(1, Math.round(days * (0.95 + Math.random() * 0.1)));   // ±5 %: spreads the reviews
        due = now + days * DAY;
      }
      return { s: Math.round(s * 100) / 100, d: Math.round(d * 100) / 100, last: now, due, reps: ((c && c.reps) || 0) + 1, seen: ((c && c.seen) || 0) + 1, lapses, box: c ? c.box : 0 };
    },
    /* how well you probably remember it right now (0–1) */
    recall(card, now = Date.now()) { if (!card) return 0; const c = migrate(Object.assign({}, card), now); return R(Math.max(0, (now - c.last) / DAY), c.s); },
    mature: (card) => !!card && (card.s ? card.s >= 21 : (card.box || 0) >= 5),
  });
})();
