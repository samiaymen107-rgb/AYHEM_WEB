import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Vary": "Origin",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET") return reply({ ok: false, error: "method_not_allowed" }, 405);

  const apiKey = Deno.env.get("TINYFISH_API_KEY");
  if (!apiKey) {
    return reply({
      ok: false,
      stage: "supabase_secret",
      error: "TINYFISH_API_KEY is not available to this function",
    }, 503);
  }

  try {
    const response = await fetch("https://agent.tinyfish.ai/v1/wallet", {
      method: "GET",
      headers: { "X-API-Key": apiKey, "Accept": "application/json" },
    });
    const raw = await response.text();
    let data: unknown;
    try { data = JSON.parse(raw); } catch { data = { response_excerpt: raw.slice(0, 500) }; }

    return reply({
      ok: response.ok,
      stage: "tinyfish_auth",
      http_status: response.status,
      result: data,
    }, response.ok ? 200 : 502);
  } catch {
    return reply({ ok: false, stage: "network", error: "Could not reach TinyFish API" }, 502);
  }
});
