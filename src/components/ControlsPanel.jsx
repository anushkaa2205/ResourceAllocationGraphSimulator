// src/components/ControlsPanel.jsx
import React, { useState } from "react";
import {
  FiCpu,
  FiBox,
  FiTrash2,
  FiPlus,
  FiGitPullRequest,
  FiRefreshCcw,
  FiSearch
} from "react-icons/fi";

export default function ControlsPanel({
  processes = [],
  resources = [],

  onAddProcess = () => {},
  onAddResource = () => {},
  onRemoveProcess = () => {},
  onRemoveResource = () => {},
  onCreateEdge = () => {},
  onResetLayout = () => {},
  onResetGraph = () => {},
  analyzeGraph = () => {},

  onLoadDeadlock = () => {},
  onLoadSafe = () => {},
  onLoadComplex = () => {},
  onLoadMultiInstance = () => {},
  onLoadLongCycle = () => {},
  onLoadWeighted = () => {},
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState("request");

  const allNodes = [...processes, ...resources.map((r) => r.id)];

  function handleCreateEdge() {
    if (!from || !to) return alert("Select both nodes.");
    if (from === to) return alert("Cannot connect to same node.");
    onCreateEdge({ from, to, type, amount: 1 });

    setFrom("");
    setTo("");
  }

  return (
    <div
      style={{
        width: "100%",
        background: "transparent",
        color: "#fff",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}
    >
      {/* -------------------- ADD NODES -------------------- */}
      <div className="card">
        <h3 className="panel-title">Add Nodes</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }} onClick={onAddProcess}>
          <FiCpu /> &nbsp; Add Process
        </button>

        <button className="btn ghost" style={{ width: "100%" }} onClick={onAddResource}>
          <FiBox /> &nbsp; Add Resource
        </button>
      </div>

      {/* -------------------- REMOVE NODES -------------------- */}
      <div className="card">
        <h3 className="panel-title">Remove Nodes</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }} onClick={onRemoveProcess}>
          <FiTrash2 /> &nbsp; Remove Last Process
        </button>

        <button className="btn ghost" style={{ width: "100%" }} onClick={onRemoveResource}>
          <FiTrash2 /> &nbsp; Remove Last Resource
        </button>
      </div>

      {/* -------------------- SAMPLE GRAPHS -------------------- */}
      <div className="card">
        <h3 className="panel-title">Sample Graphs</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }} onClick={onLoadDeadlock}>
          Deadlock Example
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }} onClick={onLoadSafe}>
          Safe Example
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }} onClick={onLoadComplex}>
          Complex Example
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }} onClick={onLoadMultiInstance}>
          Multi-Instance Example
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }} onClick={onLoadLongCycle}>
          Long Cycle Example
        </button>

        <button className="btn ghost" style={{ width: "100%" }} onClick={onLoadWeighted}>
          Weighted Example
        </button>
      </div>

      {/* -------------------- ACTIONS -------------------- */}
      <div className="card">
        <h3 className="panel-title">Actions</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }} onClick={onResetLayout}>
          <FiRefreshCcw /> &nbsp; Reset Layout
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }} onClick={onResetGraph}>
          <FiTrash2 /> &nbsp; Reset Entire Graph
        </button>

        <button className="btn primary" style={{ width: "100%" }} onClick={analyzeGraph}>
          <FiSearch /> &nbsp; Analyze Graph
        </button>
      </div>

      {/* -------------------- CREATE EDGE -------------------- */}
      <div className="card">
        <h3 className="panel-title">Create Edge</h3>

        <select
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        >
          <option value="">From…</option>
          {allNodes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select
          value={to}
          onChange={(e) => setTo(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        >
          <option value="">To…</option>
          {allNodes.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          <option value="request">Request (P → R)</option>
          <option value="allocation">Allocation (R → P)</option>
        </select>

        <button className="btn primary" style={{ width: "100%" }} onClick={handleCreateEdge}>
          <FiGitPullRequest /> &nbsp; Create Edge
        </button>
      </div>
    </div>
  );
}
