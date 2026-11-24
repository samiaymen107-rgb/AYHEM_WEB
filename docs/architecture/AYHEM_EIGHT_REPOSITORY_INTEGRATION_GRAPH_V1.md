# AYHEM eight-repository integration graph v1

## Purpose

This document defines the first cross-repository dependency map for the eight existing AYHEM repositories. Edges are directed from a consumer to the provider of the contract/interface it consumes.

The graph is an architecture and contract map. It is **not** evidence that remote APIs, message brokers, authentication, or production connectivity have been deployed.

## Repository responsibilities

| Repository | Responsibility |
|---|---|
| AYHEM | Canonical architecture, product vision and domain contracts |
| AYHEM_WEB | User application and portal |
| astro-blog-starter-template | Public site and presentation |
| AYHEM-MEMORY | Memory records, provenance and lifecycle |
| AYHEM-COGNITION | Reasoning and evidence analysis |
| AYHEM-AUTONOMY | Planning and controlled orchestration |
| AYHEM-GUARD | Security and authorization |
| AYHEM-LINK | Shared versioned federation envelopes and integration contracts |

## Contract dependency edges

| Consumer | Contract provider | Interface | Current evidence |
|---|---|---|---|
| AYHEM_WEB | AYHEM | Architecture and domain contracts | Documented boundary |
| astro-blog-starter-template | AYHEM | Product and presentation contracts | Documented boundary |
| AYHEM-LINK | AYHEM | Federation architecture and versioning | Documented boundary |
| AYHEM_WEB | AYHEM-LINK | Versioned event-envelope adapter | Local adapter only; no network |
| AYHEM-MEMORY | AYHEM-LINK | Memory event envelope v1 | Contract defined; not live |
| AYHEM-COGNITION | AYHEM-LINK | Reasoning event contracts | Contract boundary planned |
| AYHEM-AUTONOMY | AYHEM-LINK | Task and orchestration contracts | Contract boundary planned |
| AYHEM-GUARD | AYHEM-LINK | Authorization and security event contracts | Contract boundary planned |

## Required invariants

1. All eight repositories appear exactly once in the graph.
2. Every edge has known endpoints, a named interface and an explicit evidence status.
3. The graph is connected as an architecture map; this does not imply direct runtime calls between every pair.
4. AYHEM-MEMORY consumes AYHEM-LINK contracts. AYHEM-LINK must not import MEMORY implementation code.
5. AYHEM_WEB's current adapter is local transformation only. It does not send network requests or migrate user memory.
6. Services must not read another service's database directly. Cross-service communication must use versioned, authenticated APIs or events.
7. No production endpoint, credentials, migration, background worker or autonomous external action is introduced by this change.

## Validation boundary

The automated tests validate graph integrity and declared dependency rules. They do not validate live service health, full JSON Schema conformance, authentication, authorization enforcement, message delivery, retries, or end-to-end runtime connectivity.
