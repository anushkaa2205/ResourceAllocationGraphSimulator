import React from "react";

export default function ControlsPanel({
  processes,
  resources,
  onAddProcess,
  onAddResource,
  onCreateEdge,
  onResetLayout,
  onResetGraph,
  onLoadSampleDeadlock,
  onLoadSampleSafe,
  onLoadSampleComplex,
  analyzeGraph
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        alignItems: "center",
        marginBottom: 10
      }}
    >
      {/* BASIC CONTROLS */}
      <button onClick={onAddProcess} className="btn-purple">
        Add Process
      </button>

      <button onClick={onAddResource} className="btn-purple">
        Add Resource
      </button>

      <button onClick={onCreateEdge} className="btn-blue">
        Create Edge
      </button>

      <button onClick={onResetLayout} className="btn-gray">
        Reset Layout
      </button>

      <button onClick={onResetGraph} className="btn-red">
        Reset Graph
      </button>

      <button onClick={analyzeGraph} className="btn-green">
        Analyze Graph
      </button>

      {/* SAMPLE GRAPH LOADERS */}
      <button onClick={onLoadSampleDeadlock} className="btn-orange">
        Load Deadlock Example
      </button>

      <button onClick={onLoadSampleSafe} className="btn-orange">
        Load Safe Example
      </button>

      <button onClick={onLoadSampleComplex} className="btn-orange">
        Load Complex Example
      </button>
    </div>
  );
}
