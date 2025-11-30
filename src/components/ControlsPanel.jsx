import React, { useState } from "react";

export default function ControlsPanel({
  processes,
  resources,
  onAddProcess,
  onAddResource,
  onCreateEdge,
  onResetLayout,
  onResetGraph,
  analyzeGraph,
  onLoadDeadlock,
  onLoadSafe,
  onLoadComplex
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("request");

  const allNodes = [...processes, ...resources];

  function createEdge() {
    if (!from || !to) return alert("Select both nodes");
    onCreateEdge({ from, to, type });
  }

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* ACTION BUTTONS */}
      <div style={{ marginBottom: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={onAddProcess}>Add Process</button>
        <button onClick={onAddResource}>Add Resource</button>
        <button onClick={onResetLayout}>Reset Layout</button>
        <button onClick={onResetGraph}>Reset Graph</button>
        <button onClick={analyzeGraph}>Analyze Graph</button>

        {/* SAMPLE BUTTONS */}
        <button onClick={onLoadDeadlock}>Load Deadlock Example</button>
        <button onClick={onLoadSafe}>Load Safe Example</button>
        <button onClick={onLoadComplex}>Load Complex Example</button>
      </div>

      {/* EDGE CREATION SECTION */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "10px",
          padding: "10px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: "8px"
        }}
      >
        {/* FROM */}
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">From…</option>
          {allNodes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* TO */}
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">To…</option>
          {allNodes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* TYPE */}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="request">Request (P → R)</option>
          <option value="allocation">Allocation (R → P)</option>
        </select>

        <button onClick={createEdge}>Create Edge</button>
      </div>
    </div>
  );
}
