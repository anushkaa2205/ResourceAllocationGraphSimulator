// src/components/GraphCanvas.jsx
import React, { useRef } from "react";

export default function GraphCanvas({ graph = {}, positions = {}, cycles = [], onPositionChange }) {
  const { processes = [], resources = [], edges = [] } = graph;
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  // ----- Compute node positions -----
  const nodePositions = {};
  const spacing = 220;
  const startX = 160;
  const topY = 120;
  const bottomY = 300;

  processes.forEach((p, i) => {
    const pos = positions[p];
    nodePositions[p] = pos || { x: startX + i * spacing, y: topY };
  });

  resources.forEach((r, i) => {
    const pos = positions[r.id];
    nodePositions[r.id] = pos || { x: startX + i * spacing, y: bottomY };
  });

  // ----- Highlight cycle edges -----
  const highlightedNodes = new Set();
  const highlightedEdges = new Set();

  (cycles || []).forEach((cycle) => {
    for (let i = 0; i < cycle.length; i++) {
      const a = cycle[i];
      const b = cycle[(i + 1) % cycle.length];

      highlightedNodes.add(a);
      highlightedNodes.add(b);
      highlightedEdges.add(`${a}->${b}`);
    }
  });

  // ----- SVG pointer conversion -----
  function pointerToSvg(e) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  // ----- Dragging Logic -----
  function handlePointerDown(ev, nodeId) {
    ev.preventDefault();
    const loc = pointerToSvg(ev);
    const nodePos = nodePositions[nodeId] || { x: 0, y: 0 };

    dragRef.current = {
      nodeId,
      offsetX: loc.x - nodePos.x,
      offsetY: loc.y - nodePos.y
    };

   function onMove(e) {
  const s = dragRef.current;
  if (!s) return;

  const loc2 = pointerToSvg(e);

  const newX = loc2.x - s.offsetX;
  const newY = loc2.y - s.offsetY;

  const g = svgRef.current.querySelector(`[data-node='${s.nodeId}']`);
  if (g) {
    g.setAttribute("transform", `translate(${newX}, ${newY})`);
  }
}

    function onUp(e) {
  const s = dragRef.current;
  if (!s) return;

  const loc3 = pointerToSvg(e);
  const finalX = loc3.x - s.offsetX;
  const finalY = loc3.y - s.offsetY;

  const g = svgRef.current.querySelector(`[data-node='${s.nodeId}']`);

  // KEEP TRANSFORM — DO NOT REMOVE IT
  if (g) g.setAttribute("transform", `translate(${finalX}, ${finalY})`);

  // Update logical position
  if (typeof onPositionChange === "function") {
    onPositionChange(s.nodeId, Math.round(finalX), Math.round(finalY));
  }

  dragRef.current = null;
  window.removeEventListener("pointermove", onMove);
  window.removeEventListener("pointerup", onUp);
}


    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <svg ref={svgRef} width="100%" height="520">
      {/* ----- ARROW HEAD ----- */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="#8be9fd" />
        </marker>
      </defs>

      {/* ----- EDGES ----- */}
      {edges.map((e) => {
        const a = nodePositions[e.from];
        const b = nodePositions[e.to];
        if (!a || !b) return null;

        const isDeadEdge = highlightedEdges.has(`${e.from}->${e.to}`);

        return (
          <g key={e.id}>
            <line
              ref={(el) => {
                if (el) {
                  // FORCE OVERRIDE EVEN IF CSS HAS !important
                  el.style.setProperty(
                    "stroke",
                    isDeadEdge ? "#ff416c" : "#8be9fd",
                    "important"
                  );
                  el.style.setProperty(
                    "stroke-width",
                    isDeadEdge ? "5" : "3",
                    "important"
                  );
                }
              }}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={isDeadEdge ? "#ff416c" : "#8be9fd"} // still required by React
              strokeWidth={isDeadEdge ? 5 : 3}
              strokeDasharray={e.type === "request" ? "6 6" : "none"}
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />

            {/* Amount Label */}
            {e.amount > 1 && (
              <text
                x={(a.x + b.x) / 2}
                y={(a.y + b.y) / 2 - 6}
                fill="#fff"
                fontSize="12"
                textAnchor="middle"
              >
                {e.amount}
              </text>
            )}
          </g>
        );
      })}

      {/* ----- PROCESS NODES ----- */}
      {processes.map((p) => {
        const pos = nodePositions[p];
        const isDead = highlightedNodes.has(p);

        return (
          <g
            key={p}
            data-node={p}
            transform={`translate(${pos.x}, ${pos.y})`}
            onPointerDown={(e) => handlePointerDown(e, p)}
          >
            <circle
              r="30"
              fill={isDead ? "#ff416c33" : "#ff79c633"}
              stroke={isDead ? "#ff416c" : "#ff79c6"}
              strokeWidth="3"
            />
            <text x="0" y="6" textAnchor="middle" fill="#fff">{p}</text>
          </g>
        );
      })}

      {/* ----- RESOURCE NODES ----- */}
      {resources.map((r) => {
        const pos = nodePositions[r.id];
        const isDead = highlightedNodes.has(r.id);

        return (
          <g
            key={r.id}
            data-node={r.id}
            transform={`translate(${pos.x}, ${pos.y})`}
            onPointerDown={(e) => handlePointerDown(e, r.id)}
          >
            <rect
              x={-36}
              y={-20}
              width={72}
              height={40}
              rx={10}
              fill={isDead ? "#ff416c33" : "#7b5cff33"}
              stroke={isDead ? "#ff416c" : "#7b5cff"}
              strokeWidth="3"
            />
            <text x="0" y="6" textAnchor="middle" fill="#fff">{r.id}</text>

            {/* Instance dots */}
            {Array.from({ length: r.instances }).map((_, i) => (
              <circle
                key={i}
                cx={-20 + i * 15}
                cy={-32}
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
