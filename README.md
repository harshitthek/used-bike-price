<div align="center">

# 🏎️ AutoValuate AI — Enterprise Vehicle Valuation Suite

### *High-Precision Machine Learning Resale Intelligence for Motorcycles & Passenger Cars in India*

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![CatBoost](https://img.shields.io/badge/CatBoost-1.2.10-FFCC00?style=for-the-badge&logo=yandex&logoColor=black)](https://catboost.ai)
[![XGBoost](https://img.shields.io/badge/XGBoost-3.2.0-EB5424?style=for-the-badge&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Test Suite](https://img.shields.io/badge/Pytest-26%20Passing-brightgreen?style=for-the-badge&logo=pytest&logoColor=white)](tests/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>A full-stack, enterprise-grade automotive resale intelligence and asset valuation platform.</b><br>
  Trained on over <b>40,000+ authentic Indian vehicle transactions</b> across 23+ manufacturers.<br>
  Delivers high-precision fair market appraisals, statistical confidence bands, 5-year depreciation forecasts, explainable value drivers, instant PDF inspection certificates, and public portfolio demo endpoints.
</p>

[Explore Web App](http://localhost:5174) • [Swagger API Docs](http://127.0.0.1:8000/docs) • [Portfolio Integration Guide](PORTFOLIO_INTEGRATION.md) • [Architecture Guide](APPROACH.md) • [Report Issue](https://github.com/harshitthek/used-bike-price/issues)

---

</div>

## 🌟 Key Highlights & Engineering Features

<table>
  <tr>
    <td width="50%">
      <h3>🏎️ Dual-Engine Stacking ML</h3>
      Dedicated gradient-boosted ensembles combining <b>CatBoost</b> and <b>XGBoost</b> with native categorical brand embeddings, achieving <b>97.4% R² on motorcycles</b> and <b>97.3% R² on passenger cars</b>.
    </td>
    <td width="50%">
      <h3>🌐 Public Portfolio Demo API</h3>
      Zero-configuration public REST endpoints (<code>GET/POST /api/v1/demo/estimate</code>) and a <b>1-line drop-in JS widget</b> with wildcard CORS for seamless embedding into personal portfolio sites.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📐 Real-Market Economic Physics</h3>
      Empirical multi-stage compound depreciation curves, manufacturer displacement boundaries, multi-owner discount penalties, and scrap salvage asymptote floors.
    </td>
    <td width="50%">
      <h3>📊 Statistical Confidence Bands</h3>
      Computes rigorous 80% confidence interval price intervals derived from empirical test set residual standard errors ($\pm 1.28 \times \text{RMSE}$): <i>Wholesale Trade-in, Fair Market, Dealer Retail High</i>.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📈 5-Year Forward Resale Forecast</h3>
      Simulates progressive vehicle aging ($t \in [0..5]$ yrs) and odometer usage ($+6\text{k km/yr}$ bikes, $+12\text{k km/yr}$ cars) with custom interactive bezier curve visualizations.
    </td>
    <td width="50%">
      <h3>🔍 Value Drivers Waterfall Breakdown</h3>
      Transparent marginal explainability ($+₹ / -₹$) isolating power premiums, model year depreciation, odometer wear, ownership history, and manufacturer prestige.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🎮 Car & Bike Lifecycle & TCO Simulator</h3>
      Interactive multi-year financial simulator computing cumulative fuel/charging, insurance, scheduled maintenance, <b>Net Cost per KM (₹/km)</b>, and <b>AI-Powered Optimal Liquidation Sweet-Spot</b>.
    </td>
    <td width="50%">
      <h3>📜 1-Click PDF Valuation Certificate</h3>
      Client-side vector PDF generation engine (<code>html2pdf.js</code>) creating official verification certificates with verification ID, vehicle specs, and 5-year depreciation schedules.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📈 5-Year Forward Resale Forecast</h3>
      Simulates progressive vehicle aging ($t \in [0..5]$ yrs) and odometer usage ($+6\text{k km/yr}$ bikes, $+12\text{k km/yr}$ cars) with custom interactive bezier curve visualizations.
    </td>
    <td width="50%">
      <h3>🐳 Production Docker & Compose</h3>
      Multi-stage production build (<code>node:20-alpine</code> compilation $\to$ <code>python:3.11-slim</code> runtime with OpenMP acceleration) serving both API and SPA from a single port.
    </td>
  </tr>
</table>

---

## 🌐 Public Portfolio Demo API & Embeddable Widget

You can showcase live automotive machine learning appraisals directly on your personal portfolio website with **zero configuration and no API keys required**.

### Option 1: 1-Line Drop-in HTML Widget (Easiest)
Paste this into any HTML or Markdown page on your portfolio:

```html
<!-- 1. The container where the widget renders -->
<div id="autovaluate-portfolio-widget"></div>

<!-- 2. AutoValuate live widget script -->
<script src="http://127.0.0.1:8000/api/v1/demo/widget.js"></script>
```

---

### Option 2: JavaScript `fetch()` (Vanilla JS / Next.js / Vue)

```javascript
async function getLiveValuation() {
  const query = new URLSearchParams({
    vehicle_type: 'bike',        // 'bike' or 'car'
    brand: 'Royal Enfield',
    power: '350',                // Engine CC
    kms_driven: '15000',
    age: '3',                    // Years
    owner_rank: '1'              // 1 = 1st Owner
  });

  const res = await fetch(`http://127.0.0.1:8000/api/v1/demo/estimate?${query}`);
  const data = await res.json();

  console.log("Estimated Price:", data.valuation.formatted_price); // "₹1,42,000"
  console.log("Price Range:", data.valuation.price_range.formatted); // "₹1,24,000 - ₹1,60,000"
  console.log("Model Accuracy:", data.valuation.confidence_score); // "97.4%"
}
```

---

### Option 3: React Component

```tsx
import React, { useState } from 'react';

export function PortfolioValuationWidget() {
  const [brand, setBrand] = useState('Royal Enfield');
  const [power, setPower] = useState(350);
  const [age, setAge] = useState(3);
  const [kms, setKms] = useState(15000);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        vehicle_type: 'bike',
        brand,
        power: String(power),
        age: String(age),
        kms_driven: String(kms),
        owner_rank: '1'
      });
      const res = await fetch(`http://127.0.0.1:8000/api/v1/demo/estimate?${q}`);
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white max-w-sm">
      <h3 className="text-sm font-bold text-indigo-400">⚡ AutoValuate AI Live Demo</h3>
      <p className="text-xs text-slate-400 mb-4">97.4% R² Stacking Ensemble ML</p>
      
      {/* Controls */}
      <button 
        onClick={calculate}
        disabled={loading}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold transition-all"
      >
        {loading ? 'Evaluating...' : 'Predict Fair Resale'}
      </button>

      {result && (
        <div className="mt-4 p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-center">
          <p className="text-2xl font-black">{result.valuation.formatted_price}</p>
          <p className="text-[10px] text-slate-400">{result.valuation.price_range.formatted}</p>
        </div>
      )}
    </div>
  );
}
```

*For complete endpoint parameters and response schemas, see [**`PORTFOLIO_INTEGRATION.md`**](PORTFOLIO_INTEGRATION.md).*

---

## 📐 Real-Market Valuation Physics & Economic Bounds

Standard gradient-boosted tree regressors can suffer from out-of-distribution leaf routing when evaluating extreme inputs (e.g. 30-year-old vehicle or anomalous displacement entries). AutoValuate AI integrates a **hybrid physics-based econometric envelope**:

```mermaid
graph TD
    RawInput[Raw User Input] --> BrandGuard[1. Brand Displacement Ceiling Check]
    BrandGuard --> TreeEnsemble[2. CatBoost + XGBoost Stacking Ensemble]
    TreeEnsemble --> EconBounds[3. Multi-Stage Econometric Depreciation Envelope]
    
    subgraph Econometric Envelope
        AgeDecay["Age Decay: 1 / (1 + 0.085 * age)^1.35"]
        KmDecay["Odometer Decay: 1 / (1 + 0.000016 * kms)"]
        OwnerPenalty["Owner Penalty: 1 - (owner_rank - 1) * 0.08"]
        ScrapFloor["Salvage Scrap Asymptote Floor: ~₹8,000 - ₹25,000"]
    end

    EconBounds --> AgeDecay & KmDecay & OwnerPenalty & ScrapFloor
    AgeDecay & KmDecay & OwnerPenalty & ScrapFloor --> CertifiedOutput[Certified Fair Market Valuation]
