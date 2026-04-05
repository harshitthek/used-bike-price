"""Clean and engineer features from the raw Used Bikes dataset."""
from __future__ import annotations

from typing import List, Tuple

import numpy as np
import pandas as pd

from src.contracts import OWNER_LABEL_TO_RANK


# ── Feature lists (after preprocessing) ────────────────────────
CATEGORICAL_FEATURES: List[str] = ["brand", "owner"]
NUMERIC_FEATURES: List[str] = ["kms_driven", "age", "power"]
TARGET: str = "price"


def preprocess(df: pd.DataFrame, *, verbose: bool = True) -> pd.DataFrame:
    """Run the full cleaning & feature-engineering pipeline.

    Steps
    -----
    1. Drop duplicates
    2. Parse / coerce dtypes
    3. Drop rows with missing target (price)
    4. Handle missing values in features
    5. Remove outliers (IQR-based on price and kms_driven)
    6. Engineer ``owner_rank`` ordinal encoding
    7. Select final columns

    Returns a clean DataFrame ready for modelling.
    """
    n_start = len(df)
    if verbose:
        print("[preprocessing] Starting with {:,} rows".format(n_start))

    df = df.copy()

    # ── 1. Duplicates ──────────────────────────────────────────
    df.drop_duplicates(inplace=True)
    _log(verbose, "drop_duplicates", n_start, len(df))

    # ── 2. Dtype coercion ──────────────────────────────────────
    for col in ("price", "kms_driven", "age", "power"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # ── 3. Drop rows missing target ────────────────────────────
    before = len(df)
    df.dropna(subset=[TARGET], inplace=True)
    _log(verbose, "drop missing target", before, len(df))

    # ── 4. Drop rows where price ≤ 0 ──────────────────────────
    before = len(df)
    df = df[df[TARGET] > 0]
    _log(verbose, "drop price ≤ 0", before, len(df))

    # ── 5. Handle missing feature values ───────────────────────
    # Numeric: fill with median
    for col in NUMERIC_FEATURES:
        if col in df.columns and df[col].isnull().any():
            median = df[col].median()
            df[col].fillna(median, inplace=True)
            if verbose:
                print(f"  filled {col} NaNs with median={median:.1f}")

    # Categorical: fill with 'Unknown'
    for col in CATEGORICAL_FEATURES:
        if col in df.columns and df[col].isnull().any():
            df[col].fillna("Unknown", inplace=True)
            if verbose:
                print(f"  filled {col} NaNs with 'Unknown'")

    # ── 6. Age sanity check ─────────────────────────────────────
    if "age" in df.columns:
        before = len(df)
        df = df[df["age"].between(0, 30)]  # No bike older than 30 years
        _log(verbose, "drop age > 30 years", before, len(df))

    # ── 7. Outlier removal (IQR) ───────────────────────────────
    for col in ("price", "kms_driven"):
        if col in df.columns:
            before = len(df)
            df = _remove_iqr_outliers(df, col, factor=3.0)
            _log(verbose, f"IQR outliers ({col})", before, len(df))

    # ── 8. Remove rare brands (< 5 samples) ────────────────────
    if "brand" in df.columns:
        brand_counts = df["brand"].value_counts()
        rare_brands = brand_counts[brand_counts < 5].index.tolist()
        if rare_brands:
            before = len(df)
            df = df[~df["brand"].isin(rare_brands)]
            _log(verbose, f"rare brands {rare_brands}", before, len(df))

    # ── 9. Owner ordinal encoding ──────────────────────────────
    if "owner" in df.columns:
        df["owner_rank"] = df["owner"].map(OWNER_LABEL_TO_RANK).fillna(3).astype(int)

    # ── 10. Select final columns ───────────────────────────────
    keep = [c for c in (CATEGORICAL_FEATURES + NUMERIC_FEATURES + ["owner_rank", TARGET])
            if c in df.columns]
    df = df[keep].reset_index(drop=True)

    if verbose:
        print(f"[preprocessing] Done — {len(df):,} clean rows, "
              f"columns: {list(df.columns)}")

    return df


def get_feature_target_split(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Split a preprocessed DataFrame into X (features) and y (target).

    Returns
    -------
    X : pd.DataFrame
    y : pd.Series
    """
    if TARGET not in df.columns:
        raise ValueError(f"Target column '{TARGET}' not found in dataframe.")
    y = df[TARGET]
    X = df.drop(columns=[TARGET])
    return X, y


# ── helpers ─────────────────────────────────────────────────────

def _remove_iqr_outliers(
    df: pd.DataFrame, col: str, factor: float = 1.5,
) -> pd.DataFrame:
    """Remove rows where *col* is outside Q1 − factor*IQR .. Q3 + factor*IQR."""
    q1 = df[col].quantile(0.25)
    q3 = df[col].quantile(0.75)
    iqr = q3 - q1
    lower = q1 - factor * iqr
    upper = q3 + factor * iqr
    return df[(df[col] >= lower) & (df[col] <= upper)]


def _log(verbose: bool, step: str, before: int, after: int) -> None:
    if verbose and before != after:
        print(f"  {step}: {before:,} → {after:,}  (−{before - after:,})")
