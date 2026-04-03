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

The preprocessing pipeline (`src/preprocessing.py`) performs:
1. **Deduplication** — removes ~25K duplicate scraped entries
2. **Type coercion** — ensures numeric columns are properly typed
3. **Missing value handling** — median fill for numeric, drop NaN targets
4. **Age filtering** — removes entries with unreasonable age (>30 years)
5. **IQR outlier removal** — removes extreme price/kms_driven outliers
6. **Rare brand removal** — drops brands with <5 listings
7. **Owner encoding** — ordinal encoding (1st=1, 2nd=2, 3rd=3)

**Final clean features**: `brand`, `owner`, `kms_driven`, `age`, `power`, `owner_rank` → predicting `price`

## VS Code

- Select the Python interpreter from the `.venv` in this workspace.
- Use Run and Debug: "Python: Run main.py" to execute the script.

## Docker

```powershell
docker build -t used-bike-price .
docker run --rm -it used-bike-price
```