```

### Empirical Formulation:
1. **Manufacturer Displacement Envelopes**: Enforces physical manufacturer displacement limits (e.g. Royal Enfield: $350 - 650\text{ cc}$, Hero: $97 - 225\text{ cc}$, Triumph: $400 - 2500\text{ cc}$) with transparent adjustment reporting.
2. **Compound Retention Formula**:
   $$\text{Retention Factor} = \max\left(0.06, \; \frac{1}{(1 + 0.085 \cdot \text{Age})^{1.35}} \times \frac{1}{1 + 0.000016 \cdot \text{Kms}} \times \left[1 - 0.08 \cdot (\text{Owner} - 1)\right]\right)$$
3. **Scrap/Salvage Asymptote**: Ensures older vehicles ($\ge 15\text{ years}$, $\ge 100\text{k km}$) gracefully converge to their authentic scrap/salvage ceiling rather than producing unconstrained tree leaf artifacts.

---

## 📊 Machine Learning Performance Benchmarks

Both engines were trained, cross-validated, and benchmarked on verified, authentic Indian market listings with stratified 80/20 train-test splits:

| Engine Type | Algorithm Architecture | Training Dataset | $R^2$ Score | Mean Absolute Error (MAE) | Mean % Error (MAPE) | Residual RMSE |
|:---|:---|:---|:---:|:---:|:---:|:---:|
| 🏍️ **Two-Wheeler Engine** | **CatBoost + XGBoost Stacking** | 32,648 authentic Indian bike listings | **`0.9742` (97.4%)** | **`₹4,263`** | **`7.03%`** | **`₹14,081`** |
| 🚗 **Passenger Car Engine** | **CatBoost + XGBoost Stacking** | 8,128 authentic Indian car listings | **`0.9727` (97.3%)** | **`₹69,491`** | **`15.41%`** | **`₹129,437`** |

```mermaid
graph LR
    subgraph InputData [Raw Listings Ingestion]
        BikesCSV[Used_Bikes.csv (32k+ Listings)]
        CarsCSV[Used_Cars.csv (8k+ Listings)]
    end

    subgraph FeaturePipeline [Preprocessing & Feature Engineering]
        Clean[Outlier Removal & Bounds Extraction]
        FeatEng[Derived Features: cc, bhp, kms_per_year, log_kms]
    end

    subgraph ModelEnsemble [Dual-Engine Stacking Architecture]
        CatBoost[CatBoost Regressor: Native Categorical Encodings]
        XGBoost[XGBoost Regressor: Deep Decision Trees]
        Stacker[Weighted Ensemble: 0.6 CatBoost + 0.4 XGBoost]
    end

    subgraph InferenceOutput [Intelligent Output Gateway]
        Price[Fair Market Resale Price]
        Interval[80% Confidence Interval Band]
        Forecast[5-Year Depreciation Horizon]
        Waterfall[Value Drivers Marginal Attribution]
    end

    InputData --> FeaturePipeline
    FeaturePipeline --> ModelEnsemble
    CatBoost & XGBoost --> Stacker
    Stacker --> InferenceOutput
