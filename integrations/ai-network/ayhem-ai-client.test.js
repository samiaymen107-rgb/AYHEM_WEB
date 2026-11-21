import test from "node:test";
import assert from "node:assert/strict";
import { createAyhemAIClient } from "./ayhem-ai-client.js";

const validHealth = {
  service: "AYHEM",
  status: "online",
  mode: "authenticated-gateway",
  aiConfigured: true,
  rateLimitConfigured: true,
  originConfigured: true,
  ready: true,
};

const validResponse = {
  unit: "U01-Σ",
  output: "مرحبا",
  requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
};

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
      assert.equal(init.credentials, "include");
      return new Response(JSON.stringify(validResponse), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    },
  });
  assert.deepEqual(await client.ask(" أهلا "), validResponse);
});

test("rejects an invalid or missing UUID request identifier", async () => {
  for (const requestId of ["r-1", "", null, undefined]) {
    const client = createAyhemAIClient({
      endpoint: "https://ai.example",
      fetchImpl: async () => new Response(JSON.stringify({ ...validResponse, requestId }), { status: 200 }),
    });
    await assert.rejects(client.ask("test"), /Invalid AYHEM AI response/);
  }
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

test("accepts only a complete, internally consistent health response", async () => {
  const client = createAyhemAIClient({
    endpoint: "https://ai.example",
    fetchImpl: async (_url, init) => {
      assert.equal(init.credentials, "include");
      return new Response(JSON.stringify(validHealth), { status: 200 });
    },
  });
  assert.deepEqual(await client.health(), validHealth);
});

test("rejects incomplete or contradictory health readiness", async () => {
  const invalid = [
    { service: "AYHEM", status: "online" },
    { ...validHealth, originConfigured: false, ready: true },
    { ...validHealth, mode: "anonymous" },
    { ...validHealth, rateLimitConfigured: "yes" },
  ];
  for (const health of invalid) {
    const client = createAyhemAIClient({
      endpoint: "https://ai.example",
      fetchImpl: async () => new Response(JSON.stringify(health), { status: 200 }),
    });
    await assert.rejects(client.health(), /health response/);
  }
});


test("allows an explicit supported credential mode and rejects invalid modes", () => {
  assert.throws(
    () => createAyhemAIClient({ endpoint: "https://ai.example", credentials: "invalid" }),
    /credentials must be omit, same-origin, or include/,
  );
  assert.doesNotThrow(
    () => createAyhemAIClient({ endpoint: "https://ai.example", credentials: "include" }),
  );
});
