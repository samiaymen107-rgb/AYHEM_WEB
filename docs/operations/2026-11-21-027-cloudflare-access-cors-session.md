# AYHEM 027 — Cloudflare Access CORS and browser session transport

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/027-cloudflare-access-cors-session`
- Base commit: `388a670509739a8344526a13d652f950133c5a6e`
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED
- Stage completion: **85%** (client, Worker, legacy bridge, tests, and documentation updated; CI and Cloudflare Access application configuration remain pending)
- Overall AYHEM engineering progress: **44.75% (recalibrated provisional estimate)**

## Objective

Close the cross-origin authentication transport gap between the browser client and the Access-protected Worker without exposing provider credentials or weakening authenticated POST/GET routes.

## Verified issue

The browser client previously used the default fetch credential mode, which does not send cookies to a different origin. The Worker also omitted `Access-Control-Allow-Credentials: true`. In addition, Cloudflare Access blocks preflight OPTIONS requests on protected cross-origin applications by default unless the Access application's CORS settings handle them or narrowly allow OPTIONS to reach the origin.

Official references:
- [Cloudflare Access CORS](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/cors/)
- [Cloudflare Access authorization cookies and JWTs](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/)
- [Cloudflare JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

## Code changes

- `integrations/ai-network/ayhem-ai-client.js`: added a validated `credentials` option, defaulting to `include`, and passes it to cross-origin fetch calls.
- `AYHEM_JS_Worker.js`: returns `Access-Control-Allow-Credentials: true` with the exact origin already checked against `ALLOWED_ORIGINS`.
- `ayhem-bridge-safe.js`: legacy browser bridge now includes the Access session cookie.
- `integrations/ai-network/ayhem-ai-client.test.js`: asserts that health and AI calls include credentials and rejects invalid credential modes.
- `integrations/ai-network/ayhem-worker.test.js`: verifies exact-origin credentialed OPTIONS response headers.
- `integrations/ai-network/ayhem-bridge-safe.test.js`: verifies the legacy bridge includes Access session credentials.
- Updated AI network documentation and the deployment checklist with the required Access CORS settings.

## Security boundaries

- CORS remains an origin policy, not authentication.
- The Worker still validates `Cf-Access-Jwt-Assertion` for authenticated GET /health and POST /.
- Only OPTIONS is allowed to reach the Worker without the Access JWT; it returns no private data and does not call the provider.
- POST and GET must remain protected by Cloudflare Access and Worker JWT validation.
- `Access-Control-Allow-Origin` remains an exact allow-listed origin; wildcard origins are not used with credentials.
- No API key, service token, or JWT is placed in browser code.

## Cloudflare configuration still required

In the Cloudflare Zero Trust Access application protecting the Worker, configure CORS preflight to match:
- exact website origin;
- methods `GET, POST, OPTIONS`;
- allowed request header `Content-Type`;
- `Access-Control-Allow-Credentials: true`.

Use Cloudflare's CORS response configuration or narrowly allow OPTIONS requests to reach the Worker. Do not bypass Access for POST or GET. Browser privacy settings may still block third-party cookies; a same-site custom API domain or same-origin backend route may be required.

This repository change does not alter the Cloudflare account configuration and does not claim a live authenticated browser connection.

## Verification

- Node client, Worker, and legacy bridge tests: pending GitHub Actions for this branch.
- Real browser cross-origin preflight and authenticated session: pending an actual configured Access application and browser environment.
- Worker deployment and live health check: not performed.

## Progress

Overall engineering progress remains **44.75%** until the cross-origin flow is verified end-to-end. This stage improves the implementation, but the external Access configuration and live test are still outstanding.

## Next stage

Run the full Node suite and add a real-browser CORS preflight test. After the founder's Cloudflare Access application is configured, verify a browser session, authenticated health response, and one non-sensitive AI request. Do not expose tokens or prompts in logs.


## Status correction — 2026-11-21

- PR #15 merged into `main` at `48b7a17ef3b4c79e74850782d4b8cd5cf0d271c0`.
- AI Network Client Tests passed on the PR branch and after merge.
- Governance CI passed on the PR branch and after merge.
- GitHub Pages deployment passed after merge.
- Stage completion: **95%**. The remaining 5% is the Cloudflare Access application CORS configuration and real-browser verification, addressed by operation 028.
- Overall AYHEM engineering progress remains **44.75% (provisional)** pending real-browser integration evidence and external Access configuration.
