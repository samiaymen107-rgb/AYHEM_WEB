# AYHEM AI Network Mesh — V1

Status: client contract and integration design committed to a development branch. The gateway is not declared production-ready.

## Network topology

All clients call the AYHEM server-side AI gateway over HTTPS:

- Web UI -> AYHEM_WEB browser bridge -> Cloudflare Worker -> AI provider.
- AYHEM-LINK (planned) -> authenticated service-to-service gateway adapter.
- AYHEM-COGNITION (planned) -> gateway for reasoning requests and structured outputs.
- AYHEM-MEMORY (planned) -> retrieval context supplied through an authorized backend adapter.
- AYHEM-AUTONOMY (planned) -> task proposals only; execution remains behind deterministic policy.
- AYHEM-GUARD (planned) -> policy, audit, rate-limit and privacy controls.

The browser must never connect directly to the AI provider and must never contain provider credentials.

## Current gateway contract

- GET /health — gateway health metadata.
- POST / — JSON body { "input": "..." }.
- Successful response — { "unit": "U01-Σ", "output": "..." }.
- HTTPS is mandatory.
- The reusable client validates inputs and response shape, enforces a request timeout, and does not automatically retry billable POST requests.

## Required Cloudflare Worker configuration

The gateway now fails closed unless Cloudflare Access JWT validation is configured.

- Worker Secret: `OPENAI_API_KEY` — provider credential; never commit it.
- Worker variable: `CF_ACCESS_TEAM_DOMAIN` — the HTTPS Cloudflare Access team domain.
- Worker variable: `CF_ACCESS_AUD` — the Access application's exact audience tag.
- Worker variable: `ALLOWED_ORIGINS` — exact comma-separated browser origins.
- Cloudflare Rate Limiting binding: `AI_RATE_LIMITER` — configured in Cloudflare and keyed by the verified Access subject.

Protect the Worker hostname with a Cloudflare Access application so authenticated browser requests receive `Cf-Access-Jwt-Assertion`. The Worker validates its signature against Cloudflare's JWKS and checks issuer, audience, expiry, and subject. CORS is retained as a browser-origin policy, not treated as authentication.

The authenticated health response reports `ready: true` only when the provider secret, rate-limit binding, and origin allow-list are configured. The UI must remain disabled otherwise.

## Security requirements before production

1. Revoke the previously exposed provider key and issue a replacement.
2. Store the replacement only as a Cloudflare Worker Secret named OPENAI_API_KEY.
3. Configure the Access team domain, audience tag, and Access application for the Worker hostname.
4. Configure ALLOWED_ORIGINS with exact web origins.
5. Create the AI_RATE_LIMITER binding and set an appropriate per-user threshold and spending cap.
6. Return a degraded/unconfigured health status unless every required binding is present.
7. Redact prompts, credentials, and personal data from logs.
8. Keep request IDs and trace IDs across gateway and downstream services.
9. Keep model selection server-controlled and validate request schemas.
10. Keep autonomy execution disabled until policy, approvals, sandboxing, audit, and kill-switch controls are verified.

## Network trust model

Treat all client input, retrieved memory, external documents, and model output as untrusted. Validate each boundary. Do not execute model-generated code or instructions. Every sensitive operation must be independently authorized by deterministic policy.

## Deployment checklist

- [ ] Provider key revoked and replacement created.
- [ ] Cloudflare Worker Secret configured.
- [ ] Exact ALLOWED_ORIGINS configured.
- [ ] Worker deployed and health endpoint verified.
- [ ] Service-to-service authentication configured and tested.
- [ ] Rate limits and spending caps tested.
- [ ] Integration and failure-mode tests pass.
- [ ] Production origins and service URLs recorded without secrets.

Until these items are evidenced, the network mesh is an integration foundation, not a live always-on AI network.
