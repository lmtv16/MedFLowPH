"""
Step 04B — DBSCAN on PhilGEPS PCA scores (PC1, PC2, PC3).

Uses the same PC matrix as K-means (step 03). Default ``eps`` and ``min_samples`` come from
``output_source/05B/DBSCAN_Evaluation/dbscan_selection_summary.json`` when present; otherwise
``eps=0.15`` and ``min_samples=20``. CLI flags override individual values.

Outputs:
    output_source/04B/DBSCAN/philgeps_dbscan_assignments.csv
    output_source/04B/Backtrack/philgeps_dbscan_backtrack.csv
    output_source/04B/per_cluster/dbscan_cluster_<id>.csv and dbscan_noise.csv
    results/04B/Summaries/dbscan_cluster_counts.json, dbscan_implementation_readme.txt
    results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png
    logs/04B/...

Run after ``05b_evaluating_dbscan_philgeps.py`` for tuned defaults (order in docs may run 05B first).

Usage:
    python 04b_dbscan_implementation_philgeps.py
    python 04b_dbscan_implementation_philgeps.py --eps 0.2 --min-samples 30
    python 04b_dbscan_implementation_philgeps.py --metric cosine
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from datetime import datetime
from typing import Any

import matplotlib

matplotlib.use("Agg")
import numpy as np
import pandas as pd

from philgeps_kmeans_common import (
    OUT_CLUSTER_PC_CSV,
    PATH_SCALED_CSV,
    PC3D_MAX_POINTS_DEFAULT,
    PC3D_PLOT_JITTER_FRAC_DEFAULT,
    load_backtrack_frame,
    load_pca_ratios3,
)
from philgeps_dbscan_common import (
    DBSCAN_NOISE_LABEL,
    OUT_04B_ASSIGNMENTS_CSV,
    OUT_04B_BACKTRACK_CSV,
    OUT_04B_CLUSTER_COUNTS_JSON,
    OUT_04B_NUMERIC_PNG,
    OUT_04B_README,
    PATH_LOG_ENTRIES_04B,
    PATH_LOG_TERMINAL_04B,
    PATH_LOGS_04B,
    PATH_OUT_04B_BACKTRACK,
    PATH_OUT_04B_DBSCAN,
    PATH_OUT_04B_PER_CLUSTER,
    PATH_RES_04B_PCA_CLUSTER,
    PATH_RES_04B_SUMMARIES,
    dbscan_fit_predict,
    dbscan_row_stats,
    ensure_dirs,
    ensure_log_tree,
    load_pc_scores,
    open_activity_log,
    resolve_eps_min_samples_defaults,
    save_labeled_pc_scatter_3d_dbscan,
    tee_stdio_to_file,
)


def _ensure_tree() -> None:
    ensure_dirs(
        PATH_OUT_04B_DBSCAN,
        PATH_OUT_04B_BACKTRACK,
        PATH_OUT_04B_PER_CLUSTER,
        PATH_RES_04B_PCA_CLUSTER,
        PATH_RES_04B_SUMMARIES,
    )
    ensure_log_tree(PATH_LOGS_04B)


def _write_readme(
    *,
    eps: float,
    min_samples: int,
    metric: str,
    n: int,
    jitter: float,
    max_points: int,
    param_source: str,
) -> None:
    body = f"""PhilGEPS step 04B — DBSCAN on PCA PC1–PC3

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv
  output_source/02/Min-Max Scaling/philgeps_min_max_scaled.csv (theme + base columns for backtrack)
  output_source/05B/DBSCAN_Evaluation/dbscan_selection_summary.json (optional; eps / min_samples)

Parameters (this run):
  eps = {eps}; min_samples = {min_samples}; metric = {metric}
  Source for defaults: {param_source}

Process:
  sklearn.cluster.DBSCAN on the full PC matrix (n={n:,}). Noise remains cluster_id = -1.
  Row order matches step 03 (RangeIndex = row_index).

Outputs:
  output_source/04B/DBSCAN/philgeps_dbscan_assignments.csv
      row_index, cluster_id, is_noise, PC1, PC2, PC3
  output_source/04B/Backtrack/philgeps_dbscan_backtrack.csv
      row_index, cluster_id, is_noise, PC1..PC3, POLICY_THEME_SCORE_COLUMNS, POLICY_PCA_BASE_COLUMNS (if present in scaled CSV)
  output_source/04B/per_cluster/dbscan_cluster_<id>.csv — dense clusters only
  output_source/04B/per_cluster/dbscan_noise.csv — noise (-1)
  results/04B/Summaries/dbscan_cluster_counts.json
  results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png

