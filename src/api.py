"""FastAPI backend for Used Bike Price Prediction."""
import os
from pathlib import Path

import joblib
import pandas as pd
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

load_dotenv()

# Basic Setup & Variables
API_KEY = os.getenv("API_KEY", "dev_12345")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Ensure project root is on path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"

def load_artifacts():
    global bike_model
    if not DEFAULT_MODEL_PATH.exists():
        print(f"Warning: Model not found at {DEFAULT_MODEL_PATH}. Prediction endpoints will fail.")
        return
    
    print(f"Loading model from {DEFAULT_MODEL_PATH}...")
    bike_model = joblib.load(DEFAULT_MODEL_PATH)
    print("Model loaded successfully.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield

app = FastAPI(
    title="Used Bike Price Predictor API",
    description="API for estimating the resale value of used motorcycles in India",
    version="1.0.0",
    lifespan=lifespan,
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for frontend securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for caching the model
bike_model = None

def verify_api_key(x_api_key: str = Header("None")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or Missing API Key")

class BikeFeatures(BaseModel):
    brand: str = Field(..., title="Brand", min_length=2, max_length=50, json_schema_extra={"example": "Royal Enfield"})
    power: float = Field(..., title="Engine Power (cc)", ge=50, le=2500, json_schema_extra={"example": 350})
    kms_driven: float = Field(..., title="Kilometers Driven", ge=0, le=999999, json_schema_extra={"example": 15000})
    age: float = Field(..., title="Age (Years)", ge=0, le=50, json_schema_extra={"example": 3})
    owner_rank: int = Field(..., title="Owner Rank (1, 2, 3+)", ge=1, le=5, json_schema_extra={"example": 1})

class PredictionResponse(BaseModel):
    estimated_price: float
    currency: str = "INR"

@app.get("/")
@limiter.limit("5/minute")
def read_root(request: Request):
    return {"message": "Welcome to the Used Bike Price Predictor API. Go to /docs for the swagger UI."}

@app.get("/health")
@limiter.limit("30/minute")
def health_check(request: Request):
    return {"status": "ok", "model_loaded": bike_model is not None}

@app.post("/predict", response_model=PredictionResponse, dependencies=[Depends(verify_api_key)])
@limiter.limit("10/minute")
def predict_price(request: Request, features: BikeFeatures):
    if bike_model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded. Try restarting the server or training the model.")

    # Convert numeric rank back to string for the pipeline (if it uses the raw 'owner' field)
    # The pipeline uses owner_rank natively for numeric scaling, but let's pass a synthetic 'owner' string just in case
    owner_map = {1: "First Owner", 2: "Second Owner", 3: "Third Owner", 4: "Fourth Owner", 5: "Fourth Owner Or More"}
    owner_str = owner_map.get(features.owner_rank, "First Owner")

    # Create a DataFrame for prediction
    input_df = pd.DataFrame([{
        "brand": features.brand,
        "owner": owner_str,
        "kms_driven": features.kms_driven,
        "age": features.age,
        "power": features.power,
        "owner_rank": features.owner_rank,
    }])

    try:
        prediction = bike_model.predict(input_df)[0]
        # Ensure prediction is positive
        price = max(1000.0, float(prediction))
        return PredictionResponse(estimated_price=round(price, 0))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error generating prediction: {str(e)}")

# To run:
# uvicorn src.api:app --reload
