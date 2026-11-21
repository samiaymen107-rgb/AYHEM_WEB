/**
 * AYHEM Cloudflare Worker — secure server-side AI gateway.
 * Configure OPENAI_API_KEY as a Worker Secret, never as source code.
 * Configure ALLOWED_ORIGINS as a comma-separated allow-list of exact origins.
 */
const MAX_INPUT_LENGTH = 8000;
const MODEL = "gpt-4o-mini";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null; // server-to-server request
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(v => v.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : false;
}

function corsHeaders(origin) {
  return origin ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  } : {};
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (origin === false) return json({ error: "origin_not_allowed" }, 403);

    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        ...cors, "Access-Control-Max-Age": "86400",
      }});
    }

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json({ service: "AYHEM", status: "online", mode: "gateway", aiConfigured: Boolean(env.OPENAI_API_KEY) }, 200, cors);
    }
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, cors);
    if (!env.OPENAI_API_KEY) return json({ error: "ai_service_not_configured" }, 503, cors);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: "invalid_json" }, 400, cors); }

    const input = typeof body?.input === "string" ? body.input.trim() : "";
    if (!input) return json({ error: "input_required" }, 400, cors);
    if (input.length > MAX_INPUT_LENGTH) return json({ error: "input_too_long", maxLength: MAX_INPUT_LENGTH }, 413, cors);

    try {
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || MODEL,
          messages: [
            { role: "system", content: "أنت مساعد مشروع أيهم. أجب بوضوح، وميّز الحقائق عن الافتراضات، ولا تدّع تنفيذ عمليات لم تنفذها." },
            { role: "user", content: input },
          ],
          max_tokens: 700,
        }),
        signal: AbortSignal.timeout(25000),
      });

      const data = await upstream.json().catch(() => ({}));
      if (!upstream.ok) {
        return json({ error: "ai_upstream_error", status: upstream.status }, 502, cors);
      }
      const output = data.choices?.[0]?.message?.content;
      if (typeof output !== "string" || !output.trim()) {
        return json({ error: "empty_ai_response" }, 502, cors);
      }
      return json({ unit: "U01-Σ", output }, 200, cors);
    } catch {
      return json({ error: "ai_service_unavailable" }, 502, cors);
    }
  },
};
