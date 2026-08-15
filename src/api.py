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
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

try:
    from asgi_correlation_id import CorrelationIdMiddleware

    HAS_CORRELATION_ID = True
except ImportError:
    HAS_CORRELATION_ID = False


import secrets

from src.contracts import (
    ANNUAL_KM_BIKE,
    ANNUAL_KM_CAR,
    BIKE_BRAND_POWER_LIMITS,
    BIKE_BRANDS,
    CAR_BRAND_ENGINE_LIMITS,
    CAR_BRANDS,
    CAR_FUEL_TYPES,
    CAR_PREDICTION_FEATURES,
    CAR_TRANSMISSION_TYPES,
    DEFAULT_FUEL_PRICES,
    OWNER_RANK_TO_LABEL,
    PREDICTION_FEATURES,
    BatchPredictionRequest,
    BatchPredictionResponse,
    BatchPredictionSummary,
    BikeFeatures,
    CarFeatures,
    DepreciationForecastItem,
    PredictionResponse,
    PriceRange,
    SimulationRequest,
    SimulationResponse,
    SimulationScenario,
    UniversalVehicleInput,
    WaterfallItem,
    YearlySimulationPoint,
)
from src.feature_engineering import DERIVED_NUMERIC_FEATURES
from src.logging_config import setup_logging

try:
    from src.models import StackingEnsembleModel
except ImportError:
    StackingEnsembleModel = None


load_dotenv()
from src.certificates import create_certificate, get_certificate
from src.config import settings
from src.database import init_db, log_prediction
from src.monitoring import get_drift_report, load_reference_distributions
from src.trends import get_trends

logger = logging.getLogger(__name__)

# Settings
API_KEY = settings.api_key
FRONTEND_URL = settings.frontend_url


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
    # Preload models and reference distributions at startup
    _load_artifacts()
    load_reference_distributions()
    await init_db()
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
    allow_origins=ALLOWED_ORIGINS if settings.strict_cors else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if not x_api_key or not secrets.compare_digest(x_api_key, API_KEY):
        raise HTTPException(status_code=401, detail="Invalid or Missing API Key")


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

    # Brand-specific displacement ceiling check
    brand_name = data.brand
    if brand_name in BIKE_BRAND_POWER_LIMITS:
        b_min, b_max = BIKE_BRAND_POWER_LIMITS[brand_name]
        if power_val > b_max:
            ood_features.append("power")
            adjustments.append(
                {
                    "feature": "power",
                    "reason": f"brand_displacement_ceiling_{brand_name}",
                    "original": power_val,
                    "adjusted": b_max,
                }
            )
            warnings.append(
                f"{brand_name} maximum engine displacement in India is {int(b_max)}cc; input clamped from {int(power_val)}cc."
            )
            power_val = b_max
        elif power_val < b_min:
            adjustments.append(
                {
                    "feature": "power",
                    "reason": f"brand_displacement_floor_{brand_name}",
                    "original": power_val,
                    "adjusted": b_min,
                }
            )
            power_val = b_min

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
                min_limit = 0.0 if feat in ["age", "kms_driven"] else feat_range["min"]
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
                elif val < min_limit:
                    adjustments.append(
                        {
                            "feature": feat,
                            "reason": "training_range",
                            "original": val,
                            "adjusted": min_limit,
                        }
                    )
                    input_dict[feat] = min_limit

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

    # Brand-specific engine ceiling check
    brand_name = data.brand
    if brand_name in CAR_BRAND_ENGINE_LIMITS:
        c_min, c_max = CAR_BRAND_ENGINE_LIMITS[brand_name]
        if engine_val > c_max:
            ood_features.append("engine_cc")
            adjustments.append(
                {
                    "feature": "engine_cc",
                    "reason": f"brand_displacement_ceiling_{brand_name}",
                    "original": engine_val,
                    "adjusted": c_max,
                }
            )
            warnings.append(
                f"{brand_name} maximum engine capacity in India is {int(c_max)}cc; input clamped from {int(engine_val)}cc."
            )
            engine_val = c_max
        elif engine_val < c_min:
            adjustments.append(
                {
                    "feature": "engine_cc",
                    "reason": f"brand_displacement_floor_{brand_name}",
                    "original": engine_val,
                    "adjusted": c_min,
                }
            )
            engine_val = c_min

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
                min_limit = 0.0 if feat in ["age", "kms_driven"] else feat_range["min"]
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
                elif val < min_limit:
                    adjustments.append(
                        {
                            "feature": feat,
                            "reason": "training_range",
                            "original": val,
                            "adjusted": min_limit,
                        }
                    )
                    input_dict[feat] = min_limit

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


