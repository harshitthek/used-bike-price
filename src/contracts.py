"""Shared inference/training contract constants for Bikes and Cars.

These constants keep field names, accepted ranges, and owner mappings
consistent across preprocessing, API validation, and CLI inference.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

# Supported vehicle types
VEHICLE_TYPES: Tuple[str, ...] = ("bike", "car")

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
