import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
gsap.registerPlugin(MotionPathPlugin);

/* ---------------- THEME ---------------- */
const theme = {
  bg: "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",
  cardBg: "rgba(16,22,34,0.92)",
  border: "1px solid rgba(80,140,255,0.14)",
  nodeProcess: "#3b82f6",
  nodeResource: "#10b981",
  nodeDead: "#ff416c",
  edgeSafe: "#416cff",
  edgeCycle: "#ff416c",
  text: "#E1E7EF",
  muted: "#A3AEC2",
  accent: "#5CAEFF",
  accent2: "#78A7FF",
  buttonText: "#00101F",
  buttonBg: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
  shadow: "0 0 24px rgba(0,0,0,0.6)",
};

/* ---------------- ICONS ---------------- */
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

  const analysis = location.state?.analysis || {};

  // Detect deadlock
  const isDeadlock = cycle.length > 0;

  // Enhanced theme for deadlock
  const deadlockTheme = {
    ...theme,
    bg: isDeadlock
      ? "radial-gradient(circle at 50% 0%, #6a040f 0%, #370617 60%, #03010a 100%)"
      : theme.bg,
    cardBg: isDeadlock ? "rgba(90,10,30,0.92)" : theme.cardBg,
    border: isDeadlock ? "1px solid #ff416c" : theme.border,
    accent: isDeadlock ? "#ff416c" : theme.accent,
    accent2: isDeadlock ? "#ff6a6a" : theme.accent2,
    shadow: isDeadlock ? "0 0 32px #ff416c88" : theme.shadow,
  };

  /* ---------------- BUTTON STYLES ---------------- */
  const buttonBase = {
    padding: "10px 16px",
    borderRadius: 12,
    border: "none",
    cursor: "pointer",
    background: theme.buttonBg,
    color: theme.buttonText,
    fontWeight: 800,
    transition: "0.25s",
    boxShadow: "0 4px 16px rgba(80,140,255,0.15)",
    outline: "none",
  };

  const buttonHover = {
    transform: "translateY(-6px) scale(1.06)",
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.45), 0 0 28px rgba(80,140,255,0.45)",
    filter: "brightness(1.1)",
  };

  /* ---------- ADD NETFLIX-HOVER (once) ---------- */
  if (!document.getElementById("visualizer-netflix-hover")) {
    const style = document.createElement("style");
    style.id = "visualizer-netflix-hover";
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
                    0 0 22px rgba(80,140,255,0.45);
        filter: brightness(1.15);
      }
      .netflix-btn:disabled {
        opacity: 0.5;
        transform: none !important;
        box-shadow: none !important;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

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
const [hoveredNode, setHoveredNode] = useState(null);
const [hoveredEdge, setHoveredEdge] = useState(null);

/* ---------------- HELPER FUNCTIONS (must be ABOVE JSX) ---------------- */

function registerNodeRef(id, el) {
  if (el) nodeRefs.current[id] = el;
}

function registerEdgeRef(key, el) {
  if (el) edgeRefs.current[key] = el;
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

/* ---------------- AUTHOR UI ANIMATIONS (run ONLY on page load) ---------------- */
useEffect(() => {
  gsap.from(svgRef.current, {
    opacity: 0,
    y: -20,
    duration: 0.8,
    ease: "power3.out",
  });

  gsap.from(".right-panel", {
    x: 40,
    opacity: 0,
    duration: 0.9,
    ease: "power3.out",
  });

  gsap.from(".netflix-btn", {
    opacity: 0,
    scale: 0.9,
    stagger: 0.05,
    duration: 0.5,
    ease: "back.out(2)",
  });
}, []);

/* ---------------- GSAP EDGE DRAW (only on graph render) ---------------- */
useEffect(() => {
  const lines = Object.values(edgeRefs.current);
  if (!lines.length) return;

  lines.forEach((line) => {
    try {
      const len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len;
    } catch {}
  });

  gsap.to(lines, {
    strokeDashoffset: 0,
    duration: 1.2,
    stagger: 0.03,
    ease: "power2.out",
  });
}, [edges.length]);

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
  // Animate full deadlock cycle as a "video"
  async function animate() {
  if (busy) return;
  setBusy(true);
  resetSVG();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const orderedNodes = [...nodes];

  // Pop nodes one by one
  for (let n of orderedNodes) {
    nodeRefs.current[n.id]?.classList.add("node-pop");
    await sleep(180);
  }

  // Animate token moving along deadlock cycle edges
  for (let i = 0; i < cycle.length; i++) {
    const from = cycle[i];
    const to = cycle[(i + 1) % cycle.length];
    const A = coords[from];
    const B = coords[to];

    // Show token at start
    if (tokenRef.current) {
      tokenRef.current.style.opacity = 1;
      tokenRef.current.setAttribute("cx", A.x);
      tokenRef.current.setAttribute("cy", A.y);
    }

    // Move token
    for (let t = 0; t <= 1; t += 0.02) {
      const x = A.x + (B.x - A.x) * t;
      const y = A.y + (B.y - A.y) * t;
      tokenRef.current?.setAttribute("cx", x);
      tokenRef.current?.setAttribute("cy", y);
      await sleep(30);
    }

    // Pulse node at arrival
    nodeRefs.current[to]?.classList.add("pulse-node");
    await sleep(300);
  }

  // Hide token
  tokenRef.current.style.opacity = 0;
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
            {/* Animation Explanation */}
            <div style={{
              color: "#E1E7EF",
              marginBottom: 16,
              fontSize: 17,
              background: "rgba(90,140,255,0.08)",
              borderRadius: 8,
              padding: "12px 18px",
              border: "1px solid #416cff22"
            }}>
              <b>Animation Steps:</b>
              <ol style={{ margin: "8px 0 0 18px", padding: 0 }}>
                <li>
                  <span style={{ color: "#5CAEFF" }}>Nodes pop in</span> one by one to show all processes and resources.
                </li>
                <li>
                  <span style={{ color: "#ffb86b" }}>A glowing token</span> travels along the edges of the detected deadlock cycle.
                </li>
                <li>
                  <span style={{ color: "#ff416c" }}>Nodes pulse</span> as the token arrives, highlighting the deadlock path.
                </li>
                <li>
                  <span style={{ color: "#ff416c" }}>Red edges</span> indicate the cycle causing the deadlock.
                </li>
              </ol>
              <div style={{ marginTop: 8, color: "#A3AEC2", fontSize: 15 }}>
                This animation visually demonstrates how processes and resources interact, and how a deadlock forms in the system.
              </div>
            </div>
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
                const isHovered = hoveredEdge === edgeKey(e, i);
                return (
                  <g key={i}>
                    <line
                      ref={(el) => registerEdgeRef(edgeKey(e, i), el)}
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke={
                        isCycleEdge(e)
                          ? theme.edgeCycle
                          : theme.edgeSafe
                      }
                      strokeWidth={isCycleEdge(e) ? 6 : isHovered ? 6 : 3}
                      strokeDasharray={
                        e.etype === "request" ? "6 6" : "none"
                      }
                      markerEnd="url(#arrow)"
                      style={{
                        transition: "stroke-width 0.2s, stroke 0.2s",
                        opacity: isHovered ? 0.85 : 1,
                        cursor: "pointer",
                      }}
                      onMouseOver={() => setHoveredEdge(edgeKey(e, i))}
                      onMouseOut={() => setHoveredEdge(null)}
                    />
                  </g>
                );
              })}
              {/* TOKEN */}
              <circle
                ref={tokenRef}
                r="18" // Larger token for visibility
                fill="#ffb86b"
                stroke="#ff416c"
                strokeWidth="4"
                style={{
                  opacity: 0,
                  transition: "opacity 0.3s",
                  filter: "drop-shadow(0 0 32px #ffb86b88)",
                }}
              />
              {/* NODES */}
              {nodes.map((n) => {
                const { x, y } = coords[n.id];
                const isDead = deadNodes.has(n.id);
                const isHovered = hoveredNode === n.id;
                const fill = isDead
                  ? theme.nodeDead
                  : n.ntype === "process"
                  ? theme.nodeProcess
                  : theme.nodeResource;
                return (
                  <g
                    key={n.id}
                    transform={`translate(${x}, ${y})`}
                    style={{
                      cursor: "pointer",
                      filter: isHovered
                        ? "drop-shadow(0 0 12px #5CAEFF)"
                        : "none",
                      transition: "filter 0.2s",
                    }}
                    onMouseOver={() => setHoveredNode(n.id)}
                    onMouseOut={() => setHoveredNode(null)}
                  >
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
                        style={{
                          transition: "fill 0.2s, box-shadow 0.2s",
                          boxShadow: isHovered
                            ? "0 0 18px #5CAEFF88"
                            : "none",
                        }}
                      />
                    ) : (
                      <circle
                        ref={(el) => registerNodeRef(n.id, el)}
                        r={22}
                        fill={fill}
                        stroke="#0b1220"
                        strokeWidth="2"
                        style={{
                          transition: "fill 0.2s, box-shadow 0.2s",
                          boxShadow: isHovered
                            ? "0 0 18px #5CAEFF88"
                            : "none",
                        }}
                      />
                    )}
                    <text
                      x={0}
                      y={5}
                      textAnchor="middle"
                      fill="#fff"
                      fontWeight={700}
                      style={{
                        fontSize: isHovered ? 22 : 18,
                        transition: "font-size 0.2s",
                      }}
                    >
                      {n.id}
                    </text>
                    {/* Status Icon */}
                    <g transform="translate(18,-28)">
                      <circle
                        r={12}
                        fill={isDead ? theme.nodeDead : theme.nodeResource}
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
<div className="right-panel" style={{ width: 360 }}>
            <div
              style={{
                background: isDeadlock ? "#6a040f" : "#0b1220",
                padding: 12,
                borderRadius: 10,
                transition: "background 0.5s",
              }}
            >
              <h4 style={{ color: deadlockTheme.text }}>Backend Preview</h4>
              {backendVisualizationBase64 ? (
                <img
                  src={`data:image/png;base64,${backendVisualizationBase64}`}
                  alt="preview"
                  style={{ width: "100%", borderRadius: 6 }}
                />
              ) : (
                <p style={{ color: theme.muted }}>No backend preview</p>
              )}
              <p style={{ color: isDeadlock ? "#ff416c" : deadlockTheme.text }}>
                <b>Deadlock:</b> {isDeadlock ? "Yes" : "No"}
              </p>
              {isDeadlock && (
                <p style={{ color: "#ff416c" }}>
                  <b>Cycle:</b> {cycle.join(" → ")}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* ---------- ANIMATION STYLE ---------- */}
        <style>{`
          .node-pop {
            transform: scale(1.15);
            transition: transform 350ms cubic-bezier(.68,-0.55,.27,1.55);
            filter: drop-shadow(0 0 12px #5CAEFF);
          }
          @keyframes pulse {
            0% { filter: drop-shadow(0 0 0 rgba(255,65,108,0)); }
            50% { filter: drop-shadow(0 0 18px rgba(255,65,108,1)); transform: scale(1.08); }
            100% { filter: drop-shadow(0 0 0 rgba(255,65,108,0)); transform: scale(1); }
          }
          .pulse-node {
            animation: pulse 1.2s infinite;
          }
        .netflix-btn {
  filter: brightness(1);
  opacity: 1 !important;
}

}

        `}</style>
      </div>
    </div>
  );
}
