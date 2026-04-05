"""FastAPI backend for Used Bike Price Prediction."""
import os
import logging
import json
from pathlib import Path

import joblib
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from src.contracts import (
    AGE_MAX,
    AGE_MIN,
    KMS_MAX,
    KMS_MIN,
    OWNER_RANK_MAX,
    OWNER_RANK_MIN,
    OWNER_RANK_TO_LABEL,
    POWER_MAX,
    POWER_MIN,
    PREDICTION_FEATURES,
)

load_dotenv()
logger = logging.getLogger(__name__)

# Basic Setup & Variables
API_KEY = os.getenv("API_KEY", "dev_12345")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Ensure project root is on path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
EVALUATION_RESULTS_PATH = OUTPUTS_DIR / "evaluation_results.json"

# Global variables for caching model state
bike_model = None
model_load_error = None
model_metadata = None


def _load_model_metadata() -> dict | None:
    if not EVALUATION_RESULTS_PATH.exists():
        return None

    try:
        with open(EVALUATION_RESULTS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        best_model = data.get("best_model")
        test_results = data.get("test_results") or []
        best_metrics = None
        if best_model:
            best_metrics = next((r for r in test_results if r.get("model") == best_model), None)

        return {
            "best_model": best_model,
            "best_metrics": best_metrics,
            "source": str(EVALUATION_RESULTS_PATH),
        }
    except Exception:
        logger.exception("Failed to parse evaluation results metadata")
        return None

def load_artifacts():
    global bike_model, model_load_error, model_metadata
    model_load_error = None
    model_metadata = None

    if not DEFAULT_MODEL_PATH.exists():
        bike_model = None
        model_load_error = f"Model not found at {DEFAULT_MODEL_PATH}"
        logger.warning(model_load_error)
        return

    try:
        logger.info("Loading model from %s", DEFAULT_MODEL_PATH)
        bike_model = joblib.load(DEFAULT_MODEL_PATH)
        model_metadata = _load_model_metadata()
        logger.info("Model loaded successfully.")
    except Exception as exc:
        bike_model = None
        model_load_error = f"Failed to load model artifact: {exc}"
        logger.exception("Model load failed")

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield

app = FastAPI(
    title="Used Bike Price Predictor API",
    description="API for estimating the resale value of used motorcycles in India",
    version="1.0.0",
    lifespan=lifespan,
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for frontend securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_api_key(x_api_key: str = Header("None")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or Missing API Key")

class BikeFeatures(BaseModel):
    brand: str = Field(..., title="Brand", min_length=2, max_length=50, json_schema_extra={"example": "Royal Enfield"})
    power: float = Field(..., title="Engine Power (cc)", ge=POWER_MIN, le=POWER_MAX, json_schema_extra={"example": 350})
    kms_driven: float = Field(..., title="Kilometers Driven", ge=KMS_MIN, le=KMS_MAX, json_schema_extra={"example": 15000})
    age: float = Field(..., title="Age (Years)", ge=AGE_MIN, le=AGE_MAX, json_schema_extra={"example": 3})
    owner_rank: int = Field(..., title="Owner Rank (1-5)", ge=OWNER_RANK_MIN, le=OWNER_RANK_MAX, json_schema_extra={"example": 1})

class PredictionResponse(BaseModel):
    estimated_price: float
    currency: str = "INR"

@app.get("/")
@limiter.limit("5/minute")
def read_root(request: Request):
    return {"message": "Welcome to the Used Bike Price Predictor API. Go to /docs for the swagger UI."}

@app.get("/health")
@limiter.limit("30/minute")
def health_check(request: Request):
    return {
        "status": "ok",
        "ready": bike_model is not None,
        "model_loaded": bike_model is not None,
        "model_path": str(DEFAULT_MODEL_PATH),
        "model_load_error": model_load_error,
        "model_metadata": model_metadata,
    }


@app.get("/ready")
@limiter.limit("30/minute")
def readiness_check(request: Request):
    if bike_model is None:
        raise HTTPException(
            status_code=503,
            detail=model_load_error or "Model is not ready.",
        )
    return {"ready": True}


@app.get("/contract")
@limiter.limit("30/minute")
def contract_check(request: Request):
    return {
        "features": list(PREDICTION_FEATURES),
        "bounds": {
            "power": {"min": POWER_MIN, "max": POWER_MAX},
            "kms_driven": {"min": KMS_MIN, "max": KMS_MAX},
            "age": {"min": AGE_MIN, "max": AGE_MAX},
            "owner_rank": {"min": OWNER_RANK_MIN, "max": OWNER_RANK_MAX},
        },
        "owner_rank_labels": OWNER_RANK_TO_LABEL,
    }

@app.post("/predict", response_model=PredictionResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def predict_price(request: Request, features: BikeFeatures):
    if bike_model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Try restarting the server or training the model.")

    owner_str = OWNER_RANK_TO_LABEL.get(features.owner_rank, "First Owner")

    input_df = pd.DataFrame([{
        "brand": features.brand,
        "owner": owner_str,
        "kms_driven": features.kms_driven,
        "age": features.age,
        "power": features.power,
        "owner_rank": features.owner_rank,
    }])[list(PREDICTION_FEATURES)]

    try:
        prediction = bike_model.predict(input_df)[0]
        # Ensure prediction is positive
        price = max(1000.0, float(prediction))
        return PredictionResponse(estimated_price=round(price, 0))
    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed due to internal model error.")

# To run:
# uvicorn src.api:app --reload
