# ADR 001: Metadata-Driven Inference

## Context
Machine learning models are trained on specific datasets with specific statistical distributions. When serving these models via an API, the API must know the boundaries of this data to validate inputs. Traditionally, engineers hardcode these boundaries (e.g., `MAX_AGE = 15`) into the API layer. However, when the model is retrained on new data (e.g., where bikes can be 20 years old), the API code becomes out of sync with the model, requiring synchronized code deployments alongside model deployments.

## Decision
We decided to adopt a **Metadata-Driven Inference** approach. During the training pipeline, statistical boundaries (min, max, valid categorical labels) are extracted and saved as a `best_model.metadata.json` file. The API layer reads this JSON file dynamically at startup alongside the `.joblib` model.

## Consequences
- **Positive**: The API code is fully decoupled from the statistical specifics of the model. Retraining the model with new data boundaries only requires replacing the two artifact files, without touching any Python backend code.
- **Positive**: Single source of truth. The boundaries enforced by the API are mathematically guaranteed to match the exact dataset the model was trained on.
- **Negative**: Adds slight complexity to the API initialization logic, requiring a robust lazy-loading strategy to read the metadata before serving the first request.
