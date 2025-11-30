import React, { useState, useEffect, useCallback } from "react";
import ControlsPanel from "./components/ControlsPanel";
import GraphCanvas from "./components/GraphCanvas";
import DeadlockAlert from "./components/DeadlockAlert";
import { createEmptyGraph, detectDeadlockDetailed } from "./utils/rag";
import { sendGraphToBackend } from "./utils/rag.js";


// MODULE 2
import { explainDeadlock } from "./analysis/explain";
import { getFixSuggestions } from "./analysis/advisor";
import { predictDeadlock } from "./analysis/predict";
import { isSafeState } from "./analysis/bankers";
import { computeMetrics } from "./analysis/metrics";

let EDGE_COUNTER = 1;

export default function App() {

  /* --------------------- APP STATE --------------------- */
  const [graph, setGraph] = useState(() => createEmptyGraph());
  const [positions, setPositions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("rag_positions")) || {};
    } catch {
      return {};
    }
  });

  const [toast, setToast] = useState(null);

  const [analysis, setAnalysis] = useState({
    explanation: null,
    fixes: null,
    prediction: null,
    safety: null,
    metrics: null
  });

  useEffect(() => {
    try {
      localStorage.setItem("rag_positions", JSON.stringify(positions));
    } catch {}
  }, [positions]);

  /* -------------------------- TOAST FUNCTION (ADD THIS) -------------------------- */
function showToast(text, ms = 1600) {
  setToast(text);
  setTimeout(() => setToast(null), ms);
}


  /* ------------------ ADD PROCESS & RESOURCE ------------------ */

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


  /* --------------------------- POSITIONS --------------------------- */

  function defaultPosFor(kind, index) {
    return { x: 140 + index * 150, y: kind === "process" ? 150 : 350 };
  }


  /* -------------------------- EDGE HANDLING -------------------------- */

  function createEdge({ from, to, type }) {
    if (!from || !to || !type) return;

    const exists = graph.edges.some(e => e.from === from && e.to === to && e.type === type);
    if (exists) return showToast("Edge already exists");

    const id = "e" + EDGE_COUNTER++;
    const edge = { id, from, to, type };

    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, edge]
    }));

    showToast(`Created edge ${id}`);
  }

  function removeEdge(id) {
    setGraph(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== id)
    }));
    showToast("Edge removed");
  }

   /* -------------------------- ANALYZE GRAPH (BACKEND CONNECT) -------------------------- */

   const analyzeGraph = async () => {
    console.log("Analyze clicked!");
  
    const graphToSend = {
      processes: graph.processes,     // correct
      resources: graph.resources,     // correct
      request_edges: graph.edges
        .filter(e => e.type === "request")
        .map(e => [e.from, e.to]),
  
      allocation_edges: graph.edges
        .filter(e => e.type === "allocation")
        .map(e => [e.from, e.to])
    };
  
    console.log("Sending to backend:", graphToSend);
  
    const result = await sendGraphToBackend(graphToSend);
  
    console.log("Result from backend:", result);
  
    if (result) {
      if (result.deadlock) {
        showToast("DEADLOCK: " + result.cycle.join(" → "));
      } else {
        showToast("Safe State — No Deadlock");
      }
    }
  };
  

  /* ----------------------------- RESET ----------------------------- */

  function resetGraph() {
    setGraph(createEmptyGraph());
    setPositions({});
    localStorage.removeItem("rag_positions");
    showToast("Graph reset");
  }


  /* -------------------------- DRAG UPDATE -------------------------- */

  const updateNodePosition = useCallback((nodeId, x, y) => {
    setPositions(prev => ({
      ...prev,
      [nodeId]: { x: Math.round(x), y: Math.round(y) }
    }));
  }, []);


  /* ---------------------- DEADLOCK DETECTION ---------------------- */

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


  /* ---------------------------- UI ----------------------------- */

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      overflowX: "hidden",
      overflowY: "auto"
    }}>

      {/* HEADER */}
      <div style={{
        padding: "20px 30px",
        background: "var(--topbar-bg)",
        borderBottom: "1px solid #333"
      }}>
        <h1 style={{ marginBottom: 15 }}>Resource Allocation Graph Simulator</h1>

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
      <div style={{
        display: "flex",
        width: "100%"
      }}>

        {/* SIDEBAR */}
        <div style={{
          width: 340,
          padding: "10px",
          overflow: "visible",
          background: "var(--sidebar-bg)",
          borderRight: "1px solid #333"
        }}>
          <h3>Current System State</h3>

          <p>Processes: {graph.processes.join(", ") || "(none)"}</p>
          <p>Resources: {graph.resources.join(", ") || "(none)"}</p>

          <div style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #444",
            background: "rgba(255,255,255,0.05)"
          }}>
            <h3>System Intelligence</h3>

            <p><strong>Explanation:</strong><br />{analysis.explanation?.explanation}</p>

            <p><strong>Fix Suggestions:</strong></p>
            <ul>
              {analysis.fixes?.map((s, i) => <li key={i}>{s}</li>)}
            </ul>

            <p><strong>Deadlock Risk:</strong><br />
              {analysis.prediction?.riskLevel} ({analysis.prediction?.riskPercent}%)
            </p>

            <p><strong>Safe State?</strong><br />
              {analysis.safety?.message}
            </p>

            {analysis.safety?.safeSequence?.length > 0 && (
              <p><strong>Safe Sequence:</strong><br />
                {analysis.safety.safeSequence.join(" → ")}
              </p>
            )}

            <p><strong>Total Edges:</strong> {analysis.metrics?.totalEdges}</p>
          </div>
        </div>

        {/* CANVAS AREA */}
{/* CANVAS AREA */}
<div style={{
  flex: 1,
  padding: "0px 0px 0px 0px",
  overflow: "visible"
}}>

  {/* ⭐ Increased graph height */}
  <div style={{ height: "420px"}}>
    <GraphCanvas
      graph={graph}
      cycles={detectionResult.cycles}
      positions={positions}
      onPositionChange={updateNodePosition}
    />
  </div>
 
  {/* ⭐ Deadlock alert right below the graph */}
  <div style={{ padding:"5px",marginTop: "0px" }}>
    <DeadlockAlert result={detectionResult} graph={graph} onResetGraph={resetGraph} />
  </div>

  {/* EDGE LIST */}
  <div style={{ padding:"5px",marginTop: 20 }}>
    <h3>Edges</h3>
    <ul>
      {graph.edges.map(e => (
        <li key={e.id}>
          {e.id}: {e.from} → {e.to} ({e.type})
          <button style={{ marginLeft: 10 }} onClick={() => removeEdge(e.id)}>Delete</button>
        </li>
      ))}
    </ul>
  </div>

</div>

      </div>

      {/* TOAST */}
      {toast ? (
        <div className="toast-notice">{toast}</div>
      ) : null}

    </div>
  );
}
