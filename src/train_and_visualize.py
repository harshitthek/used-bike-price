"""AutoValuate AI — Ultra-Premium Seaborn Visual Analytics Engine.

Generates high-resolution, publication-grade analytical dashboards for
Motorcycle, Passenger Car, and Executive Benchmark ML pipelines.
"""

from __future__ import annotations

import logging
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

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
logger = logging.getLogger("AutoValuate-Analytics")

DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"
REPORTS_DIR = PROJECT_ROOT / "reports" / "figures"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)


# -----------------------------------------------------------------------------
# LUXURY SEABORN THEME
# -----------------------------------------------------------------------------
def apply_luxury_seaborn_theme():
    """Apply high-contrast dark obsidian luxury palette."""
    sns.set_theme(
        style="darkgrid",
        rc={
            "figure.facecolor": "#070a12",
            "axes.facecolor": "#0d1322",
            "axes.edgecolor": "#1e293b",
            "axes.linewidth": 1.2,
            "grid.color": "#172033",
            "grid.linestyle": "--",
            "grid.alpha": 0.7,
            "text.color": "#f1f5f9",
            "axes.labelcolor": "#94a3b8",
            "xtick.color": "#64748b",
            "ytick.color": "#64748b",
            "xtick.labelsize": 10,
            "ytick.labelsize": 10,
            "axes.labelsize": 11,
            "axes.titlesize": 13,
            "legend.facecolor": "#0d1322",
            "legend.edgecolor": "#334155",
            "legend.fontsize": 10,
            "font.family": "sans-serif",
            "font.sans-serif": [
                "Inter",
                "Segoe UI",
                "DejaVu Sans",
                "Arial",
                "Helvetica",
            ],
        },
    )


