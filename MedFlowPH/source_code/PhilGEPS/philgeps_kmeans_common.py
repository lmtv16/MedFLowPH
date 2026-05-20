"""Shared paths, logging, PCA-3D plot parity, and K-means evaluation helpers (steps 04–06)."""

from __future__ import annotations

import contextlib
import json
import math
import os
import sys
import textwrap
from collections.abc import Callable, Iterable, Iterator
from datetime import datetime
from typing import Any, TextIO

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from mpl_toolkits.mplot3d import Axes3D  # noqa: F401
from sklearn.cluster import KMeans
from sklearn.metrics import calinski_harabasz_score, davies_bouldin_score, silhouette_score

from philgeps_theme_scores import POLICY_PCA_BASE_COLUMNS, POLICY_THEME_SCORE_COLUMNS

from philgeps_paths import MEDFLOW_ROOT

PATH_OUTPUT_03 = os.path.join(MEDFLOW_ROOT, "output_source", "03", "Clustering")
PATH_RESULTS_03 = os.path.join(MEDFLOW_ROOT, "results", "03", "Clustering")
OUT_CLUSTER_PC_CSV = os.path.join(PATH_OUTPUT_03, "philgeps_clustering_pc_scores.csv")
OUT_CLUSTER_FEATURES_CSV = os.path.join(PATH_OUTPUT_03, "philgeps_clustering_features.csv")
OUT_PCA_JSON = os.path.join(PATH_RESULTS_03, "pca_theme_clustering.json")
PATH_SCALED_CSV = os.path.join(
    MEDFLOW_ROOT, "output_source", "02", "Min-Max Scaling", "philgeps_min_max_scaled.csv",
)
PATH_FS_CSV = os.path.join(
    MEDFLOW_ROOT, "output_source", "02", "Feature Selection", "philgeps_features_selected.csv",
)
PATH_PROCUREMENT_CSV = os.path.join(
    MEDFLOW_ROOT, "output_source", "01", "philgeps_medical_procurement.csv",
)

PATH_OUTPUT_04 = os.path.join(MEDFLOW_ROOT, "output_source", "04")
PATH_RESULTS_04 = os.path.join(MEDFLOW_ROOT, "results", "04")
PATH_OUTPUT_05 = os.path.join(MEDFLOW_ROOT, "output_source", "05")
PATH_RESULTS_05 = os.path.join(MEDFLOW_ROOT, "results", "05")
PATH_OUTPUT_06 = os.path.join(MEDFLOW_ROOT, "output_source", "06")
PATH_RESULTS_06 = os.path.join(MEDFLOW_ROOT, "results", "06")

PATH_LOGS_04 = os.path.join(MEDFLOW_ROOT, "logs", "04")
PATH_LOGS_05 = os.path.join(MEDFLOW_ROOT, "logs", "05")
PATH_LOGS_06 = os.path.join(MEDFLOW_ROOT, "logs", "06")

PROCESS_DIRS = ("process_1", "process_2", "process_3")

# Step 04 outputs (final K-means fit on full PC scores)
PATH_OUT_04_KMEANS = os.path.join(PATH_OUTPUT_04, "KMeans")
PATH_OUT_04_BACKTRACK = os.path.join(PATH_OUTPUT_04, "Backtrack")
PATH_OUT_04_PER_CLUSTER = os.path.join(PATH_OUTPUT_04, "per_cluster")
PATH_RES_04_PCA_CLUSTER = os.path.join(PATH_RESULTS_04, "PCA_Cluster")
PATH_RES_04_SUMMARIES = os.path.join(PATH_RESULTS_04, "Summaries")
PATH_LOG_TERMINAL_04 = os.path.join(PATH_LOGS_04, "Terminal Logs")
PATH_LOG_ENTRIES_04 = os.path.join(PATH_LOGS_04, "Log entries")

OUT_04_ASSIGNMENTS_CSV = os.path.join(PATH_OUT_04_KMEANS, "philgeps_kmeans_assignments.csv")
OUT_04_BACKTRACK_CSV = os.path.join(PATH_OUT_04_BACKTRACK, "philgeps_cluster_backtrack.csv")
OUT_04_NUMERIC_PNG = os.path.join(PATH_RES_04_PCA_CLUSTER, "pca_space_pc123_3d_kmeans_numeric.png")
OUT_04_SEMANTIC_PNG = os.path.join(PATH_RES_04_PCA_CLUSTER, "pca_space_pc123_3d_kmeans_semantic.png")
OUT_04_LEGEND_PNG = os.path.join(PATH_RES_04_PCA_CLUSTER, "cluster_semantic_legend_table.png")
OUT_04_PC3D_KMEANS_INTERACTIVE_HTML = os.path.join(
    PATH_RES_04_PCA_CLUSTER, "pca_space_pc123_3d_kmeans_interactive.html",
)
OUT_04_PC3D_KMEANS_INTERACTIVE_ROWS_JSON = os.path.join(
    PATH_RES_04_PCA_CLUSTER, "pca_space_pc123_3d_kmeans_interactive_rows.json",
)

# Wide-merge columns surfaced on Plotly click (JSON keys match display names; order = click panel order).
KMEANS_PC3D_CLICK_FIELDS: tuple[str, ...] = (
    "row_index",
    "Procuring Entity",
    "Region",
    "Notice Status",
    "Contract Amount",
    "Approved Budget of the Contract",
    "Awardee Organization Name",
    "Region of Awardee",
)
OUT_04_CLUSTER_COUNTS_JSON = os.path.join(PATH_RES_04_SUMMARIES, "cluster_counts.json")
OUT_04_RUN_META_JSON = os.path.join(PATH_RES_04_SUMMARIES, "run_meta.json")
OUT_04_README = os.path.join(PATH_RES_04_SUMMARIES, "kmeans_implementation_readme.txt")

# Step 05 outputs (K-selection)
PATH_OUT_05_KSEL = os.path.join(PATH_OUTPUT_05, "KSelection")
PATH_RES_05_KSEL = os.path.join(PATH_RESULTS_05, "KSelection")
PATH_RES_05_EDA = os.path.join(PATH_RESULTS_05, "EDA")
PATH_LOG_TERMINAL_05 = os.path.join(PATH_LOGS_05, "Terminal Logs")
PATH_LOG_ENTRIES_05 = os.path.join(PATH_LOGS_05, "Log entries")
OUT_05_README = os.path.join(PATH_RES_05_KSEL, "k_selection_readme.txt")

