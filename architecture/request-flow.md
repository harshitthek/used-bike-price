# Request Flow

The prediction inference path is designed to safely handle untrusted user inputs, log metadata for observability, and communicate confidence back to the user.

## Sequence Overview

The following sequence details what happens when a user submits a valuation request to the `POST /predict` endpoint.

```mermaid
sequenceDiagram
    actor User as React Client
    participant Middleware as Correlation ID Middleware
    participant API as FastAPI Router
    participant Engine as Inference Singleton
    participant Logger as JSON Logger
    
    User->>Middleware: POST /predict (Payload)
    Middleware->>Middleware: Generate req_id
    Middleware->>API: Forward Request
    
    API->>API: Pydantic Validation (Types & Ranges)
    alt Validation Failed
        API-->>User: 422 Unprocessable Entity
    end
    
    API->>Engine: predict_price(features)
    
    Engine->>Engine: _load_artifacts() (Lazy)
    alt Model Missing/Stale
        Engine-->>API: raise Exception
        API-->>User: 503 Service Unavailable
    end
    
    Engine->>Engine: Apply Data Normalization (OOD Clamping)
    
    alt Features Clamped
        Engine->>Engine: Generate Adjustments Array
        Engine->>Engine: Set Quality = Low
    else Normal Data
        Engine->>Engine: Set Quality = High
    end
    
    Engine->>Engine: XGBoost predict()
    Engine-->>API: result (price, quality, adjustments)
    
    API->>Logger: Emit 'prediction_completed' event
    Note right of Logger: logs include req_id, latency, quality
    
    API-->>Middleware: Response Payload
    Middleware-->>User: 200 OK + x-request-id Header
```

## Data Normalization (Clamping)

A critical step in the sequence is **OOD Clamping**. 

Machine learning models (especially tree-based ensembles) extrapolate unpredictably when fed inputs outside their training distribution. Rather than rejecting these requests or allowing wild extrapolations, the Inference Engine:

1. Compares the input to the min/max bounds loaded from `best_model.metadata.json`.
2. Clamps the input to the bound if it exceeds it.
3. Records the clamping in an `adjustments` array.
4. Downgrades the `prediction_quality` to `low`.

This allows the UI to degrade gracefully, explaining *why* the prediction might be less reliable, rather than simply failing or presenting a nonsensical number.
