"""CLI for retraining AutoValuate AI models with automated Seaborn diagnostic visualizer.

Usage:
    python -m src.retrain --dataset all
    python -m src.retrain --dataset bikes
    python -m src.retrain --dataset cars
"""

from __future__ import annotations

import argparse
import shutil
import sys
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def backup_existing_model(model_path: str) -> str:
    """Create a timestamped backup of the existing model."""
    p = Path(model_path)
    if p.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = p.parent / f"{p.stem}_backup_{timestamp}{p.suffix}"
        shutil.copy2(p, backup_path)
        print(f"  [BACKUP] Backed up existing model to {backup_path}")
        return str(backup_path)
    return ""


def main():
    parser = argparse.ArgumentParser(
        description="Retrain AutoValuate AI models and generate Seaborn diagnostic plots",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--dataset",
        choices=["bikes", "cars", "all"],
        default="all",
        help="Which model to retrain: bikes, cars, or all (default: all)",
    )
    parser.add_argument(
        "--data-path",
        type=str,
        default=None,
        help="Path to the CSV dataset (optional custom dataset)",
    )
    parser.add_argument(
        "--no-plot",
        action="store_true",
        help="Skip generating Seaborn diagnostic figures",
    )
    args = parser.parse_args()

    print("=" * 70)
    print("  AutoValuate AI — Automated Model Retraining & Seaborn Analytics")
    print("=" * 70)

    from src.train_and_visualize import (
        generate_dual_model_summary,
        train_and_visualize_bikes,
        train_and_visualize_cars,
    )

    bike_res, car_res = None, None

    if args.dataset in ("bikes", "all"):
        backup_existing_model("models/best_model.joblib")
        bike_res = train_and_visualize_bikes()

    if args.dataset in ("cars", "all"):
        backup_existing_model("models/car_model.joblib")
        car_res = train_and_visualize_cars()

    if bike_res and car_res and not args.no_plot:
        summary_path = generate_dual_model_summary(bike_res, car_res)
        print(f"  [FIGURE] Executive Summary: {summary_path}")

    print("\n" + "=" * 70)
    print("  [COMPLETE] Retraining complete. New serialized models and Seaborn")
    print("  diagnostic figures have been saved to models/ and reports/figures/.")
    print("=" * 70)


if __name__ == "__main__":
    main()
