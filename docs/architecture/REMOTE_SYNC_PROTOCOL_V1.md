# AYHEM Remote Sync Protocol — Design Baseline v1

- Status: DESIGN ONLY; no server deployed.
- Related implementation: local IndexedDB outbox schema v3 and `createSyncOutbox`.
- Security posture: deny by default; no network transmission until a separately reviewed sync client is enabled by explicit user consent.

## 1. Goals
- Replicate append-only memory records across authorized devices without overwriting history.
- Make retries safe through stable event IDs and server-side uniqueness constraints.
- Resume interrupted transfers from durable cursors.
- Detect conflicting reuse of IDs and preserve provenance.
- Support independently verifiable backup and restore.

## 2. Proposed service boundary

The service is provider-neutral. A later deployment may use a Worker/API gateway plus a durable database and object storage, but no provider is selected or provisioned by this document.

| Endpoint | Purpose |
|---|---|
| `GET /v1/sync/health` | Non-sensitive service health and protocol version |
| `POST /v1/sync/events:push` | Submit a bounded batch of append-only events |
| `GET /v1/sync/events:pull?cursor=...` | Read events after an opaque server cursor |
| `GET /v1/sync/snapshots/{id}` | Retrieve a verified backup manifest and chunks |
| `POST /v1/sync/snapshots` | Create a backup manifest after authorization |

All routes require authenticated, user-scoped authorization except a deliberately minimal health endpoint. CORS is an allowlist, rate limits are mandatory, and server logs must not contain memory content or credentials.

## 3. Event envelope

Required fields: `protocolVersion`, `eventId`, `deviceId`, `recordId`, `recordSchemaVersion`, `createdAt`, `payload`, and `payloadDigest`.

- `eventId` is generated once on the originating device and reused on every retry.
- The server enforces a unique constraint on `(tenantId, eventId)`.
- Repeated event IDs with the same canonical digest return the original acknowledgement.
- Repeated event IDs with a different digest return `409 event_id_conflict`; neither version overwrites the other.
- The payload is a validated canonical memory record; correction uses `supersedes`, never update-in-place.
- Pull responses use opaque cursors and stable ordering; clients persist the cursor only after the received batch is committed locally.

## 4. Delivery algorithm

1. Append the canonical memory record locally.
2. Enqueue a durable outbox event in the same logical write workflow; where atomic cross-store writes are unavailable, reconcile using the stable record ID.
3. On explicit sync or an enabled foreground sync policy, read a bounded pending batch.
4. Send with a short-lived scoped token over HTTPS; do not retry non-idempotent requests with a new event ID.
5. Validate every per-event acknowledgement before marking the event delivered.
6. On transient failure, retain the event and apply bounded exponential backoff with jitter; permanent validation failures remain visible for user review.
7. Pull remote events, validate schema and provenance, and append them locally. Never silently replace an existing record.

## 5. Encryption and key management gates

- TLS is required in transit.
- Server-side storage encryption and managed key rotation are required at rest.
- Client-side end-to-end encryption is a separate design gate: select a reviewed cryptographic library, define per-device keys, device enrollment, revocation, multi-device recovery, and lost-key behavior before implementation.
- Never embed provider API keys or long-lived service secrets in browser code or repository files.
- Do not invent a passphrase recovery path that silently weakens encryption.

## 6. Identity and authorization

- Verify short-lived identity tokens at the service boundary (for example, Cloudflare Access JWT verification if that provider is selected).
- Bind every read/write to a stable user/tenant identity and authorized device.
- Enforce per-user quotas, payload limits, rate limits, token expiry, device revocation, and audit metadata.
- A valid AI-provider key is not a substitute for user authentication or sync authorization.

## 7. Conflict and recovery policy

- Memory is append-only. Corrections are new records with `supersedes` references.
- Same ID + same digest is an idempotent duplicate; same ID + different digest is a conflict requiring review.
- Missing parents, invalid chronology, schema mismatch, or invalid provenance are quarantined; they are not auto-accepted.
- Backup restore runs a dry-run inspection first, checks counts and digests, imports idempotently, and verifies a post-restore export.
- Retain a recovery point before schema migrations and test restore on an isolated database.

## 8. Privacy and user controls

- No camera, microphone, network, or background content capture is implied by sync.
- Sync is off until the user explicitly enables it and selects the account/device scope.
- Provide pause, resume, revoke-device, export, and disconnect controls.
- Do not upload the legacy localStorage inventory or its contents automatically.

## 9. Release gates — all required before calling cloud sync ready

1. A real server is deployed with TLS, authentication, tenant isolation, rate limits, and durable storage.
2. Secrets are stored server-side and rotated; any previously exposed provider key is revoked.
3. Push/pull integration tests cover retries, duplicate IDs, digest conflicts, interrupted transfers, cursor resume, and multi-device concurrency.
4. Security tests cover unauthorized access, cross-tenant isolation, token expiry, abuse limits, and data leakage.
5. Backup/restore tests verify record counts, digests, references, and idempotent repeat restore.
6. Operational monitoring, backup retention, incident response, and a tested rollback plan exist.
7. Explicit user consent and disconnect/revocation controls are verified in the UI.

Until all gates pass, the correct status is LOCAL OUTBOX IMPLEMENTED / CLOUD SYNC NOT DEPLOYED.