import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Analysis() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const graph = state?.graph || { processes: [], resources: [], edges: [] };
  const analysis = state?.analysis || {};
  const cycle = state?.cycle || analysis?.backend?.cycle || [];

  const [previewOpen, setPreviewOpen] = useState(false);

  const backendImgB64 = analysis?.backend?.visualization || null;
  const backendImgSrc = backendImgB64
    ? `data:image/png;base64,${backendImgB64}`
    : null;

  const instanceDetection = analysis?.local?.instanceDetection;
  const deadlockedProcesses = instanceDetection?.deadlockedProcesses || [];

  const theme = {
    bg: "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",

    cardBg: "rgba(16,22,34,0.88)",
    cardLight: "rgba(255,255,255,0.05)",

    border: "1px solid rgba(90,140,255,0.14)",
    glow: "0 0 14px rgba(90,140,255,0.35)",

    header: "#FFFFFF",
    text: "#E1E7EF",
    muted: "#A3AEC2",
    accent: "#5CAEFF",
    green: "#4fe37a",
    red: "#ff4f4f",
    yellow: "#f6d860",
  };

  /* Common Card */
  const card = {
    background: theme.cardBg,
    padding: 24,
    borderRadius: 14,
    border: theme.border,
    boxShadow: theme.glow,
    marginBottom: 24,
  };

  /* Buttons With Netflix Hover */
  const buttonBase = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
    color: "#00101F",
    fontWeight: 800,
    marginRight: 12,
    transition: "0.28s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  const buttonHover = {
    transform: "translateY(-6px) scale(1.06)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.45), 0 0 28px rgba(80,140,255,0.45)",
    filter: "brightness(1.12)",
  };

  /* Combine cards for left side panels */
  const leftPanelStyle = {
    ...card,
    background: "rgba(16,22,34,0.92)",
  };

  /* Summary Formatting */
  const formattedResources = graph.resources?.length
    ? graph.resources.map((r) => `${r.id}(${r.instances})`).join(", ")
    : "(none)";

  const formattedCycle =
    Array.isArray(cycle) && cycle.length > 0
      ? Array.isArray(cycle[0])
        ? cycle.map((c, i) => `#${i + 1}: ${c.join(" → ")}`).join("\n")
        : cycle.join(" → ")
      : "None";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        padding: "40px 0",
        width: "100vw",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          background: theme.cardBg,
          borderRadius: 18,
          padding: 36,
          border: theme.border,
          boxShadow: "0 0 24px rgba(0,0,0,0.6)",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 28,
            justifyContent: "space-between",
          }}
        >
          {/* Left button */}
          <button
            style={buttonBase}
            className="netflix-btn"
            onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
            onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
            onClick={() => navigate("/simulator")}
          >
            ← Back to Simulator
          </button>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              color: theme.header,
              textShadow: "0 0 20px rgba(100,150,255,0.25)",
            }}
          >
            System Analysis
          </h1>

          {/* Right buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
  className="netflix-btn"
  style={buttonBase}
  onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
  onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
  onClick={() =>
    navigate("/visualizer", {
      state: {
        graph,
        cycle,
        analysis,
        positions: state?.positions || {},
        backendVisualizationBase64: backendImgB64,
      },
    })
  }
>
  Go to Visualization
</button>


            <button
              className="netflix-btn"
              style={buttonBase}
              onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
              onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
              onClick={() =>
                navigate("/report", {
                  state: { ...state, analysis, graph, cycle },
                })
              }
            >
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
          {/* LEFT SIDE */}
          <div>
            {/* SUMMARY */}
            <section style={leftPanelStyle}>
              <h2 style={{ marginTop: 0, color: theme.header }}>Summary</h2>

              <div>
                <strong style={{ color: theme.accent }}>Processes</strong>
                <div>{graph.processes.join(", ") || "(none)"}</div>
              </div>

              <div style={{ marginTop: 14 }}>
                <strong style={{ color: theme.accent }}>Resources</strong>
                <div>{formattedResources}</div>
              </div>

              {/* Deadlock */}
              <div
                style={{
                  padding: 12,
                  marginTop: 20,
                  borderRadius: 8,
                  background: instanceDetection?.deadlocked
                    ? "rgba(255,0,0,0.08)"
                    : "rgba(0,255,120,0.08)",
                }}
              >
                <strong style={{ color: theme.accent }}>
                  Deadlock (Multi-Instance Detection)
                </strong>
                <div style={{ marginTop: 6 }}>
                  {instanceDetection?.deadlocked ? (
                    <span style={{ color: theme.red, fontWeight: 700 }}>
                      YES — Processes: {deadlockedProcesses.join(", ")}
                    </span>
                  ) : (
                    <span style={{ color: theme.green, fontWeight: 700 }}>
                      NO
                    </span>
                  )}
                </div>
              </div>

              {/* Cycle */}
              <div
                style={{
                  padding: 12,
                  marginTop: 20,
                  borderRadius: 8,
                  background: cycle.length
                    ? "rgba(255,220,0,0.08)"
                    : theme.cardLight,
                }}
              >
                <strong style={{ color: theme.accent }}>
                  Cycle (Graph-Based)
                </strong>
                <div style={{ marginTop: 6, whiteSpace: "pre-line" }}>
                  {formattedCycle}
                </div>
              </div>
            </section>

            {/* EXPLANATION */}
            <section style={leftPanelStyle}>
              <h3 style={{ color: theme.header }}>Explanation</h3>
              <div
                style={{
                  background: theme.cardLight,
                  padding: 14,
                  borderRadius: 8,
                }}
              >
                {analysis?.explanation?.explanation ||
                  "No explanation available."}
              </div>
            </section>

            {/* FIX SUGGESTIONS */}
            <section style={leftPanelStyle}>
              <h3 style={{ color: theme.header }}>Fix Suggestions</h3>
              {analysis?.fixes?.length ? (
                <ul>
                  {analysis.fixes.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: theme.muted }}>No fix suggestions.</p>
              )}
            </section>

            {/* SAFETY */}
            <section style={leftPanelStyle}>
              <h3 style={{ color: theme.header }}>Safety / Banker's Info</h3>
              <div style={{ color: theme.text }}>
                {analysis?.safety?.message || "(none)"}
              </div>
            </section>

            {/* METRICS */}
            <section style={leftPanelStyle}>
              <h3 style={{ color: theme.header }}>Metrics</h3>
              <div>Total Edges: {analysis?.metrics?.totalEdges}</div>
            </section>
          </div>

          {/* RIGHT SIDE — VISUALIZATION SECTION */}
          <div style={leftPanelStyle}>
            <h2 style={{ marginTop: 0, color: theme.header }}>
              Visualization
            </h2>

            {backendImgSrc ? (
              <>
                <img
                  src={backendImgSrc}
                  alt="backend-preview"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    marginBottom: 16,
                    boxShadow: "0 0 25px #5CAEFF, 0 0 60px rgba(80,140,255,0.45)",
                  }}
                />

                <button
                  className="netflix-btn"
                  style={{ ...buttonBase, width: "100%", marginBottom: 10 }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
                  onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
                  onClick={() => navigate("/simulator", { state })}
                >
                  🔄 Regenerate Backend Image
                </button>

                <a
                  className="netflix-btn"
                  style={{ ...buttonBase, display: "block", textAlign: "center", marginBottom: 10 }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
                  onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
                  href={backendImgSrc}
                  download="backend_visualization.png"
                >
                  ⬇ Download PNG
                </a>

                <button
                  className="netflix-btn"
                  style={{ ...buttonBase, width: "100%" }}
                  onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
                  onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
                  onClick={() => setPreviewOpen(true)}
                >
                  Open Fullscreen Preview
                </button>
              </>
            ) : (
              <p style={{ color: theme.muted }}>
                No backend visualization available.
              </p>
            )}
          </div>
        </div>

        {/* MODAL PREVIEW */}
        {previewOpen && backendImgSrc && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5000,
            }}
          >
            <div
              style={{
                background: theme.cardBg,
                padding: 20,
                borderRadius: 18,
                maxWidth: "90vw",
                maxHeight: "90vh",
                border: theme.border,
              }}
            >
              <button
                className="netflix-btn"
                style={{ ...buttonBase, marginBottom: 12 }}
                onMouseOver={(e) => Object.assign(e.currentTarget.style, buttonHover)}
                onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonBase)}
                onClick={() => setPreviewOpen(false)}
              >
                Close
              </button>

              <img
                src={backendImgSrc}
                alt="preview-large"
                style={{
                  width: "100%",
                  maxHeight: "80vh",
                  borderRadius: 12,
                  boxShadow: "0 0 35px #5CAEFF, 0 0 90px rgba(80,140,255,0.55)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
