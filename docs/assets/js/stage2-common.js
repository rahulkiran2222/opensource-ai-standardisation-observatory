/**
 * stage2-common.js - Shared Stage 2 Navigation, Layout Template & Utilities
 * Open-Source AI Standardisation Observatory
 * Provides dynamic header mounts, mobile drawer navigation, methodology notices,
 * footer rendering, robust data fetching, number formatters, and CSV utilities.
 */

(function () {
  "use strict";

  const STAGE2_PAGES = [
    { id: "network-analysis", label: "Network Analysis", file: "network-analysis.html" },
    { id: "brokerage-pathways", label: "Brokerage & Pathways", file: "brokerage-pathways.html" },
    { id: "temporal-analysis", label: "Temporal Analysis", file: "temporal-analysis.html" },
    { id: "data-quality", label: "Data Quality & Audit", file: "data-quality.html" },
    { id: "research-outputs", label: "Research Outputs", file: "research-outputs.html" },
  ];

  /**
   * Determine relative path to homepage (index.html) based on current URL location
   */
  function getHomeHref() {
    const p = window.location.pathname;
    if (p.includes("/pages/") || p.includes("/docs/pages/")) {
      return "../index.html";
    }
    return "index.html";
  }

  /**
   * Detect current page identifier based on current pathname
   */
  function detectCurrentPage() {
    const p = window.location.pathname.toLowerCase();
    for (const page of STAGE2_PAGES) {
      if (p.includes(page.id) || p.endsWith(page.file)) {
        return page.id;
      }
    }
    const bodyPage = document.body ? document.body.getAttribute("data-page") : null;
    return bodyPage || "network-analysis";
  }

  /**
   * Render Shared Stage 2 Header with responsive navigation and mobile drawer
   */
  function renderHeader(activePage) {
    const headerContainer = document.getElementById("stage2-header-mount");
    if (!headerContainer) return;

    const currentId = activePage || detectCurrentPage();
    const homeHref = getHomeHref();

    const desktopNavLinks = STAGE2_PAGES.map(
      (item) => `
      <a href="${item.file}" class="${currentId === item.id ? "active" : ""}">
        ${item.label}
      </a>`
    ).join("");

    const mobileNavLinks = STAGE2_PAGES.map(
      (item) => `
      <a href="${item.file}" class="${currentId === item.id ? "active" : ""}">
        ${item.label}
      </a>`
    ).join("");

    headerContainer.innerHTML = `
      <header class="stage2-header">
        <div class="stage2-header-inner">
          <a href="${homeHref}" class="stage2-brand" title="Return to Main Observatory">
            <div class="stage2-logo-icon">AI</div>
            <div class="stage2-brand-text">
              <span class="stage2-brand-eyebrow">Observatory Stage 2</span>
              <span class="stage2-brand-title">Research Analysis & Empirical Audits</span>
            </div>
          </a>

          <nav class="stage2-nav" aria-label="Stage 2 Modules">
            ${desktopNavLinks}
          </nav>

          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <a href="${homeHref}" class="stage2-back-btn" title="Return to primary interactive observatory">
              <span>← Return to</span> Observatory
            </a>

            <button class="stage2-mobile-toggle" id="stage2-mobile-menu-btn" aria-label="Toggle navigation menu" aria-expanded="false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="stage2-mobile-drawer" id="stage2-mobile-drawer" role="navigation">
          ${mobileNavLinks}
          <div style="padding-top: 0.5rem; border-top: 1px solid var(--border-subtle); margin-top: 0.25rem;">
            <a href="${homeHref}" style="color: var(--accent-terracotta); font-weight: 600;">
              ← Return to Main Observatory
            </a>
          </div>
        </div>
      </header>
    `;

    // Attach mobile toggle listener
    const toggleBtn = document.getElementById("stage2-mobile-menu-btn");
    const drawer = document.getElementById("stage2-mobile-drawer");
    if (toggleBtn && drawer) {
      toggleBtn.addEventListener("click", () => {
        const isOpen = drawer.classList.toggle("open");
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
  }

  /**
   * Render Methodological Discipline Notice Banner
   */
  function renderMethodologyBanner(containerId) {
    const mount = document.getElementById(containerId || "stage2-notice-mount");
    if (!mount) return;

    mount.innerHTML = `
      <div class="stage2-notice" role="note">
        <span class="stage2-notice-badge">Empirical Discipline</span>
        <div>
          <strong>Stage 2 Methodological Separation:</strong> All graph centralities, topological measures, and pathway traversals are calculated deterministically by the Pure-Python analysis engine from primary research ledgers. Unverified candidate claims and evidentiary gaps remain strictly segregated from accredited records to avoid unsupported institutional attribution.
        </div>
      </div>
    `;
  }

  /**
   * Render Common Stage 2 Footer
   */
  function renderFooter(containerId) {
    const mount = document.getElementById(containerId || "stage2-footer-mount");
    if (!mount) return;

    const homeHref = getHomeHref();

    mount.innerHTML = `
      <footer class="stage2-footer" role="contentinfo">
        <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.35rem;">
          Open-Source AI Standardisation Observatory · Stage 2 Empirical Research Dossier
        </div>
        <div>
          Release v2.0.0 · Pure-Python Graph Engine · Academic Commons Reproducibility Standard
        </div>
        <div style="margin-top: 0.25rem; font-size: 0.7rem; color: var(--text-dim);">
          Harmonised Standardisation Mandate M/593 · NIST AISIC · CEN-CENELEC JTC 21 · ISO/IEC JTC 1/SC 42 Tracking
        </div>
        <div style="margin-top: 0.85rem; display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; font-size: 0.72rem;">
          <a href="${homeHref}" style="color: var(--text-muted); text-decoration: none;">Main Observatory</a>
          <span>·</span>
          <a href="network-analysis.html" style="color: var(--text-muted); text-decoration: none;">Network Analysis</a>
          <span>·</span>
          <a href="brokerage-pathways.html" style="color: var(--text-muted); text-decoration: none;">Brokerage & Pathways</a>
          <span>·</span>
          <a href="temporal-analysis.html" style="color: var(--text-muted); text-decoration: none;">Temporal Analysis</a>
          <span>·</span>
          <a href="data-quality.html" style="color: var(--text-muted); text-decoration: none;">Data Quality</a>
          <span>·</span>
          <a href="research-outputs.html" style="color: var(--text-muted); text-decoration: none;">Research Outputs</a>
        </div>
      </footer>
    `;
  }

  /**
   * Robust multi-path data loading utility with JSON and CSV handling
   */
  async function loadAnalysisData(filename) {
    const cleanFilename = filename.replace(/^(\.\.\/)+/, "").replace(/^(\.\/)+/, "");
    const possiblePaths = [
      `../data/outputs/${filename}`,
      `./data/outputs/${filename}`,
      `../../data/outputs/${filename}`,
      `/data/outputs/${filename}`,
      `./outputs/${filename}`,
      `../data/processed/${filename}`,
      `../data/raw/${filename}`,
      `../data/${cleanFilename}`,
      `./data/${cleanFilename}`,
      `/${cleanFilename}`,
      `../${cleanFilename}`,
      `./${cleanFilename}`
    ];

    for (const p of possiblePaths) {
      try {
        const res = await fetch(p);
        if (res.ok) {
          if (filename.endsWith(".json")) {
            return await res.json();
          } else {
            return await res.text();
          }
        }
      } catch (e) {
        // Continue to next path candidate
      }
    }
    console.warn(`[Stage2] Could not load ${filename} from resolved paths.`);
    return null;
  }

  /**
   * Universal Toast Notification Display
   */
  function showToast(message) {
    let toast = document.getElementById("stage2-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "stage2-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("visible");

    setTimeout(() => {
      toast.classList.remove("visible");
    }, 2400);
  }

  /**
   * Copy Text to Clipboard with feedback toast
   */
  function copyToClipboard(text, successMessage) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMessage || "Copied to clipboard!");
      }).catch(() => {
        fallbackCopyText(text, successMessage);
      });
    } else {
      fallbackCopyText(text, successMessage);
    }
  }

  function fallbackCopyText(text, successMessage) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(successMessage || "Copied to clipboard!");
    } catch (err) {
      showToast("Unable to copy to clipboard");
    }
    document.body.removeChild(textArea);
  }

  /**
   * HTML escape helper
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Format numbers with localized commas and optional decimals
   */
  function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined || isNaN(Number(num))) return "-";
    const n = Number(num);
    return n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  /**
   * Simple RFC 4180 compliant CSV parser for client-side table rendering
   */
  function parseCSV(text) {
    if (!text) return { headers: [], rows: [] };
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };

    function parseLine(line) {
      const result = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === "," && !inQuotes) {
          result.push(cur.trim());
          cur = "";
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    }

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(parseLine).filter((r) => r.length === headers.length || (r.length === 1 && r[0] === ""));
    return { headers, rows };
  }

  /**
   * Trigger client-side file download from text / JSON blob
   */
  function downloadBlob(content, filename, mimeType = "text/plain") {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // Expose Stage2 global namespace
  window.Stage2 = {
    PAGES: STAGE2_PAGES,
    renderHeader,
    renderMethodologyBanner,
    renderFooter,
    loadAnalysisData,
    showToast,
    copyToClipboard,
    escapeHtml,
    formatNumber,
    parseCSV,
    downloadBlob,
    detectCurrentPage,
  };
})();
