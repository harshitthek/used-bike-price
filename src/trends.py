from datetime import datetime
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent

_bike_trends = None
_car_trends = None


def _load_trends():
    global _bike_trends, _car_trends

    # Default empty DataFrames in case files are absent
    _bike_trends = pd.DataFrame(
        columns=[
            "brand",
            "approx_year",
            "mean_price",
            "median_price",
            "p25_price",
            "p75_price",
            "sample_count",
        ]
    )
    _car_trends = pd.DataFrame(
        columns=[
            "brand",
            "approx_year",
            "mean_price",
            "median_price",
            "p25_price",
            "p75_price",
            "sample_count",
        ]
    )

    bike_csv = PROJECT_ROOT / "data" / "Used_Bikes.csv"
    if bike_csv.exists():
        try:
            df_bikes = pd.read_csv(bike_csv)
            df_bikes = df_bikes.dropna(subset=["price", "brand", "age"])
            df_bikes["age"] = df_bikes["age"].astype(int)
            current_year = datetime.now().year
            df_bikes["approx_year"] = current_year - df_bikes["age"]

            _bike_trends = (
                df_bikes.groupby(["brand", "approx_year"])
                .agg(
                    mean_price=("price", "mean"),
                    median_price=("price", "median"),
                    p25_price=("price", lambda x: np.percentile(x, 25)),
                    p75_price=("price", lambda x: np.percentile(x, 75)),
                    sample_count=("price", "count"),
                )
                .reset_index()
            )
        except Exception:
            pass

    car_csv = PROJECT_ROOT / "data" / "Used_Cars.csv"
    if car_csv.exists():
        try:
            df_cars = pd.read_csv(car_csv)
            df_cars = df_cars.dropna(subset=["selling_price", "name", "year"])
            # Extract brand from name (first word)
            df_cars["brand"] = df_cars["name"].str.split().str[0]

            _car_trends = (
                df_cars.groupby(["brand", "year"])
                .agg(
                    mean_price=("selling_price", "mean"),
                    median_price=("selling_price", "median"),
                    p25_price=("selling_price", lambda x: np.percentile(x, 25)),
                    p75_price=("selling_price", lambda x: np.percentile(x, 75)),
                    sample_count=("selling_price", "count"),
                )
                .reset_index()
            )
            _car_trends = _car_trends.rename(columns={"year": "approx_year"})
        except Exception:
            pass


def get_trends(vehicle_type: str, brand: Optional[str] = None, metric: str = "median"):
    global _bike_trends, _car_trends
    if _bike_trends is None:
        _load_trends()

    df = _bike_trends if vehicle_type == "bike" else _car_trends

    if brand:
        df = df[df["brand"].str.lower() == brand.lower()]

    price_col = f"{metric}_price" if f"{metric}_price" in df.columns else "median_price"

    result = []
    for _, row in df.sort_values("approx_year").iterrows():
        result.append(
            {
                "brand": row["brand"],
                "year": int(row["approx_year"]),
                "price": round(float(row[price_col])),
                "p25": round(float(row["p25_price"])),
                "p75": round(float(row["p75_price"])),
                "sample_count": int(row["sample_count"]),
            }
        )

    # Get available brands for the dropdown
    all_df = _bike_trends if vehicle_type == "bike" else _car_trends
    available_brands = sorted(all_df["brand"].unique().tolist())

    return {
        "vehicle_type": vehicle_type,
        "brand_filter": brand,
        "metric": metric,
        "available_brands": available_brands,
        "data": result,
    }
