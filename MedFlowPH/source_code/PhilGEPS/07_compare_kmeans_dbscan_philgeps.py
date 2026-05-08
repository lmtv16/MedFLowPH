"""
Step 07 — Model comparison: K-means vs DBSCAN on PhilGEPS PCA space (step 03 PC scores).

Read-only: loads evaluation artifacts from steps 04–06 and 04B–06B. Does not refit or alter
assignment CSVs.

Outputs:
    output_source/07/Model_Comparison/kmeans_vs_dbscan_summary.csv
    results/07/Model_Comparison/kmeans_vs_dbscan_metric_comparison.png
    results/07/Model_Comparison/kmeans_vs_dbscan_cluster_count.png
    results/07/Model_Comparison/kmeans_vs_dbscan_noise_share.png
    results/07/Model_Comparison/kmeans_vs_dbscan_interpretability_score.png
    results/07/Model_Comparison/kmeans_vs_dbscan_comparison_readme.txt
    results/07/Model_Comparison/kmeans_vs_dbscan_side_by_side.png   (if semantic PNGs exist)

Logs:
    logs/07/Terminal Logs/07_compare_kmeans_dbscan_philgeps_terminal.txt
    logs/07/Log entries/07_compare_kmeans_dbscan_philgeps_activity.txt

Usage:
    python 07_compare_kmeans_dbscan_philgeps.py
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from typing import Any, Callable

import matplotlib

matplotlib.use("Agg")
import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from philgeps_kmeans_common import (
    MEDFLOW_ROOT,
    OUT_04_CLUSTER_COUNTS_JSON,
    OUT_04_SEMANTIC_PNG,
    OUT_06_SEMANTIC_MAP_CSV,
    OUT_06_THEME_PROFILES_CSV,
    OUT_K_METRICS_LONG,
    OUT_K_SELECTION_SUMMARY,
    ensure_dirs,
    ensure_log_tree,
    open_activity_log,
    tee_stdio_to_file,
)
from philgeps_dbscan_common import (
    OUT_04B_CLUSTER_COUNTS_JSON,
    OUT_04B_SEMANTIC_PNG,
    OUT_05B_METRICS_GRID_CSV,
    OUT_05B_SELECTION_SUMMARY_JSON,
    OUT_06B_SEMANTIC_MAP_CSV,
    OUT_06B_THEME_PROFILES_CSV,
)

PATH_OUTPUT_07 = os.path.join(MEDFLOW_ROOT, "output_source", "07", "Model_Comparison")
PATH_RESULTS_07 = os.path.join(MEDFLOW_ROOT, "results", "07", "Model_Comparison")
PATH_LOGS_07 = os.path.join(MEDFLOW_ROOT, "logs", "07")
PATH_LOG_TERMINAL_07 = os.path.join(PATH_LOGS_07, "Terminal Logs")
PATH_LOG_ENTRIES_07 = os.path.join(PATH_LOGS_07, "Log entries")

OUT_07_SUMMARY_CSV = os.path.join(PATH_OUTPUT_07, "kmeans_vs_dbscan_summary.csv")
OUT_07_README = os.path.join(PATH_RESULTS_07, "kmeans_vs_dbscan_comparison_readme.txt")
OUT_07_METRIC_PNG = os.path.join(PATH_RESULTS_07, "kmeans_vs_dbscan_metric_comparison.png")
OUT_07_CLUSTER_PNG = os.path.join(PATH_RESULTS_07, "kmeans_vs_dbscan_cluster_count.png")
OUT_07_NOISE_PNG = os.path.join(PATH_RESULTS_07, "kmeans_vs_dbscan_noise_share.png")
OUT_07_INTERP_PNG = os.path.join(PATH_RESULTS_07, "kmeans_vs_dbscan_interpretability_score.png")
OUT_07_SIDE_BY_SIDE_PNG = os.path.join(PATH_RESULTS_07, "kmeans_vs_dbscan_side_by_side.png")


def _load_json(path: str) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _as_float(v: Any) -> float | None:
    if v is None or (isinstance(v, float) and not math.isfinite(v)):
        return None
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return None if not math.isfinite(x) else x


def _norm_pair(
    a: float | None,
    b: float | None,
    *,
    higher_is_better: bool,
) -> tuple[float | None, float | None]:
    if a is None or b is None:
        return None, None
    lo = min(a, b)
    hi = max(a, b)
    if hi <= lo:
        return 0.5, 0.5
    if higher_is_better:
        return (a - lo) / (hi - lo), (b - lo) / (hi - lo)
    return (hi - a) / (hi - lo), (hi - b) / (hi - lo)


def _dbscan_selected_grid_row(
    grid: pd.DataFrame,
    eps: float,
    min_samples: int,
    *,
    log: Callable[[str], None],
) -> pd.Series | None:
    eps_c = float(eps)
    ms_c = int(min_samples)
    m = np.isclose(grid["eps"].to_numpy(dtype=np.float64), eps_c, rtol=0.0, atol=1e-9) & (
        grid["min_samples"].to_numpy(dtype=np.int64) == ms_c
    )
    sub = grid.loc[m]
    if sub.empty:
        log(
            f"WARN: no row in dbscan_metrics_grid for eps={eps_c:g}, min_samples={ms_c}; "
            "will use dbscan_selection_summary best_metrics if present.",
        )
        return None
    return sub.iloc[0]


def _kmeans_interpretability_score(k: int) -> float:
    """Heuristic 0–1 (not a formal metric): favor small K, no noise concept."""
    if k <= 10:
        return 1.0
    return float(max(0.22, 1.0 - 0.07 * (k - 10)))


def _dbscan_interpretability_score(*, n_clusters_excl: int, noise_share: float) -> float:
    """Heuristic 0–1: penalize many micro-clusters or very high noise share."""
    if n_clusters_excl > 20 or noise_share > 0.40:
        return 0.32
    if n_clusters_excl > 10 or noise_share > 0.20:
        return 0.58
    return 0.78


def _qualitative_copy(
    *,
    algorithm: str,
    k: int | None,
    n_db_clusters: int | None,
    db_noise: float | None,
    km_sil: float | None,
    db_sil: float | None,
) -> tuple[str, str, str, str]:
    """cluster_count_interpretability, pca_plot_readability, strengths, weaknesses."""
    if algorithm == "K-means":
        cc = (
            f"Favorable — K={k} clusters suit narrative labeling when K≤10; "
            f"here K={k} keeps segment stories tractable."
            if k is not None and k <= 10
            else f"Moderate — K={k} segments may require prioritizing top clusters in prose."
        )
        pca = (
            "Strong — semantic 3D PCA view uses a single color per cluster without a noise haze."
        )
        st = (
            f"Every record assigned to one of {k} segments; no noise bucket; "
            "stable reporting totals across policy tables."
        )
        wm = (
            "Assumes partition structure in PC space; may blend heterogeneous suppliers if "
            "boundary cases sit between centroids."
        )
        return cc, pca, st, wm

    # DBSCAN
    assert algorithm == "DBSCAN"
    nc = int(n_db_clusters or 0)
    ns = float(db_noise or 0.0)
    parts_cc: list[str] = []
    if nc > 20:
        parts_cc.append("many micro-clusters fragment procurement stories")
    if ns > 0.40:
        parts_cc.append("noise_share>40% leaves most rows without a dense cluster label")
    if parts_cc:
        cc = "Challenging — " + "; ".join(parts_cc) + "."
    elif nc > 10 or ns > 0.20:
        cc = "Moderate — workable if analysts roll up minor DBSCAN densities or noise bucket."
    else:
        cc = "Moderate — cluster cardinality and noise are contained for exploratory review."
    pca = (
        "Mixed — grouped semantic plot highlights top densities plus noise; many small clusters "
        "are visually pooled as 'Other'."
    )
    st = (
        "Explicit noise/outlier detection; discovers arbitrarily shaped densities without fixing K; "
        "complements anomaly review."
    )
    wm = (
        f"High micro-cluster cardinality (n≈{nc} excl. noise) and noise_share≈{ns:.1%} on full data "
        "can overwhelm tables unless heavily grouped."
    )
    return cc, pca, st, wm


def _readme_conclusion(*, db_noise_share: float, n_db_clusters_excl: int) -> str:
    if db_noise_share > 0.40 or n_db_clusters_excl > 20:
        return (
            "K-Means is more suitable as the final interpretable clustering model. "
            "DBSCAN is retained as a supporting comparison for noise and outlier-like procurement records."
        )
    return (
        "K-Means remains the primary interpretable clustering model for full-coverage segment reporting "
        "because every record receives a concise cluster label. DBSCAN remains a valuable companion for "
        "density-based structure and for flagging procurement rows that behave like outliers in PCA space."
    )


def run_step07(*, require_optional_inputs: bool) -> None:
    ensure_dirs(PATH_OUTPUT_07, PATH_RESULTS_07)
    ensure_log_tree(PATH_LOGS_07)
    act = os.path.join(PATH_LOG_ENTRIES_07, "07_compare_kmeans_dbscan_philgeps_activity.txt")
    log = open_activity_log(act)

    required = [
        (OUT_K_SELECTION_SUMMARY, "05_evaluating_kmeans_philgeps.py"),
        (OUT_K_METRICS_LONG, "05_evaluating_kmeans_philgeps.py"),
        (OUT_04_CLUSTER_COUNTS_JSON, "04_kmeans_implementation_philgeps.py"),
        (OUT_05B_SELECTION_SUMMARY_JSON, "05b_evaluating_dbscan_philgeps.py"),
        (OUT_05B_METRICS_GRID_CSV, "05b_evaluating_dbscan_philgeps.py"),
        (OUT_04B_CLUSTER_COUNTS_JSON, "04b_dbscan_implementation_philgeps.py"),
    ]
    for path, step in required:
        if not os.path.isfile(path):
            msg = f"Missing {path}. Run {step}."
            log(f"ERROR: {msg}")
            print(msg, file=sys.stderr)
            sys.exit(1)

    optional = [
        OUT_06_SEMANTIC_MAP_CSV,
        OUT_06_THEME_PROFILES_CSV,
        OUT_06B_SEMANTIC_MAP_CSV,
        OUT_06B_THEME_PROFILES_CSV,
    ]
    miss_opt = [p for p in optional if not os.path.isfile(p)]
    if miss_opt and require_optional_inputs:
        msg = "Missing optional interpretation inputs: " + "; ".join(miss_opt)
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    if miss_opt:
        log("WARN: some optional interpretation CSVs missing (continuing): " + ", ".join(miss_opt))

    ksum = _load_json(OUT_K_SELECTION_SUMMARY)
    chosen_k = int(ksum["chosen_k"])
    dfk = pd.read_csv(OUT_K_METRICS_LONG)
    row_k = dfk.loc[dfk["k"].astype(int) == chosen_k]
    if row_k.empty:
        msg = f"No K={chosen_k} row in {OUT_K_METRICS_LONG}."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    row_k = row_k.iloc[0]

    km_counts = _load_json(OUT_04_CLUSTER_COUNTS_JSON)
    k_json = int(km_counts.get("k", chosen_k))
    if k_json != chosen_k:
        log(f"WARN: cluster_counts.json k={k_json} vs summary chosen_k={chosen_k}; using summary K for metrics.")

    km_sil = _as_float(row_k.get("silhouette"))
    km_db = _as_float(row_k.get("davies_bouldin"))
    km_ch = _as_float(row_k.get("calinski_harabasz"))

    dsum = _load_json(OUT_05B_SELECTION_SUMMARY_JSON)
    chosen_eps = float(dsum["chosen_eps"])
    chosen_ms = int(dsum["chosen_min_samples"])
    method = str(dsum.get("chosen_method", ""))
    fallback = bool(dsum.get("fallback_used", False))

    grid = pd.read_csv(OUT_05B_METRICS_GRID_CSV)
    g_row = _dbscan_selected_grid_row(grid, chosen_eps, chosen_ms, log=log)
    best = dsum.get("best_metrics") or {}
    if g_row is not None:
        db_sil = _as_float(g_row.get("silhouette"))
        db_db = _as_float(g_row.get("davies_bouldin"))
        db_ch = _as_float(g_row.get("calinski_harabasz"))
        log(
            f"DBSCAN metrics from grid row eps={g_row['eps']:g}, min_samples={int(g_row['min_samples'])} "
            f"(subsample; dense-cluster metrics exclude noise).",
        )
    else:
        db_sil = _as_float(best.get("silhouette"))
        db_db = _as_float(best.get("davies_bouldin"))
        db_ch = _as_float(best.get("calinski_harabasz"))
        log("DBSCAN metrics taken from selection summary best_metrics (grid row missing).")

    db_counts = _load_json(OUT_04B_CLUSTER_COUNTS_JSON)
    n_total_db = int(db_counts["n_total"])
    n_noise_full = int(db_counts.get("n_noise", 0))
    noise_share_full = float(db_counts.get("noise_share", n_noise_full / n_total_db if n_total_db else 0.0))
    n_db_clusters_full = int(db_counts.get("n_clusters_excluding_noise", 0))

    km_sel = f"K={chosen_k} (step 05; primary pick argmax silhouette on eval subsample)"
    db_sel = (
        f"eps={chosen_eps:g}, min_samples={chosen_ms} (step 05B {method}, fallback={fallback}; "
        f"metrics row from dbscan_metrics_grid.csv where matched)"
    )

    n_clust_km = int(chosen_k)
    cc_km, pca_km, st_km, wm_km = _qualitative_copy(
        algorithm="K-means",
        k=n_clust_km,
        n_db_clusters=None,
        db_noise=None,
        km_sil=km_sil,
        db_sil=db_sil,
    )
    cc_db, pca_db, st_db, wm_db = _qualitative_copy(
        algorithm="DBSCAN",
        k=None,
        n_db_clusters=n_db_clusters_full,
        db_noise=noise_share_full,
        km_sil=km_sil,
        db_sil=db_sil,
    )

    km_isp = _kmeans_interpretability_score(n_clust_km)
    db_isp = _dbscan_interpretability_score(
        n_clusters_excl=n_db_clusters_full,
        noise_share=noise_share_full,
    )

    rows_csv = [
        {
            "algorithm": "K-Means",
            "selected_parameters": km_sel,
            "n_clusters_excluding_noise": n_clust_km,
            "n_noise": 0,
            "noise_share": 0.0,
            "silhouette": km_sil,
            "davies_bouldin": km_db,
            "calinski_harabasz": km_ch,
            "cluster_count_interpretability": cc_km,
            "pca_plot_readability": pca_km,
            "strengths": st_km,
            "weaknesses": wm_km,
            "final_role": "Main interpretable clustering model",
        },
        {
            "algorithm": "DBSCAN",
            "selected_parameters": db_sel,
            "n_clusters_excluding_noise": n_db_clusters_full,
            "n_noise": n_noise_full,
            "noise_share": noise_share_full,
            "silhouette": db_sil,
            "davies_bouldin": db_db,
            "calinski_harabasz": db_ch,
            "cluster_count_interpretability": cc_db,
            "pca_plot_readability": pca_db,
            "strengths": st_db,
            "weaknesses": wm_db,
            "final_role": "Comparison and outlier/noise detection model",
        },
    ]
    pd.DataFrame(rows_csv).to_csv(OUT_07_SUMMARY_CSV, index=False)
    log(f"Wrote summary CSV -> {OUT_07_SUMMARY_CSV}")

    # --- Normalized metric bar chart (0–1 goodness; DB inverted vs raw between the two algorithms)
    sil_k, sil_d = _norm_pair(km_sil, db_sil, higher_is_better=True)
    db_k, db_d = _norm_pair(km_db, db_db, higher_is_better=False)
    ch_k, ch_d = _norm_pair(km_ch, db_ch, higher_is_better=True)
    km_vals = [sil_k, db_k, ch_k]
    db_vals = [sil_d, db_d, ch_d]
    fig, ax = plt.subplots(figsize=(8.2, 5.0))
    xpos = np.arange(3, dtype=float)
    w = 0.36
    h_km = [0.0 if v is None else float(v) for v in km_vals]
    h_db = [0.0 if v is None else float(v) for v in db_vals]
    ax.bar(xpos - w / 2, h_km, width=w, label="K-Means", color="steelblue")
    ax.bar(xpos + w / 2, h_db, width=w, label="DBSCAN", color="darkorange")
    ax.set_xticks(xpos)
    ax.set_xticklabels(
        ["Silhouette\n(norm., ↑ better)", "Davies–Bouldin\n(inv. norm., ↑ better)", "Calinski–Harabasz\n(norm., ↑ better)"],
        fontsize=9,
    )
    ax.set_ylabel("Goodness (0–1 within pair; min–max over the two models)")
    ax.set_ylim(0, 1.05)
    ax.legend(loc="lower right")
    ax.grid(True, axis="y", alpha=0.35)
    ax.set_title(
        "K-Means vs DBSCAN — internal metrics on the step 05 / 05B evaluation subsample\n"
        "(DBSCAN silhouette / DB / CH exclude noise points; each metric scaled 0–1 across models)",
    )
    fig.tight_layout()
    fig.savefig(OUT_07_METRIC_PNG, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"Wrote metric comparison -> {OUT_07_METRIC_PNG}")

    # Cluster counts
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    ax.bar(
        ["K-Means", "DBSCAN"],
        [float(n_clust_km), float(n_db_clusters_full)],
        color=["steelblue", "darkorange"],
    )
    ax.set_ylabel("Clusters (excl. noise)")
    ax.set_title("Cluster count (full data)\nDBSCAN excludes noise label -1")
    ax.grid(True, axis="y", alpha=0.35)
    fig.tight_layout()
    fig.savefig(OUT_07_CLUSTER_PNG, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"Wrote cluster count chart -> {OUT_07_CLUSTER_PNG}")

    # Noise share
    fig, ax = plt.subplots(figsize=(5.5, 4.5))
    ax.bar(
        ["K-Means", "DBSCAN"],
        [0.0, noise_share_full],
        color=["steelblue", "darkorange"],
    )
    ax.set_ylabel("Noise share (full data)")
    ax.set_title("Noise / outlier share\nK-Means assigns every row; DBSCAN may label -1")
    ax.set_ylim(0, min(1.0, max(0.12, noise_share_full * 1.12, 0.05)))
    ax.grid(True, axis="y", alpha=0.35)
    fig.tight_layout()
    fig.savefig(OUT_07_NOISE_PNG, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"Wrote noise share chart -> {OUT_07_NOISE_PNG}")

    # Interpretability aid
    fig, ax = plt.subplots(figsize=(5.8, 4.6))
    ax.bar(
        ["K-Means", "DBSCAN"],
        [km_isp, db_isp],
        color=["steelblue", "darkorange"],
    )
    ax.set_ylim(0, 1.08)
    ax.set_ylabel("Heuristic score (0–1)")
    ax.set_title(
        "Interpretability aid (not a formal ML metric)\n"
        "K-Means: favors K≤10; DBSCAN: penalizes >20 clusters or noise_share>40%",
    )
    ax.grid(True, axis="y", alpha=0.35)
    fig.tight_layout()
    fig.savefig(OUT_07_INTERP_PNG, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"Wrote interpretability aid chart -> {OUT_07_INTERP_PNG}")

    # Side-by-side PCA semantic renders
    if os.path.isfile(OUT_04_SEMANTIC_PNG) and os.path.isfile(OUT_04B_SEMANTIC_PNG):
        fig, axes = plt.subplots(1, 2, figsize=(18.5, 6.2))
        axes[0].imshow(mpimg.imread(OUT_04_SEMANTIC_PNG))
        axes[0].axis("off")
        axes[0].set_title("K-Means: interpretable procurement clusters", fontsize=12, pad=8)
        axes[1].imshow(mpimg.imread(OUT_04B_SEMANTIC_PNG))
        axes[1].axis("off")
        axes[1].set_title("DBSCAN: density clusters + noise/outliers", fontsize=12, pad=8)
        fig.suptitle(
            "PhilGEPS — same PCA space (PC1–PC3); different clustering assumptions",
            fontsize=13,
            y=1.02,
        )
        fig.tight_layout()
        fig.savefig(OUT_07_SIDE_BY_SIDE_PNG, dpi=120, bbox_inches="tight")
        plt.close(fig)
        log(f"Wrote side-by-side PCA figure -> {OUT_07_SIDE_BY_SIDE_PNG}")
    else:
        log("Skipped side-by-side PNG (missing semantic PCA PNGs).")

    conclusion = _readme_conclusion(
        db_noise_share=noise_share_full,
        n_db_clusters_excl=n_db_clusters_full,
    )
    readme = f"""PhilGEPS step 07 — K-Means vs DBSCAN model comparison (website-ready summary)

