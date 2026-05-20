"""Subprocess orchestration for PhilGEPS pipeline steps."""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import uuid
import zipfile
from pathlib import Path
from typing import Any

from config import MEDFLOW_PH, SCRIPTS_DIR
from database import update_run

PYTHON = sys.executable

# Default DBSCAN grids (philgeps_dbscan_common.py)
EPS_GRID_DEFAULT = (
    0.02, 0.03, 0.05, 0.07, 0.1, 0.12, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5,
)
MIN_SAMPLES_GRID_DEFAULT = (5, 10, 20, 30, 50, 100)

PHILGEPS_YEARS = tuple(str(y) for y in range(2020, 2026))

# Required after seeding steps 01–03 (K-selection + K-means / DBSCAN).
REQUIRED_BASELINE_CLUSTERING = (
    "output_source/03/Clustering/philgeps_clustering_features.csv",
    "output_source/03/Clustering/philgeps_clustering_pc_scores.csv",
    "results/03/Clustering/pca_theme_clustering.json",
)


def run_root(run_id: str) -> Path:
    return MEDFLOW_PH / "runs" / run_id


def ensure_run_tree(run_id: str) -> Path:
    root = run_root(run_id)
    for sub in ("raw_datasets", "raw", "output_source", "results", "logs"):
        (root / sub).mkdir(parents=True, exist_ok=True)
    (root / "logs" / "pipeline").mkdir(parents=True, exist_ok=True)
    return root


def bundled_raw_exists() -> bool:
    return (MEDFLOW_PH / "raw_datasets" / "PhilGEPS").is_dir()


def derive_seed_from_baseline(params: dict[str, Any]) -> bool:
    """Seed steps 01–03 from thesis baseline when no raw PhilGEPS tree is available."""
    if params.get("pipeline_mode") == "quick":
        return True
    if params.get("has_upload"):
        return False
    if params.get("use_bundled_dataset", True) and bundled_raw_exists():
        return False
    return True


def _philgeps_year_from_dirname(name: str) -> str | None:
    if name in PHILGEPS_YEARS:
        return name
    match = re.match(r"^PhilGEPS\((20[2-5][0-9])\)$", name, re.IGNORECASE)
    if match and match.group(1) in PHILGEPS_YEARS:
        return match.group(1)
    return None


def normalize_philgeps_upload(extract_dir: Path) -> None:
    """Flatten common ZIP layouts to raw_datasets/PhilGEPS/{2020..2025}/."""
    if not extract_dir.is_dir():
        return

    raw_data = extract_dir / "raw_data"
    if raw_data.is_dir():
        nested_phil = raw_data / "PhilGEPS"
        hoist_from = nested_phil if nested_phil.is_dir() else raw_data
        for child in list(hoist_from.iterdir()):
            dest = extract_dir / child.name
            if dest.exists() and dest.is_dir() and child.is_dir():
                shutil.copytree(child, dest, dirs_exist_ok=True)
                shutil.rmtree(child)
            elif not dest.exists():
                shutil.move(str(child), str(dest))
        shutil.rmtree(raw_data, ignore_errors=True)

    for item in list(extract_dir.iterdir()):
        if not item.is_dir():
            continue
        year = _philgeps_year_from_dirname(item.name)
        if not year or item.name == year:
            continue
        dest = extract_dir / year
        if dest.exists():
            shutil.copytree(item, dest, dirs_exist_ok=True)
            shutil.rmtree(item)
        else:
            item.rename(dest)


def copy_baseline_results(run_id: str, steps: tuple[str, ...] = ("03",)) -> None:
    """Copy baseline results/{step}/ trees into the run workspace."""
    root = ensure_run_tree(run_id)
    for step in steps:
        rel = f"results/{step}"
        src = MEDFLOW_PH / rel
        if not src.is_dir():
            continue
        dst = root / rel
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)


def assert_baseline_clustering_artifacts(run_id: str) -> None:
    root = run_root(run_id)
    missing = [rel for rel in REQUIRED_BASELINE_CLUSTERING if not (root / rel).is_file()]
    if missing:
        raise RuntimeError(
            "Baseline clustering artifacts incomplete after seeding. Missing:\n"
            + "\n".join(f"  - {m}" for m in missing)
            + f"\nEnsure thesis baseline exists under {MEDFLOW_PH}."
        )


def copy_baseline_outputs(run_id: str, through_step: str = "03") -> None:
    """Copy baseline output_source and results trees into the run workspace."""
    root = ensure_run_tree(run_id)
    folders = ["01", "02", "03"]
    if through_step == "02":
        folders = ["01", "02"]
    elif through_step == "01":
        folders = ["01"]
    for step in folders:
        rel = f"output_source/{step}"
        src = MEDFLOW_PH / rel
        dst = root / rel
        if not src.exists():
            continue
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    if through_step == "03":
        copy_baseline_results(run_id, steps=("03",))
        assert_baseline_clustering_artifacts(run_id)


