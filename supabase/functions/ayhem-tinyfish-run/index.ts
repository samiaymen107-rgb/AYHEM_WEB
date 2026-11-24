import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ ok: false, error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return reply({ ok: false, stage: "auth", error: "authentication_required" }, 401);

  let input: Record<string, unknown>;
  try { input = await req.json(); }
  catch { return reply({ ok: false, error: "invalid_json" }, 400); }

  if (input.consent !== true) return reply({ ok: false, stage: "consent", error: "explicit_consent_required" }, 403);

  const apiKey = Deno.env.get("TINYFISH_API_KEY");
  if (!apiKey) return reply({ ok: false, stage: "configuration", error: "tinyfish_secret_unavailable" }, 503);

  const url = typeof input.url === "string" ? input.url.trim() : "";
  const goal = typeof input.goal === "string" ? input.goal.trim() : "";
  if (!url || !goal || goal.length > 4000) {
    return reply({ ok: false, error: "url_and_goal_required", limits: { goal_max_chars: 4000 } }, 400);
  }

  let parsed: URL;
  try { parsed = new URL(url); }
  catch { return reply({ ok: false, error: "invalid_url" }, 400); }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    return reply({ ok: false, error: "https_url_required" }, 400);
  }

  const requestedDuration = Number(input.max_duration_seconds ?? 30);
  const maxDuration = Number.isFinite(requestedDuration) ? Math.min(60, Math.max(10, Math.floor(requestedDuration))) : 30;

  try {
    const upstream = await fetch("https://agent.tinyfish.ai/v1/automation/run", {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        url: parsed.toString(),
        goal,
        browser_profile: "lite",
        agent_config: { max_duration_seconds: maxDuration },
      }),
    });

    const raw = await upstream.text();
    let result: unknown;
    try { result = JSON.parse(raw); }
    catch { result = { response_excerpt: raw.slice(0, 1200) }; }

    return reply({ ok: upstream.ok, stage: "tinyfish_agent_run", http_status: upstream.status, result }, upstream.ok ? 200 : 502);
  } catch {
    return reply({ ok: false, stage: "network", error: "tinyfish_request_failed" }, 502);
  }
});