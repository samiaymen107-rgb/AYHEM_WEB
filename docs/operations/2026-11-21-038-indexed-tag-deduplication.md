# AYHEM 038 — Indexed tag lookup for atomic cognition de-duplication

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/038-indexed-tag-deduplication`
- Base: `main` after merged PR #25
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED
- Stage completion: **75% implementation**; Node, Chromium migration, concurrency and regression CI remain.
- Overall AYHEM engineering progress: **44.75% provisional**, unchanged.

## Problem

The IndexedDB adapter's `addRecordIfTagAbsent(record, tag)` previously loaded every record with `getAll()` and scanned every `tags` array for each attempted cognition write. This preserved atomicity because the scan and append shared one readwrite transaction, but its lookup cost grew with the full memory size.

## Implementation

1. Upgrade the IndexedDB database schema from version 1 to version 2.
2. Add a non-unique multi-entry `tags` index. Existing version-1 records are indexed by the browser's schema-upgrade transaction; no record content is rewritten.
3. Replace the full-store `getAll()` scan with `records.index("tags").get(tag)`.
4. Keep the indexed lookup and conditional `add(record)` inside the same readwrite transaction, preserving serialized cross-connection write behavior.
5. Extend real Chromium tests to:
   - create a genuine version-1 database with an existing tagged record;
   - open it through the adapter and verify automatic version-2 migration;
   - prove the existing tag blocks a duplicate append;
   - prove a new tag appends successfully;
   - advance the independent-connection versionchange test to version 3.

## Changed paths

- `core/black-box/indexeddb-memory-adapter.js`
- `core/black-box/browser/indexeddb.test.js`
- `core/black-box/README.md`
- `docs/operations/2026-11-21-037-operation-036-reconciliation.md`
- `docs/operations/2026-11-21-038-indexed-tag-deduplication.md`
- Operations index, report catalogue and progress scorecard.

## Safety and compatibility

- Append-only memory semantics remain unchanged.
- No existing memory record is deleted or rewritten.
- The schema upgrade only creates an index; the migration test uses an isolated synthetic database.
- The duplicate check remains inside the same readwrite transaction as the append; moving it outside would reintroduce a race and is explicitly avoided.
- No founder browser data, localStorage, production database, credentials, Cloudflare configuration, Worker or live AI endpoint is accessed.

## Progress

- Stage completion: **75% implementation**; required CI and merge remain.
- Overall AYHEM engineering progress: **44.75% provisional**, unchanged.
- Production readiness and live AI connectivity remain unverified.

## Next step

Run the Node suite and real Chromium suite, inspect migration and concurrent writer results, and merge only if all required checks pass. Then verify the post-merge main commit and deployment status independently.
