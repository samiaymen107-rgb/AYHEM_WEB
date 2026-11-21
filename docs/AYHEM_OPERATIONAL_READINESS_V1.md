# AYHEM Operational Readiness — V1

Status: engineering baseline; not production approval.

## Current components

- Deterministic autonomy policy: classifies low-risk, sandbox-conditional, sensitive, and unknown actions.
- Memory record validator: requires identity, type, content, status, timestamp, source, and confidence.
- Hash-chained audit helper: detects modifications within a supplied event sequence.
- Cloudflare Worker gateway: reads the provider credential from the server-side `OPENAI_API_KEY` binding.
- Browser bridge: requires an explicitly configured HTTPS Worker endpoint and reports connection errors.

## Explicit limitations

1. The memory schema is a validator, not a database or a retrieval engine.
2. The ledger helper is in-memory computation. It is not durable, append-only storage until backed by a protected database or object store with retention controls.
3. A hash chain detects changes only when the trusted chain head is protected independently. It does not by itself prevent deletion or rollback.
4. Browser CORS origin checks are not user authentication. The public Worker endpoint needs rate limiting and abuse monitoring before public launch.
5. The Worker is a single AI gateway call, not yet the full cognitive orchestration engine.
6. A successful CI run validates only the checks actually executed; it does not prove production readiness.

## Required deployment gates

- Revoke the previously exposed provider credential at its issuer.
- Create a replacement credential and store it only as a Cloudflare Worker Secret named `OPENAI_API_KEY`.
- Set `ALLOWED_ORIGINS` to exact production origins; do not use wildcard origins.
- Configure an explicit Worker URL in the browser application.
- Add Cloudflare rate limiting (or a Durable Object limiter) and request-size enforcement.
- Add durable memory storage with encryption, access controls, backup, restore tests, and retention policy.
- Protect audit checkpoints outside the primary writable store.
- Run unit tests, Worker integration tests, dependency/security checks, and a staging smoke test.
- Verify that logs never contain prompts, secrets, or unnecessary personal data.

## Release rule

Do not promote this foundation to production until every required deployment gate is evidenced. Keep production deployment, secret rotation, destructive data operations, and permission changes under explicit founder approval.
