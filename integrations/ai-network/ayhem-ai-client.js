/**
 * AYHEM AI gateway client.
 *
 * This client calls the server-side Worker gateway. It never accepts or stores
 * provider API keys. Configure the HTTPS gateway URL at runtime.
 *
 * Usage:
 *   const ai = createAyhemAIClient({ endpoint: window.AYHEM_WORKER_URL });
 *   const answer = await ai.ask("حلل هذه المعلومة");
 */
export function createAyhemAIClient({
  endpoint,
  fetchImpl = globalThis.fetch,
  timeoutMs = 30000,
  maxInputLength = 8000,
} = {}) {
  if (typeof endpoint !== "string" || !/^https:\/\//i.test(endpoint)) {
    throw new TypeError("A valid HTTPS AYHEM gateway endpoint is required.");
  }
  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required.");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) {
    throw new RangeError("timeoutMs must be between 1000 and 60000.");
  }

  const base = endpoint.replace(/\/+$/, "");

  async function request(path, init = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(base + path, {
        ...init,
        signal: controller.signal,
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.error || `AYHEM gateway returned HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        throw new Error("AYHEM gateway request timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return Object.freeze({
    async health() {
      const result = await request("/health", { method: "GET" });
      const healthFields = [
        "aiConfigured",
        "rateLimitConfigured",
        "originConfigured",
        "ready",
      ];
      const validHealth =
        result.service === "AYHEM" &&
        result.status === "online" &&
        result.mode === "authenticated-gateway" &&
        healthFields.every(field => typeof result[field] === "boolean") &&
        result.ready === (
          result.aiConfigured &&
          result.rateLimitConfigured &&
          result.originConfigured
        );
      if (!validHealth) {
        throw new Error("Unexpected or inconsistent AYHEM health response.");
      }
      return result;
    },

    async ask(input) {
      if (typeof input !== "string" || !input.trim()) {
        throw new TypeError("Input must be a non-empty string.");
      }
      const normalized = input.trim();
      if (normalized.length > maxInputLength) {
        throw new RangeError(`Input exceeds the ${maxInputLength}-character limit.`);
      }

      const result = await request("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: normalized }),
      });
      const validRequestId =
        typeof result.requestId === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.requestId);
      if (
        result.unit !== "U01-Σ" ||
        typeof result.output !== "string" ||
        !result.output.trim() ||
        !validRequestId
      ) {
        throw new Error("Invalid AYHEM AI response.");
      }
      return Object.freeze({
        output: result.output,
        unit: result.unit,
        requestId: result.requestId,
      });
    },
  });
}
