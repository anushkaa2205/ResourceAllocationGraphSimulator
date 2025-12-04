import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Simulator from "./pages/Simulator.jsx";
import Analysis from "./pages/Analysis.jsx";
import Report from "./pages/Report.jsx";
import Visualizer from "./pages/Visualizer.jsx";
import Feedback from "./pages/Feedback.jsx";
import About from "./pages/About.jsx";
import Navbar from "./components/Navbar";

import logoImg from "./assets/logo.png";

export default function App() {

  // 🌟 GLOBAL MODAL STATE
  const [showLogoModal, setShowLogoModal] = useState(false);

  return (
    <>
      {/* NAVBAR gets modal trigger */}
      <Navbar setShowLogoModal={setShowLogoModal} />

      {/* ROUTES */}
      <Routes>
        <Route path="/" element={<Home setShowLogoModal={setShowLogoModal} />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/report" element={<Report />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/about" element={<About />} />
      </Routes>

      {/* 🌟 GLOBAL POPUP LOGO MODAL */}
      {showLogoModal && (
        <div
          onClick={() => setShowLogoModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999999,
            animation: "fadeIn 0.25s ease",
          }}
        >
          <div
            style={{
              padding: "22px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: "20px",
              boxShadow: "0 0 40px rgba(90,140,255,0.35)",
              animation: "popIn 0.3s ease",
            }}
            onClick={(e) => e.stopPropagation()} // prevents closing when clicking inside
          >
            <img
              src={logoImg}
              alt="Full Logo"
              style={{
                width: "480px",
                maxWidth: "90vw",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes popIn {
              0% { transform: scale(0.85); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
