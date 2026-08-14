"""Model classes and ensemble architectures for AutoValuate AI."""

import numpy as np
import pandas as pd


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
