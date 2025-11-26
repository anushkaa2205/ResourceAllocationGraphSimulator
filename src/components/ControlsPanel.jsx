// src/components/ControlsPanel.jsx
import React from "react";
import EdgeForm from "./EdgeForm"; // keep if you use EdgeForm; otherwise adapt

export default function ControlsPanel({
  processes = [],
  resources = [],
  onAddProcess,
  onAddResource,
  onCreateEdge,
  onResetLayout,
  onResetGraph
}) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
        <button onClick={onAddProcess}>Add Process</button>
        <button onClick={onAddResource}>Add Resource</button>

        {/* Reset buttons */}
        <button onClick={onResetLayout} title="Re-align visible nodes to default layout">
          Reset Layout
        </button>
        <button onClick={onResetGraph} title="Clear all processes, resources and edges">
          Reset Graph
        </button>
      </div>

      <div style={{ marginTop: 6 }}>
        <small style={{ color: "#444" }}>
          Select a process and resource, then choose edge type and click "Create Edge".<br />
          <strong>Request (P → R)</strong> means the process is asking for the resource.<br />
          <strong>Allocation (R → P)</strong> means the resource is currently assigned to the process.
        </small>
      </div>

      {/* Edge creation form component (if available) */}
      {typeof EdgeForm === "function" ? (
        <EdgeForm processes={processes} resources={resources} onCreateEdge={onCreateEdge} />
      ) : null}
    </div>
  );
}
