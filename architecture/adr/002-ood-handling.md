# ADR 002: Out-of-Distribution (OOD) Handling

## Context
End-users may submit inputs that fall far outside the distribution of the training data (e.g., submitting an Age of 45 years when the model only saw bikes up to 30 years old). 
Tree-based models (like our XGBoost and RandomForest blend) cannot mathematically extrapolate beyond the minimum and maximum values they observed during training. If given an Age of 45, the model will essentially treat it as 30, but silently. Alternatively, the API could throw a `422 Unprocessable Entity` and reject the request entirely.

## Decision
We decided to implement **API-level Data Clamping** for OOD numeric features, paired with explicit feedback. 
When an input exceeds the metadata boundaries:
1. We do *not* reject the request (unless it violates basic type/schema constraints).
2. The backend intercepts the value and clamps it to the nearest known boundary (e.g., 45 becomes 30).
3. The backend generates an `adjustments` array documenting exactly what was changed and passes this back in the HTTP response.

## Consequences
- **Positive**: Improved user experience. Users get a valuation rather than an error wall, keeping them engaged with the product.
- **Positive**: Complete transparency. The model doesn't silently ignore the extreme input; the clamping is made explicit.
- **Negative**: Requires careful documentation to ensure frontends actually render the `adjustments` array, otherwise the user might assume the model accurately evaluated a 45-year-old bike.
