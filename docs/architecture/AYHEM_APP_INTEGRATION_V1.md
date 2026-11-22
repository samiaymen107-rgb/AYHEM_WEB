# AYHEM app integration — controlled implementation

## Founder-approved execution path
1. Preserve `main`; all work happens on `integration/ayhem-app-foundation-v1`.
2. Establish Supabase Auth with the existing AYHEM Cloud project.
3. Inspect real table schemas and RLS before connecting memory. No schema changes or migrations without a reviewed plan.
4. Connect TinyFish through authenticated Supabase Edge Functions. Never call TinyFish directly from the browser.
5. Package the existing web UI as Android only after auth, memory, and task flows pass end-to-end checks.
6. Keep a dated operation record for every change, test, blocker, and approval. Never merge the branch automatically.

## Current infrastructure
- Supabase project ref: `qmasgqvfnjlticwmovpn`.
- Existing Edge Functions: `ayhem-tinyfish-health`, `ayhem-tinyfish-run-test`.
- New Edge Function deployed: `ayhem-tinyfish-run` (JWT verification enabled).
- Existing Black Box memory is browser IndexedDB and is not yet connected to the live AI gateway.
- Existing AI network client requires a separately configured HTTPS Cloudflare Worker and Cloudflare Access session.

## Supabase Auth
- Browser client uses a pinned Supabase JS dependency and a publishable key only.
- The existing user is used; no new user or password reset is created.
- Auth adapter: `integrations/supabase/ayhem-supabase-auth.js`.
- Public runtime configuration: `integrations/supabase/public-config.js`.
- Login/session UI: `integrations/supabase/ayhem-auth-ui.js`.
- Main entry page now contains login and sign-out controls.
- Never place service_role or Supabase secret keys in browser files.

## TinyFish tasks
- Function: `ayhem-tinyfish-run`.
- URL: `https://qmasgqvfnjlticwmovpn.supabase.co/functions/v1/ayhem-tinyfish-run`.
- JWT verification is enabled. The Supabase JS client supplies the authenticated session.
- The function accepts HTTPS URL + goal, bounds goal length and duration, and reads `TINYFISH_API_KEY` only server-side.
- UI requires a per-run consent checkbox warning that the task may consume TinyFish credits.
- The function has been deployed but has NOT been invoked in this operation; no TinyFish credits were consumed.

## Remote memory adapter
- `integrations/supabase/ayhem-remote-memory.js` provides explicit append/list operations on `public.ayhem_memories`.
- The table has RLS enabled and an authenticated owner policy using `owner_id = auth.uid()`.
- The adapter does not update/delete rows and does not access localStorage or IndexedDB.
- It is not yet wired into the legacy memory runtime. No migration or dual-write is active.
- Existing table rows were observed as empty during inspection; no row was inserted or changed.

## Safety and continuity
- All source changes are isolated to `integration/ayhem-app-foundation-v1`.
- No existing local memory was migrated, deleted, overwritten, or dual-written.
- No database tables, RLS policies, or secrets were changed.
- The new Edge Function is additive; existing TinyFish functions were not replaced.
- No Android APK, Play Store release, or live AI gateway connection is claimed.
- Do not merge the review branch without founder approval.
