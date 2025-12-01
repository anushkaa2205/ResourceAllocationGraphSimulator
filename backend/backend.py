# backend/backend.py
"""
Final Backend — Theme-B (single accent #0000CC)
Provides:
 - POST /analyze -> JSON { deadlock, deadlocked_processes, cycle, visualization (base64 PNG), algorithms }
 - POST /export  -> PDF (rich Theme B) or PNG (format="png")
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import base64
import networkx as nx
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from io import BytesIO
from PIL import Image
from datetime import datetime
import textwrap

app = Flask(__name__)
CORS(app)

# ---------- CONSTANTS & COLORS ----------
BG = "#0f1722"
PROCESS_COLOR = "#3b82f6"
RESOURCE_COLOR = "#10b981"
DEADLOCK_COLOR = "#ff416c"
REQUEST_EDGE = "#60a5fa"
ALLOC_EDGE = "#34d399"
NODE_EDGE_COLOR = "#0b1220"
NODE_TEXT_COLOR = "#041726"
NODE_SIZE = 1400

ACCENT_HEX = "#0000CC"

def hex_to_rgb_frac(hexstr):
    hexstr = hexstr.lstrip("#")
    return (
        int(hexstr[0:2], 16) / 255.0,
        int(hexstr[2:4], 16) / 255.0,
        int(hexstr[4:6], 16) / 255.0
    )

ACCENT_RGB = hex_to_rgb_frac(ACCENT_HEX)

# -------------------------------------------------------
# NORMALIZATION (Accept new + old formats)
# -------------------------------------------------------
def normalize_payload(payload):
    out = {}
    out["processes"] = payload.get("processes", []) or []

    # Resources normalization
    resources_raw = payload.get("resources", []) or []
    resources_norm = []

    if resources_raw and isinstance(resources_raw[0], dict):
        # Already objects
        for r in resources_raw:
            rid = r.get("id") or str(r)
            inst = int(r.get("instances", 1))
            resources_norm.append({"id": rid, "instances": inst})
    else:
        # Strings → treat as single instance
        for r in resources_raw:
            resources_norm.append({"id": str(r), "instances": 1})

    out["resources"] = resources_norm

    # Edges normalization
    def parse_edges(raw_list):
        result = []
        for item in raw_list or []:
            if isinstance(item, (list, tuple)) and len(item) >= 2:
                result.append({"from": item[0], "to": item[1], "amount": 1})
            elif isinstance(item, dict):
                u = item.get("from") or item.get("u") or item.get("src")
                v = item.get("to") or item.get("v") or item.get("dst")
                amt = int(item.get("amount", 1))
                result.append({"from": u, "to": v, "amount": amt})
        return result

    out["request_edges"] = parse_edges(payload.get("request_edges", []))
    out["allocation_edges"] = parse_edges(payload.get("allocation_edges", []))

    return out


# -------------------------------------------------------
# BUILD GRAPH for visualization
# -------------------------------------------------------
def build_graph(norm):
    G = nx.DiGraph()

    for p in norm["processes"]:
        G.add_node(p, ntype="process")

    for r in norm["resources"]:
        G.add_node(r["id"], ntype="resource", instances=r["instances"])

    for e in norm["request_edges"]:
        G.add_edge(e["from"], e["to"], etype="request", amount=e["amount"])

    for e in norm["allocation_edges"]:
        G.add_edge(e["from"], e["to"], etype="alloc", amount=e["amount"])

    return G


# -------------------------------------------------------
# CYCLE DETECTION (graph-cycle)
# -------------------------------------------------------
def detect_cycle(G):
    try:
        cycles = list(nx.simple_cycles(G))
    except Exception:
        return []

    if not cycles:
        return []

    cycles_sorted = sorted(cycles, key=lambda c: (len(c), ",".join(c)))
    return cycles_sorted[0]


# -------------------------------------------------------
# MULTI-INSTANCE DEADLOCK DETECTOR (Banker style)
# -------------------------------------------------------
def detect_deadlock_multi_instance(norm):
    processes = norm["processes"]
    resources = norm["resources"]
    reqs = norm["request_edges"]
    allocs = norm["allocation_edges"]

    n = len(processes)
    m = len(resources)
    if n == 0 or m == 0:
        return {"deadlocked": False, "deadlocked_processes": []}

    proc_idx = {p: i for i, p in enumerate(processes)}
    res_idx = {r["id"]: i for i, r in enumerate(resources)}

    Available = [r["instances"] for r in resources]

    Allocation = [[0]*m for _ in range(n)]
    Request = [[0]*m for _ in range(n)]

    # Fill allocation
    for e in allocs:
        u, v = e["from"], e["to"]
        amt = e["amount"]
        if u in res_idx and v in proc_idx:     # R -> P
            Allocation[proc_idx[v]][res_idx[u]] += amt
            Available[res_idx[u]] -= amt
        elif v in res_idx and u in proc_idx:   # reversed
            Allocation[proc_idx[u]][res_idx[v]] += amt
            Available[res_idx[v]] -= amt

    Available = [max(0, a) for a in Available]

    # Fill requests
    for e in reqs:
        u, v = e["from"], e["to"]
        amt = e["amount"]
        if u in proc_idx and v in res_idx:
            Request[proc_idx[u]][res_idx[v]] += amt
        elif v in proc_idx and u in res_idx:
            Request[proc_idx[v]][res_idx[u]] += amt

    Work = Available[:]
    Finish = [False]*n

    changed = True
    while changed:
        changed = False
        for i in range(n):
            if Finish[i]:
                continue
            if all(Request[i][j] <= Work[j] for j in range(m)):
                for j in range(m):
                    Work[j] += Allocation[i][j]
                Finish[i] = True
                changed = True

    deadlocked = [processes[i] for i in range(n) if not Finish[i]]

    return {"deadlocked": bool(deadlocked), "deadlocked_processes": deadlocked}


# -------------------------------------------------------
# DRAW PNG (amounts + instance dots)
# -------------------------------------------------------
def draw_png_bytes(G, cycle_nodes):
    pos = nx.spring_layout(G, seed=42)

    fig = plt.Figure(figsize=(9, 6), dpi=120, facecolor=BG)
    ax = fig.add_subplot(111)
    ax.set_facecolor(BG)
    ax.set_axis_off()

    # edges
    for u, v, d in G.edges(data=True):
        x1, y1 = pos[u]
        x2, y2 = pos[v]
        is_dead = u in cycle_nodes and v in cycle_nodes

        color = DEADLOCK_COLOR if is_dead else (
            REQUEST_EDGE if d["etype"] == "request" else ALLOC_EDGE
        )

        lw = 3 if is_dead else 1.6
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw)

        # amount
        if d.get("amount", 1) > 1:
            mx = (x1 + x2)/2
            my = (y1 + y2)/2
            ax.text(mx, my, str(d["amount"]),
                    color="white", fontsize=9,
                    ha="center", va="center")

    # nodes
    for n, data in G.nodes(data=True):
        x, y = pos[n]
        is_dead = n in cycle_nodes
        color = DEADLOCK_COLOR if is_dead else (
            PROCESS_COLOR if data["ntype"] == "process" else RESOURCE_COLOR
        )

        marker = "o" if data["ntype"] == "process" else "s"
        ax.scatter([x], [y], s=NODE_SIZE, c=color, marker=marker,
                   edgecolors=NODE_EDGE_COLOR, linewidths=1.2)
        ax.text(x, y, n, fontsize=10, ha="center", va="center", color=NODE_TEXT_COLOR)

        # instance dots
        if data["ntype"] == "resource":
            inst = data.get("instances", 1)
            for i in range(inst):
                ax.scatter([x + 0.02*(i - inst/2)], [y + 0.045],
                           s=30, c="#8be9fd", edgecolors="#ffffff")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=140, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf.read()


# -------------------------------------------------------
# ANALYZE
# -------------------------------------------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        raw = request.get_json(force=True) or {}
        norm = normalize_payload(raw)

        # multi-instance
        multi = detect_deadlock_multi_instance(norm)
        algo1 = "multi-instance-matrix" if multi["deadlocked"] else "no-deadlock-matrix"

        # cycle
        G = build_graph(norm)
        cycle = detect_cycle(G) or []
        algo2 = "graph-cycle" if cycle else "no-cycle-detected"

        png = draw_png_bytes(G, set(cycle))
        b64 = base64.b64encode(png).decode("utf-8")

        return jsonify({
            "deadlock": multi["deadlocked"],
            "deadlocked_processes": multi["deadlocked_processes"],
            "cycle": cycle,
            "visualization": b64,
            "algorithm_used": algo1,
            "cycle_algorithm_used": algo2
        })

    except Exception as e:
        app.logger.exception("Analyze failed")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------
# EXPORT REPORT (PDF or PNG)
# -------------------------------------------------------
@app.route("/export", methods=["POST"])
def export_report():
    try:
        raw = request.get_json(force=True) or {}
        norm = normalize_payload(raw)
        fmt = (raw.get("format") or "pdf").lower()

        G = build_graph(norm)
        cycle = detect_cycle(G)
        multi = detect_deadlock_multi_instance(norm)

        # visualization
        backend_png = raw.get("backendVisualizationBase64")
        if backend_png:
            try:
                img = Image.open(BytesIO(base64.b64decode(backend_png))).convert("RGBA")
            except:
                img = None
        else:
            img = None

        if img is None:
            img = Image.open(BytesIO(draw_png_bytes(G, set(cycle)))).convert("RGBA")
        req = norm["request_edges"]
        alloc = norm["allocation_edges"]

        # PNG Export
        if fmt == "png":
            buf = BytesIO()
            img.save(buf, "PNG")
            buf.seek(0)
            return send_file(buf, mimetype="image/png",
                             as_attachment=True, download_name="visualization.png")

              # ------- PDF EXPORT (Professional Layout) -------
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=landscape(A4))
        width, height = landscape(A4)

        # Colors
        accent = ACCENT_RGB
        text_dark = (0.15, 0.15, 0.15)
        text_light = (1, 1, 1)

        # ---------- HEADER ----------
        pdf.setFillColorRGB(*accent)
        pdf.rect(0, height - 80, width, 80, fill=1)

        pdf.setFillColorRGB(1, 1, 1)
        pdf.setFont("Helvetica-Bold", 24)
        pdf.drawString(40, height - 45, "RAG Analysis Summary")

        pdf.setFont("Helvetica", 11)
        pdf.drawString(40, height - 65, "Resource Allocation Graph • Automatically Generated")

        pdf.setFillColorRGB(*text_dark)

        # ---------- LEFT COLUMN ----------
        left_x = 40
        y = height - 120

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(left_x, y, "System Overview")
        y -= 22

        pdf.setFont("Helvetica", 11)
        pdf.drawString(left_x, y, f"Processes: {', '.join(norm['processes'])}")
        y -= 14

        pdf.drawString(left_x, y,
                    f"Resources: {', '.join([f'{r['id']} ({r['instances']})' for r in norm['resources']])}")
        y -= 14

        pdf.drawString(left_x, y, f"Request edges: {len(req)}")
        y -= 14

        pdf.drawString(left_x, y, f"Allocation edges: {len(alloc)}")
        y -= 26

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(left_x, y, "Deadlock Analysis")
        y -= 22

        pdf.setFont("Helvetica", 11)
        pdf.drawString(left_x, y,
                    f"Deadlock detected: {'YES' if multi['deadlocked'] else 'NO'}")
        y -= 14

        if multi['deadlocked']:
            pdf.drawString(left_x, y,
                        f"Deadlocked processes: {', '.join(multi['deadlocked_processes'])}")
            y -= 18

        pdf.drawString(left_x, y, "Algorithm: Multi-Instance Matrix")
        y -= 26

        # ---------- CYCLE SECTION ----------
        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawString(left_x, y, "Graph Cycle Detection")
        y -= 22

        pdf.setFont("Helvetica", 11)
        pdf.drawString(left_x, y, f"Cycle detected: {'YES' if cycle else 'NO'}")
        y -= 16

        if cycle:
            cyc_text = " → ".join(cycle)
            for line in textwrap.wrap(cyc_text, width=60):
                pdf.drawString(left_x + 12, y, line)
                y -= 12

        # ---------- RIGHT COLUMN (IMAGE) ----------
        right_x = width * 0.48
        img_w = width * 0.45
        img_h = height * 0.55

        pdf.setStrokeColorRGB(0.7, 0.7, 0.7)
        pdf.rect(right_x - 10, height - img_h - 130, img_w + 20, img_h + 20)

        iw, ih = img.size
        scale = min(img_w / iw, img_h / ih)
        iw2, ih2 = int(iw * scale), int(ih * scale)

        pdf.drawImage(
            ImageReader(img.resize((iw2, ih2))),
            right_x + (img_w - iw2)/2,
            height - ih2 - 140,
            width=iw2,
            height=ih2
        )

        # ---------- FOOTER ----------
        pdf.setFont("Helvetica", 9)
        pdf.setFillColorRGB(0.3, 0.3, 0.3)

        pdf.drawString(40, 20, "Generated by Resource Allocation Graph Simulator")
        pdf.drawRightString(
            width - 40, 20,
            datetime.now().strftime("Generated on %d %b %Y • %I:%M %p")
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
    except Exception as e:
        app.logger.exception("Export failed")
        return jsonify({"error": str(e)}), 500


# -------------------------------------------------------
# RUN SERVER
# -------------------------------------------------------
if __name__ == "__main__":
    print("Backend running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000)
