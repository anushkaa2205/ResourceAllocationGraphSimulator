// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const githubDocs = "https://github.com/anushkaa2205/ResourceAllocationGraphSimulator.git";

  /* ------------------------------------------------------------------
     THEME COLORS (Matches Home.jsx AI Blue Theme)
  ------------------------------------------------------------------ */
  const theme = {
    bg: "linear-gradient(90deg, #0A1224 0%, #040814 100%)",
    glass: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(90,140,255,0.12)",

    text: "#E1E7EF",
    subtext: "#A8B4CC",

    primary: "#5CAEFF",
    secondary: "#3F8CFF",

    glow: "0 0 18px rgba(90,140,255,0.35)",
    glowStrong: "0 0 38px rgba(90,140,255,0.55)",

    buttonGradient: "linear-gradient(90deg,#5CAEFF,#78A7FF)",
  };

  /* ------------------------------------------------------------------
     NAVBAR STYLES
  ------------------------------------------------------------------ */
  const container = {
    padding: "18px 32px",
    background: theme.bg,
    borderBottom: theme.border,
    backdropFilter: "blur(12px)",
    boxShadow: "0 5px 25px rgba(0,0,0,0.4)",
    position: "sticky",
    top: 0,
    zIndex: 999,
  };

 const bar = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};


  const brand = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flex: 1,
    textDecoration: "none",
    color: theme.text,
  };

  const logo = {
    width: 52,
    height: 52,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    fontSize: 16,
    color: "#001628",
    background: "linear-gradient(135deg,#5CAEFF 0%, #78A7FF 100%)",
    boxShadow: theme.glow,
  };

  const name = {
    fontSize: 18,
    fontWeight: 800,
    margin: 0,
    color: theme.text,
  };

  const tagline = {
    fontSize: 12,
    marginTop: 1,
    color: theme.subtext,
  };

  /* ------------------------------------------------------------------
     LINK STYLE + NETFLIX HOVER
  ------------------------------------------------------------------ */
  const linkBase = {
    color: theme.text,
    textDecoration: "none",
    fontWeight: 700,
    padding: "8px 14px",
    borderRadius: 10,
    transition:
      "transform .25s cubic-bezier(0.4,0,0.2,1), box-shadow .25s cubic-bezier(0.4,0,0.2,1)",
  };

  const linkHover = {
    transform: "translateY(-4px) scale(1.06)",
    boxShadow: theme.glow,
    background: "rgba(255,255,255,0.06)",
  };

  const cta = {
    padding: "8px 16px",
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    border: "none",
    color: "#00101F",
    background: theme.buttonGradient,
    boxShadow: theme.glow,
    transition: "transform .25s cubic-bezier(0.4,0,0.2,1)",
  };

  const ctaHover = {
    transform: "translateY(-4px) scale(1.06)",
    boxShadow: theme.glowStrong,
  };

  const onHover = (e) => Object.assign(e.currentTarget.style, linkHover);
  const onLeave = (e) =>
    Object.assign(e.currentTarget.style, {
      transform: "none",
      boxShadow: "none",
      background: "transparent",
    });

  return (
    <header style={container}>
      <div style={bar}>
        
        {/* BRAND / LOGO */}
        <Link to="/" style={brand}>
          <div style={logo}>RAG</div>

          <div style={{ lineHeight: 1 }}>
            <div style={name}>Resource Allocation Graph Simulator</div>
            <div style={tagline}>clear technical visualization</div>
          </div>
        </Link>

        {/* NAV LINKS */}
        <nav aria-label="primary" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="nav-desktop" style={{ display: "flex", gap: 8 }}>
            <Link to="/simulator" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>
              Simulator
            </Link>

            <Link to="/analysis" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>
              Analysis
            </Link>

            <Link to="/visualizer" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>
              Visualizer
            </Link>

            <Link to="/report" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>
              Report
            </Link>

            <Link to="/about" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>
              About
            </Link>

            <Link to="/feedback" style={linkBase} onMouseOver={onHover} onMouseOut={onLeave}>
              Feedback
            </Link>

            <a
              href={githubDocs}
              target="_blank"
              rel="noopener noreferrer"
              style={cta}
              onMouseOver={(e) => Object.assign(e.currentTarget.style, ctaHover)}
              onMouseOut={(e) => Object.assign(e.currentTarget.style, { transform: "none" })}
            >
              Docs
            </a>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 44,
              height: 44,
              borderRadius: 10,
              border: theme.border,
              background: "transparent",
              cursor: "pointer",
              color: theme.text,
            }}
          >
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <rect width="18" height="2" rx="1" y="0" fill="currentColor" />
              <rect width="18" height="2" rx="1" y="5" fill="currentColor" opacity=".85" />
              <rect width="18" height="2" rx="1" y="10" fill="currentColor" opacity=".7" />
            </svg>
          </button>

          {/* MOBILE DROPDOWN */}
          <div
            style={{
              display: open ? "flex" : "none",
              position: "absolute",
              right: 18,
              top: 80,
              background: "linear-gradient(180deg,#08101F,#040814)",
              borderRadius: 14,
              padding: 12,
              boxShadow: "0 22px 65px rgba(0,0,0,0.65)",
              flexDirection: "column",
              gap: 10,
              minWidth: 220,
              border: theme.border,
            }}
          >
            {["Simulator", "Analysis", "Visualizer", "Report", "About", "Feedback"].map((text, idx) => (
              <Link
                key={idx}
                to={"/" + text.toLowerCase()}
                style={{ ...linkBase, padding: "10px 14px" }}
                onClick={() => setOpen(false)}
                onMouseOver={onHover}
                onMouseOut={onLeave}
              >
                {text}
              </Link>
            ))}

            <a
              href={githubDocs}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...cta,
                width: "100%",
                textAlign: "center",
                padding: "10px 14px",
              }}
              onClick={() => setOpen(false)}
            >
              Docs
            </a>
          </div>
        </nav>
      </div>

      {/* Responsive Rules */}
      <style>{`
        @media (min-width: 900px) {
          .nav-desktop { display: flex !important; }
          button[aria-label="Toggle menu"] { display: none !important; }
        }
        @media (max-width: 899px) {
          .nav-desktop { display: none !important; }
        }
      `}</style>
    </header>
  );
}