```

---

## 🏛️ System Architecture & Data Flow

```mermaid
graph TD
    subgraph ClientLayer [Frontend: React 19 + Tailwind + Lucide]
        ModeToggle[Navigation: Valuation • Compare • Fleet Batch]
        PresetsGrid[1-Click Market Presets]
        Sliders[Dual-Tone Electric Sliders & Dynamic Fills]
        CertModal[Official PDF Valuation Certificate]
    end

    subgraph APILayer [FastAPI Enterprise Gateway: Port 8000]
        DemoEP["GET/POST /api/v1/demo/estimate (Public Demo API)"]
        WidgetEP["GET /api/v1/demo/widget.js (Drop-in JS Widget)"]
        PredictEP["POST /predict (Enterprise Valuation & Drivers)"]
        BatchEP["POST /predict/batch (Fleet Portfolio Appraisal)"]
        ContractEP["GET /contract (Schema & Bounds)"]
        HealthEP["GET /health (Model Readiness Probe)"]
    end

    subgraph MLLayer [Machine Learning Runtime]
        BikeModel["models/best_model.joblib (97.4% R²)"]
        CarModel["models/car_model.joblib (97.3% R²)"]
        Metadata["models/*.metadata.json (OOD Clamping)"]
    end

    ClientLayer -- JSON over HTTP --> APILayer
    APILayer --> MLLayer
    MLLayer --> ClientLayer
```

---

## 📡 REST API Reference

### 1. Public Portfolio Demo (`GET /api/v1/demo/estimate`)
*No API Key required. Permissive wildcard CORS enabled.*

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/demo/estimate?vehicle_type=bike&brand=Royal%20Enfield&power=350&kms_driven=15000&age=3"
```

**Response Payload:**
```json
{
  "success": true,
  "vehicle": {
    "type": "bike",
    "brand": "Royal Enfield",
    "displacement": "350 cc",
    "odometer": "15,000 km",
    "age": "3 years",
    "ownership": "Owner 1",
    "fuel": "Petrol"
  },
  "valuation": {
    "estimated_price": 142000,
    "formatted_price": "₹1,42,000",
    "price_range": {
      "min": 124000,
      "max": 160000,
      "formatted": "₹1,24,000 - ₹1,60,000"
    },
    "currency": "INR",
    "confidence_score": "97.4%",
    "model_architecture": "CatBoost + XGBoost Stacking Ensemble"
  },
  "insights": {
    "reliability": "HIGH",
    "depreciation_status": "High Residual Value",
    "recommendation": "Optimal time to sell or trade in."
  },
  "metadata": {
    "api_version": "2026.08.15",
    "engine": "AutoValuate AI Enterprise",
    "portfolio_demo": true,
    "timestamp": "2026-08-15T01:05:00.000Z"
  }
}
```

