// Contract-level security regression tests for AYHEM's Supabase integrations.
// These tests inspect source invariants only; they do not call Supabase, Groq, or TinyFish.
const read = (path: string) => Deno.readTextFile(path);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function includes(source: string, fragment: string, message: string) {
  assert(source.includes(fragment), message);
}

Deno.test("AI gateway: requires bearer authentication and POST", async () => {
  const source = await read("supabase/functions/ayhem-openai-chat/index.ts");
  includes(source, 'req.method !== "POST"', "AI gateway must reject non-POST requests");
  includes(source, 'authorization.startsWith("Bearer ")', "AI gateway must require bearer authentication");
  includes(source, "message.length > 6000", "AI gateway message size limit must remain enforced");
});

Deno.test("AI gateway: bounds memory context and does not auto-fallback to paid OpenAI", async () => {
  const source = await read("supabase/functions/ayhem-openai-chat/index.ts");
  includes(source, 'body.memory_context.slice(0, 10000)', "AI memory context must remain bounded");
  includes(source, "if (response.status === 429)", "Groq rate-limit handling must remain explicit");
  includes(source, "لم يتم التحويل تلقائياً إلى OpenAI", "Groq quota failure must not trigger paid fallback");
  includes(source, 'preferred === "openai"', "OpenAI may only be selected through explicit provider preference or configured fallback when Groq is absent");
});

Deno.test("TinyFish runner: requires explicit consent and HTTPS-only URLs", async () => {
  const source = await read("supabase/functions/ayhem-tinyfish-run/index.ts");
  includes(source, 'req.method !== "POST"', "TinyFish runner must reject non-POST requests");
  includes(source, 'authorization.startsWith("Bearer ")', "TinyFish runner must require bearer authentication");
  includes(source, "input.consent !== true", "TinyFish runner must require explicit consent");
  includes(source, 'parsed.protocol !== "https:"', "TinyFish runner must reject non-HTTPS URLs");
  includes(source, "parsed.username || parsed.password", "TinyFish runner must reject credential-bearing URLs");
  includes(source, "goal.length > 4000", "TinyFish goal length must remain bounded");
  includes(source, "Math.min(60, Math.max(10", "TinyFish runtime duration must remain clamped");
});

Deno.test("TinyFish health: is read-only and authenticated", async () => {
  const source = await read("supabase/functions/ayhem-tinyfish-health/index.ts");
  includes(source, 'req.method !== "GET"', "TinyFish health endpoint must remain GET-only");
  includes(source, 'authorization.startsWith("Bearer ")', "TinyFish health endpoint must require bearer authentication");
  includes(source, 'Deno.env.get("TINYFISH_API_KEY")', "TinyFish key must be read from server environment");
});

Deno.test("Cloud memory adapter: requires a session and canonical record ID", async () => {
  const source = await read("integrations/supabase/ayhem-remote-memory-core.js");
  const adapter = await read("integrations/supabase/ayhem-remote-memory.js");
  includes(source, 'typeof record.id !== "string" || !record.id', "Memory writes must require a canonical ID");
  includes(source, "if (!session?.user?.id)", "Memory writes must require an authenticated user session");
  includes(source, '.from("ayhem_memories")', "Memory adapter must use the intended table");
  includes(adapter, "getAyhemSession", "Production adapter must use the authenticated Supabase session");
  includes(source, '.order("created_at", { ascending: false })', "Memory listing must remain newest-first");
  includes(source, "Math.min(500, Math.max(1", "Memory listing limit must remain bounded");
  includes(source, "async verifyIsolation()", "Memory adapter must expose the read-only isolation diagnostic");
  includes(source, "client.auth.getUser()", "Isolation diagnostic must verify identity with the Auth server");
  includes(source, '.select("id", { count: "exact", head: true })', "Isolation diagnostic must use count-only head queries");
  includes(source, '.neq("owner_id", user.id)', "Isolation diagnostic must test visibility of foreign-owned rows");
  assert(!/^\s{4}(?:update|delete)\s*\(/m.test(source), "Memory adapter must not expose update/delete methods");
});

Deno.test("Cloud memory UI: round-trip verification must not mutate prior records", async () => {
  const source = await read("integrations/supabase/ayhem-memory-ui.js");
  includes(source, "store.append(", "Round-trip test must append a separate test record");
  includes(source, "store.list({ limit: 100 })", "Round-trip test must read back saved records");
  includes(source, "restored.metadata?.canonical_id === canonicalId", "Round-trip test must verify canonical ID");
  includes(source, "evidence_level: restored.evidence_level", "Round-trip output must preserve evidence classification");
  includes(source, "memoryIsolationBtn", "Cloud memory UI must expose the authenticated isolation diagnostic");
  includes(source, "createAyhemRemoteMemoryStore().verifyIsolation()", "Cloud memory UI must invoke the read-only isolation diagnostic");
  assert(!/\.from\(["']ayhem_memories["']\)\s*\.update\(/.test(source), "Memory UI must not update prior memory records");
  assert(!/\.from\(["']ayhem_memories["']\)\s*\.delete\(/.test(source), "Memory UI must not delete prior memory records");
});


Deno.test("TinyFish UI: resource guardian protects the non-renewable wallet", async () => {
  const source = await read("integrations/supabase/ayhem-tinyfish-ui.js");
  includes(source, "MINIMUM_RESERVE_USD = 2", "TinyFish UI must preserve a minimum wallet reserve");
  includes(source, "DUPLICATE_WINDOW_MS = 30 * 60 * 1000", "TinyFish UI must apply a duplicate cooldown");
  includes(source, 'invoke("ayhem-tinyfish-health", { method: "GET" })', "Every paid task must be preceded by a read-only wallet check");
  includes(source, "wallet.balance < MINIMUM_RESERVE_USD", "TinyFish UI must block tasks below the reserve");
  includes(source, "reserveTask(url, goal)", "TinyFish UI must record task fingerprints before dispatch");
  includes(source, "if (taskInFlight)", "TinyFish UI must prevent concurrent duplicate submissions");
  includes(source, "لن تتم إعادة المحاولة تلقائياً", "TinyFish UI must not automatically retry paid tasks");
});