# Step 06 outputs (cluster interpretation)
PATH_OUT_06_INTERP = os.path.join(PATH_OUTPUT_06, "Interpretation")
PATH_RES_06_INTERP = os.path.join(PATH_RESULTS_06, "Cluster_Interpretation")
PATH_RES_06_EDA = os.path.join(PATH_RES_06_INTERP, "EDA")
PATH_LOG_TERMINAL_06 = os.path.join(PATH_LOGS_06, "Terminal Logs")
PATH_LOG_ENTRIES_06 = os.path.join(PATH_LOGS_06, "Log entries")
OUT_06_SEMANTIC_MAP_CSV = os.path.join(PATH_OUT_06_INTERP, "cluster_semantic_map.csv")
OUT_06_THEME_PROFILES_CSV = os.path.join(PATH_OUT_06_INTERP, "cluster_theme_profiles.csv")
OUT_06_BACKTRACK_LAYER_A_CSV = os.path.join(
    PATH_OUT_06_INTERP, "philgeps_cluster_backtrack_layer_a.csv",
)
OUT_06_BACKTRACK_LAYER_A_COLUMN_MAP_CSV = os.path.join(
    PATH_OUT_06_INTERP, "philgeps_cluster_backtrack_layer_a_column_map.csv",
)
PATH_OUT_06_PER_CLUSTER_FULL = os.path.join(PATH_OUT_06_INTERP, "per_cluster_full")
OUT_06_README = os.path.join(PATH_RES_06_INTERP, "cluster_interpretation_readme.txt")

RANDOM_SEED = 42
KMEANS_N_INIT = 10
# Match step 03 defaults for labeled PNG parity with pca_space_pc123_3d_solid.png
PC3D_MAX_POINTS_DEFAULT = 30_000
PC3D_PLOT_JITTER_FRAC_DEFAULT = 0.025
SCATTER_3D_S_UNLABELED = 22
SCATTER_3D_AXIS_MARGIN = 0.02
SCATTER_3D_AXIS_PAD_MIN_FRAC = 0.002
SCATTER_3D_Z_LIMIT_P_LO = 0.5
SCATTER_3D_Z_LIMIT_P_HI = 99.5
SCATTER_3D_Z_MARGIN_SCALE = 0.32
SCATTER_3D_PC1_LIM: tuple[float, float] | None = None
SCATTER_3D_PC2_LIM: tuple[float, float] | None = None
SCATTER_3D_LIM_OUTSET_FRAC = 0.055
SCATTER_3D_Z_OUTSET_REL = 0.55
METRICS_SUBSAMPLE_DEFAULT = 80_000
OUT_K_SELECTION_SUMMARY = os.path.join(PATH_OUTPUT_05, "KSelection", "k_selection_summary.json")
OUT_K_METRICS_LONG = os.path.join(PATH_OUTPUT_05, "KSelection", "k_metrics_long.csv")

# Theme semantics (step 04 / 06)
Z_THRESHOLD = 0.35
# Heuristic thresholds for plain-language cluster labels (theme z vs global).
_SHORT_TITLE_STRONG_UNDERSTOCK_Z = 0.65
_SHORT_TITLE_SEVERE_SURPLUS_Z = 1.15

BACKTRACK_COLS: tuple[str, ...] = tuple(
    list(POLICY_THEME_SCORE_COLUMNS) + list(POLICY_PCA_BASE_COLUMNS),
)


def ensure_dirs(*paths: str) -> None:
    for p in paths:
        os.makedirs(p, exist_ok=True)


def ensure_log_tree(log_root: str) -> None:
    ensure_dirs(
        log_root,
        os.path.join(log_root, "Terminal Logs"),
        os.path.join(log_root, "Log entries"),
    )


def open_activity_log(activity_path: str, *, reset: bool = True) -> Callable[[str], None]:
    d = os.path.dirname(activity_path) or "."
    os.makedirs(d, exist_ok=True)
    if reset and os.path.isfile(activity_path):
        os.remove(activity_path)

    def _log(msg: str) -> None:
        ts = datetime.now().isoformat(timespec="seconds")
        with open(activity_path, "a", encoding="utf-8", newline="\n") as f:
            f.write(f"[{ts}] {msg}\n")

    return _log


@contextlib.contextmanager
def tee_stdio_to_file(path: str) -> Iterator[None]:
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as logf:

        class _Tee:
            def __init__(self, *streams: TextIO) -> None:
                self._streams = streams

            def write(self, data: str) -> None:
                for s in self._streams:
                    s.write(data)
                    s.flush()

            def flush(self) -> None:
                for s in self._streams:
                    s.flush()

        old = sys.stdout
        sys.stdout = _Tee(old, logf)  # type: ignore[assignment]
        try:
            yield
        finally:
            sys.stdout = old


def load_pc_scores(path: str = OUT_CLUSTER_PC_CSV) -> np.ndarray:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Missing PC scores CSV (run step 03): {path}")
    df = pd.read_csv(path)
    for c in ("PC1", "PC2", "PC3"):
        if c not in df.columns:
            raise KeyError(f"Expected column {c} in {path}")
    return np.ascontiguousarray(df[["PC1", "PC2", "PC3"]].to_numpy(dtype=np.float64))


def load_pca_ratios3(path: str = OUT_PCA_JSON) -> list[float]:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Missing PCA JSON: {path}")
    with open(path, encoding="utf-8") as f:
        payload = json.load(f)
    ratios = payload.get("explained_variance_ratio")
    if not isinstance(ratios, list) or len(ratios) < 3:
        raise ValueError("pca_theme_clustering.json missing explained_variance_ratio (>=3)")
    return [float(ratios[i]) for i in range(3)]


def scatter_subsample_row_indices(
    n_rows: int, *, max_points: int, seed: int = RANDOM_SEED,
) -> np.ndarray:
    n = int(n_rows)
    if max_points <= 0 or n <= max_points:
        return np.arange(n, dtype=np.int64)
    rng = np.random.default_rng(seed)
    return rng.choice(n, size=max_points, replace=False)


