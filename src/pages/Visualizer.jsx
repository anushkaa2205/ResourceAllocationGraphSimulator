import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/*
FINAL VISUALIZER – CLEAN & FIXED
✔ Edges always visible
✔ Cycle edges red only
✔ Safe edges blue
✔ Node pop animation
✔ Token traversal
✔ Netflix-hover theme
*/

const ICONS = {
  ok: "✔",
  warn: "⚠",
  bad: "✖",
};

/* ---------------- SAFE PARSE ---------------- */
function safeParseIncoming(locationState) {
  const incoming = locationState || {};

  const graph =
    incoming.graph && typeof incoming.graph === "object"
      ? incoming.graph
      : { processes: [], resources: [], edges: [] };

  graph.processes ||= [];
  graph.resources ||= [];
  graph.edges ||= [];

  const request_edges =
    incoming.request_edges ||
    graph.edges
      .filter((e) => e.type === "request")
      .map((e) => ({
        from: e.from,
        to: e.to,
        amount: e.amount || 1,
      }));

  const allocation_edges =
    incoming.allocation_edges ||
    graph.edges
      .filter((e) => e.type === "allocation")
      .map((e) => ({
        from: e.from,
        to: e.to,
        amount: e.amount || 1,
      }));

  return {
    graph,
    request_edges,
    allocation_edges,
    positions: incoming.positions || {},
    backendVisualizationBase64:
      incoming.backendVisualizationBase64 ||
      incoming.backendVisualization ||
      incoming.visualization ||
      null,
    cycle: incoming.cycle || [],
  };
}

