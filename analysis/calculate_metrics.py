#!/usr/bin/env python3
"""
calculate_metrics.py - Stage 2 Network Metrics Calculator
Computes exact graph-level and node-level metrics:
- Degree, betweenness, closeness centralities
- Local clustering coefficients
- Network density (overall & verified-only)
- Sector cross-link distributions
Outputs:
- data/outputs/network_metrics.json
- data/outputs/network_metrics.csv
"""

import json
import csv
from pathlib import Path
from collections import defaultdict, deque

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"

def calculate_metrics():
    graph_file = PROCESSED_DIR / "network_graph.json"
    if not graph_file.exists():
        raise FileNotFoundError("Missing network_graph.json. Run build_network.py first.")

    with open(graph_file, "r", encoding="utf-8") as f:
        graph = json.load(f)

    nodes = graph["nodes"]
    edges = graph["edges"]
    N = len(nodes)

    if N <= 1:
        raise ValueError("Network has too few nodes to compute centralities.")

    # Build adjacency sets
    adj = defaultdict(set)
    adj_verified = defaultdict(set)
    node_by_name = {n["name"]: n for n in nodes}

    for edge in edges:
        u = edge["source"]
        v = edge["target"]
        if u in node_by_name and v in node_by_name:
            adj[u].add(v)
            adj[v].add(u)
            if edge["evidence_status"] in ("independently_verified", "documented"):
                adj_verified[u].add(v)
                adj_verified[v].add(u)

    # 1. Degree Centrality
    degree_centrality = {}
    verified_degree_centrality = {}
    for n in nodes:
        name = n["name"]
        deg = len(adj[name])
        ver_deg = len(adj_verified[name])
        degree_centrality[name] = round(deg / (N - 1), 4)
        verified_degree_centrality[name] = round(ver_deg / (N - 1), 4)

    # 2. Closeness Centrality (BFS shortest paths)
    closeness_centrality = {}
    for n in nodes:
        name = n["name"]
        distances = {}
        queue = deque([(name, 0)])
        distances[name] = 0
        while queue:
            curr, d = queue.popleft()
            for neighbor in adj[curr]:
                if neighbor not in distances:
                    distances[neighbor] = d + 1
                    queue.append((neighbor, d + 1))

        reachable_nodes = len(distances) - 1
        if reachable_nodes > 0:
            sum_distances = sum(distances.values())
            # Normalized closeness: (reachable / (N - 1)) * (reachable / sum_distances)
            closeness_centrality[name] = round((reachable_nodes / (N - 1)) * (reachable_nodes / sum_distances), 4)
        else:
            closeness_centrality[name] = 0.0

    # 3. Betweenness Centrality (Brandes algorithm using standard BFS)
    betweenness = {n["name"]: 0.0 for n in nodes}
    for s in nodes:
        s_name = s["name"]
        S = []
        P = defaultdict(list)
        sigma = defaultdict(int)
        sigma[s_name] = 1
        d = {s_name: 0}
        Q = deque([s_name])

        while Q:
            v = Q.popleft()
            S.append(v)
            for w in adj[v]:
                # w found for the first time?
                if w not in d:
                    d[w] = d[v] + 1
                    Q.append(w)
                # shortest path to w via v?
                if d[w] == d[v] + 1:
                    sigma[w] += sigma[v]
                    P[w].append(v)

        delta = defaultdict(float)
        while S:
            w = S.pop()
            for v in P[w]:
                delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
            if w != s_name:
                betweenness[w] += delta[w]

    # Normalize betweenness: divide by (N-1)(N-2) for undirected graph
    scale = 1.0 / ((N - 1) * (N - 2)) if N > 2 else 1.0
    for name in betweenness:
        # undirected graph has each path counted twice
        betweenness[name] = round((betweenness[name] / 2.0) * scale, 4)

    # 4. Local Clustering Coefficient
    clustering = {}
    for n in nodes:
        name = n["name"]
        neighbors = list(adj[name])
        k = len(neighbors)
        if k < 2:
            clustering[name] = 0.0
        else:
            links = 0
            for i in range(k):
                for j in range(i + 1, k):
                    if neighbors[j] in adj[neighbors[i]]:
                        links += 1
            clustering[name] = round((2.0 * links) / (k * (k - 1)), 4)

    # Graph-level metrics
    E_total = len(edges)
    E_verified = len([e for e in edges if e["evidence_status"] in ("independently_verified", "documented")])
    max_edges = (N * (N - 1)) / 2.0 if N > 1 else 1.0

    density_overall = round(E_total / max_edges, 4)
    density_verified = round(E_verified / max_edges, 4)
    avg_degree = round((2.0 * E_total) / N, 2)
    avg_verified_degree = round((2.0 * E_verified) / N, 2)

    # Sector interaction matrix
    sector_matrix = defaultdict(lambda: defaultdict(int))
    for e in edges:
        u_type = node_by_name.get(e["source"], {}).get("entity_type", "unknown")
        v_type = node_by_name.get(e["target"], {}).get("entity_type", "unknown")
        pair = tuple(sorted([u_type, v_type]))
        sector_matrix[pair[0]][pair[1]] += 1

    # Compile node metrics table
    node_metrics_list = []
    for n in nodes:
        name = n["name"]
        node_metrics_list.append({
            "name": name,
            "entity_type": n["entity_type"],
            "degree": len(adj[name]),
            "verified_degree": len(adj_verified[name]),
            "degree_centrality": degree_centrality[name],
            "verified_degree_centrality": verified_degree_centrality[name],
            "betweenness_centrality": betweenness[name],
            "closeness_centrality": closeness_centrality[name],
            "clustering_coefficient": clustering[name]
        })

    # Sort node metrics by betweenness descending
    node_metrics_list.sort(key=lambda x: x["betweenness_centrality"], reverse=True)

    metrics_payload = {
        "metadata": {
            "version": "2.0.0",
            "date": "2026-10-20",
            "calculation_engine": "Observatory Pure-Python Graph Engine"
        },
        "graph_level": {
            "total_nodes": N,
            "total_edges": E_total,
            "verified_edges": E_verified,
            "candidate_edges": len([e for e in edges if e["evidence_status"] == "candidate"]),
            "evidence_gaps": len([e for e in edges if e["evidence_status"] == "gap"]),
            "density_overall": density_overall,
            "density_verified_only": density_verified,
            "average_degree": avg_degree,
            "average_verified_degree": avg_verified_degree,
            "connected_components_count": graph["metadata"]["connected_components_count"],
            "verified_components_count": graph["metadata"]["verified_components_count"],
            "isolated_nodes_count": graph["metadata"]["isolated_nodes_count"]
        },
        "node_level": node_metrics_list,
        "sector_interactions": {f"{k1} <-> {k2}": v for k1, d in sector_matrix.items() for k2, v in d.items()}
    }

    # Save outputs
    with open(OUTPUTS_DIR / "network_metrics.json", "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    with open(OUTPUTS_DIR / "network_metrics.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "name", "entity_type", "degree", "verified_degree",
            "degree_centrality", "verified_degree_centrality",
            "betweenness_centrality", "closeness_centrality",
            "clustering_coefficient"
        ])
        writer.writeheader()
        writer.writerows(node_metrics_list)

    print(f"Metrics calculated: Density={density_overall}, Verified Density={density_verified}, Avg Degree={avg_degree}")
    return metrics_payload

if __name__ == "__main__":
    calculate_metrics()
