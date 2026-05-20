"""
Step 06B — Interpret DBSCAN clusters (including noise) and label the PCA scatter.

Reads step 04B assignments/backtrack plus Layer A and Step 01 procurement (same merge policy as
K-means step 06). Produces theme/base profiles with an ``is_noise`` flag; the DBSCAN noise cluster
(-1) is labeled ``Noise / outlier procurement records`` and is not given a normal procurement-pattern title.

Outputs:
    output_source/06B/Interpretation/dbscan_cluster_semantic_map.csv
    output_source/06B/Interpretation/dbscan_cluster_theme_profiles.csv
    output_source/06B/Interpretation/philgeps_dbscan_backtrack_layer_a.csv
    output_source/06B/Interpretation/per_cluster_full/philgeps_dbscan_cluster_<id>_layer_a_full.csv
    output_source/06B/Interpretation/per_cluster_full/philgeps_dbscan_noise_layer_a_full.csv
    results/06B/Cluster_Interpretation/dbscan_interpretation_readme.txt
    results/06B/Cluster_Interpretation/EDA/dbscan_*.png
    results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_semantic.png
    results/04B/PCA_Cluster/dbscan_semantic_legend_table.txt
    results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_interactive.html (Plotly; requires plotly)
    results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_interactive_rows.json

Run after ``04b_dbscan_implementation_philgeps.py``.

Usage:
    python 06b_dbscan_interpretation_philgeps.py
"""

from __future__ import annotations

import argparse
import glob
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

from philgeps_kmeans_common import (
    PATH_FS_CSV,
    PATH_PROCUREMENT_CSV,
    Z_THRESHOLD,
    cluster_pc_means_from_labels,
    cluster_short_title_from_theme_z,
    load_pc_scores,
    load_pca_ratios3,
    tee_stdio_to_file,
)
from philgeps_theme_scores import POLICY_PCA_BASE_COLUMNS, POLICY_THEME_SCORE_COLUMNS
from philgeps_dbscan_common import (
    DBSCAN_NOISE_LABEL,
    DEFAULT_DBSCAN_LEGEND_LABEL_MAX_LEN,
    DEFAULT_DBSCAN_NOISE_ALPHA,
    DEFAULT_DBSCAN_OTHER_ALPHA,
    DEFAULT_DBSCAN_PLOT_TOP_N,
    DEFAULT_DBSCAN_TOP_ALPHA,
    OUT_04B_ASSIGNMENTS_CSV,
    OUT_04B_BACKTRACK_CSV,
    OUT_04B_CLUSTER_COUNTS_JSON,
    OUT_04B_PC3D_DBSCAN_INTERACTIVE_HTML,
    OUT_04B_PC3D_DBSCAN_INTERACTIVE_ROWS_JSON,
    OUT_04B_SEMANTIC_LEGEND_TABLE_TXT,
    OUT_04B_SEMANTIC_PNG,
    OUT_06B_BACKTRACK_LAYER_A_CSV,
    OUT_06B_SEMANTIC_MAP_CSV,
    OUT_06B_THEME_PROFILES_CSV,
    OUT_06B_README,
    PATH_LOG_ENTRIES_06B,
    PATH_LOG_TERMINAL_06B,
    PATH_LOGS_06B,
    PATH_OUT_06B_INTERP,
    PATH_OUT_06B_PER_CLUSTER_FULL,
    PATH_RES_04B_PCA_CLUSTER,
    PATH_RES_06B_EDA,
    PATH_RES_06B_INTERP,
    PC3D_MAX_POINTS_DEFAULT,
    PC3D_PLOT_JITTER_FRAC_DEFAULT,
    ensure_dirs,
    ensure_log_tree,
    open_activity_log,
    dbscan_top_nonnoise_cluster_ids_by_count,
    save_dbscan_semantic_legend_table,
    save_labeled_pc_scatter_3d_dbscan_semantic,
    write_dbscan_pc3d_interactive_html,
)


