"""Define, train, and compare multiple regression models."""
from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False


# ── Model registry ─────────────────────────────────────────────

def get_models() -> Dict[str, object]:
    """Return a dict of model_name → estimator."""
    models = {
        "LinearRegression": LinearRegression(),
        "Ridge": Ridge(alpha=1.0),
        "Lasso": Lasso(alpha=1.0, max_iter=5000),
        "RandomForest": RandomForestRegressor(
            n_estimators=200, max_depth=15, min_samples_leaf=5,
            random_state=42, n_jobs=-1,
        ),
        "GradientBoosting": GradientBoostingRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            min_samples_leaf=5, random_state=42,
        ),
    }

    if HAS_XGBOOST:
        models["XGBoost"] = XGBRegressor(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            min_child_weight=5, random_state=42,
            verbosity=0,
        )

    return models


# ── Pipeline builder ────────────────────────────────────────────

def build_pipeline(
    model: object,
    categorical_features: List[str],
    numeric_features: List[str],
) -> Pipeline:
    """Wrap a model in a preprocessing + model pipeline.

    Preprocessing:
    - OneHotEncoder for categorical (handle_unknown='ignore')
    - StandardScaler for numeric
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numeric_features),
        ],
        remainder="passthrough",
    )

    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("model", model),
    ])


# ── Training & comparison ──────────────────────────────────────

def train_and_compare(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    categorical_features: List[str],
    numeric_features: List[str],
    cv_folds: int = 5,
) -> Tuple[Dict[str, Pipeline], pd.DataFrame]:
    """Train all models with cross-validation and return fitted pipelines + scores.

    Returns
    -------
    pipelines : dict of name → fitted Pipeline
    cv_results : DataFrame with columns [model, cv_mean_r2, cv_std_r2, cv_mean_mae]
    """
    models = get_models()
    pipelines = {}
    results = []

    print("\n" + "=" * 60)
    print("  MODEL TRAINING & CROSS-VALIDATION")
    print("=" * 60)

    for name, model in models.items():
        print(f"\n  Training {name}...", end=" ", flush=True)

        pipe = build_pipeline(model, categorical_features, numeric_features)

        # Cross-validation scores
        r2_scores = cross_val_score(pipe, X_train, y_train, cv=cv_folds, scoring="r2", n_jobs=-1)
        mae_scores = cross_val_score(pipe, X_train, y_train, cv=cv_folds, scoring="neg_mean_absolute_error", n_jobs=-1)

        # Fit on full training set
        pipe.fit(X_train, y_train)
        pipelines[name] = pipe

        cv_r2_mean = r2_scores.mean()
        cv_r2_std = r2_scores.std()
        cv_mae_mean = -mae_scores.mean()  # neg_mae → positive

        results.append({
            "model": name,
            "cv_mean_r2": cv_r2_mean,
            "cv_std_r2": cv_r2_std,
            "cv_mean_mae": cv_mae_mean,
        })

        print(f"R²={cv_r2_mean:.4f} (±{cv_r2_std:.4f}), MAE=₹{cv_mae_mean:,.0f}")

    cv_results = pd.DataFrame(results).sort_values("cv_mean_r2", ascending=False)

    print("\n" + "-" * 60)
    best = cv_results.iloc[0]
    print(f"  Best model: {best['model']}  (R²={best['cv_mean_r2']:.4f})")
    print("=" * 60 + "\n")

    return pipelines, cv_results


def get_best_model(
    pipelines: Dict[str, Pipeline],
    cv_results: pd.DataFrame,
) -> Tuple[str, Pipeline]:
    """Return the name and pipeline of the best model by CV R²."""
    best_name = cv_results.iloc[0]["model"]
    return best_name, pipelines[best_name]
