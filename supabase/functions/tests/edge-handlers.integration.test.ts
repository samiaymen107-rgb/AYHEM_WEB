// Runtime integration tests for the real AYHEM Edge Function handlers.
// All upstream requests are intercepted locally. No network, provider credits, or secrets are used.
import { handler as aiHandler } from "../ayhem-openai-chat/index.ts";
import { handler as tinyfishRunHandler } from "../ayhem-tinyfish-run/index.ts";
import { handler as tinyfishHealthHandler } from "../ayhem-tinyfish-health/index.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function equal(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}
function request(url: string, method: string, body?: unknown) {
  return new Request(url, {
    method,
    headers: { Authorization: "Bearer test-user-token", "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
const envKeys = ["GROQ_API_KEY", "OPENAI_API_KEY", "AYHEM_AI_PROVIDER", "TINYFISH_API_KEY"];
async function isolated(run: () => Promise<void>) {
  const old = new Map(envKeys.map((key) => [key, Deno.env.get(key)]));
  const originalFetch = globalThis.fetch;
  try { await run(); }
  finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of old) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

Deno.test("AYHEM Edge handlers: authenticated runtime paths with mocked upstreams", async () => {
  await isolated(async () => {
    Deno.env.set("GROQ_API_KEY", "test-only-groq-key");
    Deno.env.set("OPENAI_API_KEY", "test-only-openai-key");
    Deno.env.delete("AYHEM_AI_PROVIDER");
    let groqCalls = 0;
    globalThis.fetch = async (input, init) => {
      groqCalls++;
      equal(String(input), "https://api.groq.com/openai/v1/chat/completions", "AI must call Groq endpoint");
      const payload = JSON.parse(String(init?.body));
      assert(payload.messages.some((m: {content:string}) => m.content.includes("MEMORY_MARKER_AYHEM")), "memory context must reach Groq prompt");
      return Response.json({ choices: [{ message: { content: "AYHEM_RUNTIME_OK" } }] });
    };
    const aiResponse = await aiHandler(request("https://local.test/ai", "POST", {
      message: "اختبار التشغيل",
      memory_context: "MEMORY_MARKER_AYHEM",
    }));
    equal(aiResponse.status, 200, "AI success status");
    const aiBody = await aiResponse.json();
    equal(aiBody.provider, "groq", "AI provider");
    equal(aiBody.reply, "AYHEM_RUNTIME_OK", "AI reply");
    equal(groqCalls, 1, "AI upstream call count");
  });

  await isolated(async () => {
    Deno.env.set("GROQ_API_KEY", "test-only-groq-key");
    Deno.env.set("OPENAI_API_KEY", "test-only-openai-key");
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ error: { code: "rate_limit_exceeded" } }, { status: 429 });
    };
    const response = await aiHandler(request("https://local.test/ai", "POST", { message: "quota test" }));
    equal(response.status, 502, "Groq 429 mapped status");
    const body = await response.json();
    assert(String(body.error).includes("لم يتم التحويل تلقائياً إلى OpenAI"), "Groq 429 must explain no paid fallback");
    equal(calls, 1, "429 must not call OpenAI fallback");
  });

  await isolated(async () => {
    Deno.env.delete("GROQ_API_KEY");
    Deno.env.delete("OPENAI_API_KEY");
    Deno.env.delete("AYHEM_AI_PROVIDER");
    globalThis.fetch = async () => { throw new Error("must not call upstream"); };
    const response = await aiHandler(request("https://local.test/ai", "POST", { message: "no provider" }));
    equal(response.status, 503, "missing provider status");
  });

  await isolated(async () => {
    Deno.env.set("TINYFISH_API_KEY", "test-only-tinyfish-key");
    let calls = 0;
    globalThis.fetch = async (input, init) => {
      calls++;
      equal(String(input), "https://agent.tinyfish.ai/v1/automation/run", "TinyFish run endpoint");
      const payload = JSON.parse(String(init?.body));
      equal(payload.agent_config.max_duration_seconds, 60, "TinyFish duration upper clamp");
      equal(payload.url, "https://example.com/", "TinyFish normalized URL");
      equal(new Headers(init?.headers).get("X-API-Key"), "test-only-tinyfish-key", "TinyFish server key header");
      return Response.json({ run_id: "mock-run-1" });
    };
    const response = await tinyfishRunHandler(request("https://local.test/tinyfish", "POST", {
      consent: true, url: "https://example.com", goal: "read public page", max_duration_seconds: 999,
    }));
    equal(response.status, 200, "TinyFish run status");
    const body = await response.json();
    equal(body.ok, true, "TinyFish upstream result");
    equal(calls, 1, "TinyFish call count");
  });

  await isolated(async () => {
    Deno.env.set("TINYFISH_API_KEY", "test-only-tinyfish-key");
    let calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({}); };
    const response = await tinyfishRunHandler(request("https://local.test/tinyfish", "POST", {
      consent: false, url: "https://example.com", goal: "no consent",
    }));
    equal(response.status, 403, "TinyFish explicit consent status");
    equal(calls, 0, "TinyFish must not call upstream without consent");
  });

  await isolated(async () => {
    Deno.env.set("TINYFISH_API_KEY", "test-only-tinyfish-key");
    let calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({}); };
    const response = await tinyfishRunHandler(request("https://local.test/tinyfish", "POST", {
      consent: true, url: "http://example.com", goal: "reject insecure URL",
    }));
    equal(response.status, 400, "TinyFish HTTP URL rejection");
    equal(calls, 0, "TinyFish must not call upstream for HTTP URL");
  });

  await isolated(async () => {
    Deno.env.set("TINYFISH_API_KEY", "test-only-tinyfish-key");
    globalThis.fetch = async (input, init) => {
      equal(String(input), "https://agent.tinyfish.ai/v1/wallet", "TinyFish wallet endpoint");
      equal(init?.method, "GET", "TinyFish health upstream method");
      equal(new Headers(init?.headers).get("X-API-Key"), "test-only-tinyfish-key", "TinyFish health server key");
      return Response.json({ credits: 123 });
    };
    const response = await tinyfishHealthHandler(request("https://local.test/health", "GET"));
    equal(response.status, 200, "TinyFish health status");
    const body = await response.json();
    equal(body.stage, "tinyfish_auth", "TinyFish health stage");
    equal(body.result.credits, 123, "TinyFish health parsed result");
  });

  await isolated(async () => {
    Deno.env.set("TINYFISH_API_KEY", "test-only-tinyfish-key");
    globalThis.fetch = async () => { throw new Error("simulated network failure"); };
    const response = await tinyfishHealthHandler(request("https://local.test/health", "GET"));
    equal(response.status, 502, "TinyFish health network error status");
  });
});
