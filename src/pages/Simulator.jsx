import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import ControlsPanel from "../components/ControlsPanel";
import GraphCanvas from "../components/GraphCanvas";
import DeadlockAlert from "../components/DeadlockAlert";
import VisualizerModal from "../components/VisualizerModal";

import { createEmptyGraph, detectDeadlockDetailed } from "../utils/rag";
import { sendGraphToBackend } from "../utils/sendGraphToBackend";

import { explainDeadlock } from "../analysis/explain";
import { getFixSuggestions } from "../analysis/advisor";
import { predictDeadlock } from "../analysis/predict";
import { isSafeState } from "../analysis/bankers";
import { computeMetrics } from "../analysis/metrics";

let EDGE_COUNTER = 1;

export default function Simulator() {
  const navigate = useNavigate();

  /* ------------------ STATE ------------------ */
  const [graph, setGraph] = useState(() => createEmptyGraph());
  const [positions, setPositions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rag_positions")) || {};
    } catch {
      return {};
    }
  });

  const [toast, setToast] = useState(null);
  const [visualization, setVisualization] = useState(null);
  const [visualizationOpen, setVisualizationOpen] = useState(false);

  const [analysis, setAnalysis] = useState({
    explanation: null,
    fixes: null,
    prediction: null,
    safety: null,
    metrics: null
  });

  /* ------------------ EFFECTS ------------------ */
  useEffect(() => {
    localStorage.setItem("rag_positions", JSON.stringify(positions));
  }, [positions]);

  const detectionResult = detectDeadlockDetailed(graph);

  useEffect(() => {
    const prediction = predictDeadlock({
      ...graph,
      cycles: detectionResult.cycles
    });

    setAnalysis({
      explanation: explainDeadlock(graph, detectionResult.cycles),
      fixes: getFixSuggestions(graph, detectionResult.cycles),
      prediction,
      safety: isSafeState(graph),
      metrics: computeMetrics(graph)
    });
  }, [graph]);

  /* ------------------ HELPERS ------------------ */

  const showToast = (text, ms = 1500) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  };

  const defaultPosFor = (kind, i) => {
    return { x: 140 + i * 150, y: kind === "process" ? 150 : 350 };
  };

  /* ---------- BATCH 5: SAMPLE + LAYOUT HELPERS ---------- */

  function computeDefaultPositions(g) {
    const pos = {};
    const p = g.processes.length;
    const r = g.resources.length;
    const gap = 900 / Math.max(1, Math.max(p, r));

    g.processes.forEach((id, i) => {
      pos[id] = { x: 120 + i * gap, y: 110 };
    });

    g.resources.forEach((id, i) => {
      pos[id] = { x: 120 + i * gap, y: 360 };
    });

    return pos;
  }

  function resetLayout() {
    const newPos = computeDefaultPositions(graph);
    setPositions(newPos);
    localStorage.setItem("rag_positions", JSON.stringify(newPos));
    showToast("Layout reset");
  }

  function sample_deadlock() {
    return {
      processes: ["P1", "P2"],
      resources: ["R1", "R2"],
      edges: [
        { id: "e1", from: "P1", to: "R1", type: "request" },
        { id: "e2", from: "R1", to: "P2", type: "allocation" },
        { id: "e3", from: "P2", to: "R2", type: "request" },
        { id: "e4", from: "R2", to: "P1", type: "allocation" }
      ]
    };
  }

  function sample_safe_simple() {
    return {
      processes: ["P1", "P2"],
      resources: ["R1", "R2"],
      edges: [
        { id: "e1", from: "R1", to: "P1", type: "allocation" },
        { id: "e2", from: "R2", to: "P2", type: "allocation" }
      ]
    };
  }

  function sample_complex() {
    return {
      processes: ["P1", "P2", "P3"],
      resources: ["R1", "R2", "R3"],
      edges: [
        { id: "e1", from: "P1", to: "R1", type: "request" },
        { id: "e2", from: "R1", to: "P2", type: "allocation" },
        { id: "e3", from: "P2", to: "R2", type: "request" },
        { id: "e4", from: "R2", to: "P3", type: "allocation" },
        { id: "e5", from: "P3", to: "R3", type: "request" },
        { id: "e6", from: "R3", to: "P1", type: "allocation" }
      ]
    };
  }

  function loadSampleGraph(fn) {
    const g = fn();
    let counter = 1;
    g.edges = g.edges.map(e => ({ ...e, id: e.id || `e${counter++}` }));
    setGraph(g);

    const pos = computeDefaultPositions(g);
    setPositions(pos);
    localStorage.setItem("rag_positions", JSON.stringify(pos));

    showToast("Sample Loaded");
  }

  /* ------------------ GRAPH OPERATIONS ------------------ */

  const addProcess = () => {
    const id = "P" + (graph.processes.length + 1);
    setGraph(prev => {
      const updated = [...prev.processes, id];
      setPositions(p => ({
        ...p,
        [id]: defaultPosFor("process", updated.length - 1)
      }));
      return { ...prev, processes: updated };
    });
    showToast("Added " + id);
  };

  const addResource = () => {
    const id = "R" + (graph.resources.length + 1);
    setGraph(prev => {
      const updated = [...prev.resources, id];
      setPositions(p => ({
        ...p,
        [id]: defaultPosFor("resource", updated.length - 1)
      }));
      return { ...prev, resources: updated };
    });
    showToast("Added " + id);
  };

  const createEdge = ({ from, to, type }) => {
    if (!from || !to || !type) return;

    const exists = graph.edges.some(
      e => e.from === from && e.to === to && e.type === type
    );
    if (exists) return showToast("Edge already exists");

    const id = "e" + EDGE_COUNTER++;
    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { id, from, to, type }]
    }));
    showToast("Created " + id);
  };

  const removeEdge = id => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== id)
    }));
    showToast("Edge removed");
  };

  const resetGraph = () => {
    setGraph(createEmptyGraph());
    setPositions({});
    localStorage.removeItem("rag_positions");
    showToast("Graph reset");
  };

  const updateNodePosition = useCallback((id, x, y) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  /* ------------------ ANALYZE GRAPH ------------------ */
  const analyzeGraph = async () => {
    const payload = {
      processes: graph.processes,
      resources: graph.resources,
      request_edges: graph.edges
        .filter(e => e.type === "request")
        .map(e => [e.from, e.to]),
      allocation_edges: graph.edges
        .filter(e => e.type === "allocation")
        .map(e => [e.from, e.to])
    };

    const res = await sendGraphToBackend(payload);

    if (res) {
      if (res.deadlock) showToast("DEADLOCK: " + res.cycle.join(" → "));
      else showToast("Safe — No Deadlock");

      navigate("/analysis", {
        state: { analysis, graph, cycle: detectionResult.cycles }
      });

      if (res.visualization) {
        setVisualization(res.visualization);
        setVisualizationOpen(true);
      }
    }
  };

  /* ------------------ RENDER ------------------ */
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      <div style={{
        padding: "20px 30px",
        background: "var(--topbar-bg)",
        borderBottom: "1px solid #222"
      }}>
        <h1>RAG Simulator</h1>

        <ControlsPanel
          processes={graph.processes}
          resources={graph.resources}
          onAddProcess={addProcess}
          onAddResource={addResource}
          onCreateEdge={createEdge}
          onResetLayout={resetLayout}
          onResetGraph={resetGraph}
          analyzeGraph={analyzeGraph}
          onLoadDeadlock={() => loadSampleGraph(sample_deadlock)}
          onLoadSafe={() => loadSampleGraph(sample_safe_simple)}
          onLoadComplex={() => loadSampleGraph(sample_complex)}
        />
      </div>

      <div style={{ flex: 1, padding: 10 }}>
        <div style={{ height: 420 }}>
          <GraphCanvas
            graph={graph}
            cycles={detectionResult.cycles}
            positions={positions}
            onPositionChange={updateNodePosition}
          />
        </div>

        <DeadlockAlert result={detectionResult} graph={graph} onResetGraph={resetGraph} />

        <h3 style={{ marginTop: 20 }}>Edges</h3>
        <ul>
          {graph.edges.map(e => (
            <li key={e.id}>
              {e.id}: {e.from} → {e.to} ({e.type})
              <button onClick={() => removeEdge(e.id)} style={{ marginLeft: 8 }}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {toast && <div className="toast-notice">{toast}</div>}

      <VisualizerModal
        open={visualizationOpen}
        onClose={() => setVisualizationOpen(false)}
        graph={graph}
        positions={positions}
        cycle={detectionResult.cycles}
        backendVisualizationBase64={visualization}
        onRegenerate={analyzeGraph}
      />

    </div>
  );
}
