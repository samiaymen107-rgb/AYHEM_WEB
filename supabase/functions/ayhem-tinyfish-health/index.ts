const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return reply({ ok: false, error: "method_not_allowed" }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return reply({ ok: false, stage: "auth", error: "authentication_required" }, 401);

  const apiKey = Deno.env.get("TINYFISH_API_KEY");
  if (!apiKey) return reply({ ok: false, stage: "supabase_secret", error: "tinyfish_secret_unavailable" }, 503);

  try {
    const response = await fetch("https://agent.tinyfish.ai/v1/wallet", {
      method: "GET",
      headers: { "X-API-Key": apiKey, "Accept": "application/json" },
    });
    const raw = await response.text();
    let data: unknown;
    try { data = JSON.parse(raw); }
    catch { data = { response_excerpt: raw.slice(0, 500) }; }
    return reply({ ok: response.ok, stage: "tinyfish_auth", http_status: response.status, result: data }, response.ok ? 200 : 502);
  } catch {
    return reply({ ok: false, stage: "network", error: "Could not reach TinyFish API" }, 502);
  }
}

if (import.meta.main) Deno.serve(handler);
