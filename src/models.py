"""Define, train, and compare multiple regression models."""
from __future__ import annotations

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, RandomizedSearchCV
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


def tune_best_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    best_name: str,
    best_pipe: Pipeline,
) -> Pipeline:
    """Run hyperparameter tuning on the best model.
    Only supports tree-based models right now.
    """
    if best_name not in ["GradientBoosting", "XGBoost", "RandomForest"]:
        print(f"  Skipping tuning for {best_name} — currently only tree models are tuned.")
        return best_pipe

    print(f"\n  Tuning {best_name}...")

    param_grid = {}
    if best_name == "GradientBoosting":
        param_grid = {
            "model__learning_rate": [0.01, 0.05, 0.1, 0.2],
            "model__max_depth": [3, 5, 7],
            "model__n_estimators": [100, 200, 300],
            "model__min_samples_leaf": [2, 5, 10],
        }
    elif best_name == "XGBoost":
        param_grid = {
            "model__learning_rate": [0.01, 0.05, 0.1, 0.2],
            "model__max_depth": [3, 5, 7],
            "model__n_estimators": [100, 200, 300],
            "model__min_child_weight": [1, 3, 5],
        }
    elif best_name == "RandomForest":
        param_grid = {
            "model__max_depth": [10, 15, 20, None],
            "model__n_estimators": [100, 200, 300],
            "model__min_samples_leaf": [2, 5, 10],
        }

    search = RandomizedSearchCV(
        best_pipe,
        param_distributions=param_grid,
        n_iter=10,  # 10 random combinations
        cv=3,       # 3-fold CV for speed
        scoring="r2",
        n_jobs=-1,
        random_state=42,
    )

    search.fit(X_train, y_train)

    print(f"  Tuned R²: {search.best_score_:.4f}")
    print(f"  Best params: {search.best_params_}")

    return search.best_estimator_
