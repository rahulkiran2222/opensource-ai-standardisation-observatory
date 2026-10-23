/**
 * data-quality.js - Stage 2 Data Quality & Audit Controller
 * Consumes data/outputs/data_quality_audit.json
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Render common UI
  Stage2.renderHeader("data-quality");
  Stage2.renderMethodologyBanner("stage2-notice-mount");
  Stage2.renderFooter("stage2-footer-mount");

  const auditData = await Stage2.loadAnalysisData("data_quality_audit.json");
  if (!auditData) {
    document.getElementById("field-completeness-tbody").innerHTML = `
      <tr><td colspan="6" style="text-align: center; color: var(--accent-red);">
        Failed to load audit dataset. Run <code>python3 analysis/validate_data.py</code> to generate outputs.
      </td></tr>`;
    return;
  }

  // Populate KPIs
  const total = auditData.total_records_evaluated;
  const valid = auditData.valid_records_count;
  const missingPassages = auditData.missing_passage_count;
  const gaps = auditData.gap_records_count;
  const candidates = auditData.unverified_candidate_count;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-compliance").textContent = total > 0 ? `${Math.round((valid / total) * 100)}%` : "0%";
  document.getElementById("kpi-passages").textContent = total > 0 ? `${Math.round(((total - missingPassages) / total) * 100)}%` : "0%";
  document.getElementById("kpi-gaps").textContent = gaps;
  document.getElementById("kpi-candidates").textContent = candidates;

  // 1. Populate Field Completeness Table
  const requiredSet = new Set(["project", "institution_or_process", "relationship_type", "evidence_status", "source_url"]);
  const fieldTbody = document.getElementById("field-completeness-tbody");
  fieldTbody.innerHTML = "";

  Object.entries(auditData.field_completeness).forEach(([fieldName, stats]) => {
    const isRequired = requiredSet.has(fieldName);
    const missing = stats.total_records - stats.present_count;
    const pct = stats.completeness_pct;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong><code>${fieldName}</code></strong></td>
      <td>
        <span class="badge ${isRequired ? "badge-verified" : "badge-documented"}">
          ${isRequired ? "Mandatory Tier 1" : "Audit Tier 2"}
        </span>
      </td>
      <td>${stats.present_count} / ${stats.total_records}</td>
      <td style="color: ${missing > 0 ? (isRequired ? "var(--accent-red)" : "var(--accent-amber)") : "inherit"}; font-weight: ${missing > 0 ? "bold" : "normal"};">
        ${missing}
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="flex: 1; height: 6px; background-color: #E7E3DC; border-radius: 3px; overflow: hidden; max-width: 100px;">
            <div style="width: ${pct}%; height: 100%; background-color: ${pct === 100 ? "var(--accent-green)" : pct > 75 ? "var(--accent-navy)" : "var(--accent-amber)"};"></div>
          </div>
          <span>${pct}%</span>
        </div>
      </td>
      <td>
        ${
          isRequired && missing > 0
            ? `<span class="badge badge-gap">Schema Non-Compliant</span>`
            : pct === 100
            ? `<span class="badge badge-verified">100% Complete</span>`
            : `<span class="badge badge-candidate">Deficient</span>`
        }
      </td>
    `;
    fieldTbody.appendChild(tr);
  });

  // 2. Populate Issues Log
  const issuesTbody = document.getElementById("issues-tbody");
  const issues = auditData.issues || [];
  document.getElementById("issues-counter").textContent = `${issues.length} Audit Findings`;
  issuesTbody.innerHTML = "";

  if (issues.length === 0) {
    issuesTbody.innerHTML = `
      <tr><td colspan="5" style="text-align: center; color: var(--accent-green); padding: 1.5rem;">
        No blocking anomalies found. All records meet baseline 5-field schema criteria.
      </td></tr>`;
  } else {
    issues.forEach((issue) => {
      const tr = document.createElement("tr");
      const isError = issue.severity === "error";
      tr.innerHTML = `
        <td><strong><code>${issue.record_id}</code></strong></td>
        <td><strong>${issue.project}</strong></td>
        <td>${issue.institution}</td>
        <td>
          <span class="badge ${isError ? "badge-gap" : "badge-candidate"}">
            ${isError ? "Error / Reject" : "Audit Advisory"}
          </span>
        </td>
        <td>
          <ul style="padding-left: 1rem; margin: 0; line-height: 1.4;">
            ${issue.messages.map((m) => `<li>${m}</li>`).join("")}
          </ul>
        </td>
      `;
      issuesTbody.appendChild(tr);
    });
  }

  // 3. Populate Entity Audit Table
  const entityTbody = document.getElementById("entity-audit-tbody");
  entityTbody.innerHTML = "";

  Object.entries(auditData.entity_audit).forEach(([entityName, data]) => {
    const totalTies = data.total_records;
    const verified = data.verified_records;
    const candidate = data.candidate_records;
    const gaps = data.gap_records;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${entityName}</strong></td>
      <td><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim); text-transform: capitalize;">${data.entity_type.replace(/_/g, " ")}</span></td>
      <td><strong>${totalTies}</strong></td>
      <td style="color: var(--accent-green); font-weight: 600;">${verified}</td>
      <td style="color: var(--accent-amber); font-weight: 600;">${candidate}</td>
      <td style="color: var(--accent-red); font-weight: 600;">${gaps}</td>
      <td>
        <div style="display: flex; gap: 0.25rem;">
          ${verified > 0 ? `<span class="badge badge-verified">${verified} Ver</span>` : ""}
          ${candidate > 0 ? `<span class="badge badge-candidate">${candidate} Cand</span>` : ""}
          ${gaps > 0 ? `<span class="badge badge-gap">${gaps} Gap</span>` : ""}
          ${totalTies === 0 ? `<span class="badge badge-candidate">No Links</span>` : ""}
        </div>
      </td>
    `;
    entityTbody.appendChild(tr);
  });
});
