import React from "react";  

export default function Home() {
  const githubDocs = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  // Attractive, modern dark theme with lively accent colors (not punky)
  const theme = {
    primary: "#4f8cff",      // lively blue
    secondary: "#a5b4fc",    // soft indigo
    accent: "#fbbf24",       // warm yellow
    accent2: "#34d399",      // teal/green
    bg: "#181f2a",           // dark background
    cardBg: "#232b3b",       // card background
    border: "1px solid #334155",
    navBg: "linear-gradient(90deg, #232b3b 0%, #334155 100%)",
    text: "#f1f5f9",
    muted: "#64748b",
    buttonText: "#fff",
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
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      width: "100vw",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      boxSizing: "border-box",
      padding: "0",
      margin: "0",
      background: theme.bg,
    },
    header: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "24px 40px 12px 40px",
      borderBottom: theme.border,
      boxSizing: "border-box",
      background: theme.navBg,
      position: "sticky",
      top: 0,
      zIndex: 10,
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 8,
      background: `linear-gradient(135deg, ${theme.primary} 60%, ${theme.accent2} 100%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: theme.buttonText,
      fontWeight: 700,
      fontSize: 20,
      letterSpacing: 1,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      boxShadow: "0 2px 8px 0 rgba(79,140,255,0.15)",
    },
    nav: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    navLink: {
      color: theme.primary,
      textDecoration: "none",
      fontWeight: 600,
      fontSize: 16,
      padding: "8px 16px",
      borderRadius: 6,
      background: "#232b3b",
      border: "none",
      transition: "background 0.2s",
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    hero: {
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: 48,
      marginBottom: 32,
      textAlign: "center",
    },
    badge: {
      display: "inline-block",
      background: theme.accent,
      color: "#232b3b",
      fontWeight: 700,
      fontSize: 13,
      borderRadius: 6,
      padding: "3px 14px",
      marginBottom: 16,
      letterSpacing: 1,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    heroTitle: {
      fontSize: 40,
      fontWeight: 800,
      color: theme.primary,
      margin: 0,
      letterSpacing: 0.5,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      textShadow: "0 2px 8px rgba(79,140,255,0.08)",
    },
    heroSubtitle: {
      fontSize: 18,
      color: theme.secondary,
      margin: "16px 0 0 0",
      fontWeight: 400,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    ctas: {
      display: "flex",
      gap: 16,
      marginTop: 28,
      justifyContent: "center",
    },
    primaryBtn: {
      background: `linear-gradient(90deg, ${theme.primary} 60%, ${theme.accent2} 100%)`,
      color: theme.buttonText,
      padding: "12px 28px",
      borderRadius: 12,
      border: "none",
      fontWeight: 700,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      fontSize: 17,
      cursor: "pointer",
      letterSpacing: 0.5,
      transition: "background .18s, box-shadow .18s",
      boxShadow: "0 2px 8px 0 rgba(52,211,153,0.10)",
    },
    ghostBtn: {
      background: "#232b3b",
      border: `1px solid ${theme.primary}`,
      padding: "12px 24px",
      borderRadius: 12,
      cursor: "pointer",
      color: theme.primary,
      fontWeight: 600,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      fontSize: 17,
      letterSpacing: 0.5,
      transition: "background .18s, border .18s",
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
      minHeight: 140,
      maxWidth: 600,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      boxShadow: "0 2px 12px 0 rgba(75,85,99,0.10)",
    },
    previewTitle: {
      fontWeight: 700,
      fontSize: 20,
      color: theme.accent2,
      marginBottom: 8,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    previewText: {
      fontSize: 15,
      color: theme.secondary,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    featuresSection: {
      width: "100%",
      margin: "28px 0",
    },
    featuresTitle: {
      fontSize: 25,
      color: theme.primary,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 20,
      letterSpacing: 0.5,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
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
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      boxShadow: "0 2px 8px 0 rgba(52,211,153,0.07)",
    },
    cardTitle: {
      margin: 0,
      fontWeight: 700,
      fontSize: 18,
      color: theme.accent,
      letterSpacing: 0.5,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    cardText: {
      marginTop: 10,
      color: theme.secondary,
      fontSize: 15,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    howItWorks: {
      width: "100%",
      maxWidth: 900,
      margin: "38px auto 0 auto",
      textAlign: "center",
    },
    howTitle: {
      fontSize: 21,
      color: theme.primary,
      fontWeight: 700,
      marginBottom: 14,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    howSteps: {
      display: "flex",
      justifyContent: "center",
      gap: 38,
      marginTop: 18,
      flexWrap: "wrap",
    },
    howStep: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      maxWidth: 200,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    howIcon: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: theme.accent2,
      border: "none",
      color: "#232b3b",
      fontSize: 22,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    howLabel: {
      fontWeight: 700,
      color: theme.primary,
      fontSize: 16,
      marginBottom: 4,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    howDesc: {
      color: theme.secondary,
      fontSize: 14,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    finalCta: {
      margin: "40px 0 0 0",
      padding: 28,
      borderRadius: 18,
      background: theme.cardBg,
      border: theme.border,
      textAlign: "center",
      width: "100%",
      maxWidth: 700,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
      boxShadow: "0 2px 12px 0 rgba(251,191,36,0.07)",
    },
    finalCtaTitle: {
      fontSize: 19,
      color: theme.accent,
      fontWeight: 700,
      marginBottom: 10,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    finalCtaText: {
      color: theme.secondary,
      fontSize: 15,
      marginBottom: 18,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    footer: {
      width: "100%",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: theme.secondary,
      fontSize: 15,
      borderTop: theme.border,
      marginTop: 38,
      padding: "14px 40px 10px 40px",
      boxSizing: "border-box",
      background: theme.bg,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
    footerLinks: {
      display: "flex",
      gap: 18,
    },
    footerLink: {
      color: theme.primary,
      textDecoration: "none",
      fontWeight: 600,
      fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    },
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logo}>
            <div style={styles.logoBox}>RAG</div>
            <div>
              <span style={{ fontWeight: 700, fontSize: 18, color: theme.primary, letterSpacing: 1, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
                RAG Simulator
              </span>
            </div>
          </div>
          <nav style={styles.nav}>
            <a href={githubDocs} target="_blank" rel="noopener noreferrer" style={styles.navLink}>
              Documentation
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section style={styles.hero}>
          <div style={styles.badge}>An Interactive Resource Allocation Graph Simulator</div>
          <h1 style={styles.heroTitle}>Visualize & Detect<br />System Deadlocks</h1>
          <div style={styles.heroSubtitle}>
            An interactive resource allocation graph simulator for teaching, debugging, and understanding deadlock scenarios in operating systems.
          </div>
          <div style={styles.ctas}>
            <a href="/simulator">
              <button style={styles.primaryBtn}>Launch Simulator</button>
            </a>
            <a href="/simulator#examples">
              <button style={styles.ghostBtn}>View Examples</button>
            </a>
          </div>
        </section>

        {/* Graph Preview */}
        <section style={styles.preview}>
          <div style={styles.previewTitle}>Graph Preview</div>
          <div style={styles.previewText}>
            <span style={{ fontSize: 28, letterSpacing: 8, color: theme.primary }}>◎ ◼ ◎</span>
            <div style={{ marginTop: 8 }}>
              Processes & Resources — Connect and simulate to see live graphs!
            </div>
          </div>
        </section>

        {/* Features */}
        <section style={styles.featuresSection}>
          <div style={styles.featuresTitle}>Powerful Features</div>
          <div style={styles.featuresGrid}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Interactive Graph Building</div>
              <div style={styles.cardText}>Click to add/remove processes and resources, drag to reposition, and assign edges with simple controls.</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Real-time Deadlock Detection</div>
              <div style={styles.cardText}>Instantly detect deadlock conditions as you allocate resources and update the graph.</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Visual Feedback</div>
              <div style={styles.cardText}>Color-coded results and clear highlights for deadlocked processes and resources.</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>System Analysis</div>
              <div style={styles.cardText}>Get process, resource, allocation, and request summaries at a glance.</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Educational Tool</div>
              <div style={styles.cardText}>Perfect for teaching operating systems concepts, with step-by-step simulation and explanations.</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Easy to Use</div>
              <div style={styles.cardText}>Clean interface with guided workflows and rapid graph creation.</div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section style={styles.howItWorks}>
          <div style={styles.howTitle}>How It Works</div>
          <div style={styles.howSteps}>
            <div style={styles.howStep}>
              <div style={styles.howIcon}>1</div>
              <div style={styles.howLabel}>Create Nodes</div>
              <div style={styles.howDesc}>Add processes and resources to your graph by clicking the canvas.</div>
            </div>
            <div style={styles.howStep}>
              <div style={styles.howIcon}>2</div>
              <div style={styles.howLabel}>Connect Edges</div>
              <div style={styles.howDesc}>Draw allocation and request edges between processes and resources.</div>
            </div>
            <div style={styles.howStep}>
              <div style={styles.howIcon}>3</div>
              <div style={styles.howLabel}>Detect Deadlocks</div>
              <div style={styles.howDesc}>Run the detection algorithm to identify and visualize deadlocked processes.</div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={styles.finalCta}>
          <div style={styles.finalCtaTitle}>Ready to Get Started?</div>
          <div style={styles.finalCtaText}>
            Launch the simulator now and start building resource allocation graphs to understand deadlock scenarios.
          </div>
          <div style={styles.ctas}>
            <a href="/simulator">
              <button style={styles.primaryBtn}>Start Simulator</button>
            </a>
            <a href="/simulator#examples">
              <button style={styles.ghostBtn}>View Examples</button>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer style={styles.footer}>
          <div>
            <span style={styles.logoBox}>RAG</span>
            <span style={{ marginLeft: 10 }}>© {new Date().getFullYear()} RAG Simulator</span>
          </div>
          <div style={styles.footerLinks}>
            <a href="/about" style={styles.footerLink}>About</a>
            <a href={githubDocs} target="_blank" rel="noopener noreferrer" style={styles.footerLink}>GitHub</a>
            <a href="/feedback" style={styles.footerLink}>Feedback</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
