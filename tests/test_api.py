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

# Override the fastAPI limiter so tests don't fail due to rate limits
client = TestClient(app)


class DummyModel:
    def predict(self, df):
        assert list(df.columns) == list(PREDICTION_FEATURES)
        assert df.loc[0, "owner"] == "Fourth Owner Above"
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
    assert payload["bounds"]["power"]["min"] == POWER_MIN
    assert payload["bounds"]["power"]["max"] == POWER_MAX
    assert payload["bounds"]["kms_driven"]["min"] == KMS_MIN
    assert payload["bounds"]["kms_driven"]["max"] == KMS_MAX
    assert payload["bounds"]["age"]["min"] == AGE_MIN
    assert payload["bounds"]["age"]["max"] == AGE_MAX
    assert payload["bounds"]["owner_rank"]["min"] == OWNER_RANK_MIN
    assert payload["bounds"]["owner_rank"]["max"] == OWNER_RANK_MAX
    assert payload["owner_rank_labels"] == {str(k): v for k, v in OWNER_RANK_TO_LABEL.items()}


def test_readiness_reports_not_ready(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)
    monkeypatch.setattr(api_module, "model_load_error", "Model not found")

    response = client.get("/ready")
    assert response.status_code == 503
    assert "Model not found" in response.text


def test_readiness_reports_ready(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", DummyModel())
    monkeypatch.setattr(api_module, "model_load_error", None)

    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["ready"] is True

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


def test_predict_returns_503_when_model_missing(monkeypatch):
    monkeypatch.setattr(api_module, "bike_model", None)

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
    assert response.json()["estimated_price"] == 45000.0


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
    assert response.json()["estimated_price"] == 1000.0


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
