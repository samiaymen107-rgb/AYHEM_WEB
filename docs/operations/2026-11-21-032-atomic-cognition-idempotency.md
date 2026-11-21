# AYHEM 032 — Atomic cross-tab cognition insight persistence

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/032-atomic-cognition-idempotency`
- Base: `main` after merged PR #19
- Status: MERGED / NODE + REAL CHROMIUM CI VERIFIED / PAGES NOT RECONFIRMED
- Merge commit: `bfebcc16f22e896ab9c98b38bd07f31ff981805c`
- Pull request: #20
- Stage completion: **100%**; implementation, Node CI, real Chromium CI and merge verified. Post-merge Pages deployment not independently confirmed.
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

- Node foundation suite: VERIFIED — run `44921001011`, step `Run foundation tests` success.
- Real Chromium suite: VERIFIED — run `44921001011`, step `Run real-browser integration tests` success.
- Cross-tab idempotency: VERIFIED by the real Chromium test using two independent adapter instances.
- No production database, founder browser storage, localStorage, secrets, Cloudflare configuration or live Worker was accessed.

## Progress and next step

- Stage completion: **100%**; CI and merge verified. Pages post-merge not reconfirmed.
- Overall engineering progress: **44.75% provisional**, unchanged.
- Production readiness and live AI connectivity remain unverified.
- After CI, inspect the job summaries and logs, fix any regression, merge only when all required tests pass, then verify main and Pages.
- Next technical priority after this operation: bounded cognition scan performance and source-record change detection, followed by a separate review of any live integration requirements.
