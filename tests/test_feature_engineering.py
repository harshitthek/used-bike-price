import numpy as np
import pandas as pd
import pytest

from src.feature_engineering import DERIVED_NUMERIC_FEATURES, add_derived_features


def test_add_derived_features_generates_expected_columns_and_handles_zero_age():
    df = pd.DataFrame([
        {"kms_driven": 10000, "age": 5, "power": 200},
        {"kms_driven": 5000, "age": 0, "power": 150},
    ])

    out = add_derived_features(df)

    for col in DERIVED_NUMERIC_FEATURES:
        assert col in out.columns

    assert out.loc[0, "kms_per_year"] == 2000
    assert out.loc[0, "power_per_year"] == 40

    # age=0 uses safe denominator of 1.0
    assert out.loc[1, "kms_per_year"] == 5000
    assert out.loc[1, "power_per_year"] == 150
    assert np.isfinite(out["log_kms_driven"]).all()


def test_add_derived_features_raises_on_missing_columns():
    df = pd.DataFrame([{"kms_driven": 10000, "age": 5}])

    with pytest.raises(ValueError, match="Missing required columns"):
        add_derived_features(df)
