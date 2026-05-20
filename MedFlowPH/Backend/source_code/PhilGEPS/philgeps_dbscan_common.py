"""Shared paths, logging, PCA 3D plotting, and DBSCAN evaluation helpers (steps 04B–06B)."""

from __future__ import annotations

import inspect
import json
import math
import os
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401
from sklearn.cluster import DBSCAN
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score, silhouette_score
from sklearn.neighbors import NearestNeighbors

from philgeps_kmeans_common import (
    KMEANS_PC3D_CLICK_FIELDS,
    MEDFLOW_ROOT,
    PC3D_MAX_POINTS_DEFAULT,
    PC3D_PLOT_JITTER_FRAC_DEFAULT,
    RANDOM_SEED,
    _cluster_tab20_rgba,
    _json_scalar_click,
    _wide_merge_click_column_map,
    _wrap_legend_text,
    ensure_dirs,
    ensure_log_tree,
    load_backtrack_frame,
    load_pc_scores,
    load_pca_ratios3,
    open_activity_log,
    pc3_subsample_jittered,
    set_3d_axis_limits_tight,
    set_axes_labels_3d_ratios,
    tee_stdio_to_file,
)

# --- Step 04B / 05B / 06B roots ---
PATH_OUTPUT_04B = os.path.join(MEDFLOW_ROOT, "output_source", "04B")
PATH_RESULTS_04B = os.path.join(MEDFLOW_ROOT, "results", "04B")
PATH_OUTPUT_05B = os.path.join(MEDFLOW_ROOT, "output_source", "05B")
PATH_RESULTS_05B = os.path.join(MEDFLOW_ROOT, "results", "05B")
PATH_OUTPUT_06B = os.path.join(MEDFLOW_ROOT, "output_source", "06B")
PATH_RESULTS_06B = os.path.join(MEDFLOW_ROOT, "results", "06B")

PATH_LOGS_04B = os.path.join(MEDFLOW_ROOT, "logs", "04B")
PATH_LOGS_05B = os.path.join(MEDFLOW_ROOT, "logs", "05B")
PATH_LOGS_06B = os.path.join(MEDFLOW_ROOT, "logs", "06B")

PATH_OUT_04B_DBSCAN = os.path.join(PATH_OUTPUT_04B, "DBSCAN")
PATH_OUT_04B_BACKTRACK = os.path.join(PATH_OUTPUT_04B, "Backtrack")
PATH_OUT_04B_PER_CLUSTER = os.path.join(PATH_OUTPUT_04B, "per_cluster")
PATH_RES_04B_PCA_CLUSTER = os.path.join(PATH_RESULTS_04B, "PCA_Cluster")
PATH_RES_04B_SUMMARIES = os.path.join(PATH_RESULTS_04B, "Summaries")

PATH_OUT_05B_EVAL = os.path.join(PATH_OUTPUT_05B, "DBSCAN_Evaluation")
PATH_RES_05B_EVAL = os.path.join(PATH_RESULTS_05B, "DBSCAN_Evaluation")
PATH_RES_05B_EDA = os.path.join(PATH_RESULTS_05B, "EDA")

PATH_OUT_06B_INTERP = os.path.join(PATH_OUTPUT_06B, "Interpretation")
PATH_RES_06B_INTERP = os.path.join(PATH_RESULTS_06B, "Cluster_Interpretation")
PATH_RES_06B_EDA = os.path.join(PATH_RES_06B_INTERP, "EDA")

OUT_04B_ASSIGNMENTS_CSV = os.path.join(PATH_OUT_04B_DBSCAN, "philgeps_dbscan_assignments.csv")
OUT_04B_BACKTRACK_CSV = os.path.join(PATH_OUT_04B_BACKTRACK, "philgeps_dbscan_backtrack.csv")
OUT_04B_CLUSTER_COUNTS_JSON = os.path.join(PATH_RES_04B_SUMMARIES, "dbscan_cluster_counts.json")
OUT_04B_NUMERIC_PNG = os.path.join(PATH_RES_04B_PCA_CLUSTER, "pca_space_pc123_3d_dbscan_numeric.png")
OUT_04B_SEMANTIC_PNG = os.path.join(PATH_RES_04B_PCA_CLUSTER, "pca_space_pc123_3d_dbscan_semantic.png")
OUT_04B_SEMANTIC_LEGEND_TABLE_TXT = os.path.join(
    PATH_RES_04B_PCA_CLUSTER, "dbscan_semantic_legend_table.txt",
)
OUT_04B_PC3D_DBSCAN_INTERACTIVE_HTML = os.path.join(
    PATH_RES_04B_PCA_CLUSTER, "pca_space_pc123_3d_dbscan_interactive.html",
)
OUT_04B_PC3D_DBSCAN_INTERACTIVE_ROWS_JSON = os.path.join(
    PATH_RES_04B_PCA_CLUSTER, "pca_space_pc123_3d_dbscan_interactive_rows.json",
)
OUT_04B_README = os.path.join(PATH_RES_04B_SUMMARIES, "dbscan_implementation_readme.txt")

PATH_LOG_TERMINAL_04B = os.path.join(PATH_LOGS_04B, "Terminal Logs")
PATH_LOG_ENTRIES_04B = os.path.join(PATH_LOGS_04B, "Log entries")

OUT_05B_METRICS_GRID_CSV = os.path.join(PATH_OUT_05B_EVAL, "dbscan_metrics_grid.csv")
OUT_05B_SELECTION_SUMMARY_JSON = os.path.join(PATH_OUT_05B_EVAL, "dbscan_selection_summary.json")
OUT_05B_README = os.path.join(PATH_OUT_05B_EVAL, "dbscan_evaluation_readme.txt")

PATH_LOG_TERMINAL_05B = os.path.join(PATH_LOGS_05B, "Terminal Logs")
PATH_LOG_ENTRIES_05B = os.path.join(PATH_LOGS_05B, "Log entries")

OUT_06B_SEMANTIC_MAP_CSV = os.path.join(PATH_OUT_06B_INTERP, "dbscan_cluster_semantic_map.csv")
OUT_06B_THEME_PROFILES_CSV = os.path.join(PATH_OUT_06B_INTERP, "dbscan_cluster_theme_profiles.csv")
OUT_06B_BACKTRACK_LAYER_A_CSV = os.path.join(PATH_OUT_06B_INTERP, "philgeps_dbscan_backtrack_layer_a.csv")
PATH_OUT_06B_PER_CLUSTER_FULL = os.path.join(PATH_OUT_06B_INTERP, "per_cluster_full")
OUT_06B_README = os.path.join(PATH_RES_06B_INTERP, "dbscan_interpretation_readme.txt")

