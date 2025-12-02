// src/utils/detectDeadlock.js
// Fully working RAG cycle detector (supports multi-node PRPPR cycles)

export function detectDirectedCycle(edges = [], nodes = []) {
  // Normalize nodes to strings
  nodes = nodes.map(n => String(n));

  // Build adjacency list
  const adj = {};
  edges.forEach(e => {
    const from = String(e.from);
    const to = String(e.to);
    if (!adj[from]) adj[from] = [];
    adj[from].push(to);
  });

  const visited = new Set();
  const onStack = new Set();
  const path = [];
  const cycles = [];

  function dfs(u) {
    visited.add(u);
    onStack.add(u);
    path.push(u);

    const neighbors = adj[u] || [];
    for (const v of neighbors) {
      if (!visited.has(v)) {
        dfs(v);
      } else if (onStack.has(v)) {
        const start = path.indexOf(v);
        if (start !== -1) {
          const raw = path.slice(start).concat(v);

          const core = raw.slice(0, -1);
          const procSet = new Set(core.filter(x => x.startsWith("P")));

          if (procSet.size <= 1) continue; // ignore trivial 1-process cycles

          const cyc = normalizeCycle(raw);
          if (!cycles.some(c => cyclesEqual(c, cyc))) {
            cycles.push(cyc);
          }
        }
      }
    }

    path.pop();
    onStack.delete(u);
  }

  nodes.forEach(n => {
    if (!visited.has(n)) dfs(n);
  });

  return { deadlocked: cycles.length > 0, cycles };
}

function normalizeCycle(closed) {
  const core = closed.slice(0, -1);
  let best = null;

  for (let i = 0; i < core.length; i++) {
    const rot = core.slice(i).concat(core.slice(0, i));
    const key = rot.join(",");
    if (!best || key < best.key) best = { key, rot };
  }

  return best.rot.concat(best.rot[0]);
}

function cyclesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
