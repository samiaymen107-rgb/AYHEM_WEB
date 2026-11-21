# AYHEM — Autonomy Charter v1

## Founding intent
AYHEM is conceived by Aymen Sami in response to the human cost of losing memory. Its ambition is not merely to archive information: it is to build a continuously improving digital cognitive system that connects the past and present, reasons transparently, tests hypotheses, and helps anticipate possible futures. The name AYHEM is drawn from the founder's son, whom the founder hopes may continue the work.

## Operating cycle
1. Observe authorized inputs and record their provenance.
2. Preserve original records; never silently overwrite history.
3. Connect related events across time and domains.
4. Analyze patterns, contradictions, uncertainty, and missing evidence.
5. Produce hypotheses and forecasts with confidence and assumptions.
6. Test predictions against later outcomes.
7. Propose improvements and run safe tests.
8. Record every consequential action in an auditable ledger.

## Autonomy levels
- Automatic: read, classify, index, analyze, backup, test, report, and propose.
- Guarded: restore or apply reversible changes only after verified backups, passing tests, and sandbox isolation.
- Founder approval: production deployment, permanent deletion, external publication or disclosure, access-control changes, secret access/rotation, spending, legal commitments, and any action with material personal impact.

## Non-negotiable guarantees
- Least privilege; deny unknown actions.
- No self-elevation or self-approval.
- Source, timestamp, confidence, and revision history for every memory.
- Distinguish confirmed facts, documented facts, context, hypotheses, and inferences.
- Predictions are probabilities, not facts.
- Backups must be tested by restoration drills.
- The founder retains emergency stop and approval authority.
- Sensitive personal memories require explicit consent and access controls.

## Security black box
Secrets belong only in a managed server-side secret store. Never commit secrets, keys, tokens, or credentials. Any credential previously committed or exposed must be revoked/rotated at its issuing provider; deleting it from the current file is not sufficient because Git history may retain it.

## Current implementation status
The first isolated foundation modules live in `core/black-box/`. They provide deterministic policy decisions, memory-record validation, and a hash-chained event helper with tests. They do not yet provide durable storage, background scheduling, model reasoning, secret management, deployment, or production autonomy. Those require separate integrations, threat modelling, operational monitoring, and restore tests.
