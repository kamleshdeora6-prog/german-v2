/* Deutsch Coach – feedback a teacher would give.
   FB.closed(): a typed answer with one right solution – what you wrote vs. the answer, the letters that
                differ, capital letters, and *why* (verb endings and vowel changes are explained).
   FB.open():   a free answer (exam, speaking) – checked against the task: German or not, length,
                required words, questions vs. statements, the lesson's grammar, Max's corrections,
                capitals – with a score, a checklist and a model answer. */
(function () {
  "use strict";
  const esc = (s) => H.esc(s);
  const FB = (window.FB = {});

  /* ---------- small helpers ---------- */
  const words = (s) => String(s || "").replace(/[„“"«»()]/g, " ").split(/\s+/).filter(Boolean);
  const bare = (w) => String(w).replace(/[.,!?;:…]+$/g, "").replace(/^[.,!?;:…]+/g, "");
  const low = (w) => bare(w).toLowerCase().normalize("NFC");
  const sentences = (t) => String(t || "").split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => /[a-zäöüß]/i.test(x));

  /* character diff for one word: mark what is different */
  function charDiff(given, want) {
    const a = [...given], b = [...want];
    const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i].toLowerCase() === b[j].toLowerCase() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0, g = "", w = "";
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i].toLowerCase() === b[j].toLowerCase()) { g += esc(a[i]); w += esc(b[j]); i++; j++; }
      else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) { w += `<mark>${esc(b[j])}</mark>`; j++; }
      else { g += `<del>${esc(a[i])}</del>`; i++; }
    }
    return { g, w };
  }
  /* word diff for sentences */
  function wordDiff(given, want) {
    const a = words(given), b = words(want);
    const A = a.map(low), B = b.map(low);
    const dp = Array.from({ length: A.length + 1 }, () => Array(B.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0; const g = [], w = [];
    while (i < A.length || j < B.length) {
      if (i < A.length && j < B.length && A[i] === B[j]) { g.push(esc(a[i])); w.push(esc(b[j])); i++; j++; }
      else if (j < B.length && (i >= A.length || dp[i][j + 1] >= dp[i + 1][j])) { w.push(`<mark>${esc(b[j])}</mark>`); j++; }
      else { g.push(`<del>${esc(a[i])}</del>`); i++; }
    }
    return { g: g.join(" "), w: w.join(" ") };
  }
  const diff = (given, want) => (words(want).length <= 1 && words(given).length <= 1 ? charDiff(bare(given.trim()), bare(want.trim())) : wordDiff(given, want));

  /* capital letters: same words, different capitals */
  function capitals(given, want) {
    const a = words(given), b = words(want);
    if (a.length !== b.length) return "";
    const off = [];
    a.forEach((w, i) => { const x = bare(w), y = bare(b[i]); if (x !== y && x.toLowerCase() === y.toLowerCase()) off.push(y); });
    if (!off.length) return "";
    const first = off[0] === bare(b[0]);
    return `Capital letters: <b>${off.map(esc).join(", ")}</b> – ${first && off.length === 1 ? "the first word of a sentence" : "nouns, names and the first word of a sentence"} start with a capital letter in German.`;
  }

  /* ---------- why is this verb form right? ----------
     The person is read from the conjugation table (which form *is* the answer), not guessed from the sentence. */
  const PNAME = { ich: "ich", du: "du", er: "er/sie/es", wir: "wir", ihr: "ihr", sie: "sie/Sie" };
  const END = { ich: "e", du: "st", er: "t", wir: "en", ihr: "t", sie: "en" };
  const NOT_VERB = /^(ein|kein|mein|dein|sein|ihr|unser|euer|der|die|das|ich|du|er|sie|es|wir|man)$/;
  const vowels = (x) => x.match(/[aeiouäöüy]+/g) || [];
  function tableOf(inf) {
    const t = window.DC && DC.conj && DC.conj[inf];
    if (t && t.f) return { f: t.f, irregular: t.type !== "regular" };
    if (window.Engine && (Engine.IRR[inf] || Engine.VERBS.some((v) => v.inf === inf))) {
      const P = { ich: "1s", du: "2s", er: "3s", wir: "1p", ihr: "2p", sie: "3p" }; const f = {};
      try { Object.entries(P).forEach(([k, v]) => (f[k] = Engine.conj(inf, v))); } catch (e) { return null; }
      return { f, irregular: !!Engine.IRR[inf] };
    }
    return null;
  }
  /* when a form fits two persons (liest = du and er), the sentence's subject decides */
  function pickPerson(ps, q) {
    if (ps.length === 1) return ps[0];
    const t = words(q).map(low);
    for (const k of ["du", "ihr", "wir", "ich"]) if (ps.includes(k) && t.includes(k)) return k;
    if (ps.includes("er") && !t.includes("ihr")) return "er";
    return ps[0];
  }
  function verbWhy(q, ans) {
    const m = /\(([a-zäöüß]+)\)\s*$/.exec(q);
    if (!m || /\s|\//.test(String(ans).trim())) return "";
    const inf = m[1], form = String(ans).trim().toLowerCase();
    if (NOT_VERB.test(inf) && inf !== "sein") return "";
    const T = tableOf(inf); if (!T) return "";
    const ps = Object.keys(T.f).filter((k) => String(T.f[k]).toLowerCase() === form);
    if (!ps.length) return "";                        // e.g. (sein) used for the possessive "seine"
    const p = pickPerson(ps, q), who = p === "wir" && ps.includes("sie") ? "wir (and sie/Sie)" : PNAME[p];
    const table = `<span class="fb-table">${Object.keys(T.f).map((k) => `${k} <b>${esc(T.f[k])}</b>`).join(" · ")}</span>`;
    if (/^(sein|haben|werden|wissen|können|müssen|dürfen|wollen|sollen|mögen|möchten|tun)$/.test(inf)) return `<b>${esc(inf)}</b> is irregular – learn it by heart: ${table}`;
    const stem = inf.replace(/(en|n)$/, "");
    const sOnly = p === "du" && /(s|ß|z|x)$/.test(stem);
    const out = [`<b>${esc(who)}</b> → ending <b>-${sOnly ? "t" : END[p]}</b>${sOnly ? ` – du normally takes -st, but after -${esc(stem.slice(-1))} only <b>-t</b> is added` : ""}.`];
    if (/(t|d)$/.test(stem) && (p === "du" || p === "er" || p === "ihr") && form === stem + "e" + END[p]) out.push(`The stem <b>${esc(stem)}-</b> ends in -${stem.slice(-1)}, so an extra <b>e</b> goes in: ${esc(form)}.`);
    const erStem = String(T.f.er || "").toLowerCase().replace(/(t|d)$/.test(stem) ? /e?t$/ : /t$/, "");
    if ((p === "du" || p === "er") && erStem && erStem !== stem) {
      const a = vowels(stem), b = vowels(erStem); const i = a.findIndex((v, k) => v !== b[k]);
      out.push(`<b>${esc(inf)}</b> changes its vowel with du and er/sie/es${i >= 0 ? `: <b>${esc(a[i])} → ${esc(b[i])}</b>` : ""} (${esc(T.f.du)}, ${esc(T.f.er)}). All other forms keep <b>${esc(stem)}-</b>.`);
    }
    if (out.length === 1 && T.irregular) out.push(table);
    return out.join(" ");
  }

  /* ---------- closed answers ---------- */
  FB.closed = (q, given, answer, g) => {
    const out = [];
    if (g.ok) {
      out.push(`<span class="fb-ok">✓ ${H.bi("Richtig!", "Correct!")}</span> <b>${esc(answer)}</b>`);
      const cap = capitals(given, answer); if (cap) out.push(`<span class="fb-note">${cap}</span>`);
      if (g.note) out.push(`<span class="fb-note">${esc(g.note)}</span>`);
      return out.join("<br>");
    }
    const d = diff(given, answer);
    out.push(`<span class="fb-bad">✗ Not yet.</span> You wrote: <span class="fb-you">${d.g || "–"}</span> → Right: <b class="fb-right">${d.w}</b>`);
    if (g.note) out.push(`<span class="fb-note">${esc(g.note)}${g.level === "close" ? " The highlighted letters are different." : ""}</span>`);
    const why = verbWhy(q, answer); if (why) out.push(`<span class="fb-why">💡 ${why}</span>`);
    const fm = /^Fehler\?\s*„([^“]+)“/.exec(q);
    if (fm) { const dd = wordDiff(fm[1], answer); out.push(`<span class="fb-why">💡 The mistake: <span class="fb-you">${dd.g}</span> → <b>${dd.w}</b></span>`); }
    out.push(`<span class="muted small">Change your answer and press Check again.</span>`);
    return out.join("<br>");
  };

  /* ---------- open answers ---------- */
  const NUM = { zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, zehn: 10 };
  const EN = new Set("the is are and i you my have has with this that of to it's i'm don't we they he she very because but from for like what where how am was were".split(" "));
  const LIST_STOP = /^(je|einem|einer|einen|dem|der|den|ihrem|ihrer|ihren|einem|mindestens|typischen|artikeln|\d+|zwei|drei|vier|fünf)$/i;
  function requiredWords(prompt) {
    const out = [];
    const re = /\bmit\s+([^.)?]+)/gi; let m;
    while ((m = re.exec(prompt))) {
      const seg = m[1].trim();
      const first = seg.split(/\s+/)[0].replace(/[„“"]/g, "");
      const quoted = /„/.test(seg);
      if (quoted) { (seg.match(/„([^“]+)“/g) || []).forEach((x) => out.push(x.replace(/[„“…]/g, "").trim())); continue; }
      if (!quoted && !/\//.test(seg) && !(/^[a-zäöüß]/.test(first) && !LIST_STOP.test(first))) continue;
      if (LIST_STOP.test(first) && !quoted) continue;
      seg.split(/\s*(?:\/|,|\bund\b|\boder\b)\s*/).map((x) => x.replace(/[„“"…]/g, "").replace(/\s*\.\.\.\s*/g, " ").trim()).filter((x) => x && x.split(/\s+/).length <= 3 && !/\b(Sie|Ihr\w*)\b/.test(x) && !/-$/.test(x) && !/^(Artikeln|Ersatzformen|Partizipien)$/i.test(x)).forEach((x) => out.push(x));
    }
    return [...new Set(out)];
  }
  function targets(prompt, level) {
    const p = String(prompt);
    const n = (re) => { const m = re.exec(p); return m ? (NUM[m[1].toLowerCase()] || +m[1]) : 0; };
    const sents = n(/(\d+|zwei|drei|vier|fünf|sechs|sieben|acht|zehn)\s+(Sätze|Sätzen|Beispiele|Regeln|Tipps|Ratschläge|Vermutungen|Gründe|Zwecke|Informationen|Bedingungen|Dinge)/i);
    const qs = n(/(\d+|zwei|drei|vier|fünf|sechs)\s+(höfliche\s+)?Fragen/i) || n(/nach\s+(\d+|zwei|drei|vier|fünf)\s+\w+/i);
    const wordsT = n(/(\d+)\s*Wörter/i);
    const asks = /^(fragen sie|frag|stellen sie .*fragen|bitten sie|fragen:)/i.test(p) || /\bfragen sie\b/i.test(p);
    const def = { A1: 2, A2: 3, B1: 3, B2: 3, C1: 3, C2: 3 }[level] || 3;
    return { sents: sents || (qs ? qs : def), qs: asks ? qs || 2 : 0, words: wordsT, asks, explicit: !!(sents || qs || wordsT) };
  }

  FB.open = (text, ctx = {}) => {
    const l = ctx.lesson || {}, prompt = ctx.prompt || "", level = l.level || "A1";
    const t = String(text || "").trim();
    const ss = sentences(t), ws = words(t);
    const T = targets(prompt, level);
    const checks = [];   // [ok, label, tip]
    // 1. German?
    const enHits = ws.filter((w) => EN.has(low(w))).length;
    const english = ws.length >= 3 && enHits / ws.length > 0.2;
    if (english) checks.push([false, "Written in German", "This looks like English. Write your answer in German – short and simple is fine."]);
    // 2. length
    const lenOk = T.words ? ws.length >= T.words * 0.8 : ss.length >= T.sents;
    checks.push([lenOk, T.words ? `About ${T.words} words` : `${T.sents} sentence${T.sents > 1 ? "s" : ""}${T.explicit ? " (the task asks for this)" : ""}`,
      lenOk ? (T.words ? `${ws.length} words.` : `${ss.length} sentence${ss.length > 1 ? "s" : ""}.`) : T.words ? `You have ${ws.length} words – add details: when, where, why, with whom?` : `You have ${ss.length}. Add ${T.sents - ss.length} more – say when, where, why or with whom.`]);
    // 3. questions vs. statements
    if (T.asks) { const nq = ss.filter((x) => /\?$/.test(x)).length; checks.push([nq >= T.qs, `${T.qs} question${T.qs > 1 ? "s" : ""}`, nq >= T.qs ? `${nq} questions – good.` : `The task asks you to ask. Questions end with „?“ and start with the verb or a W-word: Wohnst du …? Wo …?`]); }
    else if (ws.length && ((/\?/.test(prompt) && /\b(Sie|Ihnen)\b/.test(prompt) && !/^\s*\w+en Sie\b/.test(prompt) && !/\b(in )?Ihre[mrn]? (Land|Heimatland|Muttersprache|Kultur|Stadt)\b/.test(prompt) && !/\bman\b/.test(prompt)) || /^\s*(Erzählen|Beschreiben) Sie\b.*\bIhre[nmr]? (Familie|Hobbys|Wohnung|Tagesablauf|Sonntag|Wochenende|Kindheit|Leben|Zimmer|Lebenslauf|Reise|Tag)\b/.test(prompt))) {
      const me = /\b(ich|mir|mich|mein\w*|wir|uns|unser\w*)\b/i.test(t);
      checks.push([me, "Answer about yourself", me ? "You talk about yourself – that's what the question wants." : "The question is about you. Start with Ich …, Mein …, Mir …"]);
    }
    // 4. required words
    const req = requiredWords(prompt);
    if (req.length) {
      const have = req.filter((r) => new RegExp(`(^|[^a-zäöüß])${r.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}`, "i").test(t));
      checks.push([have.length >= Math.min(req.length, 2) || have.length === req.length, `Use: ${req.join(", ")}`, have.length === req.length ? "All used." : `Used ${have.length} of ${req.length}${have.length ? ` (${have.join(", ")})` : ""}. Missing: ${req.filter((r) => !have.includes(r)).join(", ")}.`]);
    }
    // 5. the lesson's grammar
    (l.check || []).filter((c) => { try { return !req.some((r) => new RegExp(c.re, "i").test(r)); } catch (e) { return true; } }).forEach((c) => { let ok = false; try { ok = new RegExp(c.re, "im").test(t); } catch (e) { ok = true; } checks.push([ok, `This lesson: ${c.label}`, ok ? "✓ used." : `Try to use it at least once – that's what this lesson trains.`]); });
    // 6. Max: rule problems, sentence by sentence
    const res = ss.map((s) => ({ s, r: Tutor.check(s) }));
    const issues = res.reduce((a, x) => a + x.r.issues.length, 0);
    checks.push([issues === 0, "Grammar rules", issues ? `${issues} possible mistake${issues > 1 ? "s" : ""} – see the corrections below.` : "No rule problems found (Max checks word order, verb endings, cases, articles and more)."]);
    // 7. capitals and full stops
    const lowStart = ss.filter((s) => /^[a-zäöü]/.test(s)).length;
    if (lowStart) checks.push([false, "Capital letter at the start", `${lowStart} sentence${lowStart > 1 ? "s start" : " starts"} with a small letter.`]);
    // 8. words from the lesson
    const lv = (l.vocab || []).map((v) => v.de.split(",")[0].replace(/^(der|die|das)\s+/, "").toLowerCase()).filter((x) => x.length > 3);
    const used = [...new Set(ws.map(low).filter((w) => lv.some((x) => w.startsWith(x.slice(0, Math.max(4, x.length - 2))))))];
    if (lv.length) checks.push([used.length >= (ws.length < 40 ? 1 : 2), "Words from this lesson", used.length ? `You used ${used.length}: ${used.slice(0, 6).join(", ")}.` : `Use a few words from the lesson's word list.`]);

    // score
    const w = (label) => checks.find((c) => c[1].startsWith(label));
    let score = 0;
    const LW = T.explicit ? 25 : 15;
    score += (w("About") || w(`${T.sents} sentence`) || [true])[0] ? LW : Math.round(LW * Math.min(1, (T.words ? ws.length / T.words : ss.length / T.sents)));
    const typeC = checks.find((c) => /question|yourself/.test(c[1])); score += !typeC || typeC[0] ? 10 : 0;
    const reqC = checks.find((c) => c[1].startsWith("Use:")); score += !reqC || reqC[0] ? 10 : 4;
    const lcs = checks.filter((c) => c[1].startsWith("This lesson")); const lc = lcs.length ? lcs.filter((c) => c[0]).length / lcs.length : 1; score += Math.round(15 * lc);
    score += Math.max(0, (T.explicit ? 30 : 40) - issues * 8 - lowStart * 2);
    const vc = checks.find((c) => c[1] === "Words from this lesson"); score += !vc || vc[0] ? 10 : 4;
    if (english) score = Math.min(score, 20);
    if (!ws.length) score = 0;
    score = Math.max(0, Math.min(100, score));
    const verdict = score >= 85 ? ["Sehr gut!", "Very good!"] : score >= 65 ? ["Gut!", "Good!"] : score >= 45 ? ["Okay – noch besser:", "Okay – to make it better:"] : ["Weiter üben", "Keep working on it"];

    const fixes = res.filter((x) => x.r.issues.length);
    if (ctx.log !== false && window.Mistakes) fixes.forEach((x) => Store.mistake({ cat: "correction", prompt: `Correct this sentence:<br><i>${esc(x.s)}</i>`, answer: x.r.fixed, given: x.s, why: x.r.issues.map((i) => i.why).join(" ") }));
    const model = ctx.model ? `<details class="fb-model" ${score < 45 ? "open" : ""}><summary>📝 Model answer</summary><p class="ex">${esc(ctx.model)} ${UI.say(ctx.model)}</p><p class="muted small">One possible answer – yours can be different and still right.</p></details>` : "";
    const useful = !ctx.model && l.examples ? (() => { const kw = words(prompt).map(low).filter((x) => x.length > 4); const ex = l.examples.map((e) => ({ e, s: words(e.de).map(low).filter((x) => kw.includes(x)).length })).sort((a, b) => b.s - a.s).slice(0, 3); return `<details class="fb-model"><summary>💬 Sentences from this lesson you could use</summary>${ex.map(({ e }) => `<p class="ex">${esc(e.de)} ${UI.say(e.de)}<br><span class="muted">${esc(e.en)}</span></p>`).join("")}</details>`; })() : "";
    return {
      score,
      html: `<div class="fb-open"><div class="fb-head"><span class="fb-score ${score >= 65 ? "good" : score >= 45 ? "mid" : "low"}">${score}</span><div><b>${H.bi(verdict[0], verdict[1])}</b><div class="pbar sm"><span style="width:${score}%"></span></div></div></div>
        <ul class="fb-list">${checks.map(([ok, label, tip]) => `<li class="${ok ? "y" : "n"}"><span>${ok ? "✓" : "✗"}</span><div><b>${esc(label)}</b><br><span class="muted">${esc(tip)}</span></div></li>`).join("")}</ul>
        ${fixes.length ? `<h4>Corrections</h4>${fixes.map((x) => `<p class="fb-you">${esc(x.s)}</p><p class="ex ok">→ ${esc(x.r.fixed)} ${UI.say(x.r.fixed)} ${UI.star ? UI.star({ type: "sentence", de: x.r.fixed, en: "", src: "Correction" }) : ""}</p><ul class="nots">${x.r.issues.map((i) => `<li>${i.rule}<br><span class="muted">${i.why}</span></li>`).join("")}</ul>`).join("")}` : ""}
        ${model}${useful}</div>`,
    };
  };
  FB._verbWhy = verbWhy; FB._req = requiredWords; FB._targets = targets;   // for tests
})();
