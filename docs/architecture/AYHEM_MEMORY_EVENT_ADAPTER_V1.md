# AYHEM Memory Event Adapter v1

Status: local adapter and synthetic contract tests; no remote endpoint or transport is enabled.

## Mapping

- AYHEM_WEB canonical records are mapped to AYHEM-MEMORY schema version `1.0.0`.
- The memory service's `source.kind` is an explicit caller input (`user_input`, `service`, `import`, or `system`); it is never guessed from record text.
- The source record ID, type, UTC creation time, source reference, content, status, confidence, tags, and `supersedes` lineage are preserved.
- A SHA-256 digest is calculated over a deterministic JSON serialization of the memory wire record before its `integrity` property is added. This defines the digest input for this adapter version.
- The wire record is wrapped in the AYHEM-LINK event envelope with event ID, producer, timestamp, subject, schema URI, and caller-supplied trace ID.

## Safety boundary

- This adapter performs conversion only. It does not send network requests, write to a remote service, mirror legacy MemoryLink writes, or migrate local records.
- Tests use synthetic fixtures only.
- A live adapter still requires a deployed authenticated endpoint, authorization, tenant isolation, replay/idempotency handling, and end-to-end tests.
