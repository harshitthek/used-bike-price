# Used Bike Price Prediction

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

1. Create and activate virtual environment:
   ```powershell
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   ```

2. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```powershell
   cd frontend
   npm install
   ```

4. Ensure `data/Used_Bikes.csv` exists. If not, download from [Kaggle](https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho).

## Project Structure

```
used-bike-price/
├── data/
│   └── Used_Bikes.csv            # Real Droom.in scraped data (32K rows)
├── models/
│   └── best_model.joblib         # Saved best-performing model
├── outputs/
│   ├── evaluation_results.json   # All model metrics
│   ├── model_comparison.png      # R² and MAE bar charts
│   ├── feature_importance.png    # Top predictive features
│   └── residuals.png             # Residual analysis plots
├── src/
│   ├── main.py                   # CLI entry point (train & predict)
│   ├── data_loader.py            # Load & validate CSV data
│   ├── preprocessing.py          # Clean, deduplicate, feature engineering
│   ├── models.py                 # 6 regression models + hyperparameter tuning
│   ├── evaluation.py             # Metrics & seaborn visualizations
│   └── api.py                    # FastAPI REST backend
├── frontend/                     # React + Vite web dashboard
│   ├── src/
│   │   ├── App.jsx               # Main UI component
│   │   └── index.css             # Dark-mode styling
│   └── package.json
├── APPROACH.md                   # Detailed build narrative
├── requirements.txt
├── Dockerfile
└── README.md
```

## Data Pipeline

The preprocessing pipeline (`src/preprocessing.py`) performs:
1. Deduplication (removes ~25K duplicate scraped entries)
2. Type coercion (ensures numeric columns are properly typed)
3. Missing value handling (median fill for numeric, drop NaN targets)
4. Age filtering (removes entries with unreasonable age >30 years)
5. IQR outlier removal (3× IQR on price and kms_driven)
6. Rare brand removal (drops brands with <5 listings)
7. Owner ordinal encoding (1st=1, 2nd=2, 3rd=3)

**Final clean features**: `brand`, `owner`, `kms_driven`, `age`, `power`, `owner_rank` → predicting `price`

## Modeling & Tuning

The project trains six regression models in parallel (Linear, Ridge, Lasso, RandomForest, GradientBoosting, XGBoost) using scikit-learn pipelines with `OneHotEncoder` for categorical features and `StandardScaler` for numeric features.

The best model (selected by 5-fold cross-validation R²) is then fine-tuned using `RandomizedSearchCV` over a hyperparameter grid (learning rate, max depth, n_estimators, min samples/child weight). The tuned model is persisted to `models/best_model.joblib`.

## Usage

### 1. Train all models
Runs the full pipeline: load → clean → train → tune → evaluate → save.
```powershell
.venv\Scripts\python.exe src/main.py
```

### 2. Interactive CLI prediction
Loads the saved model and prompts for bike details.
```powershell
.venv\Scripts\python.exe src/main.py --predict
```

### 3. Web App (FastAPI + React)
A full-stack web interface for real-time predictions.

**Start the API server (Terminal 1)**:
```powershell
.venv\Scripts\python.exe -m uvicorn src.api:app --reload
```

**Start the frontend dev server (Terminal 2)**:
```powershell
cd frontend
npm run dev
```

Open the localhost URL printed by Vite in your browser.

## Docker

```powershell
docker build -t used-bike-price .
docker run --rm -it used-bike-price
```

## Tech Stack

| Layer | Technology |
|---|---|
| ML Framework | scikit-learn, XGBoost |
| Data | pandas, numpy |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Frontend core | React, Vite, shadcn/ui |
| Frontend UI/UX | Tailwind CSS v4, Framer Motion, Lucide React, Aceternity (MagicUI) |
| System Testing | Pytest, httpx |
| Agentic Tools | 21st.dev Magic, UI/UX Pro Max, Anthropic frontend-design, Context7, Stitch |

## Production Architecture & Security

The platform has been hardened for production deployment:
1. **Rate Limiting**: Integrated `slowapi` to restrict endpoints (e.g., 10 req/minute on inference).
2. **Authentication**: Injected `X-API-Key` headers via python-dotenv for backend protection.
3. **Data Integrity**: Pytest covers preprocessing pipeline duplication logic, IQR boundaries, and Pydantic V2 validations (e.g. max engine cc bounds).
4. **Cinematic UI**: Replaced standard React components with highly polished responsive `framer-motion` physics and glassmorphic designs built via Agentic tooling.

## Deployment

Backend configuration is optimized for `Render.com` or `Heroku` using standard Uvicorn/FastAPI paradigms. 
Frontend configuration is optimized for Vercel. 
Environment variables (`API_KEY`, `VITE_API_KEY`) must be synchronized across both hosts.
