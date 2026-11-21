# AYHEM 022 — Concurrent IndexedDB write atomicity

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/022-indexeddb-concurrent-write-atomicity`
- Base: `c34f4165ace66a278aaf86eb56973fcc38afe0f7`
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED

## Scope

Verify that independent adapter instances cannot partially commit competing append-only batches when both attempt to insert the same primary key.

## Test behavior

- Create two independent adapters connected to one randomly named IndexedDB database.
- Start two read-write batches concurrently. Each batch contains the same shared record ID and one unique record ID.
- Require exactly one transaction to commit and the other to reject on the duplicate key.
- Verify the final database contains the shared record and only the unique record belonging to the winning transaction.
- Close both adapter connections and delete only the isolated test database.

## Why this matters

The IndexedDB transaction scheduler serializes conflicting read-write transactions for the same object store. The test verifies the adapter relies on the browser's transaction atomicity rather than allowing a losing batch's earlier unique request to remain committed.

## Safety

- Uses a cryptographically random test database name.
- Does not inspect or modify founder browser storage, legacy localStorage, production databases, secrets, Worker configuration, or production services.
- No user-data migration or production schema change.

## Verification

Pending GitHub Actions. Both the Node foundation suite and the real Chromium suite must pass before merge.

## Follow-up

After verification, assess append-only behavior at the memory-store boundary and identify any remaining cross-tab deduplication guarantees that are not enforced by IndexedDB's unique primary key.
