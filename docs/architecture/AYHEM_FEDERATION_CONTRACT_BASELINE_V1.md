# AYHEM eight-repository federation baseline v1

AYHEM is one coordinated federation of **eight existing repositories**. This is a topology and ownership map, not a claim that every service is already connected at runtime.

## The eight repositories

| Repository | Responsibility | Layer |
|---|---|---|
| AYHEM | Central vision, architecture, domain contracts | Foundation |
| AYHEM_WEB | User application and portal | Application |
| astro-blog-starter-template | Public website and presentation | Presentation |
| AYHEM-MEMORY | Memory records and lifecycle | Service |
| AYHEM-COGNITION | Reasoning and evidence analysis | Service |
| AYHEM-AUTONOMY | Planning and orchestration | Service |
| AYHEM-GUARD | Security and authorization | Service |
| AYHEM-LINK | Shared federation envelope and inter-service coordination | Integration |

## First-to-last relationship

**AYHEM-MEMORY (first service) is a domain-service extension over AYHEM-LINK (last service).**

- LINK owns shared event envelopes and coordination contracts.
- MEMORY owns memory records, lifecycle and provenance, and emits/consumes events through LINK contracts.
- Dependency is one-way at the contract boundary: MEMORY uses LINK's published contract; LINK does not import MEMORY implementation.
- The two repositories remain independent; this is not a merge and must not create a circular dependency.

## Federation rules

- AYHEM is the architecture and contract authority; it does not replace service ownership.
- AYHEM_WEB and the public site consume approved interfaces; they must not bypass service boundaries or access another service's database directly.
- Services communicate through versioned APIs/events with trace IDs, schema versions, producer identity and idempotency semantics.
- Preserve existing repositories, histories, files and data. Do not recreate or consolidate repositories.
- Keep credentials and private service schemas out of public application code. No broad personal access tokens for CI.

## Validation status

- The manifest inventories all eight repositories and pins the inspected schema blob revisions for the five service repositories.
- Synthetic tests cover the eight-repository inventory and the current MEMORY-to-LINK event adapter shape.
- COGNITION, GUARD and AUTONOMY are currently inventory-only in this AYHEM_WEB test; this does not establish runtime connectivity.
- Full Draft 2020-12 JSON Schema validation is not yet implemented. No claim of end-to-end eight-repository integration is made.

## Safety boundary

No real user memory is migrated, no secrets are copied, and no live remote writes, autonomous actions or production deployments are introduced by this baseline.
