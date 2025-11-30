export async function sendGraphToBackend(graph) {
  try {
    const res = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graph)
    });

    return await res.json();
  } catch (err) {
    console.error("Backend error:", err);
    return null;
  }
}
