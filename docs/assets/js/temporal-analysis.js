/**
 * temporal-analysis.js - Stage 2 Temporal Analysis Controller
 * Consumes data/outputs/temporal_analysis.json
 */

document.addEventListener("DOMContentLoaded", async () => {
  Stage2.renderHeader("temporal-analysis");
  Stage2.renderMethodologyBanner("stage2-notice-mount");
  Stage2.renderFooter("stage2-footer-mount");

  const [temporalData, graphData] = await Promise.all([
    Stage2.loadAnalysisData("temporal_analysis.json"),
    Stage2.loadAnalysisData("../processed/network_graph.json") || Stage2.loadAnalysisData("network_graph.json")
  ]);

  if (!temporalData) {
    document.getElementById("reliability-message").innerHTML = `
      <span style="color: var(--accent-red);">
        Failed to load temporal dataset. Run <code>python3 analysis/analyse_pathways.py</code>.
      </span>`;
    return;
  }

  const meta = temporalData.metadata;
  const timeline = temporalData.timeline || [];
  const peak = temporalData.peak_period;

  // Reliability Assessment Message
  const reliabilityMount = document.getElementById("reliability-message");
  reliabilityMount.innerHTML = `
    <strong>Date Fidelity Score: ${meta.date_reliability_score}</strong> (${meta.total_dated_records} of ${meta.total_records} records have validated ISO calendar dates).
    <span style="display: block; margin-top: 0.25rem; color: #475569;">
      ${meta.is_sufficient_for_temporal_analysis 
        ? "Corpus meets sufficient date density criteria for preliminary temporal analysis. Note: Seed relationships represent observed auditing samples rather than an exhaustive retrospective census."
        : "Date density is currently limited. Temporal conclusions should be treated as provisional until archival committee registers are integrated."}
    </span>
  `;

  // KPIs
  document.getElementById("kpi-dated-total").textContent = meta.total_dated_records;
  document.getElementById("kpi-dated-sub").textContent = `${meta.date_reliability_score} reliability ratio`;
  document.getElementById("kpi-peak-window").textContent = peak ? peak.period : "N/A";
  document.getElementById("kpi-peak-sub").textContent = peak ? `${peak.total_actions} actions logged` : "-";

  const totalVerifiedActions = timeline.reduce((acc, t) => acc + t.verified_actions, 0);
  document.getElementById("kpi-verified-velocity").textContent = totalVerifiedActions;

  document.getElementById("kpi-reliability-score").textContent = meta.date_reliability_score;

  // 1. Render Timeline Visual Bars
  const barsMount = document.getElementById("timeline-bars-mount");
  barsMount.innerHTML = "";

  const maxActions = Math.max(...timeline.map(t => t.total_actions), 1);

  timeline.forEach((item) => {
    const pct = Math.round((item.total_actions / maxActions) * 100);
    const vPct = item.total_actions > 0 ? (item.verified_actions / item.total_actions) * pct : 0;
    const cPct = item.total_actions > 0 ? (item.candidate_actions / item.total_actions) * pct : 0;
    const gPct = item.total_actions > 0 ? (item.gap_audits / item.total_actions) * pct : 0;

    const row = document.createElement("div");
    row.style.cssText = "display: flex; flex-direction: column; gap: 0.35rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle);";
    row.innerHTML = `
      <div style="display: flex; align-items: baseline; justify-content: space-between;">
        <div>
          <span style="font-family: var(--font-mono); font-weight: 700; font-size: 0.85rem; color: #1C1917;">
            ${item.period}
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.5rem;">
            ${item.regulatory_milestone}
          </span>
        </div>
        <div style="font-family: var(--font-mono); font-size: 0.75rem; font-weight: bold;">
          ${item.total_actions} action${item.total_actions > 1 ? "s" : ""}
        </div>
      </div>

      <div style="width: 100%; height: 16px; background-color: #E7E3DC; border-radius: 4px; overflow: hidden; display: flex;">
        <div style="width: ${vPct}%; height: 100%; background-color: var(--accent-green);" title="${item.verified_actions} Verified Actions"></div>
        <div style="width: ${cPct}%; height: 100%; background-color: var(--accent-amber);" title="${item.candidate_actions} Candidate Claims"></div>
        <div style="width: ${gPct}%; height: 100%; background-color: var(--accent-red);" title="${item.gap_audits} Evidence Gaps"></div>
      </div>

      <div style="display: flex; gap: 1rem; font-size: 0.7rem; font-family: var(--font-mono); color: var(--text-dim);">
        <span style="color: var(--accent-green); font-weight: 600;">${item.verified_actions} verified</span>
        <span style="color: var(--accent-amber); font-weight: 600;">${item.candidate_actions} candidate</span>
        <span style="color: var(--accent-red); font-weight: 600;">${item.gap_audits} gap audit${item.gap_audits > 1 ? "s" : ""}</span>
      </div>
    `;
    barsMount.appendChild(row);
  });

  // 2. Render Chronological Ledger Table
  const tableTbody = document.getElementById("timeline-table-tbody");
  tableTbody.innerHTML = "";

  const allEdges = (graphData && graphData.edges) || [];
  const sortedEdges = [...allEdges].sort((a, b) => (b.access_date || "").localeCompare(a.access_date || ""));

  sortedEdges.forEach((edge) => {
    const tr = document.createElement("tr");
    const period = (edge.access_date || "").slice(0, 7) || "Unrecorded";
    const milestone = timeline.find(t => t.period === period)?.regulatory_milestone || "General evidence review";

    tr.innerHTML = `
      <td><code>${edge.access_date || "N/A"}</code></td>
      <td><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim);">${period}</span></td>
      <td><strong>${edge.source}</strong></td>
      <td>${edge.target}</td>
      <td><span style="font-size: 0.75rem; color: var(--accent-terracotta);">${edge.relationship_type.replace(/_/g, " ")}</span></td>
      <td>
        <span class="badge ${edge.evidence_status === "independently_verified" ? "badge-verified" : edge.evidence_status === "documented" ? "badge-documented" : edge.evidence_status === "gap" ? "badge-gap" : "badge-candidate"}">
          ${edge.evidence_status.replace(/_/g, " ")}
        </span>
      </td>
      <td style="color: var(--text-muted); font-size: 0.75rem;">${milestone}</td>
    `;
    tableTbody.appendChild(tr);
  });
});