def pc3_subsample_jittered(
    pc3: np.ndarray,
    *,
    max_points: int,
    plot_jitter_frac: float,
) -> tuple[np.ndarray, np.ndarray, int]:
    n = int(pc3.shape[0])
    iloc_idx = scatter_subsample_row_indices(n, max_points=max_points, seed=RANDOM_SEED)
    Xp = np.asarray(pc3[iloc_idx], dtype=np.float64)
    n_plot = int(len(iloc_idx))
    if plot_jitter_frac > 0.0 and Xp.size:
        span = np.ptp(Xp, axis=0)
        sdev = np.std(Xp, axis=0, ddof=0)
        basis = np.maximum(span, sdev)
        basis = np.maximum(basis, 1e-12)
        rng = np.random.default_rng(RANDOM_SEED + 999)
        sigma = plot_jitter_frac * basis
        Xdraw = Xp + rng.normal(size=Xp.shape).astype(np.float64) * sigma
    else:
        Xdraw = Xp
    return Xdraw, iloc_idx, n_plot


def _outset_lim_pair(lo: float, hi: float, frac: float) -> tuple[float, float]:
    if frac <= 0.0 or not math.isfinite(lo) or not math.isfinite(hi) or hi <= lo:
        return lo, hi
    span = hi - lo
    d = span * frac * 0.5
    return float(lo - d), float(hi + d)


def set_3d_axis_limits_tight(
    ax: Any,
    Xp: np.ndarray,
    *,
    extra_xyz: np.ndarray | None = None,
    margin: float | None = None,
) -> None:
    m = SCATTER_3D_AXIS_MARGIN if margin is None else margin
    cloud = np.asarray(Xp, dtype=float).reshape(-1, 3)
    if cloud.shape[0] == 0:
        return

    raw_lo = cloud.min(axis=0)
    raw_hi = cloud.max(axis=0)
    if extra_xyz is not None and extra_xyz.size:
        ex = np.asarray(extra_xyz, dtype=float).reshape(-1, 3)
        raw_lo = np.minimum(raw_lo, ex.min(axis=0))
        raw_hi = np.maximum(raw_hi, ex.max(axis=0))

    lo = raw_lo.copy()
    hi = raw_hi.copy()
    z_lo_p = float(np.percentile(cloud[:, 2], SCATTER_3D_Z_LIMIT_P_LO))
    z_hi_p = float(np.percentile(cloud[:, 2], SCATTER_3D_Z_LIMIT_P_HI))
    lo[2] = z_lo_p
    hi[2] = z_hi_p
    if extra_xyz is not None and extra_xyz.size:
        ez = np.asarray(extra_xyz, dtype=float).reshape(-1, 3)[:, 2]
        lo[2] = float(min(lo[2], float(ez.min())))
        hi[2] = float(max(hi[2], float(ez.max())))

    z_span = float(np.maximum(hi[2] - lo[2], 1e-9))
    z_pad = float(
        np.maximum(z_span * m, z_span * SCATTER_3D_AXIS_PAD_MIN_FRAC) * SCATTER_3D_Z_MARGIN_SCALE,
    )
    z_lim = (float(lo[2] - z_pad), float(hi[2] + z_pad))

    if SCATTER_3D_PC1_LIM is not None:
        a, b = SCATTER_3D_PC1_LIM
        x_lim = (float(min(a, b)), float(max(a, b)))
    else:
        span_x = float(np.maximum(hi[0] - lo[0], 1e-9))
        pad_x = float(np.maximum(span_x * m, span_x * SCATTER_3D_AXIS_PAD_MIN_FRAC))
        x_lim = (float(lo[0] - pad_x), float(hi[0] + pad_x))

    if SCATTER_3D_PC2_LIM is not None:
        a, b = SCATTER_3D_PC2_LIM
        y_lim = (float(min(a, b)), float(max(a, b)))
    else:
        span_y = float(np.maximum(hi[1] - lo[1], 1e-9))
        pad_y = float(np.maximum(span_y * m, span_y * SCATTER_3D_AXIS_PAD_MIN_FRAC))
        y_lim = (float(lo[1] - pad_y), float(hi[1] + pad_y))

    ox0, ox1 = _outset_lim_pair(x_lim[0], x_lim[1], SCATTER_3D_LIM_OUTSET_FRAC)
    oy0, oy1 = _outset_lim_pair(y_lim[0], y_lim[1], SCATTER_3D_LIM_OUTSET_FRAC)
    oz0, oz1 = _outset_lim_pair(
        z_lim[0], z_lim[1],
        SCATTER_3D_LIM_OUTSET_FRAC * SCATTER_3D_Z_OUTSET_REL,
    )

    ax.set_xlim(ox0, ox1)
    ax.set_ylim(oy0, oy1)
    ax.set_zlim(oz0, oz1)
    if hasattr(ax, "set_box_aspect"):
        x0, x1 = ax.get_xlim()
        y0, y1 = ax.get_ylim()
        z0, z1 = ax.get_zlim()
        ax.set_box_aspect((x1 - x0, y1 - y0, z1 - z0))


def set_axes_labels_3d_ratios(ax: Any, ratios3: list[float]) -> None:
    ax.set_xlabel(f"PC1 ({ratios3[0] * 100:.1f}%)")
    ax.set_ylabel(f"PC2 ({ratios3[1] * 100:.1f}%)")
    ax.set_zlabel(f"PC3 ({ratios3[2] * 100:.1f}%)")


