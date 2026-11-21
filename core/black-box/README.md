# AYHEM Black Box Core — Foundation v1

This directory introduces a small, auditable foundation for AYHEM's runtime. It remains isolated from legacy files until compatibility and migration tests exist.

## Modules
- `policy.js`: deterministic action classification and approval gates.
- `memory-schema.js`: validates sourced, confidence-labelled, immutable memory records.
- `memory-store.js`: append-only memory repository with search, filters, versioned export, snapshot inspection and idempotent restore.
- `memory-retrieval.js`: deterministic lexical retrieval with explicit filters, ranking and provenance; not semantic reasoning.
- `memory-cognition.js`: bounded, deterministic lexical relationship signals with provenance; not general semantic understanding or fact verification. Derived observations are explicitly marked as inference.
- `memory-integrity.js`: deterministic structural inspection of supersedes lineage, current records, missing references, chronology violations and cycles; it does not infer semantic truth or contradictions.
- `memory-link-compat.js`: explicit facade for legacy synchronous MemoryLink and the asynchronous canonical store; no implicit mirroring or migration.
- `indexeddb-memory-adapter.js`: browser IndexedDB persistence adapter with a multi-entry tag index for atomic cognition de-duplication; schema v1 upgrades to v2 without rewriting records, and it does not silently fall back to localStorage.
- `legacy-memory-preview.js`: read-only inventory of known legacy localStorage keys; reports counts and shapes without exposing stored content or changing source data.
- `../../tools/legacy-memory-audit.html`: local browser page to run the preview and export a metadata-only report.
- `ledger.js`: append-only hash-chained audit events using Web Crypto.

## Memory rules
- Existing records are never overwritten or deleted through the memory-store API.
- A correction is a new record that references earlier record IDs through `supersedes`; references must point to older records.
- Snapshot restore validates every record, duplicate IDs, conflicts and supersedes references before a single atomic adapter batch is written.
- Each record requires a source, status, canonical UTC timestamp and confidence from 0 to 1.
- Retrieval returns original records with source, status, type, timestamp, confidence and supersedes provenance. Its lexical score is a relevance heuristic, not a truth score.
- The lineage inspector reports structural links and malformed references. It does not determine whether two natural-language claims contradict one another.
- The default cognition scan uses an inverted token-postings index to avoid classifying unrelated sparse record pairs; prepared token data is reused across candidate pairs and compact numeric pair keys preserve deterministic order. `includeUnknown: true` deliberately remains exhaustive. Empty negation-only and numeric-only fragments are not promoted to contradiction/tension. The cognition engine classifies only narrow lexical signals: opposite explicit negation over otherwise identical tokens, same lexical frame with different numbers (possible tension), high lexical overlap (similarity), or unknown. These are review hints, not truth judgments. It does not call an LLM or modify source records.
- Persisted cognition output is a separate `observation` record with `status: inference`, a dedicated source, provenance, method version and a deduplication fingerprint. Before persistence, the engine validates the insight shape and fingerprint, fetches both source records, and checks that the claimed provenance matches the stored source metadata. It validates the full input batch before the first append. Derived records are excluded from later cognition scans. The current tag-based deduplication is sequential/idempotent, not a cross-tab or concurrent-writer uniqueness guarantee.
- Legacy MemoryLink remains synchronous. The compatibility facade preserves that API and exposes separate asynchronous canonical operations. Callers explicitly choose the write path; there is no automatic dual-write.
- IndexedDB provides browser-local persistence, not a remote backup or a guarantee against browser data clearing. Remote replication and tested backup/restore remain separate work.
- The new store is not yet connected to the live AI gateway. No existing memory is migrated or removed.

## Safety model
- Default deny for unknown actions.
- No self-granted permissions.
- External writes, destructive actions, secret access/rotation, deployments, permission changes, and financial actions require founder approval.
- The core does not contain API keys. Runtime secrets must be injected by the hosting platform, never committed to Git.
- This foundation does not itself run continuously. Scheduling, remote storage, monitoring and recovery are separate integration steps.

## Cognition engine

`memory-cognition.js` is an intentionally conservative first step. It uses deterministic lexical heuristics only. Explicit contradiction requires identical substantive tokens and numeric context with opposite detected negation. Different numeric values are marked as possible tension, not contradiction. Similarity is lexical overlap, not semantic equivalence. Every finding retains both source records and must be reviewed before operational use. The default scan ceiling is 200 source records; increase only with measured performance and tests.

## Test commands

From this directory with Node.js 20+:

- `npm test` — deterministic foundation and adapter-contract tests.
- `npm run test:browser` — real Chromium integration tests for IndexedDB and credentialed cross-origin CORS (requires the Playwright package and Chromium browser).
- `npm run benchmark:cognition` — synthetic sparse (1,000 records) and dense (1,000 records) scan benchmark; elapsed times are observational, while pair counts are validated.

The real-browser tests verify that duplicate-key failures abort entire multi-request IndexedDB transactions, committed records survive closing and reopening, snapshot restore is idempotent, concurrent adapter connections close on `versionchange`, competing write batches preserve atomic append-only behavior across independent connections, concurrent cognition writers persist one derived insight only, and the AI client completes a cross-origin OPTIONS preflight and authenticated-session cookie transport in a real Chromium browser. CI installs the browser runtime and runs these tests separately from the fast Node suite.

These tests use isolated, randomly named test databases. They do not open, inspect, migrate, or modify any founder browser data or legacy localStorage keys.

## Legacy memory audit
The preview scans `AYHEM_MEMORY`, `AYHEM_LONG_MEMORY`, `ayhemPersistentMemory`, `AYHEM_ARCHIVE`, `AYHEM_ARCHIVE_BACKUP`, and `AYHEM_ARCHIVE_ADVANCED`. It is a read-only inventory only; volatile in-page globals are outside this scan. Review its report before designing any migration.

## Integration rule
Do not migrate legacy memory or claim remote durability until backup/restore, compatibility, access-control and end-to-end tests pass.
