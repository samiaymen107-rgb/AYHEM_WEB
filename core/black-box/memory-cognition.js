/**
 * AYHEM Cognition Engine v1.
 *
 * Deterministic, explainable lexical signals only. This module does not claim
 * natural-language understanding, verify truth, call an LLM, or modify source
 * records. Every emitted insight keeps both source record IDs and provenance.
 */
const VERSION = "ayhem-cognition-v1";
const DERIVED_SOURCE = "ayhem-cognition:v1";
const NEGATIONS = new Set([
  "not", "no", "never", "without", "isnt", "wasnt", "cannot",
  "لا", "ليس", "ليست", "ليسا", "ليسوا", "لم", "لن", "ما", "غير", "بدون", "عدم",
]);

function tokens(value) {
  return (value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
}

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function sameSet(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  const union = new Set([...a, ...b]);
  if (!union.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  return intersection / union.size;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function provenance(record) {
  return Object.freeze({
    recordId: record.id,
    source: record.source,
    status: record.status,
    type: record.type,
    createdAt: record.createdAt,
    confidence: record.confidence,
  });
}

function prepare(record) {
  const all = tokens(record.content);
  const negationCount = all.filter(token => NEGATIONS.has(token)).length;
  const substantive = sortedUnique(all.filter(token => !NEGATIONS.has(token)));
  const numbers = sortedUnique(all.filter(token => /^\p{N}+([.,]\p{N}+)?$/u.test(token)));
  const words = substantive.filter(token => !/^\p{N}+([.,]\p{N}+)?$/u.test(token));
  return { record, substantive, numbers, words, negated: negationCount % 2 === 1 };
}

/**
 * Classifies exactly two source records. "Explicit contradiction" is reserved
 * for identical lexical content except for a detected negation marker.
 * Different numeric values are only a possible tension, never a fact conflict.
 */
function classifyPreparedPair(left, right, similarityThreshold) {
  const leftRecord = left.record;
  const rightRecord = right.record;
  const commonWords = left.words.filter(token => right.words.includes(token));
  const overlap = jaccard(left.substantive, right.substantive);
  let relation = "unknown";
  let reason = "no_deterministic_relationship_signal";

  if (left.substantive.length > 0 &&
      sameSet(left.substantive, right.substantive) &&
      left.negated !== right.negated && left.numbers.length === right.numbers.length &&
      sameSet(left.numbers, right.numbers)) {
    relation = "explicit_contradiction";
    reason = "same_lexical_claim_with_opposite_explicit_negation";
  } else if (left.words.length > 0 && sameSet(left.words, right.words) &&
      left.numbers.length && right.numbers.length && !sameSet(left.numbers, right.numbers)) {
    relation = "possible_tension";
    reason = "same_lexical_frame_with_different_numeric_values_requires_time_unit_and_context_review";
  } else if (overlap >= similarityThreshold) {
    relation = "semantic_similarity";
    reason = "high_lexical_overlap_only_not_semantic_equivalence";
  }

  const ordered = [leftRecord, rightRecord].sort((a, b) => a.id.localeCompare(b.id));
  const recordIds = ordered.map(record => record.id);
  const evidence = Object.freeze({
    sharedWords: Object.freeze(commonWords),
    lexicalOverlap: Number(overlap.toFixed(3)),
    leftNegated: left.negated,
    rightNegated: right.negated,
    leftNumbers: Object.freeze(left.numbers),
    rightNumbers: Object.freeze(right.numbers),
  });
  const fingerprintInput = [VERSION, relation, ...recordIds, reason].join("|");

  return Object.freeze({
    relation,
    reason,
    method: VERSION,
    recordIds: Object.freeze(recordIds),
    provenance: Object.freeze(ordered.map(provenance)),
    evidence,
    confidence: relation === "explicit_contradiction" ? 0.9
      : relation === "possible_tension" ? 0.55
      : relation === "semantic_similarity" ? 0.65 : 0.1,
    fingerprint: fnv1a(fingerprintInput),
  });
}

export function classifyMemoryPair(leftRecord, rightRecord, { similarityThreshold = 0.72 } = {}) {
  if (!leftRecord || !rightRecord || leftRecord.id === rightRecord.id ||
      typeof leftRecord.content !== "string" || typeof rightRecord.content !== "string") {
    throw new TypeError("cognition_pair_requires_two_distinct_memory_records");
  }
  if (!Number.isFinite(similarityThreshold) || similarityThreshold < 0.5 || similarityThreshold > 1) {
    throw new RangeError("cognition_similarity_threshold_invalid");
  }
  return classifyPreparedPair(prepare(leftRecord), prepare(rightRecord), similarityThreshold);
}

export function createMemoryCognition({ store, maxRecords = 200, similarityThreshold = 0.72 } = {}) {
  if (!store || typeof store.list !== "function") {
    throw new TypeError("cognition_store_with_list_required");
  }
  if (!Number.isInteger(maxRecords) || maxRecords < 2 || maxRecords > 1000) {
    throw new RangeError("cognition_max_records_invalid");
  }
  if (!Number.isFinite(similarityThreshold) || similarityThreshold < 0.5 || similarityThreshold > 1) {
    throw new RangeError("cognition_similarity_threshold_invalid");
  }

  return Object.freeze({
    async analyze({ includeUnknown = false } = {}) {
      const stored = await store.list();
      const records = stored
        .filter(record => record.source !== DERIVED_SOURCE)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
      if (records.length > maxRecords) {
        throw new RangeError("cognition_record_limit_exceeded");
      }

      const insights = [];
      const counts = {
        explicit_contradiction: 0,
        possible_tension: 0,
        semantic_similarity: 0,
        unknown: 0,
      };
      const pairCount = records.length * (records.length - 1) / 2;
      const preparedRecords = records.map(prepare);
      let candidatePairCount = 0;

      if (includeUnknown) {
        candidatePairCount = pairCount;
        // The exhaustive mode intentionally materializes every pair.
        for (let i = 0; i < records.length; i++) {
          for (let j = i + 1; j < records.length; j++) {
            const insight = classifyPreparedPair(preparedRecords[i], preparedRecords[j], similarityThreshold);
            counts[insight.relation]++;
            insights.push(insight);
          }
        }
      } else {
        // Every non-unknown relation requires at least one shared substantive
        // token. Inverted postings avoid comparing unrelated sparse records.
        const postings = new Map();
        for (let index = 0; index < records.length; index++) {
          const uniqueTokens = new Set(preparedRecords[index].substantive);
          for (const token of uniqueTokens) {
            if (!postings.has(token)) postings.set(token, []);
            postings.get(token).push(index);
          }
        }

        const candidateKeys = new Set();
        for (const indexes of postings.values()) {
          for (let left = 0; left < indexes.length; left++) {
            for (let right = left + 1; right < indexes.length; right++) {
              const i = indexes[left];
              const j = indexes[right];
              candidateKeys.add(i * records.length + j);
            }
          }
        }
        // Numeric pair keys avoid allocating a second array object for every
        // candidate pair. Sorting preserves the original i/j traversal order.
        const orderedKeys = [...candidateKeys].sort((left, right) => left - right);
        candidatePairCount = orderedKeys.length;

        for (const key of orderedKeys) {
          const i = Math.floor(key / records.length);
          const j = key % records.length;
          const insight = classifyPreparedPair(preparedRecords[i], preparedRecords[j], similarityThreshold);
          counts[insight.relation]++;
          if (insight.relation !== "unknown") insights.push(insight);
        }
        counts.unknown = pairCount - counts.explicit_contradiction -
          counts.possible_tension - counts.semantic_similarity;
      }

      return Object.freeze({
        method: VERSION,
        sourceRecordCount: records.length,
        pairCount,
        candidatePairCount,
        counts: Object.freeze(counts),
        insights: Object.freeze(insights),
        limitations: Object.freeze([
          "Deterministic lexical heuristics only; no semantic language model is used.",
          "A flagged relationship is a review signal, not a verified truth or correction.",
          "Time, units, negation scope, dialect, sarcasm and domain context may require human review.",
          "Source records are never changed by analysis.",
        ]),
      });
    },

    async persistInsights(insights) {
      if (typeof store.append !== "function" || typeof store.get !== "function") {
        throw new TypeError("cognition_store_append_and_get_required");
      }
      if (!Array.isArray(insights)) throw new TypeError("cognition_insights_must_be_array");
      // Source records are immutable. Cache provenance reads for this batch so
      // insights sharing a source record do not issue duplicate storage reads.
      const sourceRecords = new Map();
      const persisted = [];
      const skipped = [];
      const candidates = [];
      const batchTags = new Set();
      for (const insight of insights) {
        const allowedRelations = ["explicit_contradiction", "possible_tension", "semantic_similarity"];
        const validIds = Array.isArray(insight?.recordIds) && insight.recordIds.length === 2 &&
          insight.recordIds.every(id => typeof id === "string" && id.length > 0) &&
          insight.recordIds[0] !== insight.recordIds[1] &&
          insight.recordIds[0].localeCompare(insight.recordIds[1]) < 0;
        const validProvenance = Array.isArray(insight?.provenance) && insight.provenance.length === 2 &&
          insight.provenance.every((item, index) => item && item.recordId === insight.recordIds?.[index] &&
            typeof item.source === "string" && typeof item.status === "string" &&
            typeof item.type === "string" && typeof item.createdAt === "string" &&
            Number.isFinite(item.confidence) && item.confidence >= 0 && item.confidence <= 1);
        const validEvidence = insight?.evidence && typeof insight.evidence === "object" &&
          Array.isArray(insight.evidence.sharedWords) &&
          insight.evidence.sharedWords.every(word => typeof word === "string") &&
          Number.isFinite(insight.evidence.lexicalOverlap) &&
          insight.evidence.lexicalOverlap >= 0 && insight.evidence.lexicalOverlap <= 1 &&
          typeof insight.evidence.leftNegated === "boolean" &&
          typeof insight.evidence.rightNegated === "boolean" &&
          Array.isArray(insight.evidence.leftNumbers) && Array.isArray(insight.evidence.rightNumbers);
        if (!insight || insight.method !== VERSION || !allowedRelations.includes(insight.relation) ||
            !validIds || !validProvenance || !validEvidence ||
            typeof insight.reason !== "string" || !insight.reason ||
            !Number.isFinite(insight.confidence) || insight.confidence < 0 || insight.confidence > 1 ||
            typeof insight.fingerprint !== "string" ||
            !/^[0-9a-f]{8}$/.test(insight.fingerprint) ||
            fnv1a([VERSION, insight.relation, ...insight.recordIds, insight.reason].join("|")) !== insight.fingerprint) {
          throw new TypeError("cognition_insight_invalid");
        }

        for (let index = 0; index < insight.recordIds.length; index++) {
          const sourceId = insight.recordIds[index];
          if (!sourceRecords.has(sourceId)) {
            sourceRecords.set(sourceId, await store.get(sourceId));
          }
          const sourceRecord = sourceRecords.get(sourceId);
          const claimed = insight.provenance[index];
          if (!sourceRecord || sourceRecord.source === DERIVED_SOURCE ||
              claimed.recordId !== sourceRecord.id ||
              claimed.source !== sourceRecord.source ||
              claimed.status !== sourceRecord.status ||
              claimed.type !== sourceRecord.type ||
              claimed.createdAt !== sourceRecord.createdAt ||
              claimed.confidence !== sourceRecord.confidence) {
            throw new TypeError("cognition_insight_provenance_mismatch");
          }
        }

        const tag = `cognition:v1:${insight.fingerprint}`;
        if (batchTags.has(tag)) {
          skipped.push(insight.fingerprint);
          continue;
        }
        batchTags.add(tag);
        candidates.push(insight);
      }

      // Resolve existing fingerprints through the IndexedDB multi-entry tag
      // index when available. Older adapters retain the list-based fallback.
      // All insights and provenance are validated before the first write.
      const known = typeof store.findExistingTags === "function"
        ? new Set(await store.findExistingTags([...batchTags]))
        : new Set((await store.list()).flatMap(record => record.tags ?? []));
      const pending = candidates.filter(insight => {
        const tag = `cognition:v1:${insight.fingerprint}`;
        if (known.has(tag)) {
          skipped.push(insight.fingerprint);
          return false;
        }
        return true;
      });

      // Persist only candidates not already present in the indexed tag lookup.
      for (const insight of pending) {
        const tag = `cognition:v1:${insight.fingerprint}`;
        const content = JSON.stringify({
          relation: insight.relation,
          reason: insight.reason,
          method: insight.method,
          recordIds: insight.recordIds,
          provenance: insight.provenance,
          evidence: insight.evidence,
          fingerprint: insight.fingerprint,
        });
        const input = {
          type: "observation",
          content,
          status: "inference",
          source: DERIVED_SOURCE,
          confidence: Math.min(...insight.provenance.map(item => item.confidence)) * insight.confidence,
          tags: ["derived", "cognition", tag],
        };
        let record;
        if (typeof store.appendIfTagAbsent === "function") {
          record = await store.appendIfTagAbsent(input, tag);
          if (!record) {
            skipped.push(insight.fingerprint);
            continue;
          }
        } else {
          // Compatibility for test and non-IndexedDB stores: sequential
          // idempotency only. Production IndexedDB stores expose the atomic API.
          record = await store.append(input);
        }
        persisted.push(record);
      }
      return Object.freeze({
        persisted: Object.freeze(persisted),
        skippedFingerprints: Object.freeze(skipped),
      });
    },
  });
}
