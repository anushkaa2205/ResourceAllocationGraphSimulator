export default function About() {
  const github = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  // AI Blue Theme (matches Home)
  const theme = {
    bg: "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",

    cardBg: "rgba(255,255,255,0.05)",
    cardStrong: "rgba(16,22,34,0.88)",
    border: "1px solid rgba(80,140,255,0.14)",

    header: "#FFFFFF",
    text: "#E1E7EF",
    muted: "#A3AEC2",
    paragraph: "#B9C3D4",

    primary: "#5CAEFF",
    accent: "#6EC8FF",

    glowLight: "0 0 18px rgba(90,140,255,0.35)",
    glowMedium: "0 0 32px rgba(80,140,255,0.45)",
  };

  // WRAPPER
  const wrap = {
    padding: "52px 24px",
    maxWidth: 1100,
    margin: "60px auto",
    color: theme.text,
    fontFamily: "Inter, system-ui",
    background: theme.bg,
    borderRadius: 18,
  };

  // MAIN CARD
  const card = {
    background: theme.cardStrong,
    borderRadius: 16,
    padding: 32,
    border: theme.border,
    boxShadow: `${theme.glowLight}, 0 22px 64px rgba(0,0,0,0.7)`,
    backdropFilter: "blur(12px)",
  };

  // Sub cards
  const infoCard = {
    padding: 18,
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: theme.border,
    boxShadow: "0 0 18px rgba(0,0,0,0.2)",
    transition: "transform .25s ease, box-shadow .25s ease",
  };

  const infoCardHover = {
    transform: "translateY(-4px) scale(1.04)",
    boxShadow: theme.glowMedium,
    background: "rgba(255,255,255,0.06)",
  };

  return (
    <div style={wrap}>
      <div style={card}>

        {/* Title */}
        <h1
  style={{
    margin: 0,
    color: theme.header,
    fontSize: 32,
    fontWeight: 800,
    textShadow: "0 0 20px rgba(120,150,255,0.25)",
  }}
>
  About RAG Simulator
</h1>


        {/* Description */}
        <p style={{ marginTop: 14, color: theme.paragraph, lineHeight: 1.7, fontSize: 15 }}>
          RAG Simulator is a modern teaching and debugging tool for visualizing Resource Allocation Graphs,
          understanding deadlock theory, and exploring request–allocation dynamics through interactive simulation.
        </p>

        {/* Info Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
            gap: 18,
            marginTop: 28,
          }}
        >
          {/* Card 1 */}
          <div
            className="infoCard"
            style={infoCard}
            onMouseOver={(e) => Object.assign(e.currentTarget.style, infoCardHover)}
            onMouseOut={(e) =>
              Object.assign(e.currentTarget.style, {
                ...infoCard,
                background: "rgba(255,255,255,0.04)",
                transform: "none",
              })
            }
          >
            <h3 style={{ margin: 0, color: theme.header, fontSize: 18 }}>Purpose</h3>
            <p style={{ marginTop: 8, color: theme.paragraph, fontSize: 14 }}>
              Help learners visualize deadlock formation, prevention, and resource distribution.
            </p>
          </div>

          {/* Card 2 */}
          <div
            className="infoCard"
            style={infoCard}
            onMouseOver={(e) => Object.assign(e.currentTarget.style, infoCardHover)}
            onMouseOut={(e) =>
              Object.assign(e.currentTarget.style, {
                ...infoCard,
                background: "rgba(255,255,255,0.04)",
                transform: "none",
              })
            }
          >
            <h3 style={{ margin: 0, color: theme.header, fontSize: 18 }}>Audience</h3>
            <p style={{ marginTop: 8, color: theme.paragraph, fontSize: 14 }}>
              Students, professors, software engineers, and anyone studying concurrency & OS concepts.
            </p>
          </div>
        </div>

        {/* GitHub Link */}
        <p style={{ marginTop: 24, color: theme.text, fontSize: 15 }}>
          Repository:{" "}
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="netflix-hover"
            style={{
              color: theme.primary,
              fontWeight: 800,
              textDecoration: "none",
              padding: "4px 6px",
              borderRadius: 6,
              transition: "0.25s",
            }}
          >
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}