def _build_layer_merge_column_map(
    merged_columns: pd.Index,
    *,
    df_bt: pd.DataFrame,
    fs: pd.DataFrame,
    proc: pd.DataFrame,
) -> pd.DataFrame:
    bt_cols = set(df_bt.columns)
    fs_cols = set(fs.columns)
    proc_cols = set(proc.columns)
    rows: list[dict[str, Any]] = []
    for position, col in enumerate(merged_columns):
        if col.startswith("backtrack_mm__"):
            provenance = "step04b_backtrack_minmax_overlap"
            source_header_original = col[len("backtrack_mm__") :]
        elif col.startswith("procurement__"):
            provenance = "step01_procurement_collision"
            source_header_original = col[len("procurement__") :]
        elif col in fs_cols:
            provenance = "layer_a_features_selected"
            source_header_original = col
        elif col in bt_cols:
            provenance = "step04b_backtrack_only"
            source_header_original = col
        elif col in proc_cols:
            provenance = "step01_procurement_only"
            source_header_original = col
        else:
            provenance = "unclassified"
            source_header_original = ""
        rows.append(
            {
                "position": position,
                "column_name": col,
                "provenance": provenance,
                "source_header_original": source_header_original,
            },
        )
    return pd.DataFrame(rows)


def _write_backtrack_layer_a_merge(df_bt: pd.DataFrame, *, log: Any) -> pd.DataFrame:
    if not os.path.isfile(PATH_FS_CSV):
        msg = f"Missing Layer A CSV {PATH_FS_CSV}."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    fs = pd.read_csv(PATH_FS_CSV, low_memory=False)
    if len(fs) != len(df_bt):
        msg = f"Row mismatch: features_selected={len(fs):,} vs backtrack={len(df_bt):,}."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    overlap = set(fs.columns) & set(df_bt.columns)
    overlap.discard("row_index")
    bt_adj = df_bt.rename(columns={c: f"backtrack_mm__{c}" for c in overlap})
    merged = pd.concat([bt_adj.reset_index(drop=True), fs.reset_index(drop=True)], axis=1)
    if merged.columns.duplicated().any():
        msg = "Unexpected duplicate columns after Layer A merge."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    if not os.path.isfile(PATH_PROCUREMENT_CSV):
        msg = f"Missing Step 01 CSV {PATH_PROCUREMENT_CSV}."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    proc = pd.read_csv(PATH_PROCUREMENT_CSV, low_memory=False)
    if len(proc) != len(merged):
        msg = f"Row mismatch: procurement={len(proc):,} vs merged={len(merged):,}."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    overlap_p = set(proc.columns) & set(merged.columns)
    proc_adj = proc.rename(columns={c: f"procurement__{c}" for c in overlap_p})
    merged = pd.concat([merged.reset_index(drop=True), proc_adj.reset_index(drop=True)], axis=1)
    if merged.columns.duplicated().any():
        msg = "Unexpected duplicate columns after procurement merge."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    cmap = _build_layer_merge_column_map(merged.columns, df_bt=df_bt, fs=fs, proc=proc)
    bad = cmap.loc[cmap["provenance"] == "unclassified", "column_name"].tolist()
    if bad:
        msg = f"Column manifest could not classify: {bad[:20]}"
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    merged.to_csv(OUT_06B_BACKTRACK_LAYER_A_CSV, index=False)
    log(f"Wrote merged Layer A + procurement -> {OUT_06B_BACKTRACK_LAYER_A_CSV}")
    return merged


def _plot_semantic_phrase(base_title: str) -> str:
    """Drop trailing ``segment`` wording for compact plot legend text."""
    s = (base_title or "").strip()
    if s.lower().endswith(" segment"):
        s = s[: -len(" segment")].strip()
    return s


