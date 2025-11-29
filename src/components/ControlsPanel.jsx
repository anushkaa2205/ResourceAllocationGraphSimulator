// src/components/ControlsPanel.jsx
import React from "react";

export default function ControlsPanel({
  processes = [],
  resources = [],
  onAddProcess,
  onAddResource,
  onCreateEdge,
  onResetLayout,
  onResetGraph,
  analyzeGraph
}) {
  const [process, setProcess] = React.useState("");
  const [resource, setResource] = React.useState("");
  const [type, setType] = React.useState("request");

  function handleCreate() {
    if (!process || !resource) return;
    onCreateEdge({
      from: type === "request" ? process : resource,
      to: type === "request" ? resource : process,
      type
    });
  }

  return (
    <div>
      {/* Buttons row */}
      <div className="controls" style={{ marginBottom: "16px" }}>
        <button className="btn-accent" onClick={onAddProcess}>Add Process</button>
        <button className="btn-accent" onClick={onAddResource}>Add Resource</button>
        <button onClick={onResetLayout}>Reset Layout</button>
        <button onClick={onResetGraph}>Reset Graph</button>
        <button onClick={analyzeGraph}>Analyze Graph</button>

      </div>

      {/* Edge creation controls */}
      <div className="controls">
        {/* Process Select */}
        <div className="select-wrap">
          <select
            value={process}
            onChange={(e) => setProcess(e.target.value)}
          >
            <option value="">Process</option>
            {processes.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Resource Select */}
        <div className="select-wrap">
          <select
            value={resource}
            onChange={(e) => setResource(e.target.value)}
          >
            <option value="">Resource</option>
            {resources.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Edge Type Radio */}
        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            name="etype"
            checked={type === "request"}
            onChange={() => setType("request")}
          />{" "}
          Request (P → R)
        </label>

        <label style={{ marginLeft: "10px" }}>
          <input
            type="radio"
            name="etype"
            checked={type === "allocation"}
            onChange={() => setType("allocation")}
          />{" "}
          Allocation (R → P)
        </label>

        {/* Create Edge Button */}
        <button onClick={handleCreate} style={{ marginLeft: "12px" }}>
          Create Edge
        </button>
      </div>

      <small className="hint" style={{ marginTop: "8px" }}>
        Tip: Request edges are dashed. Allocation edges are solid.
      </small>
    </div>
  );
}
