"""Shared inference/training contract constants for Bikes and Cars.

These constants keep field names, accepted ranges, and owner mappings
consistent across preprocessing, API validation, and CLI inference.
"""

from __future__ import annotations

from typing import Dict, List, Tuple

# Supported vehicle types
VEHICLE_TYPES: Tuple[str, ...] = ("bike", "car")

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
]

# ── CAR CONSTANTS ──────────────────────────────────────────────────
CAR_ENGINE_MIN: float = 600.0
CAR_ENGINE_MAX: float = 5000.0
CAR_BHP_MIN: float = 30.0
CAR_BHP_MAX: float = 500.0
CAR_KMS_MIN: float = 0.0
CAR_KMS_MAX: float = 999999.0
CAR_AGE_MIN: float = 0.0
CAR_AGE_MAX: float = 35.0

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