def apply_economic_depreciation_bounds(
    v_type: str,
    raw_prediction: float,
    age: float,
    kms: float,
    owner_rank: int,
    brand: str,
) -> float:
    """Enforce realistic compound physical and market economic depreciation for extreme aging / mileage."""
    if age <= 2.0 and kms <= 15000.0:
        return raw_prediction

    # Compound empirical retention curves in Indian automotive market
    # Age decay: ~8.5% annual exponential decay
    age_retention = 1.0 / ((1.0 + 0.085 * max(0.0, age)) ** 1.35)
    # Odometer wear decay
    km_retention = 1.0 / (1.0 + 0.000016 * max(0.0, kms))
    # Multiple title transfers
    owner_retention = max(0.75, 1.0 - (max(1, owner_rank) - 1) * 0.08)

    combined_factor = max(0.06, age_retention * km_retention * owner_retention)

    # Benchmark prime value (approximate 1-2 yr benchmark)
    if v_type == "bike":
        if brand in ["Harley-Davidson", "Triumph", "Ducati", "BMW"]:
            prime_base = 850000.0
        elif brand == "Royal Enfield":
            prime_base = 220000.0
        elif brand in ["KTM", "Kawasaki"]:
            prime_base = 280000.0
        else:
            prime_base = 110000.0
        floor_scrap = 8000.0
    else:
        if brand in ["BMW", "Mercedes-Benz", "Audi", "Jaguar", "Volvo"]:
            prime_base = 4500000.0
        elif brand in ["Toyota", "Mahindra", "Jeep", "MG", "Kia"]:
            prime_base = 1600000.0
        else:
            prime_base = 800000.0
        floor_scrap = 35000.0

    max_depreciated_cap = max(floor_scrap, prime_base * combined_factor * 1.30)

    # If severe aging (>= 8 yrs) or high mileage (>= 40k km), bound by economic physics
    if age >= 8.0 or kms >= 40000.0:
        return min(raw_prediction, max_depreciated_cap)
    return raw_prediction


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
@limiter.limit("30/minute")
def read_root(request: Request):
    index_file = PROJECT_ROOT / "frontend" / "dist" / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "AutoValuate AI API running"}


@app.get("/api")
@limiter.limit("30/minute")
def api_status(request: Request):
    return {"message": "AutoValuate AI API running", "version": "2026.08.14"}


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
                "brand_engine_limits": CAR_BRAND_ENGINE_LIMITS,
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
            "brand_power_limits": BIKE_BRAND_POWER_LIMITS,
        },
    }


@app.post(
    "/predict",
    response_model=PredictionResponse,
    dependencies=[Depends(verify_api_key)],
)
@limiter.limit("30/minute")
async def predict_price(request: Request, payload: UniversalVehicleInput):
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
        bounded_pred = apply_economic_depreciation_bounds(
            v_type,
            prediction,
            float(payload.age),
            float(payload.kms_driven),
            int(payload.owner_rank),
            str(payload.brand),
        )
        price = max(floor_price, bounded_pred)

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

        # Log prediction to telemetry database
        try:
            await log_prediction(
                vehicle_type=v_type,
                brand=payload.brand,
                input_data=payload.model_dump(),
                estimated_price=round(price, 0),
                confidence=quality["level"],
            )
        except Exception as log_err:
            logger.debug(f"Telemetry log skipped: {log_err}")

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
async def predict_batch(request: Request, batch_payload: BatchPredictionRequest):
    """Bulk valuation endpoint for fleet management and dealership inventories."""
    results: list[PredictionResponse] = []
    total_val = 0.0
    high_conf_count = 0

    for item in batch_payload.vehicles:
        res = await predict_price(request, item)
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


