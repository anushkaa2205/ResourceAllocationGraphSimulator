// src/components/VisualizerModal.jsx
import React, { useRef, useState, useEffect } from "react";

// helper to download blob
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// convert svg element to PNG blob (client-side)
async function svgToPngBlob(svgEl, width = 1200, height = 800) {
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  // ensure CORS-safe
  img.crossOrigin = "anonymous";
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // fill background dark
      ctx.fillStyle = "#0f1722";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, "image/png", 0.92);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export default function VisualizerModal({
  open,
  onClose,
  graph,
  positions,
  cycle = [],
  backendVisualizationBase64, // optional image returned by backend
  onRegenerate // optional callback to re-analyze
}) {
  const svgRef = useRef(null);
  const viewRef = useRef({ scale: 1, tx: 0, ty: 0 });
  const [animating, setAnimating] = useState(false);
  const [showBackendImage, setShowBackendImage] = useState(Boolean(backendVisualizationBase64));
  const [downloadBusy, setDownloadBusy] = useState(false);

  useEffect(() => {
    setShowBackendImage(Boolean(backendVisualizationBase64));
  }, [backendVisualizationBase64]);

  if (!open) return null;

  // derive layout coords from positions or fallback grid
  const nodes = (graph?.processes || []).map(id => ({ id, ntype: "process" }))
    .concat((graph?.resources || []).map(id => ({ id, ntype: "resource" })));
  const edges = [
    ...(graph?.request_edges || []).map(([u,v]) => ({ from:u, to:v, etype: "request" })),
    ...(graph?.allocation_edges || []).map(([u,v]) => ({ from:u, to:v, etype: "alloc" }))
  ];

  // compute normalized SVG coordinates
  // Use positions if present (positions have {x,y} in page coords); else compute grid
  const coords = {};
  if (positions && Object.keys(positions).length > 0) {
    // convert existing page pixel coords into a normalized viewport by centering and scaling
    const xs = Object.values(positions).map(p => p.x);
    const ys = Object.values(positions).map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const w = Math.max(300, maxX - minX || 300);
    const h = Math.max(300, maxY - minY || 300);
    nodes.forEach(n => {
      const p = positions[n.id] || { x: minX, y: minY };
      const nx = ((p.x - minX) / w) * 900 + 60; // padding
      const ny = ((p.y - minY) / h) * 600 + 60;
      coords[n.id] = { x: nx, y: ny };
    });
  } else {
    // grid fallback
    nodes.forEach((n, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      coords[n.id] = { x: 120 + col * 200, y: 120 + row * 180 };
    });
  }

  // colors (mirror backend)
  const PROCESS_COLOR = "#3b82f6";
  const RESOURCE_COLOR = "#10b981";
  const DEADLOCK_COLOR = "#ff416c";
  const REQUEST_EDGE = "#60a5fa";
  const ALLOC_EDGE = "#34d399";

  const deadNodes = new Set(cycle || []);
  const deadlock = (cycle || []).length > 0;

  // functions
  const handleResetZoom = () => {
    viewRef.current = { scale: 1, tx: 0, ty: 0 };
    if (svgRef.current) {
      svgRef.current.style.transform = `translate(0px,0px) scale(1)`;
    }
  };

  const handleDownloadPNG = async () => {
    setDownloadBusy(true);
    try {
      // If backend image exists, use it for download
      if (backendVisualizationBase64) {
        const byteCharacters = atob(backendVisualizationBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });
        downloadBlob(blob, "visualization.png");
      } else if (svgRef.current) {
        // convert SVG to PNG
        const svgEl = svgRef.current;
        const blob = await svgToPngBlob(svgEl, 1200, 900);
        downloadBlob(blob, "visualization.png");
      }
    } catch (e) {
      console.error(e);
      alert("Download failed: " + e);
    } finally {
      setDownloadBusy(false);
    }
  };

  const handleDownloadPDF = async () => {
    // call backend /export with format=pdf and same payload
    setDownloadBusy(true);
    try {
      const payload = {
        processes: graph.processes,
        resources: graph.resources,
        request_edges: graph.request_edges,
        allocation_edges: graph.allocation_edges,
        format: "pdf"
      };
      const res = await fetch("http://127.0.0.1:5000/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      downloadBlob(blob, "visualization.pdf");
    } catch (e) {
      console.error(e);
      alert("PDF export failed: " + e.message);
    } finally {
      setDownloadBusy(false);
    }
  };

  const handleAnimateToggle = () => {
    setAnimating(v => !v);
  };

  // simple pan/zoom handlers for the SVG container
  const containerRef = useRef(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isPanning = false, startX = 0, startY = 0;
    const onDown = (e) => {
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      el.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = e.clientX; startY = e.clientY;
      const v = viewRef.current;
      v.tx += dx; v.ty += dy;
      el.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.scale})`;
    };
    const onUp = () => {
      isPanning = false;
      el.style.cursor = "grab";
    };
    const onWheel = (ev) => {
      ev.preventDefault();
      const delta = ev.deltaY;
      const v = viewRef.current;
      const factor = delta > 0 ? 0.9 : 1.1;
      v.scale = Math.max(0.25, Math.min(4, v.scale * factor));
      el.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.scale})`;
    };
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.style.cursor = "grab";
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="visual-modal" onClick={onClose}>
      <div className="visual-content" onClick={(e) => e.stopPropagation()}>
        <div style={{display:"flex", gap:12, alignItems:"center", marginBottom:10}}>
          <h2 style={{margin:0, color:"#ff416c"}}>{deadlock ? "DEADLOCK DETECTED" : "Visualization"}</h2>
          <div style={{flex:1}}/>
          <button onClick={() => { if (onRegenerate) onRegenerate(); }}>Re-generate</button>
          <button onClick={handleAnimateToggle}>{animating ? "Stop Animation" : "Animate Deadlock"}</button>
          <button onClick={handleDownloadPNG} disabled={downloadBusy}>{downloadBusy ? "Preparing..." : "Export PNG"}</button>
          <button onClick={handleDownloadPDF} disabled={downloadBusy}>{downloadBusy ? "Preparing..." : "Export PDF"}</button>
          <button onClick={handleResetZoom}>Reset Zoom</button>
          <button onClick={onClose}>Close</button>
        </div>

        <div style={{display:"flex"}}>
          {/* Left: SVG interactive area */}
          <div style={{flex:1, background:"#0f1722", borderRadius:8, padding:10, minHeight:420, overflow:"hidden"}}>
            <div ref={containerRef} style={{transformOrigin:"0 0"}}>
              <svg
                ref={svgRef}
                width={960}
                height={640}
                viewBox={`0 0 960 640`}
                style={{display:"block", background:"#0f1722", borderRadius:8}}
              >
                {/* edges */}
                {edges.map((ed, i) => {
                  const a = coords[ed.from] || {x:0,y:0};
                  const b = coords[ed.to] || {x:0,y:0};
                  const isDead = deadlock && deadNodes.has(ed.from) && deadNodes.has(ed.to);
                  const stroke = isDead ? DEADLOCK_COLOR : (ed.etype === "request" ? REQUEST_EDGE : ALLOC_EDGE);
                  const strokeWidth = isDead ? 4.0 : 2.0;
                  const dash = ed.etype === "request" ? "6,6" : null;
                  return (
                    <g key={i}>
                      <line
                        x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dash}
                        strokeLinecap="round"
                        opacity={animating && isDead ? 0.9 : 0.95}
                      />
                    </g>
                  );
                })}

                {/* nodes */}
                {nodes.map((n, i) => {
                  const c = coords[n.id];
                  const isDead = deadlock && deadNodes.has(n.id);
                  const fill = isDead ? DEADLOCK_COLOR : (n.ntype === "process" ? PROCESS_COLOR : RESOURCE_COLOR);
                  const shapeSize = 34;
                  const circleR = 20;
                  const square = n.ntype === "resource";
                  return (
                    <g key={n.id} transform={`translate(${c.x},${c.y})`} className={isDead && animating ? "pulse" : ""}>
                      {square ? (
                        <rect x={-circleR} y={-circleR} width={circleR*2} height={circleR*2}
                              rx={6} ry={6} fill={fill} stroke="#0b1220" strokeWidth="2"/>
                      ) : (
                        <circle r={circleR} fill={fill} stroke="#0b1220" strokeWidth="2"/>
                      )}
                      <text x={0} y={4} textAnchor="middle" style={{fontSize:12, fill:"#041726", fontWeight:700}}>
                        {n.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right: optional backend PNG preview */}
          <div style={{width:360, marginLeft:12}}>
            <div style={{background:"#0b1220", padding:12, borderRadius:8, minHeight:420}}>
              <h4 style={{marginTop:0, color:"#9aa6b2"}}>Backend Preview</h4>
              {backendVisualizationBase64 ? (
                <img
                  src={`data:image/png;base64,${backendVisualizationBase64}`}
                  alt="backend preview"
                  style={{width:"100%", borderRadius:8, display:"block"}}
                />
              ) : (
                <div style={{color:"#9aa6b2"}}>No backend image yet. Click Re-generate (or Analyze) to get it.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