PATH_LOG_TERMINAL_06B = os.path.join(PATH_LOGS_06B, "Terminal Logs")
PATH_LOG_ENTRIES_06B = os.path.join(PATH_LOGS_06B, "Log entries")

PATH_OUTPUT_07 = os.path.join(MEDFLOW_ROOT, "output_source", "07", "Model_Comparison")
PATH_RESULTS_07 = os.path.join(MEDFLOW_ROOT, "results", "07", "Model_Comparison")

DBSCAN_NOISE_LABEL = -1
DEFAULT_EPS_FALLBACK = 0.15
DEFAULT_MIN_SAMPLES_FALLBACK = 20
DBSCAN_PLOT_OTHER_LEGEND = "Other DBSCAN clusters"
DBSCAN_PLOT_NOISE_LEGEND = "Noise / outliers"
DEFAULT_DBSCAN_PLOT_TOP_N = 5
DEFAULT_DBSCAN_NOISE_ALPHA = 0.15
DEFAULT_DBSCAN_OTHER_ALPHA = 0.25
DEFAULT_DBSCAN_TOP_ALPHA = 0.85
DEFAULT_DBSCAN_LEGEND_LABEL_MAX_LEN = 35
DBSCAN_NOISE_GRAY = (0.78, 0.78, 0.78, 1.0)
DBSCAN_OTHER_FACE = (0.55, 0.68, 0.82, 1.0)
DBSCAN_SCATTER_NOISE_S = 12.0
DBSCAN_SCATTER_OTHER_S = 15.0
DBSCAN_SCATTER_TOP_S = 28.0

# Interactive Plotly: JSON keys / click panel order (wide-merge procurement + PCA / cluster IDs).
DBSCAN_PC3D_JSON_FIELDS: tuple[str, ...] = (
    "row_index",
    "display_group",
    "cluster_id",
    "is_noise",
    "Procuring Entity",
    "Region",
    "Notice Status",
    "Contract Amount",
    "Approved Budget of the Contract",
    "Awardee Organization Name",
    "Region of Awardee",
    "PC1",
    "PC2",
    "PC3",
)
DBSCAN_DISPLAY_NOISE = "Noise (-1)"
DBSCAN_PC3D_OTHER_GROUP = DBSCAN_PLOT_OTHER_LEGEND

EPS_GRID_DEFAULT: tuple[float, ...] = (
    0.05,
    0.075,
    0.10,
    0.125,
    0.15,
    0.175,
    0.20,
    0.25,
    0.30,
    0.40,
    0.50,
)
MIN_SAMPLES_GRID_DEFAULT: tuple[int, ...] = (5, 10, 20, 30, 50, 100)

METRICS_SUBSAMPLE_DEFAULT_DBSCAN = 80_000


def dbscan_constructor_kwargs(*, metric: str = "euclidean", n_jobs: int = -1) -> dict[str, Any]:
    """Pass n_jobs only when this sklearn build supports it."""
    kw: dict[str, Any] = {"metric": metric}
    try:
        sig = inspect.signature(DBSCAN.__init__)
        if "n_jobs" in sig.parameters:
            kw["n_jobs"] = n_jobs
    except (TypeError, ValueError):
        pass
    return kw


def dbscan_fit_predict(
    X: np.ndarray,
    *,
    eps: float,
    min_samples: int,
    metric: str = "euclidean",
    n_jobs: int = 1,
    dtype=np.float32,
) -> np.ndarray:
    """Fit DBSCAN; default ``float32`` + ``n_jobs=1`` lowers peak RAM on large ``n``."""
    kw = dbscan_constructor_kwargs(metric=metric, n_jobs=n_jobs)
    Xw = np.ascontiguousarray(X, dtype=dtype)
    clf = DBSCAN(eps=float(eps), min_samples=int(min_samples), **kw)
    lab = clf.fit_predict(Xw)
    return np.asarray(lab, dtype=np.int64)


FULL_DATA_EPS_PROBE_N_THRESHOLD = 150_000


def probe_shrink_eps_for_full_data(
    X: np.ndarray,
    eps: float,
    *,
    min_samples: int,
    metric: str = "euclidean",
    n_threshold: int = FULL_DATA_EPS_PROBE_N_THRESHOLD,
    sample_size: int = 25_000,
    max_neighbors_full_budget: int = 2_200,
    shrink_factor: float = 0.82,
    max_iters: int = 56,
    seed: int = RANDOM_SEED,
) -> tuple[float, str]:
    """Lower *eps* so local neighborhoods stay sparse enough for full *n* (RAM-safe).

    Step 05B picks *eps* on a subsample; the same *eps* on ``n`` rows can connect far more
    neighbors per point. We probe on a fixed-size subsample but cap **max neighbor count**
    at roughly ``max_neighbors_full_budget * (sample_size / n)``, clamped to at least
    ``min_samples + 2``, then shrink *eps* until that subsample cap holds.
    """
    n = int(X.shape[0])
    if n <= n_threshold or not math.isfinite(eps) or eps <= 0:
        return float(eps), "no_shrink_small_n_or_eps"
    sample_size = int(min(sample_size, n))
    rng = np.random.default_rng(seed)
    idx = rng.choice(n, size=sample_size, replace=False)
    Xs = np.ascontiguousarray(X[idx], dtype=np.float32)
    cap_full = max(100, int(max_neighbors_full_budget))
    target_sample_max = max(
        int(min_samples) + 2,
        int(cap_full * sample_size / max(n, 1)),
    )
    nn = NearestNeighbors(metric=metric, n_jobs=1, algorithm="auto")
    nn.fit(Xs)
    orig_eps = float(eps)
    eff = orig_eps
    for _ in range(max_iters):
        neigh = nn.radius_neighbors(Xs, radius=eff, return_distance=False)
        mx = int(max((len(x) for x in neigh), default=0))
        if mx <= target_sample_max:
            if abs(eff - orig_eps) < 1e-15:
                return eff, (
                    f"probe_ok_no_change(target_sample_max={target_sample_max},"
                    f"sample_n={sample_size},budget_full~{cap_full})"
                )
            return eff, (
                f"shrunk_for_full_n(sample_n={sample_size},target_sample_max={target_sample_max},"
                f"budget_full~{cap_full},metric={metric})"
            )
        eff *= shrink_factor
        if eff < 1e-14:
            break
    return float(eff), "shrink_exhausted_iters_still_dense_try_manual_eps"