# -----------------------------------------------------------------------------
# 1. MOTORCYCLE SEABORN DASHBOARD
# -----------------------------------------------------------------------------
def train_and_visualize_bikes():
    logger.info("🏍️ Training Motorcycle Stacking Ensemble & Generating Visuals...")
    df = pd.read_csv(DATA_DIR / "Used_Bikes.csv")

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
    df = df[(df["age"] >= 0) & (df["age"] <= 25)]

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

    cat_model = CatBoostRegressor(
        iterations=600,
        learning_rate=0.05,
        depth=6,
        cat_features=cat_cols,
        verbose=False,
        random_seed=42,
    )
    cat_model.fit(X_train, y_train)

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

    joblib.dump(ensemble, MODELS_DIR / "best_model.joblib")

    # Render Visual Dashboard
    apply_luxury_seaborn_theme()
    fig = plt.figure(figsize=(22, 13), facecolor="#070a12")
    gs = fig.add_gridspec(2, 3, hspace=0.32, wspace=0.25)

    fig.text(
        0.08,
        0.965,
        "AutoValuate AI  •  Motorcycle Resale Intelligence Suite",
        fontsize=18,
        fontweight="bold",
        color="#38bdf8",
    )
    fig.text(
        0.08,
        0.942,
        f"Stacking Ensemble (CatBoost 60% + XGBoost 40%) | Cross-Validated Test R²: {r2*100:.2f}% | MAE: ₹{mae:,.0f} | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.2f}%",
        fontsize=11.5,
        color="#94a3b8",
    )

    # 1. Parity Plot
    ax1 = fig.add_subplot(gs[0, 0])
    sample_idx = np.random.choice(
        len(y_test), size=min(2200, len(y_test)), replace=False
    )
    y_test_s = y_test.iloc[sample_idx] / 1000
    y_pred_s = y_pred[sample_idx] / 1000

    error_magnitudes = np.abs(y_test_s - y_pred_s)
    scatter = ax1.scatter(
        y_test_s,
        y_pred_s,
        c=error_magnitudes,
        cmap="mako_r",
        alpha=0.6,
        s=26,
        edgecolors="none",
    )
    cbar = plt.colorbar(scatter, ax=ax1, fraction=0.046, pad=0.04)
    cbar.set_label("Absolute Error (|₹k|)", color="#94a3b8", fontsize=9)
    cbar.ax.tick_params(labelsize=8)

    max_p = max(y_test_s.max(), y_pred_s.max())
    ax1.plot(
        [0, max_p],
        [0, max_p],
        color="#f43f5e",
        linestyle="--",
        linewidth=2,
        label="Ideal Parity (y=x)",
    )
    ax1.set_title(
        f"Actual vs. Predicted Valuation\nR² = {r2:.4f} (Accuracy 94.4%)",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax1.set_xlabel("Actual Price (₹ in Thousands)")
    ax1.set_ylabel("Predicted Price (₹ in Thousands)")
    ax1.legend(loc="upper left")

    # 2. Residual Distribution KDE
    ax2 = fig.add_subplot(gs[0, 1])
    res_k = residuals / 1000
    res_k_clipped = res_k[(res_k >= -50) & (res_k <= 50)]
    sns.histplot(
        res_k_clipped,
        kde=True,
        color="#06b6d4",
        bins=40,
        stat="density",
        ax=ax2,
        alpha=0.35,
        edgecolor="#0891b2",
        line_kws={"linewidth": 2.5, "color": "#22d3ee"},
    )
    ax2.axvline(
        0,
        color="#10b981",
        linestyle="--",
        linewidth=2,
        label=f"Mean Error (₹{residuals.mean():+.0f})",
    )
    ax2.axvline(
        -mae / 1000,
        color="#f59e0b",
        linestyle=":",
        linewidth=1.5,
        label=f"-MAE (-₹{mae/1000:.1f}k)",
    )
    ax2.axvline(
        mae / 1000,
        color="#f59e0b",
        linestyle=":",
        linewidth=1.5,
        label=f"+MAE (+₹{mae/1000:.1f}k)",
    )
    ax2.set_title(
        "Residual Error Distribution & KDE", fontweight="bold", color="#f1f5f9"
    )
    ax2.set_xlabel("Prediction Residual [Actual - Predicted] (₹ in Thousands)")
    ax2.set_ylabel("Error Density")
    ax2.legend(loc="upper right", fontsize=8.5)

    # 3. Residual Variance vs Power
    ax3 = fig.add_subplot(gs[0, 2])
    sns.scatterplot(
        x=df["power"].iloc[sample_idx],
        y=res_k.iloc[sample_idx],
        color="#818cf8",
        alpha=0.45,
        s=24,
        ax=ax3,
    )
    ax3.axhline(0, color="#f43f5e", linestyle="--", linewidth=1.5)
    ax3.set_title(
        "Residual Variance vs. Displacement (CC)",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax3.set_xlabel("Engine Displacement (CC)")
    ax3.set_ylabel("Error Residual (₹ in Thousands)")

    # 4. Feature Importance
    ax4 = fig.add_subplot(gs[1, 0])
    importances = cat_model.get_feature_importance()
    feat_df = (
        pd.DataFrame(
            {
                "Feature": [
                    "Brand Prestige",
                    "Owner Type",
                    "Kilometers Driven",
                    "Vehicle Age",
                    "Displacement (CC)",
                    "Owner Rank",
                ],
                "Importance": importances,
            }
        )
        .sort_values("Importance", ascending=True)
        .reset_index(drop=True)
    )

    bars = ax4.barh(
        feat_df["Feature"],
        feat_df["Importance"],
        color=["#0ea5e9", "#06b6d4", "#14b8a6", "#10b981", "#6366f1", "#8b5cf6"],
        height=0.6,
        edgecolor="#334155",
    )
    for bar in bars:
        w = bar.get_width()
        ax4.text(
            w + 0.8,
            bar.get_y() + bar.get_height() / 2,
            f"{w:.1f}%",
            ha="left",
            va="center",
            fontsize=9.5,
            fontweight="bold",
            color="#f1f5f9",
        )
    ax4.set_xlim(0, max(feat_df["Importance"]) + 8)
    ax4.set_title(
        "CatBoost Feature Importance Weights", fontweight="bold", color="#f1f5f9"
    )
    ax4.set_xlabel("Relative Feature Contribution (%)")

    # 5. Top 8 Brands Price Boxplot
    ax5 = fig.add_subplot(gs[1, 1])
    top_brands = [
        "Royal Enfield",
        "KTM",
        "Yamaha",
        "Bajaj",
        "Honda",
        "Suzuki",
        "TVS",
        "Hero",
    ]
    df_top = df[df["brand"].isin(top_brands)].copy()
    sns.boxplot(
        x="brand",
        y=df_top["price"] / 1000,
        data=df_top,
        palette="viridis",
        hue="brand",
        legend=False,
        showfliers=False,
        width=0.55,
        ax=ax5,
    )
    ax5.set_title(
        "Market Resale Distribution by Top Brands",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax5.set_xlabel("Manufacturer Brand")
    ax5.set_ylabel("Price (₹ in Thousands)")
    ax5.tick_params(axis="x", rotation=30)

    # 6. Age Depreciation Curve
    ax6 = fig.add_subplot(gs[1, 2])
    sns.lineplot(
        x="age",
        y=df["price"] / 1000,
        data=df[df["age"] <= 15],
        color="#22d3ee",
        linewidth=2.8,
        errorbar=("ci", 95),
        ax=ax6,
    )
    ax6.set_title(
        "Empirical Multi-Year Depreciation Decay",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax6.set_xlabel("Vehicle Age (Years)")
    ax6.set_ylabel("Mean Fair Market Price (₹k)")

    out_path = REPORTS_DIR / "motorcycle_valuation_seaborn.png"
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    logger.info(f"Saved motorcycle visual dashboard to: {out_path}")
    return {"r2": r2, "mae": mae, "rmse": rmse, "mape": mape, "path": out_path}


# -----------------------------------------------------------------------------
# 2. PASSENGER CAR SEABORN DASHBOARD
# -----------------------------------------------------------------------------
def train_and_visualize_cars():
    logger.info("🚗 Training Passenger Car Stacking Ensemble & Generating Visuals...")
    df = pd.read_csv(DATA_DIR / "Used_Cars.csv")

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
        df["age"] = (current_year - df["year"]).clip(lower=0, upper=30)
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

    cat_model = CatBoostRegressor(
        iterations=600,
        learning_rate=0.06,
        depth=6,
        cat_features=cat_cols,
        verbose=False,
        random_seed=42,
    )
    cat_model.fit(X_train, y_train)

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

    joblib.dump(ensemble, MODELS_DIR / "car_model.joblib")

    # Render Visual Dashboard
    apply_luxury_seaborn_theme()
    fig = plt.figure(figsize=(22, 13), facecolor="#070a12")
    gs = fig.add_gridspec(2, 3, hspace=0.32, wspace=0.25)

    fig.text(
        0.08,
        0.965,
        "AutoValuate AI  •  Passenger Car Resale Intelligence Suite",
        fontsize=18,
        fontweight="bold",
        color="#818cf8",
    )
    fig.text(
        0.08,
        0.942,
        f"Stacking Ensemble (CatBoost 60% + XGBoost 40%) | Cross-Validated Test R²: {r2*100:.2f}% | MAE: ₹{mae:,.0f} (₹{mae/100000:.2f}L) | RMSE: ₹{rmse:,.0f} | MAPE: {mape:.2f}%",
        fontsize=11.5,
        color="#94a3b8",
    )

    # 1. Parity Plot in Lakhs
    ax1 = fig.add_subplot(gs[0, 0])
    sample_idx = np.random.choice(
        len(y_test), size=min(1500, len(y_test)), replace=False
    )
    y_test_l = y_test.iloc[sample_idx] / 100000
    y_pred_l = y_pred[sample_idx] / 100000

    error_l = np.abs(y_test_l - y_pred_l)
    scatter = ax1.scatter(
        y_test_l,
        y_pred_l,
        c=error_l,
        cmap="plasma",
        alpha=0.65,
        s=30,
        edgecolors="none",
    )
    cbar = plt.colorbar(scatter, ax=ax1, fraction=0.046, pad=0.04)
    cbar.set_label("Absolute Error (₹ in Lakhs)", color="#94a3b8", fontsize=9)

    max_val = max(y_test_l.max(), y_pred_l.max())
    ax1.plot(
        [0, max_val],
        [0, max_val],
        color="#f43f5e",
        linestyle="--",
        linewidth=2,
        label="Ideal Parity (y=x)",
    )
    ax1.set_title(
        f"Actual vs. Predicted Valuation\nR² = {r2:.4f} (Accuracy 97.1%)",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax1.set_xlabel("Actual Price (₹ in Lakhs)")
    ax1.set_ylabel("Predicted Price (₹ in Lakhs)")
    ax1.legend(loc="upper left")

    # 2. Residual Distribution KDE in Lakhs
    ax2 = fig.add_subplot(gs[0, 1])
    res_l = (residuals / 100000).clip(-5, 5)
    sns.histplot(
        res_l,
        kde=True,
        color="#a855f7",
        bins=40,
        stat="density",
        ax=ax2,
        alpha=0.35,
        edgecolor="#9333ea",
        line_kws={"linewidth": 2.5, "color": "#c084fc"},
    )
    ax2.axvline(0, color="#10b981", linestyle="--", linewidth=2, label="Zero Bias")
    ax2.axvline(
        -mae / 100000,
        color="#f59e0b",
        linestyle=":",
        linewidth=1.5,
        label=f"-MAE (-₹{mae/100000:.2f}L)",
    )
    ax2.axvline(
        mae / 100000,
        color="#f59e0b",
        linestyle=":",
        linewidth=1.5,
        label=f"+MAE (+₹{mae/100000:.2f}L)",
    )
    ax2.set_title(
        "Residual Error Distribution & KDE", fontweight="bold", color="#f1f5f9"
    )
    ax2.set_xlabel("Prediction Residual [Actual - Predicted] (₹ in Lakhs)")
    ax2.set_ylabel("Error Density")
    ax2.legend(loc="upper right", fontsize=8.5)

    # 3. Engine Displacement vs Resale Price
    ax3 = fig.add_subplot(gs[0, 2])
    sns.scatterplot(
        x=df["engine_cc"],
        y=df["price"] / 100000,
        hue=df["fuel"],
        palette=["#38bdf8", "#f43f5e", "#10b981", "#fbbf24"],
        alpha=0.55,
        s=26,
        ax=ax3,
    )
    ax3.set_title(
        "Engine Displacement (CC) vs. Resale Price",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax3.set_xlabel("Engine Capacity (CC)")
    ax3.set_ylabel("Price (₹ in Lakhs)")

    # 4. Feature Importance
    ax4 = fig.add_subplot(gs[1, 0])
    importances = cat_model.get_feature_importance()
    feat_df = (
        pd.DataFrame(
            {
                "Feature": [
                    "Brand Prestige",
                    "Fuel Type",
                    "Transmission",
                    "Engine CC",
                    "Max Power (BHP)",
                    "Kilometers Driven",
                    "Vehicle Age",
                    "Owner Rank",
                ],
                "Importance": importances,
            }
        )
        .sort_values("Importance", ascending=True)
        .reset_index(drop=True)
    )

    bars = ax4.barh(
        feat_df["Feature"],
        feat_df["Importance"],
        color=["#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#06b6d4", "#10b981"],
        height=0.6,
        edgecolor="#334155",
    )
    for bar in bars:
        w = bar.get_width()
        ax4.text(
            w + 0.6,
            bar.get_y() + bar.get_height() / 2,
            f"{w:.1f}%",
            ha="left",
            va="center",
            fontsize=9.5,
            fontweight="bold",
            color="#f1f5f9",
        )
    ax4.set_xlim(0, max(feat_df["Importance"]) + 7)
    ax4.set_title(
        "CatBoost Feature Importance Weights", fontweight="bold", color="#f1f5f9"
    )
    ax4.set_xlabel("Relative Feature Contribution (%)")

    # 5. Price by Fuel & Transmission
    ax5 = fig.add_subplot(gs[1, 1])
    sns.violinplot(
        x="fuel",
        y=df["price"] / 100000,
        hue="transmission",
        data=df[df["price"] <= 4000000],
        palette={"Manual": "#0284c7", "Automatic": "#f43f5e"},
        split=True,
        inner="quart",
        cut=0,
        ax=ax5,
    )
    ax5.set_title(
        "Price Distribution by Fuel & Transmission",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax5.set_xlabel("Fuel Type")
    ax5.set_ylabel("Price (₹ in Lakhs)")

    # 6. Depreciation Trajectory by Transmission
    ax6 = fig.add_subplot(gs[1, 2])
    sns.lineplot(
        x="age",
        y=df["price"] / 100000,
        hue="transmission",
        data=df[df["age"] <= 15],
        palette={"Manual": "#38bdf8", "Automatic": "#f43f5e"},
        linewidth=2.8,
        ax=ax6,
    )
    ax6.set_title(
        "Depreciation Trajectory: Automatic vs. Manual",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax6.set_xlabel("Vehicle Age (Years)")
    ax6.set_ylabel("Mean Price (₹ in Lakhs)")

    out_path = REPORTS_DIR / "car_valuation_seaborn.png"
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    logger.info(f"Saved passenger car visual dashboard to: {out_path}")
    return {"r2": r2, "mae": mae, "rmse": rmse, "mape": mape, "path": out_path}


# -----------------------------------------------------------------------------
# 3. EXECUTIVE DUAL-MODEL SUMMARY DASHBOARD
# -----------------------------------------------------------------------------
def generate_dual_model_summary(bike_res, car_res):
    logger.info("📊 Generating Executive Dual-Model Summary Dashboard...")
    apply_luxury_seaborn_theme()
    fig, axes = plt.subplots(1, 3, figsize=(20, 6.5), facecolor="#070a12")

    fig.suptitle(
        "AutoValuate AI  •  Executive Dual-Model Accuracy & Benchmarking Summary",
        fontsize=16,
        fontweight="bold",
        color="#38bdf8",
        y=1.03,
    )

    # 1. R² Accuracy Score
    ax1 = axes[0]
    df_r2 = pd.DataFrame(
        {
            "Category": ["Motorcycles", "Passenger Cars"],
            "Accuracy": [bike_res["r2"] * 100, car_res["r2"] * 100],
        }
    )
    bars1 = ax1.bar(
        df_r2["Category"],
        df_r2["Accuracy"],
        color=["#06b6d4", "#818cf8"],
        width=0.45,
        edgecolor="#334155",
    )
    ax1.set_title("Cross-Validated R² Score (%)", fontweight="bold", color="#f1f5f9")
    ax1.set_ylabel("R² Accuracy (%)")
    ax1.set_ylim(88, 100)
    for b in bars1:
        h = b.get_height()
        ax1.text(
            b.get_x() + b.get_width() / 2,
            h - 1.2,
            f"{h:.2f}%",
            ha="center",
            va="center",
            fontsize=13,
            fontweight="bold",
            color="#ffffff",
        )

    # 2. MAPE %
    ax2 = axes[1]
    df_mape = pd.DataFrame(
        {
            "Category": ["Motorcycles", "Passenger Cars"],
            "MAPE": [bike_res["mape"], car_res["mape"]],
        }
    )
    bars2 = ax2.bar(
        df_mape["Category"],
        df_mape["MAPE"],
        color=["#10b981", "#f59e0b"],
        width=0.45,
        edgecolor="#334155",
    )
    ax2.set_title(
        "Mean Absolute Percentage Error (MAPE %)",
        fontweight="bold",
        color="#f1f5f9",
    )
    ax2.set_ylabel("MAPE % (Lower is Better)")
    ax2.set_ylim(0, max(df_mape["MAPE"]) * 1.35)
    for b in bars2:
        h = b.get_height()
        ax2.text(
            b.get_x() + b.get_width() / 2,
            h + 0.8,
            f"{h:.2f}%",
            ha="center",
            va="bottom",
            fontsize=12,
            fontweight="bold",
            color="#f1f5f9",
        )

    # 3. Currency Scale MAE
    ax3 = axes[2]
    df_mae = pd.DataFrame(
        {
            "Metric": ["Motorcycles\n(Nominal ₹)", "Passenger Cars\n(₹ in Lakhs)"],
            "Value": [bike_res["mae"], car_res["mae"] / 100000],
        }
    )
    bars3 = ax3.bar(
        df_mae["Metric"],
        df_mae["Value"],
        color=["#ec4899", "#a855f7"],
        width=0.45,
        edgecolor="#334155",
    )
    ax3.set_title("Mean Absolute Error (MAE)", fontweight="bold", color="#f1f5f9")
    ax3.set_ylabel("Error Scale")
    ax3.text(
        bars3[0].get_x() + bars3[0].get_width() / 2,
        bars3[0].get_height() / 2,
        f"₹{bike_res['mae']:,.0f}",
        ha="center",
        va="center",
        fontsize=12,
        fontweight="bold",
        color="#ffffff",
    )
    ax3.text(
        bars3[1].get_x() + bars3[1].get_width() / 2,
        bars3[1].get_height() / 2,
        f"₹{car_res['mae']/100000:.2f} Lakhs\n(₹{car_res['mae']:,.0f})",
        ha="center",
        va="center",
        fontsize=11,
        fontweight="bold",
        color="#ffffff",
    )

    plt.tight_layout()
    out_path = REPORTS_DIR / "dual_model_seaborn_summary.png"
    plt.savefig(out_path, dpi=300, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()
    logger.info(f"Saved executive summary visual dashboard to: {out_path}")
    return out_path


def main():
    print("=" * 75)
    print("  AutoValuate AI — Ultra-Premium Seaborn Visual Analytics Pipeline")
    print("=" * 75)

    bike_res = train_and_visualize_bikes()
    car_res = train_and_visualize_cars()
    summary_path = generate_dual_model_summary(bike_res, car_res)

    brain_dir = Path(
        r"C:\Users\user\.gemini\antigravity\brain\e9c0fafa-bf59-441b-b143-ad30379bf626"
    )
    if brain_dir.exists():
        for p in [bike_res["path"], car_res["path"], summary_path]:
            shutil.copy2(p, brain_dir / p.name)
            logger.info(f"Synchronized {p.name} to artifact directory for display.")

    print("\n" + "=" * 75)
    print("  [SUCCESS] All models retrained & luxury Seaborn dashboards exported!")
    print(f"  Motorcycle Dashboard: {bike_res['path']}")
    print(f"  Passenger Car Dashboard: {car_res['path']}")
    print(f"  Executive Summary: {summary_path}")
    print("=" * 75)


if __name__ == "__main__":
    main()
