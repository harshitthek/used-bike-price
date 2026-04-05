"""Used Bike Price Prediction — CLI Entry Point.

Usage:
    python src/main.py              Train all models, evaluate, save best
    python src/main.py --predict    Interactive prediction mode
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.model_selection import train_test_split

# Ensure project root is on path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.data_loader import load_data, describe_data
from src.preprocessing import (
    preprocess,
    get_feature_target_split,
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES,
    TARGET,
)
from src.models import train_and_compare, get_best_model, tune_best_model
from src.contracts import OWNER_RANK_TO_LABEL, OWNER_RANK_MAX, OWNER_RANK_MIN
from src.feature_engineering import DERIVED_NUMERIC_FEATURES
from src.evaluation import (
    evaluate_on_test,
    plot_model_comparison,
    plot_residuals,
    plot_feature_importance,
    save_results,
)

MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"


def main():
    parser = argparse.ArgumentParser(description="Used Bike Price Prediction")
    parser.add_argument("--predict", action="store_true",
                        help="Run interactive prediction using saved model")
    parser.add_argument("--data", type=str, default=None,
                        help="Path to CSV data file (auto-detected if omitted)")
    args = parser.parse_args()

    if args.predict:
        run_predict()
    else:
        run_train(data_path=args.data)


# ═══════════════════════════════════════════════════════════════
#  TRAIN MODE
# ═══════════════════════════════════════════════════════════════

def run_train(data_path: str | None = None):
    """Full training pipeline: load → preprocess → train → evaluate → save."""

    print("\n" + "█" * 60)
    print("  USED BIKE PRICE PREDICTION — TRAINING PIPELINE")
    print("█" * 60)

    # ── 1. Load data ───────────────────────────────────────────
    df_raw = load_data(data_path)
    describe_data(df_raw)

    # ── 2. Preprocess ──────────────────────────────────────────
    df_clean = preprocess(df_raw)
    X, y = get_feature_target_split(df_clean)

    # Identify feature types for the pipeline
    cat_features = [c for c in CATEGORICAL_FEATURES if c in X.columns]
    num_features = [c for c in NUMERIC_FEATURES + ["owner_rank"] if c in X.columns]

    print(f"\n  Features: {cat_features + num_features}")
    print(f"  Derived features (pipeline, linear models): {DERIVED_NUMERIC_FEATURES}")
    print(f"  Target: {TARGET}")

    # ── 3. Train/test split ────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42,
    )
    print(f"  Train: {len(X_train):,} rows  |  Test: {len(X_test):,} rows")

    # ── 4. Train all base models ───────────────────────────────
    pipelines, cv_results = train_and_compare(
        X_train, y_train,
        categorical_features=cat_features,
        numeric_features=num_features,
        cv_folds=5,
    )

    # ── 5. Get best model & Tune ───────────────────────────────
    best_name, best_pipe = get_best_model(pipelines, cv_results)
    
    print("\n" + "=" * 60)
    print("  HYPERPARAMETER TUNING")
    print("=" * 60)
    best_pipe_tuned = tune_best_model(X_train, y_train, best_name, best_pipe)
    pipelines[best_name] = best_pipe_tuned

    # ── 6. Evaluate on test set ────────────────────────────────
    test_results = evaluate_on_test(pipelines, X_test, y_test)
    
    # Since we tuned the best model, make sure we use it moving forward
    best_pipe = pipelines[best_name]

    # ── 7. Generate plots ──────────────────────────────────────
    print("\n  Generating plots...")
    plot_model_comparison(test_results, cv_results)
    plot_residuals(best_pipe, X_test, y_test, best_name)
    plot_feature_importance(best_pipe, X_train, best_name)

    # ── 8. Save results ────────────────────────────────────────
    save_results(test_results, cv_results, best_name)

    # ── 9. Save best model ─────────────────────────────────────
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(best_pipe, DEFAULT_MODEL_PATH)
    print(f"  Saved best model: {DEFAULT_MODEL_PATH}")

    # ── 10. Demo predictions ───────────────────────────────────
    print("\n" + "=" * 60)
    print("  SAMPLE PREDICTIONS")
    print("=" * 60)
    samples = pd.DataFrame([
        {"brand": "Royal Enfield", "owner": "First Owner", "kms_driven": 15000, "age": 3, "power": 350, "owner_rank": 1},
        {"brand": "Bajaj", "owner": "Second Owner", "kms_driven": 40000, "age": 7, "power": 200, "owner_rank": 2},
        {"brand": "Honda", "owner": "First Owner", "kms_driven": 5000, "age": 2, "power": 125, "owner_rank": 1},
        {"brand": "KTM", "owner": "First Owner", "kms_driven": 10000, "age": 4, "power": 390, "owner_rank": 1},
    ])
    preds = best_pipe.predict(samples)
    for row, price in zip(samples.to_dict(orient="records"), preds):
        print(f"  {row['brand']:15s} {row['power']}cc, {row['kms_driven']:,}km, {row['age']}yr, {row['owner']}")
        print(f"    → Predicted: ₹{price:,.0f}")

    print("\n" + "█" * 60)
    print("  DONE! All models trained, evaluated, and saved.")
    print("█" * 60 + "\n")


# ═══════════════════════════════════════════════════════════════
#  PREDICT MODE
# ═══════════════════════════════════════════════════════════════

def run_predict():
    """Interactive prediction using saved model."""
    if not DEFAULT_MODEL_PATH.exists():
        print(f"Error: No saved model found at {DEFAULT_MODEL_PATH}")
        print("Run `python src/main.py` first to train a model.")
        sys.exit(1)

    pipe = joblib.load(DEFAULT_MODEL_PATH)
    print("\n" + "=" * 60)
    print("  USED BIKE PRICE PREDICTOR")
    print("=" * 60)
    print("  Enter bike details to get a price estimate.")
    print("  Type 'quit' to exit.\n")

    while True:
        try:
            brand = input("  Brand (e.g. Royal Enfield, Bajaj, Honda): ").strip()
            if brand.lower() in ("quit", "exit", "q"):
                break

            power = float(input("  Engine power (cc): ").strip())
            kms = float(input("  Kilometers driven: ").strip())
            age = float(input("  Age (years): ").strip())
            owner_num = int(input(f"  Owner number ({OWNER_RANK_MIN}-{OWNER_RANK_MAX}): ").strip())
            owner = OWNER_RANK_TO_LABEL.get(owner_num, "First Owner")

            sample = pd.DataFrame([{
                "brand": brand,
                "owner": owner,
                "kms_driven": kms,
                "age": age,
                "power": power,
                "owner_rank": owner_num,
            }])

            pred = pipe.predict(sample)[0]
            print(f"\n  💰 Estimated Price: ₹{pred:,.0f}\n")

        except (ValueError, KeyboardInterrupt):
            print("\n  Invalid input. Try again or type 'quit'.\n")
            continue

    print("  Goodbye!")


if __name__ == "__main__":
    main()
