// src/pages/Analysis.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Analysis() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const graph = state?.graph || { processes: [], resources: [], edges: [] };
  const analysis = state?.analysis || {};
  const cycle = state?.cycle || analysis?.backend?.cycle || [];

  const [previewOpen, setPreviewOpen] = useState(false);

  // backend image
  const backendImgB64 = analysis?.backend?.visualization || null;
  const backendImgSrc = backendImgB64
    ? `data:image/png;base64,${backendImgB64}`
    : null;

  /* -----------------------------------------
     🔄 Regenerate Backend Visualization Button
  ------------------------------------------- */
  const handleRegenerateBackend = () => {
    navigate("/simulator", {
      state: {
        regenerateBackend: true,
        graph,
        positions: state?.positions || {},
      },
    });
  };

  /* -----------------------------------------
     → Visualization Page Navigation (fixed)
  ------------------------------------------- */
  const handleGoToVisualization = () => {
    navigate("/visualizer", {
      state: {
        graph,
        cycle,
        positions: state?.positions || {},
        analysis,
        backendVisualizationBase64: backendImgB64,
      },
    });
  };

  const handleGoToReport = () => {
    navigate("/report", { state: { ...state, analysis, graph, cycle } });
  };

  // formatting helpers
  const formattedResources = graph.resources?.length
    ? graph.resources.map((r) => `${r.id}(${r.instances})`).join(", ")
    : "(none)";

  const formattedCycle =
    Array.isArray(cycle) && cycle.length > 0
      ? Array.isArray(cycle[0])
        ? cycle.map((c, i) => `#${i + 1}: ${c.join(" → ")}`).join("\n")
        : cycle.join(" → ")
      : "None";

  const instanceDetection = analysis?.local?.instanceDetection;
  const deadlockedProcesses = instanceDetection?.deadlockedProcesses || [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg,#181c24,#23283b)",
        padding: "32px 0",
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
          padding: 36,
          width: "95vw",
        }}
      >
        {/* TOP BAR */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
          <button className="btn" onClick={() => navigate("/simulator")}>
            ← Back to Simulator
          </button>

          <h1 style={{ margin: "0 auto" }}>System Analysis</h1>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn" onClick={handleGoToVisualization}>
              Go to Visualization
            </button>
            <button className="btn" onClick={handleGoToReport}>
              Report
            </button>
          </div>
        </div>

        {/* GRID LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,2fr) minmax(320px,1fr)",
            gap: 32,
          }}
        >
          {/* ---------------------------------
             LEFT SIDE CONTENT (UNCHANGED)
          ----------------------------------- */}
          <div>
            {/* SUMMARY */}
            <section
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 12,
                padding: 24,
                marginBottom: 24,
              }}
            >
              <h2>Summary</h2>

              <div>
                <strong style={{ color: "#8ecae6" }}>Processes</strong>
                <div>{graph.processes.join(", ") || "(none)"}</div>
              </div>

              <div style={{ marginTop: 14 }}>
                <strong style={{ color: "#8ecae6" }}>Resources</strong>
                <div>{formattedResources}</div>
              </div>

              {/* MULTI INSTANCE RESULT */}
              <div
                style={{
                  padding: 12,
                  marginTop: 20,
                  borderRadius: 8,
                  background: instanceDetection?.deadlocked
                    ? "rgba(255,0,0,0.08)"
                    : "rgba(0,255,0,0.05)",
                }}
              >
                <strong style={{ color: "#8ecae6" }}>
                  Deadlock (Multi-Instance Detection)
                </strong>
                <div style={{ marginTop: 6 }}>
                  {instanceDetection?.deadlocked ? (
                    <span style={{ color: "#e63946", fontWeight: "bold" }}>
                      YES — Processes: {deadlockedProcesses.join(", ")}
                    </span>
                  ) : (
                    <span style={{ color: "#38b000", fontWeight: "bold" }}>
                      NO
                    </span>
                  )}
                </div>
              </div>

              {/* GRAPH-BASED CYCLE */}
              <div
                style={{
                  padding: 12,
                  marginTop: 20,
                  borderRadius: 8,
                  background: cycle.length
                    ? "rgba(255,220,0,0.08)"
                    : "rgba(255,255,255,0.02)",
                }}
              >
                <strong style={{ color: "#8ecae6" }}>
                  Cycle (Graph-Based)
                </strong>
                <div style={{ marginTop: 6, whiteSpace: "pre-line" }}>
                  {formattedCycle}
                </div>
              </div>
            </section>

            {/* MORE LEFT-SECTIONS… (unchanged, keeping your full file) */}
            {/* ------------------------------------------ */}
            {/* EXPLANATION */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <h3>Explanation</h3>
              <div
                style={{
                  background: "rgba(255,255,255,0.04)",
                  padding: 14,
                  borderRadius: 8,
                  color: "#eee",
                }}
              >
                {analysis?.explanation?.explanation ||
                  "No explanation available."}
              </div>
            </section>

            {/* FIX SUGGESTIONS */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <h3>Fix Suggestions</h3>
              {analysis?.fixes?.length ? (
                <ul>
                  {analysis.fixes.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "#aaa" }}>No fix suggestions.</p>
              )}
            </section>

            {/* SAFETY */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                padding: 20,
                borderRadius: 12,
                marginBottom: 20,
              }}
            >
              <h3>Safety / Banker's Info</h3>
              <div>{analysis?.safety?.message || "(none)"}</div>
            </section>

            {/* METRICS */}
            <section
              style={{
                background: "rgba(255,255,255,0.025)",
                padding: 20,
                borderRadius: 12,
              }}
            >
              <h3>Metrics</h3>
              <div>Total Edges: {analysis?.metrics?.totalEdges}</div>
            </section>
          </div>

          {/* ---------------------------------------------
                  RIGHT SIDE VISUALIZATION (MAIN FIXES)
          ---------------------------------------------- */}
          <div
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 14,
              padding: 24,
            }}
          >
            <h2 style={{ marginTop: 0 }}>Visualization</h2>

            {backendImgSrc ? (
              <>
                {/* NEON GLOW PREVIEW */}
                <img
                  src={backendImgSrc}
                  alt="backend-preview"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 10,
                    marginBottom: 16,
                    boxShadow:
                      "0 0 18px #8b5cf6, 0 0 40px rgba(139,92,246,0.45)",
                  }}
                />

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <button className="btn primary" onClick={handleRegenerateBackend}>
                    🔄 Regenerate Backend Image
                  </button>

                  <a
                    className="btn"
                    href={backendImgSrc}
                    download="backend_visualization.png"
                  >
                    ⬇ Download PNG
                  </a>

                  <button className="btn" onClick={() => setPreviewOpen(true)}>
                    Open Fullscreen Preview
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: "#aaa", fontStyle: "italic" }}>
                No backend visualization available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ------------------ FULLSCREEN MODAL ------------------ */}
      {previewOpen && backendImgSrc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "#11141d",
              padding: 20,
              borderRadius: 16,
              maxWidth: "90vw",
              maxHeight: "90vh",
            }}
          >
            <button
              className="btn"
              onClick={() => setPreviewOpen(false)}
              style={{ marginBottom: 10 }}
            >
              Close
            </button>

            <img
              src={backendImgSrc}
              alt="big-preview"
              style={{
                maxWidth: "85vw",
                maxHeight: "80vh",
                borderRadius: 12,
                boxShadow:
                  "0 0 25px #8b5cf6, 0 0 60px rgba(139,92,246,0.45)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
