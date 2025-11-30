#!/usr/bin/env python3
"""
Module 3 — Dark-themed Animated RAG Visualizer (single-file)
Drop this file next to graph_data.json and analysis_output.json and run:
    python module3_visualizer.py
"""

import json
import math
import os
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import networkx as nx
import matplotlib
matplotlib.use("TkAgg")
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
from matplotlib.animation import FuncAnimation

# -----------------------
# Theme & Colors (dark)
# -----------------------
BG = "#0f1722"            # page bg (dark navy)
PANEL_BG = "#111827"      # sidebar
TEXT = "#e6eef6"          # light text
PROCESS_COLOR = "#3b82f6" # bright blue
RESOURCE_COLOR = "#10b981" # mint green
DEADLOCK_COLOR = "#ff416c" # vivid red/pink
REQUEST_EDGE = "#60a5fa"
ALLOC_EDGE = "#34d399"
NORMAL_EDGE = "#7c8b95"
NODE_SIZE = 1400
FPS = 20

# -----------------------
# Visualizer class
# -----------------------
class RAGVisualizer:
    def __init__(self, root):
        self.root = root
        self.root.title("Module 3 — Animated RAG Visualizer (Dark)")
        self.root.configure(bg=BG)

        # Left sidebar
        sidebar = tk.Frame(root, bg=PANEL_BG, width=260)
        sidebar.pack(side="left", fill="y")

        lbl = tk.Label(sidebar, text="MODULE 3\nRAG VISUALIZER",
                       fg=TEXT, bg=PANEL_BG, font=("Segoe UI", 14, "bold"))
        lbl.pack(pady=(12, 8), padx=12)

        btn_kwargs = {"fill": "x", "padx": 14, "pady": 6}
        ttk.Style().configure("TButton", padding=6, font=("Segoe UI", 10))

        ttk.Button(sidebar, text="Load JSON", command=self.load_json).pack(**btn_kwargs)
        ttk.Button(sidebar, text="Draw Static Graph", command=self.draw_static).pack(**btn_kwargs)
        ttk.Button(sidebar, text="Animate Deadlock", command=self.animate_deadlock).pack(**btn_kwargs)
        ttk.Button(sidebar, text="Export PNG", command=lambda: self.export("png")).pack(**btn_kwargs)
        ttk.Button(sidebar, text="Export PDF", command=lambda: self.export("pdf")).pack(**btn_kwargs)

        # status text
        self.status_var = tk.StringVar(value="Ready")
        status_label = tk.Label(sidebar, textvariable=self.status_var, bg=PANEL_BG, fg="#9aa6b2", anchor="w")
        status_label.pack(fill="x", padx=12, pady=(10, 0))

        # Matplotlib figure (dark)
        self.fig = Figure(figsize=(9, 6), dpi=100, facecolor=BG)
        self.ax = self.fig.add_subplot(111)
        self.ax.set_facecolor(BG)

        canvas_frame = tk.Frame(root, bg=BG)
        canvas_frame.pack(side="right", fill="both", expand=True)

        self.canvas = FigureCanvasTkAgg(self.fig, master=canvas_frame)
        self.canvas_widget = self.canvas.get_tk_widget()
        self.canvas_widget.pack(fill="both", expand=True)

        # Mouse controls
        self.canvas_widget.bind("<MouseWheel>", self._on_mouse_wheel)
        self.canvas_widget.bind("<ButtonPress-1>", self._on_pan_start)
        self.canvas_widget.bind("<B1-Motion>", self._on_pan_move)

        # Graph data holders
        self.G = None
        self.pos = {}
        self.graph_data = {}
        self.analysis = {}
        self.animation = None

        # Try auto-load if files present
        if os.path.exists("graph_data.json") and os.path.exists("analysis_output.json"):
            try:
                self.load_json(silent=True)
                self.draw_static()
            except Exception:
                pass

    # -----------------------
    # Utility: stop any animation safely
    # -----------------------
    def _stop_animation_safe(self):
        if hasattr(self, "animation") and self.animation is not None:
            try:
                if hasattr(self.animation, "event_source") and self.animation.event_source is not None:
                    try:
                        self.animation.event_source.stop()
                    except Exception:
                        pass
            except Exception:
                pass
            self.animation = None

    # -----------------------
    # Load JSONs
    # -----------------------
    def load_json(self, silent=False):
        # stop any running animation
        self._stop_animation_safe()

        try:
            with open("graph_data.json", "r") as f:
                self.graph_data = json.load(f)
            with open("analysis_output.json", "r") as f:
                self.analysis = json.load(f)
        except Exception as e:
            if not silent:
                messagebox.showerror("Load Error", f"Could not read JSON files:\n{e}")
            self.status_var.set("Load failed")
            return

        # build graph
        self.G = nx.DiGraph()
        for p in self.graph_data.get("processes", []):
            self.G.add_node(p, ntype="process")
        for r in self.graph_data.get("resources", []):
            self.G.add_node(r, ntype="resource")

        for e in self.graph_data.get("request_edges", []):
            if len(e) >= 2:
                self.G.add_edge(e[0], e[1], etype="request")
        for e in self.graph_data.get("allocation_edges", []):
            if len(e) >= 2:
                self.G.add_edge(e[0], e[1], etype="alloc")

        # deterministic layout for reproducibility
        try:
            self.pos = nx.spring_layout(self.G, seed=42)
        except Exception:
            self.pos = {n: (i % 5, i // 5) for i, n in enumerate(self.G.nodes())}

        self.status_var.set("JSON loaded")
        if not silent:
            messagebox.showinfo("Loaded", "graph_data.json and analysis_output.json loaded.")

    # -----------------------
    # Draw static graph (stops animation first)
    # -----------------------
    def draw_static(self):
        # stop animation if running
        self._stop_animation_safe()

        if self.G is None:
            self.status_var.set("No graph loaded")
            return

        self.ax.clear()
        self.ax.set_facecolor(BG)
        self.ax.set_axis_off()

        dead_nodes = set(self.analysis.get("deadlock_cycle", []))
        deadlock = bool(self.analysis.get("deadlock", False))

        # draw edges
        for u, v, data in self.G.edges(data=True):
            x1, y1 = self.pos.get(u, (0, 0))
            x2, y2 = self.pos.get(v, (0, 0))
            if deadlock and u in dead_nodes and v in dead_nodes:
                color = DEADLOCK_COLOR
                lw = 3.2
            else:
                color = REQUEST_EDGE if data.get("etype") == "request" else ALLOC_EDGE
                lw = 1.6
            self.ax.plot([x1, x2], [y1, y2], color=color, linewidth=lw, alpha=0.95, zorder=2)

        # draw nodes
        for n, data in self.G.nodes(data=True):
            x, y = self.pos.get(n, (0, 0))
            if data.get("ntype") == "process":
                marker = "o"
                color = PROCESS_COLOR
            else:
                marker = "s"
                color = RESOURCE_COLOR

            if deadlock and n in dead_nodes:
                color = DEADLOCK_COLOR

            self.ax.scatter(x, y, s=NODE_SIZE, c=color, marker=marker, edgecolors="#0b1220", linewidths=1.1, zorder=5)
            self.ax.text(x, y, n, fontsize=10, ha="center", va="center", color="#041726", zorder=6)

        # title
        if deadlock:
            self.ax.set_title("DEADLOCK DETECTED", color=DEADLOCK_COLOR, fontsize=16, pad=12)
            self.status_var.set("Deadlock detected")
        else:
            self.ax.set_title("SAFE STATE — NO DEADLOCK", color="#34d399", fontsize=16, pad=12)
            self.status_var.set("Safe state")

        # draw immediately
        try:
            self.canvas.draw_idle()
        except Exception:
            self.canvas.draw()

    # -----------------------
    # Animate deadlock (pulsing nodes + guaranteed red cycle edges)
    # -----------------------
    def animate_deadlock(self, duration_seconds=6.0):
        if self.G is None:
            messagebox.showwarning("No graph", "Load JSON first.")
            return

        if not self.analysis.get("deadlock", False):
            messagebox.showinfo("No deadlock", "No deadlock detected in the analysis.")
            return

        # Stop previous animation safely
        self._stop_animation_safe()

        cycle = list(self.analysis.get("deadlock_cycle", []))
        if not cycle:
            messagebox.showinfo("No cycle", "Deadlock cycle empty.")
            return

        # Guarantee we have positions for cycle nodes
        for n in cycle:
            if n not in self.pos:
                # fallback place
                self.pos[n] = (len(self.pos), 0)

        # Build guaranteed cycle edges between successive cycle nodes (wrap-around)
        cycle_edges = []
        if len(cycle) > 1:
            for i in range(len(cycle)):
                u = cycle[i]
                v = cycle[(i + 1) % len(cycle)]
                cycle_edges.append((u, v))

        # Also include any edges present among cycle nodes (fallback)
        for u, v in self.G.edges():
            if u in cycle and v in cycle and (u, v) not in cycle_edges:
                cycle_edges.append((u, v))

        # draw static as base
        self.draw_static()

        frames = max(12, int(FPS * duration_seconds))
        drawn_artists = []

        def update(frame):
            # clear previous dynamic artists
            for a in drawn_artists:
                try:
                    a.remove()
                except Exception:
                    pass
            drawn_artists.clear()

            t = frame / frames
            pulse = 1.0 + 0.28 * math.sin(2 * math.pi * t)   # node size factor
            glow = 0.25 + 0.75 * abs(math.sin(2 * math.pi * t * 1.2))  # edge alpha

            # pulsing nodes (draw on top)
            for n in cycle:
                x, y = self.pos[n]
                sc = self.ax.scatter([x], [y],
                                     s=NODE_SIZE * pulse,
                                     c=DEADLOCK_COLOR,
                                     edgecolors="#0b1220",
                                     linewidths=1.2,
                                     alpha=0.96,
                                     zorder=20)
                drawn_artists.append(sc)

            # glowing cycle edges (draw on top)
            for (u, v) in cycle_edges:
                x1, y1 = self.pos[u]
                x2, y2 = self.pos[v]
                ln, = self.ax.plot([x1, x2], [y1, y2],
                                   color=DEADLOCK_COLOR,
                                   linewidth=3.0 + 2.0 * pulse,
                                   alpha=glow,
                                   zorder=18)
                drawn_artists.append(ln)

            # queue draw
            self.canvas.draw_idle()
            return drawn_artists

        # create persistent animation object and start it
        self.animation = FuncAnimation(self.fig, update, frames=frames, interval=int(1000 / FPS), blit=False, repeat=True)
        self.status_var.set("Animating deadlock")

        # ensure first frame appears immediately
        try:
            self.canvas.draw_idle()
        except Exception:
            self.canvas.draw()

    # -----------------------
    # Export
    # -----------------------
    def export(self, fmt="png"):
        # stop animation while exporting
        self._stop_animation_safe()

        if self.G is None:
            messagebox.showwarning("No graph", "Load JSON first.")
            return

        ext = ".png" if fmt == "png" else ".pdf"
        types = [("PNG image", "*.png")] if fmt == "png" else [("PDF file", "*.pdf")]
        path = filedialog.asksaveasfilename(defaultextension=ext, filetypes=types)
        if not path:
            return
        try:
            self.fig.savefig(path, dpi=300, bbox_inches="tight", facecolor=self.fig.get_facecolor())
            messagebox.showinfo("Saved", f"Saved to: {path}")
        except Exception as e:
            messagebox.showerror("Save error", str(e))

    # -----------------------
    # Zoom & pan handlers
    # -----------------------
    def _on_mouse_wheel(self, event):
        # Zoom in/out around center
        base = 1.12
        if event.delta > 0:
            scale = 1 / base
        else:
            scale = base

        x0, x1 = self.ax.get_xlim()
        y0, y1 = self.ax.get_ylim()
        cx = 0.5 * (x0 + x1)
        cy = 0.5 * (y0 + y1)
        w = (x1 - x0) * scale
        h = (y1 - y0) * scale
        self.ax.set_xlim(cx - w / 2, cx + w / 2)
        self.ax.set_ylim(cy - h / 2, cy + h / 2)
        try:
            self.canvas.draw_idle()
        except Exception:
            self.canvas.draw()

    def _on_pan_start(self, event):
        self._pan_start = (event.x, event.y)
        self._pan_xlim = self.ax.get_xlim()
        self._pan_ylim = self.ax.get_ylim()

    def _on_pan_move(self, event):
        if not hasattr(self, "_pan_start"):
            return
        dx = event.x - self._pan_start[0]
        dy = event.y - self._pan_start[1]
        width = self._pan_xlim[1] - self._pan_xlim[0]
        height = self._pan_ylim[1] - self._pan_ylim[0]
        # sensitivity factor
        fx = dx / 200.0
        fy = dy / 200.0
        self.ax.set_xlim(self._pan_xlim[0] - fx * width, self._pan_xlim[1] - fx * width)
        self.ax.set_ylim(self._pan_ylim[0] + fy * height, self._pan_ylim[1] + fy * height)
        try:
            self.canvas.draw_idle()
        except Exception:
            self.canvas.draw()

# -----------------------
# Run
# -----------------------
if __name__ == "__main__":
    root = tk.Tk()
    root.geometry("1200x780")
    app = RAGVisualizer(root)
    root.mainloop()
