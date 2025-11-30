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

  const showToast = (text, ms = 1600) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  };

  const defaultPosFor = (kind, i) => {
    return { x: 140 + i * 150, y: kind === "process" ? 150 : 350 };
  };

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

    const result = await sendGraphToBackend(payload);

    if (result) {
      if (result.deadlock) {
        showToast("DEADLOCK: " + result.cycle.join(" → "));
      } else {
        showToast("Safe — No Deadlock");
      }

      // ⭐ IMPORTANT: PASS ANALYSIS TO ANALYSIS PAGE
      navigate("/analysis", {
        state: {
          analysis,
          graph,
          cycle: detectionResult.cycles
        }
      });

      if (result.visualization) {
        setVisualization(result.visualization);
        setVisualizationOpen(true);
      }
    }
  };

  /* ------------------ RENDER ------------------ */

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
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
          onResetLayout={() => {}}
          onResetGraph={resetGraph}
          analyzeGraph={analyzeGraph}
        />
      </div>


      {/* MAIN CANVAS AREA */}
      <div style={{ flex: 1, padding: 10 }}>

        {/* GRAPH */}
        <div style={{ height: 420 }}>
          <GraphCanvas
            graph={graph}
            cycles={detectionResult.cycles}
            positions={positions}
            onPositionChange={updateNodePosition}
          />
        </div>

        {/* DEADLOCK ALERT */}
        <DeadlockAlert
          result={detectionResult}
          graph={graph}
          onResetGraph={resetGraph}
        />

        {/* EDGE LIST */}
        <h3 style={{ marginTop: 20 }}>Edges</h3>
        <ul>
          {graph.edges.map(e => (
            <li key={e.id}>
              {e.id}: {e.from} → {e.to} ({e.type})
              <button
                onClick={() => removeEdge(e.id)}
                style={{ marginLeft: 8 }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>


      {/* TOAST */}
      {toast && (
        <div className="toast-notice">{toast}</div>
      )}

      {/* VISUALIZER MODAL */}
      <VisualizerModal
        open={visualizationOpen}
        onClose={() => setVisualizationOpen(false)}
        graph={{
          processes: graph.processes,
          resources: graph.resources,
          request_edges: graph.edges
            .filter(e => e.type === "request")
            .map(e => [e.from, e.to]),
          allocation_edges: graph.edges
            .filter(e => e.type === "allocation")
            .map(e => [e.from, e.to])
        }}
        positions={positions}
        cycle={detectionResult.cycles}
        backendVisualizationBase64={visualization}
        onRegenerate={analyzeGraph}
      />

    </div>
  );
}
