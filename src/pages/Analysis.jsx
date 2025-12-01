// src/pages/Analysis.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Analysis() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // fallback safe defaults
  const graph = state?.graph || { processes: [], resources: [], edges: [] };
  const analysis = state?.analysis || {};
  const cycle = state?.cycle || analysis?.backend?.cycle || [];

  const [previewOpen, setPreviewOpen] = useState(false);

  // backend visualization
  const backendImgB64 = analysis?.backend?.visualization || null;
  const backendImgSrc = backendImgB64 ? `data:image/png;base64,${backendImgB64}` : null;

  const handleGoToVisualization = () => {
  navigate("/visualizer", {
    state: {
      graph,
      cycle,
      positions: state?.positions ?? {},   // safest
      analysis,
      backendVisualizationBase64: analysis?.backend?.visualization
    }
  });
};


  const handleGoToReport = () => {
    navigate("/report", { state: { ...state, analysis, graph, cycle } });
  };

  /* ------------------ RENDER HELPERS ------------------ */

  // Format resources for multi-instance:
  const formattedResources = graph?.resources?.length
    ? graph.resources.map(r => `${r.id}(${r.instances})`).join(", ")
    : null;

  // Format cycles (cycle may be array of arrays)
  const formattedCycle =
    Array.isArray(cycle) && cycle.length > 0
      ? Array.isArray(cycle[0])
        ? cycle.map((c, i) => `#${i + 1}: ${c.join(" → ")}`).join("\n")
        : cycle.join(" → ")
      : "None";

  // Multi-instance deadlock info
  const instanceDetection = analysis?.local?.instanceDetection;
  const deadlockedProcesses = instanceDetection?.deadlockedProcesses || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #181c24 0%, #23283b 100%)",
        padding: "32px 0",
        boxSizing: "border-box",
        width: "100vw",
        overflowX: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: "rgba(24,28,36,0.98)",
          borderRadius: 18,
          boxShadow: "0 4px 32px 0 rgba(0,0,0,0.12)",
          padding: 36,
          boxSizing: "border-box",
          overflow: "visible",
          width: "95vw",
          minWidth: 320,
        }}
      >
        {/* TOP BAR */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <button className="btn" onClick={() => navigate("/simulator")}>
            ← Back to Simulator
          </button>
          <h1 style={{ margin: "0 auto", fontWeight: 700, letterSpacing: 1.2 }}>
            System Analysis
          </h1>
          <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
            <button className="btn" onClick={handleGoToVisualization}>Go to Visualization</button>
            <button className="btn" onClick={handleGoToReport}>Report</button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2fr) minmax(320px,1fr)",
            gap: 32,
            alignItems: "flex-start",
            width: "100%",
            boxSizing: "border-box",
          }}
        >

          {/* LEFT SIDE CONTENT */}
          <div style={{ minWidth: 0, width: "100%" }}>
            
            {/* SUMMARY */}
                        {/* ----------------- SUMMARY (UPGRADED) ----------------- */}
            <section
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
                boxShadow: "0 1px 4px 0 rgba(0,0,0,0.04)",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Summary</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Processes */}
                <div>
                  <div style={{ fontWeight: 600, color: "#8ecae6" }}>Processes</div>
                  <div>{graph.processes.join(", ") || <span style={{ color: "#aaa" }}>(none)</span>}</div>
                </div>

                {/* Resources */}
                <div>
                  <div style={{ fontWeight: 600, color: "#8ecae6" }}>Resources</div>
                  <div>{formattedResources || <span style={{ color: "#aaa" }}>(none)</span>}</div>
                </div>

                {/* Multi-instance detection */}
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: analysis.local?.instanceDetection?.deadlocked
                      ? "rgba(255,0,0,0.08)"
                      : "rgba(0,255,0,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#8ecae6" }}>
                    Deadlock (Multi-Instance Detection)
                  </div>

                  <div style={{ marginTop: 6 }}>
                    {analysis.local?.instanceDetection?.deadlocked ? (
                      <span style={{ color: "#e63946", fontWeight: 700 }}>
                        YES — Deadlocked Processes: {analysis.local.instanceDetection.deadlockedProcesses.join(", ")}
                      </span>
                    ) : (
                      <span style={{ color: "#38b000", fontWeight: 700 }}>NO</span>
                    )}
                  </div>

                  {/* Algorithm used */}
                  <div style={{ marginTop: 6, fontSize: 14, color: "#aaa" }}>
                    Algorithm:{" "}
                    <strong style={{ color: "#8ecae6" }}>
                      {analysis.backend?.algorithm_used || "multi-instance-matrix"}
                    </strong>
                  </div>
                </div>

                {/* Cycle detection */}
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: cycle.length
                      ? "rgba(255,220,0,0.06)"
                      : "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#8ecae6" }}>Cycle (Graph-Based)</div>

                  <div style={{ marginTop: 6, whiteSpace: "pre-line" }}>
                    {formattedCycle}
                  </div>

                  {/* Algorithm used */}
                  <div style={{ marginTop: 6, fontSize: 14, color: "#aaa" }}>
                    Algorithm:{" "}
                    <strong style={{ color: "#8ecae6" }}>
                      {analysis.backend?.cycle_algorithm_used || "graph-cycle"}
                    </strong>
                  </div>
                </div>

              </div>
            </section>


            {/* DEADLOCKED PROCESSES FOR MULTI-INSTANCE */}
            {instanceDetection?.deadlocked && (
              <section
                style={{
                  background: "rgba(255,0,0,0.05)",
                  borderLeft: "4px solid #e63946",
                  padding: 20,
                  borderRadius: 8,
                  marginBottom: 20,
                }}
              >
                <h3 style={{ marginTop: 0, color: "#e63946" }}>Deadlocked Processes (Multi-instance)</h3>
                <div style={{ fontSize: 16 }}>
                  {deadlockedProcesses.join(", ") || "(none)"}
                </div>
              </section>
            )}

            {/* EXPLANATION */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3>Explanation</h3>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  padding: 14,
                  borderRadius: 8,
                  color: "#e0e0e0",
                  fontSize: 16,
                }}
              >
                {analysis?.explanation?.explanation || "No explanation available."}
              </div>
            </section>

            {/* FIX SUGGESTIONS */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3>Fix Suggestions</h3>
              {analysis?.fixes?.length ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {analysis.fixes.map((f, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#aaa" }}>No fix suggestions available.</p>
              )}
            </section>

            {/* SAFETY / BANKER INFO */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3>Safety / Banker's Info</h3>
              <div>{analysis?.safety?.message || <span style={{ color: "#aaa" }}>No safety info.</span>}</div>

              {analysis?.safety?.safeSequence?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontWeight: 600 }}>Safe Sequence:</span>{" "}
                  <span style={{ color: "#90be6d" }}>{analysis.safety.safeSequence.join(" → ")}</span>
                </div>
              )}
            </section>

            {/* METRICS */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                borderRadius: 12,
                padding: 20,
                marginBottom: 20,
              }}
            >
              <h3>Metrics</h3>
              <div>
                <span style={{ fontWeight: 600 }}>Total Edges:</span>{" "}
                {analysis?.metrics?.totalEdges ?? <span style={{ color: "#aaa" }}>(unknown)</span>}
              </div>
            </section>

            {/* RAW ANALYSIS */}
            <section
              style={{
                background: "rgba(0,0,0,0.5)",
                borderRadius: 10,
                padding: 16,
                marginTop: 28,
                color: "#ddd",
                fontSize: 14,
              }}
            >
              <h4 style={{ marginTop: 0 }}>Raw analysis object</h4>
              <div style={{ overflowX: "auto" }}>
                <pre
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    padding: 12,
                    borderRadius: 6,
                    color: "#ddd",
                    fontSize: 13,
                    margin: 0,
                    whiteSpace: "pre",
                  }}
                >
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </div>
            </section>

          </div>

          {/* RIGHT SIDE VISUALIZATION */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 14,
              padding: 24,
              boxShadow: "0 2px 8px 0 rgba(0,0,0,0.06)",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 18 }}>Visualization</h2>

            {backendImgSrc ? (
              <>
                <img
                  src={backendImgSrc}
                  alt="backend-preview"
                  style={{
                    maxWidth: "100%",
                    border: "1px solid #444",
                    borderRadius: 10,
                    marginBottom: 16,
                    background: "#222",
                    display: "block",
                  }}
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn" onClick={() => setPreviewOpen(true)}>
                    Open Visualizer Modal
                  </button>
                  <a className="btn" href={backendImgSrc} download="visualization.png">
                    Download PNG
                  </a>
                </div>
              </>
            ) : (
              <div style={{ color: "#aaa", fontStyle: "italic" }}>
                No backend visualization available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {previewOpen && backendImgSrc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#181c24",
              padding: 24,
              borderRadius: 16,
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <button
              className="btn"
              onClick={() => setPreviewOpen(false)}
              style={{ marginBottom: 16, float: "right" }}
            >
              Close
            </button>

            <img
              src={backendImgSrc}
              alt="preview"
              style={{ maxWidth: "80vw", maxHeight: "80vh", borderRadius: 10 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
