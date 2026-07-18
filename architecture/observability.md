# Observability

This service abandons traditional unstructured string logging in favor of structured event telemetry, ensuring logs are immediately usable by log aggregators (e.g., Datadog, ELK).

## Structured JSON Logging

Instead of logging:
`INFO: Model predicted 125000 for request 1234 in 15ms`

The system emits a JSON object:
```json
{
  "timestamp": "2026-07-18T12:00:00Z",
  "level": "INFO",
  "request_id": "req-xyz123",
  "event": "prediction_completed",
  "model_version": "2026-07-18",
  "prediction_quality": "low",
  "ood_features": ["age"],
  "latency_ms": 15
}
```
This enables operational dashboards to instantly graph `latency_ms` or alert on spikes in `prediction_quality == "low"`.

## Correlation IDs

Every request is assigned a unique `X-Request-ID` via the `asgi-correlation-id` middleware.
1. The ID is injected into every log line associated with that request.
2. The ID is returned in the HTTP Response Headers.
If a user reports an issue, the exact request lifecycle can be traced through the logs using this ID.

## Health Endpoint Degradation

The `GET /health` endpoint acts as a true reflection of the application's internal state.
Instead of returning `200 OK` blindly, it evaluates the global variables.

- **Healthy**: Model and metadata successfully loaded.
- **Degraded**: The API is functioning, but the model failed to load (e.g., missing file, mismatched library version). The endpoint returns a `503 Service Unavailable` with the internal traceback safely exposed in the `model_load_error` field for rapid debugging.
