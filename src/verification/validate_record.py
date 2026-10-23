"""
Validation Engine for Open-Source AI Standardisation Observatory Evidence Records.

Implements the validate_record function to enforce the presence of required fields:
- project
- institution_or_process
- relationship_type
- evidence_status
- source_url
as specified in Component 3 of the methodology.
"""

REQUIRED_FIELDS = [
    "project",
    "institution_or_process",
    "relationship_type",
    "evidence_status",
    "source_url",
]


def validate_record(record):
    """
    Validates that an evidence record contains all mandatory fields with non-empty values.

    Args:
        record (dict): Candidate relationship record to validate.

    Returns:
        dict: A dictionary containing:
            - 'valid' (bool): True if all required fields are present and non-empty.
            - 'missing_fields' (list): List of required fields that are missing or empty.
    """
    if not isinstance(record, dict):
        return {
            "valid": False,
            "missing_fields": list(REQUIRED_FIELDS),
        }

    missing = [
        field
        for field in REQUIRED_FIELDS
        if not str(record.get(field) or "").strip()
    ]

    if missing:
        return {
            "valid": False,
            "missing_fields": missing,
        }

    return {
        "valid": True,
        "missing_fields": [],
    }
