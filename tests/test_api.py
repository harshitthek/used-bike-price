from fastapi.testclient import TestClient

import src.api as api_module
from src.api import API_KEY, app
from src.contracts import (
    AGE_MAX,
    AGE_MIN,
    CAR_BRANDS,
    CAR_FUEL_TYPES,
    CAR_PREDICTION_FEATURES,
    CAR_TRANSMISSION_TYPES,
    KMS_MAX,
    KMS_MIN,
    OWNER_RANK_MIN,
    POWER_MAX,
    POWER_MIN,
    PREDICTION_FEATURES,
)
from src.feature_engineering import DERIVED_NUMERIC_FEATURES

client = TestClient(app)


class DummyBikeModel:
    def predict(self, df):
        assert list(df.columns) == list(PREDICTION_FEATURES)
        assert df.loc[0, "owner"] == "Fourth Owner Or More"
        return [78654.0]


class DummyCarModel:
    def predict(self, df):
        assert list(df.columns) == list(CAR_PREDICTION_FEATURES)
        return [450000.0]


class FlexibleDummyModel:
    def __init__(self, value):
        self.value = value

    def predict(self, df):
        return [self.value]


class ErrorDummyModel:
    def predict(self, df):
        raise RuntimeError("boom")


def test_health_check_returns_valid():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] in ["healthy", "degraded"]


def test_health_includes_readiness_metadata(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)
    monkeypatch.setattr(api_module, "bike_load_error", "Model missing")
    monkeypatch.setattr(api_module, "_load_artifacts", lambda: None)

    response = client.get("/health")
    payload = response.json()

    assert response.status_code == 200
    assert "model_loaded" in payload
    assert "metadata_loaded" in payload
    assert payload["model_load_error"] == "Model missing"


def test_bike_contract_endpoint():
    response = client.get("/contract?vehicle_type=bike")
    payload = response.json()

    assert response.status_code == 200
    assert payload["vehicle_type"] == "bike"
    assert payload["features"] == list(PREDICTION_FEATURES)
    assert payload["derived_features"] == DERIVED_NUMERIC_FEATURES

    schema = payload["schema"]
    props = schema["properties"]
    assert props["power"]["minimum"] == POWER_MIN
    assert props["power"]["maximum"] == POWER_MAX
    assert props["kms_driven"]["minimum"] == KMS_MIN
    assert props["kms_driven"]["maximum"] == KMS_MAX
    assert props["age"]["minimum"] == AGE_MIN
    assert props["age"]["maximum"] == AGE_MAX


def test_car_contract_endpoint():
    response = client.get("/contract?vehicle_type=car")
    payload = response.json()

    assert response.status_code == 200
    assert payload["vehicle_type"] == "car"
    assert payload["features"] == list(CAR_PREDICTION_FEATURES)
    assert payload["ui"]["brands"] == CAR_BRANDS
    assert payload["ui"]["fuels"] == CAR_FUEL_TYPES
    assert payload["ui"]["transmissions"] == CAR_TRANSMISSION_TYPES


def test_predict_requires_valid_api_key():
    response = client.post(
        "/predict",
        json={
            "vehicle_type": "bike",
            "brand": "Royal Enfield",
            "power": 350,
            "kms_driven": 15000,
            "age": 3,
            "owner_rank": 1,
        },
    )
    assert response.status_code == 401

    response_invalid = client.post(
        "/predict",
        headers={"x-api-key": "fake_key"},
        json={
            "vehicle_type": "bike",
            "brand": "Royal Enfield",
            "power": 350,
            "kms_driven": 15000,
            "age": 3,
            "owner_rank": 1,
        },
    )
    assert response_invalid.status_code == 401


def test_predict_success_returns_estimate_and_range(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", DummyBikeModel())
    monkeypatch.setattr(api_module, "bike_metadata", {"metrics": {"rmse": 10000.0}})

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "vehicle_type": "bike",
            "brand": "Royal Enfield",
            "power": 350,
            "kms_driven": 15000,
            "age": 3,
            "owner_rank": 5,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["estimated_price"] == 78654.0
    assert payload["currency"] == "INR"
    assert "price_range" in payload
    assert payload["price_range"]["min"] < payload["estimated_price"]
    assert payload["price_range"]["max"] > payload["estimated_price"]
    assert "prediction_quality" in payload


def test_predict_car_success(monkeypatch):
    monkeypatch.setattr(api_module, "car_model", DummyCarModel())
    monkeypatch.setattr(api_module, "car_metadata", {"metrics": {"rmse": 50000.0}})

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "vehicle_type": "car",
            "brand": "Maruti",
            "fuel": "Petrol",
            "transmission": "Manual",
            "engine_cc": 1197,
            "max_power_bhp": 82,
            "kms_driven": 35000,
            "age": 4,
            "owner_rank": 1,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["vehicle_type"] == "car"
    assert payload["estimated_price"] == 450000.0
    assert payload["price_range"]["min"] < 450000.0
    assert payload["price_range"]["max"] > 450000.0


def test_predict_returns_503_when_model_missing(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)
    monkeypatch.setattr(api_module, "_load_artifacts", lambda: None)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "vehicle_type": "bike",
            "brand": "Royal Enfield",
            "power": 350,
            "kms_driven": 15000,
            "age": 3,
            "owner_rank": 1,
        },
    )

    assert response.status_code == 503


def test_predict_accepts_minimum_boundary_values(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(45000.0))

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "vehicle_type": "bike",
            "brand": "Honda",
            "power": POWER_MIN,
            "kms_driven": KMS_MIN,
            "age": AGE_MIN,
            "owner_rank": OWNER_RANK_MIN,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["estimated_price"] == 45000.0


def test_predict_returns_500_on_model_exception(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", ErrorDummyModel())

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "vehicle_type": "bike",
            "brand": "Honda",
            "power": 200,
            "kms_driven": 20000,
            "age": 4,
            "owner_rank": 2,
        },
    )

    assert response.status_code == 500
    assert "internal model error" in response.text


def test_predict_lower_bound_adjustment(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(78654.0))
    mock_metadata = {"training_ranges": {"age": {"min": 1.0, "max": 20.0}}}
    monkeypatch.setattr(api_module, "bike_metadata", mock_metadata)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "vehicle_type": "bike",
            "brand": "Honda",
            "power": 150,
            "kms_driven": 10000,
            "age": 0.5,
            "owner_rank": 1,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["adjustments"]) == 1
    adj = payload["adjustments"][0]
    assert adj["feature"] == "age"
    assert adj["original"] == 0.5
    assert adj["adjusted"] == 1.0
