import { RelationshipRecord, ValidationCheckResult, ValidationIssue } from '../types';

export const REQUIRED_FIELDS: (keyof RelationshipRecord)[] = [
  'project',
  'institution_or_process',
  'relationship_type',
  'evidence_status',
  'source_url',
];

export const VALID_RELATIONSHIP_TYPES = [
  'formal_membership',
  'technical_contribution',
  'consultation_response',
  'documented_citation',
  'declared_alignment',
  'contextual_relevance',
  'unresolved',
] as const;

export const VALID_EVIDENCE_STATUSES = [
  'candidate',
  'documented',
  'independently_verified',
  'gap',
] as const;

export function validateRecord(record: Partial<RelationshipRecord>): ValidationCheckResult {
  const missing_fields: string[] = [];
  const warnings: string[] = [];
  const issues: ValidationIssue[] = [];

  // 1. Required fields check
  for (const field of REQUIRED_FIELDS) {
    const val = record[field];
    if (val === undefined || val === null || String(val).trim() === '') {
      missing_fields.push(field);
      issues.push({
        field,
        message: `Field '${field}' is mandatory according to the Observatory schema.`,
        severity: 'error',
      });
    }
  }

  // 2. URL sanity check
  if (record.source_url && String(record.source_url).trim() !== '') {
    const urlStr = String(record.source_url).trim();
    if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
      issues.push({
        field: 'source_url',
        message: "URL must begin with 'https://' or 'http://' for auditable referencing.",
        severity: 'warning',
      });
      warnings.push("Source URL missing standard web protocol ('https://').");
    }
  }

  // 3. Rigorous evidence status requirements
  if (record.evidence_status === 'independently_verified') {
    if (!record.source_passage || record.source_passage.trim().length < 15) {
      issues.push({
        field: 'source_passage',
        message: "Records marked as 'independently_verified' require an verbatim supporting passage (min 15 chars).",
        severity: 'error',
      });
      warnings.push("Missing or insufficient verbatim source passage for independently verified record.");
    }
    if (!record.access_date || record.access_date.trim() === '') {
      issues.push({
        field: 'access_date',
        message: "Verification timestamp ('access_date') is required for independently audited claims.",
        severity: 'error',
      });
      warnings.push("Missing access date for independently verified claim.");
    }
  }

  // 4. Evidence gap validation
  if (record.evidence_status === 'gap') {
    if (!record.notes || record.notes.trim() === '') {
      issues.push({
        field: 'notes',
        message: "Records flagged as 'gap' should include reviewer notes explaining why current evidence is insufficient.",
        severity: 'warning',
      });
      warnings.push("Empty reviewer notes on flagged evidence gap.");
    }
  }

  const valid = missing_fields.length === 0 && !issues.some((i) => i.severity === 'error');

  return {
    valid,
    missing_fields,
    warnings,
    issues,
  };
}

export function findCandidates(
  records: RelationshipRecord[],
  query: string
): { record: RelationshipRecord; matchedTerms: string[] }[] {
  if (!query.trim()) return [];
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (terms.length === 0) return [];

  const results: { record: RelationshipRecord; matchedTerms: string[] }[] = [];

  for (const record of records) {
    const searchable = [
      record.project,
      record.institution_or_process,
      record.notes,
      record.source_passage,
      record.relationship_type,
      record.evidence_status,
      record.gap_recommendation || '',
    ]
      .join(' ')
      .toLowerCase();

    const matched = terms.filter((term) => searchable.includes(term));
    if (matched.length > 0) {
      results.push({
        record,
        matchedTerms: matched,
      });
    }
  }

  return results;
}

export function generateGapGuidance(
  project: string,
  institution: string,
  claimedType: string
): string {
  if (institution.toLowerCase().includes('cen') || institution.toLowerCase().includes('cenelec')) {
    return `For ${project} claims regarding European standardisation (${institution}), investigate official national standards body delegation lists (e.g., DIN in Germany, AFNOR in France, UNI in Italy, BSI) or CEN/CENELEC JTC 21 formal liaison agreements. Code repository mentions or PR discussions do not prove committee voting membership.`;
  }
  if (institution.toLowerCase().includes('iso') || institution.toLowerCase().includes('iec')) {
    return `For ISO/IEC technical committees, verify whether participants are accredited via national standardisation bodies (P-members) or formal Category A/C liaisons. Textual reuse of model definitions constitutes technical contribution, not organizational membership.`;
  }
  if (institution.toLowerCase().includes('nist')) {
    return `Cross-examine the publicly published NIST AISIC member directory or working group charter listings. Confirm whether the contribution is under institutional auspices or individual academic capacity.`;
  }
  if (institution.toLowerCase().includes('ai act')) {
    return `Distinguish between general regulatory compliance awareness discussions and formal submissions to the European Commission AI Office, consultation feedback registers, or standardisation mandates.`;
  }
  return `Primary evidence required: Official committee minutes, public consultation submissions, accredited delegate rosters, or published specification authorship credits. Avoid relying solely on self-reported social posts or repository links.`;
}

