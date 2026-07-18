# ADR 0001: Runtime Metadata Separation

**Status:** Accepted

## Context
Our ML training pipeline filters extreme outliers (e.g. `age > 30`, extreme `price` anomalies) and identifies rare categorical values (brands with very few samples). Historically, the boundaries of this training distribution were hardcoded directly into the FastAPI service (`AGE_MAX = 30`) and the UI validation logic.

When a model was retrained on a new dataset containing different characteristics (e.g. a 35-year-old vintage bike), developers had to manually locate and update these constants across both backend Python files and frontend React files. This led to dangerous "train/serve skew" where the model's true capabilities drifted away from the API's constraints.

## Decision
We decided to decouple runtime constraints from hardcoded constants. 
1. During the execution of `src/main.py`, the training pipeline explicitly extracts the true numeric `min/max` bounds and valid categorical arrays directly from `X_train`.
2. This data is serialized to a `best_model.metadata.json` file.
3. The FastAPI inference service reads this JSON file dynamically on boot and uses it to enforce bounds for out-of-distribution (OOD) queries.

## Alternatives Considered
* **Store metadata in the evaluation results JSON:** Rejected. Evaluation artifacts (like metrics and charts) have a different lifecycle than runtime behavior metadata. Merging them forces the production server to load irrelevant analytical data.
* **OpenAPI/Swagger auto-generation:** Rejected as the sole source. OpenAPI is excellent for type safety and route contracts, but JSON schema struggles to elegantly represent dynamic, model-driven domain boundaries and complex categorical restrictions.

## Tradeoffs
* **Pros:** Eliminates train/serve skew; creates a single source of truth; API automatically synchronizes with the newly trained model without code changes.
* **Cons:** Introduces a second file (`metadata.json`) that must be deployed alongside the `.joblib` model artifact.

## Consequences
Deployment pipelines must now ensure that both `.joblib` and `.metadata.json` are packaged together. Future iterations should add a `metadata_version` and `dataset_hash` to this JSON to ensure provenance.
