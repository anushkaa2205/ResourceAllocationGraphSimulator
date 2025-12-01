export default function Feedback() {
  const wrap = { padding: 32, maxWidth: 900, margin: "48px auto", color: "#dfefff", fontFamily: "Inter, system-ui", background: "#08030a" };
  const card = { background: "linear-gradient(180deg, rgba(16,20,28,0.9), rgba(10,12,18,0.86))", borderRadius: 12, padding: 22, border: "1px solid rgba(255,255,255,0.02)", boxShadow: "0 18px 48px rgba(0,0,0,0.7)" };

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={{ margin: 0, color: "#eef7ff" }}>Feedback & Contact</h2>
        <p style={{ marginTop: 8, color: "#b8dff0" }}>
          Report bugs, request features or share classroom use — open an issue on the repo or email harshitamugdha@gmail.com
        </p>

        <form onSubmit={(e) => { e.preventDefault(); alert("Thanks — placeholder submission. Replace with your API."); }} style={{ marginTop: 12, display: "grid", gap: 10 }}>
          <input required aria-label="name" placeholder="Your name" style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.02)", background: "rgba(255,255,255,0.02)", color: "#eef7ff" }} />
          <input required type="email" aria-label="email" placeholder="Email" style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.02)", background: "rgba(255,255,255,0.02)", color: "#eef7ff" }} />
          <textarea required placeholder="Your feedback" rows={6} style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.02)", background: "rgba(255,255,255,0.02)", color: "#eef7ff" }} />

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(180deg,#00b4c7,#0077b6)", color: "#021222", fontWeight: 800 }}>Send Feedback</button>
            <button type="reset" style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.02)", background: "transparent", color: "#b8dff0" }}>Reset</button>
          </div>
        </form>
      </div>
    </div>
  );
}