import { verifyCloudflareAccessJWT } from "./integrations/ai-network/cloudflare-access.js";

/**
 * AYHEM Cloudflare Worker — authenticated AI gateway.
 * Required bindings/secrets:
 * - OPENAI_API_KEY (Worker Secret)
 * - CF_ACCESS_TEAM_DOMAIN (Worker variable)
 * - CF_ACCESS_AUD (Worker variable)
 * - AI_RATE_LIMITER (Cloudflare Rate Limiting binding)
 * - ALLOWED_ORIGINS (exact comma-separated browser origins)
 */
const MAX_INPUT_LENGTH = 8000;
const MAX_BODY_BYTES = 16000;
const MODEL = "gpt-4o-mini";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;
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

async function authorize(request, env) {
  if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) {
    return { ok: false, status: 503, error: "gateway_auth_not_configured" };
  }

  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return { ok: false, status: 401, error: "access_token_required" };

  const result = await verifyCloudflareAccessJWT(token, {
    teamDomain: env.CF_ACCESS_TEAM_DOMAIN,
    audience: env.CF_ACCESS_AUD,
  });

  if (!result.ok) {
    const unavailable = result.reason === "verification_unavailable";
    return {
      ok: false,
      status: unavailable ? 503 : 401,
      error: unavailable ? "access_verification_unavailable" : "access_token_invalid",
    };
  }

  return { ok: true, claims: result.claims };
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    if (origin === false) return json({ error: "origin_not_allowed" }, 403);

    const cors = corsHeaders(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: { ...cors, "Access-Control-Max-Age": "86400" },
      });
    }

    const url = new URL(request.url);
    const isHealth = request.method === "GET" && url.pathname === "/health";
    const isAIRequest = request.method === "POST" && url.pathname === "/";
    if (!isHealth && !isAIRequest) {
      return json({ error: "route_not_found" }, 404, cors);
    }

    const auth = await authorize(request, env);
    if (!auth.ok) return json({ error: auth.error }, auth.status, cors);

    if (isHealth) {
      const aiConfigured = Boolean(env.OPENAI_API_KEY);
      const rateLimitConfigured = Boolean(env.AI_RATE_LIMITER && typeof env.AI_RATE_LIMITER.limit === "function");
      return json({
        service: "AYHEM",
        status: "online",
        mode: "authenticated-gateway",
        aiConfigured,
        rateLimitConfigured,
        ready: aiConfigured && rateLimitConfigured,
      }, 200, cors);
    }

    if (!env.OPENAI_API_KEY) return json({ error: "ai_service_not_configured" }, 503, cors);
    if (!env.AI_RATE_LIMITER || typeof env.AI_RATE_LIMITER.limit !== "function") {
      return json({ error: "rate_limit_not_configured" }, 503, cors);
    }

    try {
      const rate = await env.AI_RATE_LIMITER.limit({ key: auth.claims.sub });
      if (!rate?.success) return json({ error: "rate_limit_exceeded" }, 429, cors);
    } catch {
      return json({ error: "rate_limit_unavailable" }, 503, cors);
    }

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return json({ error: "request_body_too_large" }, 413, cors);
    }

    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
        return json({ error: "request_body_too_large" }, 413, cors);
      }
      body = JSON.parse(raw);
    } catch {
      return json({ error: "invalid_json" }, 400, cors);
    }

    const input = typeof body?.input === "string" ? body.input.trim() : "";
    if (!input) return json({ error: "input_required" }, 400, cors);
    if (input.length > MAX_INPUT_LENGTH) {
      return json({ error: "input_too_long", maxLength: MAX_INPUT_LENGTH }, 413, cors);
    }

    try {
      const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "system",
              content: "أنت مساعد مشروع أيهم. أجب بوضوح، وميّز الحقائق عن الافتراضات، ولا تدّع تنفيذ عمليات لم تنفذها.",
            },
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
      return json({
        unit: "U01-Σ",
        output,
        requestId: crypto.randomUUID(),
      }, 200, cors);
    } catch {
      return json({ error: "ai_service_unavailable" }, 502, cors);
    }
  },
};
