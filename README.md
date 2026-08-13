# AutoValuate AI — Used Vehicle Price Predictor (Bikes & Cars)

A production-ready Machine Learning inference service and interactive web application that predicts the resale market value of used **motorcycles** and **passenger cars** in India.

This repository implements a full-stack, end-to-end ML lifecycle: from multi-vehicle data cleaning and specialized model pipeline training to a FastAPI backend serving dual self-aware predictive models with statistical valuation confidence ranges, driven by a React 19 frontend.

---

## 🎯 Features

* **Dual-Engine ML Architecture:** Dedicated, high-accuracy XGBoost models specialized for motorcycles ($R^2 = 0.911$) and passenger cars ($R^2 = 0.920$).
* **Statistical Valuation Ranges:** Calculates 80% confidence interval price bands ($\text{Fair Price} \pm 1.28 \times \text{RMSE}$) showing Wholesale Trade-in, Fair Market, and Retail Dealer estimates.
* **1-Click Popular Market Presets:** Instant evaluation for India's top motorcycles (Royal Enfield Classic 350, KTM Duke 390, Yamaha R15) and cars (Maruti Swift, Hyundai Creta, Tata Nexon, Mahindra Thar, Toyota Fortuner).
* **Metadata-Driven Inference:** The backend prevents statistical extrapolation by tracking the exact numeric bounds (min/max) and categorical bounds of the data it was trained on.
* **Self-Aware Prediction Quality:** Explicitly returns a `prediction_quality` signal and transparent clamping warnings for out-of-distribution inputs.
* **Schema-Driven UI Constraints:** The React frontend automatically shapes itself around the API's constraints (`/contract`), eliminating drift between client and server validation logic.
* **Enterprise Observability:** Structured JSON logging with request-level correlation IDs (`X-Request-ID`) and latency tracking.

---

## 🏗️ Architecture

```mermaid
graph TD
    subgraph Frontend [React 19 Interactive Application]
        Toggle(Vehicle Mode Switcher: 🏍️ Bike | 🚗 Car)
        Presets(1-Click Market Presets)
        Form(Dynamic Form Controls & Active Slider Fills)
        Output(Valuation Price Range & Confidence Badge)
    end

    subgraph Backend [FastAPI Gateway]
        API(REST Endpoints: /contract, /predict, /health)
        Router{Vehicle Router}
        BikeEngine[Bike XGBoost Pipeline]
        CarEngine[Car XGBoost Pipeline]
    end

    subgraph Persistence [Artifacts]
        BikeJoblib(best_model.joblib)
        BikeMeta(best_model.metadata.json)
        CarJoblib(car_model.joblib)
        CarMeta(car_model.metadata.json)
    end

    Toggle --> Form
    Presets --> Form
    Form -- POST /predict --> API
    API --> Router
    Router -- vehicle_type == 'bike' --> BikeEngine
    Router -- vehicle_type == 'car' --> CarEngine
    BikeEngine -- Load --> BikeJoblib & BikeMeta
    CarEngine -- Load --> CarJoblib & CarMeta
    Router --> Output
```

### Technology Stack
* **Machine Learning:** `scikit-learn`, `xgboost`, `pandas`, `numpy`
* **Backend:** `FastAPI`, `uvicorn`, `pydantic v2`, `slowapi`, `asgi-correlation-id`
* **Frontend:** `React 19`, `Vite`, `TailwindCSS 4`, `shadcn/ui`, `framer-motion`, `lucide-react`
* **Testing:** `pytest`, `TestClient`

---

## 📁 Repository Structure

```text
used-bike-price/
├── data/                       # Datasets
│   ├── Used_Bikes.csv          # Real Indian motorcycle listings (Droom.in)
│   └── Used_Cars.csv           # Real Indian passenger car listings (CarDekho)
├── frontend/                   # React 19 SPA
│   ├── src/                    # UI Components, Presets, and App logic
│   └── package.json            # Node dependencies
├── models/                     # Compiled ML artifacts
│   ├── best_model.joblib       # Serialized Bike Pipeline (Blend Ensemble)
│   ├── best_model.metadata.json# Bike runtime bounds and metadata
│   ├── car_model.joblib        # Serialized Car Pipeline (XGBoost)
│   └── car_model.metadata.json # Car runtime bounds and metadata
├── outputs/                    # Training evaluation metrics & plots
├── src/                        # Core Python package
│   ├── api.py                  # FastAPI service routing & dual-engine endpoints
│   ├── contracts.py            # Shared validation constants for bikes & cars
│   ├── data_loader.py          # Data ingestion utilities
│   ├── evaluation.py           # Model scoring and charting
│   ├── feature_engineering.py  # Derived features (e.g. kms_per_year)
│   ├── main.py                 # CLI entry point (Bike training / predict)
│   ├── train_cars.py           # Dedicated Car model training pipeline
│   ├── models.py               # ML training pipelines and hyperparameter tuning
│   └── preprocessing.py        # Data cleaning and outlier removal
└── tests/                      # Pytest suite (19 unit & integration tests)
```

---

## 🚀 Workflows

### 1. Training Workflows
Train the motorcycle pipeline:
```bash
python src/main.py
```

Train the passenger car pipeline:
```bash
python src/train_cars.py
```

### 2. Inference Workflow
Launch the FastAPI inference server:
```bash
uvicorn src.api:app --reload
```

---

## 📡 API Endpoints

### `GET /contract?vehicle_type=bike|car`
Returns structural boundaries, accepted ranges, supported brands, fuels, transmissions, and owner labels for dynamic frontend rendering.

### `POST /predict`
Submit motorcycle or car specifications to receive an estimated price, confidence interval range, and reliability signals.

**Example Request (Motorcycle):**
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

**Example Request (Car):**
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

**Example Response:**
```json
{
  "vehicle_type": "car",
  "estimated_price": 450000.0,
  "currency": "INR",
  "price_range": {
    "min": 269100.0,
    "max": 630900.0,
    "confidence_interval": 0.8
  },
  "prediction_quality": {
    "level": "high",
    "ood_features": []
  },
  "warnings": [],
  "adjustments": []
}
```

---

## 🛠️ Installation & Local Development

### Prerequisites
* Python 3.11+
* Node.js 20+

### Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend
uvicorn src.api:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
pytest
```

---

## 📄 License
This project is open-source and available under the MIT License.