def zscore_series_across_grid(v: np.ndarray) -> np.ndarray:
    """Z-score finite values; non-finite positions stay NaN."""
    x = np.asarray(v, dtype=np.float64)
    mask = np.isfinite(x)
    out = np.full_like(x, np.nan, dtype=np.float64)
    if not np.any(mask):
        return out
    mu = float(np.nanmean(x[mask]))
    sd = float(np.nanstd(x[mask], ddof=0))
    if not math.isfinite(sd) or sd < 1e-15:
        out[mask] = 0.0
        return out
    out[mask] = (x[mask] - mu) / sd
    return out


def dbscan_row_stats(
    labels: np.ndarray,
    *,
    n_total: int | None = None,
) -> dict[str, Any]:
    """Counts and shares for a label vector (includes noise -1)."""
    lab = np.asarray(labels, dtype=np.int64)
    n = int(lab.shape[0]) if n_total is None else int(n_total)
    noise_m = lab == DBSCAN_NOISE_LABEL
    n_noise = int(np.sum(noise_m))
    noise_share = float(n_noise / n) if n else float("nan")
    uniq_all = np.unique(lab)
    non_noise = uniq_all[uniq_all != DBSCAN_NOISE_LABEL]
    n_clusters_excl = int(non_noise.size)
    labs_nn = lab[~noise_m]
    if labs_nn.size == 0:
        largest_cluster_share = float("nan")
    else:
        vc = np.unique(labs_nn, return_counts=True)
        largest_cluster_share = float(vc[1].max() / labs_nn.size)
    return {
        "n_clusters_excluding_noise": n_clusters_excl,
        "n_noise": n_noise,
        "noise_share": noise_share,
        "largest_cluster_share": largest_cluster_share,
    }


def metrics_excluding_noise(
    X: np.ndarray,
    labels: np.ndarray,
    *,
    metric: str = "euclidean",
) -> tuple[float, float, float, str]:
    """Silhouette, Davies–Bouldin, Calinski–Harabasz on non-noise points only."""
    X = np.asarray(X, dtype=np.float64)
    lab = np.asarray(labels, dtype=np.int64)
    m = lab != DBSCAN_NOISE_LABEL
    if not np.any(m):
        return float("nan"), float("nan"), float("nan"), "only noise (-1): no metrics"
    Xn = X[m]
    yn = lab[m]
    uniq = np.unique(yn)
    if uniq.size < 2:
        return float("nan"), float("nan"), float("nan"), "fewer than 2 non-noise clusters: metrics undefined"
    sil = float("nan")
    db = float("nan")
    ch = float("nan")
    try:
        sil = float(silhouette_score(Xn, yn, metric=metric))
    except Exception:  # noqa: BLE001
        pass
    try:
        db = float(davies_bouldin_score(Xn, yn))
    except Exception:  # noqa: BLE001
        pass
    try:
        ch = float(calinski_harabasz_score(Xn, yn))
    except Exception:  # noqa: BLE001
        pass
    return sil, db, ch, "ok"


def evaluate_dbscan_params(
    X_sub: np.ndarray,
    *,
    eps: float,
    min_samples: int,
    metric: str = "euclidean",
    n_jobs: int = 1,
) -> dict[str, Any]:
    """One grid cell: fit DBSCAN on ``X_sub`` and summarize."""
    labels = dbscan_fit_predict(
        X_sub, eps=eps, min_samples=min_samples, metric=metric, n_jobs=n_jobs,
    )
    stats = dbscan_row_stats(labels, n_total=int(X_sub.shape[0]))
    sil, db, ch, st = metrics_excluding_noise(X_sub, labels, metric=metric)
    status = st
    if st == "ok":
        if not math.isfinite(sil) or not math.isfinite(db) or not math.isfinite(ch):
            status = "metrics unavailable after fit"
    row: dict[str, Any] = {
        "eps": float(eps),
        "min_samples": int(min_samples),
        "n_clusters_excluding_noise": int(stats["n_clusters_excluding_noise"]),
        "n_noise": int(stats["n_noise"]),
        "noise_share": float(stats["noise_share"]),
        "largest_cluster_share": float(stats["largest_cluster_share"]),
        "silhouette": sil,
        "davies_bouldin": db,
        "calinski_harabasz": ch,
        "status": status,
    }
    return row


def add_dbscan_composite(df: pd.DataFrame) -> pd.DataFrame:
    """composite = z_sil + z_ch - z_db - abs(noise_share - 0.10)."""
    dfc = df.copy()
    z_s = zscore_series_across_grid(dfc["silhouette"].to_numpy())
    z_db = zscore_series_across_grid(dfc["davies_bouldin"].to_numpy())
    z_ch = zscore_series_across_grid(dfc["calinski_harabasz"].to_numpy())
    ns = dfc["noise_share"].to_numpy(dtype=np.float64)
    noise_term = np.abs(ns - 0.10)
    comp = z_s + z_ch - z_db - noise_term
    mask_fin = (
        np.isfinite(z_s) & np.isfinite(z_db) & np.isfinite(z_ch) & np.isfinite(ns)
    )
    comp = np.where(mask_fin, comp, np.nan)
    dfc["composite"] = comp
    return dfc


def mark_valid_dbscan_candidates(df: pd.DataFrame) -> pd.DataFrame:
    """Validity rules + valid_candidate bool column."""
    dfc = df.copy()
    v = (
        (dfc["n_clusters_excluding_noise"] >= 2)
        & (dfc["noise_share"] <= 0.40)
        & (dfc["largest_cluster_share"] <= 0.85)
    )
    dfc["valid_candidate"] = v
    return dfc


def pick_dbscan_params(df: pd.DataFrame) -> tuple[float, int, str, bool, pd.Series | None]:
    """Return chosen (eps, min_samples, method, fallback_used, best_row)."""
    if df.empty:
        raise ValueError("empty metrics grid")
    work = mark_valid_dbscan_candidates(add_dbscan_composite(df))
    ok = work.loc[work["valid_candidate"] & np.isfinite(work["composite"])]
    if not ok.empty:
        i = int(ok["composite"].idxmax())
        row = work.loc[i]
        return float(row["eps"]), int(row["min_samples"]), "composite_valid_rules", False, row
    ok_sil = work.loc[work["valid_candidate"] & np.isfinite(work["silhouette"])]
    if not ok_sil.empty:
        i = int(ok_sil["silhouette"].idxmax())
        row = work.loc[i]
        return float(row["eps"]), int(row["min_samples"]), "silhouette_valid_rules", False, row
    fb = work.loc[
        (work["n_clusters_excluding_noise"] >= 2) & np.isfinite(work["noise_share"])
    ].sort_values(
        ["noise_share", "composite"],
        ascending=[True, False],
        kind="mergesort",
    )
    if fb.empty:
        any_two = work.loc[work["n_clusters_excluding_noise"] >= 2]
        if any_two.empty:
            rest = work.sort_values("noise_share", ascending=True, kind="mergesort")
            row = rest.iloc[0]
            return float(row["eps"]), int(row["min_samples"]), "fallback_min_noise_any_k", True, row
        row = any_two.sort_values("noise_share", ascending=True, kind="mergesort").iloc[0]
        return float(row["eps"]), int(row["min_samples"]), "fallback_min_noise_ge2", True, row
    row = fb.iloc[0]
    return float(row["eps"]), int(row["min_samples"]), "fallback_min_noise_ge2", True, row


