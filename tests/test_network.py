"""
Unit tests for Stage 2 network analysis, metric calculations, and pathway finding.
Verifies:
- Node and edge graph construction
- Density and degree calculations
- Betweenness centrality sanity checks
- Cut vertex (bridge actor) detection
- Shortest path resolution
"""

import sys
import os
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from analysis.validate_data import validate_dataset
from analysis.build_network import build_network
from analysis.calculate_metrics import calculate_metrics
from analysis.analyse_pathways import find_cut_vertices, find_shortest_paths

def test_pipeline_execution():
    """Verify that all pipeline steps execute and produce non-empty valid structures."""
    audit = validate_dataset()
    assert audit["total_records_evaluated"] > 0
    assert audit["valid_records_count"] > 0
    assert audit["rejected_records_count"] == 0

    graph = build_network()
    assert len(graph["nodes"]) > 0
    assert len(graph["edges"]) > 0
    assert graph["metadata"]["connected_components_count"] >= 1

    metrics = calculate_metrics()
    assert "graph_level" in metrics
    assert "node_level" in metrics
    assert metrics["graph_level"]["total_nodes"] == len(graph["nodes"])
    assert 0.0 <= metrics["graph_level"]["density_overall"] <= 1.0

def test_centrality_bounds():
    """Verify centrality scores are bounded in [0, 1]."""
    metrics = calculate_metrics()
    for node in metrics["node_level"]:
        assert 0.0 <= node["degree_centrality"] <= 1.0
        assert 0.0 <= node["verified_degree_centrality"] <= 1.0
        assert 0.0 <= node["betweenness_centrality"] <= 1.0
        assert 0.0 <= node["closeness_centrality"] <= 1.0
        assert 0.0 <= node["clustering_coefficient"] <= 1.0

def test_cut_vertex_detection():
    """Test articulation point logic on a known synthetic graph."""
    nodes = [{"name": "A"}, {"name": "B"}, {"name": "C"}]
    edges = [{"source": "A", "target": "B"}, {"source": "B", "target": "C"}]
    cut_vertices = find_cut_vertices(nodes, edges)
    assert "B" in cut_vertices
    assert "A" not in cut_vertices
    assert "C" not in cut_vertices

def test_shortest_path_tracing():
    """Test shortest path finding on a linear graph."""
    nodes = [{"name": "A"}, {"name": "B"}, {"name": "C"}]
    edges = [{"source": "A", "target": "B"}, {"source": "B", "target": "C"}]
    paths = find_shortest_paths(nodes, edges, "A", "C")
    assert len(paths) == 1
    assert paths[0] == ["A", "B", "C"]

if __name__ == "__main__":
    print("Running tests/test_network.py...")
    test_pipeline_execution()
    test_centrality_bounds()
    test_cut_vertex_detection()
    test_shortest_path_tracing()
    print("All network tests passed successfully!")
