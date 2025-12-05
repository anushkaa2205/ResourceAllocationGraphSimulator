// src/components/ControlsPanel.jsx
import React, { useState, useEffect } from "react";
import {
  FiCpu,
  FiBox,
  FiTrash2,
  FiGitPullRequest,
  FiRefreshCcw,
  FiSearch,
  FiSliders
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
  onAlignRAG = () => {},
  onResetGraph = () => {},
  analyzeGraph = () => {},

  onLoadDeadlock = () => {},
  onLoadSafe = () => {},
  onLoadComplex = () => {},
  onLoadMultiInstance = () => {},
  onLoadLongCycle = () => {},
  onLoadWeighted = () => {},
  onStartTutorial = () => {},
}) {
  // Create Edge states
  const [proc, setProc] = useState("");
  const [res, setRes] = useState("");
  const [type, setType] = useState("request");
  const [amount, setAmount] = useState(1);

  // Add resource with instances
  const [resourceInstances, setResourceInstances] = useState(1);

  useEffect(() => {
    setProc(processes[0] || "");
  }, [processes]);

  useEffect(() => {
    if (resources.length > 0) {
      setRes(typeof resources[0] === "string" ? resources[0] : resources[0].id);
    }
  }, [resources]);

  function createEdgeHandler() {
    if (!proc || !res) return alert("Please select process and resource.");

    let from, to;

if (type === "request") {
  from = proc;
  to = res;
} 
else if (type === "allocation") {
  from = res;
  to = proc;
}
else if (type === "claim") {
  from = proc;   // ALWAYS P → R
  to = res;
}

const payload = { from, to, type, amount: Number(amount) };


    onCreateEdge(payload);
    setAmount(1);
  }

  return (
    <div
      style={{
        width: "100%",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: "18px"
      }}
    >

      {/* ADD NODES */}
      <div className="card">
        <h3 className="panel-title">Add Nodes</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }}
          onClick={onAddProcess}>
          <FiCpu /> &nbsp; Add Process
        </button>

        {/* Add Resource WITH INSTANCES */}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="number"
            min="1"
            value={resourceInstances}
            onChange={(e) =>
              setResourceInstances(Math.max(1, Number(e.target.value)))
            }
            placeholder="Instances"
            style={{
              width: "45%",
              padding: 6,
              borderRadius: 8,
              background: "#111",
              border: "1px solid #444",
              color: "#fff",
            }}
          />
          <button className="btn ghost" style={{ width: "55%" }}
            onClick={() => onAddResource(resourceInstances)}>
            <FiBox /> &nbsp; Add Resource
          </button>
        </div>
      </div>


      {/* REMOVE NODES */}
      <div className="card">
        <h3 className="panel-title">Remove Nodes</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }}
          onClick={onRemoveProcess}>
          <FiTrash2 /> &nbsp; Remove Last Process
        </button>

        <button className="btn ghost" style={{ width: "100%" }}
          onClick={onRemoveResource}>
          <FiTrash2 /> &nbsp; Remove Last Resource
        </button>
      </div>


      {/* SAMPLE GRAPHS */}
      <div className="card">
        <h3 className="panel-title">Sample Graphs</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }}
          onClick={onLoadDeadlock}>Deadlock Example</button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }}
          onClick={onLoadSafe}>Safe Example</button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }}
          onClick={onLoadComplex}>Complex Example</button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }}
          onClick={onLoadMultiInstance}>Multi-Instance Example</button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 6 }}
          onClick={onLoadLongCycle}>Long Cycle Example</button>

        <button className="btn ghost" style={{ width: "100%" }}
          onClick={onLoadWeighted}>Weighted Example</button>
      </div>


      {/* ACTIONS */}
      <div className="card">
        <h3 className="panel-title">Actions</h3>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }}
          onClick={onResetLayout}>
          <FiRefreshCcw /> &nbsp; Reset Layout
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }}
          onClick={onAlignRAG}>
          <FiSliders /> &nbsp; Align to RAG Layout
        </button>

        <button className="btn ghost" style={{ width: "100%", marginBottom: 8 }}
          onClick={onResetGraph}>
          <FiTrash2 /> &nbsp; Reset Entire Graph
        </button>
            <button
  className="btn ghost"
  style={{ width: "100%", marginBottom: 8 }}
  onClick={() => onStartTutorial()}
>
  📘 Tutorial Guide
</button>
        <button className="btn primary" style={{ width: "100%" }}
          onClick={analyzeGraph}>
          <FiSearch /> &nbsp; Analyze Graph
        </button>
        
      </div>


      {/* CREATE EDGE (your favorite version) */}
      <div className="card">
        <h3 className="panel-title">Create Edge</h3>

        {/* PROCESS */}
        <label style={{ fontSize: 14, marginBottom: 4 }}>Process</label>
        <select
          value={proc}
          onChange={(e) => setProc(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          {processes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {/* RESOURCE */}
        <label style={{ fontSize: 14, marginBottom: 4 }}>Resource</label>
        <select
          value={res}
          onChange={(e) => setRes(e.target.value)}
          style={{ width: "100%", marginBottom: 10 }}
        >
          {resources.map((r) => {
            const id = typeof r === "string" ? r : r.id;
            return <option key={id} value={id}>{id}</option>;
          })}
        </select>

        {/* TYPE RADIO */}
        {/* TYPE RADIO */}
<div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
  <label>
    <input
      type="radio"
      checked={type === "request"}
      onChange={() => setType("request")}
    />{" "}
    Request (P → R)
  </label>

  <label>
    <input
      type="radio"
      checked={type === "allocation"}
      onChange={() => setType("allocation")}
    />{" "}
    Allocation (R → P)
  </label>

  <label>
    <input
      type="radio"
      checked={type === "claim"}
      onChange={() => setType("claim")}
    />{" "}
    Claim (P → R)
  </label>
</div>

        {/* AMOUNT */}
        <label style={{ fontSize: 14 }}>Amount</label>
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
          style={{
            width: "100%",
            marginBottom: 12,
            padding: 6,
            borderRadius: 8,
            background: "#111",
            border: "1px solid #444",
            color: "#fff",
          }}
        />

        <button className="btn primary" style={{ width: "100%" }}
          onClick={createEdgeHandler}>
          <FiGitPullRequest /> &nbsp; Create Edge
        </button>
      </div>
    </div>
  );
}
