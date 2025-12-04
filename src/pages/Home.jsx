import React from "react";  
import logoImg from "../assets/logo.png";   // or correct path

export default function Home() {

  // Inject animations once
  if (!document.getElementById("home-animations")) {
    const style = document.createElement("style");
    style.id = "home-animations";
    style.innerHTML = `
  @keyframes pulseGlow {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }

  .hover-glow:hover {
    box-shadow: 0 0 18px rgba(90,140,255,0.45) !important;
    transform: translateY(-3px);
    transition: 0.25s ease;
  }

  /* NETFLIX HOVER STYLE */
  .netflix-hover {
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                filter 0.28s ease;
  }

  .netflix-hover:hover {
    transform: translateY(-6px) scale(1.06);
    box-shadow: 0 18px 32px rgba(0,0,0,0.45),
                0 0 22px rgba(80,140,255,0.45);
    filter: brightness(1.15);
  }
`;


    document.head.appendChild(style);
  }

  const githubDocs = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  // AI Blue Premium Theme
  const theme = {
    // MAIN BACKGROUND
    bg: "radial-gradient(circle at 50% 0%, #123B86 0%, #071326 50%, #02050A 100%)",

    // SURFACES
    cardBg: "rgba(255,255,255,0.05)",
    cardBgStrong: "rgba(15,25,45,0.6)",
    border: "1px solid rgba(90,140,255,0.15)",

    // TEXT (FIXED)
    header: "#FFFFFF",         // pure white for main headings
    text: "#E1E7EF",           // soft white for normal text
    muted: "#A3AEC2",          // soft blue-gray
    paragraph: "#B9C3D4",      // lighter gray for descriptions

    // BLUE ACCENTS
    primary: "#5CAEFF",
    secondary: "#3F8CFF",
    accent: "#6EC8FF",
    accent2: "#78A7FF",
    accent3: "#93C7FF",

    buttonText: "#FFFFFF",

    // GLOWS
    glowLight: "0 0 18px rgba(90,140,255,0.35)",
    glowMedium: "0 0 30px rgba(80,160,255,0.45)",
    glowStrong: "0 0 55px rgba(110,170,255,0.55)",
  };

  const styles = {
    body: {
      minHeight: "100vh",
      minWidth: "100vw",
      background: theme.bg,
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column",
    },

    container: {
      width: "100vw",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      boxSizing: "border-box",
      paddingTop: "80px",
      paddingBottom: "40px",
      background: theme.bg,
    },

    hero: {
      width: "100%",
      maxWidth: "900px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginTop: "40px",
      marginBottom: "40px",
      textAlign: "center",
    },

    badge: {
      display: "inline-block",
      background: theme.accent,
      color: "#0F1520",
      fontWeight: 700,
      fontSize: 13,
      borderRadius: 6,
      padding: "3px 14px",
      marginBottom: 18,
    },

    heroTitle: {
      fontSize: 44,
      fontWeight: 800,
      color: theme.header,
      margin: 0,
      letterSpacing: 0.6,
      textShadow: "0 0 18px rgba(120,170,255,0.25)",
    },

    heroSubtitle: {
      fontSize: 18,
      color: theme.paragraph,
      margin: "18px 0 0 0",
      fontWeight: 400,
    },

    ctas: {
      display: "flex",
      gap: 16,
      marginTop: 28,
      justifyContent: "center",
    },

    primaryBtn: {
      background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent2})`,
      color: theme.buttonText,
      padding: "12px 28px",
      borderRadius: 12,
      border: "none",
      fontWeight: 700,
      fontSize: 17,
      cursor: "pointer",
      boxShadow: theme.glowLight,
    },

    preview: {
      margin: "40px 0 28px 0",
      padding: 28,
      borderRadius: 18,
      background: theme.cardBg,
      border: theme.border,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: 320,
      maxWidth: 600,
      boxShadow: theme.glowLight,
    },

    previewTitle: {
      fontWeight: 700,
      fontSize: 22,
      color: theme.header,
      marginBottom: 12,
    },

    previewText: {
      fontSize: 15,
      color: theme.text,
      textAlign: "center",
    },

    featuresTitle: {
      fontSize: 26,
      color: theme.header,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 20,
    },

    featuresSection: {
      width: "100%",
      margin: "28px 0",
    },

    featuresGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: 22,
      width: "100%",
      maxWidth: 1000,
      margin: "0 auto",
    },

    card: {
      background: theme.cardBg,
      borderRadius: 14,
      padding: 22,
      border: theme.border,
      minHeight: 110,
      color: theme.text,
      boxShadow: "0 0 12px rgba(0,0,0,0.25)",
    },

    cardTitle: {
      margin: 0,
      fontWeight: 700,
      fontSize: 18,
      color: theme.header,
    },

    cardText: {
      marginTop: 10,
      color: theme.paragraph,
      fontSize: 15,
    },

    howItWorks: {
      width: "100%",
      maxWidth: 900,
      margin: "38px auto 0 auto",
      textAlign: "center",
    },

    howTitle: {
      fontSize: 22,
      color: theme.header,
      fontWeight: 700,
      marginBottom: 14,
    },

    howDesc: {
      color: theme.paragraph,
      fontSize: 14,
    },

    finalCta: {
      margin: "40px 0 0 0",
      padding: 28,
      borderRadius: 18,
      background: theme.cardBg,
      border: theme.border,
      textAlign: "center",
      maxWidth: 700,
      boxShadow: theme.glowLight,
    },

    finalCtaTitle: {
      fontSize: 20,
      color: theme.header,
      fontWeight: 700,
      marginBottom: 10,
    },

    finalCtaText: {
      color: theme.paragraph,
      fontSize: 15,
      marginBottom: 18,
    },

    footer: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: theme.paragraph,
      borderTop: theme.border,
      marginTop: 38,
      padding: "14px 40px 10px 40px",
      background: theme.bg,
    },

    footerLink: {
      color: theme.primary,
      textDecoration: "none",
      fontWeight: 600,
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>

        {/* HERO */}
        <section style={styles.hero}>
          <div className="netflix-hover" style={styles.badge}>An Interactive Resource Allocation Graph Simulator</div>

         <h1 className="netflix-hover" style={styles.heroTitle}>

            Visualize & Detect <br /> System Deadlocks
          </h1>

          <div style={styles.heroSubtitle}>
            An interactive resource allocation graph simulator for teaching, debugging,
            and understanding deadlock scenarios in operating systems.
          </div>

          <div style={styles.ctas}>
            <a href="/simulator">
              <button className="hover-glow" style={styles.primaryBtn}>
                Launch Simulator
              </button>
            </a>

            <a href="/simulator#examples">
              <button className="hover-glow" style={styles.primaryBtn}>
                View Examples
              </button>
            </a>
          </div>
        </section>

        {/* GRAPH PREVIEW */}
        <section style={styles.preview}>
          <div style={styles.previewTitle}>Graph Preview</div>

          <div style={styles.previewText}>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 34,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 34,
                  color: theme.primary,
                  animation: "pulseGlow 2s infinite ease-in-out",
                }}
              >
                ◎
              </span>

              <span
                style={{
                  fontSize: 26,
                  color: theme.accent2,
                  animation: "pulseGlow 2.2s infinite ease-in-out",
                }}
              >
                ◼
              </span>

              <span
                style={{
                  fontSize: 34,
                  color: theme.primary,
                  animation: "pulseGlow 2s infinite ease-in-out",
                }}
              >
                ◎
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              Processes & Resources — Connect and simulate to see live graphs!
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section style={styles.featuresSection}>
          <div style={styles.featuresTitle}>Powerful Features</div>

          <div style={styles.featuresGrid}>
            {[
              "Interactive Graph Building",
              "Real-time Deadlock Detection",
              "Visual Feedback",
              "System Analysis",
              "Educational Tool",
              "Easy to Use",
            ].map((title, index) => (
              <div key={index} className="hover-glow netflix-hover" style={styles.card}>
                <div style={styles.cardTitle}>{title}</div>
                <div style={styles.cardText}>
                  {
                    [
                      "Click to add/remove processes and resources, drag to reposition, and assign edges with simple controls.",
                      "Instantly detect deadlock conditions as you allocate resources and update the graph.",
                      "Color-coded results and clear highlights for deadlocked processes and resources.",
                      "Get process, resource, allocation, and request summaries at a glance.",
                      "Perfect for teaching operating systems concepts, with step-by-step simulation and explanations.",
                      "Clean interface with guided workflows and rapid graph creation.",
                    ][index]
                  }
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={styles.howItWorks}>
  <div style={styles.howTitle}>How It Works</div>

  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 80,
    marginTop: 40
  }}>
    
    {/* Step 1 */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      width: "220px"
    }}>
      <div style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: theme.primary,
        color: "#000716",
        fontWeight: 700,
        fontSize: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        boxShadow: "0 0 18px rgba(90,140,255,0.55)"
      }}>1</div>

      <div style={{ color: theme.header, fontWeight: 700, marginBottom: 8 }}>Create Nodes</div>
      <div style={styles.howDesc}>Add processes and resources to your graph by clicking the canvas.</div>
    </div>

    {/* Step 2 */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      width: "220px"
    }}>
      <div style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: theme.primary,
        color: "#000716",
        fontWeight: 700,
        fontSize: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        boxShadow: "0 0 18px rgba(90,140,255,0.55)"
      }}>2</div>

      <div style={{ color: theme.header, fontWeight: 700, marginBottom: 8 }}>Connect Edges</div>
      <div style={styles.howDesc}>Draw allocation and request edges between processes and resources.</div>
    </div>

    {/* Step 3 */}
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      width: "220px"
    }}>
      <div style={{
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: theme.primary,
        color: "#000716",
        fontWeight: 700,
        fontSize: 26,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
        boxShadow: "0 0 18px rgba(90,140,255,0.55)"
      }}>3</div>

      <div style={{ color: theme.header, fontWeight: 700, marginBottom: 8 }}>Detect Deadlocks</div>
      <div style={styles.howDesc}>Run the detection algorithm to identify and visualize deadlocked processes.</div>
    </div>

  </div>
</section>

        {/* CTA */}
        <section style={styles.finalCta}>
          <div style={styles.finalCtaTitle}>Ready to Get Started?</div>
          <div style={styles.finalCtaText}>
            Launch the simulator now and start building resource allocation graphs to understand deadlock scenarios.
          </div>

          <div style={styles.ctas}>
            <a href="/simulator">
              <button className="hover-glow" style={styles.primaryBtn}>
                Start Simulator
              </button>
            </a>

            <a href="/simulator#examples">
              <button className="hover-glow" style={styles.primaryBtn}>
                View Examples
              </button>
            </a>
          </div>
        </section>

       {/* FOOTER */}
<footer style={styles.footer}>
  {/* LEFT SIDE: LOGO + COPYRIGHT */}
  <div style={{ 
    display: "flex", 
    alignItems: "center",      // <-- centers logo vertically
    gap: 12                    // <-- cleaner spacing between logo & text
  }}>
    
    <img
      src={logoImg}
      alt="RAG Logo"
      style={{
        width: 42,
        height: 42,
        objectFit: "contain",
        borderRadius: 8,
        background: "rgba(255,255,255,0.06)",
        padding: 4,
        boxShadow: "0 0 14px rgba(90,140,255,0.35)",
        cursor: "pointer",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
      }}
      className="footer-logo"
    />

    <span style={{ fontSize: 14 }}>
      © {new Date().getFullYear()} RAG Simulator
    </span>
  </div>

  {/* RIGHT SIDE LINKS */}
  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <a style={styles.footerLink} href="/about">About</a>
    <a style={styles.footerLink} href={githubDocs}>GitHub</a>
    <a style={styles.footerLink} href="/feedback">Feedback</a>
  </div>
</footer>

      </div>
    </div>
  );
}
