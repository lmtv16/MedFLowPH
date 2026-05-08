"""
Step 05 — K-selection for K-means on PhilGEPS PC scores (PC1, PC2, PC3).

Reads ``output_source/03/Clustering/philgeps_clustering_pc_scores.csv`` (step 03) and
evaluates K-means over a small grid (default ``K = 2..7``) on a fixed subsample of the PC
cloud. For each K we compute silhouette, Davies–Bouldin, Calinski–Harabasz, inertia (WCSS),
and a z-scored composite score. The primary K is chosen by argmax silhouette (P1); the
composite (P2) and minimum DB (P3) picks are recorded for audit.

Outputs:

    output_source/05/KSelection/
        k_metrics_long.csv            (one row per K with all metrics + composite)
        k_selection_summary.json      (chosen K, alternatives, paths, computation audit)
    results/05/KSelection/
        silhouette_vs_k.png
        davies_bouldin_vs_k.png
        calinski_harabasz_vs_k.png
        composite_vs_k.png
        elbow_inertia_vs_k.png
        combined_silhouette_db_ch_composite_vs_k.png   (normalized overlay; star = best K by silhouette)
        k_selection_readme.txt
    results/05/EDA/
        cluster_sizes_per_k.png       (small-multiple bar chart of per-K cluster sizes)
        metric_rank_heatmap.png       (rank of each K under each metric)
    logs/05/Log entries/05_evaluating_kmeans_philgeps_activity.txt
    logs/05/Terminal Logs/05_evaluating_kmeans_philgeps_terminal.txt

Run after ``03_PCA_Dimensionality_philgeps.py``. Step 04 reads ``chosen_k`` from the JSON.

Usage:
    python 05_evaluating_kmeans_philgeps.py
    python 05_evaluating_kmeans_philgeps.py --k-min 2 --k-max 7 --metrics-subsample 80000
    python 05_evaluating_kmeans_philgeps.py --metrics-on-full      # very slow; full silhouette
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.cluster import KMeans

from philgeps_kmeans_common import (
    KMEANS_N_INIT,
    METRICS_SUBSAMPLE_DEFAULT,
    OUT_05_README,
    OUT_K_METRICS_LONG,
    OUT_K_SELECTION_SUMMARY,
    PATH_LOG_ENTRIES_05,
    PATH_LOG_TERMINAL_05,
    PATH_LOGS_05,
    PATH_OUT_05_KSEL,
    PATH_RES_05_EDA,
    PATH_RES_05_KSEL,
    RANDOM_SEED,
    add_composite_column,
    build_computations_meta,
    ensure_dirs,
    ensure_log_tree,
    evaluate_k_grid,
    load_pc_scores,
    open_activity_log,
    pick_k_composite,
    pick_k_min_davies_bouldin,
    pick_k_silhouette,
    plot_k_metric_curves,
    scatter_subsample_row_indices,
    tee_stdio_to_file,
)


METRIC_KEYS = ("silhouette", "davies_bouldin", "calinski_harabasz", "composite", "inertia")
COMPOSITE_FORMULA = "(z_silhouette + z_calinski_harabasz - z_davies_bouldin) / sqrt(3)"
COMBINED_METRICS_PNG = "combined_silhouette_db_ch_composite_vs_k.png"


def _minmax_goodness_series(s: pd.Series, *, higher_is_better: bool) -> np.ndarray:
    """Map metric values across K to [0, 1] where 1 = best K for that metric."""
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


def plot_combined_metrics_overlay(
    df: pd.DataFrame,
    out_dir: str,
    *,
    chosen_k: int,
) -> str:
    """Overlay silhouette, DB (inverted), CH, composite on [0,1] goodness scale; star marks chosen_k."""
    out_path = os.path.join(out_dir, COMBINED_METRICS_PNG)
    if df.empty:
        return out_path
    ks = df["k"].to_numpy(dtype=int)
    y_sil = _minmax_goodness_series(df["silhouette"], higher_is_better=True)
    y_db = _minmax_goodness_series(df["davies_bouldin"], higher_is_better=False)
    y_ch = _minmax_goodness_series(df["calinski_harabasz"], higher_is_better=True)
    y_comp = _minmax_goodness_series(df["composite"], higher_is_better=True)

    fig, ax = plt.subplots(figsize=(9, 5.2))
    ax.plot(ks, y_sil, "o-", color="#1f77b4", label="Silhouette (norm., ↑better)", linewidth=2)
    ax.plot(ks, y_db, "s-", color="#ff7f0e", label="Davies–Bouldin (inv. norm., ↑better)", linewidth=2)
    ax.plot(ks, y_ch, "^-", color="#2ca02c", label="Calinski–Harabasz (norm., ↑better)", linewidth=2)
    ax.plot(ks, y_comp, "D-", color="#9467bd", label="Composite (norm., ↑better)", linewidth=2)

    match = np.flatnonzero(df["k"].to_numpy(dtype=int) == int(chosen_k))
    if match.size:
        i = int(match[0])
        ys_at_star = [float(y_sil[i]), float(y_db[i]), float(y_ch[i]), float(y_comp[i])]
        ys_at_star = [y for y in ys_at_star if math.isfinite(y)]
        y_star = float(max(ys_at_star)) if ys_at_star else 0.5
        y_star_disp = min(1.06, y_star + 0.06)
        ax.scatter(
            [float(chosen_k)],
            [y_star_disp],
            marker="*",
            s=520,
            color="gold",
            edgecolors="black",
            linewidths=1.2,
            zorder=10,
            label=f"Best K = {int(chosen_k)} (silhouette)",
        )
    ax.set_xlabel("K")
    ax.set_ylabel("normalized score (0 = worst, 1 = best within grid)")
    ax.set_xticks(ks)
    ax.set_ylim(-0.05, 1.12)
    ax.grid(True, alpha=0.35)
    ax.legend(loc="lower right", fontsize=8, framealpha=0.95)
    ax.set_title(
        "K-selection metrics overlay (min–max per metric; DB inverted)\n"
        f"★ = chosen K by argmax silhouette ({int(chosen_k)})",
    )
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    return out_path


def _ensure_tree() -> None:
    ensure_dirs(
        PATH_OUT_05_KSEL,
        PATH_RES_05_KSEL,
        PATH_RES_05_EDA,
    )
    ensure_log_tree(PATH_LOGS_05)


def _eda_cluster_sizes_per_k(
    X_sub: np.ndarray,
    *,
    k_min: int,
    k_max: int,
    out_path: str,
    log: Any,
) -> None:
    """Small-multiple bar chart of cluster sizes for each K on the eval subsample."""
    ks = [k for k in range(k_min, k_max + 1) if 2 <= k < X_sub.shape[0]]
    if not ks:
        return
    n_cols = min(3, len(ks))
    n_rows = (len(ks) + n_cols - 1) // n_cols
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(4.4 * n_cols, 3.2 * n_rows), squeeze=False)
    for idx, k in enumerate(ks):
        ax = axes[idx // n_cols][idx % n_cols]
        km = KMeans(
            n_clusters=k,
            random_state=RANDOM_SEED,
            n_init=KMEANS_N_INIT,
            algorithm="lloyd",
        )
        lab = km.fit_predict(X_sub)
        sizes = pd.Series(lab).value_counts().sort_index()
        ax.bar(sizes.index.astype(int), sizes.values, color="steelblue")
        ax.set_title(f"K={k}")
        ax.set_xlabel("cluster_id")
        ax.set_ylabel("count (eval subsample)")
        ax.set_xticks(list(range(k)))
        ax.grid(True, axis="y", alpha=0.3)
    for j in range(len(ks), n_rows * n_cols):
        axes[j // n_cols][j % n_cols].axis("off")
    fig.suptitle("Cluster sizes per K (eval subsample)", y=1.02, fontsize=12)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"EDA: wrote cluster size small-multiples -> {out_path}")


def _eda_metric_rank_heatmap(df: pd.DataFrame, *, out_path: str, log: Any) -> None:
    """Rank each K within each metric (1 = best) for a quick visual best-of comparison."""
    if df.empty:
        return
    direction = {
        "silhouette": False,
        "davies_bouldin": True,
        "calinski_harabasz": False,
        "composite": False,
        "inertia": True,
    }
    rank_cols: dict[str, np.ndarray] = {}
    for metric, ascending in direction.items():
        if metric not in df.columns:
            continue
        rank_cols[metric] = (
            df[metric].rank(method="min", ascending=ascending).to_numpy(dtype=int)
        )
    if not rank_cols:
        return
    rank_df = pd.DataFrame(rank_cols, index=df["k"].astype(int))
    rank_df.index.name = "K"
    fig, ax = plt.subplots(figsize=(1.4 * len(rank_df.columns) + 2.0, 0.55 * len(rank_df) + 2.0))
    sns.heatmap(
        rank_df,
        ax=ax,
        annot=True,
        fmt="d",
        cmap="YlGnBu_r",
        cbar_kws={"label": "rank (1=best)"},
        linewidths=0.5,
        linecolor="#cccccc",
    )
    ax.set_title("K rank per metric (1 = best for that metric)")
    ax.set_xlabel("metric")
    ax.set_ylabel("K")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log(f"EDA: wrote metric rank heatmap -> {out_path}")


def _write_readme(*, k_min: int, k_max: int, n_sub: int, n_total: int, chosen_k: int) -> None:
    body = f"""PhilGEPS step 05 — K-selection for K-means

