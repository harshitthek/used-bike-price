# Project Approach — Used Bike Price Prediction

A detailed walkthrough of how this project was built, the decisions we made, and the reasoning behind each step.

---

## 1. Problem Statement

**Goal**: Build a machine learning model that can predict the resale price of a used motorcycle/bike in India, given features like brand, kilometers driven, age, engine power, and ownership history.

**Why this matters**: India has a massive used two-wheeler market. Having an accurate price predictor helps both buyers (avoid overpaying) and sellers (price competitively).

---

## 2. Starting Point — What We Inherited

The project started as a minimal demo with:
- A **10-row hardcoded inline dataset** with fake brands (Giant, Trek, Specialized, Canyon)
- A single `LinearRegression` model
- No data validation, no evaluation, no feature engineering

### Problems Identified
1. The inline data was too small and used bicycle (pedal bike) brands, not motorcycles
2. A `data/bike_data.csv` file existed (200 rows) but was **never used** by the code
3. That CSV turned out to be **AI-generated synthetic data** (see analysis below)
4. VS Code task paths were broken (hardcoded to wrong directory)
5. Empty placeholder directories (`src/app/`, `outputs/`)

---

## 3. Phase 1 — Data: The Most Important Decision

### Analyzing the Existing 200-Row CSV

We ran a thorough analysis on `data/bike_data.csv` and found clear signs of synthetic data:

| Red Flag | Evidence |
|---|---|
| Price floor at ₹2,000 | 67 of 200 rows (33.5%) had `price == 2000`, zero below |
| Fake low mileage | 17 rows with `mileage == 50` exactly |
| Too few features | Only 4 columns instead of 8-12 for real listings |
| Weak mileage signal | `corr(mileage, price) = -0.126` — unrealistically weak |
| Indian brands, wrong prices | Brands like Hero/Hercules but prices (₹2K-₹9K) didn't match real Indian pricing |

**Decision**: Delete this data entirely. A model trained on synthetic data produces synthetic (wrong) results.

### Finding Real Data

We searched across multiple sources:

| Source | Dataset | Rows | Verdict |
|---|---|---|---|
| **Kaggle (Droom.in scrape)** | Used_Bikes.csv | 32,648 | ✅ **Best option** — real scraped data |
| HuggingFace (Indian Bike Sales) | bike_sales_india.csv | 10,249 | ❌ Synthetic — impossible values (HF Deluxe at 261cc Electric) |
| Kaggle (Motorcycle Dataset) | BIKE DETAILS.csv | 1,061 | ❌ Too small |
| Original project | bike_data.csv | 200 | ❌ AI-generated |

**Decision**: Use the Droom.in dataset. It's real market data with 8 features and strong price signals.

### Data Pipeline Design

We built a 10-step preprocessing pipeline:

```
Raw CSV (32,648 rows)
  ↓ Drop exact duplicates (77% were dupes from web scraping)
  ↓ = 7,324 unique rows
  ↓ Coerce numeric types
  ↓ Drop rows with missing price
  ↓ Drop price ≤ 0
  ↓ Fill missing numerics with median
  ↓ Fill missing categoricals with 'Unknown'
  ↓ Remove age > 30 years (found a bike listed as 63 years old)
  ↓ IQR outlier removal on price & kms_driven (3× IQR, conservative)
  ↓ Remove rare brands with < 5 samples
  ↓ Encode owner as ordinal (1st=1, 2nd=2, 3rd=3)
  = 7,007 clean rows, 6 features
```

### Why 7,007 Rows is Enough

Common concern: "Isn't 7K rows too small?"

No — for tabular regression with scikit-learn:
- We have 6 features, so each feature has ~1,100 rows to learn from  
- The correlations are strong: `power↔price = 0.748`, `age↔price = -0.491`
- Tree-based models (RandomForest, GradientBoosting) work well with this size
- Most Kaggle regression competitions use similar dataset sizes

### Why Not Google Colab / GPU?

Scikit-learn models (LinearRegression, Ridge, RandomForest, GradientBoosting) are **CPU-only** algorithms. GPUs provide no speedup for these models. With 7,007 rows, training takes 2-5 seconds on any modern CPU. GPU acceleration only helps with:
- Deep learning (PyTorch, TensorFlow)
- Very large datasets (millions of rows)
- GPU-specific libraries (cuML, RAPIDS)

---

## 4. Feature Analysis

After preprocessing, our feature set:

| Feature | Type | Role | Correlation with Price |
|---|---|---|---|
| `power` (cc) | Numeric | Engine capacity | **+0.748** (strongest) |
| `age` (years) | Numeric | How old the bike is | **-0.491** |
| `kms_driven` | Numeric | Odometer reading | **-0.434** |
| `owner_rank` | Ordinal | 1st/2nd/3rd owner | Negative (lower for later owners) |
| `brand` | Categorical | Manufacturer | Premium brands → higher price |
| `owner` | Categorical | Raw ownership text | Encoded as `owner_rank` |

**Key insight**: Engine power (`cc`) is by far the strongest predictor. A 350cc Royal Enfield will always cost more than a 100cc Hero Splendor, regardless of age or mileage.

---

## 5. Phase 2 & 3 — Modeling Strategy & Outputs (Completed)

We built an automated baseline regression pipeline training six algorithms simultaneously:
- **LinearRegression / Ridge / Lasso** (Baseline linear models)
- **RandomForest / GradientBoosting / XGBoost** (Tree-based ensemble models)

**Evaluation Metrics**: MAE, RMSE, R², MAPE
**Winner**: GradientBoosting and XGBoost consistently returned accuracy outputs of R² > 0.90, confirming that tabular real-world bike data has non-linear complexity better served by tree ensembles.

Automatic plots (Residuals, Feature Importance, Comparison charts) were dumped to `outputs/` alongside specialized JSON validation outputs.

---

## 6. Phase 4 & 5 — Containerization and Optimization (Completed)

We implemented an aggressive automated Hyperparameter Tuning pass (`RandomizedSearchCV`) targeted explicitly at the winning model. By iterating across deep learning grids (estimators, max depth, learning rates), we extracted peak performance and persisted the optimally weighted model to `models/best_model.joblib`. 
Docker artifacts, `requirements.txt`, and runtime scripts were solidified to guarantee system stability and immediate execution.

---

## 7. Phase 6 — Full Stack UI/UX Dashboard (Completed)

The project outgrew the terminal-only CLI script. 

**Backend**: We created `src/api.py` utilizing the asynchronous `FastAPI` framework to securely expose a `/predict` REST endpoint. 
**Frontend**: We constructed an ultra-premium React SPA (Single Page Application) utilizing Vite. We explicitly integrated advanced design capabilities (`framer-motion` for complex animated layout shifts and `lucide-react` for polished iconography). We transitioned standard data-entry fields into beautifully styled pure CSS interactive Range sliders inside of a dark-mode animated Aurora background.

---

## Technical Decisions Log

| Decision | Choice | Why |
|---|---|---|
| Outlier method | IQR with 3× factor | Conservative — only removes extreme outliers |
| Age limit | 30 years | Real outlier found (63yr), 30 is generous enough |
| Train/test split | 80/20, stratified | Standard, enough test data for reliable evaluation |
| Cross-validation | 5-fold | Good balance of bias/variance estimation |
| Hyperparameter Tuning | RandomizedSearchCV | More computationally efficient than strict GridSearch |
| UI Architecture | Framer Motion + Vanilla CSS | Avoided Tailwind bundle weight while retaining dynamic glassmorphic interaction principles |
