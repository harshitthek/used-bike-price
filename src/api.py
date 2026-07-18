"""FastAPI backend for Used Bike Price Prediction."""
import os
import logging
import json
import threading
from typing import Any, cast
from pathlib import Path

import joblib
import pandas as pd
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

try:
    from asgi_correlation_id import CorrelationIdMiddleware
    HAS_CORRELATION_ID = True
except ImportError:
    HAS_CORRELATION_ID = False

from src.logging_config import setup_logging
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
from src.feature_engineering import DERIVED_NUMERIC_FEATURES

load_dotenv()
logger = logging.getLogger(__name__)

# Basic Setup & Variables
API_KEY = os.getenv("API_KEY", "dev_12345")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def resolve_allowed_origins() -> list[str]:
    """Build allowed CORS origins from environment with local dev fallbacks."""
    raw_origins = os.getenv("FRONTEND_URLS", "")
    origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]

    frontend_url = FRONTEND_URL.strip().rstrip("/")
    if frontend_url:
        origins.append(frontend_url)

    # If local frontend is used, allow both loopback hostnames to avoid CORS mismatch.
    is_local_dev = any("localhost" in origin or "127.0.0.1" in origin for origin in origins)
    if is_local_dev or not origins:
        origins.extend(["http://localhost:5173", "http://127.0.0.1:5173"])

    # Preserve order while removing duplicates.
    seen = set()
    unique_origins = []
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            unique_origins.append(origin)

    return unique_origins


ALLOWED_ORIGINS = resolve_allowed_origins()

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
_model_lock = threading.Lock()


def _load_artifacts():
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
        
        metadata_path = DEFAULT_MODEL_PATH.with_suffix(".metadata.json")
        if metadata_path.exists():
            with open(metadata_path, "r", encoding="utf-8") as f:
                model_metadata = json.load(f)
        else:
            model_metadata = None

        logger.info("Model loaded successfully.")
    except Exception as exc:
        bike_model = None
        model_load_error = f"Failed to load model artifact: {exc}"
        logger.exception("Model load failed")

def get_model():
    global bike_model
    if bike_model is not None:
        return bike_model

    with _model_lock:
        if bike_model is None:
            _load_artifacts()

    return bike_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Completely lazy model loading!
    # Server will bind to port instantly for Render health checks.
    yield

app = FastAPI(
    title="Used Bike Price Predictor API",
    description="API for estimating the resale value of used motorcycles in India",
    version="1.0.0",
    lifespan=lifespan,
)

setup_logging()

if HAS_CORRELATION_ID:
    app.add_middleware(CorrelationIdMiddleware)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, cast(Any, _rate_limit_exceeded_handler))

# Enable CORS for frontend securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
    prediction_quality: dict = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    adjustments: list[dict] = Field(default_factory=list)

