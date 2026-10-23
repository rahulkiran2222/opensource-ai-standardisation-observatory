export interface PythonCodeModule {
  filename: string;
  category: 'schema' | 'collection' | 'verification' | 'network' | 'reporting' | 'tests';
  description: string;
  code: string;
}

export const pythonCodeModules: PythonCodeModule[] = [
  {
    filename: 'schemas/evidence_record.schema.json',
    category: 'schema',
    description: 'JSON Schema definition validating evidence record fields, enum restrictions, and URI formats.',
    code: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ObservatoryEvidenceRecord",
  "type": "object",
  "required": [
    "project",
    "institution_or_process",
    "relationship_type",
    "evidence_status",
    "source_url"
  ],
  "properties": {
    "project": {
      "type": "string",
      "description": "The open-source AI project or software artifact under examination."
    },
    "institution_or_process": {
      "type": "string",
      "description": "The standards development organization, regulatory agency, or policy framework."
    },
    "relationship_type": {
      "type": "string",
      "enum": [
        "formal_membership",
        "technical_contribution",
        "consultation_response",
        "documented_citation",
        "declared_alignment",
        "contextual_relevance",
        "unresolved"
      ]
    },
    "evidence_status": {
      "type": "string",
      "enum": [
        "candidate",
        "documented",
        "independently_verified",
        "gap"
      ]
    },
    "source_url": {
      "type": "string",
      "format": "uri"
    },
    "source_passage": {
      "type": "string"
    },
    "access_date": {
      "type": "string",
      "format": "date"
    },
    "notes": {
      "type": "string"
    },
    "reviewer": {
      "type": "string"
    },
    "gap_recommendation": {
      "type": "string"
    }
  }
}`,
  },
  {
    filename: 'src/collection/source_registry.py',
    category: 'collection',
    description: 'Maintains authoritative reference registers for policy institutions and standards committees.',
    code: `"""
Source Registry module for Open-Source AI Standardisation Observatory.
Categorizes public institutional sources to target evidence audits.
"""

from typing import List, Dict, Any

SOURCES: List[Dict[str, Any]] = [
    {
        "name": "European Commission",
        "source_type": "official_policy",
        "url": "https://digital-strategy.ec.europa.eu/en/policies/ai-act-standardisation",
        "authority": "primary",
        "description": "Standardisation requests and GPAI Code of Practice plenaries."
    },
    {
        "name": "CEN-CENELEC JTC 21",
        "source_type": "standards_body",
        "url": "https://www.cencenelec.eu/areas-of-work/cen-cenelec-topics/artificial-intelligence/",
        "authority": "primary",
        "description": "European AI standardisation drafting committee."
    },
    {
        "name": "ISO/IEC JTC 1/SC 42",
        "source_type": "standards_body",
        "url": "https://www.iso.org/committee/6794475.html",
        "authority": "primary",
        "description": "Global foundational AI governance and terminology standards."
    },
    {
        "name": "NIST AI Safety Consortium (AISIC)",
        "source_type": "standards_body",
        "url": "https://www.nist.gov/itl/artificial-intelligence/us-artificial-intelligence-safety-institute-consortium",
        "authority": "primary",
        "description": "US federal red-teaming and safety measurement consortium."
    }
]

def get_authoritative_sources() -> List[Dict[str, Any]]:
    return [s for s in SOURCES if s["authority"] == "primary"]
`,
  },
  {
    filename: 'src/verification/validate_record.py',
    category: 'verification',
    description: 'Enforces structural completeness, schema validation, and rigorous evidence status preconditions.',
    code: `"""
Validation Engine for Evidence Records.
Distinguishes relationship claim types from evidence audit status.
"""

from typing import Dict, Any, List

REQUIRED_FIELDS = [
    "project",
    "institution_or_process",
    "relationship_type",
    "evidence_status",
    "source_url"
]

VALID_RELATIONSHIP_TYPES = {
    "formal_membership",
    "technical_contribution",
    "consultation_response",
    "documented_citation",
    "declared_alignment",
    "contextual_relevance",
    "unresolved"
}

VALID_STATUSES = {
    "candidate",
    "documented",
    "independently_verified",
    "gap"
}

def validate_record(record: Dict[str, Any]) -> Dict[str, Any]:
    missing = [
        field
        for field in REQUIRED_FIELDS
        if not str(record.get(field, "")).strip()
    ]
    
    issues = []
    
    # 1. Required fields
    if missing:
        issues.append(f"Missing required fields: {', '.join(missing)}")
        
    # 2. Vocabulary checks
    rel = record.get("relationship_type", "")
    if rel not in VALID_RELATIONSHIP_TYPES:
        issues.append(f"Invalid relationship_type '{rel}'")
        
    status = record.get("evidence_status", "")
    if status not in VALID_STATUSES:
        issues.append(f"Invalid evidence_status '{status}'")
        
    # 3. High-evidence requirement: verified claims must have verbatim passage
    if status == "independently_verified":
        passage = str(record.get("source_passage", "")).strip()
        date = str(record.get("access_date", "")).strip()
        if len(passage) < 15:
            issues.append("Independently verified records require verbatim source_passage >= 15 chars.")
        if not date:
            issues.append("Independently verified records require access_date.")
            
    # 4. Gaps should state reason
    if status == "gap":
        notes = str(record.get("notes", "")).strip()
        if not notes:
            issues.append("Evidence gaps must record reviewer notes stating missing proof.")

    return {
        "valid": len(issues) == 0,
        "missing_fields": missing,
        "issues": issues
    }
`,
  },
  {
    filename: 'src/network/build_graph.py',
    category: 'network',
    description: 'Constructs NetworkX graph strictly from audited, supported records—preventing false edges.',
    code: `"""
Network Engine.
Transforms verified relationships into an auditable graph.
Guarantees: An edge is added only when supported by evidence.
"""

import networkx as nx
from typing import List, Dict, Any

def build_observatory_graph(
    records: List[Dict[str, Any]],
    include_candidates: bool = False
) -> nx.Graph:
    G = nx.Graph()

    for rec in records:
        proj = rec.get("project")
        inst = rec.get("institution_or_process")
        status = rec.get("evidence_status")
        rel_type = rec.get("relationship_type")

        # Register nodes
        if not G.has_node(proj):
            G.add_node(proj, entity_type="open_source_project")
        if not G.has_node(inst):
            G.add_node(inst, entity_type="standards_body_or_institution")

        # Rigorous edge inclusion rule:
        # Do not create an edge from keyword match or unverified candidate
        # unless explicitly requested for exploratory analysis
        if status in ("documented", "independently_verified") or include_candidates:
            G.add_edge(
                proj,
                inst,
                relationship_type=rel_type,
                evidence_status=status,
                source_url=rec.get("source_url")
            )

    return G

def summarize_network(G: nx.Graph) -> Dict[str, Any]:
    return {
        "nodes": G.number_of_nodes(),
        "edges": G.number_of_edges(),
        "density": nx.density(G),
        "connected_components": nx.number_connected_components(G),
    }
`,
  },
  {
    filename: 'src/reporting/evidence_summary.py',
    category: 'reporting',
    description: 'Generates descriptive audit reports, source missingness matrices, and academic export tables.',
    code: `"""
Research Reporting and Audit Summaries.
Produces verifiable frequency distributions without overclaiming causality.
"""

from collections import Counter
from typing import List, Dict, Any

def generate_evidence_summary(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    status_counts = Counter(r.get("evidence_status", "unknown") for r in records)
    type_counts = Counter(r.get("relationship_type", "unknown") for r in records)
    
    missing_passages = sum(1 for r in records if not str(r.get("source_passage", "")).strip())
    missing_dates = sum(1 for r in records if not str(r.get("access_date", "")).strip())
    
    gaps = [
        {
            "project": r.get("project"),
            "target": r.get("institution_or_process"),
            "notes": r.get("notes"),
            "recommendation": r.get("gap_recommendation")
        }
        for r in records
        if r.get("evidence_status") == "gap"
    ]

    return {
        "total_records": len(records),
        "status_distribution": dict(status_counts),
        "relationship_type_distribution": dict(type_counts),
        "missingness": {
            "missing_passages": missing_passages,
            "missing_dates": missing_dates
        },
        "unresolved_gaps": gaps
    }
`,
  },
  {
    filename: 'tests/test_validation.py',
    category: 'tests',
    description: 'Unit tests verifying schema enforcement, candidate edge rejection, and gap resolution rules.',
    code: `"""
Unit tests for Observatory data pipeline and validation engine.
"""

from src.verification.validate_record import validate_record
from src.network.build_graph import build_observatory_graph

def test_pytorch_gap_record():
    record = {
        "project": "PyTorch",
        "institution_or_process": "CEN-CENELEC JTC 21",
        "relationship_type": "formal_membership",
        "evidence_status": "gap",
        "source_url": "https://github.com/pytorch/pytorch",
        "source_passage": "",
        "access_date": "",
        "notes": "Repository link does not establish participation."
    }
    result = validate_record(record)
    assert result["valid"] is True
    assert record["evidence_status"] == "gap"

def test_unsupported_edge_rejection():
    records = [
        {
            "project": "PyTorch",
            "institution_or_process": "CEN-CENELEC JTC 21",
            "relationship_type": "formal_membership",
            "evidence_status": "gap",
            "source_url": "https://github.com/pytorch/pytorch"
        }
    ]
    # By default, gaps should not create network edges
    G = build_observatory_graph(records, include_candidates=False)
    assert G.number_of_nodes() == 2
    assert G.number_of_edges() == 0, "Gaps must not generate verified network edges!"
`,
  },
];
