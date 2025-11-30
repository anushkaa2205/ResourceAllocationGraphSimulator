# -------------------------------------------------------
# CLEAN + FINAL BACKEND FOR DOCKER & FRONTEND
# -------------------------------------------------------

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import base64
import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

# PDF libs
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# Colors for drawing
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
# FIND DEADLOCK CYCLE
# -------------------------------------------------------
def detect_cycle(G):
    try:
        cycles = list(nx.simple_cycles(G))
    except:
        return []

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
        is_dead = (u in dead_nodes) and (v in dead_nodes)

        color = DEADLOCK_COLOR if is_dead else (
            REQUEST_EDGE if d["etype"] == "request" else ALLOC_EDGE
        )
        lw = 3 if is_dead else 1.6

        ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw)

    # nodes
    for n, data in G.nodes(data=True):
        x, y = pos[n]
        is_dead = n in dead_nodes
        marker = "o" if data["ntype"] == "process" else "s"
        color = DEADLOCK_COLOR if is_dead else (
            PROCESS_COLOR if data["ntype"] == "process" else RESOURCE_COLOR
        )

        ax.scatter(
            x, y, s=NODE_SIZE, c=color, marker=marker,
            edgecolors=NODE_EDGE_COLOR, linewidths=1
        )
        ax.text(x, y, n, color=NODE_TEXT_COLOR, ha="center", va="center", fontsize=10)

    title = "DEADLOCK DETECTED" if dead_nodes else "SAFE STATE — NO DEADLOCK"
    tcolor = DEADLOCK_COLOR if dead_nodes else "#34d399"
    ax.set_title(title, color=tcolor, fontsize=16)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, facecolor=BG, bbox_inches="tight")
    buf.seek(0)
    return buf.read()


# -------------------------------------------------------
# ANALYZE ENDPOINT
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
# EXPORT PDF REPORT
# -------------------------------------------------------
@app.route("/export", methods=["POST"])
def export_pdf():
    payload = request.get_json(force=True)
    img_b64 = payload.get("backendVisualizationBase64")

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)

    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(width/2, height - 50, "Resource Allocation Graph — System Report")

    c.setFont("Helvetica", 11)
    y = height - 90

    lines = [
        f"Processes: {', '.join(payload.get('processes', []))}",
        f"Resources: {', '.join(payload.get('resources', []))}"
    ]

    analysis = payload.get("analysis", {})
    if "deadlock" in analysis:
        lines.append(f"Deadlock: {analysis['deadlock']}")
    if "explanation" in analysis:
        lines.append(f"Explanation: {analysis['explanation']}")
    if "fixes" in analysis:
        lines.append("Fix Suggestions:")
        for f in analysis["fixes"]:
            lines.append(" - " + f)

    for line in lines:
        c.drawString(40, y, line)
        y -= 16

    if img_b64:
        try:
            raw = base64.b64decode(img_b64)
            im = Image.open(BytesIO(raw))

            max_w = width * 0.5
            max_h = height * 0.6
            w, h = im.size
            scale = min(max_w / w, max_h / h)
            iw, ih = int(w*scale), int(h*scale)

            img_r = ImageReader(im.resize((iw, ih)))
            c.drawImage(img_r, width - iw - 40, height - ih - 80, width=iw, height=ih)
        except Exception as e:
            print("Image error:", e)

    c.showPage()
    c.save()
    buffer.seek(0)
    return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name="system_report.pdf")


# -------------------------------------------------------
# RUN (ONLY FOR DOCKER)
# -------------------------------------------------------
if __name__ == "__main__":
    print("Starting backend on 0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000)
