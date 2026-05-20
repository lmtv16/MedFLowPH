"""
Step 06 — Interpret K-means clusters and label the PC scatter with theme semantics.

Reads:
    output_source/04/KMeans/philgeps_kmeans_assignments.csv           (cluster ids from step 04)
    output_source/04/Backtrack/philgeps_cluster_backtrack.csv      (scaled theme + base columns from Layer C)
    output_source/02/Feature Selection/philgeps_features_selected.csv (Layer A; row-aligned merge)
    output_source/01/philgeps_medical_procurement.csv             (Step 01 originals; additive merge)
    output_source/03/Clustering/philgeps_clustering_pc_scores.csv    (PC1..PC3, for plotting)
    results/03/Clustering/pca_theme_clustering.json                  (variance ratios for axis labels)

Writes:
    output_source/06/Interpretation/
        cluster_semantic_map.csv              (cluster_id, cluster_label, rationale_short;
                                                   no ``+theme`` / ``−theme`` strings)
        cluster_theme_profiles.csv            (cluster_id, count, share, theme means & z vs global,
                                               base means & z vs global)
        philgeps_cluster_backtrack_layer_a.csv  (step 04 backtrack + Layer A + Step 01 procurement;
                                                   overlapping scaled theme/base columns prefixed ``backtrack_mm__``;
                                                   Layer A keeps original column names;
                                                   Step 01 columns use ``procurement__`` only where names collide)
        philgeps_cluster_backtrack_layer_a_column_map.csv  (one row per column: provenance + original header;
                                                             output never contains duplicate column names—see readme)
        per_cluster_full/philgeps_cluster_<id>_layer_a_full.csv  (same columns as above; one file per cluster)
    results/06/Cluster_Interpretation/
        cluster_interpretation_readme.txt
    results/06/Cluster_Interpretation/EDA/
        cluster_size_bar.png             (cluster sizes on full data)
        theme_means_heatmap.png          (clusters × theme columns, mean values)
        theme_z_heatmap.png              (clusters × theme columns, z vs global)
        theme_means_per_cluster.png      (grouped bar chart: clusters × theme mean)
        base_means_heatmap.png           (clusters × POLICY_PCA_BASE_COLUMNS, mean values)
    results/04/PCA_Cluster/
        pca_space_pc123_3d_kmeans_numeric.png   (``C0``, ``C1``, … legend only; refreshed here so subsample/jitter match semantic plot)
        pca_space_pc123_3d_kmeans_interactive.html   (Plotly; click loads companion JSON once)
        pca_space_pc123_3d_kmeans_interactive_rows.json   (subsample; eight wide-merge fields by row_index)
        pca_space_pc123_3d_kmeans_semantic.png    (3D scatter + semantic legend; standalone table: cluster_semantic_legend_table.png)
        cluster_semantic_legend_table.png         (cluster_id × cluster_label only)
    logs/06/Log entries/06_cluster_interpretation_philgeps_activity.txt
    logs/06/Terminal Logs/06_cluster_interpretation_philgeps_terminal.txt

Run after ``04_kmeans_implementation_philgeps.py``.

Usage:
    python 06_cluster_interpretation_philgeps.py
    python 06_cluster_interpretation_philgeps.py --pc3d-max-points 0  # plot all rows (slow)
"""

from __future__ import annotations

import argparse
import glob
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
    OUT_04_BACKTRACK_CSV,
    OUT_04_LEGEND_PNG,
    OUT_04_NUMERIC_PNG,
    OUT_04_PC3D_KMEANS_INTERACTIVE_HTML,
    OUT_04_PC3D_KMEANS_INTERACTIVE_ROWS_JSON,
    OUT_04_SEMANTIC_PNG,
    OUT_06_BACKTRACK_LAYER_A_CSV,
    OUT_06_BACKTRACK_LAYER_A_COLUMN_MAP_CSV,
    OUT_06_README,
    PATH_OUT_06_PER_CLUSTER_FULL,
    OUT_06_SEMANTIC_MAP_CSV,
    OUT_06_THEME_PROFILES_CSV,
    PATH_FS_CSV,
    PATH_PROCUREMENT_CSV,
    PATH_LOG_ENTRIES_06,
    PATH_LOG_TERMINAL_06,
    PATH_LOGS_06,
    PATH_OUT_06_INTERP,
    PATH_RES_04_PCA_CLUSTER,
    PATH_RES_06_EDA,
    PATH_RES_06_INTERP,
    PC3D_MAX_POINTS_DEFAULT,
    PC3D_PLOT_JITTER_FRAC_DEFAULT,
    Z_THRESHOLD,
    cluster_pc_means_from_labels,
    ensure_dirs,
    ensure_log_tree,
    load_cluster_assignments,
    load_pc_scores,
    load_pca_ratios3,
    open_activity_log,
    save_cluster_legend_table_png,
    save_labeled_pc_scatter_3d,
    save_labeled_pc_scatter_3d_semantic,
    semantic_labels_for_clusters,
    tee_stdio_to_file,
    write_kmeans_pc3d_interactive_html,
)
from philgeps_theme_scores import POLICY_PCA_BASE_COLUMNS, POLICY_THEME_SCORE_COLUMNS


