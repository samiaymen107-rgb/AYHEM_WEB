import { performance } from "node:perf_hooks";
import { createMemoryCognition } from "../memory-cognition.js";

function records(count, contentFor) {
  return Array.from({ length: count }, (_, index) => ({
    id: `benchmark-${String(index).padStart(4, "0")}`,
    type: "fact",
    content: contentFor(index),
    status: "documented",
    createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    source: "cognition-benchmark",
    confidence: 1,
    tags: [],
  }));
}

async function measure(name, items, expectedCandidates) {
  const cognition = createMemoryCognition({
    store: { async list() { return items; } },
    maxRecords: 1000,
  });
  const start = performance.now();
  const result = await cognition.analyze();
  const elapsedMs = Number((performance.now() - start).toFixed(2));
  if (result.candidatePairCount !== expectedCandidates) {
    throw new Error(`${name}: unexpected_candidate_count_${result.candidatePairCount}`);
  }
  if (result.counts.unknown + result.counts.explicit_contradiction +
      result.counts.possible_tension + result.counts.semantic_similarity !== result.pairCount) {
    throw new Error(`${name}: pair_count_accounting_mismatch`);
  }
  return {
    name,
    records: items.length,
    pairCount: result.pairCount,
    candidatePairCount: result.candidatePairCount,
    classifiedUnknown: result.counts.unknown,
    insights: result.insights.length,
    elapsedMs,
  };
}

const sparse = records(1000, index => `claim${index}`);
const dense = records(500, index => `shared common topic${index}`);
const denseCandidates = dense.length * (dense.length - 1) / 2;
const results = [
  await measure("sparse-1000", sparse, 0),
  await measure("dense-500", dense, denseCandidates),
];
process.stdout.write(JSON.stringify({
  benchmark: "ayhem-cognition-scan-v1",
  note: "Elapsed time is observational, not a CI threshold; compare only on equivalent runners.",
  results,
}, null, 2) + "\n");
