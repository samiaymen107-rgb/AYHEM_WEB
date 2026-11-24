// Runtime integration tests for the real AYHEM Edge Function handlers.
// All upstream requests are intercepted locally. No network, provider credits, or secrets are used.
import { handler as aiHandler } from "../ayhem-openai-chat/index.ts";
import { handler as tinyfishRunHandler } from "../ayhem-tinyfish-run/index.ts";
import { handler as tinyfishHealthHandler } from "../ayhem-tinyfish-health/index.ts";
import { createAyhemRemoteMemoryStore } from "../../../integrations/supabase/ayhem-remote-memory-core.js";

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


Deno.test("Cloud memory adapter: append/list behavior with an injected isolated client", async () => {
  const inserted: Record<string, unknown>[] = [];
  const rows = [{
    id: "db-memory-test-1",
    title: "adapter test",
    content: "memory adapter runtime test",
    evidence_level: "unverified",
    metadata: { canonical_id: "canonical-memory-test-1" },
    created_at: "2026-11-25T00:00:00.000Z",
  }];
  let selectedTable = "";
  let selectedColumns = "";
  let orderedBy = "";
  let orderAscending: boolean | undefined;
  let requestedLimit = 0;
  const client = {
    from(table: string) {
      selectedTable = table;
      return {
        insert(row: Record<string, unknown>) {
          inserted.push(row);
          return {
            select(columns: string) {
              selectedColumns = columns;
              return { single: async () => ({ data: { id: "db-memory-test-1", ...row }, error: null }) };
            },
          };
        },
        select(columns: string) {
          selectedColumns = columns;
          return {
            order(column: string, options: { ascending: boolean }) {
              orderedBy = column;
              orderAscending = options.ascending;
              return {
                limit: async (limit: number) => {
                  requestedLimit = limit;
                  return { data: rows, error: null };
                },
              };
            },
          };
        },
      };
    },
  };
  const store = createAyhemRemoteMemoryStore({
    client,
    getSession: async () => ({ user: { id: "test-owner-id" } }),
  });
  const saved = await store.append({
    id: "canonical-memory-test-1",
    title: " adapter test ",
    content: "memory adapter runtime test",
    status: "unverified",
    source: "runtime-test",
    tags: ["test", 17],
    confidence: 0.75,
    createdAt: "2026-11-25T00:00:00.000Z",
  });
  equal(selectedTable, "ayhem_memories", "memory adapter table");
  equal(saved.id, "db-memory-test-1", "memory adapter returned row");
  equal(inserted.length, 1, "memory adapter insert count");
  equal(inserted[0].title, "adapter test", "memory title trimming");
  equal(inserted[0].evidence_level, "unverified", "memory evidence level");
  const metadata = inserted[0].metadata as Record<string, unknown>;
  equal(metadata.canonical_id, "canonical-memory-test-1", "memory canonical ID");
  const listed = await store.list({ limit: 900 });
  equal(selectedTable, "ayhem_memories", "memory list table");
  equal(orderedBy, "created_at", "memory sort column");
  equal(orderAscending, false, "memory newest-first order");
  equal(requestedLimit, 500, "memory list maximum clamp");
  equal(listed.length, 1, "memory list row count");
});

Deno.test("Cloud memory adapter: refuses writes without an authenticated user", async () => {
  let insertCalls = 0;
  const client = {
    from(_table: string) {
      return {
        insert(_row: Record<string, unknown>) {
          insertCalls++;
          return { select: (_columns: string) => ({ single: async () => ({ data: null, error: null }) }) };
        },
      };
    },
  };
  const store = createAyhemRemoteMemoryStore({
    client,
    getSession: async () => ({ user: null }),
  });
  let rejected = false;
  try {
    await store.append({ id: "canonical-no-session", title: "should not write" });
  } catch (error) {
    rejected = error instanceof Error && error.message === "authentication_required";
  }
  assert(rejected, "memory adapter must reject unauthenticated writes");
  equal(insertCalls, 0, "unauthenticated memory insert count");
});