def _build_layer_merge_column_map(
    merged_columns: pd.Index,
    *,
    df_bt: pd.DataFrame,
    fs: pd.DataFrame,
    proc: pd.DataFrame,
) -> pd.DataFrame:
    """One row per output column: position, name, provenance, original header before prefixes."""
    bt_cols = set(df_bt.columns)
    fs_cols = set(fs.columns)
    proc_cols = set(proc.columns)
    rows: list[dict[str, Any]] = []
    for position, col in enumerate(merged_columns):
        if col.startswith("backtrack_mm__"):
            provenance = "step04_backtrack_minmax_overlap"
            source_header_original = col[len("backtrack_mm__") :]
        elif col.startswith("procurement__"):
            provenance = "step01_procurement_collision"
            source_header_original = col[len("procurement__") :]
        elif col in fs_cols:
            provenance = "layer_a_features_selected"
            source_header_original = col
        elif col in bt_cols:
            provenance = "step04_backtrack_only"
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
    """Concatenate row-aligned Layer A and Step 01 procurement onto step 04 backtrack.

    Step 04 carries Min–Max scaled theme/base columns (same basis as ``philgeps_min_max_scaled.csv``).
    For any column name shared with ``philgeps_features_selected``, the **backtrack** copy is renamed
    ``backtrack_mm__<col>`` so **Layer A** retains unprefixed interpretable magnitudes.

    ``philgeps_medical_procurement.csv`` is merged additively (same row order as Layer A).
    Procurement columns whose names already exist on the merged frame are prefixed ``procurement__``.

    Writes ``philgeps_cluster_backtrack_layer_a.csv`` and ``philgeps_cluster_backtrack_layer_a_column_map.csv``.
    Per-cluster CSVs under ``per_cluster_full/`` are written later via ``_write_per_cluster_layer_a_full``.

    Returns the merged wide ``DataFrame`` (same rows as backtrack) for downstream interactive PCA HTML.
    """
    if not os.path.isfile(PATH_FS_CSV):
        msg = f"Missing Layer A CSV {PATH_FS_CSV}. Run step 02 preprocessing."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    log(f"Loading Layer A for backtrack merge: {PATH_FS_CSV}")
    fs = pd.read_csv(PATH_FS_CSV, low_memory=False)
    if len(fs) != len(df_bt):
        msg = (
            f"Row mismatch: features_selected={len(fs):,} vs backtrack={len(df_bt):,}. "
            "Regenerate steps 02 and 04 on the same input."
        )
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    overlap = set(fs.columns) & set(df_bt.columns)
    overlap.discard("row_index")
    bt_adj = df_bt.rename(columns={c: f"backtrack_mm__{c}" for c in overlap})
    merged = pd.concat([bt_adj.reset_index(drop=True), fs.reset_index(drop=True)], axis=1)
    dup = merged.columns[merged.columns.duplicated()].tolist()
    if dup:
        msg = f"Unexpected duplicate columns after Layer A merge: {dup[:20]}"
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    if not os.path.isfile(PATH_PROCUREMENT_CSV):
        msg = f"Missing Step 01 procurement CSV {PATH_PROCUREMENT_CSV}. Run step 01."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    log(f"Loading Step 01 procurement for additive merge: {PATH_PROCUREMENT_CSV}")
    proc = pd.read_csv(PATH_PROCUREMENT_CSV, low_memory=False)
    if len(proc) != len(merged):
        msg = (
            f"Row mismatch: procurement={len(proc):,} vs merged backtrack+Layer A={len(merged):,}. "
            "Regenerate steps 01, 02, and 04 on the same pipeline input."
        )
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    overlap_p = set(proc.columns) & set(merged.columns)
    proc_adj = proc.rename(columns={c: f"procurement__{c}" for c in overlap_p})
    merged = pd.concat([merged.reset_index(drop=True), proc_adj.reset_index(drop=True)], axis=1)
    dup2 = merged.columns[merged.columns.duplicated()].tolist()
    if dup2:
        msg = f"Unexpected duplicate columns after procurement merge: {dup2[:20]}"
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    log(
        f"Merged Step 01 procurement (+{proc_adj.shape[1]} cols; "
        f"{len(overlap_p)} name collisions -> procurement__*)",
    )

    cmap = _build_layer_merge_column_map(
        merged.columns, df_bt=df_bt, fs=fs, proc=proc,
    )
    bad = cmap.loc[cmap["provenance"] == "unclassified", "column_name"].tolist()
    if bad:
        msg = f"Column manifest could not classify columns: {bad[:25]}"
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    cmap.to_csv(OUT_06_BACKTRACK_LAYER_A_COLUMN_MAP_CSV, index=False)
    log(f"Wrote column manifest ({len(cmap)} cols) -> {OUT_06_BACKTRACK_LAYER_A_COLUMN_MAP_CSV}")

    merged.to_csv(OUT_06_BACKTRACK_LAYER_A_CSV, index=False)
    log(
        f"Wrote full backtrack + Layer A + procurement ({merged.shape[0]:,} × {merged.shape[1]} cols) "
        f"-> {OUT_06_BACKTRACK_LAYER_A_CSV}",
    )

    return merged


