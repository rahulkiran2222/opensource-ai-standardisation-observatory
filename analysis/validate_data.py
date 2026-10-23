#!/usr/bin/env python3
"""
validate_data.py - Stage 2 Data Quality & Audit Pipeline Module
Validates raw observatory entities and evidence records against the canonical audit schema.
Outputs validated nodes/edges and generates data_quality_audit.json.
"""

import os
import sys
import json
import csv
import re
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUTS_DIR = BASE_DIR / "data" / "outputs"

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

VALID_EVIDENCE_STATUSES = {
    "independently_verified",
    "documented",
    "candidate",
    "gap"
}

def load_raw_entities():
    ent_file = RAW_DIR / "entities.json"
    if not ent_file.exists():
        raise FileNotFoundError(f"Missing entities file: {ent_file}")
    with open(ent_file, "r", encoding="utf-8") as f:
        return json.load(f)

def load_raw_records():
    rec_file = RAW_DIR / "evidence_records.csv"
    if not rec_file.exists():
        raise FileNotFoundError(f"Missing records CSV: {rec_file}")
    records = []
    with open(rec_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append({k.strip(): v.strip() if v else "" for k, v in row.items()})
    return records

def validate_dataset():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    entities = load_raw_entities()
    records = load_raw_records()

    audit_report = {
        "audit_timestamp": "2026-10-20T00:00:00Z",
        "total_records_evaluated": len(records),
        "total_entities_cataloged": len(entities),
        "valid_records_count": 0,
        "rejected_records_count": 0,
        "duplicate_records_count": 0,
        "missing_passage_count": 0,
        "missing_date_count": 0,
        "unverified_candidate_count": 0,
        "gap_records_count": 0,
        "verified_records_count": 0,
        "field_completeness": {},
        "issues": [],
        "entity_audit": {},
        "status_distribution": {},
        "relationship_distribution": {}
    }

    field_counts = {f: 0 for f in REQUIRED_FIELDS + ["source_passage", "access_date", "notes", "reviewer", "gap_recommendation"]}
    seen_pairs = {}
    validated_records = []
    rejected_records = []

    # Map entities
    entity_names = {e["name"].strip().lower(): e for e in entities}

    for idx, r in enumerate(records):
        rec_id = r.get("id", f"rec_{idx+1:03d}")
        proj = r.get("project", "").strip()
        inst = r.get("institution_or_process", "").strip()
        rel_type = r.get("relationship_type", "").strip()
        ev_status = r.get("evidence_status", "").strip()
        url = r.get("source_url", "").strip()
        passage = r.get("source_passage", "").strip()
        date_str = r.get("access_date", "").strip()

        # Track field presence
        for k in field_counts:
            if r.get(k, "").strip():
                field_counts[k] += 1

        row_errors = []
        row_warnings = []

        # 1. Required fields
        for rf in REQUIRED_FIELDS:
            if not r.get(rf, "").strip():
                row_errors.append(f"Missing mandatory field '{rf}'")

        # 2. Enumeration checks
        if rel_type and rel_type not in VALID_RELATIONSHIP_TYPES:
            row_errors.append(f"Invalid relationship_type '{rel_type}'")
        if ev_status and ev_status not in VALID_EVIDENCE_STATUSES:
            row_errors.append(f"Invalid evidence_status '{ev_status}'")

        # 3. URL protocol check
        if url:
            if not (url.startswith("http://") or url.startswith("https://")):
                row_errors.append(f"URL missing standard http/https protocol: {url}")
        else:
            row_errors.append("Empty source_url")

        # 4. Passage & Date checks
        if not passage:
            audit_report["missing_passage_count"] += 1
            if ev_status == "independently_verified":
                row_warnings.append("Independently verified status lacks verbatim excerpt passage")

        if not date_str:
            audit_report["missing_date_count"] += 1
            row_warnings.append("Missing access_date")
        else:
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
                row_warnings.append(f"access_date '{date_str}' does not follow YYYY-MM-DD ISO format")

        # 5. Status specific audits
        if ev_status == "gap":
            audit_report["gap_records_count"] += 1
            if not r.get("gap_recommendation"):
                row_warnings.append("Evidence gap record missing actionable gap_recommendation directive")
        elif ev_status in ("independently_verified", "documented"):
            audit_report["verified_records_count"] += 1
        elif ev_status == "candidate":
            audit_report["unverified_candidate_count"] += 1

        # 6. Duplicate detection (same project, institution, and relationship_type)
        pair_key = (proj.lower(), inst.lower(), rel_type.lower())
        if pair_key in seen_pairs:
            audit_report["duplicate_records_count"] += 1
            row_warnings.append(f"Duplicate relationship with record {seen_pairs[pair_key]}")
        else:
            seen_pairs[pair_key] = rec_id

        # Update distribution counts
        audit_report["status_distribution"][ev_status] = audit_report["status_distribution"].get(ev_status, 0) + 1
        audit_report["relationship_distribution"][rel_type] = audit_report["relationship_distribution"].get(rel_type, 0) + 1

        if row_errors:
            audit_report["rejected_records_count"] += 1
            rejected_records.append({
                "id": rec_id,
                "project": proj,
                "institution": inst,
                "errors": row_errors,
                "warnings": row_warnings
            })
            audit_report["issues"].append({
                "record_id": rec_id,
                "project": proj,
                "institution": inst,
                "severity": "error",
                "messages": row_errors + row_warnings
            })
        else:
            audit_report["valid_records_count"] += 1
            validated_records.append(r)
            if row_warnings:
                audit_report["issues"].append({
                    "record_id": rec_id,
                    "project": proj,
                    "institution": inst,
                    "severity": "warning",
                    "messages": row_warnings
                })

    # Field completeness percentage
    total_eval = max(len(records), 1)
    for k, v in field_counts.items():
        audit_report["field_completeness"][k] = {
            "present_count": v,
            "total_records": len(records),
            "completeness_pct": round((v / total_eval) * 100, 1)
        }

    # Entity validation
    for ent in entities:
        ent_name_low = ent["name"].strip().lower()
        connected_recs = [r for r in validated_records if r["project"].strip().lower() == ent_name_low or r["institution_or_process"].strip().lower() == ent_name_low]
        audit_report["entity_audit"][ent["name"]] = {
            "entity_type": ent["entity_type"],
            "total_records": len(connected_recs),
            "verified_records": len([r for r in connected_recs if r["evidence_status"] in ("independently_verified", "documented")]),
            "candidate_records": len([r for r in connected_recs if r["evidence_status"] == "candidate"]),
            "gap_records": len([r for r in connected_recs if r["evidence_status"] == "gap"])
        }

    # Write processed nodes and edges
    nodes_data = []
    for ent in entities:
        nodes_data.append({
            "id": ent["id"],
            "name": ent["name"],
            "entity_type": ent["entity_type"],
            "official_url": ent.get("official_url", ""),
            "description": ent.get("description", ""),
            "lead_maintainer": ent.get("lead_maintainer_or_secretariat") or ent.get("jurisdiction", "")
        })

    edges_data = []
    for r in validated_records:
        edges_data.append({
            "id": r["id"],
            "source": r["project"],
            "target": r["institution_or_process"],
            "relationship_type": r["relationship_type"],
            "evidence_status": r["evidence_status"],
            "source_url": r["source_url"],
            "source_passage": r.get("source_passage", ""),
            "access_date": r.get("access_date", ""),
            "notes": r.get("notes", ""),
            "reviewer": r.get("reviewer", ""),
            "gap_recommendation": r.get("gap_recommendation", "")
        })

    # Save outputs
    with open(PROCESSED_DIR / "validated_nodes.json", "w", encoding="utf-8") as f:
        json.dump(nodes_data, f, indent=2)

    with open(PROCESSED_DIR / "validated_edges.json", "w", encoding="utf-8") as f:
        json.dump(edges_data, f, indent=2)

    with open(OUTPUTS_DIR / "data_quality_audit.json", "w", encoding="utf-8") as f:
        json.dump(audit_report, f, indent=2)

    print(f"Validation complete: {audit_report['valid_records_count']} valid, {audit_report['rejected_records_count']} rejected, {audit_report['duplicate_records_count']} duplicates.")
    return audit_report

if __name__ == "__main__":
    validate_dataset()