def load_dbscan_selection_summary(
    path: str = OUT_05B_SELECTION_SUMMARY_JSON,
) -> dict[str, Any] | None:
    if not os.path.isfile(path):
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def resolve_eps_min_samples_defaults(
    *,
    eps_cli: float | None,
    min_samples_cli: int | None,
    summary_path: str = OUT_05B_SELECTION_SUMMARY_JSON,
) -> tuple[float, int, str]:
    """CLI overrides; else step 05B JSON; else safe defaults."""
    if eps_cli is not None and min_samples_cli is not None:
        return float(eps_cli), int(min_samples_cli), "cli"
    summary = load_dbscan_selection_summary(summary_path)
    eps = DEFAULT_EPS_FALLBACK
    ms = DEFAULT_MIN_SAMPLES_FALLBACK
    src = "defaults_no_summary"
    if summary is not None:
        src = "step_05b_summary_partial"
        if "chosen_eps" in summary:
            eps = float(summary["chosen_eps"])
        if "chosen_min_samples" in summary:
            ms = int(summary["chosen_min_samples"])
        if "chosen_eps" in summary and "chosen_min_samples" in summary:
            src = "step_05b_summary"
    if eps_cli is not None:
        eps = float(eps_cli)
        src = "cli_partial" if src != "cli" else src
    if min_samples_cli is not None:
        ms = int(min_samples_cli)
        src = "cli_partial" if src not in ("cli",) else src
    return eps, ms, src


def dbscan_top_nonnoise_cluster_ids_by_count(labels: np.ndarray, top_n: int) -> list[int]:
    """Largest non-noise cluster_ids by full-data count (deterministic tie-break: cluster_id)."""
    if top_n < 1:
        return []
    lab = np.asarray(labels, dtype=np.int64)
    nn = lab[lab != DBSCAN_NOISE_LABEL]
    if nn.size == 0:
        return []
    uniq_nn, counts = np.unique(nn, return_counts=True)
    order = np.lexsort((uniq_nn.astype(np.int64), -counts.astype(np.int64)))
    take = order[:top_n]
    return [int(uniq_nn[i]) for i in take]


def make_dbscan_display_groups(
    labels: np.ndarray,
    top_n: int = 5,
) -> tuple[np.ndarray, list[str], list[int]]:
    """Map each row to a **display_group** string for readable DBSCAN visuals (plot only).

    Top clusters by full-data count become ``C<id>``; noise is ``Noise (-1)``; all other dense
    labels map to ``Other DBSCAN clusters``.

    Returns:
        display_group: length-``n`` object array of strings.
        display_order: canonical trace / legend order (noise, top ``C`` ids, other).
        top_cluster_ids: selected dense cluster ids (largest counts, excluding -1).
    """
    if int(top_n) < 1:
        raise ValueError("make_dbscan_display_groups requires top_n >= 1")
    lab = np.asarray(labels, dtype=np.int64)
    top_cluster_ids = dbscan_top_nonnoise_cluster_ids_by_count(lab, int(top_n))
    top_set = frozenset(int(x) for x in top_cluster_ids)
    n = int(lab.shape[0])
    display_group = np.empty(n, dtype=object)
    for i in range(n):
        c = int(lab[i])
        if c == DBSCAN_NOISE_LABEL:
            display_group[i] = DBSCAN_DISPLAY_NOISE
        elif c in top_set:
            display_group[i] = f"C{c}"
        else:
            display_group[i] = DBSCAN_PC3D_OTHER_GROUP
    display_order: list[str] = [DBSCAN_DISPLAY_NOISE]
    display_order.extend(f"C{cid}" for cid in top_cluster_ids)
    display_order.append(DBSCAN_PC3D_OTHER_GROUP)
    return display_group, display_order, top_cluster_ids


def truncate_dbscan_legend_label(text: str, max_len: int) -> str:
    """Shorten legend text; add ellipsis when over ``max_len``."""
    t = (text or "").strip()
    if max_len <= 0 or len(t) <= max_len:
        return t
    if max_len <= 3:
        return t[:max_len]
    return t[: max_len - 3].rstrip() + "..."


def _dbscan_legend_entry_simplified(
    cid: int,
    *,
    id_to_legend_display: dict[int, str] | None,
    id_to_short: dict[int, str] | None,
    legend_label_max_len: int,
) -> str:
    if int(cid) == DBSCAN_NOISE_LABEL:
        return DBSCAN_PLOT_NOISE_LEGEND
    if id_to_legend_display is not None and int(cid) in id_to_legend_display:
        return truncate_dbscan_legend_label(
            id_to_legend_display[int(cid)], legend_label_max_len,
        )
    if id_to_short is not None:
        raw = id_to_short.get(int(cid)) or f"C{int(cid)}"
    else:
        raw = f"C{int(cid)}"
    return truncate_dbscan_legend_label(raw, legend_label_max_len)