def _write_per_cluster_layer_a_full(merged: pd.DataFrame, *, log: Any) -> None:
    """Write ``per_cluster_full/philgeps_cluster_<id>_layer_a_full.csv`` (runs after main merge + plots).

    Failures on individual files (e.g. ``PermissionError`` when a CSV is open in Excel) log a warning
    and skip that cluster so the rest of step 06 output still completes.
    """
    os.makedirs(PATH_OUT_06_PER_CLUSTER_FULL, exist_ok=True)
    stale = glob.glob(os.path.join(PATH_OUT_06_PER_CLUSTER_FULL, "philgeps_cluster_*_layer_a_full.csv"))
    for p in stale:
        try:
            os.remove(p)
        except OSError:
            pass
    for cid in sorted(merged["cluster_id"].astype(int).unique()):
        sub = merged.loc[merged["cluster_id"].astype(int) == int(cid)]
        out_part = os.path.join(
            PATH_OUT_06_PER_CLUSTER_FULL,
            f"philgeps_cluster_{int(cid)}_layer_a_full.csv",
        )
        try:
            sub.to_csv(out_part, index=False)
        except PermissionError as exc:
            warn = (
                f"Skipped writing {out_part} ({exc}). Close any app using this file and re-run step 06 "
                "to refresh per_cluster_full."
            )
            log(f"WARN: {warn}")
            print(warn, file=sys.stderr)
            continue
        log(f"Wrote cluster {int(cid)} full Layer A + procurement ({len(sub):,} rows) -> {out_part}")


def _ensure_tree() -> None:
    ensure_dirs(
        PATH_OUT_06_INTERP,
        PATH_OUT_06_PER_CLUSTER_FULL,
        PATH_RES_06_INTERP,
        PATH_RES_06_EDA,
        PATH_RES_04_PCA_CLUSTER,
    )
    ensure_log_tree(PATH_LOGS_06)


def _column_z(values: pd.DataFrame, *, ddof: int = 0) -> pd.DataFrame:
    mean = values.mean(axis=0)
    std = values.std(axis=0, ddof=ddof).replace(0.0, np.nan)
    z = (values - mean) / std
    return z.replace([np.inf, -np.inf], np.nan).fillna(0.0)


