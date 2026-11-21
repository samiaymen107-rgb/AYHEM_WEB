# Federation contract baseline v1

This baseline records the exact Git blob revisions of the five service schemas observed while preparing AYHEM_WEB federation compatibility tests.

## Scope

- The manifest is a **pinned source inventory**, not a copy of private schemas.
- Automated tests currently check the manifest inventory and the generated AYHEM-LINK event / AYHEM-MEMORY payload shape using synthetic data.
- AYHEM-COGNITION, AYHEM-GUARD, and AYHEM-AUTONOMY are inventoried only. AYHEM_WEB does not yet consume those contracts.
- This is **not full JSON Schema validation**. The repository currently has no JSON Schema validator dependency and no authenticated CI mechanism for retrieving the private source repositories.
- Blob SHAs identify the exact schema files inspected. If a source schema changes, refresh this manifest deliberately and extend the relevant compatibility tests.

## Safety boundary

No private repository credentials, tokens, user memory, network calls, migrations, remote writes, or autonomous execution are introduced. Tests use synthetic fixtures only.

## Next integration gate

Before claiming full cross-repository validation, add a reviewed, reproducible way for CI to obtain the exact private schema revisions and run a Draft 2020-12 JSON Schema validator (including format assertions). Do not add broad repository credentials or long-lived personal access tokens merely to make this test pass.
