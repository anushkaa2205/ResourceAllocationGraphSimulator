# -------------------------------------------------------
# FINAL BACKEND WITH PNG + PDF EXPORT
# -------------------------------------------------------

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io, base64
import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from PIL import Image
from io import BytesIO

app = Flask(__name__)
CORS(app)

# ---------- COLORS ----------
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
# DETECT CYCLE
# -------------------------------------------------------
def detect_cycle(G):
    cycles = list(nx.simple_cycles(G))
    if not cycles:
        return []
    return sorted(cycles, key=lambda c: len(c))[0]

# -------------------------------------------------------
# DRAW PNG
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
        color = DEADLOCK_COLOR if is_dead else (
            REQUEST_EDGE if d["etype"] == "request" else ALLOC_EDGE
        )
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=3 if is_dead else 1.6)

    # nodes
    for n, data in G.nodes(data=True):
        x, y = pos[n]
        is_dead = n in dead_nodes
        marker = "o" if data["ntype"] == "process" else "s"
        color = DEADLOCK_COLOR if is_dead else (
            PROCESS_COLOR if data["ntype"] == "process" else RESOURCE_COLOR
        )

        ax.scatter(x, y, s=NODE_SIZE, c=color, marker=marker,
                   edgecolors=NODE_EDGE_COLOR, linewidths=1)
        ax.text(x, y, n, color=NODE_TEXT_COLOR,
                ha="center", va="center", fontsize=11)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, facecolor=BG, bbox_inches="tight")
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

    png = draw_png(G, cycle)
    b64 = base64.b64encode(png).decode("utf-8")

    return jsonify({
        "deadlock": bool(cycle),
        "cycle": cycle,
        "visualization": b64
    })

# -------------------------------------------------------
# EXPORT PDF + PNG
# -------------------------------------------------------
@app.route("/export", methods=["POST"])
def export_file():
    payload = request.get_json(force=True)
    fmt = payload.get("format", "png")

    G = build_graph(payload)
    cycle = detect_cycle(G)

    # ===== PNG EXPORT =====
    if fmt == "png":
        png_bytes = draw_png(G, cycle)
        return send_file(
            io.BytesIO(png_bytes),
            mimetype="image/png",
            as_attachment=True,
            download_name="visualization.png"
        )

    # ===== PDF EXPORT =====
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    pdf.setFont("Helvetica-Bold", 20)
    pdf.drawCentredString(width/2, height - 40, "RAG — System Report")

    pdf.setFont("Helvetica", 11)
    y = height - 80

    lines = [
        f"Processes: {', '.join(payload.get('processes', []))}",
        f"Resources: {', '.join(payload.get('resources', []))}",
        f"Deadlock: {bool(cycle)}",
        f"Cycle: {cycle if cycle else 'None'}"
    ]

    for line in lines:
        pdf.drawString(40, y, line)
        y -= 16

    # embed PNG inside PDF
    png = draw_png(G, cycle)
    im = Image.open(BytesIO(png))
    max_w, max_h = width * 0.5, height * 0.6
    w, h = im.size
    scale = min(max_w / w, max_h / h)
    iw, ih = int(w * scale), int(h * scale)

    pdf.drawImage(
        ImageReader(im.resize((iw, ih))),
        width - iw - 40,
        height - ih - 80,
        width=iw, height=ih
    )

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    return send_file(
        buffer,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="system_report.pdf"
    )


# -------------------------------------------------------
# RUN
# -------------------------------------------------------
if __name__ == "__main__":
    print("Backend running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000)
