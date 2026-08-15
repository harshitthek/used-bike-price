from src.trends import get_trends


def test_get_trends_bike_structure():
    result = get_trends("bike")
    assert result["vehicle_type"] == "bike"
    assert "available_brands" in result
    assert isinstance(result["available_brands"], list)
    assert len(result["available_brands"]) > 0
    assert "data" in result
    assert isinstance(result["data"], list)
    assert len(result["data"]) > 0


def test_get_trends_car_structure():
    result = get_trends("car")
    assert result["vehicle_type"] == "car"
    assert "available_brands" in result
    assert isinstance(result["available_brands"], list)
    assert len(result["available_brands"]) > 0
    assert "data" in result
    assert isinstance(result["data"], list)


def test_get_trends_bike_brand_filter():
    result = get_trends("bike", brand="Royal Enfield")
    assert result["brand_filter"] == "Royal Enfield"
    assert len(result["data"]) > 0
    for row in result["data"]:
        assert row["brand"].lower() == "royal enfield"
        assert "year" in row
        assert "price" in row
        assert "p25" in row
        assert "p75" in row
        assert row["price"] > 0
        assert row["p25"] <= row["price"] <= row["p75"]


def test_get_trends_car_brand_filter():
    result = get_trends("car", brand="Maruti")
    assert result["brand_filter"] == "Maruti"
    assert len(result["data"]) > 0
    for row in result["data"]:
        assert row["brand"].lower() == "maruti"
        assert "year" in row
        assert "price" in row
        assert row["p25"] <= row["price"] <= row["p75"]


def test_get_trends_case_insensitive_brand():
    res_lower = get_trends("bike", brand="ktm")
    res_upper = get_trends("bike", brand="KTM")
    assert len(res_lower["data"]) == len(res_upper["data"])


def test_get_trends_nonexistent_brand():
    result = get_trends("bike", brand="NonExistentBrand12345")
    assert result["data"] == []
    assert len(result["available_brands"]) > 0


def test_get_trends_metrics_mean_and_median():
    res_median = get_trends("bike", brand="Bajaj", metric="median")
    res_mean = get_trends("bike", brand="Bajaj", metric="mean")
    assert len(res_median["data"]) == len(res_mean["data"])
    assert res_median["metric"] == "median"
    assert res_mean["metric"] == "mean"
