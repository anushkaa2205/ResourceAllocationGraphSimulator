// src/components/ControlsPanel.jsx
import React, { useState } from "react";

export default function ControlsPanel({
  processes = [],
  resources = [],                   // now objects: { id, instances }
  onAddProcess = () => {},
  onAddResource = () => {},         // will receive instance count
  onCreateEdge = () => {},          // must accept amount
  onResetLayout = () => {},
  onResetGraph = () => {},
  analyzeGraph = () => {},
  onLoadDeadlock = () => {},
  onLoadSafe = () => {},
  onLoadComplex = () => {}
}) {
  // local state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("request");
  const [amount, setAmount] = useState(1);
  const [instances, setInstances] = useState(1); // for adding resources

  // Combine processes + resource IDs for dropdowns
  const allNodes = [
    ...processes,
    ...resources.map(r => r.id)
  ];

  // create edge
  function createEdge() {
    if (!from || !to) {
      alert("Select both nodes.");
      return;
    }
    if (from === to) {
      alert("From and To cannot be the same.");
      return;
    }
    if (amount < 1) {
      alert("Amount must be ≥ 1");
      return;
    }

    onCreateEdge({
      from,
      to,
      type,
      amount: Number(amount)
    });

    setFrom("");
    setTo("");
    setAmount(1);
  }

  // Add resource (with instance count)
  function addResource() {
    if (instances < 1) {
      alert("Instances must be ≥ 1");
      return;
    }
    onAddResource(Number(instances));
    setInstances(1);
  }

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* TOP ACTION BUTTONS */}
      <div style={{ marginBottom: "12px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button onClick={onAddProcess}>Add Process</button>

        {/* Resource with instance count */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="number"
            min="1"
            value={instances}
            onChange={(e) => setInstances(e.target.value)}
            style={{ width: "60px" }}
          />
          <button onClick={addResource}>Add Resource</button>
        </div>

        <button onClick={onResetLayout}>Reset Layout</button>
        <button onClick={onResetGraph}>Reset Graph</button>
        <button onClick={analyzeGraph}>Analyze Graph</button>

        {/* sample examples */}
        <button onClick={onLoadDeadlock}>Deadlock Example</button>
        <button onClick={onLoadSafe}>Safe Example</button>
        <button onClick={onLoadComplex}>Complex Example</button>
      </div>

      {/* CREATE EDGE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginTop: "10px",
          padding: "10px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "8px"
        }}
      >
        {/* FROM NODE */}
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="">From…</option>
          {allNodes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* TO NODE */}
        <select value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">To…</option>
          {allNodes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {/* EDGE TYPE */}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="request">Request (P → R)</option>
          <option value="allocation">Allocation (R → P)</option>
        </select>

        {/* AMOUNT */}
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{ width: "70px" }}
        />

        <button onClick={createEdge}>Create Edge</button>
      </div>
    </div>
  );
}