def _build_theme_profiles_dbscan(df_bt: pd.DataFrame) -> pd.DataFrame:
    theme_cols = [c for c in POLICY_THEME_SCORE_COLUMNS if c in df_bt.columns]
    base_cols = [c for c in POLICY_PCA_BASE_COLUMNS if c in df_bt.columns]
    total = len(df_bt)
    rows: list[dict[str, Any]] = []
    for cid, sub in df_bt.groupby("cluster_id", sort=True):
        cid_i = int(cid)
        is_n = cid_i == DBSCAN_NOISE_LABEL
        cnt = int(len(sub))
        row: dict[str, Any] = {
            "cluster_id": cid_i,
            "is_noise": bool(is_n),
            "count": cnt,
            "share": float(cnt / total) if total else float("nan"),
        }
        for c in theme_cols:
            row[f"mean__{c}"] = float(sub[c].mean())
        for c in base_cols:
            row[f"mean__{c}"] = float(sub[c].mean())
        rows.append(row)
    profile = pd.DataFrame.from_records(rows)
    g_mean_theme = df_bt[theme_cols].mean(axis=0)
    g_std_theme = df_bt[theme_cols].std(axis=0, ddof=0).replace(0.0, np.nan)
    g_mean_base = df_bt[base_cols].mean(axis=0)
    g_std_base = df_bt[base_cols].std(axis=0, ddof=0).replace(0.0, np.nan)
    for c in theme_cols:
        col = f"mean__{c}"
        profile[f"z__{c}"] = ((profile[col] - g_mean_theme[c]) / g_std_theme[c]).fillna(0.0)
    for c in base_cols:
        col = f"mean__{c}"
        profile[f"z__{c}"] = ((profile[col] - g_mean_base[c]) / g_std_base[c]).fillna(0.0)
    return profile


def _semantic_map_dbscan(
    df_bt: pd.DataFrame,
    *,
    pc_means_by_cluster: dict[int, tuple[float, float, float]],
) -> tuple[dict[int, str], pd.DataFrame, dict[int, str]]:
    """Plain-language labels; noise fixed string; dense clusters mirror K-means theme z logic.

    Returns ``id_to_full_label`` (CSV ``cluster_label``, may append mean PC for duplicate themes),
    ``semantic_df``, and ``id_to_base_title`` (theme short title only; for plot legend phrases).
    """
    theme_cols = [c for c in POLICY_THEME_SCORE_COLUMNS if c in df_bt.columns]
    g_mean = df_bt[theme_cols].mean(axis=0)
    g_std = df_bt[theme_cols].std(axis=0, ddof=0).replace(0.0, np.nan)

    staged: list[tuple[int, str, str]] = []
    for cid in sorted(df_bt["cluster_id"].unique()):
        cid_i = int(cid)
        if cid_i == DBSCAN_NOISE_LABEL:
            continue
        sub = df_bt.loc[df_bt["cluster_id"] == cid, theme_cols]
        cm = sub.mean(axis=0)
        z = ((cm - g_mean) / g_std).replace([np.inf, -np.inf], np.nan).fillna(0.0)
        top5 = z.reindex(z.abs().sort_values(ascending=False).index).head(5)
        elevated = z[z >= Z_THRESHOLD]
        depressed = z[z <= -Z_THRESHOLD]
        if elevated.empty and depressed.empty:
            rationale = (
                f"No theme z-score exceeds ±{Z_THRESHOLD}; cluster mean near the cohort average "
                "on the engineered theme proxies."
            )
        else:
            rationale = "Strongest theme deviations vs cohort (z): " + "; ".join(
                f"{idx}={float(top5.loc[idx]):.2f}" for idx in top5.index
            )
        base_title = cluster_short_title_from_theme_z(z)
        staged.append((cid_i, base_title, rationale))

    titles_only = [t[1] for t in staged]
    dup_base_titles = {t for t in titles_only if titles_only.count(t) > 1}

    id_to_full_label: dict[int, str] = {
        DBSCAN_NOISE_LABEL: "Noise / outlier procurement records",
    }
    id_to_base_title: dict[int, str] = {}
    semantic_rows: list[dict[str, Any]] = [
        {
            "cluster_id": DBSCAN_NOISE_LABEL,
            "cluster_label": id_to_full_label[DBSCAN_NOISE_LABEL],
            "rationale_short": (
                "DBSCAN noise label (-1): not assigned to a dense neighborhood in PC1–PC3; "
                "treated as outlier procurement records rather than a single procurement pattern."
            )[:500],
        },
    ]
    for cid_i, base_title, rationale in staged:
        id_to_base_title[cid_i] = base_title
        final_title = base_title
        if base_title in dup_base_titles:
            if cid_i in pc_means_by_cluster:
                p1, p2, p3 = pc_means_by_cluster[cid_i]
                final_title = f"{base_title} · mean PC=({p1:.2f},{p2:.2f},{p3:.2f})"
            else:
                final_title = f"{base_title} · cluster_id={cid_i}"
        id_to_full_label[cid_i] = final_title
        semantic_rows.append({
            "cluster_id": cid_i,
            "cluster_label": final_title,
            "rationale_short": rationale[:500],
        })

    semantic_rows.sort(key=lambda r: (r["cluster_id"] == DBSCAN_NOISE_LABEL, r["cluster_id"]))
    return id_to_full_label, pd.DataFrame.from_records(semantic_rows), id_to_base_title


