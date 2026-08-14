import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import numpy as np
import pandas as pd
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from src.models import StackingEnsembleModel

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)


def train_car_model():
    data_path = PROJECT_ROOT / "data" / "Used_Cars.csv"
    if not data_path.exists():
        logger.error("Used_Cars.csv not found")
        return

    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df)} raw car records")

    # Clean price
    if "selling_price" in df.columns:
        df["price"] = pd.to_numeric(df["selling_price"], errors="coerce")

    # Extract engine cc
    if "engine" in df.columns:
        df["engine_cc"] = df["engine"].astype(str).str.extract(r"(\d+)").astype(float)
    elif "engine_cc" not in df.columns:
        df["engine_cc"] = 1197.0

    # Extract max power bhp
    if "max_power" in df.columns:
        df["max_power_bhp"] = pd.to_numeric(
            df["max_power"].astype(str).str.extract(r"([\d\.]+)")[0], errors="coerce"
        )
    elif "max_power_bhp" not in df.columns:
        df["max_power_bhp"] = df["engine_cc"] * 0.075 + 10.0

    # Clean Brand
    if "brand" not in df.columns and "name" in df.columns:
        df["brand"] = df["name"].astype(str).str.split().str[0]

    # Calculate age
    current_year = datetime.now(timezone.utc).year
    if "year" in df.columns:
        df["age"] = (current_year - df["year"]).clip(lower=0, upper=35)
    elif "age" not in df.columns:
        df["age"] = 4.0

    # Kilometers driven
    if "km_driven" in df.columns:
        df["kms_driven"] = pd.to_numeric(df["km_driven"], errors="coerce")

    # Owner rank mapping
    owner_map = {
        "First Owner": 1,
        "Second Owner": 2,
        "Third Owner": 3,
        "Fourth & Above Owner": 4,
        "Fourth Owner Above": 4,
        "Test Drive Car": 1,
    }
    if "owner" in df.columns:
        df["owner_rank"] = df["owner"].map(owner_map).fillna(1).astype(int)

    # Impute missing values
    df["engine_cc"] = df["engine_cc"].fillna(df["engine_cc"].median())
    df["max_power_bhp"] = df["max_power_bhp"].fillna(df["engine_cc"] * 0.075 + 10.0)
    df["fuel"] = df["fuel"].fillna("Petrol")
    df["transmission"] = df["transmission"].fillna("Manual")

    # Drop outliers
    df = df.dropna(subset=["price", "brand", "kms_driven", "age"])
    df = df[(df["price"] >= 25000) & (df["price"] <= 10000000)]
    df = df[(df["kms_driven"] >= 100) & (df["kms_driven"] <= 350000)]

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
    X = df[features]
    y = df["price"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    cat_cols = ["brand", "fuel", "transmission"]
    for c in cat_cols:
        X_train[c] = X_train[c].astype(str)
        X_test[c] = X_test[c].astype(str)

    # Train CatBoost
    cat_model = CatBoostRegressor(
        iterations=600,
        learning_rate=0.06,
        depth=6,
        cat_features=cat_cols,
        verbose=False,
        random_seed=42,
    )
    cat_model.fit(X_train, y_train)

    # Train XGBoost on one-hot encoded features
    X_train_encoded = pd.get_dummies(X_train, columns=cat_cols, drop_first=True)
    X_test_encoded = pd.get_dummies(X_test, columns=cat_cols, drop_first=True)
    for col in X_train_encoded.columns:
        if col not in X_test_encoded.columns:
            X_test_encoded[col] = 0
    X_test_encoded = X_test_encoded[X_train_encoded.columns]

    xgb_model = XGBRegressor(
        n_estimators=300, learning_rate=0.06, max_depth=6, random_state=42
    )
    xgb_model.fit(X_train_encoded, y_train)

    # Ensemble
    ensemble = StackingEnsembleModel(
        cat_model=cat_model,
        xgb_model=xgb_model,
        lgb_model=None,
        weights=(0.6, 0.4, 0.0),
        categorical_features=cat_cols,
    )

    y_pred = ensemble.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

    logger.info(
        f"🚗 Car Model Upgrade Benchmark -> R²: {r2:.4f} | MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.2f}%"
    )

    # Save artifact
    joblib.dump(ensemble, MODELS_DIR / "car_model.joblib")

    metadata = {
        "model_version": datetime.now(timezone.utc).strftime("%Y.%m.%d"),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "CatBoost_XGBoost_Ensemble",
        "features": features,
        "categorical_features": cat_cols,
        "metrics": {
            "r2": round(float(r2), 4),
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "mape": round(float(mape), 2),
        },
        "training_ranges": {
            "engine_cc": {
                "min": float(X["engine_cc"].min()),
                "max": float(X["engine_cc"].max()),
            },
            "max_power_bhp": {
                "min": float(X["max_power_bhp"].min()),
                "max": float(X["max_power_bhp"].max()),
            },
            "age": {"min": float(X["age"].min()), "max": float(X["age"].max())},
            "kms_driven": {
                "min": float(X["kms_driven"].min()),
                "max": float(X["kms_driven"].max()),
            },
            "owner_rank": {
                "min": float(X["owner_rank"].min()),
                "max": float(X["owner_rank"].max()),
            },
        },
        "known_brands": sorted(X["brand"].dropna().unique().tolist()),
    }

    with open(MODELS_DIR / "car_model.metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Saved car_model.joblib & car_model.metadata.json")


def train_bike_model():
    data_path = PROJECT_ROOT / "data" / "Used_Bikes.csv"
    if not data_path.exists():
        logger.error("Used_Bikes.csv not found")
        return

    df = pd.read_csv(data_path)
    logger.info(f"Loaded {len(df)} raw bike records")

    # Clean brand
    if "brand" not in df.columns and "bike_name" in df.columns:
        df["brand"] = df["bike_name"].astype(str).str.split().str[0]

    # Owner rank mapping
    owner_map = {
        "First Owner": 1,
        "Second Owner": 2,
        "Third Owner": 3,
        "Fourth Owner Or More": 4,
    }
    if "owner" in df.columns:
        df["owner_rank"] = df["owner"].map(owner_map).fillna(1).astype(int)

    df = df.dropna(subset=["price", "brand", "kms_driven", "age", "power"])
    df = df[(df["price"] >= 1000) & (df["price"] <= 1500000)]
    df = df[(df["kms_driven"] >= 10) & (df["kms_driven"] <= 150000)]

    features = ["brand", "owner", "kms_driven", "age", "power", "owner_rank"]
    X = df[features]
    y = df["price"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    cat_cols = ["brand", "owner"]
    for c in cat_cols:
        X_train[c] = X_train[c].astype(str)
        X_test[c] = X_test[c].astype(str)

    cat_model = CatBoostRegressor(
        iterations=500,
        learning_rate=0.06,
        depth=6,
        cat_features=cat_cols,
        verbose=False,
        random_seed=42,
    )
    cat_model.fit(X_train, y_train)

    X_train_encoded = pd.get_dummies(X_train, columns=cat_cols, drop_first=True)
    X_test_encoded = pd.get_dummies(X_test, columns=cat_cols, drop_first=True)
    for col in X_train_encoded.columns:
        if col not in X_test_encoded.columns:
            X_test_encoded[col] = 0
    X_test_encoded = X_test_encoded[X_train_encoded.columns]

    xgb_model = XGBRegressor(
        n_estimators=300, learning_rate=0.06, max_depth=6, random_state=42
    )
    xgb_model.fit(X_train_encoded, y_train)

    ensemble = StackingEnsembleModel(
        cat_model=cat_model,
        xgb_model=xgb_model,
        lgb_model=None,
        weights=(0.6, 0.4, 0.0),
        categorical_features=cat_cols,
    )

    y_pred = ensemble.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

    logger.info(
        f"🏍️ Bike Model Upgrade Benchmark -> R²: {r2:.4f} | MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.2f}%"
    )

    joblib.dump(ensemble, MODELS_DIR / "best_model.joblib")

    metadata = {
        "model_version": datetime.now(timezone.utc).strftime("%Y.%m.%d"),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_type": "CatBoost_XGBoost_Ensemble",
        "features": features,
        "categorical_features": cat_cols,
        "metrics": {
            "r2": round(float(r2), 4),
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "mape": round(float(mape), 2),
        },
        "training_ranges": {
            "power": {"min": float(X["power"].min()), "max": float(X["power"].max())},
            "age": {"min": float(X["age"].min()), "max": float(X["age"].max())},
            "kms_driven": {
                "min": float(X["kms_driven"].min()),
                "max": float(X["kms_driven"].max()),
            },
            "owner_rank": {
                "min": float(X["owner_rank"].min()),
                "max": float(X["owner_rank"].max()),
            },
        },
        "known_brands": sorted(X["brand"].dropna().unique().tolist()),
    }

    with open(MODELS_DIR / "best_model.metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    logger.info("Saved best_model.joblib & best_model.metadata.json")


if __name__ == "__main__":
    train_car_model()
    train_bike_model()
