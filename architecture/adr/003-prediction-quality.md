# ADR 003: Prediction Quality Indicator

## Context
When a model processes Out-of-Distribution (OOD) clamped data, the resulting prediction is inherently less reliable than a prediction made on data perfectly matching the training distribution. The API needs a standardized way to communicate this reduction in reliability to downstream consumers (UI, analytics, or logging systems).

## Decision
We decided to introduce a `prediction_quality` dictionary into the standard response payload. 
If any data normalization (clamping) or categorical fallbacks occur during inference, the API sets `prediction_quality.level = "low"`. Otherwise, it sets it to `"high"`.

## Consequences
- **Positive**: Decouples the frontend from complex statistical logic. The UI doesn't need to calculate *why* a prediction is bad, it just reads the `level` string and updates its visual state (e.g., turning a badge from green to amber).
- **Positive**: Telemetry enrichment. By logging the `prediction_quality` alongside the request latency in our JSON logs, we can easily set up alerts if the percentage of "low" quality predictions spikes (indicating user drift or a need to retrain).
- **Negative**: "High" and "Low" are binary and coarse. Future iterations might require a continuous confidence score (e.g., 0.0 to 1.0) based on distance from the centroid, but this binary approach is sufficient for the current operational maturity.
