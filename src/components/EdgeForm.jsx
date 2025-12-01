// src/components/EdgeForm.jsx
import React, { useState } from "react";

export default function EdgeForm({ processes = [], resources = [], onCreateEdge }) {
  const [proc, setProc] = useState("");
  const [res, setRes] = useState("");
  const [type, setType] = useState("request");
  const [amount, setAmount] = useState(1);

  function submit(e) {
    e.preventDefault();
    if (!proc || !res) return;

    onCreateEdge({
      from: type === "request" ? proc : res,
      to: type === "request" ? res : proc,
      type,
      amount: Number(amount)
    });
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 10, display: "flex", gap: 10 }}>
      <select value={proc} onChange={(e) => setProc(e.target.value)}>
        <option value="">Process</option>
        {processes.map(p => <option key={p} value={p}>{p}</option>)}
      </select>

      <select value={res} onChange={(e) => setRes(e.target.value)}>
        <option value="">Resource</option>
        {resources.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
      </select>

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="request">Request</option>
        <option value="allocation">Allocation</option>
      </select>

      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{ width: 70 }}
      />

      <button type="submit">Create Edge</button>
    </form>
  );
}
