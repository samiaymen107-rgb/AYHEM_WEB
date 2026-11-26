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
  assert(!source.includes("openaiReply("), "AI gateway must not contain an active OpenAI provider implementation");
  includes(source, "const provider = groqKey ? \"groq\" : null", "Only Groq may be selected in zero-cost mode");
  includes(source, "لم يتم استدعاء أي مزوّد مدفوع", "Missing Groq must fail closed without paid fallback");
});

Deno.test("TinyFish runner: hard-disabled server-side in zero-cost mode", async () => {
  const source = await read("supabase/functions/ayhem-tinyfish-run/index.ts");
  includes(source, "zero_cost_policy", "TinyFish runner must identify the zero-cost policy");
  includes(source, "tinyfish_disabled_no_topups", "TinyFish runner must reject paid automation");
  assert(!source.includes("agent.tinyfish.ai/v1/automation/run"), "TinyFish runner must not call the paid automation endpoint");
  assert(!source.includes("TINYFISH_API_KEY"), "Disabled runner must not read or use the TinyFish API key");
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


Deno.test("TinyFish UI: zero-cost mode blocks all paid activity locally", async () => {
  const source = await read("integrations/supabase/ayhem-tinyfish-ui.js");
  includes(source, "وضع الاكتفاء الذاتي المجاني مفعّل", "TinyFish UI must disclose zero-cost mode");
  includes(source, "submit.disabled = true", "TinyFish task submit must be disabled");
  includes(source, "healthButton.hidden = true", "Wallet polling/check UI must be hidden");
  assert(!source.includes("functions.invoke"), "TinyFish UI must not call any Edge Function");
  assert(!source.includes("agent.tinyfish.ai"), "TinyFish UI must not contact TinyFish directly");
});


Deno.test("AYHEM rate-limit migration: private atomic per-user quota contract", async () => {
  const sql = await read("supabase/migrations/202611260001_ayhem_user_rate_limit.sql");
  includes(sql, "user_id uuid primary key references auth.users(id) on delete cascade", "Quota row must be keyed to an Auth user");
  includes(sql, "enable row level security", "Quota table must have RLS enabled");
  includes(sql, "revoke all on table public.ayhem_rate_limit_windows from anon, authenticated, public", "Clients must not access quota rows directly");
  includes(sql, "v_user_id := auth.uid()", "RPC must derive identity from verified JWT context");
  includes(sql, "v_limit constant integer := 20", "Request limit must be fixed server-side");
  includes(sql, "v_window_seconds constant integer := 60", "Window duration must be fixed server-side");
  assert(!/p_limit|p_window_seconds/i.test(sql), "RPC must not accept caller-controlled quota configuration");
  assert(!/p_user_id|user_id\s+uuid\s*,/i.test(sql), "RPC must not accept a caller-selected user ID");
  includes(sql, "security definer", "Atomic quota RPC must run with controlled owner privileges");
  includes(sql, "set search_path = ''", "Security-definer RPC must pin an empty search path");
  includes(sql, "on conflict (user_id) do update", "Quota increments must be atomic under concurrency");
  includes(sql, "least(current_window.request_count + 1, v_limit + 1)", "Denied requests must not grow counters without bound");
  includes(sql, "pg_catalog.clock_timestamp()", "Quota window must use a wall-clock timestamp rather than transaction start time");
  includes(sql, "pg_catalog.date_part('epoch', v_now)", "Fixed-window calculation must be explicit and schema-qualified");
  assert(!/execute\s+on\s+function[^;]+\s+to\s+public/i.test(sql), "Quota RPC must not grant execution to PUBLIC");
  includes(sql, "grant execute on function public.ayhem_consume_rate_limit() to authenticated", "Only authenticated users may consume quota");
  includes(sql, "revoke all on function public.ayhem_consume_rate_limit() from public, anon", "Public and anonymous callers must not execute quota RPC");
});


Deno.test("AYHEM rate-limit runtime: every valid request is quota-checked before inference", async () => {
  const source = await read("supabase/functions/ayhem-openai-chat/index.ts");
  includes(source, "consumeRateLimit(authorization, dependencies)", "AI handler must consume the per-user quota");
  includes(source, "/rest/v1/rpc/ayhem_consume_rate_limit", "AI handler must call the dedicated quota RPC");
  includes(source, '"apikey": apiKey', "RPC must use a publishable/anon API key");
  includes(source, '"Authorization": authorization', "RPC must forward the caller JWT");
  includes(source, ' }, 429, { "Retry-After": String(quota.retryAfter) })', "Quota denial must return 429 with Retry-After");
  includes(source, ' }, 503);', "Quota accounting failures must fail closed");
  assert(!source.includes("p_limit") && !source.includes("p_window_seconds"), "Edge Function must not send caller-configurable quota values");
  assert(!source.includes("SUPABASE_SERVICE_ROLE_KEY"), "Rate-limit RPC must never use a service-role key");
});


Deno.test("AYHEM private file library: plain text preview stays local and bounded", async () => {
  const source = await read("integrations/supabase/ayhem-file-library.js");
  includes(source, "isPlainTextFile(item)", "Only plain text and CSV files should expose the local text preview");
  includes(source, ".storage.from(BUCKET).download(item.file_path)", "Text preview must download through the authenticated private bucket");
  includes(source, 'item.file_path.startsWith(session.user.id + "/")', "Text preview must verify the current user's object path");
  includes(source, "data.size > 1024 * 1024", "Local preview must enforce a 1 MiB processing limit");
  includes(source, "rawText.slice(0, 20000)", "Local preview must cap displayed text");
  includes(source, "preview.textContent = rawText.slice(0, 20000)", "Extracted text must be rendered as text, not HTML");
  includes(source, "لم يُرسل محتوى الملف إلى مزوّد الذكاء الاصطناعي", "Local preview must disclose that file content is not sent to an AI provider");
  assert(!source.includes("functions.invoke"), "Local text preview must not call an AI or external function");
  assert(!source.includes("fetch("), "Local text preview must not make a separate network request outside the authenticated storage client");
});

Deno.test("AYHEM private file library: per-user private bucket and additive upload flow", async () => {
  const sql = await read("supabase/migrations/202611260002_ayhem_private_file_library.sql");
  const moduleSource = await read("integrations/supabase/ayhem-file-library.js");
  const html = await read("index.html");
  includes(sql, "'ayhem-private-library'", "File library must use its dedicated bucket");
  includes(sql, "false", "File library bucket must be private");
  includes(sql, "10485760", "File library must cap each file at 10 MiB");
  includes(sql, "storage.foldername(name))[1] = (select auth.uid()::text)", "Storage policies must isolate each user's folder");
  includes(sql, "for select to authenticated", "Only authenticated owners may read their objects");
  includes(sql, "for insert to authenticated", "Only authenticated owners may upload objects");
  assert(!/for\s+(?:delete|update)/i.test(sql), "Initial file library must not add delete or overwrite permissions");
  includes(moduleSource, 'from("ayhem_documents")', "File library must register metadata in the existing document table");
  includes(moduleSource, '.storage.from(BUCKET).upload(', "File library must upload into the private bucket");
  includes(moduleSource, "createSignedUrl(", "File access must use short-lived signed URLs");
  includes(moduleSource, "MAX_FILE_BYTES = 10 * 1024 * 1024", "Client must enforce the 10 MiB per-file limit");
  includes(moduleSource, "getAyhemSession()", "File upload must require an authenticated session");
  assert(!/\.from\(["']ayhem_documents["']\)\s*\.delete\(/.test(moduleSource), "File library must not delete existing document metadata");
  assert(!/\.storage\.from\(BUCKET\)\.remove\(/.test(moduleSource), "File library must not remove stored files");
  includes(html, 'id="ayhemFileInput"', "Memory screen must expose the file picker");
  includes(html, 'id="ayhemFileUpload"', "Memory screen must expose the upload action");
  includes(html, 'src="./integrations/supabase/ayhem-file-library.js', "Memory screen must load the file library module");
});

Deno.test("AYHEM private file library: PDF and DOCX extraction is bounded and client-side", async () => {
  const parser = await read("integrations/supabase/ayhem-document-extract.js");
  const library = await read("integrations/supabase/ayhem-file-library.js");
  includes(library, "isPdfDocxFile(item)", "Only PDF and DOCX files should expose document preview");
  includes(library, "previewDocumentFile(item, row, documentButton)", "Document preview must use the local parser");
  includes(library, 'item.file_path?.startsWith(session.user.id + "/")', "Document preview must verify the authenticated user storage path");
  includes(parser, "file.arrayBuffer()", "Document bytes must be read in the browser");
  includes(parser, "file.size > 5 * 1024 * 1024", "Local document extraction must enforce a 5 MiB limit");
  includes(parser, "MAX_PDF_PAGES = 25", "PDF extraction must be capped at 25 pages");
  includes(parser, "MAX_TEXT_CHARS = 20000", "Extracted text must be bounded");
  includes(parser, "isEvalSupported: false", "PDF parsing must disable PDF JavaScript evaluation");
  includes(parser, "mammoth.extractRawText({ arrayBuffer: buffer })", "DOCX extraction must return raw text");
  includes(parser, "PDFJS_VERSION = \"6.5.438\"", "PDF.js dependency version must be pinned");
  includes(parser, "MAMMOTH_VERSION = \"1.9.1\"", "Mammoth dependency version must be pinned");
  assert(!parser.includes("fetch("), "Parser must not send document bytes using fetch");
  assert(!parser.includes("functions.invoke"), "Parser must not invoke an AI or server parser");
});
