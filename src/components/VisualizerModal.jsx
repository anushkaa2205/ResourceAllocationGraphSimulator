import React, { useRef, useState, useEffect } from "react";

// ---------- helper to download blob ----------
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- helper to convert SVG → PNG ----------
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

    img.onerror = reject;
    img.src = url;
  });
}

export default function VisualizerModal({
  open,
  onClose,
  graph,
  positions,
  cycle = [],
  backendVisualizationBase64,
  onRegenerate
}) {
  if (!open) return null;

  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const [animating, setAnimating] = useState(false);
  const [busy, setBusy] = useState(false);

  const deadNodes = new Set(cycle || []);
  const deadlock = cycle.length > 0;

  // ---------- colors ----------
  const PROCESS_COLOR = "#3b82f6";
  const RESOURCE_COLOR = "#10b981";
  const DEADLOCK_COLOR = "#ff416c";
  const REQUEST_EDGE = "#60a5fa";
  const ALLOC_EDGE = "#34d399";

  // ---------- build node list ----------
  const nodes = [
    ...graph.processes.map((id) => ({ id, ntype: "process" })),
    ...graph.resources.map((id) => ({ id, ntype: "resource" })),
  ];

  // ---------- edges ----------
  const edges = [
    ...graph.request_edges.map(([u, v]) => ({ from: u, to: v, etype: "request" })),
    ...graph.allocation_edges.map(([u, v]) => ({ from: u, to: v, etype: "alloc" })),
  ];

  // ---------- compute coords ----------
  const coords = {};
  if (Object.keys(positions).length > 0) {
    const xs = Object.values(positions).map((p) => p.x);
    const ys = Object.values(positions).map((p) => p.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);

    const W = Math.max(300, maxX - minX || 300);
    const H = Math.max(300, maxY - minY || 300);

    nodes.forEach((n) => {
      const p = positions[n.id];
      const x = ((p.x - minX) / W) * 900 + 60;
      const y = ((p.y - minY) / H) * 600 + 60;
      coords[n.id] = { x, y };
    });
  } else {
    nodes.forEach((n, i) => {
      coords[n.id] = { x: 150 + (i % 4) * 180, y: 150 + Math.floor(i / 4) * 200 };
    });
  }

  // ------------ DOWNLOAD PNG ------------
  const handleDownloadPNG = async () => {
    setBusy(true);
    try {
      if (backendVisualizationBase64) {
        const byte = atob(backendVisualizationBase64)
          .split("")
          .map((c) => c.charCodeAt(0));
        const blob = new Blob([Uint8Array.from(byte)], { type: "image/png" });
        downloadBlob(blob, "visualization.png");
      } else if (svgRef.current) {
        const blob = await svgToPngBlob(svgRef.current);
        downloadBlob(blob, "visualization.png");
      }
    } finally {
      setBusy(false);
    }
  };

  // ------------ DOWNLOAD PDF ------------
  const handleDownloadPDF = async () => {
    setBusy(true);
    try {
      const payload = {
        ...graph,
        format: "pdf",
      };

      const res = await fetch("http://127.0.0.1:5000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const blob = await res.blob();
      downloadBlob(blob, "visualization.pdf");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="visual-modal" onClick={onClose}>
      <div className="visual-content" onClick={(e) => e.stopPropagation()}>

        {/* ---------------- HEADER BAR ---------------- */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0, color: DEADLOCK_COLOR }}>
            {deadlock ? "DEADLOCK DETECTED" : "Visualization"}
          </h2>

          <div style={{ flex: 1 }} />

          <button onClick={() => onRegenerate()}>Re-generate</button>
          <button onClick={() => setAnimating(!animating)}>
            {animating ? "Stop Animation" : "Animate Deadlock"}
          </button>
          <button disabled={busy} onClick={handleDownloadPNG}>
            {busy ? "..." : "Export PNG"}
          </button>
          <button disabled={busy} onClick={handleDownloadPDF}>
            {busy ? "..." : "Export PDF"}
          </button>
          <button onClick={onClose}>Close</button>
        </div>

        <div style={{ display: "flex", gap: 15 }}>

          {/* ---------------- LEFT: INTERACTIVE SVG ---------------- */}
          <div
            style={{
              flex: 1,
              background: "#0f1722",
              borderRadius: 8,
              padding: 10,
              overflow: "hidden",
            }}
          >
            <svg
              ref={svgRef}
              width={960}
              height={640}
              viewBox="0 0 960 640"
              style={{ display: "block" }}
            >
              {/* edges */}
              {edges.map((e, i) => {
                const a = coords[e.from];
                const b = coords[e.to];
                const isDead = deadNodes.has(e.from) && deadNodes.has(e.to);

                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={isDead ? DEADLOCK_COLOR : e.etype === "request" ? REQUEST_EDGE : ALLOC_EDGE}
                    strokeWidth={isDead ? 4 : 2}
                    strokeDasharray={e.etype === "request" ? "6 6" : ""}
                    opacity={animating && isDead ? 0.7 : 1}
                  />
                );
              })}

              {/* nodes */}
              {nodes.map((n) => {
                const { x, y } = coords[n.id];
                const isDead = deadNodes.has(n.id);

                return (
                  <g
                    key={n.id}
                    transform={`translate(${x}, ${y})`}
                    className={animating && isDead ? "pulse" : ""}
                  >
                    {n.ntype === "resource" ? (
                      <rect
                        x={-22}
                        y={-22}
                        width={44}
                        height={44}
                        rx={6}
                        fill={isDead ? DEADLOCK_COLOR : RESOURCE_COLOR}
                        stroke="#0b1220"
                        strokeWidth="2"
                      />
                    ) : (
                      <circle
                        r={22}
                        fill={isDead ? DEADLOCK_COLOR : PROCESS_COLOR}
                        stroke="#0b1220"
                        strokeWidth="2"
                      />
                    )}
                    <text
                      x={0}
                      y={4}
                      textAnchor="middle"
                      style={{ fill: "#041726", fontWeight: 700 }}
                    >
                      {n.id}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ---------------- RIGHT: BACKEND PNG PREVIEW ---------------- */}
          <div
            style={{
              width: 350,
              background: "#0b1220",
              padding: 12,
              borderRadius: 8,
            }}
          >
            <h4 style={{ color: "#9aa6b2" }}>Backend Preview</h4>
            {backendVisualizationBase64 ? (
              <img
                src={`data:image/png;base64,${backendVisualizationBase64}`}
                alt="backend preview"
                style={{ width: "100%", borderRadius: 8 }}
              />
            ) : (
              <div style={{ color: "#9aa6b2", paddingTop: 12 }}>
                No backend image yet. Click Re-generate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
