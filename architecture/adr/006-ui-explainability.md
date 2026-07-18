# ADR 006: UI Explainability and Transparency

## Context
Machine learning products often suffer from a "black box" user experience. Users input data and receive a number without any context as to how confident the system is, or if their inputs were modified. In ADR 002 and 003, we built backend mechanisms to detect OOD data, clamp it, and measure confidence. However, if the UI ignores this data, the end-user still experiences a black box.

## Decision
We decided to make the React frontend explicitly render the backend's telemetry. 
1. **Confidence Badges**: The UI parses `result.prediction_quality.level`. If low, it renders an amber pulsing warning badge.
2. **Adjustment Panels**: The UI parses the `result.adjustments` array. If data was clamped, a glassmorphic alert panel slides in below the price, explaining exactly what was changed (e.g., *Age was clamped from 45 to 15*).

## Consequences
- **Positive**: Builds immense user trust. The system admits its boundaries and explains its actions rather than pretending to be infallible.
- **Positive**: Closes the loop on the architecture. The heavy lifting done by the backend (metadata tracking, clamping) is finally surfaced to the user, maximizing the ROI on those backend features.
- **Negative**: Increases the complexity of the React state and animation logic.
