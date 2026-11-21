/**
 * Deterministic, provenance-preserving retrieval over canonical AYHEM records.
 * This is lexical retrieval, not semantic reasoning or fact verification.
 */
function tokens(value) {
  return [...new Set((value.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter(token => token.length > 1))];
}

function canonicalUtc(value) {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function createMemoryRetriever({ store } = {}) {
  if (!store || typeof store.list !== "function") {
    throw new TypeError("A memory store with list() is required.");
  }

  return Object.freeze({
    async retrieve(query, options = {}) {
      if (typeof query !== "string" || !query.trim()) {
        throw new TypeError("memory_retrieval_query_required");
      }
      if (!options || typeof options !== "object" || Array.isArray(options)) {
        throw new TypeError("memory_retrieval_options_invalid");
      }

      const {
        type,
        status,
        source,
        minConfidence = 0,
        since,
        until,
        limit = 20,
      } = options;

      if (!Number.isFinite(minConfidence) || minConfidence < 0 || minConfidence > 1) {
        throw new RangeError("memory_retrieval_min_confidence_invalid");
      }
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new RangeError("memory_retrieval_limit_invalid");
      }
      if (since !== undefined && !canonicalUtc(since)) {
        throw new TypeError("memory_retrieval_since_invalid");
      }
      if (until !== undefined && !canonicalUtc(until)) {
        throw new TypeError("memory_retrieval_until_invalid");
      }
      if (since && until && since > until) {
        throw new RangeError("memory_retrieval_date_range_invalid");
      }

      const terms = tokens(query);
      if (!terms.length) throw new TypeError("memory_retrieval_query_has_no_terms");

      const records = await store.list({ type, status });
      const matches = [];

      for (const record of records) {
        if (source && record.source !== source) continue;
        if (record.confidence < minConfidence) continue;
        if (since && record.createdAt < since) continue;
        if (until && record.createdAt > until) continue;

        const content = record.content.toLocaleLowerCase();
        const tagText = (record.tags ?? []).join(" ").toLocaleLowerCase();
        const matchedTerms = terms.filter(term => content.includes(term) || tagText.includes(term));
        if (!matchedTerms.length) continue;

        const contentMatches = matchedTerms.filter(term => content.includes(term));
        const tagMatches = matchedTerms.filter(term => (record.tags ?? []).some(tag =>
          tag.toLocaleLowerCase().includes(term)));
        const phraseMatch = content.includes(query.trim().toLocaleLowerCase());
        const score = Number((
          (contentMatches.length * 2) +
          (tagMatches.length * 1.5) +
          (phraseMatch ? 3 : 0)
        ).toFixed(3));

        matches.push({
          record,
          score,
          matchedTerms,
          provenance: Object.freeze({
            recordId: record.id,
            source: record.source,
            status: record.status,
            type: record.type,
            createdAt: record.createdAt,
            confidence: record.confidence,
            supersedes: [...(record.supersedes ?? [])],
          }),
        });
      }

      matches.sort((a, b) =>
        b.score - a.score ||
        b.record.confidence - a.record.confidence ||
        b.record.createdAt.localeCompare(a.record.createdAt) ||
        a.record.id.localeCompare(b.record.id)
      );

      return Object.freeze(matches.slice(0, limit).map(match => Object.freeze({
        ...match,
        matchedTerms: Object.freeze(match.matchedTerms),
      })));
    },
  });
}
