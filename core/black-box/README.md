# AYHEM Black Box Core — Foundation v1

This directory introduces a small, auditable foundation for AYHEM's autonomous runtime. It is deliberately isolated from legacy files until compatibility and migration tests exist.

## Modules
- `policy.js`: deterministic action classification and approval gates.
- `memory-schema.js`: validates memory records and preserves provenance/confidence.
- `ledger.js`: append-only hash-chained audit events using Web Crypto.

## Safety model
- Default deny for unknown actions.
- No self-granted permissions.
- External writes, destructive actions, secret access/rotation, deployments, permission changes, and financial actions require founder approval.
- The core does not contain API keys. Runtime secrets must be injected by the hosting platform (for example Cloudflare Worker Secrets), never committed to Git.
- This foundation does not itself run continuously. A scheduler/Worker deployment and monitored storage are separate integration steps.

## Run tests
From repository root with Node.js 20+:
`node --test core/black-box/test/*.test.js`

## Integration rule
Do not wire this into production or migrate legacy memory until backup/restore, compatibility, access-control, and end-to-end tests pass.
