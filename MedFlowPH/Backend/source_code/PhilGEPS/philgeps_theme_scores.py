"""Policy theme proxy scores for PhilGEPS step 02 (Layer A add-on)."""

from __future__ import annotations

from typing import Any, Callable

import numpy as np
import pandas as pd

SHORTAGE_WEIGHTS_BID_NOTICE = 0.35
SHORTAGE_WEIGHTS_PROCUREMENT_MODE = 0.35
SHORTAGE_WEIGHTS_DECISION_LAG = 0.30

# Target theme columns for interpretation / richer k-means profiles [0, 1].
POLICY_THEME_SCORE_COLUMNS: tuple[str, ...] = (
    "high_risk_shortage",
    "low_risk_shortage",
    "overstocking",
    "normal_inventory",
    "understocking",
    "unequal_supply_regions",
    "equal_supply_regions",
)

# Subset for PCA(3) + theme-focused k-means: one axis per phenomenon; omit linear complements
# (low_risk_shortage, understocking, equal_supply_regions) already determined by the included pair.
POLICY_THEME_CLUSTERING_COLUMNS: tuple[str, ...] = (
    "high_risk_shortage",
    "overstocking",
    "normal_inventory",
    "unequal_supply_regions",
)

# Underlying Layer C numerics used for PCA when avoiding theme aggregate labels (step 03 --matrix base).
# Aligns with inputs in add_policy_theme_scores; not identical to theme scores (shortage also uses
# Bid Notice Status / Procurement Mode flags; regional theme uses group HHI, not row log1p contract alone).
POLICY_PCA_BASE_COLUMNS: tuple[str, ...] = (
    "award_decision_lag_days",
    "log1p_Quantity",
    "log1p_Approved_Budget_of_the_Contract",
    "log1p_Item_Budget",
    "log1p_Contract_Amount",
)


def _slug(name: str) -> str:
    out = []
    for ch in name:
        out.append(ch if ch.isalnum() else "_")
    s = "".join(out).strip("_")
    return s or "col"


def add_policy_theme_scores(
    df_a: pd.DataFrame,
    *,
    log: Callable[[str], None],
) -> tuple[pd.DataFrame, dict[str, Any]]:
    """Append policy theme proxy scores (see POLICY_THEME_SCORE_COLUMNS)."""
    df = df_a.copy()
    n = len(df)

    # --- Base: procurement stress / shortage proxy (legacy shortage_risk_score composite)
    bid = df["Bid Notice Status"].astype(str).str.lower()
    bid_score = bid.str.contains(r"cancel|fail|revok", regex=True, na=False).astype(np.float64)
    mode = df["Procurement Mode"].astype(str).str.lower()
    mode_score = mode.str.contains(
        r"emergency|two\s*failed|53\.2|failed\s*bidd", regex=True, na=False,
    ).astype(np.float64)
    lag_col = "award_decision_lag_days"
    if lag_col in df.columns:
        lag_rank = df[lag_col].rank(pct=True, method="average").fillna(0.0)
    else:
        log("Policy themes: award_decision_lag_days missing; lag term in shortage composite set to 0")
        lag_rank = pd.Series(0.0, index=df.index)
    shortage_raw = (
        SHORTAGE_WEIGHTS_BID_NOTICE * bid_score
        + SHORTAGE_WEIGHTS_PROCUREMENT_MODE * mode_score
        + SHORTAGE_WEIGHTS_DECISION_LAG * lag_rank
    )
    shortage_stress = shortage_raw.clip(0.0, 1.0)

    df["high_risk_shortage"] = shortage_stress
    df["low_risk_shortage"] = (1.0 - shortage_stress).clip(0.0, 1.0)

    # --- Base: ordering intensity proxy (legacy inventory_posture_proxy_score)
    lq_name = f"log1p_{_slug('Quantity')}"
    lb_name = f"log1p_{_slug('Item Budget')}"
    ranks: list[pd.Series] = []
    if lq_name in df.columns:
        ranks.append(df[lq_name].rank(pct=True, method="average").fillna(0.0))
    if lb_name in df.columns:
        ranks.append(df[lb_name].rank(pct=True, method="average").fillna(0.0))
    if ranks:
        inv = pd.concat(ranks, axis=1).mean(axis=1).clip(0.0, 1.0)
    else:
        log("Policy themes: log1p quantity/budget missing; inventory posture proxies set to 0")
        inv = pd.Series(0.0, index=df.index)

    df["overstocking"] = inv
    df["understocking"] = (1.0 - inv).clip(0.0, 1.0)
    df["normal_inventory"] = (1.0 - 2.0 * (inv - 0.5).abs()).clip(0.0, 1.0)

    # --- Base: spatial concentration (legacy supply_equity_concentration_score)
    ca_name = f"log1p_{_slug('Contract Amount')}"
    if "Client Agency" in df.columns and "Year" in df.columns and "Region" in df.columns:
        if ca_name in df.columns:
            amt = np.expm1(df[ca_name].clip(lower=0.0).astype(np.float64))
        else:
            log("Policy themes: log1p contract amount missing; using 1.0 weight for Herfindahl")
            amt = pd.Series(1.0, index=df.index)
        row_score = pd.Series(0.0, index=df.index, dtype=np.float64)
        gdf = df.assign(_amt=amt.values)
        for _, sub in gdf.groupby(["Client Agency", "Year"], sort=False):
            idx = sub.index
            if len(sub) < 2:
                continue
            by_r = sub.groupby("Region", sort=False)["_amt"].sum()
            total = float(by_r.sum())
            if total <= 0:
                continue
            sh = (by_r / total).astype(np.float64)
            hhi = float((sh * sh).sum())
            k = int(sh.shape[0])
            hhi_uniform = 1.0 / k if k else 0.0
            if hhi_uniform <= 0:
                continue
            norm = (hhi - hhi_uniform) / (1.0 - hhi_uniform + 1e-12)
            row_score.loc[idx] = float(np.clip(norm, 0.0, 1.0))
        df["unequal_supply_regions"] = row_score.clip(0.0, 1.0)
        df["equal_supply_regions"] = (1.0 - df["unequal_supply_regions"]).clip(0.0, 1.0)
    else:
        log("Policy themes: Client Agency / Year / Region missing; regional supply scores set to 0")
        df["unequal_supply_regions"] = 0.0
        df["equal_supply_regions"] = 0.0

    diag: dict[str, Any] = {"rows": int(n)}
    for c in POLICY_THEME_SCORE_COLUMNS:
        diag[f"{c}_mean"] = float(df[c].mean())
    log(
        "Policy theme scores attached: "
        + ", ".join(f"{c}={diag[f'{c}_mean']:.4f}" for c in POLICY_THEME_SCORE_COLUMNS),
    )
    return df, diag