Both models consume the same PCA-transformed coordinates from step 03 (PC1–PC3).
This step only reads prior outputs; it does not modify assignments or refit models.

K-Means (steps 04–06):
  * Every procurement record is assigned to one of K clusters (no noise label).
  * Metrics in the plots for K-Means come from the step 05 evaluation subsample for the chosen K
    (same CSV row as ``k_selection_summary.json``).

DBSCAN (steps 04B–06B):
  * Density-reachable points form clusters; others receive label -1 (noise / outliers in PCA space).
  * Internal metrics (silhouette, Davies–Bouldin, Calinski–Harabasz) exclude noise points by construction
    on the evaluation subsample.
  * The comparison table uses the **selected** row from ``dbscan_metrics_grid.csv`` when it matches
    ``chosen_eps`` / ``chosen_min_samples`` from ``dbscan_selection_summary.json``.
  * Cluster counts and noise_share in the summary CSV reflect **full-data** ``dbscan_cluster_counts.json``.

Interpretation notes:
  * DBSCAN often produces many micro-clusters on large procurement panels; presentation plots may group
    minor clusters for readability.
  * Metrics alone do not decide ``final`` storytelling quality—human review of semantic maps and theme
    profiles (steps 06 / 06B) matters.

Final conclusion:
  {conclusion}