def save_labeled_pc_scatter_3d(
    pc3: np.ndarray,
    labels: np.ndarray,
    path: str,
    *,
    ratios3: list[float],
    title_suffix: str = "",
    max_points: int = PC3D_MAX_POINTS_DEFAULT,
    plot_jitter_frac: float = PC3D_PLOT_JITTER_FRAC_DEFAULT,
    id_to_short: dict[int, str] | None = None,
) -> None:
    """Labeled 3D scatter — same subsample + jitter policy as step 03 solid PNG.

    Title includes K, full row count, cluster count, plot subsample size, and 3-PC variance.
    Optional ``title_suffix`` appends one more clause when non-empty (rare).

    ``id_to_short`` is optional; when omitted (step 04 default / numeric PNG refresh), legend entries are ``C0``, … only.
    When provided (legacy callers only), semantic titles replace numeric IDs — prefer ``save_labeled_pc_scatter_3d_semantic`` for that.
    """
    Xdraw, iloc_idx, n_plot = pc3_subsample_jittered(
        pc3, max_points=max_points, plot_jitter_frac=plot_jitter_frac,
    )
    labs = np.asarray(labels[iloc_idx], dtype=int)
    n_total = int(np.asarray(pc3).shape[0])
    k_clusters = int(len(np.unique(np.asarray(labels, dtype=int))))
    fig_w = 12.5 if id_to_short is not None else 11.0
    fig = plt.figure(figsize=(fig_w, 8.0))
    ax = fig.add_subplot(111, projection="3d")
    uniq = np.unique(labs)
    cmap = plt.get_cmap("tab20")
    plot_alpha = 0.38 if plot_jitter_frac > 0.0 else 0.35
    handles: list[Any] = []
    legend_labels: list[str] = []
    for c in uniq:
        m = labs == c
        if not np.any(m):
            continue
        color = cmap((int(c) % 20) / 20.0 + 0.001)
        if id_to_short is not None:
            leg = id_to_short.get(int(c)) or f"Cluster {int(c)}"
            legend_labels.append(_wrap_legend_text(f"C{int(c)}: {leg}", width=44))
        else:
            legend_labels.append(f"C{int(c)}")
        h = ax.scatter(
            Xdraw[m, 0], Xdraw[m, 1], Xdraw[m, 2],
            s=SCATTER_3D_S_UNLABELED,
            alpha=plot_alpha,
            color=color,
            linewidths=0,
            edgecolors="none",
        )
        handles.append(h)
    set_3d_axis_limits_tight(ax, Xdraw)
    set_axes_labels_3d_ratios(ax, ratios3)
    cum3 = float(sum(ratios3))
    title_parts = [
        f"K = {k_clusters}",
        f"total rows = {n_total:,}",
        f"clusters = {k_clusters}",
        f"n_plot = {n_plot:,}",
        f"3-PC var = {cum3:.3f}",
    ]
    ts = (title_suffix or "").strip()
    if ts:
        title_parts.append(ts)
    ax.set_title("PhilGEPS — PCA 3D K-means (" + "; ".join(title_parts) + ")")
    ax.view_init(elev=20, azim=30)
    if id_to_short is not None:
        # Reserve ~56% width for the 3D axes; place legend in figure coords just right of it (no wide gap).
        fig.subplots_adjust(left=0.03, right=0.56, top=0.92, bottom=0.06)
        fig.legend(
            handles,
            legend_labels,
            loc="upper left",
            bbox_to_anchor=(0.575, 0.92),
            bbox_transform=fig.transFigure,
            fontsize=9,
            framealpha=0.95,
            borderaxespad=0.0,
            handlelength=1.2,
            labelspacing=0.9,
        )
    else:
        ncol = min(4, max(len(uniq), 1))
        ax.legend(
            handles,
            legend_labels,
            loc="upper left",
            bbox_to_anchor=(0.02, 0.98),
            ncol=ncol,
            fontsize=8,
            framealpha=0.9,
        )
        plt.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight" if id_to_short is not None else None)
    plt.close(fig)


def _wide_merge_resolve_click_column(df: pd.DataFrame, display_field: str) -> str:
    if display_field in df.columns:
        return display_field
    alt = f"procurement__{display_field}"
    if alt in df.columns:
        return alt
    raise KeyError(display_field)


def _wide_merge_click_column_map(df: pd.DataFrame) -> dict[str, str]:
    out: dict[str, str] = {}
    missing: list[str] = []
    for field in KMEANS_PC3D_CLICK_FIELDS:
        try:
            out[field] = _wide_merge_resolve_click_column(df, field)
        except KeyError:
            missing.append(field)
    if missing:
        raise ValueError(
            "Wide merge is missing columns needed for interactive click fields: "
            f"{missing}. Expected names or procurement__* aliases.",
        )
    return out


def _json_scalar_click(v: Any) -> Any:
    try:
        if pd.isna(v):
            return None
    except TypeError:
        pass
    if isinstance(v, (bool, np.bool_)):
        return bool(v)
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating, float)):
        x = float(v)
        return None if not math.isfinite(x) else x
    return str(v)


def write_kmeans_pc3d_interactive_rows_json(
    df_merge: pd.DataFrame,
    iloc_idx: np.ndarray,
    *,
    out_path: str,
) -> None:
    col_map = _wide_merge_click_column_map(df_merge)
    by_key: dict[str, Any] = {}
    for j in range(len(iloc_idx)):
        pos = int(iloc_idx[j])
        row = df_merge.iloc[pos]
        rk = col_map["row_index"]
        key = str(int(row[rk]))
        rec = {field: _json_scalar_click(row[col_map[field]]) for field in KMEANS_PC3D_CLICK_FIELDS}
        by_key[key] = rec
    payload: dict[str, Any] = {
        "ok": True,
        "source_note": (
            "Subsample only. Keys match philgeps_cluster_backtrack_layer_a row_index "
            "(same schema as per_cluster_full)."
        ),
        "fields": list(KMEANS_PC3D_CLICK_FIELDS),
        "n_points": len(by_key),
        "by_row_index": by_key,
    }
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))


