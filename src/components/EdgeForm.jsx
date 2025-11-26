// src/components/EdgeForm.jsx
import React, { useState, useEffect } from "react";

export default function EdgeForm({ processes, resources, onCreateEdge }) {
  const [proc, setProc] = useState("");
  const [res, setRes] = useState("");
  const [edgeType, setEdgeType] = useState("request");

  useEffect(() => {
    // initialize selects when lists change
    if (processes.length && !proc) setProc(processes[0]);
    if (resources.length && !res) setRes(resources[0]);
  }, [processes, resources]);

  function submit(e) {
    e.preventDefault();
    if (!proc || !res) return alert("Pick both process and resource.");
    onCreateEdge({
      from: edgeType === "request" ? proc : res,
      to: edgeType === "request" ? res : proc,
      type: edgeType
    });
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
      <label>
        Process
        <select value={proc} onChange={(e)=>setProc(e.target.value)} style={{ marginLeft: 6 }}>
          <option value="">—</option>
          {processes.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </label>

      <label>
        Resource
        <select value={res} onChange={(e)=>setRes(e.target.value)} style={{ marginLeft: 6 }}>
          <option value="">—</option>
          {resources.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      <div style={{ display: "flex", gap: 6 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="radio" name="etype" checked={edgeType==="request"} onChange={()=>setEdgeType("request")} />
          Request (P → R)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input type="radio" name="etype" checked={edgeType==="allocation"} onChange={()=>setEdgeType("allocation")} />
          Allocation (R → P)
        </label>
      </div>

      <button type="submit">Create Edge</button>
    </form>
  );
}
