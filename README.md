# Used Bike Price Predictor 🏍️

Predict the resale value of used motorcycles in India using machine learning. Trained on real market data scraped from [Droom.in](https://droom.in), achieving **R² = 0.91** with XGBoost after hyperparameter tuning.

## Results

| Model | R² (Test) | MAE (₹) | RMSE (₹) | MAPE |
|---|---|---|---|---|
| **XGBoost** | **0.9109** | **₹10,213** | ₹14,943 | 18.3% |
| GradientBoosting | 0.9063 | ₹10,129 | ₹15,326 | 18.0% |
| RandomForest | 0.8875 | ₹10,563 | ₹16,795 | 18.2% |
| LinearRegression | 0.7960 | ₹15,422 | ₹22,613 | 30.6% |
| Ridge | 0.7960 | ₹15,417 | ₹22,612 | 30.6% |
| Lasso | 0.7960 | ₹15,419 | ₹22,611 | 30.6% |

The best model (XGBoost) explains **91%** of the variance in motorcycle prices. On average, predictions are off by about ₹10,200.

## Dataset

**Source**: [Used Bikes Prices in India](https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho) (Kaggle / Droom.in scrape)
- **32,648 raw listings** → **7,007 unique clean rows** after deduplication & outlier removal
- **19 brands**: Bajaj, Royal Enfield, Honda, Yamaha, KTM, Hero, TVS, Suzuki, Kawasaki, Harley-Davidson, Benelli, Ducati, Triumph, Hyosung, BMW, Jawa, Mahindra, Indian, and more
- **Features used**: `brand`, `power` (cc), `kms_driven`, `age`, `owner`, `owner_rank`
- **Target**: `price` (₹)

## Setup

### 1. Backend (Python / FastAPI)

```powershell
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install Python dependencies
pip install -r requirements.txt

# Train the model (generates models/best_model.joblib)
.venv\Scripts\python.exe src/main.py

# Start the API server
uvicorn src.api:app --reload
```

### 2. Frontend (React / Vite)

```powershell
# Open a second terminal
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure

```
used-bike-price/
├── .github/workflows/ci.yml     # GitHub Actions CI (pytest + frontend build)
├── data/
│   └── Used_Bikes.csv            # Real Droom.in scraped data (32K rows)
├── models/
│   └── best_model.joblib         # Saved best-performing model
├── src/
│   ├── main.py                   # CLI entry point (train & predict)
│   ├── data_loader.py            # Load & validate CSV data
│   ├── preprocessing.py          # Clean, deduplicate, feature engineering
│   ├── feature_engineering.py    # Derived numeric features (kms/year, etc.)
│   ├── contracts.py              # Shared constants (bounds, feature names)
│   ├── models.py                 # 6 regression models + hyperparameter tuning
│   ├── evaluation.py             # Metrics & seaborn visualizations
│   └── api.py                    # FastAPI REST backend (secured)
├── tests/
│   ├── test_api.py               # API security & endpoint tests
│   ├── test_preprocessing.py     # Data pipeline tests
│   ├── test_feature_engineering.py
│   └── test_frontend_contract.py
├── frontend/                     # React + Vite web dashboard
│   ├── src/
│   │   ├── App.jsx               # Main UI component
│   │   ├── index.css             # Dark-mode design system
│   │   └── components/ui/        # NumberTicker, GlassCard
│   ├── components.json           # shadcn/ui config
│   └── package.json
├── render.yaml                   # Render.com backend deployment
├── vercel.json                   # Vercel frontend deployment
├── APPROACH.md                   # Detailed build narrative
├── requirements.txt
├── Dockerfile
└── README.md
```

## API Usage

### POST `/predict`

**Request Headers:**
- `x-api-key`: Your API key (default: `dev_12345` for local dev)

**Request Body:**
```json
{
  "brand": "Royal Enfield",
  "power": 350,
  "kms_driven": 15000,
  "age": 3,
  "owner_rank": 1
}
```

**Response:**
```json
{
  "estimated_price": 125000.0,
  "currency": "INR"
}
```

### Other Endpoints
- `GET /health` — Model status, metadata, and readiness
- `GET /ready` — Lightweight liveness probe for Render
- `GET /contract` — Feature bounds and accepted values

## Tech Stack

| Layer | Technology |
|---|---|
| ML Framework | scikit-learn, XGBoost |
| Data | pandas, numpy |
| Backend API | FastAPI, Uvicorn, Pydantic V2, SlowAPI |
| Frontend Core | React 19, Vite 8, shadcn/ui |
| Frontend UI/UX | Tailwind CSS v4, Framer Motion, Lucide React |
| Testing | Pytest, httpx |
| CI/CD | GitHub Actions, Render, Vercel |

## Production Security

- **Rate Limiting**: `slowapi` restricts `/predict` to 10 req/min per IP
- **Authentication**: `X-API-Key` header required on prediction endpoint
- **Input Validation**: Pydantic V2 enforces strict bounds (e.g., power 50–2500cc, age 0–50yr)
- **CORS**: Origins restricted to configured frontend URLs only

## Deployment

**Backend (Render.com):**
```bash
# Build
pip install -r requirements.txt

# Start
uvicorn src.api:app --host 0.0.0.0 --port $PORT
```

**Frontend (Vercel):**
Configured via `vercel.json` — auto-deploys from `frontend/` directory.

Set matching `API_KEY` / `VITE_API_KEY` environment variables on both hosts.
