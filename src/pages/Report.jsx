// src/pages/Report.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BACKEND = "http://localhost:5000";

async function postAndDownload(endpoint, body, filename) {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => resp.statusText);
    throw new Error(`Server error: ${resp.status} ${txt}`);
  }

  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function Report() {
  const nav = useNavigate();
  const { state } = useLocation();

  const [graph] = useState(state?.graph || null);
  const [analysis] = useState(state?.analysis || null);
  const [cycle] = useState(state?.cycle || []);
  const [backendImage] = useState(state?.visualization || null);

  const [msg, setMsg] = useState("");

  const makePayload = (extra = {}) => ({
    processes: graph?.processes || [],
    resources: graph?.resources || [],
    request_edges:
      graph?.edges?.filter((e) => e.type === "request").map((e) => [e.from, e.to]) || [],
    allocation_edges:
      graph?.edges?.filter((e) => e.type === "allocation").map((e) => [e.from, e.to]) || [],
    analysis: analysis || {},
    backendVisualizationBase64: backendImage,
    ...extra,
  });

  async function exportPDF() {
    try {
      setMsg("Generating PDF...");
      // send theme: "B" (single default theme)
      const payload = makePayload({ format: "pdf", theme: "B" });
      await postAndDownload(`${BACKEND}/export`, payload, "system_report.pdf");
      setMsg("PDF downloaded");
    } catch (e) {
      console.error(e);
      setMsg("Error: " + e.message);
    }
  }

  async function exportPNG() {
    try {
      setMsg("Generating PNG...");
      const payload = makePayload({ format: "png" });
      await postAndDownload(`${BACKEND}/export`, payload, "visualization.png");
      setMsg("PNG downloaded");
    } catch (e) {
      console.error(e);
      setMsg("Error: " + e.message);
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>System Report</h1>

      <p>This page generates PDF/PNG exports of your RAG analysis (uses backend /export).</p>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => nav("/simulator")} className="btn">Back to Simulator</button>
        <button onClick={() => nav("/analysis")} className="btn" style={{ marginLeft: 10 }}>
          Back to Analysis
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        {/* single PDF button (default theme B) */}
        <button onClick={exportPDF} className="btn">Download PDF</button>

        {/* PNG */}
        <button onClick={exportPNG} className="btn" style={{ marginLeft: 10 }}>
          Download PNG
        </button>
      </div>

      {msg && (
        <div style={{ marginTop: 20, color: "#bfe6ff" }}>
          {msg}
        </div>
      )}

      <h3 style={{ marginTop: 30 }}>Graph Preview</h3>
      {backendImage ? (
        <img
          src={`data:image/png;base64,${backendImage}`}
          alt="backend-preview"
          style={{ maxWidth: "500px", border: "1px solid #444", borderRadius: 8 }}
        />
      ) : (
        <p>No backend preview available.</p>
      )}

      <h3>Cycle</h3>
      <p>{cycle?.length ? cycle.join(" → ") : "No cycle"}</p>

      <h3>Analysis Summary</h3>
      <pre style={{
        background: "rgba(255,255,255,0.06)",
        padding: 20,
        borderRadius: 8,
        color: "#ddd",
        overflowX: "auto"
      }}>
{JSON.stringify(analysis, null, 2)}
      </pre>
    </div>
  );
}
