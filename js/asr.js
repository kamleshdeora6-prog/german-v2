/* Deutsch Coach – speech recognition choice.
   "whisper": OpenAI Whisper on this device (download once, ~80 MB, then offline; understands learners
              better and sends no audio anywhere).
   "browser": the browser's own recognition (Chrome sends audio to Google; needs internet).
   The Android and iOS apps keep using the phone's own recognition through the native bridge.
   If Whisper fails for any reason, the browser's recognition takes over – speaking never just breaks. */
(function () {
  "use strict";
  const ASR = (window.ASR = {});
  const MODEL = "Xenova/whisper-base";
  ASR.MODEL = MODEL; ASR.SIZE_MB = 80;
  let worker = null, ready = false, seq = 0;
  const waiting = new Map(); const progress = new Set();
  ASR.mode = () => (Store.get().settings.asr || "auto");
  ASR.supported = () => typeof Worker !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && typeof MediaRecorder !== "undefined" && /^https?:$/.test(location.protocol) && !window.AndroidBridge;
  ASR.downloaded = () => !!Store.get().settings.asrReady;
  /* use Whisper? – chosen explicitly, or "auto" once it has been downloaded, or when the browser has no recognition at all */
  ASR.active = () => ASR.supported() && (ASR.mode() === "whisper" || (ASR.mode() === "auto" && (ASR.downloaded() || !(window.SpeechRecognition || window.webkitSpeechRecognition))));
  ASR.onProgress = (f) => { progress.add(f); return () => progress.delete(f); };
  function boot() {
    if (worker) return worker;
    worker = new Worker("js/asr-worker.js", { type: "module" });
    worker.onmessage = ({ data }) => {
      if (data.type === "progress") progress.forEach((f) => f(data));
      if (data.type === "ready") { ready = true; const s = Store.get(); s.settings.asrReady = true; Store.save(); const w = waiting.get("load"); if (w) { waiting.delete("load"); w.res(); } }
      if (data.type === "text" || data.type === "error") {
        const w = waiting.get(data.id ?? "load"); if (!w) return; waiting.delete(data.id ?? "load");
        data.type === "text" ? w.res(data.text) : w.rej(new Error(data.message));
      }
    };
    worker.onerror = (e) => { const err = new Error("Whisper could not start: " + (e.message || "worker error")); waiting.forEach((w) => w.rej(err)); waiting.clear(); worker = null; ready = false; };
    return worker;
  }
  ASR.load = () => new Promise((res, rej) => { if (ready) return res(); waiting.set("load", { res, rej }); boot().postMessage({ type: "load", model: MODEL }); });

  /* record until the learner stops talking (1.4 s of silence), taps again, or 25 s pass */
  ASR.record = ({ onLevel, stopSignal } = {}) => new Promise(async (res, rej) => {
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } }); }
    catch (e) { return rej(new Error("Microphone blocked. Allow the microphone for this site (lock icon in the address bar).")); }
    const rec = new MediaRecorder(stream); const chunks = [];
    const ac = new (window.AudioContext || window.webkitAudioContext)(); const src = ac.createMediaStreamSource(stream); const an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an);
    const buf = new Float32Array(an.fftSize); let heard = false, quietSince = 0; const t0 = Date.now();
    const tick = () => {
      if (rec.state !== "recording") return;
      an.getFloatTimeDomainData(buf); let sum = 0; for (const v of buf) sum += v * v; const rms = Math.sqrt(sum / buf.length);
      onLevel && onLevel(Math.min(1, rms * 12));
      if (rms > 0.02) { heard = true; quietSince = 0; } else if (heard && !quietSince) quietSince = Date.now();
      if ((heard && quietSince && Date.now() - quietSince > 1400) || Date.now() - t0 > 25000 || (stopSignal && stopSignal.stop)) return rec.stop();
      requestAnimationFrame(tick);
    };
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop()); try { ac.close(); } catch (e) {}
      if (!heard) return rej(new Error("I didn't hear anything. Speak a little louder, close to the microphone."));
      try { res(await decode(new Blob(chunks, { type: rec.mimeType || "audio/webm" }))); } catch (e) { rej(new Error("The recording could not be read.")); }
    };
    rec.start(); tick();
  });
  async function decode(blob) {
    const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 16000, 16000);
    const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
    // resample to 16 kHz mono, which Whisper expects
    const off = new OfflineAudioContext(1, Math.ceil(audio.duration * 16000), 16000);
    const s = off.createBufferSource(); s.buffer = audio; s.connect(off.destination); s.start();
    return (await off.startRendering()).getChannelData(0);
  }
  ASR.transcribe = (audio) => new Promise((res, rej) => { const id = ++seq; waiting.set(id, { res, rej }); boot().postMessage({ type: "run", id, model: MODEL, audio }, [audio.buffer]); });
  const HALLUCINATION = /untertitel|im auftrag des zdf|zdf für funk|vielen dank (fürs|für's|für das) zu(schauen|hören)|bis zum nächsten mal|amara\.org|copyright|www\.|swr \d{4}|^\W*$/i;
  ASR.clean = (t) => { t = String(t || "").replace(/\[[^\]]*\]|\([^)]*musik[^)]*\)|\*[^*]*\*/gi, "").replace(/\s+/g, " ").trim(); return HALLUCINATION.test(t) || t.length < 2 ? "" : t; };
  ASR.listen = async (opts = {}) => {
    const audio = await ASR.record(opts); opts.onStage && opts.onStage("transcribing"); await ASR.load();
    const t = ASR.clean(await ASR.transcribe(audio));
    if (!t) throw new Error("I couldn't make out any words – try again, a little closer to the microphone.");
    return t;
  };
})();
