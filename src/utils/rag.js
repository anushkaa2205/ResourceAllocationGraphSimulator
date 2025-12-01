// src/utils/rag.js
import { detectDirectedCycle } from "./detectDeadlock"; 
import { detectDeadlockMultiInstance } from "./detectDeadlockMultiInstance";

export function createEmptyGraph() {
  return {
    processes: [],
    resources: [],          // now: [{ id: "R1", instances: 3 }]
    edges: []               // now: { from, to, type, amount }
  };
}

/*
  Single-instance deadlock detection (cycle-based)
  Works only when each resource has 1 instance.
*/
export function detectDeadlock(graph) {
  const nodes = [
    ...graph.processes,
    ...graph.resources.map(r => r.id)
  ];
  return detectDirectedCycle(graph.edges, nodes).deadlocked;
}

/*
  Detailed cycle info (for highlighting)
*/
export function detectDeadlockDetailed(graph) {
  const nodes = [
    ...graph.processes,
    ...graph.resources.map(r => r.id)
  ];
  return detectDirectedCycle(graph.edges, nodes);
}

/*
  Multi-instance matrix-based deadlock detection
  Uses Available, Allocation, Request matrices
*/
export function detectDeadlockInstances(graph) {
  return detectDeadlockMultiInstance(graph);
}

/*
  Backend communication (unchanged)
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
