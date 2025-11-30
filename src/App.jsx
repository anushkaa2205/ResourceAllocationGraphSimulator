import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Simulator from "./pages/Simulator";
import Analysis from "./pages/Analysis";
import Visualizer from "./pages/Visualizer";
import Report from "./pages/Report";

export default function App() {
  return (
    <div>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </div>
  );
}
