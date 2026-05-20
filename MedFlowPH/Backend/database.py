"""SQLite metadata for workbench runs."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

from config import RUNS_DIR, THESIS_FINAL_ID

DB_PATH = RUNS_DIR / "workbench.db"
_initialized = False


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    global _initialized
    if _initialized:
        return
    RUNS_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS runs (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                params_json TEXT NOT NULL,
                current_step TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                error_message TEXT,
                summary_json TEXT
            )
            """
        )
        conn.commit()
    finally:
        conn.close()
    ensure_thesis_final()
    _initialized = True


def ensure_thesis_final() -> None:
    conn = sqlite3.connect(DB_PATH)
    try:
        row = conn.execute(
            "SELECT id FROM runs WHERE id = ?", (THESIS_FINAL_ID,)
        ).fetchone()
        if row:
            return
        now = _utc_now()
        params = {
            "label": "Thesis final (frozen baseline)",
            "immutable": True,
            "artifact_mode": "static_public",
        }
        summary = {
            "chosen_k": 6,
            "silhouette": 0.3863723589529021,
            "note": "Bundled Frontend/public artifacts",
        }
        conn.execute(
            """
            INSERT INTO runs (id, status, params_json, current_step, created_at, updated_at, error_message, summary_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                THESIS_FINAL_ID,
                "completed",
                json.dumps(params),
                None,
                now,
                now,
                None,
                json.dumps(summary),
            ),
        )
        conn.commit()
    finally:
        conn.close()


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    init_db()  # idempotent
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def list_runs() -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM runs ORDER BY created_at DESC"
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_run(run_id: str) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM runs WHERE id = ?", (run_id,)).fetchone()
    return _row_to_dict(row) if row else None


def insert_run(run_id: str, params: dict[str, Any]) -> dict[str, Any]:
    now = _utc_now()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO runs (id, status, params_json, current_step, created_at, updated_at, error_message, summary_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (run_id, "queued", json.dumps(params), None, now, now, None, None),
        )
        conn.commit()
    return get_run(run_id)  # type: ignore[return-value]


def update_run(run_id: str, **fields: Any) -> None:
    allowed = {"status", "current_step", "error_message", "summary_json", "params_json"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return
    updates["updated_at"] = _utc_now()
    if "summary_json" in updates and isinstance(updates["summary_json"], dict):
        updates["summary_json"] = json.dumps(updates["summary_json"])
    if "params_json" in updates and isinstance(updates["params_json"], dict):
        updates["params_json"] = json.dumps(updates["params_json"])
    cols = ", ".join(f"{k} = ?" for k in updates)
    vals = list(updates.values()) + [run_id]
    with connect() as conn:
        conn.execute(f"UPDATE runs SET {cols} WHERE id = ?", vals)
        conn.commit()


def _row_to_dict(row: sqlite3.Row | None) -> dict[str, Any]:
    if row is None:
        raise ValueError("row is None")
    d = dict(row)
    for key in ("params_json", "summary_json"):
        raw = d.get(key)
        if raw:
            try:
                d[key] = json.loads(raw)
            except json.JSONDecodeError:
                pass
    return d
