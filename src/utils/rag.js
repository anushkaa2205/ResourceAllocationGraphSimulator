// src/utils/rag.js
import { detectDirectedCycle } from "./detectDeadlock";
import { detectDeadlockMultiInstance } from "./detectDeadlockMultiInstance";

export function createEmptyGraph() {
  return {
    processes: [],
    resources: [],      // supports both ["R1"] and [{id:"R1"}]
    edges: []           // edges: { id, from, to, type }
  };
}

// Helper to normalize resources array to plain IDs
function normalizeResources(resources) {
  return resources.map(r => typeof r === "string" ? r : r.id);
}

// Helper to normalize edges
function normalizeEdges(edges) {
  return edges.map(e => ({
    ...e,
    from: String(e.from),
    to: String(e.to)
  }));
}

/*
  Detect deadlock (boolean only)
*/
export function detectDeadlock(graph) {
  const nodes = [
    ...graph.processes.map(String),
    ...normalizeResources(graph.resources)
  ];
const edges = normalizeEdges(
  graph.edges.filter(e => e.type !== "claim")
);
return detectDirectedCycle(edges, nodes).deadlocked;

}

/*
  Detailed cycle info (for highlighting)
*/
export function detectDeadlockDetailed(graph) {
  const nodes = [
    ...graph.processes.map(String),
    ...normalizeResources(graph.resources)
  ];
const edges = normalizeEdges(
  graph.edges.filter(e => e.type !== "claim")
);
return detectDirectedCycle(edges, nodes);

}

/*
  Multi-instance (banker's algorithm)
*/
export function detectDeadlockInstances(graph) {
  return detectDeadlockMultiInstance(graph);
}

/*
  Backend communication
*/
export async function sendGraphToBackend(graph) {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graph),
    });

    return await response.json();
  } catch (err) {
    console.error("Backend error:", err);
    return null;
  }
}
