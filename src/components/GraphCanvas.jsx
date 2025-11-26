import React, { useRef, useEffect } from "react";

/*
 Props:
   graph: { processes: [], resources: [], edges: [] }
   cycles: array
   positions: { nodeId: {x,y} }
   onPositionChange: function(nodeId,x,y)
*/

export default function GraphCanvas({ graph = {}, cycles = [], positions = {}, onPositionChange }) {
  const { processes = [], resources = [], edges = [] } = graph;
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  // compute nodePositions: use provided positions or fallback layout
  const nodePositions = {};
  const defaultSpacing = 150;
  const startX = 100;
  const processY = 100;
  const resourceY = 260;

  processes.forEach((p, i) => {
    const pos = positions[p];
    nodePositions[p] = pos ? { ...pos, kind: "process" } : { x: startX + i * defaultSpacing, y: processY, kind: "process" };
  });
  resources.forEach((r, i) => {
    const pos = positions[r];
    nodePositions[r] = pos ? { ...pos, kind: "resource" } : { x: startX + i * defaultSpacing, y: resourceY, kind: "resource" };
  });

  // highlighted sets from cycles
  const highlightedNodes = new Set();
  const highlightedEdges = new Set();
  (cycles || []).forEach(cycle => {
    for (let i = 0; i < cycle.length - 1; i++) {
      highlightedNodes.add(cycle[i]);
      highlightedNodes.add(cycle[i + 1]);
      highlightedEdges.add(`${cycle[i]}->${cycle[i + 1]}`);
    }
  });

  // dragging logic (pointer events)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function onPointerMove(e) {
      const s = dragRef.current;
      if (!s) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const newX = loc.x - s.offsetX;
      const newY = loc.y - s.offsetY;
      // move visually by setting transform
      const g = svg.querySelector(`[data-node='${s.nodeId}']`);
      if (g) g.setAttribute("transform", `translate(${newX - (nodePositions[s.nodeId]?.x||0)}, ${newY - (nodePositions[s.nodeId]?.y||0)})`);
    }
    function onPointerUp(e) {
      const s = dragRef.current;
      if (!s) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const finalX = loc.x - s.offsetX;
      const finalY = loc.y - s.offsetY;
      const g = svg.querySelector(`[data-node='${s.nodeId}']`);
      if (g) g.removeAttribute("transform");
      if (typeof onPositionChange === "function") onPositionChange(s.nodeId, Math.round(finalX), Math.round(finalY));
      dragRef.current = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [onPositionChange, nodePositions]);

  function handlePointerDown(ev, nodeId) {
    ev.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const nodePos = nodePositions[nodeId] || { x: 0, y: 0 };
    const offsetX = loc.x - nodePos.x;
    const offsetY = loc.y - nodePos.y;
    dragRef.current = { nodeId, offsetX, offsetY };
    function onPointerMoveLocal(e) {
      const s = dragRef.current;
      if (!s) return;
      const pt2 = svg.createSVGPoint(); pt2.x = e.clientX; pt2.y = e.clientY;
      const loc2 = pt2.matrixTransform(svg.getScreenCTM().inverse());
      const newX = loc2.x - s.offsetX;
      const newY = loc2.y - s.offsetY;
      const g = svg.querySelector(`[data-node='${s.nodeId}']`);
      if (g) g.setAttribute("transform", `translate(${newX - (nodePositions[s.nodeId]?.x||0)}, ${newY - (nodePositions[s.nodeId]?.y||0)})`);
    }
    function onPointerUpLocal(e) {
      const s = dragRef.current;
      if (!s) return;
      const pt3 = svg.createSVGPoint(); pt3.x = e.clientX; pt3.y = e.clientY;
      const loc3 = pt3.matrixTransform(svg.getScreenCTM().inverse());
      const finalX = loc3.x - s.offsetX;
      const finalY = loc3.y - s.offsetY;
      const g = svg.querySelector(`[data-node='${s.nodeId}']`);
      if (g) g.removeAttribute("transform");
      if (typeof onPositionChange === "function") onPositionChange(s.nodeId, Math.round(finalX), Math.round(finalY));
      dragRef.current = null;
      window.removeEventListener("pointermove", onPointerMoveLocal);
      window.removeEventListener("pointerup", onPointerUpLocal);
    }
    window.addEventListener("pointermove", onPointerMoveLocal);
    window.addEventListener("pointerup", onPointerUpLocal);
  }

  // edges rendered first
  return (
    <svg ref={svgRef} width="100%" height="430" style={{ background: "#f7f7fc", border: "1px solid #ddd", marginTop: 20 }}>
      <defs>
        <marker id="arrow-default" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10" fill="#444" />
        </marker>
        <marker id="arrow-red" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10" fill="#d32f2f" />
        </marker>
      </defs>

      {/* edges */}
      {edges.map(e => {
        const a = nodePositions[e.from];
        const b = nodePositions[e.to];
        if (!a || !b) return null;
        const isDead = highlightedEdges.has(`${e.from}->${e.to}`);
        const stroke = isDead ? "#d32f2f" : e.type === "request" ? "#4a90e2" : "#27ae60";
        const dash = isDead ? "0" : e.type === "request" ? "6 4" : "0";
        const width = isDead ? 3.5 : 2.2;
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        return (
          <g key={e.id || `${e.from}->${e.to}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke} strokeWidth={width} strokeDasharray={dash} markerEnd={isDead ? "url(#arrow-red)" : "url(#arrow-default)"} />
            <text x={midX} y={midY - 8} fontSize="11" textAnchor="middle" fill="#444">{e.type}</text>
          </g>
        );
      })}

      {/* processes */}
      {processes.map(p => {
        const pos = nodePositions[p];
        if (!pos) return null;
        const isDead = highlightedNodes.has(p);
        // We render group at (pos.x,pos.y) with smooth transitions via CSS transform (set in CSS)
        return (
          <g
            key={p}
            data-node={p}
            onPointerDown={(ev) => handlePointerDown(ev, p)}
            transform={`translate(${pos.x}, ${pos.y})`}
            style={{ cursor: "grab", transition: "transform 320ms ease" }}
          >
            <circle cx={0} cy={0} r="28" fill={isDead ? "#ffebeb" : "#d8e8ff"} stroke={isDead ? "#d32f2f" : "#4a90e2"} strokeWidth={isDead ? 4 : 2} />
            <text x={0} y={6} textAnchor="middle" fontSize="15" fontWeight="600" fill="#333">{p}</text>
          </g>
        );
      })}

      {/* resources */}
      {resources.map(r => {
        const pos = nodePositions[r];
        if (!pos) return null;
        const isDead = highlightedNodes.has(r);
        return (
          <g
            key={r}
            data-node={r}
            onPointerDown={(ev) => handlePointerDown(ev, r)}
            transform={`translate(${pos.x}, ${pos.y})`}
            style={{ cursor: "grab", transition: "transform 320ms ease" }}
          >
            <rect x={-30} y={-22} width="60" height="44" rx="8" fill={isDead ? "#ffebeb" : "#efe4ff"} stroke={isDead ? "#d32f2f" : "#9b59b6"} strokeWidth={isDead ? 4 : 2} />
            <text x={0} y={6} textAnchor="middle" fontSize="15" fontWeight="600" fill="#333">{r}</text>
          </g>
        );
      })}
    </svg>
  );
}
