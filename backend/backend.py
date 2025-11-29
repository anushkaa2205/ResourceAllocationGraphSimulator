from flask import Flask, request, jsonify
import json
import networkx as nx
from flask_cors import CORS

app = Flask(__name__)
CORS(app) 

# -----------------------------------------------------------
# DEADLOCK DETECTION (Module 2 core algorithm)
# -----------------------------------------------------------
def detect_deadlock(graph):
    processes = graph.get("processes", [])
    resources = graph.get("resources", [])
    req = graph.get("request_edges", [])
    alloc = graph.get("allocation_edges", [])

    # Build Wait-For Graph
    WFG = nx.DiGraph()
    WFG.add_nodes_from(processes)

    # Build allocation map (resource -> process holding it)
    alloc_map = {}
    for r, p in alloc:
        alloc_map.setdefault(r, []).append(p)

    # For each request edge P -> R:
    # If R is held by Q → add edge P -> Q in wait-for graph
    for p, r in req:
        holders = alloc_map.get(r, [])
        for q in holders:
            WFG.add_edge(p, q)

    # detect simple cycles (deadlocks)
    cycles = list(nx.simple_cycles(WFG))

    if cycles:
        return True, cycles[0]
    return False, []

# -----------------------------------------------------------
# API ENDPOINT — receive graph state from frontend
# -----------------------------------------------------------
@app.route("/analyze", methods=["POST"])
def analyze_graph():
    graph = request.json

    # Run deadlock detection
    deadlock, cycle = detect_deadlock(graph)

    # Save graph_data.json
    with open("graph_data.json", "w") as f:
        json.dump(graph, f, indent=4)

    # Save analysis_output.json
    analysis = {
        "deadlock": deadlock,
        "deadlock_cycle": cycle
    }
    with open("analysis_output.json", "w") as f:
        json.dump(analysis, f, indent=4)

    # Send response to frontend
    return jsonify({
        "deadlock": deadlock,
        "cycle": cycle
    })

# -----------------------------------------------------------
# Run server
# -----------------------------------------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
