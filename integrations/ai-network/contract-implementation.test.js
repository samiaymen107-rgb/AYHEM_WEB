import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const schema = JSON.parse(await readFile(
  new URL("../../contracts/ai-gateway/v1/contract.schema.json", import.meta.url), "utf8",
));
const worker = await readFile(new URL("../../AYHEM_JS_Worker.js", import.meta.url), "utf8");
const client = await readFile(new URL("./ayhem-ai-client.js", import.meta.url), "utf8");
const ui = await readFile(new URL("./ayhem-ai-ui.js", import.meta.url), "utf8");

test("web snapshot keeps the canonical request and response envelope", () => {
  assert.equal(schema.$defs.AIRequest.properties.input.maxLength, 8000);
  assert.equal(schema.$defs.AIResponse.properties.unit.const, "U01-Σ");
  assert.equal(schema.$defs.AIResponse.properties.requestId.format, "uuid");
});

test("Worker implementation matches request and response contract", () => {
  assert.match(worker, /const MAX_INPUT_LENGTH = 8000/);
  assert.match(worker, /const MAX_BODY_BYTES = 16000/);
  assert.match(worker, /unit: "U01-Σ"/);
  assert.match(worker, /requestId: crypto\.randomUUID\(\)/);
  for (const field of ["aiConfigured", "rateLimitConfigured", "originConfigured", "ready"]) {
    assert.match(worker, new RegExp(field));
  }
});

test("client and UI refuse to operate before gateway readiness", () => {
  assert.match(client, /maxInputLength = 8000/);
  assert.match(client, /result\.unit !== "U01-Σ"/);
  assert.match(client, /validRequestId/);
  assert.match(client, /originConfigured/);
  assert.match(ui, /health\.ready !== true/);
});
