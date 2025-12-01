// src/utils/detectDeadlockMultiInstance.js

export function detectDeadlockMultiInstance(graph) {
  const { processes, resources, edges } = graph;

  const n = processes.length;
  const m = resources.length;

  // Map resource index
  const resIndex = {};
  resources.forEach((r, i) => resIndex[r.id] = i);

  // Available vector
  const Available = Array(m).fill(0);
  resources.forEach((r, i) => Available[i] = r.instances);

  // Build matrices
  const Allocation = Array(n).fill(0).map(() => Array(m).fill(0));
  const Request = Array(n).fill(0).map(() => Array(m).fill(0));

  edges.forEach(e => {
    const pIdx = processes.indexOf(e.from.startsWith("P") ? e.from : e.to);
    const rIdx = resIndex[e.from.startsWith("R") ? e.from : e.to];
    const isAlloc = e.type === "allocation";

    if (isAlloc) {
      Allocation[pIdx][rIdx] += e.amount;
      Available[rIdx] -= e.amount;
    } else {
      Request[pIdx][rIdx] += e.amount;
    }
  });

  const Finish = Array(n).fill(false);

  // init finish
  for (let i = 0; i < n; i++) {
    let allocSum = Allocation[i].reduce((a, b) => a + b, 0);
    if (allocSum === 0) Finish[i] = true;
  }

  const Work = [...Available];

  while (true) {
    let found = false;
    for (let i = 0; i < n; i++) {
      if (!Finish[i]) {
        let canRun = true;
        for (let j = 0; j < m; j++) {
          if (Request[i][j] > Work[j]) {
            canRun = false;
            break;
          }
        }
        if (canRun) {
          for (let j = 0; j < m; j++) Work[j] += Allocation[i][j];
          Finish[i] = true;
          found = true;
        }
      }
    }
    if (!found) break;
  }

  const deadlocked = [];
  Finish.forEach((f, i) => {
    if (!f) deadlocked.push(processes[i]);
  });

  return {
    deadlocked: deadlocked.length > 0,
    deadlockedProcesses: deadlocked
  };
}
