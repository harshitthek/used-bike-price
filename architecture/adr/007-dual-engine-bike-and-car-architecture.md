# ADR 007: Dual-Engine Vehicle Architecture (Bikes & Cars)

## Status
Accepted

## Context
Originally, the platform provided resale valuation exclusively for used motorcycles. As the scope expanded to address the broader Indian used vehicle market, we required support for both motorcycles and passenger cars.

Cars and motorcycles have fundamentally different feature spaces:
- **Motorcycles** depend heavily on engine displacement (cc), owner rank, and 2-wheeler brands (Royal Enfield, KTM, Yamaha).
- **Cars** depend on fuel type (Petrol, Diesel, CNG, Electric), transmission (Manual, Automatic), horsepower (bhp), displacement (cc), and passenger vehicle brands (Maruti, Hyundai, Tata, Mahindra, Toyota).

Attempting to force both vehicle types into a single monolithic model would cause high sparsity in one-hot encodings and introduce domain confusion across pricing scales.

## Decision
We adopted a **Specialized Dual-Engine Architecture**:
1. **Separated Pipeline Artifacts**:
   - `models/best_model.joblib` + `models/best_model.metadata.json` for motorcycles.
   - `models/car_model.joblib` + `models/car_model.metadata.json` for passenger cars.
2. **Unified API Gateway Routing**:
   - The FastAPI backend routes requests based on `vehicle_type: "bike" | "car"`.
   - Each engine performs vehicle-specific Out-of-Distribution (OOD) checks and bounded clamping against its own metadata.
   - Computes statistical valuation intervals ($\pm 1.28 \times \text{RMSE}$) for 80% confidence ranges.
3. **Adaptive Frontend UI**:
   - The React frontend provides a seamless vehicle mode toggle (Motorcycles 🏍️ | Cars 🚗).
   - Dynamically renders fuel/transmission controls and presets tailored to the active vehicle category.

## Consequences
- **Positive**: Preserves 100% backward compatibility for motorcycle prediction while achieving 92.0% accuracy ($R^2 = 0.920$) on real Indian cars.
- **Positive**: Clean separation of statistical boundaries, presets, and domain-specific feature validation.
- **Negative**: Requires maintaining two model artifacts in memory (both lazy-loaded).
