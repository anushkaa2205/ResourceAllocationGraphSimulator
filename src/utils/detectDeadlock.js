// src/utils/detectDeadlock.js
// Returns: { deadlocked: boolean, cycles: [ [node,...,node] ] }

export function detectDirectedCycle(edges, nodes) {
  // build adjacency list
  const adj = {};
  edges.forEach(e => {
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push(e.to);
  });

  const visited = new Set();
  const onStack = new Set();
  const path = [];
  const cycles = [];

  function dfs(node) {
    visited.add(node);
    onStack.add(node);
    path.push(node);

    const neighbors = adj[node] || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        dfs(next);
      } else if (onStack.has(next)) {
        const start = path.indexOf(next);
        if (start !== -1) {
          const rawCycle = path.slice(start).concat(next); // closed cycle

          // Count unique processes in cycle (assumes process IDs start with "P")
          const core = rawCycle.slice(0, rawCycle.length - 1); // remove repeated last
          const uniqueProcs = new Set(core.filter(n => String(n).startsWith("P")));
          if (uniqueProcs.size <= 1) {
            // trivial cycle (single process) — ignore
            continue;
          }

          // Normalize and add unique cycles only
          const normalized = normalizeCycle(rawCycle);
          if (!cycles.some(c => cyclesEqual(c, normalized))) {
            cycles.push(normalized);
          }
        }
      }
    }

    path.pop();
    onStack.delete(node);
  }

  // run DFS from every node to cover disconnected components
  for (const n of nodes) {
    if (!visited.has(n)) dfs(n);
  }

  return { deadlocked: cycles.length > 0, cycles };
}


// ---- helpers ----

// Normalize cycle to canonical rotation (input: closed cycle where first===last).
function normalizeCycle(cycle) {
  // core without the duplicated last node
  const core = cycle.slice(0, cycle.length - 1);

  let best = null;
  for (let i = 0; i < core.length; i++) {
    const rot = core.slice(i).concat(core.slice(0, i));
    const key = rot.join(',');
    if (!best || key < best.key) best = { key, rot };
  }
  return best.rot.concat(best.rot[0]); // closed canonical cycle
}

// Exact equality check for two closed cycles
function cyclesEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
