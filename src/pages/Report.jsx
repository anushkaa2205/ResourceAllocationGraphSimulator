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

  /* ========= THEME ========= */
  const theme = {
    bg: "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",

    cardBg: "rgba(16,22,34,0.88)",
    cardLight: "rgba(255,255,255,0.06)",

    border: "1px solid rgba(80,140,255,0.14)",
    shadow: "0 0 18px rgba(90,140,255,0.28)",

    header: "#FFFFFF",
    text: "#E1E7EF",
    muted: "#A3AEC2",
    accent: "#5CAEFF",
    red: "#ff4f4f",
    green: "#4fe37a",
    yellow: "#f6d860"
  };

  /* ========= ADD NETFLIX-HOVER ONCE ========= */
  if (!document.getElementById("report-netflix-hover")) {
    const style = document.createElement("style");
    style.id = "report-netflix-hover";
    style.innerHTML = `
      .netflix-btn {
        transition: transform .28s cubic-bezier(0.4,0,0.2,1),
                    box-shadow .28s cubic-bezier(0.4,0,0.2,1),
                    filter .28s ease;
        cursor: pointer;
      }
      .netflix-btn:hover {
        transform: translateY(-6px) scale(1.06);
        box-shadow: 0 18px 32px rgba(0,0,0,0.45),
                    0 0 22px rgba(80,140,255,0.45) !important;
        filter: brightness(1.15);
      }
    `;
    document.head.appendChild(style);
  }

  /* ========= FORMATTED VALUES ========= */
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
    graph?.edges?.filter(e => e.type === "request")
      ?.map(e => `${e.from} → ${e.to}  (x${e.amount})`) || [];

  const allocationEdges =
    graph?.edges?.filter(e => e.type === "allocation")
      ?.map(e => `${e.from} → ${e.to}  (x${e.amount})`) || [];

  /* ========= PAYLOAD BUILDER ========= */
  const makePayload = (extra = {}) => ({
    processes: graph?.processes || [],
    resources: graph?.resources || [],
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

  /* ========= EXPORT ACTIONS ========= */
  async function exportPDF() {
    try {
      setMsg("Generating PDF...");
      await postAndDownload(`${BACKEND}/export`, makePayload({ format: "pdf" }), "system_report.pdf");
      setMsg("PDF downloaded");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  }

  async function exportPNG() {
    try {
      setMsg("Generating PNG...");
      await postAndDownload(`${BACKEND}/export`, makePayload({ format: "png" }), "visualization.png");
      setMsg("PNG downloaded");
    } catch (e) {
      setMsg("Error: " + e.message);
    }
  }

  /* ========= STYLES ========= */
  const card = {
    background: theme.cardBg,
    padding: 22,
    borderRadius: 14,
    border: theme.border,
    boxShadow: theme.shadow,
    marginTop: 28
  };

  const sectionTitle = {
    margin: 0,
    color: theme.header,
    fontSize: 20,
    fontWeight: 700
  };

  const buttonBase = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
    color: "#00101F",
    fontWeight: 800,
    marginRight: 12,
  };

  return (
    <div style={{
      padding: "40px 28px",
      maxWidth: 1100,
      margin: "0 auto",
      color: theme.text,
      background: theme.bg,
      borderRadius: 20,
    }}>

      {/* Heading */}
      <h1 style={{
        margin: "0 0 8px",
        fontSize: 32,
        color: theme.header,
        fontWeight: 800,
        textShadow: "0 0 20px rgba(100,150,255,0.25)"
      }}>
        System Report
      </h1>

      <p style={{ opacity: 0.9, marginBottom: 20, color: theme.muted }}>
        Export a detailed PDF or PNG report for your deadlock analysis.
      </p>

      {/* Navigation Buttons */}
      <div style={{ marginBottom: 20 }}>
        <button
          className="netflix-btn"     // ⭐ USE NETFLIX BUTTON
          onClick={() => nav("/simulator")}
          style={buttonBase}
        >
          ← Back to Simulator
        </button>

        <button
          className="netflix-btn"
          onClick={() => nav("/analysis", { state })}
          style={buttonBase}
        >
          Back to Analysis
        </button>
      </div>

      {/* Export Actions */}
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <button
          className="netflix-btn"
          onClick={exportPDF}
          style={buttonBase}
        >
          Download PDF
        </button>

        <button
          className="netflix-btn"
          onClick={exportPNG}
          style={buttonBase}
        >
          Download PNG
        </button>

        <button
          className="netflix-btn"
          style={buttonBase}
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

      {/* Status Message */}
      {msg && (
        <div style={{ marginTop: 16, color: theme.accent }}>
          {msg}
        </div>
      )}

      {/* Summary */}
      <div style={card}>
        <h2 style={sectionTitle}>Summary</h2>

        <div style={{ marginTop: 14 }}>
          <strong style={{ color: theme.accent }}>Processes:</strong>{" "}
          {graph?.processes?.join(", ") || "(none)"}
        </div>

        <div style={{ marginTop: 6 }}>
          <strong style={{ color: theme.accent }}>Resources:</strong>{" "}
          {formattedResources}
        </div>

        <div style={{ marginTop: 6 }}>
          <strong style={{ color: theme.accent }}>Total Edges:</strong>{" "}
          {graph?.edges?.length ?? 0}
        </div>
      </div>

      {/* Deadlock Panel */}
      <div style={{
        ...card,
        background: multiDeadlock ? "rgba(255,0,0,0.08)" : "rgba(0,255,120,0.06)"
      }}>
        <h3 style={{ ...sectionTitle, fontSize: 18 }}>
          Deadlock (Multi-Instance Detection)
        </h3>

        {multiDeadlock ? (
          <p style={{ color: theme.red, fontWeight: 700 }}>
            YES — Deadlocked Processes: {deadlockedProcesses.join(", ")}
          </p>
        ) : (
          <p style={{ color: theme.green, fontWeight: 700 }}>NO</p>
        )}

        <div style={{ color: theme.muted, marginTop: 6 }}>
          Algorithm: <strong style={{ color: theme.accent }}>{algoMatrix}</strong>
        </div>
      </div>

      {/* Cycle Detection */}
      <div style={card}>
        <h3 style={{ ...sectionTitle, fontSize: 18 }}>
          Cycle Detection (Graph-Based)
        </h3>

        <pre
          style={{
            whiteSpace: "pre-line",
            margin: 0,
            color: cycle.length ? theme.yellow : theme.muted
          }}
        >
          {formattedCycle}
        </pre>

        <div style={{ color: theme.muted, marginTop: 6 }}>
          Algorithm: <strong style={{ color: theme.accent }}>{algoCycle}</strong>
        </div>
      </div>

      {/* Edge Lists */}
      <div style={card}>
        <h3 style={{ ...sectionTitle, fontSize: 18 }}>Edges</h3>

        <div style={{ marginTop: 10 }}>
          <strong style={{ color: theme.accent }}>Request Edges:</strong>
          <ul>
            {requestEdges.length ? (
              requestEdges.map((e, i) => <li key={i}>{e}</li>)
            ) : (
              <li>(none)</li>
            )}
          </ul>
        </div>

        <div style={{ marginTop: 10 }}>
          <strong style={{ color: theme.accent }}>Allocation Edges:</strong>
          <ul>
            {allocationEdges.length ? (
              allocationEdges.map((e, i) => <li key={i}>{e}</li>)
            ) : (
              <li>(none)</li>
            )}
          </ul>
        </div>
      </div>

      {/* Raw JSON */}
      <h3 style={{ marginTop: 30, color: theme.header }}>Raw Analysis Object</h3>
      <pre
        style={{
          background: theme.cardLight,
          padding: 20,
          borderRadius: 12,
          color: theme.text,
          overflowX: "auto",
          border: theme.border
        }}
      >
        {JSON.stringify(analysis, null, 2)}
      </pre>
    </div>
  );
}
