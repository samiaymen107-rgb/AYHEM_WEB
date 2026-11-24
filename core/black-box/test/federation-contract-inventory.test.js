import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(
  new URL("../contracts/federation-v1.manifest.json", import.meta.url),
  "utf8",
));

const expected = new Map([
  ["AYHEM-LINK", ["schemas/event-envelope.v1.schema.json", "f78463c78265fd9e243c1e19c1e516e6aec32c80"]],
  ["AYHEM-MEMORY", ["schemas/memory-record.v1.schema.json", "b42b86b51b1ee86a0ce7dc0f222ae28eb11ca790"]],
  ["AYHEM-COGNITION", ["schemas/reasoning-result.v1.schema.json", "9c4e697c9930652232d3b6230edf98ee358e203b"]],
  ["AYHEM-AUTONOMY", ["schemas/task-request.v1.schema.json", "4776fde53a5513da0bb5be208dc658011af85301"]],
  ["AYHEM-GUARD", ["schemas/authorization-request.v1.schema.json", "ec6d67f76c85b3346892c3ec95ff4fa5e62309b4"]],
]);

test("private service schema inventory contains exactly the five pinned contract sources", () => {
  assert.equal(manifest.full_json_schema_validation, false);
  assert.equal(manifest.contracts.length, expected.size);
  for (const contract of manifest.contracts) {
    const pin = expected.get(contract.service);
    assert.ok(pin, `unexpected or duplicate service contract: ${contract.service}`);
    assert.equal(contract.path, pin[0]);
    assert.equal(contract.source_blob_sha, pin[1]);
    assert.match(contract.source_blob_sha, /^[a-f0-9]{40}$/);
    expected.delete(contract.service);
  }
  assert.equal(expected.size, 0, "one or more service contract pins are missing");
});

test("service contract inventory points only to known federation services", () => {
  const serviceNames = new Set(manifest.repositories.map(item => item.name));
  for (const contract of manifest.contracts) {
    assert.ok(serviceNames.has(contract.service));
    assert.ok(contract.schema_id.startsWith("https://"));
    assert.ok(contract.path.startsWith("schemas/"));
  }
});

test("schema inventory does not claim private schema contents were copied or fully validated", () => {
  assert.equal(manifest.full_json_schema_validation, false);
  assert.ok(manifest.validation_scope.includes("pinned-service-schema-inventory"));
  for (const contract of manifest.contracts) {
    assert.ok(!("schema" in contract));
    assert.ok(!("schema_content" in contract));
  }
});
