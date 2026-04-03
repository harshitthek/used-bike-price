"""Load and validate the Used Bikes dataset."""
from __future__ import annotations

import os
from pathlib import Path

import pandas as pd

# Expected schema from the Kaggle / Droom dataset
EXPECTED_COLUMNS = {
    "bike_name", "price", "city", "kms_driven",
    "owner", "age", "power", "brand",
}

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DEFAULT_CSV = DATA_DIR / "Used_Bikes.csv"


def load_data(path: str | Path | None = None) -> pd.DataFrame:
    """Load the used-bikes CSV and perform basic validation.

    Parameters
    ----------
    path : str | Path | None
        Path to the CSV file.  When *None* the loader scans ``data/``
        for the first ``.csv`` it finds (falls back to ``Used_Bikes.csv``).

    Returns
    -------
    pd.DataFrame
        Raw (uncleaned) dataframe with typical columns:
        bike_name, price, city, kms_driven, owner, age, power, brand.

    Raises
    ------
    FileNotFoundError
        If no CSV can be located.
    ValueError
        If the CSV is empty or missing critical columns.
    """
    csv_path = _resolve_csv_path(path)
    print(f"[data_loader] Loading data from {csv_path}")

    df = pd.read_csv(csv_path)

    # ── Validation ─────────────────────────────────────────────
    if df.empty:
        raise ValueError(f"CSV at {csv_path} is empty.")

    actual_cols = set(df.columns.str.strip().str.lower())
    # Normalise column names once
    df.columns = df.columns.str.strip().str.lower()

    missing = EXPECTED_COLUMNS - actual_cols
    if missing:
        print(f"[data_loader] WARNING — missing columns: {missing}. "
              "Some preprocessing steps may be skipped.")

    print(f"[data_loader] Loaded {len(df):,} rows × {len(df.columns)} columns")
    return df


def _resolve_csv_path(path: str | Path | None) -> Path:
    """Find the CSV file to load."""
    if path is not None:
        p = Path(path)
        if p.is_file():
            return p
        raise FileNotFoundError(f"Specified CSV not found: {path}")

    # Default: look for the canonical file first
    if DEFAULT_CSV.is_file():
        return DEFAULT_CSV

    # Fallback: grab the first .csv in data/
    if DATA_DIR.is_dir():
        csvs = list(DATA_DIR.glob("*.csv"))
        if csvs:
            return csvs[0]

    raise FileNotFoundError(
        f"No CSV found. Place a dataset in {DATA_DIR}/ or pass an explicit path."
    )


def describe_data(df: pd.DataFrame) -> None:
    """Print a concise summary of the dataframe."""
    print("\n" + "=" * 60)
    print("  DATASET SUMMARY")
    print("=" * 60)
    print(f"  Rows   : {len(df):,}")
    print(f"  Columns: {list(df.columns)}")

    if "brand" in df.columns:
        n_brands = df["brand"].nunique()
        top3 = df["brand"].value_counts().head(3)
        print(f"  Brands : {n_brands} unique — top 3: "
              + ", ".join(f"{b} ({c:,})" for b, c in top3.items()))

    if "price" in df.columns:
        print(f"  Price  : ₹{df['price'].min():,.0f} – ₹{df['price'].max():,.0f}  "
              f"(mean ₹{df['price'].mean():,.0f})")

    if "kms_driven" in df.columns:
        print(f"  KMs    : {df['kms_driven'].min():,.0f} – "
              f"{df['kms_driven'].max():,.0f} km")

    nulls = df.isnull().sum()
    if nulls.any():
        print(f"  Nulls  : {nulls[nulls > 0].to_dict()}")
    else:
        print("  Nulls  : None")
    print("=" * 60 + "\n")