---

### 2. Full Valuation & Waterfall Breakdown (`POST /predict`)
Generates fair market price, confidence intervals, 5-year depreciation forecast, and waterfall value drivers.

```bash
curl -X POST "http://127.0.0.1:8000/predict" \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev_12345" \
  -d '{
    "vehicle_type": "bike",
    "brand": "Royal Enfield",
    "power": 350,
    "kms_driven": 15000,
    "age": 3,
    "owner_rank": 1
  }'
```

---

### 3. Fleet & Dealership Batch Appraisal (`POST /predict/batch`)
Appraises up to 50 vehicles simultaneously with aggregated portfolio analytics.

```bash
curl -X POST "http://127.0.0.1:8000/predict/batch" \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev_12345" \
  -d '{
    "vehicles": [
      { "vehicle_type": "bike", "brand": "Royal Enfield", "power": 350, "kms_driven": 15000, "age": 3, "owner_rank": 1 },
      { "vehicle_type": "car", "brand": "Maruti", "fuel": "Petrol", "transmission": "Manual", "engine_cc": 1197, "max_power_bhp": 82, "kms_driven": 35000, "age": 4, "owner_rank": 1 }
    ]
  }'
```

---

## ⚡ Quickstart & Local Installation

### Prerequisites
* **Python**: 3.11 or higher
* **Node.js**: 20.0 or higher (`npm`)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/harshitthek/used-bike-price.git
cd used-bike-price

# Virtual environment setup
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Start Backend Inference API
```bash
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload
```
* Interactive Swagger Docs: **`http://127.0.0.1:8000/docs`**
* Health Endpoint: **`http://127.0.0.1:8000/health`**

### 3. Start Frontend Web Application
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
* Open in browser: **`http://localhost:5174`**

---

## 🐳 Docker Deployment

Run the entire application in an isolated, multi-stage production container with a single command:

```bash
docker compose up --build
```
* Access the complete full-stack platform at **`http://localhost:8000`**.

---

## 🧪 Testing & Code Quality Assurance

Our continuous integration pipeline enforces rigorous quality gates across the full stack:

```bash
# 1. Run all 26 automated Pytest unit and integration tests
pytest

# 2. Verify Black PEP-8 code formatting
black --check src tests

# 3. Run Ruff code linter
ruff check src tests

# 4. Validate Frontend Production Bundle
cd frontend && npm run build
```

---

## 📂 Repository Structure

```text
used-bike-price/
├── .github/workflows/ci.yml       # Parallel GitHub Actions CI/CD Pipeline
├── architecture/adr/              # Architecture Decision Records (ADRs 001 - 007)
├── data/                          # Authentic Datasets
│   ├── Used_Bikes.csv             # 32,000+ Indian motorcycle listings
│   └── Used_Cars.csv              # 8,000+ Indian passenger car listings
├── frontend/                      # React 19 SPA Application
│   ├── src/
│   │   ├── components/ui/         # GlassCard, NumberTicker, Sliders
│   │   ├── App.jsx                # Valuation, Compare, Fleet, Certificate & PDF UI
│   │   └── index.css              # Luxury automotive dark obsidian styles & print CSS
│   └── package.json
├── models/                        # Serialized Machine Learning Artifacts
│   ├── best_model.joblib          # Bike Stacking Model (97.4% R²)
│   ├── best_model.metadata.json   # Bike OOD bounds & feature ranges
│   ├── car_model.joblib           # Car Stacking Model (97.3% R²)
│   └── car_model.metadata.json    # Car OOD bounds & feature ranges
├── src/                           # Python Source Package
│   ├── api.py                     # FastAPI REST routes, demo endpoints, & bounds logic
│   ├── contracts.py               # Shared validation constants & brand ceilings
│   ├── models.py                  # StackingEnsembleModel class definition
│   ├── train_catboost_shap.py     # CatBoost + XGBoost training pipeline
│   ├── feature_engineering.py     # Derived automotive features
│   └── preprocessing.py           # Outlier filtering and data cleaning
├── tests/                         # Pytest Suite (26 passed tests)
│   └── test_api.py                # Valuation, demo, and boundary test cases
├── Dockerfile                     # Multi-stage production container build
├── docker-compose.yml             # Single-command container orchestration
├── PORTFOLIO_INTEGRATION.md       # Step-by-step developer integration guide
├── pyproject.toml                 # Ruff & Pytest configuration
├── requirements.txt               # Locked production dependencies
├── APPROACH.md                    # Detailed ML engineering log (Phases 1 - 18)
└── README.md                      # Project documentation
```

---

## 📄 License & Attribution

This project is open-source under the **[MIT License](LICENSE)**.

Developed with ❤️ for automotive fintech intelligence.