def _build_theme_profiles(df_bt: pd.DataFrame) -> pd.DataFrame:
    """Per-cluster mean and z (vs global) for theme + base columns, plus row counts."""
    theme_cols = [c for c in POLICY_THEME_SCORE_COLUMNS if c in df_bt.columns]
    base_cols = [c for c in POLICY_PCA_BASE_COLUMNS if c in df_bt.columns]

    counts = df_bt.groupby("cluster_id", sort=True).size().rename("count")
    share = (counts / counts.sum()).rename("share")
    rows: list[dict[str, Any]] = []
    for cid, sub in df_bt.groupby("cluster_id", sort=True):
        row: dict[str, Any] = {"cluster_id": int(cid), "count": int(counts.loc[cid]), "share": float(share.loc[cid])}
        for c in theme_cols:
            row[f"mean__{c}"] = float(sub[c].mean())
        for c in base_cols:
            row[f"mean__{c}"] = float(sub[c].mean())
        rows.append(row)
    profile = pd.DataFrame.from_records(rows).set_index("cluster_id").sort_index()

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
    return profile.reset_index()


def _eda_cluster_size_bar(profile: pd.DataFrame, *, out_path: str, log: Any) -> None:
    fig, ax = plt.subplots(figsize=(max(7.0, 0.6 * len(profile) + 4.0), 4.5))
    ax.bar(
        profile["cluster_id"].astype(int).astype(str),
        profile["count"].astype(int),
        color="steelblue",
    )
    for x, c, s in zip(
        profile["cluster_id"].astype(int).astype(str),
        profile["count"].astype(int),
        profile["share"].astype(float),
    ):
        ax.text(x, c, f"{c:,}\n({s * 100:.1f}%)", ha="center", va="bottom", fontsize=9)
    ax.set_xlabel("cluster_id")
    ax.set_ylabel("count (full data)")
    ax.set_title("Cluster sizes (full data)")
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150)
    plt.close(fig)
    log(f"EDA: wrote cluster size bar -> {out_path}")


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
    mat = profile.set_index("cluster_id")[full]
    mat.columns = [c.replace(prefix, "") for c in mat.columns]
    fig, ax = plt.subplots(figsize=(max(8.0, 0.85 * len(full) + 3.0), 0.55 * len(mat) + 2.5))
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
    ax.set_xlabel("")
    ax.set_ylabel("cluster_id")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"EDA: wrote {os.path.basename(out_path)} -> {out_path}")


