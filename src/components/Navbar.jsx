import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{
      padding: "15px 25px",
      background: "var(--topbar-bg)",
      display: "flex",
      gap: "25px",
      borderBottom: "1px solid #222"
    }}>
      <Link to="/">Home</Link>
      <Link to="/simulator">Simulator</Link>
      <Link to="/analysis">Analysis</Link>
      <Link to="/visualizer">Visualizer</Link>
      <Link to="/report">Report</Link>
    </nav>
  );
}
