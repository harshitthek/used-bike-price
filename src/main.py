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

from src.contracts import OWNER_RANK_MAX, OWNER_RANK_MIN
from src.data_loader import describe_data, load_data
from src.evaluation import (
    evaluate_on_test,
    plot_feature_importance,
    plot_model_comparison,
    plot_residuals,
    save_results,
)
from src.feature_engineering import DERIVED_NUMERIC_FEATURES
from src.models import get_best_model, train_and_compare, tune_best_model
from src.preprocessing import (
    CATEGORICAL_FEATURES,
    NUMERIC_FEATURES,
    TARGET,
    get_feature_target_split,
    preprocess,
)

MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"


def main():
    parser = argparse.ArgumentParser(description="Used Bike Price Prediction")
    parser.add_argument(
        "--predict",
        action="store_true",
        help="Run interactive prediction using saved model",
    )
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to CSV data file (auto-detected if omitted)",
    )
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
        X,
        y,
        test_size=0.2,
        random_state=42,
    )
    print(f"  Train: {len(X_train):,} rows  |  Test: {len(X_test):,} rows")

    # ── 4. Train all base models ───────────────────────────────
    pipelines, cv_results = train_and_compare(
        X_train,
        y_train,
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

    # ── 8. Generate and save runtime metadata ──────────────────
    import json
    from datetime import datetime, timezone

    from src.models import DEFAULT_RANDOM_STATE

    metadata = {
        "metadata_version": 1,
        "model_version": datetime.now(timezone.utc).strftime("%Y.%m.%d"),
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "random_state": DEFAULT_RANDOM_STATE,
        "training_samples": len(X_train),
        "target": TARGET,
        "training_ranges": {
            "age": {
                "min": float(X_train["age"].min()),
                "max": float(X_train["age"].max()),
            },
            "kms_driven": {
                "min": float(X_train["kms_driven"].min()),
                "max": float(X_train["kms_driven"].max()),
            },
            "power": {
                "min": float(X_train["power"].min()),
                "max": float(X_train["power"].max()),
            },
        },
        "known_brands": sorted(X_train["brand"].unique().tolist()),
    }

    os.makedirs(MODELS_DIR, exist_ok=True)
    metadata_path = MODELS_DIR / "best_model.metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  Saved runtime metadata: {metadata_path}")

    # ── 9. Save evaluation results ─────────────────────────────
    save_results(test_results, cv_results, best_name)

    # ── 10. Save best model ────────────────────────────────────
    joblib.dump(best_pipe, DEFAULT_MODEL_PATH)
    print(f"  Saved best model: {DEFAULT_MODEL_PATH}")

    # ── 11. Demo predictions ───────────────────────────────────
    print("\n" + "=" * 60)
    print("  SAMPLE PREDICTIONS")
    print("=" * 60)
    samples = pd.DataFrame(
        [
            {
                "brand": "Royal Enfield",
                "owner": "First Owner",
                "kms_driven": 15000,
                "age": 3,
                "power": 350,
                "owner_rank": 1,
            },
            {
                "brand": "Bajaj",
                "owner": "Second Owner",
                "kms_driven": 40000,
                "age": 7,
                "power": 200,
                "owner_rank": 2,
            },
            {
                "brand": "Honda",
                "owner": "First Owner",
                "kms_driven": 5000,
                "age": 2,
                "power": 125,
                "owner_rank": 1,
            },
            {
                "brand": "KTM",
                "owner": "First Owner",
                "kms_driven": 10000,
                "age": 4,
                "power": 390,
                "owner_rank": 1,
            },
        ]
    )
    preds = best_pipe.predict(samples)
    for row, price in zip(samples.to_dict(orient="records"), preds):
        print(
            f"  {row['brand']:15s} {row['power']}cc, {row['kms_driven']:,}km, {row['age']}yr, {row['owner']}"
        )
        print(f"    → Predicted: ₹{price:,.0f}")

    print("\n" + "█" * 60)
    print("  DONE! All models trained, evaluated, and saved.")
    print("█" * 60 + "\n")


# ═══════════════════════════════════════════════════════════════
#  PREDICT MODE
# ═══════════════════════════════════════════════════════════════


def run_predict():
    """Interactive prediction using saved model."""
    import json

    from src.api import apply_economic_depreciation_bounds, prepare_bike_inference
    from src.contracts import BikeFeatures

    if not DEFAULT_MODEL_PATH.exists():
        print(f"Error: No saved model found at {DEFAULT_MODEL_PATH}")
        print("Run `python src/main.py` first to train a model.")
        sys.exit(1)

    pipe = joblib.load(DEFAULT_MODEL_PATH)
    meta_file = MODELS_DIR / "best_model.metadata.json"
    metadata = (
        json.loads(meta_file.read_text(encoding="utf-8"))
        if meta_file.exists()
        else None
    )

    print("\n" + "=" * 60)
    print("  USED BIKE PRICE PREDICTOR (AI Engine)")
    print("=" * 60)
    print("  Enter bike details to get a certified valuation.")
    print("  Type 'quit' to exit.\n")

    while True:
        try:
            brand = input("  Brand (e.g. Royal Enfield, Bajaj, Honda): ").strip()
            if brand.lower() in ("quit", "exit", "q"):
                break

            power = float(input("  Engine power (cc): ").strip())
            kms = float(input("  Kilometers driven: ").strip())
            age = float(input("  Age (years): ").strip())
            owner_num = int(
                input(f"  Owner number ({OWNER_RANK_MIN}-{OWNER_RANK_MAX}): ").strip()
            )

            bike_input = BikeFeatures(
                brand=brand,
                power=power,
                kms_driven=kms,
                age=age,
                owner_rank=owner_num,
            )

            input_df, quality, warnings, adjustments = prepare_bike_inference(
                bike_input, metadata
            )
            raw_pred = float(pipe.predict(input_df)[0])
            final_pred = apply_economic_depreciation_bounds(
                "bike", raw_pred, age, kms, owner_num, brand
            )

            rmse = (
                float(metadata.get("metrics", {}).get("rmse", 14000.0))
                if metadata
                else 14000.0
            )
            margin = 1.28 * rmse
            lower = max(1000.0, round(final_pred - margin, -2))
            upper = round(final_pred + margin, -2)

            print("\n  " + "─" * 45)
            print(f"  💰 Certified Fair Value: ₹{final_pred:,.0f}")
            print(f"  📊 Estimated Range    : ₹{lower:,.0f} - ₹{upper:,.0f}")
            print(f"  🎯 Reliability Level  : {quality['level'].upper()}")

            if warnings:
                print("  ⚠️  Advisories:")
                for w in warnings:
                    print(f"     • {w}")
            print("  " + "─" * 45 + "\n")

        except (ValueError, KeyboardInterrupt):
            print("\n  Invalid input. Try again or type 'quit'.\n")
            continue

    print("  Goodbye!")


if __name__ == "__main__":
    main()
