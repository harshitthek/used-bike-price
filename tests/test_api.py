from fastapi.testclient import TestClient
import src.api as api_module
from src.api import app, API_KEY
from src.contracts import (
    AGE_MAX,
    AGE_MIN,
    KMS_MAX,
    KMS_MIN,
    OWNER_RANK_TO_LABEL,
    OWNER_RANK_MAX,
    OWNER_RANK_MIN,
    POWER_MAX,
    POWER_MIN,
    PREDICTION_FEATURES,
)
from src.feature_engineering import DERIVED_NUMERIC_FEATURES

# Override the fastAPI limiter so tests don't fail due to rate limits
client = TestClient(app)


class DummyModel:
    def predict(self, df):
        assert list(df.columns) == list(PREDICTION_FEATURES)
        assert df.loc[0, "owner"] == "Fourth Owner Or More"
        return [78654.0]


class FlexibleDummyModel:
    def __init__(self, value):
        self.value = value

    def predict(self, df):
        assert list(df.columns) == list(PREDICTION_FEATURES)
        return [self.value]


class ErrorDummyModel:
    def predict(self, df):
        raise RuntimeError("boom")

def test_health_check_returns_valid():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
    assert response.json()["status"] == "ok"


def test_health_includes_readiness_metadata(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)
    monkeypatch.setattr(api_module, "model_load_error", "Model missing")

    response = client.get("/health")
    payload = response.json()

    assert response.status_code == 200
    assert "ready" in payload
    assert "model_path" in payload
    assert "model_metadata" in payload
    assert payload["model_load_error"] == "Model missing"


def test_contract_endpoint_exposes_expected_bounds():
    response = client.get("/contract")
    payload = response.json()

    assert response.status_code == 200
    assert payload["features"] == list(PREDICTION_FEATURES)
    assert payload["derived_features"] == DERIVED_NUMERIC_FEATURES
    
    schema = payload["schema"]
    assert "properties" in schema
    props = schema["properties"]
    
    assert props["power"]["minimum"] == POWER_MIN
    assert props["power"]["maximum"] == POWER_MAX
    assert props["kms_driven"]["minimum"] == KMS_MIN
    assert props["kms_driven"]["maximum"] == KMS_MAX
    assert props["age"]["minimum"] == AGE_MIN
    assert props["age"]["maximum"] == AGE_MAX
    assert props["owner_rank"]["minimum"] == OWNER_RANK_MIN
    assert props["owner_rank"]["maximum"] == OWNER_RANK_MAX
    assert payload["ui"]["owner_rank_labels"] == {str(k): v for k, v in OWNER_RANK_TO_LABEL.items()}


def test_readiness_reports_not_ready(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)
    monkeypatch.setattr(api_module, "model_load_error", "Model not found")
    monkeypatch.setattr(api_module, "_load_artifacts", lambda: None)

    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ready"] is False
    assert response.json()["model_load_error"] == "Model not found"


def test_readiness_reports_ready(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", DummyModel())
    monkeypatch.setattr(api_module, "model_load_error", None)
    monkeypatch.setattr(api_module, "_load_artifacts", lambda: None)

    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_predict_requires_valid_api_key():
    # Without X-API-Key
    response = client.post("/predict", json={
        "brand": "Royal Enfield",
        "power": 350,
        "kms_driven": 15000,
        "age": 3,
        "owner_rank": 1
    })
    # Fast api depends fails with 422 if it's not even present because of Header
    # Oh wait, verify_api_key defaults to Header("None") and triggers 401
    assert response.status_code == 401

    # With invalid key
    response_invalid = client.post("/predict", 
        headers={"x-api-key": "fake_key"},
        json={
            "brand": "Royal Enfield",
            "power": 350,
            "kms_driven": 15000,
            "age": 3,
            "owner_rank": 1
        })
    assert response_invalid.status_code == 401

def test_predict_fails_on_pydantic_bounds():
    # Should fail because power > 2500
    response = client.post("/predict", 
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Royal Enfield",
            "power": 55000, # Invalid CC
            "kms_driven": 15000,
            "age": 3,
            "owner_rank": 1
        })
    assert response.status_code == 422
    assert "power" in response.text


def test_predict_success_returns_estimate(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", DummyModel())

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
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
    assert "prediction_quality" in payload
    assert "warnings" in payload


def test_predict_returns_503_when_model_missing(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)
    monkeypatch.setattr(api_module, "_load_artifacts", lambda: None)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
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
    assert "prediction_quality" in payload


def test_predict_applies_minimum_price_floor(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(-5000.0))

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Honda",
            "power": POWER_MAX,
            "kms_driven": KMS_MAX,
            "age": AGE_MAX,
            "owner_rank": OWNER_RANK_MAX,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["estimated_price"] == 1000.0
    assert "prediction_quality" in payload


def test_predict_returns_500_on_model_exception(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", ErrorDummyModel())

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Honda",
            "power": 200,
            "kms_driven": 20000,
            "age": 4,
            "owner_rank": 2,
        },
    )

    assert response.status_code == 500
    assert "internal model error" in response.text

def test_predict_no_adjustment(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(78654.0))
    # Mock metadata with ranges
    mock_metadata = {
        "training_ranges": {
            "age": {"min": 0, "max": 20},
            "kms_driven": {"min": 0, "max": 100000},
            "power": {"min": 100, "max": 500}
        },
        "known_brands": ["Honda", "Bajaj"]
    }
    monkeypatch.setattr(api_module, "model_metadata", mock_metadata)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Honda",
            "power": 150,
            "kms_driven": 10000,
            "age": 5,
            "owner_rank": 1,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["adjustments"] == []
    assert payload["warnings"] == []


def test_predict_lower_bound_adjustment(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(78654.0))
    mock_metadata = {
        "training_ranges": {
            "age": {"min": 1, "max": 20}
        }
    }
    monkeypatch.setattr(api_module, "model_metadata", mock_metadata)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Honda",
            "power": 150,
            "kms_driven": 10000,
            "age": 0.5, # Below min
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


def test_predict_multiple_adjustments(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(78654.0))
    mock_metadata = {
        "training_ranges": {
            "age": {"min": 1, "max": 20},
            "kms_driven": {"min": 0, "max": 100000},
        }
    }
    monkeypatch.setattr(api_module, "model_metadata", mock_metadata)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Honda",
            "power": 150,
            "kms_driven": 150000, # Exceeds max
            "age": 45, # Exceeds max
            "owner_rank": 1,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["adjustments"]) == 2
    features_adjusted = {adj["feature"] for adj in payload["adjustments"]}
    assert features_adjusted == {"age", "kms_driven"}
    assert "Prediction reliability is reduced" in payload["warnings"][0]


def test_predict_unknown_categorical(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", FlexibleDummyModel(78654.0))
    mock_metadata = {
        "known_brands": ["Honda", "Bajaj"]
    }
    monkeypatch.setattr(api_module, "model_metadata", mock_metadata)

    response = client.post(
        "/predict",
        headers={"x-api-key": API_KEY},
        json={
            "brand": "Ducati", # Unknown brand
            "power": 150,
            "kms_driven": 10000,
            "age": 5,
            "owner_rank": 1,
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["adjustments"]) == 0 # No numeric adjustment
    assert payload["prediction_quality"]["level"] == "low"
    assert "Ducati" in payload["warnings"][1]