def _write_per_cluster_full(merged: pd.DataFrame, *, log: Any) -> None:
    os.makedirs(PATH_OUT_06B_PER_CLUSTER_FULL, exist_ok=True)
    for p in glob.glob(os.path.join(PATH_OUT_06B_PER_CLUSTER_FULL, "philgeps_dbscan_*_layer_a_full.csv")):
        try:
            os.remove(p)
        except OSError:
            pass
    for cid in sorted(merged["cluster_id"].astype(int).unique(), key=lambda x: (x >= 0, x)):
        sub = merged.loc[merged["cluster_id"].astype(int) == int(cid)]
        if int(cid) == DBSCAN_NOISE_LABEL:
            out_part = os.path.join(
                PATH_OUT_06B_PER_CLUSTER_FULL,
                "philgeps_dbscan_noise_layer_a_full.csv",
            )
        else:
            out_part = os.path.join(
                PATH_OUT_06B_PER_CLUSTER_FULL,
                f"philgeps_dbscan_cluster_{int(cid)}_layer_a_full.csv",
            )
        try:
            sub.to_csv(out_part, index=False)
        except PermissionError as exc:
            log(f"WARN: skipped {out_part} ({exc})")
            continue
        log(f"Wrote per-cluster full -> {out_part}")


def _eda_cluster_size_bar(profile: pd.DataFrame, *, out_path: str, log: Any) -> None:
    prof = profile.sort_values(["is_noise", "cluster_id"], ascending=[True, True])
    xlabels = [
        ("noise" if bool(r["is_noise"]) else str(int(r["cluster_id"])))
        for _, r in prof.iterrows()
    ]
    fig, ax = plt.subplots(figsize=(max(7.0, 0.55 * len(prof) + 4.0), 4.8))
    colors = ["#7f7f7f" if bool(r["is_noise"]) else "steelblue" for _, r in prof.iterrows()]
    ax.bar(xlabels, prof["count"].astype(int), color=colors)
    ax.set_xlabel("cluster_id (noise = DBSCAN -1)")
    ax.set_ylabel("count (full data)")
    ax.set_title("DBSCAN cluster sizes (full data)")
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log(f"EDA: cluster bar -> {out_path}")


