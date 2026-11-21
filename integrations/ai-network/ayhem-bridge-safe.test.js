import test from "node:test";
import assert from "node:assert/strict";

test("legacy browser bridge includes the Cloudflare Access session cookie", async () => {
  const previousWindow = globalThis.window;
  const previousFetch = globalThis.fetch;
  let capturedInit;
  try {
    globalThis.window = { AYHEM_WORKER_URL: "https://gateway.example" };
    globalThis.fetch = async (_url, init) => {
      capturedInit = init;
      return new Response(JSON.stringify({
        unit: "U01-Σ",
        output: "bridge response",
        requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    await import("../../ayhem-bridge-safe.js?access-credentials-test");
    const output = await globalThis.window.talkToAyhem(" hello ");

    assert.equal(output, "bridge response");
    assert.equal(capturedInit.credentials, "include");
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    globalThis.fetch = previousFetch;
  }
});
