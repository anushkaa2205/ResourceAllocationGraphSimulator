import React, { useState, useEffect, useCallback } from "react";
import ControlsPanel from "./components/ControlsPanel";
import GraphCanvas from "./components/GraphCanvas";
import DeadlockAlert from "./components/DeadlockAlert";
import VisualizerModal from "./components/VisualizerModal";

import { createEmptyGraph, detectDeadlockDetailed } from "./utils/rag";
import { sendGraphToBackend } from "./utils/sendGraphToBackend";

import { explainDeadlock } from "./analysis/explain";
import { getFixSuggestions } from "./analysis/advisor";
import { predictDeadlock } from "./analysis/predict";
import { isSafeState } from "./analysis/bankers";
import { computeMetrics } from "./analysis/metrics";

let EDGE_COUNTER = 1;

export default function App() {

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

  useEffect(() => {
    localStorage.setItem("rag_positions", JSON.stringify(positions));
  }, [positions]);

  function showToast(text, ms = 1600) {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  }

  const addProcess = () => {
    const id = "P" + (graph.processes.length + 1);
    setGraph(prev => {
      const processes = [...prev.processes, id];
      setPositions(p => ({
        ...p,
        [id]: defaultPosFor("process", processes.length - 1)
      }));
      return { ...prev, processes };
    });
    showToast("Added " + id);
  };

  const addResource = () => {
    const id = "R" + (graph.resources.length + 1);
    setGraph(prev => {
      const resources = [...prev.resources, id];
      setPositions(p => ({
        ...p,
        [id]: defaultPosFor("resource", resources.length - 1)
      }));
      return { ...prev, resources };
    });
    showToast("Added " + id);
  };

  function defaultPosFor(kind, i) {
    return { x: 140 + i * 150, y: kind === "process" ? 150 : 350 };
  }

  function createEdge({ from, to, type }) {
    if (!from || !to || !type) return;
    const exists = graph.edges.some(e => e.from === from && e.to === to && e.type === type);
    if (exists) return showToast("Edge exists");

    const id = "e" + EDGE_COUNTER++;
    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { id, from, to, type }]
    }));

    showToast("Created " + id);
  }

  function removeEdge(id) {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== id)
    }));
  }

  const analyzeGraph = async () => {
    const payload = {
      processes: graph.processes,
      resources: graph.resources,
      request_edges: graph.edges.filter(e => e.type === "request").map(e => [e.from, e.to]),
      allocation_edges: graph.edges.filter(e => e.type === "allocation").map(e => [e.from, e.to])
    };

    const result = await sendGraphToBackend(payload);

    if (result) {
      if (result.deadlock) {
        showToast("DEADLOCK: " + result.cycle.join(" → "));
      } else {
        showToast("Safe — No Deadlock");
      }

      if (result.visualization) {
        setVisualization(result.visualization);
        setVisualizationOpen(true);
      }
    }
  };

  function resetGraph() {
    setGraph(createEmptyGraph());
    setPositions({});
    localStorage.removeItem("rag_positions");
  }

  const updateNodePosition = useCallback((id, x, y) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  const detectionResult = detectDeadlockDetailed(graph);

  useEffect(() => {
    const prediction = predictDeadlock({ ...graph, cycles: detectionResult.cycles });

    setAnalysis({
      explanation: explainDeadlock(graph, detectionResult.cycles),
      fixes: getFixSuggestions(graph, detectionResult.cycles),
      prediction,
      safety: isSafeState(graph),
      metrics: computeMetrics(graph)
    });
  }, [graph]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

      {/* HEADER */}
      <div style={{ padding: "20px 30px", background: "var(--topbar-bg)", borderBottom: "1px solid #222" }}>
        <h1>Resource Allocation Graph Simulator</h1>

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

      {/* MAIN BODY */}
      <div style={{ display: "flex", flex: 1 }}>

        {/* SIDEBAR */}
        <div style={{ width: 330, background: "var(--sidebar-bg)", padding: 12, borderRight: "1px solid #222" }}>
          <h3>Current System State</h3>
          <p>Processes: {graph.processes.join(", ")}</p>
          <p>Resources: {graph.resources.join(", ")}</p>

          <div style={{
            padding: 12,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 10,
            marginTop: 12
          }}>
            <h3>System Intelligence</h3>

            <p><strong>Explanation:</strong><br />
              {analysis.explanation?.explanation}
            </p>

            <p><strong>Fix Suggestions:</strong></p>
            <ul>
              {analysis.fixes?.map((x, i) => <li key={i}>{x}</li>)}
            </ul>

            <p><strong>Deadlock Risk:</strong><br />
              {analysis.prediction?.riskLevel}
            </p>

            <p><strong>Safe State?:</strong><br />
              {analysis.safety?.message}
            </p>

            <p><strong>Total Edges:</strong> {analysis.metrics?.totalEdges}</p>
          </div>
        </div>

        {/* CANVAS */}
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

          <h3>Edges</h3>
          <ul>
            {graph.edges.map(e => (
              <li key={e.id}>
                {e.id}: {e.from} → {e.to} ({e.type})
                <button onClick={() => removeEdge(e.id)} style={{ marginLeft: 8 }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
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
          request_edges: graph.edges.filter(e => e.type === "request").map(e => [e.from, e.to]),
          allocation_edges: graph.edges.filter(e => e.type === "allocation").map(e => [e.from, e.to])
        }}
        positions={positions}
        cycle={detectionResult.cycles}
        backendVisualizationBase64={visualization}
        onRegenerate={analyzeGraph}
      />

    </div>
  );
}
