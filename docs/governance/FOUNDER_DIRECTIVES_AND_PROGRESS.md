# AYHEM — Founder Directives and Progress Measurement Standard

- Authority: Founder standing instruction
- Effective date: 2026-11-21
- Applies to: AYHEM repositories, development stages, operational reports, and future contributors/agents
- Status: ACTIVE

## 1. Founder standing instructions

These directives apply at every development stage and are not limited to one conversation.

1. Start each stage with a written objective, scope, acceptance criteria, and risk boundary.
2. Inspect the current repository state and the previous operation report before changing code.
3. Implement changes on a dedicated branch; do not write directly to the protected or default branch.
4. Run relevant automated tests and inspect their results. Fix failures before proceeding when the cause is understood and within the authorized scope.
5. Do not claim a test, deployment, integration, or feature is complete without direct evidence.
6. Publish a stage report and update the operations index before beginning the next stage.
7. Every stage report must display:
   - overall AYHEM engineering progress percentage;
   - the current stage completion percentage;
   - the calculation method and evidence date;
   - completed, pending, blocked, and not-started items;
   - CI, deployment, security, and production-readiness status separately.
8. Recalculate progress only when acceptance evidence changes. Adding files, lines of code, or plans alone does not increase the score.
9. Continue routine development, branch management, pull requests, reviews, CI repair, and merging under the founder's explicit delegation, provided required checks pass and no material unresolved risk remains.
10. Stop and request founder approval for irreversible deletion, production data migration, permission/security-policy changes, credential creation or rotation, external disclosure of private data, financial commitments, and production actions outside the delegated scope.

## 2. Evidence levels

- VERIFIED: directly confirmed by a successful test, CI run, API response, or live health check.
- IMPLEMENTED: code exists, but one or more required verification steps remain.
- DEPLOYED: deployment system confirms the target deployment succeeded.
- LIVE VERIFIED: a real request to the deployed service succeeds and its behavior is checked.
- PENDING: awaiting a test, review, or external configuration.
- BLOCKED: a known dependency prevents completion.
- NOT STARTED: no implementation evidence exists.

A GitHub Pages deployment does not prove that a Worker, AI gateway, database migration, or external integration is live.

## 3. Progress model

The overall engineering-progress score is a weighted maturity score across eight workstreams. The weights total 100%.

| Workstream | Weight |
|---|---:|
| MEMORY | 25% |
| COGNITION | 15% |
| AUTONOMY | 15% |
| GUARD | 10% |
| LINK | 10% |
| INTERFACE | 10% |
| OPERATIONS | 10% |
| VALIDATION & RELEASE | 5% |
| **Total** | **100%** |

For each workstream, assign a completion value from 0 to 100 based on accepted deliverables and evidence, not subjective optimism.

`Overall progress = sum(workstream weight × workstream completion) / 100`

Use the following maturity anchors:
- 0%: no verified implementation.
- 25%: foundations or partial implementation exist.
- 50%: core behavior is implemented and has relevant automated tests.
- 75%: integrated, documented, failure-tested, and security boundaries are reviewed.
- 100%: acceptance criteria are complete, deployed where applicable, monitored, and validated in the intended environment.

Intermediate values are allowed only when the report lists the evidence and remaining gaps. A score is an engineering estimate, not a scientific measurement or a guarantee of product quality.

## 4. Separate progress indicators

Never conflate:
- engineering progress across the workstreams;
- current-stage completion;
- CI/test success;
- deployment status;
- production readiness;
- live AI/service availability.

If production readiness has not been assessed against explicit end-to-end acceptance criteria, report it as "not yet rated" rather than inventing a percentage.

## 5. Report template

Every operation report must include:

1. Operation number, date, repository, branch, base and resulting commit.
2. Objective and acceptance criteria.
3. Changes made and paths.
4. Tests run and exact outcomes.
5. CI and deployment evidence, with links or run identifiers.
6. Security/privacy impact and what was deliberately not touched.
7. Stage completion percentage.
8. Overall AYHEM engineering progress percentage, with the weighted breakdown and evidence date.
9. Remaining gaps, blockers, and next operation.

## 6. Initial baseline — 2026-11-21

The recalibrated provisional engineering baseline is **44.75%**. It is based on the currently inspected repository evidence and the following explicit workstream estimates:

| Workstream | Weight | Current estimate | Weighted contribution | Evidence summary |
|---|---:|---:|---:|---|
| MEMORY | 25% | 70% | 17.50 | Append-only store, IndexedDB adapter, retrieval, lineage/integrity, snapshot restore, real Chromium transaction, persistence, versionchange and concurrent-write tests; user-data migration remains pending |
| COGNITION | 15% | 25% | 3.75 | Deterministic lexical relation analysis and provenance validation; no calibrated semantic reasoning or learning loop |
| AUTONOMY | 15% | 25% | 3.75 | Merged deterministic policy, append-only audit ledger, memory schema, adversarial boundary tests, and autonomy charter; no continuously running task orchestration engine |
| GUARD | 10% | 25% | 2.50 | Some validation and security boundaries exist; complete deployed identity, policy enforcement and operational security verification remain pending |
| LINK | 10% | 35% | 3.50 | AI client, API contract and Worker-side security code exist; live end-to-end service is not verified |
| INTERFACE | 10% | 40% | 4.00 | Web interface and local memory-audit UI exist; full live AI product flow is not verified |
| OPERATIONS | 10% | 75% | 7.50 | Versioned reports, branch/PR workflow, Node and browser CI, and Pages deployment evidence |
| VALIDATION & RELEASE | 5% | 45% | 2.25 | Node and real Chromium CI pass; live Worker health checks, production data migration and end-to-end release validation remain pending |
| **Total** | **100%** |  | **44.75%** | **Recalibrated provisional engineering baseline** |

The earlier preliminary estimate of 41% was corrected after the cross-repository audit identified the already-merged AYHEM_WEB PR #4 autonomy foundation. This is a measurement correction, not a claim that the latest work alone added 3.75 percentage points. This remains a transparent baseline, not a claim that AYHEM is production-ready. It must be refined after a full cross-repository audit and updated when evidence changes. Do not reuse legacy hard-coded chart percentages as measured progress.

## 7. Change control

This standard may be strengthened by later founder instructions. Earlier operation reports remain immutable historical records; correct their status through a dated follow-up or a clearly identified status correction, never by concealing past failures.
