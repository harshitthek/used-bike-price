from __future__ import annotations

import os
from typing import List

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def build_sample_data() -> pd.DataFrame:
    # Simple synthetic dataset for used bicycle prices
    data = [
        {"brand": "Giant", "mileage": 500, "year": 2022, "price": 550},
        {"brand": "Trek", "mileage": 1200, "year": 2020, "price": 420},
        {"brand": "Specialized", "mileage": 300, "year": 2023, "price": 700},
        {"brand": "Canyon", "mileage": 2000, "year": 2018, "price": 350},
        {"brand": "Giant", "mileage": 1500, "year": 2019, "price": 380},
        {"brand": "Trek", "mileage": 800, "year": 2021, "price": 520},
        {"brand": "Specialized", "mileage": 2500, "year": 2017, "price": 320},
        {"brand": "Canyon", "mileage": 400, "year": 2022, "price": 560},
        {"brand": "Giant", "mileage": 2200, "year": 2018, "price": 340},
        {"brand": "Trek", "mileage": 300, "year": 2023, "price": 680},
    ]
    return pd.DataFrame(data)


def build_pipeline(categorical: List[str], numeric: List[str]) -> Pipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("num", StandardScaler(), numeric),
        ]
    )

    model = LinearRegression()

    pipe = Pipeline(steps=[
        ("pre", preprocessor),
        ("reg", model),
    ])
    return pipe


def train_and_evaluate(df: pd.DataFrame) -> Pipeline:
    X = df[["brand", "mileage", "year"]]
    y = df["price"]

    pipe = build_pipeline(categorical=["brand"], numeric=["mileage", "year"])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42
    )

    pipe.fit(X_train, y_train)

    preds = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print("Model performance on hold-out set:")
    print(f"  MAE: {mae:.2f}")
    print(f"  R^2: {r2:.3f}")

    return pipe


def demo_prediction(pipe: Pipeline):
    sample = pd.DataFrame([
        {"brand": "Giant", "mileage": 1500, "year": 2019},
        {"brand": "Specialized", "mileage": 200, "year": 2023},
    ])
    pred = pipe.predict(sample)
    for row, price in zip(sample.to_dict(orient="records"), pred):
        print(f"Prediction for {row}: ${price:.2f}")


def save_model(pipe: Pipeline, path: str = os.path.join("models", "bike_price_model.joblib")) -> str:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(pipe, path)
    print(f"Saved model to {path}")
    return path


if __name__ == "__main__":
    df = build_sample_data()
    print("Sample data:\n", df.head(), "\n")

    pipe = train_and_evaluate(df)
    demo_prediction(pipe)
    save_model(pipe)
