export default function Feedback() {
  const theme = {
    bg: "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",

    cardBg: "rgba(16,22,34,0.88)",
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

  /* ---------- WRAPPER ---------- */
  const wrap = {
    padding: "52px 24px",
    maxWidth: 900,
    margin: "60px auto",
    color: theme.text,
    fontFamily: "Inter, system-ui",
    background: theme.bg,
    borderRadius: 18,
  };

  /* ---------- MAIN CARD ---------- */
  const card = {
    background: theme.cardBg,
    borderRadius: 16,
    padding: 32,
    border: theme.border,
    boxShadow: `${theme.glowLight}, 0 22px 60px rgba(0,0,0,0.65)`,
    backdropFilter: "blur(12px)",
    transition: "transform .25s ease, box-shadow .25s ease",
  };

  /* ---------- INPUT STYLES ---------- */
  const inputBase = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: theme.text,
    fontSize: 15,
    outline: "none",
    transition: "0.25s ease",
  };

  const inputHover = {
    border: "1px solid rgba(100,150,255,0.35)",
    boxShadow: theme.glowLight,
    background: "rgba(255,255,255,0.06)",
  };

  /* ---------- BUTTONS ---------- */
  const primaryBtn = {
    padding: "12px 18px",
    borderRadius: 12,
    border: "none",
    background: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
    color: "#00101F",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: theme.glowLight,
    transition: "transform .25s ease, box-shadow .25s ease",
  };

  const primaryHover = {
    transform: "translateY(-3px) scale(1.05)",
    boxShadow: theme.glowMedium,
  };

  const secondaryBtn = {
    padding: "12px 18px",
    borderRadius: 12,
    border: theme.border,
    background: "transparent",
    color: theme.paragraph,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform .25s ease, box-shadow .25s ease",
  };

  const secondaryHover = {
    transform: "translateY(-3px)",
    boxShadow: theme.glowLight,
    background: "rgba(255,255,255,0.03)",
  };

  return (
    <div style={wrap}>
      <div style={card}>
        
        {/* Heading (NO Netflix Hover) */}
        <h2 style={{ margin: 0, color: theme.header, fontSize: 28, fontWeight: 800 }}>
          Feedback & Contact
        </h2>

        <p style={{ marginTop: 10, color: theme.paragraph, lineHeight: 1.7 }}>
          Report bugs, request features, or share classroom use-cases.
          <br />
          You can open an issue on GitHub or email:{" "}
          <span style={{ color: theme.accent, fontWeight: 700 }}>
            harshitamugdha@gmail.com
          </span>
        </p>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Thanks — placeholder submission. Replace with your API.");
          }}
          style={{ marginTop: 18, display: "grid", gap: 14 }}
        >
          {/* NAME */}
          <input
            required
            placeholder="Your name"
            style={inputBase}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputHover)}
            onBlur={(e) =>
              Object.assign(e.currentTarget.style, inputBase)
            }
          />

          {/* EMAIL */}
          <input
            required
            type="email"
            placeholder="Email"
            style={inputBase}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputHover)}
            onBlur={(e) =>
              Object.assign(e.currentTarget.style, inputBase)
            }
          />

          {/* FEEDBACK TEXT */}
          <textarea
            required
            placeholder="Your feedback"
            rows={6}
            style={inputBase}
            onFocus={(e) => Object.assign(e.currentTarget.style, inputHover)}
            onBlur={(e) =>
              Object.assign(e.currentTarget.style, inputBase)
            }
          />

          {/* BUTTONS */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={primaryBtn}
              onMouseOver={(e) => Object.assign(e.currentTarget.style, primaryHover)}
              onMouseOut={(e) => Object.assign(e.currentTarget.style, primaryBtn)}
            >
              Send Feedback
            </button>

            <button
              type="reset"
              style={secondaryBtn}
              onMouseOver={(e) => Object.assign(e.currentTarget.style, secondaryHover)}
              onMouseOut={(e) => Object.assign(e.currentTarget.style, secondaryBtn)}
            >
              Reset
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
