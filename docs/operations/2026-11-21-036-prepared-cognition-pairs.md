# AYHEM 036 — Prepared cognition records and compact candidate keys

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `development/036-prepared-cognition-pairs`
- Base: `main` after merged PR #23
- Status: MERGED / NODE + CHROMIUM + BENCHMARK CI VERIFIED / PAGES NOT RECONFIRMED
- Pull request: #24
- Merge commit: `c57c6a91078828d64b000b908ad8328145e0b30a`
- Stage completion: **100%**; parity, Node, Chromium, benchmark CI and merge verified.
- Overall AYHEM engineering progress: **44.75% provisional**, unchanged.

## Post-merge evidence for operation 035

- PR #23 merged successfully; merge commit: `92dac7d20fc99f972a6c74c14229aff24c752a67`.
- AYHEM Black Box Tests run `44921828358`: Node foundation tests, real Chromium integration tests and benchmark smoke completed successfully.
- AYHEM Governance Tests run `44921828362`: completed successfully.
- Full-ceiling benchmark output from run `44921828358`:
  - Sparse 1,000: 499,500 possible pairs; 0 candidates; 9.12 ms observed.
  - Dense 1,000: 499,500 candidates; 1,784.23 ms observed.
- Timing is runner-specific, not a portable guarantee.

## Operation 036 — performance refinement

The dense workload showed that each candidate pair was being tokenized and prepared again even though the scan already needed token sets to build its inverted index. Candidate pairs were also materialized twice: as a Set of numeric keys and as an array of two-element arrays.

Changes:
1. Introduce an internal `classifyPreparedPair` helper. Public `classifyMemoryPair` retains its input and threshold validation, then prepares each supplied record once.
2. `analyze()` prepares all source records once and reuses the prepared representation for both inverted postings and pair classification.
3. Store candidate pairs only as numeric keys, sort those keys to preserve the deterministic original pair order, and decode indices during iteration. Remove the second array-of-pairs allocation.
4. Preserve the public result structure, relation rules, provenance, fingerprints, candidate counts and exhaustive `includeUnknown` mode.

## Changed paths

- `core/black-box/memory-cognition.js`
- `docs/operations/2026-11-21-036-prepared-cognition-pairs.md`
- Operations index, catalogue and progress scorecard.

## Safety and correctness

- No source records are modified or deleted.
- No classification rule is intentionally changed in this operation.
- Deterministic ordering and equality with exhaustive mode are release gates.
- No production browser data, user memory, credentials, Worker, Cloudflare settings or live AI endpoint was accessed.

## Progress

- Stage completion: **75% implementation**; Node/Chromium/benchmark CI and merge remain.
- Overall AYHEM engineering progress: **44.75% provisional**, unchanged.
- Production readiness and live AI connectivity remain unverified.

## Verification results

- AYHEM Black Box Tests run `44922079742`: Node foundation tests, real Chromium tests and benchmark smoke all passed.
- AYHEM Governance Tests run `44922079745`: passed.
- Dense 1,000-record workload: 884.78 ms observed versus 1,784.23 ms in operation 035 (about 50.4% lower on comparable CI runner classes).
- Sparse 1,000-record workload: 9.18 ms versus 9.12 ms; no meaningful regression is inferred from this small timing difference.
- These timings are observational, not hardware-independent guarantees.

## Next step

Run the full suite and full-ceiling benchmarks. Compare dense and sparse metrics with operation 035 on the same runner family, inspect all parity tests, and merge only after every required check succeeds.
