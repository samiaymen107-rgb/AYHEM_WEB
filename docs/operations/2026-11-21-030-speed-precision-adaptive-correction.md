# AYHEM 030 — Founder directive: speed, precision and adaptive correction

- Date: 2026-11-21
- Repository: `samiaymen107-rgb/AYHEM_WEB`
- Branch: `governance/030-speed-precision-adaptive-correction`
- Base commit: `c5d6049e10e9b00580510e4690196b1fc921cab7`
- Status: IMPLEMENTED ON BRANCH / CI PENDING / NOT MERGED
- Stage completion: **85%** (standing directives and validator assertions implemented; CI, merge and post-merge verification pending)
- Overall AYHEM engineering progress: **44.75% provisional**, unchanged.

## Objective

Turn the founder's latest operating instruction into a permanent, test-enforced governance rule for every AYHEM development stage.

## Founder directives codified

1. Execution speed: shortest safe path, parallel independent checks, avoid duplicate work, prioritize blockers.
2. Precision: verify repository state, inputs, dependencies, behavior, test results and merge state; never trade correctness for speed.
3. Continuous fault detection: inspect CI failures, runtime errors, security boundaries, regressions and stale status records.
4. Rapid correction: isolate root cause, make the smallest safe fix, rerun targeted tests and regression checks.
5. Adaptive course correction: revise the development sequence when evidence shows the current path is inefficient, unsafe, blocked or unsound.
6. Transparent progress: show stage and overall percentages, evidence date, check outcomes and blockers; documentation-only changes do not inflate project progress.
7. No hidden shortcuts: never skip required tests, suppress failures, conceal regressions or weaken security.

The directives explicitly do not expand authority for production deployment, destructive data operations, credential changes or external disclosure.

## Changes

- `docs/governance/FOUNDER_DIRECTIVES_AND_PROGRESS.md`: added section 8 with the permanent founder directives.
- `tools/validate-governance.mjs`: added required assertions so governance CI fails if the speed, precision, fault-detection or adaptive-correction rules are removed.
- `docs/operations/README.md`: indexed this operation.

## Verification

- Governance CI for this branch: pending.
- Merge and post-merge Pages deployment: pending.
- No application runtime, production Worker, user memory, credentials, or production data was changed.

## Progress

Stage completion is **85%** because the directive and its automated governance checks are implemented, but CI, merge and deployment evidence are not yet complete.

Overall AYHEM engineering progress remains **44.75%**. This governance-only change does not add a verified runtime capability and therefore does not increase the engineering score. Production readiness remains not yet rated.

## Next operation

Continue with the highest-impact verified blocker. Prefer measurable end-to-end reliability improvements over additional architecture documents. The immediate external dependency remains real Cloudflare Access and Worker configuration, which must be verified without exposing credentials or changing production settings without the required approval.
