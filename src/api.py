"""FastAPI backend for Used Bike & Car Price Prediction (AutoValuate AI)."""

import json
import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Literal, Optional, Tuple, cast

import joblib
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

try:
    from asgi_correlation_id import CorrelationIdMiddleware

    HAS_CORRELATION_ID = True
except ImportError:
    HAS_CORRELATION_ID = False

from src.contracts import (
    AGE_MAX,
    AGE_MIN,
    ANNUAL_KM_BIKE,
    ANNUAL_KM_CAR,
    BATCH_PREDICT_MAX_ITEMS,
    BIKE_BRANDS,
    CAR_AGE_MAX,
    CAR_AGE_MIN,
    CAR_BHP_MAX,
    CAR_BHP_MIN,
    CAR_BRANDS,
    CAR_ENGINE_MAX,
    CAR_ENGINE_MIN,
    CAR_FUEL_TYPES,
    CAR_KMS_MAX,
    CAR_KMS_MIN,
    CAR_PREDICTION_FEATURES,
    CAR_TRANSMISSION_TYPES,
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
from src.logging_config import setup_logging

try:
    from src.models import StackingEnsembleModel
except ImportError:
    StackingEnsembleModel = None


load_dotenv()
logger = logging.getLogger(__name__)

# Basic Setup & Variables
API_KEY = os.getenv("API_KEY", "dev_12345")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def resolve_allowed_origins() -> list[str]:
    """Build allowed CORS origins from environment with local dev fallbacks."""
    raw_origins = os.getenv("FRONTEND_URLS", "")
    origins = [
        origin.strip().rstrip("/")
        for origin in raw_origins.split(",")
        if origin.strip()
    ]

    frontend_url = FRONTEND_URL.strip().rstrip("/")
    if frontend_url:
        origins.append(frontend_url)

    is_local_dev = any(
        "localhost" in origin or "127.0.0.1" in origin for origin in origins
    )
    if is_local_dev or not origins:
        origins.extend(
            [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
                "http://localhost:5175",
                "http://127.0.0.1:5175",
            ]
        )

    seen = set()
    unique_origins = []
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            unique_origins.append(origin)

    return unique_origins


ALLOWED_ORIGINS = resolve_allowed_origins()

# Project root paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
BIKE_MODEL_PATH = MODELS_DIR / "best_model.joblib"
CAR_MODEL_PATH = MODELS_DIR / "car_model.joblib"

# Model caching state
bike_model = None
bike_metadata = None
bike_load_error = None

car_model = None
car_metadata = None
car_load_error = None

_model_lock = threading.Lock()


def _load_artifacts():
    global bike_model, bike_metadata, bike_load_error
    global car_model, car_metadata, car_load_error

    # Load Bike Model
    bike_load_error = None
    if BIKE_MODEL_PATH.exists():
        try:
            bike_model = joblib.load(BIKE_MODEL_PATH)
            meta_path = BIKE_MODEL_PATH.with_suffix(".metadata.json")
            if meta_path.exists():
                with open(meta_path, "r", encoding="utf-8") as f:
                    bike_metadata = json.load(f)
            logger.info("Bike model loaded successfully.")
        except Exception as exc:
            bike_model = None
            bike_load_error = f"Failed to load bike model: {exc}"
            logger.exception("Bike model load failed")
    else:
        bike_load_error = f"Bike model not found at {BIKE_MODEL_PATH}"

    # Load Car Model
    car_load_error = None
    if CAR_MODEL_PATH.exists():
        try:
            car_model = joblib.load(CAR_MODEL_PATH)
            meta_path = CAR_MODEL_PATH.with_suffix(".metadata.json")
            if meta_path.exists():
                with open(meta_path, "r", encoding="utf-8") as f:
                    car_metadata = json.load(f)
            logger.info("Car model loaded successfully.")
        except Exception as exc:
            car_model = None
            car_load_error = f"Failed to load car model: {exc}"
            logger.exception("Car model load failed")
    else:
        car_load_error = f"Car model not found at {CAR_MODEL_PATH}"


def get_model(vehicle_type: str = "bike") -> Tuple[Any, Optional[dict]]:
    global bike_model, car_model
    if (vehicle_type == "bike" and bike_model is not None) or (
        vehicle_type == "car" and car_model is not None
    ):
        return (
            (bike_model, bike_metadata)
            if vehicle_type == "bike"
            else (car_model, car_metadata)
        )

    with _model_lock:
        if (vehicle_type == "bike" and bike_model is None) or (
            vehicle_type == "car" and car_model is None
        ):
            _load_artifacts()

    if vehicle_type == "car":
        return car_model, car_metadata
    return bike_model, bike_metadata


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload models at startup
    _load_artifacts()
    yield


app = FastAPI(
    title="AutoValuate AI — Used Vehicle Price Predictor",
    description="API for estimating the resale value, future depreciation, and value drivers of used motorcycles and cars in India",
    version="2.5.0",
    lifespan=lifespan,
)

setup_logging()

if HAS_CORRELATION_ID:
    app.add_middleware(CorrelationIdMiddleware)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, cast(Any, _rate_limit_exceeded_handler))

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


