export default function About() {
  const github = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  const wrap = {
    padding: 32, maxWidth: 1100, margin: "48px auto", color: "#dfefff", fontFamily: "Inter, system-ui", background: "#08030a"
  };
  const card = {
    background: "linear-gradient(180deg, rgba(16,20,28,0.85), rgba(10,12,18,0.9))", // match Home infoCard
    borderRadius: 12, padding: 26, border: "1px solid rgba(255,255,255,0.02)",
    boxShadow: "0 22px 64px rgba(0,0,0,0.7), 0 0 24px rgba(0,120,180,0.04)"
  };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={{ margin: 0, color: "#eef7ff", fontSize: 28 }}>About RAG Simulator</h1>
        <p style={{ marginTop: 10, color: "#b8dff0", lineHeight: 1.6 }}>
          RAG Simulator is a technical visualization environment for modeling resource allocation graphs, stepping through assignments and releases, detecting cycles, and exploring fixes.
        </p>

        {/* small info cards with same palette */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 18 }}>
          <div style={{ padding: 14, borderRadius: 12, background: "linear-gradient(90deg, rgba(0,180,200,0.03), rgba(6,120,160,0.02))", border: "1px solid rgba(0,180,200,0.06)" }}>
            <h3 style={{ margin: 0, color: "#eef7ff" }}>Purpose</h3>
            <p style={{ marginTop: 8, color: "#a8dbe9" }}>Learn deadlock theory and visualize resource relationships.</p>
          </div>

          <div style={{ padding: 14, borderRadius: 12, background: "linear-gradient(90deg, rgba(46,59,78,0.03), rgba(8,12,18,0.02))", border: "1px solid rgba(46,59,78,0.04)" }}>
            <h3 style={{ margin: 0, color: "#eef7ff" }}>Audience</h3>
            <p style={{ marginTop: 8, color: "#a8dbe9" }}>Students, instructors and engineers diagnosing concurrency issues.</p>
          </div>
        </div>

        <p style={{ marginTop: 18, color: "#b8dff0" }}>
          Repo / Docs: <a href={github} target="_blank" rel="noopener noreferrer" style={{ color: "#00b4c7", fontWeight: 800 }}>GitHub</a>
        </p>
      </div>
    </div>
  );
}