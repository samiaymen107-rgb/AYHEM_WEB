# AYHEM per-user rate limiting — implementation proposal

Status: implementation merged into GitHub main by the repository workflow on 2026-11-26. The migration file is committed but is NOT applied to the production Supabase project; the Edge Function change is NOT deployed.

## Objective
Protect Groq usage and the AYHEM service from one authenticated account consuming an unfair share of requests. The first release uses a fixed window of **20 requests per user per 60 seconds**. These are conservative initial defaults, not a pricing or capacity guarantee.

## Architecture
1. The Edge Function continues to require a bearer token and POST.
2. After validating the request shape and before deterministic or remote inference, the Edge Function calls the authenticated Supabase RPC using the caller's existing JWT and the public/anon project key.
3. The RPC derives identity from `auth.uid()`. It accepts no user ID or quota configuration from the browser or request body; the 20-request / 60-second policy is fixed inside the database function.
4. A single row per Auth user is atomically inserted/updated with PostgreSQL `INSERT ... ON CONFLICT DO UPDATE`. Concurrent requests for one account serialize on the primary-key conflict.
5. The RPC returns `allowed`, `remaining`, and `reset_at`. The Edge Function returns HTTP 429 with a safe Arabic message and `Retry-After` when denied.
6. Any RPC error fails closed (503); inference is not called if quota accounting is unavailable.

## Security boundaries
- The counter table has RLS enabled, no client policies, and no table grants to anon/authenticated.
- Only authenticated users may execute the RPC. The SECURITY DEFINER function uses an empty search_path and fully-qualified objects.
- The RPC uses `auth.uid()`, so clients cannot consume or inspect another user's quota.
- Never place the service-role key in browser code or pass a user ID into this RPC.
- No automatic paid-provider fallback is introduced. Groq remains the only remote inference provider in zero-cost mode.
- The limit is per authenticated account, not per IP/device. It does not prevent Sybil abuse through many newly-created accounts; signup/email verification and optional IP-level controls are a separate later phase.

## Failure and response policy
- Missing/invalid session: preserve existing 401 behavior.
- Malformed request: preserve existing 400 behavior; malformed traffic does not consume inference quota.
- Quota exceeded: 429, include remaining=0 and reset timestamp; no Groq request.
- RPC unavailable or unexpected result: 503, fail closed; no Groq request.
- Allowed: continue existing deterministic/Groq behavior unchanged.
- CORS must expose `Retry-After` only if the client needs to read it; otherwise the UI can use the JSON reset timestamp.

## Tests required before deployment
- unauthenticated RPC execution is rejected;
- anon cannot execute the RPC or read/write the counter table;
- authenticated user A cannot read or spend user B's quota;
- first request is allowed, request 20 allowed, request 21 denied;
- next fixed window resets the counter;
- simultaneous requests cannot exceed the configured allowance;
- callers cannot change the server-side limit or window;
- quota denial never calls Groq and returns 429;
- RPC failure returns 503 and never calls Groq;
- deterministic core replies are subject to the same policy;
- existing no-paid-fallback, memory-isolation, and response behavior tests remain green.

## Rollout / rollback
1. Confirm the production Edge Function version and current project migration history using read-only checks.
2. Verify required Edge Function environment variables (`SUPABASE_URL` and a publishable/anon API key) without printing secret values.
3. Test the exact migration in a disposable Supabase project, including Auth JWT identity, RLS, grants, and concurrent requests. The PostgreSQL CI harness is necessary but is not a substitute for a Supabase Auth integration test.
4. Review Supabase security and performance advisors in the isolated project.
5. Obtain explicit owner approval before applying the migration to production.
6. After migration verification, obtain separate explicit approval before deploying the matching Edge Function.
7. Monitor 429/503 rates and request latency; reconsider the initial 20/60s limit using observed traffic.
8. Rollback: disable the Edge Function's RPC check first, then consider removing the RPC/table only after explicit approval and after confirming no dependent traffic. Never delete user memory or application records.

## Not included
The `main` branch contains the Edge Function integration and migration source. No migration execution, production schema change, Edge Function deployment, user data modification, or account creation has been performed.
