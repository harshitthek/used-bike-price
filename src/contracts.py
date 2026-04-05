"""Shared inference/training contract constants.

These constants keep field names, accepted ranges, and owner mappings
consistent across preprocessing, API validation, and CLI inference.
"""
from __future__ import annotations

from typing import Dict, Tuple

# API and UI expected bounds
POWER_MIN: float = 50.0
POWER_MAX: float = 2500.0
KMS_MIN: float = 0.0
KMS_MAX: float = 999999.0
AGE_MIN: float = 0.0
AGE_MAX: float = 50.0
OWNER_RANK_MIN: int = 1
OWNER_RANK_MAX: int = 5

# Stable owner mapping used across the app
OWNER_RANK_TO_LABEL: Dict[int, str] = {
    1: "First Owner",
    2: "Second Owner",
    3: "Third Owner",
    4: "Fourth Owner",
    5: "Fourth Owner Or More",
}

# Include a compatibility alias used in older API code.
OWNER_LABEL_TO_RANK: Dict[str, int] = {
    "First Owner": 1,
    "Second Owner": 2,
    "Third Owner": 3,
    "Fourth Owner": 4,
    "Fourth Owner Above": 5,
    "Fourth Owner Or More": 5,
}

# The model expects this feature set at inference time.
PREDICTION_FEATURES: Tuple[str, ...] = (
    "brand",
    "owner",
    "kms_driven",
    "age",
    "power",
    "owner_rank",
)
