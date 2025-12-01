// src/pages/Visualizer.jsx
import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendGraphToBackend } from "../utils/sendGraphToBackend";

/* ------------------ helpers ------------------ */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// fallback PNG export from SVG if backend visualization missing
async function svgToPngBlob(svgEl, width = 1200, height = 800) {
  const data = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#0f1722";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, "image/png");
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/* ------------------ Visualizer Page ------------------ */
export default function Visualizer() {
  const nav = useNavigate();
  const location = useLocation();

  const incoming = location.state || {};

  /* ---------- GRAPH FORMAT FIX ---------- */
  const graph = incoming.graph || {};
  graph.processes ||= [];
  graph.resources ||= []; // now array of {id, instances}
  graph.request_edges ||= []; // now array of { from, to, amount }
  graph.allocation_edges ||= [];

  const cycle = incoming.cycle || []; // still OK
  const positions = incoming.positions || {};

  const [backendPreview, setBackendPreview] = useState(incoming.backendVisualizationBase64 || null);
  const [animating, setAnimating] = useState(false);
  const [busy, setBusy] = useState(false);

  const svgRef = useRef(null);

  /* ------------------ Build Node List ------------------ */

  const nodes = [
    ...graph.processes.map(id => ({ id, ntype: "process" })),
    ...graph.resources.map(r => ({ id: r.id, ntype: "resource", instances: r.instances }))
  ];

  /* ------------------ Build Edge List ------------------ */

  const edges = [
    ...graph.request_edges.map(e => ({ from: e.from, to: e.to, amount: e.amount, etype: "request" })),
    ...graph.allocation_edges.map(e => ({ from: e.from, to: e.to, amount: e.amount, etype: "allocation" }))
  ];

  /* ------------------ Compute Node Coordinates ------------------ */
  const coords = {};
  if (Object.keys(positions).length > 0) {
    const xs = Object.values(positions).map(p => p.x);
    const ys = Object.values(positions).map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const W = Math.max(300, maxX - minX || 300);
    const H = Math.max(300, maxY - minY || 300);

    nodes.forEach((n, i) => {
      const p = positions[n.id] || { x: minX + (i * 40), y: minY + (i * 40) };
      const x = ((p.x - minX) / W) * 900 + 30;
      const y = ((p.y - minY) / H) * 600 + 30;
      coords[n.id] = { x, y };
    });
  } else {
    nodes.forEach((n, i) => {
      coords[n.id] = { x: 120 + (i % 4) * 200, y: 120 + Math.floor(i / 4) * 180 };
    });
  }

  /* ------------------ Deadlock Info ------------------ */
  const deadNodes = new Set(cycle);
  const deadlock = cycle.length > 0;

  useEffect(() => {
    setBackendPreview(incoming.backendVisualizationBase64 || null);
  }, [incoming.backendVisualizationBase64]);

  /* ------------------ Actions ------------------ */

  const handleDownloadPNG = async () => {
    setBusy(true);
    try {
      if (backendPreview) {
        const byteChars = atob(backendPreview);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        downloadBlob(new Blob([byteArray], { type: "image/png" }), "visualization.png");
      } else {
        const blob = await svgToPngBlob(svgRef.current, 1200, 800);
        downloadBlob(blob, "visualization.png");
      }
    } catch (err) {
      alert("PNG Export Failed");
    }
    setBusy(false);
  };

  const handleDownloadPDF = async () => {
    setBusy(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...graph, format: "pdf" })
      });

      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      downloadBlob(blob, "visualization.pdf");
    } catch (err) {
      alert("PDF Export Failed");
    }
    setBusy(false);
  };

  const handleRegenerate = async () => {
    setBusy(true);
    try {
      const result = await sendGraphToBackend(graph);
      if (result?.visualization) {
        setBackendPreview(result.visualization);
        alert(result.deadlock ? "Deadlock found" : "No Deadlock");
      }
    } catch {
      alert("Backend regeneration failed");
    }
    setBusy(false);
  };

  /* ------------------ RENDER ------------------ */

  return (
    <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 10 }}>Visualizer</h1>

      {/* Empty graph message */}
      {(graph.processes.length === 0 && graph.resources.length === 0) ? (
        <div style={{ padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
          <h3>No graph supplied</h3>
          <button onClick={() => nav("/simulator")}>Go to Simulator</button>
        </div>
      ) : (
        <>
          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <button onClick={() => setAnimating(a => !a)}>
              {animating ? "Stop Animation" : "Animate Deadlock"}
            </button>
            <button onClick={handleDownloadPNG} disabled={busy}>
              {busy ? "..." : "Export PNG"}
            </button>
            <button onClick={handleDownloadPDF} disabled={busy}>
              {busy ? "..." : "Export PDF"}
            </button>
            <button onClick={handleRegenerate} disabled={busy}>
              {busy ? "..." : "Re-generate (Backend)"}
            </button>

            <div style={{ flex: 1 }} />
            <button onClick={() => nav("/analysis", { state: incoming })}>Back to Analysis</button>
            <button onClick={() => nav("/simulator")}>Back to Simulator</button>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            {/* SVG CANVAS */}
            <div style={{ flex: 1, background: "#0f1722", padding: 12, borderRadius: 10 }}>
              <svg ref={svgRef} width="100%" height="560" viewBox="0 0 960 640" style={{ background: "#0f1722" }}>

                {/* EDGES */}
                {edges.map((e, i) => {
                  const a = coords[e.from];
                  const b = coords[e.to];
                  const isDead = deadNodes.has(e.from) && deadNodes.has(e.to);

                  return (
                    <g key={i}>
                      <line
                        x1={a.x} y1={a.y}
                        x2={b.x} y2={b.y}
                        stroke={isDead ? "#ff416c" : (e.etype === "request" ? "#60a5fa" : "#34d399")}
                        strokeWidth={isDead ? 4 : 2}
                        strokeDasharray={e.etype === "request" ? "6 6" : ""}
                      />

                      {/* AMOUNT LABEL */}
                      {e.amount > 1 && (
                        <text
                          x={(a.x + b.x) / 2}
                          y={(a.y + b.y) / 2 - 6}
                          fill="#fff"
                          fontSize="14"
                          textAnchor="middle"
                        >
                          {e.amount}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* NODES */}
                {nodes.map(n => {
                  const { x, y } = coords[n.id];
                  const isDead = deadNodes.has(n.id);

                  return (
                    <g key={n.id} transform={`translate(${x}, ${y})`}>
                      {/* Resource node */}
                      {n.ntype === "resource" ? (
                        <>
                          <rect
                            x={-22} y={-22} width={44} height={44} rx={6}
                            fill={isDead ? "#ff416c" : "#10b981"}
                            stroke="#0b1220" strokeWidth="2"
                          />
                          <text x={0} y={4} textAnchor="middle" fill="#041726" fontWeight={700}>
                            {n.id}
                          </text>

                          {/* Instance Dots */}
                          {Array.from({ length: n.instances || 1 }).map((_, i) => (
                            <circle
                              key={i}
                              cx={-20 + i * 14}
                              cy={-32}
                              r={5}
                              fill="#8be9fd"
                              stroke="#fff"
                            />
                          ))}
                        </>
                      ) : (
                        /* Process node */
                        <>
                          <circle
                            r={22}
                            fill={isDead ? "#ff416c" : "#3b82f6"}
                            stroke="#0b1220"
                            strokeWidth="2"
                          />
                          <text x={0} y={4} textAnchor="middle" fill="#041726" fontWeight={700}>
                            {n.id}
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* RIGHT PANEL */}
            <div style={{ width: 360 }}>
              <div style={{ padding: 12, background: "#0b1220", borderRadius: 8 }}>
                <h4 style={{ color: "#9aa6b2", marginTop: 0 }}>Backend Preview</h4>

                {backendPreview ? (
                  <img
                    src={`data:image/png;base64,${backendPreview}`}
                    alt="preview"
                    style={{ width: "100%", borderRadius: 8 }}
                  />
                ) : (
                  <div style={{ color: "#9aa6b2" }}>No backend preview yet. Click Re-generate.</div>
                )}

                <div style={{ marginTop: 12 }}>
                  <p><strong>Deadlock:</strong> {deadlock ? "Yes" : "No"}</p>
                  {deadlock && <p><strong>Cycle:</strong> {cycle.join(" → ")}</p>}
                </div>
              </div>

              <div style={{ marginTop: 12, padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <h4 style={{ margin: "6px 0" }}>Legend</h4>
                <p>● Process — blue</p>
                <p>■ Resource — green</p>
                <p>●● Resource Instances — cyan dots</p>
                <p>— Allocation (solid green)</p>
                <p>- - Request (dashed blue)</p>
                <p style={{ marginTop: 6, color: "#ff8aa0" }}><strong>Red = Deadlock</strong></p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
