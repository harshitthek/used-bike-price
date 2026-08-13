"""Training and evaluation pipeline for Used Cars in India."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBRegressor

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "Used_Cars.csv"
MODELS_DIR = PROJECT_ROOT / "models"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"


def load_and_preprocess_cars(data_path: Path | str = DATA_PATH) -> pd.DataFrame:
    """Clean and structure raw Used Cars data."""
    df = pd.read_csv(data_path)
    df = df.copy()

    # Extract brand from full name
    df["brand"] = df["name"].apply(lambda x: str(x).split()[0].strip())

    # Calculate age
    if "year" in df.columns:
        current_year = datetime.now().year
        df["age"] = (current_year - df["year"]).clip(lower=0, upper=35)

    # Extract numeric engine (cc)
    if "engine" in df.columns:
        df["engine_cc"] = df["engine"].astype(str).str.extract(r"(\d+)").astype(float)

    # Extract numeric max_power (bhp)
    if "max_power" in df.columns:
        df["max_power_bhp"] = (
            df["max_power"].astype(str).str.extract(r"(\d+\.?\d*)").astype(float)
        )

    # Standardize fuel
    df["fuel"] = df["fuel"].astype(str).str.strip().str.capitalize()
    df["fuel"] = df["fuel"].replace({"Lpg": "CNG"})  # Group rare LPG with CNG

    # Standardize transmission
    df["transmission"] = df["transmission"].astype(str).str.strip().str.capitalize()

    # Owner rank mapping
    owner_map = {
        "First Owner": 1,
        "Second Owner": 2,
        "Third Owner": 3,
        "Fourth & Above Owner": 4,
        "Test Drive Car": 1,
    }
    df["owner_rank"] = df["owner"].map(owner_map).fillna(3).astype(int)

    # Drop missing essential values
    df = df.dropna(
        subset=[
            "selling_price",
            "engine_cc",
            "max_power_bhp",
            "brand",
            "fuel",
            "transmission",
            "km_driven",
            "age",
        ]
    )
    df = df[df["selling_price"] > 0]
    df = df[df["km_driven"] >= 100]

    # Filter rare brands with < 4 samples
    brand_counts = df["brand"].value_counts()
    rare_brands = brand_counts[brand_counts < 4].index.tolist()
    df = df[~df["brand"].isin(rare_brands)]

    # Rename km_driven to kms_driven for consistency
    df = df.rename(columns={"km_driven": "kms_driven", "selling_price": "price"})

    # Deduplicate
    df = df.drop_duplicates().reset_index(drop=True)
    return df


def train_car_model():
    """Train XGBoost car pricing model and save artifacts."""
    print("=" * 60)
    print("  TRAINING USED CAR PRICING MODEL")
    print("=" * 60)

    df = load_and_preprocess_cars()
    print(f"  Cleaned dataset: {len(df):,} listings")

    features = [
        "brand",
        "fuel",
        "transmission",
        "engine_cc",
        "max_power_bhp",
        "age",
        "kms_driven",
        "owner_rank",
    ]
    target = "price"

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    cat_features = ["brand", "fuel", "transmission"]
    num_features = ["engine_cc", "max_power_bhp", "age", "kms_driven", "owner_rank"]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_features,
            ),
            ("num", StandardScaler(), num_features),
        ]
    )

    model = XGBRegressor(
        n_estimators=350,
        max_depth=6,
        learning_rate=0.07,
        min_child_weight=2,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        n_jobs=-1,
    )

    pipeline = Pipeline([("preprocessor", preprocessor), ("model", model)])

    print("  Fitting XGBoost on training set...")
    pipeline.fit(X_train, y_train)

    # Evaluation
    preds = pipeline.predict(X_test)
    r2 = r2_score(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mape = np.mean(np.abs((y_test - preds) / y_test)) * 100

    print("\n  TEST RESULTS:")
    print(f"    R² Score : {r2:.4f}")
    print(f"    MAE      : INR {mae:,.0f}")
    print(f"    RMSE     : INR {rmse:,.0f}")
    print(f"    MAPE     : {mape:.2f}%")

    # Save model and metadata
    os.makedirs(MODELS_DIR, exist_ok=True)
    car_model_path = MODELS_DIR / "car_model.joblib"
    joblib.dump(pipeline, car_model_path)
    print(f"\n  Saved car model: {car_model_path}")

    metadata = {
        "metadata_version": 1,
        "vehicle_type": "car",
        "model_version": datetime.now(timezone.utc).strftime("%Y.%m.%d"),
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "random_state": 42,
        "training_samples": len(X_train),
        "target": "price",
        "metrics": {
            "r2": round(r2, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
        },
        "training_ranges": {
            "age": {
                "min": float(X_train["age"].min()),
                "max": float(X_train["age"].max()),
            },
            "kms_driven": {
                "min": float(X_train["kms_driven"].min()),
                "max": float(X_train["kms_driven"].max()),
            },
            "engine_cc": {
                "min": float(X_train["engine_cc"].min()),
                "max": float(X_train["engine_cc"].max()),
            },
            "max_power_bhp": {
                "min": float(X_train["max_power_bhp"].min()),
                "max": float(X_train["max_power_bhp"].max()),
            },
            "owner_rank": {
                "min": int(X_train["owner_rank"].min()),
                "max": int(X_train["owner_rank"].max()),
            },
        },
        "known_brands": sorted(X_train["brand"].unique().tolist()),
        "known_fuels": sorted(X_train["fuel"].unique().tolist()),
        "known_transmissions": sorted(X_train["transmission"].unique().tolist()),
    }

    metadata_path = MODELS_DIR / "car_model.metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Saved car metadata: {metadata_path}")


if __name__ == "__main__":
    train_car_model()
