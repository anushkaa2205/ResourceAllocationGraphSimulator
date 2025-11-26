// src/App.jsx
import React, { useState, useEffect, useCallback } from "react";
import ControlsPanel from "./components/ControlsPanel";
import GraphCanvas from "./components/GraphCanvas";
import DeadlockAlert from "./components/DeadlockAlert";
import { createEmptyGraph, detectDeadlockDetailed } from "./utils/rag";

let EDGE_COUNTER = 1;

export default function App() {
  // graph state: processes (array), resources (array), edges (array of {id,from,to,type})
  const [graph, setGraph] = useState(() => createEmptyGraph());

  // node positions persisted to localStorage
  const [positions, setPositions] = useState(() => {
    try {
      const raw = localStorage.getItem("rag_positions");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  // small toast text shown for a short time
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem("rag_positions", JSON.stringify(positions));
    } catch {}
  }, [positions]);

  // Helpers to add nodes
  const addProcess = () => {
    const id = "P" + (graph.processes.length + 1);
    setGraph(prev => {
      const processes = [...prev.processes, id];
      // add default position
      setPositions(pos => ({ ...pos, [id]: defaultPosFor("process", processes.length - 1) }));
      return { ...prev, processes };
    });
    showToast("Added " + id);
  };

  const addResource = () => {
    const id = "R" + (graph.resources.length + 1);
    setGraph(prev => {
      const resources = [...prev.resources, id];
      setPositions(pos => ({ ...pos, [id]: defaultPosFor("resource", resources.length - 1) }));
      return { ...prev, resources };
    });
    showToast("Added " + id);
  };

  function defaultPosFor(kind, index) {
    // fallback default position (will be re-laid out by resetLayout as needed)
    const x = 120 + index * 150;
    const y = kind === "process" ? 120 : 300;
    return { x, y };
  }

  // Create edge expected payload: { from, to, type } where type === "request" | "allocation"
  function createEdge({ from, to, type }) {
    if (!from || !to || !type) return;
    // prevent duplicates (same from,to,type)
    const exists = graph.edges.some(e => e.from === from && e.to === to && e.type === type);
    if (exists) {
      showToast("Edge already exists");
      return;
    }
    const id = "e" + (EDGE_COUNTER++);
    const edge = { id, from, to, type };
    setGraph(prev => ({ ...prev, edges: [...prev.edges, edge] }));
    showToast(`Created edge ${id}`);
  }

  function removeEdge(id) {
    setGraph(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== id) }));
    showToast("Edge removed");
  }

  // Reset graph (clear nodes, edges and positions)
  function resetGraph() {
    setGraph(createEmptyGraph());
    setPositions({});
    try { localStorage.removeItem("rag_positions"); } catch {}
    showToast("Graph reset");
  }

  // Reset layout — two modes: 'smart' or 'grid'
  function resetLayout(mode = "smart") {
    // measure svg width if possible (so centering works). fallback width value
    const svgRect = document.querySelector("svg")?.getBoundingClientRect();
    const canvasWidth = svgRect ? Math.max(600, svgRect.width - 40) : 900;

    const newPositions = {};

    if (mode === "grid") {
      const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(graph.processes.length, graph.resources.length))));
      const gapX = Math.max(120, Math.floor((canvasWidth - 120) / cols));
      const startX = 80;

      graph.processes.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions[p] = { x: startX + col * gapX, y: 100 + row * 120 };
      });
      graph.resources.forEach((r, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions[r] = { x: startX + col * gapX, y: 260 + row * 120 };
      });

      setPositions(newPositions);
      showToast("Grid layout applied");
      return;
    }

    // smart centered layout
    const totalTop = graph.processes.length;
    const totalBottom = graph.resources.length;
    const topY = 120, bottomY = 300;
    const usableWidth = Math.max(420, canvasWidth - 160);

    if (totalTop > 0) {
      const spacingTop = Math.min(220, usableWidth / totalTop);
      const startTop = (canvasWidth - (spacingTop * (totalTop - 1))) / 2;
      graph.processes.forEach((p, i) => {
        newPositions[p] = { x: Math.round(startTop + i * spacingTop), y: topY };
      });
    }

    if (totalBottom > 0) {
      const spacingBottom = Math.min(220, usableWidth / totalBottom);
      const startBottom = (canvasWidth - (spacingBottom * (totalBottom - 1))) / 2;
      graph.resources.forEach((r, i) => {
        newPositions[r] = { x: Math.round(startBottom + i * spacingBottom), y: bottomY };
      });
    }

    setPositions(newPositions);
    showToast("Layout reset");
  }

  // callback for node drag end
  const updateNodePosition = useCallback((nodeId, x, y) => {
    setPositions(prev => ({ ...prev, [nodeId]: { x: Math.round(x), y: Math.round(y) } }));
  }, []);

  // detect deadlock cycles using utility wrapper
  const detectionResult = detectDeadlockDetailed(graph);

  // toast helper
  function showToast(text, ms = 1400) {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  }

  return (
    <div className="app-root">
      {/* Topbar / header */}
      <div className="topbar">
        <h1>Resource Allocation Graph Simulator</h1>

        {/* ControlsPanel holds create-edge UI and Add/Reset buttons */}
        <ControlsPanel
          processes={graph.processes}
          resources={graph.resources}
          onAddProcess={addProcess}
          onAddResource={addResource}
          onCreateEdge={createEdge}
          onResetLayout={() => resetLayout("smart")}
          onResetGraph={resetGraph}
        />

        <div className="hint" style={{ marginTop: 10 }}>
          <small>
            Tip: Request (P → R) creates a dashed edge from process to resource.
            Allocation (R → P) creates a solid edge from resource to process.
            Deadlocks are flagged only when there's a cycle involving two or more processes.
          </small>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="state-panel">
          <h3>Current System State</h3>
          <p style={{ margin: 0 }}>
            Processes: {graph.processes.length ? graph.processes.join(", ") : <em>(none)</em>}
          </p>
          <p style={{ marginTop: 6 }}>
            Resources: {graph.resources.length ? graph.resources.join(", ") : <em>(none)</em>}
          </p>
        </div>

        <div className="canvas-wrap">
          <GraphCanvas
            graph={graph}
            cycles={detectionResult.cycles}
            positions={positions}
            onPositionChange={updateNodePosition}
          />
        </div>

        <DeadlockAlert result={detectionResult} graph={graph} onResetGraph={resetGraph} />

        {/* Edges list with delete */}
        <div style={{ marginTop: 16 }}>
          <h4>Edges</h4>
          <ul>
            {graph.edges.map(e => (
              <li key={e.id} style={{ marginBottom: 8, color: "var(--muted)" }}>
                <strong>{e.id}</strong>: {e.from} → {e.to} ({e.type})
                <button style={{ marginLeft: 10 }} onClick={() => removeEdge(e.id)}>Delete</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bottom-row" style={{ marginTop: 12 }}>
          <button onClick={() => resetLayout("smart")}>Reset Layout (smart)</button>
          <button onClick={() => resetLayout("grid")} style={{ marginLeft: 8 }}>Reset Layout (grid)</button>
        </div>
      </div>

      {/* toast */}
      {toast ? <div className="toast-notice">{toast}</div> : null}
    </div>
  );
}