def _eda_heatmap(
    profile: pd.DataFrame,
    *,
    cols: list[str],
    prefix: str,
    title: str,
    out_path: str,
    cmap: str,
    center: float | None,
    fmt: str,
    log: Any,
) -> None:
    if not cols:
        return
    full = [f"{prefix}{c}" for c in cols if f"{prefix}{c}" in profile.columns]
    if not full:
        return
    prof = profile.sort_values(["is_noise", "cluster_id"], ascending=[True, True])
    mat = prof.set_index("cluster_id")[full]
    mat.columns = [c.replace(prefix, "") for c in mat.columns]
    fig, ax = plt.subplots(figsize=(max(8.0, 0.85 * len(full) + 3), 0.55 * len(mat) + 2.5))
    sns.heatmap(
        mat,
        ax=ax,
        annot=True,
        fmt=fmt,
        cmap=cmap,
        center=center,
        linewidths=0.4,
        linecolor="#cccccc",
        cbar_kws={"shrink": 0.85},
    )
    ax.set_title(title)
    ax.set_ylabel("cluster_id (-1 = DBSCAN noise)")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"EDA heatmap -> {out_path}")


def _write_readme(*, n_clusters_excl: int, n_noise: int, n: int) -> None:
    body = f"""PhilGEPS step 06B — DBSCAN cluster interpretation

Inputs:
  output_source/04B/DBSCAN/philgeps_dbscan_assignments.csv
  output_source/04B/Backtrack/philgeps_dbscan_backtrack.csv
  output_source/02/Feature Selection/philgeps_features_selected.csv
  output_source/01/philgeps_medical_procurement.csv

Semantics:
  DBSCAN identifies density-based groups and outlier procurement records (noise = -1). The noise
  bucket is labeled ``Noise / outlier procurement records`` and does not receive a theme-derived
  procurement-pattern title like dense clusters.

  The DBSCAN PCA plot uses grouped visualization because DBSCAN produced many small density-based
  clusters. The actual cluster_id values remain unchanged in CSV outputs. For readability, the plot
  shows only noise, the top N largest non-noise clusters, and all remaining clusters grouped as
  ``Other DBSCAN clusters``. The semantic legend is shortened in the plot, while the full
  semantic descriptions are provided in dbscan_semantic_legend_table.txt and CSV outputs.

  The interactive DBSCAN PCA plot groups smaller clusters into "Other DBSCAN clusters" because
  DBSCAN may produce many micro-clusters. This keeps the visualization readable while preserving
  the actual cluster_id in the hover/click details, companion JSON, and CSV outputs.

Outputs:
  output_source/06B/Interpretation/dbscan_cluster_semantic_map.csv
  output_source/06B/Interpretation/dbscan_cluster_theme_profiles.csv
  output_source/06B/Interpretation/philgeps_dbscan_backtrack_layer_a.csv
  output_source/06B/Interpretation/per_cluster_full/philgeps_dbscan_cluster_<id>_layer_a_full.csv
  output_source/06B/Interpretation/per_cluster_full/philgeps_dbscan_noise_layer_a_full.csv
  results/06B/Cluster_Interpretation/EDA/dbscan_*.png
  results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_semantic.png
  results/04B/PCA_Cluster/dbscan_semantic_legend_table.txt
  results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_interactive.html
  results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_interactive_rows.json

Summary:
  total rows = {n:,}; non-noise clusters = {n_clusters_excl}; noise rows = {n_noise:,}.
"""
    with open(OUT_06B_README, "w", encoding="utf-8", newline="\n") as f:
        f.write(body.strip() + "\n")


def _ensure_tree() -> None:
    ensure_dirs(
        PATH_OUT_06B_INTERP,
        PATH_OUT_06B_PER_CLUSTER_FULL,
        PATH_RES_06B_INTERP,
        PATH_RES_06B_EDA,
        PATH_RES_04B_PCA_CLUSTER,
    )
    ensure_log_tree(PATH_LOGS_06B)