def setup_bundled_dataset(run_id: str) -> None:
    """Stage bundled PhilGEPS data: raw tree when present, else cleaned outputs for steps 01–03."""
    root = ensure_run_tree(run_id)
    raw_src = MEDFLOW_PH / "raw_datasets" / "PhilGEPS"
    raw_dst = root / "raw_datasets" / "PhilGEPS"
    if raw_src.is_dir():
        raw_dst.parent.mkdir(parents=True, exist_ok=True)
        if raw_dst.exists():
            shutil.rmtree(raw_dst)
        shutil.copytree(raw_src, raw_dst)
        return
    copy_baseline_outputs(run_id, through_step="03")


def store_upload_file(run_id: str, filename: str, content: bytes) -> Path:
    root = ensure_run_tree(run_id)
    safe_name = Path(filename).name
    dest = root / "raw" / safe_name
    dest.write_bytes(content)
    if safe_name.lower().endswith(".zip"):
        extract_dir = root / "raw_datasets" / "PhilGEPS"
        extract_dir.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(dest) as zf:
            zf.extractall(extract_dir)
        normalize_philgeps_upload(extract_dir)
    return dest


def resolve_pipeline_steps(params: dict[str, Any]) -> list[str]:
    explicit = params.get("steps")
    if explicit:
        return list(explicit)

    mode = params.get("pipeline_mode", "full")
    if mode == "quick":
        return ["kselection"]

    steps: list[str] = []
    seed = derive_seed_from_baseline(params)
    has_upload = bool(params.get("has_upload"))
    use_bundled = bool(params.get("use_bundled_dataset", True))
    enable_pca = bool(params.get("enable_pca", True))

    # True end-to-end only when raw data exists and we are not seeding prior steps.
    if not seed and (has_upload or bundled_raw_exists()):
        steps.append("cleaning")
        if enable_pca:
            steps.extend(["preprocessing", "pca"])
    elif not (seed and use_bundled) and enable_pca:
        steps.extend(["preprocessing", "pca"])

    steps.append("kselection")

    if params.get("enable_kmeans", True):
        steps.append("kmeans")

    if params.get("enable_dbscan"):
        steps.extend(["dbscan_eval", "dbscan"])

    if params.get("enable_dbscan") and params.get("enable_kmeans", True):
        steps.append("comparison")
    elif params.get("enable_comparison"):
        steps.append("comparison")

    seen: set[str] = set()
    ordered: list[str] = []
    for s in steps:
        if s not in seen:
            seen.add(s)
            ordered.append(s)
    return ordered


def prepare_run_workspace(run_id: str, params: dict[str, Any]) -> None:
    use_bundled = bool(params.get("use_bundled_dataset", True))
    seed = derive_seed_from_baseline(params)
    params["seed_from_baseline"] = seed
    mode = params.get("pipeline_mode", "full")

    if use_bundled:
        setup_bundled_dataset(run_id)

    if seed:
        copy_baseline_outputs(run_id, through_step="03")

    if mode == "full" and not seed and not use_bundled and not params.get("has_upload"):
        if not bundled_raw_exists():
            raise RuntimeError(
                "No raw PhilGEPS data found. Upload a CSV/ZIP or enable bundled dataset / seed baseline."
            )


def _script_env(run_id: str) -> dict[str, str]:
    env = os.environ.copy()
    env["MEDFLOW_ROOT"] = str(run_root(run_id).resolve())
    env["PYTHONPATH"] = str(SCRIPTS_DIR.resolve())
    return env


def _run_script(
    run_id: str,
    script_name: str,
    extra_args: list[str] | None = None,
    log_name: str | None = None,
) -> None:
    script = SCRIPTS_DIR / script_name
    if not script.is_file():
        raise FileNotFoundError(script)
    log_file = run_root(run_id) / "logs" / "pipeline" / (log_name or script_name.replace(".py", ".log"))
    log_file.parent.mkdir(parents=True, exist_ok=True)
    cmd = [PYTHON, str(script), *(extra_args or [])]
    with log_file.open("w", encoding="utf-8") as log_fp:
        proc = subprocess.run(
            cmd,
            cwd=str(SCRIPTS_DIR),
            env=_script_env(run_id),
            stdout=log_fp,
            stderr=subprocess.STDOUT,
            check=False,
        )
    if proc.returncode != 0:
        tail = log_file.read_text(encoding="utf-8", errors="replace")[-4000:]
        raise RuntimeError(
            f"{script_name} failed (exit {proc.returncode}). Log tail:\n{tail}"
        )


