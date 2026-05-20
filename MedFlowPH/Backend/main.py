"""
MedFlow PH Analytics Workbench API.

Run: uvicorn main:app --reload --port 8000
(from MedFlow/MedFlowPH/Backend with venv active)
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from artifacts import resolve_artifact_path
from config import THESIS_FINAL_ID
from database import get_run, init_db, insert_run, list_runs
from models import RunCreateRequest, RunSummary
from pipeline_runner import (
    derive_seed_from_baseline,
    ensure_run_tree,
    execute_run,
    new_run_id,
    store_upload_file,
)

app = FastAPI(title="MedFlow PH Workbench API", version="0.2.0")

_DEFAULT_CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]


def _cors_origins() -> list[str]:
    origins = list(_DEFAULT_CORS_ORIGINS)
    extra = os.environ.get("MEDFLOW_CORS_ORIGINS", "").strip()
    if extra:
        for origin in extra.split(","):
            origin = origin.strip()
            if origin and origin not in origins:
                origins.append(origin)
    return origins


def _uploads_disabled() -> bool:
    return os.environ.get("MEDFLOW_DISABLE_UPLOAD", "").lower() in ("1", "true", "yes")


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _to_summary(row: dict[str, Any]) -> RunSummary:
    params = row.get("params_json") if isinstance(row.get("params_json"), dict) else {}
    label = params.get("label") if isinstance(params, dict) else None
    summary = row.get("summary_json") if isinstance(row.get("summary_json"), dict) else None
    return RunSummary(
        id=row["id"],
        status=row["status"],
        label=label,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
        current_step=row.get("current_step"),
        error_message=row.get("error_message"),
        summary=summary,
        params=params if isinstance(params, dict) else None,
    )


@app.get("/api/runs", response_model=list[RunSummary])
def api_list_runs() -> list[RunSummary]:
    return [_to_summary(r) for r in list_runs()]


@app.get("/api/runs/{run_id}", response_model=RunSummary)
def api_get_run(run_id: str) -> RunSummary:
    row = get_run(run_id)
    if not row:
        raise HTTPException(404, "Run not found")
    return _to_summary(row)


def _start_run_worker(run_id: str, params: dict[str, Any]) -> None:
    worker = threading.Thread(
        target=execute_run,
        args=(run_id, params),
        daemon=True,
    )
    worker.start()


@app.post("/api/runs", response_model=RunSummary)
async def api_create_run(
    payload: str = Form(..., description="JSON RunCreateRequest"),
    file: UploadFile | None = File(None),
) -> RunSummary:
    try:
        body = RunCreateRequest.model_validate_json(payload)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(400, f"Invalid payload JSON: {exc}") from exc

    run_id = new_run_id()
    params = body.model_dump()
    params["label"] = body.label or f"Experiment {run_id}"

    if file and file.filename:
        content = await file.read()
        store_upload_file(run_id, file.filename, content)
        params["has_upload"] = True
        params["use_bundled_dataset"] = False

    params["seed_from_baseline"] = derive_seed_from_baseline(params)

    insert_run(run_id, params)
    ensure_run_tree(run_id)
    _start_run_worker(run_id, params)
    row = get_run(run_id)
    return _to_summary(row)  # type: ignore[arg-type]


@app.post("/api/runs/json", response_model=RunSummary)
def api_create_run_json(body: RunCreateRequest) -> RunSummary:
    """JSON-only run creation (no file upload)."""
    run_id = new_run_id()
    params = body.model_dump()
    params["label"] = body.label or f"Experiment {run_id}"
    params["seed_from_baseline"] = derive_seed_from_baseline(params)
    insert_run(run_id, params)
    ensure_run_tree(run_id)
    _start_run_worker(run_id, params)
    row = get_run(run_id)
    return _to_summary(row)  # type: ignore[arg-type]


@app.get("/api/runs/{run_id}/status")
def api_run_status(run_id: str) -> dict[str, Any]:
    row = get_run(run_id)
    if not row:
        raise HTTPException(404, "Run not found")
    log_tail = ""
    log_dir = Path(__file__).resolve().parent / "runs" / run_id / "logs" / "pipeline"
    if log_dir.is_dir():
        logs = sorted(log_dir.glob("*.log"), key=lambda p: p.stat().st_mtime, reverse=True)
        if logs:
            text = logs[0].read_text(encoding="utf-8", errors="replace")
            log_tail = text[-3000:]
    return {
        "id": run_id,
        "status": row["status"],
        "current_step": row.get("current_step"),
        "error_message": row.get("error_message"),
        "log_tail": log_tail,
    }


@app.get("/api/runs/{run_id}/artifacts/{artifact_path:path}")
def api_serve_artifact(run_id: str, artifact_path: str) -> FileResponse:
    resolved = resolve_artifact_path(run_id, artifact_path)
    if not resolved:
        raise HTTPException(404, "Artifact not found")
    media = "application/octet-stream"
    lower = artifact_path.lower()
    if lower.endswith(".json"):
        media = "application/json"
    elif lower.endswith(".csv"):
        media = "text/csv"
    elif lower.endswith(".png"):
        media = "image/png"
    elif lower.endswith((".jpg", ".jpeg")):
        media = "image/jpeg"
    elif lower.endswith(".html"):
        media = "text/html"
    elif lower.endswith(".txt"):
        media = "text/plain"
    return FileResponse(resolved, media_type=media)


@app.post("/api/datasets/upload")
async def api_upload_dataset(
    run_id: str,
    file: UploadFile = File(...),
) -> dict[str, str]:
    """Store upload under runs/{run_id}/raw/ (CSV or ZIP)."""
    if _uploads_disabled():
        raise HTTPException(403, "File uploads are disabled on this server")
    row = get_run(run_id)
    if not row:
        raise HTTPException(404, "Run not found")
    if row["id"] == THESIS_FINAL_ID:
        raise HTTPException(400, "Cannot upload to immutable thesis-final run")
    content = await file.read()
    dest = store_upload_file(run_id, file.filename or "upload.csv", content)
    return {"run_id": run_id, "stored": dest.name}
