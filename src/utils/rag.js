// src/utils/rag.js
import { detectDirectedCycle } from "./detectDeadlock";

export function createEmptyGraph() {
  return {
    processes: [],
    resources: [],
    edges: [] // { from: "P1", to: "R1" } or { from: "R1", to: "P1" }
  };
}

export function detectDeadlock(graph) {
  const nodes = [...graph.processes, ...graph.resources];
  return detectDirectedCycle(graph.edges, nodes).deadlocked;
}

// more detailed version: returns cycles for highlighting
export function detectDeadlockDetailed(graph) {
  const nodes = [...graph.processes, ...graph.resources];
  return detectDirectedCycle(graph.edges, nodes); // { deadlocked, cycles }
}
export async function sendGraphToBackend(graph) {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graph),
    });

    const data = await response.json();
    return data; // deadlock result
  } catch (err) {
    console.error("Backend error:", err);
    return null;
  }
}
