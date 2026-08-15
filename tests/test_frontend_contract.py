import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_FILE = PROJECT_ROOT / "frontend" / "src" / "App.jsx"


def _read_app() -> str:
    return APP_FILE.read_text(encoding="utf-8")


def _extract_validation_bounds(src: str, field: str):
    pattern = rf"data\.{field}\s*<\s*(\d+)\s*\|\|\s*data\.{field}\s*>\s*(\d+)"
    match = re.search(pattern, src)
    assert match, f"Validation bounds for '{field}' not found in App.jsx"
    return int(match.group(1)), int(match.group(2))


USE_API_FILE = PROJECT_ROOT / "frontend" / "src" / "hooks" / "useApi.js"


def _read_use_api() -> str:
    if USE_API_FILE.exists():
        return USE_API_FILE.read_text(encoding="utf-8")
    return ""


def test_frontend_uses_api_base_url_env_var():
    src_app = _read_app()
    src_api = _read_use_api()
    assert "VITE_API_BASE_URL" in src_app or "VITE_API_BASE_URL" in src_api
