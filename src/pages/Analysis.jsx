// src/pages/Analysis.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Analysis() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // fallback safe defaults
  const graph = state?.graph || { processes: [], resources: [], edges: [] };
  const analysis = state?.analysis || {};
  const cycle = state?.cycle || (analysis?.backend?.cycle || []);

  const [previewOpen, setPreviewOpen] = useState(false);

  // If backend gave an image base64, build an image src
  const backendImgB64 = analysis?.backend?.visualization || null;
  const backendImgSrc = backendImgB64 ? `data:image/png;base64,${backendImgB64}` : null;

  return (
    <div style={{ padding: 28 }}>
      <button className="btn" onClick={() => navigate("/simulator")}>Back to Simulator</button>

      <h1 style={{ marginTop: 18 }}>System Analysis</h1>

      <section style={{ marginTop: 12 }}>
        <h3>Summary</h3>
        <p><strong>Processes:</strong> {graph.processes.join(", ") || "(none)"}</p>
        <p><strong>Resources:</strong> {graph.resources.join(", ") || "(none)"}</p>
        <p><strong>Deadlock detected (backend):</strong> {analysis?.backend?.deadlock ? "YES" : "NO"}</p>
        <p><strong>Cycle (if any):</strong> {cycle?.length ? cycle.join(" → ") : "None"}</p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Explanation</h3>
        <div style={{ background: "rgba(255,255,255,0.04)", padding: 12, borderRadius: 8 }}>
          <p>{analysis?.explanation?.explanation || "No explanation available."}</p>
        </div>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Fix Suggestions</h3>
        {analysis?.fixes && analysis.fixes.length ? (
          <ul>
            {analysis.fixes.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        ) : <p>No fix suggestions available.</p>}
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Safety / Banker's Info</h3>
        <p>{analysis?.safety?.message || "No safety info."}</p>
        {analysis?.safety?.safeSequence && analysis.safety.safeSequence.length > 0 && (
          <p><strong>Safe Sequence:</strong> {analysis.safety.safeSequence.join(" → ")}</p>
        )}
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Metrics</h3>
        <p><strong>Total Edges:</strong> {analysis?.metrics?.totalEdges ?? "(unknown)"}</p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h3>Visualization</h3>
        {backendImgSrc ? (
          <div>
            <img src={backendImgSrc} alt="backend-preview" style={{ maxWidth: 560, border: "1px solid #444", borderRadius: 8 }} />
            <div style={{ marginTop: 10 }}>
              <button className="btn" onClick={() => setPreviewOpen(true)}>Open Visualizer Modal</button>
              <a
                className="btn"
                style={{ marginLeft: 8 }}
                href={backendImgSrc}
                download="visualization.png"
              >
                Download PNG
              </a>
            </div>
          </div>
        ) : (
          <p>No backend visualization available.</p>
        )}
      </section>

      <div style={{ marginTop: 26 }}>
        <h3>Raw analysis object</h3>
        <pre style={{ background: "rgba(0,0,0,0.6)", padding: 12, borderRadius: 6, color: "#ddd", maxHeight: 320, overflow: "auto" }}>
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </div>

      {/* You can optionally wire this to your existing VisualizerModal if you want modal UI */}
      {previewOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 2000
        }}>
          <div style={{ background: "#101217", padding: 18, borderRadius: 12 }}>
            <button onClick={() => setPreviewOpen(false)} style={{ marginBottom: 8 }}>Close</button>
            <div>
              <img src={backendImgSrc} alt="preview" style={{ maxWidth: "80vw", maxHeight: "80vh" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
