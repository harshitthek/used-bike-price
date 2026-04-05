# Project Approach — Used Bike Price Prediction

A detailed walkthrough of how this project was built, the decisions we made, and the reasoning behind each step.

---

## 1. Problem Statement

**Goal**: Build a machine learning model that can predict the resale price of a used motorcycle in India, given features like brand, kilometers driven, age, engine power, and ownership history.

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
  ↓ Encode owner as ordinal (1st=1, 2nd=2, 3rd=3, 4th=4, 5th+=5)
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
| `owner_rank` | Ordinal | 1st..5th+ owner rank | Negative (lower for later owners) |
| `brand` | Categorical | Manufacturer | Premium brands → higher price |
| `owner` | Categorical | Raw ownership text | Encoded as `owner_rank` |

**Key insight**: Engine power (`cc`) is by far the strongest predictor. A 350cc Royal Enfield will always cost more than a 100cc Hero Splendor, regardless of age or mileage.

---

## 5. Phase 2 — Multi-Model Training & Comparison

### Why Multiple Models?

Different algorithms have different strengths:

| Model | Strength | Weakness |
|---|---|---|
| LinearRegression | Fast, interpretable | Can't capture non-linear patterns |
| Ridge / Lasso | Handles multicollinearity from one-hot encoding | Still linear |
| RandomForest | Non-linear, robust, feature importance | Can overfit with deep trees |
| GradientBoosting | Strong accuracy on tabular data | Slower to train |
| XGBoost | Optimized gradient boosting with regularization | Additional dependency |

We trained all six, evaluated via 5-fold cross-validation, then tested on a held-out 20% test set.

### Results

| Model | CV R² (mean ± std) | Test R² | Test MAE (₹) |
|---|---|---|---|
| **XGBoost** | **0.9122 ± 0.004** | **0.9109** | **₹10,213** |
| GradientBoosting | 0.9109 ± 0.003 | 0.9063 | ₹10,129 |
| RandomForest | 0.8969 ± 0.011 | 0.8875 | ₹10,563 |
| Ridge | 0.8299 ± 0.008 | 0.7960 | ₹15,417 |
| LinearRegression | 0.8299 ± 0.008 | 0.7960 | ₹15,422 |
| Lasso | 0.8299 ± 0.008 | 0.7960 | ₹15,419 |

**Takeaway**: Tree-based models (XGBoost, GradientBoosting, RandomForest) vastly outperform linear models on this dataset. The non-linear relationship between engine power, age, brand, and price is something linear models simply can't capture.

---

## 6. Phase 3 — Hyperparameter Tuning

After selecting XGBoost as the best base model, we ran `RandomizedSearchCV` to optimize its hyperparameters:

**Search space**:
- `learning_rate`: [0.01, 0.05, 0.1, 0.2]
- `max_depth`: [3, 5, 7]
- `n_estimators`: [100, 200, 300]
- `min_child_weight`: [1, 3, 5]

We tested 10 random combinations with 3-fold CV. The tuning confirmed that the default parameters were already near-optimal for this dataset size, with the final tuned model achieving R² = 0.9109 on the test set.

---

## 7. Phase 4 — Evaluation & Visualization

Three automated plots are generated during each training run:

1. **Model Comparison** (`outputs/model_comparison.png`) — Side-by-side R² and MAE bar charts for all six models
2. **Residual Analysis** (`outputs/residuals.png`) — Predicted vs. Actual scatter, residual distribution histogram, and residuals vs. predicted values
3. **Feature Importance** (`outputs/feature_importance.png`) — Shows that `power` (cc) dominates, followed by `age` and `kms_driven`

All metrics are also saved to `outputs/evaluation_results.json` for programmatic access.

---

## 8. Phase 5 — Full-Stack Web Application

The project outgrew the terminal CLI, so we added a web interface:

**Backend** (`src/api.py`):
- FastAPI with CORS middleware
- Loads `best_model.joblib` at startup
- Exposes `POST /predict` endpoint with Pydantic request validation
- Returns estimated price in INR

**Frontend** (`frontend/`):
- React app bootstrapped with Vite
- Uses `framer-motion` for entrance animations and state transitions
- Uses `lucide-react` for SVG icons
- Custom CSS range sliders for Engine Power, Age, and KMS inputs
- Dark-mode design with animated gradient orbs in the background

---

## 9. Technical Decisions Log

| Decision | Choice | Why |
|---|---|---|
| Outlier method | IQR with 3× factor | Conservative — only removes extreme outliers |
| Age limit | 30 years | Real outlier found (63yr), 30 is generous enough |
| Rare brand threshold | < 5 samples | Too few to learn from, would just add noise |
| Train/test split | 80/20 | Standard, enough test data for reliable evaluation |
| Cross-validation | 5-fold | Good balance of bias/variance estimation |
| Hyperparameter tuning | RandomizedSearchCV (10 iter, 3-fold) | Faster than exhaustive GridSearchCV on small gains |
| Owner encoding | Ordinal (1→5) | Natural ordering: 1st owner > 2nd > 3rd |
| GPU / Colab | Not needed | scikit-learn is CPU-only, 7K rows trains in seconds |
| Backend API | FastAPI, Uvicorn, Pydantic | Async, auto-generated docs, Pydantic validation |
| Frontend framework | React + Vite | Fast HMR, component-based architecture |
| UI/UX framework | Tailwind CSS v4 | Rapid styling, design systems |
| Animation | Framer Motion | High-fidelity microinteractions |

---

## 10. Phase 6 — Agentic Tooling & Next Steps

To take this from a standard SPA to a "premium, startup-tier" application, we manually injected several specialized AI Model Context Protocol (MCP) servers and skills into the IDE:

