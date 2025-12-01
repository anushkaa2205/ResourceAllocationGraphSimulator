export default function Home() {
  const githubDocs = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  const styles = {
    container: {
      fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      padding: 40,
      maxWidth: 1200,
      margin: '40px auto',
      background: 'radial-gradient(1200px 600px at 10% 10%, #0b0620 0%, rgba(18,6,34,0.7) 25%, transparent 40%), linear-gradient(180deg, #06030a 0%, #0d0713 100%)',
      color: '#e6f6ff'
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: 12 },
    title: { fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: 0.3, color: '#f6f2ff' },
    subtitle: { fontSize: 13, color: '#b7e7ff' },
    hero: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'linear-gradient(135deg, rgba(131,58,180,0.12), rgba(0,212,255,0.04))',
      borderRadius: 12,
      padding: 28,
      border: '1px solid rgba(255,255,255,0.03)',
      boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02)'
    },
    heroLeft: { flex: '1 1 360px', minWidth: 280 },
    heroRight: {
      flex: '0 1 380px',
      minWidth: 260,
      display: 'flex',
      justifyContent: 'center'
    },
    heroH1: { fontSize: 30, margin: '6px 0', lineHeight: 1.12, color: '#fff', textShadow: '0 2px 18px rgba(189, 75, 255, 0.15)' },
    heroP: { color: '#b7e7ff', fontSize: 15, marginTop: 8, opacity: 0.95 },
    ctas: { display: 'flex', gap: 12, marginTop: 18 },
    primaryBtn: {
      background: 'linear-gradient(90deg, #00f0ff 0%, #8b5cf6 60%, #ff1fb7 100%)',
      color: '#0b0420',
      padding: '10px 18px',
      borderRadius: 12,
      border: 'none',
      fontWeight: 700,
      cursor: 'pointer',
      boxShadow: '0 8px 32px rgba(0,240,255,0.12), 0 0 48px rgba(139,92,246,0.06)',
      transition: 'transform .14s cubic-bezier(.2,.9,.2,1), box-shadow .14s ease'
    },
    ghostBtn: {
      background: 'transparent',
      border: '1px solid rgba(0,240,255,0.18)',
      padding: '10px 16px',
      borderRadius: 12,
      cursor: 'pointer',
      color: '#aeeeff',
      boxShadow: '0 6px 18px rgba(0,0,0,0.55)',
      transition: 'transform .14s cubic-bezier(.2,.9,.2,1), box-shadow .14s ease'
    },
    features: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
      marginTop: 18
    },
    card: {
      background: 'linear-gradient(180deg, rgba(11,4,20,0.65), rgba(11,4,20,0.55))',
      borderRadius: 12,
      padding: 16,
      boxShadow: '0 8px 30px rgba(0,0,0,0.55), 0 0 20px rgba(131,58,180,0.06)',
      minHeight: 110,
      border: '1px solid rgba(255,255,255,0.03)',
      backdropFilter: 'blur(6px)'
    },
    cardTitle: { margin: 0, fontWeight: 800, fontSize: 14, color: '#ffd6ff' },
    cardText: { marginTop: 8, color: '#9be9ff', fontSize: 13, opacity: 0.95 },
    featureHover: {
      transform: 'translateY(-6px)',
      boxShadow: '0 18px 60px rgba(0,240,255,0.06), 0 0 36px rgba(139,92,246,0.03)'
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#ff1fb7,#00f0ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0b0420', fontWeight: 900, boxShadow: '0 6px 20px rgba(255,31,183,0.18), 0 0 30px rgba(0,240,255,0.08)' }}>
            RAG
          </div>
          <div>
            <h2 style={styles.title}>Resource Allocation Graph Simulator</h2>
            <div style={styles.subtitle}>Analyze, visualize, and report on resource allocation & deadlock scenarios</div>
          </div>
        </div>
        <nav>
          <a href={githubDocs} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 700, textShadow: '0 1px 8px rgba(0,240,255,0.12)' }}>Docs</a>
        </nav>
      </header>

      <main style={styles.hero}>
        <div style={styles.heroLeft}>
          <h1 style={styles.heroH1}>Simulate, Inspect, and Resolve Deadlocks with Confidence</h1>
          <p style={styles.heroP}>
            A neon-lit playground to model processes, allocate resources, and step through state changes — designed for teaching, debugging, and demos.
          </p>

          <div style={styles.ctas}>
            <a href="/simulator">
              <button
                style={styles.primaryBtn}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 18px 60px rgba(0,240,255,0.18), 0 0 64px rgba(139,92,246,0.08)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = styles.primaryBtn.boxShadow; }}
              >
                Start Simulator
              </button>
            </a>

            <a href="/simulator#examples">
              <button
                style={styles.ghostBtn}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 18px 50px rgba(0,240,255,0.08)';
                  e.currentTarget.style.border = '1px solid rgba(255,31,183,0.14)';
                }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = styles.ghostBtn.boxShadow; }}
              >
                Try Examples
              </button>
            </a>
          </div>

          <div style={styles.features}>
            <div style={{ ...styles.card }} onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.featureHover)} onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: styles.card.boxShadow })}>
              <h3 style={styles.cardTitle}>Interactive Visualization</h3>
              <p style={styles.cardText}>Drag nodes, view allocation edges, and animate step-by-step state changes in a neon graph space.</p>
            </div>
            <div style={{ ...styles.card }} onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.featureHover)} onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: styles.card.boxShadow })}>
              <h3 style={styles.cardTitle}>Analysis Tools</h3>
              <p style={styles.cardText}>Detect cycles, list blocked processes, and get suggested fixes with clear highlights.</p>
            </div>
            <div style={{ ...styles.card }} onMouseOver={(e) => Object.assign(e.currentTarget.style, styles.featureHover)} onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: 'none', boxShadow: styles.card.boxShadow })}>
              <h3 style={styles.cardTitle}>Export & Reporting</h3>
              <p style={styles.cardText}>Export diagrams and reports with a cyberpunk-theme ready for presentations.</p>
            </div>
          </div>
        </div>

        <div style={styles.heroRight}>
          <div style={{ width: 300, height: 220, borderRadius: 16, background: 'linear-gradient(135deg, rgba(255,31,183,0.12), rgba(0,240,255,0.06))', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 18, border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 18px 50px rgba(11,4,20,0.7), 0 0 36px rgba(255,31,183,0.06)'}}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#ffd6ff', textShadow: '0 6px 32px rgba(255,31,183,0.08)' }}>Live Graph Preview</div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#aeeeff', opacity: 0.95 }}>Start the simulator to see interactive neon graphs and track allocations</div>
          </div>
        </div>
      </main>

      <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#9be9ff', fontSize: 13 }}>
        <div>© {new Date().getFullYear()} RAG Simulator</div>
        <div>
          <a href="/about" style={{ color: '#ffd6ff', textDecoration: 'none', marginRight: 16 }}>About</a>
          <a href="/feedback" style={{ color: '#aeeeff', textDecoration: 'none' }}>Feedback</a>
        </div>
      </footer>
    </div>
  );
}
