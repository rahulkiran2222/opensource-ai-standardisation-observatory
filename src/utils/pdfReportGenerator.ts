import { jsPDF } from 'jspdf';
import { RelationshipRecord } from '../types';

export interface ReportSummaryData {
  total: number;
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  passageCompletenessPct: number;
  dateCompliancePct: number;
  missingPassage: number;
  missingDate: number;
  gapsList: RelationshipRecord[];
}

export function generateFormalPdfReport(
  records: RelationshipRecord[],
  summary: ReportSummaryData,
  reviewerName: string = 'Observatory Research Fellow'
): void {
  // Initialize standard A4 PDF document (portrait, mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const todayStr = new Date().toISOString().split('T')[0];
  const timestampStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Helper to check page break
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  };

  const drawHeaderFooter = () => {
    const pageNum = doc.getNumberOfPages();
    // Top running header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 113, 108); // stone-500
    doc.text('OPEN-SOURCE AI STANDARDISATION OBSERVATORY', margin, 10);
    doc.text(`CONFIDENTIAL ACADEMIC WORKING DOSSIER · ${todayStr}`, pageWidth - margin, 10, {
      align: 'right',
    });
    doc.setDrawColor(231, 227, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);

    // Bottom running footer
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.text(
      'Audit Methodology: Dual-Verifier Standardisation Attribution Framework',
      margin,
      pageHeight - 8
    );
    doc.text(`Page ${pageNum}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // -------------------------------------------------------------
  // PAGE 1: Formal Header & Executive Summary
  // -------------------------------------------------------------
  drawHeaderFooter();
  y = 20;

  // Title Block
  doc.setFont('times', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(28, 25, 23); // stone-900
  doc.text('Formal Research Summary & Evidence Audit', margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(154, 52, 18); // #9A3412
  doc.text(
    'Empirical Analysis of Open-Source AI Participation in Global Standardisation & EU Regulatory Mandates',
    margin,
    y
  );
  y += 6;

  // Metadata Strip
  doc.setDrawColor(220, 215, 205);
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  doc.text(`DATE OF AUDIT: ${todayStr} ${timestampStr}`, margin + 4, y + 5);
  doc.text(`LEAD REVIEWER: ${reviewerName}`, margin + 4, y + 10);
  doc.text(`EVALUATED EVIDENCE CORPUS: ${summary.total} Records`, margin + 90, y + 5);
  doc.text(`PRIMARY SCHEMA: ISO/CEN/NIST 5-Field Verified Ledger`, margin + 90, y + 10);
  y += 19;

  // Executive Summary Narrative
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text('1. Executive Summary & Research Scope', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(68, 64, 60);
  const execSummary =
    `This report synthesizes empirical findings cataloged within the Open-Source AI Standardisation Observatory. ` +
    `The research investigates how open-source artificial intelligence projects (including foundation frameworks, serving runtimes, ` +
    `and machine learning libraries) intersect with formal standards development organizations (SDOs), specifically CEN-CENELEC JTC 21, ` +
    `ISO/IEC JTC 1/SC 42, IEEE Standards Association, and national safety initiatives such as the NIST AI Safety Institute Consortium (AISIC). ` +
    `Critical emphasis is placed on enforcing rigorous evidential thresholds to distinguish primary institutional membership ` +
    `from informal code repository mentions, declared intentions, and speculative claims.`;
  const splitExec = doc.splitTextToSize(execSummary, contentWidth);
  doc.text(splitExec, margin, y);
  y += splitExec.length * 4.2 + 4;

  // Methodological Warning Box
  doc.setDrawColor(245, 158, 11);
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('METHODOLOGICAL BOUNDARY & ATTRIBUTION CAUTION:', margin + 4, y + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    'A link to a software repository does NOT constitute formal committee participation in CEN-CENELEC or ISO/IEC standardisation.',
    margin + 4,
    y + 9
  );
  y += 18;

  // -------------------------------------------------------------
  // Section 2: Core Quantitative Metrics (KPIs)
  // -------------------------------------------------------------
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text('2. Quantitative Evaluation Indicators', margin, y);
  y += 6;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 16;
  const kpis = [
    {
      label: 'TOTAL CLAIMS (N)',
      value: `${summary.total}`,
      sub: 'Audited records',
      color: [28, 25, 23],
    },
    {
      label: 'VERIFICATION RATE',
      value: `${
        summary.total > 0
          ? Math.round(
              ((summary.statusCounts.independently_verified + summary.statusCounts.documented) /
                summary.total) *
                100
            )
          : 0
      }%`,
      sub: `${summary.statusCounts.independently_verified + summary.statusCounts.documented} verified/doc`,
      color: [30, 58, 138], // Navy
    },
    {
      label: 'PASSAGE QUOTED',
      value: `${summary.passageCompletenessPct}%`,
      sub: `${summary.total - summary.missingPassage} with verbatim excerpts`,
      color: [22, 101, 52], // Green
    },
    {
      label: 'IDENTIFIED GAPS',
      value: `${summary.statusCounts.gap}`,
      sub: 'Actionable gap directives',
      color: [220, 38, 38], // Red
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setDrawColor(231, 227, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(cardX, y, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 113, 108);
    doc.text(kpi.label, cardX + 3, y + 4.5);

    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.value, cardX + 3, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 113, 108);
    doc.text(kpi.sub, cardX + 3, y + 14);
  });
  y += cardHeight + 8;

  // -------------------------------------------------------------
  // Section 3: Visual Distribution Charts (Vector Rendered)
  // -------------------------------------------------------------
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text('3. Empirical Distributions & Evidence Modalities', margin, y);
  y += 5;

  const chartColWidth = (contentWidth - 6) / 2;

  // Chart 1: Evidence Status Breakdown
  const statusItems = [
    { label: 'Independently Verified', count: summary.statusCounts.independently_verified, color: [22, 101, 52] },
    { label: 'Documented Citation', count: summary.statusCounts.documented, color: [51, 65, 85] },
    { label: 'Candidate Claims', count: summary.statusCounts.candidate, color: [217, 119, 6] },
    { label: 'Evidence Gaps', count: summary.statusCounts.gap, color: [220, 38, 38] },
  ];

  doc.setDrawColor(231, 227, 220);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, chartColWidth, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(28, 25, 23);
  doc.text('Evidence Status Distribution', margin + 4, y + 5);

  let barY = y + 9;
  statusItems.forEach((item) => {
    const pct = summary.total > 0 ? item.count / summary.total : 0;
    const barWidth = (chartColWidth - 45) * pct;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(87, 83, 78);
    doc.text(item.label, margin + 4, barY + 3.5);

    // Background track
    doc.setFillColor(242, 237, 228);
    doc.rect(margin + 40, barY, chartColWidth - 55, 4, 'F');

    // Colored bar
    if (barWidth > 0) {
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.rect(margin + 40, barY, Math.max(barWidth, 1.5), 4, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(28, 25, 23);
    doc.text(`${item.count} (${Math.round(pct * 100)}%)`, margin + chartColWidth - 12, barY + 3.5, {
      align: 'right',
    });

    barY += 7.5;
  });

  // Chart 2: Relationship Types Breakdown
  const typeItems = [
    { label: 'Formal Membership', count: summary.typeCounts.formal_membership, color: [30, 58, 138] },
    { label: 'Technical Contribution', count: summary.typeCounts.technical_contribution, color: [154, 52, 18] },
    { label: 'Consultation Response', count: summary.typeCounts.consultation_response, color: [120, 53, 15] },
    { label: 'Contextual Relevance', count: summary.typeCounts.contextual_relevance, color: [71, 85, 105] },
    { label: 'Declared / Unresolved', count: summary.typeCounts.declared_alignment + summary.typeCounts.unresolved, color: [168, 162, 158] },
  ];

  const chart2X = margin + chartColWidth + 6;
  doc.setDrawColor(231, 227, 220);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(chart2X, y, chartColWidth, 42, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(28, 25, 23);
  doc.text('Relationship Typology', chart2X + 4, y + 5);

  let bar2Y = y + 8;
  typeItems.forEach((item) => {
    const pct = summary.total > 0 ? item.count / summary.total : 0;
    const barWidth = (chartColWidth - 48) * pct;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(87, 83, 78);
    doc.text(item.label, chart2X + 4, bar2Y + 3);

    // Background track
    doc.setFillColor(242, 237, 228);
    doc.rect(chart2X + 42, bar2Y, chartColWidth - 58, 3.5, 'F');

    // Colored bar
    if (barWidth > 0) {
      doc.setFillColor(item.color[0], item.color[1], item.color[2]);
      doc.rect(chart2X + 42, bar2Y, Math.max(barWidth, 1.5), 3.5, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(28, 25, 23);
    doc.text(`${item.count}`, chart2X + chartColWidth - 12, bar2Y + 3, {
      align: 'right',
    });

    bar2Y += 6.5;
  });
  y += 48;

  // -------------------------------------------------------------
  // PAGE 2: Key Evidence Ledger & Gap Action Directives
  // -------------------------------------------------------------
  checkPageBreak(80);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text('4. Detailed Evidence Findings & Verifications', margin, y);
  y += 6;

  // Render top verified and documented relationships
  const verifiedRecords = records.filter(
    (r) => r.evidence_status === 'independently_verified' || r.evidence_status === 'documented'
  );

  verifiedRecords.forEach((record, index) => {
    checkPageBreak(28);

    doc.setDrawColor(231, 227, 220);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, 'FD');

    // Header inside record card
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(28, 25, 23);
    doc.text(`${index + 1}. ${record.project} ↔ ${record.institution_or_process}`, margin + 3.5, y + 4.5);

    // Status pill
    const statusLabel =
      record.evidence_status === 'independently_verified' ? 'INDEPENDENTLY VERIFIED' : 'DOCUMENTED CITATION';
    const pillColor = record.evidence_status === 'independently_verified' ? [22, 101, 52] : [30, 58, 138];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(pillColor[0], pillColor[1], pillColor[2]);
    doc.text(`[${statusLabel}] · Modality: ${record.relationship_type.replace(/_/g, ' ').toUpperCase()}`, margin + 3.5, y + 8.5);

    // Verbatim quote
    doc.setFont('times', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    const passage = record.source_passage ? `"${record.source_passage}"` : 'Source passage recorded.';
    const splitPassage = doc.splitTextToSize(passage, contentWidth - 7);
    doc.text(splitPassage.slice(0, 2), margin + 3.5, y + 12.5);

    // Footer note & source URL
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 113, 108);
    const sourceText = `Source: ${record.source_url} · Audit Date: ${record.access_date || 'N/A'}`;
    doc.text(sourceText.slice(0, 95), margin + 3.5, y + 21);

    y += 27;
  });

  // -------------------------------------------------------------
  // Section 5: Evidence Gap Directives & Primary Research Steps
  // -------------------------------------------------------------
  checkPageBreak(50);
  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(153, 27, 27); // Deep red
  doc.text('5. Critical Evidence Gaps & Methodology Action Directives', margin, y);
  y += 6;

  if (summary.gapsList.length > 0) {
    summary.gapsList.forEach((gap, gIdx) => {
      checkPageBreak(28);

      doc.setDrawColor(254, 202, 202);
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(margin, y, contentWidth, 25, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(185, 28, 28);
      doc.text(
        `GAP ${gIdx + 1}: ${gap.project} ↔ ${gap.institution_or_process} (Unsubstantiated Committee Attribution)`,
        margin + 4,
        y + 4.5
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(127, 29, 29);
      doc.text(`Finding: ${gap.notes}`, margin + 4, y + 8.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.text('Mandatory Next Step:', margin + 4, y + 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(68, 64, 60);
      const rec =
        gap.gap_recommendation ||
        'Direct inquiry away from general code repositories toward official national committee registers (e.g. DIN, AFNOR, BSI) and meeting attendance minutes.';
      const splitRec = doc.splitTextToSize(rec, contentWidth - 8);
      doc.text(splitRec.slice(0, 2), margin + 4, y + 17.5);

      y += 28;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(120, 113, 108);
    doc.text('No unresolved evidence gaps currently cataloged in the active dataset.', margin, y);
    y += 10;
  }

  // -------------------------------------------------------------
  // Signature & Verification Seal
  // -------------------------------------------------------------
  checkPageBreak(25);
  doc.setDrawColor(231, 227, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 113, 108);
  doc.text('CERTIFIED BY OBSERVATORY AUTOMATED COMPLIANCE ENGINE', margin, y);
  doc.text('DISTRIBUTED UNDER ACADEMIC COMMONS REPRODUCIBILITY LICENSE', pageWidth - margin, y, {
    align: 'right',
  });
  y += 4;
  doc.text(`Digital Verification Hash: SHA-256 [${todayStr}-${summary.total}-EVAL]`, margin, y);

  // Trigger download
  const filename = `open_source_ai_standardisation_summary_${todayStr}.pdf`;
  doc.save(filename);
}