# ── REQUEST & RESPONSE SCHEMAS ─────────────────────────────────────


class BikeFeatures(BaseModel):
    vehicle_type: Literal["bike"] = "bike"
    brand: str = Field(
        ...,
        title="Brand",
        min_length=2,
        max_length=50,
        json_schema_extra={"example": "Royal Enfield"},
    )
    power: float = Field(
        ...,
        title="Engine Power (cc)",
        ge=POWER_MIN,
        le=POWER_MAX,
        json_schema_extra={"example": 350},
    )
    kms_driven: float = Field(
        ...,
        title="Kilometers Driven",
        ge=KMS_MIN,
        le=KMS_MAX,
        json_schema_extra={"example": 15000},
    )
    age: float = Field(
        ...,
        title="Age (Years)",
        ge=AGE_MIN,
        le=AGE_MAX,
        json_schema_extra={"example": 3},
    )
    owner_rank: int = Field(
        ...,
        title="Owner Rank (1-5)",
        ge=OWNER_RANK_MIN,
        le=OWNER_RANK_MAX,
        json_schema_extra={"example": 1},
    )


class CarFeatures(BaseModel):
    vehicle_type: Literal["car"] = "car"
    brand: str = Field(
        ...,
        title="Brand",
        min_length=2,
        max_length=50,
        json_schema_extra={"example": "Maruti"},
    )
    fuel: str = Field(
        default="Petrol",
        title="Fuel Type",
        json_schema_extra={"example": "Petrol"},
    )
    transmission: str = Field(
        default="Manual",
        title="Transmission",
        json_schema_extra={"example": "Manual"},
    )
    engine_cc: float = Field(
        ...,
        title="Engine Displacement (cc)",
        ge=CAR_ENGINE_MIN,
        le=CAR_ENGINE_MAX,
        json_schema_extra={"example": 1197},
    )
    max_power_bhp: Optional[float] = Field(
        default=None,
        title="Max Power (bhp)",
        ge=CAR_BHP_MIN,
        le=CAR_BHP_MAX,
        json_schema_extra={"example": 82.0},
    )
    kms_driven: float = Field(
        ...,
        title="Kilometers Driven",
        ge=CAR_KMS_MIN,
        le=CAR_KMS_MAX,
        json_schema_extra={"example": 45000},
    )
    age: float = Field(
        ...,
        title="Age (Years)",
        ge=CAR_AGE_MIN,
        le=CAR_AGE_MAX,
        json_schema_extra={"example": 5},
    )
    owner_rank: int = Field(
        ...,
        title="Owner Rank (1-5)",
        ge=OWNER_RANK_MIN,
        le=OWNER_RANK_MAX,
        json_schema_extra={"example": 1},
    )


