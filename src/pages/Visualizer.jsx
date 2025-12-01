import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/*
FINAL VISUALIZER – CLEAN & FIXED
✔ Edges always visible
✔ Cycle edges red only (not all)
✔ Safe edges blue
✔ Node pop animation
✔ Edge glow animation
✔ Token traversal
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
    graph.request_edges ||
    graph.edges
      .filter((e) => e.type === "request")
      .map((e) => ({
        from: e.from,
        to: e.to,
        amount: e.amount || 1,
      }));

  const allocation_edges =
    incoming.allocation_edges ||
    graph.allocation_edges ||
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

  if (Object.keys(positions || {}).length > 0) {
    const xs = Object.values(positions).map((p) => p.x || 0);
    const ys = Object.values(positions).map((p) => p.y || 0);
    const minX = Math.min(...xs, 0),
      maxX = Math.max(...xs, 900);
    const minY = Math.min(...ys, 0),
      maxY = Math.max(...ys, 600);
    const W = Math.max(600, maxX - minX);
    const H = Math.max(400, maxY - minY);

    nodes.forEach((n, i) => {
      const p = positions[n.id] || { x: i * 80, y: i * 40 };
      coords[n.id] = {
        x: ((p.x - minX) / W) * 900 + 40,
        y: ((p.y - minY) / H) * 520 + 40,
      };
    });
  } else {
    const procs = graph.processes;
    const ress = graph.resources;
    const gap = 900 / Math.max(procs.length, ress.length, 1);

    procs.forEach((p, i) => (coords[p] = { x: 80 + i * gap, y: 120 }));
    ress.forEach((r, i) => {
      const id = typeof r === "string" ? r : r.id;
      coords[id] = { x: 80 + i * gap, y: 360 };
    });
  }

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

    // ensure visible
    el.style.strokeDasharray = "none";
    el.style.strokeDashoffset = "0";
    el.style.opacity = "1";
  }

  function edgeKey(e, i) {
    return `${e.from}->${e.to}#${i}`;
  }

  /* ---------------- CYCLE CHECK ---------------- */
  function isCycleEdge(e) {
    if (!Array.isArray(cycle) || cycle.length < 2) return false;
    for (let i = 0; i < cycle.length; i++) {
      const a = cycle[i];
      const b = cycle[(i + 1) % cycle.length];
      if (e.from === a && e.to === b) return true;
    }
    return false;
  }

  /* ---------------- RESET SVG ---------------- */
  function resetSVG() {
    Object.values(edgeRefs.current).forEach((el) => {
      el.style.strokeDasharray = "none";
      el.style.strokeDashoffset = "0";
      el.style.opacity = 1;
    });

    Object.values(nodeRefs.current).forEach((el) =>
      el?.classList.remove("pulse-node", "node-pop")
    );

    document.querySelectorAll(".viz-icon").forEach((ic) =>
      ic.classList.remove("icon-pop")
    );

    if (tokenRef.current) tokenRef.current.style.opacity = 0;
  }

  /* ---------------- TOKEN ANIMATION ---------------- */
  function animateToken(path) {
    return new Promise((resolve) => {
      const token = tokenRef.current;
      if (!token) return resolve();

      const segs = [];

      for (let i = 0; i < path.length; i++) {
        const a = coords[path[i]];
        const b = coords[path[(i + 1) % path.length]];
        if (!a || !b) continue;

        segs.push({
          from: a,
          to: b,
          dx: b.x - a.x,
          dy: b.y - a.y,
          len: Math.hypot(b.x - a.x, b.y - a.y),
        });
      }

      if (!segs.length) return resolve();

      token.style.opacity = 1;

      const total = segs.reduce((s, x) => s + x.len, 0);
      const dur = Math.max(1500, Math.min(4500, total * 2));

      const start = performance.now();

      function step(now) {
        const t = Math.min(1, (now - start) / dur);
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const dist = ease * total;

        let acc = 0,
          segIndex = 0;

        while (segIndex < segs.length && acc + segs[segIndex].len < dist) {
          acc += segs[segIndex].len;
          segIndex++;
        }

        const seg = segs[segIndex];
        if (!seg) return resolve();

        const d = dist - acc;
        const r = d / seg.len;

        token.setAttribute("cx", seg.from.x + seg.dx * r);
        token.setAttribute("cy", seg.from.y + seg.dy * r);

        if (t < 1) requestAnimationFrame(step);
        else {
          token.style.opacity = 0;
          setTimeout(resolve, 200);
        }
      }

      requestAnimationFrame(step);
    });
  }

  /* ---------------- MAIN ANIMATION ---------------- */
  async function animate() {
    if (busy) return;
    setBusy(true);

    resetSVG();

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ordered = [...nodes].sort(
      (a, b) => coords[a.id].y - coords[b.id].y || coords[a.id].x - coords[b.id].x
    );

    for (let n of ordered) {
      nodeRefs.current[n.id]?.classList.add("node-pop");
      await sleep(120);
    }

    for (let n of ordered) {
      const ic = document.querySelector(`[data-icon='${n.id}']`);
      ic?.classList.add("icon-pop");
      await sleep(80);
    }

    cycle.forEach((cid) => nodeRefs.current[cid]?.classList.add("pulse-node"));

    if (cycle.length >= 2) await animateToken(cycle);

    await sleep(200);

    cycle.forEach((cid) =>
      nodeRefs.current[cid]?.classList.remove("pulse-node")
    );

    setBusy(false);
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div style={{ padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Visualizer</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button className="btn" disabled={busy} onClick={animate}>
          {busy ? "Animating…" : "Animate Deadlock"}
        </button>

        <div style={{ flex: 1 }} />

        <button
          className="btn"
          onClick={() =>
            nav("/analysis", { state: { graph, cycle, analysis: location.state?.analysis } })
          }
        >
          Back to Analysis
        </button>

        <button className="btn" onClick={() => nav("/simulator")}>
          Back to Simulator
        </button>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
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
              const midX = (A.x + B.x) / 2;
              const midY = (A.y + B.y) / 2;

              const red = isCycleEdge(e);

              const edgeColor = red ? "#ff416c" : "#416cff";

              return (
                <g key={i}>
                 <line
  ref={(el) => registerEdgeRef(edgeKey(e, i), el)}
  x1={A.x}
  y1={A.y}
  x2={B.x}
  y2={B.y}
  stroke={isCycleEdge(e) ? "#ff416c" : "#416cff"}   // << works 100%
  strokeWidth={isCycleEdge(e) ? 6 : 3}
  strokeDasharray={e.etype === "request" ? "6 6" : "none"}
  strokeLinecap="round"
  markerEnd="url(#arrow)"
  style={{
    transition: "stroke 0.2s, stroke-width 0.2s",
    filter: isCycleEdge(e)
      ? "drop-shadow(0 0 12px #ff416c)"
      : "drop-shadow(0 0 8px #416cff)",
  }}
/>

                  {e.amount > 1 && (
                    <text
                      x={midX}
                      y={midY - 5}
                      fill="#fff"
                      textAnchor="middle"
                      fontSize={10}
                    >
                      {e.amount}
                    </text>
                  )}
                </g>
              );
            })}

            {/* TOKEN */}
            <circle ref={tokenRef} r="7" fill="#ffb86b" style={{ opacity: 0 }} />

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
                      className="viz-node"
                    />
                  ) : (
                    <circle
                      ref={(el) => registerNodeRef(n.id, el)}
                      r={22}
                      fill={fill}
                      stroke="#0b1220"
                      strokeWidth="2"
                      className="viz-node"
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
          <div style={{ background: "#0b1220", padding: 12, borderRadius: 10 }}>
            <h4>Backend Preview</h4>

            {backendVisualizationBase64 ? (
              <img
                src={`data:image/png;base64,${backendVisualizationBase64}`}
                alt="preview"
                style={{ width: "100%", borderRadius: 6 }}
              />
            ) : (
              <p>No backend preview</p>
            )}

            <p>
              <b>Deadlock:</b> {cycle.length > 0 ? "Yes" : "No"}
            </p>

            {cycle.length > 0 && (
              <p>
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

        .icon-pop {
          transform: scale(1.3);
          transition: transform 300ms ease;
        }
      `}</style>
    </div>
  );
}