def run_step06b(
    *,
    pc3d_max_points: int,
    pc3d_plot_jitter_frac: float,
    dbscan_plot_top_n: int,
    dbscan_noise_alpha: float,
    dbscan_other_alpha: float,
    dbscan_top_alpha: float,
    dbscan_legend_label_max_len: int,
) -> None:
    _ensure_tree()
    log = open_activity_log(os.path.join(PATH_LOG_ENTRIES_06B, "06b_dbscan_interpretation_philgeps_activity.txt"))

    if not os.path.isfile(OUT_04B_BACKTRACK_CSV):
        msg = f"Missing {OUT_04B_BACKTRACK_CSV}. Run 04b_dbscan_implementation_philgeps.py first."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    df_bt = pd.read_csv(OUT_04B_BACKTRACK_CSV, low_memory=False)
    log(f"Loaded backtrack: {df_bt.shape}")
    n = len(df_bt)

    df_assign = pd.read_csv(OUT_04B_ASSIGNMENTS_CSV, low_memory=False)
    if len(df_assign) != n:
        msg = "Assignments vs backtrack row mismatch."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    labels = df_assign.sort_values("row_index", kind="mergesort")["cluster_id"].to_numpy(dtype=np.int64)
    X = load_pc_scores()
    if X.shape[0] != n:
        msg = "PC scores row count mismatch."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    df_merge = _write_backtrack_layer_a_merge(df_bt, log=log)

    pc_means = cluster_pc_means_from_labels(X, labels)
    id_to_full_label, semantic_df, id_to_base_title = _semantic_map_dbscan(
        df_bt, pc_means_by_cluster=pc_means,
    )
    semantic_df.to_csv(OUT_06B_SEMANTIC_MAP_CSV, index=False)
    log(f"Wrote semantic map -> {OUT_06B_SEMANTIC_MAP_CSV}")

    profile = _build_theme_profiles_dbscan(df_bt)
    profile.to_csv(OUT_06B_THEME_PROFILES_CSV, index=False)
    log(f"Wrote theme profiles -> {OUT_06B_THEME_PROFILES_CSV}")
    print(profile.to_string(index=False))

    _eda_cluster_size_bar(
        profile,
        out_path=os.path.join(PATH_RES_06B_EDA, "dbscan_cluster_size_bar.png"),
        log=log,
    )
    theme_cols = [c for c in POLICY_THEME_SCORE_COLUMNS if c in df_bt.columns]
    base_cols = [c for c in POLICY_PCA_BASE_COLUMNS if c in df_bt.columns]
    _eda_heatmap(
        profile,
        cols=theme_cols,
        prefix="mean__",
        title="DBSCAN — cluster × theme mean",
        out_path=os.path.join(PATH_RES_06B_EDA, "dbscan_theme_means_heatmap.png"),
        cmap="viridis",
        center=None,
        fmt=".3f",
        log=log,
    )
    _eda_heatmap(
        profile,
        cols=theme_cols,
        prefix="z__",
        title=f"DBSCAN — cluster × theme z (|z|>{Z_THRESHOLD} heuristic)",
        out_path=os.path.join(PATH_RES_06B_EDA, "dbscan_theme_z_heatmap.png"),
        cmap="RdBu_r",
        center=0.0,
        fmt=".2f",
        log=log,
    )
    _eda_heatmap(
        profile,
        cols=base_cols,
        prefix="mean__",
        title="DBSCAN — cluster × base PCA feature mean",
        out_path=os.path.join(PATH_RES_06B_EDA, "dbscan_base_means_heatmap.png"),
        cmap="viridis",
        center=None,
        fmt=".3f",
        log=log,
    )

    ratios3 = load_pca_ratios3()
    top_n = int(dbscan_plot_top_n)
    plot_legend_top_n = top_n
    top_for_table = dbscan_top_nonnoise_cluster_ids_by_count(labels, top_n)
    # Only set keys when we have a non-empty semantic phrase; otherwise matplotlib / Plotly
    # fall through to id_to_full_label via _dbscan_legend_entry_simplified (avoid "C25" blocking).
    id_to_legend_display: dict[int, str] = {}
    for cid in top_for_table:
        phrase = _plot_semantic_phrase(id_to_base_title.get(int(cid), ""))
        if phrase:
            id_to_legend_display[int(cid)] = f"C{int(cid)}: {phrase}".strip().strip(":")
        else:
            full = (id_to_full_label.get(int(cid)) or "").strip()
            if full:
                id_to_legend_display[int(cid)] = f"C{int(cid)}: {full}".strip().strip(":")

    eps_cap: float | None = None
    ms_cap: int | None = None
    if os.path.isfile(OUT_04B_CLUSTER_COUNTS_JSON):
        try:
            with open(OUT_04B_CLUSTER_COUNTS_JSON, encoding="utf-8") as jf:
                meta = json.load(jf)
            eps_cap = meta.get("eps")
            ms_cap = meta.get("min_samples")
            if eps_cap is not None:
                eps_cap = float(eps_cap)
            if ms_cap is not None:
                ms_cap = int(ms_cap)
        except (OSError, ValueError, TypeError, json.JSONDecodeError):
            eps_cap, ms_cap = None, None

    save_labeled_pc_scatter_3d_dbscan_semantic(
        X,
        labels,
        OUT_04B_SEMANTIC_PNG,
        ratios3=ratios3,
        id_to_short=id_to_full_label,
        id_to_legend_display=id_to_legend_display,
        max_points=pc3d_max_points,
        plot_jitter_frac=pc3d_plot_jitter_frac,
        legend_top_n=plot_legend_top_n,
        noise_alpha=float(dbscan_noise_alpha),
        other_alpha=float(dbscan_other_alpha),
        top_alpha=float(dbscan_top_alpha),
        legend_label_max_len=int(dbscan_legend_label_max_len),
        eps=eps_cap,
        min_samples=ms_cap,
    )
    log(f"Wrote semantic 3D DBSCAN PCA -> {OUT_04B_SEMANTIC_PNG}")

    save_dbscan_semantic_legend_table(
        OUT_04B_SEMANTIC_LEGEND_TABLE_TXT,
        labels_full=labels,
        semantic_df=semantic_df,
        id_to_base_title=id_to_base_title,
        top_cluster_ids=top_for_table,
        legend_label_max_len=int(dbscan_legend_label_max_len),
    )
    log(f"Wrote semantic legend table -> {OUT_04B_SEMANTIC_LEGEND_TABLE_TXT}")

    wrote_interactive = False
    try:
        wrote_interactive = write_dbscan_pc3d_interactive_html(
            X,
            labels,
            df_merge,
            OUT_04B_PC3D_DBSCAN_INTERACTIVE_HTML,
            OUT_04B_PC3D_DBSCAN_INTERACTIVE_ROWS_JSON,
            ratios3=ratios3,
            id_to_legend_display=id_to_legend_display,
            id_to_short=id_to_full_label,
            legend_label_max_len=int(dbscan_legend_label_max_len),
            max_points=pc3d_max_points,
            plot_jitter_frac=pc3d_plot_jitter_frac,
            top_n=top_n,
        )
        if wrote_interactive:
            log(f"Wrote DBSCAN interactive 3D PCA -> {OUT_04B_PC3D_DBSCAN_INTERACTIVE_HTML}")
        else:
            wmsg = "Skipped DBSCAN interactive HTML (install plotly: pip install plotly)."
            log(f"WARN: {wmsg}")
            print(wmsg, file=sys.stderr)
    except Exception as exc:  # noqa: BLE001
        fw = f"DBSCAN interactive HTML failed: {exc}"
        log(f"WARN: {fw}")
        print(fw, file=sys.stderr)

    n_noise = int((labels == DBSCAN_NOISE_LABEL).sum())
    n_clusters_excl = int(len(np.unique(labels[labels != DBSCAN_NOISE_LABEL])))
    _write_readme(n_clusters_excl=n_clusters_excl, n_noise=n_noise, n=n)

    _write_per_cluster_full(df_merge, log=log)

    print(
        "PhilGEPS step 06B done. "
        f"semantic: {OUT_06B_SEMANTIC_MAP_CSV}; profiles: {OUT_06B_THEME_PROFILES_CSV}; "
        f"wide: {OUT_06B_BACKTRACK_LAYER_A_CSV}; EDA: {PATH_RES_06B_EDA}; "
        f"semantic PCA: {OUT_04B_SEMANTIC_PNG}; legend table: {OUT_04B_SEMANTIC_LEGEND_TABLE_TXT}"
        + (f"; interactive 3D: {OUT_04B_PC3D_DBSCAN_INTERACTIVE_HTML}" if wrote_interactive else ""),
        flush=True,
    )
    log("Step 06B complete")


