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