def save_dbscan_semantic_legend_table(
    path: str,
    *,
    labels_full: np.ndarray,
    semantic_df: pd.DataFrame,
    id_to_base_title: dict[int, str],
    top_cluster_ids: list[int],
    legend_label_max_len: int,
) -> None:
    """Write a tab-separated reference table (UTF-8 text) for grouped DBSCAN semantic legend."""
    lab = np.asarray(labels_full, dtype=np.int64)
    n_total = int(lab.shape[0])
    uniq, cnts = np.unique(lab, return_counts=True)
    count_map: dict[int, int] = {int(u): int(c) for u, c in zip(uniq, cnts)}
    sem_idx = semantic_df.drop_duplicates("cluster_id").set_index("cluster_id", drop=False)

    def full_label(cid_i: int) -> str:
        if cid_i in sem_idx.index:
            return str(sem_idx.loc[cid_i, "cluster_label"])
        return ""

    def rationale(cid_i: int) -> str:
        if cid_i in sem_idx.index:
            return str(sem_idx.loc[cid_i, "rationale_short"])
        return ""

    top_set = set(int(x) for x in top_cluster_ids)
    records: list[list[str]] = []

    def add_row(display: str, cid_i: int) -> None:
        c = int(count_map.get(cid_i, 0))
        sh = (c / n_total) if n_total else 0.0
        rat = rationale(cid_i).replace("\n", " ")
        if len(rat) > 280:
            rat = rat[:277] + "..."
        records.append(
            [
                display,
                str(cid_i),
                full_label(cid_i),
                rat,
                f"{c:,}",
                f"{100.0 * sh:.3f}%",
            ],
        )

    if DBSCAN_NOISE_LABEL in count_map:
        add_row(DBSCAN_PLOT_NOISE_LEGEND, DBSCAN_NOISE_LABEL)

    for cid in top_cluster_ids:
        cid = int(cid)
        if cid not in count_map:
            continue
        base = (id_to_base_title.get(cid) or "").strip()
        disp = f"C{cid}: {base}".strip().strip(":")
        disp = truncate_dbscan_legend_label(disp, legend_label_max_len)
        add_row(disp, cid)

    for cid in sorted(count_map.keys()):
        if cid == DBSCAN_NOISE_LABEL:
            continue
        if cid in top_set:
            continue
        add_row(DBSCAN_PLOT_OTHER_LEGEND, cid)

    if not records:
        return

    col_labels = [
        "Display group",
        "Actual cluster_id",
        "Semantic label",
        "Short rationale",
        "Count",
        "Share",
    ]

    def _tsv_cell(s: str) -> str:
        t = str(s).replace("\r", " ").replace("\n", " ").replace("\t", " ")
        return t

    lines: list[str] = [
        "PhilGEPS DBSCAN — semantic legend reference (full labels vs grouped plot legend)",
        "Encoding: UTF-8. Delimiter: TAB. cluster_id = actual DBSCAN assignment; Display group = plot bucket.",
        "",
        "\t".join(_tsv_cell(c) for c in col_labels),
    ]
    for row in records:
        lines.append("\t".join(_tsv_cell(c) for c in row))

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(lines) + "\n")


def save_labeled_pc_scatter_3d_dbscan(
    pc3: np.ndarray,
    labels: np.ndarray,
    path: str,
    *,
    ratios3: list[float],
    plot_kind: str = "numeric",
    max_points: int = PC3D_MAX_POINTS_DEFAULT,
    plot_jitter_frac: float = PC3D_PLOT_JITTER_FRAC_DEFAULT,
    id_to_short: dict[int, str] | None = None,
    id_to_legend_display: dict[int, str] | None = None,
    noise_marker: str = "x",
    legend_top_n: int | None = None,
    noise_alpha: float = DEFAULT_DBSCAN_NOISE_ALPHA,
    other_alpha: float = DEFAULT_DBSCAN_OTHER_ALPHA,
    top_alpha: float = DEFAULT_DBSCAN_TOP_ALPHA,
    legend_label_max_len: int = DEFAULT_DBSCAN_LEGEND_LABEL_MAX_LEN,
    eps: float | None = None,
    min_samples: int | None = None,
) -> None:
    """3D DBSCAN PCA scatter — thesis/website layout (short title, caption, outside legend).

    If ``legend_top_n`` is a positive integer, **grouped** legend: noise, top ``N`` non-noise
    clusters by full-data count, and ``Other DBSCAN clusters``. Draw order is noise, other, top
    (top drawn last so dense clusters stay visible). Assignments are unchanged (plot only).
    If ``legend_top_n`` is ``None`` or ``<= 0``, every cluster_id gets a legend entry (legacy).
    """
    labels_full = np.asarray(labels, dtype=np.int64)
    Xdraw, iloc_idx, n_plot = pc3_subsample_jittered(
        pc3, max_points=max_points, plot_jitter_frac=plot_jitter_frac,
    )
    labs = np.asarray(labels_full[iloc_idx], dtype=np.int64)
    n_total = int(np.asarray(pc3).shape[0])
    uniq_full = np.unique(labels_full)
    n_clusters_excl = int(np.sum(uniq_full != DBSCAN_NOISE_LABEL))

    simplified = legend_top_n is not None and int(legend_top_n) > 0
    top_ids: list[int] = []
    top_arr = np.empty(0, dtype=np.int64)
    if simplified:
        top_ids = dbscan_top_nonnoise_cluster_ids_by_count(labels_full, int(legend_top_n))
        top_arr = np.array(top_ids, dtype=np.int64) if top_ids else np.empty(0, dtype=np.int64)

    is_semantic = str(plot_kind).lower() == "semantic"
    main_title = (
        "DBSCAN PCA 3D — semantic grouped view"
        if is_semantic
        else "DBSCAN PCA 3D — grouped view"
    )
    main_title_legacy = (
        "DBSCAN PCA 3D — semantic full legend"
        if is_semantic
        else "DBSCAN PCA 3D — full legend"
    )

    fig = plt.figure(figsize=(13.0, 8.0))
    ax = fig.add_subplot(111, projection="3d")
    cmap = plt.get_cmap("tab20")
    noise_rgba = np.asarray(DBSCAN_NOISE_GRAY, dtype=np.float64)
    other_rgba = np.asarray(DBSCAN_OTHER_FACE, dtype=np.float64)
    handles: list[Any] = []
    legend_labels: list[str] = []

    if not simplified:
        fig.suptitle(main_title_legacy, fontsize=14, y=0.985)
        ordered = list(np.unique(labs))
        ordered.sort(key=lambda c: (0 if int(c) == DBSCAN_NOISE_LABEL else 1, int(c)))
        for c in ordered:
            m = labs == c
            if not np.any(m):
                continue
            if int(c) == DBSCAN_NOISE_LABEL:
                h = ax.scatter(
                    Xdraw[m, 0],
                    Xdraw[m, 1],
                    Xdraw[m, 2],
                    s=DBSCAN_SCATTER_NOISE_S,
                    alpha=float(noise_alpha),
                    color=noise_rgba,
                    marker=noise_marker,
                    linewidths=0.55,
                    zorder=1,
                )
                if id_to_short is not None:
                    leg0 = id_to_short.get(DBSCAN_NOISE_LABEL, DBSCAN_PLOT_NOISE_LEGEND)
                else:
                    leg0 = DBSCAN_PLOT_NOISE_LEGEND
                leg = truncate_dbscan_legend_label(str(leg0), legend_label_max_len)
            else:
                color = cmap((int(c) % 20) / 20.0 + 0.001)
                h = ax.scatter(
                    Xdraw[m, 0],
                    Xdraw[m, 1],
                    Xdraw[m, 2],
                    s=DBSCAN_SCATTER_TOP_S,
                    alpha=float(top_alpha),
                    color=color,
                    linewidths=0,
                    edgecolors="none",
                    marker="o",
                    zorder=2,
                )
                if id_to_short is not None:
                    leg = truncate_dbscan_legend_label(
                        id_to_short.get(int(c)) or f"C{int(c)}", legend_label_max_len,
                    )
                else:
                    leg = truncate_dbscan_legend_label(f"C{int(c)}", legend_label_max_len)
            handles.append(h)
            legend_labels.append(leg)
    else:
        fig.suptitle(main_title, fontsize=14, y=0.985)
        has_noise = bool(np.any(labs == DBSCAN_NOISE_LABEL))
        has_other = bool(np.any((labs != DBSCAN_NOISE_LABEL) & (~np.isin(labs, top_arr))))

        h_noise = None
        h_other = None
        top_handles: list[Any] = []
        top_legends: list[str] = []

        if has_noise:
            m = labs == DBSCAN_NOISE_LABEL
            h_noise = ax.scatter(
                Xdraw[m, 0],
                Xdraw[m, 1],
                Xdraw[m, 2],
                s=DBSCAN_SCATTER_NOISE_S,
                alpha=float(noise_alpha),
                color=noise_rgba,
                marker=noise_marker,
                linewidths=0.55,
                zorder=1,
            )

        if has_other:
            m = (labs != DBSCAN_NOISE_LABEL) & (~np.isin(labs, top_arr))
            h_other = ax.scatter(
                Xdraw[m, 0],
                Xdraw[m, 1],
                Xdraw[m, 2],
                s=DBSCAN_SCATTER_OTHER_S,
                alpha=float(other_alpha),
                color=other_rgba,
                linewidths=0,
                edgecolors="none",
                marker=".",
                zorder=2,
            )

        for cid in top_ids:
            m = labs == int(cid)
            if not np.any(m):
                continue
            color = cmap((int(cid) % 20) / 20.0 + 0.001)
            h = ax.scatter(
                Xdraw[m, 0],
                Xdraw[m, 1],
                Xdraw[m, 2],
                s=DBSCAN_SCATTER_TOP_S,
                alpha=float(top_alpha),
                color=color,
                linewidths=0,
                edgecolors="none",
                marker="o",
                zorder=3,
            )
            top_handles.append(h)
            top_legends.append(
                _dbscan_legend_entry_simplified(
                    int(cid),
                    id_to_legend_display=id_to_legend_display,
                    id_to_short=id_to_short,
                    legend_label_max_len=legend_label_max_len,
                ),
            )

        if h_noise is not None:
            handles.append(h_noise)
            legend_labels.append(DBSCAN_PLOT_NOISE_LEGEND)
        handles.extend(top_handles)
        legend_labels.extend(top_legends)
        if h_other is not None:
            handles.append(h_other)
            legend_labels.append(DBSCAN_PLOT_OTHER_LEGEND)

    set_3d_axis_limits_tight(ax, Xdraw)
    set_axes_labels_3d_ratios(ax, ratios3)
    cum3 = float(sum(ratios3))

    if simplified and legend_top_n is not None:
        cap1 = (
            f"Noise + top {int(legend_top_n)} clusters + grouped minor clusters | "
            f"n_plot={n_plot:,} | total rows={n_total:,} | "
            f"3-PC variance={cum3:.3f} | clusters (excl. noise)={n_clusters_excl}"
        )
    else:
        cap1 = (
            f"Full cluster legend | n_plot={n_plot:,} | total rows={n_total:,} | "
            f"3-PC variance={cum3:.3f} | clusters (excl. noise)={n_clusters_excl}"
        )
    if eps is not None and min_samples is not None:
        fig.text(0.5, 0.928, cap1, ha="center", fontsize=9, wrap=False)
        fig.text(
            0.5,
            0.893,
            f"eps={float(eps):g}; min_samples={int(min_samples)}",
            ha="center",
            fontsize=8,
            color="0.32",
        )
    else:
        fig.text(0.5, 0.91, cap1, ha="center", fontsize=9, wrap=False)

    ax.view_init(elev=20, azim=30)
    ncol = min(3, max(len(handles), 1))
    leg = ax.legend(
        handles,
        legend_labels,
        loc="upper center",
        bbox_to_anchor=(0.5, 1.06),
        ncol=ncol,
        fontsize=8,
        framealpha=0.95,
    )
    if leg is not None:
        for t in leg.get_texts():
            t.set_ha("center")

    fig.subplots_adjust(top=0.82, bottom=0.08, left=0.02, right=0.98)
    fig.savefig(path, dpi=150, bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)


