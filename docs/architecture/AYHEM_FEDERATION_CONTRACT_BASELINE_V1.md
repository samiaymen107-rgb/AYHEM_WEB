# Federation contract baseline v1

This baseline records the exact Git blob revisions of the five service schemas observed while preparing AYHEM_WEB federation compatibility tests.

## Service relationship: first to last

The first service in the five-repository sequence, **AYHEM-MEMORY**, is a domain-service extension built over the federation contracts owned by the final service, **AYHEM-LINK**.

- **AYHEM-LINK** owns the shared federation envelope and coordination contracts.
- **AYHEM-MEMORY** owns memory records and memory lifecycle behavior, and expresses memory events through the LINK envelope.
- The dependency is one-way at the contract boundary: MEMORY uses LINK's published contract; LINK does not import MEMORY's implementation.
- This is coordinated federation, not a circular dependency and not a merging of the two repositories.
- AYHEM_WEB's memory event adapter is the current bridge between the memory record model and the LINK event envelope.

## Scope

- The manifest is a **pinned source inventory**, not a copy of private schemas.
- Automated tests currently check the manifest inventory, this first-to-last relationship, and the generated AYHEM-LINK event / AYHEM-MEMORY payload shape using synthetic data.
- AYHEM-COGNITION, AYHEM-GUARD, and AYHEM-AUTONOMY are inventoried only. AYHEM_WEB does not yet consume those contracts.
- This is **not full JSON Schema validation**. The repository currently has no JSON Schema validator dependency and no authenticated CI mechanism for retrieving the private source repositories.
- Blob SHAs identify the exact schema files inspected. If a source schema changes, refresh this manifest deliberately and extend the relevant compatibility tests.

## Safety boundary

No private repository credentials, tokens, user memory, network calls, migrations, remote writes, or autonomous execution are introduced. Tests use synthetic fixtures only.

## Next integration gate

Before claiming full cross-repository validation, add a reviewed, reproducible way for CI to obtain the exact private schema revisions and run a Draft 2020-12 JSON Schema validator (including format assertions). Do not add broad repository credentials or long-lived personal access tokens merely to make this test pass.
