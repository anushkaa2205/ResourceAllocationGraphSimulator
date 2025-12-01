# backend/backend.py
"""
Final Backend — Theme-B (single accent #0000CC)
Provides:
 - POST /analyze -> JSON { deadlock, cycle, visualization (base64 PNG) }
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

# Accent color chosen by you: #0000CC
ACCENT_HEX = "#0000CC"
# convert hex to RGB fractions for reportlab
def hex_to_rgb_frac(hexstr):
    hexstr = hexstr.lstrip("#")
    r = int(hexstr[0:2], 16) / 255.0
    g = int(hexstr[2:4], 16) / 255.0
    b = int(hexstr[4:6], 16) / 255.0
    return (r, g, b)

ACCENT_RGB = hex_to_rgb_frac(ACCENT_HEX)

# -------------------------------------------------------
# BUILD GRAPH (from payload)
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
    except Exception:
        return []
    if not cycles:
        return []
    # choose shortest cycle (deterministic by sorting)
    return sorted(cycles, key=lambda c: len(c))[0]

# -------------------------------------------------------
# DRAW PNG (returns bytes)
# -------------------------------------------------------
def draw_png_bytes(G, dead_nodes):
    try:
        pos = nx.spring_layout(G, seed=42)
    except Exception:
        pos = {n: (i, i) for i, n in enumerate(G.nodes())}

    fig = plt.Figure(figsize=(9, 6), dpi=120, facecolor=BG)
    ax = fig.add_subplot(111)
    ax.set_facecolor(BG)
    ax.set_axis_off()

    # draw edges
    for u, v, d in G.edges(data=True):
        x1, y1 = pos.get(u, (0, 0))
        x2, y2 = pos.get(v, (0, 0))
        is_dead = u in dead_nodes and v in dead_nodes
        color = DEADLOCK_COLOR if is_dead else (REQUEST_EDGE if d.get("etype") == "request" else ALLOC_EDGE)
        lw = 3.0 if is_dead else 1.6
        ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw, alpha=0.95, zorder=2)

    # draw nodes
    for n, data in G.nodes(data=True):
        x, y = pos.get(n, (0, 0))
        is_dead = n in dead_nodes
        marker = "o" if data.get("ntype") == "process" else "s"
        color = DEADLOCK_COLOR if is_dead else (PROCESS_COLOR if data.get("ntype") == "process" else RESOURCE_COLOR)
        ax.scatter([x], [y], s=NODE_SIZE, c=color, marker=marker, edgecolors=NODE_EDGE_COLOR, linewidths=1.1, zorder=5)
        ax.text(x, y, n, fontsize=10, ha="center", va="center", color="#041726", zorder=6)

    title = "DEADLOCK DETECTED" if dead_nodes else "SYSTEM STATE"
    ax.set_title(title, color=ACCENT_HEX, fontsize=16, pad=12)

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return buf.read()

# -------------------------------------------------------
# ANALYZE endpoint
# -------------------------------------------------------
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        payload = request.get_json(force=True) or {}
        G = build_graph(payload)
        cycle = detect_cycle(G)
        png = draw_png_bytes(G, cycle)
        b64 = base64.b64encode(png).decode("utf-8")
        return jsonify({"deadlock": bool(cycle), "cycle": cycle, "visualization": b64})
    except Exception as e:
        app.logger.exception("Analyze failed")
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------
# Export endpoint: PDF (rich Theme B) or PNG
# -------------------------------------------------------
@app.route("/export", methods=["POST"])
def export_report():
    """
    Accepts JSON with keys:
      - processes, resources, request_edges, allocation_edges
      - analysis (optional): { explanation, fixes: [] }
      - backendVisualizationBase64 (optional)
      - format (optional): "pdf" (default) or "png"
    Returns: PDF or PNG attachment.
    """
    try:
        payload = request.get_json(force=True) or {}
        fmt = (payload.get("format") or "pdf").lower()

        # Build graph + detect cycle
        G = build_graph(payload)
        cycle = detect_cycle(G)
        dead = bool(cycle)

        # Prepare image: use backend-provided PNG if valid, else generate
        backend_img_b64 = payload.get("backendVisualizationBase64")
        image_obj = None
        if backend_img_b64:
            try:
                raw = base64.b64decode(backend_img_b64)
                image_obj = Image.open(BytesIO(raw)).convert("RGBA")
            except Exception:
                image_obj = None

        if image_obj is None:
            png_bytes = draw_png_bytes(G, cycle)
            image_obj = Image.open(BytesIO(png_bytes)).convert("RGBA")

        # PNG export path
        if fmt == "png":
            buf = BytesIO()
            image_obj.save(buf, format="PNG")
            buf.seek(0)
            return send_file(buf, mimetype="image/png", as_attachment=True, download_name="visualization.png")

        # PDF export — Theme B (white background + blue accent #0000CC)
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=landscape(A4))
        width, height = landscape(A4)

        # light page border
        pdf.setStrokeColorRGB(0.85, 0.85, 0.85)
        pdf.setLineWidth(1)
        margin = 20
        pdf.rect(margin, margin, width - margin*2, height - margin*2, stroke=1, fill=0)

        # top accent bar (always ACCENT_RGB)
        pdf.setFillColorRGB(*ACCENT_RGB)
        pdf.rect(0, height - 72, width, 72, fill=1, stroke=0)

        # Title text (white on accent)
        pdf.setFillColorRGB(1, 1, 1)
        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawCentredString(width/2, height - 42, "Resource Allocation Graph — System Report")

        # small subtitle
        pdf.setFont("Helvetica", 10)
        pdf.drawCentredString(width/2, height - 58, "Automated analysis of resource allocation & deadlock risk")

        # Left column: system overview & stats
        left_x = 48
        y = height - 110
        pdf.setFillColorRGB(0, 0, 0)
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(left_x, y, "System Overview")
        y -= 18
        pdf.setFont("Helvetica", 10)

        processes = payload.get("processes", []) or []
        resources = payload.get("resources", []) or []
        req_edges = payload.get("request_edges", []) or []
        alloc_edges = payload.get("allocation_edges", []) or []
        total_edges = len(req_edges) + len(alloc_edges)

        pdf.drawString(left_x, y, f"Processes: {', '.join(processes) if processes else '(none)'}")
        y -= 14
        pdf.drawString(left_x, y, f"Resources: {', '.join(resources) if resources else '(none)'}")
        y -= 14
        pdf.drawString(left_x, y, f"Total edges: {total_edges}")
        y -= 14
        pdf.drawString(left_x, y, f"Request edges: {len(req_edges)}")
        y -= 14
        pdf.drawString(left_x, y, f"Allocation edges: {len(alloc_edges)}")
        y -= 18

        # Graph statistics box (compact)
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(left_x, y, "Graph Statistics")
        y -= 16
        pdf.setFont("Helvetica", 10)
        pdf.drawString(left_x + 6, y, f"• Total nodes: {len(processes) + len(resources)}")
        y -= 12
        pdf.drawString(left_x + 6, y, f"• Processes: {len(processes)}")
        y -= 12
        pdf.drawString(left_x + 6, y, f"• Resources: {len(resources)}")
        y -= 12
        y -= 8

        # Deadlock section
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(left_x, y, "Deadlock Analysis")
        y -= 16
        pdf.setFont("Helvetica", 10)
        pdf.drawString(left_x + 6, y, f"Deadlock detected: {'YES' if dead else 'NO'}")
        y -= 14
        if dead:
            pdf.drawString(left_x + 6, y, "Cycle:")
            y -= 12
            # wrap cycle nicely
            cyc_text = " → ".join(cycle)
            # break into lines of ~60 chars
            import textwrap
            wrapped = textwrap.wrap(cyc_text, width=80)
            for wline in wrapped:
                pdf.drawString(left_x + 12, y, wline)
                y -= 12
            y -= 6
        else:
            pdf.drawString(left_x + 6, y, "No cycle was detected.")
            y -= 16

        # Fix suggestions (if any passed in analysis)
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(left_x, y, "Fix Suggestions")
        y -= 16
        pdf.setFont("Helvetica", 10)
        analysis = payload.get("analysis") or {}
        fixes = analysis.get("fixes") if isinstance(analysis.get("fixes"), list) else []
        if fixes:
            for fs in fixes:
                # wrap long fixes
                import textwrap as _tw
                lines = _tw.wrap(fs, width=80)
                for ln in lines:
                    pdf.drawString(left_x + 6, y, "• " + ln)
                    y -= 12
                y -= 4
        else:
            pdf.drawString(left_x + 6, y, "No automated suggestions available.")
            y -= 12

        # Timestamp + footer note
        y -= 8
        pdf.setFont("Helvetica", 9)
        pdf.setFillColorRGB(0.3, 0.3, 0.3)
        pdf.drawString(left_x, margin + 20, "Generated by Resource Allocation Graph Simulator")
        ts = datetime.now().strftime("%d %b %Y, %I:%M %p")
        pdf.drawRightString(width - 48, margin + 20, f"Report generated: {ts}")

        # Right column: visual preview + edge list summary
        right_x = width * 0.52
        preview_w = width - right_x - 48
        preview_h = height * 0.55

        # draw preview box
        pdf.setFillColorRGB(0.98, 0.98, 0.98)
        pdf.rect(right_x - 6, height - 110 - preview_h - 6, preview_w + 12, preview_h + 12, fill=0, stroke=1)

        # helper to place image centered in preview box
        def draw_image_in_preview(img_obj):
            try:
                w, h = img_obj.size
                # allow some padding inside the preview box
                box_w = preview_w - 20
                box_h = preview_h - 20
                scale = min(box_w / w, box_h / h, 1.0)
                iw, ih = int(w * scale), int(h * scale)
                img_reader = ImageReader(img_obj.resize((iw, ih)))
                x = right_x + (preview_w - iw) / 2
                y_top = height - 110 - 10
                pdf.drawImage(img_reader, x, y_top - ih, width=iw, height=ih)
            except Exception as e:
                app.logger.exception("Image placement error: %s", e)

        draw_image_in_preview(image_obj)

        # small edge list summary below image
        edge_list_y = height - 110 - preview_h - 30
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(right_x, edge_list_y, "Edges (sample)")
        edge_list_y -= 14
        pdf.setFont("Helvetica", 9)
        # show up to first 8 edges for readability
        all_edges = [{"from": u, "to": v, "type": d.get("etype")} for u, v, d in G.edges(data=True)]
        sample_edges = all_edges[:8]
        for e in sample_edges:
            pdf.drawString(right_x + 6, edge_list_y, f"{e['from']} → {e['to']} ({e['type']})")
            edge_list_y -= 12
        if len(all_edges) > len(sample_edges):
            pdf.drawString(right_x + 6, edge_list_y, f"... and {len(all_edges) - len(sample_edges)} more")
            edge_list_y -= 12

        # Algorithm notes (bottom-left)
        alg_x = left_x
        alg_y = (edge_list_y - 30) if edge_list_y < y else (y - 30)
        if alg_y < margin + 80:
            alg_y = margin + 80
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(alg_x, alg_y, "Algorithms & Notes")
        alg_y -= 14
        pdf.setFont("Helvetica", 9)
        notes = [
            "Deadlock detection: cycle detection (directed graph).",
            "Safety checks: Banker's algorithm (simulative).",
            "Visualization: deterministic spring layout (seeded)."
        ]
        for n in notes:
            pdf.drawString(alg_x + 6, alg_y, f"• {n}")
            alg_y -= 12

        # finalize PDF
        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name="system_report.pdf")

    except Exception as e:
        app.logger.exception("Export failed")
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------
# RUN (development)
# -------------------------------------------------------
if __name__ == "__main__":
    print("Backend running at http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000)
