import re
from pathlib import Path

from src.contracts import (
    AGE_MAX,
    AGE_MIN,
    KMS_MAX,
    KMS_MIN,
    OWNER_RANK_MAX,
    OWNER_RANK_MIN,
    POWER_MAX,
    POWER_MIN,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_FILE = PROJECT_ROOT / "frontend" / "src" / "App.jsx"


def _read_app() -> str:
    return APP_FILE.read_text(encoding="utf-8")


def _extract_validation_bounds(src: str, field: str):
    pattern = rf"data\.{field}\s*<\s*(\d+)\s*\|\|\s*data\.{field}\s*>\s*(\d+)"
    match = re.search(pattern, src)
    assert match, f"Validation bounds for '{field}' not found in App.jsx"
    return int(match.group(1)), int(match.group(2))


def test_frontend_uses_api_base_url_env_var():
    src = _read_app()
    assert "VITE_API_BASE_URL" in src


def test_frontend_validation_bounds_match_backend_contract():
    src = _read_app()

    assert _extract_validation_bounds(src, "power") == (int(POWER_MIN), int(POWER_MAX))
    assert _extract_validation_bounds(src, "kms_driven") == (int(KMS_MIN), int(KMS_MAX))
    assert _extract_validation_bounds(src, "age") == (int(AGE_MIN), int(AGE_MAX))
    assert _extract_validation_bounds(src, "owner_rank") == (OWNER_RANK_MIN, OWNER_RANK_MAX)


def test_frontend_owner_options_cover_full_contract_range():
    src = _read_app()
    options_block = re.search(
        r"const OWNER_OPTIONS\s*=\s*\[(.*?)\]\s*\n\nconst API_BASE_URL",
        src,
        re.S,
    )
    assert options_block, "OWNER_OPTIONS block not found"

    values = sorted({int(v) for v in re.findall(r"value:\s*(\d+)", options_block.group(1))})
    expected = list(range(OWNER_RANK_MIN, OWNER_RANK_MAX + 1))
    assert values == expected


def test_frontend_engine_slider_matches_power_contract_bounds():
    src = _read_app()
    slider_match = re.search(
        r'label="Engine Power"[\s\S]*?min={(\d+)}\s*max={(\d+)}',
        src,
    )
    assert slider_match, "Engine Power slider bounds not found"

    min_val, max_val = int(slider_match.group(1)), int(slider_match.group(2))
    assert min_val == int(POWER_MIN)
    assert max_val == int(POWER_MAX)
