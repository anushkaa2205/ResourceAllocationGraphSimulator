import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Simulator from "./pages/Simulator.jsx";
import Analysis from "./pages/Analysis.jsx";
import Report from "./pages/Report.jsx";
import Visualizer from "./pages/Visualizer.jsx";
import Feedback from "./pages/Feedback.jsx";
import About from "./pages/About.jsx";
import Navbar from './components/Navbar';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulator" element={<Simulator />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/report" element={<Report />} />
        <Route path="/visualizer" element={<Visualizer />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </>
  );
}
