// MODULE 2 — Deadlock Prediction Engine (Intelligent with % output)

export function predictDeadlock(snapshot) {
  const edges = snapshot.edges || [];
  const processes = snapshot.processes || [];
  const resources = snapshot.resources || [];

  // 1) Real deadlock -> CRITICAL 100%
  if (snapshot.cycles && snapshot.cycles.length > 0) {
    return {
      riskScore: 1.0,
      riskPercent: 100,
      riskLevel: "CRITICAL"
    };
  }

  // 2) Near-cycle detection
  let nearCycle = false;
  const requests = edges.filter(e => e.type === "request");
  const allocations = edges.filter(e => e.type === "allocation");

  for (let req of requests) {
    for (let alloc of allocations) {
      if (req.to === alloc.from) {
        nearCycle = true;
      }
    }
  }

  if (nearCycle) {
    return {
      riskScore: 0.8,
      riskPercent: 80,
      riskLevel: "HIGH"
    };
  }

  // 3) Contention-based scoring
  const contention = edges.length / (processes.length + resources.length + 1);
  const riskScore = Math.min(1, contention);
  const percent = Math.round(riskScore * 100);

  return {
    riskScore,
    riskPercent: percent,
    riskLevel:
      riskScore > 0.7 ? "HIGH" :
      riskScore > 0.4 ? "MEDIUM" :
      "LOW"
  };
}
