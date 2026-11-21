import test from "node:test";
import assert from "node:assert/strict";
import { createAyhemLegacyAdapter } from "./legacy-compat.js";

test("legacy adapter fails closed when gateway URL is missing", async () => {
  const send = createAyhemLegacyAdapter({ endpointResolver: () => "" });
  await assert.rejects(send("مرحبا"), /not configured/);
});

test("legacy adapter checks provider readiness and preserves output shape", async () => {
  const send = createAyhemLegacyAdapter({
    endpointResolver: () => "https://gateway.example",
    clientFactory: ({ endpoint }) => {
      assert.equal(endpoint, "https://gateway.example");
      return {
        health: async () => ({ aiConfigured: true }),
        ask: async input => ({ output: `answer: ${input}`, unit: "U01-Σ", requestId: "req-2" }),
      };
    },
  });

  assert.deepEqual(await send("سؤال"), {
    output: "answer: سؤال",
    unit: "U01-Σ",
    requestId: "req-2",
  });
});

test("legacy adapter refuses to send when provider is not ready", async () => {
  const send = createAyhemLegacyAdapter({
    endpointResolver: () => "https://gateway.example",
    clientFactory: () => ({
      health: async () => ({ aiConfigured: false }),
      ask: async () => { throw new Error("must not call ask"); },
    }),
  });
  await assert.rejects(send("سؤال"), /provider is not configured/);
});