1. **21st.dev Magic**: Installed to allow the agent to fetch and build complex `Aceternity` and `MagicUI` animated React components.
2. **Context7**: Integrated to stream real-time library documentation into the agent's context window.
3. **shadcn/ui**: Configured to scaffold out standard headless accessibly components.
4. **Google Stitch**: Brought online to enhance project structure logic.
5. **UI/UX Pro Max & Anthropic frontend-design**: Local `.agent/` skills downloaded to strictly enforce anti-"AI-slop" aesthetics, ensuring deep color palettes, correct spatial layouts, and premium glassmorphism.

## 11. Phase 7 — Production Security
To transition the sandbox model into a production SaaS application, we fortified the architecture:
- **Rate Limiting**: Configured `slowapi` to impose hard limits (`10/minute` on `/predict`).
- **Endpoint Authentication**: Enforced `X-API-Key` headers via `python-dotenv`, locking out unauthorized external domain requests.
- **Pydantic ML Boundary Defense**: Upgraded models to Pydantic V2 ensuring rigid limits (e.g., maximum CC size, max engine age) before passing inputs to the sensitive XGBoost matrices.

## 12. Phase 8 — Animated UI Integration & Pytest
We executed a complete visual overhaul and testing closure:
- Initialized `shadcn/ui` over Vite and resolved compilation blockages related to Tailwind v4 execution order.
- Deployed high-end customized Aceternity-style elements utilizing `framer-motion`: A deep-blur `GlassCard` and an automated `<NumberTicker />` that physics-counts to the evaluation price.
- Engineered precise testing environments via `pytest` to assert IQR math and header validation across the pipeline.

## 13. Phase 9 — Contract Consistency Hardening
After the first full implementation pass, we added a dedicated contract hardening layer to prevent frontend/backend drift:

- Introduced `src/contracts.py` as a single source of truth for:
  - Numeric bounds (`power`, `kms_driven`, `age`)
  - Owner rank bounds (1-5)
  - Owner rank/text mappings
  - Required inference feature order
- Updated `src/api.py` to consume shared bounds and owner mapping, and to construct prediction DataFrames using explicit feature ordering.
- Updated `src/preprocessing.py` to use the same owner-label mapping used by the API.
- Updated interactive CLI prediction in `src/main.py` to support rank 1-5 and shared mapping.
- Updated frontend (`frontend/src/App.jsx`) to:
  - Use `VITE_API_BASE_URL` instead of a fixed endpoint
  - Extend owner selector to rank 5
  - Align power slider max to backend contract (2500)
  - Surface better API error messages by status code.

## 14. Current Test Status
Current automated checks are green with `9 passed` and include:

- Preprocessing rules (dedupe, age outliers, rare brands)
- Owner alias mapping to rank 5
- API auth/validation behavior
- Successful prediction response path
- Model-not-loaded failure path

## 15. Phase 10 — Runtime Readiness and UX Resilience
We then moved to operational hardening for production-like behavior:

- Added explicit readiness endpoint (`GET /ready`) in `src/api.py`, returning 503 when model artifacts are unavailable.
- Extended `GET /health` response with readiness metadata (`model_path`, `model_load_error`) for faster diagnostics.
- Strengthened prediction failure handling in `src/api.py` by logging internal exceptions and returning a stable 500 response message.
- Updated frontend `frontend/src/App.jsx` to include:
  - request timeout via `AbortController`
  - pre-submit validation against backend contract bounds
  - clearer error messaging for timeout and API failures.
- Added new API tests for readiness endpoint success/failure paths.

Current automated checks are now green with `16 passed`.

Newly covered test cases include:

- readiness metadata presence in `/health`
- accepted minimum input boundaries for prediction payloads
- enforced minimum output price floor
- internal model exception path returning stable 500 errors
- unknown owner label fallback to rank 3 during preprocessing

## 16. Phase 11 — Contract Drift Guardrails
To reduce future frontend/backend drift, we added integration guardrails in tests and configuration templates:

- Added `tests/test_frontend_contract.py` to verify that frontend contract behavior matches backend constants:
  - validation ranges for `power`, `kms_driven`, `age`, and `owner_rank`
  - owner option coverage (1 through 5)
  - engine slider min/max alignment
  - `VITE_API_BASE_URL` usage
- Added `.env.example` and `frontend/.env.example` for easier and safer local setup.
- Updated `.gitignore` exceptions to keep env templates tracked while real `.env` files remain ignored.

Current automated checks are now green with `20 passed`.

## 18. Phase 13 — Full Frontend Range Alignment
To eliminate remaining UI/backend range drift, we aligned all user input sliders with backend contract limits:

- `Vehicle Age` slider now supports 0..50
- `Odometer` slider now supports 0..999999

We also added explicit slider-bound assertions in `tests/test_frontend_contract.py` for both fields.

Current automated checks are now green with `22 passed`.

## 19. Phase 14 — API Contract Discovery and Model Metadata
To improve integration clarity and operational debugging, we extended API introspection:

- Added a new `GET /contract` endpoint that publishes:
  - canonical feature ordering
  - accepted bounds
  - owner-rank labels
- Extended `GET /health` to include optional model metadata derived from `outputs/evaluation_results.json`.

Current automated checks are now green with `23 passed`.

## 17. Phase 12 — CI Gatekeeping
To ensure future changes stay stable without relying on manual runs, we added CI automation:

- Added `.github/workflows/ci.yml` with two jobs:
  - backend checks (`pytest -q` after installing `requirements.txt`)
  - frontend checks (`npm ci` + `npm run build`)
- Triggered on both push and pull request events targeting `main`.

This gives a consistent quality gate for regression prevention in both backend and frontend paths.