class UniversalVehicleInput(BaseModel):
    vehicle_type: Literal["bike", "car"] = "bike"
    brand: str = Field(..., min_length=2, max_length=50)
    power: Optional[float] = None
    engine_cc: Optional[float] = None
    max_power_bhp: Optional[float] = None
    fuel: Optional[str] = "Petrol"
    transmission: Optional[str] = "Manual"
    kms_driven: float = Field(..., ge=0, le=999999)
    age: float = Field(..., ge=0, le=50)
    owner_rank: int = Field(..., ge=1, le=5)


class PriceRange(BaseModel):
    min: float
    max: float
    confidence_interval: float = 0.80


class WaterfallItem(BaseModel):
    factor: str
    impact: float
    direction: Literal["positive", "negative", "neutral"]
    description: str


class DepreciationForecastItem(BaseModel):
    year_offset: int
    calendar_year: int
    age: float
    kms_driven: float
    estimated_price: float
    retention_pct: float


class PredictionResponse(BaseModel):
    vehicle_type: str = "bike"
    estimated_price: float
    currency: str = "INR"
    price_range: PriceRange
    prediction_quality: dict = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    adjustments: list[dict] = Field(default_factory=list)
    waterfall_breakdown: list[WaterfallItem] = Field(default_factory=list)
    depreciation_forecast: list[DepreciationForecastItem] = Field(default_factory=list)


class BatchPredictionRequest(BaseModel):
    vehicles: List[UniversalVehicleInput] = Field(
        ..., max_length=BATCH_PREDICT_MAX_ITEMS
    )


class BatchPredictionSummary(BaseModel):
    total_fleet_value: float
    average_vehicle_price: float
    vehicle_count: int
    high_confidence_count: int


class BatchPredictionResponse(BaseModel):
    summary: BatchPredictionSummary
    predictions: List[PredictionResponse]


# ── INFERENCE INPUT PREPARATION ─────────────────────────────────────


def prepare_bike_inference(
    data: UniversalVehicleInput | BikeFeatures, metadata: dict | None
) -> Tuple[pd.DataFrame, dict, list[str], list[dict]]:
    warnings = []
    adjustments = []
    quality_level = "high"
    ood_features = []

    power_val = getattr(data, "power", None) or getattr(data, "engine_cc", 150.0)
    owner_str = OWNER_RANK_TO_LABEL.get(data.owner_rank, "First Owner")

    input_dict = {
        "brand": data.brand,
        "owner": owner_str,
        "kms_driven": float(data.kms_driven),
        "age": float(data.age),
        "power": float(power_val),
        "owner_rank": int(data.owner_rank),
    }

    if metadata:
        ranges = metadata.get("training_ranges", {})
        for feat in ["age", "kms_driven", "power"]:
            feat_range = ranges.get(feat)
            if feat_range:
                val = float(input_dict[feat])
                if val > feat_range["max"]:
                    ood_features.append(feat)
                    adjustments.append(
                        {
                            "feature": feat,
                            "reason": "training_range",
                            "original": val,
                            "adjusted": feat_range["max"],
                        }
                    )
                    input_dict[feat] = feat_range["max"]
                elif val < feat_range["min"]:
                    adjustments.append(
                        {
                            "feature": feat,
                            "reason": "training_range",
                            "original": val,
                            "adjusted": feat_range["min"],
                        }
                    )
                    input_dict[feat] = feat_range["min"]

        known_brands = metadata.get("known_brands", [])
        if known_brands and input_dict["brand"] not in known_brands:
            warnings.append(
                f"Brand '{input_dict['brand']}' was not seen during training."
            )
            ood_features.append("brand")

    if ood_features:
        quality_level = "low"
        warnings.insert(
            0,
            "Prediction reliability is reduced because some inputs lie outside the training distribution.",
        )

    prediction_quality = {"level": quality_level, "ood_features": ood_features}
    input_df = pd.DataFrame([input_dict])[list(PREDICTION_FEATURES)]
    return input_df, prediction_quality, warnings, adjustments


