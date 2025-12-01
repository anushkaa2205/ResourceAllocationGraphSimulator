// src/pages/Simulator.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import ControlsPanel from "../components/ControlsPanel";
import GraphCanvas from "../components/GraphCanvas";
import DeadlockAlert from "../components/DeadlockAlert";
import VisualizerModal from "../components/VisualizerModal";

import { createEmptyGraph, detectDeadlockDetailed, detectDeadlockInstances } from "../utils/rag";
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
      const v = localStorage.getItem("rag_positions");
      return v ? JSON.parse(v) : {};
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
    try { localStorage.setItem("rag_positions", JSON.stringify(positions)); } catch {}
  }, [positions]);

  // cycle-based detection (for highlighting cycles in single-instance view)
  const cycleResult = detectDeadlockDetailed(graph);
  // multi-instance matrix detection (returns deadlocked boolean + list)
  const instanceResult = detectDeadlockInstances ? detectDeadlockInstances(graph) : { deadlocked: false, deadlockedProcesses: [] };

  // Compose a result object for UI components (DeadlockAlert expects { deadlocked, cycles })
  const detectionResult = {
    deadlocked: instanceResult.deadlocked,
    deadlockedProcesses: instanceResult.deadlockedProcesses || [],
    cycles: cycleResult?.cycles || []
  };

  useEffect(() => {
    const prediction = predictDeadlock({
      ...graph,
      cycles: detectionResult?.cycles || []
    });

    setAnalysis({
      explanation: explainDeadlock(graph, detectionResult?.cycles || []),
      fixes: getFixSuggestions(graph, detectionResult?.cycles || []),
      prediction,
      safety: isSafeState(graph),
      metrics: computeMetrics(graph)
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, detectionResult?.cycles?.length, detectionResult?.deadlocked]);

  /* ------------------ HELPERS ------------------ */
  const showToast = (text, ms = 1500) => {
    setToast(text);
    setTimeout(() => setToast(null), ms);
  };

  const defaultPosFor = (kind, i) => {
    return { x: 140 + i * 150, y: kind === "process" ? 150 : 350 };
  };

  /* ---------- SAMPLE + LAYOUT HELPERS ---------- */
  function computeDefaultPositions(g) {
    const pos = {};
    const p = g.processes.length;
    const r = g.resources.length;
    const gap = 900 / Math.max(1, Math.max(p, r));

    g.processes.forEach((id, i) => {
      pos[id] = { x: 120 + i * gap, y: 110 };
    });

    g.resources.forEach((resObj, i) => {
      pos[resObj.id] = { x: 120 + i * gap, y: 360 };
    });

    return pos;
  }

  function resetLayout() {
    const newPos = computeDefaultPositions(graph);
    setPositions(newPos);
    try { localStorage.setItem("rag_positions", JSON.stringify(newPos)); } catch {}
    showToast("Layout reset");
  }

  function sample_deadlock() {
    return {
      processes: ["P1", "P2"],
      resources: [{ id: "R1", instances: 1 }, { id: "R2", instances: 1 }],
      edges: [
        { id: "e1", from: "P1", to: "R1", type: "request", amount: 1 },
        { id: "e2", from: "R1", to: "P2", type: "allocation", amount: 1 },
        { id: "e3", from: "P2", to: "R2", type: "request", amount: 1 },
        { id: "e4", from: "R2", to: "P1", type: "allocation", amount: 1 }
      ]
    };
  }

  function sample_safe_simple() {
    return {
      processes: ["P1", "P2"],
      resources: [{ id: "R1", instances: 1 }, { id: "R2", instances: 1 }],
      edges: [
        { id: "e1", from: "R1", to: "P1", type: "allocation", amount: 1 },
        { id: "e2", from: "R2", to: "P2", type: "allocation", amount: 1 }
      ]
    };
  }

  function sample_complex() {
    return {
      processes: ["P1", "P2", "P3"],
      resources: [{ id: "R1", instances: 1 }, { id: "R2", instances: 1 }, { id: "R3", instances: 1 }],
      edges: [
        { id: "e1", from: "P1", to: "R1", type: "request", amount: 1 },
        { id: "e2", from: "R1", to: "P2", type: "allocation", amount: 1 },
        { id: "e3", from: "P2", to: "R2", type: "request", amount: 1 },
        { id: "e4", from: "R2", to: "P3", type: "allocation", amount: 1 },
        { id: "e5", from: "P3", to: "R3", type: "request", amount: 1 },
        { id: "e6", from: "R3", to: "P1", type: "allocation", amount: 1 }
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
    try { localStorage.setItem("rag_positions", JSON.stringify(pos)); } catch {}
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

  // now accepts instances count
  const addResource = (instances = 1) => {
    const id = "R" + (graph.resources.length + 1);
    const newRes = { id, instances: Number(instances) || 1 };
    setGraph(prev => {
      const updated = [...prev.resources, newRes];
      setPositions(p => ({
        ...p,
        [id]: defaultPosFor("resource", updated.length - 1)
      }));
      return { ...prev, resources: updated };
    });
    showToast(`Added ${id} (${newRes.instances})`);
  };

  // createEdge expects { from, to, type, amount }
  const createEdge = ({ from, to, type, amount = 1 }) => {
    if (!from || !to || !type) return;

    // prevent duplicate same-direction same-amount edges
    const exists = graph.edges.some(e => e.from === from && e.to === to && e.type === type && e.amount === amount);
    if (exists) {
      showToast("Edge already exists");
      return;
    }

    const id = "e" + EDGE_COUNTER++;
    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { id, from, to, type, amount: Number(amount) }]
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
    try { localStorage.removeItem("rag_positions"); } catch {}
    showToast("Graph reset");
  };

  const updateNodePosition = useCallback((id, x, y) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  /* ------------------ ANALYZE GRAPH ------------------ */
  const analyzeGraph = async () => {
    // build payload preserving instances and amounts
    const payload = {
      processes: graph.processes,
      resources: graph.resources, // array of { id, instances }
      request_edges: graph.edges.filter(e => e.type === "request").map(e => ({ from: e.from, to: e.to, amount: e.amount })),
      allocation_edges: graph.edges.filter(e => e.type === "allocation").map(e => ({ from: e.from, to: e.to, amount: e.amount }))
    };

    showToast("Analyzing system...");
    let backendResult;
    try {
      backendResult = await sendGraphToBackend(payload);
    } catch (err) {
      console.error("sendGraphToBackend threw:", err);
      showToast("Analysis failed (network). Check backend.");
      return;
    }

    if (!backendResult || backendResult.error) {
      console.error("Backend error result:", backendResult);
      showToast("Analysis failed: " + (backendResult?.error || "no response"));
      return;
    }

    // local detection results
    const localCycle = cycleResult;
    const localInstance = instanceResult;

    const composedAnalysis = {
      explanation: explainDeadlock(graph, localCycle.cycles || []),
      fixes: getFixSuggestions(graph, localCycle.cycles || []),
      prediction: predictDeadlock({ ...graph, cycles: localCycle.cycles || [] }),
      safety: isSafeState(graph),
      metrics: computeMetrics(graph),
      backend: {
        deadlock: backendResult.deadlock,
        cycle: backendResult.cycle,
        visualization: backendResult.visualization // base64 png
      },
      local: {
        cycleDetection: localCycle,
        instanceDetection: localInstance
      }
    };

    if (backendResult.visualization) setVisualization(backendResult.visualization);

    navigate("/analysis", {
      state: {
        graph,
        analysis: composedAnalysis,
        cycle: backendResult.cycle || localCycle.cycles
      }
    });
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
            cycles={detectionResult?.cycles || []}
            positions={positions}
            onPositionChange={updateNodePosition}
          />
        </div>

        <DeadlockAlert result={detectionResult} graph={graph} onResetGraph={resetGraph} />

        <h3 style={{ marginTop: 20 }}>Edges</h3>
        <ul>
          {graph.edges.map(e => (
            <li key={e.id} style={{ marginBottom: 6 }}>
              {e.id}: {e.from} → {e.to} ({e.type}) {e.amount ? `x${e.amount}` : ""}
              <button onClick={() => removeEdge(e.id)} style={{ marginLeft: 8 }}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {toast && <div className="toast-notice">{toast}</div>}

      <VisualizerModal
        open={visualizationOpen}
        onClose={() => setVisualizationOpen(false)}
        graph={{
          processes: graph.processes,
          resources: graph.resources,
          request_edges: graph.edges.filter(e => e.type === "request").map(e => ({ from: e.from, to: e.to, amount: e.amount })),
          allocation_edges: graph.edges.filter(e => e.type === "allocation").map(e => ({ from: e.from, to: e.to, amount: e.amount }))
        }}
        positions={positions}
        cycle={detectionResult?.cycles || []}
        backendVisualizationBase64={visualization}
        onRegenerate={analyzeGraph}
      />

    </div>
  );
}