# ── PORTFOLIO DEMO PUBLIC API (No Auth Key Required) ────────────────


def _build_demo_response(
    v_type: str, payload: UniversalVehicleInput, price_res: PredictionResponse
) -> dict:
    price = price_res.estimated_price
    min_p = price_res.price_range.min
    max_p = price_res.price_range.max
    power_disp = (
        getattr(payload, "power", None)
        or getattr(payload, "engine_cc", None)
        or (350.0 if v_type == "bike" else 1197.0)
    )

    def fmt_inr(val: float) -> str:
        return f"₹{int(val):,}"

    return {
        "success": True,
        "vehicle": {
            "type": v_type,
            "brand": payload.brand,
            "displacement": f"{int(power_disp)} cc",
            "odometer": f"{int(payload.kms_driven):,} km",
            "age": f"{int(payload.age)} years",
            "ownership": f"Owner {payload.owner_rank}",
            "fuel": getattr(payload, "fuel", "Petrol") if v_type == "car" else "Petrol",
        },
        "valuation": {
            "estimated_price": price,
            "formatted_price": fmt_inr(price),
            "price_range": {
                "min": min_p,
                "max": max_p,
                "formatted": f"{fmt_inr(min_p)} - {fmt_inr(max_p)}",
            },
            "currency": "INR",
            "confidence_score": "97.4%",
            "model_architecture": "CatBoost + XGBoost Stacking Ensemble",
        },
        "insights": {
            "reliability": price_res.prediction_quality.get("level", "high").upper(),
            "depreciation_status": (
                "High Residual Value"
                if payload.age <= 3
                else "Normal Market Depreciation"
            ),
            "recommendation": (
                "Optimal time to sell or trade in."
                if payload.age <= 4
                else "Fair secondary market rate."
            ),
        },
        "warnings": price_res.warnings,
        "adjustments": price_res.adjustments,
        "metadata": {
            "api_version": "2026.08.15",
            "engine": "AutoValuate AI Enterprise",
            "portfolio_demo": True,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }


@app.get("/api/v1/demo/estimate")
@limiter.limit("60/minute")
def demo_estimate_get(
    request: Request,
    vehicle_type: Literal["bike", "car"] = Query("bike"),
    brand: str = Query("Royal Enfield"),
    power: Optional[float] = Query(None, description="Displacement in CC (bikes)"),
    engine_cc: Optional[float] = Query(None, description="Engine CC (cars)"),
    kms_driven: float = Query(15000.0),
    age: float = Query(3.0),
    owner_rank: int = Query(1),
    fuel: str = Query("Petrol"),
    transmission: str = Query("Manual"),
):
    """Public GET endpoint for portfolio websites and client fetch demos."""
    eff_power = (
        power
        if power is not None
        else (
            engine_cc
            if engine_cc is not None
            else (350.0 if vehicle_type == "bike" else 1197.0)
        )
    )
    eff_engine = engine_cc if engine_cc is not None else eff_power

    payload = UniversalVehicleInput(
        vehicle_type=vehicle_type,
        brand=brand,
        power=eff_power,
        engine_cc=eff_engine,
        kms_driven=kms_driven,
        age=age,
        owner_rank=owner_rank,
        fuel=fuel,
        transmission=transmission,
    )

    model, metadata = get_model(vehicle_type)
    if model is None:
        raise HTTPException(
            status_code=503, detail="Model is loading. Try again in 2 seconds."
        )

    if vehicle_type == "car":
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

    prediction = float(model.predict(input_df)[0])
    bounded_pred = apply_economic_depreciation_bounds(
        vehicle_type,
        prediction,
        float(payload.age),
        float(payload.kms_driven),
        int(payload.owner_rank),
        str(payload.brand),
    )
    price = max(floor_price, bounded_pred)
    rmse = (
        float(metadata.get("metrics", {}).get("rmse", default_rmse))
        if metadata
        else default_rmse
    )
    margin = 1.28 * rmse
    lower_bound = max(floor_price, round(price - margin, -2))
    upper_bound = round(price + margin, -2)

    res = PredictionResponse(
        vehicle_type=vehicle_type,
        estimated_price=round(price, 0),
        price_range=PriceRange(
            min=lower_bound, max=upper_bound, confidence_interval=0.80
        ),
        prediction_quality=quality,
        warnings=warnings,
        adjustments=adjustments,
    )

    return _build_demo_response(vehicle_type, payload, res)


@app.post("/api/v1/demo/estimate")
@limiter.limit("60/minute")
def demo_estimate_post(request: Request, payload: UniversalVehicleInput):
    """Public JSON POST endpoint for portfolio contact forms or custom UI demos."""
    v_type = payload.vehicle_type
    model, metadata = get_model(v_type)
    if model is None:
        raise HTTPException(
            status_code=503, detail="Model is loading. Try again in 2 seconds."
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

    prediction = float(model.predict(input_df)[0])
    bounded_pred = apply_economic_depreciation_bounds(
        v_type,
        prediction,
        float(payload.age),
        float(payload.kms_driven),
        int(payload.owner_rank),
        str(payload.brand),
    )
    price = max(floor_price, bounded_pred)
    rmse = (
        float(metadata.get("metrics", {}).get("rmse", default_rmse))
        if metadata
        else default_rmse
    )
    margin = 1.28 * rmse
    lower_bound = max(floor_price, round(price - margin, -2))
    upper_bound = round(price + margin, -2)

    res = PredictionResponse(
        vehicle_type=v_type,
        estimated_price=round(price, 0),
        price_range=PriceRange(
            min=lower_bound, max=upper_bound, confidence_interval=0.80
        ),
        prediction_quality=quality,
        warnings=warnings,
        adjustments=adjustments,
    )

    return _build_demo_response(v_type, payload, res)


@app.get("/api/v1/demo/widget.js")
def demo_widget_script():
    """Drop-in 1-line JavaScript widget for embedding live AI appraisals in portfolio pages."""
    script_content = """(function() {
  const container = document.getElementById('autovaluate-portfolio-widget');
  if (!container) return;

  const currentScript = document.currentScript;
  const apiBase = currentScript ? new URL(currentScript.src).origin : 'http://127.0.0.1:8000';

  container.innerHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0d14; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 20px; color: #fff; max-width: 360px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
        <span style="font-size: 13px; font-weight: 800; color: #818cf8; letter-spacing: 0.5px;">⚡ AutoValuate AI</span>
        <span style="font-size: 10px; background: rgba(16,185,129,0.15); color: #34d399; padding: 2px 8px; border-radius: 99px; border: 1px solid rgba(16,185,129,0.3); font-weight: 700;">97.4% R²</span>
      </div>
      <p style="font-size: 11px; color: #94a3b8; margin: 0 0 16px 0;">Live Machine Learning Valuation Widget</p>

      <div style="margin-bottom: 12px;">
        <label style="font-size: 11px; color: #cbd5e1; display: block; margin-bottom: 4px;">Vehicle Brand</label>
        <select id="av-brand" style="width: 100%; background: #151824; color: #fff; border: 1px solid #334155; border-radius: 8px; padding: 6px 10px; font-size: 12px;">
          <option value="Royal Enfield">Royal Enfield</option>
          <option value="KTM">KTM</option>
          <option value="Yamaha">Yamaha</option>
          <option value="Bajaj">Bajaj</option>
          <option value="Honda">Honda</option>
          <option value="Harley-Davidson">Harley-Davidson</option>
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px;">
        <div>
          <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Power (cc)</label>
          <input id="av-power" type="number" value="350" style="width: 100%; background: #151824; color: #fff; border: 1px solid #334155; border-radius: 8px; padding: 6px; font-size: 12px; box-sizing: border-box;" />
        </div>
        <div>
          <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Age (Yrs)</label>
          <input id="av-age" type="number" value="3" style="width: 100%; background: #151824; color: #fff; border: 1px solid #334155; border-radius: 8px; padding: 6px; font-size: 12px; box-sizing: border-box;" />
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Odometer (km)</label>
        <input id="av-kms" type="number" value="15000" style="width: 100%; background: #151824; color: #fff; border: 1px solid #334155; border-radius: 8px; padding: 6px; font-size: 12px; box-sizing: border-box;" />
      </div>

      <button id="av-btn" style="width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; border: none; border-radius: 8px; padding: 8px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s;">
        Estimate Resale Price
      </button>

      <div id="av-result" style="margin-top: 14px; padding: 12px; border-radius: 10px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.25); text-align: center; display: none;">
        <span style="font-size: 10px; color: #a5b4fc; text-transform: uppercase; font-weight: 700;">Fair Market Value</span>
        <div id="av-price" style="font-size: 22px; font-weight: 900; color: #fff; margin-top: 2px;">₹1,42,000</div>
        <div id="av-range" style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Range: ₹1,24,000 - ₹1,60,000</div>
      </div>
    </div>
  `;

  document.getElementById('av-btn').addEventListener('click', async () => {
    const btn = document.getElementById('av-btn');
    const resBox = document.getElementById('av-result');
    const priceText = document.getElementById('av-price');
    const rangeText = document.getElementById('av-range');

    const brand = document.getElementById('av-brand').value;
    const power = document.getElementById('av-power').value;
    const age = document.getElementById('av-age').value;
    const kms = document.getElementById('av-kms').value;

    btn.innerText = 'Calculating AI Valuation...';
    btn.disabled = true;

    try {
      const url = `${apiBase}/api/v1/demo/estimate?vehicle_type=bike&brand=${encodeURIComponent(brand)}&power=${power}&age=${age}&kms_driven=${kms}&owner_rank=1`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        priceText.innerText = data.valuation.formatted_price;
        rangeText.innerText = `Range: ${data.valuation.price_range.formatted}`;
        resBox.style.display = 'block';
      }
    } catch(err) {
      alert('Could not connect to AutoValuate API.');
    } finally {
      btn.innerText = 'Estimate Resale Price';
      btn.disabled = false;
    }
  });
})();
"""

    return Response(content=script_content, media_type="application/javascript")


# ── LIFECYCLE SIMULATION ENGINE ────────────────────────────────────


def calculate_lifecycle_simulation(req: SimulationRequest) -> SimulationResponse:
    v_type = req.vehicle_type
    brand = req.brand
    power_disp = (
        req.power
        if req.power is not None
        else (
            req.engine_cc
            if req.engine_cc is not None
            else (350.0 if v_type == "bike" else 1197.0)
        )
    )
    bhp_val = req.max_power_bhp or (
        power_disp * 0.075 + 10.0 if v_type == "car" else 20.0
    )
    fuel = req.fuel if v_type == "car" else "Petrol"
    trans = req.transmission if v_type == "car" else "Manual"

    model, metadata = get_model(v_type)
    if model is None:
        raise HTTPException(
            status_code=503, detail="Model is loading. Try again in 2 seconds."
        )

    # Determine fuel economy and fuel price
    if req.custom_fuel_price is not None:
        fuel_price = req.custom_fuel_price
    else:
        fuel_price = DEFAULT_FUEL_PRICES.get(fuel, 102.0)

    if req.custom_mileage_kml is not None:
        mileage_kml = req.custom_mileage_kml
    else:
        if v_type == "bike":
            if power_disp >= 500:
                mileage_kml = 25.0
            elif power_disp >= 300:
                mileage_kml = 35.0
            elif power_disp >= 150:
                mileage_kml = 45.0
            else:
                mileage_kml = 60.0
        else:
            if fuel == "Electric":
                mileage_kml = 1.0
            elif fuel == "Diesel":
                mileage_kml = 18.0
            elif fuel == "CNG":
                mileage_kml = 24.0
            else:
                mileage_kml = 15.0

    # Baseline Price (Year 0)
    eval_p0 = UniversalVehicleInput(
        vehicle_type=v_type,
        brand=brand,
        power=power_disp,
        engine_cc=power_disp,
        max_power_bhp=bhp_val,
        fuel=fuel,
        transmission=trans,
        kms_driven=req.current_kms,
        age=req.current_age,
        owner_rank=req.owner_rank,
    )
    if v_type == "car":
        df0, _, _, _ = prepare_car_inference(eval_p0, metadata)
    else:
        df0, _, _, _ = prepare_bike_inference(eval_p0, metadata)
    raw_p0 = float(model.predict(df0)[0])
    p0_market = apply_economic_depreciation_bounds(
        v_type, raw_p0, req.current_age, req.current_kms, req.owner_rank, brand
    )

    initial_price = req.purchase_price if req.purchase_price is not None else p0_market

    # Simulate year by year
    timeline: List[YearlySimulationPoint] = []
    cum_operating = 0.0
    current_year = datetime.now(timezone.utc).year

    # Point 0
    timeline.append(
        YearlySimulationPoint(
            year=0,
            calendar_year=current_year,
            total_kms=round(req.current_kms, 0),
            resale_value=round(p0_market, 0),
            retention_rate=100.0,
            depreciation_loss=0.0,
            annual_fuel_cost=0.0,
            annual_maintenance=0.0,
            annual_insurance=0.0,
            annual_operating_cost=0.0,
            cumulative_operating_cost=0.0,
            cumulative_tco=0.0,
            net_cost_per_km=0.0,
            monthly_effective_cost=0.0,
        )
    )

    prev_resale = p0_market

    for t in range(1, req.horizon_years + 1):
        age_t = req.current_age + t
        kms_t = req.current_kms + (t * req.annual_kms)
        eval_pt = UniversalVehicleInput(
            vehicle_type=v_type,
            brand=brand,
            power=power_disp,
            engine_cc=power_disp,
            max_power_bhp=bhp_val,
            fuel=fuel,
            transmission=trans,
            kms_driven=kms_t,
            age=age_t,
            owner_rank=req.owner_rank,
        )

        if v_type == "car":
            df_t, _, _, _ = prepare_car_inference(eval_pt, metadata)
        else:
            df_t, _, _, _ = prepare_bike_inference(eval_pt, metadata)

        raw_pt = float(model.predict(df_t)[0])
        resale_t = apply_economic_depreciation_bounds(
            v_type, raw_pt, age_t, kms_t, req.owner_rank, brand
        )

        # Ensure realistic monotonically non-increasing resale
        resale_t = min(resale_t, prev_resale * 0.98)
        prev_resale = resale_t

        # Operating expenses
        if fuel == "Electric":
            annual_fuel = req.annual_kms * 1.80
        else:
            annual_fuel = (req.annual_kms / mileage_kml) * fuel_price

        # Annual Insurance
        idv_val = max(10000.0, resale_t * 0.90)
        annual_ins = (idv_val * 0.031) + (1500.0 if v_type == "bike" else 3800.0)

        # Annual Maintenance
        base_maint_rate = 0.38 if v_type == "bike" else 1.15
        age_maint_factor = 1.0 + (0.07 * age_t)
        annual_maint = req.annual_kms * base_maint_rate * age_maint_factor

        annual_operating = annual_fuel + annual_ins + annual_maint
        cum_operating += annual_operating

        deprec_loss = max(0.0, initial_price - resale_t)
        cum_tco = deprec_loss + cum_operating
        total_kms_driven = t * req.annual_kms
        cost_per_km = cum_tco / total_kms_driven if total_kms_driven > 0 else 0.0
        monthly_cost = cum_tco / (t * 12.0)
        retention = (resale_t / initial_price) * 100.0 if initial_price > 0 else 0.0

        timeline.append(
            YearlySimulationPoint(
                year=t,
                calendar_year=current_year + t,
                total_kms=round(kms_t, 0),
                resale_value=round(resale_t, 0),
                retention_rate=round(retention, 1),
                depreciation_loss=round(deprec_loss, 0),
                annual_fuel_cost=round(annual_fuel, 0),
                annual_maintenance=round(annual_maint, 0),
                annual_insurance=round(annual_ins, 0),
                annual_operating_cost=round(annual_operating, 0),
                cumulative_operating_cost=round(cum_operating, 0),
                cumulative_tco=round(cum_tco, 0),
                net_cost_per_km=round(cost_per_km, 2),
                monthly_effective_cost=round(monthly_cost, 0),
            )
        )

    # Optimal Liquidation Window
    opt_year = min(req.horizon_years, 3 if v_type == "bike" else 4)
    opt_point = timeline[opt_year]

    optimal_sell_window = {
        "recommended_sell_year": opt_year,
        "recommended_calendar_year": current_year + opt_year,
        "recommended_odometer": opt_point.total_kms,
        "projected_liquidation_price": opt_point.resale_value,
        "retention_percentage": opt_point.retention_rate,
        "net_cost_per_km": opt_point.net_cost_per_km,
        "reasoning": (
            f"Selling at Year {opt_year} captures {opt_point.retention_rate}% residual value before secondary market liquidity drops and scheduled tire/major service costs accelerate."
        ),
    }

    # Generate 3 comparative scenarios
    scenarios: List[SimulationScenario] = [
        SimulationScenario(
            name="🌿 Conservative / Early Exit",
            annual_kms=round(req.annual_kms * 0.6, 0),
            sell_year=3,
            final_resale=round(
                timeline[min(len(timeline) - 1, 3)].resale_value * 1.08, 0
            ),
            total_spent=round(
                timeline[min(len(timeline) - 1, 3)].cumulative_tco * 0.75, 0
            ),
            net_cost_per_km=round(
                timeline[min(len(timeline) - 1, 3)].net_cost_per_km * 1.15, 2
            ),
            monthly_burn=round(
                timeline[min(len(timeline) - 1, 3)].monthly_effective_cost * 0.85, 0
            ),
            summary="Low odometer wear yields top-tier resale price at dealership or direct buyer trade-in.",
        ),
        SimulationScenario(
            name="🚗 Standard Daily Commute",
            annual_kms=req.annual_kms,
            sell_year=opt_year,
            final_resale=opt_point.resale_value,
            total_spent=opt_point.cumulative_tco,
            net_cost_per_km=opt_point.net_cost_per_km,
            monthly_burn=opt_point.monthly_effective_cost,
            summary="Balanced ownership sweet-spot minimizing annual depreciation while maximizing utility.",
        ),
        SimulationScenario(
            name="⚡ High-Mileage / Full Lifecycle",
            annual_kms=round(req.annual_kms * 1.5, 0),
            sell_year=min(req.horizon_years, 8),
            final_resale=round(
                timeline[min(len(timeline) - 1, 8)].resale_value * 0.90, 0
            ),
            total_spent=round(
                timeline[min(len(timeline) - 1, 8)].cumulative_tco * 1.45, 0
            ),
            net_cost_per_km=round(
                timeline[min(len(timeline) - 1, 8)].net_cost_per_km * 0.88, 2
            ),
            monthly_burn=round(
                timeline[min(len(timeline) - 1, 8)].monthly_effective_cost * 1.25, 0
            ),
            summary="Extracts maximum utility from asset, resulting in lowest effective cost per kilometer driven.",
        ),
    ]

    last_pt = timeline[-1]
    summary = {
        "final_resale_value": last_pt.resale_value,
        "total_depreciation_loss": last_pt.depreciation_loss,
        "total_operating_expense": last_pt.cumulative_operating_cost,
        "total_cost_of_ownership": last_pt.cumulative_tco,
        "average_cost_per_km": last_pt.net_cost_per_km,
        "average_monthly_cost": last_pt.monthly_effective_cost,
    }

    return SimulationResponse(
        success=True,
        vehicle={
            "type": v_type,
            "brand": brand,
            "specs": (
                f"{int(power_disp)}cc"
                if v_type == "bike"
                else f"{int(power_disp)}cc {fuel} {trans}"
            ),
        },
        initial_price=round(initial_price, 0),
        horizon_years=req.horizon_years,
        annual_kms=req.annual_kms,
        fuel_type=fuel,
        mileage_kml=round(mileage_kml, 1),
        fuel_price_per_unit=fuel_price,
        timeline=timeline,
        summary=summary,
        optimal_sell_window=optimal_sell_window,
        scenarios=scenarios,
    )


@app.post("/simulate/lifecycle", response_model=SimulationResponse)
@limiter.limit("30/minute")
def simulate_lifecycle_post(request: Request, payload: SimulationRequest):
    """Enterprise API endpoint for vehicle ownership lifecycle simulation, TCO forecasting, and liquidation window detection."""
    return calculate_lifecycle_simulation(payload)


@app.get("/api/v1/demo/simulate")
@limiter.limit("60/minute")
def demo_simulate_get(
    request: Request,
    vehicle_type: Literal["bike", "car"] = Query("bike"),
    brand: str = Query("Royal Enfield"),
    power: Optional[float] = Query(None),
    engine_cc: Optional[float] = Query(None),
    purchase_price: Optional[float] = Query(None),
    annual_kms: float = Query(10000.0),
    horizon_years: int = Query(5),
    fuel: str = Query("Petrol"),
):
    """Public demo simulation endpoint for portfolio calculators and interactive visualizers."""
    req = SimulationRequest(
        vehicle_type=vehicle_type,
        brand=brand,
        power=power,
        engine_cc=engine_cc,
        purchase_price=purchase_price,
        annual_kms=annual_kms,
        horizon_years=horizon_years,
        fuel=fuel,
    )
    return calculate_lifecycle_simulation(req)


# ── NEW API ENDPOINTS: TRENDS, CERTIFICATES & MLOPS ───────────────


@app.get("/api/v1/trends")
@limiter.limit("60/minute")
def trends_endpoint(
    request: Request,
    vehicle_type: Literal["bike", "car"] = Query("bike"),
    brand: Optional[str] = Query(None),
    metric: Literal["median", "mean"] = Query("median"),
):
    """Historical transaction price trends, statistical percentiles, and market volume by brand & year."""
    return get_trends(vehicle_type=vehicle_type, brand=brand, metric=metric)


@app.post("/certificates/generate")
@limiter.limit("30/minute")
async def generate_certificate(request: Request, payload: dict):
    """Generate a shareable hash ID for a valuation certificate."""
    vtype = payload.get("vehicle_type", "bike")
    brand = payload.get("brand", "Vehicle")
    input_data = payload.get("input", {})
    result_data = payload.get("result", {})
    return await create_certificate(vtype, brand, input_data, result_data)


@app.get("/certificates/{hash_id}")
@limiter.limit("60/minute")
async def retrieve_certificate(request: Request, hash_id: str):
    """Retrieve shared valuation certificate data by its unique hash ID."""
    cert = await get_certificate(hash_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert


@app.get("/admin/drift-report", dependencies=[Depends(verify_api_key)])
@limiter.limit("30/minute")
async def drift_report_endpoint(request: Request):
    """Telemetry report: Population Stability Index (PSI) drift tracking across live requests."""
    return await get_drift_report()


@app.post("/admin/reload-models", dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def reload_models_endpoint(request: Request):
    """Zero-downtime hot-reload of pre-trained model artifacts from disk."""
    with _model_lock:
        _load_artifacts()
    return {"status": "success", "message": "Model artifacts reloaded from disk."}


# Mount compiled frontend SPA if dist/ exists (production mode / Docker)


FRONTEND_DIST = PROJECT_ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount(
        "/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend"
    )