def prepare_car_inference(
    data: UniversalVehicleInput | CarFeatures, metadata: dict | None
) -> Tuple[pd.DataFrame, dict, list[str], list[dict]]:
    warnings = []
    adjustments = []
    quality_level = "high"
    ood_features = []

    engine_val = getattr(data, "engine_cc", None) or getattr(data, "power", 1197.0)
    bhp_val = getattr(data, "max_power_bhp", None)
    if bhp_val is None:
        # Default heuristic: ~0.075 bhp per cc + 10 for typical Indian passenger cars
        bhp_val = round(float(engine_val) * 0.075 + 10.0, 1)

    fuel_val = (getattr(data, "fuel", "Petrol") or "Petrol").capitalize()
    trans_val = (getattr(data, "transmission", "Manual") or "Manual").capitalize()

    input_dict = {
        "brand": data.brand,
        "fuel": fuel_val,
        "transmission": trans_val,
        "engine_cc": float(engine_val),
        "max_power_bhp": float(bhp_val),
        "age": float(data.age),
        "kms_driven": float(data.kms_driven),
        "owner_rank": int(data.owner_rank),
    }

    if metadata:
        ranges = metadata.get("training_ranges", {})
        for feat in ["age", "kms_driven", "engine_cc", "max_power_bhp"]:
            feat_range = ranges.get(feat)
            if feat_range:
                val = float(input_dict[feat])
                if val > feat_range["max"]:
                    ood_features.append(feat)
                    adjustments.append(
                        {
                            "feature": feat,
                            "reason": "training_range",
                            "original": val,
                            "adjusted": feat_range["max"],
                        }
                    )
                    input_dict[feat] = feat_range["max"]
                elif val < feat_range["min"]:
                    adjustments.append(
                        {
                            "feature": feat,
                            "reason": "training_range",
                            "original": val,
                            "adjusted": feat_range["min"],
                        }
                    )
                    input_dict[feat] = feat_range["min"]

        known_brands = metadata.get("known_brands", [])
        if known_brands and input_dict["brand"] not in known_brands:
            warnings.append(
                f"Brand '{input_dict['brand']}' was not seen during training."
            )
            ood_features.append("brand")

    if ood_features:
        quality_level = "low"
        warnings.insert(
            0,
            "Prediction reliability is reduced because some inputs lie outside the training distribution.",
        )

    prediction_quality = {"level": quality_level, "ood_features": ood_features}
    input_df = pd.DataFrame([input_dict])[list(CAR_PREDICTION_FEATURES)]
    return input_df, prediction_quality, warnings, adjustments


# ── VALUE DRIVERS & FORECAST COMPUTATION ────────────────────────────


