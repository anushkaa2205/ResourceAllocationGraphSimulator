# backend/backend.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import io
import base64
import networkx as nx
import matplotlib
matplotlib.use("Agg")  # use non-GUI backend for server-side rendering
import matplotlib.pyplot as plt
import math

app = Flask(__name__)
CORS(app)

# Colors / theme (kept same as visualizer)
BG = "#0f1722"
PROCESS_COLOR = "#3b82f6"
RESOURCE_COLOR = "#10b981"
DEADLOCK_COLOR = "#ff416c"
REQUEST_EDGE = "#60a5fa"
ALLOC_EDGE = "#34d399"
NODE_EDGE_COLOR = "#0b1220"
NODE_TEXT_COLOR = "#041726"
NODE_SIZE = 1400

def build_graph_from_payload(payload):
    """
    Payload format:
    {
      "processes": ["P1", "P2", ...],
      "resources": ["R1", ...],
      "request_edges": [["P1","R1"], ...],
      "allocation_edges": [["R1","P2"], ...]
    }
    """
    G = nx.DiGraph()
    processes = payload.get("processes", [])
    resources = payload.get("resources", [])
    for p in processes:
        G.add_node(p, ntype="process")
    for r in resources:
        G.add_node(r, ntype="resource")

    for e in payload.get("request_edges", []):
        if len(e) >= 2:
            G.add_edge(e[0], e[1], etype="request")

    for e in payload.get("allocation_edges", []):
        if len(e) >= 2:
            G.add_edge(e[0], e[1], etype="alloc")

    return G

def detect_cycle(G):
    """
    Return first found simple directed cycle (list of nodes) or [].
    Uses networkx.simple_cycles which yields all cycles.
    """
    try:
        cycles = list(nx.simple_cycles(G))
    except Exception:
        cycles = []
    # choose a meaningful cycle if any
    if not cycles:
        return []
    # Prefer cycles that include processes (heuristic)
    cycles_sorted = sorted(cycles, key=lambda c: len(c))
    return cycles_sorted[0]

def draw_static_to_bytes(G, dead_nodes=None, deadlock=False, title_override=None):
    """
    Draws static graph (no animation) and returns PNG bytes.
    dead_nodes: iterable of node IDs to highlight
    """
    dead_nodes = set(dead_nodes or [])
    # deterministic layout
    try:
        pos = nx.spring_layout(G, seed=42)
    except Exception:
        pos = {n: (i % 5, i // 5) for i, n in enumerate(G.nodes())}

    fig = plt.Figure(figsize=(9, 6), dpi=100, facecolor=BG)
    ax = fig.add_subplot(111)
    ax.set_facecolor(BG)
    ax.set_axis_off()

    # draw edges
    for u, v, data in G.edges(data=True):
        x1, y1 = pos.get(u, (0,0))
        x2, y2 = pos.get(v, (0,0))
        if deadlock and u in dead_nodes and v in dead_nodes:
            color = DEADLOCK_COLOR
            lw = 3.2
        else:
            color = REQUEST_EDGE if data.get("etype") == "request" else ALLOC_EDGE
            lw = 1.6
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw, alpha=0.95, zorder=2)

    # draw nodes
    for n, data in G.nodes(data=True):
        x, y = pos.get(n, (0,0))
        if data.get("ntype") == "process":
            marker = "o"
            color = PROCESS_COLOR
        else:
            marker = "s"
            color = RESOURCE_COLOR

        if deadlock and n in dead_nodes:
            color = DEADLOCK_COLOR

        ax.scatter(x, y, s=NODE_SIZE, c=color, marker=marker, edgecolors=NODE_EDGE_COLOR, linewidths=1.1, zorder=5)
        ax.text(x, y, n, fontsize=10, ha="center", va="center", color=NODE_TEXT_COLOR, zorder=6)

    # title
    if title_override:
        ax.set_title(title_override, color=DEADLOCK_COLOR if deadlock else "#34d399", fontsize=16, pad=12)
    else:
        if deadlock:
            ax.set_title("DEADLOCK DETECTED", color=DEADLOCK_COLOR, fontsize=16, pad=12)
        else:
            ax.set_title("SAFE STATE — NO DEADLOCK", color="#34d399", fontsize=16, pad=12)

    # Save to bytes
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return buf.read()

@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Expects JSON payload as described in build_graph_from_payload.
    Returns JSON:
    {
      "deadlock": bool,
      "cycle": [...],
      "visualization": "<base64 PNG>"
    }
    """
    payload = request.get_json(force=True) or {}
    G = build_graph_from_payload(payload)

    # Detect cycle
    cycle = detect_cycle(G)
    deadlock = bool(cycle)

    # Allow analysis override from payload (if front/back share analysis_output.json fields)
    # But main source is detected 'cycle' here.
    dead_nodes = cycle

    # Generate visualization PNG (static)
    png_bytes = draw_static_to_bytes(G, dead_nodes=dead_nodes, deadlock=deadlock)
    b64 = base64.b64encode(png_bytes).decode("utf-8")

    resp = {
        "deadlock": deadlock,
        "cycle": cycle,
        "visualization": b64
    }
    return jsonify(resp)

if __name__ == "__main__":
    print("Starting backend on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=5000, debug=True)
