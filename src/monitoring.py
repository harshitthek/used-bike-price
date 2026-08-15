from datetime import datetime, timedelta, timezone
from typing import Dict

import numpy as np
from sqlalchemy import func, select

from src.database import PredictionLog, async_session


def _psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
    """Calculate Population Stability Index between two distributions."""
    breakpoints = np.linspace(
        min(expected.min(), actual.min()), max(expected.max(), actual.max()), bins + 1
    )
    expected_counts = np.histogram(expected, bins=breakpoints)[0] + 1
    actual_counts = np.histogram(actual, bins=breakpoints)[0] + 1

    expected_pct = expected_counts / expected_counts.sum()
    actual_pct = actual_counts / actual_counts.sum()

    psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return round(float(psi_value), 4)


# Training data reference distributions (loaded from CSVs at startup)
_reference_distributions: Dict[str, Dict[str, np.ndarray]] = {}


def load_reference_distributions():
    """Load training data distributions for drift comparison."""
    import pandas as pd

    global _reference_distributions

    try:
        df_bikes = pd.read_csv("data/Used_Bikes.csv").dropna()
        _reference_distributions["bike"] = {
            "power": df_bikes["power"].values.astype(float),
            "kms_driven": df_bikes["kms_driven"].values.astype(float),
            "age": df_bikes["age"].values.astype(float),
            "price": df_bikes["price"].values.astype(float),
        }
    except Exception:
        pass

    try:
        df_cars = pd.read_csv("data/Used_Cars.csv").dropna(
            subset=["selling_price", "km_driven", "year"]
        )
        _reference_distributions["car"] = {
            "km_driven": df_cars["km_driven"].values.astype(float),
            "year": df_cars["year"].values.astype(float),
            "selling_price": df_cars["selling_price"].values.astype(float),
        }
    except Exception:
        pass


async def get_drift_report() -> dict:
    """Generate a drift report comparing recent predictions to training data."""
    if not _reference_distributions:
        load_reference_distributions()

    async with async_session() as session:
        # Get total prediction count
        total_count = await session.scalar(select(func.count(PredictionLog.id)))

        # Get last 24h count
        yesterday = datetime.now(timezone.utc) - timedelta(hours=24)
        recent_count = await session.scalar(
            select(func.count(PredictionLog.id)).where(
                PredictionLog.created_at >= yesterday
            )
        )

        # Get recent predictions for drift analysis
        recent_logs = await session.scalars(
            select(PredictionLog).order_by(PredictionLog.id.desc()).limit(200)
        )
        logs = recent_logs.all()

    drift_features = {}

    for vtype in ["bike", "car"]:
        vtype_logs = [item for item in logs if item.vehicle_type == vtype]
        if len(vtype_logs) < 20 or vtype not in _reference_distributions:
            continue

        # Extract numeric features from logged inputs
        recent_prices = np.array([item.estimated_price for item in vtype_logs])
        ref = _reference_distributions[vtype]

        price_key = "price" if vtype == "bike" else "selling_price"
        if price_key in ref:
            psi_val = _psi(ref[price_key], recent_prices)
            status = (
                "stable" if psi_val < 0.1 else "monitor" if psi_val < 0.2 else "drift"
            )
            drift_features[f"{vtype}_price"] = {
                "psi": psi_val,
                "status": status,
                "recent_mean": round(float(recent_prices.mean())),
                "training_mean": round(float(ref[price_key].mean())),
                "sample_size": len(vtype_logs),
            }

    return {
        "total_predictions": total_count or 0,
        "predictions_24h": recent_count or 0,
        "drift_analysis": drift_features,
        "recommendation": (
            "stable"
            if all(v["status"] == "stable" for v in drift_features.values())
            else "review"
        ),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
