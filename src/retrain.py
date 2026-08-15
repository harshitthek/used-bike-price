"""CLI for retraining AutoValuate AI models.

Usage:
    python -m src.retrain --dataset bikes --data-path data/Used_Bikes.csv
    python -m src.retrain --dataset cars --data-path data/Used_Cars.csv
"""

import argparse
import shutil
import sys
from datetime import datetime
from pathlib import Path


def backup_existing_model(model_path: str) -> str:
    """Create a timestamped backup of the existing model."""
    p = Path(model_path)
    if p.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = p.parent / f"{p.stem}_backup_{timestamp}{p.suffix}"
        shutil.copy2(p, backup_path)
        print(f"  📦 Backed up existing model to {backup_path}")
        return str(backup_path)
    return ""


def retrain_bikes(data_path: str):
    """Retrain the motorcycle stacking ensemble."""
    print("\n🏍️  Retraining Motorcycle Model...")
    print(f"  Dataset: {data_path}")

    backup_existing_model("models/best_model.joblib")

    # Import the training module
    try:
        from src.train_catboost_shap import train_bike_model

        train_bike_model()
        print("  ✅ Motorcycle model retrained successfully!")
    except ImportError:
        print("  ❌ Error: src.train_catboost_shap module not found")
        sys.exit(1)
    except Exception as e:
        print(f"  ❌ Training failed: {e}")
        sys.exit(1)


def retrain_cars(data_path: str):
    """Retrain the passenger car stacking ensemble."""
    print("\n🚗  Retraining Car Model...")
    print(f"  Dataset: {data_path}")

    backup_existing_model("models/car_model.joblib")

    try:
        from src.train_cars import train_car_model

        train_car_model()
        print("  ✅ Car model retrained successfully!")
    except ImportError:
        print("  ❌ Error: src.train_cars module not found")
        sys.exit(1)
    except Exception as e:
        print(f"  ❌ Training failed: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Retrain AutoValuate AI models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--dataset",
        choices=["bikes", "cars", "all"],
        required=True,
        help="Which model to retrain: bikes, cars, or all",
    )
    parser.add_argument(
        "--data-path",
        type=str,
        default=None,
        help="Path to the CSV dataset (defaults to data/Used_Bikes.csv or data/Used_Cars.csv)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  AutoValuate AI — Model Retraining Pipeline")
    print("=" * 60)

    if args.dataset in ("bikes", "all"):
        bike_path = args.data_path or "data/Used_Bikes.csv"
        retrain_bikes(bike_path)

    if args.dataset in ("cars", "all"):
        car_path = args.data_path or "data/Used_Cars.csv"
        retrain_cars(car_path)

    print("\n" + "=" * 60)
    print("  Retraining complete. Restart the API server or call")
    print("  POST /admin/reload-models to hot-swap the new models.")
    print("=" * 60)


if __name__ == "__main__":
    main()
