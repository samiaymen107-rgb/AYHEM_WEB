# AYHEM 028 — Real-browser CORS and Access session transport

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/028-real-browser-access-cors`
- Base commit: `48b7a17ef3b4c79e74850782d4b8cd5cf0d271c0`
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED
- Stage completion: **85%** (isolated real-browser test and CI wiring implemented; CI and merge pending)
- Overall AYHEM engineering progress: **44.75% (provisional)**

## Objective

Verify in a real Chromium browser that the AYHEM client can call a different origin using credentialed CORS, complete the OPTIONS preflight, and send the Access session cookie on the actual health and AI requests.

## Test design

- Start two local HTTP servers on the same host but different ports, making them different origins while remaining same-site for cookie testing.
- Set a test-only `CF_Authorization` cookie on the gateway origin.
- Load the AYHEM client from the application origin.
- Call `GET /health` and `POST /` using the production client, which defaults to `credentials: "include"`.
- Verify the browser performs an OPTIONS preflight for the JSON POST.
- Verify the gateway receives the test session cookie on both GET and POST.
- Verify the health and AI response envelopes are accepted by the real client.

## Changes

- Added `core/black-box/browser/cors.test.js`.
- Updated `core/black-box/package.json` so `test:browser` runs every browser integration test.
- Renamed the browser CI step to reflect that it now covers more than IndexedDB.
- Updated `core/black-box/README.md` with the expanded test coverage.
- Updated the operation 027 status and indexed this report.

## Safety and limits

- The test uses only a synthetic local cookie and local HTTP servers.
- No real Cloudflare account, real Access token, API key, user prompt, production endpoint, or production database is accessed.
- This proves browser CORS and cookie transport against a controlled test origin. It does **not** prove Cloudflare Access application configuration is correct or that the live Worker is deployed.
- The actual Cloudflare Access app must still answer the preflight or narrowly allow OPTIONS to reach the Worker; POST and GET must remain authenticated.

## Verification

- Node foundation tests: pending GitHub Actions.
- Real Chromium CORS and IndexedDB integration tests: pending GitHub Actions.
- GitHub Pages deployment: not applicable to this test-only stage.
- Live Access session and Worker health check: pending external Cloudflare configuration.

## Progress

Overall engineering progress remains **44.75%** until the real-browser test passes and the Cloudflare Access application configuration is verified. Production readiness remains not yet rated.

## Next stage

Run the test suites and inspect the Chromium result. Then complete the Cloudflare Access dashboard configuration and verify a real browser session, authenticated health response, and one non-sensitive AI request without logging credentials or prompt content.
