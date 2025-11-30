# backend/backend.py
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import base64
import networkx as nx
import matplotlib
matplotlib.use("Agg")  
import matplotlib.pyplot as plt

app = Flask(__name__)
CORS(app)

# Colors (same theme)
BG = "#0f1722"
PROCESS_COLOR = "#3b82f6"
RESOURCE_COLOR = "#10b981"
DEADLOCK_COLOR = "#ff416c"
REQUEST_EDGE = "#60a5fa"
ALLOC_EDGE = "#34d399"
NODE_EDGE_COLOR = "#0b1220"
NODE_TEXT_COLOR = "#041726"
NODE_SIZE = 1400


# -------------------------------------------------------
# BUILD GRAPH
# -------------------------------------------------------
def build_graph(payload):
    G = nx.DiGraph()

    for p in payload.get("processes", []):
        G.add_node(p, ntype="process")

    for r in payload.get("resources", []):
        G.add_node(r, ntype="resource")

    for u, v in payload.get("request_edges", []):
        G.add_edge(u, v, etype="request")

    for u, v in payload.get("allocation_edges", []):
        G.add_edge(u, v, etype="alloc")

    return G


# -------------------------------------------------------
# CYCLE DETECTION
# -------------------------------------------------------
def detect_cycle(G):
    try:
        cycles = list(nx.simple_cycles(G))
    except:
        return []

    if not cycles:
        return []

    cycles_sorted = sorted(cycles, key=lambda c: len(c))
    return cycles_sorted[0]


# -------------------------------------------------------
# DRAW PNG STATIC
# -------------------------------------------------------
def draw_png(G, dead_nodes):
    try:
        pos = nx.spring_layout(G, seed=42)
    except:
        pos = {n: (i, i) for i, n in enumerate(G.nodes())}

    fig = plt.Figure(figsize=(9, 6), dpi=100, facecolor=BG)
    ax = fig.add_subplot(111)
    ax.set_facecolor(BG)
    ax.set_axis_off()

    # edges
    for u, v, d in G.edges(data=True):
        x1, y1 = pos[u]
        x2, y2 = pos[v]
        is_dead = u in dead_nodes and v in dead_nodes
        color = DEADLOCK_COLOR if is_dead else (REQUEST_EDGE if d["etype"] == "request" else ALLOC_EDGE)
        lw = 3 if is_dead else 1.6

        ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw)

    # nodes
    for n, data in G.nodes(data=True):
        x, y = pos[n]
        is_dead = n in dead_nodes
        if data["ntype"] == "process":
            color = DEADLOCK_COLOR if is_dead else PROCESS_COLOR
            marker = "o"
        else:
            color = DEADLOCK_COLOR if is_dead else RESOURCE_COLOR
            marker = "s"

        ax.scatter(x, y, s=NODE_SIZE, c=color, marker=marker, edgecolors=NODE_EDGE_COLOR, linewidths=1)
        ax.text(x, y, n, color=NODE_TEXT_COLOR, ha="center", va="center", fontsize=10)

    title = "DEADLOCK DETECTED" if dead_nodes else "SAFE STATE — NO DEADLOCK"
    tcolor = DEADLOCK_COLOR if dead_nodes else "#34d399"
    ax.set_title(title, color=tcolor, fontsize=16)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, facecolor=fig.get_facecolor(), bbox_inches="tight")
    buf.seek(0)
    return buf.read()


# -------------------------------------------------------
# ANALYZE (JSON RETURN)
# -------------------------------------------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    payload = request.get_json(force=True)
    G = build_graph(payload)

    cycle = detect_cycle(G)
    dead_nodes = cycle

    png = draw_png(G, dead_nodes)
    b64 = base64.b64encode(png).decode("utf-8")

    return jsonify({
        "deadlock": bool(cycle),
        "cycle": cycle,
        "visualization": b64
    })


# -------------------------------------------------------
# EXPORT (PDF or PNG)
# -------------------------------------------------------
@app.route("/export", methods=["POST"])
def export_file():
    payload = request.get_json(force=True)
    fmt = payload.get("format", "png")

    G = build_graph(payload)
    cycle = detect_cycle(G)

    if fmt == "pdf":
        buf = io.BytesIO()
        matplotlib.backends.backend_pdf.PdfPages(buf).savefig(
            plt.figure(figsize=(9, 6))
        )
        buf.seek(0)
        return send_file(buf, download_name="visualization.pdf", mimetype="application/pdf")

    # default PNG
    png = draw_png(G, cycle)
    return send_file(io.BytesIO(png), download_name="visualization.png", mimetype="image/png")


# -------------------------------------------------------
# RUN
# -------------------------------------------------------
if __name__ == "__main__":
    print("Backend running at http://127.0.0.1:5000")
    app.run(debug=True)
