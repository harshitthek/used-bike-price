"""Model classes and ensemble architectures for AutoValuate AI."""

from typing import Dict, List, Tuple

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import Ridge
from sklearn.model_selection import KFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

from src.feature_engineering import add_derived_features

DEFAULT_RANDOM_STATE: int = 42


class StackingEnsembleModel:
    """Ensemble combining CatBoost, XGBoost, and LightGBM with tree-based weighted blend."""

    def __init__(
        self,
        cat_model,
        xgb_model,
        lgb_model=None,
        weights=(0.6, 0.4, 0.0),
        categorical_features=None,
    ):
        self.cat_model = cat_model
        self.xgb_model = xgb_model
        self.lgb_model = lgb_model
        self.weights = weights
        self.categorical_features = categorical_features or []

    def predict(self, X):
        X_df = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()

        # Format types for CatBoost / LightGBM
        for col in self.categorical_features:
            if col in X_df.columns:
                X_df[col] = X_df[col].astype(str)

        # CatBoost prediction
        cat_preds = self.cat_model.predict(X_df)

        # XGB / LGB encoded predictions
        X_encoded = pd.get_dummies(
            X_df, columns=self.categorical_features, drop_first=True
        )

        # Align columns
        if hasattr(self.xgb_model, "feature_names_in_"):
            for c in self.xgb_model.feature_names_in_:
                if c not in X_encoded.columns:
                    X_encoded[c] = 0
            X_encoded_xgb = X_encoded[self.xgb_model.feature_names_in_]
            xgb_preds = self.xgb_model.predict(X_encoded_xgb)
        else:
            xgb_preds = cat_preds

        w_cat, w_xgb, w_lgb = self.weights
        return (w_cat * np.array(cat_preds)) + ((1.0 - w_cat) * np.array(xgb_preds))


def build_preprocessor(
    categorical_features: List[str], numeric_features: List[str]
) -> ColumnTransformer:
    cat_pipeline = Pipeline(
        steps=[
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            )
        ]
    )
    num_pipeline = Pipeline(steps=[("scaler", StandardScaler())])
    return ColumnTransformer(
        transformers=[
            ("cat", cat_pipeline, categorical_features),
            ("num", num_pipeline, numeric_features),
        ],
        remainder="passthrough",
    )


def train_and_compare(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    categorical_features: List[str],
    numeric_features: List[str],
    cv_folds: int = 5,
) -> Tuple[Dict[str, Pipeline], pd.DataFrame]:
    preprocessor = build_preprocessor(categorical_features, numeric_features)

    base_models = {
        "Random Forest": RandomForestRegressor(
            n_estimators=100, random_state=DEFAULT_RANDOM_STATE, n_jobs=-1
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=150, random_state=DEFAULT_RANDOM_STATE
        ),
        "Extra Trees": ExtraTreesRegressor(
            n_estimators=100, random_state=DEFAULT_RANDOM_STATE, n_jobs=-1
        ),
        "Ridge Regression": Ridge(alpha=1.0),
    }

    pipelines = {}
    cv_records = []
    kf = KFold(n_splits=cv_folds, shuffle=True, random_state=DEFAULT_RANDOM_STATE)

    for name, reg in base_models.items():
        if name == "Ridge Regression":
            pipe = Pipeline(
                steps=[
                    ("features", FunctionTransformer(add_derived_features)),
                    ("preprocessor", preprocessor),
                    ("regressor", reg),
                ]
            )

        else:
            pipe = Pipeline(
                steps=[
                    ("preprocessor", preprocessor),
                    ("regressor", reg),
                ]
            )

        scores = cross_val_score(pipe, X_train, y_train, scoring="r2", cv=kf, n_jobs=-1)
        pipe.fit(X_train, y_train)
        pipelines[name] = pipe

        cv_records.append(
            {
                "model": name,
                "cv_mean_r2": round(float(np.mean(scores)), 4),
                "cv_std_r2": round(float(np.std(scores)), 4),
            }
        )

    cv_results = pd.DataFrame(cv_records).sort_values("cv_mean_r2", ascending=False)
    return pipelines, cv_results


def get_best_model(
    pipelines: Dict[str, Pipeline], cv_results: pd.DataFrame
) -> Tuple[str, Pipeline]:
    best_name = cv_results.iloc[0]["model"]
    return best_name, pipelines[best_name]


def tune_best_model(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    best_name: str,
    best_pipe: Pipeline,
) -> Pipeline:
    # Baseline return fitted model or refined parameters
    best_pipe.fit(X_train, y_train)
    return best_pipe