def calculate_waterfall_breakdown(
    v_type: str,
    payload: UniversalVehicleInput | BikeFeatures | CarFeatures,
    estimated_price: float,
) -> list[WaterfallItem]:
    """Calculate transparent marginal factor contributions (+/- ₹) towards the valuation."""
    items: list[WaterfallItem] = []

    if v_type == "bike":
        power = float(
            getattr(payload, "power", None) or getattr(payload, "engine_cc", 150.0)
        )
        age = float(payload.age)
        kms = float(payload.kms_driven)
        owner_rank = int(payload.owner_rank)
        brand = str(payload.brand)

        # Baseline reference for bikes: ~150cc commuter, 3 yrs, 20k km, 1st owner = ~₹55,000
        baseline_price = 55000.0
        items.append(
            WaterfallItem(
                factor="Market Baseline",
                impact=baseline_price,
                direction="neutral",
                description="Standard 150cc 2-wheeler segment baseline value",
            )
        )

        # 1. Displacement impact
        cc_diff = power - 150.0
        cc_impact = round(cc_diff * 180.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Engine Displacement ({int(power)}cc)",
                impact=cc_impact,
                direction="positive" if cc_impact >= 0 else "negative",
                description="Power capacity premium above commuter standard",
            )
        )

        # 2. Age Depreciation
        age_impact = round(-max(0.0, age) * 4500.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Vehicle Age ({int(age)} yrs)",
                impact=age_impact,
                direction="negative" if age_impact < 0 else "neutral",
                description="Time-based asset market depreciation",
            )
        )

        # 3. Mileage wear
        km_impact = round(-(kms / 1000.0) * 480.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Odometer ({int(kms):,} km)",
                impact=km_impact,
                direction="negative" if km_impact < 0 else "neutral",
                description="Wear & tear from accumulated usage",
            )
        )

        # 4. Ownership status
        owner_impact = round(-(owner_rank - 1) * 6500.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Ownership (Rank {owner_rank})",
                impact=owner_impact,
                direction="negative" if owner_impact < 0 else "neutral",
                description="Title transfers and previous owner discount",
            )
        )

        # 5. Brand Prestige & Demand residual
        sum_impacts = baseline_price + cc_impact + age_impact + km_impact + owner_impact
        brand_impact = round(estimated_price - sum_impacts, -2)
        items.append(
            WaterfallItem(
                factor=f"Brand Premium ({brand})",
                impact=brand_impact,
                direction="positive" if brand_impact >= 0 else "negative",
                description="Brand resale retention & aftermarket liquidity",
            )
        )

    else:
        engine_cc = float(
            getattr(payload, "engine_cc", None) or getattr(payload, "power", 1197.0)
        )
        age = float(payload.age)
        kms = float(payload.kms_driven)
        owner_rank = int(payload.owner_rank)
        brand = str(payload.brand)
        fuel = str(getattr(payload, "fuel", "Petrol"))

        baseline_price = 400000.0
        items.append(
            WaterfallItem(
                factor="Market Baseline",
                impact=baseline_price,
                direction="neutral",
                description="Standard 1.2L passenger hatchback baseline value",
            )
        )

        # 1. Engine & Fuel
        cc_impact = round((engine_cc - 1197.0) * 140.0, -2)
        if fuel.lower() == "diesel":
            cc_impact += 35000.0
        items.append(
            WaterfallItem(
                factor=f"Engine & Fuel ({int(engine_cc)}cc {fuel})",
                impact=cc_impact,
                direction="positive" if cc_impact >= 0 else "negative",
                description="Displacement & powertrain fuel efficiency premium",
            )
        )

        # 2. Age
        age_impact = round(-max(0.0, age) * 28000.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Vehicle Age ({int(age)} yrs)",
                impact=age_impact,
                direction="negative" if age_impact < 0 else "neutral",
                description="Automotive model year market depreciation",
            )
        )

        # 3. Mileage
        km_impact = round(-(kms / 1000.0) * 1600.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Odometer ({int(kms):,} km)",
                impact=km_impact,
                direction="negative" if km_impact < 0 else "neutral",
                description="Mechanical usage and maintenance wear",
            )
        )

        # 4. Owner
        owner_impact = round(-(owner_rank - 1) * 42000.0, -2)
        items.append(
            WaterfallItem(
                factor=f"Ownership (Rank {owner_rank})",
                impact=owner_impact,
                direction="negative" if owner_impact < 0 else "neutral",
                description="Resale discount across multiple registrations",
            )
        )

        # 5. Brand residual
        sum_impacts = baseline_price + cc_impact + age_impact + km_impact + owner_impact
        brand_impact = round(estimated_price - sum_impacts, -2)
        items.append(
            WaterfallItem(
                factor=f"Brand Premium ({brand})",
                impact=brand_impact,
                direction="positive" if brand_impact >= 0 else "negative",
                description="Manufacturer demand & secondary market liquidity",
            )
        )

    return items


