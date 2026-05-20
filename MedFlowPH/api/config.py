"""API paths and constants."""

from __future__ import annotations

from pathlib import Path

MEDFLOW_PH = Path(__file__).resolve().parent.parent
RUNS_DIR = MEDFLOW_PH / "runs"
SCRIPTS_DIR = MEDFLOW_PH / "source_code" / "PhilGEPS"
WEB_PUBLIC = MEDFLOW_PH / "medflow-web" / "public"
THESIS_FINAL_ID = "thesis-final"
DEFAULT_RANDOM_STATE = 42
