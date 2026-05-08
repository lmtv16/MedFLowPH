"""
Step 05B — DBSCAN hyperparameter search on PhilGEPS PCA scores (PC1, PC2, PC3).

Grid-search ``eps`` × ``min_samples`` on a deterministic subsample (default 80k rows;
``RANDOM_SEED=42``). For each combination we record cluster counts, noise share, largest-cluster
share, and internal metrics **excluding** DBSCAN noise (-1). A composite score plus validity rules
select defaults for ``04b_dbscan_implementation_philgeps.py``.

Outputs:
    output_source/05B/DBSCAN_Evaluation/
        dbscan_metrics_grid.csv
        dbscan_selection_summary.json
        dbscan_evaluation_readme.txt
    results/05B/DBSCAN_Evaluation/
        dbscan_*_heatmap.png (silhouette, davies_bouldin, noise_share, n_clusters, composite)
        combined_silhouette_db_ch_composite_vs_grid.png — normalized metric overlay (cf. step 05)
    results/05B/EDA/
        dbscan_cluster_sizes_best_params.png
        metric_rank_heatmap.png — grid rank per metric (cf. step 05)
    logs/05B/...

Run after step 03. Recommended before step 04B so the implementation script can read
``dbscan_selection_summary.json``.

Usage:
    python 05b_evaluating_dbscan_philgeps.py
    python 05b_evaluating_dbscan_philgeps.py --eps-grid "0.1,0.15,0.2" --min-samples-grid "10,20"
    python 05b_evaluating_dbscan_philgeps.py --metrics-on-full
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
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

from philgeps_kmeans_common import (
    RANDOM_SEED,
    load_pc_scores,
    open_activity_log,
    scatter_subsample_row_indices,
    tee_stdio_to_file,
)
from philgeps_dbscan_common import (
    METRICS_SUBSAMPLE_DEFAULT_DBSCAN,
    EPS_GRID_DEFAULT,
    MIN_SAMPLES_GRID_DEFAULT,
    OUT_05B_METRICS_GRID_CSV,
    OUT_05B_README,
    OUT_05B_SELECTION_SUMMARY_JSON,
    PATH_LOG_ENTRIES_05B,
    PATH_LOG_TERMINAL_05B,
    PATH_LOGS_05B,
    PATH_OUT_05B_EVAL,
    PATH_RES_05B_EDA,
    PATH_RES_05B_EVAL,
    add_dbscan_composite,
    dbscan_fit_predict,
    ensure_dirs,
    ensure_log_tree,
    evaluate_dbscan_params,
    mark_valid_dbscan_candidates,
    pick_dbscan_params,
)


def _parse_float_csv(s: str) -> list[float]:
    return [float(x.strip()) for x in s.split(",") if x.strip()]


def _parse_int_csv(s: str) -> list[int]:
    return [int(float(x.strip())) for x in s.split(",") if x.strip()]


def _jsonable_row(row: pd.Series) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for col in row.index:
        v = row[col]
        if pd.isna(v):
            out[col] = None
        elif isinstance(v, (np.integer,)):
            out[col] = int(v)
        elif isinstance(v, (np.floating, float)):
            out[col] = None if not np.isfinite(v) else float(v)
        elif isinstance(v, (bool, np.bool_)):
            out[col] = bool(v)
        else:
            out[col] = v
    return out


def _minmax_goodness_series(s: pd.Series, *, higher_is_better: bool) -> np.ndarray:
    """Map metric values across the grid to [0, 1] where 1 = best row for that metric."""
    v = np.asarray(s.to_numpy(dtype=np.float64), dtype=np.float64)
    mask = np.isfinite(v)
    if not np.any(mask):
        return np.zeros_like(v)
    lo = float(np.nanmin(v))
    hi = float(np.nanmax(v))
    if not math.isfinite(lo) or not math.isfinite(hi) or hi <= lo:
        out = np.zeros_like(v)
        out[mask] = 0.5
        return out
    if higher_is_better:
        scaled = (v - lo) / (hi - lo)
    else:
        scaled = (hi - v) / (hi - lo)
    return np.clip(np.where(mask, scaled, np.nan), 0.0, 1.0)


def _dbscan_grid_sorted(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df
    return df.sort_values(["eps", "min_samples"], kind="mergesort").reset_index(drop=True)


def _dbscan_grid_row_labels(df: pd.DataFrame) -> list[str]:
    out: list[str] = []
    for _, row in df.iterrows():
        e = float(row["eps"])
        m = int(row["min_samples"])
        out.append(f"ε={e:g}\nms={m}")
    return out


def _dbscan_combined_metrics_overlay(
    df: pd.DataFrame,
    *,
    out_path: str,
    chosen_eps: float,
    chosen_ms: int,
    method: str,
    log: Any,
) -> None:
    """Overlay silhouette, DB (inverted), CH, composite on [0,1] goodness scale (cf. step 05)."""
    if df.empty:
        return
    d = _dbscan_grid_sorted(df)
    n = len(d)
    x = np.arange(n, dtype=np.float64)
    y_sil = _minmax_goodness_series(d["silhouette"], higher_is_better=True)
    y_db = _minmax_goodness_series(d["davies_bouldin"], higher_is_better=False)
    y_ch = _minmax_goodness_series(d["calinski_harabasz"], higher_is_better=True)
    y_comp = _minmax_goodness_series(d["composite"], higher_is_better=True)

    fig_w = max(9.0, 0.38 * n + 5.5)
    fig, ax = plt.subplots(figsize=(fig_w, 5.4))
    ax.plot(x, y_sil, "o-", color="#1f77b4", label="Silhouette (norm., ↑ better)", linewidth=2)
    ax.plot(x, y_db, "s-", color="#ff7f0e", label="Davies–Bouldin (inv. norm., ↑ better)", linewidth=2)
    ax.plot(x, y_ch, "^-", color="#2ca02c", label="Calinski–Harabasz (norm., ↑ better)", linewidth=2)
    ax.plot(x, y_comp, "D-", color="#9467bd", label="Composite (norm., ↑ better)", linewidth=2)

    match = d.loc[
        (d["eps"] == float(chosen_eps)) & (d["min_samples"] == int(chosen_ms)),
    ]
    if match.empty:
        mask = np.isclose(
            d["eps"].to_numpy(dtype=np.float64),
            float(chosen_eps),
            rtol=0.0,
            atol=1e-9,
        ) & (d["min_samples"].to_numpy(dtype=np.int64) == int(chosen_ms))
        match = d.loc[mask]
    if not match.empty:
        i = int(match.index[0])
        ys_at_star = [float(y_sil[i]), float(y_db[i]), float(y_ch[i]), float(y_comp[i])]
        ys_at_star = [y for y in ys_at_star if math.isfinite(y)]
        y_star = float(max(ys_at_star)) if ys_at_star else 0.5
        y_star_disp = min(1.06, y_star + 0.06)
        ax.scatter(
            [float(i)],
            [y_star_disp],
            marker="*",
            s=520,
            color="gold",
            edgecolors="black",
            linewidths=1.2,
            zorder=10,
            label=(
                f"Chosen ε={float(chosen_eps):g}, min_samples={int(chosen_ms)} ({method})"
            ),
        )

    ax.set_xlabel("grid index (sorted by ε, then min_samples; see metric rank heatmap for labels)")
    ax.set_ylabel("normalized score (0 = worst, 1 = best within grid)")
    ax.set_xticks(x)
    labels = [f"{int(i)}" for i in x]
    ax.set_xticklabels(labels, fontsize=9)
    ax.set_ylim(-0.05, 1.12)
    ax.grid(True, alpha=0.35)
    ax.legend(loc="lower right", fontsize=7.5, framealpha=0.95)
    ax.set_title(
        "DBSCAN metrics overlay (min–max per metric; DB inverted)\n"
        f"★ = chosen parameters ({method}) · ε={float(chosen_eps):g}, min_samples={int(chosen_ms)}",
    )
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"Combined metrics overlay -> {out_path}")


def _eda_dbscan_metric_rank_heatmap(df: pd.DataFrame, *, out_path: str, log: Any) -> None:
    """Rank each (eps, min_samples) row within each metric (1 = best); same metrics as step 05 minus inertia."""
    if df.empty:
        return
    direction = {
        "silhouette": False,
        "davies_bouldin": True,
        "calinski_harabasz": False,
        "composite": False,
    }
    d = _dbscan_grid_sorted(df)
    rank_cols: dict[str, np.ndarray] = {}
    for metric, ascending in direction.items():
        if metric not in d.columns:
            continue
        rank_cols[metric] = d[metric].rank(
            method="min",
            ascending=ascending,
            na_option="bottom",
        ).to_numpy(dtype=int)
    if not rank_cols:
        return
    row_labels = _dbscan_grid_row_labels(d)
    wide = pd.DataFrame(rank_cols, index=row_labels)
    wide.index.name = "grid (ε, min_samples)"
    n_row, n_col = wide.shape[0], wide.shape[1]
    fig_h = max(3.2, 0.42 * n_row + 1.8)
    fig_w = max(5.5, 1.35 * n_col + 2.2)
    fig, ax = plt.subplots(figsize=(fig_w, fig_h))
    sns.heatmap(
        wide,
        ax=ax,
        annot=True,
        fmt="d",
        cmap="YlGnBu_r",
        cbar_kws={"label": "rank (1=best)"},
        linewidths=0.5,
        linecolor="#cccccc",
    )
    ax.set_title("DBSCAN grid rank per metric (1 = best for that metric)")
    ax.set_xlabel("metric")
    plt.setp(ax.get_yticklabels(), rotation=0, fontsize=8 if n_row > 12 else 9)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"EDA: DBSCAN metric rank heatmap -> {out_path}")


def _ensure_tree() -> None:
    ensure_dirs(
        PATH_OUT_05B_EVAL,
        PATH_RES_05B_EVAL,
        PATH_RES_05B_EDA,
    )
    ensure_log_tree(PATH_LOGS_05B)


def _heatmap_pivot(
    df: pd.DataFrame,
    *,
    value: str,
    out_path: str,
    title: str,
    log: Any,
) -> None:
    if df.empty or value not in df.columns:
        return
    p = df.pivot_table(index="eps", columns="min_samples", values=value, aggfunc="first")
    if p.empty:
        return
    p = p.reindex(sorted(p.index.astype(float)), axis=0)
    p = p.reindex(sorted(p.columns.astype(int)), axis=1)
    fig, ax = plt.subplots(figsize=(max(8.0, 0.45 * p.shape[1] + 3), max(5.5, 0.35 * p.shape[0] + 2)))
    fmt = ".3f" if value != "n_clusters_excluding_noise" else ".0f"
    sns.heatmap(
        p,
        ax=ax,
        annot=True,
        fmt=fmt,
        cmap="viridis",
        linewidths=0.4,
        linecolor="#cccccc",
        cbar_kws={"shrink": 0.82},
    )
    ax.set_title(title)
    ax.set_xlabel("min_samples")
    ax.set_ylabel("eps")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"Heatmap {value} -> {out_path}")


def _best_params_bar_chart(
    X: np.ndarray,
    *,
    eps: float,
    min_samples: int,
    metric: str,
    out_path: str,
    log: Any,
) -> None:
    labels = dbscan_fit_predict(
        X, eps=eps, min_samples=min_samples, metric=metric, n_jobs=-1,
    )
    vc = pd.Series(labels).value_counts().sort_index()
    xs = [str(int(i)) for i in vc.index]
    fig, ax = plt.subplots(figsize=(max(7.0, 0.45 * len(vc) + 3), 4.6))
    colors = ["#7f7f7f" if int(i) == -1 else "steelblue" for i in vc.index]
    ax.bar(xs, vc.values, color=colors)
    ax.set_xlabel("cluster_id (-1 = noise)")
    ax.set_ylabel("count (eval subsample)")
    ax.set_title(f"DBSCAN cluster sizes — chosen eps={eps}, min_samples={min_samples} (eval subsample)")
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log(f"EDA bar chart -> {out_path}")


def _write_readme(*, n_sub: int, n_total: int, eps_list: list[float], ms_list: list[int]) -> None:
    body = f"""PhilGEPS step 05B — DBSCAN parameter evaluation (PCA PC1–PC3)

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv

Process:
  DBSCAN uses ``eps`` and ``min_samples`` instead of K.
  * ``eps`` controls the neighborhood radius in the PCA space (Euclidean by default).
  * ``min_samples`` controls how many neighbors are required to form a dense core region.
  * Noise is labeled -1 and is excluded when computing silhouette, Davies–Bouldin, and
    Calinski–Harabasz so those metrics reflect only **assigned** dense clusters.

  Grid (this run): eps in {eps_list}; min_samples in {ms_list}
  Evaluation rows: {n_sub:,} of {n_total:,} (deterministic subsample, seed={RANDOM_SEED}), unless
  ``--metrics-on-full`` was used.

  Valid candidate rule (for primary selection):
    * at least 2 non-noise clusters
    * noise_share <= 0.40
    * largest_cluster_share <= 0.85 (among non-noise points)

  Among valid candidates we maximize:
    composite = z_silhouette + z_calinski_harabasz - z_davies_bouldin - abs(noise_share - 0.10)
  (z-scores are taken across the grid for each metric.)

  If no row passes validity, a fallback pick prefers >=2 clusters with the lowest noise_share.

Plots:
  results/05B/DBSCAN_Evaluation/dbscan_*_heatmap.png — eps × min_samples surfaces
  results/05B/DBSCAN_Evaluation/combined_silhouette_db_ch_composite_vs_grid.png — silhouette, DB (inv.), CH, composite on [0,1] (★ = chosen grid point)
  results/05B/EDA/metric_rank_heatmap.png — rank of each (ε, min_samples) row per metric
  results/05B/EDA/dbscan_cluster_sizes_best_params.png — sizes for the chosen parameters on the eval subsample