export function exportRecordsToCsv(records: RelationshipRecord[]): string {
  const headers = [
    'project',
    'institution_or_process',
    'relationship_type',
    'evidence_status',
    'source_url',
    'source_passage',
    'access_date',
    'notes',
    'reviewer',
    'gap_recommendation',
  ];

  const escapeCsv = (val: string | undefined): string => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = records.map((r) =>
    [
      escapeCsv(r.project),
      escapeCsv(r.institution_or_process),
      escapeCsv(r.relationship_type),
      escapeCsv(r.evidence_status),
      escapeCsv(r.source_url),
      escapeCsv(r.source_passage),
      escapeCsv(r.access_date),
      escapeCsv(r.notes),
      escapeCsv(r.reviewer || 'Auditor'),
      escapeCsv(r.gap_recommendation || ''),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function parseCsvToRecords(csvText: string): {
  records: RelationshipRecord[];
  errors: string[];
  duplicates: number;
} {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return { records: [], errors: ['CSV file must contain a header line and at least one data row.'], duplicates: 0 };
  }

  // Parse header
  const rawHeaders = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));
  
  // Header mapping
  const expectedMap: Record<string, keyof RelationshipRecord> = {
    project: 'project',
    institution_or_process: 'institution_or_process',
    institution: 'institution_or_process',
    standards_body: 'institution_or_process',
    relationship_type: 'relationship_type',
    relationship: 'relationship_type',
    type: 'relationship_type',
    evidence_status: 'evidence_status',
    status: 'evidence_status',
    source_url: 'source_url',
    url: 'source_url',
    source: 'source_url',
    source_passage: 'source_passage',
    passage: 'source_passage',
    evidence: 'source_passage',
    access_date: 'access_date',
    date: 'access_date',
    notes: 'notes',
    reviewer: 'reviewer',
    gap_recommendation: 'gap_recommendation',
  };

  const headerIndices: Partial<Record<keyof RelationshipRecord, number>> = {};
  for (let i = 0; i < rawHeaders.length; i++) {
    const key = rawHeaders[i];
    if (expectedMap[key]) {
      headerIndices[expectedMap[key]] = i;
    }
  }

  const errors: string[] = [];
  const parsedRecords: RelationshipRecord[] = [];
  const seenPairs = new Set<string>();
  let duplicates = 0;

  for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
    const rawLine = lines[rowIdx];
    if (!rawLine.trim()) continue;
    const cols = parseCsvLine(rawLine);

    const getVal = (field: keyof RelationshipRecord): string => {
      const idx = headerIndices[field];
      if (idx !== undefined && idx < cols.length) {
        return cols[idx].trim();
      }
      return '';
    };

    const project = getVal('project');
    const institution_or_process = getVal('institution_or_process');
    let relationship_type = getVal('relationship_type') as any;
    let evidence_status = getVal('evidence_status') as any;
    const source_url = getVal('source_url');
    const source_passage = getVal('source_passage');
    const access_date = getVal('access_date') || new Date().toISOString().slice(0, 10);
    const notes = getVal('notes');
    const reviewer = getVal('reviewer') || 'CSV Import';
    const gap_recommendation = getVal('gap_recommendation');

    if (!project || !institution_or_process) {
      errors.push(`Row ${rowIdx + 1}: Missing project or institution identifier.`);
      continue;
    }

    // Normalize types if needed
    if (!VALID_RELATIONSHIP_TYPES.includes(relationship_type)) {
      relationship_type = 'unresolved';
    }
    if (!VALID_EVIDENCE_STATUSES.includes(evidence_status)) {
      evidence_status = 'candidate';
    }

    const pairKey = `${project.toLowerCase()}:::${institution_or_process.toLowerCase()}`;
    if (seenPairs.has(pairKey)) {
      duplicates++;
    }
    seenPairs.add(pairKey);

    const record: RelationshipRecord = {
      id: `csv_${Date.now()}_${rowIdx}`,
      project,
      institution_or_process,
      relationship_type,
      evidence_status,
      source_url,
      source_passage,
      access_date,
      notes,
      reviewer,
      gap_recommendation: gap_recommendation || generateGapGuidance(project, institution_or_process, relationship_type),
      audit_timestamp: new Date().toISOString(),
    };

    parsedRecords.push(record);
  }

  return { records: parsedRecords, errors, duplicates };
}

// Simple CSV line parser respecting quotation marks
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  return values;
}