def calculate_depreciation_forecast(
    v_type: str,
    payload: UniversalVehicleInput | BikeFeatures | CarFeatures,
    model: Any,
    metadata: dict | None,
    current_price: float,
) -> list[DepreciationForecastItem]:
    """Generate 5-year future resale forecast simulating aging and mileage accumulation."""
    forecast: list[DepreciationForecastItem] = []
    current_year = datetime.now(timezone.utc).year
    annual_km = ANNUAL_KM_BIKE if v_type == "bike" else ANNUAL_KM_CAR
    floor_price = 1000.0 if v_type == "bike" else 25000.0

    last_price = current_price
    for offset in range(6):  # 0 to 5 years into future
        future_age = float(payload.age) + offset
        future_kms = float(payload.kms_driven) + (offset * annual_km)
        cal_year = current_year + offset

        if offset == 0:
            price = current_price
        else:
            simulated_data = UniversalVehicleInput(
                vehicle_type=v_type,
                brand=payload.brand,
                power=getattr(payload, "power", None),
                engine_cc=getattr(payload, "engine_cc", None),
                max_power_bhp=getattr(payload, "max_power_bhp", None),
                fuel=getattr(payload, "fuel", "Petrol"),
                transmission=getattr(payload, "transmission", "Manual"),
                kms_driven=future_kms,
                age=future_age,
                owner_rank=int(payload.owner_rank),
            )

            if v_type == "car":
                in_df, _, _, _ = prepare_car_inference(simulated_data, metadata)
            else:
                in_df, _, _, _ = prepare_bike_inference(simulated_data, metadata)

            try:
                raw_pred = float(model.predict(in_df)[0])
                # Ensure realistic progressive depreciation (cannot gain value over time)
                price = max(floor_price, min(last_price * 0.96, raw_pred))
            except Exception:
                price = max(floor_price, last_price * 0.88)

        last_price = price
        retention = (
            round((price / current_price) * 100.0, 1) if current_price > 0 else 100.0
        )

        forecast.append(
            DepreciationForecastItem(
                year_offset=offset,
                calendar_year=cal_year,
                age=round(future_age, 1),
                kms_driven=round(future_kms, 0),
                estimated_price=round(price, 0),
                retention_pct=retention,
            )
        )

    return forecast


# ── ENDPOINTS ───────────────────────────────────────────────────────


@app.get("/")
@limiter.limit("10/minute")
def read_root(request: Request):
    return {"message": "AutoValuate AI API running"}


@app.get("/health")
@limiter.limit("30/minute")
def health_check(request: Request):
    b_mod, b_meta = get_model("bike")
    c_mod, c_meta = get_model("car")

    status = "healthy" if b_mod is not None and c_mod is not None else "degraded"
    return {
        "status": status,
        "model_loaded": b_mod is not None,
        "bike_model_loaded": b_mod is not None,
        "car_model_loaded": c_mod is not None,
        "metadata_loaded": b_meta is not None,
        "model_version": b_meta.get("model_version") if b_meta else None,
        "model_load_error": bike_load_error,
    }


@app.get("/ready")
def ready():
    return {"status": "ok"}


@app.get("/contract")
@limiter.limit("30/minute")
def contract_check(
    request: Request, vehicle_type: Literal["bike", "car"] = Query("bike")
):
    if vehicle_type == "car":
        return {
            "vehicle_type": "car",
            "features": list(CAR_PREDICTION_FEATURES),
            "schema": CarFeatures.model_json_schema(),
            "ui": {
                "brands": CAR_BRANDS,
                "fuels": CAR_FUEL_TYPES,
                "transmissions": CAR_TRANSMISSION_TYPES,
                "owner_rank_labels": OWNER_RANK_TO_LABEL,
            },
        }

    return {
        "vehicle_type": "bike",
        "features": list(PREDICTION_FEATURES),
        "derived_features": DERIVED_NUMERIC_FEATURES,
        "schema": BikeFeatures.model_json_schema(),
        "ui": {
            "brands": BIKE_BRANDS,
            "owner_rank_labels": OWNER_RANK_TO_LABEL,
        },
    }


