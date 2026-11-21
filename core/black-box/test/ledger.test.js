import test from "node:test";
import assert from "node:assert/strict";
import { appendLedgerEvent, verifyLedger } from "../ledger.js";

test("creates and verifies an append-only hash chain", async () => {
  const first = await appendLedgerEvent(null, { timestamp: "2026-11-21T00:00:00.000Z", action: "memory.add", outcome: "accepted" });
  const second = await appendLedgerEvent(first, { timestamp: "2026-11-21T00:01:00.000Z", action: "memory.review", outcome: "complete" });
  assert.deepEqual(await verifyLedger([first, second]), { valid: true, count: 2 });
  assert.equal((await verifyLedger([first, { ...second, outcome: "tampered" }])).valid, false);
});
