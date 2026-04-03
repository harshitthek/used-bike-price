# Used Bike Price Prediction

Predict used motorcycle/bike resale prices in India using machine learning. Built with scikit-learn on real market data scraped from [Droom.in](https://droom.in).

## Dataset

**Source**: [Used Bikes Prices in India](https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho) (via Kaggle/Droom)
- **32,648 raw listings** → **~7,000 unique clean rows** after deduplication & cleaning
- **19 brands**: Bajaj, Royal Enfield, Honda, Yamaha, KTM, Hero, TVS, Suzuki, Kawasaki, Harley-Davidson, Benelli, Ducati, Triumph, Hyosung, BMW, Jawa, Mahindra, Indian, and more
- **Features**: `bike_name`, `price`, `city`, `kms_driven`, `owner`, `age`, `power` (cc), `brand`

## Setup

1. Create and activate virtual environment (already created as `.venv`):
   ```powershell
   .venv\Scripts\Activate.ps1
   ```

2. Install dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```

3. Ensure `data/Used_Bikes.csv` exists. If not, download from [Kaggle](https://www.kaggle.com/datasets/nehalbirla/vehicle-dataset-from-cardekho).

## Project Structure

```
used-bike-price/
├── data/
│   └── Used_Bikes.csv          # Real Droom.in scraped data (32K rows)
├── models/                      # Saved trained models
├── outputs/                     # Evaluation results & plots
├── src/
│   ├── main.py                  # CLI entry point (train & predict)
│   ├── data_loader.py           # Load & validate CSV data
│   ├── preprocessing.py         # Clean, deduplicate, feature engineering
│   ├── models.py                # Model definitions (coming soon)
│   └── evaluation.py            # Metrics & visualizations (coming soon)
├── requirements.txt
├── Dockerfile
└── README.md
```

## Data Pipeline

The preprocessing pipeline (`src/preprocessing.py`) performs deduplication, type coercion, missing value handling, age filtering, IQR outlier removal, rare brand removal, and ordinal encoding.

Final clean features: `brand`, `owner`, `kms_driven`, `age`, `power`, `owner_rank` → predicting `price`

## Modeling & Tuning
The project trains six parallel models (Linear, Ridge, Lasso, RandomForest, GradientBoosting, XGBoost).
The highest performing model (typically GradientBoosting or XGBoost at R² > 90%) undergoes **automatic Hyperparameter Tuning via RandomizedSearchCV** to pinpoint the optimal learning rate, depth, and tree count before saving to `models/best_model.joblib`.

## Usage

### 1. Interactive CLI (Predict in terminal)
Run the script in predict mode. It loads the best saved model and prompts for input.
```powershell
.venv\Scripts\python.exe src/main.py --predict
```

### 2. Full Stack Web App (React + FastAPI)
We built a beautiful, glassmorphic UI to interact with the model in real time!

**Start the Backend (Terminal 1)**:
```powershell
# Activates the API on http://127.0.0.1:8000
.venv\Scripts\python.exe -m uvicorn src.api:app --reload
```

**Start the Frontend (Terminal 2)**:
```powershell
cd frontend
npm install
npm run dev
# Open the localhost URL provided in your browser!
```

### 3. Complete Retraining
To run the full data pipeline, cross-validation model comparison, and hyperparameter tuning all over again:
```powershell
.venv\Scripts\python.exe src/main.py
```

## Docker

```powershell
docker build -t used-bike-price .
docker run --rm -it used-bike-price
```
