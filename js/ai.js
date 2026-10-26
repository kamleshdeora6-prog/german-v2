/* Deutsch Coach – the AI tutor: on this device (default, free, offline – see llm.js) or Claude online (own API key).
   The rule-based parts of the app (Max's checks, answer keys, model answers) stay the reliable base.
   Claude adds what rules can't do: free conversation, detailed feedback on free answers, and new
   exercises built from this learner's own mistakes. Nothing is sent anywhere without a key.

   "Grows with you": every request carries a short learner profile (level, lesson, weak topics, recent
   mistakes) and the tutor's own notes about this learner, which it updates after conversations. */
(function () {
  "use strict";
  const AI = (window.AI = {});
  const MODELS = [
    ["claude-haiku-5-5", "Claude Haiku 5.5 – fast and cheapest (recommended)"],
    ["claude-sonnet-5-5", "Claude Sonnet 5.5 – more careful feedback, about 20× the cost"],
  ];
  AI.MODELS = MODELS;
  const OLD = /^claude-(haiku|sonnet|opus)-[34]/;   // ids from earlier versions of the app
  const st = () => Store.get().settings;
  AI.model = () => { const m = st().aiModel || ""; return !m || OLD.test(m) ? MODELS[0][0] : m; };
  AI.hasKey = () => !!(st().aiKey || "").trim();
  /* two engines: "local" = a small model on this device (free, offline, default) · "claude" = online, own API key */
  AI.local = () => (st().aiProvider || "local") === "local";
  AI.available = () => (AI.local() ? !!(window.LLM && LLM.supported()) : AI.hasKey());        // could work here (maybe after a download)
  AI.ready = () => (AI.local() ? !!(window.LLM && LLM.supported() && LLM.downloaded()) : AI.hasKey() && st().aiOnline !== false && navigator.onLine !== false);
  AI.canJudge = () => !AI.local() && AI.ready();      // detailed feedback and new exercises must be right – only with Claude
  AI.label = () => (AI.local() ? (window.LLM ? LLM.current().name.replace(/^\w+ – /, "") + " on this device" : "on-device AI") : AI.model());
  AI.why = () => (AI.local() ? (window.LLM ? LLM.why() : "The on-device AI isn't available.") : !AI.hasKey() ? "Add your Anthropic API key in Settings → AI tutor." : st().aiOnline === false ? "The AI tutor is switched off in Settings." : navigator.onLine === false ? "You're offline – the AI tutor needs internet. Everything else works." : "");

  /* ---------- usage (so a personal key never surprises anyone) ---------- */
  const PRICE = { "claude-haiku-5-5": [0.1, 0.5], "claude-sonnet-5-5": [2, 10] };   // $ per million tokens, input / output
  function count(model, u) {
    const s = Store.get(); const m = new Date().toISOString().slice(0, 7);
    s.aiUsage = s.aiUsage && s.aiUsage.month === m ? s.aiUsage : { month: m, calls: 0, inTok: 0, outTok: 0, usd: 0 };
    const p = PRICE[model] || PRICE["claude-sonnet-5-5"];
    s.aiUsage.calls++; s.aiUsage.inTok += u.input_tokens || 0; s.aiUsage.outTok += u.output_tokens || 0;
    s.aiUsage.usd += ((u.input_tokens || 0) * p[0] + (u.output_tokens || 0) * p[1]) / 1e6;
    Store.save();
  }
  AI.usage = () => { const u = Store.get().aiUsage; const m = new Date().toISOString().slice(0, 7); return u && u.month === m ? u : { calls: 0, usd: 0 }; };

  /* ---------- one request, with retries and plain-English errors ---------- */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  AI.call = async ({ system, messages, maxTokens = 900, effort = "low", model } = {}) => {
    if (!AI.ready()) throw new Error(AI.why());
    if (AI.local()) return LLM.chat({ system, messages, maxTokens: Math.min(maxTokens, 400) });
    const mdl = model || AI.model();
    const body = { model: mdl, max_tokens: maxTokens, system, messages, output_config: { effort } };
    let last = null, cut = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST", signal: ctl.signal,
          headers: { "content-type": "application/json", "x-api-key": st().aiKey.trim(), "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
          body: JSON.stringify(body),
        });
        clearTimeout(to);
        if (res.ok) {
          const data = await res.json();
          if (data.usage) count(mdl, data.usage);
          const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
          if (data.stop_reason === "max_tokens") {            // cut off (thinking counts towards the budget): once more with room to spare
            if (cut++ < 2 && body.max_tokens < 8000) { body.max_tokens = Math.min(8000, body.max_tokens * 2); attempt--; continue; }
            throw new Error("The AI's answer was too long and got cut off. Try again.");
          }
          if (!text) throw new Error("The AI sent an empty answer. Try again.");
          return text;
        }
        let msg = ""; try { msg = ((await res.json()).error || {}).message || ""; } catch (e) {}
        if (res.status === 401) throw new Error("The API key was not accepted. Check it in Settings → AI tutor.");
        if (res.status === 403) throw new Error("This API key may not use this model. " + msg);
        if (res.status === 400 && /credit|balance|billing/i.test(msg)) throw new Error("Your Anthropic account has no credit left. Add credit at console.anthropic.com.");
        if (res.status === 400) throw new Error("The request was refused: " + (msg || "bad request"));
        if (res.status === 404) throw new Error(`The model “${mdl}” was not found. Pick another one in Settings → AI tutor.`);
        last = new Error(res.status === 429 ? "Too many requests right now – wait a moment." : res.status === 529 || res.status >= 500 ? "Anthropic's servers are busy – try again in a minute." : "Online error " + res.status);
        if (!(res.status === 429 || res.status >= 500)) throw last;
      } catch (e) {
        clearTimeout(to);
        if (e.name === "AbortError") last = new Error("The AI took too long to answer. Check your connection and try again.");
        else if (e instanceof TypeError) last = new Error("Couldn't reach Anthropic – are you online?");
        else throw e;
      }
      await sleep(1200 * (attempt + 1));
    }
    throw last || new Error("The AI could not answer. Try again.");
  };
  /* JSON answers: ask for JSON, then read it robustly */
  AI.json = async (opts) => {
    const text = await AI.call(opts);
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
    const raw = m[1].trim(); const start = raw.search(/[[{]/);
    try { return JSON.parse(raw.slice(start)); } catch (e) {
      const end = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
      try { return JSON.parse(raw.slice(start, end + 1)); } catch (e2) { throw new Error("The AI's answer could not be read. Try again."); }
    }
  };

  /* ---------- who is learning: the context every request gets ---------- */
  AI.profile = () => {
    const s = Store.get(); const L = DC.curriculum;
    const cur = L.find((l) => !(s.lessons[l.n] && s.lessons[l.n].done)) || L[L.length - 1];
    const weak = Object.entries(s.topics || {}).filter(([k, v]) => Engine.GEN[k] && (v.r || 0) + (v.w || 0) >= 3).map(([k, v]) => ({ t: Engine.GEN[k].title, p: Math.round(((v.r || 0) / ((v.r || 0) + (v.w || 0))) * 100) })).filter((x) => x.p < 80).sort((a, b) => a.p - b.p).slice(0, 5);
    const mist = (s.mistakes || []).slice(0, 8).map((m) => `“${String(m.given || "").slice(0, 60)}” → “${String(m.answer || "").slice(0, 60)}”`);
    const notes = (s.aiNotes || []).slice(0, 15);
    const english = (s.settings.labels || "both") !== "de";
    return {
      level: cur.level, lesson: cur, name: Store.name() || "the learner",
      text: [
        `Learner: ${Store.name() || "(no name)"}, native language not German, explanations in ${english ? "English" : "simple German"}.`,
        `Level: ${cur.level}. Currently on lesson ${cur.pos} of ${L.length}: "${cur.title}" (${(cur.en && cur.en.title) || ""}), topic "${cur.theme}".`,
        s.starterMode && !(s.lessons[L[0].n] || {}).done ? "Complete beginner (doing the picture course): use only very simple words and short sentences, and give English help." : "",
        weak.length ? `Weak grammar topics: ${weak.map((w) => `${w.t} (${w.p}% right)`).join("; ")}.` : "",
        mist.length ? `Recent mistakes (given → correct): ${mist.join("; ")}.` : "",
        notes.length ? `Your own notes about this learner from earlier sessions: ${notes.map((n) => "- " + n).join(" ")}` : "",
      ].filter(Boolean).join("\n"),
    };
  };
  const LEVEL_STYLE = { A1: "only A1 words, present tense and simple Perfekt, sentences of at most 8 words", A2: "A2 vocabulary, main clauses plus weil/dass, sentences of at most 12 words", B1: "B1 vocabulary, normal everyday German", B2: "natural B2 German", C1: "natural, idiomatic C1 German", C2: "fully natural German with nuance" };
  AI.levelStyle = (lv) => LEVEL_STYLE[lv] || LEVEL_STYLE.B1;

  /* ---------- memory: the tutor's notes about this learner ---------- */
  AI.learn = async (transcript) => {
    if (!AI.ready() || !transcript || AI.local()) return;     // the small local model doesn't keep notes – its summaries aren't reliable enough
    const s = Store.get();
    try {
      const out = await AI.json({ maxTokens: 900, system: "You keep short private notes about a German learner for their tutor. Reply with JSON only.", messages: [{ role: "user", content: `Current notes:\n${(s.aiNotes || []).map((n) => "- " + n).join("\n") || "(none)"}\n\nNew session:\n${transcript.slice(-3500)}\n\nReturn {"notes": [...]} – at most 12 short notes (under 15 words each) about this learner's recurring mistakes, strengths, interests and goals that will help future lessons. Keep useful old notes, drop outdated ones. No sensitive personal data.` }] });
      if (out && Array.isArray(out.notes)) { s.aiNotes = out.notes.map((n) => String(n).slice(0, 140)).slice(0, 12); Store.save(); }
    } catch (e) { /* notes are a bonus, never an error for the learner */ }
  };
  AI.forget = () => { const s = Store.get(); s.aiNotes = []; Store.save(); };

  /* ---------- 1. detailed feedback on a free answer ---------- */
  AI.feedback = async ({ task, text, lesson, level }) => {
    const P = AI.profile(); const l = Object.assign({}, lesson || P.lesson); if (level) l.level = level;
    return AI.json({ maxTokens: 2500, effort: "medium", system: `You are an experienced, encouraging German teacher (Goethe/telc examiner). The learner's level is ${l.level}. Judge the answer against the task, at that level – don't demand C1 German from an A2 learner. Explain in English. Never invent errors: if something is correct, don't change it. Reply with JSON only.\n\n${P.text}`,
      messages: [{ role: "user", content: `Lesson: "${l.title}" (${(l.en && l.en.title) || ""}).\nTask: ${task}\nLearner's answer:\n${text}\n\nReturn JSON: {"score": 0-100, "verdict": "one encouraging sentence", "task_fit": "does it answer the task? one sentence", "errors": [{"wrong": "exact words from the answer", "right": "corrected words", "why": "short rule in English"}], "corrected": "the whole answer, corrected, keeping the learner's ideas", "better": "a slightly richer version at level ${l.level}", "tip": "one concrete thing to practise next"}` }] });
  };
  AI.feedbackHtml = (r) => {
    const e = H.esc;
    const sc = Math.max(0, Math.min(100, +r.score || 0));
    return `<div class="ai-fb"><div class="fb-head"><span class="fb-score ${sc >= 65 ? "good" : sc >= 45 ? "mid" : "low"}">${sc}</span><div><b>✨ ${e(r.verdict || "")}</b><br><span class="muted small">${e(r.task_fit || "")}</span></div></div>
      ${(r.errors || []).length ? `<ul class="fb-list">${r.errors.slice(0, 12).map((x) => `<li class="n"><span>✗</span><div><span class="fb-you"><del>${e(x.wrong)}</del></span> → <b>${e(x.right)}</b><br><span class="muted">${e(x.why)}</span></div></li>`).join("")}</ul>` : `<p class="fb-ok">✓ No mistakes found.</p>`}
      ${r.corrected ? `<h4>Corrected</h4><p class="ex ok">${e(r.corrected)} ${UI.say(r.corrected)}</p>` : ""}
      ${r.better ? `<details class="fb-model"><summary>⭐ A richer version</summary><p class="ex">${e(r.better)} ${UI.say(r.better)}</p></details>` : ""}
      ${r.tip ? `<p class="muted"><b>Next:</b> ${e(r.tip)}</p>` : ""}
      <p class="muted small">AI feedback (${e(AI.model())}) – very good, but not perfect. Max's rule check above is the reliable base.</p></div>`;
  };

  /* ---------- 2. new exercises from this learner's mistakes ---------- */
  AI.exercises = async (n = 10) => {
    const P = AI.profile();
    const out = await AI.json({ maxTokens: 6000, effort: "medium", system: `You write German grammar exercises for one specific learner. Level ${P.level}: use ${AI.levelStyle(P.level)}. Every sentence must be 100 % correct standard German. Prefer gaps with exactly one right answer (give a hint like (gehen) or (Dativ) to make it unique); if other answers are also correct, list them in "accept". Reply with JSON only.\n\n${P.text}`,
      messages: [{ role: "user", content: `Write ${n} short exercises that target this learner's weak topics and recent mistakes (if there are none, the current lesson). Mix types. Return JSON: {"items": [{"type": "gap" | "choice", "sentence": "German sentence with ___ for the gap", "answer": "the word(s) for the gap", "accept": ["every other answer that is also correct in this sentence – empty if there is none"], "options": ["for choice only: 3 or 4 options including the answer"], "hint": "e.g. (sprechen) or (Dativ) – optional", "en": "English translation of the full sentence", "why": "one-sentence rule in English", "topic": "short topic name"}]}` }] });
    const items = (out.items || []).filter((x) => x && typeof x.sentence === "string" && /_{3}/.test(x.sentence) && x.answer && String(x.answer).trim());
    // safety net: Max checks every finished sentence; anything he flags is dropped
    const ok = items.filter((x) => { const full = x.sentence.replace(/_{3,}/, String(x.answer).trim()); return Tutor.check(full).issues.length === 0 && (x.type !== "choice" || (Array.isArray(x.options) && x.options.map(String).includes(String(x.answer)))); });
    return ok.map((x) => {
      const full = x.sentence.replace(/_{3,}/, String(x.answer).trim());
      const base = { gen: "ai", topic: x.topic || "AI", title: x.topic || "Your mistakes", prompt: `${H.esc(x.sentence).replace(/_{3,}/, '<span class="gap"></span>')}${x.hint ? ` <span class="muted">${H.esc(x.hint)}</span>` : ""}`, answer: String(x.answer).trim(), full, en: x.en || "", why: H.esc(x.why || "") };
      return x.type === "choice" ? Object.assign(base, { kind: "choice", options: H.shuffle(x.options.map(String).slice(0, 4)) }) : Object.assign(base, { kind: "input", accept: (Array.isArray(x.accept) ? x.accept : []).map(String).filter((a) => a.trim() && Tutor.check(x.sentence.replace(/_{3,}/, a.trim())).issues.length === 0) });
    });
  };

  /* ---------- 3. the speaking partner ---------- */
  AI.partnerTurn = async ({ scenario, history, onToken }) => {
    if (AI.local()) return AI.localPartnerTurn({ scenario, history, onToken });
    const P = AI.profile();
    const sys = `You are a friendly German conversation partner in a role-play. Scenario: ${scenario.role}. Learner level ${P.level}: speak ${AI.levelStyle(P.level)}. Keep every reply to 1–2 short sentences and end with a question or prompt so the learner keeps talking. Stay in role. If the learner's last message has a real mistake, give one correction (only real mistakes, not style). Reply with JSON only.\n\n${P.text}`;
    // the API needs user/assistant turns to alternate: merge repeats (e.g. after a failed reply), keep the last 20 turns
    const msgs = [];
    history.slice(-20).forEach((m) => { const c = m.role === "assistant" ? m.de : m.text; const last = msgs[msgs.length - 1]; if (last && last.role === m.role) last.content += "\n" + c; else msgs.push({ role: m.role, content: c }); });
    if (!msgs.length || msgs[0].role !== "user") msgs.unshift({ role: "user", content: history.length > 20 ? "(The conversation continues.)" : "(The learner is ready. Start the conversation.)" });
    msgs[msgs.length - 1] = Object.assign({}, msgs[msgs.length - 1], { content: msgs[msgs.length - 1].content + `\n\nAnswer with JSON: {"de": "your reply in German", "en": "English translation", "correction": null or {"wrong": "the learner's words", "right": "corrected", "why": "short rule in English"}, "suggest": "one sentence the learner could say next (German)", "end": false}` });
    return AI.json({ system: sys, messages: msgs, maxTokens: 1500 });
  };
  /* on this device: plain German replies (small models are bad at JSON), checked by Max; the learner is corrected by Max */
  const firstIssue = (t) => { const r = Tutor.check(t); return r.issues.length ? { wrong: t, right: r.fixed, why: String(r.issues[0].why || r.issues[0].rule || "").replace(/<[^>]+>/g, "") } : null; };
  AI.localPartnerTurn = async ({ scenario, history, onToken }) => {
    const P = AI.profile();
    const sys = `Du bist ein freundlicher Gesprächspartner in einem Rollenspiel für Deutschlerner. Rolle: ${scenario.role}. Niveau ${P.level}: ${AI.levelStyle(P.level)}. Antworte NUR auf Deutsch, mit höchstens zwei kurzen, einfachen Sätzen, und stelle am Ende eine Frage. Keine Übersetzung, keine Erklärungen, keine Listen, keine Anführungszeichen.`;
    const msgs = [];
    history.slice(-10).forEach((m) => { const c = m.role === "assistant" ? m.de : m.text; const last = msgs[msgs.length - 1]; if (last && last.role === m.role) last.content += "\n" + c; else msgs.push({ role: m.role, content: c }); });
    if (!msgs.length || msgs[0].role !== "user") msgs.unshift({ role: "user", content: "Hallo! Fang bitte an." });
    const clean = (t) => String(t).replace(/^\s*(\w+\s?)?(partner|assistant|kellner\w*|nachbar\w*)\s*:\s*/i, "").replace(/\(.*?\)/g, "").replace(/["„“*_#]/g, "").split(/\n+/)[0].replace(/\s+([.,!?;:])/g, "$1").replace(/\s{2,}/g, " ").trim().split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
    const live = onToken ? (t) => onToken(clean(t)) : null;
    let de = clean(await LLM.chat({ system: sys, messages: msgs, maxTokens: 120, onToken: live }));
    // one more try if Max finds a mistake, English slips in, or the sentences are too long for a beginner
    const tooLong = (t) => /^A[12]$/.test(P.level) && t.split(/(?<=[.!?])\s+/).some((x) => x.split(/\s+/).length > (P.level === "A1" ? 10 : 14));
    if (!de || Tutor.check(de).issues.length || /\b(the|you|and|is)\b/i.test(de) || tooLong(de)) {
      onToken && onToken("…");
      const again = clean(await LLM.chat({ system: sys + (tooLong(de) ? " Sehr kurze Sätze!" : ""), messages: msgs, maxTokens: 120, temperature: 0.3, onToken: live }));
      if (again) de = again;
    }
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    return { de, en: "", correction: lastUser ? firstIssue(lastUser.text) : null, suggest: (scenario.ideas || [])[history.filter((m) => m.role === "user").length % Math.max(1, (scenario.ideas || []).length)] || "" };
  };
  AI.localSummary = ({ history }) => {
    const said = history.filter((m) => m.role === "user").map((m) => m.text);
    const mistakes = said.map(firstIssue).filter(Boolean);
    const words = said.join(" ").split(/\s+/).filter(Boolean).length;
    const score = Math.max(20, Math.min(100, Math.round(100 - (mistakes.length / Math.max(1, said.length)) * 60 - (words / Math.max(1, said.length) < 4 ? 15 : 0))));
    return { score, summary: `You answered ${said.length} times with ${words} words${mistakes.length ? ` – Max found ${mistakes.length} sentence${mistakes.length > 1 ? "s" : ""} to fix` : " – Max found no rule mistakes"}.`, good: [said.length >= 5 ? "You kept the conversation going." : "", words / Math.max(1, said.length) >= 6 ? "You used full sentences." : "", !mistakes.length ? "Clean grammar." : ""].filter(Boolean), mistakes, words: [], next: mistakes.length ? "Practise the corrected sentences out loud, then talk again." : "Try a harder scenario or a longer answer each time." };
  };
  AI.partnerSummary = async ({ scenario, history }) => {
    if (AI.local()) return AI.localSummary({ history });
    const P = AI.profile();
    const t = history.map((m) => (m.role === "user" ? "Learner: " + m.text : "Partner: " + m.de)).join("\n");
    return AI.json({ maxTokens: 2500, effort: "medium", system: `You are a German teacher reviewing a short spoken role-play of a level ${P.level} learner. Be encouraging and specific. Explain in English. Reply with JSON only.`,
      messages: [{ role: "user", content: `Scenario: ${scenario.title}\n${t}\n\nReturn JSON: {"score": 0-100, "summary": "two sentences", "good": ["up to 3 things done well"], "mistakes": [{"wrong": "...", "right": "...", "why": "..."}], "words": [{"de": "useful word or phrase with article", "en": "meaning"}], "next": "one concrete practice tip"}` }] });
  };
})();
