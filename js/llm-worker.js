/* Deutsch Coach – the on-device language model runs here, off the main thread (WebLLM + WebGPU).
   The library is stored in the repo (vendor/), so nothing is loaded from third-party servers. */
import { WebWorkerMLCEngineHandler } from "../vendor/web-llm-0.2.86/index.js";

const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (msg) => handler.onmessage(msg);