def _read_json(path: Path) -> dict[str, Any] | None:
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def _collect_run_summary(run_id: str) -> dict[str, Any]:
    root = run_root(run_id)
    summary: dict[str, Any] = {}

    k_summary = _read_json(
        root / "output_source" / "05" / "KSelection" / "k_selection_summary.json",
    )
    if k_summary:
        chosen = k_summary.get("chosen_k")
        metrics = k_summary.get("metrics_per_k") or []
        sil = None
        for row in metrics:
            if int(row.get("k", -1)) == int(chosen):
                sil = row.get("silhouette")
                break
        summary["chosen_k"] = chosen
        summary["silhouette"] = sil

    db_summary = _read_json(
        root / "output_source" / "05B" / "DBSCAN_Evaluation" / "dbscan_selection_summary.json",
    )
    if db_summary:
        best = db_summary.get("best_metrics") or {}
        summary["dbscan_noise_share"] = best.get("noise_share")
        summary["dbscan_eps"] = db_summary.get("chosen_eps")
        summary["dbscan_min_samples"] = db_summary.get("chosen_min_samples")

    return summary


def _dbscan_eval_args(params: dict[str, Any]) -> list[str]:
    eps = params.get("dbscan_eps")
    ms = params.get("dbscan_min_samples")
    args: list[str] = []
    if eps is not None:
        args.extend(["--eps-grid", str(eps)])
    else:
        args.extend(["--eps-grid", ",".join(str(x) for x in EPS_GRID_DEFAULT)])
    if ms is not None:
        args.extend(["--min-samples-grid", str(ms)])
    else:
        args.extend(["--min-samples-grid", ",".join(str(x) for x in MIN_SAMPLES_GRID_DEFAULT)])
    subsample = int(params.get("metrics_subsample", 80_000))
    args.extend(["--metrics-subsample", str(subsample)])
    return args


def _dbscan_fit_args(params: dict[str, Any]) -> list[str]:
    args: list[str] = []
    if params.get("dbscan_eps") is not None:
        args.extend(["--eps", str(params["dbscan_eps"])])
    if params.get("dbscan_min_samples") is not None:
        args.extend(["--min-samples", str(params["dbscan_min_samples"])])
    return args


def execute_run(run_id: str, params: dict[str, Any]) -> None:
    """Run pipeline steps sequentially in a background worker thread."""
    try:
        update_run(run_id, status="running", current_step="prepare")
        ensure_run_tree(run_id)
        prepare_run_workspace(run_id, params)

        steps = resolve_pipeline_steps(params)
        k_min = int(params.get("k_min", 2))
        k_max = int(params.get("k_max", 7))
        metrics_subsample = int(params.get("metrics_subsample", 80_000))
        pca_matrix = str(params.get("pca_matrix", "base"))

        step_scripts: dict[str, tuple[str, list[str]]] = {
            "cleaning": ("01_data_cleaning_philgeps.py", []),
            "preprocessing": ("02_data_preprocessing_philgeps.py", []),
            "pca": ("03_PCA_Dimensionality_philgeps.py", ["--matrix", pca_matrix]),
            "kselection": (
                "05_evaluating_kmeans_philgeps.py",
                [
                    "--k-min",
                    str(k_min),
                    "--k-max",
                    str(k_max),
                    "--metrics-subsample",
                    str(metrics_subsample),
                ],
            ),
            "kmeans": ("04_kmeans_implementation_philgeps.py", []),
            "dbscan_eval": ("05b_evaluating_dbscan_philgeps.py", _dbscan_eval_args(params)),
            "dbscan": ("04b_dbscan_implementation_philgeps.py", _dbscan_fit_args(params)),
            "comparison": ("07_compare_kmeans_dbscan_philgeps.py", []),
        }

        for step in steps:
            if step not in step_scripts:
                raise ValueError(f"Unknown step: {step}")
            if step in ("dbscan_eval", "dbscan") and not params.get("enable_dbscan"):
                continue
            if step == "kmeans" and not params.get("enable_kmeans", True):
                continue
            if step == "pca" and not params.get("enable_pca", True):
                continue

            update_run(run_id, current_step=step)
            script, args = step_scripts[step]
            _run_script(run_id, script, args, log_name=f"{step}.log")

        update_run(
            run_id,
            status="completed",
            current_step=None,
            summary_json=_collect_run_summary(run_id),
        )
    except Exception as exc:  # noqa: BLE001
        update_run(
            run_id,
            status="failed",
            current_step=None,
            error_message=str(exc),
        )


def new_run_id() -> str:
    return uuid.uuid4().hex[:12]
