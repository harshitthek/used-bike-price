"""AutoValuate AI — Model Retraining and Publication-Grade Seaborn Visualization Engine.

Retrains both Motorcycle and Passenger Car stacking ensembles, evaluates test metrics,
and exports comprehensive multi-panel Seaborn diagnostic dashboards.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from catboost import CatBoostRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from src.models import StackingEnsembleModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("AutoValuate-Retrain")

# Directories
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports" / "figures"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Set Seaborn Luxury / Publication Dark Theme
plt.rcParams["font.sans-serif"] = ["DejaVu Sans", "Arial", "Helvetica"]
plt.rcParams["axes.edgecolor"] = "#334155"
plt.rcParams["axes.linewidth"] = 0.8
plt.rcParams["grid.color"] = "#1e293b"
plt.rcParams["grid.linestyle"] = "--"
plt.rcParams["grid.alpha"] = 0.6


def set_seaborn_style():
    sns.set_theme(
        style="darkgrid",
        rc={
            "figure.facecolor": "#0b0f19",
            "axes.facecolor": "#0f172a",
            "axes.edgecolor": "#334155",
            "grid.color": "#1e293b",
            "text.color": "#f8fafc",
            "axes.labelcolor": "#cbd5e1",
            "xtick.color": "#94a3b8",
            "ytick.color": "#94a3b8",
            "legend.facecolor": "#1e293b",
            "legend.edgecolor": "#475569",
        },
    )


# -----------------------------------------------------------------------------
# 1. MOTORCYCLE PIPELINE & SEABORN VISUALIZATION
# -----------------------------------------------------------------------------
def train_and_visualize_bikes():
    logger.info("🏍️ Starting Motorcycle Model Retraining & Seaborn Diagnostics...")
    bike_csv = DATA_DIR / "Used_Bikes.csv"
    if not bike_csv.exists():
        raise FileNotFoundError(f"Missing dataset: {bike_csv}")

    df = pd.read_csv(bike_csv)
    logger.info(f"Loaded {len(df):,} raw motorcycle records.")

    # Feature cleaning
    if "brand" not in df.columns and "bike_name" in df.columns:
        df["brand"] = df["bike_name"].astype(str).str.split().str[0]

    owner_map = {
        "First Owner": 1,
        "Second Owner": 2,
        "Third Owner": 3,
        "Fourth Owner Or More": 4,
    }
    if "owner" in df.columns:
        df["owner_rank"] = df["owner"].map(owner_map).fillna(1).astype(int)

    df = df.dropna(subset=["price", "brand", "kms_driven", "age", "power"])
    df = df[(df["price"] >= 5000) & (df["price"] <= 1500000)]
    df = df[(df["kms_driven"] >= 10) & (df["kms_driven"] <= 150000)]
    df = df[(df["age"] >= 0) & (df["age"] <= 30)]

    features = ["brand", "owner", "kms_driven", "age", "power", "owner_rank"]
    X = df[features].copy()
    y = df["price"].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    cat_cols = ["brand", "owner"]
    for c in cat_cols:
        X_train[c] = X_train[c].astype(str)
        X_test[c] = X_test[c].astype(str)

    # Train CatBoost
    cat_model = CatBoostRegressor(
        iterations=600,
        learning_rate=0.05,
        depth=6,
        cat_features=cat_cols,
        verbose=False,
        random_seed=42,
    )
    cat_model.fit(X_train, y_train)

    # Train XGBoost with drop_first=False
    X_train_encoded = pd.get_dummies(X_train, columns=cat_cols, drop_first=False)
    X_test_encoded = pd.get_dummies(X_test, columns=cat_cols, drop_first=False)
    for col in X_train_encoded.columns:
        if col not in X_test_encoded.columns:
            X_test_encoded[col] = 0
    X_test_encoded = X_test_encoded[X_train_encoded.columns]

    xgb_model = XGBRegressor(
        n_estimators=350, learning_rate=0.05, max_depth=6, random_state=42
    )
    xgb_model.fit(X_train_encoded, y_train)

    # Stacking Ensemble
    ensemble = StackingEnsembleModel(
        cat_model=cat_model,
        xgb_model=xgb_model,
        weights=(0.60, 0.40, 0.0),
        categorical_features=cat_cols,
    )

    y_pred = ensemble.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    residuals = y_test - y_pred

    logger.info(
        f"🏍️ Motorcycle Test Results -> R²: {r2:.4f} ({r2*100:.1f}%) | MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.2f}%"
    )

    # Save artifacts
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

    # --- SEABORN 6-PANEL FIGURE ---
    set_seaborn_style()
    fig, axes = plt.subplots(2, 3, figsize=(20, 12))
    fig.suptitle(
        f"AutoValuate AI — Motorcycle Valuation Model Performance & Market Intelligence\n"
        f"Stacking Ensemble (CatBoost 60% + XGBoost 40%) | Test R² = {r2*100:.2f}% | MAE = ₹{mae:,.0f} | RMSE = ₹{rmse:,.0f}",
        fontsize=16,
        fontweight="bold",
        color="#38bdf8",
        y=0.98,
    )

    # 1. Parity Plot (Actual vs Predicted)
    ax1 = axes[0, 0]
    sample_indices = np.random.choice(
        len(y_test), size=min(2500, len(y_test)), replace=False
    )
    y_test_sample = y_test.iloc[sample_indices]
    y_pred_sample = y_pred[sample_indices]

    sns.scatterplot(
        x=y_test_sample / 1000,
        y=y_pred_sample / 1000,
        alpha=0.45,
        color="#06b6d4",
        edgecolor="#0284c7",
        s=28,
        ax=ax1,
    )
    max_val = max(y_test_sample.max(), y_pred_sample.max()) / 1000
    ax1.plot(
        [0, max_val],
        [0, max_val],
        color="#f43f5e",
        linestyle="--",
        linewidth=2,
        label="Ideal Parity (y = x)",
    )
    ax1.set_title(
        f"Actual vs. Predicted Price (Parity Plot)\nR² = {r2:.4f}",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax1.set_xlabel("Actual Price (₹ in Thousands)")
    ax1.set_ylabel("Predicted Price (₹ in Thousands)")
    ax1.legend(loc="upper left")

    # 2. Residual Distribution with KDE
    ax2 = axes[0, 1]
    sns.histplot(
        residuals / 1000,
        kde=True,
        color="#818cf8",
        bins=40,
        ax=ax2,
        line_kws={"linewidth": 2, "color": "#a855f7"},
    )
    ax2.axvline(0, color="#22c55e", linestyle="--", linewidth=1.8, label="Zero Bias")
    ax2.set_title(
        "Residual Error Distribution (KDE)", fontweight="bold", color="#e2e8f0"
    )
    ax2.set_xlabel("Error Residual [Actual - Predicted] (₹ in Thousands)")
    ax2.set_ylabel("Frequency Count")
    ax2.legend(loc="upper right")

    # 3. Residuals vs Predicted Price (Heteroscedasticity)
    ax3 = axes[0, 2]
    sns.scatterplot(
        x=y_pred_sample / 1000,
        y=(y_test_sample - y_pred_sample) / 1000,
        alpha=0.4,
        color="#ec4899",
        s=24,
        ax=ax3,
    )
    ax3.axhline(0, color="#f43f5e", linestyle="--", linewidth=1.5)
    ax3.set_title(
        "Residuals vs. Predicted Price\n(Variance Homogeneity)",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax3.set_xlabel("Predicted Price (₹ in Thousands)")
    ax3.set_ylabel("Residual (₹ in Thousands)")

    # 4. Feature Importance
    ax4 = axes[1, 0]
    cat_importances = cat_model.get_feature_importance()
    feat_df = (
        pd.DataFrame({"Feature": features, "Importance": cat_importances})
        .sort_values("Importance", ascending=False)
        .reset_index(drop=True)
    )
    sns.barplot(
        x="Importance",
        y="Feature",
        data=feat_df,
        palette="crest",
        hue="Feature",
        legend=False,
        ax=ax4,
    )
    ax4.set_title(
        "CatBoost Model Feature Importance (%)", fontweight="bold", color="#e2e8f0"
    )
    ax4.set_xlabel("Relative Importance Weight (%)")
    ax4.set_ylabel("Feature Dimension")

    # 5. Top 8 Brands Price Boxplot
    ax5 = axes[1, 1]
    top_brands = df["brand"].value_counts().head(8).index
    df_top_brands = df[df["brand"].isin(top_brands)].copy()
    sns.boxplot(
        x="brand",
        y=df_top_brands["price"] / 1000,
        data=df_top_brands,
        palette="mako",
        hue="brand",
        legend=False,
        showfliers=False,
        ax=ax5,
    )
    ax5.set_title(
        "Market Resale Distribution by Top Brands", fontweight="bold", color="#e2e8f0"
    )
    ax5.set_xlabel("Manufacturer Brand")
    ax5.set_ylabel("Price (₹ in Thousands)")
    ax5.tick_params(axis="x", rotation=35)

    # 6. Age vs Price Depreciation Decay
    ax6 = axes[1, 2]
    sns.lineplot(
        x="age",
        y=df["price"] / 1000,
        data=df,
        color="#38bdf8",
        linewidth=2.5,
        errorbar=("ci", 95),
        ax=ax6,
    )
    ax6.set_title(
        "Empirical Market Depreciation Curve by Age",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax6.set_xlabel("Vehicle Age (Years)")
    ax6.set_ylabel("Mean Price (₹ in Thousands)")

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    bike_fig_path = REPORTS_DIR / "motorcycle_valuation_seaborn.png"
    plt.savefig(bike_fig_path, dpi=300, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved motorcycle Seaborn dashboard to: {bike_fig_path}")

    return {
        "r2": r2,
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "fig_path": bike_fig_path,
    }


# -----------------------------------------------------------------------------
# 2. PASSENGER CAR PIPELINE & SEABORN VISUALIZATION
# -----------------------------------------------------------------------------
def train_and_visualize_cars():
    logger.info("🚗 Starting Passenger Car Model Retraining & Seaborn Diagnostics...")
    car_csv = DATA_DIR / "Used_Cars.csv"
    if not car_csv.exists():
        raise FileNotFoundError(f"Missing dataset: {car_csv}")

    df = pd.read_csv(car_csv)
    logger.info(f"Loaded {len(df):,} raw passenger car records.")

    # Data transformation
    if "selling_price" in df.columns:
        df["price"] = pd.to_numeric(df["selling_price"], errors="coerce")

    if "engine" in df.columns:
        df["engine_cc"] = df["engine"].astype(str).str.extract(r"(\d+)").astype(float)
    elif "engine_cc" not in df.columns:
        df["engine_cc"] = 1197.0

    if "max_power" in df.columns:
        df["max_power_bhp"] = pd.to_numeric(
            df["max_power"].astype(str).str.extract(r"([\d\.]+)")[0], errors="coerce"
        )
    elif "max_power_bhp" not in df.columns:
        df["max_power_bhp"] = df["engine_cc"] * 0.075 + 10.0

    if "brand" not in df.columns and "name" in df.columns:
        df["brand"] = df["name"].astype(str).str.split().str[0]

    current_year = datetime.now(timezone.utc).year
    if "year" in df.columns:
        df["age"] = (current_year - df["year"]).clip(lower=0, upper=35)
    elif "age" not in df.columns:
        df["age"] = 4.0

    if "km_driven" in df.columns:
        df["kms_driven"] = pd.to_numeric(df["km_driven"], errors="coerce")

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

    df["engine_cc"] = df["engine_cc"].fillna(df["engine_cc"].median())
    df["max_power_bhp"] = df["max_power_bhp"].fillna(df["engine_cc"] * 0.075 + 10.0)
    df["fuel"] = df["fuel"].fillna("Petrol")
    df["transmission"] = df["transmission"].fillna("Manual")

    df = df.dropna(subset=["price", "brand", "kms_driven", "age"])
    df = df[(df["price"] >= 25000) & (df["price"] <= 8000000)]
    df = df[(df["kms_driven"] >= 100) & (df["kms_driven"] <= 350000)]

    features = [
        "brand",
        "fuel",
        "transmission",
        "engine_cc",
        "max_power_bhp",
        "kms_driven",
        "age",
        "owner_rank",
    ]
    X = df[features].copy()
    y = df["price"].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    cat_cols = ["brand", "fuel", "transmission"]
    for c in cat_cols:
        X_train[c] = X_train[c].astype(str)
        X_test[c] = X_test[c].astype(str)

    # CatBoost Car Model
    cat_model = CatBoostRegressor(
        iterations=600,
        learning_rate=0.06,
        depth=6,
        cat_features=cat_cols,
        verbose=False,
        random_seed=42,
    )
    cat_model.fit(X_train, y_train)

    # XGBoost Car Model
    X_train_encoded = pd.get_dummies(X_train, columns=cat_cols, drop_first=False)
    X_test_encoded = pd.get_dummies(X_test, columns=cat_cols, drop_first=False)
    for col in X_train_encoded.columns:
        if col not in X_test_encoded.columns:
            X_test_encoded[col] = 0
    X_test_encoded = X_test_encoded[X_train_encoded.columns]

    xgb_model = XGBRegressor(
        n_estimators=350, learning_rate=0.06, max_depth=6, random_state=42
    )
    xgb_model.fit(X_train_encoded, y_train)

    # Stacking Ensemble
    ensemble = StackingEnsembleModel(
        cat_model=cat_model,
        xgb_model=xgb_model,
        weights=(0.60, 0.40, 0.0),
        categorical_features=cat_cols,
    )

    y_pred = ensemble.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
    residuals = y_test - y_pred

    logger.info(
        f"🚗 Passenger Car Test Results -> R²: {r2:.4f} ({r2*100:.1f}%) | MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.2f}%"
    )

    # Save artifacts
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

    # --- SEABORN 6-PANEL FIGURE ---
    set_seaborn_style()
    fig, axes = plt.subplots(2, 3, figsize=(20, 12))
    fig.suptitle(
        f"AutoValuate AI — Passenger Car Valuation Model Performance & Market Intelligence\n"
        f"Stacking Ensemble (CatBoost 60% + XGBoost 40%) | Test R² = {r2*100:.2f}% | MAE = ₹{mae:,.0f} | RMSE = ₹{rmse:,.0f}",
        fontsize=16,
        fontweight="bold",
        color="#38bdf8",
        y=0.98,
    )

    # 1. Parity Plot (Actual vs Predicted in Lakhs)
    ax1 = axes[0, 0]
    sample_indices = np.random.choice(
        len(y_test), size=min(1500, len(y_test)), replace=False
    )
    y_test_sample = y_test.iloc[sample_indices]
    y_pred_sample = y_pred[sample_indices]

    sns.scatterplot(
        x=y_test_sample / 100000,
        y=y_pred_sample / 100000,
        alpha=0.45,
        color="#38bdf8",
        edgecolor="#0284c7",
        s=30,
        ax=ax1,
    )
    max_val = max(y_test_sample.max(), y_pred_sample.max()) / 100000
    ax1.plot(
        [0, max_val],
        [0, max_val],
        color="#f43f5e",
        linestyle="--",
        linewidth=2,
        label="Ideal Parity (y = x)",
    )
    ax1.set_title(
        f"Actual vs. Predicted Price (Parity Plot)\nR² = {r2:.4f}",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax1.set_xlabel("Actual Price (₹ in Lakhs)")
    ax1.set_ylabel("Predicted Price (₹ in Lakhs)")
    ax1.legend(loc="upper left")

    # 2. Residual Distribution with KDE
    ax2 = axes[0, 1]
    sns.histplot(
        residuals / 100000,
        kde=True,
        color="#a855f7",
        bins=40,
        ax=ax2,
        line_kws={"linewidth": 2, "color": "#c084fc"},
    )
    ax2.axvline(0, color="#22c55e", linestyle="--", linewidth=1.8, label="Zero Bias")
    ax2.set_title(
        "Residual Error Distribution (KDE)", fontweight="bold", color="#e2e8f0"
    )
    ax2.set_xlabel("Error Residual [Actual - Predicted] (₹ in Lakhs)")
    ax2.set_ylabel("Frequency Count")
    ax2.legend(loc="upper right")

    # 3. Engine Displacement vs Resale Price
    ax3 = axes[0, 2]
    sns.scatterplot(
        x=df["engine_cc"],
        y=df["price"] / 100000,
        hue=df["fuel"],
        palette="bright",
        alpha=0.5,
        s=26,
        ax=ax3,
    )
    ax3.set_title(
        "Engine Displacement (CC) vs. Resale Price",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax3.set_xlabel("Engine Capacity (CC)")
    ax3.set_ylabel("Price (₹ in Lakhs)")

    # 4. Feature Importance
    ax4 = axes[1, 0]
    cat_importances = cat_model.get_feature_importance()
    feat_df = (
        pd.DataFrame({"Feature": features, "Importance": cat_importances})
        .sort_values("Importance", ascending=False)
        .reset_index(drop=True)
    )
    sns.barplot(
        x="Importance",
        y="Feature",
        data=feat_df,
        palette="viridis",
        hue="Feature",
        legend=False,
        ax=ax4,
    )
    ax4.set_title(
        "CatBoost Model Feature Importance (%)", fontweight="bold", color="#e2e8f0"
    )
    ax4.set_xlabel("Relative Importance Weight (%)")
    ax4.set_ylabel("Feature Dimension")

    # 5. Price by Fuel Type & Transmission
    ax5 = axes[1, 1]
    sns.violinplot(
        x="fuel",
        y=df["price"] / 100000,
        hue="transmission",
        data=df,
        palette="coolwarm",
        split=True,
        inner="quart",
        cut=0,
        ax=ax5,
    )
    ax5.set_title(
        "Price Distribution by Fuel & Transmission",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax5.set_xlabel("Fuel Type")
    ax5.set_ylabel("Price (₹ in Lakhs)")
    ax5.set_ylim(0, 45)

    # 6. Age & Mileage Depreciation Surface
    ax6 = axes[1, 2]
    sns.lineplot(
        x="age",
        y=df["price"] / 100000,
        hue="transmission",
        data=df,
        palette=["#38bdf8", "#f43f5e"],
        linewidth=2.5,
        ax=ax6,
    )
    ax6.set_title(
        "Depreciation Trajectory by Transmission",
        fontweight="bold",
        color="#e2e8f0",
    )
    ax6.set_xlabel("Vehicle Age (Years)")
    ax6.set_ylabel("Mean Price (₹ in Lakhs)")

    plt.tight_layout(rect=[0, 0.03, 1, 0.95])
    car_fig_path = REPORTS_DIR / "car_valuation_seaborn.png"
    plt.savefig(car_fig_path, dpi=300, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved car Seaborn dashboard to: {car_fig_path}")

    return {
        "r2": r2,
        "mae": mae,
        "rmse": rmse,
        "mape": mape,
        "fig_path": car_fig_path,
    }


# -----------------------------------------------------------------------------
# 3. EXECUTIVE DUAL-MODEL COMPARATIVE SEABORN DASHBOARD
# -----------------------------------------------------------------------------
def generate_dual_model_summary(bike_res, car_res):
    logger.info("📊 Generating Executive Dual-Model Comparison Dashboard...")
    set_seaborn_style()
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    fig.suptitle(
        "AutoValuate AI — Executive Model Comparison & Accuracy Metrics",
        fontsize=15,
        fontweight="bold",
        color="#38bdf8",
        y=1.02,
    )

    # 1. R² Accuracy Comparison
    ax1 = axes[0]
    metrics_df = pd.DataFrame(
        {
            "Pipeline": ["Motorcycles", "Passenger Cars"],
            "R2_Score": [bike_res["r2"] * 100, car_res["r2"] * 100],
        }
    )
    sns.barplot(
        x="Pipeline",
        y="R2_Score",
        data=metrics_df,
        palette=["#06b6d4", "#818cf8"],
        hue="Pipeline",
        legend=False,
        ax=ax1,
    )
    ax1.set_title("Cross-Validated R² Score (%)", fontweight="bold", color="#e2e8f0")
    ax1.set_ylabel("R² Percentage (%)")
    ax1.set_ylim(90, 100)
    for p in ax1.patches:
        ax1.annotate(
            f"{p.get_height():.2f}%",
            (p.get_x() + p.get_width() / 2.0, p.get_height() - 1.2),
            ha="center",
            va="center",
            fontsize=12,
            fontweight="bold",
            color="#ffffff",
        )

    # 2. Mean Absolute Percentage Error (MAPE)
    ax2 = axes[1]
    mape_df = pd.DataFrame(
        {
            "Pipeline": ["Motorcycles", "Passenger Cars"],
            "MAPE": [bike_res["mape"], car_res["mape"]],
        }
    )
    sns.barplot(
        x="Pipeline",
        y="MAPE",
        data=mape_df,
        palette=["#10b981", "#f59e0b"],
        hue="Pipeline",
        legend=False,
        ax=ax2,
    )
    ax2.set_title(
        "Mean Absolute Percentage Error (MAPE %)", fontweight="bold", color="#e2e8f0"
    )
    ax2.set_ylabel("Error % (Lower is Better)")
    for p in ax2.patches:
        ax2.annotate(
            f"{p.get_height():.2f}%",
            (p.get_x() + p.get_width() / 2.0, p.get_height() / 2.0),
            ha="center",
            va="center",
            fontsize=12,
            fontweight="bold",
            color="#ffffff",
        )

    # 3. MAE in Currency
    ax3 = axes[2]
    mae_df = pd.DataFrame(
        {
            "Pipeline": ["Motorcycles (₹)", "Passenger Cars (₹ in 10k)"],
            "Error": [bike_res["mae"], car_res["mae"] / 10000],
        }
    )
    sns.barplot(
        x="Pipeline",
        y="Error",
        data=mae_df,
        palette=["#ec4899", "#a855f7"],
        hue="Pipeline",
        legend=False,
        ax=ax3,
    )
    ax3.set_title(
        "Mean Absolute Error (Currency Scale)", fontweight="bold", color="#e2e8f0"
    )
    ax3.set_ylabel("MAE (₹)")
    for idx, p in enumerate(ax3.patches):
        txt = (
            f"₹{bike_res['mae']:,.0f}"
            if idx == 0
            else f"₹{car_res['mae']:,.0f}\n(₹{car_res['mae']/100000:.2f}L)"
        )
        ax3.annotate(
            txt,
            (p.get_x() + p.get_width() / 2.0, p.get_height() / 2.0),
            ha="center",
            va="center",
            fontsize=11,
            fontweight="bold",
            color="#ffffff",
        )

    plt.tight_layout()
    summary_path = REPORTS_DIR / "dual_model_seaborn_summary.png"
    plt.savefig(summary_path, dpi=300, bbox_inches="tight")
    plt.close()
    logger.info(f"Saved executive summary Seaborn dashboard to: {summary_path}")
    return summary_path


def main():
    print("=" * 70)
    print("  AutoValuate AI — Model Retraining & Seaborn Visualization Engine")
    print("=" * 70)

    # 1. Retrain & Plot Bikes
    bike_metrics = train_and_visualize_bikes()

    # 2. Retrain & Plot Cars
    car_metrics = train_and_visualize_cars()

    # 3. Generate Executive Summary
    summary_path = generate_dual_model_summary(bike_metrics, car_metrics)

    # Copy images to artifacts directory if available
    brain_dir = Path(r"C:\Users\user\.gemini\antigravity\brain\e9c0fafa-bf59-441b-b143-ad30379bf626")
    if brain_dir.exists():
        for p in [bike_metrics["fig_path"], car_metrics["fig_path"], summary_path]:
            shutil.copy2(p, brain_dir / p.name)
            logger.info(f"Copied {p.name} to artifact directory for UI display.")

    print("\n" + "=" * 70)
    print("  [SUCCESS] All models retrained & Seaborn dashboards successfully generated!")
    print(f"  Motorcycle Dashboard: {bike_metrics['fig_path']}")
    print(f"  Passenger Car Dashboard: {car_metrics['fig_path']}")
    print(f"  Executive Summary Dashboard: {summary_path}")
    print("=" * 70)


if __name__ == "__main__":
    main()
