import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { sendGraphToBackend } from "../utils/sendGraphToBackend";

/* ---------- helpers ---------- */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

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

      // background
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

/* ---------- Visualizer page ---------- */
export default function Visualizer() {
  const nav = useNavigate();
  const location = useLocation();

  // Expecting state: { graph, cycle, positions, backendVisualizationBase64 }
  const incoming = location.state || {};
const graph = incoming.graph || {};
graph.processes ||= [];
graph.resources ||= [];
graph.request_edges ||= [];
graph.allocation_edges ||= [];
  const cycle = incoming.cycle || []; // array of node ids in cycle
  const positions = incoming.positions || {};

  const [backendPreview, setBackendPreview] = useState(incoming.backendVisualizationBase64 || null);
  const [animating, setAnimating] = useState(false);
  const [busy, setBusy] = useState(false);
  const svgRef = useRef(null);

  // Build nodes and edges list for drawing
  const nodes = [
    ...graph.processes.map((id) => ({ id, ntype: "process" })),
    ...graph.resources.map((id) => ({ id, ntype: "resource" }))
  ];

  const edges = [
    ...graph.request_edges.map(([u, v]) => ({ from: u, to: v, etype: "request" })),
    ...graph.allocation_edges.map(([u, v]) => ({ from: u, to: v, etype: "alloc" }))
  ];

  // compute coords (fallback grid if no positions)
  const coords = {};
  if (Object.keys(positions).length > 0) {
    // normalize to canvas space
    const xs = Object.values(positions).map(p => p.x);
    const ys = Object.values(positions).map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
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

  const deadNodes = new Set(cycle);
  const deadlock = cycle.length > 0;

  useEffect(() => {
    setBackendPreview(incoming.backendVisualizationBase64 || null);
  }, [incoming.backendVisualizationBase64]);

  /* ---------- actions ---------- */
  const handleDownloadPNG = async () => {
    setBusy(true);
    try {
      if (backendPreview) {
        // backend gives base64 PNG
        const byteChars = atob(backendPreview);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        downloadBlob(blob, "visualization.png");
      } else if (svgRef.current) {
        const blob = await svgToPngBlob(svgRef.current, 1200, 800);
        downloadBlob(blob, "visualization.png");
      }
    } catch (err) {
      console.error(err);
      alert("Export failed: " + String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadPDF = async () => {
    setBusy(true);
    try {
      // call backend export endpoint
      const payload = {
        ...graph,
        format: "pdf"
      };

      const res = await fetch("http://127.0.0.1:5000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      downloadBlob(blob, "visualization.pdf");
    } catch (err) {
      console.error(err);
      alert("PDF export failed: " + String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerate = async () => {
    setBusy(true);
    try {
      const payload = {
        processes: graph.processes,
        resources: graph.resources,
        request_edges: graph.request_edges,
        allocation_edges: graph.allocation_edges
      };

      const result = await sendGraphToBackend(payload);
      if (result && result.visualization) {
        setBackendPreview(result.visualization);
        alert(result.deadlock ? "Deadlock found" : "Safe state");
      } else {
        alert("No backend visualization returned");
      }
    } catch (err) {
      console.error(err);
      alert("Regenerate failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 10 }}>Visualizer</h1>

      {!graph || (graph.processes.length === 0 && graph.resources.length === 0) ? (
        <div style={{ padding: 24, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
          <h3>No graph supplied</h3>
          <p>Open the Simulator and analyze a graph to view the visualization here.</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => nav("/simulator")}>Go to Simulator</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
            <button onClick={() => setAnimating(a => !a)}>{animating ? "Stop Animation" : "Animate Deadlock"}</button>
            <button onClick={handleDownloadPNG} disabled={busy}>{busy ? "..." : "Export PNG"}</button>
            <button onClick={handleDownloadPDF} disabled={busy}>{busy ? "..." : "Export PDF"}</button>
            <button onClick={handleRegenerate} disabled={busy}>{busy ? "..." : "Re-generate (Backend)"}</button>
            <div style={{ flex: 1 }} />
            <button onClick={() => nav("/analysis", { state: { analysis: incoming.analysis || null, graph, cycle } })}>Back to Analysis</button>
            <button onClick={() => nav("/simulator")}>Back to Simulator</button>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            {/* SVG canvas */}
            <div style={{ flex: 1, background: "#0f1722", padding: 12, borderRadius: 10 }}>
              <svg
                ref={svgRef}
                width="100%"
                height="560"
                viewBox="0 0 960 640"
                style={{ display: "block", background: "#0f1722", borderRadius: 8 }}
              >
                {/* edges */}
                {edges.map((e, i) => {
                  const a = coords[e.from] || { x: 60, y: 60 };
                  const b = coords[e.to] || { x: 240, y: 60 };
                  const isDead = deadNodes.has(e.from) && deadNodes.has(e.to);

                  return (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={isDead ? "#ff416c" : (e.etype === "request" ? "#60a5fa" : "#34d399")}
                      strokeWidth={isDead ? 4 : 2}
                      strokeDasharray={e.etype === "request" ? "6 6" : ""}
                      opacity={animating && isDead ? 0.8 : 1}
                      style={{ transition: "all 200ms ease" }}
                    />
                  );
                })}

                {/* nodes */}
                {nodes.map((n) => {
                  const { x, y } = coords[n.id] || { x: 50, y: 50 };
                  const isDead = deadNodes.has(n.id);
                  return (
                    <g key={n.id} transform={`translate(${x}, ${y})`} className={animating && isDead ? "pulse" : ""}>
                      {n.ntype === "resource" ? (
                        <rect x={-22} y={-22} width={44} height={44} rx={6}
                          fill={isDead ? "#ff416c" : "#10b981"} stroke="#0b1220" strokeWidth="2" />
                      ) : (
                        <circle r={22} fill={isDead ? "#ff416c" : "#3b82f6"} stroke="#0b1220" strokeWidth="2" />
                      )}
                      <text x={0} y={4} textAnchor="middle" style={{ fill: "#041726", fontWeight: 700 }}>{n.id}</text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Right panel: backend preview + info */}
            <div style={{ width: 360 }}>
              <div style={{ padding: 12, background: "#0b1220", borderRadius: 8 }}>
                <h4 style={{ color: "#9aa6b2", marginTop: 0 }}>Backend Preview</h4>
                {backendPreview ? (
                  <img src={`data:image/png;base64,${backendPreview}`} alt="preview" style={{ width: "100%", borderRadius: 8 }} />
                ) : (
                  <div style={{ color: "#9aa6b2" }}>No backend preview. Click Re-generate.</div>
                )}

                <div style={{ marginTop: 12 }}>
                  <p><strong>Deadlock:</strong> {deadlock ? "Yes" : "No"}</p>
                  {deadlock && <p><strong>Cycle:</strong> {cycle.join(" → ")}</p>}
                </div>
              </div>

              <div style={{ marginTop: 12, padding: 10, background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
                <h4 style={{ margin: "6px 0" }}>Legend</h4>
                <p style={{ margin: 0 }}>● Process — blue circle</p>
                <p style={{ margin: 0 }}>■ Resource — green square</p>
                <p style={{ margin: 0 }}>— Allocation — solid</p>
                <p style={{ margin: 0 }}>— Request — dashed</p>
                <p style={{ marginTop: 8, color: "#ff8aa0" }}><strong>Red</strong> = Deadlock nodes/edges</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
