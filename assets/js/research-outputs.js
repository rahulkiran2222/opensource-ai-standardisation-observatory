/**
 * research-outputs.js - Stage 2 Research Outputs & Reproducibility Controller
 * Manages downloadable datasets, interactive artifact previews, citation copying, and reproducibility commands.
 */

let currentPreviewContent = "";

document.addEventListener("DOMContentLoaded", async () => {
  // Render common UI
  Stage2.renderHeader("research-outputs");
  Stage2.renderMethodologyBanner("stage2-notice-mount");
  Stage2.renderFooter("stage2-footer-mount");

  // Load metrics to enrich KPI indicators
  try {
    const [metricsData, auditData] = await Promise.all([
      Stage2.loadAnalysisData("network_metrics.json"),
      Stage2.loadAnalysisData("data_quality_audit.json")
    ]);

    if (metricsData && metricsData.graph_level) {
      const gl = metricsData.graph_level;
      const entitiesEl = document.getElementById("kpi-entities-count");
      if (entitiesEl) {
        entitiesEl.textContent = gl.total_nodes;
      }
    }

    if (auditData) {
      const compEl = document.getElementById("kpi-schema-compliance");
      if (compEl && auditData.total_records_evaluated > 0) {
        const pct = Math.round((auditData.valid_records_count / auditData.total_records_evaluated) * 100);
        compEl.textContent = `${pct}%`;
      }
    }
  } catch (err) {
    console.warn("Could not asynchronously populate output KPIs:", err);
  }
});

/**
 * Interactively preview an artifact right on the page
 */
window.previewArtifact = async function (filename, format, customPath) {
  const previewSection = document.getElementById("preview-section");
  const previewTitle = document.getElementById("preview-title");
  const previewDesc = document.getElementById("preview-desc");
  const previewBadge = document.getElementById("preview-badge");
  const tableContainer = document.getElementById("preview-table-container");
  const thead = document.getElementById("preview-thead");
  const tbody = document.getElementById("preview-tbody");
  const rawContainer = document.getElementById("preview-raw");

  if (!previewSection) return;

  previewSection.style.display = "block";
  previewTitle.textContent = `Preview: ${filename}`;
  previewBadge.textContent = format.toUpperCase();
  previewDesc.textContent = `Loading contents for ${filename}...`;

  // Scroll to preview smoothly
  previewSection.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    let content = null;
    const pathPrefix = customPath || "../data/outputs/";
    const fetchPath = `${pathPrefix}${filename}`;

    try {
      const res = await fetch(fetchPath);
      if (res.ok) {
        content = await res.text();
      }
    } catch (e) {
      // Fallback through Stage2 loader
      content = await Stage2.loadAnalysisData(filename);
      if (typeof content === "object") {
        content = JSON.stringify(content, null, 2);
      }
    }

    if (!content) {
      previewDesc.innerHTML = `<span style="color: var(--accent-red);">Unable to load ${filename}. Check that the pipeline has been executed.</span>`;
      return;
    }

    currentPreviewContent = content;

    if (format === "csv") {
      tableContainer.style.display = "block";
      rawContainer.style.display = "none";

      const lines = content.trim().split("\n");
      if (lines.length > 0) {
        // Parse CSV with quotes handling
        const parseLine = (line) => {
          const values = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"' || char === "'") {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          return values;
        };

        const headers = parseLine(lines[0]);
        thead.innerHTML = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;

        // Render first 15 rows
        const maxRows = Math.min(lines.length, 16);
        tbody.innerHTML = "";
        for (let i = 1; i < maxRows; i++) {
          if (!lines[i].trim()) continue;
          const cols = parseLine(lines[i]);
          const tr = document.createElement("tr");
          tr.innerHTML = cols.map((c) => `<td>${escapeHtml(c.replace(/^["']|["']$/g, ""))}</td>`).join("");
          tbody.appendChild(tr);
        }

        previewDesc.textContent = `Displaying sample rows from ${filename} (Showing up to 15 records of ${lines.length - 1} total).`;
      }
    } else {
      // JSON format
      try {
        const parsed = JSON.parse(content);
        currentPreviewContent = JSON.stringify(parsed, null, 2);
        tableContainer.style.display = "none";
        rawContainer.style.display = "block";
        rawContainer.textContent = currentPreviewContent;
        previewDesc.textContent = `Displaying formatted JSON structure for ${filename}.`;
      } catch (e) {
        tableContainer.style.display = "none";
        rawContainer.style.display = "block";
        rawContainer.textContent = content;
        previewDesc.textContent = `Displaying raw text content for ${filename}.`;
      }
    }
  } catch (err) {
    console.error("Error previewing artifact:", err);
    previewDesc.innerHTML = `<span style="color: var(--accent-red);">Error displaying preview: ${err.message}</span>`;
  }
};

window.closePreview = function () {
  const previewSection = document.getElementById("preview-section");
  if (previewSection) {
    previewSection.style.display = "none";
  }
};

window.copyPreviewData = function () {
  if (!currentPreviewContent) return;
  navigator.clipboard.writeText(currentPreviewContent).then(() => {
    const btn = document.getElementById("preview-copy-btn");
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = "✓ Copied Content!";
      btn.style.color = "var(--accent-green)";
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.color = "";
      }, 2000);
    }
  });
};

window.copyTerminalCommands = function () {
  const commands = `python3 analysis/validate_data.py
python3 analysis/build_network.py
python3 analysis/calculate_metrics.py
python3 analysis/analyse_pathways.py
python3 tests/test_validation.py
python3 tests/test_network.py`;

  navigator.clipboard.writeText(commands).then(() => {
    showToast("Terminal commands copied to clipboard!");
  });
};

window.copyBibtexCitation = function () {
  const el = document.getElementById("bibtex-citation");
  if (el) {
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      showToast("BibTeX citation copied to clipboard!");
    });
  }
};

window.copyApaCitation = function () {
  const el = document.getElementById("apa-citation");
  if (el) {
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      showToast("APA 7th citation copied to clipboard!");
    });
  }
};

function showToast(message) {
  let toast = document.getElementById("stage2-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "stage2-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "1.5rem";
    toast.style.right = "1.5rem";
    toast.style.background = "#1C1917";
    toast.style.color = "#FAF8F5";
    toast.style.padding = "0.6rem 1rem";
    toast.style.borderRadius = "6px";
    toast.style.fontSize = "0.8rem";
    toast.style.fontFamily = "var(--font-sans)";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    toast.style.zIndex = "9999";
    toast.style.transition = "opacity 0.2s ease";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.style.display = "none";
    }, 200);
  }, 2200);
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
