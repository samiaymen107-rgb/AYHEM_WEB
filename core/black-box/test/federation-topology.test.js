import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(
  new URL("../contracts/federation-v1.manifest.json", import.meta.url),
  "utf8",
));

test("integration graph contains exactly the eight federation repositories", () => {
  const expected = manifest.repositories.map(repository => repository.name).sort();
  assert.equal(manifest.integration_graph.nodes.length, 8);
  assert.deepEqual([...manifest.integration_graph.nodes].sort(), expected);
  assert.equal(new Set(manifest.integration_graph.nodes).size, 8);
});

test("every integration edge connects known repositories with an explicit boundary status", () => {
  const nodes = new Set(manifest.integration_graph.nodes);
  const edgeKeys = new Set();
  assert.ok(manifest.integration_graph.edge_semantics.includes("not deployed runtime connectivity"));

  for (const edge of manifest.integration_graph.edges) {
    assert.ok(nodes.has(edge.from), `unknown edge source: ${edge.from}`);
    assert.ok(nodes.has(edge.to), `unknown edge target: ${edge.to}`);
    assert.notEqual(edge.from, edge.to, "self-dependency is not allowed");
    assert.ok(edge.interface);
    assert.ok([
      "documented-contract-boundary",
      "local-adapter-only-no-network",
      "contract-defined-not-live",
    ].includes(edge.status));
    const key = `${edge.from}->${edge.to}`;
    assert.ok(!edgeKeys.has(key), `duplicate dependency edge: ${key}`);
    edgeKeys.add(key);
  }
});

test("all eight repositories belong to one connected federation graph", () => {
  const adjacency = new Map(manifest.integration_graph.nodes.map(node => [node, new Set()]));
  for (const edge of manifest.integration_graph.edges) {
    adjacency.get(edge.from).add(edge.to);
    adjacency.get(edge.to).add(edge.from);
  }

  const visited = new Set();
  const queue = [manifest.integration_graph.nodes[0]];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of adjacency.get(current)) {
      if (!visited.has(next)) queue.push(next);
    }
  }
  assert.deepEqual([...visited].sort(), [...manifest.integration_graph.nodes].sort());
});

test("MEMORY depends on LINK contracts without a reverse implementation dependency", () => {
  const edges = manifest.integration_graph.edges;
  assert.ok(edges.some(edge =>
    edge.from === "AYHEM-MEMORY" &&
    edge.to === "AYHEM-LINK" &&
    edge.interface === "memory-event-envelope-v1"
  ));
  assert.ok(!edges.some(edge =>
    edge.from === "AYHEM-LINK" && edge.to === "AYHEM-MEMORY"
  ));
});

test("only the local web adapter edge is marked as implemented, and it performs no network call", () => {
  const implemented = manifest.integration_graph.edges.filter(
    edge => edge.status === "local-adapter-only-no-network",
  );
  assert.deepEqual(implemented.map(edge => [edge.from, edge.to]), [
    ["AYHEM_WEB", "AYHEM-LINK"],
  ]);
});