def save_labeled_pc_scatter_3d_dbscan_semantic(
    pc3: np.ndarray,
    labels: np.ndarray,
    path: str,
    *,
    ratios3: list[float],
    id_to_short: dict[int, str],
    id_to_legend_display: dict[int, str] | None = None,
    max_points: int = PC3D_MAX_POINTS_DEFAULT,
    plot_jitter_frac: float = PC3D_PLOT_JITTER_FRAC_DEFAULT,
    legend_top_n: int | None = None,
    noise_alpha: float = DEFAULT_DBSCAN_NOISE_ALPHA,
    other_alpha: float = DEFAULT_DBSCAN_OTHER_ALPHA,
    top_alpha: float = DEFAULT_DBSCAN_TOP_ALPHA,
    legend_label_max_len: int = DEFAULT_DBSCAN_LEGEND_LABEL_MAX_LEN,
    eps: float | None = None,
    min_samples: int | None = None,
) -> None:
    """Semantic short-legend variant; same grouped rules as the numeric plot."""
    save_labeled_pc_scatter_3d_dbscan(
        pc3,
        labels,
        path,
        ratios3=ratios3,
        plot_kind="semantic",
        max_points=max_points,
        plot_jitter_frac=plot_jitter_frac,
        id_to_short=id_to_short,
        id_to_legend_display=id_to_legend_display,
        legend_top_n=legend_top_n,
        noise_alpha=noise_alpha,
        other_alpha=other_alpha,
        top_alpha=top_alpha,
        legend_label_max_len=legend_label_max_len,
        eps=eps,
        min_samples=min_samples,
    )


