"""
Step 01 — post-cleaning checks for PhilGEPS medical merge.

Used by ``01_data_cleaning_philgeps.py``. Raises ``Step01ValidationError`` on hard
failures after ``apply_validation_result(..., raise_on_error=True)`` (default).
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Callable

import pandas as pd

# Columns that must still match the medical keyword regex after filtering (spot-check cap).
_MEDICAL_AUDIT_SAMPLE = 5000
# Minimum columns expected in merged medical output (wide export + extras).
_MIN_OUTPUT_COLUMNS = 40


@dataclass(frozen=True)
class ValidationResult:
    ok: bool
    message: str

    @classmethod
    def pass_(cls, message: str = "OK") -> ValidationResult:
        return cls(True, message)

    @classmethod
    def fail(cls, message: str) -> ValidationResult:
        return cls(False, message)


class Step01ValidationError(RuntimeError):
    """Raised when a step-01 validation fails and raise_on_error is True."""


def apply_validation_result(
    result: ValidationResult,
    log: Callable[[str], None],
    *,
    raise_on_error: bool = True,
) -> None:
    if result.ok:
        log(f"Validation OK: {result.message}")
        return
    log(f"Validation FAILED: {result.message}")
    if raise_on_error:
        raise Step01ValidationError(result.message)


def validate_raw_row_accounting(
    med_stats_total: dict[str, int],
    total_raw_rows: int,
    raw_rows_by_year: dict[int, int],
) -> ValidationResult:
    """Accumulated filter ``input_rows`` must match rows iterated; per-year dict must sum to same."""
    acc_in = int(med_stats_total.get("input_rows", -1))
    if acc_in != total_raw_rows:
        return ValidationResult.fail(
            f"Raw row accounting: accumulated medical-filter input_rows ({acc_in:,}) "
            f"!= total_raw_rows from loaders ({total_raw_rows:,}).",
        )
    by_year = sum(raw_rows_by_year.values())
    if by_year != total_raw_rows:
        return ValidationResult.fail(
            f"Raw row accounting: sum(raw_rows_by_year)={by_year:,} "
            f"!= total_raw_rows={total_raw_rows:,}.",
        )
    return ValidationResult.pass_(
        f"raw accounting: input_rows={acc_in:,}, by_year_sum={by_year:,}.",
    )


def validate_after_concat(
    med_stats_total: dict[str, int],
    rows_after_chunk_dedup: int,
    n_concat_rows: int,
) -> ValidationResult:
    """Sum of within-file deduped chunk sizes must match concat row count before cross-file dedup."""
    if n_concat_rows != rows_after_chunk_dedup:
        return ValidationResult.fail(
            f"Concat shape: len(concat)={n_concat_rows:,} "
            f"!= rows_after_chunk_dedup={rows_after_chunk_dedup:,}.",
        )
    pre = int(med_stats_total.get("output_rows", -1))
    if pre < n_concat_rows:
        return ValidationResult.fail(
            f"Inconsistent counts: sum medical output_rows pre chunk-dedup ({pre:,}) "
            f"< concat rows ({n_concat_rows:,}).",
        )
    return ValidationResult.pass_(
        f"concat OK: {n_concat_rows:,} rows match within-file dedup sum; "
        f"sum pre-chunk medical output_rows={pre:,}.",
    )


def run_post_imputation_validations(df: pd.DataFrame, medical_pattern: str) -> ValidationResult:
    """
    After step-01 imputation: no nulls in non-datetime columns; basic shape; optional regex audit sample.
    """
    if df.empty:
        return ValidationResult.fail("Post-imputation: merged medical dataframe is empty.")
    if len(df.columns) < _MIN_OUTPUT_COLUMNS:
        return ValidationResult.fail(
            f"Post-imputation: only {len(df.columns)} columns (expected ≥ {_MIN_OUTPUT_COLUMNS}).",
        )
    for c in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[c]):
            continue
        n = int(df[c].isna().sum())
        if n:
            return ValidationResult.fail(
                f"Post-imputation: column {c!r} still has {n:,} nulls (non-datetime).",
            )

    rx = re.compile(medical_pattern, flags=re.IGNORECASE)
    u, a, b = "UNSPSC Description", "Item Name", "Item Description"
    if u in df.columns and a in df.columns and b in df.columns:
        tiny = df.sample(n=min(_MEDICAL_AUDIT_SAMPLE, len(df)), random_state=0)

        def _row_ok(row: pd.Series) -> bool:
            return bool(
                rx.search(str(row[u])) or rx.search(str(row[a])) or rx.search(str(row[b])),
            )

        ok = tiny.apply(_row_ok, axis=1)
        bad = int((~ok).sum())
        if bad:
            return ValidationResult.fail(
                f"Medical keyword audit: {bad} / {len(tiny)} sampled rows fail UNSPSC/Item regex check.",
            )
        return ValidationResult.pass_(
            f"post-imputation: no nulls (non-datetime), {len(tiny)}-row keyword audit OK.",
        )

    return ValidationResult.pass_(
        "post-imputation: no nulls (non-datetime); keyword audit skipped (missing Item/UNSPSC cols).",
    )


def _count_csv_body_rows(path: str) -> int:
    """Count data lines (excludes header); assumes no embedded newlines in quoted fields."""
    with open(path, encoding="utf-8", newline="") as f:
        f.readline()  # header
        return sum(1 for _ in f)


def run_output_file_validations(
    output_combined: str,
    yearly_plan: list[tuple[str, int]],
    *,
    n_merged_expected: int,
) -> ValidationResult:
    """Files exist; combined + yearly row counts match expectations."""
    if not os.path.isfile(output_combined):
        return ValidationResult.fail(f"Missing combined output: {output_combined}")
    n_all = _count_csv_body_rows(output_combined)
    if n_all != n_merged_expected:
        return ValidationResult.fail(
            f"Combined CSV row count {n_all:,} != expected {n_merged_expected:,} ({output_combined}).",
        )
    total_y = 0
    for ypath, n_exp in yearly_plan:
        if not os.path.isfile(ypath):
            return ValidationResult.fail(f"Missing yearly output: {ypath}")
        n_y = _count_csv_body_rows(ypath)
        if n_y != n_exp:
            return ValidationResult.fail(
                f"Yearly CSV {ypath}: row count {n_y:,} != expected {n_exp:,}.",
            )
        total_y += n_y
    if total_y != n_merged_expected:
        return ValidationResult.fail(
            f"Yearly row counts sum to {total_y:,} != combined {n_merged_expected:,}.",
        )
    return ValidationResult.pass_(
        f"output CSVs OK: combined {n_all:,} rows; yearly parts sum {total_y:,}.",
    )
