import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Analysis() {
  const navigate = useNavigate();
  const location = useLocation();

  // If user opens /analysis directly:
  if (!location.state) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>No analysis data available</h2>
        <p>Please run a graph analysis first.</p>
        <button onClick={() => navigate("/simulator")} style={{ marginTop: 20 }}>
          Go to Simulator
        </button>
      </div>
    );
  }

  const { analysis, graph, cycle } = location.state;

  return (
    <div style={{ padding: "30px", maxWidth: 900, margin: "0 auto" }}>

      <h1 style={{ marginBottom: 25 }}>System Analysis Dashboard</h1>

      {/* EXPLANATION */}
      <section style={sectionStyle}>
        <h2>🧠 Deadlock Explanation</h2>
        <p>{analysis.explanation?.explanation || "No deadlocks detected."}</p>
      </section>

      {/* FIX SUGGESTIONS */}
      <section style={sectionStyle}>
        <h2>🛠 Fix Suggestions</h2>
        <ul>
          {analysis.fixes?.map((fix, idx) => (
            <li key={idx} style={{ marginBottom: 6 }}>{fix}</li>
          ))}
        </ul>
      </section>

      {/* RISK */}
      <section style={sectionStyle}>
        <h2>⚠ Deadlock Risk</h2>
        <p>
          <strong>{analysis.prediction?.riskLevel}</strong>{" "}
          ({analysis.prediction?.riskPercent}%)
        </p>
      </section>

      {/* SAFETY */}
      <section style={sectionStyle}>
        <h2>🛡 Safety Check</h2>
        <p>{analysis.safety?.message}</p>

        {analysis.safety?.safeSequence?.length > 0 && (
          <p style={{ marginTop: 10 }}>
            <strong>Safe Sequence:</strong><br />
            {analysis.safety.safeSequence.join(" → ")}
          </p>
        )}
      </section>

      {/* METRICS */}
      <section style={sectionStyle}>
        <h2>📊 Graph Metrics</h2>
        <p><strong>Total Edges:</strong> {analysis.metrics?.totalEdges}</p>
      </section>

      {/* ACTION BUTTONS */}
      <div style={{ marginTop: 35, display: "flex", gap: 20 }}>
        <button
  onClick={() =>
    navigate("/visualizer", {
      state: {
        analysis,
        graph: {
          processes: graph.processes,
          resources: graph.resources,
          request_edges: graph.edges
            .filter(e => e.type === "request")
            .map(e => [e.from, e.to]),
          allocation_edges: graph.edges
            .filter(e => e.type === "allocation")
            .map(e => [e.from, e.to])
        },
        cycle
      }
    })
  }
>
  🎨 Open Visualizer
</button>


        <button
          style={buttonStyle}
          onClick={() => navigate("/report", { state: { analysis, graph } })}
        >
          📄 Download Report
        </button>

        <button
          style={buttonStyle}
          onClick={() => navigate("/simulator")}
        >
          ← Back to Simulator
        </button>
      </div>

    </div>
  );
}

/* ------------------ STYLES ------------------ */

const sectionStyle = {
  padding: "20px",
  background: "rgba(255,255,255,0.05)",
  borderRadius: "10px",
  marginBottom: "25px",
  border: "1px solid #333"
};

const buttonStyle = {
  padding: "12px 22px",
  background: "#3b82f6",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "16px"
};
