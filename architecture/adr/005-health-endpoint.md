# ADR 005: Degraded Health Endpoint States

## Context
The `/health` endpoint is used by container orchestrators (Docker Compose, Kubernetes) to determine if a pod should receive traffic or be restarted. A naive health check simply returns `200 OK` if the web server process is alive. However, for an ML API, the web server might be perfectly fine, but the model artifact (`.joblib`) might be missing, corrupt, or incompatible. If the health check returns `200 OK` in this state, the load balancer will route traffic to a pod that will 100% fail on every `/predict` request.

## Decision
We decided to implement a **Deep Health Check with Explicit Degradation**.
The `/health` endpoint actively inspects the global singleton state variables (`model_loaded`, `metadata_loaded`). 
- If everything is loaded: Returns `200 OK` with `status: "healthy"`.
- If the model failed to load: Returns `503 Service Unavailable` with `status: "degraded"` and injects the actual python traceback into `model_load_error`.

## Consequences
- **Positive**: Prevents black-hole routing. Orchestrators will see the `503` and stop routing user traffic to the broken container.
- **Positive**: Drastically improves incident response time. DevOps engineers curling the `/health` endpoint immediately see the exact python traceback (e.g., `No module named '_loss'`) rather than having to dig through container logs.
- **Negative**: The `/health` payload is slightly heavier, though the performance impact is negligible since it just checks boolean flags rather than executing inference.
