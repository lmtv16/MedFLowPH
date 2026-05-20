"""Pydantic request/response models."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class RunCreateRequest(BaseModel):
    label: str | None = None
    dataset_id: str | None = None
    use_bundled_dataset: bool = True
    pipeline_mode: Literal["full", "quick"] = "full"
    steps: list[str] | None = None
    seed_from_baseline: bool = True
    has_upload: bool = False
    k_min: int = 2
    k_max: int = 7
    metrics_subsample: int = 80_000
    pca_matrix: Literal["base", "theme", "scaled"] = "base"
    enable_pca: bool = True
    enable_kmeans: bool = True
    enable_dbscan: bool = False
    enable_comparison: bool = False
    dbscan_eps: float | None = None
    dbscan_min_samples: int | None = None
    random_state: int = 42


class RunSummary(BaseModel):
    id: str
    status: str
    label: str | None = None
    created_at: str
    updated_at: str
    current_step: str | None = None
    error_message: str | None = None
    summary: dict[str, Any] | None = None
    params: dict[str, Any] | None = None
