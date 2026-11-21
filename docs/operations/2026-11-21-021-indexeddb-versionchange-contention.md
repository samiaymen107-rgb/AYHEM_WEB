# AYHEM 021 — IndexedDB versionchange and connection contention

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/021-indexeddb-versionchange-contention`
- Base: `e4d26aa93caacfe19e366ed61d7a8df264beee85`
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED

## Scope

Extend the real Chromium suite beyond transaction rollback and restore to cover two independent adapter instances holding connections to the same database while a schema-version upgrade is requested.

## Test behavior

- Create two independent adapters with a unique, isolated database name.
- Open both connections through real adapter operations.
- Request a version 2 database upgrade using the browser IndexedDB API.
- Verify both adapter connections respond to `versionchange` by closing, allowing the upgrade to complete without a blocked event.
- Close the upgraded connection and delete only the uniquely named test database.

## Why this matters

A browser may keep an old database connection alive across tabs or independent components. A schema upgrade must not remain blocked by connections owned by the adapter. The adapter's `onversionchange` handler is expected to close its connection and release the cached connection promise.

## Safety

- Uses a cryptographically random test database name.
- Does not inspect or modify founder browser storage, legacy localStorage, production databases, secrets, Worker configuration, or production services.
- No schema migration of user data is performed.

## Verification

Pending GitHub Actions for this branch. The existing Node foundation suite and Chromium integration suite must both pass before merge.

## Follow-up

After CI passes and this operation is merged, assess whether database versioning should be centralized before any production schema evolution. Do not introduce a data migration until backup and restore behavior is explicitly reviewed.
