// src/components/GraphCanvas.jsx
import React, { useRef } from "react";

/*
 Props:
   graph: { processes: [], resources: [], edges: [{id,from,to,type}] }
   cycles: array
   positions: { nodeId: {x,y} }
   onPositionChange: function(nodeId,x,y)
*/

export default function GraphCanvas({ graph = {}, cycles = [], positions = {}, onPositionChange }) {
  const { processes = [], resources = [], edges = [] } = graph;
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  // layout fallbacks
  const nodePositions = {};
  const spacing = 220;
  const startX = 160;
  const topY = 120;
  const bottomY = 300;

  processes.forEach((p, i) => {
    const pos = positions[p];
    nodePositions[p] = pos ? { ...pos, kind: "process" } : { x: startX + i * spacing, y: topY, kind: "process" };
  });
  resources.forEach((r, i) => {
    const pos = positions[r];
    nodePositions[r] = pos ? { ...pos, kind: "resource" } : { x: startX + i * spacing, y: bottomY, kind: "resource" };
  });

  // highlights from cycles
  const highlightedNodes = new Set();
  const highlightedEdges = new Set();
  (cycles || []).forEach(cycle => {
    for (let i = 0; i < cycle.length - 1; i++) {
      highlightedNodes.add(cycle[i]);
      highlightedNodes.add(cycle[i + 1]);
      highlightedEdges.add(`${cycle[i]}->${cycle[i + 1]}`);
    }
  });

  // convert client pointer to SVG coordinates
  function pointerToSvg(e){
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function handlePointerDown(ev, nodeId){
    ev.preventDefault();
    const loc = pointerToSvg(ev);
    const nodePos = nodePositions[nodeId] || { x:0, y:0 };
    dragRef.current = { nodeId, offsetX: loc.x - nodePos.x, offsetY: loc.y - nodePos.y };

    // set grabbing cursor immediately
    const g = svgRef.current.querySelector(`[data-node='${nodeId}']`);
    if (g) g.style.cursor = 'grabbing';

    function onMove(e){
      const s = dragRef.current; if (!s) return;
      const loc2 = pointerToSvg(e);
      const newX = loc2.x - s.offsetX;
      const newY = loc2.y - s.offsetY;
      const g2 = svgRef.current.querySelector(`[data-node='${s.nodeId}']`);
      if (g2) g2.setAttribute("transform", `translate(${newX - (nodePositions[s.nodeId]?.x || 0)}, ${newY - (nodePositions[s.nodeId]?.y || 0)})`);
    }

    function onUp(e){
      const s = dragRef.current; if (!s) return;
      const loc3 = pointerToSvg(e);
      const finalX = loc3.x - s.offsetX;
      const finalY = loc3.y - s.offsetY;
      const g3 = svgRef.current.querySelector(`[data-node='${s.nodeId}']`);
      if (g3) {
        g3.removeAttribute("transform");
        g3.style.cursor = 'grab';
      }
      if (typeof onPositionChange === "function") onPositionChange(s.nodeId, Math.round(finalX), Math.round(finalY));
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <svg ref={svgRef} width="100%" height="100%" viewBox={`0 0 ${Math.max(900, window.innerWidth)} ${Math.max(520, window.innerHeight - 220)}`} preserveAspectRatio="xMinYMin meet" style={{ display: "block" }}>
      {/* edges */}
      {edges.map(e => {
        const a = nodePositions[e.from];
        const b = nodePositions[e.to];
        if (!a || !b) return null;
        const isDead = highlightedEdges.has(`${e.from}->${e.to}`);
        const cls = isDead ? "edge dead-edge" : (e.type === "request" ? "edge request-edge" : "edge alloc-edge");
        return (
          <g key={e.id || `${e.from}->${e.to}`} className={cls}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          </g>
        );
      })}

      {/* processes */}
      {processes.map(p => {
        const pos = nodePositions[p]; if (!pos) return null;
        const hl = highlightedNodes.has(p);
        return (
          <g
            key={p}
            data-node={p}
            className={`node process${hl ? " highlighted" : ""}`}
            transform={`translate(${pos.x}, ${pos.y})`}
            onPointerDown={(ev) => handlePointerDown(ev, p)}
            style={{ touchAction: "none" }}
          >
            <circle cx={0} cy={0} r={30} />
            <text x={0} y={6} textAnchor="middle">{p}</text>
          </g>
        );
      })}

      {/* resources */}
      {resources.map(r => {
        const pos = nodePositions[r]; if (!pos) return null;
        const hl = highlightedNodes.has(r);
        return (
          <g
            key={r}
            data-node={r}
            className={`node resource${hl ? " highlighted" : ""}`}
            transform={`translate(${pos.x}, ${pos.y})`}
            onPointerDown={(ev) => handlePointerDown(ev, r)}
            style={{ touchAction: "none" }}
          >
            <rect x={-36} y={-20} rx={10} width={72} height={40} />
            <text x={0} y={6} textAnchor="middle">{r}</text>
          </g>
        );
      })}
    </svg>
  );
}
