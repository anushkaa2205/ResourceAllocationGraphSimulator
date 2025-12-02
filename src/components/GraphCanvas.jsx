// src/components/GraphCanvas.jsx
import React, { useRef } from "react";

export default function GraphCanvas({
  graph = {},
  cycles = [],
  positions = {},
  onPositionChange,
}) {
  const { processes = [], resources = [], edges = [] } = graph;
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  /* ---------------- NODE POSITIONS ---------------- */
  const nodePositions = {};
  const spacing = 220;
  const startX = 160;
  const topY = 120;
  const bottomY = 350;

  processes.forEach((p, i) => {
    nodePositions[p] = positions[p] || { x: startX + i * spacing, y: topY };
  });

  resources.forEach((r, i) => {
    nodePositions[r.id] =
      positions[r.id] || { x: startX + i * spacing, y: bottomY, instances: r.instances };
  });

  /* ---------------- DEADLOCK HIGHLIGHTS ---------------- */
  const highlightedNodes = new Set();
  const highlightedEdges = new Set();

  (cycles || []).forEach((cycle) => {
    for (let i = 0; i < cycle.length - 1; i++) {
      highlightedNodes.add(cycle[i]);
      highlightedNodes.add(cycle[i + 1]);
      highlightedEdges.add(`${cycle[i]}->${cycle[i + 1]}`);
    }
  });

  /* ---------------- SVG HEIGHT ---------------- */
  const maxY = Math.max(...Object.values(nodePositions).map((p) => p.y)) + 300;

  /* ---------------- POINTER → SVG COORD ---------------- */
  function pointerToSvg(e) {
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  /* ---------------- DRAGGING ---------------- */
  function handlePointerDown(ev, id) {
    ev.preventDefault();
    const start = pointerToSvg(ev);
    const pos = nodePositions[id];

    dragRef.current = {
      id,
      offsetX: start.x - pos.x,
      offsetY: start.y - pos.y,
    };

    function onMove(e) {
      if (!dragRef.current) return;
      const loc = pointerToSvg(e);
      const x = loc.x - dragRef.current.offsetX;
      const y = loc.y - dragRef.current.offsetY;
      onPositionChange?.(id, x, y);
    }

    function onUp() {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /* ---------------- COLORS ---------------- */
  const mag = "#ff79c6";
  const cyan = "#8be9fd";
  const alloc = "#33ff9e";
  const danger = "#ff5a7a";

  /* ---------------- RENDER ---------------- */
  return (
    <svg ref={svgRef} width="100%" height={maxY} style={{ overflow: "visible" }}>
      <defs>
        <marker id="arrow-primary" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
          <path d="M0,0 L10,6 L0,12 Z" fill={cyan} />
        </marker>
        <marker id="arrow-dead" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
          <path d="M0,0 L10,6 L0,12 Z" fill={danger} />
        </marker>
      </defs>

      {/* EDGES */}
      {edges.map((e) => {
        const a = nodePositions[e.from];
        const b = nodePositions[e.to];
        if (!a || !b) return null;

        const isDead = highlightedEdges.has(`${e.from}->${e.to}`);

        return (
          <g key={e.id}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={isDead ? danger : e.type === "request" ? mag : alloc}
              strokeWidth={isDead ? 4 : 3}
              strokeDasharray={e.type === "request" ? "6 6" : "0"}
              markerEnd={isDead ? "url(#arrow-dead)" : "url(#arrow-primary)"}
            />
            {e.amount > 1 && (
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 10}
                fill="#fff"
                fontSize={12}
                textAnchor="middle"
              >
                {e.amount}
              </text>
            )}
          </g>
        );
      })}

      {/* PROCESS NODES */}
      {processes.map((p) => {
        const pos = nodePositions[p];
        const isDead = highlightedNodes.has(p);

        return (
          <g key={p} onPointerDown={(e) => handlePointerDown(e, p)} style={{ cursor: "grab" }}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={30}
              fill={isDead ? "rgba(255,90,122,0.1)" : "rgba(255,121,198,0.1)"}
              stroke={isDead ? danger : mag}
              strokeWidth={isDead ? 4 : 3}
            />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="#fff" fontWeight={700}>
              {p}
            </text>
          </g>
        );
      })}

      {/* RESOURCE NODES */}
      {resources.map((r) => {
        const id = r.id;
        const pos = nodePositions[id];
        const inst = r.instances;
        const isDead = highlightedNodes.has(id);

        return (
          <g key={id} onPointerDown={(e) => handlePointerDown(e, id)} style={{ cursor: "grab" }}>
            <rect
              x={pos.x - 36}
              y={pos.y - 20}
              width={72}
              height={40}
              rx={10}
              fill={isDead ? "rgba(255,90,122,0.1)" : "rgba(123,92,255,0.1)"}
              stroke={isDead ? danger : "#7b5cff"}
              strokeWidth={isDead ? 4 : 3}
            />
            <text x={pos.x} y={pos.y + 6} textAnchor="middle" fill="#fff" fontWeight={700}>
              {id}
            </text>

            {/* instance dots */}
            {Array.from({ length: inst }).map((_, i) => (
              <circle
                key={i}
                cx={pos.x - 20 + i * 14}
                cy={pos.y - 34}
                r={5}
                fill="#8be9fd"
                stroke="#fff"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
