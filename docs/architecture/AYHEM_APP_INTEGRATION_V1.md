# AYHEM app integration — controlled implementation

## Founder-approved execution path
1. Preserve `main`; all work happens on `integration/ayhem-app-foundation-v1`.
2. Establish Supabase Auth with the existing AYHEM Cloud project.
3. Inspect real table schemas and RLS before connecting memory. No schema changes or migrations without a reviewed plan.
4. Connect TinyFish through the already deployed Supabase Edge Functions; do not call TinyFish directly from the browser and do not spend credits without explicit approval.
5. Package the existing web UI as Android only after auth, memory, and task flows pass end-to-end checks.
6. Keep a dated operation record for every change, test, blocker, and approval. Never merge the branch automatically.

## Current known infrastructure
- Supabase project ref: `qmasgqvfnjlticwmovpn`.
- Existing Edge Functions: `ayhem-tinyfish-health` and `ayhem-tinyfish-run-test`.
- The existing TinyFish functions use JWT verification. The browser must authenticate with Supabase first.
- Existing Black Box memory is browser IndexedDB and is not yet connected to the live AI gateway.
- Existing AI network client expects a separately configured HTTPS Cloudflare Worker. A configured worker URL and Cloudflare Access session are not assumed.

## Authentication adapter
`integrations/supabase/ayhem-supabase-auth.js` provides a small browser client using a pinned Supabase JS version. It requires runtime configuration:
```js
window.AYHEM_SUPABASE = {
  url: "https://qmasgqvfnjlticwmovpn.supabase.co",
  anonKey: "<SUPABASE_PUBLISHABLE_OR_LEGACY_ANON_KEY>"
};
```
Only a publishable/anon key belongs in a browser. Never use the service_role or secret key. The existing user account is not recreated by this adapter.

## Safety and continuity
- No files on `main` are modified by this branch.
- No existing memory is migrated, deleted, overwritten, or dual-written.
- No database tables, RLS policies, secrets, or deployed functions are changed in this operation.
- No Android release or Google Play upload is claimed.
- A pull request is for review only; do not merge until founder approval.
