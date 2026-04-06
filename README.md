# Used Bike Price Predictor ??

## Demo
- **Frontend Application**: [Insert Vercel URL here]
- **API Endpoint**: [Insert Render URL here]

## Features
- ML-based prediction
- Real-time UI

## Tech Stack
- React, Vite
- Python, Flask/FastAPI
- Scikit-learn

## Model Details
- R� Score: 0.91
- Features: brand, year/age, kms_driven, power/engine_cc, owner

## API Usage
### POST /predict
**Request Headers:**
- x-api-key: Your API key (e.g. dev_12345)

**Request Body:**
\\\json
{
  "brand": "Royal Enfield",
  "power": 350,
  "kms_driven": 15000,
  "age": 3,
  "owner_rank": 1
}
\\\

**Response:**
\\\json
{
  "estimated_price": 125000.0,
  "currency": "INR"
}
\\\

## Installation

### 1. Backend (Python/FastAPI)
\\\powershell
# Create physical virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Start backend server
uvicorn src.api:app --reload
\\\

### 2. Frontend (React/Vite)
\\\powershell
# Open new terminal & navigate to frontend
cd frontend

# Install & start
npm install
npm run dev
\\\

## Production Deployment (Render)

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
uvicorn src.api:app --host 0.0.0.0 --port $PORT
```

## Screenshots
*(Add screenshots of your UI here)*
- ![Dashboard](./docs/screenshot1.png)

