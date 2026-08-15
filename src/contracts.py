"""Shared inference/training contract constants and schemas for Bikes and Cars.

These constants and Pydantic models keep field names, accepted ranges, schemas,
and owner mappings consistent across preprocessing, API validation, CLI inference,
and tests.
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional, Tuple

from pydantic import BaseModel, Field, field_validator

# Supported vehicle types
VEHICLE_TYPES: Tuple[str, ...] = ("bike", "car")


def normalize_vehicle_type_str(v: Any) -> str:
    """Normalize vehicle type strings, accepting legacy and alias terms.

    Supports 'motorcycle', '2-wheeler', 'passenger_car', 'automobile', etc.
    """
    if not isinstance(v, str):
        return "bike"
    clean = v.strip().lower().replace("-", "_").replace(" ", "_").replace("/", "_")
    if clean in (
        "car",
        "cars",
        "automobile",
        "passenger_car",
        "four_wheeler",
        "4_wheeler",
        "4wheeler",
        "sedan",
        "suv",
        "hatchback",
    ):
        return "car"
    return "bike"


# Annual usage estimates for forecasting
ANNUAL_KM_BIKE: float = 6000.0
ANNUAL_KM_CAR: float = 12000.0
BATCH_PREDICT_MAX_ITEMS: int = 50

# ── BIKE CONSTANTS (Backwards Compatible) ──────────────────────────
POWER_MIN: float = 50.0
POWER_MAX: float = 2500.0
KMS_MIN: float = 0.0
KMS_MAX: float = 999999.0
AGE_MIN: float = 0.0
AGE_MAX: float = 50.0
OWNER_RANK_MIN: int = 1
OWNER_RANK_MAX: int = 5

BIKE_POWER_MIN: float = POWER_MIN
BIKE_POWER_MAX: float = POWER_MAX
BIKE_KMS_MIN: float = KMS_MIN
BIKE_KMS_MAX: float = KMS_MAX
BIKE_AGE_MIN: float = AGE_MIN
BIKE_AGE_MAX: float = AGE_MAX

BIKE_BRANDS: List[str] = [
    "Bajaj",
    "Benelli",
    "BMW",
    "Ducati",
    "Harley-Davidson",
    "Hero",
    "Honda",
    "Hyosung",
    "Jawa",
    "Kawasaki",
    "KTM",
    "Mahindra",
    "Royal Enfield",
    "Suzuki",
    "Triumph",
    "TVS",
    "Yamaha",
    "Yezdi",
]

BIKE_BRAND_POWER_LIMITS: Dict[str, Tuple[float, float]] = {
    "Bajaj": (100.0, 400.0),
    "Benelli": (250.0, 1130.0),
    "BMW": (310.0, 1250.0),
    "Ducati": (796.0, 1300.0),
    "Harley-Davidson": (440.0, 1800.0),
    "Hero": (97.0, 225.0),
    "Honda": (100.0, 1000.0),
    "Hyosung": (250.0, 650.0),
    "Jawa": (293.0, 334.0),
    "Kawasaki": (250.0, 1400.0),
    "KTM": (125.0, 390.0),
    "Mahindra": (110.0, 300.0),
    "Royal Enfield": (350.0, 650.0),
    "Suzuki": (110.0, 1340.0),
    "Triumph": (400.0, 2500.0),
    "TVS": (99.0, 312.0),
    "Yamaha": (110.0, 1000.0),
    "Yezdi": (250.0, 334.0),
}

# ── CAR CONSTANTS ──────────────────────────────────────────────────
CAR_ENGINE_MIN: float = 600.0
CAR_ENGINE_MAX: float = 5000.0
CAR_BHP_MIN: float = 30.0
CAR_BHP_MAX: float = 500.0
CAR_KMS_MIN: float = 0.0
CAR_KMS_MAX: float = 999999.0
CAR_AGE_MIN: float = 0.0
CAR_AGE_MAX: float = 35.0

CAR_BRAND_ENGINE_LIMITS: Dict[str, Tuple[float, float]] = {
    "Maruti": (793.0, 1590.0),
    "Hyundai": (814.0, 2359.0),
    "Tata": (624.0, 2956.0),
    "Mahindra": (909.0, 2696.0),
    "Toyota": (1197.0, 2982.0),
    "Honda": (1198.0, 2997.0),
    "Ford": (999.0, 3198.0),
    "Renault": (799.0, 1997.0),
    "Volkswagen": (999.0, 1968.0),
    "Skoda": (1198.0, 1968.0),
    "Nissan": (1198.0, 2496.0),
    "Datsun": (799.0, 1198.0),
    "MG": (1451.0, 1996.0),
    "Kia": (1493.0, 2199.0),
    "Jeep": (1368.0, 3604.0),
    "Audi": (1781.0, 2967.0),
    "BMW": (1995.0, 2993.0),
    "Mercedes-Benz": (1595.0, 3498.0),
    "Jaguar": (1999.0, 2993.0),
    "Volvo": (1969.0, 2400.0),
    "Chevrolet": (995.0, 1991.0),
    "Fiat": (1172.0, 1598.0),
}

CAR_FUEL_TYPES: List[str] = ["Petrol", "Diesel", "CNG", "Electric"]
CAR_TRANSMISSION_TYPES: List[str] = ["Manual", "Automatic"]

CAR_BRANDS: List[str] = [
    "Audi",
    "BMW",
    "Chevrolet",
    "Datsun",
    "Fiat",
    "Ford",
    "Honda",
    "Hyundai",
    "Jaguar",
    "Jeep",
    "Kia",
    "Mahindra",
    "Maruti",
    "Mercedes-Benz",
    "MG",
    "Nissan",
    "Renault",
    "Skoda",
    "Tata",
    "Toyota",
    "Volkswagen",
    "Volvo",
]

# ── OWNER MAPPINGS ─────────────────────────────────────────────────
OWNER_RANK_TO_LABEL: Dict[int, str] = {
    1: "First Owner",
    2: "Second Owner",
    3: "Third Owner",
    4: "Fourth Owner",
    5: "Fourth Owner Or More",
}

OWNER_LABEL_TO_RANK: Dict[str, int] = {
    "First Owner": 1,
    "Second Owner": 2,
    "Third Owner": 3,
    "Fourth Owner": 4,
    "Fourth & Above Owner": 4,
    "Fourth Owner Above": 5,
    "Fourth Owner Or More": 5,
    "Test Drive Car": 1,
}

# Feature sets
PREDICTION_FEATURES: Tuple[str, ...] = (
    "brand",
    "owner",
    "kms_driven",
    "age",
    "power",
    "owner_rank",
)

BIKE_PREDICTION_FEATURES: Tuple[str, ...] = PREDICTION_FEATURES

CAR_PREDICTION_FEATURES: Tuple[str, ...] = (
    "brand",
    "fuel",
    "transmission",
    "engine_cc",
    "max_power_bhp",
    "age",
    "kms_driven",
    "owner_rank",
)

# ── SIMULATION & TCO CONSTANTS ─────────────────────────────────────
DEFAULT_FUEL_PRICES: Dict[str, float] = {
    "Petrol": 102.0,
    "Diesel": 89.0,
    "CNG": 75.0,
    "Electric": 1.8,
}

DEFAULT_MILEAGE_KML: Dict[str, float] = {
    "bike": 45.0,
    "car_petrol": 16.0,
    "car_diesel": 20.0,
    "car_cng": 24.0,
    "car_electric": 1.0,
}


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

    @field_validator("vehicle_type", mode="before")
    @classmethod
    def normalize_vtype(cls, v):
        return normalize_vehicle_type_str(v)


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


# ── LIFECYCLE SIMULATION SCHEMAS ───────────────────────────────────


class SimulationRequest(BaseModel):
    vehicle_type: Literal["bike", "car"] = "bike"
    brand: str = Field(..., json_schema_extra={"example": "Royal Enfield"})
    power: Optional[float] = Field(None, json_schema_extra={"example": 350.0})
    engine_cc: Optional[float] = Field(None, json_schema_extra={"example": 1197.0})
    max_power_bhp: Optional[float] = Field(None, json_schema_extra={"example": 82.0})
    fuel: str = Field("Petrol", json_schema_extra={"example": "Petrol"})
    transmission: str = Field("Manual", json_schema_extra={"example": "Manual"})
    purchase_price: Optional[float] = Field(
        None, description="Purchase price or original showroom price (INR)"
    )
    current_age: float = Field(0.0, ge=0.0, le=25.0)
    current_kms: float = Field(0.0, ge=0.0, le=500000.0)
    owner_rank: int = Field(1, ge=1, le=5)
    horizon_years: int = Field(5, ge=1, le=10)
    annual_kms: float = Field(10000.0, ge=1000.0, le=60000.0)
    custom_fuel_price: Optional[float] = Field(None, ge=1.0, le=300.0)
    custom_mileage_kml: Optional[float] = Field(None, ge=1.0, le=100.0)

    @field_validator("vehicle_type", mode="before")
    @classmethod
    def normalize_vtype(cls, v):
        return normalize_vehicle_type_str(v)


class YearlySimulationPoint(BaseModel):
    year: int
    calendar_year: int
    total_kms: float
    resale_value: float
    retention_rate: float
    depreciation_loss: float
    annual_fuel_cost: float
    annual_maintenance: float
    annual_insurance: float
    annual_operating_cost: float
    cumulative_operating_cost: float
    cumulative_tco: float
    net_cost_per_km: float
    monthly_effective_cost: float


class SimulationScenario(BaseModel):
    name: str
    annual_kms: float
    sell_year: int
    final_resale: float
    total_spent: float
    net_cost_per_km: float
    monthly_burn: float
    summary: str


class SimulationResponse(BaseModel):
    success: bool = True
    vehicle: dict
    initial_price: float
    horizon_years: int
    annual_kms: float
    fuel_type: str
    mileage_kml: float
    fuel_price_per_unit: float
    timeline: List[YearlySimulationPoint]
    summary: dict
    optimal_sell_window: dict
    scenarios: List[SimulationScenario]
