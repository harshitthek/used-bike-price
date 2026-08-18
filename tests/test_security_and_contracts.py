from fastapi.testclient import TestClient

from src.api import API_KEY, app
from src.contracts import (
    BIKE_BRAND_POWER_LIMITS,
    BIKE_BRANDS,
    CAR_BRAND_ENGINE_LIMITS,
    CAR_BRANDS,
)

client = TestClient(app)


def test_api_key_required():
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
    assert "Invalid or Missing API Key" in response.json()["detail"]


def test_invalid_api_key_rejected():
    response = client.post(
        "/predict",
        headers={"x-api-key": "invalid_wrong_key"},
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


def test_valid_api_key_accepted():
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
    assert response.status_code in [200, 503]


def test_brand_power_limits_completeness():
    for brand in BIKE_BRANDS:
        limits = BIKE_BRAND_POWER_LIMITS.get(brand, (100, 650))
        assert isinstance(limits, (tuple, list))
        assert len(limits) == 2
        assert limits[0] <= limits[1]
        assert limits[0] >= 50
        assert limits[1] <= 2500


def test_car_engine_limits_completeness():
    for brand in CAR_BRANDS:
        limits = CAR_BRAND_ENGINE_LIMITS.get(brand, (800, 2500))
        assert isinstance(limits, (tuple, list))
        assert len(limits) == 2
        assert limits[0] <= limits[1]
        assert limits[0] >= 500
        assert limits[1] <= 6000


def test_lifecycle_simulator_endpoint_validation():
    payload = {
        "vehicle_type": "bike",
        "brand": "KTM",
        "power": 390,
        "kms_driven": 8000,
        "age": 1,
        "owner_rank": 1,
        "annual_kms": 10000,
        "custom_fuel_price": 105.0,
    }
    response = client.post(
        "/simulate/lifecycle", headers={"x-api-key": API_KEY}, json=payload
    )
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert "timeline" in data
        assert len(data["timeline"]) == 6
        assert "summary" in data
        assert "total_cost_of_ownership" in data["summary"]
        assert "optimal_sell_window" in data


def test_batch_prediction_validation():
    batch_payload = {
        "vehicles": [
            {
                "vehicle_type": "bike",
                "brand": "Royal Enfield",
                "power": 350,
                "kms_driven": 15000,
                "age": 3,
                "owner_rank": 1,
            },
            {
                "vehicle_type": "car",
                "brand": "Maruti",
                "engine_cc": 1197,
                "max_power_bhp": 88,
                "kms_driven": 35000,
                "age": 4,
                "owner_rank": 1,
                "fuel": "Petrol",
                "transmission": "Manual",
            },
        ]
    }
    response = client.post(
        "/predict/batch", headers={"x-api-key": API_KEY}, json=batch_payload
    )
    assert response.status_code in [200, 503]
    if response.status_code == 200:
        data = response.json()
        assert "summary" in data
        assert data["summary"]["vehicle_count"] == 2
        assert len(data["predictions"]) == 2


def test_owasp_security_headers_present():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "SAMEORIGIN"
    assert response.headers.get("x-xss-protection") == "0"
    assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert "camera=()" in response.headers.get("permissions-policy", "")
