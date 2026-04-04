import pandas as pd
from src.preprocessing import preprocess

def test_preprocess_drops_duplicates():
    # To survive rare_brands filter, we need >= 5 UNIQUE samples of a brand.
    # To test duplicates, we add 1 exact duplicate.
    base_rows = [
        {"brand": "Honda", "owner": "First Owner", "kms_driven": 1000 + i, "age": 2, "power": 100, "price": 50000}
        for i in range(10)
    ]
    df = pd.DataFrame(base_rows + [base_rows[0]]) # Add 1 duplicate

    clean_df = preprocess(df, verbose=False)
    # The duplicate should be dropped, leaving exactly 10
    assert len(clean_df) == 10

def test_preprocess_removes_age_outliers():
    # 5 valid Hondas to pass rare_brands
    valid = [
        {"brand": "Honda", "owner": "First Owner", "kms_driven": 1000 + i, "age": 2, "power": 100, "price": 50000}
        for i in range(5)
    ]
    outlier = [{"brand": "Honda", "owner": "First Owner", "kms_driven": 1000, "age": 55, "power": 100, "price": 10000}]
    
    df = pd.DataFrame(valid + outlier)
    clean_df = preprocess(df, verbose=False)
    assert clean_df["age"].max() <= 30
    assert len(clean_df) == 5

def test_preprocess_rare_brands():
    # 5 Hondas (safe), 1 RareBrand (drop)
    hondas = [
        {"brand": "Honda", "owner": "First Owner", "kms_driven": 1000 + i, "age": 2, "power": 100, "price": 50000}
        for i in range(5)
    ]
    rare = [{"brand": "RareBrand", "owner": "First Owner", "kms_driven": 1000, "age": 2, "power": 100, "price": 50000}]
    
    df = pd.DataFrame(hondas + rare)
    clean_df = preprocess(df, verbose=False)
    
    assert "RareBrand" not in clean_df["brand"].values
    assert "Honda" in clean_df["brand"].values
    assert len(clean_df) == 5

