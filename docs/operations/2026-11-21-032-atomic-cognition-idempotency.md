# AYHEM 032 — Atomic cross-tab cognition insight persistence

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/032-atomic-cognition-idempotency`
- Base: `main` after merged PR #19
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED
- Stage completion: **85% implementation**; Node and real Chromium CI, review of results, merge and post-merge verification remain.
- Overall AYHEM engineering progress: **44.75% provisional**, unchanged until the cross-tab guarantee is verified and broader integration evidence is assessed.

## Finding

The cognition engine's tag-based duplicate prevention previously read all existing tags and then appended derived insights in separate operations. This was sequentially idempotent but not atomic across tabs or independent writers: two callers could both observe the same insight as absent and both append it.

## Implementation

1. `core/black-box/indexeddb-memory-adapter.js`
   - Added `addRecordIfTagAbsent(record, tag)`.
   - Performs the tag scan and conditional insert inside one IndexedDB readwrite transaction.
   - Returns whether the record was inserted; transaction errors remain visible.
2. `core/black-box/memory-store.js`
   - Added `appendIfTagAbsent(input, tag)`.
   - Creates and validates a normal append-only memory record, checks supersedes references, and delegates the atomic uniqueness decision to the adapter.
   - Does not update or delete existing records.
3. `core/black-box/memory-cognition.js`
   - Uses the atomic store capability when available.
   - A competing writer that finds the tag already present reports the fingerprint as skipped.
   - Retains a compatibility fallback for non-IndexedDB stores; that fallback is sequentially idempotent only and is not claimed cross-tab safe.
4. `core/black-box/browser/indexeddb.test.js`
   - Added a real Chromium test with two independent adapters and two cognition instances sharing one isolated database.
   - Both analyze the same immutable source pair and attempt to persist the same insight concurrently.
   - Requires exactly one derived record, one skipped fingerprint, and both source records intact.
5. `core/black-box/README.md`
   - Documents the guarantee and the compatibility fallback limitation.

## Verification gates

- Node foundation suite: PENDING GitHub Actions.
- Real Chromium suite: PENDING GitHub Actions.
- Cross-tab idempotency: implementation present; not VERIFIED until the real-browser test passes.
- No production database, founder browser storage, localStorage, secrets, Cloudflare configuration or live Worker was accessed.

## Progress and next step

- Stage completion: **85% implementation**; CI and post-merge evidence are outstanding.
- Overall engineering progress: **44.75% provisional**, unchanged.
- Production readiness and live AI connectivity remain unverified.
- After CI, inspect the job summaries and logs, fix any regression, merge only when all required tests pass, then verify main and Pages.
- Next technical priority after this operation: bounded cognition scan performance and source-record change detection, followed by a separate review of any live integration requirements.
