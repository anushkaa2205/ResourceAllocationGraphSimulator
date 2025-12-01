// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const githubDocs = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  const container = {
    padding: "16px 28px",            // increased padding
    background: "#08030a",           // match Home theme
    borderBottom: "1px solid rgba(255,255,255,0.02)",
    color: "#e6f3fb"
  };

  const bar = { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 14 };
  const brand = { display: "flex", alignItems: "center", gap: 12, flex: 1, textDecoration: "none", color: "inherit" };

  const logo = {
    width: 56, height: 56, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, color: "#021222",
    background: "linear-gradient(135deg,#0bb7c4 0%, #0b6bff 80%)", // Home accent
    boxShadow: "0 12px 40px rgba(11,183,196,0.12)",
    fontSize: 15
  };

  const name = { fontSize: 16, margin: 0, fontWeight: 900, color: "#eef7ff" };
  const tagline = { fontSize: 12, marginTop: 2, color: "#b8dff0", opacity: 0.95 };

  const linkBase = {
    color: "#e6f3fb", textDecoration: "none", fontWeight: 700, padding: "8px 12px", borderRadius: 10,
    transition: "transform .12s ease, box-shadow .12s ease, background .12s ease"
  };

  const linkHoverStyle = {
    transform: "translateY(-3px)",
    boxShadow: "0 14px 50px rgba(0,120,180,0.14)",
    background: "linear-gradient(90deg, rgba(0,180,200,0.06), rgba(6,120,160,0.04))"
  };

  const cta = {
    padding: "8px 14px", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer", border: "none",
    color: "#021222",
    background: "linear-gradient(180deg,#00b4c7,#0077b6)", // home toolBtn style
    boxShadow: "0 10px 36px rgba(0,120,180,0.12)"
  };

  // hover helpers
  const onHover = (e) => Object.assign(e.currentTarget.style, linkHoverStyle);
  const onLeave = (e) => Object.assign(e.currentTarget.style, { transform: "none", boxShadow: "none", background: "transparent" });

  return (
    <header style={container}>
      <div style={bar}>
        <Link to="/" style={brand}>
          <div style={logo}>RAG</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <div style={name}>Resource Allocation Graph Simulator</div>
            <div style={tagline}>clear technical visualization</div>
          </div>
        </Link>

        <nav aria-label="primary" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="nav-desktop" style={{ display: "flex", gap: 8 }}>
            <Link to="/simulator" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>Simulator</Link>
            <Link to="/analysis" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>Analysis</Link>
            <Link to="/visualizer" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>Visualizer</Link>
            <Link to="/report" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>Report</Link>
            <Link to="/about" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>About</Link>
            <Link to="/feedback" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>Feedback</Link>

            <a href={githubDocs} target="_blank" rel="noopener noreferrer" style={cta} onMouseOver={(e) => (e.currentTarget.style.transform = "translateY(-3px)")} onMouseOut={(e) => (e.currentTarget.style.transform = "none")}>Docs</a>
          </div>

          <button aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen(!open)} style={{ display: "inline-grid", placeItems: "center", width: 44, height: 44, borderRadius: 10, border: "1px solid rgba(255,255,255,0.02)", background: "transparent", cursor: "pointer", color: "#b8dff0" }}>
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none"><rect width="18" height="2" rx="1" y="0" fill="currentColor"/><rect width="18" height="2" rx="1" y="5" fill="currentColor" opacity=".85"/><rect width="18" height="2" rx="1" y="10" fill="currentColor" opacity=".7"/></svg>
          </button>

          <div style={{ display: open ? "flex" : "none", position: "absolute", right: 16, top: 72, background: "linear-gradient(180deg, rgba(10,12,18,0.98), rgba(8,10,14,0.9))", borderRadius: 12, padding: 10, boxShadow: "0 18px 60px rgba(0,0,0,0.7)", flexDirection: "column", gap: 8, minWidth: 220 }}>
            <Link to="/simulator" style={{ ...linkBase, padding: "10px 14px" }} onClick={() => setOpen(false)} onMouseOver={onHover} onMouseOut={onLeave}>Simulator</Link>
            <Link to="/analysis" style={{ ...linkBase, padding: "10px 14px" }} onClick={() => setOpen(false)} onMouseOver={onHover} onMouseOut={onLeave}>Analysis</Link>
            <Link to="/visualizer" style={{ ...linkBase, padding: "10px 14px" }} onClick={() => setOpen(false)} onMouseOver={onHover} onMouseOut={onLeave}>Visualizer</Link>
            <Link to="/report" style={{ ...linkBase, padding: "10px 14px" }} onClick={() => setOpen(false)} onMouseOver={onHover} onMouseOut={onLeave}>Report</Link>
            <Link to="/about" style={{ ...linkBase, padding: "10px 14px" }} onClick={() => setOpen(false)} onMouseOver={onHover} onMouseOut={onLeave}>About</Link>
            <Link to="/feedback" style={{ ...linkBase, padding: "10px 14px" }} onClick={() => setOpen(false)} onMouseOver={onHover} onMouseOut={onLeave}>Feedback</Link>
            <a href={githubDocs} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 14px", borderRadius: 10, background: "linear-gradient(180deg,#00b4c7,#0077b6)", color: "#021222", fontWeight: 800, textAlign: "center" }} onClick={() => setOpen(false)}>Docs</a>
          </div>
        </nav>
      </div>

      <style>{`
        @media (min-width: 880px) {
          .nav-desktop { display: flex !important; }
          button[aria-label="Toggle menu"] { display: none !important; }
        }
        @media (max-width: 879px) {
          .nav-desktop { display: none !important; }
        }
      `}</style>
    </header>
  );
}