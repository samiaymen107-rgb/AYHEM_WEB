# AYHEM 020 — IndexedDB blocked-open lifecycle hardening

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/019-real-browser-indexeddb-tests` (extends PR #8)
- Status: IMPLEMENTED ON PR BRANCH / CI PENDING / NOT MERGED

## Finding

Reviewing the adapter after the real-browser test exposed a lifecycle edge case: an IndexedDB open request can emit `blocked`, causing the adapter to reject the caller and clear its cached promise, but the same request may later emit `success`. The previous handler would then leave an unowned database connection open.

## Change

- Track settlement of each open request.
- On `blocked`, reject the caller and clear only that request's cached promise.
- If the blocked request later succeeds, immediately close the late database connection.
- Protect a newer retry promise from being cleared by callbacks belonging to an older request.
- Make `close()` clear only the connection promise it actually closed.
- Add a deterministic regression test simulating blocked-then-late-success and verifying retry remains usable.

## Safety

No user browser data, localStorage, production service, secret, permission, or deployment is touched. This is an adapter lifecycle fix and isolated test only.

## Verification

CI is pending for this change. The existing Chromium integration test from operation 019 remains part of the same pull request. No claim of passing tests is made until Actions completes.
