# Inference Pipeline

The inference pipeline governs how the FastAPI application interacts with the serialized ML model.

## Singleton and Lazy Loading

Machine learning models, especially ensembles, can be large and slow to deserialize. The application uses a thread-safe singleton pattern (`src.api._load_artifacts`) to lazy-load the model and its metadata only upon the first request or health check.

This provides two benefits:
1. **Faster Startup**: The FastAPI server binds to its port immediately, meaning orchestrators (like Kubernetes) see the container as alive instantly.
2. **Memory Efficiency**: The model is loaded into a single shared memory space, preventing multiple workers from duplicating the model footprint.

## Stateless Prediction

The prediction function is purely stateless. It takes a dictionary of features and returns a dictionary of results. No request state is held inside the inference module.

### OOD Detection
During prediction, the pipeline intercepts the input and checks it against the `best_model.metadata.json` boundaries. 
This is critical for tree-based models (like XGBoost) which cannot extrapolate beyond the min/max values they observed during training. The inference engine performs "Data Clamping" to force the values into the known distribution and annotates the returned payload with the adjustments made.
