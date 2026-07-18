# Engineering Evolution

This document tells the story of how this repository evolved from a simple Python script to a production-grade inference service. It traces the shift from asking *"How do we make this work?"* to *"What guarantees should this system actually provide?"*

---

## Version 1: The Naive Predictor
**State:** A basic FastAPI application that receives JSON payloads and runs `model.predict()`.

**The Problem:**
* **No awareness of model limitations.** If a user requested the price of a 45-year-old bike, the model silently extrapolated a price, even though it was only trained on bikes up to 30 years old.
* **Train/Serve Skew.** Safety boundaries (like `AGE_MAX = 30`) were hardcoded in the API layer and the UI. If the model was retrained on a new dataset, developers had to manually update constants everywhere.

---

## Version 2: Metadata-Driven Inference
**State:** The training pipeline was modified to extract actual numeric boundaries (e.g. true min/max of `age` in `X_train`) and save them to a `metadata.json` file.

**The Why:**
* **Eliminate duplicate knowledge.** The training process is the sole source of truth. Inference merely consumes that truth rather than duplicating it.
* **Prevent train/serve skew.** By binding runtime metadata directly to the `.joblib` artifact, the inference API automatically synchronizes with whatever data the model was actually trained on.

---

## Version 3: Out-of-Distribution (OOD) Protection
**State:** The inference API actively bounds-checks incoming requests against the `metadata.json` and clamps numeric features to the training boundaries.

**The Why:**
* **Protect the model from dangerous extrapolation.** Tree-based models (like XGBoost and Random Forest) fail silently when asked to extrapolate outside their observed domain. Clamping prevents this entirely.

---

## Version 4: Prediction Quality and Transparency
**State:** Instead of silently clamping inputs, the API was refactored to return a rich `prediction_quality` signal and explicit warnings about what variables were out of distribution.

**The Why:**
* **Communicate reliability.** Instead of pretending every prediction is equally trustworthy, the service explicitly warns downstream clients when it is operating outside its comfort zone.
* **Preserve UI flexibility.** Rather than strictly restricting the UI contract (which forces real users to lie about their 45-year-old bike), the API accepts the reality of the user's input, clamps it internally for safety, and surfaces transparent warnings to the client.

---

## Lessons Learned

1. **Context over dogma.** Decisions like whether to eager-load or lazy-load the ML model depend heavily on deployment constraints (e.g., cold starts on serverless vs. high concurrency on dedicated infrastructure) rather than abstract "best practices".
2. **Hardcoded constants eventually drift.** Runtime metadata scales better and eliminates bugs.
3. **Transparency beats hidden magic.** Surfacing adjustments and OOD warnings is vastly superior to silent fixes.
4. **Operational thinking matters.** An ML project isn't finished when `model.predict()` works. It's finished when versioning, metadata, observability, and reproducibility are explicitly accounted for.
