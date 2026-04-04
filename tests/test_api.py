import os
from fastapi.testclient import TestClient
from src.api import app, API_KEY

# Override the fastAPI limiter so tests don't fail due to rate limits
client = TestClient(app)

def test_health_check_returns_valid():
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()
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