def write_dbscan_pc3d_interactive_rows_json(
    df_merge: pd.DataFrame,
    iloc_idx: np.ndarray,
    *,
    labels_full: np.ndarray,
    display_group_full: np.ndarray,
    pc3: np.ndarray,
    out_path: str,
) -> None:
    """Subsample companion JSON for DBSCAN interactive HTML (lazy load on first click)."""
    col_map = _wide_merge_click_column_map(df_merge)
    rk_col = col_map["row_index"]
    lab = np.asarray(labels_full, dtype=np.int64)
    pc = np.asarray(pc3, dtype=np.float64)
    by_key: dict[str, Any] = {}
    for j in range(len(iloc_idx)):
        pos = int(iloc_idx[j])
        row = df_merge.iloc[pos]
        key = str(int(row[rk_col]))
        cid = int(lab[pos])
        rec: dict[str, Any] = {
            "row_index": _json_scalar_click(row[rk_col]),
            "display_group": str(display_group_full[pos]),
            "cluster_id": cid,
            "is_noise": bool(cid == DBSCAN_NOISE_LABEL),
        }
        for field in KMEANS_PC3D_CLICK_FIELDS:
            if field == "row_index":
                continue
            rec[field] = _json_scalar_click(row[col_map[field]])
        rec["PC1"] = float(pc[pos, 0])
        rec["PC2"] = float(pc[pos, 1])
        rec["PC3"] = float(pc[pos, 2])
        by_key[key] = {k: rec[k] for k in DBSCAN_PC3D_JSON_FIELDS}
    payload: dict[str, Any] = {
        "ok": True,
        "source_note": (
            "Subsample only. Keys match philgeps_dbscan_backtrack_layer_a row_index. "
            "cluster_id is the actual DBSCAN label; display_group matches the static semantic plot legend text."
        ),
        "fields": list(DBSCAN_PC3D_JSON_FIELDS),
        "n_points": len(by_key),
        "by_row_index": by_key,
    }
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))


