# AYHEM AI Gateway — deployment checklist

The Cloudflare Worker source is `AYHEM_JS_Worker.js`. Keep provider credentials server-side.

## Cloudflare Worker configuration

Create a Worker named `ayhem-ai-gateway` from the repository Worker entry point and include the module `integrations/ai-network/cloudflare-access.js`.

Set the following Worker values:

| Name | Type | Value |
|---|---|---|
| `OPENAI_API_KEY` | Secret | OpenAI API key (never commit it) |
| `CF_ACCESS_TEAM_DOMAIN` | Variable | Your Cloudflare Access team domain |
| `CF_ACCESS_AUD` | Variable | Audience tag of the Access application |
| `ALLOWED_ORIGINS` | Variable | Exact HTTPS origin(s) of the deployed AYHEM web app |

Add a Cloudflare Rate Limiting binding named `AI_RATE_LIMITER`. Use a conservative per-user limit. The Worker keys the limiter by the verified Access JWT subject.

Protect the Worker with a Cloudflare Access application. Keep the Worker routes authenticated; do not bypass Access for POST or GET.

## CORS

Allow the web app's exact origin, methods `GET, POST, OPTIONS`, header `Content-Type`, and credentials. Ensure Access allows the OPTIONS preflight to reach the Worker or configures the matching preflight response. Never combine credentialed requests with wildcard origin.

## Connect the AYHEM web app

After deployment, set the empty `<meta name="ayhem-worker-url">` value in `index.html` to the Worker HTTPS base URL, or set `window.AYHEM_WORKER_URL` before `integrations/ai-network/ayhem-ai-ui.js` loads.

The UI will only enable sending after `GET /health` confirms the authenticated gateway, provider, rate limiter, and origin are configured. A health check requires a valid Cloudflare Access session.

## Smoke test

1. Open AYHEM from its final HTTPS origin and sign in to Cloudflare Access.
2. Confirm the AI Gateway status becomes ready.
3. Send a short non-sensitive test prompt.
4. Confirm the response includes unit `U01-Σ` and a UUID request ID.

Do not test from the jsDelivr preview origin unless it is deliberately added to the exact allowlist. Do not expose the OpenAI key in the browser or repository.
