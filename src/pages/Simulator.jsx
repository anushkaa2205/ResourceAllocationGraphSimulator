// src/pages/Simulator.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import ControlsPanel from "../components/ControlsPanel";
import GraphCanvas from "../components/GraphCanvas";
import DeadlockAlert from "../components/DeadlockAlert";
import VisualizerModal from "../components/VisualizerModal";

import {
  createEmptyGraph,
  detectDeadlockDetailed,
  detectDeadlockInstances
} from "../utils/rag";

import { sendGraphToBackend } from "../utils/sendGraphToBackend";
import { explainDeadlock } from "../analysis/explain";
import { getFixSuggestions } from "../analysis/advisor";
import { predictDeadlock } from "../analysis/predict";
import { isSafeState } from "../analysis/bankers";
import { computeMetrics } from "../analysis/metrics";

let EDGE_COUNTER = 1;

export default function Simulator() {
  const navigate = useNavigate();

  /* ---------------- STATE ---------------- */
  const [graph, setGraph] = useState(createEmptyGraph());
  const [positions, setPositions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rag_positions") || "{}");
    } catch {
      return {};
    }
  });

  const [toast, setToast] = useState(null);
  const [visualization, setVisualization] = useState(null);
  const [visualizationOpen, setVisualizationOpen] = useState(false);

  /* ---------------- DETECTION ---------------- */
  const cycleResult = React.useMemo(
    () => detectDeadlockDetailed(graph),
    [graph]
  );

  const instanceResult = React.useMemo(() => {
      return detectDeadlockInstances
        ? detectDeadlockInstances(graph)
        : { deadlocked: false, deadlockedProcesses: [] };
  }, [graph]);

  const detectionResult = React.useMemo(
    () => ({
      deadlocked:
        Array.isArray(cycleResult?.cycles) &&
        cycleResult.cycles.length > 0,
      cycles: cycleResult?.cycles || [],
    }),
    [cycleResult]
  );

  /* ---------------- SAVE POSITIONS ---------------- */
  useEffect(() => {
    try {
      localStorage.setItem("rag_positions", JSON.stringify(positions));
    } catch {}
  }, [positions]);

  /* ---------------- LIVE ANALYSIS ---------------- */
  const [analysis, setAnalysis] = useState({});
  useEffect(() => {
    setAnalysis({
      explanation: explainDeadlock(graph, detectionResult.cycles),
      fixes: getFixSuggestions(graph, detectionResult.cycles),
      prediction: predictDeadlock({
        ...graph,
        cycles: detectionResult.cycles,
      }),
      safety: isSafeState(graph),
      metrics: computeMetrics(graph),
    });
  }, [graph, detectionResult]);

  /* ---------------- TOAST ---------------- */
  const showToast = (msg, ms = 1500) => {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  };

  const defaultPosFor = (kind, index) => ({
    x: 200 + index * 200,
    y: kind === "process" ? 150 : 400,
  });

  /* ---------------- SAMPLE GRAPHS ---------------- */
  function loadSampleGraph(fn) {
    const g = fn();
    g.edges = g.edges.map((e, i) => ({ ...e, id: e.id || `e${i + 1}` }));
    setGraph(g);

    const pos = {};
    g.processes.forEach((p, i) => (pos[p] = defaultPosFor("process", i)));
    g.resources.forEach((r, i) => (pos[r.id] = defaultPosFor("resource", i)));

    setPositions(pos);
    showToast("Sample Loaded");
  }

  const sample_deadlock = () => ({
    processes: ["P1", "P2"],
    resources: [
      { id: "R1", instances: 1 },
      { id: "R2", instances: 1 },
    ],
    edges: [
      { id: "e1", from: "P1", to: "R1", type: "request" },
      { id: "e2", from: "R1", to: "P2", type: "allocation" },
      { id: "e3", from: "P2", to: "R2", type: "request" },
      { id: "e4", from: "R2", to: "P1", type: "allocation" },
    ],
  });

  const sample_safe = () => ({
    processes: ["P1", "P2"],
    resources: [
      { id: "R1", instances: 1 },
      { id: "R2", instances: 1 },
    ],
    edges: [
      { id: "e1", from: "R1", to: "P1", type: "allocation" },
      { id: "e2", from: "R2", to: "P2", type: "allocation" },
    ],
  });

  const sample_complex = () => ({
    processes: ["P1", "P2", "P3"],
    resources: [
      { id: "R1", instances: 1 },
      { id: "R2", instances: 1 },
      { id: "R3", instances: 1 },
    ],
    edges: [
      { id: "e1", from: "P1", to: "R1", type: "request" },
      { id: "e2", from: "R1", to: "P2", type: "allocation" },
      { id: "e3", from: "P2", to: "R2", type: "request" },
      { id: "e4", from: "R2", to: "P3", type: "allocation" },
      { id: "e5", from: "P3", to: "R3", type: "request" },
      { id: "e6", from: "R3", to: "P1", type: "allocation" },
    ],
  });

  const sample_multi = () => ({
    processes: ["P1", "P2", "P3"],
    resources: [
      { id: "R1", instances: 3 },
      { id: "R2", instances: 2 },
      { id: "R3", instances: 1 },
    ],
    edges: [
      { id: "e1", from: "R1", to: "P1", type: "allocation", amount: 1 },
      { id: "e2", from: "R1", to: "P2", type: "allocation", amount: 1 },
      { id: "e3", from: "P1", to: "R2", type: "request", amount: 1 },
      { id: "e4", from: "P2", to: "R3", type: "request", amount: 1 },
      { id: "e5", from: "P3", to: "R1", type: "request", amount: 1 },
    ],
  });

  const sample_long = () => ({
    processes: ["P1", "P2", "P3", "P4"],
    resources: [
      { id: "R1", instances: 1 },
      { id: "R2", instances: 1 },
      { id: "R3", instances: 1 },
      { id: "R4", instances: 1 },
    ],
    edges: [
      { id: "e1", from: "P1", to: "R1", type: "request" },
      { id: "e2", from: "R1", to: "P2", type: "allocation" },
      { id: "e3", from: "P2", to: "R2", type: "request" },
      { id: "e4", from: "R2", to: "P3", type: "allocation" },
      { id: "e5", from: "P3", to: "R3", type: "request" },
      { id: "e6", from: "R3", to: "P4", type: "allocation" },
      { id: "e7", from: "P4", to: "R4", type: "request" },
      { id: "e8", from: "R4", to: "P1", type: "allocation" },
    ],
  });

  const sample_weighted = () => ({
    processes: ["P1", "P2"],
    resources: [
      { id: "R1", instances: 5 },
      { id: "R2", instances: 3 },
    ],
    edges: [
      { id: "e1", from: "R1", to: "P1", type: "allocation", amount: 2 },
      { id: "e2", from: "R2", to: "P2", type: "allocation", amount: 1 },
      { id: "e3", from: "P1", to: "R2", type: "request", amount: 2 },
      { id: "e4", from: "P2", to: "R1", type: "request", amount: 3 },
    ],
  });

  /* ---------------- GRAPH OPERATIONS ---------------- */

  const addProcess = () => {
    const id = "P" + (graph.processes.length + 1);
    setGraph((prev) => ({
      ...prev,
      processes: [...prev.processes, id],
    }));

    setPositions((prev) => ({
      ...prev,
      [id]: defaultPosFor("process", graph.processes.length),
    }));

    showToast("Added " + id);
  };

  const addResource = (instances = 1) => {
    const id = "R" + (graph.resources.length + 1);
    const newRes = { id, instances: Number(instances) };

    setGraph((prev) => ({
      ...prev,
      resources: [...prev.resources, newRes],
    }));

    setPositions((prev) => ({
      ...prev,
      [id]: defaultPosFor("resource", graph.resources.length),
    }));

    showToast(`Added ${id} (${instances} instances)`);
  };

  const removeProcess = () => {
    if (!graph.processes.length) return;
    const pid = graph.processes.at(-1);

    setGraph((prev) => ({
      ...prev,
      processes: prev.processes.filter((p) => p !== pid),
      edges: prev.edges.filter((e) => e.from !== pid && e.to !== pid),
    }));

    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[pid];
      return copy;
    });

    showToast("Removed " + pid);
  };

  const removeResource = () => {
    if (!graph.resources.length) return;
    const rid = graph.resources.at(-1).id;

    setGraph((prev) => ({
      ...prev,
      resources: prev.resources.filter((r) => r.id !== rid),
      edges: prev.edges.filter((e) => e.from !== rid && e.to !== rid),
    }));

    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[rid];
      return copy;
    });

    showToast("Removed " + rid);
  };

  const createEdge = ({ from, to, type, amount = 1 }) => {
    const id = "e" + EDGE_COUNTER++;

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { id, from, to, type, amount }]
    }));

    showToast("Edge created");
  };

  const removeEdge = (id) => {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== id)
    }));
    showToast("Edge removed");
  };

  const resetGraph = () => {
    setGraph(createEmptyGraph());
    setPositions({});
    showToast("Graph Reset");
  };

  const updateNodePosition = useCallback((id, x, y) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
  }, []);

  /* ---------------- ALIGN TO RAG LAYOUT ---------------- */
  const alignRagLayout = () => {
    const pos = {};
    const width = 1100;
    const topY = 150;
    const bottomY = 380;

    const procGap = graph.processes.length > 1 ? width / (graph.processes.length - 1) : 0;
    const resGap = graph.resources.length > 1 ? width / (graph.resources.length - 1) : 0;

    graph.processes.forEach((p, i) => {
      pos[p] = { x: 80 + i * procGap, y: topY };
    });

    graph.resources.forEach((r, i) => {
      pos[r.id] = { x: 80 + i * resGap, y: bottomY };
    });

    setPositions(pos);
    showToast("Aligned to RAG layout");
  };

  /* ---------------- ANALYZE ---------------- */
  const analyzeGraph = async () => {
    const payload = {
      processes: graph.processes,
      resources: graph.resources,
      request_edges: graph.edges.filter(e => e.type === "request"),
      allocation_edges: graph.edges.filter(e => e.type === "allocation"),
    };

    showToast("Analyzing...");

    let backend = null;
    try {
      backend = await sendGraphToBackend(payload);
    } catch {
      showToast("Backend Offline");
      return;
    }

    setVisualization(backend.visualization || null);

    const composed = {
      explanation: explainDeadlock(graph, cycleResult.cycles),
      fixes: getFixSuggestions(graph, cycleResult.cycles),
      prediction: predictDeadlock({ ...graph, cycles: cycleResult.cycles }),
      safety: isSafeState(graph),
      metrics: computeMetrics(graph),
      backend,
      local: {
        cycleDetection: cycleResult,
        instanceDetection: instanceResult,
      },
    };

    navigate("/analysis", {
      state: {
        graph,
        analysis: composed,
        cycle: backend.cycle || cycleResult.cycles,
        positions,
      },
    });
  };

  /* ---------------------------------------------------------
                    UI + LAYOUT
  ----------------------------------------------------------*/
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",
      }}
    >
      {/* TOP BAR */}
      <div
        style={{
          padding: "20px 30px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(16,22,34,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(6px)",
        }}
      >
        <h1 style={{ color: "white", margin: 0 }}>RAG Simulator</h1>

        <button
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
            color: "#00101F",
            fontWeight: 800,
          }}
          onClick={() => navigate("/visualizer")}
        >
          Go to Visualizer →
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        
        {/* SIDEBAR */}
        <div
          style={{
            width: "320px",
            padding: "18px",
            background: "rgba(10,16,28,0.9)",
            backdropFilter: "blur(6px)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            overflowY: "auto",
          }}
        >
          <ControlsPanel
            processes={graph.processes}
            resources={graph.resources}
            onAddProcess={addProcess}
            onAddResource={addResource}
            onRemoveProcess={removeProcess}
            onRemoveResource={removeResource}
            onCreateEdge={createEdge}
            analyzeGraph={analyzeGraph}
            onResetGraph={resetGraph}
            onResetLayout={() => {
              const pos = {};
              graph.processes.forEach((p, i) => (pos[p] = defaultPosFor("process", i)));
              graph.resources.forEach((r, i) => (pos[r.id] = defaultPosFor("resource", i)));
              setPositions(pos);
              showToast("Layout Reset");
            }}
            onAlignRAG={alignRagLayout}
            onLoadDeadlock={() => loadSampleGraph(sample_deadlock)}
            onLoadSafe={() => loadSampleGraph(sample_safe)}
            onLoadComplex={() => loadSampleGraph(sample_complex)}
            onLoadMultiInstance={() => loadSampleGraph(sample_multi)}
            onLoadLongCycle={() => loadSampleGraph(sample_long)}
            onLoadWeighted={() => loadSampleGraph(sample_weighted)}
          />
        </div>

        {/* CANVAS AREA */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(145deg, #05080F, #0B1324)",
            padding: 14,
            overflow: "hidden",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* SCROLLABLE CANVAS FIX */}
          <div
            id="rag-canvas-scroll"
            style={{
              flex: 1,
              overflow: "auto",
              padding: 10,
            }}
          >
            {/* THIS WRAPPER PREVENTS CLIPPING */}
            <div style={{ minWidth: "1500px", minHeight: "800px", position: "relative" }}>
              <GraphCanvas
                graph={graph}
                cycles={detectionResult.deadlocked ? detectionResult.cycles : []}
                positions={positions}
                onPositionChange={updateNodePosition}
              />
            </div>
          </div>

          {/* DEADLOCK ALERT */}
          <DeadlockAlert result={detectionResult} graph={graph} onResetGraph={resetGraph} />

          {/* EDGE LIST */}
          <h3 style={{ marginTop: 20, color: "white" }}>Edges</h3>
          <ul style={{ color: "white" }}>
            {graph.edges.map(e => (
              <li key={e.id} style={{ marginBottom: 6 }}>
                {e.id}: {e.from} → {e.to} ({e.type})
                {e.amount > 1 ? ` x${e.amount}` : ""}
                <button
                  onClick={() => removeEdge(e.id)}
                  style={{
                    marginLeft: 10,
                    padding: "4px 8px",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "10px 20px",
            borderRadius: 10,
            fontWeight: 700,
          }}
        >
          {toast}
        </div>
      )}

      {/* VISUALIZER MODAL */}
      <VisualizerModal
        open={visualizationOpen}
        onClose={() => setVisualizationOpen(false)}
        graph={{
          processes: graph.processes,
          resources: graph.resources,
          request_edges: graph.edges.filter(e => e.type === "request"),
          allocation_edges: graph.edges.filter(e => e.type === "allocation"),
        }}
        positions={positions}
        cycle={detectionResult.cycles || []}
        backendVisualizationBase64={visualization}
        onRegenerate={analyzeGraph}
      />
    </div>
  );
}
