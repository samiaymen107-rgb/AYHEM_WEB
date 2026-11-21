# AYHEM Integration Roadmap — V1

This roadmap connects the new black-box foundation to the existing AYHEM system without replacing legacy assets.

## Stage 1 — Establish trusted boundaries

- Keep the autonomy policy deterministic and independent of model output.
- Validate every memory record at the write boundary.
- Require source, confidence, status, and timestamps for stored knowledge.
- Record accepted, rejected, and approval-required operations in the audit stream.
- Add tests for malformed inputs, unknown actions, and tampered event sequences.

Exit condition: policy and validation tests pass in CI; no legacy memory data is rewritten.

## Stage 2 — Durable memory adapter

- Define a storage interface before choosing or migrating a provider.
- Implement separate stores for immutable source records, normalized memory records, and searchable indexes.
- Use versioned migrations and idempotent writes.
- Preserve original records and attach corrections as new versions.
- Add backup, restore, retention, export, and deletion workflows with explicit approval gates.

Exit condition: restore test proves that a backup can reconstruct a consistent memory snapshot.

## Stage 3 — Retrieval and reasoning

- Implement retrieval with provenance attached to every returned item.
- Keep facts, context, documented claims, hypotheses, and inferences distinguishable.
- Require citations or source identifiers for factual answers derived from stored memory.
- Evaluate retrieval quality, unsupported claims, and contradiction handling against a fixed test set.

Exit condition: evaluation results are reproducible and regressions block release.

## Stage 4 — Controlled autonomy

- Route every proposed action through the deterministic policy.
- Run code changes in isolated branches and test environments.
- Require founder approval for production deployment, secret access or rotation, financial actions, permission changes, external disclosure, and permanent deletion.
- Add kill switch, quotas, health monitoring, alerting, and rollback.

Exit condition: a documented simulation demonstrates safe behavior during provider failure, storage failure, prompt injection, and attempted privilege escalation.

## Stage 5 — Operational continuity

- Run scheduled health checks and backups through an explicitly configured scheduler.
- Monitor latency, errors, cost, and storage growth.
- Test disaster recovery and key rotation procedures.
- Maintain a human-readable activity log and founder control panel.

Exit condition: continuity is demonstrated by monitored scheduled runs, not inferred from repository presence.

## Non-goals

- No silent deletion or rewriting of historical memory.
- No self-granting permissions.
- No production deployment or secret rotation without founder approval.
- No claim of continuous operation until an external runtime and scheduler are configured and verified.