Inputs:
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv (PC1, PC2, PC3 from step 03)

Process:
  K grid: {k_min}..{k_max}; metrics computed on a fixed subsample of {n_sub:,} of {n_total:,} rows
  (deterministic via RANDOM_SEED). For each K we fit KMeans(n_clusters=K, random_state=RANDOM_SEED,
  n_init={KMEANS_N_INIT}, algorithm='lloyd') and record:
    silhouette        — sklearn.metrics.silhouette_score (higher better)   [P1: argmax]
    davies_bouldin    — sklearn.metrics.davies_bouldin_score (lower better) [P3: argmin]
    calinski_harabasz — sklearn.metrics.calinski_harabasz_score (higher better)
    composite         — {COMPOSITE_FORMULA}                                [P2: argmax]
    inertia           — KMeans.inertia_ on subsample (elbow plot only)

Primary selection: argmax silhouette → chosen_k = {chosen_k}.
Step 04 reads chosen_k from k_selection_summary.json and refits KMeans on the FULL PC matrix.

Plots (results/05/KSelection):
  silhouette_vs_k.png, davies_bouldin_vs_k.png, calinski_harabasz_vs_k.png,
  composite_vs_k.png, elbow_inertia_vs_k.png
  combined_silhouette_db_ch_composite_vs_k.png — silhouette, DB (inverted), CH, composite
    on one chart (each min–max normalized so higher = better); gold star = best K (silhouette).

