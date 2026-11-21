# AYHEM 019 — Real-browser IndexedDB transaction and restore tests

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Base: `main` at `5faa450ef3a098fd84f13272a5cd0b8bcf702711`
- Branch: `development/019-real-browser-indexeddb-tests`
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED

## Why this operation exists

Operations 008, 016 and 018 established the IndexedDB adapter, snapshot restore contract, and cognition provenance checks. The existing restore tests used an in-memory probe adapter; they did not execute IndexedDB in an actual browser. This operation adds a Chromium integration test rather than treating adapter mocks as proof of browser transaction behavior.

## Changes

1. Added `core/black-box/test/browser-indexeddb.test.js`.
   - Starts a temporary local HTTP server and loads the real ES modules in Chromium.
   - Uses random, isolated IndexedDB database names.
   - Verifies a duplicate-key request aborts a multi-request readwrite transaction and rolls back the earlier successful request.
   - Closes and reopens the database and verifies committed data persists.
   - Exercises `createMemoryStore.importSnapshot()` against actual IndexedDB and checks first-import and repeat-import results.
   - Does not read or modify founder data, localStorage, or legacy keys.
2. Added `test:browser` to `core/black-box/package.json`.
3. Extended `.github/workflows/ayhem-black-box-tests.yml` to install Playwright/Chromium and run the browser test after the existing Node suite.
4. Updated the Black Box README with exact coverage and limitations.

## Verification

- Source and test changes are committed on the development branch when the PR is opened.
- Real Chromium test result: PENDING GitHub Actions.
- Existing Node suite result: PENDING GitHub Actions.
- No claim of browser verification is made until the workflow completes successfully.

## Safety and limitations

- No change to `main`, production deployment, Cloudflare Worker, secrets, access controls, or user browser storage.
- The test covers one Chromium engine in CI; it does not establish cross-browser behavior, crash recovery, power-loss durability, remote backup, or multi-tab concurrency guarantees.
- Playwright is installed in the CI job with `--no-save`; no dependency lockfile is introduced by this operation.
- A successful CI run verifies this isolated test fixture only, not the user's live browser database or migration safety.

## Next step

Review the workflow result and inspect the test failure details if any. After browser verification, the next engineering task is to review the adapter's blocked-open and concurrent-writer behavior, then design a separately approved, read-only legacy inventory session. Do not migrate or delete any existing memory.
