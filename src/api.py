"""FastAPI backend for Used Bike Price Prediction."""
import os
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is on path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = PROJECT_ROOT / "models"
DEFAULT_MODEL_PATH = MODELS_DIR / "best_model.joblib"

app = FastAPI(
    title="Used Bike Price Predictor API",
    description="API for estimating the resale value of used motorcycles in India",
    version="1.0.0",
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend's origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for caching the model
bike_model = None

class BikeFeatures(BaseModel):
    brand: str = Field(..., title="Brand", example="Royal Enfield")
    power: float = Field(..., title="Engine Power (cc)", example=350)
    kms_driven: float = Field(..., title="Kilometers Driven", example=15000)
    age: float = Field(..., title="Age (Years)", example=3)
    owner_rank: int = Field(..., title="Owner Rank (1, 2, 3+)", ge=1, le=5, example=1)

class PredictionResponse(BaseModel):
    estimated_price: float
    currency: str = "INR"

@app.on_event("startup")
def load_artifacts():
    global bike_model
    if not DEFAULT_MODEL_PATH.exists():
        print(f"Warning: Model not found at {DEFAULT_MODEL_PATH}. Prediction endpoints will fail.")
        return
    
    print(f"Loading model from {DEFAULT_MODEL_PATH}...")
    bike_model = joblib.load(DEFAULT_MODEL_PATH)
    print("Model loaded successfully.")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Used Bike Price Predictor API. Go to /docs for the swagger UI."}

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": bike_model is not None}

@app.post("/predict", response_model=PredictionResponse)
def predict_price(features: BikeFeatures):
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
