import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { createMemoryEventAdapter } from "../memory-event-adapter.js";

const manifest = JSON.parse(await readFile(
  new URL("../contracts/federation-v1.manifest.json", import.meta.url),
  "utf8",
));

test("federation manifest covers all eight existing repositories exactly once", () => {
  assert.equal(manifest.contract_set, "AYHEM_FEDERATION_V1");
  assert.equal(manifest.manifest_version, "1.0.0");
  assert.equal(manifest.federation_size, 8);
  assert.deepEqual(
    manifest.repositories.map(repository => repository.name).sort(),
    ["AYHEM", "AYHEM_WEB", "astro-blog-starter-template", "AYHEM-MEMORY", "AYHEM-COGNITION", "AYHEM-AUTONOMY", "AYHEM-GUARD", "AYHEM-LINK"].sort(),
  );
  assert.equal(new Set(manifest.repositories.map(repository => repository.name)).size, 8);
  for (const repository of manifest.repositories) {
    assert.ok(repository.role);
    assert.ok(["foundation", "application", "presentation", "service", "integration"].includes(repository.layer));
  }
});

test("pins the five service schema sources without claiming full JSON Schema validation", () => {
  assert.equal(manifest.full_json_schema_validation, false);
  assert.deepEqual(
    manifest.contracts.map(contract => contract.service).sort(),
    ["AYHEM-AUTONOMY", "AYHEM-COGNITION", "AYHEM-GUARD", "AYHEM-LINK", "AYHEM-MEMORY"].sort(),
  );
  for (const contract of manifest.contracts) {
    assert.match(contract.source_blob_sha, /^[a-f0-9]{40}$/);
    assert.ok(contract.schema_id.startsWith("https://"));
    assert.ok(contract.path.endsWith(".schema.json"));
  }
});

test("MEMORY is the first domain extension over the final LINK federation layer", () => {
  assert.equal(manifest.service_relationship.first_service, "AYHEM-MEMORY");
  assert.equal(manifest.service_relationship.last_service, "AYHEM-LINK");
  assert.equal(
    manifest.service_relationship.relationship,
    "memory-is-a-domain-service-extension-over-link-federation-contracts",
  );
  assert.match(manifest.service_relationship.integration_direction, /^AYHEM-MEMORY -> AYHEM-LINK/);
  assert.match(manifest.service_relationship.dependency_rule, /no circular dependency/);
});

test("adapter output obeys the pinned LINK envelope and MEMORY payload shape", async () => {
  const adapter = createMemoryEventAdapter({
    digest: webcrypto.subtle,
    idFactory: () => "event-contract-test-0001",
    now: () => "2026-11-21T13:00:00.000Z",
  });
  const event = await adapter.toEvent({
    id: "memory-contract-test-0001",
    type: "fact",
    content: "Synthetic contract fixture",
    status: "documented",
    createdAt: "2026-11-21T12:00:00.000Z",
    source: "synthetic-contract-test",
    confidence: 0.8,
    tags: ["synthetic"],
    supersedes: [],
  }, {
    sourceKind: "user_input",
    traceId: "trace-contract-test-0001",
  });

  assert.deepEqual(
    Object.keys(event).sort(),
    ["specversion", "id", "type", "source", "time", "subject", "datacontenttype", "dataschema", "traceid", "data"].sort(),
  );
  assert.deepEqual(
    Object.keys(event.data).sort(),
    ["schema_version", "record_id", "record_type", "created_at", "source", "payload", "integrity"].sort(),
  );
  assert.deepEqual(Object.keys(event.data.source).sort(), ["kind", "reference"]);
  assert.deepEqual(Object.keys(event.data.integrity).sort(), ["algorithm", "digest"]);
  assert.equal(event.specversion, "1.0");
  assert.equal(event.data.schema_version, "1.0.0");
  assert.equal(event.data.integrity.algorithm, "sha-256");
  assert.match(event.data.integrity.digest, /^[a-f0-9]{64}$/);
});
