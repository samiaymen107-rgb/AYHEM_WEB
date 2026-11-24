# Operation 055 — Unified AYHEM cloud runtime integration

Date: 2026-11-23

## Working area

- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Working branch: `integration/ayhem-unified-cloud-runtime-v1`
- Draft PR: [#47](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/47)
- Parent integration PR: [#45](https://github.com/samiaymen107-rgb/AYHEM_WEB/pull/45), still draft and not merged.
- `main` was not changed.

## Current integration map

| Service | AYHEM application path | Verified state |
|---|---|---|
| Supabase | Auth, RLS-protected memory, conversations/messages, Edge Functions | Project active; 11 public tables; owner policies verified on memory/conversation/message tables. |
| OpenAI Platform | `ayhem-openai-chat` Edge Function | Function active, version 2, JWT verification enabled, uses Responses API and `gpt-6.2-astra`. `OPENAI_API_KEY` availability has not been verified. |
| TinyFish | `ayhem-tinyfish-run` and `ayhem-tinyfish-health` | Run function active, version 2, JWT verification enabled. Health function updated to version 21 with GET/OPTIONS CORS support and JWT verification retained. App health check is read-only; task runs still require per-run consent. `TINYFISH_API_KEY` availability remains to be verified by an authenticated app session. |
| GitHub | Source control, review and CI | Connected development surface. PR #47 is a draft and CI checks passed before the latest function-source change; final CI run is tracked on the PR. This connector does not provide an app-runtime GitHub OAuth token. |
| Gmail | ChatGPT Gmail connector | Available to ChatGPT. AYHEM runtime still requires a separate Google OAuth client, redirect URI and user consent; ChatGPT connector credentials are not reusable by the app. |

## Changes in PR #47

- Web AI panel now calls the authenticated `ayhem-openai-chat` function instead of waiting for an unconfigured Cloudflare Worker URL.
- Chat is disabled until a valid Supabase user session exists.
- Cloud memory context is sent to OpenAI only after the user checks the explicit consent option.
- Successful exchanges are written to `ayhem_conversations` and `ayhem_messages` under the authenticated owner.
- TinyFish task execution is disabled until the health endpoint confirms its secret and upstream wallet response.
- Added tests for authentication, AI invocation, memory consent, conversation persistence and error reporting.
- Added CI syntax checks for the Supabase browser integration modules.

## Verified facts and remaining blockers

1. Supabase currently contains one test memory record; the browser runtime previously showed eight local records. They have not been migrated or overwritten.
2. A recent Android request to `/rest/v1/ayhem_memories` returned HTTP 401 with PostgREST code `PGRST303`. Diagnose the JWT/session refresh path before enabling Android memory sync.
3. The Android unified-debug workflow completed successfully and uploaded `AYHEM-AI-Unified-Debug` artifact in run [45042546939](https://github.com/samiaymen107-rgb/AYHEM_WEB/actions/runs/45042546939).
4. No authenticated browser/device test has yet confirmed OpenAI, cloud memory or TinyFish end-to-end.
5. OpenAI key creation was opened through the Platform setup flow, but key creation and adding `OPENAI_API_KEY` to Supabase Edge Function Secrets are not confirmed.
6. No TinyFish automation task has been run from AYHEM during this operation; no task credits were intentionally spent.
7. No Gmail OAuth integration has been configured for AYHEM.
8. No localStorage/IndexedDB import, bulk sync, database schema change, deletion, production web deployment or PR merge was performed.

## Next safe sequence

1. Complete OpenAI key creation and set `OPENAI_API_KEY` in Supabase Edge Function Secrets without exposing it in source control or chat.
2. Sign in to the AYHEM web preview; verify the OpenAI request, conversation persistence, memory consent and TinyFish health status.
3. Diagnose the Android JWT 401, then repeat the memory read test.
4. Design an idempotent, reversible import path for the local JSON memory before any bulk migration.
5. Configure Gmail only after a separate Google OAuth app and scopes are approved.
6. Review and merge PRs only after the live checks pass.

## Preservation

- Keep PR #45 and PR #47 as drafts until their live checks are complete.
- Do not merge to `main` or publish the web app from this operation.
- Do not expose provider keys in browser code or repository files.
- Do not delete or overwrite any existing local or cloud memory.
