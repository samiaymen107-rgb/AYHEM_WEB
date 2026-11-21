import { createAyhemAIClient } from "./ayhem-ai-client.js";

/**
 * Compatibility facade for older AYHEM modules.
 * Preserves the legacy { output } response shape while using the single
 * server-side gateway contract. No provider credentials are accepted here.
 */
export function createAyhemLegacyAdapter({
  clientFactory = createAyhemAIClient,
  endpointResolver = () =>
    globalThis.window?.AYHEM_WORKER_URL ||
    globalThis.document?.querySelector?.('meta[name="ayhem-worker-url"]')?.content ||
    "",
} = {}) {
  return async function talkToAyhem(input) {
    const endpoint = endpointResolver();
    if (typeof endpoint !== "string" || !endpoint) {
      throw new Error("AYHEM AI gateway endpoint is not configured.");
    }

    const client = clientFactory({ endpoint });
    const health = await client.health();
    if (health.ready !== true || health.aiConfigured !== true || health.rateLimitConfigured !== true) {
      throw new Error("AYHEM AI provider is not configured.");
    }

    const result = await client.ask(input);
    return Object.freeze({
      output: result.output,
      unit: result.unit,
      requestId: result.requestId || null,
    });
  };
}

export const talkToAyhem = createAyhemLegacyAdapter();

if (typeof window !== "undefined") {
  window.talkToAyhem = talkToAyhem;
  window.AYHEM_SEND = async input => (await talkToAyhem(input)).output;
}
