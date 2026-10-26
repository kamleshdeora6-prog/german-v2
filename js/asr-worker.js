/* Deutsch Coach – offline speech recognition (OpenAI Whisper, running on this device).
   A module worker, so the app never freezes while it listens. Library and runtime come from this
   repo (vendor/); the model is downloaded once and then cached by the browser (works offline afterwards). */
import { pipeline, env } from "../vendor/transformers-4.3.1/transformers.min.js";

// everything from this app's own site: the library and its WebAssembly runtime are in vendor/, and the
// model is taken from models/ when the GitHub Action has put it there – otherwise once from Hugging Face
env.allowLocalModels = true;
env.localModelPath = new URL("../models/", import.meta.url).href;
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.backends.onnx.wasm.wasmPaths = new URL("../vendor/ort-1.31.0/", import.meta.url).href;

let asr = null, loading = null, modelId = null;

async function load(model) {
  if (asr && modelId === model) return asr;
  if (loading && modelId === model) return loading;
  modelId = model;
  const opts = (device, dtype) => ({ device, dtype, progress_callback: (p) => { if (p.status === "progress") self.postMessage({ type: "progress", file: p.file, loaded: p.loaded, total: p.total }); } });
  loading = (async () => {
    // WebAssembly with the 8-bit model: works in every modern browser and is fast enough for short answers
    asr = await pipeline("automatic-speech-recognition", model, opts("wasm", "q8"));
    return asr;
  })();
  try { return await loading; } finally { loading = null; }
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") { await load(data.model); self.postMessage({ type: "ready" }); return; }
    if (data.type === "run") {
      const t = await load(data.model);
      const out = await t(data.audio, { language: "german", task: "transcribe", chunk_length_s: 30 });
      self.postMessage({ type: "text", id: data.id, text: String((out && out.text) || "").trim() });
    }
  } catch (e) {
    self.postMessage({ type: "error", id: data.id, message: String((e && e.message) || e) });
  }
};