Files written:
  {OUT_07_SUMMARY_CSV}
  {OUT_07_METRIC_PNG}
  {OUT_07_CLUSTER_PNG}
  {OUT_07_NOISE_PNG}
  {OUT_07_INTERP_PNG}
  {OUT_07_README}
  {OUT_07_SIDE_BY_SIDE_PNG if os.path.isfile(OUT_07_SIDE_BY_SIDE_PNG) else "(side-by-side skipped)"}

Primary inputs:
  K-Means: {OUT_K_METRICS_LONG}; {OUT_K_SELECTION_SUMMARY}; {OUT_04_CLUSTER_COUNTS_JSON}
  DBSCAN: {OUT_05B_METRICS_GRID_CSV}; {OUT_05B_SELECTION_SUMMARY_JSON}; {OUT_04B_CLUSTER_COUNTS_JSON}

Optional narrative inputs (referenced when present):
  {OUT_06_SEMANTIC_MAP_CSV}
  {OUT_06_THEME_PROFILES_CSV}
  {OUT_06B_SEMANTIC_MAP_CSV}
  {OUT_06B_THEME_PROFILES_CSV}
"""
    with open(OUT_07_README, "w", encoding="utf-8", newline="\n") as f:
        f.write(readme.strip() + "\n")
    log(f"Wrote readme -> {OUT_07_README}")

    print(
        "PhilGEPS step 07 done. "
        f"summary: {OUT_07_SUMMARY_CSV}; readme: {OUT_07_README}; "
        f"plots: {PATH_RESULTS_07}",
        flush=True,
    )
    log("Step 07 complete")


def main() -> None:
    parser = argparse.ArgumentParser(description="PhilGEPS step 07 — K-Means vs DBSCAN comparison.")
    parser.add_argument(
        "--require-optional-inputs",
        action="store_true",
        help="Fail if step 06 / 06B semantic CSVs are missing (default: warn only).",
    )
    args = parser.parse_args()
    ensure_dirs(PATH_LOG_TERMINAL_07, PATH_LOG_ENTRIES_07)
    term = os.path.join(PATH_LOG_TERMINAL_07, "07_compare_kmeans_dbscan_philgeps_terminal.txt")
    with tee_stdio_to_file(term):
        run_step07(require_optional_inputs=bool(args.require_optional_inputs))


if __name__ == "__main__":
    main()