def main() -> None:
    parser = argparse.ArgumentParser(description="PhilGEPS step 06B — DBSCAN interpretation.")
    parser.add_argument("--pc3d-max-points", type=int, default=PC3D_MAX_POINTS_DEFAULT)
    parser.add_argument("--pc3d-plot-jitter-frac", type=float, default=PC3D_PLOT_JITTER_FRAC_DEFAULT)
    parser.add_argument(
        "--dbscan-plot-top-n",
        type=int,
        default=DEFAULT_DBSCAN_PLOT_TOP_N,
        metavar="N",
        help=(
            "Grouped DBSCAN visuals (static semantic plot, legend table, interactive Plotly): "
            "noise, top N non-noise clusters by count, and \"Other DBSCAN clusters\". Must be >= 1."
        ),
    )
    parser.add_argument(
        "--dbscan-noise-alpha",
        type=float,
        default=DEFAULT_DBSCAN_NOISE_ALPHA,
        help="3D plot: alpha for noise (-1) points (default from philgeps_dbscan_common).",
    )
    parser.add_argument(
        "--dbscan-other-alpha",
        type=float,
        default=DEFAULT_DBSCAN_OTHER_ALPHA,
        help="3D grouped plot: alpha for \"Other DBSCAN clusters\" points.",
    )
    parser.add_argument(
        "--dbscan-top-alpha",
        type=float,
        default=DEFAULT_DBSCAN_TOP_ALPHA,
        help="3D grouped plot: alpha for top-N cluster points.",
    )
    parser.add_argument(
        "--dbscan-legend-label-max-len",
        type=int,
        default=DEFAULT_DBSCAN_LEGEND_LABEL_MAX_LEN,
        metavar="L",
        help="Max characters per legend label (ellipsis if longer).",
    )
    args = parser.parse_args()
    jf = float(args.pc3d_plot_jitter_frac)
    if not math.isfinite(jf) or jf < 0.0:
        print("--pc3d-plot-jitter-frac must be finite and >= 0.", file=sys.stderr)
        sys.exit(2)
    if int(args.dbscan_plot_top_n) < 1:
        print("--dbscan-plot-top-n must be >= 1.", file=sys.stderr)
        sys.exit(2)
    for name, val in (
        ("--dbscan-noise-alpha", args.dbscan_noise_alpha),
        ("--dbscan-other-alpha", args.dbscan_other_alpha),
        ("--dbscan-top-alpha", args.dbscan_top_alpha),
    ):
        if not math.isfinite(float(val)) or float(val) < 0.0 or float(val) > 1.0:
            print(f"{name} must be finite in [0, 1].", file=sys.stderr)
            sys.exit(2)
    if int(args.dbscan_legend_label_max_len) < 0:
        print("--dbscan-legend-label-max-len must be >= 0.", file=sys.stderr)
        sys.exit(2)

    _ensure_tree()
    term = os.path.join(PATH_LOG_TERMINAL_06B, "06b_dbscan_interpretation_philgeps_terminal.txt")
    with tee_stdio_to_file(term):
        run_step06b(
            pc3d_max_points=int(args.pc3d_max_points),
            pc3d_plot_jitter_frac=jf,
            dbscan_plot_top_n=int(args.dbscan_plot_top_n),
            dbscan_noise_alpha=float(args.dbscan_noise_alpha),
            dbscan_other_alpha=float(args.dbscan_other_alpha),
            dbscan_top_alpha=float(args.dbscan_top_alpha),
            dbscan_legend_label_max_len=int(args.dbscan_legend_label_max_len),
        )


if __name__ == "__main__":
    main()