Next:
  python 06b_dbscan_interpretation_philgeps.py  (semantic PCA PNG + theme profiles)
"""
    with open(OUT_04B_README, "w", encoding="utf-8", newline="\n") as f:
        f.write(body.strip() + "\n")


def _write_per_cluster(df_bt: pd.DataFrame, *, log: Any) -> dict[int, str]:
    paths: dict[int, str] = {}
    for cid, sub in df_bt.groupby("cluster_id", sort=True):
        cid_i = int(cid)
        if cid_i == DBSCAN_NOISE_LABEL:
            out = os.path.join(PATH_OUT_04B_PER_CLUSTER, "dbscan_noise.csv")
        else:
            out = os.path.join(PATH_OUT_04B_PER_CLUSTER, f"dbscan_cluster_{cid_i}.csv")
        sub.to_csv(out, index=False)
        paths[cid_i] = out
        log(f"Wrote per-cluster CSV cluster_id={cid_i} (rows={len(sub):,}) -> {out}")
    return paths


def run_step04b(
    *,
    eps: float | None,
    min_samples: int | None,
    metric: str,
    pc3d_max_points: int,
    pc3d_plot_jitter_frac: float,
) -> None:
    _ensure_tree()
    activity_path = os.path.join(
        PATH_LOG_ENTRIES_04B, "04b_dbscan_implementation_philgeps_activity.txt",
    )
    log = open_activity_log(activity_path)

    eff_eps, eff_ms, src = resolve_eps_min_samples_defaults(
        eps_cli=eps,
        min_samples_cli=min_samples,
    )
    log(f"DBSCAN params: eps={eff_eps}, min_samples={eff_ms}, metric={metric} (source={src})")

    X = load_pc_scores()
    n = int(X.shape[0])
    log(f"PC scores shape={X.shape}")

    labels = dbscan_fit_predict(
        X, eps=eff_eps, min_samples=eff_ms, metric=metric, n_jobs=-1,
    )
    labels = np.asarray(labels, dtype=np.int64)
    is_noise = labels == DBSCAN_NOISE_LABEL

    stats = dbscan_row_stats(labels, n_total=n)
    counts = pd.Series(labels).value_counts().sort_index()
    log(
        "Cluster sizes: "
        + ", ".join(f"{int(c)}={int(v)}" for c, v in counts.items()),
    )

    df_assign = pd.DataFrame({
        "row_index": np.arange(n, dtype=np.int64),
        "cluster_id": labels,
        "is_noise": is_noise,
        "PC1": X[:, 0],
        "PC2": X[:, 1],
        "PC3": X[:, 2],
    })
    df_assign.to_csv(OUT_04B_ASSIGNMENTS_CSV, index=False)
    log(f"Wrote assignments -> {OUT_04B_ASSIGNMENTS_CSV}")

    df_back = load_backtrack_frame()
    if len(df_back) != n:
        msg = (
            f"Row count mismatch: scaled CSV has {len(df_back):,} rows but PC scores have {n:,}."
        )
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    df_back = df_back.reset_index(drop=True)
    df_back.insert(0, "row_index", np.arange(n, dtype=np.int64))
    df_back.insert(1, "cluster_id", labels)
    df_back.insert(2, "is_noise", is_noise)
    df_back.insert(3, "PC1", X[:, 0])
    df_back.insert(4, "PC2", X[:, 1])
    df_back.insert(5, "PC3", X[:, 2])
    df_back.to_csv(OUT_04B_BACKTRACK_CSV, index=False)
    log(f"Wrote backtrack -> {OUT_04B_BACKTRACK_CSV}")

    per_paths = _write_per_cluster(df_back, log=log)

    ratios3 = load_pca_ratios3()
    save_labeled_pc_scatter_3d_dbscan(
        X,
        labels,
        OUT_04B_NUMERIC_PNG,
        ratios3=ratios3,
        title_suffix=f"eps={eff_eps}; min_samples={eff_ms}; {metric}",
        max_points=pc3d_max_points,
        plot_jitter_frac=pc3d_plot_jitter_frac,
    )
    log(f"Wrote numeric 3D DBSCAN PCA -> {OUT_04B_NUMERIC_PNG}")

    cluster_counts = {str(int(c)): int(v) for c, v in counts.items()}
    cluster_share = {str(int(c)): float(v) / float(n) for c, v in counts.items()}
    ts = datetime.now().isoformat(timespec="seconds")
    payload: dict[str, Any] = {
        "eps": float(eff_eps),
        "min_samples": int(eff_ms),
        "metric": metric,
        "n_total": n,
        "n_clusters_excluding_noise": int(stats["n_clusters_excluding_noise"]),
        "n_noise": int(stats["n_noise"]),
        "noise_share": float(stats["noise_share"]),
        "cluster_counts": cluster_counts,
        "cluster_share": cluster_share,
        "timestamp": ts,
        "param_source": src,
        "input_paths": {
            "pc_scores_csv": OUT_CLUSTER_PC_CSV,
            "min_max_scaled_csv": PATH_SCALED_CSV,
        },
        "output_paths": {
            "assignments_csv": OUT_04B_ASSIGNMENTS_CSV,
            "backtrack_csv": OUT_04B_BACKTRACK_CSV,
            "per_cluster_dir": PATH_OUT_04B_PER_CLUSTER,
            "per_cluster_csvs": {str(k): v for k, v in per_paths.items()},
            "cluster_counts_json": OUT_04B_CLUSTER_COUNTS_JSON,
            "numeric_3d_png": OUT_04B_NUMERIC_PNG,
        },
    }

    with open(OUT_04B_CLUSTER_COUNTS_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, indent=2)
    log(f"Wrote cluster counts JSON -> {OUT_04B_CLUSTER_COUNTS_JSON}")

    _write_readme(
        eps=float(eff_eps),
        min_samples=int(eff_ms),
        metric=metric,
        n=n,
        jitter=float(pc3d_plot_jitter_frac),
        max_points=int(pc3d_max_points),
        param_source=src,
    )

    print(
        "PhilGEPS step 04B done. "
        f"eps={eff_eps}; min_samples={eff_ms}; assignments: {OUT_04B_ASSIGNMENTS_CSV}; "
        f"backtrack: {OUT_04B_BACKTRACK_CSV}; per_cluster: {PATH_OUT_04B_PER_CLUSTER}; "
        f"summaries: {PATH_RES_04B_SUMMARIES}; logs: {PATH_LOGS_04B}. "
        "Run 06b_dbscan_interpretation_philgeps.py next.",
        flush=True,
    )
    log("Step 04B complete")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PhilGEPS step 04B — DBSCAN fit on PC1–PC3.",
    )
    parser.add_argument("--eps", type=float, default=None, help="Override eps (optional).")
    parser.add_argument("--min-samples", type=int, default=None, help="Override min_samples (optional).")
    parser.add_argument("--metric", type=str, default="euclidean", help="DBSCAN distance metric.")
    parser.add_argument(
        "--pc3d-max-points",
        type=int,
        default=PC3D_MAX_POINTS_DEFAULT,
        help=f"Max points in 3D plot (0 = all; default {PC3D_MAX_POINTS_DEFAULT}).",
    )
    parser.add_argument(
        "--pc3d-plot-jitter-frac",
        type=float,
        default=PC3D_PLOT_JITTER_FRAC_DEFAULT,
        help="Gaussian jitter for plotting only.",
    )
    args = parser.parse_args()
    jf = float(args.pc3d_plot_jitter_frac)
    if not math.isfinite(jf) or jf < 0.0:
        print("--pc3d-plot-jitter-frac must be finite and >= 0.", file=sys.stderr)
        sys.exit(2)

    _ensure_tree()
    term_log = os.path.join(
        PATH_LOG_TERMINAL_04B, "04b_dbscan_implementation_philgeps_terminal.txt",
    )
    with tee_stdio_to_file(term_log):
        run_step04b(
            eps=args.eps,
            min_samples=args.min_samples,
            metric=str(args.metric),
            pc3d_max_points=int(args.pc3d_max_points),
            pc3d_plot_jitter_frac=jf,
        )


if __name__ == "__main__":
    main()