Notes:
  DBSCAN identifies density-based groups and outlier procurement records; it may underperform
  K-means on this dataset if the PCA space does not show sharp density separation.
  Metrics on the subsample are reproducible estimates; use ``--metrics-on-full`` only if you
  accept long runtimes on large n.
"""
    with open(OUT_05B_README, "w", encoding="utf-8", newline="\n") as f:
        f.write(body.strip() + "\n")


def run_step05b(
    *,
    eps_grid: list[float],
    min_samples_grid: list[int],
    metrics_subsample: int,
    metrics_on_full: bool,
    metric: str,
) -> None:
    _ensure_tree()
    activity_path = os.path.join(
        PATH_LOG_ENTRIES_05B, "05b_evaluating_dbscan_philgeps_activity.txt",
    )
    log = open_activity_log(activity_path)
    log(
        f"Step 05B — DBSCAN grid: eps count={len(eps_grid)}, min_samples count={len(min_samples_grid)}, "
        f"metrics_subsample={metrics_subsample}, metrics_on_full={metrics_on_full}, metric={metric}",
    )

    X = load_pc_scores()
    n_total = int(X.shape[0])
    log(f"Loaded PC scores: {X.shape}")

    if metrics_on_full or metrics_subsample <= 0 or metrics_subsample >= n_total:
        sub_idx = np.arange(n_total, dtype=np.int64)
    else:
        sub_idx = scatter_subsample_row_indices(
            n_total, max_points=metrics_subsample, seed=RANDOM_SEED,
        )
    X_sub = np.ascontiguousarray(X[sub_idx])
    n_sub = int(X_sub.shape[0])
    log(f"Eval matrix: n_sub={n_sub:,} of n_total={n_total:,}")

    rows: list[dict[str, Any]] = []
    for eps in eps_grid:
        for ms in min_samples_grid:
            row = evaluate_dbscan_params(X_sub, eps=eps, min_samples=ms, metric=metric)
            rows.append(row)
    df = pd.DataFrame.from_records(rows)
    df = add_dbscan_composite(df)
    df = mark_valid_dbscan_candidates(df)
    if "status" in df.columns:
        stale = df["status"].astype(str) == "ok"
        not_ok_metrics = ~(
            np.isfinite(df["silhouette"].to_numpy())
            & np.isfinite(df["davies_bouldin"].to_numpy())
            & np.isfinite(df["calinski_harabasz"].to_numpy())
        )
        df.loc[stale & not_ok_metrics, "status"] = "metrics nan: see n_clusters/noise or sklearn failure"

    df.to_csv(OUT_05B_METRICS_GRID_CSV, index=False)
    log(f"Wrote grid CSV -> {OUT_05B_METRICS_GRID_CSV}")
    print(df.to_string(index=False))

    chosen_eps, chosen_ms, method, fallback, best_row = pick_dbscan_params(df)
    log(
        f"Selected eps={chosen_eps}, min_samples={chosen_ms}, method={method}, fallback={fallback}",
    )

    sel_ts = datetime.now().isoformat(timespec="seconds")
    summary: dict[str, Any] = {
        "chosen_eps": float(chosen_eps),
        "chosen_min_samples": int(chosen_ms),
        "chosen_method": method,
        "fallback_used": bool(fallback),
        "metric_space": str(metric),
        "subsample_rows": int(n_sub),
        "pc_total_rows": int(n_total),
        "metrics_subsample_seed": RANDOM_SEED,
        "timestamp": sel_ts,
    }
    if best_row is not None:
        br = best_row
        summary["best_metrics"] = {
            "eps": float(br["eps"]),
            "min_samples": int(br["min_samples"]),
            "n_clusters_excluding_noise": int(br["n_clusters_excluding_noise"]),
            "n_noise": int(br["n_noise"]),
            "noise_share": float(br["noise_share"]),
            "largest_cluster_share": float(br["largest_cluster_share"]),
            "silhouette": None if pd.isna(br["silhouette"]) else float(br["silhouette"]),
            "davies_bouldin": None if pd.isna(br["davies_bouldin"]) else float(br["davies_bouldin"]),
            "calinski_harabasz": None if pd.isna(br["calinski_harabasz"]) else float(br["calinski_harabasz"]),
            "composite": None if pd.isna(br["composite"]) else float(br["composite"]),
            "valid_candidate": bool(br["valid_candidate"]),
            "status": str(br["status"]),
        }
    summary["grid"] = [_jsonable_row(row) for _, row in df.iterrows()]
    summary["paths"] = {
        "dbscan_metrics_grid_csv": OUT_05B_METRICS_GRID_CSV,
        "dbscan_selection_summary_json": OUT_05B_SELECTION_SUMMARY_JSON,
        "evaluation_plots_dir": PATH_RES_05B_EVAL,
        "eda_dir": PATH_RES_05B_EDA,
        "logs_dir": PATH_LOGS_05B,
    }

    with open(OUT_05B_SELECTION_SUMMARY_JSON, "w", encoding="utf-8", newline="\n") as f:
        json.dump(summary, f, indent=2)
    log(f"Wrote selection summary -> {OUT_05B_SELECTION_SUMMARY_JSON}")

    df_plot = df.copy()
    if "n_clusters_excluding_noise" not in df_plot.columns:
        df_plot["n_clusters_excluding_noise"] = np.nan
    _heatmap_pivot(
        df_plot,
        value="silhouette",
        out_path=os.path.join(PATH_RES_05B_EVAL, "dbscan_silhouette_heatmap.png"),
        title="DBSCAN — silhouette (non-noise only; higher better)",
        log=log,
    )
    _heatmap_pivot(
        df_plot,
        value="davies_bouldin",
        out_path=os.path.join(PATH_RES_05B_EVAL, "dbscan_davies_bouldin_heatmap.png"),
        title="DBSCAN — Davies–Bouldin (non-noise only; lower better)",
        log=log,
    )
    _heatmap_pivot(
        df_plot,
        value="noise_share",
        out_path=os.path.join(PATH_RES_05B_EVAL, "dbscan_noise_share_heatmap.png"),
        title="DBSCAN — noise share",
        log=log,
    )
    _heatmap_pivot(
        df_plot,
        value="n_clusters_excluding_noise",
        out_path=os.path.join(PATH_RES_05B_EVAL, "dbscan_n_clusters_heatmap.png"),
        title="DBSCAN — number of clusters excluding noise",
        log=log,
    )
    _heatmap_pivot(
        df_plot,
        value="composite",
        out_path=os.path.join(PATH_RES_05B_EVAL, "dbscan_composite_heatmap.png"),
        title="DBSCAN — composite selection score (higher better)",
        log=log,
    )

    combined_path = os.path.join(
        PATH_RES_05B_EVAL,
        "combined_silhouette_db_ch_composite_vs_grid.png",
    )
    _dbscan_combined_metrics_overlay(
        df_plot,
        out_path=combined_path,
        chosen_eps=float(chosen_eps),
        chosen_ms=int(chosen_ms),
        method=str(method),
        log=log,
    )
    rank_hm_path = os.path.join(PATH_RES_05B_EDA, "metric_rank_heatmap.png")
    _eda_dbscan_metric_rank_heatmap(df_plot, out_path=rank_hm_path, log=log)

    bar_path = os.path.join(PATH_RES_05B_EDA, "dbscan_cluster_sizes_best_params.png")
    _best_params_bar_chart(
        X_sub,
        eps=chosen_eps,
        min_samples=int(chosen_ms),
        metric=metric,
        out_path=bar_path,
        log=log,
    )

    _write_readme(
        n_sub=n_sub,
        n_total=n_total,
        eps_list=eps_grid,
        ms_list=min_samples_grid,
    )
    log(f"Wrote readme -> {OUT_05B_README}")

    print(
        "PhilGEPS step 05B done. "
        f"eps={chosen_eps}, min_samples={chosen_ms} ({method}, fallback={fallback}). "
        f"grid: {OUT_05B_METRICS_GRID_CSV}; summary: {OUT_05B_SELECTION_SUMMARY_JSON}; "
        f"plots: {PATH_RES_05B_EVAL}; eda: {PATH_RES_05B_EDA} (incl. metric_rank_heatmap.png); logs: {PATH_LOGS_05B}. "
        "Run 04b_dbscan_implementation_philgeps.py next.",
        flush=True,
    )
    log("Step 05B complete")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PhilGEPS step 05B — DBSCAN grid search on PC1–PC3.",
    )
    parser.add_argument(
        "--eps-grid",
        type=str,
        default=",".join(str(x) for x in EPS_GRID_DEFAULT),
        help="Comma-separated eps values (ascending recommended).",
    )
    parser.add_argument(
        "--min-samples-grid",
        type=str,
        default=",".join(str(x) for x in MIN_SAMPLES_GRID_DEFAULT),
        help="Comma-separated min_samples integers.",
    )
    parser.add_argument(
        "--metrics-subsample",
        type=int,
        default=METRICS_SUBSAMPLE_DEFAULT_DBSCAN,
        help="Deterministic row subsample for evaluation (0 = all rows).",
    )
    parser.add_argument(
        "--metrics-on-full",
        action="store_true",
        help="Evaluate on full PC matrix (can be slow).",
    )
    parser.add_argument(
        "--metric",
        type=str,
        default="euclidean",
        help="DBSCAN / silhouette metric (default euclidean).",
    )
    args = parser.parse_args()
    try:
        eps_list = _parse_float_csv(args.eps_grid)
        ms_list = _parse_int_csv(args.min_samples_grid)
    except ValueError as exc:
        print(f"Invalid grid string: {exc}", file=sys.stderr)
        sys.exit(2)
    if not eps_list or not ms_list:
        print("eps-grid and min-samples-grid must be non-empty.", file=sys.stderr)
        sys.exit(2)

    _ensure_tree()
    term_log = os.path.join(
        PATH_LOG_TERMINAL_05B, "05b_evaluating_dbscan_philgeps_terminal.txt",
    )
    with tee_stdio_to_file(term_log):
        run_step05b(
            eps_grid=eps_list,
            min_samples_grid=ms_list,
            metrics_subsample=int(args.metrics_subsample),
            metrics_on_full=bool(args.metrics_on_full),
            metric=str(args.metric),
        )


if __name__ == "__main__":
    main()