@app.post(
    "/predict",
    response_model=PredictionResponse,
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit("30/minute")
def predict_price(request: Request, payload: UniversalVehicleInput):
    start_time = time.perf_counter()
    v_type = payload.vehicle_type

    model, metadata = get_model(v_type)

    if model is None:
        raise HTTPException(
            status_code=503,
            detail=f"{v_type.capitalize()} model is not loaded. Try restarting the server.",
        )

    if v_type == "car":
        input_df, quality, warnings, adjustments = prepare_car_inference(
            payload, metadata
        )
        default_rmse = 141335.0
        floor_price = 25000.0
    else:
        input_df, quality, warnings, adjustments = prepare_bike_inference(
            payload, metadata
        )
        default_rmse = 14934.0
        floor_price = 1000.0

    try:
        prediction = float(model.predict(input_df)[0])
        price = max(floor_price, prediction)

        # Compute price range using residual standard error (80% confidence interval ~ 1.28 * RMSE)
        rmse = (
            float(metadata.get("metrics", {}).get("rmse", default_rmse))
            if metadata
            else default_rmse
        )
        margin = 1.28 * rmse
        lower_bound = max(floor_price, round(price - margin, -2))
        upper_bound = round(price + margin, -2)

        # Compute Waterfall Value Drivers
        waterfall = calculate_waterfall_breakdown(v_type, payload, price)

        # Compute 5-Year Depreciation Forecast
        forecast = calculate_depreciation_forecast(
            v_type, payload, model, metadata, price
        )

        latency_ms = round((time.perf_counter() - start_time) * 1000)
        logger.info(
            f"{v_type.capitalize()} prediction completed",
            extra={
                "event": "prediction_completed",
                "vehicle_type": v_type,
                "prediction_quality": quality["level"],
                "ood_features": quality["ood_features"],
                "adjustment_count": len(adjustments),
                "latency_ms": latency_ms,
            },
        )

        return PredictionResponse(
            vehicle_type=v_type,
            estimated_price=round(price, 0),
            price_range=PriceRange(
                min=lower_bound,
                max=upper_bound,
                confidence_interval=0.80,
            ),
            prediction_quality=quality,
            warnings=warnings,
            adjustments=adjustments,
            waterfall_breakdown=waterfall,
            depreciation_forecast=forecast,
        )
    except Exception as exc:
        latency_ms = round((time.perf_counter() - start_time) * 1000)
        logger.error(
            f"{v_type.capitalize()} prediction failed",
            exc_info=exc,
            extra={"event": "prediction_failed", "latency_ms": latency_ms},
        )
        raise HTTPException(
            status_code=500,
            detail="Prediction failed due to internal model error.",
        )


@app.post(
    "/predict/batch",
    response_model=BatchPredictionResponse,
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit("20/minute")
def predict_batch(request: Request, batch_payload: BatchPredictionRequest):
    """Bulk valuation endpoint for fleet management and dealership inventories."""
    results: list[PredictionResponse] = []
    total_val = 0.0
    high_conf_count = 0

    for item in batch_payload.vehicles:
        res = predict_price(request, item)
        results.append(res)
        total_val += res.estimated_price
        if res.prediction_quality.get("level") == "high":
            high_conf_count += 1

    count = len(results)
    avg_val = round(total_val / count, 0) if count > 0 else 0.0

    return BatchPredictionResponse(
        summary=BatchPredictionSummary(
            total_fleet_value=round(total_val, 0),
            average_vehicle_price=avg_val,
            vehicle_count=count,
            high_confidence_count=high_conf_count,
        ),
        predictions=results,
    )
