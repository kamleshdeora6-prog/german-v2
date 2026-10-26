/* Deutsch Coach – an AI tutor that runs entirely on this device (free, no account, offline).
   Engine: WebLLM (WebGPU) with Meta's Llama 3.2, which officially supports German.
   Where the model comes from, in this order:
     1. this app's own site (models/…) – put there once by the GitHub Action "Add the offline AI models"
     2. otherwise Hugging Face, once
   After the first download it lives in the browser's storage on the device and works offline.

   Small models make mistakes, so in this app the local model only *talks*. Everything that has to be
   right – correcting the learner, answer keys, feedback – stays with Max's checked rules. */
(function () {
  "use strict";
  const LLM = (window.LLM = {});
  const BASE = new URL(".", document.baseURI).href;
  const LIB = BASE + "vendor/web-llm-0.2.86/";
  /* each model in two builds: f16 (smaller, faster – needs the GPU feature "shader-f16") and f32 (works on every WebGPU device) */
  const V = (n, v16, v32) => ({ f16: { id: `Llama-3.2-${n}-Instruct-q4f16_1-MLC`, lib: `Llama-3.2-${n}-Instruct-q4f16_1_cs1k-webgpu.wasm`, vram: v16, features: ["shader-f16"] }, f32: { id: `Llama-3.2-${n}-Instruct-q4f32_1-MLC`, lib: `Llama-3.2-${n}-Instruct-q4f32_1_cs1k-webgpu.wasm`, vram: v32, features: [] } });
  const G4 = { f16: { id: "gemma-4-E2B-it-q4f16_1-MLC", lib: "gemma-4-E2B-it-q4f16_1_cs512-webgpu.wasm", vram: 3388, features: ["shader-f16"], extra: { model_manifest: "mlc-model-manifest.json", buffer_size_required_bytes: 201326592 } },
               f32: { id: "gemma-4-E2B-it-q4f32_1-MLC", lib: "gemma-4-E2B-it-q4f32_1_cs512-webgpu.wasm", vram: 3863, features: [], extra: { model_manifest: "mlc-model-manifest.json", buffer_size_required_bytes: 201326592 } } };
  LLM.MODELS = [
    { key: "1b", name: "Small – Llama 3.2 1B", size: "about 0.7 GB", hint: "phones and most laptops", v: V("1B", 879, 1128) },
    { key: "3b", name: "Better – Llama 3.2 3B", size: "about 1.8 GB", hint: "laptops and PCs", v: V("3B", 2264, 2951) },
    { key: "g4", name: "Best – Gemma 4 E2B (Google, 2026)", size: "about 2–3 GB", hint: "PCs with 4 GB+ graphics memory", v: G4 },
  ];
  const st = () => Store.get().settings;
  LLM.current = () => LLM.MODELS.find((m) => m.key === st().llmModel || (m.v.f16.id === st().llmModel)) || LLM.MODELS[0];
  /* which build this device can run */
  let f16 = null, maxBuf = 0;
  async function build(m) {
    if (f16 === null) { try { const a = await navigator.gpu.requestAdapter(); f16 = !!(a && a.features.has("shader-f16")); maxBuf = (a && a.limits && a.limits.maxStorageBufferBindingSize) || 0; } catch (e) { f16 = false; } }
    return m.v[f16 ? "f16" : "f32"];
  }
  /* can this device's graphics chip run the model at all? (graphics memory itself can't be read in a browser) */
  LLM.fits = async (m = LLM.current()) => { if (!LLM.supported()) return false; const b = await build(m); const need = (b.extra && b.extra.buffer_size_required_bytes) || 0; return !need || maxBuf >= need; };
  LLM.supported = () => !!navigator.gpu && !window.AndroidBridge && /^https?:$/.test(location.protocol) && typeof Worker !== "undefined";
  LLM.downloaded = (m = LLM.current()) => !!((st().llmReady || {})[m.v.f16.id] || (st().llmReady || {})[m.v.f32.id]);
  LLM.why = () => !navigator.gpu ? "This browser can't run the on-device AI – it needs WebGPU. Use Chrome or Edge on a PC, or Chrome on a newer Android phone." : window.AndroidBridge ? "The on-device AI runs in the browser version of the app (Chrome), not inside the Android app." : !LLM.downloaded() ? "Download the on-device AI once in Settings → AI tutor." : "";

  /* where to load the weights from: our own site if the GitHub Action put them there */
  let selfHosted = null;
  async function hostFor(b) {
    if (selfHosted === null) { try { const r = await fetch(BASE + "models/manifest.json", { cache: "no-cache" }); selfHosted = r.ok ? await r.json() : {}; } catch (e) { selfHosted = {}; } }
    return (selfHosted.llm || []).includes(b.id) ? BASE + `models/${b.id}/resolve/main/` : `https://huggingface.co/mlc-ai/${b.id}`;
  }
  async function appConfig(b) {
    return { model_list: [Object.assign({ model: await hostFor(b), model_id: b.id, model_lib: LIB + "libs/" + b.lib, vram_required_MB: b.vram, low_resource_required: true, required_features: b.features, overrides: { context_window_size: 4096 } }, b.extra || {})] };
  }
  LLM.source = async (m = LLM.current()) => { if (!LLM.supported()) return ""; const b = await build(m); return (await hostFor(b)).startsWith(BASE) ? "this app's own site" : "Hugging Face"; };

  let engine = null, engineFor = null, loading = null;
  const progress = new Set();
  LLM.onProgress = (f) => { progress.add(f); return () => progress.delete(f); };
  LLM.load = async (m = LLM.current()) => {
    if (!LLM.supported()) throw new Error(LLM.why());
    const b = await build(m);
    if (engine && engineFor === b.id) return engine;
    if (loading) return loading;
    loading = (async () => {
      try {
        const lib = await import(LIB + "index.js");
        if (engine) { try { await engine.unload(); } catch (e) {} engine = null; }
        const worker = new Worker(BASE + "js/llm-worker.js", { type: "module" });
        engine = await lib.CreateWebWorkerMLCEngine(worker, b.id, { appConfig: await appConfig(b), initProgressCallback: (p) => progress.forEach((f) => f(p)) });
        engineFor = b.id;
        st().llmReady = Object.assign({}, st().llmReady, { [b.id]: Date.now() }); Store.save();
        return engine;
      } catch (e) {
        engine = null; engineFor = null;
        const msg = String((e && e.message) || e);
        if (/webgpu|adapter|gpu/i.test(msg)) throw new Error("Your graphics chip couldn't start the on-device AI (WebGPU). Try Chrome or Edge, update the graphics driver, or pick the small model.");
        if (/quota|storage|space/i.test(msg)) throw new Error("Not enough free storage for the model. Free some space or pick the small model.");
        if (/fetch|network|Failed to fetch|NetworkError/i.test(msg)) throw new Error("The model download was interrupted. Check the connection and try again – finished parts are kept.");
        throw new Error("The on-device AI couldn't start: " + msg.slice(0, 160));
      } finally { loading = null; }
    })();
    return loading;
  };
  LLM.isLoaded = () => !!engine;
  LLM.remove = async (m = LLM.current()) => {
    const lib = await import(LIB + "index.js");
    try { if (engine) { await engine.unload(); engine = null; engineFor = null; } } catch (e) {}
    for (const b of [m.v.f16, m.v.f32]) { try { await lib.deleteModelAllInfoInCache(b.id, await appConfig(b)); } catch (e) {} }
    const r = Object.assign({}, st().llmReady); delete r[m.v.f16.id]; delete r[m.v.f32.id]; st().llmReady = r; Store.save();
  };
  LLM._build = build;   // for tests
  /* a sensible first choice: the small model on phones, the 3B model on computers */
  LLM.recommended = () => ((navigator.userAgentData && navigator.userAgentData.mobile) || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) ? "1b" : "3b");

  /* one answer. messages: [{role: "user"|"assistant", content}] */
  /* the model frees the graphics chip after 5 idle minutes – it costs battery while it is loaded */
  let idle = null;
  const touch = () => { clearTimeout(idle); idle = setTimeout(async () => { if (engine) { try { await engine.unload(); } catch (e) {} engine = null; engineFor = null; } }, 5 * 60e3); };
  LLM.lastStats = null;
  /* one answer, streamed: onToken(textSoFar) is called while it is written */
  LLM.chat = async ({ system, messages, maxTokens = 300, temperature = 0.6, onToken }) => {
    const e = await LLM.load(); touch();
    const msgs = [{ role: "system", content: system }].concat(messages.slice(-12));
    const t0 = performance.now(); let text = "", usage = null;
    const stream = await e.chat.completions.create({ messages: msgs, max_tokens: Math.min(maxTokens, 600), temperature, top_p: 0.9, frequency_penalty: 0.3, stream: true, stream_options: { include_usage: true } });   // no extra_body.enable_thinking: WebLLM would add Qwen-style <think> tags to any model
    for await (const chunk of stream) {
      const d = chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content;
      if (d) { text += d; onToken && onToken(text); }
      if (chunk.usage) usage = chunk.usage;
    }
    text = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const secs = (performance.now() - t0) / 1000;
    LLM.lastStats = { secs, tokens: (usage && usage.completion_tokens) || Math.round(text.length / 4), tps: (usage && usage.extra && usage.extra.decode_tokens_per_s) || Math.round(text.length / 4 / Math.max(0.1, secs)) };
    touch();
    if (!text) throw new Error("The on-device AI didn't answer. Try again.");
    return text;
  };

  /* German self-test on this device: six learner sentences; every reply is scored by Max's rules
     (German only, no grammar problems, short, ends with a question) and timed. */
  const TEST = ["Hallo! Ich heiße Ravi und komme aus Indien.", "Ich möchte einen Kaffee mit Milch, bitte.", "Ich habe seit gestern Kopfschmerzen.", "Am Wochenende habe ich mit Freunden Fußball gespielt.", "Wie viel kostet die Wohnung im Monat?", "Ich finde Homeoffice gut, weil ich Zeit spare."];
  const EN = /\b(the|you|and|is|are|what|this|that|your|have|i'm|it's|with|for)\b/i;
  LLM.selfTest = async (m = LLM.current(), onStep) => {
    const sys = "Du bist ein freundlicher Gesprächspartner für Deutschlerner auf Niveau A2. Antworte NUR auf Deutsch, mit höchstens zwei kurzen, einfachen Sätzen, und stelle am Ende eine Frage.";
    const rows = []; let tps = 0;
    for (let i = 0; i < TEST.length; i++) {
      onStep && onStep(i, TEST.length);
      const r = await LLM.chat({ system: sys, messages: [{ role: "user", content: TEST[i] }], maxTokens: 120, temperature: 0.4 });
      const sents = r.split(/(?<=[.!?])\s+/).filter(Boolean); const words = r.split(/\s+/).filter(Boolean).length;
      const issues = sents.reduce((a, x) => a + Tutor.check(x).issues.length, 0);
      const german = !EN.test(r) && /[a-zäöüß]/i.test(r);
      let sc = (german ? 30 : 0) + Math.max(0, 40 - issues * 20) + (/\?\s*$/.test(r) ? 15 : 0) + (sents.length <= 3 && words <= 30 ? 15 : 0);
      rows.push({ user: TEST[i], reply: r, score: sc, issues, german }); tps += LLM.lastStats.tps;
    }
    const res = { model: m.key, score: Math.round(rows.reduce((a, x) => a + x.score, 0) / rows.length), tps: Math.round(tps / rows.length), rows, at: Date.now() };
    st().llmTest = Object.assign({}, st().llmTest, { [m.key]: { score: res.score, tps: res.tps, at: res.at } }); Store.save();
    return res;
  };
})();
