#!/usr/bin/env python3
"""
build_network.py - Stage 2 Network Graph Constructor
Constructs graph representation from validated nodes and edges.
Maintains strict separation between verified and provisional links.
Outputs data/processed/network_graph.json.
"""

import json
from pathlib import Path
from collections import defaultdict, deque

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"

def build_network():
    nodes_file = PROCESSED_DIR / "validated_nodes.json"
    edges_file = PROCESSED_DIR / "validated_edges.json"

    if not nodes_file.exists() or not edges_file.exists():
        raise FileNotFoundError("Missing validated nodes or edges. Run validate_data.py first.")

    with open(nodes_file, "r", encoding="utf-8") as f:
        nodes = json.load(f)

    with open(edges_file, "r", encoding="utf-8") as f:
        edges = json.load(f)

    # Build adjacency
    adj = defaultdict(list)
    adj_verified = defaultdict(list)
    node_lookup = {n["name"]: n for n in nodes}

    for edge in edges:
        u = edge["source"]
        v = edge["target"]
        adj[u].append((v, edge))
        adj[v].append((u, edge))

        if edge["evidence_status"] in ("independently_verified", "documented"):
            adj_verified[u].append((v, edge))
            adj_verified[v].append((u, edge))

    # Connected components using BFS (Full Graph)
    visited = set()
    components = []
    for node in nodes:
        name = node["name"]
        if name not in visited:
            comp = []
            queue = deque([name])
            visited.add(name)
            while queue:
                curr = queue.popleft()
                comp.append(curr)
                for neighbor, _ in adj[curr]:
                    if neighbor not in visited and neighbor in node_lookup:
                        visited.add(neighbor)
                        queue.append(neighbor)
            components.append(comp)

    # Connected components for Verified Subgraph
    visited_v = set()
    components_v = []
    for node in nodes:
        name = node["name"]
        if name not in visited_v:
            comp = []
            queue = deque([name])
            visited_v.add(name)
            while queue:
                curr = queue.popleft()
                comp.append(curr)
                for neighbor, _ in adj_verified[curr]:
                    if neighbor not in visited_v and neighbor in node_lookup:
                        visited_v.add(neighbor)
                        queue.append(neighbor)
            if len(comp) > 1 or adj_verified[name]:
                components_v.append(comp)

    # Isolated nodes
    isolated_nodes = [n["name"] for n in nodes if len(adj[n["name"]]) == 0]

    # Graph payload
    network_graph = {
        "metadata": {
            "version": "2.0.0",
            "methodology": "Stage 2 Dual-Layer Verified Network Analysis",
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "verified_edges_count": len([e for e in edges if e["evidence_status"] in ("independently_verified", "documented")]),
            "candidate_edges_count": len([e for e in edges if e["evidence_status"] == "candidate"]),
            "gap_edges_count": len([e for e in edges if e["evidence_status"] == "gap"]),
            "connected_components_count": len(components),
            "verified_components_count": len(components_v),
            "isolated_nodes_count": len(isolated_nodes)
        },
        "nodes": [
            {
                **n,
                "degree": len(adj[n["name"]]),
                "verified_degree": len(adj_verified[n["name"]]),
                "is_isolated": len(adj[n["name"]]) == 0
            }
            for n in nodes
        ],
        "edges": edges,
        "components": components,
        "verified_components": components_v,
        "isolated_nodes": isolated_nodes
    }

    out_file = PROCESSED_DIR / "network_graph.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(network_graph, f, indent=2)

    print(f"Network graph built: {len(nodes)} nodes, {len(edges)} edges, {len(components)} components.")
    return network_graph

if __name__ == "__main__":
    build_network()