Diagnostic EDA (results/05/EDA):
  cluster_sizes_per_k.png   — per-K bar chart of cluster sizes (eval subsample)
  metric_rank_heatmap.png   — rank of each K within each metric

Notes:
  * Subsample silhouette/CH/DB are estimates of the full-data values. They suffice for
    K selection on this PC cloud (~487k rows). Pass --metrics-on-full for full-data scoring
    (slow due to silhouette O(n^2)).
  * inertia is reported on the same subsample as the other metrics; it is intended only as
    an elbow diagnostic, not a selection criterion.
"""
    with open(OUT_05_README, "w", encoding="utf-8", newline="\n") as f:
        f.write(body.strip() + "\n")


def run_step05(*, k_min: int, k_max: int, metrics_subsample: int, metrics_on_full: bool) -> None:
    _ensure_tree()
    activity_path = os.path.join(
        PATH_LOG_ENTRIES_05, "05_evaluating_kmeans_philgeps_activity.txt",
    )
    log = open_activity_log(activity_path)

    log(
        f"Step 05 — K selection: k_min={k_min}, k_max={k_max}, "
        f"metrics_subsample={metrics_subsample}, metrics_on_full={metrics_on_full}",
    )

    log("Loading PC scores from step 03")
    X = load_pc_scores()
    n_total = int(X.shape[0])
    log(f"Loaded PC scores: shape={X.shape}")

    if metrics_on_full or metrics_subsample <= 0 or metrics_subsample >= n_total:
        sub_idx = np.arange(n_total, dtype=np.int64)
    else:
        sub_idx = scatter_subsample_row_indices(
            n_total, max_points=metrics_subsample, seed=RANDOM_SEED,
        )
    X_sub = np.ascontiguousarray(X[sub_idx])
    n_sub = int(X_sub.shape[0])
    log(f"Eval subsample: n_sub={n_sub:,} (of n_total={n_total:,})")

    log(f"Running K-grid evaluation for K = {k_min}..{k_max}")
    df = evaluate_k_grid(X_sub, k_min=k_min, k_max=k_max)
    if df.empty:
        msg = "Empty K-grid (no valid K). Aborting."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    df = add_composite_column(df)
    df.to_csv(OUT_K_METRICS_LONG, index=False)
    log(f"Wrote per-K metrics -> {OUT_K_METRICS_LONG}")
    print(df.to_string(index=False))

    chosen_k = pick_k_silhouette(df)
    try:
        composite_k = pick_k_composite(df)
    except ValueError:
        composite_k = None
    try:
        db_k = pick_k_min_davies_bouldin(df)
    except ValueError:
        db_k = None
    log(
        f"Picks: silhouette={chosen_k} (primary), composite={composite_k}, "
        f"min_davies_bouldin={db_k}",
    )

    plot_k_metric_curves(df, PATH_RES_05_KSEL, include=METRIC_KEYS)
    log(f"Wrote metric curves -> {PATH_RES_05_KSEL}")

    overlay_path = plot_combined_metrics_overlay(df, PATH_RES_05_KSEL, chosen_k=int(chosen_k))
    log(f"Wrote combined metrics overlay -> {overlay_path}")

    eda_sizes_path = os.path.join(PATH_RES_05_EDA, "cluster_sizes_per_k.png")
    _eda_cluster_sizes_per_k(
        X_sub, k_min=k_min, k_max=k_max, out_path=eda_sizes_path, log=log,
    )

    eda_rank_path = os.path.join(PATH_RES_05_EDA, "metric_rank_heatmap.png")
    _eda_metric_rank_heatmap(df, out_path=eda_rank_path, log=log)

    summary: dict[str, Any] = {
        "chosen_k": int(chosen_k),
        "chosen_k_method": "silhouette",
        "alternatives": {
            "max_silhouette_k": int(chosen_k),
            "max_composite_k": int(composite_k) if composite_k is not None else None,
            "min_davies_bouldin_k": int(db_k) if db_k is not None else None,
        },
        "k_grid": [int(k) for k in df["k"].tolist()],
        "metrics_per_k": [
            {col: (None if pd.isna(row[col]) else float(row[col])) for col in df.columns}
            for _, row in df.iterrows()
        ],
        "computations": build_computations_meta(
            n_sub=n_sub,
            n_total=n_total,
            k_min=k_min,
            k_max=k_max,
            formula_composite=COMPOSITE_FORMULA,
        ),
        "paths": {
            "k_metrics_long_csv": OUT_K_METRICS_LONG,
            "k_selection_summary_json": OUT_K_SELECTION_SUMMARY,
            "metric_curves_dir": PATH_RES_05_KSEL,
            "eda_dir": PATH_RES_05_EDA,
            "logs_dir": PATH_LOGS_05,
        },
    }
    with open(OUT_K_SELECTION_SUMMARY, "w", encoding="utf-8", newline="\n") as f:
        json.dump(summary, f, indent=2)
    log(f"Wrote K selection summary -> {OUT_K_SELECTION_SUMMARY}")

    _write_readme(
        k_min=k_min, k_max=k_max, n_sub=n_sub, n_total=n_total, chosen_k=int(chosen_k),
    )
    log(f"Wrote readme -> {OUT_05_README}")

    print(
        "PhilGEPS step 05 done. "
        f"chosen_k={chosen_k} (silhouette); composite={composite_k}; min_DB={db_k}. "
        f"summary: {OUT_K_SELECTION_SUMMARY}; metrics: {OUT_K_METRICS_LONG}; "
        f"plots: {PATH_RES_05_KSEL}; eda: {PATH_RES_05_EDA}; logs: {PATH_LOGS_05}. "
        "Run 04_kmeans_implementation_philgeps.py next.",
        flush=True,
    )
    log(f"Step 05 complete. chosen_k={chosen_k}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PhilGEPS step 05 — K-selection by silhouette over a small K grid.",
    )
    parser.add_argument("--k-min", type=int, default=2, help="Smallest K to evaluate (>=2).")
    parser.add_argument("--k-max", type=int, default=7, help="Largest K to evaluate (>=k_min).")
    parser.add_argument(
        "--metrics-subsample",
        type=int,
        default=METRICS_SUBSAMPLE_DEFAULT,
        help="Row subsample for K evaluation (deterministic). 0 = use all rows.",
    )
    parser.add_argument(
        "--metrics-on-full",
        action="store_true",
        help="Compute silhouette/DB/CH on the full PC matrix (slow; O(n^2) silhouette).",
    )
    args = parser.parse_args()
    if args.k_min < 2 or args.k_max < args.k_min:
        print("--k-min must be >=2 and <= --k-max", file=sys.stderr)
        sys.exit(2)

    _ensure_tree()
    term_log = os.path.join(
        PATH_LOG_TERMINAL_05, "05_evaluating_kmeans_philgeps_terminal.txt",
    )
    with tee_stdio_to_file(term_log):
        run_step05(
            k_min=args.k_min,
            k_max=args.k_max,
            metrics_subsample=int(args.metrics_subsample),
            metrics_on_full=bool(args.metrics_on_full),
        )


if __name__ == "__main__":
    main()
