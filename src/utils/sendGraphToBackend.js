// src/utils/sendGraphToBackend.js
const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export async function sendGraphToBackend(payload) {
  try {
    console.log("Sending to backend:", BACKEND + "/analyze");
    const resp = await fetch(`${BACKEND}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch (err) {
    console.error("sendGraphToBackend error:", err);
    throw err;
  }
}
