"""Evaluate models and generate plots."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, Tuple

import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline


OUTPUTS_DIR = Path(__file__).resolve().parent.parent / "outputs"


def evaluate_on_test(
    pipelines: Dict[str, Pipeline],
    X_test: pd.DataFrame,
    y_test: pd.Series,
) -> pd.DataFrame:
    """Evaluate all pipelines on the held-out test set.

    Returns DataFrame with columns: model, r2, mae, rmse, mape
    """
    results = []

    print("\n" + "=" * 60)
    print("  TEST SET EVALUATION")
    print("=" * 60)

    for name, pipe in pipelines.items():
        preds = pipe.predict(X_test)

        r2 = r2_score(y_test, preds)
        mae = mean_absolute_error(y_test, preds)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        # MAPE — avoid division by zero
        mask = y_test > 0
        mape = np.mean(np.abs((y_test[mask] - preds[mask]) / y_test[mask])) * 100

        results.append({
            "model": name,
            "r2": round(r2, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
        })

        print(f"  {name:25s}  R²={r2:.4f}  MAE=₹{mae:>8,.0f}  RMSE=₹{rmse:>8,.0f}  MAPE={mape:.1f}%")

    test_results = pd.DataFrame(results).sort_values("r2", ascending=False)

    print("\n" + "-" * 60)
    best = test_results.iloc[0]
    print(f"  🏆 Best: {best['model']}  (R²={best['r2']:.4f}, MAE=₹{best['mae']:,.0f})")
    print("=" * 60 + "\n")

    return test_results


def plot_model_comparison(
    test_results: pd.DataFrame,
    cv_results: pd.DataFrame,
) -> str:
    """Bar chart comparing all models on R² and MAE."""
    sns.set_theme(style="whitegrid", font_scale=1.1)
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # R² comparison (CV + Test)
    merged = test_results.merge(cv_results[["model", "cv_mean_r2"]], on="model")
    merged = merged.sort_values("r2", ascending=True)

    y_pos = range(len(merged))
    axes[0].barh(y_pos, merged["cv_mean_r2"], height=0.35, label="CV R²",
                 color=sns.color_palette("coolwarm", len(merged)), alpha=0.7, align="edge")
    axes[0].barh([y + 0.35 for y in y_pos], merged["r2"], height=0.35, label="Test R²",
                 color=sns.color_palette("mako", len(merged)), alpha=0.9, align="edge")
    axes[0].set_yticks([y + 0.175 for y in y_pos])
    axes[0].set_yticklabels(merged["model"])
    axes[0].set_xlabel("R² Score")
    axes[0].set_title("Model Comparison — R²", fontweight="bold")
    axes[0].legend(loc="lower right")

    # MAE comparison
    merged_mae = test_results.sort_values("mae", ascending=False)
    colors = sns.color_palette("viridis", len(merged_mae))
    axes[1].barh(merged_mae["model"], merged_mae["mae"], color=colors)
    axes[1].set_xlabel("Mean Absolute Error (₹)")
    axes[1].set_title("Model Comparison — MAE", fontweight="bold")
    for i, (_, row) in enumerate(merged_mae.iterrows()):
        axes[1].text(row["mae"] + 200, i, f"₹{row['mae']:,.0f}", va="center", fontsize=9)

    plt.tight_layout()
    path = str(OUTPUTS_DIR / "model_comparison.png")
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")
    return path


def plot_residuals(
    pipe: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str,
) -> str:
    """Residual analysis plots for the best model."""
    sns.set_theme(style="whitegrid", font_scale=1.0)
    preds = pipe.predict(X_test)
    residuals = y_test.values - preds

    fig, axes = plt.subplots(1, 3, figsize=(16, 5))

    # 1. Predicted vs Actual
    axes[0].scatter(y_test, preds, alpha=0.4, s=15, color="#2196F3")
    lims = [min(y_test.min(), preds.min()), max(y_test.max(), preds.max())]
    axes[0].plot(lims, lims, "r--", linewidth=1.5, label="Perfect")
    axes[0].set_xlabel("Actual Price (₹)")
    axes[0].set_ylabel("Predicted Price (₹)")
    axes[0].set_title(f"{model_name} — Predicted vs Actual", fontweight="bold")
    axes[0].legend()

    # 2. Residual distribution
    sns.histplot(residuals, kde=True, bins=40, color="#4CAF50", ax=axes[1])
    axes[1].axvline(0, color="red", linestyle="--", linewidth=1.5)
    axes[1].set_xlabel("Residual (₹)")
    axes[1].set_title("Residual Distribution", fontweight="bold")

    # 3. Residuals vs Predicted
    axes[2].scatter(preds, residuals, alpha=0.4, s=15, color="#FF9800")
    axes[2].axhline(0, color="red", linestyle="--", linewidth=1.5)
    axes[2].set_xlabel("Predicted Price (₹)")
    axes[2].set_ylabel("Residual (₹)")
    axes[2].set_title("Residuals vs Predicted", fontweight="bold")

    plt.tight_layout()
    path = str(OUTPUTS_DIR / "residuals.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")
    return path


def plot_feature_importance(
    pipe: Pipeline,
    X_train: pd.DataFrame,
    model_name: str,
) -> str:
    """Feature importance for tree-based models."""
    sns.set_theme(style="whitegrid", font_scale=1.0)

    model = pipe.named_steps["model"]
    if not hasattr(model, "feature_importances_"):
        print(f"  Skipping feature importance ({model_name} has no feature_importances_)")
        return ""

    preprocessor = pipe.named_steps["preprocessor"]
    # Get feature names from the preprocessor
    try:
        feature_names = preprocessor.get_feature_names_out()
    except AttributeError:
        feature_names = [f"f{i}" for i in range(len(model.feature_importances_))]

    # Clean up feature names (remove 'cat__', 'num__', 'remainder__' prefixes)
    clean_names = []
    for name in feature_names:
        for prefix in ("cat__", "num__", "remainder__"):
            name = name.replace(prefix, "")
        clean_names.append(name)

    importances = model.feature_importances_
    indices = np.argsort(importances)

    fig, ax = plt.subplots(figsize=(10, max(5, len(clean_names) * 0.3)))
    colors = sns.color_palette("rocket_r", len(indices))
    ax.barh(range(len(indices)), importances[indices], color=colors)
    ax.set_yticks(range(len(indices)))
    ax.set_yticklabels([clean_names[i] for i in indices])
    ax.set_xlabel("Importance")
    ax.set_title(f"{model_name} — Feature Importance", fontweight="bold")

    plt.tight_layout()
    path = str(OUTPUTS_DIR / "feature_importance.png")
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"  Saved: {path}")
    return path


def save_results(
    test_results: pd.DataFrame,
    cv_results: pd.DataFrame,
    best_model_name: str,
) -> str:
    """Save evaluation results to JSON."""
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    output = {
        "best_model": best_model_name,
        "test_results": test_results.to_dict(orient="records"),
        "cv_results": cv_results.to_dict(orient="records"),
    }
    path = str(OUTPUTS_DIR / "evaluation_results.json")
    with open(path, "w") as f:
        json.dump(output, f, indent=2)
    print(f"  Saved: {path}")
    return path
