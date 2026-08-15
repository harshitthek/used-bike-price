# 🏎️ Frontend — AutoValuate AI Studio

High-performance, luxury automotive valuation and lifecycle simulation single-page application built with **React 19**, **Tailwind CSS v4**, **Framer Motion**, and **Vite**.

---

## 🚀 View Modes & Features

1. **🏎️ Single Vehicle Valuation & Pro Analytics**: Instant fair market appraisals, statistical confidence bands ($\pm 1.28 \times \text{RMSE}$), 5-year forward depreciation forecasts, and waterfall value drivers.
2. **⚖️ Side-by-Side Vehicle Comparison**: Comparative analytics evaluating two different vehicles concurrently to identify superior value retention.
3. **🎮 Ownership Lifecycle & TCO Simulator**: Real-time animated vehicle stage with procedural SVG rendering, Web Audio engine sound synthesis, weather environments, cumulative operating costs, and optimal liquidation windows.
4. **📦 Fleet Batch Appraisal**: Enterprise bulk appraisal evaluating up to 50 assets simultaneously.
5. **📜 PDF Valuation Certificate**: 1-click official valuation certificate generation.

---

## 🛠️ Development & Build

```bash
# Install dependencies
npm install

# Start local Vite development server
npm run dev

# Compile optimized production bundle
npm run build
```

---

## ⚙️ Environment Variables

- `VITE_API_BASE_URL`: Base URL of the FastAPI backend (default: `http://127.0.0.1:8000`)
- `VITE_API_KEY`: API key header (`x-api-key`) for authenticated routes (default fallback: `dev_12345`)

Copy the template:
```bash
cp .env.example .env  # Linux/macOS
copy .env.example .env  # Windows
```

---

## 📑 Request Payloads

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
