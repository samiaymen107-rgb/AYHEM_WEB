/**
 * AYHEM browser bridge.
 * Set window.AYHEM_WORKER_URL to the deployed Worker URL before loading this file.
 * Never place API keys or private tokens in browser code.
 */
(function () {
  "use strict";

  window.talkToAyhem = async function (input) {
    const endpoint = window.AYHEM_WORKER_URL;
    if (typeof endpoint !== "string" || !/^https:\/\//.test(endpoint)) {
      throw new Error("AYHEM_WORKER_URL is not configured.");
    }
    if (typeof input !== "string" || !input.trim()) {
      throw new TypeError("AYHEM input must be a non-empty string.");
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.unit !== "U01-Σ" || typeof data.output !== "string") {
      throw new Error(data.error || "AYHEM Worker request failed.");
    }
    return data.output;
  };
})();