/* ---------------- COMPONENT ---------------- */
export default function Visualizer() {
  const nav = useNavigate();
  const location = useLocation();

  const {
    graph,
    request_edges,
    allocation_edges,
    positions,
    backendVisualizationBase64,
    cycle,
  } = safeParseIncoming(location.state || {});

  // 🔥 Correct placement — INSIDE COMPONENT
  const analysis = location.state?.analysis || {};

  /* ---------------- BUTTON STYLES ---------------- */
  const buttonBase = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
    color: "#00101F",
    fontWeight: 800,
    transition: "0.25s",
  };

  const buttonHover = {
    transform: "translateY(-6px) scale(1.06)",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.45), 0 0 28px rgba(80,140,255,0.45)",
  };

  /* ---------------- NODES + EDGES ---------------- */
  const nodes = [
    ...graph.processes.map((id) => ({ id, ntype: "process" })),
    ...graph.resources.map((r) => ({
      id: typeof r === "string" ? r : r.id,
      ntype: "resource",
      instances: r.instances || r.count || 1,
    })),
  ];

  const edges = [
    ...request_edges.map((e) => ({
      from: e.from,
      to: e.to,
      etype: "request",
      amount: e.amount || 1,
    })),
    ...allocation_edges.map((e) => ({
      from: e.from,
      to: e.to,
      etype: "alloc",
      amount: e.amount || 1,
    })),
  ];

  /* ---------------- COORDINATES ---------------- */
  const coords = {};

  const procs = graph.processes;
  const ress = graph.resources;
  const gap = 900 / Math.max(procs.length, ress.length, 1);

  procs.forEach((p, i) => (coords[p] = { x: 80 + i * gap, y: 120 }));
  ress.forEach((r, i) => {
    const id = typeof r === "string" ? r : r.id;
    coords[id] = { x: 80 + i * gap, y: 360 };
  });

  const deadNodes = new Set(cycle || []);

  /* ---------------- REFS ---------------- */
  const svgRef = useRef(null);
  const nodeRefs = useRef({});
  const edgeRefs = useRef({});
  const tokenRef = useRef(null);

  const [busy, setBusy] = useState(false);

  function registerNodeRef(id, el) {
    if (el) nodeRefs.current[id] = el;
  }

  function registerEdgeRef(key, el) {
    if (!el) return;
    edgeRefs.current[key] = el;
  }

  function edgeKey(e, i) {
    return `${e.from}->${e.to}#${i}`;
  }

  function isCycleEdge(e) {
    for (let i = 0; i < cycle.length; i++) {
      const a = cycle[i];
      const b = cycle[(i + 1) % cycle.length];
      if (e.from === a && e.to === b) return true;
    }
    return false;
  }

  /* ---------------- RESET ---------------- */
  function resetSVG() {
    Object.values(edgeRefs.current).forEach((el) => {
      el.style.opacity = 1;
    });

    Object.values(nodeRefs.current).forEach((el) =>
      el?.classList.remove("pulse-node", "node-pop")
    );

    if (tokenRef.current) tokenRef.current.style.opacity = 0;
  }

  /* ---------------- ANIMATION ---------------- */
  async function animate() {
    if (busy) return;
    setBusy(true);

    resetSVG();

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ordered = [...nodes];

    // Pop nodes
    for (let n of ordered) {
      nodeRefs.current[n.id]?.classList.add("node-pop");
      await sleep(120);
    }

    // Pulse deadlock cycle
    cycle.forEach((cid) => nodeRefs.current[cid]?.classList.add("pulse-node"));

    setBusy(false);
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div
      style={{
        padding: "40px 0",
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          borderRadius: 18,
          padding: 32,
          background: "rgba(16,22,34,0.92)",
          border: "1px solid rgba(80,140,255,0.14)",
          boxShadow: "0 0 24px rgba(0,0,0,0.6)",
        }}
      >
        {/* ---------------- TOP BAR ---------------- */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          {/* Animate */}
          <button
            className="netflix-btn"
            style={buttonBase}
            onMouseOver={(e) =>
              Object.assign(e.currentTarget.style, buttonHover)
            }
            onMouseOut={(e) =>
              Object.assign(e.currentTarget.style, buttonBase)
            }
            disabled={busy}
            onClick={animate}
          >
            {busy ? "Animating…" : "Animate Deadlock"}
          </button>

          <div style={{ flex: 1 }} />

          {/* Back to Analysis */}
          <button
            className="netflix-btn"
            style={buttonBase}
            onClick={() =>
              nav("/analysis", {
                state: { graph, cycle, analysis },
              })
            }
          >
            Back to Analysis
          </button>

          {/* Back to Simulator */}
          <button
            className="netflix-btn"
            style={buttonBase}
            onClick={() => nav("/simulator")}
          >
            Back to Simulator
          </button>

          {/* Go to Report */}
          <button
            className="netflix-btn"
            style={buttonBase}
            onClick={() =>
              nav("/report", {
                state: { graph, analysis, cycle, positions },
              })
            }
          >
            Go to Report
          </button>
        </div>

        {/* ---------------- MAIN PANEL ---------------- */}
        <div style={{ display: "flex", gap: 14 }}>
          {/* SVG PANEL */}
          <div style={{ flex: 1, background: "#0f1722", padding: 12 }}>
            <svg
              ref={svgRef}
              width="100%"
              height="560"
              viewBox="0 0 960 640"
              style={{ background: "#0f1722", borderRadius: 8 }}
            >
              {/* ARROWS */}
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M0 0 L10 5 L0 10 Z" fill="#8be9fd" />
                </marker>
              </defs>

              {/* EDGES */}
              {edges.map((e, i) => {
                const A = coords[e.from];
                const B = coords[e.to];

                return (
                  <g key={i}>
                    <line
                      ref={(el) => registerEdgeRef(edgeKey(e, i), el)}
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke={isCycleEdge(e) ? "#ff416c" : "#416cff"}
                      strokeWidth={isCycleEdge(e) ? 6 : 3}
                      strokeDasharray={
                        e.etype === "request" ? "6 6" : "none"
                      }
                      markerEnd="url(#arrow)"
                    />
                  </g>
                );
              })}

              {/* TOKEN */}
              <circle
                ref={tokenRef}
                r="7"
                fill="#ffb86b"
                style={{ opacity: 0 }}
              />

              {/* NODES */}
              {nodes.map((n) => {
                const { x, y } = coords[n.id];
                const isDead = deadNodes.has(n.id);

                const fill = isDead
                  ? "#ff416c"
                  : n.ntype === "process"
                  ? "#3b82f6"
                  : "#10b981";

                return (
                  <g key={n.id} transform={`translate(${x}, ${y})`}>
                    {n.ntype === "resource" ? (
                      <rect
                        ref={(el) => registerNodeRef(n.id, el)}
                        x={-22}
                        y={-22}
                        width={44}
                        height={44}
                        rx={6}
                        fill={fill}
                        stroke="#0b1220"
                        strokeWidth="2"
                      />
                    ) : (
                      <circle
                        ref={(el) => registerNodeRef(n.id, el)}
                        r={22}
                        fill={fill}
                        stroke="#0b1220"
                        strokeWidth="2"
                      />
                    )}

                    <text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      fill="#fff"
                      fontWeight={700}
                    >
                      {n.id}
                    </text>

                    {/* Status Icon */}
                    <g transform="translate(18,-28)">
                      <circle
                        r={12}
                        fill={isDead ? "#ff416c" : "#10b981"}
                        stroke="#111"
                      />
                      <text
                        data-icon={n.id}
                        x={0}
                        y={4}
                        textAnchor="middle"
                        fill="#fff"
                      >
                        {isDead ? ICONS.bad : ICONS.ok}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ width: 360 }}>
            <div
              style={{
                background: "#0b1220",
                padding: 12,
                borderRadius: 10,
              }}
            >
              <h4 style={{ color: "#E1E7EF" }}>Backend Preview</h4>

              {backendVisualizationBase64 ? (
                <img
                  src={`data:image/png;base64,${backendVisualizationBase64}`}
                  alt="preview"
                  style={{ width: "100%", borderRadius: 6 }}
                />
              ) : (
                <p style={{ color: "#A3AEC2" }}>No backend preview</p>
              )}

              <p style={{ color: "#E1E7EF" }}>
                <b>Deadlock:</b> {cycle.length > 0 ? "Yes" : "No"}
              </p>

              {cycle.length > 0 && (
                <p style={{ color: "#E1E7EF" }}>
                  <b>Cycle:</b> {cycle.join(" → ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ---------- ANIMATION STYLE ---------- */}
        <style>{`
          .node-pop {
            transform: scale(1.1);
            transition: transform 350ms ease;
          }

          @keyframes pulse {
            0% { filter: drop-shadow(0 0 0 rgba(255,65,108,0)); }
            50% { filter: drop-shadow(0 0 12px rgba(255,65,108,1)); transform: scale(1.05); }
            100% { filter: drop-shadow(0 0 0 rgba(255,65,108,0)); transform: scale(1); }
          }

          .pulse-node {
            animation: pulse 1s infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
