# AYHEM Black Box Core — Foundation v1

This directory introduces a small, auditable foundation for AYHEM's runtime. It remains isolated from legacy files until compatibility and migration tests exist.

## Modules
- `policy.js`: deterministic action classification and approval gates.
- `memory-schema.js`: validates sourced, confidence-labelled, immutable memory records.
- `memory-store.js`: append-only memory repository with search, filters, versioned export, snapshot inspection and idempotent restore.
- `indexeddb-memory-adapter.js`: browser IndexedDB persistence adapter; it does not silently fall back to localStorage.
- `ledger.js`: append-only hash-chained audit events using Web Crypto.

## Memory rules
- Existing records are never overwritten or deleted through the memory-store API.
- A correction is a new record that references earlier record IDs through `supersedes`; references must point to older records.
- Snapshot restore validates every record, duplicate IDs, conflicts and supersedes references before a single atomic adapter batch is written.
- Each record requires a source, status, canonical UTC timestamp and confidence from 0 to 1.
- IndexedDB provides browser-local persistence, not a remote backup or a guarantee against browser data clearing. Remote replication and tested backup/restore remain separate work.
- The new store is not yet connected to legacy memory modules or the live AI gateway. No existing memory is migrated or removed.

## Safety model
- Default deny for unknown actions.
- No self-granted permissions.
- External writes, destructive actions, secret access/rotation, deployments, permission changes, and financial actions require founder approval.
- The core does not contain API keys. Runtime secrets must be injected by the hosting platform, never committed to Git.
- This foundation does not itself run continuously. Scheduling, remote storage, monitoring and recovery are separate integration steps.

## Run tests
From this directory with Node.js 20+:
`npm test`

## Integration rule
Do not migrate legacy memory or claim remote durability until backup/restore, compatibility, access-control and end-to-end tests pass.
