# AYHEM Operation 018 — Cognition provenance validation

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/018-cognition-provenance-validation`
- Base: `main` at merge commit `8a787295e65e34b428102791ce5262dc19dd6e01`
- Status: IMPLEMENTED / CI PENDING / REVIEW REQUIRED

## Objective

Harden the optional persistence boundary of the cognition engine. An insight must not be persisted merely because it has a plausible shape: both referenced source records must exist, must be original source records, and must match the provenance carried by the insight.

## Changes

- `core/black-box/memory-cognition.js`
  - Requires the canonical store's `get` operation in addition to `list` and `append` when persisting insights.
  - Validates the relation, ordered distinct source IDs, two provenance entries, evidence structure, reason, bounded confidence, fingerprint format, and recomputed fingerprint.
  - Fetches both source records and compares record ID, source, status, type, timestamp, and confidence against the claimed provenance.
  - Rejects missing or derived source records.
  - Validates every candidate in the input batch before performing the first append, so a malformed later candidate cannot cause partial writes.
- `core/black-box/test/memory-cognition.test.js`
  - Adds checks for forged provenance and missing source records.
  - Adds checks for malformed provenance and invalid confidence.

## Safety and limitations

- Source records remain unchanged.
- The new validation is a persistence-integrity check, not proof that a lexical inference is true.
- The FNV-1a fingerprint is a compact deduplication identifier, not a cryptographic integrity mechanism.
- Tag-based idempotency is sequential. Concurrent writers or multiple browser tabs can still race without an adapter-level atomic unique constraint.
- The append phase itself is not a multi-record transaction. If the adapter fails during a sequence of valid appends, earlier appends may already have succeeded.
- No migration, live AI connection, secret access, or production deployment was performed.
- Real-browser IndexedDB transaction/rollback tests remain pending.

## Verification

- Code and tests committed on the development branch.
- CI result: pending at report creation; update this report and the operations index after GitHub Actions completes.

## Next step

Open a pull request, run the black-box CI workflow, inspect the resulting diff, and retain the browser IndexedDB test as a separate gate.
