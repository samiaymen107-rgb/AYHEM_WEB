import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const scorecard = read("../docs/governance/FOUNDER_DIRECTIVES_AND_PROGRESS.md");
const index = read("../docs/operations/README.md");
const report = read("../docs/operations/2026-11-21-023-founder-directives-progress-reporting.md");
const charter = read("../README.md");

const rows = [...scorecard.matchAll(/^\|\s*(MEMORY|COGNITION|AUTONOMY|GUARD|LINK|INTERFACE|OPERATIONS|VALIDATION & RELEASE)\s*\|\s*(\d+)%\s*\|\s*(\d+)%\s*\|\s*([\d.]+)\s*\|/gm)];
assert.equal(rows.length, 8, "scorecard must contain exactly eight defined workstreams");

let totalWeight = 0;
let weightedProgress = 0;
for (const row of rows) {
  const weight = Number(row[2]);
  const completion = Number(row[3]);
  const contribution = Number(row[4]);
  assert.ok(weight >= 0 && completion >= 0 && completion <= 100, "weights and completion values must be valid");
  assert.ok(Math.abs(contribution - weight * completion / 100) < 0.011, `incorrect weighted contribution for ${row[1]}`);
  totalWeight += weight;
  weightedProgress += contribution;
}
assert.equal(totalWeight, 100, "workstream weights must total 100%");
const declared = Number(scorecard.match(/initial provisional engineering baseline is \*\*(\d+(?:\.\d+)?)%\*\*/i)?.[1]);
assert.ok(Number.isFinite(declared), "scorecard must declare an initial overall percentage");
assert.ok(Math.abs(weightedProgress - declared) < 0.011, "declared overall progress must equal the weighted score");

for (const required of [
  "Founder standing instructions",
  "Evidence levels",
  "Progress model",
  "Separate progress indicators",
  "Report template",
]) assert.ok(scorecard.includes(required), `missing required governance section: ${required}`);

assert.ok(index.includes("2026-11-21-023-founder-directives-progress-reporting.md"), "operations index must link the current governance report");
assert.ok(report.includes("Stage completion:"), "stage report must state stage completion");
assert.ok(report.includes("Overall AYHEM engineering progress:"), "stage report must state overall progress");
assert.ok(charter.includes("دمج التغييرات الروتينية المفوضة"), "founder charter must reflect the delegated routine merge scope");

console.log(`AYHEM governance validation passed: ${rows.length} workstreams, ${totalWeight}% total weight, ${declared}% overall progress.`);