def write_kmeans_pc3d_interactive_html(
    pc3: np.ndarray,
    labels: np.ndarray,
    df_merge: pd.DataFrame,
    *,
    path_html: str,
    path_rows_json: str,
    ratios3: list[float],
    title_suffix: str,
    id_to_short: dict[int, str],
    max_points: int = PC3D_MAX_POINTS_DEFAULT,
    plot_jitter_frac: float = PC3D_PLOT_JITTER_FRAC_DEFAULT,
) -> None:
    try:
        import plotly.graph_objects as go  # type: ignore[import-untyped]
        import plotly.io as pio  # type: ignore[import-untyped]
    except ImportError as e:
        raise ImportError(
            "Plotly is required for K-means interactive PCA HTML. Install with: pip install plotly",
        ) from e
    n = int(pc3.shape[0])
    if len(df_merge) != n:
        raise ValueError(f"df_merge rows ({len(df_merge):,}) != PC scores ({n:,})")
    Xdraw, iloc_idx, n_plot = pc3_subsample_jittered(
        pc3, max_points=max_points, plot_jitter_frac=plot_jitter_frac,
    )
    labs = np.asarray(labels[iloc_idx], dtype=int)
    col_map = _wide_merge_click_column_map(df_merge)
    rk_col = col_map["row_index"]
    row_keys = np.empty(len(iloc_idx), dtype=object)
    for j in range(len(iloc_idx)):
        pos = int(iloc_idx[j])
        row_keys[j] = str(int(df_merge.iloc[pos][rk_col]))

    write_kmeans_pc3d_interactive_rows_json(df_merge, iloc_idx, out_path=path_rows_json)

    cmap = plt.get_cmap("tab20")
    uniq = np.unique(labs)
    cum3 = float(sum(ratios3))
    traces: list[Any] = []
    for cid in uniq:
        m = labs == int(cid)
        if not np.any(m):
            continue
        rgba = _cluster_tab20_rgba(int(cid), cmap=cmap)
        color = "rgba({},{},{},{})".format(
            int(round(rgba[0] * 255)),
            int(round(rgba[1] * 255)),
            int(round(rgba[2] * 255)),
            float(rgba[3]),
        )
        leg = id_to_short.get(int(cid)) or f"C{int(cid)}"
        customdata = row_keys[m].reshape(-1, 1)
        traces.append(
            go.Scatter3d(
                x=Xdraw[m, 0],
                y=Xdraw[m, 1],
                z=Xdraw[m, 2],
                mode="markers",
                name=_wrap_legend_text(leg, width=42),
                marker=dict(size=3, color=color, opacity=0.38, line=dict(width=0)),
                customdata=customdata,
                hovertemplate=(
                    "<b>%{fullData.name}</b><br>"
                    "<b>row_index</b>=%{customdata[0]}<br>"
                    "PC1=%{x:.4f}<br>PC2=%{y:.4f}<br>PC3=%{z:.4f}"
                    "<extra></extra>"
                ),
            ),
        )
    fig = go.Figure(data=traces)
    fig.update_layout(
        title=(
            f"PhilGEPS — PCA 3D K-means interactive ({title_suffix}; n_plot={n_plot:,}, "
            f"3-PC var={cum3:.3f}; click row payload)"
        ),
        scene=dict(
            xaxis_title=f"PC1 ({ratios3[0] * 100:.1f}%)",
            yaxis_title=f"PC2 ({ratios3[1] * 100:.1f}%)",
            zaxis_title=f"PC3 ({ratios3[2] * 100:.1f}%)",
            aspectmode="data",
        ),
        legend=dict(itemsizing="constant"),
        margin=dict(l=0, r=0, t=50, b=0),
    )
    plot_div = pio.to_html(
        fig,
        include_plotlyjs="cdn",
        full_html=False,
        div_id="kmeans-pca-3d-plot",
        config={"displayModeBar": True},
    )
    row_json_basename = os.path.basename(path_rows_json)
    html_basename = os.path.basename(path_html)
    fields_literal = json.dumps(list(KMEANS_PC3D_CLICK_FIELDS))
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
        document.getElementById("km-click-details").textContent =
          "Could not load " + ROWDATA_URL + ": " + e + "\\n\\nOpen this folder over HTTP, e.g.\\n  python -m http.server 8765\\nthen visit http://localhost:8765/" + HTML_NAME;
        throw e;
      }});
    return rowLoadPromise;
  }}
  window.addEventListener("load", function () {{
    setTimeout(function () {{
      var gd = document.getElementById("kmeans-pca-3d-plot");
      if (!gd || typeof gd.on !== "function") return;
      gd.on("plotly_click", function (ev) {{
        var pt = ev.points[0];
        var rowKey = String(pt.customdata[0]);
        document.getElementById("km-click-hint").textContent =
          "row_index " + rowKey + " — loading…";
        ensureRowPayload()
          .then(function (data) {{
            var detail = document.getElementById("km-click-details");
            if (!data.ok) {{
              detail.textContent = (data.message || "Row lookup unavailable") + "\\nrow_index: " + rowKey;
              return;
            }}
            var rec = data.by_row_index[rowKey];
            if (!rec) {{
              detail.textContent =
                "No subsample entry for row_index " +
                rowKey +
                ". Regenerate step 06 so HTML and *_interactive_rows.json match.";
              return;
            }}
            var lines = CLICK_FIELDS.map(function (k) {{
              var v = rec[k];
              var s = v === null || v === undefined ? "" : String(v);
              return k + ": " + s;
            }});
            detail.textContent = lines.join("\\n");
            document.getElementById("km-click-hint").textContent =
              "Wide merge fields (subsample) — row_index " + rowKey;
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
  <title>PhilGEPS PCA 3D K-means interactive</title>
  <style>
    body {{ font-family: system-ui, sans-serif; margin: 0; padding: 12px; }}
    #km-click-panel {{
      margin-top: 16px;
      max-height: 40vh;
      overflow: auto;
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }}
    #km-click-details {{ white-space: pre-wrap; font-size: 12px; margin: 0; }}
  </style>
</head>
<body>
{plot_div}
<div id="km-click-panel">
  <h3 style="margin:0 0 8px 0">Wide merge row (selected fields)</h3>
  <p id="km-click-hint" style="margin:0 0 8px 0;font-size:13px;color:#444">
    Click any point. Payload loads once from <code>{row_json_basename}</code> (plot subsample only; aligns with
    <code>philgeps_cluster_backtrack_layer_a.csv</code> / <code>per_cluster_full</code>).
    If nothing loads, serve this directory over HTTP (browsers block <code>file://</code> fetches).
  </p>
  <pre id="km-click-details"></pre>
</div>
{script}
</body>
</html>
"""
    os.makedirs(os.path.dirname(path_html) or ".", exist_ok=True)
    with open(path_html, "w", encoding="utf-8", newline="\n") as fp:
        fp.write(html)


def zscore_across_k(s: np.ndarray) -> np.ndarray:
    s = np.asarray(s, dtype=np.float64)
    mu = np.nanmean(s)
    sd = float(np.nanstd(s, ddof=0))
    if not math.isfinite(sd) or sd < 1e-15:
        return np.zeros_like(s)
    return (s - mu) / sd


def add_composite_column(df: pd.DataFrame) -> pd.DataFrame:
    """P2: maximize (z_sil + z_ch - z_db) / sqrt(3)."""
    z_s = zscore_across_k(df["silhouette"].to_numpy())
    z_db = zscore_across_k(df["davies_bouldin"].to_numpy())
    z_ch = zscore_across_k(df["calinski_harabasz"].to_numpy())
    df = df.copy()
    df["composite"] = (z_s + z_ch - z_db) / math.sqrt(3.0)
    return df


def evaluate_k_grid(
    X_sub: np.ndarray,
    k_min: int,
    k_max: int,
    *,
    random_state: int = RANDOM_SEED,
    n_init: int = KMEANS_N_INIT,
) -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    n = X_sub.shape[0]
    for k in range(int(k_min), int(k_max) + 1):
        if k < 2 or k >= n:
            continue
        km = KMeans(
            n_clusters=k,
            random_state=random_state,
            n_init=n_init,
            algorithm="lloyd",
        )
        lab = km.fit_predict(X_sub)
        try:
            sil = float(silhouette_score(X_sub, lab, metric="euclidean"))
        except Exception:  # noqa: BLE001
            sil = float("nan")
        try:
            db = float(davies_bouldin_score(X_sub, lab))
        except Exception:  # noqa: BLE001
            db = float("nan")
        try:
            ch = float(calinski_harabasz_score(X_sub, lab))
        except Exception:  # noqa: BLE001
            ch = float("nan")
        rows.append({
            "k": k,
            "silhouette": sil,
            "davies_bouldin": db,
            "calinski_harabasz": ch,
            "inertia": float(km.inertia_),
        })
    return pd.DataFrame.from_records(rows)


def pick_k_silhouette(df: pd.DataFrame) -> int:
    s = df["silhouette"].to_numpy()
    if not np.all(np.isfinite(s)) or s.size == 0:
        raise ValueError("No valid silhouette values for K selection")
    best = int(s.argmax())
    return int(df["k"].iloc[best])


def pick_k_composite(df: pd.DataFrame) -> int:
    dfc = add_composite_column(df)
    c = dfc["composite"].to_numpy()
    if not np.all(np.isfinite(c)) or c.size == 0:
        raise ValueError("No valid composite values for K selection")
    best = int(c.argmax())
    return int(dfc["k"].iloc[best])


def pick_k_min_davies_bouldin(df: pd.DataFrame) -> int:
    """P3: minimize Davies–Bouldin on eval subsample. Ties: smaller K, then higher silhouette."""
    sub = df.loc[np.isfinite(df["davies_bouldin"])].copy()
    if sub.empty:
        raise ValueError("No finite davies_bouldin values for K selection")
    sub = sub.sort_values(
        ["davies_bouldin", "k", "silhouette"],
        ascending=[True, True, False],
        kind="mergesort",
    )
    return int(sub.iloc[0]["k"])


_METRIC_PLOT_SPECS: tuple[tuple[str, str, str], ...] = (
    ("silhouette", "Silhouette (Euclidean)", "silhouette_vs_k.png"),
    ("davies_bouldin", "Davies–Bouldin (lower better)", "davies_bouldin_vs_k.png"),
    ("calinski_harabasz", "Calinski–Harabasz (higher better)", "calinski_harabasz_vs_k.png"),
    ("composite", "Composite ((z_sil+z_ch−z_db)/√3)", "composite_vs_k.png"),
    ("inertia", "Inertia (WCSS on eval subsample)", "elbow_inertia_vs_k.png"),
)


def plot_k_metric_curves(
    df: pd.DataFrame,
    out_dir: str,
    *,
    include: Iterable[str],
    prefix: str = "",
) -> None:
    """Write only the requested metric PNGs (keys: silhouette, davies_bouldin, …)."""
    ensure_dirs(out_dir)
    for _, _, fname in _METRIC_PLOT_SPECS:
        stale = os.path.join(out_dir, f"{prefix}{fname}")
        if os.path.isfile(stale):
            os.remove(stale)
    if df.empty:
        return
    want = set(include)
    ks = df["k"].to_numpy()

    def _line(ykey: str, ylabel: str, fname: str) -> None:
        fig, ax = plt.subplots(figsize=(7, 4.2))
        ax.plot(ks, df[ykey].to_numpy(), "o-", color="steelblue")
        ax.set_xlabel("K")
        ax.set_ylabel(ylabel)
        ax.set_xticks(ks)
        ax.grid(True, alpha=0.35)
        fig.tight_layout()
        fig.savefig(os.path.join(out_dir, f"{prefix}{fname}"), dpi=150)
        plt.close(fig)

    for ykey, ylabel, fname in _METRIC_PLOT_SPECS:
        if ykey not in want:
            continue
        if ykey not in df.columns:
            continue
        _line(ykey, ylabel, fname)


def build_computations_meta(
    *,
    n_sub: int,
    n_total: int,
    k_min: int,
    k_max: int,
    formula_composite: str,
) -> dict[str, Any]:
    """Audit block for k_selection_summary.json and readmes."""
    return {
        "pc_scores_csv": OUT_CLUSTER_PC_CSV,
        "metrics_subsample_rows": int(n_sub),
        "pc_total_rows": int(n_total),
        "metrics_subsample_seed": RANDOM_SEED,
        "kmeans_eval": (
            "sklearn.cluster.KMeans(n_clusters=K, random_state=RANDOM_SEED, "
            f"n_init={KMEANS_N_INIT}, algorithm='lloyd').fit_predict(X_sub)"
        ),
        "silhouette": "sklearn.metrics.silhouette_score(X_sub, labels, metric='euclidean'); higher better; P1 picks argmax",
        "davies_bouldin": "sklearn.metrics.davies_bouldin_score(X_sub, labels); lower better; P3 picks argmin",
        "calinski_harabasz": "sklearn.metrics.calinski_harabasz_score(X_sub, labels); higher better; enters P2 composite only",
        "inertia": "KMeans.inertia_ on X_sub (elbow plot); diagnostic for P1; not used to pick K",
        "composite": f"z-score each metric across K in grid; {formula_composite}; P2 picks argmax composite",
        "k_grid_range": {"k_min": k_min, "k_max": k_max},
        "step04_final_fit": (
            "KMeans(K=K_chosen).fit_predict(X_full) on all rows of PC CSV; same random_state/n_init"
        ),
    }


def cluster_short_title_from_theme_z(z: pd.Series) -> str:
    """Plain-language segment title from per-cluster theme z-scores (vs global)."""
    z = z.astype(float)
    elevated = z[z >= Z_THRESHOLD]
    depressed = z[z <= -Z_THRESHOLD]
    if elevated.empty and depressed.empty:
        return "Balanced baseline procurement segment"
    if float(z.get("high_risk_shortage", 0.0)) >= Z_THRESHOLD:
        return "High shortage-risk segment"
    zo = float(z.get("overstocking", 0.0))
    zu = float(z.get("understocking", 0.0))
    if zo >= Z_THRESHOLD and zu <= -Z_THRESHOLD:
        if zo >= _SHORT_TITLE_SEVERE_SURPLUS_Z or zu <= -_SHORT_TITLE_SEVERE_SURPLUS_Z:
            return "Severe surplus / extreme overstocking segment"
        return "Overstocking-heavy procurement segment"
    if zu >= Z_THRESHOLD and zo <= -Z_THRESHOLD:
        if zu >= _SHORT_TITLE_STRONG_UNDERSTOCK_Z:
            return "Strong understocking / lean-stock segment"
        return "Moderate understocking segment"
    return "Mixed procurement profile segment"


def semantic_labels_for_clusters(
    df_bt: pd.DataFrame,
    *,
    pc_means_by_cluster: dict[int, tuple[float, float, float]] | None = None,
) -> tuple[dict[int, str], dict[int, str], pd.DataFrame]:
    """Plain-language titles plus numeric theme z rationale (no ``+theme`` / ``−theme`` tags).

    ``id_to_name`` mirrors ``id_to_short`` for plotting helpers. Numeric theme detail lives in
    ``rationale_short`` and in ``cluster_theme_profiles.csv``.
    """
    theme_cols = [c for c in POLICY_THEME_SCORE_COLUMNS if c in df_bt.columns]
    staged: list[tuple[int, str, str]] = []

    g_mean = df_bt[theme_cols].mean(axis=0)
    g_std = df_bt[theme_cols].std(axis=0, ddof=0).replace(0.0, np.nan)

    for c in sorted(df_bt["cluster_id"].unique()):
        cid = int(c)
        sub = df_bt.loc[df_bt["cluster_id"] == c, theme_cols]
        cm = sub.mean(axis=0)
        z = (cm - g_mean) / g_std
        z = z.replace([np.inf, -np.inf], np.nan).fillna(0.0)

        elevated = z[z >= Z_THRESHOLD]
        depressed = z[z <= -Z_THRESHOLD]
        top5 = z.reindex(z.abs().sort_values(ascending=False).index).head(5)

        if elevated.empty and depressed.empty:
            rationale = (
                f"No theme z-score exceeds ±{Z_THRESHOLD}; cluster mean sits near the cohort average "
                "on the engineered theme proxies."
            )
        else:
            rationale = (
                "Strongest theme deviations vs cohort (z-scores on cluster mean theme vector): "
                + "; ".join(f"{idx}={float(top5.loc[idx]):.2f}" for idx in top5.index)
            )

        short_title = cluster_short_title_from_theme_z(z)
        staged.append((cid, short_title, rationale))

    titles_only = [t[1] for t in staged]
    dup_base_titles = {t for t in titles_only if titles_only.count(t) > 1}

    rows_out: list[dict[str, Any]] = []
    id_to_name: dict[int, str] = {}
    id_to_short: dict[int, str] = {}

    for cid, base_title, rationale in staged:
        final_title = base_title
        if base_title in dup_base_titles:
            if pc_means_by_cluster and cid in pc_means_by_cluster:
                p1, p2, p3 = pc_means_by_cluster[cid]
                final_title = f"{base_title} · mean PC=({p1:.2f},{p2:.2f},{p3:.2f})"
            else:
                final_title = f"{base_title} · cluster_id={cid}"
        id_to_short[cid] = final_title
        id_to_name[cid] = final_title
        rows_out.append({
            "cluster_id": cid,
            "cluster_label": final_title,
            "rationale_short": rationale[:500],
        })

    return id_to_name, id_to_short, pd.DataFrame.from_records(rows_out)


def cluster_pc_means_from_labels(X: np.ndarray, labels: np.ndarray) -> dict[int, tuple[float, float, float]]:
    out: dict[int, tuple[float, float, float]] = {}
    for c in np.unique(labels):
        m = labels == c
        out[int(c)] = (
            float(np.mean(X[m, 0])) if np.any(m) else float("nan"),
            float(np.mean(X[m, 1])) if np.any(m) else float("nan"),
            float(np.mean(X[m, 2])) if np.any(m) else float("nan"),
        )
    return out


def _wrap_legend_text(s: str, width: int = 52) -> str:
    return "\n".join(
        textwrap.wrap(
            s,
            width=width,
            break_long_words=False,
            break_on_hyphens=True,
        )
        or [s],
    )


def _cluster_tab20_rgba(cid: int, cmap: Any | None = None) -> tuple[float, ...]:
    """RGBA for cluster ``cid`` using the same ``tab20`` rule as the 3D scatter."""
    cm = plt.get_cmap("tab20") if cmap is None else cmap
    return tuple(cm((int(cid) % 20) / 20.0 + 0.001))


def render_cluster_label_table_axes(
    ax: Any,
    id_to_short: dict[int, str],
    *,
    fontsize: float = 7.0,
    title: str = "Cluster labels",
    color_column: bool = True,
) -> None:
    """cluster_id × cluster_label; first column shows the plot color (tab20) when ``color_column``."""
    rows = sorted(id_to_short.items(), key=lambda x: x[0])
    ax.axis("off")
    cmap = plt.get_cmap("tab20")
    if color_column:
        table_data = [["", str(k), v] for k, v in rows]
        col_labels = ["Color", "cluster_id", "cluster_label"]
    else:
        table_data = [[str(k), v] for k, v in rows]
        col_labels = ["cluster_id", "cluster_label"]
    tbl = ax.table(
        cellText=table_data,
        colLabels=col_labels,
        loc="center",
        cellLoc="left",
    )
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(fontsize)
    tbl.scale(1.0, 1.35)
    for (row, col), cell in tbl.get_celld().items():
        if row == 0:
            cell.set_facecolor("#4472C4")
            cell.get_text().set_color("white")
            cell.get_text().set_weight("bold")
            if color_column and col == 0:
                cell.get_text().set_text("Color")

    if color_column:
        for i, (cid, _) in enumerate(rows, start=1):
            sc = tbl[(i, 0)]
            sc.set_facecolor(_cluster_tab20_rgba(cid, cmap=cmap))
            sc.get_text().set_text("")
            sc.set_edgecolor("#333333")
            sc.set_linewidth(0.8)
            tbl[(i, 1)].set_facecolor("#f8f8f8")
            tbl[(i, 2)].set_facecolor("#f8f8f8")

    ax.set_title(title, fontsize=fontsize + 1)


def save_labeled_pc_scatter_3d_semantic(
    pc3: np.ndarray,
    labels: np.ndarray,
    path: str,
    *,
    ratios3: list[float],
    id_to_name: dict[int, str],
    title_suffix: str,
    id_to_short: dict[int, str] | None = None,
    embed_cluster_labels: dict[int, str] | None = None,
    max_points: int = PC3D_MAX_POINTS_DEFAULT,
    plot_jitter_frac: float = PC3D_PLOT_JITTER_FRAC_DEFAULT,
) -> None:
    """3D PCA scatter; optional ``embed_cluster_labels`` adds the cluster label table in the same figure."""
    Xdraw, iloc_idx, n_plot = pc3_subsample_jittered(
        pc3, max_points=max_points, plot_jitter_frac=plot_jitter_frac,
    )
    labs = np.asarray(labels[iloc_idx], dtype=int)
    embed = embed_cluster_labels is not None
    if embed:
        fig = plt.figure(figsize=(17.5, 8.5))
        gs = fig.add_gridspec(1, 2, width_ratios=[2.2, 1.15], wspace=0.07)
        ax = fig.add_subplot(gs[0, 0], projection="3d")
        ax_tbl = fig.add_subplot(gs[0, 1])
        render_cluster_label_table_axes(ax_tbl, embed_cluster_labels, fontsize=6.0)
    else:
        fig = plt.figure(figsize=(12.5, 8.0))
        ax = fig.add_subplot(111, projection="3d")
    uniq = np.unique(labs)
    cmap = plt.get_cmap("tab20")
    plot_alpha = 0.38 if plot_jitter_frac > 0.0 else 0.35
    for c in uniq:
        m = labs == c
        if not np.any(m):
            continue
        color = _cluster_tab20_rgba(int(c), cmap=cmap)
        scatter_kw: dict[str, Any] = {
            "s": SCATTER_3D_S_UNLABELED,
            "alpha": plot_alpha,
            "color": color,
            "linewidths": 0,
            "edgecolors": "none",
        }
        if not embed:
            if id_to_short is not None:
                leg = id_to_short.get(int(c)) or id_to_name.get(int(c), f"Cluster {int(c)}")
            else:
                leg = id_to_name.get(int(c), f"Cluster {int(c)}")
            scatter_kw["label"] = _wrap_legend_text(leg, width=44)
        ax.scatter(Xdraw[m, 0], Xdraw[m, 1], Xdraw[m, 2], **scatter_kw)
    set_3d_axis_limits_tight(ax, Xdraw)
    set_axes_labels_3d_ratios(ax, ratios3)
    cum3 = float(sum(ratios3))
    if embed:
        legend_kind = "3D + color-key legend"
    else:
        legend_kind = "cluster labels" if id_to_short is not None else "legacy legend"
    ax.set_title(
        f"PhilGEPS — PCA 3D ({legend_kind}; {title_suffix}; n_plot={n_plot:,}, 3-PC var={cum3:.3f})",
    )
    ax.view_init(elev=20, azim=30)
    if embed:
        fig.subplots_adjust(left=0.02, right=0.98, top=0.90, bottom=0.06)
        fig.savefig(path, dpi=150)
    else:
        handles, leg_labs = ax.get_legend_handles_labels()
        fig.subplots_adjust(left=0.03, right=0.56, top=0.92, bottom=0.06)
        fig.legend(
            handles,
            leg_labs,
            loc="upper left",
            bbox_to_anchor=(0.575, 0.92),
            bbox_transform=fig.transFigure,
            fontsize=9,
            framealpha=0.95,
            borderaxespad=0.0,
            handlelength=1.2,
            labelspacing=0.9,
        )
        fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def save_cluster_legend_table_png(
    path: str,
    *,
    id_to_short: dict[int, str],
) -> None:
    """Standalone PNG — same table as embedded in ``save_labeled_pc_scatter_3d_semantic``."""
    n = len(id_to_short)
    fig_h = max(4.0, 0.35 * n + 2.5)
    fig_w = 11.0
    fig, ax = plt.subplots(figsize=(fig_w, fig_h))
    render_cluster_label_table_axes(ax, id_to_short)
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)


def load_backtrack_frame(path_scaled: str = PATH_SCALED_CSV) -> pd.DataFrame:
    need = [c for c in BACKTRACK_COLS if c]
    if not os.path.isfile(path_scaled):
        raise FileNotFoundError(f"Missing scaled CSV: {path_scaled}")
    header = pd.read_csv(path_scaled, nrows=0)
    present = [c for c in need if c in header.columns]
    missing = [c for c in need if c not in header.columns]
    if missing:
        raise KeyError(f"Scaled CSV missing columns required for backtrack: {missing}")
    return pd.read_csv(path_scaled, usecols=present, low_memory=False)


def load_chosen_k(path: str = OUT_K_SELECTION_SUMMARY) -> dict[str, Any]:
    """Read step 05 summary and return its full payload (with `chosen_k`)."""
    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"Missing K selection summary {path}. Run 05_evaluating_kmeans_philgeps.py first.",
        )
    with open(path, encoding="utf-8") as f:
        payload = json.load(f)
    if "chosen_k" not in payload or not isinstance(payload["chosen_k"], int):
        raise ValueError(f"K selection summary missing integer 'chosen_k': {path}")
    return payload


def load_cluster_assignments(
    path: str = OUT_04_ASSIGNMENTS_CSV,
) -> tuple[np.ndarray, pd.DataFrame]:
    """Return ``(labels[N], dataframe[row_index, cluster_id])`` written by step 04."""
    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"Missing K-means assignments {path}. Run 04_kmeans_implementation_philgeps.py first.",
        )
    df = pd.read_csv(path)
    for c in ("row_index", "cluster_id"):
        if c not in df.columns:
            raise KeyError(f"Expected column {c} in {path}")
    df = df.sort_values("row_index", kind="mergesort").reset_index(drop=True)
    labels = df["cluster_id"].to_numpy(dtype=np.int64)
    return labels, df
