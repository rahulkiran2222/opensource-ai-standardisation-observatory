"""
Unit tests for validate_record using pytest.
Verifies that the validation function correctly identifies missing mandatory fields
(project, institution_or_process, relationship_type, evidence_status, source_url)
as specified in the methodology.
"""

import sys
import os

# Ensure project root is available in module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.verification.validate_record import validate_record, REQUIRED_FIELDS

try:
    import pytest
except ImportError:
    # Graceful shim if running via standalone python3 without pytest installed
    class _MockPytest:
        @staticmethod
        def fixture(func):
            return func

        class mark:
            @staticmethod
            def parametrize(argnames, argvalues):
                def decorator(func):
                    func._parametrize = (argnames, argvalues)
                    return func

                return decorator

    pytest = _MockPytest()


@pytest.fixture
def valid_record():
    """Returns a canonical complete record matching the methodology specification."""
    return {
        "project": "PyTorch",
        "institution_or_process": "CEN-CENELEC JTC 21",
        "relationship_type": "formal_membership",
        "evidence_status": "gap",
        "source_url": "https://github.com/pytorch/pytorch",
        "source_passage": "",
        "access_date": "",
        "notes": "Repository link does not establish participation.",
    }


def test_required_fields_list():
    """Verify that REQUIRED_FIELDS contains the 5 mandatory fields defined in the methodology."""
    expected = [
        "project",
        "institution_or_process",
        "relationship_type",
        "evidence_status",
        "source_url",
    ]
    assert REQUIRED_FIELDS == expected


def test_valid_record_passes(valid_record):
    """A valid record containing all mandatory fields returns valid=True and no missing fields."""
    result = validate_record(valid_record)
    assert result["valid"] is True
    assert result["missing_fields"] == []


@pytest.mark.parametrize("missing_field", [
    "project",
    "institution_or_process",
    "relationship_type",
    "evidence_status",
    "source_url",
])
def test_each_mandatory_field_missing(valid_record, missing_field):
    """Deleting any of the mandatory fields must flag valid=False and identify the missing field."""
    record = valid_record.copy()
    del record[missing_field]

    result = validate_record(record)
    assert result["valid"] is False
    assert missing_field in result["missing_fields"]


@pytest.mark.parametrize("empty_value", ["", "   ", "\t", "\n", None])
def test_project_empty_values(valid_record, empty_value):
    """Empty or whitespace-only project values must be identified as missing."""
    record = valid_record.copy()
    record["project"] = empty_value

    result = validate_record(record)
    assert result["valid"] is False
    assert "project" in result["missing_fields"]


@pytest.mark.parametrize("empty_value", ["", "   ", "\t", "\n", None])
def test_institution_empty_values(valid_record, empty_value):
    """Empty or whitespace-only institution_or_process values must be identified as missing."""
    record = valid_record.copy()
    record["institution_or_process"] = empty_value

    result = validate_record(record)
    assert result["valid"] is False
    assert "institution_or_process" in result["missing_fields"]


@pytest.mark.parametrize("empty_value", ["", "   ", "\t", "\n", None])
def test_relationship_type_empty_values(valid_record, empty_value):
    """Empty or whitespace-only relationship_type values must be identified as missing."""
    record = valid_record.copy()
    record["relationship_type"] = empty_value

    result = validate_record(record)
    assert result["valid"] is False
    assert "relationship_type" in result["missing_fields"]


@pytest.mark.parametrize("empty_value", ["", "   ", "\t", "\n", None])
def test_evidence_status_empty_values(valid_record, empty_value):
    """Empty or whitespace-only evidence_status values must be identified as missing."""
    record = valid_record.copy()
    record["evidence_status"] = empty_value

    result = validate_record(record)
    assert result["valid"] is False
    assert "evidence_status" in result["missing_fields"]