def prepare_inference_input(features: BikeFeatures, metadata: dict | None) -> tuple[pd.DataFrame, dict, list[str], list[dict]]:
    warnings = []
    adjustments = []
    quality_level = "high"
    ood_features = []

    owner_str = OWNER_RANK_TO_LABEL.get(features.owner_rank, "First Owner")
    
    input_dict = {
        "brand": features.brand,
        "owner": owner_str,
        "kms_driven": features.kms_driven,
        "age": features.age,
        "power": features.power,
        "owner_rank": features.owner_rank,
    }

    if metadata:
        ranges = metadata.get("training_ranges", {})
        
        # Age
        age_range = ranges.get("age")
        if age_range:
            if input_dict["age"] > age_range["max"]:
                ood_features.append("age")
                adjustments.append({
                    "feature": "age",
                    "reason": "training_range",
                    "original": float(input_dict["age"]),
                    "adjusted": age_range["max"]
                })
                input_dict["age"] = age_range["max"]
            elif input_dict["age"] < age_range["min"]:
                adjustments.append({
                    "feature": "age",
                    "reason": "training_range",
                    "original": float(input_dict["age"]),
                    "adjusted": age_range["min"]
                })
                input_dict["age"] = age_range["min"]

        # Kms Driven
        kms_range = ranges.get("kms_driven")
        if kms_range:
            if input_dict["kms_driven"] > kms_range["max"]:
                ood_features.append("kms_driven")
                adjustments.append({
                    "feature": "kms_driven",
                    "reason": "training_range",
                    "original": float(input_dict["kms_driven"]),
                    "adjusted": kms_range["max"]
                })
                input_dict["kms_driven"] = kms_range["max"]
            elif input_dict["kms_driven"] < kms_range["min"]:
                adjustments.append({
                    "feature": "kms_driven",
                    "reason": "training_range",
                    "original": float(input_dict["kms_driven"]),
                    "adjusted": kms_range["min"]
                })
                input_dict["kms_driven"] = kms_range["min"]
                
        # Power
        power_range = ranges.get("power")
        if power_range:
            if input_dict["power"] > power_range["max"]:
                ood_features.append("power")
                adjustments.append({
                    "feature": "power",
                    "reason": "training_range",
                    "original": float(input_dict["power"]),
                    "adjusted": power_range["max"]
                })
                input_dict["power"] = power_range["max"]
            elif input_dict["power"] < power_range["min"]:
                adjustments.append({
                    "feature": "power",
                    "reason": "training_range",
                    "original": float(input_dict["power"]),
                    "adjusted": power_range["min"]
                })
                input_dict["power"] = power_range["min"]

        # Brand
        known_brands = metadata.get("known_brands", [])
        if known_brands and input_dict["brand"] not in known_brands:
            warnings.append(f"Brand '{input_dict['brand']}' was not seen during training.")
            ood_features.append("brand")

    if ood_features:
        quality_level = "low"
        warnings.insert(0, "Prediction reliability is reduced because some inputs lie outside the training distribution.")

    prediction_quality = {
        "level": quality_level,
        "ood_features": ood_features
    }
    
    input_df = pd.DataFrame([input_dict])[list(PREDICTION_FEATURES)]
    
    return input_df, prediction_quality, warnings, adjustments

@app.get("/")
@limiter.limit("5/minute")
def read_root(request: Request):
    return {"message": "API running"}

@app.get("/health")
@limiter.limit("30/minute")
def health_check(request: Request):
    status = "healthy" if bike_model is not None and model_metadata is not None else "degraded"
    return {
        "status": status,
        "model_loaded": bike_model is not None,
        "metadata_loaded": model_metadata is not None,
        "model_version": model_metadata.get("model_version") if model_metadata else None,
        "model_load_error": model_load_error,
    }


@app.get("/ready")
def ready():
    return {"status": "ok"}


@app.get("/contract")
@limiter.limit("30/minute")
def contract_check(request: Request):
    return {
        "features": list(PREDICTION_FEATURES),
        "derived_features": DERIVED_NUMERIC_FEATURES,
        "schema": BikeFeatures.model_json_schema(),
        "ui": {
            "owner_rank_labels": OWNER_RANK_TO_LABEL,
        },
    }

@app.post("/predict", response_model=PredictionResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def predict_price(request: Request, features: BikeFeatures):
    start_time = time.perf_counter()
    model = get_model()
        
    if model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Try restarting the server or training the model.")

    input_df, quality, warnings, adjustments = prepare_inference_input(features, model_metadata)

    try:
        prediction = model.predict(input_df)[0]
        # Ensure prediction is positive
        price = max(1000.0, float(prediction))
        
        latency_ms = round((time.perf_counter() - start_time) * 1000)
        logger.info(
            "Prediction completed",
            extra={
                "event": "prediction_completed",
                "prediction_quality": quality["level"],
                "ood_features": quality["ood_features"],
                "adjustment_count": len(adjustments),
                "latency_ms": latency_ms
            }
        )
        
        return PredictionResponse(
            estimated_price=round(price, 0),
            prediction_quality=quality,
            warnings=warnings,
            adjustments=adjustments
        )
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000)
        logger.error(
            "Prediction failed",
            exc_info=exc,
            extra={
                "event": "prediction_failed",
                "latency_ms": latency_ms
            }
        )
        raise HTTPException(status_code=500, detail="Prediction failed due to internal model error.")

# To run:
# uvicorn src.api:app --reload