def _eda_theme_means_grouped_bar(profile: pd.DataFrame, *, out_path: str, log: Any) -> None:
    cols = [f"mean__{c}" for c in POLICY_THEME_SCORE_COLUMNS if f"mean__{c}" in profile.columns]
    if not cols:
        return
    long = profile.set_index("cluster_id")[cols].copy()
    long.columns = [c.replace("mean__", "") for c in long.columns]
    long = long.reset_index().melt(id_vars="cluster_id", var_name="theme", value_name="mean")
    fig, ax = plt.subplots(figsize=(max(10.0, 0.4 * long["theme"].nunique() * long["cluster_id"].nunique() + 4.0), 5.0))
    sns.barplot(
        data=long,
        x="theme",
        y="mean",
        hue="cluster_id",
        ax=ax,
        palette="tab20",
    )
    ax.set_title("Theme means by cluster (full data)")
    ax.set_xlabel("")
    ax.set_ylabel("mean theme score")
    ax.grid(True, axis="y", alpha=0.3)
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    ax.legend(title="cluster_id", bbox_to_anchor=(1.02, 1.0), loc="upper left", fontsize=8)
    fig.tight_layout()
    fig.savefig(out_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    log(f"EDA: wrote theme means grouped bar -> {out_path}")


def _write_readme(*, k: int, n: int, n_clusters: int) -> None:
    body = f"""PhilGEPS step 06 — Cluster interpretation

Inputs:
  output_source/04/KMeans/philgeps_kmeans_assignments.csv     (row_index, cluster_id, PC1..PC3)
  output_source/04/Backtrack/philgeps_cluster_backtrack.csv (scaled theme + base columns from Layer C)
  output_source/02/Feature Selection/philgeps_features_selected.csv  (Layer A; positional merge by row)
  output_source/01/philgeps_medical_procurement.csv  (Step 01 originals; additive merge by row)
  output_source/03/Clustering/philgeps_clustering_pc_scores.csv (PC1..PC3 for the 3D plot)
  results/03/Clustering/pca_theme_clustering.json             (PC1..PC3 explained-variance ratios)

Method:
  Theme columns are z-scored vs cohort; ``cluster_label`` is the plain-language segment name
  from those z-scores (see ``cluster_short_title_from_theme_z``). ``rationale_short`` lists numeric theme z-scores
  only—there are no ``+theme`` / ``−theme`` tags in CSV or PNG outputs.
  Full theme means and z tables remain in ``cluster_theme_profiles.csv`` and in the EDA heatmaps.

Column naming (wide merge outputs):
  Prefix ``backtrack_mm__`` = Step 04 Min–Max scaled copy when Layer A also has that header (unprefixed = Layer A).
  Prefix ``procurement__`` = Step 01 procurement column renamed because the merge frame already had that header.
  The combined CSV has unique column names; collisions are resolved by renaming one side, never overwriting.
  See ``philgeps_cluster_backtrack_layer_a_column_map.csv`` for each column's provenance and original header.

Outputs:
  output_source/06/Interpretation/cluster_semantic_map.csv           (cluster_id, cluster_label, rationale_short)
  output_source/06/Interpretation/cluster_theme_profiles.csv         (per-cluster count, share, theme & base mean / z)
  output_source/06/Interpretation/philgeps_cluster_backtrack_layer_a.csv
      Full cartesian row alignment: step 04 row keys plus Layer A plus Step 01 procurement columns.
      Shared column names: Min–Max scaled values from step 04 appear as ``backtrack_mm__<col>``; Layer A keeps ``<col>``.
      Procurement columns keep original names except where they collide with existing columns, then ``procurement__<col>``.
  output_source/06/Interpretation/philgeps_cluster_backtrack_layer_a_column_map.csv
      One row per column in the wide merge (position, column_name, provenance, source_header_original).
      Provenance values: ``step04_backtrack_minmax_overlap``, ``layer_a_features_selected``, ``step04_backtrack_only``,
      ``step01_procurement_collision``, ``step01_procurement_only``.
  output_source/06/Interpretation/per_cluster_full/philgeps_cluster_<id>_layer_a_full.csv
      Same schema as the combined file; one CSV per cluster_id (stale ``philgeps_cluster_*_layer_a_full.csv`` removed before write).
  results/06/Cluster_Interpretation/EDA/
    cluster_size_bar.png          cluster sizes (full data)
    theme_means_heatmap.png     clusters × theme columns (mean)
    theme_z_heatmap.png         clusters × theme columns (z vs global)
    theme_means_per_cluster.png grouped bar (clusters × theme means)
    base_means_heatmap.png      clusters × POLICY_PCA_BASE_COLUMNS (mean)
  results/04/PCA_Cluster/
    pca_space_pc123_3d_kmeans_numeric.png      refreshed here: **numeric** legend ``C0``…``Ck`` only (same subsample/jitter as semantic; distinct from semantic PNG).
    pca_space_pc123_3d_kmeans_interactive.html Plotly 3D scatter (semantic legend); click loads JSON once.
    pca_space_pc123_3d_kmeans_interactive_rows.json Subsample only: eight wide-merge fields keyed by ``row_index``.
    pca_space_pc123_3d_kmeans_semantic.png    3D scatter with semantic legend (color-key table only in cluster_semantic_legend_table.png).
    cluster_semantic_legend_table.png       cluster_id × cluster_label (no theme-tag column)

Pipeline summary:
  Step 03 (PCA) -> Step 05 (K selection by silhouette) -> Step 04 (full K-means fit) -> Step 06 (this).
  K = {k}; total rows = {n:,}; clusters = {n_clusters}.

Row alignment:
  Assignments, backtrack, PC scores, Layer A ``philgeps_features_selected``, and Step 01 ``philgeps_medical_procurement``
  share the same row order when produced by steps 01→02→03→04 without row subsampling. The ``row_index`` column persisted by step 04 is
  the canonical key and equals the zero-based position in Layer A (step 02 writes ``index=False``).
"""
    with open(OUT_06_README, "w", encoding="utf-8", newline="\n") as f:
        f.write(body.strip() + "\n")


def run_step06(*, pc3d_max_points: int, pc3d_plot_jitter_frac: float) -> None:
    _ensure_tree()
    activity_path = os.path.join(
        PATH_LOG_ENTRIES_06, "06_cluster_interpretation_philgeps_activity.txt",
    )
    log = open_activity_log(activity_path)

    log("Loading step 04 cluster assignments")
    labels, df_assign = load_cluster_assignments()
    n = int(labels.shape[0])
    log(f"Loaded assignments: n={n:,}")

    log(f"Loading step 04 backtrack frame: {OUT_04_BACKTRACK_CSV}")
    if not os.path.isfile(OUT_04_BACKTRACK_CSV):
        msg = f"Missing backtrack CSV {OUT_04_BACKTRACK_CSV}. Run step 04 first."
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    df_bt = pd.read_csv(OUT_04_BACKTRACK_CSV)
    if "cluster_id" not in df_bt.columns:
        msg = f"Backtrack CSV missing cluster_id column: {OUT_04_BACKTRACK_CSV}"
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    log(f"Loaded backtrack: shape={df_bt.shape}")

    if len(df_bt) != n:
        msg = (
            f"Row mismatch: assignments n={n:,} vs backtrack rows={len(df_bt):,}. "
            "Re-run step 04."
        )
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    df_merge = _write_backtrack_layer_a_merge(df_bt, log=log)

    log("Loading PC scores from step 03 for the labeled 3D plot")
    X = load_pc_scores()
    if X.shape[0] != n:
        msg = (
            f"Row mismatch: PC scores n={X.shape[0]:,} vs assignments n={n:,}. "
            "Re-run steps 03 and 04 against the same step-02 output."
        )
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)
    if len(df_merge) != n:
        msg = (
            f"Row mismatch: wide merge n={len(df_merge):,} vs assignments n={n:,}. "
            "Regenerate step 06 merge outputs."
        )
        log(f"ERROR: {msg}")
        print(msg, file=sys.stderr)
        sys.exit(1)

    log("Computing semantic names from theme z-scores")
    pc_means = cluster_pc_means_from_labels(X, labels)
    id_to_name, id_to_short, semantic_df = semantic_labels_for_clusters(
        df_bt, pc_means_by_cluster=pc_means,
    )
    n_clusters = int(semantic_df.shape[0])
    log(f"Built semantic names for {n_clusters} clusters")
    semantic_df.to_csv(OUT_06_SEMANTIC_MAP_CSV, index=False)
    log(f"Wrote semantic map -> {OUT_06_SEMANTIC_MAP_CSV}")

    log("Building theme/base profile table")
    profile = _build_theme_profiles(df_bt)
    profile.to_csv(OUT_06_THEME_PROFILES_CSV, index=False)
    log(f"Wrote theme profiles -> {OUT_06_THEME_PROFILES_CSV}")
    print(profile.to_string(index=False))

    _eda_cluster_size_bar(
        profile, out_path=os.path.join(PATH_RES_06_EDA, "cluster_size_bar.png"), log=log,
    )

    theme_cols = [c for c in POLICY_THEME_SCORE_COLUMNS if c in df_bt.columns]
    base_cols = [c for c in POLICY_PCA_BASE_COLUMNS if c in df_bt.columns]
    _eda_heatmap(
        profile,
        cols=theme_cols,
        prefix="mean__",
        title="Cluster × theme — mean (full data)",
        out_path=os.path.join(PATH_RES_06_EDA, "theme_means_heatmap.png"),
        cmap="viridis",
        center=None,
        fmt=".3f",
        log=log,
    )
    _eda_heatmap(
        profile,
        cols=theme_cols,
        prefix="z__",
        title=f"Cluster × theme — z vs global (|z|>{Z_THRESHOLD} drives cluster_label heuristic)",
        out_path=os.path.join(PATH_RES_06_EDA, "theme_z_heatmap.png"),
        cmap="RdBu_r",
        center=0.0,
        fmt=".2f",
        log=log,
    )
    _eda_theme_means_grouped_bar(
        profile,
        out_path=os.path.join(PATH_RES_06_EDA, "theme_means_per_cluster.png"),
        log=log,
    )
    _eda_heatmap(
        profile,
        cols=base_cols,
        prefix="mean__",
        title="Cluster × base PCA features — mean (full data)",
        out_path=os.path.join(PATH_RES_06_EDA, "base_means_heatmap.png"),
        cmap="viridis",
        center=None,
        fmt=".3f",
        log=log,
    )

    log("Loading PCA variance ratios for plot axes")
    ratios3 = load_pca_ratios3()
    save_labeled_pc_scatter_3d(
        X,
        labels,
        OUT_04_NUMERIC_PNG,
        ratios3=ratios3,
        title_suffix=f"K={n_clusters}",
        max_points=pc3d_max_points,
        plot_jitter_frac=pc3d_plot_jitter_frac,
    )
    log(f"Saved numeric 3D K-means scatter (C0…Ck legend; aligned subsample) -> {OUT_04_NUMERIC_PNG}")

    save_labeled_pc_scatter_3d_semantic(
        X,
        labels,
        OUT_04_SEMANTIC_PNG,
        ratios3=ratios3,
        id_to_name=id_to_name,
        title_suffix=f"K={n_clusters}",
        id_to_short=id_to_short,
        embed_cluster_labels=None,
        max_points=pc3d_max_points,
        plot_jitter_frac=pc3d_plot_jitter_frac,
    )
    log(f"Saved semantic 3D K-means scatter -> {OUT_04_SEMANTIC_PNG}")

    try:
        write_kmeans_pc3d_interactive_html(
            X,
            labels,
            df_merge,
            path_html=OUT_04_PC3D_KMEANS_INTERACTIVE_HTML,
            path_rows_json=OUT_04_PC3D_KMEANS_INTERACTIVE_ROWS_JSON,
            ratios3=ratios3,
            title_suffix=f"K={n_clusters}",
            id_to_short=id_to_short,
            max_points=pc3d_max_points,
            plot_jitter_frac=pc3d_plot_jitter_frac,
        )
        log(f"Saved interactive 3D K-means PCA -> {OUT_04_PC3D_KMEANS_INTERACTIVE_HTML}")
    except ImportError as exc:
        warn = f"Skipped K-means interactive HTML (install plotly): {exc}"
        log(f"WARN: {warn}")
        print(warn, file=sys.stderr)

    save_cluster_legend_table_png(OUT_04_LEGEND_PNG, id_to_short=id_to_short)
    log(f"Saved legend table -> {OUT_04_LEGEND_PNG}")

    _write_readme(k=n_clusters, n=n, n_clusters=n_clusters)
    log(f"Wrote readme -> {OUT_06_README}")

    _write_per_cluster_layer_a_full(df_merge, log=log)

    print(
        "PhilGEPS step 06 done. "
        f"Clusters interpreted: {n_clusters}; "
        f"semantic map: {OUT_06_SEMANTIC_MAP_CSV}; "
        f"profiles: {OUT_06_THEME_PROFILES_CSV}; "
        f"backtrack+Layer A+procurement: {OUT_06_BACKTRACK_LAYER_A_CSV}; "
        f"column map: {OUT_06_BACKTRACK_LAYER_A_COLUMN_MAP_CSV}; "
        f"per-cluster full: {PATH_OUT_06_PER_CLUSTER_FULL}; "
        f"EDA: {PATH_RES_06_EDA}; numeric 3D: {OUT_04_NUMERIC_PNG}; interactive 3D: {OUT_04_PC3D_KMEANS_INTERACTIVE_HTML}; "
        f"semantic 3D: {OUT_04_SEMANTIC_PNG}; "
        f"logs: {PATH_LOGS_06}.",
        flush=True,
    )
    log(f"Step 06 complete. n_clusters={n_clusters}")
    _ = df_assign  # silence unused-var warnings; df_assign carries `row_index` for audit only


