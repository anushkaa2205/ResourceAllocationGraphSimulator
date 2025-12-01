// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Simulator from "./pages/Simulator";
import Analysis from "./pages/Analysis";
import Visualizer from "./pages/Visualizer";
import Report from "./pages/Report";

export default function App() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/simulator" element={<Simulator />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/visualizer" element={<Visualizer />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </main>
    </div>
  );
}