def write_dbscan_pc3d_interactive_html(
    pc3: np.ndarray,
    labels: np.ndarray,
    wide_df: pd.DataFrame,
    html_path: str,
    rows_json_path: str,
    *,
    ratios3: list[float],
    id_to_legend_display: dict[int, str] | None = None,
    id_to_short: dict[int, str] | None = None,
    legend_label_max_len: int = DEFAULT_DBSCAN_LEGEND_LABEL_MAX_LEN,
    max_points: int = PC3D_MAX_POINTS_DEFAULT,
    plot_jitter_frac: float = PC3D_PLOT_JITTER_FRAC_DEFAULT,
    top_n: int = 5,
) -> bool:
    """Plotly 3D PCA — one trace per grouped bucket; legend matches static semantic PNG.

    Uses the same shortening rules as :func:`save_labeled_pc_scatter_3d_dbscan` (phrase map +
    ``id_to_short`` fallback + ``legend_label_max_len``).
    """
    try:
        import plotly.graph_objects as go  # type: ignore[import-untyped]
        import plotly.io as pio  # type: ignore[import-untyped]
    except ImportError:
        return False
    if int(top_n) < 1:
        raise ValueError("write_dbscan_pc3d_interactive_html requires top_n >= 1")
    n = int(pc3.shape[0])
    if len(wide_df) != n:
        raise ValueError(f"wide_df rows ({len(wide_df):,}) != PC scores ({n:,})")
    labels_full = np.asarray(labels, dtype=np.int64)
    top_cluster_ids = dbscan_top_nonnoise_cluster_ids_by_count(labels_full, int(top_n))
    top_arr = np.array(top_cluster_ids, dtype=np.int64) if top_cluster_ids else np.empty(0, dtype=np.int64)
    top_set = frozenset(int(x) for x in top_cluster_ids)
    leg_map = id_to_legend_display
    id_short = id_to_short
    leg_max = int(legend_label_max_len)

    display_legend_full = np.empty(n, dtype=object)
    for i in range(n):
        cid = int(labels_full[i])
        if cid == DBSCAN_NOISE_LABEL:
            display_legend_full[i] = DBSCAN_PLOT_NOISE_LEGEND
        elif cid in top_set:
            display_legend_full[i] = _dbscan_legend_entry_simplified(
                cid,
                id_to_legend_display=leg_map,
                id_to_short=id_short,
                legend_label_max_len=leg_max,
            )
        else:
            display_legend_full[i] = DBSCAN_PLOT_OTHER_LEGEND

    Xdraw, iloc_idx, n_plot = pc3_subsample_jittered(
        pc3, max_points=max_points, plot_jitter_frac=plot_jitter_frac,
    )
    col_map = _wide_merge_click_column_map(wide_df)
    rk_col = col_map["row_index"]
    sub_df = wide_df.iloc[iloc_idx]
    labs_sub = labels_full[iloc_idx]
    disp_leg_sub = np.asarray(display_legend_full[iloc_idx], dtype=str)
    row_keys = sub_df[rk_col].astype(np.int64).astype(str).to_numpy()
    r_col = col_map["Region"]
    ca_col = col_map["Contract Amount"]
    ab_col = col_map["Approved Budget of the Contract"]
    region_sub = sub_df[r_col].fillna("").astype(str).to_numpy()
    contract_sub = sub_df[ca_col].where(pd.notna(sub_df[ca_col]), "").astype(str).to_numpy()
    budget_sub = sub_df[ab_col].where(pd.notna(sub_df[ab_col]), "").astype(str).to_numpy()

    write_dbscan_pc3d_interactive_rows_json(
        wide_df,
        iloc_idx,
        labels_full=labels_full,
        display_group_full=display_legend_full,
        pc3=pc3,
        out_path=rows_json_path,
    )

    cmap = plt.get_cmap("tab20")
    traces: list[Any] = []

    def _scatter_trace(
        *,
        m: np.ndarray,
        legend_name: str,
        color: str,
        msize: float,
        mopacity: float,
        legendrank: int,
    ) -> None:
        if not np.any(m):
            return
        customdata = np.column_stack(
            [
                row_keys[m],
                disp_leg_sub[m],
                labs_sub[m].astype(str),
                np.where(labs_sub[m] == DBSCAN_NOISE_LABEL, "True", "False"),
                region_sub[m],
                contract_sub[m],
                budget_sub[m],
            ],
        )
        traces.append(
            go.Scatter3d(
                x=Xdraw[m, 0],
                y=Xdraw[m, 1],
                z=Xdraw[m, 2],
                mode="markers",
                name=_wrap_legend_text(legend_name, width=44),
                legendrank=int(legendrank),
                marker=dict(size=msize, color=color, opacity=mopacity, line=dict(width=0)),
                customdata=customdata,
                hovertemplate=(
                    "<b>%{fullData.name}</b><br>"
                    "display_group=%{customdata[1]}<br>"
                    "cluster_id=%{customdata[2]}<br>"
                    "is_noise=%{customdata[3]}<br>"
                    "row_index=%{customdata[0]}<br>"
                    "Region=%{customdata[4]}<br>"
                    "Contract Amount=%{customdata[5]}<br>"
                    "Approved Budget=%{customdata[6]}<br>"
                    "<extra></extra>"
                ),
            ),
        )

    other_legend_rank = 6000 + 20 * max(1, len(top_cluster_ids))

    _scatter_trace(
        m=labs_sub == DBSCAN_NOISE_LABEL,
        legend_name=DBSCAN_PLOT_NOISE_LEGEND,
        color="rgba(199,199,199,0.38)",
        msize=3,
        mopacity=0.2,
        legendrank=100,
    )
    _scatter_trace(
        m=(labs_sub != DBSCAN_NOISE_LABEL) & (~np.isin(labs_sub, top_arr)),
        legend_name=DBSCAN_PLOT_OTHER_LEGEND,
        color="rgba(95,95,95,0.82)",
        msize=4,
        mopacity=0.38,
        legendrank=other_legend_rank,
    )
    for rk, cid in enumerate(top_cluster_ids):
        cid = int(cid)
        m = labs_sub == cid
        if not np.any(m):
            continue
        rgba = _cluster_tab20_rgba(cid, cmap=cmap)
        color = "rgba({},{},{},{})".format(
            int(round(rgba[0] * 255)),
            int(round(rgba[1] * 255)),
            int(round(rgba[2] * 255)),
            0.78,
        )
        leg_name = _dbscan_legend_entry_simplified(
            cid,
            id_to_legend_display=leg_map,
            id_to_short=id_short,
            legend_label_max_len=leg_max,
        )
        _scatter_trace(
            m=m,
            legend_name=leg_name,
            color=color,
            msize=5,
            mopacity=0.78,
            legendrank=200 + rk,
        )

    cum3 = float(sum(ratios3))
    fig = go.Figure(data=traces)
    fig.update_layout(
        title=dict(
            text=(
                "DBSCAN PCA 3D — semantic grouped view (interactive; "
                f"top_n={int(top_n)}; n_plot={n_plot:,}; 3-PC var={cum3:.3f})"
            ),
            x=0.02,
            xanchor="left",
            yanchor="top",
            y=0.99,
            font=dict(size=14),
        ),
        scene=dict(
            xaxis_title=f"PC1 ({ratios3[0] * 100:.1f}%)",
            yaxis_title=f"PC2 ({ratios3[1] * 100:.1f}%)",
            zaxis_title=f"PC3 ({ratios3[2] * 100:.1f}%)",
            aspectmode="data",
        ),
        legend=dict(
            itemsizing="constant",
            orientation="v",
            yanchor="top",
            y=1.0,
            xanchor="left",
            x=1.01,
            font=dict(size=11),
        ),
        margin=dict(l=4, r=260, t=88, b=4),
    )
    plot_div = pio.to_html(
        fig,
        include_plotlyjs="cdn",
        full_html=False,
        div_id="dbscan-pca-3d-plot",
        config={"displayModeBar": True},
    )
    row_json_basename = os.path.basename(rows_json_path)
    html_basename = os.path.basename(html_path)
    fields_literal = json.dumps(list(DBSCAN_PC3D_JSON_FIELDS))
    script = f"""
<script>
(function () {{
  var ROWDATA_URL = {json.dumps(row_json_basename)};
  var HTML_NAME = {json.dumps(html_basename)};
  var rowPayload = null;
  var rowLoadPromise = null;
  var CLICK_FIELDS = {fields_literal};
  function ensureRowPayload() {{
    if (rowPayload) return Promise.resolve(rowPayload);
    if (rowLoadPromise) return rowLoadPromise;
    rowLoadPromise = fetch(ROWDATA_URL)
      .then(function (r) {{ return r.json(); }})
      .then(function (j) {{ rowPayload = j; return j; }})
      .catch(function (e) {{
        document.getElementById("dbscan-click-details").textContent =
          "Could not load " + ROWDATA_URL + ": " + e + "\\n\\nOpen this folder over HTTP, e.g.\\n  python -m http.server 8765\\nthen visit http://localhost:8765/" + HTML_NAME;
        throw e;
      }});
    return rowLoadPromise;
  }}
  window.addEventListener("load", function () {{
    setTimeout(function () {{
      var gd = document.getElementById("dbscan-pca-3d-plot");
      if (!gd || typeof gd.on !== "function") return;
      gd.on("plotly_click", function (ev) {{
        var pt = ev.points[0];
        var rowKey = String(pt.customdata[0]);
        document.getElementById("dbscan-click-hint").textContent =
          "row_index " + rowKey + " — loading…";
        ensureRowPayload()
          .then(function (data) {{
            var detail = document.getElementById("dbscan-click-details");
            if (!data.ok) {{
              detail.textContent = (data.message || "Row lookup unavailable") + "\\nrow_index: " + rowKey;
              return;
            }}
            var rec = data.by_row_index[rowKey];
            if (!rec) {{
              detail.textContent =
                "No subsample entry for row_index " +
                rowKey +
                ". Regenerate step 06B so HTML and *_interactive_rows.json match.";
              return;
            }}
            var lines = CLICK_FIELDS.map(function (k) {{
              var v = rec[k];
              var s = v === null || v === undefined ? "" : String(v);
              return k + ": " + s;
            }});
            detail.textContent = lines.join("\\n");
            document.getElementById("dbscan-click-hint").textContent =
              "DBSCAN grouped view — row details (subsample) — row_index " + rowKey;
          }})
          .catch(function () {{}});
      }});
    }}, 0);
  }});
}})();
</script>
"""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>PhilGEPS PCA 3D DBSCAN interactive</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; padding: 12px; }}
    #dbscan-click-panel {{
      margin-top: 16px;
      max-height: 40vh;
      overflow: auto;
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }}
    #dbscan-click-details {{ white-space: pre-wrap; font-size: 12px; margin: 0; }}
  </style>
</head>
<body>
{plot_div}
<div id="dbscan-click-panel">
  <h3 style="margin:0 0 8px 0">Wide merge row (DBSCAN grouped view)</h3>
  <p id="dbscan-click-hint" style="margin:0 0 8px 0;font-size:13px;color:#444">
    Click any point. Payload loads once from <code>{row_json_basename}</code> (plot subsample only; aligns with
    <code>philgeps_dbscan_backtrack_layer_a.csv</code> / <code>per_cluster_full</code>).
    Actual <code>cluster_id</code> is preserved; <code>display_group</code> is the legend bucket (noise, top N, or other).
    If nothing loads, serve this directory over HTTP (browsers block <code>file://</code> fetches).
  </p>
  <pre id="dbscan-click-details"></pre>
</div>
{script}
</body>
</html>
"""
    os.makedirs(os.path.dirname(html_path) or ".", exist_ok=True)
    with open(html_path, "w", encoding="utf-8", newline="\n") as fp:
        fp.write(html)
    return True
