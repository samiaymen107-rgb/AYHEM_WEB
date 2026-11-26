// Runtime integration tests for the real AYHEM Edge Function handlers.
// All upstream requests are intercepted locally. No network, provider credits, or secrets are used.
import { handler as aiHandler } from "../ayhem-openai-chat/index.ts";
import { handler as tinyfishRunHandler } from "../ayhem-tinyfish-run/index.ts";
import { handler as tinyfishHealthHandler } from "../ayhem-tinyfish-health/index.ts";
import { createAyhemRemoteMemoryStore } from "../../../integrations/supabase/ayhem-remote-memory-core.js";
import { buildRelevantMemoryContext } from "../../../integrations/ai-network/ayhem-memory-context.js";
import { createAyhemReasoningPlan, buildAyhemReasoningContext } from "../../../integrations/ai-network/ayhem-reasoning-core.js";

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
const envKeys = ["GROQ_API_KEY", "OPENAI_API_KEY", "AYHEM_AI_PROVIDER", "TINYFISH_API_KEY", "SUPABASE_URL", "SUPABASE_ANON_KEY"];
function isRateLimitRequest(input: RequestInfo | URL) {
  return String(input).endsWith("/rest/v1/rpc/ayhem_consume_rate_limit");
}
function allowedQuotaResponse() {
  return Response.json([{
    allowed: true,
    remaining: 19,
    reset_at: new Date(Date.now() + 60_000).toISOString(),
  }]);
}
async function isolated(run: () => Promise<void>) {
  const old = new Map(envKeys.map((key) => [key, Deno.env.get(key)]));
  const originalFetch = globalThis.fetch;
  try {
    Deno.env.set("SUPABASE_URL", "https://test-project.supabase.co");
    Deno.env.set("SUPABASE_ANON_KEY", "test-publishable-key");
    await run();
  }
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
      if (isRateLimitRequest(input)) {
        equal(init?.method, "POST", "rate-limit RPC method");
        const headers = new Headers(init?.headers);
        equal(headers.get("apikey"), "test-publishable-key", "rate-limit RPC uses publishable key");
        equal(headers.get("authorization"), "Bearer test-user-token", "rate-limit RPC forwards caller JWT");
        const params = JSON.parse(String(init?.body));
        equal(params.p_limit, 20, "per-user request limit");
        equal(params.p_window_seconds, 60, "per-user window duration");
        return allowedQuotaResponse();
      }
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
    globalThis.fetch = async (input) => {
      if (isRateLimitRequest(input)) return allowedQuotaResponse();
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
    globalThis.fetch = async (input) => {
      if (isRateLimitRequest(input)) return allowedQuotaResponse();
      throw new Error("must not call upstream");
    };
    const response = await aiHandler(request("https://local.test/ai", "POST", { message: "no provider" }));
    equal(response.status, 503, "missing provider status");
  });

  await isolated(async () => {
    Deno.env.set("TINYFISH_API_KEY", "test-only-tinyfish-key");
    let calls = 0;
    globalThis.fetch = async () => { calls++; throw new Error("disabled TinyFish runner must never call upstream"); };
    const response = await tinyfishRunHandler(request("https://local.test/tinyfish", "POST", {
      consent: true, url: "https://example.com", goal: "must remain disabled",
    }));
    equal(response.status, 403, "TinyFish zero-cost policy status");
    const body = await response.json();
    equal(body.error, "tinyfish_disabled_no_topups", "TinyFish zero-cost policy error");
    equal(calls, 0, "disabled TinyFish runner must never call upstream");
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


Deno.test("AYHEM rate limit: deterministic core replies also consume the authenticated quota", async () => {
  await isolated(async () => {
    let quotaCalls = 0;
    let groqCalls = 0;
    globalThis.fetch = async (input) => {
      if (isRateLimitRequest(input)) {
        quotaCalls++;
        return allowedQuotaResponse();
      }
      groqCalls++;
      throw new Error("deterministic core reply must not call Groq");
    };
    const response = await aiHandler(request("https://local.test/ai", "POST", { message: "من أنت" }));
    equal(response.status, 200, "deterministic core response status");
    const body = await response.json();
    equal(body.provider, "ayhem-core", "deterministic core provider");
    equal(quotaCalls, 1, "deterministic core request must consume quota");
    equal(groqCalls, 0, "deterministic core response must not call Groq");
  });
});

Deno.test("AYHEM rate limit: quota denial returns 429 and never calls Groq", async () => {
  await isolated(async () => {
    let groqCalls = 0;
    globalThis.fetch = async (input) => {
      if (isRateLimitRequest(input)) {
        return Response.json([{
          allowed: false,
          remaining: 0,
          reset_at: new Date(Date.now() + 30_000).toISOString(),
        }]);
      }
      groqCalls++;
      throw new Error("Groq must not run after quota denial");
    };
    const response = await aiHandler(request("https://local.test/ai", "POST", { message: "quota denied" }));
    equal(response.status, 429, "quota denial status");
    assert(Number(response.headers.get("Retry-After")) >= 1, "429 must include Retry-After");
    equal(groqCalls, 0, "quota denial must not call Groq");
  });
});

Deno.test("AYHEM rate limit: RPC failure fails closed with 503 and never calls Groq", async () => {
  await isolated(async () => {
    let groqCalls = 0;
    globalThis.fetch = async (input) => {
      if (isRateLimitRequest(input)) return Response.json({ message: "database unavailable" }, { status: 500 });
      groqCalls++;
      throw new Error("Groq must not run when quota accounting fails");
    };
    const response = await aiHandler(request("https://local.test/ai", "POST", { message: "quota service unavailable" }));
    equal(response.status, 503, "quota RPC failure status");
    equal(groqCalls, 0, "RPC failure must not call Groq");
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


Deno.test("Cloud memory adapter: read-only RLS isolation diagnostic uses verified Auth identity and count-only queries", async () => {
  const queries: Array<{ table: string; columns: string; options: unknown; filter: string; ownerId: string }> = [];
  let foreignCount = 0;
  let authLookups = 0;
  const client = {
    auth: {
      getUser: async () => {
        authLookups++;
        return { data: { user: { id: "verified-user-id" } }, error: null };
      },
    },
    from(table: string) {
      return {
        select(columns: string, options: unknown) {
          return {
            eq: async (column: string, ownerId: string) => {
              queries.push({ table, columns, options, filter: column, ownerId });
              return { count: 4, error: null };
            },
            neq: async (column: string, ownerId: string) => {
              queries.push({ table, columns, options, filter: column, ownerId });
              return { count: foreignCount, error: null };
            },
          };
        },
      };
    },
  };
  const store = createAyhemRemoteMemoryStore({
    client,
    getSession: async () => ({ user: { id: "cached-session-user" } }),
  });

  const clean = await store.verifyIsolation();
  equal(authLookups, 1, "verified Auth lookup count");
  equal(clean.authenticated, true, "verified authenticated state");
  equal(clean.own_visible_count, 4, "own visible count");
  equal(clean.foreign_visible_count, 0, "foreign visible count");
  equal(clean.isolation_passed, true, "clean RLS isolation result");
  equal(queries.length, 2, "count-only query count");
  for (const query of queries) {
    equal(query.table, "ayhem_memories", "diagnostic table");
    equal(query.columns, "id", "diagnostic selects only row ID for count");
    equal((query.options as { count: string }).count, "exact", "diagnostic exact count");
    equal((query.options as { head: boolean }).head, true, "diagnostic head-only request");
    equal(query.filter, "owner_id", "diagnostic ownership filter");
    equal(query.ownerId, "verified-user-id", "diagnostic uses Auth-verified user ID");
  }

  foreignCount = 2;
  const exposed = await store.verifyIsolation();
  equal(exposed.foreign_visible_count, 2, "foreign rows are detected");
  equal(exposed.isolation_passed, false, "foreign rows fail isolation check");
});


Deno.test("AYHEM memory-to-inference pipeline: relevant memory context reaches mocked Groq without paid fallback", async () => {
  await isolated(async () => {
    const records = [
      {
        id: "memory-owned-1",
        title: "اختبار الذاكرة السحابية",
        content: "نتيجة اختبار التكامل: AYHEM_MEMORY_PIPELINE_MARKER. مستوى الدليل غير موثق.",
        source: "ayhem-roundtrip-test",
        evidence_level: "unverified",
        created_at: "2026-11-24T22:51:14.000Z",
        tags: ["ذاكرة", "تكامل"],
      },
      {
        id: "memory-unrelated-2",
        title: "موضوع غير مرتبط",
        content: "معلومة لا تتعلق بسؤال المستخدم.",
        source: "test",
        evidence_level: "verified",
        created_at: "2026-11-24T22:50:00.000Z",
        tags: [],
      },
    ];
    const prompt = "ما مستوى الدليل في اختبار الذاكرة السحابية؟";
    const memoryContext = buildRelevantMemoryContext(prompt, records);
    assert(memoryContext.includes("AYHEM_MEMORY_PIPELINE_MARKER"), "relevant memory must be selected");
    assert(memoryContext.includes("مستوى الدليل: unverified"), "evidence provenance must be preserved");
    assert(!memoryContext.includes("موضوع غير مرتبط"), "unrelated memory must not be selected");

    Deno.env.set("GROQ_API_KEY", "test-only-groq-key");
    Deno.env.delete("OPENAI_API_KEY");
    Deno.env.delete("AYHEM_AI_PROVIDER");
    let upstreamCalls = 0;
    globalThis.fetch = async (input, init) => {
      if (isRateLimitRequest(input)) return allowedQuotaResponse();
      upstreamCalls++;
      equal(String(input), "https://api.groq.com/openai/v1/chat/completions", "pipeline provider endpoint");
      const payload = JSON.parse(String(init?.body));
      const userMessage = payload.messages.find((item: { role: string }) => item.role === "user")?.content || "";
      assert(userMessage.includes("AYHEM_MEMORY_PIPELINE_MARKER"), "selected memory must reach inference input");
      assert(userMessage.includes("مستوى الدليل: unverified"), "evidence level must reach inference input");
      assert(userMessage.includes(prompt), "original user prompt must reach inference input");
      return Response.json({ choices: [{ message: { content: "AYHEM_MEMORY_INFERENCE_PIPELINE_PASS" } }] });
    };

    const response = await aiHandler(request("https://local.test/ai", "POST", {
      message: prompt,
      memory_context: memoryContext,
    }));
    equal(response.status, 200, "memory-to-inference handler status");
    const body = await response.json();
    equal(body.provider, "groq", "pipeline uses Groq");
    equal(body.reply, "AYHEM_MEMORY_INFERENCE_PIPELINE_PASS", "pipeline inference response");
    equal(upstreamCalls, 1, "pipeline upstream call count");
  });
});


Deno.test("AYHEM local learning: explicit corrections persist separately and are retrieved", async () => {
  const values = new Map<string, string>([["AYHEM_MEMORY", "LEGACY_MEMORY_MUST_REMAIN_UNCHANGED"]]);
  const storage = {
    getItem(key: string) { return values.get(key) ?? null; },
    setItem(key: string, value: string) { values.set(key, value); },
  };
  const { createAyhemLocalLearningStore } = await import("../../../integrations/ai-network/ayhem-local-learning.js");
  const learning = createAyhemLocalLearningStore({
    storage,
    now: () => "2026-11-25T00:00:00.000Z",
    makeId: () => "learning-test-1",
  });
  const saved = learning.recordFeedback({
    prompt: "كيف أزرع الزيتون في جلمة؟",
    kind: "correction",
    correction: "يجب مراعاة الجفاف والتربة المحلية وتحليل الماء قبل اختيار الصنف.",
  });
  equal(saved.saved, true, "local correction must save");
  const context = learning.getRelevantContext("أفضل صنف زيتون في جلمة");
  assert(context.includes("مراعاة الجفاف"), "matching correction must be retrieved");
  equal(values.get("AYHEM_MEMORY"), "LEGACY_MEMORY_MUST_REMAIN_UNCHANGED", "legacy memory must remain untouched");
  equal(learning.stats().corrections, 1, "correction count");
});


Deno.test("AYHEM reasoning core: offline planning, evidence boundaries, and bounded context", () => {
  const plan = createAyhemReasoningPlan("حلل خطة تمويل المشروع وقارن الخيارات وحدد المخاطر") as {
    mode: string;
    intent: string;
    steps: unknown[];
    evidence_policy: string[];
    risks: unknown[];
  };
  equal(plan.mode, "local_deterministic_scaffold", "reasoning mode");
  equal(plan.intent, "compare", "comparison intent precedence");
  assert(plan.steps.length >= 4, "reasoning plan must contain actionable steps");
  assert(plan.evidence_policy.some((item) => item.includes("استنتاج")), "evidence policy must distinguish inference");
  assert(plan.risks.length > 0, "reasoning plan must expose risks");
  const context = buildAyhemReasoningContext(plan);
  assert(context.includes("لا تدّع تنفيذ"), "provider context must prohibit false execution claims");
  assert(context.length <= 2600, "reasoning context must be bounded");
  const unknown = createAyhemReasoningPlan("؟") as { requires_clarification: boolean };
  equal(unknown.requires_clarification, true, "short ambiguous prompt needs clarification");
});
