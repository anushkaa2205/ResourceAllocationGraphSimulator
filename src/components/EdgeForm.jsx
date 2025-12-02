// src/components/EdgeForm.jsx
import React, { useState, useEffect, useRef } from "react";

/*
 EdgeForm
 Props:
  - processes: []
  - resources: []  (array of {id,instances} or strings)
  - onCreateEdge({ from, to, type, amount })
*/
export default function EdgeForm({ processes = [], resources = [], onCreateEdge }) {
  const [proc, setProc] = useState(processes[0] || "");
  const [res, setRes] = useState(resources.length ? (typeof resources[0] === "string" ? resources[0] : resources[0].id) : "");
  const [edgeType, setEdgeType] = useState("request");
  const [amount, setAmount] = useState(1);
  const [error, setError] = useState("");

  // unique radio name
  const radioName = useRef("etype_" + Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    setProc(processes[0] || "");
  }, [processes]);

  useEffect(() => {
    setRes(resources.length ? (typeof resources[0] === "string" ? resources[0] : resources[0].id) : "");
  }, [resources]);

  function submit(e) {
    e.preventDefault();
    setError("");

    if (!proc || !res) {
      setError("Please choose process and resource.");
      return;
    }
    if (typeof onCreateEdge !== "function") {
      setError("Create handler missing.");
      return;
    }
    const amt = Math.max(1, Math.floor(Number(amount) || 1));
    const payload = {
      from: edgeType === "request" ? proc : res,
      to: edgeType === "request" ? res : proc,
      type: edgeType,
      amount: amt
    };
    try {
      onCreateEdge(payload);
      setAmount(1);
    } catch (err) {
      setError(err?.message || "Unable to create edge.");
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12, flexWrap: "wrap" }}>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13 }}>Process</span>
        <select value={proc} onChange={(e) => setProc(e.target.value)}>
          <option value="">{processes.length ? "— select —" : "(no processes)"}</option>
          {processes.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13 }}>Resource</span>
        <select value={res} onChange={(e) => setRes(e.target.value)}>
          <option value="">{resources.length ? "— select —" : "(no resources)"}</option>
          {resources.map(r => {
            const id = typeof r === "string" ? r : r.id;
            return <option key={id} value={id}>{id}</option>;
          })}
        </select>
      </label>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="radio" name={radioName.current} value="request" checked={edgeType === "request"} onChange={() => setEdgeType("request")} />
          <small>Request (P → R)</small>
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="radio" name={radioName.current} value="allocation" checked={edgeType === "allocation"} onChange={() => setEdgeType("allocation")} />
          <small>Allocation (R → P)</small>
        </label>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <small>Amount</small>
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(Math.max(1, Number(e.target.value || 1)))} style={{ width: 72 }} />
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button type="submit" disabled={!proc || !res} style={{ padding: "8px 12px" }}>
          Create Edge
        </button>
        {error && <div style={{ color: "#ffb3b3", fontSize: 13 }}>{error}</div>}
      </div>
    </form>
  );
}
