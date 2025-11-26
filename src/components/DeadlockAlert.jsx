// src/components/DeadlockAlert.jsx
import React from "react";

/*
  Props:
    result: { deadlocked: boolean, cycles: [...] }
    graph: current graph object { processes, resources, edges }
    onResetGraph: function to clear the graph (optional)
*/

export default function DeadlockAlert({ result, graph = { edges: [] }, onResetGraph }) {
  if (!result) return null;

  const hasAllocation = (graph.edges || []).some(e => e.type === "allocation");

  if (result.deadlocked) {
    return (
      <div className="alert alert-danger" role="alert" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <strong>⚠️ Deadlock detected</strong>
            <div style={{ marginTop: 8 }}>
              {(result.cycles || []).map((c, idx) => (
                <div key={idx} style={{ fontFamily: "monospace", marginTop: 6 }}>
                  Cycle {idx + 1}: {c.join(" → ")}
                </div>
              ))}
              <div style={{ marginTop: 10, color: "#6b1a1a" }}>
                The system currently has processes waiting on each other in a cycle. Use the edge controls or recovery actions (kill/preempt) to break the cycle.
              </div>
            </div>
          </div>

          {/* Reset button inside the alert */}
          <div style={{ marginLeft: 12 }}>
            {typeof onResetGraph === "function" ? (
              <button onClick={onResetGraph} style={{ padding: "8px 10px", borderRadius: 8 }}>
                Reset Graph
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Only show the green "No deadlock" message if at least one allocation exists.
  if (!hasAllocation) {
    // nothing to show yet: don't display a green "no deadlock" before any allocations exist
    return null;
  }

  // No deadlock and there is at least one allocation -> show success
  return (
    <div className="alert alert-success" role="status" style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <strong>✅ No deadlock detected</strong>
        <div style={{ marginTop: 8, color: "#1b5e20" }}>
          There are currently no cycles involving two or more processes. Requests are either unblocked or resources are allocated without circular waiting.
        </div>
      </div>

      {typeof onResetGraph === "function" ? (
        <div>
          <button onClick={onResetGraph} style={{ padding: "8px 10px", borderRadius: 8 }}>
            Reset Graph
          </button>
        </div>
      ) : null}
    </div>
  );
}
