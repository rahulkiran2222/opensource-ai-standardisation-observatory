/**
 * network-analysis.js - Stage 2 Network Analysis & Graph Controller
 * Consumes data/outputs/network_metrics.json and data/processed/network_graph.json
 */

let nodeMetricsData = [];
let sortCol = 5; // Default sort by Betweenness Centrality
let sortAsc = false;

document.addEventListener("DOMContentLoaded", async () => {
  Stage2.renderHeader("network-analysis");
  Stage2.renderMethodologyBanner("stage2-notice-mount");
  Stage2.renderFooter("stage2-footer-mount");

  const [metricsData, graphData] = await Promise.all([
    Stage2.loadAnalysisData("network_metrics.json"),
    Stage2.loadAnalysisData("../processed/network_graph.json") || Stage2.loadAnalysisData("network_graph.json")
  ]);

  if (!metricsData) {
    document.getElementById("metrics-tbody").innerHTML = `
      <tr><td colspan="8" style="text-align: center; color: var(--accent-red);">
        Failed to load network metrics. Run <code>python3 analysis/calculate_metrics.py</code>.
      </td></tr>`;
    return;
  }

  // Populate KPIs
  const gl = metricsData.graph_level;
  document.getElementById("kpi-nodes").textContent = gl.total_nodes;
  document.getElementById("kpi-edges").textContent = gl.total_edges;
  document.getElementById("kpi-edges-sub").textContent = `${gl.verified_edges} verified / ${gl.candidate_edges} candidate / ${gl.evidence_gaps} gaps`;
  document.getElementById("kpi-density").textContent = gl.density_overall;
  document.getElementById("kpi-density-sub").textContent = `Verified-only: ${gl.density_verified_only}`;
  document.getElementById("kpi-avg-degree").textContent = gl.average_degree;
  document.getElementById("kpi-avg-degree-sub").textContent = `Verified avg: ${gl.average_verified_degree} links/node`;
  document.getElementById("kpi-components").textContent = gl.connected_components_count;

  // Store for sorting
  nodeMetricsData = metricsData.node_level || [];
  renderMetricsTable();

  // Populate Sector Matrix
  const sectorTbody = document.getElementById("sector-matrix-tbody");
  sectorTbody.innerHTML = "";
  Object.entries(metricsData.sector_interactions || {}).forEach(([pair, count]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong><code>${pair}</code></strong></td>
      <td><strong>${count}</strong> connection${count > 1 ? "s" : ""}</td>
      <td><span class="badge badge-documented">Inter-Organizational</span></td>
      <td style="color: var(--text-muted);">
        ${
          pair.includes("open_source_project") && pair.includes("standards_body")
            ? "Direct project engagement with accredited SDO technical committees."
            : pair.includes("institution")
            ? "Public policy consultations, consortium memberships, or regulatory compliance filings."
            : "Framework interoperability or benchmark alignment."
        }
      </td>
    `;
    sectorTbody.appendChild(tr);
  });

  // Render SVG Graph if graph data available
  if (graphData && graphData.nodes) {
    renderSvgGraph(graphData);
  }
});

function renderMetricsTable() {
  const tbody = document.getElementById("metrics-tbody");
  tbody.innerHTML = "";

  const sorted = [...nodeMetricsData].sort((a, b) => {
    let valA, valB;
    switch (sortCol) {
      case 0: valA = a.name; valB = b.name; return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 1: valA = a.entity_type; valB = b.entity_type; return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      case 2: valA = a.degree; valB = b.degree; break;
      case 3: valA = a.verified_degree; valB = b.verified_degree; break;
      case 4: valA = a.degree_centrality; valB = b.degree_centrality; break;
      case 5: valA = a.betweenness_centrality; valB = b.betweenness_centrality; break;
      case 6: valA = a.closeness_centrality; valB = b.closeness_centrality; break;
      case 7: valA = a.clustering_coefficient; valB = b.clustering_coefficient; break;
      default: return 0;
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  sorted.forEach((node) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${node.name}</strong></td>
      <td><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">${node.entity_type.replace(/_/g, " ")}</span></td>
      <td><strong>${node.degree}</strong></td>
      <td style="color: var(--accent-green); font-weight: 600;">${node.verified_degree}</td>
      <td style="font-family: var(--font-mono);">${node.degree_centrality.toFixed(4)}</td>
      <td style="font-family: var(--font-mono); font-weight: 600; color: ${node.betweenness_centrality > 0 ? "var(--accent-terracotta)" : "inherit"};">
        ${node.betweenness_centrality.toFixed(4)}
      </td>
      <td style="font-family: var(--font-mono);">${node.closeness_centrality.toFixed(4)}</td>
      <td style="font-family: var(--font-mono);">${node.clustering_coefficient.toFixed(4)}</td>
    `;
    tbody.appendChild(tr);
  });
}

window.sortMetricsTable = function(colIndex) {
  if (sortCol === colIndex) {
    sortAsc = !sortAsc;
  } else {
    sortCol = colIndex;
    sortAsc = (colIndex === 0 || colIndex === 1);
  }
  renderMetricsTable();
};

function renderSvgGraph(graph) {
  const svg = document.getElementById("network-svg");
  const tooltip = document.getElementById("graph-tooltip");
  if (!svg) return;

  const width = 900;
  const height = 450;
  svg.innerHTML = "";

  // Categorize positions:
  // Projects on left (x: 180), SDOs on right (x: 720), Institutions/Frameworks in middle/bottom (x: 450)
  const nodePositions = {};
  const projects = graph.nodes.filter(n => n.entity_type === "open_source_project");
  const sdos = graph.nodes.filter(n => n.entity_type === "standards_body");
  const institutions = graph.nodes.filter(n => n.entity_type !== "open_source_project" && n.entity_type !== "standards_body");

  projects.forEach((n, i) => {
    nodePositions[n.name] = { x: 180, y: 70 + i * (320 / Math.max(projects.length - 1, 1)) };
  });

  sdos.forEach((n, i) => {
    nodePositions[n.name] = { x: 720, y: 80 + i * (300 / Math.max(sdos.length - 1, 1)) };
  });

  institutions.forEach((n, i) => {
    nodePositions[n.name] = { x: 450, y: 100 + i * (260 / Math.max(institutions.length - 1, 1)) };
  });

  // Draw Edges
  graph.edges.forEach((edge) => {
    const p1 = nodePositions[edge.source];
    const p2 = nodePositions[edge.target];
    if (!p1 || !p2) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);

    if (edge.evidence_status === "independently_verified") {
      line.setAttribute("stroke", "#166534");
      line.setAttribute("stroke-width", "2.2");
      line.setAttribute("opacity", "0.9");
    } else if (edge.evidence_status === "documented") {
      line.setAttribute("stroke", "#1E3A8A");
      line.setAttribute("stroke-width", "1.8");
      line.setAttribute("opacity", "0.85");
    } else if (edge.evidence_status === "candidate") {
      line.setAttribute("stroke", "#D97706");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-dasharray", "4,4");
      line.setAttribute("opacity", "0.75");
    } else {
      // Gap
      line.setAttribute("stroke", "#DC2626");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("stroke-dasharray", "2,3");
      line.setAttribute("opacity", "0.75");
    }

    line.addEventListener("mouseenter", (e) => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${edge.source} ↔ ${edge.target}</strong><br>Type: ${edge.relationship_type}<br>Status: ${edge.evidence_status}`;
    });
    line.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top + 10}px`;
    });
    line.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    svg.appendChild(line);
  });

  // Draw Nodes
  graph.nodes.forEach((node) => {
    const pos = nodePositions[node.name];
    if (!pos) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", pos.x);
    circle.setAttribute("cy", pos.y);
    circle.setAttribute("r", Math.min(10 + node.degree * 2.5, 20));

    let fill = "#FDF2E9";
    let stroke = "#9A3412";
    if (node.entity_type === "standards_body") {
      fill = "#EFF6FF";
      stroke = "#1E3A8A";
    } else if (node.entity_type === "institution") {
      fill = "#FEF3C7";
      stroke = "#78350F";
    } else if (node.entity_type === "standard_or_framework") {
      fill = "#F1F5F9";
      stroke = "#475569";
    }

    circle.setAttribute("fill", fill);
    circle.setAttribute("stroke", stroke);
    circle.setAttribute("stroke-width", "2");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", pos.x + (pos.x > 500 ? 18 : -18));
    text.setAttribute("y", pos.y + 4);
    text.setAttribute("text-anchor", pos.x > 500 ? "start" : "end");
    text.setAttribute("font-family", "Fraunces, serif");
    text.setAttribute("font-size", "11px");
    text.setAttribute("font-weight", "600");
    text.setAttribute("fill", "#1C1917");
    text.textContent = node.name;

    g.appendChild(circle);
    g.appendChild(text);

    g.addEventListener("mouseenter", (e) => {
      tooltip.style.display = "block";
      tooltip.innerHTML = `<strong>${node.name}</strong> (${node.entity_type.replace(/_/g, " ")})<br>Total Degree: ${node.degree}<br>Verified Links: ${node.verified_degree}`;
    });
    g.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      tooltip.style.left = `${e.clientX - rect.left + 10}px`;
      tooltip.style.top = `${e.clientY - rect.top + 10}px`;
    });
    g.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    svg.appendChild(g);
  });
}
