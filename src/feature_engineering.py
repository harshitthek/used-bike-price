"""Derived feature engineering for model pipelines.

These features are generated inside the sklearn pipeline so training and
inference both apply the exact same transformations.
"""
from __future__ import annotations

from typing import Iterable

import numpy as np
import pandas as pd


DERIVED_NUMERIC_FEATURES: list[str] = [
    "kms_per_year",
    "power_per_year",
    "log_kms_driven",
    "age_squared",
]


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add numeric interaction features used by model training/inference.

    Required columns: kms_driven, age, power.
    """
    required: Iterable[str] = ("kms_driven", "age", "power")
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns for feature engineering: {missing}")

    out = df.copy()

    # Prevent division-by-zero while preserving behavior for brand-new bikes.
    age_safe = np.where(out["age"].to_numpy(dtype=float) > 0, out["age"].to_numpy(dtype=float), 1.0)
    kms = out["kms_driven"].to_numpy(dtype=float)
    power = out["power"].to_numpy(dtype=float)

    out["kms_per_year"] = kms / age_safe
    out["power_per_year"] = power / age_safe
    out["log_kms_driven"] = np.log1p(np.clip(kms, a_min=0, a_max=None))
    out["age_squared"] = np.square(out["age"].to_numpy(dtype=float))

    return out
