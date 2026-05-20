"""Resolve artifact paths for thesis-final vs per-run trees."""

from __future__ import annotations

from pathlib import Path

from config import MEDFLOW_PH, THESIS_FINAL_ID, WEB_PUBLIC
from pipeline_runner import run_root


def resolve_artifact_path(run_id: str, relative_path: str) -> Path | None:
    rel = relative_path.lstrip("/").replace("\\", "/")
    if ".." in rel.split("/"):
        return None

    if run_id == THESIS_FINAL_ID:
        for base in (
            WEB_PUBLIC / "data",
            WEB_PUBLIC / "results",
            WEB_PUBLIC / "output_source",
            MEDFLOW_PH / "output_source",
            MEDFLOW_PH / "results",
        ):
            candidate = base / rel
            if candidate.is_file():
                return candidate
        # Allow paths like results/05/... when passed without prefix
        for prefix in ("data/", "results/", "output_source/"):
            if rel.startswith(prefix):
                continue
            for base_name in ("data", "results", "output_source"):
                candidate = WEB_PUBLIC / base_name / rel
                if candidate.is_file():
                    return candidate
        return None

    root = run_root(run_id)
    # Direct path under run root
    for candidate in (
        root / rel,
        root / "output_source" / rel,
        root / "results" / rel,
        root / "data" / rel,
    ):
        if candidate.is_file():
            return candidate
    # Manifest paths often start with results/ or data/ — try without stripping
    manifest = relative_path.lstrip("/").replace("\\", "/")
    if manifest.startswith("results/"):
        tail = manifest[len("results/") :]
        hit = root / "results" / tail
        if hit.is_file():
            return hit
    if manifest.startswith("data/"):
        tail = manifest[len("data/") :]
        for base in (root / "data", root / "output_source"):
            hit = base / tail
            if hit.is_file():
                return hit
    return None
