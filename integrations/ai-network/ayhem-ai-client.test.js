import test from "node:test";
import assert from "node:assert/strict";
import { createAyhemAIClient } from "./ayhem-ai-client.js";

test("requires an HTTPS gateway and a fetch implementation", () => {
  assert.throws(() => createAyhemAIClient({ endpoint: "http://localhost" }), /HTTPS/);
  assert.throws(() => createAyhemAIClient({ endpoint: "https://ai.example", fetchImpl: null }), /fetch/);
});

test("rejects empty and oversized prompts before network access", async () => {
  let called = false;
  const client = createAyhemAIClient({
    endpoint: "https://ai.example",
    maxInputLength: 4,
    fetchImpl: async () => { called = true; throw new Error("should not run"); },
  });
  await assert.rejects(client.ask("   "), /non-empty/);
  await assert.rejects(client.ask("12345"), /limit/);
  assert.equal(called, false);
});

test("validates the gateway response and returns normalized output", async () => {
  const client = createAyhemAIClient({
    endpoint: "https://ai.example/",
    fetchImpl: async (url, init) => {
      assert.equal(url, "https://ai.example/");
      assert.equal(init.method, "POST");
      return new Response(JSON.stringify({ unit: "U01-Σ", output: "مرحبا", requestId: "r-1" }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    },
  });
  assert.deepEqual(await client.ask(" أهلا "), {
    output: "مرحبا", unit: "U01-Σ", requestId: "r-1",
  });
});

test("rejects unexpected response envelopes", async () => {
  const client = createAyhemAIClient({
    endpoint: "https://ai.example",
    fetchImpl: async () => new Response(JSON.stringify({ output: "fake" }), { status: 200 }),
  });
  await assert.rejects(client.ask("test"), /Invalid AYHEM AI response/);
});

test("surfaces gateway errors without retrying billable requests", async () => {
  let calls = 0;
  const client = createAyhemAIClient({
    endpoint: "https://ai.example",
    fetchImpl: async () => {
      calls++;
      return new Response(JSON.stringify({ error: "ai_service_unavailable" }), { status: 502 });
    },
  });
  await assert.rejects(client.ask("test"), /ai_service_unavailable/);
  assert.equal(calls, 1);
});