def main() -> None:
    parser = argparse.ArgumentParser(
        description="PhilGEPS step 06 — Cluster interpretation and semantic-labeled PCA scatter.",
    )
    parser.add_argument(
        "--pc3d-max-points",
        type=int,
        default=PC3D_MAX_POINTS_DEFAULT,
        metavar="N",
        help=f"Max points in semantic 3D scatter (0 = all rows; default {PC3D_MAX_POINTS_DEFAULT}).",
    )
    parser.add_argument(
        "--pc3d-plot-jitter-frac",
        type=float,
        default=PC3D_PLOT_JITTER_FRAC_DEFAULT,
        metavar="F",
        help=(
            "Plot-only Gaussian jitter (matches step 03/04; default "
            f"{PC3D_PLOT_JITTER_FRAC_DEFAULT}; 0 = no jitter)."
        ),
    )
    args = parser.parse_args()
    jf = float(args.pc3d_plot_jitter_frac)
    if not math.isfinite(jf) or jf < 0.0:
        print("--pc3d-plot-jitter-frac must be a finite number >= 0.", file=sys.stderr)
        sys.exit(2)

    _ensure_tree()
    term_log = os.path.join(
        PATH_LOG_TERMINAL_06, "06_cluster_interpretation_philgeps_terminal.txt",
    )
    with tee_stdio_to_file(term_log):
        run_step06(
            pc3d_max_points=int(args.pc3d_max_points),
            pc3d_plot_jitter_frac=jf,
        )


if __name__ == "__main__":
    main()
