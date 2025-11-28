// ===============================
// SAFE STATE CHECKER for RAG (Working Version)
// ===============================
//
// Interprets the RAG as a single-instance system.
// Returns: { isSafe: boolean, message, safeSequence }
//

export function isSafeState(graph) {
  const processes = [...graph.processes];
  const resources = [...graph.resources];
  const edges = [...graph.edges];

  // Build allocation map: R -> P
  const allocatedTo = {};  
  edges.forEach(e => {
    if (e.type === "allocation") {
      allocatedTo[e.from] = e.to;    // R -> P
    }
  });

  // Build request map: P -> list of R
  const requests = {};
  processes.forEach(p => (requests[p] = []));
  edges.forEach(e => {
    if (e.type === "request") {
      requests[e.from].push(e.to);   // P -> R
    }
  });

  // Track which processes are finished
  const finished = {};
  processes.forEach(p => (finished[p] = false));

  const safeSeq = [];

  // Simulate freeing resources
  let progressMade = true;

  while (progressMade) {
    progressMade = false;

    for (let p of processes) {
      if (finished[p]) continue;

      // Check if all requested resources are free OR allocated to same process
      let canFinish = true;

      for (let r of requests[p]) {
        if (allocatedTo[r] && allocatedTo[r] !== p) {
          canFinish = false;
          break;
        }
      }

      if (canFinish) {
        // Finish this process, free all its resources
        finished[p] = true;
        safeSeq.push(p);

        for (let r in allocatedTo) {
          if (allocatedTo[r] === p) {
            allocatedTo[r] = null; // free it
          }
        }

        progressMade = true;
      }
    }
  }

  // Check if all processes finished
  const allFinished = processes.every(p => finished[p]);

  if (allFinished) {
    return {
      isSafe: true,
      safeSequence: safeSeq,
      message: `Safe state. Safe sequence = ${safeSeq.join(" → ")}`
    };
  }

  return {
    isSafe: false,
    safeSequence: safeSeq,
    message: "UNSAFE state. No full safe sequence exists."
  };
}
