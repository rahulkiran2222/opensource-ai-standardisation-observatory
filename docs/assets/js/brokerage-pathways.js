/**
 * brokerage-pathways.js - Stage 2 Brokerage Actors & Pathways Controller
 * Consumes data/outputs/brokerage_pathways.json
 */

let allPathways = [];
let allProfiles = [];

document.addEventListener("DOMContentLoaded", async () => {
  Stage2.renderHeader("brokerage-pathways");
  Stage2.renderMethodologyBanner("stage2-notice-mount");
  Stage2.renderFooter("stage2-footer-mount");

  const data = await Stage2.loadAnalysisData("brokerage_pathways.json");
  if (!data) {
    document.getElementById("brokerage-tbody").innerHTML = `
      <tr><td colspan="7" style="text-align: center; color: var(--accent-red);">
        Failed to load brokerage data. Run <code>python3 analysis/analyse_pathways.py</code>.
      </td></tr>`;
    return;
  }

  allProfiles = data.brokerage_profiles || [];
  allPathways = data.documented_pathways || [];
  const cutVertices = data.cut_vertices || [];

  // Populate KPIs
  const directVerifiedCount = allPathways.filter(p => p.hop_count === 1 && p.evidence_assurance.includes("Fully")).length;
  const maxHops = allPathways.length > 0 ? Math.max(...allPathways.map(p => p.hop_count)) : 0;

  document.getElementById("kpi-cut-vertices").textContent = cutVertices.length;
  document.getElementById("kpi-pathways").textContent = allPathways.length;
  document.getElementById("kpi-direct-verified").textContent = directVerifiedCount;
  document.getElementById("kpi-max-hops").textContent = `${maxHops} Hops`;

  // 1. Populate Brokerage Profiles Table
  const tbody = document.getElementById("brokerage-tbody");
  tbody.innerHTML = "";

  allProfiles.forEach((prof) => {
    const isCut = prof.is_cut_vertex;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${prof.name}</strong></td>
      <td><span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-dim); text-transform: capitalize;">${prof.entity_type.replace(/_/g, " ")}</span></td>
      <td><strong>${prof.degree}</strong></td>
      <td>
        <span class="badge ${isCut ? "badge-verified" : "badge-documented"}">
          ${prof.brokerage_role}
        </span>
      </td>
      <td style="font-family: var(--font-mono); font-weight: bold; color: ${prof.bridge_score > 2 ? "var(--accent-terracotta)" : "inherit"};">
        ${prof.bridge_score.toFixed(2)}
      </td>
      <td>
        ${
          isCut
            ? `<span class="badge badge-gap">Critical Cut Vertex</span>`
            : `<span style="color: var(--text-dim); font-size: 0.75rem;">Non-Essential</span>`
        }
      </td>
      <td>
        <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
          ${prof.connected_sectors.map(s => `<span class="badge badge-candidate" style="font-size: 0.65rem;">${s.replace(/_/g, " ")}</span>`).join("")}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // 2. Populate Select Dropdowns
  const selectProj = document.getElementById("select-project");
  const selectSdo = document.getElementById("select-sdo");

  const uniqueProjects = Array.from(new Set(allPathways.map(p => p.project))).sort();
  const uniqueSdos = Array.from(new Set(allPathways.map(p => p.standards_body))).sort();

  uniqueProjects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    selectProj.appendChild(opt);
  });

  uniqueSdos.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    selectSdo.appendChild(opt);
  });

  selectProj.addEventListener("change", renderPathways);
  selectSdo.addEventListener("change", renderPathways);

  renderPathways();
});

function renderPathways() {
  const container = document.getElementById("pathways-container");
  const selectedProj = document.getElementById("select-project").value;
  const selectedSdo = document.getElementById("select-sdo").value;

  const filtered = allPathways.filter(p => {
    if (selectedProj !== "all" && p.project !== selectedProj) return false;
    if (selectedSdo !== "all" && p.standards_body !== selectedSdo) return false;
    return true;
  });

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 2rem; background: #FAF8F5; border-radius: 6px; border: 1px dashed var(--border-subtle);">
        No documented multi-hop standardisation pathways found between the selected entities.
      </div>`;
    return;
  }

  filtered.forEach((pathway) => {
    const isVerified = pathway.evidence_assurance.includes("Fully");
    const hasGap = pathway.evidence_assurance.includes("Gap");

    const card = document.createElement("div");
    card.style.cssText = `
      background-color: #FFFFFF;
      border: 1px solid ${hasGap ? "#FECACA" : isVerified ? "#BBF7D0" : "var(--border-subtle)"};
      border-radius: 8px;
      padding: 1.25rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.02);
    `;

    // Path Chain Header
    const nodesChainHtml = pathway.path_nodes
      .map((node, i) => `
        <span style="font-weight: 700; color: #1C1917; font-family: var(--font-serif); font-size: 0.95rem;">
          ${node}
        </span>
        ${i < pathway.path_nodes.length - 1 ? `<span style="color: var(--accent-terracotta); font-weight: bold;"> ➔ </span>` : ""}
      `)
      .join("");

    card.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #F2EDE4; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
        <div>
          <div style="font-size: 0.7rem; font-family: var(--font-mono); text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.25rem;">
            Pathway Topology (${pathway.hop_count} Hop${pathway.hop_count > 1 ? "s" : ""})
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            ${nodesChainHtml}
          </div>
        </div>

        <div>
          <span class="badge ${isVerified ? "badge-verified" : hasGap ? "badge-gap" : "badge-candidate"}">
            ${pathway.evidence_assurance}
          </span>
        </div>
      </div>

      <!-- Step-by-Step Evidential Substantiation -->
      <div style="display: flex; flex-direction: column; gap: 0.65rem;">
        ${pathway.steps.map((step, idx) => `
          <div style="background-color: #FAF8F5; border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem; font-size: 0.78rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
              <div>
                <strong>Step ${idx + 1}:</strong> ${step.from} ↔ ${step.to}
                <span style="color: var(--text-dim); font-size: 0.72rem; margin-left: 0.35rem;">(${step.relationship_type.replace(/_/g, " ")})</span>
              </div>
              <span class="badge ${step.evidence_status === "independently_verified" ? "badge-verified" : step.evidence_status === "documented" ? "badge-documented" : step.evidence_status === "gap" ? "badge-gap" : "badge-candidate"}">
                ${step.evidence_status.replace(/_/g, " ")}
              </span>
            </div>

            ${step.source_passage ? `
              <div style="font-style: italic; color: #44403C; margin-bottom: 0.35rem; line-height: 1.4; border-left: 2px solid var(--border-strong); padding-left: 0.5rem;">
                "${step.source_passage}"
              </div>` : `
              <div style="color: var(--accent-red); font-size: 0.72rem; margin-bottom: 0.35rem;">
                No verbatim excerpt provided in audit record ${step.relationship_id}.
              </div>`
            }

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--text-dim);">
              <span>Evidence ID: <code>${step.relationship_id}</code></span>
              <a href="${step.source_url}" target="_blank" rel="noreferrer" style="color: var(--accent-terracotta); text-decoration: none; font-weight: 500;">
                Primary Source ↗
              </a>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    container.appendChild(card);
  });
}
