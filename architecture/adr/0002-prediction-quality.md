# ADR 0002: Prediction Quality and OOD Detection

**Status:** Accepted

## Context
Tree-based models (like XGBoost and Random Forest) fail silently when asked to extrapolate outside their observed domain. If a model was trained entirely on motorcycles under 30 years old, passing an `age=45` vector produces mathematically arbitrary results.

Initially, our API responded by simply generating a price, providing no indication that the system was operating in the dark. Alternatively, we considered strictly enforcing `age <= 30` at the UI level, but this forces real-world users (who may actually own a 45-year-old motorcycle) to "lie" to the form just to get an estimate.

## Decision
We implemented a **transparent clamping and prediction quality** architecture:
1. The UI form remains entirely permissive, allowing real-world inputs (like 45 years, or 999,999 km).
2. The `POST /predict` endpoint routes features through a `prepare_inference_input()` function.
3. This function checks the features against `best_model.metadata.json`. If a numeric feature exceeds the training bounds, it is silently `clamped` (using `min`/`max`) to the nearest safe bound to protect the XGBoost model.
4. If clamping occurs or an unseen categorical variable is detected, the API populates an array of explicit `warnings` and downgrades the `prediction_quality.level` to `"low"`.

## Alternatives Considered
* **Rejecting OOD requests:** Returning an HTTP 422 error for OOD inputs. Rejected because it destroys the UX—users receive no value if their specific motorcycle isn't perfectly represented in the training set.
* **Silent Clamping:** Adjusting inputs internally without telling the user. Rejected because it is intellectually dishonest; the user believes they are receiving an estimate for a 45-year-old bike, but the model is pricing a 30-year-old bike.

## Tradeoffs
* **Pros:** Preserves a smooth user experience; prevents model hallucination/extrapolation; communicates explicit limitations to downstream clients.
* **Cons:** "Clamped" predictions are still inherently less accurate for extreme outliers.

## Future Revisions
* Add an explicit `adjustments` array (e.g., `{"feature": "age", "original": 45, "used": 30}`) to the response payload to make the clamping visually apparent on the frontend.
* Replace raw `min/max` bounds with robust percentiles (P1/P99) to handle noisy edge cases in the training distribution.
