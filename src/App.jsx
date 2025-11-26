import React, { useState, useEffect, useCallback, useRef } from "react";
import GraphCanvas from "./components/GraphCanvas";
import ControlsPanel from "./components/ControlsPanel";
import ProcessResourceTable from "./components/ProcessResourceTable";
import DeadlockAlert from "./components/DeadlockAlert";
import { createEmptyGraph, detectDeadlockDetailed } from "./utils/rag";

let EDGE_COUNTER = 1;

export default function App() {
  const canvasRef = useRef(null); // for measuring canvas width if needed

  const [graph, setGraph] = useState(() => createEmptyGraph());

  const [positions, setPositions] = useState(() => {
    try {
      const raw = localStorage.getItem("rag_positions");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [toast, setToast] = useState(null); // { text, timeoutId }

  useEffect(() => {
    try { localStorage.setItem("rag_positions", JSON.stringify(positions)); } catch {}
  }, [positions]);

  // helpers
  function defaultPosFor(kind, index, count) {
    // center-aware fallback: actual positions will be computed in resetLayout
    const x = 120 + index * 150;
    const y = kind === "process" ? 100 : 260;
    return { x, y };
  }

  const addProcess = () => {
    const p = "P" + (graph.processes.length + 1);
    setGraph(prev => {
      const processes = [...prev.processes, p];
      setPositions(pos => ({ ...pos, [p]: defaultPosFor("process", processes.length - 1) }));
      return { ...prev, processes };
    });
  };

  const addResource = () => {
    const r = "R" + (graph.resources.length + 1);
    setGraph(prev => {
      const resources = [...prev.resources, r];
      setPositions(pos => ({ ...pos, [r]: defaultPosFor("resource", resources.length - 1) }));
      return { ...prev, resources };
    });
  };

  function createEdge({ from, to, type }) {
    const exists = graph.edges.some(e => e.from === from && e.to === to && e.type === type);
    if (exists) return alert("That edge already exists.");
    const id = "e" + (EDGE_COUNTER++);
    const edge = { id, from, to, type };
    setGraph(prev => ({ ...prev, edges: [...prev.edges, edge] }));
  }

  function removeEdge(id) {
    setGraph(prev => ({ ...prev, edges: prev.edges.filter(e => e.id !== id) }));
  }

  function resetGraph() {
    setGraph(createEmptyGraph());
    setPositions({});
    try { localStorage.removeItem("rag_positions"); } catch {}
    showToast("Graph reset");
  }

  // NEW: smart resetLayout with modes
  // mode: 'smart' | 'grid' | 'random'
  function resetLayout(mode = "smart") {
    // compute canvas width from DOM if available
    const canvasRect = document.querySelector("svg")?.getBoundingClientRect();
    const canvasWidth = canvasRect ? Math.max(600, canvasRect.width - 40) : 900;

    const newPositions = {};
    if (mode === "random") {
      const padX = 60, padY = 40;
      const w = canvasWidth - padX * 2;
      graph.processes.forEach((p) => {
        newPositions[p] = { x: padX + Math.random() * w, y: 80 + Math.random() * 120 };
      });
      graph.resources.forEach((r) => {
        newPositions[r] = { x: padX + Math.random() * w, y: 240 + Math.random() * 120 };
      });
      setPositions(newPositions);
      showToast("Layout randomized");
      return;
    }

    if (mode === "grid") {
      // simple grid: put processes top row, resources bottom row, but wrap if too many
      const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(graph.processes.length, graph.resources.length))));
      const gapX = Math.max(120, Math.floor((canvasWidth - 120) / cols));
      const startX = 80;

      graph.processes.forEach((p, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        newPositions[p] = { x: startX + col * gapX, y: 80 + row * 120 };
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

    // default 'smart' centered dynamic spacing
    const totalTop = graph.processes.length;
    const totalBottom = graph.resources.length;
    const topY = 100, bottomY = 260;
    const areaPadding = 80;
    const usableWidth = Math.max(420, canvasWidth - areaPadding * 2);

    // center processes row
    if (totalTop > 0) {
      const spacingTop = Math.min(180, usableWidth / totalTop);
      const startTop = (canvasWidth - (spacingTop * (totalTop - 1))) / 2;
      graph.processes.forEach((p, i) => {
        newPositions[p] = { x: Math.round(startTop + i * spacingTop), y: topY };
      });
    }

    // center resources row
    if (totalBottom > 0) {
      const spacingBottom = Math.min(180, usableWidth / totalBottom);
      const startBottom = (canvasWidth - (spacingBottom * (totalBottom - 1))) / 2;
      graph.resources.forEach((r, i) => {
        newPositions[r] = { x: Math.round(startBottom + i * spacingBottom), y: bottomY };
      });
    }

    setPositions(newPositions);
    showToast("Layout reset to tidy view");
  }

  // small toast utility
  function showToast(text, ms = 1800) {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  }

  // callback from GraphCanvas when user drags node
  const updateNodePosition = useCallback((nodeId, x, y) => {
    setPositions(prev => ({ ...prev, [nodeId]: { x: Math.round(x), y: Math.round(y) } }));
  }, []);

  const detectionResult = detectDeadlockDetailed(graph);

  return (
    <div className="container">
      <h1>Resource Allocation Graph Simulator</h1>

      <ControlsPanel
        processes={graph.processes}
        resources={graph.resources}
        onAddProcess={addProcess}
        onAddResource={addResource}
        onCreateEdge={createEdge}
        onResetLayout={() => resetLayout("smart")}
        onResetGraph={resetGraph}
      />

      <div style={{ marginTop: 18 }}>
        <h3>Current System State</h3>
        <p style={{ margin: 0 }}>
          Processes: {graph.processes.length ? graph.processes.join(", ") : <em>(none)</em>}
        </p>
        <p style={{ marginTop: 4 }}>
          Resources: {graph.resources.length ? graph.resources.join(", ") : <em>(none)</em>}
        </p>
      </div>

      <div style={{ marginTop: 10 }}>
        <GraphCanvas
          graph={graph}
          cycles={detectionResult.cycles}
          positions={positions}
          onPositionChange={updateNodePosition}
        />
      </div>

      <DeadlockAlert result={detectionResult} graph={graph} onResetGraph={resetGraph} />

      {toast ? (
        <div className="toast-notice">{toast}</div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <h4>Edges</h4>
        <ul>
          {graph.edges.map(e => (
            <li key={e.id} style={{ marginBottom: 6 }}>
              <strong>{e.id}</strong>: {e.from} → {e.to} ({e.type})
              <button style={{ marginLeft: 8 }} onClick={() => removeEdge(e.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={() => resetLayout("smart")}>Reset Layout (smart)</button>
        <button onClick={() => resetLayout("grid")} style={{ marginLeft: 8 }}>Reset Layout (grid)</button>
        <button onClick={() => resetLayout("random")} style={{ marginLeft: 8 }}>Randomize Layout</button>
      </div>
    </div>
  );
}
