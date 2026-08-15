# 🏎️ Frontend — AutoValuate AI Studio

High-performance, luxury automotive valuation, lifecycle simulation, and MLOps telemetry single-page application built with **React 19**, **Tailwind CSS v4**, **Framer Motion**, and **Vite**.

---

## 🚀 View Modes & Features

1. **⚡ Single Vehicle Valuation & Pro Analytics**: Instant fair market appraisals, statistical confidence bands ($\pm 1.28 \times \text{RMSE}$), 5-year forward depreciation forecasts, marginal waterfall value drivers, and local storage history.
2. **⚖️ Side-by-Side Vehicle Comparison**: Multi-class comparative analytics evaluating two different vehicles concurrently (motorcycles vs. passenger cars) with fuel and transmission configurations.
3. **🎮 Ownership Lifecycle & TCO Simulator**: Real-time animated vehicle stage with procedural SVG rendering, Web Audio engine sound synthesis, weather environments, cumulative operating costs, and AI-detected optimal liquidation sweet-spots.
4. **📦 Fleet Batch Appraisal**: Enterprise bulk inventory appraisal evaluating up to 50 assets simultaneously with live total fleet valuation summaries.
5. **📈 Market Price Trends**: Aggregated historical transaction percentiles (P25, Median, P75) across model manufacture years with interactive SVG market band charts.
6. **🛡️ MLOps Telemetry & Drift Operations**: Real-time Population Stability Index (PSI) monitoring, inference request telemetry, and zero-downtime hot reloading of serialized models.
7. **📜 Pure Vector PDF Valuation Certificate**: High-speed, in-memory vector PDF generator (`jsPDF`) producing official inspection certificates in $<5\text{ms}$ with deterministic certificate IDs and multi-browser download fallbacks.

---

## 🛠️ Development, Testing & Build

```bash
# 1. Install dependencies
npm install

# 2. Run Vitest Unit Test Suite (44 passed tests across 17 suites)
npm test

# 3. Start local Vite development server
npm run dev

# 4. Compile optimized production bundle
npm run build
```

---

## ⚙️ Environment Variables & Backward Compatibility

| Environment Variable | Description | Default Fallback |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL of the FastAPI backend service | `http://127.0.0.1:8000` |
| `VITE_API_URL` | Supported alias for backend base URL | `http://127.0.0.1:8000` |
| `VITE_API_KEY` | Header (`x-api-key`) for authenticated routes | `dev_12345` |
| `VITE_ADMIN_KEY` | Admin operations key | `dev_12345` |

*Storage Compatibility*: The frontend automatically migrates legacy localStorage valuation history (`motovalue_history`, `used_vehicle_history`) to `autovaluate_history` on launch without data loss.

---

## 📑 Request Schemas

### Motorcycle Valuation
```json
{
  "vehicle_type": "bike",
  "brand": "Royal Enfield",
  "power": 350,
  "kms_driven": 15000,
  "age": 3,
  "owner_rank": 1
}
```

### Passenger Car Valuation
```json
{
  "vehicle_type": "car",
  "brand": "Maruti",
  "fuel": "Petrol",
  "transmission": "Manual",
  "engine_cc": 1197,
  "max_power_bhp": 82,
  "kms_driven": 35000,
  "age": 4,
  "owner_rank": 1
}
```
