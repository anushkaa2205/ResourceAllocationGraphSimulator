// src/pages/Report.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:5000";

async function postAndDownload(endpoint, body, filename) {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Server error: ${resp.status} ${txt}`);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function Report() {
  const nav = useNavigate();
  const { state } = useLocation();

  const graph = state?.graph || {};
  const analysis = state?.analysis || {};
  const cycle = state?.cycle || [];
  const backendImg = analysis?.backend?.visualization || state?.visualization || null;

  const [msg, setMsg] = useState("");

  /* ------------------ FORMATTERS ------------------ */

  const formattedResources = graph?.resources?.length
    ? graph.resources.map(r => `${r.id}(${r.instances})`).join(", ")
    : "(none)";

  const formattedCycle = cycle?.length
    ? (Array.isArray(cycle[0]) ? cycle.map(c => c.join(" → ")).join("\n") : cycle.join(" → "))
    : "No cycle";

  const deadlockedProcesses =
    analysis?.local?.instanceDetection?.deadlockedProcesses || [];

  const multiDeadlock = analysis?.local?.instanceDetection?.deadlocked;
  const algoMatrix = analysis?.backend?.algorithm_used || "multi-instance-matrix";
  const algoCycle = analysis?.backend?.cycle_algorithm_used || "graph-cycle";

  const requestEdges =
    graph?.edges
      ?.filter(e => e.type === "request")
      ?.map(e => `${e.from} → ${e.to}  (x${e.amount})`) || [];

  const allocationEdges =
    graph?.edges
      ?.filter(e => e.type === "allocation")
      ?.map(e => `${e.from} → ${e.to}  (x${e.amount})`) || [];

  /* ------------------ PAYLOAD ------------------ */

  const makePayload = (extra = {}) => ({
    processes: graph?.processes || [],
    resources: graph?.resources || [], // already in object format
    request_edges: graph?.edges
      ?.filter(e => e.type === "request")
      ?.map(e => ({ from: e.from, to: e.to, amount: e.amount })) || [],
    allocation_edges: graph?.edges
      ?.filter(e => e.type === "allocation")
      ?.map(e => ({ from: e.from, to: e.to, amount: e.amount })) || [],
    analysis: analysis || {},
    backendVisualizationBase64: backendImg,
    ...extra
  });

  async function exportPDF() {
    try {
      setMsg("Generating PDF...");
      const payload = makePayload({ format: "pdf" });
      await postAndDownload(`${BACKEND}/export`, payload, "system_report.pdf");
      setMsg("PDF downloaded");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  }

  async function exportPNG() {
    try {
      setMsg("Generating PNG...");
      const payload = makePayload({ format: "png" });
      await postAndDownload(`${BACKEND}/export`, payload, "visualization.png");
      setMsg("PNG downloaded");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  }

  /* ------------------ UI ------------------ */

  return (
    <div style={{ padding: 30, color: "#e5e5e5" }}>
      <h1 style={{ marginBottom: 10 }}>System Report</h1>
      <p style={{ opacity: 0.8 }}>
        Export a detailed PDF or PNG report for your deadlock analysis.
      </p>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => nav("/simulator")} className="btn">
          ← Back to Simulator
        </button>
        <button
          onClick={() => nav("/analysis", { state })}
          className="btn"
          style={{ marginLeft: 12 }}
        >
          Back to Analysis
        </button>
      </div>

      {/* ------------------ EXPORT BUTTONS ------------------ */}
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <button onClick={exportPDF} className="btn">
          Download PDF
        </button>

        <button
          onClick={exportPNG}
          className="btn"
          style={{ marginLeft: 10 }}
        >
          Download PNG
        </button>
        <button
  className="btn"
  style={{ marginLeft: 10 }}
  onClick={() => {
    const json = JSON.stringify(analysis, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis.json";
    a.click();
    URL.revokeObjectURL(url);
  }}
>
  Download Full JSON
</button>

      </div>

      {msg && (
        <div style={{ marginTop: 16, color: "#8be6ff" }}>
          {msg}
        </div>
      )}

      {/* ------------------ SUMMARY PANEL ------------------ */}
      <div
        style={{
          marginTop: 30,
          padding: 20,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)"
        }}
      >
        <h2 style={{ marginTop: 0 }}>Summary</h2>

        <div style={{ marginTop: 14 }}>
          <strong style={{ color: "#8ecae6" }}>Processes:</strong>{" "}
          {graph?.processes?.join(", ") || "(none)"}
        </div>

        <div style={{ marginTop: 6 }}>
          <strong style={{ color: "#8ecae6" }}>Resources:</strong>{" "}
          {formattedResources}
        </div>

        <div style={{ marginTop: 6 }}>
          <strong style={{ color: "#8ecae6" }}>Total Edges:</strong>{" "}
          {graph?.edges?.length ?? 0}
        </div>
      </div>

      {/* ------------------ DEADLOCK BLOCK ------------------ */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          background: multiDeadlock
            ? "rgba(255,0,0,0.08)"
            : "rgba(0,255,0,0.05)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Deadlock (Multi-Instance Detection)</h3>

        {multiDeadlock ? (
          <p style={{ color: "#ff4f4f", fontWeight: 700 }}>
            YES — Deadlocked Processes:{" "}
            {deadlockedProcesses.join(", ")}
          </p>
        ) : (
          <p style={{ color: "#38b000", fontWeight: 700 }}>NO</p>
        )}

        <div style={{ color: "#9aa6b2", marginTop: 6 }}>
          Algorithm: <strong style={{ color: "#8ecae6" }}>{algoMatrix}</strong>
        </div>
      </div>

      {/* ------------------ CYCLE BLOCK ------------------ */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          borderRadius: 12,
          background: cycle.length
            ? "rgba(255,220,0,0.06)"
            : "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Cycle Detection (Graph-Based)</h3>
        <pre
          style={{
            whiteSpace: "pre-line",
            margin: 0,
            color: cycle.length ? "#f9c74f" : "#aaa"
          }}
        >
          {formattedCycle}
        </pre>

        <div style={{ color: "#9aa6b2", marginTop: 6 }}>
          Algorithm: <strong style={{ color: "#8ecae6" }}>{algoCycle}</strong>
        </div>
      </div>

      {/* ------------------ EDGE LISTS ------------------ */}
      <div
        style={{
          marginTop: 30,
          padding: 20,
          borderRadius: 12,
          background: "rgba(255,255,255,0.04)",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)"
        }}
      >
        <h3 style={{ marginTop: 0 }}>Edges</h3>

        <div style={{ marginTop: 10 }}>
          <strong style={{ color: "#8ecae6" }}>Request Edges:</strong>
          <ul>
            {requestEdges.length ? (
              requestEdges.map((e, i) => <li key={i}>{e}</li>)
            ) : (
              <li>(none)</li>
            )}
          </ul>
        </div>

        <div style={{ marginTop: 10 }}>
          <strong style={{ color: "#8ecae6" }}>Allocation Edges:</strong>
          <ul>
            {allocationEdges.length ? (
              allocationEdges.map((e, i) => <li key={i}>{e}</li>)
            ) : (
              <li>(none)</li>
            )}
          </ul>
        </div>
      </div>

      {/* ------------------ RAW JSON ------------------ */}
      <h3 style={{ marginTop: 30 }}>Raw Analysis Object</h3>
      <pre
        style={{
          background: "rgba(255,255,255,0.06)",
          padding: 20,
          borderRadius: 8,
          color: "#ddd",
          overflowX: "auto"
        }}
      >
{JSON.stringify(analysis, null, 2)}
      </pre>
    </div>
  );
}
