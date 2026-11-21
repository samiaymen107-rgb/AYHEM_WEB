/**
 * Deterministic lineage inspection for canonical AYHEM memory records.
 * This reports structural relationships only; it does not infer semantic truth
 * or decide whether two statements contradict one another.
 */
export function createMemoryIntegrityInspector({ store } = {}) {
  if (!store || typeof store.list !== "function") {
    throw new TypeError("memory_integrity_store_with_list_required");
  }

  return Object.freeze({
    async inspectLineage() {
      const records = await store.list();
      const byId = new Map(records.map(record => [record.id, record]));
      const supersededBy = new Map();
      const issues = [];

      for (const record of records) {
        for (const targetId of record.supersedes ?? []) {
          const target = byId.get(targetId);
          if (!target) {
            issues.push(Object.freeze({
              code: "supersedes_target_missing",
              recordId: record.id,
              targetId,
            }));
            continue;
          }
          if (target.createdAt >= record.createdAt) {
            issues.push(Object.freeze({
              code: "supersedes_target_not_older",
              recordId: record.id,
              targetId,
            }));
          }
          const dependents = supersededBy.get(targetId) ?? [];
          dependents.push(record.id);
          supersededBy.set(targetId, dependents);
        }
      }

      const cycles = [];
      const visited = new Set();
      const active = new Set();
      const stack = [];

      function visit(id) {
        if (active.has(id)) {
          const start = stack.indexOf(id);
          cycles.push(stack.slice(start).concat(id));
          return;
        }
        if (visited.has(id)) return;
        visited.add(id);
        active.add(id);
        stack.push(id);
        const record = byId.get(id);
        for (const targetId of record?.supersedes ?? []) {
          if (byId.has(targetId)) visit(targetId);
        }
        stack.pop();
        active.delete(id);
      }

      for (const record of records) visit(record.id);
      for (const cycle of cycles) {
        issues.push(Object.freeze({
          code: "supersedes_cycle",
          recordIds: Object.freeze(cycle),
        }));
      }

      const supersededIds = new Set(supersededBy.keys());
      const currentRecords = records.filter(record => !supersededIds.has(record.id));
      const lineage = records.map(record => Object.freeze({
        recordId: record.id,
        supersedes: Object.freeze([...(record.supersedes ?? [])]),
        supersededBy: Object.freeze([...(supersededBy.get(record.id) ?? [])].sort()),
        isSuperseded: supersededIds.has(record.id),
      }));

      return Object.freeze({
        recordCount: records.length,
        currentRecordIds: Object.freeze(currentRecords.map(record => record.id)),
        lineage: Object.freeze(lineage),
        issues: Object.freeze(issues),
        valid: issues.length === 0,
      });
    },
  });
}
