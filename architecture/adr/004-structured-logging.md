# ADR 004: Structured Event Logging

## Context
Standard Python logging outputs unstructured text strings (e.g., `INFO: User requested prediction. Time taken 14ms.`). In a modern containerized environment (Docker/Kubernetes), logs are scraped by fluentd/promtail and sent to aggregators like Datadog, ELK, or Grafana Loki. Unstructured text requires complex regex parsing at the aggregator level to extract actionable metrics (like latency or feature data), which is brittle and error-prone.

## Decision
We decided to replace standard text logging with **Structured JSON Event Logging** using `python-json-logger`. Furthermore, we shifted the paradigm from "logging strings" to "emitting events". 
For example, instead of logging `Prediction successful`, we emit an event object:
```json
{
  "event": "prediction_completed",
  "latency_ms": 14,
  "prediction_quality": "high",
  "request_id": "1234-abcd"
}
```

## Consequences
- **Positive**: Logs are immediately machine-readable. Aggregators can parse the JSON natively, allowing instant dashboarding of `latency_ms` or filtering by `event == "prediction_completed"`.
- **Positive**: Strict correlation. By coupling this with `asgi-correlation-id`, every single log line tied to a specific HTTP request shares the exact same `request_id`, making debugging trivial.
- **Negative**: Logs are slightly harder for humans to read in a raw terminal, though most modern log viewers automatically pretty-print JSON.