@pytest.mark.parametrize("empty_value", ["", "   ", "\t", "\n", None])
def test_source_url_empty_values(valid_record, empty_value):
    """Empty or whitespace-only source_url values must be identified as missing."""
    record = valid_record.copy()
    record["source_url"] = empty_value

    result = validate_record(record)
    assert result["valid"] is False
    assert "source_url" in result["missing_fields"]


def test_empty_record():
    """An empty record dictionary must flag all 5 mandatory fields as missing."""
    result = validate_record({})
    assert result["valid"] is False
    assert sorted(result["missing_fields"]) == sorted(REQUIRED_FIELDS)


def test_multiple_missing_fields():
    """A record missing multiple fields must report all of them in missing_fields."""
    record = {
        "project": "PyTorch",
        "notes": "Missing institution, relationship_type, evidence_status, and source_url",
    }
    result = validate_record(record)
    assert result["valid"] is False
    assert "institution_or_process" in result["missing_fields"]
    assert "relationship_type" in result["missing_fields"]
    assert "evidence_status" in result["missing_fields"]
    assert "source_url" in result["missing_fields"]
    assert "project" not in result["missing_fields"]


def test_non_dict_input():
    """Non-dictionary input must be treated as invalid with all fields missing."""
    result = validate_record(None)
    assert result["valid"] is False
    assert sorted(result["missing_fields"]) == sorted(REQUIRED_FIELDS)


def test_optional_fields_do_not_invalidate(valid_record):
    """Fields not listed in REQUIRED_FIELDS (e.g. source_passage, access_date, notes) may be empty."""
    record = valid_record.copy()
    record["source_passage"] = ""
    record["access_date"] = ""
    record["notes"] = ""

    result = validate_record(record)
    assert result["valid"] is True
    assert result["missing_fields"] == []


# Allow direct execution with `python3 tests/test_validation.py`
if __name__ == "__main__":
    canonical_record = valid_record()

    test_cases = [
        ("test_required_fields_list", lambda: test_required_fields_list()),
        ("test_valid_record_passes", lambda: test_valid_record_passes(canonical_record)),
        ("test_empty_record", lambda: test_empty_record()),
        ("test_multiple_missing_fields", lambda: test_multiple_missing_fields()),
        ("test_non_dict_input", lambda: test_non_dict_input()),
        ("test_optional_fields_do_not_invalidate", lambda: test_optional_fields_do_not_invalidate(canonical_record)),
    ]

    # Add parameterized test cases
    for field in REQUIRED_FIELDS:
        test_cases.append((
            f"test_each_mandatory_field_missing[{field}]",
            lambda f=field: test_each_mandatory_field_missing(canonical_record, f)
        ))

    for empty_val in ["", "   ", "\t", "\n", None]:
        val_repr = repr(empty_val)
        test_cases.append((
            f"test_project_empty_values[{val_repr}]",
            lambda v=empty_val: test_project_empty_values(canonical_record, v)
        ))
        test_cases.append((
            f"test_institution_empty_values[{val_repr}]",
            lambda v=empty_val: test_institution_empty_values(canonical_record, v)
        ))
        test_cases.append((
            f"test_relationship_type_empty_values[{val_repr}]",
            lambda v=empty_val: test_relationship_type_empty_values(canonical_record, v)
        ))
        test_cases.append((
            f"test_evidence_status_empty_values[{val_repr}]",
            lambda v=empty_val: test_evidence_status_empty_values(canonical_record, v)
        ))
        test_cases.append((
            f"test_source_url_empty_values[{val_repr}]",
            lambda v=empty_val: test_source_url_empty_values(canonical_record, v)
        ))

    print(f"Running {len(test_cases)} test cases...")
    passed = 0
    failed = 0

    for name, func in test_cases:
        try:
            func()
            passed += 1
        except AssertionError as exc:
            print(f"  FAILED: {name} -> {exc}")
            failed += 1
        except Exception as exc:
            print(f"  ERROR: {name} -> {exc}")
            failed += 1

    print(f"Result: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)
